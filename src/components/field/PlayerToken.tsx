import React, { useRef, memo } from 'react';
import type { Player } from '../../types';
import { useUIContext, useTacticsContext } from '../../hooks';
import { PLAYER_ROLES } from '../../constants';
import { MedicalCrossIcon, MoraleIcon, SuspensionIcon } from '../ui/icons';

interface PlayerTokenProps {
  player: Player;
  isSelected: boolean;
  isHighlightedByAI: boolean;
}

const KitPattern: React.FC<{ player: Player }> = ({ player }) => {
  const { uiState } = useUIContext();
  const kit = uiState?.teamKits?.[player?.team];

  if (!kit) {
    return null;
  }

  switch (kit.pattern) {
    case 'stripes':
      return (
        <svg width="40" height="40" className="absolute inset-0">
          <defs>
            <pattern
              id={`stripes-${player.team}`}
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
            >
              <rect width="8" height="8" fill={kit?.primaryColor ?? '#000000'} />
              <rect width="4" height="8" fill={kit?.secondaryColor ?? '#ffffff'} />
            </pattern>
          </defs>
          <circle cx="20" cy="20" r="20" fill={`url(#stripes-${player.team})`} />
        </svg>
      );
    case 'hoops':
      return (
        <svg width="40" height="40" className="absolute inset-0">
          <defs>
            <pattern id={`hoops-${player.team}`} patternUnits="userSpaceOnUse" width="8" height="8">
              <rect width="8" height="8" fill={kit?.primaryColor ?? '#000000'} />
              <rect width="8" height="4" fill={kit?.secondaryColor ?? '#ffffff'} />
            </pattern>
          </defs>
          <circle cx="20" cy="20" r="20" fill={`url(#hoops-${player.team})`} />
        </svg>
      );
    case 'solid':
    default:
      return (
        <div
          className="w-full h-full rounded-full"
          style={{ backgroundColor: kit?.primaryColor ?? '#000000' }}
        ></div>
      );
  }
};

const PlayerToken: React.FC<PlayerTokenProps> = memo(
  ({ player, isSelected, isHighlightedByAI }) => {
    const { uiState, dispatch } = useUIContext();
    const { tacticsState } = useTacticsContext();
    const { drawingTool, isPresentationMode } = uiState;
    const { captainIds } = tacticsState;
    const isDraggable = drawingTool === 'select' && !isPresentationMode;
    const isCaptain = player?.id === captainIds?.home || player?.id === captainIds?.away;
    const selfRef = useRef<HTMLDivElement>(null);
    const playerRole = PLAYER_ROLES?.find(r => r?.id === player?.roleId);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
      if (!isDraggable) {
        e.preventDefault();
        return;
      }
      e?.dataTransfer?.setData('text/plain', player?.id ?? '');
      e.dataTransfer.effectAllowed = 'move';

      // Create a ghost image for dragging
      const ghostNode = e?.currentTarget?.cloneNode(true) as HTMLElement;
      if (ghostNode) {
        ghostNode.style.position = 'absolute';
        ghostNode.style.top = '-9999px';
        document.body.appendChild(ghostNode);
        e?.dataTransfer?.setDragImage(ghostNode, 24, 24); // Center the ghost image on cursor
        setTimeout(() => ghostNode.remove(), 0);
      }

      if (e?.currentTarget) {
        e.currentTarget.classList.add('dragging');
      }
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
      if (e?.currentTarget) {
        e.currentTarget.classList.remove('dragging');
      }
    };

    const handleSelect = (e: React.MouseEvent) => {
      e?.stopPropagation();
      dispatch({ type: 'SELECT_PLAYER', payload: player?.id ?? '' });
    };

    const availabilityIcon = () => {
      switch (player?.availability?.status) {
        case 'Minor Injury':
          return (
            <div
              title="Minor Injury"
              className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 border-2 border-white rounded-full flex items-center justify-center"
            >
              <MedicalCrossIcon className="w-2.5 h-2.5 text-yellow-400" />
            </div>
          );
        case 'Major Injury':
          return (
            <div
              title="Major Injury"
              className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 border-2 border-white rounded-full flex items-center justify-center"
            >
              <MedicalCrossIcon className="w-2.5 h-2.5 text-red-500" />
            </div>
          );
        case 'Suspended':
          return (
            <div
              title="Suspended"
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 border-2 border-white rounded-full flex items-center justify-center"
            >
              <SuspensionIcon className="w-2.5 h-2.5 text-white" />
            </div>
          );
        default:
          return null;
      }
    };

    const moraleColor = {
      Excellent: 'text-green-400',
      Good: 'text-green-500',
      Okay: 'text-yellow-400',
      Poor: 'text-orange-500',
      'Very Poor': 'text-red-500',
    }[player?.morale ?? 'Okay'];

    const staminaColor =
      (player?.stamina ?? 0) > 70
        ? 'bg-green-500'
        : (player?.stamina ?? 0) > 40
          ? 'bg-yellow-500'
          : 'bg-red-500';

    return (
      <div
        ref={selfRef}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseDown={handleSelect}
        className={`relative flex flex-col items-center transition-all duration-200 hover:scale-105 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      >
        <div className={`relative ${isHighlightedByAI ? 'ai-highlight' : ''} rounded-full`}>
          <div
            className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center text-white text-sm font-bold transition-all duration-200 overflow-hidden ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-teal-400 shadow-lg shadow-teal-400/25 scale-110' : 'shadow-md hover:shadow-lg'} border-black/30`}
            title={playerRole?.name || 'Player'}
          >
            <KitPattern player={player} />
            <span className="relative z-10 drop-shadow-lg">{playerRole?.abbreviation || '??'}</span>

            {/* Status Indicators */}
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-gray-900/50 rounded-full border border-gray-500/50 flex items-center p-px"
              title={`Stamina: ${player?.stamina ?? 0}%`}
            >
              <div
                className={`${staminaColor} h-1 rounded-full`}
                style={{ width: `${player?.stamina ?? 0}%` }}
              ></div>
            </div>
            <div
              title={`Morale: ${player?.morale ?? 'Unknown'}`}
              className="absolute -top-1 -left-1 w-4 h-4 p-0.5 bg-gray-800 rounded-full border-2 border-white flex items-center justify-center"
            >
              <MoraleIcon className={`w-full h-full ${moraleColor}`} />
            </div>
          </div>
          {isCaptain && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-4 h-5 bg-yellow-400 border-2 border-white rounded-sm flex items-center justify-center text-black font-bold text-[10px]"
              title="Captain"
            >
              C
            </div>
          )}
          {availabilityIcon()}
        </div>
        <p className="mt-1.5 text-xs font-semibold text-white bg-slate-750 px-1.5 py-0.5 rounded-md whitespace-nowrap">
          <span className="text-gray-400 mr-1">#{player?.jerseyNumber ?? '?'}</span>
          {player?.name ?? 'Unknown Player'}
        </p>
      </div>
    );
  },
);

export default PlayerToken;
