/**
 * Enhanced Logging Service
 *
 * Production-ready structured logging with multiple transports,
 * log rotation, and external storage capabilities.
 */

import winston, { Logger, LoggerOptions } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { redisService } from './redisService';
import { databaseService } from './databaseService';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, unknown>;
  sensitive?: boolean;
  performance?: {
    duration: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
}

export interface SecurityLogContext extends LogContext {
  securityEventType: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threatLevel?: 'info' | 'warning' | 'danger';
  remediationRequired?: boolean;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  SECURITY_SCAN = 'SECURITY_SCAN',
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

class LoggingService {
  private logger: Logger;
  private securityLogger: Logger;
  private auditLogger: Logger;
  private performanceLogger: Logger;
  private initialized = false;
  private logBuffer: unknown[] = [];
  private bufferFlushInterval: unknown | null = null;

  constructor() {
    this.initializeLoggers();
  }

  /**
   * Initialize all logger instances with different transports
   */
  private initializeLoggers(): void {
    try {
      const baseFormat = winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.metadata({
          fillExcept: ['message', 'level', 'timestamp'],
        }),
      );

      const consoleFormat = winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        }),
      );

      // Main application logger
      this.logger = winston.createLogger({
        level: this.getLogLevel(),
        format: baseFormat,
        defaultMeta: {
          service: 'astral-turf',
          environment: process.env.NODE_ENV || 'development',
          version: process.env.APP_VERSION || '1.0.0',
        },
        transports: [
          // Console transport
          new winston.transports.Console({
            format: consoleFormat,
            level: 'info',
          }),

          // File transport with rotation
          new DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            createSymlink: true,
            symlinkName: 'application-current.log',
          }),

          // Error file transport
          new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '90d',
            level: 'error',
            createSymlink: true,
            symlinkName: 'error-current.log',
          }),
        ],
      });

      // Security logger
      this.securityLogger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          baseFormat,
          winston.format.label({ label: 'SECURITY' }),
        ),
        defaultMeta: {
          service: 'astral-turf-security',
          environment: process.env.NODE_ENV || 'development',
        },
        transports: [
          new winston.transports.Console({
            format: consoleFormat,
            level: 'warn',
          }),
          new DailyRotateFile({
            filename: 'logs/security-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '50m',
            maxFiles: '365d', // Keep security logs for 1 year
            createSymlink: true,
            symlinkName: 'security-current.log',
          }),
        ],
      });

      // Audit logger
      this.auditLogger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          baseFormat,
          winston.format.label({ label: 'AUDIT' }),
        ),
        defaultMeta: {
          service: 'astral-turf-audit',
          environment: process.env.NODE_ENV || 'development',
        },
        transports: [
          new DailyRotateFile({
            filename: 'logs/audit-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '100m',
            maxFiles: '2555d', // Keep audit logs for 7 years (compliance)
            createSymlink: true,
            symlinkName: 'audit-current.log',
          }),
        ],
      });

      // Performance logger
      this.performanceLogger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          baseFormat,
          winston.format.label({ label: 'PERFORMANCE' }),
        ),
        defaultMeta: {
          service: 'astral-turf-performance',
          environment: process.env.NODE_ENV || 'development',
        },
        transports: [
          new DailyRotateFile({
            filename: 'logs/performance-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            createSymlink: true,
            symlinkName: 'performance-current.log',
          }),
        ],
      });

      // Setup error handlers
      this.setupErrorHandlers();

      // Start buffer flush interval
      this.startBufferFlush();

      this.initialized = true;
      this.logger.info('Logging service initialized successfully', {
        logLevel: this.getLogLevel(),
        environment: process.env.NODE_ENV,
      });
    } catch (_error) {
      console.error('Failed to initialize logging service:', error);
      // Fallback to console logging
      this.createFallbackLogger();
    }
  }

  /**
   * Setup error handlers for all loggers
   */
  private setupErrorHandlers(): void {
    const loggers = [this.logger, this.securityLogger, this.auditLogger, this.performanceLogger];

    loggers.forEach((logger, index) => {
      logger.on('error', (error) => {
        console.error(`Logger ${index} error:`, error);
      });
    });
  }

  /**
   * Create fallback logger if initialization fails
   */
  private createFallbackLogger(): void {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [
        new winston.transports.Console(),
      ],
    });

    this.securityLogger = this.logger;
    this.auditLogger = this.logger;
    this.performanceLogger = this.logger;
  }

  /**
   * Get appropriate log level based on environment
   */
  private getLogLevel(): string {
    const env = process.env.NODE_ENV || 'development';
    const logLevel = process.env.LOG_LEVEL;

    if (logLevel) {
      return logLevel.toLowerCase();
    }

    switch (env) {
      case 'production':
        return 'info';
      case 'staging':
        return 'debug';
      case 'development':
      default:
        return 'debug';
    }
  }

  /**
   * Start buffer flush interval for external storage
   */
  private startBufferFlush(): void {
    const flushIntervalMs = parseInt(process.env.LOG_FLUSH_INTERVAL_MS || '30000'); // 30 seconds

    this.bufferFlushInterval = setInterval(() => {
      this.flushLogBuffer();
    }, flushIntervalMs);
  }

  /**
   * Flush log buffer to external storage
   */
  private async flushLogBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Store in Redis for real-time monitoring (with TTL)
      if (redisService.isHealthy()) {
        await redisService.set('logs:recent', logsToFlush, { ttl: 3600 }); // 1 hour
      }

      // Store critical logs in database for long-term storage
      const criticalLogs = logsToFlush.filter(log =>
        log.level === 'error' ||
        log.securityEventType ||
        log.metadata?.critical,
      );

      if (criticalLogs.length > 0) {
        await this.storeCriticalLogs(criticalLogs);
      }
    } catch (_error) {
      this.logger.error('Failed to flush log buffer', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bufferSize: logsToFlush.length,
      });
    }
  }

  /**
   * Store critical logs in database
   */
  private async storeCriticalLogs(logs: unknown[]): Promise<void> {
    try {
      const db = databaseService.getClient();

      const logEntries = logs.map(log => ({
        level: log.level,
        message: log.message,
        timestamp: new Date(log.timestamp),
        service: log.service,
        userId: log.userId || null,
        sessionId: log.sessionId || null,
        ipAddress: log.ipAddress || null,
        userAgent: log.userAgent || null,
        metadata: log.metadata || {},
        securityEventType: log.securityEventType || null,
      }));

      await db.systemLog.createMany({
        data: logEntries,
      });
    } catch (_error) {
      this.logger.error('Failed to store critical logs in database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        logCount: logs.length,
      });
    }
  }

  /**
   * Add log entry to buffer for external storage
   */
  private addToBuffer(level: string, message: string, context?: LogContext): void {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: 'astral-turf',
      ...context,
    };

    this.logBuffer.push(logEntry);

    // If buffer gets too large, flush immediately
    if (this.logBuffer.length >= 100) {
      this.flushLogBuffer();
    }
  }

  /**
   * Public logging methods
   */

  error(message: string, context?: LogContext): void {
    if (!this.initialized) {return;}

    this.logger.error(message, context);
    this.addToBuffer('error', message, context);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.initialized) {return;}

    this.logger.warn(message, context);
    this.addToBuffer('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    if (!this.initialized) {return;}

    this.logger.info(message, context);
    this.addToBuffer('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    if (!this.initialized) {return;}

    this.logger.debug(message, context);

    // Only buffer debug logs in development
    if (process.env.NODE_ENV === 'development') {
      this.addToBuffer('debug', message, context);
    }
  }

  /**
   * Security logging methods
   */

  logSecurityEvent(
    eventType: SecurityEventType,
    message: string,
    context: Partial<SecurityLogContext> = {},
  ): void {
    if (!this.initialized) {return;}

    const securityContext: SecurityLogContext = {
      securityEventType: eventType,
      severity: context.severity || 'medium',
      threatLevel: context.threatLevel || 'info',
      remediationRequired: context.remediationRequired || false,
      ...context,
    };

    this.securityLogger.warn(message, securityContext);
    this.addToBuffer('security', message, securityContext);

    // Log critical security events to audit log as well
    if (securityContext.severity === 'critical' || securityContext.severity === 'high') {
      this.auditLogger.error(`CRITICAL SECURITY EVENT: ${message}`, securityContext);
    }
  }

  /**
   * Audit logging methods
   */

  logAuditEvent(message: string, context: LogContext): void {
    if (!this.initialized) {return;}

    const auditContext = {
      ...context,
      auditTrail: true,
      compliance: true,
    };

    this.auditLogger.info(message, auditContext);
    this.addToBuffer('audit', message, auditContext);
  }

  /**
   * Performance logging methods
   */

  logPerformanceMetric(
    operation: string,
    duration: number,
    context: Partial<LogContext> = {},
  ): void {
    if (!this.initialized) {return;}

    const performanceContext: LogContext = {
      ...context,
      performance: {
        duration,
        memoryUsage: process.memoryUsage().heapUsed,
        ...context.performance,
      },
    };

    this.performanceLogger.info(`Performance: ${operation}`, performanceContext);

    // Only buffer performance logs if duration is significant or in development
    if (duration > 1000 || process.env.NODE_ENV === 'development') {
      this.addToBuffer('performance', `Performance: ${operation}`, performanceContext);
    }
  }

  /**
   * HTTP request logging
   */

  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: Partial<LogContext> = {},
  ): void {
    if (!this.initialized) {return;}

    const level = statusCode >= 400 ? 'warn' : 'info';
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;

    const httpContext: LogContext = {
      ...context,
      action: 'HTTP_REQUEST',
      metadata: {
        method,
        url,
        statusCode,
        duration,
        ...context.metadata,
      },
      performance: {
        duration,
        ...context.performance,
      },
    };

    this.logger.log(level, message, httpContext);
    this.addToBuffer('http', message, httpContext);
  }

  /**
   * Query log aggregation for monitoring
   */

  async getRecentLogs(
    level?: LogLevel,
    limit: number = 100,
    offset: number = 0,
  ): Promise<unknown[]> {
    try {
      // Try Redis first for recent logs
      if (redisService.isHealthy()) {
        const recentLogs = await redisService.get('logs:recent');
        if (recentLogs && Array.isArray(recentLogs)) {
          let filteredLogs = recentLogs;

          if (level) {
            filteredLogs = recentLogs.filter(log => log.level === level);
          }

          return filteredLogs
            .slice(offset, offset + limit)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      }

      // Fallback to database
      const db = databaseService.getClient();
      const logs = await db.systemLog.findMany({
        where: level ? { level } : undefined,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit,
      });

      return logs;
    } catch (_error) {
      this.error('Failed to retrieve recent logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Get security events for analysis
   */

  async getSecurityEvents(
    eventType?: SecurityEventType,
    severity?: 'low' | 'medium' | 'high' | 'critical',
    limit: number = 50,
  ): Promise<unknown[]> {
    try {
      const db = databaseService.getClient();
      const events = await db.systemLog.findMany({
        where: {
          AND: [
            eventType ? { securityEventType: eventType } : {},
            severity ? { metadata: { path: ['severity'], equals: severity } } : {},
          ],
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return events;
    } catch (_error) {
      this.error('Failed to retrieve security events', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Graceful shutdown
   */

  async shutdown(): Promise<void> {
    try {
      this.info('Shutting down logging service...');

      // Stop buffer flush
      if (this.bufferFlushInterval) {
        clearInterval(this.bufferFlushInterval);
      }

      // Flush remaining logs
      await this.flushLogBuffer();

      // Close all transports
      const loggers = [this.logger, this.securityLogger, this.auditLogger, this.performanceLogger];

      await Promise.all(
        loggers.map(logger =>
          new Promise<void>((resolve) => {
            logger.close(() => resolve());
          }),
        ),
      );

      this.initialized = false;
      // // console.log('Logging service shut down successfully');
    } catch (_error) {
      console.error('Error during logging service shutdown:', error);
    }
  }

  /**
   * Health check
   */

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      initialized: boolean;
      bufferSize: number;
      logLevel: string;
      transports: number;
    };
  } {
    try {
      return {
        status: this.initialized ? 'healthy' : 'unhealthy',
        details: {
          initialized: this.initialized,
          bufferSize: this.logBuffer.length,
          logLevel: this.getLogLevel(),
          transports: this.logger?.transports?.length || 0,
        },
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        details: {
          initialized: false,
          bufferSize: 0,
          logLevel: 'unknown',
          transports: 0,
        },
      };
    }
  }
}

// Singleton instance
export const loggingService = new LoggingService();

// Export convenience functions
export const log = {
  error: (message: string, context?: LogContext) => loggingService.error(message, context),
  warn: (message: string, context?: LogContext) => loggingService.warn(message, context),
  info: (message: string, context?: LogContext) => loggingService.info(message, context),
  debug: (message: string, context?: LogContext) => loggingService.debug(message, context),
  security: (eventType: SecurityEventType, message: string, context?: Partial<SecurityLogContext>) =>
    loggingService.logSecurityEvent(eventType, message, context),
  audit: (message: string, context: LogContext) => loggingService.logAuditEvent(message, context),
  performance: (operation: string, duration: number, context?: Partial<LogContext>) =>
    loggingService.logPerformanceMetric(operation, duration, context),
  http: (method: string, url: string, statusCode: number, duration: number, context?: Partial<LogContext>) =>
    loggingService.logHttpRequest(method, url, statusCode, duration, context),
};

export default loggingService;
