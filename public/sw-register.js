/**
 * AGGRESSIVE Service Worker Registration with Force Update
 * This will FORCEFULLY update and clear old service workers
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('🚀 Starting aggressive service worker registration...');
      
      // STEP 1: Unregister ALL existing service workers
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      if (existingRegistrations.length > 0) {
        console.log(`🔄 Found ${existingRegistrations.length} existing service worker(s), unregistering...`);
        for (const reg of existingRegistrations) {
          await reg.unregister();
          console.log('✅ Unregistered:', reg.scope);
        }
      }

      // STEP 2: Clear ALL old caches before registering new SW
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => !name.includes('v3'));
        if (oldCaches.length > 0) {
          console.log(`🗑️ Deleting ${oldCaches.length} old cache(s)...`);
          for (const cacheName of oldCaches) {
            await caches.delete(cacheName);
            console.log('✅ Deleted cache:', cacheName);
          }
        }
      }

      // STEP 3: Register new service worker with no cache
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none' // NEVER use cached service worker file
      });
      
      console.log('✅ New service worker registered:', registration.scope);

      // STEP 4: Force immediate update
      await registration.update();
      console.log('🔄 Forced update check complete');

      // STEP 5: Listen for updates and handle them aggressively
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🆕 New service worker detected, installing...');
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log(`📝 SW State: ${newWorker.state}`);
            
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // There's an old service worker, skip waiting
                console.log('⏭️ Skipping waiting for new service worker...');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              } else {
                // First time install
                console.log('🎉 Service worker installed for first time');
              }
            }
            
            if (newWorker.state === 'activated') {
              console.log('✅ New service worker activated!');
              
              // Clear any remaining old caches
              if ('caches' in window) {
                caches.keys().then(names => {
                  const oldCaches = names.filter(name => !name.includes('v3'));
                  if (oldCaches.length > 0) {
                    console.log('🗑️ Clearing remaining old caches...');
                    return Promise.all(oldCaches.map(name => caches.delete(name)));
                  }
                }).then(() => {
                  console.log('✅ All old caches cleared');
                  if (!window.location.hash.includes('no-reload')) {
                    console.log('🔄 Reloading to use new service worker...');
                    setTimeout(() => window.location.reload(), 1000);
                  }
                });
              }
            }
          });
        }
      });

      // STEP 6: Check for updates very aggressively
      setInterval(() => {
        console.log('🔍 Checking for service worker updates...');
        registration.update();
      }, 3000); // Every 3 seconds

    } catch (err) {
      console.error('❌ Service worker registration failed:', err);
    }
  });

  // Handle controller change (when new SW takes over)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service worker controller changed!');
    if (!window.location.hash.includes('no-reload')) {
      console.log('🔄 Reloading page...');
      window.location.reload();
    }
  });
}
