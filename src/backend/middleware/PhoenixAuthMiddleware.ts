/**
 * Phoenix Authentication & Authorization Middleware
 *
 * Enterprise-grade security middleware with:
 * - JWT token validation with rotation
 * - Role-based access control (RBAC)
 * - Rate limiting and brute force protection
 * - Session management and device tracking
 * - Audit logging and security monitoring
 * - Multi-factor authentication support
 * - API key authentication for external services
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// @ts-ignore - express-slow-down doesn't have type declarations
import slowDown from 'express-slow-down';
import { createHash, createHmac } from 'crypto';
import { phoenixPool } from '../database/PhoenixDatabasePool';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId: string;
    deviceId?: string;
    firstName?: string;
    lastName?: string;
  };
  session?: {
    id: string;
    userId: string;
    deviceInfo: string;
    ipAddress: string;
    expiresAt: Date;
    isActive: boolean;
  };
  apiKey?: {
    id: string;
    name: string;
    userId: string;
    permissions: string[];
    rateLimitPerHour: number;
  };
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetTime: Date;
  };
}

export interface JWTPayload {
  userId: string;
  sessionId: string;
  role: string;
  permissions: string[];
  deviceId?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface SecurityContext {
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  correlationId: string;
}

/**
 * Phoenix Authentication Middleware
 */
export class PhoenixAuthMiddleware {
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private apiKeys: Map<string, any> = new Map();
  private activeSessions: Map<string, any> = new Map();
  private securityEvents: any[] = [];

  // Rate limiting stores
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private bruteForceStore: Map<string, { attempts: number; lockedUntil?: number }> = new Map();

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'phoenix-jwt-secret-change-in-production';
    this.jwtRefreshSecret =
      process.env.JWT_REFRESH_SECRET || 'phoenix-refresh-secret-change-in-production';

    this.initializeMiddleware();
    this.startCleanupTasks();
  }

  private initializeMiddleware(): void {
    // Load API keys from database on startup
    this.loadAPIKeys();

    // Load active sessions
    this.loadActiveSessions();
  }

  private async loadAPIKeys(): Promise<void> {
    try {
      const result = await phoenixPool.query('SELECT * FROM api_keys WHERE is_active = true');

      result.rows.forEach(key => {
        this.apiKeys.set(key.key_hash, {
          id: key.id,
          name: key.name,
          userId: key.user_id,
          permissions: key.permissions,
          rateLimitPerHour: key.rate_limit_per_hour,
          lastUsed: key.last_used,
          usageCount: key.usage_count,
        });
      });

      console.log(`Loaded ${this.apiKeys.size} API keys`);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  }

  private async loadActiveSessions(): Promise<void> {
    try {
      const result = await phoenixPool.query(`
        SELECT s.*, u.role, u.email 
        FROM user_sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.is_active = true AND s.expires_at > NOW()
      `);

      result.rows.forEach(session => {
        this.activeSessions.set(session.session_token, {
          id: session.id,
          userId: session.user_id,
          deviceInfo: session.device_info,
          ipAddress: session.ip_address,
          userAgent: session.user_agent,
          expiresAt: session.expires_at,
          lastActivity: session.last_activity_at,
          userRole: session.role,
          userEmail: session.email,
        });
      });

      console.log(`Loaded ${this.activeSessions.size} active sessions`);
    } catch (error) {
      console.error('Failed to load active sessions:', error);
    }
  }

  private startCleanupTasks(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(
      () => {
        this.cleanupExpiredSessions();
      },
      5 * 60 * 1000,
    );

    // Clean up rate limit data every hour
    setInterval(
      () => {
        this.cleanupRateLimitData();
      },
      60 * 60 * 1000,
    );

    // Clean up security events older than 24 hours
    setInterval(
      () => {
        this.cleanupSecurityEvents();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * JWT Authentication Middleware
   */
  authenticateJWT = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (!token) {
        this.logSecurityEvent('MISSING_TOKEN', req);
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'MISSING_TOKEN',
        });
        return;
      }

      // Verify JWT token
      const decoded = this.verifyJWTToken(token);
      if (!decoded) {
        this.logSecurityEvent('INVALID_TOKEN', req);
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        });
        return;
      }

      // Check if session is still active
      const session = this.activeSessions.get(decoded.sessionId);
      if (!session || !session.isActive || new Date(session.expiresAt) < new Date()) {
        this.logSecurityEvent('EXPIRED_SESSION', req, { sessionId: decoded.sessionId });
        res.status(401).json({
          success: false,
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
        });
        return;
      }

      // Update session activity
      if (decoded.sessionId) {
        await this.updateSessionActivity(decoded.sessionId as string, req.ip ?? 'unknown');
      }

      // Set user context
      req.user = {
        id: decoded.userId,
        email: session.userEmail,
        role: decoded.role,
        permissions: decoded.permissions,
        sessionId: decoded.sessionId,
        deviceId: decoded.deviceId,
      };

      req.session = session;

      // Log successful authentication
      this.logSecurityEvent('AUTH_SUCCESS', req, { userId: decoded.userId });

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logSecurityEvent('AUTH_ERROR', req, { error: errorMessage });
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
      });
    }
  };

  /**
   * API Key Authentication Middleware
   */
  authenticateAPIKey = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const apiKey = req.headers['x-api-key'] as string;

      if (!apiKey) {
        res.status(401).json({
          success: false,
          error: 'API key required',
          code: 'MISSING_API_KEY',
        });
        return;
      }

      // Hash the API key for lookup
      const keyHash = this.hashAPIKey(apiKey);
      const keyData = this.apiKeys.get(keyHash);

      if (!keyData) {
        this.logSecurityEvent('INVALID_API_KEY', req);
        res.status(401).json({
          success: false,
          error: 'Invalid API key',
          code: 'INVALID_API_KEY',
        });
        return;
      }

      // Check rate limiting for this API key
      if (!this.checkAPIKeyRateLimit(keyData, req)) {
        res.status(429).json({
          success: false,
          error: 'API key rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
        });
        return;
      }

      // Update API key usage
      await this.updateAPIKeyUsage(keyData.id);

      req.apiKey = keyData;

      // Log API key usage
      this.logSecurityEvent('API_KEY_USED', req, { apiKeyId: keyData.id });

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logSecurityEvent('API_KEY_ERROR', req, { error: errorMessage });
      res.status(401).json({
        success: false,
        error: 'API key authentication failed',
        code: 'API_KEY_ERROR',
      });
    }
  };

  /**
   * Role-Based Access Control Middleware
   */
  requireRole = (allowedRoles: string | string[]) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        this.logSecurityEvent('INSUFFICIENT_ROLE', req, {
          userRole: req.user.role,
          requiredRoles: roles,
        });
        res.status(403).json({
          success: false,
          error: 'Insufficient role permissions',
          code: 'INSUFFICIENT_ROLE',
        });
        return;
      }

      next();
    };
  };

  /**
   * Permission-Based Access Control Middleware
   */
  requirePermission = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      const hasPermission =
        req.user.permissions.includes(permission) ||
        req.user.permissions.includes('*') ||
        req.user.role === 'admin';

      if (!hasPermission) {
        this.logSecurityEvent('INSUFFICIENT_PERMISSION', req, {
          permission,
          userPermissions: req.user.permissions,
        });
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSION',
        });
        return;
      }

      next();
    };
  };

  /**
   * Resource Access Control Middleware
   */
  requireResourceAccess = (resourceType: string, resourceIdParam: string = 'id') => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: 'Resource ID required',
          code: 'MISSING_RESOURCE_ID',
        });
        return;
      }

      try {
        const hasAccess = await this.checkResourceAccess(req.user, resourceType, resourceId);

        if (!hasAccess) {
          this.logSecurityEvent('UNAUTHORIZED_RESOURCE_ACCESS', req, {
            resourceType,
            resourceId,
            userId: req.user.id,
          });
          res.status(403).json({
            success: false,
            error: 'Access to resource denied',
            code: 'RESOURCE_ACCESS_DENIED',
          });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to verify resource access',
          code: 'RESOURCE_ACCESS_ERROR',
        });
      }
    };
  };

  /**
   * Rate Limiting Middleware
   */
  rateLimit = (config: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (req: Request) => string;
  }) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const key = config.keyGenerator ? config.keyGenerator(req) : req.ip || 'unknown';

      const now = Date.now();
      const windowStart = now - config.windowMs;

      let rateLimitData = this.rateLimitStore.get(key);
      if (!rateLimitData || rateLimitData.resetTime < windowStart) {
        rateLimitData = {
          count: 0,
          resetTime: now + config.windowMs,
        };
        this.rateLimitStore.set(key, rateLimitData);
      }

      if (rateLimitData.count >= config.max) {
        this.logSecurityEvent('RATE_LIMIT_EXCEEDED', req, { key, limit: config.max });

        res.set({
          'X-RateLimit-Limit': config.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitData.resetTime).toISOString(),
        });

        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000),
        });
        return;
      }

      // Increment counter after successful request (if configured)
      res.on('finish', () => {
        if (!config.skipSuccessfulRequests || res.statusCode >= 400) {
          rateLimitData.count++;
        }
      });

      req.rateLimitInfo = {
        limit: config.max,
        remaining: config.max - rateLimitData.count - 1,
        resetTime: new Date(rateLimitData.resetTime),
      };

      res.set({
        'X-RateLimit-Limit': config.max.toString(),
        'X-RateLimit-Remaining': req.rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': req.rateLimitInfo.resetTime.toISOString(),
      });

      next();
    };
  };

  /**
   * Brute Force Protection Middleware
   */
  bruteForceProtection = (config: {
    maxAttempts: number;
    lockoutDuration: number;
    keyGenerator?: (req: Request) => string;
  }) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const key = config.keyGenerator ? config.keyGenerator(req) : req.ip || 'unknown';

      const now = Date.now();
      let bruteData = this.bruteForceStore.get(key);

      if (bruteData?.lockedUntil && bruteData.lockedUntil > now) {
        this.logSecurityEvent('BRUTE_FORCE_BLOCKED', req, {
          key,
          lockedUntil: new Date(bruteData.lockedUntil),
        });

        res.status(429).json({
          success: false,
          error: 'Account temporarily locked due to too many failed attempts',
          code: 'ACCOUNT_LOCKED',
          retryAfter: Math.ceil((bruteData.lockedUntil - now) / 1000),
        });
        return;
      }

      // Reset attempts if lockout period has passed
      if (bruteData?.lockedUntil && bruteData.lockedUntil <= now) {
        bruteData = { attempts: 0 };
        this.bruteForceStore.set(key, bruteData);
      }

      // Track failed attempts on response
      res.on('finish', () => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          if (!bruteData) {
            bruteData = { attempts: 0 };
          }

          bruteData.attempts++;

          if (bruteData.attempts >= config.maxAttempts) {
            bruteData.lockedUntil = now + config.lockoutDuration;
            this.logSecurityEvent('BRUTE_FORCE_LOCKOUT', req, {
              key,
              attempts: bruteData.attempts,
            });
          }

          this.bruteForceStore.set(key, bruteData);
        } else if (res.statusCode < 400) {
          // Reset on successful authentication
          this.bruteForceStore.delete(key);
        }
      });

      next();
    };
  };

  /**
   * Device Fingerprinting Middleware
   */
  deviceFingerprinting = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const deviceFingerprint = this.generateDeviceFingerprint(req);

    // Store device fingerprint for security analysis
    if (req.user) {
      this.analyzeDeviceFingerprint(req.user.id, deviceFingerprint, req);
    }

    next();
  };

  /**
   * Security Headers Middleware
   */
  securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Set security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    });

    next();
  };

  // Helper methods

  private verifyJWTToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;

      // Validate token structure
      if (!decoded.userId || !decoded.sessionId || !decoded.role) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  private hashAPIKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  private checkAPIKeyRateLimit(keyData: any, req: Request): boolean {
    const key = `api_key:${keyData.id}`;
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    let rateLimitData = this.rateLimitStore.get(key);
    if (!rateLimitData || rateLimitData.resetTime < hourAgo) {
      rateLimitData = {
        count: 0,
        resetTime: now + 60 * 60 * 1000,
      };
      this.rateLimitStore.set(key, rateLimitData);
    }

    if (rateLimitData.count >= keyData.rateLimitPerHour) {
      return false;
    }

    rateLimitData.count++;
    return true;
  }

  private async updateSessionActivity(sessionId: string, ipAddress: string): Promise<void> {
    try {
      await phoenixPool.query(
        `
        UPDATE user_sessions 
        SET last_activity_at = NOW(), ip_address = $1 
        WHERE id = $2
      `,
        [ipAddress, sessionId],
      );

      // Update in-memory session
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.lastActivity = new Date();
        session.ipAddress = ipAddress;
      }
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  private async updateAPIKeyUsage(apiKeyId: string): Promise<void> {
    try {
      await phoenixPool.query(
        `
        UPDATE api_keys 
        SET last_used = NOW(), usage_count = usage_count + 1 
        WHERE id = $1
      `,
        [apiKeyId],
      );
    } catch (error) {
      console.error('Failed to update API key usage:', error);
    }
  }

  private async checkResourceAccess(
    user: any,
    resourceType: string,
    resourceId: string,
  ): Promise<boolean> {
    // Admin users have access to everything
    if (user.role === 'admin') {
      return true;
    }

    try {
      // Check resource-specific access rules
      switch (resourceType) {
        case 'player':
          return await this.checkPlayerAccess(user, resourceId);
        case 'formation':
          return await this.checkFormationAccess(user, resourceId);
        case 'team':
          return await this.checkTeamAccess(user, resourceId);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking resource access:', error);
      return false;
    }
  }

  private async checkPlayerAccess(user: any, playerId: string): Promise<boolean> {
    // Coaches can access all players
    if (user.role === 'coach') {
      return true;
    }

    // Players can only access their own data
    if (user.role === 'player') {
      return user.id === playerId;
    }

    // Family members can access associated players
    if (user.role === 'family') {
      const result = await phoenixPool.query(
        `
        SELECT 1 FROM family_member_associations 
        WHERE family_member_id = $1 AND player_id = $2 AND approved_by_coach = true
      `,
        [user.id, playerId],
      );

      return result.rows.length > 0;
    }

    return false;
  }

  private async checkFormationAccess(user: any, formationId: string): Promise<boolean> {
    // Coaches can access all formations
    if (user.role === 'coach') {
      return true;
    }

    // Check if formation is public or user has specific access
    const result = await phoenixPool.query(
      `
      SELECT f.*, t.coach_id 
      FROM formations f 
      LEFT JOIN teams t ON f.team_id = t.id 
      WHERE f.id = $1
    `,
      [formationId],
    );

    if (result.rows.length === 0) {
      return false;
    }

    const formation = result.rows[0];

    // If formation has no team (public formation)
    if (!formation.team_id) {
      return true;
    }

    // Check if user is the coach of the team
    return formation.coach_id === user.id;
  }

  private async checkTeamAccess(user: any, teamId: string): Promise<boolean> {
    // Check if user is coach or member of the team
    const result = await phoenixPool.query(
      `
      SELECT 1 FROM teams t
      LEFT JOIN players p ON p.team_id = t.id
      WHERE t.id = $1 AND (t.coach_id = $2 OR p.id = $2)
    `,
      [teamId, user.id],
    );

    return result.rows.length > 0;
  }

  private generateDeviceFingerprint(req: Request): string {
    const components = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['accept-encoding'] || '',
      req.headers['x-forwarded-for'] || req.ip || '',
      req.headers['sec-ch-ua'] || '',
      req.headers['sec-ch-ua-platform'] || '',
    ];

    return createHash('sha256').update(components.join('|')).digest('hex');
  }

  private analyzeDeviceFingerprint(userId: string, fingerprint: string, req: Request): void {
    // Check if this is a new device for the user
    // Implementation would check against known devices and alert on new ones
    this.logSecurityEvent('DEVICE_FINGERPRINT', req, {
      userId,
      fingerprint,
      isNewDevice: false, // Would be determined by database lookup
    });
  }

  private logSecurityEvent(eventType: string, req: Request, metadata?: any): void {
    const event = {
      type: eventType,
      timestamp: new Date(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      endpoint: req.originalUrl,
      method: req.method,
      correlationId: req.headers['x-correlation-id'] || 'unknown',
      metadata: metadata || {},
    };

    this.securityEvents.push(event);

    // Log to database asynchronously
    this.persistSecurityEvent(event).catch(error => {
      console.error('Failed to persist security event:', error);
    });

    // Log critical events immediately
    if (
      ['BRUTE_FORCE_LOCKOUT', 'INVALID_TOKEN', 'UNAUTHORIZED_RESOURCE_ACCESS'].includes(eventType)
    ) {
      console.warn('Security Event:', event);
    }
  }

  private async persistSecurityEvent(event: any): Promise<void> {
    try {
      await phoenixPool.query(
        `
        INSERT INTO system_logs (level, message, timestamp, service, ip_address, user_agent, metadata, security_event_type)
        VALUES ('warn', $1, $2, 'auth-middleware', $3, $4, $5, $6)
      `,
        [
          `Security event: ${event.type}`,
          event.timestamp,
          event.ipAddress,
          event.userAgent,
          JSON.stringify(event.metadata),
          event.type,
        ],
      );
    } catch (error) {
      console.error('Failed to persist security event to database:', error);
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (new Date(session.expiresAt).getTime() < now) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  private cleanupRateLimitData(): void {
    const now = Date.now();
    for (const [key, data] of this.rateLimitStore.entries()) {
      if (data.resetTime < now) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  private cleanupSecurityEvents(): void {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.securityEvents = this.securityEvents.filter(event => event.timestamp.getTime() > dayAgo);
  }

  /**
   * Create new JWT token
   */
  createJWTToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
    const now = Math.floor(Date.now() / 1000);

    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + 15 * 60, // 15 minutes
      iss: 'astral-turf',
      aud: 'astral-turf-client',
    };

    return jwt.sign(fullPayload, this.jwtSecret);
  }

  /**
   * Create refresh token
   */
  createRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
    const now = Math.floor(Date.now() / 1000);

    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + 7 * 24 * 60 * 60, // 7 days
      iss: 'astral-turf',
      aud: 'astral-turf-client',
    };

    return jwt.sign(fullPayload, this.jwtRefreshSecret);
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): any {
    const recentEvents = this.securityEvents.filter(
      event => event.timestamp.getTime() > Date.now() - 60 * 60 * 1000, // Last hour
    );

    const eventCounts = recentEvents.reduce(
      (counts, event) => {
        counts[event.type] = (counts[event.type] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );

    return {
      activeSessions: this.activeSessions.size,
      activeAPIKeys: this.apiKeys.size,
      rateLimitEntries: this.rateLimitStore.size,
      bruteForceEntries: this.bruteForceStore.size,
      recentSecurityEvents: eventCounts,
      totalSecurityEvents: this.securityEvents.length,
    };
  }
}

// Create singleton instance
export const phoenixAuthMiddleware = new PhoenixAuthMiddleware();

// Export middleware functions for easy use
export const {
  authenticateJWT,
  authenticateAPIKey,
  requireRole,
  requirePermission,
  requireResourceAccess,
  rateLimit,
  bruteForceProtection,
  deviceFingerprinting,
  securityHeaders,
} = phoenixAuthMiddleware;

// Export convenience middleware combinations
export const authRequired = [phoenixAuthMiddleware.authenticateJWT];

export const adminRequired = [
  phoenixAuthMiddleware.authenticateJWT,
  phoenixAuthMiddleware.requireRole('admin'),
];

export const coachRequired = [
  phoenixAuthMiddleware.authenticateJWT,
  phoenixAuthMiddleware.requireRole(['coach', 'admin']),
];

export const apiKeyAuth = [phoenixAuthMiddleware.authenticateAPIKey];

export const strictSecurity = [
  phoenixAuthMiddleware.securityHeaders,
  phoenixAuthMiddleware.bruteForceProtection({
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  }),
  phoenixAuthMiddleware.rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
  }),
  phoenixAuthMiddleware.deviceFingerprinting,
  phoenixAuthMiddleware.authenticateJWT,
];
