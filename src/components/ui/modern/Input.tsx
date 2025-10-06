import React, { forwardRef, useState } from 'react';
import { cn } from '../../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const inputVariants = {
  default:
    'bg-secondary-800/50 border border-secondary-700/50 focus:border-primary-500 focus:bg-secondary-800/70',
  filled:
    'bg-secondary-700/70 border border-transparent focus:border-primary-500 focus:bg-secondary-700',
  outline: 'bg-transparent border border-secondary-600 focus:border-primary-500',
};

const inputSizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      size = 'md',
      fullWidth = false,
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium transition-colors',
              error ? 'text-error-400' : 'text-secondary-300'
            )}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base styles
              'w-full rounded-lg backdrop-blur-sm transition-all duration-200',
              'text-white placeholder-secondary-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',

              // Variant styles
              inputVariants[variant],

              // Size styles
              inputSizes[size],

              // Icon spacing
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',

              // Error state
              error && 'border-error-500 focus:border-error-500 focus:ring-error-500/50',

              className
            )}
            onFocus={e => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={e => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Helper Text / Error Message */}
        {(error || helperText) && (
          <p className={cn('text-xs', error ? 'text-error-400' : 'text-secondary-400')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outline';
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      variant = 'default',
      fullWidth = false,
      resize = 'vertical',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium transition-colors',
              error ? 'text-error-400' : 'text-secondary-300'
            )}
          >
            {label}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            // Base styles
            'w-full rounded-lg backdrop-blur-sm transition-all duration-200',
            'text-white placeholder-secondary-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'px-4 py-2.5 text-sm min-h-[80px]',

            // Variant styles
            inputVariants[variant],

            // Resize
            resizeClasses[resize],

            // Error state
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500/50',

            className
          )}
          {...props}
        />

        {/* Helper Text / Error Message */}
        {(error || helperText) && (
          <p className={cn('text-xs', error ? 'text-error-400' : 'text-secondary-400')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Search Input component
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { onClear, showClearButton = true, value, onChange, placeholder = 'Search...', ...props },
    ref
  ) => {
    const handleClear = () => {
      onClear?.();
      if (onChange) {
        onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const SearchIcon = () => (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    );

    const ClearIcon = () => (
      <button
        type="button"
        onClick={handleClear}
        className="p-0.5 rounded-full hover:bg-secondary-600/50 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    );

    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        leftIcon={<SearchIcon />}
        rightIcon={showClearButton && value ? <ClearIcon /> : undefined}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
