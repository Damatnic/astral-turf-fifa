/**
 * Tactics-specific Error Boundary Component
 * Handles errors specifically for tactical components with context-aware fallbacks
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { LightErrorFallback } from '../ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class TacticsErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate error ID for tracking
    const errorId = `tactics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName = 'TacticsComponent', onError } = this.props;

    // Log error details
    console.error(`TacticsErrorBoundary caught an error in ${componentName}:`, error);
    console.error('Error Info:', errorInfo);

    // Call custom error handler if provided
    onError?.(error, errorInfo);

    // Track error for analytics (if service is available)
    try {
      // Only track if we have the error tracking service
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: `${componentName}: ${error.message}`,
          fatal: false,
          error_id: this.state.errorId,
        });
      }
    } catch (_trackingError) {
      // // console.warn('Error tracking failed:', trackingError);
    }
  }

  resetError = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      // // console.log(`Retrying ${this.props.componentName || 'component'} (attempt ${this.retryCount})`);

      this.setState({
        hasError: false,
        error: null,
        errorId: null,
      });
    } else {
      // // console.warn('Max retry attempts reached for', this.props.componentName);
      // Force page reload if too many retries
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallback, componentName = 'Tactics Component', showDetails = false } = this.props;

      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Show different fallbacks based on error type
      if (this.state.error?.message?.includes('formation')) {
        return (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-400 font-medium">Formation Loading Error</span>
            </div>
            <p className="text-red-300 text-sm mb-3">
              There was an issue loading formation data. This might be due to invalid formation
              configuration.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.resetError}
                className="text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded transition-colors duration-200 mr-2"
              >
                Retry ({this.maxRetries - this.retryCount} attempts left)
              </button>
              <button
                onClick={() => window.location.reload()}
                className="text-sm bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded transition-colors duration-200"
              >
                Reload Page
              </button>
            </div>
            {showDetails && this.state.error && import.meta.env.DEV && (
              <div className="mt-3 p-2 bg-slate-900 rounded text-xs text-red-300 font-mono">
                {this.state.error.message}
              </div>
            )}
          </div>
        );
      }

      if (
        this.state.error?.message?.includes('player') ||
        this.state.error?.message?.includes('undefined')
      ) {
        return (
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg
                className="w-5 h-5 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-orange-400 font-medium">Player Data Error</span>
            </div>
            <p className="text-orange-300 text-sm mb-3">
              There was an issue with player data. Some players may not be displayed correctly.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.resetError}
                className="text-sm bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 px-3 py-1 rounded transition-colors duration-200 mr-2"
              >
                Retry ({this.maxRetries - this.retryCount} attempts left)
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="text-sm bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded transition-colors duration-200"
              >
                Go to Home
              </button>
            </div>
            {showDetails && this.state.error && import.meta.env.DEV && (
              <div className="mt-3 p-2 bg-slate-900 rounded text-xs text-orange-300 font-mono">
                {this.state.error.message}
              </div>
            )}
          </div>
        );
      }

      // Default fallback for other errors
      return (
        <LightErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          componentName={componentName}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with TacticsErrorBoundary
export const withTacticsErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string,
  showDetails = false,
) => {
  const WithErrorBoundaryComponent = (props: P) => (
    <TacticsErrorBoundary
      componentName={componentName || WrappedComponent.displayName || WrappedComponent.name}
      showDetails={showDetails}
    >
      <WrappedComponent {...props} />
    </TacticsErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withTacticsErrorBoundary(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
};
