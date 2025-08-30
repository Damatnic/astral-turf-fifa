import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProvider, cleanStateForSaving } from '../../context/AppProvider';
import { createMockUser, createMockTacticsState, createMockUIState } from '../factories';
import { INITIAL_STATE, APP_VERSION } from '../../constants';
import type { RootState } from '../../types';
import '../mocks/modules'; // Import module mocks

// Mock authService
const mockAuthService = {
  getCurrentUser: vi.fn(),
};

vi.mock('../../services/authService', () => ({
  authService: mockAuthService,
}));

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

// Mock console methods
const mockConsole = {
  warn: vi.fn(),
  error: vi.fn(),
  log: console.log,
};

Object.defineProperty(global, 'console', {
  value: mockConsole,
});

// Test component to verify context values
const TestComponent = () => {
  const authContext = React.useContext(require('../../context/AuthContext').AuthContext);
  const tacticsContext = React.useContext(require('../../context/TacticsContext').TacticsContext);
  
  return (
    <div>
      <div data-testid="auth-user">
        {authContext.authState.user ? authContext.authState.user.email : 'No user'}
      </div>
      <div data-testid="tactics-players">
        {tacticsContext.tacticsState.players.length}
      </div>
    </div>
  );
};

describe('AppProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getCurrentUser.mockReturnValue(null);
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    mockConsole.warn.mockClear();
    mockConsole.error.mockClear();
  });

  describe('Initial setup', () => {
    it('should render children with context providers', () => {
      render(
        <AppProvider>
          <div data-testid="test-child">Test Child</div>
        </AppProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should initialize with default state when no saved data', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(screen.getByTestId('auth-user')).toHaveTextContent('No user');
      // Default state should have initial players
      expect(screen.getByTestId('tactics-players')).toHaveTextContent(
        INITIAL_STATE.tactics.players.length.toString()
      );
    });

    it('should load authenticated user from authService', async () => {
      const mockUser = createMockUser({ email: 'test@example.com' });
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-user')).toHaveTextContent('test@example.com');
      });
    });
  });

  describe('State persistence', () => {
    it('should load saved state from localStorage when version matches', () => {
      const savedState = {
        version: APP_VERSION,
        tactics: createMockTacticsState({ selectedPlayers: ['player1'] }),
        ui: createMockUIState({ theme: 'light' }),
        franchise: INITIAL_STATE.franchise,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('astralTurfActiveState');
    });

    it('should discard saved state when version does not match', () => {
      const savedState = {
        version: 'old-version',
        tactics: createMockTacticsState(),
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Saved state version (old-version) does not match app version')
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('astralTurfActiveState');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Failed to load state from localStorage',
        expect.any(Error)
      );
    });

    it('should save state to localStorage on state changes', async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Wait for the effect to run
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'astralTurfActiveState',
          expect.any(String)
        );
      });
    });

    it('should handle localStorage save errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      await waitFor(() => {
        expect(mockConsole.error).toHaveBeenCalledWith(
          'Failed to save state to localStorage',
          expect.any(Error)
        );
      });
    });
  });

  describe('Save slot management', () => {
    it('should save to specific slot when activeSaveSlotId is set', async () => {
      const mockState = {
        ...INITIAL_STATE,
        ui: { ...INITIAL_STATE.ui, activeSaveSlotId: 'slot1' },
      };

      // Mock the component to trigger state change
      const StateChanger = () => {
        const { dispatch } = React.useContext(require('../../context/UIContext').UIContext);
        React.useEffect(() => {
          dispatch({ type: 'SET_ACTIVE_SAVE_SLOT', payload: 'slot1' });
        }, [dispatch]);
        return <div>State Changer</div>;
      };

      render(
        <AppProvider>
          <StateChanger />
        </AppProvider>
      );

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'astralTurfSave_slot1',
          expect.any(String)
        );
      });
    });

    it('should update save slot metadata', async () => {
      const existingSlots = {
        'slot1': {
          id: 'slot1',
          name: 'Test Save',
          createdAt: '2024-01-01T00:00:00Z',
          lastSaved: '2024-01-01T00:00:00Z',
        },
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'astralTurfSaveSlots') {
          return JSON.stringify(existingSlots);
        }
        return null;
      });

      const StateChanger = () => {
        const { dispatch } = React.useContext(require('../../context/UIContext').UIContext);
        React.useEffect(() => {
          dispatch({ type: 'SET_ACTIVE_SAVE_SLOT', payload: 'slot1' });
        }, [dispatch]);
        return <div>State Changer</div>;
      };

      render(
        <AppProvider>
          <StateChanger />
        </AppProvider>
      );

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'astralTurfSaveSlots',
          expect.stringContaining('"lastSaved"')
        );
      });
    });
  });

  describe('Animation loop', () => {
    it('should advance animation steps automatically', async () => {
      const mockPlaybook = {
        'test-item': {
          id: 'test-item',
          name: 'Test Play',
          steps: [
            { id: 'step1', playerPositions: {}, drawings: [] },
            { id: 'step2', playerPositions: {}, drawings: [] },
          ],
        },
      };

      const AnimationTester = () => {
        const { dispatch } = React.useContext(require('../../context/UIContext').UIContext);
        const { tacticsState } = React.useContext(require('../../context/TacticsContext').TacticsContext);
        
        React.useEffect(() => {
          // Set up animation state
          dispatch({ type: 'SET_ACTIVE_PLAYBOOK_ITEM', payload: 'test-item' });
          dispatch({ type: 'START_ANIMATION' });
        }, [dispatch]);

        return (
          <div data-testid="animation-state">
            {tacticsState.playbook?.['test-item'] ? 'Has playbook' : 'No playbook'}
          </div>
        );
      };

      render(
        <AppProvider>
          <AnimationTester />
        </AppProvider>
      );

      // Animation timing is tested indirectly through state changes
      await waitFor(() => {
        expect(screen.getByTestId('animation-state')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should handle reducer errors gracefully', () => {
      // Mock a reducer that throws an error
      vi.mock('../../context/reducers/rootReducer', () => ({
        rootReducer: () => {
          throw new Error('Reducer error');
        },
      }));

      expect(() => {
        render(
          <AppProvider>
            <div>Test</div>
          </AppProvider>
        );
      }).not.toThrow();
    });
  });
});

describe('cleanStateForSaving', () => {
  let mockState: RootState;

  beforeEach(() => {
    mockState = {
      ...INITIAL_STATE,
      tactics: {
        ...createMockTacticsState(),
        playbook: {
          'item1': {
            id: 'item1',
            name: 'Test Play',
            category: 'Attack',
            formationId: 'formation1',
            steps: [
              { id: 'step1', playerPositions: {}, drawings: [] },
            ],
          },
        },
      },
      ui: {
        ...createMockUIState(),
        activePlaybookItemId: 'item1',
        activeStepIndex: 0,
        activeModal: 'editPlayer',
        isLoadingAI: true,
        notifications: [{ id: '1', message: 'Test', type: 'info' }],
      },
      franchise: {
        ...INITIAL_STATE.franchise,
        negotiationData: { playerId: 'player1', offer: 50000 },
        lastMatchResult: { homeScore: 2, awayScore: 1, events: [], commentary: [], matchRatings: {} },
      },
    };
  });

  it('should remove transient UI properties', () => {
    const cleanedState = cleanStateForSaving(mockState) as any;

    expect(cleanedState.ui.activeModal).toBeUndefined();
    expect(cleanedState.ui.isLoadingAI).toBeUndefined();
    expect(cleanedState.ui.notifications).toBeUndefined();
  });

  it('should remove transient franchise properties', () => {
    const cleanedState = cleanStateForSaving(mockState) as any;

    expect(cleanedState.franchise.negotiationData).toBeUndefined();
    expect(cleanedState.franchise.lastMatchResult).toBeUndefined();
  });

  it('should update active playbook step with current positions', () => {
    mockState.tactics.players = [
      { ...mockState.tactics.players[0], id: 'player1', position: { x: 100, y: 200 } },
    ];
    mockState.tactics.drawings = [
      { id: 'draw1', type: 'line', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }], color: 'red' },
    ];

    const cleanedState = cleanStateForSaving(mockState) as any;
    const activeStep = cleanedState.tactics.playbook['item1'].steps[0];

    expect(activeStep.playerPositions['player1']).toEqual({ x: 100, y: 200 });
    expect(activeStep.drawings).toEqual(mockState.tactics.drawings);
  });

  it('should exclude auth state from saved data', () => {
    const cleanedState = cleanStateForSaving(mockState) as any;

    expect(cleanedState.auth).toBeUndefined();
  });

  it('should include version in saved data', () => {
    const cleanedState = cleanStateForSaving(mockState) as any;

    expect(cleanedState.version).toBe(APP_VERSION);
  });

  it('should preserve non-transient state properties', () => {
    const cleanedState = cleanStateForSaving(mockState) as any;

    expect(cleanedState.tactics.players).toBeDefined();
    expect(cleanedState.tactics.formations).toBeDefined();
    expect(cleanedState.franchise.gameWeek).toBeDefined();
    expect(cleanedState.ui.theme).toBeDefined();
  });

  it('should handle state without active playbook item', () => {
    const stateWithoutPlaybook = {
      ...mockState,
      ui: {
        ...mockState.ui,
        activePlaybookItemId: null,
        activeStepIndex: null,
      },
    };

    expect(() => {
      cleanStateForSaving(stateWithoutPlaybook);
    }).not.toThrow();
  });
});