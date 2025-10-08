/**
 * RosterGrid Component (Simplified - N        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            type="button"
          >
            {isCompact ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            <span className="hidden sm:inline">
              {isCompact ? 'Normal' : 'Compact'}
            </span>
          </button>
          <button
            onClick={handleViewModeToggle}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            type="button"
          >ing)
 *
 * Simplified roster grid without react-window dependency
 */

import React, { useState, useCallback } from 'react';
import { Grid as GridIcon, List, Minimize2, Maximize2 } from 'lucide-react';
import type { RosterGridProps } from '../../../types/roster';
import PlayerCard from './PlayerCard';

export default function RosterGrid({
  players,
  selectedPlayerIds = new Set<string>(),
  comparisonPlayerIds = [],
  viewMode = 'grid',
  gridColumns = 3,
  onPlayerSelect,
  onPlayerDoubleClick,
  onPlayerDragStart,
  onAddToComparison,
  onRemoveFromComparison,
  onCompareToggle,
  onViewModeChange,
  className = '',
}: RosterGridProps) {
  const [localViewMode, setLocalViewMode] = useState(viewMode);
  const [isCompact, setIsCompact] = useState(false);

  const handleViewModeToggle = useCallback(() => {
    const newMode = localViewMode === 'grid' ? 'list' : 'grid';
    setLocalViewMode(newMode);
    if (onViewModeChange) {
      onViewModeChange(newMode);
    }
  }, [localViewMode, onViewModeChange]);

  return (
    <div className={`flex flex-col h-full bg-slate-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="text-sm text-slate-300">
          {players.length} {players.length === 1 ? 'Player' : 'Players'}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-700 rounded-lg transition-colors"
            type="button"
          >
            {isCompact ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            <span className="hidden sm:inline">
              {isCompact ? 'Normal' : 'Compact'}
            </span>
          </button>
          <button
            onClick={handleViewModeToggle}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-700 rounded-lg transition-colors"
            type="button"
          >
            {localViewMode === 'grid' ? <List size={16} /> : <GridIcon size={16} />}
            <span className="hidden sm:inline">
              {localViewMode === 'grid' ? 'List View' : 'Grid View'}
            </span>
          </button>
        </div>
      </div>

      {/* Player Grid/List */}
      <div className="flex-1 overflow-y-auto p-3">
        {localViewMode === 'grid' ? (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${isCompact ? '120px' : '240px'}, 1fr))`,
            }}
          >
            {players.map((player) => {
              const isSelected = selectedPlayerIds.has(player.id);
              const isComparing = comparisonPlayerIds.includes(player.id);

              return (
                <div key={player.id} className="w-full">
                  <PlayerCard
                    player={player}
                    isSelected={isSelected}
                    isInComparison={isComparing}
                    isComparing={isComparing}
                    viewMode="grid"
                    compact={isCompact}
                    onClick={() => onPlayerSelect?.(player.id)}
                    onDoubleClick={() => onPlayerDoubleClick?.(player.id)}
                    onDragStart={(e: React.DragEvent<HTMLElement>) => onPlayerDragStart?.(player.id, e)}
                    onCompareClick={() => {
                      if (isComparing) {
                        onRemoveFromComparison?.(player.id);
                      } else {
                        onAddToComparison?.(player.id);
                      }
                      onCompareToggle?.(player.id);
                    }}
                    showDetailedStats={false}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {players.map((player) => {
              const isSelected = selectedPlayerIds.has(player.id);
              const isComparing = comparisonPlayerIds.includes(player.id);

              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSelected={isSelected}
                  isInComparison={isComparing}
                  isComparing={isComparing}
                  viewMode="list"
                  compact={isCompact}
                  onClick={() => onPlayerSelect?.(player.id)}
                  onDoubleClick={() => onPlayerDoubleClick?.(player.id)}
                  onDragStart={(e: React.DragEvent<HTMLElement>) => onPlayerDragStart?.(player.id, e)}
                  onCompareClick={() => {
                    if (isComparing) {
                      onRemoveFromComparison?.(player.id);
                    } else {
                      onAddToComparison?.(player.id);
                    }
                    onCompareToggle?.(player.id);
                  }}
                  showDetailedStats={true}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
