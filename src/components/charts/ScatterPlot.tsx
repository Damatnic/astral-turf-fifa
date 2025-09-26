import React, { useMemo, useState } from 'react';

export interface ScatterPoint {
  x: number;
  y: number;
  label: string;
  color: string;
}

interface ScatterPlotProps {
  data: ScatterPoint[];
  width?: number;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  width = 500,
  height = 500,
  xAxisLabel = 'X-Axis',
  yAxisLabel = 'Y-Axis',
}) => {
  const padding = useMemo(() => ({ top: 20, right: 20, bottom: 50, left: 50 }), []);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: ScatterPoint } | null>(
    null,
  );

  const { xScale, yScale, points } = useMemo(() => {
    if (!data || data.length === 0) {
      return { xScale: () => 0, yScale: () => 0, points: [] };
    }

    const xMin = Math.min(...data.map(d => d.x), 0);
    const xMax = Math.max(...data.map(d => d.x));
    const yMin = Math.min(...data.map(d => d.y), 0);
    const yMax = Math.max(...data.map(d => d.y));

    const xScale = (x: number) =>
      padding.left + ((x - xMin) / (xMax - xMin || 1)) * (width - padding.left - padding.right);
    const yScale = (y: number) =>
      height -
      padding.bottom -
      ((y - yMin) / (yMax - yMin || 1)) * (height - padding.top - padding.bottom);

    const points = data.map(d => ({ ...d, cx: xScale(d.x), cy: yScale(d.y) }));

    return { xScale, yScale, points };
  }, [data, width, height, padding]);

  const axisTicks = useMemo(() => {
    const xMin = Math.min(...data.map(d => d.x), 0);
    const xMax = Math.max(...data.map(d => d.x));
    const yMin = Math.min(...data.map(d => d.y), 0);
    const yMax = Math.max(...data.map(d => d.y));

    const xTicks = [];
    for (let i = 0; i <= 5; i++) {
      const value = Math.round(xMin + (i / 5) * (xMax - xMin));
      xTicks.push({ value, x: xScale(value) });
    }

    const yTicks = [];
    for (let i = 0; i <= 5; i++) {
      const value = Math.round(yMin + (i / 5) * (yMax - yMin));
      yTicks.push({ value, y: yScale(value) });
    }
    return { xTicks, yTicks };
  }, [data, xScale, yScale]);

  return (
    <div className="relative w-full h-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* Axes and Grid */}
        <g className="text-gray-600">
          {axisTicks.yTicks.map(tick => (
            <g key={`y-tick-${tick.value}`}>
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
          {axisTicks.xTicks.map(tick => (
            <g key={`x-tick-${tick.value}`}>
              <line
                x1={tick.x}
                y1={padding.top}
                x2={tick.x}
                y2={height - padding.bottom}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
              <text x={tick.x} y={height - padding.bottom + 15} textAnchor="middle" fontSize="10">
                {tick.value}
              </text>
            </g>
          ))}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="12"
            fill="var(--text-secondary)"
            className="font-semibold capitalize"
          >
            {xAxisLabel.replace(/([A-Z])/g, ' $1')}
          </text>
          <text
            transform={`rotate(-90)`}
            x={-(height / 2)}
            y={15}
            textAnchor="middle"
            fontSize="12"
            fill="var(--text-secondary)"
            className="font-semibold capitalize"
          >
            {yAxisLabel.replace(/([A-Z])/g, ' $1')}
          </text>
        </g>

        {/* Points */}
        <g>
          {points.map(p => (
            <circle
              key={`${p.cx}-${p.cy}-${p.label || 'point'}`}
              cx={p.cx}
              cy={p.cy}
              r="5"
              fill={p.color}
              stroke="white"
              strokeWidth="1"
              onMouseEnter={() => setTooltip({ x: p.cx, y: p.cy, point: p })}
              onMouseLeave={() => setTooltip(null)}
              className="transition-transform duration-200 hover:scale-150"
            />
          ))}
        </g>
      </svg>
      {tooltip && (
        <div
          className="absolute p-2 text-xs text-white bg-gray-900/80 rounded-md shadow-lg pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
        >
          <p className="font-bold">{tooltip.point.label}</p>
          <p>
            {xAxisLabel}: {tooltip.point.x}
          </p>
          <p>
            {yAxisLabel}: {tooltip.point.y}
          </p>
        </div>
      )}
    </div>
  );
};

export default ScatterPlot;
