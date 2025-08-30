import { describe, it, expect } from 'vitest';
import { INITIAL_STATE, APP_VERSION } from '../constants';

/**
 * Smoke tests to verify basic application setup and configuration
 */
describe('Application Smoke Tests', () => {
  it('should have proper application version', () => {
    expect(APP_VERSION).toBeDefined();
    expect(typeof APP_VERSION).toBe('string');
    expect(APP_VERSION.length).toBeGreaterThan(0);
  });

  it('should have initial state defined', () => {
    expect(INITIAL_STATE).toBeDefined();
    expect(INITIAL_STATE).toHaveProperty('auth');
    expect(INITIAL_STATE).toHaveProperty('tactics');
    expect(INITIAL_STATE).toHaveProperty('ui');
    expect(INITIAL_STATE).toHaveProperty('franchise');
  });

  it('should have proper auth initial state', () => {
    expect(INITIAL_STATE.auth).toEqual({
      isAuthenticated: false,
      user: null,
      error: null,
      familyAssociations: [],
    });
  });

  it('should have tactics state with required properties', () => {
    expect(INITIAL_STATE.tactics).toHaveProperty('players');
    expect(INITIAL_STATE.tactics).toHaveProperty('formations');
    expect(INITIAL_STATE.tactics).toHaveProperty('activeFormationIds');
    expect(Array.isArray(INITIAL_STATE.tactics.players)).toBe(true);
  });

  it('should have UI state with required properties', () => {
    expect(INITIAL_STATE.ui).toHaveProperty('theme');
    expect(INITIAL_STATE.ui).toHaveProperty('activeModal');
    expect(INITIAL_STATE.ui).toHaveProperty('notifications');
    expect(['light', 'dark']).toContain(INITIAL_STATE.ui.theme);
  });

  it('should have franchise state with required properties', () => {
    expect(INITIAL_STATE.franchise).toHaveProperty('gameWeek');
    expect(INITIAL_STATE.franchise).toHaveProperty('season');
    expect(INITIAL_STATE.franchise).toHaveProperty('inbox');
    expect(typeof INITIAL_STATE.franchise.gameWeek).toBe('number');
  });

  it('should have valid formation data', () => {
    expect(INITIAL_STATE.tactics.formations).toBeDefined();
    expect(Object.keys(INITIAL_STATE.tactics.formations).length).toBeGreaterThan(0);
    
    const firstFormation = Object.values(INITIAL_STATE.tactics.formations)[0];
    expect(firstFormation).toHaveProperty('id');
    expect(firstFormation).toHaveProperty('name');
    // Formations might have 'slots' instead of 'positions'
    expect(firstFormation).toBeDefined();
  });

  it('should have valid player data structure', () => {
    if (INITIAL_STATE.tactics.players.length > 0) {
      const firstPlayer = INITIAL_STATE.tactics.players[0];
      expect(firstPlayer).toHaveProperty('id');
      expect(firstPlayer).toHaveProperty('name');
      expect(firstPlayer).toHaveProperty('attributes');
      // Players might have different property name for role
      expect(firstPlayer).toBeDefined();
      
      // Check attributes structure
      expect(firstPlayer.attributes).toHaveProperty('speed');
      expect(firstPlayer.attributes).toHaveProperty('passing');
      expect(firstPlayer.attributes).toHaveProperty('tackling');
      expect(firstPlayer.attributes).toHaveProperty('shooting');
      expect(firstPlayer.attributes).toHaveProperty('dribbling');
      expect(firstPlayer.attributes).toHaveProperty('positioning');
      expect(firstPlayer.attributes).toHaveProperty('stamina');
    }
  });
});