import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { User, Player, Formation, AuthState, TacticsState, UIState } from '../../types';
import { AppProvider } from '../../context/AppProvider';
import { ThemeProvider } from '../../context/ThemeContext';
import {
  createMockUser,
  createMockPlayer,
  createMockFormation,
  createMockPlayers,
} from '../factories';

// Mock data for testing
export const mockUser: User = createMockUser();

export const mockPlayers: Player[] = createMockPlayers(5); // Create 5 mock players

export const mockFormation: Formation = createMockFormation();

// Mock states for testing
export const createMockAuthState = (overrides: Partial<AuthState> = {}): AuthState => ({
  user: null,
  error: null,
  isAuthenticated: false,
  isLoading: false,
  familyAssociations: [],
  ...overrides,
});

export const createMockTacticsState = (overrides: Partial<TacticsState> = {}): TacticsState => ({
  players: mockPlayers,
  formations: { '4-4-2': mockFormation },
  playbook: {},
  activeFormationIds: { home: '4-4-2', away: '4-4-2' },
  teamTactics: {
    home: {
      mentality: 'balanced',
      pressing: 'medium',
      defensiveLine: 'medium',
      attackingWidth: 'medium',
    },
    away: {
      mentality: 'balanced',
      pressing: 'medium',
      defensiveLine: 'medium',
      attackingWidth: 'medium',
    },
  },
  drawings: [],
  tacticalFamiliarity: { '4-4-2': 50 },
  chemistry: {},
  captainIds: { home: null, away: null },
  setPieceTakers: { home: {}, away: {} },
  ...overrides,
});

export const createMockUIState = (overrides: Partial<UIState> = {}): UIState => ({
  theme: 'dark',
  saveSlots: {},
  activeSaveSlotId: null,
  activeModal: null,
  teamKits: { home: {} as any, away: {} as any },
  notifications: [],
  activeTeamContext: 'home',
  editingPlayerId: null,
  playerToCompareId: null,
  slotActionMenuData: null,
  isExportingLineup: false,
  isPresentationMode: false,
  drawingTool: 'select',
  drawingColor: '#000000',
  isGridVisible: true,
  isFormationStrengthVisible: false,
  positioningMode: 'snap',
  activePlaybookItemId: null,
  activeStepIndex: null,
  isAnimating: false,
  isPaused: false,
  playerInitialPositions: null,
  animationTrails: null,
  setPieceEditor: { isEditing: false, activeTool: null, selectedPlayerId: null },
  rosterSearchQuery: '',
  rosterRoleFilters: [],
  advancedRosterFilters: {} as any,
  transferMarketFilters: {} as any,
  playbookCategories: {},
  settings: {} as any,
  isLoadingAI: false,
  aiInsight: null,
  isComparingAI: false,
  aiComparisonResult: null,
  isSuggestingFormation: false,
  aiSuggestedFormation: null,
  chatHistory: [],
  isChatProcessing: false,
  highlightedByAIPlayerIds: [],
  isLoadingOppositionReport: false,
  oppositionReport: null,
  isSimulatingMatch: false,
  simulationTimeline: [],
  isLoadingPostMatchReport: false,
  postMatchReport: null,
  isLoadingPressConference: false,
  pressConferenceData: null,
  isLoadingNegotiation: false,
  isLoadingAISubSuggestion: false,
  aiSubSuggestionData: null,
  isScoutingPlayer: false,
  scoutedPlayerId: null,
  scoutReport: null,
  isLoadingConversation: false,
  selectedPlayerId: null,
  isLoadingDevelopmentSummary: false,
  developmentSummary: null,
  isLoadingTeamTalk: false,
  teamTalkData: null,
  tutorial: {
    isActive: false,
    step: 0,
  },
  playerConversationData: null,
  pendingPromiseRequest: null,
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

export const renderWithProviders = (ui: React.ReactElement, options: CustomRenderOptions = {}) => {
  const { initialState = {}, withRouter = true, ...renderOptions } = options;

  // Create wrapper component with providers
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const content = (
      <ThemeProvider>
        <AppProvider>{children}</AppProvider>
      </ThemeProvider>
    );

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
export const createMockTouchEvent = (
  type: string,
  touches: Array<{ clientX: number; clientY: number }> = [],
) => {
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
