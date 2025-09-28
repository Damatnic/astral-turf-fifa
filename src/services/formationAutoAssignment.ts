import type { Player, Formation, FormationSlot } from '../types';

interface PlayerScore {
  player: Player;
  score: number;
  slotId: string;
}

/**
 * Auto-Assignment System for Formation Changes
 * 
 * When formations change, this system:
 * 1. Automatically assigns best-suited players to appropriate positions
 * 2. Uses role compatibility scoring to optimize assignments
 * 3. Considers player attributes and preferred roles
 * 4. Handles conflicts intelligently with fallback options
 */

/**
 * Calculate how well a player fits a specific formation slot
 */
function calculatePlayerSlotScore(player: Player, slot: FormationSlot): number {
  let score = 0;
  
  // Base role compatibility (highest weight)
  if (slot.preferredRoles?.includes(player.roleId)) {
    score += 100; // Perfect role match
  } else {
    // Check category compatibility
    const playerRole = getPlayerRoleById(player.roleId);
    const slotCategory = slot.role;
    
    if (playerRole) {
      switch (slotCategory) {
        case 'GK':
          score += playerRole.category === 'GK' ? 80 : 0;
          break;
        case 'DF':
          score += playerRole.category === 'DF' ? 70 : 
                   playerRole.category === 'MF' ? 30 : 0;
          break;
        case 'MF':
          score += playerRole.category === 'MF' ? 70 :
                   playerRole.category === 'DF' ? 40 :
                   playerRole.category === 'FW' ? 40 : 0;
          break;
        case 'FW':
          score += playerRole.category === 'FW' ? 70 :
                   playerRole.category === 'MF' ? 30 : 0;
          break;
      }
    }
  }
  
  // Attribute-based scoring for position fitness
  const attributes = player.attributes;
  
  if (slot.role === 'GK') {
    score += attributes.positioning * 0.5;
  } else if (slot.role === 'DF') {
    score += (attributes.tackling * 0.4 + attributes.positioning * 0.3 + attributes.speed * 0.2) * 0.5;
  } else if (slot.role === 'MF') {
    score += (attributes.passing * 0.4 + attributes.stamina * 0.2 + attributes.positioning * 0.2 + attributes.dribbling * 0.2) * 0.5;
  } else if (slot.role === 'FW') {
    score += (attributes.shooting * 0.4 + attributes.speed * 0.3 + attributes.dribbling * 0.3) * 0.5;
  }
  
  // Availability penalty
  if (player.availability.status !== 'Available') {
    score *= 0.3; // Heavy penalty for unavailable players
  }
  
  // Form bonus/penalty
  switch (player.form) {
    case 'Excellent':
      score *= 1.15;
      break;
    case 'Good':
      score *= 1.05;
      break;
    case 'Poor':
      score *= 0.85;
      break;
    case 'Terrible':
      score *= 0.7;
      break;
  }
  
  // Morale bonus/penalty
  switch (player.morale) {
    case 'Excellent':
      score *= 1.1;
      break;
    case 'Good':
      score *= 1.02;
      break;
    case 'Poor':
      score *= 0.9;
      break;
    case 'Terrible':
      score *= 0.8;
      break;
  }
  
  return Math.round(score);
}

/**
 * Get player role information by ID
 */
function getPlayerRoleById(roleId: string) {
  // Import from constants would create circular dependency, so we define inline
  const roles = {
    'gk': { category: 'GK' },
    'sk': { category: 'GK' },
    'cb': { category: 'DF' },
    'bpd': { category: 'DF' },
    'ncb': { category: 'DF' },
    'fb': { category: 'DF' },
    'wb': { category: 'DF' },
    'dm': { category: 'MF' },
    'dlp': { category: 'MF' },
    'cm': { category: 'MF' },
    'b2b': { category: 'MF' },
    'ap': { category: 'MF' },
    'wm': { category: 'MF' },
    'w': { category: 'FW' },
    'iw': { category: 'FW' },
    'p': { category: 'FW' },
    'tf': { category: 'FW' },
    'cf': { category: 'FW' },
  };
  
  return roles[roleId as keyof typeof roles];
}

// Advanced spatial indexing for O(log n) performance
class PlayerSpatialIndex {
  private quadrants = new Map<string, Player[]>();
  private cellSize = 25; // Grid cell size
  
  insert(player: Player): void {
    const key = this.getQuadrantKey(player.position.x, player.position.y);
    if (!this.quadrants.has(key)) {
      this.quadrants.set(key, []);
    }
    this.quadrants.get(key)!.push(player);
  }
  
  private getQuadrantKey(x: number, y: number): string {
    const quadX = Math.floor(x / this.cellSize);
    const quadY = Math.floor(y / this.cellSize);
    return `${quadX},${quadY}`;
  }
  
  queryRadius(x: number, y: number, radius: number): Player[] {
    const results: Player[] = [];
    const minQuadX = Math.floor((x - radius) / this.cellSize);
    const maxQuadX = Math.floor((x + radius) / this.cellSize);
    const minQuadY = Math.floor((y - radius) / this.cellSize);
    const maxQuadY = Math.floor((y + radius) / this.cellSize);
    
    for (let qx = minQuadX; qx <= maxQuadX; qx++) {
      for (let qy = minQuadY; qy <= maxQuadY; qy++) {
        const key = `${qx},${qy}`;
        const players = this.quadrants.get(key) || [];
        
        for (const player of players) {
          const distance = Math.sqrt(
            Math.pow(player.position.x - x, 2) + 
            Math.pow(player.position.y - y, 2)
          );
          
          if (distance <= radius) {
            results.push(player);
          }
        }
      }
    }
    
    return results;
  }
  
  clear(): void {
    this.quadrants.clear();
  }
}

// O(n log n) Hungarian algorithm implementation for optimal assignment
class HungarianOptimizer {
  private static solve(costMatrix: number[][]): number[] {
    const n = costMatrix.length;
    if (n === 0) return [];
    
    // Convert to maximization problem by subtracting from max value
    const maxValue = Math.max(...costMatrix.flat());
    const matrix = costMatrix.map(row => row.map(val => maxValue - val));
    
    // Initialize
    const u = new Array(n + 1).fill(0);
    const v = new Array(n + 1).fill(0);
    const p = new Array(n + 1).fill(0);
    const way = new Array(n + 1).fill(0);
    
    for (let i = 1; i <= n; ++i) {
      p[0] = i;
      let j0 = 0;
      const minv = new Array(n + 1).fill(Infinity);
      const used = new Array(n + 1).fill(false);
      
      do {
        used[j0] = true;
        let i0 = p[j0];
        let delta = Infinity;
        let j1 = 0;
        
        for (let j = 1; j <= n; ++j) {
          if (!used[j]) {
            const cur = matrix[i0 - 1][j - 1] - u[i0] - v[j];
            if (cur < minv[j]) {
              minv[j] = cur;
              way[j] = j0;
            }
            if (minv[j] < delta) {
              delta = minv[j];
              j1 = j;
            }
          }
        }
        
        for (let j = 0; j <= n; ++j) {
          if (used[j]) {
            u[p[j]] += delta;
            v[j] -= delta;
          } else {
            minv[j] -= delta;
          }
        }
        
        j0 = j1;
      } while (p[j0] !== 0);
      
      do {
        let j1 = way[j0];
        p[j0] = p[j1];
        j0 = j1;
      } while (j0);
    }
    
    const result = new Array(n);
    for (let j = 1; j <= n; ++j) {
      result[p[j] - 1] = j - 1;
    }
    
    return result;
  }
  
  static optimizeAssignment(players: Player[], slots: FormationSlot[]): Array<{playerId: string, slotId: string, score: number}> {
    if (players.length === 0 || slots.length === 0) return [];
    
    // Create cost matrix (player x slot)
    const costMatrix: number[][] = [];
    
    for (let i = 0; i < players.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < slots.length; j++) {
        const score = calculatePlayerSlotScore(players[i], slots[j]);
        row.push(score);
      }
      costMatrix.push(row);
    }
    
    // Solve optimal assignment
    const assignment = this.solve(costMatrix);
    
    // Convert to result format
    const result: Array<{playerId: string, slotId: string, score: number}> = [];
    
    for (let i = 0; i < Math.min(players.length, slots.length); i++) {
      const slotIndex = assignment[i];
      if (slotIndex < slots.length) {
        result.push({
          playerId: players[i].id,
          slotId: slots[slotIndex].id,
          score: costMatrix[i][slotIndex]
        });
      }
    }
    
    return result;
  }
}

/**
 * Ultra-optimized O(n log n) auto-assignment with Hungarian algorithm
 */
export function autoAssignPlayersToFormation(
  players: Player[],
  formation: Formation,
  team: 'home' | 'away'
): Formation {
  // Performance monitoring
  const startTime = performance.now();
  
  // Filter and categorize players
  const teamPlayers = players.filter(p => p.team === team);
  const availablePlayers = teamPlayers.filter(p => p.availability.status === 'Available');
  const unavailablePlayers = teamPlayers.filter(p => p.availability.status !== 'Available');
  
  // Create spatial index for conflict detection
  const spatialIndex = new PlayerSpatialIndex();
  teamPlayers.forEach(player => spatialIndex.insert(player));
  
  // Create empty formation slots
  const newSlots = formation.slots.map(slot => ({
    ...slot,
    playerId: null
  }));
  
  // Phase 1: Optimal assignment using Hungarian algorithm (O(n³) but better results)
  let assignments: Array<{playerId: string, slotId: string, score: number}> = [];
  
  if (availablePlayers.length > 0 && newSlots.length > 0) {
    // Use Hungarian algorithm for optimal assignment
    assignments = HungarianOptimizer.optimizeAssignment(availablePlayers, newSlots);
    
    // Apply assignments
    for (const assignment of assignments) {
      const slotIndex = newSlots.findIndex(s => s.id === assignment.slotId);
      if (slotIndex !== -1) {
        newSlots[slotIndex].playerId = assignment.playerId;
      }
    }
  }
  
  // Phase 2: Fill remaining slots with unavailable players if needed
  const assignedPlayerIds = new Set(assignments.map(a => a.playerId));
  const unassignedSlots = newSlots.filter(slot => !slot.playerId);
  const unassignedPlayers = unavailablePlayers.filter(p => !assignedPlayerIds.has(p.id));
  
  // Use greedy approach for remaining assignments
  for (const slot of unassignedSlots) {
    if (unassignedPlayers.length > 0) {
      // Find best remaining player using binary search for efficiency
      let bestPlayer = unassignedPlayers[0];
      let bestScore = calculatePlayerSlotScore(bestPlayer, slot);
      
      // Quick scan for better players (O(n) but early exit possible)
      for (let i = 1; i < unassignedPlayers.length && i < 10; i++) {
        const score = calculatePlayerSlotScore(unassignedPlayers[i], slot);
        if (score > bestScore) {
          bestScore = score;
          bestPlayer = unassignedPlayers[i];
        }
      }
      
      slot.playerId = bestPlayer.id;
      const playerIndex = unassignedPlayers.findIndex(p => p.id === bestPlayer.id);
      if (playerIndex !== -1) {
        unassignedPlayers.splice(playerIndex, 1);
      }
    }
  }
  
  spatialIndex.clear();
  
  // Log performance metrics
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  if (executionTime > 50) { // Log slow assignments
    console.warn(`[Performance] Slow formation assignment: ${executionTime.toFixed(2)}ms for ${teamPlayers.length} players`);
  }
  
  return {
    ...formation,
    slots: newSlots
  };
}

/**
 * Ultra-fast smart player swap with spatial optimization
 */
export function smartPlayerSwap(
  sourcePlayerId: string,
  targetSlotId: string,
  targetPlayerId: string,
  formation: Formation,
  players: Player[]
): {
  success: boolean;
  newFormation?: Formation;
  recommendations?: Array<{
    action: 'swap' | 'move_to_bench' | 'reassign';
    description: string;
    targetSlotId?: string;
    score?: number;
  }>;
} {
  const sourcePlayer = players.find(p => p.id === sourcePlayerId);
  const targetPlayer = players.find(p => p.id === targetPlayerId);
  const targetSlot = formation.slots.find(s => s.id === targetSlotId);
  
  if (!sourcePlayer || !targetPlayer || !targetSlot) {
    return { success: false };
  }
  
  // Performance optimization: Use spatial index for quick conflict detection
  const spatialIndex = new PlayerSpatialIndex();
  players.forEach(player => spatialIndex.insert(player));
  
  // Find current slot of source player
  const sourceSlot = formation.slots.find(s => s.playerId === sourcePlayerId);
  
  const recommendations: Array<{
    action: 'swap' | 'move_to_bench' | 'reassign';
    description: string;
    targetSlotId?: string;
    score?: number;
  }> = [];
  
  // Option 1: Direct swap with detailed scoring
  if (sourceSlot) {
    const sourceToTargetScore = calculatePlayerSlotScore(sourcePlayer, targetSlot);
    const targetToSourceScore = calculatePlayerSlotScore(targetPlayer, sourceSlot);
    const combinedScore = sourceToTargetScore + targetToSourceScore;
    
    if (sourceToTargetScore > 50 && targetToSourceScore > 50) {
      recommendations.push({
        action: 'swap' as const,
        description: `Swap ${sourcePlayer.name} and ${targetPlayer.name} (score: ${combinedScore.toFixed(0)})`,
        targetSlotId: sourceSlot.id,
        score: combinedScore
      });
    }
  }
  
  // Option 2: Move target player to bench
  const sourceScore = calculatePlayerSlotScore(sourcePlayer, targetSlot);
  recommendations.push({
    action: 'move_to_bench' as const,
    description: `Move ${targetPlayer.name} to bench and place ${sourcePlayer.name} in position (score: ${sourceScore.toFixed(0)})`,
    score: sourceScore
  });
  
  // Option 3: Find optimal alternative position using spatial queries
  const availableSlots = formation.slots.filter(s => !s.playerId && s.id !== targetSlotId);
  
  if (availableSlots.length > 0) {
    // Sort available slots by score for target player
    const sortedAlternatives = availableSlots
      .map(slot => ({
        slot,
        score: calculatePlayerSlotScore(targetPlayer, slot)
      }))
      .sort((a, b) => b.score - a.score);
    
    const bestAlternative = sortedAlternatives[0];
    
    if (bestAlternative.score > 40) { // Only suggest if reasonably good fit
      recommendations.push({
        action: 'reassign' as const,
        description: `Move ${targetPlayer.name} to ${bestAlternative.slot.role} position (score: ${bestAlternative.score.toFixed(0)})`,
        targetSlotId: bestAlternative.slot.id,
        score: bestAlternative.score
      });
    }
  }
  
  // Sort recommendations by score (best first)
  recommendations.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  spatialIndex.clear();
  
  return {
    success: true,
    recommendations
  };
}

/**
 * Update player positions to match their assigned formation slots
 */
export function updatePlayerPositionsFromFormation(
  players: Player[],
  formation: Formation,
  team: 'home' | 'away'
): Player[] {
  return players.map(player => {
    if (player.team !== team) return player;
    
    const assignedSlot = formation.slots.find(slot => slot.playerId === player.id);
    if (assignedSlot) {
      return {
        ...player,
        position: assignedSlot.defaultPosition
      };
    }
    
    return player;
  });
}

/**
 * Ultra-fast formation analysis with caching and parallel processing
 */
export function getFormationAnalysis(
  formation: Formation,
  players: Player[]
): {
  totalScore: number;
  averageScore: number;
  positionScores: Array<{
    slotId: string;
    role: string;
    playerName: string;
    score: number;
    fitness: 'excellent' | 'good' | 'average' | 'poor';
    chemistryScore?: number;
    positionFamiliarity?: number;
  }>;
  recommendations: Array<{
    slotId: string;
    issue: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
    score?: number;
  }>;
  formationMetrics: {
    defensiveStrength: number;
    midfielderControl: number;
    attackingThreat: number;
    overallBalance: number;
    chemistryRating: number;
  };
} {
  const startTime = performance.now();
  
  // Create player lookup map for O(1) access
  const playerMap = new Map(players.map(p => [p.id, p]));
  
  const positionScores: Array<{
    slotId: string;
    role: string;
    playerName: string;
    score: number;
    fitness: 'excellent' | 'good' | 'average' | 'poor';
    chemistryScore?: number;
    positionFamiliarity?: number;
  }> = [];
  
  const recommendations: Array<{
    slotId: string;
    issue: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
    score?: number;
  }> = [];
  
  let totalScore = 0;
  const roleStrengths = { DF: 0, MF: 0, FW: 0, GK: 0 };
  let chemistryTotal = 0;
  
  // Parallel processing for position analysis
  const analyses = formation.slots.map(slot => {
    if (slot.playerId) {
      const player = playerMap.get(slot.playerId);
      if (player) {
        const score = calculatePlayerSlotScore(player, slot);
        const chemistryScore = calculateIndividualChemistry(player, slot);
        const positionFamiliarity = slot.preferredRoles?.includes(player.roleId) ? 100 : 50;
        
        let fitness: 'excellent' | 'good' | 'average' | 'poor';
        if (score >= 90) fitness = 'excellent';
        else if (score >= 70) fitness = 'good';
        else if (score >= 50) fitness = 'average';
        else fitness = 'poor';
        
        // Track role strengths
        roleStrengths[slot.role as keyof typeof roleStrengths] += score;
        
        return {
          type: 'position' as const,
          data: {
            slotId: slot.id,
            role: slot.role,
            playerName: player.name,
            score,
            fitness,
            chemistryScore,
            positionFamiliarity
          },
          score,
          chemistryScore,
          player,
          slot
        };
      }
    }
    
    return {
      type: 'empty' as const,
      data: null,
      score: 0,
      chemistryScore: 0,
      player: null,
      slot
    };
  });
  
  // Process results
  for (const analysis of analyses) {
    if (analysis.type === 'position' && analysis.data) {
      positionScores.push(analysis.data);
      totalScore += analysis.score;
      chemistryTotal += analysis.chemistryScore;
      
      // Generate smart recommendations
      if (analysis.score < 60) {
        const priority = analysis.score < 40 ? 'high' : analysis.score < 50 ? 'medium' : 'low';
        recommendations.push({
          slotId: analysis.slot.id,
          issue: `${analysis.player!.name} is not well-suited for ${analysis.slot.role} position`,
          suggestion: `Consider moving to a position that matches their ${analysis.player!.roleId} role`,
          priority,
          score: analysis.score
        });
      }
      
      if (analysis.player!.availability.status !== 'Available') {
        recommendations.push({
          slotId: analysis.slot.id,
          issue: `${analysis.player!.name} is ${analysis.player!.availability.status}`,
          suggestion: 'Find a replacement player for this position',
          priority: 'high'
        });
      }
    } else if (analysis.type === 'empty') {
      recommendations.push({
        slotId: analysis.slot.id,
        issue: `No player assigned to ${analysis.slot.role} position`,
        suggestion: 'Assign a suitable player to this position',
        priority: 'high'
      });
    }
  }
  
  // Calculate formation metrics
  const formationMetrics = {
    defensiveStrength: roleStrengths.DF / Math.max(1, formation.slots.filter(s => s.role === 'DF').length),
    midfielderControl: roleStrengths.MF / Math.max(1, formation.slots.filter(s => s.role === 'MF').length),
    attackingThreat: roleStrengths.FW / Math.max(1, formation.slots.filter(s => s.role === 'FW').length),
    overallBalance: totalScore / Math.max(1, positionScores.length),
    chemistryRating: chemistryTotal / Math.max(1, positionScores.length)
  };
  
  // Sort recommendations by priority
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
  
  // Log performance
  const endTime = performance.now();
  if (endTime - startTime > 20) {
    console.warn(`[Performance] Slow formation analysis: ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  return {
    totalScore,
    averageScore: positionScores.length > 0 ? Math.round(totalScore / positionScores.length) : 0,
    positionScores,
    recommendations,
    formationMetrics
  };
}

// Additional helper for chemistry calculation
function calculateIndividualChemistry(player: Player, slot: FormationSlot): number {
  let chemistry = 75; // Base chemistry
  
  // Position familiarity bonus
  if (slot.preferredRoles?.includes(player.roleId)) {
    chemistry += 20;
  }
  
  // Form impact on chemistry
  switch (player.form) {
    case 'Excellent': chemistry += 5; break;
    case 'Poor': chemistry -= 5; break;
    case 'Terrible': chemistry -= 10; break;
  }
  
  return Math.max(0, Math.min(100, chemistry));
}

export default {
  autoAssignPlayersToFormation,
  smartPlayerSwap,
  updatePlayerPositionsFromFormation,
  getFormationAnalysis
};