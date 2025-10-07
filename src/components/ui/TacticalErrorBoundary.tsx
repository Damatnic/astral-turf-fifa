import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

/**
 * Tactical Error Boundary - Bulletproof error handling for tactical components
 * Provides graceful fallbacks and detailed error reporting for production stability
 */
export class TacticalErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `tactical-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.group(`🛡️ Tactical Error Boundary: ${this.props.context || 'Unknown Context'}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error ID:', this.state.errorId);
    console.groupEnd();

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real app, send to error reporting service like Sentry
    const errorReport = {
      errorId: this.state.errorId,
      context: this.props.context,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.warn('Error report generated:', errorReport);

    // Example: Send to analytics/monitoring service
    // analytics.track('tactical_error_boundary_triggered', errorReport);
  };

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
      });
    }
  };

  handleReset = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-4">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                Tactical Component Error
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                {this.props.context
                  ? `Error in ${this.props.context}`
                  : 'An error occurred in the tactical system'}
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-100 dark:bg-red-900/20 rounded-md p-3 mb-4 text-left">
                <div className="flex items-start gap-2">
                  <Bug className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-700 dark:text-red-300">
                    <div className="font-medium mb-1">Debug Info:</div>
                    <div className="font-mono text-xs">{this.state.error?.message}</div>
                    <div className="text-xs text-red-500 mt-1">Error ID: {this.state.errorId}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              {this.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry ({this.maxRetries - this.retryCount} left)
                </button>
              )}

              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
              >
                Reset Component
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              This error has been logged for investigation
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping tactical components with error boundary
 */
export function withTacticalErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string,
  fallback?: ReactNode,
) {
  return function WrappedComponent(props: P) {
    return (
      <TacticalErrorBoundary context={context} fallback={fallback}>
        <Component {...props} />
      </TacticalErrorBoundary>
    );
  };
}

/**
 * Hook for safe tactical calculations with automatic error handling
 */
export function useSafeTacticalCalculation<T>(
  calculation: () => T,
  fallback: T,
  dependencies: React.DependencyList,
  context?: string,
): T {
  return React.useMemo(() => {
    try {
      const result = calculation();
      if (result === null || result === undefined) {
        console.warn(`Safe calculation returned null/undefined in ${context}, using fallback`);
        return fallback;
      }
      return result;
    } catch (error) {
      console.error(`Safe calculation failed in ${context}:`, error);
      return fallback;
    }
  }, dependencies);
}

export default TacticalErrorBoundary;
