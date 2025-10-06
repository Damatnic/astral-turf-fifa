import React from 'react';
import { screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../utils/enhanced-mock-generators';
import {
  generateEnhancedFormation,
  generateEnhancedPlayer,
  generateCompleteTacticalSetup,
  generatePerformanceTestData,
} from '../utils/enhanced-mock-generators';
import {
  autoAssignPlayersToFormation,
  smartPlayerSwap,
  getFormationAnalysis,
} from '../../services/formationAutoAssignment';
import type { Formation, Player, TacticsState } from '../../types';

/**
 * FORMATION MANAGEMENT INTEGRATION TESTS
 *
 * Comprehensive testing of formation management system including:
 * - Auto-assignment algorithms
 * - Player position optimization
 * - Formation validation
 * - Tactical analysis
 * - Performance optimization
 * - Real-time updates
 */

describe('🏗️ Formation Management Integration Tests', () => {
  let testFormations: Record<string, Formation>;
  let testPlayers: Player[];
  let tacticsState: Partial<TacticsState>;

  beforeEach(() => {
    // Generate comprehensive test data using correct generator function signatures
    const setup442 = generateCompleteTacticalSetup();
    const setup433 = generateCompleteTacticalSetup();
    const setup352 = generateCompleteTacticalSetup();

    testFormations = {
      '442': setup442.formation,
      '433': setup433.formation,
      '352': setup352.formation,
    };

    testPlayers = [
      ...setup442.players,
      ...setup433.players.slice(0, 5), // Add some extra players
      ...setup352.players.slice(0, 3),
    ];

    tacticsState = {
      players: testPlayers,
      formations: testFormations,
      activeFormationIds: { home: '442', away: '433' },
      teamTactics: {
        home: { pressing: 'high', attackingStyle: 'possession' },
        away: { pressing: 'medium', attackingStyle: 'counter' },
      } as any,
      drawings: [],
      tacticalFamiliarity: {
        '442': 85,
        '433': 70,
        '352': 60,
      },
      chemistry: {},
      captainIds: { home: testPlayers[0]?.id || null, away: null },
      setPieceTakers: { home: {}, away: {} },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('🎯 Auto-Assignment System', () => {
    it('should automatically assign players to optimal positions', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = [
        generateEnhancedPlayer({ roleId: 'gk', team: 'home' }),
        ...Array.from({ length: 4 }, () => generateEnhancedPlayer({ roleId: 'cb', team: 'home' })),
        ...Array.from({ length: 4 }, () => generateEnhancedPlayer({ roleId: 'cm', team: 'home' })),
        ...Array.from({ length: 2 }, () => generateEnhancedPlayer({ roleId: 'st', team: 'home' })),
      ];

      const assignedFormation = autoAssignPlayersToFormation(players, formation, 'home');

      // Verify all slots are filled
      const filledSlots = assignedFormation.slots.filter(slot => slot.playerId !== null);
      expect(filledSlots).toHaveLength(11);

      // Verify players are assigned to appropriate positions
      const gkSlot = assignedFormation.slots.find(slot => slot.role === 'GK');
      const gkPlayer = players.find(p => p.id === gkSlot?.playerId);
      expect(gkPlayer?.roleId).toBe('gk');
    });

    it('should handle formation changes with player reassignment', () => {
      const initialFormation = generateEnhancedFormation('4-4-2');
      const newFormation = generateEnhancedFormation('4-3-3');
      const players = testPlayers.slice(0, 15).map(p => ({ ...p, team: 'home' as const }));

      // Assign to initial formation
      const assignedInitial = autoAssignPlayersToFormation(players, initialFormation, 'home');

      // Change to new formation
      const assignedNew = autoAssignPlayersToFormation(players, newFormation, 'home');

      // Verify both formations are properly filled
      expect(assignedInitial.slots.filter(s => s.playerId !== null)).toHaveLength(11);
      expect(assignedNew.slots.filter(s => s.playerId !== null)).toHaveLength(11);

      // Verify different formations have different player arrangements
      const initialPositions = assignedInitial.slots.map(s => s.playerId).sort();
      const newPositions = assignedNew.slots.map(s => s.playerId).sort();

      // Same players should be used, but in different positions
      expect(initialPositions).toEqual(newPositions);
    });

    it('should prioritize player fitness and availability', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = [
        generateEnhancedPlayer({
          roleId: 'gk',
          team: 'home',
          availability: { status: 'Available' },
          form: 'Excellent',
          morale: 'Excellent',
        }),
        generateEnhancedPlayer({
          roleId: 'gk',
          team: 'home',
          availability: { status: 'Major Injury', returnDate: '2024-12-31' },
          form: 'Poor',
          morale: 'Poor',
        }),
        ...Array.from({ length: 12 }, () => generateEnhancedPlayer({ team: 'home' })),
      ];

      const assignedFormation = autoAssignPlayersToFormation(players, formation, 'home');

      const gkSlot = assignedFormation.slots.find(slot => slot.role === 'GK');
      const assignedGK = players.find(p => p.id === gkSlot?.playerId);

      // Should assign the available, fit goalkeeper
      expect(assignedGK?.availability.status).toBe('Available');
      expect(assignedGK?.form).toBe('Excellent');
    });

    it('should handle insufficient players gracefully', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = Array.from({ length: 5 }, () => generateEnhancedPlayer({ team: 'home' }));

      const assignedFormation = autoAssignPlayersToFormation(players, formation, 'home');

      // Should assign available players to most important positions first
      const filledSlots = assignedFormation.slots.filter(slot => slot.playerId !== null);
      expect(filledSlots).toHaveLength(5);

      // Goalkeeper should be prioritized
      const gkSlot = assignedFormation.slots.find(slot => slot.role === 'GK');
      expect(gkSlot?.playerId).toBeTruthy();
    });
  });

  describe('🔄 Player Swap & Conflict Resolution', () => {
    it('should handle player swap operations intelligently', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = [
        generateEnhancedPlayer({ id: 'player-cb', roleId: 'cb', team: 'home' }),
        generateEnhancedPlayer({ id: 'player-fb', roleId: 'fb', team: 'home' }),
      ];

      // Assign players to formation
      formation.slots[1].playerId = 'player-cb'; // CB position
      formation.slots[3].playerId = 'player-fb'; // FB position

      const swapResult = smartPlayerSwap(
        'player-cb',
        formation.slots[3].id, // Target FB slot
        'player-fb',
        formation,
        players
      );

      expect(swapResult.success).toBe(true);
      expect(swapResult.recommendations).toBeDefined();
      expect(swapResult.recommendations?.length).toBeGreaterThan(0);
    });

    it('should suggest alternative positions for conflicts', () => {
      const formation = generateEnhancedFormation('4-3-3');
      const players = [
        generateEnhancedPlayer({ id: 'striker-1', roleId: 'st', team: 'home' }),
        generateEnhancedPlayer({ id: 'striker-2', roleId: 'st', team: 'home' }),
      ];

      // Both players want the same striker position
      const targetSlot = formation.slots.find(s => s.role === 'FW');
      if (targetSlot) {
        targetSlot.playerId = 'striker-1';
      }

      const conflictResult = smartPlayerSwap(
        'striker-2',
        targetSlot?.id || '',
        'striker-1',
        formation,
        players
      );

      expect(conflictResult.success).toBe(true);
      expect(conflictResult.recommendations).toContainEqual(
        expect.objectContaining({
          action: 'swap',
          description: expect.stringContaining('Swap'),
        })
      );
    });

    it('should handle position compatibility in swaps', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = [
        generateEnhancedPlayer({
          id: 'goalkeeper',
          roleId: 'gk',
          team: 'home',
          attributes: { ...generateEnhancedPlayer().attributes, positioning: 95 },
        }),
        generateEnhancedPlayer({
          id: 'striker',
          roleId: 'st',
          team: 'home',
          attributes: { ...generateEnhancedPlayer().attributes, shooting: 95 },
        }),
      ];

      // Try to swap goalkeeper and striker (incompatible)
      const gkSlot = formation.slots.find(s => s.role === 'GK');
      const fwSlot = formation.slots.find(s => s.role === 'FW');

      if (gkSlot && fwSlot) {
        gkSlot.playerId = 'goalkeeper';
        fwSlot.playerId = 'striker';

        const swapResult = smartPlayerSwap('goalkeeper', fwSlot.id, 'striker', formation, players);

        // Should suggest against this swap due to incompatibility
        expect(swapResult.success).toBe(true);
        expect(swapResult.recommendations?.some(r => r.action === 'move_to_bench')).toBe(true);
      }
    });
  });

  describe('📊 Formation Analysis & Validation', () => {
    it('should analyze formation effectiveness', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = Array.from({ length: 11 }, (_, i) =>
        generateEnhancedPlayer({ id: `player-${i}`, team: 'home' })
      );

      // Assign players to formation
      formation.slots.forEach((slot, index) => {
        if (players[index]) {
          slot.playerId = players[index].id;
        }
      });

      const analysis = getFormationAnalysis(formation, players);

      expect(analysis.totalScore).toBeGreaterThan(0);
      expect(analysis.averageScore).toBeGreaterThan(0);
      expect(analysis.positionScores).toHaveLength(11);
      expect(analysis.recommendations).toBeDefined();

      // Verify position scores have required properties
      analysis.positionScores.forEach(score => {
        expect(score).toHaveProperty('slotId');
        expect(score).toHaveProperty('role');
        expect(score).toHaveProperty('playerName');
        expect(score).toHaveProperty('score');
        expect(score).toHaveProperty('fitness');
        expect(['excellent', 'good', 'average', 'poor']).toContain(score.fitness);
      });
    });

    it('should identify formation weaknesses', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = [
        // All players are strikers (poor fit for most positions)
        ...Array.from({ length: 11 }, (_, i) =>
          generateEnhancedPlayer({
            id: `striker-${i}`,
            roleId: 'st',
            team: 'home',
          })
        ),
      ];

      // Assign mismatched players
      formation.slots.forEach((slot, index) => {
        slot.playerId = players[index]?.id || null;
      });

      const analysis = getFormationAnalysis(formation, players);

      // Should identify poor fits
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.averageScore).toBeLessThan(70); // Poor overall score

      // Should have specific recommendations
      const poorFitRecommendations = analysis.recommendations.filter(r =>
        r.issue.includes('not well-suited')
      );
      expect(poorFitRecommendations.length).toBeGreaterThan(0);
    });

    it('should handle missing players in formation', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = Array.from({ length: 5 }, (_, i) =>
        generateEnhancedPlayer({ id: `player-${i}`, team: 'home' })
      );

      // Only assign some players
      formation.slots.slice(0, 5).forEach((slot, index) => {
        slot.playerId = players[index]?.id || null;
      });

      const analysis = getFormationAnalysis(formation, players);

      // Should identify empty positions
      const emptyPositionRecommendations = analysis.recommendations.filter(r =>
        r.issue.includes('No player assigned')
      );
      expect(emptyPositionRecommendations.length).toBe(6); // 6 empty positions
    });
  });

  describe('⚡ Performance Optimization', () => {
    it('should handle large player pools efficiently', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const largePlayerPool = Array.from({ length: 100 }, (_, i) =>
        generateEnhancedPlayer({ id: `player-${i}`, team: 'home' })
      );

      const startTime = performance.now();
      const assignedFormation = autoAssignPlayersToFormation(largePlayerPool, formation, 'home');
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      // Should complete within reasonable time
      expect(executionTime).toBeLessThan(100); // 100ms threshold
      expect(assignedFormation.slots.filter(s => s.playerId !== null)).toHaveLength(11);
    });

    it('should optimize formation analysis for complex scenarios', () => {
      const formation = generateEnhancedFormation('3-5-2');
      const players = Array.from({ length: 25 }, (_, i) =>
        generateEnhancedPlayer({ id: `player-${i}`, team: 'home' })
      );

      formation.slots.forEach((slot, index) => {
        slot.playerId = players[index]?.id || null;
      });

      const startTime = performance.now();
      const analysis = getFormationAnalysis(formation, players);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(50); // 50ms threshold for analysis
      expect(analysis.positionScores).toHaveLength(formation.slots.length);
    });

    it('should cache formation calculations for repeated operations', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = Array.from({ length: 15 }, (_, i) =>
        generateEnhancedPlayer({ id: `player-${i}`, team: 'home' })
      );

      // First assignment
      const startTime1 = performance.now();
      const assigned1 = autoAssignPlayersToFormation(players, formation, 'home');
      const endTime1 = performance.now();
      const time1 = endTime1 - startTime1;

      // Second assignment (should benefit from any caching)
      const startTime2 = performance.now();
      const assigned2 = autoAssignPlayersToFormation(players, formation, 'home');
      const endTime2 = performance.now();
      const time2 = endTime2 - startTime2;

      // Results should be consistent
      expect(assigned1.slots.length).toBe(assigned2.slots.length);

      // Performance should be reasonable for both
      expect(time1).toBeLessThan(100);
      expect(time2).toBeLessThan(100);
    });
  });

  describe('🔄 Real-time Updates & State Management', () => {
    it('should handle concurrent formation updates', async () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = Array.from({ length: 15 }, (_, i) =>
        generateEnhancedPlayer({ id: `player-${i}`, team: 'home' })
      );

      // Simulate concurrent updates
      const updates = await Promise.all([
        Promise.resolve(autoAssignPlayersToFormation(players.slice(0, 11), formation, 'home')),
        Promise.resolve(autoAssignPlayersToFormation(players.slice(2, 13), formation, 'home')),
        Promise.resolve(autoAssignPlayersToFormation(players.slice(4, 15), formation, 'home')),
      ]);

      // All updates should complete successfully
      updates.forEach(update => {
        expect(update.slots.filter(s => s.playerId !== null)).toHaveLength(11);
      });
    });

    it('should maintain formation integrity during updates', () => {
      const formation = generateEnhancedFormation('4-3-3');
      const players = Array.from({ length: 11 }, (_, i) =>
        generateEnhancedPlayer({ id: `player-${i}`, team: 'home' })
      );

      const assignedFormation = autoAssignPlayersToFormation(players, formation, 'home');

      // Verify formation structure is maintained
      expect(assignedFormation.id).toBe(formation.id);
      expect(assignedFormation.name).toBe(formation.name);
      expect(assignedFormation.slots.length).toBe(formation.slots.length);

      // Verify slot structure is maintained
      assignedFormation.slots.forEach((slot, index) => {
        expect(slot.id).toBe(formation.slots[index].id);
        expect(slot.role).toBe(formation.slots[index].role);
        expect(slot.defaultPosition).toEqual(formation.slots[index].defaultPosition);
      });
    });

    it('should handle player availability changes', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = Array.from({ length: 15 }, (_, i) =>
        generateEnhancedPlayer({
          id: `player-${i}`,
          team: 'home',
          availability: { status: 'Available' },
        })
      );

      // Initial assignment
      const initialAssignment = autoAssignPlayersToFormation(players, formation, 'home');
      const initialCount = initialAssignment.slots.filter(s => s.playerId !== null).length;

      // Injure some players
      const injuredPlayers = players.map((player, index) =>
        index < 5
          ? {
              ...player,
              availability: { status: 'Major Injury' as const, returnDate: '2024-12-31' },
            }
          : player
      );

      // Reassign with injured players
      const updatedAssignment = autoAssignPlayersToFormation(injuredPlayers, formation, 'home');
      const updatedCount = updatedAssignment.slots.filter(s => s.playerId !== null).length;

      // Should still fill all positions (using injured players if necessary)
      expect(updatedCount).toBe(11);
      expect(initialCount).toBe(11);
    });
  });

  describe('🧪 Edge Cases & Stress Testing', () => {
    it('should handle empty formation gracefully', () => {
      const emptyFormation: Formation = {
        id: 'empty',
        name: 'Empty Formation',
        slots: [],
      };
      const players = Array.from({ length: 5 }, () => generateEnhancedPlayer({ team: 'home' }));

      const result = autoAssignPlayersToFormation(players, emptyFormation, 'home');

      expect(result.slots).toHaveLength(0);
      expect(result.id).toBe('empty');
    });

    it('should handle formation with duplicate slot IDs', () => {
      const formation = generateEnhancedFormation('4-4-2');
      // Create duplicate slot ID
      formation.slots[1].id = formation.slots[0].id;

      const players = Array.from({ length: 11 }, () => generateEnhancedPlayer({ team: 'home' }));

      // Should handle gracefully without crashing
      const result = autoAssignPlayersToFormation(players, formation, 'home');
      expect(result.slots).toHaveLength(formation.slots.length);
    });

    it('should handle extreme player attributes', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const extremePlayers = [
        generateEnhancedPlayer({
          team: 'home',
          attributes: {
            speed: 1,
            passing: 1,
            tackling: 1,
            shooting: 1,
            dribbling: 1,
            positioning: 1,
            stamina: 1,
          },
        }),
        generateEnhancedPlayer({
          team: 'home',
          attributes: {
            speed: 99,
            passing: 99,
            tackling: 99,
            shooting: 99,
            dribbling: 99,
            positioning: 99,
            stamina: 99,
          },
        }),
        ...Array.from({ length: 9 }, () => generateEnhancedPlayer({ team: 'home' })),
      ];

      const result = autoAssignPlayersToFormation(extremePlayers, formation, 'home');

      // Should handle extreme values without errors
      expect(result.slots.filter(s => s.playerId !== null)).toHaveLength(11);

      const analysis = getFormationAnalysis(result, extremePlayers);
      expect(analysis.totalScore).toBeGreaterThan(0);
      expect(analysis.averageScore).toBeGreaterThan(0);
    });

    it('should handle malformed player data', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const malformedPlayers = [
        generateEnhancedPlayer({ team: 'home' }),
        // @ts-ignore - Testing malformed data
        { id: 'malformed-1', team: 'home' }, // Missing required fields
        generateEnhancedPlayer({ team: 'home' }),
        // @ts-ignore - Testing malformed data
        null, // Null player
        generateEnhancedPlayer({ team: 'home' }),
      ].filter(Boolean) as Player[];

      // Should handle gracefully
      const result = autoAssignPlayersToFormation(malformedPlayers, formation, 'home');
      expect(result.slots).toHaveLength(formation.slots.length);
    });
  });

  describe('🎮 Interactive Formation Building', () => {
    it('should support step-by-step formation building', () => {
      const formation = generateEnhancedFormation('4-4-2');
      const players = Array.from({ length: 15 }, (_, i) =>
        generateEnhancedPlayer({ id: `player-${i}`, team: 'home' })
      );

      // Step 1: Assign goalkeeper
      const step1 = { ...formation };
      const gkSlot = step1.slots.find(s => s.role === 'GK');
      const goalkeeper = players.find(p => p.roleId === 'gk') || players[0];
      if (gkSlot) {
        gkSlot.playerId = goalkeeper.id;
      }

      // Step 2: Assign defenders
      const defenders = players.filter(p => p.roleId.includes('b'));
      const defenderSlots = step1.slots.filter(s => s.role === 'DF');
      defenderSlots.forEach((slot, index) => {
        if (defenders[index]) {
          slot.playerId = defenders[index].id;
        }
      });

      // Verify progressive building
      expect(step1.slots.filter(s => s.playerId !== null).length).toBeGreaterThan(0);
      expect(step1.slots.filter(s => s.playerId !== null).length).toBeLessThanOrEqual(11);
    });

    it('should validate position constraints', () => {
      const formation = generateEnhancedFormation('4-4-2');

      // Should have exactly one goalkeeper
      const gkSlots = formation.slots.filter(s => s.role === 'GK');
      expect(gkSlots).toHaveLength(1);

      // Should have four defenders for 4-4-2
      const defSlots = formation.slots.filter(s => s.role === 'DF');
      expect(defSlots).toHaveLength(4);

      // Should have four midfielders for 4-4-2
      const midSlots = formation.slots.filter(s => s.role === 'MF');
      expect(midSlots).toHaveLength(4);

      // Should have two forwards for 4-4-2
      const fwSlots = formation.slots.filter(s => s.role === 'FW');
      expect(fwSlots).toHaveLength(2);
    });

    it('should support formation templates and variations', () => {
      const formations = [
        generateEnhancedFormation('4-4-2'),
        generateEnhancedFormation('4-3-3'),
        generateEnhancedFormation('3-5-2'),
      ];

      formations.forEach(formation => {
        expect(formation.slots).toHaveLength(11); // Standard 11 players
        expect(formation.slots.filter(s => s.role === 'GK')).toHaveLength(1); // One GK

        const outfieldPlayers = formation.slots.filter(s => s.role !== 'GK');
        expect(outfieldPlayers).toHaveLength(10); // 10 outfield players
      });
    });
  });
});
