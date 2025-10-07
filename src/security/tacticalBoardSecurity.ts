/**
 * Guardian Tactical Board Security Module
 *
 * Military-grade security implementation for football tactical information
 * Provides comprehensive protection for formations, strategies, and sensitive tactical data
 */

import {
  encryptData,
  decryptData,
  DataClassification,
  EncryptionAlgorithm,
  EncryptedData,
} from './encryption';
import { validateAndSanitize } from './validation';
import { securityLogger } from './logging';
// import { checkPermission } from './rbac';

// Define UserRole locally since it's not exported from rbac
type UserRole = 'HEAD_COACH' | 'COACH' | 'PLAYER' | 'ADMIN';
const UserRole = {
  HEAD_COACH: 'HEAD_COACH' as UserRole,
  COACH: 'COACH' as UserRole,
  PLAYER: 'PLAYER' as UserRole,
  ADMIN: 'ADMIN' as UserRole,
};

// Tactical data classification levels
export enum TacticalClassification {
  PUBLIC_FORMATION = 'public_formation',
  TEAM_INTERNAL = 'team_internal',
  COACH_CONFIDENTIAL = 'coach_confidential',
  STRATEGIC_SECRET = 'strategic_secret',
}

// Tactical data types requiring protection
export interface TacticalFormation {
  id: string;
  name: string;
  description: string;
  formation: string; // e.g., "4-4-2", "3-5-2"
  playerPositions: PlayerPosition[];
  tacticalInstructions: TacticalInstruction[];
  opponentAnalysis?: OpponentAnalysis;
  classification: TacticalClassification;
  createdBy: string;
  teamId: string;
  matchId?: string;
  isActive: boolean;
  metadata: FormationMetadata;
}

export interface PlayerPosition {
  playerId: string;
  position: { x: number; y: number };
  role: string;
  instructions: string[];
  alternativePositions?: { x: number; y: number }[];
}

export interface TacticalInstruction {
  type: 'defensive' | 'offensive' | 'set_piece' | 'transition';
  phase: 'build_up' | 'attack' | 'defense' | 'set_piece';
  instruction: string;
  priority: 'high' | 'medium' | 'low';
  playerIds?: string[];
}

export interface OpponentAnalysis {
  opponentTeam: string;
  weaknesses: string[];
  strengths: string[];
  keyPlayers: string[];
  recommendedCounterTactics: string[];
  confidenceLevel: number;
}

export interface FormationMetadata {
  version: number;
  lastModified: string;
  modifiedBy: string;
  accessCount: number;
  sharedWith: string[];
  tags: string[];
  effectivenessRating?: number;
}

// Secure tactical data container
export interface SecureTacticalData {
  encryptedFormation: EncryptedData;
  accessControlList: AccessControlEntry[];
  auditTrail: SecurityAuditEntry[];
  integrityHash: string;
  lastSecurityCheck: string;
}

export interface AccessControlEntry {
  userId: string;
  role: UserRole;
  permissions: TacticalPermission[];
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

export interface TacticalPermission {
  action: 'view' | 'edit' | 'share' | 'export' | 'delete';
  resource: 'formation' | 'analysis' | 'instructions' | 'positions';
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  type: 'time_based' | 'location_based' | 'match_based' | 'role_based';
  value: any;
}

export interface SecurityAuditEntry {
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'blocked';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Guardian Tactical Security Class
 */
export class GuardianTacticalSecurity {
  private encryptionKey: string;
  private auditLogger: typeof securityLogger;

  constructor() {
    this.encryptionKey = process.env.TACTICAL_ENCRYPTION_KEY || 'guardian-tactical-security-2024';
    this.auditLogger = securityLogger;
  }

  /**
   * Encrypt tactical formation data with military-grade security
   */
  async encryptTacticalFormation(
    formation: TacticalFormation,
    userId: string,
    context: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<SecureTacticalData> {
    try {
      // Validate formation data
      this.validateFormationData(formation);

      // Determine classification level
      const classification = this.determineTacticalClassification(formation);

      // Encrypt the formation data
      const encryptedFormation = encryptData(
        JSON.stringify(formation),
        classification,
        EncryptionAlgorithm.AES_256_GCM,
        {
          userId,
          operation: 'encrypt',
          dataType: 'tactical_formation',
          classification,
        },
      );

      // Generate integrity hash
      const integrityHash = await this.generateIntegrityHash(formation);

      // Create access control list
      const accessControlList = await this.createAccessControlList(formation, userId);

      // Create audit entry
      const auditEntry: SecurityAuditEntry = {
        timestamp: new Date().toISOString(),
        userId,
        action: 'encrypt_formation',
        resource: `formation:${formation.id}`,
        result: 'success',
        riskLevel: 'low',
        details: {
          formationId: formation.id,
          classification: formation.classification,
          teamId: formation.teamId,
          encryptionAlgorithm: EncryptionAlgorithm.AES_256_GCM,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      };

      // Log security event
      this.auditLogger.logSecurityEvent(
        'DATA_MODIFICATION' as any,
        'Tactical formation encrypted',
        {
          userId,
          metadata: auditEntry.details,
        },
      );

      return {
        encryptedFormation,
        accessControlList,
        auditTrail: [auditEntry],
        integrityHash,
        lastSecurityCheck: new Date().toISOString(),
      };
    } catch (error) {
      this.auditLogger.error('Tactical formation encryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        formationId: formation?.id,
        teamId: formation?.teamId,
      });

      throw new Error('Tactical formation encryption failed');
    }
  }

  /**
   * Decrypt tactical formation data with access control validation
   */
  async decryptTacticalFormation(
    secureTacticalData: SecureTacticalData,
    userId: string,
    requestedAction: string = 'view',
    context: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<TacticalFormation> {
    try {
      // Check access permissions
      const hasAccess = await this.validateTacticalAccess(
        secureTacticalData,
        userId,
        requestedAction,
      );

      if (!hasAccess) {
        const auditEntry: SecurityAuditEntry = {
          timestamp: new Date().toISOString(),
          userId,
          action: 'decrypt_formation_denied',
          resource: 'tactical_formation',
          result: 'blocked',
          riskLevel: 'high',
          details: {
            reason: 'insufficient_permissions',
            requestedAction,
            accessControlEntries: secureTacticalData.accessControlList.length,
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        };

        secureTacticalData.auditTrail.push(auditEntry);

        this.auditLogger.logSecurityEvent(
          'ACCESS_DENIED' as any,
          'Tactical formation access denied',
          {
            userId,
            metadata: auditEntry.details,
          },
        );

        throw new Error('Access denied: Insufficient permissions for tactical data');
      }

      // Decrypt the formation
      const decryptedText = decryptData(secureTacticalData.encryptedFormation, {
        userId,
        operation: 'decrypt',
        dataType: 'tactical_formation',
        classification: secureTacticalData.encryptedFormation.classification,
      });

      const formation: TacticalFormation = JSON.parse(decryptedText);

      // Verify data integrity
      const computedHash = await this.generateIntegrityHash(formation);
      if (computedHash !== secureTacticalData.integrityHash) {
        throw new Error('Tactical data integrity check failed');
      }

      // Create successful access audit entry
      const auditEntry: SecurityAuditEntry = {
        timestamp: new Date().toISOString(),
        userId,
        action: 'decrypt_formation_success',
        resource: `formation:${formation.id}`,
        result: 'success',
        riskLevel: 'low',
        details: {
          formationId: formation.id,
          classification: formation.classification,
          teamId: formation.teamId,
          requestedAction,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      };

      secureTacticalData.auditTrail.push(auditEntry);

      this.auditLogger.logSecurityEvent('DATA_ACCESS' as any, 'Tactical formation decrypted', {
        userId,
        metadata: auditEntry.details,
      });

      return formation;
    } catch (error) {
      this.auditLogger.error('Tactical formation decryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        requestedAction,
      });

      throw new Error('Tactical formation decryption failed');
    }
  }

  /**
   * Secure formation sharing with granular permissions
   */
  async shareFormation(
    secureTacticalData: SecureTacticalData,
    fromUserId: string,
    toUserId: string,
    permissions: TacticalPermission[],
    expiresAt?: string,
  ): Promise<SecureTacticalData> {
    try {
      // Validate sharing permissions
      const canShare = await this.validateTacticalAccess(secureTacticalData, fromUserId, 'share');
      if (!canShare) {
        throw new Error('Insufficient permissions to share tactical data');
      }

      // Create new access control entry
      const newAccessEntry: AccessControlEntry = {
        userId: toUserId,
        role: UserRole.COACH, // Default role, should be determined by user's actual role
        permissions,
        grantedBy: fromUserId,
        grantedAt: new Date().toISOString(),
        expiresAt,
      };

      // Add to access control list
      secureTacticalData.accessControlList.push(newAccessEntry);

      // Create audit entry
      const auditEntry: SecurityAuditEntry = {
        timestamp: new Date().toISOString(),
        userId: fromUserId,
        action: 'share_formation',
        resource: 'tactical_formation',
        result: 'success',
        riskLevel: 'medium',
        details: {
          sharedWith: toUserId,
          permissions: permissions.map(p => `${p.action}:${p.resource}`),
          expiresAt,
        },
      };

      secureTacticalData.auditTrail.push(auditEntry);

      this.auditLogger.logSecurityEvent('DATA_SHARING' as any, 'Tactical formation shared', {
        userId: fromUserId,
        metadata: auditEntry.details,
      });

      return secureTacticalData;
    } catch (error) {
      this.auditLogger.error('Tactical formation sharing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fromUserId,
        toUserId,
      });

      throw new Error('Tactical formation sharing failed');
    }
  }

  /**
   * Validate tactical data access permissions
   */
  private async validateTacticalAccess(
    secureTacticalData: SecureTacticalData,
    userId: string,
    action: string,
  ): Promise<boolean> {
    // Find user's access control entry
    const userAccess = secureTacticalData.accessControlList.find(entry => entry.userId === userId);

    if (!userAccess) {
      return false;
    }

    // Check if access has expired
    if (userAccess.expiresAt && new Date() > new Date(userAccess.expiresAt)) {
      return false;
    }

    // Check if user has the required permission
    const hasPermission = userAccess.permissions.some(
      permission => permission.action === action || permission.action === ('admin' as any),
    );

    return hasPermission;
  }

  /**
   * Determine tactical classification level based on content
   */
  private determineTacticalClassification(formation: TacticalFormation): DataClassification {
    // Map tactical classification to data classification
    const classificationMap = {
      [TacticalClassification.PUBLIC_FORMATION]: DataClassification.PUBLIC,
      [TacticalClassification.TEAM_INTERNAL]: DataClassification.INTERNAL,
      [TacticalClassification.COACH_CONFIDENTIAL]: DataClassification.CONFIDENTIAL,
      [TacticalClassification.STRATEGIC_SECRET]: DataClassification.RESTRICTED,
    };

    return classificationMap[formation.classification] || DataClassification.INTERNAL;
  }

  /**
   * Create initial access control list for formation
   */
  private async createAccessControlList(
    formation: TacticalFormation,
    creatorUserId: string,
  ): Promise<AccessControlEntry[]> {
    // Creator gets full permissions
    const creatorEntry: AccessControlEntry = {
      userId: creatorUserId,
      role: UserRole.HEAD_COACH, // Assume creator is head coach
      permissions: [
        { action: 'view', resource: 'formation' },
        { action: 'edit', resource: 'formation' },
        { action: 'share', resource: 'formation' },
        { action: 'export', resource: 'formation' },
        { action: 'delete', resource: 'formation' },
      ],
      grantedBy: creatorUserId,
      grantedAt: new Date().toISOString(),
    };

    return [creatorEntry];
  }

  /**
   * Generate integrity hash for tactical data
   */
  private async generateIntegrityHash(formation: TacticalFormation): Promise<string> {
    const formationString = JSON.stringify(formation, Object.keys(formation).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(formationString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate formation data structure and content
   */
  private validateFormationData(formation: TacticalFormation): void {
    if (!formation.id || !formation.name || !formation.teamId) {
      throw new Error('Invalid formation data: missing required fields');
    }

    if (!formation.playerPositions || formation.playerPositions.length === 0) {
      throw new Error('Invalid formation data: no player positions defined');
    }

    // Validate player positions are within field boundaries
    formation.playerPositions.forEach((position, index) => {
      if (
        position.position.x < 0 ||
        position.position.x > 100 ||
        position.position.y < 0 ||
        position.position.y > 100
      ) {
        throw new Error(`Invalid player position ${index}: coordinates out of bounds`);
      }
    });

    // Validate tactical instructions
    if (formation.tacticalInstructions) {
      formation.tacticalInstructions.forEach((instruction, index) => {
        if (!instruction.type || !instruction.phase || !instruction.instruction) {
          throw new Error(`Invalid tactical instruction ${index}: missing required fields`);
        }
      });
    }
  }

  /**
   * Sanitize tactical formation data for export
   */
  sanitizeFormationForExport(
    formation: TacticalFormation,
    exportLevel: 'public' | 'team' | 'coach' = 'team',
  ): Partial<TacticalFormation> {
    const sanitized: Partial<TacticalFormation> = {
      id: formation.id,
      name: formation.name,
      formation: formation.formation,
      playerPositions: formation.playerPositions.map(pos => ({
        playerId: exportLevel === 'public' ? 'REDACTED' : pos.playerId,
        position: pos.position,
        role: pos.role,
        instructions: exportLevel === 'public' ? [] : pos.instructions,
      })),
    };

    if (exportLevel !== 'public') {
      sanitized.description = formation.description;
      sanitized.tacticalInstructions = formation.tacticalInstructions;
    }

    if (exportLevel === 'coach') {
      sanitized.opponentAnalysis = formation.opponentAnalysis;
    }

    return sanitized;
  }

  /**
   * Secure formation import with validation
   */
  async secureFormationImport(
    importData: any,
    userId: string,
    teamId: string,
    context: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<SecureTacticalData> {
    try {
      // Validate and sanitize import data
      const sanitizedData = validateAndSanitize(importData, {
        allowedFields: [
          'name',
          'description',
          'formation',
          'playerPositions',
          'tacticalInstructions',
          'classification',
        ],
        sanitizeStrings: true,
        maxStringLength: 10000,
      });

      // Create formation object with security metadata
      const formation: TacticalFormation = {
        ...(sanitizedData as any),
        id: crypto.randomUUID(),
        teamId,
        createdBy: userId,
        isActive: true,
        classification: TacticalClassification.TEAM_INTERNAL,
        metadata: {
          version: 1,
          lastModified: new Date().toISOString(),
          modifiedBy: userId,
          accessCount: 0,
          sharedWith: [],
          tags: [],
        },
      } as TacticalFormation;

      // Validate the formation
      this.validateFormationData(formation);

      // Encrypt and secure the formation
      return await this.encryptTacticalFormation(formation, userId, context);
    } catch (error) {
      this.auditLogger.error('Secure formation import failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        teamId,
      });

      throw new Error('Secure formation import failed');
    }
  }
}

// Export the guardian tactical security instance
export const guardianTacticalSecurity = new GuardianTacticalSecurity();

// Export tactical security utilities
export const tacticalSecurityUtils = {
  encryptFormation:
    guardianTacticalSecurity.encryptTacticalFormation.bind(guardianTacticalSecurity),
  decryptFormation:
    guardianTacticalSecurity.decryptTacticalFormation.bind(guardianTacticalSecurity),
  shareFormation: guardianTacticalSecurity.shareFormation.bind(guardianTacticalSecurity),
  sanitizeForExport:
    guardianTacticalSecurity.sanitizeFormationForExport.bind(guardianTacticalSecurity),
  secureImport: guardianTacticalSecurity.secureFormationImport.bind(guardianTacticalSecurity),
};
