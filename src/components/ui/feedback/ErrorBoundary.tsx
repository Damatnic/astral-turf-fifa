import React, { Component, ErrorInfo, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { Button } from '../modern/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../modern/Card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  showDetails?: boolean;
  className?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry, LogRocket, etc.
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    
    // Create error report
    const errorReport = {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace available',
      componentStack: errorInfo?.componentStack || 'No component stack available',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2)).then(() => {
      alert('Error report copied to clipboard!');
    });
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, maxRetries = 3, showDetails = false, className } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      const canRetry = retryCount < maxRetries;
      const errorName = error?.name || 'Error';
      const errorMessage = error?.message || 'Something went wrong';

      return (
        <div className={cn('min-h-screen bg-secondary-950 flex items-center justify-center p-4', className)}>
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-secondary-400">
                  We're sorry, but an error occurred while loading this page.
                </p>
              </div>
            </CardHeader>

            <CardBody>
              <div className="space-y-4">
                {/* Error summary */}
                <div className="bg-error-900/20 border border-error-600/30 rounded-lg p-4">
                  <h3 className="font-semibold text-error-400 mb-2">{errorName}</h3>
                  <p className="text-sm text-error-300">{errorMessage}</p>
                </div>

                {/* Retry information */}
                {retryCount > 0 && (
                  <div className="bg-warning-900/20 border border-warning-600/30 rounded-lg p-4">
                    <p className="text-sm text-warning-300">
                      Retry attempt {retryCount} of {maxRetries}
                    </p>
                  </div>
                )}

                {/* Error details (development/debug) */}
                {showDetails && error && (
                  <details className="bg-secondary-800/50 rounded-lg p-4">
                    <summary className="cursor-pointer text-sm font-medium text-secondary-300 mb-2">
                      Technical Details
                    </summary>
                    <div className="space-y-2 text-xs">
                      <div>
                        <h4 className="font-medium text-secondary-400 mb-1">Stack Trace:</h4>
                        <pre className="bg-secondary-900/50 p-2 rounded text-secondary-300 overflow-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                      {errorInfo && (
                        <div>
                          <h4 className="font-medium text-secondary-400 mb-1">Component Stack:</h4>
                          <pre className="bg-secondary-900/50 p-2 rounded text-secondary-300 overflow-auto max-h-32">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Suggestions */}
                <div className="bg-primary-900/20 border border-primary-600/30 rounded-lg p-4">
                  <h3 className="font-semibold text-primary-400 mb-2">Try these solutions:</h3>
                  <ul className="text-sm text-primary-300 space-y-1">
                    <li>• Refresh the page to reload the application</li>
                    <li>• Check your internet connection</li>
                    <li>• Clear your browser cache and cookies</li>
                    <li>• Try again in a few moments</li>
                  </ul>
                </div>
              </div>
            </CardBody>

            <CardFooter>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    variant="primary"
                    className="flex-1"
                  >
                    Try Again ({maxRetries - retryCount} left)
                  </Button>
                )}
                
                <Button
                  onClick={this.handleReload}
                  variant="secondary"
                  className="flex-1"
                >
                  Reload Page
                </Button>

                {showDetails && (
                  <Button
                    onClick={this.handleReportError}
                    variant="outline"
                    className="flex-1"
                  >
                    Copy Error Report
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Hook for functional components to catch errors
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Specialized error components
export const NetworkError: React.FC<{
  onRetry?: () => void;
  message?: string;
}> = ({ onRetry, message = "Network connection failed" }) => (
  <div className="text-center py-8">
    <div className="text-4xl mb-4">🌐</div>
    <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
    <p className="text-secondary-400 mb-4">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="primary">
        Try Again
      </Button>
    )}
  </div>
);

export const NotFoundError: React.FC<{
  resource?: string;
  onGoBack?: () => void;
}> = ({ resource = "page", onGoBack }) => (
  <div className="text-center py-8">
    <div className="text-4xl mb-4">🔍</div>
    <h3 className="text-lg font-semibold text-white mb-2">
      {resource.charAt(0).toUpperCase() + resource.slice(1)} Not Found
    </h3>
    <p className="text-secondary-400 mb-4">
      The {resource} you're looking for doesn't exist or has been moved.
    </p>
    {onGoBack && (
      <Button onClick={onGoBack} variant="primary">
        Go Back
      </Button>
    )}
  </div>
);

export const PermissionError: React.FC<{
  action?: string;
  onRequestAccess?: () => void;
}> = ({ action = "access this resource", onRequestAccess }) => (
  <div className="text-center py-8">
    <div className="text-4xl mb-4">🔒</div>
    <h3 className="text-lg font-semibold text-white mb-2">Access Denied</h3>
    <p className="text-secondary-400 mb-4">
      You don't have permission to {action}.
    </p>
    {onRequestAccess && (
      <Button onClick={onRequestAccess} variant="primary">
        Request Access
      </Button>
    )}
  </div>
);