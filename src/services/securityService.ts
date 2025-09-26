/**
 * Security Service for Data Encryption and Authentication
 *
 * Provides encryption, decryption, and security utilities for cloud sync
 * and external API integrations
 */

import CryptoJS from 'crypto-js';

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  iterations: number;
}

class SecurityService {
  private readonly defaultConfig: EncryptionConfig = {
    algorithm: 'AES',
    keySize: 256,
    iterations: 10000,
  };

  private encryptionKey: string | null = null;

  /**
   * Initialize security service with user-specific encryption key
   */
  initialize(userKey: string): void {
    this.encryptionKey = this.deriveKey(userKey);
  }

  /**
   * Encrypt sensitive data before transmission
   */
  async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Security service not initialized');
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
      return encrypted;
    } catch (_error) {
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt received data
   */
  async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Security service not initialized');
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (_error) {
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate secure API key for external integrations
   */
  generateApiKey(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  /**
   * Hash password for secure storage
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const usedSalt = salt || CryptoJS.lib.WordArray.random(16).toString();
    const hash = CryptoJS.PBKDF2(password, usedSalt, {
      keySize: this.defaultConfig.keySize / 32,
      iterations: this.defaultConfig.iterations,
    }).toString();

    return { hash, salt: usedSalt };
  }

  /**
   * Verify password against hash
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const newHash = this.hashPassword(password, salt).hash;
    return newHash === hash;
  }

  /**
   * Generate secure session token
   */
  generateSessionToken(): string {
    const timestamp = Date.now().toString();
    const random = CryptoJS.lib.WordArray.random(16).toString();
    return CryptoJS.SHA256(timestamp + random).toString();
  }

  /**
   * Sanitize data for secure transmission
   */
  sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: unknown = {};
      for (const key in data) {
        sanitized[key] = this.sanitizeData(data[key]);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Validate API key format
   */
  validateApiKey(apiKey: string): boolean {
    return /^[a-zA-Z0-9]{64}$/.test(apiKey);
  }

  private deriveKey(userKey: string): string {
    return CryptoJS.PBKDF2(userKey, 'astral_turf_salt', {
      keySize: this.defaultConfig.keySize / 32,
      iterations: this.defaultConfig.iterations,
    }).toString();
  }
}

// Create singleton instance
const securityService = new SecurityService();

// Export convenience methods
export const encrypt = (data: string) => securityService.encrypt(data);
export const decrypt = (data: string) => securityService.decrypt(data);
export const initSecurity = (userKey: string) => securityService.initialize(userKey);

export default securityService;