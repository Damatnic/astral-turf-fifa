/**
 * Mobile-Specific Feature Integration
 * Comprehensive mobile features: haptics, orientation, device sensors, and native integrations
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMobileCapabilities } from './mobileOptimizations';

type NavigatorInstance = typeof globalThis extends { navigator: infer T } ? T : never;

type NavigatorLike = NavigatorInstance & {
  vibrate?: (pattern: number | number[]) => boolean;
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
};

type DocumentInstance = typeof globalThis extends { document: infer T } ? T : never;

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener?: (type: 'release', listener: () => void) => void;
};

type ScreenOrientationLike = {
  type?: string;
  lock?: (orientation: OrientationLock) => Promise<void>;
  unlock?: () => void;
};

const getWindow = (): typeof window | undefined =>
  typeof window === 'undefined' ? undefined : window;

const getDocument = (): DocumentInstance | undefined =>
  typeof document === 'undefined' ? undefined : (document as DocumentInstance);

const getNavigator = (): NavigatorLike | undefined => {
  const win = getWindow();
  return win?.navigator as NavigatorLike | undefined;
};

const getScreenOrientation = (): ScreenOrientationLike | undefined => {
  const win = getWindow();
  return win?.screen?.orientation as ScreenOrientationLike | undefined;
};

const dispatchMobileFeatureEvent = (type: string, detail: Record<string, unknown>) => {
  const win = getWindow();
  if (!win) {
    return;
  }

  try {
    if (typeof win.CustomEvent === 'function') {
      win.dispatchEvent(new win.CustomEvent(type, { detail }));
      return;
    }

    const doc = getDocument();
    if (doc && typeof doc.createEvent === 'function') {
      const event = doc.createEvent('CustomEvent');
      event.initCustomEvent(type, false, false, detail);
      win.dispatchEvent(event);
      return;
    }

    win.dispatchEvent(new Event(type));
  } catch {
    // Ignore environments that block custom events
  }
};

const emitMobileFeatureWarning = (message: string, context: Record<string, unknown> = {}) => {
  dispatchMobileFeatureEvent('catalyst:mobile-feature-warning', {
    message,
    timestamp: Date.now(),
    ...context,
  });
};

const emitMobileFeatureInfo = (message: string, context: Record<string, unknown> = {}) => {
  dispatchMobileFeatureEvent('catalyst:mobile-feature-info', {
    message,
    timestamp: Date.now(),
    ...context,
  });
};

type OrientationLock =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

interface DeviceOrientationEventData extends Event {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
}

interface DeviceMotionEventData extends Event {
  acceleration?: { x: number | null; y: number | null; z: number | null } | null;
  accelerationIncludingGravity?: { x: number | null; y: number | null; z: number | null } | null;
  rotationRate?: { alpha: number | null; beta: number | null; gamma: number | null } | null;
  interval: number;
}

// Haptic feedback patterns
export const HapticPatterns = {
  LIGHT_TAP: [10],
  MEDIUM_TAP: [25],
  HEAVY_TAP: [50],
  DOUBLE_TAP: [15, 10, 15],
  SUCCESS: [25, 10, 25],
  ERROR: [50, 25, 50, 25, 50],
  WARNING: [30, 20, 30],
  SELECTION: [5],
  DRAG_START: [20],
  DRAG_END: [15],
  NOTIFICATION: [100, 50, 100],
  GAME_ACTION: [30, 10, 20],
  FORMATION_CHANGE: [40, 15, 25, 15, 40],
} as const;

// Device orientation types
export interface DeviceOrientation {
  alpha: number | null; // Z-axis rotation (0-360°)
  beta: number | null; // X-axis rotation (-180° to 180°)
  gamma: number | null; // Y-axis rotation (-90° to 90°)
  absolute: boolean;
}

// Device motion data
export interface DeviceMotion {
  acceleration: {
    x: number | null;
    y: number | null;
    z: number | null;
  };
  accelerationIncludingGravity: {
    x: number | null;
    y: number | null;
    z: number | null;
  };
  rotationRate: {
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  };
  interval: number;
}

// Screen orientation types
export type ScreenOrientationType =
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

/**
 * Enhanced Haptic Feedback Manager
 */
export class HapticFeedbackManager {
  private static instance: HapticFeedbackManager;
  private supported: boolean;
  private intensity: 'light' | 'medium' | 'heavy';
  private isEnabled: boolean;

  static getInstance(): HapticFeedbackManager {
    if (!HapticFeedbackManager.instance) {
      HapticFeedbackManager.instance = new HapticFeedbackManager();
    }
    return HapticFeedbackManager.instance;
  }

  private constructor() {
    const nav = getNavigator();
    this.supported = !!nav?.vibrate;
    this.intensity = 'medium';
    this.isEnabled = true;

    // Check for iOS haptic feedback APIs
    const win = getWindow() as (typeof window & { DeviceMotionEvent?: unknown }) | undefined;
    if (
      win &&
      'DeviceMotionEvent' in win &&
      typeof (win.DeviceMotionEvent as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      this.supported = true;
    }
  }

  /**
   * Trigger haptic feedback with pattern
   */
  vibrate(pattern: number | number[]): boolean {
    if (!this.supported || !this.isEnabled) {
      return false;
    }

    const nav = getNavigator();
    if (!nav?.vibrate) {
      emitMobileFeatureWarning('Haptic vibrate not supported on navigator');
      return false;
    }

    try {
      // Adjust pattern based on intensity
      let adjustedPattern: number | number[];

      if (Array.isArray(pattern)) {
        const multiplier = this.getIntensityMultiplier();
        adjustedPattern = pattern.map(duration => Math.round(duration * multiplier));
      } else {
        adjustedPattern = Math.round(pattern * this.getIntensityMultiplier());
      }

      nav.vibrate(adjustedPattern);
      return true;
    } catch (error) {
      emitMobileFeatureWarning('Haptic feedback failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Trigger predefined haptic pattern
   */
  triggerPattern(patternName: keyof typeof HapticPatterns): boolean {
    const pattern = Array.from(HapticPatterns[patternName]);
    return this.vibrate(pattern);
  }

  /**
   * Trigger contextual feedback for tactical board actions
   */
  tacticalFeedback(action: 'select' | 'move' | 'formation_change' | 'success' | 'error'): boolean {
    switch (action) {
      case 'select':
        return this.triggerPattern('SELECTION');
      case 'move':
        return this.triggerPattern('LIGHT_TAP');
      case 'formation_change':
        return this.triggerPattern('FORMATION_CHANGE');
      case 'success':
        return this.triggerPattern('SUCCESS');
      case 'error':
        return this.triggerPattern('ERROR');
      default:
        return this.triggerPattern('LIGHT_TAP');
    }
  }

  /**
   * Adaptive feedback based on device and context
   */
  adaptiveFeedback(context: {
    action: string;
    importance: 'low' | 'medium' | 'high';
    batteryLevel?: number;
    thermalState?: string;
  }): boolean {
    // Reduce haptic feedback on low battery or thermal throttling
    if (context.batteryLevel && context.batteryLevel < 0.2) {
      return false;
    }

    if (context.thermalState === 'critical' || context.thermalState === 'serious') {
      return false;
    }

    let pattern: number[];

    switch (context.importance) {
      case 'low':
        pattern = Array.from(HapticPatterns.LIGHT_TAP);
        break;
      case 'medium':
        pattern = Array.from(HapticPatterns.MEDIUM_TAP);
        break;
      case 'high':
        pattern = Array.from(HapticPatterns.HEAVY_TAP);
        break;
      default:
        pattern = Array.from(HapticPatterns.LIGHT_TAP);
    }

    return this.vibrate(pattern);
  }

  private getIntensityMultiplier(): number {
    switch (this.intensity) {
      case 'light':
        return 0.7;
      case 'medium':
        return 1.0;
      case 'heavy':
        return 1.3;
      default:
        return 1.0;
    }
  }

  setIntensity(intensity: 'light' | 'medium' | 'heavy'): void {
    this.intensity = intensity;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isHapticSupported(): boolean {
    return this.supported;
  }
}

/**
 * Device Orientation Manager
 */
export class DeviceOrientationManager {
  private static instance: DeviceOrientationManager;
  private supported: boolean;
  private isPermissionGranted: boolean = false;
  private orientation: DeviceOrientation = {
    alpha: null,
    beta: null,
    gamma: null,
    absolute: false,
  };
  private motion: DeviceMotion = {
    acceleration: { x: null, y: null, z: null },
    accelerationIncludingGravity: { x: null, y: null, z: null },
    rotationRate: { alpha: null, beta: null, gamma: null },
    interval: 0,
  };
  private listeners: Set<(orientation: DeviceOrientation) => void> = new Set();
  private motionListeners: Set<(motion: DeviceMotion) => void> = new Set();

  static getInstance(): DeviceOrientationManager {
    if (!DeviceOrientationManager.instance) {
      DeviceOrientationManager.instance = new DeviceOrientationManager();
    }
    return DeviceOrientationManager.instance;
  }

  private constructor() {
    const win = getWindow() as
      | (typeof window & {
          DeviceOrientationEvent?: unknown;
          DeviceMotionEvent?: unknown;
        })
      | undefined;

    this.supported = !!win && 'DeviceOrientationEvent' in win && 'DeviceMotionEvent' in win;

    if (this.supported) {
      this.setupEventListeners();
    }
  }

  /**
   * Request permission for device orientation (iOS 13+)
   */
  async requestPermission(): Promise<boolean> {
    if (!this.supported) {
      return false;
    }

    try {
      // iOS 13+ requires permission
      const win = getWindow() as
        | (typeof window & {
            DeviceOrientationEvent?: {
              requestPermission?: () => Promise<string>;
            };
            DeviceMotionEvent?: {
              requestPermission?: () => Promise<string>;
            };
          })
        | undefined;

      if (
        win &&
        typeof win.DeviceOrientationEvent?.requestPermission === 'function' &&
        typeof win.DeviceMotionEvent?.requestPermission === 'function'
      ) {
        const orientationPermission = await win.DeviceOrientationEvent.requestPermission();
        const motionPermission = await win.DeviceMotionEvent.requestPermission();

        this.isPermissionGranted =
          orientationPermission === 'granted' && motionPermission === 'granted';
      } else {
        // Other browsers
        this.isPermissionGranted = true;
      }

      return this.isPermissionGranted;
    } catch (error) {
      emitMobileFeatureWarning('Device orientation permission request failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  private setupEventListeners(): void {
    const win = getWindow();
    if (!win) {
      return;
    }

    const handleOrientationChange = (event: DeviceOrientationEventData) => {
      this.orientation = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute,
      };

      this.listeners.forEach(listener => listener(this.orientation));
    };

    const handleMotionChange = (event: DeviceMotionEventData) => {
      this.motion = {
        acceleration: {
          x: event.acceleration?.x || null,
          y: event.acceleration?.y || null,
          z: event.acceleration?.z || null,
        },
        accelerationIncludingGravity: {
          x: event.accelerationIncludingGravity?.x || null,
          y: event.accelerationIncludingGravity?.y || null,
          z: event.accelerationIncludingGravity?.z || null,
        },
        rotationRate: {
          alpha: event.rotationRate?.alpha || null,
          beta: event.rotationRate?.beta || null,
          gamma: event.rotationRate?.gamma || null,
        },
        interval: event.interval,
      };

      this.motionListeners.forEach(listener => listener(this.motion));
    };

    win.addEventListener('deviceorientation', handleOrientationChange, { passive: true });
    win.addEventListener('devicemotion', handleMotionChange, { passive: true });
  }

  /**
   * Subscribe to orientation changes
   */
  onOrientationChange(callback: (orientation: DeviceOrientation) => void): () => void {
    this.listeners.add(callback);

    // Send current orientation immediately
    callback(this.orientation);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Subscribe to motion changes
   */
  onMotionChange(callback: (motion: DeviceMotion) => void): () => void {
    this.motionListeners.add(callback);

    // Send current motion immediately
    callback(this.motion);

    return () => {
      this.motionListeners.delete(callback);
    };
  }

  /**
   * Get current orientation
   */
  getCurrentOrientation(): DeviceOrientation {
    return { ...this.orientation };
  }

  /**
   * Get current motion data
   */
  getCurrentMotion(): DeviceMotion {
    return { ...this.motion };
  }

  /**
   * Check if device is in landscape mode
   */
  isLandscape(): boolean {
    const win = getWindow();
    if (!win) {
      return false;
    }
    return win.innerWidth > win.innerHeight;
  }

  /**
   * Get device tilt for tactical field orientation
   */
  getFieldTilt(): { x: number; y: number } {
    const beta = this.orientation.beta || 0;
    const gamma = this.orientation.gamma || 0;

    // Normalize to -1 to 1 range
    const x = Math.max(-1, Math.min(1, gamma / 45));
    const y = Math.max(-1, Math.min(1, (beta - 90) / 45));

    return { x, y };
  }

  isSupported(): boolean {
    return this.supported && this.isPermissionGranted;
  }
}

/**
 * Screen Orientation Manager
 */
export class ScreenOrientationManager {
  private static instance: ScreenOrientationManager;
  private listeners: Set<(orientation: ScreenOrientationType) => void> = new Set();

  static getInstance(): ScreenOrientationManager {
    if (!ScreenOrientationManager.instance) {
      ScreenOrientationManager.instance = new ScreenOrientationManager();
    }
    return ScreenOrientationManager.instance;
  }

  private constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const win = getWindow();
    if (!win) {
      return;
    }

    const handleOrientationChange = () => {
      const orientation = this.getCurrentOrientation();
      this.listeners.forEach(listener => listener(orientation));
    };

    win.addEventListener('orientationchange', handleOrientationChange);
    win.addEventListener('resize', handleOrientationChange);
  }

  /**
   * Get current screen orientation
   */
  getCurrentOrientation(): ScreenOrientationType {
    const orientation = getScreenOrientation();
    if (orientation?.type) {
      return orientation.type as ScreenOrientationType;
    }

    // Fallback based on window dimensions
    const win = getWindow();
    if (!win) {
      return 'portrait-primary';
    }
    const isLandscape = win.innerWidth > win.innerHeight;
    return isLandscape ? 'landscape-primary' : 'portrait-primary';
  }

  /**
   * Lock screen orientation
   */
  async lockOrientation(orientation: OrientationLock): Promise<boolean> {
    const orientationApi = getScreenOrientation();
    if (orientationApi?.lock) {
      try {
        await orientationApi.lock(orientation);
        return true;
      } catch (error) {
        emitMobileFeatureWarning('Screen orientation lock failed', {
          error: error instanceof Error ? error.message : String(error),
          orientation,
        });
        return false;
      }
    }

    return false;
  }

  /**
   * Unlock screen orientation
   */
  unlockOrientation(): void {
    const orientationApi = getScreenOrientation();
    orientationApi?.unlock?.();
  }

  /**
   * Subscribe to orientation changes
   */
  onOrientationChange(callback: (orientation: ScreenOrientationType) => void): () => void {
    this.listeners.add(callback);

    // Send current orientation immediately
    callback(this.getCurrentOrientation());

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Optimize orientation for tactical board
   */
  async optimizeForTacticalBoard(): Promise<boolean> {
    // For tactical board, landscape is usually better
    return await this.lockOrientation('landscape');
  }
}

/**
 * React Hooks for Mobile Features
 */

/**
 * Hook for haptic feedback
 */
export const useHapticFeedback = () => {
  const hapticManager = useRef(HapticFeedbackManager.getInstance());
  const capabilities = useMobileCapabilities();

  const triggerHaptic = useCallback(
    (pattern: keyof typeof HapticPatterns | number | number[]) => {
      if (!capabilities.hasHapticFeedback) {
        return false;
      }

      if (typeof pattern === 'string') {
        return hapticManager.current.triggerPattern(pattern);
      } else {
        return hapticManager.current.vibrate(pattern);
      }
    },
    [capabilities.hasHapticFeedback]
  );

  const tacticalFeedback = useCallback(
    (action: 'select' | 'move' | 'formation_change' | 'success' | 'error') => {
      return hapticManager.current.tacticalFeedback(action);
    },
    []
  );

  const adaptiveFeedback = useCallback(
    (context: {
      action: string;
      importance: 'low' | 'medium' | 'high';
      batteryLevel?: number;
      thermalState?: string;
    }) => {
      return hapticManager.current.adaptiveFeedback(context);
    },
    []
  );

  return {
    triggerHaptic,
    tacticalFeedback,
    adaptiveFeedback,
    isSupported: capabilities.hasHapticFeedback,
    setIntensity: hapticManager.current.setIntensity.bind(hapticManager.current),
    setEnabled: hapticManager.current.setEnabled.bind(hapticManager.current),
  };
};

/**
 * Hook for device orientation
 */
export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState<DeviceOrientation>({
    alpha: null,
    beta: null,
    gamma: null,
    absolute: false,
  });
  const [motion, setMotion] = useState<DeviceMotion>({
    acceleration: { x: null, y: null, z: null },
    accelerationIncludingGravity: { x: null, y: null, z: null },
    rotationRate: { alpha: null, beta: null, gamma: null },
    interval: 0,
  });
  const [isSupported, setIsSupported] = useState(false);
  const orientationManager = useRef(DeviceOrientationManager.getInstance());

  useEffect(() => {
    let unsubscribeOrientation: (() => void) | undefined;
    let unsubscribeMotion: (() => void) | undefined;
    let cancelled = false;

    const setup = async () => {
      const hasPermission = await orientationManager.current.requestPermission();
      if (cancelled) {
        return;
      }

      setIsSupported(hasPermission);

      if (hasPermission) {
        unsubscribeOrientation = orientationManager.current.onOrientationChange(setOrientation);
        unsubscribeMotion = orientationManager.current.onMotionChange(setMotion);
      }
    };

    setup();

    return () => {
      cancelled = true;
      unsubscribeOrientation?.();
      unsubscribeMotion?.();
    };
  }, []);

  const getFieldTilt = useCallback(() => {
    return orientationManager.current.getFieldTilt();
  }, []);

  return {
    orientation,
    motion,
    isSupported,
    getFieldTilt,
    isLandscape: orientationManager.current.isLandscape.bind(orientationManager.current),
  };
};

/**
 * Hook for screen orientation
 */
export const useScreenOrientation = () => {
  const [orientation, setOrientation] = useState<ScreenOrientationType>('portrait-primary');
  const orientationManager = useRef(ScreenOrientationManager.getInstance());

  useEffect(() => {
    const unsubscribe = orientationManager.current.onOrientationChange(setOrientation);
    return unsubscribe;
  }, []);

  const lockOrientation = useCallback(async (lockType: OrientationLock) => {
    return await orientationManager.current.lockOrientation(lockType);
  }, []);

  const unlockOrientation = useCallback(() => {
    orientationManager.current.unlockOrientation();
  }, []);

  const optimizeForTacticalBoard = useCallback(async () => {
    return await orientationManager.current.optimizeForTacticalBoard();
  }, []);

  return {
    orientation,
    lockOrientation,
    unlockOrientation,
    optimizeForTacticalBoard,
    isLandscape: orientation.includes('landscape'),
    isPortrait: orientation.includes('portrait'),
  };
};

/**
 * Hook for Wake Lock API (keep screen on)
 */
export const useWakeLock = () => {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    const nav = getNavigator();
    setIsSupported(!!nav?.wakeLock);
  }, []);

  const requestWakeLock = useCallback(async () => {
    const nav = getNavigator();
    if (!nav?.wakeLock) {
      setIsSupported(false);
      return false;
    }

    try {
      const sentinel = await nav.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      setIsActive(true);

      sentinel.addEventListener?.('release', () => {
        setIsActive(false);
      });

      return true;
    } catch (error) {
      emitMobileFeatureWarning('Wake lock request failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    const sentinel = wakeLockRef.current;
    if (sentinel) {
      try {
        await sentinel.release();
        wakeLockRef.current = null;
        setIsActive(false);
        return true;
      } catch (error) {
        emitMobileFeatureWarning('Wake lock release failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    }
    return false;
  }, []);

  // Auto-release on page visibility change
  useEffect(() => {
    const doc = getDocument();
    if (!doc) {
      return () => undefined;
    }

    const handleVisibilityChange = () => {
      if (doc.visibilityState === 'hidden' && isActive) {
        void releaseWakeLock();
      }
    };

    doc.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      doc.removeEventListener('visibilitychange', handleVisibilityChange);
      void releaseWakeLock();
    };
  }, [isActive, releaseWakeLock]);

  return {
    isActive,
    isSupported,
    requestWakeLock,
    releaseWakeLock,
  };
};

// Global instances
export const hapticManager = HapticFeedbackManager.getInstance();
export const orientationManager = DeviceOrientationManager.getInstance();
export const screenOrientationManager = ScreenOrientationManager.getInstance();

// Utility functions
export const requestMobilePermissions = async (): Promise<{
  orientation: boolean;
  haptic: boolean;
}> => {
  const orientation = await orientationManager.requestPermission();
  const haptic = hapticManager.isHapticSupported();

  return { orientation, haptic };
};

export const optimizeMobileExperience = async (): Promise<void> => {
  // Request all necessary permissions
  await requestMobilePermissions();

  // Optimize screen orientation for tactical board
  await screenOrientationManager.optimizeForTacticalBoard();

  // Set medium haptic intensity by default
  hapticManager.setIntensity('medium');

  emitMobileFeatureInfo('Mobile experience optimized for tactical board');
};

export default {
  HapticFeedbackManager,
  DeviceOrientationManager,
  ScreenOrientationManager,
  useHapticFeedback,
  useDeviceOrientation,
  useScreenOrientation,
  useWakeLock,
  HapticPatterns,
  hapticManager,
  orientationManager,
  screenOrientationManager,
  requestMobilePermissions,
  optimizeMobileExperience,
};
