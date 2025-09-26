/**
 * Error Tracking and Alerting Service
 *
 * Production-ready error tracking, monitoring, and alerting system
 * with intelligent error grouping, rate limiting, and notification management.
 */

import { log, SecurityEventType } from './loggingService';
import { cache, redisService } from './redisService';
import { databaseService } from './databaseService';
import { createHash } from 'crypto';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  endpoint?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface TrackedError {
  id: string;
  fingerprint: string;
  message: string;
  stack?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  firstOccurrence: Date;
  lastOccurrence: Date;
  occurrenceCount: number;
  context: ErrorContext;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  tags: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  condition: {
    errorType?: string;
    severity?: string[];
    occurrenceThreshold?: number;
    timeWindowMinutes?: number;
    component?: string;
  };
  actions: AlertAction[];
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'log' | 'database';
  config: {
    recipients?: string[];
    webhookUrl?: string;
    template?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByComponent: Record<string, number>;
  topErrors: Array<{
    fingerprint: string;
    message: string;
    count: number;
    severity: string;
  }>;
  recentErrors: TrackedError[];
}

/**
 * Error Tracking and Alerting Service
 */
class ErrorTrackingService {
  private errors: Map<string, TrackedError> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();
  private initialized = false;

  /**
   * Initialize the error tracking service
   */
  async initialize(): Promise<void> {
    try {
      log.info('Initializing error tracking service');

      // Load existing errors and alert rules
      await this.loadFromStorage();

      // Set up default alert rules
      await this.setupDefaultAlertRules();

      // Start cleanup interval
      this.startCleanupInterval();

      this.initialized = true;

      log.info('Error tracking service initialized successfully', {
        metadata: {
          errorCount: this.errors.size,
          alertRulesCount: this.alertRules.size,
        },
      });

    } catch (_error) {
      log.error('Failed to initialize error tracking service', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Track an error
   */
  async trackError(
    error: Error | string,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  ): Promise<string> {
    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = typeof error === 'string' ? undefined : error.stack;
      const errorType = typeof error === 'string' ? 'GenericError' : error.constructor.name;

      // Generate error fingerprint for grouping
      const fingerprint = this.generateFingerprint(errorMessage, errorStack, context);

      let trackedError = this.errors.get(fingerprint);

      if (trackedError) {
        // Update existing error
        trackedError.lastOccurrence = new Date();
        trackedError.occurrenceCount++;
        trackedError.context = { ...trackedError.context, ...context };
      } else {
        // Create new tracked error
        trackedError = {
          id: this.generateErrorId(),
          fingerprint,
          message: errorMessage,
          stack: errorStack,
          type: errorType,
          severity,
          firstOccurrence: new Date(),
          lastOccurrence: new Date(),
          occurrenceCount: 1,
          context,
          resolved: false,
          tags: this.generateTags(errorType, context, severity),
        };

        this.errors.set(fingerprint, trackedError);
      }

      // Log the error
      log.error(`Tracked error: ${errorMessage}`, {
        userId: context.userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        metadata: {
          errorId: trackedError.id,
          fingerprint,
          occurrenceCount: trackedError.occurrenceCount,
          severity,
          component: context.component,
          ...context.metadata,
        },
      });

      // Check alert rules
      await this.checkAlertRules(trackedError);

      // Save to storage
      await this.saveErrorToStorage(trackedError);

      // Cache recent error for quick access
      await this.cacheRecentError(trackedError);

      return trackedError.id;

    } catch (_trackingError) {
      log.error('Failed to track error', {
        error: trackingError instanceof Error ? trackingError.message : 'Unknown error',
        originalError: typeof error === 'string' ? error : error.message,
      });

      // Return a fallback ID
      return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Track a security incident
   */
  async trackSecurityIncident(
    incident: string,
    context: ErrorContext,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high',
  ): Promise<string> {
    const errorId = await this.trackError(
      new Error(`Security Incident: ${incident}`),
      { ...context, component: 'security' },
      severity,
    );

    // Log as security event
    log.security(SecurityEventType.SUSPICIOUS_ACTIVITY, incident, {
      userId: context.userId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      severity,
      metadata: {
        errorId,
        url: context.url,
        method: context.method,
        ...context.metadata,
      },
    });

    return errorId;
  }

  /**
   * Get error by ID or fingerprint
   */
  getError(idOrFingerprint: string): TrackedError | null {
    // Try by fingerprint first
    let error = this.errors.get(idOrFingerprint);

    if (!error) {
      // Try by ID
      error = Array.from(this.errors.values()).find(e => e.id === idOrFingerprint) || null;
    }

    return error;
  }

  /**
   * Get error statistics
   */
  getStatistics(timeRangeHours = 24): ErrorStatistics {
    const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    const recentErrors = Array.from(this.errors.values())
      .filter(error => error.lastOccurrence > cutoffTime);

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsByComponent: Record<string, number> = {};

    for (const error of recentErrors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + error.occurrenceCount;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + error.occurrenceCount;

      const component = error.context.component || 'unknown';
      errorsByComponent[component] = (errorsByComponent[component] || 0) + error.occurrenceCount;
    }

    const topErrors = recentErrors
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, 10)
      .map(error => ({
        fingerprint: error.fingerprint,
        message: error.message,
        count: error.occurrenceCount,
        severity: error.severity,
      }));

    return {
      totalErrors: recentErrors.reduce((sum, error) => sum + error.occurrenceCount, 0),
      errorsByType,
      errorsBySeverity,
      errorsByComponent,
      topErrors,
      recentErrors: recentErrors
        .sort((a, b) => b.lastOccurrence.getTime() - a.lastOccurrence.getTime())
        .slice(0, 50),
    };
  }

  /**
   * Resolve an error
   */
  async resolveError(idOrFingerprint: string, resolvedBy?: string): Promise<boolean> {
    const error = this.getError(idOrFingerprint);

    if (!error) {
      return false;
    }

    error.resolved = true;
    error.resolvedAt = new Date();
    error.resolvedBy = resolvedBy;

    await this.saveErrorToStorage(error);

    log.info('Error resolved', {
      metadata: {
        errorId: error.id,
        fingerprint: error.fingerprint,
        resolvedBy,
        occurrenceCount: error.occurrenceCount,
      },
    });

    return true;
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const id = this.generateRuleId();
    const alertRule: AlertRule = {
      ...rule,
      id,
    };

    this.alertRules.set(id, alertRule);

    log.info('Alert rule added', {
      metadata: {
        ruleId: id,
        ruleName: rule.name,
        condition: rule.condition,
      },
    });

    return id;
  }

  /**
   * Generate error fingerprint for grouping
   */
  private generateFingerprint(message: string, stack?: string, context?: ErrorContext): string {
    const components = [
      message,
      stack?.split('\n')[0] || '', // First line of stack trace
      context?.component || '',
      context?.endpoint || '',
    ];

    const content = components.join('|');
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `err_${timestamp}_${random}`;
  }

  /**
   * Generate unique rule ID
   */
  private generateRuleId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `rule_${timestamp}_${random}`;
  }

  /**
   * Generate tags for error categorization
   */
  private generateTags(errorType: string, context: ErrorContext, severity: string): string[] {
    const tags: string[] = [severity];

    // Add type-based tags
    if (errorType.includes('Network') || errorType.includes('Fetch')) {
      tags.push('network');
    }
    if (errorType.includes('Auth') || errorType.includes('Permission')) {
      tags.push('authentication');
    }
    if (errorType.includes('Validation')) {
      tags.push('validation');
    }
    if (errorType.includes('Database') || errorType.includes('SQL')) {
      tags.push('database');
    }

    // Add context-based tags
    if (context.component) {
      tags.push(context.component);
    }
    if (context.userId) {
      tags.push('user-related');
    }
    if (context.method) {
      tags.push(context.method.toLowerCase());
    }

    return tags;
  }

  /**
   * Check alert rules and trigger notifications
   */
  private async checkAlertRules(error: TrackedError): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) {continue;}

      // Check cooldown
      const lastTriggered = this.alertCooldowns.get(rule.id);
      if (lastTriggered) {
        const cooldownEnd = new Date(lastTriggered.getTime() + rule.cooldownMinutes * 60 * 1000);
        if (new Date() < cooldownEnd) {continue;}
      }

      // Check conditions
      if (!this.matchesAlertCondition(error, rule.condition)) {continue;}

      // Trigger alert
      await this.triggerAlert(rule, error);

      this.alertCooldowns.set(rule.id, new Date());
    }
  }

  /**
   * Check if error matches alert condition
   */
  private matchesAlertCondition(error: TrackedError, condition: AlertRule['condition']): boolean {
    if (condition.errorType && error.type !== condition.errorType) {
      return false;
    }

    if (condition.severity && !condition.severity.includes(error.severity)) {
      return false;
    }

    if (condition.component && error.context.component !== condition.component) {
      return false;
    }

    if (condition.occurrenceThreshold && error.occurrenceCount < condition.occurrenceThreshold) {
      return false;
    }

    if (condition.timeWindowMinutes) {
      const windowStart = new Date(Date.now() - condition.timeWindowMinutes * 60 * 1000);
      if (error.firstOccurrence < windowStart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Trigger alert actions
   */
  private async triggerAlert(rule: AlertRule, error: TrackedError): Promise<void> {
    log.warn(`Alert triggered: ${rule.name}`, {
      metadata: {
        ruleId: rule.id,
        errorId: error.id,
        errorMessage: error.message,
        occurrenceCount: error.occurrenceCount,
        severity: error.severity,
      },
    });

    for (const action of rule.actions) {
      try {
        await this.executeAlertAction(action, rule, error);
      } catch (_actionError) {
        log.error('Alert action failed', {
          error: actionError instanceof Error ? actionError.message : 'Unknown error',
          metadata: {
            ruleId: rule.id,
            actionType: action.type,
            errorId: error.id,
          },
        });
      }
    }
  }

  /**
   * Execute a specific alert action
   */
  private async executeAlertAction(
    action: AlertAction,
    rule: AlertRule,
    error: TrackedError,
  ): Promise<void> {
    switch (action.type) {
      case 'log':
        log.warn(`ALERT: ${rule.name}`, {
          metadata: {
            errorMessage: error.message,
            occurrenceCount: error.occurrenceCount,
            severity: error.severity,
            context: error.context,
          },
        });
        break;

      case 'database':
        await this.saveAlertToDatabase(rule, error, action);
        break;

      case 'email':
        // In a real implementation, this would send emails
        log.info('Email alert would be sent', {
          metadata: {
            recipients: action.config.recipients,
            subject: `Alert: ${rule.name}`,
            errorMessage: error.message,
          },
        });
        break;

      case 'webhook':
        // In a real implementation, this would call webhooks
        log.info('Webhook alert would be sent', {
          metadata: {
            url: action.config.webhookUrl,
            errorMessage: error.message,
            severity: error.severity,
          },
        });
        break;
    }
  }

  /**
   * Save alert to database
   */
  private async saveAlertToDatabase(
    rule: AlertRule,
    error: TrackedError,
    action: AlertAction,
  ): Promise<void> {
    try {
      const db = databaseService.getClient();

      await db.systemLog.create({
        data: {
          level: 'warn',
          message: `ALERT: ${rule.name}`,
          service: 'error-tracking',
          metadata: {
            ruleId: rule.id,
            ruleName: rule.name,
            errorId: error.id,
            errorMessage: error.message,
            occurrenceCount: error.occurrenceCount,
            severity: error.severity,
            context: error.context,
            priority: action.config.priority || 'medium',
          },
        },
      });
    } catch (_dbError) {
      log.error('Failed to save alert to database', {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      });
    }
  }

  /**
   * Setup default alert rules
   */
  private async setupDefaultAlertRules(): Promise<void> {
    const defaultRules: Omit<AlertRule, 'id'>[] = [
      {
        name: 'Critical Errors',
        condition: {
          severity: ['critical'],
          occurrenceThreshold: 1,
        },
        actions: [
          { type: 'log', config: { priority: 'critical' } },
          { type: 'database', config: { priority: 'critical' } },
        ],
        enabled: true,
        cooldownMinutes: 5,
      },
      {
        name: 'High Error Rate',
        condition: {
          occurrenceThreshold: 10,
          timeWindowMinutes: 10,
        },
        actions: [
          { type: 'log', config: { priority: 'high' } },
          { type: 'database', config: { priority: 'high' } },
        ],
        enabled: true,
        cooldownMinutes: 15,
      },
      {
        name: 'Authentication Errors',
        condition: {
          component: 'authentication',
          occurrenceThreshold: 5,
          timeWindowMinutes: 5,
        },
        actions: [
          { type: 'log', config: { priority: 'high' } },
          { type: 'database', config: { priority: 'high' } },
        ],
        enabled: true,
        cooldownMinutes: 10,
      },
      {
        name: 'Database Errors',
        condition: {
          component: 'database',
          severity: ['high', 'critical'],
          occurrenceThreshold: 1,
        },
        actions: [
          { type: 'log', config: { priority: 'critical' } },
          { type: 'database', config: { priority: 'critical' } },
        ],
        enabled: true,
        cooldownMinutes: 5,
      },
    ];

    for (const rule of defaultRules) {
      this.addAlertRule(rule);
    }
  }

  /**
   * Load errors and rules from storage
   */
  private async loadFromStorage(): Promise<void> {
    // Implementation would load from database/cache
    // For now, we start fresh each time
    log.info('Error tracking storage loading completed');
  }

  /**
   * Save error to storage
   */
  private async saveErrorToStorage(error: TrackedError): Promise<void> {
    try {
      // Save to database for persistence
      const db = databaseService.getClient();

      await db.systemLog.create({
        data: {
          level: 'error',
          message: error.message,
          service: 'error-tracking',
          userId: error.context.userId || null,
          sessionId: error.context.sessionId || null,
          ipAddress: error.context.ipAddress || null,
          userAgent: error.context.userAgent || null,
          metadata: {
            errorId: error.id,
            fingerprint: error.fingerprint,
            type: error.type,
            severity: error.severity,
            occurrenceCount: error.occurrenceCount,
            stack: error.stack,
            context: error.context,
            tags: error.tags,
          },
        },
      });
    } catch (_dbError) {
      log.error('Failed to save error to database', {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      });
    }
  }

  /**
   * Cache recent error for quick access
   */
  private async cacheRecentError(error: TrackedError): Promise<void> {
    try {
      if (redisService.isHealthy()) {
        const cacheKey = `recent_errors:${error.fingerprint}`;
        await cache.set(cacheKey, error, { ttl: 3600 }); // 1 hour
      }
    } catch (_cacheError) {
      log.error('Failed to cache error', {
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
      });
    }
  }

  /**
   * Start cleanup interval for old errors
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupOldErrors();
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Clean up old resolved errors
   */
  private cleanupOldErrors(): void {
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    let cleanedCount = 0;

    for (const [fingerprint, error] of this.errors.entries()) {
      if (error.resolved && error.resolvedAt && error.resolvedAt < cutoffTime) {
        this.errors.delete(fingerprint);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      log.info('Cleaned up old resolved errors', {
        metadata: { cleanedCount, remainingCount: this.errors.size },
      });
    }
  }

  /**
   * Health check
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      initialized: boolean;
      errorCount: number;
      alertRulesCount: number;
      recentErrorRate: number;
    };
  } {
    const recentErrors = Array.from(this.errors.values())
      .filter(error => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return error.lastOccurrence > oneHourAgo;
      });

    const recentErrorRate = recentErrors.reduce((sum, error) => sum + error.occurrenceCount, 0);

    return {
      status: this.initialized ? 'healthy' : 'unhealthy',
      details: {
        initialized: this.initialized,
        errorCount: this.errors.size,
        alertRulesCount: this.alertRules.size,
        recentErrorRate,
      },
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      log.info('Shutting down error tracking service');

      // Save any pending data
      // Implementation would save state to persistent storage

      this.initialized = false;

      log.info('Error tracking service shut down successfully');
    } catch (_error) {
      log.error('Error during error tracking service shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Singleton instance
export const errorTrackingService = new ErrorTrackingService();

// Global error handler
export function setupGlobalErrorHandler(): void {
  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    errorTrackingService.trackError(
      new Error(`Unhandled Promise Rejection: ${reason}`),
      { component: 'global', metadata: { promise: promise.toString() } },
      'critical',
    );
  });

  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    errorTrackingService.trackError(
      error,
      { component: 'global' },
      'critical',
    );

    // Give some time for error to be tracked before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

// Convenience functions
export const trackError = errorTrackingService.trackError.bind(errorTrackingService);
export const trackSecurityIncident = errorTrackingService.trackSecurityIncident.bind(errorTrackingService);
export const getErrorStatistics = errorTrackingService.getStatistics.bind(errorTrackingService);
