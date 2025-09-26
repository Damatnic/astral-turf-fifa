import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Import enhanced UI components
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import {
  PersonalizationProvider,
  usePersonalization,
} from '../components/ui/PersonalizationSystem';
import { AccessibilityProvider } from '../components/ui/AccessibilityComponents';
import {
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
  EnhancedSwitch,
} from '../components/ui/InteractiveComponents';
import {
  EnhancedLineChart,
  EnhancedBarChart,
  EnhancedDoughnutChart,
  EnhancedRadarChart,
} from '../components/charts/EnhancedCharts';
import { SwipeArea, Draggable, SortableList } from '../components/ui/GestureSystem';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultMode="light">
    <PersonalizationProvider>
      <AccessibilityProvider>{children}</AccessibilityProvider>
    </PersonalizationProvider>
  </ThemeProvider>
);

describe('Enhanced UI Components', () => {
  describe('ThemeProvider', () => {
    it('should provide theme context', () => {
      const TestComponent = () => {
        const { theme, themeMode, isDark } = useTheme();
        return (
          <div>
            <span data-testid="theme-mode">{themeMode}</span>
            <span data-testid="is-dark">{isDark ? 'dark' : 'light'}</span>
            <span data-testid="primary-color">{theme.colors.accent.primary}</span>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('light');
      expect(screen.getByTestId('primary-color')).toHaveTextContent('#0ea5e9');
    });

    it('should switch themes correctly', async () => {
      const TestComponent = () => {
        const { setThemeMode, themeMode } = useTheme();
        return (
          <div>
            <span data-testid="current-mode">{themeMode}</span>
            <button data-testid="switch-dark" onClick={() => setThemeMode('dark')}>
              Switch to Dark
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      expect(screen.getByTestId('current-mode')).toHaveTextContent('light');

      fireEvent.click(screen.getByTestId('switch-dark'));

      await waitFor(() => {
        expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
      });
    });
  });

  describe('PersonalizationProvider', () => {
    it('should provide personalization context', () => {
      const TestComponent = () => {
        const { preferences } = usePersonalization();
        return (
          <div>
            <span data-testid="theme-mode">{preferences.theme.mode}</span>
            <span data-testid="layout-density">{preferences.layout.density}</span>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('system');
      expect(screen.getByTestId('layout-density')).toHaveTextContent('comfortable');
    });

    it('should update preferences correctly', async () => {
      const TestComponent = () => {
        const { preferences, updatePreferences } = usePersonalization();

        const handleUpdate = () => {
          updatePreferences({
            layout: { ...preferences.layout, density: 'compact' },
          });
        };

        return (
          <div>
            <span data-testid="density">{preferences.layout.density}</span>
            <button data-testid="update-density" onClick={handleUpdate}>
              Update Density
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      expect(screen.getByTestId('density')).toHaveTextContent('comfortable');

      fireEvent.click(screen.getByTestId('update-density'));

      await waitFor(() => {
        expect(screen.getByTestId('density')).toHaveTextContent('compact');
      });
    });
  });

  describe('EnhancedButton', () => {
    it('should render correctly', () => {
      render(
        <TestWrapper>
          <EnhancedButton variant="primary">Test Button</EnhancedButton>
        </TestWrapper>,
      );

      const button = screen.getByRole('button', { name: 'Test Button' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Test Button');
    });

    it('should handle click events', async () => {
      const handleClick = vi.fn();

      render(
        <TestWrapper>
          <EnhancedButton onClick={handleClick}>Click Me</EnhancedButton>
        </TestWrapper>,
      );

      const button = screen.getByRole('button', { name: 'Click Me' });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should show loading state', () => {
      render(
        <TestWrapper>
          <EnhancedButton loading>Loading Button</EnhancedButton>
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <EnhancedButton disabled>Disabled Button</EnhancedButton>
        </TestWrapper>,
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('EnhancedCard', () => {
    it('should render correctly', () => {
      render(
        <TestWrapper>
          <EnhancedCard data-testid="test-card">
            <p>Card Content</p>
          </EnhancedCard>
        </TestWrapper>,
      );

      const card = screen.getByTestId('test-card');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should handle interactive state', async () => {
      const handleClick = vi.fn();

      render(
        <TestWrapper>
          <EnhancedCard interactive onClick={handleClick} data-testid="interactive-card">
            Interactive Card
          </EnhancedCard>
        </TestWrapper>,
      );

      const card = screen.getByTestId('interactive-card');
      fireEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('EnhancedInput', () => {
    it('should render correctly', () => {
      render(
        <TestWrapper>
          <EnhancedInput label="Test Input" placeholder="Enter text..." data-testid="test-input" />
        </TestWrapper>,
      );

      expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
    });

    it('should handle input changes', async () => {
      const handleChange = vi.fn();

      render(
        <TestWrapper>
          <EnhancedInput label="Test Input" onChange={handleChange} data-testid="test-input" />
        </TestWrapper>,
      );

      const input = screen.getByLabelText('Test Input');
      await userEvent.type(input, 'Hello World');

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('Hello World');
    });

    it('should show error state', () => {
      render(
        <TestWrapper>
          <EnhancedInput
            label="Test Input"
            error="This field is required"
            data-testid="test-input"
          />
        </TestWrapper>,
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
      const input = screen.getByLabelText('Test Input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('EnhancedSwitch', () => {
    it('should render correctly', () => {
      render(
        <TestWrapper>
          <EnhancedSwitch checked={false} onChange={vi.fn()} label="Test Switch" />
        </TestWrapper>,
      );

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByText('Test Switch')).toBeInTheDocument();
    });

    it('should handle toggle', async () => {
      const handleChange = vi.fn();

      render(
        <TestWrapper>
          <EnhancedSwitch checked={false} onChange={handleChange} label="Test Switch" />
        </TestWrapper>,
      );

      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Chart Components', () => {
    const mockChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [
        {
          label: 'Test Data',
          data: [10, 20, 30, 40],
        },
      ],
    };

    const mockDoughnutData = {
      labels: ['A', 'B', 'C'],
      values: [30, 40, 30],
    };

    it('should render EnhancedLineChart with loading state', () => {
      render(
        <TestWrapper>
          <EnhancedLineChart data={mockChartData} loading={true} title="Test Chart" />
        </TestWrapper>,
      );

      expect(screen.getByText('Test Chart')).toBeInTheDocument();
    });

    it('should render EnhancedBarChart with error state', () => {
      render(
        <TestWrapper>
          <EnhancedBarChart data={mockChartData} error="Failed to load data" title="Bar Chart" />
        </TestWrapper>,
      );

      expect(screen.getByText('Bar Chart')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should render EnhancedDoughnutChart', () => {
      render(
        <TestWrapper>
          <EnhancedDoughnutChart data={mockDoughnutData} title="Doughnut Chart" />
        </TestWrapper>,
      );

      expect(screen.getByText('Doughnut Chart')).toBeInTheDocument();
    });
  });

  describe('Gesture Components', () => {
    it('should render SwipeArea', () => {
      const handleSwipe = vi.fn();

      render(
        <TestWrapper>
          <SwipeArea config={{ onSwipe: handleSwipe }} data-testid="swipe-area">
            <div>Swipeable Content</div>
          </SwipeArea>
        </TestWrapper>,
      );

      expect(screen.getByTestId('swipe-area')).toBeInTheDocument();
      expect(screen.getByText('Swipeable Content')).toBeInTheDocument();
    });

    it('should render Draggable', () => {
      const handleDrag = vi.fn();

      render(
        <TestWrapper>
          <Draggable config={{ onDrag: handleDrag }} data-testid="draggable">
            <div>Draggable Content</div>
          </Draggable>
        </TestWrapper>,
      );

      expect(screen.getByTestId('draggable')).toBeInTheDocument();
      expect(screen.getByText('Draggable Content')).toBeInTheDocument();
    });

    it('should render SortableList', () => {
      const items = [
        { id: '1', content: <div>Item 1</div> },
        { id: '2', content: <div>Item 2</div> },
        { id: '3', content: <div>Item 3</div> },
      ];
      const handleReorder = vi.fn();

      render(
        <TestWrapper>
          <SortableList items={items} onReorder={handleReorder} />
        </TestWrapper>,
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should provide skip links', () => {
      render(
        <TestWrapper>
          <div>
            <a href="#main" className="sr-only focus:not-sr-only">
              Skip to main content
            </a>
            <div id="main">Main Content</div>
          </div>
        </TestWrapper>,
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main');
    });

    it('should handle keyboard navigation', async () => {
      render(
        <TestWrapper>
          <div>
            <EnhancedButton data-testid="button1">Button 1</EnhancedButton>
            <EnhancedButton data-testid="button2">Button 2</EnhancedButton>
          </div>
        </TestWrapper>,
      );

      const button1 = screen.getByTestId('button1');
      const button2 = screen.getByTestId('button2');

      // Focus first button
      button1.focus();
      expect(button1).toHaveFocus();

      // Tab to next button
      await userEvent.tab();
      expect(button2).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should lazy load components', async () => {
      const LazyComponent = React.lazy(() =>
        Promise.resolve({
          default: () => <div>Lazy Loaded Component</div>,
        }),
      );

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <LazyComponent />
          </React.Suspense>
        </TestWrapper>,
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Lazy Loaded Component')).toBeInTheDocument();
      });
    });

    it('should optimize animations for reduced motion', () => {
      // Mock matchMedia for prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const TestComponent = () => {
        const { preferences } = usePersonalization();
        return (
          <div data-testid="motion-state">
            {preferences.layout.reduceMotion ? 'reduced' : 'normal'}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      const motionState = screen.getByTestId('motion-state');
      expect(motionState).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should handle different screen sizes', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <TestWrapper>
          <div className="responsive-test">
            <EnhancedCard>Responsive Card</EnhancedCard>
          </div>
        </TestWrapper>,
      );

      const card = screen.getByText('Responsive Card');
      expect(card).toBeInTheDocument();
    });
  });
});

describe('Integration Tests', () => {
  it('should integrate all enhanced features', async () => {
    const TestApp = () => {
      const { setThemeMode } = useTheme();
      const { updatePreferences } = usePersonalization();

      const handleThemeChange = () => {
        setThemeMode('dark');
        updatePreferences({
          theme: { mode: 'dark', primaryColor: '#ff0000', accentColor: '#00ff00' },
        });
      };

      return (
        <div>
          <EnhancedButton onClick={handleThemeChange} data-testid="theme-button">
            Switch Theme
          </EnhancedButton>
          <EnhancedCard data-testid="themed-card">
            <p>This card should reflect theme changes</p>
          </EnhancedCard>
        </div>
      );
    };

    render(
      <TestWrapper>
        <TestApp />
      </TestWrapper>,
    );

    const themeButton = screen.getByTestId('theme-button');
    const themedCard = screen.getByTestId('themed-card');

    expect(themeButton).toBeInTheDocument();
    expect(themedCard).toBeInTheDocument();

    fireEvent.click(themeButton);

    await waitFor(() => {
      // Theme changes should be applied
      expect(document.body).toHaveClass('theme-dark');
    });
  });
});

// Mock Chart.js for testing
vi.mock('chart.js', () => {
  const mockChart = vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    data: { datasets: [] },
  }));

  // Add register method to the Chart function
  mockChart.register = vi.fn();

  return {
    Chart: mockChart,
    CategoryScale: vi.fn(),
    LinearScale: vi.fn(),
    PointElement: vi.fn(),
    LineElement: vi.fn(),
    BarElement: vi.fn(),
    ArcElement: vi.fn(),
    RadialLinearScale: vi.fn(),
    Title: vi.fn(),
    Tooltip: vi.fn(),
    Legend: vi.fn(),
    Filler: vi.fn(),
  };
});

vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: unknown) => (
    <div data-testid="line-chart">Line Chart: {data.labels?.join(', ')}</div>
  ),
  Bar: ({ data }: unknown) => (
    <div data-testid="bar-chart">Bar Chart: {data.labels?.join(', ')}</div>
  ),
  Doughnut: ({ data }: unknown) => (
    <div data-testid="doughnut-chart">Doughnut Chart: {data.labels?.join(', ')}</div>
  ),
  Radar: ({ data }: unknown) => (
    <div data-testid="radar-chart">Radar Chart: {data.labels?.join(', ')}</div>
  ),
}));

// Mock framer-motion for testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: unknown) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: unknown) => <button {...props}>{children}</button>,
    input: ({ children, ...props }: unknown) => <input {...props}>{children}</input>,
  },
  AnimatePresence: ({ children }: unknown) => children,
  useMotionValue: () => ({ set: vi.fn(), get: vi.fn(() => 0) }),
  useTransform: () => ({ set: vi.fn(), get: vi.fn(() => 0) }),
  useDragControls: () => ({ start: vi.fn() }),
}));
