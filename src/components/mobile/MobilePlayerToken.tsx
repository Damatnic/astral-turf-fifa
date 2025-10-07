/**
 * Mobile-Optimized Player Token Component
 * Enhanced touch interactions with haptic feedback and gesture recognition
 */

import React, { useRef, useCallback, useState, useEffect, memo } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useTouchGestures, useMobileCapabilities } from '../../utils/mobileOptimizations';
import { Player } from '../../types';

interface MobilePlayerTokenProps {
  player: Player;
  position: { x: number; y: number };
  isSelected: boolean;
  isDragging: boolean;
  isConflicted?: boolean;
  showStats?: boolean;
  scale?: number;
  onSelect: (player: Player, position?: { x: number; y: number }) => void;
  onMove: (playerId: string, position: { x: number; y: number }) => void;
  onLongPress: (player: Player, position: { x: number; y: number }) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  fieldBounds: DOMRect;
  snapToGrid?: boolean;
  gridSize?: number;
}

const MobilePlayerToken: React.FC<MobilePlayerTokenProps> = ({
  player,
  position,
  isSelected,
  isDragging,
  isConflicted = false,
  showStats = false,
  scale = 1,
  onSelect,
  onMove,
  onLongPress,
  onDragStart,
  onDragEnd,
  fieldBounds,
  snapToGrid = true,
  gridSize = 20,
}) => {
  const tokenRef = useRef<HTMLDivElement>(null);
  const capabilities = useMobileCapabilities();

  // Motion values for smooth animations
  const x = useMotionValue(position.x);
  const y = useMotionValue(position.y);
  const rotateZ = useTransform(x, [-100, 100], [-5, 5]);
  const tokenScale = useTransform(x, [-100, 100], [0.95, 1.05]);

  // Touch interaction states
  const [lastTapTime, setLastTapTime] = useState(0);
  const [touchCount, setTouchCount] = useState(0);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Update motion values when position changes
  useEffect(() => {
    x.set(position.x);
    y.set(position.y);
  }, [position.x, position.y, x, y]);

  // Snap to grid function
  const snapPosition = useCallback(
    (pos: { x: number; y: number }) => {
      if (!snapToGrid) {
        return pos;
      }

      return {
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize,
      };
    },
    [snapToGrid, gridSize],
  );

  // Enhanced touch gestures
  useTouchGestures(tokenRef, {
    onTap: useCallback(
      (event: TouchEvent, tapPosition: { x: number; y: number }) => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime;

        // Double tap detection
        if (timeSinceLastTap < 300) {
          setTouchCount(prev => prev + 1);

          if (touchCount === 1) {
            // Double tap - quick action (e.g., center on player)
            onSelect(player, tapPosition);

            // Haptic feedback for double tap
            if (capabilities.hasHapticFeedback) {
              navigator.vibrate([30, 10, 30]);
            }
          }
        } else {
          setTouchCount(1);
          onSelect(player, tapPosition);

          // Light haptic feedback for single tap
          if (capabilities.hasHapticFeedback) {
            navigator.vibrate(15);
          }
        }

        setLastTapTime(now);

        // Reset touch count after delay
        setTimeout(() => setTouchCount(0), 400);
      },
      [lastTapTime, touchCount, onSelect, player, capabilities.hasHapticFeedback],
    ),

    onLongPress: useCallback(
      (event: TouchEvent, pressPosition: { x: number; y: number }) => {
        setIsLongPressing(true);
        onLongPress(player, pressPosition);

        // Strong haptic feedback for long press
        if (capabilities.hasHapticFeedback) {
          navigator.vibrate([50, 30, 50]);
        }

        setTimeout(() => setIsLongPressing(false), 200);
      },
      [onLongPress, player, capabilities.hasHapticFeedback],
    ),

    onDrag: useCallback(
      (event: TouchEvent, delta: { x: number; y: number }) => {
        if (!isDragging) {
          onDragStart();
        }

        const newPosition = {
          x: position.x + delta.x,
          y: position.y + delta.y,
        };

        // Constrain to field bounds
        const constrainedPosition = {
          x: Math.max(0, Math.min(fieldBounds.width - 40, newPosition.x)),
          y: Math.max(0, Math.min(fieldBounds.height - 40, newPosition.y)),
        };

        const snappedPosition = snapPosition(constrainedPosition);
        onMove(player.id, snappedPosition);

        // Subtle haptic feedback during drag
        if (capabilities.hasHapticFeedback && Math.random() < 0.1) {
          navigator.vibrate(5);
        }
      },
      [
        isDragging,
        position,
        fieldBounds,
        snapPosition,
        onDragStart,
        onMove,
        player.id,
        capabilities.hasHapticFeedback,
      ],
    ),
  });

  // Framer Motion drag handlers
  const handleDrag = useCallback(
    (event: any, info: PanInfo) => {
      const newPosition = {
        x: position.x + info.delta.x,
        y: position.y + info.delta.y,
      };

      // Constrain to field bounds
      const constrainedPosition = {
        x: Math.max(0, Math.min(fieldBounds.width - 40, newPosition.x)),
        y: Math.max(0, Math.min(fieldBounds.height - 40, newPosition.y)),
      };

      const snappedPosition = snapPosition(constrainedPosition);
      onMove(player.id, snappedPosition);
    },
    [position, fieldBounds, snapPosition, onMove, player.id],
  );

  const handleDragEnd = useCallback(
    (event: any, info: PanInfo) => {
      onDragEnd();

      // Completion haptic feedback
      if (capabilities.hasHapticFeedback) {
        navigator.vibrate(25);
      }
    },
    [onDragEnd, capabilities.hasHapticFeedback],
  );

  // Get player position color based on role
  const getPositionColor = useCallback(() => {
    const posRole = player.positionRole || '';
    switch (posRole) {
      case 'GK':
        return 'bg-yellow-500 border-yellow-400';
      case 'CB':
      case 'LB':
      case 'RB':
      case 'LWB':
      case 'RWB':
        return 'bg-blue-500 border-blue-400';
      case 'CM':
      case 'CDM':
      case 'CAM':
      case 'LM':
      case 'RM':
        return 'bg-green-500 border-green-400';
      case 'LW':
      case 'RW':
      case 'CF':
      case 'ST':
        return 'bg-red-500 border-red-400';
      default:
        return 'bg-gray-500 border-gray-400';
    }
  }, [player.positionRole]);

  // Mobile-optimized touch targets (minimum 44px)
  const tokenSize = capabilities.isMobile ? Math.max(44, 36 * scale) : 36 * scale;
  const fontSize = capabilities.isMobile ? '11px' : '10px';

  return (
    <motion.div
      ref={tokenRef}
      className={`
        absolute cursor-pointer user-select-none touch-manipulation
        ${isSelected ? 'z-30' : 'z-20'}
        ${isDragging ? 'z-40' : ''}
      `}
      style={{
        width: tokenSize,
        height: tokenSize,
        x,
        y,
        scale: tokenScale,
        rotateZ: isDragging ? rotateZ : 0,
      }}
      drag={!capabilities.isMobile} // Use Framer Motion drag on desktop, touch gestures on mobile
      dragMomentum={false}
      dragElastic={0.1}
      onDrag={handleDrag}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{
        scale: 1.1,
        zIndex: 40,
        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
      }}
      whileTap={{
        scale: 0.95,
      }}
      animate={{
        scale: isSelected ? 1.15 : 1,
        boxShadow: isSelected
          ? '0 0 0 3px rgba(59, 130, 246, 0.5), 0 4px 8px rgba(0,0,0,0.2)'
          : isConflicted
            ? '0 0 0 2px rgba(239, 68, 68, 0.7), 0 4px 8px rgba(0,0,0,0.2)'
            : '0 2px 4px rgba(0,0,0,0.1)',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      role="button"
      tabIndex={0}
      aria-label={`Player ${player.name} (${player.position}) - ${player.rating} rating`}
      aria-pressed={isSelected}
      aria-grabbed={isDragging}
    >
      {/* Main token */}
      <div
        className={`
          relative w-full h-full rounded-full flex items-center justify-center
          ${getPositionColor()}
          border-2 transition-all duration-200
          ${isLongPressing ? 'animate-pulse' : ''}
          ${isDragging ? 'shadow-lg' : 'shadow-md'}
        `}
        style={{
          // Enhanced touch target for mobile
          minWidth: capabilities.isMobile ? '44px' : 'auto',
          minHeight: capabilities.isMobile ? '44px' : 'auto',
        }}
      >
        {/* Player number */}
        <span className="text-white font-bold" style={{ fontSize }}>
          {player.jerseyNumber || player.name.charAt(0)}
        </span>

        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Conflict indicator */}
        {isConflicted && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}

        {/* Long press indicator */}
        {isLongPressing && (
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20"
            initial={{ scale: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>

      {/* Mobile stats overlay */}
      {showStats && capabilities.isMobile && (
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          {player.name} • {player.rating}
        </motion.div>
      )}

      {/* Touch ripple effect */}
      {capabilities.isMobile && (
        <motion.div
          className="absolute inset-0 rounded-full bg-white/30 pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: isSelected ? [0, 1.5] : 0,
            opacity: isSelected ? [0.3, 0] : 0,
          }}
          transition={{ duration: 0.6 }}
        />
      )}

      {/* Performance overlay for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-4 -left-2 text-xs text-white bg-black/50 px-1 rounded">
          {Math.round(tokenScale.get() * 100)}%
        </div>
      )}
    </motion.div>
  );
};

export default memo(MobilePlayerToken);
