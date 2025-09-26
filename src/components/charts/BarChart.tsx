import React from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  color = 'var(--accent-secondary)',
  height = 200,
}) => {
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value), 1) : 1;
  const chartHeight = height - 40; // leave space for labels
  const barWidth = 40;
  const gap = 20;
  const totalWidth = data.length * (barWidth + gap) - gap;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${totalWidth} ${height}`} className="font-sans">
      {data.map((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = i * (barWidth + gap);
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={chartHeight - barHeight}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx="3"
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={chartHeight - barHeight - 8}
              textAnchor="middle"
              fontSize="14"
              fill="var(--text-primary)"
              className="font-bold"
            >
              {d.value}
            </text>
            <text
              x={x + barWidth / 2}
              y={chartHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill="var(--text-secondary)"
              className="font-semibold"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default BarChart;
