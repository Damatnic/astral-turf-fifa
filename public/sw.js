/**
 * Astral Turf Service Worker
 * Provides aggressive caching for improved performance
 */

const CACHE_NAME = 'astral-turf-v1';
const STATIC_CACHE_NAME = 'astral-turf-static-v1';

// Resources to cache immediately on install
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Runtime caching patterns
const RUNTIME_CACHE_PATTERNS = {
  // JavaScript and CSS files
  scripts: /\.(js|css)$/,
  // Images and fonts
  assets: /\.(png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/,
  // API responses (if any)
  api: /\/api\//,
  // AI prompts and templates
  prompts: /\/prompts\//
};

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('[SW] Static resources cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
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

  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Strategy 1: Cache First for static assets (JS, CSS, images, fonts)
    if (RUNTIME_CACHE_PATTERNS.assets.test(pathname) || RUNTIME_CACHE_PATTERNS.scripts.test(pathname)) {
      return await cacheFirst(request);
    }

    // Strategy 2: Stale While Revalidate for prompts and templates
    if (RUNTIME_CACHE_PATTERNS.prompts.test(pathname)) {
      return await staleWhileRevalidate(request);
    }

    // Strategy 3: Network First for API requests
    if (RUNTIME_CACHE_PATTERNS.api.test(pathname)) {
      return await networkFirst(request);
    }

    // Strategy 4: Cache First for HTML pages (with network fallback)
    if (pathname === '/' || pathname.endsWith('.html') || !pathname.includes('.')) {
      return await cacheFirstWithNetworkFallback(request);
    }

    // Default: Network with cache fallback
    return await networkWithCacheFallback(request);
    
  } catch (error) {
    console.error('[SW] Error handling request:', error);
    return fetch(request);
  }
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
  
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  });

  return cached || await networkPromise;
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
  } catch (error) {
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
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Background sync for offline functionality (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Performing background sync...');
  // Implement background sync logic here if needed
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  const options = {
    body: event.data?.text() || 'New update available!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Astral Turf', options)
  );
});

console.log('[SW] Service worker script loaded');