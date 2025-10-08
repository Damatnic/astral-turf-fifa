/**
 * Mobile-Optimized Tactics Board Container
 * Provides responsive layout, touch optimization, and offline support
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGestures } from '../../../hooks/useTouchGestures';
import {
  Menu,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Grid,
  Eye,
} from 'lucide-react';

export interface MobileTacticsBoardProps {
  children: React.ReactNode;
  onZoomChange?: (zoom: number) => void;
  onReset?: () => void;
  isMobile?: boolean;
}

export const MobileTacticsBoardContainer: React.FC<MobileTacticsBoardProps> = ({
  children,
  onZoomChange,
  onReset,
  isMobile = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.min(prev + 0.25, 3);
      onZoomChange?.(newZoom);
      return newZoom;
    });
  }, [onZoomChange]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      onZoomChange?.(newZoom);
      return newZoom;
    });
  }, [onZoomChange]);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    onZoomChange?.(1);
    onReset?.();
  }, [onZoomChange, onReset]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Pinch zoom handling - Connected to TouchGestureController
  const handlePinchZoom = useCallback(
    (scale: number) => {
      const newZoom = Math.max(0.5, Math.min(3, zoom * scale));
      setZoom(newZoom);
      onZoomChange?.(newZoom);
    },
    [zoom, onZoomChange],
  );

  // Pan handling - Connected to TouchGestureController
  const handlePan = useCallback((delta: { x: number; y: number }) => {
    setPanOffset((prev) => ({
      x: prev.x + delta.x,
      y: prev.y + delta.y,
    }));
  }, []);
  
  // Wire up touch gestures using the hook
  const gestureHandlers = useGestures({
    onPinch: handlePinchZoom,
    onDoubleTap: () => {
      // Reset zoom on double tap
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
      onZoomChange?.(1);
    },
  });

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="mobile-tactics-board-container relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" {...gestureHandlers}>
      {/* Mobile Control Bar - Top */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 "
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowControls(!showControls)}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors  border border-slate-600"
            aria-label="Toggle controls"
          >
            {showControls ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>

          <div className="flex items-center gap-2 text-white/80 font-medium">
            <Grid className="w-5 h-5" />
            <span>Tactics Board</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors  border border-slate-600"
            aria-label="Toggle fullscreen"
          >
            <Maximize2 className="w-6 h-6 text-white" />
          </button>
        </div>
      </motion.div>

      {/* Expandable Controls Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute top-20 left-4 z-50 bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl p-4 backdrop-blur-xl border border-slate-700 shadow-2xl"
            initial={{ opacity: 0, x: -100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="space-y-3">
              {/* Zoom Controls */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-white/60 uppercase tracking-wider">
                  Zoom
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleZoomOut}
                    className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 transition-all border border-blue-400/20"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-5 h-5 text-blue-300" />
                  </button>
                  <div className="px-4 py-2 rounded-xl bg-slate-700 text-white font-bold min-w-[80px] text-center">
                    {Math.round(zoom * 100)}%
                  </div>
                  <button
                    onClick={handleZoomIn}
                    className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 transition-all border border-blue-400/20"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-5 h-5 text-blue-300" />
                  </button>
                </div>
              </div>

              {/* Reset View */}
              <button
                onClick={handleResetView}
                className="w-full p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 transition-all border border-purple-400/20 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5 text-purple-300" />
                <span className="text-purple-300 font-medium">Reset View</span>
              </button>

              {/* Quick Presets */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-white/60 uppercase tracking-wider">
                  Quick Zoom
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[0.75, 1, 1.5].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setZoom(preset);
                        onZoomChange?.(preset);
                      }}
                      className={`p-2 rounded-lg text-sm font-bold transition-all ${
                        zoom === preset
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                          : 'bg-slate-700 text-white/70 hover:bg-slate-700'
                      }`}
                    >
                      {preset * 100}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Indicator - Bottom Right */}
      <motion.div
        className="absolute bottom-4 right-4 z-40 bg-slate-800  rounded-full px-4 py-2 border border-slate-700 shadow-lg"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 text-white/90 font-bold text-sm">
          <Eye className="w-4 h-4" />
          {Math.round(zoom * 100)}%
        </div>
      </motion.div>

      {/* Main Content with Transform */}
      <motion.div
        className="w-full h-full"
        style={{
          transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out',
        }}
      >
        {children}
      </motion.div>

      {/* Touch Instruction Overlay (shows briefly on first load) */}
      <AnimatePresence>
        {isMobile && (
          <motion.div
            className="absolute inset-0 z-30 bg-slate-900  flex items-center justify-center pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 2, duration: 1 }}
          >
            <div className="text-center space-y-4 px-8">
              <div className="text-4xl">👆</div>
              <div className="text-white text-lg font-medium">Tap to interact</div>
              <div className="text-white/60 text-sm">Pinch to zoom • Drag to pan</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileTacticsBoardContainer;
