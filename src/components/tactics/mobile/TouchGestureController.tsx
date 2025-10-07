/**
 * Advanced Touch Gesture Controller for Tactics Board
 * Provides comprehensive touch/gesture support with haptic feedback
 */

import React, { useRef, useCallback, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';

export interface GestureState {
  isPanning: boolean;
  isPinching: boolean;
  isRotating: boolean;
  scale: number;
  rotation: number;
  panX: number;
  panY: number;
}

export interface TouchGestureHandlers {
  onTap?: (event: React.PointerEvent) => void;
  onDoubleTap?: (event: React.PointerEvent) => void;
  onLongPress?: (event: React.PointerEvent) => void;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', velocity: number) => void;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onRotate?: (rotation: number, center: { x: number; y: number }) => void;
  onPan?: (delta: { x: number; y: number }) => void;
}

interface TouchGestureControllerProps {
  children: React.ReactNode;
  handlers: TouchGestureHandlers;
  enablePinchZoom?: boolean;
  enableRotation?: boolean;
  enablePan?: boolean;
  enableHaptics?: boolean;
  minScale?: number;
  maxScale?: number;
  className?: string;
}

export const TouchGestureController: React.FC<TouchGestureControllerProps> = ({
  children,
  handlers,
  enablePinchZoom = true,
  enableRotation = false,
  enablePan = true,
  enableHaptics = true,
  minScale = 0.5,
  maxScale = 3,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gestureState, setGestureState] = useState<GestureState>({
    isPanning: false,
    isPinching: false,
    isRotating: false,
    scale: 1,
    rotation: 0,
    panX: 0,
    panY: 0,
  });

  // Touch tracking
  const touchStartTime = useRef<number>(0);
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touches = useRef<Map<number, Touch>>(new Map());

  // Motion values for smooth animations
  const scale = useMotionValue(1);
  const rotation = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Haptic feedback helper
  const triggerHaptic = useCallback(
    (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
      if (!enableHaptics) {
        return;
      }
      if ('vibrate' in navigator) {
        const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 20 : 50;
        navigator.vibrate(duration);
      }
    },
    [enableHaptics],
  );

  // Calculate distance between two touches
  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate angle between two touches
  const getAngle = useCallback((touch1: React.Touch, touch2: React.Touch): number => {
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
  }, []);

  // Get center point between touches
  const getCenter = useCallback(
    (touch1: React.Touch, touch2: React.Touch): { x: number; y: number } => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    },
    [],
  );

  // Handle pointer down
  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      const nativeEvent = event.nativeEvent as TouchEvent | PointerEvent;
      const touch = 'touches' in nativeEvent ? nativeEvent.touches[0] : nativeEvent;
      touchStartTime.current = Date.now();
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };

      // Track touch
      if ((event.nativeEvent as any).touches) {
        const touchList = (event.nativeEvent as any).touches;
        for (let i = 0; i < touchList.length; i++) {
          touches.current.set(touchList[i].identifier, touchList[i]);
        }
      }

      // Long press detection
      if (handlers.onLongPress && touches.current.size === 1) {
        longPressTimer.current = setTimeout(() => {
          triggerHaptic('medium');
          handlers.onLongPress?.(event);
        }, 500);
      }

      // Double tap detection
      const now = Date.now();
      if (handlers.onDoubleTap && now - lastTapTime.current < 300) {
        triggerHaptic('light');
        handlers.onDoubleTap?.(event);
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = now;
      }
    },
    [handlers, triggerHaptic],
  );

  // Handle pointer move
  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      const touchList = (event.nativeEvent as any).touches;
      if (!touchList) {return;}

      // Update touch tracking
      for (let i = 0; i < touchList.length; i++) {
        touches.current.set(touchList[i].identifier, touchList[i]);
      }

      const touchArray = Array.from(touches.current.values());

      // Two-finger gestures
      if (touchArray.length === 2) {
        const [touch1, touch2] = touchArray;
        const distance = getDistance(touch1, touch2);
        const angle = getAngle(touch1, touch2);
        const center = getCenter(touch1, touch2);

        // Pinch zoom
        if (enablePinchZoom) {
          const initialDistance = useRef(distance);
          const newScale = Math.max(
            minScale,
            Math.min(maxScale, distance / initialDistance.current),
          );

          if (Math.abs(newScale - gestureState.scale) > 0.01) {
            scale.set(newScale);
            setGestureState((prev) => ({ ...prev, scale: newScale, isPinching: true }));
            handlers.onPinch?.(newScale, center);
          }
        }

        // Rotation
        if (enableRotation) {
          const initialAngle = useRef(angle);
          const rotationDelta = angle - initialAngle.current;
          rotation.set(rotationDelta * (180 / Math.PI));
          setGestureState((prev) => ({
            ...prev,
            rotation: rotationDelta * (180 / Math.PI),
            isRotating: true,
          }));
          handlers.onRotate?.(rotationDelta * (180 / Math.PI), center);
        }
      }
      // Single finger pan
      else if (touchArray.length === 1 && enablePan) {
        const touch = touchArray[0];
        const deltaX = touch.clientX - touchStartPos.current.x;
        const deltaY = touch.clientY - touchStartPos.current.y;

        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          x.set(deltaX);
          y.set(deltaY);
          setGestureState((prev) => ({
            ...prev,
            panX: deltaX,
            panY: deltaY,
            isPanning: true,
          }));
          handlers.onPan?.({ x: deltaX, y: deltaY });
        }
      }
    },
    [
      enablePinchZoom,
      enableRotation,
      enablePan,
      minScale,
      maxScale,
      gestureState.scale,
      handlers,
      getDistance,
      getAngle,
      getCenter,
      scale,
      rotation,
      x,
      y,
    ],
  );

  // Handle pointer up
  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      const touchList = (event.nativeEvent as any).changedTouches;
      if (touchList) {
        for (let i = 0; i < touchList.length; i++) {
          touches.current.delete(touchList[i].identifier);
        }
      }

      const duration = Date.now() - touchStartTime.current;
      const touch = (event.nativeEvent as any).touches?.[0] || event.nativeEvent;
      const deltaX = touch.clientX - touchStartPos.current.x;
      const deltaY = touch.clientY - touchStartPos.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / duration;

      // Swipe detection
      if (handlers.onSwipe && distance > 50 && duration < 300) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        let direction: 'up' | 'down' | 'left' | 'right';

        if (absX > absY) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        triggerHaptic('light');
        handlers.onSwipe?.(direction, velocity);
      }
      // Tap detection
      else if (handlers.onTap && distance < 10 && duration < 300) {
        triggerHaptic('light');
        handlers.onTap?.(event);
      }

      // Reset gesture state
      setGestureState({
        isPanning: false,
        isPinching: false,
        isRotating: false,
        scale: 1,
        rotation: 0,
        panX: 0,
        panY: 0,
      });
    },
    [handlers, triggerHaptic],
  );

  return (
    <motion.div
      ref={containerRef}
      className={`touch-gesture-controller ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </motion.div>
  );
};

export default TouchGestureController;
