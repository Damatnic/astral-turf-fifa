/**
 * Player Stats Popover
 * 
 * Displays detailed player stats when hovering or clicking on player tokens
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Activity, Award, Heart, Zap } from 'lucide-react';
import type { Player } from '../../types';

interface PlayerStatsPopoverProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  triggerRef?: React.RefObject<HTMLElement>;
}

export const PlayerStatsPopover: React.FC<PlayerStatsPopoverProps> = ({
  player,
  isOpen,
  onClose,
  position,
  triggerRef
}) => {
  if (!isOpen) return null;

  const attributes = player.attributes as any;
  const mainStats = [
    { label: 'PAC', value: attributes?.pace || 0, color: 'text-green-400' },
    { label: 'SHO', value: attributes?.shooting || 0, color: 'text-red-400' },
    { label: 'PAS', value: attributes?.passing || 0, color: 'text-blue-400' },
    { label: 'DRI', value: attributes?.dribbling || 0, color: 'text-purple-400' },
    { label: 'DEF', value: attributes?.defending || 0, color: 'text-gray-400' },
    { label: 'PHY', value: attributes?.physical || 0, color: 'text-yellow-400' },
  ];

  // Calculate position (near the trigger element)
  const popoverStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        top: position.y + 10,
        left: position.x + 10,
      }
    : {};

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 pointer-events-auto"
        style={popoverStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl w-80 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg">
                  {player.jerseyNumber}
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">{player.name}</h3>
                  <p className="text-xs text-white/80">{player.roleId} • {player.age} years</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Overall Rating */}
            <div className="flex items-center justify-center space-x-2 bg-white/10 rounded-lg p-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-black text-white">{player.overall}</span>
              <span className="text-sm text-white/80">OVR</span>
            </div>
          </div>

          {/* Main Attributes */}
          <div className="p-4 bg-gray-800">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Main Attributes</h4>
            <div className="grid grid-cols-3 gap-3">
              {mainStats.map((stat) => (
                <div key={stat.label} className="bg-gray-900 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="p-4 space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Detailed Stats</h4>
            {attributes && (
              <div className="space-y-1">
                <StatBar label="Acceleration" value={attributes.acceleration || attributes.pace || 0} />
                <StatBar label="Sprint Speed" value={attributes.sprintSpeed || attributes.pace || 0} />
                <StatBar label="Finishing" value={attributes.finishing || attributes.shooting || 0} />
                <StatBar label="Shot Power" value={attributes.shotPower || attributes.shooting || 0} />
                <StatBar label="Short Passing" value={attributes.shortPassing || attributes.passing || 0} />
                <StatBar label="Vision" value={attributes.vision || attributes.passing || 0} />
                <StatBar label="Ball Control" value={attributes.ballControl || attributes.dribbling || 0} />
                <StatBar label="Agility" value={attributes.agility || attributes.dribbling || 0} />
                <StatBar label="Reactions" value={attributes.reactions || 75} />
                <StatBar label="Stamina" value={attributes.stamina || attributes.physical || 0} />
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-gray-800 border-t border-gray-700 grid grid-cols-2 gap-2">
            <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors">
              Edit Player
            </button>
            <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors">
              View Full Stats
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Stat Bar Component
const StatBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const getColor = (val: number) => {
    if (val >= 80) return 'from-green-500 to-emerald-500';
    if (val >= 60) return 'from-blue-500 to-cyan-500';
    if (val >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400 w-24">{label}</span>
      <div className="flex-1 mx-2 bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getColor(value)} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-white font-bold w-8 text-right">{value}</span>
    </div>
  );
};

export default PlayerStatsPopover;

