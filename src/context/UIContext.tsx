
import React, { createContext, useReducer, useContext, type ReactNode, type Dispatch, useCallback } from 'react';
import type {
  UIState,
  Action,
  ModalType,
  Notification,
  DrawingTool,
  AppTheme,
  AIPersonality,
  SlotActionMenuData,
  TransferMarketFilters,
  AdvancedRosterFilters,
  PositionRole,
  TeamKit,
  TeamView,
} from '../types';
import { INITIAL_STATE } from '../constants';
import { uiReducer } from './reducers/uiReducer';

interface UIContextType {
  uiState: UIState;
  dispatch: Dispatch<Action>;

  // Modal management
  openModal: (modal: ModalType) => void;
  closeModal: () => void;

  // Notification management
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;

  // Theme management
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;

  // Drawing management
  setDrawingTool: (tool: DrawingTool) => void;
  setDrawingColor: (color: string) => void;
  toggleGridVisibility: () => void;
  toggleFormationStrengthVisibility: () => void;
  setPositioningMode: (mode: 'free' | 'snap') => void;

  // Player management UI
  setEditingPlayerId: (playerId: string | null) => void;
  setComparePlayerId: (playerId: string | null) => void;
  setSelectedPlayerId: (playerId: string | null) => void;

  // Slot action menu
  openSlotActionMenu: (data: SlotActionMenuData) => void;
  closeSlotActionMenu: () => void;

  // Team context
  setActiveTeamContext: (context: TeamView) => void;

  // Kit management
  setTeamKit: (team: 'home' | 'away', kit: Partial<TeamKit>) => void;

  // Filtering
  setRosterSearchQuery: (query: string) => void;
  toggleRosterRoleFilter: (role: PositionRole) => void;
  setAdvancedRosterFilters: (filters: Partial<AdvancedRosterFilters>) => void;
  clearRosterFilters: () => void;
  setTransferMarketFilter: (filter: keyof TransferMarketFilters, value: unknown) => void;

  // AI settings
  setAIPersonality: (personality: AIPersonality) => void;

  // Animation controls
  enterPresentationMode: () => void;
  exitPresentationMode: () => void;
  startAnimation: () => void;
  pauseAnimation: () => void;
  resetAnimation: () => void;

  // Tutorial
  startTutorial: () => void;
  endTutorial: () => void;
  setTutorialStep: (step: number) => void;

  // Save management
  setActiveSaveSlot: (slotId: string | null) => void;
  createSaveSlot: (id: string, name: string) => void;
  deleteSaveSlot: (slotId: string) => void;

  // Export
  startExportLineup: () => void;
  finishExportLineup: () => void;

  isLoading: boolean;
  error: string | null;
}

// Keep the simple context for compatibility with existing AppProvider
export const UIContext = createContext<{ uiState: UIState; dispatch: Dispatch<Action> }>({
  uiState: INITIAL_STATE.ui,
  dispatch: () => null,
});

// Enhanced context for individual use
const UIEnhancedContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [uiState, dispatch] = useReducer(uiReducer, INITIAL_STATE.ui);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Modal management
  const openModal = useCallback((modal: ModalType) => {
    dispatch({ type: 'OPEN_MODAL', payload: modal });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  // Notification management
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  // Theme management
  const toggleTheme = useCallback(() => {
    dispatch({ type: 'TOGGLE_THEME' });
  }, []);

  const setTheme = useCallback((theme: AppTheme) => {
    // This would require a new action type or handle in existing reducer
    dispatch({ type: 'SET_THEME', payload: theme } as any);
  }, []);

  // Drawing management
  const setDrawingTool = useCallback((tool: DrawingTool) => {
    dispatch({ type: 'SET_DRAWING_TOOL', payload: tool });
  }, []);

  const setDrawingColor = useCallback((color: string) => {
    dispatch({ type: 'SET_DRAWING_COLOR', payload: color });
  }, []);

  const toggleGridVisibility = useCallback(() => {
    dispatch({ type: 'TOGGLE_GRID_VISIBILITY' });
  }, []);

  const toggleFormationStrengthVisibility = useCallback(() => {
    dispatch({ type: 'TOGGLE_FORMATION_STRENGTH_VISIBILITY' });
  }, []);

  const setPositioningMode = useCallback((mode: 'free' | 'snap') => {
    dispatch({ type: 'SET_POSITIONING_MODE', payload: mode });
  }, []);

  // Player management UI
  const setEditingPlayerId = useCallback((playerId: string | null) => {
    dispatch({ type: 'SET_EDITING_PLAYER_ID', payload: playerId });
  }, []);

  const setComparePlayerId = useCallback((playerId: string | null) => {
    dispatch({ type: 'SET_COMPARE_PLAYER_ID', payload: playerId });
  }, []);

  const setSelectedPlayerId = useCallback((playerId: string | null) => {
    dispatch({ type: 'SELECT_PLAYER', payload: playerId });
  }, []);

  // Slot action menu
  const openSlotActionMenu = useCallback((data: SlotActionMenuData) => {
    dispatch({ type: 'OPEN_SLOT_ACTION_MENU', payload: data });
  }, []);

  const closeSlotActionMenu = useCallback(() => {
    dispatch({ type: 'CLOSE_SLOT_ACTION_MENU' });
  }, []);

  // Team context
  const setActiveTeamContext = useCallback((context: TeamView) => {
    dispatch({ type: 'SET_ACTIVE_TEAM_CONTEXT', payload: context });
  }, []);

  // Kit management
  const setTeamKit = useCallback((team: 'home' | 'away', kit: Partial<TeamKit>) => {
    dispatch({ type: 'SET_TEAM_KIT', payload: { team, kit } });
  }, []);

  // Filtering
  const setRosterSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_ROSTER_SEARCH_QUERY', payload: query });
  }, []);

  const toggleRosterRoleFilter = useCallback((role: PositionRole) => {
    dispatch({ type: 'TOGGLE_ROSTER_ROLE_FILTER', payload: role });
  }, []);

  const setAdvancedRosterFilters = useCallback((filters: Partial<AdvancedRosterFilters>) => {
    dispatch({ type: 'SET_ADVANCED_ROSTER_FILTERS', payload: filters });
  }, []);

  const clearRosterFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_ROSTER_FILTERS' });
  }, []);

  const setTransferMarketFilter = useCallback((filter: keyof TransferMarketFilters, value: unknown) => {
    dispatch({ type: 'SET_TRANSFER_MARKET_FILTER', payload: { filter, value } });
  }, []);

  // AI settings
  const setAIPersonality = useCallback((personality: AIPersonality) => {
    dispatch({ type: 'SET_AI_PERSONALITY', payload: personality });
  }, []);

  // Animation controls
  const enterPresentationMode = useCallback(() => {
    dispatch({ type: 'ENTER_PRESENTATION_MODE' });
  }, []);

  const exitPresentationMode = useCallback(() => {
    dispatch({ type: 'EXIT_PRESENTATION_MODE' });
  }, []);

  const startAnimation = useCallback(() => {
    dispatch({ type: 'START_ANIMATION' });
  }, []);

  const pauseAnimation = useCallback(() => {
    dispatch({ type: 'PAUSE_ANIMATION' });
  }, []);

  const resetAnimation = useCallback(() => {
    dispatch({ type: 'RESET_ANIMATION' });
  }, []);

  // Tutorial
  const startTutorial = useCallback(() => {
    dispatch({ type: 'START_TUTORIAL' });
  }, []);

  const endTutorial = useCallback(() => {
    dispatch({ type: 'END_TUTORIAL' });
  }, []);

  const setTutorialStep = useCallback((step: number) => {
    dispatch({ type: 'SET_TUTORIAL_STEP', payload: step });
  }, []);

  // Save management
  const setActiveSaveSlot = useCallback((slotId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_SAVE_SLOT', payload: slotId });
  }, []);

  const createSaveSlot = useCallback((id: string, name: string) => {
    dispatch({ type: 'CREATE_SAVE_SLOT', payload: { id, name } });
  }, []);

  const deleteSaveSlot = useCallback((slotId: string) => {
    dispatch({ type: 'DELETE_SAVE_SLOT', payload: slotId });
  }, []);

  // Export
  const startExportLineup = useCallback(() => {
    dispatch({ type: 'EXPORT_LINEUP_START' });
  }, []);

  const finishExportLineup = useCallback(() => {
    dispatch({ type: 'EXPORT_LINEUP_FINISH' });
  }, []);

  const value = {
    uiState,
    dispatch,
    openModal,
    closeModal,
    addNotification,
    removeNotification,
    toggleTheme,
    setTheme,
    setDrawingTool,
    setDrawingColor,
    toggleGridVisibility,
    toggleFormationStrengthVisibility,
    setPositioningMode,
    setEditingPlayerId,
    setComparePlayerId,
    setSelectedPlayerId,
    openSlotActionMenu,
    closeSlotActionMenu,
    setActiveTeamContext,
    setTeamKit,
    setRosterSearchQuery,
    toggleRosterRoleFilter,
    setAdvancedRosterFilters,
    clearRosterFilters,
    setTransferMarketFilter,
    setAIPersonality,
    enterPresentationMode,
    exitPresentationMode,
    startAnimation,
    pauseAnimation,
    resetAnimation,
    startTutorial,
    endTutorial,
    setTutorialStep,
    setActiveSaveSlot,
    createSaveSlot,
    deleteSaveSlot,
    startExportLineup,
    finishExportLineup,
    isLoading,
    error,
  };

  return (
    <UIEnhancedContext.Provider value={value}>
      {children}
    </UIEnhancedContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIEnhancedContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
