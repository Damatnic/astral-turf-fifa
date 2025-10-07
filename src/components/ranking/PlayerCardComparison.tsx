import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react';
import type { Player } from '../../types/player';
import type { PlayerRankingProfile } from '../../types/challenges';
import EnhancedPlayerRankingCard, { CardRarity } from './EnhancedPlayerRankingCard';

interface PlayerCardComparisonProps {
  players: Array<{
    player: Player;
    profile: PlayerRankingProfile;
    rarity?: CardRarity;
  }>;
  onClose?: () => void;
  maxPlayers?: number;
}

const PlayerCardComparison: React.FC<PlayerCardComparisonProps> = ({
  players,
  onClose,
  maxPlayers = 4,
}) => {
  const limitedPlayers = players.slice(0, maxPlayers);

  // Calculate attribute comparisons
  const attributeComparisons = useMemo(() => {
    const attributes = ['speed', 'passing', 'shooting', 'dribbling', 'tackling', 'positioning'] as const;

    return attributes.map((attr) => {
      const values = limitedPlayers.map((p) => p.player.attributes[attr]);
      const max = Math.max(...values);
      const min = Math.min(...values);

      return {
        name: attr.charAt(0).toUpperCase() + attr.slice(1),
        values: values.map((value, idx) => ({
          value,
          isBest: value === max && max !== min,
          isWorst: value === min && max !== min,
          player: limitedPlayers[idx],
        })),
      };
    });
  }, [limitedPlayers]);

  // Calculate overall ratings
  const overallRatings = useMemo(() => {
    return limitedPlayers.map((p, idx) => {
      const attrs = p.player.attributes;
      const overall = Math.round(
        (attrs.speed +
          attrs.passing +
          attrs.tackling +
          attrs.shooting +
          attrs.dribbling +
          attrs.positioning) / 6,
      );
      return { overall, index: idx };
    });
  }, [limitedPlayers]);

  const bestOverall = Math.max(...overallRatings.map((r) => r.overall));
  const worstOverall = Math.min(...overallRatings.map((r) => r.overall));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-7xl w-full max-h-[90vh] overflow-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Player Comparison</h2>
            <p className="text-sm text-gray-400 mt-1">
              Comparing {limitedPlayers.length} {limitedPlayers.length === 1 ? 'player' : 'players'}
            </p>
          </div>
          {onClose && (
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
            >
              <X size={20} />
            </motion.button>
          )}
        </div>

        {/* Player Cards Grid */}
        <div className="p-6">
          <div className={`grid gap-6 mb-8 ${
            limitedPlayers.length === 2 ? 'grid-cols-2' :
            limitedPlayers.length === 3 ? 'grid-cols-3' :
            'grid-cols-2 lg:grid-cols-4'
          }`}>
            {limitedPlayers.map((p, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="scale-75 origin-top">
                  <EnhancedPlayerRankingCard
                    player={p.player}
                    profile={p.profile}
                    rarity={p.rarity}
                    is3D={false}
                    showStats={false}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Overall Rating Comparison */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Overall Rating</h3>
            <div className="space-y-3">
              {overallRatings.map(({ overall, index }) => {
                const p = limitedPlayers[index];
                const isBest = overall === bestOverall && bestOverall !== worstOverall;
                const isWorst = overall === worstOverall && bestOverall !== worstOverall;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      isBest ? 'bg-green-500/20 border border-green-500/50' :
                      isWorst ? 'bg-red-500/20 border border-red-500/50' :
                      'bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {p.player.jerseyNumber}
                        </span>
                      </div>
                      <span className="font-medium text-white">{p.player.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${
                        isBest ? 'text-green-400' :
                        isWorst ? 'text-red-400' :
                        'text-white'
                      }`}>
                        {overall}
                      </span>
                      {isBest && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1 text-green-400 text-sm"
                        >
                          <TrendingUp size={16} />
                          Best
                        </motion.div>
                      )}
                      {isWorst && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1 text-red-400 text-sm"
                        >
                          <TrendingDown size={16} />
                          Lowest
                        </motion.div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Attribute Comparison */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Attribute Breakdown</h3>
            <div className="space-y-4">
              {attributeComparisons.map((attr) => (
                <div key={attr.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">{attr.name}</span>
                    <div className="flex gap-4">
                      {attr.values.map((v, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 ${
                            v.isBest ? 'text-green-400' :
                            v.isWorst ? 'text-red-400' :
                            'text-gray-400'
                          }`}
                        >
                          <span className="text-xs w-6 text-center">
                            {v.player.player.jerseyNumber}
                          </span>
                          <span className="text-sm font-bold w-8 text-right">{v.value}</span>
                          {v.isBest && <ArrowUp size={14} />}
                          {v.isWorst && <ArrowDown size={14} />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${limitedPlayers.length}, 1fr)` }}>
                    {attr.values.map((v, idx) => (
                      <div key={idx} className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${v.value}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                          className={`h-full ${
                            v.isBest ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            v.isWorst ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            'bg-gradient-to-r from-blue-500 to-blue-600'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* XP and Level Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Level Comparison */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Level Progress</h3>
              <div className="space-y-3">
                {limitedPlayers.map((p, idx) => {
                  const maxLevel = Math.max(...limitedPlayers.map((pl) => pl.profile.currentLevel));
                  const minLevel = Math.min(...limitedPlayers.map((pl) => pl.profile.currentLevel));
                  const isBest = p.profile.currentLevel === maxLevel && maxLevel !== minLevel;
                  const isWorst = p.profile.currentLevel === minLevel && maxLevel !== minLevel;

                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">{p.player.name}</span>
                        <span className={`text-sm font-bold ${
                          isBest ? 'text-green-400' :
                          isWorst ? 'text-red-400' :
                          'text-white'
                        }`}>
                          Level {p.profile.currentLevel}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(p.profile.currentLevel / 100) * 100}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                          className={`h-full ${
                            isBest ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            isWorst ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            'bg-gradient-to-r from-purple-500 to-purple-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total XP Comparison */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Total Experience</h3>
              <div className="space-y-3">
                {limitedPlayers.map((p, idx) => {
                  const maxXP = Math.max(...limitedPlayers.map((pl) => pl.profile.totalXP));
                  const minXP = Math.min(...limitedPlayers.map((pl) => pl.profile.totalXP));
                  const isBest = p.profile.totalXP === maxXP && maxXP !== minXP;
                  const isWorst = p.profile.totalXP === minXP && maxXP !== minXP;

                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">{p.player.name}</span>
                        <span className={`text-sm font-bold ${
                          isBest ? 'text-green-400' :
                          isWorst ? 'text-red-400' :
                          'text-white'
                        }`}>
                          {p.profile.totalXP.toLocaleString()} XP
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(p.profile.totalXP / maxXP) * 100}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                          className={`h-full ${
                            isBest ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            isWorst ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            'bg-gradient-to-r from-blue-500 to-blue-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PlayerCardComparison;
