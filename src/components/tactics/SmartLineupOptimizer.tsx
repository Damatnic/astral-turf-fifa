import React, { useState, useEffect } from 'react';
import type { Player, Formation, TeamTactics, AIPersonality } from '../../types';
import {
  matchStrategyService,
  MatchStrategyPlan,
  OppositionAnalysisReport,
} from '../../services/matchStrategyService';

interface SmartLineupOptimizerProps {
  availablePlayers: Player[];
  availableFormations: Formation[];
  currentTactics: TeamTactics;
  aiPersonality: AIPersonality;
  onLineupOptimized?: (optimizedLineup: {
    formation: Formation;
    selectedPlayers: Player[];
    tactics: TeamTactics;
    strategy: MatchStrategyPlan;
  }) => void;
  className?: string;
}

const SmartLineupOptimizer: React.FC<SmartLineupOptimizerProps> = ({
  availablePlayers,
  availableFormations,
  currentTactics,
  aiPersonality,
  onLineupOptimized,
  className = '',
}) => {
  const [opponent, setOpponent] = useState('');
  const [venue, setVenue] = useState<'home' | 'away' | 'neutral'>('home');
  const [importance, setImportance] = useState<'low' | 'medium' | 'high' | 'crucial'>('medium');
  const [weather, setWeather] = useState('Clear');
  const [loading, setLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{
    strategy: MatchStrategyPlan;
    oppositionReport: OppositionAnalysisReport;
    recommendedLineup: {
      formation: Formation;
      players: Player[];
      tactics: TeamTactics;
    };
  } | null>(null);

  const [playerFitness, setPlayerFitness] = useState<Record<string, number>>(
    availablePlayers.reduce(
      (acc, player) => {
        acc[player.id] = Math.max(100 - player.fatigue, 20); // Convert fatigue to fitness
        return acc;
      },
      {} as Record<string, number>,
    ),
  );

  const optimizeLineup = async () => {
    if (!opponent.trim()) {
      console.log('Please enter an opponent name');
      return;
    }

    if (!matchStrategyService.isAIAvailable()) {
      console.log('AI service is not available. Please configure your API key.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Generate opposition analysis
      const oppositionReport = await matchStrategyService.generateOppositionReport(
        opponent,
        {
          // You could populate this with real data from your database
          playingStyle: 'Unknown',
        },
        aiPersonality,
      );

      // Step 2: Generate match strategy
      const strategy = await matchStrategyService.generateMatchStrategy(
        {
          players: availablePlayers,
          availableFormations,
          currentTactics,
        },
        oppositionReport,
        {
          venue,
          importance,
          weather,
          playerFitness,
        },
        aiPersonality,
      );

      // Step 3: Find recommended formation
      const recommendedFormation =
        availableFormations.find(f => f.name === strategy.recommendedFormation) ||
        availableFormations[0];

      // Step 4: Select best players for each position
      const selectedPlayers = selectOptimalPlayers(
        availablePlayers,
        recommendedFormation,
        strategy,
        oppositionReport,
      );

      const result = {
        strategy,
        oppositionReport,
        recommendedLineup: {
          formation: recommendedFormation,
          players: selectedPlayers,
          tactics: strategy.recommendedTactics,
        },
      };

      setOptimizationResult(result);

      // Callback to parent component
      if (onLineupOptimized) {
        onLineupOptimized({
          formation: recommendedFormation,
          selectedPlayers,
          tactics: strategy.recommendedTactics,
          strategy,
        });
      }
    } catch (_error) {
      console.error('Failed to optimize lineup:', _error);
      alert('Failed to optimize lineup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectOptimalPlayers = (
    players: Player[],
    formation: Formation,
    strategy: MatchStrategyPlan,
    opposition: OppositionAnalysisReport,
  ): Player[] => {
    const selectedPlayers: Player[] = [];

    // Sort players by role compatibility and current form
    const playersByRole = players.reduce(
      (acc, player) => {
        const role = getPlayerPositionCategory(player.roleId);
        if (!acc[role]) {
          acc[role] = [];
        }
        acc[role].push(player);
        return acc;
      },
      {} as Record<string, Player[]>,
    );

    // Sort each role by fitness, form, and rating
    Object.keys(playersByRole).forEach(role => {
      playersByRole[role].sort((a, b) => {
        const aScore = calculatePlayerScore(a, strategy, opposition);
        const bScore = calculatePlayerScore(b, strategy, opposition);
        return bScore - aScore;
      });
    });

    // Select players for each formation slot
    formation.slots.forEach(slot => {
      const roleCategory = slot.role;
      const availablePlayers = playersByRole[roleCategory] || [];

      // Find best available player for this position
      const selectedPlayer = availablePlayers.find(
        player => !selectedPlayers.includes(player) && playerFitness[player.id] > 30, // Minimum fitness threshold
      );

      if (selectedPlayer) {
        selectedPlayers.push(selectedPlayer);
      }
    });

    return selectedPlayers;
  };

  const getPlayerPositionCategory = (roleId: string): string => {
    if (['gk', 'sk'].includes(roleId)) {
      return 'GK';
    }
    if (['cb', 'bpd', 'ncb', 'fb', 'wb'].includes(roleId)) {
      return 'DF';
    }
    if (['dm', 'dlp', 'cm', 'b2b', 'ap', 'wm'].includes(roleId)) {
      return 'MF';
    }
    if (['w', 'iw', 'p', 'tf', 'cf'].includes(roleId)) {
      return 'FW';
    }
    return 'MF'; // Default
  };

  const calculatePlayerScore = (
    player: Player,
    strategy: MatchStrategyPlan,
    opposition: OppositionAnalysisReport,
  ): number => {
    let score = player.currentPotential; // Base rating

    // Form bonus/penalty
    const formMultiplier =
      {
        Excellent: 1.2,
        Good: 1.1,
        Average: 1.0,
        Poor: 0.9,
        'Very Poor': 0.8,
      }[player.form] || 1.0;

    score *= formMultiplier;

    // Fitness consideration
    score *= playerFitness[player.id] / 100;

    // Morale bonus
    const moraleBonus =
      {
        Excellent: 5,
        Good: 2,
        Okay: 0,
        Poor: -3,
        'Very Poor': -6,
      }[player.morale] || 0;

    score += moraleBonus;

    // Role-specific bonuses based on strategy
    if (strategy.difficulty === 'hard' || strategy.difficulty === 'very_hard') {
      // Favor experienced players for difficult matches
      if (player.age >= 25) {
        score += 5;
      }

      // Favor players with leadership traits
      if (player.traits.includes('Leader')) {
        score += 8;
      }
    }

    // Tactical fit bonus
    if (strategy.recommendedTactics.pressing === 'high' && player.attributes.stamina >= 85) {
      score += 5;
    }

    if (
      strategy.recommendedTactics.mentality === 'attacking' &&
      ['w', 'iw', 'cf', 'ap'].includes(player.roleId)
    ) {
      score += 5;
    }

    if (
      strategy.recommendedTactics.mentality === 'defensive' &&
      ['cb', 'dm', 'ncb'].includes(player.roleId)
    ) {
      score += 5;
    }

    return score;
  };

  return (
    <div className={`smart-lineup-optimizer ${className}`}>
      <div className="bg-gray-800 rounded-lg shadow-xl">
        <div className="border-b border-gray-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <span className="text-2xl mr-3">🧠</span>
            Smart Lineup Optimizer
          </h2>
          <p className="text-gray-400 mt-1">AI-powered tactical analysis and lineup optimization</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Opponent</label>
              <input
                type="text"
                value={opponent}
                onChange={e => setOpponent(e.target.value)}
                placeholder="Enter opponent name..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Venue</label>
              <select
                value={venue}
                onChange={e => setVenue(e.target.value as any)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="home">Home</option>
                <option value="away">Away</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Importance</label>
              <select
                value={importance}
                onChange={e => setImportance(e.target.value as any)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="crucial">Crucial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Weather</label>
              <select
                value={weather}
                onChange={e => setWeather(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Clear">Clear</option>
                <option value="Rainy">Rainy</option>
                <option value="Windy">Windy</option>
                <option value="Snow">Snow</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={optimizeLineup}
              disabled={loading || !matchStrategyService.isAIAvailable()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Optimizing Lineup...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Optimize Lineup
                </>
              )}
            </button>
          </div>

          {!matchStrategyService.isAIAvailable() && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-semibold text-yellow-400">AI Service Unavailable</h4>
                  <p className="text-sm text-gray-300">
                    Configure your API key to enable smart lineup optimization features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {optimizationResult && (
            <div className="space-y-6">
              {/* Opposition Analysis */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Opposition Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-white mb-2">Threat Level</h4>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-600 rounded-full h-2 mr-3">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${optimizationResult.oppositionReport.overallThreatLevel * 10}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-white font-semibold">
                        {optimizationResult.oppositionReport.overallThreatLevel}/10
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">Playing Style</h4>
                    <p className="text-gray-300">
                      {optimizationResult.oppositionReport.tacticalProfile.playingStyle}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-400 mb-2">Their Strengths</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {optimizationResult.oppositionReport.teamStrengths.map((strength, i) => (
                        <li key={i}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-400 mb-2">Their Weaknesses</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {optimizationResult.oppositionReport.teamWeaknesses.map((weakness, i) => (
                        <li key={i}>• {weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommended Strategy */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">Recommended Strategy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-white mb-2">Formation & Tactics</h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p>
                        <strong>Formation:</strong>{' '}
                        {optimizationResult.strategy.recommendedFormation}
                      </p>
                      <p>
                        <strong>Mentality:</strong>{' '}
                        {optimizationResult.strategy.recommendedTactics.mentality}
                      </p>
                      <p>
                        <strong>Pressing:</strong>{' '}
                        {optimizationResult.strategy.recommendedTactics.pressing}
                      </p>
                      <p>
                        <strong>Defensive Line:</strong>{' '}
                        {optimizationResult.strategy.recommendedTactics.defensiveLine}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">Match Difficulty</h4>
                    <div className="flex items-center mb-2">
                      <span
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          optimizationResult.strategy.difficulty === 'easy'
                            ? 'bg-green-600'
                            : optimizationResult.strategy.difficulty === 'medium'
                              ? 'bg-yellow-600'
                              : optimizationResult.strategy.difficulty === 'hard'
                                ? 'bg-orange-600'
                                : 'bg-red-600'
                        }`}
                      >
                        {optimizationResult.strategy.difficulty.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">
                      <p>
                        <strong>Confidence:</strong>{' '}
                        {optimizationResult.strategy.predictionConfidence}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Lineup */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-400 mb-4">Optimized Lineup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {optimizationResult.recommendedLineup.players.map((player, i) => (
                    <div key={player.id} className="bg-gray-600 rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{player.name}</div>
                          <div className="text-sm text-gray-300">{player.roleId.toUpperCase()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-400">
                            {player.currentPotential}
                          </div>
                          <div className="text-xs text-gray-400">
                            Fitness: {playerFitness[player.id]}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs">
                        <span
                          className={`px-2 py-1 rounded ${
                            player.form === 'Excellent'
                              ? 'bg-green-600'
                              : player.form === 'Good'
                                ? 'bg-blue-600'
                                : player.form === 'Average'
                                  ? 'bg-gray-600'
                                  : player.form === 'Poor'
                                    ? 'bg-orange-600'
                                    : 'bg-red-600'
                          }`}
                        >
                          {player.form}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Plan */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-400 mb-4">Game Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-green-400 mb-2">If Winning</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {optimizationResult.strategy.contingencyPlans.ifWinning.map((plan, i) => (
                        <li key={i}>• {plan}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-400 mb-2">If Drawing</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {optimizationResult.strategy.contingencyPlans.ifDrawing.map((plan, i) => (
                        <li key={i}>• {plan}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-400 mb-2">If Losing</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {optimizationResult.strategy.contingencyPlans.ifLosing.map((plan, i) => (
                        <li key={i}>• {plan}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartLineupOptimizer;
