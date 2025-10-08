import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useTacticsContext, useUIContext, useFranchiseContext } from '../../hooks';
import type { Formation, FormationSlot, Player, Team, DrawingShape } from '../../types';
import { PLAYER_ROLES } from '../../constants';
import UltraModernPlayerToken from './UltraModernPlayerToken';
import AdvancedVectorDrawingCanvas from './AdvancedVectorDrawingCanvas';
import ProfessionalAnimationTimeline from './ProfessionalAnimationTimeline';

interface Modern3DSoccerFieldProps {
  className?: string;
}

// Modern 3D Formation Strength Overlay with depth and glow effects
const Modern3DFormationStrengthOverlay: React.FC<{ formation: Formation; team: Team }> = React.memo(
  ({ formation, team }) => {
    const strengthZones = useMemo(() => {
      if (!formation?.slots || !Array.isArray(formation.slots)) {
        return [];
      }
      return formation.slots
        .filter(
          slot =>
            slot?.position &&
            typeof slot.position.x === 'number' &&
            typeof slot.position.y === 'number',
        )
        .map(slot => ({
          id: slot.id,
          x: slot.position?.x ?? 0,
          y: slot.position?.y ?? 0,
          strength: slot.playerId ? 85 : 30,
          color: team === 'home' ? 'rgb(59, 130, 246)' : 'rgb(239, 68, 68)',
          glowColor: team === 'home' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        }));
    }, [formation?.slots, team]);

    return (
      <div className="absolute inset-0 pointer-events-none">
        {strengthZones.map(zone => (
          <div
            key={zone.id}
            className="absolute transition-all duration-500 ease-in-out"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.strength}px`,
              height: `${zone.strength}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-full opacity-30 animate-pulse"
              style={{
                background: `radial-gradient(circle, ${zone.glowColor} 0%, transparent 70%)`,
                filter: 'blur(8px)',
                transform: 'scale(1.5)',
              }}
            />
            {/* Inner core */}
            <div
              className="absolute inset-0 rounded-full border-2 opacity-60"
              style={{
                backgroundColor: zone.glowColor,
                borderColor: zone.color,
                boxShadow: `0 0 20px ${zone.glowColor}, inset 0 0 20px rgba(255,255,255,0.1)`,
              }}
            />
          </div>
        ))}
      </div>
    );
  },
);

// Enhanced 3D Formation Slot with modern styling
const Modern3DFormationSlot: React.FC<{
  slot: FormationSlot;
  player: Player | null;
  team: Team;
  isHighlighted: boolean;
  isDragOver: boolean;
  onDrop: (e: React.DragEvent<HTMLDivElement>, slot: FormationSlot, team: Team) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
}> = React.memo(
  ({ slot, player, team, isHighlighted, isDragOver, onDrop, onDragOver, onDragLeave }) => {
    if (
      !slot ||
      !slot.position ||
      typeof slot.position.x !== 'number' ||
      typeof slot.position.y !== 'number'
    ) {
      return null;
    }

    const playerRole =
      player && player.roleId ? PLAYER_ROLES.find(r => r?.id === player.roleId) : null;
    const slotRole = slot.roleId ? PLAYER_ROLES.find(r => r?.id === slot.roleId) : null;

    const baseStyles = {
      left: `${Math.max(0, Math.min(100, slot.position.x))}%`,
      top: `${Math.max(0, Math.min(100, slot.position.y))}%`,
      transform: 'translate(-50%, -50%)',
    };

    return (
      <div
        className={`
          absolute w-16 h-16 transition-all duration-300 cursor-pointer group
          ${isDragOver ? 'scale-125 z-20' : 'hover:scale-110'}
          ${isHighlighted ? 'z-10' : ''}
        `}
        style={baseStyles}
        onDrop={e => onDrop(e, slot, team)}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        data-is-interactive-zone="true"
      >
        {/* Slot background with 3D effect */}
        <div
          className={`
            absolute inset-0 rounded-full transition-all duration-300
            ${
              isDragOver
                ? 'bg-gradient-to-br from-yellow-400/40 to-yellow-600/40 shadow-2xl shadow-yellow-400/50'
                : isHighlighted
                  ? 'bg-gradient-to-br from-green-400/40 to-green-600/40 shadow-xl shadow-green-400/30'
                  : team === 'home'
                    ? 'bg-gradient-to-br from-blue-500/20 to-blue-700/20'
                    : 'bg-gradient-to-br from-red-500/20 to-red-700/20'
            }
            ${!player ? 'border-2 border-dashed' : 'border border-solid'}
            ${
              team === 'home'
                ? 'border-blue-400/60 shadow-lg shadow-blue-400/20'
                : 'border-red-400/60 shadow-lg shadow-red-400/20'
            }
          `}
          style={{
            backdropFilter: 'blur(8px)',
            background: !player
              ? 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))'
              : undefined,
            boxShadow: player
              ? `0 8px 32px -4px ${team === 'home' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}, 
                 inset 0 1px 0 rgba(255, 255, 255, 0.1),
                 inset 0 -1px 0 rgba(0, 0, 0, 0.1)`
              : `0 4px 16px -2px rgba(255, 255, 255, 0.1),
                 inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
          }}
        />

        {/* Animated ring effect for active slots */}
        {(isDragOver || isHighlighted) && (
          <div
            className={`
              absolute inset-0 rounded-full animate-ping
              ${isDragOver ? 'border-4 border-yellow-400/50' : 'border-2 border-green-400/50'}
            `}
          />
        )}

        {/* Player or role indicator */}
        <div className="relative w-full h-full flex items-center justify-center">
          {player ? (
            <UltraModernPlayerToken
              player={player}
              isSelected={false}
              isHighlightedByAI={isHighlighted}
              size="medium"
            />
          ) : (
            <div className="text-center">
              <div
                className={`
                  text-sm font-bold uppercase tracking-wider transition-all duration-300
                  ${team === 'home' ? 'text-blue-300' : 'text-red-300'}
                  ${isDragOver ? 'text-yellow-300 scale-110' : 'group-hover:scale-105'}
                `}
                style={{
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  filter: 'drop-shadow(0 0 8px currentColor)',
                }}
              >
                {slotRole?.abbreviation ||
                  (slot.roleId ? slot.roleId.slice(0, 2).toUpperCase() : '??')}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

const Modern3DSoccerField: React.FC<Modern3DSoccerFieldProps> = ({ className = '' }) => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { franchiseState } = useFranchiseContext();

  const { players, formations, activeFormationIds, playbook, chemistry } = tacticsState;
  const { relationships, mentoringGroups } = franchiseState;
  const {
    selectedPlayerId,
    drawingTool,
    animationTrails,
    activeTeamContext,
    highlightedByAIPlayerIds,
    activePlaybookItemId,
    isPresentationMode,
    isGridVisible,
    isFormationStrengthVisible,
    positioningMode,
  } = uiState;

  const fieldRef = useRef<HTMLDivElement>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const [fieldDimensions, setFieldDimensions] = useState({ width: 0, height: 0 });
  const [weatherEffect, setWeatherEffect] = useState<'clear' | 'rain' | 'snow'>('clear');

  // Update field dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (fieldRef.current) {
        const rect = fieldRef.current.getBoundingClientRect();
        setFieldDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Memoized formation data with comprehensive validation
  const homeFormation = useMemo(() => {
    const formation = formations?.[activeFormationIds?.home];
    if (!formation || !formation.slots || !Array.isArray(formation.slots)) {
      return null;
    }
    return formation;
  }, [formations, activeFormationIds?.home]);

  const awayFormation = useMemo(() => {
    const formation = formations?.[activeFormationIds?.away];
    if (!formation || !formation.slots || !Array.isArray(formation.slots)) {
      return null;
    }
    return formation;
  }, [formations, activeFormationIds?.away]);

  // Error boundary for missing formations
  if (!homeFormation || !awayFormation) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/30 rounded-xl ">
        <div className="text-center text-red-400 p-8">
          <div className="text-2xl font-bold mb-4">⚠️ Formation Configuration Required</div>
          <div className="text-lg mb-4">
            Please select valid formations to begin tactical planning
          </div>
          <div className="text-sm bg-red-900/30 px-4 py-2 rounded-lg border border-red-500/30">
            Home Formation: {homeFormation ? '✅ Ready' : '❌ Missing'} | Away Formation:{' '}
            {awayFormation ? '✅ Ready' : '❌ Missing'}
          </div>
        </div>
      </div>
    );
  }

  // Enhanced field drop handler with validation
  const handleFieldDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverSlotId(null);

      const playerId = e?.dataTransfer?.getData('text/plain');

      if (!fieldRef?.current || !playerId) {
        return;
      }

      if (drawingTool !== 'select') {
        return;
      }

      if (positioningMode === 'snap') {
        return;
      }

      if ((e.target as HTMLElement).closest('[data-is-interactive-zone="true"]')) {
        return;
      }

      const player = players?.find(p => p?.id === playerId);
      if (!player || !player.id) {
        return;
      }

      try {
        const fieldRect = fieldRef.current.getBoundingClientRect();
        if (!fieldRect || fieldRect.width === 0 || fieldRect.height === 0) {
          return;
        }

        const x = Math.max(5, Math.min(95, ((e.clientX - fieldRect.left) / fieldRect.width) * 100));
        const y = Math.max(5, Math.min(95, ((e.clientY - fieldRect.top) / fieldRect.height) * 100));

        if (isNaN(x) || isNaN(y)) {
          return;
        }

        dispatch({ type: 'UPDATE_PLAYER_POSITION', payload: { playerId, position: { x, y } } });
      } catch (error) {
        console.error('Failed to update player position:', error);
      }
    },
    [dispatch, drawingTool, positioningMode, players],
  );

  // Enhanced slot drop handler
  const handleSlotDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, slot: FormationSlot, team: Team) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverSlotId(null);

      const playerId = e?.dataTransfer?.getData('text/plain');
      if (!playerId) {
        return;
      }

      const player = players?.find(p => p?.id === playerId);
      if (!player || !player.id) {
        return;
      }

      if (
        !slot ||
        !slot.id ||
        !slot.position ||
        typeof slot.position.x !== 'number' ||
        typeof slot.position.y !== 'number'
      ) {
        return;
      }

      try {
        if (slot.playerId && slot.playerId !== playerId) {
          dispatch({
            type: 'SWAP_PLAYERS',
            payload: { sourcePlayerId: playerId, targetPlayerId: slot.playerId },
          });
        } else {
          dispatch({ type: 'ASSIGN_PLAYER_TO_SLOT', payload: { slotId: slot.id, playerId, team } });
        }
      } catch (error) {
        console.error('Failed to handle slot drop:', error);
      }
    },
    [dispatch, players],
  );

  const handleSlotDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, slotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlotId(slotId);
  }, []);

  const handleSlotDragLeave = useCallback(() => {
    setDragOverSlotId(null);
  }, []);

  // Optimized team rendering with comprehensive validation
  const renderTeam = useCallback(
    (team: Team) => {
      const formation = team === 'home' ? homeFormation : awayFormation;
      if (!formation || !formation.slots || !Array.isArray(formation.slots)) {
        return null;
      }

      return (
        <div className="absolute inset-0">
          {formation.slots
            .filter(slot => slot && slot.id && slot.position)
            .map(slot => {
              if (
                !slot.position ||
                typeof slot.position.x !== 'number' ||
                typeof slot.position.y !== 'number'
              ) {
                return null;
              }

              const player =
                slot.playerId && players ? players.find(p => p?.id === slot.playerId) : null;
              const isHighlighted =
                slot.playerId && highlightedByAIPlayerIds
                  ? highlightedByAIPlayerIds.includes(slot.playerId)
                  : false;
              const isDragOver = slot.id === dragOverSlotId;

              return (
                <Modern3DFormationSlot
                  key={slot.id}
                  slot={slot}
                  player={player || null}
                  team={team}
                  isHighlighted={isHighlighted}
                  isDragOver={isDragOver}
                  onDrop={handleSlotDrop}
                  onDragOver={e => handleSlotDragOver(e, slot.id)}
                  onDragLeave={handleSlotDragLeave}
                />
              );
            })
            .filter(Boolean)}
        </div>
      );
    },
    [
      homeFormation,
      awayFormation,
      players,
      highlightedByAIPlayerIds,
      dragOverSlotId,
      handleSlotDrop,
      handleSlotDragOver,
      handleSlotDragLeave,
    ],
  );

  // Enhanced chemistry links with modern styling
  const chemistryLinks = useMemo(() => {
    if (!chemistry || !homeFormation || !awayFormation) {
      return [];
    }

    const links: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      strength: number;
      color: string;
      glowColor: string;
    }> = [];

    const formations =
      activeTeamContext === 'both'
        ? [homeFormation, awayFormation]
        : activeTeamContext === 'home'
          ? [homeFormation]
          : [awayFormation];

    formations
      .filter(formation => formation && formation.slots && Array.isArray(formation.slots))
      .forEach(formation => {
        formation.slots
          .filter(
            slot1 =>
              slot1 &&
              slot1.playerId &&
              slot1.position &&
              typeof slot1.position.x === 'number' &&
              typeof slot1.position.y === 'number',
          )
          .forEach(slot1 => {
            formation.slots
              .filter(
                slot2 =>
                  slot2 &&
                  slot2.playerId &&
                  slot2.position &&
                  typeof slot2.position.x === 'number' &&
                  typeof slot2.position.y === 'number' &&
                  slot1.id !== slot2.id,
              )
              .forEach(slot2 => {
                const chemistryScore = chemistry[slot1.playerId!]?.[slot2.playerId!] || 0;
                if (
                  chemistryScore > 60 &&
                  slot1.position &&
                  slot2.position &&
                  !isNaN(slot1.position.x) &&
                  !isNaN(slot1.position.y) &&
                  !isNaN(slot2.position.x) &&
                  !isNaN(slot2.position.y)
                ) {
                  const color = chemistryScore > 80 ? '#10b981' : '#f59e0b';
                  const glowColor =
                    chemistryScore > 80 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(245, 158, 11, 0.6)';

                  links.push({
                    x1: slot1.position.x,
                    y1: slot1.position.y,
                    x2: slot2.position.x,
                    y2: slot2.position.y,
                    strength: chemistryScore,
                    color,
                    glowColor,
                  });
                }
              });
          });
      });

    return links;
  }, [chemistry, activeTeamContext, homeFormation, awayFormation]);

  return (
    <div
      ref={fieldRef}
      className={`
        relative w-full h-full overflow-hidden rounded-xl
        ${className}
      `}
      onDrop={handleFieldDrop}
      onDragOver={e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      style={{
        background: `
          radial-gradient(ellipse at center top, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at center bottom, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
          linear-gradient(135deg, 
            #166534 0%, 
            #15803d 25%, 
            #16a34a 50%, 
            #15803d 75%, 
            #166534 100%
          )
        `,
        boxShadow: `
          inset 0 0 100px rgba(0, 0, 0, 0.3),
          inset 0 0 50px rgba(34, 197, 94, 0.1),
          0 20px 40px rgba(0, 0, 0, 0.2)
        `,
      }}
    >
      {/* Stadium lighting overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      {/* Weather effects */}
      {weatherEffect === 'rain' && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 100 }, (_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-8 bg-blue-300/30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                transform: `rotate(${10 + Math.random() * 10}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Modern field markings with 3D effect */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradient definitions for 3D effect */}
          <linearGradient id="fieldLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
          </linearGradient>

          <filter id="fieldLineShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1" floodColor="rgba(0,0,0,0.3)" />
          </filter>

          <filter id="fieldLineGlow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Center circle with enhanced styling */}
        <circle
          cx="50"
          cy="50"
          r="9.15"
          fill="none"
          stroke="url(#fieldLineGradient)"
          strokeWidth="0.3"
          filter="url(#fieldLineShadow)"
          opacity="0.9"
        />
        <circle
          cx="50"
          cy="50"
          r="0.8"
          fill="url(#fieldLineGradient)"
          filter="url(#fieldLineGlow)"
        />

        {/* Center line */}
        <line
          x1="50"
          y1="0"
          x2="50"
          y2="100"
          stroke="url(#fieldLineGradient)"
          strokeWidth="0.25"
          filter="url(#fieldLineShadow)"
          opacity="0.8"
        />

        {/* Enhanced penalty boxes */}
        <rect
          x="0"
          y="21.1"
          width="16.5"
          height="57.8"
          fill="none"
          stroke="url(#fieldLineGradient)"
          strokeWidth="0.25"
          filter="url(#fieldLineShadow)"
          opacity="0.8"
        />
        <rect
          x="83.5"
          y="21.1"
          width="16.5"
          height="57.8"
          fill="none"
          stroke="url(#fieldLineGradient)"
          strokeWidth="0.25"
          filter="url(#fieldLineShadow)"
          opacity="0.8"
        />

        {/* Enhanced goal areas */}
        <rect
          x="0"
          y="36.8"
          width="5.5"
          height="26.4"
          fill="none"
          stroke="url(#fieldLineGradient)"
          strokeWidth="0.25"
          filter="url(#fieldLineShadow)"
          opacity="0.8"
        />
        <rect
          x="94.5"
          y="36.8"
          width="5.5"
          height="26.4"
          fill="none"
          stroke="url(#fieldLineGradient)"
          strokeWidth="0.25"
          filter="url(#fieldLineShadow)"
          opacity="0.8"
        />

        {/* Corner arcs */}
        <path
          d="M 0 0 A 1 1 0 0 1 1 1"
          fill="none"
          stroke="url(#fieldLineGradient)"
          strokeWidth="0.2"
          filter="url(#fieldLineShadow)"
          opacity="0.7"
        />
        <path
          d="M 100 0 A 1 1 0 0 0 99 1"
          fill="none"
          stroke="url(#fieldLineGradient)"
          strokeWidth="0.2"
          filter="url(#fieldLineShadow)"
          opacity="0.7"
        />
        <path
          d="M 0 100 A 1 1 0 0 0 1 99"
          fill="none"
          stroke="url(#fieldLineGradient)"
          strokeWidth="0.2"
          filter="url(#fieldLineShadow)"
          opacity="0.7"
        />
        <path
          d="M 100 100 A 1 1 0 0 1 99 99"
          fill="none"
          stroke="url(#fieldLineGradient)"
          strokeWidth="0.2"
          filter="url(#fieldLineShadow)"
          opacity="0.7"
        />

        {/* Modern grid overlay */}
        {isGridVisible && (
          <g stroke="rgba(255,255,255,0.08)" strokeWidth="0.05">
            {Array.from({ length: 21 }, (_, i) => (
              <g key={i}>
                <line x1={i * 5} y1="0" x2={i * 5} y2="100" opacity="0.5" />
                <line x1="0" y1={i * 5} x2="100" y2={i * 5} opacity="0.5" />
              </g>
            ))}
          </g>
        )}

        {/* Enhanced chemistry links */}
        {chemistryLinks.map((link, index) => (
          <g key={index}>
            {/* Glow effect */}
            <line
              x1={link.x1}
              y1={link.y1}
              x2={link.x2}
              y2={link.y2}
              stroke={link.glowColor}
              strokeWidth="0.8"
              strokeOpacity={link.strength / 150}
              filter="url(#fieldLineGlow)"
            />
            {/* Main line */}
            <line
              x1={link.x1}
              y1={link.y1}
              x2={link.x2}
              y2={link.y2}
              stroke={link.color}
              strokeWidth="0.4"
              strokeOpacity={link.strength / 100}
              strokeDasharray="2 1"
            />
          </g>
        ))}

        {/* Enhanced animation trails */}
        {animationTrails
          ?.filter(trail => trail && trail.playerId && trail.points && Array.isArray(trail.points))
          .map(trail => (
            <g key={trail.playerId}>
              {/* Trail glow */}
              <polyline
                points={trail.points
                  .filter(
                    p =>
                      p &&
                      typeof p.x === 'number' &&
                      typeof p.y === 'number' &&
                      !isNaN(p.x) &&
                      !isNaN(p.y),
                  )
                  .map(p => `${p.x},${p.y}`)
                  .join(' ')}
                fill="none"
                stroke={trail.color || '#ffffff'}
                strokeWidth="1"
                opacity="0.4"
                filter="url(#fieldLineGlow)"
              />
              {/* Main trail */}
              <polyline
                points={trail.points
                  .filter(
                    p =>
                      p &&
                      typeof p.x === 'number' &&
                      typeof p.y === 'number' &&
                      !isNaN(p.x) &&
                      !isNaN(p.y),
                  )
                  .map(p => `${p.x},${p.y}`)
                  .join(' ')}
                fill="none"
                stroke={trail.color || '#ffffff'}
                strokeWidth="0.6"
                strokeDasharray="3 2"
                opacity="0.9"
              />
            </g>
          ))}
      </svg>

      {/* Modern formation strength overlay */}
      {isFormationStrengthVisible && (
        <>
          {(activeTeamContext === 'home' || activeTeamContext === 'both') && homeFormation && (
            <Modern3DFormationStrengthOverlay formation={homeFormation} team="home" />
          )}
          {(activeTeamContext === 'away' || activeTeamContext === 'both') && awayFormation && (
            <Modern3DFormationStrengthOverlay formation={awayFormation} team="away" />
          )}
        </>
      )}

      {/* Team formations */}
      {(activeTeamContext === 'home' || activeTeamContext === 'both') && renderTeam('home')}
      {(activeTeamContext === 'away' || activeTeamContext === 'both') && renderTeam('away')}

      {/* Advanced Vector Drawing Canvas */}
      <AdvancedVectorDrawingCanvas fieldRef={fieldRef} />

      {/* Professional Animation Timeline */}
      {!isPresentationMode && <ProfessionalAnimationTimeline />}

      {/* Weather control (for testing) */}
      <div className="absolute top-4 right-4 flex space-x-2 opacity-70 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setWeatherEffect('clear')}
          className={`px-2 py-1 text-xs rounded ${weatherEffect === 'clear' ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
        >
          ☀️
        </button>
        <button
          onClick={() => setWeatherEffect('rain')}
          className={`px-2 py-1 text-xs rounded ${weatherEffect === 'rain' ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
        >
          🌧️
        </button>
      </div>

      {/* Loading indicator */}
      {(!homeFormation || !awayFormation) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 ">
          <div className="text-center p-8">
            <div className="text-white text-2xl mb-4 font-bold">
              Loading Tactical Environment...
            </div>
            <div className="text-gray-300 text-lg">
              Home Formation: {homeFormation ? '✅ Ready' : '⏳ Loading...'} | Away Formation:{' '}
              {awayFormation ? '✅ Ready' : '⏳ Loading...'}
            </div>
            <div className="mt-4">
              <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Modern3DSoccerField);
