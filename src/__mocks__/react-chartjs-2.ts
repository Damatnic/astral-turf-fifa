// Mock react-chartjs-2 for testing
import React from 'react';

// Define proper types for chart props
interface ChartProps {
  type?: string;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: unknown;
}

// Mock chart components that return simple divs
const MockChart = React.forwardRef<HTMLDivElement, ChartProps>((props, ref) => {
  return React.createElement('div', {
    'data-testid': `mock-chart-${props.type || 'generic'}`,
    ref,
    style: props.style || {},
    className: props.className || '',
  });
});

MockChart.displayName = 'MockChart';

export const Line = React.forwardRef<HTMLDivElement, ChartProps>((props, ref) => 
  React.createElement(MockChart, { ...props, type: 'line', ref })
);
Line.displayName = 'Line';

export const Bar = React.forwardRef<HTMLDivElement, ChartProps>((props, ref) => 
  React.createElement(MockChart, { ...props, type: 'bar', ref })
);
Bar.displayName = 'Bar';

export const Doughnut = React.forwardRef<HTMLDivElement, ChartProps>((props, ref) => 
  React.createElement(MockChart, { ...props, type: 'doughnut', ref })
);
Doughnut.displayName = 'Doughnut';

export const Radar = React.forwardRef<HTMLDivElement, ChartProps>((props, ref) => 
  React.createElement(MockChart, { ...props, type: 'radar', ref })
);
Radar.displayName = 'Radar';

export const Pie = React.forwardRef<HTMLDivElement, ChartProps>((props, ref) => 
  React.createElement(MockChart, { ...props, type: 'pie', ref })
);
Pie.displayName = 'Pie';

export const PolarArea = React.forwardRef<HTMLDivElement, ChartProps>((props, ref) => 
  React.createElement(MockChart, { ...props, type: 'polarArea', ref })
);
PolarArea.displayName = 'PolarArea';

export const Scatter = React.forwardRef<HTMLDivElement, ChartProps>((props, ref) => 
  React.createElement(MockChart, { ...props, type: 'scatter', ref })
);
Scatter.displayName = 'Scatter';

export const Bubble = React.forwardRef<HTMLDivElement, ChartProps>((props, ref) => 
  React.createElement(MockChart, { ...props, type: 'bubble', ref })
);
Bubble.displayName = 'Bubble';

// Mock the default export
export default {
  Line,
  Bar,
  Doughnut,
  Radar,
  Pie,
  PolarArea,
  Scatter,
  Bubble,
};