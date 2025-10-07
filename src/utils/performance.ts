import * as React from 'react';

/* global HTMLImageElement, IntersectionObserver, Image */

/**
 * Performance Optimization Utilities for Astral Turf
 *
 * Comprehensive performance monitoring, optimization, and debugging tools
 * for achieving perfect 60fps and sub-100ms interaction responses.
 */

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

type AnyFunction = (...args: unknown[]) => unknown;

type ObserverEntry = globalThis.PerformanceEntry;

interface EventTimingEntry extends ObserverEntry {
  processingStart?: number;
}

interface LayoutShiftEntry extends ObserverEntry {
  value?: number;
  hadRecentInput?: boolean;
}

interface NavigationTimingEntry extends ObserverEntry {
  firstContentfulPaint?: number;
}

type DebouncedFunction<T extends AnyFunction> = ((
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => ReturnType<T> | undefined) & {
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
  pending: () => boolean;
};

type ThrottledFunction<T extends AnyFunction> = ((
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => ReturnType<T> | undefined) & {
  cancel: () => void;
  pending: () => boolean;
};

type MemoizedFunction<T extends AnyFunction> = ((...args: Parameters<T>) => ReturnType<T>) & {
  cache: Map<string, ReturnType<T>>;
  clear: () => void;
};

type WindowLike = typeof globalThis & {
  requestAnimationFrame?: (callback: FrameCallback) => number;
  cancelAnimationFrame?: (handle: number) => void;
};

type PerformanceGlobal = globalThis.Performance & { memory?: PerformanceMemory };

const getWindow = (): WindowLike | undefined =>
  typeof window === 'undefined' ? undefined : (window as WindowLike);

const getPerformanceGlobal = (): PerformanceGlobal | undefined =>
  (globalThis as { performance?: PerformanceGlobal }).performance;

const now = (): number => {
  const perf = getPerformanceGlobal();
  return perf && typeof perf.now === 'function' ? perf.now() : Date.now();
};

type FrameCallback = (ms: number) => void;

const scheduleFrame = (callback: FrameCallback): number | null => {
  const win = getWindow();
  if (!win || typeof win.requestAnimationFrame !== 'function') {
    return null;
  }
  return win.requestAnimationFrame(callback);
};

const cancelFrame = (id: number | null): void => {
  const win = getWindow();
  if (id !== null && win && typeof win.cancelAnimationFrame === 'function') {
    win.cancelAnimationFrame(id);
  }
};

// Performance metrics collection
export interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;

  // Custom metrics
  timeToInteractive?: number;
  totalBlockingTime?: number;
  frameDuration?: number[];
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };

  // User interaction metrics
  inputLatency?: number[];
  scrollLatency?: number[];
  renderTime?: number[];

  // Resource metrics
  resourceCount?: number;
  resourceSize?: number;
  imageOptimization?: number;
  cacheHitRatio?: number;
}

interface PerformanceThresholds {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  fps: number;
  ttfb: number;
}

// Performance monitoring class
class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  private metrics: PerformanceMetrics = {};
  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private frameId: number | null = null;
  private lastFrameTime = 0;
  private frameDurations: number[] = [];
  private performanceObservers: Array<{ disconnect: () => void }> = [];
  private memoryIntervalId: ReturnType<typeof setInterval> | null = null;
  private thresholds: PerformanceThresholds = {
    fcp: 2000,
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    fps: 60,
    ttfb: 600,
  };
  private optimizationsEnabled = true;

  // Exposed for performance test harnesses
  public startTime = 0;
  public startMemory = 0;
  public calculations = 0;
  public cacheHits = 0;
  public cacheMisses = 0;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  static startMonitoring(): void {
    const monitor = PerformanceMonitor.getInstance();
    monitor.optimizationsEnabled = true;
    monitor.ensureMonitoring();
  }

  static setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    const monitor = PerformanceMonitor.getInstance();
    monitor.thresholds = {
      ...monitor.thresholds,
      ...thresholds,
    };
  }

  static getThresholds(): PerformanceThresholds {
    const monitor = PerformanceMonitor.getInstance();
    return { ...monitor.thresholds };
  }

  static getMetrics(): PerformanceMetrics {
    return PerformanceMonitor.getInstance().getMetrics();
  }

  static cleanup(): void {
    PerformanceMonitor.getInstance().cleanup();
  }

  static enableOptimizations(): void {
    PerformanceMonitor.startMonitoring();
  }

  static disableOptimizations(): void {
    const monitor = PerformanceMonitor.getInstance();
    monitor.optimizationsEnabled = false;
    monitor.cleanup();
  }

  static isOptimizationEnabled(): boolean {
    return PerformanceMonitor.getInstance().optimizationsEnabled;
  }

  private constructor() {
    this.ensureMonitoring();
  }

  private ensureMonitoring(): void {
    if (!this.optimizationsEnabled || typeof window === 'undefined') {
      return;
    }

    this.setupPerformanceObservers();
    this.startFrameMonitoring();
    this.setupMemoryMonitoring();
  }

  subscribe(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.add(listener);
    listener(this.getMetrics());
    return () => {
      this.observers.delete(listener);
    };
  }

  getMetrics(): PerformanceMetrics {
    return this.createMetricsSnapshot();
  }

  getPerformanceScore(): number {
    const metrics = this.metrics;
    const { lcp, fid, cls, fps: targetFps } = this.thresholds;
    let score = 100;

    if (metrics.largestContentfulPaint) {
      if (metrics.largestContentfulPaint > lcp * 1.6) {
        score -= 30;
      } else if (metrics.largestContentfulPaint > lcp) {
        score -= 15;
      }
    }

    if (metrics.firstInputDelay) {
      if (metrics.firstInputDelay > fid * 3) {
        score -= 25;
      } else if (metrics.firstInputDelay > fid) {
        score -= 10;
      }
    }

    if (metrics.cumulativeLayoutShift) {
      if (metrics.cumulativeLayoutShift > cls * 2.5) {
        score -= 20;
      } else if (metrics.cumulativeLayoutShift > cls) {
        score -= 10;
      }
    }

    const fps = this.getFPS();
    if (fps < targetFps * 0.5) {
      score -= 25;
    } else if (fps < targetFps * 0.84) {
      score -= 15;
    } else if (fps < targetFps) {
      score -= 5;
    }

    return Math.max(0, score);
  }

  measureInteraction<T>(name: string, fn: () => T): T {
    if (!this.optimizationsEnabled) {
      return fn();
    }

    const start = now();
    const result = fn();

    const frameId = scheduleFrame(() => {
      const duration = now() - start;
      this.pushMetricSample('inputLatency', duration, 50);
    });

    if (frameId === null) {
      const duration = now() - start;
      this.pushMetricSample('inputLatency', duration, 50);
    }

    return result;
  }

  measureRender(name: string, fn: () => Promise<void> | void): Promise<void> {
    if (!this.optimizationsEnabled) {
      const result = fn();
      return result instanceof Promise ? result : Promise.resolve();
    }

    const start = now();
    const finish = () => {
      const duration = now() - start;
      this.pushMetricSample('renderTime', duration, 50);
    };

    const result = fn();

    if (result instanceof Promise) {
      return result.finally(finish);
    }

    finish();
    return Promise.resolve();
  }

  getFPS(): number {
    if (this.frameDurations.length === 0) {
      return 0;
    }

    const avgFrameDuration =
      this.frameDurations.reduce((sum, duration) => sum + duration, 0) / this.frameDurations.length;
    return Math.round(1000 / avgFrameDuration);
  }

  cleanup(): void {
    cancelFrame(this.frameId);
    this.frameId = null;
    this.lastFrameTime = 0;
    this.frameDurations = [];

    if (this.memoryIntervalId !== null) {
      clearInterval(this.memoryIntervalId);
      this.memoryIntervalId = null;
    }

    this.performanceObservers.forEach(observer => observer.disconnect());
    this.performanceObservers = [];
  }

  private createMetricsSnapshot(): PerformanceMetrics {
    const snapshot: PerformanceMetrics = { ...this.metrics };

    if (snapshot.frameDuration) {
      snapshot.frameDuration = [...snapshot.frameDuration];
    }
    if (snapshot.inputLatency) {
      snapshot.inputLatency = [...snapshot.inputLatency];
    }
    if (snapshot.renderTime) {
      snapshot.renderTime = [...snapshot.renderTime];
    }
    if (snapshot.scrollLatency) {
      snapshot.scrollLatency = [...snapshot.scrollLatency];
    }
    if (snapshot.memoryUsage) {
      snapshot.memoryUsage = { ...snapshot.memoryUsage };
    }

    return snapshot;
  }

  private notifyObservers(): void {
    if (this.observers.size === 0) {
      return;
    }

    const snapshot = this.createMetricsSnapshot();
    this.observers.forEach(observer => observer(snapshot));
  }

  private updateMetric<K extends keyof PerformanceMetrics>(
    key: K,
    value: PerformanceMetrics[K],
  ): void {
    if (!this.optimizationsEnabled) {
      return;
    }

    this.metrics = {
      ...this.metrics,
      [key]: value,
    };
    this.notifyObservers();
  }

  private pushMetricSample(
    key: 'inputLatency' | 'renderTime' | 'scrollLatency',
    value: number,
    maxSamples: number,
  ): void {
    if (!this.optimizationsEnabled) {
      return;
    }

    const existing = Array.isArray(this.metrics[key]) ? [...(this.metrics[key] as number[])] : [];
    existing.push(value);
    if (existing.length > maxSamples) {
      existing.shift();
    }
    this.updateMetric(key, existing as PerformanceMetrics[typeof key]);
  }

  private setupPerformanceObservers(): void {
    if (this.performanceObservers.length > 0) {
      return;
    }

    if (typeof window === 'undefined' || typeof window.PerformanceObserver !== 'function') {
      return;
    }

    const Observer = window.PerformanceObserver;

    const observe = (entryTypes: string[], handler: (entries: ObserverEntry[]) => void) => {
      try {
        const observer = new Observer(list => handler(list.getEntries()));
        observer.observe({ entryTypes });
        this.performanceObservers.push(observer);
      } catch {
        // Silently ignore unsupported observer types
      }
    };

    observe(['largest-contentful-paint'], entries => {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.updateMetric('largestContentfulPaint', lastEntry.startTime);
      }
    });

    observe(['first-input'], entries => {
      entries.forEach(entry => {
        const event = entry as EventTimingEntry;
        if (typeof event.processingStart === 'number') {
          this.updateMetric('firstInputDelay', event.processingStart - entry.startTime);
        }
      });
    });

    observe(['layout-shift'], entries => {
      let clsValue = 0;
      entries.forEach(entry => {
        const shift = entry as LayoutShiftEntry;
        if (!shift.hadRecentInput && typeof shift.value === 'number') {
          clsValue += shift.value;
        }
      });

      if (clsValue > 0) {
        this.updateMetric('cumulativeLayoutShift', parseFloat(clsValue.toFixed(3)));
      }
    });

    observe(['longtask'], entries => {
      const totalBlockingTime = entries.reduce((sum, entry) => {
        const blocking = entry.duration - 50;
        return blocking > 0 ? sum + blocking : sum;
      }, 0);

      if (totalBlockingTime > 0) {
        const current = this.metrics.totalBlockingTime ?? 0;
        this.updateMetric('totalBlockingTime', current + totalBlockingTime);
      }
    });

    observe(['paint'], entries => {
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.updateMetric('firstContentfulPaint', entry.startTime);
        }
      });
    });

    observe(['navigation'], entries => {
      const navEntry = entries[entries.length - 1] as
        | (NavigationTimingEntry & { domInteractive?: number })
        | undefined;
      if (!navEntry) {
        return;
      }

      if (typeof navEntry.firstContentfulPaint === 'number') {
        this.updateMetric('firstContentfulPaint', navEntry.firstContentfulPaint);
      }

      const interactive = navEntry.domInteractive;
      if (typeof interactive === 'number') {
        this.updateMetric('timeToInteractive', interactive);
      }
    });

    observe(['resource'], entries => {
      const resourceEntries = entries as Array<ObserverEntry & { transferSize?: number }>;
      const count = resourceEntries.length;
      if (count > 0) {
        this.updateMetric('resourceCount', count);
        const totalSize = resourceEntries.reduce(
          (sum, entry) => sum + (entry.transferSize ?? 0),
          0,
        );
        this.updateMetric('resourceSize', totalSize);
      }
    });
  }

  private startFrameMonitoring(): void {
    if (this.frameId !== null || typeof window === 'undefined') {
      return;
    }

    const trackFrame = (timestamp: number) => {
      if (!this.optimizationsEnabled) {
        this.lastFrameTime = timestamp;
        this.frameId = scheduleFrame(trackFrame);
        return;
      }

      if (this.lastFrameTime !== 0) {
        const duration = timestamp - this.lastFrameTime;
        this.frameDurations.push(duration);
        if (this.frameDurations.length > 180) {
          this.frameDurations.shift();
        }
        this.updateMetric('frameDuration', [...this.frameDurations]);
      }

      this.lastFrameTime = timestamp;
      this.frameId = scheduleFrame(trackFrame);
    };

    this.frameId = scheduleFrame(trackFrame);
  }

  private setupMemoryMonitoring(): void {
    if (this.memoryIntervalId !== null) {
      return;
    }

    const perf = getPerformanceGlobal();
    if (!perf || !perf.memory) {
      return;
    }

    this.memoryIntervalId = setInterval(() => {
      if (!this.optimizationsEnabled) {
        return;
      }

      const memory = perf.memory!;
      this.updateMetric('memoryUsage', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      });
    }, 10000);
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
export { PerformanceMonitor };
export type { PerformanceThresholds };

interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

interface PendingCall<Fn extends (...args: unknown[]) => unknown> {
  context: ThisParameterType<Fn>;
  args: Parameters<Fn>;
}

function getFunctionLabel(fn: (...args: unknown[]) => unknown): string {
  return fn.name || 'anonymous';
}

// Debounce utility with performance tracking
export function debounce<Fn extends (...args: unknown[]) => unknown>(
  fn: Fn,
  delay = 0,
  options: DebounceOptions = {},
): DebouncedFunction<Fn> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  let pendingCall: PendingCall<Fn> | null = null;
  let result: ReturnType<Fn> | undefined;

  const { leading = false, trailing = true, maxWait } = options;
  const label = `debounced-${getFunctionLabel(fn)}`;

  const startTimer = (wait: number): void => {
    timeoutId = setTimeout(timerExpired, wait);
  };

  const clearTimers = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = null;
    }
  };

  const invoke = (time: number): ReturnType<Fn> | undefined => {
    if (!pendingCall) {
      return result;
    }

    const call = pendingCall;
    pendingCall = null;
    lastInvokeTime = time;

    result = performanceMonitor.measureInteraction(
      label,
      () => fn.apply(call.context, call.args) as ReturnType<Fn>,
    );

    return result;
  };

  const leadingEdge = (time: number): ReturnType<Fn> | undefined => {
    lastInvokeTime = time;
    startTimer(delay);
    return leading ? invoke(time) : result;
  };

  const remainingWait = (time: number): number => {
    if (lastCallTime === null) {
      return delay;
    }

    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    if (maxWait === undefined) {
      return timeWaiting;
    }

    return Math.min(timeWaiting, maxWait - timeSinceLastInvoke);
  };

  const shouldInvoke = (time: number): boolean => {
    if (lastCallTime === null) {
      return true;
    }

    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const timerExpired = (): void => {
    const currentTime = now();
    if (shouldInvoke(currentTime)) {
      trailingEdge(currentTime);
      return;
    }

    startTimer(remainingWait(currentTime));
  };

  const trailingEdge = (time: number): ReturnType<Fn> | undefined => {
    timeoutId = null;

    if (trailing && pendingCall) {
      return invoke(time);
    }

    pendingCall = null;
    return result;
  };

  const cancel = (): void => {
    clearTimers();
    lastCallTime = null;
    lastInvokeTime = 0;
    pendingCall = null;
    result = undefined;
  };

  const flush = (): ReturnType<Fn> | undefined => {
    if (timeoutId === null) {
      return result;
    }
    return trailingEdge(now());
  };

  const pending = (): boolean => timeoutId !== null;

  const debounced = function (this: ThisParameterType<Fn>, ...args: Parameters<Fn>) {
    const currentTime = now();
    const isInvoking = shouldInvoke(currentTime);

    pendingCall = { context: this, args };
    lastCallTime = currentTime;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(currentTime);
      }
      if (maxWait !== undefined) {
        if (maxTimeoutId !== null) {
          clearTimeout(maxTimeoutId);
        }
        const remainingMaxWait = Math.max(0, (maxWait ?? 0) - (currentTime - lastInvokeTime));
        maxTimeoutId = setTimeout(() => {
          if (pendingCall) {
            trailingEdge(now());
          }
        }, remainingMaxWait);
        return invoke(currentTime);
      }
    }

    if (timeoutId === null) {
      startTimer(delay);
    }

    if (maxWait !== undefined && maxTimeoutId === null) {
      maxTimeoutId = setTimeout(() => {
        if (pendingCall) {
          trailingEdge(now());
        }
      }, maxWait);
    }

    return result;
  } as DebouncedFunction<Fn>;

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

// Throttle utility with performance tracking
export function throttle<Fn extends (...args: unknown[]) => unknown>(
  fn: Fn,
  limit: number,
  options: ThrottleOptions = {},
): ThrottledFunction<Fn> {
  const { leading = true, trailing = true } = options;
  const label = `throttled-${getFunctionLabel(fn)}`;

  let throttling = false;
  let trailingCall: PendingCall<Fn> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let result: ReturnType<Fn> | undefined;

  const clearTimer = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const invoke = (call: PendingCall<Fn>): ReturnType<Fn> | undefined => {
    result = performanceMonitor.measureInteraction(
      label,
      () => fn.apply(call.context, call.args) as ReturnType<Fn>,
    );
    return result;
  };

  const trailingInvoke = (): void => {
    throttling = false;
    clearTimer();
    if (trailing && trailingCall) {
      const call = trailingCall;
      trailingCall = null;
      invoke(call);
    } else {
      trailingCall = null;
    }
  };

  const throttled = function (this: ThisParameterType<Fn>, ...args: Parameters<Fn>) {
    const call: PendingCall<Fn> = { context: this, args };

    if (!throttling) {
      throttling = true;
      if (leading) {
        invoke(call);
      } else {
        trailingCall = call;
      }

      clearTimer();
      timeoutId = setTimeout(trailingInvoke, limit);
    } else if (trailing) {
      trailingCall = call;
    }

    return result;
  } as ThrottledFunction<Fn>;

  throttled.cancel = () => {
    throttling = false;
    trailingCall = null;
    clearTimer();
    result = undefined;
  };

  throttled.pending = () => throttling;

  return throttled;
}

// Memoization with performance tracking
export function memoize<Fn extends (...args: unknown[]) => unknown>(
  fn: Fn,
  getKey?: (...args: Parameters<Fn>) => string,
): MemoizedFunction<Fn> {
  const cache = new Map<string, ReturnType<Fn>>();

  const memoized = (...args: Parameters<Fn>): ReturnType<Fn> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const start = now();
    const value = fn(...args) as ReturnType<Fn>;
    const duration = now() - start;

    if (duration > 10) {
      // // console.warn(`Slow memoized function "${fn.name}": ${duration.toFixed(2)}ms`);
    }

    cache.set(key, value);

    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return value;
  };

  const memoizedWithMeta = memoized as MemoizedFunction<Fn>;

  memoizedWithMeta.cache = cache;
  memoizedWithMeta.clear = () => cache.clear();

  return memoizedWithMeta;
}

// Virtual scrolling utility for large lists
export class VirtualScrollManager {
  private itemHeight: number;
  private containerHeight: number;
  private totalItems: number;
  private scrollTop = 0;
  private overscan = 3;

  constructor(itemHeight: number, containerHeight: number, totalItems: number) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.totalItems = totalItems;
  }

  updateScroll(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }

  getVisibleRange(): { start: number; end: number } {
    const start = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.overscan);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const end = Math.min(this.totalItems - 1, start + visibleCount + this.overscan * 2);

    return { start, end };
  }

  getItemTop(index: number): number {
    return index * this.itemHeight;
  }

  getTotalHeight(): number {
    return this.totalItems * this.itemHeight;
  }
}

// Resource loading optimization
export class ResourceOptimizer {
  private static preloadedResources = new Set<string>();
  private static imagePromises = new Map<string, Promise<HTMLImageElement>>();
  private static scriptPromises = new Map<string, Promise<void>>();

  static preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve(new Image());
    }

    const existing = this.imagePromises.get(src);
    if (existing) {
      return existing;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedResources.add(src);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });

    this.imagePromises.set(src, promise);
    return promise;
  }

  static preloadScript(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    const existing = this.scriptPromises.get(src);
    if (existing) {
      return existing;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      script.onerror = reject;
      script.src = src;
      document.head.appendChild(script);
    });

    this.scriptPromises.set(src, promise);
    return promise;
  }

  static optimizeImages(): void {
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      images.forEach(img => {
        const htmlImg = img as HTMLImageElement;
        const src = htmlImg.dataset.src;
        if (src) {
          htmlImg.src = src;
          htmlImg.removeAttribute('data-src');
        }
      });
    }
  }
}

// React hooks for performance
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({});

  React.useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    setMetrics(performanceMonitor.getMetrics());
    return unsubscribe;
  }, []);

  return metrics;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useVirtualScroll(
  itemHeight: number,
  items: unknown[],
  containerRef: React.RefObject<HTMLElement>,
) {
  const [containerHeight, setContainerHeight] = React.useState(0);

  const virtualScrollManager = React.useMemo(
    () => new VirtualScrollManager(itemHeight, containerHeight, items.length),
    [itemHeight, containerHeight, items.length],
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    const handleScroll = () => {
      virtualScrollManager.updateScroll(container.scrollTop);
    };

    updateHeight();
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateHeight);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeight);
    };
  }, [containerRef, virtualScrollManager]);

  const visibleRange = virtualScrollManager.getVisibleRange();
  const visibleItems = items.slice(visibleRange.start, visibleRange.end + 1);

  return {
    visibleItems,
    totalHeight: virtualScrollManager.getTotalHeight(),
    offsetY: virtualScrollManager.getItemTop(visibleRange.start),
    visibleRange,
  };
}
