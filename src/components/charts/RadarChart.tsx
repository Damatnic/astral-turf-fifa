import React, { useMemo } from 'react';
import { generateRadarChartDescription } from '@/utils/chartAccessibility';

interface RadarChartProps {
  datasets: {
    label: string;
    color: string;
    values: number[];
  }[];
  labels: string[];
  size?: number;
  title?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({ datasets, labels, size = 300, title }) => {
  const center = size / 2;
  const numSides = labels.length;
  const angleSlice = (Math.PI * 2) / numSides;

  const gridLevels = 4;
  const maxVal = 100;

  // Generate accessible description
  const ariaDescription = useMemo(
    () => generateRadarChartDescription(datasets, labels, title),
    [datasets, labels, title]
  );

  // Grid polygons and axis lines
  const grid = useMemo(() => {
    const levels: React.ReactNode[] = [];
    for (let i = 1; i <= gridLevels; i++) {
      const radius = center * 0.8 * (i / gridLevels);
      const points = labels
        .map((_, j) => {
          const angle = angleSlice * j - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return `${x},${y}`;
        })
        .join(' ');
      levels.push(
        <polygon
          key={`grid-${i}`}
          points={points}
          fill="none"
          stroke="var(--border-primary)"
          strokeWidth="0.5"
        />
      );
    }
    return levels;
  }, [center, gridLevels, labels, angleSlice]);

  const axes = useMemo(() => {
    const radius = center * 0.8;
    return labels.map((_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return (
        <line
          key={`axis-${angle}`}
          x1={center}
          y1={center}
          x2={x}
          y2={y}
          stroke="var(--border-primary)"
          strokeWidth="0.5"
        />
      );
    });
  }, [center, labels, angleSlice]);

  // Axis labels
  const axisLabels = useMemo(() => {
    const radius = center * 0.95;
    return labels.map((label, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      let textAnchor: 'start' | 'middle' | 'end' = 'middle';
      if (x < center - 5) {
        textAnchor = 'end';
      }
      if (x > center + 5) {
        textAnchor = 'start';
      }

      return (
        <text
          key={`label-${label}`}
          x={x}
          y={y}
          fill="var(--text-secondary)"
          fontSize="10"
          textAnchor={textAnchor}
          dy="0.3em"
          className="font-semibold uppercase"
        >
          {label.substring(0, 3)}
        </text>
      );
    });
  }, [center, labels, angleSlice]);

  // Data polygons
  const dataPolygons = useMemo(() => {
    return datasets.map(dataset => {
      const points = dataset.values
        .map((value, i) => {
          const radius = (center * 0.8 * value) / maxVal;
          const angle = angleSlice * i - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return `${x},${y}`;
        })
        .join(' ');
      return (
        <polygon
          key={dataset.label}
          points={points}
          fill={`${dataset.color}55`}
          stroke={dataset.color}
          strokeWidth="2"
        />
      );
    });
  }, [datasets, center, angleSlice, maxVal]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={title || 'Radar chart comparing multiple attributes'}
      aria-describedby="radar-chart-desc"
    >
      <desc id="radar-chart-desc">{ariaDescription}</desc>
      <g>{grid}</g>
      <g>{axes}</g>
      <g>{axisLabels}</g>
      <g>{dataPolygons}</g>
    </svg>
  );
};

export default RadarChart;
