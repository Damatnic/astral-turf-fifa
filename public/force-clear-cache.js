/**
 * NUCLEAR CACHE CLEAR SCRIPT
 * This script forcefully clears ALL caches and unregisters ALL service workers
 */

(async function forceClearEverything() {
  console.log('🚨 NUCLEAR CACHE CLEAR - Starting...');
  
  try {
    // 1. Unregister ALL service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`Found ${registrations.length} service worker(s) to unregister`);
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Unregistered service worker:', registration.scope);
      }
    }
    
    // 2. Delete ALL caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`Found ${cacheNames.length} cache(s) to delete`);
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('✅ Deleted cache:', cacheName);
      }
    }
    
    // 3. Clear localStorage
    localStorage.clear();
    console.log('✅ Cleared localStorage');
    
    // 4. Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ Cleared sessionStorage');
    
    // 5. Clear IndexedDB (if any)
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
            console.log('✅ Deleted IndexedDB:', db.name);
          }
        }
      } catch (e) {
        console.log('⚠️ Could not clear IndexedDB:', e.message);
      }
    }
    
    console.log('');
    console.log('🎉 NUCLEAR CACHE CLEAR - COMPLETE!');
    console.log('');
    console.log('The page will reload in 2 seconds...');
    
    // Reload the page
    setTimeout(() => {
      window.location.reload(true);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error during cache clear:', error);
    console.log('Reloading anyway...');
    setTimeout(() => {
      window.location.reload(true);
    }, 2000);
  }
})();


