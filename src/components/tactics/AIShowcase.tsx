/**
 * AI Football Intelligence Showcase Component
 * Demonstrates the AI capabilities integrated into the tactical board
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  Eye,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BarChart3,
  Play,
  Lightbulb
} from 'lucide-react';

interface AIShowcaseProps {
  className?: string;
}

const AIShowcase: React.FC<AIShowcaseProps> = ({ className }) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const aiFeatures = [
    {
      id: 'formation-analysis',
      title: 'Intelligent Formation Analysis',
      icon: Users,
      description: 'AI analyzes your formation strength, identifies weaknesses, and suggests improvements',
      capabilities: [
        'Real-time formation effectiveness scoring',
        'Defensive and attacking strength analysis',
        'Player compatibility matrix calculation',
        'Automated weakness detection',
        'Strategic recommendations based on AI insights'
      ],
      color: 'blue',
      demoData: {
        overallRating: 85,
        defensiveStrength: 78,
        attackingStrength: 91,
        chemistryScore: 83
      }
    },
    {
      id: 'smart-assignment',
      title: 'Smart Auto-Assignment',
      icon: Zap,
      description: 'Neural network-powered player positioning optimization for maximum team effectiveness',
      capabilities: [
        'ML-based optimal player positioning',
        'Dynamic formation optimization',
        'Player-role compatibility scoring',
        'Injury risk assessment',
        'Performance prediction integration'
      ],
      color: 'purple',
      demoData: {
        optimizationScore: 92,
        assignmentsImproved: 7,
        compatibilityIncrease: '+15%'
      }
    },
    {
      id: 'tactical-intelligence',
      title: 'Tactical Pattern Recognition',
      icon: Target,
      description: 'Advanced pattern recognition identifies tactical opportunities and vulnerabilities',
      capabilities: [
        'Automatic tactical pattern detection',
        'Formation style identification',
        'Weakness and opportunity analysis',
        'Counter-strategy generation',
        'Opposition analysis and preparation'
      ],
      color: 'green',
      demoData: {
        patternsDetected: 5,
        weaknessesFound: 3,
        tacticalInsights: 8
      }
    },
    {
      id: 'predictive-analytics',
      title: 'Predictive Match Analytics',
      icon: TrendingUp,
      description: 'Monte Carlo simulation and ML models predict match outcomes and player performance',
      capabilities: [
        'Match outcome probability calculation',
        'Individual player performance prediction',
        'Team chemistry impact analysis',
        'Injury risk assessment',
        'Formation effectiveness forecasting'
      ],
      color: 'orange',
      demoData: {
        winProbability: 67,
        expectedGoals: 2.3,
        confidenceLevel: 84
      }
    },
    {
      id: 'drawing-intelligence',
      title: 'AI Drawing Assistant',
      icon: Eye,
      description: 'Smart tactical drawing suggestions and automatic pattern recognition',
      capabilities: [
        'Intelligent drawing suggestions',
        'Automatic tactical annotation',
        'Movement pattern analysis',
        'Drawing validation and improvement',
        'Smart tactical notation generation'
      ],
      color: 'indigo',
      demoData: {
        suggestionsGenerated: 12,
        patternsRecognized: 4,
        annotationsCreated: 8
      }
    }
  ];

  // Auto-cycle through features
  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setActiveFeature(prev => (prev + 1) % aiFeatures.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, aiFeatures.length]);

  const currentFeature = aiFeatures[activeFeature];

  return (
    <div className={`bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-xl p-6 text-white ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <Sparkles className="w-6 h-6 text-yellow-400 mr-2" />
          <h2 className="text-2xl font-bold">AI Football Intelligence</h2>
          <Sparkles className="w-6 h-6 text-yellow-400 ml-2" />
        </div>
        <p className="text-gray-300">
          Cutting-edge machine learning transforms your tactical analysis
        </p>
      </div>

      {/* Feature Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-1 bg-black/20 rounded-lg p-1">
          {aiFeatures.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => {
                setActiveFeature(index);
                setIsAutoPlaying(false);
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                index === activeFeature
                  ? `bg-${feature.color}-500 text-white shadow-lg`
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <feature.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{feature.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Feature Display */}
      <motion.div
        key={activeFeature}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Feature Header */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-${currentFeature.color}-500 rounded-full mb-4`}>
            <currentFeature.icon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">{currentFeature.title}</h3>
          <p className="text-gray-300 max-w-2xl mx-auto">
            {currentFeature.description}
          </p>
        </div>

        {/* Demo Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(currentFeature.demoData).map(([key, value]) => (
            <div
              key={key}
              className="bg-black/30 rounded-lg p-4 text-center backdrop-blur-sm"
            >
              <div className="text-2xl font-bold text-white mb-1">
                {typeof value === 'number' ? (
                  key.includes('Probability') || key.includes('Strength') || key.includes('Rating') || key.includes('Score') ? 
                    `${value}%` : value
                ) : value}
              </div>
              <div className="text-xs text-gray-400 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>

        {/* Capabilities List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentFeature.capabilities.map((capability, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3"
            >
              <CheckCircle className={`w-5 h-5 text-${currentFeature.color}-400 mt-0.5 flex-shrink-0`} />
              <span className="text-sm text-gray-300">{capability}</span>
            </motion.div>
          ))}
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            className={`inline-flex items-center space-x-2 bg-${currentFeature.color}-500 hover:bg-${currentFeature.color}-600 text-white px-6 py-3 rounded-lg font-medium transition-colors`}
          >
            <Brain className="w-5 h-5" />
            <span>Experience AI Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Progress Indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {aiFeatures.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeFeature ? 'bg-white w-6' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* AI Benefits Summary */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">10x</div>
            <div className="text-xs text-gray-400">Faster Analysis</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">95%</div>
            <div className="text-xs text-gray-400">Accuracy Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">∞</div>
            <div className="text-xs text-gray-400">Tactical Insights</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">AI</div>
            <div className="text-xs text-gray-400">Powered</div>
          </div>
        </div>
      </div>

      {/* Auto-play Toggle */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${
            isAutoPlaying 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {isAutoPlaying ? '⏸️ Pause Tour' : '▶️ Resume Tour'}
        </button>
      </div>
    </div>
  );
};

export default AIShowcase;