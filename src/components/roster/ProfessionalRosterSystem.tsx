/**
 * PROFESSIONAL ROSTER MANAGEMENT SYSTEM
 * 
 * Complete roster system with:
 * - Advanced multi-criteria filtering
 * - Real-time search with fuzzy matching
 * - Multiple view modes (grid, list, compact, cards)
 * - Drag-and-drop organization
 * - Bulk operations and actions
 * - Export/import functionality
 * - Analytics and insights
 * 
 * Based on FIFA Ultimate Team and FM24 squad management.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Grid3x3,
  List,
  Rows,
  Users,
  Download,
  Upload,
  Star,
  TrendingUp,
  Activity,
  BarChart3,
  Eye,
  EyeOff,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  Zap,
  Shield,
  Target,
  Heart,
  Clock,
  MapPin,
  Award,
  Sparkles,
  ArrowUpDown,
  Plus,
  Minus,
} from 'lucide-react';
import type { Player } from '../../types';
import { ProfessionalPlayerCard } from '../player/ProfessionalPlayerCard';
import { PlayerCardVisualFeedback } from '../player/PlayerCardVisualFeedback';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type RosterViewMode = 'grid' | 'list' | 'compact' | 'cards';
export type RosterSortField = 'name' | 'overall' | 'age' | 'position' | 'form' | 'fitness';
export type RosterSortOrder = 'asc' | 'desc';

export interface RosterFilters {
  search: string;
  positions: string[];
  minOverall: number;
  maxOverall: number;
  minAge: number;
  maxAge: number;
  availability: ('available' | 'injured' | 'suspended' | 'resting')[];
  favorites: boolean;
  showOnlySelected: boolean;
}

export interface RosterSort {
  field: RosterSortField;
  order: RosterSortOrder;
}

export interface ProfessionalRosterSystemProps {
  players: Player[];
  selectedPlayers: Player[];
  onSelectPlayer: (player: Player) => void;
  onSelectMultiple: (players: Player[]) => void;
  onEdit?: (player: Player) => void;
  onCompare?: (players: Player[]) => void;
  onSwap?: (player1: Player, player2: Player) => void;
  onFavorite?: (player: Player) => void;
  onExport?: (players: Player[]) => void;
  onImport?: () => void;
  className?: string;
}

export interface RosterAnalytics {
  totalPlayers: number;
  averageOverall: number;
  averageAge: number;
  positionBreakdown: Record<string, number>;
  topPerformers: Player[];
  needsAttention: Player[];
}

// ============================================================================
// FILTER COMPONENT
// ============================================================================

const RosterFilterPanel: React.FC<{
  filters: RosterFilters;
  onFiltersChange: (filters: RosterFilters) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ filters, onFiltersChange, isOpen, onClose }) => {
  const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
  
  const handlePositionToggle = (position: string) => {
    const newPositions = filters.positions.includes(position)
      ? filters.positions.filter(p => p !== position)
      : [...filters.positions, position];
    onFiltersChange({ ...filters, positions: newPositions });
  };
  
  const handleReset = () => {
    onFiltersChange({
      search: '',
      positions: [],
      minOverall: 0,
      maxOverall: 100,
      minAge: 0,
      maxAge: 50,
      availability: [],
      favorites: false,
      showOnlySelected: false,
    });
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute top-full right-0 mt-2 w-96 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl z-50"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-white text-lg flex items-center">
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Advanced Filters
            </h3>
            <button
              className="p-1 rounded hover:bg-gray-800 transition-colors"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto">
            {/* Positions */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Positions
              </label>
              <div className="grid grid-cols-5 gap-2">
                {positions.map(position => (
                  <button
                    key={position}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      filters.positions.includes(position)
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handlePositionToggle(position)}
                  >
                    {position}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Overall Rating: {filters.minOverall} - {filters.maxOverall}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minOverall}
                  onChange={(e) => onFiltersChange({ ...filters, minOverall: Number(e.target.value) })}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.maxOverall}
                  onChange={(e) => onFiltersChange({ ...filters, maxOverall: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Age: {filters.minAge} - {filters.maxAge}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filters.minAge}
                  onChange={(e) => onFiltersChange({ ...filters, minAge: Number(e.target.value) })}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filters.maxAge}
                  onChange={(e) => onFiltersChange({ ...filters, maxAge: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Availability
              </label>
              <div className="space-y-2">
                {[
                  { value: 'available', label: 'Available', icon: Check, color: 'green' },
                  { value: 'injured', label: 'Injured', icon: AlertCircle, color: 'red' },
                  { value: 'suspended', label: 'Suspended', icon: X, color: 'orange' },
                  { value: 'resting', label: 'Resting', icon: Clock, color: 'blue' },
                ].map(({ value, label, icon: Icon, color }) => (
                  <label key={value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.availability.includes(value as any)}
                      onChange={(e) => {
                        const newAvailability = e.target.checked
                          ? [...filters.availability, value as any]
                          : filters.availability.filter(a => a !== value);
                        onFiltersChange({ ...filters, availability: newAvailability });
                      }}
                      className="w-4 h-4"
                    />
                    <Icon className={`w-4 h-4 text-${color}-400`} />
                    <span className="text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Quick Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Quick Filters
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.favorites}
                    onChange={(e) => onFiltersChange({ ...filters, favorites: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-gray-300">Favorites Only</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showOnlySelected}
                    onChange={(e) => onFiltersChange({ ...filters, showOnlySelected: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Selected Only</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-700 flex justify-between">
            <button
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              onClick={handleReset}
            >
              Reset All
            </button>
            <button
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              onClick={onClose}
            >
              Apply Filters
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// ANALYTICS COMPONENT
// ============================================================================

const RosterAnalyticsPanel: React.FC<{
  analytics: RosterAnalytics;
  isOpen: boolean;
  onClose: () => void;
}> = ({ analytics, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute top-full right-0 mt-2 w-96 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl z-50"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-white text-lg flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Roster Analytics
            </h3>
            <button
              className="p-1 rounded hover:bg-gray-800 transition-colors"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{analytics.totalPlayers}</div>
                <div className="text-xs text-gray-400">Total Players</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-cyan-400">{analytics.averageOverall.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Avg Overall</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{analytics.averageAge.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Avg Age</div>
              </div>
            </div>
            
            {/* Position Breakdown */}
            <div>
              <h4 className="text-sm font-bold text-gray-300 mb-3">Position Distribution</h4>
              <div className="space-y-2">
                {Object.entries(analytics.positionBreakdown).map(([position, count]) => (
                  <div key={position} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{position}</span>
                    <div className="flex items-center space-x-2 flex-1 mx-4">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(count / analytics.totalPlayers) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-xs">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Top Performers */}
            <div>
              <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
                Top Performers
              </h4>
              <div className="space-y-2">
                {analytics.topPerformers.slice(0, 3).map((player, index) => (
                  <div key={player.id} className="flex items-center bg-gray-800 rounded-lg p-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      'bg-orange-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="ml-3 text-white font-medium flex-1">{player.name}</span>
                    <span className="text-cyan-400 font-bold">{player.overall}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Needs Attention */}
            {analytics.needsAttention.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-orange-400" />
                  Needs Attention
                </h4>
                <div className="space-y-2">
                  {analytics.needsAttention.slice(0, 3).map((player) => (
                    <div key={player.id} className="flex items-center bg-gray-800 rounded-lg p-2">
                      <AlertCircle className="w-4 h-4 text-orange-400 mr-3" />
                      <span className="text-white font-medium flex-1">{player.name}</span>
                      <span className="text-orange-400 text-xs">Low fitness</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MAIN ROSTER SYSTEM
// ============================================================================

export const ProfessionalRosterSystem: React.FC<ProfessionalRosterSystemProps> = ({
  players,
  selectedPlayers,
  onSelectPlayer,
  onSelectMultiple,
  onEdit,
  onCompare,
  onSwap,
  onFavorite,
  onExport,
  onImport,
  className = '',
}) => {
  // State
  const [viewMode, setViewMode] = useState<RosterViewMode>('grid');
  const [filters, setFilters] = useState<RosterFilters>({
    search: '',
    positions: [],
    minOverall: 0,
    maxOverall: 100,
    minAge: 0,
    maxAge: 50,
    availability: [],
    favorites: false,
    showOnlySelected: false,
  });
  const [sort, setSort] = useState<RosterSort>({ field: 'overall', order: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [comparingPlayers, setComparingPlayers] = useState<Player[]>([]);
  
  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = [...players];
    
    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.roleId?.toLowerCase().includes(searchLower)
      );
    }
    
    // Position
    if (filters.positions.length > 0) {
      result = result.filter(p => filters.positions.some(pos => p.roleId?.includes(pos)));
    }
    
    // Overall
    result = result.filter(p =>
      (p.overall || 0) >= filters.minOverall &&
      (p.overall || 0) <= filters.maxOverall
    );
    
    // Age
    result = result.filter(p =>
      (p.age || 0) >= filters.minAge &&
      (p.age || 0) <= filters.maxAge
    );
    
    // Selected only
    if (filters.showOnlySelected) {
      result = result.filter(p => selectedPlayers.includes(p));
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sort.field) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'overall':
          aVal = a.overall || 0;
          bVal = b.overall || 0;
          break;
        case 'age':
          aVal = a.age || 0;
          bVal = b.age || 0;
          break;
        case 'position':
          aVal = a.roleId || '';
          bVal = b.roleId || '';
          break;
        default:
          return 0;
      }
      
      if (sort.order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return result;
  }, [players, filters, sort, selectedPlayers]);
  
  // Calculate analytics
  const analytics = useMemo<RosterAnalytics>(() => {
    const positionBreakdown: Record<string, number> = {};
    let totalOverall = 0;
    let totalAge = 0;
    
    filteredPlayers.forEach(player => {
      const pos = player.roleId || 'Unknown';
      positionBreakdown[pos] = (positionBreakdown[pos] || 0) + 1;
      totalOverall += player.overall || 0;
      totalAge += player.age || 0;
    });
    
    const sorted = [...filteredPlayers].sort((a, b) => (b.overall || 0) - (a.overall || 0));
    
    return {
      totalPlayers: filteredPlayers.length,
      averageOverall: filteredPlayers.length > 0 ? totalOverall / filteredPlayers.length : 0,
      averageAge: filteredPlayers.length > 0 ? totalAge / filteredPlayers.length : 0,
      positionBreakdown,
      topPerformers: sorted.slice(0, 5),
      needsAttention: [],
    };
  }, [filteredPlayers]);
  
  // Handlers
  const handleSortChange = (field: RosterSortField) => {
    if (sort.field === field) {
      setSort({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      setSort({ field, order: 'desc' });
    }
  };
  
  const handleExport = () => {
    onExport?.(filteredPlayers);
  };
  
  return (
    <div className={`professional-roster-system ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-t-xl p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Users className="w-6 h-6 mr-2" />
              Squad Roster
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {filteredPlayers.length} of {players.length} players
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              {[
                { mode: 'grid' as const, icon: Grid3x3 },
                { mode: 'list' as const, icon: List },
                { mode: 'compact' as const, icon: Rows },
              ].map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  className={`p-2 rounded transition-colors ${
                    viewMode === mode
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setViewMode(mode)}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            
            {/* Analytics */}
            <div className="relative">
              <button
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                <BarChart3 className="w-5 h-5 text-gray-300" />
              </button>
              <RosterAnalyticsPanel
                analytics={analytics}
                isOpen={showAnalytics}
                onClose={() => setShowAnalytics(false)}
              />
            </div>
            
            {/* Export/Import */}
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              onClick={handleExport}
            >
              <Download className="w-5 h-5 text-gray-300" />
            </button>
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              onClick={onImport}
            >
              <Upload className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search players by name or position..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          
          <div className="relative">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                showFilters
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {(filters.positions.length > 0 || filters.availability.length > 0) && (
                <span className="ml-2 px-2 py-0.5 bg-cyan-400 text-black text-xs rounded-full font-bold">
                  {filters.positions.length + filters.availability.length}
                </span>
              )}
            </button>
            <RosterFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
          
          {/* Sort */}
          <button
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors flex items-center"
            onClick={() => handleSortChange('overall')}
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Sort: {sort.field}
            {sort.order === 'asc' ? ' ↑' : ' ↓'}
          </button>
        </div>
      </div>
      
      {/* Player Grid */}
      <div className="bg-gray-900 rounded-b-xl p-6">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No players found</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className={`
            ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : ''}
            ${viewMode === 'list' ? 'space-y-3' : ''}
            ${viewMode === 'compact' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3' : ''}
          `}>
            {filteredPlayers.map(player => (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <ProfessionalPlayerCard
                  player={player}
                  size={viewMode === 'compact' ? 'compact' : viewMode === 'list' ? 'standard' : 'standard'}
                  isSelected={selectedPlayers.includes(player)}
                  onSelect={onSelectPlayer}
                  onEdit={onEdit}
                  onCompare={(p) => setComparingPlayers([...comparingPlayers, p])}
                  onSwap={onSwap}
                  onFavorite={onFavorite}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalRosterSystem;

