import { type Formation, type Player } from '../types';
import { openAiService } from './openAiService';

interface CoachingRecommendation {
  id: string;
  type: 'formation' | 'player' | 'tactical' | 'strategy' | 'substitution';
  title: string;
  description: string;
  reasoning: string;
  confidence: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: 'minor' | 'moderate' | 'significant' | 'game-changing';
  actions?: Array<{
    type: 'move_player' | 'change_formation' | 'adjust_tactics' | 'substitute_player';
    description: string;
    parameters: any;
  }>;
}

interface TacticalAdvice {
  gamePhase: 'early' | 'mid' | 'late' | 'extra-time';
  situation: 'winning' | 'losing' | 'drawing' | 'pressure' | 'counter-attack';
  recommendations: CoachingRecommendation[];
  overallStrategy: string;
  keyFocus: string[];
}

interface PlayerAnalysis {
  player: Player;
  currentRole: string;
  suitability: number; // 0-100
  alternatives: Array<{
    position: string;
    suitability: number;
    reason: string;
  }>;
  performance: {
    positioning: number;
    chemistry: number;
    effectiveness: number;
  };
}

interface FormationWeakness {
  area: 'attack' | 'midfield' | 'defense' | 'wings' | 'center';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  solutions: string[];
}

class AICoachingService {
  private lastAnalysis: Map<string, any> = new Map();
  private coachingHistory: CoachingRecommendation[] = [];

  /**
   * Generate comprehensive coaching recommendations
   */
  async generateCoachingRecommendations(
    formation: Formation,
    players: Player[],
    context?: {
      gamePhase?: string;
      score?: { home: number; away: number };
      gameState?: string;
      opposition?: Formation;
    },
  ): Promise<CoachingRecommendation[]> {
    try {
      const recommendations: CoachingRecommendation[] = [];

      // Analyze formation structure
      const formationAnalysis = await this.analyzeFormationStructure(formation, players);
      recommendations.push(...formationAnalysis);

      // Analyze player positioning
      const playerAnalysis = await this.analyzePlayerPositioning(formation, players);
      recommendations.push(...playerAnalysis);

      // Generate tactical recommendations
      const tacticalRecommendations = await this.generateTacticalAdvice(formation, players, context);
      recommendations.push(...tacticalRecommendations);

      // AI-powered recommendations
      const aiRecommendations = await this.getAIRecommendations(formation, players, context);
      recommendations.push(...aiRecommendations);

      // Sort by priority and confidence
      return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) {return priorityDiff;}
        return b.confidence - a.confidence;
      });

    } catch (error) {
      console.error('Failed to generate coaching recommendations:', error);
      return this.getFallbackRecommendations(formation, players);
    }
  }

  /**
   * Analyze formation structure and balance
   */
  private async analyzeFormationStructure(formation: Formation, players: Player[]): Promise<CoachingRecommendation[]> {
    const recommendations: CoachingRecommendation[] = [];

    if (!formation.positions || players.length === 0) {return recommendations;}

    const positions = Object.values(formation.positions);
    
    // Filter out null/undefined positions and ensure valid coordinates
    const validPositions = positions.filter(pos => pos && typeof pos.x === 'number' && typeof pos.y === 'number');
    
    if (validPositions.length === 0) {return recommendations;}

    // Analyze width and depth
    const avgX = validPositions.reduce((sum, pos) => sum + pos.x, 0) / validPositions.length;
    const xCoordinates = validPositions.map(p => p.x);
    const yCoordinates = validPositions.map(p => p.y);
    const spreadX = Math.max(...xCoordinates) - Math.min(...xCoordinates);
    const spreadY = Math.max(...yCoordinates) - Math.min(...yCoordinates);

    // Check for formation imbalances
    if (Math.abs(avgX - 50) > 15) {
      recommendations.push({
        id: 'formation-lateral-balance',
        type: 'formation',
        title: 'Improve Lateral Balance',
        description: `Formation is ${avgX > 50 ? 'right' : 'left'}-heavy. Consider repositioning players for better balance.`,
        reasoning: 'Unbalanced formations can be exploited by opponents focusing attacks on the weaker side.',
        confidence: 85,
        priority: 'medium',
        impact: 'moderate',
        actions: [{
          type: 'adjust_tactics',
          description: 'Reposition players for better lateral balance',
          parameters: { targetBalance: 50, currentBalance: avgX },
        }],
      });
    }

    // Check formation compactness
    if (spreadY > 80) {
      recommendations.push({
        id: 'formation-compactness',
        type: 'tactical',
        title: 'Increase Formation Compactness',
        description: 'Players are too spread out vertically, making midfield control difficult.',
        reasoning: 'Compact formations allow better passing connections and pressing coordination.',
        confidence: 78,
        priority: 'medium',
        impact: 'significant',
        actions: [{
          type: 'adjust_tactics',
          description: 'Bring lines closer together',
          parameters: { currentSpread: spreadY, targetSpread: 70 },
        }],
      });
    }

    // Check for width utilization
    if (spreadX < 60) {
      recommendations.push({
        id: 'formation-width',
        type: 'tactical',
        title: 'Utilize Field Width',
        description: 'Formation is too narrow. Spread players wider to stretch the opposition.',
        reasoning: 'Width creates space in central areas and provides more passing options.',
        confidence: 82,
        priority: 'medium',
        impact: 'moderate',
        actions: [{
          type: 'adjust_tactics',
          description: 'Position wingers and fullbacks wider',
          parameters: { currentWidth: spreadX, recommendedWidth: 75 },
        }],
      });
    }

    return recommendations;
  }

  /**
   * Analyze individual player positioning
   */
  private async analyzePlayerPositioning(formation: Formation, players: Player[]): Promise<CoachingRecommendation[]> {
    const recommendations: CoachingRecommendation[] = [];

    for (const player of players) {
      const position = formation.positions[player.id];
      if (!position) {continue;}

      const analysis = this.analyzePlayerPosition(player, position, formation);

      if (analysis.suitability < 70) {
        recommendations.push({
          id: `player-position-${player.id}`,
          type: 'player',
          title: `Optimize ${player.name}'s Position`,
          description: `${player.name} is only ${analysis.suitability}% suited for current position.`,
          reasoning: analysis.alternatives[0]?.reason || 'Player attributes don\'t match position requirements',
          confidence: Math.max(0, 100 - analysis.suitability),
          priority: analysis.suitability < 50 ? 'high' : 'medium',
          impact: analysis.suitability < 50 ? 'significant' : 'moderate',
          actions: [{
            type: 'move_player',
            description: `Move to ${analysis.alternatives[0]?.position || 'better position'}`,
            parameters: {
              playerId: player.id,
              currentPosition: position,
              suggestedPosition: analysis.alternatives[0]?.position,
            },
          }],
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate tactical advice based on game context
   */
  private async generateTacticalAdvice(
    formation: Formation,
    players: Player[],
    context?: any,
  ): Promise<CoachingRecommendation[]> {
    const recommendations: CoachingRecommendation[] = [];

    // Analyze based on game phase
    if (context?.gamePhase === 'late' && context?.score) {
      const { home, away } = context.score;

      if (home < away) { // Losing
        recommendations.push({
          id: 'tactical-urgent-attack',
          type: 'strategy',
          title: 'Increase Attacking Urgency',
          description: 'Push more players forward and increase tempo to find equalizer.',
          reasoning: 'Being behind late in game requires taking calculated risks.',
          confidence: 90,
          priority: 'high',
          impact: 'game-changing',
          actions: [{
            type: 'adjust_tactics',
            description: 'Move defensive players higher up the pitch',
            parameters: { urgency: 'high', focus: 'attack' },
          }],
        });
      } else if (home > away) { // Winning
        recommendations.push({
          id: 'tactical-defensive-stability',
          type: 'strategy',
          title: 'Maintain Defensive Stability',
          description: 'Protect the lead by maintaining compact defensive shape.',
          reasoning: 'Preserve advantage while minimizing opponent scoring opportunities.',
          confidence: 85,
          priority: 'high',
          impact: 'game-changing',
          actions: [{
            type: 'adjust_tactics',
            description: 'Drop deeper and focus on defensive solidity',
            parameters: { urgency: 'low', focus: 'defense' },
          }],
        });
      }
    }

    return recommendations;
  }

  /**
   * Get AI-powered recommendations using OpenAI
   */
  private async getAIRecommendations(
    formation: Formation,
    players: Player[],
    context?: any,
  ): Promise<CoachingRecommendation[]> {
    try {

      const prompt = `As an expert football tactical analyst, analyze this formation and provide specific coaching recommendations:

Formation: ${formation.name}
Players: ${players.length}
Formation Effectiveness: ${formationAnalysis.effectiveness}%
Risk Level: ${formationAnalysis.riskLevel}

Strengths: ${formationAnalysis.strengths.join(', ')}
Weaknesses: ${formationAnalysis.weaknesses.join(', ')}

Game Context: ${context ? JSON.stringify(context) : 'Standard match'}

Provide 2-3 specific, actionable coaching recommendations in JSON format:
{
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description",
      "reasoning": "Why this is important",
      "priority": "high|medium|low",
      "confidence": 0-100,
      "impact": "game-changing|significant|moderate|minor"
    }
  ]
}`;

      const response = await openAiService.generateContent(prompt);
      const aiAnalysis = JSON.parse(response);

      return aiAnalysis.recommendations.map((rec: any, index: number) => ({
        id: `ai-recommendation-${index}`,
        type: 'tactical' as const,
        title: rec.title,
        description: rec.description,
        reasoning: rec.reasoning,
        confidence: rec.confidence,
        priority: rec.priority,
        impact: rec.impact,
        actions: [{
          type: 'adjust_tactics',
          description: rec.description,
          parameters: { source: 'ai', recommendation: rec },
        }],
      }));

    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      return [];
    }
  }

  /**
   * Analyze individual player position suitability
   */
  private analyzePlayerPosition(player: Player, position: { x: number; y: number }, _formation: Formation): PlayerAnalysis {
    // Simplified analysis - in a real app, this would use comprehensive player attributes
    const baseScore = player.currentPotential || 70;

    // Position-based modifiers
    let positionSuitability = baseScore;

    // Determine position type based on field coordinates
    const positionType = this.getPositionType(position);

    // Mock player preferred position matching
    const preferredPosition = player.position || 'CM';
    const positionMatch = this.calculatePositionMatch(preferredPosition, positionType);

    positionSuitability = Math.min(100, baseScore * (positionMatch / 100));

    return {
      player,
      currentRole: positionType,
      suitability: positionSuitability,
      alternatives: this.generateAlternativePositions(player, position),
      performance: {
        positioning: positionSuitability,
        chemistry: 70 + Math.random() * 30,
        effectiveness: (positionSuitability + baseScore) / 2,
      },
    };
  }

  /**
   * Get position type based on field coordinates
   */
  private getPositionType(position: { x: number; y: number }): string {
    const { x, y } = position;

    if (y < 25) {return 'Defender';}
    if (y > 75) {return 'Attacker';}
    if (x < 25) {return 'Left Wing';}
    if (x > 75) {return 'Right Wing';}
    return 'Midfielder';
  }

  /**
   * Calculate how well a player's preferred position matches current position
   */
  private calculatePositionMatch(preferred: string, current: string): number {
    const positionMap: Record<string, string[]> = {
      'GK': ['Goalkeeper'],
      'CB': ['Defender'],
      'LB': ['Left Wing', 'Defender'],
      'RB': ['Right Wing', 'Defender'],
      'DM': ['Midfielder', 'Defender'],
      'CM': ['Midfielder'],
      'AM': ['Midfielder', 'Attacker'],
      'LW': ['Left Wing', 'Attacker'],
      'RW': ['Right Wing', 'Attacker'],
      'ST': ['Attacker'],
      'CF': ['Attacker'],
    };

    const preferredRoles = positionMap[preferred] || ['Midfielder'];
    return preferredRoles.includes(current) ? 100 : 60;
  }

  /**
   * Generate alternative positions for a player
   */
  private generateAlternativePositions(player: Player, currentPosition: { x: number; y: number }): Array<{
    position: string;
    suitability: number;
    reason: string;
  }> {
    const alternatives = [];
    const baseScore = player.currentPotential || 70;

    // Generate some alternative positions based on player's current position
    if (currentPosition.y < 50) { // Defensive half
      alternatives.push({
        position: 'Midfielder',
        suitability: Math.min(100, baseScore + 10),
        reason: 'Player has good passing ability for midfield role',
      });
    } else { // Attacking half
      alternatives.push({
        position: 'Support Striker',
        suitability: Math.min(100, baseScore + 5),
        reason: 'Player could provide good support in advanced position',
      });
    }

    return alternatives.slice(0, 2);
  }

  /**
   * Fallback recommendations when AI analysis fails
   */
  private getFallbackRecommendations(_formation: Formation, _players: Player[]): CoachingRecommendation[] {
    return [
      {
        id: 'fallback-balance',
        type: 'formation',
        title: 'Review Formation Balance',
        description: 'Consider adjusting player positions for better field coverage.',
        reasoning: 'Balanced formations provide stability in both attacking and defensive phases.',
        confidence: 75,
        priority: 'medium',
        impact: 'moderate',
      },
      {
        id: 'fallback-chemistry',
        type: 'player',
        title: 'Optimize Player Chemistry',
        description: 'Place players in positions that maximize their natural abilities.',
        reasoning: 'Players perform better when positioned according to their strengths.',
        confidence: 80,
        priority: 'medium',
        impact: 'significant',
      },
    ];
  }

  /**
   * Store coaching recommendation in history
   */
  storeRecommendation(recommendation: CoachingRecommendation): void {
    this.coachingHistory.push({
      ...recommendation,
      id: `${recommendation.id}-${Date.now()}`,
    });

    // Keep only last 50 recommendations
    if (this.coachingHistory.length > 50) {
      this.coachingHistory = this.coachingHistory.slice(-50);
    }
  }

  /**
   * Get coaching history
   */
  getCoachingHistory(): CoachingRecommendation[] {
    return [...this.coachingHistory];
  }
}

export const aiCoachingService = new AICoachingService();
export type { CoachingRecommendation, TacticalAdvice, PlayerAnalysis, FormationWeakness };