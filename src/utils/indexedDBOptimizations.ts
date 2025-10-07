/**
 * Catalyst IndexedDB Optimizations
 * Advanced persistent storage with compression and versioning
 */

import type { Player, Formation } from '../types';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  version: number;
  ttl: number;
  compressed: boolean;
  checksum: string;
  metadata?: Record<string, any>;
}

interface DatabaseSchema {
  formations: CacheEntry<Formation>;
  players: CacheEntry<Player>;
  settings: CacheEntry<any>;
  analytics: CacheEntry<any>;
  media: CacheEntry<Blob>;
}

type StoreNames = keyof DatabaseSchema;

// Advanced compression utilities
class CompressionEngine {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  static async compress(
    data: any,
  ): Promise<{ compressed: Uint8Array; originalSize: number; compressedSize: number }> {
    const jsonString = JSON.stringify(data);
    const originalSize = this.encoder.encode(jsonString).length;

    try {
      // Use browser's native compression if available
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(this.encoder.encode(jsonString));
        writer.close();

        const chunks: Uint8Array[] = [];
        let result;

        while (!(result = await reader.read()).done) {
          chunks.push(result.value);
        }

        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;

        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }

        return {
          compressed,
          originalSize,
          compressedSize: compressed.length,
        };
      }
    } catch (error) {
      console.warn('Native compression failed, using fallback:', error);
    }

    // Fallback: Simple pattern-based compression
    const compressed = this.simpleCompress(jsonString);
    const compressedBytes = this.encoder.encode(compressed);

    return {
      compressed: compressedBytes,
      originalSize,
      compressedSize: compressedBytes.length,
    };
  }

  static async decompress(compressed: Uint8Array): Promise<any> {
    try {
      // Try native decompression first
      if ('DecompressionStream' in window) {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        await writer.write(compressed as any);
        await writer.close();

        const chunks: Uint8Array[] = [];
        let result;

        while (!(result = await reader.read()).done) {
          chunks.push(result.value);
        }

        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;

        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }

        const jsonString = this.decoder.decode(decompressed);
        return JSON.parse(jsonString);
      }
    } catch (error) {
      console.warn('Native decompression failed, using fallback:', error);
    }

    // Fallback: Simple pattern-based decompression
    const jsonString = this.decoder.decode(compressed);
    const decompressed = this.simpleDecompress(jsonString);
    return JSON.parse(decompressed);
  }

  private static simpleCompress(str: string): string {
    // Pattern replacement for common tactical terms
    const patterns = [
      [/position/g, '§p§'],
      [/formation/g, '§f§'],
      [/player/g, '§pl§'],
      [/"id":/g, '§i§'],
      [/"name":/g, '§n§'],
      [/"x":/g, '§x§'],
      [/"y":/g, '§y§'],
      [/null/g, '§0§'],
      [/true/g, '§1§'],
      [/false/g, '§2§'],
      [/"attributes":/g, '§a§'],
      [/"tactics":/g, '§t§'],
    ];

    let compressed = str;
    for (const [pattern, replacement] of patterns) {
      compressed = compressed.replace(pattern, replacement as string);
    }

    return compressed;
  }

  private static simpleDecompress(str: string): string {
    const patterns = [
      [/§p§/g, 'position'],
      [/§f§/g, 'formation'],
      [/§pl§/g, 'player'],
      [/§i§/g, '"id":'],
      [/§n§/g, '"name":'],
      [/§x§/g, '"x":'],
      [/§y§/g, '"y":'],
      [/§0§/g, 'null'],
      [/§1§/g, 'true'],
      [/§2§/g, 'false'],
      [/§a§/g, '"attributes":'],
      [/§t§/g, '"tactics":'],
    ];

    let decompressed = str;
    for (const [pattern, replacement] of patterns) {
      decompressed = decompressed.replace(pattern, replacement as string);
    }

    return decompressed;
  }
}

// Checksum utility for data integrity
class ChecksumEngine {
  static async generateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(jsonString);

    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback: Simple hash
      let hash = 0;
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(16);
    }
  }

  static async verifyChecksum(data: any, expectedChecksum: string): Promise<boolean> {
    const actualChecksum = await this.generateChecksum(data);
    return actualChecksum === expectedChecksum;
  }
}

// Advanced IndexedDB Manager
export class AdvancedIndexedDB {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private version: number;
  private isInitialized = false;
  private compressionEnabled: boolean;
  private cacheSizeLimit: number; // In bytes
  private currentCacheSize = 0;

  constructor(
    dbName = 'AstralTurfCache',
    version = 3,
    compressionEnabled = true,
    cacheSizeLimit = 100 * 1024 * 1024, // 100MB
  ) {
    this.dbName = dbName;
    this.version = version;
    this.compressionEnabled = compressionEnabled;
    this.cacheSizeLimit = cacheSizeLimit;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        this.calculateCurrentCacheSize();
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores with indexes
        if (!db.objectStoreNames.contains('formations')) {
          const formationStore = db.createObjectStore('formations', { keyPath: 'id' });
          formationStore.createIndex('timestamp', 'timestamp');
          formationStore.createIndex('version', 'version');
          formationStore.createIndex('type', 'data.type');
        }

        if (!db.objectStoreNames.contains('players')) {
          const playerStore = db.createObjectStore('players', { keyPath: 'id' });
          playerStore.createIndex('timestamp', 'timestamp');
          playerStore.createIndex('team', 'data.team');
          playerStore.createIndex('position', 'data.position');
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
          analyticsStore.createIndex('timestamp', 'timestamp');
          analyticsStore.createIndex('type', 'data.type');
        }

        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
          mediaStore.createIndex('timestamp', 'timestamp');
          mediaStore.createIndex('size', 'metadata.size');
        }

        // Metadata store for cache management
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'key' });
          metadataStore.put({
            key: 'cache_info',
            totalSize: 0,
            itemCount: 0,
            lastCleanup: Date.now(),
          });
        }
      };
    });
  }

  async set<K extends StoreNames>(
    store: K,
    key: string,
    data: DatabaseSchema[K]['data'],
    ttl = 24 * 60 * 60 * 1000, // 24 hours default
    metadata?: Record<string, any>,
  ): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Database not available');
    }

    const timestamp = Date.now();
    const checksum = await ChecksumEngine.generateChecksum(data);

    let finalData: any = data;
    let compressed = false;

    // Compress large data
    const dataSize = new Blob([JSON.stringify(data)]).size;

    if (this.compressionEnabled && dataSize > 1024) {
      // 1KB threshold
      try {
        const compressionResult = await CompressionEngine.compress(data);
        if (compressionResult.compressedSize < compressionResult.originalSize * 0.8) {
          finalData = Array.from(compressionResult.compressed);
          compressed = true;
          console.log(
            `[IndexedDB] Compressed ${store}:${key} from ${compressionResult.originalSize} to ${compressionResult.compressedSize} bytes`,
          );
        }
      } catch (error) {
        console.warn(`[IndexedDB] Compression failed for ${store}:${key}:`, error);
      }
    }

    const entry: CacheEntry = {
      data: finalData,
      timestamp,
      version: this.version,
      ttl,
      compressed,
      checksum,
      metadata: {
        ...metadata,
        originalSize: dataSize,
        compressedSize: compressed ? new Blob([JSON.stringify(finalData)]).size : dataSize,
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store, 'metadata'], 'readwrite');
      const objectStore = transaction.objectStore(store);

      const request = objectStore.put({ id: key, ...entry });

      request.onsuccess = () => {
        this.updateCacheMetadata(entry.metadata!.compressedSize);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async get<K extends StoreNames>(
    store: K,
    key: string,
  ): Promise<DatabaseSchema[K]['data'] | null> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Database not available');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(key);

      request.onsuccess = async () => {
        const result = request.result;

        if (!result) {
          resolve(null);
          return;
        }

        const entry = result as { id: string } & CacheEntry;

        // Check TTL
        if (Date.now() - entry.timestamp > entry.ttl) {
          this.delete(store, key); // Clean up expired entry
          resolve(null);
          return;
        }

        let data = entry.data;

        // Decompress if needed
        if (entry.compressed) {
          try {
            const compressedArray = new Uint8Array(entry.data);
            data = await CompressionEngine.decompress(compressedArray);
          } catch (error) {
            console.error(`[IndexedDB] Decompression failed for ${store}:${key}:`, error);
            resolve(null);
            return;
          }
        }

        // Verify checksum
        const isValid = await ChecksumEngine.verifyChecksum(data, entry.checksum);
        if (!isValid) {
          console.warn(`[IndexedDB] Checksum validation failed for ${store}:${key}`);
          this.delete(store, key); // Remove corrupted entry
          resolve(null);
          return;
        }

        resolve(data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async delete<K extends StoreNames>(store: K, key: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Database not available');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store, 'metadata'], 'readwrite');
      const objectStore = transaction.objectStore(store);

      // Get entry size first
      const getRequest = objectStore.get(key);

      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        const deleteRequest = objectStore.delete(key);

        deleteRequest.onsuccess = () => {
          if (entry?.metadata?.compressedSize) {
            this.updateCacheMetadata(-entry.metadata.compressedSize);
          }
          resolve();
        };

        deleteRequest.onerror = () => reject(deleteRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clear<K extends StoreNames>(store: K): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Database not available');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store, 'metadata'], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.clear();

      request.onsuccess = () => {
        this.calculateCurrentCacheSize(); // Recalculate after clear
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async cleanup(): Promise<{ deletedCount: number; freedBytes: number }> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Database not available');
    }

    const stores: StoreNames[] = ['formations', 'players', 'settings', 'analytics', 'media'];
    let deletedCount = 0;
    let freedBytes = 0;

    for (const storeName of stores) {
      const { deleted, bytes } = await this.cleanupStore(storeName);
      deletedCount += deleted;
      freedBytes += bytes;
    }

    // Update metadata
    await this.updateCleanupTimestamp();

    console.log(
      `[IndexedDB] Cleanup completed: ${deletedCount} items deleted, ${freedBytes} bytes freed`,
    );

    return { deletedCount, freedBytes };
  }

  private async cleanupStore(storeName: StoreNames): Promise<{ deleted: number; bytes: number }> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.openCursor();

      let deletedCount = 0;
      let freedBytes = 0;

      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor) {
          const entry = cursor.value as { id: string } & CacheEntry;
          const isExpired = Date.now() - entry.timestamp > entry.ttl;

          if (isExpired) {
            cursor.delete();
            deletedCount++;
            freedBytes += entry.metadata?.compressedSize || 0;
          }

          cursor.continue();
        } else {
          resolve({ deleted: deletedCount, bytes: freedBytes });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async calculateCurrentCacheSize(): Promise<void> {
    if (!this.db) {
      return;
    }

    const stores: StoreNames[] = ['formations', 'players', 'settings', 'analytics', 'media'];
    let totalSize = 0;
    let itemCount = 0;

    for (const storeName of stores) {
      const { size, count } = await this.getStoreSize(storeName);
      totalSize += size;
      itemCount += count;
    }

    this.currentCacheSize = totalSize;

    // Update metadata
    const transaction = this.db.transaction('metadata', 'readwrite');
    const metadataStore = transaction.objectStore('metadata');

    metadataStore.put({
      key: 'cache_info',
      totalSize,
      itemCount,
      lastCalculation: Date.now(),
    });
  }

  private async getStoreSize(storeName: StoreNames): Promise<{ size: number; count: number }> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.openCursor();

      let totalSize = 0;
      let count = 0;

      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor) {
          const entry = cursor.value as { id: string } & CacheEntry;
          totalSize += entry.metadata?.compressedSize || 0;
          count++;
          cursor.continue();
        } else {
          resolve({ size: totalSize, count });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async updateCacheMetadata(sizeChange: number): Promise<void> {
    if (!this.db) {
      return;
    }

    this.currentCacheSize += sizeChange;

    // Check if we need to trigger cleanup
    if (this.currentCacheSize > this.cacheSizeLimit) {
      console.warn(
        `[IndexedDB] Cache size limit exceeded (${this.currentCacheSize} > ${this.cacheSizeLimit}), triggering cleanup`,
      );
      this.cleanup();
    }
  }

  private async updateCleanupTimestamp(): Promise<void> {
    if (!this.db) {
      return;
    }

    const transaction = this.db.transaction('metadata', 'readwrite');
    const metadataStore = transaction.objectStore('metadata');

    const request = metadataStore.get('cache_info');

    request.onsuccess = () => {
      const metadata = request.result || {};
      metadata.lastCleanup = Date.now();
      metadataStore.put({ key: 'cache_info', ...metadata });
    };
  }

  async getStats(): Promise<{
    totalSize: number;
    itemCount: number;
    stores: Record<StoreNames, { size: number; count: number }>;
    compressionRatio: number;
  }> {
    if (!this.db) {
      await this.initialize();
    }

    const stores: StoreNames[] = ['formations', 'players', 'settings', 'analytics', 'media'];
    const storeStats: Record<StoreNames, { size: number; count: number }> = {} as any;

    let totalSize = 0;
    let itemCount = 0;
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (const storeName of stores) {
      const stats = await this.getDetailedStoreStats(storeName);
      storeStats[storeName] = { size: stats.size, count: stats.count };
      totalSize += stats.size;
      itemCount += stats.count;
      totalOriginalSize += stats.originalSize;
      totalCompressedSize += stats.compressedSize;
    }

    const compressionRatio = totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 1;

    return {
      totalSize,
      itemCount,
      stores: storeStats,
      compressionRatio,
    };
  }

  private async getDetailedStoreStats(storeName: StoreNames): Promise<{
    size: number;
    count: number;
    originalSize: number;
    compressedSize: number;
  }> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.openCursor();

      let totalSize = 0;
      let count = 0;
      let originalSize = 0;
      let compressedSize = 0;

      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor) {
          const entry = cursor.value as { id: string } & CacheEntry;
          const entrySize = entry.metadata?.compressedSize || 0;

          totalSize += entrySize;
          count++;
          originalSize += entry.metadata?.originalSize || entrySize;
          compressedSize += entrySize;

          cursor.continue();
        } else {
          resolve({ size: totalSize, count, originalSize, compressedSize });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Global instance
export const advancedDB = new AdvancedIndexedDB();

// High-level convenience functions
export async function cacheFormation(formation: Formation, ttl?: number): Promise<void> {
  await advancedDB.set('formations', formation.id, formation, ttl);
}

export async function getCachedFormation(id: string): Promise<Formation | null> {
  return advancedDB.get('formations', id);
}

export async function cachePlayer(player: Player, ttl?: number): Promise<void> {
  await advancedDB.set('players', player.id, player, ttl);
}

export async function getCachedPlayer(id: string): Promise<Player | null> {
  return advancedDB.get('players', id);
}

export async function cacheAnalytics(key: string, data: any, ttl?: number): Promise<void> {
  await advancedDB.set('analytics', key, data, ttl);
}

export async function getCachedAnalytics(key: string): Promise<any> {
  return advancedDB.get('analytics', key);
}

export async function clearAllCaches(): Promise<void> {
  const stores: StoreNames[] = ['formations', 'players', 'settings', 'analytics', 'media'];

  for (const store of stores) {
    await advancedDB.clear(store);
  }
}

export default {
  AdvancedIndexedDB,
  advancedDB,
  cacheFormation,
  getCachedFormation,
  cachePlayer,
  getCachedPlayer,
  cacheAnalytics,
  getCachedAnalytics,
  clearAllCaches,
};
