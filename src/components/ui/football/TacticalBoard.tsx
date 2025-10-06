import React, { forwardRef, useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../../utils/cn';

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: Position;
  role: 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST';
  teamSide: 'home' | 'away';
  isSelected?: boolean;
  isCaptain?: boolean;
  availability?: 'available' | 'injured' | 'suspended';
}

export interface TacticalLine {
  id: string;
  startPlayerId: string;
  endPlayerId: string;
  type: 'pass' | 'run' | 'press' | 'marking';
  color?: string;
}

export interface TacticalBoardProps extends React.HTMLAttributes<HTMLDivElement> {
  players: Player[];
  lines?: TacticalLine[];
  onPlayerMove?: (playerId: string, newPosition: Position) => void;
  onPlayerSelect?: (playerId: string) => void;
  onLineCreate?: (line: Omit<TacticalLine, 'id'>) => void;
  onLineDelete?: (lineId: string) => void;
  mode?: 'view' | 'edit' | 'tactics';
  fieldType?: '11v11' | '7v7' | '5v5';
  showGrid?: boolean;
  showZones?: boolean;
  showPlayerNames?: boolean;
  zoomLevel?: number;
  readonly?: boolean;
}

const FIELD_RATIO = 1.5; // FIFA standard field ratio (length/width)
const FIELD_WIDTH = 600;
const FIELD_HEIGHT = FIELD_WIDTH / FIELD_RATIO;

const fieldZones = [
  { name: 'Defensive Third', x: 0, y: 0, width: '33.33%', height: '100%' },
  { name: 'Middle Third', x: '33.33%', y: 0, width: '33.33%', height: '100%' },
  { name: 'Attacking Third', x: '66.66%', y: 0, width: '33.33%', height: '100%' },
];

export const TacticalBoard = forwardRef<HTMLDivElement, TacticalBoardProps>(
  (
    {
      className,
      players = [],
      lines = [],
      onPlayerMove,
      onPlayerSelect,
      onLineCreate,
      onLineDelete,
      mode = 'view',
      fieldType = '11v11',
      showGrid = false,
      showZones = false,
      showPlayerNames = true,
      zoomLevel = 1,
      readonly = false,
      ...props
    },
    ref
  ) => {
    const boardRef = useRef<HTMLDivElement>(null);
    const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
    const [isCreatingLine, setIsCreatingLine] = useState(false);
    const [lineStart, setLineStart] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState<Position>({ x: 0, y: 0 });

    // Handle player drag start
    const handlePlayerDragStart = useCallback(
      (e: React.MouseEvent, player: Player) => {
        if (readonly || mode === 'view') {
          return;
        }

        e.preventDefault();
        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }

        const playerElement = e.currentTarget as HTMLElement;
        const playerRect = playerElement.getBoundingClientRect();

        setDraggedPlayer(player.id);
        setDragOffset({
          x: e.clientX - playerRect.left - playerRect.width / 2,
          y: e.clientY - playerRect.top - playerRect.height / 2,
        });
      },
      [readonly, mode]
    );

    // Handle mouse move during drag
    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!draggedPlayer || !boardRef.current) {
          return;
        }

        const rect = boardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
        const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

        // Constrain to field boundaries
        const constrainedX = Math.max(2, Math.min(98, x));
        const constrainedY = Math.max(2, Math.min(98, y));

        setMousePosition({ x: constrainedX, y: constrainedY });
      },
      [draggedPlayer, dragOffset]
    );

    // Handle drag end
    const handleMouseUp = useCallback(() => {
      if (draggedPlayer && onPlayerMove) {
        onPlayerMove(draggedPlayer, mousePosition);
      }
      setDraggedPlayer(null);
      setDragOffset({ x: 0, y: 0 });
    }, [draggedPlayer, mousePosition, onPlayerMove]);

    // Handle line creation
    const handlePlayerClick = useCallback(
      (playerId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (mode === 'tactics' && !readonly) {
          if (!isCreatingLine) {
            setIsCreatingLine(true);
            setLineStart(playerId);
          } else if (lineStart && lineStart !== playerId) {
            // Create line
            if (onLineCreate) {
              onLineCreate({
                startPlayerId: lineStart,
                endPlayerId: playerId,
                type: 'pass',
                color: '#3B82F6',
              });
            }
            setIsCreatingLine(false);
            setLineStart(null);
          }
        } else {
          onPlayerSelect?.(playerId);
        }
      },
      [mode, readonly, isCreatingLine, lineStart, onLineCreate, onPlayerSelect]
    );

    // Setup mouse event listeners
    useEffect(() => {
      if (draggedPlayer) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
      return undefined;
    }, [draggedPlayer, handleMouseMove, handleMouseUp]);

    // Get player position (either current or dragged position)
    const getPlayerPosition = (player: Player) => {
      if (draggedPlayer === player.id) {
        return mousePosition;
      }
      return player.position;
    };

    // Render field markings
    const renderFieldMarkings = () => (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
        preserveAspectRatio="none"
      >
        {/* Field outline */}
        <rect
          x="10"
          y="10"
          width={FIELD_WIDTH - 20}
          height={FIELD_HEIGHT - 20}
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />

        {/* Center line */}
        <line
          x1={FIELD_WIDTH / 2}
          y1="10"
          x2={FIELD_WIDTH / 2}
          y2={FIELD_HEIGHT - 10}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />

        {/* Center circle */}
        <circle
          cx={FIELD_WIDTH / 2}
          cy={FIELD_HEIGHT / 2}
          r="40"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />

        {/* Penalty areas */}
        <rect
          x="10"
          y={FIELD_HEIGHT / 2 - 60}
          width="60"
          height="120"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />
        <rect
          x={FIELD_WIDTH - 70}
          y={FIELD_HEIGHT / 2 - 60}
          width="60"
          height="120"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />

        {/* Goal areas */}
        <rect
          x="10"
          y={FIELD_HEIGHT / 2 - 30}
          width="20"
          height="60"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />
        <rect
          x={FIELD_WIDTH - 30}
          y={FIELD_HEIGHT / 2 - 30}
          width="20"
          height="60"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />

        {/* Goals */}
        <rect
          x="5"
          y={FIELD_HEIGHT / 2 - 15}
          width="5"
          height="30"
          fill="none"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="2"
        />
        <rect
          x={FIELD_WIDTH - 10}
          y={FIELD_HEIGHT / 2 - 15}
          width="5"
          height="30"
          fill="none"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="2"
        />
      </svg>
    );

    // Render grid overlay
    const renderGrid = () => {
      if (!showGrid) {
        return null;
      }

      const gridLines: JSX.Element[] = [];
      const gridSize = 50;

      for (let i = 0; i <= FIELD_WIDTH; i += gridSize) {
        gridLines.push(
          <line
            key={`v-${i}`}
            x1={i}
            y1="0"
            x2={i}
            y2={FIELD_HEIGHT}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        );
      }

      for (let i = 0; i <= FIELD_HEIGHT; i += gridSize) {
        gridLines.push(
          <line
            key={`h-${i}`}
            x1="0"
            y1={i}
            x2={FIELD_WIDTH}
            y2={i}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        );
      }

      return (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
          preserveAspectRatio="none"
        >
          {gridLines}
        </svg>
      );
    };

    // Render zones overlay
    const renderZones = () => {
      if (!showZones) {
        return null;
      }

      return (
        <div className="absolute inset-0 pointer-events-none">
          {fieldZones.map((zone, index) => (
            <div
              key={zone.name}
              className="absolute border border-primary-500/20 bg-primary-500/5"
              style={{
                left: zone.x,
                top: zone.y,
                width: zone.width,
                height: zone.height,
              }}
            >
              <div className="absolute top-2 left-2 text-xs text-primary-400 font-medium">
                {zone.name}
              </div>
            </div>
          ))}
        </div>
      );
    };

    // Render tactical lines
    const renderTacticalLines = () => {
      if (!lines.length) {
        return null;
      }

      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
          {lines.map(line => {
            const startPlayer = players.find(p => p.id === line.startPlayerId);
            const endPlayer = players.find(p => p.id === line.endPlayerId);

            if (!startPlayer || !endPlayer) {
              return null;
            }

            const startPos = getPlayerPosition(startPlayer);
            const endPos = getPlayerPosition(endPlayer);

            const lineColors = {
              pass: '#3B82F6',
              run: '#10B981',
              press: '#EF4444',
              marking: '#F59E0B',
            };

            return (
              <g key={line.id}>
                <line
                  x1={`${startPos.x}%`}
                  y1={`${startPos.y}%`}
                  x2={`${endPos.x}%`}
                  y2={`${endPos.y}%`}
                  stroke={line.color || lineColors[line.type]}
                  strokeWidth="2"
                  strokeDasharray={line.type === 'run' ? '5,5' : undefined}
                  className="tactical-line-draw"
                />
                {/* Arrow head */}
                <polygon
                  points="0,-4 8,0 0,4"
                  fill={line.color || lineColors[line.type]}
                  transform={`translate(${endPos.x}%, ${endPos.y}%) rotate(${
                    (Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x) * 180) / Math.PI
                  })`}
                />
              </g>
            );
          })}
        </svg>
      );
    };

    return (
      <div
        ref={node => {
          if (boardRef) {
            (boardRef as any).current = node;
          }
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as any).current = node;
          }
        }}
        role="application"
        aria-label={`Tactical board in ${mode} mode with ${players?.length ?? 0} players`}
        aria-roledescription="Football tactical board"
        aria-describedby="tactical-board-description"
        className={cn(
          'relative bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden',
          'border-2 border-white/20 shadow-2xl',
          !readonly && 'cursor-crosshair',
          className
        )}
        style={{
          aspectRatio: FIELD_RATIO,
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center',
        }}
        {...props}
      >
        {/* Field pattern/texture */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3Jhc3MiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDA4MDAwIi8+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA2MDAwIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ1cmwoI2dyYXNzKSIvPjwvc3ZnPg==')] repeat" />
        </div>

        {/* Hidden description for screen readers */}
        <div id="tactical-board-description" className="sr-only">
          Football tactical board showing player positions.
          {!readonly && mode !== 'view' && ' Drag players to reposition them.'}
          {mode === 'tactics' && ' Click on two players to create a tactical line between them.'}
          {` Currently showing ${(players || []).filter(p => p?.teamSide === 'home').length} home team players and ${(players || []).filter(p => p?.teamSide === 'away').length} away team players.`}
        </div>

        {/* Zone overlays */}
        {renderZones()}

        {/* Grid overlay */}
        {renderGrid()}

        {/* Field markings */}
        {renderFieldMarkings()}

        {/* Tactical lines */}
        {renderTacticalLines()}

        {/* Players */}
        {(players || []).filter(p => p !== null && p !== undefined).map(player => {
          const position = getPlayerPosition(player);
          const isDragging = draggedPlayer === player.id;

          return (
            <PlayerToken
              key={player.id}
              player={player}
              position={position}
              isDragging={isDragging}
              showName={showPlayerNames}
              onClick={e => handlePlayerClick(player.id, e)}
              onMouseDown={e => handlePlayerDragStart(e, player)}
              readonly={readonly}
              className={cn(
                'absolute transform -translate-x-1/2 -translate-y-1/2',
                isDragging && 'z-50 scale-110 shadow-2xl',
                player.isSelected && 'ring-2 ring-primary-400 ring-offset-2 ring-offset-transparent'
              )}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          );
        })}

        {/* Mode indicator */}
        <div
          className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1"
          role="status"
          aria-label={`Current mode: ${mode}`}
        >
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider">{mode}</span>
        </div>

        {/* Line creation indicator */}
        {isCreatingLine && lineStart && (
          <div
            className="absolute bottom-4 left-4 bg-primary-600/90 backdrop-blur-sm rounded-lg px-3 py-2"
            role="status"
            aria-live="polite"
          >
            <span className="text-xs font-medium text-white">
              Click on another player to create a tactical line
            </span>
          </div>
        )}
      </div>
    );
  }
);

TacticalBoard.displayName = 'TacticalBoard';

// Player Token Component
interface PlayerTokenProps extends React.HTMLAttributes<HTMLDivElement> {
  player: Player;
  position: Position;
  isDragging?: boolean;
  showName?: boolean;
  readonly?: boolean;
}

const PlayerToken: React.FC<PlayerTokenProps> = ({
  player,
  position: _position,
  isDragging = false,
  showName = true,
  readonly = false,
  className,
  ...props
}) => {
  const teamColors = {
    home: {
      bg: 'bg-blue-600',
      border: 'border-blue-400',
      text: 'text-white',
    },
    away: {
      bg: 'bg-red-600',
      border: 'border-red-400',
      text: 'text-white',
    },
  };

  const availabilityIndicator = {
    available: 'bg-green-400',
    injured: 'bg-red-400',
    suspended: 'bg-yellow-400',
  };

  const colors = teamColors[player.teamSide];

  // Generate comprehensive ARIA label
  const ariaLabel = [
    player.name,
    `number ${player.jerseyNumber}`,
    player.role,
    player.teamSide === 'home' ? 'home team' : 'away team',
    player.isCaptain && 'team captain',
    player.availability === 'injured' && 'injured',
    player.availability === 'suspended' && 'suspended',
    player.isSelected && 'selected',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      role="button"
      tabIndex={readonly ? -1 : 0}
      aria-label={ariaLabel}
      aria-pressed={player.isSelected}
      aria-grabbed={isDragging}
      aria-describedby={`player-${player.id}-details`}
      className={cn(
        'relative group animate-fade-in-scale',
        !readonly && 'cursor-grab active:cursor-grabbing',
        isDragging && 'cursor-grabbing',
        className
      )}
      {...props}
    >
      {/* Player circle */}
      <div
        className={cn(
          'w-12 h-12 rounded-full border-2 flex items-center justify-center',
          'shadow-lg transition-all duration-200',
          'hover:scale-110 hover:shadow-xl',
          colors.bg,
          colors.border,
          colors.text,
          player.isSelected && 'scale-110',
          isDragging && 'scale-125 shadow-2xl'
        )}
      >
        {/* Captain indicator */}
        {player.isCaptain && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-black">C</span>
          </div>
        )}

        {/* Jersey number */}
        <span className="text-sm font-bold">{player.jerseyNumber}</span>

        {/* Availability indicator */}
        {player.availability && player.availability !== 'available' && (
          <div
            className={cn(
              'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white',
              availabilityIndicator[player.availability]
            )}
          />
        )}
      </div>

      {/* Player name */}
      {showName && (
        <div
          className={cn(
            'absolute top-14 left-1/2 transform -translate-x-1/2',
            'bg-black/60 backdrop-blur-sm rounded px-2 py-1',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'whitespace-nowrap text-xs font-medium text-white',
            'pointer-events-none z-10'
          )}
        >
          {player.name}
          <div className="text-xs text-gray-300">{player.role}</div>
        </div>
      )}

      {/* Hidden player details for screen readers */}
      <div id={`player-${player.id}-details`} className="sr-only">
        {player.name}, jersey number {player.jerseyNumber}, playing as {player.role} for the{' '}
        {player.teamSide} team
        {player.isCaptain && ', team captain'}
        {player.availability === 'injured' && ', currently injured'}
        {player.availability === 'suspended' && ', currently suspended'}. Click to{' '}
        {player.isSelected ? 'deselect' : 'select'} player
        {!readonly && ', drag to reposition'}.
      </div>
    </div>
  );
};
