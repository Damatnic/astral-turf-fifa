import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTacticsContext, useUIContext } from '../../hooks';
import {
  Users,
  Settings,
  Play,
  Search,
  Filter,
  Target,
  Plus,
  Star,
  ChevronRight,
  ChevronDown,
  Copy,
  Trash2,
  PlusCircle,
  Sparkles,
  BarChart3,
  Zap,
  Minimize2,
  AlignJustify,
  Maximize2,
} from 'lucide-react';
import type { Player, Formation, Team } from '../../types';

type PlayerCardViewMode = 'compact' | 'comfortable' | 'spacious';

interface PlayerListItemProps {
  player: Player;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onAssignTeam: (team: Team) => void;
  isOnField: boolean;
  viewMode?: PlayerCardViewMode;
}

/**
 * Individual player item in the roster with drag-and-drop functionality
 */
const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  isSelected,
  onSelect,
  onDoubleClick,
  onDragStart,
  onAssignTeam,
  isOnField,
  viewMode = 'comfortable',
}) => {
  const handleTeamClick = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
    onAssignTeam(team);
  };

  const avatarSize = viewMode === 'compact' ? 'w-6 h-6' : viewMode === 'comfortable' ? 'w-8 h-8' : 'w-10 h-10';
  const padding = viewMode === 'compact' ? 'p-1.5' : viewMode === 'comfortable' ? 'p-2' : 'p-3';
  const fontSize = viewMode === 'compact' ? 'text-xs' : 'text-sm';

  return (
    <motion.div
      layout
      draggable
      onDragStart={onDragStart as any}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      whileHover={{ scale: viewMode === 'compact' ? 1.01 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        group relative flex items-center ${padding} rounded-lg cursor-pointer transition-all
        ${
          isSelected
            ? 'bg-blue-600/30 ring-1 ring-blue-500'
            : isOnField
              ? 'bg-green-900/25 border border-green-500/40'
              : 'bg-slate-700 hover:bg-slate-700'
        }
      `}
    >
      {/* Player Avatar */}
      <div className={`flex-shrink-0 ${avatarSize} rounded-full flex items-center justify-center font-bold ${viewMode === 'compact' ? 'text-xs' : 'text-sm'} ${viewMode === 'compact' ? 'mr-2' : 'mr-3'} border-2 border-slate-600`}>
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: player.teamColor || '#6b7280' }}
        >
          {(player as any).number || player.name.charAt(0)}
        </div>
      </div>

      {/* Player Info */}
      <div className="flex-grow min-w-0">
        {viewMode === 'compact' ? (
          <div className="flex items-center justify-between">
            <p className={`font-semibold ${fontSize} text-white truncate`}>{player.name}</p>
            {isOnField && <div className="ml-2 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
            <span className="ml-2 text-xs text-slate-400 flex-shrink-0">{player.rating || 75}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center">
              <p className={`font-semibold ${fontSize} text-white truncate`}>{player.name}</p>
              {isOnField && <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
            </div>
            {viewMode !== 'compact' && (
              <div className="flex items-center mt-1">
                <p className="text-xs text-slate-400 capitalize truncate">
                  {player.roleId?.replace('-', ' ') || 'Player'}
                </p>
                <span className="ml-2 text-xs text-slate-400">Rating: {player.rating || 75}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Team Assignment Buttons */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => handleTeamClick(e, 'home')}
          className={`
            w-6 h-6 text-xs font-bold rounded flex items-center justify-center transition-colors
            ${
              player.team === 'home'
                ? 'bg-blue-600 text-white ring-1 ring-white'
                : 'bg-slate-600 text-slate-300 hover:bg-blue-600'
            }
          `}
          title="Assign to Home"
        >
          H
        </button>
        <button
          onClick={e => handleTeamClick(e, 'away')}
          className={`
            w-6 h-6 text-xs font-bold rounded flex items-center justify-center transition-colors
            ${
              player.team === 'away'
                ? 'bg-red-600 text-white ring-1 ring-white'
                : 'bg-slate-600 text-slate-300 hover:bg-red-600'
            }
          `}
          title="Assign to Away"
        >
          A
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Formation selector with quick actions
 */
const FormationSelector: React.FC<{
  formations: Record<string, Formation>;
  activeFormationId: string;
  onFormationChange: (formationId: string) => void;
  onSuggestFormation: () => void;
  isSuggesting: boolean;
}> = ({ formations, activeFormationId, onFormationChange, onSuggestFormation, isSuggesting }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center text-sm font-medium text-slate-300">
          <Target className="w-4 h-4 mr-2" />
          Formation
        </label>
      </div>

      <select
        value={activeFormationId}
        onChange={e => onFormationChange(e.target.value)}
        className="w-full p-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
      >
        {Object.entries(formations).map(([id, formation]) => (
          <option key={id} value={id}>
            {formation.name || id}
          </option>
        ))}
      </select>

      <button
        onClick={onSuggestFormation}
        disabled={isSuggesting}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center"
      >
        {isSuggesting ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            AI Formation Suggestion
          </>
        )}
      </button>
    </div>
  );
};

/**
 * Playbook management section
 */
const PlaybookSection: React.FC<{
  playbook: any;
  onCreatePlay: () => void;
  onLoadPlay: (playId: string) => void;
  onDuplicatePlay: (playId: string) => void;
  onDeletePlay: (playId: string) => void;
  activePlayId?: string;
}> = ({ playbook, onCreatePlay, onLoadPlay, onDuplicatePlay, onDeletePlay, activePlayId }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['General']));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const playsByCategory = useMemo(() => {
    const plays = Object.values(playbook || {});
    return plays.reduce((acc: any, play: any) => {
      const category = play.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(play);
      return acc;
    }, {});
  }, [playbook]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center text-sm font-medium text-slate-300">
          <Play className="w-4 h-4 mr-2" />
          Tactical Playbook
        </h3>
        <button
          onClick={onCreatePlay}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center"
        >
          <Plus className="w-3 h-3 mr-1" />
          Create
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {Object.entries(playsByCategory as Record<string, any[]>).map(([category, plays]) => (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between text-left text-xs font-bold uppercase text-slate-400 hover:bg-slate-700 px-2 py-1 rounded"
            >
              <span>
                {category} ({plays.length})
              </span>
              {expandedCategories.has(category) ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {expandedCategories.has(category) && (
              <div className="mt-1 space-y-1 pl-2 border-l-2 border-slate-700">
                {plays.map((play: any) => (
                  <div
                    key={play.id}
                    className={`
                      group flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-colors
                      ${
                        activePlayId === play.id
                          ? 'bg-blue-600/30 text-white font-semibold'
                          : 'hover:bg-slate-700 text-slate-300'
                      }
                    `}
                    onClick={() => onLoadPlay(play.id)}
                  >
                    <span className="truncate">{play.name}</span>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDuplicatePlay(play.id);
                        }}
                        className="p-1 hover:text-blue-400"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDeletePlay(play.id);
                        }}
                        className="p-1 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main LeftSidebar component with formation tools and player roster
 */
export const LeftSidebar: React.FC = () => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'position'>('name');
  const [isSuggestingFormation, setIsSuggestingFormation] = useState(false);
  const [playerCardViewMode, setPlayerCardViewMode] = useState<PlayerCardViewMode>(() => {
    // Load from localStorage or default to 'comfortable'
    const saved = localStorage.getItem('playerCardViewMode');
    return (saved as PlayerCardViewMode) || 'comfortable';
  });

  // Save view mode preference
  const handleViewModeChange = useCallback((mode: PlayerCardViewMode) => {
    setPlayerCardViewMode(mode);
    localStorage.setItem('playerCardViewMode', mode);
  }, []);

  // Extract data from context
  const { players, formations, activeFormationIds, playbook } = tacticsState;
  const { selectedPlayerId } = uiState;

  const activeFormationId = activeFormationIds?.home || Object.keys(formations)[0];
  const currentFormation = formations[activeFormationId];

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    const filtered = players.filter(player => {
      const matchesSearch =
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.roleId || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || (player.roleId || '').includes(filterRole);
      return matchesSearch && matchesRole;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'position':
          return (a.roleId || '').localeCompare(b.roleId || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [players, searchQuery, filterRole, sortBy]);

  // Determine which players are on field
  const playersOnField = useMemo(() => {
    if (!currentFormation?.slots) {
      return new Set();
    }

    return new Set(currentFormation.slots.map(slot => slot.playerId).filter(Boolean));
  }, [currentFormation]);

  // Separate on-field and bench players
  const onFieldPlayers = filteredPlayers.filter(p => playersOnField.has(p.id));
  const benchPlayers = filteredPlayers.filter(p => !playersOnField.has(p.id));

  // Event handlers
  const handleFormationChange = useCallback(
    (formationId: string) => {
      dispatch({
        type: 'SET_ACTIVE_FORMATION',
        payload: { formationId, team: 'home' },
      });
    },
    [dispatch],
  );

  const handlePlayerSelect = useCallback(
    (playerId: string) => {
      dispatch({
        type: 'SELECT_PLAYER',
        payload: playerId,
      });
    },
    [dispatch],
  );

  const handlePlayerDragStart = useCallback((e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData('text/plain', playerId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleAssignTeam = useCallback(
    (playerId: string, team: Team) => {
      dispatch({
        type: 'ASSIGN_PLAYER_TEAM',
        payload: { playerId, team },
      });
    },
    [dispatch],
  );

  const handleSuggestFormation = useCallback(async () => {
    setIsSuggestingFormation(true);
    try {
      // Mock AI suggestion - replace with actual AI service
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For now, just switch to a different formation
      const formationIds = Object.keys(formations);
      const currentIndex = formationIds.indexOf(activeFormationId);
      const nextIndex = (currentIndex + 1) % formationIds.length;
      handleFormationChange(formationIds[nextIndex]);
    } catch (error) {
      console.error('Formation suggestion failed:', error);
    } finally {
      setIsSuggestingFormation(false);
    }
  }, [formations, activeFormationId, handleFormationChange]);

  return (
    <aside className="w-80 bg-slate-900  flex flex-col shadow-lg h-full border-r border-slate-700">
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Formation Selector */}
        <FormationSelector
          formations={formations}
          activeFormationId={activeFormationId}
          onFormationChange={handleFormationChange}
          onSuggestFormation={handleSuggestFormation}
          isSuggesting={isSuggestingFormation}
        />

        {/* Playbook Section */}
        <PlaybookSection
          playbook={playbook}
          onCreatePlay={() => console.log('Create play')}
          onLoadPlay={playId => console.log('Load play:', playId)}
          onDuplicatePlay={playId => console.log('Duplicate play:', playId)}
          onDeletePlay={playId => console.log('Delete play:', playId)}
        />

        {/* Player Roster */}
        <div className="space-y-3 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center text-sm font-medium text-slate-300">
              <Users className="w-4 h-4 mr-2" />
              Player Roster
            </h3>
            <div className="flex items-center gap-1">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5 mr-2">
                <button
                  onClick={() => handleViewModeChange('compact')}
                  className={`p-1.5 rounded transition-colors ${
                    playerCardViewMode === 'compact'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Compact View"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleViewModeChange('comfortable')}
                  className={`p-1.5 rounded transition-colors ${
                    playerCardViewMode === 'comfortable'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Comfortable View"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleViewModeChange('spacious')}
                  className={`p-1.5 rounded transition-colors ${
                    playerCardViewMode === 'spacious'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Spacious View"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <button className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center">
                <PlusCircle className="w-3 h-3 mr-1" />
                Add
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="flex-1 p-2 bg-slate-800/50 border border-slate-600/50 rounded text-white text-xs"
              >
                <option value="all">All Positions</option>
                <option value="goalkeeper">Goalkeeper</option>
                <option value="defender">Defender</option>
                <option value="midfielder">Midfielder</option>
                <option value="forward">Forward</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="flex-1 p-2 bg-slate-800/50 border border-slate-600/50 rounded text-white text-xs"
              >
                <option value="name">Sort by Name</option>
                <option value="rating">Sort by Rating</option>
                <option value="position">Sort by Position</option>
              </select>
            </div>
          </div>

          {/* Player Lists - Grouped by Position */}
          <div className="space-y-4 flex-1 overflow-y-auto">
            {(() => {
              // Group players by position
              const playersByPosition = {
                goalkeeper: filteredPlayers.filter(p => p.roleId?.includes('goalkeeper')),
                defender: filteredPlayers.filter(
                  p => p.roleId?.includes('back') || p.roleId?.includes('defender'),
                ),
                midfielder: filteredPlayers.filter(
                  p => p.roleId?.includes('midfielder') || p.roleId?.includes('mid'),
                ),
                forward: filteredPlayers.filter(
                  p =>
                    p.roleId?.includes('forward') ||
                    p.roleId?.includes('striker') ||
                    p.roleId?.includes('winger'),
                ),
                other: filteredPlayers.filter(
                  p =>
                    !p.roleId ||
                    (!p.roleId.includes('goalkeeper') &&
                      !p.roleId.includes('back') &&
                      !p.roleId.includes('defender') &&
                      !p.roleId.includes('midfielder') &&
                      !p.roleId.includes('mid') &&
                      !p.roleId.includes('forward') &&
                      !p.roleId.includes('striker') &&
                      !p.roleId.includes('winger')),
                ),
              };

              const positionConfig = [
                {
                  key: 'goalkeeper',
                  name: 'Goalkeepers',
                  icon: Target,
                  color: 'text-yellow-400',
                  bgColor: 'bg-yellow-900/20',
                },
                {
                  key: 'defender',
                  name: 'Defenders',
                  icon: Star,
                  color: 'text-blue-400',
                  bgColor: 'bg-blue-900/20',
                },
                {
                  key: 'midfielder',
                  name: 'Midfielders',
                  icon: BarChart3,
                  color: 'text-green-400',
                  bgColor: 'bg-green-900/20',
                },
                {
                  key: 'forward',
                  name: 'Forwards',
                  icon: Zap,
                  color: 'text-red-400',
                  bgColor: 'bg-red-950',
                },
                {
                  key: 'other',
                  name: 'Others',
                  icon: Users,
                  color: 'text-slate-400',
                  bgColor: 'bg-slate-700',
                },
              ];

              return positionConfig.map(({ key, name, icon: Icon, color, bgColor }) => {
                const positionPlayers = playersByPosition[key as keyof typeof playersByPosition];
                const onFieldCount = positionPlayers.filter(p => playersOnField.has(p.id)).length;

                if (positionPlayers.length === 0) {
                  return null;
                }

                return (
                  <div key={key} className={`${bgColor} rounded-lg p-3`}>
                    <h4
                      className={`text-xs font-bold uppercase px-2 mb-3 flex items-center justify-between ${color}`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-3 h-3 mr-2" />
                        {name} ({positionPlayers.length})
                      </div>
                      <div className="text-xs font-normal">
                        {onFieldCount > 0 && (
                          <span className="text-green-400">{onFieldCount} on field</span>
                        )}
                      </div>
                    </h4>
                    <div className="space-y-2">
                      {positionPlayers.map(player => (
                        <PlayerListItem
                          key={player.id}
                          player={player}
                          isSelected={selectedPlayerId === player.id}
                          onSelect={() => handlePlayerSelect(player.id)}
                          onDoubleClick={() => {
                            // Handle player edit
                          }}
                          onDragStart={e => handlePlayerDragStart(e, player.id)}
                          onAssignTeam={team => handleAssignTeam(player.id, team)}
                          isOnField={playersOnField.has(player.id)}
                          viewMode={playerCardViewMode}
                        />
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{filteredPlayers.length} players</span>
          <div className="flex items-center space-x-3">
            <button className="hover:text-white transition-colors flex items-center">
              <BarChart3 className="w-3 h-3 mr-1" />
              Analytics
            </button>
            <button className="hover:text-white transition-colors flex items-center">
              <Settings className="w-3 h-3 mr-1" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;
