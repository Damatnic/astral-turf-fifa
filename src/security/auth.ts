/**
 * Authentication Security Module
 *
 * Provides comprehensive JWT-based authentication with secure session management,
 * password hashing, token validation, and session control.
 */

import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import { JWT_CONFIG, PASSWORD_CONFIG, SESSION_CONFIG, ENVIRONMENT_CONFIG } from './config';
import { securityLogger } from './logging';
import { encodeText, randomHex } from './runtime';
import type { User, UserRole } from '../types';

// Enhanced User interface with security fields
export interface SecureUser extends Omit<User, 'id'> {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;

  // Security fields
  passwordHash: string;
  passwordHistory: string[]; // Hashed previous passwords
  lastLoginAt?: string;
  lastPasswordChangeAt: string;
  accountLocked: boolean;
  lockoutUntil?: string;
  failedLoginAttempts: number;

  // Session management
  activeSessions: SessionInfo[];
  refreshTokens: string[];

  // Security preferences
  twoFactorEnabled: boolean;
  securityQuestions?: SecurityQuestion[];

  // Audit fields
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SessionInfo {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastAccessAt: string;
  isActive: boolean;
}

export interface SecurityQuestion {
  id: string;
  question: string;
  answerHash: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti?: string;
  deviceFingerprint?: string;
  permissions?: string[];
  rotationCount?: number;
  parentJti?: string;
  type?: string;
}

export interface LoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  failureReason?: string;
}

// In-memory stores (replace with database in production)
const users = new Map<string, SecureUser>();
const loginAttempts = new Map<string, LoginAttempt[]>();
const blacklistedTokens = new Set<string>();
const activeSessions = new Map<string, SessionInfo>();

const VALID_USER_ROLES: readonly UserRole[] = ['coach', 'player', 'family'];

function isValidUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && (VALID_USER_ROLES as readonly string[]).includes(role);
}

function normalizeVerifiedPayload(payload: jose.JWTPayload): JWTPayload | null {
  if (
    typeof payload.userId !== 'string' ||
    typeof payload.email !== 'string' ||
    !isValidUserRole(payload.role) ||
    typeof payload.sessionId !== 'string' ||
    typeof payload.iat !== 'number' ||
    typeof payload.exp !== 'number' ||
    typeof payload.iss !== 'string' ||
    typeof payload.aud !== 'string'
  ) {
    return null;
  }

  const normalized: JWTPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
    iat: payload.iat,
    exp: payload.exp,
    iss: payload.iss,
    aud: payload.aud,
  };

  if (typeof payload.jti === 'string') {
    normalized.jti = payload.jti;
  }

  if (typeof payload.deviceFingerprint === 'string') {
    normalized.deviceFingerprint = payload.deviceFingerprint;
  }

  if (
    Array.isArray(payload.permissions) &&
    payload.permissions.every((permission): permission is string => typeof permission === 'string')
  ) {
    normalized.permissions = payload.permissions;
  }

  if (typeof payload.rotationCount === 'number') {
    normalized.rotationCount = payload.rotationCount;
  }

  if (typeof payload.parentJti === 'string') {
    normalized.parentJti = payload.parentJti;
  }

  if (typeof payload.type === 'string') {
    normalized.type = payload.type;
  }

  return normalized;
}

/**
 * Password Security Functions
 */

// Validate password strength
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`);
  }

  if (password.length > PASSWORD_CONFIG.MAX_LENGTH) {
    errors.push(`Password must be no more than ${PASSWORD_CONFIG.MAX_LENGTH} characters long`);
  }

  if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_CONFIG.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_CONFIG.REQUIRE_SPECIAL_CHARS) {
    const specialCharsRegex = new RegExp(
      `[${PASSWORD_CONFIG.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`,
    );
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Hash password securely
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, PASSWORD_CONFIG.BCRYPT_ROUNDS);
  } catch (error) {
    securityLogger.error('Password hashing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Password hashing failed');
  }
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    securityLogger.error('Password verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// Check if password was used before
export function isPasswordPreviouslyUsed(
  password: string,
  passwordHistory: string[],
): Promise<boolean> {
  return Promise.all(passwordHistory.map(hash => verifyPassword(password, hash))).then(results =>
    results.some(Boolean),
  );
}

/**
 * JWT Token Management
 */

// Generate JWT token pair with enhanced security
export async function generateTokenPair(
  user: SecureUser,
  sessionId: string,
  options?: { rotateRefresh?: boolean },
): Promise<TokenPair> {
  const now = Math.floor(Date.now() / 1000);
  const jti = generateSecureToken(16); // Unique token ID for revocation

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId,
    jti,
    deviceFingerprint: generateDeviceFingerprint(sessionId),
    permissions: getUserPermissions(user.role),
    iss: JWT_CONFIG.ISSUER,
    aud: JWT_CONFIG.AUDIENCE,
    iat: now,
  };

  try {
    const secret = encodeText(JWT_CONFIG.SECRET);
    const refreshSecret = encodeText(JWT_CONFIG.REFRESH_SECRET);

    // Enhanced access token with security claims
    const accessToken = await new jose.SignJWT(payload)
      .setProtectedHeader({
        alg: 'HS256',
        typ: 'JWT',
        kid: 'access-key-1', // Key identifier for rotation
      })
      .setIssuedAt(now)
      .setExpirationTime(now + 15 * 60) // 15 minutes
      .setNotBefore(now) // Token not valid before now
      .setIssuer(JWT_CONFIG.ISSUER)
      .setAudience(JWT_CONFIG.AUDIENCE)
      .sign(secret);

    // Enhanced refresh token with rotation support
    const refreshJti = generateSecureToken(16);
    const refreshToken = await new jose.SignJWT({
      ...payload,
      jti: refreshJti,
      type: 'refresh',
      parentJti: options?.rotateRefresh ? payload.jti : undefined,
      rotationCount: user.refreshTokens.length + 1,
    })
      .setProtectedHeader({
        alg: 'HS256',
        typ: 'JWT',
        kid: 'refresh-key-1',
      })
      .setIssuedAt(now)
      .setExpirationTime(now + 7 * 24 * 60 * 60) // 7 days
      .setNotBefore(now)
      .setIssuer(JWT_CONFIG.ISSUER)
      .setAudience(JWT_CONFIG.AUDIENCE)
      .sign(refreshSecret);

    // Calculate expiration time in seconds
    const expiresIn = 15 * 60; // 15 minutes in seconds

    securityLogger.info('Enhanced token pair generated', {
      userId: user.id,
      sessionId,
      jti,
      refreshJti,
      expiresIn,
      rotated: options?.rotateRefresh || false,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  } catch (error) {
    securityLogger.error('Token generation failed', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Token generation failed');
  }
}

// Generate device fingerprint for additional security
function generateDeviceFingerprint(sessionId: string): string {
  const source = `${sessionId}:${Date.now()}`;
  try {
    return CryptoJS.SHA256(source).toString().substring(0, 16);
  } catch (error) {
    securityLogger.warn('Device fingerprint generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return source.substring(0, 16);
  }
}

// Get user permissions based on role
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  coach: ['read:all', 'write:players', 'write:formations', 'admin:users'],
  player: ['read:own', 'write:own'],
  family: ['read:associated', 'write:own'],
};

function getUserPermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] ?? ['read:own'];
}

// Generate secure random token
function generateSecureToken(length: number = 32): string {
  return randomHex(length);
}

// Verify JWT token
export async function verifyToken(
  token: string,
  isRefreshToken = false,
): Promise<JWTPayload | null> {
  try {
    // Check if token is blacklisted
    if (blacklistedTokens.has(token)) {
      securityLogger.warn('Attempted use of blacklisted token', {
        token: token.substring(0, 20) + '...',
      });
      return null;
    }

    const secret = encodeText(isRefreshToken ? JWT_CONFIG.REFRESH_SECRET : JWT_CONFIG.SECRET);

    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    });

    const normalized = normalizeVerifiedPayload(payload);
    if (!normalized) {
      securityLogger.error('Token payload failed validation', {
        payloadKeys: Object.keys(payload),
      });
      return null;
    }

    return normalized;
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      securityLogger.info('Token expired', { error: error.message });
    } else if (error instanceof jose.errors.JWTInvalid) {
      securityLogger.warn('Invalid token', { error: error.message });
    } else {
      securityLogger.error('Token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return null;
  }
}

// Enhanced refresh access token with automatic rotation
export async function refreshAccessToken(
  refreshToken: string,
  options?: { userAgent?: string; ipAddress?: string },
): Promise<TokenPair | null> {
  const payload = await verifyToken(refreshToken, true);
  if (!payload) {
    securityLogger.warn('Invalid refresh token during refresh', {
      token: refreshToken.substring(0, 20) + '...',
    });
    return null;
  }

  const user = users.get(payload.userId);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    securityLogger.warn('Refresh token not found in user tokens', {
      userId: payload.userId,
      tokenCount: user?.refreshTokens.length || 0,
    });
    return null;
  }

  // Security checks for refresh token
  if (!payload.jti || !payload.sessionId) {
    securityLogger.warn('Refresh token missing security claims', { userId: payload.userId });
    return null;
  }

  // Check for token replay attacks
  if (blacklistedTokens.has(refreshToken)) {
    securityLogger.warn('Attempted reuse of blacklisted refresh token', {
      userId: payload.userId,
      jti: payload.jti,
    });
    // Revoke all user tokens on potential compromise
    revokeAllUserTokens(payload.userId);
    return null;
  }

  // Verify session is still active
  const session = activeSessions.get(payload.sessionId);
  if (!session || !session.isActive) {
    securityLogger.warn('Refresh attempted with inactive session', {
      userId: payload.userId,
      sessionId: payload.sessionId,
    });
    return null;
  }

  // Security validation: Check for suspicious activity
  if (options?.ipAddress && session.ipAddress !== options.ipAddress) {
    securityLogger.warn('Refresh token used from different IP', {
      userId: payload.userId,
      originalIp: session.ipAddress,
      newIp: options.ipAddress,
    });
    // Allow but log for monitoring
  }

  // Generate new token pair with rotation
  const newTokenPair = await generateTokenPair(user, payload.sessionId, { rotateRefresh: true });

  // Implement secure token rotation
  user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
  user.refreshTokens.push(newTokenPair.refreshToken);

  // Blacklist old refresh token immediately
  blacklistedTokens.add(refreshToken);

  // Update session activity
  updateSessionActivity(payload.sessionId);

  securityLogger.info('Access token refreshed with rotation', {
    userId: payload.userId,
    sessionId: payload.sessionId,
    oldJti: payload.jti,
    rotationCount: payload.rotationCount || 1,
  });

  return newTokenPair;
}

// Revoke all tokens for a user (security breach response)
export function revokeAllUserTokens(userId: string): void {
  const user = users.get(userId);
  if (!user) {
    return;
  }

  // Blacklist all refresh tokens
  user.refreshTokens.forEach(token => {
    blacklistedTokens.add(token);
  });

  // Clear user tokens
  user.refreshTokens = [];

  // Terminate all sessions
  user.activeSessions.forEach(session => {
    if (session.isActive) {
      terminateSession(userId, session.id);
    }
  });

  securityLogger.warn('All user tokens revoked due to security concern', {
    userId,
    tokensRevoked: user.refreshTokens.length,
    sessionsTerminated: user.activeSessions.length,
  });
}

// Revoke token (logout)
export async function revokeToken(token: string): Promise<void> {
  const payload = await verifyToken(token);
  if (payload) {
    blacklistedTokens.add(token);

    // Remove from user's refresh tokens
    const user = users.get(payload.userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    }

    // Deactivate session
    const session = activeSessions.get(payload.sessionId);
    if (session) {
      session.isActive = false;
    }

    securityLogger.info('Token revoked', {
      userId: payload.userId,
      sessionId: payload.sessionId,
    });
  }
}

/**
 * Session Management
 */

// Create new session
export function createSession(
  user: SecureUser,
  deviceInfo: string,
  ipAddress: string,
  userAgent: string,
): SessionInfo {
  const sessionId = generateSecureToken(16);

  const session: SessionInfo = {
    id: sessionId,
    deviceInfo,
    ipAddress,
    userAgent,
    createdAt: new Date().toISOString(),
    lastAccessAt: new Date().toISOString(),
    isActive: true,
  };

  // Limit concurrent sessions
  if (user.activeSessions.length >= SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
    // Remove oldest session
    const oldestSession = user.activeSessions
      .filter(s => s.isActive)
      .sort((a, b) => new Date(a.lastAccessAt).getTime() - new Date(b.lastAccessAt).getTime())[0];

    if (oldestSession) {
      terminateSession(user.id, oldestSession.id);
    }
  }

  user.activeSessions.push(session);
  activeSessions.set(sessionId, session);

  securityLogger.info('Session created', {
    userId: user.id,
    sessionId,
    deviceInfo,
    ipAddress,
  });

  return session;
}

// Update session activity
export function updateSessionActivity(sessionId: string): void {
  const session = activeSessions.get(sessionId);
  if (session && session.isActive) {
    session.lastAccessAt = new Date().toISOString();
  }
}

// Terminate session
export function terminateSession(userId: string, sessionId: string): void {
  const user = users.get(userId);
  if (user) {
    user.activeSessions = user.activeSessions.map(session =>
      session.id === sessionId ? { ...session, isActive: false } : session,
    );
  }

  const session = activeSessions.get(sessionId);
  if (session) {
    session.isActive = false;
  }

  securityLogger.info('Session terminated', { userId, sessionId });
}

// Clean up expired sessions
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  const expiredSessions: string[] = [];

  activeSessions.forEach((session, sessionId) => {
    const lastAccess = new Date(session.lastAccessAt).getTime();
    if (now - lastAccess > SESSION_CONFIG.TIMEOUT) {
      session.isActive = false;
      expiredSessions.push(sessionId);
    }
  });

  if (expiredSessions.length > 0) {
    securityLogger.info('Expired sessions cleaned up', { count: expiredSessions.length });
  }
}

/**
 * Login Attempt Tracking
 */

// Record login attempt
export function recordLoginAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  failureReason?: string,
): void {
  const attempt: LoginAttempt = {
    email,
    ipAddress,
    userAgent,
    timestamp: new Date().toISOString(),
    success,
    failureReason,
  };

  const key = `${email}:${ipAddress}`;
  const attempts = loginAttempts.get(key) || [];
  attempts.push(attempt);

  // Keep only recent attempts
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
  const recentAttempts = attempts.filter(a => new Date(a.timestamp).getTime() > cutoff);

  loginAttempts.set(key, recentAttempts);

  securityLogger.info('Login attempt recorded', {
    email,
    ipAddress,
    success,
    failureReason,
  });
}

// Check if account should be locked
export function shouldLockAccount(email: string, ipAddress: string): boolean {
  const key = `${email}:${ipAddress}`;
  const attempts = loginAttempts.get(key) || [];

  // Count failed attempts in the last window
  const windowStart = Date.now() - 15 * 60 * 1000; // 15 minutes
  const recentFailures = attempts.filter(
    a => !a.success && new Date(a.timestamp).getTime() > windowStart,
  );

  return recentFailures.length >= 5; // Max 5 failed attempts
}

// Lock user account
export function lockAccount(userId: string, durationMs: number = 30 * 60 * 1000): void {
  const user = users.get(userId);
  if (user) {
    user.accountLocked = true;
    user.lockoutUntil = new Date(Date.now() + durationMs).toISOString();

    // Terminate all active sessions
    user.activeSessions.forEach(session => {
      if (session.isActive) {
        terminateSession(userId, session.id);
      }
    });

    securityLogger.warn('Account locked', {
      userId,
      lockoutUntil: user.lockoutUntil,
    });
  }
}

// Check if account is currently locked
export function isAccountLocked(user: SecureUser): boolean {
  if (!user.accountLocked) {
    return false;
  }

  if (user.lockoutUntil && new Date(user.lockoutUntil).getTime() < Date.now()) {
    // Lock expired, unlock account
    user.accountLocked = false;
    user.lockoutUntil = undefined;
    user.failedLoginAttempts = 0;
    return false;
  }

  return true;
}

// Initialize security module
export function initializeSecurity(): void {
  // Start session cleanup interval
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000); // Every 5 minutes

  securityLogger.info('Security module initialized', {
    jwtExpiration: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    sessionTimeout: SESSION_CONFIG.TIMEOUT / 1000 / 60, // in minutes
    environment: ENVIRONMENT_CONFIG.isDevelopment ? 'development' : 'production',
  });
}

// Export user management functions for migration from existing auth service
export { users };

// Multi-Factor Authentication Support
export interface MFAConfiguration {
  enabled: boolean;
  secret?: string;
  backupCodes: string[];
  lastUsed?: string;
  method: 'totp' | 'sms' | 'email';
}

// Enhanced JWT payload with security features
export interface EnhancedJWTPayload extends JWTPayload {
  jti: string; // JWT ID for revocation
  deviceFingerprint: string;
  permissions: string[];
  mfaVerified?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
}

// Token security metadata
export interface TokenSecurityInfo {
  issuedAt: number;
  expiresAt: number;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  riskScore: number;
}

// Security audit trail
export interface SecurityAuditEvent {
  id: string;
  userId: string;
  eventType: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  result: 'success' | 'failure' | 'blocked';
  metadata: Record<string, unknown>;
}

// Add MFA to SecureUser interface
export interface EnhancedSecureUser extends SecureUser {
  mfaConfig: MFAConfiguration;
  securityEvents: SecurityAuditEvent[];
  lastSecurityReview?: string;
  riskProfile: {
    score: number;
    factors: string[];
    lastAssessment: string;
  };
}
