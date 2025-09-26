import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { type Player } from '../../types';
import { PLAYER_ROLES } from '../../constants';

interface PlayerTokenProps {
  player: Player;
  position: { x: number; y: number };
  isSelected: boolean;
  isDragging: boolean;
  isValid: boolean;
  onDragStart: (position: { x: number; y: number }) => void;
  onDrag: (info: PanInfo) => void;
  onDragEnd: (info: PanInfo) => void;
  onSelect: () => void;
  isMobile: boolean;
}

const PlayerToken: React.FC<PlayerTokenProps> = ({
  player,
  position,
  isSelected,
  isDragging,
  isValid,
  onDragStart,
  onDrag,
  onDragEnd,
  onSelect,
  isMobile
}) => {
  const tokenRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Motion values for smooth animations
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useTransform(x, [-100, 0, 100], [0.8, 1, 0.8]);
  const rotateX = useTransform(y, [-100, 0, 100], [10, 0, -10]);
  const rotateY = useTransform(x, [-100, 0, 100], [-10, 0, 10]);

  // Player role data
  const playerRole = PLAYER_ROLES.find(role => role.id === player.roleId);
  const roleColor = playerRole?.color || '#3b82f6';
  const roleAbbreviation = playerRole?.abbreviation || player.roleId?.slice(0, 2).toUpperCase() || '??';

  // Performance rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 90) return '#10b981'; // green-500
    if (rating >= 80) return '#3b82f6'; // blue-500
    if (rating >= 70) return '#f59e0b'; // amber-500
    if (rating >= 60) return '#ef4444'; // red-500
    return '#6b7280'; // gray-500
  };

  // Handle drag start
  const handleDragStart = useCallback(() => {
    onDragStart(position);
    setShowStats(true);
  }, [onDragStart, position]);

  // Handle drag end
  const handleDragEndInternal = useCallback((event: any, info: PanInfo) => {
    onDragEnd(info);
    setShowStats(false);
    
    // Reset motion values
    x.set(0);
    y.set(0);
  }, [onDragEnd, x, y]);

  // Handle selection
  const handleSelect = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect();
  }, [onSelect]);

  // Long press handler for mobile
  useEffect(() => {
    if (!isMobile || !tokenRef.current) return;

    let pressTimer: NodeJS.Timeout;
    const element = tokenRef.current;

    const startPress = () => {
      pressTimer = setTimeout(() => {
        setShowStats(true);
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, 500);
    };

    const endPress = () => {
      clearTimeout(pressTimer);
    };

    element.addEventListener('touchstart', startPress);
    element.addEventListener('touchend', endPress);
    element.addEventListener('touchcancel', endPress);

    return () => {
      element.removeEventListener('touchstart', startPress);
      element.removeEventListener('touchend', endPress);
      element.removeEventListener('touchcancel', endPress);
      clearTimeout(pressTimer);
    };
  }, [isMobile]);

  return (
    <>
      {/* Main Player Token */}
      <motion.div
        ref={tokenRef}
        className="absolute select-none"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: isDragging ? 50 : isSelected ? 20 : 10
        }}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        onClick={handleSelect}
      >
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.1}
          onDragStart={handleDragStart}
          onDrag={(event, info) => {
            onDrag(info);
            x.set(info.offset.x);
            y.set(info.offset.y);
          }}
          onDragEnd={handleDragEndInternal}
          className="relative cursor-grab active:cursor-grabbing"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            scale: isSelected ? 1.1 : 1,
            rotateZ: isDragging ? 5 : 0
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          style={{
            scale,
            rotateX,
            rotateY
          }}
        >
          {/* Token Shadow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-black/30 blur-sm"
            animate={{
              scale: isDragging ? 1.2 : 1,
              opacity: isDragging ? 0.6 : 0.3,
              y: isDragging ? 8 : 4
            }}
            style={{
              transform: 'translate(2px, 2px)'
            }}
          />

          {/* Main Token */}
          <motion.div
            className={`
              relative w-14 h-14 rounded-full border-2 cursor-pointer
              transition-all duration-200 ease-out
              ${isSelected 
                ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' 
                : 'border-white/60 shadow-md'
              }
              ${!isValid && isDragging ? 'border-red-400 shadow-red-400/50' : ''}
            `}
            style={{
              background: `
                radial-gradient(circle at 30% 30%, 
                  ${roleColor}dd 0%, 
                  ${roleColor}aa 40%, 
                  ${roleColor}88 100%
                ),
                linear-gradient(135deg, 
                  rgba(255,255,255,0.2) 0%, 
                  rgba(255,255,255,0.05) 50%, 
                  rgba(0,0,0,0.1) 100%
                )
              `,
              backdropFilter: 'blur(8px)',
              boxShadow: isSelected 
                ? `0 0 20px ${roleColor}66, inset 0 2px 4px rgba(255,255,255,0.2)`
                : `0 4px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)`
            }}
            animate={{
              boxShadow: isDragging 
                ? `0 8px 32px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)`
                : isSelected 
                  ? `0 0 20px ${roleColor}66, inset 0 2px 4px rgba(255,255,255,0.2)`
                  : `0 4px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)`
            }}
          >
            {/* Player Number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-lg drop-shadow-lg">
                {player.number || roleAbbreviation}
              </span>
            </div>

            {/* Role Indicator */}
            <div 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full border border-white/50 text-xs flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: roleColor }}
            >
              {roleAbbreviation.charAt(0)}
            </div>

            {/* Performance Rating */}
            <div 
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-white/50 text-xs flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: getRatingColor(player.rating || 75) }}
            >
              {Math.round(player.rating || 75)}
            </div>

            {/* Selection Ring */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-yellow-400"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}

            {/* Drag Invalid Indicator */}
            {!isValid && isDragging && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-400 bg-red-400/20"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 0.4, 0.8]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity
                }}
              />
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Player Stats Tooltip */}
      {(showStats || (isHovered && !isMobile)) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          className="absolute z-50 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600/50 p-3 min-w-48"
          style={{
            left: `${position.x}%`,
            top: `${position.y - 12}%`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {/* Player Info */}
          <div className="text-white">
            <div className="font-semibold text-sm mb-1">{player.name}</div>
            <div className="text-xs text-slate-300 mb-2">
              {playerRole?.name || 'Unknown Position'}
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Rating:</span>
                <span className="ml-1 font-medium">{player.rating || 75}</span>
              </div>
              <div>
                <span className="text-slate-400">Age:</span>
                <span className="ml-1 font-medium">{player.age || 25}</span>
              </div>
              <div>
                <span className="text-slate-400">Speed:</span>
                <span className="ml-1 font-medium">{player.pace || 70}</span>
              </div>
              <div>
                <span className="text-slate-400">Skill:</span>
                <span className="ml-1 font-medium">{player.technical || 70}</span>
              </div>
            </div>
          </div>

          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800/95" />
          </div>
        </motion.div>
      )}
    </>
  );
};

export { PlayerToken };
export default React.memo(PlayerToken);