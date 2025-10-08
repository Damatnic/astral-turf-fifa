/**
 * Tactical Suggestions Panel
 * 
 * Displays AI-powered formation analysis, strengths, weaknesses, and recommendations
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, AlertTriangle, Lightbulb, Target, Shield,
  Zap, Activity, ChevronRight, X, Check
} from 'lucide-react';
import type { FormationAnalysis } from '../../utils/formationAnalyzer';

interface TacticalSuggestionsPanelProps {
  analysis: FormationAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TacticalSuggestionsPanel: React.FC<TacticalSuggestionsPanelProps> = ({
  analysis,
  isOpen,
  onClose
}) => {
  if (!isOpen || !analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed right-0 top-16 bottom-0 w-96 bg-gray-900 border-l border-gray-700 shadow-2xl overflow-y-auto z-40"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-white" />
          <h3 className="font-bold text-white">Tactical Analysis</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Overall Score */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm font-medium">Formation Score</span>
            <span className={`text-2xl font-black ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-full ${getScoreBg(analysis.overallScore)} rounded-full transition-all`}
              style={{ width: `${analysis.overallScore}%` }}
            />
          </div>
        </div>

        {/* Tactical Balance */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h4 className="font-bold text-white mb-3 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Tactical Balance</span>
          </h4>
          <div className="space-y-3">
            <BalanceBar label="Defensive" value={analysis.tacticalBalance.defensive} icon={<Shield className="w-4 h-4" />} />
            <BalanceBar label="Attacking" value={analysis.tacticalBalance.attacking} icon={<Zap className="w-4 h-4" />} />
            <BalanceBar label="Possession" value={analysis.tacticalBalance.possession} icon={<Target className="w-4 h-4" />} />
            <BalanceBar label="Width" value={analysis.tacticalBalance.width} icon={<TrendingUp className="w-4 h-4" />} />
            <BalanceBar label="Compactness" value={analysis.tacticalBalance.compactness} icon={<Activity className="w-4 h-4" />} />
          </div>
        </div>

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h4 className="font-bold text-white mb-3 flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Strengths</span>
            </h4>
            <div className="space-y-2">
              {analysis.strengths.map((strength, idx) => (
                <div key={idx} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-green-400 text-sm">{strength.aspect}</span>
                    <span className="text-xs text-gray-400">{strength.score.toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-gray-400">{strength.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {analysis.weaknesses.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h4 className="font-bold text-white mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Weaknesses</span>
            </h4>
            <div className="space-y-2">
              {analysis.weaknesses.map((weakness, idx) => (
                <div key={idx} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-red-400 text-sm">{weakness.aspect}</span>
                    <span className="text-xs text-gray-400">Risk: {weakness.severity.toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{weakness.description}</p>
                  <p className="text-xs text-blue-300">💡 {weakness.solution}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h4 className="font-bold text-white mb-3 flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span>Recommendations</span>
            </h4>
            <div className="space-y-2">
              {analysis.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 border ${
                    rec.priority === 'critical'
                      ? 'bg-red-900/20 border-red-700'
                      : rec.priority === 'high'
                      ? 'bg-orange-900/20 border-orange-700'
                      : 'bg-blue-900/20 border-blue-700'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-white text-sm mb-1">{rec.title}</h5>
                      <p className="text-xs text-gray-400">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Balance Bar Component
const BalanceBar: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => {
  const getColor = (val: number) => {
    if (val >= 70) return 'from-green-500 to-emerald-500';
    if (val >= 50) return 'from-yellow-500 to-amber-500';
    return 'from-red-500 to-orange-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">{icon}</span>
          <span className="text-gray-300 text-sm">{label}</span>
        </div>
        <span className="text-white font-bold text-sm">{value.toFixed(0)}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div
          className={`h-full bg-gradient-to-r ${getColor(value)} rounded-full transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default TacticalSuggestionsPanel;

