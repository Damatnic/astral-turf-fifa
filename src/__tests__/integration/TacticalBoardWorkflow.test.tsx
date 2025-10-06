import React from 'react';
import { screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, mockCanvas, mockDragAndDrop } from '../utils/test-helpers';
import {
  generateTacticalFormation,
  generatePlayerForConflict,
  generatePerformanceTestData,
  generateDrawingShape,
} from '../utils/enhanced-mock-generators';
import { UnifiedTacticsBoard } from '../../components/tactics/UnifiedTacticsBoard';
import type { RootState } from '../../types';

// Mock heavy dependencies for integration testing
vi.mock('../../components/tactics/IntelligentAssistant', () => ({
  default: () => <div data-testid="intelligent-assistant">AI Assistant</div>,
}));

vi.mock('../../components/tactics/FormationTemplates', () => ({
  default: () => <div data-testid="formation-templates">Formation Templates</div>,
}));

vi.mock('../../components/analytics/AdvancedAnalyticsDashboard', () => ({
  default: () => <div data-testid="analytics-dashboard">Analytics Dashboard</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
}));

describe('Tactical Board Workflow Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockFormation: any;
  let mockPlayers: any[];
  let initialState: Partial<RootState>;

  beforeEach(() => {
    user = userEvent.setup();

    // Generate comprehensive test data
    mockFormation = generateTacticalFormation('4-4-2');
    mockPlayers = Array.from({ length: 20 }, (_, i) => {
      const roles = ['gk', 'cb', 'fb', 'cm', 'dm', 'am', 'w', 'cf'];
      return {
        ...generatePlayerForConflict(i < 2 ? 'GK' : i < 8 ? 'DF' : i < 14 ? 'MF' : 'FW'),
        roleId: roles[i % roles.length],
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
      };
    });

    // Assign 11 players to formation
    mockFormation.slots.forEach((slot: any, index: number) => {
      if (index < 11) {
        slot.playerId = mockPlayers[index].id;
      }
    });

    initialState = {
      tactics: {
        players: mockPlayers,
        formations: { [mockFormation.id]: mockFormation },
        activeFormationIds: { home: mockFormation.id, away: '' },
        teamTactics: {
          home: {
            mentality: 'balanced',
            pressing: 'medium',
            defensiveLine: 'medium',
            attackingWidth: 'medium',
          },
          away: {
            mentality: 'balanced',
            pressing: 'medium',
            defensiveLine: 'medium',
            attackingWidth: 'medium',
          },
        },
        drawings: [],
        tacticalFamiliarity: {},
        chemistry: {},
        captainIds: { home: null, away: null },
        setPieceTakers: { home: {}, away: {} },
      },
      ui: {
        theme: 'dark',
        activeTeamContext: 'home',
        drawingTool: 'select',
        drawingColor: '#ffffff',
        isGridVisible: false,
        isFormationStrengthVisible: false,
        positioningMode: 'snap',
        selectedPlayerId: null,
        isAnimating: false,
        playerDisplayConfig: {
          showNames: true,
          showNumbers: true,
          showStats: false,
          showStamina: true,
          showMorale: true,
          showAvailability: true,
          iconType: 'circle',
          namePosition: 'below',
          size: 'medium',
        },
      },
    } as any;

    mockCanvas();
    mockDragAndDrop();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete User Workflows', () => {
    it('executes complete formation setup workflow', async () => {
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // 1. Verify initial rendering
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
      expect(screen.getByTestId('modern-field')).toBeInTheDocument();
      expect(screen.getByTestId('unified-floating-toolbar')).toBeInTheDocument();

      // 2. Check formation is loaded
      await waitFor(() => {
        expect(screen.getByText(mockFormation.name)).toBeInTheDocument();
      });

      // 3. Verify players are rendered on field
      const playerTokens = screen.getAllByTestId(/player-token/);
      expect(playerTokens).toHaveLength(11); // Starting 11

      // 4. Check bench shows remaining players
      const benchPlayers = screen.getAllByTestId('position-group-player');
      expect(benchPlayers.length).toBeGreaterThan(0);

      // 5. Test formation info display
      expect(screen.getByText('11/11')).toBeInTheDocument(); // All slots filled
    });

    it('handles player selection and movement workflow', async () => {
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // 1. Select a player by clicking
      const playerTokens = screen.getAllByTestId(/player-token/);
      const firstPlayer = playerTokens[0];

      await user.click(firstPlayer);

      // 2. Verify player is selected
      await waitFor(() => {
        expect(firstPlayer).toHaveAttribute('data-selected', 'true');
      });

      // 3. Check floating toolbar shows selected player info
      expect(screen.getByText('Player 1')).toBeInTheDocument();

      // 4. Move player by clicking field
      const field = screen.getByTestId('modern-field');
      await user.click(field);

      // 5. Verify position change is reflected
      await waitFor(() => {
        // Player position should have updated
        expect(firstPlayer).toHaveStyle({
          transform: expect.stringContaining('translate'),
        });
      });
    });

    it('completes drag and drop player management workflow', async () => {
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // 1. Expand bench to see substitute players
      const benchHeader = screen.getByRole('button', { name: /forwards/i });
      await user.click(benchHeader);

      await waitFor(() => {
        expect(screen.getAllByTestId('position-group-player')).toHaveLength(9); // 9 bench players
      });

      // 2. Initiate drag from bench
      const benchPlayers = screen.getAllByTestId('position-group-player');
      const benchPlayer = benchPlayers[0];

      fireEvent.dragStart(benchPlayer);

      // 3. Verify drag state
      expect(benchPlayer).toHaveClass('opacity-50');

      // 4. Drop on field
      const field = screen.getByTestId('modern-field');
      fireEvent.dragOver(field, { clientX: 500, clientY: 400 });
      fireEvent.drop(field, { clientX: 500, clientY: 400 });

      // 5. Verify player is now on field
      await waitFor(() => {
        const updatedFieldPlayers = screen.getAllByTestId(/player-token/);
        expect(updatedFieldPlayers).toHaveLength(12); // One more player on field
      });
    });

    it('executes tactical drawing workflow', async () => {
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // 1. Select arrow drawing tool
      const arrowTool = screen.getByRole('button', { name: /arrow/i });
      await user.click(arrowTool);

      // 2. Verify tool is selected
      expect(arrowTool).toHaveClass('bg-blue-500');

      // 3. Draw arrow on field
      const field = screen.getByTestId('modern-field');

      fireEvent.mouseDown(field, { clientX: 200, clientY: 200 });
      fireEvent.mouseMove(field, { clientX: 300, clientY: 250 });
      fireEvent.mouseUp(field, { clientX: 300, clientY: 250 });

      // 4. Verify drawing appears
      await waitFor(() => {
        expect(screen.getByTestId('tactical-drawings')).toBeInTheDocument();
      });

      // 5. Check drawing counter updates
      expect(screen.getByText('1 shape')).toBeInTheDocument();

      // 6. Test undo functionality
      const undoButton = screen.getByRole('button', { name: /undo last drawing/i });
      await user.click(undoButton);

      // 7. Verify drawing is removed
      await waitFor(() => {
        expect(screen.queryByText(/shape/)).not.toBeInTheDocument();
      });
    });

    it('handles view mode transitions workflow', async () => {
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // 1. Test grid toggle
      const gridToggle = screen.getByRole('button', { name: /toggle grid/i });
      await user.click(gridToggle);

      expect(gridToggle).toHaveClass('bg-blue-500');

      // 2. Test fullscreen mode
      const fullscreenButton = screen.getByRole('button', { name: /enter fullscreen/i });
      await user.click(fullscreenButton);

      await waitFor(() => {
        const board = screen.getByTestId('unified-tactics-board');
        expect(board).toHaveAttribute('data-view-mode', 'fullscreen');
      });

      // 3. Test positioning mode toggle
      const positioningMode = screen.getByRole('button', { name: /positioning mode/i });
      await user.click(positioningMode);

      expect(screen.getByRole('button', { name: /free movement/i })).toBeInTheDocument();

      // 4. Test formation strength view
      const strengthToggle = screen.getByRole('button', { name: /formation strength/i });
      await user.click(strengthToggle);

      expect(strengthToggle).toHaveClass('bg-blue-500');
    });

    it('manages player display settings workflow', async () => {
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // 1. Open player display settings
      const displayButton = screen.getByRole('button', { name: /display/i });
      await user.click(displayButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      // 2. Toggle player names off
      const namesToggle = screen.getByTestId('toggle-showNames');
      await user.click(namesToggle);

      // 3. Verify player names disappear
      await waitFor(() => {
        expect(screen.queryByText('Player 1')).not.toBeInTheDocument();
      });

      // 4. Change icon type to jersey
      const jerseyButton = screen.getByRole('button', { name: 'Jersey' });
      await user.click(jerseyButton);

      // 5. Verify jersey icons appear
      await waitFor(() => {
        expect(screen.getAllByTestId('jersey-icon')).toHaveLength(11);
      });

      // 6. Change token size to large
      const largeButton = screen.getByRole('button', { name: 'Large' });
      await user.click(largeButton);

      // 7. Verify larger tokens
      const avatars = screen.getAllByTestId('player-avatar');
      avatars.forEach(avatar => {
        expect(avatar).toHaveClass('w-16', 'h-16');
      });
    });

    it('handles complex multi-component interaction workflow', async () => {
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // 1. Select multiple players with Ctrl+Click
      const playerTokens = screen.getAllByTestId(/player-token/);

      await user.click(playerTokens[0]);
      await user.keyboard('[ControlLeft>]');
      await user.click(playerTokens[1]);
      await user.keyboard('[/ControlLeft]');

      // 2. Both players should be selected
      expect(playerTokens[0]).toHaveAttribute('data-selected', 'true');
      expect(playerTokens[1]).toHaveAttribute('data-selected', 'true');

      // 3. Switch to zone drawing tool and draw tactical zone
      const zoneTool = screen.getByRole('button', { name: /zone/i });
      await user.click(zoneTool);

      const field = screen.getByTestId('modern-field');

      // Draw rectangular zone around selected players
      fireEvent.mouseDown(field, { clientX: 150, clientY: 150 });
      fireEvent.mouseMove(field, { clientX: 350, clientY: 250 });
      fireEvent.mouseUp(field, { clientX: 350, clientY: 250 });

      // 4. Open sidebar and verify player information
      const sidebarToggle = screen.getByRole('button', { name: /toggle right sidebar/i });
      await user.click(sidebarToggle);

      await waitFor(() => {
        expect(screen.getByTestId('right-sidebar')).toHaveClass('expanded');
      });

      // 5. Switch to bench tab and manage substitutions
      const benchTab = screen.getByRole('tab', { name: /bench/i });
      await user.click(benchTab);

      // 6. Expand midfielder group in bench
      const midfielderHeader = screen.getByRole('button', { name: /midfielders/i });
      await user.click(midfielderHeader);

      // 7. Select bench player for substitution
      await waitFor(() => {
        const benchPlayers = screen.getAllByTestId('position-group-player');
        expect(benchPlayers.length).toBeGreaterThan(0);
      });

      // 8. Test animation controls
      const playButton = screen.getByRole('button', { name: /play animation/i });
      expect(playButton).toBeInTheDocument();

      // 9. Clear all drawings and reset
      const clearButton = screen.getByRole('button', { name: /clear all drawings/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByTestId('tactical-drawings')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Stress Testing', () => {
    it('handles large dataset workflows efficiently', async () => {
      const largeDataset = generatePerformanceTestData.large();
      const stressTestState = {
        ...initialState,
        tactics: {
          ...initialState.tactics!,
          players: largeDataset.players,
          formations: Object.fromEntries(largeDataset.formations.map(f => [f.id, f])),
          drawings: largeDataset.drawings,
        },
      };

      const renderStart = performance.now();
      renderWithProviders(<UnifiedTacticsBoard />, { initialState: stressTestState });
      const renderTime = performance.now() - renderStart;

      // Should render within performance threshold
      expect(renderTime).toBeLessThan(2000);

      // Should still be functional
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();

      // Test interaction performance
      const interactionStart = performance.now();
      const playerTokens = screen.getAllByTestId(/player-token/);
      if (playerTokens.length > 0) {
        await user.click(playerTokens[0]);
      }
      const interactionTime = performance.now() - interactionStart;

      expect(interactionTime).toBeLessThan(100);
    });

    it('maintains responsiveness during rapid interactions', async () => {
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const field = screen.getByTestId('modern-field');

      // Rapid clicking should not break the interface
      for (let i = 0; i < 20; i++) {
        fireEvent.click(field, {
          clientX: 200 + i * 10,
          clientY: 200 + i * 5,
        });
      }

      // Interface should remain responsive
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();

      // Should be able to interact normally
      const playerTokens = screen.getAllByTestId(/player-token/);
      await user.click(playerTokens[0]);

      expect(playerTokens[0]).toHaveAttribute('data-selected', 'true');
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('recovers gracefully from component errors', async () => {
      // Simulate an error by providing malformed data
      const errorState = {
        ...initialState,
        tactics: {
          ...initialState.tactics!,
          players: [{ id: null, name: null }] as any,
          formations: { invalid: null } as any,
        },
      };

      expect(() => {
        renderWithProviders(<UnifiedTacticsBoard />, { initialState: errorState });
      }).not.toThrow();

      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
    });

    it('handles empty state gracefully', async () => {
      const emptyState = {
        ...initialState,
        tactics: {
          ...initialState.tactics!,
          players: [],
          formations: {},
          drawings: [],
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState: emptyState });

      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
      expect(screen.getByText('No bench players available')).toBeInTheDocument();
    });

    it('maintains state consistency during complex operations', async () => {
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Perform multiple operations simultaneously
      const operations = [
        () => user.click(screen.getByRole('button', { name: /toggle grid/i })),
        () => user.click(screen.getAllByTestId(/player-token/)[0]),
        () => user.click(screen.getByRole('button', { name: /arrow/i })),
        () => user.click(screen.getByRole('button', { name: /toggle right sidebar/i })),
      ];

      // Execute all operations rapidly
      await Promise.all(operations.map(op => op()));

      // State should remain consistent
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();

      // All changes should be reflected
      expect(screen.getByRole('button', { name: /toggle grid/i })).toHaveClass('bg-blue-500');
      expect(screen.getByRole('button', { name: /arrow/i })).toHaveClass('bg-blue-500');
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains accessibility standards across workflow', async () => {
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Tab navigation should work throughout the interface
      await user.tab(); // First interactive element
      expect(document.activeElement).toHaveAttribute('tabindex');

      // Continue tabbing through key elements
      for (let i = 0; i < 10; i++) {
        await user.tab();
        const focused = document.activeElement;
        if (focused && focused !== document.body) {
          expect(focused).toHaveAttribute('aria-label');
        }
      }

      // Screen reader announcements should work
      const playerTokens = screen.getAllByTestId(/player-token/);
      await user.click(playerTokens[0]);

      expect(screen.getByTestId('sr-announcer')).toHaveTextContent(/selected/i);

      // Keyboard shortcuts should work
      fireEvent.keyDown(document, { key: 'v' });
      expect(screen.getByRole('button', { name: /select/i })).toHaveClass('bg-blue-500');
    });

    it('supports high contrast and reduced motion preferences', () => {
      // Mock accessibility preferences
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches:
            query.includes('prefers-contrast: high') ||
            query.includes('prefers-reduced-motion: reduce'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const board = screen.getByTestId('unified-tactics-board');
      expect(board).toHaveClass('high-contrast', 'reduced-motion');
    });
  });

  describe('Mobile Responsiveness Integration', () => {
    it('adapts entire workflow for mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true });
      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const board = screen.getByTestId('unified-tactics-board');
      expect(board).toHaveClass('mobile-responsive');

      // Touch interactions should work
      const playerTokens = screen.getAllByTestId(/player-token/);
      fireEvent.touchStart(playerTokens[0]);
      fireEvent.touchEnd(playerTokens[0]);

      expect(playerTokens[0]).toHaveAttribute('data-selected', 'true');

      // Mobile-specific helpers should appear
      expect(screen.getByText(/tap field to move/i)).toBeInTheDocument();
    });
  });
});
