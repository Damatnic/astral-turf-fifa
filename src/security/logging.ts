/**
 * Security Logging and Monitoring Module
 *
 * Provides comprehensive security event logging, audit trails, and
 * real-time security monitoring with threat detection capabilities.
 */

import { AUDIT_CONFIG, ENVIRONMENT_CONFIG } from './config';

// Log levels with priority
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

// Security event types for detailed categorization
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REVOKED = 'TOKEN_REVOKED',

  // Authorization events
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',

  // Account security events
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',

  // Suspicious activity
  SUSPICIOUS_LOGIN_PATTERN = 'SUSPICIOUS_LOGIN_PATTERN',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN_USAGE = 'INVALID_TOKEN_USAGE',

  // Data security events
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_EXPORT = 'DATA_EXPORT',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',

  // Input security events
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  MALICIOUS_INPUT = 'MALICIOUS_INPUT',
  FILE_UPLOAD_BLOCKED = 'FILE_UPLOAD_BLOCKED',

  // System security events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SECURITY_POLICY_VIOLATION = 'SECURITY_POLICY_VIOLATION',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',

  // AI security events
  AI_PROMPT_INJECTION = 'AI_PROMPT_INJECTION',
  AI_RESPONSE_FILTERED = 'AI_RESPONSE_FILTERED',
  AI_RATE_LIMITED = 'AI_RATE_LIMITED',
}

// Security log entry structure
export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  eventType: SecurityEventType;
  message: string;
  userId?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
  riskScore?: number; // 0-100 risk assessment
  tags?: string[];
}

// Security metrics for monitoring
export interface SecurityMetrics {
  loginAttempts: {
    successful: number;
    failed: number;
    blocked: number;
  };
  accessAttempts: {
    authorized: number;
    unauthorized: number;
  };
  threats: {
    xssAttempts: number;
    sqlInjectionAttempts: number;
    bruteForceAttempts: number;
    rateLimitExceeded: number;
  };
  aiSecurity: {
    promptInjections: number;
    responsesFiltered: number;
    rateLimited: number;
  };
  dataAccess: {
    sensitiveDataAccess: number;
    dataExports: number;
    unauthorizedAccess: number;
  };
}

// In-memory log store (replace with proper logging service in production)
class SecurityLogStore {
  private logs: SecurityLogEntry[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory
  private metrics: SecurityMetrics = {
    loginAttempts: { successful: 0, failed: 0, blocked: 0 },
    accessAttempts: { authorized: 0, unauthorized: 0 },
    threats: { xssAttempts: 0, sqlInjectionAttempts: 0, bruteForceAttempts: 0, rateLimitExceeded: 0 },
    aiSecurity: { promptInjections: 0, responsesFiltered: 0, rateLimited: 0 },
    dataAccess: { sensitiveDataAccess: 0, dataExports: 0, unauthorizedAccess: 0 },
  };

  private alertCallbacks: Array<(entry: SecurityLogEntry) => void> = [];

  add(entry: SecurityLogEntry): void {
    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Update metrics
    this.updateMetrics(entry);

    // Trigger alerts for high-risk events
    if (entry.riskScore && entry.riskScore >= 70) {
      this.triggerAlerts(entry);
    }

    // Console output in development
    if (ENVIRONMENT_CONFIG.isDevelopment) {
      this.consoleOutput(entry);
    }
  }

  private updateMetrics(entry: SecurityLogEntry): void {
    switch (entry.eventType) {
      case SecurityEventType.LOGIN_SUCCESS:
        this.metrics.loginAttempts.successful++;
        break;
      case SecurityEventType.LOGIN_FAILURE:
        this.metrics.loginAttempts.failed++;
        break;
      case SecurityEventType.ACCOUNT_LOCKED:
        this.metrics.loginAttempts.blocked++;
        break;
      case SecurityEventType.PERMISSION_GRANTED:
        this.metrics.accessAttempts.authorized++;
        break;
      case SecurityEventType.PERMISSION_DENIED:
      case SecurityEventType.UNAUTHORIZED_ACCESS:
        this.metrics.accessAttempts.unauthorized++;
        break;
      case SecurityEventType.XSS_ATTEMPT:
        this.metrics.threats.xssAttempts++;
        break;
      case SecurityEventType.SQL_INJECTION_ATTEMPT:
        this.metrics.threats.sqlInjectionAttempts++;
        break;
      case SecurityEventType.BRUTE_FORCE_ATTEMPT:
        this.metrics.threats.bruteForceAttempts++;
        break;
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
        this.metrics.threats.rateLimitExceeded++;
        break;
      case SecurityEventType.AI_PROMPT_INJECTION:
        this.metrics.aiSecurity.promptInjections++;
        break;
      case SecurityEventType.AI_RESPONSE_FILTERED:
        this.metrics.aiSecurity.responsesFiltered++;
        break;
      case SecurityEventType.AI_RATE_LIMITED:
        this.metrics.aiSecurity.rateLimited++;
        break;
      case SecurityEventType.SENSITIVE_DATA_ACCESS:
        this.metrics.dataAccess.sensitiveDataAccess++;
        break;
      case SecurityEventType.DATA_EXPORT:
        this.metrics.dataAccess.dataExports++;
        break;
    }
  }

  private triggerAlerts(entry: SecurityLogEntry): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('Alert callback failed:', error);
      }
    });
  }

  private consoleOutput(entry: SecurityLogEntry): void {
    const levelColors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.CRITICAL]: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const color = levelColors[entry.level] || '';

    console.log(
      `${color}[SECURITY ${LogLevel[entry.level]}]${reset} ` +
      `${entry.timestamp} - ${entry.eventType}: ${entry.message}` +
      (entry.userId ? ` (User: ${entry.userId})` : '') +
      (entry.riskScore ? ` [Risk: ${entry.riskScore}]` : ''),
    );

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log(`${color}  Metadata:${reset}`, entry.metadata);
    }
  }

  getLogs(filters?: Partial<SecurityLogEntry>): SecurityLogEntry[] {
    if (!filters) {return this.logs;}

    return this.logs.filter(entry => {
      for (const [key, value] of Object.entries(filters)) {
        if (entry[key as keyof SecurityLogEntry] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  onAlert(callback: (entry: SecurityLogEntry) => void): void {
    this.alertCallbacks.push(callback);
  }

  clear(): void {
    this.logs = [];
    this.metrics = {
      loginAttempts: { successful: 0, failed: 0, blocked: 0 },
      accessAttempts: { authorized: 0, unauthorized: 0 },
      threats: { xssAttempts: 0, sqlInjectionAttempts: 0, bruteForceAttempts: 0, rateLimitExceeded: 0 },
      aiSecurity: { promptInjections: 0, responsesFiltered: 0, rateLimited: 0 },
      dataAccess: { sensitiveDataAccess: 0, dataExports: 0, unauthorizedAccess: 0 },
    };
  }
}

// Global log store instance
const logStore = new SecurityLogStore();

// Risk assessment for different event types
const RISK_SCORES: Record<SecurityEventType, number> = {
  [SecurityEventType.LOGIN_SUCCESS]: 10,
  [SecurityEventType.LOGIN_FAILURE]: 30,
  [SecurityEventType.LOGOUT]: 5,
  [SecurityEventType.TOKEN_REFRESH]: 10,
  [SecurityEventType.TOKEN_REVOKED]: 20,

  [SecurityEventType.PERMISSION_GRANTED]: 5,
  [SecurityEventType.PERMISSION_DENIED]: 40,
  [SecurityEventType.UNAUTHORIZED_ACCESS]: 80,

  [SecurityEventType.ACCOUNT_LOCKED]: 60,
  [SecurityEventType.ACCOUNT_UNLOCKED]: 30,
  [SecurityEventType.PASSWORD_CHANGED]: 20,
  [SecurityEventType.PASSWORD_RESET_REQUEST]: 30,
  [SecurityEventType.PASSWORD_RESET_SUCCESS]: 40,

  [SecurityEventType.SUSPICIOUS_LOGIN_PATTERN]: 70,
  [SecurityEventType.BRUTE_FORCE_ATTEMPT]: 90,
  [SecurityEventType.RATE_LIMIT_EXCEEDED]: 50,
  [SecurityEventType.INVALID_TOKEN_USAGE]: 60,

  [SecurityEventType.DATA_ACCESS]: 15,
  [SecurityEventType.DATA_MODIFICATION]: 25,
  [SecurityEventType.DATA_EXPORT]: 40,
  [SecurityEventType.SENSITIVE_DATA_ACCESS]: 50,

  [SecurityEventType.XSS_ATTEMPT]: 85,
  [SecurityEventType.SQL_INJECTION_ATTEMPT]: 95,
  [SecurityEventType.MALICIOUS_INPUT]: 70,
  [SecurityEventType.FILE_UPLOAD_BLOCKED]: 60,

  [SecurityEventType.SYSTEM_ERROR]: 30,
  [SecurityEventType.SECURITY_POLICY_VIOLATION]: 75,
  [SecurityEventType.CONFIGURATION_CHANGE]: 45,

  [SecurityEventType.AI_PROMPT_INJECTION]: 80,
  [SecurityEventType.AI_RESPONSE_FILTERED]: 40,
  [SecurityEventType.AI_RATE_LIMITED]: 30,
};

/**
 * Security Logger Class
 */
class SecurityLogger {
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createEntry(
    level: LogLevel,
    eventType: SecurityEventType,
    message: string,
    metadata?: Record<string, any>,
  ): SecurityLogEntry {
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      eventType,
      message,
      metadata,
      riskScore: RISK_SCORES[eventType] || 0,
      tags: this.generateTags(eventType, metadata),
    };
  }

  private generateTags(eventType: SecurityEventType, metadata?: Record<string, any>): string[] {
    const tags: string[] = [];

    // Add category tags
    if (eventType.includes('LOGIN') || eventType.includes('LOGOUT') || eventType.includes('TOKEN')) {
      tags.push('authentication');
    }

    if (eventType.includes('PERMISSION') || eventType.includes('UNAUTHORIZED')) {
      tags.push('authorization');
    }

    if (eventType.includes('XSS') || eventType.includes('SQL') || eventType.includes('MALICIOUS')) {
      tags.push('attack');
    }

    if (eventType.includes('AI')) {
      tags.push('ai-security');
    }

    if (eventType.includes('DATA')) {
      tags.push('data-security');
    }

    // Add severity tags
    const riskScore = RISK_SCORES[eventType] || 0;
    if (riskScore >= 80) {tags.push('critical');}
    else if (riskScore >= 60) {tags.push('high-risk');}
    else if (riskScore >= 40) {tags.push('medium-risk');}
    else {tags.push('low-risk');}

    return tags;
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (!ENVIRONMENT_CONFIG.isDevelopment) {return;}

    const entry = this.createEntry(LogLevel.DEBUG, SecurityEventType.SYSTEM_ERROR, message, metadata);
    logStore.add(entry);
  }

  info(message: string, metadata?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.INFO, SecurityEventType.DATA_ACCESS, message, metadata);
    logStore.add(entry);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.WARN, SecurityEventType.SUSPICIOUS_LOGIN_PATTERN, message, metadata);
    logStore.add(entry);
  }

  error(message: string, metadata?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.ERROR, SecurityEventType.SYSTEM_ERROR, message, metadata);
    entry.stackTrace = new Error().stack;
    logStore.add(entry);
  }

  critical(message: string, metadata?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.CRITICAL, SecurityEventType.SECURITY_POLICY_VIOLATION, message, metadata);
    entry.stackTrace = new Error().stack;
    logStore.add(entry);
  }

  // Specific security event logging methods
  logSecurityEvent(
    eventType: SecurityEventType,
    message: string,
    context?: {
      userId?: string;
      userRole?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      resource?: string;
      action?: string;
      metadata?: Record<string, any>;
    },
  ): void {
    const level = this.getLogLevelForEvent(eventType);
    const entry = this.createEntry(level, eventType, message, context?.metadata);

    // Add context to entry
    if (context) {
      entry.userId = context.userId;
      entry.userRole = context.userRole;
      entry.sessionId = context.sessionId;
      entry.ipAddress = context.ipAddress;
      entry.userAgent = context.userAgent;
      entry.resource = context.resource;
      entry.action = context.action;
    }

    logStore.add(entry);
  }

  private getLogLevelForEvent(eventType: SecurityEventType): LogLevel {
    const riskScore = RISK_SCORES[eventType] || 0;

    if (riskScore >= 90) {return LogLevel.CRITICAL;}
    if (riskScore >= 70) {return LogLevel.ERROR;}
    if (riskScore >= 40) {return LogLevel.WARN;}
    return LogLevel.INFO;
  }

  // Authentication event logging
  logLogin(success: boolean, userId: string, ipAddress: string, userAgent: string, reason?: string): void {
    this.logSecurityEvent(
      success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE,
      success ? 'User login successful' : `User login failed: ${reason}`,
      { userId, ipAddress, userAgent, metadata: { reason } },
    );
  }

  logLogout(userId: string, sessionId: string): void {
    this.logSecurityEvent(
      SecurityEventType.LOGOUT,
      'User logout',
      { userId, sessionId },
    );
  }

  logPermissionCheck(granted: boolean, userId: string, resource: string, action: string, reason?: string): void {
    this.logSecurityEvent(
      granted ? SecurityEventType.PERMISSION_GRANTED : SecurityEventType.PERMISSION_DENIED,
      granted ? 'Permission granted' : `Permission denied: ${reason}`,
      { userId, resource, action, metadata: { reason } },
    );
  }

  logSuspiciousActivity(type: 'brute_force' | 'rate_limit' | 'invalid_token' | 'pattern', details: Record<string, any>): void {
    const eventType = {
      brute_force: SecurityEventType.BRUTE_FORCE_ATTEMPT,
      rate_limit: SecurityEventType.RATE_LIMIT_EXCEEDED,
      invalid_token: SecurityEventType.INVALID_TOKEN_USAGE,
      pattern: SecurityEventType.SUSPICIOUS_LOGIN_PATTERN,
    }[type];

    this.logSecurityEvent(
      eventType,
      `Suspicious activity detected: ${type}`,
      { metadata: details },
    );
  }

  logInputThreat(type: 'xss' | 'sql_injection' | 'malicious', input: string, userId?: string): void {
    const eventType = {
      xss: SecurityEventType.XSS_ATTEMPT,
      sql_injection: SecurityEventType.SQL_INJECTION_ATTEMPT,
      malicious: SecurityEventType.MALICIOUS_INPUT,
    }[type];

    this.logSecurityEvent(
      eventType,
      `Input threat detected: ${type}`,
      {
        userId,
        metadata: {
          input: input.substring(0, 200), // Truncate for security
          inputLength: input.length,
        },
      },
    );
  }

  logDataAccess(userId: string, resource: string, action: string, sensitive = false): void {
    this.logSecurityEvent(
      sensitive ? SecurityEventType.SENSITIVE_DATA_ACCESS : SecurityEventType.DATA_ACCESS,
      `Data access: ${action} on ${resource}`,
      { userId, resource, action },
    );
  }

  logAiSecurityEvent(type: 'prompt_injection' | 'response_filtered' | 'rate_limited', details: Record<string, any>): void {
    const eventType = {
      prompt_injection: SecurityEventType.AI_PROMPT_INJECTION,
      response_filtered: SecurityEventType.AI_RESPONSE_FILTERED,
      rate_limited: SecurityEventType.AI_RATE_LIMITED,
    }[type];

    this.logSecurityEvent(
      eventType,
      `AI security event: ${type}`,
      { metadata: details },
    );
  }

  // Query and analysis methods
  getLogs(filters?: Partial<SecurityLogEntry>): SecurityLogEntry[] {
    return logStore.getLogs(filters);
  }

  getMetrics(): SecurityMetrics {
    return logStore.getMetrics();
  }

  getRecentThreats(hours = 24): SecurityLogEntry[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    return logStore.getLogs().filter(
      entry => entry.timestamp > cutoff && (entry.riskScore || 0) >= 60,
    );
  }

  onSecurityAlert(callback: (entry: SecurityLogEntry) => void): void {
    logStore.onAlert(callback);
  }

  clearLogs(): void {
    if (ENVIRONMENT_CONFIG.isDevelopment) {
      logStore.clear();
    }
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();

// Export additional types and constants (LogLevel and SecurityEventType already exported with enum declarations)
export type { SecurityLogEntry, SecurityMetrics };

// Initialize security monitoring
export function initializeSecurityMonitoring(): void {
  // Set up real-time threat detection
  securityLogger.onSecurityAlert((entry) => {
    if (entry.riskScore && entry.riskScore >= 90) {
      console.error('🚨 CRITICAL SECURITY ALERT 🚨', {
        eventType: entry.eventType,
        message: entry.message,
        userId: entry.userId,
        timestamp: entry.timestamp,
        riskScore: entry.riskScore,
      });
    }
  });

  // Log initialization
  securityLogger.info('Security monitoring initialized', {
    environment: ENVIRONMENT_CONFIG.isDevelopment ? 'development' : 'production',
    features: ['audit_logging', 'threat_detection', 'real_time_monitoring'],
  });
}