import React from 'react';
import { motion } from 'framer-motion';

interface PositioningModeToggleProps {
  mode: 'snap' | 'free';
  onModeChange: (mode: 'snap' | 'free') => void;
  className?: string;
}

export const PositioningModeToggle: React.FC<PositioningModeToggleProps> = ({
  mode,
  onModeChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <span className="text-slate-300 text-sm font-medium">Positioning Mode:</span>
      
      <div className="relative">
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-600">
          {/* Snap Mode Button */}
          <button
            onClick={() => onModeChange('snap')}
            className={`relative px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
              mode === 'snap' 
                ? 'text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="relative z-10">Snap to Position</span>
            {mode === 'snap' && (
              <motion.div
                layoutId="positioningModeIndicator"
                className="absolute inset-0 bg-blue-600 rounded-md"
                transition={{ type: "spring", damping: 15, stiffness: 250 }}
              />
            )}
          </button>
          
          {/* Free Mode Button */}
          <button
            onClick={() => onModeChange('free')}
            className={`relative px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
              mode === 'free' 
                ? 'text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="relative z-10">Free Movement</span>
            {mode === 'free' && (
              <motion.div
                layoutId="positioningModeIndicator"
                className="absolute inset-0 bg-green-600 rounded-md"
                transition={{ type: "spring", damping: 15, stiffness: 250 }}
              />
            )}
          </button>
        </div>
      </div>
      
      {/* Mode Description */}
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 flex items-center justify-center">
          {mode === 'snap' ? (
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21l3-3-3-3m8-8l3-3-3-3" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {mode === 'snap' 
            ? 'Players snap to formation positions' 
            : 'Players can be placed anywhere on field'
          }
        </span>
      </div>
    </div>
  );
};

export default PositioningModeToggle;