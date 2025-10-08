/**
 * Tactical Zones Overlay Component
 * Displays defensive, midfield, and attacking thirds with visual indicators
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TacticalZonesOverlayProps {
  isVisible: boolean;
  showLabels?: boolean;
  highlightedZone?: 'defensive' | 'midfield' | 'attacking' | null;
  opacity?: number;
  className?: string;
}

export const TacticalZonesOverlay: React.FC<TacticalZonesOverlayProps> = ({
  isVisible,
  showLabels = true,
  highlightedZone = null,
  opacity = 0.3,
  className = '',
}) => {
  if (!isVisible) {
    return null;
  }

  const zones = [
    {
      id: 'defensive',
      label: 'Defensive Third',
      x: 0,
      width: 33.33,
      color: 'rgba(239, 68, 68, 0.2)', // Red
      borderColor: 'rgba(239, 68, 68, 0.5)',
      labelColor: 'text-red-400',
    },
    {
      id: 'midfield',
      label: 'Midfield Third',
      x: 33.33,
      width: 33.34,
      color: 'rgba(234, 179, 8, 0.2)', // Yellow
      borderColor: 'rgba(234, 179, 8, 0.5)',
      labelColor: 'text-yellow-400',
    },
    {
      id: 'attacking',
      label: 'Attacking Third',
      x: 66.67,
      width: 33.33,
      color: 'rgba(34, 197, 94, 0.2)', // Green
      borderColor: 'rgba(34, 197, 94, 0.5)',
      labelColor: 'text-green-400',
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{ zIndex: 1 }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradient patterns for each zone */}
            {zones.map(zone => (
              <linearGradient
                key={`gradient-${zone.id}`}
                id={`zoneGradient-${zone.id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={zone.color} stopOpacity="0.1" />
                <stop offset="50%" stopColor={zone.color} stopOpacity={opacity} />
                <stop offset="100%" stopColor={zone.color} stopOpacity="0.1" />
              </linearGradient>
            ))}

            {/* Animated dashed pattern for borders */}
            <pattern id="dashedPattern" patternUnits="userSpaceOnUse" width="8" height="2">
              <rect x="0" y="0" width="4" height="2" fill="currentColor" />
            </pattern>
          </defs>

          {/* Zone backgrounds */}
          {zones.map(zone => (
            <motion.rect
              key={`zone-${zone.id}`}
              x={zone.x}
              y="0"
              width={zone.width}
              height="100"
              fill={`url(#zoneGradient-${zone.id})`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: highlightedZone === zone.id ? 1 : highlightedZone ? 0.3 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}

          {/* Zone dividing lines */}
          {zones.slice(0, -1).map((zone, index) => (
            <motion.line
              key={`divider-${zone.id}`}
              x1={zone.x + zone.width}
              y1="0"
              x2={zone.x + zone.width}
              y2="100"
              stroke={zone.borderColor}
              strokeWidth="0.3"
              strokeDasharray="2 2"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 0.6, pathLength: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          ))}

          {/* Animated pulse effect on highlighted zone */}
          {highlightedZone &&
            zones.map(zone => {
              if (zone.id !== highlightedZone) {
                return null;
              }
              return (
                <motion.rect
                  key={`pulse-${zone.id}`}
                  x={zone.x}
                  y="0"
                  width={zone.width}
                  height="100"
                  fill="none"
                  stroke={zone.borderColor}
                  strokeWidth="0.5"
                  initial={{ opacity: 0.8 }}
                  animate={{
                    opacity: [0.8, 0.3, 0.8],
                    strokeWidth: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              );
            })}
        </svg>

        {/* Zone labels */}
        {showLabels && (
          <div className="absolute inset-0 flex">
            {zones.map((zone, index) => (
              <motion.div
                key={`label-${zone.id}`}
                className="flex-1 flex items-start justify-center pt-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div
                  className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    bg-gray-900/80 
                    border border-gray-700/50
                    ${zone.labelColor}
                    ${highlightedZone === zone.id ? 'ring-2 ring-current' : ''}
                  `}
                  style={{
                    opacity: highlightedZone === zone.id ? 1 : highlightedZone ? 0.5 : 0.8,
                  }}
                >
                  {zone.label}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Optional: Grid overlay for tactical analysis */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Horizontal lines */}
          {Array.from({ length: 5 }, (_, i) => i).map(index => (
            <line
              key={`h-grid-line-${index}`}
              x1="0"
              y1={(index + 1) * 16.67}
              x2="100"
              y2={(index + 1) * 16.67}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="0.1"
              strokeDasharray="1 1"
            />
          ))}

          {/* Vertical lines (zone boundaries highlighted) */}
          <line
            x1="33.33"
            y1="0"
            x2="33.33"
            y2="100"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="0.15"
            strokeDasharray="1 1"
          />
          <line
            x1="66.67"
            y1="0"
            x2="66.67"
            y2="100"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="0.15"
            strokeDasharray="1 1"
          />
        </svg>
      </motion.div>
    </AnimatePresence>
  );
};

export default TacticalZonesOverlay;
