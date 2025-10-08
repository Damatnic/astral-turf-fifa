/**
 * Player Card Widget
 * 
 * Compact player card display for dashboard with quick stats
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthContext } from '../../hooks';
import { usePlayerCardUpdates } from '../../hooks/usePlayerCardUpdates';
import { TrendingUp, Award, Zap, Star } from 'lucide-react';

export const PlayerCardWidget: React.FC = () => {
  const navigate = useNavigate();
  const { authState } = useAuthContext();
  const { player, progression, isLoading } = usePlayerCardUpdates(
    authState.user?.playerId || ''
  );

  if (isLoading || !player || !progression) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
        <div className="h-48 bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  const xpPercent = (progression.currentXP / (progression.currentXP + progression.xpToNextLevel)) * 100;

  return (
    <motion.div
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all cursor-pointer shadow-xl"
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={() => navigate('/player-card')}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg">
            {player.jerseyNumber}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{player.name}</h3>
            <p className="text-sm text-gray-400">{player.roleId}</p>
          </div>
        </div>
        <div className="bg-yellow-500 rounded-lg px-3 py-1 flex items-center space-x-1">
          <Star className="w-4 h-4 text-gray-900" fill="currentColor" />
          <span className="text-gray-900 font-bold">{progression.level}</span>
        </div>
      </div>

      {/* XP Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
          <span className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>Level Progress</span>
          </span>
          <span className="text-white font-medium">
            {progression.currentXP.toLocaleString()} / {(progression.currentXP + progression.xpToNextLevel).toLocaleString()} XP
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{progression.rank.toUpperCase()}</div>
          <div className="text-xs text-gray-400 mt-1">Rank</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{progression.totalChallengesCompleted}</div>
          <div className="text-xs text-gray-400 mt-1">Challenges</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{progression.achievements.length}</div>
          <div className="text-xs text-gray-400 mt-1">Achievements</div>
        </div>
      </div>

      {/* Streak & Recent Achievement */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-orange-400">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-medium">{progression.streakDays} Day Streak</span>
        </div>
        {progression.achievements.length > 0 && (
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Award className="w-3 h-3" />
            <span>Latest: {progression.achievements[0].name}</span>
          </div>
        )}
      </div>

      {/* Career Stats Footer */}
      {progression.careerStats && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="text-white font-bold">{progression.careerStats.matches}</div>
              <div className="text-gray-400">Matches</div>
            </div>
            <div>
              <div className="text-white font-bold">{progression.careerStats.goals}</div>
              <div className="text-gray-400">Goals</div>
            </div>
            <div>
              <div className="text-white font-bold">{progression.careerStats.assists}</div>
              <div className="text-gray-400">Assists</div>
            </div>
            <div>
              <div className="text-white font-bold">{progression.careerStats.winRate}%</div>
              <div className="text-gray-400">Win Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* View Full Card CTA */}
      <motion.div
        className="mt-4 bg-blue-600 hover:bg-blue-700 rounded-lg py-2 text-center text-white text-sm font-medium transition-colors flex items-center justify-center space-x-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <TrendingUp className="w-4 h-4" />
        <span>View Full Card</span>
      </motion.div>
    </motion.div>
  );
};

export default PlayerCardWidget;

