import type { Formation, Player, TacticsState } from '../types';

/**
 * Tactical Integration Service
 * Provides integration utilities for tactical board operations
 */

export interface TacticalIntegrationOptions {
  validateFormation?: boolean;
  autoAssignPlayers?: boolean;
  preservePositions?: boolean;
}

export class TacticalIntegrationService {
  /**
   * Validates a formation structure
   */
  static validateFormation(formation: Formation): boolean {
    if (!formation || !formation.id || !formation.name) {
      return false;
    }

    if (!Array.isArray(formation.slots) || formation.slots.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Assigns players to formation slots
   */
  static assignPlayersToFormation(
    formation: Formation,
    players: Player[],
    options: TacticalIntegrationOptions = {}
  ): Formation {
    const { autoAssignPlayers = true } = options;

    if (!autoAssignPlayers) {
      return formation;
    }

    const updatedSlots = formation.slots.map((slot, index) => {
      if (slot.playerId) {
        return slot;
      }

      const availablePlayer = players[index];
      return availablePlayer ? { ...slot, playerId: availablePlayer.id } : slot;
    });

    return {
      ...formation,
      slots: updatedSlots,
    };
  }

  /**
   * Merges tactics state with new data
   */
  static mergeTacticsState(
    currentState: Partial<TacticsState>,
    updates: Partial<TacticsState>
  ): Partial<TacticsState> {
    return {
      ...currentState,
      ...updates,
    };
  }

  /**
   * Exports formation data
   */
  static exportFormation(formation: Formation): string {
    return JSON.stringify(formation, null, 2);
  }

  /**
   * Imports formation from JSON
   */
  static importFormation(jsonData: string): Formation | null {
    try {
      const formation = JSON.parse(jsonData);
      return this.validateFormation(formation) ? formation : null;
    } catch {
      return null;
    }
  }

  /**
   * Gets player by ID from tactics state
   */
  static getPlayerById(tacticsState: Partial<TacticsState>, playerId: string): Player | undefined {
    return tacticsState.players?.find(p => p.id === playerId);
  }

  /**
   * Calculates formation strength
   */
  static calculateFormationStrength(formation: Formation, players: Player[]): number {
    const assignedPlayers = formation.slots
      .filter(slot => slot.playerId)
      .map(slot => players.find(p => p.id === slot.playerId))
      .filter((p): p is Player => p !== undefined);

    if (assignedPlayers.length === 0) {
      return 0;
    }

    const totalRating = assignedPlayers.reduce((sum, player) => {
      const avgAttributes = Object.values(player.attributes).reduce((a, b) => a + b, 0) / 7;
      return sum + avgAttributes;
    }, 0);

    return Math.round(totalRating / assignedPlayers.length);
  }
}

export default TacticalIntegrationService;
