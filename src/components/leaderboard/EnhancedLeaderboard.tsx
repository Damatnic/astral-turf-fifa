/**
 * Enhanced Leaderboard with Player Cards
 * 
 * Shows top players with their Ultimate Player Cards
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Users } from 'lucide-react';
import { useAllPlayerCards } from '../../hooks/usePlayerCardUpdates';
import { UltimatePlayerCard } from '../player/UltimatePlayerCard';
import { PlayerComparisonModal } from '../player/PlayerComparisonModal';

interface EnhancedLeaderboardProps {
  maxPlayers?: number;
  showComparison?: boolean;
}

export const EnhancedLeaderboard: React.FC<EnhancedLeaderboardProps> = ({
  maxPlayers = 10,
  showComparison = true,
}) => {
  const playersWithProgressions = useAllPlayerCards();
  const topPlayers = playersWithProgressions.slice(0, maxPlayers);
  
  const [selectedPlayer1, setSelectedPlayer1] = useState<string | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<string | null>(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

  const handlePlayerSelect = (playerId: string) => {
    if (!showComparison) return;

    if (!selectedPlayer1) {
      setSelectedPlayer1(playerId);
    } else if (!selectedPlayer2 && playerId !== selectedPlayer1) {
      setSelectedPlayer2(playerId);
      setComparisonModalOpen(true);
    } else {
      // Reset selection
      setSelectedPlayer1(playerId);
      setSelectedPlayer2(null);
    }
  };

  const handleCloseComparison = () => {
    setComparisonModalOpen(false);
    setSelectedPlayer1(null);
    setSelectedPlayer2(null);
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" fill="currentColor" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" fill="currentColor" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" fill="currentColor" />;
      default:
        return <span className="text-gray-400 font-bold">#{position}</span>;
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-xl">
            <Trophy className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Player Rankings</h2>
            <p className="text-sm text-gray-400">Top {maxPlayers} players by level</p>
          </div>
        </div>
        <div className="bg-gray-800 px-4 py-2 rounded-lg flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-white font-medium">{playersWithProgressions.length}</span>
          <span className="text-gray-400 text-sm">players</span>
        </div>
      </div>

      {showComparison && (selectedPlayer1 || selectedPlayer2) && (
        <div className="mb-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-300 text-sm">
            {selectedPlayer1 && !selectedPlayer2
              ? '✓ Player 1 selected. Select another player to compare.'
              : selectedPlayer2
              ? '✓ Both players selected. Click to compare!'
              : 'Select two players to compare their stats.'}
          </p>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-4">
        {topPlayers.map((item, index) => {
          const position = index + 1;
          const isSelected =
            item.player.id === selectedPlayer1 || item.player.id === selectedPlayer2;

          return (
            <motion.div
              key={item.player.id}
              className={`bg-gray-800 rounded-xl p-4 border transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              whileHover={{ scale: 1.02, x: 4 }}
              onClick={() => handlePlayerSelect(item.player.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center space-x-4">
                {/* Position */}
                <div className="w-12 flex items-center justify-center">
                  {getRankIcon(position)}
                </div>

                {/* Player Jersey */}
                <div
                  className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                >
                  {item.player.jerseyNumber}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">
                    {item.player.name}
                  </h3>
                  <p className="text-sm text-gray-400">{item.player.roleId}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6">
                  {/* Level */}
                  <div className="text-center">
                    <div className="text-2xl font-black text-yellow-400">
                      {item.progression.level}
                    </div>
                    <div className="text-xs text-gray-400">Level</div>
                  </div>

                  {/* Rank */}
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-400 uppercase">
                      {item.progression.rank}
                    </div>
                    <div className="text-xs text-gray-400">Rank</div>
                  </div>

                  {/* XP */}
                  <div className="text-center">
                    <div className="text-sm font-bold text-purple-400">
                      {item.progression.currentXP.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">XP</div>
                  </div>

                  {/* Achievements */}
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-400">
                      {item.progression.achievements.length}
                    </div>
                    <div className="text-xs text-gray-400">
                      <Award className="w-3 h-3 inline" />
                    </div>
                  </div>
                </div>

                {/* Trending indicator for top 3 */}
                {position <= 3 && (
                  <div className="flex items-center space-x-1 text-green-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* No players */}
      {topPlayers.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No players ranked yet</p>
          <p className="text-sm">Complete challenges to start ranking!</p>
        </div>
      )}

      {/* Comparison Modal */}
      {selectedPlayer1 && selectedPlayer2 && (
        <PlayerComparisonModal
          player1Id={selectedPlayer1}
          player2Id={selectedPlayer2}
          isOpen={comparisonModalOpen}
          onClose={handleCloseComparison}
        />
      )}
    </div>
  );
};

export default EnhancedLeaderboard;

