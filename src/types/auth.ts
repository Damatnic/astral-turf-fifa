// Authentication and user related types

export type UserRole = 'coach' | 'player' | 'family';
export type FamilyRelationship = 'mother' | 'father' | 'guardian' | 'sibling' | 'other';

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  matchUpdates: boolean;
  trainingReminders: boolean;
  emergencyAlerts: boolean;
  paymentReminders: boolean;
}

export interface FamilyPermissions {
  canViewStats: boolean;
  canViewSchedule: boolean;
  canViewMedical: boolean;
  canCommunicateWithCoach: boolean;
  canViewFinancials: boolean;
  canReceiveNotifications: boolean;
}

export interface FamilyMemberAssociation {
  id: string;
  familyMemberId: string;
  playerId: string;
  relationship: FamilyRelationship;
  permissions: FamilyPermissions;
  approvedByCoach: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  profileImage?: string;
  phoneNumber?: string;

  // Role-specific associations
  playerId?: string; // For players and family members
  coachId?: string; // For coach associations
  familyMemberIds?: string[]; // For players - their family members
  playerIds?: string[]; // For family members - their associated players

  // Settings and preferences
  notifications: NotificationSettings;
  timezone: string;
  language: string;

  // Account metadata
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  needsPasswordReset?: boolean;
}

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  familyAssociations: FamilyMemberAssociation[];
}
