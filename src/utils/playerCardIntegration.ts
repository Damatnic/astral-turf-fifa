/**
 * Player Card Integration Utilities
 * 
 * Converts existing PlayerRankingProfile data to UltimatePlayerCard format
 */

import type { PlayerRankingProfile, PlayerBadge } from '../types/challenges';
import type { Player } from '../types';
import type { PlayerProgression, Achievement, PlayerRank, CardRarity } from '../components/player/UltimatePlayerCard';
import { checkNewAchievements } from './achievementSystem';

/**
 * Converts PlayerRankingProfile to PlayerProgression for UltimatePlayerCard
 */
export function convertToPlayerProgression(
  profile: PlayerRankingProfile,
  player: Player,
  options: { checkAchievements?: boolean } = {}
): PlayerProgression {
  // Calculate rank based on level
  const rank = calculateRank(profile.currentLevel);
  
  // Convert badges to achievements
  let achievements = convertBadgesToAchievements(profile.badges);
  
  // Check for new achievements if requested
  if (options.checkAchievements) {
    const newAchievements = checkNewAchievements(profile, player, achievements);
    achievements = [...achievements, ...newAchievements];
  }
  
  // Calculate rank progress (percentage within current rank tier)
  const rankProgress = calculateRankProgress(profile.currentLevel);
  
  // Calculate career stats from available data
  // These are estimated from challenges completed and XP earned
  const careerStats = {
    matches: Math.floor(profile.totalXP / 100), // ~1 match per 100 XP
    goals: Math.floor(profile.challengesCompleted.length * 0.6), // Estimated scoring rate
    assists: Math.floor(profile.challengesCompleted.length * 0.4), // Estimated assist rate
    winRate: Math.min(95, 50 + (profile.currentLevel * 0.5)), // Win rate improves with level
  };

  return {
    currentXP: profile.totalXP,
    xpToNextLevel: profile.xpToNextLevel,
    level: profile.currentLevel,
    rank,
    rankProgress,
    totalChallengesCompleted: profile.challengesCompleted?.length || 0,
    achievements,
    streakDays: profile.streakDays || 0,
    isShiny: profile.badges?.some(b => b.rarity === 'legendary') || achievements.some(a => a.rarity === 'legendary' || a.rarity === 'mythic'),
    careerStats,
  };
}

/**
 * Calculate player rank based on level
 */
function calculateRank(level: number): PlayerRank {
  if (level <= 10) return 'bronze';
  if (level <= 25) return 'silver';
  if (level <= 50) return 'gold';
  if (level <= 75) return 'diamond';
  return 'legend';
}

/**
 * Calculate rank progress within current tier
 */
function calculateRankProgress(level: number): number {
  if (level <= 10) {
    return (level / 10) * 100;
  }
  if (level <= 25) {
    return ((level - 10) / 15) * 100;
  }
  if (level <= 50) {
    return ((level - 25) / 25) * 100;
  }
  if (level <= 75) {
    return ((level - 50) / 25) * 100;
  }
  return ((level - 75) / 24) * 100;
}

/**
 * Convert PlayerBadges to Achievements
 */
function convertBadgesToAchievements(badges: PlayerBadge[]): Achievement[] {
  if (!badges || badges.length === 0) return [];

  return badges.map(badge => ({
    id: badge.badgeId,
    name: badge.name || 'Achievement',
    description: badge.description || '',
    icon: getBadgeIcon(badge),
    rarity: mapBadgeRarityToCardRarity(badge.rarity),
    unlockedAt: badge.earnedAt ? new Date(badge.earnedAt) : undefined,
  }));
}

/**
 * Get icon for badge based on category
 */
function getBadgeIcon(badge: PlayerBadge): string {
  // Map badge categories to emoji icons
  const categoryIcons: Record<string, string> = {
    achievement: '🏆',
    milestone: '⭐',
    special: '💎',
    seasonal: '🎁',
    fitness: '💪',
    technical: '⚽',
    tactical: '🧠',
    mental: '🎯',
  };

  return badge.iconUrl || categoryIcons[badge.category] || '🏅';
}

/**
 * Map BadgeRarity to CardRarity
 */
function mapBadgeRarityToCardRarity(rarity: string): CardRarity {
  const rarityMap: Record<string, CardRarity> = {
    common: 'common',
    uncommon: 'rare',
    rare: 'epic',
    epic: 'legendary',
    legendary: 'mythic',
  };

  return rarityMap[rarity as string] || 'common';
}

/**
 * Calculate XP required for next level
 */
export function calculateXPForLevel(level: number): number {
  // Progressive XP scaling
  return Math.floor(100 + (level * 50) + (level * level * 2));
}

/**
 * Get all players with their progressions for leaderboard
 */
export function getPlayersWithProgressions(
  players: Player[],
  profiles: Record<string, PlayerRankingProfile>
): Array<{ player: Player; progression: PlayerProgression }> {
  return players
    .map(player => {
      const profile = profiles[player.id];
      if (!profile) return null;

      return {
        player,
        progression: convertToPlayerProgression(profile, player),
      };
    })
    .filter((item): item is { player: Player; progression: PlayerProgression } => item !== null)
    .sort((a, b) => b.progression.level - a.progression.level);
}

/**
 * Check if player can level up
 */
export function canLevelUp(profile: PlayerRankingProfile): boolean {
  return profile.totalXP >= profile.xpToNextLevel;
}

/**
 * Get level up rewards
 */
export function getLevelUpRewards(newLevel: number): {
  attributePoints: number;
  specialReward?: string;
} {
  const rewards = {
    attributePoints: 1,
    specialReward: undefined as string | undefined,
  };

  // Bonus rewards at milestone levels
  if (newLevel % 10 === 0) {
    rewards.attributePoints = 3;
    rewards.specialReward = `Level ${newLevel} Milestone Reached!`;
  } else if (newLevel % 5 === 0) {
    rewards.attributePoints = 2;
  }

  return rewards;
}

