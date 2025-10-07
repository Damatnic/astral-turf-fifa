/**
 * Guardian Security Headers & Content Security Policy
 * Enterprise-grade security headers implementation for web application protection
 */

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    enabled: boolean;
    reportOnly?: boolean;
    directives?: CSPDirectives;
    reportUri?: string;
  };
  strictTransportSecurity?: {
    enabled: boolean;
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  xFrameOptions?: {
    enabled: boolean;
    policy: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    allowFrom?: string;
  };
  xContentTypeOptions?: {
    enabled: boolean;
    nosniff: boolean;
  };
  referrerPolicy?: {
    enabled: boolean;
    policy:
      | 'no-referrer'
      | 'no-referrer-when-downgrade'
      | 'origin'
      | 'origin-when-cross-origin'
      | 'same-origin'
      | 'strict-origin'
      | 'strict-origin-when-cross-origin'
      | 'unsafe-url';
  };
  permissionsPolicy?: {
    enabled: boolean;
    directives?: PermissionsPolicyDirectives;
  };
  crossOriginEmbedderPolicy?: {
    enabled: boolean;
    policy: 'unsafe-none' | 'require-corp' | 'credentialless';
  };
  crossOriginOpenerPolicy?: {
    enabled: boolean;
    policy: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin';
  };
  crossOriginResourcePolicy?: {
    enabled: boolean;
    policy: 'same-site' | 'same-origin' | 'cross-origin';
  };
}

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'child-src'?: string[];
  'frame-src'?: string[];
  'worker-src'?: string[];
  'manifest-src'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'navigate-to'?: string[];
  'report-uri'?: string[];
  'report-to'?: string[];
  'trusted-types'?: string[];
  'require-trusted-types-for'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

export interface PermissionsPolicyDirectives {
  accelerometer?: string[];
  autoplay?: string[];
  camera?: string[];
  'display-capture'?: string[];
  'encrypted-media'?: string[];
  fullscreen?: string[];
  geolocation?: string[];
  gyroscope?: string[];
  magnetometer?: string[];
  microphone?: string[];
  midi?: string[];
  payment?: string[];
  'picture-in-picture'?: string[];
  'publickey-credentials-get'?: string[];
  'screen-wake-lock'?: string[];
  'sync-xhr'?: string[];
  usb?: string[];
  'web-share'?: string[];
  'xr-spatial-tracking'?: string[];
}

export interface SecurityViolationReport {
  id: string;
  type: 'csp' | 'hpkp' | 'hsts' | 'expect-ct';
  violatedDirective: string;
  blockedUri: string;
  documentUri: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  disposition: 'enforce' | 'report';
  effectiveDirective: string;
  originalPolicy: string;
  statusCode: number;
}

/**
 * Default security configuration for maximum protection
 */
const DEFAULT_SECURITY_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    enabled: true,
    reportOnly: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for React development
        "'unsafe-eval'", // Required for development builds
        'https://apis.google.com',
        'https://www.google.com',
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and CSS-in-JS
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://images.unsplash.com',
        'https://ui-avatars.com',
      ],
      'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
      'connect-src': [
        "'self'",
        'https://api.openai.com',
        'https://api.anthropic.com',
        'https://api.google.com',
        'https://generativelanguage.googleapis.com',
        'https://*.vercel.app',
        'https://*.netlify.app',
        'ws://localhost:*',
        'wss://localhost:*',
      ],
      'media-src': ["'self'", 'data:', 'blob:'],
      'object-src': ["'none'"],
      'child-src': ["'self'"],
      'frame-src': ["'self'", 'https://www.google.com', 'https://accounts.google.com'],
      'worker-src': ["'self'", 'blob:'],
      'manifest-src': ["'self'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': true,
      'block-all-mixed-content': true,
    },
    reportUri: '/api/security/csp-report',
  },
  strictTransportSecurity: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  xFrameOptions: {
    enabled: true,
    policy: 'DENY',
  },
  xContentTypeOptions: {
    enabled: true,
    nosniff: true,
  },
  referrerPolicy: {
    enabled: true,
    policy: 'strict-origin-when-cross-origin',
  },
  permissionsPolicy: {
    enabled: true,
    directives: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      fullscreen: ["'self'"],
      autoplay: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: {
    enabled: true,
    policy: 'require-corp',
  },
  crossOriginOpenerPolicy: {
    enabled: true,
    policy: 'same-origin',
  },
  crossOriginResourcePolicy: {
    enabled: true,
    policy: 'same-origin',
  },
};

/**
 * Development-friendly security configuration
 */
const DEVELOPMENT_SECURITY_CONFIG: SecurityHeadersConfig = {
  ...DEFAULT_SECURITY_CONFIG,
  contentSecurityPolicy: {
    ...DEFAULT_SECURITY_CONFIG.contentSecurityPolicy!,
    reportOnly: true, // Use report-only mode in development
    directives: {
      ...DEFAULT_SECURITY_CONFIG.contentSecurityPolicy!.directives!,
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'localhost:*',
        '127.0.0.1:*',
        'ws://localhost:*',
        'wss://localhost:*',
        'https://apis.google.com',
        'https://www.google.com',
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
      ],
      'connect-src': [
        "'self'",
        'localhost:*',
        '127.0.0.1:*',
        'ws://localhost:*',
        'wss://localhost:*',
        'https://api.openai.com',
        'https://api.anthropic.com',
        'https://api.google.com',
        'https://generativelanguage.googleapis.com',
        'https://*.vercel.app',
        'https://*.netlify.app',
      ],
    },
  },
  strictTransportSecurity: {
    ...DEFAULT_SECURITY_CONFIG.strictTransportSecurity!,
    enabled: false, // Disable HSTS in development
  },
  crossOriginEmbedderPolicy: {
    ...DEFAULT_SECURITY_CONFIG.crossOriginEmbedderPolicy!,
    policy: 'unsafe-none', // More permissive in development
  },
};

/**
 * Guardian Security Headers Service
 * Manages security headers, CSP policies, and violation reporting
 */
class SecurityHeadersService {
  private config: SecurityHeadersConfig;
  private violations: SecurityViolationReport[] = [];
  private environment: 'development' | 'production' | 'test';

  constructor(environment: 'development' | 'production' | 'test' = 'production') {
    this.environment = environment;
    this.config =
      environment === 'development' ? DEVELOPMENT_SECURITY_CONFIG : DEFAULT_SECURITY_CONFIG;
  }

  /**
   * Generate all security headers as a key-value object
   */
  generateHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (this.config.contentSecurityPolicy?.enabled) {
      const cspHeader = this.generateCSPHeader();
      if (this.config.contentSecurityPolicy.reportOnly) {
        headers['Content-Security-Policy-Report-Only'] = cspHeader;
      } else {
        headers['Content-Security-Policy'] = cspHeader;
      }
    }

    // Strict Transport Security
    if (this.config.strictTransportSecurity?.enabled) {
      headers['Strict-Transport-Security'] = this.generateHSTSHeader();
    }

    // X-Frame-Options
    if (this.config.xFrameOptions?.enabled) {
      headers['X-Frame-Options'] = this.generateXFrameOptionsHeader();
    }

    // X-Content-Type-Options
    if (this.config.xContentTypeOptions?.enabled) {
      headers['X-Content-Type-Options'] = this.config.xContentTypeOptions.nosniff ? 'nosniff' : '';
    }

    // Referrer Policy
    if (this.config.referrerPolicy?.enabled) {
      headers['Referrer-Policy'] = this.config.referrerPolicy.policy;
    }

    // Permissions Policy
    if (this.config.permissionsPolicy?.enabled) {
      headers['Permissions-Policy'] = this.generatePermissionsPolicyHeader();
    }

    // Cross-Origin-Embedder-Policy
    if (this.config.crossOriginEmbedderPolicy?.enabled) {
      headers['Cross-Origin-Embedder-Policy'] = this.config.crossOriginEmbedderPolicy.policy;
    }

    // Cross-Origin-Opener-Policy
    if (this.config.crossOriginOpenerPolicy?.enabled) {
      headers['Cross-Origin-Opener-Policy'] = this.config.crossOriginOpenerPolicy.policy;
    }

    // Cross-Origin-Resource-Policy
    if (this.config.crossOriginResourcePolicy?.enabled) {
      headers['Cross-Origin-Resource-Policy'] = this.config.crossOriginResourcePolicy.policy;
    }

    // Additional security headers
    headers['X-DNS-Prefetch-Control'] = 'off';
    headers['X-Download-Options'] = 'noopen';
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';
    headers['X-XSS-Protection'] = '1; mode=block';

    return headers;
  }

  /**
   * Generate security headers as HTML meta tags
   */
  generateMetaTags(): string[] {
    const metaTags: string[] = [];

    // CSP meta tag (for HTML documents)
    if (
      this.config.contentSecurityPolicy?.enabled &&
      !this.config.contentSecurityPolicy.reportOnly
    ) {
      const cspHeader = this.generateCSPHeader();
      metaTags.push(`<meta http-equiv="Content-Security-Policy" content="${cspHeader}">`);
    }

    // Referrer Policy
    if (this.config.referrerPolicy?.enabled) {
      metaTags.push(`<meta name="referrer" content="${this.config.referrerPolicy.policy}">`);
    }

    // Additional meta tags for security
    metaTags.push('<meta name="robots" content="noarchive">');
    metaTags.push('<meta name="format-detection" content="telephone=no">');

    return metaTags;
  }

  /**
   * Process CSP violation report
   */
  processViolationReport(report: any): SecurityViolationReport {
    const violation: SecurityViolationReport = {
      id: this.generateViolationId(),
      type: 'csp',
      violatedDirective: report['violated-directive'] || '',
      blockedUri: report['blocked-uri'] || '',
      documentUri: report['document-uri'] || '',
      referrer: report.referrer || '',
      userAgent: report['user-agent'] || '',
      timestamp: new Date().toISOString(),
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      disposition: report.disposition || 'enforce',
      effectiveDirective: report['effective-directive'] || '',
      originalPolicy: report['original-policy'] || '',
      statusCode: report['status-code'] || 0,
    };

    this.violations.push(violation);
    this.analyzeViolation(violation);

    return violation;
  }

  /**
   * Get violation statistics for monitoring
   */
  getViolationStats(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): {
    totalViolations: number;
    violationsByDirective: Record<string, number>;
    violationsByUri: Record<string, number>;
    violationsByUserAgent: Record<string, number>;
    trends: Array<{ date: string; count: number }>;
    topViolations: Array<{
      directive: string;
      count: number;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
    }>;
  } {
    const now = new Date();
    const timeframeMs = this.getTimeframeInMs(timeframe);
    const cutoff = new Date(now.getTime() - timeframeMs);

    const recentViolations = this.violations.filter(v => new Date(v.timestamp) >= cutoff);

    const violationsByDirective = recentViolations.reduce(
      (acc, v) => {
        acc[v.violatedDirective] = (acc[v.violatedDirective] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const violationsByUri = recentViolations.reduce(
      (acc, v) => {
        acc[v.blockedUri] = (acc[v.blockedUri] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const violationsByUserAgent = recentViolations.reduce(
      (acc, v) => {
        const browser = this.extractBrowser(v.userAgent);
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Generate trend data
    const trends = this.generateTrendData(recentViolations, timeframe);

    // Top violations with risk assessment
    const topViolations = Object.entries(violationsByDirective)
      .map(([directive, count]) => ({
        directive,
        count,
        riskLevel: this.assessDirectiveRisk(directive),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalViolations: recentViolations.length,
      violationsByDirective,
      violationsByUri,
      violationsByUserAgent,
      trends,
      topViolations,
    };
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Validate security configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate CSP directives
    if (this.config.contentSecurityPolicy?.enabled) {
      const directives = this.config.contentSecurityPolicy.directives;
      if (directives) {
        // Check for unsafe directives in production
        if (this.environment === 'production') {
          if (directives['script-src']?.includes("'unsafe-eval'")) {
            errors.push("'unsafe-eval' should not be used in production");
          }
          if (directives['script-src']?.includes("'unsafe-inline'")) {
            errors.push("'unsafe-inline' for scripts should be avoided in production");
          }
        }

        // Check for overly permissive directives
        if (directives['default-src']?.includes('*')) {
          errors.push('Wildcard (*) in default-src is too permissive');
        }
      }
    }

    // Validate HSTS configuration
    if (this.config.strictTransportSecurity?.enabled) {
      const maxAge = this.config.strictTransportSecurity.maxAge || 0;
      if (maxAge < 86400) {
        // 1 day
        errors.push('HSTS max-age should be at least 1 day (86400 seconds)');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate nonce for inline scripts/styles
   */
  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Add nonce to CSP directives
   */
  addNonceToCSP(nonce: string): void {
    if (this.config.contentSecurityPolicy?.directives) {
      const directives = this.config.contentSecurityPolicy.directives;

      if (directives['script-src']) {
        directives['script-src'].push(`'nonce-${nonce}'`);
      }

      if (directives['style-src']) {
        directives['style-src'].push(`'nonce-${nonce}'`);
      }
    }
  }

  // Private helper methods
  private generateCSPHeader(): string {
    const directives = this.config.contentSecurityPolicy?.directives;
    if (!directives) {
      return '';
    }

    const parts: string[] = [];

    Object.entries(directives).forEach(([directive, values]) => {
      if (typeof values === 'boolean') {
        if (values) {
          parts.push(directive);
        }
      } else if (Array.isArray(values) && values.length > 0) {
        parts.push(`${directive} ${values.join(' ')}`);
      }
    });

    // Add report-uri if configured
    if (this.config.contentSecurityPolicy?.reportUri) {
      parts.push(`report-uri ${this.config.contentSecurityPolicy.reportUri}`);
    }

    return parts.join('; ');
  }

  private generateHSTSHeader(): string {
    const config = this.config.strictTransportSecurity!;
    let header = `max-age=${config.maxAge || 31536000}`;

    if (config.includeSubDomains) {
      header += '; includeSubDomains';
    }

    if (config.preload) {
      header += '; preload';
    }

    return header;
  }

  private generateXFrameOptionsHeader(): string {
    const config = this.config.xFrameOptions!;

    if (config.policy === 'ALLOW-FROM' && config.allowFrom) {
      return `ALLOW-FROM ${config.allowFrom}`;
    }

    return config.policy;
  }

  private generatePermissionsPolicyHeader(): string {
    const directives = this.config.permissionsPolicy?.directives;
    if (!directives) {
      return '';
    }

    const parts: string[] = [];

    Object.entries(directives).forEach(([directive, values]) => {
      if (Array.isArray(values)) {
        const allowList = values.length > 0 ? values.join(' ') : '()';
        parts.push(`${directive}=(${allowList})`);
      }
    });

    return parts.join(', ');
  }

  private analyzeViolation(violation: SecurityViolationReport): void {
    // Log violation for monitoring
    console.warn('[CSP VIOLATION]', {
      directive: violation.violatedDirective,
      blockedUri: violation.blockedUri,
      documentUri: violation.documentUri,
      userAgent: violation.userAgent,
    });

    // Check for potential attacks
    if (this.isPotentialAttack(violation)) {
      console.error('[POTENTIAL ATTACK DETECTED]', violation);
      // In a real implementation, alert security team
    }
  }

  private isPotentialAttack(violation: SecurityViolationReport): boolean {
    // Check for common attack patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /<script/i,
      /eval\(/i,
    ];

    return suspiciousPatterns.some(
      pattern => pattern.test(violation.blockedUri) || pattern.test(violation.sourceFile || ''),
    );
  }

  private extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) {
      return 'Chrome';
    }
    if (userAgent.includes('Firefox')) {
      return 'Firefox';
    }
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'Safari';
    }
    if (userAgent.includes('Edge')) {
      return 'Edge';
    }
    if (userAgent.includes('Opera')) {
      return 'Opera';
    }
    return 'Other';
  }

  private assessDirectiveRisk(directive: string): 'low' | 'medium' | 'high' | 'critical' {
    const riskMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'script-src': 'critical',
      'object-src': 'high',
      'frame-src': 'high',
      'style-src': 'medium',
      'img-src': 'low',
      'font-src': 'low',
      'media-src': 'low',
    };

    return riskMap[directive] || 'medium';
  }

  private generateTrendData(
    violations: SecurityViolationReport[],
    timeframe: '1h' | '24h' | '7d' | '30d',
  ): Array<{ date: string; count: number }> {
    const trends: Array<{ date: string; count: number }> = [];
    const now = new Date();

    let interval: number;
    let format: (date: Date) => string;

    switch (timeframe) {
      case '1h':
        interval = 5 * 60 * 1000; // 5 minutes
        format = date => date.toISOString().substring(0, 16);
        break;
      case '24h':
        interval = 60 * 60 * 1000; // 1 hour
        format = date => date.toISOString().substring(0, 13);
        break;
      case '7d':
        interval = 24 * 60 * 60 * 1000; // 1 day
        format = date => date.toISOString().substring(0, 10);
        break;
      case '30d':
        interval = 24 * 60 * 60 * 1000; // 1 day
        format = date => date.toISOString().substring(0, 10);
        break;
    }

    const buckets = new Map<string, number>();

    violations.forEach(violation => {
      const violationTime = new Date(violation.timestamp);
      const bucketTime = new Date(Math.floor(violationTime.getTime() / interval) * interval);
      const bucketKey = format(bucketTime);
      buckets.set(bucketKey, (buckets.get(bucketKey) || 0) + 1);
    });

    // Fill in missing buckets with zero counts
    const timeframeMs = this.getTimeframeInMs(timeframe);
    for (let time = now.getTime() - timeframeMs; time <= now.getTime(); time += interval) {
      const bucketKey = format(new Date(time));
      trends.push({
        date: bucketKey,
        count: buckets.get(bucketKey) || 0,
      });
    }

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }

  private getTimeframeInMs(timeframe: '1h' | '24h' | '7d' | '30d'): number {
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    return timeframes[timeframe];
  }

  private generateViolationId(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}

// Export singleton instance
export const securityHeaders = new SecurityHeadersService(
  ((typeof process !== 'undefined' && process.env.NODE_ENV) || 'production') as
    | 'development'
    | 'production'
    | 'test',
);

// Export convenience functions
export const getSecurityHeaders = () => securityHeaders.generateHeaders();

export const getSecurityMetaTags = () => securityHeaders.generateMetaTags();

export const reportViolation = (report: any) => securityHeaders.processViolationReport(report);

export const getSecurityStats = (timeframe?: '1h' | '24h' | '7d' | '30d') =>
  securityHeaders.getViolationStats(timeframe);

export const validateSecurityConfig = () => securityHeaders.validateConfig();

export const generateSecureNonce = () => securityHeaders.generateNonce();

export const updateSecurityConfig = (config: Partial<SecurityHeadersConfig>) =>
  securityHeaders.updateConfig(config);

// Export for Vite configuration
export const getViteSecurityConfig = () => ({
  headers: getSecurityHeaders(),
  metaTags: getSecurityMetaTags(),
});
