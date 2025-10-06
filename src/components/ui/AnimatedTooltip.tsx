import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tooltipVariants } from '../../utils/animationVariants';

interface AnimatedTooltipProps {
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * AnimatedTooltip - Smooth tooltip with Framer Motion animations
 *
 * Features:
 * - Fade + scale animation on show/hide
 * - Configurable position (top/bottom/left/right)
 * - Delay before showing
 * - Auto-positioning with arrow
 * - Backdrop blur for modern look
 */
export const AnimatedTooltip: React.FC<AnimatedTooltipProps> = ({
  content,
  position = 'top',
  delay = 0.3,
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  // Position-specific styles
  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow styles
  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-gray-900',
    right:
      'right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-gray-900',
  };

  return (
    <div className="relative inline-block" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute z-50 ${positionStyles[position]} ${className}`}
          >
            {/* Tooltip content */}
            <div className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg backdrop-blur-sm whitespace-nowrap">
              {content}

              {/* Arrow */}
              <div className={`absolute w-0 h-0 ${arrowStyles[position]}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedTooltip;
