// Challenge Context - Provides challenge and ranking state management

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type {
  Challenge,
  ChallengeProgress,
  PlayerRankingProfile,
  ChallengeFilters,
  LeaderboardEntry,
  ChallengeNotification,
  EvidenceSubmission,
  ChallengeCategory,
  ChallengeDifficulty,
} from '../types/challenges';
import type { PlayerAttributes } from '../types/player';
import { challengeService } from '../services/challengeService';
import { playerRankingService } from '../services/playerRankingService';

// Context State
interface ChallengeState {
  challenges: Challenge[];
  activeFilters: ChallengeFilters;
  selectedChallenge: Challenge | null;
  playerProfiles: Map<string, PlayerRankingProfile>;
  currentPlayerProfile: PlayerRankingProfile | null;
  leaderboard: LeaderboardEntry[];
  notifications: ChallengeNotification[];
  isLoading: boolean;
  error: string | null;
}

// Action Types
type ChallengeAction =
  | { type: 'SET_CHALLENGES'; payload: Challenge[] }
  | { type: 'SET_FILTERS'; payload: ChallengeFilters }
  | { type: 'SELECT_CHALLENGE'; payload: Challenge | null }
  | { type: 'SET_PLAYER_PROFILE'; payload: { playerId: string; profile: PlayerRankingProfile } }
  | { type: 'SET_CURRENT_PLAYER'; payload: string }
  | { type: 'UPDATE_LEADERBOARD'; payload: LeaderboardEntry[] }
  | { type: 'ADD_NOTIFICATION'; payload: ChallengeNotification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'START_CHALLENGE'; payload: { playerId: string; challengeId: string } }
  | {
      type: 'UPDATE_CHALLENGE_PROGRESS';
      payload: { playerId: string; challengeId: string; requirementId: string; value: number };
    }
  | { type: 'COMPLETE_CHALLENGE'; payload: { playerId: string; challengeId: string } }
  | {
      type: 'SUBMIT_EVIDENCE';
      payload: { playerId: string; challengeId: string; evidence: EvidenceSubmission };
    }
  | {
      type: 'SPEND_ATTRIBUTE_POINTS';
      payload: { playerId: string; attribute: keyof PlayerAttributes; points: number };
    }
  | { type: 'CREATE_CUSTOM_CHALLENGE'; payload: Challenge }
  | { type: 'UPDATE_CHALLENGE'; payload: { challengeId: string; updates: Partial<Challenge> } }
  | { type: 'DELETE_CHALLENGE'; payload: string }
  | {
      type: 'REVIEW_CHALLENGE';
      payload: {
        playerId: string;
        challengeId: string;
        approved: boolean;
        reviewerId: string;
        notes?: string;
      };
    };

// Initial State
const initialState: ChallengeState = {
  challenges: [],
  activeFilters: {},
  selectedChallenge: null,
  playerProfiles: new Map(),
  currentPlayerProfile: null,
  leaderboard: [],
  notifications: [],
  isLoading: false,
  error: null,
};

// Reducer
function challengeReducer(state: ChallengeState, action: ChallengeAction): ChallengeState {
  switch (action.type) {
    case 'SET_CHALLENGES':
      return { ...state, challenges: action.payload };

    case 'SET_FILTERS':
      return { ...state, activeFilters: action.payload };

    case 'SELECT_CHALLENGE':
      return { ...state, selectedChallenge: action.payload };

    case 'SET_PLAYER_PROFILE': {
      const newProfiles = new Map(state.playerProfiles);
      newProfiles.set(action.payload.playerId, action.payload.profile);
      return { ...state, playerProfiles: newProfiles };
    }

    case 'SET_CURRENT_PLAYER': {
      const profile = playerRankingService.getProfile(action.payload);
      return {
        ...state,
        currentPlayerProfile: profile,
        playerProfiles: new Map(state.playerProfiles).set(action.payload, profile),
      };
    }

    case 'UPDATE_LEADERBOARD':
      return { ...state, leaderboard: action.payload };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50), // Keep last 50
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n,
        ),
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'START_CHALLENGE': {
      const progress = challengeService.startChallenge(
        action.payload.playerId,
        action.payload.challengeId,
      );
      if (progress) {
        const profile = playerRankingService.getProfile(action.payload.playerId);
        if (!profile.challengesActive.includes(action.payload.challengeId)) {
          profile.challengesActive.push(action.payload.challengeId);
        }

        const notification: ChallengeNotification = {
          id: `notif-${Date.now()}`,
          type: 'challenge_available',
          title: 'Challenge Started',
          message: 'You have started a new challenge!',
          challengeId: action.payload.challengeId,
          playerId: action.payload.playerId,
          timestamp: new Date().toISOString(),
          read: false,
        };

        return {
          ...state,
          playerProfiles: new Map(state.playerProfiles).set(action.payload.playerId, profile),
          currentPlayerProfile:
            state.currentPlayerProfile?.playerId === action.payload.playerId
              ? profile
              : state.currentPlayerProfile,
          notifications: [notification, ...state.notifications].slice(0, 50),
        };
      }
      return state;
    }

    case 'UPDATE_CHALLENGE_PROGRESS': {
      const { playerId, challengeId, requirementId, value } = action.payload;
      challengeService.updateProgress(playerId, challengeId, requirementId, value);

      const profile = playerRankingService.getProfile(playerId);
      return {
        ...state,
        playerProfiles: new Map(state.playerProfiles).set(playerId, profile),
        currentPlayerProfile:
          state.currentPlayerProfile?.playerId === playerId ? profile : state.currentPlayerProfile,
      };
    }

    case 'COMPLETE_CHALLENGE': {
      const { playerId, challengeId } = action.payload;
      const challenge = state.challenges.find(c => c.id === challengeId);

      if (challenge && challengeService.completeChallenge(playerId, challengeId)) {
        const result = playerRankingService.completeChallengeForPlayer(
          playerId,
          challengeId,
          challenge.category,
          challenge.difficulty,
          challenge.xpReward,
          challenge.attributePointReward,
          challenge.badgeReward,
        );

        const profile = playerRankingService.getProfile(playerId);
        const notifications: ChallengeNotification[] = [];

        // Challenge completion notification
        notifications.push({
          id: `notif-${Date.now()}`,
          type: 'challenge_completed',
          title: 'Challenge Completed!',
          message: `You completed "${challenge.title}" and earned ${challenge.xpReward} XP!`,
          challengeId,
          playerId,
          timestamp: new Date().toISOString(),
          read: false,
        });

        // Level up notification
        if (result.levelUpResult) {
          notifications.push({
            id: `notif-${Date.now()}-levelup`,
            type: 'level_up',
            title: 'Level Up!',
            message: `Congratulations! You reached level ${result.levelUpResult.newLevel}!`,
            playerId,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }

        // Badge notification
        if (result.badgeReward) {
          notifications.push({
            id: `notif-${Date.now()}-badge`,
            type: 'badge_earned',
            title: 'Badge Earned!',
            message: `You earned a new badge!`,
            playerId,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }

        return {
          ...state,
          playerProfiles: new Map(state.playerProfiles).set(playerId, profile),
          currentPlayerProfile:
            state.currentPlayerProfile?.playerId === playerId
              ? profile
              : state.currentPlayerProfile,
          notifications: [...notifications, ...state.notifications].slice(0, 50),
        };
      }
      return state;
    }

    case 'SUBMIT_EVIDENCE': {
      const { playerId, challengeId, evidence } = action.payload;
      const success = challengeService.submitEvidence(playerId, challengeId, evidence);

      if (success) {
        const notification: ChallengeNotification = {
          id: `notif-${Date.now()}`,
          type: 'challenge_available',
          title: 'Evidence Submitted',
          message: 'Your evidence has been submitted for review.',
          challengeId,
          playerId,
          timestamp: new Date().toISOString(),
          read: false,
        };

        return {
          ...state,
          notifications: [notification, ...state.notifications].slice(0, 50),
        };
      }
      return state;
    }

    case 'SPEND_ATTRIBUTE_POINTS': {
      const { playerId, attribute, points } = action.payload;
      const success = playerRankingService.spendAttributePoints(playerId, attribute, points);

      if (success) {
        const profile = playerRankingService.getProfile(playerId);
        return {
          ...state,
          playerProfiles: new Map(state.playerProfiles).set(playerId, profile),
          currentPlayerProfile:
            state.currentPlayerProfile?.playerId === playerId
              ? profile
              : state.currentPlayerProfile,
        };
      }
      return state;
    }

    case 'CREATE_CUSTOM_CHALLENGE': {
      const newChallenge = challengeService.createCustomChallenge(action.payload);
      return {
        ...state,
        challenges: [...state.challenges, newChallenge],
      };
    }

    case 'UPDATE_CHALLENGE': {
      const { challengeId, updates } = action.payload;
      const updated = challengeService.updateChallenge(challengeId, updates);

      if (updated) {
        return {
          ...state,
          challenges: state.challenges.map(c => (c.id === challengeId ? updated : c)),
        };
      }
      return state;
    }

    case 'DELETE_CHALLENGE': {
      const success = challengeService.deleteChallenge(action.payload);

      if (success) {
        return {
          ...state,
          challenges: state.challenges.filter(c => c.id !== action.payload),
          selectedChallenge:
            state.selectedChallenge?.id === action.payload ? null : state.selectedChallenge,
        };
      }
      return state;
    }

    case 'REVIEW_CHALLENGE': {
      const { playerId, challengeId, approved, reviewerId, notes } = action.payload;
      const success = challengeService.reviewChallengeCompletion(
        playerId,
        challengeId,
        approved,
        reviewerId,
        notes,
      );

      if (success) {
        const notification: ChallengeNotification = {
          id: `notif-${Date.now()}`,
          type: 'challenge_completed',
          title: approved ? 'Challenge Approved!' : 'Challenge Rejected',
          message: approved
            ? 'Your challenge submission has been approved!'
            : 'Your challenge submission was not approved. Please try again.',
          challengeId,
          playerId,
          timestamp: new Date().toISOString(),
          read: false,
        };

        if (approved) {
          // Process completion if approved
          const challenge = state.challenges.find(c => c.id === challengeId);
          if (challenge) {
            playerRankingService.completeChallengeForPlayer(
              playerId,
              challengeId,
              challenge.category,
              challenge.difficulty,
              challenge.xpReward,
              challenge.attributePointReward,
              challenge.badgeReward,
            );
          }
        }

        const profile = playerRankingService.getProfile(playerId);
        return {
          ...state,
          playerProfiles: new Map(state.playerProfiles).set(playerId, profile),
          currentPlayerProfile:
            state.currentPlayerProfile?.playerId === playerId
              ? profile
              : state.currentPlayerProfile,
          notifications: [notification, ...state.notifications].slice(0, 50),
        };
      }
      return state;
    }

    default:
      return state;
  }
}

// Context
interface ChallengeContextValue {
  state: ChallengeState;
  dispatch: React.Dispatch<ChallengeAction>;

  // Helper functions
  loadChallenges: (filters?: ChallengeFilters) => void;
  getAvailableChallenges: (playerId: string) => Challenge[];
  getActiveChallenges: (playerId: string) => Challenge[];
  startChallenge: (playerId: string, challengeId: string) => void;
  updateProgress: (
    playerId: string,
    challengeId: string,
    requirementId: string,
    value: number
  ) => void;
  completeChallenge: (playerId: string, challengeId: string) => void;
  submitEvidence: (
    playerId: string,
    challengeId: string,
    evidence: Omit<EvidenceSubmission, 'id' | 'submittedAt'>
  ) => void;
  spendAttributePoints: (
    playerId: string,
    attribute: keyof PlayerAttributes,
    points: number
  ) => void;
  createCustomChallenge: (challenge: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLeaderboard: (playerIds: string[], sortBy?: 'total' | 'weekly' | 'monthly') => void;
  getRecommendedChallenges: (playerId: string) => Challenge[];
}

const ChallengeContext = createContext<ChallengeContextValue | undefined>(undefined);

// Provider
interface ChallengeProviderProps {
  children: ReactNode;
}

export const ChallengeProvider: React.FC<ChallengeProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(challengeReducer, initialState);

  // Load initial challenges on mount
  useEffect(() => {
    loadChallenges();
  }, []);

  // Check for expired challenges periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkExpiredChallenges();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [state.challenges]);

  const loadChallenges = (filters?: ChallengeFilters) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const challenges = challengeService.getChallenges(filters);
      dispatch({ type: 'SET_CHALLENGES', payload: challenges });
      if (filters) {
        dispatch({ type: 'SET_FILTERS', payload: filters });
      }
    } catch (_error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load challenges' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getAvailableChallenges = (playerId: string): Challenge[] => {
    return challengeService.getAvailableChallenges(playerId);
  };

  const getActiveChallenges = (playerId: string): Challenge[] => {
    return challengeService.getActiveChallenges(playerId);
  };

  const startChallenge = (playerId: string, challengeId: string) => {
    dispatch({ type: 'START_CHALLENGE', payload: { playerId, challengeId } });
  };

  const updateProgress = (
    playerId: string,
    challengeId: string,
    requirementId: string,
    value: number,
  ) => {
    dispatch({
      type: 'UPDATE_CHALLENGE_PROGRESS',
      payload: { playerId, challengeId, requirementId, value },
    });
  };

  const completeChallenge = (playerId: string, challengeId: string) => {
    dispatch({ type: 'COMPLETE_CHALLENGE', payload: { playerId, challengeId } });
  };

  const submitEvidence = (
    playerId: string,
    challengeId: string,
    evidence: Omit<EvidenceSubmission, 'id' | 'submittedAt'>,
  ) => {
    dispatch({ type: 'SUBMIT_EVIDENCE', payload: { playerId, challengeId, evidence } as any });
  };

  const spendAttributePoints = (
    playerId: string,
    attribute: keyof PlayerAttributes,
    points: number,
  ) => {
    dispatch({ type: 'SPEND_ATTRIBUTE_POINTS', payload: { playerId, attribute, points } });
  };

  const createCustomChallenge = (challenge: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'CREATE_CUSTOM_CHALLENGE', payload: challenge as Challenge });
  };

  const updateLeaderboard = (
    playerIds: string[],
    sortBy: 'total' | 'weekly' | 'monthly' = 'total',
  ) => {
    const leaderboard = playerRankingService.getLeaderboard(playerIds, sortBy);
    dispatch({ type: 'UPDATE_LEADERBOARD', payload: leaderboard });
  };

  const getRecommendedChallenges = (playerId: string): Challenge[] => {
    const recommendedIds = playerRankingService.getRecommendedChallenges(playerId);
    return state.challenges.filter(c => recommendedIds.includes(c.id));
  };

  const checkExpiredChallenges = () => {
    const now = new Date();
    state.challenges.forEach(challenge => {
      if (challenge.expiresAt && new Date(challenge.expiresAt) < now) {
        // Add expiring notification
        const notification: ChallengeNotification = {
          id: `notif-exp-${challenge.id}`,
          type: 'challenge_expiring',
          title: 'Challenge Expiring',
          message: `"${challenge.title}" is expiring soon!`,
          challengeId: challenge.id,
          playerId: '', // Will be set per player
          timestamp: new Date().toISOString(),
          read: false,
        };

        // Only add if not already notified
        const alreadyNotified = state.notifications.some(
          n => n.type === 'challenge_expiring' && n.challengeId === challenge.id,
        );

        if (!alreadyNotified) {
          dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
        }
      }
    });
  };

  const value: ChallengeContextValue = {
    state,
    dispatch,
    loadChallenges,
    getAvailableChallenges,
    getActiveChallenges,
    startChallenge,
    updateProgress,
    completeChallenge,
    submitEvidence,
    spendAttributePoints,
    createCustomChallenge,
    updateLeaderboard,
    getRecommendedChallenges,
  };

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
};

// Hook
export const useChallengeContext = () => {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallengeContext must be used within a ChallengeProvider');
  }
  return context;
};
