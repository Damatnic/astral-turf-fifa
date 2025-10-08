/**
 * Roster Management Type Definitions
 *
 * Complete type system for the intelligent roster management system
 */

import type { Dispatch, DragEvent } from 'react';
import type { Player, Position as PlayerPosition, PlayerAttributes } from './index';

// For roster management, we use position strings like 'GK', 'CB', 'ST', etc.
export type FootballPosition = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST' | 'CF';

// ============================================================================
// ROSTER VIEW TYPES
// ============================================================================

/**
 * Roster view modes
 */
export type RosterViewMode = 'grid' | 'list' | 'comparison';

/**
 * Roster sort criteria
 */
export type RosterSortField =
  | 'name'
  | 'position'
  | 'overall'
  | 'pace'
  | 'shooting'
  | 'passing'
  | 'dribbling'
  | 'defending'
  | 'physical'
  | 'stamina'
  | 'morale'
  | 'fitness'
  | 'age';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration
 */
export interface RosterSort {
  field: RosterSortField;
  direction: SortDirection;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Position filter options
 */
export interface PositionFilter {
  positions: FootballPosition[];
  includeAll: boolean;
}

/**
 * Attribute range filter
 */
export interface AttributeRangeFilter {
  min: number;
  max: number;
  enabled: boolean;
}

/**
 * Status filter options
 */
export interface StatusFilter {
  available: boolean;
  injured: boolean;
  suspended: boolean;
  tired: boolean;
}

/**
 * Roster filter configuration
 */
export interface RosterFilters {
  searchQuery: string;
  positions: PositionFilter;
  overall: AttributeRangeFilter;
  pace: AttributeRangeFilter;
  stamina: AttributeRangeFilter;
  morale: AttributeRangeFilter;
  fitness: AttributeRangeFilter;
  age: AttributeRangeFilter;
  status: StatusFilter;
}

/**
 * Saved filter preset
 */
export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: RosterFilters;
  createdAt: Date;
  lastUsed?: Date;
}

// ============================================================================
// ROSTER STATE TYPES
// ============================================================================

/**
 * Roster state management
 */
export interface RosterState {
  players: Player[];
  filteredPlayers: Player[];
  selectedPlayerIds: Set<string>;
  comparisonPlayerIds: string[];
  viewMode: RosterViewMode;
  sort: RosterSort;
  filters: RosterFilters;
  filterPresets: FilterPreset[];
  activePresetId: string | null;
  searchHistory: string[];
  isLoading: boolean;
  gridColumns: number;
}

// ============================================================================
// ROSTER ACTION TYPES
// ============================================================================

export type RosterAction =
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_FILTERED_PLAYERS'; payload: Player[] }
  | { type: 'SET_VIEW_MODE'; payload: RosterViewMode }
  | { type: 'SET_SORT'; payload: RosterSort }
  | { type: 'SET_FILTERS'; payload: Partial<RosterFilters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SELECT_PLAYER'; payload: string }
  | { type: 'DESELECT_PLAYER'; payload: string }
  | { type: 'TOGGLE_PLAYER_SELECTION'; payload: string }
  | { type: 'SELECT_ALL_PLAYERS' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'ADD_TO_COMPARISON'; payload: string }
  | { type: 'REMOVE_FROM_COMPARISON'; payload: string }
  | { type: 'CLEAR_COMPARISON' }
  | { type: 'SAVE_FILTER_PRESET'; payload: FilterPreset }
  | { type: 'DELETE_FILTER_PRESET'; payload: string }
  | { type: 'LOAD_FILTER_PRESET'; payload: string }
  | { type: 'ADD_TO_SEARCH_HISTORY'; payload: string }
  | { type: 'CLEAR_SEARCH_HISTORY' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_GRID_COLUMNS'; payload: number };

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * RosterGrid component props
 */
export interface RosterGridProps {
  players: Player[];
  selectedPlayerIds: Set<string>;
  comparisonPlayerIds: string[];
  viewMode: RosterViewMode;
  gridColumns: number;
  onPlayerSelect: (playerId: string) => void;
  onPlayerDoubleClick: (playerId: string) => void;
  onPlayerDragStart: (playerId: string, event: DragEvent<HTMLElement>) => void;
  onAddToComparison: (playerId: string) => void;
  onRemoveFromComparison: (playerId: string) => void;
  onCompareToggle?: (playerId: string) => void;
  onViewModeChange?: (mode: RosterViewMode) => void;
  containerWidth?: number;
  containerHeight?: number;
  className?: string;
}

/**
 * PlayerCard component props
 */
export interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  isInComparison: boolean;
  isComparing?: boolean;
  viewMode: RosterViewMode;
  onClick: () => void;
  onDoubleClick: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onAddToComparison?: () => void;
  onRemoveFromComparison?: () => void;
  onCompareClick?: () => void;
  showDetailedStats?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * FilterPanel component props
 */
export interface FilterPanelProps {
  filters: RosterFilters;
  presets: FilterPreset[];
  activePresetId: string | null;
  onFilterChange: (filters: Partial<RosterFilters>) => void;
  onResetFilters: () => void;
  onSavePreset: (name: string, description?: string) => void;
  onLoadPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  className?: string;
}

/**
 * SmartSearch component props
 */
export interface SmartSearchProps {
  searchQuery: string;
  searchHistory: string[];
  onSearchChange: (query: string) => void;
  onClearHistory: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * ComparisonView component props
 */
export interface ComparisonViewProps {
  players: Player[];
  onRemovePlayer: (playerId: string) => void;
  onClearAll: () => void;
  maxPlayers?: number;
  className?: string;
}

/**
 * BulkActions component props
 */
export interface BulkActionsProps {
  selectedPlayerIds: Set<string>;
  players: Player[];
  onClearSelection: () => void;
  onAddToFormation?: (playerIds: string[]) => void;
  onExportSelection?: (playerIds: string[]) => void;
  onAssignInstructions?: (playerIds: string[]) => void;
  className?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Player statistics for comparison
 */
export interface PlayerComparisonStats {
  player: Player;
  attributes: PlayerAttributes;
  overall: number;
  strengths: string[];
  weaknesses: string[];
  suggestedPosition: FootballPosition;
}

/**
 * Roster analytics
 */
export interface RosterAnalytics {
  totalPlayers: number;
  availablePlayers: number;
  injuredPlayers: number;
  suspendedPlayers: number;
  tiredPlayers: number;
  averageOverall: number;
  averageAge: number;
  averageMorale: number;
  averageFitness: number;
  positionDistribution: Partial<Record<FootballPosition, number>>;
  topPlayers: Player[];
}

/**
 * Search suggestion
 */
export interface SearchSuggestion {
  type: 'player' | 'position' | 'attribute' | 'filter';
  text: string;
  description?: string;
  icon?: string;
  action?: () => void;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Roster context value
 */
export interface RosterContextValue {
  state: RosterState;
  dispatch: Dispatch<RosterAction>;
  actions: {
    setPlayers: (players: Player[]) => void;
    setViewMode: (mode: RosterViewMode) => void;
    setSort: (sort: RosterSort) => void;
    updateFilters: (filters: Partial<RosterFilters>) => void;
    resetFilters: () => void;
    selectPlayer: (playerId: string) => void;
    deselectPlayer: (playerId: string) => void;
    togglePlayerSelection: (playerId: string) => void;
    selectAllPlayers: () => void;
    clearSelection: () => void;
    addToComparison: (playerId: string) => void;
    removeFromComparison: (playerId: string) => void;
    clearComparison: () => void;
    saveFilterPreset: (name: string, description?: string) => void;
    loadFilterPreset: (presetId: string) => void;
    deleteFilterPreset: (presetId: string) => void;
    applyFilters: () => void;
  };
  analytics: RosterAnalytics;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * useRosterFilters hook return type
 */
export interface UseRosterFiltersReturn {
  filteredPlayers: Player[];
  activeFilters: RosterFilters;
  updateFilters: (filters: Partial<RosterFilters>) => void;
  resetFilters: () => void;
  applyFilters: () => void;
}

/**
 * useRosterSort hook return type
 */
export interface UseRosterSortReturn {
  sortedPlayers: Player[];
  currentSort: RosterSort;
  setSort: (sort: RosterSort) => void;
  toggleSort: (field: RosterSortField) => void;
}

/**
 * usePlayerComparison hook return type
 */
export interface UsePlayerComparisonReturn {
  comparisonPlayers: Player[];
  comparisonStats: PlayerComparisonStats[];
  addToComparison: (playerId: string) => void;
  removeFromComparison: (playerId: string) => void;
  clearComparison: () => void;
  canAddMore: boolean;
  maxPlayers: number;
}

// ============================================================================
// DRAG & DROP TYPES
// ============================================================================

/**
 * Player drag data
 */
export interface PlayerDragData {
  type: 'player';
  playerId: string;
  player: Player;
  source: 'roster' | 'field' | 'bench';
}

/**
 * Drop zone type
 */
export type DropZoneType = 'field' | 'bench' | 'roster' | 'trash';

/**
 * Drop result
 */
export interface DropResult {
  dropZone: DropZoneType;
  position?: PlayerPosition;
  fieldPosition?: FootballPosition;
  success: boolean;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Roster grid configuration
 */
export interface RosterGridConfig {
  minColumns: number;
  maxColumns: number;
  defaultColumns: number;
  cardMinWidth: number;
  cardAspectRatio: number;
  gap: number;
  virtualScrolling: boolean;
  overscanCount: number;
}

/**
 * Default filter values
 */
export const DEFAULT_ROSTER_FILTERS: RosterFilters = {
  searchQuery: '',
  positions: {
    positions: [],
    includeAll: true,
  },
  overall: {
    min: 0,
    max: 100,
    enabled: false,
  },
  pace: {
    min: 0,
    max: 100,
    enabled: false,
  },
  stamina: {
    min: 0,
    max: 100,
    enabled: false,
  },
  morale: {
    min: 0,
    max: 100,
    enabled: false,
  },
  fitness: {
    min: 0,
    max: 100,
    enabled: false,
  },
  age: {
    min: 16,
    max: 40,
    enabled: false,
  },
  status: {
    available: true,
    injured: true,
    suspended: true,
    tired: true,
  },
};

/**
 * Default roster state
 */
export const DEFAULT_ROSTER_STATE: RosterState = {
  players: [],
  filteredPlayers: [],
  selectedPlayerIds: new Set(),
  comparisonPlayerIds: [],
  viewMode: 'grid',
  sort: {
    field: 'overall',
    direction: 'desc',
  },
  filters: DEFAULT_ROSTER_FILTERS,
  filterPresets: [],
  activePresetId: null,
  searchHistory: [],
  isLoading: false,
  gridColumns: 4,
};
