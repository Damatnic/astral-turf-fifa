/**
 * Guardian Content Security Policy Configuration
 *
 * Military-grade CSP implementation for tactical board security
 * Protects against XSS, injection attacks, and unauthorized resource loading
 */

export interface CSPDirective {
  directive: string;
  sources: string[];
  description: string;
}

export interface CSPConfig {
  directives: CSPDirective[];
  reportUri?: string;
  reportOnly?: boolean;
  upgradeInsecureRequests?: boolean;
}

/**
 * Guardian CSP Configuration for Tactical Board
 */
export const GUARDIAN_CSP_CONFIG: CSPConfig = {
  reportOnly: false,
  upgradeInsecureRequests: true,
  reportUri: '/api/security/csp-report',

  directives: [
    {
      directive: 'default-src',
      sources: ["'self'"],
      description: 'Default policy for loading content',
    },

    {
      directive: 'script-src',
      sources: [
        "'self'",
        "'unsafe-inline'", // Required for React development
        "'unsafe-eval'", // Required for development tools
        'https://vercel.live',
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com',
      ],
      description: 'Script execution policy',
    },

    {
      directive: 'style-src',
      sources: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and CSS-in-JS
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
      ],
      description: 'Stylesheet loading policy',
    },

    {
      directive: 'img-src',
      sources: [
        "'self'",
        'data:', // Allow data URLs for SVG and canvas images
        'blob:', // Allow blob URLs for generated images
        'https:',
        'https://images.unsplash.com',
        'https://via.placeholder.com',
      ],
      description: 'Image loading policy',
    },

    {
      directive: 'font-src',
      sources: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
      description: 'Font loading policy',
    },

    {
      directive: 'connect-src',
      sources: [
        "'self'",
        'https://api.openai.com',
        'https://vercel.live',
        'wss://vercel.live',
        'https://vitals.vercel-analytics.com',
        'https://region1.google-analytics.com',
      ],
      description: 'Network connection policy',
    },

    {
      directive: 'media-src',
      sources: ["'self'", 'data:', 'blob:'],
      description: 'Media content loading policy',
    },

    {
      directive: 'object-src',
      sources: ["'none'"],
      description: 'Object/embed/applet loading policy',
    },

    {
      directive: 'base-uri',
      sources: ["'self'"],
      description: 'Base URL restriction',
    },

    {
      directive: 'form-action',
      sources: ["'self'", 'https://vercel.com'],
      description: 'Form submission policy',
    },

    {
      directive: 'frame-ancestors',
      sources: ["'none'"],
      description: 'Frame embedding policy',
    },

    {
      directive: 'frame-src',
      sources: ["'self'", 'https://vercel.live'],
      description: 'Frame loading policy',
    },

    {
      directive: 'worker-src',
      sources: ["'self'", 'blob:'],
      description: 'Web worker loading policy',
    },

    {
      directive: 'manifest-src',
      sources: ["'self'"],
      description: 'Web app manifest policy',
    },
  ],
};

/**
 * Production CSP Configuration (Stricter)
 */
export const PRODUCTION_CSP_CONFIG: CSPConfig = {
  reportOnly: false,
  upgradeInsecureRequests: true,
  reportUri: '/api/security/csp-report',

  directives: [
    {
      directive: 'default-src',
      sources: ["'self'"],
      description: 'Default policy for loading content',
    },

    {
      directive: 'script-src',
      sources: [
        "'self'",
        "'sha256-{SCRIPT_HASH}'", // Replace with actual script hashes
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com',
      ],
      description: 'Script execution policy (strict)',
    },

    {
      directive: 'style-src',
      sources: [
        "'self'",
        "'sha256-{STYLE_HASH}'", // Replace with actual style hashes
        'https://fonts.googleapis.com',
      ],
      description: 'Stylesheet loading policy (strict)',
    },

    {
      directive: 'img-src',
      sources: ["'self'", 'data:', 'https:'],
      description: 'Image loading policy',
    },

    {
      directive: 'font-src',
      sources: ["'self'", 'https://fonts.gstatic.com'],
      description: 'Font loading policy',
    },

    {
      directive: 'connect-src',
      sources: ["'self'", 'https://api.openai.com', 'https://vitals.vercel-analytics.com'],
      description: 'Network connection policy',
    },

    {
      directive: 'media-src',
      sources: ["'self'"],
      description: 'Media content loading policy',
    },

    {
      directive: 'object-src',
      sources: ["'none'"],
      description: 'Object/embed/applet loading policy',
    },

    {
      directive: 'base-uri',
      sources: ["'self'"],
      description: 'Base URL restriction',
    },

    {
      directive: 'form-action',
      sources: ["'self'"],
      description: 'Form submission policy',
    },

    {
      directive: 'frame-ancestors',
      sources: ["'none'"],
      description: 'Frame embedding policy',
    },

    {
      directive: 'frame-src',
      sources: ["'none'"],
      description: 'Frame loading policy',
    },

    {
      directive: 'worker-src',
      sources: ["'self'", 'blob:'],
      description: 'Web worker loading policy',
    },
  ],
};

/**
 * Generate CSP header string from configuration
 */
export function generateCSPHeader(config: CSPConfig): string {
  const directives = config.directives.map(directive => {
    return `${directive.directive} ${directive.sources.join(' ')}`;
  });

  let cspHeader = directives.join('; ');

  if (config.upgradeInsecureRequests) {
    cspHeader += '; upgrade-insecure-requests';
  }

  if (config.reportUri) {
    cspHeader += `; report-uri ${config.reportUri}`;
  }

  return cspHeader;
}

/**
 * CSP Violation Reporter
 */
export interface CSPViolationReport {
  'document-uri': string;
  referrer: string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  disposition: string;
  'blocked-uri': string;
  'line-number': number;
  'source-file': string;
  'status-code': number;
}

export function handleCSPViolation(report: CSPViolationReport): void {
  console.error('CSP Violation:', {
    violatedDirective: report['violated-directive'],
    blockedUri: report['blocked-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number'],
    documentUri: report['document-uri'],
  });

  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/security/csp-violation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    }).catch(error => {
      console.error('Failed to report CSP violation:', error);
    });
  }
}

/**
 * Guardian Security Headers Configuration
 */
export interface SecurityHeaders {
  [key: string]: string;
}

export const GUARDIAN_SECURITY_HEADERS: SecurityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': generateCSPHeader(
    process.env.NODE_ENV === 'production' ? PRODUCTION_CSP_CONFIG : GUARDIAN_CSP_CONFIG
  ),

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS filtering
  'X-XSS-Protection': '1; mode=block',

  // Prevent page from being displayed in frames
  'X-Frame-Options': 'DENY',

  // Prevent DNS prefetching
  'X-DNS-Prefetch-Control': 'off',

  // Remove server information
  'X-Powered-By': '',

  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Feature Policy / Permissions Policy
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'speaker=(self)',
    'fullscreen=(self)',
  ].join(', '),

  // Cache Control for sensitive pages
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',

  // Pragma for HTTP/1.0 compatibility
  Pragma: 'no-cache',

  // Expires header
  Expires: '0',
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(headers: Headers): void {
  Object.entries(GUARDIAN_SECURITY_HEADERS).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value);
    } else {
      headers.delete(key);
    }
  });
}

/**
 * Validate CSP configuration
 */
export function validateCSPConfig(config: CSPConfig): boolean {
  // Check for required directives
  const requiredDirectives = ['default-src', 'script-src', 'style-src', 'object-src'];
  const configDirectives = config.directives.map(d => d.directive);

  for (const required of requiredDirectives) {
    if (!configDirectives.includes(required)) {
      console.error(`Missing required CSP directive: ${required}`);
      return false;
    }
  }

  // Check for dangerous configurations
  const scriptSrcDirective = config.directives.find(d => d.directive === 'script-src');
  if (
    scriptSrcDirective?.sources.includes("'unsafe-eval'") &&
    process.env.NODE_ENV === 'production'
  ) {
    console.warn('WARNING: unsafe-eval is enabled in production CSP');
  }

  return true;
}

/**
 * CSP Nonce Generator
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}

/**
 * Add nonce to CSP configuration
 */
export function addNonceToCSP(config: CSPConfig, nonce: string): CSPConfig {
  const newConfig = JSON.parse(JSON.stringify(config)) as CSPConfig;

  // Add nonce to script-src and style-src
  const scriptSrc = newConfig.directives.find(d => d.directive === 'script-src');
  if (scriptSrc) {
    scriptSrc.sources.push(`'nonce-${nonce}'`);
  }

  const styleSrc = newConfig.directives.find(d => d.directive === 'style-src');
  if (styleSrc) {
    styleSrc.sources.push(`'nonce-${nonce}'`);
  }

  return newConfig;
}

export default {
  GUARDIAN_CSP_CONFIG,
  PRODUCTION_CSP_CONFIG,
  GUARDIAN_SECURITY_HEADERS,
  generateCSPHeader,
  handleCSPViolation,
  applySecurityHeaders,
  validateCSPConfig,
  generateCSPNonce,
  addNonceToCSP,
};
