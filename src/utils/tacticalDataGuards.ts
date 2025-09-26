import type { Formation, FormationSlot, Player } from '../types';
import type { Position } from '../types/player';

/**
 * Type guards and utility functions for safe tactical data access
 * These functions provide bulletproof protection against undefined/null data scenarios
 */

/**
 * Type guard to check if a formation is valid
 */
export function isValidFormation(formation: any): formation is Formation {
  return (
    formation &&
    typeof formation === 'object' &&
    Array.isArray(formation.slots) &&
    formation.slots.length > 0 &&
    typeof formation.name === 'string'
  );
}

/**
 * Type guard to check if a formation slot is valid
 */
export function isValidFormationSlot(slot: any): slot is FormationSlot {
  return (
    slot &&
    typeof slot === 'object' &&
    typeof slot.id === 'string' &&
    slot.defaultPosition &&
    typeof slot.defaultPosition.x === 'number' &&
    typeof slot.defaultPosition.y === 'number' &&
    !isNaN(slot.defaultPosition.x) &&
    !isNaN(slot.defaultPosition.y) &&
    isFinite(slot.defaultPosition.x) &&
    isFinite(slot.defaultPosition.y)
  );
}

/**
 * Type guard to check if a player is valid
 */
export function isValidPlayer(player: any): player is Player {
  return (
    player &&
    typeof player === 'object' &&
    typeof player.id === 'string' &&
    typeof player.name === 'string' &&
    player.position &&
    typeof player.position.x === 'number' &&
    typeof player.position.y === 'number' &&
    !isNaN(player.position.x) &&
    !isNaN(player.position.y) &&
    isFinite(player.position.x) &&
    isFinite(player.position.y)
  );
}

/**
 * Type guard to check if a position is valid
 */
export function isValidPosition(position: any): position is Position {
  return (
    position &&
    typeof position === 'object' &&
    typeof position.x === 'number' &&
    typeof position.y === 'number' &&
    !isNaN(position.x) &&
    !isNaN(position.y) &&
    isFinite(position.x) &&
    isFinite(position.y)
  );
}

/**
 * Safely get formation slots with comprehensive validation
 */
export function getFormationSlots(formation: Formation | null | undefined): FormationSlot[] {
  if (!isValidFormation(formation)) {
    console.warn('Invalid formation provided to getFormationSlots:', formation);
    return [];
  }
  
  return formation.slots.filter(isValidFormationSlot);
}

/**
 * Safely get players assigned to formation slots
 */
export function getAssignedPlayers(formation: Formation | null | undefined, players: Player[] | null | undefined): Player[] {
  if (!isValidFormation(formation) || !Array.isArray(players)) {
    return [];
  }
  
  const validSlots = getFormationSlots(formation);
  const assignedPlayerIds = new Set(validSlots.map(slot => slot.playerId).filter(Boolean));
  
  return players.filter(player => 
    isValidPlayer(player) && 
    assignedPlayerIds.has(player.id)
  );
}

/**
 * Safely get unassigned players
 */
export function getUnassignedPlayers(
  formation: Formation | null | undefined, 
  players: Player[] | null | undefined,
  team?: string
): Player[] {
  if (!Array.isArray(players)) {
    return [];
  }
  
  let filteredPlayers = players.filter(isValidPlayer);
  
  if (team) {
    filteredPlayers = filteredPlayers.filter(p => p.team === team);
  }
  
  if (!isValidFormation(formation)) {
    return filteredPlayers;
  }
  
  const validSlots = getFormationSlots(formation);
  const assignedPlayerIds = new Set(validSlots.map(slot => slot.playerId).filter(Boolean));
  
  return filteredPlayers.filter(player => !assignedPlayerIds.has(player.id));
}

/**
 * Safely find a player by ID with validation
 */
export function findPlayerById(players: Player[] | null | undefined, playerId: string | null | undefined): Player | null {
  if (!Array.isArray(players) || !playerId) {
    return null;
  }
  
  const player = players.find(p => p?.id === playerId);
  return isValidPlayer(player) ? player : null;
}

/**
 * Safely find a formation slot by ID with validation
 */
export function findSlotById(formation: Formation | null | undefined, slotId: string | null | undefined): FormationSlot | null {
  if (!isValidFormation(formation) || !slotId) {
    return null;
  }
  
  const slot = formation.slots.find(s => s?.id === slotId);
  return isValidFormationSlot(slot) ? slot : null;
}

/**
 * Safely get player position with fallback
 */
export function getPlayerPosition(player: Player | null | undefined, fallback: Position = { x: 50, y: 50 }): Position {
  if (!isValidPlayer(player)) {
    return fallback;
  }
  
  return isValidPosition(player.position) ? player.position : fallback;
}

/**
 * Safely get slot default position with fallback
 */
export function getSlotPosition(slot: FormationSlot | null | undefined, fallback: Position = { x: 50, y: 50 }): Position {
  if (!isValidFormationSlot(slot)) {
    return fallback;
  }
  
  return isValidPosition(slot.defaultPosition) ? slot.defaultPosition : fallback;
}

/**
 * Safely calculate formation statistics
 */
export function getFormationStats(formation: Formation | null | undefined) {
  const validSlots = getFormationSlots(formation);
  const assignedSlots = validSlots.filter(slot => slot.playerId);
  
  return {
    totalSlots: validSlots.length,
    assignedSlots: assignedSlots.length,
    emptySlots: validSlots.length - assignedSlots.length,
    isComplete: assignedSlots.length === validSlots.length,
    isValid: validSlots.length > 0
  };
}

/**
 * Safely create a Set of player IDs from formation
 */
export function getFormationPlayerIds(formation: Formation | null | undefined): Set<string> {
  const validSlots = getFormationSlots(formation);
  const playerIds = validSlots
    .map(slot => slot.playerId)
    .filter((id): id is string => Boolean(id));
    
  return new Set(playerIds);
}

/**
 * Error boundary helper for tactical calculations
 */
export function safeCalculation<T>(calculation: () => T, fallback: T, context: string = 'calculation'): T {
  try {
    const result = calculation();
    if (result === null || result === undefined) {
      console.warn(`${context} returned null/undefined, using fallback`);
      return fallback;
    }
    return result;
  } catch (error) {
    console.error(`Error in ${context}:`, error);
    return fallback;
  }
}

/**
 * Validates and filters animation trail points
 */
export function validateTrailPoints(points: any[]): Position[] {
  if (!Array.isArray(points)) {
    return [];
  }
  
  return points.filter(isValidPosition);
}

/**
 * Safely mirrors a position for away team
 */
export function safeMirrorPosition(position: Position | null | undefined): Position {
  const validPos = isValidPosition(position) ? position : { x: 50, y: 50 };
  return { x: 100 - validPos.x, y: 100 - validPos.y };
}