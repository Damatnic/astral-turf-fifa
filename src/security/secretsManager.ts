/**
 * Enterprise Secrets Management System
 *
 * Comprehensive secrets management with automatic rotation, versioning,
 * encryption at rest, and secure distribution across the application.
 */

import CryptoJS from 'crypto-js';
import { securityLogger, SecurityEventType } from './logging';
import {
  generateSecureRandom,
  generateUUID,
  encryptData,
  decryptData,
  DataClassification,
  EncryptedData,
} from './encryption';

// Secret types and categories
export enum SecretType {
  API_KEY = 'api_key',
  DATABASE_CREDENTIAL = 'database_credential',
  JWT_SECRET = 'jwt_secret',
  ENCRYPTION_KEY = 'encryption_key',
  OAUTH_SECRET = 'oauth_secret',
  WEBHOOK_SECRET = 'webhook_secret',
  THIRD_PARTY_TOKEN = 'third_party_token',
  CERTIFICATE = 'certificate',
  SSH_KEY = 'ssh_key',
}

// Secret status
export enum SecretStatus {
  ACTIVE = 'active',
  ROTATING = 'rotating',
  DEPRECATED = 'deprecated',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

// Secret rotation strategy
export enum RotationStrategy {
  MANUAL = 'manual',
  TIME_BASED = 'time_based',
  USAGE_BASED = 'usage_based',
  RISK_BASED = 'risk_based',
}

// Secret metadata
export interface SecretMetadata {
  id: string;
  name: string;
  type: SecretType;
  classification: DataClassification;
  description?: string;
  tags: string[];
  environment: string;
  owner: string;
  rotationStrategy: RotationStrategy;
  rotationIntervalMs: number;
  maxUsageCount?: number;
  usageCount: number;
  status: SecretStatus;
  createdAt: string;
  updatedAt: string;
  lastRotatedAt?: string;
  nextRotationAt?: string;
  expiresAt?: string;
  lastAccessedAt?: string;
  accessCount: number;
  version: number;
  previousVersions: string[];
}

// Secret data structure
export interface Secret {
  metadata: SecretMetadata;
  value: EncryptedData;
  checksum: string;
}

// Secret access context
export interface SecretAccessContext {
  userId: string;
  service: string;
  purpose: string;
  ipAddress?: string;
  timestamp: string;
}

// Rotation result
export interface RotationResult {
  success: boolean;
  newVersion?: number;
  oldSecretId?: string;
  newSecretId?: string;
  rotatedAt?: string;
  error?: string;
}

// Secret access audit
export interface SecretAccessAudit {
  secretId: string;
  userId: string;
  service: string;
  purpose: string;
  action: 'retrieve' | 'create' | 'update' | 'delete' | 'rotate';
  timestamp: string;
  ipAddress?: string;
  success: boolean;
  error?: string;
}

// In-memory secret store (replace with secure key management service in production)
const secretStore = new Map<string, Secret>();
const secretAudits: SecretAccessAudit[] = [];

// Master encryption key for secrets (in production, use HSM or KMS)
const MASTER_SECRET_KEY = process.env.SECRETS_MASTER_KEY || 'astral-turf-secrets-master-key-2024';

/**
 * Secret Creation and Management
 */

// Create a new secret
export function createSecret(
  name: string,
  value: string,
  type: SecretType,
  options: {
    description?: string;
    tags?: string[];
    environment?: string;
    owner?: string;
    rotationStrategy?: RotationStrategy;
    rotationIntervalMs?: number;
    maxUsageCount?: number;
    expiresAt?: string;
    classification?: DataClassification;
  } = {},
  context: SecretAccessContext,
): string {
  try {
    const secretId = generateUUID();
    const now = new Date().toISOString();

    // Determine classification based on secret type
    const classification = options.classification || getDefaultClassification(type);

    // Encrypt the secret value
    const encryptedValue = encryptData(value, classification);

    // Generate checksum for integrity
    const checksum = CryptoJS.SHA256(value).toString();

    // Calculate next rotation time
    const rotationIntervalMs = options.rotationIntervalMs || getDefaultRotationInterval(type);
    const nextRotationAt = new Date(Date.now() + rotationIntervalMs).toISOString();

    const metadata: SecretMetadata = {
      id: secretId,
      name,
      type,
      classification,
      description: options.description,
      tags: options.tags || [],
      environment: options.environment || 'production',
      owner: options.owner || context.userId,
      rotationStrategy: options.rotationStrategy || RotationStrategy.TIME_BASED,
      rotationIntervalMs,
      maxUsageCount: options.maxUsageCount,
      usageCount: 0,
      status: SecretStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      nextRotationAt,
      expiresAt: options.expiresAt,
      accessCount: 0,
      version: 1,
      previousVersions: [],
    };

    const secret: Secret = {
      metadata,
      value: encryptedValue,
      checksum,
    };

    secretStore.set(secretId, secret);

    // Audit the creation
    auditSecretAccess({
      secretId,
      userId: context.userId,
      service: context.service,
      purpose: 'Secret creation',
      action: 'create',
      timestamp: now,
      ipAddress: context.ipAddress,
      success: true,
    });

    securityLogger.logSecurityEvent(SecurityEventType.DATA_MODIFICATION, 'Secret created', {
      userId: context.userId,
      metadata: {
        secretId,
        name,
        type,
        classification,
        environment: metadata.environment,
      },
    });

    return secretId;
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';

    securityLogger.error('Secret creation failed', {
      userId: context.userId,
      name,
      type,
      error: errorMessage,
    });

    throw new Error(`Failed to create secret: ${errorMessage}`);
  }
}

// Retrieve a secret value
export function getSecret(secretId: string, context: SecretAccessContext): string | null {
  try {
    const secret = secretStore.get(secretId);

    if (!secret) {
      auditSecretAccess({
        secretId,
        userId: context.userId,
        service: context.service,
        purpose: context.purpose,
        action: 'retrieve',
        timestamp: new Date().toISOString(),
        ipAddress: context.ipAddress,
        success: false,
        error: 'Secret not found',
      });

      return null;
    }

    // Check if secret is active
    if (secret.metadata.status !== SecretStatus.ACTIVE) {
      auditSecretAccess({
        secretId,
        userId: context.userId,
        service: context.service,
        purpose: context.purpose,
        action: 'retrieve',
        timestamp: new Date().toISOString(),
        ipAddress: context.ipAddress,
        success: false,
        error: `Secret status: ${secret.metadata.status}`,
      });

      return null;
    }

    // Check expiration
    if (secret.metadata.expiresAt && new Date(secret.metadata.expiresAt) < new Date()) {
      secret.metadata.status = SecretStatus.EXPIRED;

      auditSecretAccess({
        secretId,
        userId: context.userId,
        service: context.service,
        purpose: context.purpose,
        action: 'retrieve',
        timestamp: new Date().toISOString(),
        ipAddress: context.ipAddress,
        success: false,
        error: 'Secret expired',
      });

      return null;
    }

    // Check usage limits
    if (
      secret.metadata.maxUsageCount &&
      secret.metadata.usageCount >= secret.metadata.maxUsageCount
    ) {
      auditSecretAccess({
        secretId,
        userId: context.userId,
        service: context.service,
        purpose: context.purpose,
        action: 'retrieve',
        timestamp: new Date().toISOString(),
        ipAddress: context.ipAddress,
        success: false,
        error: 'Usage limit exceeded',
      });

      return null;
    }

    // Decrypt the secret value
    const decryptedValue = decryptData(secret.value);

    // Verify integrity
    const computedChecksum = CryptoJS.SHA256(decryptedValue).toString();
    if (computedChecksum !== secret.checksum) {
      securityLogger.error('Secret integrity check failed', {
        secretId,
        userId: context.userId,
      });

      throw new Error('Secret integrity verification failed');
    }

    // Update access tracking
    secret.metadata.usageCount++;
    secret.metadata.accessCount++;
    secret.metadata.lastAccessedAt = new Date().toISOString();

    // Audit successful access
    auditSecretAccess({
      secretId,
      userId: context.userId,
      service: context.service,
      purpose: context.purpose,
      action: 'retrieve',
      timestamp: new Date().toISOString(),
      ipAddress: context.ipAddress,
      success: true,
    });

    // Check if rotation is needed
    if (shouldRotateSecret(secret)) {
      scheduleSecretRotation(secretId);
    }

    return decryptedValue;
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';

    auditSecretAccess({
      secretId,
      userId: context.userId,
      service: context.service,
      purpose: context.purpose,
      action: 'retrieve',
      timestamp: new Date().toISOString(),
      ipAddress: context.ipAddress,
      success: false,
      error: errorMessage,
    });

    securityLogger.error('Secret retrieval failed', {
      secretId,
      userId: context.userId,
      error: errorMessage,
    });

    return null;
  }
}

/**
 * Secret Rotation System
 */

// Check if a secret should be rotated
function shouldRotateSecret(secret: Secret): boolean {
  const now = new Date();

  // Time-based rotation
  if (secret.metadata.rotationStrategy === RotationStrategy.TIME_BASED) {
    if (secret.metadata.nextRotationAt && new Date(secret.metadata.nextRotationAt) <= now) {
      return true;
    }
  }

  // Usage-based rotation
  if (secret.metadata.rotationStrategy === RotationStrategy.USAGE_BASED) {
    const usageThreshold = secret.metadata.maxUsageCount
      ? secret.metadata.maxUsageCount * 0.8
      : 1000;
    if (secret.metadata.usageCount >= usageThreshold) {
      return true;
    }
  }

  // Risk-based rotation (simplified)
  if (secret.metadata.rotationStrategy === RotationStrategy.RISK_BASED) {
    // In a real implementation, this would check various risk factors
    const daysSinceLastRotation = secret.metadata.lastRotatedAt
      ? (now.getTime() - new Date(secret.metadata.lastRotatedAt).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    if (daysSinceLastRotation > 30) {
      // 30 days threshold
      return true;
    }
  }

  return false;
}

// Schedule secret rotation
function scheduleSecretRotation(secretId: string): void {
  // In a real implementation, this would add to a rotation queue
  securityLogger.info('Secret rotation scheduled', { secretId });
}

// Rotate a secret
export function rotateSecret(
  secretId: string,
  context: SecretAccessContext,
  newValue?: string,
): RotationResult {
  try {
    const secret = secretStore.get(secretId);

    if (!secret) {
      return {
        success: false,
        error: 'Secret not found',
      };
    }

    // Generate new value if not provided
    if (!newValue) {
      newValue = generateNewSecretValue(secret.metadata.type);
    }

    const now = new Date().toISOString();

    // Store previous version
    secret.metadata.previousVersions.push(secret.metadata.id);

    // Create new version
    const newSecretId = generateUUID();
    const encryptedValue = encryptData(newValue, secret.metadata.classification);
    const checksum = CryptoJS.SHA256(newValue).toString();

    // Update metadata
    const newMetadata: SecretMetadata = {
      ...secret.metadata,
      id: newSecretId,
      version: secret.metadata.version + 1,
      status: SecretStatus.ACTIVE,
      updatedAt: now,
      lastRotatedAt: now,
      nextRotationAt: new Date(Date.now() + secret.metadata.rotationIntervalMs).toISOString(),
      usageCount: 0,
      accessCount: 0,
    };

    const newSecret: Secret = {
      metadata: newMetadata,
      value: encryptedValue,
      checksum,
    };

    // Mark old secret as deprecated
    secret.metadata.status = SecretStatus.DEPRECATED;

    // Store new secret
    secretStore.set(newSecretId, newSecret);

    // Audit the rotation
    auditSecretAccess({
      secretId: newSecretId,
      userId: context.userId,
      service: context.service,
      purpose: 'Secret rotation',
      action: 'rotate',
      timestamp: now,
      ipAddress: context.ipAddress,
      success: true,
    });

    securityLogger.logSecurityEvent(SecurityEventType.DATA_MODIFICATION, 'Secret rotated', {
      userId: context.userId,
      metadata: {
        oldSecretId: secretId,
        newSecretId,
        type: secret.metadata.type,
        version: newMetadata.version,
      },
    });

    return {
      success: true,
      newVersion: newMetadata.version,
      oldSecretId: secretId,
      newSecretId,
      rotatedAt: now,
    };
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';

    securityLogger.error('Secret rotation failed', {
      secretId,
      userId: context.userId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Generate new secret value based on type
function generateNewSecretValue(type: SecretType): string {
  switch (type) {
    case SecretType.JWT_SECRET:
      return generateSecureRandom(64); // 512-bit key

    case SecretType.ENCRYPTION_KEY:
      return generateSecureRandom(32); // 256-bit key

    case SecretType.API_KEY:
      return `ak_${generateSecureRandom(32)}`;

    case SecretType.WEBHOOK_SECRET:
      return `wh_${generateSecureRandom(24)}`;

    case SecretType.OAUTH_SECRET:
      return generateSecureRandom(48);

    default:
      return generateSecureRandom(32);
  }
}

/**
 * Secret Management Utilities
 */

// Get default classification for secret type
function getDefaultClassification(type: SecretType): DataClassification {
  const classificationMap: Record<SecretType, DataClassification> = {
    [SecretType.API_KEY]: DataClassification.CONFIDENTIAL,
    [SecretType.DATABASE_CREDENTIAL]: DataClassification.RESTRICTED,
    [SecretType.JWT_SECRET]: DataClassification.RESTRICTED,
    [SecretType.ENCRYPTION_KEY]: DataClassification.RESTRICTED,
    [SecretType.OAUTH_SECRET]: DataClassification.CONFIDENTIAL,
    [SecretType.WEBHOOK_SECRET]: DataClassification.CONFIDENTIAL,
    [SecretType.THIRD_PARTY_TOKEN]: DataClassification.CONFIDENTIAL,
    [SecretType.CERTIFICATE]: DataClassification.CONFIDENTIAL,
    [SecretType.SSH_KEY]: DataClassification.RESTRICTED,
  };

  return classificationMap[type] || DataClassification.CONFIDENTIAL;
}

// Get default rotation interval for secret type
function getDefaultRotationInterval(type: SecretType): number {
  const intervalMap: Record<SecretType, number> = {
    [SecretType.API_KEY]: 90 * 24 * 60 * 60 * 1000, // 90 days
    [SecretType.DATABASE_CREDENTIAL]: 30 * 24 * 60 * 60 * 1000, // 30 days
    [SecretType.JWT_SECRET]: 7 * 24 * 60 * 60 * 1000, // 7 days
    [SecretType.ENCRYPTION_KEY]: 30 * 24 * 60 * 60 * 1000, // 30 days
    [SecretType.OAUTH_SECRET]: 90 * 24 * 60 * 60 * 1000, // 90 days
    [SecretType.WEBHOOK_SECRET]: 90 * 24 * 60 * 60 * 1000, // 90 days
    [SecretType.THIRD_PARTY_TOKEN]: 24 * 60 * 60 * 1000, // 1 day
    [SecretType.CERTIFICATE]: 365 * 24 * 60 * 60 * 1000, // 1 year
    [SecretType.SSH_KEY]: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  return intervalMap[type] || 30 * 24 * 60 * 60 * 1000; // Default 30 days
}

// List secrets with metadata (without values)
export function listSecrets(filter?: {
  type?: SecretType;
  environment?: string;
  owner?: string;
  status?: SecretStatus;
}): SecretMetadata[] {
  const secrets = Array.from(secretStore.values());

  return secrets
    .map(secret => secret.metadata)
    .filter(metadata => {
      if (filter?.type && metadata.type !== filter.type) {
        return false;
      }
      if (filter?.environment && metadata.environment !== filter.environment) {
        return false;
      }
      if (filter?.owner && metadata.owner !== filter.owner) {
        return false;
      }
      if (filter?.status && metadata.status !== filter.status) {
        return false;
      }
      return true;
    });
}

// Delete a secret
export function deleteSecret(secretId: string, context: SecretAccessContext): boolean {
  try {
    const secret = secretStore.get(secretId);

    if (!secret) {
      return false;
    }

    // Mark as revoked instead of immediate deletion for audit trail
    secret.metadata.status = SecretStatus.REVOKED;
    secret.metadata.updatedAt = new Date().toISOString();

    // Audit the deletion
    auditSecretAccess({
      secretId,
      userId: context.userId,
      service: context.service,
      purpose: 'Secret deletion',
      action: 'delete',
      timestamp: new Date().toISOString(),
      ipAddress: context.ipAddress,
      success: true,
    });

    securityLogger.logSecurityEvent(SecurityEventType.DATA_MODIFICATION, 'Secret deleted', {
      userId: context.userId,
      metadata: {
        secretId,
        type: secret.metadata.type,
        name: secret.metadata.name,
      },
    });

    return true;
  } catch (_error) {
    securityLogger.error('Secret deletion failed', {
      secretId,
      userId: context.userId,
      error: _error instanceof Error ? _error.message : 'Unknown error',
    });

    return false;
  }
}

// Audit secret access
function auditSecretAccess(audit: SecretAccessAudit): void {
  secretAudits.push(audit);

  // Keep only last 10000 audit records in memory
  if (secretAudits.length > 10000) {
    secretAudits.splice(0, 1000);
  }
}

// Get secret access audit trail
export function getSecretAuditTrail(secretId: string): SecretAccessAudit[] {
  return secretAudits.filter(audit => audit.secretId === secretId);
}

/**
 * Automatic Rotation Management
 */

// Check for secrets that need rotation
export function checkSecretsForRotation(): void {
  const secrets = Array.from(secretStore.values());

  for (const secret of secrets) {
    if (secret.metadata.status === SecretStatus.ACTIVE && shouldRotateSecret(secret)) {
      securityLogger.info('Secret requires rotation', {
        secretId: secret.metadata.id,
        name: secret.metadata.name,
        type: secret.metadata.type,
        lastRotated: secret.metadata.lastRotatedAt,
      });

      // In a real implementation, this would trigger automatic rotation
      // For now, we just log the requirement
    }
  }
}

// Start automatic rotation check (every hour)
setInterval(checkSecretsForRotation, 60 * 60 * 1000);

// Clean up old secret versions
export function cleanupOldSecrets(): void {
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
  const secretsToCleanup: string[] = [];

  secretStore.forEach((secret, id) => {
    if (
      secret.metadata.status === SecretStatus.DEPRECATED ||
      secret.metadata.status === SecretStatus.REVOKED
    ) {
      if (new Date(secret.metadata.updatedAt) < cutoffDate) {
        secretsToCleanup.push(id);
      }
    }
  });

  secretsToCleanup.forEach(id => {
    secretStore.delete(id);
  });

  if (secretsToCleanup.length > 0) {
    securityLogger.info('Old secrets cleaned up', { count: secretsToCleanup.length });
  }
}

// Start cleanup process (daily)
setInterval(cleanupOldSecrets, 24 * 60 * 60 * 1000);

// Export secrets manager utilities
export const secretsManager = {
  createSecret,
  getSecret,
  rotateSecret,
  listSecrets,
  deleteSecret,
  getSecretAuditTrail,
  checkSecretsForRotation,
  cleanupOldSecrets,
  SecretType,
  SecretStatus,
  RotationStrategy,
};
