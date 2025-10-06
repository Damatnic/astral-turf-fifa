import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { panelVariants, cardVariants, slideInVariants } from '../../utils/animationVariants';

interface AnimatedPanelProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  variant?: 'default' | 'card' | 'slide-left' | 'slide-right' | 'slide-top' | 'slide-bottom';
  isVisible?: boolean;
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * AnimatedPanel - Panel/card with entrance animations
 *
 * Features:
 * - Multiple animation variants (fade, slide, scale)
 * - Configurable delay
 * - Hover effects for cards
 * - Smooth transitions
 * - Exit animations
 */
export const AnimatedPanel: React.FC<AnimatedPanelProps> = ({
  variant = 'default',
  isVisible = true,
  delay = 0,
  children,
  className = '',
  ...props
}) => {
  // Select animation variants based on variant prop
  const getVariants = () => {
    switch (variant) {
      case 'card':
        return cardVariants;
      case 'slide-left':
        return slideInVariants.left;
      case 'slide-right':
        return slideInVariants.right;
      case 'slide-top':
        return slideInVariants.top;
      case 'slide-bottom':
        return slideInVariants.bottom;
      default:
        return panelVariants;
    }
  };

  const variants = getVariants();

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      exit="exit"
      transition={{ delay }}
      className={className}
      {...(variant === 'card' && {
        whileHover: 'hover',
        whileTap: 'tap',
      })}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPanel;
