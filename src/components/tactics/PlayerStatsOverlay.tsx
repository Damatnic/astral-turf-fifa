import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Activity,
  Zap,
  Shield,
  Target,
  Eye,
  BarChart3,
  MapPin,
} from 'lucide-react';
import { type Player, type Formation } from '../../types';

interface PlayerStatsOverlayProps {
  formation?: Formation;
  players?: Player[];
  selectedPlayer?: Player | null;
  showHeatMap?: boolean;
  showPlayerStats?: boolean;
  fieldDimensions: { width: number; height: number };
}

interface PlayerStats {
  id: string;
  name: string;
  position: { x: number; y: number };
  metrics: {
    performance: number;
    positioning: number;
    influence: number;
    workrate: number;
    chemistry: number;
  };
  heatIntensity: number;
}

interface HeatZone {
  x: number;
  y: number;
  intensity: number;
  type: 'attack' | 'defense' | 'midfield';
  radius: number;
}

const PlayerStatsOverlay: React.FC<PlayerStatsOverlayProps> = ({
  formation,
  players = [],
  selectedPlayer,
  showHeatMap = false,
  showPlayerStats = false,
  fieldDimensions,
}) => {
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);

  // Calculate player statistics
  const playerStats = useMemo((): PlayerStats[] => {
    try {
      if (!formation || !formation.positions || players.length === 0) {return [];}

      return players.map(player => {
        if (!player || !player.id) return null;
        
        const position = formation.positions[player.id];
        if (!position || typeof position !== 'object') {return null;}
        
        // Ensure position has required properties
        const safePosition = {
          x: typeof position.x === 'number' ? position.x : 50,
          y: typeof position.y === 'number' ? position.y : 50,
          ...position
        };

        // Calculate various player metrics with null checks
        const currentPotential = player.currentPotential || 70;
        const performance = Math.min(100, currentPotential + Math.random() * 10);
        const positioning = Math.max(0, 100 - Math.abs(safePosition.x - 50) - Math.abs(safePosition.y - 50));
        const influence = performance * (player.position?.includes('M') ? 1.2 : 1.0);
        const workrate = 60 + Math.random() * 40;
        const chemistry = 70 + Math.random() * 30;

        return {
          id: player.id,
          name: player.name || 'Unknown Player',
          position: safePosition,
          metrics: {
            performance,
            positioning,
            influence,
            workrate,
            chemistry,
          },
          heatIntensity: (performance + influence) / 200,
        };
      }).filter(Boolean) as PlayerStats[];
    } catch (error) {
      console.error('Error calculating player stats:', error);
      return [];
    }
  }, [formation, players]);

  // Generate heat map zones
  const heatZones = useMemo((): HeatZone[] => {
    if (!formation || !showHeatMap) {return [];}


    return heatMapData.zones.map(zone => ({
      x: (zone.x / 100) * fieldDimensions.width,
      y: (zone.y / 100) * fieldDimensions.height,
      intensity: zone.intensity,
      type: zone.type,
      radius: 40 + (zone.intensity * 30),
    }));
  }, [formation, players, showHeatMap, fieldDimensions]);

  // Get heat map color based on zone type and intensity
  const getHeatColor = (zone: HeatZone): string => {
    const alpha = Math.max(0.1, zone.intensity * 0.6);

    switch (zone.type) {
      case 'attack':
        return `rgba(239, 68, 68, ${alpha})`; // Red
      case 'defense':
        return `rgba(59, 130, 246, ${alpha})`; // Blue
      case 'midfield':
        return `rgba(34, 197, 94, ${alpha})`; // Green
      default:
        return `rgba(156, 163, 175, ${alpha})`; // Gray
    }
  };

  // Player performance indicator component
  const PlayerIndicator: React.FC<{ stats: PlayerStats; isSelected: boolean; isHovered: boolean }> = ({
    stats,
    isSelected,
    isHovered,
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{
        left: ((stats.position?.x ?? 0) / 100) * fieldDimensions.width,
        top: ((stats.position?.y ?? 0) / 100) * fieldDimensions.height,
      }}
    >
      {/* Performance Ring */}
      <motion.div
        animate={{
          scale: isSelected || isHovered ? 1.3 : 1,
          opacity: isSelected || isHovered ? 1 : 0.7,
        }}
        className="relative"
      >
        <svg width="32" height="32" className="absolute -top-4 -left-4">
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="2"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke={`hsl(${stats.metrics.performance * 1.2}, 70%, 50%)`}
            strokeWidth="2"
            strokeDasharray={`${(stats.metrics.performance / 100) * 88} 88`}
            transform="rotate(-90 16 16)"
            className="transition-all duration-500"
          />
        </svg>

        {/* Performance Score */}
        <div className="absolute -top-1 -left-1 w-8 h-8 bg-slate-900/80 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {Math.round(stats.metrics.performance)}
          </span>
        </div>
      </motion.div>

      {/* Player Info Panel */}
      <AnimatePresence>
        {(isSelected || isHovered) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-lg p-3 min-w-[200px] z-10"
          >
            <div className="text-white font-semibold text-sm mb-2">{stats.name}</div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Performance
                </span>
                <span className="text-white font-medium">{Math.round(stats.metrics.performance)}%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Positioning
                </span>
                <span className="text-white font-medium">{Math.round(stats.metrics.positioning)}%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Influence
                </span>
                <span className="text-white font-medium">{Math.round(stats.metrics.influence)}%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Work Rate
                </span>
                <span className="text-white font-medium">{Math.round(stats.metrics.workrate)}%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Chemistry
                </span>
                <span className="text-white font-medium">{Math.round(stats.metrics.chemistry)}%</span>
              </div>
            </div>

            {/* Tip Arrow */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-slate-900/95" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (!formation || players.length === 0) {return null;}

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Heat Map */}
      <AnimatePresence>
        {showHeatMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <svg
              width={fieldDimensions.width}
              height={fieldDimensions.height}
              className="absolute inset-0"
            >
              <defs>
                {heatZones.map((zone, index) => (
                  <radialGradient key={index} id={`heat-${index}`}>
                    <stop offset="0%" stopColor={getHeatColor(zone)} />
                    <stop offset="70%" stopColor={getHeatColor({ ...zone, intensity: zone.intensity * 0.3 })} />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                ))}
              </defs>

              {heatZones.map((zone, index) => (
                <motion.circle
                  key={index}
                  initial={{ r: 0, opacity: 0 }}
                  animate={{ r: zone.radius, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  cx={zone.x}
                  cy={zone.y}
                  fill={`url(#heat-${index})`}
                />
              ))}
            </svg>

            {/* Heat Map Legend */}
            <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-lg p-3">
              <h4 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Heat Map
              </h4>

              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <span className="text-slate-300">Attack</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="text-slate-300">Midfield</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500/60" />
                  <span className="text-slate-300">Defense</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Statistics Overlay */}
      <AnimatePresence>
        {showPlayerStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {playerStats.map(stats => (
              <PlayerIndicator
                key={stats.id}
                stats={stats}
                isSelected={selectedPlayer?.id === stats.id}
                isHovered={hoveredPlayer === stats.id}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary Panel */}
      <AnimatePresence>
        {showPlayerStats && selectedPlayer && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-lg p-4 min-w-[250px]"
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              Player Analysis
            </h3>

            {(() => {
              const stats = playerStats.find(s => s.id === selectedPlayer.id);
              if (!stats) {return null;}

              return (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{stats.name}</div>
                    <div className="text-sm text-slate-400">{selectedPlayer.position || 'No Position'}</div>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(stats.metrics).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 capitalize">{key}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className={`h-full ${
                                value >= 80 ? 'bg-green-500' :
                                value >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                            />
                          </div>
                          <span className="text-xs text-white font-medium min-w-[24px]">
                            {Math.round(value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Overall Rating</span>
                      <span className="text-white font-bold">
                        {Math.round(Object.values(stats.metrics).reduce((a, b) => a + b, 0) / 5)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { PlayerStatsOverlay };
export default PlayerStatsOverlay;