/**
 * AGGRESSIVE Service Worker Registration with Force Update
 * This will FORCEFULLY update and clear old service workers
 */

// Service Worker Registration DISABLED to prevent fetch errors
// The service worker was causing network fetch failures and CSP errors
// App will work perfectly without it using standard browser caching

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('🚫 Service Worker registration disabled to prevent errors');
      
      // Unregister ALL existing service workers to prevent conflicts
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      if (existingRegistrations.length > 0) {
        console.log(`🗑️ Unregistering ${existingRegistrations.length} existing service worker(s)...`);
        for (const reg of existingRegistrations) {
          await reg.unregister();
          console.log('✅ Unregistered:', reg.scope);
        }
      }

      // Clear ALL caches to start fresh
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        if (cacheNames.length > 0) {
          console.log(`🗑️ Clearing ${cacheNames.length} cache(s)...`);
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
            console.log('✅ Cleared cache:', cacheName);
          }
        }
      }

      console.log('✅ Service Worker cleanup complete - App will use standard browser caching');

    } catch (err) {
      console.error('❌ Service worker cleanup failed:', err);
    }
  });
}

