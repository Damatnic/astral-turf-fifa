/**
 * Player Chemistry Calculator
 * 
 * Calculates team chemistry and player compatibility for optimal lineup selection
 */

import type { Player } from '../types';

export interface ChemistryAnalysis {
  overallChemistry: number; // 0-100
  playerChemistry: PlayerChemistryScore[];
  chemistryMatrix: ChemistryConnection[];
  recommendations: ChemistryRecommendation[];
  teamCohesion: number; // 0-100
}

export interface PlayerChemistryScore {
  playerId: string;
  individualChemistry: number; // 0-100
  connections: number; // Number of strong connections
  factors: ChemistryFactor[];
}

export interface ChemistryConnection {
  player1Id: string;
  player2Id: string;
  connectionStrength: number; // 0-100
  factors: string[];
}

export interface ChemistryFactor {
  type: 'nationality' | 'position' | 'overall' | 'age' | 'role';
  impact: number; // -20 to +20
  description: string;
}

export interface ChemistryRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  playersAffected: string[];
}

/**
 * Calculate team chemistry for a lineup
 */
export function calculateTeamChemistry(players: Player[]): ChemistryAnalysis {
  const playerChemistry = players.map(player => 
    calculateIndividualChemistry(player, players)
  );

  const chemistryMatrix = generateChemistryMatrix(players);
  const overallChemistry = calculateOverallChemistry(playerChemistry);
  const teamCohesion = calculateTeamCohesion(players, chemistryMatrix);
  const recommendations = generateChemistryRecommendations(players, playerChemistry, chemistryMatrix);

  return {
    overallChemistry,
    playerChemistry,
    chemistryMatrix,
    recommendations,
    teamCohesion,
  };
}

/**
 * Calculate individual player chemistry
 */
function calculateIndividualChemistry(
  player: Player,
  allPlayers: Player[]
): PlayerChemistryScore {
  const factors: ChemistryFactor[] = [];
  let chemistryScore = 50; // Base chemistry

  // Nationality links
  const sameNationality = allPlayers.filter(p => 
    p.id !== player.id && p.nationality === player.nationality
  ).length;
  if (sameNationality > 0) {
    const nationalityBonus = Math.min(20, sameNationality * 5);
    chemistryScore += nationalityBonus;
    factors.push({
      type: 'nationality',
      impact: nationalityBonus,
      description: `${sameNationality} teammate(s) from ${player.nationality}`,
    });
  }

  // Position familiarity (playing in natural position)
  if (player.roleId) {
    chemistryScore += 10;
    factors.push({
      type: 'position',
      impact: 10,
      description: 'Playing in natural position',
    });
  }

  // Overall rating contribution
  if (player.overall >= 85) {
    chemistryScore += 10;
    factors.push({
      type: 'overall',
      impact: 10,
      description: 'High overall rating boosts team morale',
    });
  } else if (player.overall < 60) {
    chemistryScore -= 5;
    factors.push({
      type: 'overall',
      impact: -5,
      description: 'Lower rating may affect chemistry',
    });
  }

  // Age compatibility
  const avgAge = allPlayers.reduce((sum, p) => sum + p.age, 0) / allPlayers.length;
  const ageDiff = Math.abs(player.age - avgAge);
  if (ageDiff < 3) {
    chemistryScore += 5;
    factors.push({
      type: 'age',
      impact: 5,
      description: 'Good age compatibility with team',
    });
  }

  // Count strong connections
  const connections = allPlayers.filter(p => 
    p.id !== player.id && (p.nationality === player.nationality || Math.abs(p.age - player.age) < 5)
  ).length;

  return {
    playerId: player.id,
    individualChemistry: Math.max(0, Math.min(100, chemistryScore)),
    connections,
    factors,
  };
}

/**
 * Generate chemistry matrix showing player connections
 */
function generateChemistryMatrix(players: Player[]): ChemistryConnection[] {
  const connections: ChemistryConnection[] = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const player1 = players[i];
      const player2 = players[j];
      const connection = calculatePlayerConnection(player1, player2);
      
      if (connection.connectionStrength > 30) {
        connections.push(connection);
      }
    }
  }

  return connections.sort((a, b) => b.connectionStrength - a.connectionStrength);
}

/**
 * Calculate connection strength between two players
 */
function calculatePlayerConnection(
  player1: Player,
  player2: Player
): ChemistryConnection {
  let strength = 0;
  const factors: string[] = [];

  // Same nationality
  if (player1.nationality === player2.nationality) {
    strength += 30;
    factors.push(`Both from ${player1.nationality}`);
  }

  // Similar age
  const ageDiff = Math.abs(player1.age - player2.age);
  if (ageDiff <= 3) {
    strength += 20;
    factors.push(`Similar age (${player1.age}, ${player2.age})`);
  } else if (ageDiff <= 5) {
    strength += 10;
    factors.push('Compatible ages');
  }

  // Complementary positions (adjacent on field)
  if (areAdjacentPositions(player1.roleId, player2.roleId)) {
    strength += 25;
    factors.push('Adjacent positions on field');
  }

  // Similar overall rating
  const ratingDiff = Math.abs(player1.overall - player2.overall);
  if (ratingDiff <= 5) {
    strength += 15;
    factors.push('Similar skill level');
  }

  return {
    player1Id: player1.id,
    player2Id: player2.id,
    connectionStrength: Math.min(100, strength),
    factors,
  };
}

/**
 * Check if two positions are adjacent on the field
 */
function areAdjacentPositions(role1: string, role2: string): boolean {
  const adjacencyMap: Record<string, string[]> = {
    'GK': ['CB', 'LB', 'RB'],
    'CB': ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM'],
    'LB': ['GK', 'CB', 'LM', 'LWB'],
    'RB': ['GK', 'CB', 'RM', 'RWB'],
    'CDM': ['CB', 'CM', 'CAM'],
    'CM': ['CB', 'CDM', 'CAM', 'LM', 'RM'],
    'CAM': ['CM', 'ST', 'LW', 'RW'],
    'LM': ['LB', 'CM', 'LW'],
    'RM': ['RB', 'CM', 'RW'],
    'LW': ['LM', 'CAM', 'ST'],
    'RW': ['RM', 'CAM', 'ST'],
    'ST': ['CAM', 'LW', 'RW', 'ST'],
  };

  return adjacencyMap[role1]?.includes(role2) || false;
}

/**
 * Calculate overall team chemistry
 */
function calculateOverallChemistry(playerChemistry: PlayerChemistryScore[]): number {
  if (playerChemistry.length === 0) return 0;
  
  const total = playerChemistry.reduce((sum, pc) => sum + pc.individualChemistry, 0);
  return total / playerChemistry.length;
}

/**
 * Calculate team cohesion
 */
function calculateTeamCohesion(
  players: Player[],
  connections: ChemistryConnection[]
): number {
  if (players.length === 0) return 0;

  // Strong connections boost cohesion
  const strongConnections = connections.filter(c => c.connectionStrength >= 70).length;
  const maxPossibleConnections = (players.length * (players.length - 1)) / 2;
  
  const connectionRatio = maxPossibleConnections > 0 
    ? strongConnections / maxPossibleConnections 
    : 0;

  // Base cohesion from nationality diversity
  const nationalities = new Set(players.map(p => p.nationality)).size;
  const diversityPenalty = Math.max(0, (nationalities - 3) * 5);

  const cohesion = (connectionRatio * 80) + 20 - diversityPenalty;
  return Math.max(0, Math.min(100, cohesion));
}

/**
 * Generate chemistry improvement recommendations
 */
function generateChemistryRecommendations(
  players: Player[],
  playerChemistry: PlayerChemistryScore[],
  connections: ChemistryConnection[]
): ChemistryRecommendation[] {
  const recommendations: ChemistryRecommendation[] = [];

  // Find players with low chemistry
  const lowChemPlayers = playerChemistry.filter(pc => pc.individualChemistry < 50);
  if (lowChemPlayers.length > 0) {
    recommendations.push({
      title: 'Players with Low Chemistry',
      description: `${lowChemPlayers.length} player(s) have low chemistry. Consider substitutions or positioning changes.`,
      priority: 'high',
      playersAffected: lowChemPlayers.map(pc => pc.playerId),
    });
  }

  // Check for isolated players (few connections)
  const isolatedPlayers = playerChemistry.filter(pc => pc.connections < 2);
  if (isolatedPlayers.length > 0) {
    recommendations.push({
      title: 'Isolated Players',
      description: `${isolatedPlayers.length} player(s) have few connections. Add players from same nationality or similar age.`,
      priority: 'medium',
      playersAffected: isolatedPlayers.map(pc => pc.playerId),
    });
  }

  // Suggest nationality clustering
  const nationalities = players.reduce((acc, p) => {
    acc[p.nationality] = (acc[p.nationality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantNationality = Object.entries(nationalities)
    .sort((a, b) => b[1] - a[1])[0];

  if (dominantNationality && dominantNationality[1] >= 3) {
    recommendations.push({
      title: 'Strong National Core',
      description: `You have ${dominantNationality[1]} players from ${dominantNationality[0]}. This creates good chemistry.`,
      priority: 'low',
      playersAffected: players.filter(p => p.nationality === dominantNationality[0]).map(p => p.id),
    });
  }

  return recommendations.slice(0, 5);
}

/**
 * Get chemistry color for visualization
 */
export function getChemistryColor(chemistry: number): string {
  if (chemistry >= 80) return '#10b981'; // Green
  if (chemistry >= 60) return '#eab308'; // Yellow
  if (chemistry >= 40) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Get chemistry rating label
 */
export function getChemistryRating(chemistry: number): string {
  if (chemistry >= 90) return 'Excellent';
  if (chemistry >= 75) return 'Great';
  if (chemistry >= 60) return 'Good';
  if (chemistry >= 45) return 'Average';
  if (chemistry >= 30) return 'Poor';
  return 'Very Poor';
}

