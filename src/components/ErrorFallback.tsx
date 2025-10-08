/**
 * Enhanced Error Fallback Components
 * Provides user-friendly error displays with recovery options
 */

/* global performance */
import React from 'react';
import { trackUserAction } from '../services/performanceService';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  errorId?: string;
  componentName?: string;
}

// Main Error Fallback Component
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  errorId,
  componentName,
}) => {
  const handleRetry = () => {
    trackUserAction('error-retry', performance.now());
    resetError?.();
  };

  const handleReload = () => {
    trackUserAction('error-reload', performance.now());
    window.location.reload();
  };

  const handleGoHome = () => {
    trackUserAction('error-go-home', performance.now());
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-lg p-6 text-center border border-slate-700">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-400"
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
        </div>

        {/* Error Title */}
        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>

        {/* Error Description */}
        <p className="text-slate-400 mb-6">
          {componentName
            ? `There was an issue with the ${componentName} component. `
            : 'We encountered an unexpected error. '}
          Please try one of the options below.
        </p>

        {/* Error ID (for support) */}
        {errorId && (
          <div className="mb-6 p-3 bg-slate-700 rounded text-xs text-slate-300">
            <span className="font-medium">Error ID:</span> {errorId}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {resetError && (
            <button
              onClick={handleRetry}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          )}

          <button
            onClick={handleReload}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Reload Page
          </button>

          <button
            onClick={handleGoHome}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Go to Homepage
          </button>
        </div>

        {/* Development Error Details */}
        {import.meta.env.DEV && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
              Technical Details (Development Only)
            </summary>
            <div className="mt-2 p-3 bg-slate-900 rounded text-xs text-red-300 font-mono overflow-auto max-h-32">
              <div className="font-bold mb-1">{error.name}:</div>
              <div className="mb-2">{error.message}</div>
              {error.stack && (
                <pre className="whitespace-pre-wrap text-xs opacity-75">{error.stack}</pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

// Lightweight Error Fallback for smaller components
export const LightErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  componentName = 'component',
}) => {
  const handleRetry = () => {
    trackUserAction('light-error-retry', performance.now());
    resetError?.();
  };

  return (
    <div className="p-4 bg-red-500/10 border border-red-800 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-red-400 font-medium">Error loading {componentName}</span>
      </div>

      {resetError && (
        <button
          onClick={handleRetry}
          className="text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded transition-colors duration-200"
        >
          Try again
        </button>
      )}

      {import.meta.env.DEV && error && (
        <div className="mt-2 text-xs text-red-300 font-mono opacity-75">{error.message}</div>
      )}
    </div>
  );
};

// Loading Fallback Component
export const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-400 border-t-transparent"></div>
      <span className="text-slate-400">{message}</span>
    </div>
  </div>
);

// Network Error Fallback
export const NetworkErrorFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  const handleRetry = () => {
    trackUserAction('network-error-retry', performance.now());
    onRetry?.();
  };

  return (
    <div className="text-center p-8">
      <div className="mx-auto w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-medium text-white mb-2">Connection Issue</h3>
      <p className="text-slate-400 mb-4">
        Unable to connect to the server. Please check your internet connection.
      </p>

      {onRetry && (
        <button
          onClick={handleRetry}
          className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

// 404 Not Found Fallback
export const NotFoundFallback: React.FC = () => {
  const handleGoHome = () => {
    trackUserAction('404-go-home', performance.now());
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl font-bold text-teal-400 mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-slate-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <button
          onClick={handleGoHome}
          className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-lg transition-colors duration-200"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  );
};
