import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Player } from '../../types';

interface ConflictOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  recommended?: boolean;
}

interface ConflictResolutionMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  sourcePlayer: Player;
  targetPlayer: Player;
  onResolve: (action: 'swap' | 'replace' | 'cancel' | 'find_alternative') => void;
  onClose: () => void;
  alternativeSlots?: Array<{
    id: string;
    role: string;
    position: { x: number; y: number };
  }>;
}

export const ConflictResolutionMenu: React.FC<ConflictResolutionMenuProps> = ({
  isVisible,
  position,
  sourcePlayer,
  targetPlayer,
  onResolve,
  onClose,
  alternativeSlots = []
}) => {
  const [menuPosition, setMenuPosition] = useState(position);

  useEffect(() => {
    // Adjust menu position to stay within viewport
    const menuWidth = 320;
    const menuHeight = 280;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    let x = position.x;
    let y = position.y;
    
    if (x + menuWidth > screenWidth - 20) {
      x = screenWidth - menuWidth - 20;
    }
    if (x < 20) {
      x = 20;
    }
    
    if (y + menuHeight > screenHeight - 20) {
      y = screenHeight - menuHeight - 20;
    }
    if (y < 20) {
      y = 20;
    }
    
    setMenuPosition({ x, y });
  }, [position]);

  const conflictOptions: ConflictOption[] = [
    {
      id: 'swap',
      title: 'Swap Positions',
      description: `Switch ${sourcePlayer.name} and ${targetPlayer.name}`,
      recommended: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l4-4" />
        </svg>
      ),
      action: () => onResolve('swap')
    },
    {
      id: 'replace',
      title: 'Replace Player',
      description: `Move ${targetPlayer.name} to bench`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      action: () => onResolve('replace')
    }
  ];

  // Add alternative slot option if available
  if (alternativeSlots.length > 0) {
    conflictOptions.push({
      id: 'alternative',
      title: 'Find Alternative',
      description: `Move ${targetPlayer.name} to another position`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
        </svg>
      ),
      action: () => onResolve('find_alternative')
    });
  }

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          
          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: position.x, y: position.y }}
            animate={{ opacity: 1, scale: 1, x: menuPosition.x, y: menuPosition.y }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 w-80 bg-slate-800/95 backdrop-blur-md rounded-lg border border-slate-600/50 shadow-2xl"
            style={{ left: 0, top: 0 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-600/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Position Conflict</h3>
                  <p className="text-slate-300 text-sm">
                    {sourcePlayer.name} wants to move to {targetPlayer.name}'s position
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Players Info */}
              <div className="flex items-center justify-center space-x-4 mt-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: sourcePlayer.teamColor }}
                  >
                    {sourcePlayer.jerseyNumber}
                  </div>
                  <span className="text-white text-sm">{sourcePlayer.name}</span>
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: targetPlayer.teamColor }}
                  >
                    {targetPlayer.jerseyNumber}
                  </div>
                  <span className="text-white text-sm">{targetPlayer.name}</span>
                </div>
              </div>
            </div>
            
            {/* Options */}
            <div className="p-4 space-y-2">
              {conflictOptions.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={option.action}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    option.recommended
                      ? 'bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/30'
                      : 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/70'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      option.recommended ? 'bg-blue-600' : 'bg-slate-600'
                    }`}>
                      <div className="text-white">
                        {option.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-white font-medium">{option.title}</h4>
                        {option.recommended && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm mt-1">{option.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            
            {/* Cancel Option */}
            <div className="p-4 border-t border-slate-600/50">
              <button
                onClick={() => onResolve('cancel')}
                className="w-full py-2 px-4 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
              >
                Cancel Move
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConflictResolutionMenu;