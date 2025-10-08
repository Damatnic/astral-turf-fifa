/**
 * usePlayerCardUpdates Hook
 * 
 * Provides real-time player card data with automatic updates
 * when XP, challenges, or achievements change
 */

import { useEffect, useMemo } from 'react';
import { useChallengeContext } from '../context/ChallengeContext';
import { useTacticsContext } from '../hooks';
import { convertToPlayerProgression } from '../utils/playerCardIntegration';
import { calculateLevel, calculateRank, didLevelUp, didRankUp } from '../utils/xpSystem';
import type { Player } from '../types';
import type { PlayerProgression } from '../components/player/UltimatePlayerCard';

interface UsePlayerCardUpdatesResult {
  player: Player | undefined;
  progression: PlayerProgression | null;
  isLoading: boolean;
  hasLeveledUp: boolean;
  hasRankedUp: boolean;
}

export const usePlayerCardUpdates = (playerId: string): UsePlayerCardUpdatesResult => {
  const { state: challengeState } = useChallengeContext();
  const { tacticsState } = useTacticsContext();

  // Get player data
  const player = useMemo(
    () => tacticsState.players.find(p => p.id === playerId),
    [tacticsState.players, playerId]
  );

  // Get player profile
  const profile = useMemo(
    () => challengeState.playerProfiles.get(playerId),
    [challengeState.playerProfiles, playerId]
  );

  // Convert to progression format
  const progression = useMemo(() => {
    if (!profile || !player) return null;
    return convertToPlayerProgression(profile, player);
  }, [profile, player]);

  // Check for level/rank changes
  const hasLeveledUp = useMemo(() => {
    if (!profile) return false;
    const calculatedLevel = calculateLevel(profile.totalXP);
    return calculatedLevel > profile.currentLevel;
  }, [profile]);

  const hasRankedUp = useMemo(() => {
    if (!profile) return false;
    const calculatedLevel = calculateLevel(profile.totalXP);
    const calculatedRank = calculateRank(calculatedLevel);
    const currentRank = calculateRank(profile.currentLevel);
    return calculatedRank !== currentRank;
  }, [profile]);

  const isLoading = !player || !profile;

  return {
    player,
    progression,
    isLoading,
    hasLeveledUp,
    hasRankedUp,
  };
};

/**
 * Hook to get all players with their progressions (for leaderboards)
 */
export const useAllPlayerCards = () => {
  const { state: challengeState } = useChallengeContext();
  const { tacticsState } = useTacticsContext();

  const playersWithProgressions = useMemo(() => {
    return tacticsState.players
      .map(player => {
        const profile = challengeState.playerProfiles.get(player.id);
        if (!profile) return null;

        return {
          player,
          progression: convertToPlayerProgression(profile, player),
        };
      })
      .filter((item): item is { player: Player; progression: PlayerProgression } => item !== null)
      .sort((a, b) => b.progression.level - a.progression.level); // Sort by level descending
  }, [challengeState.playerProfiles, tacticsState.players]);

  return playersWithProgressions;
};

/**
 * Hook to compare two players
 */
export const usePlayerComparison = (player1Id: string, player2Id: string) => {
  const player1Data = usePlayerCardUpdates(player1Id);
  const player2Data = usePlayerCardUpdates(player2Id);

  const comparison = useMemo(() => {
    if (!player1Data.progression || !player2Data.progression) return null;

    return {
      levelDifference: player1Data.progression.level - player2Data.progression.level,
      xpDifference: player1Data.progression.currentXP - player2Data.progression.currentXP,
      rankDifference: getRankValue(player1Data.progression.rank) - getRankValue(player2Data.progression.rank),
      challengesDifference: player1Data.progression.totalChallengesCompleted - player2Data.progression.totalChallengesCompleted,
      achievementsDifference: player1Data.progression.achievements.length - player2Data.progression.achievements.length,
    };
  }, [player1Data.progression, player2Data.progression]);

  return {
    player1: player1Data,
    player2: player2Data,
    comparison,
  };
};

// Helper function to get numeric rank value for comparison
function getRankValue(rank: string): number {
  const rankValues: Record<string, number> = {
    bronze: 1,
    silver: 2,
    gold: 3,
    diamond: 4,
    legend: 5,
  };
  return rankValues[rank] || 0;
}

