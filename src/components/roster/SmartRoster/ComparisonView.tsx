/**
 * ComparisonView Component
 *
 * Side-by-side player comparison interface
 */

import React from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ComparisonViewProps } from '../../../types/roster';
import { calculateOverall } from '../utils/rosterHelpers';

export default function ComparisonView({
  players,
  onRemovePlayer,
  onClearAll,
  maxPlayers = 4,
  className = '',
}: ComparisonViewProps) {
  if (players.length === 0) {
    return (
      <div className={`comparison-view empty ${className}`}>
        <p>Select players to compare</p>
        <span>Add up to {maxPlayers} players</span>
        <style>{`
          .comparison-view.empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            background: #f9fafb;
            border: 2px dashed #e5e7eb;
            border-radius: 12px;
            color: #9ca3af;
          }
          .comparison-view.empty p {
            font-size: 16px;
            font-weight: 600;
            color: #6b7280;
            margin: 0 0 4px 0;
          }
          .comparison-view.empty span {
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  const attributes = ['speed', 'passing', 'shooting', 'dribbling', 'tackling', 'positioning', 'stamina'] as const;

  // Calculate min/max for each attribute for highlighting
  const getAttributeRange = (attr: typeof attributes[number]) => {
    const values = players.map(p => p.attributes[attr]);
    return { min: Math.min(...values), max: Math.max(...values) };
  };

  return (
    <div className={`comparison-view ${className}`}>
      {/* Header */}
      <div className="comparison-header">
        <h3>Comparing {players.length} Players</h3>
        <button className="clear-button" onClick={onClearAll} type="button">
          Clear All
        </button>
      </div>

      {/* Comparison Grid */}
      <div className="comparison-grid" style={{ gridTemplateColumns: `repeat(${players.length}, 1fr)` }}>
        {players.map(player => {
          const overall = calculateOverall(player.attributes);
          return (
            <div key={player.id} className="player-column">
              {/* Player Header */}
              <div className="player-header">
                <button
                  className="remove-button"
                  onClick={() => onRemovePlayer(player.id)}
                  type="button"
                >
                  <X size={16} />
                </button>
                <h4>{player.name}</h4>
                <div className="player-meta">
                  <span>{player.positionRole || player.roleId}</span>
                  <span>#{player.jerseyNumber}</span>
                </div>
                <div className="overall-badge">{overall}</div>
              </div>

              {/* Attributes */}
              <div className="attributes-list">
                {attributes.map(attr => {
                  const value = player.attributes[attr];
                  const range = getAttributeRange(attr);
                  const isHighest = value === range.max && range.max !== range.min;
                  const isLowest = value === range.min && range.max !== range.min;

                  return (
                    <div
                      key={attr}
                      className={`attribute-row ${isHighest ? 'highest' : ''} ${isLowest ? 'lowest' : ''}`}
                    >
                      <span className="attr-value">{value}</span>
                      {isHighest && <TrendingUp size={14} className="trend-icon high" />}
                      {isLowest && <TrendingDown size={14} className="trend-icon low" />}
                      {!isHighest && !isLowest && <Minus size={14} className="trend-icon neutral" />}
                    </div>
                  );
                })}

                {/* Additional Stats */}
                <div className="stat-row">
                  <span className="stat-value">{player.age}y</span>
                </div>
                <div className="stat-row">
                  <span className="stat-value">{player.morale}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-value">{player.stamina}%</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Attribute Labels (sticky column) */}
        <div className="labels-column">
          <div className="labels-header">
            <div style={{ height: '120px' }} /> {/* Spacer for player header */}
          </div>
          <div className="labels-list">
            {attributes.map(attr => (
              <div key={attr} className="label-row">
                <span>{attr.charAt(0).toUpperCase() + attr.slice(1)}</span>
              </div>
            ))}
            <div className="label-row">
              <span>Age</span>
            </div>
            <div className="label-row">
              <span>Morale</span>
            </div>
            <div className="label-row">
              <span>Stamina</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .comparison-view {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .comparison-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .comparison-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .clear-button {
          padding: 6px 12px;
          background: #fee2e2;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #991b1b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-button:hover {
          background: #fecaca;
        }

        .comparison-grid {
          display: grid;
          gap: 16px;
          padding: 20px;
          position: relative;
        }

        .player-column {
          min-width: 150px;
        }

        .player-header {
          position: relative;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 16px;
          text-align: center;
        }

        .remove-button {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px;
          background: white;
          border: none;
          border-radius: 4px;
          color: #ef4444;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-button:hover {
          background: #fee2e2;
        }

        .player-header h4 {
          margin: 0 0 8px 0;
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
        }

        .player-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .overall-badge {
          display: inline-flex;
          padding: 4px 12px;
          background: #3b82f6;
          color: white;
          border-radius: 6px;
          font-size: 18px;
          font-weight: 700;
        }

        .attributes-list,
        .labels-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .attribute-row,
        .stat-row,
        .label-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px;
          background: #f9fafb;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          min-height: 36px;
        }

        .attribute-row.highest {
          background: #dcfce7;
          color: #166534;
        }

        .attribute-row.lowest {
          background: #fee2e2;
          color: #991b1b;
        }

        .attr-value,
        .stat-value {
          font-weight: 700;
        }

        .trend-icon {
          flex-shrink: 0;
        }

        .trend-icon.high {
          color: #10b981;
        }

        .trend-icon.low {
          color: #ef4444;
        }

        .trend-icon.neutral {
          color: #9ca3af;
        }

        .labels-column {
          position: absolute;
          left: 0;
          top: 0;
          background: white;
          padding: 20px 0 20px 20px;
          z-index: 1;
        }

        .label-row {
          justify-content: flex-start;
          background: transparent;
          font-weight: 600;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
