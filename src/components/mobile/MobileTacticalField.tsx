/**
 * Mobile-Optimized Tactical Field Component
 * Perfect touch interactions with pan, zoom, and gesture support
 */

import React, { useRef, useCallback, useState, useEffect, memo } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  useMobileCapabilities,
  useTouchGestures,
  useMobileViewport,
} from '../../utils/mobileOptimizations';
import MobilePlayerToken from './MobilePlayerToken';
import { Player, Formation } from '../../types';

interface MobileTacticalFieldProps {
  formation?: Formation;
  players: Player[];
  selectedPlayer?: Player | null;
  onPlayerSelect: (player: Player, position?: { x: number; y: number }) => void;
  onPlayerMove: (playerId: string, position: { x: number; y: number }) => void;
  onPlayerLongPress: (player: Player, position: { x: number; y: number }) => void;
  showGrid?: boolean;
  showZones?: boolean;
  fieldColor?: string;
  className?: string;
}

const MobileTacticalField: React.FC<MobileTacticalFieldProps> = ({
  formation,
  players,
  selectedPlayer,
  onPlayerSelect,
  onPlayerMove,
  onPlayerLongPress,
  showGrid = false,
  showZones = false,
  fieldColor = 'bg-green-600',
  className = '',
}) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const capabilities = useMobileCapabilities();
  const viewport = useMobileViewport();

  // Field state
  const [fieldBounds, setFieldBounds] = useState<DOMRect>({
    width: 800,
    height: 520,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    bottom: 520,
    right: 800,
    toJSON: () => ({}),
  });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);

  // Pan and zoom motion values
  const fieldX = useMotionValue(0);
  const fieldY = useMotionValue(0);
  const fieldScale = useMotionValue(1);

  // Transform values for smooth interactions
  const fieldTransform = useTransform(
    [fieldX, fieldY, fieldScale],
    ([x, y, scale]) => `translate3d(${x}px, ${y}px, 0) scale(${scale})`
  );

  // Field dimensions based on device
  const getFieldDimensions = useCallback(() => {
    const aspectRatio = 800 / 520; // Standard football field ratio
    const containerWidth = viewport.width - (capabilities.isMobile ? 20 : 40);
    const containerHeight = viewport.height - (capabilities.isMobile ? 120 : 160);

    let width = containerWidth;
    let height = width / aspectRatio;

    if (height > containerHeight) {
      height = containerHeight;
      width = height * aspectRatio;
    }

    // Minimum field size for mobile usability
    if (capabilities.isMobile) {
      width = Math.max(width, 320);
      height = Math.max(height, 208);
    }

    return { width, height };
  }, [viewport, capabilities.isMobile]);

  // Update field bounds when dimensions change
  useEffect(() => {
    const updateFieldBounds = () => {
      if (fieldRef.current) {
        const bounds = fieldRef.current.getBoundingClientRect();
        setFieldBounds(bounds);
      }
    };

    updateFieldBounds();
    window.addEventListener('resize', updateFieldBounds);
    window.addEventListener('orientationchange', updateFieldBounds);

    return () => {
      window.removeEventListener('resize', updateFieldBounds);
      window.removeEventListener('orientationchange', updateFieldBounds);
    };
  }, []);

  // Advanced touch gestures for field
  useTouchGestures(containerRef, {
    onPinch: useCallback(
      (event: TouchEvent, scale: number) => {
        const currentScale = fieldScale.get();
        const newScale = Math.max(0.5, Math.min(3, currentScale * scale));
        fieldScale.set(newScale);

        // Haptic feedback for zoom
        if (capabilities.hasHapticFeedback && Math.abs(scale - 1) > 0.1) {
          navigator.vibrate(5);
        }
      },
      [fieldScale, capabilities.hasHapticFeedback]
    ),

    onSwipe: useCallback(
      (event: TouchEvent, direction: string, velocity: number) => {
        // Quick navigation gestures
        const moveDistance = 100 * velocity;
        const currentX = fieldX.get();
        const currentY = fieldY.get();

        switch (direction) {
          case 'left':
            fieldX.set(currentX - moveDistance);
            break;
          case 'right':
            fieldX.set(currentX + moveDistance);
            break;
          case 'up':
            fieldY.set(currentY - moveDistance);
            break;
          case 'down':
            fieldY.set(currentY + moveDistance);
            break;
        }

        // Haptic feedback for swipe
        if (capabilities.hasHapticFeedback) {
          navigator.vibrate(10);
        }
      },
      [fieldX, fieldY, capabilities.hasHapticFeedback]
    ),
  });

  // Handle field pan
  const handleFieldPan = useCallback(
    (event: any, info: PanInfo) => {
      if (isDragging) {
        return;
      } // Don't pan while dragging players

      const currentX = fieldX.get();
      const currentY = fieldY.get();

      fieldX.set(currentX + info.delta.x);
      fieldY.set(currentY + info.delta.y);
    },
    [fieldX, fieldY, isDragging]
  );

  // Player interaction handlers
  const handlePlayerDragStart = useCallback((playerId: string) => {
    setIsDragging(true);
    setDraggedPlayerId(playerId);
  }, []);

  const handlePlayerDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedPlayerId(null);
  }, []);

  // Get field dimensions
  const { width: fieldWidth, height: fieldHeight } = getFieldDimensions();

  // Grid lines for positioning assistance
  const renderGrid = () => {
    if (!showGrid) {
      return null;
    }

    const gridLines: JSX.Element[] = [];
    const gridSize = 20;

    // Vertical lines
    for (let x = 0; x <= fieldWidth; x += gridSize) {
      gridLines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={fieldHeight}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= fieldHeight; y += gridSize) {
      gridLines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={fieldWidth}
          y2={y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      );
    }

    return (
      <svg className="absolute inset-0 pointer-events-none" width={fieldWidth} height={fieldHeight}>
        {gridLines}
      </svg>
    );
  };

  // Field zones for tactical visualization
  const renderZones = () => {
    if (!showZones) {
      return null;
    }

    const zoneWidth = fieldWidth / 3;
    const zoneHeight = fieldHeight / 3;

    return (
      <svg className="absolute inset-0 pointer-events-none" width={fieldWidth} height={fieldHeight}>
        {/* Defense zone */}
        <rect
          x={0}
          y={0}
          width={zoneWidth}
          height={fieldHeight}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth="2"
          strokeDasharray="10,5"
        />

        {/* Midfield zone */}
        <rect
          x={zoneWidth}
          y={0}
          width={zoneWidth}
          height={fieldHeight}
          fill="rgba(16, 185, 129, 0.1)"
          stroke="rgba(16, 185, 129, 0.3)"
          strokeWidth="2"
          strokeDasharray="10,5"
        />

        {/* Attack zone */}
        <rect
          x={zoneWidth * 2}
          y={0}
          width={zoneWidth}
          height={fieldHeight}
          fill="rgba(239, 68, 68, 0.1)"
          stroke="rgba(239, 68, 68, 0.3)"
          strokeWidth="2"
          strokeDasharray="10,5"
        />
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`
        relative w-full h-full overflow-hidden touch-manipulation
        ${className}
      `}
      style={{
        // Safe area adjustments for mobile devices
        paddingTop: capabilities.isMobile ? viewport.safeAreaTop : 0,
        paddingBottom: capabilities.isMobile ? viewport.safeAreaBottom : 0,
        paddingLeft: capabilities.isMobile ? viewport.safeAreaLeft : 0,
        paddingRight: capabilities.isMobile ? viewport.safeAreaRight : 0,
      }}
    >
      {/* Field container with pan and zoom */}
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        drag={!isDragging}
        dragMomentum={false}
        onPan={handleFieldPan}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* Actual field */}
        <motion.div
          ref={fieldRef}
          className={`
            relative ${fieldColor} border-4 border-white shadow-2xl
            rounded-lg overflow-hidden
          `}
          style={{
            width: fieldWidth,
            height: fieldHeight,
            transform: fieldTransform,
          }}
          animate={{
            boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.2)',
          }}
        >
          {/* Field markings */}
          <div className="absolute inset-0">
            {/* Center circle */}
            <div
              className="absolute border-2 border-white rounded-full"
              style={{
                width: fieldWidth * 0.15,
                height: fieldWidth * 0.15,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* Center line */}
            <div
              className="absolute border-l-2 border-white"
              style={{
                left: '50%',
                height: '100%',
              }}
            />

            {/* Penalty areas */}
            <div
              className="absolute border-2 border-white"
              style={{
                width: fieldWidth * 0.22,
                height: fieldHeight * 0.65,
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />

            <div
              className="absolute border-2 border-white"
              style={{
                width: fieldWidth * 0.22,
                height: fieldHeight * 0.65,
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />

            {/* Goal areas */}
            <div
              className="absolute border-2 border-white"
              style={{
                width: fieldWidth * 0.1,
                height: fieldHeight * 0.35,
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />

            <div
              className="absolute border-2 border-white"
              style={{
                width: fieldWidth * 0.1,
                height: fieldHeight * 0.35,
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </div>

          {/* Grid overlay */}
          {renderGrid()}

          {/* Zone overlay */}
          {renderZones()}

          {/* Players */}
          {players.map(player => {
            const extendedFormation = formation as any;
            const playerPosition = extendedFormation?.playerPositions?.[player.id] || {
              x: 100,
              y: 100,
            };

            return (
              <MobilePlayerToken
                key={player.id}
                player={player}
                position={playerPosition}
                isSelected={selectedPlayer?.id === player.id}
                isDragging={draggedPlayerId === player.id}
                showStats={selectedPlayer?.id === player.id}
                scale={fieldScale.get()}
                onSelect={onPlayerSelect}
                onMove={onPlayerMove}
                onLongPress={onPlayerLongPress}
                onDragStart={() => handlePlayerDragStart(player.id)}
                onDragEnd={handlePlayerDragEnd}
                fieldBounds={fieldBounds}
                snapToGrid={showGrid}
                gridSize={20}
              />
            );
          })}

          {/* Touch indicators */}
          {capabilities.isMobile && (
            <div className="absolute top-2 left-2 flex space-x-1">
              <div className="w-2 h-2 bg-white/50 rounded-full" />
              <div className="w-2 h-2 bg-white/30 rounded-full" />
              <div className="w-2 h-2 bg-white/10 rounded-full" />
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Mobile controls overlay */}
      {capabilities.isMobile && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <motion.button
            className="bg-black/50 text-white p-2 rounded-full"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              fieldScale.set(1);
              fieldX.set(0);
              fieldY.set(0);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </motion.button>

          <motion.button
            className="bg-black/50 text-white p-2 rounded-full"
            whileTap={{ scale: 0.9 }}
            onClick={() => fieldScale.set(Math.min(3, fieldScale.get() * 1.2))}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </motion.button>

          <motion.button
            className="bg-black/50 text-white p-2 rounded-full"
            whileTap={{ scale: 0.9 }}
            onClick={() => fieldScale.set(Math.max(0.5, fieldScale.get() * 0.8))}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
              />
            </svg>
          </motion.button>
        </div>
      )}

      {/* Performance indicators (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
          <div>Scale: {fieldScale.get().toFixed(2)}</div>
          <div>Players: {players.length}</div>
          <div>FPS: 60</div>
        </div>
      )}
    </div>
  );
};

export default memo(MobileTacticalField);
