/**
 * Toolbar Type Definitions
 *
 * Comprehensive type system for enhanced tactical toolbar
 * Supports context-sensitive tools, keyboard shortcuts, and tool groups
 */

import type { Formation } from './match';
import type { Player } from './player';

// Define tactics-specific types here to avoid circular dependencies
export type TacticsMode = 'edit' | 'view' | 'analysis' | 'presentation';
export type InteractionMode = 'select' | 'draw' | 'move' | 'annotate';

// Re-export for convenience
export type { Formation, Player };

// ============================================================================
// Tool Types
// ============================================================================

export type ToolCategory =
  | 'formation'
  | 'player'
  | 'drawing'
  | 'analysis'
  | 'view'
  | 'history'
  | 'export';

export type ToolId =
  | 'select'
  | 'move'
  | 'add-player'
  | 'remove-player'
  | 'edit-player'
  | 'swap-players'
  | 'draw-line'
  | 'draw-arrow'
  | 'draw-zone'
  | 'draw-path'
  | 'erase'
  | 'measure'
  | 'annotate'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-fit'
  | 'pan'
  | 'toggle-grid'
  | 'toggle-names'
  | 'toggle-numbers'
  | 'undo'
  | 'redo'
  | 'save'
  | 'export-image'
  | 'export-pdf'
  | 'share';

export interface Tool {
  id: ToolId;
  category: ToolCategory;
  label: string;
  icon: string;
  description?: string;
  shortcut?: string;
  isEnabled?: boolean;
  isActive?: boolean;
  badge?: number | string;
  onClick: () => void;
  metadata?: Record<string, unknown>;
}

export interface ToolGroup {
  id: string;
  label: string;
  category: ToolCategory;
  tools: Tool[];
  isCollapsible?: boolean;
  isExpanded?: boolean;
  priority?: number;
}

// ============================================================================
// Toolbar State Types
// ============================================================================

export interface ToolbarState {
  activeTool: ToolId | null;
  enabledTools: Set<ToolId>;
  expandedGroups: Set<string>;
  isCompact: boolean;
  showLabels: boolean;
  showShortcuts: boolean;
  pinnedTools: ToolId[];
  recentTools: ToolId[];
}

export interface ToolbarContext {
  mode: TacticsMode;
  interactionMode: InteractionMode;
  selectedPlayers: Player[];
  formation?: Formation;
  canUndo: boolean;
  canRedo: boolean;
  zoomLevel: number;
}

// ============================================================================
// Floating Palette Types
// ============================================================================

export type PalettePosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

export interface FloatingPalette {
  id: string;
  title: string;
  tools: Tool[];
  position: PalettePosition;
  isVisible: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  width?: number;
  height?: number;
}

// ============================================================================
// Keyboard Shortcut Types
// ============================================================================

export interface KeyboardShortcut {
  key: string;
  modifiers?: Array<'ctrl' | 'shift' | 'alt' | 'meta'>;
  toolId: ToolId;
  description: string;
  category: ToolCategory;
}

export interface ShortcutGroup {
  category: ToolCategory;
  shortcuts: KeyboardShortcut[];
}

// ============================================================================
// Toolbar Component Props
// ============================================================================

export interface EnhancedTacticalToolbarProps {
  // Context
  mode: TacticsMode;
  interactionMode: InteractionMode;
  selectedPlayers?: Player[];
  formation?: Formation;

  // State
  activeTool?: ToolId;
  enabledTools?: ToolId[];
  isCompact?: boolean;
  isMobile?: boolean;

  // History
  canUndo?: boolean;
  canRedo?: boolean;

  // Zoom
  zoomLevel?: number;
  minZoom?: number;
  maxZoom?: number;

  // Callbacks
  onToolSelect: (toolId: ToolId) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoom?: (level: number) => void;
  onSave?: () => void;
  onExport?: (format: 'png' | 'pdf' | 'svg') => void;

  // Customization
  toolGroups?: ToolGroup[];
  shortcuts?: KeyboardShortcut[];
  floatingPalettes?: FloatingPalette[];
  className?: string;
}

export interface ToolButtonProps {
  tool: Tool;
  isActive?: boolean;
  isCompact?: boolean;
  showLabel?: boolean;
  showShortcut?: boolean;
  onClick: () => void;
  className?: string;
}

export interface ToolGroupProps {
  group: ToolGroup;
  activeTool?: ToolId;
  isCompact?: boolean;
  isExpanded?: boolean;
  onToolSelect: (toolId: ToolId) => void;
  onToggleExpand?: (groupId: string) => void;
  className?: string;
}

export interface FloatingPaletteProps extends FloatingPalette {
  activeTool?: ToolId;
  onToolSelect: (toolId: ToolId) => void;
  onClose: () => void;
  onPositionChange?: (position: PalettePosition) => void;
  className?: string;
}

export interface ShortcutPanelProps {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
  onShortcutTrigger?: (toolId: ToolId) => void;
  className?: string;
}

// ============================================================================
// Toolbar Configuration
// ============================================================================

export interface ToolbarConfig {
  // Tool groups
  groups: ToolGroup[];

  // Keyboard shortcuts
  shortcuts: KeyboardShortcut[];

  // Floating palettes
  palettes: FloatingPalette[];

  // Display options
  defaultCompact: boolean;
  defaultShowLabels: boolean;
  defaultShowShortcuts: boolean;

  // Behavior
  autoHide: boolean;
  autoHideDelay: number;
  enablePalettes: boolean;
  enableKeyboardNav: boolean;

  // Mobile
  mobileBreakpoint: number;
  mobileLayout: 'bottom' | 'floating';
}

// ============================================================================
// Tool Context Types
// ============================================================================

export interface ToolContext {
  // Current state
  activeTool: ToolId | null;
  previousTool: ToolId | null;

  // Selections
  selectedPlayers: Player[];
  selectedZones: string[];

  // Canvas state
  zoomLevel: number;
  panOffset: { x: number; y: number };

  // History
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;

  // Mode
  tacticsMode: TacticsMode;
  interactionMode: InteractionMode;
}

// ============================================================================
// Helper Types
// ============================================================================

export type ToolbarMode = 'standard' | 'compact' | 'minimal' | 'floating';

export interface ToolbarMetrics {
  toolUsage: Record<ToolId, number>;
  shortcutUsage: Record<string, number>;
  averageToolSwitchTime: number;
  mostUsedTools: Array<{ toolId: ToolId; count: number }>;
}

export interface ToolbarPreferences {
  defaultTool: ToolId;
  pinnedTools: ToolId[];
  customShortcuts: Record<ToolId, string>;
  palettePositions: Record<string, PalettePosition>;
  mode: ToolbarMode;
}
