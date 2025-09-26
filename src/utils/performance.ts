/**
 * Performance Optimization Utilities for Astral Turf
 * 
 * Comprehensive performance monitoring, optimization, and debugging tools
 * for achieving perfect 60fps and sub-100ms interaction responses.
 */

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

// Performance monitoring class
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {};
  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private frameId: number | null = null;
  private lastFrameTime = 0;
  private frameDurations: number[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    this.setupPerformanceObservers();
    this.startFrameMonitoring();
    this.setupMemoryMonitoring();
  }

  private setupPerformanceObservers(): void {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.updateMetric('largestContentfulPaint', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (_e) {
        // // console.warn('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: unknown) => {
            this.updateMetric('firstInputDelay', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (_e) {
        // // console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry: unknown) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.updateMetric('cumulativeLayoutShift', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (_e) {
        // // console.warn('CLS observer not supported');
      }

      // Long Tasks (for TTI calculation)
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          let totalBlockingTime = this.metrics.totalBlockingTime || 0;
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              totalBlockingTime += entry.duration - 50;
            }
          });
          this.updateMetric('totalBlockingTime', totalBlockingTime);
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (_e) {
        // // console.warn('Long task observer not supported');
      }

      // Navigation timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: unknown) => {
            this.updateMetric('firstContentfulPaint', entry.firstContentfulPaint);
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (_e) {
        // // console.warn('Navigation observer not supported');
      }
    }
  }

  private startFrameMonitoring(): void {
    const measureFrame = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const frameDuration = timestamp - this.lastFrameTime;
        this.frameDurations.push(frameDuration);
        
        // Keep only last 100 frames
        if (this.frameDurations.length > 100) {
          this.frameDurations.shift();
        }
        
        this.updateMetric('frameDuration', [...this.frameDurations]);
      }
      
      this.lastFrameTime = timestamp;
      this.frameId = requestAnimationFrame(measureFrame);
    };

    this.frameId = requestAnimationFrame(measureFrame);
  }

  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.updateMetric('memoryUsage', {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }, 5000); // Every 5 seconds
    }
  }

  private updateMetric(key: keyof PerformanceMetrics, value: unknown): void {
    this.metrics[key] = value;
    this.notifyObservers();
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.metrics));
  }

  // Public API
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  measureInteraction(name: string, fn: () => void): void {
    const start = performance.now();
    fn();
    requestAnimationFrame(() => {
      const duration = performance.now() - start;
      const currentLatency = this.metrics.inputLatency || [];
      currentLatency.push(duration);
      
      // Keep only last 50 measurements
      if (currentLatency.length > 50) {
        currentLatency.shift();
      }
      
      this.updateMetric('inputLatency', currentLatency);
      
      // Log slow interactions
      if (duration > 100) {
        // // console.warn(`Slow interaction "${name}": ${duration.toFixed(2)}ms`);
      }
    });
  }

  measureRender(name: string, fn: () => Promise<void> | void): Promise<void> {
    const start = performance.now();
    
    const finish = () => {
      const duration = performance.now() - start;
      const currentRenderTime = this.metrics.renderTime || [];
      currentRenderTime.push(duration);
      
      if (currentRenderTime.length > 50) {
        currentRenderTime.shift();
      }
      
      this.updateMetric('renderTime', currentRenderTime);
      
      if (duration > 16.67) { // More than one frame at 60fps
        // // console.warn(`Slow render "${name}": ${duration.toFixed(2)}ms`);
      }
    };

    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(finish);
    } else {
      finish();
      return Promise.resolve();
    }
  }

  getFPS(): number {
    if (this.frameDurations.length === 0) return 0;
    
    const avgFrameDuration = this.frameDurations.reduce((sum, duration) => sum + duration, 0) / this.frameDurations.length;
    return Math.round(1000 / avgFrameDuration);
  }

  getPerformanceScore(): number {
    const metrics = this.metrics;
    let score = 100;

    // LCP penalty (target: <2.5s)
    if (metrics.largestContentfulPaint) {
      if (metrics.largestContentfulPaint > 4000) score -= 30;
      else if (metrics.largestContentfulPaint > 2500) score -= 15;
    }

    // FID penalty (target: <100ms)
    if (metrics.firstInputDelay) {
      if (metrics.firstInputDelay > 300) score -= 25;
      else if (metrics.firstInputDelay > 100) score -= 10;
    }

    // CLS penalty (target: <0.1)
    if (metrics.cumulativeLayoutShift) {
      if (metrics.cumulativeLayoutShift > 0.25) score -= 20;
      else if (metrics.cumulativeLayoutShift > 0.1) score -= 10;
    }

    // FPS penalty (target: 60fps)
    const fps = this.getFPS();
    if (fps < 30) score -= 25;
    else if (fps < 50) score -= 15;
    else if (fps < 60) score -= 5;

    return Math.max(0, score);
  }

  cleanup(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Debounce utility with performance tracking
export function debounce<T extends (...args: unknown[]) => any>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {}
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  
  const { leading = false, trailing = true, maxWait } = options;

  function invokeFunc(time: number) {
    const args = lastArgs;
    const thisArg = lastThis;
    
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    
    return performanceMonitor.measureInteraction(`debounced-${fn.name}`, () => {
      return fn.apply(thisArg, args);
    });
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timeoutId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = 0;
    lastThis = undefined;
    timeoutId = null;
    maxTimeoutId = null;
  }

  function flush() {
    return timeoutId === null ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timeoutId !== null;
  }

  let lastArgs: unknown;
  let lastThis: unknown;
  let result: unknown;

  function debounced(this: unknown, ...args: unknown[]) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        maxTimeoutId = setTimeout(timerExpired, maxWait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, delay);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced as T;
}

// Throttle utility with performance tracking
export function throttle<T extends (...args: unknown[]) => any>(
  fn: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  let inThrottle = false;
  let lastArgs: unknown;
  let lastThis: unknown;
  
  const { leading = true, trailing = true } = options;

  function throttled(this: unknown, ...args: unknown[]) {
    if (!inThrottle) {
      if (leading) {
        performanceMonitor.measureInteraction(`throttled-${fn.name}`, () => {
          fn.apply(this, args);
        });
      }
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (trailing && lastArgs) {
          performanceMonitor.measureInteraction(`throttled-${fn.name}`, () => {
            fn.apply(lastThis, lastArgs);
          });
          lastArgs = null;
          lastThis = null;
        }
      }, limit);
    } else if (trailing) {
      lastArgs = args;
      lastThis = this;
    }
  }

  return throttled as T;
}

// Memoization with performance tracking
export function memoize<T extends (...args: unknown[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T & { cache: Map<string, ReturnType<T>>; clear: () => void } {
  const cache = new Map<string, ReturnType<T>>();
  
  function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const start = performance.now();
    const result = fn(...args);
    const duration = performance.now() - start;

    if (duration > 10) {
      // // console.warn(`Slow memoized function "${fn.name}": ${duration.toFixed(2)}ms`);
    }

    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }

  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized as T & { cache: Map<string, ReturnType<T>>; clear: () => void };
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
  private static loadedResources = new Map<string, Promise<unknown>>();

  static preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve(new Image());
    }

    if (this.loadedResources.has(src)) {
      return this.loadedResources.get(src)!;
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

    this.loadedResources.set(src, promise);
    return promise;
  }

  static preloadScript(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    if (this.loadedResources.has(src)) {
      return this.loadedResources.get(src)!;
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

    this.loadedResources.set(src, promise);
    return promise;
  }

  static optimizeImages(): void {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
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

      images.forEach((img) => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      images.forEach((img) => {
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
  containerRef: React.RefObject<HTMLElement>
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);

  const virtualScrollManager = React.useMemo(
    () => new VirtualScrollManager(itemHeight, containerHeight, items.length),
    [itemHeight, containerHeight, items.length]
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
      virtualScrollManager.updateScroll(container.scrollTop);
    };

    updateHeight();
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateHeight);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeight);
    };
  }, [virtualScrollManager]);

  const visibleRange = virtualScrollManager.getVisibleRange();
  const visibleItems = items.slice(visibleRange.start, visibleRange.end + 1);

  return {
    visibleItems,
    totalHeight: virtualScrollManager.getTotalHeight(),
    offsetY: virtualScrollManager.getItemTop(visibleRange.start),
    visibleRange,
  };
}