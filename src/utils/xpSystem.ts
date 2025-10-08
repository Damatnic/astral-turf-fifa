/**
 * XP and Leveling System
 * 
 * Handles all XP calculations, level progression, and rank determination
 */

import type { PlayerRank } from '../components/player/UltimatePlayerCard';

/**
 * Calculate player level based on total XP
 */
export function calculateLevel(totalXP: number): number {
  if (totalXP < 0) return 1;
  
  let level = 1;
  let xpRequired = 0;
  
  // Calculate level by accumulating XP requirements
  while (level < 99) {
    const nextLevelXP = calculateXPForLevel(level + 1);
    if (xpRequired + nextLevelXP > totalXP) {
      break;
    }
    xpRequired += nextLevelXP;
    level++;
  }
  
  return level;
}

/**
 * Calculate XP required to reach a specific level
 * Uses progressive scaling - harder to level up as you progress
 */
export function calculateXPForLevel(level: number): number {
  if (level <= 1) return 0;
  
  // Progressive XP curve formula
  // Level 2 = 100 XP, Level 10 = 700 XP, Level 50 = 7,600 XP
  return Math.floor(100 + (level * 50) + (level * level * 2));
}

/**
 * Get total XP required to reach a specific level
 */
export function getTotalXPForLevel(level: number): number {
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += calculateXPForLevel(i);
  }
  return totalXP;
}

/**
 * Get XP needed to reach next level from current XP
 */
export function getXPToNextLevel(currentXP: number, currentLevel: number): number {
  const totalXPForCurrentLevel = getTotalXPForLevel(currentLevel);
  const totalXPForNextLevel = getTotalXPForLevel(currentLevel + 1);
  const xpIntoCurrentLevel = currentXP - totalXPForCurrentLevel;
  const xpNeededForNextLevel = totalXPForNextLevel - totalXPForCurrentLevel;
  
  return xpNeededForNextLevel - xpIntoCurrentLevel;
}

/**
 * Get XP progress percentage within current level
 */
export function getXPProgressPercent(currentXP: number, currentLevel: number): number {
  const totalXPForCurrentLevel = getTotalXPForLevel(currentLevel);
  const totalXPForNextLevel = getTotalXPForLevel(currentLevel + 1);
  const xpIntoCurrentLevel = currentXP - totalXPForCurrentLevel;
  const xpNeededForNextLevel = totalXPForNextLevel - totalXPForCurrentLevel;
  
  return Math.min(100, Math.max(0, (xpIntoCurrentLevel / xpNeededForNextLevel) * 100));
}

/**
 * Determine rank based on level
 */
export function calculateRank(level: number): PlayerRank {
  if (level <= 10) return 'bronze';
  if (level <= 25) return 'silver';
  if (level <= 50) return 'gold';
  if (level <= 75) return 'diamond';
  return 'legend';
}

/**
 * Get rank progress percentage within current rank tier
 */
export function getRankProgress(level: number): number {
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
 * Get level range for a rank
 */
export function getLevelRangeForRank(rank: PlayerRank): { min: number; max: number } {
  const ranges: Record<PlayerRank, { min: number; max: number }> = {
    bronze: { min: 1, max: 10 },
    silver: { min: 11, max: 25 },
    gold: { min: 26, max: 50 },
    diamond: { min: 51, max: 75 },
    legend: { min: 76, max: 99 },
  };
  
  return ranges[rank];
}

/**
 * Calculate rewards for leveling up
 */
export function getLevelUpRewards(newLevel: number): {
  attributePoints: number;
  specialReward?: string;
  badgeReward?: string;
} {
  const rewards = {
    attributePoints: 1,
    specialReward: undefined as string | undefined,
    badgeReward: undefined as string | undefined,
  };

  // Bonus rewards at milestone levels
  if (newLevel % 10 === 0) {
    rewards.attributePoints = 3;
    rewards.specialReward = `Level ${newLevel} Milestone!`;
    rewards.badgeReward = `level-${newLevel}`;
  } else if (newLevel % 5 === 0) {
    rewards.attributePoints = 2;
  }

  // Rank-up rewards
  const rank = calculateRank(newLevel);
  const prevRank = calculateRank(newLevel - 1);
  if (rank !== prevRank) {
    rewards.specialReward = `Promoted to ${rank.toUpperCase()}!`;
    rewards.badgeReward = `rank-${rank}`;
    rewards.attributePoints += 5; // Bonus points for ranking up
  }

  return rewards;
}

/**
 * Check if player leveled up
 */
export function didLevelUp(oldXP: number, newXP: number): boolean {
  const oldLevel = calculateLevel(oldXP);
  const newLevel = calculateLevel(newXP);
  return newLevel > oldLevel;
}

/**
 * Check if player ranked up
 */
export function didRankUp(oldXP: number, newXP: number): boolean {
  const oldLevel = calculateLevel(oldXP);
  const newLevel = calculateLevel(newXP);
  const oldRank = calculateRank(oldLevel);
  const newRank = calculateRank(newLevel);
  return newRank !== oldRank;
}

/**
 * Get XP multiplier based on streak
 */
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1.0;
}

/**
 * Calculate XP with multipliers
 */
export function calculateXPWithMultipliers(
  baseXP: number,
  options: {
    streakDays?: number;
    difficultyMultiplier?: number;
    teamBonus?: boolean;
  } = {}
): number {
  let totalXP = baseXP;

  // Apply streak multiplier
  if (options.streakDays) {
    totalXP *= getStreakMultiplier(options.streakDays);
  }

  // Apply difficulty multiplier
  if (options.difficultyMultiplier) {
    totalXP *= options.difficultyMultiplier;
  }

  // Apply team bonus (10% extra)
  if (options.teamBonus) {
    totalXP *= 1.1;
  }

  return Math.floor(totalXP);
}

