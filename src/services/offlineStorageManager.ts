/**
 * Offline-First Storage Manager using IndexedDB
 * Provides persistent storage for tactics boards, formations, and offline capabilities
 */

/* eslint-disable no-console */
import { useState, useEffect } from 'react';

// IndexedDB Configuration
const DB_NAME = 'AstralTurfOfflineDB';
const DB_VERSION = 1;
const STORES = {
  FORMATIONS: 'formations',
  PLAYERS: 'players',
  TEAMS: 'teams',
  TACTICS: 'tactics',
  SYNC_QUEUE: 'syncQueue',
  CACHE_META: 'cacheMeta',
};

export interface OfflineData {
  id: string;
  data: unknown;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  lastModified: number;
}

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  storeName: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
}

class OfflineStorageManager {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncListeners: Set<() => void> = new Set();

  constructor() {
    this.initializeDB();
    this.setupOnlineListeners();
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.values(STORES).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('syncStatus', 'syncStatus', { unique: false });
            console.log(`✅ Created object store: ${storeName}`);
          }
        });
      };
    });
  }

  /**
   * Setup online/offline listeners
   */
  private setupOnlineListeners(): void {
    window.addEventListener('online', () => {
      console.log('📶 Back online - syncing data...');
      this.isOnline = true;
      this.syncPendingData();
      this.notifySyncListeners();
    });

    window.addEventListener('offline', () => {
      console.log('📵 Offline mode activated');
      this.isOnline = false;
      this.notifySyncListeners();
    });
  }

  /**
   * Add sync listener
   */
  public addSyncListener(listener: () => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  /**
   * Notify sync listeners
   */
  private notifySyncListeners(): void {
    this.syncListeners.forEach((listener) => listener());
  }

  /**
   * Get online status
   */
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Save data to IndexedDB
   */
  public async save<T>(
    storeName: string,
    id: string,
    data: T,
    syncImmediately = true,
  ): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    const offlineData: OfflineData = {
      id,
      data,
      timestamp: Date.now(),
      syncStatus: this.isOnline && syncImmediately ? 'synced' : 'pending',
      lastModified: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(offlineData);

      request.onsuccess = () => {
        console.log(`✅ Saved to ${storeName}: ${id}`);

        // Add to sync queue if offline
        if (!this.isOnline || !syncImmediately) {
          this.addToSyncQueue('update', storeName, offlineData);
        }

        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get data from IndexedDB
   */
  public async get<T>(storeName: string, id: string): Promise<T | null> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as OfflineData | undefined;
        resolve(result ? (result.data as T) : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all data from a store
   */
  public async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as OfflineData[];
        resolve(results.map((r) => r.data as T));
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete data from IndexedDB
   */
  public async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`🗑️ Deleted from ${storeName}: ${id}`);

        // Add to sync queue if offline
        if (!this.isOnline) {
          this.addToSyncQueue('delete', storeName, { id });
        }

        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add operation to sync queue
   */
  private async addToSyncQueue(
    operation: 'create' | 'update' | 'delete',
    storeName: string,
    data: unknown,
  ): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: `${storeName}-${Date.now()}-${Math.random()}`,
      operation,
      storeName,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.put(queueItem);

      request.onsuccess = () => {
        console.log(`📥 Added to sync queue: ${queueItem.id}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync pending data to server
   */
  public async syncPendingData(): Promise<void> {
    if (!this.isOnline || !this.db) {
      return;
    }

    console.log('🔄 Starting data synchronization...');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.getAll();

      request.onsuccess = async () => {
        const queue = request.result as SyncQueueItem[];
        console.log(`📊 Found ${queue.length} items to sync`);

        for (const item of queue) {
          try {
            await this.syncItem(item);
          } catch (error) {
            console.error(`❌ Failed to sync item: ${item.id}`, error);
          }
        }

        console.log('✅ Synchronization complete');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    // This would call your actual API
    // For now, we'll just mark it as synced
    console.log(`🔄 Syncing ${item.operation} on ${item.storeName}`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Remove from sync queue after successful sync
    const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    store.delete(item.id);

    // Update sync status in original store
    if (item.operation !== 'delete') {
      const dataTransaction = this.db!.transaction([item.storeName], 'readwrite');
      const dataStore = dataTransaction.objectStore(item.storeName);
      const data = item.data as OfflineData;
      data.syncStatus = 'synced';
      dataStore.put(data);
    }
  }

  /**
   * Clear all offline data
   */
  public async clearAll(): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    const stores = Object.values(STORES);
    const promises = stores.map(
      (storeName) =>
        new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onsuccess = () => {
            console.log(`🗑️ Cleared ${storeName}`);
            resolve();
          };

          request.onerror = () => reject(request.error);
        }),
    );

    await Promise.all(promises);
    console.log('✅ All offline data cleared');
  }

  /**
   * Get storage stats
   */
  public async getStorageStats(): Promise<{
    totalItems: number;
    pendingSyncItems: number;
    storageUsed: number;
    stores: Record<string, number>;
  }> {
    if (!this.db) {
      await this.initializeDB();
    }

    const stats = {
      totalItems: 0,
      pendingSyncItems: 0,
      storageUsed: 0,
      stores: {} as Record<string, number>,
    };

    const stores = Object.values(STORES);
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const countRequest = store.count();

      await new Promise<void>((resolve) => {
        countRequest.onsuccess = () => {
          const count = countRequest.result;
          stats.stores[storeName] = count;
          stats.totalItems += count;

          if (storeName === STORES.SYNC_QUEUE) {
            stats.pendingSyncItems = count;
          }

          resolve();
        };
      });
    }

    // Estimate storage (rough approximation)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      stats.storageUsed = estimate.usage || 0;
    }

    return stats;
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager();

// Export store names for easy access
export { STORES };

// React hook for offline storage
export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(offlineStorage.getOnlineStatus());

  useEffect(() => {
    return offlineStorage.addSyncListener(() => {
      setIsOnline(offlineStorage.getOnlineStatus());
    });
  }, []);

  return {
    isOnline,
    save: offlineStorage.save.bind(offlineStorage),
    get: offlineStorage.get.bind(offlineStorage),
    getAll: offlineStorage.getAll.bind(offlineStorage),
    delete: offlineStorage.delete.bind(offlineStorage),
    syncPendingData: offlineStorage.syncPendingData.bind(offlineStorage),
    clearAll: offlineStorage.clearAll.bind(offlineStorage),
    getStorageStats: offlineStorage.getStorageStats.bind(offlineStorage),
  };
};

export default offlineStorage;
