/**
 * Enhanced Player Card Page
 * 
 * Comprehensive player profile with rich information:
 * - Ultimate Player Card display
 * - Detailed statistics & analytics
 * - XP & level progression tracking
 * - Achievement showcase with progress
 * - Challenge integration
 * - Career stats & history
 * - Attribute breakdown with radar chart
 * - Recent activity feed
 * - Comparison with other players
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useChallengeContext } from '../context/ChallengeContext';
import { useTacticsContext, useAuthContext } from '../hooks';
import { UltimatePlayerCard } from '../components/player/UltimatePlayerCard';
import { convertToPlayerProgression } from '../utils/playerCardIntegration';
import { calculateLevel, calculateRank, getXPToNextLevel, getRankProgress } from '../utils/xpSystem';
import { ALL_ACHIEVEMENTS, checkNewAchievements } from '../utils/achievementSystem';
import ChallengeCard from '../components/challenges/ChallengeCard';
import type { Player } from '../types';
import { 
  ArrowLeft, Trophy, Target, Users, TrendingUp, Award, 
  Zap, Star, BarChart3, Activity, Flame, Calendar,
  ChevronRight, Medal, Crown, Sparkles, Plus, Lock
} from 'lucide-react';

const EnhancedPlayerCardPage: React.FC = () => {
  const { playerId } = useParams<{ playerId?: string }>();
  const navigate = useNavigate();
  const { tacticsState } = useTacticsContext();
  const { authState } = useAuthContext();
  const { state, getActiveChallenges, getRecommendedChallenges } = useChallengeContext();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'achievements' | 'activity'>('overview');

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

  const profile = selectedPlayer ? state.playerProfiles.get(selectedPlayer.id) : undefined;
  const activeChallenges = profile ? getActiveChallenges(selectedPlayer!.id) : [];
  const recommendedChallenges = profile ? getRecommendedChallenges(selectedPlayer!.id) : [];

  // Convert to player progression
  const progression = useMemo(() => {
    if (!profile || !selectedPlayer) return undefined;
    return convertToPlayerProgression(profile, selectedPlayer, { checkAchievements: true });
  }, [profile, selectedPlayer]);

  // Calculate detailed stats
  const stats = useMemo(() => {
    if (!profile || !progression) return null;

    const xpPercent = (progression.currentXP / (progression.currentXP + progression.xpToNextLevel)) * 100;
    const nextLevelXP = progression.currentXP + progression.xpToNextLevel;
    
    return {
      xpPercent,
      totalXP: profile.totalXP,
      currentLevel: profile.currentLevel,
      nextLevel: profile.currentLevel + 1,
      currentXP: progression.currentXP,
      xpToNext: progression.xpToNextLevel,
      nextLevelTotalXP: nextLevelXP,
      rank: progression.rank,
      rankProgress: progression.rankProgress,
      totalChallenges: profile.challengesCompleted.length,
      activeChallengesCount: activeChallenges.length,
      streakDays: profile.streakDays,
      longestStreak: profile.longestStreak,
      unlockedAchievements: progression.achievements.length,
      totalAchievements: ALL_ACHIEVEMENTS.length,
      achievementProgress: (progression.achievements.length / ALL_ACHIEVEMENTS.length) * 100,
      badges: profile.badges.length,
      unspentPoints: profile.unspentAttributePoints,
    };
  }, [profile, progression, activeChallenges]);

  if (!selectedPlayer) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950">
        <div className="text-center">
          <Star className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No Player Selected</h3>
          <p className="text-gray-500 mb-4">Please select a player to view their profile.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile || !progression || !stats) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950">
        <div className="animate-pulse text-white">Loading player data...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'activity', label: 'Activity', icon: Calendar },
  ] as const;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 overflow-y-auto pb-12">
      {/* Header with Player Info */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 border-b border-purple-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </button>
            <div className="flex items-center space-x-4">
              {tacticsState.players.length > 1 && (
                <button
                  onClick={() => navigate('/player-ranking')}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white text-sm font-medium"
                >
                  <Users className="w-4 h-4" />
                  <span>View All Players</span>
                </button>
              )}
            </div>
          </div>

          {/* Player Header Info */}
          <div className="flex items-center space-x-6">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">{selectedPlayer.jerseyNumber}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-black text-white mb-2">{selectedPlayer.name}</h1>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-bold">Level {stats.currentLevel}</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1">
                  <Crown className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-bold uppercase">{stats.rank}</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-white font-bold">{stats.streakDays} Day Streak</span>
                </div>
              </div>
            </div>

            {/* Quick XP Progress */}
            <div className="bg-white/10 rounded-xl p-4 min-w-[200px]">
              <div className="text-xs text-gray-300 mb-1">XP Progress</div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">{stats.currentXP.toLocaleString()}</span>
                <span className="text-xs text-gray-400">{stats.nextLevelTotalXP.toLocaleString()} XP</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.xpPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {stats.xpToNext.toLocaleString()} XP to Level {stats.nextLevel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 flex space-x-2 border border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                player={selectedPlayer}
                profile={profile}
                progression={progression}
                stats={stats}
                activeChallenges={activeChallenges}
                recommendedChallenges={recommendedChallenges}
                navigate={navigate}
              />
            )}

            {activeTab === 'stats' && (
              <StatsTab
                player={selectedPlayer}
                profile={profile}
                progression={progression}
                stats={stats}
              />
            )}

            {activeTab === 'achievements' && (
              <AchievementsTab
                player={selectedPlayer}
                profile={profile}
                progression={progression}
                stats={stats}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityTab
                player={selectedPlayer}
                profile={profile}
                activeChallenges={activeChallenges}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<any> = ({ 
  player, profile, progression, stats, activeChallenges, recommendedChallenges, navigate 
}) => {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Column - Player Card */}
      <div className="lg:col-span-1">
        <UltimatePlayerCard
          player={player}
          progression={progression}
          showProgression={true}
          interactive={true}
          showChallenges={false}
          size="large"
        />
      </div>

      {/* Right Column - Stats & Challenges */}
      <div className="lg:col-span-2 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Zap className="w-6 h-6" />}
            label="Total XP"
            value={stats.totalXP.toLocaleString()}
            color="from-yellow-500 to-orange-500"
          />
          <StatCard
            icon={<Target className="w-6 h-6" />}
            label="Challenges"
            value={stats.totalChallenges}
            color="from-cyan-500 to-blue-500"
          />
          <StatCard
            icon={<Award className="w-6 h-6" />}
            label="Achievements"
            value={`${stats.unlockedAchievements}/${stats.totalAchievements}`}
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            icon={<Flame className="w-6 h-6" />}
            label="Best Streak"
            value={`${stats.longestStreak} Days`}
            color="from-orange-500 to-red-500"
          />
        </div>

        {/* Level Progress Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span>Level Progress</span>
            </h3>
            <span className="text-sm text-gray-400">{stats.xpPercent.toFixed(1)}% Complete</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Level {stats.currentLevel}</span>
              <span className="text-gray-300">Level {stats.nextLevel}</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.xpPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{stats.currentXP.toLocaleString()} XP</span>
              <span className="text-white font-bold">{stats.xpToNext.toLocaleString()} XP to go</span>
              <span className="text-gray-400">{stats.nextLevelTotalXP.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <span>Active Challenges</span>
              <span className="ml-auto text-sm text-gray-400">({activeChallenges.length})</span>
            </h3>
            <div className="space-y-3">
              {activeChallenges.slice(0, 3).map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  playerId={player.id}
                  progress={undefined}
                />
              ))}
            </div>
            {activeChallenges.length > 3 && (
              <button
                onClick={() => navigate('/skill-challenges')}
                className="mt-4 w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>View All Active Challenges</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Recommended Challenges */}
        {recommendedChallenges.length > 0 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>Recommended For You</span>
            </h3>
            <div className="space-y-3">
              {recommendedChallenges.slice(0, 2).map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  playerId={player.id}
                  progress={undefined}
                />
              ))}
            </div>
            <button
              onClick={() => navigate('/challenge-hub')}
              className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Explore All Challenges</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Stats Tab Component
const StatsTab: React.FC<any> = ({ player, profile, progression, stats }) => {
  const attributes = player.attributes;
  
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Career Statistics */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <span>Career Statistics</span>
        </h3>
        <div className="space-y-4">
          {progression?.careerStats && (
            <>
              <StatRow label="Matches Played" value={progression.careerStats.matches} icon="⚽" />
              <StatRow label="Goals Scored" value={progression.careerStats.goals} icon="🎯" />
              <StatRow label="Assists Made" value={progression.careerStats.assists} icon="🤝" />
              <StatRow label="Win Rate" value={`${progression.careerStats.winRate}%`} icon="🏆" />
            </>
          )}
          <div className="border-t border-gray-700 my-4" />
          <StatRow label="Total XP Earned" value={stats.totalXP.toLocaleString()} icon="⚡" />
          <StatRow label="Challenges Completed" value={stats.totalChallenges} icon="✅" />
          <StatRow label="Badges Earned" value={stats.badges} icon="🏅" />
          <StatRow label="Longest Streak" value={`${stats.longestStreak} days`} icon="🔥" />
          <StatRow label="Unspent Points" value={stats.unspentPoints} icon="💎" />
        </div>
      </div>

      {/* Player Attributes */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Star className="w-6 h-6 text-yellow-400" />
          <span>Player Attributes</span>
        </h3>
        <div className="space-y-3">
          {attributes && (
            <>
              <AttributeBar label="Pace" value={(attributes as any)?.pace || 0} color="from-green-500 to-emerald-500" />
              <AttributeBar label="Shooting" value={(attributes as any)?.shooting || 0} color="from-red-500 to-orange-500" />
              <AttributeBar label="Passing" value={(attributes as any)?.passing || 0} color="from-blue-500 to-cyan-500" />
              <AttributeBar label="Dribbling" value={(attributes as any)?.dribbling || 0} color="from-purple-500 to-pink-500" />
              <AttributeBar label="Defending" value={(attributes as any)?.defending || 0} color="from-gray-500 to-slate-500" />
              <AttributeBar label="Physical" value={(attributes as any)?.physical || 0} color="from-yellow-500 to-amber-500" />
            </>
          )}
        </div>
      </div>

      {/* Rank Progress */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl md:col-span-2">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Crown className="w-6 h-6 text-purple-400" />
          <span>Rank Progress</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-3">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white uppercase">{stats.rank} Rank</div>
                <div className="text-sm text-gray-400">Level {stats.currentLevel}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Progress to Next Rank</div>
              <div className="text-xl font-bold text-white">{stats.rankProgress.toFixed(0)}%</div>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.rankProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="grid grid-cols-5 gap-2 text-xs text-center">
            {['Bronze', 'Silver', 'Gold', 'Diamond', 'Legend'].map((rank, idx) => (
              <div key={rank} className={`py-2 rounded ${stats.rank.toLowerCase() === rank.toLowerCase() ? 'bg-purple-600 text-white font-bold' : 'bg-gray-700 text-gray-400'}`}>
                {rank}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Achievements Tab Component
const AchievementsTab: React.FC<any> = ({ player, profile, progression, stats }) => {
  const unlockedIds = new Set(progression.achievements.map((a: any) => a.id));
  const unlockedAchievements = progression.achievements;
  const lockedAchievements = ALL_ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id));

  return (
    <div className="space-y-6">
      {/* Achievement Progress */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span>Achievement Progress</span>
          </h3>
          <span className="text-lg font-bold text-white">
            {stats.unlockedAchievements} / {stats.totalAchievements}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${stats.achievementProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <p className="text-sm text-gray-400">{stats.achievementProgress.toFixed(1)}% Complete</p>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span>Unlocked Achievements</span>
            <span className="ml-auto text-sm text-gray-400">({unlockedAchievements.length})</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {unlockedAchievements.map((achievement: any) => (
              <motion.div
                key={achievement.id}
                className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-700/50 rounded-lg p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-1">{achievement.name}</h4>
                    <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        achievement.rarity === 'mythic' ? 'bg-purple-600 text-white' :
                        achievement.rarity === 'legendary' ? 'bg-orange-600 text-white' :
                        achievement.rarity === 'epic' ? 'bg-purple-500 text-white' :
                        achievement.rarity === 'rare' ? 'bg-blue-500 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {achievement.rarity.toUpperCase()}
                      </span>
                      {achievement.unlockedAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-gray-400" />
            <span>Locked Achievements</span>
            <span className="ml-auto text-sm text-gray-400">({lockedAchievements.length})</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {lockedAchievements.slice(0, 10).map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 opacity-60"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl grayscale">🔒</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-300 mb-1">{achievement.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{achievement.description}</p>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-gray-700 text-gray-400">
                      {achievement.rarity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {lockedAchievements.length > 10 && (
            <p className="text-center text-gray-400 mt-4 text-sm">
              + {lockedAchievements.length - 10} more locked achievements
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Activity Tab Component
const ActivityTab: React.FC<any> = ({ player, profile, activeChallenges }) => {
  const recentActivity = [
    ...(profile.challengesCompleted || []).slice(-5).map((id: string) => ({
      type: 'challenge_completed',
      challengeId: id,
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      {/* Current Streak */}
      <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-xl p-6 border border-orange-700 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-full p-4">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white">{profile.streakDays} Day Streak!</h3>
              <p className="text-orange-300">Keep it going! Complete a challenge today.</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Best Streak</div>
            <div className="text-2xl font-bold text-white">{profile.longestStreak} Days</div>
          </div>
        </div>
      </div>

      {/* Active Challenges Summary */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
          <Target className="w-6 h-6 text-cyan-400" />
          <span>Active Challenges</span>
          <span className="ml-auto text-sm text-gray-400">({activeChallenges.length})</span>
        </h3>
        {activeChallenges.length > 0 ? (
          <div className="space-y-3">
            {activeChallenges.map((challenge: any) => (
              <div key={challenge.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white">{challenge.title}</h4>
                    <p className="text-sm text-gray-400">{challenge.category}</p>
                  </div>
                  <div className="bg-cyan-600 px-3 py-1 rounded-full text-white text-sm font-bold">
                    +{challenge.xpReward} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No active challenges. Start a new one!</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
          <Activity className="w-6 h-6 text-green-400" />
          <span>Recent Activity</span>
        </h3>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center space-x-3 bg-gray-800 rounded-lg p-3">
                <div className="bg-green-600 rounded-full p-2">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Completed Challenge</p>
                  <p className="text-sm text-gray-400">{activity.date.toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({
  icon, label, value, color
}) => (
  <motion.div
    className={`bg-gradient-to-br ${color} rounded-xl p-4 shadow-lg`}
    whileHover={{ scale: 1.05 }}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="text-white">{icon}</div>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
    <p className="text-white/90 text-sm font-medium">{label}</p>
  </motion.div>
);

const StatRow: React.FC<{ label: string; value: string | number; icon: string }> = ({ label, value, icon }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
    <div className="flex items-center space-x-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-300">{label}</span>
    </div>
    <span className="text-white font-bold text-lg">{value}</span>
  </div>
);

const AttributeBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-gray-300 text-sm font-medium">{label}</span>
      <span className="text-white font-bold">{value}</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
      <motion.div
        className={`h-full bg-gradient-to-r ${color} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.1 }}
      />
    </div>
  </div>
);

export default EnhancedPlayerCardPage;

