/**
 * RosterGrid Component
 *
 * Virtual scrolling roster grid with multiple view modes
 */

import React, { useState, useCallback, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Grid as GridIcon, List } from 'lucide-react';
import type { RosterGridProps } from '../../../types/roster';
import PlayerCard from './PlayerCard';
import { calculateGridColumns, getGridItemDimensions } from '../utils/rosterHelpers';

export default function RosterGrid({
  players,
  selectedPlayerIds = new Set<string>(),
  comparisonPlayerIds = [],
  viewMode = 'grid',
  onPlayerSelect,
  onPlayerDoubleClick,
  onCompareToggle,
  onViewModeChange,
  containerWidth = 1200,
  containerHeight = 800,
  className = '',
}: RosterGridProps) {
  const [localViewMode, setLocalViewMode] = useState(viewMode);

  const handleViewModeToggle = useCallback(() => {
    const newMode = localViewMode === 'grid' ? 'list' : 'grid';
    setLocalViewMode(newMode);
    if (onViewModeChange) {
      onViewModeChange(newMode);
    }
  }, [localViewMode, onViewModeChange]);

  // Calculate grid dimensions
  const gridConfig = useMemo(() => {
    if (localViewMode === 'list') {
      return {
        columnCount: 1,
        columnWidth: containerWidth - 20,
        rowHeight: 120,
      };
    }

    const columns = calculateGridColumns(containerWidth);
    const { width, height } = getGridItemDimensions(containerWidth, columns);

    return {
      columnCount: columns,
      columnWidth: width,
      rowHeight: height,
    };
  }, [localViewMode, containerWidth]);

  const rowCount = Math.ceil(players.length / gridConfig.columnCount);

  // Grid cell renderer
  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
      const index = rowIndex * gridConfig.columnCount + columnIndex;
      if (index >= players.length) {
        return null;
      }

      const player = players[index];
      const isSelected = selectedPlayerIds.has(player.id);
      const isComparing = comparisonPlayerIds.includes(player.id);

      return (
        <div style={{ ...style, padding: '8px' }}>
          <PlayerCard
            player={player}
            isSelected={isSelected}
            isInComparison={isComparing}
            isComparing={isComparing}
            viewMode={localViewMode}
            onClick={() => onPlayerSelect?.(player.id)}
            onDoubleClick={() => onPlayerDoubleClick?.(player.id)}
            onDragStart={() => {}}
            onCompareClick={() => onCompareToggle?.(player.id)}
            showDetailedStats={localViewMode === 'list'}
          />
        </div>
      );
    },
    [players, gridConfig.columnCount, selectedPlayerIds, comparisonPlayerIds, localViewMode, onPlayerSelect, onPlayerDoubleClick, onCompareToggle],
  );

  return (
    <div className={`roster-grid ${className}`}>
      {/* View Toggle */}
      <div className="grid-header">
        <div className="player-count">
          {players.length} {players.length === 1 ? 'Player' : 'Players'}
        </div>
        <button className="view-toggle" onClick={handleViewModeToggle} type="button">
          {localViewMode === 'grid' ? <List size={20} /> : <GridIcon size={20} />}
          <span>{localViewMode === 'grid' ? 'List View' : 'Grid View'}</span>
        </button>
      </div>

      {/* Grid */}
      {players.length > 0 ? (
        <Grid
          columnCount={gridConfig.columnCount}
          columnWidth={gridConfig.columnWidth}
          height={containerHeight - 60}
          rowCount={rowCount}
          rowHeight={gridConfig.rowHeight}
          width={containerWidth}
          className="grid-container"
        >
          {Cell}
        </Grid>
      ) : (
        <div className="empty-state">
          <GridIcon size={48} />
          <p>No players found</p>
          <span>Try adjusting your filters</span>
        </div>
      )}

      <style>{`
        .roster-grid {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f9fafb;
          border-radius: 12px;
          overflow: hidden;
        }

        .grid-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .player-count {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
        }

        .view-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-toggle:hover {
          background: #e5e7eb;
        }

        .grid-container {
          flex: 1;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #9ca3af;
        }

        .empty-state svg {
          margin-bottom: 16px;
        }

        .empty-state p {
          font-size: 18px;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 4px 0;
        }

        .empty-state span {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
