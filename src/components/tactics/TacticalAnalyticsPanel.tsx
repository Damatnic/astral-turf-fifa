import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Target,
  Users,
  Zap,
  Shield,
  Activity,
  Eye,
  X,
  Info,
} from 'lucide-react';
import { type Formation, type Player } from '../../types';
import { tacticalIntegrationService, type TacticalAnalysis } from '../../services/tacticalIntegrationService';

interface TacticalAnalyticsPanelProps {
  formation?: Formation;
  players?: Player[];
  isOpen: boolean;
  onClose: () => void;
}

interface FormationMetrics {
  balance: number;
  width: number;
  depth: number;
  compactness: number;
  attacking: number;
  defensive: number;
}

interface PlayerMetrics {
  chemistry: number;
  positioning: number;
  coverage: number;
  effectiveness: number;
}

const TacticalAnalyticsPanel: React.FC<TacticalAnalyticsPanelProps> = ({
  formation,
  players = [],
  isOpen,
  onClose,
}) => {
  const [analysis, setAnalysis] = useState<TacticalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');

  // Calculate formation metrics
  const formationMetrics = useMemo((): FormationMetrics | null => {
    if (!formation || !formation.positions) {return null;}

    const positions = Object.values(formation.positions);
    if (positions.length === 0) {return null;}

    // Filter out null/undefined positions and ensure valid coordinates
    const validPositions = positions.filter(pos => pos && typeof pos.x === 'number' && typeof pos.y === 'number');
    
    if (validPositions.length === 0) {return null;}

    // Calculate various tactical metrics
    const avgX = validPositions.reduce((sum, pos) => sum + pos.x, 0) / validPositions.length;
    const avgY = validPositions.reduce((sum, pos) => sum + pos.y, 0) / validPositions.length;

    const xCoordinates = validPositions.map(p => p.x);
    const yCoordinates = validPositions.map(p => p.y);
    const spreadX = Math.max(...xCoordinates) - Math.min(...xCoordinates);
    const spreadY = Math.max(...yCoordinates) - Math.min(...yCoordinates);

    const attackingPlayers = validPositions.filter(p => p.y > 60).length;
    const defensivePlayers = validPositions.filter(p => p.y < 40).length;

    return {
      balance: Math.max(0, 100 - Math.abs(avgX - 50) * 2),
      width: Math.min(100, (spreadX / 100) * 100),
      depth: Math.min(100, (spreadY / 100) * 100),
      compactness: Math.max(0, 100 - (spreadX + spreadY) / 2),
      attacking: (attackingPlayers / validPositions.length) * 100,
      defensive: (defensivePlayers / validPositions.length) * 100,
    };
  }, [formation]);

  // Calculate player chemistry metrics
  const playerMetrics = useMemo((): PlayerMetrics | null => {
    if (!formation || players.length === 0) {return null;}

    const chemistry = tacticalIntegrationService.calculatePlayerChemistry(players, formation);

    // Calculate positioning score based on player-position match
    const positioningScore = players.reduce((sum, player) => {
      const formationPos = formation.positions[player.id];
      if (!formationPos) {return sum;}

      // Simplified position matching score
      const positionMatch = player.position ? 80 : 60; // Better if player has preferred position
      return sum + positionMatch;
    }, 0) / players.length;

    // Calculate field coverage
    const heatMapData = tacticalIntegrationService.generateHeatMapData(formation, players);

    return {
      chemistry: chemistry.overall,
      positioning: positioningScore,
      coverage: heatMapData.coverage,
      effectiveness: (chemistry.overall + positioningScore + heatMapData.coverage) / 3,
    };
  }, [formation, players]);

  // Load tactical analysis
  useEffect(() => {
    if (isOpen && formation && players.length > 0) {
      setIsLoading(true);
      tacticalIntegrationService.analyzeFormation(formation, players)
        .then(setAnalysis)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, formation, players]);

  if (!isOpen) {return null;}

  const MetricCard: React.FC<{
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    color: string;
    description: string;
  }> = ({ title, value, icon: Icon, color, description }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-medium text-slate-300">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-white">{Math.round(value)}</span>
          <span className="text-xs text-slate-400">%</span>
        </div>
      </div>

      <div className="w-full bg-slate-700/50 rounded-full h-2 mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-2 rounded-full ${color.replace('text-', 'bg-')}`}
        />
      </div>

      <p className="text-xs text-slate-400">{description}</p>
    </motion.div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Tactical Analytics</h2>
              {formation && (
                <span className="text-sm text-slate-400">• {formation.name}</span>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <div className="text-white">Analyzing formation...</div>
                  <div className="text-slate-400 text-sm">Using AI tactical analysis</div>
                </div>
              </div>
            ) : !formation ? (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-400 mb-2">No formation selected</h3>
                <p className="text-slate-500">Select a formation to view tactical analytics</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Formation Metrics */}
                {formationMetrics && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      Formation Metrics
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <MetricCard
                        title="Balance"
                        value={formationMetrics.balance}
                        icon={Activity}
                        color="text-blue-400"
                        description="Left-right positional balance"
                      />

                      <MetricCard
                        title="Width"
                        value={formationMetrics.width}
                        icon={Eye}
                        color="text-green-400"
                        description="Formation width coverage"
                      />

                      <MetricCard
                        title="Depth"
                        value={formationMetrics.depth}
                        icon={TrendingUp}
                        color="text-purple-400"
                        description="Attacking depth variation"
                      />

                      <MetricCard
                        title="Compactness"
                        value={formationMetrics.compactness}
                        icon={Shield}
                        color="text-orange-400"
                        description="Team compactness level"
                      />

                      <MetricCard
                        title="Attacking Focus"
                        value={formationMetrics.attacking}
                        icon={Zap}
                        color="text-red-400"
                        description="Forward player positioning"
                      />

                      <MetricCard
                        title="Defensive Solidity"
                        value={formationMetrics.defensive}
                        icon={Shield}
                        color="text-cyan-400"
                        description="Defensive player coverage"
                      />
                    </div>
                  </div>
                )}

                {/* Player Metrics */}
                {playerMetrics && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-400" />
                      Player Performance
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        title="Chemistry"
                        value={playerMetrics.chemistry}
                        icon={Users}
                        color="text-pink-400"
                        description="Player compatibility score"
                      />

                      <MetricCard
                        title="Positioning"
                        value={playerMetrics.positioning}
                        icon={Target}
                        color="text-yellow-400"
                        description="Position-player match quality"
                      />

                      <MetricCard
                        title="Coverage"
                        value={playerMetrics.coverage}
                        icon={Eye}
                        color="text-indigo-400"
                        description="Field area coverage"
                      />

                      <MetricCard
                        title="Overall Effectiveness"
                        value={playerMetrics.effectiveness}
                        icon={TrendingUp}
                        color="text-emerald-400"
                        description="Combined performance score"
                      />
                    </div>
                  </div>
                )}

                {/* AI Analysis */}
                {analysis && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-yellow-400" />
                      AI Tactical Analysis
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Strengths */}
                      <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Strengths
                        </h4>
                        <ul className="space-y-2">
                          {analysis.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-green-300 flex items-start gap-2">
                              <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                        <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Areas to Improve
                        </h4>
                        <ul className="space-y-2">
                          {analysis.weaknesses.map((weakness, index) => (
                            <li key={index} className="text-sm text-red-300 flex items-start gap-2">
                              <span className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {analysis.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-sm text-blue-300 flex items-start gap-2">
                              <span className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                              {recommendation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Overall Rating */}
                    <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-white">Formation Effectiveness</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-white">{analysis.effectiveness}%</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            analysis.riskLevel === 'low' ? 'bg-green-900/50 text-green-400' :
                            analysis.riskLevel === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-red-900/50 text-red-400'
                          }`}>
                            {analysis.riskLevel.toUpperCase()} RISK
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-700/50 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${analysis.effectiveness}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={`h-3 rounded-full ${
                            analysis.effectiveness >= 80 ? 'bg-green-500' :
                            analysis.effectiveness >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export { TacticalAnalyticsPanel };
export default TacticalAnalyticsPanel;