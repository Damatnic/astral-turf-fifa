import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CoachingRecommendation } from '../../../services/aiCoachingService';

interface AIAssistantWidgetProps {
  suggestions: CoachingRecommendation[];
  loading?: boolean;
  onOpenFullView: () => void;
  onQuickApply?: (suggestion: CoachingRecommendation) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  suggestions,
  loading = false,
  onOpenFullView,
  onQuickApply,
  position = 'top-right',
  minimized = false,
  onToggleMinimize,
}) => {
  const topSuggestion = suggestions[0];
  const criticalCount = suggestions.filter(s => s.priority === 'critical').length;
  const highCount = suggestions.filter(s => s.priority === 'high').length;

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`absolute ${getPositionClasses()} z-40`}
    >
      {minimized ? (
        // Minimized badge
        <motion.button
          onClick={onToggleMinimize}
          className="relative bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-110"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-2xl">🤖</span>
          {(criticalCount > 0 || highCount > 0) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-slate-900"
            >
              {criticalCount + highCount}
            </motion.div>
          )}
        </motion.button>
      ) : (
        // Expanded widget
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden w-80"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="text-white font-bold text-sm">AI Assistant</h3>
                <p className="text-blue-100 text-xs">{suggestions.length} suggestions</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onToggleMinimize && (
                <button
                  onClick={onToggleMinimize}
                  className="w-7 h-7 rounded-lg bg-slate-700/50 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
                  title="Minimize"
                >
                  <span className="text-xs">−</span>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-3">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="text-3xl"
                >
                  ⚙️
                </motion.div>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-slate-400 text-sm text-center">All good!</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={topSuggestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  {/* Top suggestion */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-start gap-2 mb-2">
                      <div
                        className={`${getPriorityColor(topSuggestion.priority)} text-white text-xs font-bold px-2 py-1 rounded uppercase shrink-0`}
                      >
                        {topSuggestion.priority}
                      </div>
                      <h4 className="text-white text-sm font-semibold flex-1">
                        {topSuggestion.title}
                      </h4>
                    </div>
                    <p className="text-slate-300 text-xs mb-2 line-clamp-2">
                      {topSuggestion.description}
                    </p>

                    {/* Confidence bar */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${topSuggestion.confidence}%` }}
                          className={`h-full ${
                            topSuggestion.confidence >= 80
                              ? 'bg-green-500'
                              : topSuggestion.confidence >= 60
                                ? 'bg-yellow-500'
                                : 'bg-orange-500'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{topSuggestion.confidence}%</span>
                    </div>

                    {/* Quick action button */}
                    {onQuickApply && (
                      <button
                        onClick={() => {
                          onQuickApply(topSuggestion);
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg py-2 text-xs font-medium transition-all shadow-lg"
                      >
                        ✓ Quick Apply
                      </button>
                    )}
                  </div>

                  {/* Summary stats */}
                  {suggestions.length > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      {criticalCount > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-slate-400">{criticalCount} critical</span>
                        </div>
                      )}
                      {highCount > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-slate-400">{highCount} high</span>
                        </div>
                      )}
                      {suggestions.length > 1 && <div className="flex-1" />}
                      <span className="text-slate-500">+{suggestions.length - 1} more</span>
                    </div>
                  )}

                  {/* View all button */}
                  <button
                    onClick={onOpenFullView}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-xs font-medium transition-all"
                  >
                    📋 View All Suggestions
                  </button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIAssistantWidget;
