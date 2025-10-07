import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  aiCoachingService,
  type CoachingRecommendation,
} from '../../../services/aiCoachingService';
import type { Formation, Player } from '../../../types';

interface TacticalSuggestionsOverlayProps {
  formation: Formation;
  players: Player[];
  visible: boolean;
  onClose: () => void;
  onApplySuggestion?: (suggestion: CoachingRecommendation) => void;
  gameContext?: {
    gamePhase?: 'early' | 'mid' | 'late' | 'extra-time';
    score?: { home: number; away: number };
    gameState?: 'winning' | 'losing' | 'drawing' | 'pressure' | 'counter-attack';
    opposition?: Formation;
  };
}

const TacticalSuggestionsOverlay: React.FC<TacticalSuggestionsOverlayProps> = ({
  formation,
  players,
  visible,
  onClose,
  onApplySuggestion,
  gameContext,
}) => {
  const [suggestions, setSuggestions] = useState<CoachingRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CoachingRecommendation | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load suggestions when overlay becomes visible
  useEffect(() => {
    if (visible && formation && players.length > 0) {
      loadSuggestions();
    }
  }, [visible, formation, players, gameContext]);

  // Auto-refresh suggestions every 30 seconds if enabled
  useEffect(() => {
    if (!visible || !autoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      loadSuggestions();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [visible, autoRefresh, formation, players, gameContext]);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        formation,
        players,
        gameContext,
      );

      // Filter out dismissed suggestions
      const filteredRecommendations = recommendations.filter(
        rec => !dismissedSuggestions.has(rec.id),
      );

      setSuggestions(filteredRecommendations);
    } catch (error) {
      console.error('Failed to load tactical suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [formation, players, gameContext, dismissedSuggestions]);

  const handleApplySuggestion = (suggestion: CoachingRecommendation) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
    aiCoachingService.storeRecommendation(suggestion);
    handleDismissSuggestion(suggestion.id);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(suggestionId));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    if (selectedSuggestion?.id === suggestionId) {
      setSelectedSuggestion(null);
    }
  };

  const getPriorityColor = (priority: CoachingRecommendation['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getImpactIcon = (impact: CoachingRecommendation['impact']) => {
    switch (impact) {
      case 'game-changing':
        return '⚡';
      case 'significant':
        return '🎯';
      case 'moderate':
        return '📊';
      case 'minor':
        return '💡';
      default:
        return '📌';
    }
  };

  const getTypeIcon = (type: CoachingRecommendation['type']) => {
    switch (type) {
      case 'formation':
        return '🔷';
      case 'player':
        return '👤';
      case 'tactical':
        return '⚙️';
      case 'strategy':
        return '🎲';
      case 'substitution':
        return '🔄';
      default:
        return '📋';
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
          onClick={e => {
            e.stopPropagation();
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">🤖</span>
                  AI Tactical Assistant
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {suggestions.length} recommendations • Formation: {formation.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Auto-refresh toggle */}
                <button
                  onClick={() => {
                    setAutoRefresh(!autoRefresh);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    autoRefresh
                      ? 'bg-green-500/20 text-green-300 border border-green-500'
                      : 'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}
                >
                  {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
                </button>

                {/* Refresh button */}
                <button
                  onClick={loadSuggestions}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {loading ? '⏳ Loading...' : '🔄 Refresh'}
                </button>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all"
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            {loading && suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="text-6xl mb-4"
                >
                  ⚙️
                </motion.div>
                <p className="text-slate-400 text-lg">
                  Analyzing formation and generating suggestions...
                </p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-slate-300 text-xl font-semibold mb-2">Formation looks great!</p>
                <p className="text-slate-400">No critical recommendations at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-slate-800/50 rounded-xl p-5 border-l-4 ${
                      selectedSuggestion?.id === suggestion.id
                        ? 'border-blue-500 ring-2 ring-blue-500/50'
                        : 'border-slate-700'
                    } hover:bg-slate-700/50 transition-all cursor-pointer`}
                    onClick={() => {
                      setSelectedSuggestion(suggestion);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon & Priority Badge */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-3xl">{getTypeIcon(suggestion.type)}</div>
                        <div
                          className={`${getPriorityColor(suggestion.priority)} text-white text-xs font-bold px-2 py-1 rounded-full uppercase`}
                        >
                          {suggestion.priority}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            {suggestion.title}
                            <span className="text-xl">{getImpactIcon(suggestion.impact)}</span>
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Confidence meter */}
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${suggestion.confidence}%` }}
                                  transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                                  className={`h-full ${
                                    suggestion.confidence >= 80
                                      ? 'bg-green-500'
                                      : suggestion.confidence >= 60
                                        ? 'bg-yellow-500'
                                        : 'bg-orange-500'
                                  }`}
                                />
                              </div>
                              <span className="text-xs text-slate-400 font-medium">
                                {suggestion.confidence}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-slate-300 text-sm mb-3">{suggestion.description}</p>

                        {/* Reasoning (shown when selected) */}
                        <AnimatePresence>
                          {selectedSuggestion?.id === suggestion.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mb-3 overflow-hidden"
                            >
                              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                                <p className="text-xs font-semibold text-blue-400 mb-1">
                                  💡 REASONING
                                </p>
                                <p className="text-slate-300 text-sm">{suggestion.reasoning}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleApplySuggestion(suggestion);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-green-500/50"
                          >
                            ✓ Apply
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDismissSuggestion(suggestion.id);
                            }}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-all"
                          >
                            ✕ Dismiss
                          </button>
                          <div className="flex-1" />
                          <span className="text-xs text-slate-500 uppercase font-semibold">
                            {suggestion.impact} impact
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          {suggestions.length > 0 && (
            <div className="bg-slate-800/50 p-4 border-t border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-slate-400">
                      {suggestions.filter(s => s.priority === 'critical').length} Critical
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-slate-400">
                      {suggestions.filter(s => s.priority === 'high').length} High
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-slate-400">
                      {suggestions.filter(s => s.priority === 'medium').length} Medium
                    </span>
                  </div>
                </div>
                <div className="text-slate-400">
                  Avg. Confidence:{' '}
                  <span className="text-white font-semibold">
                    {Math.round(
                      suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length,
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TacticalSuggestionsOverlay;
