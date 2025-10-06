/* eslint-env serviceworker */
/* eslint-disable no-console */
/// <reference lib="webworker" />

/**
 * Service Worker for Astral Turf PWA
 * Provides offline capabilities, caching, and background sync
 */

const STATIC_CACHE = 'astral-turf-static-v8.0.0';
const DYNAMIC_CACHE = 'astral-turf-dynamic-v8.0.0';
const API_CACHE = 'astral-turf-api-v8.0.0';

// Files to cache immediately on service worker install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Core CSS and JS will be added by build process
];

// API endpoints to cache
const API_ENDPOINTS = ['/api/formations', '/api/players', '/api/analytics', '/api/auth/validate'];

// Network-first resources (always try network first)
const NETWORK_FIRST = ['/api/auth', '/api/sync', '/api/realtime'];

// Cache-first resources (use cache if available)
const CACHE_FIRST = ['/icons/', '/images/', '/fonts/', '.woff2', '.woff', '.ttf'];

type SyncType = 'formation' | 'player' | 'analytics';
type OfflineEntity = Record<string, unknown>;

interface SyncData {
  type: SyncType;
  data: OfflineEntity;
  timestamp: number;
  retries: number;
}

const isOfflineEntity = (value: unknown): value is OfflineEntity =>
  typeof value === 'object' && value !== null;

const sw = self as unknown as globalThis.ServiceWorkerGlobalScope;

type WorkerRequest = globalThis.Request;
type WorkerResponse = globalThis.Response;
type ExtendableEvent = globalThis.ExtendableEvent;
type FetchEvent = globalThis.FetchEvent;
type PushEvent = globalThis.PushEvent;
type ExtendableMessageEvent = globalThis.ExtendableMessageEvent;

type BackgroundSyncEvent = ExtendableEvent & { readonly tag?: string };
type PushNotificationEvent = PushEvent & {
  readonly data?: {
    text(): string;
  };
};
type NotificationClickEvent = ExtendableEvent & {
  readonly action?: string;
  readonly notification: globalThis.Notification;
};

const isSyncType = (value: unknown): value is SyncType =>
  value === 'formation' || value === 'player' || value === 'analytics';

const determineSyncTypeFromRequest = (request: WorkerRequest): SyncType | null => {
  const { url } = request;

  if (url.includes('/api/formations')) {
    return 'formation';
  }

  if (url.includes('/api/players')) {
    return 'player';
  }

  if (url.includes('/api/analytics')) {
    return 'analytics';
  }

  return null;
};

type ServiceWorkerMessage =
  | { type: 'SKIP_WAITING' }
  | { type: 'CACHE_INVALIDATE'; data: { cacheName: string } }
  | { type: 'SYNC_DATA'; data: { type: SyncType; payload: OfflineEntity } };

const isServiceWorkerMessage = (value: unknown): value is ServiceWorkerMessage => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const message = value as { type?: unknown; data?: unknown };

  if (message.type === 'SKIP_WAITING') {
    return true;
  }

  if (message.type === 'CACHE_INVALIDATE') {
    const data = message.data as { cacheName?: unknown } | undefined;
    return typeof data?.cacheName === 'string';
  }

  if (message.type === 'SYNC_DATA') {
    const data = message.data as { type?: unknown; payload?: unknown } | undefined;
    return isSyncType(data?.type) && isOfflineEntity(data?.payload);
  }

  return false;
};

class ServiceWorkerManager {
  private db: globalThis.IDBDatabase | null = null;
  private syncQueue: SyncData[] = [];

  constructor() {
    this.initIndexedDB();
  }

  // Initialize IndexedDB for offline data storage
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = sw.indexedDB.open('AstralTurfDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as globalThis.IDBOpenDBRequest).result;

        // Formations store
        if (!db.objectStoreNames.contains('formations')) {
          const formationsStore = db.createObjectStore('formations', { keyPath: 'id' });
          formationsStore.createIndex('timestamp', 'timestamp');
          formationsStore.createIndex('syncStatus', 'syncStatus');
        }

        // Players store
        if (!db.objectStoreNames.contains('players')) {
          const playersStore = db.createObjectStore('players', { keyPath: 'id' });
          playersStore.createIndex('timestamp', 'timestamp');
          playersStore.createIndex('syncStatus', 'syncStatus');
        }

        // Analytics store
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
          analyticsStore.createIndex('timestamp', 'timestamp');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          syncStore.createIndex('type', 'type');
          syncStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  // Store data in IndexedDB
  async storeOfflineData(storeName: string, data: OfflineEntity): Promise<void> {
    if (!this.db) {
      await this.initIndexedDB();
    }

    const db = this.db;
    if (!db) {
      throw new Error('IndexedDB unavailable');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const dataWithMeta: OfflineEntity = {
        ...data,
        timestamp: Date.now(),
        syncStatus: 'pending',
      };

      const request = store.put(dataWithMeta);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Retrieve data from IndexedDB
  async getOfflineData(
    storeName: string,
    id?: string
  ): Promise<OfflineEntity | OfflineEntity[] | undefined> {
    if (!this.db) {
      await this.initIndexedDB();
    }

    const db = this.db;
    if (!db) {
      throw new Error('IndexedDB unavailable');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      const request = id ? store.get(id) : store.getAll();
      request.onsuccess = () =>
        resolve(request.result as OfflineEntity | OfflineEntity[] | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  // Add item to sync queue
  async addToSyncQueue(type: SyncType, data: OfflineEntity): Promise<void> {
    const syncItem: SyncData = {
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.syncQueue.push(syncItem);

    if (this.db) {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      store.add(syncItem);
    }
  }

  // Process sync queue when online
  async processSyncQueue(): Promise<void> {
    const isOnline = sw.navigator?.onLine ?? true;
    if (!isOnline || this.syncQueue.length === 0) {
      return;
    }

    const itemsToSync = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of itemsToSync) {
      try {
        await this.syncItem(item);
      } catch (error) {
        console.error('Sync failed for item:', item, error);

        // Retry logic
        if (item.retries < 3) {
          item.retries++;
          this.syncQueue.push(item);
        }
      }
    }
  }

  // Sync individual item
  private async syncItem(item: SyncData): Promise<void> {
    const endpoint = this.getEndpointForType(item.type);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
  }

  private getEndpointForType(type: SyncData['type']): string {
    switch (type) {
      case 'formation':
        return '/api/formations';
      case 'player':
        return '/api/players';
      case 'analytics':
        return '/api/analytics';
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  }
}

const swManager = new ServiceWorkerManager();

sw.addEventListener('install', event => {
  const installEvent = event as ExtendableEvent;

  installEvent.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)),
      sw.skipWaiting(),
    ])
  );
});

sw.addEventListener('activate', event => {
  const activateEvent = event as ExtendableEvent;

  activateEvent.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        const obsoleteCaches = cacheNames.filter(
          cacheName =>
            cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE
        );

        return Promise.all(obsoleteCaches.map(cacheName => caches.delete(cacheName)));
      }),
      sw.clients.claim(),
    ])
  );
});

sw.addEventListener('fetch', event => {
  const fetchEvent = event as FetchEvent;
  const { request } = fetchEvent;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  if (NETWORK_FIRST.some(pattern => url.pathname.includes(pattern))) {
    fetchEvent.respondWith(networkFirstStrategy(request));
  } else if (CACHE_FIRST.some(pattern => url.pathname.includes(pattern))) {
    fetchEvent.respondWith(cacheFirstStrategy(request));
  } else if (API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
    fetchEvent.respondWith(staleWhileRevalidateStrategy(request));
  } else if (url.pathname === '/' || url.pathname.includes('.html')) {
    fetchEvent.respondWith(networkFirstWithOfflineFallback(request));
  } else {
    fetchEvent.respondWith(cacheFirstStrategy(request));
  }
});

async function networkFirstStrategy(request: WorkerRequest): Promise<WorkerResponse> {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(JSON.stringify({ error: 'Offline - data not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirstStrategy(request: WorkerRequest): Promise<WorkerResponse> {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

async function staleWhileRevalidateStrategy(request: WorkerRequest): Promise<WorkerResponse> {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);
  const requestClone = request.clone();

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    if (request.method === 'POST') {
      const syncType = determineSyncTypeFromRequest(requestClone);

      if (syncType) {
        try {
          const payload = await requestClone.json();
          if (isOfflineEntity(payload)) {
            await swManager.addToSyncQueue(syncType, payload);
          }
        } catch (parseError) {
          console.warn('Failed to parse request body for sync queue', parseError);
        }
      }
    }

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(JSON.stringify({ error: 'Offline - data not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkFirstWithOfflineFallback(request: WorkerRequest): Promise<WorkerResponse> {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }

    return new Response('Offline', { status: 503 });
  }
}

sw.addEventListener('sync', event => {
  const syncEvent = event as BackgroundSyncEvent;

  if (syncEvent.tag === 'background-sync') {
    syncEvent.waitUntil(swManager.processSyncQueue());
  }
});

sw.addEventListener('push', event => {
  const pushEvent = event as PushNotificationEvent;

  const options = {
    body: pushEvent.data?.text() ?? 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png',
      },
    ],
  };

  pushEvent.waitUntil(sw.registration.showNotification('Astral Turf', options));
});

sw.addEventListener('notificationclick', event => {
  const notificationEvent = event as NotificationClickEvent;

  notificationEvent.notification.close();

  if (notificationEvent.action === 'explore') {
    notificationEvent.waitUntil(sw.clients.openWindow('/'));
  }
});

sw.addEventListener('message', event => {
  const messageEvent = event as ExtendableMessageEvent;
  const message = messageEvent.data;

  if (!isServiceWorkerMessage(message)) {
    console.warn('Unknown message received by service worker', message);
    return;
  }

  switch (message.type) {
    case 'SKIP_WAITING':
      sw.skipWaiting();
      break;
    case 'CACHE_INVALIDATE':
      void caches.delete(message.data.cacheName);
      break;
    case 'SYNC_DATA':
      void swManager.addToSyncQueue(message.data.type, message.data.payload);
      break;
  }
});

export {};
