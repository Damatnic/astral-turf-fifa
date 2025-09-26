/**
 * Enterprise Rate Limiting and DDoS Protection System
 *
 * Comprehensive protection against abuse, spam, and distributed attacks
 * with intelligent adaptive algorithms and real-time threat detection.
 */

import { securityLogger, SecurityEventType } from './logging';
import { generateUUID } from './encryption';

// Rate limit algorithms
export enum RateLimitAlgorithm {
  TOKEN_BUCKET = 'token_bucket',
  SLIDING_WINDOW = 'sliding_window',
  FIXED_WINDOW = 'fixed_window',
  LEAKY_BUCKET = 'leaky_bucket',
}

// Rate limit scopes
export enum RateLimitScope {
  GLOBAL = 'global',
  PER_IP = 'per_ip',
  PER_USER = 'per_user',
  PER_API_KEY = 'per_api_key',
  PER_ENDPOINT = 'per_endpoint',
}

// Threat levels
export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Rate limit configuration
export interface RateLimitConfig {
  id: string;
  name: string;
  algorithm: RateLimitAlgorithm;
  scope: RateLimitScope;
  maxRequests: number;
  windowMs: number;
  burstLimit?: number;
  enabled: boolean;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator?: (request: unknown) => string;
  onLimitReached?: (key: string, details: RateLimitHit) => void;
  customRules?: RateLimitRule[];
}

// Rate limit rule
export interface RateLimitRule {
  condition: (request: unknown) => boolean;
  maxRequests: number;
  windowMs: number;
  action: 'block' | 'delay' | 'challenge';
  priority: number;
}

// Rate limit hit details
export interface RateLimitHit {
  key: string;
  algorithm: RateLimitAlgorithm;
  scope: RateLimitScope;
  requestCount: number;
  maxRequests: number;
  windowMs: number;
  resetTime: number;
  remainingRequests: number;
  retryAfter: number;
  blocked: boolean;
  threatLevel: ThreatLevel;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
}

// DDoS attack pattern
export interface DDoSPattern {
  id: string;
  name: string;
  description: string;
  indicators: DDoSIndicator[];
  thresholds: DDoSThreshold[];
  mitigations: DDoSMitigation[];
  enabled: boolean;
}

// DDoS indicator
export interface DDoSIndicator {
  type:
    | 'request_rate'
    | 'error_rate'
    | 'response_time'
    | 'concurrent_connections'
    | 'geographic_distribution';
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  timeWindow: number;
}

// DDoS threshold
export interface DDoSThreshold {
  level: ThreatLevel;
  value: number;
  action: 'monitor' | 'alert' | 'rate_limit' | 'block' | 'challenge';
}

// DDoS mitigation
export interface DDoSMitigation {
  type: 'rate_limit' | 'block_ip' | 'challenge' | 'delay' | 'captcha';
  parameters: Record<string, unknown>;
  duration: number;
  enabled: boolean;
}

// Request fingerprint
export interface RequestFingerprint {
  ipAddress: string;
  userAgent: string;
  headers: Record<string, string>;
  method: string;
  path: string;
  timestamp: number;
  geographic?: {
    country: string;
    region: string;
    city: string;
  };
}

// In-memory stores (replace with Redis in production)
const rateLimitStores = new Map<string, Map<string, any>>();
const ddosPatterns = new Map<string, DDoSPattern>();
const activeThreats = new Map<string, ThreatInfo>();
const blockedIPs = new Set<string>();
const challengedIPs = new Map<string, ChallengeInfo>();

interface ThreatInfo {
  level: ThreatLevel;
  firstDetected: number;
  lastSeen: number;
  requestCount: number;
  indicators: string[];
  mitigationsApplied: string[];
}

interface ChallengeInfo {
  type: 'captcha' | 'js_challenge' | 'proof_of_work';
  issued: number;
  expires: number;
  attempts: number;
  solved: boolean;
}

/**
 * Rate Limiting Engine
 */

export class RateLimitingEngine {
  private configs: Map<string, RateLimitConfig> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs(): void {
    // Global rate limiting
    this.addConfig({
      id: 'global-api',
      name: 'Global API Rate Limit',
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
      scope: RateLimitScope.GLOBAL,
      maxRequests: 10000,
      windowMs: 60 * 1000, // 1 minute
      enabled: true,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    });

    // Per-IP rate limiting
    this.addConfig({
      id: 'per-ip-strict',
      name: 'Per-IP Strict Rate Limit',
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
      scope: RateLimitScope.PER_IP,
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
      burstLimit: 150,
      enabled: true,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: req => req.ip || 'unknown',
    });

    // Authentication endpoint protection
    this.addConfig({
      id: 'auth-endpoints',
      name: 'Authentication Endpoints',
      algorithm: RateLimitAlgorithm.FIXED_WINDOW,
      scope: RateLimitScope.PER_IP,
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      enabled: true,
      skipSuccessfulRequests: true,
      skipFailedRequests: false,
      keyGenerator: req => `auth:${req.ip}`,
      customRules: [
        {
          condition: req => req.path?.includes('/login'),
          maxRequests: 5,
          windowMs: 15 * 60 * 1000,
          action: 'block',
          priority: 1,
        },
        {
          condition: req => req.path?.includes('/signup'),
          maxRequests: 3,
          windowMs: 60 * 60 * 1000, // 1 hour
          action: 'block',
          priority: 1,
        },
      ],
    });

    // API endpoints per user
    this.addConfig({
      id: 'per-user-api',
      name: 'Per-User API Rate Limit',
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
      scope: RateLimitScope.PER_USER,
      maxRequests: 1000,
      windowMs: 60 * 1000, // 1 minute
      enabled: true,
      skipSuccessfulRequests: false,
      skipFailedRequests: true,
      keyGenerator: req => `user:${req.userId || 'anonymous'}`,
    });
  }

  public addConfig(config: RateLimitConfig): void {
    this.configs.set(config.id, config);

    securityLogger.info('Rate limit configuration added', {
      configId: config.id,
      name: config.name,
      algorithm: config.algorithm,
      scope: config.scope,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
    });
  }

  public checkRateLimit(request: unknown, configId?: string): RateLimitHit | null {
    if (!this.enabled) {
      return null;
    }

    const configs = configId
      ? [this.configs.get(configId)].filter(Boolean)
      : Array.from(this.configs.values()).filter(c => c.enabled);

    for (const config of configs) {
      // Apply custom rules first
      if (config.customRules) {
        for (const rule of config.customRules.sort((a, b) => b.priority - a.priority)) {
          if (rule.condition(request)) {
            const hit = this.checkRule(request, config, rule);
            if (hit) {
              return hit;
            }
          }
        }
      }

      // Apply standard rate limiting
      const hit = this.checkStandardLimit(request, config);
      if (hit) {
        return hit;
      }
    }

    return null;
  }

  private checkRule(
    request: unknown,
    config: RateLimitConfig,
    rule: RateLimitRule,
  ): RateLimitHit | null {
    const key = this.generateKey(request, config);
    const now = Date.now();

    const store = this.getStore(config.id);
    const entry = store.get(key) || { count: 0, resetTime: now + rule.windowMs, requests: [] };

    // Clean old requests for sliding window
    if (config.algorithm === RateLimitAlgorithm.SLIDING_WINDOW) {
      entry.requests = entry.requests.filter((time: number) => now - time < rule.windowMs);
      entry.count = entry.requests.length;
    }

    // Check if window has expired
    if (now >= entry.resetTime && config.algorithm !== RateLimitAlgorithm.SLIDING_WINDOW) {
      entry.count = 0;
      entry.resetTime = now + rule.windowMs;
    }

    // Check rate limit
    if (entry.count >= rule.maxRequests) {
      const hit: RateLimitHit = {
        key,
        algorithm: config.algorithm,
        scope: config.scope,
        requestCount: entry.count,
        maxRequests: rule.maxRequests,
        windowMs: rule.windowMs,
        resetTime: entry.resetTime,
        remainingRequests: 0,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        blocked: rule.action === 'block',
        threatLevel: this.calculateThreatLevel(entry.count, rule.maxRequests),
        userAgent: request.userAgent,
        ipAddress: request.ip,
        endpoint: request.path,
      };

      this.handleRateLimitHit(hit, config);
      return hit;
    }

    // Update counter
    entry.count++;
    if (config.algorithm === RateLimitAlgorithm.SLIDING_WINDOW) {
      entry.requests.push(now);
    }
    store.set(key, entry);

    return null;
  }

  private checkStandardLimit(request: unknown, config: RateLimitConfig): RateLimitHit | null {
    const key = this.generateKey(request, config);

    switch (config.algorithm) {
      case RateLimitAlgorithm.TOKEN_BUCKET:
        return this.checkTokenBucket(request, config, key);

      case RateLimitAlgorithm.SLIDING_WINDOW:
        return this.checkSlidingWindow(request, config, key);

      case RateLimitAlgorithm.FIXED_WINDOW:
        return this.checkFixedWindow(request, config, key);

      case RateLimitAlgorithm.LEAKY_BUCKET:
        return this.checkLeakyBucket(request, config, key);

      default:
        return this.checkFixedWindow(request, config, key);
    }
  }

  private checkTokenBucket(
    request: unknown,
    config: RateLimitConfig,
    key: string,
  ): RateLimitHit | null {
    const store = this.getStore(config.id);
    const now = Date.now();
    const entry = store.get(key) || {
      tokens: config.maxRequests,
      lastRefill: now,
      burstUsed: 0,
    };

    // Refill tokens
    const timePassed = now - entry.lastRefill;
    const tokensToAdd = Math.floor((timePassed / config.windowMs) * config.maxRequests);
    entry.tokens = Math.min(config.maxRequests, entry.tokens + tokensToAdd);
    entry.lastRefill = now;

    // Check burst limit
    const burstLimit = config.burstLimit || config.maxRequests;
    if (entry.burstUsed >= burstLimit) {
      entry.burstUsed = Math.max(0, entry.burstUsed - tokensToAdd);
    }

    if (entry.tokens <= 0 || entry.burstUsed >= burstLimit) {
      const hit: RateLimitHit = {
        key,
        algorithm: config.algorithm,
        scope: config.scope,
        requestCount: config.maxRequests - entry.tokens,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        resetTime: now + config.windowMs,
        remainingRequests: entry.tokens,
        retryAfter: Math.ceil(config.windowMs / config.maxRequests),
        blocked: true,
        threatLevel: this.calculateThreatLevel(
          config.maxRequests - entry.tokens,
          config.maxRequests,
        ),
        userAgent: request.userAgent,
        ipAddress: request.ip,
        endpoint: request.path,
      };

      this.handleRateLimitHit(hit, config);
      return hit;
    }

    // Consume token
    entry.tokens--;
    entry.burstUsed++;
    store.set(key, entry);

    return null;
  }

  private checkSlidingWindow(
    request: unknown,
    config: RateLimitConfig,
    key: string,
  ): RateLimitHit | null {
    const store = this.getStore(config.id);
    const now = Date.now();
    const entry = store.get(key) || { requests: [] };

    // Remove old requests
    entry.requests = entry.requests.filter((time: number) => now - time < config.windowMs);

    if (entry.requests.length >= config.maxRequests) {
      const oldestRequest = Math.min(...entry.requests);
      const hit: RateLimitHit = {
        key,
        algorithm: config.algorithm,
        scope: config.scope,
        requestCount: entry.requests.length,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        resetTime: oldestRequest + config.windowMs,
        remainingRequests: 0,
        retryAfter: Math.ceil((oldestRequest + config.windowMs - now) / 1000),
        blocked: true,
        threatLevel: this.calculateThreatLevel(entry.requests.length, config.maxRequests),
        userAgent: request.userAgent,
        ipAddress: request.ip,
        endpoint: request.path,
      };

      this.handleRateLimitHit(hit, config);
      return hit;
    }

    // Add current request
    entry.requests.push(now);
    store.set(key, entry);

    return null;
  }

  private checkFixedWindow(
    request: unknown,
    config: RateLimitConfig,
    key: string,
  ): RateLimitHit | null {
    const store = this.getStore(config.id);
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const windowKey = `${key}:${windowStart}`;

    const entry = store.get(windowKey) || { count: 0, resetTime: windowStart + config.windowMs };

    if (entry.count >= config.maxRequests) {
      const hit: RateLimitHit = {
        key,
        algorithm: config.algorithm,
        scope: config.scope,
        requestCount: entry.count,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        resetTime: entry.resetTime,
        remainingRequests: 0,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        blocked: true,
        threatLevel: this.calculateThreatLevel(entry.count, config.maxRequests),
        userAgent: request.userAgent,
        ipAddress: request.ip,
        endpoint: request.path,
      };

      this.handleRateLimitHit(hit, config);
      return hit;
    }

    // Increment counter
    entry.count++;
    store.set(windowKey, entry);

    return null;
  }

  private checkLeakyBucket(
    request: unknown,
    config: RateLimitConfig,
    key: string,
  ): RateLimitHit | null {
    const store = this.getStore(config.id);
    const now = Date.now();
    const entry = store.get(key) || { level: 0, lastLeak: now };

    // Leak requests
    const timePassed = now - entry.lastLeak;
    const leakRate = config.maxRequests / config.windowMs; // requests per ms
    const leakedRequests = timePassed * leakRate;
    entry.level = Math.max(0, entry.level - leakedRequests);
    entry.lastLeak = now;

    if (entry.level >= config.maxRequests) {
      const hit: RateLimitHit = {
        key,
        algorithm: config.algorithm,
        scope: config.scope,
        requestCount: Math.ceil(entry.level),
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        resetTime: now + (entry.level - config.maxRequests) / leakRate,
        remainingRequests: Math.max(0, config.maxRequests - entry.level),
        retryAfter: Math.ceil((entry.level - config.maxRequests) / leakRate / 1000),
        blocked: true,
        threatLevel: this.calculateThreatLevel(entry.level, config.maxRequests),
        userAgent: request.userAgent,
        ipAddress: request.ip,
        endpoint: request.path,
      };

      this.handleRateLimitHit(hit, config);
      return hit;
    }

    // Add current request
    entry.level++;
    store.set(key, entry);

    return null;
  }

  private generateKey(request: unknown, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    switch (config.scope) {
      case RateLimitScope.GLOBAL:
        return 'global';

      case RateLimitScope.PER_IP:
        return `ip:${request.ip || 'unknown'}`;

      case RateLimitScope.PER_USER:
        return `user:${request.userId || 'anonymous'}`;

      case RateLimitScope.PER_API_KEY:
        return `apikey:${request.apiKey || 'none'}`;

      case RateLimitScope.PER_ENDPOINT:
        return `endpoint:${request.method}:${request.path}`;

      default:
        return 'default';
    }
  }

  private getStore(configId: string): Map<string, any> {
    if (!rateLimitStores.has(configId)) {
      rateLimitStores.set(configId, new Map());
    }
    return rateLimitStores.get(configId)!;
  }

  private calculateThreatLevel(current: number, max: number): ThreatLevel {
    const ratio = current / max;

    if (ratio >= 3) {
      return ThreatLevel.CRITICAL;
    }
    if (ratio >= 2) {
      return ThreatLevel.HIGH;
    }
    if (ratio >= 1.5) {
      return ThreatLevel.MEDIUM;
    }
    return ThreatLevel.LOW;
  }

  private handleRateLimitHit(hit: RateLimitHit, config: RateLimitConfig): void {
    securityLogger.logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, 'Rate limit exceeded', {
      metadata: {
        ...hit,
        configId: config.id,
        configName: config.name,
      },
    });

    if (config.onLimitReached) {
      config.onLimitReached(hit.key, hit);
    }

    // Track threat patterns
    this.trackThreatPattern(hit);
  }

  private trackThreatPattern(hit: RateLimitHit): void {
    if (!hit.ipAddress) {
      return;
    }

    const threat = activeThreats.get(hit.ipAddress) || {
      level: ThreatLevel.LOW,
      firstDetected: Date.now(),
      lastSeen: Date.now(),
      requestCount: 0,
      indicators: [],
      mitigationsApplied: [],
    };

    threat.lastSeen = Date.now();
    threat.requestCount++;
    threat.level = hit.threatLevel;

    if (hit.threatLevel === ThreatLevel.CRITICAL || hit.threatLevel === ThreatLevel.HIGH) {
      threat.indicators.push(`rate_limit_${hit.algorithm}_${Date.now()}`);
    }

    activeThreats.set(hit.ipAddress, threat);

    // Apply automatic mitigations
    this.applyAutoMitigations(hit.ipAddress, threat);
  }

  private applyAutoMitigations(ipAddress: string, threat: ThreatInfo): void {
    if (threat.level === ThreatLevel.CRITICAL && !blockedIPs.has(ipAddress)) {
      this.blockIP(ipAddress, 60 * 60 * 1000); // 1 hour block
      threat.mitigationsApplied.push('ip_block');
    } else if (threat.level === ThreatLevel.HIGH && !challengedIPs.has(ipAddress)) {
      this.challengeIP(ipAddress, 'js_challenge', 30 * 60 * 1000); // 30 minute challenge
      threat.mitigationsApplied.push('js_challenge');
    }
  }

  public blockIP(ipAddress: string, durationMs: number): void {
    blockedIPs.add(ipAddress);

    setTimeout(() => {
      blockedIPs.delete(ipAddress);
      securityLogger.info('IP unblocked after timeout', { ipAddress, durationMs });
    }, durationMs);

    securityLogger.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      'IP address blocked due to abuse',
      {
        metadata: { ipAddress, durationMs, reason: 'rate_limiting' },
      },
    );
  }

  public challengeIP(
    ipAddress: string,
    challengeType: 'captcha' | 'js_challenge' | 'proof_of_work',
    durationMs: number,
  ): void {
    const challenge: ChallengeInfo = {
      type: challengeType,
      issued: Date.now(),
      expires: Date.now() + durationMs,
      attempts: 0,
      solved: false,
    };

    challengedIPs.set(ipAddress, challenge);

    setTimeout(() => {
      challengedIPs.delete(ipAddress);
      securityLogger.info('Challenge expired', { ipAddress, challengeType });
    }, durationMs);

    securityLogger.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      'Challenge issued to IP address',
      {
        metadata: { ipAddress, challengeType, durationMs },
      },
    );
  }

  public isBlocked(ipAddress: string): boolean {
    return blockedIPs.has(ipAddress);
  }

  public isChallenged(ipAddress: string): ChallengeInfo | null {
    return challengedIPs.get(ipAddress) || null;
  }

  public solveChallenge(ipAddress: string): boolean {
    const challenge = challengedIPs.get(ipAddress);
    if (challenge && !challenge.solved && Date.now() < challenge.expires) {
      challenge.solved = true;
      challengedIPs.delete(ipAddress);

      securityLogger.info('Challenge solved successfully', {
        ipAddress,
        challengeType: challenge.type,
        attempts: challenge.attempts,
      });

      return true;
    }
    return false;
  }

  public enable(): void {
    this.enabled = true;
    securityLogger.info('Rate limiting engine enabled');
  }

  public disable(): void {
    this.enabled = false;
    securityLogger.warn('Rate limiting engine disabled');
  }

  public getStats(): unknown {
    return {
      enabled: this.enabled,
      configs: this.configs.size,
      activeThreats: activeThreats.size,
      blockedIPs: blockedIPs.size,
      challengedIPs: challengedIPs.size,
      stores: Array.from(rateLimitStores.entries()).map(([id, store]) => ({
        configId: id,
        entries: store.size,
      })),
    };
  }

  public cleanup(): void {
    const now = Date.now();

    // Clean up expired entries
    rateLimitStores.forEach((store, configId) => {
      const config = this.configs.get(configId);
      if (!config) {
        return;
      }

      store.forEach((entry, key) => {
        if (entry.resetTime && now >= entry.resetTime) {
          store.delete(key);
        }
      });
    });

    // Clean up old threats
    activeThreats.forEach((threat, ipAddress) => {
      if (now - threat.lastSeen > 24 * 60 * 60 * 1000) {
        // 24 hours
        activeThreats.delete(ipAddress);
      }
    });

    securityLogger.info('Rate limiting cleanup completed');
  }
}

// Global rate limiting engine instance
export const rateLimitingEngine = new RateLimitingEngine();

// Start cleanup interval (every 5 minutes)
setInterval(
  () => {
    rateLimitingEngine.cleanup();
  },
  5 * 60 * 1000,
);

// Export utilities
export const rateLimitUtils = {
  checkRateLimit: (request: unknown, configId?: string) =>
    rateLimitingEngine.checkRateLimit(request, configId),
  isBlocked: (ipAddress: string) => rateLimitingEngine.isBlocked(ipAddress),
  isChallenged: (ipAddress: string) => rateLimitingEngine.isChallenged(ipAddress),
  blockIP: (ipAddress: string, duration: number) => rateLimitingEngine.blockIP(ipAddress, duration),
  challengeIP: (
    ipAddress: string,
    type: 'captcha' | 'js_challenge' | 'proof_of_work',
    duration: number,
  ) => rateLimitingEngine.challengeIP(ipAddress, type, duration),
  solveChallenge: (ipAddress: string) => rateLimitingEngine.solveChallenge(ipAddress),
  getStats: () => rateLimitingEngine.getStats(),
};
