import React from 'react';
import { cn } from '../../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
  rounded?: boolean;
}

const badgeVariants = {
  default: 'bg-secondary-600 text-secondary-100',
  primary: 'bg-primary-500 text-white',
  secondary: 'bg-secondary-500 text-white',
  success: 'bg-success-500 text-white',
  warning: 'bg-warning-500 text-warning-900',
  error: 'bg-error-500 text-white',
  outline: 'border border-secondary-400 text-secondary-300 bg-transparent',
};

const badgeSizes = {
  xs: 'px-1.5 py-0.5 text-xs',
  sm: 'px-2 py-1 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-sm',
};

const dotSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'sm',
  dot = false,
  rounded = false,
  children,
  ...props
}) => {
  if (dot) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          badgeVariants[variant],
          dotSizes[size],
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium',
        rounded ? 'rounded-full' : 'rounded-md',
        badgeVariants[variant],
        badgeSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// Status Badge component for player availability
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'Available' | 'Minor Injury' | 'Major Injury' | 'Suspended' | 'Unavailable';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const getVariant = (status: string) => {
    switch (status) {
      case 'Available':
        return 'success';
      case 'Minor Injury':
        return 'warning';
      case 'Major Injury':
      case 'Suspended':
        return 'error';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant(status)} {...props}>
      {status}
    </Badge>
  );
};

// Morale Badge component
export interface MoraleBadgeProps extends Omit<BadgeProps, 'variant'> {
  morale: 'Excellent' | 'Good' | 'Okay' | 'Poor' | 'Terrible';
}

export const MoraleBadge: React.FC<MoraleBadgeProps> = ({ morale, ...props }) => {
  const getVariant = (morale: string) => {
    switch (morale) {
      case 'Excellent':
        return 'success';
      case 'Good':
        return 'primary';
      case 'Okay':
        return 'default';
      case 'Poor':
        return 'warning';
      case 'Terrible':
        return 'error';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant(morale)} {...props}>
      {morale}
    </Badge>
  );
};

// Position Badge component
export interface PositionBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  position: 'GK' | 'DF' | 'MF' | 'FW';
}

export const PositionBadge: React.FC<PositionBadgeProps> = ({ position, ...props }) => {
  const getVariant = (position: string) => {
    switch (position) {
      case 'GK':
        return 'warning';
      case 'DF':
        return 'primary';
      case 'MF':
        return 'success';
      case 'FW':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getVariant(position)} size="xs" rounded {...props}>
      {position}
    </Badge>
  );
};

// Notification Badge component
export interface NotificationBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number;
  max?: number;
  showZero?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  showZero = false,
  ...props
}) => {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge variant="error" size="xs" rounded {...props}>
      {displayCount}
    </Badge>
  );
};
