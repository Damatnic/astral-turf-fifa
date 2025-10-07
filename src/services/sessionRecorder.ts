/**
 * Session Recording Service
 * Captures user interactions, tactical changes, and gameplay sessions for analysis
 */

export interface SessionEvent {
  id: string;
  timestamp: number;
  type: SessionEventType;
  category: EventCategory;
  data: Record<string, any>;
  metadata: {
    userId?: string;
    sessionId: string;
    userAgent: string;
    viewport: { width: number; height: number };
  };
}

export type SessionEventType =
  | 'player_move'
  | 'formation_change'
  | 'tactic_update'
  | 'player_select'
  | 'player_deselect'
  | 'multi_select'
  | 'drag_start'
  | 'drag_end'
  | 'zoom'
  | 'pan'
  | 'preset_apply'
  | 'ai_suggestion_view'
  | 'ai_suggestion_accept'
  | 'ai_suggestion_reject'
  | 'collaboration_join'
  | 'collaboration_leave'
  | 'export_tactical_board'
  | 'import_tactical_board'
  | 'page_view'
  | 'feature_use'
  | 'error'
  | 'performance_metric';

export type EventCategory =
  | 'tactical'
  | 'interaction'
  | 'collaboration'
  | 'ai'
  | 'navigation'
  | 'export'
  | 'error'
  | 'performance';

export interface SessionSummary {
  sessionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  totalEvents: number;
  eventsByType: Record<SessionEventType, number>;
  eventsByCategory: Record<EventCategory, number>;
  tacticalChanges: number;
  formationChanges: number;
  aiInteractions: number;
  collaborators: number;
  performanceMetrics: {
    avgResponseTime: number;
    errorsCount: number;
    featuresUsed: string[];
  };
}

export interface TimelineEntry {
  timestamp: number;
  event: SessionEvent;
  description: string;
  icon: string;
  color: string;
}

class SessionRecorder {
  private static instance: SessionRecorder;
  private events: SessionEvent[] = [];
  private sessionId: string;
  private sessionStart: number;
  private isRecording: boolean = false;
  private eventBuffer: SessionEvent[] = [];
  private bufferSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
  }

  public static getInstance(): SessionRecorder {
    if (!SessionRecorder.instance) {
      SessionRecorder.instance = new SessionRecorder();
    }
    return SessionRecorder.instance;
  }

  /**
   * Start recording session events
   */
  public startRecording(): void {
    if (this.isRecording) {
      console.warn('Session recording already started');
      return;
    }

    this.isRecording = true;
    this.sessionStart = Date.now();
    this.events = [];
    this.eventBuffer = [];

    // Start periodic flush
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.flushInterval);

    this.recordEvent('page_view', 'navigation', {
      page: window.location.pathname,
      action: 'session_start',
    });

    console.log(`Session recording started: ${this.sessionId}`);
  }

  /**
   * Stop recording session events
   */
  public stopRecording(): SessionSummary {
    if (!this.isRecording) {
      console.warn('Session recording not started');
      return this.generateSummary();
    }

    this.recordEvent('page_view', 'navigation', {
      page: window.location.pathname,
      action: 'session_end',
    });

    this.isRecording = false;

    // Clear flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // Final flush
    this.flushBuffer();

    const summary = this.generateSummary();
    console.log('Session recording stopped', summary);

    return summary;
  }

  /**
   * Record a session event
   */
  public recordEvent(
    type: SessionEventType,
    category: EventCategory,
    data: Record<string, any> = {},
  ): SessionEvent {
    if (!this.isRecording) {
      return {} as SessionEvent;
    }

    const event: SessionEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      type,
      category,
      data,
      metadata: {
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
    };

    this.eventBuffer.push(event);

    // Flush if buffer is full
    if (this.eventBuffer.length >= this.bufferSize) {
      this.flushBuffer();
    }

    return event;
  }

  /**
   * Flush event buffer to main storage
   */
  private flushBuffer(): void {
    if (this.eventBuffer.length === 0) {
      return;
    }

    this.events.push(...this.eventBuffer);
    this.eventBuffer = [];

    // In production, send to analytics service
    // analytics.track('session_events', { events: this.eventBuffer });
  }

  /**
   * Get all recorded events
   */
  public getEvents(): SessionEvent[] {
    return [...this.events, ...this.eventBuffer];
  }

  /**
   * Get events by type
   */
  public getEventsByType(type: SessionEventType): SessionEvent[] {
    return this.getEvents().filter(event => event.type === type);
  }

  /**
   * Get events by category
   */
  public getEventsByCategory(category: EventCategory): SessionEvent[] {
    return this.getEvents().filter(event => event.category === category);
  }

  /**
   * Get events in time range
   */
  public getEventsByTimeRange(startTime: number, endTime: number): SessionEvent[] {
    return this.getEvents().filter(
      event => event.timestamp >= startTime && event.timestamp <= endTime,
    );
  }

  /**
   * Generate session summary
   */
  public generateSummary(): SessionSummary {
    const allEvents = this.getEvents();
    const endTime = Date.now();
    const duration = endTime - this.sessionStart;

    const eventsByType = {} as Record<SessionEventType, number>;
    const eventsByCategory = {} as Record<EventCategory, number>;
    const featuresUsed = new Set<string>();
    let errorsCount = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    allEvents.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      // Count by category
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;

      // Track features
      if (event.category === 'tactical' || event.type === 'feature_use') {
        featuresUsed.add(event.type);
      }

      // Count errors
      if (event.category === 'error') {
        errorsCount++;
      }

      // Calculate average response time
      if (event.category === 'performance' && event.data.responseTime) {
        totalResponseTime += event.data.responseTime;
        responseTimeCount++;
      }
    });

    return {
      sessionId: this.sessionId,
      startTime: this.sessionStart,
      endTime,
      duration,
      totalEvents: allEvents.length,
      eventsByType,
      eventsByCategory,
      tacticalChanges: (eventsByType.tactic_update || 0) + (eventsByType.player_move || 0),
      formationChanges: eventsByType.formation_change || 0,
      aiInteractions:
        (eventsByType.ai_suggestion_view || 0) +
        (eventsByType.ai_suggestion_accept || 0) +
        (eventsByType.ai_suggestion_reject || 0),
      collaborators:
        (eventsByType.collaboration_join || 0) + (eventsByType.collaboration_leave || 0),
      performanceMetrics: {
        avgResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
        errorsCount,
        featuresUsed: Array.from(featuresUsed),
      },
    };
  }

  /**
   * Generate timeline for playback
   */
  public generateTimeline(): TimelineEntry[] {
    const allEvents = this.getEvents();

    return allEvents.map(event => ({
      timestamp: event.timestamp,
      event,
      description: this.getEventDescription(event),
      icon: this.getEventIcon(event),
      color: this.getEventColor(event),
    }));
  }

  /**
   * Export session data as JSON
   */
  public exportJSON(): string {
    return JSON.stringify(
      {
        summary: this.generateSummary(),
        events: this.getEvents(),
        timeline: this.generateTimeline(),
      },
      null,
      2,
    );
  }

  /**
   * Export session data as CSV
   */
  public exportCSV(): string {
    const events = this.getEvents();

    const headers = ['ID', 'Timestamp', 'Type', 'Category', 'Data', 'Session ID'];
    const rows = events.map(event => [
      event.id,
      new Date(event.timestamp).toISOString(),
      event.type,
      event.category,
      JSON.stringify(event.data),
      event.metadata.sessionId,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Clear all recorded events
   */
  public clear(): void {
    this.events = [];
    this.eventBuffer = [];
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get session duration in milliseconds
   */
  public getSessionDuration(): number {
    return Date.now() - this.sessionStart;
  }

  /**
   * Get event description for timeline
   */
  private getEventDescription(event: SessionEvent): string {
    switch (event.type) {
      case 'player_move':
        return `Moved player ${event.data.playerId} to (${event.data.x}, ${event.data.y})`;
      case 'formation_change':
        return `Changed formation to ${event.data.formation}`;
      case 'tactic_update':
        return `Updated tactic: ${event.data.tacticType}`;
      case 'ai_suggestion_accept':
        return `Accepted AI suggestion: ${event.data.suggestionType}`;
      case 'ai_suggestion_reject':
        return `Rejected AI suggestion: ${event.data.suggestionType}`;
      case 'preset_apply':
        return `Applied preset: ${event.data.presetName}`;
      default:
        return `${event.type} event`;
    }
  }

  /**
   * Get event icon for timeline
   */
  private getEventIcon(event: SessionEvent): string {
    const iconMap: Record<EventCategory, string> = {
      tactical: '⚽',
      interaction: '👆',
      collaboration: '👥',
      ai: '🤖',
      navigation: '🧭',
      export: '📤',
      error: '⚠️',
      performance: '⚡',
    };

    return iconMap[event.category] || '📍';
  }

  /**
   * Get event color for timeline
   */
  private getEventColor(event: SessionEvent): string {
    const colorMap: Record<EventCategory, string> = {
      tactical: '#10b981',
      interaction: '#3b82f6',
      collaboration: '#8b5cf6',
      ai: '#f59e0b',
      navigation: '#6366f1',
      export: '#14b8a6',
      error: '#ef4444',
      performance: '#eab308',
    };

    return colorMap[event.category] || '#6b7280';
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const sessionRecorder = SessionRecorder.getInstance();

// Helper hook for React components
export const useSessionRecorder = () => {
  const recordEvent = (
    type: SessionEventType,
    category: EventCategory,
    data: Record<string, any> = {},
  ) => {
    return sessionRecorder.recordEvent(type, category, data);
  };

  return {
    recordEvent,
    startRecording: () => sessionRecorder.startRecording(),
    stopRecording: () => sessionRecorder.stopRecording(),
    getEvents: () => sessionRecorder.getEvents(),
    getSummary: () => sessionRecorder.generateSummary(),
    getTimeline: () => sessionRecorder.generateTimeline(),
    exportJSON: () => sessionRecorder.exportJSON(),
    exportCSV: () => sessionRecorder.exportCSV(),
  };
};
