/**
 * Achievement System
 * 
 * Automatically checks and unlocks achievements based on player actions
 */

import type { Achievement, CardRarity } from '../components/player/UltimatePlayerCard';
import type { PlayerRankingProfile } from '../types/challenges';
import type { Player } from '../types';

// Achievement definitions
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: CardRarity;
  checkCondition: (profile: PlayerRankingProfile, player: Player) => boolean;
  category: 'progress' | 'challenge' | 'skill' | 'special' | 'career';
}

// All available achievements
export const ALL_ACHIEVEMENTS: AchievementDefinition[] = [
  // === PROGRESS ACHIEVEMENTS ===
  {
    id: 'ach-first-steps',
    name: 'First Steps',
    description: 'Reach level 5',
    icon: '👶',
    rarity: 'common',
    category: 'progress',
    checkCondition: (profile) => profile.currentLevel >= 5,
  },
  {
    id: 'ach-rising-star',
    name: 'Rising Star',
    description: 'Reach level 10',
    icon: '⭐',
    rarity: 'common',
    category: 'progress',
    checkCondition: (profile) => profile.currentLevel >= 10,
  },
  {
    id: 'ach-silver-standard',
    name: 'Silver Standard',
    description: 'Reach Silver rank',
    icon: '🥈',
    rarity: 'rare',
    category: 'progress',
    checkCondition: (profile) => profile.currentLevel >= 11,
  },
  {
    id: 'ach-golden-player',
    name: 'Golden Player',
    description: 'Reach Gold rank',
    icon: '🥇',
    rarity: 'epic',
    category: 'progress',
    checkCondition: (profile) => profile.currentLevel >= 26,
  },
  {
    id: 'ach-diamond-elite',
    name: 'Diamond Elite',
    description: 'Reach Diamond rank',
    icon: '💎',
    rarity: 'epic',
    category: 'progress',
    checkCondition: (profile) => profile.currentLevel >= 51,
  },
  {
    id: 'ach-living-legend',
    name: 'Living Legend',
    description: 'Reach Legend rank',
    icon: '👑',
    rarity: 'legendary',
    category: 'progress',
    checkCondition: (profile) => profile.currentLevel >= 76,
  },
  {
    id: 'ach-max-level',
    name: 'Peak Performance',
    description: 'Reach level 99',
    icon: '🏔️',
    rarity: 'mythic',
    category: 'progress',
    checkCondition: (profile) => profile.currentLevel >= 99,
  },

  // === CHALLENGE ACHIEVEMENTS ===
  {
    id: 'ach-first-challenge',
    name: 'Challenge Accepted',
    description: 'Complete your first challenge',
    icon: '✅',
    rarity: 'common',
    category: 'challenge',
    checkCondition: (profile) => profile.challengesCompleted.length >= 1,
  },
  {
    id: 'ach-challenge-hunter',
    name: 'Challenge Hunter',
    description: 'Complete 10 challenges',
    icon: '🎯',
    rarity: 'rare',
    category: 'challenge',
    checkCondition: (profile) => profile.challengesCompleted.length >= 10,
  },
  {
    id: 'ach-challenge-master',
    name: 'Challenge Master',
    description: 'Complete 50 challenges',
    icon: '🏆',
    rarity: 'epic',
    category: 'challenge',
    checkCondition: (profile) => profile.challengesCompleted.length >= 50,
  },
  {
    id: 'ach-challenge-legend',
    name: 'Challenge Legend',
    description: 'Complete 100 challenges',
    icon: '🌟',
    rarity: 'legendary',
    category: 'challenge',
    checkCondition: (profile) => profile.challengesCompleted.length >= 100,
  },

  // === STREAK ACHIEVEMENTS ===
  {
    id: 'ach-three-day-streak',
    name: 'Getting Started',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    rarity: 'common',
    category: 'special',
    checkCondition: (profile) => profile.streakDays >= 3,
  },
  {
    id: 'ach-week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '📅',
    rarity: 'rare',
    category: 'special',
    checkCondition: (profile) => profile.streakDays >= 7,
  },
  {
    id: 'ach-unstoppable',
    name: 'Unstoppable',
    description: 'Maintain a 14-day streak',
    icon: '⚡',
    rarity: 'epic',
    category: 'special',
    checkCondition: (profile) => profile.streakDays >= 14,
  },
  {
    id: 'ach-dedication',
    name: 'True Dedication',
    description: 'Maintain a 30-day streak',
    icon: '🔥',
    rarity: 'legendary',
    category: 'special',
    checkCondition: (profile) => profile.streakDays >= 30,
  },

  // === SKILL ACHIEVEMENTS (based on player attributes) ===
  {
    id: 'ach-speedster',
    name: 'Speedster',
    description: 'Reach 90+ pace',
    icon: '⚡',
    rarity: 'rare',
    category: 'skill',
    checkCondition: (profile, player) => (player.attributes as any)?.pace >= 90,
  },
  {
    id: 'ach-sharpshooter',
    name: 'Sharpshooter',
    description: 'Reach 90+ shooting',
    icon: '⚽',
    rarity: 'rare',
    category: 'skill',
    checkCondition: (profile, player) => (player.attributes as any)?.shooting >= 90,
  },
  {
    id: 'ach-maestro',
    name: 'Maestro',
    description: 'Reach 90+ passing',
    icon: '🎯',
    rarity: 'rare',
    category: 'skill',
    checkCondition: (profile, player) => (player.attributes as any)?.passing >= 90,
  },
  {
    id: 'ach-magician',
    name: 'Magician',
    description: 'Reach 90+ dribbling',
    icon: '✨',
    rarity: 'rare',
    category: 'skill',
    checkCondition: (profile, player) => (player.attributes as any)?.dribbling >= 90,
  },
  {
    id: 'ach-wall',
    name: 'The Wall',
    description: 'Reach 90+ defending',
    icon: '🛡️',
    rarity: 'rare',
    category: 'skill',
    checkCondition: (profile, player) => (player.attributes as any)?.defending >= 90,
  },
  {
    id: 'ach-powerhouse',
    name: 'Powerhouse',
    description: 'Reach 90+ physical',
    icon: '💪',
    rarity: 'rare',
    category: 'skill',
    checkCondition: (profile, player) => (player.attributes as any)?.physical >= 90,
  },
  {
    id: 'ach-complete-player',
    name: 'Complete Player',
    description: 'Reach 85+ in all attributes',
    icon: '🌟',
    rarity: 'legendary',
    category: 'skill',
    checkCondition: (profile, player) => {
      const attrs = player.attributes as any;
      return (
        attrs?.pace >= 85 &&
        attrs?.shooting >= 85 &&
        attrs?.passing >= 85 &&
        attrs?.dribbling >= 85 &&
        attrs?.defending >= 85 &&
        attrs?.physical >= 85
      );
    },
  },

  // === CAREER ACHIEVEMENTS ===
  {
    id: 'ach-century',
    name: 'Century Maker',
    description: 'Earn 10,000 total XP',
    icon: '💯',
    rarity: 'rare',
    category: 'career',
    checkCondition: (profile) => profile.totalXP >= 10000,
  },
  {
    id: 'ach-goal-machine',
    name: 'XP Master',
    description: 'Earn 25,000 total XP',
    icon: '⚽',
    rarity: 'epic',
    category: 'career',
    checkCondition: (profile) => profile.totalXP >= 25000,
  },
  {
    id: 'ach-playmaker',
    name: 'Badge Collector',
    description: 'Earn 5 badges',
    icon: '🤝',
    rarity: 'epic',
    category: 'career',
    checkCondition: (profile) => profile.badges.length >= 5,
  },
  {
    id: 'ach-winner',
    name: 'Attribute Master',
    description: 'Earn 50 attribute points',
    icon: '🏆',
    rarity: 'legendary',
    category: 'career',
    checkCondition: (profile) => (profile.totalStats?.totalAttributePointsEarned || 0) >= 50,
  },

  // === SPECIAL ACHIEVEMENTS ===
  {
    id: 'ach-early-bird',
    name: 'Early Bird',
    description: 'Be one of the first 100 players',
    icon: '🐦',
    rarity: 'rare',
    category: 'special',
    checkCondition: () => false, // Manually awarded
  },
  {
    id: 'ach-collector',
    name: 'Collector',
    description: 'Earn 10 badges',
    icon: '🎖️',
    rarity: 'epic',
    category: 'special',
    checkCondition: (profile) => profile.badges.length >= 10,
  },
  {
    id: 'ach-ultimate-collector',
    name: 'Ultimate Collector',
    description: 'Earn 25 badges',
    icon: '🏅',
    rarity: 'legendary',
    category: 'special',
    checkCondition: (profile) => profile.badges.length >= 25,
  },
];

/**
 * Check which new achievements a player has unlocked
 */
export function checkNewAchievements(
  profile: PlayerRankingProfile,
  player: Player,
  currentAchievements: Achievement[]
): Achievement[] {
  const currentAchievementIds = new Set(currentAchievements.map(a => a.id));
  const newAchievements: Achievement[] = [];

  for (const achDef of ALL_ACHIEVEMENTS) {
    // Skip if already unlocked
    if (currentAchievementIds.has(achDef.id)) {
      continue;
    }

    // Check if condition is met
    if (achDef.checkCondition(profile, player)) {
      newAchievements.push({
        id: achDef.id,
        name: achDef.name,
        description: achDef.description,
        icon: achDef.icon,
        rarity: achDef.rarity,
        unlockedAt: new Date(),
      });
    }
  }

  return newAchievements;
}

/**
 * Get all achievements for a player (unlocked + locked)
 */
export function getAllAchievementsForPlayer(
  profile: PlayerRankingProfile,
  player: Player,
  unlockedAchievements: Achievement[]
): Array<Achievement & { locked: boolean; progress?: number }> {
  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));

  return ALL_ACHIEVEMENTS.map(achDef => {
    const unlocked = unlockedAchievements.find(a => a.id === achDef.id);
    
    if (unlocked) {
      return { ...unlocked, locked: false };
    }

    // Return locked achievement
    return {
      id: achDef.id,
      name: achDef.name,
      description: achDef.description,
      icon: '🔒',
      rarity: achDef.rarity,
      locked: true,
      progress: calculateAchievementProgress(achDef, profile, player),
    };
  });
}

/**
 * Calculate progress towards an achievement (0-100)
 */
function calculateAchievementProgress(
  achDef: AchievementDefinition,
  profile: PlayerRankingProfile,
  player: Player
): number {
  // This is a simplified progress calculator
  // In a real system, you'd track specific progress for each achievement type
  
  switch (achDef.id) {
    case 'ach-first-steps':
      return Math.min(100, (profile.currentLevel / 5) * 100);
    case 'ach-rising-star':
      return Math.min(100, (profile.currentLevel / 10) * 100);
    case 'ach-silver-standard':
      return Math.min(100, (profile.currentLevel / 11) * 100);
    case 'ach-golden-player':
      return Math.min(100, (profile.currentLevel / 26) * 100);
    case 'ach-first-challenge':
      return profile.challengesCompleted.length >= 1 ? 100 : 0;
    case 'ach-challenge-hunter':
      return Math.min(100, (profile.challengesCompleted.length / 10) * 100);
    case 'ach-three-day-streak':
      return Math.min(100, (profile.streakDays / 3) * 100);
    default:
      return achDef.checkCondition(profile, player) ? 100 : 0;
  }
}

/**
 * Get achievement statistics
 */
export function getAchievementStats(achievements: Achievement[]) {
  const byRarity = achievements.reduce((acc, ach) => {
    acc[ach.rarity] = (acc[ach.rarity] || 0) + 1;
    return acc;
  }, {} as Record<CardRarity, number>);

  return {
    total: achievements.length,
    byRarity,
    completionRate: (achievements.length / ALL_ACHIEVEMENTS.length) * 100,
  };
}

