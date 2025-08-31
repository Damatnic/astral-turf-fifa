/**
 * Content Security Policy (CSP) and Security Headers Module
 *
 * Provides comprehensive Content Security Policy configuration and security headers
 * to prevent XSS, clickjacking, MIME sniffing, and other client-side attacks.
 */

import { CSP_CONFIG, SECURITY_HEADERS, ENVIRONMENT_CONFIG } from './config';
import { securityLogger } from './logging';

// CSP directive types
export enum CSPDirective {
  DEFAULT_SRC = 'default-src',
  SCRIPT_SRC = 'script-src',
  STYLE_SRC = 'style-src',
  IMG_SRC = 'img-src',
  FONT_SRC = 'font-src',
  CONNECT_SRC = 'connect-src',
  MEDIA_SRC = 'media-src',
  OBJECT_SRC = 'object-src',
  FRAME_SRC = 'frame-src',
  CHILD_SRC = 'child-src',
  WORKER_SRC = 'worker-src',
  BASE_URI = 'base-uri',
  FORM_ACTION = 'form-action',
  FRAME_ANCESTORS = 'frame-ancestors',
  REPORT_URI = 'report-uri',
  REPORT_TO = 'report-to',
}

// CSP violation report structure
export interface CSPViolationReport {
  'csp-report': {
    'blocked-uri': string;
    'document-uri': string;
    'original-policy': string;
    'referrer': string;
    'status-code': number;
    'violated-directive': string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
  };
}

// Security header configuration
export interface SecurityHeaderConfig {
  name: string;
  value: string;
  description: string;
  critical: boolean;
}

/**
 * Content Security Policy Functions
 */

// Generate CSP header value from configuration
export function generateCSPHeader(): string {
  try {
    const directives: string[] = [];

    // Add each directive with its sources
    const addDirective = (directive: string, sources: string[]) => {
      if (sources.length > 0) {
        directives.push(`${directive} ${sources.join(' ')}`);
      }
    };

    addDirective(CSPDirective.DEFAULT_SRC, CSP_CONFIG.DEFAULT_SRC);
    addDirective(CSPDirective.SCRIPT_SRC, CSP_CONFIG.SCRIPT_SRC);
    addDirective(CSPDirective.STYLE_SRC, CSP_CONFIG.STYLE_SRC);
    addDirective(CSPDirective.FONT_SRC, CSP_CONFIG.FONT_SRC);
    addDirective(CSPDirective.IMG_SRC, CSP_CONFIG.IMG_SRC);
    addDirective(CSPDirective.CONNECT_SRC, CSP_CONFIG.CONNECT_SRC);
    addDirective(CSPDirective.FRAME_SRC, CSP_CONFIG.FRAME_SRC);
    addDirective(CSPDirective.OBJECT_SRC, CSP_CONFIG.OBJECT_SRC);
    addDirective(CSPDirective.BASE_URI, CSP_CONFIG.BASE_URI);
    addDirective(CSPDirective.FORM_ACTION, CSP_CONFIG.FORM_ACTION);
    addDirective(CSPDirective.FRAME_ANCESTORS, CSP_CONFIG.FRAME_ANCESTORS);

    // Add upgrade-insecure-requests if enabled
    if (CSP_CONFIG.UPGRADE_INSECURE_REQUESTS && !ENVIRONMENT_CONFIG.isDevelopment) {
      directives.push('upgrade-insecure-requests');
    }

    // Add report URI in production
    if (!ENVIRONMENT_CONFIG.isDevelopment) {
      directives.push('report-uri /api/csp-violations');
    }

    const cspHeader = directives.join('; ');

    securityLogger.info('CSP header generated', {
      directiveCount: directives.length,
      headerLength: cspHeader.length,
    });

    return cspHeader;
  } catch (error) {
    securityLogger.error('Failed to generate CSP header', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Fallback to basic CSP
    return "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
  }
}

// Generate development-friendly CSP (more permissive)
export function generateDevelopmentCSP(): string {
  const devDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* 127.0.0.1:*",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: localhost:* 127.0.0.1:*",
    "connect-src 'self' ws: wss: localhost:* 127.0.0.1:* https://api.gemini.google.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return devDirectives.join('; ');
}

// Validate CSP directive format
export function validateCSPDirective(directive: string, sources: string[]): boolean {
  // Check if directive is valid
  const validDirectives = Object.values(CSPDirective);
  if (!validDirectives.includes(directive as CSPDirective)) {
    return false;
  }

  // Check if sources are valid
  const validSourceKeywords = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "'strict-dynamic'",
    "'none'",
    "'unsafe-hashes'",
    "'report-sample'",
  ];

  return sources.every(source => {
    // Allow valid keywords
    if (validSourceKeywords.includes(source)) {return true;}

    // Allow data: and blob: schemes
    if (source.startsWith('data:') || source.startsWith('blob:')) {return true;}

    // Allow valid URLs and wildcards
    try {
      if (source === '*') {return true;}
      if (source.startsWith('*.')) {return true;}
      if (source.startsWith('https://') || source.startsWith('http://')) {
        new URL(source);
        return true;
      }
      if (source.includes(':')) {
        // Could be a scheme or port
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });
}

/**
 * Security Headers Functions
 */

// Get all security headers
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  // Add CSP header
  headers['Content-Security-Policy'] = ENVIRONMENT_CONFIG.isDevelopment
    ? generateDevelopmentCSP()
    : generateCSPHeader();

  // Add other security headers
  Object.entries(SECURITY_HEADERS).forEach(([name, value]) => {
    if (name === 'X-Powered-By') {
      // Remove this header instead of setting it
      return;
    }

    if (name === 'Strict-Transport-Security' && ENVIRONMENT_CONFIG.isDevelopment) {
      // Skip HSTS in development
      return;
    }

    headers[name] = value;
  });

  return headers;
}

// Validate security header value
export function validateSecurityHeader(name: string, value: string): boolean {
  if (!name || !value) {return false;}

  // Check for header injection attempts
  if (name.includes('\n') || name.includes('\r') || value.includes('\n') || value.includes('\r')) {
    securityLogger.warn('Header injection attempt detected', { name, value });
    return false;
  }

  // Specific validations for certain headers
  switch (name.toLowerCase()) {
    case 'strict-transport-security':
      return /^max-age=\d+/.test(value);
    case 'x-frame-options':
      return ['DENY', 'SAMEORIGIN'].includes(value.toUpperCase()) ||
             value.toLowerCase().startsWith('allow-from ');
    case 'x-content-type-options':
      return value.toLowerCase() === 'nosniff';
    case 'x-xss-protection':
      return /^[01](; mode=block)?$/.test(value);
    default:
      return true;
  }
}

/**
 * CSP Violation Handling
 */

// Process CSP violation report
export function processCSpViolation(report: CSPViolationReport): void {
  const violation = report['csp-report'];

  securityLogger.logSecurityEvent(
    'XSS_ATTEMPT' as any,
    'CSP violation detected',
    {
      metadata: {
        blockedUri: violation['blocked-uri'],
        documentUri: violation['document-uri'],
        violatedDirective: violation['violated-directive'],
        sourceFile: violation['source-file'],
        lineNumber: violation['line-number'],
        columnNumber: violation['column-number'],
      },
    },
  );

  // Track violation patterns
  trackViolationPattern(violation);
}

// Track violation patterns for analysis
function trackViolationPattern(violation: CSPViolationReport['csp-report']): void {
  const pattern = {
    directive: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
    timestamp: new Date().toISOString(),
  };

  // In production, this would be sent to monitoring service
  if (ENVIRONMENT_CONFIG.isDevelopment) {
    console.warn('CSP Violation Pattern:', pattern);
  }
}

/**
 * Meta Tag Generation for CSP
 */

// Generate meta tag for CSP (for HTML documents)
export function generateCSPMetaTag(): string {
  const cspHeader = ENVIRONMENT_CONFIG.isDevelopment
    ? generateDevelopmentCSP()
    : generateCSPHeader();

  return `<meta http-equiv="Content-Security-Policy" content="${cspHeader.replace(/"/g, '&quot;')}">`;
}

// Generate all security meta tags
export function generateSecurityMetaTags(): string[] {
  const metaTags: string[] = [];

  // CSP meta tag
  if (ENVIRONMENT_CONFIG.ENABLE_CSP) {
    metaTags.push(generateCSPMetaTag());
  }

  // Other security meta tags
  metaTags.push('<meta http-equiv="X-Content-Type-Options" content="nosniff">');
  metaTags.push('<meta http-equiv="X-Frame-Options" content="DENY">');
  metaTags.push('<meta http-equiv="X-XSS-Protection" content="1; mode=block">');

  // Referrer policy
  metaTags.push('<meta name="referrer" content="strict-origin-when-cross-origin">');

  return metaTags;
}

/**
 * Runtime CSP Management
 */

// Apply CSP headers to response (for server-side use)
export function applySecurityHeaders(headers: Headers): void {
  const securityHeaders = getSecurityHeaders();

  Object.entries(securityHeaders).forEach(([name, value]) => {
    if (validateSecurityHeader(name, value)) {
      headers.set(name, value);
    } else {
      securityLogger.warn('Invalid security header skipped', { name, value });
    }
  });
}

// Inject CSP into HTML document
export function injectCSPIntoHTML(html: string): string {
  const metaTags = generateSecurityMetaTags();
  const metaTagsString = metaTags.join('\n  ');

  // Insert meta tags after <head> tag
  return html.replace(
    /<head(\s[^>]*)?>/i,
    (match) => `${match}\n  ${metaTagsString}`,
  );
}

/**
 * CSP Nonce Generation (for inline scripts/styles)
 */

// Generate cryptographic nonce for CSP
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// Add nonce to CSP directive
export function addNonceToCSP(csp: string, nonce: string): string {
  return csp.replace(
    /(script-src[^;]+)/,
    `$1 'nonce-${nonce}'`,
  ).replace(
    /(style-src[^;]+)/,
    `$1 'nonce-${nonce}'`,
  );
}

/**
 * Export utilities and configurations
 */

export const cspUtils = {
  generateCSPHeader,
  generateDevelopmentCSP,
  validateCSPDirective,
  getSecurityHeaders,
  validateSecurityHeader,
  processCSpViolation,
  generateCSPMetaTag,
  generateSecurityMetaTags,
  applySecurityHeaders,
  injectCSPIntoHTML,
  generateCSPNonce,
  addNonceToCSP,
};

// Initialize CSP monitoring
export function initializeCSPMonitoring(): void {
  securityLogger.info('CSP monitoring initialized', {
    environment: ENVIRONMENT_CONFIG.isDevelopment ? 'development' : 'production',
    cspEnabled: ENVIRONMENT_CONFIG.ENABLE_CSP,
    directiveCount: Object.keys(CSPDirective).length,
  });
}