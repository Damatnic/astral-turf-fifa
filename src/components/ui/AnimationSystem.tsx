import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

// Define our own HTMLMotionProps equivalent since it's not exported in v12
type HTMLMotionProps<T extends keyof React.JSX.IntrinsicElements> = React.ComponentProps<typeof motion[T]>;

// Animation variants for common patterns
export const slideInVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -30,
    transition: { duration: 0.2 },
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    x: 30,
    transition: { duration: 0.2 },
  },
};

export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 },
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 },
  },
};

export const staggerChildrenVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const springVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

// Button animation variants
export const buttonVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 0 0 0 rgba(255, 255, 255, 0)",
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 4px 20px 0 rgba(255, 255, 255, 0.1)",
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: "easeInOut",
    },
  },
};

export const cardVariants: Variants = {
  idle: {
    scale: 1,
    rotateY: 0,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  hover: {
    scale: 1.02,
    rotateY: 1,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// High-level animation components
interface AnimatedContainerProps extends HTMLMotionProps<"div"> {
  variant?: 'slide' | 'fade' | 'scale' | 'spring';
  stagger?: boolean;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  variant = 'fade',
  stagger = false,
  children,
  ...props
}) => {
  let variants = fadeInVariants;

  switch (variant) {
    case 'slide':
      variants = slideInVariants;
      break;
    case 'scale':
      variants = scaleInVariants;
      break;
    case 'spring':
      variants = springVariants;
      break;
  }

  if (stagger) {
    variants = staggerChildrenVariants;
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'default' | 'card';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'default',
  children,
  ...props
}) => {
  const variants = variant === 'card' ? cardVariants : buttonVariants;

  return (
    <motion.button
      variants={variants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
    </motion.button>
  );
};

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({ children, className = "" }) => {
  return (
    <motion.div
      variants={staggerChildrenVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={fadeInVariants}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

interface PageTransitionProps {
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  mode = 'wait',
}) => {
  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={location.pathname}
        variants={slideInVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface LoadingAnimationProps {
  type?: 'spinner' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  type = 'spinner',
  size = 'md',
  className = "",
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (type === 'spinner') {
    return (
      <motion.div
        className={`${sizeClasses[size]} border-2 border-t-transparent border-blue-500 rounded-full ${className}`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    );
  }

  if (type === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`${size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'} bg-blue-500 rounded-full`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} bg-blue-500 rounded-full ${className}`}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

interface SuccessAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onComplete?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  size = 'md',
  className = "",
  onComplete,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      initial={{ scale: 0, rotate: 0 }}
      animate={{
        scale: [0, 1.2, 1],
        rotate: [0, 10, 0],
      }}
      transition={{
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      onAnimationComplete={onComplete}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-green-500 w-full h-full"
      >
        <motion.path
          d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        />
        <motion.path
          d="M22 4L12 14.01l-3-3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        />
      </svg>
    </motion.div>
  );
};

interface ErrorAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onComplete?: () => void;
}

export const ErrorAnimation: React.FC<ErrorAnimationProps> = ({
  size = 'md',
  className = "",
  onComplete,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      initial={{ scale: 0, rotate: 0 }}
      animate={{
        scale: [0, 1.1, 1],
        rotate: [0, -5, 5, 0],
      }}
      transition={{
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      onAnimationComplete={onComplete}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-500 w-full h-full"
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        />
        <motion.path
          d="m15 9-6 6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.4 }}
        />
        <motion.path
          d="m9 9 6 6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.5 }}
        />
      </svg>
    </motion.div>
  );
};

export default {
  AnimatedContainer,
  AnimatedButton,
  AnimatedList,
  PageTransition,
  LoadingAnimation,
  SuccessAnimation,
  ErrorAnimation,
  slideInVariants,
  fadeInVariants,
  scaleInVariants,
  staggerChildrenVariants,
  springVariants,
  buttonVariants,
  cardVariants,
};