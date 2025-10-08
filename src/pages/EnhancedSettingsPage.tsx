/**
 * ENHANCED SETTINGS PAGE
 * 
 * Complete settings management with:
 * - Account settings
 * - Appearance & theme
 * - Notifications
 * - Privacy & security
 * - Game preferences
 * - AI assistant configuration
 * - Keyboard shortcuts
 * - Data management
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Palette,
  Bell,
  Shield,
  Gamepad2,
  Brain,
  Keyboard,
  Database,
  Save,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
} from 'lucide-react';
import { useUIContext } from '../hooks';
import { useAuthContext } from '../hooks/useAuthContext';
import type { AIPersonality } from '../types';

const EnhancedSettingsPage: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const { authState } = useAuthContext();
  const { settings, theme } = uiState;
  
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'notifications' | 'privacy' | 'game' | 'ai' | 'shortcuts' | 'data'>('account');
  const [showPassword, setShowPassword] = useState(false);

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'game' as const, label: 'Game', icon: Gamepad2 },
    { id: 'ai' as const, label: 'AI Assistant', icon: Brain },
    { id: 'shortcuts' as const, label: 'Shortcuts', icon: Keyboard },
    { id: 'data' as const, label: 'Data', icon: Database },
  ];

  return (
    <div className="h-full bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-800">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 flex-shrink-0 border-r border-gray-800 p-4 space-y-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>

                {/* Profile Info */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={authState.user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg border border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                      <input
                        type="text"
                        defaultValue="Coach Manager"
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                      <input
                        type="text"
                        defaultValue="My Team"
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button className="mt-4 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors">
                    Save Changes
                  </button>
                </div>

                {/* Password Change */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none pr-10"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Update Password
                  </button>
                </div>
              </motion.div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Appearance Settings</h2>

                {/* Theme */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Theme</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-4xl mb-2">🌙</div>
                      <div className="font-bold text-white">Dark Mode</div>
                      <div className="text-sm text-gray-400 mt-1">Comfortable for eyes</div>
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        theme === 'light'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-4xl mb-2">☀️</div>
                      <div className="font-bold text-white">Light Mode</div>
                      <div className="text-sm text-gray-400 mt-1">Bright and clear</div>
                    </button>
                  </div>
                </div>

                {/* Field Display Options */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Field Display</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-medium text-white">Show Grid Lines</div>
                        <div className="text-sm text-gray-400">Display positioning grid on field</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={uiState.isGridVisible}
                        onChange={() => dispatch({ type: 'TOGGLE_GRID_VISIBILITY' })}
                        className="w-12 h-6 rounded-full appearance-none bg-gray-600 checked:bg-cyan-600 relative transition-colors cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-1 before:left-1 before:transition-transform checked:before:translate-x-6"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-medium text-white">Formation Strength</div>
                        <div className="text-sm text-gray-400">Show formation strength indicators</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={uiState.isFormationStrengthVisible}
                        onChange={() => dispatch({ type: 'TOGGLE_FORMATION_STRENGTH_VISIBILITY' })}
                        className="w-12 h-6 rounded-full appearance-none bg-gray-600 checked:bg-cyan-600 relative transition-colors cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-1 before:left-1 before:transition-transform checked:before:translate-x-6"
                      />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI Assistant Tab */}
            {activeTab === 'ai' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6">AI Assistant Settings</h2>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">AI Personality</h3>
                  <p className="text-gray-400 mb-6">
                    Choose the tone and focus of advice you receive from Astral AI
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {(['balanced', 'cautious', 'attacking', 'data'] as AIPersonality[]).map((personality) => (
                      <button
                        key={personality}
                        onClick={() => dispatch({ type: 'SET_AI_PERSONALITY', payload: personality })}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          settings.aiPersonality === personality
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-4xl mb-3">
                          {personality === 'balanced' && '⚖️'}
                          {personality === 'cautious' && '🛡️'}
                          {personality === 'attacking' && '⚔️'}
                          {personality === 'data' && '📊'}
                        </div>
                        <div className="font-bold text-white capitalize">{personality}</div>
                        <div className="text-sm text-gray-400 mt-2">
                          {personality === 'balanced' && 'Well-rounded advice'}
                          {personality === 'cautious' && 'Risk-averse approach'}
                          {personality === 'attacking' && 'Aggressive tactics'}
                          {personality === 'data' && 'Stats-driven insights'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Game Tab */}
            {activeTab === 'game' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Game Preferences</h2>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Player Positioning</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => dispatch({ type: 'SET_POSITIONING_MODE', payload: 'snap' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        uiState.positioningMode === 'snap'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-white">Snap to Grid</div>
                      <div className="text-sm text-gray-400 mt-1">Players align to grid</div>
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'SET_POSITIONING_MODE', payload: 'free' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        uiState.positioningMode === 'free'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-white">Free Positioning</div>
                      <div className="text-sm text-gray-400 mt-1">Place anywhere</div>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Tutorial</h3>
                  <button
                    onClick={() => dispatch({ type: 'START_TUTORIAL' })}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Restart Interactive Tutorial
                  </button>
                </div>
              </motion.div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Data Management</h2>

                {/* Export/Import */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Backup & Restore</h3>
                  <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <Download className="w-5 h-5 text-cyan-400" />
                        <div className="text-left">
                          <div className="font-medium text-white">Export All Data</div>
                          <div className="text-sm text-gray-400">Download a backup of all your data</div>
                        </div>
                      </div>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <Upload className="w-5 h-5 text-blue-400" />
                        <div className="text-left">
                          <div className="font-medium text-white">Import Data</div>
                          <div className="text-sm text-gray-400">Restore from a backup file</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Reset Options */}
                <div className="bg-gray-800 rounded-xl p-6 border border-red-900/50">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">Reset Options</h3>
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        if (confirm('Reset UI settings only? This will keep your game data.')) {
                          dispatch({ type: 'SOFT_RESET_APP' });
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 bg-yellow-900/20 hover:bg-yellow-900/30 border border-yellow-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Save className="w-5 h-5 text-yellow-400" />
                        <div className="text-left">
                          <div className="font-medium text-white">Soft Reset</div>
                          <div className="text-sm text-gray-400">Reset UI, keep game data</div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Reset ALL data? This cannot be undone!')) {
                          dispatch({ type: 'RESET_STATE' });
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 bg-red-900/20 hover:bg-red-900/30 border border-red-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Trash2 className="w-5 h-5 text-red-400" />
                        <div className="text-left">
                          <div className="font-medium text-white">Full Reset</div>
                          <div className="text-sm text-gray-400">Delete all data permanently</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Shortcuts Tab */}
            {activeTab === 'shortcuts' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-3xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Keyboard Shortcuts</h2>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="grid gap-3">
                    {[
                      { keys: ['Ctrl', 'Z'], action: 'Undo last action' },
                      { keys: ['Ctrl', 'Y'], action: 'Redo last action' },
                      { keys: ['Ctrl', 'S'], action: 'Save current formation' },
                      { keys: ['Ctrl', 'R'], action: 'Soft reset application' },
                      { keys: ['?'], action: 'Show keyboard shortcuts' },
                      { keys: ['Esc'], action: 'Close active popup/modal' },
                      { keys: ['Tab'], action: 'Navigate between elements' },
                      { keys: ['Enter'], action: 'Confirm/Select' },
                    ].map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <span className="text-gray-300">{shortcut.action}</span>
                        <div className="flex space-x-2">
                          {shortcut.keys.map((key, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="text-gray-500">+</span>}
                              <kbd className="px-3 py-1 bg-gray-900 text-white rounded border border-gray-600 font-mono text-sm">
                                {key}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSettingsPage;
