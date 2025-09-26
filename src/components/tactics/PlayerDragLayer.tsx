import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Player } from '../../types';

interface PlayerDragLayerProps {
  isDragging: boolean;
  currentPlayer: Player | null;
}

const PlayerDragLayer: React.FC<PlayerDragLayerProps> = ({ isDragging, currentPlayer }) => {
  if (!isDragging || !currentPlayer) {return null;}

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 pointer-events-none z-40"
      >
        {/* Drag Overlay */}
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" />

        {/* Player Info Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute top-6 left-6 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-lg p-4 max-w-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600/80 flex items-center justify-center text-white font-bold">
              {currentPlayer.number || '?'}
            </div>
            <div>
              <div className="text-white font-semibold">{currentPlayer.name}</div>
              <div className="text-slate-400 text-sm">Drag to reposition</div>
            </div>
          </div>
        </motion.div>

        {/* Drag Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-lg px-4 py-2"
        >
          <div className="text-white text-sm text-center">
            Drop on field to move player • Release outside to cancel
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export { PlayerDragLayer };
export default PlayerDragLayer;