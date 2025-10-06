import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, testUtils, mockCanvas } from '../../utils/test-helpers';
import { generateFormation, generatePlayer, createTestDataSet } from '../../utils/mock-generators';
import { SmartSidebar } from '../../../components/tactics/SmartSidebar';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )),
    aside: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => (
      <aside ref={ref} {...props}>
        {children}
      </aside>
    )),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ChevronLeft: () => <div data-testid="chevron-left-icon">ChevronLeft</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">ChevronRight</div>,
  Home: () => <div data-testid="home-icon">Home</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  BarChart3: () => <div data-testid="bar-chart-icon">BarChart3</div>,
  FileText: () => <div data-testid="file-text-icon">FileText</div>,
  Layers: () => <div data-testid="layers-icon">Layers</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
}));

describe('SmartSidebar', () => {
  let mockProps: any;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // Setup component props
    mockProps = {
      isCollapsed: false,
      onToggleCollapse: vi.fn(),
      activeTab: 'formations',
      onTabChange: vi.fn(),
      onFormationSelect: vi.fn(),
      onPlayerSelect: vi.fn(),
      onChallengeSelect: vi.fn(),
      onAnalyticsView: vi.fn(),
      className: '',
    };

    // Setup user event
    user = userEvent.setup();

    // Setup canvas mock
    mockCanvas();

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render sidebar with all main sections', () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveAttribute('data-state', 'expanded');

      // Check navigation tabs
      expect(screen.getByRole('button', { name: /formations/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /players/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /challenges/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /analytics/i })).toBeInTheDocument();
    });

    it('should show collapsed state when collapsed prop is true', () => {
      renderWithProviders(<SmartSidebar {...mockProps} isCollapsed={true} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toHaveAttribute('data-state', 'collapsed');
      expect(sidebar).toHaveClass('w-16'); // Collapsed width
    });

    it('should apply custom className when provided', () => {
      const customClass = 'custom-sidebar';
      renderWithProviders(<SmartSidebar {...mockProps} className={customClass} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toHaveClass(customClass);
    });

    it('should render toggle button', () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should show correct active tab', () => {
      renderWithProviders(<SmartSidebar {...mockProps} activeTab="players" />);

      const playersTab = screen.getByRole('button', { name: /players/i });
      expect(playersTab).toHaveClass('bg-blue-500'); // Active state class
    });
  });

  describe('Sidebar Collapse/Expand', () => {
    it('should handle toggle collapse action', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
      await user.click(toggleButton);

      expect(mockProps.onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard toggle with Escape key', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      sidebar.focus();
      await user.keyboard('[Escape]');

      expect(mockProps.onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('should show peek state on hover when collapsed', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} isCollapsed={true} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      await user.hover(sidebar);

      expect(sidebar).toHaveAttribute('data-state', 'peek');
    });

    it('should hide peek state on mouse leave', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} isCollapsed={true} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      await user.hover(sidebar);
      await user.unhover(sidebar);

      expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    });

    it('should show tooltip on collapsed items', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} isCollapsed={true} />);

      const formationsTab = screen.getByRole('button', { name: /formations/i });
      await user.hover(formationsTab);

      await waitFor(() => {
        expect(screen.getByText('Formations')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should handle tab change', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const playersTab = screen.getByRole('button', { name: /players/i });
      await user.click(playersTab);

      expect(mockProps.onTabChange).toHaveBeenCalledWith('players');
    });

    it('should support keyboard navigation between tabs', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const formationsTab = screen.getByRole('button', { name: /formations/i });
      formationsTab.focus();

      // Navigate with arrow keys
      await user.keyboard('[ArrowDown]');
      expect(screen.getByRole('button', { name: /players/i })).toHaveFocus();

      await user.keyboard('[ArrowDown]');
      expect(screen.getByRole('button', { name: /challenges/i })).toHaveFocus();

      await user.keyboard('[ArrowUp]');
      expect(screen.getByRole('button', { name: /players/i })).toHaveFocus();
    });

    it('should activate tab with Enter or Space', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const playersTab = screen.getByRole('button', { name: /players/i });
      playersTab.focus();

      await user.keyboard('[Enter]');
      expect(mockProps.onTabChange).toHaveBeenCalledWith('players');

      mockProps.onTabChange.mockClear();

      await user.keyboard('[Space]');
      expect(mockProps.onTabChange).toHaveBeenCalledWith('players');
    });

    it('should wrap keyboard navigation at boundaries', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const formationsTab = screen.getByRole('button', { name: /formations/i });
      formationsTab.focus();

      // Navigate up from first tab should go to last
      await user.keyboard('[ArrowUp]');
      expect(screen.getByRole('button', { name: /analytics/i })).toHaveFocus();

      // Navigate down from last tab should go to first
      await user.keyboard('[ArrowDown]');
      expect(screen.getByRole('button', { name: /formations/i })).toHaveFocus();
    });
  });

  describe('Formations Panel', () => {
    it('should display formations list when formations tab is active', () => {
      const initialState = {
        tactics: {
          formations: [
            generateFormation({ id: 'formation-1', name: '4-4-2 Classic' }),
            generateFormation({ id: 'formation-2', name: '4-3-3 Attack' }),
          ],
        },
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="formations" />, { initialState });

      expect(screen.getByText('4-4-2 Classic')).toBeInTheDocument();
      expect(screen.getByText('4-3-3 Attack')).toBeInTheDocument();
    });

    it('should handle formation selection', async () => {
      const formation = generateFormation({ id: 'formation-1', name: '4-4-2 Classic' });
      const initialState = {
        tactics: {
          formations: [formation],
        },
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="formations" />, { initialState });

      const formationItem = screen.getByText('4-4-2 Classic');
      await user.click(formationItem);

      expect(mockProps.onFormationSelect).toHaveBeenCalledWith(formation);
    });

    it('should show formation preview on hover', async () => {
      const formation = generateFormation({ id: 'formation-1', name: '4-4-2 Classic' });
      const initialState = {
        tactics: {
          formations: [formation],
        },
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="formations" />, { initialState });

      const formationItem = screen.getByText('4-4-2 Classic');
      await user.hover(formationItem);

      await waitFor(() => {
        expect(screen.getByTestId('formation-preview')).toBeInTheDocument();
      });
    });

    it('should show empty state when no formations available', () => {
      const initialState = {
        tactics: {
          formations: [],
        },
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="formations" />, { initialState });

      expect(screen.getByText(/no formations available/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create new formation/i })).toBeInTheDocument();
    });

    it('should filter formations based on search input', async () => {
      const formations = [
        generateFormation({ id: 'formation-1', name: '4-4-2 Classic' }),
        generateFormation({ id: 'formation-2', name: '4-3-3 Attack' }),
        generateFormation({ id: 'formation-3', name: '3-5-2 Counter' }),
      ];
      const initialState = {
        tactics: {
          formations,
        },
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="formations" />, { initialState });

      const searchInput = screen.getByPlaceholderText(/search formations/i);
      await user.type(searchInput, '4-4-2');

      expect(screen.getByText('4-4-2 Classic')).toBeInTheDocument();
      expect(screen.queryByText('4-3-3 Attack')).not.toBeInTheDocument();
      expect(screen.queryByText('3-5-2 Counter')).not.toBeInTheDocument();
    });
  });

  describe('Players Panel', () => {
    it('should display players list when players tab is active', () => {
      const players = [
        generatePlayer({ id: 'player-1', name: 'John Doe', position: 'FW' as any }),
        generatePlayer({ id: 'player-2', name: 'Jane Smith', position: 'MF' as any }),
      ];
      const initialState = {
        tactics: {
          players,
        },
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="players" />, { initialState });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should handle player selection', async () => {
      const player = generatePlayer({ id: 'player-1', name: 'John Doe' });
      const initialState = {
        tactics: {
          players: [player],
        },
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="players" />, { initialState });

      const playerItem = screen.getByText('John Doe');
      await user.click(playerItem);

      expect(mockProps.onPlayerSelect).toHaveBeenCalledWith(player);
    });

    it('should filter players by position', async () => {
      const players = [
        generatePlayer({ id: 'player-1', name: 'John Doe', position: 'FW' as any }),
        generatePlayer({ id: 'player-2', name: 'Jane Smith', position: 'MF' as any }),
        generatePlayer({ id: 'player-3', name: 'Bob Wilson', position: 'DF' as any }),
      ];
      const initialState = {
        tactics: {
          players,
        },
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="players" />, { initialState });

      const positionFilter = screen.getByRole('button', { name: /forward/i });
      await user.click(positionFilter);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('should sort players by different criteria', async () => {
      const players = [
        generatePlayer({ id: 'player-1', name: 'Alice', attributes: { speed: 70 } as any }),
        generatePlayer({ id: 'player-2', name: 'Bob', attributes: { speed: 90 } as any }),
        generatePlayer({ id: 'player-3', name: 'Charlie', attributes: { speed: 80 } as any }),
      ];
      const initialState = {
        tactics: {
          players,
        },
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="players" />, { initialState });

      const sortButton = screen.getByRole('button', { name: /sort by speed/i });
      await user.click(sortButton);

      const playerItems = screen.getAllByTestId('player-item');
      expect(playerItems[0]).toHaveTextContent('Bob'); // Highest speed first
      expect(playerItems[1]).toHaveTextContent('Charlie');
      expect(playerItems[2]).toHaveTextContent('Alice');
    });
  });

  describe('Challenges Panel', () => {
    it('should display challenges when challenges tab is active', () => {
      const challenges = [
        { id: 'challenge-1', title: 'Master the 4-3-3', difficulty: 'intermediate' },
        { id: 'challenge-2', title: 'Perfect Positioning', difficulty: 'advanced' },
      ];
      const initialState = {
        challenges,
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="challenges" />, { initialState });

      expect(screen.getByText('Master the 4-3-3')).toBeInTheDocument();
      expect(screen.getByText('Perfect Positioning')).toBeInTheDocument();
    });

    it('should handle challenge selection', async () => {
      const challenge = { id: 'challenge-1', title: 'Master the 4-3-3' };
      const initialState = {
        challenges: [challenge],
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="challenges" />, { initialState });

      const challengeItem = screen.getByText('Master the 4-3-3');
      await user.click(challengeItem);

      expect(mockProps.onChallengeSelect).toHaveBeenCalledWith(challenge);
    });

    it('should filter challenges by difficulty', async () => {
      const challenges = [
        { id: 'challenge-1', title: 'Easy Challenge', difficulty: 'beginner' },
        { id: 'challenge-2', title: 'Hard Challenge', difficulty: 'advanced' },
      ];
      const initialState = {
        challenges,
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="challenges" />, { initialState });

      const beginnerFilter = screen.getByRole('button', { name: /beginner/i });
      await user.click(beginnerFilter);

      expect(screen.getByText('Easy Challenge')).toBeInTheDocument();
      expect(screen.queryByText('Hard Challenge')).not.toBeInTheDocument();
    });

    it('should show challenge progress', () => {
      const challenges = [
        { id: 'challenge-1', title: 'In Progress', progress: 60, isCompleted: false },
        { id: 'challenge-2', title: 'Completed', progress: 100, isCompleted: true },
      ];
      const initialState = {
        challenges,
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="challenges" />, { initialState });

      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByTestId('completed-badge')).toBeInTheDocument();
    });
  });

  describe('Analytics Panel', () => {
    it('should display analytics options when analytics tab is active', () => {
      renderWithProviders(<SmartSidebar {...mockProps} activeTab="analytics" />);

      expect(screen.getByText(/formation analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/player performance/i)).toBeInTheDocument();
      expect(screen.getByText(/tactical trends/i)).toBeInTheDocument();
    });

    it('should handle analytics view selection', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} activeTab="analytics" />);

      const formationAnalysis = screen.getByRole('button', { name: /formation analysis/i });
      await user.click(formationAnalysis);

      expect(mockProps.onAnalyticsView).toHaveBeenCalledWith('formation');
    });

    it('should show analytics preview charts', () => {
      renderWithProviders(<SmartSidebar {...mockProps} activeTab="analytics" />);

      expect(screen.getByTestId('mini-chart-formation')).toBeInTheDocument();
      expect(screen.getByTestId('mini-chart-performance')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should auto-collapse on mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<SmartSidebar {...mockProps} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    });

    it('should handle swipe gestures on mobile', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const sidebar = screen.getByTestId('smart-sidebar');

      // Simulate swipe left gesture
      fireEvent.touchStart(sidebar, { touches: [{ clientX: 200, clientY: 100 }] });
      fireEvent.touchMove(sidebar, { touches: [{ clientX: 50, clientY: 100 }] });
      fireEvent.touchEnd(sidebar, { changedTouches: [{ clientX: 50, clientY: 100 }] });

      expect(mockProps.onToggleCollapse).toHaveBeenCalled();
    });

    it('should show mobile navigation drawer', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      renderWithProviders(<SmartSidebar {...mockProps} />);

      expect(screen.getByTestId('mobile-drawer')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should render within performance threshold', async () => {
      const renderTime = await (testUtils as any).measureRenderTime(() => {
        renderWithProviders(<SmartSidebar {...mockProps} />);
      });

      expect(renderTime).toBeLessThan(100); // 100ms threshold
    });

    it('should virtualize long lists', () => {
      const manyPlayers = Array.from({ length: 1000 }, (_, i) =>
        generatePlayer({ id: `player-${i}`, name: `Player ${i}` })
      );
      const initialState = {
        tactics: {
          players: manyPlayers,
        },
      };

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="players" />, { initialState });

      // Only a subset should be rendered in DOM
      const renderedPlayers = screen.getAllByTestId('player-item');
      expect(renderedPlayers.length).toBeLessThan(100);
    });

    it('should debounce search input', async () => {
      const searchSpy = vi.fn();
      vi.mock('../../../hooks/useDebounce', () => ({
        useDebounce: (value: string, delay: number) => {
          searchSpy(value, delay);
          return value;
        },
      }));

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="formations" />);

      const searchInput = screen.getByPlaceholderText(/search formations/i);
      await user.type(searchInput, 'test');

      expect(searchSpy).toHaveBeenCalledWith('test', 300);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toHaveAttribute('role', 'navigation');
      expect(sidebar).toHaveAttribute('aria-label', 'Tactical sidebar navigation');

      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
      });
    });

    it('should support screen reader navigation', () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toHaveAttribute('aria-expanded', 'true');

      // When collapsed
      renderWithProviders(<SmartSidebar {...mockProps} isCollapsed={true} />);
      const collapsedSidebar = screen.getByTestId('smart-sidebar');
      expect(collapsedSidebar).toHaveAttribute('aria-expanded', 'false');
    });

    it('should announce state changes', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
      await user.click(toggleButton);

      const announcement = screen.getByTestId('screen-reader-announcement');
      expect(announcement).toHaveTextContent(/sidebar collapsed/i);
    });

    it('should have proper focus management', async () => {
      renderWithProviders(<SmartSidebar {...mockProps} />);

      const formationsTab = screen.getByRole('button', { name: /formations/i });
      formationsTab.focus();

      // Focus should be visible
      expect(formationsTab).toHaveFocus();
      expect(formationsTab).toHaveClass('focus-visible');
    });

    it('should support high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithProviders(<SmartSidebar {...mockProps} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toHaveClass('high-contrast');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', () => {
      const initialState = {
        tactics: {
          formations: undefined,
          players: null,
        },
        challenges: null,
      };

      expect(() => {
        renderWithProviders(<SmartSidebar {...mockProps} />, { initialState });
      }).not.toThrow();

      expect(screen.getByTestId('smart-sidebar')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(<SmartSidebar {...mockProps} activeTab="formations" />);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error loading formations/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should recover from component errors', () => {
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false);

        if (hasError) {
          return <div data-testid="error-fallback">Something went wrong</div>;
        }

        return <>{children}</>;
      };

      renderWithProviders(
        <ErrorBoundary>
          <SmartSidebar {...mockProps} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('smart-sidebar')).toBeInTheDocument();
      expect(screen.queryByTestId('error-fallback')).not.toBeInTheDocument();
    });
  });
});
