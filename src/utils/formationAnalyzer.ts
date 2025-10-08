/**
 * AI Formation Analyzer
 * 
 * Analyzes formations to identify strengths, weaknesses, and provide tactical insights
 */

import type { Player } from '../types';
import type { ProfessionalFormation } from '../data/professionalFormations';

export interface FormationAnalysis {
  overallScore: number; // 0-100
  strengths: TacticalStrength[];
  weaknesses: TacticalWeakness[];
  recommendations: TacticalRecommendation[];
  playerSuitability: PlayerSuitabilityAnalysis[];
  tacticalBalance: TacticalBalance;
}

export interface TacticalStrength {
  aspect: string;
  score: number; // 0-100
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface TacticalWeakness {
  aspect: string;
  severity: number; // 0-100
  description: string;
  solution: string;
}

export interface TacticalRecommendation {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'positioning' | 'personnel' | 'tactical' | 'strategic';
}

export interface PlayerSuitabilityAnalysis {
  playerId: string;
  positionId: string;
  suitabilityScore: number; // 0-100
  reasons: string[];
}

export interface TacticalBalance {
  defensive: number; // 0-100
  attacking: number; // 0-100
  possession: number; // 0-100
  width: number; // 0-100
  compactness: number; // 0-100
}

/**
 * Analyze formation and provide comprehensive insights
 */
export function analyzeFormation(
  formation: ProfessionalFormation,
  players: Player[],
  context?: {
    opposingFormation?: ProfessionalFormation;
    matchSituation?: 'leading' | 'drawing' | 'losing';
  }
): FormationAnalysis {
  const tacticalBalance = calculateTacticalBalance(formation);
  const strengths = identifyStrengths(formation, tacticalBalance);
  const weaknesses = identifyWeaknesses(formation, tacticalBalance);
  const recommendations = generateRecommendations(formation, players, context);
  const playerSuitability = analyzePlayerSuitability(formation, players);
  const overallScore = calculateOverallScore(tacticalBalance, strengths, weaknesses);

  return {
    overallScore,
    strengths,
    weaknesses,
    recommendations,
    playerSuitability,
    tacticalBalance,
  };
}

/**
 * Calculate tactical balance scores
 */
function calculateTacticalBalance(formation: ProfessionalFormation): TacticalBalance {
  const positions = formation.positions;
  
  // Count players in each zone
  const defenders = positions.filter(p => p.y > 75).length;
  const midfielders = positions.filter(p => p.y >= 40 && p.y <= 75).length;
  const attackers = positions.filter(p => p.y < 40).length;
  
  // Calculate width (spread of players horizontally)
  const xPositions = positions.map(p => p.x);
  const minX = Math.min(...xPositions);
  const maxX = Math.max(...xPositions);
  const width = maxX - minX;
  
  // Calculate compactness (how tight the formation is)
  const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
  const variance = positions.reduce((sum, p) => sum + Math.pow(p.y - avgY, 2), 0) / positions.length;
  const compactness = 100 - Math.min(variance / 10, 100);

  return {
    defensive: Math.min(100, (defenders / 6) * 100 + 30),
    attacking: Math.min(100, (attackers / 5) * 100 + 30),
    possession: midfielders * 15,
    width: Math.min(100, width),
    compactness: compactness,
  };
}

/**
 * Identify formation strengths
 */
function identifyStrengths(
  formation: ProfessionalFormation,
  balance: TacticalBalance
): TacticalStrength[] {
  const strengths: TacticalStrength[] = [];

  if (balance.defensive > 70) {
    strengths.push({
      aspect: 'Defensive Stability',
      score: balance.defensive,
      description: 'Strong defensive structure with good coverage',
      impact: 'high',
    });
  }

  if (balance.attacking > 70) {
    strengths.push({
      aspect: 'Attacking Threat',
      score: balance.attacking,
      description: 'Multiple attacking options and goal threats',
      impact: 'high',
    });
  }

  if (balance.possession > 70) {
    strengths.push({
      aspect: 'Midfield Control',
      score: balance.possession,
      description: 'Dominates midfield and controls possession',
      impact: 'high',
    });
  }

  if (balance.width > 80) {
    strengths.push({
      aspect: 'Width and Flanks',
      score: balance.width,
      description: 'Excellent width stretching opponent defense',
      impact: 'medium',
    });
  }

  if (balance.compactness > 75) {
    strengths.push({
      aspect: 'Team Compactness',
      score: balance.compactness,
      description: 'Compact shape making it hard to play through',
      impact: 'medium',
    });
  }

  // Add formation-specific strengths
  formation.strengths.forEach((strength, idx) => {
    if (strengths.length < 6) {
      strengths.push({
        aspect: strength,
        score: 80 - (idx * 5),
        description: `${strength} - A key strength of this formation`,
        impact: 'medium',
      });
    }
  });

  return strengths.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Identify formation weaknesses
 */
function identifyWeaknesses(
  formation: ProfessionalFormation,
  balance: TacticalBalance
): TacticalWeakness[] {
  const weaknesses: TacticalWeakness[] = [];

  if (balance.defensive < 50) {
    weaknesses.push({
      aspect: 'Defensive Vulnerability',
      severity: 100 - balance.defensive,
      description: 'Weak defensive coverage leaves team exposed',
      solution: 'Add defensive midfielder or drop attackers deeper',
    });
  }

  if (balance.attacking < 50) {
    weaknesses.push({
      aspect: 'Limited Attacking Options',
      severity: 100 - balance.attacking,
      description: 'Few players in attacking positions',
      solution: 'Push midfielders higher or add attackers',
    });
  }

  if (balance.width < 50) {
    weaknesses.push({
      aspect: 'Lack of Width',
      severity: 100 - balance.width,
      description: 'Formation is too narrow, easy to defend against',
      solution: 'Use wing-backs or wide midfielders',
    });
  }

  // Add formation-specific weaknesses
  formation.weaknesses.forEach((weakness, idx) => {
    weaknesses.push({
      aspect: weakness,
      severity: 70 - (idx * 10),
      description: `${weakness} - Known weakness of this formation`,
      solution: 'Consider tactical adjustments or player selection',
    });
  });

  return weaknesses.sort((a, b) => b.severity - a.severity).slice(0, 4);
}

/**
 * Generate tactical recommendations
 */
function generateRecommendations(
  formation: ProfessionalFormation,
  players: Player[],
  context?: {
    opposingFormation?: ProfessionalFormation;
    matchSituation?: 'leading' | 'drawing' | 'losing';
  }
): TacticalRecommendation[] {
  const recommendations: TacticalRecommendation[] = [];

  // Context-based recommendations
  if (context?.matchSituation === 'leading' && formation.category === 'attacking') {
    recommendations.push({
      title: 'Consider More Defensive Setup',
      description: 'You are leading. Consider a more defensive formation to protect the lead.',
      priority: 'high',
      category: 'strategic',
    });
  }

  if (context?.matchSituation === 'losing' && formation.category === 'defensive') {
    recommendations.push({
      title: 'Increase Attacking Threat',
      description: 'You need goals. Consider a more attacking formation.',
      priority: 'critical',
      category: 'strategic',
    });
  }

  // Formation-specific recommendations
  if (formation.difficulty === 'expert') {
    recommendations.push({
      title: 'Complex Formation Requires Training',
      description: 'This is an advanced formation. Ensure players understand their roles.',
      priority: 'high',
      category: 'tactical',
    });
  }

  // Player-based recommendations
  const totalPlayers = players.length;
  if (totalPlayers < 11) {
    recommendations.push({
      title: 'Insufficient Players',
      description: `You have ${totalPlayers} players. Need 11 for full formation.`,
      priority: 'critical',
      category: 'personnel',
    });
  }

  // Default recommendations based on formation category
  if (formation.category === 'attacking') {
    recommendations.push({
      title: 'High Fitness Required',
      description: 'Attacking formations require high fitness levels. Monitor player stamina.',
      priority: 'medium',
      category: 'tactical',
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }).slice(0, 5);
}

/**
 * Analyze player suitability for positions
 */
function analyzePlayerSuitability(
  formation: ProfessionalFormation,
  players: Player[]
): PlayerSuitabilityAnalysis[] {
  return players.map(player => {
    const position = formation.positions.find(p => p.roleId === player.roleId);
    if (!position) {
      return {
        playerId: player.id,
        positionId: 'N/A',
        suitabilityScore: 50,
        reasons: ['No exact position match in this formation'],
      };
    }

    const score = calculatePlayerSuitability(player, position.roleId);
    return {
      playerId: player.id,
      positionId: position.roleId,
      suitabilityScore: score,
      reasons: getPlayerSuitabilityReasons(player, position.roleId, score),
    };
  });
}

/**
 * Calculate player suitability for a position
 */
function calculatePlayerSuitability(player: Player, roleId: string): number {
  // Base score from player's natural position match
  let score = player.roleId === roleId ? 90 : 60;

  // Adjust based on overall rating
  score += (player.overall - 70) / 3;

  // Ensure score is in 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Get reasons for player suitability score
 */
function getPlayerSuitabilityReasons(player: Player, roleId: string, score: number): string[] {
  const reasons: string[] = [];

  if (player.roleId === roleId) {
    reasons.push('Natural position match');
  } else {
    reasons.push('Not natural position - adaptability required');
  }

  if (player.overall >= 80) {
    reasons.push('High overall rating provides versatility');
  } else if (player.overall < 65) {
    reasons.push('Lower rating may struggle in this role');
  }

  if (score >= 80) {
    reasons.push('Excellent fit for this position');
  } else if (score < 60) {
    reasons.push('Consider alternative player for this role');
  }

  return reasons.slice(0, 3);
}

/**
 * Calculate overall formation score
 */
function calculateOverallScore(
  balance: TacticalBalance,
  strengths: TacticalStrength[],
  weaknesses: TacticalWeakness[]
): number {
  const balanceScore = (balance.defensive + balance.attacking + balance.possession + balance.width) / 4;
  const strengthBonus = strengths.reduce((sum, s) => sum + s.score, 0) / strengths.length;
  const weaknessPenalty = weaknesses.reduce((sum, w) => sum + w.severity, 0) / weaknesses.length;

  const overall = (balanceScore * 0.4) + (strengthBonus * 0.4) - (weaknessPenalty * 0.2);
  return Math.max(0, Math.min(100, overall));
}

