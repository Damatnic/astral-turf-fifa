import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import { SwapIcon, CompareIcon, CaptainIcon, TrashIcon, BackIcon } from '../ui/icons';
import type { Player, Team } from '../../types';

const ActionButton: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  title: string;
}> = ({ onClick, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-full flex items-center px-3 py-2 text-sm text-left text-gray-200 hover:bg-teal-600 rounded-md transition-colors"
  >
    {children}
  </button>
);

const PlayerSwapListItem: React.FC<{
  player: Player;
  onSwap: (targetPlayerId: string) => void;
  onCompare: (targetPlayerId: string) => void;
}> = ({ player, onSwap, onCompare }) => {
  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompare(player.id);
  };

  return (
    <div
      onClick={() => onSwap(player.id)}
      className="group flex items-center justify-between px-2 py-1.5 text-sm text-gray-200 hover:bg-teal-600 rounded-md transition-colors cursor-pointer"
    >
      <div className="flex items-center truncate">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs mr-2 flex-shrink-0"
          style={{ backgroundColor: player.teamColor, fontSize: '10px' }}
        >
          {player.jerseyNumber}
        </div>
        <span className="truncate">{player.name}</span>
      </div>
      <button
        onClick={handleCompareClick}
        title={`Compare with ${player.name}`}
        className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-teal-500/50 rounded-full transition-all"
      >
        <CompareIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

const SlotActionMenu: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
  const { activeModal, slotActionMenuData } = uiState;
  const { players, formations, activeFormationIds, captainIds } = tacticsState;
  const menuRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'main' | 'swap-list'>('main');
  const [searchQuery, setSearchQuery] = useState('');

  const isSlotActionMenuOpen = activeModal === 'slotActionMenu';

  useEffect(() => {
    if (isSlotActionMenuOpen) {
      setView('main');
      setSearchQuery('');
    }
  }, [slotActionMenuData, isSlotActionMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSlotActionMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        dispatch({ type: 'CLOSE_SLOT_ACTION_MENU' });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSlotActionMenuOpen, dispatch]);

  if (!isSlotActionMenuOpen || !slotActionMenuData) {
    return null;
  }

  const { sourcePlayerId, targetPlayerId, trigger, position } = slotActionMenuData;

  const sourcePlayer = players.find(p => p.id === sourcePlayerId);
  const targetPlayer = players.find(p => p.id === targetPlayerId);

  if (!sourcePlayer) {
    return null;
  }

  const activeTeam = sourcePlayer.team;
  const activeFormation = formations[activeFormationIds[activeTeam]];
  if (!activeFormation) {
    return null;
  }
  const sourceSlot = activeFormation.slots.find(s => s.playerId === sourcePlayerId);

  const canSwapOnDrag = !!sourceSlot && !!targetPlayerId && sourcePlayerId !== targetPlayerId;
  const isCaptain = captainIds[activeTeam] === sourcePlayerId;

  const handleAction = (decision: 'replace' | 'bench' | 'captain') => {
    tacticsDispatch({ type: 'RESOLVE_SLOT_ACTION', payload: { decision } });
  };

  const handleDragSwap = () => {
    tacticsDispatch({ type: 'RESOLVE_SLOT_ACTION', payload: { decision: 'swap' } });
  };

  const handleDirectSwap = (otherPlayerId: string) => {
    tacticsDispatch({
      type: 'SWAP_PLAYERS',
      payload: { sourcePlayerId, targetPlayerId: otherPlayerId },
    });
  };

  const handleCompare = (otherPlayerId: string) => {
    dispatch({ type: 'SET_EDITING_PLAYER_ID', payload: sourcePlayerId });
    dispatch({ type: 'SET_COMPARE_PLAYER_ID', payload: otherPlayerId });
    dispatch({ type: 'OPEN_MODAL', payload: 'comparePlayer' });
  };

  const handleOpenCompare = () => {
    if (!targetPlayer) {
      return;
    }
    dispatch({ type: 'SET_EDITING_PLAYER_ID', payload: targetPlayer.id });
    dispatch({ type: 'SET_COMPARE_PLAYER_ID', payload: null });
    dispatch({ type: 'OPEN_MODAL', payload: 'comparePlayer' });
  };

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform:
      trigger === 'click' ? 'translate(-50%, calc(-100% - 10px))' : 'translate(-50%, -50%)',
    zIndex: 50,
  };

  const availablePlayers = useMemo(() => {
    if (!activeFormation) {
      return { onField: [], benched: [] };
    }
    const playersOnFieldIds = new Set(
      activeFormation.slots.map(slot => slot.playerId).filter(Boolean)
    );
    const filtered = players.filter(p => p.id !== sourcePlayerId && p.team === activeTeam);

    const onField = filtered.filter(p => playersOnFieldIds.has(p.id));
    const benched = filtered.filter(p => !playersOnFieldIds.has(p.id));

    if (!searchQuery) {
      return { onField, benched };
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    return {
      onField: onField.filter(p => p.name.toLowerCase().includes(lowerCaseQuery)),
      benched: benched.filter(p => p.name.toLowerCase().includes(lowerCaseQuery)),
    };
  }, [players, activeFormation, sourcePlayerId, activeTeam, searchQuery]);

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-gray-800/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-600/50 w-56 p-2 min-h-[100px] flex flex-col animate-fade-in-scale"
      data-menu-item="true"
    >
      {view === 'main' && (
        <>
          {trigger === 'click' && targetPlayer && (
            <div className="px-2 pb-2 mb-2 border-b border-gray-700">
              <p className="font-bold text-white truncate">{targetPlayer.name}</p>
              <p className="text-xs text-gray-400">Player Actions</p>
            </div>
          )}
          <div className="space-y-1">
            {trigger === 'drag' && targetPlayer && (
              <>
                <ActionButton
                  onClick={e => {
                    e.stopPropagation();
                    handleCompare(targetPlayer.id);
                  }}
                  title={`Compare ${sourcePlayer.name} vs ${targetPlayer.name}`}
                >
                  <CompareIcon className="w-4 h-4 mr-2" />
                  <span>Compare</span>
                </ActionButton>
                {canSwapOnDrag && (
                  <ActionButton
                    onClick={e => {
                      e.stopPropagation();
                      handleDragSwap();
                    }}
                    title={`Swap with ${targetPlayer.name}`}
                  >
                    <SwapIcon className="w-4 h-4 mr-2" />
                    <span>Swap</span>
                  </ActionButton>
                )}
                <ActionButton
                  onClick={e => {
                    e.stopPropagation();
                    handleAction('replace');
                  }}
                  title={`Move ${targetPlayer.name} to bench`}
                >
                  <TrashIcon className="w-4 h-4 mr-2 text-red-500" />
                  <span className="text-red-400">Replace</span>
                </ActionButton>
              </>
            )}
            {trigger === 'click' && targetPlayer && (
              <>
                <ActionButton
                  onClick={e => {
                    e.stopPropagation();
                    setView('swap-list');
                  }}
                  title="Swap this player"
                >
                  <SwapIcon className="w-4 h-4 mr-2" />
                  <span>Swap with...</span>
                </ActionButton>
                <ActionButton
                  onClick={e => {
                    e.stopPropagation();
                    handleAction('bench');
                  }}
                  title="Move to Bench"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  <span>Move to Bench</span>
                </ActionButton>
                <ActionButton
                  onClick={e => {
                    e.stopPropagation();
                    handleOpenCompare();
                  }}
                  title="Compare this player"
                >
                  <CompareIcon className="w-4 h-4 mr-2" />
                  <span>Compare</span>
                </ActionButton>
                <ActionButton
                  onClick={e => {
                    e.stopPropagation();
                    handleAction('captain');
                  }}
                  title={isCaptain ? 'Remove Captain' : 'Make Captain'}
                >
                  <CaptainIcon className={`w-4 h-4 mr-2 ${isCaptain ? 'text-yellow-400' : ''}`} />
                  <span>{isCaptain ? 'Is Captain' : 'Make Captain'}</span>
                </ActionButton>
              </>
            )}
          </div>
        </>
      )}
      {view === 'swap-list' && (
        <div className="flex flex-col flex-grow min-h-0">
          <div className="flex items-center px-1 pb-2 mb-2 border-b border-gray-700 flex-shrink-0">
            <button
              onClick={() => setView('main')}
              className="p-1 mr-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
            >
              <BackIcon className="w-4 h-4" />
            </button>
            <p className="font-bold text-white">Swap with</p>
          </div>
          <div className="px-1 mb-2 flex-shrink-0">
            <input
              type="text"
              placeholder="Search player..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-xs"
            />
          </div>
          <div className="space-y-3 overflow-y-auto pr-1 flex-grow">
            {availablePlayers.onField.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-500 px-2 mb-1">On Field</h4>
                <div className="space-y-1">
                  {availablePlayers.onField.map(p => (
                    <PlayerSwapListItem
                      key={p.id}
                      player={p}
                      onSwap={handleDirectSwap}
                      onCompare={handleCompare}
                    />
                  ))}
                </div>
              </div>
            )}
            {availablePlayers.benched.length > 0 && (
              <div className={availablePlayers.onField.length > 0 ? 'mt-3' : ''}>
                <h4 className="text-xs font-bold uppercase text-gray-500 px-2 mb-1">Bench</h4>
                <div className="space-y-1">
                  {availablePlayers.benched.map(p => (
                    <PlayerSwapListItem
                      key={p.id}
                      player={p}
                      onSwap={handleDirectSwap}
                      onCompare={handleCompare}
                    />
                  ))}
                </div>
              </div>
            )}
            {availablePlayers.onField.length === 0 && availablePlayers.benched.length === 0 && (
              <p className="text-center text-xs text-gray-500 py-4">No players found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotActionMenu;
