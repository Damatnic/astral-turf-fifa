/**
 * Security Provider Component
 *
 * Provides comprehensive security context and monitoring for the entire application,
 * including CSP injection, security headers, and real-time threat monitoring.
 */

import React, { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { securityLogger, SecurityEventType } from '../../security/logging';
import {
  initializeSecurityMonitoring,
  monitorSecurityEvent,
  getActiveSecurityIncidents,
} from '../../security/monitoring';
import type { SecurityIncident } from '../../security/monitoring';
import { initializeCSPMonitoring, cspUtils } from '../../security/csp';
import { ENVIRONMENT_CONFIG } from '../../security/config';
import { sanitizeUserInput } from '../../security/sanitization';

interface SecurityContextType {
  reportSecurityEvent: (eventType: SecurityEventType, details: unknown) => void;
  getSecurityStatus: () => SecurityStatus;
  handleSecurityViolation: (violation: SecurityViolation) => void;
  isSecurityEnabled: boolean;
}

interface SecurityStatus {
  activeThreats: number;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  lastSecurityCheck: string;
  incidents: SecurityIncident[];
}

interface SecurityViolation {
  type: 'csp' | 'input' | 'access' | 'rate_limit';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

interface SecurityProviderProps {
  children: ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  useEffect(() => {
    initializeSecuritySystems();
    setupSecurityMonitoring();
    injectSecurityHeaders();
    setupGlobalErrorHandling();
    setupCSPViolationHandling();

    return () => {
      cleanupSecuritySystems();
    };
  }, []);

  const initializeSecuritySystems = useCallback(() => {
    try {
      // Initialize security monitoring
      initializeSecurityMonitoring();
      initializeCSPMonitoring();

      securityLogger.info('Security systems initialized', {
        features: ['monitoring', 'csp', 'error_handling', 'violation_detection'],
        environment: ENVIRONMENT_CONFIG.isDevelopment ? 'development' : 'production',
      });
    } catch (_error) {
      securityLogger.error('Failed to initialize security systems', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  const setupSecurityMonitoring = useCallback(() => {
    // Monitor performance for potential DoS attacks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            // Monitor for unusually slow operations
            if (entry.duration > 5000) {
              // 5 seconds
              monitorSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
                type: 'performance_anomaly',
                duration: entry.duration,
                name: entry.name,
                entryType: entry.entryType,
              });
            }
          });
        });

        observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      } catch (_error) {
        securityLogger.warn('Performance monitoring setup failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Monitor for suspicious URL changes
    const originalPushState = history.pushState;
    history.pushState = function (state, title, url) {
      if (url && typeof url === 'string') {
        const sanitizedUrl = sanitizeUserInput(url);
        if (sanitizedUrl !== url) {
          monitorSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
            type: 'url_manipulation',
            originalUrl: url.substring(0, 100), // Truncate for security
            sanitizedUrl: sanitizedUrl.substring(0, 100),
          });
        }
      }
      return originalPushState.call(this, state, title, url);
    };
  }, []);

  const injectSecurityHeaders = useCallback(() => {
    // Skip injecting meta tags - CSP is handled via HTTP headers in vercel.json
    // // // // console.log('Security headers handled via HTTP headers, skipping meta tag injection');
    return;

    // // Inject security meta tags if not already present
    // const metaTags = cspUtils.generateSecurityMetaTags();

    // metaTags.forEach((metaTag) => {
    //   const tempDiv = document.createElement('div');
    //   tempDiv.innerHTML = metaTag;
    //   const metaElement = tempDiv.firstChild as HTMLMetaElement;

    //   if (metaElement) {
    //     const existingMeta = document.querySelector(
    //       `meta[http-equiv="${metaElement.getAttribute('http-equiv')}"], meta[name="${metaElement.getAttribute('name')}"]`,
    //     );

    //     if (!existingMeta) {
    //       document.head.appendChild(metaElement);
    //     }
    //   }
    // });
  }, []);

  const setupGlobalErrorHandling = useCallback(() => {
    // Global unhandled error handler
    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);

      securityLogger.logSecurityEvent(SecurityEventType.SYSTEM_ERROR, 'Unhandled global error', {
        metadata: {
          message: sanitizeUserInput(error.message || ''),
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: ENVIRONMENT_CONFIG.isDevelopment ? error.stack : '[REDACTED]',
        },
      });
    };

    // Global unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

      securityLogger.logSecurityEvent(
        SecurityEventType.SYSTEM_ERROR,
        'Unhandled promise rejection',
        {
          metadata: {
            reason: sanitizeUserInput(reason.message || ''),
            stack: ENVIRONMENT_CONFIG.isDevelopment ? reason.stack : '[REDACTED]',
          },
        },
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Return cleanup function
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const setupCSPViolationHandling = useCallback(() => {
    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', event => {
      const violation = {
        'csp-report': {
          'blocked-uri': event.blockedURI,
          'document-uri': event.documentURI,
          'original-policy': event.originalPolicy,
          referrer: event.referrer,
          'status-code': 0,
          'violated-directive': event.violatedDirective,
          'line-number': event.lineNumber,
          'column-number': event.columnNumber,
          'source-file': event.sourceFile,
        },
      };

      cspUtils.processCSpViolation(violation);

      // Also report through security monitoring
      monitorSecurityEvent(SecurityEventType.SECURITY_POLICY_VIOLATION, {
        type: 'csp_violation',
        blockedUri: event.blockedURI,
        violatedDirective: event.violatedDirective,
        sourceFile: event.sourceFile,
      });
    });
  }, []);

  const cleanupSecuritySystems = useCallback(() => {
    securityLogger.info('Security systems cleanup initiated');
    // Cleanup will be handled by individual system destructors
  }, []);

  const reportSecurityEvent = useCallback((eventType: SecurityEventType, details: unknown) => {
    try {
      monitorSecurityEvent(eventType, {
        ...details,
        reportedBy: 'user_action',
        timestamp: new Date().toISOString(),
      });
    } catch (_error) {
      securityLogger.error('Failed to report security event', {
        eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  const getSecurityStatus = useCallback((): SecurityStatus => {
    const incidents = getActiveSecurityIncidents();
    const activeThreats = incidents.filter(i => i.riskScore > 70).length;

    let securityLevel: SecurityStatus['securityLevel'] = 'low';
    if (activeThreats > 5) {
      securityLevel = 'critical';
    } else if (activeThreats > 2) {
      securityLevel = 'high';
    } else if (activeThreats > 0) {
      securityLevel = 'medium';
    }

    return {
      activeThreats,
      securityLevel,
      lastSecurityCheck: new Date().toISOString(),
      incidents: incidents.slice(0, 10), // Return latest 10 incidents
    };
  }, []);

  const handleSecurityViolation = useCallback(
    (violation: SecurityViolation) => {
      const eventTypeMap = {
        csp: SecurityEventType.SECURITY_POLICY_VIOLATION,
        input: SecurityEventType.MALICIOUS_INPUT,
        access: SecurityEventType.UNAUTHORIZED_ACCESS,
        rate_limit: SecurityEventType.RATE_LIMIT_EXCEEDED,
      };

      const eventType = eventTypeMap[violation.type] || SecurityEventType.SUSPICIOUS_ACTIVITY;

      reportSecurityEvent(eventType, {
        violationType: violation.type,
        description: violation.description,
        severity: violation.severity,
        metadata: violation.metadata,
      });
    },
    [reportSecurityEvent],
  );

  const contextValue: SecurityContextType = {
    reportSecurityEvent,
    getSecurityStatus,
    handleSecurityViolation,
    isSecurityEnabled: true,
  };

  return <SecurityContext.Provider value={contextValue}>{children}</SecurityContext.Provider>;
}

export function useSecurityContext(): SecurityContextType {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
}

// Hook for reporting security events
export function useSecurityReporting() {
  const { reportSecurityEvent } = useSecurityContext();

  const reportSuspiciousActivity = useCallback(
    (description: string, metadata?: unknown) => {
      reportSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
        description,
        metadata,
        source: 'component',
      });
    },
    [reportSecurityEvent],
  );

  const reportUnauthorizedAccess = useCallback(
    (resource: string, metadata?: unknown) => {
      reportSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        resource,
        metadata,
        source: 'component',
      });
    },
    [reportSecurityEvent],
  );

  const reportInputThreat = useCallback(
    (input: string, threatType: string, metadata?: unknown) => {
      reportSecurityEvent(SecurityEventType.MALICIOUS_INPUT, {
        input: input.substring(0, 200), // Truncate for security
        threatType,
        metadata,
        source: 'component',
      });
    },
    [reportSecurityEvent],
  );

  return {
    reportSuspiciousActivity,
    reportUnauthorizedAccess,
    reportInputThreat,
  };
}

// Hook for checking security status
export function useSecurityStatus() {
  const { getSecurityStatus } = useSecurityContext();
  const [status, setStatus] = React.useState<SecurityStatus | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(getSecurityStatus());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [getSecurityStatus]);

  return status;
}

export default SecurityProvider;
