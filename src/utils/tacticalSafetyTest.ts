/**
 * Test suite for tactical safety improvements
 * This file tests all the defensive programming measures we implemented
 */

import {
  isValidFormation,
  isValidFormationSlot,
  isValidPlayer,
  isValidPosition,
  getFormationSlots,
  getAssignedPlayers,
  findPlayerById,
  findSlotById,
  getPlayerPosition,
  getSlotPosition,
  getFormationStats,
  getFormationPlayerIds,
  safeCalculation,
  validateTrailPoints,
  safeMirrorPosition,
} from './tacticalDataGuards';

// Test data with various edge cases
const validPosition = { x: 50, y: 50 };
const invalidPosition1 = { x: NaN, y: 50 };
const invalidPosition2 = { x: 50, y: undefined };
const invalidPosition3 = null;

const validPlayer = {
  id: 'player1',
  name: 'Test Player',
  position: validPosition,
  team: 'home',
};

const invalidPlayer1 = {
  id: 'player2',
  name: 'Invalid Player',
  position: invalidPosition1,
  team: 'home',
};

const invalidPlayer2 = null;

const validSlot = {
  id: 'slot1',
  defaultPosition: validPosition,
  playerId: 'player1',
  roleId: 'MF',
};

const invalidSlot1 = {
  id: 'slot2',
  defaultPosition: invalidPosition1,
  playerId: 'player2',
};

const invalidSlot2 = null;

const validFormation = {
  id: 'formation1',
  name: '4-4-2',
  slots: [validSlot, invalidSlot1].filter(Boolean),
};

const invalidFormation1 = {
  id: 'formation2',
  name: 'Invalid Formation',
  slots: null,
};

const invalidFormation2 = null;

// Test results container
const testResults = {
  passed: 0,
  failed: 0,
  errors: [] as string[],
};

function runTest(testName: string, testFn: () => boolean) {
  try {
    if (testFn()) {
      testResults.passed++;
      console.log(`✅ ${testName}`);
    } else {
      testResults.failed++;
      testResults.errors.push(testName);
      console.log(`❌ ${testName}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`${testName} - ${(error as Error).message}`);
    console.log(`💥 ${testName} - ${(error as Error).message}`);
  }
}

export function runTacticalSafetyTests() {
  console.log('🛡️ Running Tactical Safety Tests...\n');

  // Type guard tests
  runTest('isValidPosition accepts valid position', () => isValidPosition(validPosition));
  runTest('isValidPosition rejects NaN position', () => !isValidPosition(invalidPosition1));
  runTest('isValidPosition rejects undefined position', () => !isValidPosition(invalidPosition2));
  runTest('isValidPosition rejects null position', () => !isValidPosition(invalidPosition3));

  runTest('isValidPlayer accepts valid player', () => isValidPlayer(validPlayer));
  runTest('isValidPlayer rejects invalid player position', () => !isValidPlayer(invalidPlayer1));
  runTest('isValidPlayer rejects null player', () => !isValidPlayer(invalidPlayer2));

  runTest('isValidFormationSlot accepts valid slot', () => isValidFormationSlot(validSlot));
  runTest(
    'isValidFormationSlot rejects invalid slot position',
    () => !isValidFormationSlot(invalidSlot1),
  );
  runTest('isValidFormationSlot rejects null slot', () => !isValidFormationSlot(invalidSlot2));

  runTest('isValidFormation accepts valid formation', () => isValidFormation(validFormation));
  runTest(
    'isValidFormation rejects formation with null slots',
    () => !isValidFormation(invalidFormation1),
  );
  runTest('isValidFormation rejects null formation', () => !isValidFormation(invalidFormation2));

  // Safe accessor tests
  runTest('getFormationSlots filters invalid slots', () => {
    const slots = getFormationSlots(validFormation as any);
    return slots.length === 1 && slots[0].id === 'slot1';
  });

  runTest('getFormationSlots handles null formation', () => {
    const slots = getFormationSlots(null);
    return slots.length === 0;
  });

  runTest('findPlayerById finds valid player', () => {
    const player = findPlayerById([validPlayer as any, invalidPlayer1 as any], 'player1');
    return player?.id === 'player1';
  });

  runTest('findPlayerById returns null for invalid players', () => {
    const player = findPlayerById([invalidPlayer1 as any], 'player2');
    return player === null;
  });

  runTest('getPlayerPosition returns valid position', () => {
    const pos = getPlayerPosition(validPlayer as any);
    return pos.x === 50 && pos.y === 50;
  });

  runTest('getPlayerPosition returns fallback for invalid player', () => {
    const pos = getPlayerPosition(invalidPlayer1 as any, { x: 25, y: 25 });
    return pos.x === 25 && pos.y === 25;
  });

  // Animation trail tests
  runTest('validateTrailPoints filters invalid points', () => {
    const points = validateTrailPoints([
      validPosition,
      invalidPosition1,
      invalidPosition2,
      { x: 75, y: 75 },
    ]);
    return points.length === 2;
  });

  runTest('validateTrailPoints handles non-array input', () => {
    const points = validateTrailPoints(null as any);
    return points.length === 0;
  });

  // Safe calculation tests
  runTest('safeCalculation returns result for valid calculation', () => {
    const result = safeCalculation(() => 42, 0, 'test');
    return result === 42;
  });

  runTest('safeCalculation returns fallback for throwing calculation', () => {
    const result = safeCalculation(
      () => {
        throw new Error('test');
      },
      99,
      'test',
    );
    return result === 99;
  });

  runTest('safeCalculation returns fallback for null result', () => {
    const result = safeCalculation(() => null, 88, 'test');
    return result === 88;
  });

  // Mirror position tests
  runTest('safeMirrorPosition mirrors valid position', () => {
    const mirrored = safeMirrorPosition({ x: 25, y: 75 });
    return mirrored.x === 75 && mirrored.y === 25;
  });

  runTest('safeMirrorPosition handles invalid position', () => {
    const mirrored = safeMirrorPosition(invalidPosition1);
    return mirrored.x === 50 && mirrored.y === 50;
  });

  // Formation statistics
  runTest('getFormationStats calculates correctly', () => {
    const stats = getFormationStats(validFormation as any);
    return stats.totalSlots === 1 && stats.assignedSlots === 1 && stats.isValid;
  });

  runTest('getFormationStats handles null formation', () => {
    const stats = getFormationStats(null);
    return stats.totalSlots === 0 && !stats.isValid;
  });

  // Formation player IDs
  runTest('getFormationPlayerIds extracts valid player IDs', () => {
    const ids = getFormationPlayerIds(validFormation as any);
    return ids.has('player1') && ids.size === 1;
  });

  runTest('getFormationPlayerIds handles null formation', () => {
    const ids = getFormationPlayerIds(null);
    return ids.size === 0;
  });

  // Summary
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(
    `📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`,
  );

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => console.log(`  - ${error}`));
  }

  return testResults.failed === 0;
}

// Export test data for external testing
export const testData = {
  validPosition,
  invalidPosition1,
  invalidPosition2,
  validPlayer,
  invalidPlayer1,
  validSlot,
  invalidSlot1,
  validFormation,
  invalidFormation1,
};
