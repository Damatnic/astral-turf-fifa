/**
 * Documentation Analytics Service
 *
 * Tracks user interactions with documentation, measures effectiveness,
 * and provides insights for improving documentation quality and usability.
 */

import { z } from 'zod';

// Analytics Event Schema
export const AnalyticsEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'page_view',
    'search',
    'help_opened',
    'tutorial_started',
    'tutorial_completed',
    'tutorial_skipped',
    'article_helpful',
    'article_unhelpful',
    'bookmark_added',
    'bookmark_removed',
    'code_copied',
    'example_run',
    'feedback_submitted',
    'error_encountered',
    'time_spent',
    'scroll_depth',
    'external_link_clicked',
    'download_initiated',
  ]),
  timestamp: z.string(),
  userId: z.string().optional(),
  sessionId: z.string(),
  documentId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  context: z.object({
    userAgent: z.string().optional(),
    viewport: z
      .object({
        width: z.number(),
        height: z.number(),
      })
      .optional(),
    referrer: z.string().optional(),
    url: z.string(),
    userType: z.enum(['new', 'returning', 'anonymous']).optional(),
    deviceType: z.enum(['desktop', 'tablet', 'mobile']).optional(),
  }),
});

export const UserSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  pageViews: z.number(),
  searchQueries: z.array(z.string()),
  documentsViewed: z.array(z.string()),
  timeSpent: z.number(), // seconds
  bounceRate: z.boolean(),
  conversionGoals: z.array(z.string()),
  userJourney: z.array(
    z.object({
      action: z.string(),
      timestamp: z.string(),
      documentId: z.string().optional(),
    }),
  ),
});

export const DocumentationMetricsSchema = z.object({
  documentId: z.string(),
  period: z.object({
    start: z.string(),
    end: z.string(),
  }),
  metrics: z.object({
    views: z.number(),
    uniqueViews: z.number(),
    averageTimeSpent: z.number(),
    bounceRate: z.number(),
    helpfulRating: z.number(),
    searchRanking: z.number(),
    conversionRate: z.number(),
    errorRate: z.number(),
  }),
  userSegments: z.record(
    z.object({
      views: z.number(),
      satisfaction: z.number(),
      completionRate: z.number(),
    }),
  ),
  trends: z.object({
    daily: z.array(
      z.object({
        date: z.string(),
        views: z.number(),
        satisfaction: z.number(),
      }),
    ),
    weekly: z.array(
      z.object({
        week: z.string(),
        views: z.number(),
        satisfaction: z.number(),
      }),
    ),
  }),
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type UserSession = z.infer<typeof UserSessionSchema>;
export type DocumentationMetrics = z.infer<typeof DocumentationMetricsSchema>;

/**
 * Documentation Analytics Service
 */
export class DocumentationAnalyticsService {
  private static instance: DocumentationAnalyticsService;
  private events: AnalyticsEvent[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private currentSessionId: string = '';
  private startTime: number = Date.now();
  private pageStartTime: number = Date.now();
  private isTracking: boolean = true;
  private batchSize: number = 50;
  private flushInterval: number = 30000; // 30 seconds
  private eventQueue: AnalyticsEvent[] = [];

  static getInstance(): DocumentationAnalyticsService {
    if (!DocumentationAnalyticsService.instance) {
      DocumentationAnalyticsService.instance = new DocumentationAnalyticsService();
    }
    return DocumentationAnalyticsService.instance;
  }

  constructor() {
    this.initializeTracking();
    this.startBatchProcessing();
    this.setupUnloadHandlers();
  }

  /**
   * Initialize tracking system
   */
  private initializeTracking(): void {
    this.currentSessionId = this.generateSessionId();
    this.startTime = Date.now();

    // Initialize current session
    this.sessions.set(this.currentSessionId, {
      sessionId: this.currentSessionId,
      startTime: new Date().toISOString(),
      pageViews: 0,
      searchQueries: [],
      documentsViewed: [],
      timeSpent: 0,
      bounceRate: false,
      conversionGoals: [],
      userJourney: [],
    });

    // Track initial page view
    this.trackPageView();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `doc_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track analytics event
   */
  track(type: AnalyticsEvent['type'], metadata?: Record<string, any>, documentId?: string): void {
    if (!this.isTracking) {
      return;
    }

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type,
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      documentId,
      metadata: metadata || {},
      context: this.getContext(),
    };

    // Add to queue for batch processing
    this.eventQueue.push(event);

    // Update session data
    this.updateSession(event);

    // Immediate processing for critical events
    if (this.isCriticalEvent(type)) {
      this.flushEvents();
    }
  }

  /**
   * Track page view
   */
  trackPageView(documentId?: string, metadata?: Record<string, any>): void {
    this.pageStartTime = Date.now();

    this.track(
      'page_view',
      {
        ...metadata,
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      },
      documentId,
    );
  }

  /**
   * Track search query
   */
  trackSearch(query: string, results: number, category?: string): void {
    this.track('search', {
      query,
      resultsCount: results,
      category,
      queryLength: query.length,
      hasResults: results > 0,
    });

    // Update session search queries
    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.searchQueries.push(query);
    }
  }

  /**
   * Track help system usage
   */
  trackHelpSystem(action: 'opened' | 'closed' | 'searched', metadata?: Record<string, any>): void {
    this.track('help_opened', {
      action,
      ...metadata,
    });
  }

  /**
   * Track tutorial progress
   */
  trackTutorial(
    action: 'started' | 'completed' | 'skipped',
    tutorialId: string,
    stepIndex?: number,
  ): void {
    const eventType =
      action === 'started'
        ? 'tutorial_started'
        : action === 'completed'
          ? 'tutorial_completed'
          : 'tutorial_skipped';

    this.track(eventType, {
      tutorialId,
      stepIndex,
      action,
    });

    // Track conversion goals
    if (action === 'completed') {
      this.trackConversionGoal(`tutorial_${tutorialId}_completed`);
    }
  }

  /**
   * Track document interaction
   */
  trackDocumentInteraction(
    action: 'helpful' | 'unhelpful' | 'bookmark' | 'share',
    documentId: string,
  ): void {
    const eventType =
      action === 'helpful'
        ? 'article_helpful'
        : action === 'unhelpful'
          ? 'article_unhelpful'
          : action === 'bookmark'
            ? 'bookmark_added'
            : 'feedback_submitted';

    this.track(eventType, { action }, documentId);
  }

  /**
   * Track code example interaction
   */
  trackCodeExample(
    action: 'copied' | 'run' | 'modified',
    exampleId: string,
    success?: boolean,
  ): void {
    const eventType = action === 'copied' ? 'code_copied' : 'example_run';

    this.track(eventType, {
      exampleId,
      action,
      success,
    });
  }

  /**
   * Track time spent on page/document
   */
  trackTimeSpent(documentId?: string): void {
    const timeSpent = Date.now() - this.pageStartTime;

    this.track(
      'time_spent',
      {
        duration: timeSpent,
        documentId,
      },
      documentId,
    );
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth(percentage: number, documentId?: string): void {
    // Only track significant scroll milestones
    if (percentage % 25 === 0) {
      this.track(
        'scroll_depth',
        {
          percentage,
          milestone: `${percentage}%`,
        },
        documentId,
      );
    }
  }

  /**
   * Track errors in documentation
   */
  trackError(error: string, context?: Record<string, any>, documentId?: string): void {
    this.track(
      'error_encountered',
      {
        error,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      documentId,
    );
  }

  /**
   * Track conversion goals
   */
  trackConversionGoal(goalId: string, value?: number): void {
    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.conversionGoals.push(goalId);
    }

    this.track('feedback_submitted', {
      goalId,
      value,
      type: 'conversion_goal',
    });
  }

  /**
   * Get current context information
   */
  private getContext(): AnalyticsEvent['context'] {
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      referrer: document.referrer,
      url: window.location.href,
      deviceType: this.getDeviceType(),
      userType: this.getUserType(),
    };
  }

  /**
   * Determine device type
   */
  private getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const width = window.innerWidth;
    if (width < 768) {
      return 'mobile';
    }
    if (width < 1024) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Determine user type
   */
  private getUserType(): 'new' | 'returning' | 'anonymous' {
    const hasVisited = localStorage.getItem('astral_turf_visited');
    if (!hasVisited) {
      localStorage.setItem('astral_turf_visited', 'true');
      return 'new';
    }
    return 'returning';
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update session data with new event
   */
  private updateSession(event: AnalyticsEvent): void {
    const session = this.sessions.get(this.currentSessionId);
    if (!session) {
      return;
    }

    // Update session metrics
    if (event.type === 'page_view') {
      session.pageViews++;
      if (event.documentId && !session.documentsViewed.includes(event.documentId)) {
        session.documentsViewed.push(event.documentId);
      }
    }

    // Add to user journey
    session.userJourney.push({
      action: event.type,
      timestamp: event.timestamp,
      documentId: event.documentId,
    });

    // Update time spent
    session.timeSpent = Date.now() - this.startTime;
  }

  /**
   * Check if event is critical and needs immediate processing
   */
  private isCriticalEvent(type: AnalyticsEvent['type']): boolean {
    return ['error_encountered', 'feedback_submitted'].includes(type);
  }

  /**
   * Start batch processing of events
   */
  private startBatchProcessing(): void {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }

  /**
   * Flush events to storage/server
   */
  private flushEvents(): void {
    if (this.eventQueue.length === 0) {
      return;
    }

    // Process events in batches
    const batch = this.eventQueue.splice(0, this.batchSize);
    this.events.push(...batch);

    // In a real implementation, you would send to analytics server
    this.processEventBatch(batch);
  }

  /**
   * Process batch of events
   */
  private processEventBatch(events: AnalyticsEvent[]): void {
    // Store in localStorage for offline capability
    try {
      const stored = localStorage.getItem('astral_turf_analytics') || '[]';
      const existingEvents = JSON.parse(stored);
      const allEvents = [...existingEvents, ...events];

      // Keep only recent events to avoid storage overflow
      const recentEvents = allEvents.slice(-1000);
      localStorage.setItem('astral_turf_analytics', JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('Failed to store analytics events:', error);
    }

    // Send to analytics service (mock implementation)
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsService(events);
    }
  }

  /**
   * Send events to analytics service
   */
  private async sendToAnalyticsService(events: AnalyticsEvent[]): Promise<void> {
    try {
      // Mock API call - replace with actual analytics service
      await fetch('/api/analytics/documentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.warn('Failed to send analytics events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Setup page unload handlers
   */
  private setupUnloadHandlers(): void {
    // Track time spent before page unload
    window.addEventListener('beforeunload', () => {
      this.trackTimeSpent();
      this.flushEvents();

      // End current session
      const session = this.sessions.get(this.currentSessionId);
      if (session) {
        session.endTime = new Date().toISOString();
        session.bounceRate = session.pageViews === 1 && session.timeSpent < 10000; // Less than 10 seconds
      }
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackTimeSpent();
      } else {
        this.pageStartTime = Date.now();
      }
    });
  }

  /**
   * Get analytics dashboard data
   */
  async getDashboardData(dateRange?: { start: string; end: string }): Promise<{
    overview: any;
    topDocuments: any[];
    searchAnalytics: any;
    userBehavior: any;
    conversionFunnels: any;
  }> {
    const events = this.getEventsInRange(dateRange);

    return {
      overview: this.calculateOverviewMetrics(events),
      topDocuments: this.getTopDocuments(events),
      searchAnalytics: this.getSearchAnalytics(events),
      userBehavior: this.getUserBehaviorMetrics(events),
      conversionFunnels: this.getConversionFunnels(events),
    };
  }

  /**
   * Get documentation performance metrics
   */
  async getDocumentMetrics(
    documentId: string,
    period?: { start: string; end: string },
  ): Promise<DocumentationMetrics> {
    const events = this.getEventsInRange(period).filter(event => event.documentId === documentId);

    const metrics = this.calculateDocumentMetrics(events);

    return {
      documentId,
      period: period || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      metrics,
      userSegments: this.calculateUserSegmentMetrics(events),
      trends: this.calculateTrends(events),
    };
  }

  /**
   * Get events within date range
   */
  private getEventsInRange(dateRange?: { start: string; end: string }): AnalyticsEvent[] {
    if (!dateRange) {
      return this.events;
    }

    const start = new Date(dateRange.start).getTime();
    const end = new Date(dateRange.end).getTime();

    return this.events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= start && eventTime <= end;
    });
  }

  /**
   * Calculate overview metrics
   */
  private calculateOverviewMetrics(events: AnalyticsEvent[]): any {
    const pageViews = events.filter(e => e.type === 'page_view').length;
    const uniqueUsers = new Set(events.map(e => e.sessionId)).size;
    const searches = events.filter(e => e.type === 'search').length;
    const helpfulRatings = events.filter(e => e.type === 'article_helpful').length;
    const unhelpfulRatings = events.filter(e => e.type === 'article_unhelpful').length;

    return {
      pageViews,
      uniqueUsers,
      searches,
      satisfactionRate: helpfulRatings / (helpfulRatings + unhelpfulRatings) || 0,
      averageSessionDuration: this.calculateAverageSessionDuration(),
      bounceRate: this.calculateBounceRate(),
    };
  }

  /**
   * Get top performing documents
   */
  private getTopDocuments(events: AnalyticsEvent[]): any[] {
    const documentViews = new Map<string, number>();
    const documentRatings = new Map<string, { helpful: number; unhelpful: number }>();

    events.forEach(event => {
      if (event.documentId) {
        if (event.type === 'page_view') {
          documentViews.set(event.documentId, (documentViews.get(event.documentId) || 0) + 1);
        } else if (event.type === 'article_helpful' || event.type === 'article_unhelpful') {
          const ratings = documentRatings.get(event.documentId) || { helpful: 0, unhelpful: 0 };
          if (event.type === 'article_helpful') {
            ratings.helpful++;
          } else {
            ratings.unhelpful++;
          }
          documentRatings.set(event.documentId, ratings);
        }
      }
    });

    return Array.from(documentViews.entries())
      .map(([documentId, views]) => {
        const ratings = documentRatings.get(documentId) || { helpful: 0, unhelpful: 0 };
        const satisfaction = ratings.helpful / (ratings.helpful + ratings.unhelpful) || 0;

        return {
          documentId,
          views,
          satisfaction,
          helpfulRatings: ratings.helpful,
          unhelpfulRatings: ratings.unhelpful,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  /**
   * Get search analytics
   */
  private getSearchAnalytics(events: AnalyticsEvent[]): any {
    const searchEvents = events.filter(e => e.type === 'search');
    const totalSearches = searchEvents.length;

    const queryFrequency = new Map<string, number>();
    const noResultQueries: string[] = [];

    searchEvents.forEach(event => {
      const query = event.metadata?.query;
      if (query) {
        queryFrequency.set(query, (queryFrequency.get(query) || 0) + 1);

        if (event.metadata?.resultsCount === 0) {
          noResultQueries.push(query);
        }
      }
    });

    return {
      totalSearches,
      uniqueQueries: queryFrequency.size,
      topQueries: Array.from(queryFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      noResultQueries: [...new Set(noResultQueries)],
      averageResultsPerQuery:
        searchEvents.reduce((sum, e) => sum + (e.metadata?.resultsCount || 0), 0) / totalSearches,
    };
  }

  /**
   * Get user behavior metrics
   */
  private getUserBehaviorMetrics(events: AnalyticsEvent[]): any {
    const timeSpentEvents = events.filter(e => e.type === 'time_spent');
    const scrollEvents = events.filter(e => e.type === 'scroll_depth');

    return {
      averageTimeSpent:
        timeSpentEvents.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0) /
        timeSpentEvents.length,
      averageScrollDepth:
        scrollEvents.reduce((sum, e) => sum + (e.metadata?.percentage || 0), 0) /
        scrollEvents.length,
      deviceBreakdown: this.calculateDeviceBreakdown(events),
      userTypeBreakdown: this.calculateUserTypeBreakdown(events),
    };
  }

  /**
   * Get conversion funnels
   */
  private getConversionFunnels(events: AnalyticsEvent[]): any {
    const tutorialStarted = events.filter(e => e.type === 'tutorial_started').length;
    const tutorialCompleted = events.filter(e => e.type === 'tutorial_completed').length;
    const helpOpened = events.filter(e => e.type === 'help_opened').length;

    return {
      onboardingFunnel: {
        started: tutorialStarted,
        completed: tutorialCompleted,
        completionRate: tutorialCompleted / tutorialStarted || 0,
      },
      helpEngagement: {
        helpOpened,
        conversionToPositiveFeedback:
          events.filter(e => e.type === 'article_helpful').length / helpOpened || 0,
      },
    };
  }

  /**
   * Calculate document-specific metrics
   */
  private calculateDocumentMetrics(events: AnalyticsEvent[]): DocumentationMetrics['metrics'] {
    const views = events.filter(e => e.type === 'page_view').length;
    const uniqueViews = new Set(events.filter(e => e.type === 'page_view').map(e => e.sessionId))
      .size;
    const timeSpentEvents = events.filter(e => e.type === 'time_spent');
    const helpfulRatings = events.filter(e => e.type === 'article_helpful').length;
    const unhelpfulRatings = events.filter(e => e.type === 'article_unhelpful').length;
    const errors = events.filter(e => e.type === 'error_encountered').length;

    return {
      views,
      uniqueViews,
      averageTimeSpent:
        timeSpentEvents.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0) /
          timeSpentEvents.length || 0,
      bounceRate: this.calculateDocumentBounceRate(events),
      helpfulRating: helpfulRatings / (helpfulRatings + unhelpfulRatings) || 0,
      searchRanking: 0, // Would be calculated based on search result positions
      conversionRate: 0, // Would be calculated based on specific conversion goals
      errorRate: errors / views || 0,
    };
  }

  private calculateDocumentBounceRate(events: AnalyticsEvent[]): number {
    // Implementation would calculate bounce rate for the specific document
    return 0;
  }

  private calculateUserSegmentMetrics(
    events: AnalyticsEvent[],
  ): DocumentationMetrics['userSegments'] {
    // Implementation would segment users and calculate metrics per segment
    return {};
  }

  private calculateTrends(events: AnalyticsEvent[]): DocumentationMetrics['trends'] {
    // Implementation would calculate daily and weekly trends
    return {
      daily: [],
      weekly: [],
    };
  }

  private calculateAverageSessionDuration(): number {
    const sessions = Array.from(this.sessions.values());
    const totalDuration = sessions.reduce((sum, session) => sum + session.timeSpent, 0);
    return totalDuration / sessions.length || 0;
  }

  private calculateBounceRate(): number {
    const sessions = Array.from(this.sessions.values());
    const bounces = sessions.filter(session => session.bounceRate).length;
    return bounces / sessions.length || 0;
  }

  private calculateDeviceBreakdown(events: AnalyticsEvent[]): Record<string, number> {
    const devices = new Map<string, number>();
    events.forEach(event => {
      const deviceType = event.context.deviceType || 'unknown';
      devices.set(deviceType, (devices.get(deviceType) || 0) + 1);
    });
    return Object.fromEntries(devices);
  }

  private calculateUserTypeBreakdown(events: AnalyticsEvent[]): Record<string, number> {
    const userTypes = new Map<string, number>();
    events.forEach(event => {
      const userType = event.context.userType || 'unknown';
      userTypes.set(userType, (userTypes.get(userType) || 0) + 1);
    });
    return Object.fromEntries(userTypes);
  }

  /**
   * Enable/disable tracking
   */
  setTracking(enabled: boolean): void {
    this.isTracking = enabled;
  }

  /**
   * Clear all stored analytics data
   */
  clearData(): void {
    this.events = [];
    this.sessions.clear();
    this.eventQueue = [];
    localStorage.removeItem('astral_turf_analytics');
  }

  /**
   * Export analytics data
   */
  exportData(): string {
    return JSON.stringify(
      {
        events: this.events,
        sessions: Array.from(this.sessions.entries()),
      },
      null,
      2,
    );
  }
}

// Create singleton instance
export const documentationAnalytics = DocumentationAnalyticsService.getInstance();

// Auto-track scroll depth
let lastScrollDepth = 0;
window.addEventListener('scroll', () => {
  const scrollDepth = Math.round(
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100,
  );

  if (scrollDepth > lastScrollDepth && scrollDepth % 25 === 0) {
    documentationAnalytics.trackScrollDepth(scrollDepth);
    lastScrollDepth = scrollDepth;
  }
});

export default documentationAnalytics;
