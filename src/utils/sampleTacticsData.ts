import type { Player, Formation, FormationSlot, PositionRole, Team } from '../types';
import { PLAYER_ROLES } from '../constants';

interface SamplePlayerConfig {
  id: string;
  name: string;
  jerseyNumber: number;
  roleId: string;
  formationRole: PositionRole;
  position: { x: number; y: number };
  slotId?: string;
  team?: Team;
  teamColor?: string;
  age?: number;
  nationality?: string;
  morale?: Player['morale'];
  form?: Player['form'];
  stamina?: number;
  attributes?: Partial<Player['attributes']>;
  stats?: Partial<Player['stats']>;
}

const HOME_TEAM_COLOR = '#1f2937';
const AWAY_TEAM_COLOR = '#dc2626';

const defaultCareerHistory = [
  {
    season: 2024,
    club: 'Astral Turf FC',
    matchesPlayed: 34,
    goals: 0,
    assists: 0,
  },
] as const satisfies Player['stats']['careerHistory'];

const createSamplePlayer = (config: SamplePlayerConfig): Player => {
  const {
    team = 'home',
    teamColor = team === 'home' ? HOME_TEAM_COLOR : AWAY_TEAM_COLOR,
    age = 26,
    nationality = 'Astralian',
    morale = 'Good',
    form = 'Good',
    stamina = 85,
  } = config;

  const baseAttributes: Player['attributes'] = {
    speed: 70,
    passing: 72,
    tackling: 68,
    shooting: 65,
    dribbling: 70,
    positioning: 72,
    stamina: 85,
  };

  const baseStats: Player['stats'] = {
    goals: 0,
    assists: 0,
    matchesPlayed: 34,
    shotsOnTarget: 0,
    tacklesWon: 0,
    saves: 0,
    passesCompleted: 620,
    passesAttempted: 680,
    careerHistory: defaultCareerHistory,
  };

  const stats: Player['stats'] = {
    ...baseStats,
    ...(config.stats ?? {}),
    careerHistory: config.stats?.careerHistory ?? baseStats.careerHistory,
  };

  return {
    id: config.id,
    name: config.name,
    jerseyNumber: config.jerseyNumber,
    age,
    nationality,
    potential: [78, 92],
    currentPotential: 84,
    roleId: config.roleId,
    instructions: {},
    team,
    teamColor,
    attributes: { ...baseAttributes, ...(config.attributes ?? {}) },
    position: config.position,
    availability: { status: 'Available' },
    morale,
    form,
    stamina,
    developmentLog: [],
    contract: { clauses: [] },
    stats,
    loan: { isLoaned: false },
    traits: [],
    individualTrainingFocus: null,
    conversationHistory: [],
    attributeHistory: [],
    attributeDevelopmentProgress: {},
    communicationLog: [],
    customTrainingSchedule: null,
    fatigue: 10,
    injuryRisk: 12,
    lastConversationInitiatedWeek: 0,
    moraleBoost: null,
    completedChallenges: [],
  };
};

interface StarterDefinition extends SamplePlayerConfig {
  slotId: string;
  defaultPosition: { x: number; y: number };
}

const STARTER_CONFIGS: StarterDefinition[] = [
  {
    id: 'gk1',
    slotId: 'gk',
    formationRole: 'GK',
    roleId: 'goalkeeper',
    name: 'David Martinez',
    jerseyNumber: 1,
    defaultPosition: { x: 50, y: 8 },
    position: { x: 50, y: 8 },
    attributes: {
      speed: 48,
      passing: 70,
      tackling: 55,
      shooting: 28,
      dribbling: 42,
      positioning: 92,
      stamina: 88,
    },
    stats: {
      saves: 104,
      matchesPlayed: 34,
      passesCompleted: 810,
      passesAttempted: 870,
    },
    morale: 'Excellent',
  },
  {
    id: 'cb1',
    slotId: 'lcb',
    formationRole: 'DF',
    roleId: 'centre-back',
    name: 'Marco Silva',
    jerseyNumber: 4,
    defaultPosition: { x: 34, y: 24 },
    position: { x: 34, y: 24 },
    attributes: {
      speed: 66,
      passing: 74,
      tackling: 92,
      shooting: 40,
      dribbling: 58,
      positioning: 90,
      stamina: 86,
    },
    stats: {
      goals: 2,
      assists: 1,
      tacklesWon: 112,
    },
  },
  {
    id: 'cb2',
    slotId: 'rcb',
    formationRole: 'DF',
    roleId: 'centre-back',
    name: 'Alessandro Romano',
    jerseyNumber: 5,
    defaultPosition: { x: 66, y: 24 },
    position: { x: 66, y: 24 },
    attributes: {
      speed: 68,
      passing: 78,
      tackling: 94,
      shooting: 42,
      dribbling: 60,
      positioning: 91,
      stamina: 88,
    },
    stats: {
      goals: 3,
      assists: 2,
      tacklesWon: 118,
    },
  },
  {
    id: 'lb1',
    slotId: 'lb',
    formationRole: 'DF',
    roleId: 'left-back',
    name: 'Carlos Rodriguez',
    jerseyNumber: 3,
    defaultPosition: { x: 18, y: 32 },
    position: { x: 18, y: 32 },
    attributes: {
      speed: 82,
      passing: 80,
      tackling: 78,
      shooting: 48,
      dribbling: 76,
      positioning: 82,
      stamina: 90,
    },
    stats: {
      assists: 7,
      goals: 1,
    },
  },
  {
    id: 'rb1',
    slotId: 'rb',
    formationRole: 'DF',
    roleId: 'right-back',
    name: 'Thomas Mueller',
    jerseyNumber: 2,
    defaultPosition: { x: 82, y: 32 },
    position: { x: 82, y: 32 },
    attributes: {
      speed: 81,
      passing: 78,
      tackling: 80,
      shooting: 50,
      dribbling: 74,
      positioning: 79,
      stamina: 88,
    },
    stats: {
      assists: 6,
      goals: 2,
    },
  },
  {
    id: 'cdm1',
    slotId: 'cdm',
    formationRole: 'MF',
    roleId: 'defensive-midfielder',
    name: 'Paul Fernandez',
    jerseyNumber: 6,
    defaultPosition: { x: 50, y: 46 },
    position: { x: 50, y: 46 },
    attributes: {
      speed: 72,
      passing: 86,
      tackling: 88,
      shooting: 58,
      dribbling: 74,
      positioning: 88,
      stamina: 92,
    },
    stats: {
      goals: 4,
      assists: 8,
      tacklesWon: 132,
    },
    morale: 'Excellent',
  },
  {
    id: 'cm1',
    slotId: 'lcm',
    formationRole: 'MF',
    roleId: 'central-midfielder',
    name: 'Andrea Rossi',
    jerseyNumber: 8,
    defaultPosition: { x: 34, y: 58 },
    position: { x: 34, y: 58 },
    attributes: {
      speed: 75,
      passing: 88,
      tackling: 70,
      shooting: 68,
      dribbling: 82,
      positioning: 85,
      stamina: 88,
    },
    stats: {
      goals: 6,
      assists: 10,
    },
  },
  {
    id: 'cm2',
    slotId: 'rcm',
    formationRole: 'MF',
    roleId: 'attacking-midfielder',
    name: 'James Wilson',
    jerseyNumber: 10,
    defaultPosition: { x: 66, y: 58 },
    position: { x: 66, y: 58 },
    attributes: {
      speed: 78,
      passing: 90,
      tackling: 60,
      shooting: 84,
      dribbling: 89,
      positioning: 88,
      stamina: 84,
    },
    stats: {
      goals: 12,
      assists: 15,
      shotsOnTarget: 44,
    },
    morale: 'Excellent',
  },
  {
    id: 'lw1',
    slotId: 'lw',
    formationRole: 'FW',
    roleId: 'left-winger',
    name: 'Gabriel Santos',
    jerseyNumber: 11,
    defaultPosition: { x: 25, y: 78 },
    position: { x: 25, y: 78 },
    attributes: {
      speed: 92,
      passing: 76,
      tackling: 48,
      shooting: 82,
      dribbling: 90,
      positioning: 84,
      stamina: 86,
    },
    stats: {
      goals: 14,
      assists: 11,
      shotsOnTarget: 52,
    },
  },
  {
    id: 'rw1',
    slotId: 'rw',
    formationRole: 'FW',
    roleId: 'right-winger',
    name: 'Mohamed Al-Hassan',
    jerseyNumber: 7,
    defaultPosition: { x: 75, y: 78 },
    position: { x: 75, y: 78 },
    attributes: {
      speed: 90,
      passing: 74,
      tackling: 46,
      shooting: 84,
      dribbling: 88,
      positioning: 82,
      stamina: 87,
    },
    stats: {
      goals: 13,
      assists: 12,
      shotsOnTarget: 49,
    },
    morale: 'Excellent',
  },
  {
    id: 'st1',
    slotId: 'st',
    formationRole: 'FW',
    roleId: 'striker',
    name: 'Viktor Petrov',
    jerseyNumber: 9,
    defaultPosition: { x: 50, y: 88 },
    position: { x: 50, y: 88 },
    attributes: {
      speed: 86,
      passing: 70,
      tackling: 40,
      shooting: 92,
      dribbling: 82,
      positioning: 94,
      stamina: 85,
    },
    stats: {
      goals: 26,
      assists: 7,
      shotsOnTarget: 70,
    },
    morale: 'Excellent',
  },
];

const BENCH_CONFIGS: SamplePlayerConfig[] = [
  {
    id: 'sub_gk1',
    formationRole: 'GK',
    roleId: 'goalkeeper',
    name: 'Roberto Silva',
    jerseyNumber: 12,
    position: { x: 5, y: 5 },
    attributes: {
      speed: 46,
      passing: 66,
      tackling: 52,
      shooting: 26,
      dribbling: 40,
      positioning: 86,
      stamina: 82,
    },
    stats: {
      matchesPlayed: 12,
      saves: 34,
    },
  },
  {
    id: 'sub_def1',
    formationRole: 'DF',
    roleId: 'centre-back',
    name: 'Lucas Johnson',
    jerseyNumber: 13,
    position: { x: 10, y: 12 },
    attributes: {
      speed: 70,
      passing: 72,
      tackling: 86,
      shooting: 36,
      dribbling: 60,
      positioning: 84,
      stamina: 84,
    },
    stats: {
      tacklesWon: 68,
    },
  },
  {
    id: 'sub_mid1',
    formationRole: 'MF',
    roleId: 'central-midfielder',
    name: 'Pierre Dubois',
    jerseyNumber: 14,
    position: { x: 15, y: 12 },
    attributes: {
      speed: 74,
      passing: 84,
      tackling: 68,
      shooting: 66,
      dribbling: 78,
      positioning: 80,
      stamina: 86,
    },
    stats: {
      goals: 4,
      assists: 9,
    },
  },
  {
    id: 'sub_att1',
    formationRole: 'FW',
    roleId: 'striker',
    name: 'Kenji Tanaka',
    jerseyNumber: 15,
    position: { x: 20, y: 12 },
    attributes: {
      speed: 88,
      passing: 70,
      tackling: 34,
      shooting: 86,
      dribbling: 80,
      positioning: 88,
      stamina: 83,
    },
    stats: {
      goals: 18,
      assists: 6,
      shotsOnTarget: 42,
    },
  },
];

const starterPlayers = STARTER_CONFIGS.map(createSamplePlayer);
const benchPlayers = BENCH_CONFIGS.map(createSamplePlayer);

export const SAMPLE_PLAYERS: Player[] = [...starterPlayers, ...benchPlayers];

const formationSlots: Array<FormationSlot & { roleId: string }> = STARTER_CONFIGS.map(
  ({ slotId, formationRole, defaultPosition, id, roleId }) => ({
    id: slotId,
    role: formationRole,
    defaultPosition,
    playerId: id,
    roleId,
  })
);

export const SAMPLE_FORMATION_433: Formation = {
  id: 'formation_433_default',
  name: '4-3-3 Attacking',
  slots: formationSlots,
};

export const getBenchPlayers = (players: Player[], formation: Formation): Player[] => {
  const startingPlayerIds = formation.slots
    .map(slot => slot.playerId)
    .filter((playerId): playerId is string => Boolean(playerId));

  return players.filter(player => !startingPlayerIds.includes(player.id));
};

export const groupPlayersByPosition = (players: Player[]): Record<string, Player[]> => {
  const groups: Record<string, Player[]> = {
    Goalkeepers: [],
    Defenders: [],
    Midfielders: [],
    Forwards: [],
  };

  players.forEach(player => {
    const role = PLAYER_ROLES.find(r => r.id === player.roleId);
    if (!role) {
      return;
    }

    switch (role.category) {
      case 'GK':
        groups.Goalkeepers.push(player);
        break;
      case 'DF':
        groups.Defenders.push(player);
        break;
      case 'MF':
        groups.Midfielders.push(player);
        break;
      case 'FW':
        groups.Forwards.push(player);
        break;
      default:
        break;
    }
  });

  return groups;
};

export const initializeSampleData = () => ({
  players: SAMPLE_PLAYERS,
  formation: SAMPLE_FORMATION_433,
});
