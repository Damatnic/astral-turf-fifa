import React, { createContext, useReducer, useEffect, type Dispatch } from 'react';
import { produce } from 'immer';
import type { RootState, Action, TacticsState, FranchiseState, UIState, AuthState } from '../types';
import { INITIAL_STATE, APP_VERSION } from '../constants';
import { rootReducer } from './reducers/rootReducer';
import { TacticsContext } from './TacticsContext';
import { FranchiseContext } from './FranchiseContext';
import { UIContext } from './UIContext';
import { AuthContext } from './AuthContext';
import { authService } from '../services/authService';
import { ChallengeProvider } from './ChallengeContext';

export const cleanStateForSaving = (state: RootState): object => {
    const stateToSave = produce(state, draft => {
        // Update playbook step with current positions before saving
        if (draft.ui.activePlaybookItemId && draft.ui.activeStepIndex !== null) {
            const activeItem = draft.tactics.playbook[draft.ui.activePlaybookItemId];
            if (activeItem && activeItem.steps[draft.ui.activeStepIndex]) {
                const activeStep = activeItem.steps[draft.ui.activeStepIndex];
                activeStep.playerPositions = draft.tactics.players.reduce((acc, p) => {
                    acc[p.id] = p.position;
                    return acc;
                }, {} as Record<string, { x: number; y: number }>);
                activeStep.drawings = draft.tactics.drawings;
            }
        }

        // Remove transient UI state properties
        const transientUIKeys: (keyof RootState['ui'])[] = [
            'activeModal', 'isLoadingAI', 'editingPlayerId', 'playerToCompareId', 'aiComparisonResult', 'isComparingAI',
            'slotActionMenuData', 'isAnimating', 'playerInitialPositions', 'animationTrails', 'isSuggestingFormation',
            'aiSuggestedFormation', 'chatHistory', 'isChatProcessing', 'highlightedByAIPlayerIds', 'isExportingLineup',
            'isPresentationMode', 'notifications', 'rosterSearchQuery', 'rosterRoleFilters', 'isGridVisible', 'playbookCategories',
            'isFormationStrengthVisible', 'isLoadingOppositionReport', 'oppositionReport', 'advancedRosterFilters',
            'isSimulatingMatch', 'simulationTimeline', 'isLoadingPostMatchReport', 'postMatchReport',
            'isLoadingPressConference', 'pressConferenceData', 'isLoadingAISubSuggestion', 'aiSubSuggestionData',
            'isScoutingPlayer', 'scoutedPlayerId', 'scoutReport', 'isLoadingConversation', 'playerConversationData',
        ];
        transientUIKeys.forEach(key => delete (draft.ui as any)[key]);

        const transientFranchiseKeys: (keyof RootState['franchise'])[] = ['negotiationData', 'lastMatchResult'];
        transientFranchiseKeys.forEach(key => delete (draft.franchise as any)[key]);
    });

    // Don't save auth state
    const { auth, ...restOfState } = stateToSave;
    return { ...restOfState, version: APP_VERSION };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(rootReducer, INITIAL_STATE);

  useEffect(() => {
    // Check for existing authentication first
    const currentUser = authService.getCurrentUserSync();
    if (currentUser) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: currentUser });
    }

    try {
      const savedStateJSON = localStorage.getItem('astralTurfActiveState');
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState.version === APP_VERSION) {
            dispatch({ type: 'LOAD_STATE', payload: savedState as RootState });
        } else {
            // // console.warn(`Saved state version (${savedState.version}) does not match app version (${APP_VERSION}). Discarding saved state.`);
            localStorage.removeItem('astralTurfActiveState');
        }
      }
    } catch (_error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  // Animation loop logic
  useEffect(() => {
    if (state.ui.isAnimating && !state.ui.isPaused && state.ui.activePlaybookItemId) {
      const activeItem = state.tactics.playbook[state.ui.activePlaybookItemId];
      const currentStepIndex = state.ui.activeStepIndex || 0;

      if (activeItem && currentStepIndex < activeItem.steps.length - 1) {
        const timer = setTimeout(() => {
          dispatch({ type: 'SET_ACTIVE_STEP', payload: currentStepIndex + 1 });
        }, 2000); // 2 seconds per step

        return () => clearTimeout(timer);
      } else if (currentStepIndex >= activeItem.steps.length - 1) {
        // Animation finished
        dispatch({ type: 'RESET_ANIMATION' });
      }
    }
  }, [state.ui.isAnimating, state.ui.isPaused, state.ui.activeStepIndex, state.ui.activePlaybookItemId]);

  useEffect(() => {
    try {
      if (state.ui.activeSaveSlotId) {
        const stateToSave = cleanStateForSaving(state);
        localStorage.setItem(`astralTurfSave_${state.ui.activeSaveSlotId}`, JSON.stringify(stateToSave));

        const slots = JSON.parse(localStorage.getItem('astralTurfSaveSlots') || '{}');
        if (slots[state.ui.activeSaveSlotId]) {
            slots[state.ui.activeSaveSlotId].lastSaved = new Date().toISOString();
            localStorage.setItem('astralTurfSaveSlots', JSON.stringify(slots));
        }
      }
      const activeStateToSave = cleanStateForSaving(state);
      localStorage.setItem('astralTurfActiveState', JSON.stringify(activeStateToSave));
    } catch (_error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [state]);

  return (
    <AuthContext.Provider value={{ authState: state.auth, dispatch }}>
      <TacticsContext.Provider value={{ tacticsState: state.tactics, dispatch }}>
          <FranchiseContext.Provider value={{ franchiseState: state.franchise, dispatch }}>
              <UIContext.Provider value={{ uiState: state.ui, dispatch }}>
                  <ChallengeProvider>
                      {children}
                  </ChallengeProvider>
              </UIContext.Provider>
          </FranchiseContext.Provider>
      </TacticsContext.Provider>
    </AuthContext.Provider>
  );
};
