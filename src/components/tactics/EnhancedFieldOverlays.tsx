/**
 * ENHANCED FIELD OVERLAYS
 * 
 * Professional field visualization system with:
 * - Tactical zones (defensive, midfield, attacking)
 * - Heat maps showing player coverage
 * - Passing lanes and connections
 * - Defensive line indicators
 * - Pressure zones
 * - Grid system with measurements
 * - Custom overlays
 * 
 * Based on professional tactical analysis tools.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../../types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FieldDimensions {
  width: number;
  height: number;
  gridSize: number;
}

export interface TacticalZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export interface PassingLane {
  from: { x: number; y: number };
  to: { x: number; y: number };
  strength: number; // 0-1
  type: 'short' | 'medium' | 'long';
}

export interface HeatMapPoint {
  x: number;
  y: number;
  intensity: number; // 0-1
  radius: number;
}

export interface EnhancedFieldOverlaysProps {
  players: Player[];
  dimensions: FieldDimensions;
  showGrid?: boolean;
  showZones?: boolean;
  showHeatmap?: boolean;
  showPassingLanes?: boolean;
  showDefensiveLine?: boolean;
  showMeasurements?: boolean;
  className?: string;
}

// ============================================================================
// TACTICAL ZONES
// ============================================================================

const TACTICAL_ZONES: TacticalZone[] = [
  {
    id: 'defensive-third',
    name: 'Defensive Third',
    x: 0,
    y: 0,
    width: 100,
    height: 33.33,
    color: '#10B981', // Green
    opacity: 0.1,
  },
  {
    id: 'middle-third',
    name: 'Middle Third',
    x: 0,
    y: 33.33,
    width: 100,
    height: 33.33,
    color: '#3B82F6', // Blue
    opacity: 0.1,
  },
  {
    id: 'attacking-third',
    name: 'Attacking Third',
    x: 0,
    y: 66.66,
    width: 100,
    height: 33.34,
    color: '#EF4444', // Red
    opacity: 0.1,
  },
  // Half spaces
  {
    id: 'left-half-space',
    name: 'Left Half-Space',
    x: 16.67,
    y: 0,
    width: 16.67,
    height: 100,
    color: '#8B5CF6', // Purple
    opacity: 0.05,
  },
  {
    id: 'right-half-space',
    name: 'Right Half-Space',
    x: 66.66,
    y: 0,
    width: 16.67,
    height: 100,
    color: '#8B5CF6', // Purple
    opacity: 0.05,
  },
  // Central corridor
  {
    id: 'central-corridor',
    name: 'Central Corridor',
    x: 33.33,
    y: 0,
    width: 33.34,
    height: 100,
    color: '#F59E0B', // Yellow
    opacity: 0.05,
  },
];

// ============================================================================
// GRID OVERLAY
// ============================================================================

const GridOverlay: React.FC<{
  dimensions: FieldDimensions;
  showMeasurements: boolean;
}> = ({ dimensions, showMeasurements }) => {
  const { width, height, gridSize } = dimensions;
  
  const horizontalLines = [];
  const verticalLines = [];
  
  // Create grid lines
  for (let i = 0; i <= height; i += gridSize) {
    horizontalLines.push(i);
  }
  for (let i = 0; i <= width; i += gridSize) {
    verticalLines.push(i);
  }
  
  return (
    <g className="grid-overlay" opacity="0.2">
      {/* Horizontal lines */}
      {horizontalLines.map((y, index) => (
        <g key={`h-${index}`}>
          <line
            x1="0"
            y1={y}
            x2={width}
            y2={y}
            stroke="#6B7280"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
          {showMeasurements && index % 2 === 0 && (
            <text
              x="5"
              y={y - 5}
              fill="#9CA3AF"
              fontSize="10"
              fontFamily="monospace"
            >
              {y}m
            </text>
          )}
        </g>
      ))}
      
      {/* Vertical lines */}
      {verticalLines.map((x, index) => (
        <g key={`v-${index}`}>
          <line
            x1={x}
            y1="0"
            x2={x}
            y2={height}
            stroke="#6B7280"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
          {showMeasurements && index % 2 === 0 && (
            <text
              x={x + 5}
              y="15"
              fill="#9CA3AF"
              fontSize="10"
              fontFamily="monospace"
            >
              {x}m
            </text>
          )}
        </g>
      ))}
    </g>
  );
};

// ============================================================================
// TACTICAL ZONES OVERLAY
// ============================================================================

const TacticalZonesOverlay: React.FC<{
  zones: TacticalZone[];
  dimensions: FieldDimensions;
}> = ({ zones, dimensions }) => {
  return (
    <g className="tactical-zones-overlay">
      {zones.map((zone) => (
        <g key={zone.id}>
          <rect
            x={(zone.x / 100) * dimensions.width}
            y={(zone.y / 100) * dimensions.height}
            width={(zone.width / 100) * dimensions.width}
            height={(zone.height / 100) * dimensions.height}
            fill={zone.color}
            opacity={zone.opacity}
            stroke={zone.color}
            strokeWidth="2"
            strokeDasharray="10,5"
          />
          <text
            x={(zone.x / 100) * dimensions.width + ((zone.width / 100) * dimensions.width) / 2}
            y={(zone.y / 100) * dimensions.height + 20}
            fill={zone.color}
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            opacity="0.5"
          >
            {zone.name}
          </text>
        </g>
      ))}
    </g>
  );
};

// ============================================================================
// HEAT MAP OVERLAY
// ============================================================================

const HeatMapOverlay: React.FC<{
  players: Player[];
  dimensions: FieldDimensions;
}> = ({ players, dimensions }) => {
  // Generate heat map points from player positions
  const heatPoints = useMemo<HeatMapPoint[]>(() => {
    return players
      .filter(p => p.position)
      .map(player => ({
        x: (player.position!.x / 100) * dimensions.width,
        y: (player.position!.y / 100) * dimensions.height,
        intensity: (player.overall || 70) / 100,
        radius: 80,
      }));
  }, [players, dimensions]);
  
  return (
    <g className="heat-map-overlay">
      <defs>
        {heatPoints.map((point, index) => (
          <radialGradient key={`gradient-${index}`} id={`heat-gradient-${index}`}>
            <stop offset="0%" stopColor="#EF4444" stopOpacity={point.intensity * 0.6} />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity={point.intensity * 0.3} />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      
      {heatPoints.map((point, index) => (
        <circle
          key={`heat-${index}`}
          cx={point.x}
          cy={point.y}
          r={point.radius}
          fill={`url(#heat-gradient-${index})`}
        />
      ))}
    </g>
  );
};

// ============================================================================
// PASSING LANES OVERLAY
// ============================================================================

const PassingLanesOverlay: React.FC<{
  players: Player[];
  dimensions: FieldDimensions;
}> = ({ players, dimensions }) => {
  // Generate passing lanes between nearby players
  const passingLanes = useMemo<PassingLane[]>(() => {
    const lanes: PassingLane[] = [];
    const positionedPlayers = players.filter(p => p.position);
    
    for (let i = 0; i < positionedPlayers.length; i++) {
      for (let j = i + 1; j < positionedPlayers.length; j++) {
        const p1 = positionedPlayers[i];
        const p2 = positionedPlayers[j];
        
        const distance = Math.sqrt(
          Math.pow(p2.position!.x - p1.position!.x, 2) +
          Math.pow(p2.position!.y - p1.position!.y, 2)
        );
        
        // Only show lanes for nearby players (within 30% of field)
        if (distance < 30) {
          let type: PassingLane['type'] = 'short';
          if (distance > 20) type = 'long';
          else if (distance > 10) type = 'medium';
          
          lanes.push({
            from: {
              x: (p1.position!.x / 100) * dimensions.width,
              y: (p1.position!.y / 100) * dimensions.height,
            },
            to: {
              x: (p2.position!.x / 100) * dimensions.width,
              y: (p2.position!.y / 100) * dimensions.height,
            },
            strength: 1 - (distance / 30),
            type,
          });
        }
      }
    }
    
    return lanes;
  }, [players, dimensions]);
  
  return (
    <g className="passing-lanes-overlay">
      {passingLanes.map((lane, index) => {
        const color =
          lane.type === 'short' ? '#10B981' :
          lane.type === 'medium' ? '#3B82F6' :
          '#8B5CF6';
        
        return (
          <line
            key={`lane-${index}`}
            x1={lane.from.x}
            y1={lane.from.y}
            x2={lane.to.x}
            y2={lane.to.y}
            stroke={color}
            strokeWidth={2 + lane.strength * 2}
            strokeOpacity={0.3 + lane.strength * 0.3}
            strokeDasharray={lane.type === 'long' ? '5,5' : 'none'}
          />
        );
      })}
    </g>
  );
};

// ============================================================================
// DEFENSIVE LINE OVERLAY
// ============================================================================

const DefensiveLineOverlay: React.FC<{
  players: Player[];
  dimensions: FieldDimensions;
}> = ({ players, dimensions }) => {
  // Calculate defensive line from defender positions
  const defensiveLine = useMemo(() => {
    const defenders = players.filter(
      p => p.position && p.roleId && ['CB', 'LB', 'RB', 'LWB', 'RWB'].some(role => p.roleId?.includes(role))
    );
    
    if (defenders.length === 0) return null;
    
    // Average Y position of defenders
    const avgY = defenders.reduce((sum, p) => sum + p.position!.y, 0) / defenders.length;
    
    return (avgY / 100) * dimensions.height;
  }, [players, dimensions]);
  
  if (!defensiveLine) return null;
  
  return (
    <g className="defensive-line-overlay">
      <line
        x1="0"
        y1={defensiveLine}
        x2={dimensions.width}
        y2={defensiveLine}
        stroke="#10B981"
        strokeWidth="3"
        strokeDasharray="10,5"
        opacity="0.7"
      />
      <text
        x={dimensions.width - 100}
        y={defensiveLine - 10}
        fill="#10B981"
        fontSize="14"
        fontWeight="bold"
        opacity="0.8"
      >
        Defensive Line
      </text>
    </g>
  );
};

// ============================================================================
// FIELD MARKINGS
// ============================================================================

const FieldMarkings: React.FC<{
  dimensions: FieldDimensions;
}> = ({ dimensions }) => {
  const { width, height } = dimensions;
  
  return (
    <g className="field-markings" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.3">
      {/* Outer boundary */}
      <rect x="0" y="0" width={width} height={height} />
      
      {/* Center line */}
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} />
      
      {/* Center circle */}
      <circle cx={width / 2} cy={height / 2} r="60" />
      <circle cx={width / 2} cy={height / 2} r="2" fill="#FFFFFF" />
      
      {/* Penalty areas */}
      <rect x={width * 0.3} y="0" width={width * 0.4} height={height * 0.15} />
      <rect x={width * 0.3} y={height * 0.85} width={width * 0.4} height={height * 0.15} />
      
      {/* Goal areas */}
      <rect x={width * 0.4} y="0" width={width * 0.2} height={height * 0.08} />
      <rect x={width * 0.4} y={height * 0.92} width={width * 0.2} height={height * 0.08} />
      
      {/* Penalty spots */}
      <circle cx={width / 2} cy={height * 0.1} r="2" fill="#FFFFFF" />
      <circle cx={width / 2} cy={height * 0.9} r="2" fill="#FFFFFF" />
      
      {/* Corner arcs */}
      <path d={`M 0 ${height * 0.05} Q 0 0 ${width * 0.05} 0`} />
      <path d={`M ${width - width * 0.05} 0 Q ${width} 0 ${width} ${height * 0.05}`} />
      <path d={`M 0 ${height - height * 0.05} Q 0 ${height} ${width * 0.05} ${height}`} />
      <path d={`M ${width - width * 0.05} ${height} Q ${width} ${height} ${width} ${height - height * 0.05}`} />
    </g>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EnhancedFieldOverlays: React.FC<EnhancedFieldOverlaysProps> = ({
  players,
  dimensions,
  showGrid = false,
  showZones = false,
  showHeatmap = false,
  showPassingLanes = false,
  showDefensiveLine = false,
  showMeasurements = false,
  className = '',
}) => {
  return (
    <svg
      className={`enhanced-field-overlays ${className}`}
      width={dimensions.width}
      height={dimensions.height}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {/* Field Markings (always shown) */}
      <FieldMarkings dimensions={dimensions} />
      
      {/* Grid */}
      <AnimatePresence>
        {showGrid && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GridOverlay dimensions={dimensions} showMeasurements={showMeasurements} />
          </motion.g>
        )}
      </AnimatePresence>
      
      {/* Tactical Zones */}
      <AnimatePresence>
        {showZones && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TacticalZonesOverlay zones={TACTICAL_ZONES} dimensions={dimensions} />
          </motion.g>
        )}
      </AnimatePresence>
      
      {/* Heat Map */}
      <AnimatePresence>
        {showHeatmap && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <HeatMapOverlay players={players} dimensions={dimensions} />
          </motion.g>
        )}
      </AnimatePresence>
      
      {/* Passing Lanes */}
      <AnimatePresence>
        {showPassingLanes && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PassingLanesOverlay players={players} dimensions={dimensions} />
          </motion.g>
        )}
      </AnimatePresence>
      
      {/* Defensive Line */}
      <AnimatePresence>
        {showDefensiveLine && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DefensiveLineOverlay players={players} dimensions={dimensions} />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
};

export default EnhancedFieldOverlays;

