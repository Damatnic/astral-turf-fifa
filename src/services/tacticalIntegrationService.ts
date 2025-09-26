import { type Formation, type Player } from '../types';
import { openAiService } from './openAiService';

interface TacticalAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  effectiveness: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
}

interface FormationExport {
  id: string;
  name: string;
  formation: Formation;
  players: Player[];
  analysis: TacticalAnalysis;
  timestamp: number;
}

interface MatchSimulationConfig {
  formation: Formation;
  players: Player[];
  opponent?: {
    formation: Formation;
    players: Player[];
  };
  tactics: {
    playStyle: 'attacking' | 'defensive' | 'balanced';
    tempo: 'slow' | 'medium' | 'fast';
    aggression: number; // 0-100
  };
}

class TacticalIntegrationService {

  /**
   * Analyze formation effectiveness using AI
   */
  async analyzeFormation(formation: Formation, players: Player[]): Promise<TacticalAnalysis> {
    try {
      const prompt = `Analyze this soccer formation:
        Formation: ${formation.name}
        Players: ${players.map(p => `${p.name} (${p.position})`).join(', ')}
        
        Provide tactical analysis including:
        1. Key strengths of this formation
        2. Potential weaknesses
        3. Strategic recommendations
        4. Overall effectiveness rating (0-100)
        5. Risk level assessment
        
        Format as JSON with keys: strengths, weaknesses, recommendations, effectiveness, riskLevel`;

      const analysis = await openAiService.generateContent(prompt);

      // Parse AI response or provide fallback
      try {
        return JSON.parse(analysis);
      } catch {
        return this.getFallbackAnalysis(formation, players);
      }
    } catch (error) {
      console.error('Formation analysis failed:', error);
      return this.getFallbackAnalysis(formation, players);
    }
  }

  /**
   * Calculate formation effectiveness against opponent
   */
  calculateMatchup(homeFormation: Formation, awayFormation: Formation): {
    homeAdvantage: number;
    awayAdvantage: number;
    keyBattles: string[];
    predictions: string[];
  } {
    // Simplified matchup calculation
    const homeStyle = this.analyzeFormationStyle(homeFormation);
    const awayStyle = this.analyzeFormationStyle(awayFormation);

    let homeAdvantage = 50;
    let awayAdvantage = 50;

    // Style advantages
    if (homeStyle === 'attacking' && awayStyle === 'defensive') {
      homeAdvantage += 10;
      awayAdvantage -= 10;
    } else if (homeStyle === 'defensive' && awayStyle === 'attacking') {
      homeAdvantage -= 5;
      awayAdvantage += 5;
    }

    return {
      homeAdvantage,
      awayAdvantage,
      keyBattles: this.identifyKeyBattles(homeFormation, awayFormation),
      predictions: this.generateMatchPredictions(homeAdvantage, awayAdvantage),
    };
  }

  /**
   * Export formation for sharing or simulation
   */
  exportFormation(formation: Formation, players: Player[], analysis?: TacticalAnalysis): FormationExport {
    return {
      id: (window as any).crypto?.randomUUID() || Math.random().toString(36),
      name: formation.name,
      formation,
      players,
      analysis: analysis || this.getFallbackAnalysis(formation, players),
      timestamp: Date.now(),
    };
  }

  /**
   * Create match simulation configuration
   */
  createSimulationConfig(
    formation: Formation,
    players: Player[],
    tactics?: Partial<MatchSimulationConfig['tactics']>,
  ): MatchSimulationConfig {
    return {
      formation,
      players,
      tactics: {
        playStyle: tactics?.playStyle || 'balanced',
        tempo: tactics?.tempo || 'medium',
        aggression: tactics?.aggression || 50,
        ...tactics,
      },
    };
  }

  /**
   * Calculate player chemistry in formation
   */
  calculatePlayerChemistry(players: Player[], formation: Formation): {
    overall: number;
    individual: Record<string, number>;
    suggestions: string[];
  } {
    const chemistry: Record<string, number> = {};
    let totalChemistry = 0;

    players.forEach(player => {
      // Simplified chemistry calculation based on position match
      const positionMatch = this.calculatePositionMatch(player, formation);
      const neighborBonus = this.calculateNeighborBonus(player, players, formation);

      chemistry[player.id] = Math.min(100, positionMatch + neighborBonus);
      totalChemistry += chemistry[player.id];
    });

    const overall = Math.round(totalChemistry / players.length);

    return {
      overall,
      individual: chemistry,
      suggestions: this.generateChemistrySuggestions(chemistry, players, formation),
    };
  }

  /**
   * Generate heat map data for formation analysis
   */
  generateHeatMapData(formation: Formation, players: Player[]): {
    zones: Array<{
      x: number;
      y: number;
      intensity: number;
      type: 'attack' | 'defense' | 'midfield';
    }>;
    coverage: number; // Field coverage percentage
  } {
    const zones = [];

    // Analyze formation positions and generate heat zones
    players.forEach(player => {
      const position = formation.positions[player.id];
      if (position) {
        zones.push({
          x: position.x,
          y: position.y,
          intensity: this.calculateZoneIntensity(player, formation),
          type: this.getZoneType(position.y),
        });
      }
    });

    return {
      zones,
      coverage: this.calculateFieldCoverage(zones),
    };
  }

  // Private helper methods
  private getFallbackAnalysis(_formation: Formation, players: Player[]): TacticalAnalysis {
    const playerCount = players.length;
    const attackers = players.filter(p => p.position?.includes('F')).length;
    const defenders = players.filter(p => p.position?.includes('B')).length;

    return {
      strengths: [
        playerCount >= 11 ? 'Full squad selected' : 'Partial squad',
        attackers > 2 ? 'Strong attacking presence' : 'Balanced attack',
        defenders > 3 ? 'Solid defensive structure' : 'Compact defense',
      ],
      weaknesses: [
        playerCount < 11 ? 'Missing players' : 'Standard formation',
        'Requires tactical analysis',
      ],
      recommendations: [
        'Consider player positioning',
        'Analyze opponent formation',
        'Adjust based on match conditions',
      ],
      effectiveness: Math.min(100, (playerCount / 11) * 75 + Math.random() * 25),
      riskLevel: attackers > defenders ? 'medium' : 'low',
    };
  }

  private analyzeFormationStyle(formation: Formation): 'attacking' | 'defensive' | 'balanced' {
    // Simplified formation style analysis
    const positions = Object.values(formation.positions);
    const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;

    if (avgY > 60) {return 'attacking';}
    if (avgY < 40) {return 'defensive';}
    return 'balanced';
  }

  private identifyKeyBattles(_home: Formation, _away: Formation): string[] {
    return [
      'Midfield control',
      'Wing play effectiveness',
      'Central defensive solidity',
      'Attacking third presence',
    ];
  }

  private generateMatchPredictions(homeAdv: number, awayAdv: number): string[] {
    const predictions = [];

    if (homeAdv > 60) {
      predictions.push('Home team likely to dominate possession');
    } else if (awayAdv > 60) {
      predictions.push('Away team expected to control the game');
    } else {
      predictions.push('Evenly matched tactical battle expected');
    }

    return predictions;
  }

  private calculatePositionMatch(_player: Player, _formation: Formation): number {
    // Simplified position matching - would need more complex logic
    return Math.random() * 40 + 40; // 40-80 base chemistry
  }

  private calculateNeighborBonus(_player: Player, _players: Player[], _formation: Formation): number {
    // Simplified neighbor chemistry bonus
    return Math.random() * 20; // 0-20 bonus
  }

  private generateChemistrySuggestions(
    chemistry: Record<string, number>,
    players: Player[],
    _formation: Formation,
  ): string[] {
    const suggestions = [];

    Object.entries(chemistry).forEach(([playerId, score]) => {
      if (score < 70) {
        const player = players.find(p => p.id === playerId);
        if (player) {
          suggestions.push(`Consider repositioning ${player.name} for better chemistry`);
        }
      }
    });

    if (suggestions.length === 0) {
      suggestions.push('Formation chemistry is well optimized');
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private calculateZoneIntensity(player: Player, _formation: Formation): number {
    // Factor in player attributes and position importance
    const baseIntensity = (player.currentPotential || 70) / 100;
    const positionImportance = this.getPositionImportance(player.position);

    return Math.min(1, baseIntensity * positionImportance);
  }

  private getZoneType(y: number): 'attack' | 'defense' | 'midfield' {
    if (y > 66) {return 'attack';}
    if (y < 33) {return 'defense';}
    return 'midfield';
  }

  private getPositionImportance(position: string): number {
    const importance: Record<string, number> = {
      'GK': 0.9,
      'CB': 0.8,
      'LB': 0.7,
      'RB': 0.7,
      'DM': 0.8,
      'CM': 0.9,
      'AM': 0.8,
      'LW': 0.7,
      'RW': 0.7,
      'ST': 0.9,
      'CF': 0.9,
    };

    return importance[position] || 0.7;
  }

  private calculateFieldCoverage(zones: Array<{ x: number; y: number; intensity: number }>): number {
    // Simplified coverage calculation
    const totalZones = zones.length;
    const weightedCoverage = zones.reduce((sum, zone) => sum + zone.intensity, 0);

    return Math.min(100, (weightedCoverage / totalZones) * 100);
  }
}

export const tacticalIntegrationService = new TacticalIntegrationService();
export type { TacticalAnalysis, FormationExport, MatchSimulationConfig };