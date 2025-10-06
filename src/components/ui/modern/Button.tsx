import React, { forwardRef } from 'react';
import { cn } from '../../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  as?: React.ElementType;
  to?: string;
}

const buttonVariants = {
  primary:
    'bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow-md border border-primary-500',
  secondary:
    'bg-secondary-600 hover:bg-secondary-700 text-white shadow-sm hover:shadow-md border border-secondary-600',
  ghost: 'text-secondary-400 hover:text-white hover:bg-secondary-600/50 border border-transparent',
  outline: 'text-primary-400 hover:text-white border border-primary-400 hover:bg-primary-500',
  success:
    'bg-success-500 hover:bg-success-600 text-white shadow-sm hover:shadow-md border border-success-500',
  warning:
    'bg-warning-500 hover:bg-warning-600 text-white shadow-sm hover:shadow-md border border-warning-500',
  error:
    'bg-error-500 hover:bg-error-600 text-white shadow-sm hover:shadow-md border border-error-500',
};

const buttonSizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

const LoadingSpinner: React.FC<{ size: ButtonProps['size'] }> = ({ size }) => {
  const spinnerSize = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }[size || 'md'];

  return (
    <svg className={cn('animate-spin', spinnerSize)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      as: Component = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <Component
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-secondary-900',
          'rounded-lg active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',

          // Variant styles
          buttonVariants[variant],

          // Size styles
          buttonSizes[size],

          // Full width
          fullWidth && 'w-full',

          // Loading state
          isLoading && 'cursor-wait',

          className
        )}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size={size} />
          </div>
        )}

        {/* Content */}
        <div className={cn('flex items-center justify-center gap-2', isLoading && 'opacity-0')}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </div>
      </Component>
    );
  }
);

Button.displayName = 'Button';

// Icon Button variant
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = 'md', ...props }, ref) => {
    const iconButtonSizes = {
      xs: 'p-1',
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
      xl: 'p-4',
    };

    return (
      <Button
        ref={ref}
        className={cn('!p-0', iconButtonSizes[size], className)}
        size={size}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Button Group component
export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
}) => {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        '[&>button:not(:first-child)]:border-l-0',
        orientation === 'horizontal'
          ? '[&>button:first-child]:rounded-r-none [&>button:last-child]:rounded-l-none [&>button:not(:first-child):not(:last-child)]:rounded-none'
          : '[&>button:first-child]:rounded-b-none [&>button:last-child]:rounded-t-none [&>button:not(:first-child):not(:last-child)]:rounded-none',
        className
      )}
    >
      {children}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';
