import React, { forwardRef } from 'react';
import { cn } from '../../../utils/cn';
import { Card, CardHeader, CardBody } from '../modern/Card';
import { Progress, CircularProgress } from '../modern/Progress';

export interface PlayerAttribute {
  name: string;
  value: number;
  max?: number;
  category: 'physical' | 'technical' | 'mental' | 'goalkeeping';
  important?: boolean;
}

export interface PlayerStatsProps extends React.HTMLAttributes<HTMLDivElement> {
  player: {
    id: string;
    name: string;
    position: string;
    age: number;
    nationality?: string;
    jerseyNumber: number;
    photo?: string;
    overallRating: number;
    potential: number;
    marketValue?: number;
    contractUntil?: string;
    form: number;
    morale: number;
    fitness: number;
    attributes: PlayerAttribute[];
    stats?: {
      gamesPlayed: number;
      goals: number;
      assists: number;
      yellowCards: number;
      redCards: number;
      minutesPlayed: number;
    };
    performance?: {
      lastGames: number[];
      avgRating: number;
      bestPosition: string;
    };
  };
  variant?: 'full' | 'compact' | 'minimal';
  showComparison?: boolean;
  comparisonPlayer?: unknown;
  editable?: boolean;
  onAttributeChange?: (attributeName: string, newValue: number) => void;
}

const attributeCategories = {
  physical: {
    name: 'Physical',
    color: 'text-red-400',
    bgColor: 'bg-red-500',
    icon: '💪',
  },
  technical: {
    name: 'Technical',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500',
    icon: '⚽',
  },
  mental: {
    name: 'Mental',
    color: 'text-green-400',
    bgColor: 'bg-green-500',
    icon: '🧠',
  },
  goalkeeping: {
    name: 'Goalkeeping',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500',
    icon: '🥅',
  },
};

export const PlayerStats = forwardRef<HTMLDivElement, PlayerStatsProps>(
  (
    {
      className,
      player,
      variant = 'full',
      showComparison = false,
      comparisonPlayer,
      editable = false,
      onAttributeChange,
      ...props
    },
    ref,
  ) => {
    const groupedAttributes = player.attributes.reduce(
      (acc, attr) => {
        if (!acc[attr.category]) {
          acc[attr.category] = [];
        }
        acc[attr.category].push(attr);
        return acc;
      },
      {} as Record<string, PlayerAttribute[]>,
    );

    const getRatingColor = (rating: number) => {
      if (rating >= 85) {
        return 'text-green-400';
      }
      if (rating >= 75) {
        return 'text-blue-400';
      }
      if (rating >= 65) {
        return 'text-yellow-400';
      }
      if (rating >= 55) {
        return 'text-orange-400';
      }
      return 'text-red-400';
    };

    const getFormMoodText = (value: number) => {
      if (value >= 8) {
        return 'Excellent';
      }
      if (value >= 6) {
        return 'Good';
      }
      if (value >= 4) {
        return 'Average';
      }
      if (value >= 2) {
        return 'Poor';
      }
      return 'Very Poor';
    };

    const renderPlayerHeader = () => (
      <div className="flex items-center space-x-4 mb-6">
        {/* Player photo */}
        <div className="relative">
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.name}
              className="w-16 h-16 rounded-full border-2 border-secondary-600 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-secondary-700 border-2 border-secondary-600 flex items-center justify-center text-2xl font-bold text-white">
              {player.name
                .split(' ')
                .map(n => n[0])
                .join('')}
            </div>
          )}

          {/* Jersey number badge */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {player.jerseyNumber}
          </div>
        </div>

        {/* Player info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h2 className="text-xl font-bold text-white">{player.name}</h2>
            {player.nationality && (
              <img
                src={`https://flagcdn.com/w20/${player.nationality.toLowerCase()}.png`}
                alt={player.nationality}
                className="w-5 h-auto rounded-sm"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-secondary-400">
            <span>{player.position}</span>
            <span>Age {player.age}</span>
            {player.marketValue && (
              <span className="text-green-400">€{player.marketValue.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Overall rating */}
        <div className="text-center">
          <div className={cn('text-3xl font-bold', getRatingColor(player.overallRating))}>
            {player.overallRating}
          </div>
          <div className="text-xs text-secondary-400">OVR</div>
          {player.potential > player.overallRating && (
            <div className="text-sm text-primary-400 mt-1">{player.potential} POT</div>
          )}
        </div>
      </div>
    );

    const renderCurrentForm = () => (
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <CircularProgress
            value={player.form * 10}
            size={60}
            variant="success"
            showPercentage={false}
            className="mx-auto mb-2"
          />
          <div className="text-sm font-medium text-white">{getFormMoodText(player.form)}</div>
          <div className="text-xs text-secondary-400">Form</div>
        </div>

        <div className="text-center">
          <CircularProgress
            value={player.morale * 10}
            size={60}
            variant="warning"
            showPercentage={false}
            className="mx-auto mb-2"
          />
          <div className="text-sm font-medium text-white">{getFormMoodText(player.morale)}</div>
          <div className="text-xs text-secondary-400">Morale</div>
        </div>

        <div className="text-center">
          <CircularProgress
            value={player.fitness}
            size={60}
            variant="error"
            showPercentage={false}
            className="mx-auto mb-2"
          />
          <div className="text-sm font-medium text-white">{player.fitness}%</div>
          <div className="text-xs text-secondary-400">Fitness</div>
        </div>
      </div>
    );

    const renderAttributes = () => (
      <div className="space-y-6">
        {Object.entries(groupedAttributes).map(([category, attributes]) => {
          const categoryInfo = attributeCategories[category as keyof typeof attributeCategories];
          if (!categoryInfo) {
            return null;
          }

          return (
            <div key={category}>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">{categoryInfo.icon}</span>
                <h3 className={cn('font-semibold', categoryInfo.color)}>{categoryInfo.name}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attributes.map(attr => (
                  <div key={attr.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span
                        className={cn(
                          'text-sm',
                          attr.important ? 'font-medium text-white' : 'text-secondary-400',
                        )}
                      >
                        {attr.name}
                      </span>
                      <span className={cn('text-sm font-medium', getRatingColor(attr.value))}>
                        {attr.value}
                      </span>
                    </div>

                    <Progress
                      value={attr.value}
                      max={attr.max || 100}
                      size="sm"
                      variant={
                        category === 'physical'
                          ? 'error'
                          : category === 'technical'
                            ? 'default'
                            : category === 'mental'
                              ? 'success'
                              : 'warning'
                      }
                      className="h-1"
                    />

                    {editable && (
                      <input
                        type="range"
                        min="1"
                        max={attr.max || 100}
                        value={attr.value}
                        onChange={e => onAttributeChange?.(attr.name, parseInt(e.target.value))}
                        className="w-full h-1 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );

    const renderSeasonStats = () => {
      if (!player.stats) {
        return null;
      }

      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-secondary-800/50 rounded-lg">
            <div className="text-2xl font-bold text-white">{player.stats.gamesPlayed}</div>
            <div className="text-xs text-secondary-400">Games</div>
          </div>

          <div className="text-center p-3 bg-secondary-800/50 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{player.stats.goals}</div>
            <div className="text-xs text-secondary-400">Goals</div>
          </div>

          <div className="text-center p-3 bg-secondary-800/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{player.stats.assists}</div>
            <div className="text-xs text-secondary-400">Assists</div>
          </div>

          <div className="text-center p-3 bg-secondary-800/50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">{player.stats.yellowCards}</div>
            <div className="text-xs text-secondary-400">Yellow</div>
          </div>

          <div className="text-center p-3 bg-secondary-800/50 rounded-lg">
            <div className="text-2xl font-bold text-red-400">{player.stats.redCards}</div>
            <div className="text-xs text-secondary-400">Red</div>
          </div>

          <div className="text-center p-3 bg-secondary-800/50 rounded-lg">
            <div className="text-2xl font-bold text-white">
              {Math.round(player.stats.minutesPlayed / 90)}
            </div>
            <div className="text-xs text-secondary-400">Full Games</div>
          </div>
        </div>
      );
    };

    const renderPerformanceChart = () => {
      if (!player.performance?.lastGames) {
        return null;
      }

      const maxRating = 10;
      const chartHeight = 60;

      return (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Recent Performance</h3>
          <div className="flex items-end space-x-1 h-16 bg-secondary-800/30 rounded-lg p-2">
            {player.performance.lastGames.map((rating, index) => (
              <div
                key={index}
                className="flex-1 bg-primary-500 rounded-sm relative group"
                style={{
                  height: `${(rating / maxRating) * chartHeight}px`,
                  backgroundColor:
                    getRatingColor(rating * 10).replace('text-', 'rgb(var(--') + '))',
                }}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {rating.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-secondary-400">
            <span>Avg: {player.performance.avgRating.toFixed(1)}</span>
            <span>Best Position: {player.performance.bestPosition}</span>
          </div>
        </div>
      );
    };

    if (variant === 'minimal') {
      return (
        <Card ref={ref} className={cn('p-4', className)} {...props}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-secondary-700 flex items-center justify-center text-lg font-bold text-white">
              {player.name
                .split(' ')
                .map(n => n[0])
                .join('')}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{player.name}</h3>
              <div className="text-sm text-secondary-400">{player.position}</div>
            </div>
            <div className={cn('text-2xl font-bold', getRatingColor(player.overallRating))}>
              {player.overallRating}
            </div>
          </div>
        </Card>
      );
    }

    if (variant === 'compact') {
      return (
        <Card ref={ref} className={cn(className)} {...props}>
          <CardBody>
            {renderPlayerHeader()}
            {renderCurrentForm()}
            {renderSeasonStats()}
          </CardBody>
        </Card>
      );
    }

    // Full variant
    return (
      <div ref={ref} className={cn('space-y-6', className)} {...props}>
        <Card>
          <CardBody>
            {renderPlayerHeader()}
            {renderCurrentForm()}
          </CardBody>
        </Card>

        {player.stats && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-white">Season Statistics</h3>
            </CardHeader>
            <CardBody>{renderSeasonStats()}</CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">Attributes</h3>
          </CardHeader>
          <CardBody>{renderAttributes()}</CardBody>
        </Card>

        {player.performance && (
          <Card>
            <CardBody>{renderPerformanceChart()}</CardBody>
          </Card>
        )}
      </div>
    );
  },
);

PlayerStats.displayName = 'PlayerStats';
