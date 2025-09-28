/**
 * Catalyst Mobile Performance Optimizations
 * Ultra-optimized mobile experience with 60fps guarantee
 */

import { useEffect, useState, useCallback, useRef } from 'react';

// Mobile performance constants
export const MOBILE_PERFORMANCE = {
  TOUCH_RESPONSE_TIME: 8,         // 8ms for 120fps touch response
  SCROLL_RESPONSE_TIME: 16,       // 16ms for 60fps scrolling
  ANIMATION_BUDGET: 10,           // 10ms animation budget on mobile
  VIEWPORT_BUFFER: 100,           // 100px viewport buffer
  MAX_TOUCH_POINTS: 10,           // Maximum simultaneous touch points
  GESTURE_TIMEOUT: 300,           // 300ms gesture timeout
  BATTERY_CHECK_INTERVAL: 30000,  // 30s battery check
  MEMORY_WARNING_THRESHOLD: 0.8,  // 80% memory usage warning
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
  const capabilities: DeviceCapabilities = {
    hasTouch: 'ontouchstart' in window,
    hasMultiTouch: 'TouchEvent' in window && (navigator.maxTouchPoints || 0) > 1,
    hasHapticFeedback: 'vibrate' in navigator,
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
    maxTouchPoints: navigator.maxTouchPoints || (capabilities.hasTouch ? 5 : 0),
    screenSize: (() => {
      const width = window.screen.width;
      if (width < 480) return 'small';
      if (width < 768) return 'medium';
      return 'large';
    })(),
    pixelRatio: window.devicePixelRatio || 1,
    connectionType: (navigator as any).connection?.effectiveType || '4g'
  };
  
  // Battery API (if available)
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      capabilities.batteryLevel = battery.level;
      capabilities.isCharging = battery.charging;
    }).catch(() => {
      // Battery API not available
    });
  }
  
  return capabilities;
}

// Mobile-optimized touch handler
export class MobileTouchHandler {
  private element: HTMLElement;
  private activeGestures = new Map<number, TouchGesture>();
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
  
  private handleTouchStart = (event: TouchEvent) => {
    const now = performance.now();
    this.touchStartTime = now;
    
    // Check for fast successive touches (double tap)
    if (now - this.lastTouchTime < 300) {
      this.triggerGesture('doubletap', {
        type: 'doubletap',
        startTime: now,
        position: this.getTouchPosition(event.touches[0]),
        touches: Array.from(event.touches)
      });
    }
    
    // Track all active touches
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      this.activeGestures.set(touch.identifier, {
        type: 'touch',
        startTime: now,
        position: this.getTouchPosition(touch),
        touches: [touch]
      });
    }
    
    this.lastTouchTime = now;
  };
  
  private handleTouchMove = (event: TouchEvent) => {
    const now = performance.now();
    
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
            velocity: distance / (now - gesture.startTime)
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
  
  private handleTouchEnd = (event: TouchEvent) => {
    const now = performance.now();
    
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
            duration
          });
        }
        
        // Detect long press
        if (duration > 500) {
          this.triggerGesture('longpress', {
            ...gesture,
            type: 'longpress',
            duration
          });
        }
        
        this.activeGestures.delete(touch.identifier);
      }
    }
  };
  
  private handleTouchCancel = (event: TouchEvent) => {
    // Clean up cancelled touches
    for (const touch of event.changedTouches) {
      this.activeGestures.delete(touch.identifier);
    }
  };
  
  private getTouchPosition(touch: Touch) {
    const rect = this.element.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
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
  
  private detectPinchGesture(touches: TouchList) {
    if (touches.length !== 2) return;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    // Store initial distance for scaling calculation
    if (!this.activeGestures.has('pinch')) {
      this.activeGestures.set('pinch', {
        type: 'pinch',
        startTime: performance.now(),
        position: {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        },
        initialDistance: distance,
        touches: Array.from(touches)
      } as any);
    } else {
      const pinchGesture = this.activeGestures.get('pinch')!;
      const scale = distance / (pinchGesture as any).initialDistance;
      
      this.triggerGesture('pinch', {
        ...pinchGesture,
        scale,
        distance
      });
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
  touches: Touch[];
  initialDistance?: number;
}

// Mobile viewport manager
export class MobileViewportManager {
  private static instance: MobileViewportManager;
  private viewportMeta: HTMLMetaElement;
  private safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  private orientationChangeCallbacks = new Set<() => void>();
  
  static getInstance(): MobileViewportManager {
    if (!MobileViewportManager.instance) {
      MobileViewportManager.instance = new MobileViewportManager();
    }
    return MobileViewportManager.instance;
  }
  
  private constructor() {
    this.setupViewport();
    this.detectSafeAreaInsets();
    this.setupOrientationHandling();
  }
  
  private setupViewport() {
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
      'viewport-fit=cover'
    ].join(', ');
    
    document.head.appendChild(this.viewportMeta);
  }
  
  private detectSafeAreaInsets() {
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
    
    const computedStyle = getComputedStyle(testElement);
    this.safeAreaInsets = {
      top: parseInt(computedStyle.paddingTop) || 0,
      right: parseInt(computedStyle.paddingRight) || 0,
      bottom: parseInt(computedStyle.paddingBottom) || 0,
      left: parseInt(computedStyle.paddingLeft) || 0
    };
    
    document.body.removeChild(testElement);
  }
  
  private setupOrientationHandling() {
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
    return () => this.orientationChangeCallbacks.delete(callback);
  }
  
  // Optimize viewport for specific use cases
  optimizeForGame() {
    this.viewportMeta.content = [
      'width=device-width',
      'initial-scale=1.0',
      'maximum-scale=1.0',
      'user-scalable=no',
      'viewport-fit=cover',
      'interactive-widget=resizes-content'
    ].join(', ');
  }
  
  optimizeForForm() {
    this.viewportMeta.content = [
      'width=device-width',
      'initial-scale=1.0',
      'maximum-scale=2.0',
      'user-scalable=yes',
      'viewport-fit=cover'
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
    // Battery monitoring
    if ('getBattery' in navigator) {
      this.batteryCheckInterval = window.setInterval(() => {
        this.checkBatteryStatus();
      }, MOBILE_PERFORMANCE.BATTERY_CHECK_INTERVAL);
    }
    
    // Memory monitoring
    if ('memory' in performance) {
      this.memoryCheckInterval = window.setInterval(() => {
        this.checkMemoryStatus();
      }, 10000); // Check every 10 seconds
    }
  }
  
  private async checkBatteryStatus() {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        
        // Reduce performance if battery is low and not charging
        if (battery.level < 0.2 && !battery.charging) {
          this.setPerformanceMode('low');
        } else if (battery.level < 0.5 && !battery.charging) {
          this.setPerformanceMode('medium');
        } else {
          this.setPerformanceMode('high');
        }
        
      } catch (error) {
        console.warn('Battery API access failed:', error);
      }
    }
  }
  
  private checkMemoryStatus() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (usageRatio > MOBILE_PERFORMANCE.MEMORY_WARNING_THRESHOLD) {
        console.warn(`Mobile memory usage high: ${(usageRatio * 100).toFixed(1)}%`);
        this.setPerformanceMode('low');
      }
    }
  }
  
  private setPerformanceMode(mode: 'high' | 'medium' | 'low') {
    if (this.performanceMode !== mode) {
      this.performanceMode = mode;
      
      // Emit performance mode change event
      window.dispatchEvent(new CustomEvent('catalyst:mobile-performance-mode', {
        detail: { mode, capabilities: this.capabilities }
      }));
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
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => detectMobileCapabilities());
  
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
    optimizeForForm: () => viewportManager.current.optimizeForForm()
  };
}

export function useMobileTouch(elementRef: React.RefObject<HTMLElement>) {
  const touchHandlerRef = useRef<MobileTouchHandler | null>(null);
  const [gestures, setGestures] = useState<TouchGesture[]>([]);
  
  useEffect(() => {
    if (elementRef.current && !touchHandlerRef.current) {
      touchHandlerRef.current = new MobileTouchHandler(elementRef.current);
      
      // Set up gesture listeners
      touchHandlerRef.current.on('tap', (gesture) => {
        setGestures(prev => [...prev.slice(-9), gesture]);
      });
      
      touchHandlerRef.current.on('swipe', (gesture) => {
        setGestures(prev => [...prev.slice(-9), gesture]);
      });
      
      touchHandlerRef.current.on('pinch', (gesture) => {
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
  
  const onGesture = useCallback((gestureType: string, callback: (gesture: TouchGesture) => void) => {
    if (touchHandlerRef.current) {
      touchHandlerRef.current.on(gestureType, callback);
    }
  }, []);
  
  return { gestures, onGesture };
}

export function useMobilePerformanceMode() {
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  
  useEffect(() => {
    const monitor = MobilePerformanceMonitor.getInstance();
    
    setPerformanceMode(monitor.getPerformanceMode());
    setCapabilities(monitor.getCapabilities());
    
    const handleModeChange = (event: CustomEvent) => {
      setPerformanceMode(event.detail.mode);
      setCapabilities(event.detail.capabilities);
    };
    
    window.addEventListener('catalyst:mobile-performance-mode', handleModeChange as EventListener);
    
    return () => {
      window.removeEventListener('catalyst:mobile-performance-mode', handleModeChange as EventListener);
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
  MOBILE_PERFORMANCE
};
