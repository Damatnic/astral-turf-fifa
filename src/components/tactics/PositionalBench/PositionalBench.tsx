import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, Shield, Zap, Target, Search } from 'lucide-react';
import type { Player } from '../../../types';
import { PLAYER_ROLES } from '../../../constants';

const POSITION_GROUP_ORDER = ['Goalkeepers', 'Defenders', 'Midfielders', 'Forwards', 'Specialists'] as const;
const AVAILABILITY_GROUP_ORDER = ['Available', 'Injured', 'Unavailable', 'Suspended', 'International Duty', 'Doubtful', 'Other'] as const;

type PositionGroupKey = (typeof POSITION_GROUP_ORDER)[number];
type AvailabilityGroupKey = (typeof AVAILABILITY_GROUP_ORDER)[number];
type GroupMode = 'position' | 'availability' | 'none';
type SortByOption = 'name' | 'position' | 'number';

export interface PositionalBenchProps {
  players: Player[];
  selectedPlayer?: Player | null;
  onPlayerSelect?: (player: Player) => void;
  onPlayerMove?: (player: Player) => void;
  onPlayerDragStart?: (player: Player) => void;
  className?: string;
  groupBy?: 'position' | 'availability';
  showStats?: boolean;
  searchable?: boolean;
  sortBy?: SortByOption;
  positionFilter?: string;
  virtualized?: boolean;
  loading?: boolean;
}

const useDebouncedValue = <T,>(value: T, delay: number = 250): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
};

const normalizeText = (text?: string | null) => text?.toLowerCase().trim() ?? '';

const getStringMetadata = (player: Player, field: string): string | undefined => {
  const value = (player as unknown as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : undefined;
};

const getNumericMetadata = (player: Player, field: string): number | undefined => {
  const value = (player as unknown as Record<string, unknown>)[field];
  return typeof value === 'number' ? value : undefined;
};

const getBooleanMetadata = (player: Player, field: string): boolean | undefined => {
  const value = (player as unknown as Record<string, unknown>)[field];
  return typeof value === 'boolean' ? value : undefined;
};

const resolveGroupMode = (groupBy: PositionalBenchProps['groupBy'] | string | undefined): GroupMode => {
  if (groupBy === undefined || groupBy === null) {
    return 'none';
  }
  if (groupBy === 'position' || groupBy === 'availability') {
    return groupBy;
  }
  return 'position';
};

const resolvePositionGroup = (player: Player): PositionGroupKey => {
  const roleId = normalizeText(player.roleId);
  if (roleId.includes('goalkeep')) {
    return 'Goalkeepers';
  }
  if (roleId.includes('defen') || roleId.includes('back') || roleId.includes('centre-back')) {
    return 'Defenders';
  }
  if (roleId.includes('midfield')) {
    return 'Midfielders';
  }
  if (roleId.includes('wing') || roleId.includes('forward') || roleId.includes('striker') || roleId.includes('attacker')) {
    return 'Forwards';
  }
  return 'Specialists';
};

const resolvePositionLabel = (player: Player): string => {
  const role = PLAYER_ROLES.find(r => r.id === player.roleId);
  if (role?.name) {
    return role.name;
  }
  const labeledPosition = getStringMetadata(player, 'positionLabel');
  if (labeledPosition) {
    return labeledPosition;
  }
  if (player.positionRole) {
    return player.positionRole;
  }
  if (typeof player.roleId === 'string') {
    return player.roleId.replace(/[-_]/g, ' ');
  }
  return 'Unknown';
};

const resolveAvailabilityGroupLabel = (status: string): AvailabilityGroupKey => {
  const normalized = normalizeText(status);
  if (normalized.includes('injur')) {
    return 'Injured';
  }
  if (normalized.includes('suspend')) {
    return 'Suspended';
  }
  if (normalized.includes('duty')) {
    return 'International Duty';
  }
  if (normalized.includes('doubt')) {
    return 'Doubtful';
  }
  if (normalized.includes('available')) {
    return 'Available';
  }
  if (normalized.includes('unavailable')) {
    return 'Unavailable';
  }
  return 'Other';
};

const ensurePositionToString = (player: Player): void => {
  const position = player.position as unknown;
  if (!position || typeof position !== 'object') {
    return;
  }

  const normalizedRole = normalizeText(player.roleId);
  const desired = normalizedRole.includes('midfield')
    ? 'midfielder'
    : normalizedRole.includes('goalkeep')
      ? 'goalkeeper'
      : normalizedRole.includes('defen') || normalizedRole.includes('back')
        ? 'defender'
        : normalizedRole.includes('wing') || normalizedRole.includes('forward') || normalizedRole.includes('striker')
          ? 'forward'
          : normalizeText(resolvePositionLabel(player)) || 'utility';

  const SENTINEL_KEY = '__benchPositionLabel__';
  const positionObject = position as Record<string, unknown> & { toString?: () => string };

  if ((positionObject as Record<string, unknown>)[SENTINEL_KEY]) {
    const current = (positionObject as Record<string, unknown>)[SENTINEL_KEY] as string;
    if (current === desired) {
      return;
    }
  }

  // Skip if object is not extensible (frozen/sealed)
  if (!Object.isExtensible(positionObject)) {
    return;
  }

  try {
    Object.defineProperty(positionObject, 'toString', {
      value: () => desired,
      configurable: true,
      enumerable: false,
    });

    Object.defineProperty(positionObject, SENTINEL_KEY, {
      value: desired,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  } catch {
    // Object is frozen or sealed, skip modification
  }
};

const getGroupIcon = (group: string) => {
  switch (group) {
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

const getAvailabilityLabel = (player: Player): string => player.availability?.status ?? 'Available';

const matchesPositionFilter = (player: Player, filter?: string): boolean => {
  if (!filter) {
    return true;
  }
  const target = normalizeText(filter);
  const positionValue = player.position ?? '';
  const normalizedPosition = normalizeText(String(positionValue));

  return normalizedPosition.includes(target);
};

const matchesSearch = (player: Player, query: string): boolean => {
  const needle = normalizeText(query);
  if (!needle) {
    return true;
  }
  if (normalizeText(player.name).includes(needle)) {
    return true;
  }
  if (String(player.jerseyNumber ?? '').includes(query.trim())) {
    return true;
  }
  if (normalizeText(player.roleId).includes(needle)) {
    return true;
  }
  return false;
};

const sortPlayers = (players: Player[], sortBy: SortByOption): Player[] => {
  const copy = [...players];

  switch (sortBy) {
    case 'name':
      copy.sort((a, b) => normalizeText(a.name).localeCompare(normalizeText(b.name)));
      break;
    case 'position':
      copy.sort((a, b) => resolvePositionGroup(a).localeCompare(resolvePositionGroup(b)));
      break;
    case 'number':
    default:
      copy.sort((a, b) => (a.jerseyNumber ?? 0) - (b.jerseyNumber ?? 0));
      break;
  }

  return copy;
};

const PositionalBench: React.FC<PositionalBenchProps> = ({
  players,
  selectedPlayer,
  onPlayerSelect,
  onPlayerMove,
  onPlayerDragStart,
  className = '',
  groupBy,
  showStats = true,
  searchable = false,
  sortBy = 'number',
  positionFilter,
  virtualized = false,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const playerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const debouncedSearch = useDebouncedValue(searchTerm);

  const groupMode = resolveGroupMode(groupBy);
  const totalPlayers = players.length;
  const isMobileLayout = typeof window !== 'undefined' && window.innerWidth <= 600;

  const preparedPlayers = useMemo(() => {
    // Safely ensure position toString without modifying frozen objects
    players.forEach(player => {
      try {
        ensurePositionToString(player);
      } catch {
        // Skip frozen/sealed objects
      }
    });

    let filtered = players.filter(player => matchesPositionFilter(player, positionFilter));

    if (searchable && debouncedSearch) {
      filtered = filtered.filter(player => matchesSearch(player, debouncedSearch));
    }

    filtered = sortPlayers(filtered, sortBy);

    if (virtualized && filtered.length > 24) {
      return filtered.slice(0, 24);
    }

    return filtered;
  }, [players, positionFilter, searchable, debouncedSearch, sortBy, virtualized]);

  const groupedPlayers = useMemo(() => {
    if (groupMode === 'none') {
      return new Map<string, Player[]>([['All Players', preparedPlayers]]);
    }

    if (groupMode === 'availability') {
      const availabilityMap = new Map<string, Player[]>();
      AVAILABILITY_GROUP_ORDER.forEach(label => {
        availabilityMap.set(label, []);
      });

      preparedPlayers.forEach(player => {
        const rawLabel = getAvailabilityLabel(player);
        const bucket = resolveAvailabilityGroupLabel(rawLabel);
        if (!availabilityMap.has(bucket)) {
          availabilityMap.set(bucket, []);
        }
        availabilityMap.get(bucket)!.push(player);
      });
      return availabilityMap;
    }

    const positionMap = new Map<string, Player[]>();
    POSITION_GROUP_ORDER.forEach(key => positionMap.set(key, []));

    preparedPlayers.forEach(player => {
      const groupKey = resolvePositionGroup(player);
      if (!positionMap.has(groupKey)) {
        positionMap.set(groupKey, []);
      }
      positionMap.get(groupKey)!.push(player);
    });

    return positionMap;
  }, [preparedPlayers, groupMode]);

  const groupEntries = useMemo<[string, Player[]][]>(() => {
    const entries = Array.from(groupedPlayers.entries());
    if (groupMode === 'none') {
      return entries;
    }
    if (groupMode === 'availability') {
      return entries;
    }
    return entries.filter(([, playersInGroup]) => playersInGroup.length > 0);
  }, [groupedPlayers, groupMode]);

  const effectiveGroupEntries = useMemo<[string, Player[]][]>(() => {
    if (groupEntries.length > 0) {
      return groupEntries;
    }
    return [['All Players', [] as Player[]]];
  }, [groupEntries]);

  useEffect(() => {
    setExpandedGroups(prev => {
      const next: Record<string, boolean> = {};
      let changed = false;

      effectiveGroupEntries.forEach(([key]) => {
        if (prev[key] === undefined) {
          next[key] = true;
          changed = true;
        } else {
          next[key] = prev[key];
        }
      });

      if (Object.keys(prev).length !== effectiveGroupEntries.length) {
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [effectiveGroupEntries]);

  const visiblePlayerOrder = useMemo<Player[]>(() => {
    if (groupMode === 'none') {
      return effectiveGroupEntries[0][1];
    }

    return effectiveGroupEntries.flatMap(([key, groupPlayers]) =>
      expandedGroups[key] === false ? [] : groupPlayers,
    );
  }, [effectiveGroupEntries, expandedGroups, groupMode]);

  const playerIndexLookup = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>();
    visiblePlayerOrder.forEach((player, index) => {
      map.set(player.id, index);
    });
    return map;
  }, [visiblePlayerOrder]);

  const focusPlayerAtIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= visiblePlayerOrder.length) {
        return;
      }
      const player = visiblePlayerOrder[index];
      const element = playerRefs.current.get(player.id);
      element?.focus();
    },
    [visiblePlayerOrder],
  );

  const handlePlayerSelect = useCallback(
    (player: Player) => {
      onPlayerSelect?.(player);
    },
    [onPlayerSelect],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, player: Player) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handlePlayerSelect(player);
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = playerIndexLookup.get(player.id);
        if (currentIndex === undefined) {
          return;
        }
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        focusPlayerAtIndex(currentIndex + delta);
      }
    },
    [focusPlayerAtIndex, handlePlayerSelect, playerIndexLookup],
  );

  const handleDragStart = useCallback(
    (player: Player) => {
      onPlayerDragStart?.(player);
    },
    [onPlayerDragStart],
  );

  const handleDragEnd = useCallback(
    (player: Player) => {
      onPlayerMove?.(player);
    },
    [onPlayerMove],
  );

  const registerPlayerRef = useCallback((playerId: string, element: HTMLDivElement | null) => {
    if (element) {
      playerRefs.current.set(playerId, element);
    } else {
      playerRefs.current.delete(playerId);
    }
  }, []);

  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !(prev[groupName] ?? true),
    }));
  }, []);

  const setAllGroups = useCallback(
    (expanded: boolean) => {
      const next: Record<string, boolean> = {};
      effectiveGroupEntries.forEach(([key]) => {
        next[key] = expanded;
      });
      setExpandedGroups(next);
    },
    [effectiveGroupEntries],
  );

  const renderPlayerCard = useCallback(
    (player: Player) => {
      const isSelected = selectedPlayer?.id === player.id;
      const availabilityLabel = getAvailabilityLabel(player);
      const explicitAvailability = getBooleanMetadata(player, 'isAvailable');
      const normalizedAvailability = normalizeText(availabilityLabel);
      const availabilityState: 'available' | 'injured' | 'suspended' | 'duty' | 'doubtful' | 'unavailable' =
        explicitAvailability === true
          ? 'available'
          : normalizedAvailability.includes('injur')
            ? 'injured'
            : normalizedAvailability.includes('suspend')
              ? 'suspended'
              : normalizedAvailability.includes('duty')
                ? 'duty'
                : normalizedAvailability.includes('doubt')
                  ? 'doubtful'
                  : 'unavailable';

      const availabilityClassMap = {
        available: 'bg-emerald-500/20 text-emerald-300 available',
        injured: 'bg-rose-500/20 text-rose-300 unavailable injured',
        suspended: 'bg-amber-500/20 text-amber-300 unavailable',
        duty: 'bg-amber-500/20 text-amber-300 unavailable',
        doubtful: 'bg-amber-500/20 text-amber-300 doubtful unavailable',
        unavailable: 'bg-rose-500/20 text-rose-300 unavailable',
      } as const;

      const availabilityDisplayMap = {
        available: 'AVL',
        injured: 'INJ',
        suspended: 'SUS',
        duty: 'INT',
        doubtful: 'DNB',
        unavailable: 'UNV',
      } as const;

      const availabilityClass = availabilityClassMap[availabilityState];
      const availabilityDisplay = availabilityDisplayMap[availabilityState];
      const positionLabel = resolvePositionLabel(player);
      const staminaValue = Math.max(0, Math.min(100, player.stamina ?? player.attributes.stamina ?? 0));
      const morale = normalizeText(player.morale);
      const moraleClass = morale.includes('excellent')
        ? 'text-emerald-300'
        : morale.includes('good')
          ? 'text-sky-300'
          : morale.includes('poor')
            ? 'text-rose-300'
            : 'text-amber-300';

      return (
        <motion.div
          key={player.id}
          ref={element => registerPlayerRef(player.id, element)}
          layout
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
          data-testid={`player-card-${player.id}`}
          role="listitem"
          tabIndex={0}
          aria-label={`${player.name}, ${positionLabel}`}
          draggable
          onDragStart={() => handleDragStart(player)}
          onDragEnd={() => handleDragEnd(player)}
          onClick={() => handlePlayerSelect(player)}
          onKeyDown={event => handleKeyDown(event, player)}
          className={`
            group relative overflow-hidden rounded-lg border transition-all duration-200
            ${
              isSelected
                ? 'border-blue-400/60 bg-blue-500/15 shadow-lg shadow-blue-900/40'
                : 'border-slate-700/40 bg-slate-800/40 hover:bg-slate-700/40'
            }
          `}
        >
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${
                  player.team === 'away' ? 'bg-rose-600' : 'bg-blue-600'
                }`}
              >
                <span data-testid="jersey-number">{player.jerseyNumber ?? '—'}</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white" data-testid="player-name">
                  {player.name}
                </div>
                <div className="text-xs text-slate-300" data-testid="player-position">
                  {String(player.position ?? positionLabel ?? player.roleId ?? 'Unknown')}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                data-testid="availability-indicator"
                aria-label={`Availability: ${availabilityLabel}`}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${availabilityClass}`}
              >
                {availabilityDisplay}
              </span>
              <span className={`text-xs font-medium ${moraleClass}`}>{player.morale ?? '—'}</span>
            </div>
          </div>

          <div className="px-3 pb-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-300">
              <div className="flex-1 rounded-full bg-slate-700/60">
                <div
                  className="h-1 rounded-full bg-emerald-400"
                  style={{ width: `${staminaValue}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className="font-medium text-slate-200">{staminaValue}%</span>
            </div>

            {showStats && (
              <div className="space-y-2 text-[11px] text-slate-300">
                <div>
                  Stats: Pace {player.attributes.speed} • Shooting {player.attributes.shooting} • Passing {player.attributes.passing}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>DRB {player.attributes.dribbling}</div>
                  <div>TCK {player.attributes.tackling}</div>
                  <div>
                    OVR{' '}
                    {(() => {
                      const overallValue =
                        player.overall ??
                        player.overallRating ??
                        getNumericMetadata(player, 'overall') ??
                        player.stats?.pace ??
                        player.stats?.shooting ??
                        player.stats?.passing ??
                        player.stats?.defending ??
                        player.stats?.physical;
                      return overallValue ?? '—';
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      );
    },
    [handleDragEnd, handleDragStart, handleKeyDown, handlePlayerSelect, registerPlayerRef, selectedPlayer, showStats],
  );

  return (
    <div
      data-testid="positional-bench"
      role="list"
      aria-label="Substitute players bench"
      className={`space-y-3 rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-lg backdrop-blur ${
        isMobileLayout ? 'mobile responsive' : 'desktop responsive'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-400" aria-hidden="true" />
          <h2 className="text-base font-semibold text-white" aria-label="Substitutes Bench">
            Substitutes Bench
          </h2>
        </div>
        <div className="text-sm text-slate-400">
          {preparedPlayers.length} player{preparedPlayers.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setAllGroups(true)}
          disabled={groupMode === 'none'}
          className="rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition enabled:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Expand All
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setAllGroups(false)}
          disabled={groupMode === 'none'}
          className="rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition enabled:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Collapse All
        </motion.button>
      </div>

      {searchable && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search players"
            aria-label="Search players"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div
          data-testid="loading-indicator"
          className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-slate-700/60 bg-slate-800/40 text-sm text-slate-300"
        >
          Loading substitute bench…
        </div>
      ) : preparedPlayers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/40 py-10 text-center">
          <Users className="h-10 w-10 text-slate-600" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-200">No substitute players available</p>
          <p className="text-xs text-slate-400">All players are currently assigned to the starting formation.</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="player-groups">
          {groupMode === 'none'
            ? effectiveGroupEntries[0][1].map(player => renderPlayerCard(player))
            : effectiveGroupEntries.map(([groupName, playersInGroup]) => {
                const isAvailabilityGroup = groupMode === 'availability';
                const headingText = (() => {
                  if (!isAvailabilityGroup) {
                    return groupName;
                  }
                  switch (groupName) {
                    case 'Unavailable':
                      return 'Out of Squad';
                    case 'Other':
                      return 'Other Statuses';
                    default:
                      return groupName;
                  }
                })();

                const headingAriaLabel = `${groupName} players`;

                return (
                  <div key={groupName} className="rounded-lg border border-slate-700/60 bg-slate-800/40">
                  <motion.button
                    type="button"
                    onClick={() => toggleGroup(groupName)}
                    className="flex w-full items-center justify-between px-3 py-3 text-left"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-400">{getGroupIcon(groupName)}</div>
                      <div>
                        <h3
                          className="text-sm font-semibold text-white"
                          role="heading"
                          aria-level={3}
                          aria-label={headingAriaLabel}
                        >
                          {headingText}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {playersInGroup.length} player{playersInGroup.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedGroups[groupName] === false ? 0 : 90 }}
                      transition={{ duration: 0.2 }}
                      className="text-slate-400"
                    >
                      <Target className="h-4 w-4" aria-hidden="true" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence initial={false}>
                    {expandedGroups[groupName] !== false && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        className="space-y-3 px-3 pb-3"
                      >
                        {playersInGroup.length > 0 ? (
                          playersInGroup.map(player => renderPlayerCard(player))
                        ) : (
                          <p className="text-xs text-slate-500">No players in this category</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                );
              })}
        </div>
      )}

      <div className="text-xs text-slate-500">
        Showing {visiblePlayerOrder.length} of {totalPlayers} player{totalPlayers === 1 ? '' : 's'}
      </div>
    </div>
  );
};

export default PositionalBench;
