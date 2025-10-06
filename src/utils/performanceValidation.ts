/**
 * Catalyst Performance Validation & Core Web Vitals
 * Comprehensive performance monitoring and validation system
 */

import { useEffect, useState, useCallback } from 'react';

// Core Web Vitals targets (Catalyst standards)
export const CORE_WEB_VITALS_TARGETS = {
  // Catalyst Elite Standards
  LCP_GOOD: 1500, // Largest Contentful Paint < 1.5s (better than 2.5s standard)
  LCP_NEEDS_IMPROVEMENT: 2500,

  FID_GOOD: 50, // First Input Delay < 50ms (better than 100ms standard)
  FID_NEEDS_IMPROVEMENT: 100,

  CLS_GOOD: 0.05, // Cumulative Layout Shift < 0.05 (better than 0.1 standard)
  CLS_NEEDS_IMPROVEMENT: 0.1,

  // Additional Catalyst metrics
  FCP_GOOD: 1000, // First Contentful Paint < 1s
  TTI_GOOD: 2000, // Time to Interactive < 2s
  TBT_GOOD: 150, // Total Blocking Time < 150ms
  SI_GOOD: 2000, // Speed Index < 2s

  // Custom performance targets
  INTERACTION_RESPONSE: 16, // 60fps interaction response
  ANIMATION_FRAME_TIME: 16.67, // 60fps frame time
  MEMORY_USAGE_WARNING: 100 * 1024 * 1024, // 100MB
  BUNDLE_SIZE_WARNING: 500 * 1024, // 500KB
} as const;

// Performance metric types
interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  target: number;
  timestamp: number;
}

interface CoreWebVitals {
  lcp?: PerformanceMetric;
  fid?: PerformanceMetric;
  cls?: PerformanceMetric;
  fcp?: PerformanceMetric;
  tti?: PerformanceMetric;
  tbt?: PerformanceMetric;
  si?: PerformanceMetric;
}

// Enhanced Core Web Vitals monitor
export class CoreWebVitalsMonitor {
  private static instance: CoreWebVitalsMonitor;
  private observers: PerformanceObserver[] = [];
  private metrics: Map<string, PerformanceMetric> = new Map();
  private listeners: Set<(metrics: CoreWebVitals) => void> = new Set();
  private reportingInterval: number | null = null;

  static getInstance(): CoreWebVitalsMonitor {
    if (!CoreWebVitalsMonitor.instance) {
      CoreWebVitalsMonitor.instance = new CoreWebVitalsMonitor();
    }
    return CoreWebVitalsMonitor.instance;
  }

  private constructor() {
    this.initializeObservers();
    this.startReporting();
  }

  private initializeObservers() {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver(entryList => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];

        this.recordMetric('lcp', lastEntry.startTime, {
          good: CORE_WEB_VITALS_TARGETS.LCP_GOOD,
          needsImprovement: CORE_WEB_VITALS_TARGETS.LCP_NEEDS_IMPROVEMENT,
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver(entryList => {
        for (const entry of entryList.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime;
          this.recordMetric('fid', fid, {
            good: CORE_WEB_VITALS_TARGETS.FID_GOOD,
            needsImprovement: CORE_WEB_VITALS_TARGETS.FID_NEEDS_IMPROVEMENT,
          });
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsEntries: any[] = [];
      const clsObserver = new PerformanceObserver(entryList => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            clsEntries.push(entry);
          }
        }

        this.recordMetric('cls', clsValue, {
          good: CORE_WEB_VITALS_TARGETS.CLS_GOOD,
          needsImprovement: CORE_WEB_VITALS_TARGETS.CLS_NEEDS_IMPROVEMENT,
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // First Contentful Paint
      const paintObserver = new PerformanceObserver(entryList => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('fcp', entry.startTime, {
              good: CORE_WEB_VITALS_TARGETS.FCP_GOOD,
              needsImprovement: 1800,
            });
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Long Tasks (for Total Blocking Time)
      let totalBlockingTime = 0;
      const longTaskObserver = new PerformanceObserver(entryList => {
        for (const entry of entryList.getEntries()) {
          if (entry.duration > 50) {
            totalBlockingTime += entry.duration - 50;
          }
        }

        this.recordMetric('tbt', totalBlockingTime, {
          good: CORE_WEB_VITALS_TARGETS.TBT_GOOD,
          needsImprovement: 300,
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      console.error('Failed to initialize performance observers:', error);
    }

    // Navigation timing for additional metrics
    this.observeNavigationTiming();
  }

  private observeNavigationTiming() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          // Time to Interactive approximation
          const tti = navigation.domContentLoadedEventEnd;
          this.recordMetric('tti', tti, {
            good: CORE_WEB_VITALS_TARGETS.TTI_GOOD,
            needsImprovement: 3800,
          });

          // Custom metrics
          this.recordCustomMetrics(navigation);
        }
      }, 0);
    });
  }

  private recordCustomMetrics(navigation: PerformanceNavigationTiming) {
    // TTFB (Time to First Byte)
    const ttfb = navigation.responseStart - navigation.requestStart;
    this.recordMetric('ttfb', ttfb, { good: 200, needsImprovement: 500 });

    // DNS lookup time
    const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
    this.recordMetric('dns', dnsTime, { good: 20, needsImprovement: 50 });

    // TCP connection time
    const tcpTime = navigation.connectEnd - navigation.connectStart;
    this.recordMetric('tcp', tcpTime, { good: 50, needsImprovement: 100 });

    // DOM processing time
    const domTime = (navigation as any).domContentLoadedEventEnd - (navigation as any).domLoading;
    this.recordMetric('dom', domTime, { good: 800, needsImprovement: 1500 });
  }

  private recordMetric(
    name: string,
    value: number,
    thresholds: { good: number; needsImprovement: number }
  ) {
    const rating =
      value <= thresholds.good
        ? 'good'
        : value <= thresholds.needsImprovement
          ? 'needs-improvement'
          : 'poor';

    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      target: thresholds.good,
      timestamp: Date.now(),
    };

    this.metrics.set(name, metric);

    // Emit performance event
    window.dispatchEvent(
      new CustomEvent('catalyst:performance-metric', {
        detail: metric,
      })
    );

    // Log warnings for poor performance
    if (rating === 'poor') {
      console.warn(
        `🚨 Performance Alert: ${name.toUpperCase()} is poor (${value.toFixed(2)} > ${thresholds.needsImprovement})`
      );
    } else if (rating === 'needs-improvement') {
      console.warn(
        `⚠️ Performance Warning: ${name.toUpperCase()} needs improvement (${value.toFixed(2)} > ${thresholds.good})`
      );
    } else {
      console.log(
        `✅ Performance Good: ${name.toUpperCase()} is excellent (${value.toFixed(2)} ≤ ${thresholds.good})`
      );
    }

    this.notifyListeners();
  }

  private startReporting() {
    // Report metrics every 30 seconds
    this.reportingInterval = window.setInterval(() => {
      this.generatePerformanceReport();
    }, 30000);
  }

  private generatePerformanceReport() {
    const metrics = this.getMetrics();
    const goodCount = Object.values(metrics).filter(m => m?.rating === 'good').length;
    const totalCount = Object.values(metrics).filter(m => m !== undefined).length;
    const score = totalCount > 0 ? (goodCount / totalCount) * 100 : 0;

    console.group('📊 Catalyst Performance Report');
    console.log(`Overall Score: ${score.toFixed(1)}% (${goodCount}/${totalCount} metrics good)`);

    Object.entries(metrics).forEach(([key, metric]) => {
      if (metric) {
        const emoji =
          metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '🚨';
        console.log(
          `${emoji} ${key.toUpperCase()}: ${metric.value.toFixed(2)}ms (${metric.rating})`
        );
      }
    });

    console.groupEnd();

    // Emit report event
    window.dispatchEvent(
      new CustomEvent('catalyst:performance-report', {
        detail: { metrics, score },
      })
    );
  }

  private notifyListeners() {
    const metrics = this.getMetrics();
    this.listeners.forEach(listener => {
      try {
        listener(metrics);
      } catch (error) {
        console.error('Performance listener error:', error);
      }
    });
  }

  subscribe(listener: (metrics: CoreWebVitals) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getMetrics(): CoreWebVitals {
    return {
      lcp: this.metrics.get('lcp'),
      fid: this.metrics.get('fid'),
      cls: this.metrics.get('cls'),
      fcp: this.metrics.get('fcp'),
      tti: this.metrics.get('tti'),
      tbt: this.metrics.get('tbt'),
      si: this.metrics.get('si'),
    };
  }

  getScore(): number {
    const metrics = Object.values(this.getMetrics()).filter(m => m !== undefined);
    if (metrics.length === 0) {
      return 0;
    }

    const goodCount = metrics.filter(m => m!.rating === 'good').length;
    return (goodCount / metrics.length) * 100;
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }

    this.metrics.clear();
    this.listeners.clear();
  }
}

// Real User Monitoring (RUM)
export class RealUserMonitoring {
  private static instance: RealUserMonitoring;
  private sessionData: any = {};
  private userInteractions: any[] = [];
  private errorCount = 0;

  static getInstance(): RealUserMonitoring {
    if (!RealUserMonitoring.instance) {
      RealUserMonitoring.instance = new RealUserMonitoring();
    }
    return RealUserMonitoring.instance;
  }

  private constructor() {
    this.initializeSession();
    this.setupErrorTracking();
    this.setupInteractionTracking();
  }

  private initializeSession() {
    this.sessionData = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: this.getConnectionInfo(),
      device: this.getDeviceInfo(),
    };
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData,
      };
    }
    return null;
  }

  private getDeviceInfo() {
    return {
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      devicePixelRatio: window.devicePixelRatio,
    };
  }

  private setupErrorTracking() {
    window.addEventListener('error', event => {
      this.errorCount++;
      this.trackEvent('javascript-error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', event => {
      this.errorCount++;
      this.trackEvent('promise-rejection', {
        reason: event.reason,
      });
    });
  }

  private setupInteractionTracking() {
    // Track clicks
    document.addEventListener(
      'click',
      event => {
        this.trackInteraction('click', {
          target: this.getElementSelector(event.target as Element),
          timestamp: Date.now(),
        });
      },
      { passive: true }
    );

    // Track scroll events
    let scrollTimeout: number;
    document.addEventListener(
      'scroll',
      () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(() => {
          this.trackInteraction('scroll', {
            scrollY: window.scrollY,
            timestamp: Date.now(),
          });
        }, 100);
      },
      { passive: true }
    );
  }

  private getElementSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    if (element.className) {
      return `.${element.className.split(' ')[0]}`;
    }
    return element.tagName.toLowerCase();
  }

  private trackInteraction(type: string, data: any) {
    this.userInteractions.push({
      type,
      data,
      timestamp: Date.now(),
    });

    // Keep only last 100 interactions
    if (this.userInteractions.length > 100) {
      this.userInteractions.shift();
    }
  }

  trackEvent(name: string, data: any) {
    const event = {
      name,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
    };

    // Emit RUM event
    window.dispatchEvent(
      new CustomEvent('catalyst:rum-event', {
        detail: event,
      })
    );
  }

  getSessionData() {
    return {
      ...this.sessionData,
      duration: Date.now() - this.sessionData.startTime,
      errorCount: this.errorCount,
      interactionCount: this.userInteractions.length,
    };
  }

  getInteractions() {
    return [...this.userInteractions];
  }
}

// Lighthouse CI integration
export class LighthouseCI {
  private static instance: LighthouseCI;

  static getInstance(): LighthouseCI {
    if (!LighthouseCI.instance) {
      LighthouseCI.instance = new LighthouseCI();
    }
    return LighthouseCI.instance;
  }

  async runAudit(): Promise<any> {
    // This would integrate with Lighthouse CI in a real implementation
    console.log('🔍 Running Lighthouse audit...');

    // Simulate audit results
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          performance: 95,
          accessibility: 98,
          bestPractices: 92,
          seo: 90,
          pwa: 85,
        });
      }, 2000);
    });
  }

  async validateTargets(): Promise<boolean> {
    const monitor = CoreWebVitalsMonitor.getInstance();
    const metrics = monitor.getMetrics();
    const score = monitor.getScore();

    // Check if all Core Web Vitals are good
    const coreVitalsGood = [
      metrics.lcp?.rating === 'good',
      metrics.fid?.rating === 'good',
      metrics.cls?.rating === 'good',
    ].every(Boolean);

    console.log(`📊 Performance validation: ${score.toFixed(1)}% score`);
    console.log(`✅ Core Web Vitals: ${coreVitalsGood ? 'PASS' : 'FAIL'}`);

    return coreVitalsGood && score >= 90;
  }
}

// React hooks
export function useCoreWebVitals() {
  const [metrics, setMetrics] = useState<CoreWebVitals>({});
  const [score, setScore] = useState(0);

  useEffect(() => {
    const monitor = CoreWebVitalsMonitor.getInstance();

    const unsubscribe = monitor.subscribe(newMetrics => {
      setMetrics(newMetrics);
      setScore(monitor.getScore());
    });

    // Get initial metrics
    setMetrics(monitor.getMetrics());
    setScore(monitor.getScore());

    return () => {
      unsubscribe();
      return undefined;
    };
  }, []);

  return { metrics, score };
}

export function useRealUserMonitoring() {
  const [sessionData, setSessionData] = useState<any>({});
  const [interactions, setInteractions] = useState<any[]>([]);

  useEffect(() => {
    const rum = RealUserMonitoring.getInstance();

    // Update session data periodically
    const updateData = () => {
      setSessionData(rum.getSessionData());
      setInteractions(rum.getInteractions());
    };

    updateData();
    const interval = setInterval(updateData, 5000);

    return () => clearInterval(interval);
  }, []);

  const trackEvent = useCallback((name: string, data: any) => {
    const rum = RealUserMonitoring.getInstance();
    rum.trackEvent(name, data);
  }, []);

  return { sessionData, interactions, trackEvent };
}

export function usePerformanceValidation() {
  const [isValid, setIsValid] = useState(false);
  const [validating, setValidating] = useState(false);

  const validate = useCallback(async () => {
    setValidating(true);

    try {
      const lighthouse = LighthouseCI.getInstance();
      const result = await lighthouse.validateTargets();
      setIsValid(result);
      return result;
    } catch (error) {
      console.error('Performance validation failed:', error);
      return false;
    } finally {
      setValidating(false);
    }
  }, []);

  return { isValid, validating, validate };
}

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  console.log('🚀 Initializing Catalyst Performance Monitoring...');

  // Initialize Core Web Vitals monitoring
  const cwvMonitor = CoreWebVitalsMonitor.getInstance();

  // Initialize Real User Monitoring
  const rum = RealUserMonitoring.getInstance();

  // Initialize Lighthouse CI
  const lighthouse = LighthouseCI.getInstance();

  // Set up global error boundary for performance issues
  window.addEventListener('catalyst:performance-metric', (event: any) => {
    const metric = event.detail;
    if (metric.rating === 'poor') {
      rum.trackEvent('performance-issue', metric);
    }
  });

  console.log('✅ Catalyst Performance Monitoring initialized');

  return {
    cwvMonitor,
    rum,
    lighthouse,
  };
}

export default {
  CoreWebVitalsMonitor,
  RealUserMonitoring,
  LighthouseCI,
  useCoreWebVitals,
  useRealUserMonitoring,
  usePerformanceValidation,
  initializePerformanceMonitoring,
  CORE_WEB_VITALS_TARGETS,
};
