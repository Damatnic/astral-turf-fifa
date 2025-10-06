// @ts-ignore - faker may not be installed
import { faker } from '@faker-js/faker';
import type {
  Player,
  Formation,
  FormationSlot,
  DrawingShape,
  DrawingTool,
  SlotActionMenuData,
  SlotActionMenuTrigger,
  PositionRole,
  PlayerAvailability,
} from '../../types';

/**
 * Enhanced Mock Data Generators for New Tactical Features
 *
 * Provides specialized mock data for:
 * - Formation slots with realistic positioning
 * - Tactical drawing shapes and annotations
 * - Conflict resolution scenarios
 * - Chemistry visualization data
 * - Drag-and-drop interactions
 * - Performance testing datasets
 */

// Configure faker for consistent testing
faker.seed(456);

/**
 * Generate realistic formation slot with proper positioning
 */
export const generateFormationSlot = (overrides: Partial<FormationSlot> = {}): FormationSlot => {
  const roles: PositionRole[] = ['GK', 'DF', 'MF', 'FW'];
  const role = overrides.role || faker.helpers.arrayElement(roles);

  // Position slots based on role
  const positionsByRole = {
    GK: { x: faker.number.float({ min: 5, max: 15 }), y: faker.number.float({ min: 40, max: 60 }) },
    DF: {
      x: faker.number.float({ min: 20, max: 35 }),
      y: faker.number.float({ min: 20, max: 80 }),
    },
    MF: {
      x: faker.number.float({ min: 40, max: 70 }),
      y: faker.number.float({ min: 25, max: 75 }),
    },
    FW: {
      x: faker.number.float({ min: 75, max: 90 }),
      y: faker.number.float({ min: 30, max: 70 }),
    },
  };

  return {
    id: faker.string.uuid(),
    role,
    defaultPosition: positionsByRole[role],
    playerId: faker.helpers.maybe(() => faker.string.uuid(), { probability: 0.7 }),
    preferredRoles: generatePreferredRoles(role),
    ...overrides,
  };
};

/**
 * Generate preferred roles based on position category
 */
function generatePreferredRoles(role: PositionRole): string[] {
  const rolesByPosition = {
    GK: ['gk', 'sk'],
    DF: ['cb', 'bpd', 'ncb', 'fb', 'wb'],
    MF: ['dm', 'dlp', 'cm', 'b2b', 'ap', 'wm'],
    FW: ['w', 'iw', 'p', 'tf', 'cf'],
  };

  return faker.helpers.arrayElements(rolesByPosition[role], { min: 1, max: 3 });
}

/**
 * Generate complete formation with realistic tactical setup
 */
export const generateTacticalFormation = (
  formationType: '4-4-2' | '4-3-3' | '3-5-2' | '5-3-2' = '4-4-2',
  overrides: Partial<Formation> = {}
): Formation => {
  const formationConfigs = {
    '4-4-2': [
      { role: 'GK' as const, count: 1, positions: [{ x: 10, y: 50 }] },
      {
        role: 'DF' as const,
        count: 4,
        positions: [
          { x: 25, y: 20 },
          { x: 25, y: 40 },
          { x: 25, y: 60 },
          { x: 25, y: 80 },
        ],
      },
      {
        role: 'MF' as const,
        count: 4,
        positions: [
          { x: 50, y: 25 },
          { x: 50, y: 45 },
          { x: 50, y: 55 },
          { x: 50, y: 75 },
        ],
      },
      {
        role: 'FW' as const,
        count: 2,
        positions: [
          { x: 80, y: 40 },
          { x: 80, y: 60 },
        ],
      },
    ],
    '4-3-3': [
      { role: 'GK' as const, count: 1, positions: [{ x: 10, y: 50 }] },
      {
        role: 'DF' as const,
        count: 4,
        positions: [
          { x: 25, y: 20 },
          { x: 25, y: 40 },
          { x: 25, y: 60 },
          { x: 25, y: 80 },
        ],
      },
      {
        role: 'MF' as const,
        count: 3,
        positions: [
          { x: 50, y: 35 },
          { x: 50, y: 50 },
          { x: 50, y: 65 },
        ],
      },
      {
        role: 'FW' as const,
        count: 3,
        positions: [
          { x: 80, y: 30 },
          { x: 80, y: 50 },
          { x: 80, y: 70 },
        ],
      },
    ],
    '3-5-2': [
      { role: 'GK' as const, count: 1, positions: [{ x: 10, y: 50 }] },
      {
        role: 'DF' as const,
        count: 3,
        positions: [
          { x: 25, y: 30 },
          { x: 25, y: 50 },
          { x: 25, y: 70 },
        ],
      },
      {
        role: 'MF' as const,
        count: 5,
        positions: [
          { x: 35, y: 20 },
          { x: 35, y: 80 },
          { x: 50, y: 35 },
          { x: 50, y: 50 },
          { x: 50, y: 65 },
        ],
      },
      {
        role: 'FW' as const,
        count: 2,
        positions: [
          { x: 80, y: 40 },
          { x: 80, y: 60 },
        ],
      },
    ],
    '5-3-2': [
      { role: 'GK' as const, count: 1, positions: [{ x: 10, y: 50 }] },
      {
        role: 'DF' as const,
        count: 5,
        positions: [
          { x: 20, y: 15 },
          { x: 25, y: 35 },
          { x: 25, y: 50 },
          { x: 25, y: 65 },
          { x: 20, y: 85 },
        ],
      },
      {
        role: 'MF' as const,
        count: 3,
        positions: [
          { x: 50, y: 35 },
          { x: 50, y: 50 },
          { x: 50, y: 65 },
        ],
      },
      {
        role: 'FW' as const,
        count: 2,
        positions: [
          { x: 80, y: 40 },
          { x: 80, y: 60 },
        ],
      },
    ],
  };

  const config = formationConfigs[formationType];
  const slots: FormationSlot[] = [];
  let slotIndex = 0;

  for (const roleConfig of config) {
    for (let i = 0; i < roleConfig.count; i++) {
      slots.push(
        generateFormationSlot({
          id: `${roleConfig.role.toLowerCase()}-slot-${i + 1}`,
          role: roleConfig.role,
          defaultPosition: roleConfig.positions[i] || { x: 50, y: 50 },
          preferredRoles: generatePreferredRoles(roleConfig.role),
        })
      );
      slotIndex++;
    }
  }

  return {
    id: faker.string.uuid(),
    name: `${formationType} ${faker.word.adjective()} Formation`,
    slots,
    isCustom: faker.datatype.boolean({ probability: 0.3 }),
    notes: faker.lorem.paragraph(),
    ...overrides,
  };
};

/**
 * Generate tactical drawing shape for annotation testing
 */
export const generateDrawingShape = (overrides: Partial<DrawingShape> = {}): DrawingShape => {
  const tools: DrawingTool[] = ['arrow', 'zone', 'pen', 'line', 'text'];
  const tool = overrides.tool || faker.helpers.arrayElement(tools);

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

  const pointsConfigs = {
    arrow: () => [
      { x: faker.number.float({ min: 10, max: 90 }), y: faker.number.float({ min: 10, max: 90 }) },
      { x: faker.number.float({ min: 10, max: 90 }), y: faker.number.float({ min: 10, max: 90 }) },
    ],
    zone: () =>
      Array.from({ length: 4 }, () => ({
        x: faker.number.float({ min: 20, max: 80 }),
        y: faker.number.float({ min: 20, max: 80 }),
      })),
    pen: () =>
      Array.from({ length: faker.number.int({ min: 5, max: 20 }) }, () => ({
        x: faker.number.float({ min: 10, max: 90 }),
        y: faker.number.float({ min: 10, max: 90 }),
      })),
    line: () => [
      { x: faker.number.float({ min: 10, max: 90 }), y: faker.number.float({ min: 10, max: 90 }) },
      { x: faker.number.float({ min: 10, max: 90 }), y: faker.number.float({ min: 10, max: 90 }) },
    ],
    text: () => [
      { x: faker.number.float({ min: 20, max: 80 }), y: faker.number.float({ min: 20, max: 80 }) },
    ],
    select: () => [],
  };

  return {
    id: faker.string.uuid(),
    tool,
    color: faker.helpers.arrayElement(colors),
    points: pointsConfigs[tool](),
    text: tool === 'text' ? faker.lorem.words(3) : undefined,
    ...overrides,
  };
};

/**
 * Generate multiple drawing shapes for complex tactical annotations
 */
export const generateTacticalAnnotations = (count: number = 5): DrawingShape[] => {
  return Array.from({ length: count }, () => generateDrawingShape());
};

/**
 * Generate conflict resolution scenario data
 */
export const generateConflictScenario = (): {
  sourcePlayer: Player;
  targetPlayer: Player;
  menuData: SlotActionMenuData;
  alternativeSlots: Array<{ id: string; role: string; position: { x: number; y: number } }>;
} => {
  const sourcePlayer = generatePlayerForConflict('FW');
  const targetPlayer = generatePlayerForConflict('FW');

  const menuData: SlotActionMenuData = {
    sourcePlayerId: sourcePlayer.id,
    targetSlotId: faker.string.uuid(),
    targetPlayerId: targetPlayer.id,
    trigger: faker.helpers.arrayElement(['click', 'drag'] as SlotActionMenuTrigger[]),
    position: {
      x: faker.number.float({ min: 100, max: 800 }),
      y: faker.number.float({ min: 100, max: 600 }),
    },
  };

  const alternativeSlots = Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
    id: faker.string.uuid(),
    role: faker.helpers.arrayElement(['MF', 'FW', 'DF']),
    position: {
      x: faker.number.float({ min: 30, max: 90 }),
      y: faker.number.float({ min: 20, max: 80 }),
    },
  }));

  return {
    sourcePlayer,
    targetPlayer,
    menuData,
    alternativeSlots,
  };
};

/**
 * Generate player specifically for conflict testing
 */
function generatePlayerForConflict(role: PositionRole): Player {
  const basePlayer = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    jerseyNumber: faker.number.int({ min: 1, max: 99 }),
    age: faker.number.int({ min: 18, max: 35 }),
    nationality: faker.location.country(),
    potential: [
      faker.number.int({ min: 70, max: 85 }),
      faker.number.int({ min: 85, max: 95 }),
    ] as const,
    currentPotential: faker.number.int({ min: 75, max: 90 }),
    roleId: getRandomRoleId(role),
    instructions: {},
    team: faker.helpers.arrayElement(['home', 'away'] as const),
    teamColor: faker.color.rgb(),
    attributes: {
      speed: faker.number.int({ min: 60, max: 95 }),
      passing: faker.number.int({ min: 60, max: 95 }),
      tackling: faker.number.int({ min: 40, max: 90 }),
      shooting: faker.number.int({ min: 50, max: 95 }),
      dribbling: faker.number.int({ min: 60, max: 95 }),
      positioning: faker.number.int({ min: 70, max: 95 }),
      stamina: faker.number.int({ min: 70, max: 95 }),
    },
    position: {
      x: faker.number.float({ min: 10, max: 90 }),
      y: faker.number.float({ min: 10, max: 90 }),
    },
    availability: {
      status: faker.helpers.arrayElement(['Available', 'Minor Injury', 'Major Injury'] as const),
    } as PlayerAvailability,
    morale: faker.helpers.arrayElement(['Excellent', 'Good', 'Okay', 'Poor'] as const),
    form: faker.helpers.arrayElement(['Excellent', 'Good', 'Average', 'Poor'] as const),
    stamina: faker.number.int({ min: 70, max: 100 }),
    developmentLog: [],
    contract: { clauses: [] },
    stats: {
      goals: faker.number.int({ min: 0, max: 30 }),
      assists: faker.number.int({ min: 0, max: 20 }),
      matchesPlayed: faker.number.int({ min: 15, max: 40 }),
      shotsOnTarget: faker.number.int({ min: 10, max: 80 }),
      tacklesWon: faker.number.int({ min: 5, max: 60 }),
      saves: role === 'GK' ? faker.number.int({ min: 50, max: 150 }) : 0,
      passesCompleted: faker.number.int({ min: 500, max: 2000 }),
      passesAttempted: faker.number.int({ min: 600, max: 2300 }),
      careerHistory: [],
    },
    loan: { isLoaned: false },
    traits: [],
    conversationHistory: [],
    attributeHistory: [],
    attributeDevelopmentProgress: {},
    communicationLog: [],
    customTrainingSchedule: null,
    fatigue: faker.number.int({ min: 10, max: 40 }),
    injuryRisk: faker.number.int({ min: 5, max: 30 }),
    lastConversationInitiatedWeek: 0,
    moraleBoost: null,
    completedChallenges: [],
  };

  return basePlayer;
}

/**
 * Get random role ID based on position category
 */
function getRandomRoleId(role: PositionRole): string {
  const rolesByPosition = {
    GK: ['gk', 'sk'],
    DF: ['cb', 'bpd', 'ncb', 'fb', 'wb'],
    MF: ['dm', 'dlp', 'cm', 'b2b', 'ap', 'wm'],
    FW: ['w', 'iw', 'p', 'tf', 'cf'],
  };

  return faker.helpers.arrayElement(rolesByPosition[role]);
}

/**
 * Generate chemistry visualization data for testing
 */
export const generateChemistryData = (
  players: Player[]
): Array<{
  player1Id: string;
  player2Id: string;
  chemistryScore: number;
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
}> => {
  const chemistryPairs = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const player1 = players[i];
      const player2 = players[j];

      // Calculate realistic chemistry based on player attributes
      const nationalityBonus = player1.nationality === player2.nationality ? 15 : 0;
      const teamBonus = player1.team === player2.team ? 10 : 0;
      const ageCompatibility = Math.abs(player1.age - player2.age) <= 5 ? 10 : 0;
      const positionCompatibility = getPositionCompatibility(player1.roleId, player2.roleId);

      const baseChemistry = faker.number.int({ min: 40, max: 70 });
      const chemistryScore = Math.min(
        100,
        baseChemistry + nationalityBonus + teamBonus + ageCompatibility + positionCompatibility
      );

      const factors = [
        {
          factor: 'Nationality',
          impact: nationalityBonus,
          description:
            player1.nationality === player2.nationality
              ? 'Same nationality'
              : 'Different nationalities',
        },
        {
          factor: 'Team Chemistry',
          impact: teamBonus,
          description: 'Playing in same team',
        },
        {
          factor: 'Age Compatibility',
          impact: ageCompatibility,
          description: Math.abs(player1.age - player2.age) <= 5 ? 'Similar ages' : 'Age gap',
        },
        {
          factor: 'Position Synergy',
          impact: positionCompatibility,
          description: 'Positional compatibility',
        },
      ].filter(f => f.impact > 0);

      (chemistryPairs as any[]).push({
        player1Id: player1.id,
        player2Id: player2.id,
        chemistryScore,
        factors,
      });
    }
  }

  return chemistryPairs;
};

/**
 * Calculate position compatibility for chemistry
 */
function getPositionCompatibility(role1: string, role2: string): number {
  const compatibilityMatrix: { [key: string]: { [key: string]: number } } = {
    // Goalkeeper
    gk: { cb: 15, bpd: 10 },
    sk: { cb: 20, bpd: 15, fb: 10 },

    // Defenders
    cb: { cb: 20, bpd: 15, ncb: 15, dm: 10 },
    bpd: { cb: 15, bpd: 20, dlp: 15, cm: 10 },
    fb: { cb: 10, wb: 15, wm: 15, w: 10 },
    wb: { fb: 15, wm: 20, w: 15 },

    // Midfielders
    dm: { cb: 10, dm: 20, dlp: 15, cm: 15 },
    dlp: { bpd: 15, dm: 15, dlp: 20, cm: 15, ap: 10 },
    cm: { dm: 15, dlp: 15, cm: 20, b2b: 15, ap: 15 },
    b2b: { cm: 15, b2b: 20, ap: 15, wm: 10 },
    ap: { dlp: 10, cm: 15, b2b: 15, ap: 20, iw: 10, cf: 10 },
    wm: { wb: 20, b2b: 10, wm: 20, w: 15, iw: 15 },

    // Forwards
    w: { wb: 10, wm: 15, w: 20, iw: 15, cf: 10 },
    iw: { ap: 10, wm: 15, w: 15, iw: 20, p: 10, cf: 15 },
    p: { ap: 15, iw: 10, p: 20, tf: 15, cf: 20 },
    tf: { p: 15, tf: 20, cf: 15 },
    cf: { ap: 10, iw: 15, p: 20, tf: 15, cf: 20 },
  };

  return compatibilityMatrix[role1]?.[role2] || 0;
}

/**
 * Generate performance testing dataset
 */
export const generatePerformanceTestData = {
  // Small dataset for basic tests
  small: () => ({
    players: Array.from({ length: 11 }, () => generatePlayerForConflict('MF')),
    formation: generateTacticalFormation('4-4-2'),
    drawings: generateTacticalAnnotations(5),
    conflicts: Array.from({ length: 2 }, () => generateConflictScenario()),
  }),

  // Medium dataset for integration tests
  medium: () => ({
    players: Array.from({ length: 25 }, () =>
      generatePlayerForConflict(faker.helpers.arrayElement(['GK', 'DF', 'MF', 'FW']))
    ),
    formations: Array.from({ length: 5 }, () => generateTacticalFormation()),
    drawings: generateTacticalAnnotations(20),
    conflicts: Array.from({ length: 10 }, () => generateConflictScenario()),
  }),

  // Large dataset for performance stress testing
  large: () => ({
    players: Array.from({ length: 100 }, () =>
      generatePlayerForConflict(faker.helpers.arrayElement(['GK', 'DF', 'MF', 'FW']))
    ),
    formations: Array.from({ length: 20 }, () => generateTacticalFormation()),
    drawings: generateTacticalAnnotations(100),
    conflicts: Array.from({ length: 50 }, () => generateConflictScenario()),
  }),
};

/**
 * Generate drag and drop interaction data
 */
export const generateDragDropScenario = (): {
  draggedPlayer: Player;
  targetSlot: FormationSlot;
  conflictPlayer?: Player;
  dragStartPosition: { x: number; y: number };
  dropPosition: { x: number; y: number };
  expectConflict: boolean;
} => {
  const draggedPlayer = generatePlayerForConflict('MF');
  const targetSlot = generateFormationSlot({ role: 'MF' });
  const conflictPlayer = faker.datatype.boolean({ probability: 0.6 })
    ? generatePlayerForConflict('MF')
    : undefined;

  if (conflictPlayer) {
    targetSlot.playerId = conflictPlayer.id;
  }

  return {
    draggedPlayer,
    targetSlot,
    conflictPlayer,
    dragStartPosition: draggedPlayer.position,
    dropPosition: targetSlot.defaultPosition,
    expectConflict: !!conflictPlayer,
  };
};

/**
 * Generate edge case test scenarios
 */
export const generateEdgeCases = {
  emptyFormation: () =>
    generateTacticalFormation('4-4-2', {
      slots: [],
    }),

  formationWithoutPlayers: () => {
    const formation = generateTacticalFormation('4-4-2');
    formation.slots.forEach(slot => {
      slot.playerId = null;
    });
    return formation;
  },

  playerOutOfBounds: () => generatePlayerForConflict('MF'),

  malformedDrawingShapes: () => [
    generateDrawingShape({ points: [] }),
    generateDrawingShape({ color: '', tool: 'pen' }),
    generateDrawingShape({ text: '', tool: 'text' }),
  ],

  extremeChemistryValues: (players: Player[]) => [
    ...generateChemistryData(players),
    {
      player1Id: players[0]?.id || 'test-1',
      player2Id: players[1]?.id || 'test-2',
      chemistryScore: 0, // Minimum chemistry
      factors: [],
    },
    {
      player1Id: players[0]?.id || 'test-1',
      player2Id: players[2]?.id || 'test-3',
      chemistryScore: 100, // Maximum chemistry
      factors: [],
    },
  ],
};

// Export missing functions that tests are looking for
export { generatePlayerForConflict };

// Re-export renderWithProviders from test-utils
export { renderWithProviders } from './test-utils';

export const generateEnhancedPlayer = (overrides: Partial<Player> = {}) =>
  generatePlayerForConflict('MF');

export const generateEnhancedFormation = (type?: '4-4-2' | '4-3-3' | '3-5-2' | '5-3-2') =>
  generateTacticalFormation(type || '4-4-2');

export const generateCompleteTacticalSetup = () => ({
  formation: generateTacticalFormation('4-4-2'),
  players: Array.from({ length: 11 }, () => generatePlayerForConflict('MF')),
  drawings: generateTacticalAnnotations(5),
});

export const generateEdgeCaseData = generateEdgeCases;

export const generateDrawingShapes = (count: number = 5) => generateTacticalAnnotations(count);

export const testScenarios = {
  basic: () => generatePerformanceTestData.small(),
  complex: () => generatePerformanceTestData.medium(),
  stress: () => generatePerformanceTestData.large(),
};

export default {
  generateFormationSlot,
  generateTacticalFormation,
  generateDrawingShape,
  generateTacticalAnnotations,
  generateConflictScenario,
  generateChemistryData,
  generatePerformanceTestData,
  generateDragDropScenario,
  generateEdgeCases,
  generatePlayerForConflict,
  generateEnhancedPlayer,
  generateEnhancedFormation,
  generateCompleteTacticalSetup,
  generateEdgeCaseData,
  generateDrawingShapes,
  testScenarios,
};
