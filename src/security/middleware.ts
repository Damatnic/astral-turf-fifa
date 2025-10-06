/**
 * Security Middleware System
 *
 * Comprehensive security middleware for XSS protection, CSRF prevention,
 * injection attack mitigation, and request sanitization.
 */

import DOMPurify from 'dompurify';
import { validateInput, detectSqlInjection, detectXss } from './validation';
import { sanitizeUserInput } from './sanitization';
import { securityLogger, SecurityEventType } from './logging';
import { generateSecureToken, generateUUID } from './encryption';
import { checkRateLimit } from './monitoring';

// Security middleware options
export interface SecurityMiddlewareOptions {
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableSQLInjectionProtection: boolean;
  enableRateLimiting: boolean;
  enableInputSanitization: boolean;
  enableContentSecurityPolicy: boolean;
  trustedOrigins: string[];
  maxRequestSize: number;
  logSecurityEvents: boolean;
}

// Default security options
const DEFAULT_SECURITY_OPTIONS: SecurityMiddlewareOptions = {
  enableXSSProtection: true,
  enableCSRFProtection: true,
  enableSQLInjectionProtection: true,
  enableRateLimiting: true,
  enableInputSanitization: true,
  enableContentSecurityPolicy: true,
  trustedOrigins: ['http://localhost:3000', 'https://astral-turf.vercel.app'],
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  logSecurityEvents: true,
};

// CSRF token storage (in production, use Redis or database)
const csrfTokens = new Map<string, { token: string; expires: number; used: boolean }>();

// Security headers for responses
export const SECURITY_HEADERS = {
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',

  // HTTPS and transport security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

  // Cross-origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
} as const;

// Content Security Policy builder
export function buildCSP(options: Partial<SecurityMiddlewareOptions> = {}): string {
  const opts = { ...DEFAULT_SECURITY_OPTIONS, ...options };

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.gemini.google.com wss:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'block-all-mixed-content',
    'upgrade-insecure-requests',
  ];

  return cspDirectives.join('; ');
}

/**
 * XSS Protection Middleware
 */

// XSS protection patterns
const XSS_PATTERNS = [
  // Script tags
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  // Event handlers
  /on\w+\s*=\s*["'][^"']*["']/gi,
  // JavaScript URLs
  /javascript\s*:/gi,
  // Data URLs with scripts
  /data\s*:\s*text\/html/gi,
  // SVG with scripts
  /<svg[^>]*>[\s\S]*?<script[\s\S]*?<\/script>[\s\S]*?<\/svg>/gi,
  // CSS expressions
  /expression\s*\(/gi,
  // Import statements
  /@import\s+url\s*\(/gi,
];

export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Use DOMPurify for comprehensive XSS protection
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });

  return clean;
}

export function detectAndBlockXSS(input: string, context: string = 'unknown'): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  // Check for XSS patterns
  const detected = XSS_PATTERNS.some(pattern => pattern.test(input));

  if (detected) {
    securityLogger.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      'XSS attempt detected and blocked',
      {
        metadata: {
          context,
          input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
          patterns: XSS_PATTERNS.filter(p => p.test(input)).map(p => p.toString()),
        },
      }
    );

    // Return sanitized version
    return sanitizeHTML(input);
  }

  return input;
}

/**
 * CSRF Protection Middleware
 */

// Generate CSRF token
export function generateCSRFToken(sessionId: string): string {
  const token = generateSecureToken(32);
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour

  csrfTokens.set(sessionId, {
    token,
    expires,
    used: false,
  });

  securityLogger.info('CSRF token generated', { sessionId });

  return token;
}

// Verify CSRF token
export function verifyCSRFToken(sessionId: string, token: string): boolean {
  const storedData = csrfTokens.get(sessionId);

  if (!storedData) {
    securityLogger.warn('CSRF token verification failed - no token found', { sessionId });
    return false;
  }

  if (storedData.used) {
    securityLogger.warn('CSRF token verification failed - token already used', { sessionId });
    return false;
  }

  if (Date.now() > storedData.expires) {
    csrfTokens.delete(sessionId);
    securityLogger.warn('CSRF token verification failed - token expired', { sessionId });
    return false;
  }

  if (storedData.token !== token) {
    securityLogger.warn('CSRF token verification failed - token mismatch', { sessionId });
    return false;
  }

  // Mark token as used (one-time use)
  storedData.used = true;

  securityLogger.info('CSRF token verified successfully', { sessionId });
  return true;
}

// Clean up expired CSRF tokens
export function cleanupExpiredCSRFTokens(): void {
  const now = Date.now();
  const expiredTokens: string[] = [];

  csrfTokens.forEach((data, sessionId) => {
    if (now > data.expires || data.used) {
      expiredTokens.push(sessionId);
    }
  });

  expiredTokens.forEach(sessionId => {
    csrfTokens.delete(sessionId);
  });

  if (expiredTokens.length > 0) {
    securityLogger.info('Expired CSRF tokens cleaned up', { count: expiredTokens.length });
  }
}

// Start CSRF cleanup interval
setInterval(cleanupExpiredCSRFTokens, 10 * 60 * 1000); // Every 10 minutes

/**
 * SQL Injection Protection Middleware
 */

// Enhanced SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  // Union-based attacks
  /(\bunion\b[\s\S]*\bselect\b)/i,

  // Boolean-based blind attacks
  /(\bor\b|\band\b)\s*\d+\s*[=<>]\s*\d+/i,

  // Time-based attacks
  /\b(sleep|benchmark|waitfor)\s*\(/i,

  // Stacked queries
  /[';]\s*(insert|update|delete|drop|create|alter)\b/i,

  // Comment-based attacks
  /(--|\#|\/\*|\*\/)/,

  // Database-specific functions
  /\b(xp_cmdshell|sp_executesql|exec|execute)\b/i,

  // Information schema queries
  /\b(information_schema|sys\.tables|pg_tables)\b/i,

  // Error-based attacks
  /\b(extractvalue|updatexml|exp|floor|rand)\s*\(/i,
];

export function detectAndBlockSQLInjection(input: string, fieldName: string = 'unknown'): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  const detected = SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));

  if (detected) {
    securityLogger.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      'SQL injection attempt detected and blocked',
      {
        metadata: {
          fieldName,
          input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
          patterns: SQL_INJECTION_PATTERNS.filter(p => p.test(input)).map(p => p.toString()),
        },
      }
    );

    // Return sanitized version (escape special characters)
    return input
      .replace(/'/g, "''")
      .replace(/"/g, '""')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/--/g, '\\--')
      .replace(/\/\*/g, '\\/\\*')
      .replace(/\*\//g, '\\*\\/');
  }

  return input;
}

/**
 * Request Sanitization Middleware
 */

export interface SanitizedRequest {
  body: any;
  query: any;
  params: any;
  headers: any;
  sanitized: boolean;
  securityFlags: string[];
}

export function sanitizeRequest(
  request: any,
  options: SecurityMiddlewareOptions = DEFAULT_SECURITY_OPTIONS
): SanitizedRequest {
  const securityFlags: string[] = [];

  const sanitized: SanitizedRequest = {
    body: {},
    query: {},
    params: {},
    headers: {},
    sanitized: true,
    securityFlags,
  };

  // Sanitize request body
  if (request.body && typeof request.body === 'object') {
    sanitized.body = sanitizeObject(request.body, options, 'body', securityFlags);
  }

  // Sanitize query parameters
  if (request.query && typeof request.query === 'object') {
    sanitized.query = sanitizeObject(request.query, options, 'query', securityFlags);
  }

  // Sanitize route parameters
  if (request.params && typeof request.params === 'object') {
    sanitized.params = sanitizeObject(request.params, options, 'params', securityFlags);
  }

  // Sanitize headers (selective)
  if (request.headers && typeof request.headers === 'object') {
    sanitized.headers = sanitizeHeaders(request.headers, securityFlags);
  }

  // Log security events if any flags were raised
  if (securityFlags.length > 0) {
    securityLogger.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      'Security issues detected in request',
      {
        metadata: {
          flags: securityFlags,
          url: request.url || 'unknown',
          method: request.method || 'unknown',
        },
      }
    );
  }

  return sanitized;
}

function sanitizeObject(
  obj: any,
  options: SecurityMiddlewareOptions,
  context: string,
  flags: string[]
): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      let sanitizedValue = value;

      // XSS protection
      if (options.enableXSSProtection) {
        const xssClean = detectAndBlockXSS(sanitizedValue, `${context}.${key}`);
        if (xssClean !== sanitizedValue) {
          flags.push(`xss_${context}_${key}`);
          sanitizedValue = xssClean;
        }
      }

      // SQL injection protection
      if (options.enableSQLInjectionProtection) {
        const sqlClean = detectAndBlockSQLInjection(sanitizedValue, `${context}.${key}`);
        if (sqlClean !== sanitizedValue) {
          flags.push(`sql_${context}_${key}`);
          sanitizedValue = sqlClean;
        }
      }

      // Input sanitization
      if (options.enableInputSanitization) {
        sanitizedValue = sanitizeUserInput(sanitizedValue);
      }

      sanitized[key] = sanitizedValue;
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, options, `${context}.${key}`, flags);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function sanitizeHeaders(headers: any, flags: string[]): any {
  const sanitized: any = {};
  const allowedHeaders = [
    'content-type',
    'authorization',
    'user-agent',
    'accept',
    'accept-language',
    'cache-control',
    'x-csrf-token',
    'x-requested-with',
  ];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    if (allowedHeaders.includes(lowerKey)) {
      if (typeof value === 'string') {
        // Basic sanitization for headers
        const cleanValue = value.replace(/[\r\n]/g, '').substring(0, 1000);
        sanitized[key] = cleanValue;
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Rate Limiting Middleware
 */

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (request: any) => string;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  onLimitReached?: (key: string) => void;
}

const DEFAULT_RATE_LIMIT_OPTIONS: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyGenerator: req => req.ip || 'unknown',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

export function createRateLimiter(options: Partial<RateLimitOptions> = {}) {
  const opts = { ...DEFAULT_RATE_LIMIT_OPTIONS, ...options };

  return (request: any): boolean => {
    const key = opts.keyGenerator(request);
    const isLimited = checkRateLimit(key, opts.maxRequests, opts.windowMs);

    if (isLimited) {
      securityLogger.logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        'Rate limit exceeded',
        {
          metadata: {
            key,
            maxRequests: opts.maxRequests,
            windowMs: opts.windowMs,
            url: request.url || 'unknown',
          },
        }
      );

      if (opts.onLimitReached) {
        opts.onLimitReached(key);
      }

      return false; // Request should be blocked
    }

    return true; // Request allowed
  };
}

/**
 * Main Security Middleware Factory
 */

export function createSecurityMiddleware(options: Partial<SecurityMiddlewareOptions> = {}) {
  const opts = { ...DEFAULT_SECURITY_OPTIONS, ...options };
  const rateLimiter = createRateLimiter();

  return {
    // Process incoming request
    processRequest: (request: any) => {
      const requestId = generateUUID();

      // Rate limiting check
      if (opts.enableRateLimiting && !rateLimiter(request)) {
        throw new Error('Rate limit exceeded');
      }

      // Request size check
      if (request.body && JSON.stringify(request.body).length > opts.maxRequestSize) {
        securityLogger.logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          'Request size limit exceeded',
          { metadata: { requestId, size: JSON.stringify(request.body).length } }
        );
        throw new Error('Request too large');
      }

      // CSRF protection for state-changing operations
      if (
        opts.enableCSRFProtection &&
        ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)
      ) {
        const csrfToken = request.headers['x-csrf-token'];
        const sessionId = request.sessionId || 'unknown';

        if (!csrfToken || !verifyCSRFToken(sessionId, csrfToken)) {
          throw new Error('CSRF token validation failed');
        }
      }

      // Sanitize request
      const sanitizedRequest = sanitizeRequest(request, opts);

      return {
        requestId,
        sanitized: sanitizedRequest,
        securityHeaders: {
          ...SECURITY_HEADERS,
          'Content-Security-Policy': buildCSP(opts),
          'X-Request-ID': requestId,
        },
      };
    },

    // Generate CSRF token for client
    generateCSRFToken: (sessionId: string) => generateCSRFToken(sessionId),

    // Validate origin
    validateOrigin: (origin: string) => {
      return opts.trustedOrigins.includes(origin) || origin === 'null'; // null for same-origin
    },

    // Security headers
    getSecurityHeaders: () => ({
      ...SECURITY_HEADERS,
      'Content-Security-Policy': buildCSP(opts),
    }),
  };
}

// Export utility functions
export const securityMiddleware = {
  createSecurityMiddleware,
  sanitizeHTML,
  detectAndBlockXSS,
  generateCSRFToken,
  verifyCSRFToken,
  detectAndBlockSQLInjection,
  sanitizeRequest,
  createRateLimiter,
  buildCSP,
  SECURITY_HEADERS,
};
