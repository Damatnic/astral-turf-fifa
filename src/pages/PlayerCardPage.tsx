import React from 'react';
import { motion } from 'framer-motion';
import { useAuthContext } from '../hooks/useAuthContext';

/**
 * Player Card Page
 * Displays the user's player profile card with stats, achievements, and personal info
 */
export default function PlayerCardPage() {
  const { authState } = useAuthContext();
  const user = authState.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-950 via-secondary-900 to-secondary-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Player Card</h1>
            <p className="text-secondary-400">Your complete player profile</p>
          </div>
        </div>

        {/* Player Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-600/20 via-secondary-800/50 to-accent-600/20 rounded-2xl border-2 border-primary-500/30 p-8 backdrop-blur-xl shadow-2xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Player Avatar & Basic Info */}
            <div className="lg:col-span-1 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 p-1">
                  <div className="w-full h-full rounded-full bg-secondary-900 flex items-center justify-center">
                    <span className="text-6xl">⚽</span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-accent-500 border-4 border-secondary-900 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">85</span>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  {user?.email?.split('@')[0] || 'Player'}
                </h2>
                <p className="text-primary-400 font-semibold">Manager & Player</p>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="bg-secondary-800/50 rounded-lg px-4 py-2">
                  <div className="text-secondary-400 mb-1">Level</div>
                  <div className="text-xl font-bold text-primary-400">42</div>
                </div>
                <div className="bg-secondary-800/50 rounded-lg px-4 py-2">
                  <div className="text-secondary-400 mb-1">Rank</div>
                  <div className="text-xl font-bold text-accent-400">#156</div>
                </div>
              </div>
            </div>

            {/* Player Stats */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>📊</span> Player Attributes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Pace', value: 87, color: 'primary' },
                    { label: 'Shooting', value: 82, color: 'accent' },
                    { label: 'Passing', value: 85, color: 'primary' },
                    { label: 'Dribbling', value: 88, color: 'accent' },
                    { label: 'Defending', value: 75, color: 'primary' },
                    { label: 'Physical', value: 80, color: 'accent' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-secondary-800/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-secondary-300 text-sm">{stat.label}</span>
                        <span className="text-white font-bold">{stat.value}</span>
                      </div>
                      <div className="w-full bg-secondary-700/50 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.value}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className={`h-full rounded-full bg-gradient-to-r ${
                            stat.color === 'primary'
                              ? 'from-primary-500 to-primary-400'
                              : 'from-accent-500 to-accent-400'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>🎯</span> Career Stats
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Matches', value: '234', icon: '⚽' },
                    { label: 'Goals', value: '87', icon: '🥅' },
                    { label: 'Assists', value: '56', icon: '🎯' },
                    { label: 'Win Rate', value: '68%', icon: '🏆' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-secondary-800/30 rounded-lg p-4 text-center"
                    >
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-xs text-secondary-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Achievements Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Achievements */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-secondary-800/50 backdrop-blur-xl rounded-xl border border-secondary-700/50 p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🏆</span> Recent Achievements
            </h3>
            <div className="space-y-3">
              {[
                { id: 'hat-trick', title: 'Hat-trick Hero', desc: 'Score 3 goals in a match', rarity: 'Gold' },
                { id: 'perfect-week', title: 'Perfect Week', desc: 'Win 7 consecutive matches', rarity: 'Platinum' },
                { id: 'tactical', title: 'Tactical Genius', desc: 'Complete 50 formations', rarity: 'Silver' },
                { id: 'assists', title: 'Team Player', desc: '100 assists milestone', rarity: 'Gold' },
              ].map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-4 bg-secondary-900/50 rounded-lg p-3 hover:bg-secondary-700/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🏅</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{achievement.title}</div>
                    <div className="text-xs text-secondary-400">{achievement.desc}</div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      achievement.rarity === 'Platinum'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : achievement.rarity === 'Gold'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {achievement.rarity}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Player Journey */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-secondary-800/50 backdrop-blur-xl rounded-xl border border-secondary-700/50 p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📈</span> Player Journey
            </h3>
            <div className="space-y-4">
              {[
                { id: '2024-25', season: '2024/25', team: 'Astral FC', position: 'Manager', achievements: '🏆 League Champions' },
                { id: '2023-24', season: '2023/24', team: 'Astral FC', position: 'Manager', achievements: '🥈 Runners-up' },
                { id: '2022-23', season: '2022/23', team: 'Rising Stars', position: 'Player-Manager', achievements: '⭐ Promoted' },
              ].map((entry, i) => (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">{entry.season.split('/')[0].slice(2)}</span>
                    </div>
                    {i < 2 && <div className="w-0.5 h-full bg-primary-500/30 mt-2" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="font-semibold text-white">{entry.team}</div>
                    <div className="text-sm text-secondary-400 mb-1">{entry.position} • {entry.season}</div>
                    <div className="text-sm text-accent-400">{entry.achievements}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Player Specialties */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-secondary-800/50 backdrop-blur-xl rounded-xl border border-secondary-700/50 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>⭐</span> Specialties & Play Style
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              'Tiki-Taka Master',
              'Counter-Attack Expert',
              'Set Piece Specialist',
              'High Press Tactician',
              'Possession Play',
              'Wing Play',
              'Clinical Finisher',
              'Creative Playmaker',
            ].map((specialty) => (
              <div
                key={specialty}
                className="px-4 py-2 bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 rounded-full text-sm font-medium text-white hover:from-primary-500/30 hover:to-accent-500/30 transition-colors"
              >
                {specialty}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
