/**
 * 🎮 ULTIMATE PLAYER CARD SYSTEM - COMPLETE REDESIGN
 * 
 * Professional sports card design that fits all information cleanly
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  TrendingUp,
  Award,
  Zap,
  Trophy,
  Target,
  Flame,
  Users,
} from 'lucide-react';
import type { Player } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type PlayerRank = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: CardRarity;
  unlockedAt?: Date;
}

export interface PlayerProgression {
  currentXP: number;
  xpToNextLevel: number;
  level: number;
  rank: PlayerRank;
  rankProgress: number;
  totalChallengesCompleted: number;
  achievements: Achievement[];
  streakDays: number;
  isShiny: boolean;
  careerStats?: CareerStats;
}

export interface CareerStats {
  matches: number;
  goals: number;
  assists: number;
  winRate: number;
}

export interface UltimatePlayerCardProps {
  player: Player;
  progression?: PlayerProgression;
  showProgression?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xl';
  interactive?: boolean;
  showChallenges?: boolean;
  onLevelUp?: (newLevel: number) => void;
  onRankUp?: (newRank: PlayerRank) => void;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// RANK CONFIGURATION
// ============================================================================

const RANK_CONFIG = {
  bronze: {
    name: 'Bronze',
    gradient: 'from-orange-600 to-orange-800',
    border: 'border-orange-500',
    icon: '🥉',
  },
  silver: {
    name: 'Silver',
    gradient: 'from-gray-400 to-gray-600',
    border: 'border-gray-400',
    icon: '🥈',
  },
  gold: {
    name: 'Gold',
    gradient: 'from-yellow-400 to-yellow-600',
    border: 'border-yellow-400',
    icon: '🥇',
  },
  diamond: {
    name: 'Diamond',
    gradient: 'from-cyan-400 to-blue-600',
    border: 'border-cyan-400',
    icon: '💎',
  },
  legend: {
    name: 'Legend',
    gradient: 'from-purple-500 via-pink-500 to-red-500',
    border: 'border-purple-400',
    icon: '👑',
  },
};

function getRankFromLevel(level: number): PlayerRank {
  if (level <= 10) return 'bronze';
  if (level <= 25) return 'silver';
  if (level <= 50) return 'gold';
  if (level <= 75) return 'diamond';
  return 'legend';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const UltimatePlayerCard: React.FC<UltimatePlayerCardProps> = ({
  player,
  progression,
  showProgression = true,
  interactive = true,
  onClick,
  className = '',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const defaultProgression: PlayerProgression = {
    currentXP: 750,
    xpToNextLevel: 1000,
    level: 15,
    rank: getRankFromLevel(15),
    rankProgress: 45,
    totalChallengesCompleted: 12,
    achievements: [
      { id: '1', name: 'First Goal', description: 'Score your first goal', icon: '⚽', rarity: 'common' },
      { id: '2', name: 'Hat Trick', description: 'Score 3 goals', icon: '🎩', rarity: 'rare' },
      { id: '3', name: 'Perfect Week', description: 'Win all matches', icon: '📅', rarity: 'epic' },
    ],
    streakDays: 7,
    isShiny: false,
    careerStats: {
      matches: 234,
      goals: 87,
      assists: 56,
      winRate: 68,
    },
  };

  const prog = progression || defaultProgression;
  const rank = getRankFromLevel(prog.level);
  const rankConfig = RANK_CONFIG[rank];

  return (
    <motion.div
      className={`relative w-full max-w-sm mx-auto ${className}`}
      whileHover={interactive ? { scale: 1.02 } : {}}
      onClick={onClick}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ============================================================ */}
        {/* FRONT OF CARD - Clean FIFA-style Design */}
        {/* ============================================================ */}
        <div
          className={`relative rounded-2xl overflow-hidden border-4 ${rankConfig.border} shadow-2xl bg-gradient-to-br ${rankConfig.gradient}`}
          style={{ backfaceVisibility: 'hidden', minHeight: '600px' }}
        >
          {/* Shiny Effect */}
          {prog.isShiny && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 animate-pulse pointer-events-none" />
          )}

          <div className="relative p-6">
            {/* Header: Rank Badge & Stars */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-2xl">{rankConfig.icon}</span>
                <span className="text-white font-bold text-sm">{rankConfig.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>

            {/* Player Jersey Number & Level */}
            <div className="relative mb-4">
              <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-md rounded-full border-4 border-white/50 shadow-2xl flex items-center justify-center">
                <span className="text-white text-6xl font-black drop-shadow-lg">
                  {player.jerseyNumber || '?'}
                </span>
              </div>
              {/* Level Badge */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-4 py-1 border-2 border-white shadow-xl">
                <span className="text-black font-black text-sm flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  {prog.level}
                </span>
              </div>
              {/* Streak Badge */}
              {prog.streakDays >= 3 && (
                <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full px-2 py-1 border-2 border-white shadow-xl">
                  <span className="text-white text-xs font-bold flex items-center">
                    <Flame className="w-3 h-3 mr-0.5" />
                    {prog.streakDays}
                  </span>
                </div>
              )}
            </div>

            {/* Player Name */}
            <div className="text-center mb-4">
              <h3 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-lg">
                {player.name}
              </h3>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <span className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-white font-bold text-xs">
                  {player.roleId || 'PLAYER'}
                </span>
                <span className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-white font-bold text-xs">
                  AGE {player.age || 25}
                </span>
              </div>
            </div>

            {/* Overall Rating */}
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-xl px-6 py-3 transform shadow-2xl border-2 border-yellow-300">
                <div className="text-white font-black text-5xl drop-shadow-lg text-center">
                  {player.overall || 75}
                </div>
                <div className="text-white/90 text-xs font-bold text-center uppercase tracking-wider mt-1">
                  Overall
                </div>
              </div>
            </div>

            {/* Player Attributes - 3 Main Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'PAC', value: (player.attributes as any)?.pace || 85, color: 'bg-green-600' },
                { label: 'SHO', value: (player.attributes as any)?.shooting || 80, color: 'bg-red-600' },
                { label: 'PAS', value: (player.attributes as any)?.passing || 88, color: 'bg-blue-600' },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.color} rounded-lg p-3 text-center border-2 border-white/30`}>
                  <div className="text-white font-bold text-2xl">{stat.value}</div>
                  <div className="text-white/80 text-xs font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* XP Progress Bar */}
            {showProgression && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between text-xs text-white/80 mb-2">
                  <span className="font-medium flex items-center">
                    <Zap className="w-3 h-3 mr-1 text-yellow-400" />
                    Level {prog.level} ({rankConfig.name})
                  </span>
                  <span className="font-medium">{prog.currentXP} / {prog.xpToNextLevel} XP</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(prog.currentXP / prog.xpToNextLevel) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            )}

            {/* Achievements - Compact */}
            {prog.achievements.length > 0 && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-xs font-bold flex items-center">
                    <Trophy className="w-3 h-3 mr-1 text-yellow-400" />
                    Achievements
                  </span>
                  <span className="text-white/70 text-xs">{prog.achievements.length}</span>
                </div>
                <div className="flex justify-center space-x-1.5">
                  {prog.achievements.slice(0, 3).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 border-2 border-white/50 flex items-center justify-center text-sm shadow-lg"
                      title={achievement.name}
                    >
                      {achievement.icon}
                    </div>
                  ))}
                  {prog.achievements.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-white/50 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      +{prog.achievements.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View Details Button */}
            {interactive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(!isFlipped);
                }}
                className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-sm font-bold transition-all border border-white/30"
              >
                View Details →
              </button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* BACK OF CARD - Detailed Stats */}
        {/* ============================================================ */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 shadow-2xl p-6 overflow-y-auto"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', minHeight: '600px' }}
        >
          {/* Back Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(false);
            }}
            className="w-full mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
          >
            ← Back to Front
          </button>

          {/* Player Info */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-1">{player.name}</h3>
            <p className="text-gray-400 text-sm">Complete Player Profile</p>
          </div>

          {/* Main Stats Grid */}
          <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
            <h4 className="text-white font-bold text-sm mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-cyan-400" />
              Player Attributes
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Pace', value: (player.attributes as any)?.pace || 87 },
                { name: 'Shooting', value: (player.attributes as any)?.shooting || 82 },
                { name: 'Passing', value: (player.attributes as any)?.passing || 85 },
                { name: 'Dribbling', value: (player.attributes as any)?.dribbling || 88 },
                { name: 'Defending', value: (player.attributes as any)?.defending || 75 },
                { name: 'Physical', value: (player.attributes as any)?.physical || 80 },
              ].map((attr) => (
                <div key={attr.name} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{attr.name}</span>
                  <span className="text-white font-bold text-lg">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Career Stats */}
          <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
            <h4 className="text-white font-bold text-sm mb-3 flex items-center">
              <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
              Career Stats
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Users className="w-5 h-5" />, label: 'Matches', value: prog.careerStats?.matches || 0 },
                { icon: <Target className="w-5 h-5" />, label: 'Goals', value: prog.careerStats?.goals || 0 },
                { icon: <Zap className="w-5 h-5" />, label: 'Assists', value: prog.careerStats?.assists || 0 },
                { icon: <Trophy className="w-5 h-5" />, label: 'Win Rate', value: `${prog.careerStats?.winRate || 0}%` },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-gray-400 mb-1">{stat.icon}</div>
                  <div className="text-white font-bold text-xl">{stat.value}</div>
                  <div className="text-gray-400 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          {prog.achievements.length > 0 && (
            <div className="bg-slate-700/50 rounded-xl p-4">
              <h4 className="text-white font-bold text-sm mb-3 flex items-center">
                <Award className="w-4 h-4 mr-2 text-purple-400" />
                Achievements ({prog.achievements.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {prog.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center space-x-2 bg-slate-600/50 rounded-lg px-3 py-2"
                    title={achievement.description}
                  >
                    <span className="text-lg">{achievement.icon}</span>
                    <span className="text-white text-xs font-medium">{achievement.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UltimatePlayerCard;
