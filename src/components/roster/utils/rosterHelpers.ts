/**
 * Roster Helper Utilities
 *
 * Utility functions for roster management, filtering, sorting, and analytics
 */

import type { Player, PlayerAttributes } from '../../../types/index';
import type {
  RosterFilters,
  RosterSort,
  FootballPosition,
  RosterAnalytics,
  PlayerComparisonStats,
  SearchSuggestion,
} from '../../../types/roster';

// ============================================================================
// FILTERING UTILITIES
// ============================================================================

/**
 * Calculate player overall rating from attributes
 */
export function calculateOverall(attributes: PlayerAttributes): number {
  const weights = {
    speed: 0.15,
    passing: 0.15,
    shooting: 0.15,
    dribbling: 0.15,
    tackling: 0.15,
    positioning: 0.15,
    stamina: 0.10,
  };

  return Math.round(
    attributes.speed * weights.speed +
      attributes.passing * weights.passing +
      attributes.shooting * weights.shooting +
      attributes.dribbling * weights.dribbling +
      attributes.tackling * weights.tackling +
      attributes.positioning * weights.positioning +
      attributes.stamina * weights.stamina,
  );
}

/**
 * Get player's primary position based on attributes
 */
export function getSuggestedPosition(attributes: PlayerAttributes): FootballPosition {
  // GK if high positioning and tackling (simplified logic)
  if (attributes.positioning > 80 && attributes.tackling > 70) {
    return 'GK';
  }

  // Defenders need high tackling
  if (attributes.tackling > 70) {
    return attributes.speed > 75 ? 'CB' : 'CDM';
  }

  // Forwards need high shooting
  if (attributes.shooting > 75) {
    return attributes.speed > 80 ? 'ST' : 'CF';
  }

  // Midfielders
  if (attributes.passing > 75) {
    return attributes.dribbling > 75 ? 'CAM' : 'CM';
  }

  // Default to CM
  return 'CM';
}

/**
 * Check if player matches search query
 */
export function matchesSearchQuery(player: Player, query: string): boolean {
  if (!query) {return true;}

  const lowerQuery = query.toLowerCase();
  const searchableFields = [
    player.name?.toLowerCase() || '',
    player.id?.toLowerCase() || '',
    player.role?.toLowerCase() || '',
  ];

  return searchableFields.some(field => field.includes(lowerQuery));
}

/**
 * Check if player matches position filter
 */
export function matchesPositionFilter(
  player: Player,
  positionFilter: RosterFilters['positions'],
): boolean {
  if (positionFilter.includeAll || positionFilter.positions.length === 0) {
    return true;
  }

  // For now, just check if player's role is in the filter
  // In a real app, you'd have a position field on Player
  return true; // Placeholder
}

/**
 * Check if value is in range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Check if player matches all active filters
 */
export function matchesFilters(player: Player, filters: RosterFilters): boolean {
  // Search query
  if (!matchesSearchQuery(player, filters.searchQuery)) {
    return false;
  }

  // Position filter
  if (!matchesPositionFilter(player, filters.positions)) {
    return false;
  }

  const overall = calculateOverall(player.attributes);

  // Overall filter
  if (filters.overall.enabled && !isInRange(overall, filters.overall.min, filters.overall.max)) {
    return false;
  }

  // Pace filter
  if (
    filters.pace.enabled &&
    !isInRange(player.attributes.speed, filters.pace.min, filters.pace.max)
  ) {
    return false;
  }

  // Stamina filter
  if (
    filters.stamina.enabled &&
    !isInRange(player.attributes.stamina, filters.stamina.min, filters.stamina.max)
  ) {
    return false;
  }

  // Morale filter (if exists)
  const moraleValue = getMoraleValue(player.morale);
  if (filters.morale.enabled && !isInRange(moraleValue, filters.morale.min, filters.morale.max)) {
    return false;
  }

  // Fitness filter (if exists)
  const fitnessValue = player.fitness || 100;
  if (
    filters.fitness.enabled &&
    !isInRange(fitnessValue, filters.fitness.min, filters.fitness.max)
  ) {
    return false;
  }

  // Age filter
  const age = player.age || 25;
  if (filters.age.enabled && !isInRange(age, filters.age.min, filters.age.max)) {
    return false;
  }

  // Status filter
  const status = player.availability?.status || 'Available';
  if (!filters.status.available && status === 'Available') {return false;}
  if (!filters.status.injured && (status === 'Minor Injury' || status === 'Major Injury'))
    {return false;}
  if (!filters.status.suspended && status === 'Suspended') {return false;}
  if (!filters.status.tired && fitnessValue < 70) {return false;}

  return true;
}

/**
 * Convert morale to numeric value
 */
export function getMoraleValue(
  morale: 'Excellent' | 'Good' | 'Okay' | 'Poor' | 'Very Poor' | 'Terrible' | undefined,
): number {
  const moraleMap = {
    Excellent: 100,
    Good: 80,
    Okay: 60,
    Poor: 40,
    'Very Poor': 20,
    Terrible: 0,
  };
  return moraleMap[morale || 'Okay'];
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

/**
 * Get sortable value from player for a given field
 */
export function getSortValue(player: Player, field: RosterSort['field']): number | string {
  switch (field) {
    case 'name':
      return player.name || '';
    case 'position':
      return player.role || '';
    case 'overall':
      return calculateOverall(player.attributes);
    case 'pace':
      return player.attributes.speed;
    case 'shooting':
      return player.attributes.shooting;
    case 'passing':
      return player.attributes.passing;
    case 'dribbling':
      return player.attributes.dribbling;
    case 'defending':
      return player.attributes.tackling;
    case 'physical':
      return player.attributes.stamina;
    case 'stamina':
      return player.attributes.stamina;
    case 'morale':
      return getMoraleValue(player.morale);
    case 'fitness':
      return player.fitness || 100;
    case 'age':
      return player.age || 25;
    default:
      return 0;
  }
}

/**
 * Sort players by given criteria
 */
export function sortPlayers(players: Player[], sort: RosterSort): Player[] {
  return [...players].sort((a, b) => {
    const aValue = getSortValue(a, sort.field);
    const bValue = getSortValue(b, sort.field);

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sort.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    const aNum = typeof aValue === 'number' ? aValue : 0;
    const bNum = typeof bValue === 'number' ? bValue : 0;

    return sort.direction === 'asc' ? aNum - bNum : bNum - aNum;
  });
}

// ============================================================================
// ANALYTICS UTILITIES
// ============================================================================

/**
 * Calculate roster analytics
 */
export function calculateRosterAnalytics(players: Player[]): RosterAnalytics {
  if (players.length === 0) {
    return {
      totalPlayers: 0,
      availablePlayers: 0,
      injuredPlayers: 0,
      suspendedPlayers: 0,
      tiredPlayers: 0,
      averageOverall: 0,
      averageAge: 0,
      averageMorale: 0,
      averageFitness: 0,
      positionDistribution: {},
      topPlayers: [],
    };
  }

  const availablePlayers = players.filter(p => p.availability?.status === 'Available').length;
  const injuredPlayers = players.filter(
    p => p.availability?.status === 'Minor Injury' || p.availability?.status === 'Major Injury',
  ).length;
  const suspendedPlayers = players.filter(p => p.availability?.status === 'Suspended').length;
  const tiredPlayers = players.filter(p => (p.fitness || 100) < 70).length;

  const totalOverall = players.reduce((sum, p) => sum + calculateOverall(p.attributes), 0);
  const totalAge = players.reduce((sum, p) => sum + (p.age || 25), 0);
  const totalMorale = players.reduce((sum, p) => sum + getMoraleValue(p.morale), 0);
  const totalFitness = players.reduce((sum, p) => sum + (p.fitness || 100), 0);

  // Get top 10 players by overall rating
  const topPlayers = sortPlayers(players, { field: 'overall', direction: 'desc' }).slice(0, 10);

  return {
    totalPlayers: players.length,
    availablePlayers,
    injuredPlayers,
    suspendedPlayers,
    tiredPlayers,
    averageOverall: Math.round(totalOverall / players.length),
    averageAge: Math.round(totalAge / players.length),
    averageMorale: Math.round(totalMorale / players.length),
    averageFitness: Math.round(totalFitness / players.length),
    positionDistribution: {}, // Would calculate based on actual positions
    topPlayers,
  };
}

/**
 * Calculate comparison statistics for a player
 */
export function calculateComparisonStats(player: Player): PlayerComparisonStats {
  const overall = calculateOverall(player.attributes);
  const attributes = player.attributes;

  // Identify strengths (attributes > 75)
  const strengths: string[] = [];
  if (attributes.speed > 75) {strengths.push('Speed');}
  if (attributes.shooting > 75) {strengths.push('Shooting');}
  if (attributes.passing > 75) {strengths.push('Passing');}
  if (attributes.dribbling > 75) {strengths.push('Dribbling');}
  if (attributes.tackling > 75) {strengths.push('Defending');}
  if (attributes.positioning > 75) {strengths.push('Positioning');}
  if (attributes.stamina > 75) {strengths.push('Stamina');}

  // Identify weaknesses (attributes < 60)
  const weaknesses: string[] = [];
  if (attributes.speed < 60) {weaknesses.push('Speed');}
  if (attributes.shooting < 60) {weaknesses.push('Shooting');}
  if (attributes.passing < 60) {weaknesses.push('Passing');}
  if (attributes.dribbling < 60) {weaknesses.push('Dribbling');}
  if (attributes.tackling < 60) {weaknesses.push('Defending');}
  if (attributes.positioning < 60) {weaknesses.push('Positioning');}
  if (attributes.stamina < 60) {weaknesses.push('Stamina');}

  return {
    player,
    attributes,
    overall,
    strengths,
    weaknesses,
    suggestedPosition: getSuggestedPosition(attributes),
  };
}

// ============================================================================
// SEARCH UTILITIES
// ============================================================================

/**
 * Generate search suggestions based on query
 */
export function generateSearchSuggestions(
  query: string,
  players: Player[],
  history: string[],
): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];
  const lowerQuery = query.toLowerCase();

  // Add history suggestions
  history
    .filter(h => h.toLowerCase().includes(lowerQuery))
    .slice(0, 3)
    .forEach(historyItem => {
      suggestions.push({
        type: 'player',
        text: historyItem,
        description: 'Recent search',
        icon: 'History',
      });
    });

  // Add player name suggestions
  players
    .filter(p => p.name?.toLowerCase().includes(lowerQuery))
    .slice(0, 5)
    .forEach(player => {
      suggestions.push({
        type: 'player',
        text: player.name || '',
        description: `${player.positionRole || player.roleId || 'Player'} - Overall ${calculateOverall(player.attributes)}`,
        icon: 'User',
      });
    });

  return suggestions;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Export players to CSV format
 */
export function exportPlayersToCSV(players: Player[]): string {
  const headers = [
    'Name',
    'Age',
    'Overall',
    'Pace',
    'Shooting',
    'Passing',
    'Dribbling',
    'Defending',
    'Physical',
    'Morale',
    'Fitness',
    'Status',
  ];

  const rows = players.map(player => [
    player.name || '',
    player.age || '',
    calculateOverall(player.attributes),
    player.attributes.speed,
    player.attributes.shooting,
    player.attributes.passing,
    player.attributes.dribbling,
    player.attributes.tackling,
    player.attributes.stamina,
    player.morale || '',
    player.stamina || 100,
    player.availability?.status || 'Available',
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Export players to JSON format
 */
export function exportPlayersToJSON(players: Player[]): string {
  return JSON.stringify(
    players.map(player => ({
      id: player.id,
      name: player.name,
      age: player.age,
      overall: calculateOverall(player.attributes),
      attributes: player.attributes,
      morale: player.morale,
      fitness: player.stamina,
      status: player.availability?.status,
    })),
    null,
    2,
  );
}

// ============================================================================
// GRID UTILITIES
// ============================================================================

/**
 * Calculate optimal grid columns based on container width
 */
export function calculateGridColumns(containerWidth: number, _minCardWidth: number = 200): number {
  if (containerWidth < 480) {return 1;}
  if (containerWidth < 768) {return 2;}
  if (containerWidth < 1024) {return 3;}
  if (containerWidth < 1280) {return 4;}
  if (containerWidth < 1536) {return 5;}
  return 6;
}

/**
 * Get grid item dimensions based on columns and aspect ratio
 */
export function getGridItemDimensions(
  containerWidth: number,
  columns: number,
  gap: number = 16,
  aspectRatio: number = 0.7,
): { width: number; height: number } {
  const totalGap = gap * (columns - 1);
  const width = (containerWidth - totalGap) / columns;
  const height = width / aspectRatio;

  return { width, height };
}
