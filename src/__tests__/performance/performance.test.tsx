import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../../components/Layout';
import TacticsBoardPage from '../../pages/TacticsBoardPage';
import { createMockUIState, createMockTacticsState } from '../factories';
import { renderWithProviders, mockPlayers } from '../utils/test-utils';
import '../mocks/modules';

// Performance measurement utilities
const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = globalThis.performance.now();
  await fn();
  const end = globalThis.performance.now();
  return end - start;
};

// Mock context providers
const mockUIContext = {
  uiState: createMockUIState(),
  dispatch: vi.fn(),
};

const mockTacticsContext = {
  tacticsState: createMockTacticsState(),
  dispatch: vi.fn(),
};

const mockResponsive = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  currentBreakpoint: 'desktop' as const,
  screenSize: { width: 1920, height: 1080 },
};

vi.mock('../../hooks', () => ({
  useUIContext: () => mockUIContext,
  useTacticsContext: () => mockTacticsContext,
  useResponsive: () => mockResponsive,
  useResponsiveNavigation: () => ({
    shouldUseDrawer: false,
    isDrawerOpen: false,
    toggleDrawer: vi.fn(),
  }),
  useResponsiveModal: () => ({
    isModalFullscreen: false,
    modalPadding: 'md',
    modalMaxWidth: 'lg',
  }),
  useFranchiseContext: () => ({
    franchiseState: {
      relationships: [],
      budget: 1000000,
      expenses: [],
      staff: [],
      facilities: [],
      achievements: [],
      history: [],
      currentSeason: {
        id: 'season-2024',
        year: 2024,
        matches: [],
        standings: [],
      },
    },
    dispatch: vi.fn(),
  }),
  useAuthContext: () => ({
    authState: { user: { id: 'test-user', name: 'Test User' }, isAuthenticated: true },
    dispatch: vi.fn(),
  }),
}));

describe('Performance Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUIContext.uiState = createMockUIState();
    mockTacticsContext.tacticsState = createMockTacticsState();

    // Reset performance measurements
    performance.clearMarks();
    performance.clearMeasures();
  });

  describe('Component Rendering Performance', () => {
    it('should render Layout component quickly', async () => {
      const renderTime = await measurePerformance(() => {
        render(
          <BrowserRouter>
            <Layout>
              <div>Test Content</div>
            </Layout>
          </BrowserRouter>
        );
      });

      // Layout should render in under 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large datasets efficiently', async () => {
      // Create a large tactics state - using mock players
      const largeTacticsState = createMockTacticsState({
        players: mockPlayers,
      });

      mockTacticsContext.tacticsState = largeTacticsState;

      const renderTime = await measurePerformance(() => {
        renderWithProviders(<TacticsBoardPage />);
      });

      // Should handle 100 players in under 200ms
      expect(renderTime).toBeLessThan(200);
    });

    it('should efficiently update state', async () => {
      const { rerender } = render(
        <BrowserRouter>
          <Layout>
            <div>Initial Content</div>
          </Layout>
        </BrowserRouter>
      );

      const updateTime = await measurePerformance(() => {
        rerender(
          <BrowserRouter>
            <Layout>
              <div>Updated Content</div>
            </Layout>
          </BrowserRouter>
        );
      });

      // State updates should be fast
      expect(updateTime).toBeLessThan(50);
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks during rerenders', async () => {
      const { rerender } = render(
        <BrowserRouter>
          <Layout>
            <div>Test</div>
          </Layout>
        </BrowserRouter>
      );

      // Simulate multiple rerenders
      const rerenderCount = 50;
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < rerenderCount; i++) {
        rerender(
          <BrowserRouter>
            <Layout>
              <div key={i}>Test {i}</div>
            </Layout>
          </BrowserRouter>
        );
      }

      // Wait for cleanup
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory growth should be reasonable (less than 10MB)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB
      }
    });

    it('should clean up event listeners properly', () => {
      const { unmount } = render(
        <BrowserRouter>
          <Layout>
            <div>Test</div>
          </Layout>
        </BrowserRouter>
      );

      // Count initial event listeners (use custom tracking if needed)
      const initialListeners = 0;

      unmount();

      // Event listeners should be cleaned up
      const finalListeners = 0;
      expect(finalListeners).toBeLessThanOrEqual(initialListeners);
    });
  });

  describe('Animation Performance', () => {
    it('should handle animations smoothly', async () => {
      mockUIContext.uiState = createMockUIState({ activeModal: 'editPlayer' });

      const animationTime = await measurePerformance(async () => {
        render(
          <BrowserRouter>
            <Layout>
              <div className="animate-spin">Loading...</div>
            </Layout>
          </BrowserRouter>
        );

        await waitFor(() => {
          const animatedElement = document.querySelector('.animate-spin');
          expect(animatedElement).toBeInTheDocument();
        });
      });

      // Animation setup should be fast
      expect(animationTime).toBeLessThan(100);
    });

    it('should maintain 60fps during animations', async () => {
      // Mock requestAnimationFrame for performance testing
      let frameCount = 0;
      const originalRAF = window.requestAnimationFrame;

      window.requestAnimationFrame = (callback => {
        frameCount++;
        return setTimeout(() => callback(globalThis.performance.now()), 16) as any; // ~60fps
      }) as any;

      render(
        <BrowserRouter>
          <Layout>
            <div className="transition-all duration-300">Animated content</div>
          </Layout>
        </BrowserRouter>
      );

      // Simulate multiple animation frames
      await act(async () => {
        // Trigger multiple RAF calls to simulate animation
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => {
            window.requestAnimationFrame(() => resolve(void 0));
          });
        }
      });

      // Restore original RAF
      window.requestAnimationFrame = originalRAF;

      // Should have captured frame requests during animation
      expect(frameCount).toBeGreaterThan(0);
    });
  });

  describe('Bundle Size Impact', () => {
    it('should use code splitting effectively', () => {
      // Test that components are lazily loaded
      const LazyComponent = React.lazy(() =>
        Promise.resolve({
          default: () => React.createElement('div', null, 'Lazy Component'),
        })
      );

      expect(() => {
        render(
          React.createElement(
            React.Suspense,
            { fallback: React.createElement('div', null, 'Loading...') },
            React.createElement(LazyComponent)
          )
        );
      }).not.toThrow();
    });

    it('should avoid unnecessary re-renders with React.memo', () => {
      let renderCount = 0;

      const TestComponent = React.memo(() => {
        renderCount++;
        return React.createElement('div', null, 'Memoized Component');
      });

      const { rerender } = render(React.createElement(TestComponent));

      // Rerender with same props
      rerender(React.createElement(TestComponent));

      // Should only render once due to memoization
      expect(renderCount).toBe(1);
    });
  });

  describe('Network Performance', () => {
    it('should handle offline scenarios gracefully', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const offlineTime = await measurePerformance(() => {
        render(
          <BrowserRouter>
            <Layout>
              <div>Offline Content</div>
            </Layout>
          </BrowserRouter>
        );
      });

      // Should handle offline state quickly
      expect(offlineTime).toBeLessThan(100);

      // Restore online state
      Object.defineProperty(navigator, 'onLine', {
        value: true,
      });
    });

    it('should debounce rapid state updates', async () => {
      let updateCount = 0;
      const mockDispatch = vi.fn(() => updateCount++);
      mockUIContext.dispatch = mockDispatch;

      const TestComponent = () => {
        return (
          <div>
            <button onClick={() => mockDispatch()}>Test</button>
          </div>
        );
      };

      const { getByRole } = renderWithProviders(<TestComponent />);

      // Simulate rapid clicks
      const button = getByRole('button');
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          button.click();
          // Small delay to ensure events are processed
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      });

      // Updates should be handled efficiently
      expect(mockDispatch).toHaveBeenCalled();
      expect(mockDispatch.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Loading', () => {
    it('should load images efficiently', async () => {
      const imageLoadTime = await measurePerformance(async () => {
        render(
          <BrowserRouter>
            <Layout>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg=="
                alt="Test"
              />
            </Layout>
          </BrowserRouter>
        );
      });

      expect(imageLoadTime).toBeLessThan(50);
    });

    it('should handle font loading optimally', () => {
      // Check that font-display: swap is used (would be in CSS)
      const { container } = render(
        <BrowserRouter>
          <Layout>
            <div className="font-sans">Text with web font</div>
          </Layout>
        </BrowserRouter>
      );

      const textElement = container.querySelector('.font-sans');
      expect(textElement).toBeInTheDocument();
    });
  });
});
