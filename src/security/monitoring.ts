/**
 * Security Monitoring and Threat Detection Module
 *
 * Provides real-time security monitoring, threat detection, anomaly detection,
 * and automated response to security incidents.
 */

import { securityLogger, SecurityEventType, LogLevel } from './logging';
import { RATE_LIMIT_CONFIG } from './config';

// Threat severity levels
export enum ThreatSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Threat types for classification
export enum ThreatType {
  BRUTE_FORCE = 'brute_force',
  CREDENTIAL_STUFFING = 'credential_stuffing',
  ACCOUNT_TAKEOVER = 'account_takeover',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_EXFILTRATION = 'data_exfiltration',
  INJECTION_ATTACK = 'injection_attack',
  XSS_ATTACK = 'xss_attack',
  CSRF_ATTACK = 'csrf_attack',
  DOS_ATTACK = 'dos_attack',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  ANOMALOUS_BEHAVIOR = 'anomalous_behavior',
}

// Security incident structure
export interface SecurityIncident {
  id: string;
  timestamp: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  description: string;
  affectedUsers: string[];
  sourceIp?: string;
  userAgent?: string;
  evidenceEvents: string[]; // Log entry IDs
  status: 'active' | 'investigating' | 'resolved';
  mitigationActions: string[];
  riskScore: number;
  metadata: Record<string, any>;
}

// Rate limiting tracker
export interface RateLimit {
  key: string;
  count: number;
  windowStart: number;
  windowEnd: number;
  blocked: boolean;
}

// Anomaly detection pattern
export interface AnomalyPattern {
  type: string;
  threshold: number;
  windowMinutes: number;
  description: string;
}

// User behavior baseline
export interface UserBehavior {
  userId: string;
  avgLoginFrequency: number;
  commonIpAddresses: string[];
  commonUserAgents: string[];
  typicalLoginTimes: number[]; // Hours of day
  avgSessionDuration: number;
  commonActions: string[];
  lastUpdated: string;
}

/**
 * Rate Limiting Implementation
 */

class RateLimitManager {
  private limits = new Map<string, RateLimit>();

  // Check if request should be rate limited
  checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const limit = this.limits.get(key);

    if (!limit || now > limit.windowEnd) {
      // New or expired window
      this.limits.set(key, {
        key,
        count: 1,
        windowStart: now,
        windowEnd: now + windowMs,
        blocked: false,
      });
      return false; // Not rate limited
    }

    limit.count++;

    if (limit.count > maxRequests && !limit.blocked) {
      limit.blocked = true;

      securityLogger.logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded for key: ${key}`,
        {
          metadata: {
            key,
            count: limit.count,
            maxRequests,
            windowMs,
          },
        },
      );

      return true; // Rate limited
    }

    return limit.blocked;
  }

  // Reset rate limit for a key
  resetRateLimit(key: string): void {
    this.limits.delete(key);
  }

  // Clean up expired rate limits
  cleanup(): void {
    const now = Date.now();
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.windowEnd) {
        this.limits.delete(key);
      }
    }
  }

  // Get current rate limit status
  getRateLimitStatus(key: string): RateLimit | null {
    return this.limits.get(key) || null;
  }
}

/**
 * Anomaly Detection System
 */

class AnomalyDetector {
  private patterns: AnomalyPattern[] = [
    {
      type: 'multiple_failed_logins',
      threshold: 5,
      windowMinutes: 15,
      description: 'Multiple failed login attempts',
    },
    {
      type: 'unusual_login_time',
      threshold: 3,
      windowMinutes: 60,
      description: 'Login attempts at unusual hours',
    },
    {
      type: 'rapid_api_requests',
      threshold: 100,
      windowMinutes: 5,
      description: 'Rapid API requests from single source',
    },
    {
      type: 'multiple_ip_same_user',
      threshold: 3,
      windowMinutes: 30,
      description: 'Same user from multiple IPs',
    },
    {
      type: 'privilege_escalation_attempts',
      threshold: 3,
      windowMinutes: 60,
      description: 'Multiple privilege escalation attempts',
    },
  ];

  private userBehaviors = new Map<string, UserBehavior>();

  // Detect anomalies in user behavior
  detectAnomalies(userId: string, action: string, metadata: Record<string, any>): SecurityIncident[] {
    const incidents: SecurityIncident[] = [];
    const baseline = this.getUserBehavior(userId);

    // Check for unusual login times
    if (action === 'login' && metadata.timestamp) {
      const hour = new Date(metadata.timestamp).getHours();
      if (baseline && !baseline.typicalLoginTimes.includes(hour)) {
        incidents.push(this.createIncident({
          threatType: ThreatType.ANOMALOUS_BEHAVIOR,
          severity: ThreatSeverity.LOW,
          description: `User ${userId} logged in at unusual hour: ${hour}`,
          affectedUsers: [userId],
          sourceIp: metadata.ipAddress,
          userAgent: metadata.userAgent,
          metadata: { hour, typicalHours: baseline.typicalLoginTimes },
        }));
      }
    }

    // Check for unusual IP addresses
    if (metadata.ipAddress && baseline) {
      if (!baseline.commonIpAddresses.includes(metadata.ipAddress)) {
        incidents.push(this.createIncident({
          threatType: ThreatType.SUSPICIOUS_ACTIVITY,
          severity: ThreatSeverity.MEDIUM,
          description: `User ${userId} accessed from new IP: ${metadata.ipAddress}`,
          affectedUsers: [userId],
          sourceIp: metadata.ipAddress,
          userAgent: metadata.userAgent,
          metadata: { newIp: metadata.ipAddress, knownIps: baseline.commonIpAddresses },
        }));
      }
    }

    return incidents;
  }

  // Update user behavior baseline
  updateUserBehavior(userId: string, action: string, metadata: Record<string, any>): void {
    let behavior = this.userBehaviors.get(userId);

    if (!behavior) {
      behavior = {
        userId,
        avgLoginFrequency: 0,
        commonIpAddresses: [],
        commonUserAgents: [],
        typicalLoginTimes: [],
        avgSessionDuration: 0,
        commonActions: [],
        lastUpdated: new Date().toISOString(),
      };
      this.userBehaviors.set(userId, behavior);
    }

    // Update IP addresses
    if (metadata.ipAddress && !behavior.commonIpAddresses.includes(metadata.ipAddress)) {
      behavior.commonIpAddresses.push(metadata.ipAddress);
      if (behavior.commonIpAddresses.length > 10) {
        behavior.commonIpAddresses = behavior.commonIpAddresses.slice(-10);
      }
    }

    // Update user agents
    if (metadata.userAgent && !behavior.commonUserAgents.includes(metadata.userAgent)) {
      behavior.commonUserAgents.push(metadata.userAgent);
      if (behavior.commonUserAgents.length > 5) {
        behavior.commonUserAgents = behavior.commonUserAgents.slice(-5);
      }
    }

    // Update login times
    if (action === 'login') {
      const hour = new Date().getHours();
      if (!behavior.typicalLoginTimes.includes(hour)) {
        behavior.typicalLoginTimes.push(hour);
      }
    }

    // Update common actions
    if (!behavior.commonActions.includes(action)) {
      behavior.commonActions.push(action);
      if (behavior.commonActions.length > 20) {
        behavior.commonActions = behavior.commonActions.slice(-20);
      }
    }

    behavior.lastUpdated = new Date().toISOString();
  }

  private getUserBehavior(userId: string): UserBehavior | null {
    return this.userBehaviors.get(userId) || null;
  }

  private createIncident(params: Partial<SecurityIncident>): SecurityIncident {
    return {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      threatType: params.threatType!,
      severity: params.severity!,
      description: params.description!,
      affectedUsers: params.affectedUsers || [],
      sourceIp: params.sourceIp,
      userAgent: params.userAgent,
      evidenceEvents: [],
      status: 'active',
      mitigationActions: [],
      riskScore: this.calculateRiskScore(params.severity!, params.threatType!),
      metadata: params.metadata || {},
    };
  }

  private calculateRiskScore(severity: ThreatSeverity, threatType: ThreatType): number {
    const severityScores = {
      [ThreatSeverity.LOW]: 25,
      [ThreatSeverity.MEDIUM]: 50,
      [ThreatSeverity.HIGH]: 75,
      [ThreatSeverity.CRITICAL]: 95,
    };

    const threatScores = {
      [ThreatType.BRUTE_FORCE]: 80,
      [ThreatType.CREDENTIAL_STUFFING]: 85,
      [ThreatType.ACCOUNT_TAKEOVER]: 95,
      [ThreatType.INJECTION_ATTACK]: 90,
      [ThreatType.XSS_ATTACK]: 85,
      [ThreatType.DATA_EXFILTRATION]: 95,
      [ThreatType.PRIVILEGE_ESCALATION]: 90,
      [ThreatType.SUSPICIOUS_ACTIVITY]: 60,
      [ThreatType.ANOMALOUS_BEHAVIOR]: 40,
      [ThreatType.CSRF_ATTACK]: 75,
      [ThreatType.DOS_ATTACK]: 70,
    };

    const baseScore = severityScores[severity] || 50;
    const threatScore = threatScores[threatType] || 50;

    return Math.min(100, (baseScore + threatScore) / 2);
  }
}

/**
 * Threat Intelligence System
 */

class ThreatIntelligence {
  private knownBadIps = new Set<string>();
  private knownBadUserAgents = new Set<string>();
  private suspiciousPatterns = new Map<string, number>();

  // Check if IP is known to be malicious
  isKnownBadIp(ip: string): boolean {
    return this.knownBadIps.has(ip);
  }

  // Check if user agent is suspicious
  isSuspiciousUserAgent(userAgent: string): boolean {
    if (this.knownBadUserAgents.has(userAgent)) {
      return true;
    }

    // Check for common bot patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /wget/i,
      /curl/i,
      /python/i,
      /requests/i,
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  // Add IP to blocklist
  blockIp(ip: string): void {
    this.knownBadIps.add(ip);
    securityLogger.info(`IP ${ip} added to blocklist`);
  }

  // Remove IP from blocklist
  unblockIp(ip: string): void {
    this.knownBadIps.delete(ip);
    securityLogger.info(`IP ${ip} removed from blocklist`);
  }

  // Track suspicious patterns
  trackPattern(pattern: string): void {
    const count = this.suspiciousPatterns.get(pattern) || 0;
    this.suspiciousPatterns.set(pattern, count + 1);

    if (count + 1 >= 10) {
      securityLogger.warn(`Suspicious pattern detected ${count + 1} times: ${pattern}`);
    }
  }
}

/**
 * Automated Response System
 */

class AutomatedResponse {
  private responses = new Map<ThreatType, (incident: SecurityIncident) => void>();

  constructor() {
    this.setupResponses();
  }

  private setupResponses(): void {
    // Brute force response
    this.responses.set(ThreatType.BRUTE_FORCE, (incident) => {
      if (incident.sourceIp) {
        threatIntelligence.blockIp(incident.sourceIp);
        incident.mitigationActions.push(`Blocked IP: ${incident.sourceIp}`);
      }
    });

    // Account takeover response
    this.responses.set(ThreatType.ACCOUNT_TAKEOVER, (incident) => {
      // In a real system, this would lock the affected accounts
      incident.mitigationActions.push('Account security review initiated');
    });

    // Data exfiltration response
    this.responses.set(ThreatType.DATA_EXFILTRATION, (incident) => {
      incident.mitigationActions.push('Data access monitoring increased');
      // Alert security team immediately
      this.alertSecurityTeam(incident);
    });

    // Injection attack response
    this.responses.set(ThreatType.INJECTION_ATTACK, (incident) => {
      if (incident.sourceIp) {
        threatIntelligence.blockIp(incident.sourceIp);
        incident.mitigationActions.push(`Blocked IP: ${incident.sourceIp}`);
      }
    });
  }

  // Execute automated response for incident
  respondToIncident(incident: SecurityIncident): void {
    const response = this.responses.get(incident.threatType);
    if (response) {
      try {
        response(incident);
        securityLogger.info(`Automated response executed for ${incident.threatType}`, {
          incidentId: incident.id,
          actions: incident.mitigationActions,
        });
      } catch (error) {
        securityLogger.error(`Automated response failed for ${incident.threatType}`, {
          incidentId: incident.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private alertSecurityTeam(incident: SecurityIncident): void {
    // In production, this would send alerts via email, Slack, PagerDuty, etc.
    securityLogger.critical(`Security team alert: ${incident.description}`, {
      incidentId: incident.id,
      severity: incident.severity,
      riskScore: incident.riskScore,
    });
  }
}

/**
 * Main Security Monitoring System
 */

class SecurityMonitor {
  private incidents = new Map<string, SecurityIncident>();
  private rateLimit = new RateLimitManager();
  private anomalyDetector = new AnomalyDetector();
  private automatedResponse = new AutomatedResponse();

  // Monitor security events
  monitorEvent(eventType: SecurityEventType, metadata: Record<string, any>): void {
    // Rate limiting checks
    this.checkRateLimits(metadata);

    // Anomaly detection
    if (metadata.userId) {
      const anomalies = this.anomalyDetector.detectAnomalies(
        metadata.userId,
        eventType,
        metadata,
      );

      anomalies.forEach(incident => {
        this.recordIncident(incident);
      });

      // Update user behavior baseline
      this.anomalyDetector.updateUserBehavior(metadata.userId, eventType, metadata);
    }

    // Threat intelligence checks
    if (metadata.ipAddress && threatIntelligence.isKnownBadIp(metadata.ipAddress)) {
      const incident = this.createThreatIncident(
        ThreatType.SUSPICIOUS_ACTIVITY,
        ThreatSeverity.HIGH,
        `Request from known bad IP: ${metadata.ipAddress}`,
        metadata,
      );
      this.recordIncident(incident);
    }
  }

  private checkRateLimits(metadata: Record<string, any>): void {
    if (metadata.ipAddress) {
      // Check login rate limiting
      if (metadata.action === 'login') {
        const key = `login:${metadata.ipAddress}`;
        const isLimited = this.rateLimit.checkRateLimit(
          key,
          RATE_LIMIT_CONFIG.LOGIN_ATTEMPTS.MAX_ATTEMPTS,
          RATE_LIMIT_CONFIG.LOGIN_ATTEMPTS.WINDOW_MS,
        );

        if (isLimited) {
          const incident = this.createThreatIncident(
            ThreatType.BRUTE_FORCE,
            ThreatSeverity.HIGH,
            `Login rate limit exceeded for IP: ${metadata.ipAddress}`,
            metadata,
          );
          this.recordIncident(incident);
        }
      }

      // Check API rate limiting
      const apiKey = `api:${metadata.ipAddress}`;
      const isApiLimited = this.rateLimit.checkRateLimit(
        apiKey,
        RATE_LIMIT_CONFIG.API_REQUESTS.MAX_REQUESTS,
        RATE_LIMIT_CONFIG.API_REQUESTS.WINDOW_MS,
      );

      if (isApiLimited) {
        const incident = this.createThreatIncident(
          ThreatType.DOS_ATTACK,
          ThreatSeverity.MEDIUM,
          `API rate limit exceeded for IP: ${metadata.ipAddress}`,
          metadata,
        );
        this.recordIncident(incident);
      }
    }
  }

  private createThreatIncident(
    threatType: ThreatType,
    severity: ThreatSeverity,
    description: string,
    metadata: Record<string, any>,
  ): SecurityIncident {
    return {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      threatType,
      severity,
      description,
      affectedUsers: metadata.userId ? [metadata.userId] : [],
      sourceIp: metadata.ipAddress,
      userAgent: metadata.userAgent,
      evidenceEvents: [],
      status: 'active',
      mitigationActions: [],
      riskScore: this.calculateRiskScore(severity, threatType),
      metadata,
    };
  }

  private calculateRiskScore(severity: ThreatSeverity, threatType: ThreatType): number {
    // Same logic as in AnomalyDetector
    const severityScores = {
      [ThreatSeverity.LOW]: 25,
      [ThreatSeverity.MEDIUM]: 50,
      [ThreatSeverity.HIGH]: 75,
      [ThreatSeverity.CRITICAL]: 95,
    };

    return severityScores[severity] || 50;
  }

  private recordIncident(incident: SecurityIncident): void {
    this.incidents.set(incident.id, incident);

    // Execute automated response
    this.automatedResponse.respondToIncident(incident);

    // Log the incident
    securityLogger.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      `Security incident recorded: ${incident.description}`,
      {
        metadata: {
          incidentId: incident.id,
          threatType: incident.threatType,
          severity: incident.severity,
          riskScore: incident.riskScore,
        },
      },
    );
  }

  // Get all active incidents
  getActiveIncidents(): SecurityIncident[] {
    return Array.from(this.incidents.values()).filter(
      incident => incident.status === 'active',
    );
  }

  // Get incident by ID
  getIncident(id: string): SecurityIncident | null {
    return this.incidents.get(id) || null;
  }

  // Resolve incident
  resolveIncident(id: string): void {
    const incident = this.incidents.get(id);
    if (incident) {
      incident.status = 'resolved';
      securityLogger.info(`Security incident resolved: ${id}`);
    }
  }

  // Clean up old incidents
  cleanup(): void {
    this.rateLimit.cleanup();

    // Remove resolved incidents older than 30 days
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    for (const [id, incident] of this.incidents.entries()) {
      if (incident.status === 'resolved' &&
          new Date(incident.timestamp).getTime() < cutoff) {
        this.incidents.delete(id);
      }
    }
  }
}

// Global instances
const rateLimitManager = new RateLimitManager();
const anomalyDetector = new AnomalyDetector();
const threatIntelligence = new ThreatIntelligence();
const automatedResponse = new AutomatedResponse();
const securityMonitor = new SecurityMonitor();

// Rate limiting utilities for external use
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  return rateLimitManager.checkRateLimit(key, maxRequests, windowMs);
}

export function resetRateLimit(key: string): void {
  rateLimitManager.resetRateLimit(key);
}

// Security monitoring utilities
export function monitorSecurityEvent(eventType: SecurityEventType, metadata: Record<string, any>): void {
  securityMonitor.monitorEvent(eventType, metadata);
}

export function getActiveSecurityIncidents(): SecurityIncident[] {
  return securityMonitor.getActiveIncidents();
}

export function resolveSecurityIncident(id: string): void {
  securityMonitor.resolveIncident(id);
}

// Initialize security monitoring
export function initializeSecurityMonitoring(): void {
  // Start cleanup interval
  setInterval(() => {
    securityMonitor.cleanup();
  }, 60 * 60 * 1000); // Every hour

  securityLogger.info('Security monitoring system initialized', {
    features: ['rate_limiting', 'anomaly_detection', 'threat_intelligence', 'automated_response'],
  });
}

// Export additional types and utilities (ThreatSeverity and ThreatType already exported with enum declarations)
export type {
  SecurityIncident,
  RateLimit,
  AnomalyPattern,
  UserBehavior,
};