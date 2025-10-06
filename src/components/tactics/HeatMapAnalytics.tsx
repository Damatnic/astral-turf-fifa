import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Target,
  Zap,
  Shield,
  TrendingUp,
  Eye,
  Filter,
  RotateCcw,
  Play,
  Users,
  Settings,
  X,
  ChevronDown,
} from 'lucide-react';
import { type Player, type Formation } from '../../types';

interface HeatMapZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number; // 0-1
  playerActivity: {
    playerId: string;
    touches: number;
    timeSpent: number; // in seconds
    events: string[]; // goals, assists, tackles, etc.
  }[];
}

interface HeatMapAnalyticsProps {
  players: Player[];
  formation: Formation | undefined;
  isVisible: boolean;
  viewMode: 'individual' | 'team' | 'zones';
  selectedPlayerId?: string | null;
  onPlayerSelect?: (playerId: string) => void;
  className?: string;
}

type HeatMapFilter = 'all' | 'attacking' | 'defending' | 'movement' | 'possession';

const HeatMapAnalytics: React.FC<HeatMapAnalyticsProps> = ({
  players,
  formation,
  isVisible,
  viewMode: propViewMode = 'team',
  selectedPlayerId,
  onPlayerSelect,
  className,
}) => {
  const [viewMode, setViewMode] = useState<'individual' | 'team' | 'zones'>(propViewMode);
  const [heatMapFilter, setHeatMapFilter] = useState<HeatMapFilter>('all');
  const [timeRange, setTimeRange] = useState<'1st_half' | '2nd_half' | 'full_match'>('full_match');
  const [showControls, setShowControls] = useState(false);
  const [intensity, setIntensity] = useState(0.7);

  // Generate synthetic heat map data based on player positions and roles
  const heatMapZones = useMemo((): HeatMapZone[] => {
    const zones: HeatMapZone[] = [];
    const gridSize = 10; // 10x10 grid for heat map zones

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = (col / gridSize) * 100;
        const y = (row / gridSize) * 100;
        const width = 100 / gridSize;
        const height = 100 / gridSize;

        // Calculate zone intensity based on player activities
        let zoneIntensity = 0;
        const playerActivity: HeatMapZone['playerActivity'] = [];

        players.forEach(player => {
          // Check if player operates in this zone based on their position and role
          const playerX = player.position?.x || 50;
          const playerY = player.position?.y || 50;

          // Calculate distance from zone center
          const zoneCenter = { x: x + width / 2, y: y + height / 2 };
          const distance = Math.sqrt(
            Math.pow(playerX - zoneCenter.x, 2) + Math.pow(playerY - zoneCenter.y, 2)
          );

          // Players have influence based on their role and proximity
          if (distance < 25) {
            // Within 25% of field
            const influence = Math.max(0, 1 - distance / 25);
            const roleMultiplier = getRoleZoneMultiplier(player.roleId, zoneCenter);
            const playerInfluence = influence * roleMultiplier;

            if (playerInfluence > 0.1) {
              zoneIntensity += playerInfluence;

              // Generate synthetic activity data
              const touches = Math.floor(playerInfluence * 50 + Math.random() * 20);
              const timeSpent = Math.floor(playerInfluence * 300 + Math.random() * 100);
              const events = generatePlayerEvents(player.roleId, playerInfluence);

              playerActivity.push({
                playerId: player.id,
                touches,
                timeSpent,
                events,
              });
            }
          }
        });

        zones.push({
          id: `zone-${row}-${col}`,
          x,
          y,
          width,
          height,
          intensity: Math.min(1, zoneIntensity),
          playerActivity,
        });
      }
    }

    return zones;
  }, [players, heatMapFilter, timeRange]);

  // Generate player-specific heat maps
  const playerHeatMaps = useMemo(() => {
    const maps: Record<string, HeatMapZone[]> = {};

    players.forEach(player => {
      const playerZones: HeatMapZone[] = [];
      const gridSize = 12; // Finer grid for individual players

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const x = (col / gridSize) * 100;
          const y = (row / gridSize) * 100;
          const width = 100 / gridSize;
          const height = 100 / gridSize;

          const zoneCenter = { x: x + width / 2, y: y + height / 2 };
          const playerPos = player.position || { x: 50, y: 50 };

          // Calculate heat based on player's natural position and movement patterns
          const distance = Math.sqrt(
            Math.pow(playerPos.x - zoneCenter.x, 2) + Math.pow(playerPos.y - zoneCenter.y, 2)
          );

          const intensity = getPlayerZoneIntensity(player, zoneCenter, distance);

          if (intensity > 0.05) {
            playerZones.push({
              id: `player-${player.id}-zone-${row}-${col}`,
              x,
              y,
              width,
              height,
              intensity,
              playerActivity: [
                {
                  playerId: player.id,
                  touches: Math.floor(intensity * 30),
                  timeSpent: Math.floor(intensity * 200),
                  events: generatePlayerEvents(player.roleId, intensity),
                },
              ],
            });
          }
        }
      }

      maps[player.id] = playerZones;
    });

    return maps;
  }, [players, heatMapFilter, timeRange]);

  const getHeatMapColor = useCallback(
    (intensity: number) => {
      const alpha = Math.max(0.1, Math.min(0.8, intensity * intensity));

      if (heatMapFilter === 'attacking') {
        return `rgba(239, 68, 68, ${alpha})`; // Red for attacking
      } else if (heatMapFilter === 'defending') {
        return `rgba(59, 130, 246, ${alpha})`; // Blue for defending
      } else if (heatMapFilter === 'movement') {
        return `rgba(34, 197, 94, ${alpha})`; // Green for movement
      } else if (heatMapFilter === 'possession') {
        return `rgba(168, 85, 247, ${alpha})`; // Purple for possession
      }

      // Default gradient from blue to red
      const red = Math.floor(255 * intensity);
      const blue = Math.floor(255 * (1 - intensity));
      return `rgba(${red}, 50, ${blue}, ${alpha})`;
    },
    [heatMapFilter]
  );

  const getZonesToRender = useCallback(() => {
    if (viewMode === 'individual' && selectedPlayerId) {
      return playerHeatMaps[selectedPlayerId] || [];
    } else if (viewMode === 'team') {
      return heatMapZones;
    }
    return heatMapZones;
  }, [viewMode, selectedPlayerId, playerHeatMaps, heatMapZones]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Heat Map Zones */}
      <AnimatePresence>
        {getZonesToRender().map((zone, index) => (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: intensity }}
            exit={{ opacity: 0 }}
            transition={{ delay: index * 0.01, duration: 0.3 }}
            className="absolute rounded-sm transition-all duration-300"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
              backgroundColor: getHeatMapColor(zone.intensity),
              border: zone.intensity > 0.7 ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
            }}
          >
            {/* Zone Activity Indicator */}
            {zone.intensity > 0.8 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse opacity-60" />
              </div>
            )}

            {/* Detailed Zone Info on Hover */}
            {zone.intensity > 0.5 && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-auto z-10">
                <div>Activity: {Math.floor(zone.intensity * 100)}%</div>
                <div>Players: {zone.playerActivity.length}</div>
                <div>Touches: {zone.playerActivity.reduce((sum, p) => sum + p.touches, 0)}</div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Heat Map Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4 pointer-events-auto"
      >
        <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 min-w-64">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Heat Map Analytics
            </h3>
            <button
              onClick={() => setShowControls(!showControls)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Selector */}
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-2 block">View Mode</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-800/50 rounded-lg p-1">
              {[
                { id: 'team', label: 'Team', icon: Users },
                { id: 'individual', label: 'Player', icon: Target },
                { id: 'zones', label: 'Zones', icon: Eye },
              ].map(mode => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as any)}
                    className={`
                      flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all
                      ${
                        viewMode === mode.id
                          ? 'bg-blue-600/80 text-white'
                          : 'text-slate-400 hover:text-white'
                      }
                    `}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Options */}
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-2 block">Activity Filter</label>
            <select
              value={heatMapFilter}
              onChange={e => setHeatMapFilter(e.target.value as HeatMapFilter)}
              className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-xs px-3 py-2 focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">All Activities</option>
              <option value="attacking">Attacking Actions</option>
              <option value="defending">Defensive Actions</option>
              <option value="movement">Player Movement</option>
              <option value="possession">Ball Possession</option>
            </select>
          </div>

          {/* Individual Player Selector */}
          {viewMode === 'individual' && (
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-2 block">Select Player</label>
              <select
                value={selectedPlayerId || ''}
                onChange={e => onPlayerSelect?.(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-xs px-3 py-2 focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Choose a player...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.roleId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Advanced Controls */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 border-t border-slate-700/50 pt-4"
              >
                {/* Intensity Slider */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">
                    Intensity: {Math.floor(intensity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={intensity}
                    onChange={e => setIntensity(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                {/* Time Range */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Time Range</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-800/50 rounded-lg p-1">
                    {[
                      { id: '1st_half', label: '1st' },
                      { id: '2nd_half', label: '2nd' },
                      { id: 'full_match', label: 'Full' },
                    ].map(range => (
                      <button
                        key={range.id}
                        onClick={() => setTimeRange(range.id as any)}
                        className={`
                          px-2 py-1 rounded text-xs font-medium transition-all
                          ${
                            timeRange === range.id
                              ? 'bg-blue-600/80 text-white'
                              : 'text-slate-400 hover:text-white'
                          }
                        `}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/50">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {getZonesToRender().filter(z => z.intensity > 0.5).length}
              </div>
              <div className="text-xs text-slate-400">Active Zones</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {Math.floor(getZonesToRender().reduce((sum, z) => sum + z.intensity, 0) * 10)}
              </div>
              <div className="text-xs text-slate-400">Total Activity</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Helper functions
function getRoleZoneMultiplier(roleId: string, zoneCenter: { x: number; y: number }): number {
  const { x, y } = zoneCenter;

  // Handle undefined/null roleId
  if (!roleId) {
    return 1.0;
  }

  // Defensive positions have higher activity in defensive zones
  if (roleId.includes('back') || roleId === 'goalkeeper') {
    if (y > 70) {
      return 1.5;
    } // Defensive third
    if (y > 40) {
      return 1.0;
    } // Middle third
    return 0.3; // Attacking third
  }

  // Midfield positions are active across the field
  if (roleId.includes('midfielder')) {
    if (y > 30 && y < 70) {
      return 1.3;
    } // Central areas
    return 0.8;
  }

  // Attacking positions have higher activity in attacking zones
  if (roleId.includes('striker') || roleId.includes('winger')) {
    if (y < 30) {
      return 1.5;
    } // Attacking third
    if (y < 60) {
      return 1.0;
    } // Middle third
    return 0.4; // Defensive third
  }

  return 0.8;
}

function getPlayerZoneIntensity(
  player: Player,
  zoneCenter: { x: number; y: number },
  distance: number
): number {
  const baseIntensity = Math.max(0, 1 - distance / 30);
  const roleMultiplier = getRoleZoneMultiplier(player.roleId, zoneCenter);
  const staminaFactor = (player.stamina || 100) / 100;
  const formFactor = getFormMultiplier(player.form);

  return baseIntensity * roleMultiplier * staminaFactor * formFactor;
}

function getFormMultiplier(form: string): number {
  switch (form) {
    case 'Excellent':
      return 1.3;
    case 'Good':
      return 1.1;
    case 'Average':
      return 1.0;
    case 'Poor':
      return 0.8;
    case 'Very Poor':
      return 0.6;
    default:
      return 1.0;
  }
}

function generatePlayerEvents(roleId: string, intensity: number): string[] {
  const events: string[] = [];
  const eventChance = intensity * 5; // Higher intensity = more events

  if (Math.random() < eventChance * 0.3) {
    events.push('pass');
  }
  if (Math.random() < eventChance * 0.15) {
    events.push('tackle');
  }
  if (Math.random() < eventChance * 0.1) {
    events.push('shot');
  }
  if (Math.random() < eventChance * 0.05) {
    events.push('goal');
  }
  if (Math.random() < eventChance * 0.08) {
    events.push('assist');
  }

  return events;
}

export { HeatMapAnalytics };
export default HeatMapAnalytics;
