/**
 * Player Comparison Modal
 * 
 * Side-by-side player card comparison
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus, Award, Zap } from 'lucide-react';
import { UltimatePlayerCard } from './UltimatePlayerCard';
import { usePlayerComparison } from '../../hooks/usePlayerCardUpdates';
import type { Player } from '../../types';

interface PlayerComparisonModalProps {
  player1Id: string;
  player2Id: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerComparisonModal: React.FC<PlayerComparisonModalProps> = ({
  player1Id,
  player2Id,
  isOpen,
  onClose,
}) => {
  const { player1, player2, comparison } = usePlayerComparison(player1Id, player2Id);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div
              className="bg-gray-900 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-2xl font-black text-white flex items-center space-x-2">
                  <Award className="w-7 h-7" />
                  <span>Player Comparison</span>
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Player Cards */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Player 1 */}
                  <div className="flex justify-center">
                    {player1.player && player1.progression ? (
                      <UltimatePlayerCard
                        player={player1.player}
                        progression={player1.progression}
                        showProgression={true}
                        size="medium"
                        interactive={false}
                      />
                    ) : (
                      <div className="w-80 h-96 bg-gray-800 rounded-xl animate-pulse" />
                    )}
                  </div>

                  {/* Player 2 */}
                  <div className="flex justify-center">
                    {player2.player && player2.progression ? (
                      <UltimatePlayerCard
                        player={player2.player}
                        progression={player2.progression}
                        showProgression={true}
                        size="medium"
                        interactive={false}
                      />
                    ) : (
                      <div className="w-80 h-96 bg-gray-800 rounded-xl animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Comparison Stats */}
                {comparison && (
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span>Stat Comparison</span>
                    </h3>

                    <div className="space-y-3">
                      {/* Level Comparison */}
                      <ComparisonRow
                        label="Level"
                        value1={player1.progression?.level || 0}
                        value2={player2.progression?.level || 0}
                        difference={comparison.levelDifference}
                      />

                      {/* XP Comparison */}
                      <ComparisonRow
                        label="Total XP"
                        value1={player1.progression?.currentXP || 0}
                        value2={player2.progression?.currentXP || 0}
                        difference={comparison.xpDifference}
                        format="number"
                      />

                      {/* Challenges Comparison */}
                      <ComparisonRow
                        label="Challenges Completed"
                        value1={player1.progression?.totalChallengesCompleted || 0}
                        value2={player2.progression?.totalChallengesCompleted || 0}
                        difference={comparison.challengesDifference}
                      />

                      {/* Achievements Comparison */}
                      <ComparisonRow
                        label="Achievements"
                        value1={player1.progression?.achievements.length || 0}
                        value2={player2.progression?.achievements.length || 0}
                        difference={comparison.achievementsDifference}
                      />

                      {/* Streak Comparison */}
                      <ComparisonRow
                        label="Streak"
                        value1={player1.progression?.streakDays || 0}
                        value2={player2.progression?.streakDays || 0}
                        difference={(player1.progression?.streakDays || 0) - (player2.progression?.streakDays || 0)}
                        suffix=" days"
                      />

                      {/* Rank Comparison */}
                      <div className="grid grid-cols-3 gap-4 py-3 px-4 bg-gray-700 rounded-lg">
                        <div className="text-center">
                          <div className="text-gray-400 text-sm mb-1">Rank</div>
                          <div className="text-white font-bold uppercase">
                            {player1.progression?.rank || 'N/A'}
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-600 rounded-full p-2">
                            {comparison.rankDifference === 0 ? (
                              <Minus className="w-4 h-4 text-gray-400" />
                            ) : comparison.rankDifference > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 text-sm mb-1">Rank</div>
                          <div className="text-white font-bold uppercase">
                            {player2.progression?.rank || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Helper component for comparison rows
interface ComparisonRowProps {
  label: string;
  value1: number;
  value2: number;
  difference: number;
  format?: 'number' | 'plain';
  suffix?: string;
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({
  label,
  value1,
  value2,
  difference,
  format = 'plain',
  suffix = '',
}) => {
  const formatValue = (val: number) => {
    if (format === 'number') {
      return val.toLocaleString();
    }
    return val.toString();
  };

  return (
    <div className="grid grid-cols-3 gap-4 py-3 px-4 bg-gray-700 rounded-lg">
      <div className="text-right">
        <span className="text-white font-bold">{formatValue(value1)}{suffix}</span>
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="text-gray-400 text-xs mb-1">{label}</div>
        <div className="flex items-center space-x-1">
          {difference === 0 ? (
            <>
              <Minus className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm font-medium">Tied</span>
            </>
          ) : difference > 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">+{Math.abs(difference)}</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">-{Math.abs(difference)}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-left">
        <span className="text-white font-bold">{formatValue(value2)}{suffix}</span>
      </div>
    </div>
  );
};

export default PlayerComparisonModal;

