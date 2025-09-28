/**
 * Service Worker for Astral Turf PWA
 * Provides offline capabilities, caching, and background sync
 */

const CACHE_NAME = 'astral-turf-v8.0.0';
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
const API_ENDPOINTS = [
  '/api/formations',
  '/api/players',
  '/api/analytics',
  '/api/auth/validate',
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
  '/api/auth',
  '/api/sync',
  '/api/realtime',
];

// Cache-first resources (use cache if available)
const CACHE_FIRST = [
  '/icons/',
  '/images/',
  '/fonts/',
  '.woff2',
  '.woff',
  '.ttf',
];

interface SyncData {
  type: 'formation' | 'player' | 'analytics';
  data: any;
  timestamp: number;
  retries: number;
}

class ServiceWorkerManager {
  private db: IDBDatabase | null = null;
  private syncQueue: SyncData[] = [];

  constructor() {
    this.initIndexedDB();
  }

  // Initialize IndexedDB for offline data storage
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AstralTurfDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

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
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('type', 'type');
          syncStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  // Store data in IndexedDB
  async storeOfflineData(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const dataWithMeta = {
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
  async getOfflineData(storeName: string, id?: string): Promise<any> {
    if (!this.db) await this.initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = id ? store.get(id) : store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Add item to sync queue
  async addToSyncQueue(type: SyncData['type'], data: any): Promise<void> {
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
    if (!navigator.onLine || this.syncQueue.length === 0) return;

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

// Service Worker Event Listeners
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)),
      self.skipWaiting(),
    ])
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different caching strategies
  if (NETWORK_FIRST.some(pattern => url.pathname.includes(pattern))) {
    event.respondWith(networkFirstStrategy(request));
  } else if (CACHE_FIRST.some(pattern => url.pathname.includes(pattern))) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else if (url.pathname === '/' || url.pathname.includes('.html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
  } else {
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Network First Strategy (for critical API calls)
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(
      JSON.stringify({ error: 'Offline - data not available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Cache First Strategy (for static assets)
async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch {
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

// Stale While Revalidate Strategy (for API data)
async function staleWhileRevalidateStrategy(request: Request): Promise<Response> {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Store failed request for background sync
    if (request.method === 'POST') {
      request.json().then(data => {
        swManager.addToSyncQueue('formation', data); // Determine type dynamically
      });
    }
    throw new Error('Network error');
  });

  return cachedResponse || fetchPromise;
}

// Network First with Offline Fallback (for HTML pages)
async function networkFirstWithOfflineFallback(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

// Background Sync
self.addEventListener('sync', (event: any) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(swManager.processSyncQueue());
  }
});

// Push Notifications
self.addEventListener('push', (event: PushEvent) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data?.text() || 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Astral Turf', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('Notification click received.');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Online/Offline detection
self.addEventListener('online', () => {
  console.log('App is online - processing sync queue');
  swManager.processSyncQueue();
});

// Message handling from main thread
self.addEventListener('message', (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_INVALIDATE':
      caches.delete(data.cacheName);
      break;
    case 'SYNC_DATA':
      swManager.addToSyncQueue(data.type, data.payload);
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

export {};