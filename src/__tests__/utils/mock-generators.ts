// @ts-ignore - faker types may not be available
import { faker } from '@faker-js/faker';
import type {
  Player,
  Formation,
  Challenge,
  PlayerAttributes,
  PlayerStats,
  Team,
  PositionRole,
  PlayerAvailability,
  PlayerRole,
  TeamKit,
  TacticalInstruction,
  MatchEvent,
  AnimationStep,
  HeatMapData,
  CollaborationSession,
  ExportFormat,
  AnalyticsData,
} from '../../types';

// Configure faker for consistent testing
faker.seed(123);

/**
 * Mock Data Generators for Astral Turf Testing
 * Provides realistic, consistent test data for all components
 */

// Base player attributes generator
export const generatePlayerAttributes = (
  overrides: Partial<PlayerAttributes> = {},
): PlayerAttributes => ({
  speed: faker.number.int({ min: 40, max: 99 }),
  passing: faker.number.int({ min: 40, max: 99 }),
  tackling: faker.number.int({ min: 40, max: 99 }),
  shooting: faker.number.int({ min: 40, max: 99 }),
  dribbling: faker.number.int({ min: 40, max: 99 }),
  positioning: faker.number.int({ min: 40, max: 99 }),
  stamina: faker.number.int({ min: 60, max: 100 }),
  ...overrides,
});

// Player stats generator
export const generatePlayerStats = (overrides: Partial<PlayerStats> = {}): PlayerStats => ({
  goals: faker.number.int({ min: 0, max: 50 }),
  assists: faker.number.int({ min: 0, max: 30 }),
  matchesPlayed: faker.number.int({ min: 0, max: 50 }),
  shotsOnTarget: faker.number.int({ min: 0, max: 100 }),
  tacklesWon: faker.number.int({ min: 0, max: 200 }),
  saves: faker.number.int({ min: 0, max: 150 }),
  passesCompleted: faker.number.int({ min: 0, max: 2000 }),
  passesAttempted: faker.number.int({ min: 0, max: 2500 }),
  careerHistory: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, (_, index) => ({
    season: 2024 - index,
    club: faker.company.name(),
    matchesPlayed: faker.number.int({ min: 0, max: 38 }),
    goals: faker.number.int({ min: 0, max: 25 }),
    assists: faker.number.int({ min: 0, max: 15 }),
  })),
  ...overrides,
});

// Player generator with various position types
export const generatePlayer = (overrides: Partial<Player> = {}): Player => {
  const positions: PositionRole[] = ['GK', 'DF', 'MF', 'FW'];
  const position = overrides.position || faker.helpers.arrayElement(positions);

  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    position,
    number: faker.number.int({ min: 1, max: 99 }),
    x: faker.number.float({ min: 0, max: 100 }),
    y: faker.number.float({ min: 0, max: 100 }),
    team: faker.helpers.arrayElement(['home', 'away'] as Team[]),
    attributes: generatePlayerAttributes(),
    stats: generatePlayerStats(),
    age: faker.number.int({ min: 16, max: 40 }),
    nationality: faker.location.country(),
    preferredFoot: faker.helpers.arrayElement(['left', 'right', 'both']),
    height: faker.number.int({ min: 160, max: 200 }),
    weight: faker.number.int({ min: 60, max: 100 }),
    marketValue: faker.number.int({ min: 100000, max: 100000000 }),
    wage: faker.number.int({ min: 1000, max: 500000 }),
    contractExpiry: faker.date.future().toISOString().split('T')[0],
    morale: faker.helpers.arrayElement(['Excellent', 'Good', 'Okay', 'Poor', 'Very Poor']),
    form: faker.helpers.arrayElement(['Excellent', 'Good', 'Average', 'Poor', 'Very Poor']),
    availability: {
      status: faker.helpers.arrayElement([
        'Available',
        'Minor Injury',
        'Major Injury',
        'Suspended',
        'International Duty',
      ]),
      returnDate: faker.helpers.maybe(() => faker.date.future().toISOString().split('T')[0]),
    } as PlayerAvailability,
    isSelected: faker.datatype.boolean({ probability: 0.7 }),
    isDragging: false,
    role: generatePlayerRole(position),
    instructions: [],
    developmentLog: [],
    ...overrides,
  } as any;
};

// Generate players for specific formations
export const generatePlayersForFormation = (formation: string): Player[] => {
  const formationConfigs: { [key: string]: PositionRole[] } = {
    '4-4-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
    '4-3-3': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
    '3-5-2': ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
    '5-3-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW'],
  };

  const positions = formationConfigs[formation] || formationConfigs['4-4-2'];
  return positions.map((position, index) =>
    generatePlayer({
      position: position as any,
      number: index + 1,
      team: 'home',
    } as any),
  );
};

// Player role generator
export const generatePlayerRole = (category: PositionRole): PlayerRole => {
  const rolesByPosition: { [key in PositionRole]: string[] } = {
    GK: ['Goalkeeper', 'Sweeper Keeper'],
    DF: ['Centre Back', 'Full Back', 'Wing Back', 'Libero'],
    MF: ['Central Midfielder', 'Attacking Midfielder', 'Defensive Midfielder', 'Winger'],
    FW: ['Striker', 'False 9', 'Winger', 'Second Striker'],
  };

  const roleName = faker.helpers.arrayElement(rolesByPosition[category]);
  return {
    id: faker.string.uuid(),
    name: roleName,
    abbreviation: roleName
      .split(' ')
      .map(word => word[0])
      .join(''),
    category,
    description: faker.lorem.sentence(),
  };
};

// Formation generator
export const generateFormation = (overrides: Partial<Formation> = {}): Formation => {
  const formationName = faker.helpers.arrayElement(['4-4-2', '4-3-3', '3-5-2', '5-3-2']);

  return {
    id: faker.string.uuid(),
    name: `${formationName} ${faker.word.adjective()}`,
    description: faker.lorem.paragraph(),
    formation: formationName,
    players: generatePlayersForFormation(formationName),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    isDefault: faker.datatype.boolean({ probability: 0.1 }),
    tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.word.noun()),
    version: faker.number.int({ min: 1, max: 10 }),
    author: faker.person.fullName(),
    ...overrides,
  } as any;
};

// Multiple formations generator
export const generateFormations = (count: number = 5): Formation[] => {
  return Array.from({ length: count }, () => generateFormation());
};

// Team kit generator
export const generateTeamKit = (overrides: Partial<TeamKit> = {}): TeamKit => ({
  primaryColor: faker.color.rgb(),
  secondaryColor: faker.color.rgb(),
  pattern: faker.helpers.arrayElement(['solid', 'stripes', 'hoops']),
  ...overrides,
});

// Challenge generator
export const generateChallenge = (overrides: Partial<Challenge> = {}): Challenge =>
  ({
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    description: faker.lorem.paragraph(),
    type: faker.helpers.arrayElement(['formation', 'tactics', 'analysis', 'collaboration']),
    difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced', 'expert']),
    points: faker.number.int({ min: 10, max: 100 }),
    timeLimit: faker.number.int({ min: 300, max: 3600 }), // 5 minutes to 1 hour
    requirements: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
      faker.lorem.sentence(),
    ),
    isCompleted: faker.datatype.boolean({ probability: 0.3 }),
    completedAt: faker.helpers.maybe(() => faker.date.past().toISOString()),
    progress: faker.number.int({ min: 0, max: 100 }),
    rewards: {
      points: faker.number.int({ min: 10, max: 100 }),
      badges: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => faker.word.noun()),
      unlocks: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () =>
        faker.lorem.words(2),
      ),
    },
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  }) as any;

// Heat map data generator
export const generateHeatMapData = (players: Player[]): HeatMapData =>
  ({
    id: faker.string.uuid(),
    playerId: faker.helpers.arrayElement(players).id,
    data: Array.from({ length: 100 }, (_, index) => ({
      x: (index % 10) * 10,
      y: Math.floor(index / 10) * 10,
      intensity: faker.number.float({ min: 0, max: 1 }),
    })),
    timeRange: {
      start: 0,
      end: 90,
    },
    matchId: faker.string.uuid(),
    generatedAt: faker.date.recent().toISOString(),
  }) as any;

// Animation step generator
export const generateAnimationStep = (overrides: Partial<AnimationStep> = {}): AnimationStep =>
  ({
    id: faker.string.uuid(),
    timestamp: faker.number.float({ min: 0, max: 90 }),
    type: faker.helpers.arrayElement(['movement', 'pass', 'shot', 'tackle', 'substitution']),
    players: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
      playerId: faker.string.uuid(),
      startPosition: {
        x: faker.number.float({ min: 0, max: 100 }),
        y: faker.number.float({ min: 0, max: 100 }),
      },
      endPosition: {
        x: faker.number.float({ min: 0, max: 100 }),
        y: faker.number.float({ min: 0, max: 100 }),
      },
      action: faker.helpers.arrayElement(['run', 'walk', 'sprint', 'tackle', 'pass', 'shoot']),
    })),
    description: faker.lorem.sentence(),
    duration: faker.number.float({ min: 0.5, max: 5 }),
    ...overrides,
  }) as any;

// Collaboration session generator
export const generateCollaborationSession = (
  overrides: Partial<CollaborationSession> = {},
): CollaborationSession =>
  ({
    id: faker.string.uuid(),
    formationId: faker.string.uuid(),
    participants: Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['owner', 'editor', 'viewer']),
      isOnline: faker.datatype.boolean({ probability: 0.7 }),
      lastSeen: faker.date.recent().toISOString(),
      cursor: {
        x: faker.number.float({ min: 0, max: 100 }),
        y: faker.number.float({ min: 0, max: 100 }),
      },
    })),
    comments: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
      id: faker.string.uuid(),
      authorId: faker.string.uuid(),
      content: faker.lorem.sentence(),
      position: {
        x: faker.number.float({ min: 0, max: 100 }),
        y: faker.number.float({ min: 0, max: 100 }),
      },
      createdAt: faker.date.recent().toISOString(),
      resolved: faker.datatype.boolean({ probability: 0.3 }),
    })),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    isActive: faker.datatype.boolean({ probability: 0.8 }),
    ...overrides,
  }) as any;

// Match event generator
export const generateMatchEvent = (overrides: Partial<MatchEvent> = {}): MatchEvent =>
  ({
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(['goal', 'assist', 'substitution', 'card', 'tackle', 'save']),
    playerId: faker.string.uuid(),
    minute: faker.number.int({ min: 1, max: 90 }),
    description: faker.lorem.sentence(),
    position: {
      x: faker.number.float({ min: 0, max: 100 }),
      y: faker.number.float({ min: 0, max: 100 }),
    },
    team: faker.helpers.arrayElement(['home', 'away'] as Team[]),
    ...overrides,
  }) as any;

// Analytics data generator
export const generateAnalyticsData = (): AnalyticsData =>
  ({
    possession: {
      home: faker.number.int({ min: 35, max: 65 }),
      away: faker.number.int({ min: 35, max: 65 }),
    },
    shots: {
      home: faker.number.int({ min: 5, max: 25 }),
      away: faker.number.int({ min: 5, max: 25 }),
    },
    shotsOnTarget: {
      home: faker.number.int({ min: 2, max: 12 }),
      away: faker.number.int({ min: 2, max: 12 }),
    },
    passes: {
      home: faker.number.int({ min: 200, max: 800 }),
      away: faker.number.int({ min: 200, max: 800 }),
    },
    passAccuracy: {
      home: faker.number.float({ min: 0.7, max: 0.95 }),
      away: faker.number.float({ min: 0.7, max: 0.95 }),
    },
    corners: {
      home: faker.number.int({ min: 0, max: 12 }),
      away: faker.number.int({ min: 0, max: 12 }),
    },
    fouls: {
      home: faker.number.int({ min: 5, max: 20 }),
      away: faker.number.int({ min: 5, max: 20 }),
    },
    yellowCards: {
      home: faker.number.int({ min: 0, max: 5 }),
      away: faker.number.int({ min: 0, max: 5 }),
    },
    redCards: {
      home: faker.number.int({ min: 0, max: 2 }),
      away: faker.number.int({ min: 0, max: 2 }),
    },
  }) as any;

// Tactical instruction generator
export const generateTacticalInstruction = (
  overrides: Partial<TacticalInstruction> = {},
): TacticalInstruction =>
  ({
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(['defensive', 'offensive', 'positional', 'pressing']),
    title: faker.lorem.words(2),
    description: faker.lorem.paragraph(),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
    targetPlayers: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
      faker.string.uuid(),
    ),
    duration: faker.number.int({ min: 5, max: 45 }), // in minutes
    isActive: faker.datatype.boolean({ probability: 0.6 }),
    ...overrides,
  }) as any;

// Export format data generator
export const generateExportData = (formation: Formation, format: ExportFormat) => {
  const baseData = {
    formation,
    exportedAt: new Date().toISOString(),
    version: '1.0',
    metadata: {
      author: faker.person.fullName(),
      description: faker.lorem.paragraph(),
      tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.word.noun()),
    },
  };

  switch (format) {
    case 'json':
      return JSON.stringify(baseData, null, 2);
    case 'csv': {
      const csvHeaders = 'Name,Position,Number,X,Y,Team';
      const csvData = (formation.players || [])
        .map(
          player =>
            `"${player.name}","${player.position}",${player.number},${player.x},${player.y},"${player.team}"`,
        )
        .join('\n');
      return `${csvHeaders}\n${csvData}`;
    }
    case 'xml' as any: {
      return `<?xml version="1.0" encoding="UTF-8"?>
<formation>
  <metadata>
    <name>${formation.name}</name>
    <description>${formation.description}</description>
  </metadata>
  <players>
    ${(formation.players || [])
      .map(
        player => `
    <player>
      <name>${player.name}</name>
      <position>${player.position}</position>
      <number>${player.number}</number>
      <coordinates x="${player.x}" y="${player.y}" />
      <team>${player.team}</team>
    </player>`,
      )
      .join('')}
  </players>
</formation>`;
    }
    default:
      return JSON.stringify(baseData);
  }
};

// Preset data collections for common test scenarios
export const createTestDataSet = {
  // Small formation for unit tests
  minimal: () => ({
    formation: generateFormation({
      players: generatePlayersForFormation('4-4-2').slice(0, 5),
    }),
    players: generatePlayersForFormation('4-4-2').slice(0, 5),
    challenges: Array.from({ length: 3 }, () => generateChallenge()),
  }),

  // Full formation for integration tests
  complete: () => ({
    formation: generateFormation(),
    players: generatePlayersForFormation('4-4-2'),
    challenges: Array.from({ length: 10 }, () => generateChallenge()),
    collaboration: generateCollaborationSession(),
    analytics: generateAnalyticsData(),
  }),

  // Large dataset for performance tests
  large: () => ({
    formations: generateFormations(50),
    players: Array.from({ length: 500 }, () => generatePlayer()),
    challenges: Array.from({ length: 100 }, () => generateChallenge()),
    heatMaps: Array.from({ length: 25 }, () =>
      generateHeatMapData(generatePlayersForFormation('4-4-2')),
    ),
  }),

  // Edge cases for error testing
  edgeCases: () => ({
    emptyFormation: generateFormation({ players: [] }),
    invalidPlayers: [
      generatePlayer({ x: -10, y: -10 } as any), // Out of bounds
      generatePlayer({ number: 0 } as any), // Invalid number
      generatePlayer({ name: '' }), // Empty name
    ],
    corruptedData: {
      formation: { ...generateFormation(), players: null },
      malformedJson: '{"invalid": json}',
    },
  }),
};

export default {
  generatePlayer,
  generateFormation,
  generateChallenge,
  generateHeatMapData,
  generateCollaborationSession,
  generateAnalyticsData,
  createTestDataSet,
};
