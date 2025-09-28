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
export function createOptimizedLazy<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> {
  const {
    preloadStrategy = 'viewport',
    timeout = 10000,
    retryAttempts = 3
  } = options;

  let importPromise: Promise<{ default: T }> | null = null;
  let retryCount = 0;

  const loadComponent = (): Promise<{ default: T }> => {
    if (importPromise) return importPromise;

    importPromise = Promise.race([
      componentImport(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Component load timeout')), timeout)
      )
    ]).catch((error) => {
      importPromise = null; // Reset for retry
      
      if (retryCount < retryAttempts) {
        retryCount++;
        console.warn(`Component load failed, retrying (${retryCount}/${retryAttempts})...`, error);
        return new Promise(resolve => 
          setTimeout(() => resolve(loadComponent()), 1000 * retryCount)
        );
      }
      
      throw error;
    });

    return importPromise;
  };

  const preloadComponent = () => {
    if (!importPromise) {
      loadComponent().catch(() => {
        // Silently handle preload errors
      });
    }
  };

  // Implement preloading strategies
  switch (preloadStrategy) {
    case 'idle':
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(preloadComponent);
      } else {
        setTimeout(preloadComponent, 100);
      }
      break;
    
    case 'instant':
      preloadComponent();
      break;
    
    case 'viewport':
      // Viewport preloading handled by component wrapper
      break;
    
    case 'hover':
      // Hover preloading handled by component wrapper
      break;
  }

  const LazyComponent = lazy(loadComponent);
  
  // Add preload method to component
  (LazyComponent as any).preload = preloadComponent;
  
  return LazyComponent;
}

// Intersection observer hook for viewport-based lazy loading
export function useViewportLazyLoad(options: IntersectionObserverInit = {}) {
  const { ref, inView, entry } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: '200px', // Load 200px before entering viewport
    ...options
  });

  return { ref, shouldLoad: inView, entry };
}

// Optimized image lazy loading
export class OptimizedImageLoader {
  private cache = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();
  private priorityQueue: string[] = [];
  private observer: IntersectionObserver;
  
  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              this.loadImage(src, 'high').then(loadedImg => {
                img.src = loadedImg.src;
                img.classList.add('loaded');
              });
              this.observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );
  }

  async loadImage(src: string, priority: 'low' | 'high' = 'low'): Promise<HTMLImageElement> {
    // Check cache first
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // Create loading promise
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
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

      // Set loading priority
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
    this.observer.observe(img);
  }

  disconnect() {
    this.observer.disconnect();
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

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
    if (this.preloadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }
}

// Component-level lazy loading wrapper
export function withLazyLoading<P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  options: LazyComponentOptions = {}
): React.FC<P & { preloadStrategy?: PreloadStrategy }> {
  const {
    fallback: FallbackComponent,
    errorBoundary: ErrorBoundary,
    preloadStrategy: defaultPreloadStrategy = 'viewport'
  } = options;

  return React.forwardRef<any, P & { preloadStrategy?: PreloadStrategy }>((props, ref) => {
    const { preloadStrategy = defaultPreloadStrategy, ...componentProps } = props;
    const [shouldLoad, setShouldLoad] = React.useState(preloadStrategy === 'instant');
    const [hasError, setHasError] = React.useState(false);
    const [retryCount, setRetryCount] = React.useState(0);
    const elementRef = React.useRef<HTMLDivElement>(null);

    // Viewport-based loading
    const { ref: viewportRef, shouldLoad: inViewport } = useViewportLazyLoad();

    React.useEffect(() => {
      if (preloadStrategy === 'viewport' && inViewport) {
        setShouldLoad(true);
      }
    }, [inViewport, preloadStrategy]);

    // Hover-based preloading
    const handleMouseEnter = React.useCallback(() => {
      if (preloadStrategy === 'hover' || preloadStrategy === 'viewport') {
        if ((LazyComponent as any).preload) {
          (LazyComponent as any).preload();
        }
        if (preloadStrategy === 'hover') {
          setShouldLoad(true);
        }
      }
    }, [preloadStrategy]);

    // Error retry logic
    const retry = React.useCallback(() => {
      setHasError(false);
      setRetryCount(prev => prev + 1);
      setShouldLoad(true);
    }, []);

    const handleError = React.useCallback((error: Error) => {
      console.error('Lazy component error:', error);
      setHasError(true);
    }, []);

    // Combine refs
    const combinedRef = React.useCallback((node: HTMLDivElement) => {
      if (elementRef.current) elementRef.current = node;
      if (viewportRef) viewportRef(node);
    }, [viewportRef]);

    if (hasError && ErrorBoundary) {
      return React.createElement(ErrorBoundary, { 
        error: new Error('Component failed to load'), 
        retry: retry 
      });
    }

    if (!shouldLoad) {
      return (
        <div
          ref={combinedRef}
          onMouseEnter={handleMouseEnter}
          className="lazy-placeholder"
          style={{ minHeight: '100px' }} // Prevent layout shift
        >
          {FallbackComponent ? <FallbackComponent /> : null}
        </div>
      );
    }

    return (
      <div ref={combinedRef} onMouseEnter={handleMouseEnter}>
        <React.ErrorBoundary
          fallback={
            ErrorBoundary ? 
              <ErrorBoundary error={new Error('Component error')} retry={retry} /> :
              <div>Error loading component</div>
          }
          onError={handleError}
        >
          <Suspense
            fallback={
              FallbackComponent ? 
                <FallbackComponent /> : 
                <div className="animate-pulse bg-slate-800/50 rounded h-32" />
            }
          >
            <LazyComponent {...(componentProps as P)} ref={ref} />
          </Suspense>
        </React.ErrorBoundary>
      </div>
    );
  });
}

// Route-based code splitting with preloading
export function createRouteComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  preloadTriggers: string[] = []
): LazyExoticComponent<T> {
  const LazyComponent = createOptimizedLazy(componentImport, {
    preloadStrategy: 'hover',
    timeout: 15000,
    retryAttempts: 2
  });

  // Set up route preloading triggers
  if (typeof window !== 'undefined' && preloadTriggers.length > 0) {
    preloadTriggers.forEach(trigger => {
      const elements = document.querySelectorAll(`[href="${trigger}"]`);
      elements.forEach(element => {
        element.addEventListener('mouseenter', () => {
          if ((LazyComponent as any).preload) {
            (LazyComponent as any).preload();
          }
        });
      });
    });
  }

  return LazyComponent;
}

// Progressive loading for large datasets
export function useProgressiveLoading<T>(
  data: T[],
  batchSize: number = 20,
  delay: number = 100
) {
  const [loadedItems, setLoadedItems] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const loadMoreItems = React.useCallback(() => {
    if (loading || !hasMore) return;

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

  // Load initial batch
  React.useEffect(() => {
    if (loadedItems.length === 0 && data.length > 0) {
      loadMoreItems();
    }
  }, [data.length, loadedItems.length, loadMoreItems]);

  return {
    items: loadedItems,
    loading,
    hasMore,
    loadMore: loadMoreItems
  };
}

export default {
  createOptimizedLazy,
  useViewportLazyLoad,
  OptimizedImageLoader,
  ResourcePreloader,
  withLazyLoading,
  createRouteComponent,
  useProgressiveLoading
};