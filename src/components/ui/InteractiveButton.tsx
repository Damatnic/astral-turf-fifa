import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { buttonVariants, iconButtonVariants } from '../../utils/animationVariants';

interface InteractiveButtonProps extends Omit<HTMLMotionProps<'button'>, 'variants'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  hapticFeedback?: boolean;
  children: React.ReactNode;
}

/**
 * InteractiveButton - Enhanced button with micro-interactions
 *
 * Features:
 * - Framer Motion animations (scale, shadow on hover/tap)
 * - Haptic feedback simulation (visual pulse)
 * - Loading states with spinner
 * - Multiple variants and sizes
 * - Disabled state handling
 */
export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  hapticFeedback = true,
  disabled,
  onClick,
  children,
  className = '',
  ...props
}) => {
  // Handle click with haptic feedback
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) {
      return;
    }

    // Simulate haptic feedback with visual pulse
    if (hapticFeedback) {
      const button = e.currentTarget;
      button.classList.add('haptic-pulse');
      setTimeout(() => button.classList.remove('haptic-pulse'), 100);
    }

    onClick?.(e);
  };

  // Base styles
  const baseStyles =
    'relative font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Variant styles
  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-400',
    icon: 'bg-transparent hover:bg-gray-100 text-gray-600 p-2 rounded-full focus:ring-gray-400',
  };

  // Size styles
  const sizeStyles = {
    sm: variant === 'icon' ? 'w-8 h-8' : 'px-3 py-1.5 text-sm',
    md: variant === 'icon' ? 'w-10 h-10' : 'px-4 py-2 text-base',
    lg: variant === 'icon' ? 'w-12 h-12' : 'px-6 py-3 text-lg',
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <motion.button
      variants={variant === 'icon' ? iconButtonVariants : buttonVariants}
      initial="idle"
      whileHover={disabled || isLoading ? undefined : 'hover'}
      whileTap={disabled || isLoading ? undefined : 'tap'}
      animate={disabled ? 'disabled' : 'idle'}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={combinedClassName}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <motion.div
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default InteractiveButton;
