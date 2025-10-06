// UI and application state types

import type {
  PositionRole,
  Team,
  TransferMarketFilters,
  AdvancedRosterFilters,
  ChatMessage,
} from './player';
import type { AIInsight, AIComparison, AISuggestedFormation } from './ai';
import type { TeamKit } from './match';

// Theme and general UI
export type AppTheme = 'light' | 'dark';
export type TeamView = Team | 'both';

// Notifications
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

// Modal types
export type ModalType =
  | 'editPlayer'
  | 'comparePlayer'
  | 'slotActionMenu'
  | 'chat'
  | 'customFormationEditor'
  | 'loadProject'
  | 'matchSimulator'
  | 'postMatchReport'
  | 'contractNegotiation'
  | 'pressConference'
  | 'aiSubSuggestion'
  | 'playerConversation'
  | 'interactiveTutorial'
  | 'scouting'
  | 'sponsorships'
  | 'teamTalk'
  | 'seasonEndSummary'
  | 'playbookLibrary';

// Slot action menu
export type SlotActionMenuTrigger = 'click' | 'drag';

export interface SlotActionMenuData {
  sourcePlayerId: string;
  targetSlotId: string;
  targetPlayerId?: string | null;
  trigger: SlotActionMenuTrigger;
  position: { x: number; y: number };
}

// Drawing and tactical tools
export type DrawingTool = 'select' | 'arrow' | 'zone' | 'pen' | 'line' | 'text';

export interface DrawingShape {
  id: string;
  tool: DrawingTool;
  type?: string; // Optional type for drawing shapes
  color: string;
  points: readonly { x: number; y: number }[];
  text?: string;
  timestamp?: number;
  layer?: number;
}

// Tactical lines for player connections
export interface TacticalLine {
  id: string;
  startPlayerId: string | null;
  endPlayerId: string | null;
  type?: 'pass' | 'run' | 'press' | 'support' | 'movement';
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  label?: string;
}

// Playbook and animations
export const PLAY_CATEGORIES = [
  'General',
  'Attacking Corner',
  'Defending Corner',
  'Attacking Free Kick',
  'Defending Free Kick',
  'Throw-in',
] as const;
export type PlayCategory = (typeof PLAY_CATEGORIES)[number];

export interface PlaybookEvent {
  type: 'Goal' | 'Yellow Card' | 'Red Card';
  description: string;
}

export interface PlaybookStep {
  id: string;
  playerPositions: Record<string, { x: number; y: number }>;
  drawings: DrawingShape[];
  event?: PlaybookEvent;
  playerRuns?: { playerId: string; points: { x: number; y: number }[] }[];
  ballPath?: { points: { x: number; y: number }[] };
}

export interface PlaybookItem {
  id: string;
  name: string;
  category: PlayCategory;
  formationId: string;
  steps: PlaybookStep[];
}

// Save system
export interface SaveSlot {
  id: string;
  name: string;
  lastSaved: string;
  appVersion: string;
}

// Tutorial system
export interface Tutorial {
  isActive: boolean;
  step: number;
}

// Player conversation data
export interface PlayerConversationData {
  playerId: string;
}

// Set piece editor
export interface SetPieceEditor {
  isEditing: boolean;
  activeTool: 'player_run' | 'ball_path' | null;
  selectedPlayerId: string | null;
}

// AI Settings and personalities
export type AIPersonality = 'balanced' | 'cautious' | 'attacking' | 'data';

export interface AISettings {
  aiPersonality: AIPersonality;
}

// Main UI State interface
export interface UIState {
  // App Meta
  theme: AppTheme;
  saveSlots: Record<string, SaveSlot>;
  activeSaveSlotId: string | null;
  isExportingLineup: boolean;
  teamKits: { home: TeamKit; away: TeamKit };
  notifications: Notification[];
  activeTeamContext: TeamView;

  // Modals & UI State
  activeModal: null | ModalType;
  editingPlayerId: string | null;
  playerToCompareId: string | null;
  slotActionMenuData: SlotActionMenuData | null;
  tutorial: Tutorial;
  playerConversationData: PlayerConversationData | null;

  // Drawing & Animation
  drawingTool: DrawingTool;
  drawingColor: string;
  isGridVisible: boolean;
  isFormationStrengthVisible: boolean;
  positioningMode: 'free' | 'snap';
  activePlaybookItemId: string | null;
  activeStepIndex: number | null;
  isAnimating: boolean;
  isPaused: boolean;
  playerInitialPositions: Record<string, { x: number; y: number }> | null;
  animationTrails:
    | readonly { playerId: string; points: readonly { x: number; y: number }[]; color: string }[]
    | null;
  isPresentationMode: boolean;
  setPieceEditor: SetPieceEditor;

  // Filtering & Search
  rosterSearchQuery: string;
  rosterRoleFilters: readonly PositionRole[];
  advancedRosterFilters: AdvancedRosterFilters;
  transferMarketFilters: TransferMarketFilters;
  playbookCategories: Record<string, boolean>;

  // AI State
  settings: AISettings;
  isLoadingAI: boolean;
  aiInsight: AIInsight | null;
  isComparingAI: boolean;
  aiComparisonResult: AIComparison | null;
  isSuggestingFormation: boolean;
  aiSuggestedFormation: AISuggestedFormation | null;
  chatHistory: ChatMessage[];
  isChatProcessing: boolean;
  highlightedByAIPlayerIds: string[];
  isLoadingOppositionReport: boolean;
  oppositionReport: unknown | null; // AIOppositionReport when imported
  isSimulatingMatch: boolean;
  simulationTimeline: unknown[]; // (MatchEvent | MatchCommentary)[] when imported
  isLoadingPostMatchReport: boolean;
  postMatchReport: unknown | null; // AIPostMatchAnalysis when imported
  isLoadingPressConference: boolean;
  pressConferenceData: unknown | null; // AIPressConferenceResponse when imported
  isLoadingNegotiation: boolean;
  isLoadingAISubSuggestion: boolean;
  aiSubSuggestionData: unknown | null; // AISubstitutionSuggestion when imported
  isScoutingPlayer: boolean;
  scoutedPlayerId: string | null;
  scoutReport: unknown | null; // AIScoutReport when imported
  isLoadingConversation: boolean;
  selectedPlayerId: string | null;
  isLoadingDevelopmentSummary: boolean;
  developmentSummary: unknown | null; // AIDevelopmentSummary when imported
  isLoadingTeamTalk: boolean;
  teamTalkData: unknown | null; // AITeamTalkResponse when imported
  pendingPromiseRequest: unknown | null; // PromiseRequest when imported
}

// Extended tactical board types
export interface TacticalInstruction {
  id?: string;
  type: 'defensive' | 'offensive' | 'positional' | 'set-piece' | 'set_piece' | 'transition';
  phase?: 'build_up' | 'attack' | 'defense' | 'set_piece';
  title?: string;
  description: string;
  instruction?: string;
  targetPlayers?: string[]; // Player IDs to apply to
  playerIds?: string[]; // Alternative property name
  duration?: number; // Minutes active
  priority: 'low' | 'medium' | 'high';
}

// Animation system
export interface AnimationStep {
  id: string;
  timestamp: number; // Time in animation (ms)
  playerId?: string; // Player being animated
  action: 'move' | 'pass' | 'shoot' | 'tackle' | 'dribble';
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  duration: number; // Animation duration (ms)
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// Heat map data
export interface HeatMapData {
  playerId: string;
  positions: Array<{ x: number; y: number; intensity: number }>;
  timeRange: { start: number; end: number };
  totalTouches: number;
  averagePosition: { x: number; y: number };
}

// Collaboration system
export interface CollaborationSession {
  id: string;
  hostUserId?: string;
  formationId: string;
  participants: Array<{
    userId: string;
    userName?: string;
    role: 'viewer' | 'editor' | 'commentator' | 'owner';
    joinedAt: string | Date;
    lastSeen?: Date;
    cursor?: { x: number; y: number };
    selectedElement?: string;
  }>;
  startedAt?: string;
  isActive?: boolean;
  createdAt?: Date;
  lastActivity?: Date;
  status: 'active' | 'paused' | 'ended';
  changes: Array<{
    userId: string;
    timestamp: string;
    action: string;
    data: any;
  }>;
  permissions?: {
    allowEditing: boolean;
    allowPlayerMovement: boolean;
    allowTacticalChanges: boolean;
    allowExport: boolean;
  };
}

// Export formats
export type ExportFormat = 'pdf' | 'png' | 'jpeg' | 'svg' | 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // For image exports (0-100)
  includeMetadata?: boolean;
  includeDrawings?: boolean;
  includePlayerStats?: boolean;
}

// Analytics data
export interface AnalyticsData {
  formationId: string;
  dateRange: { start: string; end: string };
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  cleanSheets: number;
  averagePossession: number;
  playerPerformance: Array<{
    playerId: string;
    gamesPlayed: number;
    minutesPlayed: number;
    goals: number;
    assists: number;
    rating: number;
  }>;
}
