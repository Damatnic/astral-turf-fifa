import React from 'react';

/**
 * Performance Monitoring Utilities
 *
 * Tracks performance metrics and provides optimization insights.
 */

interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  type: 'component' | 'api' | 'render' | 'route' | 'bundle';
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private marks: Map<string, number> = new Map();
  private readonly MAX_METRICS = 100;

  /**
   * Start measuring performance
   */
  start(name: string, type: PerformanceMetrics['type'] = 'component'): void {
    const timestamp = performance.now();
    this.marks.set(name, timestamp);

    // Use Performance API if available
    if ('performance' in window && performance.mark) {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * End measuring and record metric
   */
  end(name: string, metadata?: Record<string, any>): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Use Performance API if available
    if ('performance' in window && performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (e) {
        // Silently fail if measure fails
      }
    }

    // Record metric
    this.recordMetric({
      name,
      duration,
      timestamp: startTime,
      type: this.inferType(name),
      metadata,
    });

    // Clean up
    this.marks.delete(name);

    return duration;
  }

  /**
   * Record a metric directly
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && metric.duration > 1000) {
      console.warn(
        `Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`,
        metric,
      );
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: PerformanceMetrics['type']): PerformanceMetrics[] {
    return this.metrics.filter(m => m.type === type);
  }

  /**
   * Get average duration for a metric name
   */
  getAverageDuration(name: string): number {
    const matching = this.metrics.filter(m => m.name === name);
    if (matching.length === 0) {
      return 0;
    }

    const total = matching.reduce((sum, m) => sum + m.duration, 0);
    return total / matching.length;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    averageDuration: number;
    slowestOperation: PerformanceMetrics | null;
    byType: Record<string, number>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        slowestOperation: null,
        byType: {},
      };
    }

    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const slowest = this.metrics.reduce((max, m) => (m.duration > (max?.duration || 0) ? m : max));

    const byType: Record<string, number> = {};
    this.metrics.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
    });

    return {
      totalMetrics: this.metrics.length,
      averageDuration: total / this.metrics.length,
      slowestOperation: slowest,
      byType,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        summary: this.getSummary(),
        timestamp: Date.now(),
      },
      null,
      2,
    );
  }

  /**
   * Infer metric type from name
   */
  private inferType(name: string): PerformanceMetrics['type'] {
    if (name.includes('component') || name.includes('render')) {
      return 'render';
    }
    if (name.includes('api') || name.includes('fetch')) {
      return 'api';
    }
    if (name.includes('route') || name.includes('navigation')) {
      return 'route';
    }
    if (name.includes('bundle') || name.includes('chunk')) {
      return 'bundle';
    }
    return 'component';
  }

  /**
   * Get Web Vitals if available
   */
  getWebVitals(): {
    FCP?: number;
    LCP?: number;
    FID?: number;
    CLS?: number;
    TTFB?: number;
  } {
    const vitals: any = {};

    if ('PerformanceObserver' in window) {
      try {
        // Get First Contentful Paint
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        if (fcpEntry) {
          vitals.FCP = (fcpEntry as any).startTime;
        }

        // Get Largest Contentful Paint
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          vitals.LCP = (lcpEntries[lcpEntries.length - 1] as any).startTime;
        }

        // Get Time to First Byte
        const navigationEntry = performance.getEntriesByType('navigation')[0] as any;
        if (navigationEntry) {
          vitals.TTFB = navigationEntry.responseStart;
        }
      } catch (e) {
        // Silently fail if not supported
      }
    }

    return vitals;
  }

  /**
   * Report performance to analytics (placeholder)
   */
  report(): void {
    const summary = this.getSummary();
    const vitals = this.getWebVitals();

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      console.log('Performance Report:', {
        summary,
        vitals,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });

      // TODO: Send to analytics service
      // analytics.track('performance_report', { summary, vitals });
    } else {
      // In development, log to console
      console.table(this.metrics);
      console.log('Summary:', summary);
      console.log('Web Vitals:', vitals);
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export convenience functions
export const startMeasure = (name: string, type?: PerformanceMetrics['type']) =>
  performanceMonitor.start(name, type);

export const endMeasure = (name: string, metadata?: Record<string, any>) =>
  performanceMonitor.end(name, metadata);

export const recordMetric = (metric: PerformanceMetrics) => performanceMonitor.recordMetric(metric);

// Auto-report every 5 minutes in production
if (process.env.NODE_ENV === 'production') {
  setInterval(
    () => {
      performanceMonitor.report();
      performanceMonitor.clear();
    },
    5 * 60 * 1000,
  );
}

// Report on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.report();
  });
}

/**
 * React component performance wrapper
 */
export function measureComponentRender<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string,
): React.ComponentType<P> {
  const name = displayName || Component.displayName || Component.name || 'Anonymous';

  const MeasuredComponent: React.FC<P> = props => {
    React.useEffect(() => {
      startMeasure(`component-${name}-mount`);

      return () => {
        endMeasure(`component-${name}-mount`, {
          componentName: name,
          props: Object.keys(props),
        });
      };
    }, []);

    return React.createElement(Component, props);
  };

  MeasuredComponent.displayName = `Measured(${name})`;

  return MeasuredComponent;
}

/**
 * Hook to measure component render time
 */
export function usePerformanceMonitor(componentName: string) {
  React.useEffect(() => {
    startMeasure(`render-${componentName}`);

    return () => {
      endMeasure(`render-${componentName}`);
    };
  });

  return {
    start: (name: string) => startMeasure(`${componentName}-${name}`),
    end: (name: string) => endMeasure(`${componentName}-${name}`),
  };
}
