// Player Ranking Card Component - Displays player ranking summary

import React from 'react';
import { motion } from 'framer-motion';
import type { PlayerRankingProfile } from '../../types/challenges';
import type { Player } from '../../types/player';

interface PlayerRankingCardProps {
  player: Player;
  profile: PlayerRankingProfile;
  rank?: number;
  compact?: boolean;
}

const PlayerRankingCard: React.FC<PlayerRankingCardProps> = ({
  player,
  profile,
  rank,
  compact = false,
}) => {
  const getLevelColor = (level: number): string => {
    if (level >= 80) {return 'from-purple-600 to-pink-600';}
    if (level >= 60) {return 'from-blue-600 to-purple-600';}
    if (level >= 40) {return 'from-green-600 to-blue-600';}
    if (level >= 20) {return 'from-yellow-600 to-green-600';}
    return 'from-gray-600 to-yellow-600';
  };

  const getRankBadge = (rank: number): string => {
    if (rank === 1) {return '🥇';}
    if (rank === 2) {return '🥈';}
    if (rank === 3) {return '🥉';}
    return '';
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div className="flex items-center space-x-3">
          {rank && (
            <div className="text-lg font-bold text-gray-400 w-8">
              {getRankBadge(rank) || `#${rank}`}
            </div>
          )}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">{player.jerseyNumber}</span>
          </div>
          <div>
            <p className="font-medium text-white">{player.name}</p>
            <p className="text-xs text-gray-400">Level {profile.currentLevel}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white">{profile.totalXP}</p>
          <p className="text-xs text-gray-400">Total XP</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
    >
      {/* Header with gradient */}
      <div className={`h-2 bg-gradient-to-r ${getLevelColor(profile.currentLevel)}`} />

      <div className="p-6">
        {/* Player Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{player.jerseyNumber}</span>
              </div>
              {rank && rank <= 3 && (
                <div className="absolute -top-2 -right-2 text-2xl">
                  {getRankBadge(rank)}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{player.name}</h3>
              <p className="text-sm text-gray-400">{player.position} • {player.nationality}</p>
              <div className="flex items-center mt-1">
                <span className="text-sm font-medium text-blue-400">Level {profile.currentLevel}</span>
                {profile.streakDays > 0 && (
                  <span className="ml-3 text-sm text-orange-400">🔥 {profile.streakDays} day streak</span>
                )}
              </div>
            </div>
          </div>
          {rank && (
            <div className="text-center">
              <p className="text-3xl font-bold text-white">#{rank}</p>
              <p className="text-xs text-gray-500">Rank</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{profile.totalXP}</p>
            <p className="text-xs text-gray-400">Total XP</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{profile.totalStats.totalChallengesCompleted}</p>
            <p className="text-xs text-gray-400">Challenges</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{profile.badges.length}</p>
            <p className="text-xs text-gray-400">Badges</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{profile.unspentAttributePoints}</p>
            <p className="text-xs text-gray-400">Points</p>
          </div>
        </div>

        {/* Recent Badges */}
        {profile.badges.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-400 mb-2">Recent Badges</p>
            <div className="flex space-x-2">
              {profile.badges.slice(-5).map(badge => (
                <div
                  key={badge.id}
                  className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center tooltip"
                  title={badge.name}
                >
                  <span className="text-lg">🏅</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress to Next Level */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">Progress to Level {profile.currentLevel + 1}</span>
            <span className="text-sm font-medium text-white">
              {profile.xpToNextLevel} XP needed
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              style={{
                width: `${Math.max(0, 100 - (profile.xpToNextLevel / (profile.totalXP + profile.xpToNextLevel)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Object.entries(profile.totalStats.categoryBreakdown).map(([category, count]) => (
            <div key={category} className="text-center">
              <p className="text-xs text-gray-500 capitalize">{category}</p>
              <p className="text-sm font-bold text-white">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerRankingCard;