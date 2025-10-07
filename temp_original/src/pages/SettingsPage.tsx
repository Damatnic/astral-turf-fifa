import React from 'react';
import { useUIContext } from '../hooks';
import type { AIPersonality } from '../types';

const SettingsPage: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const { settings, theme } = uiState;

  const handlePersonalityChange = (personality: AIPersonality) => {
    dispatch({ type: 'SET_AI_PERSONALITY', payload: personality });
  };

  const handleThemeToggle = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  const handleGridToggle = () => {
    dispatch({ type: 'TOGGLE_GRID_VISIBILITY' });
  };

  const handleFormationStrengthToggle = () => {
    dispatch({ type: 'TOGGLE_FORMATION_STRENGTH_VISIBILITY' });
  };

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Settings</h1>
          <p className="text-gray-400">Customize your Astral Turf experience</p>
        </div>

        <div className="space-y-8">
          {/* AI Settings */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-teal-400 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI Assistant
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-200">AI Personality</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Choose the tone and focus of advice you receive from Astral AI. Each personality
                  provides different perspectives and recommendations.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['balanced', 'cautious', 'attacking', 'data'] as AIPersonality[]).map(
                    personality => (
                      <button
                        key={personality}
                        onClick={() => handlePersonalityChange(personality)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          settings.aiPersonality === personality
                            ? 'border-teal-500 bg-teal-500/20 text-teal-400'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">
                            {personality === 'balanced' && '⚖️'}
                            {personality === 'cautious' && '🛡️'}
                            {personality === 'attacking' && '⚔️'}
                            {personality === 'data' && '📊'}
                          </div>
                          <div className="font-medium capitalize">{personality}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {personality === 'balanced' && 'Well-rounded advice'}
                            {personality === 'cautious' && 'Risk-averse approach'}
                            {personality === 'attacking' && 'Aggressive tactics'}
                            {personality === 'data' && 'Stats-driven insights'}
                          </div>
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Settings */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-teal-400 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Visual Settings
            </h2>

            <div className="space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-200">Theme</h3>
                  <p className="text-sm text-gray-400">Switch between light and dark themes</p>
                </div>
                <button
                  onClick={handleThemeToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-teal-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Grid Visibility */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-200">Field Grid</h3>
                  <p className="text-sm text-gray-400">
                    Show/hide grid lines on the tactical field
                  </p>
                </div>
                <button
                  onClick={handleGridToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    uiState.isGridVisible ? 'bg-teal-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      uiState.isGridVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Formation Strength */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-200">
                    Formation Strength Indicators
                  </h3>
                  <p className="text-sm text-gray-400">Display formation strength visualization</p>
                </div>
                <button
                  onClick={handleFormationStrengthToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    uiState.isFormationStrengthVisible ? 'bg-teal-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      uiState.isFormationStrengthVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Game Settings */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-teal-400 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Game Settings
            </h2>

            <div className="space-y-6">
              {/* Positioning Mode */}
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Player Positioning</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Choose how players snap to positions on the field
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => dispatch({ type: 'SET_POSITIONING_MODE', payload: 'snap' })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      uiState.positioningMode === 'snap'
                        ? 'border-teal-500 bg-teal-500/20 text-teal-400'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium">Snap to Grid</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Players align to grid positions
                    </div>
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'SET_POSITIONING_MODE', payload: 'free' })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      uiState.positioningMode === 'free'
                        ? 'border-teal-500 bg-teal-500/20 text-teal-400'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium">Free Positioning</div>
                    <div className="text-xs text-gray-400 mt-1">Players can be placed anywhere</div>
                  </button>
                </div>
              </div>

              {/* Tutorial */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-200">Interactive Tutorial</h3>
                  <p className="text-sm text-gray-400">Restart the interactive tutorial</p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'START_TUTORIAL' })}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Start Tutorial
                </button>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-teal-400 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              About Astral Turf
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Version</span>
                <span className="text-white font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Last Updated</span>
                <span className="text-white font-medium">March 2024</span>
              </div>
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Astral Turf is a comprehensive soccer management application designed to help
                  coaches and analysts create, visualize, and analyze tactical formations and plays.
                  Built with modern web technologies and powered by AI insights.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              Advanced Actions
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-200">Reset Application</h3>
                  <p className="text-sm text-gray-400">
                    Reset all data and return to initial state
                  </p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'RESET_STATE' })}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Reset App
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-200">Soft Reset</h3>
                  <p className="text-sm text-gray-400">Reset UI state while keeping game data</p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'SOFT_RESET_APP' })}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Soft Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
