/**
 * Keyboard Shortcuts Constants
 *
 * Centralized list of all keyboard shortcuts available in the Tactics Board.
 * Organized by category for easy reference and display.
 */

export interface KeyboardShortcut {
  key: string;
  description: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  category: 'general' | 'navigation' | 'view' | 'tools' | 'editing' | 'panels';
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // General
  {
    key: '?',
    description: 'Show keyboard shortcuts',
    category: 'general',
  },
  {
    key: 'Escape',
    description: 'Close panels/modals',
    category: 'general',
  },
  {
    key: 'S',
    modifiers: ['ctrl'],
    description: 'Save formation',
    category: 'general',
  },
  {
    key: 'P',
    modifiers: ['ctrl'],
    description: 'Export/Print formation',
    category: 'general',
  },

  // Navigation
  {
    key: 'Tab',
    description: 'Navigate between players',
    category: 'navigation',
  },
  {
    key: 'Tab',
    modifiers: ['shift'],
    description: 'Navigate backwards',
    category: 'navigation',
  },
  {
    key: 'Arrow Keys',
    description: 'Move selected player',
    category: 'navigation',
  },
  {
    key: 'Space',
    description: 'Select/Deselect player',
    category: 'navigation',
  },

  // View Controls
  {
    key: 'F',
    description: 'Toggle fullscreen mode',
    category: 'view',
  },
  {
    key: 'F11',
    description: 'Browser fullscreen',
    category: 'view',
  },
  {
    key: 'G',
    description: 'Toggle grid',
    category: 'view',
  },
  {
    key: 'H',
    description: 'Toggle heat map',
    category: 'view',
  },
  {
    key: 'C',
    description: 'Toggle chemistry visualization',
    category: 'view',
  },
  {
    key: 'T',
    description: 'Toggle formation strength',
    category: 'view',
  },
  {
    key: 'L',
    description: 'Toggle left sidebar',
    category: 'view',
  },
  {
    key: 'R',
    description: 'Toggle right sidebar',
    category: 'view',
  },
  {
    key: '+',
    description: 'Zoom in',
    category: 'view',
  },
  {
    key: '-',
    description: 'Zoom out',
    category: 'view',
  },
  {
    key: '0',
    description: 'Reset zoom',
    category: 'view',
  },

  // Drawing Tools
  {
    key: 'D',
    description: 'Activate drawing mode',
    category: 'tools',
  },
  {
    key: 'A',
    description: 'Arrow tool',
    category: 'tools',
  },
  {
    key: 'N',
    description: 'Line tool',
    category: 'tools',
  },
  {
    key: 'E',
    description: 'Erase tool',
    category: 'tools',
  },
  {
    key: 'V',
    description: 'Select tool',
    category: 'tools',
  },
  {
    key: 'Delete',
    description: 'Delete selected drawing',
    category: 'tools',
  },
  {
    key: 'Backspace',
    description: 'Delete selected drawing',
    category: 'tools',
  },

  // Editing
  {
    key: 'Z',
    modifiers: ['ctrl'],
    description: 'Undo',
    category: 'editing',
  },
  {
    key: 'Z',
    modifiers: ['ctrl', 'shift'],
    description: 'Redo',
    category: 'editing',
  },
  {
    key: 'Y',
    modifiers: ['ctrl'],
    description: 'Redo (alternative)',
    category: 'editing',
  },
  {
    key: 'C',
    modifiers: ['ctrl'],
    description: 'Copy player/formation',
    category: 'editing',
  },
  {
    key: 'X',
    modifiers: ['ctrl'],
    description: 'Cut player',
    category: 'editing',
  },
  {
    key: 'V',
    modifiers: ['ctrl'],
    description: 'Paste player',
    category: 'editing',
  },
  {
    key: 'A',
    modifiers: ['ctrl'],
    description: 'Select all players',
    category: 'editing',
  },
  {
    key: 'D',
    modifiers: ['ctrl'],
    description: 'Duplicate formation',
    category: 'editing',
  },

  // Panels
  {
    key: '1',
    modifiers: ['ctrl'],
    description: 'Open formations panel',
    category: 'panels',
  },
  {
    key: '2',
    modifiers: ['ctrl'],
    description: 'Open AI assistant',
    category: 'panels',
  },
  {
    key: '3',
    modifiers: ['ctrl'],
    description: 'Open playbook',
    category: 'panels',
  },
  {
    key: '4',
    modifiers: ['ctrl'],
    description: 'Open analytics',
    category: 'panels',
  },
  {
    key: '5',
    modifiers: ['ctrl'],
    description: 'Open dugout management',
    category: 'panels',
  },
  {
    key: 'I',
    modifiers: ['ctrl'],
    description: 'Toggle AI intelligence',
    category: 'panels',
  },
  {
    key: 'E',
    modifiers: ['ctrl'],
    description: 'Open export/import',
    category: 'panels',
  },
];

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
  return KEYBOARD_SHORTCUTS.filter(shortcut => shortcut.category === category);
}

/**
 * Get all categories
 */
export function getCategories(): KeyboardShortcut['category'][] {
  return ['general', 'navigation', 'view', 'tools', 'editing', 'panels'];
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.modifiers) {
    const modifierMap = {
      ctrl: 'Ctrl',
      shift: 'Shift',
      alt: 'Alt',
      meta: 'Cmd',
    };

    parts.push(...shortcut.modifiers.map(mod => modifierMap[mod]));
  }

  parts.push(shortcut.key);

  return parts.join('+');
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: KeyboardShortcut['category']): string {
  const names: Record<KeyboardShortcut['category'], string> = {
    general: 'General',
    navigation: 'Navigation',
    view: 'View Controls',
    tools: 'Drawing Tools',
    editing: 'Editing',
    panels: 'Panels & Features',
  };

  return names[category];
}
