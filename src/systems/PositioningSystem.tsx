/**
 * 🎯 POSITIONING SYSTEM
 * 
 * Handles player positioning on the tactics board
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../types';

export interface PositioningSystemProps {
  players: Player[];
  currentFormation?: any;
  onPlayerClick?: (player: Player) => void;
  onPlayerDragStart?: (player: Player) => void;
  onPlayerDragEnd?: (player: Player, newPosition: { x: number; y: number }) => void;
  isDragging?: boolean;
  selectedPlayer?: Player | null;
}

export const PositioningSystem: React.FC<PositioningSystemProps> = ({
  players,
  currentFormation,
  onPlayerClick,
  onPlayerDragStart,
  onPlayerDragEnd,
  isDragging,
  selectedPlayer,
}) => {
  // Simple positioning system for now
  const fieldPlayers = players.filter(p => p.fieldPosition);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Field background */}
      <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-700 rounded-lg opacity-20" />
      
      {/* Player tokens */}
      {fieldPlayers.map((player) => (
        <motion.div
          key={player.id}
          className="absolute w-12 h-12 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer pointer-events-auto hover:scale-110 transition-transform"
          style={{
            left: `${player.fieldPosition?.x || 50}%`,
            top: `${player.fieldPosition?.y || 50}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => onPlayerClick?.(player)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {player.jerseyNumber || '?'}
        </motion.div>
      ))}
    </div>
  );
};

export default PositioningSystem;