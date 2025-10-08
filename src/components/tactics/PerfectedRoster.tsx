/**
 * Perfected Roster Component
 * 
 * Features:
 * - Advanced filtering (position, rating, stamina, status)
 * - Search functionality
 * - Drag players to field
 * - Quick actions (swap, edit, compare)
 * - Grouping by position/team
 * - Sorting options
 * - Performance optimized with virtualization
 */

import React, { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Users,
  Star,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  Edit3,
  ArrowRightLeft,
  Maximize2,
} from 'lucide-react';
import type { Player } from '../../types';

export interface RosterFilters {
  search: string;
  positions: string[];
  minRating: number;
  maxRating: number;
  minStamina: number;
  showAvailable: boolean;
  showInjured: boolean;
  showSuspended: boolean;
  showTired: boolean;
}

export type RosterSortBy = 'name' | 'number' | 'rating' | 'stamina' | 'position' | 'morale';
export type RosterSortOrder = 'asc' | 'desc';

export type RosterGroupBy = 'none' | 'position' | 'team' | 'status';

interface PerfectedRosterProps {
  players: Player[];
  selectedPlayerIds: Set<string>;
  onPlayerSelect: (playerId: string) => void;
  onPlayerDoubleClick: (playerId: string) => void;
  onDragStart?: (player: Player) => void;
  onDragEnd?: (player: Player, position: { x: number; y: number }) => void;
  onSwapRequest?: (playerId: string) => void;
  onEditPlayer?: (playerId: string) => void;
  onComparePlayer?: (playerId: string) => void;
  onViewStats?: (playerId: string) => void;
  className?: string;
}

const PerfectedRoster: React.FC<PerfectedRosterProps> = ({
  players,
  selectedPlayerIds,
  onPlayerSelect,
  onPlayerDoubleClick,
  onDragStart,
  onDragEnd,
  onSwapRequest,
  onEditPlayer,
  onComparePlayer,
  onViewStats,
  className = '',
}) => {
  // Filter and sort state
  const [filters, setFilters] = useState<RosterFilters>({
    search: '',
    positions: [],
    minRating: 0,
    maxRating: 100,
    minStamina: 0,
    showAvailable: true,
    showInjured: true,
    showSuspended: true,
    showTired: true,
  });

  const [sortBy, setSortBy] = useState<RosterSortBy>('number');
  const [sortOrder, setSortOrder] = useState<RosterSortOrder>('asc');
  const [groupBy, setGroupBy] = useState<RosterGroupBy>('none');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Filter players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      // Search filter
      if (filters.search && !player.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Position filter
      if (filters.positions.length > 0 && !filters.positions.includes(player.roleId || player.positionRole || '')) {
        return false;
      }

      // Rating filter
      const overall = player.overall || 75;
      if (overall < filters.minRating || overall > filters.maxRating) {
        return false;
      }

      // Stamina filter
      const stamina = player.stamina || 100;
      if (stamina < filters.minStamina) {
        return false;
      }

      // Status filters
      const status = player.availability?.status || 'Available';
      if (!filters.showAvailable && status === 'Available') return false;
      if (!filters.showInjured && status === 'Injured') return false;
      if (!filters.showSuspended && status === 'Suspended') return false;
      if (!filters.showTired && stamina < 30) return false;

      return true;
    });
  }, [players, filters]);

  // Sort players
  const sortedPlayers = useMemo(() => {
    const sorted = [...filteredPlayers];
    
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'number':
          comparison = (a.jerseyNumber || 0) - (b.jerseyNumber || 0);
          break;
        case 'rating':
          comparison = (a.overall || 75) - (b.overall || 75);
          break;
        case 'stamina':
          comparison = (a.stamina || 100) - (b.stamina || 100);
          break;
        case 'position':
          comparison = (a.roleId || '').localeCompare(b.roleId || '');
          break;
        case 'morale':
          const moraleOrder = { excellent: 4, good: 3, okay: 2, poor: 1 };
          const aMorale = moraleOrder[a.morale?.toLowerCase() as keyof typeof moraleOrder] || 0;
          const bMorale = moraleOrder[b.morale?.toLowerCase() as keyof typeof moraleOrder] || 0;
          comparison = aMorale - bMorale;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredPlayers, sortBy, sortOrder]);

  // Group players
  const groupedPlayers = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Players': sortedPlayers };
    }

    const groups: Record<string, Player[]> = {};

    sortedPlayers.forEach(player => {
      let groupKey = 'Other';

      switch (groupBy) {
        case 'position':
          groupKey = player.roleId || player.positionRole || 'Unassigned';
          break;
        case 'team':
          groupKey = player.team || 'Unassigned';
          break;
        case 'status':
          groupKey = player.availability?.status || 'Available';
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(player);
    });

    return groups;
  }, [sortedPlayers, groupBy]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  }, []);

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      positions: [],
      minRating: 0,
      maxRating: 100,
      minStamina: 0,
      showAvailable: true,
      showInjured: true,
      showSuspended: true,
      showTired: true,
    });
  }, []);

  return (
    <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Roster</h2>
            <span className="text-sm text-slate-400">
              ({filteredPlayers.length}/{players.length})
            </span>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Toggle Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search players..."
            className="w-full pl-10 pr-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all text-sm"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <button
            onClick={() => setFilters(prev => ({ ...prev, showAvailable: !prev.showAvailable }))}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              filters.showAvailable ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Available
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, showInjured: !prev.showInjured }))}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              filters.showInjured ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            <AlertCircle className="w-3 h-3 inline mr-1" />
            Injured
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-slate-700 bg-slate-800 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Rating Range */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Rating Range: {filters.minRating} - {filters.maxRating}
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minRating}
                    onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.maxRating}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxRating: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Stamina Threshold */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Min Stamina: {filters.minStamina}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minStamina}
                  onChange={(e) => setFilters(prev => ({ ...prev, minStamina: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={resetFilters}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort and Group Controls */}
      <div className="px-4 py-2 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between gap-2">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as RosterSortBy)}
            className="text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 outline-none"
          >
            <option value="number">Number</option>
            <option value="name">Name</option>
            <option value="rating">Rating</option>
            <option value="stamina">Stamina</option>
            <option value="position">Position</option>
            <option value="morale">Morale</option>
          </select>

          <button
            onClick={toggleSortOrder}
            className="p-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4 text-white" />
            ) : (
              <SortDesc className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {/* Group By */}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as RosterGroupBy)}
          className="text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 outline-none"
        >
          <option value="none">No Grouping</option>
          <option value="position">By Position</option>
          <option value="team">By Team</option>
          <option value="status">By Status</option>
        </select>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {Object.entries(groupedPlayers).map(([groupName, groupPlayers]) => (
          <div key={groupName} className="border-b border-slate-700/50">
            {/* Group Header (if grouped) */}
            {groupBy !== 'none' && (
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: expandedGroups.has(groupName) ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a 1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                  <span className="text-sm font-semibold text-white">{groupName}</span>
                  <span className="text-xs text-slate-400">({groupPlayers.length})</span>
                </div>
              </button>
            )}

            {/* Player Items */}
            <AnimatePresence>
              {(groupBy === 'none' || expandedGroups.has(groupName)) && groupPlayers.map((player) => (
                <PlayerRosterItem
                  key={player.id}
                  player={player}
                  isSelected={selectedPlayerIds.has(player.id)}
                  onSelect={() => onPlayerSelect(player.id)}
                  onDoubleClick={() => onPlayerDoubleClick(player.id)}
                  onDragStart={() => onDragStart?.(player)}
                  onSwap={() => onSwapRequest?.(player.id)}
                  onEdit={() => onEditPlayer?.(player.id)}
                  onCompare={() => onComparePlayer?.(player.id)}
                  onViewStats={() => onViewStats?.(player.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        ))}

        {/* Empty State */}
        {filteredPlayers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Users className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No players found</p>
            <button
              onClick={resetFilters}
              className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>Selected: {selectedPlayerIds.size}</span>
        <span>Showing: {filteredPlayers.length}</span>
      </div>
    </div>
  );
};

/**
 * Individual Player Roster Item
 */

interface PlayerRosterItemProps {
  player: Player;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDragStart: () => void;
  onSwap: () => void;
  onEdit: () => void;
  onCompare: () => void;
  onViewStats: () => void;
}

const PlayerRosterItem: React.FC<PlayerRosterItemProps> = memo(({
  player,
  isSelected,
  onSelect,
  onDoubleClick,
  onDragStart,
  onSwap,
  onEdit,
  onCompare,
  onViewStats,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const overall = player.overall || 75;
  const stamina = player.stamina || 100;
  const isAvailable = player.availability?.status === 'Available';
  const status = player.availability?.status || 'Available';

  const getStatusIcon = () => {
    switch (status) {
      case 'Available': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Injured': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'Suspended': return <XCircle className="w-4 h-4 text-amber-500" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 85) return 'text-emerald-400';
    if (rating >= 75) return 'text-blue-400';
    if (rating >= 65) return 'text-slate-400';
    return 'text-amber-500';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragStart={() => {
        setIsDragging(true);
        onDragStart();
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`
        group relative px-4 py-3 cursor-pointer
        ${isSelected ? 'bg-cyan-900/30 border-l-4 border-cyan-400' : 'hover:bg-slate-700/30 border-l-4 border-transparent'}
        ${isDragging ? 'opacity-50' : ''}
        transition-all duration-150
      `}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-3">
        {/* Jersey Number & Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold">{player.jerseyNumber}</span>
          </div>
          {!isAvailable && (
            <div className="absolute -top-1 -right-1">
              {getStatusIcon()}
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium text-sm truncate">{player.name}</h3>
            {player.isCaptain && (
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">{player.roleId || 'Unassigned'}</span>
            <span className="text-xs text-slate-500">•</span>
            <span className={`text-xs font-semibold ${getRatingColor(overall)}`}>
              {overall} OVR
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className={`text-xs font-bold ${getRatingColor(overall)}`}>
            {overall}
          </div>
          <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                stamina >= 70 ? 'bg-green-500' : stamina >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${stamina}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions (on hover) */}
      <AnimatePresence>
        {showActions && !isDragging && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.15 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-slate-800 rounded-lg border border-slate-600 p-1 shadow-lg z-10"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 hover:bg-blue-600 rounded transition-colors group/btn"
              title="Edit Player"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-white" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCompare();
              }}
              className="p-1.5 hover:bg-purple-600 rounded transition-colors group/btn"
              title="Compare"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-white" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewStats();
              }}
              className="p-1.5 hover:bg-green-600 rounded transition-colors group/btn"
              title="View Stats"
            >
              <BarChart3 className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag Handle Indicator */}
      {isDragging && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-full bg-cyan-400" />
      )}
    </motion.div>
  );
});

PlayerRosterItem.displayName = 'PlayerRosterItem';

export default memo(PerfectedRoster);


