/**
 * Perfected Player Token
 * 
 * Enhanced player token with:
 * - Smooth drag-and-drop
 * - Rich visual feedback
 * - Click interactions
 * - Hover effects
 * - Selection states
 * - Swap indicators
 * - Performance optimized
 */

import React, { memo, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { User, Star, Activity, Heart, Shield, Zap, AlertTriangle } from 'lucide-react';
import type { Player } from '../../types';

interface PerfectedPlayerTokenProps {
  player: Player;
  position: { x: number; y: number };
  isSelected?: boolean;
  isDragging?: boolean;
  isHovered?: boolean;
  isDraggedOver?: boolean; // When another player is being dragged over this one
  canSwap?: boolean; // Can swap positions with dragged player
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDragStart?: () => void;
  onDrag?: (position: { x: number; y: number }) => void;
  onDragEnd?: (finalPosition: { x: number; y: number }) => void;
  onSwapRequest?: (targetPlayerId: string) => void;
  showName?: boolean;
  showNumber?: boolean;
  showStats?: boolean;
  showStamina?: boolean;
  showMorale?: boolean;
  size?: 'sm' | 'md' | 'lg';
  viewMode?: 'compact' | 'standard' | 'detailed';
  zIndex?: number;
  fieldDimensions?: { width: number; height: number };
}

const PerfectedPlayerToken: React.FC<PerfectedPlayerTokenProps> = ({
  player,
  position,
  isSelected = false,
  isDragging = false,
  isHovered = false,
  isDraggedOver = false,
  canSwap = false,
  onClick,
  onDoubleClick,
  onDragStart,
  onDrag,
  onDragEnd,
  onSwapRequest,
  showName = true,
  showNumber = true,
  showStats = false,
  showStamina = true,
  showMorale = true,
  size = 'md',
  viewMode = 'standard',
  zIndex = 10,
  fieldDimensions,
}) => {
  const [isLocalHovered, setIsLocalHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Token size configuration
  const tokenSizes = {
    sm: { width: 40, height: 40, fontSize: 'text-xs' },
    md: { width: 50, height: 50, fontSize: 'text-sm' },
    lg: { width: 60, height: 60, fontSize: 'text-base' },
  };

  const tokenConfig = tokenSizes[size];

  // Calculate player overall rating
  const overall = useMemo(() => {
    if (player.overall) return player.overall;
    if (player.attributes) {
      const attrs = player.attributes;
      const sum = (attrs.speed || 0) + (attrs.passing || 0) + (attrs.tackling || 0) + 
                  (attrs.shooting || 0) + (attrs.dribbling || 0) + (attrs.positioning || 0);
      return Math.round(sum / 6);
    }
    return 75;
  }, [player]);

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 85) return 'from-emerald-500 to-green-600';
    if (rating >= 75) return 'from-blue-500 to-cyan-600';
    if (rating >= 65) return 'from-slate-500 to-gray-600';
    return 'from-amber-600 to-orange-700';
  };

  // Get stamina color
  const getStaminaColor = (stamina: number) => {
    if (stamina >= 80) return 'bg-green-500';
    if (stamina >= 50) return 'bg-yellow-500';
    if (stamina >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get morale indicator
  const getMoraleIcon = (morale: string | undefined) => {
    switch (morale?.toLowerCase()) {
      case 'excellent': return <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />;
      case 'good': return <Heart className="w-3 h-3 text-green-400 fill-green-400" />;
      case 'okay': return <Activity className="w-3 h-3 text-blue-400" />;
      case 'poor': return <AlertTriangle className="w-3 h-3 text-orange-400" />;
      default: return null;
    }
  };

  // Handle clicks (single, double)
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    setClickCount(prev => prev + 1);

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      if (clickCount + 1 === 2 && onDoubleClick) {
        onDoubleClick();
      } else if (onClick) {
        onClick();
      }
      setClickCount(0);
    }, 250);
  }, [clickCount, onClick, onDoubleClick]);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    dragStartRef.current = position;
    if (onDragStart) {
      onDragStart();
    }
  }, [position, onDragStart]);

  // Handle drag
  const handleDragHandler = useCallback((_event: any, info: PanInfo) => {
    if (!fieldDimensions || !dragStartRef.current) return;

    // Convert pixel offset to percentage
    const percentX = (info.offset.x / fieldDimensions.width) * 100;
    const percentY = (info.offset.y / fieldDimensions.height) * 100;

    const newPosition = {
      x: Math.max(0, Math.min(100, dragStartRef.current.x + percentX)),
      y: Math.max(0, Math.min(100, dragStartRef.current.y + percentY)),
    };

    if (onDrag) {
      onDrag(newPosition);
    }
  }, [fieldDimensions, onDrag]);

  // Handle drag end
  const handleDragEndHandler = useCallback((_event: any, info: PanInfo) => {
    if (!fieldDimensions || !dragStartRef.current) return;

    const percentX = (info.offset.x / fieldDimensions.width) * 100;
    const percentY = (info.offset.y / fieldDimensions.height) * 100;

    const finalPosition = {
      x: Math.max(0, Math.min(100, dragStartRef.current.x + percentX)),
      y: Math.max(0, Math.min(100, dragStartRef.current.y + percentY)),
    };

    if (onDragEnd) {
      onDragEnd(finalPosition);
    }

    dragStartRef.current = null;
  }, [fieldDimensions, onDragEnd]);

  // Determine if player is available
  const isAvailable = player.availability?.status === 'Available' || !player.availability;
  const isInjured = player.availability?.status === 'Injured';
  const isSuspended = player.availability?.status === 'Suspended';
  const isTired = (player.stamina || 100) < 30;

  return (
    <motion.div
      layout
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      onDragStart={handleDragStart}
      onDrag={handleDragHandler}
      onDragEnd={handleDragEndHandler}
      whileHover={{ scale: 1.1, zIndex: 100 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        x: `${position.x}%`,
        y: `${position.y}%`,
        scale: isDragging ? 1.2 : 1,
        zIndex: isDragging ? 1000 : isSelected ? 50 : zIndex,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.5,
      }}
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className="select-none"
      onClick={handleClick}
      onMouseEnter={() => setIsLocalHovered(true)}
      onMouseLeave={() => setIsLocalHovered(false)}
    >
      {/* Main Token Container */}
      <div className="relative">
        {/* Swap Indicator */}
        <AnimatePresence>
          {canSwap && isDraggedOver && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="absolute inset-0 rounded-full bg-blue-500/30 border-4 border-blue-400 border-dashed animate-pulse" />
              <div className="text-white bg-blue-600 rounded-full p-2 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection Ring */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute -inset-2 rounded-full border-4 border-cyan-400 shadow-lg shadow-cyan-500/50 pointer-events-none"
              style={{
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Hover Ring */}
        <AnimatePresence>
          {(isLocalHovered || isHovered) && !isDragging && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute -inset-1 rounded-full border-2 border-white/50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Dragging Shadow */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-black/20 blur-xl -z-10 pointer-events-none"
              style={{
                transform: 'translateY(10px)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Token Body */}
        <div
          className={`
            relative rounded-full overflow-hidden
            ${isAvailable ? '' : 'opacity-60'}
            ${isDragging ? 'shadow-2xl ring-4 ring-white/30' : 'shadow-lg'}
            ${isSelected ? 'ring-2 ring-cyan-400' : ''}
            transition-all duration-200
          `}
          style={{
            width: tokenConfig.width,
            height: tokenConfig.height,
          }}
        >
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${getRatingColor(overall)}`} />

          {/* Status Indicators Overlay */}
          {(isInjured || isSuspended || isTired) && (
            <div className="absolute inset-0 bg-red-600/40" />
          )}

          {/* Jersey Number */}
          {showNumber && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-2xl drop-shadow-lg">
                {player.jerseyNumber || 0}
              </span>
            </div>
          )}

          {/* Top Badge (Captain, Star Player, etc.) */}
          <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-1">
            {player.isCaptain && (
              <div className="bg-yellow-400 rounded-full p-0.5 shadow-md">
                <Shield className="w-3 h-3 text-yellow-900" />
              </div>
            )}
          </div>

          {/* Status Icons */}
          <div className="absolute top-1 right-1 flex flex-col gap-0.5">
            {isInjured && (
              <div className="bg-red-600 rounded-full p-0.5">
                <AlertTriangle className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            {isSuspended && (
              <div className="bg-amber-600 rounded-full p-0.5">
                <AlertTriangle className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            {isTired && (
              <div className="bg-orange-600 rounded-full p-0.5">
                <Zap className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Morale Indicator */}
          {showMorale && player.morale && (
            <div className="absolute top-1 left-1">
              {getMoraleIcon(player.morale)}
            </div>
          )}

          {/* Stamina Bar */}
          {showStamina && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${player.stamina || 100}%` }}
                className={getStaminaColor(player.stamina || 100)}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Overall Rating Badge */}
          {showStats && viewMode !== 'compact' && (
            <div className="absolute bottom-0 right-0 translate-x-1 translate-y-1">
              <div className="bg-slate-900 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border border-white/20 shadow-md">
                {overall}
              </div>
            </div>
          )}
        </div>

        {/* Player Name (Below Token) */}
        {showName && viewMode !== 'compact' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: isLocalHovered || isHovered || isSelected ? 1 : 0.8, y: 0 }}
            className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <div className="bg-slate-900/90 text-white text-xs px-2 py-0.5 rounded shadow-lg backdrop-blur-sm border border-white/10">
              {player.name}
            </div>
          </motion.div>
        )}

        {/* Drag Preview Ghost */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-white/20 border-2 border-dashed border-white/40"
              style={{
                left: '-50%',
                top: '-50%',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>

        {/* Swap Arrows Animation */}
        <AnimatePresence>
          {canSwap && isDraggedOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [0.9, 1.1, 0.9],
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg font-bold">
                SWAP
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats Tooltip (on Hover) */}
        <AnimatePresence>
          {(isLocalHovered || isHovered) && showStats && viewMode === 'detailed' && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none z-50"
            >
              <div className="bg-slate-900 text-white text-xs rounded-lg shadow-2xl border border-slate-700 p-3 min-w-[200px]">
                <div className="font-bold mb-2 text-sm">{player.name}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-slate-400">Pace:</span>
                    <span className="font-semibold">{player.attributes?.speed || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-green-400" />
                    <span className="text-slate-400">Pass:</span>
                    <span className="font-semibold">{player.attributes?.passing || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span className="text-slate-400">Def:</span>
                    <span className="font-semibold">{player.attributes?.tackling || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-orange-400" />
                    <span className="text-slate-400">Shoot:</span>
                    <span className="font-semibold">{player.attributes?.shooting || '-'}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Overall:</span>
                    <span className="font-bold text-base text-emerald-400">{overall}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Memoize with custom comparison
export default memo(PerfectedPlayerToken, (prevProps, nextProps) => {
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.position.x === nextProps.position.x &&
    prevProps.position.y === nextProps.position.y &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isDraggedOver === nextProps.isDraggedOver &&
    prevProps.canSwap === nextProps.canSwap &&
    prevProps.showName === nextProps.showName &&
    prevProps.showNumber === nextProps.showNumber &&
    prevProps.showStats === nextProps.showStats &&
    prevProps.size === nextProps.size
  );
});


