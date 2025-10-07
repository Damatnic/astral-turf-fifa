/**
 * Performance Monitoring System
 * 
 * Real-time performance monitoring with metrics collection,
 * memory leak detection, and performance reporting.
 */

import { useEffect, useRef, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetrics {
  /** Component render time in milliseconds */
  renderTime: number;
  /** Time since last render */
  timeSinceLastRender: number;
  /** Number of renders */
  renderCount: number;
  /** Memory usage snapshot */
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export interface PerformanceReport {
  componentName: string;
  metrics: PerformanceMetrics;
  timestamp: number;
  url: string;
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Get current memory usage (if available)
 */
export const getMemoryUsage = (): PerformanceMetrics['memoryUsage'] | undefined => {
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return undefined;
};

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if performance is degrading
 */
export const isPerformanceDegrading = (
  metrics: PerformanceMetrics,
  thresholds: {
    maxRenderTime?: number;
    maxMemoryIncrease?: number;
  } = {}
): boolean => {
  const { maxRenderTime = 16, maxMemoryIncrease = 50 * 1024 * 1024 } = thresholds;

  // Check render time (should be < 16ms for 60fps)
  if (metrics.renderTime > maxRenderTime) {
    console.warn(`Slow render detected: ${metrics.renderTime.toFixed(2)}ms`);
    return true;
  }

  // Check memory usage increase
  if (metrics.memoryUsage) {
    const memoryIncrease =
      metrics.memoryUsage.usedJSHeapSize - metrics.memoryUsage.totalJSHeapSize;
    if (memoryIncrease > maxMemoryIncrease) {
      console.warn(
        `High memory increase detected: ${formatBytes(memoryIncrease)}`
      );
      return true;
    }
  }

  return false;
};

// ============================================================================
// PERFORMANCE HOOKS
// ============================================================================

/**
 * Hook to measure component render performance
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   useRenderPerformance('MyComponent');
 *   return <div>Content</div>;
 * };
 * ```
 */
export const useRenderPerformance = (
  componentName: string,
  options: {
    enabled?: boolean;
    reportThreshold?: number;
    onReport?: (report: PerformanceReport) => void;
  } = {}
): PerformanceMetrics | null => {
  const { enabled = process.env.NODE_ENV === 'development', reportThreshold = 16, onReport } = options;

  const renderCount = useRef(0);
  const lastRenderTime = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();
    renderCount.current += 1;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      const timeSinceLastRender = lastRenderTime.current
        ? startTime - lastRenderTime.current
        : 0;

      const metrics: PerformanceMetrics = {
        renderTime,
        timeSinceLastRender,
        renderCount: renderCount.current,
        memoryUsage: getMemoryUsage(),
      };

      metricsRef.current = metrics;
      lastRenderTime.current = endTime;

      // Report if threshold exceeded
      if (renderTime > reportThreshold) {
        const report: PerformanceReport = {
          componentName,
          metrics,
          timestamp: Date.now(),
          url: window.location.href,
        };

        console.warn(
          `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`,
          report
        );

        onReport?.(report);
      }
    };
  });

  return metricsRef.current;
};

/**
 * Hook to detect memory leaks
 * 
 * Monitors memory usage and alerts if continuous growth is detected
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   useMemoryLeakDetection('MyComponent');
 *   return <div>Content</div>;
 * };
 * ```
 */
export const useMemoryLeakDetection = (
  componentName: string,
  options: {
    enabled?: boolean;
    checkInterval?: number;
    growthThreshold?: number;
    onLeak?: (componentName: string, growth: number) => void;
  } = {}
): void => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    checkInterval = 5000,
    growthThreshold = 10 * 1024 * 1024, // 10MB
    onLeak,
  } = options;

  const initialMemory = useRef<number | null>(null);
  const lastMemory = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !('memory' in performance)) return;

    const checkMemory = () => {
      const currentMemory = getMemoryUsage();
      if (!currentMemory) return;

      if (initialMemory.current === null) {
        initialMemory.current = currentMemory.usedJSHeapSize;
      }

      if (lastMemory.current !== null) {
        const growth = currentMemory.usedJSHeapSize - lastMemory.current;

        if (growth > growthThreshold) {
          console.warn(
            `[Memory Leak] ${componentName} - Memory grew by ${formatBytes(growth)}`,
            {
              initial: formatBytes(initialMemory.current),
              current: formatBytes(currentMemory.usedJSHeapSize),
              growth: formatBytes(growth),
            }
          );

          onLeak?.(componentName, growth);
        }
      }

      lastMemory.current = currentMemory.usedJSHeapSize;
    };

    const intervalId = setInterval(checkMemory, checkInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [componentName, enabled, checkInterval, growthThreshold, onLeak]);
};

/**
 * Hook to track and cleanup effect dependencies
 * 
 * Ensures all effects are properly cleaned up to prevent memory leaks
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const cleanup = useEffectCleanup('MyComponent');
 *   
 *   useEffect(() => {
 *     const subscription = someService.subscribe();
 *     cleanup.track(() => subscription.unsubscribe());
 *   }, []);
 *   
 *   return <div>Content</div>;
 * };
 * ```
 */
export const useEffectCleanup = (componentName: string) => {
  const cleanupFunctions = useRef<Set<() => void>>(new Set());

  const track = useCallback((cleanupFn: () => void) => {
    cleanupFunctions.current.add(cleanupFn);
  }, []);

  const cleanup = useCallback(() => {
    cleanupFunctions.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error(`[Cleanup Error] ${componentName}:`, error);
      }
    });
    cleanupFunctions.current.clear();
  }, [componentName]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { track, cleanup };
};

// ============================================================================
// PERFORMANCE REPORTING
// ============================================================================

/**
 * Collect and report performance metrics to analytics
 */
export const reportPerformanceMetrics = (report: PerformanceReport): void => {
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to analytics
    // analytics.track('component_performance', report);
  } else {
    // In development, log to console
    console.log('[Performance Report]', report);
  }
};

/**
 * Get Web Vitals metrics
 */
export const getWebVitals = (): void => {
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('[Web Vitals] LCP:', lastEntry.startTime.toFixed(2), 'ms');
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay
    const fidObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        const fid = entry.processingStart - entry.startTime;
        console.log('[Web Vitals] FID:', fid.toFixed(2), 'ms');
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          console.log('[Web Vitals] CLS:', clsValue.toFixed(4));
        }
      }
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  useRenderPerformance,
  useMemoryLeakDetection,
  useEffectCleanup,
  getMemoryUsage,
  formatBytes,
  isPerformanceDegrading,
  reportPerformanceMetrics,
  getWebVitals,
};
