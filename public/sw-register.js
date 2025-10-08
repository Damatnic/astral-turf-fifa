/**
 * Service Worker Registration with Force Update
 * This will force the service worker to update immediately
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
        
        // Force update check every 5 seconds
        setInterval(() => {
          registration.update();
        }, 5000);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, force reload
                console.log('New service worker available, reloading...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch(err => {
        console.log('SW registration failed:', err);
      });
  });
}

