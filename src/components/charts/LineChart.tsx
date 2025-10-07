import React, { useMemo } from 'react';
import { generateLineChartDescription } from '@/utils/chartAccessibility';

interface LineChartProps {
  data: { x: number; y: number }[];
  width?: number;
  height?: number;
  color?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  title?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 500,
  height = 250,
  color = '#2dd4bf',
  yAxisLabel = 'Value',
  xAxisLabel = 'Week',
  title,
}) => {
  const padding = useMemo(() => ({ top: 20, right: 20, bottom: 40, left: 40 }), []);

  const { xScale, yScale, path, points } = useMemo(() => {
    if (!data || data.length === 0) {
      return { xScale: () => 0, yScale: () => 0, path: '', points: [] };
    }

    // Filter out invalid data points and ensure valid coordinates
    const validData = data.filter(
      d => d && typeof d.x === 'number' && typeof d.y === 'number' && !isNaN(d.x) && !isNaN(d.y),
    );

    if (validData.length === 0) {
      return { xScale: () => 0, yScale: () => 0, path: '', points: [] };
    }

    const xCoordinates = validData.map(d => d.x);
    const yCoordinates = validData.map(d => d.y);
    const xMin = Math.min(...xCoordinates);
    const xMax = Math.max(...xCoordinates);
    const yMin = Math.min(...yCoordinates);
    const yMax = Math.max(...yCoordinates);

    const xScale = (x: number) =>
      padding.left + ((x - xMin) / (xMax - xMin || 1)) * (width - padding.left - padding.right);
    const yScale = (y: number) =>
      height -
      padding.bottom -
      ((y - yMin) / (yMax - yMin || 1)) * (height - padding.top - padding.bottom);

    const path = validData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.x)} ${yScale(d.y)}`)
      .join(' ');

    const points = validData.map(d => ({
      x: xScale(d.x),
      y: yScale(d.y),
      originalX: d.x,
      originalY: d.y,
    }));

    return { xScale, yScale, path, points };
  }, [data, width, height, padding]);

  const yAxisTicks = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Filter out invalid data points and ensure valid coordinates
    const validData = data.filter(
      d => d && typeof d.x === 'number' && typeof d.y === 'number' && !isNaN(d.x) && !isNaN(d.y),
    );

    if (validData.length === 0) {
      return [];
    }

    const yCoordinates = validData.map(d => d.y);
    const yMin = Math.min(...yCoordinates);
    const yMax = Math.max(...yCoordinates);
    const ticks: Array<{ value: number; y: number }> = [];
    for (let i = 0; i <= 4; i++) {
      const value = Math.round(yMin + (i / 4) * (yMax - yMin));
      ticks.push({ value, y: yScale(value) });
    }
    return ticks;
  }, [data, yScale]);

  const xAxisTicks = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Filter out invalid data points and ensure valid coordinates
    const validData = data.filter(
      d => d && typeof d.x === 'number' && typeof d.y === 'number' && !isNaN(d.x) && !isNaN(d.y),
    );

    if (validData.length === 0) {
      return [];
    }

    const xValues = validData.map(d => d.x);
    const uniqueX = [...new Set(xValues)];
    return uniqueX.map(val => ({ value: val, x: xScale(val) }));
  }, [data, xScale]);

  // Generate accessible description
  const ariaDescription = useMemo(
    () => generateLineChartDescription(data, xAxisLabel, yAxisLabel, title),
    [data, xAxisLabel, yAxisLabel, title],
  );

  if (!data || data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-sm text-gray-500 bg-gray-700/30 rounded-md"
        role="img"
        aria-label="Empty line chart"
      >
        Not enough data to display chart. Needs at least 2 weeks of history.
      </div>
    );
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title || `Line chart showing ${yAxisLabel} over ${xAxisLabel}`}
      aria-describedby="line-chart-desc"
    >
      <desc id="line-chart-desc">{ariaDescription}</desc>
      {/* Axes and Grid */}
      <g className="text-gray-500">
        {yAxisTicks.map(tick => (
          <g key={tick.value}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
            <text
              x={padding.left - 8}
              y={tick.y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
            >
              {tick.value}
            </text>
          </g>
        ))}
        {xAxisTicks.map(tick => (
          <g key={tick.value}>
            <text x={tick.x} y={height - padding.bottom + 15} textAnchor="middle" fontSize="10">
              {tick.value}
            </text>
          </g>
        ))}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize="12"
          fill="var(--text-secondary)"
          className="font-semibold"
        >
          {xAxisLabel}
        </text>
        <text
          transform={`rotate(-90)`}
          x={-(height / 2)}
          y={10}
          textAnchor="middle"
          fontSize="12"
          fill="var(--text-secondary)"
          className="font-semibold"
        >
          {yAxisLabel}
        </text>
      </g>

      {/* Line */}
      <path d={path} fill="none" stroke={color} strokeWidth="2" />

      {/* Points */}
      {points.map(p => (
        <circle key={`${p.originalX}-${p.originalY}`} cx={p.x} cy={p.y} r="3" fill={color}>
          <title>
            Week {p.originalX}: {p.originalY}
          </title>
        </circle>
      ))}
    </svg>
  );
};

export default LineChart;
