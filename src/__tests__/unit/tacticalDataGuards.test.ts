import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isValidFormation,
  isValidFormationSlot,
  isValidPlayer,
  isValidPosition,
  getFormationSlots,
  getAssignedPlayers,
  getUnassignedPlayers,
  findPlayerById,
  findSlotById,
  getPlayerPosition,
  getSlotPosition,
  getFormationStats,
  getFormationPlayerIds,
  safeCalculation,
  validateTrailPoints,
  safeMirrorPosition,
} from '../../utils/tacticalDataGuards';
import type { Formation, FormationSlot, Player, Position } from '../../types';

/**
 * ZENITH TACTICAL DATA GUARDS TEST SUITE
 * Comprehensive testing of all data validation and safety functions
 * Ensures 100% protection against unsafe array operations and null/undefined data
 */

describe('ZENITH Tactical Data Guards', () => {
  // Mock console methods to test error logging
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Type Guards - Core Validation', () => {
    describe('isValidFormation', () => {
      it('should validate correct formation objects', () => {
        const validFormation: Formation = {
          id: 'test-formation',
          name: '4-4-2',
          description: 'Test formation',
          slots: [
            {
              id: 'slot-1',
              role: 'GK',
              defaultPosition: { x: 10, y: 50 },
              playerId: null,
            },
          ],
          isCustom: false,
        };

        expect(isValidFormation(validFormation)).toBe(true);
      });

      it('should reject null and undefined formations', () => {
        expect(isValidFormation(null)).toBeFalsy();
        expect(isValidFormation(undefined)).toBeFalsy();
      });

      it('should reject formations with invalid structure', () => {
        // Missing name
        expect(isValidFormation({ slots: [] })).toBe(false);

        // Invalid name type
        expect(isValidFormation({ name: 123, slots: [] })).toBe(false);

        // Missing slots
        expect(isValidFormation({ name: 'Test' })).toBe(false);

        // Non-array slots
        expect(isValidFormation({ name: 'Test', slots: 'invalid' })).toBe(false);

        // Empty slots array
        expect(isValidFormation({ name: 'Test', slots: [] })).toBe(false);
      });

      it('should handle malformed objects gracefully', () => {
        const malformedObjects = [
          'string',
          123,
          [],
          { random: 'object' },
          { name: null, slots: null },
        ];

        malformedObjects.forEach(obj => {
          expect(isValidFormation(obj as any)).toBe(false);
        });
      });
    });

    describe('isValidFormationSlot', () => {
      it('should validate correct formation slot objects', () => {
        const validSlot: FormationSlot = {
          id: 'slot-gk',
          role: 'GK',
          defaultPosition: { x: 10, y: 50 },
          playerId: null,
        };

        expect(isValidFormationSlot(validSlot)).toBe(true);
      });

      it('should reject slots with invalid structure', () => {
        // Missing id
        expect(
          isValidFormationSlot({
            defaultPosition: { x: 10, y: 50 },
          }),
        ).toBe(false);

        // Invalid id type
        expect(
          isValidFormationSlot({
            id: 123,
            defaultPosition: { x: 10, y: 50 },
          }),
        ).toBe(false);

        // Missing defaultPosition
        expect(isValidFormationSlot({ id: 'slot-1' })).toBeFalsy();

        // Invalid position coordinates
        expect(
          isValidFormationSlot({
            id: 'slot-1',
            defaultPosition: { x: 'invalid', y: 50 },
          }),
        ).toBe(false);

        expect(
          isValidFormationSlot({
            id: 'slot-1',
            defaultPosition: { x: 50, y: null },
          }),
        ).toBe(false);

        // NaN coordinates
        expect(
          isValidFormationSlot({
            id: 'slot-1',
            defaultPosition: { x: NaN, y: 50 },
          }),
        ).toBe(false);
      });
    });

    describe('isValidPlayer', () => {
      it('should validate correct player objects', () => {
        const validPlayer: Player = {
          id: 'player-1',
          name: 'Test Player',
          jerseyNumber: 10,
          position: { x: 50, y: 50 },
          roleId: 'CM',
          team: 'home',
        } as Player;

        expect(isValidPlayer(validPlayer)).toBe(true);
      });

      it('should reject players with invalid structure', () => {
        // Missing id
        expect(
          isValidPlayer({
            name: 'Test',
            position: { x: 50, y: 50 },
          }),
        ).toBe(false);

        // Invalid id type
        expect(
          isValidPlayer({
            id: 123,
            name: 'Test',
            position: { x: 50, y: 50 },
          }),
        ).toBe(false);

        // Missing name
        expect(
          isValidPlayer({
            id: 'player-1',
            position: { x: 50, y: 50 },
          }),
        ).toBe(false);

        // Invalid name type
        expect(
          isValidPlayer({
            id: 'player-1',
            name: 123,
            position: { x: 50, y: 50 },
          }),
        ).toBe(false);

        // Invalid position
        expect(
          isValidPlayer({
            id: 'player-1',
            name: 'Test',
            position: null,
          }),
        ).toBeFalsy();

        expect(
          isValidPlayer({
            id: 'player-1',
            name: 'Test',
            position: { x: 'invalid', y: 50 },
          }),
        ).toBe(false);
      });
    });

    describe('isValidPosition', () => {
      it('should validate correct position objects', () => {
        expect(isValidPosition({ x: 50, y: 50 })).toBe(true);
        expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
        expect(isValidPosition({ x: 100, y: 100 })).toBe(true);
        expect(isValidPosition({ x: -10, y: 110 })).toBe(true); // Outside bounds but valid numbers
      });

      it('should reject invalid positions', () => {
        expect(isValidPosition(null)).toBeFalsy();
        expect(isValidPosition(undefined)).toBeFalsy();
        expect(isValidPosition({ x: NaN, y: 50 })).toBe(false);
        expect(isValidPosition({ x: 50, y: Infinity })).toBe(false);
        expect(isValidPosition({ x: 'invalid', y: 50 })).toBe(false);
        expect(isValidPosition({ x: 50 })).toBe(false); // Missing y
        expect(isValidPosition({ y: 50 })).toBe(false); // Missing x
      });
    });
  });

  describe('Safe Data Access Functions', () => {
    const createValidFormation = (): Formation => ({
      id: 'test-formation',
      name: '4-4-2',
      description: 'Test formation',
      slots: [
        {
          id: 'slot-gk',
          role: 'GK',
          defaultPosition: { x: 10, y: 50 },
          playerId: 'player-gk',
        },
        {
          id: 'slot-cb1',
          role: 'CB',
          defaultPosition: { x: 25, y: 35 },
          playerId: 'player-cb1',
        },
        {
          id: 'slot-cb2',
          role: 'CB',
          defaultPosition: { x: 25, y: 65 },
          playerId: null,
        },
        {
          id: 'invalid-slot',
          role: 'CB',
          defaultPosition: { x: NaN, y: 'invalid' as any },
          playerId: 'player-invalid',
        },
      ],
      isCustom: false,
    });

    const createValidPlayers = (): Player[] => [
      {
        id: 'player-gk',
        name: 'Goalkeeper',
        jerseyNumber: 1,
        position: { x: 10, y: 50 },
        roleId: 'GK',
        team: 'home',
      } as Player,
      {
        id: 'player-cb1',
        name: 'Center Back 1',
        jerseyNumber: 4,
        position: { x: 25, y: 35 },
        roleId: 'CB',
        team: 'home',
      } as Player,
      {
        id: 'player-cm',
        name: 'Central Midfielder',
        jerseyNumber: 8,
        position: { x: 50, y: 50 },
        roleId: 'CM',
        team: 'home',
      } as Player,
      {
        id: 'player-invalid',
        name: 'Invalid Player',
        jerseyNumber: 'invalid' as any,
        position: { x: NaN, y: 'invalid' as any },
        roleId: 'ST',
        team: 'away', // Different team
      } as Player,
    ];

    describe('getFormationSlots', () => {
      it('should return valid slots from formation', () => {
        const formation = createValidFormation();
        const slots = getFormationSlots(formation);

        expect(slots).toHaveLength(3); // Should filter out invalid slot
        expect(slots.every(isValidFormationSlot)).toBe(true);
      });

      it('should handle null/undefined formations safely', () => {
        expect(getFormationSlots(null)).toEqual([]);
        expect(getFormationSlots(undefined)).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Invalid formation provided to getFormationSlots:',
          null,
        );
      });

      it('should handle invalid formations safely', () => {
        const invalidFormation = { name: 'Test', slots: 'invalid' } as any;
        expect(getFormationSlots(invalidFormation)).toEqual([]);
      });
    });

    describe('getAssignedPlayers', () => {
      it('should return players assigned to formation slots', () => {
        const formation = createValidFormation();
        const players = createValidPlayers();
        const assignedPlayers = getAssignedPlayers(formation, players);

        expect(assignedPlayers).toHaveLength(2); // GK and CB1
        expect(assignedPlayers.map(p => p.id)).toEqual(['player-gk', 'player-cb1']);
      });

      it('should handle null/undefined inputs safely', () => {
        expect(getAssignedPlayers(null, null)).toEqual([]);
        expect(getAssignedPlayers(undefined, undefined)).toEqual([]);
        expect(getAssignedPlayers(createValidFormation(), null)).toEqual([]);
        expect(getAssignedPlayers(null, createValidPlayers())).toEqual([]);
      });

      it('should filter out invalid players', () => {
        const formation = createValidFormation();
        const players = [
          ...createValidPlayers(),
          null as any,
          undefined as any,
          { id: 'invalid', position: null } as any,
        ];

        const assignedPlayers = getAssignedPlayers(formation, players);
        expect(assignedPlayers.every(isValidPlayer)).toBe(true);
      });
    });

    describe('getUnassignedPlayers', () => {
      it('should return players not assigned to formation', () => {
        const formation = createValidFormation();
        const players = createValidPlayers();
        const unassignedPlayers = getUnassignedPlayers(formation, players);

        expect(unassignedPlayers).toHaveLength(1); // Only CM player
        expect(unassignedPlayers[0].id).toBe('player-cm');
      });

      it('should filter by team when specified', () => {
        const formation = createValidFormation();
        const players = createValidPlayers();
        const homeUnassigned = getUnassignedPlayers(formation, players, 'home');
        const awayUnassigned = getUnassignedPlayers(formation, players, 'away');

        expect(homeUnassigned).toHaveLength(1);
        expect(homeUnassigned[0].id).toBe('player-cm');
        expect(awayUnassigned).toHaveLength(0);
      });

      it('should return all valid players when no formation provided', () => {
        const players = createValidPlayers();
        const unassignedPlayers = getUnassignedPlayers(null, players);

        expect(unassignedPlayers).toHaveLength(3); // All valid players
        expect(unassignedPlayers.every(isValidPlayer)).toBe(true);
      });
    });

    describe('findPlayerById', () => {
      it('should find valid player by ID', () => {
        const players = createValidPlayers();
        const foundPlayer = findPlayerById(players, 'player-gk');

        expect(foundPlayer).not.toBeNull();
        expect(foundPlayer?.id).toBe('player-gk');
      });

      it('should return null for invalid inputs', () => {
        expect(findPlayerById(null, 'player-1')).toBeNull();
        expect(findPlayerById([], null)).toBeNull();
        expect(findPlayerById([], undefined)).toBeNull();
        expect(findPlayerById(createValidPlayers(), 'non-existent')).toBeNull();
      });

      it('should return null for invalid player data', () => {
        const players = [{ id: 'invalid-player', position: null } as any];
        const foundPlayer = findPlayerById(players, 'invalid-player');

        expect(foundPlayer).toBeNull();
      });
    });

    describe('findSlotById', () => {
      it('should find valid slot by ID', () => {
        const formation = createValidFormation();
        const foundSlot = findSlotById(formation, 'slot-gk');

        expect(foundSlot).not.toBeNull();
        expect(foundSlot?.id).toBe('slot-gk');
      });

      it('should return null for invalid inputs', () => {
        expect(findSlotById(null, 'slot-1')).toBeNull();
        expect(findSlotById(createValidFormation(), null)).toBeNull();
        expect(findSlotById(createValidFormation(), 'non-existent')).toBeNull();
      });

      it('should return null for invalid slot data', () => {
        const formation = createValidFormation();
        const foundSlot = findSlotById(formation, 'invalid-slot');

        expect(foundSlot).toBeNull(); // Should filter out invalid slot
      });
    });

    describe('getPlayerPosition', () => {
      it('should return valid player position', () => {
        const player: Player = {
          id: 'test',
          name: 'Test',
          jerseyNumber: 1,
          position: { x: 75, y: 25 },
          roleId: 'ST',
          team: 'home',
        } as Player;

        const position = getPlayerPosition(player);
        expect(position).toEqual({ x: 75, y: 25 });
      });

      it('should return fallback for invalid players', () => {
        const fallback = { x: 60, y: 40 };
        expect(getPlayerPosition(null, fallback)).toEqual(fallback);
        expect(getPlayerPosition(undefined, fallback)).toEqual(fallback);
      });

      it('should return fallback for invalid positions', () => {
        const playerWithInvalidPosition = {
          id: 'test',
          name: 'Test',
          position: { x: NaN, y: 'invalid' },
        } as any;

        const position = getPlayerPosition(playerWithInvalidPosition);
        expect(position).toEqual({ x: 50, y: 50 }); // Default fallback
      });
    });

    describe('getSlotPosition', () => {
      it('should return valid slot position', () => {
        const slot: FormationSlot = {
          id: 'test-slot',
          role: 'GK',
          defaultPosition: { x: 15, y: 50 },
          playerId: null,
        };

        const position = getSlotPosition(slot);
        expect(position).toEqual({ x: 15, y: 50 });
      });

      it('should return fallback for invalid slots', () => {
        const fallback = { x: 80, y: 20 };
        expect(getSlotPosition(null, fallback)).toEqual(fallback);
        expect(getSlotPosition(undefined, fallback)).toEqual(fallback);
      });
    });

    describe('getFormationStats', () => {
      it('should calculate formation statistics correctly', () => {
        const formation = createValidFormation();
        const stats = getFormationStats(formation);

        expect(stats.totalSlots).toBe(3); // Valid slots only
        expect(stats.assignedSlots).toBe(2); // GK and CB1
        expect(stats.emptySlots).toBe(1); // CB2
        expect(stats.isComplete).toBe(false);
        expect(stats.isValid).toBe(true);
      });

      it('should handle invalid formations', () => {
        const stats = getFormationStats(null);

        expect(stats.totalSlots).toBe(0);
        expect(stats.assignedSlots).toBe(0);
        expect(stats.emptySlots).toBe(0);
        expect(stats.isComplete).toBe(true); // No slots = complete
        expect(stats.isValid).toBe(false);
      });
    });

    describe('getFormationPlayerIds', () => {
      it('should return Set of player IDs from formation', () => {
        const formation = createValidFormation();
        const playerIds = getFormationPlayerIds(formation);

        expect(playerIds).toBeInstanceOf(Set);
        expect(Array.from(playerIds)).toEqual(['player-gk', 'player-cb1']);
      });

      it('should handle invalid formations', () => {
        const playerIds = getFormationPlayerIds(null);
        expect(playerIds).toBeInstanceOf(Set);
        expect(playerIds.size).toBe(0);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('safeCalculation', () => {
      it('should execute calculation successfully', () => {
        const calculation = () => 42;
        const result = safeCalculation(calculation, 0, 'test calculation');

        expect(result).toBe(42);
      });

      it('should handle thrown errors', () => {
        const calculation = () => {
          throw new Error('Calculation failed');
        };
        const result = safeCalculation(calculation, 100, 'error test');

        expect(result).toBe(100);
      });

      it('should handle null/undefined results', () => {
        const nullCalculation = () => null;
        const undefinedCalculation = () => undefined;

        expect(safeCalculation(nullCalculation, 50, 'null test')).toBe(50);
        expect(safeCalculation(undefinedCalculation, 75, 'undefined test')).toBe(75);
      });

      it('should log warnings for null results', () => {
        const calculation = () => null;
        safeCalculation(calculation, 0, 'warning test');

        expect(consoleSpy).toHaveBeenCalledWith(
          'warning test returned null/undefined, using fallback',
        );
      });
    });

    describe('validateTrailPoints', () => {
      it('should filter valid trail points', () => {
        const mixedPoints = [
          { x: 10, y: 20 },
          null,
          { x: 30, y: 40 },
          undefined,
          { x: 'invalid', y: 50 },
          { x: 70, y: 80 },
        ];

        const validPoints = validateTrailPoints(mixedPoints);

        expect(validPoints).toHaveLength(3);
        expect(validPoints).toEqual([
          { x: 10, y: 20 },
          { x: 30, y: 40 },
          { x: 70, y: 80 },
        ]);
      });

      it('should handle non-array input', () => {
        expect(validateTrailPoints(null as any)).toEqual([]);
        expect(validateTrailPoints(undefined as any)).toEqual([]);
        expect(validateTrailPoints('string' as any)).toEqual([]);
      });
    });

    describe('safeMirrorPosition', () => {
      it('should mirror valid positions correctly', () => {
        const position = { x: 30, y: 70 };
        const mirrored = safeMirrorPosition(position);

        expect(mirrored).toEqual({ x: 70, y: 30 });
      });

      it('should handle invalid positions with fallback', () => {
        const mirroredNull = safeMirrorPosition(null);
        const mirroredUndefined = safeMirrorPosition(undefined);

        expect(mirroredNull).toEqual({ x: 50, y: 50 }); // 100 - 50 = 50
        expect(mirroredUndefined).toEqual({ x: 50, y: 50 });
      });

      it('should handle invalid position coordinates', () => {
        const invalidPosition = { x: NaN, y: 'invalid' } as any;
        const mirrored = safeMirrorPosition(invalidPosition);

        expect(mirrored).toEqual({ x: 50, y: 50 });
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      const largePlayers = Array.from({ length: 10000 }, (_, i) => ({
        id: `player-${i}`,
        name: `Player ${i}`,
        jerseyNumber: i,
        position: { x: Math.random() * 100, y: Math.random() * 100 },
        role: 'CM' as const,
        teamSide: 'home' as const,
      }));

      const start = Date.now();
      const validPlayers = largePlayers.filter(isValidPlayer);
      const end = Date.now();

      expect(validPlayers).toHaveLength(10000);
      expect(end - start).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle deeply nested invalid objects', () => {
      const deeplyInvalid = {
        formation: {
          invalid: {
            nested: {
              object: {
                with: {
                  many: {
                    levels: null,
                  },
                },
              },
            },
          },
        },
      };

      expect(isValidFormation(deeplyInvalid as any)).toBe(false);
      expect(getFormationSlots(deeplyInvalid as any)).toEqual([]);
    });

    it('should handle circular references safely', () => {
      const circularObject: any = { name: 'Test' };
      circularObject.self = circularObject;

      expect(() => isValidFormation(circularObject)).not.toThrow();
      expect(isValidFormation(circularObject)).toBe(false);
    });

    it('should handle extreme numeric values', () => {
      const extremePosition = {
        x: Number.MAX_SAFE_INTEGER,
        y: Number.MIN_SAFE_INTEGER,
      };

      expect(isValidPosition(extremePosition)).toBe(true);

      const infinitePosition = {
        x: Infinity,
        y: -Infinity,
      };

      expect(isValidPosition(infinitePosition)).toBe(false);
    });
  });
});
