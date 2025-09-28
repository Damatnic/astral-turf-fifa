/**
 * Catalyst Caching Optimizations
 * Multi-layer caching system for ultra-fast data access
 */

import { useRef, useCallback, useEffect, useMemo } from 'react';
import { type Formation, type Player } from '../types';

// Cache configuration
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  persistToStorage: boolean;
  compressionEnabled: boolean;
}

// Cache entry structure
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
  compressed?: boolean;
}

// Advanced LRU Cache with TTL and compression
export class UltraFastCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private accessOrder = new Map<K, number>();
  private config: CacheConfig;
  private accessCounter = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      ttl: 5 * 60 * 1000, // 5 minutes default
      persistToStorage: true,
      compressionEnabled: true,
      ...config
    };

    // Start cleanup interval
    this.startCleanup();
    
    // Load from storage if enabled
    if (this.config.persistToStorage) {
      this.loadFromStorage();
    }
  }

  private startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private cleanup() {
    const now = Date.now();
    const expiredKeys: K[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    });

    // If still over capacity, remove LRU items
    if (this.cache.size > this.config.maxSize) {
      const sortedByAccess = Array.from(this.accessOrder.entries())
        .sort((a, b) => a[1] - b[1]);
      
      const itemsToRemove = this.cache.size - this.config.maxSize;
      for (let i = 0; i < itemsToRemove; i++) {
        const [key] = sortedByAccess[i];
        this.cache.delete(key);
        this.accessOrder.delete(key);
      }
    }
  }

  private compress(data: V): string {
    if (!this.config.compressionEnabled) {
      return JSON.stringify(data);
    }
    
    // Simple compression using JSON stringification with repeated pattern removal
    const jsonStr = JSON.stringify(data);
    return this.simpleCompress(jsonStr);
  }

  private decompress(compressed: string): V {
    if (!this.config.compressionEnabled) {
      return JSON.parse(compressed);
    }
    
    const decompressed = this.simpleDecompress(compressed);
    return JSON.parse(decompressed);
  }

  private simpleCompress(str: string): string {
    // Simple pattern-based compression
    const patterns = [
      [/"x":/g, '§x§'],
      [/"y":/g, '§y§'],
      [/"id":/g, '§i§'],
      [/"name":/g, '§n§'],
      [/"position":/g, '§p§'],
      [/"players":/g, '§pl§'],
      [/"formation":/g, '§f§'],
      [/null/g, '§0§'],
      [/true/g, '§1§'],
      [/false/g, '§2§']
    ];

    let compressed = str;
    patterns.forEach(([pattern, replacement]) => {
      compressed = compressed.replace(pattern, replacement as string);
    });

    return compressed;
  }

  private simpleDecompress(str: string): string {
    const patterns = [
      [/§x§/g, '"x":'],
      [/§y§/g, '"y":'],
      [/§i§/g, '"id":'],
      [/§n§/g, '"name":'],
      [/§p§/g, '"position":'],
      [/§pl§/g, '"players":'],
      [/§f§/g, '"formation":'],
      [/§0§/g, 'null'],
      [/§1§/g, 'true'],
      [/§2§/g, 'false']
    ];

    let decompressed = str;
    patterns.forEach(([pattern, replacement]) => {
      decompressed = decompressed.replace(pattern, replacement as string);
    });

    return decompressed;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return undefined;
    }

    // Update access order and hit count
    this.accessOrder.set(key, ++this.accessCounter);
    entry.hits++;

    return entry.compressed ? this.decompress(entry.data as string) : entry.data;
  }

  set(key: K, value: V, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl || this.config.ttl;
    
    // Calculate size (approximate)
    const dataString = JSON.stringify(value);
    const size = new Blob([dataString]).size;
    
    // Compress if enabled and data is large enough
    const shouldCompress = this.config.compressionEnabled && size > 1024; // 1KB threshold
    const finalData = shouldCompress ? this.compress(value) : value;
    
    const entry: CacheEntry<V> = {
      data: finalData,
      timestamp: now,
      ttl,
      hits: 0,
      size: shouldCompress ? new Blob([finalData as string]).size : size,
      compressed: shouldCompress
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);

    // Trigger cleanup if over capacity
    if (this.cache.size > this.config.maxSize) {
      this.cleanup();
    }

    // Persist to storage if enabled
    if (this.config.persistToStorage) {
      this.persistToStorage();
    }
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    if (this.config.persistToStorage) {
      localStorage.removeItem('cache-data');
    }
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      totalSize,
      totalHits,
      hitRate: totalHits / Math.max(entries.length, 1),
      compressionRatio: this.config.compressionEnabled ? 
        entries.filter(e => e.compressed).length / Math.max(entries.length, 1) : 0
    };
  }

  private persistToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = Array.from(this.cache.entries()).slice(0, 100); // Limit stored items
      localStorage.setItem('cache-data', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist cache to storage:', error);
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('cache-data');
      if (stored) {
        const cacheData = JSON.parse(stored);
        cacheData.forEach(([key, entry]: [K, CacheEntry<V>]) => {
          // Only load non-expired entries
          if (Date.now() - entry.timestamp < entry.ttl) {
            this.cache.set(key, entry);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Formation-specific cache
export class FormationCache extends UltraFastCache<string, Formation> {
  constructor() {
    super({
      maxSize: 500,
      ttl: 10 * 60 * 1000, // 10 minutes for formations
      persistToStorage: true,
      compressionEnabled: true
    });
  }

  getFormationById(id: string): Formation | undefined {
    return this.get(id);
  }

  setFormation(formation: Formation): void {
    this.set(formation.id, formation);
  }

  getFormationsByType(type: string): Formation[] {
    const formations: Formation[] = [];
    
    for (const [key] of this.cache) {
      const formation = this.get(key);
      if (formation && formation.type === type) {
        formations.push(formation);
      }
    }
    
    return formations;
  }

  preloadFormations(formations: Formation[]): void {
    formations.forEach(formation => {
      this.setFormation(formation);
    });
  }
}

// Player data cache
export class PlayerCache extends UltraFastCache<string, Player> {
  constructor() {
    super({
      maxSize: 1000,
      ttl: 15 * 60 * 1000, // 15 minutes for player data
      persistToStorage: true,
      compressionEnabled: true
    });
  }

  getPlayerById(id: string): Player | undefined {
    return this.get(id);
  }

  setPlayer(player: Player): void {
    this.set(player.id, player);
  }

  getPlayersByTeam(teamId: string): Player[] {
    const players: Player[] = [];
    
    for (const [key] of this.cache) {
      const player = this.get(key);
      if (player && player.teamId === teamId) {
        players.push(player);
      }
    }
    
    return players;
  }

  preloadPlayers(players: Player[]): void {
    players.forEach(player => {
      this.setPlayer(player);
    });
  }
}

// Query result cache for computed data
export class QueryCache extends UltraFastCache<string, any> {
  constructor() {
    super({
      maxSize: 200,
      ttl: 5 * 60 * 1000, // 5 minutes for computed results
      persistToStorage: false, // Don't persist computed data
      compressionEnabled: true
    });
  }

  memoize<Args extends any[], Return>(
    fn: (...args: Args) => Return,
    keyGenerator?: (...args: Args) => string
  ): (...args: Args) => Return {
    return (...args: Args): Return => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      const cached = this.get(key);
      if (cached !== undefined) {
        return cached;
      }
      
      const result = fn(...args);
      this.set(key, result);
      return result;
    };
  }
}

// Global cache instances
export const formationCache = new FormationCache();
export const playerCache = new PlayerCache();
export const queryCache = new QueryCache();

// React hooks for cache integration
export function useCachedFormation(formationId: string | undefined) {
  return useMemo(() => {
    if (!formationId) return undefined;
    return formationCache.getFormationById(formationId);
  }, [formationId]);
}

export function useCachedPlayer(playerId: string | undefined) {
  return useMemo(() => {
    if (!playerId) return undefined;
    return playerCache.getPlayerById(playerId);
  }, [playerId]);
}

export function useCachedQuery<T>(
  queryFn: () => T,
  deps: React.DependencyList,
  cacheKey: string
): T {
  return useMemo(() => {
    const cached = queryCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    
    const result = queryFn();
    queryCache.set(cacheKey, result);
    return result;
  }, [...deps, cacheKey]);
}

// Cache warming utilities
export function warmCache() {
  // This would typically be called on app startup
  console.log('Warming caches...');
  
  // Preload critical formations
  // This would fetch from API or local storage
  
  // Preload critical player data
  // This would fetch from API or local storage
}

// Cache invalidation utilities
export function invalidateFormationCache(formationId?: string) {
  if (formationId) {
    formationCache.delete(formationId);
  } else {
    formationCache.clear();
  }
}

export function invalidatePlayerCache(playerId?: string) {
  if (playerId) {
    playerCache.delete(playerId);
  } else {
    playerCache.clear();
  }
}

export function invalidateQueryCache(pattern?: string) {
  if (pattern) {
    // Remove all keys matching pattern
    for (const [key] of queryCache.cache) {
      if (key.includes(pattern)) {
        queryCache.delete(key);
      }
    }
  } else {
    queryCache.clear();
  }
}

// Cache performance monitoring
export function getCacheStats() {
  return {
    formations: formationCache.getStats(),
    players: playerCache.getStats(),
    queries: queryCache.getStats()
  };
}

// Service Worker cache for assets
export class ServiceWorkerCache {
  private static instance: ServiceWorkerCache;
  
  static getInstance(): ServiceWorkerCache {
    if (!ServiceWorkerCache.instance) {
      ServiceWorkerCache.instance = new ServiceWorkerCache();
    }
    return ServiceWorkerCache.instance;
  }

  async cacheAssets(urls: string[]): Promise<void> {
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cache = await caches.open('astral-turf-v1');
      await cache.addAll(urls);
    }
  }

  async getCachedResponse(url: string): Promise<Response | undefined> {
    if ('caches' in window) {
      const cache = await caches.open('astral-turf-v1');
      return cache.match(url);
    }
    return undefined;
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }
}

export default {
  UltraFastCache,
  FormationCache,
  PlayerCache,
  QueryCache,
  ServiceWorkerCache,
  formationCache,
  playerCache,
  queryCache,
  useCachedFormation,
  useCachedPlayer,
  useCachedQuery,
  warmCache,
  invalidateFormationCache,
  invalidatePlayerCache,
  invalidateQueryCache,
  getCacheStats
};