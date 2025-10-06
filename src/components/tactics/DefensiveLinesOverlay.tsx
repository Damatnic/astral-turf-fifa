import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../types';

interface DefensiveLinesOverlayProps {
  players: Player[];
  fieldWidth: number;
  fieldHeight: number;
  showOffsideLine?: boolean;
  showLabels?: boolean;
}

/**
 * DefensiveLinesOverlay - Visualizes defensive lines and offside trap positioning
 *
 * Shows the last defender line, midfield line, and optional offside trap visualization.
 *
 * Features:
 * - Animated defensive line based on deepest defender
 * - Midfield line showing team shape compactness
 * - Offside trap indicator
 * - Distance measurements between lines
 */
export const DefensiveLinesOverlay: React.FC<DefensiveLinesOverlayProps> = ({
  players,
  fieldWidth,
  fieldHeight,
  showOffsideLine = true,
  showLabels = true,
}) => {
  // Calculate defensive lines from player positions
  const lines = useMemo(() => {
    if (players.length === 0) {
      return {
        defensiveLine: fieldHeight * 0.25,
        midfieldLine: fieldHeight * 0.5,
        attackingLine: fieldHeight * 0.75,
        compactness: 0,
      };
    }

    // Sort players by Y position (defensive to attacking)
    const sortedByY = [...players].sort((a, b) => a.position.y - b.position.y);

    // Find defensive line (average of deepest 4 players)
    const defenders = sortedByY.slice(0, Math.min(4, sortedByY.length));
    const defensiveLine = defenders.reduce((sum, p) => sum + p.position.y, 0) / defenders.length;

    // Find midfield line (average of middle players)
    const midStart = Math.floor(sortedByY.length * 0.3);
    const midEnd = Math.ceil(sortedByY.length * 0.7);
    const midfielders = sortedByY.slice(midStart, midEnd);
    const midfieldLine = midfielders.reduce((sum, p) => sum + p.position.y, 0) / midfielders.length;

    // Find attacking line (average of highest 3 players)
    const attackers = sortedByY.slice(-Math.min(3, sortedByY.length));
    const attackingLine = attackers.reduce((sum, p) => sum + p.position.y, 0) / attackers.length;

    // Calculate team compactness (distance between defensive and attacking lines)
    const compactness = attackingLine - defensiveLine;

    return {
      defensiveLine,
      midfieldLine,
      attackingLine,
      compactness,
    };
  }, [players, fieldHeight]);

  // Calculate offside line (last defender + 10px)
  const offsideLine = lines.defensiveLine + 10;

  return (
    <svg className="absolute inset-0 pointer-events-none" width={fieldWidth} height={fieldHeight}>
      <defs>
        {/* Gradient for defensive line */}
        <linearGradient id="defensive-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
          <stop offset="10%" stopColor="#ef4444" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#ef4444" stopOpacity="0.8" />
          <stop offset="90%" stopColor="#ef4444" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>

        {/* Gradient for midfield line */}
        <linearGradient id="midfield-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="10%" stopColor="#3b82f6" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.7" />
          <stop offset="90%" stopColor="#3b82f6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>

        {/* Gradient for attacking line */}
        <linearGradient id="attacking-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
          <stop offset="10%" stopColor="#22c55e" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#22c55e" stopOpacity="0.7" />
          <stop offset="90%" stopColor="#22c55e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>

        {/* Offside line gradient */}
        <linearGradient id="offside-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
          <stop offset="10%" stopColor="#f59e0b" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="90%" stopColor="#f59e0b" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Defensive Line */}
      <motion.g
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Line */}
        <motion.line
          x1="0"
          y1={lines.defensiveLine}
          x2={fieldWidth}
          y2={lines.defensiveLine}
          stroke="url(#defensive-gradient)"
          strokeWidth="3"
          strokeDasharray="12 6"
          animate={{
            strokeDashoffset: [0, -18],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Glow effect */}
        <line
          x1="0"
          y1={lines.defensiveLine}
          x2={fieldWidth}
          y2={lines.defensiveLine}
          stroke="#ef4444"
          strokeWidth="6"
          opacity="0.2"
          filter="url(#line-glow)"
        />

        {/* Label */}
        {showLabels && (
          <g>
            <rect
              x={fieldWidth - 120}
              y={lines.defensiveLine - 14}
              width="110"
              height="28"
              rx="14"
              fill="#ef4444"
              opacity="0.9"
            />
            <text
              x={fieldWidth - 65}
              y={lines.defensiveLine + 5}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="600"
            >
              Defensive Line
            </text>
          </g>
        )}
      </motion.g>

      {/* Midfield Line */}
      <motion.g
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Line */}
        <motion.line
          x1="0"
          y1={lines.midfieldLine}
          x2={fieldWidth}
          y2={lines.midfieldLine}
          stroke="url(#midfield-gradient)"
          strokeWidth="2"
          strokeDasharray="8 4"
          animate={{
            strokeDashoffset: [0, -12],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Label */}
        {showLabels && (
          <g>
            <rect
              x={fieldWidth - 110}
              y={lines.midfieldLine - 14}
              width="100"
              height="28"
              rx="14"
              fill="#3b82f6"
              opacity="0.9"
            />
            <text
              x={fieldWidth - 60}
              y={lines.midfieldLine + 5}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="600"
            >
              Midfield Line
            </text>
          </g>
        )}
      </motion.g>

      {/* Attacking Line */}
      <motion.g
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Line */}
        <motion.line
          x1="0"
          y1={lines.attackingLine}
          x2={fieldWidth}
          y2={lines.attackingLine}
          stroke="url(#attacking-gradient)"
          strokeWidth="2"
          strokeDasharray="8 4"
          animate={{
            strokeDashoffset: [0, -12],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Label */}
        {showLabels && (
          <g>
            <rect
              x={fieldWidth - 110}
              y={lines.attackingLine - 14}
              width="100"
              height="28"
              rx="14"
              fill="#22c55e"
              opacity="0.9"
            />
            <text
              x={fieldWidth - 60}
              y={lines.attackingLine + 5}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="600"
            >
              Attacking Line
            </text>
          </g>
        )}
      </motion.g>

      {/* Offside Line (if enabled) */}
      {showOffsideLine && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Animated offside line */}
          <motion.line
            x1="0"
            y1={offsideLine}
            x2={fieldWidth}
            y2={offsideLine}
            stroke="url(#offside-gradient)"
            strokeWidth="2.5"
            strokeDasharray="6 3"
            animate={{
              strokeDashoffset: [0, -9],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Offside zone indicator (area between defensive line and offside line) */}
          <rect
            x="0"
            y={lines.defensiveLine}
            width={fieldWidth}
            height={offsideLine - lines.defensiveLine}
            fill="#f59e0b"
            opacity="0.15"
          />

          {/* Label */}
          {showLabels && (
            <g>
              <rect
                x={10}
                y={offsideLine - 14}
                width="95"
                height="28"
                rx="14"
                fill="#f59e0b"
                opacity="0.95"
              />
              <text
                x={57}
                y={offsideLine + 5}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="600"
              >
                Offside Trap
              </text>
            </g>
          )}
        </motion.g>
      )}

      {/* Compactness indicator - distance between lines */}
      {showLabels && (
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Vertical measurement line */}
          <line
            x1={10}
            y1={lines.defensiveLine}
            x2={10}
            y2={lines.attackingLine}
            stroke="white"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Top cap */}
          <line
            x1={5}
            y1={lines.defensiveLine}
            x2={15}
            y2={lines.defensiveLine}
            stroke="white"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Bottom cap */}
          <line
            x1={5}
            y1={lines.attackingLine}
            x2={15}
            y2={lines.attackingLine}
            stroke="white"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Distance label */}
          <g>
            <rect
              x={20}
              y={(lines.defensiveLine + lines.attackingLine) / 2 - 16}
              width="90"
              height="32"
              rx="16"
              fill="rgba(0, 0, 0, 0.8)"
            />
            <text
              x={65}
              y={(lines.defensiveLine + lines.attackingLine) / 2 - 4}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="500"
            >
              Compactness
            </text>
            <text
              x={65}
              y={(lines.defensiveLine + lines.attackingLine) / 2 + 8}
              textAnchor="middle"
              fill="#22c55e"
              fontSize="13"
              fontWeight="700"
            >
              {Math.round(lines.compactness)}px
            </text>
          </g>
        </motion.g>
      )}

      {/* Filter for glow effect */}
      <defs>
        <filter id="line-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
};

export default DefensiveLinesOverlay;
