/**
 * Unit Tests for Roster Helper Functions
 *
 * Tests roster utilities for filtering, sorting, and analytics
 */

import { describe, it, expect } from 'vitest';
import {
  calculateOverall,
  getSuggestedPosition,
  matchesSearchQuery,
} from '../../components/roster/utils/rosterHelpers';
import type { Player, PlayerAttributes } from '../../types';

// Mock player data
const mockPlayer: Player = {
  id: 'player-1',
  name: 'John Doe',
  roleId: 'ST',
  positionRole: 'ST',
  jerseyNumber: 10,
  age: 25,
  nationality: 'England',
  morale: 'Excellent',
  form: 'Good',
  stamina: 90,
  potential: [75, 85] as const,
  currentPotential: 82,
  team: 'home',
  teamColor: '#00f5ff',
  position: { x: 50, y: 50 },
  availability: { status: 'Available' },
  attributes: {
    speed: 85,
    shooting: 88,
    passing: 75,
    dribbling: 82,
    tackling: 45,
    positioning: 80,
    stamina: 90,
  },
  instructions: {},
  developmentLog: [],
  contract: { clauses: [] },
  stats: {
    goals: 0,
    assists: 0,
    matchesPlayed: 0,
    shotsOnTarget: 0,
    tacklesWon: 0,
    saves: 0,
    passesCompleted: 0,
    passesAttempted: 0,
    careerHistory: [],
  },
  loan: { isLoaned: false },
  traits: [],
  conversationHistory: [],
  attributeHistory: [],
  attributeDevelopmentProgress: {},
  communicationLog: [],
  customTrainingSchedule: null,
  fatigue: 0,
  injuryRisk: 10,
  lastConversationInitiatedWeek: 0,
  moraleBoost: null,
  completedChallenges: [],
};

describe('calculateOverall', () => {
  it('should calculate overall rating correctly', () => {
    const overall = calculateOverall(mockPlayer.attributes);
    expect(overall).toBeGreaterThan(0);
    expect(overall).toBeLessThanOrEqual(100);
    expect(typeof overall).toBe('number');
  });

  it('should handle all attributes being 0', () => {
    const overall = calculateOverall({
      speed: 0,
      shooting: 0,
      passing: 0,
      dribbling: 0,
      tackling: 0,
      positioning: 0,
      stamina: 0,
    });
    expect(overall).toBe(0);
  });

  it('should handle all attributes being 100', () => {
    const overall = calculateOverall({
      speed: 100,
      shooting: 100,
      passing: 100,
      dribbling: 100,
      tackling: 100,
      positioning: 100,
      stamina: 100,
    });
    expect(overall).toBe(100);
  });
});

describe('getSuggestedPosition', () => {
  it('should suggest striker for high shooting and speed', () => {
    const position = getSuggestedPosition({
      speed: 90,
      shooting: 92,
      passing: 70,
      dribbling: 75,
      tackling: 40,
      positioning: 85,
      stamina: 80,
    });
    expect(['ST', 'CF', 'FW']).toContain(position);
  });

  it('should suggest defender for high tackling', () => {
    const position = getSuggestedPosition({
      speed: 70,
      shooting: 45,
      passing: 65,
      dribbling: 60,
      tackling: 88,
      positioning: 82,
      stamina: 80,
    });
    expect(['CB', 'CDM', 'DF']).toContain(position);
  });

  it('should suggest midfielder for balanced attributes', () => {
    const position = getSuggestedPosition({
      speed: 75,
      shooting: 70,
      passing: 85,
      dribbling: 78,
      tackling: 72,
      positioning: 75,
      stamina: 85,
    });
    expect(['CM', 'CAM', 'CDM', 'MF']).toContain(position);
  });
});

describe('matchesSearchQuery', () => {
  it('should match player name', () => {
    expect(matchesSearchQuery(mockPlayer, 'John')).toBe(true);
    expect(matchesSearchQuery(mockPlayer, 'Doe')).toBe(true);
    expect(matchesSearchQuery(mockPlayer, 'john doe')).toBe(true);
  });

  it('should match player ID', () => {
    expect(matchesSearchQuery(mockPlayer, 'player-1')).toBe(true);
  });

  it('should match player position', () => {
    expect(matchesSearchQuery(mockPlayer, 'ST')).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(matchesSearchQuery(mockPlayer, 'JOHN')).toBe(true);
    expect(matchesSearchQuery(mockPlayer, 'st')).toBe(true);
  });

  it('should return false for non-matching query', () => {
    expect(matchesSearchQuery(mockPlayer, 'xyz')).toBe(false);
  });

  it('should return true for empty query', () => {
    expect(matchesSearchQuery(mockPlayer, '')).toBe(true);
  });
});

describe('getMoraleValue', () => {
  it('should convert morale to numeric value', () => {
    expect(getMoraleValue('Excellent')).toBe(100);
    expect(getMoraleValue('Good')).toBe(80);
    expect(getMoraleValue('Okay')).toBe(60);
    expect(getMoraleValue('Poor')).toBe(40);
    expect(getMoraleValue('Very Poor')).toBe(20);
    expect(getMoraleValue('Terrible')).toBe(0);
  });

  it('should handle unknown morale values', () => {
    expect(getMoraleValue('Unknown' as any)).toBe(50);
  });
});

describe('matchesFilters', () => {
  const filters: RosterFilters = {
    searchQuery: '',
    positions: { positions: [], includeAll: true },
    overall: { min: 0, max: 100, enabled: false },
    pace: { min: 0, max: 100, enabled: false },
    stamina: { min: 0, max: 100, enabled: false },
    morale: { min: 0, max: 100, enabled: false },
    fitness: { min: 0, max: 100, enabled: false },
    age: { min: 16, max: 40, enabled: false },
    status: {
      available: true,
      injured: true,
      suspended: true,
      tired: true,
    },
  };

  it('should match player with no filters', () => {
    expect(matchesFilters(mockPlayer, filters)).toBe(true);
  });

  it('should filter by search query', () => {
    const searchFilters = { ...filters, searchQuery: 'John' };
    expect(matchesFilters(mockPlayer, searchFilters)).toBe(true);

    const noMatchFilters = { ...filters, searchQuery: 'xyz' };
    expect(matchesFilters(mockPlayer, noMatchFilters)).toBe(false);
  });

  it('should filter by overall rating range', () => {
    const overall = calculateOverall(mockPlayer.attributes);
    const matchFilters = { ...filters, overall: { min: overall - 10, max: overall + 10, enabled: true } };
    expect(matchesFilters(mockPlayer, matchFilters)).toBe(true);

    const noMatchFilters = { ...filters, overall: { min: 95, max: 100, enabled: true } };
    expect(matchesFilters(mockPlayer, noMatchFilters)).toBe(false);
  });

  it('should filter by age range', () => {
    const matchFilters = { ...filters, age: { min: 20, max: 30, enabled: true } };
    expect(matchesFilters(mockPlayer, matchFilters)).toBe(true);

    const noMatchFilters = { ...filters, age: { min: 30, max: 40, enabled: true } };
    expect(matchesFilters(mockPlayer, noMatchFilters)).toBe(false);
  });

  it('should filter by stamina', () => {
    const matchFilters = { ...filters, stamina: { min: 80, max: 100, enabled: true } };
    expect(matchesFilters(mockPlayer, matchFilters)).toBe(true);

    const noMatchFilters = { ...filters, stamina: { min: 95, max: 100, enabled: true } };
    expect(matchesFilters(mockPlayer, noMatchFilters)).toBe(false);
  });
});

describe('getSortValue', () => {
  it('should get name value', () => {
    expect(getSortValue(mockPlayer, 'name')).toBe('John Doe');
  });

  it('should get position value', () => {
    expect(getSortValue(mockPlayer, 'position')).toBe('ST');
  });

  it('should get overall value', () => {
    const overall = getSortValue(mockPlayer, 'overall');
    expect(typeof overall).toBe('number');
    expect(overall).toBeGreaterThan(0);
  });

  it('should get attribute values', () => {
    expect(getSortValue(mockPlayer, 'pace')).toBeGreaterThan(0);
    expect(getSortValue(mockPlayer, 'shooting')).toBe(88);
    expect(getSortValue(mockPlayer, 'passing')).toBe(75);
  });

  it('should get age value', () => {
    expect(getSortValue(mockPlayer, 'age')).toBe(25);
  });

  it('should get morale numeric value', () => {
    expect(getSortValue(mockPlayer, 'morale')).toBe(100);
  });

  it('should get stamina value', () => {
    expect(getSortValue(mockPlayer, 'stamina')).toBe(90);
  });
});

describe('sortPlayers', () => {
  const players: Player[] = [
    { ...mockPlayer, id: 'p1', name: 'Alice', age: 20, attributes: { ...mockPlayer.attributes, speed: 90 } },
    { ...mockPlayer, id: 'p2', name: 'Bob', age: 30, attributes: { ...mockPlayer.attributes, speed: 70 } },
    { ...mockPlayer, id: 'p3', name: 'Charlie', age: 25, attributes: { ...mockPlayer.attributes, speed: 85 } },
  ];

  it('should sort by name ascending', () => {
    const sort: RosterSort = { field: 'name', direction: 'asc' };
    const sorted = sortPlayers(players, sort);
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[1].name).toBe('Bob');
    expect(sorted[2].name).toBe('Charlie');
  });

  it('should sort by name descending', () => {
    const sort: RosterSort = { field: 'name', direction: 'desc' };
    const sorted = sortPlayers(players, sort);
    expect(sorted[0].name).toBe('Charlie');
    expect(sorted[1].name).toBe('Bob');
    expect(sorted[2].name).toBe('Alice');
  });

  it('should sort by age ascending', () => {
    const sort: RosterSort = { field: 'age', direction: 'asc' };
    const sorted = sortPlayers(players, sort);
    expect(sorted[0].age).toBe(20);
    expect(sorted[1].age).toBe(25);
    expect(sorted[2].age).toBe(30);
  });

  it('should sort by pace descending', () => {
    const sort: RosterSort = { field: 'pace', direction: 'desc' };
    const sorted = sortPlayers(players, sort);
    expect(sorted[0].attributes.speed).toBe(90);
    expect(sorted[1].attributes.speed).toBe(85);
    expect(sorted[2].attributes.speed).toBe(70);
  });
});

describe('calculateRosterAnalytics', () => {
  const players: Player[] = [
    { ...mockPlayer, id: 'p1', age: 20, morale: 'Excellent', stamina: 90 },
    { ...mockPlayer, id: 'p2', age: 30, morale: 'Good', stamina: 70, availability: { status: 'Minor Injury' } },
    { ...mockPlayer, id: 'p3', age: 25, morale: 'Poor', stamina: 50 },
  ];

  it('should calculate total players', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.totalPlayers).toBe(3);
  });

  it('should calculate available players', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.availablePlayers).toBeGreaterThan(0);
  });

  it('should calculate injured players', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.injuredPlayers).toBeGreaterThan(0);
  });

  it('should calculate average age', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.averageAge).toBe(25); // (20 + 30 + 25) / 3
  });

  it('should calculate average morale', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.averageMorale).toBeGreaterThan(0);
    expect(analytics.averageMorale).toBeLessThanOrEqual(100);
  });

  it('should calculate position distribution', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.positionDistribution).toBeDefined();
    expect(analytics.positionDistribution.ST).toBe(3);
  });

  it('should identify top players', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.topPlayers).toBeDefined();
    expect(analytics.topPlayers.length).toBeGreaterThan(0);
  });
});

describe('calculateComparisonStats', () => {
  it('should calculate comparison stats for player', () => {
    const stats = calculateComparisonStats(mockPlayer);
    
    expect(stats.overall).toBeGreaterThan(0);
    expect(stats.strengths).toBeDefined();
    expect(stats.weaknesses).toBeDefined();
    expect(Array.isArray(stats.strengths)).toBe(true);
    expect(Array.isArray(stats.weaknesses)).toBe(true);
  });

  it('should identify strengths correctly', () => {
    const player = {
      ...mockPlayer,
      attributes: {
        speed: 95,
        shooting: 92,
        passing: 60,
        dribbling: 85,
        tackling: 40,
        positioning: 80,
        stamina: 85,
      },
    };
    
    const stats = calculateComparisonStats(player);
    expect(stats.strengths.length).toBeGreaterThan(0);
  });

  it('should identify weaknesses correctly', () => {
    const player = {
      ...mockPlayer,
      attributes: {
        speed: 85,
        shooting: 88,
        passing: 45,
        dribbling: 82,
        tackling: 30,
        positioning: 80,
        stamina: 75,
      },
    };
    
    const stats = calculateComparisonStats(player);
    expect(stats.weaknesses.length).toBeGreaterThan(0);
  });
});

describe('generateSearchSuggestions', () => {
  const players: Player[] = [
    { ...mockPlayer, id: 'p1', name: 'John Doe' },
    { ...mockPlayer, id: 'p2', name: 'Jane Smith' },
    { ...mockPlayer, id: 'p3', name: 'Bob Johnson' },
  ];

  const history = ['previous search', 'another search'];

  it('should return history items for empty query', () => {
    const suggestions = generateSearchSuggestions('', players, history);
    expect(suggestions.some(s => s.type === 'history')).toBe(true);
  });

  it('should return player suggestions for non-empty query', () => {
    const suggestions = generateSearchSuggestions('John', players, history);
    expect(suggestions.some(s => s.type === 'player')).toBe(true);
  });

  it('should limit suggestions to reasonable number', () => {
    const suggestions = generateSearchSuggestions('', players, history);
    expect(suggestions.length).toBeLessThanOrEqual(10);
  });

  it('should match player names', () => {
    const suggestions = generateSearchSuggestions('Jane', players, history);
    const playerSuggestions = suggestions.filter(s => s.type === 'player');
    expect(playerSuggestions.some(s => s.value.includes('Jane'))).toBe(true);
  });
});

describe('exportPlayersToCSV', () => {
  const players: Player[] = [
    { ...mockPlayer, id: 'p1', name: 'John Doe', age: 25 },
    { ...mockPlayer, id: 'p2', name: 'Jane Smith', age: 28 },
  ];

  it('should export players to CSV format', () => {
    const csv = exportPlayersToCSV(players);
    expect(csv).toContain('Name');
    expect(csv).toContain('Position');
    expect(csv).toContain('John Doe');
    expect(csv).toContain('Jane Smith');
  });

  it('should include all attributes in CSV', () => {
    const csv = exportPlayersToCSV(players);
    expect(csv).toContain('SPD'); // Speed
    expect(csv).toContain('SHO'); // Shooting
    expect(csv).toContain('PAS'); // Passing
    expect(csv).toContain('DRI'); // Dribbling
  });

  it('should handle empty player array', () => {
    const csv = exportPlayersToCSV([]);
    expect(csv).toContain('Name'); // Headers should still be present
  });
});

describe('exportPlayersToJSON', () => {
  const players: Player[] = [
    { ...mockPlayer, id: 'p1', name: 'John Doe' },
  ];

  it('should export players to JSON format', () => {
    const json = exportPlayersToJSON(players);
    expect(json).toBeDefined();
    expect(typeof json).toBe('string');
    
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
  });

  it('should include all player properties', () => {
    const json = exportPlayersToJSON(players);
    const parsed = JSON.parse(json);
    
    expect(parsed[0]).toHaveProperty('name');
    expect(parsed[0]).toHaveProperty('roleId');
    expect(parsed[0]).toHaveProperty('attributes');
  });

  it('should handle empty player array', () => {
    const json = exportPlayersToJSON([]);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual([]);
  });
});

describe('calculateGridColumns', () => {
  it('should return 2 columns for small screens', () => {
    expect(calculateGridColumns(500)).toBe(2);
  });

  it('should return 3 columns for medium screens', () => {
    expect(calculateGridColumns(800)).toBe(3);
  });

  it('should return 4 columns for large screens', () => {
    expect(calculateGridColumns(1100)).toBe(4);
  });

  it('should return 5 columns for extra large screens', () => {
    expect(calculateGridColumns(1400)).toBe(5);
  });

  it('should return 6 columns for very large screens', () => {
    expect(calculateGridColumns(1700)).toBe(6);
  });

  it('should handle edge cases', () => {
    expect(calculateGridColumns(0)).toBeGreaterThan(0);
    expect(calculateGridColumns(10000)).toBeGreaterThan(0);
  });
});

describe('getGridItemDimensions', () => {
  it('should calculate item dimensions correctly', () => {
    const dimensions = getGridItemDimensions(1200, 4);
    
    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
    expect(typeof dimensions.width).toBe('number');
    expect(typeof dimensions.height).toBe('number');
  });

  it('should account for gap in calculations', () => {
    const dimensions = getGridItemDimensions(1200, 4);
    expect(dimensions.width).toBeLessThan(300); // Should be less than 1200/4
  });

  it('should handle single column', () => {
    const dimensions = getGridItemDimensions(400, 1);
    expect(dimensions.width).toBeGreaterThan(0);
  });

  it('should handle many columns', () => {
    const dimensions = getGridItemDimensions(2000, 6);
    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.width).toBeLessThan(2000 / 6);
  });
});


describe('calculateOverall', () => {
  it('should calculate overall rating correctly', () => {
    const overall = calculateOverall(mockPlayer.attributes);
    expect(overall).toBeGreaterThan(0);
    expect(overall).toBeLessThanOrEqual(100);
    expect(typeof overall).toBe('number');
  });

  it('should handle all attributes being 0', () => {
    const overall = calculateOverall({
      pace: 0,
      shooting: 0,
      passing: 0,
      dribbling: 0,
      tackling: 0,
      positioning: 0,
    });
    expect(overall).toBe(0);
  });

  it('should handle all attributes being 100', () => {
    const overall = calculateOverall({
      pace: 100,
      shooting: 100,
      passing: 100,
      dribbling: 100,
      tackling: 100,
      positioning: 100,
    });
    expect(overall).toBe(100);
  });
});

describe('getSuggestedPosition', () => {
  it('should suggest striker for high shooting and pace', () => {
    const position = getSuggestedPosition({
      pace: 90,
      shooting: 92,
      passing: 70,
      dribbling: 75,
      tackling: 40,
      positioning: 85,
    });
    expect(['ST', 'CF']).toContain(position);
  });

  it('should suggest defender for high tackling', () => {
    const position = getSuggestedPosition({
      pace: 70,
      shooting: 45,
      passing: 65,
      dribbling: 60,
      tackling: 88,
      positioning: 82,
    });
    expect(['CB', 'CDM']).toContain(position);
  });

  it('should suggest midfielder for balanced attributes', () => {
    const position = getSuggestedPosition({
      pace: 75,
      shooting: 70,
      passing: 85,
      dribbling: 78,
      tackling: 72,
      positioning: 75,
    });
    expect(['CM', 'CAM', 'CDM']).toContain(position);
  });
});

describe('matchesSearchQuery', () => {
  it('should match player name', () => {
    expect(matchesSearchQuery(mockPlayer, 'John')).toBe(true);
    expect(matchesSearchQuery(mockPlayer, 'Doe')).toBe(true);
    expect(matchesSearchQuery(mockPlayer, 'john doe')).toBe(true);
  });

  it('should match player ID', () => {
    expect(matchesSearchQuery(mockPlayer, 'player-1')).toBe(true);
  });

  it('should match player position', () => {
    expect(matchesSearchQuery(mockPlayer, 'ST')).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(matchesSearchQuery(mockPlayer, 'JOHN')).toBe(true);
    expect(matchesSearchQuery(mockPlayer, 'st')).toBe(true);
  });

  it('should return false for non-matching query', () => {
    expect(matchesSearchQuery(mockPlayer, 'xyz')).toBe(false);
  });

  it('should return true for empty query', () => {
    expect(matchesSearchQuery(mockPlayer, '')).toBe(true);
  });
});

describe('getMoraleValue', () => {
  it('should convert morale to numeric value', () => {
    expect(getMoraleValue('Excellent')).toBe(100);
    expect(getMoraleValue('Good')).toBe(80);
    expect(getMoraleValue('Okay')).toBe(60);
    expect(getMoraleValue('Poor')).toBe(40);
    expect(getMoraleValue('Very Poor')).toBe(20);
    expect(getMoraleValue('Terrible')).toBe(0);
  });

  it('should handle unknown morale values', () => {
    expect(getMoraleValue('Unknown' as any)).toBe(50);
  });
});

describe('matchesFilters', () => {
  const filters: RosterFilters = {
    searchQuery: '',
    positions: [],
    overall: { min: 0, max: 100 },
    pace: { min: 0, max: 100 },
    stamina: { min: 0, max: 100 },
    morale: { min: 0, max: 100 },
    fitness: { min: 0, max: 100 },
    age: { min: 16, max: 40 },
    status: {
      available: true,
      injured: true,
      suspended: true,
      tired: true,
    },
  };

  it('should match player with no filters', () => {
    expect(matchesFilters(mockPlayer, filters)).toBe(true);
  });

  it('should filter by search query', () => {
    const searchFilters = { ...filters, searchQuery: 'John' };
    expect(matchesFilters(mockPlayer, searchFilters)).toBe(true);

    const noMatchFilters = { ...filters, searchQuery: 'xyz' };
    expect(matchesFilters(mockPlayer, noMatchFilters)).toBe(false);
  });

  it('should filter by overall rating range', () => {
    const overall = calculateOverall(mockPlayer.attributes);
    const matchFilters = { ...filters, overall: { min: overall - 10, max: overall + 10 } };
    expect(matchesFilters(mockPlayer, matchFilters)).toBe(true);

    const noMatchFilters = { ...filters, overall: { min: 95, max: 100 } };
    expect(matchesFilters(mockPlayer, noMatchFilters)).toBe(false);
  });

  it('should filter by age range', () => {
    const matchFilters = { ...filters, age: { min: 20, max: 30 } };
    expect(matchesFilters(mockPlayer, matchFilters)).toBe(true);

    const noMatchFilters = { ...filters, age: { min: 30, max: 40 } };
    expect(matchesFilters(mockPlayer, noMatchFilters)).toBe(false);
  });

  it('should filter by stamina', () => {
    const matchFilters = { ...filters, stamina: { min: 80, max: 100 } };
    expect(matchesFilters(mockPlayer, matchFilters)).toBe(true);

    const noMatchFilters = { ...filters, stamina: { min: 95, max: 100 } };
    expect(matchesFilters(mockPlayer, noMatchFilters)).toBe(false);
  });
});

describe('getSortValue', () => {
  it('should get name value', () => {
    expect(getSortValue(mockPlayer, 'name')).toBe('John Doe');
  });

  it('should get position value', () => {
    expect(getSortValue(mockPlayer, 'position')).toBe('ST');
  });

  it('should get overall value', () => {
    const overall = getSortValue(mockPlayer, 'overall');
    expect(typeof overall).toBe('number');
    expect(overall).toBeGreaterThan(0);
  });

  it('should get attribute values', () => {
    expect(getSortValue(mockPlayer, 'pace')).toBe(85);
    expect(getSortValue(mockPlayer, 'shooting')).toBe(88);
    expect(getSortValue(mockPlayer, 'passing')).toBe(75);
  });

  it('should get age value', () => {
    expect(getSortValue(mockPlayer, 'age')).toBe(25);
  });

  it('should get morale numeric value', () => {
    expect(getSortValue(mockPlayer, 'morale')).toBe(100);
  });

  it('should get stamina value', () => {
    expect(getSortValue(mockPlayer, 'stamina')).toBe(90);
  });
});

describe('sortPlayers', () => {
  const players: Player[] = [
    { ...mockPlayer, id: 'p1', name: 'Alice', age: 20, attributes: { ...mockPlayer.attributes, pace: 90 } },
    { ...mockPlayer, id: 'p2', name: 'Bob', age: 30, attributes: { ...mockPlayer.attributes, pace: 70 } },
    { ...mockPlayer, id: 'p3', name: 'Charlie', age: 25, attributes: { ...mockPlayer.attributes, pace: 85 } },
  ];

  it('should sort by name ascending', () => {
    const sort: RosterSort = { field: 'name', direction: 'asc' };
    const sorted = sortPlayers(players, sort);
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[1].name).toBe('Bob');
    expect(sorted[2].name).toBe('Charlie');
  });

  it('should sort by name descending', () => {
    const sort: RosterSort = { field: 'name', direction: 'desc' };
    const sorted = sortPlayers(players, sort);
    expect(sorted[0].name).toBe('Charlie');
    expect(sorted[1].name).toBe('Bob');
    expect(sorted[2].name).toBe('Alice');
  });

  it('should sort by age ascending', () => {
    const sort: RosterSort = { field: 'age', direction: 'asc' };
    const sorted = sortPlayers(players, sort);
    expect(sorted[0].age).toBe(20);
    expect(sorted[1].age).toBe(25);
    expect(sorted[2].age).toBe(30);
  });

  it('should sort by pace descending', () => {
    const sort: RosterSort = { field: 'pace', direction: 'desc' };
    const sorted = sortPlayers(players, sort);
    expect(sorted[0].attributes.pace).toBe(90);
    expect(sorted[1].attributes.pace).toBe(85);
    expect(sorted[2].attributes.pace).toBe(70);
  });
});

describe('calculateRosterAnalytics', () => {
  const players: Player[] = [
    { ...mockPlayer, id: 'p1', age: 20, morale: 'Excellent', stamina: 90 },
    { ...mockPlayer, id: 'p2', age: 30, morale: 'Good', stamina: 70, injuryStatus: 'Injured' },
    { ...mockPlayer, id: 'p3', age: 25, morale: 'Poor', stamina: 50 },
  ];

  it('should calculate total players', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.totalPlayers).toBe(3);
  });

  it('should calculate available players', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.availablePlayers).toBe(2);
  });

  it('should calculate injured players', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.injuredPlayers).toBe(1);
  });

  it('should calculate average age', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.averageAge).toBe(25); // (20 + 30 + 25) / 3
  });

  it('should calculate average morale', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.averageMorale).toBeGreaterThan(0);
    expect(analytics.averageMorale).toBeLessThanOrEqual(100);
  });

  it('should calculate position distribution', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.positionDistribution).toBeDefined();
    expect(analytics.positionDistribution.ST).toBe(3);
  });

  it('should identify top players', () => {
    const analytics = calculateRosterAnalytics(players);
    expect(analytics.topPlayers).toBeDefined();
    expect(analytics.topPlayers.length).toBeGreaterThan(0);
  });
});

describe('calculateComparisonStats', () => {
  it('should calculate comparison stats for player', () => {
    const stats = calculateComparisonStats(mockPlayer);
    
    expect(stats.overall).toBeGreaterThan(0);
    expect(stats.strengths).toBeDefined();
    expect(stats.weaknesses).toBeDefined();
    expect(Array.isArray(stats.strengths)).toBe(true);
    expect(Array.isArray(stats.weaknesses)).toBe(true);
  });

  it('should identify strengths correctly', () => {
    const player = {
      ...mockPlayer,
      attributes: {
        pace: 95,
        shooting: 92,
        passing: 60,
        dribbling: 85,
        tackling: 40,
        positioning: 80,
      },
    };
    
    const stats = calculateComparisonStats(player);
    expect(stats.strengths.length).toBeGreaterThan(0);
    expect(stats.strengths).toContain('pace');
    expect(stats.strengths).toContain('shooting');
  });

  it('should identify weaknesses correctly', () => {
    const player = {
      ...mockPlayer,
      attributes: {
        pace: 85,
        shooting: 88,
        passing: 45,
        dribbling: 82,
        tackling: 30,
        positioning: 80,
      },
    };
    
    const stats = calculateComparisonStats(player);
    expect(stats.weaknesses.length).toBeGreaterThan(0);
    expect(stats.weaknesses).toContain('tackling');
  });
});

describe('generateSearchSuggestions', () => {
  const players: Player[] = [
    { ...mockPlayer, id: 'p1', name: 'John Doe' },
    { ...mockPlayer, id: 'p2', name: 'Jane Smith' },
    { ...mockPlayer, id: 'p3', name: 'Bob Johnson' },
  ];

  const history = ['previous search', 'another search'];

  it('should return history items for empty query', () => {
    const suggestions = generateSearchSuggestions('', players, history);
    expect(suggestions.some(s => s.type === 'history')).toBe(true);
  });

  it('should return player suggestions for non-empty query', () => {
    const suggestions = generateSearchSuggestions('John', players, history);
    expect(suggestions.some(s => s.type === 'player')).toBe(true);
  });

  it('should limit suggestions to reasonable number', () => {
    const suggestions = generateSearchSuggestions('', players, history);
    expect(suggestions.length).toBeLessThanOrEqual(10);
  });

  it('should match player names', () => {
    const suggestions = generateSearchSuggestions('Jane', players, history);
    const playerSuggestions = suggestions.filter(s => s.type === 'player');
    expect(playerSuggestions.some(s => s.value.includes('Jane'))).toBe(true);
  });
});

describe('exportPlayersToCSV', () => {
  const players: Player[] = [
    { ...mockPlayer, id: 'p1', name: 'John Doe', age: 25 },
    { ...mockPlayer, id: 'p2', name: 'Jane Smith', age: 28 },
  ];

  it('should export players to CSV format', () => {
    const csv = exportPlayersToCSV(players);
    expect(csv).toContain('Name');
    expect(csv).toContain('Position');
    expect(csv).toContain('John Doe');
    expect(csv).toContain('Jane Smith');
  });

  it('should include all attributes in CSV', () => {
    const csv = exportPlayersToCSV(players);
    expect(csv).toContain('PAC');
    expect(csv).toContain('SHO');
    expect(csv).toContain('PAS');
    expect(csv).toContain('DRI');
  });

  it('should handle empty player array', () => {
    const csv = exportPlayersToCSV([]);
    expect(csv).toContain('Name'); // Headers should still be present
  });
});

describe('exportPlayersToJSON', () => {
  const players: Player[] = [
    { ...mockPlayer, id: 'p1', name: 'John Doe' },
  ];

  it('should export players to JSON format', () => {
    const json = exportPlayersToJSON(players);
    expect(json).toBeDefined();
    expect(typeof json).toBe('string');
    
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
  });

  it('should include all player properties', () => {
    const json = exportPlayersToJSON(players);
    const parsed = JSON.parse(json);
    
    expect(parsed[0]).toHaveProperty('name');
    expect(parsed[0]).toHaveProperty('roleId');
    expect(parsed[0]).toHaveProperty('attributes');
  });

  it('should handle empty player array', () => {
    const json = exportPlayersToJSON([]);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual([]);
  });
});

describe('calculateGridColumns', () => {
  it('should return 2 columns for small screens', () => {
    expect(calculateGridColumns(500)).toBe(2);
  });

  it('should return 3 columns for medium screens', () => {
    expect(calculateGridColumns(800)).toBe(3);
  });

  it('should return 4 columns for large screens', () => {
    expect(calculateGridColumns(1100)).toBe(4);
  });

  it('should return 5 columns for extra large screens', () => {
    expect(calculateGridColumns(1400)).toBe(5);
  });

  it('should return 6 columns for very large screens', () => {
    expect(calculateGridColumns(1700)).toBe(6);
  });

  it('should handle edge cases', () => {
    expect(calculateGridColumns(0)).toBeGreaterThan(0);
    expect(calculateGridColumns(10000)).toBeGreaterThan(0);
  });
});

describe('getGridItemDimensions', () => {
  it('should calculate item dimensions correctly', () => {
    const dimensions = getGridItemDimensions(1200, 4);
    
    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
    expect(typeof dimensions.width).toBe('number');
    expect(typeof dimensions.height).toBe('number');
  });

  it('should account for gap in calculations', () => {
    const dimensions = getGridItemDimensions(1200, 4);
    expect(dimensions.width).toBeLessThan(300); // Should be less than 1200/4
  });

  it('should handle single column', () => {
    const dimensions = getGridItemDimensions(400, 1);
    expect(dimensions.width).toBeGreaterThan(0);
  });

  it('should handle many columns', () => {
    const dimensions = getGridItemDimensions(2000, 6);
    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.width).toBeLessThan(2000 / 6);
  });
});
