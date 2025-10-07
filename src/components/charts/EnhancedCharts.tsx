import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScriptableContext,
  TooltipItem,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { AnimatedContainer } from '../ui/AnimationSystem';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// Chart animation variants
const chartVariants: import('framer-motion').Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

interface BaseChartProps {
  title?: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
  error?: string;
  className?: string;
  animated?: boolean;
}

// Enhanced Line Chart
interface EnhancedLineChartProps extends BaseChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      color?: string;
      fill?: boolean;
      gradient?: boolean;
    }>;
  };
  showPoints?: boolean;
  smooth?: boolean;
  stacked?: boolean;
}

export const EnhancedLineChart: React.FC<EnhancedLineChartProps> = ({
  data,
  title,
  subtitle,
  height = 300,
  loading = false,
  error,
  className = '',
  animated = true,
  showPoints = true,
  smooth = true,
  stacked = false,
}) => {
  const { theme, tokens } = useTheme();
  const chartRef = useRef<ChartJS>(null);
  // Animation handled by AnimatedContainer

  // Create gradient backgrounds
  const createGradient = (ctx: CanvasRenderingContext2D, color: string, alpha = 0.1) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(
      0,
      `${color}${Math.round(alpha * 255)
        .toString(16)
        .padStart(2, '0')}`,
    );
    gradient.addColorStop(1, `${color}00`);
    return gradient;
  };

  // Animation handled by AnimatedContainer wrapper

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(dataset => {
      const color = dataset.color || theme.colors.accent.primary;
      return {
        label: dataset.label,
        data: dataset.data,
        borderColor: color,
        backgroundColor:
          dataset.fill || dataset.gradient
            ? (context: ScriptableContext<'line'>) => {
                const ctx = context.chart.ctx;
                return createGradient(ctx, color, 0.1);
              }
            : color,
        borderWidth: 3,
        pointRadius: showPoints ? 4 : 0,
        pointHoverRadius: showPoints ? 6 : 0,
        pointBackgroundColor: color,
        pointBorderColor: theme.colors.background.primary,
        pointBorderWidth: 2,
        fill: dataset.fill || dataset.gradient || false,
        tension: smooth ? 0.4 : 0,
        cubicInterpolationMode: (smooth ? 'monotone' : 'default') as 'monotone' | 'default',
      };
    }),
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animated
      ? {
          duration: 1500,
          easing: 'easeInOutQuart',
          delay: context => context.dataIndex * 50,
        }
      : false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.colors.text.secondary,
          font: {
            family: tokens.typography.fontFamilies.sans.join(', '),
            size: 12,
            weight: 500,
          },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: theme.colors.background.secondary,
        titleColor: theme.colors.text.primary,
        bodyColor: theme.colors.text.secondary,
        borderColor: theme.colors.border.primary,
        borderWidth: 1,
        cornerRadius: parseInt(tokens.borderRadius.lg),
        displayColors: true,
        intersect: false,
        mode: 'index',
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked,
        grid: {
          color: theme.colors.border.primary,
          display: true,
        },
        ticks: {
          color: theme.colors.text.tertiary,
          font: {
            family: tokens.typography.fontFamilies.sans.join(', '),
            size: 11,
          },
        },
      },
      y: {
        stacked,
        grid: {
          color: theme.colors.border.primary,
          display: true,
        },
        ticks: {
          color: theme.colors.text.tertiary,
          font: {
            family: tokens.typography.fontFamilies.sans.join(', '),
            size: 11,
          },
        },
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: theme.colors.accent.primary,
        hoverBorderColor: theme.colors.background.primary,
      },
    },
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: theme.colors.accent.primary }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatedContainer variant="fade" className={className}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <motion.div variants={chartVariants} initial="hidden" animate="visible" style={{ height }}>
        <Line ref={chartRef as any} data={chartData} options={options} />
      </motion.div>
    </AnimatedContainer>
  );
};

// Enhanced Bar Chart
interface EnhancedBarChartProps extends BaseChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      color?: string;
      gradient?: boolean;
    }>;
  };
  horizontal?: boolean;
  stacked?: boolean;
}

export const EnhancedBarChart: React.FC<EnhancedBarChartProps> = ({
  data,
  title,
  subtitle,
  height = 300,
  loading = false,
  error,
  className = '',
  animated = true,
  horizontal = false,
  stacked = false,
}) => {
  const { theme, tokens } = useTheme();
  const chartRef = useRef<ChartJS>(null);

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(dataset => {
      const color = dataset.color || theme.colors.accent.primary;
      return {
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.gradient
          ? (context: ScriptableContext<'bar'>) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, height);
              gradient.addColorStop(0, color);
              gradient.addColorStop(1, `${color}80`);
              return gradient;
            }
          : color,
        borderColor: color,
        borderWidth: 0,
        borderRadius: parseInt(tokens.borderRadius.md),
        borderSkipped: false,
      };
    }),
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    animation: animated
      ? {
          duration: 1200,
          easing: 'easeOutQuart',
          delay: context => context.dataIndex * 80,
        }
      : false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.colors.text.secondary,
          font: {
            family: tokens.typography.fontFamilies.sans.join(', '),
            size: 12,
            weight: 500,
          },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: theme.colors.background.secondary,
        titleColor: theme.colors.text.primary,
        bodyColor: theme.colors.text.secondary,
        borderColor: theme.colors.border.primary,
        borderWidth: 1,
        cornerRadius: parseInt(tokens.borderRadius.lg),
      },
    },
    scales: {
      x: {
        stacked,
        grid: {
          color: theme.colors.border.primary,
          display: !horizontal,
        },
        ticks: {
          color: theme.colors.text.tertiary,
          font: {
            family: tokens.typography.fontFamilies.sans.join(', '),
            size: 11,
          },
        },
      },
      y: {
        stacked,
        grid: {
          color: theme.colors.border.primary,
          display: horizontal,
        },
        ticks: {
          color: theme.colors.text.tertiary,
          font: {
            family: tokens.typography.fontFamilies.sans.join(', '),
            size: 11,
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: theme.colors.accent.primary }}
        />
      </div>
    );
  }

  return (
    <AnimatedContainer variant="scale" className={className}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <motion.div variants={chartVariants} initial="hidden" animate="visible" style={{ height }}>
        <Bar ref={chartRef as any} data={chartData} options={options} />
      </motion.div>
    </AnimatedContainer>
  );
};

// Enhanced Doughnut Chart
interface EnhancedDoughnutChartProps extends BaseChartProps {
  data: {
    labels: string[];
    values: number[];
    colors?: string[];
  };
  showPercentage?: boolean;
  cutout?: string;
}

export const EnhancedDoughnutChart: React.FC<EnhancedDoughnutChartProps> = ({
  data,
  title,
  subtitle,
  height = 300,
  loading = false,
  error,
  className = '',
  animated = true,
  showPercentage = true,
  cutout = '60%',
}) => {
  const { theme, tokens } = useTheme();
  const chartRef = useRef<ChartJS>(null);

  const total = data.values.reduce((sum, value) => sum + value, 0);
  const colors = data.colors || [
    theme.colors.accent.primary,
    theme.colors.status.success,
    theme.colors.status.warning,
    theme.colors.status.error,
    theme.colors.accent.primary,
    theme.colors.accent.secondary,
  ];

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: colors,
        borderColor: colors.map(color => color),
        borderWidth: 2,
        hoverBorderWidth: 4,
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout,
    animation: animated
      ? {
          animateRotate: true,
          animateScale: true,
          duration: 1000,
          easing: 'easeOutQuart',
        }
      : false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme.colors.text.secondary,
          font: {
            family: tokens.typography.fontFamilies.sans.join(', '),
            size: 12,
            weight: 500,
          },
          usePointStyle: true,
          padding: 15,
          generateLabels: chart => {
            const dataset = chart.data.datasets[0];
            return data.labels.map((label, index) => {
              const value = dataset.data[index] as number;
              const percentage = ((value / total) * 100).toFixed(1);
              return {
                text: showPercentage ? `${label} (${percentage}%)` : label,
                fillStyle: colors[index],
                strokeStyle: colors[index],
                hidden: false,
                index,
              };
            });
          },
        },
      },
      tooltip: {
        backgroundColor: theme.colors.background.secondary,
        titleColor: theme.colors.text.primary,
        bodyColor: theme.colors.text.secondary,
        borderColor: theme.colors.border.primary,
        borderWidth: 1,
        cornerRadius: parseInt(tokens.borderRadius.lg),
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => {
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: theme.colors.accent.primary }}
        />
      </div>
    );
  }

  return (
    <AnimatedContainer variant="scale" className={className}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <motion.div variants={chartVariants} initial="hidden" animate="visible" style={{ height }}>
        <Doughnut ref={chartRef as any} data={chartData} options={options} />
      </motion.div>
    </AnimatedContainer>
  );
};

// Enhanced Radar Chart
interface EnhancedRadarChartProps extends BaseChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      color?: string;
      fill?: boolean;
    }>;
  };
  scale?: { min?: number; max?: number };
}

export const EnhancedRadarChart: React.FC<EnhancedRadarChartProps> = ({
  data,
  title,
  subtitle,
  height = 300,
  loading = false,
  error,
  className = '',
  animated = true,
  scale,
}) => {
  const { theme, tokens } = useTheme();
  const chartRef = useRef<ChartJS>(null);

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(dataset => {
      const color = dataset.color || theme.colors.accent.primary;
      return {
        label: dataset.label,
        data: dataset.data,
        borderColor: color,
        backgroundColor: `${color}20`,
        pointBackgroundColor: color,
        pointBorderColor: theme.colors.background.primary,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        fill: dataset.fill !== false,
      };
    }),
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animated
      ? {
          duration: 1000,
          easing: 'easeOutQuart',
        }
      : false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.colors.text.secondary,
          font: {
            family: tokens.typography.fontFamilies.sans.join(', '),
            size: 12,
            weight: 500,
          },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: theme.colors.background.secondary,
        titleColor: theme.colors.text.primary,
        bodyColor: theme.colors.text.secondary,
        borderColor: theme.colors.border.primary,
        borderWidth: 1,
        cornerRadius: parseInt(tokens.borderRadius.lg),
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        min: scale?.min,
        max: scale?.max,
        angleLines: {
          color: theme.colors.border.primary,
        },
        grid: {
          color: theme.colors.border.primary,
        },
        pointLabels: {
          color: theme.colors.text.secondary,
          font: {
            family: tokens.typography.fontFamilies.sans.join(', '),
            size: 11,
            weight: 500,
          },
        },
        ticks: {
          color: theme.colors.text.tertiary,
          font: {
            family: tokens.typography.fontFamilies.sans.join(', '),
            size: 10,
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: theme.colors.accent.primary }}
        />
      </div>
    );
  }

  return (
    <AnimatedContainer variant="fade" className={className}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <motion.div variants={chartVariants} initial="hidden" animate="visible" style={{ height }}>
        <Radar ref={chartRef as any} data={chartData} options={options} />
      </motion.div>
    </AnimatedContainer>
  );
};

export default {
  EnhancedLineChart,
  EnhancedBarChart,
  EnhancedDoughnutChart,
  EnhancedRadarChart,
};
