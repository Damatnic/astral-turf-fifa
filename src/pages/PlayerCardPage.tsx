/**
 * Enhanced Player Card Page
 * 
 * Comprehensive player profile with:
 * - Ultimate Player Card display
 * - Detailed statistics & analytics
 * - XP & level progression tracking
 * - Achievement showcase
 * - Challenge integration
 * - Career stats & history
 * - Attribute breakdown
 * - Recent activity feed
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useChallengeContext } from '../context/ChallengeContext';
import { useTacticsContext, useAuthContext } from '../hooks';
import { UltimatePlayerCard } from '../components/player/UltimatePlayerCard';
import { convertToPlayerProgression } from '../utils/playerCardIntegration';
import { calculateLevel, calculateRank } from '../utils/xpSystem';
import ChallengeCard from '../components/challenges/ChallengeCard';
import type { Player } from '../types';
import { 
  ArrowLeft, Trophy, Target, Users, TrendingUp, Award, 
  Zap, Star, BarChart3, Activity, Flame, Calendar,
  ChevronRight, Medal, Crown, Sparkles
} from 'lucide-react';

const PlayerCardPage: React.FC = () => {
  const { playerId } = useParams<{ playerId?: string }>();
  const navigate = useNavigate();
  const { tacticsState } = useTacticsContext();
  const { authState } = useAuthContext();
  const { state, getActiveChallenges, getRecommendedChallenges } = useChallengeContext();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Get current player
  useEffect(() => {
    if (playerId) {
      const player = tacticsState.players.find(p => p.id === playerId);
      if (player) {
        setSelectedPlayer(player);
      }
    } else if (authState.user?.playerId) {
      const player = tacticsState.players.find(p => p.id === authState.user.playerId);
      if (player) {
        setSelectedPlayer(player);
      }
    }
  }, [playerId, tacticsState.players, authState.user]);

  if (!selectedPlayer) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No Player Selected</h3>
          <p className="text-gray-500 mb-4">Please select a player to view their card.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'achievements' | 'challenges'>('overview');

  const profile = state.playerProfiles.get(selectedPlayer.id);
  const activeChallenges = profile ? getActiveChallenges(selectedPlayer.id) : [];
  const recommendedChallenges = profile ? getRecommendedChallenges(selectedPlayer.id) : [];

  // Convert to player progression
  const progression = profile ? convertToPlayerProgression(profile, selectedPlayer, { checkAchievements: true }) : undefined;

  // Calculate stats
  const xpPercent = progression ? (progression.currentXP / (progression.currentXP + progression.xpToNextLevel)) * 100 : 0;
  const totalXP = profile?.totalXP || 0;
  const currentLevel = profile?.currentLevel || 1;
  const nextLevel = currentLevel + 1;
  const unlockedAchievements = progression?.achievements.length || 0;
  const streakDays = profile?.streakDays || 0;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 border-b border-purple-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-2xl font-bold text-white">Player Card</h1>
            <div className="w-20" /> {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Player Card */}
          <div className="lg:col-span-1">
            <UltimatePlayerCard
              player={selectedPlayer}
              progression={progression}
              showProgression={true}
              interactive={true}
              showChallenges={true}
            />
          </div>

          {/* Right Column - Challenges & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl p-6 border border-blue-700">
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <span className="text-3xl font-bold text-white">{profile?.currentLevel || 0}</span>
                </div>
                <p className="text-blue-300 text-sm font-medium">Current Level</p>
              </div>

              <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-xl p-6 border border-purple-700">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-8 h-8 text-cyan-400" />
                  <span className="text-3xl font-bold text-white">{profile?.challengesCompleted?.length || 0}</span>
                </div>
                <p className="text-purple-300 text-sm font-medium">Challenges</p>
              </div>

              <div className="bg-gradient-to-br from-pink-900 to-pink-950 rounded-xl p-6 border border-pink-700">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-orange-400" />
                  <span className="text-3xl font-bold text-white">{profile?.badges?.length || 0}</span>
                </div>
                <p className="text-pink-300 text-sm font-medium">Badges</p>
              </div>
            </div>

            {/* Active Challenges */}
            {activeChallenges.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-cyan-400" />
                  Active Challenges
                </h2>
                <div className="grid gap-4">
                  {activeChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      playerId={selectedPlayer.id}
                      progress={state.challengeProgress[`${selectedPlayer.id}-${challenge.id}`]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Challenges */}
            {recommendedChallenges.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                  Recommended Challenges
                </h2>
                <div className="grid gap-4">
                  {recommendedChallenges.slice(0, 3).map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      playerId={selectedPlayer.id}
                      progress={state.challengeProgress[`${selectedPlayer.id}-${challenge.id}`]}
                    />
                  ))}
                </div>
                {recommendedChallenges.length > 3 && (
                  <button
                    onClick={() => navigate('/challenge-hub')}
                    className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all"
                  >
                    View All Challenges →
                  </button>
                )}
              </div>
            )}

            {/* Player Selection */}
            {tacticsState.players.length > 1 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Other Players</h2>
                <div className="grid grid-cols-2 gap-4">
                  {tacticsState.players
                    .filter(p => p.id !== selectedPlayer.id)
                    .slice(0, 4)
                    .map((player) => (
                      <button
                        key={player.id}
                        onClick={() => navigate(`/player-card/${player.id}`)}
                        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-white">{player.jerseyNumber}</span>
                          </div>
                          <div>
                            <p className="text-white font-bold">{player.name}</p>
                            <p className="text-gray-400 text-sm">
                              Level {state.playerProfiles.get(player.id)?.currentLevel || 1}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCardPage;
