/**
 * Adaptive Layout Components
 * Provides responsive containers, grids, and layout utilities for mobile-first design
 */

import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

/**
 * ResponsiveContainer - Max-width container with responsive padding
 */
export interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  noPadding?: boolean;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  noPadding = false,
  className = '',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const paddingClass = noPadding ? '' : 'px-4 sm:px-6 md:px-8';

  return (
    <div className={`w-full mx-auto ${maxWidthClasses[maxWidth]} ${paddingClass} ${className}`}>
      {children}
    </div>
  );
};

/**
 * ResponsiveGrid - Grid that adapts columns based on breakpoints
 */
export interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = '',
}) => {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const gridCols = `grid-cols-${cols.mobile || 1} md:grid-cols-${cols.tablet || 2} lg:grid-cols-${cols.desktop || 3}`;

  return <div className={`grid ${gridCols} ${gapClasses[gap]} ${className}`}>{children}</div>;
};

/**
 * ResponsiveModal - Modal that becomes full-screen on mobile
 */
export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  className = '',
}) => {
  const { isMobile } = useResponsive();

  if (!isOpen) {
    return null;
  }

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const modalClass = isMobile
    ? 'fixed inset-0 w-full h-full rounded-none'
    : `relative ${maxWidthClasses[maxWidth]} rounded-lg`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className={`${modalClass} bg-gray-800 z-10 flex flex-col max-h-full ${className}`}>
        {/* Header */}
        {title && (
          <div className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl md:text-2xl font-bold text-teal-400">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
};

/**
 * TouchButton - Button optimized for touch with larger hit targets
 */
export interface TouchButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}) => {
  const variantClasses = {
    primary: 'bg-teal-500 hover:bg-teal-600 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white',
    ghost: 'text-teal-500 hover:bg-teal-500/10',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        rounded-lg font-semibold transition-all duration-200
        active:scale-95 touch-none select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
};

/**
 * TouchInput - Input field optimized for mobile touch
 */
export interface TouchInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
}

export const TouchInput: React.FC<TouchInputProps> = ({
  label,
  error,
  helperText,
  className = '',
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  name,
  id,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full px-4 py-3 min-h-[44px]
          bg-gray-700 border-2 border-gray-600
          rounded-lg text-white placeholder-gray-400
          focus:outline-none focus:border-teal-500
          transition-colors
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-400">{helperText}</p>}
    </div>
  );
};

/**
 * ResponsiveStack - Vertical or horizontal stack that adapts to screen size
 */
export interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: {
    mobile?: 'vertical' | 'horizontal';
    desktop?: 'vertical' | 'horizontal';
  };
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = { mobile: 'vertical', desktop: 'horizontal' },
  gap = 'md',
  align = 'start',
  className = '',
}) => {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const mobileDirection = direction.mobile === 'horizontal' ? 'flex-row' : 'flex-col';
  const desktopDirection = direction.desktop === 'horizontal' ? 'md:flex-row' : 'md:flex-col';

  return (
    <div
      className={`flex ${mobileDirection} ${desktopDirection} ${gapClasses[gap]} ${alignClasses[align]} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveCard - Card component with touch-optimized padding
 */
export interface ResponsiveCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  onClick,
  className = '',
  padding = 'md',
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };

  const clickableClass = onClick
    ? 'cursor-pointer hover:bg-gray-700/80 active:scale-[0.98] transition-all'
    : '';

  return (
    <div
      className={`
        bg-gray-700/50 rounded-lg border border-gray-600
        ${paddingClasses[padding]}
        ${clickableClass}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveSpacer - Adds responsive spacing between elements
 */
export interface ResponsiveSpacerProps {
  size?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export const ResponsiveSpacer: React.FC<ResponsiveSpacerProps> = ({
  size = { mobile: 4, tablet: 6, desktop: 8 },
}) => {
  return <div className={`h-${size.mobile} md:h-${size.tablet} lg:h-${size.desktop}`} />;
};
