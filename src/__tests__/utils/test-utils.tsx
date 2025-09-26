import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { User, Player, Formation, AuthState, TacticsState, UIState } from '../../types';
import { DEMO_USERS, DEMO_PLAYERS, DEMO_FORMATIONS, INITIAL_STATE } from '../../constants';
import AppProvider from '../../context/AppProvider';

// Mock data for testing
export const mockUser: User = {
  ...DEMO_USERS[0], // Use first demo user as default
};

export const mockPlayers: Player[] = DEMO_PLAYERS.slice(0, 5); // Use first 5 players

export const mockFormation: Formation = {
  ...DEMO_FORMATIONS[0], // Use first demo formation
};

// Mock states for testing
export const createMockAuthState = (overrides: Partial<AuthState> = {}): AuthState => ({
  ...INITIAL_STATE.auth,
  ...overrides,
});

export const createMockTacticsState = (overrides: Partial<TacticsState> = {}): TacticsState => ({
  ...INITIAL_STATE.tactics,
  players: mockPlayers,
  formations: [mockFormation],
  ...overrides,
});

export const createMockUIState = (overrides: Partial<UIState> = {}): UIState => ({
  ...INITIAL_STATE.ui,
  ...overrides,
});

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: {
    auth?: Partial<AuthState>;
    tactics?: Partial<TacticsState>;
    ui?: Partial<UIState>;
  };
  withRouter?: boolean;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) => {
  const {
    initialState = {},
    withRouter = true,
    ...renderOptions
  } = options;

  // Create wrapper component with providers
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const content = <AppProvider>{children}</AppProvider>;

    if (withRouter) {
      return <BrowserRouter>{content}</BrowserRouter>;
    }

    return content;
  };

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Mock functions for services
export const mockAuthService = {
  login: vi.fn().mockResolvedValue(mockUser),
  signup: vi.fn().mockResolvedValue(mockUser),
  logout: vi.fn(),
  getCurrentUser: vi.fn().mockReturnValue(mockUser),
  getFamilyAssociations: vi.fn().mockReturnValue([]),
  updateUserProfile: vi.fn().mockResolvedValue(mockUser),
  requestPasswordReset: vi.fn().mockResolvedValue(undefined),
  resetPassword: vi.fn().mockResolvedValue(undefined),
  createFamilyAssociation: vi.fn().mockResolvedValue({}),
  approveFamilyAssociation: vi.fn().mockResolvedValue({}),
  updateNotificationSettings: vi.fn().mockResolvedValue(mockUser.notifications),
  deactivateUser: vi.fn().mockResolvedValue(undefined),
  activateUser: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue([mockUser]),
};

export const mockAiService = {
  generateResponse: vi.fn().mockResolvedValue('Mock AI response'),
  generateTacticalAnalysis: vi.fn().mockResolvedValue('Mock tactical analysis'),
  suggestFormation: vi.fn().mockResolvedValue(mockFormation),
  analyzePlayer: vi.fn().mockResolvedValue('Mock player analysis'),
  generateTrainingPlan: vi.fn().mockResolvedValue('Mock training plan'),
};

// Utility functions for common test patterns
export const waitForLoadingToFinish = async () => {
  const { findByText } = await import('@testing-library/react');
  // Wait for any loading indicators to disappear
  await new Promise(resolve => setTimeout(resolve, 0));
};

export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
  };
};

// Mock drag and drop events
export const createMockDragEvent = (type: string, data: Record<string, unknown> = {}) => {
  const event = new Event(type) as any;
  event.dataTransfer = {
    setData: vi.fn(),
    getData: vi.fn((format: string) => data[format] || ''),
    clearData: vi.fn(),
    dropEffect: 'move',
    effectAllowed: 'all',
    files: [],
    items: [],
    types: Object.keys(data),
  };
  return event;
};

// Mock touch events for mobile testing
export const createMockTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }> = []) => {
  const event = new Event(type) as any;
  event.touches = touches.map((touch, index) => ({
    identifier: index,
    target: null,
    clientX: touch.clientX,
    clientY: touch.clientY,
    pageX: touch.clientX,
    pageY: touch.clientY,
    screenX: touch.clientX,
    screenY: touch.clientY,
    radiusX: 1,
    radiusY: 1,
    rotationAngle: 0,
    force: 1,
  }));
  event.targetTouches = event.touches;
  event.changedTouches = event.touches;
  return event;
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';