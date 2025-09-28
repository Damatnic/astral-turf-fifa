import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Users, User, Shield, Zap, Target } from 'lucide-react';
import { Player } from '../../types';
import { PLAYER_ROLES } from '../../constants';
import { groupPlayersByPosition } from '../../utils/sampleTacticsData';

interface PositionalBenchProps {
  players: Player[];
  selectedPlayer?: Player | null;
  onPlayerSelect: (player: Player) => void;
  onPlayerDragStart?: (player: Player) => void;
  className?: string;
}

interface PositionGroupProps {
  title: string;
  icon: React.ReactNode;
  players: Player[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedPlayerId?: string;
  onPlayerSelect: (player: Player) => void;
  onPlayerDragStart?: (player: Player) => void;
}

const PositionGroup: React.FC<PositionGroupProps> = ({
  title,
  icon,
  players,
  isExpanded,
  onToggle,
  selectedPlayerId,
  onPlayerSelect,
  onPlayerDragStart
}) => {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
      {/* Group Header */}
      <motion.button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 rounded-lg transition-colors"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <div className="text-slate-400">
            {icon}
          </div>
          <div className="text-left">
            <div className="text-white font-medium text-sm">{title}</div>
            <div className="text-slate-400 text-xs">{players.length} player{players.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Player List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {players.map((player) => {
                const role = PLAYER_ROLES.find(r => r.id === player.roleId);
                const isSelected = selectedPlayerId === player.id;
                
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    draggable
                    onDragStart={() => onPlayerDragStart?.(player)}
                    onClick={() => onPlayerSelect(player)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'bg-blue-600/20 border border-blue-400/50 shadow-lg' 
                        : 'bg-slate-700/30 hover:bg-slate-600/40 border border-transparent'
                      }
                    `}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Player Avatar */}
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                          ${player.team === 'home' ? 'bg-blue-600' : 'bg-red-600'}
                        `}>
                          {player.jerseyNumber || role?.abbreviation || '?'}
                        </div>
                        
                        {/* Player Info */}
                        <div>
                          <div className="text-white font-medium text-sm">{player.name}</div>
                          <div className="text-slate-400 text-xs">{role?.name || 'Unknown'}</div>
                        </div>
                      </div>
                      
                      {/* Player Stats */}
                      <div className="text-right">
                        <div className="text-white text-sm font-medium">
                          {player.stats?.overall || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Stamina */}
                          <div className="w-4 h-1 bg-slate-600 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                player.stamina >= 80 ? 'bg-green-400' :
                                player.stamina >= 60 ? 'bg-yellow-400' :
                                'bg-red-400'
                              }`}
                              style={{ width: `${player.stamina}%` }}
                            />
                          </div>
                          
                          {/* Morale Indicator */}
                          <div className={`w-2 h-2 rounded-full ${
                            player.morale === 'Excellent' ? 'bg-green-400' :
                            player.morale === 'Good' ? 'bg-blue-400' :
                            player.morale === 'Okay' ? 'bg-yellow-400' :
                            player.morale === 'Poor' ? 'bg-orange-400' :
                            'bg-red-400'
                          }`} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Availability Status */}
                    {player.availability?.status !== 'Available' && (
                      <div className="mt-2 px-2 py-1 bg-red-900/30 border border-red-700/50 rounded text-red-400 text-xs">
                        {player.availability?.status}
                        {player.availability?.returnDate && (
                          <span className="block text-red-500/70">
                            Return: {player.availability.returnDate}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
              
              {players.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-sm">
                  No players in this position
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PositionalBench: React.FC<PositionalBenchProps> = ({
  players,
  selectedPlayer,
  onPlayerSelect,
  onPlayerDragStart,
  className = ''
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Goalkeepers': true,
    'Defenders': true,
    'Midfielders': true,
    'Forwards': true
  });

  const groupedPlayers = useMemo(() => groupPlayersByPosition(players), [players]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'Goalkeepers':
        return <Shield className="w-4 h-4" />;
      case 'Defenders':
        return <Shield className="w-4 h-4" />;
      case 'Midfielders':
        return <Zap className="w-4 h-4" />;
      case 'Forwards':
        return <Target className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const totalPlayers = Object.values(groupedPlayers).reduce((sum, group) => sum + group.length, 0);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-400" />
          <h3 className="text-white font-semibold">Bench</h3>
        </div>
        <div className="text-slate-400 text-sm">
          {totalPlayers} player{totalPlayers !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <motion.button
          onClick={() => setExpandedGroups({
            'Goalkeepers': true,
            'Defenders': true,
            'Midfielders': true,
            'Forwards': true
          })}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Expand All
        </motion.button>
        <motion.button
          onClick={() => setExpandedGroups({
            'Goalkeepers': false,
            'Defenders': false,
            'Midfielders': false,
            'Forwards': false
          })}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Collapse All
        </motion.button>
      </div>

      {/* Position Groups */}
      <div className="space-y-2">
        {Object.entries(groupedPlayers).map(([position, positionPlayers]) => (
          <PositionGroup
            key={position}
            title={position}
            icon={getPositionIcon(position)}
            players={positionPlayers}
            isExpanded={expandedGroups[position]}
            onToggle={() => toggleGroup(position)}
            selectedPlayerId={selectedPlayer?.id}
            onPlayerSelect={onPlayerSelect}
            onPlayerDragStart={onPlayerDragStart}
          />
        ))}
      </div>

      {totalPlayers === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <div className="text-sm">No bench players available</div>
          <div className="text-xs mt-1">All players are in the starting formation</div>
        </div>
      )}
    </div>
  );
};

export default PositionalBench;