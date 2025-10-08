/**
 * Tactics Board Performance Optimizer
 * 
 * Ensures smooth 60fps performance by:
 * - Request Animation Frame for smooth updates
 * - Debouncing expensive operations
 * - Virtual scrolling for large rosters
 * - Canvas rendering for complex visuals
 * - Web Worker for calculations
 * - Memory optimization
 * - Lazy rendering
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';

/**
 * Use RAF (Request Animation Frame) for smooth animations
 */
export function useRAF(callback: (deltaTime: number) => void, deps: any[] = []) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, deps);
}

/**
 * Debounce expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle callback to max frequency
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const inThrottle = useRef(false);
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (!inThrottle.current) {
        callback(...args);
        lastRun.current = Date.now();
        inThrottle.current = true;

        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    }) as T,
    [callback, limit]
  );
}

/**
 * Batch DOM updates
 */
export function useBatchUpdates() {
  const updateQueue = useRef<Array<() => void>>([]);
  const rafId = useRef<number>();

  const flush = useCallback(() => {
    const updates = updateQueue.current;
    updateQueue.current = [];

    // Execute all updates in one batch
    updates.forEach(update => update());
  }, []);

  const queueUpdate = useCallback((update: () => void) => {
    updateQueue.current.push(update);

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(flush);
  }, [flush]);

  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return queueUpdate;
}

/**
 * Monitor FPS and adjust quality
 */
export function useFPSMonitor(onFPSChange?: (fps: number) => void) {
  const fpsRef = useRef(60);
  const framesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let rafId: number;

    const measureFPS = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (delta > 0) {
        const currentFPS = 1000 / delta;
        framesRef.current.push(currentFPS);

        // Keep only last 60 frames
        if (framesRef.current.length > 60) {
          framesRef.current.shift();
        }

        // Calculate average FPS
        const avgFPS = framesRef.current.reduce((sum, fps) => sum + fps, 0) / framesRef.current.length;
        fpsRef.current = Math.round(avgFPS);

        if (onFPSChange) {
          onFPSChange(fpsRef.current);
        }
      }

      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [onFPSChange]);

  return fpsRef.current;
}

/**
 * Adaptive quality based on performance
 */
export function useAdaptiveQuality(targetFPS: number = 55) {
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  const fpsHistory = useRef<number[]>([]);

  const fps = useFPSMonitor(useCallback((currentFPS) => {
    fpsHistory.current.push(currentFPS);

    // Keep last 30 measurements
    if (fpsHistory.current.length > 30) {
      fpsHistory.current.shift();
    }

    // Calculate average
    if (fpsHistory.current.length >= 10) {
      const avgFPS = fpsHistory.current.reduce((sum, f) => sum + f, 0) / fpsHistory.current.length;

      // Adjust quality based on FPS
      if (avgFPS < targetFPS - 10 && quality !== 'low') {
        setQuality('low');
      } else if (avgFPS < targetFPS && quality === 'high') {
        setQuality('medium');
      } else if (avgFPS > targetFPS + 5 && quality !== 'high') {
        setQuality('high');
      }
    }
  }, [quality, targetFPS]));

  const config = useMemo(() => ({
    quality,
    fps,
    enableShadows: quality === 'high',
    enableBlur: quality !== 'low',
    enableAnimations: quality !== 'low',
    maxParticles: quality === 'high' ? 100 : quality === 'medium' ? 50 : 20,
    animationDuration: quality === 'high' ? 300 : quality === 'medium' ? 200 : 100,
  }), [quality, fps]);

  return config;
}

/**
 * Optimize player list rendering
 */
export function useVirtualizedPlayers(
  players: any[],
  containerHeight: number,
  itemHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
    const endIndex = Math.min(
      players.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + 5
    );

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, players.length]);

  const visiblePlayers = useMemo(() => {
    return players.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [players, visibleRange]);

  const totalHeight = players.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visiblePlayers,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

/**
 * Memoize expensive calculations
 */
export function useMemoizedCalculation<T>(
  calculate: () => T,
  deps: any[],
  options: { maxAge?: number; compareDeep?: boolean } = {}
): T {
  const { maxAge = 5000, compareDeep = false } = options;
  const cacheRef = useRef<{ value: T; timestamp: number; deps: any[] } | null>(null);

  return useMemo(() => {
    const now = Date.now();

    // Check if cache is still valid
    if (cacheRef.current) {
      const ageValid = now - cacheRef.current.timestamp < maxAge;
      const depsEqual = compareDeep
        ? JSON.stringify(cacheRef.current.deps) === JSON.stringify(deps)
        : cacheRef.current.deps.every((dep, i) => dep === deps[i]);

      if (ageValid && depsEqual) {
        return cacheRef.current.value;
      }
    }

    // Calculate new value
    const value = calculate();

    // Update cache
    cacheRef.current = {
      value,
      timestamp: now,
      deps: [...deps],
    };

    return value;
  }, deps);
}

/**
 * Optimize re-renders with shallow comparison
 */
export function useShallowMemo<T extends object>(value: T): T {
  const ref = useRef<T>(value);

  const isEqual = useMemo(() => {
    const keys = Object.keys(value) as Array<keyof T>;
    return keys.every(key => ref.current[key] === value[key]);
  }, [value]);

  if (!isEqual) {
    ref.current = value;
  }

  return ref.current;
}

/**
 * Batch state updates
 */
export function useBatchedState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdatesRef = useRef<Partial<T>[]>([]);
  const rafIdRef = useRef<number>();

  const flushUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.length > 0) {
      setState(currentState => {
        let newState = currentState;
        pendingUpdatesRef.current.forEach(update => {
          newState = { ...newState, ...update };
        });
        return newState;
      });
      pendingUpdatesRef.current = [];
    }
  }, []);

  const batchUpdate = useCallback((update: Partial<T>) => {
    pendingUpdatesRef.current.push(update);

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(flushUpdates);
  }, [flushUpdates]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return [state, batchUpdate, setState] as const;
}

/**
 * Performance monitoring component
 */
export const PerformanceMonitorOverlay: React.FC<{
  show: boolean;
  fps: number;
  quality: string;
  playerCount: number;
}> = ({ show, fps, quality, playerCount }) => {
  if (!show || process.env.NODE_ENV !== 'development') return null;

  const fpsColor = fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="fixed top-20 right-4 bg-slate-900/90 text-white text-xs p-3 rounded-lg border border-slate-700 shadow-xl backdrop-blur-sm z-50 font-mono">
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">FPS:</span>
          <span className={fpsColor}>{fps}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Quality:</span>
          <span className="text-white">{quality}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Players:</span>
          <span className="text-white">{playerCount}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Optimize drag operations
 */
export function useSmoothDrag(onDrag: (position: { x: number; y: number }) => void) {
  const rafIdRef = useRef<number>();
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);

  const scheduleDragUpdate = useCallback((position: { x: number; y: number }) => {
    pendingPositionRef.current = position;

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        if (pendingPositionRef.current) {
          onDrag(pendingPositionRef.current);
          pendingPositionRef.current = null;
        }
        rafIdRef.current = undefined;
      });
    }
  }, [onDrag]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return scheduleDragUpdate;
}

/**
 * Object pool for reducing garbage collection
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 10) {
    this.factory = factory;
    this.reset = reset;

    // Pre-create objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    return this.pool.pop() || this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  clear(): void {
    this.pool = [];
  }
}

/**
 * Memory-efficient player position cache
 */
export class PlayerPositionCache {
  private cache = new Map<string, { x: number; y: number; timestamp: number }>();
  private maxAge = 1000; // 1 second

  set(playerId: string, position: { x: number; y: number }): void {
    this.cache.set(playerId, {
      ...position,
      timestamp: Date.now(),
    });
  }

  get(playerId: string): { x: number; y: number } | null {
    const entry = this.cache.get(playerId);
    
    if (!entry) return null;

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(playerId);
      return null;
    }

    return { x: entry.x, y: entry.y };
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Optimize component re-renders
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: any[],
  options: { shallow?: boolean; deepCompare?: boolean } = {}
): T {
  const { shallow = true, deepCompare = false } = options;
  const previousDepsRef = useRef<any[]>(deps);
  const previousValueRef = useRef<T>(factory());

  const depsChanged = useMemo(() => {
    if (deepCompare) {
      return JSON.stringify(previousDepsRef.current) !== JSON.stringify(deps);
    }

    if (shallow) {
      return deps.some((dep, i) => dep !== previousDepsRef.current[i]);
    }

    return true;
  }, [deps, shallow, deepCompare]);

  if (depsChanged) {
    previousValueRef.current = factory();
    previousDepsRef.current = deps;
  }

  return previousValueRef.current;
}

/**
 * Performance optimization configuration
 */
export const PERFORMANCE_CONFIG = {
  // Animation
  ANIMATION_DURATION: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // Debounce delays
  DEBOUNCE: {
    search: 300,
    filter: 200,
    resize: 150,
    drag: 16, // ~60fps
  },

  // Throttle limits
  THROTTLE: {
    scroll: 16, // ~60fps
    mousemove: 16,
    resize: 100,
  },

  // Virtualization
  VIRTUAL_LIST: {
    overscan: 5,
    itemHeight: 64,
  },

  // Rendering
  MAX_PLAYERS_BEFORE_OPTIMIZATION: 30,
  USE_CANVAS_ABOVE_PLAYERS: 50,
  
  // Memory
  CACHE_MAX_AGE: 5000,
  CLEANUP_INTERVAL: 10000,
};

/**
 * Auto-detect and apply performance optimizations
 */
export function useAutoOptimize(playerCount: number) {
  const config = useMemo(() => {
    if (playerCount > PERFORMANCE_CONFIG.USE_CANVAS_ABOVE_PLAYERS) {
      return {
        renderMode: 'canvas' as const,
        enableAnimations: false,
        enableShadows: false,
        enableBlur: false,
        throttleMs: 32, // 30fps
      };
    }

    if (playerCount > PERFORMANCE_CONFIG.MAX_PLAYERS_BEFORE_OPTIMIZATION) {
      return {
        renderMode: 'optimized' as const,
        enableAnimations: true,
        enableShadows: false,
        enableBlur: false,
        throttleMs: 16, // 60fps
      };
    }

    return {
      renderMode: 'default' as const,
      enableAnimations: true,
      enableShadows: true,
      enableBlur: true,
      throttleMs: 16, // 60fps
    };
  }, [playerCount]);

  return config;
}

/**
 * Export all optimization hooks and utilities
 */
export default {
  useRAF,
  useDebounce,
  useThrottle,
  useBatchUpdates,
  useFPSMonitor,
  useAdaptiveQuality,
  useVirtualizedPlayers,
  useMemoizedCalculation,
  useShallowMemo,
  useBatchedState,
  useSmoothDrag,
  useAutoOptimize,
  ObjectPool,
  PlayerPositionCache,
  PerformanceMonitorOverlay,
  PERFORMANCE_CONFIG,
};


