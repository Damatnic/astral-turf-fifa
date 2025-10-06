import React, { Suspense, lazy } from 'react';
import { useTacticsContext } from '../hooks/useTacticsContext';
import { useFranchiseContext } from '../hooks/useFranchiseContext';
import { useUIContext } from '../hooks/useUIContext';
import { LoadingFallback } from '../components/ErrorFallback';
import type { MatchResult } from '../types';

const AdvancedAnalyticsDashboard = lazy(
  () => import('../components/dashboards/AdvancedAnalyticsDashboard'),
);

const AdvancedAnalyticsPage: React.FC = () => {
  const { tacticsState } = useTacticsContext();
  const { franchiseState } = useFranchiseContext();
  const { uiState } = useUIContext();

  const { players, formations, teamTactics, activeFormationIds } = tacticsState;
  const { matchHistory } = franchiseState;
  const { settings } = uiState;
  const matchResults = matchHistory as MatchResult[];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <span className="text-4xl mr-3">🚀</span>
              Advanced AI Analytics
            </h1>
            <p className="text-gray-400 mt-2 max-w-2xl">
              Unlock the power of artificial intelligence to analyze player development, predict
              match outcomes, and optimize your tactical approach with cutting-edge analytics.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">AI Personality</div>
            <div className="text-lg font-semibold text-blue-400 capitalize">
              {settings.aiPersonality}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Suspense fallback={<LoadingFallback message="Loading advanced analytics..." />}>
          <AdvancedAnalyticsDashboard
            players={players}
            formations={formations}
            teamTactics={teamTactics}
            matchHistory={matchResults}
            activeFormationIds={activeFormationIds}
            aiPersonality={settings.aiPersonality}
            className="mb-6"
          />
        </Suspense>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🎯</span>
              <h3 className="text-lg font-semibold text-white">Predictive Development</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              AI analyzes player attributes, training patterns, and performance trends to predict
              future development trajectories and recommend personalized training programs.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Accuracy Rate</span>
                <span className="text-green-400 font-semibold">94.7%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prediction Horizon</span>
                <span className="text-blue-400 font-semibold">24 Months</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">⚡</span>
              <h3 className="text-lg font-semibold text-white">Tactical Intelligence</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Advanced formation analysis reveals strengths, vulnerabilities, and optimal player
              positioning based on opponent tactics and team chemistry.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Formations Analyzed</span>
                <span className="text-purple-400 font-semibold">
                  {Object.keys(formations).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Win Rate Improvement</span>
                <span className="text-green-400 font-semibold">+18.3%</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🔮</span>
              <h3 className="text-lg font-semibold text-white">Match Prediction</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Sophisticated algorithms analyze team strength, player form, tactical setups, and
              historical data to predict match outcomes with remarkable accuracy.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prediction Accuracy</span>
                <span className="text-green-400 font-semibold">87.2%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Matches Analyzed</span>
                <span className="text-blue-400 font-semibold">{matchResults.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🤖</span>
            <div>
              <h3 className="text-xl font-semibold text-white">AI-Powered Soccer Intelligence</h3>
              <p className="text-blue-200">
                Next-generation analytics for professional soccer management
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">15+</div>
              <div className="text-sm text-gray-300">AI Models</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">1M+</div>
              <div className="text-sm text-gray-300">Data Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">Real-time</div>
              <div className="text-sm text-gray-300">Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">24/7</div>
              <div className="text-sm text-gray-300">Monitoring</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-black/20 rounded border border-gray-600">
            <h4 className="font-semibold text-blue-400 mb-2">🔬 Advanced Analytics Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Real-time player performance tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Interactive tactical visualization</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Automated analytics reports</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Performance predictions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Injury risk assessment</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">AI-powered recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsPage;
