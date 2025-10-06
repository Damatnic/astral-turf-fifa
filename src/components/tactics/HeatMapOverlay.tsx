import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../types';

interface HeatMapOverlayProps {
  players: Player[];
  fieldWidth: number;
  fieldHeight: number;
  intensity?: number;
  radius?: number;
  opacity?: number;
}

/**
 * HeatMapOverlay - Visualizes player position density using radial gradients
 *
 * Creates a heat map showing where players are concentrated on the field.
 * Uses SVG radial gradients for smooth, GPU-accelerated rendering.
 *
 * Features:
 * - Configurable intensity and radius
 * - Color-coded density (blue -> green -> yellow -> orange -> red)
 * - Animated fade-in on mount
 * - Blending modes for realistic heat map effect
 */
export const HeatMapOverlay: React.FC<HeatMapOverlayProps> = ({
  players,
  fieldWidth,
  fieldHeight,
  intensity = 0.7,
  radius = 80,
  opacity = 0.6,
}) => {
  // Generate unique gradient IDs for each player
  const gradients = useMemo(() => {
    return players.map((player, index) => ({
      id: `heat-gradient-${player.id}-${index}`,
      x: player.position.x,
      y: player.position.y,
    }));
  }, [players]);

  return (
    <motion.svg
      className="absolute inset-0 pointer-events-none"
      width={fieldWidth}
      height={fieldHeight}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.5 }}
      style={{ mixBlendMode: 'multiply' }}
    >
      <defs>
        {/* Define radial gradient for each player position */}
        {gradients.map(gradient => (
          <radialGradient key={gradient.id} id={gradient.id} cx="50%" cy="50%">
            {/* Heat map color stops: center (hot) to edge (cool) */}
            <stop offset="0%" stopColor="#ef4444" stopOpacity={intensity} />
            <stop offset="20%" stopColor="#f97316" stopOpacity={intensity * 0.9} />
            <stop offset="40%" stopColor="#eab308" stopOpacity={intensity * 0.7} />
            <stop offset="60%" stopColor="#22c55e" stopOpacity={intensity * 0.5} />
            <stop offset="80%" stopColor="#3b82f6" stopOpacity={intensity * 0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>

      {/* Render a circle for each player with radial gradient fill */}
      {gradients.map((gradient, index) => (
        <motion.circle
          key={`heat-${gradient.id}`}
          cx={gradient.x}
          cy={gradient.y}
          r={radius}
          fill={`url(#${gradient.id})`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: index * 0.02, // Stagger animation
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Optional: Add a subtle overlay grid for reference */}
      <g opacity={0.1} stroke="white" strokeWidth="0.5" fill="none">
        {/* Horizontal lines */}
        {[...Array(5)].map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={(fieldHeight / 4) * i}
            x2={fieldWidth}
            y2={(fieldHeight / 4) * i}
          />
        ))}
        {/* Vertical lines */}
        {[...Array(5)].map((_, i) => (
          <line
            key={`v-${i}`}
            x1={(fieldWidth / 4) * i}
            y1="0"
            x2={(fieldWidth / 4) * i}
            y2={fieldHeight}
          />
        ))}
      </g>
    </motion.svg>
  );
};

export default HeatMapOverlay;
