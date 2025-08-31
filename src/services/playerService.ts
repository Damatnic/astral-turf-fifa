import {
  Player,
  PlayerAttributes,
  PlayerMorale,
  PlayerForm,
  PlayerTrait,
  IndividualTrainingFocus,
  TransferPlayer,
  YouthProspect,
  DevelopmentLogEntry,
  CommunicationLogEntry,
  ContractClause,
  PlayerContract,
  WeeklySchedule,
  TrainingDrill,
} from '../types';

export const generateRandomPlayer = (
  id: string,
  name: string,
  age: number,
  nationality: string,
  roleId: string,
  team: 'home' | 'away',
  teamColor: string,
  baseAttributes?: Partial<PlayerAttributes>,
): Player => {
  const attributes: PlayerAttributes = {
    speed: baseAttributes?.speed || Math.floor(Math.random() * 40) + 50,
    passing: baseAttributes?.passing || Math.floor(Math.random() * 40) + 50,
    tackling: baseAttributes?.tackling || Math.floor(Math.random() * 40) + 50,
    shooting: baseAttributes?.shooting || Math.floor(Math.random() * 40) + 50,
    dribbling: baseAttributes?.dribbling || Math.floor(Math.random() * 40) + 50,
    positioning: baseAttributes?.positioning || Math.floor(Math.random() * 40) + 50,
    stamina: baseAttributes?.stamina || Math.floor(Math.random() * 20) + 80,
  };

  const potentialMin = Math.max(...Object.values(attributes)) + Math.floor(Math.random() * 10);
  const potentialMax = potentialMin + Math.floor(Math.random() * 15) + 5;

  const traits: PlayerTrait[] = [];
  const traitPool: PlayerTrait[] = ['Leader', 'Ambitious', 'Loyal', 'Injury Prone', 'Consistent', 'Temperamental'];
  const numTraits = Math.floor(Math.random() * 3); // 0-2 traits

  for (let i = 0; i < numTraits; i++) {
    const randomTrait = traitPool[Math.floor(Math.random() * traitPool.length)];
    if (!traits.includes(randomTrait)) {
      traits.push(randomTrait);
    }
  }

  const moraleLevels: PlayerMorale[] = ['Excellent', 'Good', 'Okay', 'Poor', 'Very Poor'];
  const formLevels: PlayerForm[] = ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'];

  return {
    id,
    name,
    jerseyNumber: Math.floor(Math.random() * 99) + 1,
    age,
    nationality,
    potential: [potentialMin, potentialMax] as const,
    currentPotential: potentialMax,
    roleId,
    instructions: {},
    team,
    teamColor,
    attributes,
    position: { x: -100, y: -100 }, // Benched by default
    availability: { status: 'Available' },
    morale: moraleLevels[Math.floor(Math.random() * moraleLevels.length)],
    form: formLevels[Math.floor(Math.random() * formLevels.length)],
    stamina: attributes.stamina,
    developmentLog: [],
    contract: {
      wage: Math.floor(Math.random() * 50000) + 10000,
      expires: new Date().getFullYear() + Math.floor(Math.random() * 4) + 1,
      clauses: [],
    },
    stats: {
      goals: 0,
      assists: 0,
      matchesPlayed: 0,
      shotsOnTarget: 0,
      tacklesWon: 0,
      saves: 0,
      passesCompleted: 0,
      passesAttempted: 0,
      careerHistory: [],
    },
    loan: { isLoaned: false },
    traits,
    conversationHistory: [],
    attributeHistory: [],
    attributeDevelopmentProgress: {},
    communicationLog: [],
    customTrainingSchedule: null,
    fatigue: Math.floor(Math.random() * 20),
    injuryRisk: Math.floor(Math.random() * 10) + 1,
    lastConversationInitiatedWeek: 0,
    moraleBoost: null,
    completedChallenges: [],
  };
};

export const calculatePlayerOverall = (attributes: PlayerAttributes, roleId: string): number => {
  // Different positions weight attributes differently
  const roleWeights: Record<string, Partial<Record<keyof PlayerAttributes, number>>> = {
    'gk': { positioning: 0.4, speed: 0.2, passing: 0.1, tackling: 0.1, shooting: 0.1, dribbling: 0.1 },
    'cb': { tackling: 0.3, positioning: 0.3, speed: 0.2, passing: 0.1, shooting: 0.05, dribbling: 0.05 },
    'fb': { speed: 0.25, tackling: 0.2, positioning: 0.2, passing: 0.15, dribbling: 0.15, shooting: 0.05 },
    'dm': { tackling: 0.25, passing: 0.25, positioning: 0.25, speed: 0.15, dribbling: 0.05, shooting: 0.05 },
    'cm': { passing: 0.3, positioning: 0.2, speed: 0.15, tackling: 0.15, dribbling: 0.15, shooting: 0.05 },
    'wm': { speed: 0.25, dribbling: 0.2, passing: 0.2, positioning: 0.15, shooting: 0.1, tackling: 0.1 },
    'am': { passing: 0.25, dribbling: 0.25, shooting: 0.2, positioning: 0.15, speed: 0.1, tackling: 0.05 },
    'w': { speed: 0.3, dribbling: 0.25, shooting: 0.2, passing: 0.15, positioning: 0.05, tackling: 0.05 },
    'st': { shooting: 0.35, positioning: 0.25, speed: 0.15, dribbling: 0.15, passing: 0.05, tackling: 0.05 },
  };

  const weights = roleWeights[roleId] || {
    speed: 1/6, passing: 1/6, tackling: 1/6, shooting: 1/6, dribbling: 1/6, positioning: 1/6,
  };

  let overall = 0;
  Object.entries(weights).forEach(([attr, weight]) => {
    overall += attributes[attr as keyof PlayerAttributes] * (weight || 0);
  });

  return Math.round(overall);
};

export const calculatePlayerValue = (player: Player): number => {
  const overall = calculatePlayerOverall(player.attributes, player.roleId);
  const potential = player.currentPotential;
  const age = player.age;

  // Base value from overall rating
  let value = overall * 50000;

  // Age adjustments
  if (age < 23) {
    value *= 1.5; // Young players are more valuable
  } else if (age > 30) {
    value *= 0.7; // Older players depreciate
  }

  // Potential adjustments
  const potentialBonus = (potential - overall) / 10;
  value *= (1 + potentialBonus);

  // Contract situation
  const contractYearsLeft = (player.contract.expires || 2025) - new Date().getFullYear();
  if (contractYearsLeft <= 1) {
    value *= 0.5; // Players with expiring contracts are cheaper
  }

  // Morale and form adjustments
  const moraleMultipliers = { 'Excellent': 1.1, 'Good': 1.0, 'Okay': 0.95, 'Poor': 0.9, 'Very Poor': 0.8 };
  value *= moraleMultipliers[player.morale];

  // Trait adjustments
  player.traits.forEach(trait => {
    switch (trait) {
      case 'Leader': value *= 1.1; break;
      case 'Ambitious': value *= 1.05; break;
      case 'Loyal': value *= 0.95; break; // Slightly less valuable in transfer market
      case 'Injury Prone': value *= 0.8; break;
      case 'Consistent': value *= 1.1; break;
      case 'Temperamental': value *= 0.9; break;
    }
  });

  return Math.max(50000, Math.round(value));
};

export const suggestTrainingFocus = (player: Player): IndividualTrainingFocus | null => {
  const attributes = player.attributes;
  const roleId = player.roleId;

  // Find the weakest relevant attribute for the player's role
  const roleImportance: Record<string, (keyof PlayerAttributes)[]> = {
    'gk': ['positioning'],
    'cb': ['tackling', 'positioning', 'speed'],
    'fb': ['speed', 'tackling', 'positioning', 'passing'],
    'dm': ['tackling', 'passing', 'positioning'],
    'cm': ['passing', 'positioning', 'speed', 'tackling'],
    'wm': ['speed', 'dribbling', 'passing', 'positioning'],
    'am': ['passing', 'dribbling', 'shooting', 'positioning'],
    'w': ['speed', 'dribbling', 'shooting'],
    'st': ['shooting', 'positioning', 'speed', 'dribbling'],
  };

  const relevantAttributes = roleImportance[roleId] || Object.keys(attributes) as (keyof PlayerAttributes)[];

  // Find the attribute with the most room for improvement
  let lowestAttribute: keyof PlayerAttributes | null = null;
  let lowestValue = 100;

  relevantAttributes.forEach(attr => {
    if (attr !== 'stamina' && attributes[attr] < lowestValue && attributes[attr] < player.currentPotential - 5) {
      lowestValue = attributes[attr];
      lowestAttribute = attr;
    }
  });

  if (lowestAttribute && player.currentPotential - attributes[lowestAttribute] > 10) {
    return {
      attribute: lowestAttribute,
      intensity: player.age < 25 ? 'high' : 'normal',
    };
  }

  return null;
};

export const generateTransferPlayers = (count: number): TransferPlayer[] => {
  const players: TransferPlayer[] = [];

  const firstNames = ['Alex', 'Carlos', 'David', 'Erik', 'Franco', 'Gabriel', 'Hassan', 'Ivan', 'Jorge', 'Kevin'];
  const lastNames = ['Silva', 'Rodriguez', 'Johnson', 'Anderson', 'Martinez', 'Wilson', 'Brown', 'Davis', 'Miller', 'Garcia'];
  const nationalities = ['Brazil', 'Argentina', 'Spain', 'England', 'France', 'Germany', 'Italy', 'Portugal', 'Netherlands', 'Belgium'];
  const roles = ['gk', 'cb', 'fb', 'dm', 'cm', 'wm', 'am', 'w', 'st'];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const age = Math.floor(Math.random() * 15) + 18; // 18-32
    const nationality = nationalities[Math.floor(Math.random() * nationalities.length)];
    const roleId = roles[Math.floor(Math.random() * roles.length)];

    const basePlayer = generateRandomPlayer(
      `transfer_${Date.now()}_${i}`,
      name,
      age,
      nationality,
      roleId,
      'home',
      '#FF0000',
    );

    const { position, teamColor, ...transferPlayer } = basePlayer;
    const playerWithValue = {
      ...transferPlayer,
      askingPrice: calculatePlayerValue(basePlayer),
    };

    players.push(playerWithValue);
  }

  return players;
};

export const simulateTrainingSession = (
  player: Player,
  drill: TrainingDrill,
  facilityLevel: number = 1,
): {
  attributeGains: Partial<PlayerAttributes>;
  fatigueIncrease: number;
  injuryRisk: number;
  moraleChange: number;
} => {
  const attributeGains: Partial<PlayerAttributes> = {};

  // Calculate base gains
  let baseGain = drill.intensity === 'high' ? 2 : drill.intensity === 'medium' ? 1.5 : 1;

  // Age factor - younger players develop faster
  const ageFactor = Math.max(0.3, (32 - player.age) / 10);
  baseGain *= ageFactor;

  // Potential factor - players closer to potential develop slower
  const currentOverall = calculatePlayerOverall(player.attributes, player.roleId);
  const potentialFactor = Math.max(0.5, (player.currentPotential - currentOverall) / 20);
  baseGain *= potentialFactor;

  // Facility bonus
  baseGain *= (1 + (facilityLevel - 1) * 0.1);

  // Individual training focus bonus
  const focusBonus = player.individualTrainingFocus?.intensity === 'high' ? 2.5 :
                    player.individualTrainingFocus?.intensity === 'normal' ? 1.5 : 1;

  // Apply gains to primary attributes
  drill.primaryAttributes.forEach(attr => {
    if (attr !== 'stamina' && player.attributes[attr] < player.currentPotential) {
      let gain = baseGain * 2;
      if (player.individualTrainingFocus?.attribute === attr) {
        gain *= focusBonus;
      }
      attributeGains[attr] = Math.min(3, gain); // Cap at 3 points per session
    }
  });

  // Apply gains to secondary attributes
  drill.secondaryAttributes.forEach(attr => {
    if (attr !== 'stamina' && player.attributes[attr] < player.currentPotential) {
      let gain = baseGain;
      if (player.individualTrainingFocus?.attribute === attr) {
        gain *= focusBonus;
      }
      attributeGains[attr] = Math.min(2, gain); // Cap at 2 points per session
    }
  });

  const fatigueIncrease = drill.fatigueEffect * (drill.intensity === 'high' ? 1.5 : drill.intensity === 'medium' ? 1.2 : 1);
  const injuryRisk = drill.injuryRisk * (player.traits.includes('Injury Prone') ? 1.5 : 1);
  const moraleChange = drill.moraleEffect;

  return {
    attributeGains,
    fatigueIncrease,
    injuryRisk,
    moraleChange,
  };
};

export const playerService = {
  generateRandomPlayer,
  calculatePlayerOverall,
  calculatePlayerValue,
  suggestTrainingFocus,
  generateTransferPlayers,
  simulateTrainingSession,
};