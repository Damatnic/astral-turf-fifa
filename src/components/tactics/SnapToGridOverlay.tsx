import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SnapToGridOverlayProps {
  isVisible: boolean;
  gridSize?: number;
  snapPoints?: Array<{ x: number; y: number; label?: string; type?: 'position' | 'zone' }>;
  highlightedPoint?: { x: number; y: number };
  fieldDimensions: { width: number; height: number };
  showLabels?: boolean;
}

const SnapToGridOverlay: React.FC<SnapToGridOverlayProps> = ({
  isVisible,
  gridSize = 10,
  snapPoints = [],
  highlightedPoint,
  fieldDimensions,
  showLabels = true,
}) => {
  // Generate grid lines
  const gridLines = useMemo(() => {
    if (!isVisible || gridSize === 0) {return { vertical: [], horizontal: [] };}

    const vertical: number[] = [];
    const horizontal: number[] = [];

    for (let i = 0; i <= 100; i += gridSize) {
      vertical.push(i);
      horizontal.push(i);
    }

    return { vertical, horizontal };
  }, [isVisible, gridSize]);

  // Standard formation zones
  const tacticalZones = useMemo(() => [
    { x: 50, y: 10, label: 'GK', type: 'position', color: 'rgba(59, 130, 246, 0.2)' },
    { x: 30, y: 25, label: 'LCB', type: 'position', color: 'rgba(34, 197, 94, 0.2)' },
    { x: 70, y: 25, label: 'RCB', type: 'position', color: 'rgba(34, 197, 94, 0.2)' },
    { x: 15, y: 35, label: 'LB', type: 'position', color: 'rgba(34, 197, 94, 0.2)' },
    { x: 85, y: 35, label: 'RB', type: 'position', color: 'rgba(34, 197, 94, 0.2)' },
    { x: 35, y: 50, label: 'LCM', type: 'position', color: 'rgba(251, 191, 36, 0.2)' },
    { x: 65, y: 50, label: 'RCM', type: 'position', color: 'rgba(251, 191, 36, 0.2)' },
    { x: 50, y: 55, label: 'CAM', type: 'position', color: 'rgba(251, 191, 36, 0.2)' },
    { x: 25, y: 70, label: 'LW', type: 'position', color: 'rgba(239, 68, 68, 0.2)' },
    { x: 75, y: 70, label: 'RW', type: 'position', color: 'rgba(239, 68, 68, 0.2)' },
    { x: 50, y: 85, label: 'ST', type: 'position', color: 'rgba(239, 68, 68, 0.2)' },
  ], []);

  const allSnapPoints = useMemo(() => {
    return [...snapPoints, ...tacticalZones];
  }, [snapPoints, tacticalZones]);

  if (!isVisible) {return null;}

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        width={fieldDimensions.width}
        height={fieldDimensions.height}
        className="absolute inset-0"
        style={{ opacity: 0.3 }}
      >
        {/* Vertical Grid Lines */}
        {gridLines.vertical.map((x, index) => (
          <line
            key={`v-${index}`}
            x1={`${x}%`}
            y1="0%"
            x2={`${x}%`}
            y2="100%"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
            strokeDasharray={x % 20 === 0 ? '0' : '4 4'}
          />
        ))}

        {/* Horizontal Grid Lines */}
        {gridLines.horizontal.map((y, index) => (
          <line
            key={`h-${index}`}
            x1="0%"
            y1={`${y}%`}
            x2="100%"
            y2={`${y}%`}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
            strokeDasharray={y % 20 === 0 ? '0' : '4 4'}
          />
        ))}

        {/* Tactical Zone Indicators */}
        <g opacity="0.4">
          {/* Defensive Third */}
          <rect
            x="0%"
            y="0%"
            width="100%"
            height="33.33%"
            fill="rgba(34, 197, 94, 0.05)"
            stroke="rgba(34, 197, 94, 0.3)"
            strokeWidth="1"
            strokeDasharray="8 4"
          />

          {/* Middle Third */}
          <rect
            x="0%"
            y="33.33%"
            width="100%"
            height="33.33%"
            fill="rgba(251, 191, 36, 0.05)"
            stroke="rgba(251, 191, 36, 0.3)"
            strokeWidth="1"
            strokeDasharray="8 4"
          />

          {/* Attacking Third */}
          <rect
            x="0%"
            y="66.66%"
            width="100%"
            height="33.34%"
            fill="rgba(239, 68, 68, 0.05)"
            stroke="rgba(239, 68, 68, 0.3)"
            strokeWidth="1"
            strokeDasharray="8 4"
          />
        </g>

        {/* Snap Points */}
        {allSnapPoints.map((point, index) => {
          const isHighlighted =
            highlightedPoint &&
            Math.abs(highlightedPoint.x - point.x) < 3 &&
            Math.abs(highlightedPoint.y - point.y) < 3;

          return (
            <g key={`snap-${index}`}>
              {/* Snap Point Circle */}
              <motion.circle
                cx={`${point.x}%`}
                cy={`${point.y}%`}
                r={isHighlighted ? "12" : "6"}
                fill={isHighlighted ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.15)'}
                stroke={isHighlighted ? 'rgba(59, 130, 246, 1)' : 'rgba(255, 255, 255, 0.3)'}
                strokeWidth={isHighlighted ? "3" : "1.5"}
                animate={{
                  scale: isHighlighted ? [1, 1.2, 1] : 1,
                  opacity: isHighlighted ? [0.4, 1, 0.4] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: isHighlighted ? Infinity : 0,
                  ease: 'easeInOut',
                }}
              />

              {/* Zone Area (for position types) */}
              {point.type === 'position' && (
                <circle
                  cx={`${point.x}%`}
                  cy={`${point.y}%`}
                  r="30"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity={isHighlighted ? 0.8 : 0.3}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Labels */}
      {showLabels && (
        <div className="absolute inset-0">
          {allSnapPoints.filter(p => p.label).map((point, index) => {
            const isHighlighted =
              highlightedPoint &&
              Math.abs(highlightedPoint.x - point.x) < 3 &&
              Math.abs(highlightedPoint.y - point.y) < 3;

            return (
              <motion.div
                key={`label-${index}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: isHighlighted ? 1 : 0.5,
                  scale: isHighlighted ? 1.2 : 1,
                }}
                style={{
                  position: 'absolute',
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  transform: 'translate(-50%, -150%)',
                }}
                className="pointer-events-none"
              >
                <div className={`
                  px-2 py-1 rounded-md text-xs font-bold
                  ${isHighlighted
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-800/80 text-gray-300'
                  }
                  transition-all duration-200
                `}>
                  {point.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Grid Info Overlay */}
      <div className="absolute top-4 left-4 bg-gray-900/90  rounded-lg px-4 py-2 border border-gray-700/50">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-300">Snap Points</span>
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <span className="text-gray-400">Grid: {gridSize}%</span>
        </div>
      </div>

      {/* Current Position Indicator */}
      {highlightedPoint && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          style={{
            position: 'absolute',
            left: `${highlightedPoint.x}%`,
            top: `${highlightedPoint.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none"
        >
          <div className="relative">
            {/* Pulse Effect */}
            <motion.div
              animate={{
                scale: [1, 2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-full bg-blue-500"
              style={{ width: '40px', height: '40px', marginLeft: '-20px', marginTop: '-20px' }}
            />

            {/* Center Dot */}
            <div className="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SnapToGridOverlay;
