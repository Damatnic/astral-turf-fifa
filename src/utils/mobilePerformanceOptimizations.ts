/**
 * Catalyst Mobile Performance Optimizations
 * Ultra-optimized mobile experience with 60fps guarantee
 */

import { useEffect, useState, useCallback, useRef, type RefObject } from 'react';

const PINCH_GESTURE_KEY = '__pinch__';

type NavigatorInstance = typeof window extends { navigator: infer T } ? T : never;

type ExtendedNavigator = NavigatorInstance & {
  connection?: {
    effectiveType?: string;
  };
  maxTouchPoints?: number;
  getBattery?: () => Promise<{
    level: number;
    charging: boolean;
  }>;
};

const getNavigator = (): ExtendedNavigator | undefined =>
  typeof window !== 'undefined' && typeof window.navigator !== 'undefined'
    ? (window.navigator as ExtendedNavigator)
    : undefined;

const getPerformance = () =>
  typeof window !== 'undefined' && typeof window.performance !== 'undefined'
    ? window.performance
    : undefined;

const getNow = () => {
  const perf = getPerformance();
  return perf && typeof perf.now === 'function' ? perf.now() : Date.now();
};

interface TouchPoint {
  identifier: number;
  clientX: number;
  clientY: number;
  force?: number;
  radiusX?: number;
  radiusY?: number;
}

type TouchListLike = ArrayLike<TouchPoint> & Iterable<TouchPoint>;

interface TouchEventLike extends Event {
  readonly touches: TouchListLike;
  readonly changedTouches: TouchListLike;
  preventDefault(): void;
}

const dispatchWindowEvent = <T>(type: string, detail: T): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (typeof window.CustomEvent === 'function') {
      window.dispatchEvent(new window.CustomEvent(type, { detail }));
      return;
    }

    if (typeof document !== 'undefined' && typeof document.createEvent === 'function') {
      const event = document.createEvent('CustomEvent');
      event.initCustomEvent(type, false, false, detail);
      window.dispatchEvent(event);
      return;
    }

    window.dispatchEvent(new Event(type));
  } catch {
    // Silently ignore if events cannot be dispatched in this environment
  }
};

const emitMobilePerformanceWarning = (
  warning: 'battery' | 'memory' | 'general',
  payload: Record<string, unknown> = {}
): void => {
  dispatchWindowEvent('catalyst:mobile-performance-warning', {
    type: warning,
    timestamp: Date.now(),
    ...payload,
  });
};

// Mobile performance constants
export const MOBILE_PERFORMANCE = {
  TOUCH_RESPONSE_TIME: 8, // 8ms for 120fps touch response
  SCROLL_RESPONSE_TIME: 16, // 16ms for 60fps scrolling
  ANIMATION_BUDGET: 10, // 10ms animation budget on mobile
  VIEWPORT_BUFFER: 100, // 100px viewport buffer
  MAX_TOUCH_POINTS: 10, // Maximum simultaneous touch points
  GESTURE_TIMEOUT: 300, // 300ms gesture timeout
  BATTERY_CHECK_INTERVAL: 30000, // 30s battery check
  MEMORY_WARNING_THRESHOLD: 0.8, // 80% memory usage warning
} as const;

// Device capability detection
interface DeviceCapabilities {
  hasTouch: boolean;
  hasMultiTouch: boolean;
  hasHapticFeedback: boolean;
  hasOrientationAPI: boolean;
  hasDeviceMotion: boolean;
  hasWebGL: boolean;
  maxTouchPoints: number;
  screenSize: 'small' | 'medium' | 'large';
  pixelRatio: number;
  batteryLevel?: number;
  isCharging?: boolean;
  connectionType: string;
}

// Enhanced device capability detection
export function detectMobileCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      hasTouch: false,
      hasMultiTouch: false,
      hasHapticFeedback: false,
      hasOrientationAPI: false,
      hasDeviceMotion: false,
      hasWebGL: false,
      maxTouchPoints: 0,
      screenSize: 'medium',
      pixelRatio: 1,
      connectionType: 'unknown',
    };
  }

  const nav = getNavigator();
  const hasTouch = 'ontouchstart' in window;
  const maxTouchPoints = nav?.maxTouchPoints ?? (hasTouch ? 5 : 0);

  const capabilities: DeviceCapabilities = {
    hasTouch,
    hasMultiTouch: typeof window !== 'undefined' && 'TouchEvent' in window && maxTouchPoints > 1,
    hasHapticFeedback: !!nav && typeof nav.vibrate === 'function',
    hasOrientationAPI: 'DeviceOrientationEvent' in window,
    hasDeviceMotion: 'DeviceMotionEvent' in window,
    hasWebGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch {
        return false;
      }
    })(),
    maxTouchPoints,
    screenSize: (() => {
      const width = window.screen.width;
      if (width < 480) {
        return 'small';
      }
      if (width < 768) {
        return 'medium';
      }
      return 'large';
    })(),
    pixelRatio: window.devicePixelRatio || 1,
    connectionType: nav?.connection?.effectiveType ?? '4g',
  };

  if (nav && typeof nav.getBattery === 'function') {
    nav
      .getBattery()
      .then(battery => {
        capabilities.batteryLevel = battery.level;
        capabilities.isCharging = battery.charging;
      })
      .catch(() => {
        // Battery API not available or denied
      });
  }

  return capabilities;
}

// Mobile-optimized touch handler
export class MobileTouchHandler {
  private element: HTMLElement;
  private activeGestures = new Map<number | typeof PINCH_GESTURE_KEY, TouchGesture>();
  private gestureCallbacks = new Map<string, (gesture: TouchGesture) => void>();
  private lastTouchTime = 0;
  private touchStartTime = 0;
  private isScrolling = false;

  constructor(element: HTMLElement) {
    this.element = element;
    this.setupTouchListeners();
  }

  private setupTouchListeners() {
    // Passive listeners for better scrolling performance
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: true });
  }

  private handleTouchStart = (event: TouchEventLike) => {
    const now = getNow();
    this.touchStartTime = now;

    // Check for fast successive touches (double tap)
    if (now - this.lastTouchTime < 300) {
      this.triggerGesture('doubletap', {
        type: 'doubletap',
        startTime: now,
        position: this.getTouchPosition(event.touches[0]),
        touches: Array.from(event.touches),
      });
    }

    // Track all active touches
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      this.activeGestures.set(touch.identifier, {
        type: 'touch',
        startTime: now,
        position: this.getTouchPosition(touch),
        touches: [touch],
      });
    }

    this.lastTouchTime = now;
  };

  private handleTouchMove = (event: TouchEventLike) => {
    const now = getNow();

    // Throttle touch move for performance
    if (now - this.lastTouchTime < MOBILE_PERFORMANCE.TOUCH_RESPONSE_TIME) {
      return;
    }

    // Prevent default for controlled scrolling
    if (!this.isScrolling) {
      event.preventDefault();
    }

    // Update active gestures
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const gesture = this.activeGestures.get(touch.identifier);

      if (gesture) {
        const currentPos = this.getTouchPosition(touch);
        const deltaX = currentPos.x - gesture.position.x;
        const deltaY = currentPos.y - gesture.position.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Detect swipe gesture
        if (distance > 30 && now - gesture.startTime > 100) {
          this.triggerGesture('swipe', {
            ...gesture,
            type: 'swipe',
            direction: this.getSwipeDirection(deltaX, deltaY),
            distance,
            velocity: distance / (now - gesture.startTime),
          });
        }

        // Update gesture
        gesture.currentPosition = currentPos;
        gesture.deltaX = deltaX;
        gesture.deltaY = deltaY;
      }
    }

    // Detect pinch gesture
    if (event.touches.length === 2) {
      this.detectPinchGesture(event.touches);
    }

    this.lastTouchTime = now;
  };

  private handleTouchEnd = (event: TouchEventLike) => {
    const now = getNow();

    // Clean up ended touches
    for (const touch of event.changedTouches) {
      const gesture = this.activeGestures.get(touch.identifier);

      if (gesture) {
        const duration = now - gesture.startTime;

        // Detect tap gesture
        if (duration < 200 && (!gesture.deltaX || Math.abs(gesture.deltaX) < 10)) {
          this.triggerGesture('tap', {
            ...gesture,
            type: 'tap',
            duration,
          });
        }

        // Detect long press
        if (duration > 500) {
          this.triggerGesture('longpress', {
            ...gesture,
            type: 'longpress',
            duration,
          });
        }

        this.activeGestures.delete(touch.identifier);
      }
    }
  };

  private handleTouchCancel = (event: TouchEventLike) => {
    // Clean up cancelled touches
    for (const touch of event.changedTouches) {
      this.activeGestures.delete(touch.identifier);
    }
  };

  private getTouchPosition(touch: TouchPoint) {
    const rect = this.element.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  private getSwipeDirection(deltaX: number, deltaY: number): string {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  private detectPinchGesture(touches: TouchListLike) {
    if (touches.length !== 2) {
      return;
    }

    const touch1 = touches[0];
    const touch2 = touches[1];

    if (!touch1 || !touch2) {
      return;
    }

    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    // Store initial distance for scaling calculation
    if (!this.activeGestures.has(PINCH_GESTURE_KEY)) {
      const pinchGesture: TouchGesture = {
        type: 'pinch',
        startTime: getNow(),
        position: {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        },
        touches: Array.from(touches),
        initialDistance: distance,
        distance,
        scale: 1,
      };
      this.activeGestures.set(PINCH_GESTURE_KEY, pinchGesture);
    } else {
      const pinchGesture = this.activeGestures.get(PINCH_GESTURE_KEY) as TouchGesture & {
        initialDistance: number;
      };
      const scale = distance / pinchGesture.initialDistance;
      const updatedGesture: TouchGesture = {
        ...pinchGesture,
        scale,
        distance,
        touches: Array.from(touches),
      };
      this.activeGestures.set(PINCH_GESTURE_KEY, updatedGesture);
      this.triggerGesture('pinch', updatedGesture);
    }
  }

  private triggerGesture(type: string, gesture: TouchGesture) {
    const callback = this.gestureCallbacks.get(type);
    if (callback) {
      callback(gesture);
    }
  }

  on(gestureType: string, callback: (gesture: TouchGesture) => void) {
    this.gestureCallbacks.set(gestureType, callback);
  }

  off(gestureType: string) {
    this.gestureCallbacks.delete(gestureType);
  }

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);

    this.activeGestures.clear();
    this.gestureCallbacks.clear();
  }
}

interface TouchGesture {
  type: string;
  startTime: number;
  position: { x: number; y: number };
  currentPosition?: { x: number; y: number };
  deltaX?: number;
  deltaY?: number;
  direction?: string;
  distance?: number;
  velocity?: number;
  duration?: number;
  scale?: number;
  touches: TouchPoint[];
  initialDistance?: number;
}

// Mobile viewport manager
export class MobileViewportManager {
  private static instance: MobileViewportManager;
  private viewportMeta: globalThis.HTMLMetaElement | null = null;
  private safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  private orientationChangeCallbacks = new Set<() => void>();

  static getInstance(): MobileViewportManager {
    if (!MobileViewportManager.instance) {
      MobileViewportManager.instance = new MobileViewportManager();
    }
    return MobileViewportManager.instance;
  }

  private constructor() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.setupViewport();
    this.detectSafeAreaInsets();
    this.setupOrientationHandling();
  }

  private setupViewport() {
    if (typeof document === 'undefined') {
      return;
    }

    // Remove existing viewport meta tag
    const existing = document.querySelector('meta[name="viewport"]');
    if (existing) {
      existing.remove();
    }

    // Create optimized viewport meta tag
    this.viewportMeta = document.createElement('meta');
    this.viewportMeta.name = 'viewport';
    this.viewportMeta.content = [
      'width=device-width',
      'initial-scale=1.0',
      'maximum-scale=1.0',
      'user-scalable=no',
      'viewport-fit=cover',
    ].join(', ');

    document.head.appendChild(this.viewportMeta);
  }

  private detectSafeAreaInsets() {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.body) {
      return;
    }

    // Detect safe area insets for notched devices
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
      box-sizing: border-box;
      pointer-events: none;
      visibility: hidden;
    `;

    document.body.appendChild(testElement);

    const computedStyle = window.getComputedStyle(testElement);
    this.safeAreaInsets = {
      top: parseInt(computedStyle.paddingTop) || 0,
      right: parseInt(computedStyle.paddingRight) || 0,
      bottom: parseInt(computedStyle.paddingBottom) || 0,
      left: parseInt(computedStyle.paddingLeft) || 0,
    };

    document.body.removeChild(testElement);
  }

  private setupOrientationHandling() {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOrientationChange = () => {
      // Delay to allow viewport to settle
      setTimeout(() => {
        this.detectSafeAreaInsets();
        this.orientationChangeCallbacks.forEach(callback => callback());
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
  }

  getSafeAreaInsets() {
    return { ...this.safeAreaInsets };
  }

  onOrientationChange(callback: () => void) {
    this.orientationChangeCallbacks.add(callback);
    return () => {
      this.orientationChangeCallbacks.delete(callback);
    };
  }

  // Optimize viewport for specific use cases
  optimizeForGame() {
    if (!this.viewportMeta) {
      return;
    }

    this.viewportMeta.content = [
      'width=device-width',
      'initial-scale=1.0',
      'maximum-scale=1.0',
      'user-scalable=no',
      'viewport-fit=cover',
      'interactive-widget=resizes-content',
    ].join(', ');
  }

  optimizeForForm() {
    if (!this.viewportMeta) {
      return;
    }

    this.viewportMeta.content = [
      'width=device-width',
      'initial-scale=1.0',
      'maximum-scale=2.0',
      'user-scalable=yes',
      'viewport-fit=cover',
    ].join(', ');
  }
}

// Mobile performance monitor
export class MobilePerformanceMonitor {
  private static instance: MobilePerformanceMonitor;
  private capabilities: DeviceCapabilities;
  private batteryCheckInterval: number | null = null;
  private memoryCheckInterval: number | null = null;
  private performanceMode: 'high' | 'medium' | 'low' = 'high';

  static getInstance(): MobilePerformanceMonitor {
    if (!MobilePerformanceMonitor.instance) {
      MobilePerformanceMonitor.instance = new MobilePerformanceMonitor();
    }
    return MobilePerformanceMonitor.instance;
  }

  private constructor() {
    this.capabilities = detectMobileCapabilities();
    this.startMonitoring();
  }

  private startMonitoring() {
    if (typeof window === 'undefined') {
      return;
    }

    // Battery monitoring
    const nav = getNavigator();
    if (nav && typeof nav.getBattery === 'function') {
      this.batteryCheckInterval = window.setInterval(() => {
        this.checkBatteryStatus();
      }, MOBILE_PERFORMANCE.BATTERY_CHECK_INTERVAL);
    }

    // Memory monitoring
    const perf = getPerformance();
    if (perf && 'memory' in perf) {
      this.memoryCheckInterval = window.setInterval(() => {
        this.checkMemoryStatus();
      }, 10000); // Check every 10 seconds
    }
  }

  private async checkBatteryStatus() {
    const nav = getNavigator();
    if (nav && typeof nav.getBattery === 'function') {
      try {
        const battery = await nav.getBattery();

        // Reduce performance if battery is low and not charging
        if (battery.level < 0.2 && !battery.charging) {
          this.setPerformanceMode('low');
        } else if (battery.level < 0.5 && !battery.charging) {
          this.setPerformanceMode('medium');
        } else {
          this.setPerformanceMode('high');
        }
      } catch (error) {
        emitMobilePerformanceWarning('battery', {
          message: 'Battery API access failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private checkMemoryStatus() {
    const perf = getPerformance();
    if (perf && 'memory' in perf) {
      const memory = (
        perf as unknown as {
          memory: {
            usedJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        }
      ).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      if (usageRatio > MOBILE_PERFORMANCE.MEMORY_WARNING_THRESHOLD) {
        emitMobilePerformanceWarning('memory', {
          message: 'Mobile memory usage high',
          usage: Number((usageRatio * 100).toFixed(1)),
        });
        this.setPerformanceMode('low');
      }
    }
  }

  private setPerformanceMode(mode: 'high' | 'medium' | 'low') {
    if (this.performanceMode !== mode) {
      this.performanceMode = mode;

      // Emit performance mode change event
      dispatchWindowEvent('catalyst:mobile-performance-mode', {
        mode,
        capabilities: this.capabilities,
      });
    }
  }

  getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities };
  }

  getPerformanceMode(): 'high' | 'medium' | 'low' {
    return this.performanceMode;
  }

  cleanup() {
    if (this.batteryCheckInterval) {
      clearInterval(this.batteryCheckInterval);
      this.batteryCheckInterval = null;
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }
}

// React hooks for mobile optimizations
export function useMobileCapabilities() {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() =>
    detectMobileCapabilities()
  );

  useEffect(() => {
    // Update capabilities on orientation change
    const handleOrientationChange = () => {
      setCapabilities(detectMobileCapabilities());
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return capabilities;
}

export function useMobileViewport() {
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const viewportManager = useRef(MobileViewportManager.getInstance());

  useEffect(() => {
    const updateInsets = () => {
      setSafeAreaInsets(viewportManager.current.getSafeAreaInsets());
    };

    updateInsets();
    const unsubscribe = viewportManager.current.onOrientationChange(updateInsets);

    return unsubscribe;
  }, []);

  return {
    safeAreaTop: safeAreaInsets.top,
    safeAreaRight: safeAreaInsets.right,
    safeAreaBottom: safeAreaInsets.bottom,
    safeAreaLeft: safeAreaInsets.left,
    optimizeForGame: () => viewportManager.current.optimizeForGame(),
    optimizeForForm: () => viewportManager.current.optimizeForForm(),
  };
}

export function useMobileTouch(elementRef: RefObject<HTMLElement>) {
  const touchHandlerRef = useRef<MobileTouchHandler | null>(null);
  const [gestures, setGestures] = useState<TouchGesture[]>([]);

  useEffect(() => {
    if (elementRef.current && !touchHandlerRef.current) {
      touchHandlerRef.current = new MobileTouchHandler(elementRef.current);

      // Set up gesture listeners
      touchHandlerRef.current.on('tap', gesture => {
        setGestures(prev => [...prev.slice(-9), gesture]);
      });

      touchHandlerRef.current.on('swipe', gesture => {
        setGestures(prev => [...prev.slice(-9), gesture]);
      });

      touchHandlerRef.current.on('pinch', gesture => {
        setGestures(prev => [...prev.slice(-9), gesture]);
      });
    }

    return () => {
      if (touchHandlerRef.current) {
        touchHandlerRef.current.destroy();
        touchHandlerRef.current = null;
      }
    };
  }, [elementRef]);

  const onGesture = useCallback(
    (gestureType: string, callback: (gesture: TouchGesture) => void) => {
      if (touchHandlerRef.current) {
        touchHandlerRef.current.on(gestureType, callback);
      }
    },
    []
  );

  return { gestures, onGesture };
}

export function useMobilePerformanceMode() {
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);

  useEffect(() => {
    const monitor = MobilePerformanceMonitor.getInstance();

    setPerformanceMode(monitor.getPerformanceMode());
    setCapabilities(monitor.getCapabilities());

    const handleModeChange = (event: Event) => {
      const customEvent = event as globalThis.CustomEvent<{
        mode: 'high' | 'medium' | 'low';
        capabilities: DeviceCapabilities;
      }>;

      if (!customEvent.detail) {
        setPerformanceMode(monitor.getPerformanceMode());
        setCapabilities(monitor.getCapabilities());
        return;
      }

      setPerformanceMode(customEvent.detail.mode);
      setCapabilities(customEvent.detail.capabilities);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('catalyst:mobile-performance-mode', handleModeChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('catalyst:mobile-performance-mode', handleModeChange);
      }
    };
  }, []);

  return { performanceMode, capabilities };
}

export default {
  detectMobileCapabilities,
  MobileTouchHandler,
  MobileViewportManager,
  MobilePerformanceMonitor,
  useMobileCapabilities,
  useMobileViewport,
  useMobileTouch,
  useMobilePerformanceMode,
  MOBILE_PERFORMANCE,
};
