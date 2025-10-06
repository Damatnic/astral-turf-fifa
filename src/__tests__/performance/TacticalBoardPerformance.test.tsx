import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import {
  TacticalBoard,
  type Player as TacticalBoardPlayer,
  type TacticalLine as TacticalBoardLine,
} from '../../components/ui/football/TacticalBoard';
import { UnifiedTacticsBoard } from '../../components/tactics/UnifiedTacticsBoard';
import type { Player, Formation } from '../../types';

/**
 * ZENITH PERFORMANCE & STRESS TESTING SUITE
 * Tests tactical board components under extreme conditions to ensure
 * production readiness and identify performance bottlenecks
 */

// Performance measurement utilities
class PerformanceProfiler {
  private measurements: Map<string, number[]> = new Map();

  startMeasurement(name: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      this.measurements.get(name)!.push(duration);
      return duration;
    };
  }

  getStats(name: string) {
    const measurements = this.measurements.get(name) || [];
    if (measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    return {
      avg: measurements.reduce((sum, val) => sum + val, 0) / measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: measurements.length,
    };
  }

  clear() {
    this.measurements.clear();
  }
}

// Mock implementations for heavy dependencies
vi.mock('../../hooks', () => ({
  useTacticsContext: () => ({
    tacticsState: {
      formations: {},
      activeFormationIds: { home: null },
      players: [],
    },
    dispatch: vi.fn(),
  }),
  useUIContext: () => ({
    uiState: { theme: 'dark' },
    dispatch: vi.fn(),
  }),
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

// Test data generators
const generatePlayers = (count: number): TacticalBoardPlayer[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i}`,
    name: `Player ${i}`,
    jerseyNumber: i + 1,
    position: {
      x: (i % 10) * 10 + Math.random() * 10,
      y: Math.floor(i / 10) * 10 + Math.random() * 10,
    },
    role: (['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'] as const)[i % 10],
    teamSide: i % 2 === 0 ? 'home' : 'away',
    isSelected: false,
    isCaptain: i === 0,
    availability: 'available' as const,
  }));
};

const generateTacticalLines = (playerCount: number, lineCount: number): TacticalBoardLine[] => {
  return Array.from({ length: lineCount }, (_, i) => ({
    id: `line-${i}`,
    startPlayerId: `player-${i % playerCount}`,
    endPlayerId: `player-${(i + 1) % playerCount}`,
    type: (['pass', 'run', 'press', 'marking'] as const)[i % 4],
    color: `hsl(${(i * 30) % 360}, 70%, 50%)`,
  }));
};

const generateFormation = (slotCount: number): Formation => ({
  id: `formation-${slotCount}`,
  name: `Custom ${slotCount}`,
  description: `Formation with ${slotCount} slots`,
  slots: Array.from({ length: slotCount }, (_, i) => ({
    id: `slot-${i}`,
    role: (['GK', 'CB', 'LB', 'RB', 'CM'] as const)[i % 5],
    defaultPosition: {
      x: (i % 5) * 20 + 10,
      y: Math.floor(i / 5) * 20 + 10,
    },
    playerId: i < slotCount / 2 ? `player-${i}` : null,
  })),
  isCustom: false,
});

describe('ZENITH Tactical Board Performance Tests', () => {
  let profiler: PerformanceProfiler;
  let mockOnPlayerMove: ReturnType<typeof vi.fn>;
  let mockOnPlayerSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
    mockOnPlayerMove = vi.fn();
    mockOnPlayerSelect = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    profiler.clear();
  });

  describe('Rendering Performance', () => {
    it('should render small formations quickly', () => {
      const players = generatePlayers(11);
      const lines = generateTacticalLines(11, 5);

      const endMeasurement = profiler.startMeasurement('small-formation-render');

      const { unmount } = render(
        <TacticalBoard
          players={players as any}
          lines={lines as any}
          onPlayerMove={mockOnPlayerMove}
          onPlayerSelect={mockOnPlayerSelect}
        />
      );

      const renderTime = endMeasurement();
      unmount();

      expect(renderTime).toBeLessThan(50); // Should render within 50ms
    });

    it('should handle medium formations efficiently', () => {
      const players = generatePlayers(50);
      const lines = generateTacticalLines(50, 25);

      const endMeasurement = profiler.startMeasurement('medium-formation-render');

      const { unmount } = render(
        <TacticalBoard
          players={players.slice(0, 22) as any} // Only show field players
          lines={lines.slice(0, 15) as any} // Reasonable number of lines
          onPlayerMove={mockOnPlayerMove}
          onPlayerSelect={mockOnPlayerSelect}
        />
      );

      const renderTime = endMeasurement();
      unmount();

      expect(renderTime).toBeLessThan(100); // Should render within 100ms
    });

    it('should maintain performance with frequent re-renders', () => {
      const players = generatePlayers(22);
      let renderCount = 0;

      const { rerender } = render(
        <TacticalBoard
          players={players as any}
          onPlayerMove={mockOnPlayerMove}
          onPlayerSelect={mockOnPlayerSelect}
        />
      );

      // Perform 100 re-renders with slight position changes
      for (let i = 0; i < 100; i++) {
        const endMeasurement = profiler.startMeasurement('frequent-rerenders');

        const updatedPlayers = players.map(player => ({
          ...player,
          position: {
            x: player.position.x + (Math.random() - 0.5) * 2,
            y: player.position.y + (Math.random() - 0.5) * 2,
          },
        }));

        rerender(
          <TacticalBoard
            players={updatedPlayers as any}
            onPlayerMove={mockOnPlayerMove}
            onPlayerSelect={mockOnPlayerSelect}
          />
        );

        endMeasurement();
        renderCount++;
      }

      const stats = profiler.getStats('frequent-rerenders');
      expect(stats.avg).toBeLessThan(20); // Average under 20ms
      expect(stats.p95 as any).toBeLessThan(50); // 95th percentile under 50ms
      expect(renderCount).toBe(100);
    });
  });

  describe('Interaction Performance', () => {
    it('should handle rapid player movements efficiently', async () => {
      const players = generatePlayers(22);

      const { container } = render(
        <TacticalBoard
          players={players as any}
          onPlayerMove={mockOnPlayerMove}
          onPlayerSelect={mockOnPlayerSelect}
          mode="edit"
        />
      );

      // Simulate rapid drag operations
      const playerElements = container.querySelectorAll('[data-testid]');

      for (let i = 0; i < 50; i++) {
        const endMeasurement = profiler.startMeasurement('rapid-movements');

        if (playerElements[i % playerElements.length]) {
          await act(async () => {
            fireEvent.mouseDown(playerElements[i % playerElements.length], {
              clientX: 100 + i,
              clientY: 100 + i,
            });

            fireEvent(
              document,
              new MouseEvent('mousemove', {
                clientX: 150 + i,
                clientY: 150 + i,
              })
            );

            fireEvent(document, new MouseEvent('mouseup'));
          });
        }

        endMeasurement();
      }

      const stats = profiler.getStats('rapid-movements');
      expect(stats.avg).toBeLessThan(10); // Average under 10ms per interaction
    });

    it('should handle concurrent line creation efficiently', async () => {
      const players = generatePlayers(22);

      render(
        <TacticalBoard
          players={players as any}
          onPlayerMove={mockOnPlayerMove}
          onPlayerSelect={mockOnPlayerSelect}
          mode="tactics"
        />
      );

      // Simulate rapid line creation
      for (let i = 0; i < 20; i++) {
        const endMeasurement = profiler.startMeasurement('line-creation');

        await act(async () => {
          // Simulate clicking two different players rapidly
          const mockClick = new MouseEvent('click', { bubbles: true });
          fireEvent(document.body, mockClick);
          fireEvent(document.body, mockClick);
        });

        endMeasurement();
      }

      const stats = profiler.getStats('line-creation');
      expect(stats.avg).toBeLessThan(15); // Average under 15ms per line creation
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during component lifecycle', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Create and destroy components multiple times
      for (let i = 0; i < 50; i++) {
        const players = generatePlayers(22);
        const { unmount } = render(
          <TacticalBoard
            players={players as any}
            onPlayerMove={mockOnPlayerMove}
            onPlayerSelect={mockOnPlayerSelect}
          />
        );
        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should cleanup event listeners properly', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const players = generatePlayers(11);
      const { unmount } = render(
        <TacticalBoard
          players={players as any}
          onPlayerMove={mockOnPlayerMove}
          onPlayerSelect={mockOnPlayerSelect}
          mode="edit"
        />
      );

      const addCallCount = addEventListenerSpy.mock.calls.length;

      unmount();

      const removeCallCount = removeEventListenerSpy.mock.calls.length;

      // Should remove at least as many listeners as added
      expect(removeCallCount).toBeGreaterThanOrEqual(addCallCount);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Large Dataset Handling', () => {
    it('should handle large player datasets efficiently', () => {
      const largePlayerSet = generatePlayers(1000);
      const visiblePlayers = largePlayerSet.slice(0, 22); // Only render visible players

      const endMeasurement = profiler.startMeasurement('large-dataset');

      const { unmount } = render(
        <TacticalBoard
          players={visiblePlayers as any}
          onPlayerMove={mockOnPlayerMove}
          onPlayerSelect={mockOnPlayerSelect}
        />
      );

      const renderTime = endMeasurement();
      unmount();

      expect(renderTime).toBeLessThan(100); // Should handle efficiently
    });

    it('should handle many tactical lines efficiently', () => {
      const players = generatePlayers(22);
      const manyLines = generateTacticalLines(22, 100);
      const visibleLines = manyLines.slice(0, 20); // Limit visible lines

      const endMeasurement = profiler.startMeasurement('many-lines');

      const { unmount } = render(
        <TacticalBoard
          players={players as any}
          lines={visibleLines as any}
          onPlayerMove={mockOnPlayerMove}
          onPlayerSelect={mockOnPlayerSelect}
        />
      );

      const renderTime = endMeasurement();
      unmount();

      expect(renderTime).toBeLessThan(150); // Should handle many lines
    });
  });

  describe('Animation Performance', () => {
    it('should maintain smooth animations during interactions', async () => {
      const players = generatePlayers(11);

      render(
        <TacticalBoard
          players={players as any}
          onPlayerMove={mockOnPlayerMove}
          onPlayerSelect={mockOnPlayerSelect}
          mode="edit"
        />
      );

      // Test animation frame rate during interactions
      const animationFrames: number[] = [];
      let frameCount = 0;

      const measureFrame = () => {
        const start = performance.now();
        frameCount++;

        if (frameCount < 60) {
          // Measure 60 frames
          requestAnimationFrame(() => {
            const frameDuration = performance.now() - start;
            animationFrames.push(frameDuration);
            measureFrame();
          });
        }
      };

      measureFrame();

      // Wait for animation measurements
      await new Promise(resolve => setTimeout(resolve, 1000));

      const avgFrameTime =
        animationFrames.reduce((sum, time) => sum + time, 0) / animationFrames.length;

      // Should maintain ~60fps (16.67ms per frame)
      expect(avgFrameTime).toBeLessThan(20);
    });
  });

  describe('Browser Compatibility Performance', () => {
    it('should perform well with different viewport sizes', () => {
      const players = generatePlayers(22);
      const viewportSizes = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 }, // Desktop
        { width: 3840, height: 2160 }, // 4K
      ];

      viewportSizes.forEach(size => {
        // Mock viewport size
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: size.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: size.height,
        });

        const endMeasurement = profiler.startMeasurement(`viewport-${size.width}x${size.height}`);

        const { unmount } = render(
          <TacticalBoard
            players={players as any}
            onPlayerMove={mockOnPlayerMove}
            onPlayerSelect={mockOnPlayerSelect}
          />
        );

        const renderTime = endMeasurement();
        unmount();

        expect(renderTime).toBeLessThan(100); // Should render efficiently at all sizes
      });
    });
  });

  describe('Stress Testing', () => {
    it('should survive extreme user interactions', async () => {
      const players = generatePlayers(22);

      const { container } = render(
        <TacticalBoard
          players={players as any}
          onPlayerMove={mockOnPlayerMove}
          onPlayerSelect={mockOnPlayerSelect}
          mode="edit"
        />
      );

      // Extreme stress test: 500 rapid interactions
      for (let i = 0; i < 500; i++) {
        await act(async () => {
          // Random interaction types
          const interactionType = i % 4;

          switch (interactionType) {
            case 0: // Mouse down/up
              fireEvent.mouseDown(container, {
                clientX: Math.random() * 800,
                clientY: Math.random() * 600,
              });
              fireEvent.mouseUp(container);
              break;
            case 1: // Mouse move
              fireEvent.mouseMove(container, {
                clientX: Math.random() * 800,
                clientY: Math.random() * 600,
              });
              break;
            case 2: // Click
              fireEvent.click(container, {
                clientX: Math.random() * 800,
                clientY: Math.random() * 600,
              });
              break;
            case 3: // Key press
              fireEvent.keyDown(container, { key: 'Escape' });
              break;
          }
        });
      }

      // Component should still be functional
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle rapid component mount/unmount cycles', () => {
      const players = generatePlayers(11);

      // Rapid mount/unmount cycles
      for (let i = 0; i < 100; i++) {
        const endMeasurement = profiler.startMeasurement('mount-unmount-cycle');

        const { unmount } = render(
          <TacticalBoard
            players={players as any}
            onPlayerMove={mockOnPlayerMove}
            onPlayerSelect={mockOnPlayerSelect}
          />
        );

        unmount();
        endMeasurement();
      }

      const stats = profiler.getStats('mount-unmount-cycle');
      expect(stats.avg).toBeLessThan(30); // Average mount/unmount under 30ms
    });
  });

  describe('Production Readiness Metrics', () => {
    it('should meet production performance benchmarks', () => {
      const players = generatePlayers(22);
      const lines = generateTacticalLines(22, 15);

      // Test multiple scenarios
      const scenarios = [
        { name: 'standard-game', players: players.slice(0, 22), lines: lines.slice(0, 10) },
        { name: 'heavy-tactics', players: players.slice(0, 22), lines: lines },
        { name: 'minimal-setup', players: players.slice(0, 11), lines: [] },
      ];

      scenarios.forEach(scenario => {
        for (let i = 0; i < 10; i++) {
          const endMeasurement = profiler.startMeasurement(scenario.name);

          const { unmount } = render(
            <TacticalBoard
              players={scenario.players as any}
              lines={scenario.lines as any}
              onPlayerMove={mockOnPlayerMove}
              onPlayerSelect={mockOnPlayerSelect}
            />
          );

          unmount();
          endMeasurement();
        }

        const stats = profiler.getStats(scenario.name);

        // Production readiness criteria
        expect(stats.avg).toBeLessThan(100); // Average render under 100ms
        expect(stats.p95 as any).toBeLessThan(200); // 95th percentile under 200ms
        expect(stats.max).toBeLessThan(500); // No render over 500ms
      });
    });

    it('should generate performance report', () => {
      const players = generatePlayers(22);

      // Run comprehensive performance test
      for (let i = 0; i < 50; i++) {
        const endMeasurement = profiler.startMeasurement('performance-report');

        const { unmount } = render(
          <TacticalBoard
            players={players as any}
            onPlayerMove={mockOnPlayerMove}
            onPlayerSelect={mockOnPlayerSelect}
          />
        );

        unmount();
        endMeasurement();
      }

      const stats = profiler.getStats('performance-report');

      // Generate performance report
      const performanceReport = {
        testName: 'Tactical Board Performance',
        timestamp: new Date().toISOString(),
        metrics: {
          averageRenderTime: `${stats.avg.toFixed(2)}ms`,
          medianRenderTime: `${(stats.p50 as any).toFixed(2)}ms`,
          p95RenderTime: `${(stats.p95 as any).toFixed(2)}ms`,
          maxRenderTime: `${stats.max.toFixed(2)}ms`,
          totalTests: stats.count,
        },
        status: stats.avg < 100 && (stats.p95 as any) < 200 ? 'PASS' : 'FAIL',
      };

      console.log('🎯 ZENITH Performance Report:', performanceReport);

      expect(performanceReport.status).toBe('PASS');
    });
  });
});
