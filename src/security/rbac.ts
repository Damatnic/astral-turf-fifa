/**
 * Role-Based Access Control (RBAC) Security Module
 *
 * Provides comprehensive authorization system with granular permissions
 * for Coach, Player, and Family roles with security validation.
 */

import { securityLogger } from './logging';
import type { UserRole } from '../types';

// Guardian Enhanced Tactical Permissions
export enum Permission {
  // Player management permissions
  VIEW_PLAYERS = 'VIEW_PLAYERS',
  EDIT_PLAYERS = 'EDIT_PLAYERS',
  DELETE_PLAYERS = 'DELETE_PLAYERS',
  ASSIGN_PLAYERS = 'ASSIGN_PLAYERS',

  // Formation and tactics permissions - Enhanced
  VIEW_FORMATIONS = 'VIEW_FORMATIONS',
  EDIT_FORMATIONS = 'EDIT_FORMATIONS',
  CREATE_FORMATIONS = 'CREATE_FORMATIONS',
  DELETE_FORMATIONS = 'DELETE_FORMATIONS',
  SHARE_FORMATIONS = 'SHARE_FORMATIONS',
  EXPORT_FORMATIONS = 'EXPORT_FORMATIONS',
  IMPORT_FORMATIONS = 'IMPORT_FORMATIONS',

  // Tactical board specific permissions
  VIEW_TACTICAL_BOARD = 'VIEW_TACTICAL_BOARD',
  EDIT_TACTICAL_BOARD = 'EDIT_TACTICAL_BOARD',
  CREATE_TACTICAL_DRAWINGS = 'CREATE_TACTICAL_DRAWINGS',
  DELETE_TACTICAL_DRAWINGS = 'DELETE_TACTICAL_DRAWINGS',
  ANNOTATE_TACTICAL_BOARD = 'ANNOTATE_TACTICAL_BOARD',

  // Advanced tactical permissions
  VIEW_OPPONENT_ANALYSIS = 'VIEW_OPPONENT_ANALYSIS',
  EDIT_OPPONENT_ANALYSIS = 'EDIT_OPPONENT_ANALYSIS',
  CREATE_TACTICAL_INSTRUCTIONS = 'CREATE_TACTICAL_INSTRUCTIONS',
  VIEW_TACTICAL_INSTRUCTIONS = 'VIEW_TACTICAL_INSTRUCTIONS',

  // Formation classification access
  VIEW_PUBLIC_FORMATIONS = 'VIEW_PUBLIC_FORMATIONS',
  VIEW_INTERNAL_FORMATIONS = 'VIEW_INTERNAL_FORMATIONS',
  VIEW_CONFIDENTIAL_FORMATIONS = 'VIEW_CONFIDENTIAL_FORMATIONS',
  VIEW_SECRET_FORMATIONS = 'VIEW_SECRET_FORMATIONS',

  // Collaboration permissions
  REAL_TIME_COLLABORATION = 'REAL_TIME_COLLABORATION',
  PRESENTATION_MODE = 'PRESENTATION_MODE',
  SCREEN_SHARING = 'SCREEN_SHARING',

  // Match and simulation permissions
  SIMULATE_MATCHES = 'SIMULATE_MATCHES',
  VIEW_MATCH_REPORTS = 'VIEW_MATCH_REPORTS',
  EXPORT_LINEUPS = 'EXPORT_LINEUPS',

  // Training permissions
  VIEW_TRAINING = 'VIEW_TRAINING',
  EDIT_TRAINING = 'EDIT_TRAINING',
  ASSIGN_TRAINING = 'ASSIGN_TRAINING',

  // Financial permissions
  VIEW_FINANCES = 'VIEW_FINANCES',
  MANAGE_TRANSFERS = 'MANAGE_TRANSFERS',
  MANAGE_CONTRACTS = 'MANAGE_CONTRACTS',

  // Administrative permissions
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  SYSTEM_SETTINGS = 'SYSTEM_SETTINGS',

  // Communication permissions
  SEND_MESSAGES = 'SEND_MESSAGES',
  VIEW_CONVERSATIONS = 'VIEW_CONVERSATIONS',
  MODERATE_CHAT = 'MODERATE_CHAT',

  // Personal data permissions
  VIEW_PERSONAL_DATA = 'VIEW_PERSONAL_DATA',
  EDIT_PERSONAL_DATA = 'EDIT_PERSONAL_DATA',
  VIEW_MEDICAL_DATA = 'VIEW_MEDICAL_DATA',
  EDIT_MEDICAL_DATA = 'EDIT_MEDICAL_DATA',

  // AI and analytics permissions
  USE_AI_FEATURES = 'USE_AI_FEATURES',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  EXPORT_DATA = 'EXPORT_DATA',
}

// Define resource types for fine-grained access control - Enhanced for Guardian
export enum Resource {
  PLAYER = 'PLAYER',
  FORMATION = 'FORMATION',
  TACTICAL_BOARD = 'TACTICAL_BOARD',
  TACTICAL_DRAWING = 'TACTICAL_DRAWING',
  TACTICAL_ANNOTATION = 'TACTICAL_ANNOTATION',
  TACTICAL_INSTRUCTION = 'TACTICAL_INSTRUCTION',
  OPPONENT_ANALYSIS = 'OPPONENT_ANALYSIS',
  MATCH = 'MATCH',
  TRAINING = 'TRAINING',
  FINANCE = 'FINANCE',
  SYSTEM = 'SYSTEM',
  CHAT = 'CHAT',
  ANALYTICS = 'ANALYTICS',
  PERSONAL_DATA = 'PERSONAL_DATA',
}

// Define conditions for context-aware permissions
export enum Condition {
  OWN_DATA = 'OWN_DATA',
  SAME_TEAM = 'SAME_TEAM',
  APPROVED_BY_COACH = 'APPROVED_BY_COACH',
  ACTIVE_SESSION = 'ACTIVE_SESSION',
  BUSINESS_HOURS = 'BUSINESS_HOURS',
}

// Permission rule structure
export interface PermissionRule {
  permission: Permission;
  resource: Resource;
  conditions?: Condition[];
  description: string;
}

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, PermissionRule[]> = {
  coach: [
    // Full player management
    {
      permission: Permission.VIEW_PLAYERS,
      resource: Resource.PLAYER,
      description: 'View all players',
    },
    {
      permission: Permission.EDIT_PLAYERS,
      resource: Resource.PLAYER,
      description: 'Edit player details',
    },
    {
      permission: Permission.DELETE_PLAYERS,
      resource: Resource.PLAYER,
      description: 'Delete players',
    },
    {
      permission: Permission.ASSIGN_PLAYERS,
      resource: Resource.PLAYER,
      description: 'Assign players to positions',
    },

    // Full formation management
    {
      permission: Permission.VIEW_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'View formations',
    },
    {
      permission: Permission.EDIT_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'Edit formations',
    },
    {
      permission: Permission.CREATE_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'Create new formations',
    },
    {
      permission: Permission.DELETE_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'Delete formations',
    },
    {
      permission: Permission.SHARE_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'Share formations with team members',
    },
    {
      permission: Permission.EXPORT_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'Export formations to external formats',
    },
    {
      permission: Permission.IMPORT_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'Import formations from external sources',
    },

    // Tactical board permissions
    {
      permission: Permission.VIEW_TACTICAL_BOARD,
      resource: Resource.TACTICAL_BOARD,
      description: 'Access tactical board interface',
    },
    {
      permission: Permission.EDIT_TACTICAL_BOARD,
      resource: Resource.TACTICAL_BOARD,
      description: 'Modify tactical board configurations',
    },
    {
      permission: Permission.CREATE_TACTICAL_DRAWINGS,
      resource: Resource.TACTICAL_DRAWING,
      description: 'Create tactical drawings and annotations',
    },
    {
      permission: Permission.DELETE_TACTICAL_DRAWINGS,
      resource: Resource.TACTICAL_DRAWING,
      description: 'Delete tactical drawings',
    },
    {
      permission: Permission.ANNOTATE_TACTICAL_BOARD,
      resource: Resource.TACTICAL_ANNOTATION,
      description: 'Add annotations to tactical board',
    },

    // Advanced tactical analysis
    {
      permission: Permission.VIEW_OPPONENT_ANALYSIS,
      resource: Resource.OPPONENT_ANALYSIS,
      description: 'View opponent analysis data',
    },
    {
      permission: Permission.EDIT_OPPONENT_ANALYSIS,
      resource: Resource.OPPONENT_ANALYSIS,
      description: 'Edit opponent analysis data',
    },
    {
      permission: Permission.CREATE_TACTICAL_INSTRUCTIONS,
      resource: Resource.TACTICAL_INSTRUCTION,
      description: 'Create tactical instructions for players',
    },
    {
      permission: Permission.VIEW_TACTICAL_INSTRUCTIONS,
      resource: Resource.TACTICAL_INSTRUCTION,
      description: 'View tactical instructions',
    },

    // Formation classification access (full access for coaches)
    {
      permission: Permission.VIEW_PUBLIC_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'View public formations',
    },
    {
      permission: Permission.VIEW_INTERNAL_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'View internal team formations',
    },
    {
      permission: Permission.VIEW_CONFIDENTIAL_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'View confidential formations',
    },
    {
      permission: Permission.VIEW_SECRET_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'View strategic secret formations',
    },

    // Collaboration features
    {
      permission: Permission.REAL_TIME_COLLABORATION,
      resource: Resource.TACTICAL_BOARD,
      description: 'Participate in real-time collaboration',
    },
    {
      permission: Permission.PRESENTATION_MODE,
      resource: Resource.TACTICAL_BOARD,
      description: 'Use presentation mode for tactical board',
    },
    {
      permission: Permission.SCREEN_SHARING,
      resource: Resource.TACTICAL_BOARD,
      description: 'Share tactical board screen',
    },

    // Match management
    {
      permission: Permission.SIMULATE_MATCHES,
      resource: Resource.MATCH,
      description: 'Simulate matches',
    },
    {
      permission: Permission.VIEW_MATCH_REPORTS,
      resource: Resource.MATCH,
      description: 'View match reports',
    },
    {
      permission: Permission.EXPORT_LINEUPS,
      resource: Resource.MATCH,
      description: 'Export lineups',
    },

    // Training management
    {
      permission: Permission.VIEW_TRAINING,
      resource: Resource.TRAINING,
      description: 'View training schedules',
    },
    {
      permission: Permission.EDIT_TRAINING,
      resource: Resource.TRAINING,
      description: 'Edit training schedules',
    },
    {
      permission: Permission.ASSIGN_TRAINING,
      resource: Resource.TRAINING,
      description: 'Assign individual training',
    },

    // Financial management
    {
      permission: Permission.VIEW_FINANCES,
      resource: Resource.FINANCE,
      description: 'View financial data',
    },
    {
      permission: Permission.MANAGE_TRANSFERS,
      resource: Resource.FINANCE,
      description: 'Manage transfers',
    },
    {
      permission: Permission.MANAGE_CONTRACTS,
      resource: Resource.FINANCE,
      description: 'Manage contracts',
    },

    // Administrative permissions
    {
      permission: Permission.MANAGE_USERS,
      resource: Resource.SYSTEM,
      description: 'Manage user accounts',
    },
    {
      permission: Permission.VIEW_AUDIT_LOGS,
      resource: Resource.SYSTEM,
      description: 'View security logs',
    },
    {
      permission: Permission.SYSTEM_SETTINGS,
      resource: Resource.SYSTEM,
      description: 'Modify system settings',
    },

    // Communication
    { permission: Permission.SEND_MESSAGES, resource: Resource.CHAT, description: 'Send messages' },
    {
      permission: Permission.VIEW_CONVERSATIONS,
      resource: Resource.CHAT,
      description: 'View all conversations',
    },
    {
      permission: Permission.MODERATE_CHAT,
      resource: Resource.CHAT,
      description: 'Moderate chat messages',
    },

    // AI and analytics
    {
      permission: Permission.USE_AI_FEATURES,
      resource: Resource.ANALYTICS,
      description: 'Use AI features',
    },
    {
      permission: Permission.VIEW_ANALYTICS,
      resource: Resource.ANALYTICS,
      description: 'View analytics',
    },
    {
      permission: Permission.EXPORT_DATA,
      resource: Resource.ANALYTICS,
      description: 'Export data',
    },
  ],

  player: [
    // Limited player viewing (own data + teammates)
    {
      permission: Permission.VIEW_PLAYERS,
      resource: Resource.PLAYER,
      conditions: [Condition.SAME_TEAM],
      description: 'View team players',
    },
    {
      permission: Permission.EDIT_PERSONAL_DATA,
      resource: Resource.PERSONAL_DATA,
      conditions: [Condition.OWN_DATA],
      description: 'Edit own data',
    },

    // Formation viewing only (limited)
    {
      permission: Permission.VIEW_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'View formations',
    },
    {
      permission: Permission.VIEW_PUBLIC_FORMATIONS,
      resource: Resource.FORMATION,
      description: 'View public formations',
    },
    {
      permission: Permission.VIEW_INTERNAL_FORMATIONS,
      resource: Resource.FORMATION,
      conditions: [Condition.SAME_TEAM],
      description: 'View team internal formations',
    },

    // Limited tactical board access
    {
      permission: Permission.VIEW_TACTICAL_BOARD,
      resource: Resource.TACTICAL_BOARD,
      description: 'View tactical board (read-only)',
    },
    {
      permission: Permission.VIEW_TACTICAL_INSTRUCTIONS,
      resource: Resource.TACTICAL_INSTRUCTION,
      conditions: [Condition.OWN_DATA],
      description: 'View own tactical instructions',
    },

    // Basic collaboration
    {
      permission: Permission.REAL_TIME_COLLABORATION,
      resource: Resource.TACTICAL_BOARD,
      conditions: [Condition.APPROVED_BY_COACH],
      description: 'Participate in tactical sessions when invited',
    },

    // Match viewing
    {
      permission: Permission.VIEW_MATCH_REPORTS,
      resource: Resource.MATCH,
      description: 'View match reports',
    },

    // Training viewing
    {
      permission: Permission.VIEW_TRAINING,
      resource: Resource.TRAINING,
      conditions: [Condition.OWN_DATA],
      description: 'View own training',
    },

    // Personal communication
    {
      permission: Permission.SEND_MESSAGES,
      resource: Resource.CHAT,
      description: 'Send messages to coach',
    },
    {
      permission: Permission.VIEW_CONVERSATIONS,
      resource: Resource.CHAT,
      conditions: [Condition.OWN_DATA],
      description: 'View own conversations',
    },

    // Personal data access
    {
      permission: Permission.VIEW_PERSONAL_DATA,
      resource: Resource.PERSONAL_DATA,
      conditions: [Condition.OWN_DATA],
      description: 'View own data',
    },
    {
      permission: Permission.VIEW_MEDICAL_DATA,
      resource: Resource.PERSONAL_DATA,
      conditions: [Condition.OWN_DATA],
      description: 'View own medical data',
    },

    // Basic AI features
    {
      permission: Permission.USE_AI_FEATURES,
      resource: Resource.ANALYTICS,
      description: 'Use basic AI features',
    },
  ],

  family: [
    // Limited player viewing (associated players only)
    {
      permission: Permission.VIEW_PLAYERS,
      resource: Resource.PLAYER,
      conditions: [Condition.APPROVED_BY_COACH],
      description: 'View associated players',
    },

    // Formation viewing (limited)
    {
      permission: Permission.VIEW_FORMATIONS,
      resource: Resource.FORMATION,
      conditions: [Condition.APPROVED_BY_COACH],
      description: 'View formations with player',
    },

    // Match reports for associated players
    {
      permission: Permission.VIEW_MATCH_REPORTS,
      resource: Resource.MATCH,
      conditions: [Condition.APPROVED_BY_COACH],
      description: 'View match reports',
    },

    // Training viewing for associated players
    {
      permission: Permission.VIEW_TRAINING,
      resource: Resource.TRAINING,
      conditions: [Condition.APPROVED_BY_COACH],
      description: 'View player training',
    },

    // Communication with coach
    {
      permission: Permission.SEND_MESSAGES,
      resource: Resource.CHAT,
      conditions: [Condition.APPROVED_BY_COACH],
      description: 'Message coach about player',
    },
    {
      permission: Permission.VIEW_CONVERSATIONS,
      resource: Resource.CHAT,
      conditions: [Condition.OWN_DATA],
      description: 'View own conversations',
    },

    // Associated player data (limited)
    {
      permission: Permission.VIEW_PERSONAL_DATA,
      resource: Resource.PERSONAL_DATA,
      conditions: [Condition.APPROVED_BY_COACH],
      description: 'View player data',
    },

    // Own account management
    {
      permission: Permission.EDIT_PERSONAL_DATA,
      resource: Resource.PERSONAL_DATA,
      conditions: [Condition.OWN_DATA],
      description: 'Edit own account',
    },
  ],
};

// Context for permission evaluation
export interface PermissionContext {
  userId: string;
  userRole: UserRole;
  targetUserId?: string;
  resourceId?: string;
  resourceType?: Resource;
  teamId?: string;
  sessionId?: string;
  ipAddress?: string;
  timestamp?: Date;
  additionalData?: Record<string, unknown>;
}

// Permission evaluation result
export interface PermissionResult {
  granted: boolean;
  reason?: string;
  conditions?: Condition[];
  requiredApprovals?: string[];
}

/**
 * Permission Checking Functions
 */

// Check if user has specific permission
export function hasPermission(
  userRole: UserRole,
  permission: Permission,
  resource: Resource,
  context?: PermissionContext,
): PermissionResult {
  try {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    const matchingRule = rolePermissions.find(
      rule => rule.permission === permission && rule.resource === resource,
    );

    if (!matchingRule) {
      securityLogger.warn('Permission denied - no matching rule', {
        userRole,
        permission,
        resource,
        userId: context?.userId,
      });

      return {
        granted: false,
        reason: 'Permission not granted for this role',
      };
    }

    // Check conditions if present
    if (matchingRule.conditions && context) {
      const conditionResult = evaluateConditions(matchingRule.conditions, context);
      if (!conditionResult.granted) {
        securityLogger.warn('Permission denied - conditions not met', {
          userRole,
          permission,
          resource,
          conditions: matchingRule.conditions,
          userId: context.userId,
          reason: conditionResult.reason,
        });

        return conditionResult;
      }
    }

    securityLogger.info('Permission granted', {
      userRole,
      permission,
      resource,
      userId: context?.userId,
    });

    return {
      granted: true,
      conditions: matchingRule.conditions,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    securityLogger.error('Permission check failed', {
      error: error.message,
      userRole,
      permission,
      resource,
    });

    return {
      granted: false,
      reason: 'Permission check failed',
    };
  }
}

// Evaluate permission conditions
function evaluateConditions(conditions: Condition[], context: PermissionContext): PermissionResult {
  for (const condition of conditions) {
    const result = evaluateCondition(condition, context);
    if (!result.granted) {
      return result;
    }
  }

  return { granted: true };
}

// Evaluate individual condition
function evaluateCondition(condition: Condition, context: PermissionContext): PermissionResult {
  switch (condition) {
    case Condition.OWN_DATA:
      if (!context.targetUserId || context.userId === context.targetUserId) {
        return { granted: true };
      }
      return {
        granted: false,
        reason: 'Can only access own data',
      };

    case Condition.SAME_TEAM:
      // In a real application, this would check team membership
      // For now, we'll assume it's valid if teamId is provided
      if (context.teamId) {
        return { granted: true };
      }
      return {
        granted: false,
        reason: 'Must be on the same team',
      };

    case Condition.APPROVED_BY_COACH:
      // This would check if family member has coach approval
      // For demo purposes, we'll assume approval exists
      return { granted: true };

    case Condition.ACTIVE_SESSION:
      if (context.sessionId) {
        return { granted: true };
      }
      return {
        granted: false,
        reason: 'Requires active session',
      };

    case Condition.BUSINESS_HOURS:
      const hour = new Date().getHours();
      if (hour >= 8 && hour <= 18) {
        return { granted: true };
      }
      return {
        granted: false,
        reason: 'Action only allowed during business hours',
      };

    default:
      return {
        granted: false,
        reason: 'Unknown condition',
      };
  }
}

// Get all permissions for a role
export function getRolePermissions(userRole: UserRole): PermissionRule[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

// Check multiple permissions at once
export function hasAnyPermission(
  userRole: UserRole,
  permissions: Array<{ permission: Permission; resource: Resource }>,
  context?: PermissionContext,
): boolean {
  return permissions.some(
    ({ permission, resource }) => hasPermission(userRole, permission, resource, context).granted,
  );
}

// Check if user can access specific resource
export function canAccessResource(
  userRole: UserRole,
  resource: Resource,
  context?: PermissionContext,
): PermissionResult {
  // Find any permission rule for this resource
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  const resourceRules = rolePermissions.filter(rule => rule.resource === resource);

  if (resourceRules.length === 0) {
    return {
      granted: false,
      reason: 'No access to this resource type',
    };
  }

  // Check if any rule grants access
  for (const rule of resourceRules) {
    const result = hasPermission(userRole, rule.permission, resource, context);
    if (result.granted) {
      return result;
    }
  }

  return {
    granted: false,
    reason: 'Insufficient permissions for this resource',
  };
}

/**
 * Authorization Middleware Functions
 */

// Create permission validator function
export function requirePermission(permission: Permission, resource: Resource) {
  return (userRole: UserRole, context?: PermissionContext): boolean => {
    const result = hasPermission(userRole, permission, resource, context);
    return result.granted;
  };
}

// Create resource access validator
export function requireResourceAccess(resource: Resource) {
  return (userRole: UserRole, context?: PermissionContext): boolean => {
    const result = canAccessResource(userRole, resource, context);
    return result.granted;
  };
}

// Validate user can perform action on specific player
export function canAccessPlayerData(
  userRole: UserRole,
  userId: string,
  targetPlayerId: string,
  permission: Permission = Permission.VIEW_PLAYERS,
): boolean {
  const context: PermissionContext = {
    userId,
    userRole,
    targetUserId: targetPlayerId,
    resourceType: Resource.PLAYER,
  };

  return hasPermission(userRole, permission, Resource.PLAYER, context).granted;
}

// Validate chat permissions
export function canSendMessage(userRole: UserRole, userId: string, targetUserId?: string): boolean {
  const context: PermissionContext = {
    userId,
    userRole,
    targetUserId,
  };

  return hasPermission(userRole, Permission.SEND_MESSAGES, Resource.CHAT, context).granted;
}

// Export permission constants for easy access
export const PERMISSIONS = Permission;
export const RESOURCES = Resource;
export const CONDITIONS = Condition;

// Export utility functions
export const rbacUtils = {
  hasPermission,
  getRolePermissions,
  hasAnyPermission,
  canAccessResource,
  requirePermission,
  requireResourceAccess,
  canAccessPlayerData,
  canSendMessage,
};
