import React, { useRef, memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { type Player, type PlayerMorale, type KitPattern } from '../../types';
import { PLAYER_ROLES } from '../../constants';
import { MedicalCrossIcon, MoraleIcon, SuspensionIcon } from '../ui/icons';
import { useResponsive } from '../../hooks';

interface PlayerTokenProps {
  player: Player;
  position: { x: number; y: number };
  isSelected: boolean;
  onSelect: (playerId: string, clickPosition?: { x: number; y: number }) => void;
  onDragStart?: (playerId: string) => void;
  onDragEnd?: (playerId: string) => void;
  isDraggable?: boolean;
  isHighlightedByAI?: boolean;
  isDragging?: boolean;
  showNameAlways?: boolean;
  teamKit?: {
    primaryColor: string;
    secondaryColor: string;
    pattern: KitPattern;
  };
  performanceMode?: boolean;
  viewMode?: 'standard' | 'fullscreen' | 'presentation';
}

/**
 * Kit pattern component for player tokens
 * Renders team kit patterns (solid, stripes, hoops) on player tokens
 */
const KitPattern: React.FC<{ player: Player; teamKit?: { primaryColor: string; secondaryColor: string; pattern: KitPattern }; size?: number }> = ({ 
  player, 
  teamKit, 
  size = 40 
}) => {
  const kit = teamKit || {
    primaryColor: player.team === 'home' ? '#3b82f6' : '#ef4444',
    secondaryColor: '#ffffff',
    pattern: 'solid' as KitPattern
  };

  switch (kit.pattern) {
    case 'stripes':
      return (
        <svg width={size} height={size} className="absolute inset-0">
          <defs>
            <pattern id={`stripes-${player.team}`} patternUnits="userSpaceOnUse" width="8" height="8">
              <rect width="8" height="8" fill={kit.primaryColor} />
              <rect width="4" height="8" fill={kit.secondaryColor} />
            </pattern>
          </defs>
          <circle cx={size/2} cy={size/2} r={size/2} fill={`url(#stripes-${player.team})`} />
        </svg>
      );
    case 'hoops':
      return (
        <svg width={size} height={size} className="absolute inset-0">
          <defs>
            <pattern id={`hoops-${player.team}`} patternUnits="userSpaceOnUse" width="8" height="8">
              <rect width="8" height="8" fill={kit.primaryColor} />
              <rect width="8" height="4" fill={kit.secondaryColor} />
            </pattern>
          </defs>
          <circle cx={size/2} cy={size/2} r={size/2} fill={`url(#hoops-${player.team})`} />
        </svg>
      );
    case 'solid':
    default:
      return (
        <div 
          className="w-full h-full rounded-full" 
          style={{ backgroundColor: kit.primaryColor }}
        />
      );
  }
};

/**
 * Player peek menu component
 * Shows detailed player information in an expandable overlay
 */
const PlayerPeekMenu: React.FC<{ 
  player: Player; 
  isVisible: boolean; 
  position: { x: number; y: number }; 
  onClose: () => void;
}> = ({ player, isVisible, position, onClose }) => {
  const playerRole = PLAYER_ROLES.find(role => role.id === player.roleId);
  
  if (!isVisible) return null;

  const getMoraleColor = (morale: PlayerMorale) => {
    switch (morale) {
      case 'Excellent': return 'text-green-400';
      case 'Good': return 'text-green-500';
      case 'Okay': return 'text-yellow-400';
      case 'Poor': return 'text-orange-500';
      case 'Very Poor': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20" 
        onClick={onClose}
      />
      
      {/* Peek Menu */}
      <div
        className="fixed z-50 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600/50 p-4 min-w-72 max-w-sm shadow-2xl"
        style={{
          left: Math.min(position.x, window.innerWidth - 300),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-white">#{player.jerseyNumber}</span>
            <h3 className="text-white font-semibold">{player.name}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Close player details"
          >
            ×
          </button>
        </div>

        {/* Player Info */}
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400">Position:</span>
              <div className="text-white font-medium">{playerRole?.name || 'Unknown'}</div>
            </div>
            <div>
              <span className="text-slate-400">Age:</span>
              <div className="text-white font-medium">{player.age}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400">Nationality:</span>
              <div className="text-white font-medium">{player.nationality}</div>
            </div>
            <div>
              <span className="text-slate-400">Form:</span>
              <div className="text-white font-medium">{player.form}</div>
            </div>
          </div>

          {/* Morale */}
          <div>
            <span className="text-slate-400">Morale:</span>
            <div className={`font-medium ${getMoraleColor(player.morale)}`}>
              {player.morale}
            </div>
          </div>

          {/* Stamina */}
          <div>
            <span className="text-slate-400">Stamina:</span>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex-1 bg-slate-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    player.stamina > 70 ? 'bg-green-500' : 
                    player.stamina > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${player.stamina}%` }}
                />
              </div>
              <span className="text-white text-xs font-medium">{player.stamina}%</span>
            </div>
          </div>

          {/* Key Attributes */}
          <div>
            <span className="text-slate-400 mb-2 block">Key Attributes:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(player.attributes).slice(0, 6).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-300 capitalize">{key}:</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contract */}
          {player.contract?.wage && (
            <div>
              <span className="text-slate-400">Weekly Wage:</span>
              <div className="text-white font-medium">${player.contract.wage.toLocaleString()}</div>
            </div>
          )}

          {/* Availability */}
          {player.availability?.status !== 'Available' && (
            <div>
              <span className="text-slate-400">Status:</span>
              <div className="text-red-400 font-medium">
                {player.availability?.status}
                {player.availability?.returnDate && (
                  <div className="text-xs text-slate-400 mt-1">
                    Return: {player.availability.returnDate}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Enhanced PlayerToken Component
 * Professional player token with smooth animations, micro-interactions, and delightful UX
 */
const PlayerToken: React.FC<PlayerTokenProps> = memo(({
  player,
  position,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  isDraggable = true,
  isHighlightedByAI = false,
  isDragging = false,
  showNameAlways = false,
  teamKit,
  performanceMode = false,
  viewMode = 'standard',
}) => {
  const selfRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useResponsive();
  const [showPeekMenu, setShowPeekMenu] = useState(false);
  const [peekMenuPosition, setPeekMenuPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const playerRole = PLAYER_ROLES.find(r => r.id === player.roleId);
  
  // Motion values for smooth animations
  const controls = useAnimation();
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);
  const rotateY = useMotionValue(0);
  
  // Derived animation values
  const shadowIntensity = useTransform(scale, [1, 1.1], [0.2, 0.4]);
  const glowIntensity = useTransform(scale, [1, 1.1], [0, 0.6]);

  // Enhanced hover effects
  useEffect(() => {
    if (isHovered && !isDragging && !performanceMode) {
      controls.start({
        scale: 1.05,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25
        }
      });
    } else {
      controls.start({
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25
        }
      });
    }
  }, [isHovered, isDragging, controls, performanceMode]);

  // Selection animation
  useEffect(() => {
    if (isSelected && !performanceMode) {
      controls.start({
        scale: 1.1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
          repeat: 1,
          repeatType: "reverse"
        }
      });
    }
  }, [isSelected, controls, performanceMode]);

  /**
   * Enhanced drag start with animations
   */
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', player.id);
    e.dataTransfer.effectAllowed = 'move';

    // Create enhanced drag image with better visual feedback
    const ghostNode = e.currentTarget.cloneNode(true) as HTMLElement;
    if (ghostNode) {
      ghostNode.style.position = "absolute";
      ghostNode.style.top = "-9999px";
      ghostNode.style.transform = "scale(1.1)";
      ghostNode.style.filter = "drop-shadow(0 8px 16px rgba(0,0,0,0.3))";
      document.body.appendChild(ghostNode);
      e.dataTransfer.setDragImage(ghostNode, 24, 24);
      setTimeout(() => ghostNode.remove(), 0);
    }

    // Enhanced drag start animation
    if (!performanceMode) {
      controls.start({
        scale: 1.15,
        rotateZ: 5,
        transition: {
          type: "spring",
          stiffness: 600,
          damping: 25
        }
      });
    }

    // Haptic feedback
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }

    onDragStart?.(player.id);
  }, [isDraggable, player.id, onDragStart, controls, performanceMode, isMobile]);

  /**
   * Enhanced drag end with smooth return animation
   */
  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Smooth return animation
    if (!performanceMode) {
      controls.start({
        scale: 1,
        rotateZ: 0,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25
        }
      });
    }
    
    onDragEnd?.(player.id);
  }, [player.id, onDragEnd, controls, performanceMode]);

  /**
   * Enhanced player selection with animation feedback
   */
  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Selection animation pulse
    if (!performanceMode) {
      controls.start({
        scale: [1, 1.2, 1],
        transition: {
          duration: 0.3,
          ease: "easeInOut"
        }
      });
    }
    
    // Enhanced haptic feedback
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate([15, 10, 25]);
    }
    
    onSelect(player.id);
  }, [onSelect, player.id, controls, performanceMode, isMobile]);

  /**
   * Enhanced context menu with animation
   */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Context menu animation
    if (!performanceMode) {
      controls.start({
        scale: [1, 0.95, 1.05],
        rotateY: [0, -10, 0],
        transition: {
          duration: 0.4,
          ease: "easeInOut"
        }
      });
    }
    
    setPeekMenuPosition({ x: e.clientX, y: e.clientY });
    setShowPeekMenu(true);
  }, [controls, performanceMode]);

  /**
   * Enhanced double-click with satisfying animation
   */
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Double-click bounce animation
    if (!performanceMode) {
      controls.start({
        scale: [1, 1.3, 0.9, 1.1, 1],
        rotateZ: [0, 15, -10, 5, 0],
        transition: {
          duration: 0.6,
          ease: "easeInOut"
        }
      });
    }
    
    setPeekMenuPosition({ x: e.clientX, y: e.clientY });
    setShowPeekMenu(true);
  }, [controls, performanceMode]);

  /**
   * Get availability status icon
   */
  const getAvailabilityIcon = () => {
    switch (player.availability?.status) {
      case 'Minor Injury':
        return (
          <div title="Minor Injury" className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 border-2 border-white rounded-full flex items-center justify-center">
            <MedicalCrossIcon className="w-2.5 h-2.5 text-yellow-400" />
          </div>
        );
      case 'Major Injury':
        return (
          <div title="Major Injury" className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 border-2 border-white rounded-full flex items-center justify-center">
            <MedicalCrossIcon className="w-2.5 h-2.5 text-red-500" />
          </div>
        );
      case 'Suspended':
        return (
          <div title="Suspended" className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 border-2 border-white rounded-full flex items-center justify-center">
            <SuspensionIcon className="w-2.5 h-2.5 text-white" />
          </div>
        );
      case 'International Duty':
        return (
          <div title="International Duty" className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">INT</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getMoraleColor = (morale: PlayerMorale) => {
    const colors = {
      'Excellent': 'text-green-400', 
      'Good': 'text-green-500', 
      'Okay': 'text-yellow-400', 
      'Poor': 'text-orange-500', 
      'Very Poor': 'text-red-500',
    };
    return colors[morale] || 'text-gray-400';
  };

  const getStaminaColor = (stamina: number) => {
    if (stamina > 70) return 'bg-green-500';
    if (stamina > 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const isCaptain = player.id === 'captain-home' || player.id === 'captain-away'; // This would need to be passed as prop in real implementation

  return (
    <>
      {/* Enhanced Player Token Container with Motion */}
      <motion.div
        ref={selfRef}
        animate={controls}
        initial={{ scale: 1, opacity: 1 }}
        whileHover={performanceMode ? {} : {
          scale: 1.05,
          transition: { type: "spring", stiffness: 400, damping: 25 }
        }}
        whileTap={performanceMode ? {} : {
          scale: 0.95,
          transition: { type: "spring", stiffness: 600, damping: 25 }
        }}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          absolute select-none group
          ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
          ${isSelected ? 'z-20' : 'z-10'}
        `}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
          filter: isHighlightedByAI ? 
            'drop-shadow(0 0 12px rgba(34, 197, 94, 0.6)) drop-shadow(0 0 24px rgba(34, 197, 94, 0.3))' : 
            isSelected ? 
              'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4)) drop-shadow(0 0 16px rgba(59, 130, 246, 0.2))' :
              isHovered ?
                'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))' :
                'drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2))',
        }}
      >
        {/* Enhanced Player Token with Animations */}
        <div className="relative flex flex-col items-center">
          {/* Animated Token Circle */}
          <motion.div 
            className="relative rounded-full"
            animate={{
              rotate: isHighlightedByAI ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 2,
              repeat: isHighlightedByAI ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <motion.div
              className={`
                relative w-10 h-10 rounded-full border-2 flex items-center justify-center 
                text-white text-sm font-bold overflow-hidden border-black/30
                ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-blue-400' : ''}
              `}
              title={playerRole?.name || 'Player'}
              animate={{
                borderColor: isSelected ? 
                  ['rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 0.8)'] :
                  isHighlightedByAI ?
                    ['rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 1)', 'rgba(34, 197, 94, 0.8)'] :
                    'rgba(0, 0, 0, 0.3)',
                scale: isDragging ? 1.1 : 1,
              }}
              transition={{
                borderColor: {
                  duration: 2,
                  repeat: (isSelected || isHighlightedByAI) ? Infinity : 0,
                  ease: "easeInOut"
                },
                scale: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }
              }}
            >
              {/* Kit Pattern Background */}
              <KitPattern player={player} teamKit={teamKit} size={40} />
              
              {/* Jersey Number or Role Abbreviation */}
              <span className="relative z-10 drop-shadow-lg">
                {player.jerseyNumber || playerRole?.abbreviation || '??'}
              </span>

              {/* Status Indicators */}
              
              {/* Stamina Bar */}
              <div 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-gray-900/50 rounded-full border border-gray-500/50 flex items-center p-px" 
                title={`Stamina: ${player.stamina}%`}
              >
                <div 
                  className={`${getStaminaColor(player.stamina)} h-1 rounded-full transition-all`} 
                  style={{ width: `${player.stamina}%` }}
                />
              </div>
              
              {/* Morale Indicator */}
              <div 
                title={`Morale: ${player.morale}`} 
                className="absolute -top-1 -left-1 w-4 h-4 p-0.5 bg-gray-800 rounded-full border-2 border-white flex items-center justify-center"
              >
                <MoraleIcon className={`w-full h-full ${getMoraleColor(player.morale)}`} />
              </div>
            </motion.div>

            {/* Captain Badge */}
            {isCaptain && (
              <div 
                className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-4 h-5 bg-yellow-400 border-2 border-white rounded-sm flex items-center justify-center text-black font-bold text-[10px]" 
                title="Captain"
              >
                C
              </div>
            )}
            
            {/* Availability Status Icon */}
            {getAvailabilityIcon()}
          </motion.div>

          {/* Enhanced Player Name Label with Animation */}
          <AnimatePresence>
            {(showNameAlways || isHovered || isSelected || viewMode === 'presentation') && (
              <motion.div 
                initial={{ opacity: 0, y: 5, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="mt-1.5 text-xs font-semibold text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg whitespace-nowrap border border-white/10"
              >
                <span className="text-gray-300 mr-1">#{player.jerseyNumber || '?'}</span>
                <span className="text-white">{player.name}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Enhanced Selection Ring */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-400 pointer-events-none"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.2, 1],
                opacity: [0, 0.8, 0.6],
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ 
                duration: 0.5,
                ease: "easeOut"
              }}
              style={{
                transform: 'translate(-50%, -50%)',
                left: '50%',
                top: '50%',
                width: '60px',
                height: '60px',
              }}
            />
          )}
        </AnimatePresence>
        
        {/* AI Highlight Effects */}
        <AnimatePresence>
          {isHighlightedByAI && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-green-400 pointer-events-none"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [0.5, 1.3, 1.1],
                opacity: [0, 1, 0.7],
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ 
                duration: 0.8,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 2
              }}
              style={{
                transform: 'translate(-50%, -50%)',
                left: '50%',
                top: '50%',
                width: '70px',
                height: '70px',
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Player Peek Menu */}
      <PlayerPeekMenu 
        player={player}
        isVisible={showPeekMenu}
        position={peekMenuPosition}
        onClose={() => setShowPeekMenu(false)}
      />
    </>
  );
});

export { PlayerToken };
export default PlayerToken;