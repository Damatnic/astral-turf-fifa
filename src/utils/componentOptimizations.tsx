/**
 * Catalyst Component Performance Optimizations
 * Ultra-aggressive React component optimizations for sub-millisecond response times
 */

import React, {
  memo,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
  ComponentType,
  PropsWithChildren,
  ReactElement,
  RefObject,
} from 'react';
import { shallowEqual } from './performanceOptimizations';

// Ultra-fast component memoization with custom comparison
export function createOptimizedMemo<P extends object>(
  Component: ComponentType<P>,
  customCompare?: (prev: P, next: P) => boolean
): ComponentType<P> {
  return memo(
    Component,
    customCompare ||
      ((prev, next) => {
        // Ultra-fast shallow comparison
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);

        if (prevKeys.length !== nextKeys.length) {
          return false;
        }

        for (let i = 0; i < prevKeys.length; i++) {
          const key = prevKeys[i] as keyof P;
          if (prev[key] !== next[key]) {
            return false;
          }
        }

        return true;
      })
  ) as unknown as ComponentType<P>;
}

// Optimized useMemo with dependency comparison optimization
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (a: T, b: T) => boolean
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T } | undefined>();

  // Fast dependency comparison
  const depsChanged =
    !ref.current ||
    ref.current.deps.length !== deps.length ||
    ref.current.deps.some((dep, i) => !Object.is(dep, deps[i]));

  if (depsChanged) {
    const newValue = factory();
    if (!ref.current || !isEqual || !isEqual(ref.current.value, newValue)) {
      ref.current = { deps: [...deps], value: newValue };
    }
  }

  return ref.current!.value;
}

// Ultra-optimized callback with stable reference
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const ref = useRef<T>(callback);
  ref.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => {
      return ref.current(...args);
    }) as T,
    []
  );
}

// Batch state updates for better performance
export function useBatchedState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const batchedUpdates = useRef<Array<(prev: T) => T>>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batchUpdate = useCallback((updater: (prev: T) => T) => {
    batchedUpdates.current.push(updater);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prev => {
        let result = prev;
        for (const update of batchedUpdates.current) {
          result = update(result);
        }
        batchedUpdates.current = [];
        return result;
      });
    }, 0);
  }, []);

  const immediateBatch = useCallback(() => {
    if (batchedUpdates.current.length > 0) {
      setState(prev => {
        let result = prev;
        for (const update of batchedUpdates.current) {
          result = update(result);
        }
        batchedUpdates.current = [];
        return result;
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, []);

  return [state, batchUpdate, immediateBatch] as const;
}

// Smart re-render prevention
export function useRenderPrevention() {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  const preventionActiveRef = useRef(false);

  useEffect(() => {
    renderCountRef.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;

    // If rendering too frequently, activate prevention
    if (timeSinceLastRender < 16) {
      // 60fps threshold
      preventionActiveRef.current = true;

      // Disable prevention after a short delay
      setTimeout(() => {
        preventionActiveRef.current = false;
      }, 100);
    }

    lastRenderTimeRef.current = now;
  });

  return {
    renderCount: renderCountRef.current,
    shouldPreventRender: preventionActiveRef.current,
    forceRender: () => {
      preventionActiveRef.current = false;
    },
  };
}

// Optimized event handler factory
class EventHandlerCache {
  private cache = new Map<string, (...args: any[]) => void>();

  getHandler<T extends (...args: any[]) => void>(key: string, factory: () => T): T {
    if (!this.cache.has(key)) {
      this.cache.set(key, factory());
    }
    return this.cache.get(key) as T;
  }

  clear() {
    this.cache.clear();
  }
}

const globalEventCache = new EventHandlerCache();

export function useOptimizedEventHandler<T extends (...args: any[]) => void>(
  key: string,
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(() => {
    const handlerKey = `${key}_${deps.join('_')}`;
    return globalEventCache.getHandler(handlerKey, factory);
  }, deps);
}

// Virtual list optimization for large datasets
export function useVirtualList<T>({
  items,
  containerHeight,
  itemHeight,
  overscan = 5,
  scrollTop = 0,
}: {
  items: T[];
  containerHeight: number;
  itemHeight: number;
  overscan?: number;
  scrollTop?: number;
}) {
  return useOptimizedMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan, items.length);
    const startIndexWithOverscan = Math.max(0, startIndex - overscan);

    const visibleItems = items.slice(startIndexWithOverscan, endIndex).map((item, index) => ({
      item,
      index: startIndexWithOverscan + index,
      top: (startIndexWithOverscan + index) * itemHeight,
    }));

    return {
      visibleItems,
      totalHeight: items.length * itemHeight,
      startIndex: startIndexWithOverscan,
      endIndex,
    };
  }, [items, containerHeight, itemHeight, overscan, scrollTop]);
}

// Optimized children rendering
export function useOptimizedChildren(children: React.ReactNode, key?: string): ReactElement[] {
  return useOptimizedMemo(() => {
    const childArray = React.Children.toArray(children) as ReactElement[];
    return key ? childArray.filter(child => child.key === key) : childArray;
  }, [children, key]);
}

// Performance-aware component wrapper
export function withPerformanceOptimizations<P extends object>(
  Component: ComponentType<P>,
  options: {
    memoize?: boolean;
    customCompare?: (prev: P, next: P) => boolean;
    enableVirtualization?: boolean;
    batchUpdates?: boolean;
  } = {}
) {
  const {
    memoize = true,
    customCompare,
    enableVirtualization = false,
    batchUpdates = false,
  } = options;

  let OptimizedComponent = Component;

  if (memoize) {
    OptimizedComponent = createOptimizedMemo(OptimizedComponent, customCompare);
  }

  return React.forwardRef<any, P>((props, ref) => {
    const { shouldPreventRender } = useRenderPrevention();

    if (shouldPreventRender && !(props as any).forceRender) {
      return null;
    }

    return React.createElement(OptimizedComponent, { ...props, ref } as any);
  });
}

// Intersection observer for viewport optimization
export function useIntersectionOptimization(
  ref: RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, hasIntersected, options.threshold, options.rootMargin]);

  return { isIntersecting, hasIntersected };
}

// Optimized list renderer with built-in virtualization
export function OptimizedList<T>({
  items,
  renderItem,
  containerHeight,
  itemHeight = 50,
  className = '',
  onScroll,
  enableVirtualization = true,
  keyExtractor = (item, index) => `item-${index}`,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactElement;
  containerHeight: number;
  itemHeight?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  enableVirtualization?: boolean;
  keyExtractor?: (item: T, index: number) => string;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useStableCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  });

  const virtualList = useVirtualList({
    items,
    containerHeight,
    itemHeight,
    scrollTop,
    overscan: 3,
  });

  if (!enableVirtualization || items.length < 50) {
    // Render all items for small lists
    return (
      <div
        ref={containerRef}
        className={`overflow-auto ${className}`}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <div key={keyExtractor(item, index)}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: virtualList.totalHeight, position: 'relative' }}>
        {virtualList.visibleItems.map(({ item, index, top }) => (
          <div
            key={keyExtractor(item, index)}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Optimized form component with batched updates
export function useOptimizedForm<T extends Record<string, any>>(initialValues: T) {
  const [values, updateValues, flushUpdates] = useBatchedState(initialValues);
  const errorsRef = useRef<Partial<Record<keyof T, string>>>({});

  const setValue = useStableCallback(<K extends keyof T>(name: K, value: T[K]) => {
    updateValues(prev => ({ ...prev, [name]: value }));
  });

  const setValues = useStableCallback((newValues: Partial<T>) => {
    updateValues(prev => ({ ...prev, ...newValues }));
  });

  const setError = useStableCallback(<K extends keyof T>(name: K, error: string) => {
    errorsRef.current = { ...errorsRef.current, [name]: error };
  });

  const clearError = useStableCallback(<K extends keyof T>(name: K) => {
    const newErrors = { ...errorsRef.current };
    delete newErrors[name];
    errorsRef.current = newErrors;
  });

  return {
    values,
    errors: errorsRef.current,
    setValue,
    setValues,
    setError,
    clearError,
    flush: flushUpdates,
    reset: () => updateValues(() => initialValues),
  };
}

// Component performance profiler
export function withPerformanceProfiler<P extends object>(
  Component: ComponentType<P>,
  componentName: string
) {
  return React.forwardRef<any, P>((props, ref) => {
    const renderStartTime = useRef<number>(0);
    const renderCount = useRef<number>(0);

    useEffect(() => {
      renderStartTime.current = performance.now();
      renderCount.current++;
    });

    useEffect(() => {
      const renderTime = performance.now() - renderStartTime.current;

      if (renderTime > 16) {
        // Longer than 1 frame
        console.warn(
          `🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
        );
      }

      // Log to performance API if available
      if ('mark' in performance) {
        performance.mark(`${componentName}-render-${renderCount.current}`);
      }
    });

    return React.createElement(Component, { ...props, ref } as any);
  });
}

export default {
  createOptimizedMemo,
  useOptimizedMemo,
  useStableCallback,
  useBatchedState,
  useRenderPrevention,
  useOptimizedEventHandler,
  useVirtualList,
  useOptimizedChildren,
  withPerformanceOptimizations,
  useIntersectionOptimization,
  OptimizedList,
  useOptimizedForm,
  withPerformanceProfiler,
};
