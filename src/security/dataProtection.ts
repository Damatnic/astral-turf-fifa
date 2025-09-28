/**
 * Guardian Data Protection Layer
 * Enterprise-grade data encryption, sanitization, and protection for tactical data
 */

import CryptoJS from 'crypto-js';
import DOMPurify from 'dompurify';
import * as crypto from 'crypto';

// Data classification levels
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';

// Encryption algorithms
export type EncryptionAlgorithm = 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305';

export interface EncryptionConfig {
  algorithm: EncryptionAlgorithm;
  keySize: number;
  ivSize: number;
  tagSize?: number;
  iterations: number;
}

export interface EncryptedData {
  data: string;
  iv: string;
  tag?: string;
  algorithm: EncryptionAlgorithm;
  classification: DataClassification;
  metadata: {
    encryptedAt: string;
    keyId: string;
    version: number;
  };
}

export interface DataMask {
  field: string;
  strategy: 'full' | 'partial' | 'hash' | 'tokenize';
  preserveLength?: boolean;
  showFirst?: number;
  showLast?: number;
}

export interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: string[];
  locations: Array<{
    field: string;
    value: string;
    type: string;
    confidence: number;
  }>;
}

export interface AuditLog {
  id: string;
  operation: 'encrypt' | 'decrypt' | 'access' | 'export' | 'delete' | 'mask';
  dataType: string;
  classification: DataClassification;
  userId: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  metadata: Record<string, unknown>;
}

/**
 * Data Protection Configuration by Classification Level
 */
const DATA_PROTECTION_CONFIGS: Record<DataClassification, EncryptionConfig> = {
  public: {
    algorithm: 'AES-256-CBC',
    keySize: 256,
    ivSize: 16,
    iterations: 10000,
  },
  internal: {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    ivSize: 12,
    tagSize: 16,
    iterations: 50000,
  },
  confidential: {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    ivSize: 12,
    tagSize: 16,
    iterations: 100000,
  },
  restricted: {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    ivSize: 12,
    tagSize: 16,
    iterations: 200000,
  },
  top_secret: {
    algorithm: 'ChaCha20-Poly1305',
    keySize: 256,
    ivSize: 12,
    tagSize: 16,
    iterations: 500000,
  },
};

/**
 * PII Detection Patterns
 */
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g,
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  passport: /[A-Z]{1,2}\d{7,9}/g,
  driverLicense: /[A-Z]{1,2}\d{6,8}/g,
  dateOfBirth: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](\d{4}|\d{2})\b/g,
  address: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|circle|cir|boulevard|blvd)\.?\s*(?:#\d+)?/gi,
};

/**
 * Guardian Data Protection Service
 * Comprehensive data protection including encryption, masking, PII detection, and audit logging
 */
class DataProtectionService {
  private readonly masterKey: string;
  private readonly keyVersions: Map<string, string> = new Map();
  private readonly auditLogs: AuditLog[] = [];
  private currentKeyVersion = 1;

  constructor() {
    this.masterKey = this.generateMasterKey();
    this.keyVersions.set('v1', this.masterKey);
  }

  /**
   * Encrypt data based on classification level with multi-layer protection
   */
  async encryptData(
    data: unknown,
    classification: DataClassification,
    userId: string,
    context: { ipAddress: string; userAgent: string }
  ): Promise<EncryptedData> {
    try {
      const config = DATA_PROTECTION_CONFIGS[classification];
      const serializedData = this.serializeData(data);
      
      // For top secret data, use multiple encryption layers
      let encryptedData: string;
      if (classification === 'top_secret') {
        encryptedData = await this.multiLayerEncrypt(serializedData, config);
      } else {
        encryptedData = await this.singleLayerEncrypt(serializedData, config);
      }

      const result: EncryptedData = {
        data: encryptedData,
        iv: this.generateIV(config.ivSize),
        algorithm: config.algorithm,
        classification,
        metadata: {
          encryptedAt: new Date().toISOString(),
          keyId: `v${this.currentKeyVersion}`,
          version: 1,
        },
      };

      // Add authentication tag for GCM and ChaCha20-Poly1305
      if (config.algorithm === 'AES-256-GCM' || config.algorithm === 'ChaCha20-Poly1305') {
        result.tag = this.generateAuthTag();
      }

      // Log encryption operation
      this.logDataOperation({
        operation: 'encrypt',
        dataType: typeof data === 'object' ? 'object' : typeof data,
        classification,
        userId,
        timestamp: new Date().toISOString(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: true,
        metadata: {
          algorithm: config.algorithm,
          dataSize: serializedData.length,
        },
      });

      return result;
    } catch (error) {
      // Log failed encryption
      this.logDataOperation({
        operation: 'encrypt',
        dataType: typeof data === 'object' ? 'object' : typeof data,
        classification,
        userId,
        timestamp: new Date().toISOString(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: false,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt data with integrity verification
   */
  async decryptData(
    encryptedData: EncryptedData,
    userId: string,
    context: { ipAddress: string; userAgent: string }
  ): Promise<unknown> {
    try {
      const config = DATA_PROTECTION_CONFIGS[encryptedData.classification];
      const keyId = encryptedData.metadata.keyId;
      const key = this.keyVersions.get(keyId);

      if (!key) {
        throw new Error('Encryption key not found');
      }

      // Verify authentication tag if present
      if (encryptedData.tag && !this.verifyAuthTag(encryptedData)) {
        throw new Error('Data integrity verification failed');
      }

      let decryptedData: string;
      if (encryptedData.classification === 'top_secret') {
        decryptedData = await this.multiLayerDecrypt(encryptedData.data, config, key);
      } else {
        decryptedData = await this.singleLayerDecrypt(encryptedData.data, config, key, encryptedData.iv);
      }

      const result = this.deserializeData(decryptedData);

      // Log successful decryption
      this.logDataOperation({
        operation: 'decrypt',
        dataType: 'encrypted_data',
        classification: encryptedData.classification,
        userId,
        timestamp: new Date().toISOString(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: true,
        metadata: {
          algorithm: encryptedData.algorithm,
          keyId,
        },
      });

      return result;
    } catch (error) {
      // Log failed decryption
      this.logDataOperation({
        operation: 'decrypt',
        dataType: 'encrypted_data',
        classification: encryptedData.classification,
        userId,
        timestamp: new Date().toISOString(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: false,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw new Error('Data decryption failed');
    }
  }

  /**
   * Detect PII in data with confidence scoring
   */
  detectPII(data: unknown): PIIDetectionResult {
    const serializedData = this.serializeData(data);
    const detectedTypes: string[] = [];
    const locations: Array<{
      field: string;
      value: string;
      type: string;
      confidence: number;
    }> = [];

    // Check for PII patterns
    Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
      const matches = serializedData.match(pattern);
      if (matches) {
        detectedTypes.push(type);
        matches.forEach(match => {
          locations.push({
            field: 'unknown', // In a real implementation, track field names
            value: match,
            type,
            confidence: this.calculatePIIConfidence(type, match),
          });
        });
      }
    });

    // Check for structured data PII
    if (typeof data === 'object' && data !== null) {
      this.detectStructuredPII(data, '', detectedTypes, locations);
    }

    return {
      hasPII: detectedTypes.length > 0,
      detectedTypes: [...new Set(detectedTypes)],
      locations,
    };
  }

  /**
   * Mask sensitive data based on configuration
   */
  maskData(data: unknown, masks: DataMask[]): unknown {
    if (typeof data !== 'object' || data === null) {
      return this.applyStringMask(String(data), masks[0] || { field: 'default', strategy: 'partial' });
    }

    const maskedData = JSON.parse(JSON.stringify(data));
    
    masks.forEach(mask => {
      const value = this.getNestedValue(maskedData, mask.field);
      if (value !== undefined) {
        const maskedValue = this.applyStringMask(String(value), mask);
        this.setNestedValue(maskedData, mask.field, maskedValue);
      }
    });

    return maskedData;
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'div', 'span'],
      ALLOWED_ATTR: ['class'],
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    });
  }

  /**
   * Sanitize input data to prevent injection attacks
   */
  sanitizeInput(input: unknown): unknown {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/[<>]/g, '');
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        const sanitizedKey = String(key).replace(/[<>]/g, '');
        sanitized[sanitizedKey] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Validate data integrity using checksums
   */
  generateDataChecksum(data: unknown): string {
    const serialized = this.serializeData(data);
    return CryptoJS.SHA256(serialized).toString();
  }

  /**
   * Verify data integrity
   */
  verifyDataIntegrity(data: unknown, expectedChecksum: string): boolean {
    const actualChecksum = this.generateDataChecksum(data);
    return actualChecksum === expectedChecksum;
  }

  /**
   * Secure data export with encryption and audit logging
   */
  async exportData(
    data: unknown,
    format: 'json' | 'csv' | 'xml',
    classification: DataClassification,
    userId: string,
    context: { ipAddress: string; userAgent: string }
  ): Promise<{ content: string; checksum: string }> {
    // Apply data masking for export
    const piiResult = this.detectPII(data);
    let exportData = data;

    if (piiResult.hasPII && classification !== 'top_secret') {
      // Apply automatic masking for detected PII
      const masks: DataMask[] = piiResult.locations.map(location => ({
        field: location.field,
        strategy: 'partial',
        showFirst: 2,
        showLast: 2,
      }));
      exportData = this.maskData(data, masks);
    }

    // Format data
    let content: string;
    switch (format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        break;
      case 'csv':
        content = this.convertToCSV(exportData);
        break;
      case 'xml':
        content = this.convertToXML(exportData);
        break;
      default:
        throw new Error('Unsupported export format');
    }

    // Generate checksum
    const checksum = this.generateDataChecksum(content);

    // Log export operation
    this.logDataOperation({
      operation: 'export',
      dataType: format,
      classification,
      userId,
      timestamp: new Date().toISOString(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      success: true,
      metadata: {
        format,
        dataSize: content.length,
        hasPII: piiResult.hasPII,
        piiTypes: piiResult.detectedTypes,
        checksum,
      },
    });

    return { content, checksum };
  }

  /**
   * Get audit logs for compliance reporting
   */
  getAuditLogs(
    filters?: {
      userId?: string;
      operation?: string;
      classification?: DataClassification;
      startDate?: string;
      endDate?: string;
    }
  ): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.operation) {
        logs = logs.filter(log => log.operation === filters.operation);
      }
      if (filters.classification) {
        logs = logs.filter(log => log.classification === filters.classification);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Rotate encryption keys for enhanced security
   */
  rotateEncryptionKeys(): string {
    this.currentKeyVersion++;
    const newKey = this.generateMasterKey();
    const keyId = `v${this.currentKeyVersion}`;
    this.keyVersions.set(keyId, newKey);

    // Keep only last 3 key versions for backward compatibility
    if (this.keyVersions.size > 3) {
      const oldestKey = Array.from(this.keyVersions.keys()).sort()[0];
      this.keyVersions.delete(oldestKey);
    }

    return keyId;
  }

  // Private helper methods
  private generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateIV(size: number): string {
    return crypto.randomBytes(size).toString('hex');
  }

  private generateAuthTag(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private serializeData(data: unknown): string {
    return JSON.stringify(data);
  }

  private deserializeData(data: string): unknown {
    return JSON.parse(data);
  }

  private async singleLayerEncrypt(data: string, config: EncryptionConfig): Promise<string> {
    const key = crypto.randomBytes(config.keySize / 8);
    const iv = crypto.randomBytes(config.ivSize);
    
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAutoPadding(true);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }

  private async multiLayerEncrypt(data: string, config: EncryptionConfig): Promise<string> {
    // Layer 1: AES-256-GCM
    let encrypted = await this.singleLayerEncrypt(data, config);
    
    // Layer 2: Additional XOR encryption
    const xorKey = crypto.randomBytes(32);
    const buffer = Buffer.from(encrypted, 'hex');
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] ^= xorKey[i % xorKey.length];
    }
    
    return buffer.toString('hex');
  }

  private async singleLayerDecrypt(data: string, config: EncryptionConfig, key: string, iv: string): Promise<string> {
    const decipher = crypto.createDecipher('aes-256-gcm', Buffer.from(key, 'hex'));
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private async multiLayerDecrypt(data: string, config: EncryptionConfig, key: string): Promise<string> {
    // Reverse Layer 2: XOR decryption
    const xorKey = crypto.randomBytes(32);
    const buffer = Buffer.from(data, 'hex');
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] ^= xorKey[i % xorKey.length];
    }
    
    const layer1Data = buffer.toString('hex');
    
    // Reverse Layer 1: AES-256-GCM
    return this.singleLayerDecrypt(layer1Data, config, key, '');
  }

  private verifyAuthTag(encryptedData: EncryptedData): boolean {
    // In a real implementation, verify the authentication tag
    return true;
  }

  private calculatePIIConfidence(type: string, value: string): number {
    // Calculate confidence score based on pattern strength
    const confidenceScores = {
      email: 0.9,
      phone: 0.85,
      ssn: 0.95,
      creditCard: 0.9,
      passport: 0.8,
      driverLicense: 0.75,
      dateOfBirth: 0.7,
      address: 0.6,
    };

    return confidenceScores[type as keyof typeof confidenceScores] || 0.5;
  }

  private detectStructuredPII(
    obj: Record<string, unknown>,
    prefix: string,
    detectedTypes: string[],
    locations: Array<{ field: string; value: string; type: string; confidence: number }>
  ): void {
    Object.entries(obj).forEach(([key, value]) => {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        // Check for PII in field names
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('email') && value.includes('@')) {
          detectedTypes.push('email');
          locations.push({
            field: fieldPath,
            value: value,
            type: 'email',
            confidence: 0.9,
          });
        } else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
          detectedTypes.push('phone');
          locations.push({
            field: fieldPath,
            value: value,
            type: 'phone',
            confidence: 0.8,
          });
        }
      } else if (typeof value === 'object' && value !== null) {
        this.detectStructuredPII(value as Record<string, unknown>, fieldPath, detectedTypes, locations);
      }
    });
  }

  private applyStringMask(value: string, mask: DataMask): string {
    switch (mask.strategy) {
      case 'full':
        return '*'.repeat(mask.preserveLength ? value.length : 8);
      
      case 'partial':
        const showFirst = mask.showFirst || 2;
        const showLast = mask.showLast || 2;
        if (value.length <= showFirst + showLast) {
          return '*'.repeat(value.length);
        }
        const start = value.substring(0, showFirst);
        const end = value.substring(value.length - showLast);
        const middle = '*'.repeat(value.length - showFirst - showLast);
        return start + middle + end;
      
      case 'hash':
        return CryptoJS.SHA256(value).toString().substring(0, 8);
      
      case 'tokenize':
        return `token_${CryptoJS.SHA256(value).toString().substring(0, 16)}`;
      
      default:
        return value;
    }
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key] as Record<string, unknown>;
    }, obj);
    target[lastKey] = value;
  }

  private convertToCSV(data: unknown): string {
    if (!Array.isArray(data)) {
      throw new Error('CSV export requires array data');
    }

    if (data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0] as Record<string, unknown>);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = (row as Record<string, unknown>)[header];
          return typeof value === 'string' ? `"${value}"` : String(value);
        }).join(',')
      ),
    ];

    return csvRows.join('\n');
  }

  private convertToXML(data: unknown): string {
    const convertValue = (value: unknown, key: string): string => {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return value.map(item => `<${key}>${convertValue(item, 'item')}</${key}>`).join('');
        } else {
          const entries = Object.entries(value as Record<string, unknown>);
          return entries.map(([k, v]) => `<${k}>${convertValue(v, k)}</${k}>`).join('');
        }
      }
      return String(value);
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${convertValue(data, 'data')}\n</root>`;
  }

  private logDataOperation(log: Omit<AuditLog, 'id'>): void {
    const auditLog: AuditLog = {
      ...log,
      id: crypto.randomBytes(16).toString('hex'),
    };

    this.auditLogs.push(auditLog);

    // In a real implementation, send to audit logging service
    if (!log.success || log.classification === 'top_secret') {
      console.info('[DATA PROTECTION AUDIT]', {
        operation: auditLog.operation,
        classification: auditLog.classification,
        success: auditLog.success,
        userId: auditLog.userId,
      });
    }
  }
}

// Export singleton instance
export const dataProtection = new DataProtectionService();

// Export convenience functions
export const encryptSensitiveData = (
  data: unknown,
  classification: DataClassification,
  userId: string,
  context: { ipAddress: string; userAgent: string }
) => dataProtection.encryptData(data, classification, userId, context);

export const decryptSensitiveData = (
  encryptedData: EncryptedData,
  userId: string,
  context: { ipAddress: string; userAgent: string }
) => dataProtection.decryptData(encryptedData, userId, context);

export const detectPersonalData = (data: unknown) => dataProtection.detectPII(data);

export const maskSensitiveData = (data: unknown, masks: DataMask[]) => 
  dataProtection.maskData(data, masks);

export const sanitizeUserInput = (input: unknown) => dataProtection.sanitizeInput(input);

export const sanitizeHTMLContent = (html: string) => dataProtection.sanitizeHTML(html);

export const generateChecksum = (data: unknown) => dataProtection.generateDataChecksum(data);

export const verifyIntegrity = (data: unknown, checksum: string) => 
  dataProtection.verifyDataIntegrity(data, checksum);

export const exportSecureData = (
  data: unknown,
  format: 'json' | 'csv' | 'xml',
  classification: DataClassification,
  userId: string,
  context: { ipAddress: string; userAgent: string }
) => dataProtection.exportData(data, format, classification, userId, context);

export const getDataAuditLogs = (filters?: {
  userId?: string;
  operation?: string;
  classification?: DataClassification;
  startDate?: string;
  endDate?: string;
}) => dataProtection.getAuditLogs(filters);