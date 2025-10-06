import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

// Define our own HTMLMotionProps equivalent since it's not exported in v12+
type HTMLMotionProps<T extends keyof React.JSX.IntrinsicElements> = any;
import { useTheme } from '../../context/ThemeContext';

// Enhanced Button Component
interface EnhancedButtonProps extends Omit<HTMLMotionProps<'button'>, 'variants'> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  disabled,
  ...props
}) => {
  const { theme, tokens } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const scale = useMotionValue(1);
  const shadowScale = useTransform(scale, [1, 0.95], [1, 0.8]);

  const sizeStyles = {
    xs: {
      padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
      fontSize: tokens.typography.fontSizes.xs,
    },
    sm: {
      padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
      fontSize: tokens.typography.fontSizes.sm,
    },
    md: {
      padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
      fontSize: tokens.typography.fontSizes.sm,
    },
    lg: {
      padding: `${tokens.spacing[4]} ${tokens.spacing[6]}`,
      fontSize: tokens.typography.fontSizes.base,
    },
    xl: {
      padding: `${tokens.spacing[5]} ${tokens.spacing[8]}`,
      fontSize: tokens.typography.fontSizes.lg,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.accent.primary,
      color: theme.colors.text.inverse,
      border: 'none',
    },
    secondary: {
      backgroundColor: theme.colors.background.secondary,
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.border.primary}`,
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: theme.colors.accent.primary,
      border: `1px solid ${theme.colors.accent.primary}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.text.secondary,
      border: 'none',
    },
    danger: {
      backgroundColor: theme.colors.status.error,
      color: theme.colors.text.inverse,
      border: 'none',
    },
  };

  return (
    <motion.button
      {...props}
      disabled={disabled || loading}
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        borderRadius: tokens.borderRadius.lg,
        fontWeight: tokens.typography.fontWeights.medium,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.spacing[2],
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto',
        position: 'relative',
        overflow: 'hidden',
        ...props.style,
      }}
      whileHover={
        !disabled && !loading
          ? {
              scale: 1.02,
              boxShadow: tokens.shadows.lg,
            }
          : {}
      }
      whileTap={
        !disabled && !loading
          ? {
              scale: 0.98,
            }
          : {}
      }
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onTapCancel={() => setIsPressed(false)}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
    >
      {/* Ripple effect */}
      {isPressed && (
        <motion.div
          className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}

      {!loading && icon && iconPosition === 'left' && icon}
      {!loading && children}
      {!loading && icon && iconPosition === 'right' && icon}
    </motion.button>
  );
};

// Enhanced Card Component
interface EnhancedCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  children: React.ReactNode;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  variant = 'default',
  padding = 'md',
  interactive = false,
  children,
  ...props
}) => {
  const { theme, tokens } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const paddingStyles = {
    none: { padding: 0 },
    sm: { padding: tokens.spacing[3] },
    md: { padding: tokens.spacing[4] },
    lg: { padding: tokens.spacing[6] },
    xl: { padding: tokens.spacing[8] },
  };

  const variantStyles = {
    default: {
      backgroundColor: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.primary}`,
      boxShadow: tokens.shadows.sm,
    },
    elevated: {
      backgroundColor: theme.colors.background.primary,
      border: 'none',
      boxShadow: tokens.shadows.lg,
    },
    outlined: {
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.border.primary}`,
      boxShadow: 'none',
    },
    glass: {
      backgroundColor: (theme as any).isDark
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(255, 255, 255, 0.7)',
      border: `1px solid ${theme.colors.border.secondary}`,
      backdropFilter: 'blur(10px)',
      boxShadow: tokens.shadows.sm,
    },
  };

  return (
    <motion.div
      {...props}
      style={{
        ...paddingStyles[padding],
        ...variantStyles[variant],
        borderRadius: tokens.borderRadius.xl,
        transition: `all ${tokens.transitions.normal} ease-in-out`,
        cursor: interactive ? 'pointer' : 'default',
        ...props.style,
      }}
      whileHover={
        interactive
          ? {
              y: -2,
              boxShadow: tokens.shadows.xl,
              transition: { duration: 0.2 },
            }
          : {}
      }
      whileTap={
        interactive
          ? {
              scale: 0.98,
              transition: { duration: 0.1 },
            }
          : {}
      }
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {children}

      {/* Subtle glow effect on hover */}
      {interactive && isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${theme.colors.accent.primary} 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};

// Enhanced Input Component
interface EnhancedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled';
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  error,
  icon,
  iconPosition = 'left',
  size = 'md',
  variant = 'default',
  className = '',
  ...props
}) => {
  const { theme, tokens } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const sizeStyles = {
    sm: {
      padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
      fontSize: tokens.typography.fontSizes.sm,
    },
    md: {
      padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
      fontSize: tokens.typography.fontSizes.base,
    },
    lg: {
      padding: `${tokens.spacing[4]} ${tokens.spacing[5]}`,
      fontSize: tokens.typography.fontSizes.lg,
    },
  };

  const variantStyles = {
    default: {
      backgroundColor: theme.colors.background.primary,
      border: `1px solid ${error ? theme.colors.status.error : theme.colors.border.primary}`,
    },
    outlined: {
      backgroundColor: 'transparent',
      border: `2px solid ${error ? theme.colors.status.error : theme.colors.border.primary}`,
    },
    filled: {
      backgroundColor: theme.colors.background.tertiary,
      border: `1px solid transparent`,
    },
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <motion.label
          className="block text-sm font-medium mb-2"
          style={{ color: theme.colors.text.secondary }}
          initial={false}
          animate={{
            color: isFocused ? theme.colors.accent.primary : theme.colors.text.secondary,
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      )}

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div
            className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
            style={{ color: theme.colors.text.tertiary }}
          >
            {icon}
          </div>
        )}

        <motion.input
          {...(props as any)}
          style={{
            ...sizeStyles[size],
            ...variantStyles[variant],
            borderRadius: tokens.borderRadius.lg,
            color: theme.colors.text.primary,
            width: '100%',
            paddingLeft:
              icon && iconPosition === 'left'
                ? tokens.spacing[10]
                : sizeStyles[size].padding.split(' ')[1],
            paddingRight:
              icon && iconPosition === 'right'
                ? tokens.spacing[10]
                : sizeStyles[size].padding.split(' ')[1],
            outline: 'none',
            transition: `all ${tokens.transitions.normal} ease-in-out`,
          }}
          onFocus={e => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onChange={e => {
            setHasValue(e.target.value.length > 0);
            props.onChange?.(e);
          }}
          whileFocus={{
            borderColor: error ? theme.colors.status.error : theme.colors.accent.primary,
            boxShadow: `0 0 0 3px ${error ? theme.colors.status.error : theme.colors.accent.primary}20`,
          }}
        />

        {icon && iconPosition === 'right' && (
          <div
            className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
            style={{ color: theme.colors.text.tertiary }}
          >
            {icon}
          </div>
        )}
      </div>

      {error && (
        <motion.p
          className="mt-1 text-sm"
          style={{ color: theme.colors.status.error }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

// Enhanced Switch Component
interface EnhancedSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export const EnhancedSwitch: React.FC<EnhancedSwitchProps> = ({
  checked,
  onChange,
  label,
  size = 'md',
  disabled = false,
  color = 'primary',
}) => {
  const { theme, tokens } = useTheme();

  const sizeStyles = {
    sm: { width: '32px', height: '18px', thumbSize: '14px' },
    md: { width: '44px', height: '24px', thumbSize: '20px' },
    lg: { width: '56px', height: '32px', thumbSize: '28px' },
  };

  const colorStyles = {
    primary: theme.colors.accent.primary,
    success: theme.colors.status.success,
    warning: theme.colors.status.warning,
    error: theme.colors.status.error,
  };

  const { width, height, thumbSize } = sizeStyles[size];

  return (
    <div className="flex items-center gap-3">
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="relative focus:outline-none"
        style={{
          width,
          height,
          backgroundColor: checked ? colorStyles[color] : theme.colors.background.tertiary,
          borderRadius: tokens.borderRadius.full,
          border: `1px solid ${theme.colors.border.primary}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: `background-color ${tokens.transitions.normal} ease-in-out`,
        }}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 bg-white rounded-full shadow-md"
          style={{
            width: thumbSize,
            height: thumbSize,
          }}
          animate={{
            x: checked ? `calc(${width} - ${thumbSize} - 4px)` : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />

        {/* Focus ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 0 3px ${colorStyles[color]}20`,
          }}
          initial={{ opacity: 0 }}
          whileFocus={{ opacity: 1 }}
        />
      </motion.button>

      {label && (
        <label
          className="text-sm font-medium cursor-pointer"
          style={{
            color: theme.colors.text.primary,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  );
};

// Enhanced Tooltip Component
interface EnhancedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  arrow?: boolean;
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 500,
  arrow = true,
}) => {
  const { theme, tokens } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<unknown>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current as any);
    }
    setIsVisible(false);
  };

  const placementStyles = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: tokens.spacing[2],
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: tokens.spacing[2],
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: tokens.spacing[2],
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: tokens.spacing[2],
    },
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <motion.div
          className="absolute z-50 px-3 py-2 text-sm font-medium rounded-lg shadow-lg pointer-events-none"
          style={{
            ...placementStyles[placement],
            backgroundColor: theme.colors.background.tertiary,
            color: theme.colors.text.primary,
            border: `1px solid ${theme.colors.border.primary}`,
            maxWidth: '200px',
            zIndex: tokens.zIndex.tooltip,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {content}

          {/* Arrow */}
          {arrow && (
            <div
              className="absolute w-2 h-2 transform rotate-45"
              style={{
                backgroundColor: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.primary}`,
                ...{
                  top: placement === 'bottom' ? '-4px' : placement === 'top' ? 'auto' : '50%',
                  bottom: placement === 'top' ? '-4px' : 'auto',
                  left: placement === 'right' ? '-4px' : placement === 'left' ? 'auto' : '50%',
                  right: placement === 'left' ? '-4px' : 'auto',
                  transform:
                    placement === 'left' || placement === 'right'
                      ? 'translateY(-50%) rotate(45deg)'
                      : 'translateX(-50%) rotate(45deg)',
                },
              }}
            />
          )}
        </motion.div>
      )}
    </div>
  );
};

export default {
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
  EnhancedSwitch,
  EnhancedTooltip,
};
