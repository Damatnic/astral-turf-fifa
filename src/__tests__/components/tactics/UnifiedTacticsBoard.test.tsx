import React from 'react';
import { screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach, MockedFunction } from 'vitest';
import { renderWithProviders } from '../../utils/enhanced-mock-generators';
import {
  generateEnhancedPlayer,
  generateEnhancedFormation,
  generateCompleteTacticalSetup,
  generatePerformanceTestData,
  generateEdgeCaseData,
  generateDrawingShapes,
  testScenarios,
} from '../../utils/enhanced-mock-generators';
import { createTestDataSet, generateFormation, generatePlayer } from '../../utils/mock-generators';
import { mockCanvas } from '../../utils/test-helpers';
import { UnifiedTacticsBoard } from '../../../components/tactics/UnifiedTacticsBoard';
import type { Formation, Player, UnifiedTacticsBoardProps } from '../../../types';

// Mock heavy components that are lazy loaded
vi.mock('../../../components/tactics/IntelligentAssistant', () => ({
  default: () => <div data-testid="intelligent-assistant">AI Assistant</div>,
}));

vi.mock('../../../components/tactics/FormationTemplates', () => ({
  default: () => <div data-testid="formation-templates">Formation Templates</div>,
}));

vi.mock('../../../components/tactics/TacticalPlaybook', () => ({
  default: () => <div data-testid="tactical-playbook">Tactical Playbook</div>,
}));

vi.mock('../../../components/analytics/AdvancedAnalyticsDashboard', () => ({
  default: () => <div data-testid="analytics-dashboard">Analytics Dashboard</div>,
}));

describe('UnifiedTacticsBoard', () => {
  let mockFormation: Formation;
  let mockPlayers: Player[];
  let mockProps: any;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // Setup test data
    const testData = createTestDataSet.complete();
    mockFormation = testData.formation;
    mockPlayers = testData.players;

    // Setup component props
    mockProps = {
      onSimulateMatch: vi.fn(),
      onSaveFormation: vi.fn(),
      onAnalyticsView: vi.fn(),
      onExportFormation: vi.fn(),
    };

    // Setup user event
    user = userEvent.setup();

    // Setup canvas mock
    mockCanvas();

    // Mock ResizeObserver for responsive behavior
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
    it('should render the main tactical board interface', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      // Check main layout elements
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
      expect(screen.getByTestId('modern-field')).toBeInTheDocument();
      expect(screen.getByTestId('smart-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions-panel')).toBeInTheDocument();

      // Check header controls
      expect(screen.getByRole('button', { name: /view mode/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
    });

    it('should render all tactical board sections', () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      // Main tactical components
      expect(screen.getByTestId('animation-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('presentation-controls')).toBeInTheDocument();
      expect(screen.getByTestId('dugout-management')).toBeInTheDocument();
      expect(screen.getByTestId('challenge-management')).toBeInTheDocument();
      expect(screen.getByTestId('collaboration-features')).toBeInTheDocument();
      expect(screen.getByTestId('enhanced-export-import')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const customClass = 'custom-tactics-board';
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} className={customClass} />);

      const board = screen.getByTestId('unified-tactics-board');
      expect(board).toHaveClass(customClass);
    });
  });

  describe('View Mode Management', () => {
    it('should start in standard view mode', () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const board = screen.getByTestId('unified-tactics-board');
      expect(board).toHaveAttribute('data-view-mode', 'standard');
    });

    it('should toggle to fullscreen mode', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      await user.click(fullscreenButton);

      const board = screen.getByTestId('unified-tactics-board');
      expect(board).toHaveAttribute('data-view-mode', 'fullscreen');
    });

    it('should switch to presentation mode', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const presentationButton = screen.getByRole('button', { name: /presentation/i });
      await user.click(presentationButton);

      const board = screen.getByTestId('unified-tactics-board');
      expect(board).toHaveAttribute('data-view-mode', 'presentation');
    });

    it('should hide sidebar in fullscreen mode', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      await user.click(fullscreenButton);

      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toHaveAttribute('data-collapsed', 'true');
    });
  });

  describe('Panel State Management', () => {
    it('should start with sidebar in expanded state', () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toHaveAttribute('data-state', 'expanded');
    });

    it('should collapse sidebar when collapse button is clicked', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(collapseButton);

      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    });

    it('should show peek state on sidebar hover when collapsed', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      // First collapse the sidebar
      const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(collapseButton);

      // Then hover over it
      const sidebar = screen.getByTestId('smart-sidebar');
      await user.hover(sidebar);

      expect(sidebar).toHaveAttribute('data-state', 'peek');
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const board = screen.getByTestId('unified-tactics-board');
      expect(board).toHaveClass('responsive-mobile');
    });

    it('should collapse panels on small screens', async () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard shortcuts for view modes', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const board = screen.getByTestId('unified-tactics-board');

      // Test fullscreen toggle (F11)
      fireEvent.keyDown(board, { key: 'F11' });
      expect(board).toHaveAttribute('data-view-mode', 'fullscreen');

      // Test escape to exit fullscreen
      fireEvent.keyDown(board, { key: 'Escape' });
      expect(board).toHaveAttribute('data-view-mode', 'standard');
    });

    it('should support tab navigation through controls', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      // Tab through main controls
      await user.tab();
      expect(screen.getByRole('button', { name: /view mode/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /fullscreen/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /presentation/i })).toHaveFocus();
    });

    it('should handle arrow key navigation for field elements', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const field = screen.getByTestId('modern-field');
      field.focus();

      // Test arrow key navigation
      fireEvent.keyDown(field, { key: 'ArrowRight' });
      fireEvent.keyDown(field, { key: 'ArrowDown' });

      // Verify field received navigation events
      expect(field).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Formation Management', () => {
    it('should load formation data when provided', async () => {
      const formationId = 'test-formation-1';
      const initialState = {
        tactics: {
          formations: {
            [formationId]: mockFormation,
          },
          activeFormationIds: { home: formationId, away: '' },
          players: mockFormation.players?.slice(0, 11) || [],
          playbook: {},
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {} as any, away: {} as any },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      await waitFor(() => {
        expect(screen.getByText(mockFormation.name)).toBeInTheDocument();
      });
    });

    it('should handle formation save action', async () => {
      const formationId = 'test-formation-1';
      const initialState = {
        tactics: {
          formations: {
            [formationId]: mockFormation,
          },
          activeFormationIds: { home: formationId, away: '' },
          players: [],
          playbook: {},
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {} as any, away: {} as any },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      const saveButton = screen.getByRole('button', { name: /save formation/i });
      await user.click(saveButton);

      expect(mockProps.onSaveFormation).toHaveBeenCalledWith(mockFormation);
    });

    it('should handle formation export action', async () => {
      const formationId = 'test-formation-1';
      const initialState = {
        tactics: {
          formations: {
            [formationId]: mockFormation,
          },
          activeFormationIds: { home: formationId, away: '' },
          players: [],
          playbook: {},
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {} as any, away: {} as any },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(mockProps.onExportFormation).toHaveBeenCalledWith(mockFormation);
    });
  });

  describe('Player Interaction', () => {
    it('should handle player selection', async () => {
      const formationId = 'test-formation-1';
      const initialState = {
        tactics: {
          formations: {
            [formationId]: mockFormation,
          },
          activeFormationIds: { home: formationId, away: '' },
          players: [],
          playbook: {},
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {} as any, away: {} as any },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      const playerToken = screen.getAllByTestId('player-token')[0];
      await user.click(playerToken);

      expect(playerToken).toHaveAttribute('data-selected', 'true');
    });

    it('should support multi-select with Ctrl+Click', async () => {
      const formationId = 'test-formation-1';
      const initialState = {
        tactics: {
          formations: {
            [formationId]: mockFormation,
          },
          activeFormationIds: { home: formationId, away: '' },
          players: [],
          playbook: {},
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {} as any, away: {} as any },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      const playerTokens = screen.getAllByTestId('player-token');

      // Select first player
      await user.click(playerTokens[0]);

      // Select second player with Ctrl
      await user.keyboard('[ControlLeft>]');
      await user.click(playerTokens[1]);
      await user.keyboard('[/ControlLeft]');

      expect(playerTokens[0]).toHaveAttribute('data-selected', 'true');
      expect(playerTokens[1]).toHaveAttribute('data-selected', 'true');
    });

    it('should handle player drag and drop', async () => {
      const formationId = 'test-formation-1';
      const initialState = {
        tactics: {
          formations: {
            [formationId]: mockFormation,
          },
          activeFormationIds: { home: formationId, away: '' },
          players: [],
          playbook: {},
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {} as any, away: {} as any },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      const playerToken = screen.getAllByTestId('player-token')[0];
      const field = screen.getByTestId('modern-field');

      // Start drag
      fireEvent.mouseDown(playerToken, { clientX: 100, clientY: 100 });
      fireEvent.dragStart(playerToken);

      // Move to new position
      fireEvent.dragOver(field, { clientX: 200, clientY: 200 });
      fireEvent.drop(field, { clientX: 200, clientY: 200 });

      // Verify position update
      expect(playerToken).toHaveAttribute('data-dragging', 'false');
    });
  });

  describe('Analytics Integration', () => {
    it('should open analytics view when analytics button is clicked', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const analyticsButton = screen.getByRole('button', { name: /analytics/i });
      await user.click(analyticsButton);

      expect(mockProps.onAnalyticsView).toHaveBeenCalled();
    });

    it('should display heat map when heat map mode is activated', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const heatMapButton = screen.getByRole('button', { name: /heat map/i });
      await user.click(heatMapButton);

      await waitFor(() => {
        expect(screen.getByTestId('heat-map-overlay')).toBeInTheDocument();
      });
    });
  });

  describe('Collaboration Features', () => {
    it('should show collaboration status when session is active', async () => {
      // Note: Collaboration features may be implemented via different state management
      // For now, test with default state
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      // Collaboration UI should be rendered
      expect(screen.getByTestId('collaboration-features')).toBeInTheDocument();
    });

    it('should handle real-time comments', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const commentButton = screen.getByRole('button', { name: /add comment/i });
      await user.click(commentButton);

      // Click on field to place comment
      const field = screen.getByTestId('modern-field');
      await user.click(field);

      // Type comment
      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      await user.type(commentInput, 'This position looks vulnerable');

      // Submit comment
      const submitButton = screen.getByRole('button', { name: /submit comment/i });
      await user.click(submitButton);

      expect(screen.getByText('This position looks vulnerable')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should lazy load heavy components', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      // AI Assistant should not be loaded initially
      expect(screen.queryByTestId('intelligent-assistant')).not.toBeInTheDocument();

      // Click to load AI Assistant
      const aiButton = screen.getByRole('button', { name: /ai assistant/i });
      await user.click(aiButton);

      // Should now be loaded
      await waitFor(() => {
        expect(screen.getByTestId('intelligent-assistant')).toBeInTheDocument();
      });
    });

    it('should handle large formations efficiently', async () => {
      // Create large formation with many players
      const largeFormation = generateFormation({
        players: Array.from({ length: 50 }, () => generatePlayer()),
      });

      const formationId = 'large-formation';
      const initialState = {
        tactics: {
          formations: {
            [formationId]: largeFormation,
          },
          activeFormationIds: { home: formationId, away: '' },
          players: [],
          playbook: {},
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {} as any, away: {} as any },
        },
      };

      const startTime = Date.now();
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });
      const renderTime = Date.now() - startTime;

      // Should render within performance threshold
      expect(renderTime).toBeLessThan(1000); // 1 second
    });
  });

  describe('Error Handling', () => {
    it('should handle missing formation gracefully', () => {
      const initialState = {
        tactics: {
          formations: {},
          activeFormationIds: { home: '', away: '' },
          players: [],
          playbook: {},
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {} as any, away: {} as any },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      expect(screen.getByText(/no formation loaded/i)).toBeInTheDocument();
    });

    it('should display error message for invalid formations', () => {
      const invalidFormation = {
        ...mockFormation,
        players: null as any, // Invalid players data
      };

      const formationId = 'invalid-formation';
      const initialState = {
        tactics: {
          formations: {
            [formationId]: invalidFormation,
          },
          activeFormationIds: { home: formationId, away: '' },
          players: [],
          playbook: {},
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {} as any, away: {} as any },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, { initialState });

      expect(screen.getByText(/formation data is invalid/i)).toBeInTheDocument();
    });

    it('should recover from API errors gracefully', async () => {
      // Mock API error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      // Trigger action that would cause API error
      const saveButton = screen.getByRole('button', { name: /save formation/i });
      await user.click(saveButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to save formation/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const board = screen.getByTestId('unified-tactics-board');
      expect(board).toHaveAttribute('role', 'application');
      expect(board).toHaveAttribute('aria-label', 'Tactical Board Interface');

      const field = screen.getByTestId('modern-field');
      expect(field).toHaveAttribute('role', 'grid');
      expect(field).toHaveAttribute('aria-label', 'Soccer Field');
    });

    it('should support screen reader navigation', () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const playerTokens = screen.getAllByTestId('player-token');
      playerTokens.forEach((token, index) => {
        expect(token).toHaveAttribute('aria-label');
        expect(token).toHaveAttribute('tabindex');
      });
    });

    it('should announce state changes to screen readers', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />);

      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      await user.click(fullscreenButton);

      const announcer = screen.getByTestId('screen-reader-announcer');
      expect(announcer).toHaveTextContent(/entered fullscreen mode/i);
    });
  });
});
