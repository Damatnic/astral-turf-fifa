import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useUIContext, useTacticsContext } from '../../hooks';
import { useTacticsBoard } from '../../hooks/useTacticsBoard';
import type { Player } from '../../types';
import { PLAYER_ROLES } from '../../constants';

interface EnhancedPlayerTokenProps {
  player: Player;
  isSelected: boolean;
  isHighlightedByAI: boolean;
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  showRole?: boolean;
  interactive?: boolean;
}

// Player availability indicator with validation
const AvailabilityIndicator: React.FC<{ availability: Player['availability'] }> = React.memo(
  ({ availability }) => {
    const indicators: Record<string, { color: string; icon: string; tooltip: string }> = {
      available: { color: '#10b981', icon: '●', tooltip: 'Available' },
      injured: { color: '#ef4444', icon: '🏥', tooltip: 'Injured' },
      suspended: { color: '#f59e0b', icon: '🟡', tooltip: 'Suspended' },
      rested: { color: '#6b7280', icon: '😴', tooltip: 'Rested' },
      international: { color: '#3b82f6', icon: '🌍', tooltip: 'International Duty' },
    };

    const availabilityStatus =
      typeof availability === 'object' && availability?.status
        ? availability.status.toLowerCase().replace(/\s+/g, '_')
        : 'available';
    const indicator = indicators[availabilityStatus] || indicators.available;

    return (
      <div
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white/50 flex items-center justify-center text-xs"
        style={{ backgroundColor: indicator.color }}
        title={indicator.tooltip}
      >
        {availabilityStatus !== 'available' && (
          <span className="text-white text-[8px]">{indicator.icon}</span>
        )}
      </div>
    );
  }
);

// Player stats overlay with comprehensive validation
const PlayerStatsOverlay: React.FC<{
  player: Player;
  isVisible: boolean;
  position: { x: number; y: number };
}> = React.memo(({ player, isVisible, position }) => {
  if (!isVisible || !player) {
    return null;
  }

  // Validate position data
  if (
    !position ||
    typeof position.x !== 'number' ||
    typeof position.y !== 'number' ||
    isNaN(position.x) ||
    isNaN(position.y)
  ) {
    return null;
  }

  const stats = [
    { label: 'OVR', value: player.overall || 75 },
    { label: 'SPD', value: (player.attributes as { pace?: number })?.pace || 70 },
    { label: 'SHO', value: player.attributes?.shooting || 70 },
    { label: 'PAS', value: player.attributes?.passing || 70 },
    { label: 'DEF', value: (player.attributes as { defending?: number })?.defending || 70 },
    { label: 'PHY', value: (player.attributes as { physical?: number })?.physical || 70 },
  ];

  return (
    <div
      className="fixed z-50 bg-gray-900/95 backdrop-blur-sm border border-gray-600 rounded-lg p-3 shadow-xl pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="text-sm font-bold text-white mb-2">{player.name || 'Unknown Player'}</div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {stats.map(stat => (
          <div key={stat.label} className="flex flex-col items-center">
            <div className="text-gray-400">{stat.label}</div>
            <div
              className={`font-bold ${
                stat.value >= 80
                  ? 'text-green-400'
                  : stat.value >= 70
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const EnhancedPlayerToken: React.FC<EnhancedPlayerTokenProps> = ({
  player,
  isSelected = false,
  isHighlightedByAI = false,
  size = 'medium',
  showStats = false,
  showRole = true,
  interactive = true,
}) => {
  // Validate player data immediately
  if (!player || !player.id || !player.name) {
    // // console.warn('EnhancedPlayerToken: Invalid player data', player);
    return null;
  }

  const { uiState, dispatch } = useUIContext();
  const { tacticsState } = useTacticsContext();
  const { startDrag, endDrag, validateDrop } = useTacticsBoard();
  const { drawingTool, isPresentationMode } = uiState || {};
  const { captainIds } = tacticsState || {};

  const tokenRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const isDraggable = interactive && drawingTool === 'select' && !isPresentationMode;
  const isCaptain = player.id === captainIds?.home || player.id === captainIds?.away;
  const playerRole =
    player.roleId && PLAYER_ROLES ? PLAYER_ROLES.find(r => r?.id === player.roleId) : null;

  // Size configurations
  const sizeConfig = useMemo(() => {
    const configs = {
      small: { size: 32, text: 'text-xs', padding: 'p-1' },
      medium: { size: 48, text: 'text-sm', padding: 'p-2' },
      large: { size: 64, text: 'text-base', padding: 'p-3' },
    };
    return configs[size];
  }, [size]);

  // Player kit colors with validation
  const kitColors = useMemo(() => {
    const team = player.team || 'home';
    const kit = (
      player as Player & {
        kit?: { primaryColor?: string; secondaryColor?: string; accentColor?: string };
      }
    ).kit;

    return {
      primary: kit?.primaryColor || (team === 'home' ? '#3b82f6' : '#ef4444'),
      secondary: kit?.secondaryColor || '#ffffff',
      accent: kit?.accentColor || (team === 'home' ? '#1d4ed8' : '#dc2626'),
    };
  }, [player]);

  // Enhanced drag handlers with comprehensive validation
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!isDraggable || !player || !player.id) {
        e.preventDefault();
        // // console.warn('Drag prevented: invalid player or not draggable', { isDraggable, player });
        return;
      }

      try {
        setIsDragging(true);
        startDrag(player, e);

        // Add visual feedback
        if (tokenRef.current) {
          tokenRef.current.style.opacity = '0.7';
          tokenRef.current.style.transform = 'scale(1.1)';
        }
      } catch {
        // Failed to start drag
        setIsDragging(false);
      }
    },
    [isDraggable, player, startDrag]
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      try {
        setIsDragging(false);
        endDrag();

        // Reset visual feedback
        if (tokenRef.current) {
          tokenRef.current.style.opacity = '';
          tokenRef.current.style.transform = '';
        }
      } catch {
        // Failed to end drag
      }
    },
    [endDrag]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive || !player?.id) {
        return;
      }

      e.stopPropagation();
      try {
        dispatch({ type: 'SELECT_PLAYER', payload: player.id });
      } catch {
        // Failed to select player
      }
    },
    [interactive, dispatch, player?.id]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive || !player?.id) {
        return;
      }

      e.stopPropagation();
      try {
        // Open player details modal
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'PLAYER_DETAILS', playerId: player.id } });
      } catch {
        // Failed to open player modal
      }
    },
    [interactive, dispatch, player?.id]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (showStats && e.clientX !== undefined && e.clientY !== undefined) {
        setMousePosition({ x: e.clientX, y: e.clientY });
        setIsHovered(true);
      }
    },
    [showStats]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (showStats && isHovered && e.clientX !== undefined && e.clientY !== undefined) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    },
    [showStats, isHovered]
  );

  // Performance rating color
  const getPerformanceColor = useCallback((rating: number) => {
    if (rating >= 80) {
      return '#10b981';
    } // Green
    if (rating >= 70) {
      return '#f59e0b';
    } // Yellow
    if (rating >= 60) {
      return '#f97316';
    } // Orange
    return '#ef4444'; // Red
  }, []);

  const overallRating = player.overall || 75;
  const performanceColor = getPerformanceColor(overallRating);

  return (
    <>
      <div
        ref={tokenRef}
        className={`
          relative cursor-pointer transition-all duration-200 rounded-full
          ${sizeConfig.padding}
          ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent' : ''}
          ${isHighlightedByAI ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-transparent animate-pulse' : ''}
          ${isDragging ? 'z-50' : 'z-10'}
          ${isHovered && interactive ? 'scale-110' : ''}
          ${isDraggable ? 'hover:scale-105' : ''}
        `}
        style={{
          width: sizeConfig.size,
          height: sizeConfig.size,
          background: `linear-gradient(135deg, ${kitColors.primary}, ${kitColors.accent})`,
          border: `2px solid ${kitColors.secondary}`,
          boxShadow:
            isSelected || isHighlightedByAI
              ? `0 0 20px ${isSelected ? '#facc15' : '#10b981'}`
              : '0 4px 12px rgba(0,0,0,0.3)',
        }}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        title={`${player.name || 'Unknown'} - ${playerRole?.name || player.roleId || 'Unknown Role'}`}
      >
        {/* Player initials or number */}
        <div
          className={`
          absolute inset-0 flex items-center justify-center font-bold text-white
          ${sizeConfig.text}
        `}
        >
          {(player as Player & { number?: number }).number ? (
            <span className="drop-shadow-sm">
              {(player as Player & { number?: number }).number}
            </span>
          ) : (
            <span className="drop-shadow-sm">
              {player.name
                ? player.name
                    .split(' ')
                    .map(n => n[0] || '')
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : '??'}
            </span>
          )}
        </div>

        {/* Captain armband */}
        {isCaptain && (
          <div className="absolute -top-1 left-0 w-4 h-2 bg-yellow-400 rounded-r-sm flex items-center justify-center">
            <span className="text-black text-xs font-bold">C</span>
          </div>
        )}

        {/* Availability indicator */}
        <AvailabilityIndicator availability={player.availability || 'available'} />

        {/* Role indicator */}
        {showRole && playerRole && size !== 'small' && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="bg-gray-900 text-white text-xs px-1 rounded text-center border border-gray-600">
              {playerRole.abbreviation}
            </div>
          </div>
        )}

        {/* Performance rating */}
        {size !== 'small' && (
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white/50 flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: performanceColor }}
          >
            {Math.floor(overallRating / 10)}
          </div>
        )}

        {/* Drag indicator */}
        {isDragging && <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />}

        {/* Selection pulse */}
        {isSelected && (
          <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-pulse" />
        )}

        {/* AI highlight pulse */}
        {isHighlightedByAI && (
          <div className="absolute inset-0 bg-green-400/20 rounded-full animate-pulse" />
        )}
      </div>

      {/* Stats overlay */}
      {showStats && (
        <PlayerStatsOverlay player={player} isVisible={isHovered} position={mousePosition} />
      )}
    </>
  );
};

export default React.memo(EnhancedPlayerToken);
