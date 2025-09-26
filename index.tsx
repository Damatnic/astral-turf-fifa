
/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './src/context/AppProvider';
import { HashRouter } from 'react-router-dom';
import SecurityProvider from './src/components/security/SecurityProvider';
import SecurityErrorBoundary from './src/components/security/SecurityErrorBoundary';
import { initializeApplication, setupGracefulShutdown } from './src/services/initializationService';
import { HelmetProvider } from 'react-helmet-async';

// Import process polyfill for browser compatibility
import './src/utils/processPolyfill';

// Fonts and TailwindCSS now loaded via CDN in index.html
// Enhanced UI styles are inlined in index.html

// Performance optimizations
function registerServiceWorker() {
  // Unregister any existing service workers to fix font loading issues
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(const registration of registrations) {
        registration.unregister().then(function(success) {
          if (success) {
            console.log('Service Worker unregistered successfully');
          }
        });
      }
    });
  }
  console.log('Service Worker registration disabled for font compatibility');
  return;

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        // eslint-disable-next-line no-console
        console.log('Service Worker registered successfully:', registration);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // eslint-disable-next-line no-console
                console.log('New service worker available, page will refresh');
                window.location.reload();
              }
            });
          }
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Service Worker registration failed:', error);
      }
    });
  }
}

// Resource preloading for critical assets
function preloadCriticalResources() {
  const criticalResources: Array<{ href: string; as?: string }> = [
    // Critical CSS and JS will be handled by Vite automatically
    // We can preload specific assets if needed
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.crossorigin) {link.crossOrigin = resource.crossorigin;}
    document.head.appendChild(link);
  });
}

// Application initialization and startup
async function startApplication() {
  try {
    // Setup graceful shutdown handlers
    setupGracefulShutdown();

    // Initialize application services
    console.log('🚀 Initializing Astral Turf...');
    await initializeApplication();

    // Initialize performance optimizations
    registerServiceWorker();
    preloadCriticalResources();

    // Mount React application
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Could not find root element to mount to");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <HelmetProvider>
          <SecurityErrorBoundary>
            <SecurityProvider>
              <HashRouter>
                <AppProvider>
                  <App />
                </AppProvider>
              </HashRouter>
            </SecurityProvider>
          </SecurityErrorBoundary>
        </HelmetProvider>
      </React.StrictMode>,
    );

    console.log('✅ Astral Turf started successfully!');
  } catch (error) {
    console.error('❌ Failed to start Astral Turf:', error);

    // Show error to user
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          height: 100vh; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 2rem;
        ">
          <h1 style="font-size: 2.5rem; margin-bottom: 1rem; font-weight: 600;">
            ⚽ Astral Turf
          </h1>
          <div style="
            background: rgba(255, 255, 255, 0.1); 
            padding: 2rem; 
            border-radius: 1rem; 
            max-width: 600px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          ">
            <h2 style="color: #ff6b6b; margin-bottom: 1rem;">Initialization Failed</h2>
            <p style="margin-bottom: 1rem; font-size: 1.1rem;">
              The application failed to start properly. This might be due to:
            </p>
            <ul style="text-align: left; margin-bottom: 1.5rem; line-height: 1.6;">
              <li>Database connection issues</li>
              <li>Missing environment variables</li>
              <li>Network connectivity problems</li>
            </ul>
            <button 
              onclick="window.location.reload()" 
              style="
                background: #4ecdc4; 
                color: white; 
                border: none; 
                padding: 0.75rem 2rem; 
                border-radius: 0.5rem; 
                font-size: 1rem; 
                cursor: pointer;
                transition: background 0.3s ease;
              "
              onmouseover="this.style.background='#45b7aa'"
              onmouseout="this.style.background='#4ecdc4'"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Start the application
startApplication();