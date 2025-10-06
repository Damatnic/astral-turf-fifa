import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../types/player';

interface PlayerStatRadarProps {
  player: Player;
  size?: number;
  showLabels?: boolean;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  comparisonPlayer?: Player;
  comparisonColor?: string;
}

const PlayerStatRadar: React.FC<PlayerStatRadarProps> = ({
  player,
  size = 300,
  showLabels = true,
  color = '#3B82F6',
  backgroundColor = 'rgba(59, 130, 246, 0.1)',
  animated = true,
  comparisonPlayer,
  comparisonColor = '#10B981',
}) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) * 0.7;

  // Define the 6 attributes to display
  const attributes = useMemo(
    () => [
      { key: 'speed', label: 'Speed', value: player.attributes.speed },
      { key: 'shooting', label: 'Shooting', value: player.attributes.shooting },
      { key: 'passing', label: 'Passing', value: player.attributes.passing },
      { key: 'dribbling', label: 'Dribbling', value: player.attributes.dribbling },
      { key: 'tackling', label: 'Tackling', value: player.attributes.tackling },
      { key: 'positioning', label: 'Positioning', value: player.attributes.positioning },
    ],
    [player.attributes]
  );

  // Comparison player attributes
  const comparisonAttributes = useMemo(() => {
    if (!comparisonPlayer) {
      return null;
    }
    return [
      { key: 'speed', label: 'Speed', value: comparisonPlayer.attributes.speed },
      { key: 'shooting', label: 'Shooting', value: comparisonPlayer.attributes.shooting },
      { key: 'passing', label: 'Passing', value: comparisonPlayer.attributes.passing },
      { key: 'dribbling', label: 'Dribbling', value: comparisonPlayer.attributes.dribbling },
      { key: 'tackling', label: 'Tackling', value: comparisonPlayer.attributes.tackling },
      { key: 'positioning', label: 'Positioning', value: comparisonPlayer.attributes.positioning },
    ];
  }, [comparisonPlayer]);

  // Calculate polygon points for the radar chart
  const calculatePolygonPoints = (stats: typeof attributes, maxValue = 100) => {
    const angleStep = (2 * Math.PI) / stats.length;
    return stats
      .map((stat, i) => {
        const angle = angleStep * i - Math.PI / 2; // Start from top
        const value = (stat.value / maxValue) * radius;
        const x = centerX + Math.cos(angle) * value;
        const y = centerY + Math.sin(angle) * value;
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Calculate label positions
  const calculateLabelPosition = (index: number) => {
    const angleStep = (2 * Math.PI) / attributes.length;
    const angle = angleStep * index - Math.PI / 2;
    const labelDistance = radius * 1.25;
    const x = centerX + Math.cos(angle) * labelDistance;
    const y = centerY + Math.sin(angle) * labelDistance;
    return { x, y };
  };

  // Generate grid circles
  const gridLevels = [20, 40, 60, 80, 100];

  // Generate grid lines from center to each vertex
  const gridLines = useMemo(() => {
    const angleStep = (2 * Math.PI) / attributes.length;
    return attributes.map((_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      return { x1: centerX, y1: centerY, x2: x, y2: y };
    });
  }, [attributes.length, centerX, centerY, radius]);

  const mainPolygonPoints = calculatePolygonPoints(attributes);
  const comparisonPolygonPoints = comparisonAttributes
    ? calculatePolygonPoints(comparisonAttributes)
    : null;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Circles */}
        {gridLevels.map((level) => (
          <circle
            key={level}
            cx={centerX}
            cy={centerY}
            r={(level / 100) * radius}
            fill="none"
            stroke="rgba(156, 163, 175, 0.2)"
            strokeWidth="1"
          />
        ))}

        {/* Grid Lines */}
        {gridLines.map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(156, 163, 175, 0.2)"
            strokeWidth="1"
          />
        ))}

        {/* Comparison Player Polygon (Behind) */}
        {comparisonPolygonPoints && (
          <>
            <motion.polygon
              points={comparisonPolygonPoints}
              fill={`${comparisonColor}20`}
              stroke={comparisonColor}
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: animated ? 0.6 : 0, delay: animated ? 0.2 : 0 }}
              style={{ transformOrigin: `${centerX}px ${centerY}px` }}
            />
            {comparisonAttributes?.map((stat, i) => {
              const angleStep = (2 * Math.PI) / attributes.length;
              const angle = angleStep * i - Math.PI / 2;
              const value = (stat.value / 100) * radius;
              const x = centerX + Math.cos(angle) * value;
              const y = centerY + Math.sin(angle) * value;

              return (
                <motion.circle
                  key={`comparison-${i}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={comparisonColor}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: animated ? 0.3 : 0, delay: animated ? 0.4 + i * 0.05 : 0 }}
                />
              );
            })}
          </>
        )}

        {/* Main Player Polygon */}
        <motion.polygon
          points={mainPolygonPoints}
          fill={backgroundColor}
          stroke={color}
          strokeWidth="2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: animated ? 0.6 : 0, delay: animated ? 0.1 : 0 }}
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />

        {/* Vertices (Points) */}
        {attributes.map((stat, i) => {
          const angleStep = (2 * Math.PI) / attributes.length;
          const angle = angleStep * i - Math.PI / 2;
          const value = (stat.value / 100) * radius;
          const x = centerX + Math.cos(angle) * value;
          const y = centerY + Math.sin(angle) * value;

          return (
            <motion.g key={i}>
              <motion.circle
                cx={x}
                cy={y}
                r="5"
                fill={color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: animated ? 0.3 : 0, delay: animated ? 0.3 + i * 0.05 : 0 }}
              />
              <motion.circle
                cx={x}
                cy={y}
                r="8"
                fill="none"
                stroke={color}
                strokeWidth="1"
                opacity="0.3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: animated ? 0.3 : 0, delay: animated ? 0.3 + i * 0.05 : 0 }}
              />
            </motion.g>
          );
        })}

        {/* Labels */}
        {showLabels &&
          attributes.map((stat, i) => {
            const { x, y } = calculateLabelPosition(i);
            const textAnchor = x > centerX + 5 ? 'start' : x < centerX - 5 ? 'end' : 'middle';
            const dy = y > centerY + 5 ? '1em' : y < centerY - 5 ? '-0.5em' : '0.35em';

            return (
              <motion.g
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: animated ? 0.3 : 0, delay: animated ? 0.5 + i * 0.05 : 0 }}
              >
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  dy={dy}
                  className="text-xs font-medium fill-gray-300"
                >
                  {stat.label}
                </text>
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  dy={y > centerY + 5 ? '2.2em' : y < centerY - 5 ? '-1.7em' : '1.55em'}
                  className="text-xs font-bold"
                  fill={color}
                >
                  {stat.value}
                </text>
              </motion.g>
            );
          })}
      </svg>

      {/* Center Value (Overall Rating) */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: animated ? 0.5 : 0, delay: animated ? 0.7 : 0 }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-full w-16 h-16 flex flex-col items-center justify-center border-2" style={{ borderColor: color }}>
          <span className="text-xl font-bold text-white">
            {Math.round(
              attributes.reduce((sum, attr) => sum + attr.value, 0) / attributes.length
            )}
          </span>
          <span className="text-xs text-gray-400">OVR</span>
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerStatRadar;
