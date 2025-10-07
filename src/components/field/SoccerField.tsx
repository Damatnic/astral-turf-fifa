import React, { useRef, useCallback, useState, useMemo } from 'react';
import { useTacticsContext, useUIContext, useFranchiseContext } from '../../hooks';
import PlayerToken from './PlayerToken';
import type {
  RootState,
  FormationSlot,
  Player,
  TeamView,
  PlayCategory,
  Team,
  Formation,
} from '../../types';
import DrawingCanvas from './DrawingCanvas';
import { SettingsIcon } from '../ui/icons';
import AnimationTimeline from './AnimationTimeline';
import { calculateChemistryScore } from '../../services/chemistryService';

const SoccerFieldBackground: React.FC = () => (
  <div className="absolute inset-0 pitch-stripes">
    <svg width="100%" height="100%" viewBox="0 0 1050 680" className="absolute top-0 left-0">
      {/* Field Markings */}
      <rect
        x="1"
        y="1"
        width="1048"
        height="678"
        fill="none"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
      />
      <line x1="525" y1="1" x2="525" y2="679" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" />
      <circle
        cx="525"
        cy="340"
        r="91.5"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="525" cy="340" r="3" fill="rgba(255, 255, 255, 0.2)" />
      <rect
        x="1"
        y="130.5"
        width="165"
        height="419"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="1"
        y="248.5"
        width="55"
        height="183"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="110" cy="340" r="3" fill="rgba(255, 255, 255, 0.2)" />
      <path
        d="M 165 248.5 A 91.5 91.5 0 0 1 165 431.5"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="884"
        y="130.5"
        width="165"
        height="419"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="994"
        y="248.5"
        width="55"
        height="183"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="940" cy="340" r="3" fill="rgba(255, 255, 255, 0.2)" />
      <path
        d="M 884 248.5 A 91.5 91.5 0 0 0 884 431.5"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  </div>
);

const SetPieceContext: React.FC<{ category: PlayCategory }> = ({ category }) => {
  const contextFill = 'rgba(45, 212, 191, 0.1)';
  const contextStroke = 'rgba(45, 212, 191, 0.3)';

  const contexts: Record<string, React.ReactNode> = {
    'Attacking Corner': (
      <>
        <path
          d="M 1050 0 L 958.5 0 A 91.5 91.5 0 0 1 1050 91.5 Z"
          stroke={contextStroke}
          strokeWidth="2"
          fill={contextFill}
        />
        <path
          d="M 1050 680 L 958.5 680 A 91.5 91.5 0 0 0 1050 588.5 Z"
          stroke={contextStroke}
          strokeWidth="2"
          fill={contextFill}
        />
      </>
    ),
    'Defending Corner': (
      <>
        <path
          d="M 0 0 L 91.5 0 A 91.5 91.5 0 0 0 0 91.5 Z"
          stroke={contextStroke}
          strokeWidth="2"
          fill={contextFill}
        />
        <path
          d="M 0 680 L 91.5 680 A 91.5 91.5 0 0 1 0 588.5 Z"
          stroke={contextStroke}
          strokeWidth="2"
          fill={contextFill}
        />
      </>
    ),
    'Attacking Free Kick': (
      <circle
        cx="800"
        cy="340"
        r="91.5"
        stroke={contextStroke}
        strokeWidth="2"
        strokeDasharray="5 5"
        fill={contextFill}
      />
    ),
    'Defending Free Kick': (
      <circle
        cx="250"
        cy="340"
        r="91.5"
        stroke={contextStroke}
        strokeWidth="2"
        strokeDasharray="5 5"
        fill={contextFill}
      />
    ),
    'Throw-in': (
      <>
        <rect
          x="425"
          y="0"
          width="200"
          height="40"
          stroke={contextStroke}
          strokeWidth="2"
          fill={contextFill}
        />
        <rect
          x="425"
          y="640"
          width="200"
          height="40"
          stroke={contextStroke}
          strokeWidth="2"
          fill={contextFill}
        />
      </>
    ),
  };

  const contextSvg = contexts[category];
  if (!contextSvg) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1050 680"
      preserveAspectRatio="none"
    >
      {contextSvg}
    </svg>
  );
};

const FieldGrid: React.FC = () => {
  const gridLines: JSX.Element[] = [];
  // Vertical lines
  for (let i = 1; i < 10; i++) {
    gridLines.push(
      <line
        key={`v-${i}`}
        x1={i * 10}
        y1="0"
        x2={i * 10}
        y2="100"
        stroke="rgba(255, 255, 255, 0.05)"
        strokeWidth={0.2}
      />,
    );
  }
  // Horizontal lines
  for (let i = 1; i < 10; i++) {
    gridLines.push(
      <line
        key={`h-${i}`}
        x1="0"
        y1={i * 10}
        x2="100"
        y2={i * 10}
        stroke="rgba(255, 255, 255, 0.05)"
        strokeWidth={0.2}
      />,
    );
  }
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {gridLines}
    </svg>
  );
};

const mirrorPosition = (pos: { x: number; y: number }) => ({ x: 100 - pos.x, y: 100 - pos.y });

const FormationStrengthOverlay: React.FC = () => {
  const { tacticsState } = useTacticsContext();
  const { uiState } = useUIContext();
  const { formations, activeFormationIds } = tacticsState;
  const { activeTeamContext, isFormationStrengthVisible } = uiState;

  if (!isFormationStrengthVisible) {
    return null;
  }

  const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
  const formation = formations?.[activeFormationIds?.[activeTeam]];
  if (!formation) {
    return null;
  }

  const points = (formation?.slots ?? [])
    .filter(s => s && s.playerId && s.defaultPosition)
    .map(s => {
      const position = s.defaultPosition ?? { x: 50, y: 50 };
      return activeTeam === 'away' ? mirrorPosition(position) : position;
    });

  if (points.length < 3) {
    return null;
  }

  // Create a color stop for each player position
  const colorStops = points
    .filter(p => p && typeof p.x === 'number' && typeof p.y === 'number')
    .map(
      p =>
        `radial-gradient(circle at ${p.x}% ${p.y}%, rgba(45, 212, 191, 0.25) 0%, transparent 20%)`,
    )
    .join(', ');

  return (
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-500"
      style={{
        background: colorStops,
        opacity: isFormationStrengthVisible ? 1 : 0,
      }}
    />
  );
};

const SoccerField: React.FC = () => {
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
    positioningMode,
  } = uiState;

  const fieldRef = useRef<HTMLDivElement>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  const homeFormation = formations?.[activeFormationIds?.home];
  const awayFormation = formations?.[activeFormationIds?.away];

  if (!homeFormation || !awayFormation) {
    return <div>Loading Formation...</div>;
  }

  const activePlaybookItem = activePlaybookItemId ? playbook?.[activePlaybookItemId] : null;

  const uniqueTrailColors = useMemo(() => {
    if (!animationTrails || !Array.isArray(animationTrails)) {
      return [];
    }
    return [...new Set(animationTrails.filter(t => t && t.color).map(t => t.color))];
  }, [animationTrails]);

  const getChemistryLinks = (formation: Formation, team: Team) => {
    const links: {
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      opacity: number;
      score: number;
    }[] = [];
    const slotsWithPlayers = (formation?.slots ?? []).filter(
      s => s && s.playerId && s.defaultPosition,
    );
    const checkedPairs = new Set<string>();
    const shouldMirror = team === 'away';

    for (const slotA of slotsWithPlayers) {
      if (!slotA || !slotA.playerId || !slotA.defaultPosition) {
        continue;
      }

      const playerA = players?.find(p => p?.id === slotA.playerId);
      if (!playerA || !playerA.position) {
        continue;
      }

      for (const slotB of slotsWithPlayers) {
        if (!slotB || !slotB.playerId || !slotB.defaultPosition || slotA.id === slotB.id) {
          continue;
        }

        const pairKey = [slotA.id, slotB.id].sort().join('-');
        if (checkedPairs.has(pairKey)) {
          continue;
        }
        checkedPairs.add(pairKey);

        const playerB = players?.find(p => p?.id === slotB.playerId);
        if (!playerB || !playerB.position) {
          continue;
        }

        const posA = slotA.defaultPosition;
        const posB = slotB.defaultPosition;
        const dist = Math.sqrt(Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2));

        if (dist < 30) {
          // Adjacency threshold
          let posA = playerA.position;
          let posB = playerB.position;

          if (shouldMirror) {
            posA = mirrorPosition(posA);
            posB = mirrorPosition(posB);
          }

          const chemistryScore = calculateChemistryScore(
            playerA,
            playerB,
            chemistry ?? {},
            relationships ?? {},
            mentoringGroups?.[team] ?? {},
          );

          if (chemistryScore > 40) {
            // Only show links for decent chemistry
            const color = chemistryScore >= 75 ? '#2dd4bf' : '#facc15'; // teal-400 vs amber-400
            const opacity = chemistryScore >= 75 ? 0.7 : 0.5;
            links.push({
              key: pairKey,
              x1: posA.x,
              y1: posA.y,
              x2: posB.x,
              y2: posB.y,
              color,
              opacity,
              score: chemistryScore,
            });
          }
        }
      }
    }
    return links;
  };

  const chemistryLinks = useMemo(() => {
    let links: {
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      opacity: number;
      score: number;
    }[] = [];
    if (activeTeamContext === 'home' || activeTeamContext === 'both') {
      links = links.concat(getChemistryLinks(homeFormation, 'home'));
    }
    if (activeTeamContext === 'away' || activeTeamContext === 'both') {
      links = links.concat(getChemistryLinks(awayFormation, 'away'));
    }
    return links;
  }, [
    homeFormation,
    awayFormation,
    players,
    activeTeamContext,
    chemistry,
    relationships,
    mentoringGroups,
  ]);

  const handleFieldDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverSlotId(null);
      const playerId = e?.dataTransfer?.getData('text/plain');

      if (!fieldRef?.current || drawingTool !== 'select' || !playerId) {
        return;
      }

      // In snap mode, don't allow drops on the field itself
      if (positioningMode === 'snap') {
        return;
      }

      // Don't process if dropped on an interactive zone (player or slot)
      if ((e.target as HTMLElement).closest('[data-is-interactive-zone="true"]')) {
        return;
      }

      const fieldRect = fieldRef.current.getBoundingClientRect();
      const x = ((e.clientX - fieldRect.left) / fieldRect.width) * 100;
      const y = ((e.clientY - fieldRect.top) / fieldRect.height) * 100;

      dispatch({ type: 'UPDATE_PLAYER_POSITION', payload: { playerId, position: { x, y } } });
    },
    [dispatch, drawingTool, positioningMode],
  );

  const handleSlotDrop = (e: React.DragEvent<HTMLDivElement>, slot: FormationSlot, team: Team) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlotId(null);
    const playerId = e?.dataTransfer?.getData('text/plain');
    if (!playerId) {
      return;
    }

    if (slot.playerId === playerId) {
      return;
    }

    if (slot.playerId) {
      dispatch({
        type: 'OPEN_SLOT_ACTION_MENU',
        payload: {
          sourcePlayerId: playerId,
          targetSlotId: slot.id,
          targetPlayerId: slot.playerId,
          trigger: 'drag',
          position: { x: e.clientX, y: e.clientY },
        },
      });
    } else {
      // In free mode, update position; in snap mode, assign to slot
      if (positioningMode === 'free') {
        dispatch({
          type: 'UPDATE_PLAYER_POSITION',
          payload: { playerId, position: slot.defaultPosition },
        });
      } else {
        dispatch({ type: 'ASSIGN_PLAYER_TO_SLOT', payload: { slotId: slot.id, playerId, team } });
      }
    }
  };

  const handleActionBubbleClick = (e: React.MouseEvent, player: Player, slot: FormationSlot) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dispatch({
      type: 'OPEN_SLOT_ACTION_MENU',
      payload: {
        sourcePlayerId: player.id,
        targetSlotId: slot.id,
        targetPlayerId: player.id,
        trigger: 'click',
        position: { x: rect.left + rect.width / 2, y: rect.top },
      },
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, slotId: string | null = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlotId(slotId);
  };

  const getCursorStyle = () => {
    if (isPresentationMode) {
      return 'default';
    }
    if (drawingTool !== 'select') {
      return 'crosshair';
    }
    return 'default';
  };

  const renderTeam = (team: Team) => {
    const formation = team === 'home' ? homeFormation : awayFormation;
    const shouldMirror = team === 'away';

    // Get all players from this team
    const allTeamPlayers = (players ?? []).filter(p => p && p.team === team && p.position);

    // Map players to include their slot (if any) and position
    const teamPlayers = allTeamPlayers.map(player => {
      const slot = (formation?.slots ?? []).find(s => s && s.playerId === player.id);
      const playerPosition = player.position;
      const position = shouldMirror ? mirrorPosition(playerPosition) : playerPosition;
      return { player, slot, position };
    });

    const teamSlots = (formation?.slots ?? [])
      .filter(slot => slot && slot.defaultPosition)
      .map(slot => ({
        ...slot,
        defaultPosition: shouldMirror ? mirrorPosition(slot.defaultPosition) : slot.defaultPosition,
      }));

    return (
      <>
        {/* Render Players */}
        {teamPlayers.map(({ player, slot, position }) => (
          <div
            key={player.id}
            data-is-interactive-zone="true"
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();
              if (positioningMode === 'snap' && slot) {
                handleSlotDrop(e, slot, team);
              }
            }}
            onDragOver={e => {
              e.preventDefault();
              if (positioningMode === 'snap' && slot) {
                handleDragOver(e, slot.id);
              }
            }}
            className={`absolute group rounded-full ${slot && dragOverSlotId === slot.id && positioningMode === 'snap' ? 'ring-2 ring-teal-400' : ''}`}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: player.id === selectedPlayerId ? 15 : 5,
            }}
          >
            <PlayerToken
              player={player}
              isSelected={player.id === selectedPlayerId}
              isHighlightedByAI={highlightedByAIPlayerIds.includes(player.id)}
            />
            {!isPresentationMode && (
              <div
                onClick={e => slot && handleActionBubbleClick(e, player, slot)}
                className="absolute top-1/2 left-1/2 w-7 h-7 bg-slate-800/70 backdrop-blur-sm rounded-full border border-slate-500/50 flex items-center justify-center cursor-pointer hover:bg-teal-500/90 transition-all z-20"
                style={{ transform: 'translate(10px, 10px)' }}
                title="Player Actions"
              >
                <SettingsIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        {/* Render Empty Slots */}
        {positioningMode === 'snap' &&
          teamSlots
            .filter(s => !s.playerId)
            .map(slot => (
              <div
                key={`slot-zone-${slot.id}`}
                data-is-interactive-zone="true"
                onDrop={e => handleSlotDrop(e, slot, team)}
                onDragOver={e => handleDragOver(e, slot.id)}
                onDragLeave={() => setDragOverSlotId(null)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 rounded-full z-0 hover:bg-white/20 transition-all ${dragOverSlotId === slot.id ? 'bg-teal-500/20 ring-2 ring-teal-400' : ''}`}
                style={{ left: `${slot.defaultPosition.x}%`, top: `${slot.defaultPosition.y}%` }}
              />
            ))}
      </>
    );
  };

  return (
    <div
      className={`aspect-[105/68] w-full max-w-[95vh] relative shadow-2xl rounded-lg overflow-hidden border-4 border-slate-700 ${positioningMode === 'free' ? 'free-positioning-mode' : ''}`}
      ref={fieldRef}
      onDrop={handleFieldDrop}
      onDragOver={e => handleDragOver(e)}
      onDragLeave={() => setDragOverSlotId(null)}
      style={{ cursor: getCursorStyle() }}
    >
      <SoccerFieldBackground />
      {activePlaybookItem && <SetPieceContext category={activePlaybookItem.category} />}
      {isGridVisible && <FieldGrid />}
      <FormationStrengthOverlay />
      <div className="absolute inset-0">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {uniqueTrailColors.map(color => (
              <React.Fragment key={color}>
                <marker
                  id={`arrowhead-trail-${color.replace('#', '')}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                </marker>
                <marker
                  id={`dot-trail-${color.replace('#', '')}`}
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="3"
                  markerHeight="3"
                >
                  <circle cx="5" cy="5" r="3" fill={color} />
                </marker>
              </React.Fragment>
            ))}
          </defs>
          {/* Chemistry Links */}
          <g>
            {chemistryLinks.map(link => (
              <g key={link.key}>
                <title>Chemistry: {link.score}</title>
                <line
                  x1={link.x1}
                  y1={link.y1}
                  x2={link.x2}
                  y2={link.y2}
                  stroke={link.color}
                  strokeWidth="0.4"
                  strokeDasharray="1 1"
                  opacity={link.opacity}
                />
              </g>
            ))}
          </g>

          {animationTrails &&
            Array.isArray(animationTrails) &&
            animationTrails
              .filter(trail => trail && trail.points && Array.isArray(trail.points) && trail.color)
              .map(trail => (
                <polyline
                  key={trail.playerId}
                  points={trail.points
                    .filter((p: any) => p && typeof p.x === 'number' && typeof p.y === 'number')
                    .map((p: any) => `${p.x},${p.y}`)
                    .join(' ')}
                  fill="none"
                  stroke={trail.color}
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                  markerEnd={`url(#arrowhead-trail-${trail.color.replace('#', '')})`}
                  markerMid={`url(#dot-trail-${trail.color.replace('#', '')})`}
                />
              ))}
        </svg>

        {(activeTeamContext === 'home' || activeTeamContext === 'both') && renderTeam('home')}
        {(activeTeamContext === 'away' || activeTeamContext === 'both') && renderTeam('away')}
      </div>
      <DrawingCanvas fieldRef={fieldRef} />
      {!isPresentationMode && <AnimationTimeline />}
    </div>
  );
};

export default SoccerField;
