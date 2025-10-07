/**
 * Comprehensive Input Validation Middleware
 *
   private sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /('|(\\')|;|(\\\\)|(\\\\\\\\))/gi,
    /(((%27)|')\s*((%6F)|o|(%4F))\s*((%72)|r|(%52)))/gi,
    /exec(\s|\+)+(s|x)p\w+/gi,
    /UNION(?:\s+ALL)?\s+SELECT/gi,
  ];ction-ready input validation and sanitization middleware
 * with threat detection, rate limiting, and comprehensive logging.
 */

import Joi from 'joi';
import validator from 'validator';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import type { Request, Response, NextFunction } from 'express';
import { log, SecurityEventType } from '../services/loggingService';
import { rateLimit } from '../services/redisService';

// Initialize DOMPurify with JSDOM for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window);

export interface ValidationContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: string[];
  sanitized?: T;
  threats?: ThreatDetection[];
}

export interface ThreatDetection {
  type:
    | 'xss'
    | 'sql_injection'
    | 'path_traversal'
    | 'command_injection'
    | 'script_injection'
    | 'html_injection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  field: string;
  originalValue: string;
  sanitizedValue: string;
  pattern: string;
  description: string;
}

/**
 * Advanced Input Validation and Sanitization Service
 */
class ValidationService {
  private sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /('|(\\')|(;)|(\\\\)|(\\\\\\\\))/gi,
    /((\%27)|(\'))\s*((\%6F)|o|(\%4F))\s*((\%72)|r|(\%52))/gi,
    /exec(\s|\+)+(s|x)p\w+/gi,
    /UNION(?:\s+ALL)?\s+SELECT/gi,
  ];

  private xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^>]*>/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
  ];

  private pathTraversalPatterns = [
    /\.\.[\/\\]/g,
    /\.\.[\\\/]/g,
    /%2e%2e[\/\\]/gi,
    /%2e%2e[\\\/]/gi,
    /\.\.\\/g,
    /\.\.\//g,
  ];

  private commandInjectionPatterns = [
    /[;&|`$(){}]/g,
    /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|curl|wget|nc|ncat|telnet|ssh)\b/gi,
    /\|\s*(rm|del|format|fdisk)/gi,
  ];

  /**
   * Comprehensive input validation with threat detection
   */
  async validateInput<T = unknown>(
    schema: Joi.ObjectSchema<T>,
    data: unknown,
    context?: ValidationContext,
  ): Promise<ValidationResult<T>> {
    const startTime = Date.now();
    const result: ValidationResult<T> = {
      success: false,
      errors: [],
      threats: [],
    };

    try {
      // Rate limiting for validation requests
      if (context?.ipAddress) {
        const rateLimitResult = await rateLimit.check(
          `validation:${context.ipAddress}`,
          100, // 100 validation requests
          60, // per minute
        );

        if (!rateLimitResult.allowed) {
          log.security(SecurityEventType.RATE_LIMIT_EXCEEDED, 'Validation rate limit exceeded', {
            userId: context.userId,
            ipAddress: context.ipAddress,
            severity: 'medium',
            metadata: { endpoint: context.endpoint },
          });

          result.errors.push('Rate limit exceeded. Please try again later.');
          return result;
        }
      }

      // Step 1: Basic Joi validation
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        result.errors = error.details.map(detail => detail.message);

        log.warn('Input validation failed', {
          userId: context?.userId,
          metadata: {
            endpoint: context?.endpoint,
            errors: result.errors,
            validationDuration: Date.now() - startTime,
          },
        });

        return result;
      }

      // Step 2: Threat detection and sanitization
      const { sanitizedData, threats } = await this.detectThreatsAndSanitize(value, context);

      result.data = value as T;
      result.sanitized = sanitizedData as T;
      result.threats = threats;
      result.success = true;

      // Step 3: Log threats if detected
      if (threats.length > 0) {
        await this.logThreats(threats, context);
      }

      // Step 4: Performance logging
      const duration = Date.now() - startTime;
      if (duration > 100) {
        // Log slow validations
        log.performance('Input validation', duration, {
          userId: context?.userId,
          metadata: {
            endpoint: context?.endpoint,
            threatCount: threats.length,
            dataSize: JSON.stringify(data).length,
          },
        });
      }

      return result;
    } catch (err) {
      log.error('Validation service error', {
        userId: context?.userId,
        metadata: {
          endpoint: context?.endpoint,
          error: err instanceof Error ? err.message : 'Unknown error',
          validationDuration: Date.now() - startTime,
        },
      });

      result.errors.push('Internal validation error');
      return result;
    }
  }

  /**
   * Detect security threats and sanitize input
   */
  private async detectThreatsAndSanitize(
    data: unknown,
    context?: ValidationContext,
  ): Promise<{ sanitizedData: unknown; threats: ThreatDetection[] }> {
    const threats: ThreatDetection[] = [];
    const sanitizedData = JSON.parse(JSON.stringify(data)); // Deep clone

    const processValue = (value: unknown, fieldPath: string): unknown => {
      if (typeof value === 'string') {
        return this.processStringValue(value, fieldPath, threats);
      } else if (Array.isArray(value)) {
        return value.map((item, index) => processValue(item, `${fieldPath}[${index}]`));
      } else if (value && typeof value === 'object') {
        const processedObject: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
          processedObject[key] = processValue(val, `${fieldPath}.${key}`);
        }
        return processedObject;
      }
      return value;
    };

    const processed = processValue(sanitizedData, '');

    return { sanitizedData: processed, threats };
  }

  /**
   * Process string values for threats and sanitization
   */
  private processStringValue(value: string, fieldPath: string, threats: ThreatDetection[]): string {
    let sanitizedValue = value;
    const originalValue = value;

    // SQL Injection Detection
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(value)) {
        threats.push({
          type: 'sql_injection',
          severity: 'high',
          field: fieldPath,
          originalValue,
          sanitizedValue: value.replace(pattern, ''),
          pattern: pattern.source,
          description: 'Potential SQL injection attempt detected',
        });
        sanitizedValue = sanitizedValue.replace(pattern, '');
      }
    }

    // XSS Detection and Sanitization
    for (const pattern of this.xssPatterns) {
      if (pattern.test(value)) {
        threats.push({
          type: 'xss',
          severity: 'critical',
          field: fieldPath,
          originalValue,
          sanitizedValue: purify.sanitize(value),
          pattern: pattern.source,
          description: 'Cross-site scripting (XSS) attempt detected',
        });
      }
    }

    // Always sanitize HTML content
    if (this.containsHtml(value)) {
      const htmlSanitized = purify.sanitize(value, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
        ALLOWED_ATTR: [],
      });

      if (htmlSanitized !== value) {
        threats.push({
          type: 'html_injection',
          severity: 'medium',
          field: fieldPath,
          originalValue,
          sanitizedValue: htmlSanitized,
          pattern: 'HTML_CONTENT',
          description: 'HTML content sanitized',
        });
        sanitizedValue = htmlSanitized;
      }
    }

    // Path Traversal Detection
    for (const pattern of this.pathTraversalPatterns) {
      if (pattern.test(value)) {
        threats.push({
          type: 'path_traversal',
          severity: 'high',
          field: fieldPath,
          originalValue,
          sanitizedValue: value.replace(pattern, ''),
          pattern: pattern.source,
          description: 'Path traversal attempt detected',
        });
        sanitizedValue = sanitizedValue.replace(pattern, '');
      }
    }

    // Command Injection Detection
    for (const pattern of this.commandInjectionPatterns) {
      if (pattern.test(value)) {
        threats.push({
          type: 'command_injection',
          severity: 'critical',
          field: fieldPath,
          originalValue,
          sanitizedValue: value.replace(pattern, ''),
          pattern: pattern.source,
          description: 'Command injection attempt detected',
        });
        sanitizedValue = sanitizedValue.replace(pattern, '');
      }
    }

    // Additional sanitization
    sanitizedValue = this.additionalSanitization(sanitizedValue);

    return sanitizedValue;
  }

  /**
   * Check if string contains HTML
   */
  private containsHtml(str: string): boolean {
    return /<[a-z][\s\S]*>/i.test(str);
  }

  /**
   * Additional sanitization measures
   */
  private additionalSanitization(value: string): string {
    // Remove null bytes
    value = value.replace(/\x00/g, '');

    // Normalize unicode
    value = value.normalize('NFC');

    // Trim whitespace
    value = value.trim();

    // Remove excessive whitespace
    value = value.replace(/\s+/g, ' ');

    return value;
  }

  /**
   * Log detected threats
   */
  private async logThreats(threats: ThreatDetection[], context?: ValidationContext): Promise<void> {
    for (const threat of threats) {
      const eventType = this.mapThreatToSecurityEvent(threat.type);

      log.security(eventType, `Security threat detected: ${threat.type}`, {
        userId: context?.userId,
        sessionId: context?.sessionId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        severity: threat.severity,
        metadata: {
          field: threat.field,
          threatType: threat.type,
          pattern: threat.pattern,
          description: threat.description,
          originalLength: threat.originalValue.length,
          sanitizedLength: threat.sanitizedValue.length,
          endpoint: context?.endpoint,
          method: context?.method,
        },
      });
    }
  }

  /**
   * Map threat types to security events
   */
  private mapThreatToSecurityEvent(threatType: string): SecurityEventType {
    switch (threatType) {
      case 'xss':
        return SecurityEventType.SUSPICIOUS_ACTIVITY;
      case 'sql_injection':
        return SecurityEventType.SUSPICIOUS_ACTIVITY;
      case 'command_injection':
        return SecurityEventType.SUSPICIOUS_ACTIVITY;
      case 'path_traversal':
        return SecurityEventType.UNAUTHORIZED_ACCESS;
      default:
        return SecurityEventType.SUSPICIOUS_ACTIVITY;
    }
  }

  /**
   * Sanitize user input for safe display
   */
  sanitizeForDisplay(input: string): string {
    return purify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
      ALLOWED_ATTR: [],
    });
  }

  /**
   * Validate and sanitize email
   */
  validateEmail(email: string): { valid: boolean; sanitized: string } {
    const sanitized = validator.escape(email.toLowerCase().trim());
    const valid = validator.isEmail(sanitized);
    return { valid, sanitized };
  }

  /**
   * Validate and sanitize phone number
   */
  validatePhone(phone: string): { valid: boolean; sanitized: string } {
    const sanitized = phone.replace(/[^\d+\-\(\)\s]/g, '');
    const valid = validator.isMobilePhone(sanitized, 'any');
    return { valid, sanitized };
  }

  /**
   * Validate and sanitize URL
   */
  validateUrl(url: string): { valid: boolean; sanitized: string } {
    const sanitized = validator.escape(url.trim());
    const valid = validator.isURL(sanitized, {
      protocols: ['http', 'https'],
      require_protocol: true,
    });
    return { valid, sanitized };
  }

  /**
   * Generate validation schema for common data types
   */
  getSchemas() {
    return {
      // User registration schema
      userRegistration: Joi.object({
        email: Joi.string().email().required().max(255),
        password: Joi.string().min(8).max(128).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        firstName: Joi.string().min(1).max(50).required(),
        lastName: Joi.string().min(1).max(50).required(),
        phoneNumber: Joi.string()
          .pattern(/^[+]?[\d\s\-\(\)]+$/)
          .max(20)
          .optional(),
        acceptedTerms: Joi.boolean().valid(true).required(),
        acceptedPrivacyPolicy: Joi.boolean().valid(true).required(),
        marketingConsent: Joi.boolean().optional(),
      }),

      // User login schema
      userLogin: Joi.object({
        email: Joi.string().email().required().max(255),
        password: Joi.string().min(1).max(128).required(),
        rememberMe: Joi.boolean().optional(),
      }),

      // Profile update schema
      profileUpdate: Joi.object({
        firstName: Joi.string().min(1).max(50).optional(),
        lastName: Joi.string().min(1).max(50).optional(),
        phoneNumber: Joi.string()
          .pattern(/^[+]?[\d\s\-\(\)]+$/)
          .max(20)
          .optional(),
        timezone: Joi.string().max(50).optional(),
        language: Joi.string().max(10).optional(),
      }),

      // Password change schema
      passwordChange: Joi.object({
        currentPassword: Joi.string().min(1).max(128).required(),
        newPassword: Joi.string().min(8).max(128).required(),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
      }),

      // Generic text content schema
      textContent: Joi.object({
        content: Joi.string().max(10000).required(),
        title: Joi.string().max(200).optional(),
      }),

      // File upload schema
      fileUpload: Joi.object({
        filename: Joi.string()
          .pattern(/^[a-zA-Z0-9._-]+$/)
          .max(255)
          .required(),
        mimetype: Joi.string()
          .valid(
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
          )
          .required(),
        size: Joi.number()
          .max(10 * 1024 * 1024)
          .required(), // 10MB max
      }),

      // Search query schema
      search: Joi.object({
        query: Joi.string().min(1).max(200).required(),
        filters: Joi.object().optional(),
        limit: Joi.number().min(1).max(100).default(20),
        offset: Joi.number().min(0).default(0),
      }),
    };
  }
}

// Singleton instance
export const validationService = new ValidationService();

/**
 * Middleware factory for Express-like frameworks
 */
export function createValidationMiddleware(schema: Joi.ObjectSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const context: ValidationContext = {
      userId: (req as any).user?.id,
      sessionId: (req as any).sessionId,
      ipAddress: req.ip || (req.connection as any)?.remoteAddress,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
    };

    const result = await validationService.validateInput(schema, req.body, context);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.errors,
      });
    }

    // Replace request body with sanitized data
    req.body = result.sanitized || result.data;
    (req as any).validationResult = result;

    next();
    return undefined;
  };
}

/**
 * React hook for client-side validation
 */
export function useValidation() {
  const validate = async <T>(
    schema: Joi.ObjectSchema<T>,
    data: unknown,
  ): Promise<ValidationResult<T>> => {
    return await validationService.validateInput(schema, data);
  };

  return {
    validate,
    schemas: validationService.getSchemas(),
    sanitizeForDisplay: validationService.sanitizeForDisplay,
    validateEmail: validationService.validateEmail,
    validatePhone: validationService.validatePhone,
    validateUrl: validationService.validateUrl,
  };
}

// Export convenience functions
export const validate = validationService.validateInput.bind(validationService);
export const sanitize = validationService.sanitizeForDisplay.bind(validationService);
export const schemas = validationService.getSchemas();

export default validationService;
