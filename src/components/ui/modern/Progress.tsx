import React, { forwardRef } from 'react';
import { cn } from '../../../utils/cn';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  showLabel?: boolean;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  striped?: boolean;
  indeterminate?: boolean;
}

const progressSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const progressVariants = {
  default: 'bg-primary-600',
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  error: 'bg-error-600',
  accent: 'bg-accent-600',
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 'md',
      variant = 'default',
      showLabel = false,
      label,
      showPercentage = false,
      animated = false,
      striped = false,
      indeterminate = false,
      ...props
    },
    ref,
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className={cn('w-full', className)} {...props}>
        {/* Label and percentage */}
        {(showLabel || showPercentage) && (
          <div className="flex justify-between items-center mb-2">
            {showLabel && (
              <span className="text-sm font-medium text-white">{label || `Progress`}</span>
            )}
            {showPercentage && (
              <span className="text-sm text-secondary-400">{Math.round(percentage)}%</span>
            )}
          </div>
        )}

        {/* Progress bar container */}
        <div
          ref={ref}
          className={cn(
            'w-full bg-secondary-700/50 rounded-full overflow-hidden',
            progressSizes[size],
          )}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        >
          {/* Progress bar fill */}
          <div
            className={cn(
              'h-full transition-all duration-300 ease-out rounded-full',
              progressVariants[variant],
              striped && 'bg-stripes bg-stripes-animate',
              animated && 'transition-all duration-500 ease-in-out',
              indeterminate && 'animate-progress-indeterminate',
            )}
            style={{
              width: indeterminate ? '100%' : `${percentage}%`,
              transform: indeterminate ? 'translateX(-100%)' : 'none',
            }}
          />
        </div>
      </div>
    );
  },
);

Progress.displayName = 'Progress';

// Circular Progress Component
export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  showLabel?: boolean;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  indeterminate?: boolean;
}

export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 80,
      strokeWidth = 6,
      variant = 'default',
      showLabel = false,
      label,
      showPercentage = true,
      animated = true,
      indeterminate = false,
      ...props
    },
    ref,
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = indeterminate ? 0 : circumference - (percentage / 100) * circumference;

    const variantColors = {
      default: 'stroke-primary-600',
      success: 'stroke-success-600',
      warning: 'stroke-warning-600',
      error: 'stroke-error-600',
      accent: 'stroke-accent-600',
    };

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        {...props}
      >
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-secondary-700/50"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              variantColors[variant],
              animated && 'transition-all duration-300 ease-out',
              indeterminate && 'animate-spin',
            )}
            style={{
              strokeDasharray: indeterminate
                ? `${circumference * 0.25} ${circumference}`
                : strokeDasharray,
            }}
          />
        </svg>

        {/* Center content */}
        {(showLabel || showPercentage) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {showPercentage && (
              <span className="text-sm font-semibold text-white">{Math.round(percentage)}%</span>
            )}
            {showLabel && <span className="text-xs text-secondary-400 mt-0.5">{label}</span>}
          </div>
        )}
      </div>
    );
  },
);

CircularProgress.displayName = 'CircularProgress';

// Step Progress Component
export interface StepProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Array<{
    label: string;
    description?: string;
    status: 'completed' | 'current' | 'pending' | 'error';
  }>;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export const StepProgress = forwardRef<HTMLDivElement, StepProgressProps>(
  ({ className, steps, orientation = 'horizontal', size = 'md', ...props }, ref) => {
    const stepSizes = {
      sm: {
        icon: 'w-6 h-6',
        text: 'text-xs',
        spacing: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
      },
      md: {
        icon: 'w-8 h-8',
        text: 'text-sm',
        spacing: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
      },
      lg: {
        icon: 'w-10 h-10',
        text: 'text-base',
        spacing: orientation === 'horizontal' ? 'space-x-8' : 'space-y-8',
      },
    };

    const getStepIcon = (status: string, index: number) => {
      switch (status) {
        case 'completed':
          return (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          );
        case 'error':
          return (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          );
        default:
          return <span className="text-sm font-medium text-white">{index + 1}</span>;
      }
    };

    const getStepClasses = (status: string) => {
      switch (status) {
        case 'completed':
          return 'bg-success-600 border-success-600';
        case 'current':
          return 'bg-primary-600 border-primary-600';
        case 'error':
          return 'bg-error-600 border-error-600';
        default:
          return 'bg-secondary-700 border-secondary-600';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
          stepSizes[size].spacing,
          className,
        )}
        {...props}
      >
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center',
              orientation === 'horizontal' ? 'flex-col' : 'flex-row',
            )}
          >
            {/* Step icon */}
            <div
              className={cn(
                'flex items-center justify-center rounded-full border-2',
                stepSizes[size].icon,
                getStepClasses(step.status),
              )}
            >
              {getStepIcon(step.status, index)}
            </div>

            {/* Step content */}
            <div
              className={cn(
                'text-center',
                orientation === 'horizontal' ? 'mt-2' : 'ml-3 text-left',
              )}
            >
              <div
                className={cn(
                  'font-medium',
                  stepSizes[size].text,
                  step.status === 'current'
                    ? 'text-primary-400'
                    : step.status === 'completed'
                      ? 'text-success-400'
                      : step.status === 'error'
                        ? 'text-error-400'
                        : 'text-secondary-400',
                )}
              >
                {step.label}
              </div>
              {step.description && (
                <div className="text-xs text-secondary-500 mt-1">{step.description}</div>
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'bg-secondary-700',
                  orientation === 'horizontal' ? 'w-full h-0.5 mx-4' : 'h-full w-0.5 my-4 ml-4',
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  },
);

StepProgress.displayName = 'StepProgress';
