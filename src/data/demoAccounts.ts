/**
 * Demo Account Data
 * 
 * Complete demo data for Coach, Family, and Player accounts
 * Ready-to-use with full features showcased
 */

import type { User } from '../types';
import type { PlayerRankingProfile } from '../types/challenges';
import { INITIAL_STATE } from '../constants';

// ============================================================================
// DEMO COACH ACCOUNT
// ============================================================================

export const DEMO_COACH: User = {
  id: 'demo-coach-001',
  email: 'coach@demo.astralturf.com',
  name: 'Coach Demo',
  role: 'coach',
  createdAt: new Date('2024-01-01').toISOString(),
  lastLoginAt: new Date().toISOString(),
  preferences: {
    theme: 'dark',
    notifications: {
      email: true,
      push: true,
      inApp: true,
    },
  },
};

export const DEMO_COACH_STATE = {
  ...INITIAL_STATE,
  auth: {
    isAuthenticated: true,
    isLoading: false,
    user: DEMO_COACH,
    error: null,
    familyAssociations: [],
  },
  tactics: {
    ...INITIAL_STATE.tactics,
    // Ensure all 15 players have field positions for demo
    players: INITIAL_STATE.tactics.players.map((player, index) => ({
      ...player,
      fieldPosition: player.position, // Use position as fieldPosition
    })),
  },
};

// ============================================================================
// DEMO PLAYER ACCOUNT
// ============================================================================

export const DEMO_PLAYER: User = {
  id: 'demo-player-001',
  email: 'player@demo.astralturf.com',
  name: 'Alex Star',
  role: 'player',
  playerId: 'p2', // Links to M. Van Dijk in default players
  createdAt: new Date('2024-01-01').toISOString(),
  lastLoginAt: new Date().toISOString(),
  preferences: {
    theme: 'dark',
    notifications: {
      email: true,
      push: true,
      inApp: true,
    },
  },
};

export const DEMO_PLAYER_PROFILE: PlayerRankingProfile = {
  playerId: 'p2',
  totalXP: 15750,
  currentLevel: 42,
  xpToNextLevel: 2250,
  earnedAttributes: {
    pace: 5,
    shooting: 8,
    passing: 6,
    dribbling: 7,
    defending: 3,
    physical: 4,
  },
  unspentAttributePoints: 15,
  challengesCompleted: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'],
  challengesActive: ['c11', 'c12'],
  challengesFailed: [],
  badges: [
    {
      id: 'badge1',
      name: 'Goal Machine',
      description: 'Score 50 goals in training',
      icon: '⚽',
      rarity: 'legendary',
      category: 'achievement',
      unlockedAt: new Date('2024-06-15').toISOString(),
    },
    {
      id: 'badge2',
      name: 'Hat Trick Hero',
      description: 'Score 3 goals in one session',
      icon: '🎩',
      rarity: 'epic',
      category: 'achievement',
      unlockedAt: new Date('2024-07-20').toISOString(),
    },
    {
      id: 'badge3',
      name: 'Speed Demon',
      description: 'Reach 90+ pace',
      icon: '⚡',
      rarity: 'rare',
      category: 'milestone',
      unlockedAt: new Date('2024-08-10').toISOString(),
    },
    {
      id: 'badge4',
      name: 'Team Player',
      description: 'Complete 10 team challenges',
      icon: '🤝',
      rarity: 'rare',
      category: 'achievement',
      unlockedAt: new Date('2024-09-01').toISOString(),
    },
    {
      id: 'badge5',
      name: 'Perfect Week',
      description: 'Complete all daily challenges for 7 days',
      icon: '📅',
      rarity: 'epic',
      category: 'milestone',
      unlockedAt: new Date('2024-09-15').toISOString(),
    },
  ],
  streakDays: 28,
  longestStreak: 45,
  lastCompletionDate: new Date().toISOString(),
  weeklyProgress: {
    weekNumber: 42,
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    xpEarned: 2250,
    challengesCompleted: 8,
    attributePointsEarned: 3,
    dailyActivity: [
      { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), xpEarned: 350, challengesCompleted: ['c1', 'c2'] },
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), xpEarned: 450, challengesCompleted: ['c3'] },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), xpEarned: 550, challengesCompleted: ['c4', 'c5'] },
      { date: new Date().toISOString(), xpEarned: 900, challengesCompleted: ['c6', 'c7', 'c8'] },
    ],
    weeklyGoals: [
      {
        id: 'weekly-xp',
        title: 'Earn 3000 XP',
        description: 'Earn 3000 XP this week',
        target: 3000,
        current: 2250,
        completed: false,
        reward: { type: 'attribute_points', value: 5 },
      },
      {
        id: 'weekly-challenges',
        title: 'Complete 10 Challenges',
        description: 'Complete 10 challenges this week',
        target: 10,
        current: 8,
        completed: false,
        reward: { type: 'xp', value: 500 },
      },
    ],
  },
  monthlyStats: {
    month: 'January',
    year: 2025,
    totalXP: 8950,
    challengesCompleted: 32,
    attributePointsEarned: 12,
    badgesEarned: 2,
    averageDailyXP: 287,
    mostProductiveDay: new Date().toISOString(),
    categoryBreakdown: {
      'skill-development': 12,
      'fitness': 8,
      'mental': 5,
      'tactical': 7,
    },
  },
  totalStats: {
    totalChallengesCompleted: 78,
    totalXPEarned: 15750,
    totalAttributePointsEarned: 140,
    totalBadgesEarned: 5,
    favoriteCategory: 'skill-development',
    completionRate: 0.89,
    averageChallengeTime: 45,
    difficultyBreakdown: {
      'beginner': 25,
      'intermediate': 35,
      'advanced': 15,
      'expert': 3,
    },
    categoryBreakdown: {
      'skill-development': 30,
      'fitness': 22,
      'mental': 15,
      'tactical': 11,
    },
  },
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEMO_PLAYER_STATE = {
  ...INITIAL_STATE,
  auth: {
    isAuthenticated: true,
    isLoading: false,
    user: DEMO_PLAYER,
    error: null,
    familyAssociations: [],
  },
};

// ============================================================================
// DEMO FAMILY ACCOUNT
// ============================================================================

export const DEMO_FAMILY: User = {
  id: 'demo-family-001',
  email: 'family@demo.astralturf.com',
  name: 'The Star Family',
  role: 'family',
  createdAt: new Date('2024-01-01').toISOString(),
  lastLoginAt: new Date().toISOString(),
  preferences: {
    theme: 'dark',
    notifications: {
      email: true,
      push: true,
      inApp: true,
    },
  },
};

export const DEMO_FAMILY_ASSOCIATIONS = [
  {
    id: 'assoc1',
    familyUserId: 'demo-family-001',
    playerId: 'p2', // M. Van Dijk
    playerName: 'Alex Star',
    relationship: 'parent' as const,
    permissions: {
      viewProgress: true,
      viewChallenges: true,
      receiveNotifications: true,
      manageAccount: false,
    },
    createdAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: 'assoc2',
    familyUserId: 'demo-family-001',
    playerId: 'p8', // M. Salah
    playerName: 'Jordan Star',
    relationship: 'parent' as const,
    permissions: {
      viewProgress: true,
      viewChallenges: true,
      receiveNotifications: true,
      manageAccount: false,
    },
    createdAt: new Date('2024-01-01').toISOString(),
  },
];

export const DEMO_FAMILY_STATE = {
  ...INITIAL_STATE,
  auth: {
    isAuthenticated: true,
    isLoading: false,
    user: DEMO_FAMILY,
    error: null,
    familyAssociations: DEMO_FAMILY_ASSOCIATIONS,
  },
};

// ============================================================================
// DEMO DATA INITIALIZER
// ============================================================================

export function getDemoStateForRole(role: 'coach' | 'player' | 'family') {
  switch (role) {
    case 'coach':
      return DEMO_COACH_STATE;
    case 'player':
      return DEMO_PLAYER_STATE;
    case 'family':
      return DEMO_FAMILY_STATE;
    default:
      return INITIAL_STATE;
  }
}

export function getDemoUserForRole(role: 'coach' | 'player' | 'family') {
  switch (role) {
    case 'coach':
      return DEMO_COACH;
    case 'player':
      return DEMO_PLAYER;
    case 'family':
      return DEMO_FAMILY;
    default:
      return null;
  }
}

// Helper to initialize demo account in localStorage
export function initializeDemoAccount(role: 'coach' | 'player' | 'family') {
  const demoState = getDemoStateForRole(role);
  
  // Save to localStorage
  localStorage.setItem('astralTurfActiveState', JSON.stringify(demoState));
  
  // Save player profile for player account
  if (role === 'player') {
    const profiles = new Map();
    profiles.set('p2', DEMO_PLAYER_PROFILE);
    localStorage.setItem('astral-turf-player-profiles', JSON.stringify(Array.from(profiles.entries())));
  }
  
  console.log(`✅ Demo ${role} account initialized`, {
    user: demoState.auth.user?.email,
    players: demoState.tactics.players.length,
  });
  
  return demoState;
}

