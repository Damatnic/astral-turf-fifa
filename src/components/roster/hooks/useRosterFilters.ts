/**
 * useRosterFilters Hook
 *
 * Custom hook for managing roster filtering logic
 */

import { useMemo, useCallback } from 'react';
import type { Player } from '../../../types/index';
import type { RosterFilters, UseRosterFiltersReturn, RosterSort } from '../../../types/roster';
import { matchesFilters, sortPlayers } from '../utils/rosterHelpers';

export function useRosterFilters(
  players: Player[],
  filters: RosterFilters,
  sort: RosterSort,
): UseRosterFiltersReturn {
  // Apply filters to players
  const filteredPlayers = useMemo(() => {
    const filtered = players.filter(player => matchesFilters(player, filters));
    return sortPlayers(filtered, sort);
  }, [players, filters, sort]);

  // Update filters (this would be handled by parent component's dispatch)
  const updateFilters = useCallback(
    (newFilters: Partial<RosterFilters>) => {
      // This is a placeholder - actual implementation would dispatch action
      console.log('Updating filters:', newFilters);
    },
    [],
  );

  // Reset filters to default
  const resetFilters = useCallback(() => {
    // This is a placeholder - actual implementation would dispatch action
    console.log('Resetting filters');
  }, []);

  // Apply filters (trigger re-filter)
  const applyFilters = useCallback(() => {
    // Filters are applied automatically via useMemo
    console.log('Applying filters');
  }, []);

  return {
    filteredPlayers,
    activeFilters: filters,
    updateFilters,
    resetFilters,
    applyFilters,
  };
}
