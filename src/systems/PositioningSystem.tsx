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
  const containerRef = React.useRef<HTMLDivElement>(null);

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
  // IMPORTANT: Filter out benched players (x: -100, y: -100)
  // Field playable area is 5-95 with margins, so allow 0-100 range
  const fieldPlayers = players.filter(p => {
    try {
      const pos = p.fieldPosition || p.position;
      return p && pos &&
             typeof pos.x === 'number' &&
             typeof pos.y === 'number' &&
             pos.x >= 0 && pos.x <= 100 &&
             pos.y >= 0 && pos.y <= 100;
    } catch {
      return false;
    }
  });  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {/* Field background */}
      <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-700 rounded-lg opacity-20" />

      {/* Debug overlay removed for clean interface */}
      
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
              className={`absolute w-11 h-11 rounded-full flex flex-col items-center justify-center text-white font-bold cursor-move pointer-events-auto transition-all shadow-lg ${
                isSelected 
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 ring-3 ring-yellow-300/60 scale-110 z-20' 
                  : 'bg-gradient-to-br from-blue-500 to-blue-700 ring-2 ring-white/40 hover:ring-white/60 z-10'
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: isSelected 
                  ? '0 0 20px rgba(234, 179, 8, 0.6), 0 4px 15px rgba(0, 0, 0, 0.4)'
                  : '0 2px 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              }}
              onClick={() => onPlayerClick?.(player)}
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.9 }}
              drag
              dragMomentum={false}
              dragElastic={0}
              dragConstraints={containerRef}
              onDragStart={() => onPlayerDragStart?.(player)}
              onDragEnd={(event, _info) => {
                if (onPlayerDragEnd && containerRef.current) {
                  // Get container dimensions for accurate percentage calculation
                  const container = containerRef.current;
                  const rect = container.getBoundingClientRect();
                  
                  // Get the final position of the dragged element
                  const elementRect = (event.target as HTMLElement).getBoundingClientRect();
                  const centerX = elementRect.left + elementRect.width / 2;
                  const centerY = elementRect.top + elementRect.height / 2;
                  
                  // Calculate relative position within container
                  const relativeX = centerX - rect.left;
                  const relativeY = centerY - rect.top;
                  
                  // Convert to percentage (0-100)
                  const newX = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
                  const newY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
                  
                  onPlayerDragEnd(player, { x: newX, y: newY });
                }
              }}
            >
              {/* Jersey Number with better styling */}
              <span className="text-base font-extrabold leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {number}
              </span>
              
              {/* Player Name */}
              {player.name && (
                <span className="text-[7px] font-semibold leading-none mt-0.5 truncate max-w-full px-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  {player.name.split(' ').pop()}
                </span>
              )}
              
              {/* Shine effect overlay */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />
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