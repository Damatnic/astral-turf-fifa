/**
 * Catalyst Memory Management and Leak Prevention
 * Ultra-aggressive memory optimizations with real-time monitoring
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';

// Memory performance thresholds
export const MEMORY_THRESHOLDS = {
  WARNING: 50 * 1024 * 1024,      // 50MB
  CRITICAL: 100 * 1024 * 1024,    // 100MB
  EMERGENCY: 200 * 1024 * 1024,   // 200MB
  MAX_CACHE_SIZE: 25 * 1024 * 1024, // 25MB cache limit
  GC_INTERVAL: 30000,             // 30 seconds
  CLEANUP_BATCH_SIZE: 50,         // Objects per cleanup batch
} as const;

// Enhanced memory monitor with leak detection
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private observers: Set<(info: MemoryInfo) => void> = new Set();
  private cleanupTasks: Set<() => void> = new Set();
  private monitoringInterval: number | null = null;
  private leakDetector: LeakDetector;
  private performanceObserver: PerformanceObserver | null = null;
  
  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }
  
  private constructor() {
    this.leakDetector = new LeakDetector();
    this.startMonitoring();
    this.setupPerformanceObserver();
  }
  
  private startMonitoring() {
    this.monitoringInterval = window.setInterval(() => {
      const memoryInfo = this.getMemoryInfo();
      
      // Notify observers
      this.observers.forEach(observer => {
        try {
          observer(memoryInfo);
        } catch (error) {
          console.error('Memory observer error:', error);
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
      
    }, MEMORY_THRESHOLDS.GC_INTERVAL);
  }
  
  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.includes('memory')) {
            console.log(`🧠 Memory operation: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      
      try {
        this.performanceObserver.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
      }
    }
  }
  
  private getMemoryInfo(): MemoryInfo {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    
    // Fallback estimation
    return {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB estimate
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB estimate
      jsHeapSizeLimit: 500 * 1024 * 1024  // 500MB estimate
    };
  }
  
  private performGentleCleanup() {
    console.log('🧹 Catalyst: Gentle memory cleanup initiated');
    performance.mark('memory-gentle-cleanup-start');
    
    // Clear old cache entries
    this.clearOldCacheEntries();
    
    // Run gentle cleanup tasks
    const tasks = Array.from(this.cleanupTasks).slice(0, MEMORY_THRESHOLDS.CLEANUP_BATCH_SIZE / 2);
    tasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Gentle cleanup task failed:', error);
      }
    });
    
    performance.mark('memory-gentle-cleanup-end');
    performance.measure('memory-gentle-cleanup', 'memory-gentle-cleanup-start', 'memory-gentle-cleanup-end');
  }
  
  private performAggressiveCleanup() {
    console.warn('🔥 Catalyst: Aggressive memory cleanup initiated');
    performance.mark('memory-aggressive-cleanup-start');
    
    // Clear most caches
    this.clearMostCaches();
    
    // Run more cleanup tasks
    const tasks = Array.from(this.cleanupTasks).slice(0, MEMORY_THRESHOLDS.CLEANUP_BATCH_SIZE);
    tasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Aggressive cleanup task failed:', error);
      }
    });
    
    // Force garbage collection if available
    this.forceGarbageCollection();
    
    performance.mark('memory-aggressive-cleanup-end');
    performance.measure('memory-aggressive-cleanup', 'memory-aggressive-cleanup-start', 'memory-aggressive-cleanup-end');
  }
  
  private performEmergencyCleanup() {
    console.error('🚨 Catalyst: EMERGENCY memory cleanup - Critical memory usage!');
    performance.mark('memory-emergency-cleanup-start');
    
    // Clear all non-critical caches
    this.clearAllNonCriticalCaches();
    
    // Run all cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Emergency cleanup task failed:', error);
      }
    });
    
    // Force multiple GC cycles
    this.forceGarbageCollection();
    setTimeout(() => this.forceGarbageCollection(), 100);
    
    // Emit emergency event
    window.dispatchEvent(new CustomEvent('catalyst:memory-emergency', {
      detail: { memoryInfo: this.getMemoryInfo() }
    }));
    
    performance.mark('memory-emergency-cleanup-end');
    performance.measure('memory-emergency-cleanup', 'memory-emergency-cleanup-start', 'memory-emergency-cleanup-end');
  }
  
  private clearOldCacheEntries() {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('old-') || name.includes('temp-') || name.includes('expired-')) {
            caches.delete(name);
          }
        });
      });
    }
  }
  
  private clearMostCaches() {
    if ('caches' in window) {
      caches.keys().then(names => {
        // Keep only the 2 most recent caches
        names.slice(0, -2).forEach(name => {
          if (!name.includes('critical-')) {
            caches.delete(name);
          }
        });
      });
    }
  }
  
  private clearAllNonCriticalCaches() {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (!name.includes('critical-') && !name.includes('essential-')) {
            caches.delete(name);
          }
        });
      });
    }
  }
  
  private forceGarbageCollection() {
    if ('gc' in window) {
      (window as any).gc();
    } else {
      // Trigger GC through memory pressure
      try {
        const arr = new Array(1000000).fill(0);
        arr.length = 0;
      } catch (error) {
        // Memory pressure applied
      }
    }
  }
  
  subscribe(observer: (info: MemoryInfo) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }
  
  registerCleanupTask(task: () => void): () => void {
    this.cleanupTasks.add(task);
    return () => this.cleanupTasks.delete(task);
  }
  
  getCurrentMemoryInfo(): MemoryInfo {
    return this.getMemoryInfo();
  }
  
  getMemoryPressure(): 'low' | 'medium' | 'high' | 'critical' {
    const info = this.getMemoryInfo();
    const usageRatio = info.usedJSHeapSize / info.jsHeapSizeLimit;
    
    if (usageRatio > 0.9) return 'critical';
    if (usageRatio > 0.7) return 'high';
    if (usageRatio > 0.5) return 'medium';
    return 'low';
  }
  
  cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    this.observers.clear();
    this.cleanupTasks.clear();
    this.leakDetector.cleanup();
  }
}

// Memory leak detection
class LeakDetector {
  private domNodeCount = 0;
  private eventListenerCount = 0;
  private observerCount = 0;
  private intervalCount = 0;
  private timeoutCount = 0;
  private checkInterval: number | null = null;
  
  constructor() {
    this.startDetection();
  }
  
  private startDetection() {
    this.checkInterval = window.setInterval(() => {
      this.detectLeaks();
    }, 60000); // Check every minute
  }
  
  private detectLeaks() {
    const currentDOMNodes = document.querySelectorAll('*').length;
    const domNodeGrowth = currentDOMNodes - this.domNodeCount;
    
    if (domNodeGrowth > 100) {
      console.warn(`🚨 Potential DOM leak detected: ${domNodeGrowth} new nodes`);
    }
    
    this.domNodeCount = currentDOMNodes;
    
    // Detect orphaned objects
    this.detectOrphanedObjects();
  }
  
  private detectOrphanedObjects() {
    // Check for common leak patterns
    const possibleLeaks = [];
    
    // Check for orphaned event listeners
    if ((window as any).__eventListeners) {
      const listenerCount = Object.keys((window as any).__eventListeners).length;
      if (listenerCount > this.eventListenerCount + 50) {
        possibleLeaks.push(`Event listeners: ${listenerCount - this.eventListenerCount} new`);
      }
      this.eventListenerCount = listenerCount;
    }
    
    if (possibleLeaks.length > 0) {
      console.warn('🚨 Potential memory leaks detected:', possibleLeaks);
    }
  }
  
  checkForLeaks() {
    this.detectLeaks();
  }
  
  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Smart cache with automatic cleanup
export class SmartCache<K, V> {
  private cache = new Map<K, V>();
  private accessTimes = new Map<K, number>();
  private maxSize: number;
  private ttl: number;
  private cleanupInterval: number | null = null;
  
  constructor(maxSize = 100, ttl = 300000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.startCleanup();
    
    // Register with memory monitor
    const monitor = MemoryMonitor.getInstance();
    monitor.registerCleanupTask(() => this.cleanup());
  }
  
  private startCleanup() {
    this.cleanupInterval = window.setInterval(() => {
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
      console.log(`🧹 SmartCache: Cleaned up ${expiredKeys.length} expired entries`);
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
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cleanup();
  }
  
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.accessTimes.size > 0 ? this.cache.size / this.accessTimes.size : 0
    };
  }
}

// Object pool for reducing garbage collection
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;
  
  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    maxSize = 50
  ) {
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
      maxSize: this.maxSize
    };
  }
}

// React hooks for memory management
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [memoryPressure, setMemoryPressure] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  
  useEffect(() => {
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

export function useAutoCleanup(cleanupFn: () => void, deps: React.DependencyList = []) {
  const cleanupRef = useRef(cleanupFn);
  cleanupRef.current = cleanupFn;
  
  useEffect(() => {
    const monitor = MemoryMonitor.getInstance();
    const unregister = monitor.registerCleanupTask(() => cleanupRef.current());
    
    return () => {
      unregister();
      cleanupRef.current();
    };
  }, deps);
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

export function useObjectPool<T>(
  factory: () => T,
  reset: (obj: T) => void,
  maxSize = 50
) {
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

// Memory-efficient event emitter
export class MemoryEfficientEventEmitter {
  private listeners = new Map<string, Set<Function>>();
  private maxListeners = 10;
  
  on(event: string, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const eventListeners = this.listeners.get(event)!;
    
    if (eventListeners.size >= this.maxListeners) {
      console.warn(`Memory warning: Too many listeners for event '${event}'`);
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
  
  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Event listener error for '${event}':`, error);
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
    this.listeners.forEach(set => total += set.size);
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
  MEMORY_THRESHOLDS
};
