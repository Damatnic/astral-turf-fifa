/**
 * Input Validation Security Module
 *
 * Provides comprehensive input validation using Zod schemas to prevent
 * injection attacks, validate data integrity, and ensure type safety.
 */

import { z } from 'zod';
import validator from 'validator';
import { VALIDATION_CONFIG, PASSWORD_CONFIG } from './config';
import { securityLogger } from './logging';
import type { UserRole } from '../types';

// Base validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(
    VALIDATION_CONFIG.MAX_EMAIL_LENGTH,
    `Email must be less than ${VALIDATION_CONFIG.MAX_EMAIL_LENGTH} characters`,
  )
  .email('Invalid email format')
  .refine(email => VALIDATION_CONFIG.EMAIL_REGEX.test(email), 'Invalid email format')
  .transform(email => email.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(
    PASSWORD_CONFIG.MIN_LENGTH,
    `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`,
  )
  .max(
    PASSWORD_CONFIG.MAX_LENGTH,
    `Password must be less than ${PASSWORD_CONFIG.MAX_LENGTH} characters`,
  )
  .refine(
    password => {
      if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
        return false;
      }
      if (PASSWORD_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
        return false;
      }
      if (PASSWORD_CONFIG.REQUIRE_NUMBERS && !/\d/.test(password)) {
        return false;
      }
      if (PASSWORD_CONFIG.REQUIRE_SPECIAL_CHARS) {
        const specialCharsRegex = new RegExp(
          `[${PASSWORD_CONFIG.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`,
        );
        if (!specialCharsRegex.test(password)) {
          return false;
        }
      }
      return true;
    },
    {
      message: `Password must contain ${PASSWORD_CONFIG.REQUIRE_UPPERCASE ? 'uppercase, ' : ''}${PASSWORD_CONFIG.REQUIRE_LOWERCASE ? 'lowercase, ' : ''}${PASSWORD_CONFIG.REQUIRE_NUMBERS ? 'numbers, ' : ''}${PASSWORD_CONFIG.REQUIRE_SPECIAL_CHARS ? 'special characters' : ''}`,
    },
  );

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(
    VALIDATION_CONFIG.MAX_NAME_LENGTH,
    `Name must be less than ${VALIDATION_CONFIG.MAX_NAME_LENGTH} characters`,
  )
  .refine(name => VALIDATION_CONFIG.NAME_REGEX.test(name), 'Name contains invalid characters')
  .transform(name => name.trim());

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    phone => !phone || VALIDATION_CONFIG.PHONE_REGEX.test(phone),
    'Invalid phone number format',
  )
  .transform(phone => phone?.trim());

export const userRoleSchema = z.enum(['coach', 'player', 'family'] as const);

export const messageSchema = z
  .string()
  .min(1, 'Message is required')
  .max(
    VALIDATION_CONFIG.MAX_MESSAGE_LENGTH,
    `Message must be less than ${VALIDATION_CONFIG.MAX_MESSAGE_LENGTH} characters`,
  )
  .transform(message => message.trim());

export const descriptionSchema = z
  .string()
  .max(
    VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH,
    `Description must be less than ${VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH} characters`,
  )
  .optional()
  .transform(description => description?.trim());

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    role: userRoleSchema,
    phoneNumber: phoneSchema,
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Player-related schemas
export const playerAttributeSchema = z.object({
  speed: z.number().min(0).max(100),
  passing: z.number().min(0).max(100),
  tackling: z.number().min(0).max(100),
  shooting: z.number().min(0).max(100),
  dribbling: z.number().min(0).max(100),
  positioning: z.number().min(0).max(100),
  stamina: z.number().min(0).max(100),
});

export const playerUpdateSchema = z.object({
  name: nameSchema.optional(),
  jerseyNumber: z.number().min(1).max(99).optional(),
  age: z.number().min(16).max(50).optional(),
  nationality: nameSchema.optional(),
  attributes: playerAttributeSchema.partial().optional(),
  notes: descriptionSchema,
});

// Chat and AI interaction schemas
export const chatMessageSchema = z.object({
  message: messageSchema,
  playerId: z.string().uuid().optional(),
  context: z.string().optional(),
});

export const aiPromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt is too long'),
  context: z.record(z.any()).optional(),
  playerId: z.string().uuid().optional(),
});

// Formation and tactics schemas - Enhanced for Guardian Security
export const positionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const alternativePositionSchema = z.array(positionSchema).max(3);

export const tacticalInstructionSchema = z.object({
  type: z.enum(['defensive', 'offensive', 'set_piece', 'transition']),
  phase: z.enum(['build_up', 'attack', 'defense', 'set_piece']),
  instruction: z
    .string()
    .min(1)
    .max(500)
    .refine(
      instruction => !detectXss(instruction) && !detectSqlInjection(instruction),
      'Instruction contains potentially dangerous content',
    ),
  priority: z.enum(['high', 'medium', 'low']),
  playerIds: z.array(z.string().uuid()).optional(),
});

export const playerPositionSchema = z.object({
  playerId: z.string().uuid(),
  position: positionSchema,
  role: z
    .string()
    .min(1)
    .max(50)
    .refine(
      role => !detectXss(role) && /^[a-zA-Z0-9\s-_]+$/.test(role),
      'Role contains invalid characters',
    ),
  instructions: z.array(z.string().max(200)).max(10),
  alternativePositions: alternativePositionSchema.optional(),
});

export const opponentAnalysisSchema = z.object({
  opponentTeam: nameSchema,
  weaknesses: z.array(z.string().max(200)).max(10),
  strengths: z.array(z.string().max(200)).max(10),
  keyPlayers: z.array(z.string().max(100)).max(15),
  recommendedCounterTactics: z.array(z.string().max(300)).max(10),
  confidenceLevel: z.number().min(0).max(1),
});

export const formationMetadataSchema = z.object({
  version: z.number().int().positive(),
  lastModified: z.string().datetime(),
  modifiedBy: z.string().uuid(),
  accessCount: z.number().int().min(0),
  sharedWith: z.array(z.string().uuid()).max(50),
  tags: z.array(z.string().max(50)).max(20),
  effectivenessRating: z.number().min(0).max(10).optional(),
});

export const tacticalClassificationSchema = z.enum([
  'public_formation',
  'team_internal',
  'coach_confidential',
  'strategic_secret',
]);

export const formationSlotSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['GK', 'DF', 'MF', 'FW']),
  defaultPosition: positionSchema,
  playerId: z.string().uuid().nullable(),
});

export const tacticalFormationSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1)
    .max(100)
    .refine(
      name => !detectXss(name) && !detectSqlInjection(name),
      'Formation name contains potentially dangerous content',
    ),
  description: z
    .string()
    .max(1000)
    .optional()
    .refine(
      desc => !desc || (!detectXss(desc) && !detectSqlInjection(desc)),
      'Formation description contains potentially dangerous content',
    ),
  formation: z.string().regex(/^\d+-\d+(-\d+)*$/, 'Invalid formation format'),
  playerPositions: z.array(playerPositionSchema).min(1).max(11),
  tacticalInstructions: z.array(tacticalInstructionSchema).max(20),
  opponentAnalysis: opponentAnalysisSchema.optional(),
  classification: tacticalClassificationSchema,
  createdBy: z.string().uuid(),
  teamId: z.string().uuid(),
  matchId: z.string().uuid().optional(),
  isActive: z.boolean(),
  metadata: formationMetadataSchema,
});

export const formationSchema = z.object({
  id: z.string().min(1),
  name: nameSchema,
  slots: z.array(formationSlotSchema),
  isCustom: z.boolean().optional(),
  notes: descriptionSchema,
});

// Tactical drawing and annotation schemas
export const drawingPointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  timestamp: z.number().positive(),
});

export const drawingLineSchema = z.object({
  id: z.string().uuid(),
  points: z.array(drawingPointSchema).min(2).max(1000),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  thickness: z.number().min(1).max(10),
  type: z.enum(['arrow', 'line', 'curve', 'highlight']),
  createdBy: z.string().uuid(),
  timestamp: z.string().datetime(),
});

export const tacticalAnnotationSchema = z.object({
  id: z.string().uuid(),
  position: positionSchema,
  text: z
    .string()
    .min(1)
    .max(200)
    .refine(
      text => !detectXss(text) && !detectSqlInjection(text),
      'Annotation contains potentially dangerous content',
    ),
  type: z.enum(['note', 'instruction', 'warning', 'highlight']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  fontSize: z.number().min(8).max(24),
  createdBy: z.string().uuid(),
  timestamp: z.string().datetime(),
  visibility: z.enum(['public', 'team', 'coaches_only']),
});

// Tactical export/import schemas
export const tacticalExportSchema = z.object({
  format: z.enum(['json', 'xml', 'pdf', 'image']),
  includePlayerNames: z.boolean(),
  includeInstructions: z.boolean(),
  includeAnalysis: z.boolean(),
  exportLevel: z.enum(['public', 'team', 'coach']),
  password: z.string().min(8).max(50).optional(),
});

export const tacticalImportSchema = z.object({
  data: z.unknown(),
  format: z.enum(['json', 'xml']),
  validateSignature: z.boolean().default(true),
  sanitizeContent: z.boolean().default(true),
  maxFileSize: z.number().max(10 * 1024 * 1024), // 10MB max
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      file => file.size <= VALIDATION_CONFIG.MAX_FILE_SIZE,
      `File size must be less than ${VALIDATION_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
    )
    .refine(
      file => VALIDATION_CONFIG.ALLOWED_FILE_TYPES.includes(file.type as any),
      'Invalid file type',
    ),
});

// Search and filter schemas
export const searchQuerySchema = z
  .string()
  .max(100, 'Search query too long')
  .transform(query => query.trim())
  .refine(
    query => !/[<>"]/.test(query), // Prevent basic XSS attempts
    'Search query contains invalid characters',
  );

// ID validation schemas
export const uuidSchema = z.string().uuid('Invalid ID format');
export const playerIdSchema = uuidSchema;
export const formationIdSchema = z.string().min(1, 'Formation ID is required');

/**
 * Validation utilities
 */

// Validate and sanitize input data
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const errors = _error.errors.map(err => `${err.path.join('.')}: ${err.message}`);

      securityLogger.warn('Input validation failed', {
        errors,
        input: typeof data === 'object' ? Object.keys(data as object) : typeof data,
      });

      return { success: false, errors };
    }

    securityLogger.error('Unexpected validation error', {
      error: _error instanceof Error ? _error.message : 'Unknown error',
    });

    return { success: false, errors: ['Validation error occurred'] };
  }
}

// Validate email format with additional security checks
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Use validator.js for robust email validation
  if (!validator.isEmail(email)) {
    return false;
  }

  // Additional checks for security
  const trimmedEmail = email.trim().toLowerCase();

  // Check for common malicious patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /onclick/i,
    /onerror/i,
  ];

  if (maliciousPatterns.some(pattern => pattern.test(trimmedEmail))) {
    securityLogger.warn('Potentially malicious email detected', { email: trimmedEmail });
    return false;
  }

  return VALIDATION_CONFIG.EMAIL_REGEX.test(trimmedEmail);
}

// Validate URL format
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    // Validate using validator.js
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
    });
  } catch {
    return false;
  }
}

// Validate JSON input
export function validateJson(jsonString: string): {
  valid: boolean;
  data?: unknown;
  error?: string;
} {
  if (!jsonString || typeof jsonString !== 'string') {
    return { valid: false, error: 'Invalid JSON input' };
  }

  try {
    const data = JSON.parse(jsonString);

    // Check for dangerous properties
    if (typeof data === 'object' && data !== null) {
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      const hassDangerousKeys = dangerousKeys.some(key => key in data);

      if (hassDangerousKeys) {
        securityLogger.warn('JSON with dangerous keys detected', { keys: Object.keys(data) });
        return { valid: false, error: 'JSON contains dangerous properties' };
      }
    }

    return { valid: true, data };
  } catch (_error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
}

// Rate limiting key generator
export function generateRateLimitKey(identifier: string, action: string): string {
  return `rate_limit:${action}:${identifier}`;
}

// Validate rate limiting parameters
export function validateRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }
  if (!Number.isInteger(maxRequests) || maxRequests <= 0) {
    return false;
  }
  if (!Number.isInteger(windowMs) || windowMs <= 0) {
    return false;
  }

  return true;
}

// SQL injection detection (basic patterns)
export function detectSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bupdate\b|\bdrop\b|\btruncate\b|\balter\b)/i,
    /(\bor\b|\band\b)\s*\d+\s*=\s*\d+/i,
    /['"]\s*;\s*--/,
    /\/\*.*\*\//,
    /\bxp_\w+/i,
    /\bsp_\w+/i,
  ];

  const detected = sqlPatterns.some(pattern => pattern.test(input));

  if (detected) {
    securityLogger.warn('Potential SQL injection attempt detected', {
      input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
    });
  }

  return detected;
}

// XSS detection (basic patterns)
export function detectXss(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  ];

  const detected = xssPatterns.some(pattern => pattern.test(input));

  if (detected) {
    securityLogger.warn('Potential XSS attempt detected', {
      input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
    });
  }

  return detected;
}

// Comprehensive input sanitization
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Escape HTML entities
  sanitized = validator.escape(sanitized);

  return sanitized;
}

// Guardian tactical validation utilities
export function validateAndSanitize(
  data: unknown,
  options: {
    allowedFields?: string[];
    sanitizeStrings?: boolean;
    maxStringLength?: number;
    maxDepth?: number;
    depth?: number;
  } = {},
): unknown {
  const {
    allowedFields,
    sanitizeStrings = true,
    maxStringLength = 10000,
    maxDepth = 10,
    depth = 0,
  } = options;

  if (depth > maxDepth) {
    throw new Error('Maximum object depth exceeded');
  }

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    if (data.length > maxStringLength) {
      throw new Error(`String length exceeds maximum of ${maxStringLength}`);
    }

    if (detectXss(data) || detectSqlInjection(data)) {
      throw new Error('String contains potentially dangerous content');
    }

    return sanitizeStrings ? sanitizeInput(data) : data;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => validateAndSanitize(item, { ...options, depth: depth + 1 }));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip dangerous prototype properties
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        continue;
      }

      // Check allowed fields if specified
      if (allowedFields && !allowedFields.includes(key)) {
        continue;
      }

      // Validate and sanitize key
      if (detectXss(key) || detectSqlInjection(key)) {
        throw new Error(`Object key '${key}' contains potentially dangerous content`);
      }

      sanitized[key] = validateAndSanitize(value, { ...options, depth: depth + 1 });
    }

    return sanitized;
  }

  return data;
}

// Advanced tactical data validation
export function validateTacticalData(
  data: unknown,
  type: 'formation' | 'drawing' | 'annotation' | 'export' | 'import',
): { valid: boolean; errors: string[]; sanitizedData?: unknown } {
  const errors: string[] = [];

  try {
    let schema: z.ZodSchema;

    switch (type) {
      case 'formation':
        schema = tacticalFormationSchema;
        break;
      case 'drawing':
        schema = drawingLineSchema;
        break;
      case 'annotation':
        schema = tacticalAnnotationSchema;
        break;
      case 'export':
        schema = tacticalExportSchema;
        break;
      case 'import':
        schema = tacticalImportSchema;
        break;
      default:
        throw new Error(`Unknown tactical data type: ${type}`);
    }

    const result = schema.parse(data);
    return { valid: true, errors: [], sanitizedData: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(err => `${err.path.join('.')}: ${err.message}`));
    } else {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
    }

    securityLogger.warn(`Tactical data validation failed for type: ${type}`, {
      errors,
      dataType: typeof data,
    });

    return { valid: false, errors };
  }
}

// Export all validation schemas for use in components
export const validationSchemas = {
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema,
  userRole: userRoleSchema,
  message: messageSchema,
  description: descriptionSchema,
  login: loginSchema,
  signup: signupSchema,
  passwordResetRequest: passwordResetRequestSchema,
  passwordReset: passwordResetSchema,
  changePassword: changePasswordSchema,
  playerAttribute: playerAttributeSchema,
  playerUpdate: playerUpdateSchema,
  chatMessage: chatMessageSchema,
  aiPrompt: aiPromptSchema,
  position: positionSchema,
  formationSlot: formationSlotSchema,
  formation: formationSchema,
  fileUpload: fileUploadSchema,
  searchQuery: searchQuerySchema,
  uuid: uuidSchema,
  playerId: playerIdSchema,
  formationId: formationIdSchema,
  // Guardian tactical schemas
  tacticalFormation: tacticalFormationSchema,
  playerPosition: playerPositionSchema,
  tacticalInstruction: tacticalInstructionSchema,
  opponentAnalysis: opponentAnalysisSchema,
  drawingLine: drawingLineSchema,
  tacticalAnnotation: tacticalAnnotationSchema,
  tacticalExport: tacticalExportSchema,
  tacticalImport: tacticalImportSchema,
  tacticalClassification: tacticalClassificationSchema,
};
