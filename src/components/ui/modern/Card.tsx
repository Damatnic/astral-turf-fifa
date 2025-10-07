import React, { forwardRef } from 'react';
import { cn } from '../../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const cardVariants = {
  default: 'bg-secondary-800/50 backdrop-blur-sm border border-secondary-700/50 shadow-soft',
  elevated: 'bg-secondary-800/80 backdrop-blur-md border border-secondary-700/60 shadow-medium',
  interactive:
    'bg-secondary-800/50 backdrop-blur-sm border border-secondary-700/50 shadow-soft hover:shadow-medium hover:border-secondary-600/60 transition-all duration-200 cursor-pointer',
  glass: 'bg-white/10 backdrop-blur-md border border-white/20',
};

const cardPadding = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const cardRounded = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-3xl',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', rounded = 'lg', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants[variant], cardPadding[padding], cardRounded[rounded], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

// Card Header component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding = 'md', children, ...props }, ref) => {
    const headerPadding = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn('border-b border-secondary-700/50', headerPadding[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

CardHeader.displayName = 'CardHeader';

// Card Body component
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, padding = 'md', children, ...props }, ref) => {
    const bodyPadding = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div ref={ref} className={cn(bodyPadding[padding], className)} {...props}>
        {children}
      </div>
    );
  },
);

CardBody.displayName = 'CardBody';

// Card Footer component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding = 'md', children, ...props }, ref) => {
    const footerPadding = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn('border-t border-secondary-700/50', footerPadding[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

CardFooter.displayName = 'CardFooter';

// Player Card specific component
export interface PlayerCardProps extends CardProps {
  player: {
    id: string;
    name: string;
    jerseyNumber: number;
    nationality?: string;
    position?: string;
    teamColor?: string;
    availability?: {
      status: 'Available' | 'Minor Injury' | 'Major Injury' | 'Suspended';
    };
    attributes?: Record<string, number>;
    morale?: string;
    form?: string;
  };
  isSelected?: boolean;
  isCaptain?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected = false,
  isCaptain = false,
  onSelect,
  onEdit,
  showActions = true,
  className,
  ...props
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-success-500';
      case 'Minor Injury':
        return 'bg-warning-500';
      case 'Major Injury':
        return 'bg-error-500';
      case 'Suspended':
        return 'bg-secondary-400';
      default:
        return 'bg-secondary-500';
    }
  };

  const overall = player.attributes
    ? Math.round(
        Object.values(player.attributes).reduce((a, b) => a + b, 0) /
          Object.keys(player.attributes).length,
      )
    : 0;

  return (
    <Card
      variant={isSelected ? 'elevated' : 'interactive'}
      className={cn(
        'relative group animate-fade-in-scale',
        isSelected && 'ring-2 ring-primary-500/50 bg-primary-900/20',
        className,
      )}
      onClick={onSelect}
      {...props}
    >
      {/* Captain indicator */}
      {isCaptain && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
          C
        </div>
      )}

      <CardBody padding="md">
        {/* Player Header */}
        <div className="flex items-center space-x-3 mb-3">
          {/* Jersey Number */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 border-black/20 shadow-sm"
            style={{ backgroundColor: player.teamColor || '#64748b' }}
          >
            {player.jerseyNumber}
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {player.nationality && (
                <img
                  src={`https://flagcdn.com/w20/${player.nationality.toLowerCase()}.png`}
                  srcSet={`https://flagcdn.com/w20/${player.nationality.toLowerCase()}.png 1x, https://flagcdn.com/w40/${player.nationality.toLowerCase()}.png 2x`}
                  alt={player.nationality}
                  className="w-4 h-auto rounded-sm"
                  loading="lazy"
                  decoding="async"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
              <h3 className="font-semibold text-sm text-white truncate">{player.name}</h3>
            </div>
            {player.position && (
              <p className="text-xs text-secondary-400 mt-0.5">{player.position}</p>
            )}
          </div>

          {/* Overall Rating */}
          {overall > 0 && (
            <div className="text-right">
              <div className="text-lg font-bold text-primary-400">{overall}</div>
              <div className="text-xs text-secondary-400">OVR</div>
            </div>
          )}
        </div>

        {/* Status and Stats */}
        <div className="flex items-center justify-between">
          {/* Availability Status */}
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                getStatusColor(player.availability?.status || ''),
              )}
            />
            <span className="text-xs text-secondary-400 capitalize">
              {player.availability?.status || 'Unknown'}
            </span>
          </div>

          {/* Form & Morale */}
          {(player.morale || player.form) && (
            <div className="flex items-center space-x-2 text-xs">
              {player.form && (
                <span className="text-secondary-400">
                  Form: <span className="text-white">{player.form}</span>
                </span>
              )}
              {player.morale && (
                <span className="text-secondary-400">
                  Morale: <span className="text-white">{player.morale}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-3 pt-3 border-t border-secondary-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex justify-end space-x-2">
              {onEdit && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="px-3 py-1 text-xs bg-secondary-600 hover:bg-secondary-500 text-white rounded-md transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
