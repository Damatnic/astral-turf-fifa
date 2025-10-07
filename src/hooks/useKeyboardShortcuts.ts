/**
 * Keyboard Shortcuts Hook
 *
 * Provides comprehensive keyboard shortcut functionality with:
 * - Global and component-level shortcuts
 * - Conflict prevention
 * - Customization support
 * - Documentation generation
 */

import { useEffect, useRef } from 'react';
import { create } from 'zustand';

// Shortcut configuration types
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Command on Mac
  description: string;
  category?: 'global' | 'navigation' | 'tactical-board' | 'forms' | 'modals';
  action: (event: KeyboardEvent) => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

export interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

// Keyboard shortcuts store
interface KeyboardShortcutsStore {
  shortcuts: Map<string, KeyboardShortcut>;
  enabled: boolean;
  helpModalOpen: boolean;
  registerShortcut: (id: string, shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  toggleShortcuts: (enabled: boolean) => void;
  toggleHelpModal: (open: boolean) => void;
  getShortcutsByCategory: () => ShortcutCategory[];
  findConflicts: (shortcut: KeyboardShortcut) => string[];
}

export const useKeyboardShortcutsStore = create<KeyboardShortcutsStore>((set, get) => ({
  shortcuts: new Map(),
  enabled: true,
  helpModalOpen: false,

  registerShortcut: (id: string, shortcut: KeyboardShortcut) => {
    set(state => {
      const newShortcuts = new Map(state.shortcuts);
      newShortcuts.set(id, shortcut);
      return { shortcuts: newShortcuts };
    });
  },

  unregisterShortcut: (id: string) => {
    set(state => {
      const newShortcuts = new Map(state.shortcuts);
      newShortcuts.delete(id);
      return { shortcuts: newShortcuts };
    });
  },

  toggleShortcuts: (enabled: boolean) => {
    set({ enabled });
  },

  toggleHelpModal: (open: boolean) => {
    set({ helpModalOpen: open });
  },

  getShortcutsByCategory: () => {
    const shortcuts = get().shortcuts;
    const categorized: Record<string, KeyboardShortcut[]> = {};

    shortcuts.forEach(shortcut => {
      const category = shortcut.category || 'global';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(shortcut);
    });

    return Object.entries(categorized).map(([name, shortcuts]) => ({
      name,
      shortcuts,
    }));
  },

  findConflicts: (shortcut: KeyboardShortcut) => {
    const shortcuts = get().shortcuts;
    const conflicts: string[] = [];
    const key = generateKeyString(shortcut);

    shortcuts.forEach((existingShortcut, id) => {
      if (generateKeyString(existingShortcut) === key) {
        conflicts.push(id);
      }
    });

    return conflicts;
  },
}));

/**
 * Generate unique string representation of a shortcut
 */
function generateKeyString(shortcut: KeyboardShortcut): string {
  const modifiers: string[] = [];
  if (shortcut.ctrl) {
    modifiers.push('ctrl');
  }
  if (shortcut.shift) {
    modifiers.push('shift');
  }
  if (shortcut.alt) {
    modifiers.push('alt');
  }
  if (shortcut.meta) {
    modifiers.push('meta');
  }
  return [...modifiers, shortcut.key.toLowerCase()].join('+');
}

/**
 * Check if event matches shortcut configuration
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const key = event.key.toLowerCase();
  const targetKey = shortcut.key.toLowerCase();

  if (key !== targetKey) {
    return false;
  }
  if (!!shortcut.ctrl !== event.ctrlKey) {
    return false;
  }
  if (!!shortcut.shift !== event.shiftKey) {
    return false;
  }
  if (!!shortcut.alt !== event.altKey) {
    return false;
  }
  if (!!shortcut.meta !== event.metaKey) {
    return false;
  }

  return true;
}

/**
 * Check if event should be ignored (e.g., in input fields)
 */
function shouldIgnoreEvent(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  const tagName = target.tagName.toLowerCase();

  // Ignore shortcuts when typing in input fields
  if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
    // Allow Escape key to work in inputs
    if (event.key === 'Escape') {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Main keyboard shortcuts hook
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, KeyboardShortcut>,
  options?: {
    enabled?: boolean;
    scope?: string; // Component scope for cleanup
  },
) {
  const { enabled = true, scope = 'component' } = options || {};
  const store = useKeyboardShortcutsStore();
  const shortcutIds = useRef<string[]>([]);

  // Register shortcuts on mount
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const ids = Object.keys(shortcuts);
    shortcutIds.current = ids;

    ids.forEach(id => {
      const fullId = `${scope}:${id}`;
      store.registerShortcut(fullId, shortcuts[id]);
    });

    return () => {
      // Cleanup on unmount
      shortcutIds.current.forEach(id => {
        const fullId = `${scope}:${id}`;
        store.unregisterShortcut(fullId);
      });
    };
  }, [shortcuts, enabled, scope, store]);

  // Global keyboard event handler
  useEffect(() => {
    if (!enabled || !store.enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts in input fields (except Escape)
      if (shouldIgnoreEvent(event)) {
        return;
      }

      // Check all registered shortcuts
      store.shortcuts.forEach(shortcut => {
        if (shortcut.enabled === false) {
          return;
        }

        if (matchesShortcut(event, shortcut)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, store.enabled, store.shortcuts]);

  return {
    enabled: store.enabled && enabled,
    toggleShortcuts: store.toggleShortcuts,
    showHelp: () => store.toggleHelpModal(true),
  };
}

/**
 * Global keyboard shortcuts (always active)
 */
export const globalShortcuts: Record<string, KeyboardShortcut> = {
  showHelp: {
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts help',
    category: 'global',
    action: () => {
      useKeyboardShortcutsStore.getState().toggleHelpModal(true);
    },
  },
  search: {
    key: 'k',
    ctrl: true,
    description: 'Open search',
    category: 'global',
    action: () => {
      // Will be implemented by search component
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement | null;
      searchInput?.focus();
    },
  },
  settings: {
    key: ',',
    ctrl: true,
    description: 'Open settings',
    category: 'global',
    action: () => {
      window.location.href = '/#/settings';
    },
  },
  toggleTheme: {
    key: 'd',
    ctrl: true,
    shift: true,
    description: 'Toggle dark/light theme',
    category: 'global',
    action: () => {
      const themeToggle = document.querySelector('[data-theme-toggle]') as HTMLButtonElement | null;
      themeToggle?.click();
    },
  },
};

/**
 * Navigation shortcuts
 */
export const navigationShortcuts: Record<string, KeyboardShortcut> = {
  goToDashboard: {
    key: 'h',
    alt: true,
    description: 'Go to Dashboard',
    category: 'navigation',
    action: () => {
      window.location.href = '/#/';
    },
  },
  goToTactics: {
    key: 't',
    alt: true,
    description: 'Go to Tactics Board',
    category: 'navigation',
    action: () => {
      window.location.href = '/#/tactics-board';
    },
  },
  goToTraining: {
    key: 'r',
    alt: true,
    description: 'Go to Training',
    category: 'navigation',
    action: () => {
      window.location.href = '/#/training';
    },
  },
  goToTransfers: {
    key: 'f',
    alt: true,
    description: 'Go to Transfers',
    category: 'navigation',
    action: () => {
      window.location.href = '/#/transfers';
    },
  },
  goToAnalytics: {
    key: 'a',
    alt: true,
    description: 'Go to Analytics',
    category: 'navigation',
    action: () => {
      window.location.href = '/#/analytics';
    },
  },
  goToFinances: {
    key: 'm',
    alt: true,
    description: 'Go to Finances',
    category: 'navigation',
    action: () => {
      window.location.href = '/#/finances';
    },
  },
};

/**
 * Modal/Dialog shortcuts
 */
export const modalShortcuts: Record<string, KeyboardShortcut> = {
  closeModal: {
    key: 'Escape',
    description: 'Close modal or dialog',
    category: 'modals',
    action: () => {
      // Will be handled by modal components
      const closeButton = document.querySelector('[data-modal-close]') as HTMLButtonElement | null;
      closeButton?.click();
    },
  },
};

/**
 * Tactical Board shortcuts (will be used in TacticalBoard component)
 */
export const tacticalBoardShortcuts: Record<string, KeyboardShortcut> = {
  saveFormation: {
    key: 's',
    ctrl: true,
    description: 'Save current formation',
    category: 'tactical-board',
    action: () => {
      // Implemented by TacticalBoard component
      const saveButton = document.querySelector(
        '[data-save-formation]',
      ) as HTMLButtonElement | null;
      saveButton?.click();
    },
  },
  undo: {
    key: 'z',
    ctrl: true,
    description: 'Undo last action',
    category: 'tactical-board',
    action: () => {
      const undoButton = document.querySelector('[data-undo]') as HTMLButtonElement | null;
      undoButton?.click();
    },
  },
  redo: {
    key: 'y',
    ctrl: true,
    description: 'Redo last action',
    category: 'tactical-board',
    action: () => {
      const redoButton = document.querySelector('[data-redo]') as HTMLButtonElement | null;
      redoButton?.click();
    },
  },
  cycleFormation: {
    key: 'f',
    description: 'Cycle through formations',
    category: 'tactical-board',
    action: () => {
      const cycleButton = document.querySelector(
        '[data-cycle-formation]',
      ) as HTMLButtonElement | null;
      cycleButton?.click();
    },
  },
  analyzeFormation: {
    key: 'a',
    ctrl: true,
    description: 'Analyze formation with AI',
    category: 'tactical-board',
    action: () => {
      const analyzeButton = document.querySelector(
        '[data-analyze-formation]',
      ) as HTMLButtonElement | null;
      analyzeButton?.click();
    },
  },
};

/**
 * Form shortcuts
 */
export const formShortcuts: Record<string, KeyboardShortcut> = {
  submit: {
    key: 'Enter',
    ctrl: true,
    description: 'Submit form',
    category: 'forms',
    action: event => {
      const form = (event.target as HTMLElement).closest('form');
      if (form) {
        const submitButton = form.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement | null;
        submitButton?.click();
      }
    },
  },
  reset: {
    key: 'Escape',
    description: 'Reset/cancel form',
    category: 'forms',
    action: event => {
      const form = (event.target as HTMLElement).closest('form');
      if (form) {
        const resetButton = form.querySelector(
          '[data-reset], button[type="reset"]',
        ) as HTMLButtonElement | null;
        resetButton?.click();
      }
    },
  },
};

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) {
    parts.push('Ctrl');
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  if (shortcut.alt) {
    parts.push('Alt');
  }
  if (shortcut.meta) {
    parts.push('⌘');
  }

  // Format key name
  let key = shortcut.key;
  if (key.length === 1) {
    key = key.toUpperCase();
  } else if (key === 'Escape') {
    key = 'Esc';
  }

  parts.push(key);

  return parts.join(' + ');
}

export default useKeyboardShortcuts;
