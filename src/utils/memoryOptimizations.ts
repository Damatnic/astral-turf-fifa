/**
 * Catalyst Memory Management and Leak Prevention
 * Ultra-aggressive memory optimizations with real-time monitoring
 */

import { useEffect, useRef, useCallback, useState } from 'react';

type WindowInstance = typeof globalThis extends { window: infer T } ? T : typeof window;
type DocumentInstance = typeof globalThis extends { document: infer T } ? T : never;
type CacheStorageLike = {
  keys: () => Promise<string[]>;
  delete: (name: string) => Promise<boolean>;
};

type MemoryEventListener = (...args: unknown[]) => void;

const getWindow = (): WindowInstance | undefined =>
  typeof window === 'undefined' ? undefined : (window as WindowInstance);

const getDocument = (): DocumentInstance | undefined =>
  typeof document === 'undefined' ? undefined : (document as DocumentInstance);

const getPerformance = () => getWindow()?.performance;

type TimeoutHandle = ReturnType<typeof setTimeout>;
type IntervalHandle = ReturnType<typeof setInterval>;

const scheduleTimeout = (callback: () => void, delayMs: number): TimeoutHandle => {
  const win = getWindow();
  if (win?.setTimeout) {
    return win.setTimeout(callback, delayMs) as unknown as TimeoutHandle;
  }
  return setTimeout(callback, delayMs);
};

const clearScheduledTimeout = (handle: TimeoutHandle | null | undefined) => {
  if (!handle) {
    return;
  }

  const win = getWindow();
  if (win?.clearTimeout) {
    win.clearTimeout(handle as unknown as number);
    return;
  }

  clearTimeout(handle);
};

const scheduleInterval = (callback: () => void, intervalMs: number): IntervalHandle => {
  const win = getWindow();
  if (win?.setInterval) {
    return win.setInterval(callback, intervalMs) as unknown as IntervalHandle;
  }
  return setInterval(callback, intervalMs);
};

const clearScheduledInterval = (handle: IntervalHandle | null | undefined) => {
  if (!handle) {
    return;
  }

  const win = getWindow();
  if (win?.clearInterval) {
    win.clearInterval(handle as unknown as number);
    return;
  }

  clearInterval(handle);
};

type MemoryEventSeverity = 'info' | 'warning' | 'error';

type MemoryEventDetail = {
  message: string;
  severity: MemoryEventSeverity;
  timestamp: number;
} & Record<string, unknown>;

export type MemoryPressureLevel = 'low' | 'medium' | 'high' | 'critical';

const dispatchMemoryEvent = (type: string, detail: MemoryEventDetail) => {
  const win = getWindow();
  if (!win) {
    return;
  }

  try {
    if (typeof win.CustomEvent === 'function') {
      win.dispatchEvent(new win.CustomEvent(type, { detail }));
      return;
    }

    const doc = getDocument();
    if (doc && typeof doc.createEvent === 'function') {
      const event = doc.createEvent('CustomEvent');
      event.initCustomEvent(type, false, false, detail);
      win.dispatchEvent(event);
      return;
    }

    win.dispatchEvent(new win.Event(type));
  } catch {
    // Environment does not support custom events; ignore.
  }
};

const emitMemoryEvent = (
  severity: MemoryEventSeverity,
  message: string,
  context: Record<string, unknown> = {}
) => {
  dispatchMemoryEvent(`catalyst:memory-${severity}`, {
    message,
    severity,
    timestamp: Date.now(),
    ...context,
  });
};

const emitMemoryInfo = (message: string, context: Record<string, unknown> = {}) =>
  emitMemoryEvent('info', message, context);

const emitMemoryWarning = (message: string, context: Record<string, unknown> = {}) =>
  emitMemoryEvent('warning', message, context);

const emitMemoryError = (message: string, context: Record<string, unknown> = {}) =>
  emitMemoryEvent('error', message, context);

const serializeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
};

type PerformanceEntryLike = {
  name: string;
  duration?: number;
  entryType?: string;
};

type PerformanceObserverEntryListLike = {
  getEntries: () => PerformanceEntryLike[];
};

type PerformanceObserverLike = {
  observe: (options: { entryTypes: string[] }) => void;
  disconnect: () => void;
};

type PerformanceObserverConstructorLike = new (
  callback: (list: PerformanceObserverEntryListLike) => void
) => PerformanceObserverLike;

type PerformanceWithMemory = {
  memory?: MemoryInfo;
  mark?: (name: string) => void;
  measure?: (name: string, startMark?: string, endMark?: string) => void;
  clearMarks?: (name?: string) => void;
  clearMeasures?: (name?: string) => void;
};

type UserAgentSpecificMemoryBreakdown = {
  bytes?: number;
  types?: string[];
};

type UserAgentSpecificMemoryResult = {
  bytes?: number;
  breakdown?: UserAgentSpecificMemoryBreakdown[];
};

type PerformanceWithUserAgentMemory = PerformanceWithMemory & {
  measureUserAgentSpecificMemory?: () => Promise<UserAgentSpecificMemoryResult>;
};

// Memory performance thresholds
export const MEMORY_THRESHOLDS = {
  WARNING: 50 * 1024 * 1024, // 50MB
  CRITICAL: 100 * 1024 * 1024, // 100MB
  EMERGENCY: 200 * 1024 * 1024, // 200MB
  MAX_CACHE_SIZE: 25 * 1024 * 1024, // 25MB cache limit
  GC_INTERVAL: 30000, // 30 seconds
  CLEANUP_BATCH_SIZE: 50, // Objects per cleanup batch
} as const;

// Enhanced memory monitor with leak detection
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private observers: Set<(info: MemoryInfo) => void> = new Set();
  private cleanupTasks: Set<() => void> = new Set();
  private monitoringInterval: IntervalHandle | null = null;
  private emergencyGcHandle: TimeoutHandle | null = null;
  private leakDetector: LeakDetector;
  private performanceObserver: PerformanceObserverLike | null = null;
  private monitoringInitialized = false;
  private lastUserAgentMemorySample = 0;
  private userAgentSampleInFlight = false;
  private pressureHandlers: Record<MemoryPressureLevel, Set<() => void>> = {
    low: new Set(),
    medium: new Set(),
    high: new Set(),
    critical: new Set(),
  };
  private lastReportedPressure: MemoryPressureLevel | null = null;

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    MemoryMonitor.instance.ensureMonitoring();
    return MemoryMonitor.instance;
  }

  private constructor() {
    this.leakDetector = new LeakDetector();
    this.ensureMonitoring();
  }

  private ensureMonitoring() {
    if (this.monitoringInitialized) {
      return;
    }

    if (!getWindow()) {
      return;
    }

    this.startMonitoring();
    this.setupPerformanceObserver();
    this.monitoringInitialized = true;
  }

  private startMonitoring() {
    this.monitoringInterval = scheduleInterval(() => {
      const memoryInfo = this.getMemoryInfo();

      // Notify observers
      this.observers.forEach(observer => {
        try {
          observer(memoryInfo);
        } catch (error) {
          emitMemoryError('Memory observer execution failed', serializeError(error));
        }
      });

      // Trigger cleanup based on memory usage
      if (memoryInfo.usedJSHeapSize > MEMORY_THRESHOLDS.EMERGENCY) {
        this.performEmergencyCleanup();
      } else if (memoryInfo.usedJSHeapSize > MEMORY_THRESHOLDS.CRITICAL) {
        this.performAggressiveCleanup();
      } else if (memoryInfo.usedJSHeapSize > MEMORY_THRESHOLDS.WARNING) {
        this.performGentleCleanup();
      }

      // Check for memory leaks
      this.leakDetector.checkForLeaks();
      this.sampleUserAgentMemory();
      this.notifyPressureChange(memoryInfo);
    }, MEMORY_THRESHOLDS.GC_INTERVAL);

    this.notifyPressureChange(this.getMemoryInfo());
  }

  private setupPerformanceObserver() {
    const win = getWindow();
    const PerformanceObserverCtor = win?.PerformanceObserver as
      | PerformanceObserverConstructorLike
      | undefined;
    if (!PerformanceObserverCtor) {
      return;
    }

    this.performanceObserver = new PerformanceObserverCtor(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure' && entry.name.includes('memory')) {
          emitMemoryInfo('Memory performance measure recorded', {
            name: entry.name,
            duration: entry.duration ?? 0,
          });
        }
      }
    });

    try {
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    } catch (error) {
      emitMemoryWarning('Performance observer setup failed', serializeError(error));
    }
  }

  private sampleUserAgentMemory() {
    if (this.userAgentSampleInFlight) {
      return;
    }

    const perf = getPerformance() as PerformanceWithUserAgentMemory | undefined;
    const sampler = perf?.measureUserAgentSpecificMemory;
    if (!sampler || typeof sampler !== 'function') {
      return;
    }

    const now = Date.now();
    if (now - this.lastUserAgentMemorySample < MEMORY_THRESHOLDS.GC_INTERVAL) {
      return;
    }

    this.userAgentSampleInFlight = true;

    sampler
      .call(perf)
      .then(result => {
        this.lastUserAgentMemorySample = Date.now();

        if (!result) {
          return;
        }

        const { bytes, breakdown } = result;
        const summarizedBreakdown = Array.isArray(breakdown)
          ? breakdown.slice(0, 3).map(entry => ({
              bytes: entry?.bytes ?? 0,
              types: entry?.types ?? [],
            }))
          : undefined;

        emitMemoryInfo('User agent memory sample captured', {
          totalBytes: bytes ?? null,
          breakdown: summarizedBreakdown,
        });
      })
      .catch(error => {
        emitMemoryWarning('User agent memory sampling failed', serializeError(error));
      })
      .finally(() => {
        this.userAgentSampleInFlight = false;
      });
  }

  private getMemoryInfo(): MemoryInfo {
    const perf = getPerformance() as PerformanceWithMemory | undefined;
    if (perf?.memory) {
      return perf.memory;
    }

    // Fallback estimation
    return {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB estimate
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB estimate
      jsHeapSizeLimit: 500 * 1024 * 1024,
    };
  }

  private classifyMemoryPressure(info: MemoryInfo): MemoryPressureLevel {
    const limit = info.jsHeapSizeLimit || 0;
    if (limit <= 0) {
      return 'low';
    }

    const usageRatio = info.usedJSHeapSize / limit;
    if (!Number.isFinite(usageRatio) || usageRatio < 0) {
      return 'low';
    }

    if (usageRatio > 0.9) {
      return 'critical';
    }
    if (usageRatio > 0.7) {
      return 'high';
    }
    if (usageRatio > 0.5) {
      return 'medium';
    }
    return 'low';
  }

  private notifyPressureChange(info: MemoryInfo) {
    const pressure = this.classifyMemoryPressure(info);
    if (pressure === this.lastReportedPressure) {
      return;
    }

    this.lastReportedPressure = pressure;

    const severity: MemoryEventSeverity =
      pressure === 'critical' ? 'error' : pressure === 'high' ? 'warning' : 'info';

    emitMemoryEvent(severity, 'Memory pressure change detected', {
      level: pressure,
      memoryInfo: info,
    });

    dispatchMemoryEvent('catalyst:memory-pressure', {
      message: 'Memory pressure changed',
      severity,
      timestamp: Date.now(),
      level: pressure,
      memoryInfo: info,
    });

    const handlers = this.pressureHandlers[pressure];
    handlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        emitMemoryError('Memory pressure handler failed', serializeError(error));
      }
    });
  }

  private performGentleCleanup() {
    emitMemoryInfo('Catalyst gentle memory cleanup initiated', {
      cleanupType: 'gentle',
    });
    const perf = getPerformance() as PerformanceWithMemory | undefined;
    perf?.mark?.('memory-gentle-cleanup-start');

    // Clear old cache entries
    this.clearOldCacheEntries();

    // Run gentle cleanup tasks
    const tasks = Array.from(this.cleanupTasks).slice(0, MEMORY_THRESHOLDS.CLEANUP_BATCH_SIZE / 2);
    tasks.forEach(task => {
      try {
        task();
      } catch (error) {
        emitMemoryError('Gentle cleanup task failed', serializeError(error));
      }
    });

    perf?.mark?.('memory-gentle-cleanup-end');
    perf?.measure?.(
      'memory-gentle-cleanup',
      'memory-gentle-cleanup-start',
      'memory-gentle-cleanup-end'
    );
  }

  private performAggressiveCleanup() {
    emitMemoryWarning('Catalyst aggressive memory cleanup initiated', {
      cleanupType: 'aggressive',
    });
    const perf = getPerformance() as PerformanceWithMemory | undefined;
    perf?.mark?.('memory-aggressive-cleanup-start');

    // Clear most caches
    this.clearMostCaches();

    // Run more cleanup tasks
    const tasks = Array.from(this.cleanupTasks).slice(0, MEMORY_THRESHOLDS.CLEANUP_BATCH_SIZE);
    tasks.forEach(task => {
      try {
        task();
      } catch (error) {
        emitMemoryError('Aggressive cleanup task failed', serializeError(error));
      }
    });

    // Force garbage collection if available
    this.forceGarbageCollection();

    perf?.mark?.('memory-aggressive-cleanup-end');
    perf?.measure?.(
      'memory-aggressive-cleanup',
      'memory-aggressive-cleanup-start',
      'memory-aggressive-cleanup-end'
    );
  }

  private performEmergencyCleanup() {
    emitMemoryError('Catalyst emergency memory cleanup initiated due to critical usage', {
      cleanupType: 'emergency',
    });
    const perf = getPerformance() as PerformanceWithMemory | undefined;
    perf?.mark?.('memory-emergency-cleanup-start');

    // Clear all non-critical caches
    this.clearAllNonCriticalCaches();

    // Run all cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        emitMemoryError('Emergency cleanup task failed', serializeError(error));
      }
    });

    // Force multiple GC cycles
    this.forceGarbageCollection();
    clearScheduledTimeout(this.emergencyGcHandle);
    this.emergencyGcHandle = scheduleTimeout(() => this.forceGarbageCollection(), 100);

    // Emit emergency event
    dispatchMemoryEvent('catalyst:memory-emergency', {
      message: 'Catalyst emergency memory cleanup dispatched',
      severity: 'error',
      timestamp: Date.now(),
      memoryInfo: this.getMemoryInfo(),
      cleanupType: 'emergency',
    });

    perf?.mark?.('memory-emergency-cleanup-end');
    perf?.measure?.(
      'memory-emergency-cleanup',
      'memory-emergency-cleanup-start',
      'memory-emergency-cleanup-end'
    );
  }

  private clearOldCacheEntries() {
    const win = getWindow() as (WindowInstance & { caches?: CacheStorageLike }) | undefined;
    const cacheStorage = win?.caches;
    if (!cacheStorage) {
      return;
    }

    cacheStorage
      .keys()
      .then(names => {
        names.forEach(name => {
          if (name.includes('old-') || name.includes('temp-') || name.includes('expired-')) {
            cacheStorage.delete(name);
          }
        });
      })
      .catch(error => {
        emitMemoryWarning('Failed to clear old cache entries', serializeError(error));
      });
  }

  private clearMostCaches() {
    const win = getWindow() as (WindowInstance & { caches?: CacheStorageLike }) | undefined;
    const cacheStorage = win?.caches;
    if (!cacheStorage) {
      return;
    }

    cacheStorage
      .keys()
      .then(names => {
        // Keep only the 2 most recent caches
        names.slice(0, -2).forEach(name => {
          if (!name.includes('critical-')) {
            cacheStorage.delete(name);
          }
        });
      })
      .catch(error => {
        emitMemoryWarning('Failed to clear most caches', serializeError(error));
      });
  }

  private clearAllNonCriticalCaches() {
    const win = getWindow() as (WindowInstance & { caches?: CacheStorageLike }) | undefined;
    const cacheStorage = win?.caches;
    if (!cacheStorage) {
      return;
    }

    cacheStorage
      .keys()
      .then(names => {
        names.forEach(name => {
          if (!name.includes('critical-') && !name.includes('essential-')) {
            cacheStorage.delete(name);
          }
        });
      })
      .catch(error => {
        emitMemoryWarning('Failed to clear non-critical caches', serializeError(error));
      });
  }

  private forceGarbageCollection() {
    const win = getWindow();
    if (win && 'gc' in win) {
      (win as typeof win & { gc: () => void }).gc();
    } else {
      // Trigger GC through memory pressure
      try {
        const arr = new Array(1000000).fill(0);
        arr.length = 0;
      } catch {
        emitMemoryWarning('Memory pressure GC hint encountered an error during allocation');
      }
    }
  }

  subscribe(observer: (info: MemoryInfo) => void): () => void {
    this.ensureMonitoring();
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  registerCleanupTask(task: () => void): () => void {
    this.ensureMonitoring();
    this.cleanupTasks.add(task);
    return () => this.cleanupTasks.delete(task);
  }
  getCurrentMemoryInfo(): MemoryInfo {
    this.ensureMonitoring();
    return this.getMemoryInfo();
  }

  getMemoryPressure(): MemoryPressureLevel {
    const info = this.getMemoryInfo();
    const pressure = this.classifyMemoryPressure(info);
    this.lastReportedPressure = pressure;
    return pressure;
  }

  onMemoryPressure(level: MemoryPressureLevel, handler: () => void): () => void {
    this.ensureMonitoring();
    const handlers = this.pressureHandlers[level];
    handlers.add(handler);

    try {
      if (this.getMemoryPressure() === level) {
        handler();
      }
    } catch (error) {
      emitMemoryError('Memory pressure handler failed during registration', serializeError(error));
    }

    return () => {
      handlers.delete(handler);
    };
  }

  cleanup() {
    clearScheduledInterval(this.monitoringInterval);
    this.monitoringInterval = null;
    clearScheduledTimeout(this.emergencyGcHandle);
    this.emergencyGcHandle = null;

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    this.observers.clear();
    this.cleanupTasks.clear();
    this.leakDetector.cleanup();
    Object.values(this.pressureHandlers).forEach(set => set.clear());
    this.lastReportedPressure = null;
    this.monitoringInitialized = false;
  }
}

// Memory leak detection
class LeakDetector {
  private domNodeCount = 0;
  private eventListenerCount = 0;
  private observerCount = 0;
  private intervalCount = 0;
  private timeoutCount = 0;
  private checkInterval: IntervalHandle | null = null;

  constructor() {
    this.startDetection();
  }

  private startDetection() {
    if (!getWindow()) {
      return;
    }

    this.checkInterval = scheduleInterval(() => {
      this.detectLeaks();
    }, 60000); // Check every minute
  }

  private detectLeaks() {
    const doc = getDocument();
    if (!doc || typeof doc.querySelectorAll !== 'function') {
      return;
    }

    const currentDOMNodes = doc.querySelectorAll('*').length;
    const domNodeGrowth = currentDOMNodes - this.domNodeCount;

    if (domNodeGrowth > 100) {
      emitMemoryWarning('Potential DOM leak detected', {
        domNodeGrowth,
      });
    }

    this.domNodeCount = currentDOMNodes;

    // Detect orphaned objects
    this.detectOrphanedObjects();
  }

  private detectOrphanedObjects() {
    // Check for common leak patterns
    const win = getWindow() as
      | (WindowInstance & {
          __eventListeners?: Record<string, unknown>;
        })
      | undefined;
    if (!win) {
      return;
    }

    const possibleLeaks: string[] = [];

    // Check for orphaned event listeners
    if (win.__eventListeners) {
      const listenerCount = Object.keys(win.__eventListeners).length;
      if (listenerCount > this.eventListenerCount + 50) {
        possibleLeaks.push(`Event listeners: ${listenerCount - this.eventListenerCount} new`);
      }
      this.eventListenerCount = listenerCount;
    }

    if (possibleLeaks.length > 0) {
      emitMemoryWarning('Potential memory leaks detected', {
        possibleLeaks,
      });
    }
  }

  checkForLeaks() {
    this.detectLeaks();
  }

  cleanup() {
    clearScheduledInterval(this.checkInterval);
    this.checkInterval = null;
  }
}

// Smart cache with automatic cleanup
export class SmartCache<K, V> {
  private cache = new Map<K, V>();
  private accessTimes = new Map<K, number>();
  private maxSize: number;
  private ttl: number;
  private cleanupInterval: IntervalHandle | null = null;
  private cleanupUnregister: (() => void) | null = null;

  constructor(maxSize = 100, ttl = 300000) {
    // 5 minutes default TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.startCleanup();

    // Register with memory monitor
    const monitor = MemoryMonitor.getInstance();
    this.cleanupUnregister = monitor.registerCleanupTask(() => this.cleanup());
  }

  private startCleanup() {
    if (!getWindow()) {
      return;
    }

    this.cleanupInterval = scheduleInterval(() => {
      this.cleanupExpired();
    }, this.ttl / 2);
  }

  private cleanupExpired() {
    const now = Date.now();
    const expiredKeys: K[] = [];

    this.accessTimes.forEach((time, key) => {
      if (now - time > this.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.accessTimes.delete(key);
    });

    if (expiredKeys.length > 0) {
      emitMemoryInfo('SmartCache cleaned up expired entries', {
        expiredCount: expiredKeys.length,
      });
    }
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.accessTimes.set(key, Date.now());
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.findOldestKey();
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.accessTimes.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
    this.accessTimes.set(key, Date.now());
  }

  private findOldestKey(): K | undefined {
    let oldestKey: K | undefined;
    let oldestTime = Date.now();

    this.accessTimes.forEach((time, key) => {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    });

    return oldestKey;
  }

  cleanup() {
    this.cache.clear();
    this.accessTimes.clear();
  }

  destroy() {
    clearScheduledInterval(this.cleanupInterval);
    this.cleanupInterval = null;
    if (this.cleanupUnregister) {
      this.cleanupUnregister();
      this.cleanupUnregister = null;
    }
    this.cleanup();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.accessTimes.size > 0 ? this.cache.size / this.accessTimes.size : 0,
    };
  }
}

// Object pool for reducing garbage collection
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, reset: (obj: T) => void, maxSize = 50) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool = [];
  }

  getStats() {
    return {
      available: this.pool.length,
      maxSize: this.maxSize,
    };
  }
}

// React hooks for memory management
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [memoryPressure, setMemoryPressure] = useState<MemoryPressureLevel>('low');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const monitor = MemoryMonitor.getInstance();

    const updateMemoryInfo = (info: MemoryInfo) => {
      setMemoryInfo(info);
      setMemoryPressure(monitor.getMemoryPressure());
    };

    const unsubscribe = monitor.subscribe(updateMemoryInfo);

    // Get initial state
    updateMemoryInfo(monitor.getCurrentMemoryInfo());

    return unsubscribe;
  }, []);

  return { memoryInfo, memoryPressure };
}

export function useAutoCleanup(cleanupFn: () => void) {
  const cleanupRef = useRef(cleanupFn);

  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, [cleanupFn]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const monitor = MemoryMonitor.getInstance();
    const unregister = monitor.registerCleanupTask(() => cleanupRef.current());

    return () => {
      unregister();
      cleanupRef.current();
    };
  }, []);
}

export function useSmartCache<K, V>(maxSize = 100, ttl = 300000) {
  const cacheRef = useRef<SmartCache<K, V> | null>(null);

  if (!cacheRef.current) {
    cacheRef.current = new SmartCache<K, V>(maxSize, ttl);
  }

  useEffect(() => {
    return () => {
      if (cacheRef.current) {
        cacheRef.current.destroy();
        cacheRef.current = null;
      }
    };
  }, []);

  const get = useCallback((key: K) => {
    return cacheRef.current?.get(key);
  }, []);

  const set = useCallback((key: K, value: V) => {
    cacheRef.current?.set(key, value);
  }, []);

  const getStats = useCallback(() => {
    return cacheRef.current?.getStats() || { size: 0, maxSize: 0, hitRate: 0 };
  }, []);

  return { get, set, getStats };
}

export function useObjectPool<T>(factory: () => T, reset: (obj: T) => void, maxSize = 50) {
  const poolRef = useRef<ObjectPool<T> | null>(null);

  if (!poolRef.current) {
    poolRef.current = new ObjectPool(factory, reset, maxSize);
  }

  useEffect(() => {
    return () => {
      if (poolRef.current) {
        poolRef.current.clear();
      }
    };
  }, []);

  const acquire = useCallback(() => {
    return poolRef.current!.acquire();
  }, []);

  const release = useCallback((obj: T) => {
    poolRef.current!.release(obj);
  }, []);

  const getStats = useCallback(() => {
    return poolRef.current!.getStats();
  }, []);

  return { acquire, release, getStats };
}

export function useMemoryPressureResponder(
  handlers: Partial<Record<MemoryPressureLevel, () => void>>
) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const monitor = MemoryMonitor.getInstance();
    const unsubscribes: Array<() => void> = [];
    const levels: MemoryPressureLevel[] = ['low', 'medium', 'high', 'critical'];

    levels.forEach(level => {
      const handler = handlersRef.current[level];
      if (typeof handler === 'function') {
        const unsubscribe = monitor.onMemoryPressure(level, () => {
          const currentHandler = handlersRef.current[level];
          if (typeof currentHandler === 'function') {
            currentHandler();
          }
        });
        unsubscribes.push(unsubscribe);
      }
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);
}
// Memory-efficient event emitter
export class MemoryEfficientEventEmitter {
  private listeners = new Map<string, Set<MemoryEventListener>>();
  private maxListeners = 10;

  on(event: string, listener: MemoryEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const eventListeners = this.listeners.get(event)!;

    if (eventListeners.size >= this.maxListeners) {
      emitMemoryWarning('Too many listeners registered for event', {
        event,
        listenerCount: eventListeners.size,
      });
    }

    eventListeners.add(listener);

    // Return unsubscribe function
    return () => {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit(event: string, ...args: unknown[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          emitMemoryError(`Event listener error for '${event}'`, serializeError(error));
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  getListenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }

  getTotalListeners(): number {
    let total = 0;
    this.listeners.forEach(set => (total += set.size));
    return total;
  }
}

export type MemoryInfo = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};

export default {
  MemoryMonitor,
  SmartCache,
  ObjectPool,
  MemoryEfficientEventEmitter,
  useMemoryMonitor,
  useAutoCleanup,
  useSmartCache,
  useObjectPool,
  useMemoryPressureResponder,
  MEMORY_THRESHOLDS,
};
