/**
 * Tactical Board UI State Reducer
 *
 * Consolidates 30+ useState hooks into a single, predictable state management system.
 * This improves performance, makes debugging easier, and reduces re-render complexity.
 */

import { Player } from '../types';
import { PlayerDisplayConfig } from '../components/tactics/PlayerDisplaySettings';

export type ViewMode = 'standard' | 'fullscreen' | 'presentation';
export type PositioningMode = 'snap' | 'free';

export interface ConflictData {
  sourcePlayer: Player;
  targetPlayer: Player;
  position: { x: number; y: number };
}

export interface UIState {
  // View Management
  viewMode: ViewMode;

  // Sidebar Visibility
  sidebars: {
    left: boolean;
    right: boolean;
  };

  // Feature Panels (Modals)
  panels: {
    formationTemplates: boolean;
    aiAssistant: boolean;
    tacticalPlaybook: boolean;
    analytics: boolean;
    aiAnalysis: boolean;
    aiIntelligence: boolean;
    dugout: boolean;
    challenges: boolean;
    collaboration: boolean;
    exportImport: boolean;
    keyboardShortcuts: boolean;
    history: boolean;
    quickStart: boolean;
    playerInstructions: boolean;
  };

  // Display Overlays
  display: {
    heatMap: boolean;
    playerStats: boolean;
    chemistry: boolean;
    grid: boolean;
    formationStrength: boolean;
  };

  // Interaction State
  interaction: {
    selectedPlayer: Player | null;
    isDragging: boolean;
    isPresenting: boolean;
    positioningMode: PositioningMode;
    swapMode: {
      enabled: boolean;
      sourcePlayerId: string | null;
    };
  };

  // Conflict Resolution
  conflict: {
    showMenu: boolean;
    data: ConflictData | null;
  };

  // Expanded Player Card
  expandedCard: {
    visible: boolean;
    position: { x: number; y: number };
  };

  // Player Display Configuration
  playerDisplayConfig: PlayerDisplayConfig;

  // AI Minimized State
  aiMinimized: boolean;
}

export type UIAction =
  // View Management
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'ENTER_FULLSCREEN' }
  | { type: 'EXIT_FULLSCREEN' }
  | { type: 'TOGGLE_PRESENTATION_MODE' }

  // Sidebar Management
  | { type: 'TOGGLE_LEFT_SIDEBAR' }
  | { type: 'TOGGLE_RIGHT_SIDEBAR' }
  | { type: 'SET_LEFT_SIDEBAR'; payload: boolean }
  | { type: 'SET_RIGHT_SIDEBAR'; payload: boolean }
  | { type: 'CLOSE_ALL_SIDEBARS' }

  // Panel Management
  | { type: 'TOGGLE_PANEL'; payload: keyof UIState['panels'] }
  | { type: 'OPEN_PANEL'; payload: keyof UIState['panels'] }
  | { type: 'CLOSE_PANEL'; payload: keyof UIState['panels'] }
  | { type: 'CLOSE_ALL_PANELS' }

  // Display Overlays
  | { type: 'TOGGLE_DISPLAY'; payload: keyof UIState['display'] }
  | { type: 'SET_DISPLAY'; payload: { key: keyof UIState['display']; value: boolean } }
  | { type: 'HIDE_ALL_OVERLAYS' }

  // Interaction
  | { type: 'SELECT_PLAYER'; payload: Player | null }
  | { type: 'SET_DRAGGING'; payload: boolean }
  | { type: 'SET_PRESENTING'; payload: boolean }
  | { type: 'SET_POSITIONING_MODE'; payload: PositioningMode }
  | { type: 'TOGGLE_POSITIONING_MODE' }
  | { type: 'SET_SWAP_MODE'; payload: { enabled: boolean; playerId: string } }
  | { type: 'COMPLETE_SWAP' }

  // Conflict Resolution
  | { type: 'SHOW_CONFLICT_MENU'; payload: ConflictData }
  | { type: 'HIDE_CONFLICT_MENU' }
  | { type: 'RESOLVE_CONFLICT' }

  // Expanded Player Card
  | { type: 'SHOW_EXPANDED_CARD'; payload: { x: number; y: number } }
  | { type: 'HIDE_EXPANDED_CARD' }

  // Player Display Config
  | { type: 'UPDATE_PLAYER_DISPLAY_CONFIG'; payload: Partial<PlayerDisplayConfig> }

  // AI State
  | { type: 'TOGGLE_AI_MINIMIZED' }
  | { type: 'SET_AI_MINIMIZED'; payload: boolean }

  // Batch Updates
  | { type: 'BATCH_UPDATE'; payload: Partial<UIState> }

  // Reset
  | { type: 'RESET_UI_STATE' };

export const getInitialUIState = (isMobile: boolean = false): UIState => ({
  viewMode: 'standard',

  sidebars: {
    left: !isMobile,
    right: !isMobile,
  },

  panels: {
    formationTemplates: false,
    aiAssistant: false,
    tacticalPlaybook: false,
    analytics: false,
    aiAnalysis: false,
    aiIntelligence: false,
    dugout: false,
    challenges: false,
    collaboration: false,
    exportImport: false,
    keyboardShortcuts: false,
    history: false,
    quickStart: false,
    playerInstructions: false,
  },

  display: {
    heatMap: false,
    playerStats: false,
    chemistry: false,
    grid: false,
    formationStrength: false,
  },

  interaction: {
    selectedPlayer: null,
    isDragging: false,
    isPresenting: false,
    positioningMode: 'snap',
    swapMode: {
      enabled: false,
      sourcePlayerId: null,
    },
  },

  conflict: {
    showMenu: false,
    data: null,
  },

  expandedCard: {
    visible: false,
    position: { x: 0, y: 0 },
  },

  playerDisplayConfig: {
    showNames: true,
    showNumbers: true,
    showStats: false,
    showStamina: true,
    showMorale: true,
    showAvailability: true,
    iconType: 'circle',
    namePosition: 'below',
    size: 'medium',
  },

  aiMinimized: false,
});

export const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    // View Management
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'ENTER_FULLSCREEN':
      return { ...state, viewMode: 'fullscreen' };

    case 'EXIT_FULLSCREEN':
      return { ...state, viewMode: 'standard' };

    case 'TOGGLE_PRESENTATION_MODE':
      return {
        ...state,
        viewMode: state.viewMode === 'presentation' ? 'standard' : 'presentation',
        interaction: {
          ...state.interaction,
          isPresenting: state.viewMode !== 'presentation',
        },
      };

    // Sidebar Management
    case 'TOGGLE_LEFT_SIDEBAR':
      return {
        ...state,
        sidebars: { ...state.sidebars, left: !state.sidebars.left },
      };

    case 'TOGGLE_RIGHT_SIDEBAR':
      return {
        ...state,
        sidebars: { ...state.sidebars, right: !state.sidebars.right },
      };

    case 'SET_LEFT_SIDEBAR':
      return {
        ...state,
        sidebars: { ...state.sidebars, left: action.payload },
      };

    case 'SET_RIGHT_SIDEBAR':
      return {
        ...state,
        sidebars: { ...state.sidebars, right: action.payload },
      };

    case 'CLOSE_ALL_SIDEBARS':
      return {
        ...state,
        sidebars: { left: false, right: false },
      };

    // Panel Management
    case 'TOGGLE_PANEL':
      return {
        ...state,
        panels: {
          ...state.panels,
          [action.payload]: !state.panels[action.payload],
        },
      };

    case 'OPEN_PANEL':
      return {
        ...state,
        panels: {
          ...state.panels,
          [action.payload]: true,
        },
      };

    case 'CLOSE_PANEL':
      return {
        ...state,
        panels: {
          ...state.panels,
          [action.payload]: false,
        },
      };

    case 'CLOSE_ALL_PANELS':
      return {
        ...state,
        panels: {
          formationTemplates: false,
          aiAssistant: false,
          tacticalPlaybook: false,
          analytics: false,
          aiAnalysis: false,
          aiIntelligence: false,
          dugout: false,
          challenges: false,
          collaboration: false,
          exportImport: false,
          keyboardShortcuts: false,
          history: false,
          quickStart: false,
          playerInstructions: false,
        },
      };

    // Display Overlays
    case 'TOGGLE_DISPLAY':
      return {
        ...state,
        display: {
          ...state.display,
          [action.payload]: !state.display[action.payload],
        },
      };

    case 'SET_DISPLAY':
      return {
        ...state,
        display: {
          ...state.display,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'HIDE_ALL_OVERLAYS':
      return {
        ...state,
        display: {
          heatMap: false,
          playerStats: false,
          chemistry: false,
          grid: false,
          formationStrength: false,
        },
      };

    // Interaction
    case 'SELECT_PLAYER':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          selectedPlayer: action.payload,
        },
      };

    case 'SET_DRAGGING':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          isDragging: action.payload,
        },
      };

    case 'SET_PRESENTING':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          isPresenting: action.payload,
        },
      };

    case 'SET_POSITIONING_MODE':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          positioningMode: action.payload,
        },
      };

    case 'TOGGLE_POSITIONING_MODE':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          positioningMode: state.interaction.positioningMode === 'snap' ? 'free' : 'snap',
        },
      };

    case 'SET_SWAP_MODE':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          swapMode: {
            enabled: action.payload.enabled,
            sourcePlayerId: action.payload.playerId,
          },
        },
      };

    case 'COMPLETE_SWAP':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          swapMode: {
            enabled: false,
            sourcePlayerId: null,
          },
        },
      };

    // Conflict Resolution
    case 'SHOW_CONFLICT_MENU':
      return {
        ...state,
        conflict: {
          showMenu: true,
          data: action.payload,
        },
      };

    case 'HIDE_CONFLICT_MENU':
      return {
        ...state,
        conflict: {
          showMenu: false,
          data: null,
        },
      };

    case 'RESOLVE_CONFLICT':
      return {
        ...state,
        conflict: {
          showMenu: false,
          data: null,
        },
      };

    // Expanded Player Card
    case 'SHOW_EXPANDED_CARD':
      return {
        ...state,
        expandedCard: {
          visible: true,
          position: action.payload,
        },
      };

    case 'HIDE_EXPANDED_CARD':
      return {
        ...state,
        expandedCard: {
          visible: false,
          position: { x: 0, y: 0 },
        },
      };

    // Player Display Config
    case 'UPDATE_PLAYER_DISPLAY_CONFIG':
      return {
        ...state,
        playerDisplayConfig: {
          ...state.playerDisplayConfig,
          ...action.payload,
        },
      };

    // AI State
    case 'TOGGLE_AI_MINIMIZED':
      return {
        ...state,
        aiMinimized: !state.aiMinimized,
      };

    case 'SET_AI_MINIMIZED':
      return {
        ...state,
        aiMinimized: action.payload,
      };

    // Batch Updates
    case 'BATCH_UPDATE':
      return {
        ...state,
        ...action.payload,
      };

    // Reset
    case 'RESET_UI_STATE':
      return getInitialUIState();

    default:
      return state;
  }
};
