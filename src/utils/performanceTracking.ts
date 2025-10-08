/**
 * Performance Metrics Tracking
 * 
 * Track and analyze player and team performance over time
 */

import type { Player } from '../types';

export interface PerformanceMetrics {
  playerId: string;
  metrics: {
    matches: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
    averageRating: number;
  };
  trends: {
    form: 'excellent' | 'good' | 'average' | 'poor';
    goalsPerMatch: number;
    assistsPerMatch: number;
    minutesPerGoal: number;
  };
  recentPerformances: MatchPerformance[];
}

export interface MatchPerformance {
  matchId: string;
  date: string;
  opponent: string;
  result: 'win' | 'draw' | 'loss';
  rating: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
}

export interface TeamPerformanceMetrics {
  overallRating: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  cleanSheets: number;
  formationEffectiveness: FormationEffectiveness[];
  topPerformers: PlayerPerformanceSummary[];
}

export interface FormationEffectiveness {
  formationId: string;
  formationName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  effectiveness: number; // 0-100
}

export interface PlayerPerformanceSummary {
  playerId: string;
  playerName: string;
  matches: number;
  goals: number;
  assists: number;
  averageRating: number;
  form: 'excellent' | 'good' | 'average' | 'poor';
}

/**
 * Calculate player performance metrics
 */
export function calculatePlayerPerformance(
  player: Player,
  matchHistory: MatchPerformance[] = []
): PerformanceMetrics {
  const metrics = {
    matches: matchHistory.length,
    goals: matchHistory.reduce((sum, m) => sum + m.goals, 0),
    assists: matchHistory.reduce((sum, m) => sum + m.assists, 0),
    cleanSheets: 0, // Would come from match data
    yellowCards: 0,
    redCards: 0,
    minutesPlayed: matchHistory.reduce((sum, m) => sum + m.minutesPlayed, 0),
    averageRating: matchHistory.length > 0
      ? matchHistory.reduce((sum, m) => sum + m.rating, 0) / matchHistory.length
      : 0,
  };

  const trends = {
    form: determineForm(matchHistory.slice(-5)),
    goalsPerMatch: metrics.matches > 0 ? metrics.goals / metrics.matches : 0,
    assistsPerMatch: metrics.matches > 0 ? metrics.assists / metrics.matches : 0,
    minutesPerGoal: metrics.goals > 0 ? metrics.minutesPlayed / metrics.goals : 0,
  };

  return {
    playerId: player.id,
    metrics,
    trends,
    recentPerformances: matchHistory.slice(-10),
  };
}

/**
 * Determine player form based on recent performances
 */
function determineForm(recentMatches: MatchPerformance[]): 'excellent' | 'good' | 'average' | 'poor' {
  if (recentMatches.length === 0) return 'average';

  const avgRating = recentMatches.reduce((sum, m) => sum + m.rating, 0) / recentMatches.length;

  if (avgRating >= 8) return 'excellent';
  if (avgRating >= 7) return 'good';
  if (avgRating >= 6) return 'average';
  return 'poor';
}

/**
 * Calculate team performance metrics
 */
export function calculateTeamPerformance(
  players: Player[],
  matchHistory: any[] = []
): TeamPerformanceMetrics {
  const avgOverall = players.length > 0
    ? players.reduce((sum, p) => sum + p.overall, 0) / players.length
    : 0;

  // Mock data - would come from actual match records
  return {
    overallRating: avgOverall,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsScored: 0,
    goalsConceded: 0,
    cleanSheets: 0,
    formationEffectiveness: [],
    topPerformers: players.slice(0, 5).map(p => ({
      playerId: p.id,
      playerName: p.name,
      matches: 0,
      goals: 0,
      assists: 0,
      averageRating: p.overall / 10,
      form: 'average' as const,
    })),
  };
}

/**
 * Generate performance insights
 */
export function generatePerformanceInsights(
  metrics: PerformanceMetrics
): string[] {
  const insights: string[] = [];

  if (metrics.trends.form === 'excellent') {
    insights.push('🔥 In excellent form! Performance is outstanding.');
  } else if (metrics.trends.form === 'poor') {
    insights.push('⚠️ Form is concerning. Consider rest or tactical changes.');
  }

  if (metrics.trends.goalsPerMatch > 1) {
    insights.push('⚽ Exceptional goal-scoring rate!');
  }

  if (metrics.trends.assistsPerMatch > 0.5) {
    insights.push('🎯 Great creative contribution with assists.');
  }

  if (metrics.metrics.averageRating >= 8) {
    insights.push('⭐ Consistently high match ratings.');
  }

  return insights.slice(0, 3);
}

