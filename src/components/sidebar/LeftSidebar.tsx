import React, { useMemo, useState } from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import {
  AddPlayerIcon,
  FormationIcon,
  GameplanIcon,
  HealthIcon,
  PencilIcon,
  ShirtIcon,
  TrashIcon,
  CaptainIcon,
  SparklesIcon,
  LoadingSpinner,
  SearchIcon,
  CopyIcon,
  UserXIcon,
  SlidersHorizontalIcon,
  ChartLineIcon,
  CrosshairIcon,
  LibraryIcon,
  UsersIcon,
} from '../ui/icons';
import {
  Button,
  SearchInput,
  PlayerCard,
  Card,
  CardHeader,
  CardBody,
  Badge,
  PositionBadge,
} from '../ui/modern';
import { cn } from '../../utils/cn';
import type {
  Player,
  Team,
  PlayCategory,
  PlaybookItem,
  PositionRole,
  PlayerAvailabilityStatus,
} from '../../types';
import { PLAY_CATEGORIES } from '../../types';
import { getAIFormationSuggestion } from '../../services/aiServiceLoader';
import { PLAYER_ROLES } from '../../constants';
import { useNavigate } from 'react-router-dom';

interface PlayerListItemProps {
  player: Player;
  isSelected: boolean;
  isCaptain: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLLIElement>) => void;
  onAssignTeam: (team: Team) => void;
}

const getHealthColor = (status: PlayerAvailabilityStatus) => {
  switch (status) {
    case 'Available':
      return 'bg-green-500';
    case 'Minor Injury':
      return 'bg-yellow-500';
    case 'Major Injury':
      return 'bg-red-500';
    case 'Suspended':
      return 'bg-gray-400';
    default:
      return 'bg-gray-500';
  }
};

const PlayerListItem: React.FC<PlayerListItemProps> = React.memo(
  ({
    player,
    isSelected,
    isCaptain,
    onSelect,
    onEdit,
    onDoubleClick,
    onDragStart,
    onAssignTeam,
  }) => {
    const handleTeamClick = (e: React.MouseEvent, team: Team) => {
      e.stopPropagation();
      onAssignTeam(team);
    };

    return (
      <li
        draggable
        onDragStart={onDragStart}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        className={`group relative flex items-center p-2 rounded-md cursor-pointer transition-all duration-200 ${isSelected ? 'bg-teal-600/30 ring-1 ring-teal-500' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        data-menu-item="true"
      >
        {isCaptain && (
          <div
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 text-yellow-400"
            title="Captain"
          >
            <CaptainIcon className="w-4 h-4" />
          </div>
        )}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 border-2 border-black/20"
          style={{ backgroundColor: player.teamColor }}
        >
          {player.jerseyNumber}
        </div>
        <div className="flex-grow">
          <div className="flex items-center">
            {player.nationality && (
              <img
                src={`https://flagcdn.com/w20/${player.nationality.toLowerCase()}.png`}
                srcSet={`https://flagcdn.com/w20/${player.nationality.toLowerCase()}.png 1x, https://flagcdn.com/w40/${player.nationality.toLowerCase()}.png 2x`}
                alt={player.nationality}
                className="w-5 h-auto mr-1.5 rounded-sm"
                title={player.nationality}
                loading="lazy"
                decoding="async"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            )}
            <p className="font-semibold text-sm text-gray-100">{player.name}</p>
            {player.individualTrainingFocus && (
              <div
                className="ml-1.5 text-teal-400"
                title={`Focus: ${player.individualTrainingFocus.attribute}`}
              >
                <CrosshairIcon className="w-3 h-3" />
              </div>
            )}
          </div>
          <div className="flex items-center mt-1">
            <HealthIcon className="w-3 h-3 text-gray-400 mr-1.5" />
            <div
              className={`w-2 h-2 rounded-full ${getHealthColor(player.availability.status)} mr-1`}
            ></div>
            <p className="text-xs text-gray-400 capitalize">{player.availability.status}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => handleTeamClick(e, 'home')}
            className={`w-5 h-5 text-xs font-bold rounded-sm flex items-center justify-center ${player.team === 'home' ? 'bg-blue-600 text-white ring-1 ring-white' : 'bg-gray-600 text-gray-300 hover:bg-blue-600'}`}
          >
            H
          </button>
          <button
            onClick={e => handleTeamClick(e, 'away')}
            className={`w-5 h-5 text-xs font-bold rounded-sm flex items-center justify-center ${player.team === 'away' ? 'bg-red-600 text-white ring-1 ring-white' : 'bg-gray-600 text-gray-300 hover:bg-red-600'}`}
          >
            A
          </button>
          <div
            onClick={onEdit}
            className="p-1 bg-gray-600/50 rounded-full hover:bg-teal-500/80 transition-all"
          >
            <PencilIcon className="w-3 h-3 text-white" />
          </div>
        </div>
      </li>
    );
  },
);

const CreatePlaybookItemForm: React.FC<{
  onSave: (name: string, category: PlayCategory) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlayCategory>('General');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), category);
    }
  };

  return (
    <div className="p-2 bg-gray-900/50 rounded-md mb-2">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="New play name..."
        className="w-full p-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md mb-2"
        autoFocus
      />
      <select
        value={category}
        onChange={e => setCategory(e.target.value as PlayCategory)}
        className="w-full p-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md"
      >
        {PLAY_CATEGORIES.map(cat => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <div className="flex justify-end mt-2 space-x-2">
        <button onClick={onCancel} className="text-xs px-2 py-1 rounded-md hover:bg-gray-600">
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="text-xs px-2 py-1 rounded-md bg-teal-600 hover:bg-teal-500 font-semibold"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export const LeftSidebar: React.FC = () => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const navigate = useNavigate();

  const { players, formations, activeFormationIds, playbook, captainIds, tacticalFamiliarity } =
    tacticsState;
  const {
    activePlaybookItemId,
    selectedPlayerId,
    isSuggestingFormation,
    activeTeamContext,
    rosterSearchQuery,
    rosterRoleFilters,
    playbookCategories,
    settings,
    activeStepIndex,
  } = uiState;

  const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
  const activeFormationId = activeFormationIds[activeTeam];
  const familiarity = tacticalFamiliarity[activeFormationId] || 0;

  const [isCreating, setIsCreating] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<'name' | 'jerseyNumber' | 'overall'>('name');

  const playersInContext = useMemo(
    () => players.filter(p => activeTeamContext === 'both' || p.team === activeTeamContext),
    [players, activeTeamContext],
  );

  const sortedPlayers = useMemo(() => {
    const filtered = playersInContext.filter(player => {
      const queryMatch = rosterSearchQuery
        ? player.name.toLowerCase().includes(rosterSearchQuery.toLowerCase())
        : true;

      const playerRoleInfo = PLAYER_ROLES.find(r => r.id === player.roleId);
      const roleMatch =
        rosterRoleFilters.length > 0
          ? playerRoleInfo && rosterRoleFilters.includes(playerRoleInfo.category)
          : true;

      return queryMatch && roleMatch;
    });

    return [...filtered].sort((a, b) => {
      const overallA =
        (Object.values(a.attributes) as number[]).reduce((s, v) => s + v, 0) /
        Object.keys(a.attributes).length;
      const overallB =
        (Object.values(b.attributes) as number[]).reduce((s, v) => s + v, 0) /
        Object.keys(b.attributes).length;
      switch (sortCriteria) {
        case 'jerseyNumber':
          return a.jerseyNumber - b.jerseyNumber;
        case 'overall':
          return overallB - overallA;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [playersInContext, rosterSearchQuery, rosterRoleFilters, sortCriteria]);

  const playersOnFieldIds = useMemo(() => {
    if (activePlaybookItemId && activeStepIndex !== null) {
      const item = playbook[activePlaybookItemId];
      const step = item?.steps[activeStepIndex];
      if (step) {
        return new Set(
          Object.keys(step.playerPositions).filter(pId => step.playerPositions[pId].x > -1),
        );
      }
    }
    const homeFormation = formations[activeFormationIds.home];
    const awayFormation = formations[activeFormationIds.away];

    const onField = new Set<string | null>();
    if (activeTeamContext === 'home' || activeTeamContext === 'both') {
      homeFormation.slots.forEach(s => onField.add(s.playerId));
    }
    if (activeTeamContext === 'away' || activeTeamContext === 'both') {
      awayFormation.slots.forEach(s => onField.add(s.playerId));
    }
    onField.delete(null);

    return onField as Set<string>;
  }, [
    formations,
    activeFormationIds,
    activeTeamContext,
    activePlaybookItemId,
    activeStepIndex,
    playbook,
  ]);

  const onFieldPlayers = useMemo(
    () => sortedPlayers.filter(p => playersOnFieldIds.has(p.id)),
    [sortedPlayers, playersOnFieldIds],
  );
  const benchedPlayers = useMemo(
    () => sortedPlayers.filter(p => !playersOnFieldIds.has(p.id)),
    [sortedPlayers, playersOnFieldIds],
  );

  const handleFormationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: 'SET_ACTIVE_FORMATION',
      payload: { formationId: e.target.value, team: activeTeam },
    });
  };

  const handleBenchAll = () => {
    if (confirm(`Are you sure you want to bench all players for the ${activeTeam} team?`)) {
      dispatch({ type: 'BENCH_ALL_PLAYERS', payload: { team: activeTeam } });
    }
  };

  const handleAddNewPlayer = () => {
    uiDispatch({ type: 'SET_EDITING_PLAYER_ID', payload: null });
    uiDispatch({ type: 'OPEN_MODAL', payload: 'editPlayer' });
  };

  const handleEditPlayer = (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation();
    uiDispatch({ type: 'SET_EDITING_PLAYER_ID', payload: playerId });
    uiDispatch({ type: 'OPEN_MODAL', payload: 'editPlayer' });
  };

  const handleDoubleClickPlayer = (playerId: string) => {
    navigate(`/player/${playerId}`);
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, playerId: string) => {
    e.dataTransfer.setData('text/plain', playerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSaveNewItem = (name: string, category: PlayCategory) => {
    dispatch({ type: 'CREATE_PLAYBOOK_ITEM', payload: { name, category } });
    setIsCreating(false);
    if (!playbookCategories[category]) {
      dispatch({ type: 'TOGGLE_PLAYBOOK_CATEGORY', payload: category });
    }
  };

  const handleLoadItem = (itemId: string) => {
    dispatch({ type: 'LOAD_PLAYBOOK_ITEM', payload: itemId });
  };

  const handleDuplicateItem = (itemId: string) => {
    dispatch({ type: 'DUPLICATE_PLAYBOOK_ITEM', payload: itemId });
  };

  const handleDeleteItem = (itemId: string) => {
    if (
      window.confirm('Are you sure you want to delete this play? This action cannot be undone.')
    ) {
      dispatch({ type: 'DELETE_PLAYBOOK_ITEM', payload: itemId });
    }
  };

  const handleSuggestFormation = async () => {
    uiDispatch({ type: 'SUGGEST_FORMATION_START' });
    try {
      const playersForSuggestion = players.filter(p => p.team === activeTeam);
      const suggestion = await getAIFormationSuggestion(
        playersForSuggestion,
        settings.aiPersonality,
      );
      uiDispatch({ type: 'SUGGEST_FORMATION_SUCCESS', payload: suggestion });
    } catch (_error) {
      console.error(_error);
      uiDispatch({ type: 'SUGGEST_FORMATION_FAILURE' });
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `AI error: ${_error instanceof Error ? _error.message : 'Unknown error'}`,
          type: 'error',
        },
      });
    }
  };

  const handleAssignTeam = (playerId: string, team: Team) => {
    dispatch({ type: 'ASSIGN_PLAYER_TEAM', payload: { playerId, team } });
  };

  const playbookByCategory = useMemo(() => {
    return Object.values(playbook).reduce(
      (acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      },
      {} as Record<PlayCategory, PlaybookItem[]>,
    );
  }, [playbook]);

  return (
    <aside className="w-80 bg-gradient-to-b from-secondary-900/80 to-secondary-950/80 backdrop-blur-xl flex flex-col shadow-strong border-r border-secondary-700/50 h-full">
      <div className="flex flex-col h-full p-4 space-y-4">
        {/* Formation Selector Card */}
        <Card variant="elevated" padding="md">
          <CardHeader padding="none">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-primary-500/20 rounded-lg">
                <FormationIcon className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Formation</h3>
                <p className="text-xs text-secondary-400">
                  {activeTeamContext === 'away'
                    ? 'Away Team'
                    : activeTeamContext === 'home'
                      ? 'Home Team'
                      : 'Both Teams'}
                </p>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <select
                id="formation-select"
                value={activeFormationId}
                onChange={handleFormationChange}
                disabled={!!activePlaybookItemId}
                className={cn(
                  'flex-1 p-2.5 bg-secondary-700/50 border border-secondary-600/50 rounded-lg',
                  'text-white text-sm font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
                  'disabled:bg-secondary-800 disabled:cursor-not-allowed disabled:opacity-50',
                  'transition-all duration-200',
                )}
              >
                {Object.keys(formations).map(name => (
                  <option key={name} value={name} className="bg-secondary-800 text-white">
                    {name}
                  </option>
                ))}
              </select>

              <Button
                onClick={handleBenchAll}
                disabled={!!activePlaybookItemId}
                variant="ghost"
                size="sm"
                className="text-error-400 hover:text-error-300 hover:bg-error-500/20"
                title={`Bench all ${activeTeam} players`}
              >
                <UsersIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Tactical Familiarity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <ChartLineIcon className="w-3 h-3 text-secondary-400" />
                  <span className="text-xs font-medium text-secondary-400">
                    Tactical Familiarity
                  </span>
                </div>
                <Badge variant="outline" size="xs">
                  {familiarity}%
                </Badge>
              </div>
              <div className="w-full bg-secondary-700/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full transition-all duration-500 shadow-glow-primary"
                  style={{ width: `${familiarity}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* AI Formation Suggestion */}
        <Button
          onClick={handleSuggestFormation}
          disabled={isSuggestingFormation || !!activePlaybookItemId}
          variant="primary"
          size="md"
          fullWidth
          isLoading={isSuggestingFormation}
          leftIcon={!isSuggestingFormation && <SparklesIcon className="w-4 h-4" />}
          className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-glow-primary"
        >
          Suggest Formation
        </Button>

        {/* Playbook Management Card */}
        <Card variant="elevated" padding="md" className="flex-shrink-0">
          <CardHeader padding="none">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-accent-500/20 rounded-lg">
                  <GameplanIcon className="w-4 h-4 text-accent-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Playbook</h3>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => uiDispatch({ type: 'OPEN_MODAL', payload: 'playbookLibrary' })}
                  variant="ghost"
                  size="xs"
                  leftIcon={<LibraryIcon className="w-3 h-3" />}
                  className="text-primary-400 hover:text-primary-300 text-xs"
                >
                  Library
                </Button>
                {!isCreating && (
                  <Button
                    onClick={() => setIsCreating(true)}
                    variant="ghost"
                    size="xs"
                    className="text-primary-400 hover:text-primary-300 text-xs"
                  >
                    + Create
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {isCreating && (
            <div className="mb-3">
              <CreatePlaybookItemForm
                onSave={handleSaveNewItem}
                onCancel={() => setIsCreating(false)}
              />
            </div>
          )}

          <div className="space-y-2">
            {(Object.keys(playbookByCategory) as PlayCategory[]).sort().map(category => (
              <div key={category}>
                <button
                  onClick={() =>
                    uiDispatch({ type: 'TOGGLE_PLAYBOOK_CATEGORY', payload: category })
                  }
                  className="w-full flex justify-between items-center text-left text-xs font-bold uppercase text-gray-400 hover:bg-gray-700/50 px-2 py-1 rounded-md"
                >
                  <span>
                    {category} ({playbookByCategory[category].length})
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${playbookCategories[category] ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </button>
                {playbookCategories[category] && (
                  <ul className="space-y-1 mt-1 pl-2 border-l-2 border-gray-700">
                    {playbookByCategory[category].map(item => (
                      <li
                        key={item.id}
                        className={`group flex items-center justify-between text-sm p-1.5 rounded-md cursor-pointer ${activePlaybookItemId === item.id ? 'bg-teal-600/30 font-semibold' : 'hover:bg-gray-700'}`}
                        onClick={() => handleLoadItem(item.id)}
                      >
                        <span className="truncate">{item.name}</span>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDuplicateItem(item.id);
                            }}
                            className="p-1 hover:text-teal-400"
                            title="Duplicate"
                          >
                            <CopyIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteItem(item.id);
                            }}
                            className="p-1 hover:text-red-500"
                            title="Delete"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Player Roster Card */}
        <Card variant="elevated" padding="md" className="flex-grow flex flex-col min-h-0">
          <CardHeader padding="none">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-success-500/20 rounded-lg">
                  <ShirtIcon className="w-4 h-4 text-success-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Squad</h3>
                  <p className="text-xs text-secondary-400">{sortedPlayers.length} players</p>
                </div>
              </div>
              <Button
                onClick={handleAddNewPlayer}
                variant="ghost"
                size="xs"
                className="text-success-400 hover:text-success-300 text-xs"
              >
                + Add Player
              </Button>
            </div>
          </CardHeader>

          {/* Search and Filters */}
          <div className="space-y-3 mb-3">
            <div className="flex items-center space-x-2">
              <SearchInput
                placeholder="Search roster..."
                value={rosterSearchQuery}
                onChange={e =>
                  uiDispatch({ type: 'SET_ROSTER_SEARCH_QUERY', payload: e.target.value })
                }
                onClear={() => uiDispatch({ type: 'SET_ROSTER_SEARCH_QUERY', payload: '' })}
                className="flex-1"
                size="sm"
              />
              <select
                value={sortCriteria}
                onChange={e => setSortCriteria(e.target.value as any)}
                className={cn(
                  'p-2 text-sm bg-secondary-700/50 border border-secondary-600/50 rounded-lg',
                  'text-white font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                  'transition-all duration-200',
                )}
              >
                <option value="name" className="bg-secondary-800">
                  Name
                </option>
                <option value="jerseyNumber" className="bg-secondary-800">
                  Number
                </option>
                <option value="overall" className="bg-secondary-800">
                  Overall
                </option>
              </select>
            </div>

            {/* Position Filters */}
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1 flex-1">
                {(['GK', 'DF', 'MF', 'FW'] as PositionRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => uiDispatch({ type: 'TOGGLE_ROSTER_ROLE_FILTER', payload: role })}
                    className={cn(
                      'px-2 py-1 text-xs font-medium rounded-md border transition-all duration-200',
                      rosterRoleFilters.includes(role)
                        ? 'bg-primary-500 border-primary-400 text-white shadow-glow-primary'
                        : 'bg-secondary-700/50 border-secondary-600/50 text-secondary-300 hover:bg-primary-500/20 hover:border-primary-500/50',
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
              {rosterRoleFilters.length > 0 && (
                <Button
                  onClick={() => uiDispatch({ type: 'CLEAR_ROSTER_FILTERS' })}
                  variant="ghost"
                  size="xs"
                  className="text-secondary-400 hover:text-white text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto space-y-3 pr-1">
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-500 px-2 mb-1">
                On Field ({onFieldPlayers.length})
              </h4>
              <ul className="space-y-1">
                {onFieldPlayers.map(player => (
                  <PlayerListItem
                    key={player.id}
                    player={player}
                    isSelected={selectedPlayerId === player.id}
                    isCaptain={captainIds.home === player.id || captainIds.away === player.id}
                    onSelect={() => dispatch({ type: 'SELECT_PLAYER', payload: player.id })}
                    onEdit={e => handleEditPlayer(e, player.id)}
                    onDoubleClick={() => handleDoubleClickPlayer(player.id)}
                    onDragStart={e => handleDragStart(e, player.id)}
                    onAssignTeam={team => handleAssignTeam(player.id, team)}
                  />
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-500 px-2 mb-1">
                Bench ({benchedPlayers.length})
              </h4>
              <ul className="space-y-1">
                {benchedPlayers.map(player => (
                  <PlayerListItem
                    key={player.id}
                    player={player}
                    isSelected={selectedPlayerId === player.id}
                    isCaptain={captainIds.home === player.id || captainIds.away === player.id}
                    onSelect={() => dispatch({ type: 'SELECT_PLAYER', payload: player.id })}
                    onEdit={e => handleEditPlayer(e, player.id)}
                    onDoubleClick={() => handleDoubleClickPlayer(player.id)}
                    onDragStart={e => handleDragStart(e, player.id)}
                    onAssignTeam={team => handleAssignTeam(player.id, team)}
                  />
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </aside>
  );
};
