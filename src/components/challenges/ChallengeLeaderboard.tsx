// Challenge Leaderboard Component - Displays player rankings

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LeaderboardEntry } from '../../types/challenges';

interface ChallengeLeaderboardProps {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
  onPlayerSelect?: (playerId: string) => void;
}

const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  entries,
  currentPlayerId,
  onPlayerSelect,
}) => {
  const [sortBy, setSortBy] = useState<'total' | 'weekly' | 'monthly'>('total');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const sortedEntries = [...entries].sort((a, b) => {
    switch (sortBy) {
      case 'weekly':
        return b.weeklyXP - a.weeklyXP;
      case 'monthly':
        return b.monthlyXP - a.monthlyXP;
      default:
        return b.totalXP - a.totalXP;
    }
  });

  const getRankBadge = (rank: number): string => {
    if (rank === 1) {
      return '🥇';
    }
    if (rank === 2) {
      return '🥈';
    }
    if (rank === 3) {
      return '🥉';
    }
    return '';
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) {
      return 'from-yellow-600/20 to-yellow-700/20 border-yellow-600/50';
    }
    if (rank === 2) {
      return 'from-gray-500/20 to-gray-600/20 border-gray-500/50';
    }
    if (rank === 3) {
      return 'from-orange-600/20 to-orange-700/20 border-orange-600/50';
    }
    return 'from-gray-800 to-gray-800 border-gray-700';
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Player Rankings</h2>

        {/* Sort Options */}
        <div className="flex space-x-2">
          {(['total', 'weekly', 'monthly'] as const).map(option => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                sortBy === option
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              {option === 'total' ? 'All Time' : option}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="divide-y divide-gray-700">
        <AnimatePresence>
          {sortedEntries.map((entry, index) => {
            const rank = index + 1;
            const isCurrentPlayer = entry.playerId === currentPlayerId;
            const isExpanded = expandedPlayerId === entry.playerId;

            return (
              <motion.div
                key={entry.playerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`relative overflow-hidden ${isCurrentPlayer ? 'bg-blue-600/10' : ''}`}
              >
                <div
                  className={`p-4 cursor-pointer hover:bg-gray-700/50 transition-colors bg-gradient-to-r ${getRankColor(
                    rank
                  )} ${rank <= 3 ? 'border-l-4' : ''}`}
                  onClick={() => {
                    setExpandedPlayerId(isExpanded ? null : entry.playerId);
                    onPlayerSelect?.(entry.playerId);
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* Rank and Player Info */}
                    <div className="flex items-center space-x-4">
                      <div className="text-center w-12">
                        {rank <= 3 ? (
                          <span className="text-3xl">{getRankBadge(rank)}</span>
                        ) : (
                          <span className="text-xl font-bold text-gray-400">#{rank}</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            rank === 1
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                              : rank === 2
                                ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                                : rank === 3
                                  ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
                          }`}
                        >
                          <span className="text-lg font-bold text-white">L{entry.level}</span>
                        </div>

                        <div>
                          <p className="font-semibold text-white">
                            {entry.playerName}
                            {isCurrentPlayer && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                                YOU
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-400">{entry.teamName}</p>
                        </div>
                      </div>

                      {/* Trend Indicator */}
                      {entry.previousRank && (
                        <div className="flex items-center">
                          {entry.trend === 'up' && (
                            <span className="text-green-400 flex items-center text-sm">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {Math.abs(entry.previousRank - rank)}
                            </span>
                          )}
                          {entry.trend === 'down' && (
                            <span className="text-red-400 flex items-center text-sm">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {Math.abs(entry.previousRank - rank)}
                            </span>
                          )}
                          {entry.trend === 'stable' && (
                            <span className="text-gray-500 text-sm">–</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">
                          {sortBy === 'weekly'
                            ? entry.weeklyXP.toLocaleString()
                            : sortBy === 'monthly'
                              ? entry.monthlyXP.toLocaleString()
                              : entry.totalXP.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sortBy === 'weekly'
                            ? 'Weekly XP'
                            : sortBy === 'monthly'
                              ? 'Monthly XP'
                              : 'Total XP'}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-bold text-yellow-400">{entry.badges}</p>
                        <p className="text-xs text-gray-500">Badges</p>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setExpandedPlayerId(isExpanded ? null : entry.playerId);
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg
                          className={`w-5 h-5 transform transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-gray-600"
                    >
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-400">All Time XP</p>
                          <p className="text-lg font-bold text-white">
                            {entry.totalXP.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-400">Weekly XP</p>
                          <p className="text-lg font-bold text-blue-400">
                            {entry.weeklyXP.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-400">Monthly XP</p>
                          <p className="text-lg font-bold text-purple-400">
                            {entry.monthlyXP.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      <div className="p-4 bg-gray-900/50 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Total Players</p>
            <p className="text-lg font-bold text-white">{entries.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Avg Level</p>
            <p className="text-lg font-bold text-blue-400">
              {Math.round(entries.reduce((sum, e) => sum + e.level, 0) / entries.length) || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total XP</p>
            <p className="text-lg font-bold text-purple-400">
              {entries.reduce((sum, e) => sum + e.totalXP, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeLeaderboard;
