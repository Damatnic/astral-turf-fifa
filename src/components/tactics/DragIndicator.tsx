import React from 'react';
import { motion } from 'framer-motion';

interface DragIndicatorProps {
  position: { x: number; y: number };
  isValid: boolean;
  fieldDimensions: { width: number; height: number };
}

const DragIndicator: React.FC<DragIndicatorProps> = ({ position, isValid, fieldDimensions }) => {
  return (
    <motion.div
      className="absolute pointer-events-none z-30"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
    >
      {/* Main Drop Zone */}
      <motion.div
        className={`
          w-16 h-16 rounded-full border-2 backdrop-blur-sm
          ${
            isValid
              ? 'border-green-400 bg-green-400/20 shadow-lg shadow-green-400/30'
              : 'border-red-400 bg-red-400/20 shadow-lg shadow-red-400/30'
          }
        `}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Pulse Ring */}
      <motion.div
        className={`
          absolute inset-0 w-16 h-16 rounded-full border-2
          ${isValid ? 'border-green-400' : 'border-red-400'}
        `}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.8, 0, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />

      {/* Center Dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={`
            w-2 h-2 rounded-full
            ${isValid ? 'bg-green-400' : 'bg-red-400'}
          `}
          animate={{
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Status Text */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <div
          className={`
          text-xs font-medium px-2 py-1 rounded backdrop-blur-sm
          ${isValid ? 'text-green-400 bg-green-900/50' : 'text-red-400 bg-red-900/50'}
        `}
        >
          {isValid ? 'Valid Position' : 'Invalid Position'}
        </div>
      </div>
    </motion.div>
  );
};

export { DragIndicator };
export default DragIndicator;
