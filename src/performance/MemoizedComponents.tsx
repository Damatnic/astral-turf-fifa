/**
 * Memoized Component Wrappers
 * 
 * Production-optimized React.memo wrappers for expensive components
 * with smart comparison functions to prevent unnecessary re-renders.
 */

import React, { memo, type ComponentType, type PropsWithChildren } from 'react';

// ============================================================================
// COMPARISON FUNCTIONS
// ============================================================================

/**
 * Shallow comparison for props (default React.memo behavior)
 */
export const shallowCompare = <P extends object>(prevProps: P, nextProps: P): boolean => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) return false;

  for (const key of prevKeys) {
    if (prevProps[key as keyof P] !== nextProps[key as keyof P]) {
      return false;
    }
  }

  return true;
};

/**
 * Deep comparison for props with nested objects
 */
export const deepCompare = <P extends object>(prevProps: P, nextProps: P): boolean => {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
};

/**
 * Comparison that ignores function props (useful for components with callbacks)
 */
export const compareIgnoringFunctions = <P extends object>(
  prevProps: P,
  nextProps: P
): boolean => {
  const prevFiltered = Object.fromEntries(
    Object.entries(prevProps).filter(([_, v]) => typeof v !== 'function')
  );
  const nextFiltered = Object.fromEntries(
    Object.entries(nextProps).filter(([_, v]) => typeof v !== 'function')
  );

  return JSON.stringify(prevFiltered) === JSON.stringify(nextFiltered);
};

// ============================================================================
// MEMOIZATION UTILITIES
// ============================================================================

/**
 * Create a memoized component with custom comparison
 * 
 * @example
 * ```tsx
 * const MemoizedComponent = createMemoized(MyComponent, deepCompare);
 * ```
 */
export const createMemoized = <P extends object>(
  Component: ComponentType<P>,
  compare?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): ComponentType<P> => {
  return memo(Component, compare);
};

/**
 * Memoize a component only in production
 * In development, allows for better debugging and hot reload
 */
export const memoInProduction = <P extends object>(
  Component: ComponentType<P>,
  compare?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): ComponentType<P> => {
  if (process.env.NODE_ENV === 'production') {
    return memo(Component, compare);
  }
  return Component;
};

// ============================================================================
// COMMON MEMOIZED WRAPPERS
// ============================================================================

/**
 * Memoized wrapper for list item components
 * Uses shallow comparison by default
 */
export const MemoizedListItem = <P extends { id: string | number }>(
  Component: ComponentType<P>
): ComponentType<P> => {
  return memo(Component, (prev, next) => {
    // Always re-render if ID changed
    if (prev.id !== next.id) return false;
    
    // Otherwise use shallow comparison
    return shallowCompare(prev, next);
  });
};

/**
 * Memoized wrapper for card/tile components
 * Ignores callback props to prevent unnecessary re-renders
 */
export const MemoizedCard = <P extends object>(
  Component: ComponentType<P>
): ComponentType<P> => {
  return memo(Component, compareIgnoringFunctions);
};

/**
 * Memoized wrapper for expensive visualization components
 * Uses deep comparison for complex data structures
 */
export const MemoizedVisualization = <P extends object>(
  Component: ComponentType<P>
): ComponentType<P> => {
  return memo(Component, deepCompare);
};

// ============================================================================
// PERFORMANCE-OPTIMIZED WRAPPERS
// ============================================================================

/**
 * Wrapper that only updates when specific props change
 * 
 * @example
 * ```tsx
 * const OptimizedComponent = createSelectiveMemo(
 *   MyComponent,
 *   ['data', 'isLoading'] // Only re-render when these props change
 * );
 * ```
 */
export const createSelectiveMemo = <P extends object>(
  Component: ComponentType<P>,
  watchedProps: (keyof P)[]
): ComponentType<P> => {
  return memo(Component, (prev, next) => {
    // Check only the watched props
    for (const prop of watchedProps) {
      if (prev[prop] !== next[prop]) {
        return false; // Props changed, re-render
      }
    }
    return true; // No watched props changed, skip render
  });
};

/**
 * Wrapper that skips re-renders if component is not visible
 * Uses Intersection Observer to detect visibility
 */
export const createVisibilityAwareMemo = <P extends object>(
  Component: ComponentType<P>
): ComponentType<P> => {
  const VisibilityWrapper: React.FC<P> = (props) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const element = ref.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting);
        },
        { threshold: 0.01 }
      );

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }, []);

    return (
      <div ref={ref}>
        {isVisible ? <Component {...props} /> : <div style={{ minHeight: '100px' }} />}
      </div>
    );
  };

  return memo(VisibilityWrapper);
};

// ============================================================================
// PRESET MEMOIZED COMPONENTS
// ============================================================================

/**
 * Memoized wrapper for static content that never changes
 */
export const MemoizedStatic = <P extends object>(
  Component: ComponentType<P>
): ComponentType<P> => {
  return memo(Component, () => true); // Never re-render
};

/**
 * Memoized wrapper with performance logging
 */
export const createDebugMemo = <P extends object>(
  Component: ComponentType<P>,
  componentName: string
): ComponentType<P> => {
  return memo(Component, (prev, next) => {
    const changed = !shallowCompare(prev, next);
    
    if (changed && process.env.NODE_ENV === 'development') {
      console.log(`[Memo Debug] ${componentName} re-rendering`, {
        prev,
        next,
        diff: Object.keys(prev).filter(key => prev[key as keyof P] !== next[key as keyof P]),
      });
    }
    
    return !changed;
  });
};

// ============================================================================
// HIGHER-ORDER COMPONENTS
// ============================================================================

/**
 * HOC that adds memoization with performance tracking
 */
export const withMemoAndTracking = <P extends object>(
  Component: ComponentType<P>,
  componentName: string
) => {
  let renderCount = 0;
  
  const TrackedComponent: React.FC<P> = (props) => {
    renderCount++;
    
    React.useEffect(() => {
      console.log(`[Render Count] ${componentName}: ${renderCount}`);
    });
    
    return <Component {...props} />;
  };
  
  return memo(TrackedComponent);
};

/**
 * HOC that adds lazy rendering for off-screen components
 */
export const withLazyRender = <P extends object>(
  Component: ComponentType<P>,
  placeholder?: React.ReactNode
) => {
  const LazyComponent: React.FC<P> = (props) => {
    const [shouldRender, setShouldRender] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const element = ref.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShouldRender(true);
            observer.disconnect();
          }
        },
        { threshold: 0 }
      );

      observer.observe(element);

      return () => observer.disconnect();
    }, []);

    return (
      <div ref={ref}>
        {shouldRender ? <Component {...props} /> : (placeholder || null)}
      </div>
    );
  };

  return memo(LazyComponent);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createMemoized,
  memoInProduction,
  MemoizedListItem,
  MemoizedCard,
  MemoizedVisualization,
  createSelectiveMemo,
  createVisibilityAwareMemo,
  MemoizedStatic,
  createDebugMemo,
  withMemoAndTracking,
  withLazyRender,
  shallowCompare,
  deepCompare,
  compareIgnoringFunctions,
};
