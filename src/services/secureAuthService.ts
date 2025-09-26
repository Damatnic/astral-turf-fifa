/**
 * Secure Authentication Service
 *
 * Enterprise-grade authentication service with JWT tokens, secure session management,
 * comprehensive security monitoring, and integration with all security modules.
 */

import {
  SecureUser,
  TokenPair,
  JWTPayload,
  generateTokenPair,
  verifyToken,
  refreshAccessToken,
  revokeToken,
  createSession,
  updateSessionActivity,
  terminateSession,
  recordLoginAttempt,
  shouldLockAccount,
  lockAccount,
  isAccountLocked,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  isPasswordPreviouslyUsed,
  users,
  initializeSecurity,
} from '../security/auth';

import { validateInput, validationSchemas } from '../security/validation';
import { sanitizeUserInput } from '../security/sanitization';
import { hasPermission, Permission, Resource, PermissionContext } from '../security/rbac';
import { securityLogger, SecurityEventType } from '../security/logging';
import { monitorSecurityEvent, checkRateLimit } from '../security/monitoring';
import { generateUUID } from '../security/encryption';

import type { User, UserRole } from '../types';
import { DEMO_USERS } from '../constants';

// Enhanced signup data with security validation
export interface SecureSignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  emergencyContact?: string;
  // Additional security fields
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  marketingConsent?: boolean;
  // Family member specific
  playerId?: string;
  playerName?: string;
  relationship?: string;
}

// Login response with security information
export interface SecureLoginResponse {
  user: User;
  tokens: TokenPair;
  sessionInfo: {
    sessionId: string;
    expiresAt: string;
    deviceInfo: string;
  };
  securityNotices?: string[];
}

// Login context for security monitoring
export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  timestamp: string;
}

// Password change data
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Secure Authentication Service Implementation
 */
class SecureAuthenticationService {
  private initialized = false;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    if (this.initialized) {return;}

    try {
      // Initialize security modules
      initializeSecurity();

      // Migrate demo users to secure format
      await this.migrateDemoUsers();

      this.initialized = true;
      securityLogger.info('Secure authentication service initialized');
    } catch (_error) {
      securityLogger.error('Failed to initialize secure authentication service', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Authentication service initialization failed');
    }
  }

  private async migrateDemoUsers(): Promise<void> {
    try {
      for (const demoUser of DEMO_USERS) {
        if (!users.has(demoUser.id)) {
          const secureUser: SecureUser = {
            ...demoUser,
            passwordHash: await hashPassword('password123'), // Default demo password
            passwordHistory: [],
            lastPasswordChangeAt: new Date().toISOString(),
            accountLocked: false,
            failedLoginAttempts: 0,
            activeSessions: [],
            refreshTokens: [],
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          };

          users.set(demoUser.id, secureUser);
        }
      }

      securityLogger.info('Demo users migrated to secure format', {
        userCount: DEMO_USERS.length,
      });
    } catch (_error) {
      securityLogger.error('Demo user migration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Secure Login Implementation
   */
  async login(email: string, password: string, context: LoginContext): Promise<SecureLoginResponse> {
    const startTime = Date.now();

    try {
      // Rate limiting check
      const rateLimitKey = `login:${context.ipAddress || 'unknown'}`;
      if (checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
        securityLogger.logSuspiciousActivity('rate_limit', {
          type: 'login',
          ipAddress: context.ipAddress,
          email: sanitizeUserInput(email),
        });
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Input validation and sanitization
      const validationResult = validateInput(validationSchemas.login, { email, password });
      if (!validationResult.success) {
        recordLoginAttempt(email, context.ipAddress || '', context.userAgent || '', false, 'Invalid input');
        throw new Error('Invalid email or password format');
      }

      const sanitizedEmail = sanitizeUserInput(email.toLowerCase().trim());

      // Find user
      const user = Array.from(users.values()).find(u => u.email === sanitizedEmail && u.isActive);

      if (!user) {
        recordLoginAttempt(sanitizedEmail, context.ipAddress || '', context.userAgent || '', false, 'User not found');
        monitorSecurityEvent(SecurityEventType.LOGIN_FAILURE, {
          email: sanitizedEmail,
          ipAddress: context.ipAddress,
          reason: 'user_not_found',
        });
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (isAccountLocked(user)) {
        recordLoginAttempt(sanitizedEmail, context.ipAddress || '', context.userAgent || '', false, 'Account locked');
        securityLogger.logSecurityEvent(
          SecurityEventType.UNAUTHORIZED_ACCESS,
          'Login attempt on locked account',
          {
            userId: user.id,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
        );
        throw new Error('Account is temporarily locked. Please try again later.');
      }

      // Check brute force protection
      if (shouldLockAccount(sanitizedEmail, context.ipAddress || '')) {
        lockAccount(user.id);
        securityLogger.logSuspiciousActivity('brute_force', {
          userId: user.id,
          email: sanitizedEmail,
          ipAddress: context.ipAddress,
        });
        throw new Error('Account locked due to suspicious activity');
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        user.failedLoginAttempts++;
        recordLoginAttempt(sanitizedEmail, context.ipAddress || '', context.userAgent || '', false, 'Invalid password');

        if (user.failedLoginAttempts >= 5) {
          lockAccount(user.id);
        }

        throw new Error('Invalid email or password');
      }

      // Reset failed attempts on successful login
      user.failedLoginAttempts = 0;

      // Create session
      const session = createSession(
        user,
        context.deviceInfo || 'Unknown Device',
        context.ipAddress || 'Unknown IP',
        context.userAgent || 'Unknown Browser',
      );

      // Generate JWT tokens
      const tokens = generateTokenPair(user, session.id);

      // Add refresh token to user
      user.refreshTokens.push(tokens.refreshToken);

      // Update last login
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();

      // Record successful login
      recordLoginAttempt(sanitizedEmail, context.ipAddress || '', context.userAgent || '', true);

      securityLogger.logLogin(true, user.id, context.ipAddress || '', context.userAgent || '');

      monitorSecurityEvent(SecurityEventType.LOGIN_SUCCESS, {
        userId: user.id,
        sessionId: session.id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        loginDuration: Date.now() - startTime,
      });

      // Convert to public user format
      const publicUser: User = this.convertToPublicUser(user);

      // Generate security notices
      const securityNotices = this.generateSecurityNotices(user, context);

      return {
        user: publicUser,
        tokens,
        sessionInfo: {
          sessionId: session.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
          deviceInfo: session.deviceInfo,
        },
        securityNotices,
      };

    } catch (_error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';

      securityLogger.error('Login failed', {
        email: sanitizeUserInput(email),
        ipAddress: context.ipAddress,
        error: errorMessage,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Secure Signup Implementation
   */
  async signup(signupData: SecureSignupData, context: LoginContext): Promise<SecureLoginResponse> {
    const startTime = Date.now();

    try {
      // Rate limiting for signup
      const rateLimitKey = `signup:${context.ipAddress || 'unknown'}`;
      if (checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000)) { // 3 signups per hour
        throw new Error('Signup rate limit exceeded. Please try again later.');
      }

      // Validate and sanitize input
      const validationResult = validateInput(validationSchemas.signup, signupData);
      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      const sanitizedData = validationResult.data;

      // Check if user already exists
      const existingUser = Array.from(users.values()).find(u => u.email === sanitizedData.email);
      if (existingUser) {
        securityLogger.logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          'Signup attempt with existing email',
          {
            email: sanitizedData.email,
            ipAddress: context.ipAddress,
          },
        );
        throw new Error('User with this email already exists');
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(sanitizedData.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
      }

      // Check terms acceptance
      if (!sanitizedData.acceptedTerms || !sanitizedData.acceptedPrivacyPolicy) {
        throw new Error('You must accept the terms and privacy policy to create an account');
      }

      // Hash password
      const passwordHash = await hashPassword(sanitizedData.password);

      // Create secure user
      const userId = generateUUID();
      const now = new Date().toISOString();

      const secureUser: SecureUser = {
        id: userId,
        email: sanitizedData.email,
        role: sanitizedData.role,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        passwordHash,
        passwordHistory: [passwordHash],
        lastLoginAt: undefined,
        lastPasswordChangeAt: now,
        accountLocked: false,
        failedLoginAttempts: 0,
        activeSessions: [],
        refreshTokens: [],
        twoFactorEnabled: false,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        notifications: {
          email: true,
          sms: false,
          push: true,
          matchUpdates: true,
          trainingReminders: true,
          emergencyAlerts: true,
          paymentReminders: sanitizedData.role === 'family',
        },
        timezone: 'America/New_York',
        language: 'en',
      };

      // Encrypt sensitive personal data if provided
      if (sanitizedData.phoneNumber || sanitizedData.emergencyContact) {
        // In a real system, this would be stored encrypted
        secureUser.phoneNumber = sanitizedData.phoneNumber;
      }

      // Store user
      users.set(userId, secureUser);

      // Log successful signup
      securityLogger.logSecurityEvent(
        SecurityEventType.DATA_MODIFICATION,
        'New user account created',
        {
          userId: secureUser.id,
          email: secureUser.email,
          role: secureUser.role,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      );

      // Automatically log in the new user
      return await this.login(sanitizedData.email, sanitizedData.password, context);

    } catch (_error) {
      securityLogger.error('Signup failed', {
        email: signupData.email,
        role: signupData.role,
        ipAddress: context.ipAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Secure Logout Implementation
   */
  async logout(token: string, context: LoginContext): Promise<void> {
    try {
      const payload = verifyToken(token);
      if (!payload) {
        throw new Error('Invalid token');
      }

      // Revoke the token
      revokeToken(token);

      // Terminate session
      terminateSession(payload.userId, payload.sessionId);

      // Remove refresh tokens for this session
      const user = users.get(payload.userId);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(rt => {
          const rtPayload = verifyToken(rt, true);
          return rtPayload?.sessionId !== payload.sessionId;
        });
      }

      securityLogger.logLogout(payload.userId, payload.sessionId);

      monitorSecurityEvent(SecurityEventType.LOGOUT, {
        userId: payload.userId,
        sessionId: payload.sessionId,
        ipAddress: context.ipAddress,
      });

    } catch (_error) {
      securityLogger.error('Logout failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: context.ipAddress,
      });
      throw error;
    }
  }

  /**
   * Token Refresh Implementation
   */
  async refreshToken(refreshToken: string, context: LoginContext): Promise<TokenPair> {
    try {
      const newTokens = refreshAccessToken(refreshToken);
      if (!newTokens) {
        throw new Error('Invalid refresh token');
      }

      const payload = verifyToken(newTokens.accessToken);
      if (payload) {
        updateSessionActivity(payload.sessionId);

        securityLogger.logSecurityEvent(
          SecurityEventType.TOKEN_REFRESH,
          'Access token refreshed',
          {
            userId: payload.userId,
            sessionId: payload.sessionId,
            ipAddress: context.ipAddress,
          },
        );
      }

      return newTokens;

    } catch (_error) {
      securityLogger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: context.ipAddress,
      });
      throw error;
    }
  }

  /**
   * Password Change Implementation
   */
  async changePassword(
    userId: string,
    passwordData: PasswordChangeData,
    context: LoginContext,
  ): Promise<void> {
    try {
      const user = users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate input
      const validationResult = validateInput(validationSchemas.changePassword, passwordData);
      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(passwordData.currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        securityLogger.logSecurityEvent(
          SecurityEventType.UNAUTHORIZED_ACCESS,
          'Invalid current password during password change',
          { userId, ipAddress: context.ipAddress },
        );
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(passwordData.newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
      }

      // Check password history
      const wasUsedBefore = await isPasswordPreviouslyUsed(passwordData.newPassword, user.passwordHistory);
      if (wasUsedBefore) {
        throw new Error('Cannot reuse a previously used password');
      }

      // Hash new password
      const newPasswordHash = await hashPassword(passwordData.newPassword);

      // Update user
      user.passwordHash = newPasswordHash;
      user.passwordHistory = [newPasswordHash, ...user.passwordHistory].slice(0, 5); // Keep last 5
      user.lastPasswordChangeAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();

      // Terminate all other sessions for security
      user.activeSessions.forEach(session => {
        if (session.isActive) {
          terminateSession(userId, session.id);
        }
      });

      // Clear refresh tokens
      user.refreshTokens = [];

      securityLogger.logSecurityEvent(
        SecurityEventType.PASSWORD_CHANGED,
        'User password changed successfully',
        {
          userId,
          ipAddress: context.ipAddress,
          sessionsTerminated: user.activeSessions.length,
        },
      );

    } catch (_error) {
      securityLogger.error('Password change failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: context.ipAddress,
      });
      throw error;
    }
  }

  /**
   * Get Current User (with permission checks)
   */
  async getCurrentUser(token: string, context: LoginContext): Promise<User | null> {
    try {
      const payload = verifyToken(token);
      if (!payload) {
        return null;
      }

      updateSessionActivity(payload.sessionId);

      const user = users.get(payload.userId);
      if (!user || !user.isActive) {
        return null;
      }

      // Log data access
      securityLogger.logDataAccess(payload.userId, 'user_profile', 'read', false);

      return this.convertToPublicUser(user);

    } catch (_error) {
      securityLogger.error('Get current user failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: context.ipAddress,
      });
      return null;
    }
  }

  /**
   * Authorization Check
   */
  async checkPermission(
    token: string,
    permission: Permission,
    resource: Resource,
    context: LoginContext,
    targetUserId?: string,
  ): Promise<boolean> {
    try {
      const payload = verifyToken(token);
      if (!payload) {
        return false;
      }

      const user = users.get(payload.userId);
      if (!user || !user.isActive) {
        return false;
      }

      const permissionContext: PermissionContext = {
        userId: payload.userId,
        userRole: payload.role,
        targetUserId,
        resourceType: resource,
        sessionId: payload.sessionId,
        ipAddress: context.ipAddress,
        timestamp: new Date(),
      };

      const hasPermissionResult = hasPermission(payload.role, permission, resource, permissionContext);

      securityLogger.logPermissionCheck(
        hasPermissionResult.granted,
        payload.userId,
        resource,
        permission,
        hasPermissionResult.reason,
      );

      return hasPermissionResult.granted;

    } catch (_error) {
      securityLogger.error('Permission check failed', {
        permission,
        resource,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Utility Methods
   */

  private convertToPublicUser(secureUser: SecureUser): User {
    const { passwordHash: _passwordHash, passwordHistory: _passwordHistory, refreshTokens: _refreshTokens, activeSessions: _activeSessions, ...publicUser } = secureUser;
    return publicUser as User;
  }

  private generateSecurityNotices(user: SecureUser, context: LoginContext): string[] {
    const notices: string[] = [];

    // Check for new IP address
    const knownIps = user.activeSessions.map(s => s.ipAddress);
    if (context.ipAddress && !knownIps.includes(context.ipAddress)) {
      notices.push('New login location detected');
    }

    // Check password age
    const passwordAge = Date.now() - new Date(user.lastPasswordChangeAt).getTime();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    if (passwordAge > ninetyDaysMs) {
      notices.push('Consider updating your password - it has been over 90 days');
    }

    // Check for multiple active sessions
    const activeSessions = user.activeSessions.filter(s => s.isActive);
    if (activeSessions.length > 2) {
      notices.push(`You have ${activeSessions.length} active sessions`);
    }

    return notices;
  }
}

// Export singleton instance
export const secureAuthService = new SecureAuthenticationService();

// Export types and interfaces
export type {
  SecureSignupData,
  SecureLoginResponse,
  LoginContext,
  PasswordChangeData,
  SecureUser,
  TokenPair,
  JWTPayload,
};