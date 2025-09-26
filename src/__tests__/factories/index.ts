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
  role: {
    id: 'cm',
    name: 'Central Midfielder',
    abbreviation: 'CM',
    category: 'MF' as PositionRole,
    description: 'Central midfielder',
  },
  attributes: {
    speed: 80,
    passing: 85,
    tackling: 70,
    shooting: 75,
    dribbling: 80,
    positioning: 85,
    stamina: 90,
  },
  instructions: [],
  mood: 'Good',
  currentPosition: { x: 50, y: 50 },
  number: 10,
  fitness: 100,
  availability: { status: 'Available' },
  age: 25,
  height: 180,
  weight: 75,
  preferredFoot: 'right',
  nationality: 'Test Country',
  contractExpiry: '2025-12-31',
  marketValue: 1000000,
  wages: 50000,
  form: 'Good',
  morale: 'Good',
  traits: ['Consistent'],
  developmentLog: [],
  stats: {
    appearances: 25,
    goals: 5,
    assists: 10,
    yellowCards: 2,
    redCards: 0,
    minutesPlayed: 2250,
    rating: 7.5,
  },
  historyStats: [],
  injuryHistory: [],
  attributeHistory: [],
  personalityTags: ['professional'],
  strengthsWeaknesses: {
    strengths: ['Passing'],
    weaknesses: ['Heading'],
  },
  notes: 'Test player notes',
  ...overrides,
});

export const createMockFormation = (overrides: Partial<Formation> = {}): Formation => ({
  id: 'test-formation-1',
  name: 'Test Formation 4-4-2',
  description: 'Balanced formation for testing',
  category: 'Balanced',
  positions: [
    // GK
    {
      x: 50,
      y: 10,
      role: {
        id: 'gk',
        name: 'Goalkeeper',
        abbreviation: 'GK',
        category: 'GK',
        description: 'Goalkeeper',
      },
    },
    // Defense
    {
      x: 20,
      y: 30,
      role: {
        id: 'lb',
        name: 'Left Back',
        abbreviation: 'LB',
        category: 'DF',
        description: 'Left back',
      },
    },
    {
      x: 40,
      y: 25,
      role: {
        id: 'cb',
        name: 'Centre Back',
        abbreviation: 'CB',
        category: 'DF',
        description: 'Centre back',
      },
    },
    {
      x: 60,
      y: 25,
      role: {
        id: 'cb',
        name: 'Centre Back',
        abbreviation: 'CB',
        category: 'DF',
        description: 'Centre back',
      },
    },
    {
      x: 80,
      y: 30,
      role: {
        id: 'rb',
        name: 'Right Back',
        abbreviation: 'RB',
        category: 'DF',
        description: 'Right back',
      },
    },
    // Midfield
    {
      x: 20,
      y: 60,
      role: {
        id: 'lm',
        name: 'Left Midfielder',
        abbreviation: 'LM',
        category: 'MF',
        description: 'Left midfielder',
      },
    },
    {
      x: 40,
      y: 50,
      role: {
        id: 'cm',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        category: 'MF',
        description: 'Central midfielder',
      },
    },
    {
      x: 60,
      y: 50,
      role: {
        id: 'cm',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        category: 'MF',
        description: 'Central midfielder',
      },
    },
    {
      x: 80,
      y: 60,
      role: {
        id: 'rm',
        name: 'Right Midfielder',
        abbreviation: 'RM',
        category: 'MF',
        description: 'Right midfielder',
      },
    },
    // Attack
    {
      x: 35,
      y: 85,
      role: {
        id: 'st',
        name: 'Striker',
        abbreviation: 'ST',
        category: 'FW',
        description: 'Striker',
      },
    },
    {
      x: 65,
      y: 85,
      role: {
        id: 'st',
        name: 'Striker',
        abbreviation: 'ST',
        category: 'FW',
        description: 'Striker',
      },
    },
  ],
  isCustom: false,
  createdAt: '2024-01-01T00:00:00Z',
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

export const createMockAuthState = (overrides: Partial<AuthState> = {}): AuthState => ({
  user: null,
  error: null,
  isAuthenticated: false,
  familyAssociations: [],
  ...overrides,
});

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
  selectedPlayers: [],
  tacticalFamiliarity: { '4-4-2': 50 },
  chemistry: {},
  captainIds: { home: null, away: null },
  setPieceTakers: { home: {}, away: {} },
  ...overrides,
});

export const createMockUIState = (overrides: Partial<UIState> = {}): UIState => ({
  theme: 'dark',
  activeModal: null,
  sidebarExpanded: true,
  notifications: [],
  isExportingLineup: false,
  isPresentationMode: false,
  drawingTool: 'select',
  simulationTimeline: [],
  tutorial: {
    isActive: false,
    currentStep: 0,
    completedSteps: [],
  },
  ...overrides,
});

// Helper functions for creating multiple instances
export const createMockPlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockPlayer({
      id: `test-player-${index + 1}`,
      name: `Test Player ${index + 1}`,
      number: index + 1,
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
