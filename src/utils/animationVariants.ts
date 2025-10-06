import type { Variants, Transition } from 'framer-motion';

/**
 * Framer Motion Animation Variants for Micro-interactions
 *
 * Centralized animation variants for consistent UI behavior across the app.
 * All animations designed for 60 FPS performance with GPU acceleration.
 */

// ==================== Button Animations ====================

export const buttonVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    scale: 1.05,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.95,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: 0.1,
      ease: 'easeIn',
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.5,
    boxShadow: 'none',
  },
};

export const iconButtonVariants: Variants = {
  idle: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.9,
    rotate: -5,
    transition: {
      duration: 0.1,
    },
  },
};

// ==================== Panel/Modal Animations ====================

export const panelVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// Slide-in variants grouped by direction (not using nested Variants structure to avoid type issues)
export const slideInVariants = {
  left: {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },
  right: {
    hidden: { x: 100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },
  top: {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },
  bottom: {
    hidden: { y: 100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },
} as const;

export const modalOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(8px)',
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: 0.2,
    },
  },
};

// ==================== Tooltip Animations ====================

export const tooltipVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 5,
    transition: {
      duration: 0.1,
    },
  },
};

// ==================== List/Stagger Animations ====================

export const listContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// ==================== Toggle/Switch Animations ====================

export const toggleVariants: Variants = {
  off: {
    x: 0,
    backgroundColor: '#9ca3af', // gray-400
  },
  on: {
    x: 20,
    backgroundColor: '#3b82f6', // blue-500
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
};

// ==================== Card/Tile Animations ====================

export const cardVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.15)',
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// ==================== Notification/Toast Animations ====================

export const notificationVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// ==================== Progress/Loading Animations ====================

export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ==================== Transitions ====================

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.3,
  ease: 'easeOut',
};

export const quickTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

export const bounceTransition: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 20,
  mass: 0.8,
};

// ==================== Drag Animations ====================

export const dragConstraints = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export const dragTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

// ==================== Utility Functions ====================

/**
 * Creates a stagger animation for child elements
 * @param staggerDelay - Delay between each child (in seconds)
 * @param initialDelay - Initial delay before first child (in seconds)
 */
export function createStaggerContainer(staggerDelay = 0.05, initialDelay = 0): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };
}

/**
 * Creates a stagger item animation
 * @param direction - Direction of animation ('x' | 'y')
 * @param distance - Distance to move (in pixels)
 */
export function createStaggerItem(direction: 'x' | 'y' = 'y', distance = 20) {
  return {
    hidden: {
      opacity: 0,
      [direction]: direction === 'y' ? distance : -distance,
    },
    visible: {
      opacity: 1,
      [direction]: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  } as Variants;
}

/**
 * Creates a fade animation
 * @param duration - Animation duration (in seconds)
 */
export function createFadeVariants(duration = 0.3): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration },
    },
    exit: {
      opacity: 0,
      transition: { duration: duration * 0.5 },
    },
  };
}

/**
 * Creates a scale animation
 * @param from - Starting scale
 * @param to - Ending scale
 */
export function createScaleVariants(from = 0.9, to = 1): Variants {
  return {
    hidden: {
      opacity: 0,
      scale: from,
    },
    visible: {
      opacity: 1,
      scale: to,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: from,
      transition: {
        duration: 0.2,
      },
    },
  };
}
