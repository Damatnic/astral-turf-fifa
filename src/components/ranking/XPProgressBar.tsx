// XP Progress Bar Component - Displays XP progress to next level

import React from 'react';
import { motion } from 'framer-motion';

interface XPProgressBarProps {
  currentXP: number;
  xpToNextLevel: number;
  currentLevel: number;
  showNumbers?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

const XPProgressBar: React.FC<XPProgressBarProps> = ({
  currentXP,
  xpToNextLevel,
  currentLevel,
  showNumbers = true,
  height = 'md',
}) => {
  // Calculate total XP for current level
  const baseXP = 1000;
  const levelXP = Math.floor(baseXP * Math.pow(1.15, currentLevel - 1));
  const nextLevelXP = Math.floor(baseXP * Math.pow(1.15, currentLevel));
  const xpInCurrentLevel = currentXP - levelXP + xpToNextLevel;
  const xpNeededForLevel = nextLevelXP - levelXP;
  const progressPercentage = Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {showNumbers && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-300">
            Level {currentLevel}
          </span>
          <span className="text-sm text-gray-400">
            {xpInCurrentLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()} XP
          </span>
          <span className="text-sm font-medium text-gray-300">
            Level {currentLevel + 1}
          </span>
        </div>
      )}

      <div className={`w-full bg-gray-700 rounded-full ${heightClasses[height]} overflow-hidden relative`}>
        <motion.div
          className={`${heightClasses[height]} rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Animated shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'linear',
            }}
          />
        </motion.div>

        {/* Level markers */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white/50">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>

      {!showNumbers && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {xpToNextLevel.toLocaleString()} XP to next level
          </span>
        </div>
      )}
    </div>
  );
};

export default XPProgressBar;