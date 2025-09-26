/**
 * Comprehensive validation functions for Tactics Board components
 * Prevents runtime errors by validating data structures before use
 */

import type { Player, Formation, FormationSlot, Team, Position } from '../types';

/**
 * Validates if a position object is valid
 */
export const isValidPosition = (position: unknown): position is Position => {
  return (
    position &&
    typeof position === 'object' &&
    typeof position.x === 'number' &&
    typeof position.y === 'number' &&
    !isNaN(position.x) &&
    !isNaN(position.y) &&
    position.x >= 0 &&
    position.x <= 100 &&
    position.y >= 0 &&
    position.y <= 100
  );
};

/**
 * Validates if a player object is valid
 */
export const isValidPlayer = (player: unknown): player is Player => {
  if (!player || typeof player !== 'object') {
    return false;
  }

  const hasRequiredFields =
    typeof player.id === 'string' &&
    player.id.length > 0 &&
    typeof player.name === 'string' &&
    player.name.length > 0;

  if (!hasRequiredFields) {
    return false;
  }

  // Validate optional fields if they exist
  if (player.position && !isValidPosition(player.position)) {
    return false;
  }

  if (player.team && !['home', 'away'].includes(player.team)) {
    return false;
  }

  if (
    player.overall !== undefined &&
    (typeof player.overall !== 'number' || player.overall < 0 || player.overall > 100)
  ) {
    return false;
  }

  return true;
};

/**
 * Validates if a formation slot is valid
 */
export const isValidFormationSlot = (slot: unknown): slot is FormationSlot => {
  if (!slot || typeof slot !== 'object') {
    return false;
  }

  const hasRequiredFields =
    typeof slot.id === 'string' && slot.id.length > 0 && isValidPosition(slot.position);

  if (!hasRequiredFields) {
    return false;
  }

  // Validate optional playerId if it exists
  if (slot.playerId !== undefined && slot.playerId !== null && typeof slot.playerId !== 'string') {
    return false;
  }

  return true;
};

/**
 * Validates if a formation object is valid
 */
export const isValidFormation = (formation: unknown): formation is Formation => {
  if (!formation || typeof formation !== 'object') {
    return false;
  }

  const hasRequiredFields =
    typeof formation.id === 'string' &&
    formation.id.length > 0 &&
    typeof formation.name === 'string' &&
    formation.name.length > 0 &&
    Array.isArray(formation.slots);

  if (!hasRequiredFields) {
    return false;
  }

  // Validate all slots
  const hasValidSlots = formation.slots.every((slot: unknown) => isValidFormationSlot(slot));
  if (!hasValidSlots) {
    return false;
  }

  return true;
};

/**
 * Validates if a team value is valid
 */
export const isValidTeam = (team: unknown): team is Team => {
  return team === 'home' || team === 'away';
};

/**
 * Validates formations object structure
 */
export const validateFormationsObject = (formations: unknown): boolean => {
  if (!formations || typeof formations !== 'object') {
    // // console.warn('validateFormationsObject: Invalid formations object');
    return false;
  }

  // Check if formations has valid structure
  const formationKeys = Object.keys(formations);
  if (formationKeys.length === 0) {
    // // console.warn('validateFormationsObject: No formations found');
    return false;
  }

  // Validate each formation
  for (const key of formationKeys) {
    const formation = formations[key];
    if (!isValidFormation(formation)) {
      // // console.warn(`validateFormationsObject: Invalid formation at key ${key}`, formation);
      return false;
    }
  }

  return true;
};

/**
 * Validates active formation IDs
 */
export const validateActiveFormationIds = (
  activeFormationIds: unknown,
  formations: unknown,
): boolean => {
  if (!activeFormationIds || typeof activeFormationIds !== 'object') {
    // // console.warn('validateActiveFormationIds: Invalid activeFormationIds object');
    return false;
  }

  const { home, away } = activeFormationIds;

  if (typeof home !== 'string' || typeof away !== 'string') {
    // // console.warn('validateActiveFormationIds: Invalid home or away formation ID');
    return false;
  }

  if (!formations) {
    // // console.warn('validateActiveFormationIds: No formations provided for validation');
    return false;
  }

  // Check if formations exist and are valid
  const homeFormation = formations[home];
  const awayFormation = formations[away];

  if (!isValidFormation(homeFormation)) {
    // // console.warn('validateActiveFormationIds: Invalid home formation', homeFormation);
    return false;
  }

  if (!isValidFormation(awayFormation)) {
    // // console.warn('validateActiveFormationIds: Invalid away formation', awayFormation);
    return false;
  }

  return true;
};

/**
 * Validates players array
 */
export const validatePlayersArray = (players: unknown): boolean => {
  if (!Array.isArray(players)) {
    // // console.warn('validatePlayersArray: Players is not an array');
    return false;
  }

  // Check each player
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (!isValidPlayer(player)) {
      // // console.warn(`validatePlayersArray: Invalid player at index ${i}`, player);
      return false;
    }
  }

  return true;
};

/**
 * Validates tactics state object
 */
export const validateTacticsState = (tacticsState: unknown): boolean => {
  if (!tacticsState || typeof tacticsState !== 'object') {
    // // console.warn('validateTacticsState: Invalid tactics state object');
    return false;
  }

  const { players, formations, activeFormationIds } = tacticsState;

  // Validate players
  if (players && !validatePlayersArray(players)) {
    return false;
  }

  // Validate formations
  if (formations && !validateFormationsObject(formations)) {
    return false;
  }

  // Validate active formation IDs
  if (
    activeFormationIds &&
    formations &&
    !validateActiveFormationIds(activeFormationIds, formations)
  ) {
    return false;
  }

  return true;
};

/**
 * Safe getter for player by ID
 */
export const safeGetPlayer = (players: unknown, playerId: string): Player | null => {
  if (!validatePlayersArray(players)) {
    return null;
  }

  const player = players.find((p: unknown) => p?.id === playerId);
  return isValidPlayer(player) ? player : null;
};

/**
 * Safe getter for formation by ID
 */
export const safeGetFormation = (formations: unknown, formationId: string): Formation | null => {
  if (!validateFormationsObject(formations)) {
    return null;
  }

  const formation = formations[formationId];
  return isValidFormation(formation) ? formation : null;
};

/**
 * Safe getter for formation slot by ID
 */
export const safeGetFormationSlot = (
  formation: Formation | null,
  slotId: string,
): FormationSlot | null => {
  if (!isValidFormation(formation)) {
    return null;
  }

  const slot = formation.slots.find(s => s?.id === slotId);
  return isValidFormationSlot(slot) ? slot : null;
};

/**
 * Validates drag and drop operation
 */
export const validateDragDropOperation = (
  playerId: string,
  targetSlotId?: string,
  players?: unknown,
  formations?: unknown,
  activeFormationIds?: unknown,
): { isValid: boolean; reason?: string } => {
  // Validate player ID
  if (!playerId || typeof playerId !== 'string') {
    return { isValid: false, reason: 'Invalid player ID' };
  }

  // Validate player exists
  const player = safeGetPlayer(players, playerId);
  if (!player) {
    return { isValid: false, reason: 'Player not found or invalid' };
  }

  // Check player availability
  if (player.availability && player.availability.status !== 'Available') {
    return { isValid: false, reason: `Player is ${player.availability.status}` };
  }

  // If targeting a specific slot, validate it
  if (targetSlotId) {
    if (!validateActiveFormationIds(activeFormationIds, formations)) {
      return { isValid: false, reason: 'Invalid formation configuration' };
    }

    const homeFormation = safeGetFormation(formations, activeFormationIds.home);
    const awayFormation = safeGetFormation(formations, activeFormationIds.away);

    if (!homeFormation || !awayFormation) {
      return { isValid: false, reason: 'Formation data not available' };
    }

    const targetSlot =
      safeGetFormationSlot(homeFormation, targetSlotId) ||
      safeGetFormationSlot(awayFormation, targetSlotId);

    if (!targetSlot) {
      return { isValid: false, reason: 'Target slot not found' };
    }

    // Validate position bounds
    if (!isValidPosition(targetSlot.position)) {
      return { isValid: false, reason: 'Invalid slot position' };
    }
  }

  return { isValid: true };
};

/**
 * Validates coordinate bounds for field drop
 */
export const validateFieldDropCoordinates = (x: number, y: number): boolean => {
  return (
    typeof x === 'number' &&
    typeof y === 'number' &&
    !isNaN(x) &&
    !isNaN(y) &&
    x >= 0 &&
    x <= 100 &&
    y >= 0 &&
    y <= 100
  );
};

/**
 * Creates a safe fallback for invalid data
 */
export const createSafeFallbacks = () => ({
  player: {
    id: 'unknown',
    name: 'Unknown Player',
    team: 'home' as Team,
    availability: { status: 'Available' },
    overall: 50,
  },
  position: { x: 50, y: 50 },
  formationSlot: {
    id: 'unknown',
    position: { x: 50, y: 50 },
    roleId: 'unknown',
  },
});

/**
 * Development-only validation logging
 */
export const devValidationLog = (
  component: string,
  validation: string,
  data: unknown,
  isValid: boolean,
) => {
  if (import.meta.env.DEV) {
    const status = isValid ? '✅' : '❌';
    // // console.log(`${status} [${component}] ${validation}:`, data);
  }
};
