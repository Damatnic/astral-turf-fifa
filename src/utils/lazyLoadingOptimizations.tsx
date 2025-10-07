/**
 * Catalyst Lazy Loading Optimizations
 * Ultra-efficient lazy loading with preloading strategies
 */

import React, { Suspense, lazy, ComponentType, LazyExoticComponent } from 'react';
import { useInView } from 'react-intersection-observer';

// Preloading strategies
type PreloadStrategy = 'idle' | 'hover' | 'viewport' | 'instant' | 'never';

interface LazyComponentOptions {
  preloadStrategy?: PreloadStrategy;
  fallback?: React.ComponentType;
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  timeout?: number;
  retryAttempts?: number;
}

// Enhanced lazy loading with preloading
export function createOptimizedLazy<T extends ComponentType<unknown>>(
  componentImport: () => Promise<{ default: T }>,
  _options: LazyComponentOptions = {},
): LazyExoticComponent<T> {
  const LazyComponent = lazy(componentImport);

  const preloadableComponent = LazyComponent as LazyExoticComponent<T> & {
    preload?: () => void;
  };

  preloadableComponent.preload = () => {
    componentImport();
  };

  return preloadableComponent;
}

// Viewport-based lazy loading hook
export function useViewportLazyLoad(options: { threshold?: number } = {}) {
  const { threshold = 0.1 } = options;
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
  });

  return {
    ref,
    shouldLoad: inView,
  };
}

// Optimized image loader with lazy loading
/* eslint-disable no-undef */
export class OptimizedImageLoader {
  private cache = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();
  private observer: IntersectionObserver | null;

  constructor() {
    if (typeof IntersectionObserver === 'undefined') {
      this.observer = null;
      return;
    }
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              this.loadImage(src);
              if (this.observer) {
                this.observer.unobserve(img);
              }
            }
          }
        });
      },
      {
        rootMargin: '50px',
      },
    );
  }

  loadImage(src: string, priority: 'low' | 'high' = 'low'): Promise<HTMLImageElement> {
    if (this.cache.has(src)) {
      return Promise.resolve(this.cache.get(src)!);
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      if (typeof Image === 'undefined') {
        reject(new Error('Image API not available (SSR context)'));
        return;
      }
      const img = new Image();

      img.onload = () => {
        this.cache.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };

      img.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };

      if (priority === 'high') {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      } else {
        img.loading = 'lazy';
        img.fetchPriority = 'low';
      }

      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  preloadImages(urls: string[], priority: 'low' | 'high' = 'low'): Promise<HTMLImageElement[]> {
    return Promise.all(urls.map(url => this.loadImage(url, priority)));
  }

  observeImage(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.observe(img);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.cache.clear();
    this.loadingPromises.clear();
  }
}
/* eslint-enable no-undef */

// Resource preloader for critical assets
export class ResourcePreloader {
  private static instance: ResourcePreloader;
  private preloadedResources = new Set<string>();

  static getInstance(): ResourcePreloader {
    if (!ResourcePreloader.instance) {
      ResourcePreloader.instance = new ResourcePreloader();
    }
    return ResourcePreloader.instance;
  }

  preloadStylesheet(href: string): Promise<void> {
    if (this.preloadedResources.has(href)) {
      return Promise.resolve();
    }

    if (typeof document === 'undefined') {
      return Promise.reject(new Error('Document API not available (SSR context)'));
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      link.onload = () => {
        this.preloadedResources.add(href);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  preloadScript(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    if (typeof document === 'undefined') {
      return Promise.reject(new Error('Document API not available (SSR context)'));
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = src;
      link.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  preloadFont(href: string): Promise<void> {
    if (this.preloadedResources.has(href)) {
      return Promise.resolve();
    }

    if (typeof document === 'undefined') {
      return Promise.reject(new Error('Document API not available (SSR context)'));
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = href;
      link.onload = () => {
        this.preloadedResources.add(href);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  prefetchResource(href: string): void {
    if (this.preloadedResources.has(href)) {
      return;
    }

    if (typeof document === 'undefined') {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }
}

type LazyLoadingErrorBoundaryProps = React.PropsWithChildren<{
  fallback: React.ReactNode;
  onError?: (error: Error) => void;
}>;

interface LazyLoadingErrorBoundaryState {
  hasError: boolean;
}

class LazyLoadingErrorBoundary extends React.Component<
  LazyLoadingErrorBoundaryProps,
  LazyLoadingErrorBoundaryState
> {
  override state: LazyLoadingErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): LazyLoadingErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

interface PreloadableComponent {
  preload?: () => void;
}

const invokePreload = (component: unknown) => {
  if (
    component &&
    (typeof component === 'object' || typeof component === 'function') &&
    typeof (component as PreloadableComponent).preload === 'function'
  ) {
    (component as PreloadableComponent).preload?.();
  }
};

// Component-level lazy loading wrapper
export function withLazyLoading<P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  options: LazyComponentOptions = {},
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P & { preloadStrategy?: PreloadStrategy }> &
    React.RefAttributes<HTMLDivElement>
> {
  const {
    fallback: FallbackComponent,
    errorBoundary: ErrorBoundary,
    preloadStrategy: defaultPreloadStrategy = 'viewport',
  } = options;

  const WithLazyLoadingComponent = React.forwardRef<
    HTMLDivElement,
    P & { preloadStrategy?: PreloadStrategy }
  >((props, ref) => {
    const { preloadStrategy = defaultPreloadStrategy, ...componentProps } = props;
    const [shouldLoad, setShouldLoad] = React.useState(preloadStrategy === 'instant');
    const [hasError, setHasError] = React.useState(false);
    const elementRef = React.useRef<HTMLDivElement | null>(null);

    const { ref: viewportRef, shouldLoad: inViewport } = useViewportLazyLoad();

    React.useEffect(() => {
      if (preloadStrategy === 'viewport' && inViewport) {
        setShouldLoad(true);
      }
    }, [inViewport, preloadStrategy]);

    const handleMouseEnter = React.useCallback(() => {
      if (preloadStrategy === 'hover' || preloadStrategy === 'viewport') {
        invokePreload(LazyComponent);
        if (preloadStrategy === 'hover') {
          setShouldLoad(true);
        }
      }
    }, [preloadStrategy]);

    const retry = React.useCallback(() => {
      setHasError(false);
      setShouldLoad(true);
    }, []);

    const handleError = React.useCallback(() => {
      setHasError(true);
    }, []);

    const combinedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        elementRef.current = node;

        if (typeof viewportRef === 'function') {
          viewportRef(node);
        } else if (viewportRef && 'current' in viewportRef) {
          (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [viewportRef],
    );

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        combinedRef(node);

        if (!ref) {
          return;
        }

        if (typeof ref === 'function') {
          ref(node);
        } else {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [combinedRef, ref],
    );

    if (hasError && ErrorBoundary) {
      return React.createElement(ErrorBoundary, {
        error: new Error('Component failed to load'),
        retry,
      });
    }

    if (!shouldLoad) {
      return (
        <div
          ref={setRefs}
          onMouseEnter={handleMouseEnter}
          className="lazy-placeholder"
          style={{ minHeight: '100px' }}
        >
          {FallbackComponent ? <FallbackComponent /> : null}
        </div>
      );
    }

    return (
      <div ref={setRefs} onMouseEnter={handleMouseEnter}>
        <LazyLoadingErrorBoundary
          fallback={
            ErrorBoundary ? (
              <ErrorBoundary error={new Error('Component error')} retry={retry} />
            ) : (
              <div>Error loading component</div>
            )
          }
          onError={handleError}
        >
          <Suspense
            fallback={
              FallbackComponent ? (
                <FallbackComponent />
              ) : (
                <div className="animate-pulse bg-slate-800/50 rounded h-32" />
              )
            }
          >
            {/* @ts-expect-error - ComponentType spread issue */}
            <LazyComponent {...(componentProps as P)} />
          </Suspense>
        </LazyLoadingErrorBoundary>
      </div>
    );
  });

  const componentName =
    (LazyComponent as { displayName?: string; name?: string }).displayName ||
    (LazyComponent as { displayName?: string; name?: string }).name ||
    'Component';
  WithLazyLoadingComponent.displayName = `WithLazyLoading(${componentName})`;

  return WithLazyLoadingComponent;
}

// Route-based code splitting with preloading
export function createRouteComponent<T extends ComponentType<unknown>>(
  componentImport: () => Promise<{ default: T }>,
  preloadTriggers: string[] = [],
): LazyExoticComponent<T> {
  const LazyComponent = createOptimizedLazy(componentImport, {
    preloadStrategy: 'hover',
    timeout: 15000,
    retryAttempts: 2,
  });

  if (typeof window !== 'undefined' && preloadTriggers.length > 0) {
    preloadTriggers.forEach(trigger => {
      const elements = document.querySelectorAll(`[href="${trigger}"]`);
      elements.forEach(element => {
        element.addEventListener('mouseenter', () => {
          invokePreload(LazyComponent);
        });
      });
    });
  }

  return LazyComponent;
}

// Progressive loading for large datasets
export function useProgressiveLoading<T>(data: T[], batchSize: number = 20, delay: number = 100) {
  const [loadedItems, setLoadedItems] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const loadMoreItems = React.useCallback(() => {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoadedItems(prev => {
        const nextBatch = data.slice(prev.length, prev.length + batchSize);
        const newItems = [...prev, ...nextBatch];

        if (newItems.length >= data.length) {
          setHasMore(false);
        }

        setLoading(false);
        return newItems;
      });
    }, delay);
  }, [data, batchSize, delay, loading, hasMore]);

  React.useEffect(() => {
    if (loadedItems.length === 0 && data.length > 0) {
      loadMoreItems();
    }
  }, [data.length, loadedItems.length, loadMoreItems]);

  return {
    items: loadedItems,
    loading,
    hasMore,
    loadMore: loadMoreItems,
  };
}

export default {
  createOptimizedLazy,
  useViewportLazyLoad,
  OptimizedImageLoader,
  ResourcePreloader,
  withLazyLoading,
  createRouteComponent,
  useProgressiveLoading,
};
