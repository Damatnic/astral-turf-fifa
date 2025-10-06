/**
 * Security-Focused Error Boundary Component
 *
 * Catches and handles errors with security considerations, preventing
 * sensitive information leakage while maintaining audit trails.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { securityLogger, SecurityEventType } from '../../security/logging';
import { sanitizeUserInput } from '../../security/sanitization';
import { ENVIRONMENT_CONFIG } from '../../security/config';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  errorId: string | null;
  isSecurityRelated: boolean;
}

// Security-sensitive error patterns
const SECURITY_ERROR_PATTERNS = [
  /unauthorized/i,
  /forbidden/i,
  /token/i,
  /authentication/i,
  /permission/i,
  /access.*denied/i,
  /session.*expired/i,
  /csrf/i,
  /xss/i,
  /injection/i,
];

// Sensitive information patterns to redact
const SENSITIVE_PATTERNS = [
  /password[=:]\s*[^&\s]+/gi,
  /token[=:]\s*[^&\s]+/gi,
  /key[=:]\s*[^&\s]+/gi,
  /secret[=:]\s*[^&\s]+/gi,
  /api[_-]?key[=:]\s*[^&\s]+/gi,
  /bearer\s+[^&\s]+/gi,
  /authorization[=:]\s*[^&\s]+/gi,
];

export class SecurityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      errorId: null,
      isSecurityRelated: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const isSecurityRelated = SECURITY_ERROR_PATTERNS.some(
      pattern => pattern.test(error.message) || pattern.test(error.name)
    );

    return {
      hasError: true,
      errorId,
      isSecurityRelated,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    try {
      // Sanitize error information to prevent information leakage
      const sanitizedError = this.sanitizeError(error);
      const sanitizedErrorInfo = this.sanitizeErrorInfo(errorInfo);

      // Determine security event type
      const eventType = this.state.isSecurityRelated
        ? SecurityEventType.SECURITY_POLICY_VIOLATION
        : SecurityEventType.SYSTEM_ERROR;

      // Log the error with security considerations
      securityLogger.logSecurityEvent(
        eventType,
        `Application error caught by security boundary: ${sanitizedError.message}`,
        {
          metadata: {
            errorId: this.state.errorId,
            errorName: sanitizedError.name,
            errorMessage: sanitizedError.message,
            componentStack: sanitizedErrorInfo.componentStack,
            isSecurityRelated: this.state.isSecurityRelated,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            // Include stack trace only in development
            ...(ENVIRONMENT_CONFIG.isDevelopment && {
              stackTrace: sanitizedError.stack,
            }),
          },
        }
      );

      // Call custom error handler if provided
      if (this.props.onError) {
        this.props.onError(sanitizedError, sanitizedErrorInfo);
      }

      // Track error patterns for security analysis
      this.trackErrorPattern(sanitizedError);
    } catch (loggingError) {
      // Fallback error logging to console if security logger fails
      console.error('Security error boundary logging failed:', loggingError);
      console.error('Original error:', error);
    }
  }

  private sanitizeError(error: Error): Error {
    const sanitizedMessage = this.sanitizeSensitiveInfo(error.message);
    const sanitizedStack = error.stack ? this.sanitizeSensitiveInfo(error.stack) : undefined;

    return {
      name: error.name,
      message: sanitizedMessage,
      stack: sanitizedStack,
    } as Error;
  }

  private sanitizeErrorInfo(errorInfo: ErrorInfo): ErrorInfo {
    return {
      componentStack: this.sanitizeSensitiveInfo(errorInfo.componentStack || ''),
    };
  }

  private sanitizeSensitiveInfo(text: string): string {
    let sanitized = text;

    // Remove sensitive information using patterns
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    // Remove potential file paths in production
    if (!ENVIRONMENT_CONFIG.isDevelopment) {
      sanitized = sanitized.replace(/(?:file:\/\/|[A-Z]:\\|\/[^:\s]+)/g, '[PATH_REDACTED]');
    }

    return sanitizeUserInput(sanitized);
  }

  private trackErrorPattern(error: Error): void {
    // Track common error patterns for security analysis
    const patterns = [
      { pattern: /network.*error/i, category: 'network' },
      { pattern: /unauthorized/i, category: 'auth' },
      { pattern: /forbidden/i, category: 'auth' },
      { pattern: /timeout/i, category: 'performance' },
      { pattern: /memory/i, category: 'resource' },
      { pattern: /script.*error/i, category: 'xss' },
    ];

    patterns.forEach(({ pattern, category }) => {
      if (pattern.test(error.message)) {
        securityLogger.info(`Error pattern detected: ${category}`, {
          errorId: this.state.errorId,
          pattern: pattern.source,
          category,
        });
      }
    });
  }

  private handleRetry = (): void => {
    // Log retry attempt
    securityLogger.info('User initiated error recovery', {
      errorId: this.state.errorId,
      isSecurityRelated: this.state.isSecurityRelated,
    });

    // Reset error state
    this.setState({
      hasError: false,
      errorId: null,
      isSecurityRelated: false,
    });
  };

  private handleReportError = (): void => {
    // Log error report
    securityLogger.info('User reported error', {
      errorId: this.state.errorId,
      userAction: 'report_error',
    });

    // In production, this could open a support ticket or feedback form
    if (ENVIRONMENT_CONFIG.isDevelopment) {
      alert(`Error ID: ${this.state.errorId} - This has been logged for investigation.`);
    }
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default security-focused error UI
      return (
        <div className="security-error-boundary">
          <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {this.state.isSecurityRelated ? 'Security Error' : 'Application Error'}
                  </h3>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {this.state.isSecurityRelated
                    ? 'A security-related error has occurred. For your protection, some features may be temporarily unavailable.'
                    : 'An unexpected error has occurred. We apologize for the inconvenience.'}
                </p>

                {ENVIRONMENT_CONFIG.isDevelopment && (
                  <p className="text-xs text-gray-500 mt-2">Error ID: {this.state.errorId}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Try Again
                </button>

                <button
                  onClick={this.handleReportError}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Report Issue
                </button>
              </div>

              {this.state.isSecurityRelated && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <div className="flex">
                    <svg
                      className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Security Notice:</strong> This incident has been logged for security
                        review. If you believe this error is related to suspicious activity, please
                        contact support immediately.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={() => (window.location.href = '/')}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SecurityErrorBoundary;
