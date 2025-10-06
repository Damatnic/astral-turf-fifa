/**
 * Guardian Audit Logging System
 * Enterprise-grade audit logging with SIEM integration and compliance reporting
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  source: AuditSource;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action: string;
  outcome: 'success' | 'failure' | 'unknown';
  description: string;
  details: Record<string, unknown>;
  compliance: {
    gdpr?: boolean;
    hipaa?: boolean;
    soc2?: boolean;
    iso27001?: boolean;
  };
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: [number, number];
  };
  fingerprint?: string;
  correlationId?: string;
  tags: string[];
}

export enum AuditEventType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  SYSTEM_CHANGE = 'system_change',
  SECURITY_EVENT = 'security_event',
  COMPLIANCE_EVENT = 'compliance_event',
  PERFORMANCE_EVENT = 'performance_event',
  ERROR_EVENT = 'error_event',
  BUSINESS_EVENT = 'business_event',
}

export enum AuditSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export enum AuditSource {
  WEB_APPLICATION = 'web_application',
  API_SERVER = 'api_server',
  DATABASE = 'database',
  AUTHENTICATION_SERVICE = 'authentication_service',
  FILE_SYSTEM = 'file_system',
  EXTERNAL_SERVICE = 'external_service',
  SYSTEM = 'system',
  USER = 'user',
}

export interface AuditQuery {
  startDate?: string;
  endDate?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  source?: AuditSource;
  userId?: string;
  ipAddress?: string;
  outcome?: 'success' | 'failure';
  resource?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'eventType';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditReport {
  id: string;
  title: string;
  description: string;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalEvents: number;
    eventsByType: Record<AuditEventType, number>;
    eventsBySeverity: Record<AuditSeverity, number>;
    uniqueUsers: number;
    failureRate: number;
    topResources: Array<{ resource: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
    geographicDistribution: Record<string, number>;
  };
  complianceMetrics: {
    gdprCompliant: number;
    hipaaCompliant: number;
    soc2Compliant: number;
    iso27001Compliant: number;
  };
  securityInsights: {
    suspiciousActivity: AuditEvent[];
    failedLogins: number;
    privilegeEscalations: number;
    dataBreachIndicators: number;
    anomalousPatterns: string[];
  };
  recommendations: string[];
  events: AuditEvent[];
}

export interface SIEMIntegration {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  format: 'json' | 'syslog' | 'cef' | 'leef';
  batchSize: number;
  flushInterval: number;
  retryAttempts: number;
  filters: {
    minSeverity: AuditSeverity;
    eventTypes: AuditEventType[];
    excludePatterns: string[];
  };
}

export interface AuditConfiguration {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  storage: {
    local: {
      enabled: boolean;
      directory: string;
      maxFileSize: string;
      maxFiles: string;
      datePattern: string;
    };
    database: {
      enabled: boolean;
      connectionString: string;
      tableName: string;
      indexFields: string[];
    };
    cloud: {
      enabled: boolean;
      provider: 'aws' | 'azure' | 'gcp';
      config: Record<string, unknown>;
    };
  };
  siemIntegration: SIEMIntegration;
  compliance: {
    dataRetentionDays: number;
    encryptAtRest: boolean;
    anonymizePersonalData: boolean;
    auditTrailIntegrity: boolean;
  };
  alerting: {
    enabled: boolean;
    thresholds: {
      criticalEvents: number;
      failureRate: number;
      suspiciousActivity: number;
    };
    recipients: string[];
  };
}

/**
 * Default audit configuration
 */
const DEFAULT_AUDIT_CONFIG: AuditConfiguration = {
  enabled: true,
  logLevel: 'info',
  storage: {
    local: {
      enabled: true,
      directory: './logs',
      maxFileSize: '20m',
      maxFiles: '14d',
      datePattern: 'YYYY-MM-DD',
    },
    database: {
      enabled: false,
      connectionString: '',
      tableName: 'audit_logs',
      indexFields: ['timestamp', 'eventType', 'userId', 'severity'],
    },
    cloud: {
      enabled: false,
      provider: 'aws',
      config: {},
    },
  },
  siemIntegration: {
    enabled: false,
    endpoint: '',
    apiKey: '',
    format: 'json',
    batchSize: 100,
    flushInterval: 30000, // 30 seconds
    retryAttempts: 3,
    filters: {
      minSeverity: AuditSeverity.MEDIUM,
      eventTypes: [
        AuditEventType.AUTHENTICATION,
        AuditEventType.AUTHORIZATION,
        AuditEventType.SECURITY_EVENT,
      ],
      excludePatterns: ['/health', '/metrics'],
    },
  },
  compliance: {
    dataRetentionDays: 365,
    encryptAtRest: true,
    anonymizePersonalData: true,
    auditTrailIntegrity: true,
  },
  alerting: {
    enabled: true,
    thresholds: {
      criticalEvents: 10,
      failureRate: 0.05, // 5%
      suspiciousActivity: 5,
    },
    recipients: ['security@company.com'],
  },
};

/**
 * Guardian Audit Logging Service
 * Comprehensive audit logging with compliance and security features
 */
class AuditLoggingService {
  private config: AuditConfiguration;
  private logger!: winston.Logger;
  private eventBuffer: AuditEvent[] = [];
  private siemBuffer: AuditEvent[] = [];
  private correlationMap: Map<string, string[]> = new Map();
  private eventCount = 0;
  private lastFlush = Date.now();

  constructor(config: Partial<AuditConfiguration> = {}) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };
    this.initializeLogger();
    this.startPeriodicTasks();
  }

  /**
   * Initialize Winston logger with multiple transports
   */
  private initializeLogger(): void {
    const transports: winston.transport[] = [];

    // Console transport for development
    if (process.env.NODE_ENV === 'development') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
            })
          ),
        })
      );
    }

    // File transport for audit logs
    if (this.config.storage.local.enabled) {
      transports.push(
        new DailyRotateFile({
          filename: `${this.config.storage.local.directory}/audit-%DATE%.log`,
          datePattern: this.config.storage.local.datePattern,
          maxSize: this.config.storage.local.maxFileSize,
          maxFiles: this.config.storage.local.maxFiles,
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        })
      );

      // Separate file for security events
      transports.push(
        new DailyRotateFile({
          filename: `${this.config.storage.local.directory}/security-%DATE%.log`,
          datePattern: this.config.storage.local.datePattern,
          maxSize: this.config.storage.local.maxFileSize,
          maxFiles: this.config.storage.local.maxFiles,
          level: 'warn',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        })
      );

      // Separate file for compliance events
      transports.push(
        new DailyRotateFile({
          filename: `${this.config.storage.local.directory}/compliance-%DATE%.log`,
          datePattern: this.config.storage.local.datePattern,
          maxSize: this.config.storage.local.maxFileSize,
          maxFiles: this.config.storage.local.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format.printf(info => {
              // Only log compliance-related events
              const event = info.meta as AuditEvent;
              if (
                event &&
                (event.compliance.gdpr ||
                  event.compliance.hipaa ||
                  event.compliance.soc2 ||
                  event.compliance.iso27001)
              ) {
                return JSON.stringify(info);
              }
              return '';
            })
          ),
        })
      );
    }

    this.logger = winston.createLogger({
      level: this.config.logLevel,
      transports,
      exitOnError: false,
    });
  }

  /**
   * Log an audit event
   */
  logEvent(event: Partial<AuditEvent>): string {
    if (!this.config.enabled) {
      return '';
    }

    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: event.eventType || AuditEventType.SYSTEM_CHANGE,
      severity: event.severity || AuditSeverity.INFO,
      source: event.source || AuditSource.SYSTEM,
      action: event.action || 'unknown',
      outcome: event.outcome || 'unknown',
      description: event.description || '',
      details: event.details || {},
      compliance: event.compliance || {},
      tags: event.tags || [],
      ...event,
    };

    // Generate fingerprint for deduplication
    auditEvent.fingerprint = this.generateFingerprint(auditEvent);

    // Add to correlation map if correlation ID provided
    if (auditEvent.correlationId) {
      const events = this.correlationMap.get(auditEvent.correlationId) || [];
      events.push(auditEvent.id);
      this.correlationMap.set(auditEvent.correlationId, events);
    }

    // Log to Winston
    this.logger.log(this.mapSeverityToLogLevel(auditEvent.severity), auditEvent.description, {
      meta: auditEvent,
    });

    // Add to buffers
    this.eventBuffer.push(auditEvent);

    if (this.shouldSendToSIEM(auditEvent)) {
      this.siemBuffer.push(auditEvent);
    }

    // Check for immediate alerts
    this.checkAlertThresholds(auditEvent);

    this.eventCount++;

    return auditEvent.id;
  }

  /**
   * Log authentication event
   */
  logAuthentication(
    action: 'login' | 'logout' | 'signup' | 'password_reset' | 'mfa_challenge',
    outcome: 'success' | 'failure',
    details: {
      userId?: string;
      email?: string;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      method?: string;
      reason?: string;
    }
  ): string {
    return this.logEvent({
      eventType: AuditEventType.AUTHENTICATION,
      severity: outcome === 'failure' ? AuditSeverity.MEDIUM : AuditSeverity.INFO,
      source: AuditSource.AUTHENTICATION_SERVICE,
      userId: details.userId,
      sessionId: details.sessionId,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      action: `auth_${action}`,
      outcome,
      description: `User ${action} ${outcome}`,
      details,
      compliance: {
        gdpr: true,
        soc2: true,
        iso27001: true,
      },
      tags: ['authentication', action, outcome],
    });
  }

  /**
   * Log data access event
   */
  logDataAccess(
    resource: string,
    action: 'read' | 'write' | 'delete' | 'export' | 'import',
    outcome: 'success' | 'failure',
    details: {
      userId?: string;
      dataType?: string;
      recordCount?: number;
      classification?: string;
      ipAddress?: string;
      reason?: string;
    }
  ): string {
    return this.logEvent({
      eventType: AuditEventType.DATA_ACCESS,
      severity:
        action === 'delete' || action === 'export' ? AuditSeverity.MEDIUM : AuditSeverity.INFO,
      source: AuditSource.WEB_APPLICATION,
      userId: details.userId,
      ipAddress: details.ipAddress,
      resource,
      action: `data_${action}`,
      outcome,
      description: `${action} operation on ${resource}`,
      details,
      compliance: {
        gdpr: true,
        hipaa: details.dataType === 'personal' || details.dataType === 'medical',
        soc2: true,
        iso27001: true,
      },
      tags: ['data_access', action, details.dataType || 'unknown'].filter(Boolean),
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    eventType:
      | 'attack_detected'
      | 'vulnerability_found'
      | 'policy_violation'
      | 'suspicious_activity',
    description: string,
    details: {
      threatLevel?: 'low' | 'medium' | 'high' | 'critical';
      attackVector?: string;
      ipAddress?: string;
      userAgent?: string;
      payload?: string;
      mitigationApplied?: string;
    }
  ): string {
    const severity = this.mapThreatLevelToSeverity(details.threatLevel || 'medium');

    return this.logEvent({
      eventType: AuditEventType.SECURITY_EVENT,
      severity,
      source: AuditSource.SYSTEM,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      action: `security_${eventType}`,
      outcome: 'unknown',
      description,
      details,
      compliance: {
        soc2: true,
        iso27001: true,
      },
      tags: ['security', eventType, details.threatLevel || 'unknown'],
    });
  }

  /**
   * Log system change event
   */
  logSystemChange(
    component: string,
    action: 'create' | 'update' | 'delete' | 'configure',
    outcome: 'success' | 'failure',
    details: {
      userId?: string;
      changes?: Record<string, unknown>;
      previousValue?: unknown;
      newValue?: unknown;
      ipAddress?: string;
    }
  ): string {
    return this.logEvent({
      eventType: AuditEventType.SYSTEM_CHANGE,
      severity: AuditSeverity.MEDIUM,
      source: AuditSource.SYSTEM,
      userId: details.userId,
      ipAddress: details.ipAddress,
      resource: component,
      action: `system_${action}`,
      outcome,
      description: `System ${action} on ${component}`,
      details,
      compliance: {
        soc2: true,
        iso27001: true,
      },
      tags: ['system_change', action, component],
    });
  }

  /**
   * Query audit events
   */
  async queryEvents(query: AuditQuery): Promise<{
    events: AuditEvent[];
    total: number;
    hasMore: boolean;
  }> {
    // Filter events from buffer (in production, this would query the database)
    let filteredEvents = [...this.eventBuffer];

    if (query.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= query.endDate!);
    }

    if (query.eventType) {
      filteredEvents = filteredEvents.filter(e => e.eventType === query.eventType);
    }

    if (query.severity) {
      filteredEvents = filteredEvents.filter(e => e.severity === query.severity);
    }

    if (query.source) {
      filteredEvents = filteredEvents.filter(e => e.source === query.source);
    }

    if (query.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === query.userId);
    }

    if (query.ipAddress) {
      filteredEvents = filteredEvents.filter(e => e.ipAddress === query.ipAddress);
    }

    if (query.outcome) {
      filteredEvents = filteredEvents.filter(e => e.outcome === query.outcome);
    }

    if (query.resource) {
      filteredEvents = filteredEvents.filter(e => e.resource?.includes(query.resource!));
    }

    if (query.tags) {
      filteredEvents = filteredEvents.filter(e => query.tags!.some(tag => e.tags.includes(tag)));
    }

    // Sort events
    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';

    filteredEvents.sort((a, b) => {
      let valueA: any = a[sortBy as keyof AuditEvent];
      let valueB: any = b[sortBy as keyof AuditEvent];

      if (sortBy === 'timestamp') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    const limit = query.limit || 100;
    const offset = query.offset || 0;
    const total = filteredEvents.length;
    const events = filteredEvents.slice(offset, offset + limit);

    return {
      events,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    title: string,
    startDate: string,
    endDate: string
  ): Promise<AuditReport> {
    const query: AuditQuery = { startDate, endDate };
    const { events } = await this.queryEvents(query);

    const report: AuditReport = {
      id: this.generateEventId(),
      title,
      description: `Compliance audit report for period ${startDate} to ${endDate}`,
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      summary: {
        totalEvents: events.length,
        eventsByType: this.countByField(events, 'eventType'),
        eventsBySeverity: this.countByField(events, 'severity'),
        uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
        failureRate: events.filter(e => e.outcome === 'failure').length / events.length,
        topResources: this.getTopResources(events),
        topUsers: this.getTopUsers(events),
        geographicDistribution: this.getGeographicDistribution(events),
      },
      complianceMetrics: {
        gdprCompliant: events.filter(e => e.compliance.gdpr).length,
        hipaaCompliant: events.filter(e => e.compliance.hipaa).length,
        soc2Compliant: events.filter(e => e.compliance.soc2).length,
        iso27001Compliant: events.filter(e => e.compliance.iso27001).length,
      },
      securityInsights: {
        suspiciousActivity: events.filter(
          e =>
            e.eventType === AuditEventType.SECURITY_EVENT ||
            e.severity === AuditSeverity.HIGH ||
            e.severity === AuditSeverity.CRITICAL
        ),
        failedLogins: events.filter(e => e.action === 'auth_login' && e.outcome === 'failure')
          .length,
        privilegeEscalations: events.filter(
          e => e.action.includes('privilege') || e.action.includes('admin')
        ).length,
        dataBreachIndicators: events.filter(
          e => e.tags.includes('data_breach') || e.severity === AuditSeverity.CRITICAL
        ).length,
        anomalousPatterns: this.detectAnomalousPatterns(events),
      },
      recommendations: this.generateRecommendations(events),
      events,
    };

    // Log report generation
    this.logEvent({
      eventType: AuditEventType.COMPLIANCE_EVENT,
      severity: AuditSeverity.INFO,
      source: AuditSource.SYSTEM,
      action: 'report_generation',
      outcome: 'success',
      description: `Generated compliance report: ${title}`,
      details: {
        reportId: report.id,
        period: report.period,
        eventCount: events.length,
      },
      compliance: {
        soc2: true,
        iso27001: true,
      },
      tags: ['compliance', 'report', 'audit'],
    });

    return report;
  }

  /**
   * Export audit logs in various formats
   */
  async exportLogs(query: AuditQuery, format: 'json' | 'csv' | 'xml' | 'syslog'): Promise<string> {
    const { events } = await this.queryEvents(query);

    switch (format) {
      case 'json':
        return JSON.stringify(events, null, 2);

      case 'csv':
        return this.convertToCSV(events);

      case 'xml':
        return this.convertToXML(events);

      case 'syslog':
        return this.convertToSyslog(events);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get audit statistics
   */
  getStatistics(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): {
    eventCount: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    failureRate: number;
    topUsers: Array<{ userId: string; count: number }>;
    recentSecurityEvents: AuditEvent[];
    alertsTriggered: number;
  } {
    const now = new Date();
    const timeframeMs = this.getTimeframeMs(timeframe);
    const cutoff = new Date(now.getTime() - timeframeMs);

    const recentEvents = this.eventBuffer.filter(e => new Date(e.timestamp) >= cutoff);

    return {
      eventCount: recentEvents.length,
      eventsByType: this.countByField(recentEvents, 'eventType'),
      eventsBySeverity: this.countByField(recentEvents, 'severity'),
      failureRate: recentEvents.filter(e => e.outcome === 'failure').length / recentEvents.length,
      topUsers: this.getTopUsers(recentEvents).slice(0, 10),
      recentSecurityEvents: recentEvents
        .filter(e => e.eventType === AuditEventType.SECURITY_EVENT)
        .slice(0, 20),
      alertsTriggered: recentEvents.filter(
        e => e.severity === AuditSeverity.CRITICAL || e.severity === AuditSeverity.HIGH
      ).length,
    };
  }

  // Private helper methods
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateFingerprint(event: AuditEvent): string {
    const key = `${event.eventType}_${event.action}_${event.resource}_${event.userId}_${event.ipAddress}`;
    return Buffer.from(key).toString('base64');
  }

  private mapSeverityToLogLevel(severity: AuditSeverity): string {
    const mapping = {
      [AuditSeverity.CRITICAL]: 'error',
      [AuditSeverity.HIGH]: 'error',
      [AuditSeverity.MEDIUM]: 'warn',
      [AuditSeverity.LOW]: 'info',
      [AuditSeverity.INFO]: 'info',
    };
    return mapping[severity] || 'info';
  }

  private mapThreatLevelToSeverity(threatLevel: string): AuditSeverity {
    const mapping = {
      critical: AuditSeverity.CRITICAL,
      high: AuditSeverity.HIGH,
      medium: AuditSeverity.MEDIUM,
      low: AuditSeverity.LOW,
    };
    return mapping[threatLevel as keyof typeof mapping] || AuditSeverity.MEDIUM;
  }

  private shouldSendToSIEM(event: AuditEvent): boolean {
    if (!this.config.siemIntegration.enabled) {
      return false;
    }

    const config = this.config.siemIntegration;

    // Check minimum severity
    const severityLevels = [
      AuditSeverity.INFO,
      AuditSeverity.LOW,
      AuditSeverity.MEDIUM,
      AuditSeverity.HIGH,
      AuditSeverity.CRITICAL,
    ];
    const eventSeverityIndex = severityLevels.indexOf(event.severity);
    const minSeverityIndex = severityLevels.indexOf(config.filters.minSeverity);

    if (eventSeverityIndex < minSeverityIndex) {
      return false;
    }

    // Check event type filter
    if (
      config.filters.eventTypes.length > 0 &&
      !config.filters.eventTypes.includes(event.eventType)
    ) {
      return false;
    }

    // Check exclude patterns
    const eventString = JSON.stringify(event);
    if (config.filters.excludePatterns.some(pattern => eventString.includes(pattern))) {
      return false;
    }

    return true;
  }

  private checkAlertThresholds(event: AuditEvent): void {
    if (!this.config.alerting.enabled) {
      return;
    }

    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const recentEvents = this.eventBuffer.filter(e => now - new Date(e.timestamp).getTime() < hour);

    // Check critical events threshold
    const criticalEvents = recentEvents.filter(e => e.severity === AuditSeverity.CRITICAL);
    if (criticalEvents.length >= this.config.alerting.thresholds.criticalEvents) {
      this.sendAlert('Critical events threshold exceeded', {
        count: criticalEvents.length,
        threshold: this.config.alerting.thresholds.criticalEvents,
        events: criticalEvents.slice(-5),
      });
    }

    // Check failure rate threshold
    const totalRequests = recentEvents.filter(
      e =>
        e.eventType === AuditEventType.AUTHENTICATION || e.eventType === AuditEventType.DATA_ACCESS
    );
    const failures = totalRequests.filter(e => e.outcome === 'failure');
    const failureRate = failures.length / totalRequests.length;

    if (failureRate >= this.config.alerting.thresholds.failureRate) {
      this.sendAlert('High failure rate detected', {
        failureRate: (failureRate * 100).toFixed(2) + '%',
        threshold: (this.config.alerting.thresholds.failureRate * 100).toFixed(2) + '%',
        failures: failures.length,
        total: totalRequests.length,
      });
    }

    // Check suspicious activity threshold
    const suspiciousEvents = recentEvents.filter(
      e =>
        e.eventType === AuditEventType.SECURITY_EVENT ||
        e.severity === AuditSeverity.HIGH ||
        e.severity === AuditSeverity.CRITICAL
    );
    if (suspiciousEvents.length >= this.config.alerting.thresholds.suspiciousActivity) {
      this.sendAlert('Suspicious activity threshold exceeded', {
        count: suspiciousEvents.length,
        threshold: this.config.alerting.thresholds.suspiciousActivity,
        events: suspiciousEvents.slice(-3),
      });
    }
  }

  private sendAlert(message: string, details: Record<string, unknown>): void {
    // Log the alert
    this.logEvent({
      eventType: AuditEventType.SECURITY_EVENT,
      severity: AuditSeverity.HIGH,
      source: AuditSource.SYSTEM,
      action: 'alert_triggered',
      outcome: 'success',
      description: `Security alert: ${message}`,
      details,
      tags: ['alert', 'security', 'threshold'],
    });

    // In a real implementation, send email/SMS/webhook notifications
    console.error(`[SECURITY ALERT] ${message}`, details);
  }

  private countByField<T extends Record<string, any>>(
    items: T[],
    field: keyof T
  ): Record<string, number> {
    return items.reduce(
      (acc, item) => {
        const value = String(item[field]);
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private getTopResources(events: AuditEvent[]): Array<{ resource: string; count: number }> {
    const resourceCounts = events
      .filter(e => e.resource)
      .reduce(
        (acc, e) => {
          acc[e.resource!] = (acc[e.resource!] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    return Object.entries(resourceCounts)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopUsers(events: AuditEvent[]): Array<{ userId: string; count: number }> {
    const userCounts = events
      .filter(e => e.userId)
      .reduce(
        (acc, e) => {
          acc[e.userId!] = (acc[e.userId!] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    return Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getGeographicDistribution(events: AuditEvent[]): Record<string, number> {
    return events
      .filter(e => e.geolocation?.country)
      .reduce(
        (acc, e) => {
          const country = e.geolocation!.country!;
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
  }

  private detectAnomalousPatterns(events: AuditEvent[]): string[] {
    const patterns: string[] = [];

    // Detect unusual login times
    const loginEvents = events.filter(e => e.action === 'auth_login');
    const nightLogins = loginEvents.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return hour >= 22 || hour <= 6;
    });
    if (nightLogins.length > loginEvents.length * 0.2) {
      patterns.push('High number of after-hours logins detected');
    }

    // Detect rapid consecutive failures
    const failures = events.filter(e => e.outcome === 'failure');
    if (failures.length > 0) {
      const rapidFailures = failures.filter((failure, index) => {
        if (index === 0) {
          return false;
        }
        const prevFailure = failures[index - 1];
        const timeDiff =
          new Date(failure.timestamp).getTime() - new Date(prevFailure.timestamp).getTime();
        return timeDiff < 60000; // Less than 1 minute
      });
      if (rapidFailures.length > 5) {
        patterns.push('Rapid consecutive failures detected - possible brute force attack');
      }
    }

    // Detect privilege escalation attempts
    const privilegeEvents = events.filter(
      e =>
        e.action.includes('admin') ||
        e.action.includes('privilege') ||
        e.tags.includes('privilege_escalation')
    );
    if (privilegeEvents.length > 0) {
      patterns.push('Privilege escalation attempts detected');
    }

    return patterns;
  }

  private generateRecommendations(events: AuditEvent[]): string[] {
    const recommendations: string[] = [];
    const failures = events.filter(e => e.outcome === 'failure');
    const securityEvents = events.filter(e => e.eventType === AuditEventType.SECURITY_EVENT);

    if (failures.length / events.length > 0.1) {
      recommendations.push(
        'High failure rate detected - review authentication and authorization policies'
      );
    }

    if (securityEvents.length > 0) {
      recommendations.push(
        'Security events detected - review security monitoring and incident response procedures'
      );
    }

    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    if (uniqueUsers < 10) {
      recommendations.push('Low user activity - consider user adoption and training programs');
    }

    const nightTimeEvents = events.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return hour >= 22 || hour <= 6;
    });
    if (nightTimeEvents.length > events.length * 0.3) {
      recommendations.push(
        'High after-hours activity - review access controls and monitoring policies'
      );
    }

    return recommendations;
  }

  private convertToCSV(events: AuditEvent[]): string {
    const headers = [
      'id',
      'timestamp',
      'eventType',
      'severity',
      'source',
      'userId',
      'ipAddress',
      'action',
      'outcome',
      'description',
      'resource',
    ];

    const csvRows = [
      headers.join(','),
      ...events.map(event =>
        headers
          .map(header => {
            const value = event[header as keyof AuditEvent];
            return typeof value === 'string'
              ? `"${value.replace(/"/g, '""')}"`
              : String(value || '');
          })
          .join(',')
      ),
    ];

    return csvRows.join('\n');
  }

  private convertToXML(events: AuditEvent[]): string {
    const xmlEvents = events
      .map(event => {
        const eventXml = Object.entries(event)
          .map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              return `<${key}><![CDATA[${JSON.stringify(value)}]]></${key}>`;
            }
            return `<${key}><![CDATA[${String(value)}]]></${key}>`;
          })
          .join('\n    ');

        return `  <event>\n    ${eventXml}\n  </event>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<auditLog>\n${xmlEvents}\n</auditLog>`;
  }

  private convertToSyslog(events: AuditEvent[]): string {
    return events
      .map(event => {
        const priority = this.getSyslogPriority(event.severity);
        const timestamp = new Date(event.timestamp).toISOString();
        const hostname = 'astral-turf';
        const appName = 'audit';
        const message = `${event.action} ${event.outcome} - ${event.description}`;

        return `<${priority}>${timestamp} ${hostname} ${appName}: ${message}`;
      })
      .join('\n');
  }

  private getSyslogPriority(severity: AuditSeverity): number {
    // RFC 5424 priorities (facility=16 for local use, severity 0-7)
    const severityMap = {
      [AuditSeverity.CRITICAL]: 130, // 16*8 + 2 (critical)
      [AuditSeverity.HIGH]: 131, // 16*8 + 3 (error)
      [AuditSeverity.MEDIUM]: 132, // 16*8 + 4 (warning)
      [AuditSeverity.LOW]: 134, // 16*8 + 6 (info)
      [AuditSeverity.INFO]: 134, // 16*8 + 6 (info)
    };
    return severityMap[severity] || 134;
  }

  private getTimeframeMs(timeframe: '1h' | '24h' | '7d' | '30d'): number {
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    return timeframes[timeframe];
  }

  private startPeriodicTasks(): void {
    // Flush SIEM buffer periodically
    setInterval(() => {
      if (this.siemBuffer.length > 0) {
        this.flushToSIEM();
      }
    }, this.config.siemIntegration.flushInterval);

    // Cleanup old events from memory buffer
    setInterval(
      () => {
        const retentionMs = this.config.compliance.dataRetentionDays * 24 * 60 * 60 * 1000;
        const cutoff = Date.now() - retentionMs;

        this.eventBuffer = this.eventBuffer.filter(e => new Date(e.timestamp).getTime() > cutoff);
      },
      24 * 60 * 60 * 1000
    ); // Daily cleanup
  }

  private async flushToSIEM(): Promise<void> {
    if (!this.config.siemIntegration.enabled || this.siemBuffer.length === 0) {
      return;
    }

    try {
      const batch = this.siemBuffer.splice(0, this.config.siemIntegration.batchSize);

      // Format events for SIEM
      let payload: string;
      switch (this.config.siemIntegration.format) {
        case 'json':
          payload = JSON.stringify(batch);
          break;
        case 'syslog':
          payload = this.convertToSyslog(batch);
          break;
        case 'cef':
          payload = this.convertToCEF(batch);
          break;
        case 'leef':
          payload = this.convertToLEEF(batch);
          break;
        default:
          payload = JSON.stringify(batch);
      }

      // Send to SIEM endpoint (implementation would depend on SIEM type)
      console.info(`[AUDIT] Sending ${batch.length} events to SIEM`);
    } catch (error) {
      console.error('[AUDIT] Failed to send events to SIEM:', error);
      // Re-add events to buffer for retry
      this.siemBuffer.unshift(...this.siemBuffer);
    }
  }

  private convertToCEF(events: AuditEvent[]): string {
    // Common Event Format (CEF) for SIEM integration
    return events
      .map(event => {
        const version = '0';
        const deviceVendor = 'Astral Turf';
        const deviceProduct = 'Football Tactics App';
        const deviceVersion = '1.0';
        const signatureId = event.eventType;
        const name = event.description;
        const severity = this.getCEFSeverity(event.severity);

        const extensions = [
          `rt=${new Date(event.timestamp).getTime()}`,
          `src=${event.ipAddress || 'unknown'}`,
          `suser=${event.userId || 'unknown'}`,
          `act=${event.action}`,
          `outcome=${event.outcome}`,
        ].join(' ');

        return `CEF:${version}|${deviceVendor}|${deviceProduct}|${deviceVersion}|${signatureId}|${name}|${severity}|${extensions}`;
      })
      .join('\n');
  }

  private convertToLEEF(events: AuditEvent[]): string {
    // Log Event Extended Format (LEEF) for IBM QRadar
    return events
      .map(event => {
        const version = '2.0';
        const vendor = 'Astral Turf';
        const product = 'Football Tactics App';
        const version2 = '1.0';
        const eventId = event.eventType;

        const attributes = [
          `devTime=${new Date(event.timestamp).toISOString()}`,
          `src=${event.ipAddress || 'unknown'}`,
          `usrName=${event.userId || 'unknown'}`,
          `cat=${event.action}`,
          `severity=${this.getLEEFSeverity(event.severity)}`,
          `msg=${event.description}`,
        ].join('\t');

        return `LEEF:${version}|${vendor}|${product}|${version2}|${eventId}|${attributes}`;
      })
      .join('\n');
  }

  private getCEFSeverity(severity: AuditSeverity): number {
    const mapping = {
      [AuditSeverity.CRITICAL]: 10,
      [AuditSeverity.HIGH]: 8,
      [AuditSeverity.MEDIUM]: 5,
      [AuditSeverity.LOW]: 3,
      [AuditSeverity.INFO]: 1,
    };
    return mapping[severity] || 1;
  }

  private getLEEFSeverity(severity: AuditSeverity): number {
    const mapping = {
      [AuditSeverity.CRITICAL]: 9,
      [AuditSeverity.HIGH]: 7,
      [AuditSeverity.MEDIUM]: 5,
      [AuditSeverity.LOW]: 3,
      [AuditSeverity.INFO]: 1,
    };
    return mapping[severity] || 1;
  }
}

// Export singleton instance
export const auditLogger = new AuditLoggingService();

// Export convenience functions
export const logAuthentication = (
  action: 'login' | 'logout' | 'signup' | 'password_reset' | 'mfa_challenge',
  outcome: 'success' | 'failure',
  details: any
) => auditLogger.logAuthentication(action, outcome, details);

export const logDataAccess = (
  resource: string,
  action: 'read' | 'write' | 'delete' | 'export' | 'import',
  outcome: 'success' | 'failure',
  details: any
) => auditLogger.logDataAccess(resource, action, outcome, details);

export const logSecurityEvent = (
  eventType: 'attack_detected' | 'vulnerability_found' | 'policy_violation' | 'suspicious_activity',
  description: string,
  details: any
) => auditLogger.logSecurityEvent(eventType, description, details);

export const logSystemChange = (
  component: string,
  action: 'create' | 'update' | 'delete' | 'configure',
  outcome: 'success' | 'failure',
  details: any
) => auditLogger.logSystemChange(component, action, outcome, details);

export const queryAuditEvents = (query: AuditQuery) => auditLogger.queryEvents(query);

export const generateComplianceReport = (title: string, startDate: string, endDate: string) =>
  auditLogger.generateComplianceReport(title, startDate, endDate);

export const getAuditStatistics = (timeframe?: '1h' | '24h' | '7d' | '30d') =>
  auditLogger.getStatistics(timeframe);
