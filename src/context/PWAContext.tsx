/**
 * PWA Context Provider
 * Centralized PWA state management for the entire application
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { usePWA, useOfflineData, usePushNotifications, PWAState } from '../utils/pwaUtils';

interface PWAContextValue {
  pwaState: PWAState;
  installApp: () => Promise<boolean>;
  updateApp: () => Promise<void>;
  updateBadge: (count: number) => void;
  shareContent: (data: globalThis.ShareData) => Promise<boolean>;
  requestWakeLock: () => Promise<globalThis.WakeLockSentinel | null>;
  registration: globalThis.ServiceWorkerRegistration | null;
  // Offline data
  isOffline: boolean;
  pendingSyncs: number;
  storeOfflineData: (type: string, data: unknown) => Promise<void>;
  getOfflineData: (storeName: string, id?: string) => Promise<unknown>;
  // Push notifications
  notificationPermission: globalThis.NotificationPermission;
  pushSubscription: globalThis.PushSubscription | null;
  isPushSupported: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  subscribeToPush: () => Promise<globalThis.PushSubscription | null>;
  unsubscribeFromPush: () => Promise<void>;
}

const PWAContext = createContext<PWAContextValue | undefined>(undefined);

export const usePWAContext = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext must be used within PWAProvider');
  }
  return context;
};

interface PWAProviderProps {
  children: ReactNode;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const pwa = usePWA();
  const offline = useOfflineData();
  const push = usePushNotifications();

  const value: PWAContextValue = {
    // PWA state
    pwaState: {
      isInstallable: pwa.isInstallable,
      isInstalled: pwa.isInstalled,
      isOnline: pwa.isOnline,
      hasUpdate: pwa.hasUpdate,
      isSupported: pwa.isSupported,
      installPrompt: pwa.installPrompt,
      isStandalone: pwa.isStandalone,
      supportsShare: pwa.supportsShare,
      supportsBadging: pwa.supportsBadging,
      supportsWakeLock: pwa.supportsWakeLock,
      connectionType: pwa.connectionType,
      storageQuota: pwa.storageQuota,
      usedStorage: pwa.usedStorage,
    },
    installApp: pwa.installApp,
    updateApp: pwa.updateApp,
    updateBadge: pwa.updateBadge,
    shareContent: pwa.shareContent,
    requestWakeLock: pwa.requestWakeLock,
    registration: pwa.registration,
    // Offline data
    isOffline: offline.isOffline,
    pendingSyncs: offline.pendingSyncs,
    storeOfflineData: offline.storeOfflineData,
    getOfflineData: offline.getOfflineData,
    // Push notifications
    notificationPermission: push.permission,
    pushSubscription: push.subscription,
    isPushSupported: push.isSupported,
    requestNotificationPermission: push.requestPermission,
    subscribeToPush: push.subscribe,
    unsubscribeFromPush: push.unsubscribe,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
};

export default PWAProvider;
