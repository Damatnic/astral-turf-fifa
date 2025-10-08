/**
 * 🌟 ULTIMATE PLAYER PROFILE PAGE
 * 
 * Engaging, gamified, FIFA Ultimate Team inspired player profile
 * with stunning visuals, animations, and interactive elements
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTacticsContext } from '../hooks';
import { useChallengeContext } from '../context/ChallengeContext';
import { UltimatePlayerCard } from '../components/player/UltimatePlayerCard';
import { convertToPlayerProgression } from '../utils/playerCardIntegration';
import {
  TrendingUp, TrendingDown, Award, Target, Zap, Heart, Shield,
  Activity, Star, Trophy, Flame, Crown, Medal, ArrowLeft,
  BarChart3, Calendar, Clock, Users, Sparkles, ChevronRight
} from 'lucide-react';
import type { Player } from '../types';

type TabType = 'overview' | 'stats' | 'achievements' | 'journey' | 'compare';

const UltimatePlayerProfilePage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { tacticsState } = useTacticsContext();
  const { challengeState } = useChallengeContext();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const player = tacticsState.players.find(p => p.id === playerId);
  const profile = challengeState.playerProfiles.get(playerId || '');

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-2xl font-bold text-white mb-2">Player Not Found</h3>
          <p className="text-gray-400 mb-6">This player doesn't exist or has been removed</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const progression = profile ? convertToPlayerProgression(profile, player) : null;

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    const overall = player.overall;
    const potential = player.currentPotential || overall;
    const growthPotential = potential - overall;
    const formScore = progression?.level || overall;

    return {
      overall,
      potential,
      growthPotential,
      formScore,
      trending: growthPotential > 10 ? 'up' : growthPotential > 0 ? 'stable' : 'down',
    };
  }, [player, progression]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 border-b border-gray-700">
        <div className="absolute inset-0 bg-[url('/field_lines.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Player Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              {/* Jersey Number Circle */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="relative"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
                  <span className="text-4xl font-black text-white">{player.jerseyNumber}</span>
                </div>
                {progression && (
                  <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                    LVL {progression.level}
                  </div>
                )}
              </motion.div>

              {/* Name & Info */}
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-4xl lg:text-5xl font-black text-white mb-2"
                >
                  {player.name}
                </motion.h1>
                <div className="flex flex-wrap items-center gap-3 text-gray-300 mb-3">
                  <span className="flex items-center space-x-1">
                    <span className="text-2xl">{player.nationality === 'USA' ? '🇺🇸' : '⚽'}</span>
                    <span>{player.nationality}</span>
                  </span>
                  <span>•</span>
                  <span>{player.age} years old</span>
                  <span>•</span>
                  <span className="font-bold text-blue-400">{player.roleId || 'Player'}</span>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 bg-green-600/20 border border-green-600/50 rounded-full text-green-400 text-sm font-medium flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>{player.availability?.status || 'Available'}</span>
                  </div>
                  {progression && progression.rank && (
                    <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1 ${
                      progression.rank === 'legend' ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white' :
                      progression.rank === 'diamond' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' :
                      progression.rank === 'gold' ? 'bg-gradient-to-r from-yellow-500 to-yellow-700 text-white' :
                      progression.rank === 'silver' ? 'bg-gray-400 text-gray-900' :
                      'bg-orange-700 text-white'
                    }`}>
                      <Crown className="w-3 h-3" />
                      <span className="uppercase">{progression.rank}</span>
                    </div>
                  )}
                  {player.morale && (
                    <div className="px-3 py-1 bg-purple-600/20 border border-purple-600/50 rounded-full text-purple-400 text-sm font-medium flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>Morale: {player.morale}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Overall Rating Badge */}
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, delay: 0.2 }}
              className="relative"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl flex flex-col items-center justify-center shadow-2xl border-4 border-white/30">
                <span className="text-6xl font-black text-white">{player.overall}</span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Overall</span>
              </div>
              {performanceMetrics.trending === 'up' && (
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-3 -right-3 bg-green-500 text-white p-2 rounded-full"
                >
                  <TrendingUp className="w-5 h-5" />
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
          {[
            { key: 'overview' as const, label: 'Overview', icon: <Star className="w-4 h-4" /> },
            { key: 'stats' as const, label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
            { key: 'achievements' as const, label: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
            { key: 'journey' as const, label: 'Journey', icon: <Flame className="w-4 h-4" /> },
            { key: 'compare' as const, label: 'Compare', icon: <Users className="w-4 h-4" /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === key
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Player Card */}
                <div className="lg:col-span-1">
                  {progression && (
                    <UltimatePlayerCard
                      player={player}
                      progression={progression}
                      showProgression={true}
                      size="large"
                      interactive={true}
                      showChallenges={true}
                    />
                  )}
                  {!progression && (
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <p className="text-gray-400 text-center">No progression data available</p>
                    </div>
                  )}
                </div>

                {/* Middle Column - Quick Stats */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Performance Card */}
                  <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-700/50">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span>Performance</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard label="Overall" value={player.overall} color="from-blue-500 to-cyan-500" />
                      <StatCard label="Potential" value={player.currentPotential || player.overall} color="from-purple-500 to-pink-500" />
                      <StatCard label="Form" value={progression?.level || player.overall} color="from-green-500 to-emerald-500" suffix="%" />
                      <StatCard label="Fitness" value={player.fitness || 100} color="from-red-500 to-orange-500" suffix="%" />
                    </div>
                  </div>

                  {/* Position & Role */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                      <Target className="w-5 h-5 text-teal-400" />
                      <span>Position & Role</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Primary Position</span>
                        <span className="text-2xl font-black text-teal-400">{player.roleId || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Preferred Foot</span>
                        <span className="text-white font-bold">{player.preferredFoot || 'Right'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Work Rate</span>
                        <span className="text-white font-bold">High / Medium</span>
                      </div>
                    </div>
                  </div>

                  {/* Career Stats */}
                  {progression?.careerStats && (
                    <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-700/50">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        <span>Career Stats</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-black text-white">{progression.careerStats.matches}</div>
                          <div className="text-xs text-gray-400 uppercase">Matches</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-black text-green-400">{progression.careerStats.goals}</div>
                          <div className="text-xs text-gray-400 uppercase">Goals</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-black text-blue-400">{progression.careerStats.assists}</div>
                          <div className="text-xs text-gray-400 uppercase">Assists</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-black text-yellow-400">{progression.careerStats.winRate.toFixed(0)}%</div>
                          <div className="text-xs text-gray-400 uppercase">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Attributes Radar */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Top Attributes */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      <span>Key Attributes</span>
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(player.attributes)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 6)
                        .map(([attr, value]) => (
                          <motion.div
                            key={attr}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-300 capitalize">
                                {attr.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className={`text-lg font-bold ${
                                value >= 85 ? 'text-green-400' :
                                value >= 70 ? 'text-blue-400' :
                                value >= 60 ? 'text-yellow-400' :
                                'text-gray-400'
                              }`}>
                                {value}
                              </span>
                            </div>
                            <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${value}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className={`h-full rounded-full ${
                                  value >= 85 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                  value >= 70 ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
                                  value >= 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                                  'bg-gradient-to-r from-gray-500 to-gray-600'
                                }`}
                              />
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>

                  {/* Progression */}
                  {progression && (
                    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-700/50">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-pink-400" />
                        <span>Progression</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-300">Level Progress</span>
                            <span className="text-sm font-bold text-white">
                              {progression.currentXP.toLocaleString()} / {progression.xpToNextLevel.toLocaleString()} XP
                            </span>
                          </div>
                          <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(progression.currentXP / progression.xpToNextLevel) * 100}%` }}
                              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                            <div className="text-2xl font-black text-purple-400">{progression.level}</div>
                            <div className="text-xs text-gray-400">Level</div>
                          </div>
                          <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                            <div className="text-2xl font-black text-yellow-400">{progression.totalChallengesCompleted}</div>
                            <div className="text-xs text-gray-400">Challenges</div>
                          </div>
                          <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                            <div className="text-2xl font-black text-orange-400">{progression.streakDays}</div>
                            <div className="text-xs text-gray-400">Day Streak</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>View Achievements</span>
                    </button>
                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>New Challenge</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* All Attributes */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Activity className="w-6 h-6 text-teal-400" />
                    <span>Complete Attributes</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(player.attributes).map(([attr, value]) => (
                      <div key={attr} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-300 capitalize">
                            {attr.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className={`text-lg font-bold ${
                            value >= 85 ? 'text-green-400' :
                            value >= 70 ? 'text-blue-400' :
                            value >= 60 ? 'text-yellow-400' :
                            'text-gray-400'
                          }`}>
                            {value}
                          </span>
                        </div>
                        <div className="relative w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            className={`h-full ${
                              value >= 85 ? 'bg-green-500' :
                              value >= 70 ? 'bg-blue-500' :
                              value >= 60 ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Breakdown */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                    <span>Performance Breakdown</span>
                  </h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Attacking', value: Math.round((player.attributes.pace + player.attributes.shooting + player.attributes.dribbling) / 3), icon: <Zap className="w-5 h-5" />, color: 'text-red-400' },
                      { label: 'Defending', value: Math.round((player.attributes.defending + player.attributes.physical) / 2), icon: <Shield className="w-5 h-5" />, color: 'text-blue-400' },
                      { label: 'Passing', value: player.attributes.passing, icon: <Target className="w-5 h-5" />, color: 'text-green-400' },
                      { label: 'Physical', value: player.attributes.physical, icon: <Activity className="w-5 h-5" />, color: 'text-orange-400' },
                    ].map(({ label, value, icon, color }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={color}>{icon}</span>
                            <span className="font-medium text-white">{label}</span>
                          </div>
                          <span className="text-2xl font-bold text-white">{value}</span>
                        </div>
                        <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === 'achievements' && progression && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {progression.achievements.map((achievement, idx) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-gradient-to-br rounded-xl p-6 border-2 ${
                      achievement.rarity === 'legendary' ? 'from-yellow-900/50 to-orange-900/50 border-yellow-500' :
                      achievement.rarity === 'epic' ? 'from-purple-900/50 to-pink-900/50 border-purple-500' :
                      achievement.rarity === 'rare' ? 'from-blue-900/50 to-cyan-900/50 border-blue-500' :
                      'from-gray-800 to-gray-900 border-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">{achievement.icon}</div>
                      <h4 className="text-lg font-bold text-white mb-1">{achievement.name}</h4>
                      <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        achievement.rarity === 'legendary' ? 'bg-yellow-500 text-black' :
                        achievement.rarity === 'epic' ? 'bg-purple-500 text-white' :
                        achievement.rarity === 'rare' ? 'bg-blue-500 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {achievement.rarity}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {progression.achievements.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No achievements yet</p>
                    <p className="text-gray-500 text-sm">Complete challenges to unlock achievements!</p>
                  </div>
                )}
              </div>
            )}

            {/* JOURNEY TAB */}
            {activeTab === 'journey' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Flame className="w-6 h-6 text-orange-400" />
                    <span>Player Journey</span>
                  </h3>
                  {/* Timeline would go here */}
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Journey timeline coming soon</p>
                    <p className="text-gray-500 text-sm">Track your player's career milestones</p>
                  </div>
                </div>
              </div>
            )}

            {/* COMPARE TAB */}
            {activeTab === 'compare' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Users className="w-6 h-6 text-purple-400" />
                    <span>Compare Players</span>
                  </h3>
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Player comparison coming soon</p>
                    <p className="text-gray-500 text-sm">Compare stats with other players</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{ label: string; value: number; color: string; suffix?: string }> = ({
  label,
  value,
  color,
  suffix = ''
}) => (
  <div className={`bg-gradient-to-br ${color} rounded-lg p-4 text-center`}>
    <div className="text-3xl font-black text-white">{value}{suffix}</div>
    <div className="text-xs font-medium text-white/80 uppercase">{label}</div>
  </div>
);

export default UltimatePlayerProfilePage;

