import { useState, useCallback, useEffect } from 'react';
import { aiCoachingService, type CoachingRecommendation } from '../services/aiCoachingService';
import type { Formation, Player } from '../types';

interface UseTacticalSuggestionsOptions {
  formation: Formation;
  players: Player[];
  gameContext?: {
    gamePhase?: 'early' | 'mid' | 'late' | 'extra-time';
    score?: { home: number; away: number };
    gameState?: 'winning' | 'losing' | 'drawing' | 'pressure' | 'counter-attack';
    opposition?: Formation;
  };
  autoRefreshInterval?: number; // in milliseconds, default 30000 (30 seconds)
  enabled?: boolean;
}

interface UseTacticalSuggestionsReturn {
  suggestions: CoachingRecommendation[];
  loading: boolean;
  error: Error | null;
  refreshSuggestions: () => Promise<void>;
  applySuggestion: (suggestion: CoachingRecommendation) => void;
  dismissSuggestion: (suggestionId: string) => void;
  dismissedSuggestions: Set<string>;
  clearDismissed: () => void;
  criticalCount: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  averageConfidence: number;
}

/**
 * React hook for managing AI tactical suggestions
 *
 * @example
 * ```tsx
 * const {
 *   suggestions,
 *   loading,
 *   refreshSuggestions,
 *   applySuggestion,
 *   dismissSuggestion
 * } = useTacticalSuggestions({
 *   formation: currentFormation,
 *   players: currentPlayers,
 *   gameContext: { gamePhase: 'late', score: { home: 1, away: 2 } }
 * });
 * ```
 */
export function useTacticalSuggestions(
  options: UseTacticalSuggestionsOptions,
): UseTacticalSuggestionsReturn {
  const { formation, players, gameContext, autoRefreshInterval = 30000, enabled = true } = options;

  const [suggestions, setSuggestions] = useState<CoachingRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const refreshSuggestions = useCallback(async () => {
    if (!enabled || !formation || players.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

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
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load tactical suggestions');
      setError(error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, formation, players, gameContext, dismissedSuggestions]);

  const applySuggestion = useCallback((suggestion: CoachingRecommendation) => {
    // Store in coaching history
    aiCoachingService.storeRecommendation(suggestion);

    // Remove from current suggestions
    setDismissedSuggestions(prev => new Set(prev).add(suggestion.id));
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, []);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(suggestionId));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const clearDismissed = useCallback(() => {
    setDismissedSuggestions(new Set());
  }, []);

  // Load suggestions when dependencies change
  useEffect(() => {
    if (enabled && formation && players.length > 0) {
      refreshSuggestions();
    }
  }, [enabled, formation, players, gameContext, refreshSuggestions]);

  // Auto-refresh suggestions
  useEffect(() => {
    if (!enabled || !autoRefreshInterval) {
      return;
    }

    const interval = setInterval(() => {
      refreshSuggestions();
    }, autoRefreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, autoRefreshInterval, refreshSuggestions]);

  // Calculate statistics
  const criticalCount = suggestions.filter(s => s.priority === 'critical').length;
  const highPriorityCount = suggestions.filter(s => s.priority === 'high').length;
  const mediumPriorityCount = suggestions.filter(s => s.priority === 'medium').length;

  const averageConfidence =
    suggestions.length > 0
      ? Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length)
      : 0;

  return {
    suggestions,
    loading,
    error,
    refreshSuggestions,
    applySuggestion,
    dismissSuggestion,
    dismissedSuggestions,
    clearDismissed,
    criticalCount,
    highPriorityCount,
    mediumPriorityCount,
    averageConfidence,
  };
}
