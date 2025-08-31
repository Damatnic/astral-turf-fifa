

export interface PlayerAttributes {
  speed: number;
  passing: number;
  tackling: number;
  shooting: number;
  dribbling: number;
  positioning: number;
  stamina: number; // 0-100
}

export type PositionRole = 'GK' | 'DF' | 'MF' | 'FW';
export type Team = 'home' | 'away';
export type TeamView = Team | 'both';

export interface PlayerRole {
  id: string;
  name: string;
  abbreviation: string;
  category: PositionRole;
  description: string;
}

export interface PlayerInstruction {
  id:string;
  name: string;
  description: string;
}

export type PlayerMorale = 'Excellent' | 'Good' | 'Okay' | 'Poor' | 'Very Poor';
export type PlayerForm = 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor';
export type PlayerAvailabilityStatus = 'Available' | 'Minor Injury' | 'Major Injury' | 'Suspended' | 'International Duty';
export type PlayerTrait = 'Leader' | 'Ambitious' | 'Loyal' | 'Injury Prone' | 'Consistent' | 'Temperamental';

export interface PlayerAvailability {
    status: PlayerAvailabilityStatus;
    returnDate?: string;
}

export interface DevelopmentLogEntry {
    id: string;
    date: string;
    note: string;
    author: 'User' | 'AI';
}

export interface PlayerHistoryStats {
    season: number;
    club: string;
    matchesPlayed: number;
    goals: number;
    assists: number;
}

export interface PlayerStats {
    goals: number;
    assists: number;
    matchesPlayed: number;
    shotsOnTarget: number;
    tacklesWon: number;
    saves: number;
    passesCompleted: number;
    passesAttempted: number;
    careerHistory: readonly PlayerHistoryStats[];
}

export interface LoanStatus {
    isLoaned: boolean;
    loanedTo?: string;
    loanedFrom?: string;
    wageContribution?: number; // for loans
    loanFee?: number;
    loanStats?: {
      matchesPlayed: number;
      goals: number;
      assists: number;
    };
}

export interface IndividualTrainingFocus {
  attribute: keyof PlayerAttributes;
  intensity: 'normal' | 'high';
}

export interface ChatMessage {
    id:string;
    sender: 'user' | 'ai';
    text: string;
}

export interface AttributeLogEntry {
    week: number;
    attributes: PlayerAttributes;
}

export interface CommunicationLogEntry {
    id: string;
    date: string;
    type: 'Meeting' | 'Phone Call' | 'Email' | 'Text Message';
    notes: string;
    contactPerson: string;
}

export interface ContractClause {
    id: string;
    text: string;
    status: 'Met' | 'Unmet' | 'Waived';
    isCustom: boolean;
}

export interface PlayerContract {
    wage?: number;
    expires?: number; // year
    clauses: ContractClause[];
}

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  age: number;
  nationality: string;
  potential: readonly [number, number];
  currentPotential: number;
  roleId: string;
  instructions: Record<string, string>;
  team: Team;
  teamColor: string;
  attributes: PlayerAttributes;
  position: { x: number; y: number };
  availability: PlayerAvailability;
  morale: PlayerMorale;
  form: PlayerForm;
  stamina: number; // 0-100
  developmentLog: DevelopmentLogEntry[];
  contract: PlayerContract;
  stats: PlayerStats;
  loan: LoanStatus;
  traits: PlayerTrait[];
  notes?: string;
  individualTrainingFocus?: IndividualTrainingFocus | null;
  conversationHistory: ChatMessage[];
  attributeHistory: AttributeLogEntry[];
  attributeDevelopmentProgress: Partial<Record<keyof PlayerAttributes, number>>;
  communicationLog: CommunicationLogEntry[];
  customTrainingSchedule: WeeklySchedule | null;
  fatigue: number; // 0-100
  injuryRisk: number; // 1-100
  lastConversationInitiatedWeek: number;
  moraleBoost: { duration: number; effect: number } | null;
  completedChallenges: string[];
}

export type TransferPlayer = Omit<Player, 'position' | 'teamColor' | 'attributeHistory'> & { askingPrice: number };

export interface YouthProspect extends Omit<Player, 'attributes' | 'potential' | 'currentPotential' | 'age' | 'position' | 'teamColor' | 'conversationHistory' | 'attributeHistory' | 'attributeDevelopmentProgress' > {
    age: 16 | 17 | 18;
    potential: readonly [number, number];
    attributes: { readonly [K in keyof PlayerAttributes]: readonly [number, number] };
    position: { x: number, y: number };
    teamColor: string;
    conversationHistory: ChatMessage[];
}

export interface FormationSlot {
  id: string;
  role: PositionRole;
  defaultPosition: { x: number; y: number };
  playerId: string | null;
}

export interface Formation {
  id:string;
  name: string;
  slots: FormationSlot[];
  isCustom?: boolean;
  notes?: string;
}

export interface AIInsight {
  advantages: string;
  vulnerabilities: string;
  recommendation: string;
}

export interface AIComparison {
    comparison: string;
    recommendation: string;
}

export interface AISuggestedFormation {
    formationName: string;
    playerIds: readonly string[];
    reasoning: string;
}

export interface AITeamTalkResponse {
    options: TeamTalkOption[];
}
export interface TeamTalkOption {
    tone: string;
    message: string;
    moraleEffect: number;
}


export interface AIOppositionReport {
    keyPlayers: string;
    tacticalApproach: string;
    weaknesses: string;
}

export interface AISubstitutionSuggestion {
    playerOutId: string;
    playerInId: string;
    reasoning: string;
}

export interface AIPostMatchAnalysis {
    summary: string;
    keyMoment: string;
    advice: string;
}

export interface AIAgentResponse {
    response: string;
    isDealAccepted: boolean;
}

export interface AIPressConferenceResponse {
    question: string;
    options: readonly {
        text: string;
        outcome: string;
        fanConfidenceEffect: number;
        teamMoraleEffect: number;
    }[];
    narrativeId?: string;
}

export interface AIDevelopmentSummary {
    summary: string;
    strengths: readonly string[];
    areasForImprovement: readonly string[];
}

export interface AIScoutReport {
    strengths: readonly string[];
    weaknesses: readonly string[];
    summary: string;
    potentialFit: string;
    estimatedValue: number;
}

export interface NewsItem {
    id: string;
    date: string;
    title: string;
    content: string;
    type: 'transfer' | 'injury' | 'result' | 'rumor' | 'social_media';
}

export type SlotActionMenuTrigger = 'click' | 'drag';

export interface SlotActionMenuData {
    sourcePlayerId: string;
    targetSlotId: string;
    targetPlayerId?: string | null;
    trigger: SlotActionMenuTrigger;
    position: { x: number; y: number };
}

export type DrawingTool = 'select' | 'arrow' | 'zone' | 'pen' | 'line' | 'text';

export interface DrawingShape {
  id: string;
  tool: DrawingTool;
  color: string;
  points: readonly { x: number; y: number }[];
  text?: string;
}

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
    id: string; // Made mutable for duplication
    name: string;
    category: PlayCategory;
    formationId: string;
    steps: PlaybookStep[];
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export type TeamTacticValue = 'very-defensive' | 'defensive' | 'balanced' | 'attacking' | 'very-attacking' | 'low' | 'medium' | 'high' | 'deep' | 'narrow' | 'wide';

export interface TeamTactics {
    mentality: TeamTacticValue;
    pressing: TeamTacticValue;
    defensiveLine: TeamTacticValue;
    attackingWidth: TeamTacticValue;
}

export type TeamKitPattern = 'solid' | 'stripes' | 'hoops';
export interface TeamKit {
    primaryColor: string;
    secondaryColor: string;
    pattern: TeamKitPattern;
}

export interface AttributeFilter {
    attribute: keyof PlayerAttributes;
    condition: 'gt' | 'lt';
    value: number;
}

export interface AdvancedRosterFilters {
    age: { min: number, max: number };
    availability: readonly PlayerAvailabilityStatus[];
    attributes: readonly AttributeFilter[];
}

export interface TransferMarketFilters {
    name: string;
    position: PositionRole | 'All';
    age: { min: number; max: number };
    potential: { min: number; max: number };
    price: { min: number; max: number };
}

export type AppTheme = 'light' | 'dark';
export type AIPersonality = 'balanced' | 'cautious' | 'attacking' | 'data';

export type TrainingDrillCategory = 'attacking' | 'defending' | 'physical' | 'technical' | 'tactical' | 'set_pieces' | 'warmup' | 'cooldown';
export type TrainingIntensity = 'low' | 'medium' | 'high';

export interface TrainingDrill {
    readonly id: string;
    readonly name: string;
    readonly category: TrainingDrillCategory;
    readonly description: string;
    readonly primaryAttributes: readonly (keyof PlayerAttributes)[];
    readonly secondaryAttributes: readonly (keyof PlayerAttributes)[];
    readonly intensity: TrainingIntensity;
    readonly fatigueEffect: number; // 0-20
    readonly moraleEffect: number; // -2 to 2
    readonly injuryRisk: number; // 0-1
}

export interface TrainingSession {
    warmup: string | null;
    main: string | null;
    cooldown: string | null;
}

export interface DailySchedule {
    morning: TrainingSession;
    afternoon: TrainingSession;
    isRestDay: boolean;
}

export interface WeeklySchedule {
  monday: DailySchedule;
  tuesday: DailySchedule;
  wednesday: DailySchedule;
  thursday: DailySchedule;
  friday: DailySchedule;
  saturday: DailySchedule;
  sunday: DailySchedule;
}

export type CoachSpecialty = 'attacking' | 'defending' | 'balanced' | 'youth_development' | 'technical';

export interface HeadCoach {
    id: string;
    name: string;
    specialty: CoachSpecialty;
    bonus: number;
    cost: number;
}
export interface HeadScout {
    id: string;
    name: string;
    rating: number; // 1-5 stars
    cost: number;
}
export interface HeadOfMedicine {
    id: string;
    name: string;
    injuryPreventionBonus: number; // %
    rehabBonus: number; // %
    cost: number;
}
export interface AssistantManager {
    id: string;
    name: string;
    tacticalKnowledge: number;
    manManagement: number;
    cost: number;
}
export interface GKCoach {
    id: string;
    name: string;
    goalkeepingCoaching: number;
    cost: number;
}
export interface FitnessCoach {
    id: string;
    name: string;
    fitnessCoaching: number;
    cost: number;
}
export interface LoanManager {
    id: string;
    name: string;
    negotiation: number;
    judgingPlayerAbility: number;
    cost: number;
}

export interface Staff {
    coach: HeadCoach | null;
    scout: HeadScout | null;
    medicine: HeadOfMedicine | null;
    assistantManager: AssistantManager | null;
    gkCoach: GKCoach | null;
    fitnessCoach: FitnessCoach | null;
    loanManager: LoanManager | null;
}

export interface FeeItem {
    id: string;
    name: string;
    amount: number;
}
export interface TeamFinances {
    transferBudget: number;
    wageBudget: number;
    sponsorshipIncome: number;
    matchdayIncome: number;
    seasonalFees: FeeItem[];
    expenses: {
        playerWages: number;
        staffWages: number;
        stadiumMaintenance: number;
        travel: number;
    };
    income: {
        ticketSales: number;
        sponsorship: number;
        prizeMoney: number;
    }
}

export interface MatchEvent {
    minute: number;
    type: 'Goal' | 'Yellow Card' | 'Red Card' | 'Injury';
    team: Team;
    playerName: string;
    description: string;
    injuryType?: 'Minor Injury' | 'Major Injury';
    assisterName?: string;
}

export interface MatchCommentary {
    minute: number;
    text: string;
}

export interface MatchResult {
    homeScore: number;
    awayScore: number;
    events: MatchEvent[];
    commentaryLog: MatchCommentary[];
    isRivalry: boolean;
    playerStats: Record<string, Partial<PlayerStats>>;
}

export type InboxItemPayload = {
  offer?: {
    type: 'transfer_offer' | 'loan_offer';
    fromClub: string;
    playerId: string;
    value: number;
    wageContribution?: number; // for loans
  }
  conversationRequest?: {
    playerId: string;
    reason: string;
  }
}

export interface LoanReport {
    playerId: string;
    report: string;
}

export interface InboxItem {
    id: string;
    week: number;
    type: 'match' | 'injury' | 'transfer' | 'contract' | 'training' | 'award' | 'finance' | 'objective' | 'conversation' | 'social_media' | 'transfer_offer' | 'loan_offer' | 'scout_report' | 'loan_report' | 'mentoring';
    title: string;
    content: string;
    isRead: boolean;
    payload?: InboxItemPayload | LoanReport;
}

export interface SaveSlot {
    id: string;
    name: string;
    lastSaved: string;
    appVersion: string;
}

export interface YouthAcademy {
    level: number;
    prospects: YouthProspect[];
    lastGeneratedWeek: number;
}

export interface Stadium {
    capacity: number;
    trainingFacilitiesLevel: number;
    youthFacilitiesLevel: number;
}

export interface SponsorshipDeal {
    id: string;
    name: string;
    weeklyIncome: number;
    perWinBonus: number;
}

export interface LeagueTeam {
    name: string;
    isUser: boolean;
    strength: number; // 1-100 overall rating
}
export interface LeagueTableEntry {
    teamName: string;
    isUserTeam: boolean;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
}
export interface Fixture {
    week: number;
    homeTeam: string;
    awayTeam: string;
}

export interface Season {
    year: number;
    leagueTeams: readonly LeagueTeam[];
    leagueTable: Record<string, LeagueTableEntry>;
    fixtures: readonly Fixture[];
}

export interface HistoricalSeasonRecord {
    season: number;
    champions: string;
    userPosition: number;
    topScorer: { name: string, goals: number } | null;
}

export interface BoardObjective {
    id: string;
    description: string;
    isMet: boolean;
    isCritical: boolean;
}

export interface Manager {
    name: string;
    reputation: number; // 1-100
    trophyCabinet: readonly string[];
}

export type AgentPersonality = 'standard' | 'greedy' | 'loyal';

export type ModalType = 'editPlayer' | 'comparePlayer' | 'slotActionMenu' | 'chat' | 'customFormationEditor' | 'loadProject' | 'matchSimulator' | 'postMatchReport' | 'contractNegotiation' | 'pressConference' | 'aiSubSuggestion' | 'playerConversation' | 'interactiveTutorial' | 'scouting' | 'sponsorships' | 'teamTalk' | 'seasonEndSummary' | 'playbookLibrary';

export type SetPieceType = 'left_corner' | 'right_corner' | 'short_free_kick' | 'long_free_kick' | 'penalty';
export type SetPieceAssignments = Partial<Record<SetPieceType, string | null>>;

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
  setPieceTakers: { home: SetPieceAssignments, away: SetPieceAssignments };
}

export interface MentoringGroup {
    mentorId: string;
    menteeIds: string[];
}
export type PlayerRelationshipType = 'friendship' | 'rivalry';

export interface PressNarrative {
    id: string;
    title: string;
    content: string;
    tone: 'positive' | 'negative' | 'neutral';
    weekGenerated: number;
}

export interface ScoutingAssignment {
    opponentName: string;
    dueWeek: number;
    report: AIOppositionReport | null;
}

export interface SeasonAwards {
    champion: string;
    userPosition: number;
    playerOfTheSeason: { id: string, name: string };
    youngPlayerOfTheSeason: { id: string, name: string };
    topScorer: { id: string, name: string, goals: number };
    teamOfTheSeason: (string | null)[]; // Array of player IDs for a 4-4-2
}

export type PromiseType = 'playing_time';
export type PromiseStatus = 'active' | 'kept' | 'broken';
export interface Promise {
    id: string;
    playerId: string;
    type: PromiseType;
    status: PromiseStatus;
    startWeek: number;
    endWeek: number;
}
export interface PromiseRequest {
    type: PromiseType;
    description: string;
}

export interface TrainingPlanTemplate {
    id: string;
    name: string;
    schedule: WeeklySchedule;
    isDefault?: boolean;
}

export interface SkillChallenge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

export interface FranchiseState {
  gameWeek: number;
  season: Season;
  manager: Manager;
  boardObjectives: readonly BoardObjective[];
  jobSecurity: number; // 0-100
  fanConfidence: number; // 0-100
  finances: { home: TeamFinances, away: TeamFinances };
  trainingSchedule: { home: WeeklySchedule, away: WeeklySchedule };
  inbox: InboxItem[];
  transferMarket: {
      forSale: TransferPlayer[],
      forLoan: Player[],
      freeAgents: Player[],
  };
  matchHistory: MatchResult[];
  youthAcademy: { home: YouthAcademy, away: YouthAcademy };
  staff: { home: Staff, away: Staff };
  stadium: { home: Stadium, away: Stadium };
  sponsorships: { home: SponsorshipDeal | null, away: SponsorshipDeal | null };
  historicalData: readonly HistoricalSeasonRecord[];
  hallOfFame: readonly Player[];
  newsFeed: NewsItem[];
  lastMatchResult: MatchResult | null;
  negotiationData: {
      playerId: string;
      conversation: string[];
      agentPersonality: AgentPersonality;
  } | null;
  mentoringGroups: { home: MentoringGroup[], away: MentoringGroup[] };
  relationships: Record<string, Record<string, PlayerRelationshipType>>;
  scoutingAssignments: ScoutingAssignment[];
  pressNarratives: PressNarrative[];
  lastSeasonAwards: SeasonAwards | null;
  promises: Promise[];
  trainingPlanTemplates: Record<string, TrainingPlanTemplate>;
  skillChallenges: SkillChallenge[];
}

export interface UIState {
  // App Meta
  theme: AppTheme;
  saveSlots: Record<string, SaveSlot>;
  activeSaveSlotId: string | null;
  isExportingLineup: boolean;
  teamKits: { home: TeamKit, away: TeamKit };
  notifications: Notification[];
  activeTeamContext: TeamView;

  // Modals & UI State
  activeModal: null | ModalType;
  editingPlayerId: string | null;
  playerToCompareId: string | null;
  slotActionMenuData: SlotActionMenuData | null;
  tutorial: {
      isActive: boolean;
      step: number;
  };
  playerConversationData: {
      playerId: string;
  } | null;

  // Drawing & Animation
  drawingTool: DrawingTool;
  drawingColor: string;
  isGridVisible: boolean;
  isFormationStrengthVisible: boolean;
  positioningMode: 'free' | 'snap'; // New field for positioning mode
  activePlaybookItemId: string | null;
  activeStepIndex: number | null;
  isAnimating: boolean;
  isPaused: boolean;
  playerInitialPositions: Record<string, { x: number, y: number }> | null;
  animationTrails: readonly { playerId: string, points: readonly {x: number, y: number}[], color: string }[] | null;
  isPresentationMode: boolean;
  setPieceEditor: {
      isEditing: boolean;
      activeTool: 'player_run' | 'ball_path' | null;
      selectedPlayerId: string | null;
  };

  // Filtering & Search
  rosterSearchQuery: string;
  rosterRoleFilters: readonly PositionRole[];
  advancedRosterFilters: AdvancedRosterFilters;
  transferMarketFilters: TransferMarketFilters;
  playbookCategories: Record<string, boolean>;

  // AI State
  settings: {
    aiPersonality: AIPersonality;
  };
  isLoadingAI: boolean; // Generic loader
  aiInsight: AIInsight | null;
  isComparingAI: boolean;
  aiComparisonResult: AIComparison | null;
  isSuggestingFormation: boolean;
  aiSuggestedFormation: AISuggestedFormation | null;
  chatHistory: ChatMessage[];
  isChatProcessing: boolean;
  highlightedByAIPlayerIds: string[];
  isLoadingOppositionReport: boolean;
  oppositionReport: AIOppositionReport | null;
  isSimulatingMatch: boolean;
  simulationTimeline: (MatchEvent | MatchCommentary)[];
  isLoadingPostMatchReport: boolean;
  postMatchReport: AIPostMatchAnalysis | null;
  isLoadingPressConference: boolean;
  pressConferenceData: AIPressConferenceResponse | null;
  isLoadingNegotiation: boolean;
  isLoadingAISubSuggestion: boolean;
  aiSubSuggestionData: AISubstitutionSuggestion | null;
  isScoutingPlayer: boolean;
  scoutedPlayerId: string | null;
  scoutReport: AIScoutReport | null;
  isLoadingConversation: boolean;
  selectedPlayerId: string | null;
  isLoadingDevelopmentSummary: boolean;
  developmentSummary: AIDevelopmentSummary | null;
  isLoadingTeamTalk: boolean;
  teamTalkData: AITeamTalkResponse | null;
  pendingPromiseRequest: PromiseRequest | null;
}

export interface User {
  id: string;
  email: string;
  role: 'coach' | 'player';
  // For players, this links to their player data
  playerId?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
}

export interface RootState {
    auth: AuthState;
    tactics: TacticsState;
    franchise: FranchiseState;
    ui: UIState;
}

export type Action =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SIGNUP_SUCCESS'; payload: User }
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
  | { type: 'ADD_DEVELOPMENT_LOG'; payload: { playerId: string; entry: Omit<DevelopmentLogEntry, 'id'> } }
  | { type: 'SET_INDIVIDUAL_TRAINING_FOCUS'; payload: { playerId: string; focus: IndividualTrainingFocus | null } }
  | { type: 'ADD_CONTRACT_CLAUSE'; payload: { playerId: string, clauseText: string } }
  | { type: 'UPDATE_CONTRACT_CLAUSE'; payload: { playerId: string, clauseId: string, status: ContractClause['status'] } }
  | { type: 'REMOVE_CONTRACT_CLAUSE'; payload: { playerId: string, clauseId: string } }
  | { type: 'TERMINATE_PLAYER_CONTRACT'; payload: string }
  | { type: 'ADD_COMMUNICATION_LOG'; payload: { playerId: string; entry: Omit<CommunicationLogEntry, 'id' | 'date'> } }
  | { type: 'UPDATE_PLAYER_CHALLENGE_COMPLETION'; payload: { playerId: string, challengeId: string } }
  // Formation & Tactics Actions
  | { type: 'SET_ACTIVE_FORMATION'; payload: { formationId: string; team: Team } }
  | { type: 'CLEAR_FORMATION' }
  | { type: 'ASSIGN_PLAYER_TO_SLOT'; payload: { slotId: string; playerId: string, team: Team } }
  | { type: 'UPDATE_PLAYER_POSITION'; payload: { playerId: string; position: { x: number; y: number } } }
  | { type: 'SET_TEAM_TACTIC'; payload: { team: Team; tactic: keyof TeamTactics; value: TeamTacticValue } }
  | { type: 'SAVE_CUSTOM_FORMATION', payload: Formation }
  | { type: 'DELETE_CUSTOM_FORMATION', payload: string }
  | { type: 'UPDATE_TACTICAL_FAMILIARITY'; payload: { formationId: string; increase: number } }
  | { type: 'SET_SET_PIECE_TAKER'; payload: { team: Team, type: SetPieceType, playerId: string | null } }
  | { type: 'APPLY_TEAM_TALK_EFFECT'; payload: { team: Team, effect: number } }
  | { type: 'CLEAR_MORALE_BOOSTS'; payload: { team: Team } }
  // UI Actions
  | { type: 'SET_ACTIVE_TEAM_CONTEXT'; payload: TeamView }
  | { type: 'OPEN_MODAL'; payload: UIState['activeModal'] }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_EDITING_PLAYER_ID'; payload: string | null }
  | { type: 'SET_COMPARE_PLAYER_ID'; payload: string | null }
  | { type: 'OPEN_SLOT_ACTION_MENU'; payload: SlotActionMenuData }
  | { type: 'CLOSE_SLOT_ACTION_MENU' }
  | { type: 'RESOLVE_SLOT_ACTION'; payload: { decision: 'swap' | 'replace' | 'bench' | 'captain' | 'loan' } }
  | { type: 'SWAP_PLAYERS'; payload: { sourcePlayerId: string; targetPlayerId: string } }
  | { type: 'TOGGLE_GRID_VISIBILITY' }
  | { type: 'TOGGLE_FORMATION_STRENGTH_VISIBILITY' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_TEAM_KIT'; payload: { team: Team; kit: Partial<TeamKit> } }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'START_TUTORIAL' }
  | { type: 'END_TUTORIAL' }
  | { type: 'SET_TUTORIAL_STEP'; payload: number }
  | { type: 'ENTER_SET_PIECE_EDITOR', payload: string }
  | { type: 'EXIT_SET_PIECE_EDITOR' }
  | { type: 'SET_SET_PIECE_TOOL', payload: 'player_run' | 'ball_path' | null }
  | { type: 'SET_SET_PIECE_PLAYER', payload: string | null }
  // Drawing & Playbook Actions
  | { type: 'SET_DRAWING_TOOL'; payload: DrawingTool }
  | { type: 'SET_DRAWING_COLOR'; payload: string }
  | { type: 'SET_POSITIONING_MODE'; payload: 'free' | 'snap' }
  | { type: 'ADD_DRAWING'; payload: DrawingShape }
  | { type: 'UNDO_LAST_DRAWING' }
  | { type: 'CLEAR_DRAWINGS' }
  | { type: 'CREATE_PLAYBOOK_ITEM'; payload: { name: string; category: PlayCategory } }
  | { type: 'LOAD_PLAYBOOK_ITEM'; payload: string }
  | { type: 'DELETE_PLAYBOOK_ITEM'; payload: string }
  | { type: 'DUPLICATE_PLAYBOOK_ITEM'; payload: string }
  | { type: 'ADD_LIBRARY_PLAY_TO_PLAYBOOK'; payload: PlaybookItem }
  | { type: 'TOGGLE_PLAYBOOK_CATEGORY'; payload: PlayCategory }
  | { type: 'SET_ACTIVE_STEP'; payload: number }
  | { type: 'ADD_PLAYBOOK_STEP' }
  | { type: 'DELETE_PLAYBOOK_STEP'; payload: number }
  | { type: 'SET_PLAYBOOK_EVENT'; payload: { stepIndex: number; event: PlaybookEvent | null } }
  | { type: 'ENTER_PRESENTATION_MODE' }
  | { type: 'EXIT_PRESENTATION_MODE' }
  | { type: 'START_ANIMATION' }
  | { type: 'PAUSE_ANIMATION' }
  | { type: 'RESET_ANIMATION' }
  | { type: 'SET_PLAYER_RUN'; payload: { stepId: string, playerId: string, points: {x:number, y:number}[] } }
  | { type: 'SET_BALL_PATH'; payload: { stepId: string, points: {x:number, y:number}[] } }
  // Roster Filtering
  | { type: 'SET_ROSTER_SEARCH_QUERY'; payload: string }
  | { type: 'TOGGLE_ROSTER_ROLE_FILTER'; payload: PositionRole }
  | { type: 'SET_ADVANCED_ROSTER_FILTERS'; payload: Partial<AdvancedRosterFilters> }
  | { type: 'ADD_ATTRIBUTE_FILTER'; payload: AttributeFilter }
  | { type: 'REMOVE_ATTRIBUTE_FILTER'; payload: number }
  | { type: 'CLEAR_ROSTER_FILTERS' }
  | { type: 'SET_TRANSFER_MARKET_FILTER'; payload: { filter: keyof UIState['transferMarketFilters'], value: any } }
  // AI Actions
  | { type: 'SET_AI_PERSONALITY'; payload: AIPersonality }
  | { type: 'GENERATE_AI_INSIGHT_START' }
  | { type: 'GENERATE_AI_INSIGHT_SUCCESS'; payload: AIInsight }
  | { type: 'GENERATE_AI_INSIGHT_FAILURE' }
  | { type: 'GENERATE_AI_COMPARISON_START' }
  | { type: 'GENERATE_AI_COMPARISON_SUCCESS'; payload: AIComparison }
  | { type: 'GENERATE_AI_COMPARISON_FAILURE' }
  | { type: 'SUGGEST_FORMATION_START' }
  | { type: 'SUGGEST_FORMATION_SUCCESS'; payload: AISuggestedFormation }
  | { type: 'SUGGEST_FORMATION_FAILURE' }
  | { type: 'SEND_CHAT_MESSAGE_START'; payload: ChatMessage }
  | { type: 'SEND_CHAT_MESSAGE_SUCCESS'; payload: { response: ChatMessage, playerIdsToHighlight: readonly string[] } }
  | { type: 'SEND_CHAT_MESSAGE_FAILURE' }
  | { type: 'GENERATE_OPPOSITION_REPORT_START' }
  | { type: 'GENERATE_OPPOSITION_REPORT_SUCCESS'; payload: AIOppositionReport }
  | { type: 'GENERATE_OPPOSITION_REPORT_FAILURE' }
  | { type: 'GET_AI_SUB_SUGGESTION_START' }
  | { type: 'GET_AI_SUB_SUGGESTION_SUCCESS'; payload: AISubstitutionSuggestion }
  | { type: 'GET_AI_SUB_SUGGESTION_FAILURE' }
  | { type: 'GET_PRESS_CONFERENCE_QUESTIONS_START' }
  | { type: 'GET_PRESS_CONFERENCE_QUESTIONS_SUCCESS'; payload: AIPressConferenceResponse }
  | { type: 'GET_PRESS_CONFERENCE_QUESTIONS_FAILURE' }
  | { type: 'RESOLVE_PRESS_CONFERENCE_OPTION'; payload: { fanConfidenceEffect: number, teamMoraleEffect: number, narrativeId?: string }}
  | { type: 'GET_PLAYER_SCOUT_REPORT_START'; payload: { playerId: string } }
  | { type: 'GET_PLAYER_SCOUT_REPORT_SUCCESS'; payload: { report: AIScoutReport } }
  | { type: 'GET_PLAYER_SCOUT_REPORT_FAILURE' }
  | { type: 'CLOSE_SCOUT_REPORT' }
  | { type: 'GET_AI_DEVELOPMENT_SUMMARY_START' }
  | { type: 'GET_AI_DEVELOPMENT_SUMMARY_SUCCESS', payload: AIDevelopmentSummary }
  | { type: 'GET_AI_DEVELOPMENT_SUMMARY_FAILURE' }
  | { type: 'GET_TEAM_TALK_OPTIONS_START' }
  | { type: 'GET_TEAM_TALK_OPTIONS_SUCCESS'; payload: AITeamTalkResponse }
  | { type: 'GET_TEAM_TALK_OPTIONS_FAILURE' }
  // Player Conversation
  | { type: 'START_PLAYER_CONVERSATION'; payload: { playerId: string, openingLine?: string } }
  | { type: 'SEND_PLAYER_MESSAGE_START'; payload: { playerId: string; message: ChatMessage } }
  | { type: 'SEND_PLAYER_MESSAGE_SUCCESS'; payload: { playerId: string; response: ChatMessage; moraleEffect: number, promiseRequest?: PromiseRequest } }
  | { type: 'SEND_PLAYER_MESSAGE_FAILURE'; payload: { playerId: string; } }
  // Negotiation Actions
  | { type: 'START_NEGOTIATION'; payload: { playerId: string } }
  | { type: 'SEND_NEGOTIATION_OFFER_START'; payload: { offerText: string } }
  | { type: 'SEND_NEGOTIATION_OFFER_SUCCESS'; payload: { response: AIAgentResponse } }
  | { type: 'SEND_NEGOTIATION_OFFER_FAILURE' }
  | { type: 'ACCEPT_NEGOTIATION_DEAL'; payload: { playerId: string, newContract: any } }
  | { type: 'END_NEGOTIATION' }
  // Franchise Actions
  | { type: 'ADVANCE_WEEK' }
  | { type: 'ADVANCE_SEASON' }
  | { type: 'SET_SESSION_DRILL'; payload: { team: Team, day: keyof WeeklySchedule, session: 'morning' | 'afternoon', sessionPart: 'warmup' | 'main' | 'cooldown', drillId: string | null } }
  | { type: 'SET_DAY_AS_REST'; payload: { team: Team, day: keyof WeeklySchedule } }
  | { type: 'SET_DAY_AS_TRAINING'; payload: { team: Team, day: keyof WeeklySchedule } }
  | { type: 'SAVE_TRAINING_TEMPLATE'; payload: { team: Team; name: string } }
  | { type: 'LOAD_TRAINING_TEMPLATE'; payload: { team: Team; templateId: string } }
  | { type: 'DELETE_TRAINING_TEMPLATE'; payload: { templateId: string } }
  | { type: 'ADD_SKILL_CHALLENGE'; payload: Omit<SkillChallenge, 'id'> }
  | { type: 'REMOVE_SKILL_CHALLENGE'; payload: string }
  | { type: 'SET_PLAYER_TRAINING_OVERRIDE'; payload: { playerId: string, enabled: boolean } }
  | { type: 'SET_PLAYER_SESSION_DRILL'; payload: { playerId: string, day: keyof WeeklySchedule, session: 'morning' | 'afternoon', sessionPart: 'warmup' | 'main' | 'cooldown', drillId: string | null } }
  | { type: 'SET_PLAYER_DAY_AS_REST'; payload: { playerId: string, day: keyof WeeklySchedule } }
  | { type: 'SET_PLAYER_DAY_AS_TRAINING'; payload: { playerId: string, day: keyof WeeklySchedule } }
  | { type: 'SIMULATE_MATCH_START' }
  | { type: 'SIMULATE_MATCH_UPDATE'; payload: MatchEvent | MatchCommentary }
  | { type: 'SIMULATE_MATCH_SUCCESS'; payload: MatchResult }
  | { type: 'SIMULATE_MATCH_FAILURE' }
  | { type: 'GET_POST_MATCH_REPORT_START' }
  | { type: 'GET_POST_MATCH_REPORT_SUCCESS'; payload: AIPostMatchAnalysis }
  | { type: 'GET_POST_MATCH_REPORT_FAILURE' }
  | { type: 'SIGN_TRANSFER_PLAYER'; payload: { player: TransferPlayer, team: Team } }
  | { type: 'SELL_PLAYER'; payload: { playerId: string, price: number } }
  | { type: 'GENERATE_TRANSFER_MARKET_PLAYERS' }
  | { type: 'ADD_INBOX_ITEM'; payload: Omit<InboxItem, 'id'|'week'|'isRead'> }
  | { type: 'MARK_INBOX_ITEM_READ'; payload: string }
  | { type: 'REMOVE_INBOX_ITEM', payload: string }
  | { type: 'ACCEPT_TRANSFER_OFFER'; payload: { inboxId: string, playerId: string, price: number } }
  | { type: 'ACCEPT_LOAN_OFFER'; payload: { inboxId: string, playerId: string, fee: number, wageContribution: number } }
  | { type: 'INVEST_IN_YOUTH_ACADEMY'; payload: { team: Team } }
  | { type: 'SIGN_YOUTH_PLAYER'; payload: { prospectId: string, team: Team } }
  | { type: 'HIRE_STAFF'; payload: { staff: any, team: Team, type: 'coach' | 'scout' | 'medicine' | 'assistantManager' | 'gkCoach' | 'fitnessCoach' | 'loanManager' } }
  | { type: 'LOAN_PLAYER'; payload: { playerId: string; fee: number; wageContribution: number } }
  | { type: 'RECALL_PLAYER'; payload: { playerId: string } }
  | { type: 'SIGN_LOAN_PLAYER'; payload: { player: Player; fee: number, wageContribution: number } }
  | { type: 'UPGRADE_STADIUM_FACILITY'; payload: { facility: keyof Omit<Stadium, 'capacity'>, team: Team } }
  | { type: 'SET_SPONSORSHIP_DEAL'; payload: { deal: SponsorshipDeal, team: Team } }
  | { type: 'ADD_NEWS_ITEM'; payload: Omit<NewsItem, 'id'|'date'> }
  | { type: 'RECOVER_STAMINA' }
  | { type: 'CREATE_MENTORING_GROUP'; payload: { team: Team, mentorId: string, menteeIds: string[] } }
  | { type: 'DISSOLVE_MENTORING_GROUP'; payload: { team: Team, mentorId: string } }
  | { type: 'DISPATCH_SCOUT'; payload: { opponentName: string } }
  | { type: 'STORE_SCOUT_REPORT'; payload: { opponentName: string, report: AIOppositionReport } }
  | { type: 'ADD_FEE_ITEM'; payload: { team: Team, item: Omit<FeeItem, 'id'> } }
  | { type: 'UPDATE_FEE_ITEM'; payload: { team: Team, item: FeeItem } }
  | { type: 'REMOVE_FEE_ITEM'; payload: { team: Team, itemId: string } }
  | { type: 'MAKE_PROMISE'; payload: { promise: Omit<Promise, 'id' | 'status'> } }
  | { type: 'CLEAR_PROMISE_REQUEST' }
  // Save/Load
  | { type: 'SET_ACTIVE_SAVE_SLOT'; payload: string | null }
  | { type: 'DELETE_SAVE_SLOT'; payload: string }
  | { type: 'CREATE_SAVE_SLOT'; payload: { id: string; name: string } }
  | { type: 'LOAD_PLAYBOOK'; payload: Record<string, PlaybookItem> }
  // Misc
  | { type: 'EXPORT_LINEUP_START' }
  | { type: 'EXPORT_LINEUP_FINISH' };