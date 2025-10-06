import React, { forwardRef, useMemo, useState } from 'react';
import { cn } from '../../../utils/cn';

export interface HeatMapDataPoint {
  x: number;
  y: number;
  value: number;
  label?: string;
  meta?: unknown;
}

export interface HeatMapProps extends React.HTMLAttributes<HTMLDivElement> {
  data: HeatMapDataPoint[];
  width?: number;
  height?: number;
  cellSize?: number;
  colorScheme?: 'thermal' | 'viridis' | 'plasma' | 'football';
  showLabels?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  animated?: boolean;
  interactive?: boolean;
  backgroundImage?: string;
  onCellClick?: (dataPoint: HeatMapDataPoint) => void;
  onCellHover?: (dataPoint: HeatMapDataPoint | null) => void;
}

const colorSchemes = {
  thermal: [
    'rgba(0, 0, 128, 0.1)', // Dark blue
    'rgba(0, 128, 255, 0.3)', // Blue
    'rgba(0, 255, 255, 0.5)', // Cyan
    'rgba(128, 255, 0, 0.7)', // Green-yellow
    'rgba(255, 255, 0, 0.8)', // Yellow
    'rgba(255, 128, 0, 0.9)', // Orange
    'rgba(255, 0, 0, 1.0)', // Red
  ],
  viridis: [
    'rgba(68, 1, 84, 0.1)',
    'rgba(59, 82, 139, 0.3)',
    'rgba(33, 145, 140, 0.5)',
    'rgba(94, 201, 98, 0.7)',
    'rgba(253, 231, 37, 0.9)',
  ],
  plasma: [
    'rgba(13, 8, 135, 0.1)',
    'rgba(84, 2, 163, 0.3)',
    'rgba(139, 10, 165, 0.5)',
    'rgba(185, 50, 137, 0.7)',
    'rgba(219, 92, 104, 0.8)',
    'rgba(244, 136, 73, 0.9)',
    'rgba(254, 188, 43, 1.0)',
  ],
  football: [
    'rgba(34, 197, 94, 0.1)', // Light green
    'rgba(34, 197, 94, 0.3)', // Green
    'rgba(251, 191, 36, 0.5)', // Yellow
    'rgba(249, 115, 22, 0.7)', // Orange
    'rgba(239, 68, 68, 0.9)', // Red
  ],
};

export const HeatMap = forwardRef<HTMLDivElement, HeatMapProps>(
  (
    {
      className,
      data,
      width = 400,
      height = 300,
      cellSize = 20,
      colorScheme = 'football',
      showLabels = false,
      showValues = false,
      showGrid = false,
      animated = true,
      interactive = true,
      backgroundImage,
      onCellClick,
      onCellHover,
      ...props
    },
    ref
  ) => {
    const [hoveredCell, setHoveredCell] = useState<HeatMapDataPoint | null>(null);

    const processedData = useMemo(() => {
      if (!data.length) {
        return { cells: [], maxValue: 0, minValue: 0 };
      }

      const maxValue = Math.max(...data.map(d => d.value));
      const minValue = Math.min(...data.map(d => d.value));
      const range = maxValue - minValue || 1;

      const cells = data.map(point => ({
        ...point,
        normalizedValue: (point.value - minValue) / range,
        color: getColorForValue((point.value - minValue) / range, colorScheme),
      }));

      return { cells, maxValue, minValue, range };
    }, [data, colorScheme]);

    function getColorForValue(normalizedValue: number, scheme: keyof typeof colorSchemes): string {
      const colors = colorSchemes[scheme];
      const index = Math.floor(normalizedValue * (colors.length - 1));
      const nextIndex = Math.min(index + 1, colors.length - 1);

      if (index === nextIndex) {
        return colors[index];
      }

      // Interpolate between colors
      const factor = normalizedValue * (colors.length - 1) - index;
      return colors[index]; // Simplified - would normally interpolate
    }

    const renderGridLines = () => {
      if (!showGrid) {
        return null;
      }

      const gridLines: JSX.Element[] = [];
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);

      // Vertical lines
      for (let i = 0; i <= cols; i++) {
        gridLines.push(
          <line
            key={`v-${i}`}
            x1={i * cellSize}
            y1={0}
            x2={i * cellSize}
            y2={height}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        );
      }

      // Horizontal lines
      for (let i = 0; i <= rows; i++) {
        gridLines.push(
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * cellSize}
            x2={width}
            y2={i * cellSize}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        );
      }

      return <g>{gridLines}</g>;
    };

    const renderCells = () => {
      return processedData.cells.map((cell, index) => {
        const cellX = (cell.x / 100) * width;
        const cellY = (cell.y / 100) * height;

        return (
          <g key={index}>
            {/* Heat cell */}
            <circle
              cx={cellX}
              cy={cellY}
              r={cellSize / 3}
              fill={cell.color}
              className={cn(
                'transition-all duration-300',
                interactive && 'cursor-pointer hover:r-8',
                animated && 'animate-scale-in'
              )}
              style={{
                animationDelay: animated ? `${index * 50}ms` : '0ms',
                filter: 'blur(8px)',
              }}
              onClick={() => onCellClick?.(cell)}
              onMouseEnter={() => {
                setHoveredCell(cell);
                onCellHover?.(cell);
              }}
              onMouseLeave={() => {
                setHoveredCell(null);
                onCellHover?.(null);
              }}
            />

            {/* Value label */}
            {showValues && (
              <text
                x={cellX}
                y={cellY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-bold fill-white pointer-events-none"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
              >
                {cell.value}
              </text>
            )}

            {/* Position label */}
            {showLabels && cell.label && (
              <text
                x={cellX}
                y={cellY + (showValues ? 12 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-white pointer-events-none"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
              >
                {cell.label}
              </text>
            )}
          </g>
        );
      });
    };

    const renderColorScale = () => {
      const scaleWidth = 200;
      const scaleHeight = 20;
      const colors = colorSchemes[colorScheme];

      return (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-white mb-2 text-center">Intensity</div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-secondary-400">{Math.round(processedData.minValue)}</span>
            <svg width={scaleWidth} height={scaleHeight}>
              <defs>
                <linearGradient id="colorScale" x1="0%" y1="0%" x2="100%" y2="0%">
                  {colors.map((color, index) => (
                    <stop
                      key={index}
                      offset={`${(index / (colors.length - 1)) * 100}%`}
                      stopColor={color.replace(/0\.\d+/, '1')}
                    />
                  ))}
                </linearGradient>
              </defs>
              <rect width={scaleWidth} height={scaleHeight} fill="url(#colorScale)" rx="4" />
            </svg>
            <span className="text-xs text-secondary-400">{Math.round(processedData.maxValue)}</span>
          </div>
        </div>
      );
    };

    const renderTooltip = () => {
      if (!hoveredCell || !interactive) {
        return null;
      }

      return (
        <div className="absolute pointer-events-none z-50 bg-black/90 backdrop-blur-sm rounded-lg p-3 text-white text-sm shadow-xl">
          <div className="font-medium">{hoveredCell.label || 'Position'}</div>
          <div className="text-secondary-300">
            Value: <span className="font-bold">{hoveredCell.value}</span>
          </div>
          <div className="text-secondary-300">
            Location: ({Math.round(hoveredCell.x)}%, {Math.round(hoveredCell.y)}%)
          </div>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={cn('relative bg-secondary-800 rounded-lg overflow-hidden', className)}
        style={{ width, height }}
        {...props}
      >
        {/* Background image */}
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="Heat map background"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Heat map overlay */}
        <div className="absolute inset-0">
          <svg width={width} height={height} className="w-full h-full">
            {renderGridLines()}
            {renderCells()}
          </svg>
        </div>

        {/* Color scale legend */}
        {renderColorScale()}

        {/* Tooltip */}
        {renderTooltip()}

        {/* Interaction overlay */}
        {interactive && hoveredCell && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: (hoveredCell.x / 100) * width - 50,
              top: (hoveredCell.y / 100) * height - 60,
            }}
          >
            {renderTooltip()}
          </div>
        )}
      </div>
    );
  }
);

HeatMap.displayName = 'HeatMap';

// Preset heat map components for football
export interface FootballHeatMapProps
  extends Omit<HeatMapProps, 'backgroundImage' | 'width' | 'height' | 'data'> {
  fieldType?: '11v11' | '7v7' | '5v5';
  playerData: Array<{
    position: { x: number; y: number };
    touches: number;
    passes: number;
    name: string;
  }>;
}

export const FootballHeatMap = forwardRef<HTMLDivElement, FootballHeatMapProps>(
  ({ fieldType = '11v11', playerData, ...props }, ref) => {
    const fieldDimensions = {
      '11v11': { width: 600, height: 400 },
      '7v7': { width: 500, height: 350 },
      '5v5': { width: 400, height: 300 },
    };

    const { width, height } = fieldDimensions[fieldType];

    const heatMapData: HeatMapDataPoint[] = playerData.map(player => ({
      x: player.position.x,
      y: player.position.y,
      value: player.touches + player.passes,
      label: player.name,
      meta: player,
    }));

    return (
      <HeatMap
        ref={ref}
        data={heatMapData}
        width={width}
        height={height}
        colorScheme="football"
        backgroundImage="/football-field.svg"
        showLabels
        {...props}
      />
    );
  }
);

FootballHeatMap.displayName = 'FootballHeatMap';
