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
  challengesCompleted: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'],
  challengesInProgress: ['c11', 'c12'],
  activeChallenges: ['c11', 'c12'],
  badges: [
    {
      id: 'badge1',
      name: 'Goal Machine',
      description: 'Score 50 goals in training',
      icon: '⚽',
      rarity: 'legendary',
      unlockedAt: new Date('2024-06-15').toISOString(),
    },
    {
      id: 'badge2',
      name: 'Hat Trick Hero',
      description: 'Score 3 goals in one session',
      icon: '🎩',
      rarity: 'epic',
      unlockedAt: new Date('2024-07-20').toISOString(),
    },
    {
      id: 'badge3',
      name: 'Speed Demon',
      description: 'Reach 90+ pace',
      icon: '⚡',
      rarity: 'rare',
      unlockedAt: new Date('2024-08-10').toISOString(),
    },
    {
      id: 'badge4',
      name: 'Team Player',
      description: 'Complete 10 team challenges',
      icon: '🤝',
      rarity: 'rare',
      unlockedAt: new Date('2024-09-01').toISOString(),
    },
    {
      id: 'badge5',
      name: 'Perfect Week',
      description: 'Complete all daily challenges for 7 days',
      icon: '📅',
      rarity: 'epic',
      unlockedAt: new Date('2024-09-15').toISOString(),
    },
  ],
  streakDays: 28,
  longestStreak: 45,
  lastActiveDate: new Date().toISOString(),
  skillPoints: 125,
  unspentAttributePoints: 15,
  totalStats: {
    totalChallengesCompleted: 78,
    totalXPEarned: 15750,
    totalBadgesEarned: 5,
    currentStreak: 28,
    bestStreak: 45,
    averageChallengeCompletion: 2.5,
    totalAttributePointsEarned: 140,
    totalAttributePointsSpent: 125,
  },
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

