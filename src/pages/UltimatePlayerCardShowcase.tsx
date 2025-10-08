/**
 * ULTIMATE PLAYER CARD SHOWCASE
 * 
 * Demo page showing the game-like player card system
 * with XP, ranking, challenges, and progression
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UltimatePlayerCard } from '../components/player/UltimatePlayerCard';
import { Zap, Trophy, Target, Star, Award } from 'lucide-react';
import type { Player } from '../types';

const UltimatePlayerCardShowcase: React.FC = () => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Sample players with different ranks
  const players: Player[] = [
    {
      id: '1',
      name: 'Marcus Steel',
      jerseyNumber: 10,
      roleId: 'ST',
      age: 23,
      overall: 88,
      nationality: 'England',
      attributes: {
        pace: 92,
        shooting: 89,
        passing: 78,
        acceleration: 94,
        sprintSpeed: 90,
        finishing: 91,
        shotPower: 87,
        vision: 76,
        ballControl: 85,
      } as any,
    } as any,
    {
      id: '2',
      name: 'Diego Martinez',
      jerseyNumber: 7,
      roleId: 'CAM',
      age: 21,
      overall: 82,
      nationality: 'Spain',
      attributes: {
        pace: 85,
        shooting: 80,
        passing: 88,
        acceleration: 86,
        sprintSpeed: 84,
        finishing: 79,
        shotPower: 82,
        vision: 91,
        ballControl: 90,
      } as any,
    } as any,
    {
      id: '3',
      name: 'James Wilson',
      jerseyNumber: 5,
      roleId: 'CB',
      age: 27,
      overall: 79,
      nationality: 'USA',
      attributes: {
        pace: 72,
        shooting: 45,
        passing: 68,
        acceleration: 70,
        sprintSpeed: 74,
        finishing: 42,
        shotPower: 65,
        vision: 71,
        ballControl: 73,
      } as any,
    } as any,
  ];

  // Progression data for different ranks
  const progressions = [
    {
      currentXP: 8500,
      xpToNextLevel: 10000,
      level: 67,
      rank: 'diamond' as const,
      rankProgress: 85,
      totalChallengesCompleted: 42,
      achievements: [
        { id: '1', name: 'Goal Machine', icon: '⚽', rarity: 'legendary' as const, description: 'Score 100 goals' },
        { id: '2', name: 'Hat Trick Hero', icon: '🎩', rarity: 'epic' as const, description: 'Score 3 goals in one match' },
        { id: '3', name: 'Perfect Week', icon: '📅', rarity: 'epic' as const, description: 'Win all matches' },
        { id: '4', name: 'Speed Demon', icon: '⚡', rarity: 'rare' as const, description: 'Reach 90+ pace' },
        { id: '5', name: 'Team Player', icon: '🤝', rarity: 'rare' as const, description: '50 assists' },
      ],
      streakDays: 14,
      isShiny: true,
    },
    {
      currentXP: 1200,
      xpToNextLevel: 1500,
      level: 18,
      rank: 'silver' as const,
      rankProgress: 35,
      totalChallengesCompleted: 15,
      achievements: [
        { id: '1', name: 'First Goal', icon: '⚽', rarity: 'common' as const, description: 'Score first goal' },
        { id: '2', name: 'Playmaker', icon: '🎯', rarity: 'rare' as const, description: '10 assists' },
        { id: '3', name: 'Rising Star', icon: '⭐', rarity: 'rare' as const, description: 'Reach level 15' },
      ],
      streakDays: 5,
      isShiny: false,
    },
    {
      currentXP: 350,
      xpToNextLevel: 500,
      level: 6,
      rank: 'bronze' as const,
      rankProgress: 15,
      totalChallengesCompleted: 3,
      achievements: [
        { id: '1', name: 'Welcome', icon: '👋', rarity: 'common' as const, description: 'Complete tutorial' },
      ],
      streakDays: 2,
      isShiny: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-8 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            className="text-5xl font-black text-white mb-3 drop-shadow-lg"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            🎮 Ultimate Player Cards
          </motion.h1>
          <p className="text-pink-100 text-xl font-medium">
            Rank up your players! Complete challenges! Collect achievements!
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="bg-gradient-to-r from-cyan-900 to-blue-900 border-2 border-cyan-400 rounded-2xl p-6 shadow-xl">
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-cyan-400">5</div>
              <div className="text-cyan-200 text-sm">Rank Tiers</div>
              <div className="text-xs text-cyan-300 mt-1">Bronze → Legend</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">99</div>
              <div className="text-yellow-200 text-sm">Max Level</div>
              <div className="text-xs text-yellow-300 mt-1">Unlock all rewards</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">50+</div>
              <div className="text-purple-200 text-sm">Challenges</div>
              <div className="text-xs text-purple-300 mt-1">Earn XP & rewards</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-400">100+</div>
              <div className="text-pink-200 text-sm">Achievements</div>
              <div className="text-xs text-pink-300 mt-1">Collect them all!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Cards Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
          <Star className="w-8 h-8 mr-3 text-yellow-400 fill-current" />
          Your Squad
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <UltimatePlayerCard
                player={player}
                progression={progressions[index]}
                showProgression={true}
                interactive={true}
                showChallenges={true}
                onClick={() => setSelectedPlayerId(player.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <h2 className="text-3xl font-bold text-white mb-6">✨ Card Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-yellow-900 to-orange-900 border border-yellow-600 rounded-xl p-6">
            <Zap className="w-10 h-10 text-yellow-400 mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">XP & Leveling</h3>
            <p className="text-yellow-200 text-sm">
              Earn XP from matches and challenges. Level up from 1 to 99!
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-pink-900 border border-purple-600 rounded-xl p-6">
            <Trophy className="w-10 h-10 text-purple-400 mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">5 Rank Tiers</h3>
            <p className="text-purple-200 text-sm">
              Progress through Bronze, Silver, Gold, Diamond, and Legend ranks!
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-900 to-blue-900 border border-cyan-600 rounded-xl p-6">
            <Target className="w-10 h-10 text-cyan-400 mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Challenges</h3>
            <p className="text-cyan-200 text-sm">
              Complete 50+ challenges to unlock achievements and rewards!
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-900 to-red-900 border border-pink-600 rounded-xl p-6">
            <Award className="w-10 h-10 text-pink-400 mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Achievements</h3>
            <p className="text-pink-200 text-sm">
              Earn 100+ achievements with different rarities (Common → Mythic)!
            </p>
          </div>
        </div>
      </div>

      {/* Rank Tiers Explanation */}
      <div className="max-w-7xl mx-auto px-8 py-8 pb-16">
        <h2 className="text-3xl font-bold text-white mb-6">🏆 Rank Progression</h2>
        <div className="space-y-4">
          {Object.entries({
            bronze: { levels: '1-10', color: 'from-orange-700 to-orange-900', emoji: '🥉' },
            silver: { levels: '11-25', color: 'from-gray-400 to-gray-600', emoji: '🥈' },
            gold: { levels: '26-50', color: 'from-yellow-400 to-yellow-600', emoji: '🥇' },
            diamond: { levels: '51-75', color: 'from-cyan-300 to-blue-500', emoji: '💎' },
            legend: { levels: '76-99', color: 'from-purple-400 via-pink-500 to-red-500', emoji: '👑' },
          }).map(([rank, config]) => (
            <div key={rank} className={`bg-gradient-to-r ${config.color} rounded-xl p-6 shadow-xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-5xl">{config.emoji}</div>
                  <div>
                    <h3 className="text-2xl font-black text-white capitalize">{rank}</h3>
                    <p className="text-white/80 text-sm">Levels {config.levels}</p>
                  </div>
                </div>
                <div className="text-white/90 text-sm">
                  Unlock exclusive rewards and card effects!
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UltimatePlayerCardShowcase;

