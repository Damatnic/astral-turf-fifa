/**
 * Challenge System Types
 * Comprehensive type definitions for the challenge and achievement system
 */

export type ChallengeType = 'individual' | 'team' | 'skill' | 'fitness' | 'tactical' | 'competitive';
export type ChallengeStatus = 'draft' | 'active' | 'completed' | 'expired' | 'archived';
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'legendary';
export type EvidenceType = 'photo' | 'video' | 'stats' | 'tracking' | 'manual';
export type EvidenceStatus = 'pending' | 'approved' | 'rejected' | 'requires_revision';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  status: ChallengeStatus;
  
  // Participants
  createdBy: string; // User/Coach ID
  assignedTo: string[]; // Player/Team IDs
  teamId?: string;
  
  // Requirements
  requirements: ChallengeRequirement[];
  evidenceTypes: EvidenceType[];
  minimumEvidence: number;
  
  // Points & Rewards
  points: number;
  bonusPoints?: number;
  xpReward: number;
  achievements?: string[]; // Achievement IDs
  
  // Timeline
  startDate: Date;
  endDate: Date;
  duration?: number; // In days
  
  // Progress
  participants: ChallengeParticipant[];
  completionRate: number;
  totalSubmissions: number;
  
  // Metadata
  tags: string[];
  category?: string;
  isPublic: boolean;
  isTemplate: boolean;
  templateId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeRequirement {
  id: string;
  type: 'metric' | 'action' | 'achievement' | 'submission';
  description: string;
  target: number;
  unit: string;
  metric?: string; // e.g., 'distance', 'speed', 'accuracy'
  operator?: 'gte' | 'lte' | 'eq' | 'range';
  range?: { min: number; max: number };
  isOptional: boolean;
  weight: number; // For weighted scoring
}

export interface ChallengeParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'player' | 'coach' | 'team';
  
  // Progress
  progress: number; // 0-100%
  completedRequirements: string[]; // Requirement IDs
  submissions: ChallengeSubmission[];
  
  // Stats
  pointsEarned: number;
  rank?: number;
  completedAt?: Date;
  
  // Status
  isActive: boolean;
  joinedAt: Date;
  lastActivity?: Date;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  
  // Evidence
  evidenceType: EvidenceType;
  evidenceUrls: string[]; // Photos, videos, documents
  description: string;
  metadata?: Record<string, any>; // Stats, GPS data, etc.
  
  // Review
  status: EvidenceStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  score?: number;
  
  // Data
  requirementId?: string;
  value?: number;
  unit?: string;
  
  submittedAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  
  // Requirements
  requirements: AchievementRequirement[];
  category: string;
  
  // Rewards
  points: number;
  xp: number;
  badge?: string;
  title?: string; // Player title/badge
  
  // Progress
  isSecret: boolean;
  isRepeatable: boolean;
  unlockedBy: number; // Count of users who unlocked
  
  // Metadata
  order: number;
  createdAt: Date;
}

export interface AchievementRequirement {
  type: 'challenge' | 'streak' | 'total' | 'milestone';
  target: number;
  metric?: string;
  challengeIds?: string[];
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  
  progress: number; // 0-100%
  isUnlocked: boolean;
  unlockedAt?: Date;
  
  currentValue: number;
  targetValue: number;
  
  metadata?: Record<string, any>;
}

export interface Leaderboard {
  id: string;
  name: string;
  type: 'challenge' | 'team' | 'global' | 'category';
  
  // Scope
  challengeId?: string;
  teamId?: string;
  category?: string;
  
  // Timeframe
  timeframe: 'daily' | 'weekly' | 'monthly' | 'season' | 'allTime';
  startDate?: Date;
  endDate?: Date;
  
  // Entries
  entries: LeaderboardEntry[];
  
  // Metadata
  lastUpdated: Date;
  totalParticipants: number;
  isLive: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  teamName?: string;
  
  // Score
  score: number;
  points: number;
  
  // Stats
  challengesCompleted: number;
  achievements: number;
  streak?: number;
  
  // Change indicators
  rankChange?: 'up' | 'down' | 'same' | 'new';
  scoreChange?: number;
  
  updatedAt: Date;
}

export interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: ChallengeDifficulty;
  type: ChallengeType;
  
  // Template data
  requirements: Omit<ChallengeRequirement, 'id'>[];
  defaultDuration: number; // Days
  defaultPoints: number;
  defaultXP: number;
  
  // Customization
  isCustomizable: boolean;
  requiredFields: string[];
  
  // Usage
  usageCount: number;
  rating?: number;
  
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
}

export interface ChallengeFilters {
  type?: ChallengeType[];
  status?: ChallengeStatus[];
  difficulty?: ChallengeDifficulty[];
  assignedToMe?: boolean;
  createdByMe?: boolean;
  teamId?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'recent' | 'popular' | 'endingSoon' | 'points';
  sortOrder?: 'asc' | 'desc';
}

export interface ChallengeStats {
  total: number;
  active: number;
  completed: number;
  participantCount: number;
  averageCompletion: number;
  totalPoints: number;
  totalSubmissions: number;
  approvalRate: number;
}
