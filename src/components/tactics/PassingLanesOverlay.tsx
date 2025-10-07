import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../types';

interface PassingLanesOverlayProps {
  players: Player[];
  fieldWidth: number;
  fieldHeight: number;
  selectedPlayer?: Player | null;
  minPassDistance?: number;
  maxPassDistance?: number;
  showStrength?: boolean;
}

/**
 * PassingLanesOverlay - Visualizes passing options and connection strength
 *
 * Shows available passing lanes between players, with visual indicators for:
 * - Pass distance (short, medium, long)
 * - Connection strength (chemistry, positioning)
 * - Optimal passing triangles
 *
 * Features:
 * - Animated SVG paths for passing lanes
 * - Color-coded by pass quality/distance
 * - Highlights passing triangles for possession play
 * - Shows player chemistry connections
 */
export const PassingLanesOverlay: React.FC<PassingLanesOverlayProps> = ({
  players,
  fieldWidth,
  fieldHeight,
  selectedPlayer = null,
  minPassDistance = 30,
  maxPassDistance = 200,
  showStrength = true,
}) => {
  // Calculate passing lanes between players
  const passingLanes = useMemo(() => {
    const lanes: Array<{
      id: string;
      from: Player;
      to: Player;
      distance: number;
      strength: number;
      quality: 'excellent' | 'good' | 'fair' | 'poor';
    }> = [];

    // If a player is selected, show only their passing options
    const sourcePlayer = selectedPlayer ? [selectedPlayer] : players;

    sourcePlayer.forEach(from => {
      players.forEach(to => {
        if (from.id === to.id) {
          return;
        }

        // Calculate distance between players
        const distance = Math.sqrt(
          Math.pow(from.position.x - to.position.x, 2) +
            Math.pow(from.position.y - to.position.y, 2),
        );

        // Filter by distance constraints
        if (distance < minPassDistance || distance > maxPassDistance) {
          return;
        }

        // Calculate pass strength based on:
        // 1. Distance (shorter = stronger)
        // 2. Chemistry (if available)
        // 3. Positioning (vertical > diagonal > horizontal for forward passes)

        let strength = 1 - distance / maxPassDistance; // 0-1 based on distance

        // Bonus for good positioning (forward passes preferred)
        const verticalDiff = to.position.y - from.position.y;
        const horizontalDiff = Math.abs(to.position.x - from.position.x);

        if (verticalDiff > 0) {
          // Forward pass bonus
          strength += 0.2;

          if (horizontalDiff < distance / 3) {
            // Vertical pass bonus
            strength += 0.1;
          }
        }

        // Cap strength at 1
        strength = Math.min(strength, 1);

        // Determine quality tier
        let quality: 'excellent' | 'good' | 'fair' | 'poor';
        if (strength >= 0.8) {
          quality = 'excellent';
        } else if (strength >= 0.6) {
          quality = 'good';
        } else if (strength >= 0.4) {
          quality = 'fair';
        } else {
          quality = 'poor';
        }

        lanes.push({
          id: `lane-${from.id}-${to.id}`,
          from,
          to,
          distance,
          strength,
          quality,
        });
      });
    });

    // Sort by strength (best passes first)
    return lanes.sort((a, b) => b.strength - a.strength);
  }, [players, selectedPlayer, minPassDistance, maxPassDistance]);

  // Find passing triangles (groups of 3 players with mutual passing lanes)
  const passingTriangles = useMemo(() => {
    const triangles: Array<{
      id: string;
      players: [Player, Player, Player];
      center: { x: number; y: number };
    }> = [];

    // Only calculate triangles when no player is selected
    if (selectedPlayer || players.length < 3) {
      return triangles;
    }

    for (let i = 0; i < players.length - 2; i++) {
      for (let j = i + 1; j < players.length - 1; j++) {
        for (let k = j + 1; k < players.length; k++) {
          const p1 = players[i];
          const p2 = players[j];
          const p3 = players[k];

          // Check if all three players are within passing range
          const d12 = Math.sqrt(
            Math.pow(p1.position.x - p2.position.x, 2) + Math.pow(p1.position.y - p2.position.y, 2),
          );
          const d23 = Math.sqrt(
            Math.pow(p2.position.x - p3.position.x, 2) + Math.pow(p2.position.y - p3.position.y, 2),
          );
          const d31 = Math.sqrt(
            Math.pow(p3.position.x - p1.position.x, 2) + Math.pow(p3.position.y - p1.position.y, 2),
          );

          const maxTriangleSide = 120;
          if (d12 <= maxTriangleSide && d23 <= maxTriangleSide && d31 <= maxTriangleSide) {
            const centerX = (p1.position.x + p2.position.x + p3.position.x) / 3;
            const centerY = (p1.position.y + p2.position.y + p3.position.y) / 3;

            triangles.push({
              id: `triangle-${p1.id}-${p2.id}-${p3.id}`,
              players: [p1, p2, p3],
              center: { x: centerX, y: centerY },
            });
          }
        }
      }
    }

    return triangles.slice(0, 5); // Limit to 5 triangles to avoid clutter
  }, [players, selectedPlayer]);

  // Get color and style for passing lane quality
  const getLaneStyle = (quality: 'excellent' | 'good' | 'fair' | 'poor') => {
    switch (quality) {
      case 'excellent':
        return { color: '#22c55e', width: 3, opacity: 0.8, dashArray: '0' };
      case 'good':
        return { color: '#3b82f6', width: 2.5, opacity: 0.7, dashArray: '0' };
      case 'fair':
        return { color: '#f59e0b', width: 2, opacity: 0.6, dashArray: '4 2' };
      case 'poor':
        return { color: '#ef4444', width: 1.5, opacity: 0.5, dashArray: '2 2' };
    }
  };

  return (
    <svg className="absolute inset-0 pointer-events-none" width={fieldWidth} height={fieldHeight}>
      <defs>
        {/* Arrow markers for different qualities */}
        {(['excellent', 'good', 'fair', 'poor'] as const).map(quality => {
          const style = getLaneStyle(quality);
          return (
            <marker
              key={`arrow-${quality}`}
              id={`arrow-${quality}`}
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0,0 10,5 0,10" fill={style.color} opacity={style.opacity} />
            </marker>
          );
        })}

        {/* Glow filter for excellent passes */}
        <filter id="pass-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Render passing triangles (subtle background) */}
      {passingTriangles.map((triangle, index) => (
        <motion.g
          key={triangle.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          {/* Triangle fill */}
          <polygon
            points={triangle.players.map(p => `${p.position.x},${p.position.y}`).join(' ')}
            fill="#3b82f6"
            opacity={0.1}
          />

          {/* Triangle outline */}
          <polygon
            points={triangle.players.map(p => `${p.position.x},${p.position.y}`).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity={0.4}
          />

          {/* Center dot */}
          <circle
            cx={triangle.center.x}
            cy={triangle.center.y}
            r="3"
            fill="#3b82f6"
            opacity={0.5}
          />
        </motion.g>
      ))}

      {/* Render passing lanes */}
      {passingLanes.map((lane, index) => {
        const style = getLaneStyle(lane.quality);

        // Calculate control points for curved path
        const midX = (lane.from.position.x + lane.to.position.x) / 2;
        const midY = (lane.from.position.y + lane.to.position.y) / 2;

        // Add slight curve for visual appeal
        const dx = lane.to.position.x - lane.from.position.x;
        const dy = lane.to.position.y - lane.from.position.y;
        const curvature = 0.1;
        const controlX = midX - dy * curvature;
        const controlY = midY + dx * curvature;

        return (
          <motion.g
            key={lane.id}
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{
              duration: 0.6,
              delay: index * 0.02,
              ease: 'easeOut',
            }}
          >
            {/* Passing lane path */}
            <motion.path
              d={`M ${lane.from.position.x} ${lane.from.position.y} Q ${controlX} ${controlY} ${lane.to.position.x} ${lane.to.position.y}`}
              stroke={style.color}
              strokeWidth={style.width}
              strokeDasharray={style.dashArray}
              fill="none"
              opacity={style.opacity}
              markerEnd={`url(#arrow-${lane.quality})`}
              filter={lane.quality === 'excellent' ? 'url(#pass-glow)' : undefined}
              animate={
                lane.quality === 'excellent'
                  ? {
                      strokeDashoffset: [0, -8],
                      opacity: [style.opacity, style.opacity * 1.2, style.opacity],
                    }
                  : undefined
              }
              transition={
                lane.quality === 'excellent'
                  ? {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }
                  : undefined
              }
            />

            {/* Distance and strength indicator (for selected player) */}
            {selectedPlayer && showStrength && index < 5 && (
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                {/* Background circle */}
                <circle cx={controlX} cy={controlY} r="14" fill="rgba(0, 0, 0, 0.8)" />

                {/* Strength percentage */}
                <text
                  x={controlX}
                  y={controlY + 4}
                  textAnchor="middle"
                  fill={style.color}
                  fontSize="10"
                  fontWeight="700"
                >
                  {Math.round(lane.strength * 100)}%
                </text>
              </motion.g>
            )}
          </motion.g>
        );
      })}

      {/* Legend (when player is selected) */}
      {selectedPlayer && (
        <motion.g
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <rect x={10} y={10} width="140" height="110" rx="8" fill="rgba(0, 0, 0, 0.85)" />

          <text x={80} y={30} textAnchor="middle" fill="white" fontSize="12" fontWeight="600">
            Passing Options
          </text>

          {/* Legend items */}
          {(['excellent', 'good', 'fair', 'poor'] as const).map((quality, idx) => {
            const style = getLaneStyle(quality);
            const y = 50 + idx * 20;

            return (
              <g key={quality}>
                <line
                  x1={20}
                  y1={y}
                  x2={50}
                  y2={y}
                  stroke={style.color}
                  strokeWidth={style.width}
                  strokeDasharray={style.dashArray}
                  opacity={style.opacity}
                />
                <text x={60} y={y + 4} fill="white" fontSize="10">
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </text>
              </g>
            );
          })}
        </motion.g>
      )}
    </svg>
  );
};

export default PassingLanesOverlay;
