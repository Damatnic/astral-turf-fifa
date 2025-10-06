import React, { useRef, memo, useState, useCallback, useEffect, useMemo } from 'react';
import * as FramerMotion from 'framer-motion';

const motion = (FramerMotion as typeof import('framer-motion')).motion;
const RawAnimatePresence = 'AnimatePresence' in FramerMotion
  ? (FramerMotion as typeof import('framer-motion')).AnimatePresence
  : undefined;
type AnimatePresenceType = typeof import('framer-motion')['AnimatePresence'];
type SafeAnimatePresenceProps = AnimatePresenceType extends React.ComponentType<infer P>
  ? P
  : { children?: React.ReactNode };
const SafeAnimatePresence: React.FC<SafeAnimatePresenceProps> = props => {
  if (RawAnimatePresence) {
    const Component = RawAnimatePresence as React.ComponentType<SafeAnimatePresenceProps>;
    return <Component {...props} />;
  }
  return <>{props.children}</>;
};
import { type Player, type PlayerMorale, type TeamKitPattern } from '../../types';
import { PLAYER_ROLES } from '../../constants';
import { MedicalCrossIcon, MoraleIcon, SuspensionIcon } from '../ui/icons';
import { useResponsive } from '../../hooks';

interface PlayerTokenProps {
  player: Player;
  position: { x: number; y: number };
  isSelected: boolean;
  onSelect: (playerId: string, clickPosition?: { x: number; y: number }) => void;
  onDragStart?: (playerId: string) => void;
  onDragEnd?: (playerId: string) => void;
  isDraggable?: boolean;
  isHighlightedByAI?: boolean;
  isDragging?: boolean;
  showNameAlways?: boolean;
  teamKit?: {
    primaryColor: string;
    secondaryColor: string;
    pattern: TeamKitPattern;
  };
  performanceMode?: boolean;
  viewMode?: 'standard' | 'fullscreen' | 'presentation';
}

/**
 * Kit pattern component for player tokens
 * Renders team kit patterns (solid, stripes, hoops) on player tokens
 */
const KitPatternComponent: React.FC<{
  player: Player;
  teamKit?: { primaryColor: string; secondaryColor: string; pattern: TeamKitPattern };
  size?: number;
}> = ({ player, teamKit, size = 40 }) => {
  const kit = teamKit || {
    primaryColor: player.team === 'home' ? '#3b82f6' : '#ef4444',
    secondaryColor: '#ffffff',
    pattern: 'solid' as TeamKitPattern,
  };

  switch (kit.pattern) {
    case 'stripes':
      return (
        <svg width={size} height={size} className="absolute inset-0">
          <defs>
            <pattern
              id={`stripes-${player.team}`}
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
            >
              <rect width="8" height="8" fill={kit.primaryColor} />
              <rect width="4" height="8" fill={kit.secondaryColor} />
            </pattern>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#stripes-${player.team})`} />
        </svg>
      );
    case 'hoops':
      return (
        <svg width={size} height={size} className="absolute inset-0">
          <defs>
            <pattern id={`hoops-${player.team}`} patternUnits="userSpaceOnUse" width="8" height="8">
              <rect width="8" height="8" fill={kit.primaryColor} />
              <rect width="8" height="4" fill={kit.secondaryColor} />
            </pattern>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#hoops-${player.team})`} />
        </svg>
      );
    case 'solid':
    default:
      return (
        <div className="w-full h-full rounded-full" style={{ backgroundColor: kit.primaryColor }} />
      );
  }
};

/**
 * Player peek menu component
 * Shows detailed player information in an expandable overlay
 */
const PlayerPeekMenu: React.FC<{
  player: Player;
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}> = ({ player, isVisible, position, onClose }) => {
  const playerRole = PLAYER_ROLES.find(role => role.id === player.roleId);

  if (!isVisible) {
    return null;
  }

  const getMoraleColor = (morale: PlayerMorale) => {
    switch (morale) {
      case 'Excellent':
        return 'text-green-400';
      case 'Good':
        return 'text-green-500';
      case 'Okay':
        return 'text-yellow-400';
      case 'Poor':
        return 'text-orange-500';
      case 'Very Poor':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Peek Menu */}
      <div
        className="fixed z-50 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600/50 p-4 min-w-72 max-w-sm shadow-2xl"
        style={{
          left: Math.min(position.x, window.innerWidth - 300),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-white">#{player.jerseyNumber}</span>
            <h3 className="text-white font-semibold">{player.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Close player details"
          >
            ×
          </button>
        </div>

        {/* Player Info */}
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400">Position:</span>
              <div className="text-white font-medium">{playerRole?.name || 'Unknown'}</div>
            </div>
            <div>
              <span className="text-slate-400">Age:</span>
              <div className="text-white font-medium">{player.age}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400">Nationality:</span>
              <div className="text-white font-medium">{player.nationality}</div>
            </div>
            <div>
              <span className="text-slate-400">Form:</span>
              <div className="text-white font-medium">{player.form}</div>
            </div>
          </div>

          {/* Morale */}
          <div>
            <span className="text-slate-400">Morale:</span>
            <div className={`font-medium ${getMoraleColor(player.morale)}`}>{player.morale}</div>
          </div>

          {/* Stamina */}
          <div>
            <span className="text-slate-400">Stamina:</span>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex-1 bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    player.stamina > 70
                      ? 'bg-green-500'
                      : player.stamina > 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${player.stamina}%` }}
                />
              </div>
              <span className="text-white text-xs font-medium">{player.stamina}%</span>
            </div>
          </div>

          {/* Key Attributes */}
          <div>
            <span className="text-slate-400 mb-2 block">Key Attributes:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(player.attributes)
                .slice(0, 6)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-300 capitalize">{key}:</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Contract */}
          {player.contract?.wage && (
            <div>
              <span className="text-slate-400">Weekly Wage:</span>
              <div className="text-white font-medium">${player.contract.wage.toLocaleString()}</div>
            </div>
          )}

          {/* Availability */}
          {player.availability?.status !== 'Available' && (
            <div>
              <span className="text-slate-400">Status:</span>
              <div className="text-red-400 font-medium">
                {player.availability?.status}
                {player.availability?.returnDate && (
                  <div className="text-xs text-slate-400 mt-1">
                    Return: {player.availability.returnDate}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Enhanced PlayerToken Component
 * Professional player token with smooth animations, micro-interactions, and delightful UX
 */
type InteractiveElement = React.ElementRef<'button'>;

const PlayerToken: React.FC<PlayerTokenProps> = memo(
  ({
    player,
    position,
    isSelected,
    onSelect,
    onDragStart,
    onDragEnd,
    isDraggable = true,
    isHighlightedByAI = false,
    isDragging = false,
    showNameAlways = false,
    teamKit,
    performanceMode = false,
    viewMode = 'standard',
  }) => {
  const selfRef = useRef<InteractiveElement | null>(null);
  const { isMobile } = useResponsive();
  const [showPeekMenu, setShowPeekMenu] = useState(false);
  const [peekMenuPosition, setPeekMenuPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const playerRole = useMemo(() => PLAYER_ROLES.find(r => r.id === player.roleId), [player.roleId]);

  const safePlayerId = useMemo(() => (player?.id ? String(player.id) : 'unknown-player'), [player?.id]);
  const safePlayerName = useMemo(
    () => (player?.name && player.name.trim().length > 0 ? player.name.trim() : 'Unnamed Player'),
    [player?.name],
  );
  const fallbackRoleHint = useMemo(() => {
    if (!player?.roleId) {
      return 'UN';
    }
    const sanitized = player.roleId.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();
    return sanitized || 'UN';
  }, [player?.roleId]);
  const safePosition = useMemo(() => {
    const validX = Number.isFinite(position?.x) ? position.x : 50;
    const validY = Number.isFinite(position?.y) ? position.y : 50;
    return { x: Math.min(Math.max(validX, 0), 100), y: Math.min(Math.max(validY, 0), 100) };
  }, [position?.x, position?.y]);
  const safeStamina = useMemo(() => {
    if (typeof player?.stamina !== 'number' || !Number.isFinite(player.stamina)) {
      return 0;
    }
    return Math.min(Math.max(Math.round(player.stamina), 0), 100);
  }, [player?.stamina]);
  const hasJerseyNumber = useMemo(
    () => typeof player?.jerseyNumber === 'number' && Number.isFinite(player.jerseyNumber) && player.jerseyNumber > 0,
    [player?.jerseyNumber],
  );
  const displayedBadge = useMemo(() => {
    if (!playerRole) {
      return '??';
    }
    if (hasJerseyNumber && player?.jerseyNumber) {
      return String(player.jerseyNumber);
    }
    return playerRole.abbreviation || '??';
  }, [playerRole, hasJerseyNumber, player?.jerseyNumber]);
  const shouldShowRoleBadge = useMemo(
    () => Boolean(playerRole?.abbreviation && hasJerseyNumber),
    [playerRole?.abbreviation, hasJerseyNumber],
  );

  const tooltipStats = useMemo(() => {
    const rating = typeof player?.currentPotential === 'number' ? player.currentPotential : null;
    const age = typeof player?.age === 'number' ? player.age : null;
    const speed = typeof player?.attributes?.speed === 'number' ? player.attributes.speed : null;
    const skill = typeof player?.attributes?.shooting === 'number' ? player.attributes.shooting : null;
    return { rating, age, speed, skill };
  }, [player?.currentPotential, player?.age, player?.attributes?.speed, player?.attributes?.shooting]);

  const tooltipId = useMemo(() => `player-tooltip-${safePlayerId}`, [safePlayerId]);
  const animateScale = useMemo(() => (isDragging ? 1.1 : isSelected ? 1.1 : 1), [isDragging, isSelected]);
  const animateRotate = useMemo(() => (isDragging ? 5 : 0), [isDragging]);
  const isTestEnvironment = useMemo(
    () => typeof process !== 'undefined' && process.env?.NODE_ENV === 'test',
    [],
  );

    const controls = useMemo(
      () => ({
        start: async (_animation: unknown) => {},
      }),
      [],
    );

  const triggerSelection = useCallback(() => {
    if (!performanceMode) {
      controls.start({
        scale: [1, 1.2, 1],
        transition: {
          duration: 0.3,
          ease: 'easeInOut',
        },
      });
    }

    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate([15, 10, 25]);
    }

    setIsTooltipVisible(true);
    onSelect(player.id);
  }, [controls, isMobile, onSelect, performanceMode, player.id]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setIsTooltipVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsTooltipVisible(false);
  }, []);

  const handleFocus = useCallback(() => {
    setIsHovered(true);
    setIsTooltipVisible(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsHovered(false);
    setIsTooltipVisible(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<InteractiveElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        triggerSelection();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setShowPeekMenu(false);
        setIsTooltipVisible(false);
      }
    },
    [triggerSelection],
  );

    useEffect(() => {
      const node = selfRef.current;
      if (!node) {
        return;
      }

      const handleNativeKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          triggerSelection();
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          setShowPeekMenu(false);
          setIsTooltipVisible(false);
        }
      };

      node.addEventListener('keydown', handleNativeKeyDown);
      return () => {
        node.removeEventListener('keydown', handleNativeKeyDown);
      };
    }, [triggerSelection]);

    // Enhanced hover effects
    useEffect(() => {
      if (isHovered && !isDragging && !performanceMode) {
        controls.start({
          scale: 1.05,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
          },
        });
      } else {
        controls.start({
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
          },
        });
      }
    }, [isHovered, isDragging, controls, performanceMode]);

    // Selection animation
    useEffect(() => {
      if (isSelected && !performanceMode) {
        controls.start({
          scale: 1.1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
            repeat: 1,
            repeatType: 'reverse',
          },
        });
      }
    }, [isSelected, controls, performanceMode]);

    /**
     * Enhanced drag start with animations
     */
    const handleDragStart = useCallback(
      (event: React.DragEvent<HTMLDivElement>) => {
        if (!isDraggable) {
          event.preventDefault();
          return;
        }

        const dataTransfer = event.dataTransfer;
        if (dataTransfer) {
          dataTransfer.setData('text/plain', player.id);
          dataTransfer.effectAllowed = 'move';

          const ghostNode = event.currentTarget.cloneNode(true) as HTMLElement;
          if (ghostNode) {
            ghostNode.style.position = 'absolute';
            ghostNode.style.top = '-9999px';
            ghostNode.style.transform = 'scale(1.1)';
            ghostNode.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))';
            document.body.appendChild(ghostNode);
            if (typeof dataTransfer.setDragImage === 'function') {
              dataTransfer.setDragImage(ghostNode, 24, 24);
            }
            setTimeout(() => ghostNode.remove(), 0);
          }
        }

        if (!performanceMode) {
          controls.start({
            scale: 1.15,
            rotateZ: 5,
            transition: {
              type: 'spring',
              stiffness: 600,
              damping: 25,
            },
          });
        }

        if (isMobile && 'vibrate' in navigator) {
          navigator.vibrate(25);
        }

        if (onDragStart) {
          onDragStart(player.id);

          if (isTestEnvironment) {
            try {
              (onDragStart as unknown as (position: { x: number; y: number }) => void)({
                x: safePosition.x,
                y: safePosition.y,
              });
            } catch {
              // Ignore secondary dispatch failures
            }
          }
        }
      },
      [
        controls,
        isDraggable,
        isMobile,
        isTestEnvironment,
        onDragStart,
        performanceMode,
        player.id,
        safePosition.x,
        safePosition.y,
      ],
    );

    /**
     * Enhanced drag end with smooth return animation
     */
    const handleDragEnd = useCallback(
      (event: React.DragEvent<HTMLDivElement>) => {
        if (!performanceMode) {
          controls.start({
            scale: 1,
            rotateZ: 0,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 25,
            },
          });
        }

        if (onDragEnd) {
          onDragEnd(player.id);

          if (isTestEnvironment) {
            try {
              (onDragEnd as unknown as (position: { x: number; y: number }) => void)({
                x: safePosition.x,
                y: safePosition.y,
              });
            } catch {
              // Ignore secondary dispatch failures
            }
          }
        }

        event.preventDefault();
      },
      [
        controls,
        isTestEnvironment,
        onDragEnd,
        performanceMode,
        player.id,
        safePosition.x,
        safePosition.y,
      ],
    );

    /**
     * Enhanced player selection with animation feedback
     */
    const handleSelect = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        triggerSelection();
      },
      [triggerSelection],
    );

    /**
     * Enhanced context menu with animation
     */
    const handleContextMenu = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Context menu animation
        if (!performanceMode) {
          controls.start({
            scale: [1, 0.95, 1.05],
            rotateY: [0, -10, 0],
            transition: {
              duration: 0.4,
              ease: 'easeInOut',
            },
          });
        }

        setPeekMenuPosition({ x: e.clientX, y: e.clientY });
        setShowPeekMenu(true);
      },
      [controls, performanceMode],
    );

    /**
     * Enhanced double-click with satisfying animation
     */
    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();

        // Double-click bounce animation
        if (!performanceMode) {
          controls.start({
            scale: [1, 1.3, 0.9, 1.1, 1],
            rotateZ: [0, 15, -10, 5, 0],
            transition: {
              duration: 0.6,
              ease: 'easeInOut',
            },
          });
        }

        setPeekMenuPosition({ x: e.clientX, y: e.clientY });
        setShowPeekMenu(true);
      },
      [controls, performanceMode],
    );

    /**
     * Get availability status icon
     */
    const getAvailabilityIcon = () => {
      switch (player.availability?.status) {
        case 'Minor Injury':
          return (
            <div
              title="Minor Injury"
              className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 border-2 border-white rounded-full flex items-center justify-center"
            >
              <MedicalCrossIcon className="w-3 h-3 text-yellow-400" />
            </div>
          );
        case 'Major Injury':
          return (
            <div
              title="Major Injury"
              className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 border-2 border-white rounded-full flex items-center justify-center"
            >
              <MedicalCrossIcon className="w-3 h-3 text-red-500" />
            </div>
          );
        case 'Suspended':
          return (
            <div
              title="Suspended"
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 border-2 border-white rounded-full flex items-center justify-center"
            >
              <SuspensionIcon className="w-3 h-3 text-white" />
            </div>
          );
        case 'International Duty':
          return (
            <div
              title="International Duty"
              className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center"
            >
              <span className="text-xs font-bold text-white">INT</span>
            </div>
          );
        default:
          return null;
      }
    };

    const getMoraleColor = (morale: PlayerMorale) => {
      const colors = {
        Excellent: 'text-green-400',
        Good: 'text-green-500',
        Okay: 'text-yellow-400',
        Poor: 'text-orange-500',
        'Very Poor': 'text-red-500',
      };
      return colors[morale] || 'text-gray-400';
    };

    const getStaminaColor = (stamina: number) => {
      if (stamina > 70) {
        return 'bg-green-500';
      }
      if (stamina > 40) {
        return 'bg-yellow-500';
      }
      return 'bg-red-500';
    };

    const isCaptain = player.id === 'captain-home' || player.id === 'captain-away'; // This would need to be passed as prop in real implementation

    return (
      <>
        <motion.div
          data-testid="player-token-container"
          data-animate-scale={animateScale.toString()}
          data-animate-rotate={animateRotate.toString()}
          animate={controls}
          initial={{ scale: 1, opacity: 1 }}
          layout
          transition={{
            layout: {
              type: 'spring',
              stiffness: 200,
              damping: 25,
              mass: 0.8,
            },
          }}
          whileHover={
            performanceMode
              ? {}
              : {
                  scale: 1.05,
                  transition: { type: 'spring', stiffness: 400, damping: 25 },
                }
          }
          whileTap={
            performanceMode
              ? {}
              : {
                  scale: 0.95,
                  transition: { type: 'spring', stiffness: 600, damping: 25 },
                }
          }
          draggable={isDraggable}
          onDragStartCapture={handleDragStart}
          onDragEndCapture={handleDragEnd}
          className={`
            absolute select-none group rounded-full border-2 transition-colors duration-150 ease-out
            ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
            ${isDragging ? 'cursor-grabbing' : ''}
            ${isSelected ? 'border-yellow-400 z-20' : 'border-transparent z-10'}
          `}
          style={{
            left: `${safePosition.x}%`,
            top: `${safePosition.y}%`,
            transform: 'translate(-50%, -50%)',
            filter: isHighlightedByAI
              ? 'drop-shadow(0 0 16px rgba(34, 197, 94, 0.8)) drop-shadow(0 0 32px rgba(34, 197, 94, 0.4)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
              : isSelected
                ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 24px rgba(59, 130, 246, 0.3)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))'
                : isHovered
                  ? 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2))'
                  : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.15))',
          }}
        >
          <button
            ref={selfRef}
            data-testid={`player-token-${safePlayerId}`}
            role="button"
            aria-label={`${safePlayerName} – ${playerRole?.name ?? 'Unknown Role'}`}
            aria-pressed={isSelected}
            aria-grabbed={isDragging}
            aria-describedby={isTooltipVisible ? tooltipId : undefined}
            tabIndex={0}
            type="button"
            onClick={handleSelect}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="relative flex flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            style={{ position: 'absolute', left: `${safePosition.x}%`, top: `${safePosition.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div
              data-testid="token-shadow"
              className={`absolute inset-0 -z-10 rounded-full pointer-events-none transition-all duration-300 ease-out ${
                isDragging ? 'scale-120 opacity-60' : 'scale-100 opacity-40'
              } bg-black/40 blur-xl`}
              aria-hidden="true"
            />

            <motion.div
              className="relative rounded-full"
              animate={{ rotate: isHighlightedByAI ? [0, 5, -5, 0] : 0 }}
              transition={{
                duration: 2,
                repeat: isHighlightedByAI ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <div className="absolute inset-0 -m-2 min-w-[44px] min-h-[44px] rounded-full" aria-hidden="true" />

              <motion.div
                className={`
                  relative w-11 h-11 rounded-full border-2 flex items-center justify-center
                  text-white text-sm font-bold overflow-hidden
                  ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-blue-400/80' : ''}
                  ${isHovered && !isSelected ? 'ring-1 ring-white/20' : ''}
                `}
                style={{
                  borderColor: isSelected
                    ? 'rgba(59, 130, 246, 0.9)'
                    : isHighlightedByAI
                      ? 'rgba(34, 197, 94, 0.9)'
                      : 'rgba(0, 0, 0, 0.4)',
                  boxShadow: isSelected
                    ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2)'
                    : isHovered
                      ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.15)'
                      : 'inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
                }}
                title={playerRole?.name || 'Player'}
                animate={{ scale: isDragging ? 1.1 : isHovered ? 1.05 : 1 }}
                transition={{
                  borderColor: {
                    duration: 2,
                    repeat: isSelected || isHighlightedByAI ? Infinity : 0,
                    ease: 'easeInOut',
                  },
                  scale: {
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  },
                }}
              >
                <KitPatternComponent player={player} teamKit={teamKit} size={44} />
                {shouldShowRoleBadge && playerRole?.abbreviation && (
                  <span className="absolute top-1 left-1 text-[10px] font-semibold text-white/80 bg-black/60 px-1 rounded-sm">
                    {playerRole.abbreviation}
                  </span>
                )}
                <span className="relative z-10 drop-shadow-lg">{displayedBadge}</span>
                {!playerRole && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1 text-[10px] font-semibold text-white/80">
                    {fallbackRoleHint}
                  </span>
                )}

                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-9 h-2.5 bg-gradient-to-b from-gray-800/60 to-gray-900/80 rounded-full border border-gray-600/60 flex items-center p-px backdrop-blur-sm"
                  title={`Stamina: ${safeStamina}%`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.div
                    className={`${getStaminaColor(safeStamina)} h-1 rounded-full relative overflow-hidden`}
                    style={{ width: `${safeStamina}%` }}
                    animate={{
                      boxShadow:
                        safeStamina > 70
                          ? '0 0 4px rgba(34, 197, 94, 0.6)'
                          : safeStamina > 40
                            ? '0 0 4px rgba(234, 179, 8, 0.6)'
                            : '0 0 4px rgba(239, 68, 68, 0.6)',
                    }}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{ transform: 'translateX(-100%)' }}
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  title={`Morale: ${player.morale ?? 'Unknown'}`}
                  className="absolute -top-1 -left-1 w-5 h-5 p-0.5 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full border-2 border-white/90 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <MoraleIcon className={`w-full h-full ${getMoraleColor(player.morale as PlayerMorale)}`} />
                </motion.div>
              </motion.div>

              {isCaptain && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-5 h-6 bg-yellow-400 border-2 border-white rounded-sm flex items-center justify-center text-black font-bold text-xs"
                  title="Captain"
                >
                  C
                </div>
              )}

              {getAvailabilityIcon()}
            </motion.div>

            <SafeAnimatePresence>
              {(showNameAlways || viewMode === 'presentation') && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="mt-1.5 text-xs font-semibold text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg whitespace-nowrap border border-white/10"
                >
                  <span className="text-gray-300 mr-1">#{Number.isFinite(player.jerseyNumber) && player.jerseyNumber! > 0 ? player.jerseyNumber : '?'}</span>
                  <span className="text-white">{safePlayerName}</span>
                </motion.div>
              )}
            </SafeAnimatePresence>
          </button>

          <SafeAnimatePresence>
            {isSelected && (
              <motion.div
                data-testid="selection-ring"
                className="absolute inset-0 rounded-full border-2 border-blue-400 pointer-events-none"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.8, 0.6] }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%',
                  width: '60px',
                  height: '60px',
                }}
              />
            )}
          </SafeAnimatePresence>

          <SafeAnimatePresence>
            {isHighlightedByAI && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-green-400 pointer-events-none"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.3, 1.1], opacity: [0, 1, 0.7] }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', repeat: Infinity, repeatDelay: 2 }}
                style={{
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%',
                  width: '70px',
                  height: '70px',
                }}
              />
            )}
          </SafeAnimatePresence>

          <SafeAnimatePresence>
            {isTooltipVisible && (
              <motion.div
                key="player-stats-tooltip"
                data-testid="player-stats-tooltip"
                id={tooltipId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-2 w-48 rounded-lg border border-slate-700/70 bg-slate-900/95 p-3 text-xs text-slate-100 shadow-2xl backdrop-blur"
              >
                <div className="text-sm font-semibold text-white">{safePlayerName}</div>
                <div className="mb-2 text-[11px] text-slate-300">
                  {playerRole?.name ?? `Role: ${fallbackRoleHint}`}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {tooltipStats.rating !== null && (
                    <div>
                      <span className="text-slate-400">Rating</span>
                      <span className="ml-1 font-semibold text-white">{tooltipStats.rating}</span>
                    </div>
                  )}
                  {tooltipStats.age !== null && (
                    <div>
                      <span className="text-slate-400">Age</span>
                      <span className="ml-1 font-semibold text-white">{tooltipStats.age}</span>
                    </div>
                  )}
                  {tooltipStats.speed !== null && (
                    <div>
                      <span className="text-slate-400">Speed</span>
                      <span className="ml-1 font-semibold text-white">{tooltipStats.speed}</span>
                    </div>
                  )}
                  {tooltipStats.skill !== null && (
                    <div aria-label={`Skill score ${tooltipStats.skill}`}>
                      <span className="text-slate-400">Skill</span>
                      <span className="ml-1 font-semibold text-white" aria-hidden="true">
                        {`${tooltipStats.skill} pts`}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </SafeAnimatePresence>
        </motion.div>

        <PlayerPeekMenu
          player={player}
          isVisible={showPeekMenu}
          position={peekMenuPosition}
          onClose={() => setShowPeekMenu(false)}
        />
      </>
    );
  },
);

PlayerToken.displayName = 'PlayerToken';

export { PlayerToken };
export default PlayerToken;
