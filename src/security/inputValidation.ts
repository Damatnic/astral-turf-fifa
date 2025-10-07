/**
 * Guardian Input Validation & Sanitization System
 * Enterprise-grade input validation, sanitization, and protection against injection attacks
 */

import Joi from 'joi';
import validator from 'validator';
import DOMPurify from 'dompurify';

// Validation rule types
export type ValidationRule =
  | 'email'
  | 'password'
  | 'phone'
  | 'url'
  | 'alphanumeric'
  | 'numeric'
  | 'text'
  | 'html'
  | 'json'
  | 'uuid'
  | 'date'
  | 'custom';

export interface ValidationConfig {
  rule: ValidationRule;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: unknown) => boolean;
  sanitize?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
  errorMessage?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedValue?: unknown;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedThreats: string[];
}

export interface FormValidationSchema {
  [field: string]: ValidationConfig | ValidationConfig[];
}

export interface BulkValidationResult {
  valid: boolean;
  fieldErrors: Record<string, string[]>;
  globalErrors: string[];
  sanitizedData: Record<string, unknown>;
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    threatsByField: Record<string, string[]>;
    suspiciousPatterns: string[];
  };
}

/**
 * Predefined validation schemas for common forms
 */
export const VALIDATION_SCHEMAS = {
  // User authentication schemas
  login: {
    email: {
      rule: 'email' as const,
      required: true,
      sanitize: true,
      errorMessage: 'Please enter a valid email address',
    },
    password: {
      rule: 'password' as const,
      required: true,
      minLength: 8,
      errorMessage: 'Password must be at least 8 characters long',
    },
  },

  // User registration schema
  registration: {
    email: {
      rule: 'email' as const,
      required: true,
      sanitize: true,
      errorMessage: 'Please enter a valid email address',
    },
    password: {
      rule: 'password' as const,
      required: true,
      minLength: 12,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      errorMessage: 'Password must contain uppercase, lowercase, number, and special character',
    },
    confirmPassword: {
      rule: 'text' as const,
      required: true,
      errorMessage: 'Password confirmation is required',
    },
    firstName: {
      rule: 'text' as const,
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s'-]+$/,
      sanitize: true,
      errorMessage: 'First name must contain only letters, spaces, hyphens, and apostrophes',
    },
    lastName: {
      rule: 'text' as const,
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s'-]+$/,
      sanitize: true,
      errorMessage: 'Last name must contain only letters, spaces, hyphens, and apostrophes',
    },
    phoneNumber: {
      rule: 'phone' as const,
      required: false,
      sanitize: true,
      errorMessage: 'Please enter a valid phone number',
    },
  },

  // Player data schema
  playerData: {
    name: {
      rule: 'text' as const,
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s'-]+$/,
      sanitize: true,
      errorMessage: 'Player name must contain only letters, spaces, hyphens, and apostrophes',
    },
    position: {
      rule: 'text' as const,
      required: true,
      pattern: /^(GK|DEF|MID|FWD|SUB)$/,
      errorMessage: 'Position must be one of: GK, DEF, MID, FWD, SUB',
    },
    jerseyNumber: {
      rule: 'numeric' as const,
      required: true,
      customValidator: value => {
        const num = Number(value);
        return num >= 1 && num <= 99;
      },
      errorMessage: 'Jersey number must be between 1 and 99',
    },
    dateOfBirth: {
      rule: 'date' as const,
      required: true,
      errorMessage: 'Please enter a valid date of birth',
    },
    height: {
      rule: 'numeric' as const,
      required: false,
      customValidator: value => {
        const num = Number(value);
        return num >= 100 && num <= 250; // cm
      },
      errorMessage: 'Height must be between 100 and 250 cm',
    },
    weight: {
      rule: 'numeric' as const,
      required: false,
      customValidator: value => {
        const num = Number(value);
        return num >= 30 && num <= 200; // kg
      },
      errorMessage: 'Weight must be between 30 and 200 kg',
    },
  },

  // Formation data schema
  formationData: {
    name: {
      rule: 'text' as const,
      required: true,
      minLength: 3,
      maxLength: 50,
      sanitize: true,
      errorMessage: 'Formation name must be between 3 and 50 characters',
    },
    description: {
      rule: 'html' as const,
      required: false,
      maxLength: 500,
      sanitize: true,
      allowedTags: ['b', 'i', 'u', 'br', 'p'],
      allowedAttributes: [],
      errorMessage: 'Description contains invalid HTML tags',
    },
    tacticalSetup: {
      rule: 'json' as const,
      required: true,
      errorMessage: 'Invalid tactical setup data',
    },
  },

  // Match data schema
  matchData: {
    opponent: {
      rule: 'text' as const,
      required: true,
      minLength: 2,
      maxLength: 100,
      sanitize: true,
      errorMessage: 'Opponent name must be between 2 and 100 characters',
    },
    date: {
      rule: 'date' as const,
      required: true,
      errorMessage: 'Please enter a valid match date',
    },
    venue: {
      rule: 'text' as const,
      required: true,
      minLength: 2,
      maxLength: 200,
      sanitize: true,
      errorMessage: 'Venue must be between 2 and 200 characters',
    },
    notes: {
      rule: 'html' as const,
      required: false,
      maxLength: 1000,
      sanitize: true,
      allowedTags: ['b', 'i', 'u', 'br', 'p', 'ul', 'ol', 'li'],
      allowedAttributes: [],
      errorMessage: 'Notes contain invalid HTML tags',
    },
  },
} as const;

/**
 * Security threat patterns for detection
 */
const THREAT_PATTERNS = {
  sqlInjection: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
    /(\'|(--|#|\/\*|\*\/|@@|@))/gi,
    /(\b(OR|AND)\b.*=.*)/gi,
  ],
  xss: [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
    /<object[^>]*>[\s\S]*?<\/object>/gi,
  ],
  commandInjection: [/[;&|`$(){}[\]\\]/g, /\b(cat|ls|pwd|rm|mv|cp|chmod|sudo|su)\b/gi],
  pathTraversal: [/\.\.\//g, /\.\.\\/g, /%2e%2e%2f/gi, /%2e%2e%5c/gi],
  ldapInjection: [/[()&|!=<>]/g, /\*|\x00/g],
  nosqlInjection: [/\$where/gi, /\$ne/gi, /\$gt/gi, /\$lt/gi, /\$regex/gi],
};

/**
 * Guardian Input Validation Service
 * Comprehensive input validation with threat detection and sanitization
 */
class InputValidationService {
  private validationCache: Map<string, ValidationResult> = new Map();
  private threatDetectionEnabled = true;
  private sanitizationEnabled = true;

  /**
   * Validate single field with comprehensive security checks
   */
  validateField(value: unknown, config: ValidationConfig, fieldName?: string): ValidationResult {
    // Create cache key
    const cacheKey = this.createCacheKey(value, config, fieldName);
    const cached = this.validationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result: ValidationResult = {
      valid: true,
      errors: [],
      sanitizedValue: value,
      riskLevel: 'low',
      detectedThreats: [],
    };

    try {
      // Step 1: Type and format validation
      this.performBasicValidation(value, config, result);

      // Step 2: Threat detection
      if (this.threatDetectionEnabled) {
        this.detectThreats(value, result);
      }

      // Step 3: Sanitization
      if (config.sanitize && this.sanitizationEnabled) {
        result.sanitizedValue = this.sanitizeValue(value, config);
      }

      // Step 4: Custom validation
      if (config.customValidator && result.valid) {
        if (!config.customValidator(result.sanitizedValue)) {
          result.valid = false;
          result.errors.push(config.errorMessage || 'Custom validation failed');
        }
      }

      // Step 5: Risk assessment
      this.assessRisk(result);

      // Cache result for performance
      this.validationCache.set(cacheKey, result);

      return result;
    } catch (error) {
      result.valid = false;
      result.errors.push('Validation error occurred');
      result.riskLevel = 'high';
      return result;
    }
  }

  /**
   * Validate entire form with cross-field validation
   */
  validateForm(data: Record<string, unknown>, schema: FormValidationSchema): BulkValidationResult {
    const result: BulkValidationResult = {
      valid: true,
      fieldErrors: {},
      globalErrors: [],
      sanitizedData: {},
      riskAssessment: {
        overallRisk: 'low',
        threatsByField: {},
        suspiciousPatterns: [],
      },
    };

    // Validate each field
    Object.entries(schema).forEach(([fieldName, fieldConfigs]) => {
      const fieldValue = data[fieldName];
      const configs = Array.isArray(fieldConfigs) ? fieldConfigs : [fieldConfigs];

      const fieldErrors: string[] = [];
      const fieldThreats: string[] = [];
      let sanitizedValue = fieldValue;
      let maxRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

      // Validate against all configs for this field
      configs.forEach(config => {
        const fieldResult = this.validateField(fieldValue, config, fieldName);

        if (!fieldResult.valid) {
          fieldErrors.push(...fieldResult.errors);
          result.valid = false;
        }

        if (fieldResult.detectedThreats.length > 0) {
          fieldThreats.push(...fieldResult.detectedThreats);
        }

        if (fieldResult.sanitizedValue !== undefined) {
          sanitizedValue = fieldResult.sanitizedValue;
        }

        // Update max risk level
        if (this.getRiskPriority(fieldResult.riskLevel) > this.getRiskPriority(maxRiskLevel)) {
          maxRiskLevel = fieldResult.riskLevel;
        }
      });

      // Store results
      if (fieldErrors.length > 0) {
        result.fieldErrors[fieldName] = fieldErrors;
      }
      if (fieldThreats.length > 0) {
        result.riskAssessment.threatsByField[fieldName] = fieldThreats;
      }

      result.sanitizedData[fieldName] = sanitizedValue;
    });

    // Cross-field validation
    this.performCrossFieldValidation(data, schema, result);

    // Overall risk assessment
    this.assessOverallRisk(result);

    return result;
  }

  /**
   * Validate using predefined schema
   */
  validateWithSchema(
    data: Record<string, unknown>,
    schemaName: keyof typeof VALIDATION_SCHEMAS,
  ): BulkValidationResult {
    const schema = VALIDATION_SCHEMAS[schemaName] as unknown as FormValidationSchema;
    return this.validateForm(data, schema);
  }

  /**
   * Sanitize string input based on context
   */
  sanitizeString(
    input: string,
    context: 'html' | 'sql' | 'url' | 'filename' | 'general' = 'general',
  ): string {
    switch (context) {
      case 'html':
        return DOMPurify.sanitize(input, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
          ALLOWED_ATTR: [],
        } as any) as unknown as string;

      case 'sql':
        return input
          .replace(/'/g, "''")
          .replace(/"/g, '""')
          .replace(/;/g, '')
          .replace(/--/g, '')
          .replace(/\/\*/g, '')
          .replace(/\*\//g, '');

      case 'url':
        return encodeURIComponent(input);

      case 'filename':
        return input
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/^\.+/, '')
          .substring(0, 255);

      case 'general':
      default:
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
    }
  }

  /**
   * Validate and sanitize JSON data
   */
  validateJSON(data: unknown): { valid: boolean; sanitized?: unknown; error?: string } {
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return { valid: true, sanitized: this.sanitizeObject(parsed) };
      } else if (typeof data === 'object') {
        return { valid: true, sanitized: this.sanitizeObject(data) };
      } else {
        return { valid: false, error: 'Invalid JSON data type' };
      }
    } catch (error) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  }

  /**
   * Validate file upload security
   */
  validateFileUpload(
    file: File,
    options: {
      allowedTypes?: string[];
      maxSize?: number;
      allowedExtensions?: string[];
      scanForMalware?: boolean;
    } = {},
  ): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      riskLevel: 'low',
      detectedThreats: [],
    };

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      result.valid = false;
      result.errors.push(`File type ${file.type} is not allowed`);
      result.riskLevel = 'medium';
    }

    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      result.valid = false;
      result.errors.push(`File size exceeds maximum of ${options.maxSize} bytes`);
    }

    // Check file extension
    if (options.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !options.allowedExtensions.includes(extension)) {
        result.valid = false;
        result.errors.push(`File extension .${extension} is not allowed`);
        result.riskLevel = 'medium';
      }
    }

    // Check for suspicious file names
    if (this.detectSuspiciousFileName(file.name)) {
      result.detectedThreats.push('suspicious_filename');
      result.riskLevel = 'high';
    }

    // Check for double extensions
    if (this.detectDoubleExtension(file.name)) {
      result.detectedThreats.push('double_extension');
      result.riskLevel = 'high';
    }

    return result;
  }

  /**
   * Get validation metrics for monitoring
   */
  getValidationMetrics(): {
    totalValidations: number;
    failureRate: number;
    threatDetections: number;
    riskDistribution: Record<string, number>;
    commonThreats: Array<{ threat: string; count: number }>;
  } {
    const totalValidations = this.validationCache.size;
    const results = Array.from(this.validationCache.values());

    const failures = results.filter(r => !r.valid).length;
    const threatDetections = results.filter(r => r.detectedThreats.length > 0).length;

    const riskDistribution = results.reduce(
      (acc, r) => {
        acc[r.riskLevel] = (acc[r.riskLevel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const threatCounts = results
      .flatMap(r => r.detectedThreats)
      .reduce(
        (acc, threat) => {
          acc[threat] = (acc[threat] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    const commonThreats = Object.entries(threatCounts)
      .map(([threat, count]) => ({ threat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalValidations,
      failureRate: totalValidations > 0 ? failures / totalValidations : 0,
      threatDetections,
      riskDistribution,
      commonThreats,
    };
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  // Private helper methods
  private performBasicValidation(
    value: unknown,
    config: ValidationConfig,
    result: ValidationResult,
  ): void {
    // Required field check
    if (config.required && (value === undefined || value === null || value === '')) {
      result.valid = false;
      result.errors.push(config.errorMessage || 'This field is required');
      return;
    }

    // Skip further validation if field is not required and empty
    if (!config.required && (value === undefined || value === null || value === '')) {
      return;
    }

    const stringValue = String(value);

    // Length validation
    if (config.minLength && stringValue.length < config.minLength) {
      result.valid = false;
      result.errors.push(config.errorMessage || `Minimum length is ${config.minLength} characters`);
    }

    if (config.maxLength && stringValue.length > config.maxLength) {
      result.valid = false;
      result.errors.push(config.errorMessage || `Maximum length is ${config.maxLength} characters`);
    }

    // Pattern validation
    if (config.pattern && !config.pattern.test(stringValue)) {
      result.valid = false;
      result.errors.push(config.errorMessage || 'Invalid format');
    }

    // Rule-based validation
    switch (config.rule) {
      case 'email':
        if (!validator.isEmail(stringValue)) {
          result.valid = false;
          result.errors.push(config.errorMessage || 'Invalid email address');
        }
        break;

      case 'url':
        if (!validator.isURL(stringValue)) {
          result.valid = false;
          result.errors.push(config.errorMessage || 'Invalid URL');
        }
        break;

      case 'phone':
        if (!validator.isMobilePhone(stringValue)) {
          result.valid = false;
          result.errors.push(config.errorMessage || 'Invalid phone number');
        }
        break;

      case 'uuid':
        if (!validator.isUUID(stringValue)) {
          result.valid = false;
          result.errors.push(config.errorMessage || 'Invalid UUID');
        }
        break;

      case 'numeric':
        if (!validator.isNumeric(stringValue)) {
          result.valid = false;
          result.errors.push(config.errorMessage || 'Must be a number');
        }
        break;

      case 'alphanumeric':
        if (!validator.isAlphanumeric(stringValue)) {
          result.valid = false;
          result.errors.push(config.errorMessage || 'Must contain only letters and numbers');
        }
        break;

      case 'date':
        if (!validator.isISO8601(stringValue) && !validator.isDate(stringValue)) {
          result.valid = false;
          result.errors.push(config.errorMessage || 'Invalid date format');
        }
        break;

      case 'json':
        try {
          JSON.parse(stringValue);
        } catch {
          result.valid = false;
          result.errors.push(config.errorMessage || 'Invalid JSON format');
        }
        break;
    }
  }

  private detectThreats(value: unknown, result: ValidationResult): void {
    const stringValue = String(value);

    Object.entries(THREAT_PATTERNS).forEach(([threatType, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(stringValue)) {
          result.detectedThreats.push(threatType);

          // Escalate risk level based on threat type
          switch (threatType) {
            case 'sqlInjection':
            case 'commandInjection':
              result.riskLevel = 'critical';
              break;
            case 'xss':
            case 'ldapInjection':
            case 'nosqlInjection':
              result.riskLevel = result.riskLevel === 'critical' ? 'critical' : 'high';
              break;
            case 'pathTraversal':
              result.riskLevel =
                result.riskLevel === 'critical' || result.riskLevel === 'high'
                  ? result.riskLevel
                  : 'medium';
              break;
          }
        }
      });
    });
  }

  private sanitizeValue(value: unknown, config: ValidationConfig): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    switch (config.rule) {
      case 'html':
        return DOMPurify.sanitize(value, {
          ALLOWED_TAGS: config.allowedTags || ['b', 'i', 'em', 'strong'],
          ALLOWED_ATTR: config.allowedAttributes || [],
        } as any) as unknown;

      case 'email':
        return validator.normalizeEmail(value) || value;

      case 'text':
      default:
        return this.sanitizeString(value, 'general');
    }
  }

  private sanitizeObject(obj: unknown): unknown {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj, 'general');
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: Record<string, unknown> = {};
      Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
        const sanitizedKey = this.sanitizeString(key, 'general');
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      });
      return sanitized;
    }

    return obj;
  }

  private performCrossFieldValidation(
    data: Record<string, unknown>,
    schema: FormValidationSchema,
    result: BulkValidationResult,
  ): void {
    // Password confirmation validation
    if ('password' in data && 'confirmPassword' in data) {
      if (data.password !== data.confirmPassword) {
        result.valid = false;
        result.fieldErrors.confirmPassword = result.fieldErrors.confirmPassword || [];
        result.fieldErrors.confirmPassword.push('Passwords do not match');
      }
    }

    // Date range validation
    if ('startDate' in data && 'endDate' in data) {
      const startDate = new Date(String(data.startDate));
      const endDate = new Date(String(data.endDate));

      if (startDate >= endDate) {
        result.valid = false;
        result.fieldErrors.endDate = result.fieldErrors.endDate || [];
        result.fieldErrors.endDate.push('End date must be after start date');
      }
    }

    // Unique value validation (if schema includes unique constraints)
    // This would typically involve database checks in a real implementation
  }

  private assessRisk(result: ValidationResult): void {
    if (result.detectedThreats.length === 0) {
      return;
    }

    // Threats already set risk level in detectThreats method
    // Additional assessment based on error patterns
    if (
      result.errors.some(
        error => error.includes('length') || error.includes('format') || error.includes('required'),
      )
    ) {
      // Basic validation errors are low risk unless threats detected
      if (result.riskLevel === 'low' && result.detectedThreats.length > 0) {
        result.riskLevel = 'medium';
      }
    }
  }

  private assessOverallRisk(result: BulkValidationResult): void {
    const riskLevels = Object.values(result.riskAssessment.threatsByField)
      .flat()
      .map(threat => this.getThreatRiskLevel(threat));

    if (riskLevels.includes('critical')) {
      result.riskAssessment.overallRisk = 'critical';
    } else if (riskLevels.includes('high')) {
      result.riskAssessment.overallRisk = 'high';
    } else if (riskLevels.includes('medium')) {
      result.riskAssessment.overallRisk = 'medium';
    }

    // Detect suspicious patterns across fields
    const allValues = Object.values(result.sanitizedData).join(' ');
    if (this.detectSuspiciousPatterns(allValues)) {
      result.riskAssessment.suspiciousPatterns.push('coordinated_attack_pattern');
      result.riskAssessment.overallRisk = 'high';
    }
  }

  private getThreatRiskLevel(threat: string): 'low' | 'medium' | 'high' | 'critical' {
    const riskMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      sqlInjection: 'critical',
      commandInjection: 'critical',
      xss: 'high',
      ldapInjection: 'high',
      nosqlInjection: 'high',
      pathTraversal: 'medium',
    };
    return riskMap[threat as keyof typeof riskMap] || 'low';
  }

  private getRiskPriority(risk: 'low' | 'medium' | 'high' | 'critical'): number {
    const priorities = { low: 1, medium: 2, high: 3, critical: 4 };
    return priorities[risk];
  }

  private detectSuspiciousFileName(filename: string): boolean {
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i,
      /\.(php|asp|aspx|jsp|cgi)$/i,
      /^\.htaccess$/i,
      /web\.config$/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(filename));
  }

  private detectDoubleExtension(filename: string): boolean {
    const parts = filename.split('.');
    return parts.length > 2 && parts[parts.length - 2].length <= 4;
  }

  private detectSuspiciousPatterns(text: string): boolean {
    const suspiciousPatterns = [
      /\b(union|select|insert|update|delete|drop)\b.*\b(union|select|insert|update|delete|drop)\b/gi,
      /<script.*<\/script>.*<script.*<\/script>/gi,
      /javascript:.*javascript:/gi,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(text));
  }

  private createCacheKey(value: unknown, config: ValidationConfig, fieldName?: string): string {
    return `${fieldName || 'field'}_${JSON.stringify(value)}_${JSON.stringify(config)}`;
  }
}

// Export singleton instance
export const inputValidation = new InputValidationService();

// Export convenience functions
export const validateField = (value: unknown, config: ValidationConfig, fieldName?: string) =>
  inputValidation.validateField(value, config, fieldName);

export const validateForm = (data: Record<string, unknown>, schema: FormValidationSchema) =>
  inputValidation.validateForm(data, schema);

export const validateWithPredefinedSchema = (
  data: Record<string, unknown>,
  schemaName: keyof typeof VALIDATION_SCHEMAS,
) => inputValidation.validateWithSchema(data, schemaName);

export const sanitizeInput = (
  input: string,
  context: 'html' | 'sql' | 'url' | 'filename' | 'general' = 'general',
) => inputValidation.sanitizeString(input, context);

export const validateJSONData = (data: unknown) => inputValidation.validateJSON(data);

export const validateFileUpload = (
  file: File,
  options?: {
    allowedTypes?: string[];
    maxSize?: number;
    allowedExtensions?: string[];
    scanForMalware?: boolean;
  },
) => inputValidation.validateFileUpload(file, options);

export const getValidationStats = () => inputValidation.getValidationMetrics();
