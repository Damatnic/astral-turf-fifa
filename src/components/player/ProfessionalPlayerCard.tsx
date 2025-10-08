/**
 * PROFESSIONAL PLAYER CARD SYSTEM
 * 
 * Complete redesign with 4 size variants:
 * - Compact: Quick stats tooltip
 * - Standard: Full attributes + career stats  
 * - Detailed: + Specialties, play style, form
 * - Full: + Journey, achievements, relationships
 * 
 * Based on Football Manager and FIFA card designs.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import type { Player } from '../../types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type PlayerCardSize = 'compact' | 'standard' | 'detailed' | 'full';

export interface PlayerCardProps {
  player: Player;
  size?: PlayerCardSize;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onSelect?: (player: Player) => void;
  onEdit?: (player: Player) => void;
  onCompare?: (player: Player) => void;
  onSwap?: (player: Player) => void;
  onFavorite?: (player: Player) => void;
  className?: string;
  showActions?: boolean;
  interactive?: boolean;
}

export interface PlayerStats {
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface PlayerCareer {
  matches: number;
  goals: number;
  assists: number;
  winRate: number;
  cleanSheets?: number; // For goalkeepers
  saves?: number; // For goalkeepers
}

export interface PlayerForm {
  overall: 'excellent' | 'good' | 'average' | 'poor' | 'very-poor';
  lastMatch: number; // Rating out of 10
  trend: 'up' | 'down' | 'stable';
}

export interface PlayerSpecialty {
  id: string;
  name: string;
  level: number; // 1-5 stars
  category: 'physical' | 'technical' | 'mental' | 'tactical';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract player stats from attributes
 */
export function extractPlayerStats(player: Player): PlayerStats {
  const attrs = player.attributes || {};
  return {
    overall: player.overall || 75,
    pace: (attrs as any).pace || 70,
    shooting: (attrs as any).shooting || 70,
    passing: (attrs as any).passing || 70,
    dribbling: (attrs as any).dribbling || 70,
    defending: (attrs as any).defending || 70,
    physical: (attrs as any).physical || 70,
  };
}

/**
 * Generate mock career stats
 */
export function generateCareerStats(player: Player): PlayerCareer {
  const overall = player.overall || 75;
  const baseMatches = 50 + (overall - 70) * 2;
  
  return {
    matches: baseMatches + Math.floor(Math.random() * 50),
    goals: Math.floor(Math.random() * 30),
    assists: Math.floor(Math.random() * 20),
    winRate: 60 + (overall - 70) + Math.floor(Math.random() * 20),
    cleanSheets: player.roleId?.includes('GK') ? Math.floor(Math.random() * 15) : undefined,
    saves: player.roleId?.includes('GK') ? Math.floor(Math.random() * 100) : undefined,
  };
}

/**
 * Generate mock form data
 */
export function generatePlayerForm(player: Player): PlayerForm {
  const forms: PlayerForm['overall'][] = ['excellent', 'good', 'average', 'poor', 'very-poor'];
  const trends: PlayerForm['trend'][] = ['up', 'down', 'stable'];
  
  return {
    overall: forms[Math.floor(Math.random() * forms.length)],
    lastMatch: 6 + Math.random() * 4, // 6-10
    trend: trends[Math.floor(Math.random() * trends.length)],
  };
}

/**
 * Generate mock specialties
 */
export function generatePlayerSpecialties(player: Player): PlayerSpecialty[] {
  const specialties = [
    { id: 'finishing', name: 'Clinical Finishing', category: 'technical' as const },
    { id: 'pace', name: 'Lightning Speed', category: 'physical' as const },
    { id: 'passing', name: 'Pinpoint Passing', category: 'technical' as const },
    { id: 'tackling', name: 'Rock Solid Tackling', category: 'tactical' as const },
    { id: 'leadership', name: 'Natural Leader', category: 'mental' as const },
    { id: 'vision', name: 'Tactical Vision', category: 'mental' as const },
    { id: 'agility', name: 'Acrobatic Saves', category: 'physical' as const },
  ];
  
  const playerSpecialties = specialties.slice(0, 2 + Math.floor(Math.random() * 3));
  return playerSpecialties.map(spec => ({
    ...spec,
    level: 3 + Math.floor(Math.random() * 3), // 3-5 stars
  }));
}

/**
 * Get color for rating
 */
export function getRatingColor(rating: number): string {
  if (rating >= 85) return 'text-green-400';
  if (rating >= 75) return 'text-blue-400';
  if (rating >= 65) return 'text-gray-400';
  return 'text-orange-400';
}

/**
 * Get color for form
 */
export function getFormColor(form: PlayerForm['overall']): string {
  switch (form) {
    case 'excellent': return 'text-green-400';
    case 'good': return 'text-blue-400';
    case 'average': return 'text-gray-400';
    case 'poor': return 'text-orange-400';
    case 'very-poor': return 'text-red-400';
  }
}

// ============================================================================
// ATTRIBUTE BAR COMPONENT
// ============================================================================

interface AttributeBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
  showValue?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const AttributeBar: React.FC<AttributeBarProps> = ({
  label,
  value,
  max = 100,
  color = 'rgb(59, 130, 246)',
  showValue = true,
  size = 'medium',
}) => {
  const percentage = (value / max) * 100;
  
  const sizeClasses = {
    small: 'h-1',
    medium: 'h-2',
    large: 'h-3',
  };
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">
          {label}
        </span>
        {showValue && (
          <span className={`text-xs font-bold ${getRatingColor(value)}`}>
            {value}
          </span>
        )}
      </div>
      <div className={`w-full bg-gray-700 rounded-full ${sizeClasses[size]}`}>
        <motion.div
          className={`rounded-full ${sizeClasses[size]}`}
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// COMPACT PLAYER CARD
// ============================================================================

const CompactPlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected,
  onSelect,
  onEdit,
  className = '',
}) => {
  const stats = extractPlayerStats(player);
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <motion.div
      className={`relative group ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center
                   text-white font-bold text-lg border-2 cursor-pointer
                   transition-all duration-200 ${
          isSelected
            ? 'border-cyan-400 bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25'
            : 'border-gray-600 bg-gradient-to-br from-gray-700 to-gray-800 hover:border-gray-500'
        }`}
        onClick={() => onSelect?.(player)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {player.jerseyNumber || '??'}
      </div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                       bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl
                       pointer-events-none z-50 min-w-[200px]"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
          >
            {/* Player Info */}
            <div className="text-center mb-3">
              <h4 className="font-bold text-white text-sm">{player.name}</h4>
              <p className="text-xs text-gray-400">
                #{player.jerseyNumber} • {player.roleId || 'Player'}
              </p>
              <p className={`text-lg font-bold ${getRatingColor(stats.overall)}`}>
                {stats.overall} OVR
              </p>
            </div>
            
            {/* Key Stats */}
            <div className="space-y-2">
              <AttributeBar label="Pace" value={stats.pace} size="small" />
              <AttributeBar label="Shooting" value={stats.shooting} size="small" />
              <AttributeBar label="Passing" value={stats.passing} size="small" />
            </div>
            
            {/* Actions */}
            <div className="flex justify-center mt-3 pt-2 border-t border-gray-700">
              <button
                className="p-1 rounded hover:bg-gray-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(player);
                }}
              >
                <Edit3 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// STANDARD PLAYER CARD
// ============================================================================

const StandardPlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected,
  onSelect,
  onEdit,
  onCompare,
  onSwap,
  className = '',
}) => {
  const stats = extractPlayerStats(player);
  const career = generateCareerStats(player);
  
  return (
    <motion.div
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl
                  border border-gray-600 overflow-hidden cursor-pointer
                  transition-all duration-200 ${
        isSelected
          ? 'border-cyan-400 shadow-lg shadow-cyan-500/25'
          : 'hover:border-gray-500 hover:shadow-lg'
      } ${className}`}
      whileHover={{ y: -2 }}
      onClick={() => onSelect?.(player)}
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-gray-700 to-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{player.jerseyNumber}</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{player.name}</h3>
              <p className="text-sm text-gray-400">
                {player.roleId || 'Player'} • Age {player.age || 25}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getRatingColor(stats.overall)}`}>
              {stats.overall}
            </div>
            <div className="text-xs text-gray-400">OVR</div>
          </div>
        </div>
      </div>
      
      {/* Attributes */}
      <div className="p-4 space-y-3">
        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Attributes
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <AttributeBar label="Pace" value={stats.pace} />
          <AttributeBar label="Shooting" value={stats.shooting} />
          <AttributeBar label="Passing" value={stats.passing} />
          <AttributeBar label="Dribbling" value={stats.dribbling} />
          <AttributeBar label="Defending" value={stats.defending} />
          <AttributeBar label="Physical" value={stats.physical} />
        </div>
      </div>
      
      {/* Career Stats */}
      <div className="px-4 pb-4">
        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center mb-3">
          <Target className="w-4 h-4 mr-2" />
          Career Stats
        </h4>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-white">{career.matches}</div>
            <div className="text-xs text-gray-400">Matches</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{career.goals}</div>
            <div className="text-xs text-gray-400">Goals</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{career.assists}</div>
            <div className="text-xs text-gray-400">Assists</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{career.winRate}%</div>
            <div className="text-xs text-gray-400">Win Rate</div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-4 pb-4">
        <div className="flex space-x-2">
          <button
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(player);
            }}
          >
            Edit
          </button>
          <button
            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onCompare?.(player);
            }}
          >
            Compare
          </button>
          <button
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onSwap?.(player);
            }}
          >
            Swap
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// DETAILED PLAYER CARD
// ============================================================================

const DetailedPlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected,
  onSelect,
  onEdit,
  onCompare,
  onSwap,
  onFavorite,
  className = '',
}) => {
  const stats = extractPlayerStats(player);
  const career = generateCareerStats(player);
  const form = generatePlayerForm(player);
  const specialties = generatePlayerSpecialties(player);
  
  return (
    <motion.div
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl
                  border border-gray-600 overflow-hidden cursor-pointer
                  transition-all duration-200 ${
        isSelected
          ? 'border-cyan-400 shadow-lg shadow-cyan-500/25'
          : 'hover:border-gray-500 hover:shadow-lg'
      } ${className}`}
      whileHover={{ y: -2 }}
      onClick={() => onSelect?.(player)}
    >
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">{player.jerseyNumber}</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-xl">{player.name}</h3>
              <p className="text-gray-400">
                {player.roleId || 'Player'} • Age {player.age || 25} • {player.nationality || 'Unknown'}
              </p>
              <div className="flex items-center mt-1">
                <span className={`text-sm font-medium ${getFormColor(form.overall)}`}>
                  Form: {form.overall.replace('-', ' ')}
                </span>
                <TrendingUp className={`w-4 h-4 ml-2 ${
                  form.trend === 'up' ? 'text-green-400' :
                  form.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                }`} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getRatingColor(stats.overall)}`}>
              {stats.overall}
            </div>
            <div className="text-sm text-gray-400">Overall</div>
            <div className="text-xs text-gray-500 mt-1">
              Last: {form.lastMatch.toFixed(1)}/10
            </div>
          </div>
        </div>
      </div>
      
      {/* Attributes */}
      <div className="p-6">
        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center mb-4">
          <BarChart3 className="w-5 h-5 mr-2" />
          Player Attributes
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <AttributeBar label="Pace" value={stats.pace} size="large" />
          <AttributeBar label="Shooting" value={stats.shooting} size="large" />
          <AttributeBar label="Passing" value={stats.passing} size="large" />
          <AttributeBar label="Dribbling" value={stats.dribbling} size="large" />
          <AttributeBar label="Defending" value={stats.defending} size="large" />
          <AttributeBar label="Physical" value={stats.physical} size="large" />
        </div>
      </div>
      
      {/* Career Stats */}
      <div className="px-6 pb-6">
        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center mb-4">
          <Target className="w-5 h-5 mr-2" />
          Career Statistics
        </h4>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-xl font-bold text-white">{career.matches}</div>
            <div className="text-xs text-gray-400">Matches</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-xl font-bold text-white">{career.goals}</div>
            <div className="text-xs text-gray-400">Goals</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-xl font-bold text-white">{career.assists}</div>
            <div className="text-xs text-gray-400">Assists</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-xl font-bold text-white">{career.winRate}%</div>
            <div className="text-xs text-gray-400">Win Rate</div>
          </div>
        </div>
      </div>
      
      {/* Specialties */}
      <div className="px-6 pb-6">
        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center mb-4">
          <Star className="w-5 h-5 mr-2" />
          Specialties
        </h4>
        <div className="space-y-2">
          {specialties.map((specialty) => (
            <div key={specialty.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
              <span className="text-white text-sm">{specialty.name}</span>
              <div className="flex">
                {[...Array(specialty.level)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-6 pb-6">
        <div className="flex space-x-2">
          <button
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(player);
            }}
          >
            Edit Player
          </button>
          <button
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onCompare?.(player);
            }}
          >
            Compare
          </button>
          <button
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onSwap?.(player);
            }}
          >
            Swap
          </button>
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.(player);
            }}
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// FULL PLAYER CARD
// ============================================================================

const FullPlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected,
  onSelect,
  onEdit,
  onCompare,
  onSwap,
  onFavorite,
  className = '',
}) => {
  const stats = extractPlayerStats(player);
  const career = generateCareerStats(player);
  const form = generatePlayerForm(player);
  const specialties = generatePlayerSpecialties(player);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'chemistry'>('overview');
  
  return (
    <motion.div
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl
                  border border-gray-600 overflow-hidden cursor-pointer
                  transition-all duration-200 ${
        isSelected
          ? 'border-cyan-400 shadow-lg shadow-cyan-500/25'
          : 'hover:border-gray-500 hover:shadow-lg'
      } ${className}`}
      whileHover={{ y: -2 }}
      onClick={() => onSelect?.(player)}
    >
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-3xl">{player.jerseyNumber}</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-2xl">{player.name}</h3>
              <p className="text-gray-400 text-lg">
                {player.roleId || 'Player'} • Age {player.age || 25}
              </p>
              <p className="text-gray-500 text-sm">
                {player.nationality || 'Unknown'} • {player.team || 'Unknown Team'}
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${getFormColor(form.overall)}`}>
                  Form: {form.overall.replace('-', ' ')}
                </span>
                <TrendingUp className={`w-4 h-4 ml-2 ${
                  form.trend === 'up' ? 'text-green-400' :
                  form.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                }`} />
                <span className="text-xs text-gray-500 ml-4">
                  Last match: {form.lastMatch.toFixed(1)}/10
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getRatingColor(stats.overall)}`}>
              {stats.overall}
            </div>
            <div className="text-lg text-gray-400">Overall Rating</div>
            <div className="flex items-center justify-center mt-2">
              <button
                className="p-2 rounded-full hover:bg-gray-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite?.(player);
                }}
              >
                <Heart className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-6 border-b border-gray-700">
        <div className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'history', label: 'History', icon: Calendar },
            { id: 'chemistry', label: 'Chemistry', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(tab.id as any);
              }}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Attributes */}
            <div>
              <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center mb-4">
                <BarChart3 className="w-5 h-5 mr-2" />
                Player Attributes
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <AttributeBar label="Pace" value={stats.pace} size="large" />
                <AttributeBar label="Shooting" value={stats.shooting} size="large" />
                <AttributeBar label="Passing" value={stats.passing} size="large" />
                <AttributeBar label="Dribbling" value={stats.dribbling} size="large" />
                <AttributeBar label="Defending" value={stats.defending} size="large" />
                <AttributeBar label="Physical" value={stats.physical} size="large" />
              </div>
            </div>
            
            {/* Specialties */}
            <div>
              <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center mb-4">
                <Star className="w-5 h-5 mr-2" />
                Specialties & Play Style
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {specialties.map((specialty) => (
                  <div key={specialty.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
                    <div>
                      <span className="text-white text-sm font-medium">{specialty.name}</span>
                      <div className="text-xs text-gray-400 capitalize">{specialty.category}</div>
                    </div>
                    <div className="flex">
                      {[...Array(specialty.level)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center mb-4">
              <Calendar className="w-5 h-5 mr-2" />
              Career Journey
            </h4>
            <div className="space-y-3">
              <div className="flex items-center bg-gray-700/50 rounded-lg p-4">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="font-medium text-white">Current Team</div>
                  <div className="text-sm text-gray-400">2024 - Present</div>
                </div>
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex items-center bg-gray-700/50 rounded-lg p-4">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="font-medium text-white">Previous Club</div>
                  <div className="text-sm text-gray-400">2022 - 2024</div>
                </div>
                <Award className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            
            {/* Recent Achievements */}
            <div className="mt-6">
              <h5 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
                Recent Achievements
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-yellow-400">Gold</div>
                  <div className="text-xs text-gray-400">Hat-trick Hero</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">Platinum</div>
                  <div className="text-xs text-gray-400">Perfect Week</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'chemistry' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center mb-4">
              <Users className="w-5 h-5 mr-2" />
              Team Chemistry
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">95%</div>
                <div className="text-sm text-gray-400">Team Chemistry</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">8</div>
                <div className="text-sm text-gray-400">Strong Links</div>
              </div>
            </div>
            
            {/* Chemistry Links */}
            <div className="space-y-2">
              <h5 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                Strong Links
              </h5>
              {[
                { name: 'Midfielder A', strength: 95 },
                { name: 'Defender B', strength: 88 },
                { name: 'Striker C', strength: 82 },
              ].map((link, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                  <span className="text-white text-sm">{link.name}</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-600 rounded-full h-2 mr-2">
                      <div
                        className="bg-green-400 h-2 rounded-full"
                        style={{ width: `${link.strength}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{link.strength}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="px-6 pb-6">
        <div className="flex space-x-3">
          <button
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(player);
            }}
          >
            Edit Player
          </button>
          <button
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onCompare?.(player);
            }}
          >
            Compare
          </button>
          <button
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onSwap?.(player);
            }}
          >
            Swap
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN PLAYER CARD COMPONENT
// ============================================================================

export const ProfessionalPlayerCard: React.FC<PlayerCardProps> = ({
  size = 'standard',
  ...props
}) => {
  switch (size) {
    case 'compact':
      return <CompactPlayerCard {...props} />;
    case 'standard':
      return <StandardPlayerCard {...props} />;
    case 'detailed':
      return <DetailedPlayerCard {...props} />;
    case 'full':
      return <FullPlayerCard {...props} />;
    default:
      return <StandardPlayerCard {...props} />;
  }
};

export default ProfessionalPlayerCard;
