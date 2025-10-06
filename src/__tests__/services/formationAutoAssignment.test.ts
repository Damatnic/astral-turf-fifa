import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  autoAssignPlayersToFormation,
  smartPlayerSwap,
  updatePlayerPositionsFromFormation,
  getFormationAnalysis,
} from '../../services/formationAutoAssignment';
import type { Player, Formation, FormationSlot } from '../../types';

/**
 * Comprehensive Test Suite for Formation Auto-Assignment System
 *
 * Tests cover:
 * - Player-slot scoring algorithm accuracy
 * - Auto-assignment optimization
 * - Smart conflict resolution
 * - Formation analysis and recommendations
 * - Edge cases and error conditions
 * - Performance under load
 */

describe('Formation Auto-Assignment System', () => {
  let mockPlayers: Player[];
  let mockFormation: Formation;
  let mockFormationSlots: FormationSlot[];

  beforeEach(() => {
    // Create realistic test players with varying attributes
    mockPlayers = [
      // Goalkeeper
      {
        id: 'gk-1',
        name: 'Manuel Neuer',
        jerseyNumber: 1,
        age: 35,
        nationality: 'Germany',
        potential: [85, 90] as const,
        currentPotential: 88,
        roleId: 'gk',
        instructions: {},
        team: 'home',
        teamColor: '#FF0000',
        attributes: {
          speed: 45,
          passing: 70,
          tackling: 20,
          shooting: 15,
          dribbling: 40,
          positioning: 95,
          stamina: 80,
        },
        position: { x: 10, y: 50 },
        availability: { status: 'Available' },
        morale: 'Excellent',
        form: 'Good',
        stamina: 85,
        developmentLog: [],
        contract: { clauses: [] },
        stats: {
          goals: 0,
          assists: 2,
          matchesPlayed: 30,
          shotsOnTarget: 0,
          tacklesWon: 5,
          saves: 120,
          passesCompleted: 800,
          passesAttempted: 900,
          careerHistory: [],
        },
        loan: { isLoaned: false },
        traits: ['Leader'],
        conversationHistory: [],
        attributeHistory: [],
        attributeDevelopmentProgress: {},
        communicationLog: [],
        customTrainingSchedule: null,
        fatigue: 15,
        injuryRisk: 10,
        lastConversationInitiatedWeek: 0,
        moraleBoost: null,
        completedChallenges: [],
      },
      // Defender
      {
        id: 'cb-1',
        name: 'Virgil van Dijk',
        jerseyNumber: 4,
        age: 31,
        nationality: 'Netherlands',
        potential: [88, 93] as const,
        currentPotential: 91,
        roleId: 'cb',
        instructions: {},
        team: 'home',
        teamColor: '#FF0000',
        attributes: {
          speed: 75,
          passing: 82,
          tackling: 92,
          shooting: 45,
          dribbling: 70,
          positioning: 90,
          stamina: 85,
        },
        position: { x: 25, y: 40 },
        availability: { status: 'Available' },
        morale: 'Excellent',
        form: 'Excellent',
        stamina: 90,
        developmentLog: [],
        contract: { clauses: [] },
        stats: {
          goals: 5,
          assists: 3,
          matchesPlayed: 28,
          shotsOnTarget: 12,
          tacklesWon: 85,
          saves: 0,
          passesCompleted: 1800,
          passesAttempted: 2000,
          careerHistory: [],
        },
        loan: { isLoaned: false },
        traits: ['Leader', 'Consistent'],
        conversationHistory: [],
        attributeHistory: [],
        attributeDevelopmentProgress: {},
        communicationLog: [],
        customTrainingSchedule: null,
        fatigue: 10,
        injuryRisk: 5,
        lastConversationInitiatedWeek: 0,
        moraleBoost: null,
        completedChallenges: [],
      },
      // Midfielder
      {
        id: 'cm-1',
        name: 'Kevin De Bruyne',
        jerseyNumber: 17,
        age: 31,
        nationality: 'Belgium',
        potential: [90, 95] as const,
        currentPotential: 93,
        roleId: 'cm',
        instructions: {},
        team: 'home',
        teamColor: '#FF0000',
        attributes: {
          speed: 70,
          passing: 96,
          tackling: 65,
          shooting: 88,
          dribbling: 85,
          positioning: 88,
          stamina: 80,
        },
        position: { x: 50, y: 50 },
        availability: { status: 'Available' },
        morale: 'Good',
        form: 'Excellent',
        stamina: 85,
        developmentLog: [],
        contract: { clauses: [] },
        stats: {
          goals: 15,
          assists: 25,
          matchesPlayed: 32,
          shotsOnTarget: 45,
          tacklesWon: 30,
          saves: 0,
          passesCompleted: 2200,
          passesAttempted: 2500,
          careerHistory: [],
        },
        loan: { isLoaned: false },
        traits: ['Ambitious'],
        conversationHistory: [],
        attributeHistory: [],
        attributeDevelopmentProgress: {},
        communicationLog: [],
        customTrainingSchedule: null,
        fatigue: 20,
        injuryRisk: 15,
        lastConversationInitiatedWeek: 0,
        moraleBoost: null,
        completedChallenges: [],
      },
      // Forward
      {
        id: 'fw-1',
        name: 'Erling Haaland',
        jerseyNumber: 9,
        age: 23,
        nationality: 'Norway',
        potential: [92, 97] as const,
        currentPotential: 94,
        roleId: 'cf',
        instructions: {},
        team: 'home',
        teamColor: '#FF0000',
        attributes: {
          speed: 92,
          passing: 65,
          tackling: 40,
          shooting: 95,
          dribbling: 78,
          positioning: 90,
          stamina: 85,
        },
        position: { x: 80, y: 50 },
        availability: { status: 'Available' },
        morale: 'Excellent',
        form: 'Excellent',
        stamina: 90,
        developmentLog: [],
        contract: { clauses: [] },
        stats: {
          goals: 35,
          assists: 8,
          matchesPlayed: 30,
          shotsOnTarget: 78,
          tacklesWon: 5,
          saves: 0,
          passesCompleted: 600,
          passesAttempted: 800,
          careerHistory: [],
        },
        loan: { isLoaned: false },
        traits: ['Ambitious'],
        conversationHistory: [],
        attributeHistory: [],
        attributeDevelopmentProgress: {},
        communicationLog: [],
        customTrainingSchedule: null,
        fatigue: 15,
        injuryRisk: 20,
        lastConversationInitiatedWeek: 0,
        moraleBoost: null,
        completedChallenges: [],
      },
      // Injured player to test availability handling
      {
        id: 'injured-1',
        name: 'Injured Player',
        jerseyNumber: 10,
        age: 28,
        nationality: 'Spain',
        potential: [80, 85] as const,
        currentPotential: 82,
        roleId: 'cm',
        instructions: {},
        team: 'home',
        teamColor: '#FF0000',
        attributes: {
          speed: 75,
          passing: 85,
          tackling: 70,
          shooting: 80,
          dribbling: 85,
          positioning: 80,
          stamina: 80,
        },
        position: { x: 60, y: 40 },
        availability: { status: 'Major Injury', returnDate: '2024-02-15' },
        morale: 'Poor',
        form: 'Poor',
        stamina: 70,
        developmentLog: [],
        contract: { clauses: [] },
        stats: {
          goals: 10,
          assists: 12,
          matchesPlayed: 15,
          shotsOnTarget: 25,
          tacklesWon: 20,
          saves: 0,
          passesCompleted: 900,
          passesAttempted: 1100,
          careerHistory: [],
        },
        loan: { isLoaned: false },
        traits: ['Injury Prone'],
        conversationHistory: [],
        attributeHistory: [],
        attributeDevelopmentProgress: {},
        communicationLog: [],
        customTrainingSchedule: null,
        fatigue: 50,
        injuryRisk: 80,
        lastConversationInitiatedWeek: 0,
        moraleBoost: null,
        completedChallenges: [],
      },
    ];

    // Create formation slots for 4-3-3 formation
    mockFormationSlots = [
      {
        id: 'gk-slot',
        role: 'GK',
        defaultPosition: { x: 10, y: 50 },
        playerId: null,
        preferredRoles: ['gk', 'sk'],
      },
      {
        id: 'cb-1-slot',
        role: 'DF',
        defaultPosition: { x: 25, y: 35 },
        playerId: null,
        preferredRoles: ['cb', 'bpd'],
      },
      {
        id: 'cb-2-slot',
        role: 'DF',
        defaultPosition: { x: 25, y: 65 },
        playerId: null,
        preferredRoles: ['cb', 'ncb'],
      },
      {
        id: 'cm-slot',
        role: 'MF',
        defaultPosition: { x: 50, y: 50 },
        playerId: null,
        preferredRoles: ['cm', 'dlp', 'ap'],
      },
      {
        id: 'fw-slot',
        role: 'FW',
        defaultPosition: { x: 80, y: 50 },
        playerId: null,
        preferredRoles: ['cf', 'tf'],
      },
    ];

    mockFormation = {
      id: 'test-formation',
      name: '4-3-3 Test Formation',
      slots: mockFormationSlots,
    };
  });

  describe('autoAssignPlayersToFormation', () => {
    it('should assign players to their best-suited positions', () => {
      const result = autoAssignPlayersToFormation(mockPlayers, mockFormation, 'home');

      // Verify structure
      expect(result).toBeDefined();
      expect(result.slots).toHaveLength(5);

      // Find assignments
      const gkSlot = result.slots.find(s => s.id === 'gk-slot');
      const cbSlot = result.slots.find(s => s.id === 'cb-1-slot');
      const cmSlot = result.slots.find(s => s.id === 'cm-slot');
      const fwSlot = result.slots.find(s => s.id === 'fw-slot');

      // Verify correct assignments based on role compatibility
      expect(gkSlot?.playerId).toBe('gk-1'); // Goalkeeper should be in GK slot
      expect(cbSlot?.playerId).toBe('cb-1'); // Defender should be in DF slot
      expect(cmSlot?.playerId).toBe('cm-1'); // Midfielder should be in MF slot
      expect(fwSlot?.playerId).toBe('fw-1'); // Forward should be in FW slot
    });

    it('should prioritize available players over unavailable ones', () => {
      // Create formation with more slots than available players
      const extendedSlots = [
        ...mockFormationSlots,
        {
          id: 'cm-2-slot',
          role: 'MF',
          defaultPosition: { x: 50, y: 30 },
          playerId: null,
          preferredRoles: ['cm', 'dlp'],
        },
      ];

      const extendedFormation = {
        ...mockFormation,
        slots: extendedSlots,
      };

      const result = autoAssignPlayersToFormation(mockPlayers, extendedFormation, 'home');

      // Available midfielder should be assigned before injured one
      const cmSlot1 = result.slots.find(s => s.id === 'cm-slot');
      const cmSlot2 = result.slots.find(s => s.id === 'cm-2-slot');

      expect(cmSlot1?.playerId).toBe('cm-1'); // Available player first
      expect(cmSlot2?.playerId).toBe('injured-1'); // Injured player as fallback
    });

    it('should handle empty formation slots gracefully', () => {
      const emptyFormation = {
        ...mockFormation,
        slots: [],
      };

      const result = autoAssignPlayersToFormation(mockPlayers, emptyFormation, 'home');

      expect(result.slots).toHaveLength(0);
    });

    it('should handle no available players gracefully', () => {
      const result = autoAssignPlayersToFormation([], mockFormation, 'home');

      expect(result.slots).toHaveLength(5);
      result.slots.forEach(slot => {
        expect(slot.playerId).toBeNull();
      });
    });

    it('should only assign players from the specified team', () => {
      // Add away team players
      const awayPlayers = [
        {
          ...mockPlayers[0],
          id: 'away-gk',
          team: 'away' as const,
        },
      ];

      const allPlayers = [...mockPlayers, ...awayPlayers];
      const result = autoAssignPlayersToFormation(allPlayers, mockFormation, 'home');

      // Should only assign home team players
      const assignedPlayerIds = result.slots
        .filter(slot => slot.playerId)
        .map(slot => slot.playerId);

      assignedPlayerIds.forEach(playerId => {
        const player = allPlayers.find(p => p.id === playerId);
        expect(player?.team).toBe('home');
      });
    });

    it('should consider player form and morale in scoring', () => {
      // Create two similar players with different form/morale
      const player1 = {
        ...mockPlayers[1], // Use defender as base
        id: 'player-1',
        form: 'Excellent' as const,
        morale: 'Excellent' as const,
      };

      const player2 = {
        ...mockPlayers[1],
        id: 'player-2',
        form: 'Terrible' as const,
        morale: 'Very Poor' as const,
      };

      const competingPlayers = [player1, player2];
      const singleSlotFormation = {
        ...mockFormation,
        slots: [mockFormationSlots[1]], // Only one defender slot
      };

      const result = autoAssignPlayersToFormation(competingPlayers, singleSlotFormation, 'home');

      // Player with better form/morale should be selected
      expect(result.slots[0].playerId).toBe('player-1');
    });

    it('should handle role compatibility scoring correctly', () => {
      // Test cross-position compatibility (e.g., MF in DF position)
      const midfielder = {
        ...mockPlayers[2], // Use midfielder
        id: 'versatile-mid',
      };

      const defenderSlotOnly = {
        ...mockFormation,
        slots: [mockFormationSlots[1]], // Only defender slot
      };

      const result = autoAssignPlayersToFormation([midfielder], defenderSlotOnly, 'home');

      // Should assign midfielder to defender slot (with reduced score)
      expect(result.slots[0].playerId).toBe('versatile-mid');
    });
  });

  describe('smartPlayerSwap', () => {
    beforeEach(() => {
      // Pre-assign players to formation for swap testing
      mockFormation.slots[0].playerId = 'gk-1';
      mockFormation.slots[1].playerId = 'cb-1';
      mockFormation.slots[2].playerId = null; // Empty slot
      mockFormation.slots[3].playerId = 'cm-1';
      mockFormation.slots[4].playerId = 'fw-1';
    });

    it('should provide swap recommendations for compatible players', () => {
      const result = smartPlayerSwap(
        'gk-1', // Source: goalkeeper
        'cb-1-slot', // Target: defender slot
        'cb-1', // Target player: defender
        mockFormation,
        mockPlayers
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations!.length).toBeGreaterThan(0);

      // Should have move to bench option
      const benchOption = result.recommendations!.find(r => r.action === 'move_to_bench');
      expect(benchOption).toBeDefined();
    });

    it('should suggest direct swap for role-compatible players', () => {
      // Add another defender to test swap
      const defender2 = {
        ...mockPlayers[1],
        id: 'cb-2',
        name: 'John Stones',
      };

      const playersWithSecondDefender = [...mockPlayers, defender2];
      mockFormation.slots[2].playerId = 'cb-2'; // Assign second defender

      const result = smartPlayerSwap(
        'cb-1',
        'cb-2-slot',
        'cb-2',
        mockFormation,
        playersWithSecondDefender
      );

      expect(result.success).toBe(true);
      const swapOption = result.recommendations!.find(r => r.action === 'swap');
      expect(swapOption).toBeDefined();
      expect(swapOption!.description).toContain('Swap');
    });

    it('should suggest reassignment to available slots', () => {
      const result = smartPlayerSwap(
        'cm-1', // Midfielder
        'cb-1-slot', // Target defender slot
        'cb-1', // Current defender
        mockFormation,
        mockPlayers
      );

      expect(result.success).toBe(true);

      // Should suggest moving defender to empty slot if available
      const reassignOption = result.recommendations!.find(r => r.action === 'reassign');
      if (mockFormation.slots.some(s => !s.playerId)) {
        expect(reassignOption).toBeDefined();
      }
    });

    it('should handle invalid player IDs gracefully', () => {
      const result = smartPlayerSwap('invalid-id', 'cb-1-slot', 'cb-1', mockFormation, mockPlayers);

      expect(result.success).toBe(false);
      expect(result.recommendations).toBeUndefined();
    });

    it('should handle empty target slot', () => {
      const result = smartPlayerSwap(
        'cm-1',
        'cb-2-slot', // Empty slot
        '', // No target player
        mockFormation,
        mockPlayers
      );

      expect(result.success).toBe(false);
    });
  });

  describe('updatePlayerPositionsFromFormation', () => {
    beforeEach(() => {
      mockFormation.slots[0].playerId = 'gk-1';
      mockFormation.slots[1].playerId = 'cb-1';
      mockFormation.slots[3].playerId = 'cm-1';
    });

    it('should update player positions to match formation slots', () => {
      const result = updatePlayerPositionsFromFormation(mockPlayers, mockFormation, 'home');

      const updatedGK = result.find(p => p.id === 'gk-1');
      const updatedCB = result.find(p => p.id === 'cb-1');
      const updatedCM = result.find(p => p.id === 'cm-1');

      expect(updatedGK?.position).toEqual({ x: 10, y: 50 });
      expect(updatedCB?.position).toEqual({ x: 25, y: 35 });
      expect(updatedCM?.position).toEqual({ x: 50, y: 50 });
    });

    it('should not update positions for players not in formation', () => {
      const originalFW = mockPlayers.find(p => p.id === 'fw-1');
      const result = updatePlayerPositionsFromFormation(mockPlayers, mockFormation, 'home');

      const updatedFW = result.find(p => p.id === 'fw-1');
      expect(updatedFW?.position).toEqual(originalFW?.position);
    });

    it('should only update players from specified team', () => {
      const awayPlayer = {
        ...mockPlayers[0],
        id: 'away-player',
        team: 'away' as const,
      };

      const allPlayers = [...mockPlayers, awayPlayer];
      const result = updatePlayerPositionsFromFormation(allPlayers, mockFormation, 'home');

      const updatedAwayPlayer = result.find(p => p.id === 'away-player');
      expect(updatedAwayPlayer?.position).toEqual(awayPlayer.position);
    });
  });

  describe('getFormationAnalysis', () => {
    beforeEach(() => {
      mockFormation.slots[0].playerId = 'gk-1';
      mockFormation.slots[1].playerId = 'cb-1';
      mockFormation.slots[3].playerId = 'cm-1';
      mockFormation.slots[4].playerId = 'fw-1';
      mockFormation.slots[2].playerId = 'injured-1'; // Injured player in formation
    });

    it('should provide comprehensive formation analysis', () => {
      const result = getFormationAnalysis(mockFormation, mockPlayers);

      expect(result).toBeDefined();
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.positionScores).toHaveLength(5);
      expect(result.recommendations).toBeDefined();
    });

    it('should calculate correct fitness levels based on scores', () => {
      const result = getFormationAnalysis(mockFormation, mockPlayers);

      const gkScore = result.positionScores.find(ps => ps.slotId === 'gk-slot');
      const cbScore = result.positionScores.find(ps => ps.slotId === 'cb-1-slot');

      // GK should have excellent fitness (perfect role match)
      expect(gkScore?.fitness).toBe('excellent');
      expect(gkScore?.score).toBeGreaterThanOrEqual(90);

      // CB should have excellent fitness
      expect(cbScore?.fitness).toBe('excellent');
      expect(cbScore?.score).toBeGreaterThanOrEqual(90);
    });

    it('should provide recommendations for poor fits', () => {
      const result = getFormationAnalysis(mockFormation, mockPlayers);

      // Should have recommendations for injured player
      const injuredPlayerRecommendations = result.recommendations.filter(r =>
        r.issue.includes('Injured Player')
      );

      expect(injuredPlayerRecommendations.length).toBeGreaterThan(0);
    });

    it('should identify empty positions', () => {
      // Create formation with empty slot
      const formationWithEmpty = {
        ...mockFormation,
        slots: [
          ...mockFormation.slots,
          {
            id: 'empty-slot',
            role: 'MF' as const,
            defaultPosition: { x: 40, y: 30 },
            playerId: null,
          },
        ],
      };

      const result = getFormationAnalysis(formationWithEmpty, mockPlayers);

      const emptySlotRecommendation = result.recommendations.find(
        r => r.slotId === 'empty-slot' && r.issue.includes('No player assigned')
      );

      expect(emptySlotRecommendation).toBeDefined();
    });

    it('should calculate average score correctly', () => {
      const result = getFormationAnalysis(mockFormation, mockPlayers);

      const expectedAverage = Math.round(
        result.positionScores.reduce((sum, ps) => sum + ps.score, 0) / result.positionScores.length
      );

      expect(result.averageScore).toBe(expectedAverage);
    });

    it('should handle formation with no players assigned', () => {
      const emptyFormation = {
        ...mockFormation,
        slots: mockFormation.slots.map(slot => ({ ...slot, playerId: null })),
      };

      const result = getFormationAnalysis(emptyFormation, mockPlayers);

      expect(result.totalScore).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.positionScores).toHaveLength(0);
      expect(result.recommendations).toHaveLength(5); // One for each empty slot
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large player datasets efficiently', () => {
      // Create 100 players
      const largePlayers = Array.from({ length: 100 }, (_, i) => ({
        ...mockPlayers[i % mockPlayers.length],
        id: `player-${i}`,
        name: `Player ${i}`,
      }));

      const startTime = performance.now();
      const result = autoAssignPlayersToFormation(largePlayers, mockFormation, 'home');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
      expect(result.slots).toHaveLength(5);
    });

    it('should handle formations with many slots', () => {
      // Create formation with 20 slots
      const manySlots = Array.from({ length: 20 }, (_, i) => ({
        id: `slot-${i}`,
        role: (['GK', 'DF', 'MF', 'FW'] as const)[i % 4],
        defaultPosition: { x: (i % 10) * 10, y: Math.floor(i / 10) * 50 },
        playerId: null,
      }));

      const bigFormation = {
        ...mockFormation,
        slots: manySlots,
      };

      const result = autoAssignPlayersToFormation(mockPlayers, bigFormation, 'home');

      expect(result.slots).toHaveLength(20);
      // Should assign all available players
      const assignedCount = result.slots.filter(s => s.playerId).length;
      expect(assignedCount).toBeLessThanOrEqual(mockPlayers.length);
    });

    it('should handle malformed player data gracefully', () => {
      const malformedPlayers = [
        {
          ...mockPlayers[0],
          attributes: {} as any, // Missing attributes
        },
        {
          ...mockPlayers[1],
          availability: null as any, // Null availability
        },
      ];

      expect(() => {
        autoAssignPlayersToFormation(malformedPlayers, mockFormation, 'home');
      }).not.toThrow();
    });

    it('should maintain formation structure integrity', () => {
      const originalFormation = JSON.parse(JSON.stringify(mockFormation));
      const result = autoAssignPlayersToFormation(mockPlayers, mockFormation, 'home');

      // Original formation should be unchanged
      expect(mockFormation.id).toBe(originalFormation.id);
      expect(mockFormation.name).toBe(originalFormation.name);
      expect(mockFormation.slots.length).toBe(originalFormation.slots.length);

      // Result should be a new object
      expect(result).not.toBe(mockFormation);
    });
  });
});
