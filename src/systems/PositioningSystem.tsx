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
  // Null safety checks
  if (!players || !Array.isArray(players)) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-gray-400">No players available</p>
          <p className="text-sm text-gray-500 mt-2">Add players from the roster to get started</p>
        </div>
      </div>
    );
  }

  // Filter players with valid field positions
  // Note: Players can have either 'fieldPosition' OR 'position'
  const fieldPlayers = players.filter(p => {
    try {
      const pos = p.fieldPosition || p.position;
      return p && pos && 
             typeof pos.x === 'number' && 
             typeof pos.y === 'number';
    } catch {
      return false;
    }
  });

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Field background */}
      <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-700 rounded-lg opacity-20" />
      
      {/* Help text if no players */}
      {fieldPlayers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-gray-400 text-lg font-medium">Tactics Board</p>
            <p className="text-sm text-gray-500 mt-2">Drag players from the roster to position them</p>
          </div>
        </div>
      )}
      
      {/* Player tokens */}
      {fieldPlayers.map((player) => {
        try {
          // Use fieldPosition if available, otherwise fall back to position
          const pos = player.fieldPosition || player.position;
          const x = pos?.x ?? 50;
          const y = pos?.y ?? 50;
          const number = player.jerseyNumber || '?';
          const isSelected = selectedPlayer?.id === player.id;
          
          return (
            <motion.div
              key={player.id}
              className={`absolute w-12 h-12 rounded-full border-2 shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer pointer-events-auto transition-all ${
                isSelected 
                  ? 'bg-yellow-500 border-yellow-300 ring-4 ring-yellow-400/50 scale-110' 
                  : 'bg-blue-600 border-white hover:scale-110'
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => onPlayerClick?.(player)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              drag
              dragMomentum={false}
              onDragStart={() => onPlayerDragStart?.(player)}
              onDragEnd={(_, info) => {
                if (onPlayerDragEnd) {
                  // Calculate new position as percentage
                  const rect = (info.point.x && info.point.y) ? {
                    width: window.innerWidth,
                    height: window.innerHeight,
                  } : { width: 1, height: 1 };
                  
                  const newX = Math.max(0, Math.min(100, ((info.point.x || x) / rect.width) * 100));
                  const newY = Math.max(0, Math.min(100, ((info.point.y || y) / rect.height) * 100));
                  
                  onPlayerDragEnd(player, { x: newX, y: newY });
                }
              }}
            >
              {number}
            </motion.div>
          );
        } catch (error) {
          console.error('Error rendering player token:', player.id, error);
          return null;
        }
      })}
    </div>
  );
};

export default PositioningSystem;