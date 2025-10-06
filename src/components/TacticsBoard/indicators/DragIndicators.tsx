import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Position } from '../../../hooks/useDragAndDrop';

interface SnapIndicatorProps {
  position: Position;
  type: 'grid' | 'formation' | 'zone' | 'player';
  visible: boolean;
  label?: string;
}

/**
 * Visual indicator showing snap target
 */
export const SnapIndicator: React.FC<SnapIndicatorProps> = ({ position, type, visible, label }) => {
  const getIndicatorColor = () => {
    switch (type) {
      case 'formation':
        return 'bg-blue-500 border-blue-300';
      case 'zone':
        return 'bg-purple-500 border-purple-300';
      case 'player':
        return 'bg-green-500 border-green-300';
      case 'grid':
        return 'bg-gray-500 border-gray-300';
      default:
        return 'bg-blue-500 border-blue-300';
    }
  };

  const getIndicatorIcon = () => {
    switch (type) {
      case 'formation':
        return '🎯';
      case 'zone':
        return '📍';
      case 'player':
        return '↔';
      case 'grid':
        return '⊞';
      default:
        return '📌';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Pulsing outer ring */}
          <motion.div
            className={`absolute inset-0 w-16 h-16 rounded-full border-4 ${getIndicatorColor()} opacity-30`}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
            }}
          />

          {/* Inner circle with icon */}
          <motion.div
            className={`w-12 h-12 rounded-full border-2 ${getIndicatorColor()} flex items-center justify-center bg-black/60 backdrop-blur-sm`}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <span className="text-2xl">{getIndicatorIcon()}</span>
          </motion.div>

          {/* Label */}
          {label && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap"
            >
              {label}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface CollisionWarningProps {
  position: Position;
  collidingWith: string[];
  visible: boolean;
}

/**
 * Visual warning for collision detection
 */
export const CollisionWarning: React.FC<CollisionWarningProps> = ({
  position,
  collidingWith,
  visible,
}) => {
  return (
    <AnimatePresence>
      {visible && collidingWith.length > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Pulsing red warning ring */}
          <motion.div
            className="absolute inset-0 w-20 h-20 rounded-full border-4 border-red-500 opacity-60"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.2, 0.6],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
            }}
          />

          {/* Warning icon */}
          <motion.div
            className="w-16 h-16 rounded-full bg-red-500/90 border-2 border-red-300 flex items-center justify-center"
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <span className="text-3xl">⚠️</span>
          </motion.div>

          {/* Collision count badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
          >
            {collidingWith.length}
          </motion.div>

          {/* Collision message */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
          >
            ⚠️ Too close to {collidingWith.length} player{collidingWith.length > 1 ? 's' : ''}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AlignmentGuideProps {
  type: 'horizontal' | 'vertical';
  position: number; // x for vertical, y for horizontal (in percentage)
  start: number; // Start position of the line (in percentage)
  end: number; // End position of the line (in percentage)
  visible: boolean;
}

/**
 * Visual guide line for player alignment
 */
export const AlignmentGuide: React.FC<AlignmentGuideProps> = ({
  type,
  position,
  start,
  end,
  visible,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="absolute z-20 pointer-events-none"
          style={
            type === 'horizontal'
              ? {
                  top: `${position}%`,
                  left: `${start}%`,
                  width: `${end - start}%`,
                  height: '2px',
                }
              : {
                  left: `${position}%`,
                  top: `${start}%`,
                  width: '2px',
                  height: `${end - start}%`,
                }
          }
        >
          {/* Animated dashed line */}
          <motion.div
            className="w-full h-full bg-gradient-to-r from-transparent via-green-400 to-transparent"
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              backgroundImage:
                type === 'horizontal'
                  ? 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(34, 197, 94, 0.8) 10px, rgba(34, 197, 94, 0.8) 20px)'
                  : 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(34, 197, 94, 0.8) 10px, rgba(34, 197, 94, 0.8) 20px)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface GridOverlayProps {
  gridSize: number; // Grid size in percentage
  visible: boolean;
  color?: string;
  opacity?: number;
}

/**
 * Visual grid overlay for snap-to-grid
 */
export const GridOverlay: React.FC<GridOverlayProps> = ({
  gridSize,
  visible,
  color = 'rgba(100, 116, 139, 0.2)',
  opacity = 0.3,
}) => {
  if (!visible) {
    return null;
  }

  const horizontalLines = Math.floor(100 / gridSize);
  const verticalLines = Math.floor(100 / gridSize);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 pointer-events-none"
    >
      <svg width="100%" height="100%" className="w-full h-full">
        <defs>
          <pattern
            id="grid-pattern"
            width={`${gridSize}%`}
            height={`${gridSize}%`}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width={`${gridSize}%`}
              height={`${gridSize}%`}
              fill="none"
              stroke={color}
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* Grid intersection dots */}
        {Array.from({ length: horizontalLines + 1 }).map((_, i) =>
          Array.from({ length: verticalLines + 1 }).map((_, j) => (
            <circle
              key={`${i}-${j}`}
              cx={`${j * gridSize}%`}
              cy={`${i * gridSize}%`}
              r="1.5"
              fill={color}
            />
          ))
        )}
      </svg>
    </motion.div>
  );
};

interface FormationSlotIndicatorProps {
  slots: Array<{
    id: string;
    position: Position;
    role: string;
    occupied: boolean;
  }>;
  visible: boolean;
}

/**
 * Visual indicators for available formation slots
 */
export const FormationSlotIndicators: React.FC<FormationSlotIndicatorProps> = ({
  slots,
  visible,
}) => {
  return (
    <AnimatePresence>
      {visible &&
        slots
          .filter(slot => !slot.occupied)
          .map(slot => (
            <motion.div
              key={slot.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute z-15 pointer-events-none"
              style={{
                left: `${slot.position.x}%`,
                top: `${slot.position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Pulsing circle */}
              <motion.div
                className="w-10 h-10 rounded-full border-2 border-dashed border-blue-400 bg-blue-500/10"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Role label */}
              <motion.div
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap"
              >
                {slot.role}
              </motion.div>
            </motion.div>
          ))}
    </AnimatePresence>
  );
};
