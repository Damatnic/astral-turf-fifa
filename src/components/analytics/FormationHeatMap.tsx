/**
 * Formation Heat Map
 * 
 * Visual heat map showing player positioning and coverage
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ProfessionalFormation } from '../../data/professionalFormations';

interface FormationHeatMapProps {
  formation: ProfessionalFormation;
  width?: number;
  height?: number;
  showGrid?: boolean;
  opacity?: number;
}

export const FormationHeatMap: React.FC<FormationHeatMapProps> = ({
  formation,
  width = 600,
  height = 900,
  showGrid = true,
  opacity = 0.6
}) => {
  // Generate heat map data
  const heatMapData = useMemo(() => {
    const gridSize = 20; // 20x30 grid
    const gridWidth = Math.floor(width / gridSize);
    const gridHeight = Math.floor(height / gridSize);
    const grid: number[][] = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(0));

    // Calculate heat from each player position
    formation.positions.forEach((pos) => {
      const px = Math.floor((pos.x / 100) * gridWidth);
      const py = Math.floor((pos.y / 100) * gridHeight);

      // Add heat in a radius around each player
      const radius = 4; // Influence radius
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const gx = px + dx;
          const gy = py + dy;
          
          if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            const heat = Math.max(0, 1 - (distance / radius));
            grid[gy][gx] = Math.min(1, grid[gy][gx] + heat);
          }
        }
      }
    });

    return grid;
  }, [formation, width, height]);

  // Get color for heat value
  const getHeatColor = (heat: number): string => {
    if (heat === 0) return 'rgba(10, 77, 46, 0.3)'; // Field green
    
    // Gradient from blue (cold) to red (hot)
    const r = Math.floor(heat * 255);
    const g = Math.floor((1 - heat) * 100);
    const b = Math.floor((1 - heat) * 255);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const gridWidth = Math.floor(width / 20);
  const gridHeight = Math.floor(height / 20);
  const cellWidth = width / gridWidth;
  const cellHeight = height / gridHeight;

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Field Background */}
        <rect width={width} height={height} fill="#0a4d2e" />

        {/* Field Lines */}
        {showGrid && (
          <g opacity="0.2">
            <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="white" strokeWidth="2" />
            <circle cx={width/2} cy={height/2} r={width * 0.12} fill="none" stroke="white" strokeWidth="2" />
            <rect x="0" y="0" width={width} height={height * 0.15} fill="none" stroke="white" strokeWidth="2" />
            <rect x="0" y={height * 0.85} width={width} height={height * 0.15} fill="none" stroke="white" strokeWidth="2" />
          </g>
        )}

        {/* Heat Map Grid */}
        <g>
          {heatMapData.map((row, y) =>
            row.map((heat, x) => (
              <rect
                key={`${x}-${y}`}
                x={x * cellWidth}
                y={y * cellHeight}
                width={cellWidth}
                height={cellHeight}
                fill={getHeatColor(heat)}
              />
            ))
          )}
        </g>

        {/* Player Positions */}
        {formation.positions.map((pos, idx) => (
          <g key={idx}>
            <circle
              cx={(pos.x / 100) * width}
              cy={(pos.y / 100) * height}
              r="12"
              fill="white"
              stroke="#3b82f6"
              strokeWidth="3"
              opacity="0.9"
            />
            {pos.label && (
              <text
                x={(pos.x / 100) * width}
                y={(pos.y / 100) * height + 4}
                textAnchor="middle"
                fill="#000"
                fontSize="10"
                fontWeight="bold"
              >
                {pos.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
        <p className="text-xs font-bold text-white mb-2">Coverage Intensity</p>
        <div className="flex items-center space-x-2">
          <div className="flex-1 h-3 rounded" style={{
            background: 'linear-gradient(to right, rgba(0,100,255,0.6), rgba(255,0,0,0.6))'
          }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
};

export default FormationHeatMap;

