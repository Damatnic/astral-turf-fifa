/**
 * Database Authentication Service
 *
 * Production-ready authentication service that uses the PostgreSQL database
 * instead of in-memory storage, with proper session management and security.
 */

import { PrismaClient, User as PrismaUser, UserSession, UserRole } from '@prisma/client';
import { databaseService } from './databaseService';
import { redisService, cache, rateLimit } from './redisService';
import { securityLogger, SecurityEventType } from '../security/logging';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateTokenPair,
  verifyToken,
  refreshAccessToken,
} from '../security/auth';
import { validateInput, validationSchemas } from '../security/validation';
import { sanitizeUserInput } from '../security/sanitization';
import { generateUUID } from '../security/encryption';
import type { User, FamilyMemberAssociation, NotificationSettings } from '../types';

export interface DatabaseSignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  emergencyContact?: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  marketingConsent?: boolean;
  // Family member specific
  playerId?: string;
  playerName?: string;
  relationship?: string;
}

export interface DatabaseLoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  sessionInfo: {
    sessionId: string;
    expiresAt: string;
    deviceInfo: string;
  };
  securityNotices?: string[];
}

export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  timestamp: string;
}

class DatabaseAuthService {
  private db: PrismaClient;

  constructor() {
    this.db = databaseService.getClient();
  }

  /**
   * User registration with database storage
   */
  async signup(
    signupData: DatabaseSignupData,
    context: LoginContext,
  ): Promise<DatabaseLoginResponse> {
    const startTime = Date.now();

    try {
      // Rate limiting for signup
      const rateLimitKey = `signup:${context.ipAddress || 'unknown'}`;
      const rateLimitResult = await rateLimit.check(rateLimitKey, 3, 3600); // 3 signups per hour

      if (!rateLimitResult.allowed) {
        securityLogger.logSecurityEvent(
          SecurityEventType.RATE_LIMIT_EXCEEDED,
          'Signup rate limit exceeded',
          {
            ipAddress: context.ipAddress,
            remaining: rateLimitResult.remaining,
          },
        );
        throw new Error('Signup rate limit exceeded. Please try again later.');
      }

      // Validate and sanitize input
      const validationResult = validateInput(validationSchemas.signup, signupData);
      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      const sanitizedData = validationResult.data;
      sanitizedData.email = sanitizeUserInput(sanitizedData.email.toLowerCase().trim());

      // Check if user already exists
      const existingUser = await this.db.user.findUnique({
        where: { email: sanitizedData.email },
      });

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

      // Create user in database using transaction
      const result = await databaseService.executeTransaction(async prisma => {
        // Create user
        const newUser = await prisma.user.create({
          data: {
            email: sanitizedData.email,
            passwordHash,
            firstName: sanitizedData.firstName,
            lastName: sanitizedData.lastName,
            role: sanitizedData.role,
            phoneNumber: sanitizedData.phoneNumber,
            isActive: true,
            lastPasswordChangeAt: new Date(),
            passwordHistory: {
              create: {
                passwordHash,
              },
            },
            notifications: {
              create: {
                email: true,
                sms: false,
                push: true,
                matchUpdates: true,
                trainingReminders: true,
                emergencyAlerts: true,
                paymentReminders: sanitizedData.role === 'FAMILY',
              },
            },
          },
          include: {
            notifications: true,
            passwordHistory: true,
          },
        });

        return newUser;
      });

      // Log successful signup
      securityLogger.logSecurityEvent(
        SecurityEventType.DATA_MODIFICATION,
        'New user account created',
        {
          userId: result.id,
          email: result.email,
          role: result.role,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      );

      // Automatically log in the new user
      return await this.login(sanitizedData.email, sanitizedData.password, context);
    } catch (_error) {
      securityLogger.error('Database signup failed', {
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
   * User login with database authentication
   */
  async login(
    email: string,
    password: string,
    context: LoginContext,
  ): Promise<DatabaseLoginResponse> {
    const startTime = Date.now();

    try {
      // Rate limiting check
      const rateLimitKey = `login:${context.ipAddress || 'unknown'}`;
      const rateLimitResult = await rateLimit.check(rateLimitKey, 5, 900); // 5 attempts per 15 minutes

      if (!rateLimitResult.allowed) {
        securityLogger.logSecurityEvent(
          SecurityEventType.RATE_LIMIT_EXCEEDED,
          'Login rate limit exceeded',
          {
            ipAddress: context.ipAddress,
            email: sanitizeUserInput(email),
          },
        );
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Input validation and sanitization
      const validationResult = validateInput(validationSchemas.login, { email, password });
      if (!validationResult.success) {
        throw new Error('Invalid email or password format');
      }

      const sanitizedEmail = sanitizeUserInput(email.toLowerCase().trim());

      // Find user in database
      const user = await this.db.user.findUnique({
        where: {
          email: sanitizedEmail,
          isActive: true,
        },
        include: {
          sessions: {
            where: {
              isActive: true,
              expiresAt: {
                gt: new Date(),
              },
            },
          },
          notifications: true,
        },
      });

      if (!user) {
        await this.recordFailedLogin(sanitizedEmail, context, 'User not found');
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (user.accountLocked) {
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

      // Check failed login attempts
      if (user.failedLoginAttempts >= 5) {
        await this.lockAccount(user.id);
        throw new Error('Account locked due to too many failed attempts');
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        await this.recordFailedLogin(sanitizedEmail, context, 'Invalid password', user.id);
        throw new Error('Invalid email or password');
      }

      // Reset failed attempts on successful login
      await this.db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lastLoginAt: new Date(),
        },
      });

      // Create session
      const sessionId = generateUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const session = await this.db.userSession.create({
        data: {
          userId: user.id,
          sessionToken: sessionId,
          deviceInfo: context.deviceInfo || 'Unknown Device',
          ipAddress: context.ipAddress || 'Unknown IP',
          userAgent: context.userAgent || 'Unknown Browser',
          expiresAt,
          isActive: true,
        },
      });

      // Generate JWT tokens
      const tokens = generateTokenPair(this.convertToPublicUser(user), sessionId);

      // Cache session data in Redis
      await cache.set(
        `session:${sessionId}`,
        {
          userId: user.id,
          sessionId,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
        },
        { ttl: 24 * 60 * 60 },
      ); // 24 hours

      // Record successful login
      securityLogger.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, 'User login successful', {
        userId: user.id,
        sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        loginDuration: Date.now() - startTime,
      });

      // Generate security notices
      const securityNotices = await this.generateSecurityNotices(user, context);

      return {
        user: this.convertToPublicUser(user),
        tokens,
        sessionInfo: {
          sessionId,
          expiresAt: expiresAt.toISOString(),
          deviceInfo: session.deviceInfo,
        },
        securityNotices,
      };
    } catch (_error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';

      securityLogger.error('Database login failed', {
        email: sanitizeUserInput(email),
        ipAddress: context.ipAddress,
        error: errorMessage,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(sessionId: string, context: LoginContext): Promise<void> {
    try {
      // Get session from database
      const session = await this.db.userSession.findUnique({
        where: { sessionToken: sessionId },
      });

      if (session) {
        // Deactivate session in database
        await this.db.userSession.update({
          where: { id: session.id },
          data: { isActive: false },
        });

        // Remove from Redis cache
        await cache.del(`session:${sessionId}`);

        securityLogger.logSecurityEvent(SecurityEventType.LOGOUT, 'User logout successful', {
          userId: session.userId,
          sessionId,
          ipAddress: context.ipAddress,
        });
      }
    } catch (_error) {
      securityLogger.error('Logout failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: context.ipAddress,
      });
      throw error;
    }
  }

  /**
   * Get current user from session
   */
  async getCurrentUser(sessionId: string): Promise<User | null> {
    try {
      // Try Redis cache first
      const cachedSession = await cache.get(`session:${sessionId}`);

      let session: UserSession | null = null;

      if (cachedSession) {
        // Verify session still exists in database
        session = await this.db.userSession.findUnique({
          where: {
            sessionToken: sessionId,
            isActive: true,
            expiresAt: {
              gt: new Date(),
            },
          },
        });
      } else {
        // Get from database
        session = await this.db.userSession.findUnique({
          where: {
            sessionToken: sessionId,
            isActive: true,
            expiresAt: {
              gt: new Date(),
            },
          },
        });

        // Cache session if found
        if (session) {
          await cache.set(
            `session:${sessionId}`,
            {
              userId: session.userId,
              sessionId: session.sessionToken,
              deviceInfo: session.deviceInfo,
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
            },
            { ttl: 24 * 60 * 60 },
          );
        }
      }

      if (!session) {
        return null;
      }

      // Update last activity
      await this.db.userSession.update({
        where: { id: session.id },
        data: { lastActivityAt: new Date() },
      });

      // Get user data
      const user = await this.db.user.findUnique({
        where: {
          id: session.userId,
          isActive: true,
        },
        include: {
          notifications: true,
        },
      });

      if (!user) {
        return null;
      }

      // Log data access
      securityLogger.logSecurityEvent(SecurityEventType.DATA_ACCESS, 'User data accessed', {
        userId: user.id,
        sessionId,
        sensitive: false,
      });

      return this.convertToPublicUser(user);
    } catch (_error) {
      securityLogger.error('Get current user failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const updatedUser = await this.db.user.update({
        where: { id: userId },
        data: {
          firstName: updates.firstName,
          lastName: updates.lastName,
          phoneNumber: updates.phoneNumber,
          timezone: updates.timezone,
          language: updates.language,
          updatedAt: new Date(),
        },
        include: {
          notifications: true,
        },
      });

      securityLogger.logSecurityEvent(SecurityEventType.DATA_MODIFICATION, 'User profile updated', {
        userId,
        updatedFields: Object.keys(updates),
      });

      return this.convertToPublicUser(updatedUser);
    } catch (_error) {
      securityLogger.error('Update user profile failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    context: LoginContext,
  ): Promise<void> {
    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        include: {
          passwordHistory: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        securityLogger.logSecurityEvent(
          SecurityEventType.UNAUTHORIZED_ACCESS,
          'Invalid current password during password change',
          { userId, ipAddress: context.ipAddress },
        );
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
      }

      // Check password history
      const passwordHistory = user.passwordHistory || [];
      for (const historicalPassword of passwordHistory) {
        const wasUsedBefore = await verifyPassword(newPassword, historicalPassword.passwordHash);
        if (wasUsedBefore) {
          throw new Error('Cannot reuse a previously used password');
        }
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password using transaction
      await databaseService.executeTransaction(async prisma => {
        // Update user password
        await prisma.user.update({
          where: { id: userId },
          data: {
            passwordHash: newPasswordHash,
            lastPasswordChangeAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Add to password history
        await prisma.passwordHistory.create({
          data: {
            userId,
            passwordHash: newPasswordHash,
          },
        });

        // Keep only last 5 passwords
        const oldPasswords = await prisma.passwordHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: 5,
        });

        if (oldPasswords.length > 0) {
          await prisma.passwordHistory.deleteMany({
            where: {
              id: {
                in: oldPasswords.map(p => p.id),
              },
            },
          });
        }

        // Deactivate all other sessions for security
        await prisma.userSession.updateMany({
          where: {
            userId,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
      });

      securityLogger.logSecurityEvent(
        SecurityEventType.PASSWORD_CHANGED,
        'User password changed successfully',
        {
          userId,
          ipAddress: context.ipAddress,
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
   * Private helper methods
   */

  private async recordFailedLogin(
    email: string,
    context: LoginContext,
    reason: string,
    userId?: string,
  ): Promise<void> {
    try {
      if (userId) {
        // Increment failed login attempts
        await this.db.user.update({
          where: { id: userId },
          data: {
            failedLoginAttempts: {
              increment: 1,
            },
          },
        });
      }

      securityLogger.logSecurityEvent(SecurityEventType.LOGIN_FAILURE, `Login failed: ${reason}`, {
        email: sanitizeUserInput(email),
        userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        reason,
      });
    } catch (_error) {
      securityLogger.error('Failed to record login failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async lockAccount(userId: string): Promise<void> {
    try {
      await this.db.user.update({
        where: { id: userId },
        data: {
          accountLocked: true,
          updatedAt: new Date(),
        },
      });

      securityLogger.logSecurityEvent(
        SecurityEventType.ACCOUNT_LOCKED,
        'Account locked due to failed login attempts',
        { userId },
      );
    } catch (_error) {
      securityLogger.error('Failed to lock account', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private convertToPublicUser(prismaUser: PrismaUser & { notifications?: unknown }): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      role: prismaUser.role as any, // Type conversion
      isActive: prismaUser.isActive,
      phoneNumber: prismaUser.phoneNumber || undefined,
      timezone: prismaUser.timezone,
      language: prismaUser.language,
      lastLoginAt: prismaUser.lastLoginAt?.toISOString(),
      notifications: prismaUser.notifications
        ? {
            email: prismaUser.notifications.email,
            sms: prismaUser.notifications.sms,
            push: prismaUser.notifications.push,
            matchUpdates: prismaUser.notifications.matchUpdates,
            trainingReminders: prismaUser.notifications.trainingReminders,
            emergencyAlerts: prismaUser.notifications.emergencyAlerts,
            paymentReminders: prismaUser.notifications.paymentReminders,
          }
        : {
            email: true,
            sms: false,
            push: true,
            matchUpdates: true,
            trainingReminders: true,
            emergencyAlerts: true,
            paymentReminders: false,
          },
    };
  }

  private async generateSecurityNotices(
    user: PrismaUser & { sessions?: UserSession[] },
    context: LoginContext,
  ): Promise<string[]> {
    const notices: string[] = [];

    try {
      // Check for new IP address
      if (context.ipAddress && user.sessions) {
        const knownIps = user.sessions.map(s => s.ipAddress);
        if (!knownIps.includes(context.ipAddress)) {
          notices.push('New login location detected');
        }
      }

      // Check password age
      if (user.lastPasswordChangeAt) {
        const passwordAge = Date.now() - user.lastPasswordChangeAt.getTime();
        const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
        if (passwordAge > ninetyDaysMs) {
          notices.push('Consider updating your password - it has been over 90 days');
        }
      }

      // Check for multiple active sessions
      const activeSessions = await this.db.userSession.count({
        where: {
          userId: user.id,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (activeSessions > 2) {
        notices.push(`You have ${activeSessions} active sessions`);
      }
    } catch (_error) {
      securityLogger.error('Failed to generate security notices', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return notices;
  }
}

// Singleton instance
export const databaseAuthService = new DatabaseAuthService();
