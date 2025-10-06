/**
 * Guardian Secure Session Manager
 *
 * Military-grade session management with advanced security features
 * Provides secure authentication, session handling, and threat detection
 */

import { encryptData, decryptData, DataClassification, generateSecureToken } from './encryption';
import { securityLogger } from './logging';
import type { UserRole } from '../types';

export interface SecureSession {
  sessionId: string;
  userId: string;
  userRole: UserRole;
  teamId?: string;
  createdAt: string;
  lastAccessedAt: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  isActive: boolean;
  permissions: string[];
  securityLevel: SessionSecurityLevel;
  flags: SessionFlag[];
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  loginMethod: 'password' | 'sso' | 'mfa' | 'biometric';
  mfaVerified: boolean;
  riskScore: number;
  geoLocation?: GeoLocation;
  deviceTrusted: boolean;
  concurrentSessions: number;
  lastPasswordChange?: string;
  accountLocked: boolean;
  failedAttempts: number;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
}

export enum SessionSecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum SessionFlag {
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  CONCURRENT_LOGIN = 'concurrent_login',
  NEW_DEVICE = 'new_device',
  UNUSUAL_LOCATION = 'unusual_location',
  ELEVATED_PRIVILEGES = 'elevated_privileges',
  EXPIRED_PASSWORD = 'expired_password',
  REQUIRES_MFA = 'requires_mfa',
}

export interface AuthenticationRequest {
  email: string;
  password?: string;
  mfaToken?: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  geoLocation?: GeoLocation;
  rememberDevice?: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  session?: SecureSession;
  accessToken?: string;
  refreshToken?: string;
  errors: string[];
  warnings: string[];
  requiresMFA: boolean;
  securityFlags: SessionFlag[];
  nextAction?: 'complete' | 'mfa_required' | 'password_expired' | 'account_locked';
}

export interface DeviceFingerprint {
  id: string;
  userId: string;
  fingerprint: string;
  trusted: boolean;
  firstSeen: string;
  lastSeen: string;
  deviceInfo: {
    platform: string;
    browser: string;
    version: string;
    language: string;
    timezone: string;
    screenResolution: string;
  };
}

export interface SessionValidationResult {
  valid: boolean;
  session?: SecureSession;
  errors: string[];
  requiresReauth: boolean;
  securityFlags: SessionFlag[];
}

/**
 * Guardian Secure Session Manager Class
 */
export class GuardianSecureSessionManager {
  private sessions: Map<string, SecureSession> = new Map();
  private deviceFingerprints: Map<string, DeviceFingerprint> = new Map();
  private readonly SESSION_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly REFRESH_TOKEN_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_CONCURRENT_SESSIONS = 3;
  private readonly MAX_FAILED_ATTEMPTS = 5;

  constructor() {
    // Start session cleanup interval
    setInterval(() => this.cleanupExpiredSessions(), 60000); // Check every minute
  }

  /**
   * Authenticate user and create secure session
   */
  async authenticate(request: AuthenticationRequest): Promise<AuthenticationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityFlags: SessionFlag[] = [];

    try {
      // Step 1: Validate authentication request
      if (!request.email || (!request.password && !request.mfaToken)) {
        return {
          success: false,
          errors: ['Invalid authentication request'],
          warnings: [],
          requiresMFA: false,
          securityFlags: [],
        };
      }

      // Step 2: Rate limiting check
      if (await this.isRateLimited(request.ipAddress, request.email)) {
        securityLogger.warn('Authentication rate limit exceeded', {
          email: request.email,
          ipAddress: request.ipAddress,
        });

        return {
          success: false,
          errors: ['Too many authentication attempts. Please try again later.'],
          warnings: [],
          requiresMFA: false,
          securityFlags: [SessionFlag.SUSPICIOUS_ACTIVITY],
        };
      }

      // Step 3: Device fingerprint analysis
      const deviceAnalysis = await this.analyzeDeviceFingerprint(
        request.deviceFingerprint,
        request.email
      );

      if (!deviceAnalysis.trusted) {
        securityFlags.push(SessionFlag.NEW_DEVICE);
        warnings.push('Login from new device detected');
      }

      // Step 4: Geolocation analysis
      const geoAnalysis = await this.analyzeGeolocation(request.geoLocation, request.email);
      if (geoAnalysis.suspicious) {
        securityFlags.push(SessionFlag.UNUSUAL_LOCATION);
        warnings.push('Login from unusual location detected');
      }

      // Step 5: Validate credentials (simplified - would integrate with actual auth service)
      const user = await this.validateCredentials(request.email, request.password);
      if (!user) {
        await this.recordFailedAttempt(request.email, request.ipAddress);
        return {
          success: false,
          errors: ['Invalid credentials'],
          warnings: [],
          requiresMFA: false,
          securityFlags: [SessionFlag.SUSPICIOUS_ACTIVITY],
        };
      }

      // Step 6: Check if MFA is required
      const requiresMFA = this.shouldRequireMFA(user, securityFlags, request);
      if (requiresMFA && !request.mfaToken) {
        return {
          success: false,
          errors: [],
          warnings: [],
          requiresMFA: true,
          securityFlags,
          nextAction: 'mfa_required',
        };
      }

      // Step 7: Validate MFA if provided
      if (request.mfaToken) {
        const mfaValid = await this.validateMFA(user.id, request.mfaToken);
        if (!mfaValid) {
          return {
            success: false,
            errors: ['Invalid MFA token'],
            warnings: [],
            requiresMFA: true,
            securityFlags,
          };
        }
      }

      // Step 8: Check for concurrent sessions
      const activeSessions = this.getActiveSessionsForUser(user.id);
      if (activeSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
        securityFlags.push(SessionFlag.CONCURRENT_LOGIN);
        // Terminate oldest session
        await this.terminateSession(activeSessions[0].sessionId);
        warnings.push('Previous session terminated due to concurrent login limit');
      }

      // Step 9: Calculate security level and risk score
      const securityLevel = this.calculateSecurityLevel(securityFlags, user);
      const riskScore = this.calculateRiskScore(request, securityFlags, user);

      // Step 10: Create secure session
      const session = await this.createSession(
        user,
        request,
        securityLevel,
        riskScore,
        securityFlags
      );

      // Step 11: Generate tokens
      const tokens = await this.generateTokens(session);

      // Step 12: Update device fingerprint
      await this.updateDeviceFingerprint(request.deviceFingerprint, user.id, request);

      // Step 13: Log successful authentication
      securityLogger.logSecurityEvent('USER_LOGIN' as any, 'User authenticated successfully', {
        userId: user.id,
        metadata: {
          sessionId: session.sessionId,
          ipAddress: request.ipAddress,
          securityLevel: session.securityLevel,
          riskScore: session.metadata.riskScore,
          mfaUsed: !!request.mfaToken,
          deviceTrusted: deviceAnalysis.trusted,
        },
      });

      return {
        success: true,
        session,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        errors: [],
        warnings,
        requiresMFA: false,
        securityFlags,
        nextAction: 'complete',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      securityLogger.error('Authentication error', {
        error: errorMessage,
        email: request.email,
        ipAddress: request.ipAddress,
      });

      return {
        success: false,
        errors: [errorMessage],
        warnings: [],
        requiresMFA: false,
        securityFlags: [SessionFlag.SUSPICIOUS_ACTIVITY],
      };
    }
  }

  /**
   * Validate existing session
   */
  async validateSession(sessionId: string, ipAddress: string): Promise<SessionValidationResult> {
    const errors: string[] = [];
    const securityFlags: SessionFlag[] = [];

    try {
      const session = this.sessions.get(sessionId);

      if (!session) {
        return {
          valid: false,
          errors: ['Session not found'],
          requiresReauth: true,
          securityFlags: [],
        };
      }

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.terminateSession(sessionId);
        return {
          valid: false,
          errors: ['Session expired'],
          requiresReauth: true,
          securityFlags: [],
        };
      }

      // Check if session is active
      if (!session.isActive) {
        return {
          valid: false,
          errors: ['Session is inactive'],
          requiresReauth: true,
          securityFlags: [],
        };
      }

      // Check IP address consistency (basic check)
      if (session.ipAddress !== ipAddress) {
        securityFlags.push(SessionFlag.SUSPICIOUS_ACTIVITY);
        securityLogger.warn('Session IP address mismatch', {
          sessionId,
          originalIP: session.ipAddress,
          currentIP: ipAddress,
          userId: session.userId,
        });
      }

      // Update last accessed time
      session.lastAccessedAt = new Date().toISOString();

      // Extend session if needed
      const timeUntilExpiry = new Date(session.expiresAt).getTime() - Date.now();
      if (timeUntilExpiry < this.SESSION_DURATION / 2) {
        session.expiresAt = new Date(Date.now() + this.SESSION_DURATION).toISOString();
      }

      return {
        valid: true,
        session,
        errors: [],
        requiresReauth: false,
        securityFlags,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session validation failed';
      securityLogger.error('Session validation error', {
        error: errorMessage,
        sessionId,
        ipAddress,
      });

      return {
        valid: false,
        errors: [errorMessage],
        requiresReauth: true,
        securityFlags: [SessionFlag.SUSPICIOUS_ACTIVITY],
      };
    }
  }

  /**
   * Terminate session
   */
  async terminateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);

      securityLogger.logSecurityEvent('USER_LOGOUT' as any, 'Session terminated', {
        userId: session.userId,
        metadata: {
          sessionId,
          terminatedAt: new Date().toISOString(),
          sessionDuration: Date.now() - new Date(session.createdAt).getTime(),
        },
      });
    }
  }

  /**
   * Terminate all sessions for user
   */
  async terminateAllUserSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.sessions.values()).filter(
      session => session.userId === userId
    );

    for (const session of userSessions) {
      await this.terminateSession(session.sessionId);
    }

    securityLogger.logSecurityEvent('SECURITY_ACTION' as any, 'All user sessions terminated', {
      userId,
      metadata: {
        sessionsTerminated: userSessions.length,
        terminatedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Get active sessions for user
   */
  private getActiveSessionsForUser(userId: string): SecureSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && session.isActive)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Create new session
   */
  private async createSession(
    user: any,
    request: AuthenticationRequest,
    securityLevel: SessionSecurityLevel,
    riskScore: number,
    flags: SessionFlag[]
  ): Promise<SecureSession> {
    const sessionId = generateSecureToken(32);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_DURATION);

    const session: SecureSession = {
      sessionId,
      userId: user.id,
      userRole: user.role,
      teamId: user.teamId,
      createdAt: now.toISOString(),
      lastAccessedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      deviceFingerprint: request.deviceFingerprint,
      isActive: true,
      permissions: user.permissions || [],
      securityLevel,
      flags,
      metadata: {
        loginMethod: request.mfaToken ? 'mfa' : 'password',
        mfaVerified: !!request.mfaToken,
        riskScore,
        geoLocation: request.geoLocation,
        deviceTrusted: await this.isDeviceTrusted(request.deviceFingerprint, user.id),
        concurrentSessions: this.getActiveSessionsForUser(user.id).length,
        accountLocked: false,
        failedAttempts: 0,
      },
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(session: SecureSession): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const tokenPayload = {
      sessionId: session.sessionId,
      userId: session.userId,
      userRole: session.userRole,
      permissions: session.permissions,
      issuedAt: Date.now(),
      expiresAt: new Date(session.expiresAt).getTime(),
    };

    const accessToken = encryptData(JSON.stringify(tokenPayload), DataClassification.CONFIDENTIAL);

    const refreshTokenPayload = {
      sessionId: session.sessionId,
      userId: session.userId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + this.REFRESH_TOKEN_DURATION,
    };

    const refreshToken = encryptData(
      JSON.stringify(refreshTokenPayload),
      DataClassification.RESTRICTED
    );

    return {
      accessToken: JSON.stringify(accessToken),
      refreshToken: JSON.stringify(refreshToken),
    };
  }

  /**
   * Calculate security level based on flags and user
   */
  private calculateSecurityLevel(flags: SessionFlag[], user: any): SessionSecurityLevel {
    if (flags.includes(SessionFlag.SUSPICIOUS_ACTIVITY)) {
      return SessionSecurityLevel.CRITICAL;
    }

    if (flags.includes(SessionFlag.NEW_DEVICE) || flags.includes(SessionFlag.UNUSUAL_LOCATION)) {
      return SessionSecurityLevel.HIGH;
    }

    if (flags.includes(SessionFlag.CONCURRENT_LOGIN) || user.role === 'coach') {
      return SessionSecurityLevel.MEDIUM;
    }

    return SessionSecurityLevel.LOW;
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(
    request: AuthenticationRequest,
    flags: SessionFlag[],
    user: any
  ): number {
    let score = 0;

    // Base score
    score += 0.1;

    // Flag-based scoring
    flags.forEach(flag => {
      switch (flag) {
        case SessionFlag.SUSPICIOUS_ACTIVITY:
          score += 0.5;
          break;
        case SessionFlag.NEW_DEVICE:
          score += 0.3;
          break;
        case SessionFlag.UNUSUAL_LOCATION:
          score += 0.2;
          break;
        case SessionFlag.CONCURRENT_LOGIN:
          score += 0.1;
          break;
      }
    });

    // Time-based scoring
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 0.1; // Outside business hours
    }

    return Math.min(score, 1.0);
  }

  /**
   * Analyze device fingerprint
   */
  private async analyzeDeviceFingerprint(
    fingerprint: string,
    email: string
  ): Promise<{ trusted: boolean; isNew: boolean }> {
    const existing = this.deviceFingerprints.get(fingerprint);

    if (!existing) {
      return { trusted: false, isNew: true };
    }

    return {
      trusted: existing.trusted,
      isNew: false,
    };
  }

  /**
   * Analyze geolocation
   */
  private async analyzeGeolocation(
    location: GeoLocation | undefined,
    email: string
  ): Promise<{ suspicious: boolean; reason?: string }> {
    if (!location) {
      return { suspicious: false };
    }

    // Simplified location analysis
    // In production, this would check against user's typical locations
    return { suspicious: false };
  }

  /**
   * Validate credentials (simplified)
   */
  private async validateCredentials(email: string, password?: string): Promise<any | null> {
    // This would integrate with your actual authentication service
    // For demo purposes, return a mock user
    if (email && password) {
      return {
        id: 'user-123',
        email,
        role: 'coach',
        teamId: 'team-456',
        permissions: ['VIEW_FORMATIONS', 'EDIT_FORMATIONS'],
      };
    }
    return null;
  }

  /**
   * Check if MFA should be required
   */
  private shouldRequireMFA(
    user: any,
    flags: SessionFlag[],
    request: AuthenticationRequest
  ): boolean {
    // Require MFA for suspicious activities or high-privilege users
    return (
      flags.includes(SessionFlag.SUSPICIOUS_ACTIVITY) ||
      flags.includes(SessionFlag.NEW_DEVICE) ||
      user.role === 'coach'
    );
  }

  /**
   * Validate MFA token (simplified)
   */
  private async validateMFA(userId: string, token: string): Promise<boolean> {
    // This would integrate with your MFA service
    // For demo purposes, accept any 6-digit token
    return /^\d{6}$/.test(token);
  }

  /**
   * Check if device is trusted
   */
  private async isDeviceTrusted(fingerprint: string, userId: string): Promise<boolean> {
    const device = this.deviceFingerprints.get(fingerprint);
    return device?.trusted || false;
  }

  /**
   * Update device fingerprint
   */
  private async updateDeviceFingerprint(
    fingerprint: string,
    userId: string,
    request: AuthenticationRequest
  ): Promise<void> {
    const existing = this.deviceFingerprints.get(fingerprint);

    if (existing) {
      existing.lastSeen = new Date().toISOString();
    } else {
      this.deviceFingerprints.set(fingerprint, {
        id: generateSecureToken(16),
        userId,
        fingerprint,
        trusted: false, // New devices start as untrusted
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        deviceInfo: {
          platform: 'unknown',
          browser: 'unknown',
          version: 'unknown',
          language: 'unknown',
          timezone: 'unknown',
          screenResolution: 'unknown',
        },
      });
    }
  }

  /**
   * Rate limiting check
   */
  private async isRateLimited(ipAddress: string, email: string): Promise<boolean> {
    // Simplified rate limiting - would use Redis or similar in production
    return false;
  }

  /**
   * Record failed authentication attempt
   */
  private async recordFailedAttempt(email: string, ipAddress: string): Promise<void> {
    securityLogger.warn('Failed authentication attempt', {
      email,
      ipAddress,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt).getTime() < now) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      securityLogger.info('Cleanup expired sessions', {
        count: expiredSessions.length,
        sessionIds: expiredSessions,
      });
    }
  }
}

// Export singleton instance
export const guardianSecureSessionManager = new GuardianSecureSessionManager();

export default guardianSecureSessionManager;
