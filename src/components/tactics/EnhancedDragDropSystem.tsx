/**
 * Enhanced Drag and Drop System
 * 
 * Features:
 * - Smooth drag with spring physics
 * - Visual feedback (ghost, guides, snap indicators)
 * - Player position swapping
 * - Snap to grid/formation
 * - Collision detection
 * - Touch support
 * - Performance optimized
 */

import React, { useCallback, useState, useRef, useMemo } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import type { Player } from '../../types';

export interface DragDropContextState {
  draggedPlayerId: string | null;
  draggedPlayerStartPos: { x: number; y: number } | null;
  currentDragPosition: { x: number; y: number } | null;
  hoveredPlayerId: string | null;
  canSwap: boolean;
  snapTarget: { type: 'grid' | 'formation' | 'player'; id?: string } | null;
}

export interface PlayerSwapEvent {
  sourcePlayerId: string;
  targetPlayerId: string;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
}

export interface DragDropHandlers {
  onPlayerDragStart: (playerId: string, position: { x: number; y: number }) => void;
  onPlayerDrag: (playerId: string, position: { x: number; y: number }) => void;
  onPlayerDragEnd: (playerId: string, finalPosition: { x: number; y: number }) => void;
  onPlayerSwap: (event: PlayerSwapEvent) => void;
  onPlayerHover: (playerId: string | null) => void;
}

export function useDragDropSystem(
  players: Player[],
  onPlayerMove: (playerId: string, position: { x: number; y: number }, targetPlayerId?: string) => void,
  options: {
    enableSnap?: boolean;
    enableSwap?: boolean;
    snapDistance?: number;
    showVisualFeedback?: boolean;
  } = {}
) {
  const {
    enableSnap = true,
    enableSwap = true,
    snapDistance = 15,
    showVisualFeedback = true,
  } = options;

  const [dragState, setDragState] = useState<DragDropContextState>({
    draggedPlayerId: null,
    draggedPlayerStartPos: null,
    currentDragPosition: null,
    hoveredPlayerId: null,
    canSwap: false,
    snapTarget: null,
  });

  const dragStartTimeRef = useRef<number>(0);

  /**
   * Find player at position (for swap detection)
   */
  const findPlayerAtPosition = useCallback(
    (position: { x: number; y: number }, excludePlayerId?: string): Player | null => {
      const threshold = 8; // 8% radius for detection

      for (const player of players) {
        if (player.id === excludePlayerId || !player.position) {
          continue;
        }

        const distance = Math.sqrt(
          Math.pow(player.position.x - position.x, 2) +
          Math.pow(player.position.y - position.y, 2)
        );

        if (distance < threshold) {
          return player;
        }
      }

      return null;
    },
    [players]
  );

  /**
   * Find nearest snap position
   */
  const findSnapPosition = useCallback(
    (position: { x: number; y: number }, draggedPlayerId: string): {
      snappedPosition: { x: number; y: number };
      snapTarget: { type: 'grid' | 'formation' | 'player'; id?: string } | null;
    } => {
      if (!enableSnap) {
        return { snappedPosition: position, snapTarget: null };
      }

      // Check for player swap snap
      const nearbyPlayer = findPlayerAtPosition(position, draggedPlayerId);
      if (nearbyPlayer && nearbyPlayer.position) {
        const distance = Math.sqrt(
          Math.pow(nearbyPlayer.position.x - position.x, 2) +
          Math.pow(nearbyPlayer.position.y - position.y, 2)
        );

        if (distance < snapDistance) {
          return {
            snappedPosition: nearbyPlayer.position,
            snapTarget: { type: 'player', id: nearbyPlayer.id },
          };
        }
      }

      // Grid snapping (5% increments)
      const gridSize = 5;
      const snappedX = Math.round(position.x / gridSize) * gridSize;
      const snappedY = Math.round(position.y / gridSize) * gridSize;
      
      const distanceToGrid = Math.sqrt(
        Math.pow(snappedX - position.x, 2) +
        Math.pow(snappedY - position.y, 2)
      );

      if (distanceToGrid < snapDistance / 2) {
        return {
          snappedPosition: { x: snappedX, y: snappedY },
          snapTarget: { type: 'grid' },
        };
      }

      return { snappedPosition: position, snapTarget: null };
    },
    [enableSnap, snapDistance, findPlayerAtPosition]
  );

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((playerId: string, position: { x: number; y: number }) => {
    dragStartTimeRef.current = Date.now();
    
    setDragState({
      draggedPlayerId: playerId,
      draggedPlayerStartPos: position,
      currentDragPosition: position,
      hoveredPlayerId: null,
      canSwap: false,
      snapTarget: null,
    });
  }, []);

  /**
   * Handle drag
   */
  const handleDrag = useCallback((playerId: string, position: { x: number; y: number }) => {
    // Find snap position
    const { snappedPosition, snapTarget } = findSnapPosition(position, playerId);

    // Check if hovering over another player for swap
    const hoveredPlayer = snapTarget?.type === 'player' ? snapTarget.id : null;
    const canSwap = enableSwap && !!hoveredPlayer;

    setDragState(prev => ({
      ...prev,
      currentDragPosition: snappedPosition,
      hoveredPlayerId: hoveredPlayer || null,
      canSwap,
      snapTarget,
    }));
  }, [findSnapPosition, enableSwap]);

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback((playerId: string, finalPosition: { x: number; y: number }) => {
    const dragDuration = Date.now() - dragStartTimeRef.current;

    // Find final snap position
    const { snappedPosition, snapTarget } = findSnapPosition(finalPosition, playerId);

    // Check if this is a swap operation
    if (snapTarget?.type === 'player' && snapTarget.id && enableSwap) {
      const targetPlayer = players.find(p => p.id === snapTarget.id);
      
      if (targetPlayer && targetPlayer.position && dragState.draggedPlayerStartPos) {
        // Execute swap
        const swapEvent: PlayerSwapEvent = {
          sourcePlayerId: playerId,
          targetPlayerId: targetPlayer.id,
          sourcePosition: dragState.draggedPlayerStartPos,
          targetPosition: targetPlayer.position,
        };

        // Move source player to target position
        onPlayerMove(playerId, targetPlayer.position, targetPlayer.id);

        // Move target player to source position
        onPlayerMove(targetPlayer.id, dragState.draggedPlayerStartPos, playerId);

        // Log swap for analytics
        console.log('Player swap:', swapEvent);
      }
    } else {
      // Normal move (no swap)
      onPlayerMove(playerId, snappedPosition);
    }

    // Reset drag state
    setDragState({
      draggedPlayerId: null,
      draggedPlayerStartPos: null,
      currentDragPosition: null,
      hoveredPlayerId: null,
      canSwap: false,
      snapTarget: null,
    });
  }, [findSnapPosition, enableSwap, dragState, players, onPlayerMove]);

  /**
   * Handle hover (for click-to-swap or hover effects)
   */
  const handlePlayerHover = useCallback((playerId: string | null) => {
    if (!dragState.draggedPlayerId) {
      setDragState(prev => ({ ...prev, hoveredPlayerId: playerId }));
    }
  }, [dragState.draggedPlayerId]);

  return {
    dragState,
    handlers: {
      onPlayerDragStart: handleDragStart,
      onPlayerDrag: handleDrag,
      onPlayerDragEnd: handleDragEnd,
      onPlayerSwap: (event: PlayerSwapEvent) => {
        onPlayerMove(event.sourcePlayerId, event.targetPosition, event.targetPlayerId);
        onPlayerMove(event.targetPlayerId, event.sourcePosition, event.sourcePlayerId);
      },
      onPlayerHover: handlePlayerHover,
    },
  };
}

/**
 * Visual Feedback Components
 */

interface DragGuideLinesprops {
  position: { x: number; y: number } | null;
  fieldDimensions: { width: number; height: number };
  show: boolean;
}

export const DragGuideLines: React.FC<DragGuideLinesprops> = ({ position, fieldDimensions, show }) => {
  if (!show || !position) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Vertical guide */}
      <div
        className="absolute top-0 bottom-0 w-px bg-cyan-400/50"
        style={{ left: `${position.x}%` }}
      />
      {/* Horizontal guide */}
      <div
        className="absolute left-0 right-0 h-px bg-cyan-400/50"
        style={{ top: `${position.y}%` }}
      />
      {/* Position indicator */}
      <div
        className="absolute bg-cyan-500 text-white text-xs px-2 py-1 rounded shadow-lg"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(10px, -30px)',
        }}
      >
        ({Math.round(position.x)}, {Math.round(position.y)})
      </div>
    </div>
  );
};

interface SnapIndicatorProps {
  snapTarget: { type: 'grid' | 'formation' | 'player'; id?: string } | null;
  position: { x: number; y: number } | null;
}

export const SnapIndicator: React.FC<SnapIndicatorProps> = ({ snapTarget, position }) => {
  if (!snapTarget || !position) return null;

  const getSnapColor = () => {
    switch (snapTarget.type) {
      case 'grid': return 'bg-green-500/30 border-green-400';
      case 'formation': return 'bg-blue-500/30 border-blue-400';
      case 'player': return 'bg-purple-500/30 border-purple-400';
      default: return 'bg-gray-500/30 border-gray-400';
    }
  };

  const getSnapLabel = () => {
    switch (snapTarget.type) {
      case 'grid': return 'Grid';
      case 'formation': return 'Formation';
      case 'player': return 'Swap';
      default: return 'Snap';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className={`w-16 h-16 rounded-full border-2 border-dashed ${getSnapColor()} flex items-center justify-center`}>
        <span className="text-xs text-white font-bold">{getSnapLabel()}</span>
      </div>
    </motion.div>
  );
};

interface SwapPreviewProps {
  sourcePlayer: Player | null;
  targetPlayer: Player | null;
  show: boolean;
}

export const SwapPreview: React.FC<SwapPreviewProps> = ({ sourcePlayer, targetPlayer, show }) => {
  if (!show || !sourcePlayer || !targetPlayer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white p-4 rounded-lg shadow-2xl border border-cyan-400"
    >
      <div className="flex items-center gap-4">
        {/* Source Player */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
            {sourcePlayer.jerseyNumber}
          </div>
          <div className="text-xs mt-1">{sourcePlayer.name}</div>
        </div>

        {/* Swap Arrows */}
        <div className="flex flex-col items-center">
          <motion.div
            animate={{
              x: [0, 10, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </motion.div>
          <div className="text-xs font-bold text-cyan-400 mt-1">SWAP</div>
        </div>

        {/* Target Player */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg">
            {targetPlayer.jerseyNumber}
          </div>
          <div className="text-xs mt-1">{targetPlayer.name}</div>
        </div>
      </div>

      <div className="mt-3 text-center text-xs text-slate-400">
        Release to swap positions
      </div>
    </motion.div>
  );
};

interface DragGhostProps {
  player: Player;
  position: { x: number; y: number };
  opacity?: number;
}

export const DragGhost: React.FC<DragGhostProps> = ({ player, position, opacity = 0.5 }) => {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        opacity,
      }}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-dashed border-white/40 flex items-center justify-center">
        <span className="text-white/60 font-bold">{player.jerseyNumber}</span>
      </div>
    </motion.div>
  );
};

/**
 * Enhanced Player Token with Drag Support
 */

interface EnhancedDraggableTokenProps {
  player: Player;
  position: { x: number; y: number };
  isSelected?: boolean;
  isDragging?: boolean;
  isDraggedOver?: boolean;
  canSwap?: boolean;
  fieldRef: React.RefObject<HTMLElement>;
  onDragStart: (playerId: string, position: { x: number; y: number }) => void;
  onDrag: (playerId: string, position: { x: number; y: number }) => void;
  onDragEnd: (playerId: string, position: { x: number; y: number }) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const EnhancedDraggableToken: React.FC<EnhancedDraggableTokenProps> = ({
  player,
  position,
  isSelected,
  isDragging,
  isDraggedOver,
  canSwap,
  fieldRef,
  onDragStart,
  onDrag,
  onDragEnd,
  onClick,
  onDoubleClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>(position);

  // Convert field percentage to pixels for smooth dragging
  const convertToPixels = useCallback((percentPos: { x: number; y: number }) => {
    if (!fieldRef.current) return { x: 0, y: 0 };
    
    const rect = fieldRef.current.getBoundingClientRect();
    return {
      x: (percentPos.x / 100) * rect.width,
      y: (percentPos.y / 100) * rect.height,
    };
  }, [fieldRef]);

  // Convert pixels to field percentage
  const convertToPercent = useCallback((pixelPos: { x: number; y: number }) => {
    if (!fieldRef.current) return position;
    
    const rect = fieldRef.current.getBoundingClientRect();
    return {
      x: (pixelPos.x / rect.width) * 100,
      y: (pixelPos.y / rect.height) * 100,
    };
  }, [fieldRef, position]);

  const handlePanStart = useCallback(() => {
    dragStartPosRef.current = position;
    onDragStart(player.id, position);
  }, [player.id, position, onDragStart]);

  const handlePan = useCallback((_event: any, info: PanInfo) => {
    const pixelStart = convertToPixels(dragStartPosRef.current);
    const newPixelPos = {
      x: pixelStart.x + info.offset.x,
      y: pixelStart.y + info.offset.y,
    };
    const newPercentPos = convertToPercent(newPixelPos);
    
    onDrag(player.id, newPercentPos);
  }, [player.id, convertToPixels, convertToPercent, onDrag]);

  const handlePanEnd = useCallback((_event: any, info: PanInfo) => {
    const pixelStart = convertToPixels(dragStartPosRef.current);
    const finalPixelPos = {
      x: pixelStart.x + info.offset.x,
      y: pixelStart.y + info.offset.y,
    };
    const finalPercentPos = convertToPercent(finalPixelPos);
    
    onDragEnd(player.id, finalPercentPos);
  }, [player.id, convertToPixels, convertToPercent, onDragEnd]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handlePanStart}
      onDrag={handlePan}
      onDragEnd={handlePanEnd}
      whileHover={{ scale: isSelected ? 1.15 : 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isDragging ? 1.3 : isSelected ? 1.1 : 1,
        zIndex: isDragging ? 1000 : isSelected ? 100 : 50,
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 35,
      }}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className="select-none"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Pulse */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-cyan-400 -m-1"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Swap Indicator */}
      {canSwap && isDraggedOver && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1.5, rotate: 360 }}
          className="absolute inset-0 rounded-full border-4 border-blue-500 border-dashed -m-2"
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
          }}
        />
      )}

      {/* Token */}
      <div
        className={`
          w-14 h-14 rounded-full overflow-hidden
          ${isDragging ? 'ring-4 ring-white/50 shadow-2xl' : 'shadow-lg'}
          ${isSelected ? 'ring-2 ring-cyan-400' : ''}
          ${canSwap && isDraggedOver ? 'ring-4 ring-blue-500 animate-pulse' : ''}
          transition-all duration-200
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-xl">{player.jerseyNumber}</span>
        </div>
        
        {/* Stamina bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/50">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${player.stamina || 100}%` }}
          />
        </div>
      </div>

      {/* Player Name */}
      {(isHovered || isSelected) && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg border border-white/20">
            {player.name}
          </div>
        </motion.div>
      )}

      {/* Drag Instructions */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-cyan-400">
            {canSwap ? '🔄 Release to swap' : '📍 Drag to position'}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default {
  useDragDropSystem,
  DragGuideLines,
  SnapIndicator,
  SwapPreview,
  EnhancedDraggableToken,
};


