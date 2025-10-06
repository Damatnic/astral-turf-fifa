/**
 * Mobile Components Barrel Export
 *
 * Provides lazy-loadable entry point for mobile-optimized components.
 * This enables code splitting to reduce bundle size for desktop users.
 */

// Core mobile components
export { TouchGestureController } from './TouchGestureController';
export type { TouchGestureHandlers, GestureState } from './TouchGestureController';

export { MobileTacticsBoardContainer } from './MobileTacticsBoardContainer';
export type { MobileTacticsBoardProps } from './MobileTacticsBoardContainer';

// Mobile utilities and hooks
export { useMobileCapabilities, useMobileViewport } from '../../../utils/mobileOptimizations';

// Offline storage
export { offlineStorage, useOfflineStorage, STORES } from '../../../services/offlineStorageManager';
export type { OfflineData, SyncQueueItem } from '../../../services/offlineStorageManager';
