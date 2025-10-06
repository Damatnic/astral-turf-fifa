import type { User, UserRole, FamilyMemberAssociation, NotificationSettings } from '../types';
import { DEMO_USERS } from '../constants';
import {
  secureAuthService,
  type SecureSignupData,
  type SecureLoginResponse,
  type LoginContext,
  type PasswordChangeData,
} from './secureAuthService';
import { databaseService } from './databaseService';
import { securityLogger } from '../security/logging';

const FAKE_USERS: User[] = [...DEMO_USERS];

// Helper function to get login context
const getLoginContext = (): LoginContext => ({
  ipAddress: '127.0.0.1', // In a real app, this would come from the server
  userAgent: navigator.userAgent,
  deviceInfo: navigator.platform,
  timestamp: new Date().toISOString(),
});

// Mock family associations data
const DEMO_FAMILY_ASSOCIATIONS: FamilyMemberAssociation[] = [
  {
    id: 'assoc1',
    familyMemberId: 'family1',
    playerId: 'player1',
    relationship: 'mother',
    permissions: {
      canViewStats: true,
      canViewSchedule: true,
      canViewMedical: true,
      canCommunicateWithCoach: true,
      canViewFinancials: true,
      canReceiveNotifications: true,
    },
    approvedByCoach: true,
    createdAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'assoc2',
    familyMemberId: 'family2',
    playerId: 'player2',
    relationship: 'mother',
    permissions: {
      canViewStats: true,
      canViewSchedule: true,
      canViewMedical: true,
      canCommunicateWithCoach: true,
      canViewFinancials: false,
      canReceiveNotifications: true,
    },
    approvedByCoach: true,
    createdAt: '2024-01-21T00:00:00Z',
  },
  {
    id: 'assoc3',
    familyMemberId: 'family3',
    playerId: 'player3',
    relationship: 'father',
    permissions: {
      canViewStats: true,
      canViewSchedule: true,
      canViewMedical: false,
      canCommunicateWithCoach: true,
      canViewFinancials: true,
      canReceiveNotifications: true,
    },
    approvedByCoach: true,
    createdAt: '2024-01-22T00:00:00Z',
  },
  {
    id: 'assoc4',
    familyMemberId: 'family4',
    playerId: 'player4',
    relationship: 'other',
    permissions: {
      canViewStats: true,
      canViewSchedule: true,
      canViewMedical: true,
      canCommunicateWithCoach: true,
      canViewFinancials: false,
      canReceiveNotifications: true,
    },
    approvedByCoach: true,
    createdAt: '2024-01-23T00:00:00Z',
  },
];

export interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  // Role-specific fields
  playerId?: string; // For family members
  playerName?: string; // For family members to request association
  relationship?: string; // For family members
  phoneNumber?: string;
  emergencyContact?: string;
  // Security fields required by secure implementation
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  marketingConsent?: boolean;
}

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    try {
      const context = getLoginContext();
      const response: SecureLoginResponse = await secureAuthService.login(email, password, context);

      // Store tokens securely
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      localStorage.setItem('authUser', JSON.stringify(response.user));

      return response.user;
    } catch (_error) {
      throw _error;
    }
  },

  signup: async (signupData: SignupData): Promise<User> => {
    try {
      const context = getLoginContext();
      const secureSignupData: SecureSignupData = {
        ...signupData,
        acceptedTerms: signupData.acceptedTerms || false,
        acceptedPrivacyPolicy: signupData.acceptedPrivacyPolicy || false,
      };

      const response: SecureLoginResponse = await secureAuthService.signup(
        secureSignupData,
        context
      );

      // Store tokens securely
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      localStorage.setItem('authUser', JSON.stringify(response.user));

      return response.user;
    } catch (_error) {
      throw _error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const context = getLoginContext();
        await secureAuthService.logout(token, context);
      }
    } catch (_error) {
      // // // // console.warn('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('authUser');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('familyAssociations');
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return null;
      }

      const context = getLoginContext();
      const user = await secureAuthService.getCurrentUser(token, context);

      if (user) {
        localStorage.setItem('authUser', JSON.stringify(user));
      }

      return user;
    } catch (_error) {
      // Token might be expired, try to refresh
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const context = getLoginContext();
          const newTokens = await secureAuthService.refreshToken(refreshToken, context);
          localStorage.setItem('accessToken', newTokens.accessToken);
          localStorage.setItem('refreshToken', newTokens.refreshToken);

          // Try again with new token
          return await secureAuthService.getCurrentUser(newTokens.accessToken, context);
        }
      } catch (__refreshError) {
        // Refresh failed, clear all auth data
        localStorage.removeItem('authUser');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }

      return null;
    }
  },

  // Synchronous version for compatibility
  getCurrentUserSync: (): User | null => {
    const userStr = localStorage.getItem('authUser');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch (__e) {
        return null;
      }
    }
    return null;
  },

  getFamilyAssociations: (userId: string): FamilyMemberAssociation[] => {
    // Return associations where user is either family member or player
    return DEMO_FAMILY_ASSOCIATIONS.filter(
      assoc => assoc.familyMemberId === userId || assoc.playerId === userId
    );
  },

  updateUserProfile: async (userId: string, updates: Partial<User>): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userIndex = FAKE_USERS.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          reject(new Error('User not found'));
          return;
        }

        FAKE_USERS[userIndex] = { ...FAKE_USERS[userIndex], ...updates };
        const updatedUser = FAKE_USERS[userIndex];

        // Update localStorage if this is the current user
        const currentUser = JSON.parse(localStorage.getItem('authUser') || '{}');
        if (currentUser.id === userId) {
          localStorage.setItem('authUser', JSON.stringify(updatedUser));
        }

        resolve(updatedUser);
      }, 300);
    });
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = FAKE_USERS.find(u => u.email === email);
        if (!user) {
          reject(new Error('User not found'));
          return;
        }
        // In a real app, this would send an email
        // // // // console.log(`Password reset email sent to ${email}`);
        resolve();
      }, 500);
    });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // In a real app, this would validate the token and update the password
        if (newPassword.length < 8) {
          reject(new Error('Password must be at least 8 characters long'));
          return;
        }
        resolve();
      }, 500);
    });
  },

  createFamilyAssociation: async (
    familyMemberId: string,
    playerId: string,
    relationship: string
  ): Promise<FamilyMemberAssociation> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check if player exists
        const player = FAKE_USERS.find(u => u.id === playerId && u.role === 'player');
        if (!player) {
          reject(new Error('Player not found'));
          return;
        }

        const newAssociation: FamilyMemberAssociation = {
          id: `assoc_${Date.now()}`,
          familyMemberId,
          playerId,
          relationship: relationship as any,
          permissions: {
            canViewStats: true,
            canViewSchedule: true,
            canViewMedical: true,
            canCommunicateWithCoach: true,
            canViewFinancials: false,
            canReceiveNotifications: true,
          },
          approvedByCoach: false, // Requires coach approval
          createdAt: new Date().toISOString(),
        };

        DEMO_FAMILY_ASSOCIATIONS.push(newAssociation);
        resolve(newAssociation);
      }, 500);
    });
  },

  approveFamilyAssociation: async (associationId: string): Promise<FamilyMemberAssociation> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const association = DEMO_FAMILY_ASSOCIATIONS.find(a => a.id === associationId);
        if (!association) {
          reject(new Error('Association not found'));
          return;
        }

        association.approvedByCoach = true;
        resolve(association);
      }, 300);
    });
  },

  updateNotificationSettings: async (
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userIndex = FAKE_USERS.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          reject(new Error('User not found'));
          return;
        }

        FAKE_USERS[userIndex].notifications = {
          ...FAKE_USERS[userIndex].notifications,
          ...settings,
        };

        resolve(FAKE_USERS[userIndex].notifications);
      }, 300);
    });
  },

  // Admin functions for managing users (coach only)
  deactivateUser: async (userId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userIndex = FAKE_USERS.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          reject(new Error('User not found'));
          return;
        }

        FAKE_USERS[userIndex].isActive = false;
        resolve();
      }, 300);
    });
  },

  activateUser: async (userId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userIndex = FAKE_USERS.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          reject(new Error('User not found'));
          return;
        }

        FAKE_USERS[userIndex].isActive = true;
        resolve();
      }, 300);
    });
  },

  // Get all users for admin management (coach only)
  getAllUsers: async (): Promise<User[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([...FAKE_USERS]);
      }, 300);
    });
  },

  // Secure password change
  changePassword: async (passwordData: PasswordChangeData): Promise<void> => {
    try {
      const token = localStorage.getItem('accessToken');
      const user = authService.getCurrentUserSync();

      if (!token || !user) {
        throw new Error('User not authenticated');
      }

      const context = getLoginContext();
      await secureAuthService.changePassword(user.id, passwordData, context);

      // Password change will clear all tokens, so remove them
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authUser');
    } catch (_error) {
      throw _error;
    }
  },

  // Add token validation utility
  validateToken: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return false;
      }

      const context = getLoginContext();
      const user = await secureAuthService.getCurrentUser(token, context);
      return !!user;
    } catch (_error) {
      return false;
    }
  },

  // Add permission check utility
  checkPermission: async (
    permission: string,
    resource: string,
    targetUserId?: string
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return false;
      }

      const context = getLoginContext();
      return await secureAuthService.checkPermission(
        token,
        permission as any,
        resource as any,
        context,
        targetUserId
      );
    } catch (_error) {
      return false;
    }
  },
};
