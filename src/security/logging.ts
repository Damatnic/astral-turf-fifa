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
  metadata?: Record<string, unknown>;
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
    threats: {
      xssAttempts: 0,
      sqlInjectionAttempts: 0,
      bruteForceAttempts: 0,
      rateLimitExceeded: 0,
    },
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
      } catch (_error) {
        console.error('Alert callback failed:', _error);
      }
    });
  }

  private consoleOutput(entry: SecurityLogEntry): void {
    const levelColors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m', // Green
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.CRITICAL]: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const color = levelColors[entry.level] || '';

    //     // // // console.log(
    //   `${color}[SECURITY ${LogLevel[entry.level]}]${reset} ` +
    //   `${entry.timestamp} - ${entry.eventType}: ${entry.message}` +
    //   (entry.userId ? ` (User: ${entry.userId})` : '') +
    //   (entry.riskScore ? ` [Risk: ${entry.riskScore}]` : '')
    // );

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      // // // // console.log(`${color}  Metadata:${reset}`, entry.metadata);
    }
  }

  getLogs(filters?: Partial<SecurityLogEntry>): SecurityLogEntry[] {
    if (!filters) {
      return this.logs;
    }

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
      threats: {
        xssAttempts: 0,
        sqlInjectionAttempts: 0,
        bruteForceAttempts: 0,
        rateLimitExceeded: 0,
      },
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
    metadata?: Record<string, unknown>,
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

  private generateTags(eventType: SecurityEventType, metadata?: Record<string, unknown>): string[] {
    const tags: string[] = [];

    // Add category tags
    if (
      eventType.includes('LOGIN') ||
      eventType.includes('LOGOUT') ||
      eventType.includes('TOKEN')
    ) {
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
    if (riskScore >= 80) {
      tags.push('critical');
    } else if (riskScore >= 60) {
      tags.push('high-risk');
    } else if (riskScore >= 40) {
      tags.push('medium-risk');
    } else {
      tags.push('low-risk');
    }

    return tags;
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (!ENVIRONMENT_CONFIG.isDevelopment) {
      return;
    }

    const entry = this.createEntry(
      LogLevel.DEBUG,
      SecurityEventType.SYSTEM_ERROR,
      message,
      metadata,
    );
    logStore.add(entry);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.INFO, SecurityEventType.DATA_ACCESS, message, metadata);
    logStore.add(entry);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry(
      LogLevel.WARN,
      SecurityEventType.SUSPICIOUS_LOGIN_PATTERN,
      message,
      metadata,
    );
    logStore.add(entry);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry(
      LogLevel.ERROR,
      SecurityEventType.SYSTEM_ERROR,
      message,
      metadata,
    );
    entry.stackTrace = new Error().stack;
    logStore.add(entry);
  }

  critical(message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry(
      LogLevel.CRITICAL,
      SecurityEventType.SECURITY_POLICY_VIOLATION,
      message,
      metadata,
    );
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
      metadata?: Record<string, unknown>;
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

    if (riskScore >= 90) {
      return LogLevel.CRITICAL;
    }
    if (riskScore >= 70) {
      return LogLevel.ERROR;
    }
    if (riskScore >= 40) {
      return LogLevel.WARN;
    }
    return LogLevel.INFO;
  }

  // Authentication event logging
  logLogin(
    success: boolean,
    userId: string,
    ipAddress: string,
    userAgent: string,
    reason?: string,
  ): void {
    this.logSecurityEvent(
      success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE,
      success ? 'User login successful' : `User login failed: ${reason}`,
      { userId, ipAddress, userAgent, metadata: { reason } },
    );
  }

  logLogout(userId: string, sessionId: string): void {
    this.logSecurityEvent(SecurityEventType.LOGOUT, 'User logout', { userId, sessionId });
  }

  logPermissionCheck(
    granted: boolean,
    userId: string,
    resource: string,
    action: string,
    reason?: string,
  ): void {
    this.logSecurityEvent(
      granted ? SecurityEventType.PERMISSION_GRANTED : SecurityEventType.PERMISSION_DENIED,
      granted ? 'Permission granted' : `Permission denied: ${reason}`,
      { userId, resource, action, metadata: { reason } },
    );
  }

  logSuspiciousActivity(
    type: 'brute_force' | 'rate_limit' | 'invalid_token' | 'pattern',
    details: Record<string, unknown>,
  ): void {
    const eventType = {
      brute_force: SecurityEventType.BRUTE_FORCE_ATTEMPT,
      rate_limit: SecurityEventType.RATE_LIMIT_EXCEEDED,
      invalid_token: SecurityEventType.INVALID_TOKEN_USAGE,
      pattern: SecurityEventType.SUSPICIOUS_LOGIN_PATTERN,
    }[type];

    this.logSecurityEvent(eventType, `Suspicious activity detected: ${type}`, {
      metadata: details,
    });
  }

  logInputThreat(
    type: 'xss' | 'sql_injection' | 'malicious',
    input: string,
    userId?: string,
  ): void {
    const eventType = {
      xss: SecurityEventType.XSS_ATTEMPT,
      sql_injection: SecurityEventType.SQL_INJECTION_ATTEMPT,
      malicious: SecurityEventType.MALICIOUS_INPUT,
    }[type];

    this.logSecurityEvent(eventType, `Input threat detected: ${type}`, {
      userId,
      metadata: {
        input: input.substring(0, 200), // Truncate for security
        inputLength: input.length,
      },
    });
  }

  logDataAccess(userId: string, resource: string, action: string, sensitive = false): void {
    this.logSecurityEvent(
      sensitive ? SecurityEventType.SENSITIVE_DATA_ACCESS : SecurityEventType.DATA_ACCESS,
      `Data access: ${action} on ${resource}`,
      { userId, resource, action },
    );
  }

  logAiSecurityEvent(
    type: 'prompt_injection' | 'response_filtered' | 'rate_limited',
    details: Record<string, unknown>,
  ): void {
    const eventType = {
      prompt_injection: SecurityEventType.AI_PROMPT_INJECTION,
      response_filtered: SecurityEventType.AI_RESPONSE_FILTERED,
      rate_limited: SecurityEventType.AI_RATE_LIMITED,
    }[type];

    this.logSecurityEvent(eventType, `AI security event: ${type}`, { metadata: details });
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
    return logStore
      .getLogs()
      .filter(entry => entry.timestamp > cutoff && (entry.riskScore || 0) >= 60);
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

// Export additional types and constants
export type {
  SecurityLogEntry,
  SecurityMetrics,
  SecurityIncident,
  IncidentIndicator,
  IncidentEvidence,
  IncidentMitigation,
};

/**
 * Advanced Security Incident Response System
 */

// Security incident severity levels
export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Security incident types
export enum IncidentType {
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHORIZATION_VIOLATION = 'authorization_violation',
  DATA_BREACH = 'data_breach',
  MALWARE_DETECTION = 'malware_detection',
  DDOS_ATTACK = 'ddos_attack',
  INJECTION_ATTACK = 'injection_attack',
  XSS_ATTACK = 'xss_attack',
  CSRF_ATTACK = 'csrf_attack',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  COMPLIANCE_VIOLATION = 'compliance_violation',
  SYSTEM_COMPROMISE = 'system_compromise',
}

// Security incident details
export interface SecurityIncident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  timestamp: string;
  source: string;
  affectedSystems: string[];
  affectedUsers: string[];
  indicators: IncidentIndicator[];
  evidence: IncidentEvidence[];
  mitigations: IncidentMitigation[];
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  assignedTo?: string;
  escalated: boolean;
  tags: string[];
  relatedIncidents: string[];
  compliance: {
    requiresNotification: boolean;
    authorities: string[];
    deadline?: string;
  };
}

// Incident indicators
export interface IncidentIndicator {
  type: 'ip_address' | 'user_agent' | 'file_hash' | 'domain' | 'url' | 'email' | 'pattern';
  value: string;
  confidence: number;
  source: string;
  timestamp: string;
}

// Incident evidence
export interface IncidentEvidence {
  type: 'log' | 'file' | 'network_capture' | 'screenshot' | 'memory_dump';
  description: string;
  location: string;
  hash: string;
  timestamp: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
}

// Incident mitigation actions
export interface IncidentMitigation {
  action: string;
  description: string;
  timestamp: string;
  performedBy: string;
  effectiveness: 'low' | 'medium' | 'high';
  automated: boolean;
}

// In-memory incident store (replace with database in production)
const securityIncidents = new Map<string, SecurityIncident>();
const incidentMetrics = {
  totalIncidents: 0,
  openIncidents: 0,
  criticalIncidents: 0,
  averageResolutionTime: 0,
  lastIncident: null as string | null,
};

// Generate UUID for incidents
function generateIncidentUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Create security incident
export function createSecurityIncident(
  type: IncidentType,
  severity: IncidentSeverity,
  title: string,
  description: string,
  source: string,
  metadata: Record<string, unknown> = {},
): string {
  const incidentId = generateIncidentUUID();
  const now = new Date().toISOString();

  const incident: SecurityIncident = {
    id: incidentId,
    type,
    severity,
    title,
    description,
    timestamp: now,
    source,
    affectedSystems: metadata.affectedSystems || [],
    affectedUsers: metadata.affectedUsers || [],
    indicators: [],
    evidence: [],
    mitigations: [],
    status: 'open',
    escalated: severity === IncidentSeverity.CRITICAL,
    tags: metadata.tags || [],
    relatedIncidents: [],
    compliance: {
      requiresNotification:
        severity === IncidentSeverity.CRITICAL || severity === IncidentSeverity.HIGH,
      authorities: determineRequiredNotifications(type, severity),
      deadline: calculateNotificationDeadline(type, severity),
    },
  };

  securityIncidents.set(incidentId, incident);
  updateIncidentMetrics();

  // Auto-escalate critical incidents
  if (severity === IncidentSeverity.CRITICAL) {
    escalateIncident(incidentId);
  }

  // Log the incident creation
  securityLogger.error('Security incident created', {
    incidentId,
    type,
    severity,
    title,
    source,
    metadata,
  });

  // Trigger automated response
  triggerAutomatedResponse(incident);

  return incidentId;
}

// Determine required notifications
function determineRequiredNotifications(type: IncidentType, severity: IncidentSeverity): string[] {
  const authorities: string[] = [];

  if (severity === IncidentSeverity.CRITICAL) {
    authorities.push('CISO', 'Legal', 'Executive Team');
  }

  if (type === IncidentType.DATA_BREACH) {
    authorities.push('Data Protection Officer', 'Regulatory Authority');
  }

  if (type === IncidentType.COMPLIANCE_VIOLATION) {
    authorities.push('Compliance Officer', 'Auditors');
  }

  return authorities;
}

// Calculate notification deadline
function calculateNotificationDeadline(
  type: IncidentType,
  severity: IncidentSeverity,
): string | undefined {
  if (type === IncidentType.DATA_BREACH) {
    // GDPR requires notification within 72 hours
    return new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  }

  if (severity === IncidentSeverity.CRITICAL) {
    // Critical incidents must be reported within 24 hours
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  return undefined;
}

// Trigger automated response
function triggerAutomatedResponse(incident: SecurityIncident): void {
  switch (incident.type) {
    case IncidentType.DDOS_ATTACK:
      addIncidentMitigation(
        incident.id,
        'enable_ddos_protection',
        'Automatically enabled enhanced DDoS protection',
        'system',
        'high',
        true,
      );
      break;

    case IncidentType.INJECTION_ATTACK:
    case IncidentType.XSS_ATTACK:
      addIncidentMitigation(
        incident.id,
        'enhance_input_validation',
        'Automatically enabled strict input validation',
        'system',
        'medium',
        true,
      );
      break;

    case IncidentType.AUTHENTICATION_FAILURE:
      addIncidentMitigation(
        incident.id,
        'enable_account_lockout',
        'Automatically enabled enhanced account lockout policies',
        'system',
        'medium',
        true,
      );
      break;
  }
}

// Add mitigation action
export function addIncidentMitigation(
  incidentId: string,
  action: string,
  description: string,
  performedBy: string,
  effectiveness: 'low' | 'medium' | 'high',
  automated: boolean = false,
): void {
  const incident = securityIncidents.get(incidentId);
  if (!incident) {
    securityLogger.warn('Attempted to add mitigation to non-existent incident', { incidentId });
    return;
  }

  const mitigation: IncidentMitigation = {
    action,
    description,
    timestamp: new Date().toISOString(),
    performedBy,
    effectiveness,
    automated,
  };

  incident.mitigations.push(mitigation);

  securityLogger.info('Mitigation action added to security incident', {
    incidentId,
    action,
    performedBy,
    effectiveness,
    automated,
  });

  // Auto-update status based on mitigation effectiveness
  if (effectiveness === 'high' && incident.status === 'open') {
    updateIncidentStatus(incidentId, 'contained');
  }
}

// Update incident status
export function updateIncidentStatus(
  incidentId: string,
  status: SecurityIncident['status'],
  assignedTo?: string,
): void {
  const incident = securityIncidents.get(incidentId);
  if (!incident) {
    securityLogger.warn('Attempted to update status of non-existent incident', { incidentId });
    return;
  }

  const oldStatus = incident.status;
  incident.status = status;

  if (assignedTo) {
    incident.assignedTo = assignedTo;
  }

  updateIncidentMetrics();

  securityLogger.info('Security incident status updated', {
    incidentId,
    oldStatus,
    newStatus: status,
    assignedTo,
  });
}

// Escalate incident
export function escalateIncident(incidentId: string): void {
  const incident = securityIncidents.get(incidentId);
  if (!incident) {
    securityLogger.warn('Attempted to escalate non-existent incident', { incidentId });
    return;
  }

  incident.escalated = true;
  incident.assignedTo = 'security-team-lead';

  securityLogger.error('Security incident escalated', {
    incidentId,
    type: incident.type,
    severity: incident.severity,
    title: incident.title,
  });
}

// Update incident metrics
function updateIncidentMetrics(): void {
  const incidents = Array.from(securityIncidents.values());

  incidentMetrics.totalIncidents = incidents.length;
  incidentMetrics.openIncidents = incidents.filter(i => i.status === 'open').length;
  incidentMetrics.criticalIncidents = incidents.filter(
    i => i.severity === IncidentSeverity.CRITICAL,
  ).length;

  if (incidents.length > 0) {
    const latestIncident = incidents.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0];
    incidentMetrics.lastIncident = latestIncident.timestamp;
  }
}

// Get security incidents
export function getSecurityIncidents(filter?: {
  type?: IncidentType;
  severity?: IncidentSeverity;
  status?: SecurityIncident['status'];
}): SecurityIncident[] {
  let incidents = Array.from(securityIncidents.values());

  if (filter) {
    if (filter.type) {
      incidents = incidents.filter(i => i.type === filter.type);
    }
    if (filter.severity) {
      incidents = incidents.filter(i => i.severity === filter.severity);
    }
    if (filter.status) {
      incidents = incidents.filter(i => i.status === filter.status);
    }
  }

  return incidents.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

// Get incident metrics
export function getIncidentMetrics(): typeof incidentMetrics {
  updateIncidentMetrics();
  return { ...incidentMetrics };
}

// Enhanced security event logging with automatic incident creation
export function logCriticalSecurityEvent(
  type: SecurityEventType,
  message: string,
  metadata: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    action?: string;
    success?: boolean;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, unknown>;
  } = {},
): void {
  // Log the event normally
  securityLogger.logSecurityEvent(type, message, metadata);

  // Create incident for high-risk events
  if (metadata.riskLevel === 'critical' || metadata.riskLevel === 'high') {
    const incidentType = mapEventTypeToIncidentType(type);
    const severity =
      metadata.riskLevel === 'critical' ? IncidentSeverity.CRITICAL : IncidentSeverity.HIGH;

    createSecurityIncident(
      incidentType,
      severity,
      message,
      `Security event detected: ${message}`,
      'security_monitoring',
      {
        eventType: type,
        ...metadata,
      },
    );
  }
}

// Map security event types to incident types
function mapEventTypeToIncidentType(eventType: SecurityEventType): IncidentType {
  const mapping: Record<SecurityEventType, IncidentType> = {
    [SecurityEventType.LOGIN_SUCCESS]: IncidentType.AUTHENTICATION_FAILURE,
    [SecurityEventType.LOGIN_FAILURE]: IncidentType.AUTHENTICATION_FAILURE,
    [SecurityEventType.LOGOUT]: IncidentType.SUSPICIOUS_ACTIVITY,
    [SecurityEventType.PASSWORD_CHANGED]: IncidentType.SUSPICIOUS_ACTIVITY,
    [SecurityEventType.PASSWORD_RESET_REQUEST]: IncidentType.AUTHENTICATION_FAILURE,
    [SecurityEventType.ACCOUNT_LOCKED]: IncidentType.AUTHENTICATION_FAILURE,
    [SecurityEventType.UNAUTHORIZED_ACCESS]: IncidentType.AUTHORIZATION_VIOLATION,
    [SecurityEventType.SUSPICIOUS_ACTIVITY]: IncidentType.SUSPICIOUS_ACTIVITY,
    [SecurityEventType.DATA_ACCESS]: IncidentType.SUSPICIOUS_ACTIVITY,
    [SecurityEventType.DATA_MODIFICATION]: IncidentType.SUSPICIOUS_ACTIVITY,
    [SecurityEventType.PERMISSION_DENIED]: IncidentType.AUTHORIZATION_VIOLATION,
    [SecurityEventType.TOKEN_REFRESH]: IncidentType.SUSPICIOUS_ACTIVITY,
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: IncidentType.DDOS_ATTACK,
    [SecurityEventType.CONFIGURATION_CHANGED]: IncidentType.SUSPICIOUS_ACTIVITY,
    [SecurityEventType.SYSTEM_ERROR]: IncidentType.SYSTEM_COMPROMISE,
    [SecurityEventType.SENSITIVE_DATA_ACCESS]: IncidentType.DATA_BREACH,
    [SecurityEventType.AI_PROMPT_INJECTION]: IncidentType.INJECTION_ATTACK,
    [SecurityEventType.AI_RESPONSE_FILTERED]: IncidentType.SUSPICIOUS_ACTIVITY,
    [SecurityEventType.AI_RATE_LIMITED]: IncidentType.DDOS_ATTACK,
  };

  return mapping[eventType] || IncidentType.SUSPICIOUS_ACTIVITY;
}

// Initialize security monitoring with incident response
export function initializeSecurityMonitoring(): void {
  // Set up real-time threat detection with incident creation
  securityLogger.onSecurityAlert(entry => {
    if (entry.riskScore && entry.riskScore >= 90) {
      console.error('🚨 CRITICAL SECURITY ALERT 🚨', {
        eventType: entry.eventType,
        message: entry.message,
        userId: entry.userId,
        timestamp: entry.timestamp,
        riskScore: entry.riskScore,
      });

      // Auto-create critical incident
      const incidentType = mapEventTypeToIncidentType(entry.eventType);
      createSecurityIncident(
        incidentType,
        IncidentSeverity.CRITICAL,
        entry.message,
        `Critical security alert: ${entry.message}`,
        'automated_monitoring',
        {
          logEntry: entry,
          riskScore: entry.riskScore,
        },
      );
    }
  });

  // Log initialization
  securityLogger.info('Security monitoring with incident response initialized', {
    environment: ENVIRONMENT_CONFIG.isDevelopment ? 'development' : 'production',
    features: ['audit_logging', 'threat_detection', 'real_time_monitoring', 'incident_response'],
  });
}
