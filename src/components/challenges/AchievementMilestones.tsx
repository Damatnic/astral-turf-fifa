/**
 * Achievement Milestones System
 * Tracks and displays player progression through milestone achievements
 * Supports bronze, silver, gold, platinum, and diamond tiers
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Award,
  Target,
  Zap,
  TrendingUp,
  Lock,
  Check,
  Crown,
  Sparkles,
  ChevronRight,
  Gift,
  Medal,
} from 'lucide-react';
import { Achievement, AchievementTier, UserAchievement } from '../../types/challenge';

interface AchievementMilestonesProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  userId: string;
  onClaimReward?: (achievementId: string) => Promise<void>;
}

export const AchievementMilestones: React.FC<AchievementMilestonesProps> = ({
  achievements,
  userAchievements,
  userId,
  onClaimReward,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<AchievementTier | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedAchievement, setExpandedAchievement] = useState<string | null>(null);

  // Process achievements with user progress
  const processedAchievements = useMemo(() => {
    return achievements.map((achievement) => {
      const userProgress = userAchievements.find((ua) => ua.achievementId === achievement.id);
      return {
        ...achievement,
        userProgress: userProgress || {
          userId,
          achievementId: achievement.id,
          progress: 0,
          isUnlocked: false,
          currentValue: 0,
          targetValue: achievement.requirements[0]?.target || 100,
        },
      };
    });
  }, [achievements, userAchievements, userId]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    let filtered = processedAchievements;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    if (selectedTier !== 'all') {
      filtered = filtered.filter((a) => a.tier === selectedTier);
    }

    return filtered.sort((a, b) => {
      // Sort by: unlocked first, then by progress, then by tier
      if (a.userProgress.isUnlocked !== b.userProgress.isUnlocked) {
        return a.userProgress.isUnlocked ? -1 : 1;
      }
      if (a.userProgress.progress !== b.userProgress.progress) {
        return b.userProgress.progress - a.userProgress.progress;
      }
      const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 4 };
      return tierOrder[a.tier] - tierOrder[b.tier];
    });
  }, [processedAchievements, selectedCategory, selectedTier]);

  // Statistics
  const stats = useMemo(() => {
    const unlocked = processedAchievements.filter((a) => a.userProgress.isUnlocked).length;
    const total = processedAchievements.length;
    const inProgress = processedAchievements.filter(
      (a) => !a.userProgress.isUnlocked && a.userProgress.progress > 0,
    ).length;
    const totalPoints = processedAchievements
      .filter((a) => a.userProgress.isUnlocked)
      .reduce((sum, a) => sum + a.points, 0);
    const totalXP = processedAchievements
      .filter((a) => a.userProgress.isUnlocked)
      .reduce((sum, a) => sum + a.xp, 0);

    return {
      unlocked,
      total,
      inProgress,
      totalPoints,
      totalXP,
      completionRate: total > 0 ? (unlocked / total) * 100 : 0,
    };
  }, [processedAchievements]);

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(achievements.map((a) => a.category));
    return ['all', ...Array.from(cats)];
  }, [achievements]);

  // Tier configs
  const getTierConfig = (tier: AchievementTier) => {
    const configs = {
      bronze: {
        color: 'from-orange-700 to-orange-900',
        borderColor: 'border-orange-600/30',
        textColor: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        icon: Medal,
      },
      silver: {
        color: 'from-gray-400 to-gray-600',
        borderColor: 'border-gray-400/30',
        textColor: 'text-gray-300',
        bgColor: 'bg-gray-500/10',
        icon: Medal,
      },
      gold: {
        color: 'from-yellow-500 to-yellow-700',
        borderColor: 'border-yellow-500/30',
        textColor: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        icon: Trophy,
      },
      platinum: {
        color: 'from-cyan-400 to-cyan-600',
        borderColor: 'border-cyan-400/30',
        textColor: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        icon: Star,
      },
      diamond: {
        color: 'from-purple-500 to-pink-500',
        borderColor: 'border-purple-500/30',
        textColor: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        icon: Crown,
      },
    };
    return configs[tier];
  };

  // Render achievement card
  const renderAchievementCard = (achievement: typeof processedAchievements[0]) => {
    const tierConfig = getTierConfig(achievement.tier);
    const TierIcon = tierConfig.icon;
    const isExpanded = expandedAchievement === achievement.id;
    const { userProgress } = achievement;

    return (
      <motion.div
        key={achievement.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`group relative bg-gray-800/50  border rounded-xl overflow-hidden transition-all ${
          userProgress.isUnlocked
            ? `${tierConfig.borderColor} hover:shadow-lg hover:shadow-${achievement.tier}-500/20`
            : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        {/* Unlocked glow effect */}
        {userProgress.isUnlocked && (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${tierConfig.color} opacity-5 pointer-events-none`}
          />
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Icon */}
            <div
              className={`flex-none w-16 h-16 rounded-xl flex items-center justify-center border ${
                userProgress.isUnlocked
                  ? `bg-gradient-to-br ${tierConfig.color} ${tierConfig.borderColor}`
                  : 'bg-gray-700 border-gray-600'
              }`}
            >
              {userProgress.isUnlocked ? (
                <TierIcon className="w-8 h-8 text-white" />
              ) : (
                <Lock className="w-8 h-8 text-gray-500" />
              )}
            </div>

            {/* Title & Progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3
                  className={`font-bold ${
                    userProgress.isUnlocked ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {achievement.name}
                </h3>
                <span
                  className={`flex-none px-2 py-0.5 rounded text-xs font-medium ${tierConfig.bgColor} ${tierConfig.textColor} border ${tierConfig.borderColor} capitalize`}
                >
                  {achievement.tier}
                </span>
              </div>

              <p className="text-sm text-gray-400 mb-3 line-clamp-2">{achievement.description}</p>

              {/* Progress Bar */}
              {!userProgress.isUnlocked && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-400">
                      {userProgress.currentValue} / {userProgress.targetValue}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${userProgress.progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${tierConfig.color}`}
                    />
                  </div>
                  <div className="text-xs text-gray-500">{userProgress.progress.toFixed(1)}% Complete</div>
                </div>
              )}

              {/* Unlocked Badge */}
              {userProgress.isUnlocked && (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Unlocked</span>
                  {userProgress.unlockedAt && (
                    <span className="text-xs text-gray-500">
                      {new Date(userProgress.unlockedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rewards */}
          <div className="flex items-center gap-4 mb-4">
            {achievement.points > 0 && (
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-500">{achievement.points}</span>
                <span className="text-xs text-gray-500">pts</span>
              </div>
            )}
            {achievement.xp > 0 && (
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-500">{achievement.xp}</span>
                <span className="text-xs text-gray-500">XP</span>
              </div>
            )}
            {achievement.badge && (
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-purple-400">{achievement.badge}</span>
              </div>
            )}
          </div>

          {/* Requirements */}
          <button
            onClick={() => setExpandedAchievement(isExpanded ? null : achievement.id)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            <span className="text-gray-300">Requirements</span>
            <ChevronRight
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {achievement.requirements.map((req) => (
                    <div
                      key={`${req.type}-${req.target}`}
                      className="flex items-start gap-2 p-2 bg-gray-700/30 rounded-lg"
                    >
                      <Target className="flex-none w-4 h-4 text-blue-400 mt-0.5" />
                      <div className="flex-1 text-sm text-gray-300">
                        {req.type === 'challenge' && req.challengeIds && (
                          <span>Complete {req.challengeIds.length} specific challenges</span>
                        )}
                        {req.type === 'total' && req.metric && (
                          <span>
                            Reach {req.target} {req.metric}
                          </span>
                        )}
                        {req.type === 'streak' && (
                          <span>Maintain a {req.target}-day streak</span>
                        )}
                        {req.type === 'milestone' && (
                          <span>Achieve milestone of {req.target}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Claim Reward Button */}
          {userProgress.isUnlocked && onClaimReward && (
            <button
              onClick={() => onClaimReward(achievement.id)}
              className={`w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r ${tierConfig.color} hover:opacity-90 text-white rounded-lg transition-opacity`}
            >
              <Gift className="w-4 h-4" />
              Claim Reward
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full h-full bg-gray-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-none bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-purple-900/40 border-b border-purple-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Achievement Milestones</h2>
            <p className="text-gray-400">Track your progress and unlock exclusive rewards</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-gray-800/50  border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400 uppercase">Unlocked</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.unlocked}/{stats.total}
            </div>
          </div>
          <div className="bg-blue-500/10  border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-400 uppercase">In Progress</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
          </div>
          <div className="bg-purple-500/10  border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 uppercase">Completion</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{stats.completionRate.toFixed(0)}%</div>
          </div>
          <div className="bg-yellow-500/10  border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-400 uppercase">Total Points</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{stats.totalPoints}</div>
          </div>
          <div className="bg-blue-500/10  border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-400 uppercase">Total XP</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.totalXP}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10  border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 uppercase">Rank</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {stats.unlocked > 50 ? 'Legend' : stats.unlocked > 25 ? 'Expert' : stats.unlocked > 10 ? 'Skilled' : 'Beginner'}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-none bg-gray-800/50 border-b border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Category:</span>
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Tier:</span>
            <div className="flex gap-2">
              {(['all', 'bronze', 'silver', 'gold', 'platinum', 'diamond'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    selectedTier === tier
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Grid/List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredAchievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Lock className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No achievements found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredAchievements.map(renderAchievementCard)}
          </div>
        )}
      </div>
    </div>
  );
};
