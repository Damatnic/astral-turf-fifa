// Mock Chart.js for testing
import { vi } from 'vitest';

// Mock Chart class
const mockChart = {
  register: vi.fn(),
  Chart: vi.fn().mockImplementation(() => ({
    render: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
    reset: vi.fn(),
    stop: vi.fn(),
    resize: vi.fn(),
    clear: vi.fn(),
    toBase64Image: vi.fn(),
    generateLegend: vi.fn(),
    getElementAtEvent: vi.fn(),
    getElementsAtEvent: vi.fn(),
    getElementsAtXAxis: vi.fn(),
    getElementsAtEventForMode: vi.fn(),
    getDatasetAtEvent: vi.fn(),
  })),
  defaults: {
    global: {
      responsive: true,
      maintainAspectRatio: false,
    },
  },
};

// Mock all Chart.js components
export const Chart = mockChart.Chart;
export const CategoryScale = vi.fn();
export const LinearScale = vi.fn();
export const PointElement = vi.fn();
export const LineElement = vi.fn();
export const BarElement = vi.fn();
export const ArcElement = vi.fn();
export const RadialLinearScale = vi.fn();
export const Title = vi.fn();
export const Tooltip = vi.fn();
export const Legend = vi.fn();
export const Filler = vi.fn();

// Mock register function
(Chart as any).register = mockChart.register;

export default mockChart;
