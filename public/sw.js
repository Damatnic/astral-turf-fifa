/* eslint-env serviceworker */
/**
 * Sigma Mobile Service Worker
 * Mobile-first PWA with comprehensive offline capabilities
 * Implements advanced caching, background sync, and mobile optimizations
 */

// Simple IndexedDB wrapper to replace external IDB dependency
const idb = {
  async openDB(name, version, options) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        if (options?.upgrade) {
          options.upgrade(event.target.result);
        }
      };
    });
  }
};

// Mobile-specific configuration
const MOBILE_CONFIG = {
  enableBackgroundSync: true,
  enablePushNotifications: true,
  enableOfflineFormations: true,
  maxOfflineFormations: 50,
  syncRetryAttempts: 3,
  compressionEnabled: true,
};

const CACHE_VERSION = 'astral-turf-mobile-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;
const FORMATION_CACHE = `${CACHE_VERSION}-formations`;

// Advanced cache configuration
const CACHE_CONFIG = {
  static: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 200,
  },
  dynamic: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 100,
  },
  images: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 500,
  },
  api: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50,
  },
  formations: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 200,
  },
};

// Mobile-optimized resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html',
];

// Critical mobile assets for immediate caching
const MOBILE_CRITICAL_ASSETS = [
  '/static/css/mobile.css',
  '/static/js/mobile-optimizations.js',
  '/static/js/touch-gestures.js',
];

// URL patterns for different cache strategies
const CACHE_STRATEGIES = {
  static: [/\.(?:js|css|woff2?|ttf|eot)$/, /\/static\//, /\/assets\//],
  images: [/\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/, /\/images\//, /\/icons\//],
  api: [/\/api\//, /\/graphql/],
  formations: [/\/formations\//, /formation.*\.json$/],
  dynamic: [/\.html$/, /\/$/],
};

// Performance monitoring
class PerformanceMonitor {
  static logCacheHit(cacheName, url) {
    console.log(`[SW] Cache HIT: ${cacheName} - ${url}`);
  }

  static logCacheMiss(url) {
    console.log(`[SW] Cache MISS: ${url}`);
  }

  static logNetworkFallback(url, reason) {
    console.log(`[SW] Network fallback: ${url} - ${reason}`);
  }
}

// Advanced cache management
class CacheManager {
  static async cleanupCache(cacheName, config) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    const now = Date.now();
    let deletedCount = 0;

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cachedTime = new Date(response.headers.get('sw-cached-time') || 0).getTime();
        const age = now - cachedTime;

        if (age > config.maxAge) {
          await cache.delete(request);
          deletedCount++;
        }
      }
    }

    // Enforce max entries limit
    if (requests.length > config.maxEntries) {
      const excessCount = requests.length - config.maxEntries;
      for (let i = 0; i < excessCount; i++) {
        await cache.delete(requests[i]);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[SW] Cleaned up ${deletedCount} entries from ${cacheName}`);
    }
  }

  static async addToCache(cacheName, request, response, config) {
    const cache = await caches.open(cacheName);

    // Clone response and add cache timestamp
    const responseClone = response.clone();
    const responseWithTimestamp = new Response(responseClone.body, {
      status: responseClone.status,
      statusText: responseClone.statusText,
      headers: {
        ...Object.fromEntries(responseClone.headers.entries()),
        'sw-cached-time': new Date().toISOString(),
      },
    });

    await cache.put(request, responseWithTimestamp);

    // Trigger cleanup if needed (async)
    setTimeout(() => this.cleanupCache(cacheName, config), 0);
  }

  static async getFromCache(cacheName, request) {
    const cache = await caches.open(cacheName);
    const response = await cache.match(request);

    if (response) {
      const cachedTime = new Date(response.headers.get('sw-cached-time') || 0).getTime();
      const config = CACHE_CONFIG[cacheName.split('-').pop()];

      if (config && Date.now() - cachedTime > config.maxAge) {
        // Expired, remove from cache
        await cache.delete(request);
        return null;
      }

      PerformanceMonitor.logCacheHit(cacheName, request.url);
      return response;
    }

    return null;
  }
}

// Request categorization
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // Check each strategy pattern
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    for (const pattern of patterns) {
      if (pattern.test(url.pathname) || pattern.test(url.href)) {
        return strategy;
      }
    }
  }

  return 'dynamic'; // Default strategy
}

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[SW] Installing enhanced service worker');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('[SW] Static assets pre-cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Pre-caching failed:', error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating enhanced service worker');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.startsWith(CACHE_VERSION)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),

      // Take control of all clients
      self.clients.claim(),
    ]).then(() => {
      console.log('[SW] Enhanced service worker activated');

      // Schedule periodic cache cleanup
      setInterval(
        () => {
          Object.entries(CACHE_CONFIG).forEach(([type, config]) => {
            const cacheName = `${CACHE_VERSION}-${type}`;
            CacheManager.cleanupCache(cacheName, config);
          });
        },
        60 * 60 * 1000,
      ); // Every hour
    }),
  );
});

// Fetch event - implement advanced caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }

  // Skip external font requests (let browser handle them directly)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    return;
  }

  // Skip requests to different origins (except for allowed external resources)
  if (url.origin !== self.location.origin && !url.hostname.includes('cdn')) {
    return;
  }

  // CRITICAL: Skip Vite development server resources
  if (
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/@fs/') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('?t=') || // Vite timestamp queries
    url.pathname.includes('?import') || // Vite import queries
    url.pathname.endsWith('.tsx') || // Source files in dev
    url.pathname.endsWith('.ts') || // Source files in dev
    url.pathname.endsWith('.jsx') || // Source files in dev
    url.searchParams.has('import') || // Vite import parameter
    url.searchParams.has('t') // Vite timestamp parameter
  ) {
    // Let these requests go directly to network (bypass service worker)
    return;
  }

  event.respondWith(handleEnhancedRequest(event));
});

// Main enhanced request handler
async function handleEnhancedRequest(event) {
  const { request } = event;
  const strategy = getCacheStrategy(request);

  let cacheName;
  let handler;

  switch (strategy) {
    case 'static':
      cacheName = STATIC_CACHE;
      handler = enhancedCacheFirst;
      break;
    case 'images':
      cacheName = IMAGE_CACHE;
      handler = enhancedCacheFirst;
      break;
    case 'api':
      cacheName = API_CACHE;
      handler = enhancedNetworkFirst;
      break;
    case 'formations':
      cacheName = FORMATION_CACHE;
      handler = enhancedStaleWhileRevalidate;
      break;
    case 'dynamic':
    default:
      cacheName = DYNAMIC_CACHE;
      handler = enhancedStaleWhileRevalidate;
      break;
  }

  return handler(request, cacheName);
}

// Enhanced cache-first strategy
async function enhancedCacheFirst(request, cacheName) {
  const cachedResponse = await CacheManager.getFromCache(cacheName, request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const config = CACHE_CONFIG[cacheName.split('-').pop()];
      await CacheManager.addToCache(cacheName, request, networkResponse, config);
    }

    return networkResponse;
  } catch (error) {
    PerformanceMonitor.logNetworkFallback(request.url, error.message);

    // Return offline fallback if available
    if (request.destination === 'document') {
      const fallback = (await caches.match('/offline.html')) || (await caches.match('/'));
      if (fallback) {
        return fallback;
      }
    }

    throw error;
  }
}

// Enhanced network-first strategy
async function enhancedNetworkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const config = CACHE_CONFIG[cacheName.split('-').pop()];
      await CacheManager.addToCache(cacheName, request, networkResponse, config);
    }

    return networkResponse;
  } catch (error) {
    PerformanceMonitor.logNetworkFallback(request.url, error.message);

    const cachedResponse = await CacheManager.getFromCache(cacheName, request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Enhanced stale-while-revalidate strategy
async function enhancedStaleWhileRevalidate(request, cacheName) {
  const cachedResponse = await CacheManager.getFromCache(cacheName, request);

  // Start network request
  const networkPromise = fetch(request)
    .then(async networkResponse => {
      if (networkResponse.ok) {
        const config = CACHE_CONFIG[cacheName.split('-').pop()];
        await CacheManager.addToCache(cacheName, request, networkResponse, config);
      }
      return networkResponse;
    })
    .catch(error => {
      PerformanceMonitor.logNetworkFallback(request.url, error.message);
      return null;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    // Update cache in background
    networkPromise.catch(() => {}); // Ignore background errors
    return cachedResponse;
  }

  // No cached response, wait for network
  const networkResponse = await networkPromise;

  if (networkResponse) {
    return networkResponse;
  }

  throw new Error('No cached response and network failed');
}

// Caching strategy implementations
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }

  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  });

  return cached || (await networkPromise);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function cacheFirstWithNetworkFallback(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // For HTML requests, return a cached fallback or offline page
    const fallback = await caches.match('/');
    return fallback || new Response('Offline', { status: 503 });
  }
}

async function networkWithCacheFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Enhanced background sync for mobile offline functionality
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);

  switch (event.tag) {
    case 'formation-save':
      event.waitUntil(syncFormationSaves());
      break;
    case 'player-update':
      event.waitUntil(syncPlayerUpdates());
      break;
    case 'analytics-sync':
      event.waitUntil(syncAnalytics());
      break;
    case 'offline-actions':
      event.waitUntil(syncOfflineActions());
      break;
    case 'mobile-telemetry':
      event.waitUntil(syncMobileTelemetry());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Enhanced message handling for mobile features
self.addEventListener('message', event => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_STATS':
      handleCacheStatsRequest(event);
      break;
    case 'CLEAR_CACHE':
      handleClearCacheRequest(event, payload);
      break;
    case 'PRELOAD_RESOURCES':
      handlePreloadRequest(event, payload);
      break;
    case 'STORE_OFFLINE_FORMATION':
      handleOfflineFormationStore(event, payload);
      break;
    case 'GET_OFFLINE_FORMATIONS':
      handleOfflineFormationsGet(event);
      break;
    case 'QUEUE_OFFLINE_ACTION':
      handleOfflineActionQueue(event, payload);
      break;
    case 'GET_NETWORK_STATUS':
      handleNetworkStatusRequest(event);
      break;
    case 'ENABLE_MOBILE_OPTIMIZATIONS':
      handleMobileOptimizationsToggle(event, payload);
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Mobile-optimized IndexedDB management
let db;

async function initMobileDB() {
  if (db) {
    return db;
  }

  db = await idb.openDB('AstralTurfMobile', 1, {
    upgrade(db) {
      // Offline formations store
      if (!db.objectStoreNames.contains('offlineFormations')) {
        const formationsStore = db.createObjectStore('offlineFormations', { keyPath: 'id' });
        formationsStore.createIndex('timestamp', 'timestamp');
        formationsStore.createIndex('syncStatus', 'syncStatus');
      }

      // Offline actions queue
      if (!db.objectStoreNames.contains('offlineActions')) {
        const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
        actionsStore.createIndex('timestamp', 'timestamp');
        actionsStore.createIndex('type', 'type');
        actionsStore.createIndex('priority', 'priority');
      }

      // Mobile telemetry
      if (!db.objectStoreNames.contains('mobileTelemetry')) {
        const telemetryStore = db.createObjectStore('mobileTelemetry', { keyPath: 'id' });
        telemetryStore.createIndex('timestamp', 'timestamp');
        telemetryStore.createIndex('type', 'type');
      }

      // Player data cache
      if (!db.objectStoreNames.contains('playersCache')) {
        const playersStore = db.createObjectStore('playersCache', { keyPath: 'id' });
        playersStore.createIndex('lastModified', 'lastModified');
      }
    },
  });

  return db;
}

async function syncFormationSaves() {
  console.log('[SW] Syncing offline formation saves...');

  try {
    const db = await initMobileDB();
    const tx = db.transaction('offlineFormations', 'readwrite');
    const store = tx.objectStore('offlineFormations');

    // Get all pending formations
    const pendingFormations = await store.index('syncStatus').getAll('pending');

    for (const formation of pendingFormations) {
      try {
        // Attempt to sync with server
        const response = await fetch('/api/formations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formation.data),
        });

        if (response.ok) {
          // Mark as synced
          formation.syncStatus = 'synced';
          formation.syncedAt = Date.now();
          await store.put(formation);
          console.log('[SW] Formation synced:', formation.id);
        } else {
          throw new Error(`Sync failed: ${response.status}`);
        }
      } catch (error) {
        console.warn('[SW] Formation sync failed:', formation.id, error);
        formation.retryCount = (formation.retryCount || 0) + 1;

        if (formation.retryCount >= MOBILE_CONFIG.syncRetryAttempts) {
          formation.syncStatus = 'failed';
        }

        await store.put(formation);
      }
    }

    await tx.complete;
    console.log('[SW] Formation sync completed');
  } catch (error) {
    console.error('[SW] Formation sync failed:', error);
    throw error;
  }
}

async function syncPlayerUpdates() {
  console.log('[SW] Syncing player updates...');

  try {
    const db = await initMobileDB();
    const tx = db.transaction('offlineActions', 'readonly');
    const store = tx.objectStore('offlineActions');

    // Get player-related actions
    const playerActions = await store.index('type').getAll('player-update');

    for (const action of playerActions) {
      try {
        const response = await fetch(`/api/players/${action.data.playerId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action.data.updates),
        });

        if (response.ok) {
          // Remove from queue
          const deleteTx = db.transaction('offlineActions', 'readwrite');
          await deleteTx.objectStore('offlineActions').delete(action.id);
          await deleteTx.complete;
        }
      } catch (error) {
        console.warn('[SW] Player update sync failed:', action.id, error);
      }
    }

    console.log('[SW] Player updates synced');
  } catch (error) {
    console.error('[SW] Player update sync failed:', error);
    throw error;
  }
}

async function syncOfflineActions() {
  console.log('[SW] Syncing offline actions...');

  try {
    const db = await initMobileDB();
    const tx = db.transaction('offlineActions', 'readwrite');
    const store = tx.objectStore('offlineActions');

    // Get all pending actions sorted by priority and timestamp
    const actions = await store.getAll();
    const sortedActions = actions.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp - b.timestamp; // Older first within same priority
    });

    for (const action of sortedActions) {
      try {
        await executeOfflineAction(action);
        await store.delete(action.id);
      } catch (error) {
        console.warn('[SW] Offline action failed:', action.id, error);
        action.retryCount = (action.retryCount || 0) + 1;

        if (action.retryCount >= MOBILE_CONFIG.syncRetryAttempts) {
          action.status = 'failed';
        }

        await store.put(action);
      }
    }

    await tx.complete;
    console.log('[SW] Offline actions sync completed');
  } catch (error) {
    console.error('[SW] Offline actions sync failed:', error);
    throw error;
  }
}

async function syncMobileTelemetry() {
  console.log('[SW] Syncing mobile telemetry...');

  try {
    const db = await initMobileDB();
    const tx = db.transaction('mobileTelemetry', 'readwrite');
    const store = tx.objectStore('mobileTelemetry');

    const telemetryData = await store.getAll();

    if (telemetryData.length > 0) {
      const response = await fetch('/api/telemetry/mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telemetryData),
      });

      if (response.ok) {
        // Clear synced telemetry
        await store.clear();
        console.log('[SW] Mobile telemetry synced');
      }
    }

    await tx.complete;
  } catch (error) {
    console.error('[SW] Mobile telemetry sync failed:', error);
    throw error;
  }
}

async function executeOfflineAction(action) {
  const { type, data } = action;

  switch (type) {
    case 'formation-update':
      return await fetch(`/api/formations/${data.formationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });

    case 'player-position-update':
      return await fetch(`/api/formations/${data.formationId}/positions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.positions),
      });

    case 'settings-update':
      return await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.settings),
      });

    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

async function syncAnalytics() {
  console.log('[SW] Syncing analytics data...');

  try {
    const db = await initMobileDB();
    const tx = db.transaction('mobileTelemetry', 'readonly');
    const store = tx.objectStore('mobileTelemetry');

    const analyticsData = await store.index('type').getAll('analytics');

    if (analyticsData.length > 0) {
      const response = await fetch('/api/analytics/mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyticsData.map(item => item.data)),
      });

      if (response.ok) {
        // Remove synced analytics
        const deleteTx = db.transaction('mobileTelemetry', 'readwrite');
        const deleteStore = deleteTx.objectStore('mobileTelemetry');

        for (const item of analyticsData) {
          await deleteStore.delete(item.id);
        }

        await deleteTx.complete;
        console.log('[SW] Analytics synced successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
    throw error;
  }
}

async function handleCacheStatsRequest(event) {
  try {
    const stats = {};

    for (const [type, config] of Object.entries(CACHE_CONFIG)) {
      const cacheName = `${CACHE_VERSION}-${type}`;
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      stats[type] = {
        entryCount: keys.length,
        maxEntries: config.maxEntries,
        maxAge: config.maxAge,
      };
    }

    event.ports[0].postMessage({
      type: 'CACHE_STATS_RESPONSE',
      payload: stats,
    });
  } catch (error) {
    event.ports[0].postMessage({
      type: 'CACHE_STATS_ERROR',
      payload: error.message,
    });
  }
}

async function handleClearCacheRequest(event, payload) {
  try {
    const { cacheType } = payload;

    if (cacheType === 'all') {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.filter(name => name.startsWith(CACHE_VERSION)).map(name => caches.delete(name)),
      );
    } else {
      const cacheName = `${CACHE_VERSION}-${cacheType}`;
      await caches.delete(cacheName);
    }

    event.ports[0].postMessage({
      type: 'CLEAR_CACHE_SUCCESS',
      payload: { cacheType },
    });
  } catch (error) {
    event.ports[0].postMessage({
      type: 'CLEAR_CACHE_ERROR',
      payload: error.message,
    });
  }
}

async function handlePreloadRequest(event, payload) {
  try {
    const { urls, cacheType = 'dynamic' } = payload;
    const cacheName = `${CACHE_VERSION}-${cacheType}`;
    const cache = await caches.open(cacheName);

    const promises = urls.map(async url => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.warn(`[SW] Failed to preload ${url}:`, error);
      }
    });

    await Promise.allSettled(promises);

    event.ports[0].postMessage({
      type: 'PRELOAD_SUCCESS',
      payload: { count: urls.length },
    });
  } catch (error) {
    event.ports[0].postMessage({
      type: 'PRELOAD_ERROR',
      payload: error.message,
    });
  }
}

// Enhanced mobile push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');

  let notificationData = {
    title: 'Astral Turf',
    body: 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/action-open.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png',
      },
    ],
    requireInteraction: false,
    silent: false,
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, notificationData));
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // If app is already open, focus it
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }

      // Open new window
      const urlToOpen = event.notification.data?.url || '/';
      return clients.openWindow(urlToOpen);
    }),
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification closed');

  // Track notification dismissal
  const telemetryData = {
    id: `notification-close-${Date.now()}`,
    type: 'notification',
    data: {
      action: 'close',
      timestamp: Date.now(),
      notificationTag: event.notification.tag,
    },
    timestamp: Date.now(),
  };

  initMobileDB()
    .then(db => {
      const tx = db.transaction('mobileTelemetry', 'readwrite');
      tx.objectStore('mobileTelemetry').add(telemetryData);
      return tx.complete;
    })
    .catch(error => {
      console.warn('[SW] Failed to log notification close:', error);
    });
});

// Error reporting
self.addEventListener('error', event => {
  console.error('[SW] Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

// New mobile-specific message handlers
async function handleOfflineFormationStore(event, payload) {
  try {
    const db = await initMobileDB();
    const tx = db.transaction('offlineFormations', 'readwrite');
    const store = tx.objectStore('offlineFormations');

    const formation = {
      id: payload.id || `offline-${Date.now()}`,
      data: payload.formation,
      timestamp: Date.now(),
      syncStatus: 'pending',
      retryCount: 0,
    };

    await store.put(formation);
    await tx.complete;

    event.ports[0].postMessage({
      type: 'OFFLINE_FORMATION_STORED',
      payload: { id: formation.id },
    });
  } catch (error) {
    event.ports[0].postMessage({
      type: 'OFFLINE_FORMATION_ERROR',
      payload: error.message,
    });
  }
}

async function handleOfflineFormationsGet(event) {
  try {
    const db = await initMobileDB();
    const tx = db.transaction('offlineFormations', 'readonly');
    const store = tx.objectStore('offlineFormations');

    const formations = await store.getAll();

    event.ports[0].postMessage({
      type: 'OFFLINE_FORMATIONS_RESPONSE',
      payload: formations,
    });
  } catch (error) {
    event.ports[0].postMessage({
      type: 'OFFLINE_FORMATIONS_ERROR',
      payload: error.message,
    });
  }
}

async function handleOfflineActionQueue(event, payload) {
  try {
    const db = await initMobileDB();
    const tx = db.transaction('offlineActions', 'readwrite');
    const store = tx.objectStore('offlineActions');

    const action = {
      id: `action-${Date.now()}-${Math.random()}`,
      type: payload.type,
      data: payload.data,
      priority: payload.priority || 1,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await store.add(action);
    await tx.complete;

    // Try immediate sync if online
    if (navigator.onLine) {
      executeOfflineAction(action)
        .then(() => {
          // Remove from queue if successful
          const deleteTx = db.transaction('offlineActions', 'readwrite');
          deleteTx.objectStore('offlineActions').delete(action.id);
          return deleteTx.complete;
        })
        .catch(() => {
          // Keep in queue for background sync
        });
    }

    event.ports[0].postMessage({
      type: 'OFFLINE_ACTION_QUEUED',
      payload: { id: action.id },
    });
  } catch (error) {
    event.ports[0].postMessage({
      type: 'OFFLINE_ACTION_ERROR',
      payload: error.message,
    });
  }
}

async function handleNetworkStatusRequest(event) {
  const networkStatus = {
    online: navigator.onLine,
    connection: navigator.connection
      ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData,
        }
      : null,
    timestamp: Date.now(),
  };

  event.ports[0].postMessage({
    type: 'NETWORK_STATUS_RESPONSE',
    payload: networkStatus,
  });
}

async function handleMobileOptimizationsToggle(event, payload) {
  try {
    // Update mobile configuration
    Object.assign(MOBILE_CONFIG, payload.config);

    event.ports[0].postMessage({
      type: 'MOBILE_OPTIMIZATIONS_UPDATED',
      payload: { config: MOBILE_CONFIG },
    });
  } catch (error) {
    event.ports[0].postMessage({
      type: 'MOBILE_OPTIMIZATIONS_ERROR',
      payload: error.message,
    });
  }
}

// Initialize mobile features on script load
initMobileDB().catch(error => {
  console.error('[SW] Failed to initialize mobile database:', error);
});

console.log('[SW] Sigma Mobile Service Worker loaded with enhanced capabilities');
console.log('[SW] Mobile config:', MOBILE_CONFIG);
