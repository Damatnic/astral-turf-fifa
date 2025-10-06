/**
 * Real-Time Leaderboard Component
 * Live updating leaderboard with animations and rank changes
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Medal,
  Star,
  Zap,
  Award,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Leaderboard, LeaderboardEntry } from '../../types/challenge';

interface LeaderboardComponentProps {
  leaderboard: Leaderboard;
  currentUserId?: string;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const LeaderboardComponent: React.FC<LeaderboardComponentProps> = ({
  leaderboard,
  currentUserId,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setLastUpdate(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Get rank badge
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-full">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-bold text-sm">1st</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30 rounded-full">
          <Medal className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 font-bold text-sm">2nd</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-600/20 to-orange-700/20 border border-orange-600/30 rounded-full">
          <Medal className="w-4 h-4 text-orange-500" />
          <span className="text-orange-400 font-bold text-sm">3rd</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-10 h-10 bg-gray-800/50 border border-gray-700 rounded-full">
        <span className="text-gray-400 font-semibold text-sm">{rank}</span>
      </div>
    );
  };

  // Get rank change indicator
  const getRankChangeIndicator = (entry: LeaderboardEntry) => {
    if (!entry.previousRank || !entry.rankChange) return null;

    if (entry.rankChange === 'up') {
      return (
        <div className="flex items-center gap-1 text-green-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-medium">
            +{entry.previousRank - entry.rank}
          </span>
        </div>
      );
    }
    if (entry.rankChange === 'down') {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs font-medium">
            -{entry.rank - entry.previousRank}
          </span>
        </div>
      );
    }
    if (entry.rankChange === 'new') {
      return (
        <div className="flex items-center gap-1 text-blue-400">
          <Star className="w-4 h-4" />
          <span className="text-xs font-medium">New</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <Minus className="w-4 h-4" />
      </div>
    );
  };

  // Get top 3 podium
  const podiumEntries = leaderboard.entries.slice(0, 3);
  const remainingEntries = leaderboard.entries.slice(3);

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              {leaderboard.name}
            </h2>
            <p className="text-sm text-gray-400">
              {leaderboard.totalParticipants} participants • 
              {leaderboard.isLive && (
                <span className="ml-2 inline-flex items-center gap-1 text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Timeframe & Last Update */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="capitalize">{leaderboard.timeframe}</span>
          <span>•</span>
          <span>Updated {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Podium (Top 3) */}
      {podiumEntries.length > 0 && (
        <div className="p-6 bg-gradient-to-b from-gray-800/50 to-transparent">
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* 2nd Place */}
            {podiumEntries[1] && (
              <motion.div
                className="flex flex-col items-center order-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                      {podiumEntries[1].userAvatar ? (
                        <img
                          src={podiumEntries[1].userAvatar}
                          alt={podiumEntries[1].userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {podiumEntries[1].userName.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2">
                    {getRankBadge(2)}
                  </div>
                </div>
                <p className="text-sm font-semibold text-white text-center mb-1 line-clamp-1">
                  {podiumEntries[1].userName}
                </p>
                <p className="text-xl font-bold text-gray-300">{podiumEntries[1].score}</p>
                <div className="h-24 w-full bg-gradient-to-b from-gray-400/20 to-gray-500/20 border border-gray-400/30 rounded-t-lg mt-2" />
              </motion.div>
            )}

            {/* 1st Place */}
            {podiumEntries[0] && (
              <motion.div
                className="flex flex-col items-center order-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="relative mb-3">
                  <motion.div
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 p-0.5"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(234, 179, 8, 0.5)',
                        '0 0 40px rgba(234, 179, 8, 0.7)',
                        '0 0 20px rgba(234, 179, 8, 0.5)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                      {podiumEntries[0].userAvatar ? (
                        <img
                          src={podiumEntries[0].userAvatar}
                          alt={podiumEntries[0].userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-white">
                          {podiumEntries[0].userName.charAt(0)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                  <div className="absolute -bottom-2 -right-2">
                    {getRankBadge(1)}
                  </div>
                </div>
                <p className="text-base font-bold text-white text-center mb-1 line-clamp-1">
                  {podiumEntries[0].userName}
                </p>
                <p className="text-2xl font-bold text-yellow-400">{podiumEntries[0].score}</p>
                <div className="h-32 w-full bg-gradient-to-b from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30 rounded-t-lg mt-2" />
              </motion.div>
            )}

            {/* 3rd Place */}
            {podiumEntries[2] && (
              <motion.div
                className="flex flex-col items-center order-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-orange-700 p-0.5">
                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                      {podiumEntries[2].userAvatar ? (
                        <img
                          src={podiumEntries[2].userAvatar}
                          alt={podiumEntries[2].userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {podiumEntries[2].userName.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2">
                    {getRankBadge(3)}
                  </div>
                </div>
                <p className="text-sm font-semibold text-white text-center mb-1 line-clamp-1">
                  {podiumEntries[2].userName}
                </p>
                <p className="text-xl font-bold text-gray-300">{podiumEntries[2].score}</p>
                <div className="h-20 w-full bg-gradient-to-b from-orange-600/20 to-orange-700/20 border border-orange-600/30 rounded-t-lg mt-2" />
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Remaining Rankings */}
      {remainingEntries.length > 0 && (
        <div className="p-6">
          <div className="space-y-2">
            <AnimatePresence>
              {remainingEntries.map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    entry.userId === currentUserId
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {getRankBadge(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-semibold truncate ${
                        entry.userId === currentUserId ? 'text-blue-400' : 'text-white'
                      }`}>
                        {entry.userName}
                        {entry.userId === currentUserId && (
                          <span className="ml-2 text-xs text-blue-400">(You)</span>
                        )}
                      </p>
                      {getRankChangeIndicator(entry)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {entry.challengesCompleted} challenges
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {entry.achievements} achievements
                      </span>
                      {entry.streak && entry.streak > 0 && (
                        <span className="flex items-center gap-1 text-orange-400">
                          <Zap className="w-3 h-3" />
                          {entry.streak} day streak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-2xl font-bold text-white">{entry.score}</p>
                    {entry.scoreChange !== undefined && entry.scoreChange !== 0 && (
                      <p className={`text-xs font-medium ${
                        entry.scoreChange > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {entry.scoreChange > 0 ? '+' : ''}{entry.scoreChange}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {leaderboard.entries.length === 0 && (
        <div className="p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg font-medium mb-2">No rankings yet</p>
          <p className="text-gray-500 text-sm">
            Complete challenges to appear on the leaderboard
          </p>
        </div>
      )}
    </div>
  );
};
