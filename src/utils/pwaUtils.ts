/**
 * Enhanced PWA Utilities for Astral Turf
 * Comprehensive PWA implementation with mobile-first offline capabilities
 * Implements Sigma's mobile excellence standards
 */

import { useEffect, useState, useCallback } from 'react';
import { useMobileCapabilities } from './mobileOptimizations';

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  isSupported: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  isStandalone: boolean;
  supportsShare: boolean;
  supportsBadging: boolean;
  supportsWakeLock: boolean;
  connectionType: 'online' | 'offline' | 'slow';
  storageQuota: number;
  usedStorage: number;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Main PWA hook for managing installation and updates
 */
export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    isSupported: 'serviceWorker' in navigator,
    installPrompt: null,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    supportsShare: 'share' in navigator,
    supportsBadging: 'setAppBadge' in navigator,
    supportsWakeLock: 'wakeLock' in navigator,
    connectionType: navigator.onLine ? 'online' : 'offline',
    storageQuota: 0,
    usedStorage: 0,
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Register service worker
  const registerSW = useCallback(async () => {
    if (!state.isSupported) {
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      setRegistration(reg);

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({ ...prev, hasUpdate: true }));
            }
          });
        }
      });

      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }, [state.isSupported]);

  // Install app
  const installApp = useCallback(async () => {
    if (!state.installPrompt) {
      return false;
    }

    try {
      await state.installPrompt.prompt();
      const choice = await state.installPrompt.userChoice;

      setState(prev => ({
        ...prev,
        installPrompt: null,
        isInstallable: false,
        isInstalled: choice.outcome === 'accepted',
      }));

      return choice.outcome === 'accepted';
    } catch (error) {
      console.error('Installation failed:', error);
      return false;
    }
  }, [state.installPrompt]);

  // Update app
  const updateApp = useCallback(async () => {
    if (!registration || !state.hasUpdate) {
      return;
    }

    const waitingWorker = registration.waiting;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration, state.hasUpdate]);

  // Check if app is installed
  const checkInstallation = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSInstalled = (window.navigator as any).standalone === true;
    const isInstalled = isStandalone || isIOSInstalled;

    setState(prev => ({ ...prev, isInstalled }));
  }, []);

  // Enhanced network monitoring
  const updateNetworkStatus = useCallback(() => {
    const connection = (navigator as any).connection;
    let connectionType: 'online' | 'offline' | 'slow' = navigator.onLine ? 'online' : 'offline';

    if (connection && navigator.onLine) {
      const slowConnections = ['slow-2g', '2g', '3g'];
      connectionType = slowConnections.includes(connection.effectiveType) ? 'slow' : 'online';
    }

    setState(prev => ({ ...prev, isOnline: navigator.onLine, connectionType }));
  }, []);

  // Storage quota monitoring
  const updateStorageInfo = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        setState(prev => ({
          ...prev,
          storageQuota: estimate.quota || 0,
          usedStorage: estimate.usage || 0,
        }));
      } catch (error) {
        console.warn('Could not estimate storage:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Register service worker
    registerSW();

    // Check installation status
    checkInstallation();

    // Update network and storage info
    updateNetworkStatus();
    updateStorageInfo();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e as BeforeInstallPromptEvent,
      }));
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
        isStandalone: true,
      }));
    };

    // Enhanced network monitoring
    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    // Connection change monitoring
    const handleConnectionChange = () => updateNetworkStatus();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [registerSW, checkInstallation, updateNetworkStatus, updateStorageInfo]);

  // App badge management
  const updateBadge = useCallback(
    (count: number) => {
      if (state.supportsBadging) {
        try {
          if (count > 0) {
            (navigator as any).setAppBadge(count);
          } else {
            (navigator as any).clearAppBadge();
          }
        } catch (error) {
          console.warn('Could not update app badge:', error);
        }
      }
    },
    [state.supportsBadging],
  );

  // Share functionality
  const shareContent = useCallback(
    async (data: ShareData): Promise<boolean> => {
      if (state.supportsShare) {
        try {
          await navigator.share(data);
          return true;
        } catch (error) {
          console.error('Share failed:', error);
          return false;
        }
      }
      return false;
    },
    [state.supportsShare],
  );

  // Wake lock management
  const requestWakeLock = useCallback(async (): Promise<WakeLockSentinel | null> => {
    if (state.supportsWakeLock) {
      try {
        return await (navigator as any).wakeLock.request('screen');
      } catch (error) {
        console.error('Wake lock failed:', error);
      }
    }
    return null;
  }, [state.supportsWakeLock]);

  return {
    ...state,
    installApp,
    updateApp,
    updateBadge,
    shareContent,
    requestWakeLock,
    registration,
  };
};

/**
 * Hook for managing offline data
 */
export const useOfflineData = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = useState<number>(0);

  // Store data for offline sync
  const storeOfflineData = useCallback(async (type: string, data: any) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_DATA',
        data: { type, payload: data },
      });

      setPendingSyncs(prev => prev + 1);
    }
  }, []);

  // Get offline data from IndexedDB
  const getOfflineData = useCallback(async (storeName: string, id?: string) => {
    return new Promise(resolve => {
      const request = indexedDB.open('AstralTurfDB', 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        const getRequest = id ? store.get(id) : store.getAll();
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => resolve(null);
      };

      request.onerror = () => resolve(null);
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger background sync when coming online
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration: any) => {
          return registration.sync.register('background-sync');
        });
      }
    };

    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOffline,
    pendingSyncs,
    storeOfflineData,
    getOfflineData,
  };
};

/**
 * Hook for managing push notifications
 */
export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
      });

      setSubscription(sub);

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });

      return sub;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      return;
    }

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Notify server
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    } catch (error) {
      console.error('Unsubscribe failed:', error);
    }
  }, [subscription]);

  useEffect(() => {
    setPermission(Notification.permission);

    // Check for existing subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  return {
    permission,
    subscription,
    isSupported: 'Notification' in window && 'PushManager' in window,
    requestPermission,
    subscribe,
    unsubscribe,
  };
};

/**
 * Utility function to check PWA installation status
 */
export const isPWAInstalled = (): boolean => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSInstalled = (window.navigator as any).standalone === true;
  return isStandalone || isIOSInstalled;
};

/**
 * Utility function to check if device supports PWA features
 */
export const getPWACapabilities = () => {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window && 'Notification' in window,
    backgroundSync:
      'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    installPrompt: 'BeforeInstallPromptEvent' in window,
    webShare: 'share' in navigator,
    fileSystemAccess: 'showOpenFilePicker' in window,
    badging: 'setAppBadge' in navigator,
    wakeLock: 'wakeLock' in navigator,
  };
};

/**
 * Utility function to trigger app update check
 */
export const checkForUpdates = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }

  return false;
};

/**
 * Utility function to clear app cache
 */
/**
 * Enhanced offline data management with IndexedDB
 */
export class OfflineDataManager {
  private dbName = 'AstralTurfOffline';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Formations store
        if (!db.objectStoreNames.contains('formations')) {
          const formationsStore = db.createObjectStore('formations', { keyPath: 'id' });
          formationsStore.createIndex('lastModified', 'lastModified');
          formationsStore.createIndex('offline', 'offline');
        }

        // Players store
        if (!db.objectStoreNames.contains('players')) {
          const playersStore = db.createObjectStore('players', { keyPath: 'id' });
          playersStore.createIndex('teamId', 'teamId');
          playersStore.createIndex('position', 'position');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Cache store
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiry', 'expiry');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp');
          syncStore.createIndex('type', 'type');
        }
      };
    });
  }

  async saveFormation(formation: any): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['formations'], 'readwrite');
      const store = transaction.objectStore('formations');

      const formationWithMeta = {
        ...formation,
        lastModified: Date.now(),
        offline: true,
        syncStatus: 'pending',
      };

      const request = store.put(formationWithMeta);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getFormations(): Promise<any[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['formations'], 'readonly');
      const store = transaction.objectStore('formations');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addToSyncQueue(type: string, action: string, data: any): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      const syncItem = {
        id: `${type}-${action}-${Date.now()}-${Math.random()}`,
        type,
        action,
        data,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3,
      };

      const request = store.add(syncItem);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clearSyncItem(id: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getStorageUsage(): Promise<{ used: number; available: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const available = quota - used;
        const percentage = quota > 0 ? (used / quota) * 100 : 0;

        return { used, available, percentage };
      } catch (error) {
        console.warn('Could not get storage usage:', error);
      }
    }

    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Background sync manager for offline operations
 */
export class BackgroundSyncManager {
  private offlineData: OfflineDataManager;

  constructor() {
    this.offlineData = new OfflineDataManager();
    this.setupSyncHandlers();
  }

  private setupSyncHandlers(): void {
    // Register for background sync when online
    window.addEventListener('online', () => {
      this.processSyncQueue();
    });

    // Setup service worker message handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'BACKGROUND_SYNC') {
          this.processSyncQueue();
        }
      });
    }
  }

  async addToQueue(type: string, action: string, data: any): Promise<void> {
    await this.offlineData.addToSyncQueue(type, action, data);

    // Try immediate sync if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }
  }

  async processSyncQueue(): Promise<void> {
    if (!navigator.onLine) {
      return;
    }

    try {
      const queue = await this.offlineData.getSyncQueue();

      for (const item of queue) {
        try {
          await this.syncItem(item);
          await this.offlineData.clearSyncItem(item.id);
        } catch (error) {
          console.warn(`Sync failed for item ${item.id}:`, error);
          // Could implement retry logic here
        }
      }
    } catch (error) {
      console.error('Sync queue processing failed:', error);
    }
  }

  private async syncItem(item: any): Promise<void> {
    // Implement actual API synchronization
    console.log('Syncing item:', item);

    // This would make actual API calls
    // Example: await api.syncFormation(item.action, item.data);
  }
}

export const clearAppCache = async (): Promise<void> => {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));

    // Also clear IndexedDB
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map(db => {
        if (db.name?.includes('AstralTurf')) {
          const deleteRequest = indexedDB.deleteDatabase(db.name);
          return new Promise(resolve => {
            deleteRequest.onsuccess = () => resolve(undefined);
            deleteRequest.onerror = () => resolve(undefined);
          });
        }
        return Promise.resolve();
      }),
    );

    console.log('App cache cleared successfully');
  } catch (error) {
    console.error('Cache clearing failed:', error);
  }
};

// Global instances
export const offlineDataManager = new OfflineDataManager();
export const backgroundSyncManager = new BackgroundSyncManager();

export default {
  usePWA,
  useOfflineData,
  usePushNotifications,
  isPWAInstalled,
  getPWACapabilities,
  checkForUpdates,
  clearAppCache,
  OfflineDataManager,
  BackgroundSyncManager,
  offlineDataManager,
  backgroundSyncManager,
};
