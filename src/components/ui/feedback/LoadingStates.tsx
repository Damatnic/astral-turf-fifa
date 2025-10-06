import React, { forwardRef } from 'react';
import { cn } from '../../../utils/cn';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bars' | 'football';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const spinnerSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const spinnerColors = {
  primary: 'text-primary-500',
  secondary: 'text-secondary-500',
  success: 'text-success-500',
  warning: 'text-warning-500',
  error: 'text-error-500',
};

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 'md', variant = 'default', color = 'primary', ...props }, ref) => {
    const sizeClass = spinnerSizes[size];
    const colorClass = spinnerColors[color];

    if (variant === 'dots') {
      return (
        <div
          ref={ref}
          className={cn('flex space-x-1 items-center justify-center', className)}
          {...props}
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={cn(
                'rounded-full animate-pulse',
                sizeClass.replace('w-', 'w-').replace('h-', 'h-'),
                colorClass.replace('text-', 'bg-')
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.4s',
              }}
            />
          ))}
        </div>
      );
    }

    if (variant === 'pulse') {
      return (
        <div
          ref={ref}
          className={cn(
            'rounded-full animate-pulse',
            sizeClass,
            colorClass.replace('text-', 'bg-'),
            className
          )}
          {...props}
        />
      );
    }

    if (variant === 'bars') {
      return (
        <div
          ref={ref}
          className={cn('flex space-x-1 items-end justify-center', className)}
          {...props}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={cn(
                'animate-pulse',
                colorClass.replace('text-', 'bg-'),
                size === 'xs'
                  ? 'w-0.5 h-2'
                  : size === 'sm'
                    ? 'w-0.5 h-3'
                    : size === 'md'
                      ? 'w-1 h-4'
                      : size === 'lg'
                        ? 'w-1 h-6'
                        : 'w-1.5 h-8'
              )}
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      );
    }

    if (variant === 'football') {
      return (
        <div ref={ref} className={cn('relative', sizeClass, className)} {...props}>
          <div
            className={cn(
              'absolute inset-0 rounded-full border-4 border-white animate-spin',
              'bg-gradient-to-r from-green-400 to-green-600'
            )}
          >
            <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
              <div className="text-black text-xs font-bold">⚽</div>
            </div>
          </div>
        </div>
      );
    }

    // Default spinner
    return (
      <div ref={ref} className={cn('animate-spin', sizeClass, colorClass, className)} {...props}>
        <svg fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

// Skeleton Loading Components
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animated?: boolean;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, animated = true, ...props }, ref) => {
    const baseClasses = cn(
      'bg-gradient-to-r from-secondary-700/50 via-secondary-600/50 to-secondary-700/50',
      animated && 'skeleton',
      {
        'h-4': variant === 'text' && !height,
        'rounded-full': variant === 'circular',
        'rounded-lg': variant === 'rounded',
        'rounded-none': variant === 'rectangular',
      },
      className
    );

    return (
      <div
        ref={ref}
        className={baseClasses}
        style={{
          width: width || (variant === 'circular' ? height : '100%'),
          height: height || (variant === 'text' ? '1rem' : '4rem'),
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Loading Overlay Component
export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  visible: boolean;
  message?: string;
  spinner?: React.ReactNode;
  backdrop?: boolean;
  blur?: boolean;
}

export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  (
    {
      className,
      visible,
      message = 'Loading...',
      spinner,
      backdrop = true,
      blur = true,
      children,
      ...props
    },
    ref
  ) => {
    if (!visible) {
      return <>{children}</>;
    }

    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        {children}

        {/* Loading overlay */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center z-50',
            backdrop && 'bg-black/50',
            blur && 'backdrop-blur-sm',
            'animate-fade-in'
          )}
        >
          <div className="flex flex-col items-center space-y-4">
            {spinner || <LoadingSpinner size="lg" variant="football" />}
            {message && <div className="text-white font-medium text-center px-4">{message}</div>}
          </div>
        </div>
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

// Page Loading Component
export interface PageLoadingProps {
  message?: string;
  progress?: number;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Loading Astral Turf...',
  progress,
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-secondary-900 to-secondary-950 flex flex-col items-center justify-center z-50">
      {/* Logo/Brand */}
      <div className="mb-8 text-center">
        <div className="text-4xl font-bold text-white mb-2">⚽ Astral Turf</div>
        <div className="text-secondary-400">Football Management Excellence</div>
      </div>

      {/* Loading animation */}
      <div className="mb-6">
        <LoadingSpinner size="xl" variant="football" />
      </div>

      {/* Message */}
      <div className="text-white font-medium mb-4 text-center max-w-md">{message}</div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-64 h-2 bg-secondary-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {/* Loading dots */}
      <div className="mt-8">
        <LoadingSpinner variant="dots" color="primary" />
      </div>
    </div>
  );
};

// Content Placeholder Components
export interface ContentPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'player-card' | 'match-stats' | 'formation' | 'chart' | 'table';
  count?: number;
}

export const ContentPlaceholder = forwardRef<HTMLDivElement, ContentPlaceholderProps>(
  ({ className, type = 'player-card', count = 1, ...props }, ref) => {
    const renderPlayerCard = () => (
      <div className="p-4 bg-secondary-800/50 rounded-lg space-y-3">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" height="3rem" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
          <Skeleton variant="text" width="2rem" height="2rem" />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
    );

    const renderMatchStats = () => (
      <div className="p-4 bg-secondary-800/50 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width="30%" height="1.5rem" />
          <Skeleton variant="text" width="20%" height="1.5rem" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="text-center space-y-2">
              <Skeleton variant="text" width="100%" height="2rem" />
              <Skeleton variant="text" width="60%" />
            </div>
          ))}
        </div>
      </div>
    );

    const renderFormation = () => (
      <div className="p-4 bg-secondary-800/50 rounded-lg space-y-4">
        <Skeleton variant="text" width="40%" height="1.5rem" />
        <Skeleton variant="rectangular" height="200px" className="rounded-lg" />
        <div className="flex justify-between">
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="25%" />
        </div>
      </div>
    );

    const renderChart = () => (
      <div className="p-4 bg-secondary-800/50 rounded-lg space-y-4">
        <Skeleton variant="text" width="50%" height="1.5rem" />
        <Skeleton variant="rectangular" height="250px" className="rounded-lg" />
        <div className="flex justify-between">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="text" width="20%" />
          ))}
        </div>
      </div>
    );

    const renderTable = () => (
      <div className="bg-secondary-800/50 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-secondary-700/50">
          <Skeleton variant="text" width="40%" height="1.5rem" />
        </div>
        <div className="divide-y divide-secondary-700/50">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 flex items-center space-x-4">
              <Skeleton variant="circular" height="2rem" />
              <div className="flex-1 space-y-1">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </div>
              <Skeleton variant="text" width="20%" />
              <Skeleton variant="text" width="15%" />
            </div>
          ))}
        </div>
      </div>
    );

    const renderPlaceholder = () => {
      switch (type) {
        case 'player-card':
          return renderPlayerCard();
        case 'match-stats':
          return renderMatchStats();
        case 'formation':
          return renderFormation();
        case 'chart':
          return renderChart();
        case 'table':
          return renderTable();
        default:
          return renderPlayerCard();
      }
    };

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="animate-pulse">
            {renderPlaceholder()}
          </div>
        ))}
      </div>
    );
  }
);

ContentPlaceholder.displayName = 'ContentPlaceholder';
