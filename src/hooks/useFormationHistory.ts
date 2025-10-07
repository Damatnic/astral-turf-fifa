/**
 * Formation History Hook - Undo/Redo System
 *
 * Provides undo/redo functionality for tactical changes including:
 * - Player position changes
 * - Formation changes
 * - Drawing additions/removals
 *
 * Features:
 * - Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
 * - Configurable history limit
 * - State snapshotting
 * - Time travel debugging support
 */

import { useCallback, useEffect, useReducer } from 'react';
import type { Player } from '../types';
import type { DrawingShape } from '../types/ui';
import type { Formation } from '../types/match';

// Maximum number of history states to keep
const MAX_HISTORY_SIZE = 50;

export interface HistoryState {
  formation: Formation | null;
  players: Player[];
  drawings: DrawingShape[];
  timestamp: number;
}

interface HistoryStore {
  past: HistoryState[];
  present: HistoryState | null;
  future: HistoryState[];
}

type HistoryAction =
  | { type: 'PUSH'; payload: HistoryState }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' }
  | { type: 'JUMP'; payload: number };

function historyReducer(state: HistoryStore, action: HistoryAction): HistoryStore {
  switch (action.type) {
    case 'PUSH': {
      const newPresent = action.payload;

      // Don't add duplicate states (same timestamp within 100ms)
      if (state.present && Math.abs(state.present.timestamp - newPresent.timestamp) < 100) {
        return state;
      }

      const newPast = state.present
        ? [...state.past, state.present].slice(-MAX_HISTORY_SIZE)
        : state.past;

      return {
        past: newPast,
        present: newPresent,
        future: [], // Clear future when new action is taken
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) {
        return state;
      }

      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: state.present ? [state.present, ...state.future] : state.future,
      };
    }

    case 'REDO': {
      if (state.future.length === 0) {
        return state;
      }

      const next = state.future[0];
      const newFuture = state.future.slice(1);

      return {
        past: state.present ? [...state.past, state.present] : state.past,
        present: next,
        future: newFuture,
      };
    }

    case 'CLEAR': {
      return {
        past: [],
        present: state.present,
        future: [],
      };
    }

    case 'JUMP': {
      const index = action.payload;
      const allStates = [...state.past, state.present!, ...state.future];

      if (index < 0 || index >= allStates.length) {
        return state;
      }

      const targetState = allStates[index];
      const newPast = allStates.slice(0, index);
      const newFuture = allStates.slice(index + 1);

      return {
        past: newPast,
        present: targetState,
        future: newFuture,
      };
    }

    default:
      return state;
  }
}

export interface UseFormationHistoryOptions {
  maxHistorySize?: number;
  enableKeyboardShortcuts?: boolean;
  onUndo?: (state: HistoryState) => void;
  onRedo?: (state: HistoryState) => void;
}

export interface UseFormationHistoryReturn {
  // History state
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  currentIndex: number;

  // Actions
  undo: () => void;
  redo: () => void;
  pushState: (state: Omit<HistoryState, 'timestamp'>) => void;
  clearHistory: () => void;
  jumpToState: (index: number) => void;

  // Current state
  currentState: HistoryState | null;

  // History timeline (for UI visualization)
  timeline: HistoryState[];
}

export function useFormationHistory(
  initialState: Omit<HistoryState, 'timestamp'>,
  options: UseFormationHistoryOptions = {},
): UseFormationHistoryReturn {
  const { enableKeyboardShortcuts = true, onUndo, onRedo } = options;

  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: { ...initialState, timestamp: Date.now() },
    future: [],
  });

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (history.past.length > 0) {
          dispatch({ type: 'UNDO' });
          if (onUndo && history.past.length > 0) {
            onUndo(history.past[history.past.length - 1]);
          }
        }
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      // Also support Ctrl+Y
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        if (history.future.length > 0) {
          dispatch({ type: 'REDO' });
          if (onRedo && history.future.length > 0) {
            onRedo(history.future[0]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, history.past, history.future, onUndo, onRedo]);

  const pushState = useCallback((state: Omit<HistoryState, 'timestamp'>) => {
    dispatch({
      type: 'PUSH',
      payload: { ...state, timestamp: Date.now() },
    });
  }, []);

  const undo = useCallback(() => {
    if (history.past.length > 0) {
      dispatch({ type: 'UNDO' });
      if (onUndo) {
        onUndo(history.past[history.past.length - 1]);
      }
    }
  }, [history.past, onUndo]);

  const redo = useCallback(() => {
    if (history.future.length > 0) {
      dispatch({ type: 'REDO' });
      if (onRedo) {
        onRedo(history.future[0]);
      }
    }
  }, [history.future, onRedo]);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const jumpToState = useCallback((index: number) => {
    dispatch({ type: 'JUMP', payload: index });
  }, []);

  // Calculate timeline
  const timeline = [
    ...history.past,
    ...(history.present ? [history.present] : []),
    ...history.future,
  ];

  const currentIndex = history.past.length;

  return {
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    historyLength: timeline.length,
    currentIndex,
    undo,
    redo,
    pushState,
    clearHistory,
    jumpToState,
    currentState: history.present,
    timeline,
  };
}

/**
 * Helper function to create a history state snapshot
 */
export function createHistorySnapshot(
  formation: Formation | null,
  players: Player[],
  drawings: DrawingShape[],
): Omit<HistoryState, 'timestamp'> {
  return {
    formation: formation ? { ...formation } : null,
    players: players.map(p => ({ ...p })),
    drawings: drawings.map(d => ({ ...d })),
  };
}

/**
 * Helper function to compare two history states
 */
export function areStatesEqual(state1: HistoryState | null, state2: HistoryState | null): boolean {
  if (!state1 || !state2) {
    return state1 === state2;
  }

  return (
    JSON.stringify(state1.formation) === JSON.stringify(state2.formation) &&
    JSON.stringify(state1.players) === JSON.stringify(state2.players) &&
    JSON.stringify(state1.drawings) === JSON.stringify(state2.drawings)
  );
}
