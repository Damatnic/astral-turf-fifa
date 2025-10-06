/**
 * Multi-Factor Authentication (MFA) Security Module
 *
 * Provides comprehensive MFA implementation with TOTP, backup codes,
 * SMS verification, and email verification for enhanced security.
 */

import CryptoJS from 'crypto-js';
import { securityLogger, SecurityEventType } from './logging';
import { generateUUID } from './encryption';
import { bytesToHex, getSecureRandomBytes } from './runtime';

// MFA Method types
export enum MFAMethod {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
  BACKUP_CODE = 'backup_code',
}

const MFAMethodSet = new Set<string>(Object.values(MFAMethod));

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

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BACKUP_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function normalizeBase32(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

function bytesToBase32String(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return '';
  }

  let bits = '';
  bytes.forEach(byte => {
    bits += byte.toString(2).padStart(8, '0');
  });

  let output = '';
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5);
    const paddedChunk = chunk.padEnd(5, '0');
    const alphabetIndex = parseInt(paddedChunk, 2);
    output += BASE32_ALPHABET[alphabetIndex] ?? 'A';
  }

  while (output.length % 8 !== 0) {
    output += '=';
  }

  return output;
}

function base32ToBytes(value: string): Uint8Array {
  const normalized = normalizeBase32(value).replace(/=+$/, '');
  if (!normalized) {
    return new Uint8Array();
  }

  let bits = '';
  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    bits += index.toString(2).padStart(5, '0');
  }

  const byteCount = Math.floor(bits.length / 8);
  const bytes = new Uint8Array(byteCount);

  for (let i = 0; i < byteCount; i += 1) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }

  return bytes;
}

function parseTotpSecret(secret: string): CryptoJS.lib.WordArray {
  const normalized = normalizeBase32(secret);

  try {
    const secretBytes = base32ToBytes(normalized);
    if (secretBytes.length > 0) {
      return CryptoJS.enc.Hex.parse(bytesToHex(secretBytes));
    }
  } catch {
    // Fall back to other encodings below
  }

  if (/^[0-9a-f]+$/i.test(secret) && secret.length % 2 === 0) {
    return CryptoJS.enc.Hex.parse(secret);
  }

  return CryptoJS.enc.Utf8.parse(secret);
}

function generateNumericCode(length: number): string {
  const bytes = getSecureRandomBytes(length);
  return Array.from(bytes, byte => (byte % 10).toString()).join('');
}

function generateBackupCode(length = 8): string {
  const charsetLength = BACKUP_CODE_CHARSET.length;
  const bytes = getSecureRandomBytes(length);
  return Array.from(bytes, byte => BACKUP_CODE_CHARSET[byte % charsetLength]).join('');
}

function generateTOTPInternal(secretWordArray: CryptoJS.lib.WordArray, timestamp?: number): string {
  const time = Math.floor((timestamp || Date.now()) / 1000 / 30); // 30-second window
  const timeHex = time.toString(16).padStart(16, '0');
  const timeBytes = CryptoJS.enc.Hex.parse(timeHex);

  const hmac = CryptoJS.HmacSHA1(timeBytes, secretWordArray);
  const hmacHex = hmac.toString();

  const offset = parseInt(hmacHex.slice(-1), 16);
  const code = parseInt(hmacHex.slice(offset * 2, offset * 2 + 8), 16) & 0x7fffffff;

  return (code % 1000000).toString().padStart(6, '0');
}

/**
 * TOTP (Time-based One-Time Password) Functions
 */

// Generate TOTP secret
export function generateTOTPSecret(): string {
  const secretBytes = getSecureRandomBytes(20); // 160-bit secret
  return bytesToBase32String(secretBytes).replace(/=+$/, '');
}

// Generate TOTP token
export function generateTOTP(secret: string, timestamp?: number): string {
  const secretWordArray = parseTotpSecret(secret);
  return generateTOTPInternal(secretWordArray, timestamp);
}

// Verify TOTP token
export function verifyTOTP(token: string, secret: string, windowSize: number = 1): boolean {
  const secretWordArray = parseTotpSecret(secret);
  const baseTimestamp = Date.now();

  // Check current window and adjacent windows for clock skew
  for (let windowOffset = -windowSize; windowOffset <= windowSize; windowOffset += 1) {
    const windowTimestamp = baseTimestamp + windowOffset * 30_000;
    const expectedToken = generateTOTPInternal(secretWordArray, windowTimestamp);

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
  issuer: string = 'Astral Turf'
): string {
  const normalizedSecret = normalizeBase32(secret).replace(/=+$/, '');
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret: normalizedSecret,
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
  const codes = new Set<string>();

  while (codes.size < count) {
    codes.add(generateBackupCode());
  }

  return Array.from(codes);
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
  userAgent: string
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
    challenge.code = generateNumericCode(6);
  }

  mfaChallenges.set(challenge.id, challenge);

  securityLogger.logSecurityEvent(
    SecurityEventType.MFA_CHALLENGE_CREATED,
    'MFA challenge created',
    {
      userId,
      ipAddress,
      userAgent,
      metadata: {
        challengeId: challenge.id,
        method,
        type,
        expiresAt: challenge.expiresAt,
      },
    }
  );

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
  userBackupCodes?: string[]
): MFAVerificationResult {
  const challenge = getMFAChallenge(challengeId);

  if (!challenge) {
    securityLogger.logSecurityEvent(
      SecurityEventType.MFA_CHALLENGE_FAILED,
      'MFA verification attempted with invalid challenge',
      {
        metadata: {
          challengeId,
          reason: 'invalid_challenge',
        },
      }
    );
    return {
      success: false,
      method: MFAMethod.TOTP,
      challengeId,
    };
  }

  // Check attempt limits
  if (challenge.attempts >= challenge.maxAttempts) {
    securityLogger.logSecurityEvent(
      SecurityEventType.MFA_CHALLENGE_FAILED,
      'MFA verification blocked - max attempts exceeded',
      {
        userId: challenge.userId,
        metadata: {
          challengeId,
          reason: 'max_attempts_exceeded',
          attempts: challenge.attempts,
          maxAttempts: challenge.maxAttempts,
        },
      }
    );

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

          securityLogger.logSecurityEvent(
            SecurityEventType.MFA_BACKUP_CODE_USED,
            'MFA backup code used',
            {
              userId: challenge.userId,
              metadata: {
                challengeId,
                backupCodesRemaining,
              },
            }
          );
        }
      }
      break;
  }

  if (isValid) {
    challenge.verified = true;
    mfaChallenges.delete(challengeId);

    securityLogger.logSecurityEvent(
      SecurityEventType.MFA_CHALLENGE_VERIFIED,
      'MFA verification successful',
      {
        userId: challenge.userId,
        metadata: {
          challengeId,
          method: challenge.method,
          attempts: challenge.attempts,
          backupCodesRemaining,
        },
      }
    );

    return {
      success: true,
      method: challenge.method,
      challengeId,
      backupCodesRemaining,
    };
  } else {
    securityLogger.logSecurityEvent(
      SecurityEventType.MFA_CHALLENGE_FAILED,
      'MFA verification failed',
      {
        userId: challenge.userId,
        metadata: {
          challengeId,
          method: challenge.method,
          attempts: challenge.attempts,
          remainingAttempts: challenge.maxAttempts - challenge.attempts,
        },
      }
    );

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

    securityLogger.logSecurityEvent(
      SecurityEventType.MFA_CHALLENGE_CREATED,
      'TOTP MFA setup initiated',
      {
        userId,
        metadata: {
          accountName,
          backupCodesIssued: backupCodes.length,
        },
      }
    );

    return {
      success: true,
      secret,
      qrCodeUrl,
      backupCodes,
      setupKey: secret, // Manual entry key
    };
  } catch (error: unknown) {
    securityLogger.logSecurityEvent(
      SecurityEventType.MFA_CHALLENGE_FAILED,
      'TOTP MFA setup failed',
      {
        userId,
        metadata: {
          accountName,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    );

    return { success: false };
  }
}

// Verify TOTP setup
export function verifyTOTPSetup(secret: string, token: string): boolean {
  const isValid = verifyTOTP(token, secret);

  securityLogger.logSecurityEvent(
    isValid ? SecurityEventType.MFA_CHALLENGE_VERIFIED : SecurityEventType.MFA_CHALLENGE_FAILED,
    'TOTP setup verification',
    {
      metadata: {
        success: isValid,
        tokenPreview: token.substring(0, 2) + '****',
      },
    }
  );

  return isValid;
}

// Get MFA status for user
function isMFAMethod(value: unknown): value is MFAMethod {
  return typeof value === 'string' && MFAMethodSet.has(value);
}

function normalizeMFAConfig(config: unknown): {
  enabled?: boolean;
  methods?: MFAMethod[];
  backupCodes?: string[];
  lastUsed?: string;
} {
  if (!config || typeof config !== 'object') {
    return {};
  }

  const data = config as Record<string, unknown>;
  const normalized: {
    enabled?: boolean;
    methods?: MFAMethod[];
    backupCodes?: string[];
    lastUsed?: string;
  } = {};

  if (typeof data.enabled === 'boolean') {
    normalized.enabled = data.enabled;
  }

  if (Array.isArray(data.methods)) {
    normalized.methods = data.methods.filter(isMFAMethod);
  }

  if (typeof data.method === 'string' && isMFAMethod(data.method)) {
    normalized.methods = [...(normalized.methods ?? []), data.method];
  }

  if (Array.isArray(data.backupCodes)) {
    normalized.backupCodes = data.backupCodes.filter(
      (value): value is string => typeof value === 'string'
    );
  }

  if (typeof data.lastUsed === 'string') {
    normalized.lastUsed = data.lastUsed;
  }

  if (normalized.methods) {
    normalized.methods = Array.from(new Set(normalized.methods));
  }

  return normalized;
}

export function getMFAStatus(mfaConfig: unknown): MFAStatus {
  const normalized = normalizeMFAConfig(mfaConfig);

  return {
    enabled: normalized.enabled ?? false,
    methods: normalized.methods ?? [],
    backupCodesRemaining: normalized.backupCodes?.length ?? 0,
    lastUsed: normalized.lastUsed,
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
  const normalized = normalizeMFAConfig(userMFAConfig);

  if (normalized.enabled) {
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
