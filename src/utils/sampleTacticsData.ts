import { Player, Formation, FormationSlot } from '../types';
import { PLAYER_ROLES } from '../constants';

/**
 * Sample players for testing tactical board functionality
 */
export const SAMPLE_PLAYERS: Player[] = [
  // Goalkeepers
  {
    id: 'gk1',
    name: 'David Martinez',
    jerseyNumber: 1,
    team: 'home',
    roleId: 'goalkeeper',
    position: { x: 50, y: 5 },
    stats: {
      pace: 45,
      shooting: 25,
      passing: 65,
      dribbling: 40,
      defending: 95,
      physical: 85,
      overall: 82
    },
    stamina: 95,
    morale: 'Excellent',
    availability: { status: 'Available' }
  },
  
  // Defenders
  {
    id: 'cb1',
    name: 'Marco Silva',
    jerseyNumber: 4,
    team: 'home',
    roleId: 'centre-back',
    position: { x: 30, y: 20 },
    stats: {
      pace: 65,
      shooting: 35,
      passing: 75,
      dribbling: 55,
      defending: 90,
      physical: 88,
      overall: 84
    },
    stamina: 88,
    morale: 'Good',
    availability: { status: 'Available' }
  },
  {
    id: 'cb2',
    name: 'Alessandro Romano',
    jerseyNumber: 5,
    team: 'home',
    roleId: 'centre-back',
    position: { x: 70, y: 20 },
    stats: {
      pace: 68,
      shooting: 30,
      passing: 82,
      dribbling: 60,
      defending: 92,
      physical: 85,
      overall: 86
    },
    stamina: 90,
    morale: 'Excellent',
    availability: { status: 'Available' }
  },
  {
    id: 'lb1',
    name: 'Carlos Rodriguez',
    jerseyNumber: 3,
    team: 'home',
    roleId: 'left-back',
    position: { x: 15, y: 35 },
    stats: {
      pace: 82,
      shooting: 45,
      passing: 78,
      dribbling: 75,
      defending: 80,
      physical: 75,
      overall: 79
    },
    stamina: 85,
    morale: 'Good',
    availability: { status: 'Available' }
  },
  {
    id: 'rb1',
    name: 'Thomas Mueller',
    jerseyNumber: 2,
    team: 'home',
    roleId: 'right-back',
    position: { x: 85, y: 35 },
    stats: {
      pace: 80,
      shooting: 50,
      passing: 75,
      dribbling: 72,
      defending: 82,
      physical: 78,
      overall: 81
    },
    stamina: 87,
    morale: 'Okay',
    availability: { status: 'Available' }
  },
  
  // Midfielders
  {
    id: 'cdm1',
    name: 'Paul Fernandez',
    jerseyNumber: 6,
    team: 'home',
    roleId: 'defensive-midfielder',
    position: { x: 50, y: 50 },
    stats: {
      pace: 70,
      shooting: 55,
      passing: 88,
      dribbling: 72,
      defending: 85,
      physical: 82,
      overall: 85
    },
    stamina: 92,
    morale: 'Excellent',
    availability: { status: 'Available' }
  },
  {
    id: 'cm1',
    name: 'Andrea Rossi',
    jerseyNumber: 8,
    team: 'home',
    roleId: 'central-midfielder',
    position: { x: 35, y: 65 },
    stats: {
      pace: 75,
      shooting: 70,
      passing: 85,
      dribbling: 80,
      defending: 65,
      physical: 75,
      overall: 83
    },
    stamina: 89,
    morale: 'Good',
    availability: { status: 'Available' }
  },
  {
    id: 'cm2',
    name: 'James Wilson',
    jerseyNumber: 10,
    team: 'home',
    roleId: 'attacking-midfielder',
    position: { x: 65, y: 65 },
    stats: {
      pace: 78,
      shooting: 82,
      passing: 90,
      dribbling: 88,
      defending: 45,
      physical: 70,
      overall: 87
    },
    stamina: 85,
    morale: 'Excellent',
    availability: { status: 'Available' }
  },
  
  // Forwards
  {
    id: 'lw1',
    name: 'Gabriel Santos',
    jerseyNumber: 11,
    team: 'home',
    roleId: 'left-winger',
    position: { x: 25, y: 80 },
    stats: {
      pace: 92,
      shooting: 78,
      passing: 75,
      dribbling: 90,
      defending: 35,
      physical: 68,
      overall: 85
    },
    stamina: 88,
    morale: 'Good',
    availability: { status: 'Available' }
  },
  {
    id: 'rw1',
    name: 'Mohamed Al-Hassan',
    jerseyNumber: 7,
    team: 'home',
    roleId: 'right-winger',
    position: { x: 75, y: 80 },
    stats: {
      pace: 88,
      shooting: 82,
      passing: 72,
      dribbling: 85,
      defending: 38,
      physical: 70,
      overall: 83
    },
    stamina: 86,
    morale: 'Excellent',
    availability: { status: 'Available' }
  },
  {
    id: 'st1',
    name: 'Viktor Petrov',
    jerseyNumber: 9,
    team: 'home',
    roleId: 'striker',
    position: { x: 50, y: 90 },
    stats: {
      pace: 85,
      shooting: 95,
      passing: 68,
      dribbling: 82,
      defending: 25,
      physical: 88,
      overall: 89
    },
    stamina: 87,
    morale: 'Excellent',
    availability: { status: 'Available' }
  },
  
  // Bench Players
  {
    id: 'sub_gk1',
    name: 'Roberto Silva',
    jerseyNumber: 12,
    team: 'home',
    roleId: 'goalkeeper',
    position: { x: 0, y: 0 },
    stats: {
      pace: 40,
      shooting: 20,
      passing: 60,
      dribbling: 35,
      defending: 88,
      physical: 80,
      overall: 76
    },
    stamina: 100,
    morale: 'Good',
    availability: { status: 'Available' }
  },
  {
    id: 'sub_def1',
    name: 'Lucas Johnson',
    jerseyNumber: 13,
    team: 'home',
    roleId: 'centre-back',
    position: { x: 0, y: 0 },
    stats: {
      pace: 70,
      shooting: 25,
      passing: 70,
      dribbling: 50,
      defending: 85,
      physical: 82,
      overall: 78
    },
    stamina: 100,
    morale: 'Okay',
    availability: { status: 'Available' }
  },
  {
    id: 'sub_mid1',
    name: 'Pierre Dubois',
    jerseyNumber: 14,
    team: 'home',
    roleId: 'central-midfielder',
    position: { x: 0, y: 0 },
    stats: {
      pace: 72,
      shooting: 65,
      passing: 80,
      dribbling: 75,
      defending: 60,
      physical: 70,
      overall: 80
    },
    stamina: 100,
    morale: 'Good',
    availability: { status: 'Available' }
  },
  {
    id: 'sub_att1',
    name: 'Kenji Tanaka',
    jerseyNumber: 15,
    team: 'home',
    roleId: 'striker',
    position: { x: 0, y: 0 },
    stats: {
      pace: 88,
      shooting: 85,
      passing: 65,
      dribbling: 80,
      defending: 20,
      physical: 75,
      overall: 82
    },
    stamina: 100,
    morale: 'Excellent',
    availability: { status: 'Available' }
  }
];

/**
 * Sample 4-3-3 formation with player assignments
 */
export const SAMPLE_FORMATION_433: Formation = {
  id: 'formation_433_default',
  name: '4-3-3 Attacking',
  description: 'Balanced formation with attacking wingers',
  systemId: '433',
  slots: [
    // Goalkeeper
    { id: 'gk', roleId: 'goalkeeper', defaultPosition: { x: 50, y: 5 }, playerId: 'gk1' },
    
    // Defense
    { id: 'lb', roleId: 'left-back', defaultPosition: { x: 15, y: 25 }, playerId: 'lb1' },
    { id: 'cb1', roleId: 'centre-back', defaultPosition: { x: 35, y: 20 }, playerId: 'cb1' },
    { id: 'cb2', roleId: 'centre-back', defaultPosition: { x: 65, y: 20 }, playerId: 'cb2' },
    { id: 'rb', roleId: 'right-back', defaultPosition: { x: 85, y: 25 }, playerId: 'rb1' },
    
    // Midfield
    { id: 'cdm', roleId: 'defensive-midfielder', defaultPosition: { x: 50, y: 45 }, playerId: 'cdm1' },
    { id: 'cm1', roleId: 'central-midfielder', defaultPosition: { x: 35, y: 60 }, playerId: 'cm1' },
    { id: 'cm2', roleId: 'attacking-midfielder', defaultPosition: { x: 65, y: 60 }, playerId: 'cm2' },
    
    // Attack
    { id: 'lw', roleId: 'left-winger', defaultPosition: { x: 25, y: 80 }, playerId: 'lw1' },
    { id: 'st', roleId: 'striker', defaultPosition: { x: 50, y: 90 }, playerId: 'st1' },
    { id: 'rw', roleId: 'right-winger', defaultPosition: { x: 75, y: 80 }, playerId: 'rw1' }
  ]
};

/**
 * Get bench players (those not in starting formation)
 */
export const getBenchPlayers = (players: Player[], formation: Formation): Player[] => {
  const startingPlayerIds = formation.slots
    .map(slot => slot.playerId)
    .filter(Boolean);
  
  return players.filter(player => !startingPlayerIds.includes(player.id));
};

/**
 * Group bench players by position
 */
export const groupPlayersByPosition = (players: Player[]): Record<string, Player[]> => {
  const groups: Record<string, Player[]> = {
    'Goalkeepers': [],
    'Defenders': [],
    'Midfielders': [],
    'Forwards': []
  };
  
  players.forEach(player => {
    const role = PLAYER_ROLES.find(r => r.id === player.roleId);
    if (!role) return;
    
    switch (role.category) {
      case 'goalkeeper':
        groups['Goalkeepers'].push(player);
        break;
      case 'defender':
        groups['Defenders'].push(player);
        break;
      case 'midfielder':
        groups['Midfielders'].push(player);
        break;
      case 'forward':
        groups['Forwards'].push(player);
        break;
    }
  });
  
  return groups;
};

/**
 * Initialize sample data for tactical board
 */
export const initializeSampleData = () => {
  return {
    players: SAMPLE_PLAYERS,
    formation: SAMPLE_FORMATION_433,
    benchPlayers: getBenchPlayers(SAMPLE_PLAYERS, SAMPLE_FORMATION_433)
  };
};