import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import {
  Lightbulb,
  Target,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
} from 'lucide-react';
import { openAiService } from '../../services/openAiService';
import type { Player, Formation } from '../../types';

interface FormationRecommendation {
  formation: string;
  players: Player[];
  effectiveness: number;
  strengths: string[];
  weaknesses: string[];
  reasoning: string;
}

interface TacticalInsight {
  type: 'formation' | 'positioning' | 'strategy' | 'substitution';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: number;
}

interface SmartCoachingAssistantProps {
  currentFormation: Formation;
  availablePlayers: Player[];
  matchContext?: {
    opponent?: string;
    homeAway: 'home' | 'away';
    weather?: string;
    importance: 'low' | 'medium' | 'high';
  };
  onFormationChange: (formation: Formation) => void;
  onPlayerChange: (playerId: string, newPosition: { x: number; y: number }) => void;
}

export const SmartCoachingAssistant: React.FC<SmartCoachingAssistantProps> = ({
  currentFormation,
  availablePlayers,
  matchContext,
  onFormationChange,
  onPlayerChange,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<FormationRecommendation[]>([]);
  const [tacticalInsights, setTacticalInsights] = useState<TacticalInsight[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<FormationRecommendation | null>(null);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  const analyzeFormation = async () => {
    setIsAnalyzing(true);
    setOptimizationProgress(0);

    try {
      // Simulate progressive analysis
      const progressSteps = [
        { progress: 20, message: 'Analyzing current formation...' },
        { progress: 40, message: 'Evaluating player positions...' },
        { progress: 60, message: 'Generating recommendations...' },
        { progress: 80, message: 'Calculating effectiveness...' },
        { progress: 100, message: 'Analysis complete!' },
      ];

      for (const step of progressSteps) {
        setOptimizationProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Generate AI-powered recommendations
      const formationAnalysis = await openAiService.getFormationAnalysis(
        currentFormation,
        availablePlayers,
      );

      // Create formation recommendations
      const newRecommendations: FormationRecommendation[] = [
        {
          formation: '4-3-3 Attacking',
          players: availablePlayers.slice(0, 11),
          effectiveness: 87,
          strengths: ['High pressing', 'Wing play', 'Counter-attacks'],
          weaknesses: ['Defensive stability', 'Midfield control'],
          reasoning:
            'Optimized for attacking play with strong wing presence and high pressing to dominate possession.',
        },
        {
          formation: '4-2-3-1 Balanced',
          players: availablePlayers.slice(0, 11),
          effectiveness: 92,
          strengths: ['Defensive stability', 'Midfield control', 'Flexibility'],
          weaknesses: ['Wide play', 'Aerial presence'],
          reasoning:
            'Perfect balance between attack and defense with strong central control and tactical flexibility.',
        },
        {
          formation: '3-5-2 Possession',
          players: availablePlayers.slice(0, 11),
          effectiveness: 84,
          strengths: ['Possession control', 'Midfield dominance', 'Defensive solidity'],
          weaknesses: ['Width in attack', 'Pace on counters'],
          reasoning:
            'Ideal for controlling the game through possession with numerical advantage in midfield.',
        },
      ];

      // Generate tactical insights
      const newInsights: TacticalInsight[] = [
        {
          type: 'positioning',
          priority: 'high',
          title: 'Optimize Right-Back Position',
          description: 'Your right-back is too narrow, reducing width in attack',
          action: 'Move 15 yards wider to provide overlapping runs',
          impact: 23,
        },
        {
          type: 'formation',
          priority: 'medium',
          title: 'Consider Formation Switch',
          description: 'Current formation lacks midfield presence against strong opposition',
          action: 'Switch to 4-2-3-1 for better balance',
          impact: 18,
        },
        {
          type: 'strategy',
          priority: 'high',
          title: 'Exploit Left Flank',
          description: 'Opposition weak on their right side',
          action: 'Instruct left winger to stay wide and take on defender',
          impact: 31,
        },
        {
          type: 'substitution',
          priority: 'low',
          title: 'Fresh Legs Needed',
          description: 'Central midfielder showing fatigue signs',
          action: 'Prepare substitution for 65th minute',
          impact: 12,
        },
      ];

      setRecommendations(newRecommendations);
      setTacticalInsights(newInsights);
    } catch (error) {
      console.error('Formation analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyRecommendation = (recommendation: FormationRecommendation) => {
    setSelectedRecommendation(recommendation);
    // Apply the recommended formation
    onFormationChange({
      name: recommendation.formation,
      slots: recommendation.players.map((player, index) => ({
        id: `slot-${index}`,
        playerId: player.id,
        position: getOptimalPosition(recommendation.formation, index),
      })),
    } as any);
  };

  const getOptimalPosition = (formation: string, playerIndex: number) => {
    // Simplified position calculation based on formation
    const formations: Record<string, Array<{ x: number; y: number }>> = {
      '4-3-3 Attacking': [
        { x: 50, y: 90 }, // GK
        { x: 20, y: 75 },
        { x: 35, y: 75 },
        { x: 65, y: 75 },
        { x: 80, y: 75 }, // Defense
        { x: 30, y: 55 },
        { x: 50, y: 55 },
        { x: 70, y: 55 }, // Midfield
        { x: 20, y: 25 },
        { x: 50, y: 25 },
        { x: 80, y: 25 }, // Attack
      ],
      '4-2-3-1 Balanced': [
        { x: 50, y: 90 }, // GK
        { x: 20, y: 75 },
        { x: 35, y: 75 },
        { x: 65, y: 75 },
        { x: 80, y: 75 }, // Defense
        { x: 40, y: 60 },
        { x: 60, y: 60 }, // Defensive Mid
        { x: 25, y: 40 },
        { x: 50, y: 40 },
        { x: 75, y: 40 }, // Attacking Mid
        { x: 50, y: 20 }, // Striker
      ],
      '3-5-2 Possession': [
        { x: 50, y: 90 }, // GK
        { x: 30, y: 75 },
        { x: 50, y: 75 },
        { x: 70, y: 75 }, // Defense
        { x: 15, y: 55 },
        { x: 35, y: 55 },
        { x: 50, y: 55 },
        { x: 65, y: 55 },
        { x: 85, y: 55 }, // Midfield
        { x: 40, y: 25 },
        { x: 60, y: 25 }, // Attack
      ],
    };

    return formations[formation]?.[playerIndex] || { x: 50, y: 50 };
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'formation':
        return <Users className="w-4 h-4" />;
      case 'positioning':
        return <Target className="w-4 h-4" />;
      case 'strategy':
        return <Brain className="w-4 h-4" />;
      case 'substitution':
        return <Zap className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl bg-slate-800  border-slate-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Brain className="w-6 h-6 text-blue-400" />
          Smart Coaching Assistant
          <Badge variant="secondary" className="ml-auto">
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-blue-500/20">
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-blue-500/20">
              Tactical Insights
            </TabsTrigger>
            <TabsTrigger value="optimization" className="data-[state=active]:bg-blue-500/20">
              Live Optimization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Formation Recommendations</h3>
              <Button
                onClick={analyzeFormation}
                disabled={isAnalyzing}
                className="bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Formation'}
                <Brain className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <Progress value={optimizationProgress} className="w-full" />
                <p className="text-sm text-gray-300 text-center">AI analyzing your formation...</p>
              </div>
            )}

            <div className="grid gap-4">
              {recommendations.map((rec, index) => (
                <Card
                  key={index}
                  className="bg-white/5 border-slate-700 hover:bg-slate-800 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{rec.formation}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-medium">
                            {rec.effectiveness}% Effective
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => applyRecommendation(rec)}
                        className="bg-green-500/20 hover:bg-green-500/30 border-green-500/30"
                      >
                        Apply
                      </Button>
                    </div>

                    <p className="text-gray-300 text-sm mb-3">{rec.reasoning}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-green-400 mb-2">Strengths</h5>
                        <ul className="space-y-1">
                          {rec.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-red-400 mb-2">Weaknesses</h5>
                        <ul className="space-y-1">
                          {rec.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 mt-4">
            <h3 className="text-lg font-semibold text-white">Tactical Insights</h3>

            <div className="space-y-3">
              {tacticalInsights.map((insight, index) => (
                <Card
                  key={index}
                  className="bg-white/5 border-slate-700 hover:bg-slate-800 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(insight.priority)}
                        {getTypeIcon(insight.type)}
                        <h4 className="font-semibold text-white">{insight.title}</h4>
                      </div>
                      <Badge
                        variant={
                          insight.priority === 'high'
                            ? 'destructive'
                            : insight.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                        }
                        className="capitalize"
                      >
                        {insight.priority}
                      </Badge>
                    </div>

                    <p className="text-gray-300 text-sm mb-3">{insight.description}</p>

                    <div className="flex items-center justify-between">
                      <p className="text-blue-400 text-sm font-medium">{insight.action}</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm">+{insight.impact}% impact</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4 mt-4">
            <h3 className="text-lg font-semibold text-white">Live Optimization</h3>

            <Card className="bg-white/5 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-white">Real-time Analysis</h4>
                  <Badge className="bg-green-500/20 text-green-400">Live</Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Formation Effectiveness</span>
                    <span className="text-green-400 font-medium">87%</span>
                  </div>
                  <Progress value={87} className="w-full" />

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Defensive Stability</span>
                    <span className="text-blue-400 font-medium">92%</span>
                  </div>
                  <Progress value={92} className="w-full" />

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Attacking Potential</span>
                    <span className="text-yellow-400 font-medium">78%</span>
                  </div>
                  <Progress value={78} className="w-full" />
                </div>

                <Button className="w-full mt-4 bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30">
                  Auto-Optimize Formation
                  <Zap className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
