import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Player } from '../../types';

interface PlayerDragLayerProps {
  isDragging: boolean;
  currentPlayer: Player | null;
  dragPosition?: { x: number; y: number } | null;
  isValidDropZone?: boolean;
  isSnapTarget?: boolean;
}

const PlayerDragLayer: React.FC<PlayerDragLayerProps> = ({
  isDragging,
  currentPlayer,
  dragPosition,
  isValidDropZone = true,
  isSnapTarget = false,
}) => {
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);

  // Track cursor position for ghost preview
  useEffect(() => {
    if (!isDragging) {
      setCursorPosition(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDragging]);

  if (!isDragging || !currentPlayer) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 pointer-events-none z-40"
      >
        {/* Enhanced Drag Overlay with subtle gradient */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: isValidDropZone
              ? 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.08) 0%, rgba(15, 23, 42, 0.15) 100%)'
              : 'radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.15) 100%)',
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Ghost Preview - follows cursor */}
        {cursorPosition && (
          <motion.div
            className="absolute"
            style={{
              left: cursorPosition.x,
              top: cursorPosition.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: isValidDropZone ? 0.8 : 0.4,
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Ghost player token */}
            <motion.div
              className="relative"
              animate={{
                rotate: isSnapTarget ? [0, -5, 5, 0] : 0,
                scale: isSnapTarget ? 1.1 : 1,
              }}
              transition={{
                rotate: { repeat: Infinity, duration: 0.6, ease: 'easeInOut' },
                scale: { duration: 0.2 },
              }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full blur-md"
                style={{
                  width: '64px',
                  height: '64px',
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  backgroundColor: isValidDropZone
                    ? isSnapTarget
                      ? 'rgba(34, 197, 94, 0.6)'
                      : 'rgba(59, 130, 246, 0.5)'
                    : 'rgba(239, 68, 68, 0.5)',
                  scale: isSnapTarget ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  scale: { repeat: Infinity, duration: 1, ease: 'easeInOut' },
                  backgroundColor: { duration: 0.3 },
                }}
              />

              {/* Main player token */}
              <div
                className="relative w-12 h-12 rounded-full border-3 flex items-center justify-center font-bold text-white shadow-2xl"
                style={{
                  backgroundColor: (currentPlayer as any).teamColor || '#3b82f6',
                  borderColor: isValidDropZone
                    ? isSnapTarget
                      ? '#22c55e'
                      : '#3b82f6'
                    : '#ef4444',
                  borderWidth: '3px',
                  boxShadow: isValidDropZone
                    ? '0 10px 40px rgba(59, 130, 246, 0.5)'
                    : '0 10px 40px rgba(239, 68, 68, 0.5)',
                }}
              >
                {(currentPlayer as any).number || currentPlayer.name.charAt(0)}
              </div>

              {/* Snap indicator arrow */}
              {isSnapTarget && (
                <motion.div
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-green-400 drop-shadow-lg"
                  >
                    <motion.path
                      d="M12 4L12 20M12 20L18 14M12 20L6 14"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{ y: [0, 3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                    />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Player Info Card - Enhanced */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: -20 }}
          className="absolute top-6 left-6 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 max-w-sm shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white/20"
              style={{ backgroundColor: (currentPlayer as any).teamColor || '#3b82f6' }}
            >
              {(currentPlayer as any).number || '?'}
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-lg">{currentPlayer.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400 capitalize">
                  {currentPlayer.roleId?.replace('-', ' ') || 'Player'}
                </span>
                {currentPlayer.rating && (
                  <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">
                    {currentPlayer.rating}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status indicator */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <motion.div
              className="w-2 h-2 rounded-full"
              animate={{
                backgroundColor: isValidDropZone
                  ? isSnapTarget
                    ? '#22c55e'
                    : '#3b82f6'
                  : '#ef4444',
                boxShadow: isValidDropZone
                  ? isSnapTarget
                    ? '0 0 8px rgba(34, 197, 94, 0.8)'
                    : '0 0 8px rgba(59, 130, 246, 0.8)'
                  : '0 0 8px rgba(239, 68, 68, 0.8)',
              }}
              transition={{ duration: 0.2 }}
            />
            <span
              className="font-medium"
              style={{
                color: isValidDropZone
                  ? isSnapTarget
                    ? '#22c55e'
                    : '#3b82f6'
                  : '#ef4444',
              }}
            >
              {isSnapTarget
                ? '✓ Snap to formation slot'
                : isValidDropZone
                  ? 'Valid drop zone'
                  : '✗ Invalid position'}
            </span>
          </div>
        </motion.div>

        {/* Enhanced Drag Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl px-6 py-3 shadow-2xl"
        >
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <span className="text-blue-400 font-mono font-bold">↓</span>
              </div>
              <span className="text-white">Drop to place</span>
            </div>
            <div className="w-px h-6 bg-slate-700/50" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                <span className="text-red-400 font-mono font-bold">ESC</span>
              </div>
              <span className="text-slate-400">Cancel</span>
            </div>
            {isSnapTarget && (
              <>
                <div className="w-px h-6 bg-slate-700/50" />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 font-medium">Ready to snap</span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Field boundary indicators - show when near edges */}
        {dragPosition && (
          <>
            {dragPosition.x < 10 && (
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
              />
            )}
            {dragPosition.x > 90 && (
              <motion.div
                className="absolute right-0 top-0 bottom-0 w-1 bg-red-500/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
              />
            )}
            {dragPosition.y < 10 && (
              <motion.div
                className="absolute top-0 left-0 right-0 h-1 bg-red-500/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
              />
            )}
            {dragPosition.y > 90 && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-red-500/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
              />
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export { PlayerDragLayer };
export default PlayerDragLayer;
