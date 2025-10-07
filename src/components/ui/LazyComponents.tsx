import React, { lazy, Suspense, ComponentType } from 'react';
import { LoadingAnimation } from './AnimationSystem';

/**
 * Lazy component loader with enhanced loading states
 * Provides automatic code splitting with customizable fallbacks
 */

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  delay?: number;
  minLoadTime?: number;
  onError?: (error: Error) => void;
}

/**
 * Enhanced lazy loader with minimum load time to prevent flash
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {},
): React.LazyExoticComponent<T> {
  const {
    delay = 0,
    minLoadTime = 200, // Minimum 200ms to prevent flash
  } = options;

  return lazy(() => {
    const startTime = Date.now();

    return Promise.all([importFunc(), new Promise(resolve => setTimeout(resolve, delay))]).then(
      ([moduleExports]) => {
        const loadTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - loadTime);

        if (remainingTime > 0) {
          return new Promise(resolve => {
            setTimeout(() => resolve(moduleExports), remainingTime);
          });
        }

        return moduleExports;
      },
    );
  });
}

/**
 * Lazy wrapper with custom fallback
 */
export function LazyWrapper({
  children,
  fallback,
  size = 'lg',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const defaultFallback = (
    <div className="w-full h-full flex items-center justify-center min-h-[400px]">
      <LoadingAnimation type="spinner" size={size} />
    </div>
  );

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
}

/**
 * Skeleton loader for better perceived performance
 */
export function SkeletonLoader({
  type = 'card',
  count = 1,
}: {
  type?: 'card' | 'list' | 'table' | 'board';
  count?: number;
}) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-slate-800 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-700 rounded"></div>
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-3 bg-slate-800 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        );

      case 'board':
        return (
          <div className="w-full aspect-[3/2] bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-lg animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingAnimation type="spinner" size="lg" />
            </div>
            {/* Field lines skeleton */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white"></div>
              <div className="absolute left-1/2 top-1/2 w-24 h-24 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
}

/**
 * Error boundary for lazy-loaded components
 */
interface LazyErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface LazyErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LazyErrorBoundary extends React.Component<
  LazyErrorBoundaryProps,
  LazyErrorBoundaryState
> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-2">⚠️</div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                Failed to load component
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Combined lazy component wrapper with error boundary and suspense
 */
export function LazyComponent({
  children,
  fallback,
  skeletonType,
  onError,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skeletonType?: 'card' | 'list' | 'table' | 'board';
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  const loadingFallback = fallback || <SkeletonLoader type={skeletonType} />;

  return (
    <LazyErrorBoundary onError={onError}>
      <Suspense fallback={loadingFallback}>{children}</Suspense>
    </LazyErrorBoundary>
  );
}

/**
 * Preload function for lazy components
 * Call this on user interaction (hover, click) to preload before navigation
 */
export function preloadComponent<T extends ComponentType<any>>(
  lazyComponent: React.LazyExoticComponent<T>,
): void {
  // Access the _payload to trigger the load
  const payload = (lazyComponent as any)._payload;
  if (payload && typeof payload._result === 'undefined') {
    payload._init(payload);
  }
}

/**
 * Hook to preload components on mount or interaction
 */
export function usePreload(components: React.LazyExoticComponent<any>[]) {
  React.useEffect(() => {
    // Preload after a short delay to not block initial render
    const timer = setTimeout(() => {
      components.forEach(component => {
        try {
          preloadComponent(component);
        } catch (error) {
          console.warn('Failed to preload component:', error);
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [components]);
}

/**
 * Progressive hydration wrapper
 * Delays rendering of heavy components until after initial page load
 */
export function ProgressiveHydration({
  children,
  delay = 300,
  whenIdle = false,
}: {
  children: React.ReactNode;
  delay?: number;
  whenIdle?: boolean;
}) {
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    if (whenIdle && 'requestIdleCallback' in window) {
      const handle = requestIdleCallback(
        () => {
          setShouldRender(true);
        },
        { timeout: delay + 1000 },
      );
      return () => cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [delay, whenIdle]);

  return shouldRender ? <>{children}</> : null;
}
