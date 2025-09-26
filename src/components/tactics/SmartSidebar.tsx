import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  Star, 
  BarChart3, 
  Target,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { type Formation, type Player } from '../../types';

interface SmartSidebarProps {
  state: 'collapsed' | 'peek' | 'expanded';
  onToggle: () => void;
  formation: Formation | undefined;
  selectedPlayer: Player | null;
  onPlayerSelect: (player: Player) => void;
  side: 'left' | 'right';
}

type SidebarContent = 'players' | 'formations' | 'analytics' | 'tools';

const SmartSidebar: React.FC<SmartSidebarProps> = ({
  state,
  onToggle,
  formation,
  selectedPlayer,
  onPlayerSelect,
  side
}) => {
  const [activeContent, setActiveContent] = useState<SidebarContent>('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['outfield']));

  // Mock player data
  const allPlayers = useMemo(() => [
    { id: '1', name: 'João Silva', roleId: 'goalkeeper', rating: 88, age: 28, pace: 65, technical: 85 },
    { id: '2', name: 'Marco Rossi', roleId: 'center-back', rating: 85, age: 26, pace: 70, technical: 78 },
    { id: '3', name: 'Ahmed Hassan', roleId: 'left-back', rating: 82, age: 24, pace: 85, technical: 80 },
    { id: '4', name: 'Hans Mueller', roleId: 'right-back', rating: 84, age: 25, pace: 83, technical: 79 },
    { id: '5', name: 'Pierre Dubois', roleId: 'defensive-midfielder', rating: 87, age: 29, pace: 72, technical: 88 },
    { id: '6', name: 'Carlos Rodriguez', roleId: 'central-midfielder', rating: 86, age: 27, pace: 76, technical: 90 },
    { id: '7', name: 'Takeshi Nakamura', roleId: 'attacking-midfielder', rating: 89, age: 25, pace: 80, technical: 92 },
    { id: '8', name: 'Viktor Petrov', roleId: 'left-winger', rating: 84, age: 23, pace: 92, technical: 85 },
    { id: '9', name: 'Roberto Santos', roleId: 'striker', rating: 90, age: 28, pace: 88, technical: 87 },
    { id: '10', name: 'James Thompson', roleId: 'right-winger', rating: 83, age: 22, pace: 90, technical: 82 },
    { id: '11', name: 'Luca Bianchi', roleId: 'striker', rating: 86, age: 30, pace: 78, technical: 89 }
  ], []);

  // Filtered players
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter(player =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.roleId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allPlayers, searchQuery]);

  // Group players by position
  const groupedPlayers = useMemo(() => {
    const groups = {
      goalkeeper: filteredPlayers.filter(p => p.roleId === 'goalkeeper'),
      defense: filteredPlayers.filter(p => 
        p.roleId.includes('back') || p.roleId.includes('center-back')
      ),
      midfield: filteredPlayers.filter(p => 
        p.roleId.includes('midfielder') && !p.roleId.includes('attacking')
      ),
      attack: filteredPlayers.filter(p => 
        p.roleId.includes('winger') || p.roleId.includes('striker') || p.roleId.includes('attacking-midfielder')
      )
    };
    return groups;
  }, [filteredPlayers]);

  const sidebarContent = [
    { id: 'players', name: 'Players', icon: Users, count: allPlayers.length },
    { id: 'formations', name: 'Formations', icon: Target, count: 5 },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, count: 0 },
    { id: 'tools', name: 'Tools', icon: Star, count: 0 }
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const renderPlayerCard = (player: Player, isAssigned: boolean = false) => (
    <motion.div
      key={player.id}
      layout
      initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
      className={`
        p-3 rounded-lg border cursor-pointer transition-all
        ${selectedPlayer?.id === player.id
          ? 'border-blue-500/50 bg-blue-600/20'
          : isAssigned
            ? 'border-green-500/30 bg-green-900/20'
            : 'border-slate-600/50 bg-slate-800/30 hover:border-slate-500/50'
        }
      `}
      onClick={() => onPlayerSelect(player)}
    >
      <div className="flex items-center gap-3">
        <div 
          className={`
            w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
            ${isAssigned ? 'bg-green-600' : 'bg-blue-600'}
          `}
        >
          {player.number || player.name.charAt(0)}
        </div>
        
        {state === 'expanded' && (
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm truncate">
              {player.name}
            </div>
            <div className="text-slate-400 text-xs">
              {player.roleId?.replace('-', ' ').toUpperCase()}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs text-slate-400">
                Rating: <span className="text-white">{player.rating}</span>
              </div>
              {isAssigned && (
                <div className="text-xs text-green-400 bg-green-900/30 px-1 rounded">
                  Active
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (state === 'collapsed') return null;

  return (
    <div className="h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-700/50">
        {state === 'expanded' ? (
          <div>
            <h3 className="text-white font-semibold mb-3">Tactical Manager</h3>
            
            {/* Content Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-slate-800/50 rounded-lg p-1">
              {sidebarContent.slice(0, 2).map(content => {
                const IconComponent = content.icon;
                return (
                  <button
                    key={content.id}
                    onClick={() => setActiveContent(content.id as SidebarContent)}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-all
                      ${activeContent === content.id
                        ? 'bg-blue-600/80 text-white'
                        : 'text-slate-400 hover:text-white'
                      }
                    `}
                  >
                    <IconComponent className="w-3 h-3" />
                    {content.name}
                    {content.count > 0 && (
                      <span className="bg-slate-700/50 px-1 rounded text-xs">
                        {content.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sidebarContent.slice(0, 2).map(content => {
              const IconComponent = content.icon;
              return (
                <button
                  key={content.id}
                  onClick={() => setActiveContent(content.id as SidebarContent)}
                  className={`
                    w-full p-2 rounded-lg transition-all
                    ${activeContent === content.id
                      ? 'bg-blue-600/80 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }
                  `}
                  title={content.name}
                >
                  <IconComponent className="w-5 h-5 mx-auto" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Players Content */}
        {activeContent === 'players' && (
          <div className="p-4 space-y-4">
            {state === 'expanded' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}

            {/* Player Groups */}
            {Object.entries(groupedPlayers).map(([group, players]) => {
              if (players.length === 0) return null;
              
              const isExpanded = expandedSections.has(group);
              
              return (
                <div key={group}>
                  {state === 'expanded' && (
                    <button
                      onClick={() => toggleSection(group)}
                      className="flex items-center justify-between w-full text-left mb-2 p-2 rounded hover:bg-slate-700/30 transition-all"
                    >
                      <span className="text-slate-300 font-medium text-sm capitalize">
                        {group} ({players.length})
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  )}
                  
                  <AnimatePresence>
                    {(state === 'peek' || isExpanded) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        {players.map(player => {
                          const isAssigned = formation?.slots?.some(slot => slot.playerId === player.id);
                          return renderPlayerCard(player, isAssigned);
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* Formations Content */}
        {activeContent === 'formations' && state === 'expanded' && (
          <div className="p-4">
            <div className="text-slate-400 text-sm text-center py-8">
              Formation templates will appear here
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { SmartSidebar };
export default SmartSidebar;