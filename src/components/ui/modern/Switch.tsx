import React, { forwardRef } from 'react';
import { cn } from '../../../utils/cn';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  error?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  labelPosition?: 'left' | 'right';
  disabled?: boolean;
}

const switchSizes = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    translate: 'translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
  },
};

const switchVariants = {
  default: {
    track: 'bg-secondary-700 peer-checked:bg-primary-600',
    thumb: 'bg-white',
    focus: 'peer-focus:ring-primary-600/25',
  },
  success: {
    track: 'bg-secondary-700 peer-checked:bg-success-600',
    thumb: 'bg-white',
    focus: 'peer-focus:ring-success-600/25',
  },
  warning: {
    track: 'bg-secondary-700 peer-checked:bg-warning-600',
    thumb: 'bg-white',
    focus: 'peer-focus:ring-warning-600/25',
  },
  error: {
    track: 'bg-secondary-700 peer-checked:bg-error-600',
    thumb: 'bg-white',
    focus: 'peer-focus:ring-error-600/25',
  },
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      size = 'md',
      label,
      description,
      error,
      variant = 'default',
      labelPosition = 'right',
      disabled = false,
      id,
      ...props
    },
    ref,
  ) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
    const sizeConfig = switchSizes[size];
    const variantConfig = switchVariants[variant];

    const content = (
      <div className={cn('relative inline-flex items-center', className)}>
        <input
          type="checkbox"
          id={switchId}
          ref={ref}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <label
          htmlFor={switchId}
          className={cn(
            'relative inline-flex cursor-pointer items-center',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <div
            className={cn(
              'relative rounded-full transition-colors duration-200',
              'peer-focus:ring-4 peer-focus:ring-offset-2 peer-focus:ring-offset-secondary-900',
              sizeConfig.track,
              variantConfig.track,
              variantConfig.focus,
              disabled && 'cursor-not-allowed',
            )}
          >
            <div
              className={cn(
                'absolute left-0.5 top-0.5 rounded-full shadow-md transition-transform duration-200',
                'peer-checked:translate-x-full rtl:peer-checked:-translate-x-full',
                sizeConfig.thumb,
                variantConfig.thumb,
              )}
            />
          </div>
        </label>
      </div>
    );

    if (!label && !description && !error) {
      return content;
    }

    return (
      <div className="space-y-2">
        <div
          className={cn(
            'flex items-center gap-3',
            labelPosition === 'left' && 'flex-row-reverse justify-end',
          )}
        >
          {content}
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                'text-sm font-medium text-white cursor-pointer',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {label}
            </label>
          )}
        </div>
        {description && <p className="text-sm text-secondary-400 ml-0">{description}</p>}
        {error && <p className="text-sm text-error-400 ml-0">{error}</p>}
      </div>
    );
  },
);

Switch.displayName = 'Switch';
