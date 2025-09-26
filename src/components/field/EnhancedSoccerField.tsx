import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useTacticsContext, useUIContext, useFranchiseContext } from '../../hooks';
import type { Formation, FormationSlot, Player, Team, DrawingShape } from '../../types';
import { PLAYER_ROLES } from '../../constants';
import PlayerToken from './PlayerToken';
import DrawingCanvas from './DrawingCanvas';
import AnimationTimeline from './AnimationTimeline';

interface EnhancedSoccerFieldProps {
  className?: string;
}

// Performance optimized formation strength overlay
const FormationStrengthOverlay: React.FC<{ formation: Formation; team: Team }> = React.memo(
  ({ formation, team }) => {
    const strengthZones = useMemo(() => {
      if (!formation?.slots || !Array.isArray(formation.slots)) {
        // // console.warn('FormationStrengthOverlay: Invalid formation slots');
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
          x: slot.position.x,
          y: slot.position.y,
          strength: slot.playerId ? 85 : 30, // Mock strength calculation
          color: team === 'home' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        }));
    }, [formation?.slots, team]);

    return (
      <div className="absolute inset-0 pointer-events-none">
        {strengthZones.map(zone => (
          <div
            key={zone.id}
            className="absolute rounded-full border-2 border-opacity-50 transition-all duration-300"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.strength / 5}px`,
              height: `${zone.strength / 5}px`,
              backgroundColor: zone.color,
              borderColor: zone.color,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    );
  },
);

// Enhanced formation slot with better visual feedback
const FormationSlot: React.FC<{
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
    // Validate slot data
    if (
      !slot ||
      !slot.position ||
      typeof slot.position.x !== 'number' ||
      typeof slot.position.y !== 'number'
    ) {
      // // console.warn('FormationSlot: Invalid slot data', slot);
      return null;
    }

    const playerRole =
      player && player.roleId ? PLAYER_ROLES.find(r => r?.id === player.roleId) : null;
    const slotRole = slot.roleId ? PLAYER_ROLES.find(r => r?.id === slot.roleId) : null;

    return (
      <div
        className={`
        absolute w-12 h-12 rounded-full border-2 transition-all duration-200 cursor-pointer
        ${isDragOver ? 'border-yellow-400 bg-yellow-400/20 scale-110' : ''}
        ${isHighlighted ? 'border-green-400 bg-green-400/20' : ''}
        ${team === 'home' ? 'border-blue-400/50' : 'border-red-400/50'}
        ${!player ? 'border-dashed bg-gray-800/30' : ''}
      `}
        style={{
          left: `${Math.max(0, Math.min(100, slot.position.x))}%`,
          top: `${Math.max(0, Math.min(100, slot.position.y))}%`,
          transform: 'translate(-50%, -50%)',
        }}
        onDrop={e => onDrop(e, slot, team)}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        data-is-interactive-zone="true"
      >
        {player ? (
          <PlayerToken player={player} isSelected={false} isHighlightedByAI={isHighlighted} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className={`
            text-xs font-bold uppercase tracking-wider
            ${team === 'home' ? 'text-blue-400' : 'text-red-400'}
          `}
            >
              {slotRole?.abbreviation ||
                (slot.roleId ? slot.roleId.slice(0, 2).toUpperCase() : '??')}
            </div>
          </div>
        )}
      </div>
    );
  },
);

const EnhancedSoccerField: React.FC<EnhancedSoccerFieldProps> = ({ className = '' }) => {
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

  // Memoized formation data with comprehensive validation
  const homeFormation = useMemo(() => {
    const formation = formations?.[activeFormationIds?.home];
    if (!formation || !formation.slots || !Array.isArray(formation.slots)) {
      // // console.warn('Invalid home formation data:', formation);
      return null;
    }
    return formation;
  }, [formations, activeFormationIds?.home]);

  const awayFormation = useMemo(() => {
    const formation = formations?.[activeFormationIds?.away];
    if (!formation || !formation.slots || !Array.isArray(formation.slots)) {
      // // console.warn('Invalid away formation data:', formation);
      return null;
    }
    return formation;
  }, [formations, activeFormationIds?.away]);

  // Error boundary for missing formations
  if (!homeFormation || !awayFormation) {
    return (
      <div className="flex items-center justify-center h-full bg-red-900/20 border border-red-500/30 rounded-lg">
        <div className="text-center text-red-400">
          <div className="text-lg font-bold mb-2">⚠️ Formation Error</div>
          <div className="text-sm">Missing formation data. Please select valid formations.</div>
          <div className="text-xs mt-2 text-red-300">
            Home: {homeFormation ? '✓' : '✗'} | Away: {awayFormation ? '✓' : '✗'}
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

      // Validation checks
      if (!fieldRef?.current || !playerId) {
        // // console.warn('Invalid drop: missing field reference or player ID');
        return;
      }

      if (drawingTool !== 'select') {
        // // console.warn('Invalid drop: not in select mode');
        return;
      }

      if (positioningMode === 'snap') {
        // // console.warn('Invalid drop: snap mode active, use formation slots');
        return;
      }

      // Don't process if dropped on an interactive zone
      if ((e.target as HTMLElement).closest('[data-is-interactive-zone="true"]')) {
        return;
      }

      const player = players?.find(p => p?.id === playerId);
      if (!player || !player.id) {
        // // console.warn('Invalid drop: player not found or invalid player data', { playerId, player });
        return;
      }

      try {
        const fieldRect = fieldRef.current.getBoundingClientRect();
        if (!fieldRect || fieldRect.width === 0 || fieldRect.height === 0) {
          // // console.warn('Invalid field dimensions for drop calculation');
          return;
        }

        const x = Math.max(5, Math.min(95, ((e.clientX - fieldRect.left) / fieldRect.width) * 100));
        const y = Math.max(5, Math.min(95, ((e.clientY - fieldRect.top) / fieldRect.height) * 100));

        if (isNaN(x) || isNaN(y)) {
          // // console.warn('Invalid coordinates calculated for drop', { x, y, clientX: e.clientX, clientY: e.clientY });
          return;
        }

        dispatch({ type: 'UPDATE_PLAYER_POSITION', payload: { playerId, position: { x, y } } });
      } catch (_error) {
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
        // // console.warn('Invalid slot drop: player not found or invalid player data', { playerId, player });
        return;
      }

      // Validate slot data
      if (
        !slot ||
        !slot.id ||
        !slot.position ||
        typeof slot.position.x !== 'number' ||
        typeof slot.position.y !== 'number'
      ) {
        // // console.warn('Invalid slot drop: slot data is invalid', { slot });
        return;
      }

      try {
        // If slot is occupied, swap players
        if (slot.playerId && slot.playerId !== playerId) {
          dispatch({
            type: 'SWAP_PLAYERS',
            payload: { playerId1: playerId, playerId2: slot.playerId },
          });
        } else {
          // Assign player to slot
          dispatch({ type: 'ASSIGN_PLAYER_TO_SLOT', payload: { slotId: slot.id, playerId, team } });
        }
      } catch (_error) {
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
        // // console.warn(`renderTeam: Invalid formation for ${team} team`, formation);
        return null;
      }

      return (
        <div className="absolute inset-0">
          {formation.slots
            .filter(slot => slot && slot.id && slot.position)
            .map(slot => {
              // Additional slot validation
              if (
                !slot.position ||
                typeof slot.position.x !== 'number' ||
                typeof slot.position.y !== 'number'
              ) {
                // // console.warn('renderTeam: Skipping slot with invalid position', slot);
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
                <FormationSlot
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

  // Optimized chemistry links rendering with comprehensive validation
  const chemistryLinks = useMemo(() => {
    if (!chemistry || activeTeamContext === 'none' || !homeFormation || !awayFormation) {
      return [];
    }

    const links: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      strength: number;
      color: string;
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
                  !isNaN(slot1.position.x) &&
                  !isNaN(slot1.position.y) &&
                  !isNaN(slot2.position.x) &&
                  !isNaN(slot2.position.y)
                ) {
                  links.push({
                    x1: slot1.position.x,
                    y1: slot1.position.y,
                    x2: slot2.position.x,
                    y2: slot2.position.y,
                    strength: chemistryScore,
                    color: chemistryScore > 80 ? '#10b981' : '#f59e0b',
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
        relative w-full h-full bg-gradient-to-br from-green-900/20 to-green-800/30
        border-2 border-white/20 rounded-lg overflow-hidden
        ${className}
      `}
      onDrop={handleFieldDrop}
      onDragOver={e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
    >
      {/* Field markings */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Center circle */}
        <circle
          cx="50"
          cy="50"
          r="9.15"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.2"
        />
        <circle cx="50" cy="50" r="0.5" fill="rgba(255,255,255,0.3)" />

        {/* Center line */}
        <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.2" />

        {/* Penalty boxes */}
        <rect
          x="0"
          y="21.1"
          width="16.5"
          height="57.8"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.2"
        />
        <rect
          x="83.5"
          y="21.1"
          width="16.5"
          height="57.8"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.2"
        />

        {/* Goal areas */}
        <rect
          x="0"
          y="36.8"
          width="5.5"
          height="26.4"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.2"
        />
        <rect
          x="94.5"
          y="36.8"
          width="5.5"
          height="26.4"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.2"
        />

        {/* Grid overlay */}
        {isGridVisible && (
          <g stroke="rgba(255,255,255,0.1)" strokeWidth="0.1">
            {Array.from({ length: 11 }, (_, i) => (
              <g key={i}>
                <line x1={i * 10} y1="0" x2={i * 10} y2="100" />
                <line x1="0" y1={i * 10} x2="100" y2={i * 10} />
              </g>
            ))}
          </g>
        )}

        {/* Chemistry links */}
        {chemistryLinks.map((link, index) => (
          <line
            key={index}
            x1={link.x1}
            y1={link.y1}
            x2={link.x2}
            y2={link.y2}
            stroke={link.color}
            strokeWidth="0.3"
            strokeOpacity={link.strength / 100}
            strokeDasharray="2 1"
          />
        ))}

        {/* Animation trails */}
        {animationTrails
          ?.filter(trail => trail && trail.playerId && trail.points && Array.isArray(trail.points))
          .map(trail => (
            <polyline
              key={trail.playerId}
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
              strokeWidth="0.5"
              strokeDasharray="2 2"
              opacity="0.8"
            />
          ))}
      </svg>

      {/* Formation strength overlay */}
      {isFormationStrengthVisible && (
        <>
          {(activeTeamContext === 'home' || activeTeamContext === 'both') && homeFormation && (
            <FormationStrengthOverlay formation={homeFormation} team="home" />
          )}
          {(activeTeamContext === 'away' || activeTeamContext === 'both') && awayFormation && (
            <FormationStrengthOverlay formation={awayFormation} team="away" />
          )}
        </>
      )}

      {/* Team formations */}
      {(activeTeamContext === 'home' || activeTeamContext === 'both') && renderTeam('home')}
      {(activeTeamContext === 'away' || activeTeamContext === 'both') && renderTeam('away')}

      {/* Drawing canvas */}
      <DrawingCanvas fieldRef={fieldRef} />

      {/* Animation timeline */}
      {!isPresentationMode && <AnimationTimeline />}

      {/* Loading indicator for performance */}
      {(!homeFormation || !awayFormation) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="text-white text-lg mb-2">Loading formations...</div>
            <div className="text-gray-300 text-sm">
              Home: {homeFormation ? 'Ready' : 'Loading...'} | Away:{' '}
              {awayFormation ? 'Ready' : 'Loading...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(EnhancedSoccerField);
