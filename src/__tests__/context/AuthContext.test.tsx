import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, render } from '@testing-library/react';
import { AuthContext } from '../../context/AuthContext';
import { useAuthContext } from '../../hooks/useAuthContext';
import { createMockAuthState } from '../factories';
import type { AuthState } from '../../types';
// import { INITIAL_STATE } from '../../constants';

// Mock dispatch function
const mockDispatch = vi.fn();

// Wrapper component to provide context
const createWrapper = (authState: AuthState) => {
  return ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={{ authState, dispatch: mockDispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuthContext hook', () => {
    it('should return auth state and dispatch from context', () => {
      const mockAuthState = createMockAuthState({
        isAuthenticated: true,
        user: {
          id: 'test-user',
          email: 'test@example.com',
          role: 'coach',
          firstName: 'Test',
          lastName: 'User',
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
      });

      const wrapper = createWrapper(mockAuthState);
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      expect(result.current.authState).toEqual(mockAuthState);
      expect(result.current.dispatch).toBe(mockDispatch);
    });

    it('should throw error when used outside of context provider', () => {
      // Suppress React error boundary warnings for this specific test
      const originalError = console.error;
      console.error = vi.fn();

      // Use renderHook without wrapper to test error throwing
      expect(() => {
        renderHook(() => useAuthContext());
      }).toThrow('useAuthContext must be used within an AppProvider');

      console.error = originalError;
    });

    it('should return unauthenticated state correctly', () => {
      const mockAuthState = createMockAuthState({
        isAuthenticated: false,
        user: null,
      });

      const wrapper = createWrapper(mockAuthState);
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      expect(result.current.authState.isAuthenticated).toBe(false);
      expect(result.current.authState.user).toBeNull();
    });

    it('should return error state correctly', () => {
      const mockAuthState = createMockAuthState({
        isAuthenticated: false,
        user: null,
        error: 'Authentication failed',
      });

      const wrapper = createWrapper(mockAuthState);
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      expect(result.current.authState.error).toBe('Authentication failed');
      expect(result.current.authState.isAuthenticated).toBe(false);
    });

    it('should handle different user roles correctly', () => {
      const coachState = createMockAuthState({
        isAuthenticated: true,
        user: {
          id: 'coach1',
          email: 'coach@example.com',
          role: 'coach',
          firstName: 'Coach',
          lastName: 'User',
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
      });

      const wrapper = createWrapper(coachState);
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      expect(result.current.authState.user?.role).toBe('coach');
      expect(result.current.authState.isAuthenticated).toBe(true);
    });

    it('should handle player role correctly', () => {
      const playerState = createMockAuthState({
        isAuthenticated: true,
        user: {
          id: 'player1',
          email: 'player@example.com',
          role: 'player',
          firstName: 'Player',
          lastName: 'User',
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
      });

      const wrapper = createWrapper(playerState);
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      expect(result.current.authState.user?.role).toBe('player');
    });

    it('should handle family role correctly', () => {
      const familyState = createMockAuthState({
        isAuthenticated: true,
        user: {
          id: 'family1',
          email: 'family@example.com',
          role: 'family',
          firstName: 'Family',
          lastName: 'Member',
          notifications: {
            email: true,
            sms: false,
            push: true,
            matchUpdates: true,
            trainingReminders: true,
            emergencyAlerts: true,
            paymentReminders: true, // Should be true for family role
          },
          timezone: 'America/New_York',
          language: 'en',
          createdAt: '2024-01-01T00:00:00Z',
          isActive: true,
          playerIds: ['player1'], // Family members have associated players
        },
      });

      const wrapper = createWrapper(familyState);
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      expect(result.current.authState.user?.role).toBe('family');
      expect(result.current.authState.user?.notifications.paymentReminders).toBe(true);
      expect(result.current.authState.user?.playerIds).toEqual(['player1']);
    });

    it('should provide initial state values from constants', () => {
      const initialState = createMockAuthState();
      const wrapper = createWrapper(initialState);
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      expect(result.current.authState.user).toBeNull();
      expect(result.current.authState.error).toBeNull();
      expect(result.current.authState.isAuthenticated).toBe(false);
    });
  });

  describe('AuthContext default values', () => {
    it('should have undefined as default value', () => {
      const contextValue = (AuthContext as any)._currentValue;
      expect(contextValue).toBeUndefined();
    });
  });
});
