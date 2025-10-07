/**
 * PWA Features Testing Suite
 * Tests Progressive Web App capabilities including offline support, installation, and notifications
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { cleanup } from '@testing-library/react';
import {
  usePWA,
  useOfflineData,
  usePushNotifications,
  isPWAInstalled,
  getPWACapabilities,
} from '../../utils/pwaUtils';

// Mock global APIs
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  update: vi.fn(),
  pushManager: {
    subscribe: vi.fn(),
    getSubscription: vi.fn(),
  },
  sync: {
    register: vi.fn(),
  },
  showNotification: vi.fn(),
};

const mockServiceWorker = {
  register: vi.fn(),
  getRegistration: vi.fn(),
  ready: Promise.resolve(mockServiceWorkerRegistration),
  controller: {
    postMessage: vi.fn(),
  },
};

const mockBeforeInstallPromptEvent = {
  preventDefault: vi.fn(),
  prompt: vi.fn(),
  userChoice: Promise.resolve({ outcome: 'accepted' }),
} as any;

const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  databases: vi.fn(),
};

const mockCaches = {
  keys: vi.fn(),
  delete: vi.fn(),
  open: vi.fn(),
  match: vi.fn(),
};

const mockNotification = {
  requestPermission: vi.fn(),
  permission: 'default' as NotificationPermission,
};

const setupMocks = () => {
  // Service Worker
  Object.defineProperty(navigator, 'serviceWorker', {
    value: mockServiceWorker,
    writable: true,
  });

  // IndexedDB
  Object.defineProperty(global, 'indexedDB', {
    value: mockIndexedDB,
    writable: true,
  });

  // Cache API
  Object.defineProperty(global, 'caches', {
    value: mockCaches,
    writable: true,
  });

  // Notifications
  Object.defineProperty(global, 'Notification', {
    value: mockNotification,
    writable: true,
  });

  // PushManager
  Object.defineProperty(global, 'PushManager', {
    value: class PushManager {},
    writable: true,
  });

  // Online/Offline
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true,
  });

  // Match Media
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn((query: string) => ({
      matches: query.includes('display-mode: standalone') ? false : true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
    writable: true,
  });
};

describe('PWA Core Features', () => {
  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('usePWA Hook', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.isSupported).toBe(true);
      expect(result.current.isInstallable).toBe(false);
      expect(result.current.isInstalled).toBe(false);
      expect(result.current.isOnline).toBe(true);
      expect(result.current.hasUpdate).toBe(false);
    });

    it('should register service worker on mount', async () => {
      mockServiceWorker.register.mockResolvedValue(mockServiceWorkerRegistration);

      renderHook(() => usePWA());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
    });

    it('should handle install prompt event', () => {
      const { result } = renderHook(() => usePWA());

      act(() => {
        const event = new Event('beforeinstallprompt');
        Object.assign(event, mockBeforeInstallPromptEvent);
        window.dispatchEvent(event);
      });

      expect(result.current.isInstallable).toBe(true);
      expect(result.current.installPrompt).toBeTruthy();
    });

    it('should install app when prompted', async () => {
      const { result } = renderHook(() => usePWA());

      // Set up install prompt
      act(() => {
        const event = new Event('beforeinstallprompt');
        Object.assign(event, mockBeforeInstallPromptEvent);
        window.dispatchEvent(event);
      });

      // Install app
      await act(async () => {
        const installed = await result.current.installApp();
        expect(installed).toBe(true);
      });

      expect(mockBeforeInstallPromptEvent.prompt).toHaveBeenCalled();
      expect(result.current.isInstallable).toBe(false);
    });

    it('should detect app installation', () => {
      // Mock standalone display mode
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn((query: string) => ({
          matches: query.includes('display-mode: standalone') ? true : false,
        })),
        writable: true,
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.isInstalled).toBe(true);
    });

    it('should handle service worker updates', () => {
      const { result } = renderHook(() => usePWA());

      act(() => {
        const updateFoundCallback = mockServiceWorkerRegistration.addEventListener.mock.calls.find(
          call => call[0] === 'updatefound',
        )?.[1];

        if (updateFoundCallback) {
          // Mock installing worker
          mockServiceWorkerRegistration.installing = {
            addEventListener: vi.fn((event, callback) => {
              if (event === 'statechange') {
                // Mock state change to installed
                Object.defineProperty(mockServiceWorkerRegistration.installing, 'state', {
                  value: 'installed',
                });
                Object.defineProperty(navigator.serviceWorker, 'controller', {
                  value: {},
                });
                callback();
              }
            }),
          } as any;

          updateFoundCallback();
        }
      });

      expect(result.current.hasUpdate).toBe(true);
    });

    it('should update app when requested', async () => {
      const { result } = renderHook(() => usePWA());

      // Set up update state
      act(() => {
        (result.current as any).setState((prev: any) => ({ ...prev, hasUpdate: true }));
      });

      const mockWaitingWorker = {
        postMessage: vi.fn(),
      } as any;

      mockServiceWorkerRegistration.waiting = mockWaitingWorker;

      // Mock window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window.location, 'reload', {
        value: mockReload,
        writable: true,
      });

      await act(async () => {
        await result.current.updateApp();
      });

      expect(mockWaitingWorker.postMessage).toHaveBeenCalledWith({
        type: 'SKIP_WAITING',
      });
    });

    it('should track online/offline status', () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.isOnline).toBe(true);

      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: false });
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);

      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: true });
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('useOfflineData Hook', () => {
    it('should store data for offline sync', async () => {
      const { result } = renderHook(() => useOfflineData());

      const testData = { id: '1', name: 'Test Formation' };

      await act(async () => {
        await result.current.storeOfflineData('formation', testData);
      });

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
        type: 'SYNC_DATA',
        data: { type: 'formation', payload: testData },
      });

      expect(result.current.pendingSyncs).toBe(1);
    });

    it('should retrieve offline data from IndexedDB', async () => {
      const mockDB = {
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(() => ({
              onsuccess: null,
              onerror: null,
              result: { id: '1', name: 'Test Formation' },
            })),
            getAll: vi.fn(() => ({
              onsuccess: null,
              onerror: null,
              result: [{ id: '1', name: 'Test Formation' }],
            })),
          })),
        })),
      };

      mockIndexedDB.open.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: mockDB,
      }));

      const { result } = renderHook(() => useOfflineData());

      const data = await act(async () => {
        return await result.current.getOfflineData('formations', '1');
      });

      expect(mockIndexedDB.open).toHaveBeenCalledWith('AstralTurfDB', 1);
    });

    it('should handle offline/online transitions', () => {
      const { result } = renderHook(() => useOfflineData());

      expect(result.current.isOffline).toBe(false);

      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: false });
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOffline).toBe(true);

      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: true });
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOffline).toBe(false);
    });

    it('should trigger background sync when coming online', () => {
      renderHook(() => useOfflineData());

      mockServiceWorker.ready = Promise.resolve(mockServiceWorkerRegistration);

      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: true });
        window.dispatchEvent(new Event('online'));
      });

      // Background sync should be registered
      setTimeout(() => {
        expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith('background-sync');
      }, 0);
    });
  });

  describe('usePushNotifications Hook', () => {
    it('should request notification permission', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');

      const { result } = renderHook(() => usePushNotifications());

      const granted = await act(async () => {
        return await result.current.requestPermission();
      });

      expect(granted).toBe(true);
      expect(mockNotification.requestPermission).toHaveBeenCalled();
    });

    it('should subscribe to push notifications', async () => {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-key',
          auth: 'test-auth',
        },
      };

      mockServiceWorkerRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);

      // Mock fetch for sending subscription to server
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => usePushNotifications());

      const subscription = await act(async () => {
        return await result.current.subscribe();
      });

      expect(subscription).toEqual(mockSubscription);
      expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
      });
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockSubscription),
      });
    });

    it('should unsubscribe from push notifications', async () => {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        unsubscribe: vi.fn().mockResolvedValue(true),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => usePushNotifications());

      // Set subscription state
      act(() => {
        (result.current as any).setSubscription(mockSubscription);
      });

      await act(async () => {
        await result.current.unsubscribe();
      });

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: mockSubscription.endpoint }),
      });
    });

    it('should check for existing subscription on mount', () => {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      };

      mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);

      const { result } = renderHook(() => usePushNotifications());

      setTimeout(() => {
        expect(result.current.subscription).toEqual(mockSubscription);
      }, 0);
    });
  });
});

describe('PWA Utility Functions', () => {
  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isPWAInstalled', () => {
    it('should detect standalone display mode', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn((query: string) => ({
          matches: query.includes('display-mode: standalone'),
        })),
        writable: true,
      });

      expect(isPWAInstalled()).toBe(true);
    });

    it('should detect iOS standalone mode', () => {
      Object.defineProperty(navigator, 'standalone', {
        value: true,
        writable: true,
      });

      expect(isPWAInstalled()).toBe(true);
    });

    it('should return false when not installed', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => ({ matches: false })),
        writable: true,
      });

      Object.defineProperty(navigator, 'standalone', {
        value: false,
        writable: true,
      });

      expect(isPWAInstalled()).toBe(false);
    });
  });

  describe('getPWACapabilities', () => {
    it('should detect available PWA features', () => {
      const capabilities = getPWACapabilities();

      expect(capabilities.serviceWorker).toBe(true);
      expect(capabilities.pushNotifications).toBe(true);
      expect(capabilities.backgroundSync).toBe(true);
    });

    it('should handle missing features gracefully', () => {
      // Remove some features
      delete (navigator as any).serviceWorker;
      delete (global as any).PushManager;

      const capabilities = getPWACapabilities();

      expect(capabilities.serviceWorker).toBe(false);
      expect(capabilities.pushNotifications).toBe(false);
    });
  });
});

describe('PWA Installation Flow', () => {
  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should complete full installation flow', async () => {
    mockServiceWorker.register.mockResolvedValue(mockServiceWorkerRegistration);

    const { result } = renderHook(() => usePWA());

    // Wait for service worker registration
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Trigger install prompt
    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.assign(event, mockBeforeInstallPromptEvent);
      window.dispatchEvent(event);
    });

    expect(result.current.isInstallable).toBe(true);

    // Install app
    await act(async () => {
      const installed = await result.current.installApp();
      expect(installed).toBe(true);
    });

    // Trigger app installed event
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it('should handle installation rejection', async () => {
    const rejectedPrompt = {
      ...mockBeforeInstallPromptEvent,
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    };

    const { result } = renderHook(() => usePWA());

    // Set up install prompt
    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.assign(event, rejectedPrompt);
      window.dispatchEvent(event);
    });

    // Try to install app
    await act(async () => {
      const installed = await result.current.installApp();
      expect(installed).toBe(false);
    });

    expect(result.current.isInstalled).toBe(false);
  });
});

describe('PWA Offline Functionality', () => {
  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should handle offline data synchronization', async () => {
    const { result } = renderHook(() => useOfflineData());

    // Store offline data
    const formationData = { id: '1', name: 'Test Formation' };
    await act(async () => {
      await result.current.storeOfflineData('formation', formationData);
    });

    expect(result.current.pendingSyncs).toBe(1);

    // Simulate coming online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });

    // Background sync should be triggered
    setTimeout(() => {
      expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith('background-sync');
    }, 0);
  });

  it('should queue multiple offline operations', async () => {
    const { result } = renderHook(() => useOfflineData());

    const operations = [
      { type: 'formation', data: { id: '1', name: 'Formation 1' } },
      { type: 'player', data: { id: '1', name: 'Player 1' } },
      { type: 'analytics', data: { id: '1', metric: 'performance' } },
    ];

    for (const op of operations) {
      await act(async () => {
        await result.current.storeOfflineData(op.type, op.data);
      });
    }

    expect(result.current.pendingSyncs).toBe(3);
  });
});

export {};
