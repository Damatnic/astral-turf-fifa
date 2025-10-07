/**
 * PlayerCard Component
 *
 * Enhanced player card for roster display
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, TrendingDown, Activity, Heart, Zap, AlertCircle } from 'lucide-react';
import type { PlayerCardProps } from '../../../types/roster';
import { calculateOverall } from '../utils/rosterHelpers';

export default function PlayerCard({
  player,
  isSelected = false,
  isComparing = false,
  onClick,
  onDoubleClick,
  onCompareClick,
  showDetailedStats = false,
  className = '',
}: PlayerCardProps) {
  const overall = calculateOverall(player.attributes);
  const isInjured = player.availability.status !== 'Available';
  const isTired = player.stamina < 70;

  const getPositionColor = (roleId: string): string => {
    const colors: Record<string, string> = {
      GK: '#f59e0b',
      CB: '#3b82f6',
      CDM: '#8b5cf6',
      CM: '#10b981',
      CAM: '#ec4899',
      ST: '#ef4444',
      CF: '#f97316',
    };
    return colors[roleId] || '#6b7280';
  };

  const getOverallColor = (rating: number): string => {
    if (rating >= 85) {return '#10b981';}
    if (rating >= 75) {return '#3b82f6';}
    if (rating >= 65) {return '#f59e0b';}
    return '#ef4444';
  };

  const getMoraleColor = (morale: string): string => {
    const colors: Record<string, string> = {
      Excellent: '#10b981',
      Good: '#3b82f6',
      Okay: '#f59e0b',
      Poor: '#ef4444',
      'Very Poor': '#dc2626',
      Terrible: '#991b1b',
    };
    return colors[morale] || '#6b7280';
  };

  return (
    <motion.div
      className={`player-card ${isSelected ? 'selected' : ''} ${isComparing ? 'comparing' : ''} ${className}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Header */}
      <div className="card-header">
        <div className="position-badge" style={{ backgroundColor: getPositionColor(player.roleId) }}>
          {player.positionRole || player.roleId}
        </div>
        <div className="overall-rating" style={{ color: getOverallColor(overall) }}>
          {overall}
        </div>
        {isComparing && (
          <button className="compare-button active" onClick={onCompareClick} type="button">
            <Star size={16} fill="currentColor" />
          </button>
        )}
        {!isComparing && onCompareClick && (
          <button className="compare-button" onClick={onCompareClick} type="button">
            <Star size={16} />
          </button>
        )}
      </div>

      {/* Player Info */}
      <div className="player-info">
        <h3 className="player-name">{player.name}</h3>
        <div className="player-meta">
          <span>#{player.jerseyNumber}</span>
          <span>•</span>
          <span>{player.age}y</span>
          <span>•</span>
          <span>{player.nationality}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-item">
          <Zap size={14} />
          <span className="stat-label">PAC</span>
          <span className="stat-value">{player.attributes.speed}</span>
        </div>
        <div className="stat-item">
          <Activity size={14} />
          <span className="stat-label">SHO</span>
          <span className="stat-value">{player.attributes.shooting}</span>
        </div>
        <div className="stat-item">
          <TrendingUp size={14} />
          <span className="stat-label">PAS</span>
          <span className="stat-value">{player.attributes.passing}</span>
        </div>
        <div className="stat-item">
          <TrendingDown size={14} />
          <span className="stat-label">DRI</span>
          <span className="stat-value">{player.attributes.dribbling}</span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="status-indicators">
        {/* Morale */}
        <div className="indicator" title={`Morale: ${player.morale}`}>
          <Heart size={14} style={{ color: getMoraleColor(player.morale) }} />
          <span>{player.morale}</span>
        </div>

        {/* Stamina */}
        <div className={`indicator ${isTired ? 'warning' : ''}`} title={`Stamina: ${player.stamina}%`}>
          <Activity size={14} />
          <span>{player.stamina}%</span>
        </div>

        {/* Injury Status */}
        {isInjured && (
          <div className="indicator error" title={player.availability.status}>
            <AlertCircle size={14} />
            <span>{player.availability.status}</span>
          </div>
        )}
      </div>

      {/* Detailed Stats (optional) */}
      {showDetailedStats && (
        <div className="detailed-stats">
          <div className="stat-row">
            <span>Tackling</span>
            <span>{player.attributes.tackling}</span>
          </div>
          <div className="stat-row">
            <span>Positioning</span>
            <span>{player.attributes.positioning}</span>
          </div>
          <div className="stat-row">
            <span>Stamina</span>
            <span>{player.attributes.stamina}</span>
          </div>
        </div>
      )}

      <style>{`
        .player-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .player-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .player-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .player-card.comparing {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .position-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          color: white;
          letter-spacing: 0.5px;
        }

        .overall-rating {
          font-size: 24px;
          font-weight: 800;
          margin-left: auto;
        }

        .compare-button {
          padding: 4px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .compare-button:hover {
          color: #f59e0b;
          background: #fffbeb;
        }

        .compare-button.active {
          color: #f59e0b;
        }

        .player-info {
          margin-bottom: 12px;
        }

        .player-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .player-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #374151;
        }

        .stat-item svg {
          color: #9ca3af;
        }

        .stat-label {
          font-weight: 600;
          color: #6b7280;
        }

        .stat-value {
          margin-left: auto;
          font-weight: 700;
          color: #1f2937;
        }

        .status-indicators {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }

        .indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #6b7280;
          padding: 4px 8px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .indicator.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .indicator.error {
          background: #fee2e2;
          color: #991b1b;
        }

        .detailed-stats {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 4px 0;
          color: #374151;
        }

        .stat-row span:first-child {
          color: #6b7280;
        }

        .stat-row span:last-child {
          font-weight: 600;
        }
      `}</style>
    </motion.div>
  );
}
