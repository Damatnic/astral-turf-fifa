/**
 * AI Predictive Analytics Engine
 * Advanced machine learning for match outcome prediction and player performance analysis
 */

import { Player, Formation, PlayerAttributes, MatchResult, Team } from '../types';

// Monte Carlo simulation for match prediction
class MonteCarloSimulator {
  private simulationCount: number;
  
  constructor(simulationCount: number = 10000) {
    this.simulationCount = simulationCount;
  }
  
  /**
   * Simulate match outcomes using Monte Carlo method
   */
  simulateMatch(
    homeTeam: TeamData,
    awayTeam: TeamData,
    conditions: MatchConditions = {}
  ): MatchPrediction {
    const results: SimulationResult[] = [];
    
    for (let i = 0; i < this.simulationCount; i++) {
      results.push(this.runSingleSimulation(homeTeam, awayTeam, conditions));
    }
    
    return this.aggregateResults(results);
  }
  
  private runSingleSimulation(
    homeTeam: TeamData,
    awayTeam: TeamData,
    conditions: MatchConditions
  ): SimulationResult {
    // Apply random variations to team strength
    const homeStrength = this.applyRandomVariation(homeTeam.overallStrength, 0.15);
    const awayStrength = this.applyRandomVariation(awayTeam.overallStrength, 0.15);
    
    // Apply home advantage
    const adjustedHomeStrength = homeStrength * (conditions.isHomeAdvantage ? 1.1 : 1.0);
    
    // Apply weather and other conditions
    const weatherImpact = this.calculateWeatherImpact(conditions.weather, homeTeam, awayTeam);
    const finalHomeStrength = adjustedHomeStrength * weatherImpact.home;
    const finalAwayStrength = awayStrength * weatherImpact.away;
    
    // Simulate goals using Poisson distribution approximation
    const homeGoals = this.simulateGoals(finalHomeStrength, awayTeam.defensiveStrength);
    const awayGoals = this.simulateGoals(finalAwayStrength, homeTeam.defensiveStrength);
    
    return {
      homeGoals,
      awayGoals,
      homeStrength: finalHomeStrength,
      awayStrength: finalAwayStrength
    };
  }
  
  private applyRandomVariation(value: number, variance: number): number {
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
    return Math.max(0, value * randomFactor);
  }
  
  private calculateWeatherImpact(
    weather: WeatherCondition | undefined,
    homeTeam: TeamData,
    awayTeam: TeamData
  ): { home: number; away: number } {
    if (!weather) return { home: 1.0, away: 1.0 };
    
    switch (weather) {
      case 'rain':
        // Teams with better technical skills suffer less in rain
        return {
          home: 1 - (0.1 * (1 - homeTeam.technicalStrength)),
          away: 1 - (0.1 * (1 - awayTeam.technicalStrength))
        };
      case 'wind':
        // Affects passing accuracy
        return {
          home: 1 - 0.05,
          away: 1 - 0.05
        };
      case 'cold':
        // Players with better stamina handle cold better
        return {
          home: 1 - (0.05 * (1 - homeTeam.physicalStrength)),
          away: 1 - (0.05 * (1 - awayTeam.physicalStrength))
        };
      default:
        return { home: 1.0, away: 1.0 };
    }
  }
  
  private simulateGoals(attackStrength: number, defenseStrength: number): number {
    // Expected goals based on strength differential
    const expectedGoals = Math.max(0, attackStrength - defenseStrength) * 3;
    
    // Use Poisson-like distribution for goal simulation
    return this.poissonSample(expectedGoals);
  }
  
  private poissonSample(lambda: number): number {
    if (lambda === 0) return 0;
    
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    
    return k - 1;
  }
  
  private aggregateResults(results: SimulationResult[]): MatchPrediction {
    const homeWins = results.filter(r => r.homeGoals > r.awayGoals).length;
    const draws = results.filter(r => r.homeGoals === r.awayGoals).length;
    const awayWins = results.filter(r => r.homeGoals < r.awayGoals).length;
    
    const totalGoalsHome = results.reduce((sum, r) => sum + r.homeGoals, 0);
    const totalGoalsAway = results.reduce((sum, r) => sum + r.awayGoals, 0);
    
    return {
      homeWinProbability: homeWins / this.simulationCount,
      drawProbability: draws / this.simulationCount,
      awayWinProbability: awayWins / this.simulationCount,
      expectedGoalsHome: totalGoalsHome / this.simulationCount,
      expectedGoalsAway: totalGoalsAway / this.simulationCount,
      confidence: this.calculateConfidence(results),
      goalDistribution: this.calculateGoalDistribution(results),
      keyFactors: this.identifyKeyFactors(results)
    };
  }
  
  private calculateConfidence(results: SimulationResult[]): number {
    // Calculate confidence based on result consistency
    const homeWins = results.filter(r => r.homeGoals > r.awayGoals).length;
    const draws = results.filter(r => r.homeGoals === r.awayGoals).length;
    const awayWins = results.filter(r => r.homeGoals < r.awayGoals).length;
    
    const maxOutcome = Math.max(homeWins, draws, awayWins);
    return maxOutcome / this.simulationCount;
  }
  
  private calculateGoalDistribution(results: SimulationResult[]): GoalDistribution {
    const distribution: Record<string, number> = {};
    
    results.forEach(result => {
      const key = `${result.homeGoals}-${result.awayGoals}`;
      distribution[key] = (distribution[key] || 0) + 1;
    });
    
    // Convert to percentages and get top 5 most likely scores
    const sortedScores = Object.entries(distribution)
      .map(([score, count]) => ({ score, probability: count / this.simulationCount }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);
    
    return {
      mostLikelyScores: sortedScores,
      over25Goals: results.filter(r => r.homeGoals + r.awayGoals > 2.5).length / this.simulationCount,
      bothTeamsToScore: results.filter(r => r.homeGoals > 0 && r.awayGoals > 0).length / this.simulationCount
    };
  }
  
  private identifyKeyFactors(results: SimulationResult[]): string[] {
    const factors: string[] = [];
    
    const avgHomeStrength = results.reduce((sum, r) => sum + r.homeStrength, 0) / results.length;
    const avgAwayStrength = results.reduce((sum, r) => sum + r.awayStrength, 0) / results.length;
    
    if (avgHomeStrength > avgAwayStrength * 1.2) {
      factors.push("Significant home team strength advantage");
    } else if (avgAwayStrength > avgHomeStrength * 1.2) {
      factors.push("Significant away team strength advantage");
    } else {
      factors.push("Evenly matched teams - tight contest expected");
    }
    
    const highScoringGames = results.filter(r => r.homeGoals + r.awayGoals > 3).length / results.length;
    if (highScoringGames > 0.6) {
      factors.push("High-scoring match likely due to attacking strengths");
    } else if (highScoringGames < 0.3) {
      factors.push("Low-scoring match expected due to defensive solidity");
    }
    
    return factors;
  }
}

// Player performance predictor using machine learning
class PlayerPerformancePredictor {
  /**
   * Predict player performance based on historical data and current form
   */
  predictPlayerPerformance(
    player: Player,
    matchContext: MatchContext
  ): PlayerPerformancePrediction {
    const basePerformance = this.calculateBasePerformance(player);
    const formAdjustment = this.calculateFormAdjustment(player);
    const contextAdjustment = this.calculateContextAdjustment(player, matchContext);
    const fitnessImpact = this.calculateFitnessImpact(player);
    
    const adjustedPerformance = basePerformance * formAdjustment * contextAdjustment * fitnessImpact;
    
    return {
      expectedRating: Math.min(10, Math.max(0, adjustedPerformance * 10)),
      confidence: this.calculatePredictionConfidence(player, matchContext),
      keyStrengths: this.identifyKeyStrengths(player, matchContext),
      potentialWeaknesses: this.identifyPotentialWeaknesses(player, matchContext),
      injuryRisk: this.calculateInjuryRisk(player, matchContext),
      optimalPosition: this.findOptimalPosition(player, matchContext)
    };
  }
  
  private calculateBasePerformance(player: Player): number {
    const attributes = player.attributes;
    const roleWeights = this.getRoleWeights(player.roleId);
    
    let weightedScore = 0;
    Object.entries(attributes).forEach(([attr, value]) => {
      const weight = roleWeights[attr as keyof PlayerAttributes] || 0.1;
      weightedScore += (value / 100) * weight;
    });
    
    return weightedScore;
  }
  
  private getRoleWeights(roleId: string): Partial<Record<keyof PlayerAttributes, number>> {
    // Define how much each attribute matters for different roles
    const roleWeightMap: Record<string, Partial<Record<keyof PlayerAttributes, number>>> = {
      'GK': {
        positioning: 0.4,
        tackling: 0.2,
        speed: 0.1,
        passing: 0.1,
        shooting: 0.1,
        dribbling: 0.1
      },
      'DF': {
        tackling: 0.3,
        positioning: 0.3,
        speed: 0.2,
        passing: 0.1,
        shooting: 0.05,
        dribbling: 0.05
      },
      'MF': {
        passing: 0.3,
        positioning: 0.2,
        speed: 0.2,
        tackling: 0.15,
        dribbling: 0.1,
        shooting: 0.05
      },
      'FW': {
        shooting: 0.3,
        speed: 0.25,
        dribbling: 0.2,
        positioning: 0.15,
        passing: 0.05,
        tackling: 0.05
      }
    };
    
    // Find matching role pattern
    for (const [role, weights] of Object.entries(roleWeightMap)) {
      if (roleId.includes(role)) {
        return weights;
      }
    }
    
    // Default balanced weights
    return {
      speed: 0.2,
      passing: 0.2,
      tackling: 0.2,
      shooting: 0.1,
      dribbling: 0.15,
      positioning: 0.15
    };
  }
  
  private calculateFormAdjustment(player: Player): number {
    // Convert form enum to numeric value
    const formMap = {
      'Excellent': 1.2,
      'Good': 1.1,
      'Average': 1.0,
      'Poor': 0.9,
      'Very Poor': 0.8
    };
    
    return formMap[player.form] || 1.0;
  }
  
  private calculateContextAdjustment(player: Player, context: MatchContext): number {
    let adjustment = 1.0;
    
    // Home/away adjustment
    if (context.isHome && player.team === 'home') {
      adjustment *= 1.05;
    } else if (!context.isHome && player.team === 'away') {
      adjustment *= 1.05;
    }
    
    // Opposition strength adjustment
    if (context.oppositionStrength > 0.8 && player.attributes.positioning > 80) {
      adjustment *= 1.1; // Experienced players perform better against strong opposition
    } else if (context.oppositionStrength > 0.8) {
      adjustment *= 0.95; // Others may struggle
    }
    
    // Match importance adjustment
    if (context.matchImportance === 'high' && player.morale === 'Excellent') {
      adjustment *= 1.1;
    } else if (context.matchImportance === 'high' && player.morale === 'Poor') {
      adjustment *= 0.9;
    }
    
    return adjustment;
  }
  
  private calculateFitnessImpact(player: Player): number {
    const staminaImpact = player.stamina / 100;
    const fatigueImpact = Math.max(0, 1 - player.fatigue / 100);
    
    return (staminaImpact + fatigueImpact) / 2;
  }
  
  private calculatePredictionConfidence(player: Player, context: MatchContext): number {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence for players with consistent form
    if (player.form === 'Excellent' || player.form === 'Good') {
      confidence += 0.1;
    }
    
    // Higher confidence for experienced players
    if (player.age > 25 && player.age < 32) {
      confidence += 0.1;
    }
    
    // Lower confidence for injury-prone players
    if (player.traits.includes('Injury Prone')) {
      confidence -= 0.1;
    }
    
    // Lower confidence for big matches with young players
    if (context.matchImportance === 'high' && player.age < 22) {
      confidence -= 0.05;
    }
    
    return Math.min(1, Math.max(0.3, confidence));
  }
  
  private identifyKeyStrengths(player: Player, context: MatchContext): string[] {
    const strengths: string[] = [];
    const attributes = player.attributes;
    
    // Identify standout attributes (above 80)
    Object.entries(attributes).forEach(([attr, value]) => {
      if (value > 80) {
        strengths.push(`Exceptional ${attr}`);
      }
    });
    
    // Context-specific strengths
    if (context.oppositionWeakness === 'pace' && attributes.speed > 75) {
      strengths.push("Pace advantage against slow opposition");
    }
    
    if (context.oppositionWeakness === 'aerial' && attributes.positioning > 75) {
      strengths.push("Strong aerial presence");
    }
    
    return strengths;
  }
  
  private identifyPotentialWeaknesses(player: Player, context: MatchContext): string[] {
    const weaknesses: string[] = [];
    const attributes = player.attributes;
    
    // Identify concerning attributes (below 60)
    Object.entries(attributes).forEach(([attr, value]) => {
      if (value < 60) {
        weaknesses.push(`Vulnerable ${attr}`);
      }
    });
    
    // Context-specific vulnerabilities
    if (context.oppositionStrength > 0.8 && player.age < 20) {
      weaknesses.push("Inexperience against strong opposition");
    }
    
    if (player.fatigue > 70) {
      weaknesses.push("Fitness concerns may affect late-game performance");
    }
    
    return weaknesses;
  }
  
  private calculateInjuryRisk(player: Player, context: MatchContext): InjuryRisk {
    let riskScore = player.injuryRisk / 100;
    
    // Adjust based on traits
    if (player.traits.includes('Injury Prone')) {
      riskScore += 0.2;
    }
    
    // Adjust based on fatigue
    riskScore += player.fatigue / 500; // Fatigue contributes to injury risk
    
    // Adjust based on match intensity
    if (context.matchImportance === 'high') {
      riskScore += 0.1;
    }
    
    riskScore = Math.min(1, Math.max(0, riskScore));
    
    return {
      level: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
      score: riskScore,
      factors: this.getInjuryRiskFactors(player, riskScore)
    };
  }
  
  private getInjuryRiskFactors(player: Player, riskScore: number): string[] {
    const factors: string[] = [];
    
    if (player.traits.includes('Injury Prone')) {
      factors.push("Injury-prone trait");
    }
    
    if (player.fatigue > 70) {
      factors.push("High fatigue levels");
    }
    
    if (player.age > 32) {
      factors.push("Advanced age");
    }
    
    if (riskScore > 0.5 && factors.length === 0) {
      factors.push("General wear and tear");
    }
    
    return factors;
  }
  
  private findOptimalPosition(player: Player, context: MatchContext): PositionRecommendation {
    const attributes = player.attributes;
    const currentRole = player.roleId;
    
    // Calculate suitability for different positions
    const positionScores = this.calculatePositionSuitability(attributes);
    
    // Sort by score
    const sortedPositions = Object.entries(positionScores)
      .sort(([, a], [, b]) => b - a)
      .map(([position, score]) => ({ position, score }));
    
    const currentScore = positionScores[currentRole] || 0;
    const bestPosition = sortedPositions[0];
    
    return {
      currentPositionScore: currentScore,
      recommendedPosition: bestPosition.position,
      recommendedPositionScore: bestPosition.score,
      shouldChange: bestPosition.score > currentScore + 0.1,
      reasoning: this.generatePositionReasoning(player, bestPosition.position, context)
    };
  }
  
  private calculatePositionSuitability(attributes: PlayerAttributes): Record<string, number> {
    return {
      'GK': (attributes.positioning * 0.4 + attributes.tackling * 0.3 + attributes.speed * 0.3) / 100,
      'DF': (attributes.tackling * 0.4 + attributes.positioning * 0.3 + attributes.speed * 0.3) / 100,
      'MF': (attributes.passing * 0.4 + attributes.positioning * 0.3 + attributes.speed * 0.3) / 100,
      'FW': (attributes.shooting * 0.4 + attributes.speed * 0.3 + attributes.dribbling * 0.3) / 100
    };
  }
  
  private generatePositionReasoning(
    player: Player,
    recommendedPosition: string,
    context: MatchContext
  ): string {
    if (recommendedPosition === player.roleId) {
      return "Player is optimally positioned for their strengths";
    }
    
    const attributes = player.attributes;
    
    if (recommendedPosition === 'FW' && attributes.shooting > 80) {
      return "High shooting ability suggests attacking role";
    }
    
    if (recommendedPosition === 'DF' && attributes.tackling > 80) {
      return "Excellent defensive attributes suit backline role";
    }
    
    if (recommendedPosition === 'MF' && attributes.passing > 80) {
      return "Superior passing ability ideal for midfield control";
    }
    
    return "Alternative position may better utilize player's key strengths";
  }
}

// Team chemistry analyzer
class TeamChemistryAnalyzer {
  /**
   * Analyze team chemistry and its impact on performance
   */
  analyzeTeamChemistry(players: Player[]): TeamChemistryAnalysis {
    const individualChemistry = this.calculateIndividualChemistryScores(players);
    const pairChemistry = this.calculatePairwiseChemistry(players);
    const overallChemistry = this.calculateOverallChemistry(individualChemistry);
    
    return {
      overallScore: overallChemistry,
      individualScores: individualChemistry,
      pairwiseScores: pairChemistry,
      chemistryBoosters: this.identifyChemistryBoosters(players, pairChemistry),
      chemistryDisruptors: this.identifyChemistryDisruptors(players, pairChemistry),
      recommendations: this.generateChemistryRecommendations(players, pairChemistry),
      impactOnPerformance: this.calculatePerformanceImpact(overallChemistry)
    };
  }
  
  private calculateIndividualChemistryScores(players: Player[]): Record<string, number> {
    const scores: Record<string, number> = {};
    
    players.forEach(player => {
      let chemistryScore = 0.5; // Base chemistry
      
      // Morale impact
      const moraleImpact = {
        'Excellent': 0.3,
        'Good': 0.1,
        'Okay': 0,
        'Poor': -0.1,
        'Very Poor': -0.2
      };
      chemistryScore += moraleImpact[player.morale];
      
      // Trait impact
      if (player.traits.includes('Leader')) {
        chemistryScore += 0.2;
      }
      if (player.traits.includes('Loyal')) {
        chemistryScore += 0.1;
      }
      if (player.traits.includes('Temperamental')) {
        chemistryScore -= 0.1;
      }
      
      // Age and experience factor
      if (player.age >= 25 && player.age <= 30) {
        chemistryScore += 0.1; // Prime age for leadership
      }
      
      scores[player.id] = Math.min(1, Math.max(0, chemistryScore));
    });
    
    return scores;
  }
  
  private calculatePairwiseChemistry(players: Player[]): Record<string, Record<string, number>> {
    const pairScores: Record<string, Record<string, number>> = {};
    
    players.forEach(player1 => {
      pairScores[player1.id] = {};
      
      players.forEach(player2 => {
        if (player1.id !== player2.id) {
          pairScores[player1.id][player2.id] = this.calculatePlayerPairChemistry(player1, player2);
        }
      });
    });
    
    return pairScores;
  }
  
  private calculatePlayerPairChemistry(player1: Player, player2: Player): number {
    let chemistry = 0.5; // Base chemistry
    
    // Nationality bonus
    if (player1.nationality === player2.nationality) {
      chemistry += 0.2;
    }
    
    // Age compatibility
    const ageDiff = Math.abs(player1.age - player2.age);
    if (ageDiff <= 3) {
      chemistry += 0.1;
    } else if (ageDiff > 10) {
      chemistry -= 0.05;
    }
    
    // Attribute compatibility
    const attributeCompatibility = this.calculateAttributeCompatibility(
      player1.attributes,
      player2.attributes
    );
    chemistry += attributeCompatibility * 0.3;
    
    // Personality clash detection
    if (player1.traits.includes('Temperamental') && player2.traits.includes('Temperamental')) {
      chemistry -= 0.15;
    }
    
    // Leadership synergy
    if (player1.traits.includes('Leader') || player2.traits.includes('Leader')) {
      chemistry += 0.1;
    }
    
    return Math.min(1, Math.max(0, chemistry));
  }
  
  private calculateAttributeCompatibility(attr1: PlayerAttributes, attr2: PlayerAttributes): number {
    // Players with complementary attributes work well together
    const speedDiff = Math.abs(attr1.speed - attr2.speed);
    const passingSum = attr1.passing + attr2.passing;
    const physicalBalance = Math.min(attr1.tackling, attr2.tackling);
    
    let compatibility = 0;
    
    // Similar pace helps coordination
    if (speedDiff < 15) compatibility += 0.3;
    
    // Good passing between players
    if (passingSum > 140) compatibility += 0.4;
    
    // Physical presence
    if (physicalBalance > 60) compatibility += 0.3;
    
    return Math.min(1, compatibility);
  }
  
  private calculateOverallChemistry(individualScores: Record<string, number>): number {
    const scores = Object.values(individualScores);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
  
  private identifyChemistryBoosters(
    players: Player[],
    pairChemistry: Record<string, Record<string, number>>
  ): ChemistryInfluencer[] {
    const boosters: ChemistryInfluencer[] = [];
    
    players.forEach(player => {
      const pairScores = Object.values(pairChemistry[player.id] || {});
      const avgPairScore = pairScores.reduce((sum, score) => sum + score, 0) / pairScores.length;
      
      if (avgPairScore > 0.7) {
        boosters.push({
          playerId: player.id,
          playerName: player.name,
          influence: avgPairScore,
          description: this.getBoosterDescription(player, avgPairScore)
        });
      }
    });
    
    return boosters.sort((a, b) => b.influence - a.influence);
  }
  
  private identifyChemistryDisruptors(
    players: Player[],
    pairChemistry: Record<string, Record<string, number>>
  ): ChemistryInfluencer[] {
    const disruptors: ChemistryInfluencer[] = [];
    
    players.forEach(player => {
      const pairScores = Object.values(pairChemistry[player.id] || {});
      const avgPairScore = pairScores.reduce((sum, score) => sum + score, 0) / pairScores.length;
      
      if (avgPairScore < 0.4) {
        disruptors.push({
          playerId: player.id,
          playerName: player.name,
          influence: avgPairScore,
          description: this.getDisruptorDescription(player, avgPairScore)
        });
      }
    });
    
    return disruptors.sort((a, b) => a.influence - b.influence);
  }
  
  private getBoosterDescription(player: Player, influence: number): string {
    if (player.traits.includes('Leader')) {
      return "Natural leader who elevates team performance";
    }
    if (player.traits.includes('Loyal')) {
      return "Loyal player who builds strong team bonds";
    }
    if (influence > 0.8) {
      return "Exceptional team player with great chemistry";
    }
    return "Positive influence on team dynamics";
  }
  
  private getDisruptorDescription(player: Player, influence: number): string {
    if (player.traits.includes('Temperamental')) {
      return "Temperamental nature can disrupt team harmony";
    }
    if (player.morale === 'Poor' || player.morale === 'Very Poor') {
      return "Poor morale affecting team atmosphere";
    }
    if (influence < 0.3) {
      return "Struggles to connect with teammates";
    }
    return "Limited chemistry with current squad";
  }
  
  private generateChemistryRecommendations(
    players: Player[],
    pairChemistry: Record<string, Record<string, number>>
  ): string[] {
    const recommendations: string[] = [];
    
    // Find best and worst chemistry pairs
    let bestPair = { chemistry: 0, players: ['', ''] };
    let worstPair = { chemistry: 1, players: ['', ''] };
    
    Object.entries(pairChemistry).forEach(([player1Id, pairs]) => {
      Object.entries(pairs).forEach(([player2Id, chemistry]) => {
        if (chemistry > bestPair.chemistry) {
          bestPair = { chemistry, players: [player1Id, player2Id] };
        }
        if (chemistry < worstPair.chemistry) {
          worstPair = { chemistry, players: [player1Id, player2Id] };
        }
      });
    });
    
    if (bestPair.chemistry > 0.8) {
      const player1 = players.find(p => p.id === bestPair.players[0])?.name;
      const player2 = players.find(p => p.id === bestPair.players[1])?.name;
      recommendations.push(`Utilize the excellent chemistry between ${player1} and ${player2}`);
    }
    
    if (worstPair.chemistry < 0.3) {
      const player1 = players.find(p => p.id === worstPair.players[0])?.name;
      const player2 = players.find(p => p.id === worstPair.players[1])?.name;
      recommendations.push(`Address chemistry issues between ${player1} and ${player2}`);
    }
    
    // General recommendations
    const leadersCount = players.filter(p => p.traits.includes('Leader')).length;
    if (leadersCount === 0) {
      recommendations.push("Consider appointing a team captain to improve leadership");
    }
    
    const temperamentalCount = players.filter(p => p.traits.includes('Temperamental')).length;
    if (temperamentalCount > 2) {
      recommendations.push("Multiple temperamental players may cause chemistry issues");
    }
    
    return recommendations;
  }
  
  private calculatePerformanceImpact(overallChemistry: number): PerformanceImpact {
    const multiplier = overallChemistry; // Chemistry directly affects performance
    
    return {
      performanceMultiplier: multiplier,
      description: this.getPerformanceDescription(overallChemistry),
      categories: {
        passing: multiplier * 1.2, // Chemistry most affects passing
        teamwork: multiplier * 1.3, // And teamwork
        morale: multiplier * 1.1,
        consistency: multiplier
      }
    };
  }
  
  private getPerformanceDescription(chemistry: number): string {
    if (chemistry > 0.8) {
      return "Excellent chemistry provides significant performance boost";
    } else if (chemistry > 0.6) {
      return "Good chemistry enhances team performance";
    } else if (chemistry > 0.4) {
      return "Average chemistry - room for improvement";
    } else {
      return "Poor chemistry may hinder team performance";
    }
  }
}

// Main predictive analytics service
export class AIPredictiveAnalyticsService {
  private monteCarloSimulator: MonteCarloSimulator;
  private playerPerformancePredictor: PlayerPerformancePredictor;
  private teamChemistryAnalyzer: TeamChemistryAnalyzer;
  
  constructor() {
    this.monteCarloSimulator = new MonteCarloSimulator();
    this.playerPerformancePredictor = new PlayerPerformancePredictor();
    this.teamChemistryAnalyzer = new TeamChemistryAnalyzer();
  }
  
  /**
   * Predict match outcome using advanced simulation
   */
  async predictMatchOutcome(
    homeFormation: Formation,
    homePlayers: Player[],
    awayFormation: Formation,
    awayPlayers: Player[],
    conditions: MatchConditions = {}
  ): Promise<MatchPrediction> {
    const homeTeamData = this.buildTeamData(homeFormation, homePlayers);
    const awayTeamData = this.buildTeamData(awayFormation, awayPlayers);
    
    return this.monteCarloSimulator.simulateMatch(homeTeamData, awayTeamData, conditions);
  }
  
  /**
   * Predict individual player performance
   */
  async predictPlayerPerformance(
    player: Player,
    matchContext: MatchContext
  ): Promise<PlayerPerformancePrediction> {
    return this.playerPerformancePredictor.predictPlayerPerformance(player, matchContext);
  }
  
  /**
   * Analyze team chemistry and its effects
   */
  async analyzeTeamChemistry(players: Player[]): Promise<TeamChemistryAnalysis> {
    return this.teamChemistryAnalyzer.analyzeTeamChemistry(players);
  }
  
  /**
   * Comprehensive team analysis including performance predictions
   */
  async analyzeTeamPerformance(
    formation: Formation,
    players: Player[],
    matchContext: MatchContext
  ): Promise<TeamPerformanceAnalysis> {
    const teamData = this.buildTeamData(formation, players);
    const chemistryAnalysis = await this.analyzeTeamChemistry(players);
    
    const playerPredictions = await Promise.all(
      players.map(player => this.predictPlayerPerformance(player, matchContext))
    );
    
    return {
      overallStrength: teamData.overallStrength,
      chemistry: chemistryAnalysis,
      playerPredictions: playerPredictions.map((pred, index) => ({
        playerId: players[index].id,
        prediction: pred
      })),
      keyInsights: this.generateTeamInsights(teamData, chemistryAnalysis, playerPredictions),
      recommendations: this.generateTeamRecommendations(teamData, chemistryAnalysis)
    };
  }
  
  private buildTeamData(formation: Formation, players: Player[]): TeamData {
    const assignedPlayers = formation.slots
      .filter(slot => slot.playerId)
      .map(slot => players.find(p => p.id === slot.playerId))
      .filter(Boolean) as Player[];
    
    const avgAttributes = this.calculateTeamAverageAttributes(assignedPlayers);
    
    return {
      formation,
      players: assignedPlayers,
      overallStrength: this.calculateOverallStrength(avgAttributes),
      defensiveStrength: this.calculateDefensiveStrength(assignedPlayers),
      attackingStrength: this.calculateAttackingStrength(assignedPlayers),
      technicalStrength: avgAttributes.passing / 100,
      physicalStrength: avgAttributes.stamina / 100,
      avgAttributes
    };
  }
  
  private calculateTeamAverageAttributes(players: Player[]): PlayerAttributes {
    if (players.length === 0) {
      return { speed: 0, passing: 0, tackling: 0, shooting: 0, dribbling: 0, positioning: 0, stamina: 0 };
    }
    
    const sum = players.reduce((acc, player) => ({
      speed: acc.speed + player.attributes.speed,
      passing: acc.passing + player.attributes.passing,
      tackling: acc.tackling + player.attributes.tackling,
      shooting: acc.shooting + player.attributes.shooting,
      dribbling: acc.dribbling + player.attributes.dribbling,
      positioning: acc.positioning + player.attributes.positioning,
      stamina: acc.stamina + player.attributes.stamina
    }), { speed: 0, passing: 0, tackling: 0, shooting: 0, dribbling: 0, positioning: 0, stamina: 0 });
    
    return {
      speed: sum.speed / players.length,
      passing: sum.passing / players.length,
      tackling: sum.tackling / players.length,
      shooting: sum.shooting / players.length,
      dribbling: sum.dribbling / players.length,
      positioning: sum.positioning / players.length,
      stamina: sum.stamina / players.length
    };
  }
  
  private calculateOverallStrength(attributes: PlayerAttributes): number {
    return (
      attributes.speed * 0.2 +
      attributes.passing * 0.2 +
      attributes.tackling * 0.2 +
      attributes.shooting * 0.15 +
      attributes.dribbling * 0.1 +
      attributes.positioning * 0.15
    ) / 100;
  }
  
  private calculateDefensiveStrength(players: Player[]): number {
    const defenders = players.filter(p => p.roleId.includes('DF') || p.roleId.includes('GK'));
    if (defenders.length === 0) return 0.5;
    
    const avgTackling = defenders.reduce((sum, p) => sum + p.attributes.tackling, 0) / defenders.length;
    const avgPositioning = defenders.reduce((sum, p) => sum + p.attributes.positioning, 0) / defenders.length;
    
    return (avgTackling + avgPositioning) / 200;
  }
  
  private calculateAttackingStrength(players: Player[]): number {
    const attackers = players.filter(p => p.roleId.includes('FW') || p.roleId.includes('MF'));
    if (attackers.length === 0) return 0.5;
    
    const avgShooting = attackers.reduce((sum, p) => sum + p.attributes.shooting, 0) / attackers.length;
    const avgDribbling = attackers.reduce((sum, p) => sum + p.attributes.dribbling, 0) / attackers.length;
    
    return (avgShooting + avgDribbling) / 200;
  }
  
  private generateTeamInsights(
    teamData: TeamData,
    chemistry: TeamChemistryAnalysis,
    playerPredictions: PlayerPerformancePrediction[]
  ): string[] {
    const insights: string[] = [];
    
    if (teamData.overallStrength > 0.8) {
      insights.push("Team has exceptional overall quality");
    }
    
    if (chemistry.overallScore > 0.8) {
      insights.push("Excellent team chemistry will boost performance");
    } else if (chemistry.overallScore < 0.5) {
      insights.push("Poor chemistry may limit team potential");
    }
    
    const highPerformers = playerPredictions.filter(p => p.expectedRating > 8).length;
    if (highPerformers > 5) {
      insights.push("Multiple players expected to deliver excellent performances");
    }
    
    const injuryRisks = playerPredictions.filter(p => p.injuryRisk.level === 'high').length;
    if (injuryRisks > 2) {
      insights.push("Multiple players at high injury risk");
    }
    
    return insights;
  }
  
  private generateTeamRecommendations(
    teamData: TeamData,
    chemistry: TeamChemistryAnalysis
  ): string[] {
    const recommendations: string[] = [];
    
    if (teamData.defensiveStrength < 0.6) {
      recommendations.push("Consider strengthening defensive stability");
    }
    
    if (teamData.attackingStrength < 0.6) {
      recommendations.push("Focus on improving attacking effectiveness");
    }
    
    if (chemistry.overallScore < 0.6) {
      recommendations.push("Work on team building to improve chemistry");
    }
    
    if (chemistry.chemistryDisruptors.length > 0) {
      recommendations.push("Address chemistry issues with disruptive players");
    }
    
    return recommendations;
  }
}

// Type definitions
export interface TeamData {
  formation: Formation;
  players: Player[];
  overallStrength: number;
  defensiveStrength: number;
  attackingStrength: number;
  technicalStrength: number;
  physicalStrength: number;
  avgAttributes: PlayerAttributes;
}

export interface MatchConditions {
  weather?: WeatherCondition;
  isHomeAdvantage?: boolean;
  matchImportance?: 'low' | 'medium' | 'high';
}

export type WeatherCondition = 'clear' | 'rain' | 'wind' | 'cold' | 'hot';

export interface MatchContext {
  isHome: boolean;
  oppositionStrength: number;
  oppositionWeakness?: 'pace' | 'aerial' | 'width' | 'pressing';
  matchImportance: 'low' | 'medium' | 'high';
}

export interface SimulationResult {
  homeGoals: number;
  awayGoals: number;
  homeStrength: number;
  awayStrength: number;
}

export interface MatchPrediction {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  expectedGoalsHome: number;
  expectedGoalsAway: number;
  confidence: number;
  goalDistribution: GoalDistribution;
  keyFactors: string[];
}

export interface GoalDistribution {
  mostLikelyScores: { score: string; probability: number }[];
  over25Goals: number;
  bothTeamsToScore: number;
}

export interface PlayerPerformancePrediction {
  expectedRating: number;
  confidence: number;
  keyStrengths: string[];
  potentialWeaknesses: string[];
  injuryRisk: InjuryRisk;
  optimalPosition: PositionRecommendation;
}

export interface InjuryRisk {
  level: 'low' | 'medium' | 'high';
  score: number;
  factors: string[];
}

export interface PositionRecommendation {
  currentPositionScore: number;
  recommendedPosition: string;
  recommendedPositionScore: number;
  shouldChange: boolean;
  reasoning: string;
}

export interface TeamChemistryAnalysis {
  overallScore: number;
  individualScores: Record<string, number>;
  pairwiseScores: Record<string, Record<string, number>>;
  chemistryBoosters: ChemistryInfluencer[];
  chemistryDisruptors: ChemistryInfluencer[];
  recommendations: string[];
  impactOnPerformance: PerformanceImpact;
}

export interface ChemistryInfluencer {
  playerId: string;
  playerName: string;
  influence: number;
  description: string;
}

export interface PerformanceImpact {
  performanceMultiplier: number;
  description: string;
  categories: {
    passing: number;
    teamwork: number;
    morale: number;
    consistency: number;
  };
}

export interface TeamPerformanceAnalysis {
  overallStrength: number;
  chemistry: TeamChemistryAnalysis;
  playerPredictions: { playerId: string; prediction: PlayerPerformancePrediction }[];
  keyInsights: string[];
  recommendations: string[];
}

// Export singleton instance
export const aiPredictiveAnalytics = new AIPredictiveAnalyticsService();