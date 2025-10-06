import React, { forwardRef, useMemo } from 'react';
import { cn } from '../../../utils/cn';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  meta?: unknown;
}

export interface PerformanceChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  type?: 'line' | 'bar' | 'area' | 'radar';
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  animated?: boolean;
  gradient?: boolean;
  interactive?: boolean;
  onDataPointClick?: (dataPoint: ChartDataPoint, index: number) => void;
  onDataPointHover?: (dataPoint: ChartDataPoint | null, index: number | null) => void;
}

export const PerformanceChart = forwardRef<HTMLDivElement, PerformanceChartProps>(
  (
    {
      className,
      data,
      type = 'line',
      height = 200,
      showGrid = true,
      showLabels = true,
      showValues = false,
      animated = true,
      gradient = true,
      interactive = true,
      onDataPointClick,
      onDataPointHover,
      ...props
    },
    ref
  ) => {
    const chartData = useMemo(() => {
      if (!data.length) {
        return { points: [], maxValue: 0, minValue: 0 };
      }

      const maxValue = Math.max(...data.map(d => d.value));
      const minValue = Math.min(...data.map(d => d.value));
      const range = maxValue - minValue || 1;

      const points = data.map((point, index) => ({
        ...point,
        x: (index / (data.length - 1)) * 100,
        y: ((maxValue - point.value) / range) * 90 + 5, // 5% padding
        normalizedValue: (point.value - minValue) / range,
      }));

      return { points, maxValue, minValue, range };
    }, [data]);

    const renderGridLines = () => {
      if (!showGrid) {
        return null;
      }

      const gridLines: JSX.Element[] = [];

      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * 90 + 5;
        gridLines.push(
          <line
            key={`h-${i}`}
            x1="5%"
            y1={`${y}%`}
            x2="95%"
            y2={`${y}%`}
            stroke="rgba(var(--secondary-600), 0.3)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        );
      }

      // Vertical grid lines
      for (let i = 0; i <= 4; i++) {
        const x = (i / 4) * 90 + 5;
        gridLines.push(
          <line
            key={`v-${i}`}
            x1={`${x}%`}
            y1="5%"
            x2={`${x}%`}
            y2="95%"
            stroke="rgba(var(--secondary-600), 0.3)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        );
      }

      return <g>{gridLines}</g>;
    };

    const renderLineChart = () => {
      const pathData = chartData.points
        .map((point, index) => {
          const command = index === 0 ? 'M' : 'L';
          return `${command} ${point.x}% ${point.y}%`;
        })
        .join(' ');

      const areaPathData = gradient
        ? `${pathData} L ${chartData.points[chartData.points.length - 1]?.x}% 95% L ${chartData.points[0]?.x}% 95% Z`
        : '';

      return (
        <g>
          {/* Area fill */}
          {gradient && (
            <>
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(var(--primary-500))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(var(--primary-500))" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                d={areaPathData}
                fill="url(#areaGradient)"
                className={animated ? 'animate-fade-in' : ''}
              />
            </>
          )}

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="rgb(var(--primary-500))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(animated && 'animate-fade-in', 'transition-all duration-300')}
            style={{
              strokeDasharray: animated ? '1000' : 'none',
              strokeDashoffset: animated ? '1000' : '0',
              animation: animated ? 'draw-line 2s ease-out forwards' : 'none',
            }}
          />

          {/* Data points */}
          {chartData.points.map((point, index) => (
            <circle
              key={index}
              cx={`${point.x}%`}
              cy={`${point.y}%`}
              r="4"
              fill="rgb(var(--primary-500))"
              stroke="rgb(var(--bg-primary))"
              strokeWidth="2"
              className={cn(
                'transition-all duration-200',
                interactive && 'cursor-pointer hover:r-6 hover:stroke-primary-400',
                animated && 'animate-scale-in'
              )}
              style={{
                animationDelay: animated ? `${index * 100}ms` : '0ms',
              }}
              onClick={() => onDataPointClick?.(point, index)}
              onMouseEnter={() => onDataPointHover?.(point, index)}
              onMouseLeave={() => onDataPointHover?.(null, null)}
            />
          ))}
        </g>
      );
    };

    const renderBarChart = () => {
      const barWidth = 80 / chartData.points.length;

      return (
        <g>
          {chartData.points.map((point, index) => {
            const x = (index / chartData.points.length) * 80 + 10;
            const barHeight = point.normalizedValue * 80;
            const y = 90 - barHeight;

            return (
              <g key={index}>
                {/* Bar */}
                <rect
                  x={`${x}%`}
                  y={`${y}%`}
                  width={`${barWidth * 0.8}%`}
                  height={`${barHeight}%`}
                  fill={point.color || 'rgb(var(--primary-500))'}
                  className={cn(
                    'transition-all duration-300',
                    interactive && 'cursor-pointer hover:opacity-80',
                    animated && 'animate-slide-up-fade-in'
                  )}
                  style={{
                    animationDelay: animated ? `${index * 100}ms` : '0ms',
                  }}
                  onClick={() => onDataPointClick?.(point, index)}
                  onMouseEnter={() => onDataPointHover?.(point, index)}
                  onMouseLeave={() => onDataPointHover?.(null, null)}
                />

                {/* Value label */}
                {showValues && (
                  <text
                    x={`${x + barWidth * 0.4}%`}
                    y={`${y - 2}%`}
                    textAnchor="middle"
                    className="text-xs fill-white"
                  >
                    {point.value}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      );
    };

    const renderRadarChart = () => {
      const centerX = 50;
      const centerY = 50;
      const radius = 35;
      const numPoints = chartData.points.length;

      const radarPoints = chartData.points.map((point, index) => {
        const angle = (index / numPoints) * 2 * Math.PI - Math.PI / 2;
        const distance = point.normalizedValue * radius;
        return {
          labelX: centerX + Math.cos(angle) * (radius + 10),
          labelY: centerY + Math.sin(angle) * (radius + 10),
          gridX: centerX + Math.cos(angle) * radius,
          gridY: centerY + Math.sin(angle) * radius,
          angle,
          ...point,
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
        };
      });

      const pathData =
        radarPoints
          .map((point, index) => {
            const command = index === 0 ? 'M' : 'L';
            return `${command} ${point.x}% ${point.y}%`;
          })
          .join(' ') + ' Z';

      return (
        <g>
          {/* Grid circles */}
          {[0.2, 0.4, 0.6, 0.8, 1].map(scale => (
            <circle
              key={scale}
              cx={`${centerX}%`}
              cy={`${centerY}%`}
              r={`${radius * scale}%`}
              fill="none"
              stroke="rgba(var(--secondary-600), 0.3)"
              strokeWidth="1"
            />
          ))}

          {/* Grid lines */}
          {radarPoints.map((point, index) => (
            <line
              key={index}
              x1={`${centerX}%`}
              y1={`${centerY}%`}
              x2={`${point.gridX}%`}
              y2={`${point.gridY}%`}
              stroke="rgba(var(--secondary-600), 0.3)"
              strokeWidth="1"
            />
          ))}

          {/* Data area */}
          <path
            d={pathData}
            fill="rgba(var(--primary-500), 0.2)"
            stroke="rgb(var(--primary-500))"
            strokeWidth="2"
            className={animated ? 'animate-fade-in-scale' : ''}
          />

          {/* Data points */}
          {radarPoints.map((point, index) => (
            <g key={index}>
              <circle
                cx={`${point.x}%`}
                cy={`${point.y}%`}
                r="3"
                fill="rgb(var(--primary-500))"
                stroke="rgb(var(--bg-primary))"
                strokeWidth="2"
                className={cn(
                  'transition-all duration-200',
                  interactive && 'cursor-pointer hover:r-5',
                  animated && 'animate-scale-in'
                )}
                style={{
                  animationDelay: animated ? `${index * 100}ms` : '0ms',
                }}
                onClick={() => onDataPointClick?.(point, index)}
                onMouseEnter={() => onDataPointHover?.(point, index)}
                onMouseLeave={() => onDataPointHover?.(null, null)}
              />

              {/* Labels */}
              {showLabels && (
                <text
                  x={`${point.labelX}%`}
                  y={`${point.labelY}%`}
                  textAnchor={point.labelX > centerX ? 'start' : 'end'}
                  dominantBaseline="middle"
                  className="text-xs fill-secondary-400"
                >
                  {point.label}
                </text>
              )}
            </g>
          ))}
        </g>
      );
    };

    const renderChart = () => {
      switch (type) {
        case 'bar':
          return renderBarChart();
        case 'radar':
          return renderRadarChart();
        case 'area':
        case 'line':
        default:
          return renderLineChart();
      }
    };

    return (
      <div ref={ref} className={cn('relative', className)} style={{ height }} {...props}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {renderGridLines()}
          {renderChart()}
        </svg>

        {/* Labels for line/bar charts */}
        {showLabels && (type === 'line' || type === 'bar') && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pt-2">
            {chartData.points.map((point, index) => (
              <div
                key={index}
                className="text-xs text-secondary-400 text-center"
                style={{ width: `${100 / chartData.points.length}%` }}
              >
                {point.label}
              </div>
            ))}
          </div>
        )}

        {/* Y-axis labels for line/bar charts */}
        {showLabels && (type === 'line' || type === 'bar') && (
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-2 pr-2">
            {[
              chartData.maxValue,
              chartData.maxValue * 0.75,
              chartData.maxValue * 0.5,
              chartData.maxValue * 0.25,
              chartData.minValue,
            ].map((value, index) => (
              <div key={index} className="text-xs text-secondary-400 text-right">
                {Math.round(value)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

PerformanceChart.displayName = 'PerformanceChart';
