/**
 * Tactical Features Functional Tests
 * Updated to match current Formation API (slots instead of positions)
 */

import { describe, it, expect } from 'vitest';
import TacticalIntegrationService from '../../services/tacticalIntegrationService';
import { type Formation, type FormationSlot } from '../../types';

describe('Tactical Features Tests', () => {
  const createTestFormation = (): Formation => {
    const slots: FormationSlot[] = [
      { id: 's1', role: 'GK', defaultPosition: { x: 50, y: 5 }, playerId: 'p1' },
      { id: 's2', role: 'CB', defaultPosition: { x: 35, y: 20 }, playerId: 'p2' },
      { id: 's3', role: 'CB', defaultPosition: { x: 65, y: 20 }, playerId: 'p3' },
    ];
    return { id: 'test-formation', name: 'Test Formation', slots };
  };

  it('should validate formation structure', () => {
    const formation = createTestFormation();
    const isValid = TacticalIntegrationService.validateFormation(formation);
    expect(isValid).toBe(true);
  });

  it('should export and import formations', () => {
    const formation = createTestFormation();
    const exported = TacticalIntegrationService.exportFormation(formation);
    const imported = TacticalIntegrationService.importFormation(exported);

    expect(imported).toBeDefined();
    expect(imported?.id).toBe(formation.id);
    expect(imported?.slots.length).toBe(3);
  });

  it('should validate slot positions', () => {
    const formation = createTestFormation();
    formation.slots.forEach(slot => {
      expect(slot.defaultPosition.x).toBeGreaterThanOrEqual(0);
      expect(slot.defaultPosition.x).toBeLessThanOrEqual(100);
      expect(slot.defaultPosition.y).toBeGreaterThanOrEqual(0);
      expect(slot.defaultPosition.y).toBeLessThanOrEqual(100);
    });
  });
});
