/**
 * Multi-Factor Authentication (MFA) Security Module
 *
 * Provides comprehensive MFA implementation with TOTP, backup codes,
 * SMS verification, and email verification for enhanced security.
 */

import CryptoJS from 'crypto-js';
import { securityLogger } from './logging';
import { generateSecureRandom, generateUUID } from './encryption';

// MFA Method types
export enum MFAMethod {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
  BACKUP_CODE = 'backup_code',
}

// MFA Challenge types
export enum MFAChallengeType {
  SETUP = 'setup',
  LOGIN = 'login',
  SENSITIVE_OPERATION = 'sensitive_operation',
  PASSWORD_CHANGE = 'password_change',
}

// TOTP Configuration
export interface TOTPConfig {
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
  issuer: string;
  accountName: string;
}

// MFA Challenge
export interface MFAChallenge {
  id: string;
  userId: string;
  method: MFAMethod;
  type: MFAChallengeType;
  code?: string; // For SMS/Email
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// MFA Verification Result
export interface MFAVerificationResult {
  success: boolean;
  method: MFAMethod;
  challengeId: string;
  remainingAttempts?: number;
  lockoutUntil?: string;
  backupCodesRemaining?: number;
}

// MFA Setup Result
export interface MFASetupResult {
  success: boolean;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  setupKey?: string;
}

// MFA Status
export interface MFAStatus {
  enabled: boolean;
  methods: MFAMethod[];
  backupCodesRemaining: number;
  lastUsed?: string;
  trusted: boolean;
}

// In-memory storage (replace with database in production)
const mfaChallenges = new Map<string, MFAChallenge>();
const trustedDevices = new Map<string, Set<string>>(); // userId -> Set of device fingerprints

/**
 * TOTP (Time-based One-Time Password) Functions
 */

// Generate TOTP secret
export function generateTOTPSecret(): string {
  return generateSecureRandom(20); // 160-bit secret
}

// Generate TOTP token
export function generateTOTP(secret: string, timestamp?: number): string {
  const time = Math.floor((timestamp || Date.now()) / 1000 / 30); // 30-second window
  const timeHex = time.toString(16).padStart(16, '0');
  const timeBytes = CryptoJS.enc.Hex.parse(timeHex);

  // HMAC-SHA1 with secret
  const hmac = CryptoJS.HmacSHA1(timeBytes, secret);
  const hmacHex = hmac.toString();

  // Dynamic truncation
  const offset = parseInt(hmacHex.slice(-1), 16);
  const code = parseInt(hmacHex.slice(offset * 2, offset * 2 + 8), 16) & 0x7fffffff;

  return (code % 1000000).toString().padStart(6, '0');
}

// Verify TOTP token
export function verifyTOTP(token: string, secret: string, windowSize: number = 1): boolean {
  const currentTime = Math.floor(Date.now() / 1000);

  // Check current window and adjacent windows for clock skew
  for (let i = -windowSize; i <= windowSize; i++) {
    const testTime = currentTime + i * 30;
    const expectedToken = generateTOTP(secret, testTime * 1000);

    if (token === expectedToken) {
      return true;
    }
  }

  return false;
}

// Generate QR code URL for TOTP setup
export function generateTOTPQRCode(
  secret: string,
  accountName: string,
  issuer: string = 'Astral Turf',
): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Backup Codes Functions
 */

// Generate backup codes
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = generateSecureRandom(4)
      .replace(/[0o1il]/gi, '') // Remove confusing characters
      .substring(0, 8)
      .toUpperCase();
    codes.push(code);
  }

  return codes;
}

// Hash backup code for storage
export function hashBackupCode(code: string): string {
  return CryptoJS.SHA256(code.toLowerCase()).toString();
}

// Verify backup code
export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const hashedInput = hashBackupCode(code);
  return hashedCodes.includes(hashedInput);
}

/**
 * MFA Challenge Management
 */

// Create MFA challenge
export function createMFAChallenge(
  userId: string,
  method: MFAMethod,
  type: MFAChallengeType,
  ipAddress: string,
  userAgent: string,
): MFAChallenge {
  const challenge: MFAChallenge = {
    id: generateUUID(),
    userId,
    method,
    type,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    attempts: 0,
    maxAttempts: 3,
    verified: false,
    ipAddress,
    userAgent,
    createdAt: new Date().toISOString(),
  };

  // Generate verification code for SMS/Email
  if (method === MFAMethod.SMS || method === MFAMethod.EMAIL) {
    challenge.code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  }

  mfaChallenges.set(challenge.id, challenge);

  securityLogger.info('MFA challenge created', {
    challengeId: challenge.id,
    userId,
    method,
    type,
    ipAddress,
  });

  return challenge;
}

// Get MFA challenge
export function getMFAChallenge(challengeId: string): MFAChallenge | null {
  const challenge = mfaChallenges.get(challengeId);

  if (!challenge) {
    return null;
  }

  // Check if challenge has expired
  if (new Date(challenge.expiresAt) < new Date()) {
    mfaChallenges.delete(challengeId);
    securityLogger.info('MFA challenge expired', { challengeId });
    return null;
  }

  return challenge;
}

// Verify MFA challenge
export function verifyMFAChallenge(
  challengeId: string,
  code: string,
  userSecret?: string,
  userBackupCodes?: string[],
): MFAVerificationResult {
  const challenge = getMFAChallenge(challengeId);

  if (!challenge) {
    securityLogger.warn('MFA verification attempted with invalid challenge', { challengeId });
    return {
      success: false,
      method: MFAMethod.TOTP,
      challengeId,
    };
  }

  // Check attempt limits
  if (challenge.attempts >= challenge.maxAttempts) {
    securityLogger.warn('MFA verification blocked - max attempts exceeded', {
      challengeId,
      userId: challenge.userId,
      attempts: challenge.attempts,
    });

    return {
      success: false,
      method: challenge.method,
      challengeId,
      lockoutUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min lockout
    };
  }

  challenge.attempts++;

  let isValid = false;
  let backupCodesRemaining: number | undefined;

  switch (challenge.method) {
    case MFAMethod.TOTP:
      if (userSecret) {
        isValid = verifyTOTP(code, userSecret);
      }
      break;

    case MFAMethod.SMS:
    case MFAMethod.EMAIL:
      isValid = challenge.code === code;
      break;

    case MFAMethod.BACKUP_CODE:
      if (userBackupCodes) {
        isValid = verifyBackupCode(code, userBackupCodes);
        if (isValid) {
          // Remove used backup code
          const hashedCode = hashBackupCode(code);
          const index = userBackupCodes.indexOf(hashedCode);
          if (index > -1) {
            userBackupCodes.splice(index, 1);
            backupCodesRemaining = userBackupCodes.length;
          }
        }
      }
      break;
  }

  if (isValid) {
    challenge.verified = true;
    mfaChallenges.delete(challengeId);

    securityLogger.info('MFA verification successful', {
      challengeId,
      userId: challenge.userId,
      method: challenge.method,
      attempts: challenge.attempts,
    });

    return {
      success: true,
      method: challenge.method,
      challengeId,
      backupCodesRemaining,
    };
  } else {
    securityLogger.warn('MFA verification failed', {
      challengeId,
      userId: challenge.userId,
      method: challenge.method,
      attempts: challenge.attempts,
      remainingAttempts: challenge.maxAttempts - challenge.attempts,
    });

    return {
      success: false,
      method: challenge.method,
      challengeId,
      remainingAttempts: challenge.maxAttempts - challenge.attempts,
    };
  }
}

/**
 * Trusted Device Management
 */

// Add trusted device
export function addTrustedDevice(userId: string, deviceFingerprint: string): void {
  if (!trustedDevices.has(userId)) {
    trustedDevices.set(userId, new Set());
  }

  trustedDevices.get(userId)!.add(deviceFingerprint);

  securityLogger.info('Device added to trusted list', {
    userId,
    deviceFingerprint: deviceFingerprint.substring(0, 8) + '...',
  });
}

// Check if device is trusted
export function isDeviceTrusted(userId: string, deviceFingerprint: string): boolean {
  const userDevices = trustedDevices.get(userId);
  return userDevices ? userDevices.has(deviceFingerprint) : false;
}

// Remove trusted device
export function removeTrustedDevice(userId: string, deviceFingerprint: string): void {
  const userDevices = trustedDevices.get(userId);
  if (userDevices) {
    userDevices.delete(deviceFingerprint);

    securityLogger.info('Device removed from trusted list', {
      userId,
      deviceFingerprint: deviceFingerprint.substring(0, 8) + '...',
    });
  }
}

// Get all trusted devices for user
export function getTrustedDevices(userId: string): string[] {
  const userDevices = trustedDevices.get(userId);
  return userDevices ? Array.from(userDevices) : [];
}

/**
 * MFA Setup and Management
 */

// Setup TOTP MFA
export function setupTOTPMFA(userId: string, accountName: string): MFASetupResult {
  try {
    const secret = generateTOTPSecret();
    const qrCodeUrl = generateTOTPQRCode(secret, accountName);
    const backupCodes = generateBackupCodes();

    securityLogger.info('TOTP MFA setup initiated', { userId, accountName });

    return {
      success: true,
      secret,
      qrCodeUrl,
      backupCodes,
      setupKey: secret, // Manual entry key
    };
  } catch (_error) {
    securityLogger.error('TOTP MFA setup failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return { success: false };
  }
}

// Verify TOTP setup
export function verifyTOTPSetup(secret: string, token: string): boolean {
  const isValid = verifyTOTP(token, secret);

  securityLogger.info('TOTP setup verification', {
    success: isValid,
    token: token.substring(0, 2) + '****',
  });

  return isValid;
}

// Get MFA status for user
export function getMFAStatus(mfaConfig: unknown): MFAStatus {
  return {
    enabled: mfaConfig?.enabled || false,
    methods: mfaConfig?.methods || [],
    backupCodesRemaining: mfaConfig?.backupCodes?.length || 0,
    lastUsed: mfaConfig?.lastUsed,
    trusted: false, // Would check device trust in real implementation
  };
}

/**
 * Risk-based MFA
 */

// Calculate risk score for login attempt
export function calculateLoginRisk(context: {
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  location?: string;
  timeOfDay: number;
}): number {
  let riskScore = 0;

  // Check if device is trusted
  if (!isDeviceTrusted(context.userId, context.deviceFingerprint)) {
    riskScore += 0.3; // New device
  }

  // Check time of day (higher risk during unusual hours)
  if (context.timeOfDay < 6 || context.timeOfDay > 22) {
    riskScore += 0.2; // Outside normal hours
  }

  // Check for suspicious patterns
  // In a real implementation, this would check:
  // - Previous login locations
  // - Login frequency patterns
  // - Known threat intelligence
  // - Velocity checks

  return Math.min(riskScore, 1.0); // Cap at 1.0
}

// Determine if MFA is required based on risk
export function requiresMFA(riskScore: number, userMFAConfig: unknown): boolean {
  // Always require MFA if enabled and risk score is above threshold
  if (userMFAConfig?.enabled) {
    return riskScore > 0.1; // Low threshold for MFA users
  }

  // Require MFA for high-risk scenarios even if not enabled
  return riskScore > 0.7;
}

/**
 * Cleanup Functions
 */

// Clean up expired challenges
export function cleanupExpiredChallenges(): void {
  const now = new Date();
  const expiredChallenges: string[] = [];

  mfaChallenges.forEach((challenge, id) => {
    if (new Date(challenge.expiresAt) < now) {
      expiredChallenges.push(id);
    }
  });

  expiredChallenges.forEach(id => {
    mfaChallenges.delete(id);
  });

  if (expiredChallenges.length > 0) {
    securityLogger.info('Expired MFA challenges cleaned up', {
      count: expiredChallenges.length,
    });
  }
}

// Start cleanup interval
setInterval(cleanupExpiredChallenges, 5 * 60 * 1000); // Every 5 minutes

// Export all MFA utilities
export const mfaUtils = {
  generateTOTPSecret,
  generateTOTP,
  verifyTOTP,
  generateTOTPQRCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  createMFAChallenge,
  getMFAChallenge,
  verifyMFAChallenge,
  setupTOTPMFA,
  verifyTOTPSetup,
  getMFAStatus,
  addTrustedDevice,
  isDeviceTrusted,
  removeTrustedDevice,
  getTrustedDevices,
  calculateLoginRisk,
  requiresMFA,
  cleanupExpiredChallenges,
};
