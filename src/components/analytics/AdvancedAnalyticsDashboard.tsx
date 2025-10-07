import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../../types';

// Mock data structures for analytics - these would be replaced with actual AI service calls
interface PlayerDevelopmentPrediction {
  playerId: string;
  projectedRatingIn1Year: number;
  projectedRatingIn3Years: number;
  peakPotential: number;
  developmentRisk: 'Low' | 'Medium' | 'High';
  keyAttributes: {
    attribute: string;
    currentValue: number;
    projectedValue: number;
    developmentPotential: number;
  }[];
  recommendations: string[];
}

interface FormationEffectivenessAnalysis {
  formationName: string;
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  defensiveRating: number;
  midFieldRating: number;
  attackingRating: number;
  vsCommonFormations: {
    formation: string;
    effectiveness: number;
    prediction: string;
  }[];
}

interface MatchPrediction {
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability: number;
  predictedScoreline: string;
  keyFactors: string[];
  recommendations: string[];
}

interface TacticalHeatMapData {
  positions: { x: number; y: number; intensity: number }[];
  movementPatterns: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    frequency: number;
  }[];
  influenceZones: { x: number; y: number; radius: number; influence: number }[];
}

interface PlayerPerformanceMetrics {
  playerId: string;
  overallRating: number;
  attributes: {
    name: string;
    value: number;
    percentile: number;
  }[];
  trendAnalysis: {
    attribute: string;
    trend: 'improving' | 'declining' | 'stable';
    changeRate: number;
  }[];
  comparisons: {
    playerName: string;
    similarityScore: number;
    strengths: string[];
  }[];
}

interface AdvancedAnalyticsDashboardProps {
  players: Player[];
  className?: string;
  onClose?: () => void;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  players,
  className = '',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'development' | 'formation' | 'match' | 'heatmap' | 'metrics'
  >('development');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data states
  const [developmentPrediction, setDevelopmentPrediction] =
    useState<PlayerDevelopmentPrediction | null>(null);
  const [formationAnalysis, setFormationAnalysis] = useState<FormationEffectivenessAnalysis | null>(
    null,
  );
  const [matchPrediction, setMatchPrediction] = useState<MatchPrediction | null>(null);
  const [heatMapData, setHeatMapData] = useState<TacticalHeatMapData | null>(null);
  const [playerMetrics, setPlayerMetrics] = useState<PlayerPerformanceMetrics | null>(null);

  const tabs = [
    { id: 'development', label: 'Player Development', icon: '📈', color: 'blue' },
    { id: 'formation', label: 'Formation Analysis', icon: '⚽', color: 'green' },
    { id: 'match', label: 'Match Prediction', icon: '🎯', color: 'purple' },
    { id: 'heatmap', label: 'Heat Maps', icon: '🔥', color: 'red' },
    { id: 'metrics', label: 'Player Metrics', icon: '📊', color: 'yellow' },
  ] as const;

  // Mock data generation functions
  const generateDevelopmentPrediction = async (player: Player) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockPrediction: PlayerDevelopmentPrediction = {
      playerId: player.id,
      projectedRatingIn1Year: (player.rating || 75) + Math.floor(Math.random() * 5) + 1,
      projectedRatingIn3Years: (player.rating || 75) + Math.floor(Math.random() * 10) + 3,
      peakPotential: Math.min(99, (player.rating || 75) + Math.floor(Math.random() * 15) + 5),
      developmentRisk: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as any,
      keyAttributes: [
        { attribute: 'Speed', currentValue: 75, projectedValue: 82, developmentPotential: 85 },
        { attribute: 'Passing', currentValue: 68, projectedValue: 74, developmentPotential: 78 },
        { attribute: 'Shooting', currentValue: 72, projectedValue: 76, developmentPotential: 80 },
        { attribute: 'Dribbling', currentValue: 70, projectedValue: 75, developmentPotential: 78 },
      ],
      recommendations: [
        'Focus on technical training to maximize passing development',
        'Increase physical conditioning to maintain speed advantage',
        'Work on finishing in training to reach shooting potential',
      ],
    };

    setDevelopmentPrediction(mockPrediction);
    setLoading(false);
  };

  const generateFormationAnalysis = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const mockAnalysis: FormationEffectivenessAnalysis = {
      formationName: '4-3-3',
      overallRating: 8.2,
      strengths: ['Strong wing play', 'Good pressing intensity', 'Balanced midfield'],
      weaknesses: ['Vulnerable to counter-attacks', 'Limited defensive cover'],
      defensiveRating: 7.5,
      midFieldRating: 8.7,
      attackingRating: 8.9,
      vsCommonFormations: [
        { formation: '4-4-2', effectiveness: 85, prediction: 'Favorable matchup' },
        { formation: '3-5-2', effectiveness: 72, prediction: 'Even contest' },
        { formation: '5-3-2', effectiveness: 68, prediction: 'Difficult matchup' },
      ],
    };

    setFormationAnalysis(mockAnalysis);
    setLoading(false);
  };

  const generateMatchPrediction = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockPrediction: MatchPrediction = {
      homeWinProbability: 45,
      awayWinProbability: 35,
      drawProbability: 20,
      predictedScoreline: '2-1',
      keyFactors: [
        'Home advantage provides +15% win probability',
        'Current form favors home team',
        'Away team stronger in midfield',
      ],
      recommendations: [
        'Consider more defensive approach in first 20 minutes',
        'Exploit pace on the wings against slower fullbacks',
        'Target set pieces as key scoring opportunity',
      ],
    };

    setMatchPrediction(mockPrediction);
    setLoading(false);
  };

  const generateHeatMap = async (player: Player) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate mock heat map data
    const positions = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      intensity: Math.random(),
    }));

    const mockHeatMap: TacticalHeatMapData = {
      positions,
      movementPatterns: [
        { from: { x: 25, y: 80 }, to: { x: 35, y: 60 }, frequency: 0.8 },
        { from: { x: 35, y: 60 }, to: { x: 45, y: 40 }, frequency: 0.6 },
        { from: { x: 45, y: 40 }, to: { x: 55, y: 25 }, frequency: 0.7 },
      ],
      influenceZones: [
        { x: 30, y: 70, radius: 15, influence: 0.9 },
        { x: 50, y: 50, radius: 12, influence: 0.7 },
        { x: 65, y: 30, radius: 10, influence: 0.8 },
      ],
    };

    setHeatMapData(mockHeatMap);
    setLoading(false);
  };

  const generatePlayerMetrics = async (player: Player) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1100));

    const mockMetrics: PlayerPerformanceMetrics = {
      playerId: player.id,
      overallRating: player.rating || 75,
      attributes: [
        { name: 'Speed', value: 82, percentile: 78 },
        { name: 'Passing', value: 74, percentile: 65 },
        { name: 'Shooting', value: 76, percentile: 72 },
        { name: 'Dribbling', value: 79, percentile: 85 },
        { name: 'Defending', value: 45, percentile: 23 },
        { name: 'Physical', value: 81, percentile: 89 },
      ],
      trendAnalysis: [
        { attribute: 'Speed', trend: 'improving', changeRate: 2.3 },
        { attribute: 'Passing', trend: 'stable', changeRate: 0.1 },
        { attribute: 'Shooting', trend: 'declining', changeRate: -1.2 },
      ],
      comparisons: [
        { playerName: 'Similar Player A', similarityScore: 87, strengths: ['Speed', 'Dribbling'] },
        {
          playerName: 'Similar Player B',
          similarityScore: 84,
          strengths: ['Physical', 'Shooting'],
        },
      ],
    };

    setPlayerMetrics(mockMetrics);
    setLoading(false);
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
          />
          <span className="ml-3 text-gray-400">Analyzing data...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'development':
        return renderDevelopmentTab();
      case 'formation':
        return renderFormationTab();
      case 'match':
        return renderMatchTab();
      case 'heatmap':
        return renderHeatMapTab();
      case 'metrics':
        return renderMetricsTab();
      default:
        return null;
    }
  };

  const renderDevelopmentTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-400 flex items-center">
          📈 Player Development Prediction
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-300">Select Player:</label>
          <select
            value={selectedPlayer?.id || ''}
            onChange={e => {
              const player = players.find(p => p.id === e.target.value);
              setSelectedPlayer(player || null);
              if (player) {
                generateDevelopmentPrediction(player);
              }
            }}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.age} years, {player.rating || 75} rating)
              </option>
            ))}
          </select>
        </div>

        {developmentPrediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {developmentPrediction.projectedRatingIn1Year}
                </div>
                <div className="text-sm text-gray-300">1 Year Projection</div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {developmentPrediction.projectedRatingIn3Years}
                </div>
                <div className="text-sm text-gray-300">3 Year Projection</div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {developmentPrediction.peakPotential}
                </div>
                <div className="text-sm text-gray-300">Peak Potential</div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <div
                  className={`text-2xl font-bold ${
                    developmentPrediction.developmentRisk === 'Low'
                      ? 'text-green-400'
                      : developmentPrediction.developmentRisk === 'Medium'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {developmentPrediction.developmentRisk}
                </div>
                <div className="text-sm text-gray-300">Development Risk</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-200">Attribute Projections</h4>
                <div className="space-y-3">
                  {developmentPrediction.keyAttributes.map((attr, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{attr.attribute}</span>
                        <span>
                          {attr.currentValue} → {attr.projectedValue}
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(attr.projectedValue / attr.developmentPotential) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-200">Development Recommendations</h4>
                <div className="space-y-2">
                  {developmentPrediction.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  const renderFormationTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-400 flex items-center">
            ⚽ Formation Effectiveness Analysis
          </h3>
          <button
            onClick={generateFormationAnalysis}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Analyze Current Formation
          </button>
        </div>

        {formationAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-400">
                  {formationAnalysis.overallRating}/10
                </div>
                <div className="text-sm text-gray-300">Overall Rating</div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-400">
                  {formationAnalysis.defensiveRating}/10
                </div>
                <div className="text-sm text-gray-300">Defensive</div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {formationAnalysis.midFieldRating}/10
                </div>
                <div className="text-sm text-gray-300">Midfield</div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {formationAnalysis.attackingRating}/10
                </div>
                <div className="text-sm text-gray-300">Attacking</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-green-400">Strengths</h4>
                <div className="space-y-2">
                  {formationAnalysis.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3" />
                      <span className="text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-red-400">Weaknesses</h4>
                <div className="space-y-2">
                  {formationAnalysis.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-red-400 rounded-full mr-3" />
                      <span className="text-sm">{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-purple-400">Vs Common Formations</h4>
                <div className="space-y-3">
                  {formationAnalysis.vsCommonFormations.map((matchup, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{matchup.formation}</span>
                        <span
                          className={
                            matchup.effectiveness > 75
                              ? 'text-green-400'
                              : matchup.effectiveness > 60
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          }
                        >
                          {matchup.effectiveness}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">{matchup.prediction}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  const renderMatchTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-purple-400 flex items-center">
            🎯 Match Prediction Analysis
          </h3>
          <button
            onClick={generateMatchPrediction}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Generate Prediction
          </button>
        </div>

        {matchPrediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {matchPrediction.homeWinProbability}%
                </div>
                <div className="text-sm text-gray-300">Home Win</div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {matchPrediction.drawProbability}%
                </div>
                <div className="text-sm text-gray-300">Draw</div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-400">
                  {matchPrediction.awayWinProbability}%
                </div>
                <div className="text-sm text-gray-300">Away Win</div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-400">
                  {matchPrediction.predictedScoreline}
                </div>
                <div className="text-sm text-gray-300">Predicted Score</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-200">Key Factors</h4>
                <div className="space-y-2">
                  {matchPrediction.keyFactors.map((factor, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-200">Tactical Recommendations</h4>
                <div className="space-y-2">
                  {matchPrediction.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  const renderHeatMapTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-red-400 flex items-center">
          🔥 Tactical Heat Map Analysis
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Select Player for Heat Map:
          </label>
          <select
            value={selectedPlayer?.id || ''}
            onChange={e => {
              const player = players.find(p => p.id === e.target.value);
              setSelectedPlayer(player || null);
              if (player) {
                generateHeatMap(player);
              }
            }}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white w-full focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Choose a player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} - {player.roleId}
              </option>
            ))}
          </select>
        </div>

        {heatMapData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="font-semibold mb-4 text-gray-200">Position Heat Map</h4>
              <div className="relative w-full h-96 bg-green-800 rounded-lg overflow-hidden">
                {/* Field markings */}
                <div className="absolute inset-0 border-2 border-white opacity-30" />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white opacity-30" />
                <div className="absolute left-1/2 top-1/2 w-20 h-20 border-2 border-white rounded-full opacity-30 transform -translate-x-1/2 -translate-y-1/2" />

                {/* Heat map points */}
                {heatMapData.positions.map((position, index) => (
                  <div
                    key={index}
                    className="absolute rounded-full"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      width: `${Math.max(4, position.intensity * 20)}px`,
                      height: `${Math.max(4, position.intensity * 20)}px`,
                      backgroundColor: `rgba(255, ${255 - position.intensity * 255}, 0, ${position.intensity * 0.7})`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}

                {/* Movement patterns */}
                {heatMapData.movementPatterns.map((pattern, index) => (
                  <svg
                    key={index}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 10 }}
                  >
                    <line
                      x1={`${pattern.from.x}%`}
                      y1={`${pattern.from.y}%`}
                      x2={`${pattern.to.x}%`}
                      y2={`${pattern.to.y}%`}
                      stroke="rgba(255, 255, 255, 0.6)"
                      strokeWidth={pattern.frequency * 3}
                      markerEnd="url(#arrowhead)"
                    />
                  </svg>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-400">
                  {heatMapData.positions.length}
                </div>
                <div className="text-sm text-gray-300">Touch Points</div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {heatMapData.movementPatterns.length}
                </div>
                <div className="text-sm text-gray-300">Movement Patterns</div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {heatMapData.influenceZones.length}
                </div>
                <div className="text-sm text-gray-300">Influence Zones</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  const renderMetricsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-yellow-400 flex items-center">
          📊 Advanced Performance Metrics
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Select Player for Detailed Analysis:
          </label>
          <select
            value={selectedPlayer?.id || ''}
            onChange={e => {
              const player = players.find(p => p.id === e.target.value);
              setSelectedPlayer(player || null);
              if (player) {
                generatePlayerMetrics(player);
              }
            }}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white w-full focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">Choose a player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} - Overall: {player.rating || 75}
              </option>
            ))}
          </select>
        </div>

        {playerMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-4 text-gray-200">Attribute Breakdown</h4>
                <div className="space-y-3">
                  {playerMetrics.attributes.map((attr, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{attr.name}</span>
                        <span className="font-semibold">
                          {attr.value} ({attr.percentile}th%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${attr.percentile}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-4 text-gray-200">Trend Analysis</h4>
                <div className="space-y-3">
                  {playerMetrics.trendAnalysis.map((trend, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-600 rounded"
                    >
                      <span className="text-sm">{trend.attribute}</span>
                      <div className="flex items-center">
                        <span
                          className={`text-sm mr-2 ${
                            trend.trend === 'improving'
                              ? 'text-green-400'
                              : trend.trend === 'declining'
                                ? 'text-red-400'
                                : 'text-gray-400'
                          }`}
                        >
                          {trend.trend === 'improving'
                            ? '↗'
                            : trend.trend === 'declining'
                              ? '↘'
                              : '→'}
                        </span>
                        <span className="text-sm font-semibold">
                          {trend.changeRate > 0 ? '+' : ''}
                          {trend.changeRate.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="font-semibold mb-4 text-gray-200">Similar Players</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playerMetrics.comparisons.map((comparison, index) => (
                  <div key={index} className="p-3 bg-gray-600 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{comparison.playerName}</span>
                      <span className="text-sm text-yellow-400">
                        {comparison.similarityScore}% match
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Similar strengths: {comparison.strengths.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-900 text-white ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Advanced Analytics Dashboard</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? `bg-${tab.color}-600 text-white`
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
