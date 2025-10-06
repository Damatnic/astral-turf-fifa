/**
 * Chart Accessibility Utilities
 * Provides functions to generate accessible descriptions for charts
 * following WCAG 2.1 AA guidelines for data visualization
 */

interface DataPoint {
  x?: number;
  y?: number;
  label?: string;
  value?: number;
}

/**
 * Generate accessible description for bar chart
 */
export function generateBarChartDescription(
  data: { label: string; value: number }[],
  title?: string
): string {
  if (!data || data.length === 0) {
    return 'Empty bar chart with no data';
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const average = Math.round(total / data.length);
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const maxItem = data.find(d => d.value === max);
  const minItem = data.find(d => d.value === min);

  const parts = [
    title ? `${title}.` : 'Bar chart.',
    `Showing ${data.length} data points.`,
    `Values range from ${min} to ${max}.`,
    `Average value is ${average}.`,
    maxItem && `Highest: ${maxItem.label} at ${maxItem.value}.`,
    minItem && maxItem?.label !== minItem?.label && `Lowest: ${minItem.label} at ${minItem.value}.`,
  ];

  return parts.filter(Boolean).join(' ');
}

/**
 * Generate accessible description for line chart
 */
export function generateLineChartDescription(
  data: DataPoint[],
  xAxisLabel?: string,
  yAxisLabel?: string,
  title?: string
): string {
  if (!data || data.length === 0) {
    return 'Empty line chart with no data';
  }

  const validData = data.filter(
    d => d && typeof d.x === 'number' && typeof d.y === 'number' && !isNaN(d.x) && !isNaN(d.y)
  );

  if (validData.length === 0) {
    return 'Line chart with invalid data';
  }

  const yValues = validData.map(d => d.y!);
  const xValues = validData.map(d => d.x!);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);

  // Calculate trend
  const firstY = validData[0].y!;
  const lastY = validData[validData.length - 1].y!;
  const change = lastY - firstY;
  const percentChange = Math.round((change / firstY) * 100);
  const trend =
    change > 0
      ? `increasing by ${percentChange}%`
      : change < 0
        ? `decreasing by ${Math.abs(percentChange)}%`
        : 'stable';

  const parts = [
    title ? `${title}.` : 'Line chart.',
    `Showing ${validData.length} data points`,
    xAxisLabel && `along ${xAxisLabel}`,
    `from ${xMin} to ${xMax}.`,
    yAxisLabel && `${yAxisLabel} values`,
    `range from ${yMin} to ${yMax}.`,
    `Overall trend is ${trend}.`,
  ];

  return parts.filter(Boolean).join(' ');
}

/**
 * Generate accessible description for radar chart
 */
export function generateRadarChartDescription(
  datasets: {
    label: string;
    color: string;
    values: number[];
  }[],
  labels: string[],
  title?: string
): string {
  if (!datasets || datasets.length === 0 || !labels || labels.length === 0) {
    return 'Empty radar chart with no data';
  }

  const parts = [
    title ? `${title}.` : 'Radar chart.',
    `Comparing ${datasets.length} dataset(s) across ${labels.length} dimensions.`,
  ];

  // Add details for each dataset
  datasets.forEach(dataset => {
    const total = dataset.values.reduce((sum, val) => sum + val, 0);
    const average = Math.round(total / dataset.values.length);
    const max = Math.max(...dataset.values);
    const min = Math.min(...dataset.values);
    const maxIndex = dataset.values.indexOf(max);
    const minIndex = dataset.values.indexOf(min);

    parts.push(
      `${dataset.label}: average ${average}, highest in ${labels[maxIndex]} at ${max}, lowest in ${labels[minIndex]} at ${min}.`
    );
  });

  return parts.join(' ');
}

/**
 * Generate table alternative for chart data (for screen readers)
 */
export function generateChartTable(
  data: { label: string; value: number }[],
  caption: string
): string {
  if (!data || data.length === 0) {
    return '';
  }

  const rows = data.map(d => `${d.label}: ${d.value}`).join('; ');
  return `${caption}. Data: ${rows}`;
}

/**
 * Format number for screen readers
 */
export function formatNumberForScreenReader(value: number, decimals: number = 0): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)} million`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(decimals)} thousand`;
  }
  return value.toFixed(decimals);
}
