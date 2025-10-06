/**
 * Data Encryption and Protection Module
 *
 * Provides comprehensive data encryption, hashing, and protection utilities
 * for sensitive information including PII, medical data, and financial records.
 */

import CryptoJS from 'crypto-js';
import { securityLogger, SecurityEventType } from './logging';
import type { SecurityEventContext } from './logging';
import { bytesToBase64, bytesToHex, getSecureRandomBytes, randomHex } from './runtime';

// Encryption algorithm configuration
export enum EncryptionAlgorithm {
  AES_256_GCM = 'AES-256-GCM',
  AES_256_CBC = 'AES-256-CBC',
  AES_192_GCM = 'AES-192-GCM',
  AES_128_GCM = 'AES-128-GCM',
}

// Data classification levels
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
}

// Encrypted data structure
export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  algorithm: EncryptionAlgorithm;
  classification: DataClassification;
  timestamp: string; // ISO timestamp when encrypted
  keyVersion: number; // Version of key used for rotation
  checksum?: string; // Data integrity verification
}

// Key derivation result
export interface DerivedKey {
  key: CryptoJS.lib.WordArray;
  salt: CryptoJS.lib.WordArray;
}

// Encryption context for audit logging
export interface EncryptionContext
  extends Pick<
    SecurityEventContext,
    'userId' | 'sessionId' | 'ipAddress' | 'userAgent' | 'resource' | 'action'
  > {
  operation: 'encrypt' | 'decrypt';
  dataType: string;
  classification: DataClassification;
}

function createWordArray(bytes: Uint8Array): CryptoJS.lib.WordArray {
  return CryptoJS.lib.WordArray.create(bytes as any, bytes.length);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Key Management Functions
 */

// Master key for encryption (in production, use secure key management service)
const MASTER_KEY =
  process.env.ENCRYPTION_MASTER_KEY || 'astral-turf-master-encryption-key-2024-secure';

// Generate a secure random key
export function generateKey(length = 32): string {
  const randomBytes = getSecureRandomBytes(length);
  return bytesToBase64(randomBytes);
}

// Derive key from master key and salt using PBKDF2
export function deriveKey(password: string, salt?: CryptoJS.lib.WordArray): DerivedKey {
  const saltArray = salt || CryptoJS.lib.WordArray.random(16);
  const key = CryptoJS.PBKDF2(password, saltArray, {
    keySize: 8, // 256 bits / 32 bits per word = 8 words
    iterations: 10000,
    hasher: CryptoJS.algo.SHA256,
  });

  return { key, salt: saltArray };
}

// Get encryption key for data classification level
function getEncryptionKey(classification: DataClassification): string {
  // In production, different keys would be used for different classification levels
  const keys = {
    [DataClassification.PUBLIC]: MASTER_KEY,
    [DataClassification.INTERNAL]: MASTER_KEY + '-internal',
    [DataClassification.CONFIDENTIAL]: MASTER_KEY + '-confidential',
    [DataClassification.RESTRICTED]: MASTER_KEY + '-restricted',
  };

  return keys[classification] || MASTER_KEY;
}

/**
 * Encryption Functions
 */

// Encrypt data with specified classification level
export function encryptData(
  data: string,
  classification: DataClassification = DataClassification.INTERNAL,
  algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM,
  context?: EncryptionContext
): EncryptedData {
  try {
    if (!data) {
      throw new Error('Data cannot be empty');
    }

    const key = getEncryptionKey(classification);
    const { key: derivedKey } = deriveKey(key);

    // Generate random IV using shared runtime helpers
    const ivBytes = getSecureRandomBytes(16);
    const iv = createWordArray(ivBytes);

    // Encrypt data using AES-256-CBC (CryptoJS doesn't support GCM directly)
    const encrypted = CryptoJS.AES.encrypt(data, derivedKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Generate checksum for integrity verification
    const checksum = CryptoJS.SHA256(data).toString();

    const encryptedData: EncryptedData = {
      data: encrypted.toString(),
      iv: bytesToBase64(ivBytes),
      algorithm,
      classification,
      timestamp: new Date().toISOString(),
      keyVersion: 1,
      checksum,
    };

    // Log encryption operation
    if (context) {
      const auditContext: SecurityEventContext = {
        userId: context.userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        resource: context.resource,
        action: context.action,
        metadata: {
          operation: context.operation,
          dataType: context.dataType,
          classification: context.classification,
          algorithm,
          dataLength: data.length,
        },
      };

      securityLogger.logSecurityEvent(
        SecurityEventType.DATA_MODIFICATION,
        'Data encrypted',
        auditContext
      );
    }

    return encryptedData;
  } catch (error) {
    securityLogger.error('Data encryption failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      classification,
      algorithm,
      dataLength: data?.length || 0,
    });

    throw new Error('Data encryption failed');
  }
}

// Decrypt data
export function decryptData(encryptedData: EncryptedData, context?: EncryptionContext): string {
  try {
    const key = getEncryptionKey(encryptedData.classification);
    const { key: derivedKey } = deriveKey(key);

    // Convert IV from base64
    const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);

    // Decrypt data
    const decrypted = CryptoJS.AES.decrypt(encryptedData.data, derivedKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }

    // Verify integrity if checksum exists
    if (encryptedData.checksum) {
      const computedChecksum = CryptoJS.SHA256(decryptedText).toString();
      if (computedChecksum !== encryptedData.checksum) {
        throw new Error('Data integrity check failed');
      }
    }

    // Log decryption operation
    if (context) {
      const auditContext: SecurityEventContext = {
        userId: context.userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        resource: context.resource,
        action: context.action,
        metadata: {
          operation: context.operation,
          dataType: context.dataType,
          classification: encryptedData.classification,
          algorithm: encryptedData.algorithm,
          timestamp: encryptedData.timestamp,
        },
      };

      securityLogger.logSecurityEvent(
        SecurityEventType.DATA_ACCESS,
        'Data decrypted',
        auditContext
      );
    }

    return decryptedText;
  } catch (error) {
    securityLogger.error('Data decryption failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      classification: encryptedData.classification,
      algorithm: encryptedData.algorithm,
      timestamp: encryptedData.timestamp,
    });

    throw new Error('Data decryption failed');
  }
}

/**
 * Specialized Encryption Functions
 */

// Encrypt sensitive personal information
export function encryptPersonalInfo(personalInfo: unknown, userId?: string): EncryptedData {
  const context: EncryptionContext = {
    userId,
    operation: 'encrypt',
    dataType: 'personal_info',
    classification: DataClassification.CONFIDENTIAL,
  };

  return encryptData(
    JSON.stringify(personalInfo),
    DataClassification.CONFIDENTIAL,
    EncryptionAlgorithm.AES_256_GCM,
    context
  );
}

// Decrypt personal information
export function decryptPersonalInfo(encryptedData: EncryptedData, userId?: string): unknown {
  const context: EncryptionContext = {
    userId,
    operation: 'decrypt',
    dataType: 'personal_info',
    classification: encryptedData.classification,
  };

  const decryptedText = decryptData(encryptedData, context);
  return JSON.parse(decryptedText);
}

// Encrypt medical data (highest security level)
export function encryptMedicalData(medicalData: unknown, userId?: string): EncryptedData {
  const context: EncryptionContext = {
    userId,
    operation: 'encrypt',
    dataType: 'medical_data',
    classification: DataClassification.RESTRICTED,
  };

  return encryptData(
    JSON.stringify(medicalData),
    DataClassification.RESTRICTED,
    EncryptionAlgorithm.AES_256_GCM,
    context
  );
}

// Decrypt medical data
export function decryptMedicalData(encryptedData: EncryptedData, userId?: string): unknown {
  const context: EncryptionContext = {
    userId,
    operation: 'decrypt',
    dataType: 'medical_data',
    classification: encryptedData.classification,
  };

  const decryptedText = decryptData(encryptedData, context);
  return JSON.parse(decryptedText);
}

// Encrypt financial information
export function encryptFinancialData(financialData: unknown, userId?: string): EncryptedData {
  const context: EncryptionContext = {
    userId,
    operation: 'encrypt',
    dataType: 'financial_data',
    classification: DataClassification.CONFIDENTIAL,
  };

  return encryptData(
    JSON.stringify(financialData),
    DataClassification.CONFIDENTIAL,
    EncryptionAlgorithm.AES_256_GCM,
    context
  );
}

// Decrypt financial information
export function decryptFinancialData(encryptedData: EncryptedData, userId?: string): unknown {
  const context: EncryptionContext = {
    userId,
    operation: 'decrypt',
    dataType: 'financial_data',
    classification: encryptedData.classification,
  };

  const decryptedText = decryptData(encryptedData, context);
  return JSON.parse(decryptedText);
}

/**
 * Hashing Functions
 */

// Secure hash generation
export function generateSecureHash(data: string, salt?: string): string {
  const saltStr = salt || CryptoJS.lib.WordArray.random(16).toString();
  return CryptoJS.SHA256(data + saltStr).toString();
}

// Generate hash with salt for password storage
export function generateHashWithSalt(data: string): { hash: string; salt: string } {
  const salt = CryptoJS.lib.WordArray.random(16).toString();
  const hash = CryptoJS.SHA256(data + salt).toString();

  return { hash, salt };
}

// Verify hash with salt
export function verifyHash(data: string, hash: string, salt: string): boolean {
  const computedHash = CryptoJS.SHA256(data + salt).toString();
  return computedHash === hash;
}

// Generate HMAC for data integrity
export function generateHMAC(data: string, secret: string): string {
  return CryptoJS.HmacSHA256(data, secret).toString();
}

// Verify HMAC
export function verifyHMAC(data: string, hmac: string, secret: string): boolean {
  const computedHMAC = generateHMAC(data, secret);
  return computedHMAC === hmac;
}

/**
 * Data Masking and Anonymization
 */

// Mask sensitive data for logging
export function maskSensitiveData(data: string, maskChar = '*', visibleChars = 4): string {
  if (!data || data.length <= visibleChars) {
    return maskChar.repeat(data?.length || 8);
  }

  const visiblePrefix = data.substring(0, Math.ceil(visibleChars / 2));
  const visibleSuffix = data.substring(data.length - Math.floor(visibleChars / 2));
  const maskedMiddle = maskChar.repeat(Math.max(4, data.length - visibleChars));

  return visiblePrefix + maskedMiddle + visibleSuffix;
}

// Anonymize personal identifiers
export function anonymizeData(data: unknown): unknown {
  if (!isRecord(data)) {
    return data;
  }

  const sensitiveFields = ['email', 'phone', 'ssn', 'creditCard', 'address', 'name'];
  const anonymized: Record<string, unknown> = { ...data };

  sensitiveFields.forEach(field => {
    if (!Object.prototype.hasOwnProperty.call(anonymized, field)) {
      return;
    }

    const value = anonymized[field];
    if (typeof value === 'string') {
      anonymized[field] = maskSensitiveData(value);
    }
  });

  return anonymized;
}

/**
 * Secure Random Generation
 */

// Generate cryptographically secure random string
export function generateSecureRandom(length = 32): string {
  return randomHex(length);
}

// Generate secure token for sessions, reset codes, etc.
export function generateSecureToken(length = 32): string {
  return generateSecureRandom(length);
}

// Generate UUID v4
export function generateUUID(): string {
  const bytes = getSecureRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Data Protection Utilities
 */

// Check if data requires encryption based on content
export function requiresEncryption(data: unknown, fieldName?: string): DataClassification | null {
  if (!data) {
    return null;
  }

  const restrictedFields = ['ssn', 'medicalRecord', 'diagnosis', 'prescription'];
  const confidentialFields = ['email', 'phone', 'address', 'bankAccount', 'creditCard'];
  const internalFields = ['notes', 'comments', 'personalInfo'];

  if (fieldName) {
    if (restrictedFields.some(field => fieldName.toLowerCase().includes(field))) {
      return DataClassification.RESTRICTED;
    }
    if (confidentialFields.some(field => fieldName.toLowerCase().includes(field))) {
      return DataClassification.CONFIDENTIAL;
    }
    if (internalFields.some(field => fieldName.toLowerCase().includes(field))) {
      return DataClassification.INTERNAL;
    }
  }

  // Content-based detection
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

  // Medical terms
  const medicalTerms = ['diagnosis', 'medication', 'allergy', 'medical', 'health', 'treatment'];
  if (medicalTerms.some(term => dataStr.toLowerCase().includes(term))) {
    return DataClassification.RESTRICTED;
  }

  // Financial terms
  const financialTerms = ['bank', 'credit', 'card', 'account', 'payment', 'salary', 'wage'];
  if (financialTerms.some(term => dataStr.toLowerCase().includes(term))) {
    return DataClassification.CONFIDENTIAL;
  }

  return DataClassification.INTERNAL;
}

// Secure object deep copy with encryption
export function secureDeepCopy(obj: unknown, userId?: string): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map(item => secureDeepCopy(item, userId));
  }

  if (!isRecord(obj)) {
    return obj;
  }

  const copy: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const classification = requiresEncryption(value, key);

    if (classification && classification !== DataClassification.PUBLIC) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      copy[key] = encryptData(serialized, classification, EncryptionAlgorithm.AES_256_GCM, {
        userId,
        operation: 'encrypt',
        dataType: key,
        classification,
      });
    } else {
      copy[key] = secureDeepCopy(value, userId);
    }
  });

  return copy;
}

// Export encryption utilities
export const encryptionUtils = {
  generateKey,
  deriveKey,
  encryptData,
  decryptData,
  encryptPersonalInfo,
  decryptPersonalInfo,
  encryptMedicalData,
  decryptMedicalData,
  encryptFinancialData,
  decryptFinancialData,
  generateSecureHash,
  generateHashWithSalt,
  verifyHash,
  generateHMAC,
  verifyHMAC,
  maskSensitiveData,
  anonymizeData,
  generateSecureRandom,
  generateSecureToken,
  generateUUID,
  requiresEncryption,
  secureDeepCopy,
};
