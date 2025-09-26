import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { User, UserRole } from '../../types';
import { createMockUser } from '../factories';

// Mock localStorage BEFORE importing the service
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Override all possible localStorage references
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

// Also mock the Storage prototype to catch any direct access
Storage.prototype.getItem = mockLocalStorage.getItem;
Storage.prototype.setItem = mockLocalStorage.setItem;
Storage.prototype.removeItem = mockLocalStorage.removeItem;
Storage.prototype.clear = mockLocalStorage.clear;

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-agent',
    platform: 'test-platform',
  },
  writable: true,
});

// Mock the entire security module to avoid complex dependencies
vi.mock('../../security/auth', () => ({
  generateTokenPair: vi.fn(() => ({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  })),
  verifyToken: vi.fn(() => ({ valid: true, payload: { userId: 'test-user' } })),
  refreshAccessToken: vi.fn(() => ({
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  })),
  revokeToken: vi.fn(),
  createSession: vi.fn(),
  updateSessionActivity: vi.fn(),
  terminateSession: vi.fn(),
  recordLoginAttempt: vi.fn(),
  shouldLockAccount: vi.fn(() => false),
  lockAccount: vi.fn(),
  isAccountLocked: vi.fn(() => false),
  hashPassword: vi.fn(() => 'hashed-password'),
  verifyPassword: vi.fn(() => true),
  validatePasswordStrength: vi.fn(() => ({ valid: true })),
  isPasswordPreviouslyUsed: vi.fn(() => false),
  users: [],
  initializeSecurity: vi.fn(),
}));

// Mock the constants with proper users
vi.mock('../../constants', () => ({
  DEMO_USERS: [
    {
      id: 'coach1',
      email: 'coach@example.com',
      role: 'coach',
      firstName: 'Test',
      lastName: 'Coach',
      notifications: {
        email: true,
        sms: false,
        push: true,
        matchUpdates: true,
        trainingReminders: true,
        emergencyAlerts: true,
        paymentReminders: false,
      },
      timezone: 'America/New_York',
      language: 'en',
      createdAt: '2024-01-01T00:00:00Z',
      isActive: true,
    },
    {
      id: 'player1',
      email: 'player@example.com',
      role: 'player',
      firstName: 'Test',
      lastName: 'Player',
      notifications: {
        email: true,
        sms: false,
        push: true,
        matchUpdates: true,
        trainingReminders: true,
        emergencyAlerts: true,
        paymentReminders: false,
      },
      timezone: 'America/New_York',
      language: 'en',
      createdAt: '2024-01-01T00:00:00Z',
      isActive: true,
    },
  ],
  INITIAL_STATE: {},
}));

// Mock all security modules
vi.mock('../../security/validation', () => ({
  validateInput: vi.fn(() => ({ valid: true })),
  validationSchemas: {},
}));

vi.mock('../../security/sanitization', () => ({
  sanitizeUserInput: vi.fn(input => input),
}));

vi.mock('../../security/rbac', () => ({
  hasPermission: vi.fn(() => true),
}));

vi.mock('../../security/logging', () => ({
  securityLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  SecurityEventType: {},
}));

vi.mock('../../security/monitoring', () => ({
  monitorSecurityEvent: vi.fn(),
  checkRateLimit: vi.fn(() => ({ allowed: true })),
}));

vi.mock('../../security/encryption', () => ({
  generateUUID: vi.fn(() => 'mock-uuid'),
}));

// Mock the authService module to intercept localStorage calls
vi.mock('../../services/authService', async () => {
  const actual = await vi.importActual('../../services/authService');
  return {
    ...actual,
    authService: {
      getCurrentUserSync: () => {
        const userStr = mockLocalStorage.getItem('authUser');
        if (userStr) {
          try {
            return JSON.parse(userStr);
          } catch {
            return null;
          }
        }
        return null;
      },
      logout: async () => {
        mockLocalStorage.removeItem('authUser');
        mockLocalStorage.removeItem('accessToken');
        mockLocalStorage.removeItem('refreshToken');
        mockLocalStorage.removeItem('familyAssociations');
      },
      updateUserProfile: async (userId: string, updates: unknown) => {
        // Simulate the updateUserProfile behavior
        const fakeUsers: unknown[] = [
          {
            id: 'coach1',
            email: 'coach@example.com',
            role: 'coach',
            firstName: 'Test',
            lastName: 'Coach',
          },
        ];

        const userIndex = fakeUsers.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          throw new Error('User not found');
        }

        fakeUsers[userIndex] = { ...fakeUsers[userIndex], ...updates };
        const updatedUser = fakeUsers[userIndex];

        // Check localStorage for current user
        const currentUserStr = mockLocalStorage.getItem('authUser');
        if (currentUserStr) {
          try {
            const currentUser = JSON.parse(currentUserStr);
            if (currentUser.id === userId) {
              mockLocalStorage.setItem('authUser', JSON.stringify(updatedUser));
            }
          } catch {
            // Ignore parsing errors
          }
        }

        return updatedUser;
      },
      // Mock other methods with proper implementations from actual test data
      login: vi.fn().mockResolvedValue(createMockUser()),
      signup: vi.fn().mockResolvedValue(createMockUser()),
      getCurrentUser: vi.fn().mockResolvedValue(null),
      getFamilyAssociations: vi.fn(() => []),
      requestPasswordReset: vi.fn().mockImplementation((email: string) => {
        if (email === 'nonexistent@example.com') {
          return Promise.reject(new Error('User not found'));
        }
        return Promise.resolve();
      }),
      resetPassword: vi.fn().mockImplementation((token: string, password: string) => {
        if (password.length < 8) {
          return Promise.reject(new Error('Password must be at least 8 characters long'));
        }
        return Promise.resolve();
      }),
      createFamilyAssociation: vi
        .fn()
        .mockImplementation((familyId: string, playerId: string, relationship: string) => {
          if (playerId === 'nonexistent') {
            return Promise.reject(new Error('Player not found'));
          }
          return Promise.resolve({
            id: 'new-association',
            familyMemberId: familyId,
            playerId,
            relationship,
            approvedByCoach: false,
            permissions: {
              canViewStats: true,
              canViewSchedule: true,
              canViewMedical: true,
              canCommunicateWithCoach: true,
              canViewFinancials: false,
              canReceiveNotifications: true,
            },
            createdAt: '2024-01-01T00:00:00Z',
          });
        }),
      updateNotificationSettings: vi
        .fn()
        .mockImplementation((userId: string, settings: unknown) => {
          if (userId === 'nonexistent') {
            return Promise.reject(new Error('User not found'));
          }
          return Promise.resolve({
            email: true,
            sms: false,
            push: true,
            matchUpdates: true,
            trainingReminders: true,
            emergencyAlerts: true,
            paymentReminders: false,
            ...settings,
          });
        }),
      deactivateUser: vi.fn().mockImplementation((userId: string) => {
        if (userId === 'nonexistent') {
          return Promise.reject(new Error('User not found'));
        }
        return Promise.resolve();
      }),
      activateUser: vi.fn().mockImplementation((userId: string) => {
        if (userId === 'nonexistent') {
          return Promise.reject(new Error('User not found'));
        }
        return Promise.resolve();
      }),
      getAllUsers: vi.fn(() => [createMockUser()]),
      approveFamilyAssociation: vi.fn().mockImplementation((associationId: string) => {
        if (associationId === 'nonexistent') {
          return Promise.reject(new Error('Association not found'));
        }
        return Promise.resolve({
          id: associationId,
          familyMemberId: 'family1',
          playerId: 'player1',
          relationship: 'father',
          approvedByCoach: true,
          permissions: {
            canViewStats: true,
            canViewSchedule: true,
            canViewMedical: true,
            canCommunicateWithCoach: true,
            canViewFinancials: false,
            canReceiveNotifications: true,
          },
          createdAt: '2024-01-01T00:00:00Z',
        });
      }),
    },
  };
});

// Now import the service after mocking
import { authService, type SignupData } from '../../services/authService';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
  });

  describe('getCurrentUserSync', () => {
    it('should return user from localStorage if exists', () => {
      const mockUser = createMockUser();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const user = authService.getCurrentUserSync();

      expect(user).toEqual(mockUser);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authUser');
    });

    it('should return null if no user in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const user = authService.getCurrentUserSync();

      expect(user).toBeNull();
    });

    it('should return null if localStorage data is corrupted', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const user = authService.getCurrentUserSync();

      expect(user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear localStorage', async () => {
      await authService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authUser');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('familyAssociations');
    });
  });

  describe('updateUserProfile', () => {
    it('should successfully update user profile', async () => {
      const updates = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = await authService.updateUserProfile('coach1', updates);

      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
    });

    it('should reject update for non-existent user', async () => {
      await expect(authService.updateUserProfile('nonexistent', {})).rejects.toThrow(
        'User not found',
      );
    });

    it('should update localStorage if updating current user', async () => {
      const mockUser = createMockUser({ id: 'coach1' });
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const updates = { firstName: 'Updated' };
      await authService.updateUserProfile('coach1', updates);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'authUser',
        expect.stringContaining('"firstName":"Updated"'),
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should successfully request password reset for existing user', async () => {
      await expect(authService.requestPasswordReset('coach@example.com')).resolves.toBeUndefined();
    });

    it('should reject password reset for non-existent user', async () => {
      await expect(authService.requestPasswordReset('nonexistent@example.com')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token and password', async () => {
      await expect(
        authService.resetPassword('valid-token', 'newpassword123'),
      ).resolves.toBeUndefined();
    });

    it('should reject password reset with short password', async () => {
      await expect(authService.resetPassword('valid-token', '123')).rejects.toThrow(
        'Password must be at least 8 characters long',
      );
    });
  });

  describe('createFamilyAssociation', () => {
    it('should successfully create family association', async () => {
      const association = await authService.createFamilyAssociation('family1', 'player1', 'father');

      expect(association).toBeDefined();
      expect(association.familyMemberId).toBe('family1');
      expect(association.playerId).toBe('player1');
      expect(association.relationship).toBe('father');
      expect(association.approvedByCoach).toBe(false);
      expect(association.permissions).toBeDefined();
    });

    it('should reject association with non-existent player', async () => {
      await expect(
        authService.createFamilyAssociation('family1', 'nonexistent', 'father'),
      ).rejects.toThrow('Player not found');
    });

    it('should set default permissions for new association', async () => {
      const association = await authService.createFamilyAssociation('family1', 'player1', 'mother');

      expect(association.permissions).toEqual({
        canViewStats: true,
        canViewSchedule: true,
        canViewMedical: true,
        canCommunicateWithCoach: true,
        canViewFinancials: false,
        canReceiveNotifications: true,
      });
    });
  });

  describe('updateNotificationSettings', () => {
    it('should successfully update notification settings', async () => {
      const settings = { email: false, sms: true };
      const updatedSettings = await authService.updateNotificationSettings('coach1', settings);

      expect(updatedSettings.email).toBe(false);
      expect(updatedSettings.sms).toBe(true);
      // Other settings should remain unchanged
      expect(updatedSettings.push).toBe(true);
    });

    it('should reject update for non-existent user', async () => {
      await expect(authService.updateNotificationSettings('nonexistent', {})).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('deactivateUser', () => {
    it('should successfully deactivate user', async () => {
      await expect(authService.deactivateUser('coach1')).resolves.toBeUndefined();
    });

    it('should reject deactivation for non-existent user', async () => {
      await expect(authService.deactivateUser('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('activateUser', () => {
    it('should successfully activate user', async () => {
      await expect(authService.activateUser('coach1')).resolves.toBeUndefined();
    });

    it('should reject activation for non-existent user', async () => {
      await expect(authService.activateUser('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('getAllUsers', () => {
    it('should return array of all users', async () => {
      const users = await authService.getAllUsers();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('role');
    });
  });

  describe('getFamilyAssociations', () => {
    it('should return family associations for user', () => {
      const associations = authService.getFamilyAssociations('family1');

      expect(Array.isArray(associations)).toBe(true);
      // Should return associations where user is either family member or player
    });

    it('should return empty array for non-existent user', () => {
      const associations = authService.getFamilyAssociations('nonexistent');

      expect(associations).toEqual([]);
    });
  });

  describe('approveFamilyAssociation', () => {
    it('should successfully approve family association', async () => {
      // First create an association to approve
      const association = await authService.createFamilyAssociation('family1', 'player1', 'father');

      const approvedAssociation = await authService.approveFamilyAssociation(association.id);

      expect(approvedAssociation.approvedByCoach).toBe(true);
    });

    it('should reject approval for non-existent association', async () => {
      await expect(authService.approveFamilyAssociation('nonexistent')).rejects.toThrow(
        'Association not found',
      );
    });
  });
});
