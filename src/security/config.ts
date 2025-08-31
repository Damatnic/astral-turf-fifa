/**
 * Security Configuration - Enterprise Security Settings
 *
 * Centralized configuration for all security-related settings including
 * JWT tokens, password policies, rate limiting, and security headers.
 */

// JWT Configuration
export const JWT_CONFIG = {
  // Use secure secret in production (from environment variables)
  SECRET: process.env.JWT_SECRET || 'astral-turf-super-secure-jwt-secret-key-2024',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'astral-turf-refresh-secret-key-2024',

  // Token expiration times
  ACCESS_TOKEN_EXPIRES_IN: '15m', // Short-lived access tokens
  REFRESH_TOKEN_EXPIRES_IN: '7d', // Longer-lived refresh tokens

  // Token issuer and audience
  ISSUER: 'astral-turf-app',
  AUDIENCE: 'astral-turf-users',

  // Algorithm for signing tokens
  ALGORITHM: 'HS256' as const,
} as const;

// Password Security Configuration
export const PASSWORD_CONFIG = {
  // Minimum password requirements
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,

  // Password complexity requirements
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,

  // Special characters allowed
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',

  // bcrypt rounds for hashing (higher = more secure but slower)
  BCRYPT_ROUNDS: 12,

  // Password history to prevent reuse
  HISTORY_LENGTH: 5,
} as const;

// Session Security Configuration
export const SESSION_CONFIG = {
  // Session timeout (in milliseconds)
  TIMEOUT: 30 * 60 * 1000, // 30 minutes

  // Maximum concurrent sessions per user
  MAX_CONCURRENT_SESSIONS: 3,

  // Session cookie settings
  COOKIE_NAME: 'astral-turf-session',
  COOKIE_SECURE: true, // Only send over HTTPS in production
  COOKIE_HTTP_ONLY: true, // Prevent XSS access to cookies
  COOKIE_SAME_SITE: 'strict' as const,
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  // Login attempts
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    BLOCK_DURATION: 30 * 60 * 1000, // 30 minutes
  },

  // API requests
  API_REQUESTS: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60 * 1000, // 1 minute
  },

  // Password reset requests
  PASSWORD_RESET: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
} as const;

// Content Security Policy Configuration
export const CSP_CONFIG = {
  // Allowed sources for different content types
  DEFAULT_SRC: ["'self'"],
  SCRIPT_SRC: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  STYLE_SRC: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  FONT_SRC: ["'self'", "https://fonts.gstatic.com"],
  IMG_SRC: ["'self'", "data:", "blob:"],
  CONNECT_SRC: ["'self'", "https://api.gemini.google.com"],
  FRAME_SRC: ["'none'"],
  OBJECT_SRC: ["'none'"],
  BASE_URI: ["'self'"],
  FORM_ACTION: ["'self'"],
  FRAME_ANCESTORS: ["'none'"],
  UPGRADE_INSECURE_REQUESTS: true,
} as const;

// Security Headers Configuration
export const SECURITY_HEADERS = {
  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS Protection
  'X-XSS-Protection': '1; mode=block',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

  // Remove server information
  'X-Powered-By': '', // Remove this header
} as const;

// Input Validation Configuration
export const VALIDATION_CONFIG = {
  // Maximum input lengths
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_DESCRIPTION_LENGTH: 500,

  // Allowed file types for uploads
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],

  // Maximum file size (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  // Regex patterns for validation
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  NAME_REGEX: /^[a-zA-Z\s\-'\.]+$/,
} as const;

// Audit Logging Configuration
export const AUDIT_CONFIG = {
  // Log levels
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
  } as const,

  // Events to log
  SECURITY_EVENTS: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    DATA_ACCESS: 'DATA_ACCESS',
    DATA_MODIFICATION: 'DATA_MODIFICATION',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
  } as const,

  // Retention period for logs
  LOG_RETENTION_DAYS: 90,
} as const;

// Data Protection Configuration
export const DATA_PROTECTION_CONFIG = {
  // Encryption settings
  ENCRYPTION_ALGORITHM: 'AES-256-GCM',
  KEY_LENGTH: 32, // 256 bits
  IV_LENGTH: 16, // 128 bits

  // Data classification levels
  DATA_LEVELS: {
    PUBLIC: 'public',
    INTERNAL: 'internal',
    CONFIDENTIAL: 'confidential',
    RESTRICTED: 'restricted',
  } as const,

  // Fields that require encryption
  ENCRYPTED_FIELDS: [
    'password',
    'personalInfo',
    'medicalData',
    'financialInfo',
    'contactDetails',
  ] as const,

  // GDPR compliance settings
  GDPR: {
    DATA_RETENTION_YEARS: 7,
    CONSENT_VERSION: '1.0',
    PRIVACY_POLICY_VERSION: '1.0',
  },
} as const;

// Environment-specific security settings
export const ENVIRONMENT_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Enable/disable security features based on environment
  ENABLE_RATE_LIMITING: process.env.NODE_ENV !== 'development',
  ENABLE_HTTPS_ONLY: process.env.NODE_ENV === 'production',
  ENABLE_AUDIT_LOGGING: true,
  ENABLE_CSP: true,

  // Development-only settings
  ALLOW_HTTP: process.env.NODE_ENV === 'development',
  VERBOSE_ERRORS: process.env.NODE_ENV === 'development',
} as const;