// Ranking Comparison Component
import React from 'react';
import type { Player } from '../../types/player';
import { useChallengeContext } from '../../context/ChallengeContext';
import { playerRankingService } from '../../services/playerRankingService';

interface RankingComparisonProps {
  playerA: Player;
  playerB: Player | null;
  onSelectPlayerB: (playerId: string) => void;
  availablePlayers: Player[];
}

const RankingComparison: React.FC<RankingComparisonProps> = ({
  playerA,
  playerB,
  onSelectPlayerB,
  availablePlayers,
}) => {
  const { state } = useChallengeContext();

  const profileA = state.playerProfiles.get(playerA.id) || playerRankingService.getProfile(playerA.id);
  const profileB = playerB ? (state.playerProfiles.get(playerB.id) || playerRankingService.getProfile(playerB.id)) : null;

  const comparison = profileB ? playerRankingService.compareProfiles(playerA.id, playerB.id) : null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Player Comparison</h2>

      {/* Player Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-sm text-gray-400 mb-2">Player A</p>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="font-semibold text-white">{playerA.name}</p>
            <p className="text-sm text-gray-400">Level {profileA.currentLevel}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Player B</p>
          <select
            value={playerB?.id || ''}
            onChange={(e) => onSelectPlayerB(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select a player...</option>
            {availablePlayers.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} (Level {state.playerProfiles.get(player.id)?.currentLevel || 1})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Stats */}
      {profileB && comparison && (
        <div className="space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profileA.currentLevel}</p>
              <p className="text-xs text-gray-500">Level</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-400">VS</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profileB.currentLevel}</p>
              <p className="text-xs text-gray-500">Level</p>
            </div>
          </div>

          {/* Detailed Comparison */}
          <div className="space-y-3">
            {Object.entries({
              'Total XP': [profileA.totalXP, profileB.totalXP],
              'Challenges': [profileA.challengesCompleted.length, profileB.challengesCompleted.length],
              'Badges': [profileA.badges.length, profileB.badges.length],
              'Streak': [profileA.streakDays, profileB.streakDays],
              'Attribute Points': [profileA.unspentAttributePoints, profileB.unspentAttributePoints],
            }).map(([label, [valueA, valueB]]) => {
              const percentage = valueA + valueB > 0 ? (valueA / (valueA + valueB)) * 100 : 50;

              return (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-400">{label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white w-16 text-right">{valueA}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 relative">
                      <div
                        className="absolute left-0 h-2 bg-blue-500 rounded-l-full"
                        style={{ width: `${percentage}%` }}
                      />
                      <div
                        className="absolute right-0 h-2 bg-purple-500 rounded-r-full"
                        style={{ width: `${100 - percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white w-16">{valueB}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Winner */}
          <div className="text-center pt-4 border-t border-gray-700">
            {comparison.winner === 'A' && (
              <p className="text-lg font-bold text-blue-400">{playerA.name} is ahead!</p>
            )}
            {comparison.winner === 'B' && (
              <p className="text-lg font-bold text-purple-400">{playerB.name} is ahead!</p>
            )}
            {comparison.winner === 'tie' && (
              <p className="text-lg font-bold text-gray-400">It's a tie!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingComparison;