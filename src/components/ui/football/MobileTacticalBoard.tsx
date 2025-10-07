/**
 * Mobile Tactical Board Wrapper
 * Adds touch gesture support and mobile optimizations to the existing TacticalBoard
 */

import React, { useState, useRef, useCallback } from 'react';
import { TacticalBoard, TacticalBoardProps } from './TacticalBoard';
import { useResponsive } from '../../../hooks/useResponsive';
import { usePinchGesture, useGestureElement } from '../../../hooks/useTouchGestures';

interface MobileTacticalBoardProps extends TacticalBoardProps {
  enablePinchZoom?: boolean;
  enableSwipeNav?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minZoom?: number;
  maxZoom?: number;
}

export const MobileTacticalBoard: React.FC<MobileTacticalBoardProps> = ({
  enablePinchZoom = true,
  enableSwipeNav = false,
  onSwipeLeft,
  onSwipeRight,
  minZoom = 0.5,
  maxZoom = 3,
  zoomLevel: externalZoom,
  ...boardProps
}) => {
  const { isMobile, isTouchDevice } = useResponsive();
  const [internalZoom, setInternalZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Use external zoom if provided, otherwise use internal state
  const currentZoom = externalZoom !== undefined ? externalZoom : internalZoom;

  // Handle pinch-to-zoom
  const pinchHandlers = usePinchGesture(
    gesture => {
      if (!enablePinchZoom) {
        return;
      }

      setInternalZoom(prev => {
        const newZoom = prev * gesture.scale;
        return Math.min(maxZoom, Math.max(minZoom, newZoom));
      });
    },
    { pinchThreshold: 0.05 },
  );

  // Handle swipe and tap gestures
  const gestureRef = useGestureElement<HTMLDivElement>({
    onSwipe: gesture => {
      if (!enableSwipeNav) {
        return;
      }

      if (gesture.direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (gesture.direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }
    },
    onDoubleTap: () => {
      // Reset zoom on double-tap
      if (enablePinchZoom) {
        setInternalZoom(1);
        setPanOffset({ x: 0, y: 0 });
      }
    },
  });

  // Combine refs
  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (gestureRef) {
        // Assign to mutable ref property
        (gestureRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
      if (containerRef) {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [gestureRef],
  );

  // Zoom controls for mobile
  const handleZoomIn = () => {
    setInternalZoom(prev => Math.min(maxZoom, prev + 0.2));
  };

  const handleZoomOut = () => {
    setInternalZoom(prev => Math.max(minZoom, prev - 0.2));
  };

  const handleResetZoom = () => {
    setInternalZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      {/* Mobile zoom controls */}
      {(isMobile || isTouchDevice) && enablePinchZoom && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
            aria-label="Zoom in"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v12m6-6H6"
              />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
            aria-label="Zoom out"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
          </button>
          <button
            onClick={handleResetZoom}
            className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
            aria-label="Reset zoom"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Zoom indicator */}
      {(isMobile || isTouchDevice) && enablePinchZoom && currentZoom !== 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg">
          {(currentZoom * 100).toFixed(0)}%
        </div>
      )}

      {/* Tactical board container with gestures */}
      <div
        ref={combinedRef}
        className="w-full h-full flex items-center justify-center"
        style={{
          transform: `scale(${currentZoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'center',
          transition: 'transform 0.1s ease-out',
          touchAction: 'none', // Prevent browser zoom
        }}
        {...(isTouchDevice && enablePinchZoom ? pinchHandlers : {})}
      >
        <TacticalBoard {...boardProps} zoomLevel={currentZoom} />
      </div>

      {/* Swipe navigation hint (only show on mobile on first load) */}
      {isMobile && enableSwipeNav && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-gray-400 text-sm animate-pulse">
          ← Swipe to navigate →
        </div>
      )}
    </div>
  );
};

// Re-export the original TacticalBoard for desktop use
export { TacticalBoard };
