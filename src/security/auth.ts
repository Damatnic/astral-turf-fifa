/**
 * Authentication Security Module
 *
 * Provides comprehensive JWT-based authentication with secure session management,
 * password hashing, token validation, and session control.
 */

import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto-js';
import { JWT_CONFIG, PASSWORD_CONFIG, SESSION_CONFIG, ENVIRONMENT_CONFIG } from './config';
import { securityLogger } from './logging';
import type { User, UserRole } from '../types';

// Enhanced User interface with security fields
export interface SecureUser extends Omit<User, 'id'> {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;

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
    const specialCharsRegex = new RegExp(`[${PASSWORD_CONFIG.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
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
  } catch (_error) {
    securityLogger.error('Password hashing failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw new Error('Password hashing failed');
  }
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (_error) {
    securityLogger.error('Password verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

// Check if password was used before
export function isPasswordPreviouslyUsed(password: string, passwordHistory: string[]): Promise<boolean> {
  return Promise.all(
    passwordHistory.map(hash => verifyPassword(password, hash)),
  ).then(results => results.some(Boolean));
}

/**
 * JWT Token Management
 */

// Generate JWT token pair
export async function generateTokenPair(user: SecureUser, sessionId: string): Promise<TokenPair> {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId,
    iss: JWT_CONFIG.ISSUER,
    aud: JWT_CONFIG.AUDIENCE,
  };

  try {
    if (typeof TextEncoder === 'undefined') {
      throw new Error('TextEncoder not available');
    }
    const secret = new TextEncoder().encode(JWT_CONFIG.SECRET);
    const refreshSecret = new TextEncoder().encode(JWT_CONFIG.REFRESH_SECRET);

    const accessToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .setIssuer(JWT_CONFIG.ISSUER)
      .setAudience(JWT_CONFIG.AUDIENCE)
      .sign(secret);

    const refreshToken = await new jose.SignJWT({
      ...payload,
      type: 'refresh',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .setIssuer(JWT_CONFIG.ISSUER)
      .setAudience(JWT_CONFIG.AUDIENCE)
      .sign(refreshSecret);

    // Calculate expiration time in seconds
    const expiresIn = 15 * 60; // 15 minutes in seconds

    securityLogger.info('Token pair generated', {
      userId: user.id,
      sessionId,
      expiresIn,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  } catch (_error) {
    securityLogger.error('Token generation failed', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Token generation failed');
  }
}

// Verify JWT token
export async function verifyToken(token: string, isRefreshToken = false): Promise<JWTPayload | null> {
  try {
    // Check if token is blacklisted
    if (blacklistedTokens.has(token)) {
      securityLogger.warn('Attempted use of blacklisted token', { token: token.substring(0, 20) + '...' });
      return null;
    }

    if (typeof TextEncoder === 'undefined') {
      throw new Error('TextEncoder not available');
    }
    
    const secret = new TextEncoder().encode(
      isRefreshToken ? JWT_CONFIG.REFRESH_SECRET : JWT_CONFIG.SECRET
    );

    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    });

    return payload as JWTPayload;
  } catch (_error) {
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

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
  const payload = await verifyToken(refreshToken, true);
  if (!payload) {
    return null;
  }

  const user = users.get(payload.userId);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    securityLogger.warn('Invalid refresh token used', { userId: payload.userId });
    return null;
  }

  // Generate new token pair
  const newTokenPair = await generateTokenPair(user, payload.sessionId);

  // Remove old refresh token and add new one
  user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
  user.refreshTokens.push(newTokenPair.refreshToken);

  // Blacklist old refresh token
  blacklistedTokens.add(refreshToken);

  securityLogger.info('Access token refreshed', {
    userId: payload.userId,
    sessionId: payload.sessionId,
  });

  return newTokenPair;
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
export function createSession(user: SecureUser, deviceInfo: string, ipAddress: string, userAgent: string): SessionInfo {
  const sessionId = typeof crypto !== 'undefined' ? crypto.lib.WordArray.random(16).toString() : Math.random().toString(36);

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
export function recordLoginAttempt(email: string, ipAddress: string, userAgent: string, success: boolean, failureReason?: string): void {
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
  const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
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
  const windowStart = Date.now() - (15 * 60 * 1000); // 15 minutes
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

// Export types for use in services
export type {
  SecureUser,
  TokenPair,
  JWTPayload,
  SessionInfo,
  SecurityQuestion,
  LoginAttempt,
};