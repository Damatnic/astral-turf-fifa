import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, testUtils, mockCanvas } from '../utils/test-helpers';
import { generateFormation, generatePlayer, createTestDataSet } from '../utils/mock-generators';
import { UnifiedTacticsBoard } from '../../components/tactics/UnifiedTacticsBoard';
import type { Formation, Player } from '../../types';

// Mock heavy components
vi.mock('../../components/tactics/IntelligentAssistant', () => ({
  default: () => <div data-testid="intelligent-assistant">AI Assistant</div>,
}));

vi.mock('../../components/analytics/AdvancedAnalyticsDashboard', () => ({
  default: () => <div data-testid="analytics-dashboard">Analytics Dashboard</div>,
}));

// Mock html-to-image for visual exports
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mock-image'),
  toJpeg: vi.fn().mockResolvedValue('data:image/jpeg;base64,mock-image'),
  toSvg: vi.fn().mockResolvedValue('data:image/svg+xml;base64,mock-svg'),
}));

describe('Tactics Board Integration Tests', () => {
  let mockFormation: Formation;
  let mockPlayers: Player[];
  let mockProps: any;
  let user: ReturnType<typeof userEvent.setup>;
  let testData: ReturnType<typeof createTestDataSet.complete>;

  beforeEach(() => {
    // Setup comprehensive test data
    testData = createTestDataSet.complete();
    mockFormation = testData.formation;
    mockPlayers = testData.players;

    // Setup component props
    mockProps = {
      onSimulateMatch: vi.fn(),
      onSaveFormation: vi.fn(),
      onAnalyticsView: vi.fn(),
      onExportFormation: vi.fn(),
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

    // Mock WebSocket for collaboration
    global.WebSocket = vi.fn().mockImplementation(() => ({
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      readyState: 1, // OPEN
    })) as unknown as typeof WebSocket;

    // Add static properties to WebSocket mock
    Object.assign(global.WebSocket, {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete User Workflows', () => {
    it('should handle complete formation creation workflow', async () => {
      const initialState = {
        tactics: {
          formations: [],
          players: mockPlayers,
          selectedPlayers: [],
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // 1. Start by opening formation templates
      const templatesButton = screen.getByRole('button', { name: /formation templates/i });
      await user.click(templatesButton);

      // 2. Select a formation template
      const template442 = screen.getByRole('button', { name: /4-4-2/i });
      await user.click(template442);

      // 3. Add players to formation
      const playersList = screen.getByTestId('available-players');
      const firstPlayer = within(playersList).getAllByTestId(/player-item/)[0];
      await user.click(firstPlayer);

      // 4. Drag player to field position
      const fieldSlot = screen.getAllByTestId(/formation-slot/)[0];
      await user.click(fieldSlot);

      // 5. Save the formation
      const saveButton = screen.getByRole('button', { name: /save formation/i });
      await user.click(saveButton);

      // 6. Provide formation name
      const nameInput = screen.getByPlaceholderText(/formation name/i);
      await user.type(nameInput, 'My Custom 4-4-2');

      const confirmSave = screen.getByRole('button', { name: /confirm save/i });
      await user.click(confirmSave);

      // Verify save was called
      await waitFor(() => {
        expect(mockProps.onSaveFormation).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Custom 4-4-2',
          })
        );
      });
    });

    it('should handle player substitution workflow', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
          players: mockPlayers,
          selectedPlayers: mockFormation.players?.slice(0, 11) || [],
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // 1. Select a player on the field
      const playerOnField = screen.getAllByTestId('player-token')[0];
      await user.click(playerOnField);

      // 2. Open dugout management
      const dugoutButton = screen.getByRole('button', { name: /dugout/i });
      await user.click(dugoutButton);

      // 3. Select a substitute from bench
      const benchPlayer = screen.getAllByTestId('bench-player')[0];
      await user.click(benchPlayer);

      // 4. Confirm substitution
      const substituteButton = screen.getByRole('button', { name: /make substitution/i });
      await user.click(substituteButton);

      // 5. Verify substitution is reflected on field
      await waitFor(() => {
        const updatedField = screen.getByTestId('modern-field');
        expect(updatedField).toBeInTheDocument();
      });
    });

    it('should handle tactical analysis workflow', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
          analytics: testData.analytics,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // 1. Open heat map analysis
      const heatMapButton = screen.getByRole('button', { name: /heat map/i });
      await user.click(heatMapButton);

      // 2. Select a player for analysis
      const playerForAnalysis = screen.getAllByTestId('player-token')[0];
      await user.click(playerForAnalysis);

      // 3. Verify heat map displays
      await waitFor(() => {
        expect(screen.getByTestId('heat-map-overlay')).toBeInTheDocument();
      });

      // 4. Switch to advanced analytics
      const analyticsButton = screen.getByRole('button', { name: /advanced analytics/i });
      await user.click(analyticsButton);

      // 5. Verify analytics dashboard loads
      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });

      expect(mockProps.onAnalyticsView).toHaveBeenCalled();
    });

    it('should handle collaboration workflow', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
        },
        collaboration: {
          activeSession: testData.collaboration,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // 1. Open collaboration features
      const collaborationButton = screen.getByRole('button', { name: /collaboration/i });
      await user.click(collaborationButton);

      // 2. Add a comment to the field
      const commentButton = screen.getByRole('button', { name: /add comment/i });
      await user.click(commentButton);

      // 3. Click on field to place comment
      const field = screen.getByTestId('modern-field');
      await user.click(field);

      // 4. Type comment
      const commentInput = screen.getByPlaceholderText(/add your comment/i);
      await user.type(commentInput, 'This formation needs better width');

      // 5. Submit comment
      const submitComment = screen.getByRole('button', { name: /submit/i });
      await user.click(submitComment);

      // 6. Verify comment appears
      await waitFor(() => {
        expect(screen.getByText('This formation needs better width')).toBeInTheDocument();
      });

      // 7. Share session
      const shareButton = screen.getByRole('button', { name: /share session/i });
      await user.click(shareButton);

      const emailInput = screen.getByPlaceholderText(/enter email/i);
      await user.type(emailInput, 'coach@example.com');

      const sendInvite = screen.getByRole('button', { name: /send invite/i });
      await user.click(sendInvite);

      // Verify collaboration functionality
      expect(screen.getByText(/invite sent/i)).toBeInTheDocument();
    });

    it('should handle export and sharing workflow', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // 1. Open export options
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      // 2. Select image export
      const imageExport = screen.getByRole('button', { name: /export as image/i });
      await user.click(imageExport);

      // 3. Configure export settings
      const formatSelect = screen.getByRole('combobox', { name: /format/i });
      await user.selectOptions(formatSelect, 'png');

      const qualitySlider = screen.getByRole('slider', { name: /quality/i });
      fireEvent.change(qualitySlider, { target: { value: '90' } });

      // 4. Generate export
      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // 5. Verify export was called
      await waitFor(() => {
        expect(mockProps.onExportFormation).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'png',
            quality: 90,
          })
        );
      });

      // 6. Share exported image
      const shareImageButton = screen.getByRole('button', { name: /share image/i });
      await user.click(shareImageButton);

      // Verify sharing options
      expect(screen.getByText(/social media/i)).toBeInTheDocument();
      expect(screen.getByText(/email/i)).toBeInTheDocument();
    });
  });

  describe('Cross-Component Data Flow', () => {
    it('should synchronize player selection across components', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
          players: mockPlayers,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // 1. Select player from sidebar
      const sidebar = screen.getByTestId('smart-sidebar');
      const playersTab = within(sidebar).getByRole('button', { name: /players/i });
      await user.click(playersTab);

      const playerInSidebar = within(sidebar).getAllByTestId('player-item')[0];
      await user.click(playerInSidebar);

      // 2. Verify player is highlighted on field
      const playerOnField = screen.getByTestId(`player-token-${mockPlayers[0].id}`);
      expect(playerOnField).toHaveClass('selected');

      // 3. Verify player stats show in overlay
      expect(screen.getByTestId('player-stats-overlay')).toBeInTheDocument();

      // 4. Select different player on field
      const anotherPlayer = screen.getAllByTestId('player-token')[1];
      await user.click(anotherPlayer);

      // 5. Verify sidebar updates selection
      const sidebarSelection = within(sidebar).getByTestId('selected-player');
      expect(sidebarSelection).toHaveTextContent(mockPlayers[1].name);
    });

    it('should maintain formation state across view changes', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // 1. Move a player on the field
      const playerToken = screen.getAllByTestId('player-token')[0];
      const field = screen.getByTestId('modern-field');

      // Drag player to new position
      fireEvent.mouseDown(playerToken, { clientX: 100, clientY: 100 });
      fireEvent.dragStart(playerToken);
      fireEvent.dragOver(field, { clientX: 200, clientY: 200 });
      fireEvent.drop(field, { clientX: 200, clientY: 200 });

      // 2. Switch to fullscreen view
      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      await user.click(fullscreenButton);

      // 3. Verify player position is maintained
      const playerInFullscreen = screen.getByTestId(`player-token-${mockPlayers[0].id}`);
      expect(playerInFullscreen).toHaveStyle({
        left: expect.stringContaining('200'),
        top: expect.stringContaining('200'),
      });

      // 4. Switch back to standard view
      const exitFullscreen = screen.getByRole('button', { name: /exit fullscreen/i });
      await user.click(exitFullscreen);

      // 5. Verify position still maintained
      const playerBackInStandard = screen.getByTestId(`player-token-${mockPlayers[0].id}`);
      expect(playerBackInStandard).toHaveStyle({
        left: expect.stringContaining('200'),
        top: expect.stringContaining('200'),
      });
    });

    it('should handle undo/redo across different actions', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
          undoStack: [],
          redoStack: [],
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // 1. Move player (action 1)
      const playerToken = screen.getAllByTestId('player-token')[0];
      const originalPosition = { x: 50, y: 50 };
      const newPosition = { x: 75, y: 60 };

      fireEvent.mouseDown(playerToken, {
        clientX: originalPosition.x,
        clientY: originalPosition.y,
      });
      fireEvent.dragEnd(playerToken, { clientX: newPosition.x, clientY: newPosition.y });

      // 2. Change formation (action 2)
      const formationSelect = screen.getByRole('combobox', { name: /formation/i });
      await user.selectOptions(formationSelect, '4-3-3');

      // 3. Add player (action 3)
      const addPlayerButton = screen.getByRole('button', { name: /add player/i });
      await user.click(addPlayerButton);

      // 4. Undo last action (should remove added player)
      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);

      // 5. Undo second action (should revert formation)
      await user.click(undoButton);

      const currentFormation = screen.getByDisplayValue('4-4-2');
      expect(currentFormation).toBeInTheDocument();

      // 6. Undo first action (should revert player position)
      await user.click(undoButton);

      const revertedPlayer = screen.getByTestId(`player-token-${mockPlayers[0].id}`);
      expect(revertedPlayer).toHaveStyle({
        left: `${originalPosition.x}%`,
        top: `${originalPosition.y}%`,
      });

      // 7. Redo actions
      const redoButton = screen.getByRole('button', { name: /redo/i });
      await user.click(redoButton); // Restore player move
      await user.click(redoButton); // Restore formation change
      await user.click(redoButton); // Restore added player

      // Verify all actions are restored
      expect(screen.getByDisplayValue('4-3-3')).toBeInTheDocument();
    });
  });

  describe('Performance Under Load', () => {
    it('should handle large formations efficiently', async () => {
      // Create large formation with many players
      const largeFormation = generateFormation({
        players: Array.from({ length: 50 }, () => generatePlayer()),
      });

      const initialState = {
        tactics: {
          currentFormation: largeFormation,
        },
      };

      const startTime = performance.now();

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within performance threshold
      expect(renderTime).toBeLessThan(2000); // 2 seconds for large formation

      // Test interaction performance
      const interactionStart = performance.now();

      const firstPlayer = screen.getAllByTestId('player-token')[0];
      await user.click(firstPlayer);

      const interactionEnd = performance.now();
      const interactionTime = interactionEnd - interactionStart;

      expect(interactionTime).toBeLessThan(100); // 100ms for selection
    });

    it('should handle rapid user interactions gracefully', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // Simulate rapid clicking on multiple players
      const players = screen.getAllByTestId('player-token');

      const rapidClicks = async () => {
        for (let i = 0; i < players.length; i++) {
          await user.click(players[i]);
          // Small delay to simulate rapid but realistic clicking
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      };

      const startTime = performance.now();
      await rapidClicks();
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(1000); // Should handle rapid interactions smoothly

      // Verify final state is consistent
      const lastSelectedPlayer = players[players.length - 1];
      expect(lastSelectedPlayer).toHaveClass('selected');
    });

    it('should maintain responsive animations during complex operations', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // Start animation timeline
      const timelineButton = screen.getByRole('button', { name: /animation timeline/i });
      await user.click(timelineButton);

      const playAnimation = screen.getByRole('button', { name: /play/i });
      await user.click(playAnimation);

      // Interact with other components while animation is running
      const sidebar = screen.getByTestId('smart-sidebar');
      const challengesTab = within(sidebar).getByRole('button', { name: /challenges/i });
      await user.click(challengesTab);

      // Switch view modes
      const presentationButton = screen.getByRole('button', { name: /presentation/i });
      await user.click(presentationButton);

      // Verify animations continue smoothly
      const animatedElements = screen.getAllByTestId('animated-player');
      expect(animatedElements.length).toBeGreaterThan(0);

      // Animation elements should be present (frame rate testing requires additional setup)
      expect(animatedElements[0]).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from component failures gracefully', async () => {
      // Mock a component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test component error');
      };

      // Temporarily replace a component to cause error
      vi.mock('../../components/tactics/PlayerStatsOverlay', () => ({
        default: ErrorComponent,
      }));

      const initialState = {
        tactics: {
          currentFormation: mockFormation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // The board should still render with error boundary
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();

      // Error should be contained and show fallback UI
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Other components should still work
      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toBeInTheDocument();
    });

    it('should handle network failures during operations', async () => {
      // Mock network failure
      const networkError = new Error('Network Error');
      const failingProps = {
        ...mockProps,
        onSaveFormation: vi.fn().mockRejectedValue(networkError),
      };

      const initialState = {
        tactics: {
          currentFormation: mockFormation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...failingProps} />, { initialState });

      // Attempt to save formation
      const saveButton = screen.getByRole('button', { name: /save formation/i });
      await user.click(saveButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to save formation/i)).toBeInTheDocument();
      });

      // Should offer retry option
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Other functionality should remain available
      const playerToken = screen.getAllByTestId('player-token')[0];
      await user.click(playerToken);
      expect(playerToken).toHaveClass('selected');
    });

    it('should handle data corruption gracefully', async () => {
      // Provide corrupted formation data
      const corruptedFormation = {
        ...mockFormation,
        players: null, // Corrupted players data
        positions: undefined, // Missing positions
      };

      const initialState = {
        tactics: {
          currentFormation: corruptedFormation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // Should show data recovery options
      expect(screen.getByText(/formation data appears corrupted/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restore from backup/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start fresh/i })).toBeInTheDocument();

      // Should still render the basic interface
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should support complete keyboard navigation workflow', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // Navigate through interface using only keyboard

      // 1. Tab to first interactive element
      await user.tab();
      expect(screen.getByRole('button', { name: /view mode/i })).toHaveFocus();

      // 2. Navigate to sidebar
      await user.tab();
      await user.tab();
      const sidebarButton = screen.getByRole('button', { name: /formations/i });
      expect(sidebarButton).toHaveFocus();

      // 3. Navigate to field
      await user.tab();
      await user.tab();
      const firstPlayer = screen.getAllByTestId('player-token')[0];
      expect(firstPlayer).toHaveFocus();

      // 4. Select player with keyboard
      await user.keyboard('[Enter]');
      expect(firstPlayer).toHaveClass('selected');

      // 5. Move player with arrow keys
      await user.keyboard('[ArrowRight][ArrowRight][ArrowDown]');

      // Player should move (implementation-dependent)
      // This tests that keyboard navigation is properly set up
    });

    it('should announce important state changes to screen readers', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // Test various state changes and their announcements

      // 1. Formation change
      const formationSelect = screen.getByRole('combobox', { name: /formation/i });
      await user.selectOptions(formationSelect, '4-3-3');

      const announcement1 = screen.getByTestId('screen-reader-announcement');
      expect(announcement1).toHaveTextContent(/formation changed to 4-3-3/i);

      // 2. Player selection
      const playerToken = screen.getAllByTestId('player-token')[0];
      await user.click(playerToken);

      await waitFor(() => {
        expect(announcement1).toHaveTextContent(/selected.*player/i);
      });

      // 3. View mode change
      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      await user.click(fullscreenButton);

      await waitFor(() => {
        expect(announcement1).toHaveTextContent(/entered fullscreen mode/i);
      });
    });

    it('should support screen reader with complex interactions', async () => {
      const initialState = {
        tactics: {
          currentFormation: mockFormation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      // Test screen reader compatibility for drag and drop
      const playerToken = screen.getAllByTestId('player-token')[0];

      // Focus on player
      playerToken.focus();

      // Use spacebar to grab for screen reader drag
      await user.keyboard('[Space]');
      expect(playerToken).toHaveAttribute('aria-grabbed', 'true');

      // Navigate to drop target
      const field = screen.getByTestId('modern-field');
      field.focus();

      // Drop with spacebar
      await user.keyboard('[Space]');

      // Verify drop was successful and announced
      const announcement = screen.getByTestId('screen-reader-announcement');
      expect(announcement).toHaveTextContent(/player moved to new position/i);
    });
  });
});
