/**
 * Touch Gesture Detection and Handling
 * Provides utilities for detecting and handling touch gestures on mobile devices
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  identifier: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
  startPoint: TouchPoint;
  endPoint: TouchPoint;
}

export interface PinchGesture {
  scale: number;
  center: { x: number; y: number };
  distance: number;
  initialDistance: number;
}

export interface TapGesture {
  position: TouchPoint;
  type: 'tap' | 'double-tap' | 'long-press';
}

export interface GestureConfig {
  swipeThreshold: number;
  velocityThreshold: number;
  pinchThreshold: number;
  doubleTapDelay: number;
  longPressDelay: number;
}

const defaultConfig: GestureConfig = {
  swipeThreshold: 50,
  velocityThreshold: 0.3,
  pinchThreshold: 0.1,
  doubleTapDelay: 300,
  longPressDelay: 500,
};

/**
 * Hook for detecting swipe gestures
 */
export const useSwipeGesture = (
  onSwipe: (gesture: SwipeGesture) => void,
  config: Partial<GestureConfig> = {},
) => {
  const mergedConfig = { ...defaultConfig, ...config };
  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
      identifier: touch.identifier,
    };
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchStart.current || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.current.x);
    const deltaY = Math.abs(touch.clientY - touchStart.current.y);

    if (deltaX > 10 || deltaY > 10) {
      isSwiping.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!touchStart.current || !isSwiping.current) {
        return;
      }

      const touch = event.changedTouches[0];
      touchEnd.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
        identifier: touch.identifier,
      };

      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = touchEnd.current.y - touchStart.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = touchEnd.current.timestamp - touchStart.current.timestamp;
      const velocity = distance / duration;

      if (distance < mergedConfig.swipeThreshold) {
        touchStart.current = null;
        touchEnd.current = null;
        isSwiping.current = false;
        return;
      }

      let direction: SwipeGesture['direction'];
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      if (velocity >= mergedConfig.velocityThreshold) {
        const gesture: SwipeGesture = {
          direction,
          distance,
          velocity,
          duration,
          startPoint: touchStart.current,
          endPoint: touchEnd.current,
        };
        onSwipe(gesture);
      }

      touchStart.current = null;
      touchEnd.current = null;
      isSwiping.current = false;
    },
    [onSwipe, mergedConfig],
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * Hook for detecting pinch gestures (zoom)
 */
export const usePinchGesture = (
  onPinch: (gesture: PinchGesture) => void,
  config: Partial<GestureConfig> = {},
) => {
  const mergedConfig = { ...defaultConfig, ...config };
  const initialDistance = useRef<number | null>(null);
  const lastScale = useRef<number>(1);

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      const distance = getDistance(event.touches[0] as Touch, event.touches[1] as Touch);
      initialDistance.current = distance;
      lastScale.current = 1;
    }
  }, []);

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length === 2 && initialDistance.current !== null) {
        const currentDistance = getDistance(event.touches[0] as Touch, event.touches[1] as Touch);
        const scale = currentDistance / initialDistance.current;

        if (Math.abs(scale - lastScale.current) >= mergedConfig.pinchThreshold) {
          const center = getCenter(event.touches[0] as Touch, event.touches[1] as Touch);
          const gesture: PinchGesture = {
            scale,
            center,
            distance: currentDistance,
            initialDistance: initialDistance.current,
          };
          onPinch(gesture);
          lastScale.current = scale;
        }
      }
    },
    [onPinch, mergedConfig],
  );

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (event.touches.length < 2) {
      initialDistance.current = null;
      lastScale.current = 1;
    }
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * Hook for detecting tap gestures (tap, double-tap, long-press)
 */
export const useTapGesture = (
  callbacks: {
    onTap?: (gesture: TapGesture) => void;
    onDoubleTap?: (gesture: TapGesture) => void;
    onLongPress?: (gesture: TapGesture) => void;
  },
  config: Partial<GestureConfig> = {},
) => {
  const mergedConfig = { ...defaultConfig, ...config };
  const tapStart = useRef<TouchPoint | null>(null);
  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const hasMoved = useRef(false);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      tapStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
        identifier: touch.identifier,
      };
      hasMoved.current = false;

      // Start long-press timer
      if (callbacks.onLongPress) {
        longPressTimer.current = setTimeout(() => {
          if (tapStart.current && !hasMoved.current) {
            callbacks.onLongPress!({
              position: tapStart.current,
              type: 'long-press',
            });
            tapStart.current = null;
          }
        }, mergedConfig.longPressDelay);
      }
    },
    [callbacks, mergedConfig],
  );

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!tapStart.current || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - tapStart.current.x);
    const deltaY = Math.abs(touch.clientY - tapStart.current.y);

    if (deltaX > 10 || deltaY > 10) {
      hasMoved.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!tapStart.current) {
        return;
      }

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (hasMoved.current) {
        tapStart.current = null;
        return;
      }

      const touch = event.changedTouches[0];
      const tapEnd: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
        identifier: touch.identifier,
      };

      const timeSinceLastTap = tapEnd.timestamp - lastTapTime.current;

      if (timeSinceLastTap < mergedConfig.doubleTapDelay && callbacks.onDoubleTap) {
        callbacks.onDoubleTap({
          position: tapEnd,
          type: 'double-tap',
        });
        lastTapTime.current = 0;
      } else {
        if (callbacks.onTap) {
          callbacks.onTap({
            position: tapEnd,
            type: 'tap',
          });
        }
        lastTapTime.current = tapEnd.timestamp;
      }

      tapStart.current = null;
    },
    [callbacks, mergedConfig],
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * Combined hook for all gesture types
 */
export const useGestures = (callbacks: {
  onSwipe?: (gesture: SwipeGesture) => void;
  onPinch?: (gesture: PinchGesture) => void;
  onTap?: (gesture: TapGesture) => void;
  onDoubleTap?: (gesture: TapGesture) => void;
  onLongPress?: (gesture: TapGesture) => void;
  config?: Partial<GestureConfig>;
}) => {
  const swipeHandlers = useSwipeGesture(callbacks.onSwipe || (() => {}), callbacks.config);
  const pinchHandlers = usePinchGesture(callbacks.onPinch || (() => {}), callbacks.config);
  const tapHandlers = useTapGesture(
    {
      onTap: callbacks.onTap,
      onDoubleTap: callbacks.onDoubleTap,
      onLongPress: callbacks.onLongPress,
    },
    callbacks.config,
  );

  return {
    onTouchStart: (event: React.TouchEvent) => {
      swipeHandlers.onTouchStart(event);
      pinchHandlers.onTouchStart(event);
      tapHandlers.onTouchStart(event);
    },
    onTouchMove: (event: React.TouchEvent) => {
      swipeHandlers.onTouchMove(event);
      pinchHandlers.onTouchMove(event);
      tapHandlers.onTouchMove(event);
    },
    onTouchEnd: (event: React.TouchEvent) => {
      swipeHandlers.onTouchEnd(event);
      pinchHandlers.onTouchEnd(event);
      tapHandlers.onTouchEnd(event);
    },
  };
};

/**
 * Hook that automatically attaches gesture handlers to a ref element
 */
export const useGestureElement = <T extends HTMLElement = HTMLDivElement>(
  callbacks: Parameters<typeof useGestures>[0],
) => {
  const elementRef = useRef<T>(null);
  const gestureHandlers = useGestures(callbacks);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const handleTouchStart = (e: TouchEvent) => {
      const syntheticEvent = {
        touches: e.touches,
        changedTouches: e.changedTouches,
        targetTouches: e.targetTouches,
      } as unknown as React.TouchEvent;
      gestureHandlers.onTouchStart(syntheticEvent);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const syntheticEvent = {
        touches: e.touches,
        changedTouches: e.changedTouches,
        targetTouches: e.targetTouches,
      } as unknown as React.TouchEvent;
      gestureHandlers.onTouchMove(syntheticEvent);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const syntheticEvent = {
        touches: e.touches,
        changedTouches: e.changedTouches,
        targetTouches: e.targetTouches,
      } as unknown as React.TouchEvent;
      gestureHandlers.onTouchEnd(syntheticEvent);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gestureHandlers]);

  return elementRef;
};

/**
 * Hook to enable/disable touch scrolling
 */
export const useTouchScroll = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) {
      const preventScroll = (e: TouchEvent) => {
        e.preventDefault();
      };

      document.body.addEventListener('touchmove', preventScroll, { passive: false });

      return () => {
        document.body.removeEventListener('touchmove', preventScroll);
      };
    }

    // Return cleanup function even when enabled is true
    return () => {};
  }, [enabled]);
};

/**
 * Hook to detect scroll direction on touch devices
 */
export const useTouchScrollDirection = () => {
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const lastY = useRef<number>(0);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      if (lastY.current > 0) {
        if (currentY > lastY.current) {
          setDirection('down');
        } else if (currentY < lastY.current) {
          setDirection('up');
        }
      }
      lastY.current = currentY;
    };

    const handleTouchEnd = () => {
      lastY.current = 0;
      setDirection(null);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return direction;
};
