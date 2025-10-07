import type {
  User,
  Player,
  Formation,
  PlayerAttributes,
  AuthState,
  TacticsState,
  UIState,
  PositionRole,
} from '../../types';
import type { UserRole } from '../../types/auth';

// Factory function to create consistent test data
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-1',
  email: 'test@example.com',
  role: 'coach' as UserRole,
  firstName: 'Test',
  lastName: 'User',
  notifications: {
    email: true,
    sms: false,
    push: true,
    matchUpdates: true,
    trainingReminders: true,
    emergencyAlerts: true,
    paymentReminders: false,
  },
  timezone: 'America/New_York',
  language: 'en',
  createdAt: '2024-01-01T00:00:00Z',
  lastLoginAt: '2024-01-01T12:00:00Z',
  isActive: true,
  ...overrides,
});

export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'test-player-1',
  name: 'Test Player',
  jerseyNumber: 10,
  age: 25,
  nationality: 'Test Country',
  potential: [70, 90] as readonly [number, number],
  currentPotential: 80,
  roleId: 'cm',
  positionRole: 'MF',
  instructions: {},
  team: 'home' as const,
  teamColor: '#FF0000',
  attributes: {
    speed: 80,
    passing: 85,
    tackling: 70,
    shooting: 75,
    dribbling: 80,
    positioning: 85,
    stamina: 90,
  },
  position: { x: 50, y: 50 },
  availability: { status: 'Available' },
  morale: 'Good',
  form: 'Good',
  stamina: 90,
  developmentLog: [],
  contract: {
    wage: 50000,
    expires: 2025,
    clauses: [],
  },
  stats: {
    goals: 5,
    assists: 10,
    matchesPlayed: 25,
    shotsOnTarget: 15,
    tacklesWon: 20,
    saves: 0,
    passesCompleted: 200,
    passesAttempted: 250,
    careerHistory: [],
  },
  loan: {
    isLoaned: false,
  },
  traits: ['Consistent'],
  notes: 'Test player notes',
  conversationHistory: [],
  attributeHistory: [],
  attributeDevelopmentProgress: {},
  communicationLog: [],
  customTrainingSchedule: null,
  fatigue: 10,
  injuryRisk: 20,
  lastConversationInitiatedWeek: 0,
  moraleBoost: null,
  completedChallenges: [],
  ...overrides,
});

export const createMockFormation = (overrides: Partial<Formation> = {}): Formation => ({
  id: 'test-formation-1',
  name: 'Test Formation 4-4-2',
  description: 'Balanced formation for testing',
  slots: [
    // GK
    {
      id: 'gk-1',
      role: 'Goalkeeper',
      defaultPosition: { x: 50, y: 10 },
      playerId: null,
      roleId: 'gk',
    },
    // Defense
    {
      id: 'lb-1',
      role: 'Left Back',
      defaultPosition: { x: 20, y: 30 },
      playerId: null,
      roleId: 'lb',
    },
    {
      id: 'cb-1',
      role: 'Centre Back',
      defaultPosition: { x: 40, y: 25 },
      playerId: null,
      roleId: 'cb',
    },
    {
      id: 'cb-2',
      role: 'Centre Back',
      defaultPosition: { x: 60, y: 25 },
      playerId: null,
      roleId: 'cb',
    },
    {
      id: 'rb-1',
      role: 'Right Back',
      defaultPosition: { x: 80, y: 30 },
      playerId: null,
      roleId: 'rb',
    },
    // Midfield
    {
      id: 'lm-1',
      role: 'Left Midfielder',
      defaultPosition: { x: 20, y: 60 },
      playerId: null,
      roleId: 'lm',
    },
    {
      id: 'cm-1',
      role: 'Central Midfielder',
      defaultPosition: { x: 40, y: 50 },
      playerId: null,
      roleId: 'cm',
    },
    {
      id: 'cm-2',
      role: 'Central Midfielder',
      defaultPosition: { x: 60, y: 50 },
      playerId: null,
      roleId: 'cm',
    },
    {
      id: 'rm-1',
      role: 'Right Midfielder',
      defaultPosition: { x: 80, y: 60 },
      playerId: null,
      roleId: 'rm',
    },
    // Attack
    {
      id: 'st-1',
      role: 'Striker',
      defaultPosition: { x: 35, y: 85 },
      playerId: null,
      roleId: 'st',
    },
    {
      id: 'st-2',
      role: 'Striker',
      defaultPosition: { x: 65, y: 85 },
      playerId: null,
      roleId: 'st',
    },
  ],
  isCustom: false,
  ...overrides,
});

export const createMockPlayerAttributes = (
  overrides: Partial<PlayerAttributes> = {},
): PlayerAttributes => ({
  speed: 80,
  passing: 85,
  tackling: 70,
  shooting: 75,
  dribbling: 80,
  positioning: 85,
  stamina: 90,
  ...overrides,
});

export const createMockAuthState = (overrides: Partial<AuthState> = {}): AuthState =>
  ({
    user: null,
    error: null,
    isAuthenticated: false,
    familyAssociations: [],
    ...overrides,
  }) as AuthState;

export const createMockTacticsState = (overrides: Partial<TacticsState> = {}): TacticsState => ({
  players: [createMockPlayer()],
  formations: { '4-4-2': createMockFormation() },
  playbook: {},
  activeFormationIds: { home: '4-4-2', away: '4-4-2' },
  teamTactics: {
    home: {
      mentality: 'balanced',
      pressing: 'medium',
      defensiveLine: 'medium',
      attackingWidth: 'medium',
    },
    away: {
      mentality: 'balanced',
      pressing: 'medium',
      defensiveLine: 'medium',
      attackingWidth: 'medium',
    },
  },
  drawings: [],
  tacticalFamiliarity: { '4-4-2': 50 },
  chemistry: {},
  captainIds: { home: null, away: null },
  setPieceTakers: { home: {}, away: {} },
  ...overrides,
});

export const createMockUIState = (overrides: Partial<UIState> = {}): UIState => ({
  theme: 'dark',
  saveSlots: {},
  activeSaveSlotId: null,
  isExportingLineup: false,
  teamKits: {
    home: { primaryColor: '#FF0000', secondaryColor: '#FFFFFF', pattern: 'solid' as const },
    away: { primaryColor: '#0000FF', secondaryColor: '#FFFFFF', pattern: 'solid' as const },
  },
  notifications: [],
  activeTeamContext: 'home',
  activeModal: null,
  editingPlayerId: null,
  playerToCompareId: null,
  slotActionMenuData: null,
  tutorial: {
    isActive: false,
    step: 0,
  },
  playerConversationData: null,
  drawingTool: 'select',
  drawingColor: '#FFFFFF',
  isGridVisible: true,
  isFormationStrengthVisible: false,
  positioningMode: 'free',
  activePlaybookItemId: null,
  activeStepIndex: null,
  isAnimating: false,
  isPaused: false,
  playerInitialPositions: null,
  animationTrails: null,
  isPresentationMode: false,
  setPieceEditor: { isEditing: false, activeTool: null, selectedPlayerId: null },
  rosterSearchQuery: '',
  rosterRoleFilters: [],
  advancedRosterFilters: {} as any,
  transferMarketFilters: {} as any,
  playbookCategories: {},
  settings: { aiPersonality: 'balanced' },
  isLoadingAI: false,
  aiInsight: null,
  isComparingAI: false,
  aiComparisonResult: null,
  isSuggestingFormation: false,
  aiSuggestedFormation: null,
  chatHistory: [],
  isChatProcessing: false,
  highlightedByAIPlayerIds: [],
  isLoadingOppositionReport: false,
  oppositionReport: null,
  isSimulatingMatch: false,
  simulationTimeline: [],
  isLoadingPostMatchReport: false,
  postMatchReport: null,
  isLoadingPressConference: false,
  pressConferenceData: null,
  isLoadingNegotiation: false,
  isLoadingAISubSuggestion: false,
  aiSubSuggestionData: null,
  isScoutingPlayer: false,
  scoutedPlayerId: null,
  scoutReport: null,
  isLoadingConversation: false,
  selectedPlayerId: null,
  isLoadingDevelopmentSummary: false,
  developmentSummary: null,
  isLoadingTeamTalk: false,
  teamTalkData: null,
  pendingPromiseRequest: null,
  ...overrides,
});

// Helper functions for creating multiple instances
export const createMockPlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockPlayer({
      id: `test-player-${index + 1}`,
      name: `Test Player ${index + 1}`,
      jerseyNumber: index + 1,
    }),
  );
};

export const createMockUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockUser({
      id: `test-user-${index + 1}`,
      email: `test${index + 1}@example.com`,
      firstName: `Test${index + 1}`,
    }),
  );
};

export const createMockFormations = (count: number): Formation[] => {
  const formationNames = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2'];
  return Array.from({ length: count }, (_, index) =>
    createMockFormation({
      id: `test-formation-${index + 1}`,
      name: `Test Formation ${formationNames[index] || '4-4-2'}`,
    }),
  );
};
