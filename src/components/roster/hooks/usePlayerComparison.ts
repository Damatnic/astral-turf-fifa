/**
 * usePlayerComparison Hook
 *
 * Custom hook for managing player comparison functionality
 */

import { useMemo } from 'react';
import type { Player } from '../../../types/index';
import type { UsePlayerComparisonReturn, PlayerComparisonStats } from '../../../types/roster';
import { calculateComparisonStats } from '../utils/rosterHelpers';

export function usePlayerComparison(
  players: Player[],
  comparisonPlayerIds: string[],
  maxPlayers: number = 4,
): UsePlayerComparisonReturn {
  // Get players in comparison
  const comparisonPlayers = useMemo(() => {
    return players.filter(p => comparisonPlayerIds.includes(p.id));
  }, [players, comparisonPlayerIds]);

  // Calculate comparison stats
  const comparisonStats = useMemo<PlayerComparisonStats[]>(() => {
    return comparisonPlayers.map(player => calculateComparisonStats(player));
  }, [comparisonPlayers]);

  // Check if can add more players
  const canAddMore = comparisonPlayerIds.length < maxPlayers;

  // Placeholder functions (would be implemented by parent component)
  const addToComparison = (playerId: string) => {
    console.log('Add to comparison:', playerId);
  };

  const removeFromComparison = (playerId: string) => {
    console.log('Remove from comparison:', playerId);
  };

  const clearComparison = () => {
    console.log('Clear comparison');
  };

  return {
    comparisonPlayers,
    comparisonStats,
    addToComparison,
    removeFromComparison,
    clearComparison,
    canAddMore,
    maxPlayers,
  };
}
