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
export * from './challenges';

// Import what we need for main state interfaces
import type {
  Player,
  Team,
  MentoringGroup,
  PlayerRelationshipType,
  Promise,
  TransferPlayer,
  Position,
} from './player';
import type { Formation, TeamTactics, SetPieceAssignments } from './match';
import type { DrawingShape, PlaybookItem, UIState } from './ui';
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
import type { Staff, AgentPersonality } from './staff';
import type { TeamFinances, Stadium, SponsorshipDeal } from './finance';
import type { InboxItem } from './communication';
import type { AuthState } from './auth';

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
  matchHistory: unknown[]; // MatchResult[] when match types are properly imported
  youthAcademy: { home: YouthAcademy; away: YouthAcademy };
  staff: { home: Staff; away: Staff };
  stadium: { home: Stadium; away: Stadium };
  sponsorships: { home: SponsorshipDeal | null; away: SponsorshipDeal | null };
  historicalData: readonly HistoricalSeasonRecord[];
  hallOfFame: readonly Player[];
  newsFeed: NewsItem[];
  lastMatchResult: unknown | null; // MatchResult when available
  negotiationData: {
    playerId: string;
    conversation: string[];
    agentPersonality: AgentPersonality;
    offer?: unknown; // Contract offer details
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

// Component Props Types
export interface UnifiedTacticsBoardProps {
  className?: string;
  onSimulateMatch?: (formation: Formation) => void;
  onSaveFormation?: (formation: Formation) => void;
  onAnalyticsView?: () => void;
  onExportFormation?: (formation: Formation) => void;
}

// Action types (comprehensive union type for all possible actions)
export type Action =
  // Auth Actions
  | { type: 'LOGIN_SUCCESS'; payload: unknown } // User type
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SIGNUP_SUCCESS'; payload: unknown } // User type
  | { type: 'SIGNUP_FAILURE'; payload: string }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<unknown> } // Partial<User>
  | { type: 'ADD_FAMILY_ASSOCIATION'; payload: unknown } // FamilyMemberAssociation
  | { type: 'UPDATE_FAMILY_ASSOCIATION'; payload: unknown } // FamilyMemberAssociation
  | { type: 'REMOVE_FAMILY_ASSOCIATION'; payload: string }
  | { type: 'LOAD_FAMILY_ASSOCIATIONS'; payload: unknown[] } // FamilyMemberAssociation[]
  | { type: 'UPDATE_NOTIFICATION_SETTINGS'; payload: Partial<unknown> } // Partial<NotificationSettings>
  | { type: 'REQUEST_PASSWORD_RESET' }
  | { type: 'COMPLETE_PASSWORD_RESET' }
  | { type: 'DEACTIVATE_ACCOUNT' }
  | { type: 'ACTIVATE_ACCOUNT' }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
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
  | { type: 'ADD_DEVELOPMENT_LOG'; payload: { playerId: string; entry: unknown } } // DevelopmentLogEntry
  | { type: 'SET_INDIVIDUAL_TRAINING_FOCUS'; payload: { playerId: string; focus: unknown } } // IndividualTrainingFocus
  | { type: 'ADD_CONTRACT_CLAUSE'; payload: { playerId: string; clauseText: string } }
  | {
      type: 'UPDATE_CONTRACT_CLAUSE';
      payload: { playerId: string; clauseId: string; status: unknown };
    } // ContractClause status
  | { type: 'REMOVE_CONTRACT_CLAUSE'; payload: { playerId: string; clauseId: string } }
  | { type: 'TERMINATE_PLAYER_CONTRACT'; payload: string }
  | { type: 'ADD_COMMUNICATION_LOG'; payload: { playerId: string; entry: unknown } } // CommunicationLogEntry
  | {
      type: 'UPDATE_PLAYER_CHALLENGE_COMPLETION';
      payload: { playerId: string; challengeId: string };
    }
  | {
      type: 'ASSIGN_MEDICAL_TREATMENT';
      payload: { playerId: string; treatment: string; assignedBy: string };
    }
  | { type: 'CLEAR_PLAYER_FOR_TRAINING'; payload: { playerId: string } }

  // Formation & Tactics Actions
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_FORMATION'; payload: Formation }
  | { type: 'UPDATE_FORMATION'; payload: Formation }
  | { type: 'SET_ACTIVE_FORMATION'; payload: { formationId: string; team: Team } }
  | { type: 'CLEAR_FORMATION' }
  | { type: 'ASSIGN_PLAYER_TO_SLOT'; payload: { slotId: string; playerId: string; team: Team } }
  | {
      type: 'UPDATE_PLAYER_POSITION';
      payload: { playerId: string; position: { x: number; y: number } };
    }
  | {
      type: 'UPDATE_PLAYER_POSITION_OPTIMISTIC';
      payload: { playerId: string; position: { x: number; y: number } };
    }
  | { type: 'MOVE_TO_BENCH'; payload: { playerId: string } }
  | { type: 'SET_TEAM_TACTIC'; payload: { team: Team; tactic: unknown; value: unknown } } // TeamTactics properties
  | { type: 'SAVE_CUSTOM_FORMATION'; payload: Formation }
  | { type: 'DELETE_CUSTOM_FORMATION'; payload: string }
  | { type: 'UPDATE_TACTICAL_FAMILIARITY'; payload: { formationId: string; increase: number } }
  | { type: 'SET_SET_PIECE_TAKER'; payload: { team: Team; type: unknown; playerId: string | null } } // SetPieceType
  | { type: 'APPLY_TEAM_TALK_EFFECT'; payload: { team: Team; effect: number } }
  | { type: 'CLEAR_MORALE_BOOSTS'; payload: { team: Team } }

  // UI Actions (extensive set)
  | { type: 'SET_ACTIVE_TEAM_CONTEXT'; payload: unknown } // TeamView
  | { type: 'OPEN_MODAL'; payload: unknown } // ModalType
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_EDITING_PLAYER_ID'; payload: string | null }
  | { type: 'SET_COMPARE_PLAYER_ID'; payload: string | null }
  | { type: 'OPEN_SLOT_ACTION_MENU'; payload: unknown } // SlotActionMenuData
  | { type: 'CLOSE_SLOT_ACTION_MENU' }
  | {
      type: 'RESOLVE_SLOT_ACTION';
      payload: { decision: 'swap' | 'replace' | 'bench' | 'captain' | 'loan' };
    }
  | { type: 'SWAP_PLAYERS'; payload: { sourcePlayerId: string; targetPlayerId: string } }
  | { type: 'TOGGLE_GRID_VISIBILITY' }
  | { type: 'TOGGLE_FORMATION_STRENGTH_VISIBILITY' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_TEAM_KIT'; payload: { team: Team; kit: unknown } } // Partial<TeamKit>
  | { type: 'ADD_NOTIFICATION'; payload: unknown } // Notification without id
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'START_TUTORIAL' }
  | { type: 'END_TUTORIAL' }
  | { type: 'SET_TUTORIAL_STEP'; payload: number }
  | { type: 'SET_ROSTER_SEARCH_QUERY'; payload: string }
  | { type: 'TOGGLE_ROSTER_ROLE_FILTER'; payload: string }
  | { type: 'CLEAR_ROSTER_FILTERS' }

  // Drawing & Playbook Actions
  | { type: 'SET_DRAWING_TOOL'; payload: unknown } // DrawingTool
  | { type: 'SET_DRAWING_COLOR'; payload: string }
  | { type: 'SET_POSITIONING_MODE'; payload: 'free' | 'snap' }
  | { type: 'ADD_DRAWING'; payload: DrawingShape }
  | { type: 'UPDATE_DRAWING'; payload: DrawingShape }
  | { type: 'DELETE_DRAWING'; payload: string }
  | { type: 'UNDO_LAST_DRAWING' }
  | { type: 'CLEAR_DRAWINGS' }
  | { type: 'CREATE_PLAYBOOK_ITEM'; payload: { name: string; category: unknown } } // PlayCategory
  | { type: 'LOAD_PLAYBOOK_ITEM'; payload: string }
  | { type: 'DELETE_PLAYBOOK_ITEM'; payload: string }
  | { type: 'DUPLICATE_PLAYBOOK_ITEM'; payload: string }
  | { type: 'ADD_LIBRARY_PLAY_TO_PLAYBOOK'; payload: PlaybookItem }
  | { type: 'TOGGLE_PLAYBOOK_CATEGORY'; payload: unknown } // PlayCategory
  | { type: 'SET_ACTIVE_STEP'; payload: number }
  | { type: 'ADD_PLAYBOOK_STEP' }
  | { type: 'DELETE_PLAYBOOK_STEP'; payload: number }
  | { type: 'SET_PLAYBOOK_EVENT'; payload: { stepIndex: number; event: unknown } } // PlaybookEvent | null
  | { type: 'ENTER_PRESENTATION_MODE' }
  | { type: 'EXIT_PRESENTATION_MODE' }
  | { type: 'START_ANIMATION' }
  | { type: 'PAUSE_ANIMATION' }
  | { type: 'RESET_ANIMATION' }

  // AI Actions (extensive AI integration)
  | { type: 'SET_AI_PERSONALITY'; payload: unknown } // AIPersonality
  | { type: 'GENERATE_AI_INSIGHT_START' }
  | { type: 'GENERATE_AI_INSIGHT_SUCCESS'; payload: unknown } // AIInsight
  | { type: 'GENERATE_AI_INSIGHT_FAILURE' }
  | { type: 'GENERATE_AI_COMPARISON_START' }
  | { type: 'GENERATE_AI_COMPARISON_SUCCESS'; payload: unknown } // AIComparison
  | { type: 'GENERATE_AI_COMPARISON_FAILURE' }
  | { type: 'SUGGEST_FORMATION_START' }
  | { type: 'SUGGEST_FORMATION_SUCCESS'; payload: unknown } // AISuggestedFormation
  | { type: 'SUGGEST_FORMATION_FAILURE' }
  | { type: 'SEND_CHAT_MESSAGE_START'; payload: unknown } // ChatMessage
  | {
      type: 'SEND_CHAT_MESSAGE_SUCCESS';
      payload: { response: unknown; playerIdsToHighlight: readonly string[] };
    }
  | { type: 'SEND_CHAT_MESSAGE_FAILURE' }

  // Match and simulation Actions
  | { type: 'SIMULATE_MATCH_START' }
  | { type: 'SIMULATE_MATCH_UPDATE'; payload: unknown } // MatchEvent | MatchCommentary
  | { type: 'SIMULATE_MATCH_SUCCESS'; payload: unknown } // MatchResult
  | { type: 'SIMULATE_MATCH_FAILURE' }
  | { type: 'GET_POST_MATCH_REPORT_START' }
  | { type: 'GET_POST_MATCH_REPORT_SUCCESS'; payload: unknown } // AIPostMatchAnalysis
  | { type: 'GET_POST_MATCH_REPORT_FAILURE' }

  // Franchise Management Actions
  | { type: 'ADVANCE_WEEK' }
  | { type: 'ADVANCE_SEASON' }
  | { type: 'SIGN_TRANSFER_PLAYER'; payload: { player: TransferPlayer; team: Team } }
  | { type: 'SELL_PLAYER'; payload: { playerId: string; price: number } }
  | { type: 'GENERATE_TRANSFER_MARKET_PLAYERS' }
  | { type: 'ADD_INBOX_ITEM'; payload: unknown } // InboxItem without id, week, isRead
  | { type: 'MARK_INBOX_ITEM_READ'; payload: string }
  | { type: 'REMOVE_INBOX_ITEM'; payload: string }
  | { type: 'HIRE_STAFF'; payload: { team: Team; type: string; staff: unknown } }
  | { type: 'UPGRADE_STADIUM_FACILITY'; payload: { facility: string; team: Team } }
  | { type: 'SET_SPONSORSHIP_DEAL'; payload: { team: Team; deal: unknown } }
  | {
      type: 'SET_SESSION_DRILL';
      payload: {
        team: Team;
        day: string;
        session: string;
        sessionPart: string;
        drillId: string | null;
      };
    }
  | { type: 'SET_DAY_AS_REST'; payload: { team: Team; day: string } }
  | { type: 'SET_DAY_AS_TRAINING'; payload: { team: Team; day: string } }
  | { type: 'SAVE_TRAINING_TEMPLATE'; payload: { team: Team; name: string } }
  | { type: 'LOAD_TRAINING_TEMPLATE'; payload: { team: Team; templateId: string } }
  | { type: 'DELETE_TRAINING_TEMPLATE'; payload: { templateId: string } }
  | { type: 'ADD_NEWS_ITEM'; payload: unknown }
  | { type: 'MARK_NEWS_READ'; payload: string }
  | { type: 'UPDATE_OBJECTIVE_PROGRESS'; payload: { objectiveId: string; progress: number } }
  | { type: 'COMPLETE_OBJECTIVE'; payload: string }
  | { type: 'ADD_OBJECTIVE'; payload: unknown }
  | { type: 'REQUEST_BOARD_DECISION'; payload: unknown }
  | { type: 'RESOLVE_BOARD_DECISION'; payload: { decisionId: string; approved: boolean } }
  | { type: 'ADD_SKILL_CHALLENGE'; payload: unknown } // SkillChallenge without id
  | { type: 'REMOVE_SKILL_CHALLENGE'; payload: string }
  | { type: 'START_NEGOTIATION'; payload: { playerId: string } }
  | { type: 'SEND_NEGOTIATION_OFFER_START'; payload: { offerText: string } }
  | { type: 'SEND_NEGOTIATION_OFFER_SUCCESS'; payload: { response: { response: string } } }
  | { type: 'END_NEGOTIATION' }
  | {
      type: 'CREATE_MENTORING_GROUP';
      payload: { team: Team; mentorId: string; menteeIds: string[] };
    }
  | { type: 'DISSOLVE_MENTORING_GROUP'; payload: { team: Team; mentorId: string } }

  // Save/Load Actions
  | { type: 'SET_ACTIVE_SAVE_SLOT'; payload: string | null }
  | { type: 'DELETE_SAVE_SLOT'; payload: string }
  | { type: 'CREATE_SAVE_SLOT'; payload: { id: string; name: string } }
  | { type: 'LOAD_PLAYBOOK'; payload: Record<string, PlaybookItem> }

  // Misc Actions
  | { type: 'EXPORT_LINEUP_START' }
  | { type: 'EXPORT_LINEUP_FINISH' }

  // Youth Academy Actions
  | { type: 'INVEST_IN_YOUTH_ACADEMY'; payload: { team: Team } }
  | { type: 'SIGN_YOUTH_PLAYER'; payload: { prospectId: string; team: Team } }
  | { type: 'ADD_YOUTH_PROSPECTS'; payload: { team: Team; prospects: any[] } }
  | {
      type: 'ENROLL_YOUTH_IN_PROGRAM';
      payload: { team: Team; prospectId: string; programId: string };
    }

  // Transfer Market Actions
  | {
      type: 'LOAN_TRANSFER_PLAYER';
      payload: { player: TransferPlayer; team: Team; duration: number };
    }
  | { type: 'SET_TRANSFER_MARKET_FILTER'; payload: { filter: string; value: any } }
  | { type: 'RESET_TRANSFER_FILTERS' }
  | { type: 'OPEN_PLAYER_COMPARISON'; payload: { player1Id: string; player2Id: string } }
  | { type: 'GET_PLAYER_SCOUT_REPORT_START'; payload: { playerId: string } }
  | { type: 'GET_PLAYER_SCOUT_REPORT_SUCCESS'; payload: { report: any } }
  | { type: 'GET_PLAYER_SCOUT_REPORT_FAILURE' }

  // Player Communication Actions
  | { type: 'START_PLAYER_CONVERSATION'; payload: { playerId: string; openingLine?: string } }
  | { type: 'SEND_PLAYER_MESSAGE_START'; payload: { playerId: string; message: any } }
  | {
      type: 'SEND_PLAYER_MESSAGE_SUCCESS';
      payload: { playerId: string; response: any; moraleEffect: number };
    }
  | { type: 'SEND_PLAYER_MESSAGE_FAILURE'; payload: { playerId: string } }

  // Player Training Actions
  | {
      type: 'SET_PLAYER_SESSION_DRILL';
      payload: {
        playerId: string;
        day: string;
        session: string;
        sessionPart: string;
        drillId: string | null;
      };
    }
  | { type: 'SET_PLAYER_DAY_AS_REST'; payload: { playerId: string; day: string } }

  // Opposition Analysis Actions
  | { type: 'GENERATE_OPPOSITION_REPORT_START' }
  | { type: 'GENERATE_OPPOSITION_REPORT_SUCCESS'; payload: any }
  | { type: 'GENERATE_OPPOSITION_REPORT_FAILURE' }

  // AI Development Actions
  | { type: 'GET_AI_DEVELOPMENT_SUMMARY_START' }
  | { type: 'GET_AI_DEVELOPMENT_SUMMARY_SUCCESS'; payload: any }
  | { type: 'GET_AI_DEVELOPMENT_SUMMARY_FAILURE' }

  // Finance Management Actions
  | { type: 'ADD_FEE_ITEM'; payload: { team: string; item: { name: string; amount: number } } }
  | { type: 'REMOVE_FEE_ITEM'; payload: { team: string; itemId: string } }
  | { type: 'ADJUST_BUDGET'; payload: { team: string; category: string; amount: number } }
  | { type: 'GENERATE_FINANCIAL_REPORT'; payload: { report: any } }
  | { type: 'SAVE_MATCH_RESULT'; payload: { matchResult: any } };
