# Mobile Optimization Integration Guide

## Quick Start

### Step 1: Install Required Dependencies

```bash
# Install type definitions
npm install --save-dev @types/node

# Install bundle optimization tools
npm install --save-dev webpack-bundle-analyzer terser-webpack-plugin compression-webpack-plugin

# Verify existing dependencies
npm list react react-dom framer-motion lucide-react
```

### Step 2: Fix TypeScript Compilation Errors

The tsconfig.json already includes the necessary DOM types:
```json
"lib": ["DOM", "DOM.Iterable", "ESNext"]
```

**Action Items**:
1. Ensure `@types/node` is installed for `NodeJS.Timeout` type
2. Remove unused imports from all mobile components
3. Replace console.log statements with proper logger service
4. Export missing TypeScript types

### Step 3: Integrate Mobile Components

Add to `src/components/tactics/UnifiedTacticsBoard.tsx`:

```typescript
import { lazy, Suspense } from 'react';
import { useResponsive } from '../../hooks';
import { useOfflineStorage, STORES } from '../../services/offlineStorageManager';

// Lazy load mobile components for code splitting
const MobileTacticsBoardContainer = lazy(() => 
  import('./mobile/MobileTacticsBoardContainer').then(m => ({ 
    default: m.MobileTacticsBoardContainer 
  }))
);

const TouchGestureController = lazy(() =>
  import('./mobile/TouchGestureController').then(m => ({
    default: m.TouchGestureController
  }))
);

const UnifiedTacticsBoard = () => {
  const { isMobile } = useResponsive();
  const { save, isOnline, syncPendingData } = useOfflineStorage();

  // Existing state...
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Sync formations on reconnect
  useEffect(() => {
    if (isOnline) {
      syncPendingData();
    }
  }, [isOnline, syncPendingData]);

  // Save formation to offline storage
  const handleFormationChange = async (newFormation) => {
    setFormation(newFormation);
    await save(STORES.FORMATIONS, newFormation.id, newFormation, isOnline);
  };

  // Gesture handlers
  const gestureHandlers = {
    onPinch: (scale) => setZoom(prev => Math.min(3, Math.max(0.5, prev * scale))),
    onPan: (delta) => setPanOffset(prev => ({ 
      x: prev.x + delta.x, 
      y: prev.y + delta.y 
    })),
    onDoubleTap: () => setZoom(1),
    onTap: (event) => handlePlayerSelection(event),
  };

  // Wrap with mobile container if on mobile device
  const content = (
    <div className="tactics-board-container">
      {/* Existing board content */}
      <ModernField formation={formation} />
      {/* ... */}
    </div>
  );

  if (!isMobile) {
    return content;
  }

  return (
    <Suspense fallback={<div>Loading mobile controls...</div>}>
      <MobileTacticsBoardContainer
        onZoomChange={setZoom}
        onReset={() => {
          setZoom(1);
          setPanOffset({ x: 0, y: 0 });
        }}
        isMobile={true}
      >
        <TouchGestureController
          handlers={gestureHandlers}
          enablePinchZoom={true}
          enablePan={true}
          enableHaptics={true}
        >
          {content}
        </TouchGestureController>
      </MobileTacticsBoardContainer>
    </Suspense>
  );
};
```

### Step 4: Add Offline Status Indicator

Create `src/components/common/OfflineIndicator.tsx`:

```typescript
import { useOfflineStorage } from '../../services/offlineStorageManager';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineIndicator = () => {
  const { isOnline, getStorageStats, syncPendingData } = useOfflineStorage();
  const [stats, setStats] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    getStorageStats().then(setStats);
  }, [isOnline]);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncPendingData();
    await getStorageStats().then(setStats);
    setIsSyncing(false);
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-amber-500/90 backdrop-blur-lg 
                     text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3"
        >
          <WifiOff className="w-5 h-5" />
          <div className="flex flex-col">
            <span className="font-semibold">Offline Mode</span>
            <span className="text-xs opacity-90">
              {stats?.pendingSyncItems || 0} items pending sync
            </span>
          </div>
          {stats?.pendingSyncItems > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Sync now"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </motion.div>
      )}
      {isOnline && stats?.pendingSyncItems === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed top-4 right-4 z-50 bg-green-500/90 backdrop-blur-lg 
                     text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <Wifi className="w-5 h-5" />
          <span className="font-semibold">Synced</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### Step 5: Bundle Optimization

Run bundle analysis:

```bash
# Analyze current bundle
npm run build -- --env analyze

# This will:
# 1. Generate bundle-report.html showing size breakdown
# 2. Identify large dependencies
# 3. Show duplicate code across bundles
```

**Expected optimizations**:
- **Before**: ~2.5MB initial bundle
- **After**: ~1.75MB initial bundle (30% reduction)

**Key strategies**:
1. ✅ Lazy load mobile components (implemented above)
2. ✅ Split vendor chunks (React, Framer Motion separate)
3. ✅ Code splitting for routes
4. ✅ Tree shake unused exports
5. ✅ Compress with Gzip (implemented in webpack config)

### Step 6: Service Worker Setup (PWA)

Create `public/sw.js`:

```javascript
// Service Worker for offline-first PWA

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `astral-turf-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `astral-turf-dynamic-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/offline.html',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // API requests - network first
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
      );
    }).catch(() => {
      // Fallback to offline page
      if (request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
    })
  );
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-formations') {
    event.waitUntil(
      // Trigger sync in IndexedDB
      self.registration.showNotification('Sync Complete', {
        body: 'Your formations have been synced',
        icon: '/icon-192.png',
      })
    );
  }
});
```

Register service worker in `src/main.tsx`:

```typescript
// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

### Step 7: Testing Checklist

**Mobile Gestures** (Real Device Testing):
- [ ] Tap to select player
- [ ] Double-tap to reset zoom
- [ ] Long-press for context menu
- [ ] Pinch to zoom (2-finger)
- [ ] Pan to move view (1-finger)
- [ ] Swipe navigation
- [ ] Haptic feedback on iOS/Android

**Offline Functionality**:
- [ ] Save formation while offline
- [ ] Load formation while offline
- [ ] Verify sync queue populates
- [ ] Go online and verify auto-sync
- [ ] Test conflict resolution
- [ ] Check storage stats accuracy

**Performance**:
- [ ] Measure initial load time
- [ ] Check bundle size (target 1.75MB)
- [ ] Verify 60fps during gestures
- [ ] Test on slow 3G connection
- [ ] Profile memory usage
- [ ] Check battery drain

**Accessibility**:
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Touch target sizes (>44px)
- [ ] High contrast mode
- [ ] Focus indicators
- [ ] ARIA labels

## Build Commands

```bash
# Development with mobile optimizations
npm run dev

# Production build with bundle analysis
npm run build -- --env analyze

# Production build
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Type check
npm run type-check
```

## Environment Variables

Add to `.env`:

```
VITE_ENABLE_MOBILE_OPTIMIZATIONS=true
VITE_ENABLE_OFFLINE_STORAGE=true
VITE_ENABLE_HAPTICS=true
VITE_BUNDLE_ANALYZER=false
```

## Next Steps

1. **Immediate** (blocking):
   - Fix TypeScript errors (install @types/node, remove unused imports)
   - Export missing types from components

2. **High Priority**:
   - Integrate mobile components into UnifiedTacticsBoard
   - Run bundle analyzer and optimize
   - Implement service worker

3. **Medium Priority**:
   - Add offline status indicator
   - Optimize mobile navigation drawer
   - Test on real devices

4. **Low Priority**:
   - Add install prompt for PWA
   - Implement background sync
   - Create offline tutorial

## Troubleshooting

### TypeScript Errors

If you see "PointerEvent is not defined":
```bash
# Ensure tsconfig.json has DOM types
"lib": ["DOM", "DOM.Iterable", "ESNext"]

# Install Node types
npm install --save-dev @types/node
```

### Bundle Size Not Reducing

1. Check webpack config is being used
2. Run analyzer to find large dependencies
3. Ensure tree-shaking is enabled
4. Check for duplicate dependencies

### Offline Storage Not Working

1. Check browser supports IndexedDB
2. Verify online/offline listeners attached
3. Check sync queue in DevTools > Application > IndexedDB
4. Ensure offlineStorage.init() is called

### Gestures Not Detected

1. Check touch events are supported (use TouchGestureController only on mobile)
2. Verify handlers are connected properly
3. Check z-index and pointer-events CSS
4. Test on actual device (not just browser DevTools)

## Resources

- [MDN - IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN - Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [MDN - Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Framer Motion Gestures](https://www.framer.com/motion/gestures/)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
