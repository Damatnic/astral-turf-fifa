/**
 * Formation Transition Overlay
 * Displays visual effects during formation transitions
 * Shows motion trails, directional arrows, and animation effects
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerTransition } from '../../hooks/useFormationTransition';

interface FormationTransitionOverlayProps {
  transitions: Map<string, PlayerTransition>;
  isActive: boolean;
  showTrails?: boolean;
  showArrows?: boolean;
  className?: string;
}

/**
 * Calculate arrow path from start to end position
 */
const calculateArrowPath = (
  from: { x: number; y: number },
  to: { x: number; y: number },
): string => {
  // Convert percentage positions to SVG coordinates (assuming 100x100 viewBox)
  const startX = from.x;
  const startY = from.y;
  const endX = to.x;
  const endY = to.y;

  // Calculate control points for a smooth curve
  const deltaX = endX - startX;
  const deltaY = endY - startY;

  // Add slight curve for visual interest
  const curvature = 0.2;
  const controlX = startX + deltaX / 2 + deltaY * curvature;
  const controlY = startY + deltaY / 2 - deltaX * curvature;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
};

export const FormationTransitionOverlay: React.FC<FormationTransitionOverlayProps> = ({
  transitions,
  isActive,
  showTrails = true,
  showArrows = true,
  className = '',
}) => {
  if (!isActive || transitions.size === 0) {
    return null;
  }

  const transitionArray = Array.from(transitions.values());

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
          style={{ zIndex: 5 }}
        >
          {/* SVG Container for paths and arrows */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Arrow marker for path ends */}
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="rgba(59, 130, 246, 0.6)" />
              </marker>

              {/* Gradient for motion trails */}
              <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
                <stop offset="50%" stopColor="rgba(59, 130, 246, 0.4)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.6)" />
              </linearGradient>
            </defs>

            {/* Render motion trails */}
            {showTrails &&
              transitionArray.map(transition => {
                const path = calculateArrowPath(transition.fromPosition, transition.toPosition);

                return (
                  <motion.path
                    key={`trail-${transition.playerId}`}
                    d={path}
                    stroke="url(#trailGradient)"
                    strokeWidth="0.5"
                    fill="none"
                    strokeDasharray="4 2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.8 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      pathLength: {
                        duration: transition.duration / 1000,
                        delay: transition.delay / 1000,
                        ease: 'easeInOut',
                      },
                      opacity: {
                        duration: 0.3,
                        delay: transition.delay / 1000,
                      },
                    }}
                  />
                );
              })}

            {/* Render directional arrows */}
            {showArrows &&
              transitionArray.map(transition => {
                const path = calculateArrowPath(transition.fromPosition, transition.toPosition);

                return (
                  <motion.path
                    key={`arrow-${transition.playerId}`}
                    d={path}
                    stroke="rgba(59, 130, 246, 0.6)"
                    strokeWidth="0.8"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      pathLength: {
                        duration: transition.duration / 1000,
                        delay: transition.delay / 1000,
                        ease: [0.4, 0, 0.2, 1], // Custom bezier for smooth motion
                      },
                      opacity: {
                        duration: 0.3,
                        delay: transition.delay / 1000,
                      },
                    }}
                  />
                );
              })}
          </svg>

          {/* Pulsing dots at destination positions */}
          {transitionArray.map(transition => (
            <motion.div
              key={`destination-${transition.playerId}`}
              className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-blue-400 opacity-0"
              style={{
                left: `${transition.toPosition.x}%`,
                top: `${transition.toPosition.y}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1.5,
                delay: transition.delay / 1000,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            />
          ))}

          {/* Ripple effect at start positions */}
          {transitionArray.map(transition => (
            <motion.div
              key={`ripple-${transition.playerId}`}
              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-blue-400"
              style={{
                left: `${transition.fromPosition.x}%`,
                top: `${transition.fromPosition.y}%`,
              }}
              initial={{ opacity: 0.8, scale: 0 }}
              animate={{
                opacity: 0,
                scale: 2,
              }}
              transition={{
                duration: 0.8,
                delay: transition.delay / 1000,
                ease: 'easeOut',
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FormationTransitionOverlay;
