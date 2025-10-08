import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useUIContext, useTacticsContext } from '../../hooks';
import { useTacticsBoard } from '../../hooks/useTacticsBoard';
import type { Player } from '../../types';
import { PLAYER_ROLES } from '../../constants';

interface UltraModernPlayerTokenProps {
  player: Player;
  isSelected: boolean;
  isHighlightedByAI: boolean;
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  showRole?: boolean;
  interactive?: boolean;
  isDragging?: boolean;
}

// Modern availability indicator with animations
const ModernAvailabilityIndicator: React.FC<{
  availability: Player['availability'];
  size: 'small' | 'medium' | 'large';
}> = React.memo(({ availability, size }) => {
  const indicators = {
    available: {
      color: 'rgb(16, 185, 129)',
      bgColor: 'rgba(16, 185, 129, 0.2)',
      icon: '✓',
      tooltip: 'Available',
      pulseColor: 'rgba(16, 185, 129, 0.6)',
    },
    injured: {
      color: 'rgb(239, 68, 68)',
      bgColor: 'rgba(239, 68, 68, 0.2)',
      icon: '🏥',
      tooltip: 'Injured',
      pulseColor: 'rgba(239, 68, 68, 0.6)',
    },
    suspended: {
      color: 'rgb(245, 158, 11)',
      bgColor: 'rgba(245, 158, 11, 0.2)',
      icon: '⚠️',
      tooltip: 'Suspended',
      pulseColor: 'rgba(245, 158, 11, 0.6)',
    },
    rested: {
      color: 'rgb(107, 114, 128)',
      bgColor: 'rgba(107, 114, 128, 0.2)',
      icon: '😴',
      tooltip: 'Rested',
      pulseColor: 'rgba(107, 114, 128, 0.6)',
    },
    international: {
      color: 'rgb(59, 130, 246)',
      bgColor: 'rgba(59, 130, 246, 0.2)',
      icon: '🌍',
      tooltip: 'International Duty',
      pulseColor: 'rgba(59, 130, 246, 0.6)',
    },
  };

  const safeAvailability = availability || 'available';
  const availabilityKey = typeof safeAvailability === 'string' ? safeAvailability : 'available';
  const indicator = indicators[availabilityKey as keyof typeof indicators] || indicators.available;
  const sizeClasses = {
    small: 'w-3 h-3 text-[8px]',
    medium: 'w-4 h-4 text-[10px]',
    large: 'w-5 h-5 text-xs',
  };

  if (availabilityKey === 'available') {
    return null;
  }

  return (
    <div className="absolute -top-1 -right-1 z-10">
      {/* Pulse animation for non-available players */}
      <div
        className={`absolute inset-0 rounded-full animate-ping ${sizeClasses[size]}`}
        style={{
          backgroundColor: indicator.pulseColor,
        }}
      />
      <div
        className={`relative rounded-full border border-white/70 flex items-center justify-center ${sizeClasses[size]} `}
        style={{
          backgroundColor: indicator.bgColor,
          borderColor: indicator.color,
          boxShadow: `0 0 10px ${indicator.pulseColor}`,
        }}
        title={indicator.tooltip}
      >
        <span style={{ color: indicator.color }}>{indicator.icon}</span>
      </div>
    </div>
  );
});

// Advanced player stats overlay with modern design
const ModernPlayerStatsOverlay: React.FC<{
  player: Player;
  isVisible: boolean;
  position: { x: number; y: number };
}> = React.memo(({ player, isVisible, position }) => {
  if (!isVisible) {
    return null;
  }

  const stats = {
    overall: player.overallRating || 75,
    pace: player.stats?.pace || 70,
    shooting: player.stats?.shooting || 70,
    passing: player.stats?.passing || 70,
    defending: player.stats?.defending || 70,
    physical: player.stats?.physical || 70,
  };

  const getStatColor = (value: number) => {
    if (value >= 85) {
      return 'rgb(16, 185, 129)';
    } // Green
    if (value >= 75) {
      return 'rgb(245, 158, 11)';
    } // Yellow
    if (value >= 65) {
      return 'rgb(249, 115, 22)';
    } // Orange
    return 'rgb(239, 68, 68)'; // Red
  };

  return (
    <div
      className="fixed z-50 pointer-events-none transition-all duration-200"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div
        className="bg-gray-900/95  rounded-xl p-4 border border-gray-700/50 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Player header */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-slate-600"
              style={{
                background: `linear-gradient(135deg, ${getStatColor(stats.overall)}, ${getStatColor(stats.overall)}dd)`,
                boxShadow: `0 0 20px ${getStatColor(stats.overall)}44`,
              }}
            >
              {player.name
                ?.split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2) || '??'}
            </div>
            <div
              className="absolute -bottom-1 -right-1 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded-full border"
              style={{ borderColor: getStatColor(stats.overall) }}
            >
              {stats.overall}
            </div>
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              {player.name || 'Unknown Player'}
            </div>
            <div className="text-gray-400 text-xs">
              {PLAYER_ROLES.find(r => r.id === player.roleId)?.name || 'Unknown Position'}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(stats)
            .filter(([key]) => key !== 'overall')
            .map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-300 text-xs capitalize">{key}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${value}%`,
                        backgroundColor: getStatColor(value),
                        boxShadow: `0 0 4px ${getStatColor(value)}`,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium w-6 text-right"
                    style={{ color: getStatColor(value) }}
                  >
                    {value}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Form indicator */}
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Current Form</span>
            <div className="flex space-x-1">
              {Array.from({ length: 5 }, (_, i) => {
                const formValue =
                  player.form === 'Excellent'
                    ? 5
                    : player.form === 'Good'
                      ? 4
                      : player.form === 'Average'
                        ? 3
                        : player.form === 'Poor'
                          ? 2
                          : 1;
                return (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        i < formValue ? getStatColor(stats.overall) : 'rgb(55, 65, 81)',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip arrow */}
      <div
        className="absolute top-full left-6 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent"
        style={{ borderTopColor: 'rgba(15, 23, 42, 0.95)' }}
      />
    </div>
  );
});

// Performance halo effect
const PerformanceHalo: React.FC<{
  rating: number;
  size: 'small' | 'medium' | 'large';
  isHighlighted: boolean;
}> = React.memo(({ rating, size, isHighlighted }) => {
  const getHaloColor = (rating: number) => {
    if (rating >= 85) {
      return 'rgba(16, 185, 129, 0.4)';
    } // Elite - Green
    if (rating >= 75) {
      return 'rgba(245, 158, 11, 0.4)';
    } // Good - Yellow
    if (rating >= 65) {
      return 'rgba(249, 115, 22, 0.4)';
    } // Average - Orange
    return 'rgba(239, 68, 68, 0.4)'; // Poor - Red
  };

  const sizeMap = {
    small: { scale: 1.2, blur: 4 },
    medium: { scale: 1.3, blur: 6 },
    large: { scale: 1.4, blur: 8 },
  };

  const config = sizeMap[size];
  const haloColor = getHaloColor(rating);

  return (
    <div
      className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-300 ${
        isHighlighted ? 'animate-pulse' : ''
      }`}
      style={{
        background: `radial-gradient(circle, ${haloColor} 0%, transparent 70%)`,
        transform: `scale(${config.scale})`,
        filter: `blur(${config.blur}px)`,
        opacity: isHighlighted ? 0.8 : 0.5,
      }}
    />
  );
});

// Captain armband component
const CaptainArmband: React.FC<{
  size: 'small' | 'medium' | 'large';
}> = React.memo(({ size }) => {
  const sizeClasses = {
    small: 'w-2 h-3 text-[6px]',
    medium: 'w-3 h-4 text-[8px]',
    large: 'w-4 h-5 text-[10px]',
  };

  return (
    <div className="absolute -top-1 -left-1 z-10">
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-sm flex items-center justify-center font-bold text-black border border-yellow-300`}
        style={{
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
        }}
      >
        C
      </div>
    </div>
  );
});

const UltraModernPlayerToken: React.FC<UltraModernPlayerTokenProps> = ({
  player,
  isSelected,
  isHighlightedByAI,
  size = 'medium',
  showStats = true,
  showRole = true,
  interactive = true,
  isDragging = false,
}) => {
  const { uiState } = useUIContext();
  const { tacticsState } = useTacticsContext();
  const tacticsBoard = useTacticsBoard();

  const tokenRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  // Enhanced drag handlers
  const { startDrag } = tacticsBoard;

  // Player validation
  if (!player || !player.id || !player.name) {
    return null;
  }

  // Size configurations
  const sizeConfig = {
    small: {
      width: 32,
      height: 32,
      fontSize: '10px',
      borderWidth: 1,
      shadowSize: 4,
    },
    medium: {
      width: 48,
      height: 48,
      fontSize: '12px',
      borderWidth: 2,
      shadowSize: 8,
    },
    large: {
      width: 64,
      height: 64,
      fontSize: '14px',
      borderWidth: 3,
      shadowSize: 12,
    },
  };

  const config = sizeConfig[size];
  const role = PLAYER_ROLES.find(r => r?.id === player.roleId);
  const overallRating = player.overallRating || 75;

  // Performance-based styling
  const getPerformanceColor = useCallback((rating: number) => {
    if (rating >= 85) {
      return { main: '#10b981', accent: '#059669' };
    } // Elite
    if (rating >= 75) {
      return { main: '#f59e0b', accent: '#d97706' };
    } // Good
    if (rating >= 65) {
      return { main: '#f97316', accent: '#ea580c' };
    } // Average
    return { main: '#ef4444', accent: '#dc2626' }; // Needs improvement
  }, []);

  const performanceColors = getPerformanceColor(overallRating);

  // Team-based styling
  const teamColors = {
    home: { main: 'rgb(59, 130, 246)', accent: 'rgb(37, 99, 235)' },
    away: { main: 'rgb(239, 68, 68)', accent: 'rgb(220, 38, 38)' },
  };

  const colors = player.team ? teamColors[player.team] || teamColors.home : teamColors.home;

  // Enhanced event handlers
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive) {
        return;
      }
      setIsHovered(true);
      setMousePosition({ x: e.clientX, y: e.clientY });
    },
    [interactive],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isHovered) {
        return;
      }
      setMousePosition({ x: e.clientX, y: e.clientY });
    },
    [isHovered],
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!interactive || !startDrag) {
        return;
      }
      setIsAnimating(true);
      startDrag(player, e);
    },
    [interactive, startDrag, player],
  );

  const handleDragEnd = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive) {
        return;
      }
      e.stopPropagation();
      // Handle player selection logic here
    },
    [interactive],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive) {
        return;
      }
      e.stopPropagation();
      // Handle player info modal or quick actions
    },
    [interactive],
  );

  // Player initials for display
  const playerInitials = useMemo(() => {
    return (
      player.name
        ?.split(' ')
        .map(n => n[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase() || '??'
    );
  }, [player.name]);

  // Animation effects
  useEffect(() => {
    if (isHighlightedByAI) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isHighlightedByAI]);

  return (
    <>
      <div
        ref={tokenRef}
        className={`
          relative cursor-pointer transition-all duration-300 group
          ${isSelected ? 'z-30' : isHovered ? 'z-20' : 'z-10'}
          ${isDragging ? 'opacity-60 scale-90' : ''}
          ${isAnimating ? 'animate-bounce' : ''}
          ${isHovered && !isDragging ? 'scale-110' : ''}
        `}
        style={{
          width: config.width,
          height: config.height,
        }}
        draggable={interactive}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Performance halo */}
        <PerformanceHalo
          rating={overallRating}
          size={size}
          isHighlighted={isHighlightedByAI || isSelected}
        />

        {/* Main token body */}
        <div
          className={`
            relative w-full h-full rounded-full flex items-center justify-center font-bold transition-all duration-300
            ${isSelected ? 'ring-4 ring-white/60' : ''}
            ${isHighlightedByAI ? 'ring-4 ring-green-400/60 animate-pulse' : ''}
          `}
          style={{
            background: `linear-gradient(135deg, ${colors.main}, ${colors.accent})`,
            border: `${config.borderWidth}px solid rgba(255, 255, 255, 0.8)`,
            fontSize: config.fontSize,
            color: 'white',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
            boxShadow: `
              0 ${config.shadowSize}px ${config.shadowSize * 2}px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2)
            `,
          }}
        >
          {/* Player initials */}
          <span className="relative z-10 select-none">{playerInitials}</span>

          {/* Glossy overlay effect */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `linear-gradient(135deg, 
                rgba(255, 255, 255, 0.3) 0%, 
                rgba(255, 255, 255, 0.1) 30%, 
                transparent 60%
              )`,
            }}
          />

          {/* Performance rating indicator */}
          {size !== 'small' && (
            <div
              className="absolute -bottom-1 -right-1 text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: performanceColors.main,
                color: 'white',
                fontSize: size === 'large' ? '10px' : '8px',
                boxShadow: `0 2px 4px rgba(0, 0, 0, 0.3)`,
              }}
            >
              {overallRating}
            </div>
          )}

          {/* Role indicator */}
          {showRole && role && size !== 'small' && (
            <div
              className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-xs font-bold px-1 py-0.5 rounded-full bg-gray-800/80 text-white border border-white/30"
              style={{
                fontSize: size === 'large' ? '9px' : '7px',
                backdropFilter: 'blur(4px)',
              }}
            >
              {role.abbreviation}
            </div>
          )}
        </div>

        {/* Captain armband */}
        {player.isCaptain && <CaptainArmband size={size} />}

        {/* Availability indicator */}
        <ModernAvailabilityIndicator availability={player.availability} size={size} />

        {/* Selection ring animation */}
        {(isSelected || isHighlightedByAI) && (
          <div
            className={`
              absolute inset-0 rounded-full border-4 animate-ping
              ${isSelected ? 'border-white/40' : 'border-green-400/40'}
            `}
            style={{
              animationDuration: isHighlightedByAI ? '1s' : '2s',
            }}
          />
        )}

        {/* Hover effect ring */}
        {isHovered && !isDragging && (
          <div
            className="absolute inset-0 rounded-full border-2 border-white/60 animate-pulse"
            style={{
              transform: 'scale(1.1)',
            }}
          />
        )}
      </div>

      {/* Stats overlay */}
      {showStats && (
        <ModernPlayerStatsOverlay
          player={player}
          isVisible={isHovered && !isDragging}
          position={mousePosition}
        />
      )}
    </>
  );
};

export default React.memo(UltraModernPlayerToken);
