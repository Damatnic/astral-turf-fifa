/**
 * History Timeline Component
 *
 * Visual timeline showing undo/redo history with:
 * - Past states (can undo to)
 * - Current state (highlighted)
 * - Future states (can redo to)
 * - Click to jump to any state
 * - Keyboard shortcut hints
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Redo2, History, RotateCcw } from 'lucide-react';
import type { HistoryState } from '../../hooks/useFormationHistory';

export interface HistoryTimelineProps {
  timeline: HistoryState[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onJumpToState: (index: number) => void;
  onClearHistory: () => void;
  className?: string;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  timeline,
  currentIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onJumpToState,
  onClearHistory,
  className = '',
}) => {
  // Format timestamp for display
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 1000) {
      return 'just now';
    }
    if (diff < 60000) {
      return `${Math.floor(diff / 1000)}s ago`;
    }
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    }
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get action description from state comparison
  const getActionDescription = (state: HistoryState, index: number): string => {
    if (index === 0) {
      return 'Initial state';
    }

    const prevState = timeline[index - 1];

    // Check what changed
    const playersChanged = JSON.stringify(state.players) !== JSON.stringify(prevState.players);
    const formationChanged = state.formation?.name !== prevState.formation?.name;
    const drawingsChanged = state.drawings.length !== prevState.drawings.length;

    if (formationChanged) {
      return `Formation: ${state.formation?.name || 'Custom'}`;
    }
    if (playersChanged) {
      return 'Player positions';
    }
    if (drawingsChanged) {
      if (state.drawings.length > prevState.drawings.length) {
        return 'Added drawing';
      }
      return 'Removed drawing';
    }

    return 'Tactical change';
  };

  return (
    <div
      className={`bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">History</h3>
          <span className="text-xs text-slate-400">
            {currentIndex + 1} / {timeline.length}
          </span>
        </div>

        <button
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center space-x-1"
          title="Clear history"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 p-3 border-b border-slate-700 bg-slate-800/50">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all ${
            canUndo
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
          <span className="text-sm font-medium">Undo</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-slate-900/50 rounded border border-slate-600">
            Ctrl+Z
          </kbd>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all ${
            canRedo
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
          <span className="text-sm font-medium">Redo</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-slate-900/50 rounded border border-slate-600">
            Ctrl+⇧+Z
          </kbd>
        </button>
      </div>

      {/* Timeline */}
      <div className="max-h-64 overflow-y-auto p-2 space-y-1">
        <AnimatePresence>
          {timeline.map((state, index) => {
            const isCurrent = index === currentIndex;
            const isPast = index < currentIndex;

            return (
              <motion.button
                key={state.timestamp}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onClick={() => onJumpToState(index)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400'
                    : isPast
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isCurrent ? 'bg-white' : isPast ? 'bg-blue-400' : 'bg-slate-600'
                        }`}
                      />
                      <span className="text-sm font-medium truncate">
                        {getActionDescription(state, index)}
                      </span>
                    </div>
                    <div className="text-xs opacity-70 ml-4 mt-0.5">
                      {formatTime(state.timestamp)}
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded">Current</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {timeline.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No history yet</p>
            <p className="text-xs mt-1">Make some tactical changes</p>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="p-3 border-t border-slate-700 bg-slate-800/30">
        <div className="text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>Undo</span>
            <kbd className="px-1.5 py-0.5 bg-slate-900/50 rounded border border-slate-600">
              Ctrl+Z
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Redo</span>
            <div className="space-x-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900/50 rounded border border-slate-600">
                Ctrl+Shift+Z
              </kbd>
              <span className="text-slate-600">or</span>
              <kbd className="px-1.5 py-0.5 bg-slate-900/50 rounded border border-slate-600">
                Ctrl+Y
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
