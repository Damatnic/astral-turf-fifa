import type {
  Player,
  PlayerAttributes,
  PlayerStats,
  PlayerAvailability,
  PlayerMorale,
  PlayerForm,
  PlayerContract,
  LoanStatus,
  DevelopmentLogEntry,
  ChatMessage,
  AttributeLogEntry,
  CommunicationLogEntry,
} from '../../types';

/**
 * Complete Player attribute defaults
 */
const DEFAULT_ATTRIBUTES: PlayerAttributes = {
  speed: 75,
  passing: 75,
  shooting: 75,
  dribbling: 75,
  positioning: 75,
  stamina: 75,
  tackling: 75,
};

/**
 * Complete Player stats defaults
 */
const DEFAULT_STATS: PlayerStats = {
  goals: 0,
  assists: 0,
  matchesPlayed: 0,
  shotsOnTarget: 0,
  tacklesWon: 0,
  saves: 0,
  passesCompleted: 0,
  passesAttempted: 0,
  careerHistory: [],
};

const DEFAULT_AVAILABILITY: PlayerAvailability = {
  status: 'Available',
};

const DEFAULT_CONTRACT: PlayerContract = {
  clauses: [],
};

const DEFAULT_LOAN: LoanStatus = {
  isLoaned: false,
};

/**
 * Creates a complete mock Player object with all required properties
 * Useful for testing to avoid incomplete Player type errors
 *
 * @param overrides - Partial player properties to override defaults
 * @returns Complete Player object
 *
 * @example
 * const striker = createMockPlayer({
 *   name: 'Test Striker',
 *   roleId: 'striker',
 *   attributes: { shooting: 90, speed: 85 }
 * });
 */
export const createMockPlayer = (overrides?: Partial<Player>): Player => {
  const basePlayer: Player = {
    id: `player-${Math.random().toString(36).substring(2, 11)}`,
    name: 'Test Player',
    jerseyNumber: 10,
    age: 25,
    nationality: 'England',
    potential: [70, 90] as const,
    currentPotential: 80,
    instructions: {},
    roleId: 'midfielder',
    team: 'home',
    teamColor: '#3b82f6',
    position: { x: 50, y: 50 },
    availability: { ...DEFAULT_AVAILABILITY },
    morale: 'Good' as PlayerMorale,
    form: 'Average' as PlayerForm,
    stamina: 100,
    developmentLog: [] as DevelopmentLogEntry[],
    contract: { ...DEFAULT_CONTRACT },
    stats: { ...DEFAULT_STATS },
    loan: { ...DEFAULT_LOAN },
    traits: [],
    conversationHistory: [] as ChatMessage[],
    attributeHistory: [] as AttributeLogEntry[],
    attributeDevelopmentProgress: {},
    communicationLog: [] as CommunicationLogEntry[],
    customTrainingSchedule: null,
    fatigue: 0,
    injuryRisk: 10,
    lastConversationInitiatedWeek: 0,
    moraleBoost: null,
    completedChallenges: [],
    attributes: { ...DEFAULT_ATTRIBUTES },
  };

  // Merge overrides
  const player = {
    ...basePlayer,
    ...overrides,
  };

  // Merge nested objects properly
  if (overrides?.attributes) {
    player.attributes = {
      ...DEFAULT_ATTRIBUTES,
      ...overrides.attributes,
    };
  }

  if (overrides?.stats) {
    player.stats = {
      ...DEFAULT_STATS,
      ...overrides.stats,
    };
  }

  if (overrides?.availability) {
    player.availability = {
      ...DEFAULT_AVAILABILITY,
      ...overrides.availability,
    };
  }

  if (overrides?.contract) {
    player.contract = {
      ...DEFAULT_CONTRACT,
      ...overrides.contract,
    };
  }

  if (overrides?.loan) {
    player.loan = {
      ...DEFAULT_LOAN,
      ...overrides.loan,
    };
  }

  return player;
};

/**
 * Creates multiple mock players at once
 *
 * @param count - Number of players to create
 * @param overrides - Partial player properties to apply to all players
 * @returns Array of complete Player objects
 *
 * @example
 * const squad = createMockPlayers(11, { team: 'home' });
 */
export const createMockPlayers = (count: number, overrides?: Partial<Player>): Player[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockPlayer({
      ...overrides,
      name: `${overrides?.name || 'Test Player'} ${index + 1}`,
      jerseyNumber: (overrides?.jerseyNumber || 1) + index,
    })
  );
};

/**
 * Creates a mock player for a specific position role
 * with attributes tuned for that role
 *
 * @param roleId - Position role ID
 * @param overrides - Additional overrides
 * @returns Player optimized for the given role
 *
 * @example
 * const goalkeeper = createMockPlayerByRole('goalkeeper');
 * const striker = createMockPlayerByRole('striker', { name: 'Goal Machine' });
 */
export const createMockPlayerByRole = (roleId: string, overrides?: Partial<Player>): Player => {
  const roleAttributes: Record<string, Partial<PlayerAttributes>> = {
    goalkeeper: {
      positioning: 85,
      tackling: 60,
      speed: 60,
      passing: 65,
      shooting: 40,
      dribbling: 50,
      stamina: 80,
    },
    defender: {
      positioning: 80,
      tackling: 85,
      speed: 70,
      passing: 70,
      shooting: 50,
      dribbling: 60,
      stamina: 80,
    },
    'center-back': {
      positioning: 85,
      tackling: 87,
      speed: 68,
      passing: 72,
      shooting: 45,
      dribbling: 58,
      stamina: 85,
    },
    'full-back': {
      positioning: 78,
      tackling: 80,
      speed: 82,
      passing: 75,
      shooting: 55,
      dribbling: 72,
      stamina: 85,
    },
    midfielder: {
      passing: 85,
      dribbling: 80,
      speed: 75,
      positioning: 75,
      tackling: 70,
      shooting: 70,
      stamina: 85,
    },
    'central-midfielder': {
      passing: 88,
      dribbling: 82,
      speed: 75,
      positioning: 78,
      tackling: 75,
      shooting: 72,
      stamina: 88,
    },
    'attacking-midfielder': {
      passing: 87,
      dribbling: 88,
      shooting: 82,
      speed: 80,
      positioning: 75,
      tackling: 60,
      stamina: 80,
    },
    'defensive-midfielder': {
      passing: 82,
      positioning: 82,
      tackling: 87,
      speed: 72,
      dribbling: 75,
      shooting: 65,
      stamina: 88,
    },
    winger: {
      speed: 90,
      dribbling: 88,
      passing: 78,
      shooting: 75,
      positioning: 70,
      tackling: 50,
      stamina: 85,
    },
    forward: {
      shooting: 88,
      speed: 85,
      dribbling: 82,
      passing: 75,
      positioning: 80,
      tackling: 45,
      stamina: 80,
    },
    striker: {
      shooting: 90,
      speed: 85,
      positioning: 85,
      dribbling: 78,
      passing: 72,
      tackling: 40,
      stamina: 80,
    },
  };

  const attributes = roleAttributes[roleId] || DEFAULT_ATTRIBUTES;

  return createMockPlayer({
    roleId,
    attributes: {
      speed: attributes.speed ?? DEFAULT_ATTRIBUTES.speed,
      stamina: attributes.stamina ?? DEFAULT_ATTRIBUTES.stamina,
      passing: attributes.passing ?? DEFAULT_ATTRIBUTES.passing,
      shooting: attributes.shooting ?? DEFAULT_ATTRIBUTES.shooting,
      tackling: attributes.tackling ?? DEFAULT_ATTRIBUTES.tackling,
      dribbling: attributes.dribbling ?? DEFAULT_ATTRIBUTES.dribbling,
      positioning: attributes.positioning ?? DEFAULT_ATTRIBUTES.positioning,
    },
    ...overrides,
  });
};

/**
 * Creates a complete starting XI with proper positions
 *
 * @param formation - Formation string (e.g., '4-4-2', '4-3-3')
 * @returns Array of 11 players positioned for the formation
 *
 * @example
 * const team = createMockStartingXI('4-3-3');
 */
export const createMockStartingXI = (formation: string = '4-4-2'): Player[] => {
  const players: Player[] = [];

  // Goalkeeper
  players.push(
    createMockPlayerByRole('goalkeeper', {
      name: 'Test Goalkeeper',
      jerseyNumber: 1,
      position: { x: 50, y: 10 },
    })
  );

  // Formation-based positioning
  const [defenders, midfielders, forwards] = formation.split('-').map(Number);

  // Defenders
  for (let i = 0; i < defenders; i++) {
    players.push(
      createMockPlayerByRole('defender', {
        name: `Defender ${i + 1}`,
        jerseyNumber: i + 2,
        position: { x: 20 + (i * 60) / (defenders - 1 || 1), y: 25 },
      })
    );
  }

  // Midfielders
  for (let i = 0; i < midfielders; i++) {
    players.push(
      createMockPlayerByRole('midfielder', {
        name: `Midfielder ${i + 1}`,
        jerseyNumber: i + defenders + 2,
        position: { x: 20 + (i * 60) / (midfielders - 1 || 1), y: 50 },
      })
    );
  }

  // Forwards
  for (let i = 0; i < forwards; i++) {
    players.push(
      createMockPlayerByRole('striker', {
        name: `Forward ${i + 1}`,
        jerseyNumber: i + defenders + midfielders + 2,
        position: { x: 30 + (i * 40) / (forwards - 1 || 1), y: 75 },
      })
    );
  }

  return players;
};

export default createMockPlayer;
