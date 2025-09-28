import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, testUtils, performanceUtils } from '../utils/test-helpers';
import { generateFormation, generatePlayer, createTestDataSet } from '../utils/mock-generators';
import { UnifiedTacticsBoard } from '../../components/tactics/UnifiedTacticsBoard';
import { ModernField } from '../../components/tactics/ModernField';
import { PlayerToken } from '../../components/tactics/PlayerToken';
import type { Formation, Player } from '../../types';

// Mock performance-sensitive dependencies
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
      <div ref={ref} {...props}>{children}</div>
    )),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Tactics Board Performance Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Mock performance.now for consistent timing
    let mockTime = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      mockTime += 16; // Simulate 60fps
      return mockTime;
    });

    // Mock RAF for animation testing
    let rafCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });

    // Trigger RAF callbacks manually
    const triggerRAF = () => {
      const callbacks = [...rafCallbacks];
      rafCallbacks = [];
      callbacks.forEach(callback => callback(performance.now()));
    };

    (window as any).triggerRAF = triggerRAF;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering Performance', () => {
    it('should render UnifiedTacticsBoard within performance threshold', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
      };

      const benchmark = performanceUtils.createBenchmark(
        'UnifiedTacticsBoard render',
        () => {
          renderWithProviders(<UnifiedTacticsBoard />, { initialState });
        }
      );

      const results = await benchmark.run();

      expect(results.average).toBeLessThan(100); // 100ms average
      expect(results.max).toBeLessThan(200); // 200ms maximum
      expect(results.min).toBeLessThan(50); // 50ms minimum
    });

    it('should render large formations efficiently', async () => {
      // Create formation with maximum players
      const largeFormation = generateFormation({
        players: Array.from({ length: 30 }, () => generatePlayer()),
      });

      const initialState = {
        tactics: {
          currentFormation: largeFormation,
        },
      };

      const renderTime = await performanceUtils.measureRenderTime(() => {
        renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      });

      expect(renderTime).toBeLessThan(300); // 300ms for large formation
    });

    it('should handle rapid re-renders efficiently', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
      };

      const { rerender } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const positions = Array.from({ length: 100 }, (_, i) => ({
        x: i % 100,
        y: Math.floor(i / 100) * 10,
      }));

      const startTime = performance.now();

      for (const position of positions) {
        const updatedFormation = {
          ...formation,
          players: formation.players.map((player, index) => 
            index === 0 ? { ...player, ...position } : player
          ),
        };

        rerender(
          <UnifiedTacticsBoard />,
          {
            initialState: {
              tactics: {
                currentFormation: updatedFormation,
              },
            },
          }
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // 1 second for 100 updates
    });

    it('should maintain 60fps during animations', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Start animation timeline
      const animationButton = screen.getByRole('button', { name: /animation/i });
      await user.click(animationButton);

      const playButton = screen.getByRole('button', { name: /play/i });
      await user.click(playButton);

      // Measure frame rate during animation
      const frameCount = await testUtils.measureFrameRate(1000); // 1 second
      expect(frameCount).toBeGreaterThan(55); // Allow slight variance from 60fps
    });
  });

  describe('Interaction Performance', () => {
    it('should handle player selection within performance threshold', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const playerTokens = screen.getAllByTestId('player-token');
      
      const selectionBenchmark = performanceUtils.createBenchmark(
        'Player selection',
        async () => {
          await user.click(playerTokens[Math.floor(Math.random() * playerTokens.length)]);
        },
        50 // 50 iterations
      );

      const results = await selectionBenchmark.run();

      expect(results.average).toBeLessThan(20); // 20ms average
      expect(results.max).toBeLessThan(50); // 50ms maximum
    });

    it('should handle drag operations smoothly', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const playerToken = screen.getAllByTestId('player-token')[0];
      const field = screen.getByTestId('modern-field');

      // Measure drag operation performance
      const dragStart = performance.now();

      fireEvent.mouseDown(playerToken, { clientX: 100, clientY: 100 });
      fireEvent.dragStart(playerToken);

      // Simulate smooth drag with multiple intermediate positions
      for (let i = 0; i <= 10; i++) {
        const x = 100 + (i * 20);
        const y = 100 + (i * 10);
        fireEvent.dragOver(field, { clientX: x, clientY: y });
        
        // Trigger RAF to simulate smooth animation
        (window as any).triggerRAF();
      }

      fireEvent.drop(field, { clientX: 300, clientY: 200 });
      fireEvent.dragEnd(playerToken);

      const dragEnd = performance.now();
      const dragTime = dragEnd - dragStart;

      expect(dragTime).toBeLessThan(100); // 100ms for complete drag operation
    });

    it('should handle rapid user interactions without lag', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const playerTokens = screen.getAllByTestId('player-token');
      
      // Simulate rapid clicking
      const rapidClicks = async () => {
        for (let i = 0; i < 20; i++) {
          await user.click(playerTokens[i % playerTokens.length]);
          // Small delay to simulate rapid but realistic clicking
          await new Promise(resolve => setTimeout(resolve, 25));
        }
      };

      const startTime = performance.now();
      await rapidClicks();
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second

      // Verify no interactions were dropped
      const lastClickedPlayer = playerTokens[(20 - 1) % playerTokens.length];
      expect(lastClickedPlayer).toHaveClass('selected');
    });

    it('should handle complex multi-component interactions efficiently', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
          players: Array.from({ length: 50 }, () => generatePlayer()),
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const complexWorkflow = async () => {
        // 1. Switch tabs in sidebar
        const playersTab = screen.getByRole('button', { name: /players/i });
        await user.click(playersTab);

        // 2. Filter players
        const positionFilter = screen.getByRole('button', { name: /forwards/i });
        await user.click(positionFilter);

        // 3. Select player from list
        const playerList = screen.getAllByTestId('player-item')[0];
        await user.click(playerList);

        // 4. Switch to formation view
        const formationsTab = screen.getByRole('button', { name: /formations/i });
        await user.click(formationsTab);

        // 5. Change view mode
        const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
        await user.click(fullscreenButton);
      };

      const workflowTime = await performanceUtils.measureRenderTime(complexWorkflow);
      expect(workflowTime).toBeLessThan(500); // 500ms for complex workflow
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during component lifecycle', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
      };

      const initialMemory = performanceUtils.measureMemoryUsage();

      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
        unmount();
      }

      const finalMemory = performanceUtils.measureMemoryUsage();
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
      }
    });

    it('should handle large datasets without excessive memory usage', async () => {
      // Create large dataset
      const largeFormation = generateFormation({
        players: Array.from({ length: 100 }, () => generatePlayer()),
      });

      const initialState = {
        tactics: {
          currentFormation: largeFormation,
          formations: Array.from({ length: 50 }, () => generateFormation()),
          players: Array.from({ length: 500 }, () => generatePlayer()),
        },
      };

      const beforeMemory = performanceUtils.measureMemoryUsage();
      
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const afterMemory = performanceUtils.measureMemoryUsage();

      if (beforeMemory && afterMemory) {
        const memoryIncrease = afterMemory.usedJSHeapSize - beforeMemory.usedJSHeapSize;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB for large dataset
      }
    });

    it('should clean up event listeners properly', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
      };

      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const addedListeners = addEventListenerSpy.mock.calls.length;
      
      unmount();

      const removedListeners = removeEventListenerSpy.mock.calls.length;

      // Should remove at least as many listeners as were added
      expect(removedListeners).toBeGreaterThanOrEqual(addedListeners);
    });
  });

  describe('Component-Specific Performance', () => {
    it('should render ModernField efficiently with many players', async () => {
      const manyPlayers = Array.from({ length: 22 }, () => generatePlayer());
      const formation = generateFormation({ players: manyPlayers });

      const fieldProps = {
        formation,
        selectedPlayer: null,
        onPlayerMove: vi.fn(),
        onPlayerSelect: vi.fn(),
        isDragging: false,
        setIsDragging: vi.fn(),
        viewMode: 'standard' as const,
      };

      const renderTime = await performanceUtils.measureRenderTime(() => {
        renderWithProviders(<ModernField {...fieldProps} />);
      });

      expect(renderTime).toBeLessThan(150); // 150ms for field with 22 players
    });

    it('should render PlayerToken efficiently under stress', async () => {
      const player = generatePlayer();
      const playerProps = {
        player,
        position: { x: 50, y: 50 },
        isSelected: false,
        isDragging: false,
        isValid: true,
        onDragStart: vi.fn(),
        onDrag: vi.fn(),
        onDragEnd: vi.fn(),
        onSelect: vi.fn(),
        isMobile: false,
      };

      const stressTest = async () => {
        // Render many PlayerTokens
        const tokens = Array.from({ length: 30 }, (_, i) => (
          <PlayerToken
            key={i}
            {...playerProps}
            player={{ ...player, id: `player-${i}` }}
          />
        ));

        renderWithProviders(<div>{tokens}</div>);
      };

      const renderTime = await performanceUtils.measureRenderTime(stressTest);
      expect(renderTime).toBeLessThan(200); // 200ms for 30 player tokens
    });

    it('should handle sidebar filtering performance with large datasets', async () => {
      const manyPlayers = Array.from({ length: 1000 }, (_, i) => 
        generatePlayer({ id: `player-${i}`, name: `Player ${i}` })
      );

      const initialState = {
        tactics: {
          players: manyPlayers,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Switch to players tab
      const playersTab = screen.getByRole('button', { name: /players/i });
      await user.click(playersTab);

      // Measure search performance
      const searchInput = screen.getByPlaceholderText(/search players/i);
      
      const searchTime = await performanceUtils.measureRenderTime(async () => {
        await user.type(searchInput, 'Player 500');
      });

      expect(searchTime).toBeLessThan(100); // 100ms for search in 1000 players

      // Verify search results appear
      await waitFor(() => {
        expect(screen.getByText('Player 500')).toBeInTheDocument();
      });
    });
  });

  describe('Bundle Size and Load Performance', () => {
    it('should lazy load heavy components efficiently', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
      };

      // Initial render without heavy components
      const initialRender = await performanceUtils.measureRenderTime(() => {
        renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      });

      expect(initialRender).toBeLessThan(100); // Fast initial render

      // Load AI Assistant (heavy component)
      const aiButton = screen.getByRole('button', { name: /ai assistant/i });
      
      const lazyLoadTime = await performanceUtils.measureRenderTime(async () => {
        await user.click(aiButton);
        await waitFor(() => {
          expect(screen.getByTestId('intelligent-assistant')).toBeInTheDocument();
        });
      });

      expect(lazyLoadTime).toBeLessThan(300); // Lazy load within 300ms
    });

    it('should optimize re-renders with React.memo and useMemo', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
      };

      const MemoizedComponent = React.memo(UnifiedTacticsBoard);

      const { rerender } = renderWithProviders(<MemoizedComponent />, { initialState });

      // Re-render with same props (should be optimized)
      const optimizedRerenderTime = await performanceUtils.measureRenderTime(() => {
        rerender(<MemoizedComponent />, { initialState });
      });

      expect(optimizedRerenderTime).toBeLessThan(20); // Very fast optimized re-render

      // Re-render with different props (should re-render)
      const updatedFormation = { ...formation, name: 'Updated Formation' };
      const newState = {
        tactics: {
          currentFormation: updatedFormation,
        },
      };

      const normalRerenderTime = await performanceUtils.measureRenderTime(() => {
        rerender(<MemoizedComponent />, { initialState: newState });
      });

      expect(normalRerenderTime).toBeGreaterThan(optimizedRerenderTime);
      expect(normalRerenderTime).toBeLessThan(100); // Still fast normal re-render
    });
  });

  describe('Concurrent Features Performance', () => {
    it('should handle multiple simultaneous operations efficiently', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Start multiple operations simultaneously
      const simultaneousOperations = async () => {
        const promises = [
          // Operation 1: Player selection
          user.click(screen.getAllByTestId('player-token')[0]),
          
          // Operation 2: Sidebar tab change
          user.click(screen.getByRole('button', { name: /analytics/i })),
          
          // Operation 3: View mode change
          user.click(screen.getByRole('button', { name: /fullscreen/i })),
          
          // Operation 4: Open quick actions
          user.click(screen.getByRole('button', { name: /export/i })),
        ];

        await Promise.all(promises);
      };

      const concurrentTime = await performanceUtils.measureRenderTime(simultaneousOperations);
      expect(concurrentTime).toBeLessThan(200); // Handle concurrent operations efficiently
    });

    it('should maintain performance during live collaboration', async () => {
      const formation = generateFormation();
      const initialState = {
        tactics: {
          currentFormation: formation,
        },
        collaboration: {
          activeSession: {
            id: 'session-1',
            participants: Array.from({ length: 5 }, (_, i) => ({
              id: `user-${i}`,
              name: `User ${i}`,
              isOnline: true,
            })),
          },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Simulate receiving real-time updates
      const simulateRealTimeUpdates = async () => {
        for (let i = 0; i < 10; i++) {
          // Simulate receiving cursor updates from other users
          const event = new CustomEvent('collaboration-update', {
            detail: {
              type: 'cursor',
              userId: `user-${i % 5}`,
              position: { x: Math.random() * 100, y: Math.random() * 100 },
            },
          });
          
          window.dispatchEvent(event);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      };

      const collaborationTime = await performanceUtils.measureRenderTime(simulateRealTimeUpdates);
      expect(collaborationTime).toBeLessThan(600); // 600ms for 10 real-time updates
    });
  });
});