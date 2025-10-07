import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../types';

interface PressingZonesOverlayProps {
  players: Player[];
  fieldWidth: number;
  fieldHeight: number;
  pressIntensity?: 'high' | 'medium' | 'low';
  showLabels?: boolean;
}

/**
 * PressingZonesOverlay - Visualizes team pressing zones and defensive coverage
 *
 * Shows areas where the team applies pressure, calculated from player positions
 * and their defensive attributes.
 *
 * Features:
 * - High/medium/low press zones with distinct colors
 * - Animated zone boundaries
 * - Intensity calculation based on player density and defensive stats
 * - Visual indicators for press triggers (e.g., near sidelines, in final third)
 */
export const PressingZonesOverlay: React.FC<PressingZonesOverlayProps> = ({
  players,
  fieldWidth,
  fieldHeight,
  pressIntensity = 'medium',
  showLabels = true,
}) => {
  // Calculate pressing zones based on player positions
  const pressingZones = useMemo(() => {
    const zones: Array<{
      id: string;
      center: { x: number; y: number };
      radius: number;
      intensity: 'high' | 'medium' | 'low';
      players: Player[];
    }> = [];

    // Group nearby players into pressing clusters
    const clusters: Player[][] = [];
    const visited = new Set<string>();

    players.forEach(player => {
      if (visited.has(player.id)) {
        return;
      }

      const cluster = [player];
      visited.add(player.id);

      // Find nearby teammates (within 100px)
      players.forEach(other => {
        if (visited.has(other.id)) {
          return;
        }

        const distance = Math.sqrt(
          Math.pow(player.position.x - other.position.x, 2) +
            Math.pow(player.position.y - other.position.y, 2),
        );

        if (distance < 100) {
          cluster.push(other);
          visited.add(other.id);
        }
      });

      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    });

    // Create pressing zones from clusters
    clusters.forEach((cluster, index) => {
      const centerX = cluster.reduce((sum, p) => sum + p.position.x, 0) / cluster.length;
      const centerY = cluster.reduce((sum, p) => sum + p.position.y, 0) / cluster.length;

      // Determine intensity based on player count and position
      let intensity: 'high' | 'medium' | 'low' = 'low';
      if (cluster.length >= 4) {
        intensity = 'high';
      } else if (cluster.length >= 3) {
        intensity = 'medium';
      }

      zones.push({
        id: `press-zone-${index}`,
        center: { x: centerX, y: centerY },
        radius: 60 + cluster.length * 15,
        intensity,
        players: cluster,
      });
    });

    return zones;
  }, [players]);

  // Color mapping for press intensity
  const getZoneColor = (intensity: 'high' | 'medium' | 'low') => {
    switch (intensity) {
      case 'high':
        return { fill: '#ef4444', stroke: '#dc2626', label: 'High Press' };
      case 'medium':
        return { fill: '#f59e0b', stroke: '#d97706', label: 'Medium Press' };
      case 'low':
        return { fill: '#3b82f6', stroke: '#2563eb', label: 'Low Press' };
    }
  };

  return (
    <svg className="absolute inset-0 pointer-events-none" width={fieldWidth} height={fieldHeight}>
      <defs>
        {/* Gradient for each zone */}
        {pressingZones.map(zone => {
          const colors = getZoneColor(zone.intensity);
          return (
            <radialGradient
              key={`gradient-${zone.id}`}
              id={`gradient-${zone.id}`}
              cx="50%"
              cy="50%"
            >
              <stop offset="0%" stopColor={colors.fill} stopOpacity="0.4" />
              <stop offset="50%" stopColor={colors.fill} stopOpacity="0.2" />
              <stop offset="100%" stopColor={colors.fill} stopOpacity="0" />
            </radialGradient>
          );
        })}

        {/* Pulsing animation filter */}
        <filter id="press-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Render pressing zones */}
      {pressingZones.map((zone, index) => {
        const colors = getZoneColor(zone.intensity);

        return (
          <g key={zone.id}>
            {/* Zone area with gradient fill */}
            <motion.circle
              cx={zone.center.x}
              cy={zone.center.y}
              r={zone.radius}
              fill={`url(#gradient-${zone.id})`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: 'easeOut',
              }}
            />

            {/* Animated boundary ring */}
            <motion.circle
              cx={zone.center.x}
              cy={zone.center.y}
              r={zone.radius}
              fill="none"
              stroke={colors.stroke}
              strokeWidth="2"
              strokeDasharray="8 4"
              opacity={0.6}
              filter="url(#press-glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1,
                delay: index * 0.1,
                ease: 'easeInOut',
              }}
            />

            {/* Pulsing effect for high-intensity zones */}
            {zone.intensity === 'high' && (
              <motion.circle
                cx={zone.center.x}
                cy={zone.center.y}
                r={zone.radius}
                fill="none"
                stroke={colors.stroke}
                strokeWidth="1.5"
                opacity={0.4}
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
            )}

            {/* Zone label */}
            {showLabels && (
              <motion.g
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                {/* Label background */}
                <rect
                  x={zone.center.x - 40}
                  y={zone.center.y - 12}
                  width="80"
                  height="24"
                  rx="12"
                  fill={colors.stroke}
                  opacity={0.9}
                />
                {/* Label text */}
                <text
                  x={zone.center.x}
                  y={zone.center.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="600"
                >
                  {colors.label}
                </text>
                {/* Player count badge */}
                <circle
                  cx={zone.center.x + 42}
                  cy={zone.center.y}
                  r="8"
                  fill="white"
                  opacity={0.9}
                />
                <text
                  x={zone.center.x + 42}
                  y={zone.center.y + 3}
                  textAnchor="middle"
                  fill={colors.stroke}
                  fontSize="9"
                  fontWeight="700"
                >
                  {zone.players.length}
                </text>
              </motion.g>
            )}
          </g>
        );
      })}

      {/* Directional arrows showing press direction */}
      {pressingZones.map((zone, index) => {
        // Arrow points toward opponent's goal (assuming bottom of field)
        const arrowLength = 30;
        const angle = Math.PI / 2; // Point down

        return (
          <motion.g
            key={`arrow-${zone.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: index * 0.1 + 0.5 }}
          >
            <defs>
              <marker
                id={`arrowhead-${zone.id}`}
                markerWidth="10"
                markerHeight="10"
                refX="5"
                refY="5"
                orient="auto"
              >
                <polygon points="0,0 10,5 0,10" fill={getZoneColor(zone.intensity).stroke} />
              </marker>
            </defs>
            <motion.line
              x1={zone.center.x}
              y1={zone.center.y}
              x2={zone.center.x + Math.cos(angle) * arrowLength}
              y2={zone.center.y + Math.sin(angle) * arrowLength}
              stroke={getZoneColor(zone.intensity).stroke}
              strokeWidth="2"
              markerEnd={`url(#arrowhead-${zone.id})`}
              animate={{
                y1: [zone.center.y, zone.center.y - 5, zone.center.y],
                y2: [
                  zone.center.y + Math.sin(angle) * arrowLength,
                  zone.center.y + Math.sin(angle) * arrowLength - 5,
                  zone.center.y + Math.sin(angle) * arrowLength,
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.g>
        );
      })}
    </svg>
  );
};

export default PressingZonesOverlay;
