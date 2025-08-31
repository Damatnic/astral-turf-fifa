// UI and application state types

import type { PositionRole, Team, TransferMarketFilters, AdvancedRosterFilters, ChatMessage } from './player';

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
export type ModalType = 'editPlayer' | 'comparePlayer' | 'slotActionMenu' | 'chat' | 'customFormationEditor' | 'loadProject' | 'matchSimulator' | 'postMatchReport' | 'contractNegotiation' | 'pressConference' | 'aiSubSuggestion' | 'playerConversation' | 'interactiveTutorial' | 'scouting' | 'sponsorships' | 'teamTalk' | 'seasonEndSummary' | 'playbookLibrary';

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
  color: string;
  points: readonly { x: number; y: number }[];
  text?: string;
}

// Playbook and animations
export const PLAY_CATEGORIES = ['General', 'Attacking Corner', 'Defending Corner', 'Attacking Free Kick', 'Defending Free Kick', 'Throw-in'] as const;
export type PlayCategory = typeof PLAY_CATEGORIES[number];

export interface PlaybookEvent {
  type: 'Goal' | 'Yellow Card' | 'Red Card';
  description: string;
}

export interface PlaybookStep {
  id: string;
  playerPositions: Record<string, { x: number; y: number }>;
  drawings: DrawingShape[];
  event?: PlaybookEvent;
  playerRuns?: { playerId: string, points: { x: number, y: number }[] }[];
  ballPath?: { points: { x: number, y: number }[] };
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
  teamKits: { home: any, away: any }; // TeamKit when imported
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
  playerInitialPositions: Record<string, { x: number, y: number }> | null;
  animationTrails: readonly { playerId: string, points: readonly {x: number, y: number}[], color: string }[] | null;
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
  aiInsight: any | null; // AIInsight when AI types are imported
  isComparingAI: boolean;
  aiComparisonResult: any | null; // AIComparison when imported
  isSuggestingFormation: boolean;
  aiSuggestedFormation: any | null; // AISuggestedFormation when imported
  chatHistory: ChatMessage[];
  isChatProcessing: boolean;
  highlightedByAIPlayerIds: string[];
  isLoadingOppositionReport: boolean;
  oppositionReport: any | null; // AIOppositionReport when imported
  isSimulatingMatch: boolean;
  simulationTimeline: any[]; // (MatchEvent | MatchCommentary)[] when imported
  isLoadingPostMatchReport: boolean;
  postMatchReport: any | null; // AIPostMatchAnalysis when imported
  isLoadingPressConference: boolean;
  pressConferenceData: any | null; // AIPressConferenceResponse when imported
  isLoadingNegotiation: boolean;
  isLoadingAISubSuggestion: boolean;
  aiSubSuggestionData: any | null; // AISubstitutionSuggestion when imported
  isScoutingPlayer: boolean;
  scoutedPlayerId: string | null;
  scoutReport: any | null; // AIScoutReport when imported
  isLoadingConversation: boolean;
  selectedPlayerId: string | null;
  isLoadingDevelopmentSummary: boolean;
  developmentSummary: any | null; // AIDevelopmentSummary when imported
  isLoadingTeamTalk: boolean;
  teamTalkData: any | null; // AITeamTalkResponse when imported
  pendingPromiseRequest: any | null; // PromiseRequest when imported
}