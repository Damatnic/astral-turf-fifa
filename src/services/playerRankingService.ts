// Player Ranking Service - Manages player progression and ranking system

import type {
  PlayerRankingProfile,
  PlayerBadge,
  WeeklyProgress,
  MonthlyStats,
  PlayerRankingStats,
  LeaderboardEntry,
  LevelConfig,
  BadgeCategory,
  BadgeRarity,
  DailyActivity,
  WeeklyGoal,
  ChallengeCategory,
  ChallengeDifficulty,
} from '../types/challenges';
import type { PlayerAttributes } from '../types/player';
import { challengeService } from './challengeService';

class PlayerRankingService {
  private profiles: Map<string, PlayerRankingProfile> = new Map();
  private levelConfigs: LevelConfig[] = [];
  private badges: Map<string, BadgeDefinition> = new Map();
  private streakTimers: Map<string, unknown> = new Map();

  constructor() {
    this.initializeLevelConfigs();
    this.initializeBadges();
    this.loadFromStorage();
  }

  // Initialize level configurations
  private initializeLevelConfigs() {
    for (let level = 1; level <= 100; level++) {
      const baseXP = 1000;
      const xpRequired = Math.floor(baseXP * Math.pow(1.15, level - 1));

      const rewards = [];

      // Attribute points every 5 levels
      if (level % 5 === 0) {
        rewards.push({
          type: 'attribute_points' as const,
          value: Math.floor(level / 5),
          description: `${Math.floor(level / 5)} Attribute Points`,
        });
      }

      // Badges at milestone levels
      if (level % 10 === 0) {
        rewards.push({
          type: 'badge' as const,
          value: `level-${level}`,
          description: `Level ${level} Badge`,
          rarity: level >= 80 ? 'legendary' : level >= 60 ? 'epic' : level >= 40 ? 'rare' : 'uncommon',
        });
      }

      // Titles at major milestones
      const titles: Record<number, string> = {
        10: 'Rising Star',
        25: 'Dedicated Athlete',
        50: 'Elite Performer',
        75: 'Master Player',
        100: 'Legend',
      };

      this.levelConfigs.push({
        level,
        xpRequired,
        rewards,
        title: titles[level],
        perks: level >= 50 ? ['Priority training slots', 'Custom challenges'] : undefined,
      });
    }
  }

  // Initialize badge definitions
  private initializeBadges() {
    const badgeDefinitions: BadgeDefinition[] = [
      // Achievement Badges
      {
        id: 'first-challenge',
        name: 'First Steps',
        description: 'Complete your first challenge',
        category: 'achievement',
        rarity: 'common',
        imageUrl: '/badges/first-steps.png',
      },
      {
        id: 'streak-7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        category: 'achievement',
        rarity: 'uncommon',
        imageUrl: '/badges/week-warrior.png',
      },
      {
        id: 'streak-30',
        name: 'Iron Will',
        description: 'Maintain a 30-day streak',
        category: 'achievement',
        rarity: 'rare',
        imageUrl: '/badges/iron-will.png',
      },
      {
        id: 'tactical-genius',
        name: 'Tactical Genius',
        description: 'Master of tactical challenges',
        category: 'achievement',
        rarity: 'uncommon',
        imageUrl: '/badges/tactical-genius.png',
      },
      {
        id: 'match-hero',
        name: 'Match Hero',
        description: 'Outstanding match performance',
        category: 'achievement',
        rarity: 'epic',
        imageUrl: '/badges/match-hero.png',
      },

      // Milestone Badges
      {
        id: 'challenges-10',
        name: 'Challenge Seeker',
        description: 'Complete 10 challenges',
        category: 'milestone',
        rarity: 'common',
        imageUrl: '/badges/challenge-seeker.png',
      },
      {
        id: 'challenges-50',
        name: 'Challenge Hunter',
        description: 'Complete 50 challenges',
        category: 'milestone',
        rarity: 'uncommon',
        imageUrl: '/badges/challenge-hunter.png',
      },
      {
        id: 'challenges-100',
        name: 'Challenge Master',
        description: 'Complete 100 challenges',
        category: 'milestone',
        rarity: 'rare',
        imageUrl: '/badges/challenge-master.png',
      },
      {
        id: 'xp-10000',
        name: 'Experience Veteran',
        description: 'Earn 10,000 XP',
        category: 'milestone',
        rarity: 'uncommon',
        imageUrl: '/badges/experience-veteran.png',
      },

      // Special Badges
      {
        id: 'team-player',
        name: 'Team Player',
        description: 'Excel in team challenges',
        category: 'special',
        rarity: 'uncommon',
        imageUrl: '/badges/team-player.png',
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete 10 challenges with perfect scores',
        category: 'special',
        rarity: 'epic',
        imageUrl: '/badges/perfectionist.png',
      },
      {
        id: 'comeback-kid',
        name: 'Comeback Kid',
        description: 'Complete a challenge after failing it',
        category: 'special',
        rarity: 'rare',
        imageUrl: '/badges/comeback-kid.png',
      },
    ];

    badgeDefinitions.forEach(badge => {
      this.badges.set(badge.id, badge);
    });
  }

  // Load from localStorage
  private loadFromStorage() {
    try {
      const savedProfiles = localStorage.getItem('astralTurf_playerRankings');
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        Object.entries(parsed).forEach(([playerId, profile]) => {
          this.profiles.set(playerId, profile as PlayerRankingProfile);
        });
      }
    } catch (_error) {
      console.error('Failed to load player rankings:', error);
    }
  }

  // Save to localStorage
  private saveToStorage() {
    try {
      const profilesObj: Record<string, PlayerRankingProfile> = {};
      this.profiles.forEach((profile, playerId) => {
        profilesObj[playerId] = profile;
      });
      localStorage.setItem('astralTurf_playerRankings', JSON.stringify(profilesObj));
    } catch (_error) {
      console.error('Failed to save player rankings:', error);
    }
  }

  // Get or create player profile
  getProfile(playerId: string): PlayerRankingProfile {
    let profile = this.profiles.get(playerId);

    if (!profile) {
      profile = this.createProfile(playerId);
      this.profiles.set(playerId, profile);
      this.saveToStorage();
    }

    return profile;
  }

  // Create new player profile
  private createProfile(playerId: string): PlayerRankingProfile {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    return {
      playerId,
      totalXP: 0,
      currentLevel: 1,
      xpToNextLevel: this.levelConfigs[0].xpRequired,
      earnedAttributes: {},
      unspentAttributePoints: 0,
      challengesCompleted: [],
      challengesActive: [],
      challengesFailed: [],
      streakDays: 0,
      longestStreak: 0,
      badges: [],
      weeklyProgress: {
        weekNumber: Math.floor((now.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)),
        startDate: weekStart.toISOString(),
        endDate: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        xpEarned: 0,
        challengesCompleted: 0,
        attributePointsEarned: 0,
        dailyActivity: [],
        weeklyGoals: this.generateWeeklyGoals(),
      },
      monthlyStats: {
        month: now.toLocaleString('default', { month: 'long' }),
        year: now.getFullYear(),
        totalXP: 0,
        challengesCompleted: 0,
        attributePointsEarned: 0,
        badgesEarned: 0,
        averageDailyXP: 0,
        mostProductiveDay: '',
        categoryBreakdown: {
          fitness: 0,
          technical: 0,
          tactical: 0,
          mental: 0,
        },
      },
      totalStats: {
        totalChallengesCompleted: 0,
        totalXPEarned: 0,
        totalAttributePointsEarned: 0,
        totalBadgesEarned: 0,
        favoriteCategory: 'fitness',
        completionRate: 0,
        averageChallengeTime: 0,
        difficultyBreakdown: {
          easy: 0,
          medium: 0,
          hard: 0,
          elite: 0,
        },
        categoryBreakdown: {
          fitness: 0,
          technical: 0,
          tactical: 0,
          mental: 0,
        },
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  // Generate weekly goals
  private generateWeeklyGoals(): WeeklyGoal[] {
    return [
      {
        id: 'weekly-challenges',
        description: 'Complete 5 challenges',
        target: 5,
        current: 0,
        completed: false,
        reward: {
          type: 'xp',
          value: 500,
          description: '500 Bonus XP',
        },
      },
      {
        id: 'weekly-xp',
        description: 'Earn 1000 XP',
        target: 1000,
        current: 0,
        completed: false,
        reward: {
          type: 'attribute_points',
          value: 1,
          description: '1 Bonus Attribute Point',
        },
      },
      {
        id: 'weekly-streak',
        description: 'Maintain daily streak',
        target: 7,
        current: 0,
        completed: false,
        reward: {
          type: 'badge',
          value: 'week-warrior',
          description: 'Week Warrior Badge',
        },
      },
    ];
  }

  // Add XP to player
  addXP(playerId: string, xp: number, challengeId?: string): LevelUpResult | null {
    const profile = this.getProfile(playerId);
    profile.totalXP += xp;
    profile.weeklyProgress.xpEarned += xp;
    profile.monthlyStats.totalXP += xp;
    profile.totalStats.totalXPEarned += xp;

    // Check for level up
    let levelUpResult: LevelUpResult | null = null;
    const currentLevelConfig = this.levelConfigs[profile.currentLevel - 1];

    while (profile.totalXP >= currentLevelConfig.xpRequired && profile.currentLevel < 100) {
      profile.currentLevel++;
      const newLevelConfig = this.levelConfigs[profile.currentLevel - 1];

      // Apply level rewards
      const rewards = newLevelConfig.rewards || [];
      rewards.forEach(reward => {
        if (reward.type === 'attribute_points') {
          profile.unspentAttributePoints += reward.value as number;
          profile.totalStats.totalAttributePointsEarned += reward.value as number;
        } else if (reward.type === 'badge') {
          this.awardBadge(playerId, reward.value as string, `Level ${profile.currentLevel}`);
        }
      });

      levelUpResult = {
        newLevel: profile.currentLevel,
        rewards,
        title: newLevelConfig.title,
        perks: newLevelConfig.perks,
      };

      profile.xpToNextLevel = this.levelConfigs[profile.currentLevel].xpRequired - profile.totalXP;
    }

    // Update weekly goals
    const xpGoal = profile.weeklyProgress.weeklyGoals.find(g => g.id === 'weekly-xp');
    if (xpGoal && !xpGoal.completed) {
      xpGoal.current = Math.min(xpGoal.current + xp, xpGoal.target);
      if (xpGoal.current >= xpGoal.target) {
        xpGoal.completed = true;
        if (xpGoal.reward?.type === 'attribute_points') {
          profile.unspentAttributePoints += xpGoal.reward.value as number;
        }
      }
    }

    profile.updatedAt = new Date().toISOString();
    this.saveToStorage();

    return levelUpResult;
  }

  // Complete a challenge
  completeChallengeForPlayer(
    playerId: string,
    challengeId: string,
    category: ChallengeCategory,
    difficulty: ChallengeDifficulty,
    xpReward: number,
    attributePointReward?: number,
    badgeReward?: string,
  ) {
    const profile = this.getProfile(playerId);

    // Add to completed challenges
    if (!profile.challengesCompleted.includes(challengeId)) {
      profile.challengesCompleted.push(challengeId);
    }

    // Remove from active challenges
    profile.challengesActive = profile.challengesActive.filter(id => id !== challengeId);

    // Update stats
    profile.totalStats.totalChallengesCompleted++;
    profile.weeklyProgress.challengesCompleted++;
    profile.monthlyStats.challengesCompleted++;
    profile.totalStats.categoryBreakdown[category]++;
    profile.monthlyStats.categoryBreakdown[category]++;
    profile.totalStats.difficultyBreakdown[difficulty]++;

    // Add XP
    const levelUpResult = this.addXP(playerId, xpReward, challengeId);

    // Add attribute points
    if (attributePointReward) {
      profile.unspentAttributePoints += attributePointReward;
      profile.weeklyProgress.attributePointsEarned += attributePointReward;
      profile.monthlyStats.attributePointsEarned += attributePointReward;
      profile.totalStats.totalAttributePointsEarned += attributePointReward;
    }

    // Award badge
    if (badgeReward) {
      this.awardBadge(playerId, badgeReward, challengeId);
    }

    // Update streak
    this.updateStreak(playerId);

    // Check for milestone badges
    this.checkMilestoneBadges(playerId);

    // Update weekly goals
    const challengeGoal = profile.weeklyProgress.weeklyGoals.find(g => g.id === 'weekly-challenges');
    if (challengeGoal && !challengeGoal.completed) {
      challengeGoal.current++;
      if (challengeGoal.current >= challengeGoal.target) {
        challengeGoal.completed = true;
        if (challengeGoal.reward?.type === 'xp') {
          this.addXP(playerId, challengeGoal.reward.value as number);
        }
      }
    }

    // Update favorite category
    const categories = Object.entries(profile.totalStats.categoryBreakdown);
    const favorite = categories.reduce((a, b) => a[1] > b[1] ? a : b);
    profile.totalStats.favoriteCategory = favorite[0] as ChallengeCategory;

    // Update completion rate
    const totalAttempted = profile.challengesCompleted.length + profile.challengesFailed.length;
    profile.totalStats.completionRate = totalAttempted > 0
      ? (profile.challengesCompleted.length / totalAttempted) * 100
      : 0;

    profile.updatedAt = new Date().toISOString();
    this.saveToStorage();

    return { levelUpResult, badgeReward };
  }

  // Update streak
  private updateStreak(playerId: string) {
    const profile = this.getProfile(playerId);
    const now = new Date();
    const today = now.toDateString();

    // Check if already updated today
    const lastCompletion = profile.lastCompletionDate ? new Date(profile.lastCompletionDate) : null;
    const lastCompletionDate = lastCompletion?.toDateString();

    if (lastCompletionDate === today) {
      // Already completed a challenge today
      return;
    }

    if (lastCompletion) {
      const daysSinceLastCompletion = Math.floor((now.getTime() - lastCompletion.getTime()) / (24 * 60 * 60 * 1000));

      if (daysSinceLastCompletion === 1) {
        // Streak continues
        profile.streakDays++;
        profile.longestStreak = Math.max(profile.longestStreak, profile.streakDays);

        // Check for streak badges
        if (profile.streakDays === 7) {
          this.awardBadge(playerId, 'streak-7', 'Streak Achievement');
        } else if (profile.streakDays === 30) {
          this.awardBadge(playerId, 'streak-30', 'Streak Achievement');
        }
      } else {
        // Streak broken
        profile.streakDays = 1;
      }
    } else {
      // First completion
      profile.streakDays = 1;
      profile.longestStreak = 1;
    }

    profile.lastCompletionDate = now.toISOString();

    // Update weekly streak goal
    const streakGoal = profile.weeklyProgress.weeklyGoals.find(g => g.id === 'weekly-streak');
    if (streakGoal && !streakGoal.completed) {
      streakGoal.current = profile.streakDays;
      if (streakGoal.current >= streakGoal.target) {
        streakGoal.completed = true;
        if (streakGoal.reward?.type === 'badge') {
          this.awardBadge(playerId, streakGoal.reward.value as string, 'Weekly Goal');
        }
      }
    }

    // Add to daily activity
    let todayActivity = profile.weeklyProgress.dailyActivity.find(d =>
      new Date(d.date).toDateString() === today,
    );

    if (!todayActivity) {
      todayActivity = {
        date: now.toISOString(),
        xpEarned: 0,
        challengesCompleted: [],
        streakMaintained: true,
      };
      profile.weeklyProgress.dailyActivity.push(todayActivity);
    }

    todayActivity.streakMaintained = true;

    this.saveToStorage();
  }

  // Award badge to player
  awardBadge(playerId: string, badgeId: string, earnedFrom: string): boolean {
    const profile = this.getProfile(playerId);
    const badgeDefinition = this.badges.get(badgeId);

    if (!badgeDefinition) {return false;}

    // Check if already has badge
    if (profile.badges.some(b => b.badgeId === badgeId)) {
      return false;
    }

    const playerBadge: PlayerBadge = {
      id: `pb-${Date.now()}`,
      badgeId,
      name: badgeDefinition.name,
      description: badgeDefinition.description,
      category: badgeDefinition.category,
      rarity: badgeDefinition.rarity,
      imageUrl: badgeDefinition.imageUrl,
      earnedAt: new Date().toISOString(),
      earnedFrom,
      displayPriority: this.calculateBadgePriority(badgeDefinition.rarity),
      isEquipped: false,
    };

    profile.badges.push(playerBadge);
    profile.monthlyStats.badgesEarned++;
    profile.totalStats.totalBadgesEarned++;

    profile.updatedAt = new Date().toISOString();
    this.saveToStorage();

    return true;
  }

  // Calculate badge display priority
  private calculateBadgePriority(rarity: BadgeRarity): number {
    const priorities = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
    };
    return priorities[rarity];
  }

  // Check for milestone badges
  private checkMilestoneBadges(playerId: string) {
    const profile = this.getProfile(playerId);

    // Challenge completion milestones
    if (profile.totalStats.totalChallengesCompleted === 10) {
      this.awardBadge(playerId, 'challenges-10', 'Milestone');
    } else if (profile.totalStats.totalChallengesCompleted === 50) {
      this.awardBadge(playerId, 'challenges-50', 'Milestone');
    } else if (profile.totalStats.totalChallengesCompleted === 100) {
      this.awardBadge(playerId, 'challenges-100', 'Milestone');
    }

    // XP milestones
    if (profile.totalXP >= 10000 && !profile.badges.some(b => b.badgeId === 'xp-10000')) {
      this.awardBadge(playerId, 'xp-10000', 'Milestone');
    }

    // First challenge badge
    if (profile.totalStats.totalChallengesCompleted === 1) {
      this.awardBadge(playerId, 'first-challenge', 'Milestone');
    }
  }

  // Spend attribute points
  spendAttributePoints(
    playerId: string,
    attribute: keyof PlayerAttributes,
    points: number,
  ): boolean {
    const profile = this.getProfile(playerId);

    if (profile.unspentAttributePoints < points) {
      return false;
    }

    if (!profile.earnedAttributes[attribute]) {
      profile.earnedAttributes[attribute] = 0;
    }

    profile.earnedAttributes[attribute]! += points;
    profile.unspentAttributePoints -= points;

    profile.updatedAt = new Date().toISOString();
    this.saveToStorage();

    return true;
  }

  // Get leaderboard
  getLeaderboard(
    playerIds: string[],
    sortBy: 'total' | 'weekly' | 'monthly' = 'total',
  ): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = playerIds.map(playerId => {
      const profile = this.getProfile(playerId);

      return {
        playerId,
        playerName: '', // Will be filled by the component
        teamName: '', // Will be filled by the component
        level: profile.currentLevel,
        totalXP: profile.totalXP,
        weeklyXP: profile.weeklyProgress.xpEarned,
        monthlyXP: profile.monthlyStats.totalXP,
        badges: profile.badges.length,
        rank: 0,
        trend: 'stable',
      };
    });

    // Sort based on criteria
    entries.sort((a, b) => {
      switch (sortBy) {
        case 'weekly':
          return b.weeklyXP - a.weeklyXP;
        case 'monthly':
          return b.monthlyXP - a.monthlyXP;
        default:
          return b.totalXP - a.totalXP;
      }
    });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  // Get player comparison
  compareProfiles(playerIdA: string, playerIdB: string): ProfileComparison {
    const profileA = this.getProfile(playerIdA);
    const profileB = this.getProfile(playerIdB);

    return {
      playerA: profileA,
      playerB: profileB,
      differences: {
        level: profileA.currentLevel - profileB.currentLevel,
        totalXP: profileA.totalXP - profileB.totalXP,
        badges: profileA.badges.length - profileB.badges.length,
        challengesCompleted: profileA.challengesCompleted.length - profileB.challengesCompleted.length,
        streak: profileA.streakDays - profileB.streakDays,
        attributePoints: profileA.unspentAttributePoints - profileB.unspentAttributePoints,
      },
      winner: profileA.totalXP > profileB.totalXP ? 'A' : profileA.totalXP < profileB.totalXP ? 'B' : 'tie',
    };
  }

  // Reset weekly progress
  resetWeeklyProgress(playerId: string) {
    const profile = this.getProfile(playerId);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    profile.weeklyProgress = {
      weekNumber: Math.floor((now.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)),
      startDate: weekStart.toISOString(),
      endDate: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      xpEarned: 0,
      challengesCompleted: 0,
      attributePointsEarned: 0,
      dailyActivity: [],
      weeklyGoals: this.generateWeeklyGoals(),
    };

    profile.updatedAt = new Date().toISOString();
    this.saveToStorage();
  }

  // Reset monthly stats
  resetMonthlyStats(playerId: string) {
    const profile = this.getProfile(playerId);
    const now = new Date();

    profile.monthlyStats = {
      month: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear(),
      totalXP: 0,
      challengesCompleted: 0,
      attributePointsEarned: 0,
      badgesEarned: 0,
      averageDailyXP: 0,
      mostProductiveDay: '',
      categoryBreakdown: {
        fitness: 0,
        technical: 0,
        tactical: 0,
        mental: 0,
      },
    };

    profile.updatedAt = new Date().toISOString();
    this.saveToStorage();
  }

  // Get recommended challenges
  getRecommendedChallenges(playerId: string): string[] {
    const profile = this.getProfile(playerId);
    const recommendations: string[] = [];

    // Recommend based on favorite category
    const availableChallenges = challengeService.getAvailableChallenges(playerId);

    // Prioritize favorite category
    const favoriteCategory = availableChallenges.filter(c =>
      c.category === profile.totalStats.favoriteCategory,
    );
    recommendations.push(...favoriteCategory.slice(0, 2).map(c => c.id));

    // Add variety from other categories
    const otherCategories = availableChallenges.filter(c =>
      c.category !== profile.totalStats.favoriteCategory,
    );
    recommendations.push(...otherCategories.slice(0, 2).map(c => c.id));

    // Prioritize challenges that match player level
    const levelAppropriate = availableChallenges.filter(c => {
      if (profile.currentLevel < 20) {return c.difficulty === 'easy';}
      if (profile.currentLevel < 40) {return c.difficulty === 'medium';}
      if (profile.currentLevel < 60) {return c.difficulty === 'hard';}
      return c.difficulty === 'elite';
    });
    recommendations.push(...levelAppropriate.slice(0, 1).map(c => c.id));

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  // Cleanup
  cleanup() {
    this.streakTimers.forEach(timer => clearTimeout(timer));
    this.streakTimers.clear();
  }
}

// Type definitions used internally
interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  imageUrl?: string;
}

interface LevelUpResult {
  newLevel: number;
  rewards: unknown[];
  title?: string;
  perks?: string[];
}

interface ProfileComparison {
  playerA: PlayerRankingProfile;
  playerB: PlayerRankingProfile;
  differences: {
    level: number;
    totalXP: number;
    badges: number;
    challengesCompleted: number;
    streak: number;
    attributePoints: number;
  };
  winner: 'A' | 'B' | 'tie';
}

// Export singleton instance
export const playerRankingService = new PlayerRankingService();