/**
 * Toolbar Helper Utilities
 *
 * Helper functions for toolbar management and tool generation
 */

import type {
  ToolGroup,
  ToolId,
  ToolbarContext,
  KeyboardShortcut,
} from '../../../types/toolbar';

/**
 * Get default tool groups with callbacks
 */
export function getDefaultToolGroups(callbacks: {
  onToolSelect: (toolId: ToolId) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoom?: (level: number) => void;
  onSave?: () => void;
  onExport?: (format: 'png' | 'pdf' | 'svg') => void;
}): ToolGroup[] {
  return [
    {
      id: 'selection',
      label: 'Selection',
      category: 'formation',
      tools: [
        {
          id: 'select',
          category: 'formation',
          label: 'Select',
          icon: '👆',
          description: 'Select players and objects',
          shortcut: 'V',
          onClick: () => callbacks.onToolSelect('select'),
        },
        {
          id: 'move',
          category: 'formation',
          label: 'Move',
          icon: '✋',
          description: 'Move players around',
          shortcut: 'M',
          onClick: () => callbacks.onToolSelect('move'),
        },
      ],
    },
    {
      id: 'players',
      label: 'Players',
      category: 'player',
      isCollapsible: true,
      tools: [
        {
          id: 'add-player',
          category: 'player',
          label: 'Add Player',
          icon: '➕',
          description: 'Add a new player',
          shortcut: 'A',
          onClick: () => callbacks.onToolSelect('add-player'),
        },
        {
          id: 'remove-player',
          category: 'player',
          label: 'Remove',
          icon: '➖',
          description: 'Remove selected player',
          shortcut: 'Del',
          onClick: () => callbacks.onToolSelect('remove-player'),
        },
        {
          id: 'edit-player',
          category: 'player',
          label: 'Edit',
          icon: '✏️',
          description: 'Edit player details',
          shortcut: 'E',
          onClick: () => callbacks.onToolSelect('edit-player'),
        },
        {
          id: 'swap-players',
          category: 'player',
          label: 'Swap',
          icon: '🔄',
          description: 'Swap two players',
          shortcut: 'S',
          onClick: () => callbacks.onToolSelect('swap-players'),
        },
      ],
    },
    {
      id: 'drawing',
      label: 'Drawing',
      category: 'drawing',
      isCollapsible: true,
      tools: [
        {
          id: 'draw-line',
          category: 'drawing',
          label: 'Line',
          icon: '📏',
          description: 'Draw straight line',
          shortcut: 'L',
          onClick: () => callbacks.onToolSelect('draw-line'),
        },
        {
          id: 'draw-arrow',
          category: 'drawing',
          label: 'Arrow',
          icon: '➡️',
          description: 'Draw arrow',
          shortcut: 'R',
          onClick: () => callbacks.onToolSelect('draw-arrow'),
        },
        {
          id: 'draw-zone',
          category: 'drawing',
          label: 'Zone',
          icon: '⬜',
          description: 'Draw zone/area',
          shortcut: 'Z',
          onClick: () => callbacks.onToolSelect('draw-zone'),
        },
        {
          id: 'annotate',
          category: 'drawing',
          label: 'Text',
          icon: '📝',
          description: 'Add text annotation',
          shortcut: 'T',
          onClick: () => callbacks.onToolSelect('annotate'),
        },
        {
          id: 'erase',
          category: 'drawing',
          label: 'Erase',
          icon: '🧹',
          description: 'Erase drawings',
          shortcut: 'X',
          onClick: () => callbacks.onToolSelect('erase'),
        },
      ],
    },
    {
      id: 'view',
      label: 'View',
      category: 'view',
      tools: [
        {
          id: 'toggle-grid',
          category: 'view',
          label: 'Grid',
          icon: '#️⃣',
          description: 'Toggle grid overlay',
          shortcut: 'G',
          onClick: () => callbacks.onToolSelect('toggle-grid'),
        },
        {
          id: 'toggle-names',
          category: 'view',
          label: 'Names',
          icon: '👤',
          description: 'Show/hide player names',
          shortcut: 'N',
          onClick: () => callbacks.onToolSelect('toggle-names'),
        },
        {
          id: 'toggle-numbers',
          category: 'view',
          label: 'Numbers',
          icon: '🔢',
          description: 'Show/hide player numbers',
          shortcut: '#',
          onClick: () => callbacks.onToolSelect('toggle-numbers'),
        },
      ],
    },
    {
      id: 'history',
      label: 'History',
      category: 'history',
      tools: [
        {
          id: 'undo',
          category: 'history',
          label: 'Undo',
          icon: '↶',
          description: 'Undo last action',
          shortcut: 'Ctrl+Z',
          onClick: () => callbacks.onUndo?.(),
          isEnabled: true,
        },
        {
          id: 'redo',
          category: 'history',
          label: 'Redo',
          icon: '↷',
          description: 'Redo last action',
          shortcut: 'Ctrl+Y',
          onClick: () => callbacks.onRedo?.(),
          isEnabled: true,
        },
      ],
    },
    {
      id: 'export',
      label: 'Export',
      category: 'export',
      isCollapsible: true,
      tools: [
        {
          id: 'save',
          category: 'export',
          label: 'Save',
          icon: '💾',
          description: 'Save formation',
          shortcut: 'Ctrl+S',
          onClick: () => callbacks.onSave?.(),
        },
        {
          id: 'export-image',
          category: 'export',
          label: 'Export PNG',
          icon: '🖼️',
          description: 'Export as image',
          onClick: () => callbacks.onExport?.('png'),
        },
        {
          id: 'export-pdf',
          category: 'export',
          label: 'Export PDF',
          icon: '📄',
          description: 'Export as PDF',
          onClick: () => callbacks.onExport?.('pdf'),
        },
      ],
    },
  ];
}

/**
 * Get contextual tools based on current state
 */
export function getContextualTools(
  groups: ToolGroup[],
  context: ToolbarContext,
): ToolGroup[] {
  return groups.map(group => {
    // Update tool enabled state based on context
    const contextualTools = group.tools.map(tool => {
      let isEnabled = tool.isEnabled !== false;

      // Context-specific enabling/disabling
      if (tool.id === 'undo') {
        isEnabled = context.canUndo;
      } else if (tool.id === 'redo') {
        isEnabled = context.canRedo;
      } else if (tool.id === 'remove-player' || tool.id === 'edit-player') {
        isEnabled = context.selectedPlayers.length > 0;
      } else if (tool.id === 'swap-players') {
        isEnabled = context.selectedPlayers.length === 1;
      } else if (tool.category === 'drawing') {
        isEnabled = context.mode === 'edit';
      }

      return { ...tool, isEnabled };
    });

    return { ...group, tools: contextualTools };
  });
}

/**
 * Get default keyboard shortcuts
 */
export function getDefaultShortcuts(): KeyboardShortcut[] {
  return [
    // Selection
    { key: 'v', toolId: 'select', description: 'Select Tool', category: 'formation' },
    { key: 'm', toolId: 'move', description: 'Move Tool', category: 'formation' },

    // Players
    { key: 'a', toolId: 'add-player', description: 'Add Player', category: 'player' },
    { key: 'Delete', toolId: 'remove-player', description: 'Remove Player', category: 'player' },
    { key: 'e', toolId: 'edit-player', description: 'Edit Player', category: 'player' },
    { key: 's', toolId: 'swap-players', description: 'Swap Players', category: 'player' },

    // Drawing
    { key: 'l', toolId: 'draw-line', description: 'Draw Line', category: 'drawing' },
    { key: 'r', toolId: 'draw-arrow', description: 'Draw Arrow', category: 'drawing' },
    { key: 'z', toolId: 'draw-zone', description: 'Draw Zone', category: 'drawing' },
    { key: 't', toolId: 'annotate', description: 'Add Text', category: 'drawing' },
    { key: 'x', toolId: 'erase', description: 'Erase', category: 'drawing' },

    // View
    { key: 'g', toolId: 'toggle-grid', description: 'Toggle Grid', category: 'view' },
    { key: 'n', toolId: 'toggle-names', description: 'Toggle Names', category: 'view' },
    { key: '#', toolId: 'toggle-numbers', description: 'Toggle Numbers', category: 'view' },

    // History
    { key: 'z', modifiers: ['ctrl'], toolId: 'undo', description: 'Undo', category: 'history' },
    { key: 'y', modifiers: ['ctrl'], toolId: 'redo', description: 'Redo', category: 'history' },

    // Export
    { key: 's', modifiers: ['ctrl'], toolId: 'save', description: 'Save', category: 'export' },
  ];
}

/**
 * Track tool usage metrics
 */
export function trackToolUsage(toolId: ToolId): void {
  try {
    const metrics = JSON.parse(
      localStorage.getItem('astral-turf-tool-metrics') || '{}',
    ) as Record<ToolId, number>;

    metrics[toolId] = (metrics[toolId] || 0) + 1;

    localStorage.setItem('astral-turf-tool-metrics', JSON.stringify(metrics));
  } catch {
    // Silent fail - localStorage might be disabled
  }
}

/**
 * Get most used tools
 */
export function getMostUsedTools(limit = 5): Array<{ toolId: ToolId; count: number }> {
  try {
    const metrics = JSON.parse(
      localStorage.getItem('astral-turf-tool-metrics') || '{}',
    ) as Record<string, number>;

    return Object.entries(metrics)
      .map(([toolId, count]) => ({ toolId: toolId as ToolId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch {
    return [];
  }
}
