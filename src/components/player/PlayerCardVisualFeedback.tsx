/**
 * PLAYER CARD VISUAL FEEDBACK SYSTEM
 * 
 * Advanced visual effects for player cards:
 * - Hover animations and transitions
 * - Selection states and highlights
 * - Loading states and skeletons
 * - Comparison mode overlays
 * - Quick actions toolbar
 * - Context menus
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  BarChart3, 
  Users, 
  Star, 
  Trophy, 
  Target,
  TrendingUp,
  Heart,
  MessageSquare,
  MoreVertical,
  X,
  ArrowUpRight,
  Award,
  Calendar,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Share2,
  Download,
  Filter,
  Search,
  Zap,
  Shield,
  Sword,
  Target as TargetIcon
} from 'lucide-react';
import type { Player } from '../../types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PlayerCardFeedbackProps {
  player: Player;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isComparing?: boolean;
  isFavorited?: boolean;
  isLoading?: boolean;
  showActions?: boolean;
  showQuickStats?: boolean;
  showComparison?: boolean;
  onSelect?: (player: Player) => void;
  onEdit?: (player: Player) => void;
  onCompare?: (player: Player) => void;
  onSwap?: (player: Player) => void;
  onFavorite?: (player: Player) => void;
  onShare?: (player: Player) => void;
  onCopy?: (player: Player) => void;
  className?: string;
}

export interface ComparisonOverlayProps {
  player1: Player;
  player2: Player;
  isVisible: boolean;
  onClose: () => void;
}

export interface QuickActionsProps {
  player: Player;
  isVisible: boolean;
  position: { x: number; y: number };
  onAction: (action: string, player: Player) => void;
  onClose: () => void;
}

// ============================================================================
// SKELETON LOADING COMPONENT
// ============================================================================

export const PlayerCardSkeleton: React.FC<{ size?: 'compact' | 'standard' | 'detailed' | 'full' }> = ({
  size = 'standard'
}) => {
  const SkeletonBar = ({ width, height }: { width: string; height: string }) => (
    <div className={`bg-gray-700 rounded animate-pulse`} style={{ width, height }} />
  );

  if (size === 'compact') {
    return (
      <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse" />
    );
  }

  if (size === 'standard') {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-600 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-gray-700 to-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SkeletonBar width="48px" height="48px" />
              <div className="space-y-2">
                <SkeletonBar width="120px" height="16px" />
                <SkeletonBar width="80px" height="12px" />
              </div>
            </div>
            <div className="text-right space-y-1">
              <SkeletonBar width="32px" height="24px" />
              <SkeletonBar width="24px" height="10px" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          <SkeletonBar width="100px" height="14px" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-1">
                <SkeletonBar width="60px" height="10px" />
                <SkeletonBar width="100%" height="8px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-600 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <SkeletonBar width="80px" height="80px" />
            <div className="space-y-2">
              <SkeletonBar width="150px" height="20px" />
              <SkeletonBar width="100px" height="14px" />
              <SkeletonBar width="80px" height="12px" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <SkeletonBar width="48px" height="36px" />
            <SkeletonBar width="60px" height="14px" />
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <SkeletonBar width="120px" height="14px" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, j) => (
                <SkeletonBar key={j} width="100%" height="12px" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// QUICK ACTIONS TOOLBAR
// ============================================================================

export const QuickActions: React.FC<QuickActionsProps> = ({
  player,
  isVisible,
  position,
  onAction,
  onClose
}) => {
  const actions = [
    { id: 'edit', label: 'Edit', icon: Edit3, color: 'blue' },
    { id: 'compare', label: 'Compare', icon: BarChart3, color: 'purple' },
    { id: 'swap', label: 'Swap', icon: ArrowUpRight, color: 'green' },
    { id: 'favorite', label: 'Favorite', icon: Heart, color: 'red' },
    { id: 'share', label: 'Share', icon: Share2, color: 'gray' },
    { id: 'copy', label: 'Copy', icon: Copy, color: 'gray' },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-600 hover:bg-blue-700 text-white',
      purple: 'bg-purple-600 hover:bg-purple-700 text-white',
      green: 'bg-green-600 hover:bg-green-700 text-white',
      red: 'bg-red-600 hover:bg-red-700 text-white',
      gray: 'bg-gray-600 hover:bg-gray-700 text-white',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl"
          style={{
            left: Math.min(position.x, window.innerWidth - 300),
            top: Math.max(position.y - 60, 10),
          }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h4 className="font-medium text-white text-sm">{player.name}</h4>
            <button
              className="p-1 rounded hover:bg-gray-700 transition-colors"
              onClick={onClose}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          {/* Actions Grid */}
          <div className="p-3 grid grid-cols-3 gap-2">
            {actions.map((action) => (
              <motion.button
                key={action.id}
                className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${getColorClasses(action.color)}`}
                onClick={() => {
                  onAction(action.id, player);
                  onClose();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <action.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// COMPARISON OVERLAY
// ============================================================================

export const ComparisonOverlay: React.FC<ComparisonOverlayProps> = ({
  player1,
  player2,
  isVisible,
  onClose
}) => {
  const getStatComparison = (stat1: number, stat2: number) => {
    const diff = stat1 - stat2;
    if (diff > 0) return { color: 'text-green-400', icon: '↑', diff: `+${diff}` };
    if (diff < 0) return { color: 'text-red-400', icon: '↓', diff: diff.toString() };
    return { color: 'text-gray-400', icon: '=', diff: '0' };
  };

  const extractStats = (player: Player) => ({
    overall: player.overall || 75,
    pace: (player.attributes as any)?.pace || 70,
    shooting: (player.attributes as any)?.shooting || 70,
    passing: (player.attributes as any)?.passing || 70,
    dribbling: (player.attributes as any)?.dribbling || 70,
    defending: (player.attributes as any)?.defending || 70,
    physical: (player.attributes as any)?.physical || 70,
  });

  const stats1 = extractStats(player1);
  const stats2 = extractStats(player2);

  const statKeys = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gray-900 border border-gray-600 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Player Comparison</h3>
                <button
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  onClick={onClose}
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Player Headers */}
            <div className="p-6 border-b border-gray-700">
              <div className="grid grid-cols-2 gap-8">
                {/* Player 1 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-xl">{player1.jerseyNumber}</span>
                  </div>
                  <h4 className="font-bold text-white text-lg">{player1.name}</h4>
                  <p className="text-gray-400 text-sm">
                    #{player1.jerseyNumber} • {player1.roleId || 'Player'}
                  </p>
                  <div className="text-2xl font-bold text-blue-400 mt-2">{stats1.overall}</div>
                </div>
                
                {/* VS */}
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">VS</span>
                  </div>
                </div>
                
                {/* Player 2 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-xl">{player2.jerseyNumber}</span>
                  </div>
                  <h4 className="font-bold text-white text-lg">{player2.name}</h4>
                  <p className="text-gray-400 text-sm">
                    #{player2.jerseyNumber} • {player2.roleId || 'Player'}
                  </p>
                  <div className="text-2xl font-bold text-green-400 mt-2">{stats2.overall}</div>
                </div>
              </div>
            </div>
            
            {/* Stats Comparison */}
            <div className="p-6">
              <h4 className="text-lg font-bold text-white mb-4">Attributes Comparison</h4>
              <div className="space-y-4">
                {statKeys.map((stat) => {
                  const value1 = stats1[stat];
                  const value2 = stats2[stat];
                  const comparison = getStatComparison(value1, value2);
                  
                  return (
                    <div key={stat} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium capitalize">{stat}</span>
                        <span className={`text-sm font-medium ${comparison.color}`}>
                          {comparison.icon} {comparison.diff}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">{player1.name}</span>
                            <span className="text-sm font-bold text-blue-400">{value1}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${value1}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">{player2.name}</span>
                            <span className="text-sm font-bold text-green-400">{value2}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${value2}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// HOVER EFFECTS WRAPPER
// ============================================================================

export const PlayerCardHoverEffects: React.FC<{
  children: React.ReactNode;
  player: Player;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onQuickAction?: (action: string, player: Player) => void;
}> = ({ children, player, isSelected, isHighlighted, onQuickAction }) => {
  const [showQuickStats, setShowQuickStats] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [actionPosition, setActionPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setActionPosition({ x: e.clientX, y: e.clientY });
    setShowActions(true);
  };

  const handleQuickAction = (action: string, targetPlayer: Player) => {
    onQuickAction?.(action, targetPlayer);
    setShowActions(false);
  };

  return (
    <div
      ref={cardRef}
      className="relative group"
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setShowQuickStats(true)}
      onMouseLeave={() => setShowQuickStats(false)}
    >
      {children}
      
      {/* Selection Highlight */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 border-2 border-cyan-400 rounded-xl pointer-events-none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Highlight Overlay */}
      {isHighlighted && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
      
      {/* Quick Stats Tooltip */}
      <AnimatePresence>
        {showQuickStats && !showActions && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                       bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl
                       pointer-events-none z-40 min-w-[200px]"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
          >
            <div className="text-center mb-2">
              <h4 className="font-bold text-white text-sm">{player.name}</h4>
              <p className="text-xs text-gray-400">
                #{player.jerseyNumber} • {player.roleId || 'Player'}
              </p>
              <p className={`text-lg font-bold ${player.overall && player.overall >= 85 ? 'text-green-400' : player.overall && player.overall >= 75 ? 'text-blue-400' : 'text-gray-400'}`}>
                {player.overall || 75} OVR
              </p>
            </div>
            
            <div className="space-y-1">
              {[
                { label: 'Pace', value: (player.attributes as any)?.pace || 70 },
                { label: 'Shooting', value: (player.attributes as any)?.shooting || 70 },
                { label: 'Passing', value: (player.attributes as any)?.passing || 70 },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center">
                  <span className="text-xs text-gray-300">{stat.label}</span>
                  <span className="text-xs font-bold text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Quick Actions */}
      <QuickActions
        player={player}
        isVisible={showActions}
        position={actionPosition}
        onAction={handleQuickAction}
        onClose={() => setShowActions(false)}
      />
    </div>
  );
};

// ============================================================================
// MAIN VISUAL FEEDBACK COMPONENT
// ============================================================================

export const PlayerCardVisualFeedback: React.FC<PlayerCardFeedbackProps & { children?: React.ReactNode }> = ({
  player,
  isSelected = false,
  isHighlighted = false,
  isComparing = false,
  isFavorited = false,
  isLoading = false,
  showActions = true,
  showQuickStats = true,
  showComparison = false,
  onSelect,
  onEdit,
  onCompare,
  onSwap,
  onFavorite,
  onShare,
  onCopy,
  className = '',
  children
}) => {
  if (isLoading) {
    return <PlayerCardSkeleton size="standard" className={className} />;
  }

  const handleQuickAction = (action: string, targetPlayer: Player) => {
    switch (action) {
      case 'edit':
        onEdit?.(targetPlayer);
        break;
      case 'compare':
        onCompare?.(targetPlayer);
        break;
      case 'swap':
        onSwap?.(targetPlayer);
        break;
      case 'favorite':
        onFavorite?.(targetPlayer);
        break;
      case 'share':
        onShare?.(targetPlayer);
        break;
      case 'copy':
        onCopy?.(targetPlayer);
        break;
    }
  };

  return (
    <PlayerCardHoverEffects
      player={player}
      isSelected={isSelected}
      isHighlighted={isHighlighted}
      onQuickAction={handleQuickAction}
    >
      <div className={className}>
        {children}
        
        {/* Favorite Indicator */}
        {isFavorited && (
          <motion.div
            className="absolute top-2 right-2 z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <Heart className="w-5 h-5 text-red-400 fill-current" />
          </motion.div>
        )}
        
        {/* Comparing Indicator */}
        {isComparing && (
          <motion.div
            className="absolute top-2 left-2 z-10 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            COMPARING
          </motion.div>
        )}
        
        {/* Loading Overlay */}
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </div>
    </PlayerCardHoverEffects>
  );
};

export default PlayerCardVisualFeedback;
