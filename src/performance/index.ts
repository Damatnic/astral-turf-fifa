/**
 * Performance Optimization Index
 * 
 * Central export for all performance optimization utilities
 */

// Performance monitoring
export {
  useRenderPerformance,
  useMemoryLeakDetection,
  useEffectCleanup,
  getMemoryUsage,
  formatBytes,
  isPerformanceDegrading,
  reportPerformanceMetrics,
  getWebVitals,
  type PerformanceMetrics,
  type PerformanceReport,
} from './PerformanceMonitor';

// Memoization utilities
export {
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
} from './MemoizedComponents';
