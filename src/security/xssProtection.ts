/**
 * Guardian XSS Protection System
 * Advanced Cross-Site Scripting prevention with multiple layers of protection
 */

import DOMPurify from 'dompurify';
import { securityLogger } from './logging';

export interface XSSDetectionResult {
  isClean: boolean;
  threats: XSSThreat[];
  sanitizedContent: string;
  riskScore: number;
}

export interface XSSThreat {
  type:
    | 'script_injection'
    | 'html_injection'
    | 'attribute_injection'
    | 'url_injection'
    | 'css_injection';
  payload: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
}

export interface XSSProtectionConfig {
  enableStrictMode: boolean;
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
  blockDataURIs: boolean;
  blockJavaScriptURIs: boolean;
  removeComments: boolean;
  removeProcessingInstructions: boolean;
  logViolations: boolean;
}

/**
 * Default XSS Protection Configuration
 */
const DEFAULT_XSS_CONFIG: XSSProtectionConfig = {
  enableStrictMode: true,
  allowedTags: [
    'b',
    'i',
    'em',
    'strong',
    'u',
    'br',
    'p',
    'div',
    'span',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target'],
    img: ['src', 'alt', 'width', 'height'],
    div: ['class', 'id'],
    span: ['class', 'id'],
    p: ['class', 'id'],
    '*': ['class', 'id'],
  },
  blockDataURIs: true,
  blockJavaScriptURIs: true,
  removeComments: true,
  removeProcessingInstructions: true,
  logViolations: true,
};

/**
 * XSS Attack Patterns for Detection
 */
const XSS_PATTERNS = {
  // Script injection patterns
  script_injection: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<script\s*>[\s\S]*?<\/script>/gi,
    /<script\s+[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
  ],

  // HTML injection patterns
  html_injection: [
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
  ],

  // Attribute injection patterns
  attribute_injection: [
    /on\w+\s*=/gi,
    /onclick\s*=/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onmouseover\s*=/gi,
    /onfocus\s*=/gi,
    /onblur\s*=/gi,
    /onchange\s*=/gi,
    /onsubmit\s*=/gi,
  ],

  // URL injection patterns
  url_injection: [
    /data:text\/html/gi,
    /data:text\/javascript/gi,
    /data:application\/javascript/gi,
    /data:image\/svg\+xml/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /livescript:/gi,
    /mocha:/gi,
  ],

  // CSS injection patterns
  css_injection: [
    /expression\s*\(/gi,
    /behavior\s*:/gi,
    /-moz-binding\s*:/gi,
    /javascript\s*:/gi,
    /@import/gi,
    /url\s*\(\s*['"]*javascript:/gi,
  ],
};

/**
 * Guardian XSS Protection Service
 */
class XSSProtectionService {
  private config: XSSProtectionConfig;
  private violations: Array<{
    timestamp: string;
    threat: XSSThreat;
    userAgent?: string;
    ip?: string;
  }> = [];

  constructor(config: Partial<XSSProtectionConfig> = {}) {
    this.config = { ...DEFAULT_XSS_CONFIG, ...config };
    this.configureDOMPurify();
  }

  /**
   * Comprehensive XSS detection and sanitization
   */
  async protectContent(
    content: string,
    context: {
      contentType?: 'html' | 'text' | 'url' | 'css' | 'json';
      userId?: string;
      userAgent?: string;
      ipAddress?: string;
    } = {}
  ): Promise<XSSDetectionResult> {
    const threats: XSSThreat[] = [];
    let riskScore = 0;

    try {
      // Step 1: Detect XSS threats
      const detectedThreats = this.detectXSSThreats(content);
      threats.push(...detectedThreats);

      // Step 2: Calculate risk score
      riskScore = this.calculateRiskScore(threats);

      // Step 3: Sanitize content
      let sanitizedContent = content;

      switch (context.contentType) {
        case 'html':
          sanitizedContent = this.sanitizeHTML(content);
          break;
        case 'url':
          sanitizedContent = this.sanitizeURL(content);
          break;
        case 'css':
          sanitizedContent = this.sanitizeCSS(content);
          break;
        case 'json':
          sanitizedContent = this.sanitizeJSON(content);
          break;
        default:
          sanitizedContent = this.sanitizeText(content);
      }

      // Step 4: Log violations if enabled
      if (this.config.logViolations && threats.length > 0) {
        threats.forEach(threat => {
          this.logXSSViolation(threat, context);
        });
      }

      return {
        isClean: threats.length === 0,
        threats,
        sanitizedContent,
        riskScore,
      };
    } catch (error) {
      securityLogger.error('XSS protection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentLength: content.length,
        contentType: context.contentType,
      });

      // Return safe fallback
      return {
        isClean: false,
        threats: [
          {
            type: 'script_injection',
            payload: 'Protection error',
            severity: 'critical',
            description: 'XSS protection system error',
            location: 'unknown',
          },
        ],
        sanitizedContent: '',
        riskScore: 1.0,
      };
    }
  }

  /**
   * Detect XSS threats in content
   */
  private detectXSSThreats(content: string): XSSThreat[] {
    const threats: XSSThreat[] = [];

    Object.entries(XSS_PATTERNS).forEach(([type, patterns]) => {
      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            threats.push({
              type: type as XSSThreat['type'],
              payload: match,
              severity: this.assessThreatSeverity(type, match),
              description: this.getThreatDescription(type, match),
              location: this.findThreatLocation(content, match),
            });
          });
        }
      });
    });

    return threats;
  }

  /**
   * Sanitize HTML content
   */
  private sanitizeHTML(html: string): string {
    try {
      return String(
        DOMPurify.sanitize(html, {
          ALLOWED_TAGS: this.config.allowedTags,
          ALLOWED_ATTR: Object.values(this.config.allowedAttributes).flat(),
          FORBID_TAGS: ['script', 'object', 'embed', 'applet', 'form', 'input', 'button'],
          FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus'],
          ALLOW_DATA_ATTR: false,
          ALLOW_UNKNOWN_PROTOCOLS: false,
          SANITIZE_DOM: true,
          KEEP_CONTENT: false,
        } as any)
      );
    } catch (error) {
      securityLogger.error('HTML sanitization failed', { error });
      return '';
    }
  }

  /**
   * Sanitize URL content
   */
  private sanitizeURL(url: string): string {
    try {
      // Block dangerous protocols
      const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'blob:', 'file:'];
      const lowerUrl = url.toLowerCase();

      if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
        return '';
      }

      // Only allow http, https, and relative URLs
      if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) {
        return url.replace(/[<>'"]/g, '');
      }

      return '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Sanitize CSS content
   */
  private sanitizeCSS(css: string): string {
    try {
      return css
        .replace(/expression\s*\([^)]*\)/gi, '')
        .replace(/behavior\s*:[^;]*/gi, '')
        .replace(/-moz-binding\s*:[^;]*/gi, '')
        .replace(/javascript\s*:[^;]*/gi, '')
        .replace(/@import[^;]*;/gi, '')
        .replace(/url\s*\(\s*['"]*javascript:[^)]*\)/gi, '');
    } catch (error) {
      return '';
    }
  }

  /**
   * Sanitize JSON content
   */
  private sanitizeJSON(json: string): string {
    try {
      const parsed = JSON.parse(json);
      const sanitized = this.deepSanitizeObject(parsed);
      return JSON.stringify(sanitized);
    } catch (error) {
      return '{}';
    }
  }

  /**
   * Sanitize plain text
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '');
  }

  /**
   * Deep sanitize object properties
   */
  private deepSanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitizeObject(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeText(key);
        sanitized[sanitizedKey] = this.deepSanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Configure DOMPurify with security settings
   */
  private configureDOMPurify(): void {
    DOMPurify.addHook('beforeSanitizeElements', node => {
      // Remove any script elements
      if (node.nodeName === 'SCRIPT') {
        (node as Element).remove();
      }
    });

    DOMPurify.addHook('beforeSanitizeAttributes', node => {
      // Remove event handlers
      if (node.hasAttributes()) {
        const attributes = Array.from(node.attributes);
        attributes.forEach(attr => {
          if (attr.name.startsWith('on')) {
            node.removeAttribute(attr.name);
          }
        });
      }
    });
  }

  /**
   * Calculate risk score based on detected threats
   */
  private calculateRiskScore(threats: XSSThreat[]): number {
    if (threats.length === 0) {
      return 0;
    }

    const severityWeights = {
      low: 0.1,
      medium: 0.3,
      high: 0.6,
      critical: 1.0,
    };

    const totalScore = threats.reduce((score, threat) => {
      return score + severityWeights[threat.severity];
    }, 0);

    return Math.min(totalScore / threats.length, 1.0);
  }

  /**
   * Assess threat severity
   */
  private assessThreatSeverity(type: string, payload: string): XSSThreat['severity'] {
    // Script injections are always critical
    if (type === 'script_injection') {
      return 'critical';
    }

    // Event handlers are high risk
    if (type === 'attribute_injection' && payload.match(/on\w+\s*=/gi)) {
      return 'high';
    }

    // JavaScript/VBScript URLs are high risk
    if (type === 'url_injection' && payload.match(/(javascript|vbscript):/gi)) {
      return 'high';
    }

    // CSS expression injections are medium-high risk
    if (type === 'css_injection' && payload.match(/expression\s*\(/gi)) {
      return 'high';
    }

    // Default to medium for other patterns
    return 'medium';
  }

  /**
   * Get threat description
   */
  private getThreatDescription(type: string, payload: string): string {
    const descriptions = {
      script_injection: 'Script tag or JavaScript code injection detected',
      html_injection: 'Potentially dangerous HTML element detected',
      attribute_injection: 'Event handler or dangerous attribute detected',
      url_injection: 'Dangerous URL protocol detected',
      css_injection: 'CSS injection or expression detected',
    };

    return descriptions[type as keyof typeof descriptions] || 'Unknown XSS threat detected';
  }

  /**
   * Find threat location in content
   */
  private findThreatLocation(content: string, threat: string): string {
    const index = content.indexOf(threat);
    if (index === -1) {
      return 'unknown';
    }

    const lineNumber = content.substring(0, index).split('\n').length;
    const columnNumber = index - content.lastIndexOf('\n', index - 1);

    return `line ${lineNumber}, column ${columnNumber}`;
  }

  /**
   * Log XSS violation
   */
  private logXSSViolation(
    threat: XSSThreat,
    context: {
      userId?: string;
      userAgent?: string;
      ipAddress?: string;
    }
  ): void {
    const violation = {
      timestamp: new Date().toISOString(),
      threat,
      userAgent: context.userAgent,
      ip: context.ipAddress,
    };

    this.violations.push(violation);

    securityLogger.logSecurityEvent('XSS_ATTEMPT' as any, 'XSS attack attempt detected', {
      userId: context.userId,
      metadata: {
        threatType: threat.type,
        severity: threat.severity,
        payload: threat.payload.substring(0, 100),
        location: threat.location,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
      },
    });

    // Keep only last 1000 violations
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-1000);
    }
  }

  /**
   * Get XSS violation statistics
   */
  getViolationStats(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): {
    totalViolations: number;
    violationsByType: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    topPayloads: Array<{ payload: string; count: number }>;
    trends: Array<{ date: string; count: number }>;
  } {
    const now = new Date();
    const timeframeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const cutoff = new Date(now.getTime() - timeframeMs);
    const recentViolations = this.violations.filter(v => new Date(v.timestamp) >= cutoff);

    const violationsByType = recentViolations.reduce(
      (acc, v) => {
        acc[v.threat.type] = (acc[v.threat.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const violationsBySeverity = recentViolations.reduce(
      (acc, v) => {
        acc[v.threat.severity] = (acc[v.threat.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const payloadCounts = recentViolations.reduce(
      (acc, v) => {
        const payload = v.threat.payload.substring(0, 50);
        acc[payload] = (acc[payload] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topPayloads = Object.entries(payloadCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([payload, count]) => ({ payload, count }));

    return {
      totalViolations: recentViolations.length,
      violationsByType,
      violationsBySeverity,
      topPayloads,
      trends: [], // Would implement trend calculation
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<XSSProtectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.configureDOMPurify();
  }
}

// Export singleton instance
export const xssProtection = new XSSProtectionService();

// Export convenience functions
export const protectFromXSS = (
  content: string,
  context?: {
    contentType?: 'html' | 'text' | 'url' | 'css' | 'json';
    userId?: string;
    userAgent?: string;
    ipAddress?: string;
  }
) => xssProtection.protectContent(content, context);

export const sanitizeHTML = (html: string) =>
  xssProtection.protectContent(html, { contentType: 'html' });

export const sanitizeURL = (url: string) =>
  xssProtection.protectContent(url, { contentType: 'url' });

export const sanitizeCSS = (css: string) =>
  xssProtection.protectContent(css, { contentType: 'css' });

export const getXSSStats = (timeframe?: '1h' | '24h' | '7d' | '30d') =>
  xssProtection.getViolationStats(timeframe);

export default xssProtection;
