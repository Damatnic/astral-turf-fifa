/**
 * JWT Secret Rotation Service
 *
 * Production-ready JWT secret rotation system with graceful transitions,
 * automatic rotation scheduling, and secure key management.
 */

import { randomBytes, createHmac } from 'crypto';
import { cache, redisService } from './redisService';
import { databaseService } from './databaseService';
import { log, SecurityEventType } from './loggingService';

export interface JWTKey {
  id: string;
  secret: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  version: number;
}

export interface RotationConfig {
  rotationIntervalHours: number;
  gracePeriodHours: number;
  keyLength: number;
  maxKeysToKeep: number;
  autoRotation: boolean;
}

/**
 * JWT Secret Rotation Service
 *
 * Manages JWT secret rotation with zero-downtime key transitions
 */
class JWTRotationService {
  private currentKey: JWTKey | null = null;
  private previousKeys: JWTKey[] = [];
  private rotationTimer: unknown | null = null;
  private isInitialized = false;

  private readonly config: RotationConfig = {
    rotationIntervalHours: parseInt(process.env.JWT_ROTATION_INTERVAL_HOURS || '24'), // 24 hours
    gracePeriodHours: parseInt(process.env.JWT_GRACE_PERIOD_HOURS || '2'), // 2 hours
    keyLength: parseInt(process.env.JWT_KEY_LENGTH || '64'), // 64 bytes
    maxKeysToKeep: parseInt(process.env.JWT_MAX_KEYS || '5'), // Keep last 5 keys
    autoRotation: process.env.JWT_AUTO_ROTATION !== 'false', // Default true
  };

  /**
   * Initialize the JWT rotation service
   */
  async initialize(): Promise<void> {
    try {
      log.info('Initializing JWT rotation service', {
        metadata: {
          rotationInterval: this.config.rotationIntervalHours,
          gracePeriod: this.config.gracePeriodHours,
          autoRotation: this.config.autoRotation,
        },
      });

      // Load existing keys from storage
      await this.loadKeysFromStorage();

      // Create initial key if none exists
      if (!this.currentKey) {
        await this.generateNewKey();
      }

      // Schedule automatic rotation if enabled
      if (this.config.autoRotation) {
        this.scheduleRotation();
      }

      this.isInitialized = true;

      log.info('JWT rotation service initialized successfully', {
        metadata: {
          currentKeyId: this.currentKey?.id,
          previousKeysCount: this.previousKeys.length,
        },
      });
    } catch (_error) {
      log.error('Failed to initialize JWT rotation service', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
      });
      throw _error;
    }
  }

  /**
   * Get the current active signing key
   */
  getCurrentSigningKey(): string {
    if (!this.isInitialized || !this.currentKey) {
      throw new Error('JWT rotation service not initialized or no current key available');
    }

    return this.currentKey.secret;
  }

  /**
   * Get all valid verification keys (current + previous within grace period)
   */
  getVerificationKeys(): JWTKey[] {
    if (!this.isInitialized) {
      throw new Error('JWT rotation service not initialized');
    }

    const now = new Date();
    const validKeys: JWTKey[] = [];

    // Always include current key
    if (this.currentKey) {
      validKeys.push(this.currentKey);
    }

    // Include previous keys that are still within grace period
    for (const key of this.previousKeys) {
      if (key.expiresAt > now) {
        validKeys.push(key);
      }
    }

    return validKeys.sort((a, b) => b.version - a.version);
  }

  /**
   * Get key by ID for verification
   */
  getKeyById(keyId: string): JWTKey | null {
    const validKeys = this.getVerificationKeys();
    return validKeys.find(key => key.id === keyId) || null;
  }

  /**
   * Manually trigger key rotation
   */
  async rotateKey(reason = 'Manual rotation'): Promise<void> {
    try {
      log.info('Starting JWT key rotation', { metadata: { reason } });

      // Generate new key
      const newKey = await this.generateNewKey();

      // Move current key to previous keys
      if (this.currentKey) {
        this.currentKey.isActive = false;
        this.previousKeys.unshift(this.currentKey);
      }

      // Set new key as current
      this.currentKey = newKey;

      // Clean up old keys
      await this.cleanupOldKeys();

      // Save to storage
      await this.saveKeysToStorage();

      // Cache keys for quick access
      await this.cacheKeys();

      log.security(SecurityEventType.CONFIGURATION_CHANGE, 'JWT key rotated successfully', {
        metadata: {
          newKeyId: newKey.id,
          reason,
          previousKeysCount: this.previousKeys.length,
        },
      });
    } catch (_error) {
      log.error('JWT key rotation failed', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
        metadata: { reason },
      });
      throw _error;
    }
  }

  /**
   * Emergency key revocation (invalidates all keys and generates new one)
   */
  async emergencyRevocation(reason: string): Promise<void> {
    try {
      log.security(
        SecurityEventType.CONFIGURATION_CHANGE,
        'Emergency JWT key revocation initiated',
        {
          severity: 'critical',
          metadata: { reason },
        }
      );

      // Clear all existing keys
      this.previousKeys = [];

      // Generate new key immediately
      this.currentKey = await this.generateNewKey();

      // Save to storage
      await this.saveKeysToStorage();

      // Clear cache
      await this.clearKeyCache();

      // Cache new key
      await this.cacheKeys();

      log.security(
        SecurityEventType.CONFIGURATION_CHANGE,
        'Emergency JWT key revocation completed',
        {
          severity: 'critical',
          metadata: {
            newKeyId: this.currentKey.id,
            reason,
          },
        }
      );
    } catch (_error) {
      log.error('Emergency JWT key revocation failed', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
        metadata: { reason },
      });
      throw _error;
    }
  }

  /**
   * Generate a new JWT key
   */
  private async generateNewKey(): Promise<JWTKey> {
    const keyId = this.generateKeyId();
    const secret = this.generateSecret();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.gracePeriodHours * 60 * 60 * 1000);
    const version = this.getNextVersion();

    const newKey: JWTKey = {
      id: keyId,
      secret,
      createdAt: now,
      expiresAt,
      isActive: true,
      version,
    };

    log.info('Generated new JWT key', {
      metadata: {
        keyId: newKey.id,
        version: newKey.version,
        expiresAt: newKey.expiresAt.toISOString(),
      },
    });

    return newKey;
  }

  /**
   * Generate a unique key ID
   */
  private generateKeyId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString('hex');
    return `jwt_${timestamp}_${random}`;
  }

  /**
   * Generate a cryptographically secure secret
   */
  private generateSecret(): string {
    return randomBytes(this.config.keyLength).toString('base64');
  }

  /**
   * Get the next version number
   */
  private getNextVersion(): number {
    const currentVersion = this.currentKey?.version || 0;
    return currentVersion + 1;
  }

  /**
   * Schedule automatic key rotation
   */
  private scheduleRotation(): void {
    if (this.rotationTimer) {
      clearTimeout(this.rotationTimer as any);
    }

    const intervalMs = this.config.rotationIntervalHours * 60 * 60 * 1000;

    this.rotationTimer = setTimeout(async () => {
      try {
        await this.rotateKey('Scheduled rotation');
        this.scheduleRotation(); // Schedule next rotation
      } catch (_error) {
        log.error('Scheduled JWT rotation failed', {
          error: _error instanceof Error ? _error.message : 'Unknown error',
        });

        // Retry in 1 hour
        setTimeout(() => this.scheduleRotation(), 60 * 60 * 1000);
      }
    }, intervalMs);

    log.info('JWT rotation scheduled', {
      metadata: {
        nextRotationIn: `${this.config.rotationIntervalHours} hours`,
        nextRotationAt: new Date(Date.now() + intervalMs).toISOString(),
      },
    });
  }

  /**
   * Clean up expired keys
   */
  private async cleanupOldKeys(): Promise<void> {
    const now = new Date();
    const initialCount = this.previousKeys.length;

    // Remove expired keys
    this.previousKeys = this.previousKeys.filter(key => key.expiresAt > now);

    // Limit number of keys kept
    if (this.previousKeys.length > this.config.maxKeysToKeep) {
      this.previousKeys = this.previousKeys
        .sort((a, b) => b.version - a.version)
        .slice(0, this.config.maxKeysToKeep);
    }

    const cleanedCount = initialCount - this.previousKeys.length;

    if (cleanedCount > 0) {
      log.info('Cleaned up old JWT keys', {
        metadata: {
          keysRemoved: cleanedCount,
          keysRemaining: this.previousKeys.length,
        },
      });
    }
  }

  /**
   * Load keys from persistent storage
   */
  private async loadKeysFromStorage(): Promise<void> {
    try {
      // Try Redis cache first
      if (redisService.isHealthy()) {
        const cachedKeys = await cache.get('jwt_keys');
        if (cachedKeys) {
          this.currentKey = cachedKeys.current;
          this.previousKeys = cachedKeys.previous || [];
          log.info('Loaded JWT keys from Redis cache');
          return;
        }
      }

      // Fallback to database
      const db = databaseService.getClient();
      const systemConfig = await (db as any).systemConfig.findMany({
        where: {
          key: {
            startsWith: 'jwt_key_',
          },
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (systemConfig.length > 0) {
        const keys = systemConfig.map(config => JSON.parse(config.value) as JWTKey);
        this.currentKey = keys.find(key => key.isActive) || keys[0];
        this.previousKeys = keys.filter(key => !key.isActive);

        log.info('Loaded JWT keys from database', {
          metadata: {
            currentKeyId: this.currentKey?.id,
            previousKeysCount: this.previousKeys.length,
          },
        });
      }
    } catch (_error) {
      log.error('Failed to load JWT keys from storage', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
      });
    }
  }

  /**
   * Save keys to persistent storage
   */
  private async saveKeysToStorage(): Promise<void> {
    try {
      const db = databaseService.getClient();

      // Save current key
      if (this.currentKey) {
        await (db as any).systemConfig.upsert({
          where: { key: `jwt_key_${this.currentKey.id}` },
          create: {
            key: `jwt_key_${this.currentKey.id}`,
            value: JSON.stringify(this.currentKey),
            description: `JWT signing key - Version ${this.currentKey.version}`,
            isActive: true,
          },
          update: {
            value: JSON.stringify(this.currentKey),
            isActive: true,
          },
        });
      }

      // Save previous keys
      for (const key of this.previousKeys) {
        await (db as any).systemConfig.upsert({
          where: { key: `jwt_key_${key.id}` },
          create: {
            key: `jwt_key_${key.id}`,
            value: JSON.stringify(key),
            description: `JWT verification key - Version ${key.version}`,
            isActive: false,
          },
          update: {
            value: JSON.stringify(key),
            isActive: false,
          },
        });
      }

      log.info('Saved JWT keys to database');
    } catch (_error) {
      log.error('Failed to save JWT keys to database', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
      });
    }
  }

  /**
   * Cache keys for quick access
   */
  private async cacheKeys(): Promise<void> {
    try {
      if (redisService.isHealthy()) {
        await cache.set(
          'jwt_keys',
          {
            current: this.currentKey,
            previous: this.previousKeys,
          },
          { ttl: 3600 }
        ); // Cache for 1 hour

        log.debug('Cached JWT keys in Redis');
      }
    } catch (_error) {
      log.error('Failed to cache JWT keys', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
      });
    }
  }

  /**
   * Clear key cache
   */
  private async clearKeyCache(): Promise<void> {
    try {
      if (redisService.isHealthy()) {
        await cache.del('jwt_keys');
        log.debug('Cleared JWT key cache');
      }
    } catch (_error) {
      log.error('Failed to clear JWT key cache', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get rotation status and statistics
   */
  getRotationStatus(): {
    initialized: boolean;
    currentKey: {
      id: string;
      version: number;
      createdAt: string;
      expiresAt: string;
    } | null;
    previousKeysCount: number;
    nextRotationAt: string | null;
    autoRotationEnabled: boolean;
    gracePeriodHours: number;
  } {
    const nextRotationMs = this.config.rotationIntervalHours * 60 * 60 * 1000;
    const nextRotationAt = this.currentKey
      ? new Date(this.currentKey.createdAt.getTime() + nextRotationMs).toISOString()
      : null;

    return {
      initialized: this.isInitialized,
      currentKey: this.currentKey
        ? {
            id: this.currentKey.id,
            version: this.currentKey.version,
            createdAt: this.currentKey.createdAt.toISOString(),
            expiresAt: this.currentKey.expiresAt.toISOString(),
          }
        : null,
      previousKeysCount: this.previousKeys.length,
      nextRotationAt,
      autoRotationEnabled: this.config.autoRotation,
      gracePeriodHours: this.config.gracePeriodHours,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      initialized: boolean;
      hasCurrentKey: boolean;
      keysCount: number;
      nextRotation: string | null;
      cacheAvailable: boolean;
    };
  }> {
    try {
      const status = this.getRotationStatus();
      const cacheAvailable = redisService.isHealthy();

      const isHealthy = this.isInitialized && this.currentKey !== null;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          initialized: status.initialized,
          hasCurrentKey: status.currentKey !== null,
          keysCount: status.previousKeysCount + (status.currentKey ? 1 : 0),
          nextRotation: status.nextRotationAt,
          cacheAvailable,
        },
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        details: {
          initialized: false,
          hasCurrentKey: false,
          keysCount: 0,
          nextRotation: null,
          cacheAvailable: false,
        },
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      log.info('Shutting down JWT rotation service');

      if (this.rotationTimer) {
        clearTimeout(this.rotationTimer as any);
        this.rotationTimer = null;
      }

      // Save current state
      await this.saveKeysToStorage();

      this.isInitialized = false;

      log.info('JWT rotation service shut down successfully');
    } catch (_error) {
      log.error('Error during JWT rotation service shutdown', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
      });
    }
  }
}

// Singleton instance
export const jwtRotationService = new JWTRotationService();
