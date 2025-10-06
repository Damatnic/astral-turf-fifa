// Main types export file - Re-exports all types and defines main state interfaces

// Re-export all types from individual files
export * from './player';
export * from './match';
export * from './league';
export * from './ui';
export * from './training';
export * from './staff';
export * from './finance';
export * from './ai';
export * from './communication';
export * from './auth';

// Import what we need for main state interfaces
import type {
  Player,
  Team,
  MentoringGroup,
  PlayerRelationshipType,
  Promise,
  TransferPlayer,
} from './player';
import type { Formation, TeamTactics, SetPieceAssignments } from './match';
import type { DrawingShape, PlaybookItem } from './ui';
import type {
  Season,
  BoardObjective,
  Manager,
  HistoricalSeasonRecord,
  ScoutingAssignment,
  PressNarrative,
  SeasonAwards,
  NewsItem,
} from './league';
import type {
  WeeklySchedule,
  TrainingPlanTemplate,
  SkillChallenge,
  YouthAcademy,
} from './training';
import type { Staff } from './staff';
import type { TeamFinances, Stadium, SponsorshipDeal } from './finance';
import type { InboxItem } from './communication';
import type { UIState } from './ui';
import type { AuthState } from './auth';
import type { AIAgentResponse } from './ai';
import type { AgentPersonality } from './staff';

// Main application state interfaces
export interface TacticsState {
  players: Player[];
  formations: Record<string, Formation>;
  playbook: Record<string, PlaybookItem>;
  activeFormationIds: { home: string; away: string };
  teamTactics: { home: TeamTactics; away: TeamTactics };
  drawings: DrawingShape[];
  tacticalFamiliarity: Record<string, number>; // formationId -> familiarity %
  chemistry: Record<string, Record<string, number>>; // playerA_id -> { playerB_id -> raw_chemistry_score }
  captainIds: { home: string | null; away: string | null };
  setPieceTakers: { home: SetPieceAssignments; away: SetPieceAssignments };
}

export interface FranchiseState {
  gameWeek: number;
  season: Season;
  manager: Manager;
  boardObjectives: readonly BoardObjective[];
  jobSecurity: number; // 0-100
  fanConfidence: number; // 0-100
  finances: { home: TeamFinances; away: TeamFinances };
  trainingSchedule: { home: WeeklySchedule; away: WeeklySchedule };
  inbox: InboxItem[];
  transferMarket: {
    forSale: TransferPlayer[];
    forLoan: Player[];
    freeAgents: Player[];
  };
  matchHistory: any[]; // MatchResult[] when match types are properly imported
  youthAcademy: { home: YouthAcademy; away: YouthAcademy };
  staff: { home: Staff; away: Staff };
  stadium: { home: Stadium; away: Stadium };
  sponsorships: { home: SponsorshipDeal | null; away: SponsorshipDeal | null };
  historicalData: readonly HistoricalSeasonRecord[];
  hallOfFame: readonly Player[];
  newsFeed: NewsItem[];
  lastMatchResult: any | null; // MatchResult when available
  negotiationData: {
    playerId: string;
    conversation: string[];
    agentPersonality: AgentPersonality;
  } | null;
  mentoringGroups: { home: MentoringGroup[]; away: MentoringGroup[] };
  relationships: Record<string, Record<string, PlayerRelationshipType>>;
  scoutingAssignments: ScoutingAssignment[];
  pressNarratives: PressNarrative[];
  lastSeasonAwards: SeasonAwards | null;
  promises: Promise[];
  trainingPlanTemplates: Record<string, TrainingPlanTemplate>;
  skillChallenges: SkillChallenge[];
}

export interface RootState {
  auth: AuthState;
  tactics: TacticsState;
  franchise: FranchiseState;
  ui: UIState;
}

// Action types (comprehensive union type for all possible actions)
export type Action =
  // Auth Actions
  | { type: 'LOGIN_SUCCESS'; payload: any } // User type
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SIGNUP_SUCCESS'; payload: any } // User type
  | { type: 'SIGNUP_FAILURE'; payload: string }
  | { type: 'LOAD_STATE'; payload: RootState }
  | { type: 'RESET_STATE' }
  | { type: 'SOFT_RESET_APP' }

  // Player Actions
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'UPDATE_PLAYER'; payload: Player }
  | { type: 'UPDATE_PLAYERS'; payload: readonly Player[] }
  | { type: 'SELECT_PLAYER'; payload: string | null }
  | { type: 'SET_CAPTAIN'; payload: string }
  | { type: 'BENCH_PLAYER'; payload: { playerId: string } }
  | { type: 'BENCH_ALL_PLAYERS'; payload: { team: Team } }
  | { type: 'ASSIGN_PLAYER_TEAM'; payload: { playerId: string; team: Team } }
  | { type: 'ADD_DEVELOPMENT_LOG'; payload: { playerId: string; entry: any } } // DevelopmentLogEntry
  | { type: 'SET_INDIVIDUAL_TRAINING_FOCUS'; payload: { playerId: string; focus: any } } // IndividualTrainingFocus
  | { type: 'ADD_CONTRACT_CLAUSE'; payload: { playerId: string; clauseText: string } }
  | { type: 'UPDATE_CONTRACT_CLAUSE'; payload: { playerId: string; clauseId: string; status: any } } // ContractClause status
  | { type: 'REMOVE_CONTRACT_CLAUSE'; payload: { playerId: string; clauseId: string } }
  | { type: 'TERMINATE_PLAYER_CONTRACT'; payload: string }
  | { type: 'ADD_COMMUNICATION_LOG'; payload: { playerId: string; entry: any } } // CommunicationLogEntry
  | {
      type: 'UPDATE_PLAYER_CHALLENGE_COMPLETION';
      payload: { playerId: string; challengeId: string };
    }

  // Formation & Tactics Actions
  | { type: 'SET_ACTIVE_FORMATION'; payload: { formationId: string; team: Team } }
  | { type: 'CLEAR_FORMATION' }
  | { type: 'ASSIGN_PLAYER_TO_SLOT'; payload: { slotId: string; playerId: string; team: Team } }
  | {
      type: 'UPDATE_PLAYER_POSITION';
      payload: { playerId: string; position: { x: number; y: number } };
    }
  | { type: 'SET_TEAM_TACTIC'; payload: { team: Team; tactic: any; value: any } } // TeamTactics properties
  | { type: 'SAVE_CUSTOM_FORMATION'; payload: Formation }
  | { type: 'DELETE_CUSTOM_FORMATION'; payload: string }
  | { type: 'UPDATE_TACTICAL_FAMILIARITY'; payload: { formationId: string; increase: number } }
  | { type: 'SET_SET_PIECE_TAKER'; payload: { team: Team; type: any; playerId: string | null } } // SetPieceType
  | { type: 'APPLY_TEAM_TALK_EFFECT'; payload: { team: Team; effect: number } }
  | { type: 'CLEAR_MORALE_BOOSTS'; payload: { team: Team } }

  // UI Actions (extensive set)
  | { type: 'SET_ACTIVE_TEAM_CONTEXT'; payload: any } // TeamView
  | { type: 'OPEN_MODAL'; payload: any } // ModalType
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_EDITING_PLAYER_ID'; payload: string | null }
  | { type: 'SET_COMPARE_PLAYER_ID'; payload: string | null }
  | { type: 'OPEN_SLOT_ACTION_MENU'; payload: any } // SlotActionMenuData
  | { type: 'CLOSE_SLOT_ACTION_MENU' }
  | {
      type: 'RESOLVE_SLOT_ACTION';
      payload: { decision: 'swap' | 'replace' | 'bench' | 'captain' | 'loan' };
    }
  | { type: 'SWAP_PLAYERS'; payload: { sourcePlayerId: string; targetPlayerId: string } }
  | { type: 'TOGGLE_GRID_VISIBILITY' }
  | { type: 'TOGGLE_FORMATION_STRENGTH_VISIBILITY' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_TEAM_KIT'; payload: { team: Team; kit: any } } // Partial<TeamKit>
  | { type: 'ADD_NOTIFICATION'; payload: any } // Notification without id
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'START_TUTORIAL' }
  | { type: 'END_TUTORIAL' }
  | { type: 'SET_TUTORIAL_STEP'; payload: number }

  // Drawing & Playbook Actions
  | { type: 'SET_DRAWING_TOOL'; payload: any } // DrawingTool
  | { type: 'SET_DRAWING_COLOR'; payload: string }
  | { type: 'SET_POSITIONING_MODE'; payload: 'free' | 'snap' }
  | { type: 'ADD_DRAWING'; payload: DrawingShape }
  | { type: 'UNDO_LAST_DRAWING' }
  | { type: 'CLEAR_DRAWINGS' }
  | { type: 'CREATE_PLAYBOOK_ITEM'; payload: { name: string; category: any } } // PlayCategory
  | { type: 'LOAD_PLAYBOOK_ITEM'; payload: string }
  | { type: 'DELETE_PLAYBOOK_ITEM'; payload: string }
  | { type: 'DUPLICATE_PLAYBOOK_ITEM'; payload: string }
  | { type: 'ADD_LIBRARY_PLAY_TO_PLAYBOOK'; payload: PlaybookItem }
  | { type: 'TOGGLE_PLAYBOOK_CATEGORY'; payload: any } // PlayCategory
  | { type: 'SET_ACTIVE_STEP'; payload: number }
  | { type: 'ADD_PLAYBOOK_STEP' }
  | { type: 'DELETE_PLAYBOOK_STEP'; payload: number }
  | { type: 'SET_PLAYBOOK_EVENT'; payload: { stepIndex: number; event: any } } // PlaybookEvent | null
  | { type: 'ENTER_PRESENTATION_MODE' }
  | { type: 'EXIT_PRESENTATION_MODE' }
  | { type: 'START_ANIMATION' }
  | { type: 'PAUSE_ANIMATION' }
  | { type: 'RESET_ANIMATION' }

  // AI Actions (extensive AI integration)
  | { type: 'SET_AI_PERSONALITY'; payload: any } // AIPersonality
  | { type: 'GENERATE_AI_INSIGHT_START' }
  | { type: 'GENERATE_AI_INSIGHT_SUCCESS'; payload: any } // AIInsight
  | { type: 'GENERATE_AI_INSIGHT_FAILURE' }
  | { type: 'GENERATE_AI_COMPARISON_START' }
  | { type: 'GENERATE_AI_COMPARISON_SUCCESS'; payload: any } // AIComparison
  | { type: 'GENERATE_AI_COMPARISON_FAILURE' }
  | { type: 'SUGGEST_FORMATION_START' }
  | { type: 'SUGGEST_FORMATION_SUCCESS'; payload: any } // AISuggestedFormation
  | { type: 'SUGGEST_FORMATION_FAILURE' }
  | { type: 'SEND_CHAT_MESSAGE_START'; payload: any } // ChatMessage
  | {
      type: 'SEND_CHAT_MESSAGE_SUCCESS';
      payload: { response: any; playerIdsToHighlight: readonly string[] };
    }
  | { type: 'SEND_CHAT_MESSAGE_FAILURE' }

  // Match and simulation Actions
  | { type: 'SIMULATE_MATCH_START' }
  | { type: 'SIMULATE_MATCH_UPDATE'; payload: any } // MatchEvent | MatchCommentary
  | { type: 'SIMULATE_MATCH_SUCCESS'; payload: any } // MatchResult
  | { type: 'SIMULATE_MATCH_FAILURE' }
  | { type: 'GET_POST_MATCH_REPORT_START' }
  | { type: 'GET_POST_MATCH_REPORT_SUCCESS'; payload: any } // AIPostMatchAnalysis
  | { type: 'GET_POST_MATCH_REPORT_FAILURE' }

  // Franchise Management Actions
  | { type: 'ADVANCE_WEEK' }
  | { type: 'ADVANCE_SEASON' }
  | { type: 'SIGN_TRANSFER_PLAYER'; payload: { player: TransferPlayer; team: Team } }
  | { type: 'SELL_PLAYER'; payload: { playerId: string; price: number } }
  | { type: 'GENERATE_TRANSFER_MARKET_PLAYERS' }
  | { type: 'ADD_INBOX_ITEM'; payload: any } // InboxItem without id, week, isRead
  | { type: 'MARK_INBOX_ITEM_READ'; payload: string }
  | { type: 'REMOVE_INBOX_ITEM'; payload: string }

  // Save/Load Actions
  | { type: 'SET_ACTIVE_SAVE_SLOT'; payload: string | null }
  | { type: 'DELETE_SAVE_SLOT'; payload: string }
  | { type: 'CREATE_SAVE_SLOT'; payload: { id: string; name: string } }
  | { type: 'LOAD_PLAYBOOK'; payload: Record<string, PlaybookItem> }

  // Misc Actions
  | { type: 'EXPORT_LINEUP_START' }
  | { type: 'EXPORT_LINEUP_FINISH' };
