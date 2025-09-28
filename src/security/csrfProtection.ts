/**
 * Guardian CSRF Protection System
 * Advanced Cross-Site Request Forgery prevention with token-based protection
 */

import * as crypto from 'crypto';
import { securityLogger } from './logging';

export interface CSRFToken {
  token: string;
  sessionId: string;
  userId?: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
  requestPath?: string;
  origin?: string;
}

export interface CSRFValidationResult {
  valid: boolean;
  reason?: string;
  token?: CSRFToken;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface CSRFProtectionConfig {
  tokenLength: number;
  tokenLifetime: number; // in milliseconds
  requireSameOrigin: boolean;
  requireRefererHeader: boolean;
  enableDoubleSubmitCookies: boolean;
  enableCustomHeader: boolean;
  customHeaderName: string;
  skipPaths: string[];
  allowedOrigins: string[];
  strictMode: boolean;
}

export interface CSRFViolation {
  id: string;
  timestamp: string;
  type: 'missing_token' | 'invalid_token' | 'expired_token' | 'origin_mismatch' | 'referer_mismatch';
  sessionId?: string;
  userId?: string;
  requestPath: string;
  method: string;
  origin?: string;
  referer?: string;
  userAgent?: string;
  ipAddress?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Default CSRF Protection Configuration
 */
const DEFAULT_CSRF_CONFIG: CSRFProtectionConfig = {
  tokenLength: 32,
  tokenLifetime: 24 * 60 * 60 * 1000, // 24 hours
  requireSameOrigin: true,
  requireRefererHeader: true,
  enableDoubleSubmitCookies: true,
  enableCustomHeader: true,
  customHeaderName: 'X-CSRF-Token',
  skipPaths: ['/api/health', '/api/status', '/login', '/logout'],
  allowedOrigins: [],
  strictMode: true
};

/**
 * Guardian CSRF Protection Service
 */
class CSRFProtectionService {
  private config: CSRFProtectionConfig;
  private tokens: Map<string, CSRFToken> = new Map();
  private violations: CSRFViolation[] = [];
  private sessionTokens: Map<string, Set<string>> = new Map(); // sessionId -> tokenIds

  constructor(config: Partial<CSRFProtectionConfig> = {}) {
    this.config = { ...DEFAULT_CSRF_CONFIG, ...config };
    
    // Clean up expired tokens every hour
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000);
  }

  /**
   * Generate a new CSRF token for a session
   */
  generateToken(
    sessionId: string,
    userId?: string,
    requestPath?: string,
    origin?: string
  ): CSRFToken {
    const tokenId = this.generateSecureToken();
    const now = Date.now();
    
    const token: CSRFToken = {
      token: tokenId,
      sessionId,
      userId,
      createdAt: now,
      expiresAt: now + this.config.tokenLifetime,
      used: false,
      requestPath,
      origin
    };

    // Store token
    this.tokens.set(tokenId, token);

    // Associate with session
    if (!this.sessionTokens.has(sessionId)) {
      this.sessionTokens.set(sessionId, new Set());
    }
    this.sessionTokens.get(sessionId)!.add(tokenId);

    securityLogger.info('CSRF token generated', {
      tokenId: tokenId.substring(0, 8) + '...',
      sessionId,
      userId,
      requestPath
    });

    return token;
  }

  /**
   * Validate CSRF token from request
   */
  validateToken(
    tokenId: string,
    request: {
      sessionId: string;
      method: string;
      path: string;
      origin?: string;
      referer?: string;
      userAgent?: string;
      ipAddress?: string;
      userId?: string;
      headers?: Record<string, string>;
    }
  ): CSRFValidationResult {
    try {
      // Check if path should be skipped
      if (this.shouldSkipPath(request.path)) {
        return { valid: true, riskLevel: 'low' };
      }

      // Only validate for state-changing methods
      if (!this.isStatefulMethod(request.method)) {
        return { valid: true, riskLevel: 'low' };
      }

      // Get token
      const token = this.tokens.get(tokenId);
      if (!token) {
        this.logViolation({
          type: 'missing_token',
          sessionId: request.sessionId,
          userId: request.userId,
          requestPath: request.path,
          method: request.method,
          origin: request.origin,
          referer: request.referer,
          userAgent: request.userAgent,
          ipAddress: request.ipAddress,
          severity: 'high'
        });

        return {
          valid: false,
          reason: 'CSRF token not found',
          riskLevel: 'high'
        };
      }

      // Check if token is expired
      if (Date.now() > token.expiresAt) {
        this.logViolation({
          type: 'expired_token',
          sessionId: request.sessionId,
          userId: request.userId,
          requestPath: request.path,
          method: request.method,
          origin: request.origin,
          referer: request.referer,
          userAgent: request.userAgent,
          ipAddress: request.ipAddress,
          severity: 'medium'
        });

        return {
          valid: false,
          reason: 'CSRF token expired',
          riskLevel: 'medium'
        };
      }

      // Check if token belongs to the session
      if (token.sessionId !== request.sessionId) {
        this.logViolation({
          type: 'invalid_token',
          sessionId: request.sessionId,
          userId: request.userId,
          requestPath: request.path,
          method: request.method,
          origin: request.origin,
          referer: request.referer,
          userAgent: request.userAgent,
          ipAddress: request.ipAddress,
          severity: 'critical'
        });

        return {
          valid: false,
          reason: 'CSRF token session mismatch',
          riskLevel: 'critical'
        };
      }

      // Check if token was already used (if one-time tokens)
      if (this.config.strictMode && token.used) {
        this.logViolation({
          type: 'invalid_token',
          sessionId: request.sessionId,
          userId: request.userId,
          requestPath: request.path,
          method: request.method,
          origin: request.origin,
          referer: request.referer,
          userAgent: request.userAgent,
          ipAddress: request.ipAddress,
          severity: 'high'
        });

        return {
          valid: false,
          reason: 'CSRF token already used',
          riskLevel: 'high'
        };
      }

      // Origin validation
      if (this.config.requireSameOrigin && request.origin) {
        if (!this.validateOrigin(request.origin)) {
          this.logViolation({
            type: 'origin_mismatch',
            sessionId: request.sessionId,
            userId: request.userId,
            requestPath: request.path,
            method: request.method,
            origin: request.origin,
            referer: request.referer,
            userAgent: request.userAgent,
            ipAddress: request.ipAddress,
            severity: 'critical'
          });

          return {
            valid: false,
            reason: 'Origin validation failed',
            riskLevel: 'critical'
          };
        }
      }

      // Referer validation
      if (this.config.requireRefererHeader && request.referer) {
        if (!this.validateReferer(request.referer, request.origin)) {
          this.logViolation({
            type: 'referer_mismatch',
            sessionId: request.sessionId,
            userId: request.userId,
            requestPath: request.path,
            method: request.method,
            origin: request.origin,
            referer: request.referer,
            userAgent: request.userAgent,
            ipAddress: request.ipAddress,
            severity: 'high'
          });

          return {
            valid: false,
            reason: 'Referer validation failed',
            riskLevel: 'high'
          };
        }
      }

      // Custom header validation
      if (this.config.enableCustomHeader) {
        const customHeaderValue = request.headers?.[this.config.customHeaderName.toLowerCase()];
        if (!customHeaderValue || customHeaderValue !== tokenId) {
          return {
            valid: false,
            reason: 'Custom header validation failed',
            riskLevel: 'high'
          };
        }
      }

      // Mark token as used if in strict mode
      if (this.config.strictMode) {
        token.used = true;
      }

      securityLogger.info('CSRF token validated successfully', {
        tokenId: tokenId.substring(0, 8) + '...',
        sessionId: request.sessionId,
        userId: request.userId,
        path: request.path
      });

      return {
        valid: true,
        token,
        riskLevel: 'low'
      };

    } catch (error) {
      securityLogger.error('CSRF validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenId: tokenId?.substring(0, 8) + '...',
        sessionId: request.sessionId,
        path: request.path
      });

      return {
        valid: false,
        reason: 'CSRF validation error',
        riskLevel: 'critical'
      };
    }
  }

  /**
   * Generate double-submit cookie pair
   */
  generateDoubleSubmitCookie(sessionId: string): { cookieValue: string; headerValue: string } {
    const cookieValue = this.generateSecureToken();
    const headerValue = this.generateSecureToken();
    
    // Store the pair
    const token: CSRFToken = {
      token: `${cookieValue}:${headerValue}`,
      sessionId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.config.tokenLifetime,
      used: false
    };

    this.tokens.set(token.token, token);

    return { cookieValue, headerValue };
  }

  /**
   * Validate double-submit cookie
   */
  validateDoubleSubmitCookie(
    cookieValue: string,
    headerValue: string,
    sessionId: string
  ): boolean {
    const tokenKey = `${cookieValue}:${headerValue}`;
    const token = this.tokens.get(tokenKey);

    if (!token) return false;
    if (token.sessionId !== sessionId) return false;
    if (Date.now() > token.expiresAt) return false;

    return true;
  }

  /**
   * Invalidate all tokens for a session
   */
  invalidateSession(sessionId: string): void {
    const sessionTokenIds = this.sessionTokens.get(sessionId);
    if (sessionTokenIds) {
      sessionTokenIds.forEach(tokenId => {
        this.tokens.delete(tokenId);
      });
      this.sessionTokens.delete(sessionId);
    }

    securityLogger.info('CSRF tokens invalidated for session', { sessionId });
  }

  /**
   * Get CSRF protection middleware
   */
  getMiddleware() {
    return (req: any, res: any, next: any) => {
      try {
        // Add CSRF token generation method
        req.generateCSRFToken = (requestPath?: string) => {
          return this.generateToken(
            req.sessionID,
            req.user?.id,
            requestPath,
            req.get('origin')
          );
        };

        // Skip validation for safe methods and whitelisted paths
        if (!this.isStatefulMethod(req.method) || this.shouldSkipPath(req.path)) {
          return next();
        }

        // Extract token from various sources
        const token = this.extractToken(req);
        if (!token) {
          return res.status(403).json({
            error: 'CSRF token missing',
            code: 'CSRF_TOKEN_MISSING'
          });
        }

        // Validate token
        const validation = this.validateToken(token, {
          sessionId: req.sessionID,
          method: req.method,
          path: req.path,
          origin: req.get('origin'),
          referer: req.get('referer'),
          userAgent: req.get('user-agent'),
          ipAddress: req.ip,
          userId: req.user?.id,
          headers: req.headers
        });

        if (!validation.valid) {
          return res.status(403).json({
            error: validation.reason || 'CSRF validation failed',
            code: 'CSRF_VALIDATION_FAILED'
          });
        }

        next();
      } catch (error) {
        securityLogger.error('CSRF middleware error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: req.path
        });
        
        return res.status(500).json({
          error: 'CSRF protection error',
          code: 'CSRF_PROTECTION_ERROR'
        });
      }
    };
  }

  /**
   * Get CSRF violation statistics
   */
  getViolationStats(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): {
    totalViolations: number;
    violationsByType: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    topPaths: Array<{ path: string; count: number }>;
    topIPs: Array<{ ip: string; count: number }>;
    trends: Array<{ date: string; count: number }>;
  } {
    const now = new Date();
    const timeframeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const cutoff = new Date(now.getTime() - timeframeMs);
    const recentViolations = this.violations.filter(
      v => new Date(v.timestamp) >= cutoff
    );

    const violationsByType = recentViolations.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const violationsBySeverity = recentViolations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pathCounts = recentViolations.reduce((acc, v) => {
      acc[v.requestPath] = (acc[v.requestPath] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ipCounts = recentViolations.reduce((acc, v) => {
      if (v.ipAddress) {
        acc[v.ipAddress] = (acc[v.ipAddress] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topPaths = Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    return {
      totalViolations: recentViolations.length,
      violationsByType,
      violationsBySeverity,
      topPaths,
      topIPs,
      trends: [] // Would implement trend calculation
    };
  }

  // Private helper methods
  private generateSecureToken(): string {
    return crypto.randomBytes(this.config.tokenLength).toString('hex');
  }

  private isStatefulMethod(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  }

  private shouldSkipPath(path: string): boolean {
    return this.config.skipPaths.some(skipPath => 
      path.startsWith(skipPath) || new RegExp(skipPath).test(path)
    );
  }

  private validateOrigin(origin: string): boolean {
    try {
      const url = new URL(origin);
      
      // Check against allowed origins
      if (this.config.allowedOrigins.length > 0) {
        return this.config.allowedOrigins.includes(origin);
      }

      // In development, allow localhost
      if (process.env.NODE_ENV === 'development') {
        return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      }

      // In production, would check against application domain
      return true; // Simplified for demo
    } catch {
      return false;
    }
  }

  private validateReferer(referer: string, origin?: string): boolean {
    try {
      const refererUrl = new URL(referer);
      
      if (origin) {
        const originUrl = new URL(origin);
        return refererUrl.origin === originUrl.origin;
      }

      return true; // Simplified validation
    } catch {
      return false;
    }
  }

  private extractToken(req: any): string | null {
    // Try different sources for CSRF token
    
    // 1. Custom header
    const headerToken = req.get(this.config.customHeaderName);
    if (headerToken) return headerToken;

    // 2. Form field
    const bodyToken = req.body?._csrf || req.body?.csrf_token;
    if (bodyToken) return bodyToken;

    // 3. Query parameter
    const queryToken = req.query?._csrf || req.query?.csrf_token;
    if (queryToken) return queryToken;

    return null;
  }

  private logViolation(violation: Omit<CSRFViolation, 'id' | 'timestamp'>): void {
    const fullViolation: CSRFViolation = {
      ...violation,
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString()
    };

    this.violations.push(fullViolation);

    securityLogger.logSecurityEvent('CSRF_VIOLATION' as any, `CSRF violation: ${violation.type}`, {
      userId: violation.userId,
      metadata: {
        type: violation.type,
        severity: violation.severity,
        path: violation.requestPath,
        method: violation.method,
        origin: violation.origin,
        referer: violation.referer,
        ipAddress: violation.ipAddress
      }
    });

    // Keep only last 1000 violations
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-1000);
    }
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [tokenId, token] of this.tokens.entries()) {
      if (now > token.expiresAt) {
        this.tokens.delete(tokenId);
        
        // Remove from session mapping
        const sessionTokens = this.sessionTokens.get(token.sessionId);
        if (sessionTokens) {
          sessionTokens.delete(tokenId);
          if (sessionTokens.size === 0) {
            this.sessionTokens.delete(token.sessionId);
          }
        }
        
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      securityLogger.info('CSRF tokens cleaned up', { cleanedCount });
    }
  }
}

// Export singleton instance
export const csrfProtection = new CSRFProtectionService();

// Export convenience functions
export const generateCSRFToken = (sessionId: string, userId?: string, requestPath?: string) =>
  csrfProtection.generateToken(sessionId, userId, requestPath);

export const validateCSRFToken = (
  token: string,
  request: {
    sessionId: string;
    method: string;
    path: string;
    origin?: string;
    referer?: string;
    userAgent?: string;
    ipAddress?: string;
    userId?: string;
    headers?: Record<string, string>;
  }
) => csrfProtection.validateToken(token, request);

export const getCSRFMiddleware = () => csrfProtection.getMiddleware();

export const getCSRFStats = (timeframe?: '1h' | '24h' | '7d' | '30d') =>
  csrfProtection.getViolationStats(timeframe);

export const invalidateCSRFSession = (sessionId: string) =>
  csrfProtection.invalidateSession(sessionId);

export default csrfProtection;