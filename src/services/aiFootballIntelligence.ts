/**
 * AI Football Intelligence Service
 * Advanced machine learning algorithms for tactical analysis and player positioning
 */

import { Player, Formation, FormationSlot, PlayerAttributes, PositionRole, Team } from '../types';

// Custom neural network implementation for football intelligence
class NeuralNetwork {
  private weights: number[][];
  private biases: number[];
  private learningRate: number;
  
  constructor(inputSize: number, hiddenSize: number, outputSize: number, learningRate = 0.01) {
    this.learningRate = learningRate;
    
    // Initialize weights randomly
    this.weights = [
      this.randomMatrix(hiddenSize, inputSize), // input to hidden
      this.randomMatrix(outputSize, hiddenSize) // hidden to output
    ];
    
    this.biases = [
      this.randomArray(hiddenSize),
      this.randomArray(outputSize)
    ];
  }
  
  private randomMatrix(rows: number, cols: number): number[][] {
    return Array(rows).fill(0).map(() => 
      Array(cols).fill(0).map(() => (Math.random() - 0.5) * 2)
    );
  }
  
  private randomArray(size: number): number[] {
    return Array(size).fill(0).map(() => (Math.random() - 0.5) * 2);
  }
  
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
  
  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }
  
  predict(input: number[]): number[] {
    let output = input;
    
    // Forward pass through each layer
    for (let layer = 0; layer < this.weights.length; layer++) {
      const newOutput: number[] = [];
      
      for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
        const sum = this.dotProduct(this.weights[layer][neuron], output) + this.biases[layer][neuron];
        newOutput.push(this.sigmoid(sum));
      }
      
      output = newOutput;
    }
    
    return output;
  }
  
  train(inputs: number[][], targets: number[][], epochs: number): void {
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < inputs.length; i++) {
        this.trainSample(inputs[i], targets[i]);
      }
    }
  }
  
  private trainSample(input: number[], target: number[]): void {
    // Simple gradient descent (simplified for this implementation)
    const predicted = this.predict(input);
    const error = target.map((t, i) => t - predicted[i]);
    
    // Update weights based on error (simplified backpropagation)
    for (let layer = this.weights.length - 1; layer >= 0; layer--) {
      for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
        for (let weight = 0; weight < this.weights[layer][neuron].length; weight++) {
          this.weights[layer][neuron][weight] += this.learningRate * error[neuron] * 0.1;
        }
        this.biases[layer][neuron] += this.learningRate * error[neuron] * 0.1;
      }
    }
  }
}

// Player chemistry calculation using advanced algorithms
class ChemistryEngine {
  /**
   * Calculate compatibility score between two players
   * Uses multiple factors including playing style, attributes, and position synergy
   */
  static calculateCompatibility(player1: Player, player2: Player): number {
    const attributeSynergy = this.calculateAttributeSynergy(player1.attributes, player2.attributes);
    const positionSynergy = this.calculatePositionSynergy(player1.roleId, player2.roleId);
    const ageCompatibility = this.calculateAgeCompatibility(player1.age, player2.age);
    const nationalitySynergy = this.calculateNationalitySynergy(player1.nationality, player2.nationality);
    
    // Weighted combination
    return (attributeSynergy * 0.4 + positionSynergy * 0.3 + ageCompatibility * 0.2 + nationalitySynergy * 0.1);
  }
  
  private static calculateAttributeSynergy(attr1: PlayerAttributes, attr2: PlayerAttributes): number {
    // Calculate how well attributes complement each other
    const balanceScore = Math.abs(attr1.speed - attr2.speed) < 20 ? 0.8 : 0.5;
    const passingCompatibility = (attr1.passing + attr2.passing) / 200;
    const physicalBalance = Math.min(attr1.tackling, attr2.tackling) / 100;
    
    return (balanceScore + passingCompatibility + physicalBalance) / 3;
  }
  
  private static calculatePositionSynergy(role1: string, role2: string): number {
    const synergyMap: Record<string, Record<string, number>> = {
      'GK': { 'DF': 0.9, 'MF': 0.6, 'FW': 0.3 },
      'DF': { 'GK': 0.9, 'DF': 0.8, 'MF': 0.7, 'FW': 0.5 },
      'MF': { 'GK': 0.6, 'DF': 0.7, 'MF': 0.9, 'FW': 0.8 },
      'FW': { 'GK': 0.3, 'DF': 0.5, 'MF': 0.8, 'FW': 0.7 }
    };
    
    return synergyMap[role1]?.[role2] || 0.5;
  }
  
  private static calculateAgeCompatibility(age1: number, age2: number): number {
    const ageDiff = Math.abs(age1 - age2);
    return Math.max(0, 1 - ageDiff / 20);
  }
  
  private static calculateNationalitySynergy(nat1: string, nat2: string): number {
    return nat1 === nat2 ? 1.0 : 0.7;
  }
}

// Formation strength analysis using advanced algorithms
class FormationAnalyzer {
  private neuralNetwork: NeuralNetwork;
  
  constructor() {
    // Initialize neural network for formation analysis (8 inputs, 10 hidden, 3 outputs)
    this.neuralNetwork = new NeuralNetwork(8, 10, 3);
    this.trainModel();
  }
  
  /**
   * Analyze formation strength and provide detailed insights
   */
  analyzeFormation(formation: Formation, players: Player[]): FormationAnalysis {
    const assignedPlayers = this.getAssignedPlayers(formation, players);
    
    const defensiveStrength = this.calculateDefensiveStrength(assignedPlayers);
    const attackingStrength = this.calculateAttackingStrength(assignedPlayers);
    const midfieldfControl = this.calculateMidfieldControl(assignedPlayers);
    const overallChemistry = this.calculateOverallChemistry(assignedPlayers);
    const balanceScore = this.calculateBalance(assignedPlayers);
    
    const weaknesses = this.identifyWeaknesses(assignedPlayers, formation);
    const strengths = this.identifyStrengths(assignedPlayers, formation);
    const recommendations = this.generateRecommendations(assignedPlayers, formation);
    
    return {
      defensiveStrength,
      attackingStrength,
      midfieldfControl,
      overallChemistry,
      balanceScore,
      overallRating: (defensiveStrength + attackingStrength + midfieldfControl + overallChemistry + balanceScore) / 5,
      weaknesses,
      strengths,
      recommendations,
      playerCompatibilityMatrix: this.generateCompatibilityMatrix(assignedPlayers)
    };
  }
  
  private getAssignedPlayers(formation: Formation, players: Player[]): Player[] {
    return formation.slots
      .filter(slot => slot.playerId)
      .map(slot => players.find(p => p.id === slot.playerId))
      .filter(Boolean) as Player[];
  }
  
  private calculateDefensiveStrength(players: Player[]): number {
    const defenders = players.filter(p => ['DF', 'GK'].includes(this.getPositionRole(p.roleId)));
    const avgTackling = defenders.reduce((sum, p) => sum + p.attributes.tackling, 0) / defenders.length || 0;
    const avgPositioning = defenders.reduce((sum, p) => sum + p.attributes.positioning, 0) / defenders.length || 0;
    
    return (avgTackling + avgPositioning) / 200;
  }
  
  private calculateAttackingStrength(players: Player[]): number {
    const attackers = players.filter(p => ['FW', 'MF'].includes(this.getPositionRole(p.roleId)));
    const avgShooting = attackers.reduce((sum, p) => sum + p.attributes.shooting, 0) / attackers.length || 0;
    const avgDribbling = attackers.reduce((sum, p) => sum + p.attributes.dribbling, 0) / attackers.length || 0;
    
    return (avgShooting + avgDribbling) / 200;
  }
  
  private calculateMidfieldControl(players: Player[]): number {
    const midfielders = players.filter(p => this.getPositionRole(p.roleId) === 'MF');
    const avgPassing = midfielders.reduce((sum, p) => sum + p.attributes.passing, 0) / midfielders.length || 0;
    const avgPositioning = midfielders.reduce((sum, p) => sum + p.attributes.positioning, 0) / midfielders.length || 0;
    
    return (avgPassing + avgPositioning) / 200;
  }
  
  private calculateOverallChemistry(players: Player[]): number {
    if (players.length < 2) return 1;
    
    let totalCompatibility = 0;
    let pairs = 0;
    
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        totalCompatibility += ChemistryEngine.calculateCompatibility(players[i], players[j]);
        pairs++;
      }
    }
    
    return pairs > 0 ? totalCompatibility / pairs : 1;
  }
  
  private calculateBalance(players: Player[]): number {
    const roleDistribution = this.getRoleDistribution(players);
    const idealDistribution = { GK: 1, DF: 4, MF: 4, FW: 2 }; // Ideal 4-4-2 distribution
    
    let balanceScore = 0;
    Object.entries(idealDistribution).forEach(([role, ideal]) => {
      const actual = roleDistribution[role as PositionRole] || 0;
      const diff = Math.abs(ideal - actual);
      balanceScore += Math.max(0, 1 - diff / ideal);
    });
    
    return balanceScore / Object.keys(idealDistribution).length;
  }
  
  private getRoleDistribution(players: Player[]): Record<PositionRole, number> {
    const distribution: Record<PositionRole, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };
    
    players.forEach(player => {
      const role = this.getPositionRole(player.roleId);
      distribution[role]++;
    });
    
    return distribution;
  }
  
  private getPositionRole(roleId: string): PositionRole {
    // Map roleId to position role - this would need to be customized based on your role system
    if (roleId.includes('GK')) return 'GK';
    if (roleId.includes('DF') || roleId.includes('CB') || roleId.includes('LB') || roleId.includes('RB')) return 'DF';
    if (roleId.includes('MF') || roleId.includes('CM') || roleId.includes('CDM') || roleId.includes('CAM')) return 'MF';
    return 'FW';
  }
  
  private identifyWeaknesses(players: Player[], formation: Formation): string[] {
    const weaknesses: string[] = [];
    
    const avgAttributes = this.calculateAverageAttributes(players);
    
    if (avgAttributes.tackling < 60) weaknesses.push("Weak defensive stability");
    if (avgAttributes.passing < 65) weaknesses.push("Poor ball circulation");
    if (avgAttributes.shooting < 55) weaknesses.push("Limited attacking threat");
    if (avgAttributes.speed < 70) weaknesses.push("Lacks pace in transitions");
    if (avgAttributes.stamina < 75) weaknesses.push("May struggle with fitness late in game");
    
    const roleDistribution = this.getRoleDistribution(players);
    if (roleDistribution.MF < 3) weaknesses.push("Midfield could be overrun");
    if (roleDistribution.DF < 3) weaknesses.push("Vulnerable to attacking pressure");
    
    return weaknesses;
  }
  
  private identifyStrengths(players: Player[], formation: Formation): string[] {
    const strengths: string[] = [];
    
    const avgAttributes = this.calculateAverageAttributes(players);
    
    if (avgAttributes.tackling > 80) strengths.push("Solid defensive foundation");
    if (avgAttributes.passing > 85) strengths.push("Excellent ball movement");
    if (avgAttributes.shooting > 75) strengths.push("Strong attacking potential");
    if (avgAttributes.speed > 85) strengths.push("Explosive counter-attacking pace");
    if (avgAttributes.stamina > 90) strengths.push("Superior fitness and endurance");
    
    const chemistry = this.calculateOverallChemistry(players);
    if (chemistry > 0.8) strengths.push("Excellent team chemistry");
    
    return strengths;
  }
  
  private generateRecommendations(players: Player[], formation: Formation): string[] {
    const recommendations: string[] = [];
    
    const avgAttributes = this.calculateAverageAttributes(players);
    const roleDistribution = this.getRoleDistribution(players);
    
    if (avgAttributes.tackling < 70) {
      recommendations.push("Consider more defensive-minded players");
    }
    
    if (avgAttributes.passing < 70) {
      recommendations.push("Focus on improving passing accuracy in training");
    }
    
    if (roleDistribution.MF < 3) {
      recommendations.push("Add more midfield players for better control");
    }
    
    if (avgAttributes.stamina < 80) {
      recommendations.push("Implement intensive fitness training regime");
    }
    
    return recommendations;
  }
  
  private calculateAverageAttributes(players: Player[]): PlayerAttributes {
    if (players.length === 0) {
      return {
        speed: 0, passing: 0, tackling: 0, shooting: 0,
        dribbling: 0, positioning: 0, stamina: 0
      };
    }
    
    const total = players.reduce((sum, player) => ({
      speed: sum.speed + player.attributes.speed,
      passing: sum.passing + player.attributes.passing,
      tackling: sum.tackling + player.attributes.tackling,
      shooting: sum.shooting + player.attributes.shooting,
      dribbling: sum.dribbling + player.attributes.dribbling,
      positioning: sum.positioning + player.attributes.positioning,
      stamina: sum.stamina + player.attributes.stamina
    }), {
      speed: 0, passing: 0, tackling: 0, shooting: 0,
      dribbling: 0, positioning: 0, stamina: 0
    });
    
    return {
      speed: total.speed / players.length,
      passing: total.passing / players.length,
      tackling: total.tackling / players.length,
      shooting: total.shooting / players.length,
      dribbling: total.dribbling / players.length,
      positioning: total.positioning / players.length,
      stamina: total.stamina / players.length
    };
  }
  
  private generateCompatibilityMatrix(players: Player[]): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};
    
    players.forEach(player1 => {
      matrix[player1.id] = {};
      players.forEach(player2 => {
        if (player1.id !== player2.id) {
          matrix[player1.id][player2.id] = ChemistryEngine.calculateCompatibility(player1, player2);
        }
      });
    });
    
    return matrix;
  }
  
  private trainModel(): void {
    // Training data for formation effectiveness
    // This would be expanded with real match data
    const trainingInputs: number[][] = [
      [0.8, 0.7, 0.6, 0.9, 0.75, 4, 4, 2], // [def, att, mid, chem, balance, defenders, midfielders, forwards]
      [0.6, 0.9, 0.8, 0.7, 0.65, 3, 4, 3],
      [0.9, 0.5, 0.7, 0.8, 0.85, 5, 3, 2],
    ];
    
    const trainingTargets: number[][] = [
      [0.8, 0.2, 0.6], // [defensive_effectiveness, attacking_effectiveness, overall_rating]
      [0.4, 0.9, 0.7],
      [0.9, 0.3, 0.7],
    ];
    
    this.neuralNetwork.train(trainingInputs, trainingTargets, 100);
  }
}

// Smart auto-assignment engine
class AutoAssignmentEngine {
  private formationAnalyzer: FormationAnalyzer;
  
  constructor() {
    this.formationAnalyzer = new FormationAnalyzer();
  }
  
  /**
   * Automatically assign players to formation slots using AI optimization
   */
  optimizePlayerAssignment(formation: Formation, availablePlayers: Player[]): OptimizedAssignment {
    const assignments = this.generateOptimalAssignments(formation, availablePlayers);
    const analysis = this.formationAnalyzer.analyzeFormation(formation, availablePlayers);
    
    return {
      assignments,
      analysis,
      improvementScore: this.calculateImprovementScore(assignments, availablePlayers),
      reasoning: this.generateAssignmentReasoning(assignments, availablePlayers)
    };
  }
  
  private generateOptimalAssignments(formation: Formation, players: Player[]): SlotAssignment[] {
    const assignments: SlotAssignment[] = [];
    const usedPlayers = new Set<string>();
    
    // Sort slots by importance (GK first, then by position preference)
    const sortedSlots = [...formation.slots].sort((a, b) => {
      const roleOrder = { 'GK': 0, 'DF': 1, 'MF': 2, 'FW': 3 };
      return roleOrder[a.role] - roleOrder[b.role];
    });
    
    sortedSlots.forEach(slot => {
      const bestPlayer = this.findBestPlayerForSlot(slot, players, usedPlayers);
      if (bestPlayer) {
        assignments.push({
          slotId: slot.id,
          playerId: bestPlayer.id,
          compatibilityScore: this.calculateSlotCompatibility(slot, bestPlayer),
          confidenceLevel: this.calculateConfidenceLevel(slot, bestPlayer, players)
        });
        usedPlayers.add(bestPlayer.id);
      }
    });
    
    return assignments;
  }
  
  private findBestPlayerForSlot(slot: FormationSlot, players: Player[], usedPlayers: Set<string>): Player | null {
    const candidates = players.filter(p => !usedPlayers.has(p.id));
    
    if (candidates.length === 0) return null;
    
    // Score each candidate for this slot
    const scoredCandidates = candidates.map(player => ({
      player,
      score: this.calculatePlayerSlotScore(player, slot)
    }));
    
    // Sort by score and return the best
    scoredCandidates.sort((a, b) => b.score - a.score);
    return scoredCandidates[0].player;
  }
  
  private calculatePlayerSlotScore(player: Player, slot: FormationSlot): number {
    const roleCompatibility = this.calculateRoleCompatibility(player, slot.role);
    const attributeFit = this.calculateAttributeFit(player.attributes, slot.role);
    const positionFit = this.calculatePositionFit(player, slot);
    
    return roleCompatibility * 0.4 + attributeFit * 0.4 + positionFit * 0.2;
  }
  
  private calculateRoleCompatibility(player: Player, slotRole: PositionRole): number {
    const playerRole = this.getPositionRole(player.roleId);
    return playerRole === slotRole ? 1.0 : 0.3;
  }
  
  private calculateAttributeFit(attributes: PlayerAttributes, role: PositionRole): number {
    const roleWeights = {
      'GK': { tackling: 0.1, positioning: 0.4, speed: 0.2, passing: 0.1, shooting: 0.1, dribbling: 0.1 },
      'DF': { tackling: 0.4, positioning: 0.3, speed: 0.2, passing: 0.1, shooting: 0.0, dribbling: 0.0 },
      'MF': { tackling: 0.2, positioning: 0.2, speed: 0.2, passing: 0.3, shooting: 0.1, dribbling: 0.0 },
      'FW': { tackling: 0.0, positioning: 0.2, speed: 0.3, passing: 0.1, shooting: 0.3, dribbling: 0.1 }
    };
    
    const weights = roleWeights[role];
    return Object.entries(weights).reduce((sum, [attr, weight]) => {
      return sum + (attributes[attr as keyof PlayerAttributes] / 100) * weight;
    }, 0);
  }
  
  private calculatePositionFit(player: Player, slot: FormationSlot): number {
    const distance = Math.sqrt(
      Math.pow(player.position.x - slot.defaultPosition.x, 2) +
      Math.pow(player.position.y - slot.defaultPosition.y, 2)
    );
    
    // Normalize distance (assuming field coordinates are 0-100)
    return Math.max(0, 1 - distance / 100);
  }
  
  private calculateSlotCompatibility(slot: FormationSlot, player: Player): number {
    return this.calculatePlayerSlotScore(player, slot);
  }
  
  private calculateConfidenceLevel(slot: FormationSlot, player: Player, allPlayers: Player[]): number {
    const playerScore = this.calculatePlayerSlotScore(player, slot);
    const otherScores = allPlayers
      .filter(p => p.id !== player.id)
      .map(p => this.calculatePlayerSlotScore(p, slot));
    
    if (otherScores.length === 0) return 1.0;
    
    const maxOtherScore = Math.max(...otherScores);
    return playerScore > maxOtherScore ? 0.9 : 0.6;
  }
  
  private calculateImprovementScore(assignments: SlotAssignment[], players: Player[]): number {
    const avgCompatibility = assignments.reduce((sum, a) => sum + a.compatibilityScore, 0) / assignments.length;
    return avgCompatibility;
  }
  
  private generateAssignmentReasoning(assignments: SlotAssignment[], players: Player[]): string[] {
    const reasoning: string[] = [];
    
    assignments.forEach(assignment => {
      const player = players.find(p => p.id === assignment.playerId);
      if (player) {
        if (assignment.compatibilityScore > 0.8) {
          reasoning.push(`${player.name} is an excellent fit for this position`);
        } else if (assignment.compatibilityScore > 0.6) {
          reasoning.push(`${player.name} is a good fit with minor adjustments needed`);
        } else {
          reasoning.push(`${player.name} may require tactical adaptation for this role`);
        }
      }
    });
    
    return reasoning;
  }
  
  private getPositionRole(roleId: string): PositionRole {
    if (roleId.includes('GK')) return 'GK';
    if (roleId.includes('DF') || roleId.includes('CB') || roleId.includes('LB') || roleId.includes('RB')) return 'DF';
    if (roleId.includes('MF') || roleId.includes('CM') || roleId.includes('CDM') || roleId.includes('CAM')) return 'MF';
    return 'FW';
  }
}

// Tactical pattern recognition engine
class TacticalPatternEngine {
  /**
   * Analyze tactical patterns and suggest improvements
   */
  analyzeTacticalPatterns(formation: Formation, players: Player[], oppositionData?: any): TacticalAnalysis {
    const patterns = this.identifyTacticalPatterns(formation, players);
    const vulnerabilities = this.identifyVulnerabilities(formation, players);
    const opportunities = this.identifyOpportunities(formation, players);
    const counterStrategies = this.generateCounterStrategies(formation, players, oppositionData);
    
    return {
      patterns,
      vulnerabilities,
      opportunities,
      counterStrategies,
      recommendations: this.generateTacticalRecommendations(patterns, vulnerabilities, opportunities)
    };
  }
  
  private identifyTacticalPatterns(formation: Formation, players: Player[]): TacticalPattern[] {
    const patterns: TacticalPattern[] = [];
    
    // Analyze formation shape
    const shape = this.analyzeFormationShape(formation);
    patterns.push({
      type: 'formation_shape',
      description: `${shape.defensive}${shape.midfield}${shape.attacking} formation structure`,
      strength: this.calculatePatternStrength(shape, players),
      implications: this.getShapeImplications(shape)
    });
    
    // Analyze playing style tendencies
    const playingStyle = this.analyzePlayingStyle(players);
    patterns.push({
      type: 'playing_style',
      description: playingStyle.dominant,
      strength: playingStyle.consistency,
      implications: this.getPlayingStyleImplications(playingStyle)
    });
    
    return patterns;
  }
  
  private analyzeFormationShape(formation: Formation): FormationShape {
    const roleCount = formation.slots.reduce((count, slot) => {
      count[slot.role] = (count[slot.role] || 0) + 1;
      return count;
    }, {} as Record<PositionRole, number>);
    
    return {
      defensive: roleCount.DF || 0,
      midfield: roleCount.MF || 0,
      attacking: roleCount.FW || 0
    };
  }
  
  private analyzePlayingStyle(players: Player[]): PlayingStyleAnalysis {
    const avgAttributes = players.reduce((sum, player) => ({
      speed: sum.speed + player.attributes.speed,
      passing: sum.passing + player.attributes.passing,
      tackling: sum.tackling + player.attributes.tackling,
      shooting: sum.shooting + player.attributes.shooting,
      dribbling: sum.dribbling + player.attributes.dribbling
    }), { speed: 0, passing: 0, tackling: 0, shooting: 0, dribbling: 0 });
    
    Object.keys(avgAttributes).forEach(key => {
      avgAttributes[key as keyof typeof avgAttributes] /= players.length;
    });
    
    const styles = [
      { name: 'Counter-attacking', score: (avgAttributes.speed + avgAttributes.shooting) / 2 },
      { name: 'Possession-based', score: (avgAttributes.passing + avgAttributes.dribbling) / 2 },
      { name: 'Defensive', score: avgAttributes.tackling },
      { name: 'High-tempo', score: avgAttributes.speed }
    ];
    
    styles.sort((a, b) => b.score - a.score);
    
    return {
      dominant: styles[0].name,
      secondary: styles[1].name,
      consistency: styles[0].score / 100
    };
  }
  
  private calculatePatternStrength(shape: FormationShape, players: Player[]): number {
    // Calculate how well players fit the formation shape
    const balanceScore = this.calculateShapeBalance(shape);
    const playerFitScore = this.calculatePlayerFormationFit(players, shape);
    
    return (balanceScore + playerFitScore) / 2;
  }
  
  private calculateShapeBalance(shape: FormationShape): number {
    const total = shape.defensive + shape.midfield + shape.attacking;
    if (total === 0) return 0;
    
    // Ideal balance is roughly equal distribution with slight midfield emphasis
    const ideal = { defensive: 0.35, midfield: 0.4, attacking: 0.25 };
    const actual = {
      defensive: shape.defensive / total,
      midfield: shape.midfield / total,
      attacking: shape.attacking / total
    };
    
    const balance = 1 - (
      Math.abs(ideal.defensive - actual.defensive) +
      Math.abs(ideal.midfield - actual.midfield) +
      Math.abs(ideal.attacking - actual.attacking)
    ) / 3;
    
    return Math.max(0, balance);
  }
  
  private calculatePlayerFormationFit(players: Player[], shape: FormationShape): number {
    // This would analyze how well players' attributes match the formation requirements
    const avgFitness = players.reduce((sum, player) => sum + player.attributes.stamina, 0) / players.length;
    return avgFitness / 100;
  }
  
  private getShapeImplications(shape: FormationShape): string[] {
    const implications: string[] = [];
    
    if (shape.defensive > 4) {
      implications.push("Strong defensive stability but may lack attacking width");
    }
    
    if (shape.midfield > 4) {
      implications.push("Excellent midfield control and ball retention");
    }
    
    if (shape.attacking > 2) {
      implications.push("High attacking threat but potentially vulnerable to counters");
    }
    
    return implications;
  }
  
  private getPlayingStyleImplications(style: PlayingStyleAnalysis): string[] {
    const implications: string[] = [];
    
    switch (style.dominant) {
      case 'Counter-attacking':
        implications.push("Effective against possession-heavy teams");
        implications.push("May struggle against defensive opponents");
        break;
      case 'Possession-based':
        implications.push("Controls game tempo effectively");
        implications.push("Vulnerable to high-pressing tactics");
        break;
      case 'Defensive':
        implications.push("Difficult to break down");
        implications.push("Limited scoring opportunities");
        break;
      case 'High-tempo':
        implications.push("Overwhelms slower opponents");
        implications.push("Fitness becomes crucial factor");
        break;
    }
    
    return implications;
  }
  
  private identifyVulnerabilities(formation: Formation, players: Player[]): TacticalVulnerability[] {
    const vulnerabilities: TacticalVulnerability[] = [];
    
    // Analyze spacing vulnerabilities
    const spacing = this.analyzePlayerSpacing(formation);
    if (spacing.hasGaps) {
      vulnerabilities.push({
        type: 'spacing',
        severity: 'medium',
        description: 'Gaps in formation could be exploited',
        exploitMethod: 'Through balls and quick passing combinations'
      });
    }
    
    // Analyze attribute weaknesses
    const weaknesses = this.findAttributeWeaknesses(players);
    weaknesses.forEach(weakness => {
      vulnerabilities.push({
        type: 'attribute',
        severity: weakness.severity,
        description: weakness.description,
        exploitMethod: weakness.exploitMethod
      });
    });
    
    return vulnerabilities;
  }
  
  private analyzePlayerSpacing(formation: Formation): SpacingAnalysis {
    // Simplified spacing analysis
    const positions = formation.slots.map(slot => slot.defaultPosition);
    const avgSpacing = this.calculateAverageSpacing(positions);
    
    return {
      hasGaps: avgSpacing > 30, // Threshold for concerning gaps
      avgSpacing,
      criticalAreas: this.identifyCriticalSpacingAreas(positions)
    };
  }
  
  private calculateAverageSpacing(positions: { x: number; y: number }[]): number {
    if (positions.length < 2) return 0;
    
    let totalDistance = 0;
    let pairs = 0;
    
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const distance = Math.sqrt(
          Math.pow(positions[i].x - positions[j].x, 2) +
          Math.pow(positions[i].y - positions[j].y, 2)
        );
        totalDistance += distance;
        pairs++;
      }
    }
    
    return pairs > 0 ? totalDistance / pairs : 0;
  }
  
  private identifyCriticalSpacingAreas(positions: { x: number; y: number }[]): string[] {
    // This would identify areas of the field with poor coverage
    return ["Central midfield", "Wide areas"]; // Simplified
  }
  
  private findAttributeWeaknesses(players: Player[]): AttributeWeakness[] {
    const weaknesses: AttributeWeakness[] = [];
    const avgAttributes = this.calculateTeamAverageAttributes(players);
    
    if (avgAttributes.speed < 60) {
      weaknesses.push({
        severity: 'high',
        description: 'Team lacks pace across the field',
        exploitMethod: 'Fast counter-attacks and wing play'
      });
    }
    
    if (avgAttributes.tackling < 65) {
      weaknesses.push({
        severity: 'medium',
        description: 'Defensive frailty in 1v1 situations',
        exploitMethod: 'Direct running and dribbling'
      });
    }
    
    return weaknesses;
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
  
  private identifyOpportunities(formation: Formation, players: Player[]): TacticalOpportunity[] {
    const opportunities: TacticalOpportunity[] = [];
    
    const strengths = this.identifyTeamStrengths(players);
    strengths.forEach(strength => {
      opportunities.push({
        type: 'exploit_strength',
        potential: strength.potential,
        description: strength.description,
        implementation: strength.implementation
      });
    });
    
    return opportunities;
  }
  
  private identifyTeamStrengths(players: Player[]): TeamStrength[] {
    const strengths: TeamStrength[] = [];
    const avgAttributes = this.calculateTeamAverageAttributes(players);
    
    if (avgAttributes.speed > 80) {
      strengths.push({
        potential: 'high',
        description: 'Exceptional pace throughout the team',
        implementation: 'Focus on counter-attacking and transition play'
      });
    }
    
    if (avgAttributes.passing > 85) {
      strengths.push({
        potential: 'high',
        description: 'Superior passing ability',
        implementation: 'Implement possession-based tactics with short passing'
      });
    }
    
    return strengths;
  }
  
  private generateCounterStrategies(formation: Formation, players: Player[], oppositionData?: any): CounterStrategy[] {
    // This would analyze opposition and suggest counter-strategies
    return [
      {
        against: 'High pressing',
        strategy: 'Quick long balls to bypass midfield',
        confidence: 0.75
      },
      {
        against: 'Defensive block',
        strategy: 'Width and crossing from flanks',
        confidence: 0.65
      }
    ];
  }
  
  private generateTacticalRecommendations(
    patterns: TacticalPattern[],
    vulnerabilities: TacticalVulnerability[],
    opportunities: TacticalOpportunity[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Address high-severity vulnerabilities first
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'high');
    criticalVulns.forEach(vuln => {
      recommendations.push(`Critical: Address ${vuln.description.toLowerCase()}`);
    });
    
    // Leverage high-potential opportunities
    const strongOpportunities = opportunities.filter(o => o.potential === 'high');
    strongOpportunities.forEach(opp => {
      recommendations.push(`Opportunity: ${opp.implementation}`);
    });
    
    return recommendations;
  }
}

// Type definitions for AI Football Intelligence
export interface FormationAnalysis {
  defensiveStrength: number;
  attackingStrength: number;
  midfieldfControl: number;
  overallChemistry: number;
  balanceScore: number;
  overallRating: number;
  weaknesses: string[];
  strengths: string[];
  recommendations: string[];
  playerCompatibilityMatrix: Record<string, Record<string, number>>;
}

export interface OptimizedAssignment {
  assignments: SlotAssignment[];
  analysis: FormationAnalysis;
  improvementScore: number;
  reasoning: string[];
}

export interface SlotAssignment {
  slotId: string;
  playerId: string;
  compatibilityScore: number;
  confidenceLevel: number;
}

export interface TacticalAnalysis {
  patterns: TacticalPattern[];
  vulnerabilities: TacticalVulnerability[];
  opportunities: TacticalOpportunity[];
  counterStrategies: CounterStrategy[];
  recommendations: string[];
}

export interface TacticalPattern {
  type: string;
  description: string;
  strength: number;
  implications: string[];
}

export interface TacticalVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  exploitMethod: string;
}

export interface TacticalOpportunity {
  type: string;
  potential: 'low' | 'medium' | 'high';
  description: string;
  implementation: string;
}

export interface CounterStrategy {
  against: string;
  strategy: string;
  confidence: number;
}

interface FormationShape {
  defensive: number;
  midfield: number;
  attacking: number;
}

interface PlayingStyleAnalysis {
  dominant: string;
  secondary: string;
  consistency: number;
}

interface SpacingAnalysis {
  hasGaps: boolean;
  avgSpacing: number;
  criticalAreas: string[];
}

interface AttributeWeakness {
  severity: 'low' | 'medium' | 'high';
  description: string;
  exploitMethod: string;
}

interface TeamStrength {
  potential: 'low' | 'medium' | 'high';
  description: string;
  implementation: string;
}

// Main AI Football Intelligence Service
export class AIFootballIntelligenceService {
  private formationAnalyzer: FormationAnalyzer;
  private autoAssignmentEngine: AutoAssignmentEngine;
  private tacticalPatternEngine: TacticalPatternEngine;
  
  constructor() {
    this.formationAnalyzer = new FormationAnalyzer();
    this.autoAssignmentEngine = new AutoAssignmentEngine();
    this.tacticalPatternEngine = new TacticalPatternEngine();
  }
  
  /**
   * Analyze formation and provide comprehensive insights
   */
  async analyzeFormation(formation: Formation, players: Player[]): Promise<FormationAnalysis> {
    return this.formationAnalyzer.analyzeFormation(formation, players);
  }
  
  /**
   * Get optimized player assignments for formation
   */
  async optimizePlayerAssignments(formation: Formation, players: Player[]): Promise<OptimizedAssignment> {
    return this.autoAssignmentEngine.optimizePlayerAssignment(formation, players);
  }
  
  /**
   * Analyze tactical patterns and provide strategic insights
   */
  async analyzeTacticalPatterns(formation: Formation, players: Player[], oppositionData?: any): Promise<TacticalAnalysis> {
    return this.tacticalPatternEngine.analyzeTacticalPatterns(formation, players, oppositionData);
  }
  
  /**
   * Calculate player compatibility for chemistry system
   */
  calculatePlayerCompatibility(player1: Player, player2: Player): number {
    return ChemistryEngine.calculateCompatibility(player1, player2);
  }
  
  /**
   * Predict formation effectiveness against specific opposition
   */
  async predictFormationEffectiveness(
    formation: Formation,
    players: Player[],
    oppositionFormation?: Formation,
    oppositionPlayers?: Player[]
  ): Promise<EffectivenessPrediction> {
    const analysis = await this.analyzeFormation(formation, players);
    const tacticalAnalysis = await this.analyzeTacticalPatterns(formation, players);
    
    let effectivenessScore = analysis.overallRating;
    
    // Adjust based on opposition if provided
    if (oppositionFormation && oppositionPlayers) {
      const oppositionAnalysis = await this.analyzeFormation(oppositionFormation, oppositionPlayers);
      effectivenessScore = this.calculateMatchupEffectiveness(analysis, oppositionAnalysis);
    }
    
    return {
      effectivenessScore,
      confidence: this.calculatePredictionConfidence(analysis, tacticalAnalysis),
      keyFactors: this.identifyKeyEffectivenessFactors(analysis, tacticalAnalysis),
      risksAndOpportunities: {
        risks: tacticalAnalysis.vulnerabilities.map(v => v.description),
        opportunities: tacticalAnalysis.opportunities.map(o => o.description)
      }
    };
  }
  
  private calculateMatchupEffectiveness(
    ourAnalysis: FormationAnalysis,
    oppositionAnalysis: FormationAnalysis
  ): number {
    // Simple matchup calculation - would be more sophisticated in production
    const ourStrength = ourAnalysis.overallRating;
    const theirStrength = oppositionAnalysis.overallRating;
    
    // Factor in style matchups
    const styleBenefit = this.calculateStyleMatchupBenefit(ourAnalysis, oppositionAnalysis);
    
    return Math.min(1, Math.max(0, ourStrength - theirStrength * 0.5 + styleBenefit));
  }
  
  private calculateStyleMatchupBenefit(
    ourAnalysis: FormationAnalysis,
    oppositionAnalysis: FormationAnalysis
  ): number {
    // Simplified style matchup calculation
    if (ourAnalysis.attackingStrength > 0.8 && oppositionAnalysis.defensiveStrength < 0.6) {
      return 0.2; // Our attacking strength vs their defensive weakness
    }
    
    if (ourAnalysis.defensiveStrength > 0.8 && oppositionAnalysis.attackingStrength > 0.8) {
      return 0.1; // Defensive solidity vs strong attack
    }
    
    return 0;
  }
  
  private calculatePredictionConfidence(
    analysis: FormationAnalysis,
    tacticalAnalysis: TacticalAnalysis
  ): number {
    // Higher confidence for well-balanced teams with clear patterns
    const balanceConfidence = analysis.balanceScore;
    const chemistryConfidence = analysis.overallChemistry;
    const patternClarity = tacticalAnalysis.patterns.reduce((sum, p) => sum + p.strength, 0) / tacticalAnalysis.patterns.length;
    
    return (balanceConfidence + chemistryConfidence + patternClarity) / 3;
  }
  
  private identifyKeyEffectivenessFactors(
    analysis: FormationAnalysis,
    tacticalAnalysis: TacticalAnalysis
  ): string[] {
    const factors: string[] = [];
    
    if (analysis.overallChemistry > 0.8) {
      factors.push("Excellent team chemistry provides strong foundation");
    }
    
    if (analysis.defensiveStrength > 0.8) {
      factors.push("Solid defensive structure limits opposition chances");
    }
    
    if (analysis.attackingStrength > 0.8) {
      factors.push("Strong attacking potential creates scoring opportunities");
    }
    
    // Add tactical pattern factors
    tacticalAnalysis.patterns.forEach(pattern => {
      if (pattern.strength > 0.7) {
        factors.push(`${pattern.description} provides tactical advantage`);
      }
    });
    
    return factors;
  }
}

export interface EffectivenessPrediction {
  effectivenessScore: number;
  confidence: number;
  keyFactors: string[];
  risksAndOpportunities: {
    risks: string[];
    opportunities: string[];
  };
}

// Export singleton instance
export const aiFootballIntelligence = new AIFootballIntelligenceService();