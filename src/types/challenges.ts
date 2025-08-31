// Challenge and Player Ranking Types

import type { PlayerAttributes } from './player';

// Challenge Types
export type ChallengeCategory = 'fitness' | 'technical' | 'tactical' | 'mental';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'elite';
export type ChallengeStatus = 'available' | 'active' | 'completed' | 'expired' | 'failed';
export type ChallengeFrequency = 'daily' | 'weekly' | 'monthly' | 'special';
export type ChallengeCreator = 'system' | 'coach';

// Badge Types
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type BadgeCategory = 'achievement' | 'milestone' | 'special' | 'seasonal';

// Player Ranking Profile
export interface PlayerRankingProfile {
  playerId: string;
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  earnedAttributes: Partial<PlayerAttributes>;
  unspentAttributePoints: number;
  challengesCompleted: string[];
  challengesActive: string[];
  challengesFailed: string[];
  streakDays: number;
  longestStreak: number;
  lastCompletionDate?: string;
  badges: PlayerBadge[];
  weeklyProgress: WeeklyProgress;
  monthlyStats: MonthlyStats;
  totalStats: PlayerRankingStats;
  createdAt: string;
  updatedAt: string;
}

// Challenge Definition
export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  frequency: ChallengeFrequency;
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward[];
  xpReward: number;
  attributePointReward?: number;
  badgeReward?: string;
  timeLimit?: number; // in hours
  expiresAt?: string;
  availableFrom?: string;
  availableUntil?: string;
  createdBy: ChallengeCreator;
  createdByUserId?: string;
  targetPlayers?: string[]; // specific players or empty for all
  teamChallenge?: boolean;
  prerequisiteChallengeIds?: string[];
  maxCompletions?: number;
  cooldownHours?: number;
  evidenceRequired?: boolean;
  autoValidate?: boolean;
  tags?: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Challenge Progress
export interface ChallengeProgress {
  challengeId: string;
  playerId: string;
  status: ChallengeStatus;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  currentProgress: Record<string, number>;
  evidenceSubmissions?: EvidenceSubmission[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalNotes?: string;
  attempts: number;
  bestProgress?: Record<string, number>;
}

// Challenge Requirements
export interface ChallengeRequirement {
  id: string;
  type: 'metric' | 'activity' | 'performance' | 'consistency' | 'social';
  metric?: string;
  target: number;
  unit?: string;
  description: string;
  trackingMethod?: 'manual' | 'automatic' | 'verified';
  verificationCriteria?: string;
}

// Challenge Rewards
export interface ChallengeReward {
  type: 'xp' | 'attribute_points' | 'badge' | 'title' | 'item' | 'bonus';
  value: number | string;
  description: string;
  rarity?: BadgeRarity;
}

// Evidence Submission
export interface EvidenceSubmission {
  id: string;
  submittedAt: string;
  type: 'image' | 'video' | 'text' | 'link' | 'metric';
  content: string;
  description?: string;
  verifiedBy?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
}

// Player Badge
export interface PlayerBadge {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  imageUrl?: string;
  earnedAt: string;
  earnedFrom: string; // challenge ID or special event
  displayPriority?: number;
  isEquipped?: boolean;
}

// Progress Tracking
export interface WeeklyProgress {
  weekNumber: number;
  startDate: string;
  endDate: string;
  xpEarned: number;
  challengesCompleted: number;
  attributePointsEarned: number;
  dailyActivity: DailyActivity[];
  weeklyGoals: WeeklyGoal[];
}

export interface DailyActivity {
  date: string;
  xpEarned: number;
  challengesCompleted: string[];
  minutesActive?: number;
  streakMaintained: boolean;
}

export interface WeeklyGoal {
  id: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  reward?: ChallengeReward;
}

export interface MonthlyStats {
  month: string;
  year: number;
  totalXP: number;
  challengesCompleted: number;
  attributePointsEarned: number;
  badgesEarned: number;
  averageDailyXP: number;
  mostProductiveDay: string;
  categoryBreakdown: Record<ChallengeCategory, number>;
}

export interface PlayerRankingStats {
  totalChallengesCompleted: number;
  totalXPEarned: number;
  totalAttributePointsEarned: number;
  totalBadgesEarned: number;
  favoriteCategory: ChallengeCategory;
  completionRate: number;
  averageChallengeTime: number;
  difficultyBreakdown: Record<ChallengeDifficulty, number>;
  categoryBreakdown: Record<ChallengeCategory, number>;
}

// Leaderboard
export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  teamName: string;
  level: number;
  totalXP: number;
  weeklyXP: number;
  monthlyXP: number;
  badges: number;
  rank: number;
  previousRank?: number;
  trend: 'up' | 'down' | 'stable';
}

// Team Challenge
export interface TeamChallenge extends Challenge {
  teamId: string;
  participantIds: string[];
  teamProgress: Record<string, number>;
  individualContributions: Record<string, number>;
  minimumParticipants: number;
  completionThreshold: number;
}

// Challenge Template (for coach creation)
export interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  category: ChallengeCategory;
  defaultRequirements: ChallengeRequirement[];
  defaultRewards: ChallengeReward[];
  customizable: boolean;
  popularityScore: number;
  usageCount: number;
}

// Challenge Filters
export interface ChallengeFilters {
  categories?: ChallengeCategory[];
  difficulties?: ChallengeDifficulty[];
  frequencies?: ChallengeFrequency[];
  status?: ChallengeStatus[];
  createdBy?: ChallengeCreator[];
  teamChallenges?: boolean;
  search?: string;
  sortBy?: 'newest' | 'popular' | 'xp' | 'difficulty' | 'expiring';
}

// Level Configuration
export interface LevelConfig {
  level: number;
  xpRequired: number;
  rewards: ChallengeReward[];
  title?: string;
  perks?: string[];
}

// XP Multipliers
export interface XPMultiplier {
  type: 'difficulty' | 'streak' | 'team' | 'event' | 'performance';
  value: number;
  description: string;
  conditions?: string;
}

// Notification Types for Challenge System
export interface ChallengeNotification {
  id: string;
  type: 'challenge_available' | 'challenge_expiring' | 'challenge_completed' |
        'level_up' | 'badge_earned' | 'streak_milestone' | 'leaderboard_change';
  title: string;
  message: string;
  challengeId?: string;
  playerId: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}