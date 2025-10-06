import React, { useState } from 'react';
import type { Player, AIPersonality, Formation, TeamTactics, MatchResult } from '../../types';
import {
  PlayerDevelopmentPrediction,
  FormationEffectivenessAnalysis,
  MatchPrediction,
  TacticalHeatMap,
  PlayerPerformanceMetrics,
  advancedAiService,
} from '../../services/advancedAiService';
import TacticalHeatMapCanvas from '../analytics/TacticalHeatMapCanvas';
import AdvancedMetricsRadar from '../analytics/AdvancedMetricsRadar';

interface AdvancedAnalyticsDashboardProps {
  players: Player[];
  formations: Record<string, Formation>;
  teamTactics: { home: TeamTactics; away: TeamTactics };
  matchHistory: MatchResult[];
  activeFormationIds: { home: string; away: string };
  aiPersonality: AIPersonality;
  className?: string;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  players,
  formations,
  teamTactics,
  matchHistory,
  activeFormationIds,
  aiPersonality,
  className = '',
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [developmentPrediction, setDevelopmentPrediction] =
    useState<PlayerDevelopmentPrediction | null>(null);
  const [formationAnalysis, setFormationAnalysis] = useState<FormationEffectivenessAnalysis | null>(
    null
  );
  const [matchPrediction, setMatchPrediction] = useState<MatchPrediction | null>(null);
  const [tacticalHeatMap, setTacticalHeatMap] = useState<TacticalHeatMap | null>(null);
  const [playerMetrics, setPlayerMetrics] = useState<PlayerPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'development' | 'formation' | 'match' | 'heatmap' | 'metrics'
  >('development');

  const homePlayers = players.filter(p => p.team === 'home');
  const awayPlayers = players.filter(p => p.team === 'away');

  const generateDevelopmentPrediction = async (player: Player) => {
    if (!advancedAiService.isAIAvailable()) {
      return;
    }

    setLoading(true);
    try {
      const prediction = await advancedAiService.generatePlayerDevelopmentPrediction(
        player,
        {} as any, // Would need to pass actual training schedule
        aiPersonality
      );
      setDevelopmentPrediction(prediction);
    } catch (_error) {
      console.error('Failed to generate development prediction:', _error);
    } finally {
      setLoading(false);
    }
  };

  const generateFormationAnalysis = async () => {
    if (!advancedAiService.isAIAvailable()) {
      return;
    }

    setLoading(true);
    try {
      const homeFormation = formations[activeFormationIds.home];
      const analysis = await advancedAiService.generateFormationEffectivenessAnalysis(
        homeFormation,
        homePlayers,
        ['4-3-3', '3-5-2', '4-4-2'],
        aiPersonality
      );
      setFormationAnalysis(analysis);
    } catch (_error) {
      console.error('Failed to generate formation analysis:', _error);
    } finally {
      setLoading(false);
    }
  };

  const generateMatchPrediction = async () => {
    if (!advancedAiService.isAIAvailable()) {
      return;
    }

    setLoading(true);
    try {
      const prediction = await advancedAiService.generateMatchPrediction(
        {
          players: homePlayers,
          formation: formations[activeFormationIds.home],
          tactics: teamTactics.home,
        },
        {
          players: awayPlayers,
          formation: formations[activeFormationIds.away],
          tactics: teamTactics.away,
        },
        {
          venue: 'home',
          importance: 'medium',
        },
        aiPersonality
      );
      setMatchPrediction(prediction);
    } catch (_error) {
      console.error('Failed to generate match prediction:', _error);
    } finally {
      setLoading(false);
    }
  };

  const generateHeatMap = async (player: Player) => {
    if (!advancedAiService.isAIAvailable()) {
      return;
    }

    setLoading(true);
    try {
      const heatMap = await advancedAiService.generateTacticalHeatMap(
        player,
        matchHistory,
        formations[activeFormationIds.home],
        aiPersonality
      );
      setTacticalHeatMap(heatMap);
    } catch (_error) {
      console.error('Failed to generate heat map:', _error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlayerMetrics = async (player: Player) => {
    if (!advancedAiService.isAIAvailable()) {
      return;
    }

    setLoading(true);
    try {
      const metrics = await advancedAiService.generateAdvancedPlayerMetrics(
        player,
        matchHistory,
        aiPersonality
      );
      setPlayerMetrics(metrics);
    } catch (_error) {
      console.error('Failed to generate player metrics:', _error);
    } finally {
      setLoading(false);
    }
  };

  const renderDevelopmentTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-blue-400">Player Development Prediction</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Player:</label>
          <select
            value={selectedPlayer?.id || ''}
            onChange={e => {
              const player = players.find(p => p.id === e.target.value);
              setSelectedPlayer(player || null);
              if (player) {
                generateDevelopmentPrediction(player);
              }
            }}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="">Choose a player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.age} years, {player.currentPotential} rating)
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-400">Analyzing player development...</p>
          </div>
        )}

        {developmentPrediction && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-green-400">
                  {developmentPrediction.projectedRatingIn1Year}
                </div>
                <div className="text-sm text-gray-300">Projected Rating (1 Year)</div>
              </div>

              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-blue-400">
                  {developmentPrediction.peakPotentialAge}
                </div>
                <div className="text-sm text-gray-300">Peak Age</div>
              </div>

              <div className="bg-gray-700 p-3 rounded">
                <div
                  className={`text-2xl font-bold ${
                    developmentPrediction.developmentTrajectory === 'rapid'
                      ? 'text-green-400'
                      : developmentPrediction.developmentTrajectory === 'steady'
                        ? 'text-yellow-400'
                        : developmentPrediction.developmentTrajectory === 'slow'
                          ? 'text-orange-400'
                          : 'text-red-400'
                  }`}
                >
                  {developmentPrediction.developmentTrajectory.toUpperCase()}
                </div>
                <div className="text-sm text-gray-300">Development Path</div>
              </div>

              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-purple-400">
                  {developmentPrediction.optimalPlayingTime}min
                </div>
                <div className="text-sm text-gray-300">Optimal Playing Time/Week</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="font-semibold mb-2 text-green-400">Key Strengths</h4>
                <ul className="space-y-1">
                  {developmentPrediction.keyStrengths.map((strength, i) => (
                    <li key={i} className="text-sm text-gray-300">
                      • {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded">
                <h4 className="font-semibold mb-2 text-red-400">Development Bottlenecks</h4>
                <ul className="space-y-1">
                  {developmentPrediction.developmentBottlenecks.map((bottleneck, i) => (
                    <li key={i} className="text-sm text-gray-300">
                      • {bottleneck}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold mb-2 text-blue-400">Personalized Training Plan</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h5 className="font-medium text-green-400">Phase 1 (0-3 months)</h5>
                  <p className="text-sm text-gray-300">
                    {developmentPrediction.personalizedTrainingPlan.phase1}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-yellow-400">Phase 2 (3-6 months)</h5>
                  <p className="text-sm text-gray-300">
                    {developmentPrediction.personalizedTrainingPlan.phase2}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-purple-400">Phase 3 (6-12 months)</h5>
                  <p className="text-sm text-gray-300">
                    {developmentPrediction.personalizedTrainingPlan.phase3}
                  </p>
                </div>
              </div>
            </div>

            {developmentPrediction.riskFactors.length > 0 && (
              <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                <h4 className="font-semibold mb-2 text-red-400">Risk Factors</h4>
                <ul className="space-y-1">
                  {developmentPrediction.riskFactors.map((risk, i) => (
                    <li key={i} className="text-sm text-gray-300">
                      ⚠️ {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderFormationTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-400">Formation Effectiveness Analysis</h3>
          <button
            onClick={generateFormationAnalysis}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Analyze Formation
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-400">Analyzing formation effectiveness...</p>
          </div>
        )}

        {formationAnalysis && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {formationAnalysis.effectivenessScore}/100
              </div>
              <div className="text-gray-300">Overall Effectiveness Score</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="font-semibold mb-2 text-green-400">Attacking Strengths</h4>
                <ul className="space-y-1">
                  {formationAnalysis.tacticalInsights.attackingStrengths.map((strength, i) => (
                    <li key={i} className="text-sm text-gray-300">
                      • {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded">
                <h4 className="font-semibold mb-2 text-red-400">Defensive Vulnerabilities</h4>
                <ul className="space-y-1">
                  {formationAnalysis.tacticalInsights.defensiveVulnerabilities.map(
                    (vulnerability, i) => (
                      <li key={i} className="text-sm text-gray-300">
                        • {vulnerability}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold mb-2 text-purple-400">Set Piece Advantages</h4>
              <ul className="space-y-1">
                {formationAnalysis.tacticalInsights.setPieceAdvantages.map((advantage, i) => (
                  <li key={i} className="text-sm text-gray-300">
                    • {advantage}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMatchPredictionTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-400">AI Match Prediction</h3>
          <button
            onClick={generateMatchPrediction}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Predict Match
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-400">Analyzing match probability...</p>
          </div>
        )}

        {matchPrediction && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-700 p-4 rounded">
                <div className="text-2xl font-bold">
                  {matchPrediction.homeWinProbability.toFixed(1)}%
                </div>
                <div className="text-sm">Home Win</div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold">
                  {matchPrediction.drawProbability.toFixed(1)}%
                </div>
                <div className="text-sm">Draw</div>
              </div>
              <div className="bg-red-700 p-4 rounded">
                <div className="text-2xl font-bold">
                  {matchPrediction.awayWinProbability.toFixed(1)}%
                </div>
                <div className="text-sm">Away Win</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-blue-400">
                  {matchPrediction.expectedGoals.home.toFixed(1)}
                </div>
                <div className="text-sm">Expected Goals (Home)</div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-red-400">
                  {matchPrediction.expectedGoals.away.toFixed(1)}
                </div>
                <div className="text-sm">Expected Goals (Away)</div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold mb-2 text-yellow-400">Key Matchups</h4>
              <div className="space-y-2">
                {matchPrediction.keyMatchups.map((matchup, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>
                      {matchup.homePlayer} vs {matchup.awayPlayer}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        matchup.advantage === 'home'
                          ? 'bg-blue-600'
                          : matchup.advantage === 'away'
                            ? 'bg-red-600'
                            : 'bg-gray-600'
                      }`}
                    >
                      {matchup.advantage} ({matchup.impactLevel})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold mb-2 text-green-400">Tactical Recommendations</h4>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Formation:</strong> {matchPrediction.tacticalRecommendations.formation}
              </p>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Mentality:</strong> {matchPrediction.tacticalRecommendations.mentality}
              </p>
              <div>
                <strong className="text-sm">Key Instructions:</strong>
                <ul className="mt-1 space-y-1">
                  {matchPrediction.tacticalRecommendations.keyInstructions.map((instruction, i) => (
                    <li key={i} className="text-sm text-gray-300">
                      • {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderHeatMapTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-red-400">Tactical Heat Map Analysis</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Player:</label>
          <select
            value={selectedPlayer?.id || ''}
            onChange={e => {
              const player = players.find(p => p.id === e.target.value);
              setSelectedPlayer(player || null);
              if (player) {
                generateHeatMap(player);
              }
            }}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="">Choose a player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.roleId})
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-400">Generating tactical heat map...</p>
          </div>
        )}

        {tacticalHeatMap && (
          <TacticalHeatMapCanvas heatMapData={tacticalHeatMap} width={400} height={600} />
        )}
      </div>
    </div>
  );

  const renderMetricsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-yellow-400">Advanced Performance Metrics</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Player:</label>
          <select
            value={selectedPlayer?.id || ''}
            onChange={e => {
              const player = players.find(p => p.id === e.target.value);
              setSelectedPlayer(player || null);
              if (player) {
                generatePlayerMetrics(player);
              }
            }}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="">Choose a player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.currentPotential} rating)
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-2 text-gray-400">Calculating advanced metrics...</p>
          </div>
        )}

        {playerMetrics && (
          <AdvancedMetricsRadar playerMetrics={playerMetrics} width={400} height={400} />
        )}
      </div>
    </div>
  );

  return (
    <div className={`advanced-analytics-dashboard ${className}`}>
      <div className="bg-gray-900 rounded-lg shadow-xl">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'development', label: '🎯 Player Development', color: 'text-green-400' },
              { key: 'formation', label: '⚡ Formation Analysis', color: 'text-blue-400' },
              { key: 'match', label: '🔮 Match Prediction', color: 'text-purple-400' },
              { key: 'heatmap', label: '🗺️ Heat Maps', color: 'text-red-400' },
              { key: 'metrics', label: '📊 Advanced Metrics', color: 'text-yellow-400' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab.key
                    ? `border-current ${tab.color}`
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {!advancedAiService.isAIAvailable() ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI Analytics Offline</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Advanced AI analytics require an API key to be configured. Enable AI features to
                unlock predictive analytics, formation analysis, and intelligent insights.
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'development' && renderDevelopmentTab()}
              {activeTab === 'formation' && renderFormationTab()}
              {activeTab === 'match' && renderMatchPredictionTab()}
              {activeTab === 'heatmap' && renderHeatMapTab()}
              {activeTab === 'metrics' && renderMetricsTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
