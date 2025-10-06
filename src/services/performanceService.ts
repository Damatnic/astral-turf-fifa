/**
 * Performance Monitoring Service
 * Tracks Core Web Vitals, user interactions, and application performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface WebVital {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private isClient = typeof window !== 'undefined';

  async initialize(): Promise<void> {
    if (!this.isClient) {
      // // // // console.log('⚡ Performance Service: Server-side, skipping initialization');
      return;
    }

    try {
      this.setupPerformanceObserver();
      this.setupWebVitalsTracking();
      this.trackInitialMetrics();

      // // // // console.log('⚡ Performance Service initialized');
    } catch (_error) {
      console.error('❌ Performance Service initialization failed:', _error);
    }
  }

  private setupPerformanceObserver(): void {
    if (!this.isClient || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      this.observer = new PerformanceObserver(list => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          this.recordMetric({
            name: entry.name,
            value: entry.duration || entry.startTime,
            timestamp: Date.now(),
            metadata: {
              entryType: entry.entryType,
              ...(entry.entryType === 'navigation' && {
                domContentLoaded: (entry as PerformanceNavigationTiming).domContentLoadedEventEnd,
                loadComplete: (entry as PerformanceNavigationTiming).loadEventEnd,
              }),
            },
          });
        });
      });

      // Observe different performance entry types
      const entryTypes = ['navigation', 'resource', 'measure', 'paint'];
      entryTypes.forEach(type => {
        try {
          this.observer?.observe({ entryTypes: [type] });
        } catch (__e) {
          // Some entry types may not be supported in all browsers
          // // // // console.debug(`Performance entry type ${type} not supported`);
        }
      });
    } catch (_error) {
      console.error('Failed to setup performance observer:', _error);
    }
  }

  private setupWebVitalsTracking(): void {
    if (!this.isClient) {
      return;
    }

    // Track Core Web Vitals using the web-vitals library pattern
    this.trackLCP();
    this.trackFID();
    this.trackCLS();
    this.trackFCP();
    this.trackTTFB();
  }

  private trackLCP(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry;

          this.recordWebVital({
            name: 'LCP',
            value: lastEntry.startTime,
            id: this.generateId(),
            delta: lastEntry.startTime,
            rating: this.getRating('LCP', lastEntry.startTime),
          });
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (__e) {
        // // // // console.debug('LCP tracking not supported');
      }
    }
  }

  private trackFID(): void {
    // First Input Delay
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries() as PerformanceEventTiming[];

          entries.forEach(entry => {
            const delay = entry.processingStart - entry.startTime;

            this.recordWebVital({
              name: 'FID',
              value: delay,
              id: this.generateId(),
              delta: delay,
              rating: this.getRating('FID', delay),
            });
          });
        });

        observer.observe({ entryTypes: ['first-input'] });
      } catch (__e) {
        // // // // console.debug('FID tracking not supported');
      }
    }
  }

  private trackCLS(): void {
    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries() as PerformanceEntry[];

          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });

          this.recordWebVital({
            name: 'CLS',
            value: clsValue,
            id: this.generateId(),
            delta: clsValue,
            rating: this.getRating('CLS', clsValue),
          });
        });

        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (__e) {
        // // // // console.debug('CLS tracking not supported');
      }
    }
  }

  private trackFCP(): void {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');

          if (fcpEntry) {
            this.recordWebVital({
              name: 'FCP',
              value: fcpEntry.startTime,
              id: this.generateId(),
              delta: fcpEntry.startTime,
              rating: this.getRating('FCP', fcpEntry.startTime),
            });
          }
        });

        observer.observe({ entryTypes: ['paint'] });
      } catch (__e) {
        // // // // console.debug('FCP tracking not supported');
      }
    }
  }

  private trackTTFB(): void {
    // Time to First Byte
    if (this.isClient && 'performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[];

      if (navigationEntries.length > 0) {
        const ttfb = navigationEntries[0].responseStart - navigationEntries[0].requestStart;

        this.recordWebVital({
          name: 'TTFB',
          value: ttfb,
          id: this.generateId(),
          delta: ttfb,
          rating: this.getRating('TTFB', ttfb),
        });
      }
    }
  }

  private trackInitialMetrics(): void {
    if (!this.isClient || !('performance' in window)) {
      return;
    }

    // Track initial page load metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          this.recordMetric({
            name: 'page-load-complete',
            value: navigation.loadEventEnd - navigation.fetchStart,
            timestamp: Date.now(),
            metadata: {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              domInteractive: navigation.domInteractive - navigation.fetchStart,
              firstByte: navigation.responseStart - navigation.fetchStart,
            },
          });
        }
      }, 0);
    });
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory bloat
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Send to analytics in production
    if (this.isClient && import.meta.env.PROD) {
      this.sendToAnalytics(metric);
    }
  }

  private recordWebVital(vital: WebVital): void {
    // // // // console.log(`🎯 Web Vital - ${vital.name}:`, {
    //   value: Math.round(vital.value),
    //   rating: vital.rating,
    // });

    this.recordMetric({
      name: `web-vital-${vital.name.toLowerCase()}`,
      value: vital.value,
      timestamp: Date.now(),
      metadata: {
        rating: vital.rating,
        id: vital.id,
      },
    });
  }

  private getRating(metric: WebVital['name'], value: number): WebVital['rating'] {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric];
    if (value <= threshold.good) {
      return 'good';
    }
    if (value <= threshold.poor) {
      return 'needs-improvement';
    }
    return 'poor';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToAnalytics(metric: PerformanceMetric): void {
    // In a real app, send to your analytics service
    // For now, just log in production
    if (import.meta.env.PROD) {
      // // // // console.debug('📊 Performance metric:', metric);
    }
  }

  // Public methods for manual tracking
  public trackUserAction(action: string, duration?: number): void {
    this.recordMetric({
      name: `user-action-${action}`,
      value: duration || performance.now(),
      timestamp: Date.now(),
      metadata: { action },
    });
  }

  public trackPageView(pageName: string): void {
    this.recordMetric({
      name: 'page-view',
      value: performance.now(),
      timestamp: Date.now(),
      metadata: { pageName, url: window.location.href },
    });
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getWebVitalsReport(): Record<string, PerformanceMetric | undefined> {
    const vitals = ['lcp', 'fid', 'cls', 'fcp', 'ttfb'];
    const report: Record<string, PerformanceMetric | undefined> = {};

    vitals.forEach(vital => {
      report[vital] = this.metrics.filter(m => m.name === `web-vital-${vital}`).pop(); // Get the latest measurement
    });

    return report;
  }

  async destroy(): Promise<void> {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.metrics = [];
    // // // // console.log('⚡ Performance Service destroyed');
  }
}

// Singleton instance
export const performanceService = new PerformanceService();

// Convenience functions
export const trackUserAction = performanceService.trackUserAction.bind(performanceService);
export const trackPageView = performanceService.trackPageView.bind(performanceService);
export const getWebVitalsReport = performanceService.getWebVitalsReport.bind(performanceService);
