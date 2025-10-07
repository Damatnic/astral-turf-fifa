/**
 * Mobile-Specific Performance and UX Optimizations
 * Implements Sigma's mobile excellence standards
 */

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';

// Mobile device detection and capabilities
export interface MobileCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  supportsTouchEvents: boolean;
  supportsPointerEvents: boolean;
  supportsHover: boolean;
  hasHapticFeedback: boolean;
  devicePixelRatio: number;
  viewportWidth: number;
  viewportHeight: number;
  orientation: 'portrait' | 'landscape';
  connectionType: 'slow' | 'fast' | 'unknown';
  prefersReducedMotion: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
}

// Touch interaction types
export interface TouchInteraction {
  type: 'tap' | 'longpress' | 'swipe' | 'pinch' | 'drag';
  startTime: number;
  duration: number;
  distance: number;
  velocity: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  scale?: number;
  rotation?: number;
}

// Mobile performance metrics
export interface MobilePerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  batteryDrain: number;
  networkLatency: number;
  renderTime: number;
  interactionLatency: number;
}

/**
 * Hook for detecting mobile device capabilities
 */
export const useMobileCapabilities = (): MobileCapabilities => {
  const [capabilities, setCapabilities] = useState<MobileCapabilities>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isIOS: false,
        isAndroid: false,
        supportsTouchEvents: false,
        supportsPointerEvents: false,
        supportsHover: false,
        hasHapticFeedback: false,
        devicePixelRatio: 1,
        viewportWidth: 1920,
        viewportHeight: 1080,
        orientation: 'landscape',
        connectionType: 'unknown',
        prefersReducedMotion: false,
      };
    }

    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isMobile = /Mobi|Android/i.test(userAgent) || isIOS;
    const isTablet = /iPad/.test(userAgent) || (isAndroid && !/Mobile/.test(userAgent));

    // Network connection detection
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    let connectionType: 'slow' | 'fast' | 'unknown' = 'unknown';

    if (connection) {
      const effectiveType = connection.effectiveType;
      connectionType = ['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast';
    }

    // Battery API detection
    const battery = (navigator as any).battery || (navigator as any).getBattery?.();

    return {
      isMobile,
      isTablet,
      isIOS,
      isAndroid,
      supportsTouchEvents: 'ontouchstart' in window,
      supportsPointerEvents: 'onpointerdown' in window,
      supportsHover: window.matchMedia('(hover: hover)').matches,
      hasHapticFeedback: 'vibrate' in navigator,
      devicePixelRatio: window.devicePixelRatio || 1,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      connectionType,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      batteryLevel: battery?.level,
      isCharging: battery?.charging,
    };
  });

  useEffect(() => {
    const updateCapabilities = () => {
      setCapabilities(prev => ({
        ...prev,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      }));
    };

    const updateOrientation = () => {
      setTimeout(updateCapabilities, 100); // Delay to get accurate dimensions after rotation
    };

    window.addEventListener('resize', updateCapabilities);
    window.addEventListener('orientationchange', updateOrientation);

    // Battery status updates
    const updateBattery = (battery: any) => {
      setCapabilities(prev => ({
        ...prev,
        batteryLevel: battery.level,
        isCharging: battery.charging,
      }));
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        updateBattery(battery);
        battery.addEventListener('levelchange', () => updateBattery(battery));
        battery.addEventListener('chargingchange', () => updateBattery(battery));
      });
    }

    return () => {
      window.removeEventListener('resize', updateCapabilities);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return capabilities;
};

/**
 * Advanced touch gesture recognition
 */
export const useTouchGestures = (
  element: React.RefObject<HTMLElement>,
  callbacks: {
    onTap?: (event: TouchEvent, position: { x: number; y: number }) => void;
    onLongPress?: (event: TouchEvent, position: { x: number; y: number }) => void;
    onSwipe?: (event: TouchEvent, direction: string, velocity: number) => void;
    onPinch?: (event: TouchEvent, scale: number) => void;
    onDrag?: (event: TouchEvent, delta: { x: number; y: number }) => void;
  },
) => {
  const touchState = useRef({
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    lastPosition: { x: 0, y: 0 },
    initialDistance: 0,
    initialScale: 1,
    isLongPress: false,
    longPressTimer: null as NodeJS.Timeout | null,
    isDragging: false,
  });

  useEffect(() => {
    const el = element.current;
    if (!el) {
      return;
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const now = Date.now();

      touchState.current = {
        ...touchState.current,
        startTime: now,
        startPosition: { x: touch.clientX, y: touch.clientY },
        lastPosition: { x: touch.clientX, y: touch.clientY },
        isLongPress: false,
        isDragging: false,
      };

      // Multi-touch pinch detection
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2),
        );
        touchState.current.initialDistance = distance;
      }

      // Long press detection
      touchState.current.longPressTimer = setTimeout(() => {
        touchState.current.isLongPress = true;
        callbacks.onLongPress?.(e, touchState.current.startPosition);

        // Haptic feedback for long press
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, 500);

      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const currentPosition = { x: touch.clientX, y: touch.clientY };

      // Calculate movement distance
      const deltaX = currentPosition.x - touchState.current.lastPosition.x;
      const deltaY = currentPosition.y - touchState.current.lastPosition.y;
      const totalDistance = Math.sqrt(
        Math.pow(currentPosition.x - touchState.current.startPosition.x, 2) +
          Math.pow(currentPosition.y - touchState.current.startPosition.y, 2),
      );

      // Cancel long press if moved too much
      if (totalDistance > 10 && touchState.current.longPressTimer) {
        clearTimeout(touchState.current.longPressTimer);
        touchState.current.longPressTimer = null;
      }

      // Drag detection
      if (totalDistance > 5) {
        touchState.current.isDragging = true;
        callbacks.onDrag?.(e, { x: deltaX, y: deltaY });
      }

      // Pinch gesture
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2),
        );

        if (touchState.current.initialDistance > 0) {
          const scale = distance / touchState.current.initialDistance;
          callbacks.onPinch?.(e, scale);
        }
      }

      touchState.current.lastPosition = currentPosition;
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endTime = Date.now();
      const duration = endTime - touchState.current.startTime;

      // Clear long press timer
      if (touchState.current.longPressTimer) {
        clearTimeout(touchState.current.longPressTimer);
        touchState.current.longPressTimer = null;
      }

      // If it wasn't a long press or drag, it's a tap
      if (!touchState.current.isLongPress && !touchState.current.isDragging && duration < 500) {
        callbacks.onTap?.(e, touchState.current.startPosition);

        // Light haptic feedback for tap
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }

      // Swipe detection
      if (touchState.current.isDragging) {
        const deltaX = touchState.current.lastPosition.x - touchState.current.startPosition.x;
        const deltaY = touchState.current.lastPosition.y - touchState.current.startPosition.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = distance / duration;

        if (velocity > 0.5) {
          // Minimum velocity for swipe
          let direction = '';
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
          } else {
            direction = deltaY > 0 ? 'down' : 'up';
          }
          callbacks.onSwipe?.(e, direction, velocity);
        }
      }

      // Reset state
      touchState.current.isDragging = false;
      touchState.current.isLongPress = false;
    };

    // Add passive event listeners for better performance
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);

      if (touchState.current.longPressTimer) {
        clearTimeout(touchState.current.longPressTimer);
      }
    };
  }, [element, callbacks]);
};

/**
 * Mobile performance monitoring
 */
export const useMobilePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<MobilePerformanceMetrics>({
    frameRate: 60,
    memoryUsage: 0,
    batteryDrain: 0,
    networkLatency: 0,
    renderTime: 0,
    interactionLatency: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    // Frame rate monitoring
    const measureFrameRate = () => {
      frameCountRef.current++;
      const now = performance.now();

      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        setMetrics(prev => ({ ...prev, frameRate: fps }));

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      requestAnimationFrame(measureFrameRate);
    };

    // Memory usage monitoring
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    };

    // Performance observer for render times
    if ('PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            setMetrics(prev => ({ ...prev, renderTime: entry.duration }));
          }
        });
      });

      performanceObserverRef.current.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    }

    // Start monitoring
    requestAnimationFrame(measureFrameRate);
    const memoryInterval = setInterval(measureMemory, 5000);

    return () => {
      clearInterval(memoryInterval);
      performanceObserverRef.current?.disconnect();
    };
  }, []);

  const markInteractionStart = useCallback((interactionType: string) => {
    performance.mark(`${interactionType}-start`);
  }, []);

  const markInteractionEnd = useCallback((interactionType: string) => {
    performance.mark(`${interactionType}-end`);
    performance.measure(interactionType, `${interactionType}-start`, `${interactionType}-end`);

    const measure = performance.getEntriesByName(interactionType)[0];
    if (measure) {
      setMetrics(prev => ({ ...prev, interactionLatency: measure.duration }));
    }
  }, []);

  return {
    metrics,
    markInteractionStart,
    markInteractionEnd,
  };
};

/**
 * Mobile-optimized viewport utilities
 */
export const useMobileViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    safeAreaLeft: 0,
    safeAreaRight: 0,
  });

  useEffect(() => {
    const updateViewport = () => {
      // Get safe area insets for modern mobile browsers
      const computedStyle = getComputedStyle(document.documentElement);
      const safeAreaTop = parseInt(
        computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0',
        10,
      );
      const safeAreaBottom = parseInt(
        computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0',
        10,
      );
      const safeAreaLeft = parseInt(
        computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0',
        10,
      );
      const safeAreaRight = parseInt(
        computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0',
        10,
      );

      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        safeAreaTop,
        safeAreaBottom,
        safeAreaLeft,
        safeAreaRight,
      });
    };

    updateViewport();

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateViewport, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return viewport;
};

/**
 * Mobile scroll optimization
 */
export const useMobileScrollOptimization = (elementRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    // Enable momentum scrolling on iOS
    element.style.setProperty('-webkit-overflow-scrolling', 'touch');
    element.style.overscrollBehavior = 'contain';

    // Prevent scroll chaining
    const preventScrollChaining = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollParent = (target?.closest('[data-scroll]') as HTMLElement | null) || element;
      const touch = e.touches[0];
      const touchElement = touch.target as Element | null;
      const rect = touchElement?.getBoundingClientRect();

      if (!scrollParent || !rect) {
        return;
      }

      if (scrollParent.scrollTop === 0 && touch.pageY > rect.top) {
        e.preventDefault();
      }

      if (
        scrollParent.scrollTop === scrollParent.scrollHeight - scrollParent.clientHeight &&
        touch.pageY < rect.bottom
      ) {
        e.preventDefault();
      }
    };

    element.addEventListener('touchmove', preventScrollChaining, { passive: false });

    return () => {
      element.removeEventListener('touchmove', preventScrollChaining);
    };
  }, [elementRef]);
};

/**
 * Intelligent mobile loading states
 */
export const useMobileLoadingStrategy = () => {
  const capabilities = useMobileCapabilities();

  return useMemo(() => {
    const strategy = {
      enableSkeleton: capabilities.connectionType === 'slow',
      showProgressIndicator: true,
      useOptimisticUpdates: capabilities.connectionType === 'fast',
      preloadCriticalResources:
        capabilities.connectionType === 'fast' && !capabilities.prefersReducedMotion,
      lazyLoadImages: true,
      compressionLevel: capabilities.connectionType === 'slow' ? 'high' : 'medium',
      maxConcurrentRequests: capabilities.connectionType === 'slow' ? 2 : 6,
    };

    return strategy;
  }, [capabilities]);
};

/**
 * Mobile-specific error handling
 */
export const useMobileErrorHandling = () => {
  const showMobileError = useCallback((error: Error, context: string) => {
    // Mobile-friendly error display
    const errorMessage =
      error.message.length > 100 ? error.message.substring(0, 97) + '...' : error.message;

    // Use native alerts on mobile for critical errors
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]); // Error vibration pattern
    }

    // Log to console with mobile context
    console.error(`[Mobile Error - ${context}]:`, {
      message: errorMessage,
      stack: error.stack,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connection: (navigator as any).connection?.effectiveType,
    });

    return errorMessage;
  }, []);

  return { showMobileError };
};

export default {
  useMobileCapabilities,
  useTouchGestures,
  useMobilePerformanceMonitor,
  useMobileViewport,
  useMobileScrollOptimization,
  useMobileLoadingStrategy,
  useMobileErrorHandling,
};
