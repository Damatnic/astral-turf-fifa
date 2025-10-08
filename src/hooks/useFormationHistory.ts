/**
 * Formation History Hook
 * 
 * Manages undo/redo functionality for formation changes
 * with keyboard shortcuts and auto-save capabilities
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Formation, Player } from '../types';

export interface FormationSnapshot {
  formation: Formation;
  players: Player[];
  timestamp: number;
  drawings?: any[]; // Drawing canvas data
}

export interface FormationHistoryOptions {
  maxHistorySize?: number;
  enableKeyboardShortcuts?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onUndo?: (snapshot: FormationSnapshot) => void;
  onRedo?: (snapshot: FormationSnapshot) => void;
  onSave?: (snapshot: FormationSnapshot) => void;
}

export interface FormationHistoryResult {
  history: FormationSnapshot[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  saveSnapshot: (snapshot: FormationSnapshot) => void;
  clearHistory: () => void;
  goToSnapshot: (index: number) => void;
}

/**
 * Create a formation snapshot
 */
export function createHistorySnapshot(
  formation: Formation,
  players: Player[],
  drawings: any[] = []
): FormationSnapshot {
  return {
    formation: JSON.parse(JSON.stringify(formation)),
    players: JSON.parse(JSON.stringify(players)),
    drawings: JSON.parse(JSON.stringify(drawings)),
    timestamp: Date.now(),
  };
}

/**
 * Formation history hook with undo/redo
 */
export function useFormationHistory(
  initialSnapshot: FormationSnapshot,
  options: FormationHistoryOptions = {}
): FormationHistoryResult {
  const {
    maxHistorySize = 50,
    enableKeyboardShortcuts = true,
    autoSave = false,
    autoSaveInterval = 30000, // 30 seconds
    onUndo,
    onRedo,
    onSave,
  } = options;

  const [history, setHistory] = useState<FormationSnapshot[]>([initialSnapshot]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Computed values
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  /**
   * Save a new snapshot
   */
  const saveSnapshot = useCallback((snapshot: FormationSnapshot) => {
    setHistory(prev => {
      // Remove any snapshots after current index (we're creating a new branch)
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new snapshot
      newHistory.push(snapshot);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(newHistory.length - maxHistorySize);
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, maxHistorySize - 1);
      return newIndex;
    });

    onSave?.(snapshot);
  }, [currentIndex, maxHistorySize, onSave]);

  /**
   * Undo to previous snapshot
   */
  const undo = useCallback(() => {
    if (!canUndo) return;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    
    const snapshot = history[newIndex];
    onUndo?.(snapshot);
  }, [canUndo, currentIndex, history, onUndo]);

  /**
   * Redo to next snapshot
   */
  const redo = useCallback(() => {
    if (!canRedo) return;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    
    const snapshot = history[newIndex];
    onRedo?.(snapshot);
  }, [canRedo, currentIndex, history, onRedo]);

  /**
   * Go to specific snapshot
   */
  const goToSnapshot = useCallback((index: number) => {
    if (index < 0 || index >= history.length) return;
    
    setCurrentIndex(index);
    
    const snapshot = history[index];
    if (index < currentIndex) {
      onUndo?.(snapshot);
    } else {
      onRedo?.(snapshot);
    }
  }, [history, currentIndex, onUndo, onRedo]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    const current = history[currentIndex];
    setHistory([current]);
    setCurrentIndex(0);
  }, [history, currentIndex]);

  /**
   * Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
   */
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Ctrl+Shift+Z or Cmd+Shift+Z - Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      
      // Ctrl+Y or Cmd+Y - Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, undo, redo]);

  /**
   * Auto-save functionality
   */
  useEffect(() => {
    if (!autoSave) return;

    const currentSnapshot = history[currentIndex];

    autoSaveTimerRef.current = setInterval(() => {
      // Save to localStorage
      try {
        localStorage.setItem('formation-autosave', JSON.stringify({
          snapshot: currentSnapshot,
          savedAt: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, autoSaveInterval, history, currentIndex]);

  /**
   * Load auto-saved snapshot on mount
   */
  useEffect(() => {
    if (!autoSave) return;

    try {
      const saved = localStorage.getItem('formation-autosave');
      if (saved) {
        const { snapshot, savedAt } = JSON.parse(saved);
        const savedDate = new Date(savedAt);
        const now = new Date();
        const hoursSince = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60);

        // Only restore if saved within last 24 hours
        if (hoursSince < 24) {
          saveSnapshot(snapshot);
        }
      }
    } catch (error) {
      console.error('Failed to load auto-save:', error);
    }
  }, []); // Only run on mount

  return {
    history,
    currentIndex,
    canUndo,
    canRedo,
    undo,
    redo,
    saveSnapshot,
    clearHistory,
    goToSnapshot,
  };
}

export default useFormationHistory;
