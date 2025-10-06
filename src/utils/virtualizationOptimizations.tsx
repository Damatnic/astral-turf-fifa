/**
 * Catalyst Virtualization Optimizations
 * Ultra-efficient rendering for large datasets
 */

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useFastMemo } from './performanceOptimizations';

// Intersection Observer hook for viewport optimizations
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<HTMLElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<HTMLElement | null>(null);

  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    if (!element) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [element, options.threshold, options.rootMargin]);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
      setElement(node);
    },
    [element]
  );

  return [ref, isIntersecting];
}

// Virtual list implementation for large player datasets
export interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  className?: string;
  estimateSize?: (index: number) => number;
}

export function useVirtualList<T>({
  items,
  height,
  itemHeight,
  overscan = 5,
  estimateSize,
}: Omit<VirtualListProps<T>, 'renderItem' | 'className'>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  const visibleRange = useFastMemo(() => {
    const containerHeight = height;
    const effectiveItemHeight = estimateSize ? estimateSize(0) : itemHeight;

    const startIndex = Math.floor(scrollTop / effectiveItemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / effectiveItemHeight) + overscan,
      items.length
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: endIndex,
      startIndex,
      endIndex,
    };
  }, [scrollTop, height, itemHeight, items.length, overscan, estimateSize]);

  const totalHeight = useFastMemo(() => {
    if (estimateSize) {
      return items.reduce((acc, _, index) => acc + estimateSize(index), 0);
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight, estimateSize]);

  const visibleItems = useFastMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.start + index) * itemHeight,
        left: 0,
        right: 0,
        height: estimateSize ? estimateSize(visibleRange.start + index) : itemHeight,
      },
    }));
  }, [items, visibleRange.start, visibleRange.end, itemHeight, estimateSize]);

  return {
    totalHeight,
    visibleItems,
    handleScroll,
    isScrolling,
    scrollTop,
    visibleRange,
  };
}

// Virtual List Component
export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  onScroll,
  className = '',
  estimateSize,
}: VirtualListProps<T>) {
  const { totalHeight, visibleItems, handleScroll, isScrolling, scrollTop } = useVirtualList({
    items,
    height,
    itemHeight,
    overscan,
    estimateSize,
  });

  const combinedHandleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      handleScroll(e);
      onScroll?.(e.currentTarget.scrollTop);
    },
    [handleScroll, onScroll]
  );

  return (
    <div
      className={`relative overflow-auto ${className}`}
      style={{ height }}
      onScroll={combinedHandleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, style }) => renderItem(item, index, style))}
      </div>
      {isScrolling && (
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
          Scrolling...
        </div>
      )}
    </div>
  );
}

// Grid virtualization for tactical field
export interface VirtualGridProps<T> {
  items: T[];
  width: number;
  height: number;
  columnCount: number;
  rowHeight: number;
  columnWidth: number;
  renderCell: (
    item: T,
    rowIndex: number,
    columnIndex: number,
    style: React.CSSProperties
  ) => React.ReactNode;
  overscan?: number;
}

export function useVirtualGrid<T>({
  items,
  width,
  height,
  columnCount,
  rowHeight,
  columnWidth,
  overscan = 2,
}: Omit<VirtualGridProps<T>, 'renderCell'>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const rowCount = Math.ceil(items.length / columnCount);

  const visibleRowRange = useFastMemo(() => {
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.min(startRow + Math.ceil(height / rowHeight) + overscan, rowCount);

    return {
      start: Math.max(0, startRow - overscan),
      end: endRow,
    };
  }, [scrollTop, height, rowHeight, rowCount, overscan]);

  const visibleColumnRange = useFastMemo(() => {
    const startColumn = Math.floor(scrollLeft / columnWidth);
    const endColumn = Math.min(
      startColumn + Math.ceil(width / columnWidth) + overscan,
      columnCount
    );

    return {
      start: Math.max(0, startColumn - overscan),
      end: endColumn,
    };
  }, [scrollLeft, width, columnWidth, columnCount, overscan]);

  const visibleCells = useFastMemo(() => {
    const cells: Array<{
      item: T;
      rowIndex: number;
      columnIndex: number;
      style: React.CSSProperties;
    }> = [];

    for (let rowIndex = visibleRowRange.start; rowIndex < visibleRowRange.end; rowIndex++) {
      for (
        let columnIndex = visibleColumnRange.start;
        columnIndex < visibleColumnRange.end;
        columnIndex++
      ) {
        const itemIndex = rowIndex * columnCount + columnIndex;
        if (itemIndex < items.length) {
          cells.push({
            item: items[itemIndex],
            rowIndex,
            columnIndex,
            style: {
              position: 'absolute',
              top: rowIndex * rowHeight,
              left: columnIndex * columnWidth,
              width: columnWidth,
              height: rowHeight,
            },
          });
        }
      }
    }

    return cells;
  }, [items, visibleRowRange, visibleColumnRange, columnCount, rowHeight, columnWidth]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  return {
    totalWidth: columnCount * columnWidth,
    totalHeight: rowCount * rowHeight,
    visibleCells,
    handleScroll,
    visibleRowRange,
    visibleColumnRange,
  };
}

// Virtual Grid Component
export function VirtualGrid<T>({
  items,
  width,
  height,
  columnCount,
  rowHeight,
  columnWidth,
  renderCell,
  overscan = 2,
}: VirtualGridProps<T>) {
  const { totalWidth, totalHeight, visibleCells, handleScroll } = useVirtualGrid({
    items,
    width,
    height,
    columnCount,
    rowHeight,
    columnWidth,
    overscan,
  });

  return (
    <div className="relative overflow-auto" style={{ width, height }} onScroll={handleScroll}>
      <div style={{ width: totalWidth, height: totalHeight, position: 'relative' }}>
        {visibleCells.map(({ item, rowIndex, columnIndex, style }) => (
          <div key={`${rowIndex}-${columnIndex}`} style={style}>
            {renderCell(item, rowIndex, columnIndex, style)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Level of Detail (LOD) system for tactical elements
export interface LODConfig {
  highDetail: number; // Distance threshold for high detail
  mediumDetail: number; // Distance threshold for medium detail
  lowDetail: number; // Distance threshold for low detail
}

export function useLevelOfDetail(
  cameraPosition: { x: number; y: number },
  lodConfig: LODConfig = {
    highDetail: 100,
    mediumDetail: 300,
    lowDetail: 600,
  }
) {
  return useCallback(
    (elementPosition: { x: number; y: number }) => {
      const distance = Math.sqrt(
        Math.pow(cameraPosition.x - elementPosition.x, 2) +
          Math.pow(cameraPosition.y - elementPosition.y, 2)
      );

      if (distance <= lodConfig.highDetail) {
        return 'high';
      }
      if (distance <= lodConfig.mediumDetail) {
        return 'medium';
      }
      if (distance <= lodConfig.lowDetail) {
        return 'low';
      }
      return 'hidden';
    },
    [cameraPosition, lodConfig]
  );
}

// Occlusion culling for off-screen elements
export function useOcclusionCulling(viewportBounds: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return useCallback(
    (elementBounds: { x: number; y: number; width: number; height: number }) => {
      return !(
        elementBounds.x + elementBounds.width < viewportBounds.x ||
        elementBounds.x > viewportBounds.x + viewportBounds.width ||
        elementBounds.y + elementBounds.height < viewportBounds.y ||
        elementBounds.y > viewportBounds.y + viewportBounds.height
      );
    },
    [viewportBounds]
  );
}

// Batched rendering for improved performance
export class RenderBatch<T> {
  private items: T[] = [];
  private batchSize: number;
  private renderFn: (items: T[]) => void;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(batchSize: number, renderFn: (items: T[]) => void) {
    this.batchSize = batchSize;
    this.renderFn = renderFn;
  }

  add(item: T) {
    this.items.push(item);

    if (this.items.length >= this.batchSize) {
      this.flush();
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flush(), 16); // Next frame
    }
  }

  flush() {
    if (this.items.length > 0) {
      this.renderFn([...this.items]);
      this.items = [];
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  clear() {
    this.items = [];
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// Viewport-aware lazy loading
export function useViewportLazyLoading<T>(
  items: T[],
  containerRef: React.RefObject<HTMLElement>,
  loadMore: () => void,
  threshold = 200
) {
  const [loadedItems, setLoadedItems] = useState<T[]>([]);
  const loadingRef = useRef(false);

  useEffect(() => {
    setLoadedItems(items.slice(0, Math.min(50, items.length))); // Initial load
  }, [items]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const container = containerRef.current;

    const handleScroll = () => {
      if (loadingRef.current) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;

      if (isNearBottom && loadedItems.length < items.length) {
        loadingRef.current = true;

        // Load next batch
        const nextBatchSize = Math.min(20, items.length - loadedItems.length);
        const nextItems = items.slice(0, loadedItems.length + nextBatchSize);

        setTimeout(() => {
          setLoadedItems(nextItems);
          loadingRef.current = false;

          if (nextItems.length === items.length) {
            loadMore();
          }
        }, 50); // Small delay to prevent rapid loading
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [items, loadedItems, containerRef, loadMore, threshold]);

  return {
    loadedItems,
    isLoading: loadingRef.current,
    hasMore: loadedItems.length < items.length,
  };
}

export default {
  useIntersectionObserver,
  useVirtualList,
  VirtualList,
  useVirtualGrid,
  VirtualGrid,
  useLevelOfDetail,
  useOcclusionCulling,
  RenderBatch,
  useViewportLazyLoading,
};
