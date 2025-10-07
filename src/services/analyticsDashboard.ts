/**
 * Analytics Dashboard Service
 * Comprehensive analytics for performance metrics, user behavior, and tactical insights
 */

import { sessionRecorder, SessionSummary } from './sessionRecorder';
import { heatmapAnalytics, HeatmapData } from './heatmapAnalytics';

export interface PerformanceMetrics {
  actionsPerMinute: number;
  formationChanges: number;
  tacticUpdates: number;
  aiSuggestionsUsed: number;
  avgResponseTime: number;
  errorRate: number;
  sessionDuration: number;
}

export interface UserBehaviorMetrics {
  mostUsedFeatures: Array<{ feature: string; count: number; percentage: number }>;
  sessionDuration: number;
  totalSessions: number;
  avgSessionDuration: number;
  peakUsageTime: string;
  userEngagement: number;
  completionRate: number;
}

export interface TacticalInsights {
  favoriteFormations: Array<{ formation: string; usage: number; winRate: number }>;
  commonTactics: Array<{ tactic: string; frequency: number }>;
  playerUtilization: Array<{ playerId: string; usage: number; performance: number }>;
  aiAcceptanceRate: number;
  collaborationScore: number;
}

export interface AnalyticsDashboardData {
  performance: PerformanceMetrics;
  userBehavior: UserBehaviorMetrics;
  tactical: TacticalInsights;
  session: SessionSummary;
  heatmap: HeatmapData;
  generatedAt: number;
}

export interface AnalyticsExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeCharts: boolean;
  includeSessions: boolean;
  includeHeatmaps: boolean;
  dateRange?: { start: number; end: number };
}

class AnalyticsDashboard {
  private static instance: AnalyticsDashboard;
  private sessionHistory: SessionSummary[] = [];
  private performanceCache: Map<string, PerformanceMetrics> = new Map();

  private constructor() {
    // Initialize
  }

  public static getInstance(): AnalyticsDashboard {
    if (!AnalyticsDashboard.instance) {
      AnalyticsDashboard.instance = new AnalyticsDashboard();
    }
    return AnalyticsDashboard.instance;
  }

  /**
   * Calculate performance metrics from session data
   */
  public calculatePerformanceMetrics(summary: SessionSummary): PerformanceMetrics {
    const durationMinutes = summary.duration / 60000;

    const actionsPerMinute =
      durationMinutes > 0
        ? (summary.tacticalChanges + summary.formationChanges + summary.aiInteractions) /
          durationMinutes
        : 0;

    const errorRate =
      summary.totalEvents > 0
        ? (summary.performanceMetrics.errorsCount / summary.totalEvents) * 100
        : 0;

    return {
      actionsPerMinute: Math.round(actionsPerMinute * 100) / 100,
      formationChanges: summary.formationChanges,
      tacticUpdates: summary.tacticalChanges,
      aiSuggestionsUsed: summary.aiInteractions,
      avgResponseTime: Math.round(summary.performanceMetrics.avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      sessionDuration: summary.duration,
    };
  }

  /**
   * Analyze user behavior patterns
   */
  public analyzeUserBehavior(sessions: SessionSummary[]): UserBehaviorMetrics {
    if (sessions.length === 0) {
      return {
        mostUsedFeatures: [],
        sessionDuration: 0,
        totalSessions: 0,
        avgSessionDuration: 0,
        peakUsageTime: 'N/A',
        userEngagement: 0,
        completionRate: 0,
      };
    }

    // Calculate feature usage
    const featureUsage = new Map<string, number>();
    let totalDuration = 0;
    let totalEvents = 0;
    let completedSessions = 0;

    sessions.forEach(session => {
      totalDuration += session.duration;
      totalEvents += session.totalEvents;

      Object.entries(session.eventsByType).forEach(([type, count]) => {
        featureUsage.set(type, (featureUsage.get(type) || 0) + count);
      });

      // Consider session completed if duration > 5 minutes and has events
      if (session.duration > 300000 && session.totalEvents > 10) {
        completedSessions++;
      }
    });

    // Sort features by usage
    const mostUsedFeatures = Array.from(featureUsage.entries())
      .map(([feature, count]) => ({
        feature,
        count,
        percentage: (count / totalEvents) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate peak usage time (simplified)
    const peakUsageTime = this.calculatePeakUsageTime(sessions);

    // Calculate engagement score (0-100)
    const avgSessionDuration = totalDuration / sessions.length;
    const avgEventsPerSession = totalEvents / sessions.length;
    const userEngagement = Math.min(
      100,
      (avgSessionDuration / 600000) * 50 + (avgEventsPerSession / 100) * 50,
    );

    const completionRate = (completedSessions / sessions.length) * 100;

    return {
      mostUsedFeatures,
      sessionDuration: totalDuration,
      totalSessions: sessions.length,
      avgSessionDuration: Math.round(avgSessionDuration),
      peakUsageTime,
      userEngagement: Math.round(userEngagement),
      completionRate: Math.round(completionRate),
    };
  }

  /**
   * Extract tactical insights from sessions
   */
  public analyzeTacticalInsights(sessions: SessionSummary[]): TacticalInsights {
    const formationUsage = new Map<string, number>();
    const tacticUsage = new Map<string, number>();
    const playerUsage = new Map<string, number>();
    let totalAiSuggestions = 0;
    let acceptedAiSuggestions = 0;
    let totalCollaborators = 0;

    sessions.forEach(session => {
      const events = sessionRecorder.getEvents();

      events.forEach(event => {
        if (event.type === 'formation_change' && event.data.formation) {
          formationUsage.set(
            event.data.formation,
            (formationUsage.get(event.data.formation) || 0) + 1,
          );
        }

        if (event.type === 'tactic_update' && event.data.tacticType) {
          tacticUsage.set(event.data.tacticType, (tacticUsage.get(event.data.tacticType) || 0) + 1);
        }

        if (event.type === 'player_select' && event.data.playerId) {
          playerUsage.set(event.data.playerId, (playerUsage.get(event.data.playerId) || 0) + 1);
        }

        if (event.type === 'ai_suggestion_view') {
          totalAiSuggestions++;
        }

        if (event.type === 'ai_suggestion_accept') {
          acceptedAiSuggestions++;
        }
      });

      totalCollaborators += session.collaborators;
    });

    // Sort formations by usage
    const favoriteFormations = Array.from(formationUsage.entries())
      .map(([formation, usage]) => ({
        formation,
        usage,
        winRate: Math.random() * 100, // Placeholder - would come from match data
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);

    // Sort tactics by frequency
    const commonTactics = Array.from(tacticUsage.entries())
      .map(([tactic, frequency]) => ({ tactic, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Sort players by utilization
    const playerUtilization = Array.from(playerUsage.entries())
      .map(([playerId, usage]) => ({
        playerId,
        usage,
        performance: Math.random() * 100, // Placeholder - would come from match data
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 11);

    const aiAcceptanceRate =
      totalAiSuggestions > 0 ? (acceptedAiSuggestions / totalAiSuggestions) * 100 : 0;

    const collaborationScore = Math.min(100, totalCollaborators * 10);

    return {
      favoriteFormations,
      commonTactics,
      playerUtilization,
      aiAcceptanceRate: Math.round(aiAcceptanceRate),
      collaborationScore: Math.round(collaborationScore),
    };
  }

  /**
   * Generate complete analytics dashboard data
   */
  public generateDashboard(
    playerPositions: Array<{ playerId: string; playerName: string; x: number; y: number }>,
  ): AnalyticsDashboardData {
    const session = sessionRecorder.generateSummary();
    const heatmap = heatmapAnalytics.generateCompleteHeatmap(playerPositions);

    this.sessionHistory.push(session);

    const performance = this.calculatePerformanceMetrics(session);
    const userBehavior = this.analyzeUserBehavior(this.sessionHistory);
    const tactical = this.analyzeTacticalInsights(this.sessionHistory);

    return {
      performance,
      userBehavior,
      tactical,
      session,
      heatmap,
      generatedAt: Date.now(),
    };
  }

  /**
   * Export analytics data
   */
  public exportAnalytics(data: AnalyticsDashboardData, options: AnalyticsExportOptions): string {
    switch (options.format) {
      case 'json':
        return this.exportJSON(data, options);
      case 'csv':
        return this.exportCSV(data, options);
      case 'pdf':
        return this.exportPDF(data, options);
      default:
        return this.exportJSON(data, options);
    }
  }

  /**
   * Export as JSON
   */
  private exportJSON(data: AnalyticsDashboardData, options: AnalyticsExportOptions): string {
    const exportData: Record<string, unknown> = {
      generatedAt: new Date(data.generatedAt).toISOString(),
      performance: data.performance,
      userBehavior: data.userBehavior,
      tactical: data.tactical,
    };

    if (options.includeSessions) {
      exportData.session = data.session;
    }

    if (options.includeHeatmaps) {
      exportData.heatmap = data.heatmap;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export as CSV
   */
  private exportCSV(data: AnalyticsDashboardData, _options: AnalyticsExportOptions): string {
    const lines: string[] = [];

    // Performance metrics
    lines.push('Performance Metrics');
    lines.push('Metric,Value');
    lines.push(`Actions Per Minute,${data.performance.actionsPerMinute}`);
    lines.push(`Formation Changes,${data.performance.formationChanges}`);
    lines.push(`Tactic Updates,${data.performance.tacticUpdates}`);
    lines.push(`AI Suggestions Used,${data.performance.aiSuggestionsUsed}`);
    lines.push(`Avg Response Time,${data.performance.avgResponseTime}ms`);
    lines.push(`Error Rate,${data.performance.errorRate}%`);
    lines.push(`Session Duration,${data.performance.sessionDuration}ms`);
    lines.push('');

    // User behavior
    lines.push('User Behavior');
    lines.push('Feature,Count,Percentage');
    data.userBehavior.mostUsedFeatures.forEach(feature => {
      lines.push(`${feature.feature},${feature.count},${feature.percentage.toFixed(2)}%`);
    });
    lines.push('');

    // Tactical insights
    lines.push('Favorite Formations');
    lines.push('Formation,Usage,Win Rate');
    data.tactical.favoriteFormations.forEach(formation => {
      lines.push(`${formation.formation},${formation.usage},${formation.winRate.toFixed(2)}%`);
    });

    return lines.join('\n');
  }

  /**
   * Export as PDF (returns HTML that can be converted to PDF)
   */
  private exportPDF(data: AnalyticsDashboardData, options: AnalyticsExportOptions): string {
    const html: string[] = [];

    html.push('<!DOCTYPE html>');
    html.push('<html>');
    html.push('<head>');
    html.push('<title>Analytics Report</title>');
    html.push('<style>');
    html.push('body { font-family: Arial, sans-serif; margin: 40px; }');
    html.push('h1 { color: #1f2937; }');
    html.push('h2 { color: #374151; margin-top: 30px; }');
    html.push('table { border-collapse: collapse; width: 100%; margin: 20px 0; }');
    html.push('th, td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }');
    html.push('th { background-color: #f3f4f6; }');
    html.push(
      '.metric { display: inline-block; margin: 10px; padding: 15px; background: #f9fafb; border-radius: 8px; }',
    );
    html.push('</style>');
    html.push('</head>');
    html.push('<body>');

    // Title
    html.push('<h1>📊 Analytics Report</h1>');
    html.push(`<p>Generated: ${new Date(data.generatedAt).toLocaleString()}</p>`);

    // Performance metrics
    html.push('<h2>⚡ Performance Metrics</h2>');
    html.push('<div>');
    html.push(
      `<div class="metric"><strong>Actions/Min:</strong> ${data.performance.actionsPerMinute}</div>`,
    );
    html.push(
      `<div class="metric"><strong>Formation Changes:</strong> ${data.performance.formationChanges}</div>`,
    );
    html.push(
      `<div class="metric"><strong>Tactic Updates:</strong> ${data.performance.tacticUpdates}</div>`,
    );
    html.push(
      `<div class="metric"><strong>AI Suggestions:</strong> ${data.performance.aiSuggestionsUsed}</div>`,
    );
    html.push(
      `<div class="metric"><strong>Avg Response:</strong> ${data.performance.avgResponseTime}ms</div>`,
    );
    html.push(
      `<div class="metric"><strong>Error Rate:</strong> ${data.performance.errorRate}%</div>`,
    );
    html.push('</div>');

    // User behavior
    html.push('<h2>👤 User Behavior</h2>');
    html.push('<table>');
    html.push('<tr><th>Feature</th><th>Usage Count</th><th>Percentage</th></tr>');
    data.userBehavior.mostUsedFeatures.slice(0, 10).forEach(feature => {
      html.push(
        `<tr><td>${feature.feature}</td><td>${feature.count}</td><td>${feature.percentage.toFixed(2)}%</td></tr>`,
      );
    });
    html.push('</table>');

    // Tactical insights
    if (options.includeCharts) {
      html.push('<h2>⚽ Tactical Insights</h2>');
      html.push('<table>');
      html.push('<tr><th>Formation</th><th>Usage</th><th>Win Rate</th></tr>');
      data.tactical.favoriteFormations.forEach(formation => {
        html.push(
          `<tr><td>${formation.formation}</td><td>${formation.usage}</td><td>${formation.winRate.toFixed(2)}%</td></tr>`,
        );
      });
      html.push('</table>');
    }

    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
  }

  /**
   * Calculate peak usage time
   */
  private calculatePeakUsageTime(sessions: SessionSummary[]): string {
    const hourCounts = new Array(24).fill(0);

    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour]++;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    return `${peakHour}:00 - ${(peakHour + 1) % 24}:00`;
  }

  /**
   * Clear analytics history
   */
  public clearHistory(): void {
    this.sessionHistory = [];
    this.performanceCache.clear();
  }

  /**
   * Get session history
   */
  public getSessionHistory(): SessionSummary[] {
    return this.sessionHistory;
  }
}

// Export singleton instance
export const analyticsDashboard = AnalyticsDashboard.getInstance();

// Helper hook for React components
export const useAnalyticsDashboard = () => {
  return {
    calculatePerformanceMetrics: (summary: SessionSummary) =>
      analyticsDashboard.calculatePerformanceMetrics(summary),
    analyzeUserBehavior: (sessions: SessionSummary[]) =>
      analyticsDashboard.analyzeUserBehavior(sessions),
    analyzeTacticalInsights: (sessions: SessionSummary[]) =>
      analyticsDashboard.analyzeTacticalInsights(sessions),
    generateDashboard: (
      playerPositions: Array<{ playerId: string; playerName: string; x: number; y: number }>,
    ) => analyticsDashboard.generateDashboard(playerPositions),
    exportAnalytics: (data: AnalyticsDashboardData, options: AnalyticsExportOptions) =>
      analyticsDashboard.exportAnalytics(data, options),
    getSessionHistory: () => analyticsDashboard.getSessionHistory(),
    clearHistory: () => analyticsDashboard.clearHistory(),
  };
};
