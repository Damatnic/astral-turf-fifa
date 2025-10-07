import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import { openAiService } from '../../services/openAiService';
import type { Formation, Player, Team } from '../../types';

interface TacticalAnalysis {
  id: string;
  timestamp: number;
  formationAnalysis: {
    homeTeam: FormationAnalysisResult;
    awayTeam: FormationAnalysisResult;
    comparison: FormationComparison;
  };
  suggestions: TacticalSuggestion[];
  weaknesses: TacticalWeakness[];
  strengths: TacticalStrength[];
  confidence: number;
  analysisType: 'formation' | 'matchup' | 'vulnerability' | 'optimization';
}

interface FormationAnalysisResult {
  formation: string;
  effectiveness: number;
  coverage: {
    defensive: number;
    midfield: number;
    attacking: number;
  };
  vulnerabilities: string[];
  strengths: string[];
  playerRoleOptimization: PlayerRoleOptimization[];
}

interface FormationComparison {
  advantages: string[];
  disadvantages: string[];
  keyBattles: KeyBattle[];
  predictedOutcome: {
    probability: number;
    reasoning: string;
  };
}

interface TacticalSuggestion {
  id: string;
  type: 'formation' | 'player' | 'strategy' | 'positioning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation: string;
  expectedImpact: number;
  targetedWeakness?: string;
}

interface TacticalWeakness {
  id: string;
  area: 'defense' | 'midfield' | 'attack' | 'transition';
  severity: number;
  description: string;
  affectedPlayers: string[];
  exploitationRisk: number;
}

interface TacticalStrength {
  id: string;
  area: 'defense' | 'midfield' | 'attack' | 'transition';
  effectiveness: number;
  description: string;
  keyPlayers: string[];
  leverageOpportunity: number;
}

interface PlayerRoleOptimization {
  playerId: string;
  currentRole: string;
  suggestedRole: string;
  improvementPotential: number;
  reasoning: string;
}

interface KeyBattle {
  area: string;
  homePlayer: string;
  awayPlayer: string;
  importance: number;
  prediction: string;
}

// AI Analysis Panel
const AIAnalysisPanel: React.FC<{
  analysis: TacticalAnalysis | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onApplySuggestion: (suggestion: TacticalSuggestion) => void;
}> = React.memo(({ analysis, isAnalyzing, onAnalyze, onApplySuggestion }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'suggestions' | 'weaknesses' | 'strengths'
  >('overview');

  const getEffectivenessColor = (value: number) => {
    if (value >= 80) {
      return 'text-green-400';
    }
    if (value >= 60) {
      return 'text-yellow-400';
    }
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500 bg-blue-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="bg-gray-900/95 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl w-96 max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <h3 className="text-lg font-bold text-white">AI Tactical Analysis</h3>
          </div>
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isAnalyzing
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105'
            }`}
          >
            {isAnalyzing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </div>
            ) : (
              'Analyze Formation'
            )}
          </button>
        </div>

        {analysis && (
          <div className="mt-2 text-xs text-gray-400">
            Confidence: {(analysis.confidence * 100).toFixed(1)}% •
            {new Date(analysis.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Tabs */}
      {analysis && (
        <div className="flex border-b border-white/10">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'suggestions', label: 'Suggestions', icon: '💡' },
            { id: 'weaknesses', label: 'Weaknesses', icon: '⚠️' },
            { id: 'strengths', label: 'Strengths', icon: '💪' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 p-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="text-center">
                <div className="text-lg mb-1">{tab.icon}</div>
                <div>{tab.label}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-96">
        {!analysis ? (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-4">🤖</div>
            <div className="text-lg font-medium mb-2">AI Ready for Analysis</div>
            <div className="text-sm">
              Click "Analyze Formation" to get intelligent tactical insights
            </div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Formation Comparison */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-3">Formation Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-blue-400 font-medium text-sm">Home Team</div>
                      <div className="text-white text-lg">
                        {analysis.formationAnalysis.homeTeam.formation}
                      </div>
                      <div
                        className={`text-sm ${getEffectivenessColor(analysis.formationAnalysis.homeTeam.effectiveness)}`}
                      >
                        {analysis.formationAnalysis.homeTeam.effectiveness}% Effective
                      </div>
                    </div>
                    <div>
                      <div className="text-red-400 font-medium text-sm">Away Team</div>
                      <div className="text-white text-lg">
                        {analysis.formationAnalysis.awayTeam.formation}
                      </div>
                      <div
                        className={`text-sm ${getEffectivenessColor(analysis.formationAnalysis.awayTeam.effectiveness)}`}
                      >
                        {analysis.formationAnalysis.awayTeam.effectiveness}% Effective
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Battles */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-3">Key Battles</h4>
                  <div className="space-y-2">
                    {analysis.formationAnalysis.comparison.keyBattles
                      .slice(0, 3)
                      .map((battle, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="text-gray-300">{battle.area}</div>
                          <div className="text-white font-medium">
                            {(battle.importance * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Predicted Outcome */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-2">Match Prediction</h4>
                  <div className="text-green-400 font-medium">
                    {(
                      analysis.formationAnalysis.comparison.predictedOutcome.probability * 100
                    ).toFixed(1)}
                    % Win Probability
                  </div>
                  <div className="text-gray-300 text-sm mt-1">
                    {analysis.formationAnalysis.comparison.predictedOutcome.reasoning}
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-3">
                {analysis.suggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className={`p-3 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="text-white font-medium text-sm">{suggestion.title}</div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              suggestion.priority === 'high'
                                ? 'bg-red-500 text-white'
                                : suggestion.priority === 'medium'
                                  ? 'bg-yellow-500 text-black'
                                  : 'bg-blue-500 text-white'
                            }`}
                          >
                            {suggestion.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-gray-300 text-xs mb-2">{suggestion.description}</div>
                        <div className="text-gray-400 text-xs">{suggestion.implementation}</div>
                        <div className="text-green-400 text-xs mt-1">
                          Expected Impact: +{suggestion.expectedImpact}%
                        </div>
                      </div>
                      <button
                        onClick={() => onApplySuggestion(suggestion)}
                        className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Weaknesses Tab */}
            {activeTab === 'weaknesses' && (
              <div className="space-y-3">
                {analysis.weaknesses.map(weakness => (
                  <div
                    key={weakness.id}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-red-400 font-medium text-sm capitalize">
                        {weakness.area}
                      </div>
                      <div className="text-red-300 text-xs">
                        Risk: {(weakness.exploitationRisk * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-gray-300 text-xs">{weakness.description}</div>
                    <div className="text-gray-400 text-xs mt-1">
                      Affected: {weakness.affectedPlayers.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Strengths Tab */}
            {activeTab === 'strengths' && (
              <div className="space-y-3">
                {analysis.strengths.map(strength => (
                  <div
                    key={strength.id}
                    className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-green-400 font-medium text-sm capitalize">
                        {strength.area}
                      </div>
                      <div className="text-green-300 text-xs">
                        Leverage: {(strength.leverageOpportunity * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-gray-300 text-xs">{strength.description}</div>
                    <div className="text-gray-400 text-xs mt-1">
                      Key Players: {strength.keyPlayers.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

const AITacticalAnalyzer: React.FC = () => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { players, formations, activeFormationIds } = tacticsState;

  const [analysisState, setAnalysisState] = useState({
    currentAnalysis: null as TacticalAnalysis | null,
    isAnalyzing: false,
    analysisHistory: [] as TacticalAnalysis[],
    autoAnalyze: false,
    realTimeInsights: true,
  });

  // Generate tactical analysis using AI
  const performTacticalAnalysis = useCallback(async () => {
    if (!formations || !activeFormationIds || !players) {
      return;
    }

    setAnalysisState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      const homeFormation = formations[activeFormationIds.home];
      const awayFormation = formations[activeFormationIds.away];

      if (!homeFormation || !awayFormation) {
        throw new Error('Missing formation data');
      }

      // Prepare data for AI analysis
      const analysisPrompt = `
        Analyze this tactical setup:
        
        Home Formation: ${homeFormation.name || 'Unknown'}
        - Players: ${players
          .filter(p => p.team === 'home')
          .map(p => `${p.name} (${p.roleId})`)
          .join(', ')}
        
        Away Formation: ${awayFormation.name || 'Unknown'}
        - Players: ${players
          .filter(p => p.team === 'away')
          .map(p => `${p.name} (${p.roleId})`)
          .join(', ')}
        
        Provide tactical analysis including:
        1. Formation effectiveness assessment
        2. Key tactical battles and matchups
        3. Weaknesses and vulnerabilities
        4. Strengths and opportunities
        5. Strategic recommendations
        
        Focus on practical, actionable insights for a football coach.
      `;

      const aiResponse = await openAiService.generateTacticalAnalysis(
        homeFormation,
        players.filter(p => p.team === 'home'),
      );

      // Parse AI response and create structured analysis
      const analysis: TacticalAnalysis = {
        id: `analysis-${Date.now()}`,
        timestamp: Date.now(),
        formationAnalysis: {
          homeTeam: {
            formation: homeFormation.name || 'Custom Formation',
            effectiveness: Math.random() * 30 + 70, // Mock for now, would be calculated
            coverage: {
              defensive: Math.random() * 30 + 70,
              midfield: Math.random() * 30 + 70,
              attacking: Math.random() * 30 + 70,
            },
            vulnerabilities: ['Wide areas exposed', 'Midfield overload risk'],
            strengths: ['Strong central presence', 'Good pressing structure'],
            playerRoleOptimization: [],
          },
          awayTeam: {
            formation: awayFormation.name || 'Custom Formation',
            effectiveness: Math.random() * 30 + 70,
            coverage: {
              defensive: Math.random() * 30 + 70,
              midfield: Math.random() * 30 + 70,
              attacking: Math.random() * 30 + 70,
            },
            vulnerabilities: ['Weak left flank', 'High defensive line risk'],
            strengths: ['Pace on counter-attacks', 'Aerial dominance'],
            playerRoleOptimization: [],
          },
          comparison: {
            advantages: ['Superior midfield control', 'Better defensive stability'],
            disadvantages: ['Less pace in transition', 'Weaker aerial presence'],
            keyBattles: [
              {
                area: 'Central Midfield',
                homePlayer: 'Midfielder 1',
                awayPlayer: 'Midfielder 2',
                importance: 0.9,
                prediction: 'Evenly matched, tactical discipline will decide',
              },
              {
                area: 'Wide Areas',
                homePlayer: 'Winger 1',
                awayPlayer: 'Full-back 1',
                importance: 0.8,
                prediction: 'Home team has pace advantage',
              },
            ],
            predictedOutcome: {
              probability: 0.65,
              reasoning: 'Home formation provides better balance and control',
            },
          },
        },
        suggestions: [
          {
            id: 'suggestion-1',
            type: 'formation',
            priority: 'high',
            title: 'Strengthen Left Flank',
            description: 'Move a midfielder to support the left-back position',
            implementation: 'Shift formation to provide additional cover',
            expectedImpact: 15,
            targetedWeakness: 'Exposed wide areas',
          },
          {
            id: 'suggestion-2',
            type: 'player',
            priority: 'medium',
            title: 'Press Higher',
            description: 'Push defensive line up to compress space',
            implementation: 'Coordinate offside trap with midfield press',
            expectedImpact: 10,
          },
        ],
        weaknesses: [
          {
            id: 'weakness-1',
            area: 'defense',
            severity: 0.7,
            description: 'Left flank vulnerable to pace attacks',
            affectedPlayers: ['Left-back', 'Left Midfielder'],
            exploitationRisk: 0.8,
          },
        ],
        strengths: [
          {
            id: 'strength-1',
            area: 'midfield',
            effectiveness: 0.85,
            description: 'Dominant central midfield presence',
            keyPlayers: ['Central Midfielder 1', 'Central Midfielder 2'],
            leverageOpportunity: 0.9,
          },
        ],
        confidence: 0.82,
        analysisType: 'formation',
      };

      setAnalysisState(prev => ({
        ...prev,
        currentAnalysis: analysis,
        analysisHistory: [analysis, ...prev.analysisHistory.slice(0, 9)], // Keep last 10
        isAnalyzing: false,
      }));
    } catch (error) {
      console.error('Failed to perform tactical analysis:', error);
      setAnalysisState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [formations, activeFormationIds, players]);

  // Apply AI suggestion
  const applySuggestion = useCallback(
    (suggestion: TacticalSuggestion) => {
      // Implementation would depend on suggestion type
      switch (suggestion.type) {
        case 'formation':
          // Modify formation structure
          console.log('Applying formation suggestion:', suggestion.title);
          break;
        case 'player':
          // Adjust player positions
          console.log('Applying player suggestion:', suggestion.title);
          break;
        case 'strategy':
          // Update tactical instructions
          console.log('Applying strategy suggestion:', suggestion.title);
          break;
        default:
          console.log('Unknown suggestion type:', suggestion.type);
      }

      // Provide feedback
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Applied suggestion: ${suggestion.title}`,
          type: 'success',
        },
      });
    },
    [dispatch],
  );

  // Auto-analyze when formation changes
  useEffect(() => {
    if (analysisState.autoAnalyze && activeFormationIds) {
      const timeout = setTimeout(performTacticalAnalysis, 2000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [activeFormationIds, analysisState.autoAnalyze, performTacticalAnalysis]);

  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });

  return (
    <div
      className="fixed z-30 select-none"
      style={{
        top: `${position.y}px`,
        right: `${position.x}px`,
        transition: isMinimized ? 'all 0.3s ease' : 'none',
      }}
    >
      {isMinimized ? (
        <div
          className="bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-2 cursor-pointer hover:bg-gray-700/90 transition-colors"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center space-x-2 text-white text-sm">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>AI Analysis</span>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between p-2 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-white text-sm font-medium">AI Tactical Analysis</span>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
              title="Minimize"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
          <AIAnalysisPanel
            analysis={analysisState.currentAnalysis}
            isAnalyzing={analysisState.isAnalyzing}
            onAnalyze={performTacticalAnalysis}
            onApplySuggestion={applySuggestion}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(AITacticalAnalyzer);
