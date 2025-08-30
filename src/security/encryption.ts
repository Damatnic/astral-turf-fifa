/**
 * Data Encryption and Protection Module
 * 
 * Provides comprehensive data encryption, hashing, and protection utilities
 * for sensitive information including PII, medical data, and financial records.
 */

import CryptoJS from 'crypto-js';
import { DATA_PROTECTION_CONFIG } from './config';
import { securityLogger } from './logging';

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
  data: string;          // Base64 encoded encrypted data
  iv: string;           // Base64 encoded initialization vector
  algorithm: EncryptionAlgorithm;
  classification: DataClassification;
  timestamp: string;    // ISO timestamp when encrypted
  keyVersion: number;   // Version of key used for rotation
  checksum?: string;    // Data integrity verification
}

// Key derivation result
export interface DerivedKey {
  key: CryptoJS.lib.WordArray;
  salt: CryptoJS.lib.WordArray;
}

// Encryption context for audit logging
export interface EncryptionContext {
  userId?: string;
  operation: 'encrypt' | 'decrypt';
  dataType: string;
  classification: DataClassification;
}

/**
 * Key Management Functions
 */

// Master key for encryption (in production, use secure key management service)
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'astral-turf-master-encryption-key-2024-secure';

// Generate a secure random key
export function generateKey(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
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
    const { key: derivedKey, salt } = deriveKey(key);
    
    // Generate random IV
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Encrypt data using AES-256-CBC (CryptoJS doesn't support GCM directly)
    const encrypted = CryptoJS.AES.encrypt(data, derivedKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    
    // Generate checksum for integrity verification
    const checksum = CryptoJS.SHA256(data).toString();
    
    const encryptedData: EncryptedData = {
      data: encrypted.toString(),
      iv: iv.toString(CryptoJS.enc.Base64),
      algorithm,
      classification,
      timestamp: new Date().toISOString(),
      keyVersion: 1,
      checksum,
    };
    
    // Log encryption operation
    if (context) {
      securityLogger.logSecurityEvent(
        'DATA_MODIFICATION' as any,
        'Data encrypted',
        {
          userId: context.userId,
          metadata: {
            operation: context.operation,
            dataType: context.dataType,
            classification: context.classification,
            algorithm,
            dataLength: data.length,
          },
        }
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
export function decryptData(
  encryptedData: EncryptedData,
  context?: EncryptionContext
): string {
  try {
    const key = getEncryptionKey(encryptedData.classification);
    const { key: derivedKey } = deriveKey(key);
    
    // Convert IV from base64
    const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);
    
    // Decrypt data
    const decrypted = CryptoJS.AES.decrypt(encryptedData.data, derivedKey, {
      iv: iv,
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
      securityLogger.logSecurityEvent(
        'DATA_ACCESS' as any,
        'Data decrypted',
        {
          userId: context.userId,
          metadata: {
            operation: context.operation,
            dataType: context.dataType,
            classification: encryptedData.classification,
            algorithm: encryptedData.algorithm,
            timestamp: encryptedData.timestamp,
          },
        }
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
export function encryptPersonalInfo(personalInfo: any, userId?: string): EncryptedData {
  const context: EncryptionContext = {
    userId,
    operation: 'encrypt',
    dataType: 'personal_info',
    classification: DataClassification.CONFIDENTIAL,
  };
  
  return encryptData(JSON.stringify(personalInfo), DataClassification.CONFIDENTIAL, EncryptionAlgorithm.AES_256_GCM, context);
}

// Decrypt personal information
export function decryptPersonalInfo(encryptedData: EncryptedData, userId?: string): any {
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
export function encryptMedicalData(medicalData: any, userId?: string): EncryptedData {
  const context: EncryptionContext = {
    userId,
    operation: 'encrypt',
    dataType: 'medical_data',
    classification: DataClassification.RESTRICTED,
  };
  
  return encryptData(JSON.stringify(medicalData), DataClassification.RESTRICTED, EncryptionAlgorithm.AES_256_GCM, context);
}

// Decrypt medical data
export function decryptMedicalData(encryptedData: EncryptedData, userId?: string): any {
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
export function encryptFinancialData(financialData: any, userId?: string): EncryptedData {
  const context: EncryptionContext = {
    userId,
    operation: 'encrypt',
    dataType: 'financial_data',
    classification: DataClassification.CONFIDENTIAL,
  };
  
  return encryptData(JSON.stringify(financialData), DataClassification.CONFIDENTIAL, EncryptionAlgorithm.AES_256_GCM, context);
}

// Decrypt financial information
export function decryptFinancialData(encryptedData: EncryptedData, userId?: string): any {
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
export function anonymizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveFields = ['email', 'phone', 'ssn', 'creditCard', 'address', 'name'];
  const anonymized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (anonymized[field]) {
      if (typeof anonymized[field] === 'string') {
        anonymized[field] = maskSensitiveData(anonymized[field]);
      }
    }
  });
  
  return anonymized;
}

/**
 * Secure Random Generation
 */

// Generate cryptographically secure random string
export function generateSecureRandom(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate secure token for sessions, reset codes, etc.
export function generateSecureToken(length = 32): string {
  return generateSecureRandom(length);
}

// Generate UUID v4
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Data Protection Utilities
 */

// Check if data requires encryption based on content
export function requiresEncryption(data: any, fieldName?: string): DataClassification | null {
  if (!data) return null;
  
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
export function secureDeepCopy(obj: any, userId?: string): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => secureDeepCopy(item, userId));
  }
  
  const copy: any = {};
  Object.keys(obj).forEach(key => {
    const classification = requiresEncryption(obj[key], key);
    
    if (classification && classification !== DataClassification.PUBLIC) {
      // Encrypt sensitive data
      copy[key] = encryptData(
        typeof obj[key] === 'string' ? obj[key] : JSON.stringify(obj[key]),
        classification,
        EncryptionAlgorithm.AES_256_GCM,
        { userId, operation: 'encrypt', dataType: key, classification }
      );
    } else {
      copy[key] = secureDeepCopy(obj[key], userId);
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