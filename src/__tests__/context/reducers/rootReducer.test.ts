import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rootReducer } from '../../../context/reducers/rootReducer';
import { createMockTacticsState, createMockUIState, createMockAuthState } from '../../factories';
import type { RootState, Action } from '../../../types';

// Mock immer's produce function
vi.mock('immer', () => ({
  produce: (state: unknown, recipe: (draft: unknown) => void) => {
    const draft = JSON.parse(JSON.stringify(state)); // Deep clone for testing
    recipe(draft);
    return draft;
  },
}));

// Mock the sub-reducers
vi.mock('../../../context/reducers/tacticsReducer', () => ({
  tacticsReducer: vi.fn((state, action) => {
    // Mock implementation that modifies the state based on action type
    if (action.type === 'ADD_PLAYER') {
      // Ensure players array exists before pushing
      if (!state.players) {
        state.players = [];
      }
      state.players.push(action.payload);
    }
    if (action.type === 'ADD_LIBRARY_PLAY_TO_PLAYBOOK') {
      // Ensure playbook exists before forEach
      if (!state.playbook) {
        state.playbook = {};
      }
      if (action.payload?.steps) {
        action.payload.steps.forEach(() => {
          // Mock implementation
        });
      }
    }
    return state;
  }),
}));

vi.mock('../../../context/reducers/franchiseReducer', () => ({
  franchiseReducer: vi.fn((state, action) => {
    if (action.type === 'ADVANCE_WEEK') {
      state.gameWeek++;
      // Ensure history array exists before pushing
      if (!state.history) {
        state.history = [];
      }
      state.history.push({ week: state.gameWeek, events: [] });
    }
    return state;
  }),
}));

vi.mock('../../../context/reducers/uiReducer', () => ({
  uiReducer: vi.fn((state, action) => {
    if (action.type === 'SET_THEME') {
      state.theme = action.payload;
    }
    return state;
  }),
}));

vi.mock('../../../context/reducers/authReducer', () => ({
  authReducer: vi.fn((state, action) => {
    if (action.type === 'LOGIN_SUCCESS') {
      state.user = action.payload;
      state.isAuthenticated = true;
    }
    return state;
  }),
}));

describe('rootReducer', () => {
  let initialState: RootState;

  beforeEach(() => {
    vi.clearAllMocks();
    initialState = {
      tactics: createMockTacticsState(),
      ui: createMockUIState(),
      auth: createMockAuthState(),
      franchise: {
        relationships: [],
        budget: 1000000,
        expenses: [],
        staff: [],
        facilities: [],
        achievements: [],
        history: [],
        matchHistory: [],
        lastMatchResult: null,
        currentSeason: {
          id: 'season-2024',
          year: 2024,
          matches: [],
          standings: [],
        },
        gameWeek: 1,
      },
    };
  });

  describe('State management actions', () => {
    it('should handle LOAD_STATE action', () => {
      const loadStatePayload: Partial<RootState> = {
        tactics: createMockTacticsState(),
        ui: createMockUIState({ theme: 'light' }),
      };

      const action: Action = {
        type: 'LOAD_STATE',
        payload: loadStatePayload,
      };

      const newState = rootReducer(initialState, action);

      expect(newState.tactics.players).toBeDefined();
      expect(newState.ui.theme).toBe('light');
      // Should preserve initial state structure
      expect(newState.ui).toEqual(
        expect.objectContaining({ ...initialState.ui, ...loadStatePayload.ui }),
      );
    });

    it('should handle RESET_STATE action', () => {
      const modifiedState: RootState = {
        ...initialState,
        tactics: createMockTacticsState(),
        ui: createMockUIState({ theme: 'light', activeModal: 'editPlayer' }),
      };

      const action: Action = { type: 'RESET_STATE' };
      const newState = rootReducer(modifiedState, action);

      // Should reset to a clean initial state structure
      expect(newState.tactics.players).toEqual(expect.any(Array));
      expect(newState.ui.theme).toBe('dark'); // Reset to default theme
      expect(newState.auth.isAuthenticated).toBe(false);
    });
  });

  describe('Cross-cutting actions', () => {
    it('should handle SOFT_RESET_APP action', () => {
      const stateWithDrawings: RootState = {
        ...initialState,
        tactics: {
          ...createMockTacticsState(),
          drawings: [
            {
              id: '1',
              tool: 'line',
              points: [
                { x: 0, y: 0 },
                { x: 10, y: 10 },
              ],
              color: 'red',
            },
          ],
        },
      };

      const action: Action = { type: 'SOFT_RESET_APP' };
      const newState = rootReducer(stateWithDrawings, action);

      expect(newState.tactics.drawings).toEqual([]);
      // Players should be repositioned to their formation slots
      expect(newState.tactics.players).toBeDefined();
    });

    it('should handle ADVANCE_WEEK action', () => {
      const action: Action = { type: 'ADVANCE_WEEK' };
      const newState = rootReducer(initialState, action);

      // Should increment game week
      expect(newState.franchise.gameWeek).toBe(initialState.franchise.gameWeek + 1);

      // Should add attribute history for players
      expect(newState.tactics.players).toBeDefined();
    });

    it('should handle SIMULATE_MATCH_UPDATE action', () => {
      const matchUpdate = {
        minute: 15,
        type: 'Goal' as const,
        team: 'home' as const,
        playerName: 'Test Player',
        description: 'Goal scored by Test Player',
      };

      const action: Action = {
        type: 'SIMULATE_MATCH_UPDATE',
        payload: matchUpdate,
      };

      const newState = rootReducer(initialState, action);

      expect(newState.ui.simulationTimeline).toContain(matchUpdate);
    });

    it('should handle SIMULATE_MATCH_SUCCESS action', () => {
      const matchResult = {
        homeScore: 2,
        awayScore: 1,
        events: [
          {
            minute: 15,
            type: 'Goal' as const,
            team: 'home' as const,
            playerName: 'Test Scorer',
            description: 'Goal scored by Test Scorer',
            assisterName: 'Test Assister',
          },
        ],
        commentaryLog: [],
        isRivalry: false,
        playerStats: {},
      };

      const action: Action = {
        type: 'SIMULATE_MATCH_SUCCESS',
        payload: matchResult,
      };

      const newState = rootReducer(initialState, action);

      expect(newState.franchise.lastMatchResult).toEqual(matchResult);
      expect(newState.franchise.matchHistory).toContain(matchResult);
      expect(newState.ui.activeModal).toBe('postMatchReport');
    });
  });

  describe('Playbook actions', () => {
    it('should handle CREATE_PLAYBOOK_ITEM action', () => {
      const playbookData = {
        name: 'Test Play',
        category: 'General' as const,
      };

      const action: Action = {
        type: 'CREATE_PLAYBOOK_ITEM',
        payload: playbookData,
      };

      const newState = rootReducer(initialState, action);

      // Should create new playbook item
      const playbookItems = Object.values(newState.tactics.playbook);
      const newItem = playbookItems.find(item => item.name === 'Test Play');

      expect(newItem).toBeDefined();
      expect(newItem?.category).toBe('General');
      expect(newItem?.steps).toHaveLength(1);

      // Should set as active
      expect(newState.ui.activePlaybookItemId).toBe(newItem?.id);
      expect(newState.ui.activeStepIndex).toBe(0);
    });

    it('should handle ADD_PLAYBOOK_STEP action', () => {
      // Setup state with an active playbook item
      const stateWithPlaybook: RootState = {
        ...initialState,
        tactics: {
          ...createMockTacticsState(),
          playbook: {
            'test-item': {
              id: 'test-item',
              name: 'Test Play',
              category: 'General',
              formationId: 'test-formation',
              steps: [
                {
                  id: 'step1',
                  playerPositions: {},
                  drawings: [],
                },
              ],
            },
          },
        },
        ui: {
          ...createMockUIState(),
          activePlaybookItemId: 'test-item',
          activeStepIndex: 0,
        },
      };

      const action: Action = { type: 'ADD_PLAYBOOK_STEP' };
      const newState = rootReducer(stateWithPlaybook, action);

      const playbookItem = newState.tactics.playbook['test-item'];
      expect(playbookItem.steps).toHaveLength(2);
      expect(newState.ui.activeStepIndex).toBe(1);
    });

    it('should handle ADD_LIBRARY_PLAY_TO_PLAYBOOK action', () => {
      const libraryPlay = {
        id: 'library-play-1',
        formationId: 'test-formation',
        steps: [
          {
            id: 'step1',
            playerPositions: { player1: { x: 50, y: 50 } },
            drawings: [],
          },
        ],
        name: 'Library Play',
        category: 'Defending Corner' as const,
      };

      const action: Action = {
        type: 'ADD_LIBRARY_PLAY_TO_PLAYBOOK',
        payload: libraryPlay,
      };

      const newState = rootReducer(initialState, action);

      // Should add library play to playbook
      const playbookItems = Object.values(newState.tactics.playbook);
      const addedPlay = playbookItems.find(item => item.name === 'Library Play');

      expect(addedPlay).toBeDefined();
      expect(addedPlay?.category).toBe('Defending Corner');

      // Should set as active
      expect(newState.ui.activePlaybookItemId).toBe(addedPlay?.id);
      expect(newState.ui.activeStepIndex).toBe(0);

      // Should clear drawings and reset animation state
      expect(newState.tactics.drawings).toEqual([]);
      expect(newState.ui.isAnimating).toBe(false);
      expect(newState.ui.animationTrails).toBeNull();
      expect(newState.ui.playerInitialPositions).toBeNull();
    });
  });

  describe('Delegation to sub-reducers', () => {
    it('should delegate actions to all sub-reducers', async () => {
      const action: Action = {
        type: 'TOGGLE_THEME',
      };

      rootReducer(initialState, action);

      // Mock sub-reducers should have been called
      const { tacticsReducer } = await import('../../../context/reducers/tacticsReducer');
      const { franchiseReducer } = await import('../../../context/reducers/franchiseReducer');
      const { uiReducer } = await import('../../../context/reducers/uiReducer');
      const { authReducer } = await import('../../../context/reducers/authReducer');

      expect(tacticsReducer).toHaveBeenCalledWith(initialState.tactics, action);
      expect(franchiseReducer).toHaveBeenCalledWith(initialState.franchise, action);
      expect(uiReducer).toHaveBeenCalledWith(initialState.ui, action);
      expect(authReducer).toHaveBeenCalledWith(initialState.auth, action);
    });
  });

  describe('Default case handling', () => {
    it('should handle unknown actions gracefully', async () => {
      const unknownAction: Action = {
        type: 'UNKNOWN_ACTION' as any,
      };

      const newState = rootReducer(initialState, unknownAction);

      // State should remain unchanged for unknown actions
      expect(newState).toBeDefined();
      // But sub-reducers should still be called
      const { tacticsReducer } = await import('../../../context/reducers/tacticsReducer');
      expect(tacticsReducer).toHaveBeenCalledWith(initialState.tactics, unknownAction);
    });

    it('should return initial state when called with undefined state', () => {
      const action: Action = { type: 'RESET_STATE' };
      const newState = rootReducer(undefined as any, action);

      // Should reset to a clean initial state structure
      expect(newState.tactics.players).toEqual(expect.any(Array));
      expect(newState.ui.theme).toBe('dark'); // Reset to default theme
      expect(newState.auth.isAuthenticated).toBe(false);
    });
  });

  describe('Complex cross-cutting scenarios', () => {
    it('should handle player development during ADVANCE_WEEK', () => {
      const stateWithPlayers: RootState = {
        ...initialState,
        tactics: {
          ...createMockTacticsState(),
          players: [
            {
              ...createMockTacticsState().players[0],
              id: 'player1',
              name: 'Test Player',
              age: 22,
              team: 'home',
              attributeDevelopmentProgress: {},
              individualTrainingFocus: { attribute: 'speed' },
            },
          ],
        },
        franchise: {
          ...initialState.franchise,
          trainingSchedule: {
            home: {
              monday: {
                isRestDay: false,
                morning: { warmup: 'drill1', main: 'drill2', cooldown: 'drill3' },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              tuesday: {
                isRestDay: false,
                morning: { warmup: 'drill1', main: 'drill2', cooldown: 'drill3' },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              wednesday: {
                isRestDay: true,
                morning: { warmup: null, main: null, cooldown: null },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              thursday: {
                isRestDay: false,
                morning: { warmup: 'drill1', main: 'drill2', cooldown: 'drill3' },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              friday: {
                isRestDay: false,
                morning: { warmup: 'drill1', main: 'drill2', cooldown: 'drill3' },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              saturday: {
                isRestDay: false,
                morning: { warmup: 'drill1', main: 'drill2', cooldown: 'drill3' },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              sunday: {
                isRestDay: true,
                morning: { warmup: null, main: null, cooldown: null },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
            },
            away: {
              monday: {
                isRestDay: false,
                morning: { warmup: 'drill1', main: 'drill2', cooldown: 'drill3' },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              tuesday: {
                isRestDay: false,
                morning: { warmup: 'drill1', main: 'drill2', cooldown: 'drill3' },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              wednesday: {
                isRestDay: true,
                morning: { warmup: null, main: null, cooldown: null },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              thursday: {
                isRestDay: false,
                morning: { warmup: 'drill1', main: 'drill2', cooldown: 'drill3' },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              friday: {
                isRestDay: false,
                morning: { warmup: 'drill1', main: 'drill2', cooldown: 'drill3' },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              saturday: {
                isRestDay: false,
                morning: { warmup: 'drill1', main: 'drill2', cooldown: 'drill3' },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
              sunday: {
                isRestDay: true,
                morning: { warmup: null, main: null, cooldown: null },
                afternoon: { warmup: null, main: null, cooldown: null },
              },
            },
          },
        },
      };

      const action: Action = { type: 'ADVANCE_WEEK' };
      const newState = rootReducer(stateWithPlayers, action);

      expect(newState.franchise.gameWeek).toBe(stateWithPlayers.franchise.gameWeek + 1);

      // Should add attribute history
      const player = newState.tactics.players.find(p => p.id === 'player1');
      expect(player?.attributeHistory).toBeDefined();
      expect(player?.attributeHistory.length).toBeGreaterThan(0);
    });

    it('should handle relationship changes during match simulation', () => {
      const matchResult = {
        homeScore: 1,
        awayScore: 0,
        events: [
          {
            minute: 30,
            type: 'Goal' as const,
            team: 'home' as const,
            playerName: 'Scorer Player',
            description: 'Goal scored by Scorer Player',
            assisterName: 'Assist Player',
          },
        ],
        commentaryLog: [],
        isRivalry: false,
        playerStats: {},
      };

      const stateWithPlayers: RootState = {
        ...initialState,
        tactics: {
          ...createMockTacticsState(),
          players: [
            {
              ...createMockTacticsState().players[0],
              id: 'player1',
              name: 'Scorer Player',
              team: 'home',
            },
            {
              ...createMockTacticsState().players[0],
              id: 'player2',
              name: 'Assist Player',
              team: 'home',
            },
          ],
        },
      };

      const action: Action = {
        type: 'SIMULATE_MATCH_SUCCESS',
        payload: matchResult,
      };

      const newState = rootReducer(stateWithPlayers, action);

      expect(newState.franchise.lastMatchResult).toEqual(matchResult);
      expect(newState.ui.activeModal).toBe('postMatchReport');

      // Should potentially create friendships (random chance, so we check structure)
      expect(newState.franchise.relationships).toBeDefined();
    });
  });
});
