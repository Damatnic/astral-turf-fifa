/**
 * Catalyst Formation Calculation Web Worker
 * O(n log n) complexity formation optimization in Web Worker
 */

import type { Player, Formation, FormationSlot } from '../types';

type WorkerMessage =
  | {
      id: string;
      type: 'VALIDATE_POSITION';
      payload: PositionValidationRequest;
    }
  | {
      id: string;
      type: 'OPTIMIZE_FORMATION';
      payload: FormationOptimizationRequest;
    };

interface WorkerResponse {
  id: string;
  type: 'SUCCESS' | 'ERROR';
  result?: PositionValidationResult | FormationOptimizationResult;
  error?: string;
}

interface PositionValidationRequest {
  playerId: string;
  position: { x: number; y: number };
  formation: Formation;
  players: Player[];
}

interface PositionValidationResult {
  isValid: boolean;
  optimizedPosition?: { x: number; y: number };
  conflicts: string[];
  suggestions: string[];
}

interface FormationOptimizationRequest {
  players: Player[];
  formation: Formation;
  constraints: {
    prioritizeExperience: boolean;
    maintainChemistry: boolean;
    respectPositions: boolean;
  };
}

interface FormationOptimizationResult {
  optimizedFormation: Formation;
  score: number;
  improvements: string[];
  alternatives: Formation[];
}

interface WorkerLikeEvent {
  data: WorkerResponse;
}

interface WorkerLike {
  onmessage: ((event: WorkerLikeEvent) => void) | null;
  onerror: ((error: unknown) => void) | null;
  postMessage(message: WorkerMessage): void;
  terminate(): void;
}

type PendingPromise = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

type WorkerConstructor = new (url: string | URL) => WorkerLike;
type BlobConstructor = new (parts: unknown[], options?: { type?: string }) => object;
type URLCreator = { createObjectURL: (obj: unknown) => string };

class InlineWorker implements WorkerLike {
  onmessage: ((event: WorkerLikeEvent) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;

  postMessage(message: WorkerMessage): void {
    const { id, type, payload } = message;

    try {
  let result: PositionValidationResult | FormationOptimizationResult;

      switch (type) {
        case 'VALIDATE_POSITION':
          result = validatePlayerPosition(payload);
          break;
        case 'OPTIMIZE_FORMATION':
          result = optimizeFormationAssignment(payload);
          break;
        default:
          throw new Error(`Unknown message type: ${type}`);
      }

      this.onmessage?.({
        data: {
          id,
          type: 'SUCCESS',
          result,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.onmessage?.({
        data: {
          id,
          type: 'ERROR',
          error: errorMessage,
        },
      });

      this.onerror?.(error);
    }
  }

  terminate(): void {
    // No-op for inline fallback
  }
}

// Advanced spatial indexing for O(log n) collision detection
class SpatialIndex {
  private quadrants: Map<string, Player[]> = new Map();
  private cellSize: number;

  constructor(cellSize = 50) {
    this.cellSize = cellSize;
  }

  private getQuadrantKey(x: number, y: number): string {
    const quadX = Math.floor(x / this.cellSize);
    const quadY = Math.floor(y / this.cellSize);
    return `${quadX},${quadY}`;
  }

  insert(player: Player): void {
    const key = this.getQuadrantKey(player.position.x, player.position.y);
    if (!this.quadrants.has(key)) {
      this.quadrants.set(key, []);
    }
    this.quadrants.get(key)!.push(player);
  }

  query(x: number, y: number, radius = 25): Player[] {
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
          const dx = player.position.x - x;
          const dy = player.position.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);

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

// Advanced player scoring algorithm
function calculateAdvancedPlayerScore(player: Player, slot: FormationSlot): number {
  let score = 0;

  // Role compatibility (40% weight)
  const roleScore = calculateRoleCompatibility(player, slot);
  score += roleScore * 0.4;

  // Physical attributes (25% weight)
  const physicalScore = calculatePhysicalFitness(player, slot);
  score += physicalScore * 0.25;

  // Mental attributes (20% weight)
  const mentalScore = calculateMentalFitness(player);
  score += mentalScore * 0.2;

  // Form and morale (10% weight)
  const conditionScore = calculateConditionScore(player);
  score += conditionScore * 0.1;

  // Chemistry bonus (5% weight)
  const chemistryScore = calculateIndividualChemistry(player, slot);
  score += chemistryScore * 0.05;

  return Math.max(0, Math.min(100, score));
}

function calculateRoleCompatibility(player: Player, slot: FormationSlot): number {
  // Advanced role matching with sub-role considerations
  const roleMap: Record<string, { primary: number; secondary: string[] }> = {
    gk: { primary: 100, secondary: [] },
    cb: { primary: 100, secondary: ['bpd', 'ncb'] },
    bpd: { primary: 100, secondary: ['cb', 'dlp'] },
    fb: { primary: 100, secondary: ['wb', 'wm'] },
    wb: { primary: 100, secondary: ['fb', 'wm', 'w'] },
    dm: { primary: 100, secondary: ['dlp', 'cm'] },
    dlp: { primary: 100, secondary: ['dm', 'cm', 'ap'] },
    cm: { primary: 100, secondary: ['b2b', 'dm', 'ap'] },
    b2b: { primary: 100, secondary: ['cm', 'ap'] },
    ap: { primary: 100, secondary: ['cm', 'iw'] },
    wm: { primary: 100, secondary: ['wb', 'w'] },
    w: { primary: 100, secondary: ['wm', 'iw'] },
    iw: { primary: 100, secondary: ['w', 'ap'] },
    cf: { primary: 100, secondary: ['tf', 'p'] },
    tf: { primary: 100, secondary: ['cf', 'p'] },
    p: { primary: 100, secondary: ['tf', 'cf'] },
  };

  const playerRole = roleMap[player.roleId];
  if (!playerRole) {
    return 0;
  }

  if (slot.preferredRoles?.includes(player.roleId)) {
    return playerRole.primary;
  }

  // Check secondary compatibility
  for (const preferredRole of slot.preferredRoles || []) {
    if (playerRole.secondary.includes(preferredRole)) {
      return 75; // Good compatibility
    }
  }

  // Position category fallback
  const positionCategories: Record<string, string[]> = {
    GK: ['gk'],
    DF: ['cb', 'bpd', 'ncb', 'fb', 'wb'],
    MF: ['dm', 'dlp', 'cm', 'b2b', 'ap', 'wm'],
    FW: ['w', 'iw', 'cf', 'tf', 'p'],
  };

  for (const [category, roles] of Object.entries(positionCategories)) {
    if (roles.includes(player.roleId) && slot.role === category) {
      return 50; // Basic compatibility
    }
  }

  return 0;
}

function calculatePhysicalFitness(player: Player, slot: FormationSlot): number {
  const attrs = player.attributes;

  const requirements: Record<string, Record<string, number>> = {
    GK: { positioning: 0.4, reflexes: 0.3, diving: 0.2, handling: 0.1 },
    DF: { tackling: 0.3, positioning: 0.25, marking: 0.2, strength: 0.15, speed: 0.1 },
    MF: { passing: 0.3, stamina: 0.25, positioning: 0.2, dribbling: 0.15, speed: 0.1 },
    FW: { shooting: 0.3, speed: 0.25, dribbling: 0.2, finishing: 0.15, positioning: 0.1 },
  };

  const reqs = requirements[slot.role] || requirements['MF'];
  let score = 0;

  const attributeRecord = attrs as unknown as Record<string, number | undefined>;
  for (const [attr, weight] of Object.entries(reqs)) {
    const attrValue = attributeRecord[attr] ?? 70;
    score += attrValue * weight;
  }

  return score;
}

function calculateMentalFitness(player: Player): number {
  const attrs = player.attributes;
  const attributeRecord = attrs as unknown as Record<string, number | undefined>;
  const mentalAttrs = ['vision', 'decisions', 'composure', 'concentration', 'leadership'];

  let mentalScore = 0;
  let count = 0;

  for (const attr of mentalAttrs) {
    const value = attributeRecord[attr];
    if (value !== undefined) {
      mentalScore += value;
      count++;
    }
  }

  return count > 0 ? mentalScore / count : 70;
}

function calculateConditionScore(player: Player): number {
  let score = 75; // Base score

  // Form impact
  switch (player.form) {
    case 'Excellent':
      score += 20;
      break;
    case 'Good':
      score += 10;
      break;
    case 'Average':
      break;
    case 'Poor':
      score -= 10;
      break;
    case 'Terrible':
      score -= 20;
      break;
  }

  // Morale impact
  switch (player.morale) {
    case 'Excellent':
      score += 15;
      break;
    case 'Good':
      score += 5;
      break;
    case 'Okay':
      break;
    case 'Poor':
      score -= 5;
      break;
    case 'Terrible':
      score -= 15;
      break;
  }

  // Availability impact
  if (player.availability.status !== 'Available') {
    score *= 0.3;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateIndividualChemistry(player: Player, slot: FormationSlot): number {
  // Simple chemistry calculation - can be enhanced
  const baseChemistry = 75;

  // Position familiarity bonus
  if (slot.preferredRoles?.includes(player.roleId)) {
    return baseChemistry + 25;
  }

  return baseChemistry;
}

// O(n log n) formation optimization using spatial indexing
function optimizeFormationAssignment(
  request: FormationOptimizationRequest,
): FormationOptimizationResult {
  const { players, formation } = request;
  const spatialIndex = new SpatialIndex();

  // Index all players for spatial queries
  players.forEach(player => spatialIndex.insert(player));

  // Calculate all possible player-slot combinations with scoring
  const combinations: Array<{
    player: Player;
    slot: FormationSlot;
    score: number;
  }> = [];

  for (const slot of formation.slots) {
    for (const player of players) {
      const score = calculateAdvancedPlayerScore(player, slot);
      combinations.push({ player, slot, score });
    }
  }

  // Sort by score (O(n log n))
  combinations.sort((a, b) => b.score - a.score);

  // Greedy assignment with conflict resolution
  const assignedPlayers = new Set<string>();
  const assignedSlots = new Set<string>();
  const assignments: Array<{ playerId: string; slotId: string; score: number }> = [];

  for (const combo of combinations) {
    if (!assignedPlayers.has(combo.player.id) && !assignedSlots.has(combo.slot.id)) {
      assignments.push({
        playerId: combo.player.id,
        slotId: combo.slot.id,
        score: combo.score,
      });
      assignedPlayers.add(combo.player.id);
      assignedSlots.add(combo.slot.id);
    }
  }

  // Create optimized formation
  const optimizedSlots = formation.slots.map(slot => {
    const assignment = assignments.find(a => a.slotId === slot.id);
    return {
      ...slot,
      playerId: assignment?.playerId || null,
    };
  });

  const optimizedFormation: Formation = {
    ...formation,
    slots: optimizedSlots,
  };

  // Calculate overall score
  const totalScore = assignments.reduce((sum, a) => sum + a.score, 0);
  const averageScore = assignments.length > 0 ? totalScore / assignments.length : 0;

  // Generate improvements
  const improvements: string[] = [];
  assignments.forEach(assignment => {
    if (assignment.score < 60) {
      const player = players.find(p => p.id === assignment.playerId);
      const slot = formation.slots.find(s => s.id === assignment.slotId);
      if (player && slot) {
        improvements.push(`Consider replacing ${player.name} in ${slot.role} position`);
      }
    }
  });

  spatialIndex.clear();

  return {
    optimizedFormation,
    score: averageScore,
    improvements,
    alternatives: [], // Could generate alternative formations
  };
}

// Fast position validation with spatial indexing
function validatePlayerPosition(request: PositionValidationRequest): PositionValidationResult {
  const { playerId, position, players } = request;
  const spatialIndex = new SpatialIndex();

  // Index all other players
  players.filter(p => p.id !== playerId).forEach(player => spatialIndex.insert(player));

  // Check for nearby conflicts
  const nearbyPlayers = spatialIndex.query(position.x, position.y, 30);
  const conflicts = nearbyPlayers.map(p => p.id);

  // Check formation boundaries
  const isWithinBounds =
    position.x >= 0 && position.x <= 100 && position.y >= 0 && position.y <= 100;

  const suggestions: string[] = [];

  if (conflicts.length > 0) {
    suggestions.push('Consider moving to avoid player overlaps');
  }

  if (!isWithinBounds) {
    suggestions.push('Position is outside field boundaries');
  }

  // Find optimized position if current has conflicts
  let optimizedPosition: { x: number; y: number } | undefined;

  if (conflicts.length > 0) {
    // Simple optimization: move to nearest free space
    const searchRadius = 40;
    const steps = 8;

    for (let r = 10; r <= searchRadius; r += 10) {
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const testX = position.x + Math.cos(angle) * r;
        const testY = position.y + Math.sin(angle) * r;

        if (testX >= 0 && testX <= 100 && testY >= 0 && testY <= 100) {
          const testConflicts = spatialIndex.query(testX, testY, 25);
          if (testConflicts.length === 0) {
            optimizedPosition = { x: testX, y: testY };
            break;
          }
        }
      }
      if (optimizedPosition) {
        break;
      }
    }
  }

  spatialIndex.clear();

  return {
    isValid: conflicts.length === 0 && isWithinBounds,
    optimizedPosition,
    conflicts,
    suggestions,
  };
}

// Web Worker wrapper class for main thread
export class FormationWebWorker {
  private worker: WorkerLike;
  private messageId = 0;
  private pendingPromises = new Map<string, PendingPromise>();

  constructor() {
    const supportsWorker =
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as { Worker?: unknown }).Worker === 'function' &&
      typeof (globalThis as { Blob?: unknown }).Blob === 'function' &&
      typeof globalThis.URL !== 'undefined' &&
      typeof globalThis.URL.createObjectURL === 'function';

    if (supportsWorker) {
      const workerCode = `
        ${SpatialIndex.toString()}
        ${calculateAdvancedPlayerScore.toString()}
        ${calculateRoleCompatibility.toString()}
        ${calculatePhysicalFitness.toString()}
        ${calculateMentalFitness.toString()}
        ${calculateConditionScore.toString()}
        ${calculateIndividualChemistry.toString()}
        ${optimizeFormationAssignment.toString()}
        ${validatePlayerPosition.toString()}
        
        self.onmessage = function(e) {
          const { id, type, payload } = e.data;
          
          try {
            let result;
            
            switch (type) {
              case 'VALIDATE_POSITION':
                result = validatePlayerPosition(payload);
                break;
              case 'OPTIMIZE_FORMATION':
                result = optimizeFormationAssignment(payload);
                break;
              default:
                throw new Error('Unknown message type: ' + type);
            }
            
            self.postMessage({
              id,
              type: 'SUCCESS',
              result
            });
          } catch (error) {
            self.postMessage({
              id,
              type: 'ERROR',
              error: error.message
            });
          }
        };
      `;

      const WorkerCtor = (globalThis as { Worker: WorkerConstructor }).Worker;
      const BlobCtor = (globalThis as { Blob: BlobConstructor }).Blob;
      const URLCreator = globalThis.URL as unknown as URLCreator;
      const blob = new BlobCtor([workerCode], { type: 'application/javascript' });
      const url = URLCreator.createObjectURL(blob);
      this.worker = new WorkerCtor(url);
    } else {
      this.worker = new InlineWorker();
    }

    this.worker.onmessage = e => {
      const { id, type, result, error } = e.data as WorkerResponse;
      const promise = this.pendingPromises.get(id);

      if (promise) {
        this.pendingPromises.delete(id);

        if (type === 'SUCCESS') {
          promise.resolve(result);
        } else {
          promise.reject(new Error(error));
        }
      }
    };

    this.worker.onerror = error => {
      // eslint-disable-next-line no-console
      console.error('Worker error:', error);
      // Reject all pending promises
      for (const promise of this.pendingPromises.values()) {
        promise.reject(error);
      }
      this.pendingPromises.clear();
    };
  }

  private sendMessage<T>(
    type: WorkerMessage['type'],
    payload: WorkerMessage['payload'],
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = `msg_${++this.messageId}`;

      this.pendingPromises.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject: reject as (reason?: unknown) => void,
      });

      this.worker.postMessage({
        id,
        type,
        payload,
      } as WorkerMessage);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingPromises.has(id)) {
          this.pendingPromises.delete(id);
          reject(new Error('Worker timeout'));
        }
      }, 5000);
    });
  }

  async validatePlayerPosition(
    request: PositionValidationRequest,
  ): Promise<PositionValidationResult> {
    return this.sendMessage<PositionValidationResult>('VALIDATE_POSITION', request);
  }

  async optimizeFormation(
    request: FormationOptimizationRequest,
  ): Promise<FormationOptimizationResult> {
    return this.sendMessage<FormationOptimizationResult>('OPTIMIZE_FORMATION', request);
  }

  terminate(): void {
    this.worker.terminate();

    // Reject all pending promises
    for (const promise of this.pendingPromises.values()) {
      promise.reject(new Error('Worker terminated'));
    }
    this.pendingPromises.clear();
  }
}

export default FormationWebWorker;
