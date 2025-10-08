/**
 * AI Tactical Intelligence Component
 * Integrates all AI services into the tactical board UI
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Play,
  Settings,
  Eye,
  Maximize2,
  Minimize2,
  Loader,
  RefreshCw,
} from 'lucide-react';

import {
  aiFootballIntelligence,
  type FormationAnalysis,
  type OptimizedAssignment,
  type TacticalAnalysis,
  type EffectivenessPrediction,
} from '../../services/aiFootballIntelligence';

import {
  aiPredictiveAnalytics,
  type MatchPrediction,
  type PlayerPerformancePrediction,
  type TeamChemistryAnalysis,
  type TeamPerformanceAnalysis,
} from '../../services/aiPredictiveAnalytics';

import {
  aiDrawingIntelligence,
  type DrawingAnalysis,
  type DrawingSuggestion,
  type DrawingValidation,
} from '../../services/aiDrawingIntelligence';

import { Player, Formation, DrawingShape, Team } from '../../types';

interface AITacticalIntelligenceProps {
  formation: Formation | null;
  players: Player[];
  drawings: DrawingShape[];
  team: Team;
  className?: string;
  isMinimized?: boolean;
  onMinimizeToggle?: () => void;
  onPlayerAssignmentSuggestion?: (assignments: OptimizedAssignment) => void;
  onTacticalSuggestion?: (suggestion: string) => void;
  onDrawingSuggestion?: (suggestion: DrawingSuggestion) => void;
}

type AnalysisTab = 'formation' | 'tactics' | 'prediction' | 'chemistry' | 'drawing';

const AITacticalIntelligence: React.FC<AITacticalIntelligenceProps> = ({
  formation,
  players,
  drawings,
  team,
  className,
  isMinimized = false,
  onMinimizeToggle,
  onPlayerAssignmentSuggestion,
  onTacticalSuggestion,
  onDrawingSuggestion,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<AnalysisTab>('formation');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  // Analysis results
  const [formationAnalysis, setFormationAnalysis] = useState<FormationAnalysis | null>(null);
  const [tacticalAnalysis, setTacticalAnalysis] = useState<TacticalAnalysis | null>(null);
  const [effectivenessPrediction, setEffectivenessPrediction] =
    useState<EffectivenessPrediction | null>(null);
  const [chemistryAnalysis, setChemistryAnalysis] = useState<TeamChemistryAnalysis | null>(null);
  const [drawingAnalysis, setDrawingAnalysis] = useState<DrawingAnalysis | null>(null);
  const [optimizedAssignment, setOptimizedAssignment] = useState<OptimizedAssignment | null>(null);
  const [playerPredictions, setPlayerPredictions] = useState<
    Record<string, PlayerPerformancePrediction>
  >({});

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Filter players for current team
  const teamPlayers = useMemo(() => players.filter(p => p.team === team), [players, team]);

  // Check if we have sufficient data for analysis
  const hasRequiredData = useMemo(
    () => formation && teamPlayers.length > 0,
    [formation, teamPlayers],
  );

  // Main analysis function
  const runCompleteAnalysis = useCallback(async () => {
    if (!hasRequiredData) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Run all analyses in parallel for better performance
      const [
        formationResult,
        tacticalResult,
        optimizedAssignmentResult,
        effectivenessResult,
        chemistryResult,
        drawingResult,
      ] = await Promise.all([
        // Formation analysis
        aiFootballIntelligence.analyzeFormation(formation!, teamPlayers),

        // Tactical pattern analysis
        aiFootballIntelligence.analyzeTacticalPatterns(formation!, teamPlayers),

        // Optimized player assignments
        aiFootballIntelligence.optimizePlayerAssignments(formation!, teamPlayers),

        // Formation effectiveness prediction
        aiFootballIntelligence.predictFormationEffectiveness(formation!, teamPlayers),

        // Team chemistry analysis
        aiPredictiveAnalytics.analyzeTeamChemistry(teamPlayers),

        // Drawing analysis (if drawings exist)
        drawings.length > 0
          ? aiDrawingIntelligence.analyzeDrawings(drawings, teamPlayers, formation!)
          : null,
      ]);

      // Update all results
      setFormationAnalysis(formationResult);
      setTacticalAnalysis(tacticalResult);
      setOptimizedAssignment(optimizedAssignmentResult);
      setEffectivenessPrediction(effectivenessResult);
      setChemistryAnalysis(chemistryResult);
      setDrawingAnalysis(drawingResult);

      // Run individual player predictions
      const playerPredictionsResult: Record<string, PlayerPerformancePrediction> = {};
      const matchContext = {
        isHome: team === 'home',
        oppositionStrength: 0.7, // Default value
        matchImportance: 'medium' as const,
      };

      await Promise.all(
        teamPlayers.map(async player => {
          const prediction = await aiPredictiveAnalytics.predictPlayerPerformance(
            player,
            matchContext,
          );
          playerPredictionsResult[player.id] = prediction;
        }),
      );

      setPlayerPredictions(playerPredictionsResult);
      setLastAnalysisTime(new Date());
    } catch (err) {
      console.error('AI Analysis Error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [hasRequiredData, formation, teamPlayers, drawings, team]);

  // Auto-analyze when data changes
  useEffect(() => {
    if (autoAnalyze && hasRequiredData) {
      const timer = setTimeout(runCompleteAnalysis, 500); // Debounce
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoAnalyze, hasRequiredData, runCompleteAnalysis]);

  // Render loading state
  if (isAnalyzing && !formationAnalysis) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <Loader className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Analyzing tactical intelligence...
          </span>
        </div>
      </div>
    );
  }

  // Render minimized state
  if (isMinimized) {
    return (
      <motion.div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 ${className}`}
        initial={{ height: 'auto' }}
        animate={{ height: 60 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              AI Analysis
            </span>
            {formationAnalysis && (
              <div className="flex items-center space-x-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    formationAnalysis.overallRating > 0.8
                      ? 'bg-green-500'
                      : formationAnalysis.overallRating > 0.6
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                />
                <span className="text-xs text-gray-500">
                  {Math.round(formationAnalysis.overallRating * 100)}%
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onMinimizeToggle}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Maximize2 className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </motion.div>
    );
  }

  if (!hasRequiredData) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Set up formation and players to enable AI analysis</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            AI Tactical Intelligence
          </h3>
          {lastAnalysisTime && (
            <span className="text-xs text-gray-500">
              Updated {lastAnalysisTime.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={runCompleteAnalysis}
            disabled={isAnalyzing}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Refresh Analysis"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setAutoAnalyze(!autoAnalyze)}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              autoAnalyze ? 'bg-blue-100 dark:bg-blue-900' : ''
            }`}
            title="Toggle Auto-Analysis"
          >
            <Zap className={`w-4 h-4 ${autoAnalyze ? 'text-blue-500' : 'text-gray-500'}`} />
          </button>

          <button
            onClick={onMinimizeToggle}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Minimize2 className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'formation', label: 'Formation', icon: Users },
          { id: 'tactics', label: 'Tactics', icon: Target },
          { id: 'prediction', label: 'Prediction', icon: TrendingUp },
          { id: 'chemistry', label: 'Chemistry', icon: Users },
          { id: 'drawing', label: 'Drawing', icon: Eye },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AnalysisTab)}
            className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 h-96 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'formation' && formationAnalysis && (
            <FormationAnalysisPanel
              analysis={formationAnalysis}
              optimizedAssignment={optimizedAssignment}
              onAssignmentSuggestion={onPlayerAssignmentSuggestion}
            />
          )}

          {activeTab === 'tactics' && tacticalAnalysis && (
            <TacticalAnalysisPanel
              analysis={tacticalAnalysis}
              effectiveness={effectivenessPrediction}
              onSuggestion={onTacticalSuggestion}
            />
          )}

          {activeTab === 'prediction' && (
            <PredictionPanel
              playerPredictions={playerPredictions}
              effectiveness={effectivenessPrediction}
              players={teamPlayers}
            />
          )}

          {activeTab === 'chemistry' && chemistryAnalysis && (
            <ChemistryPanel analysis={chemistryAnalysis} players={teamPlayers} />
          )}

          {activeTab === 'drawing' && (
            <DrawingAnalysisPanel
              analysis={drawingAnalysis}
              drawings={drawings}
              onSuggestion={onDrawingSuggestion}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Formation Analysis Panel
const FormationAnalysisPanel: React.FC<{
  analysis: FormationAnalysis;
  optimizedAssignment: OptimizedAssignment | null;
  onAssignmentSuggestion?: (assignment: OptimizedAssignment) => void;
}> = ({ analysis, optimizedAssignment, onAssignmentSuggestion }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="space-y-4"
  >
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
        <div className="text-sm text-gray-500 dark:text-gray-400">Overall Rating</div>
        <div className="text-2xl font-bold text-gray-800 dark:text-white">
          {Math.round(analysis.overallRating * 100)}%
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
        <div className="text-sm text-gray-500 dark:text-gray-400">Chemistry</div>
        <div className="text-2xl font-bold text-gray-800 dark:text-white">
          {Math.round(analysis.overallChemistry * 100)}%
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <h4 className="font-medium text-gray-800 dark:text-white">Strength Breakdown</h4>
      {[
        { label: 'Defensive', value: analysis.defensiveStrength, color: 'blue' },
        { label: 'Attacking', value: analysis.attackingStrength, color: 'red' },
        { label: 'Midfield', value: analysis.midfieldfControl, color: 'green' },
        { label: 'Balance', value: analysis.balanceScore, color: 'purple' },
      ].map(item => (
        <div key={item.label} className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className={`bg-${item.color}-500 h-2 rounded-full`}
                style={{ width: `${item.value * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8">{Math.round(item.value * 100)}%</span>
          </div>
        </div>
      ))}
    </div>

    {analysis.strengths.length > 0 && (
      <div>
        <h4 className="font-medium text-gray-800 dark:text-white mb-2">Strengths</h4>
        <ul className="space-y-1">
          {analysis.strengths.map((strength, index) => (
            <li key={index} className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-300">{strength}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {analysis.weaknesses.length > 0 && (
      <div>
        <h4 className="font-medium text-gray-800 dark:text-white mb-2">Weaknesses</h4>
        <ul className="space-y-1">
          {analysis.weaknesses.map((weakness, index) => (
            <li key={index} className="flex items-center space-x-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-300">{weakness}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {optimizedAssignment && onAssignmentSuggestion && (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={() => onAssignmentSuggestion(optimizedAssignment)}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Apply AI Optimized Assignments
        </button>
        <p className="text-xs text-gray-500 mt-1 text-center">
          Improvement Score: {Math.round(optimizedAssignment.improvementScore * 100)}%
        </p>
      </div>
    )}
  </motion.div>
);

// Tactical Analysis Panel
const TacticalAnalysisPanel: React.FC<{
  analysis: TacticalAnalysis;
  effectiveness: EffectivenessPrediction | null;
  onSuggestion?: (suggestion: string) => void;
}> = ({ analysis, effectiveness, onSuggestion }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="space-y-4"
  >
    {effectiveness && (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-gray-800 dark:text-white mb-2">Effectiveness Prediction</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Effectiveness</div>
            <div className="text-xl font-bold text-gray-800 dark:text-white">
              {Math.round(effectiveness.effectivenessScore * 100)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Confidence</div>
            <div className="text-xl font-bold text-gray-800 dark:text-white">
              {Math.round(effectiveness.confidence * 100)}%
            </div>
          </div>
        </div>
      </div>
    )}

    {analysis.patterns.length > 0 && (
      <div>
        <h4 className="font-medium text-gray-800 dark:text-white mb-2">Tactical Patterns</h4>
        <div className="space-y-2">
          {analysis.patterns.map((pattern, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-800 dark:text-white">
                  {pattern.description}
                </span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {Math.round(pattern.strength * 100)}%
                </span>
              </div>
              {pattern.implications.length > 0 && (
                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                  {pattern.implications.map((implication, i) => (
                    <li key={i} className="flex items-start space-x-1">
                      <span className="text-gray-400">•</span>
                      <span>{implication}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {analysis.recommendations.length > 0 && (
      <div>
        <h4 className="font-medium text-gray-800 dark:text-white mb-2">AI Recommendations</h4>
        <div className="space-y-2">
          {analysis.recommendations.map((recommendation, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded"
            >
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</span>
              </div>
              {onSuggestion && (
                <button
                  onClick={() => onSuggestion(recommendation)}
                  className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded hover:bg-yellow-300 dark:hover:bg-yellow-700"
                >
                  Apply
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </motion.div>
);

// Prediction Panel
const PredictionPanel: React.FC<{
  playerPredictions: Record<string, PlayerPerformancePrediction>;
  effectiveness: EffectivenessPrediction | null;
  players: Player[];
}> = ({ playerPredictions, effectiveness, players }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="space-y-4"
  >
    {effectiveness && (
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 dark:text-white mb-2">Key Factors</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {effectiveness.keyFactors.map((factor, index) => (
              <li key={index} className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )}

    <div>
      <h4 className="font-medium text-gray-800 dark:text-white mb-2">
        Player Performance Predictions
      </h4>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {players.map(player => {
          const prediction = playerPredictions[player.id];
          if (!prediction) {
            return null;
          }

          return (
            <div
              key={player.id}
              className="border border-gray-200 dark:border-gray-700 rounded p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-gray-800 dark:text-white">
                  {player.name}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {prediction.expectedRating.toFixed(1)}/10
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      prediction.injuryRisk.level === 'high'
                        ? 'bg-red-500'
                        : prediction.injuryRisk.level === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    title={`Injury risk: ${prediction.injuryRisk.level}`}
                  />
                </div>
              </div>

              {prediction.keyStrengths.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  <strong>Strengths:</strong> {prediction.keyStrengths.join(', ')}
                </div>
              )}

              {prediction.potentialWeaknesses.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  <strong>Watch:</strong> {prediction.potentialWeaknesses.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </motion.div>
);

// Chemistry Panel
const ChemistryPanel: React.FC<{
  analysis: TeamChemistryAnalysis;
  players: Player[];
}> = ({ analysis, players }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="space-y-4"
  >
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
      <h4 className="font-medium text-gray-800 dark:text-white mb-2">Team Chemistry</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Overall Score</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {Math.round(analysis.overallScore * 100)}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Performance Impact</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            +{Math.round((analysis.impactOnPerformance.performanceMultiplier - 1) * 100)}%
          </div>
        </div>
      </div>
    </div>

    {analysis.chemistryBoosters.length > 0 && (
      <div>
        <h4 className="font-medium text-gray-800 dark:text-white mb-2">Chemistry Boosters</h4>
        <div className="space-y-2">
          {analysis.chemistryBoosters.map((booster, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded"
            >
              <div>
                <div className="font-medium text-sm text-gray-800 dark:text-white">
                  {booster.playerName}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {booster.description}
                </div>
              </div>
              <div className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                {Math.round(booster.influence * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {analysis.chemistryDisruptors.length > 0 && (
      <div>
        <h4 className="font-medium text-gray-800 dark:text-white mb-2">Chemistry Concerns</h4>
        <div className="space-y-2">
          {analysis.chemistryDisruptors.map((disruptor, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded"
            >
              <div>
                <div className="font-medium text-sm text-gray-800 dark:text-white">
                  {disruptor.playerName}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {disruptor.description}
                </div>
              </div>
              <div className="text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                {Math.round(disruptor.influence * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {analysis.recommendations.length > 0 && (
      <div>
        <h4 className="font-medium text-gray-800 dark:text-white mb-2">Recommendations</h4>
        <ul className="space-y-1">
          {analysis.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start space-x-2 text-sm">
              <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-300">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </motion.div>
);

// Drawing Analysis Panel
const DrawingAnalysisPanel: React.FC<{
  analysis: DrawingAnalysis | null;
  drawings: DrawingShape[];
  onSuggestion?: (suggestion: DrawingSuggestion) => void;
}> = ({ analysis, drawings, onSuggestion }) => {
  if (!analysis && drawings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="text-center text-gray-500 dark:text-gray-400"
      >
        <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Add tactical drawings to enable AI analysis</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {analysis && (
        <>
          <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/20 dark:to-cyan-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 dark:text-white mb-2">Drawing Analysis</h4>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Overall Score:{' '}
              <span className="font-bold">{Math.round(analysis.overallScore * 100)}%</span>
            </div>
          </div>

          {analysis.tacticalRecognition.patterns.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                Recognized Patterns
              </h4>
              <div className="space-y-2">
                {analysis.tacticalRecognition.patterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-800 dark:text-white">
                        {pattern.name}
                      </span>
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
                        {Math.round(pattern.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                      {pattern.description}
                    </div>
                    {pattern.implications.length > 0 && (
                      <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                        {pattern.implications.map((implication, i) => (
                          <li key={i}>• {implication}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.tacticalRecognition.suggestions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                Drawing Suggestions
              </h4>
              <div className="space-y-2">
                {analysis.tacticalRecognition.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-white">
                        {suggestion.description}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {suggestion.reasoning}
                      </div>
                    </div>
                    {onSuggestion && (
                      <button
                        onClick={() => onSuggestion(suggestion as any)}
                        className="ml-2 text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded hover:bg-blue-300 dark:hover:bg-blue-700"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {drawings.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p className="text-sm">Start drawing tactical elements to get AI-powered insights</p>
        </div>
      )}
    </motion.div>
  );
};

export default AITacticalIntelligence;
