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
  compact = false,
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
      className={`
        bg-white cursor-pointer transition-all relative w-full
        ${compact ? 'p-2 rounded-md border' : 'p-4 rounded-xl border-2'}
        ${isSelected ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200' : 'border-gray-200'}
        ${isComparing ? 'border-amber-500 bg-amber-50' : ''}
        hover:border-blue-400 hover:shadow-md
        ${className}
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Header */}
      <div className={`flex items-center ${compact ? 'gap-1 mb-1' : 'gap-2 mb-3'}`}>
        <div 
          className={`${compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-xs'} rounded font-bold text-white tracking-wide`}
          style={{ backgroundColor: getPositionColor(player.roleId) }}
        >
          {player.positionRole || player.roleId}
        </div>
        <div 
          className={`${compact ? 'text-xl' : 'text-3xl'} font-extrabold ml-auto`}
          style={{ color: getOverallColor(overall) }}
        >
          {overall}
        </div>
        {isComparing && (
          <button className="p-1 text-amber-500" onClick={onCompareClick} type="button">
            <Star size={compact ? 12 : 16} fill="currentColor" />
          </button>
        )}
        {!isComparing && onCompareClick && (
          <button className="p-1 text-gray-400 hover:text-amber-500" onClick={onCompareClick} type="button">
            <Star size={compact ? 12 : 16} />
          </button>
        )}
      </div>

      {/* Player Info */}
      <div className={compact ? 'mb-1' : 'mb-3'}>
        <h3 className={`${compact ? 'text-xs' : 'text-base'} font-semibold text-gray-900 truncate mb-0.5`}>
          {player.name}
        </h3>
        <div className={`flex items-center gap-1.5 ${compact ? 'text-[9px]' : 'text-xs'} text-gray-600`}>
          <span>#{player.jerseyNumber}</span>
          <span>•</span>
          <span>{player.age}y</span>
          <span>•</span>
          <span className="truncate">{player.nationality}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-2 ${compact ? 'gap-1 mb-1' : 'gap-2 mb-3'}`}>
        <div className={`flex items-center ${compact ? 'gap-1 text-[9px]' : 'gap-1.5 text-xs'} text-gray-700`}>
          <Zap size={compact ? 10 : 14} className="text-gray-400" />
          <span className="font-semibold text-gray-600">PAC</span>
          <span className="font-bold">{player.attributes.speed}</span>
        </div>
        <div className={`flex items-center ${compact ? 'gap-1 text-[9px]' : 'gap-1.5 text-xs'} text-gray-700`}>
          <Activity size={compact ? 10 : 14} className="text-gray-400" />
          <span className="font-semibold text-gray-600">SHO</span>
          <span className="font-bold">{player.attributes.shooting}</span>
        </div>
        <div className={`flex items-center ${compact ? 'gap-1 text-[9px]' : 'gap-1.5 text-xs'} text-gray-700`}>
          <TrendingUp size={compact ? 10 : 14} className="text-gray-400" />
          <span className="font-semibold text-gray-600">PAS</span>
          <span className="font-bold">{player.attributes.passing}</span>
        </div>
        <div className={`flex items-center ${compact ? 'gap-1 text-[9px]' : 'gap-1.5 text-xs'} text-gray-700`}>
          <TrendingDown size={compact ? 10 : 14} className="text-gray-400" />
          <span className="font-semibold text-gray-600">DRI</span>
          <span className="font-bold">{player.attributes.dribbling}</span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {/* Morale */}
        <div className={`flex items-center ${compact ? 'gap-0.5 text-[9px]' : 'gap-1 text-xs'} text-gray-700`} title={`Morale: ${player.morale}`}>
          <Heart size={compact ? 10 : 14} style={{ color: getMoraleColor(player.morale) }} />
          {!compact && <span>{player.morale}</span>}
        </div>

        {/* Stamina */}
        <div 
          className={`flex items-center ${compact ? 'gap-0.5 text-[9px]' : 'gap-1 text-xs'} ${isTired ? 'text-amber-600' : 'text-gray-700'}`} 
          title={`Stamina: ${player.stamina}%`}
        >
          <Activity size={compact ? 10 : 14} />
          {!compact && <span>{player.stamina}%</span>}
        </div>

        {/* Injury Status */}
        {isInjured && (
          <div className={`flex items-center ${compact ? 'gap-0.5 text-[9px]' : 'gap-1 text-xs'} text-red-600`} title={player.availability.status}>
            <AlertCircle size={compact ? 10 : 14} />
            {!compact && <span>{player.availability.status}</span>}
          </div>
        )}
      </div>

      {/* Detailed Stats (optional) - Hide in compact mode */}
      {showDetailedStats && !compact && (
        <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between text-gray-700">
            <span className="font-semibold">Tackling</span>
            <span className="font-bold">{player.attributes.tackling}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span className="font-semibold">Positioning</span>
            <span className="font-bold">{player.attributes.positioning}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span className="font-semibold">Stamina</span>
            <span className="font-bold">{player.attributes.stamina}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
