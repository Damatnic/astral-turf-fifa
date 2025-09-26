/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/styles/globals.css';
import App from './App';
import { AppProvider } from './src/context/AppProvider';
import { HashRouter } from 'react-router-dom';
import SecurityProvider from './src/components/security/SecurityProvider';
import SecurityErrorBoundary from './src/components/security/SecurityErrorBoundary';

// Enhanced UI styles now embedded in index.html inline

// Performance optimizations
function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
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
  const criticalResources: Array<{ href: string; as?: string; crossorigin?: string }> = [
    // Critical CSS and JS will be handled by Vite automatically
    // We can preload specific assets if needed
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    if (resource.as) {
      link.as = resource.as;
    }
    if (resource.crossorigin) {
      link.crossOrigin = resource.crossorigin;
    }
    document.head.appendChild(link);
  });
}

// Initialize performance optimizations
registerServiceWorker();
preloadCriticalResources();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SecurityErrorBoundary>
      <SecurityProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppProvider>
            <App />
          </AppProvider>
        </HashRouter>
      </SecurityProvider>
    </SecurityErrorBoundary>
  </React.StrictMode>
);
