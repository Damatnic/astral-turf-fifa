/**
 * Catalyst Performance Monitoring Suite
 * Comprehensive real-time performance tracking and optimization
 */

import React from 'react';
import { type Player, type Formation } from '../types';

// Performance thresholds and constants
export const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_WARNING: 16, // 60fps = 16.67ms per frame
  RENDER_TIME_CRITICAL: 33, // 30fps threshold
  MEMORY_WARNING: 50 * 1024 * 1024, // 50MB
  BUNDLE_SIZE_WARNING: 500 * 1024, // 500KB gzipped
  API_RESPONSE_WARNING: 1000, // 1 second
  INTERACTION_WARNING: 100, // 100ms for interactions
  LCP_TARGET: 2500, // Largest Contentful Paint
  FID_TARGET: 100, // First Input Delay
  CLS_TARGET: 0.1, // Cumulative Layout Shift
} as const;

// Performance metrics structure
interface PerformanceMetrics {
  // Rendering metrics
  renderTime: {
    current: number;
    average: number;
    max: number;
    slowRenders: number;
  };

  // Memory metrics
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    trend: 'stable' | 'increasing' | 'decreasing';
  };

  // Network metrics
  network: {
    latency: number;
    bandwidth: number;
    connectionType: string;
    effectiveType: string;
  };

  // Core Web Vitals
  webVitals: {
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    ttfb: number | null;
  };

  // Custom tactical metrics
  tactical: {
    playersRendered: number;
    formationComplexity: number;
    animationCount: number;
    interactionLatency: number;
  };

  // Battery status
  battery: {
    level: number;
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
  };

  // Device capabilities
  device: {
    hardwareConcurrency: number;
    deviceMemory: number;
    connection: string;
    platform: string;
    isMobile: boolean;
  };
}

// Advanced Performance Monitor
export class CatalystPerformanceMonitor {
  private static instance: CatalystPerformanceMonitor;
  private metrics: PerformanceMetrics;
  private observers: Map<string, PerformanceObserver> = new Map();
  private subscribers: Array<(metrics: PerformanceMetrics) => void> = [];
  private measurementHistory: Array<{ timestamp: number; metrics: Partial<PerformanceMetrics> }> =
    [];
  private isMonitoring = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private memoryHistory: number[] = [];
  private renderTimes: number[] = [];

  static getInstance(): CatalystPerformanceMonitor {
    if (!CatalystPerformanceMonitor.instance) {
      CatalystPerformanceMonitor.instance = new CatalystPerformanceMonitor();
    }
    return CatalystPerformanceMonitor.instance;
  }

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupPerformanceObservers();
    this.detectDeviceCapabilities();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      renderTime: {
        current: 0,
        average: 0,
        max: 0,
        slowRenders: 0,
      },
      memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        trend: 'stable',
      },
      network: {
        latency: 0,
        bandwidth: 0,
        connectionType: 'unknown',
        effectiveType: 'unknown',
      },
      webVitals: {
        lcp: null,
        fid: null,
        cls: null,
        ttfb: null,
      },
      tactical: {
        playersRendered: 0,
        formationComplexity: 0,
        animationCount: 0,
        interactionLatency: 0,
      },
      battery: {
        level: 1,
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
      },
      device: {
        hardwareConcurrency: navigator.hardwareConcurrency || 4,
        deviceMemory: (navigator as any).deviceMemory || 4,
        connection: 'unknown',
        platform: navigator.platform,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        ),
      },
    };
  }

  private setupPerformanceObservers(): void {
    // Web Vitals observers
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.webVitals.lcp = lastEntry.startTime;
          this.notifySubscribers();
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('[Performance] LCP observer not supported:', error);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.webVitals.fid = entry.processingStart - entry.startTime;
          });
          this.notifySubscribers();
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('[Performance] FID observer not supported:', error);
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver(list => {
          let clsValue = 0;
          const entries = list.getEntries();

          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });

          this.metrics.webVitals.cls = clsValue;
          this.notifySubscribers();
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (error) {
        console.warn('[Performance] CLS observer not supported:', error);
      }

      // Navigation timing
      try {
        const navigationObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.webVitals.ttfb = entry.responseStart - entry.requestStart;
          });
          this.notifySubscribers();
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (error) {
        console.warn('[Performance] Navigation observer not supported:', error);
      }

      // Long tasks observer
      try {
        const longTaskObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.duration > 50) {
              console.warn(`[Performance] Long task detected: ${entry.duration}ms`);
              this.logPerformanceIssue('long-task', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              });
            }
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('[Performance] Long task observer not supported:', error);
      }
    }
  }

  private detectDeviceCapabilities(): void {
    // Network information
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (connection) {
      this.metrics.network.connectionType = connection.type || 'unknown';
      this.metrics.network.effectiveType = connection.effectiveType || 'unknown';
      this.metrics.device.connection = connection.effectiveType || 'unknown';

      // Listen for network changes
      connection.addEventListener('change', () => {
        this.metrics.network.connectionType = connection.type || 'unknown';
        this.metrics.network.effectiveType = connection.effectiveType || 'unknown';
        this.notifySubscribers();
      });
    }

    // Battery API
    if ('getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          this.updateBatteryInfo(battery);

          battery.addEventListener('levelchange', () => this.updateBatteryInfo(battery));
          battery.addEventListener('chargingchange', () => this.updateBatteryInfo(battery));
          battery.addEventListener('chargingtimechange', () => this.updateBatteryInfo(battery));
          battery.addEventListener('dischargingtimechange', () => this.updateBatteryInfo(battery));
        })
        .catch((error: any) => {
          console.warn('[Performance] Battery API not available:', error);
        });
    }
  }

  private updateBatteryInfo(battery: any): void {
    this.metrics.battery = {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
    };
    this.notifySubscribers();
  }

  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    console.log('[Performance] Starting comprehensive monitoring');

    // Update metrics every second
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000);

    // Initial update
    this.updateMetrics();
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    console.log('[Performance] Stopping monitoring');

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private updateMetrics(): void {
    // Update memory metrics
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      this.metrics.memory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        trend: this.calculateMemoryTrend(memory.usedJSHeapSize),
      };

      // Check memory warnings
      if (memory.usedJSHeapSize > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
        this.logPerformanceIssue('memory-warning', {
          usage: memory.usedJSHeapSize,
          threshold: PERFORMANCE_THRESHOLDS.MEMORY_WARNING,
        });
      }
    }

    // Update network latency
    this.measureNetworkLatency();

    // Calculate render time average
    if (this.renderTimes.length > 0) {
      this.metrics.renderTime.average =
        this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
      this.metrics.renderTime.max = Math.max(...this.renderTimes);
    }

    // Store measurement history
    this.measurementHistory.push({
      timestamp: Date.now(),
      metrics: {
        memory: this.metrics.memory,
        renderTime: this.metrics.renderTime,
        network: this.metrics.network,
      },
    });

    // Keep only last 100 measurements
    if (this.measurementHistory.length > 100) {
      this.measurementHistory = this.measurementHistory.slice(-100);
    }

    this.notifySubscribers();
  }

  private calculateMemoryTrend(currentUsage: number): 'stable' | 'increasing' | 'decreasing' {
    this.memoryHistory.push(currentUsage);

    // Keep only last 10 measurements
    if (this.memoryHistory.length > 10) {
      this.memoryHistory = this.memoryHistory.slice(-10);
    }

    if (this.memoryHistory.length < 5) {
      return 'stable';
    }

    const recent = this.memoryHistory.slice(-5);
    const older = this.memoryHistory.slice(-10, -5);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.05) {
      return 'increasing';
    }
    if (change < -0.05) {
      return 'decreasing';
    }
    return 'stable';
  }

  private async measureNetworkLatency(): Promise<void> {
    try {
      const startTime = performance.now();

      // Use a small image or endpoint for latency measurement
      const response = await fetch('/favicon.svg', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (response.ok) {
        const endTime = performance.now();
        this.metrics.network.latency = endTime - startTime;
      }
    } catch (error) {
      // Network measurement failed, keep previous value
    }
  }

  // Render performance tracking
  startRender(): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      this.metrics.renderTime.current = renderTime;
      this.renderTimes.push(renderTime);

      // Keep only last 60 render times (about 1 second at 60fps)
      if (this.renderTimes.length > 60) {
        this.renderTimes = this.renderTimes.slice(-60);
      }

      // Check for slow renders
      if (renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING) {
        this.metrics.renderTime.slowRenders++;

        if (renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_CRITICAL) {
          this.logPerformanceIssue('critical-render', {
            renderTime,
            threshold: PERFORMANCE_THRESHOLDS.RENDER_TIME_CRITICAL,
          });
        }
      }

      this.notifySubscribers();
    };
  }

  // Tactical-specific metrics
  updateTacticalMetrics(data: {
    playersRendered?: number;
    formationComplexity?: number;
    animationCount?: number;
    interactionLatency?: number;
  }): void {
    Object.assign(this.metrics.tactical, data);

    // Check interaction latency
    if (
      data.interactionLatency &&
      data.interactionLatency > PERFORMANCE_THRESHOLDS.INTERACTION_WARNING
    ) {
      this.logPerformanceIssue('slow-interaction', {
        latency: data.interactionLatency,
        threshold: PERFORMANCE_THRESHOLDS.INTERACTION_WARNING,
      });
    }

    this.notifySubscribers();
  }

  // Formation complexity calculation
  calculateFormationComplexity(formation: Formation, players: Player[]): number {
    if (!formation || !players) {
      return 0;
    }

    let complexity = 0;

    // Base complexity from slot count
    complexity += formation.slots.length * 10;

    // Add complexity for player assignments
    const assignedSlots = formation.slots.filter(slot => slot.playerId);
    complexity += assignedSlots.length * 5;

    // Add complexity for position variety
    const roleTypes = new Set(formation.slots.map(slot => slot.role));
    complexity += roleTypes.size * 15;

    // Add complexity for custom positions
    const customPositions = formation.slots.filter(
      slot =>
        slot.defaultPosition.x !== Math.round(slot.defaultPosition.x) ||
        slot.defaultPosition.y !== Math.round(slot.defaultPosition.y),
    );
    complexity += customPositions.length * 20;

    return Math.round(complexity);
  }

  // Performance issue logging
  private logPerformanceIssue(type: string, data: any): void {
    const issue = {
      type,
      timestamp: Date.now(),
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
      metrics: this.metrics,
    };

    console.warn(`[Performance Issue] ${type}:`, issue);

    // In production, this could send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_issue', {
        issue_type: type,
        custom_parameter: JSON.stringify(data),
      });
    }
  }

  // Subscription management
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('[Performance] Subscriber callback error:', error);
      }
    });
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance summary
  getPerformanceSummary(): {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check Web Vitals
    if (
      this.metrics.webVitals.lcp &&
      this.metrics.webVitals.lcp > PERFORMANCE_THRESHOLDS.LCP_TARGET
    ) {
      issues.push('Slow Largest Contentful Paint');
      recommendations.push('Optimize critical resource loading');
      score -= 20;
    }

    if (
      this.metrics.webVitals.fid &&
      this.metrics.webVitals.fid > PERFORMANCE_THRESHOLDS.FID_TARGET
    ) {
      issues.push('High First Input Delay');
      recommendations.push('Reduce JavaScript execution time');
      score -= 15;
    }

    if (
      this.metrics.webVitals.cls &&
      this.metrics.webVitals.cls > PERFORMANCE_THRESHOLDS.CLS_TARGET
    ) {
      issues.push('High Cumulative Layout Shift');
      recommendations.push('Reserve space for dynamic content');
      score -= 15;
    }

    // Check render performance
    if (this.metrics.renderTime.average > PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING) {
      issues.push('Slow rendering performance');
      recommendations.push('Optimize component re-renders');
      score -= 20;
    }

    // Check memory usage
    if (this.metrics.memory.trend === 'increasing') {
      issues.push('Increasing memory usage');
      recommendations.push('Check for memory leaks');
      score -= 10;
    }

    // Check tactical performance
    if (this.metrics.tactical.interactionLatency > PERFORMANCE_THRESHOLDS.INTERACTION_WARNING) {
      issues.push('Slow user interactions');
      recommendations.push('Optimize event handlers and state updates');
      score -= 15;
    }

    // Check device limitations
    if (this.metrics.device.isMobile && this.metrics.tactical.playersRendered > 50) {
      recommendations.push('Consider virtualization for mobile devices');
      score -= 5;
    }

    // Check battery status
    if (this.metrics.battery.level < 0.2 && !this.metrics.battery.charging) {
      recommendations.push('Enable power-saving mode');
    }

    // Determine overall rating
    let overall: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) {
      overall = 'excellent';
    } else if (score >= 75) {
      overall = 'good';
    } else if (score >= 60) {
      overall = 'fair';
    } else {
      overall = 'poor';
    }

    return {
      overall,
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  }

  // Get measurement history
  getHistory(): Array<{ timestamp: number; metrics: Partial<PerformanceMetrics> }> {
    return [...this.measurementHistory];
  }

  // Reset metrics
  reset(): void {
    this.metrics = this.initializeMetrics();
    this.measurementHistory = [];
    this.memoryHistory = [];
    this.renderTimes = [];
    this.notifySubscribers();
  }

  // Cleanup
  destroy(): void {
    this.stopMonitoring();

    // Disconnect all observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();

    // Clear subscribers
    this.subscribers = [];

    console.log('[Performance] Monitor destroyed');
  }
}

// Global instance
export const performanceMonitor = CatalystPerformanceMonitor.getInstance();

// React hooks for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);

  React.useEffect(() => {
    const monitor = performanceMonitor;

    // Start monitoring
    monitor.startMonitoring();

    // Subscribe to updates
    const unsubscribe = monitor.subscribe(setMetrics);

    // Initial metrics
    setMetrics(monitor.getMetrics());

    return () => {
      unsubscribe();
      // Don't stop monitoring here as other components might be using it
    };
  }, []);

  return metrics;
}

export function usePerformanceSummary() {
  const [summary, setSummary] = React.useState(performanceMonitor.getPerformanceSummary());

  React.useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(() => {
      setSummary(performanceMonitor.getPerformanceSummary());
    });

    return unsubscribe;
  }, []);

  return summary;
}

// Utility functions
export function measureAsyncOperation<T>(operation: () => Promise<T>, name: string): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

      // Log slow operations
      if (duration > 1000) {
        performanceMonitor['logPerformanceIssue']('slow-operation', {
          name,
          duration,
        });
      }

      resolve(result);
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error);
      reject(error);
    }
  });
}

export function measureSyncOperation<T>(operation: () => T, name: string): T {
  const startTime = performance.now();

  try {
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

    // Log slow operations
    if (duration > 100) {
      performanceMonitor['logPerformanceIssue']('slow-sync-operation', {
        name,
        duration,
      });
    }

    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

export default {
  CatalystPerformanceMonitor,
  performanceMonitor,
  usePerformanceMonitor,
  usePerformanceSummary,
  measureAsyncOperation,
  measureSyncOperation,
  PERFORMANCE_THRESHOLDS,
};
