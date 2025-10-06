/**
 * Catalyst Large Dataset Performance Optimizations
 * Handle 1000+ players with smooth 60fps performance
 */

import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useFastMemo } from './performanceOptimizations';

// Large dataset performance constants
export const LARGE_DATASET_PERFORMANCE = {
  VIRTUALIZATION_THRESHOLD: 50, // Enable virtualization above 50 items
  WORKER_THRESHOLD: 100, // Use workers above 100 items
  CHUNKING_SIZE: 100, // Process in chunks of 100
  INDEX_REBUILD_THRESHOLD: 500, // Rebuild indexes above 500 changes
  CACHE_SIZE: 1000, // Cache up to 1000 computed values
  DEBOUNCE_TIME: 16, // 60fps debouncing
  MAX_CONCURRENT_WORKERS: 4, // Maximum concurrent workers
  MEMORY_CLEANUP_INTERVAL: 30000, // 30s memory cleanup
} as const;

// Spatial indexing for fast position queries
export class SpatialIndex {
  private grid: Map<string, Set<string>> = new Map();
  private cellSize: number;
  private bounds: { width: number; height: number };
  private itemPositions = new Map<string, { x: number; y: number }>();

  constructor(cellSize = 10, bounds = { width: 100, height: 100 }) {
    this.cellSize = cellSize;
    this.bounds = bounds;
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  add(id: string, x: number, y: number): void {
    // Remove from old position if exists
    this.remove(id);

    // Add to new position
    const cellKey = this.getCellKey(x, y);
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, new Set());
    }
    this.grid.get(cellKey)!.add(id);
    this.itemPositions.set(id, { x, y });
  }

  remove(id: string): void {
    const position = this.itemPositions.get(id);
    if (position) {
      const cellKey = this.getCellKey(position.x, position.y);
      const cell = this.grid.get(cellKey);
      if (cell) {
        cell.delete(id);
        if (cell.size === 0) {
          this.grid.delete(cellKey);
        }
      }
      this.itemPositions.delete(id);
    }
  }

  query(x: number, y: number, radius: number): string[] {
    const results: string[] = [];
    const minX = Math.max(0, x - radius);
    const maxX = Math.min(this.bounds.width, x + radius);
    const minY = Math.max(0, y - radius);
    const maxY = Math.min(this.bounds.height, y + radius);

    // Get all cells that intersect with the query area
    for (
      let cellX = Math.floor(minX / this.cellSize);
      cellX <= Math.floor(maxX / this.cellSize);
      cellX++
    ) {
      for (
        let cellY = Math.floor(minY / this.cellSize);
        cellY <= Math.floor(maxY / this.cellSize);
        cellY++
      ) {
        const cellKey = `${cellX},${cellY}`;
        const cell = this.grid.get(cellKey);
        if (cell) {
          for (const id of cell) {
            const position = this.itemPositions.get(id);
            if (position) {
              const distance = Math.sqrt(Math.pow(position.x - x, 2) + Math.pow(position.y - y, 2));
              if (distance <= radius) {
                results.push(id);
              }
            }
          }
        }
      }
    }

    return results;
  }

  getNearest(x: number, y: number, count = 1): string[] {
    const candidates: Array<{ id: string; distance: number }> = [];

    // Start with immediate cell and expand outward
    let searchRadius = this.cellSize;
    const maxRadius = Math.max(this.bounds.width, this.bounds.height);

    while (candidates.length < count * 2 && searchRadius <= maxRadius) {
      const newCandidates = this.query(x, y, searchRadius);

      for (const id of newCandidates) {
        if (!candidates.find(c => c.id === id)) {
          const position = this.itemPositions.get(id);
          if (position) {
            const distance = Math.sqrt(Math.pow(position.x - x, 2) + Math.pow(position.y - y, 2));
            candidates.push({ id, distance });
          }
        }
      }

      searchRadius *= 2;
    }

    return candidates
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map(c => c.id);
  }

  clear(): void {
    this.grid.clear();
    this.itemPositions.clear();
  }

  getStats() {
    return {
      totalItems: this.itemPositions.size,
      totalCells: this.grid.size,
      averageItemsPerCell: this.itemPositions.size / Math.max(1, this.grid.size),
    };
  }
}

// Worker pool for parallel processing
export class WorkerPool {
  private workers: Worker[] = [];
  private available: boolean[] = [];
  private taskQueue: Array<{
    task: any;
    resolve: (result: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(workerScript: string, poolSize = LARGE_DATASET_PERFORMANCE.MAX_CONCURRENT_WORKERS) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      this.workers.push(worker);
      this.available.push(true);

      worker.onmessage = event => {
        this.available[i] = true;
        const { taskId, result, error } = event.data;

        // Process next task if available
        this.processNextTask();
      };

      worker.onerror = error => {
        console.error(`Worker ${i} error:`, error);
        this.available[i] = true;
        this.processNextTask();
      };
    }
  }

  async execute<T>(task: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processNextTask();
    });
  }

  private processNextTask() {
    if (this.taskQueue.length === 0) {
      return;
    }

    const availableWorkerIndex = this.available.findIndex(available => available);
    if (availableWorkerIndex === -1) {
      return;
    } // No workers available

    const { task, resolve, reject } = this.taskQueue.shift()!;
    const worker = this.workers[availableWorkerIndex];

    this.available[availableWorkerIndex] = false;

    const taskId = Math.random().toString(36).substr(2, 9);

    const handleMessage = (event: MessageEvent) => {
      if (event.data.taskId === taskId) {
        worker.removeEventListener('message', handleMessage);

        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data.result);
        }
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ taskId, ...task });
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.available = [];
    this.taskQueue = [];
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.available.filter(Boolean).length,
      queuedTasks: this.taskQueue.length,
    };
  }
}

// High-performance data manager for large datasets
export class LargeDatasetManager<T extends { id: string }> {
  private data = new Map<string, T>();
  private indices = new Map<string, Map<any, Set<string>>>();
  private spatialIndex: SpatialIndex | null = null;
  private workerPool: WorkerPool | null = null;
  private cache = new Map<string, any>();
  private changeCount = 0;
  private lastIndexRebuild = 0;

  constructor(workerScript?: string) {
    if (workerScript) {
      this.workerPool = new WorkerPool(workerScript);
    }
  }

  // Enable spatial indexing for position-based queries
  enableSpatialIndex(cellSize = 10, bounds = { width: 100, height: 100 }) {
    this.spatialIndex = new SpatialIndex(cellSize, bounds);

    // Index existing items
    for (const [id, item] of this.data) {
      const position = this.getItemPosition(item);
      if (position) {
        this.spatialIndex.add(id, position.x, position.y);
      }
    }
  }

  private getItemPosition(item: T): { x: number; y: number } | null {
    // Override this method based on your data structure
    if ('position' in item) {
      return (item as any).position;
    }
    if ('x' in item && 'y' in item) {
      return { x: (item as any).x, y: (item as any).y };
    }
    return null;
  }

  // Add or update item
  set(item: T): void {
    const existingItem = this.data.get(item.id);
    this.data.set(item.id, item);

    // Update spatial index
    if (this.spatialIndex) {
      const position = this.getItemPosition(item);
      if (position) {
        this.spatialIndex.add(item.id, position.x, position.y);
      }
    }

    // Update indices
    this.updateIndices(item, existingItem);

    // Clear cache for affected queries
    this.invalidateCache(item.id);

    this.changeCount++;
    this.checkIndexRebuild();
  }

  // Get item by ID
  get(id: string): T | undefined {
    return this.data.get(id);
  }

  // Remove item
  delete(id: string): boolean {
    const item = this.data.get(id);
    if (!item) {
      return false;
    }

    this.data.delete(id);

    // Remove from spatial index
    if (this.spatialIndex) {
      this.spatialIndex.remove(id);
    }

    // Remove from indices
    this.removeFromIndices(item);

    // Clear cache
    this.invalidateCache(id);

    this.changeCount++;
    return true;
  }

  // Create index on a field
  createIndex(fieldName: string, keyExtractor: (item: T) => any): void {
    const index = new Map<any, Set<string>>();

    for (const [id, item] of this.data) {
      const key = keyExtractor(item);
      if (!index.has(key)) {
        index.set(key, new Set());
      }
      index.get(key)!.add(id);
    }

    this.indices.set(fieldName, index);
  }

  private updateIndices(item: T, existingItem?: T): void {
    for (const [fieldName, index] of this.indices) {
      // Remove from old position if updating
      if (existingItem) {
        this.removeItemFromIndex(fieldName, existingItem);
      }

      // Add to new position
      this.addItemToIndex(fieldName, item);
    }
  }

  private addItemToIndex(fieldName: string, item: T): void {
    const index = this.indices.get(fieldName);
    if (!index) {
      return;
    }

    const key = (item as any)[fieldName];
    if (!index.has(key)) {
      index.set(key, new Set());
    }
    index.get(key)!.add(item.id);
  }

  private removeItemFromIndex(fieldName: string, item: T): void {
    const index = this.indices.get(fieldName);
    if (!index) {
      return;
    }

    const key = (item as any)[fieldName];
    const set = index.get(key);
    if (set) {
      set.delete(item.id);
      if (set.size === 0) {
        index.delete(key);
      }
    }
  }

  private removeFromIndices(item: T): void {
    for (const fieldName of this.indices.keys()) {
      this.removeItemFromIndex(fieldName, item);
    }
  }

  // Query by index
  queryByIndex(fieldName: string, value: any): T[] {
    const cacheKey = `index_${fieldName}_${value}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const index = this.indices.get(fieldName);
    if (!index) {
      return [];
    }

    const ids = index.get(value);
    if (!ids) {
      return [];
    }

    const results = Array.from(ids)
      .map(id => this.data.get(id))
      .filter((item): item is T => item !== undefined);

    this.cache.set(cacheKey, results);
    return results;
  }

  // Spatial queries
  queryByPosition(x: number, y: number, radius: number): T[] {
    if (!this.spatialIndex) {
      return [];
    }

    const cacheKey = `spatial_${x}_${y}_${radius}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const ids = this.spatialIndex.query(x, y, radius);
    const results = ids
      .map(id => this.data.get(id))
      .filter((item): item is T => item !== undefined);

    this.cache.set(cacheKey, results);
    return results;
  }

  // Get nearest items
  getNearest(x: number, y: number, count = 1): T[] {
    if (!this.spatialIndex) {
      return [];
    }

    const ids = this.spatialIndex.getNearest(x, y, count);
    return ids.map(id => this.data.get(id)).filter((item): item is T => item !== undefined);
  }

  // Parallel processing with workers
  async processInParallel<R>(operation: string, data: any): Promise<R> {
    if (!this.workerPool) {
      throw new Error('Worker pool not initialized');
    }

    return this.workerPool.execute({ operation, data });
  }

  // Batch operations
  batch(operations: Array<() => void>): void {
    const originalChangeCount = this.changeCount;

    // Disable cache during batch
    const originalCache = this.cache;
    this.cache = new Map();

    try {
      operations.forEach(op => op());
    } finally {
      // Restore cache
      this.cache = originalCache;

      // Clear cache if there were changes
      if (this.changeCount > originalChangeCount) {
        this.cache.clear();
      }
    }
  }

  private checkIndexRebuild(): void {
    if (
      this.changeCount - this.lastIndexRebuild >
      LARGE_DATASET_PERFORMANCE.INDEX_REBUILD_THRESHOLD
    ) {
      this.rebuildIndices();
    }
  }

  private rebuildIndices(): void {
    console.log('Rebuilding indices for better performance...');

    // Rebuild all indices
    for (const [fieldName, index] of this.indices) {
      index.clear();

      for (const [id, item] of this.data) {
        this.addItemToIndex(fieldName, item);
      }
    }

    // Clear cache
    this.cache.clear();

    this.lastIndexRebuild = this.changeCount;
  }

  private invalidateCache(itemId: string): void {
    // Remove cached queries that might be affected by this item
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(itemId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // Limit cache size
    if (this.cache.size > LARGE_DATASET_PERFORMANCE.CACHE_SIZE) {
      const keys = Array.from(this.cache.keys());
      const keysToRemove = keys.slice(0, keys.length - LARGE_DATASET_PERFORMANCE.CACHE_SIZE);
      keysToRemove.forEach(key => this.cache.delete(key));
    }
  }

  // Get all items (use with caution for large datasets)
  getAll(): T[] {
    return Array.from(this.data.values());
  }

  // Get paginated results
  getPaginated(offset = 0, limit = 100): { items: T[]; total: number } {
    const items = Array.from(this.data.values()).slice(offset, offset + limit);
    return {
      items,
      total: this.data.size,
    };
  }

  // Get performance stats
  getStats() {
    return {
      itemCount: this.data.size,
      indexCount: this.indices.size,
      cacheSize: this.cache.size,
      changeCount: this.changeCount,
      spatialIndexStats: this.spatialIndex?.getStats(),
      workerPoolStats: this.workerPool?.getStats(),
    };
  }

  // Cleanup
  destroy(): void {
    this.data.clear();
    this.indices.clear();
    this.cache.clear();
    this.spatialIndex?.clear();
    this.workerPool?.terminate();
  }
}

// React hooks for large dataset management
export function useLargeDataset<T extends { id: string }>(
  initialData: T[] = [],
  workerScript?: string
) {
  const managerRef = useRef<LargeDatasetManager<T> | null>(null);
  const [stats, setStats] = useState({
    itemCount: 0,
    indexCount: 0,
    cacheSize: 0,
    changeCount: 0,
  });

  // Initialize manager
  if (!managerRef.current) {
    managerRef.current = new LargeDatasetManager<T>(workerScript);

    // Load initial data
    if (initialData.length > 0) {
      managerRef.current.batch(initialData.map(item => () => managerRef.current!.set(item)));
    }
  }

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      if (managerRef.current) {
        setStats(managerRef.current.getStats());
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const add = useCallback(
    (item: T) => {
      managerRef.current?.set(item);
      setStats(managerRef.current?.getStats() || stats);
    },
    [stats]
  );

  const remove = useCallback(
    (id: string) => {
      managerRef.current?.delete(id);
      setStats(managerRef.current?.getStats() || stats);
    },
    [stats]
  );

  const get = useCallback((id: string) => {
    return managerRef.current?.get(id);
  }, []);

  const queryByIndex = useCallback((fieldName: string, value: any) => {
    return managerRef.current?.queryByIndex(fieldName, value) || [];
  }, []);

  const queryByPosition = useCallback((x: number, y: number, radius: number) => {
    return managerRef.current?.queryByPosition(x, y, radius) || [];
  }, []);

  const createIndex = useCallback((fieldName: string, keyExtractor: (item: T) => any) => {
    managerRef.current?.createIndex(fieldName, keyExtractor);
  }, []);

  const enableSpatialIndex = useCallback(
    (cellSize?: number, bounds?: { width: number; height: number }) => {
      managerRef.current?.enableSpatialIndex(cellSize, bounds);
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      managerRef.current?.destroy();
    };
  }, []);

  return {
    add,
    remove,
    get,
    queryByIndex,
    queryByPosition,
    createIndex,
    enableSpatialIndex,
    stats,
    manager: managerRef.current,
  };
}

// Virtualized list hook for large datasets
export function useVirtualizedList<T>({
  items,
  containerHeight,
  itemHeight,
  overscan = 5,
}: {
  items: T[];
  containerHeight: number;
  itemHeight: number;
  overscan?: number;
}) {
  return useFastMemo(() => {
    if (items.length < LARGE_DATASET_PERFORMANCE.VIRTUALIZATION_THRESHOLD) {
      // Don't virtualize small lists
      return {
        virtualItems: items.map((item, index) => ({ item, index, top: index * itemHeight })),
        totalHeight: items.length * itemHeight,
        startIndex: 0,
        endIndex: items.length,
      };
    }

    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const totalHeight = items.length * itemHeight;

    return {
      totalHeight,
      visibleCount,
      getVisibleRange: (scrollTop: number) => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount + overscan, items.length);
        const adjustedStartIndex = Math.max(0, startIndex - overscan);

        const virtualItems: Array<{ item: T; index: number; top: number }> = [];
        for (let i = adjustedStartIndex; i < endIndex; i++) {
          virtualItems.push({
            item: items[i],
            index: i,
            top: i * itemHeight,
          });
        }

        return {
          virtualItems,
          startIndex: adjustedStartIndex,
          endIndex,
        };
      },
    };
  }, [items, containerHeight, itemHeight, overscan]);
}

export default {
  SpatialIndex,
  WorkerPool,
  LargeDatasetManager,
  useLargeDataset,
  useVirtualizedList,
  LARGE_DATASET_PERFORMANCE,
};
