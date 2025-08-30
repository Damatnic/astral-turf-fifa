import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService, type SignupData } from '../../services/authService';
import { createMockUser } from '../factories';
import type { User, UserRole } from '../../types';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const user = await authService.login('coach@example.com', 'password123');
      
      expect(user).toBeDefined();
      expect(user.email).toBe('coach@example.com');
      expect(user.role).toBe('coach');
      expect(user.lastLoginAt).toBeDefined();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authUser', expect.any(String));
    });

    it('should reject login with invalid email', async () => {
      await expect(authService.login('nonexistent@example.com', 'password123'))
        .rejects
        .toThrow('User not found or account is inactive');
    });

    it('should reject login with invalid password', async () => {
      await expect(authService.login('coach@example.com', 'wrongpassword'))
        .rejects
        .toThrow('Invalid email or password');
    });

    it('should update lastLoginAt timestamp on successful login', async () => {
      const beforeLogin = new Date().toISOString();
      const user = await authService.login('coach@example.com', 'password123');
      const afterLogin = new Date().toISOString();
      
      expect(user.lastLoginAt).toBeDefined();
      expect(new Date(user.lastLoginAt!)).toBeInstanceOf(Date);
      expect(user.lastLoginAt!).toBeGreaterThanOrEqual(beforeLogin);
      expect(user.lastLoginAt!).toBeLessThanOrEqual(afterLogin);
    });

    it('should store user in localStorage on successful login', async () => {
      const user = await authService.login('coach@example.com', 'password123');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'authUser', 
        JSON.stringify(user)
      );
    });
  });

  describe('signup', () => {
    const validSignupData: SignupData = {
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: 'coach' as UserRole,
    };

    it('should successfully create new user with valid data', async () => {
      const user = await authService.signup(validSignupData);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(validSignupData.email);
      expect(user.firstName).toBe(validSignupData.firstName);
      expect(user.lastName).toBe(validSignupData.lastName);
      expect(user.role).toBe(validSignupData.role);
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeDefined();
      expect(user.notifications).toBeDefined();
    });

    it('should reject signup with duplicate email', async () => {
      const signupData = { ...validSignupData, email: 'coach@example.com' };
      
      await expect(authService.signup(signupData))
        .rejects
        .toThrow('User with this email already exists');
    });

    it('should reject signup with mismatched passwords', async () => {
      const signupData = { ...validSignupData, confirmPassword: 'differentpassword' };
      
      await expect(authService.signup(signupData))
        .rejects
        .toThrow('Passwords do not match');
    });

    it('should reject signup with short password', async () => {
      const signupData = { ...validSignupData, password: '123', confirmPassword: '123' };
      
      await expect(authService.signup(signupData))
        .rejects
        .toThrow('Password must be at least 8 characters long');
    });

    it('should set default notification settings for new user', async () => {
      const user = await authService.signup(validSignupData);
      
      expect(user.notifications).toEqual({
        email: true,
        sms: false,
        push: true,
        matchUpdates: true,
        trainingReminders: true,
        emergencyAlerts: true,
        paymentReminders: false, // Only true for family role
      });
    });

    it('should set paymentReminders to true for family role', async () => {
      const familySignupData = { ...validSignupData, role: 'family' as UserRole };
      const user = await authService.signup(familySignupData);
      
      expect(user.notifications.paymentReminders).toBe(true);
    });

    it('should store new user in localStorage', async () => {
      const user = await authService.signup(validSignupData);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'authUser', 
        JSON.stringify(user)
      );
    });
  });

  describe('logout', () => {
    it('should remove user and family associations from localStorage', () => {
      authService.logout();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authUser');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('familyAssociations');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage if exists', () => {
      const mockUser = createMockUser();
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      
      const user = authService.getCurrentUser();
      
      expect(user).toEqual(mockUser);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authUser');
    });

    it('should return null if no user in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const user = authService.getCurrentUser();
      
      expect(user).toBeNull();
    });

    it('should return null if localStorage data is corrupted', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      
      const user = authService.getCurrentUser();
      
      expect(user).toBeNull();
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
      await expect(authService.updateUserProfile('nonexistent', {}))
        .rejects
        .toThrow('User not found');
    });

    it('should update localStorage if updating current user', async () => {
      const mockUser = createMockUser({ id: 'coach1' });
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      
      const updates = { firstName: 'Updated' };
      await authService.updateUserProfile('coach1', updates);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'authUser',
        expect.stringContaining('"firstName":"Updated"')
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should successfully request password reset for existing user', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await expect(authService.requestPasswordReset('coach@example.com'))
        .resolves
        .toBeUndefined();
      
      expect(consoleSpy).toHaveBeenCalledWith('Password reset email sent to coach@example.com');
      consoleSpy.mockRestore();
    });

    it('should reject password reset for non-existent user', async () => {
      await expect(authService.requestPasswordReset('nonexistent@example.com'))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token and password', async () => {
      await expect(authService.resetPassword('valid-token', 'newpassword123'))
        .resolves
        .toBeUndefined();
    });

    it('should reject password reset with short password', async () => {
      await expect(authService.resetPassword('valid-token', '123'))
        .rejects
        .toThrow('Password must be at least 8 characters long');
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
      await expect(authService.createFamilyAssociation('family1', 'nonexistent', 'father'))
        .rejects
        .toThrow('Player not found');
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
      await expect(authService.updateNotificationSettings('nonexistent', {}))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('deactivateUser', () => {
    it('should successfully deactivate user', async () => {
      await expect(authService.deactivateUser('coach1'))
        .resolves
        .toBeUndefined();
    });

    it('should reject deactivation for non-existent user', async () => {
      await expect(authService.deactivateUser('nonexistent'))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('activateUser', () => {
    it('should successfully activate user', async () => {
      await expect(authService.activateUser('coach1'))
        .resolves
        .toBeUndefined();
    });

    it('should reject activation for non-existent user', async () => {
      await expect(authService.activateUser('nonexistent'))
        .rejects
        .toThrow('User not found');
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
});