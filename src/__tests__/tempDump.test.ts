import { describe, it } from 'vitest';
import { createTestData } from './utils/comprehensive-test-providers';

describe('temp dump', () => {
  it('logs bench positions', () => {
    const testData = createTestData.complete();
    const testPlayers = testData.players.slice(11, 22);
    const positions = testPlayers.map(player => String(player.position));

    throw new Error(JSON.stringify({ length: testPlayers.length, positions }));
  });
});
