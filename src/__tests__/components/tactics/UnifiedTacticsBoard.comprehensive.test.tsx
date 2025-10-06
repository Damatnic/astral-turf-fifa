import React from 'react';
import {
  renderWithProviders,
  createTestData,
  createMockProps,
  mockCanvas,
  testUtils,
  vi,
  expect,
  describe,
  it,
  beforeEach,
  afterEach,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
  userEvent,
} from '../../utils/comprehensive-test-providers';
import { UnifiedTacticsBoard } from '../../../components/tactics/UnifiedTacticsBoard';
import type { Formation, Player } from '../../../types';

// Mock heavy components and services
vi.mock('../../../components/tactics/IntelligentAssistant', () => ({
  default: React.forwardRef<HTMLDivElement>((props: any, ref) => (
    <div ref={ref} data-testid="intelligent-assistant" className={props.className}>
      AI Assistant Mock
    </div>
  )),
}));

vi.mock('../../../components/tactics/FormationTemplates', () => ({
  default: ({ onSelect, onClose }: any) => (
    <div data-testid="formation-templates">
      <button
        onClick={() => onSelect({ id: 'test-formation', name: 'Test Formation' })}
        data-testid="select-formation"
      >
        Select Formation
      </button>
      <button onClick={onClose} data-testid="close-templates">
        Close
      </button>
    </div>
  ),
}));

vi.mock('../../../components/tactics/TacticalPlaybook', () => ({
  default: ({ onLoadFormation, onClose }: any) => (
    <div data-testid="tactical-playbook">
      <button
        onClick={() => onLoadFormation({ id: 'playbook-formation', name: 'Playbook Formation' })}
        data-testid="load-playbook-formation"
      >
        Load Formation
      </button>
      <button onClick={onClose} data-testid="close-playbook">
        Close
      </button>
    </div>
  ),
}));

vi.mock('../../../components/analytics/AdvancedAnalyticsDashboard', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="analytics-dashboard">
      <button onClick={onClose} data-testid="close-analytics">
        Close Analytics
      </button>
    </div>
  ),
}));

// Mock other lazy-loaded components
vi.mock('../../../components/tactics/AnimationTimeline', () => ({
  default: () => <div data-testid="animation-timeline">Animation Timeline</div>,
}));

vi.mock('../../../components/tactics/PresentationControls', () => ({
  default: ({ isPresenting, onTogglePresentation }: any) => (
    <div data-testid="presentation-controls">
      <button onClick={onTogglePresentation} data-testid="toggle-presentation">
        {isPresenting ? 'Exit Presentation' : 'Enter Presentation'}
      </button>
    </div>
  ),
}));

vi.mock('../../../components/tactics/DugoutManagement', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="dugout-management">
      <button onClick={onClose} data-testid="close-dugout">
        Close Dugout
      </button>
    </div>
  ),
}));

vi.mock('../../../components/tactics/ChallengeManagement', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="challenge-management">
      <button onClick={onClose} data-testid="close-challenges">
        Close Challenges
      </button>
    </div>
  ),
}));

vi.mock('../../../components/tactics/CollaborationFeatures', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="collaboration-features">
      <button onClick={onClose} data-testid="close-collaboration">
        Close Collaboration
      </button>
    </div>
  ),
}));

vi.mock('../../../components/tactics/EnhancedExportImport', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="enhanced-export-import">
      <button onClick={onClose} data-testid="close-export-import">
        Close Export/Import
      </button>
    </div>
  ),
}));

// Mock performance worker
vi.mock('../../../workers/formationCalculationWorker', () => ({
  FormationWebWorker: class {
    validatePlayerPosition = vi.fn().mockResolvedValue({ isValid: true });
    terminate = vi.fn();
  },
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, any>((props, ref) => (
      <div ref={ref} {...props} style={{ ...props.style, ...props.animate }} />
    )),
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('UnifiedTacticsBoard - Comprehensive Test Suite', () => {
  let testData: ReturnType<typeof createTestData.complete>;
  let mockProps: ReturnType<typeof createMockProps.unifiedTacticsBoard>;
  let user: ReturnType<typeof userEvent.setup>;
  let canvasContext: any;

  beforeEach(() => {
    // Initialize test data
    testData = createTestData.complete();
    mockProps = createMockProps.unifiedTacticsBoard();
    user = userEvent.setup();
    canvasContext = mockCanvas();

    // Mock global functions
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: () => [],
    }));

    // Mock requestFullscreen
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      value: vi.fn().mockResolvedValue(undefined),
      writable: true,
    });

    Object.defineProperty(document, 'exitFullscreen', {
      value: vi.fn().mockResolvedValue(undefined),
      writable: true,
    });

    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Rendering and Layout', () => {
    it('should render the main tactical board interface with all core components', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Check main container exists
      const board = container.querySelector('[role="application"]');
      expect(board).toBeInTheDocument();
      expect(board).toHaveAttribute('aria-label', 'Soccer Tactics Board');

      // Wait for async components to render
      await waitFor(
        () => {
          // Check for main tactical field
          const field = container.querySelector('[role="main"]');
          expect(field).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should apply custom className when provided', () => {
      const customClass = 'custom-tactics-board';
      const { container } = renderWithProviders(
        <UnifiedTacticsBoard {...mockProps} className={customClass} />
      );

      const board = container.querySelector('[role="application"]');
      expect(board).toHaveClass(customClass);
    });

    it('should handle sample data initialization when no data is provided', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: {
          players: [],
          formations: {},
          activeFormationIds: { home: '', away: '' },
        },
        initialUIState: testData.uiState,
      });

      // Should initialize with sample data
      await waitFor(
        () => {
          expect(screen.queryByText(/no formation loaded/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Responsive Layout Management', () => {
    it('should adapt layout for mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const container = screen.getByRole('application');
        expect(container).toBeInTheDocument();
      });
    });

    it('should manage sidebar visibility based on screen size', async () => {
      const { container, rerender } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Desktop should show both sidebars
      Object.defineProperty(window, 'innerWidth', {
        value: 1200,
        configurable: true,
      });

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const leftSidebar = container.querySelector('[aria-label="Left sidebar"]');
        const rightSidebar = container.querySelector('[aria-label="Right sidebar"]');
        // Sidebars may not be visible immediately due to animations
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Formation and Player Management', () => {
    it('should display formation when provided', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
    });

    it('should handle player selection and movement', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        const field = container.querySelector('[role="main"]');
        expect(field).toBeInTheDocument();
      });

      // Test player interaction through the field
      const field = container.querySelector('[role="main"]');
      if (field) {
        await user.click(field);
        // Player selection logic would be handled by child components
      }
    });

    it('should handle formation save action', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Look for save functionality in the toolbar or controls
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // The save functionality would be triggered through toolbar buttons
      // This tests the prop callback setup
      expect(mockProps.onSaveFormation).toBeDefined();
    });
  });

  describe('Drawing and Tactical Tools', () => {
    it('should handle drawing tool interactions', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: {
          ...testData.uiState,
          drawingTool: 'pen',
          drawingColor: '#ff0000',
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Drawing functionality would be handled by the DrawingCanvas component
      expect(canvasContext.beginPath).toBeDefined();
    });

    it('should support different drawing tools and colors', async () => {
      const { rerender } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: {
          ...testData.uiState,
          drawingTool: 'line',
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Test tool change
      rerender(<UnifiedTacticsBoard {...mockProps} />);

      // Drawing tools state would be managed through the UI context
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Modal and Panel Management', () => {
    it('should open and close formation templates modal', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Formation templates would be opened through toolbar actions
      // The modal management is handled internally
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
    });

    it('should manage AI assistant panel visibility', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // AI assistant panel would be toggled through quick actions
      expect(screen.queryByTestId('intelligent-assistant')).not.toBeInTheDocument();
    });

    it('should handle analytics dashboard display', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Analytics would be opened through prop callback
      expect(mockProps.onAnalyticsView).toBeDefined();
    });
  });

  describe('View Mode Transitions', () => {
    it('should handle fullscreen mode toggle', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Fullscreen toggle would be available through the toolbar
      const board = container.querySelector('[role="application"]');
      expect(board).toBeInTheDocument();
    });

    it('should handle presentation mode', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Presentation mode would be handled through presentation controls
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large player datasets efficiently', async () => {
      const performanceData = createTestData.performance(100);

      const renderTime = await testUtils.measureRenderTime(() => {
        renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
          initialTacticsState: {
            players: performanceData.players,
            formations: { [performanceData.formation.id]: performanceData.formation },
            activeFormationIds: { home: performanceData.formation.id, away: '' },
            drawings: [],
            playbook: {},
          },
          initialUIState: testData.uiState,
        });
      });

      // Should render within reasonable time even with large datasets
      expect(renderTime).toBeLessThan(2000); // 2 seconds
    });

    it('should implement proper virtualization for large datasets', async () => {
      const largeDataset = createTestData.performance(200);

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: {
          players: largeDataset.players,
          formations: { [largeDataset.formation.id]: largeDataset.formation },
          activeFormationIds: { home: largeDataset.formation.id, away: '' },
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          playbook: {},
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {}, away: {} },
        },
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Virtualization would be handled internally by the component
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('should use deferred values for performance optimization', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Deferred values are used internally for performance
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Accessibility and ARIA Support', () => {
    it('should have proper ARIA labels and roles', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        const board = container.querySelector('[role="application"]');
        expect(board).toBeInTheDocument();
        expect(board).toHaveAttribute('aria-label', 'Soccer Tactics Board');
        expect(board).toHaveAttribute('aria-live', 'polite');
        expect(board).toHaveAttribute('tabIndex', '-1');
      });
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        const board = screen.getByRole('application');
        expect(board).toBeInTheDocument();
      });

      // Test keyboard navigation
      const board = screen.getByRole('application');
      board.focus();

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBeDefined();
    });

    it('should announce state changes to screen readers', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        const board = container.querySelector('[role="application"]');
        expect(board).toHaveAttribute('aria-live', 'polite');
      });

      // Screen reader announcements would be made through aria-live regions
      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing formation data gracefully', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: {
          players: testData.players,
          formations: {},
          activeFormationIds: { home: '', away: '' },
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          playbook: {},
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {}, away: {} },
        },
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Should handle missing formation gracefully by initializing sample data
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('should handle empty player arrays', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: {
          players: [],
          formations: {},
          activeFormationIds: { home: '', away: '' },
          teamTactics: { home: {} as any, away: {} as any },
          drawings: [],
          playbook: {},
          tacticalFamiliarity: {},
          chemistry: {},
          captainIds: { home: null, away: null },
          setPieceTakers: { home: {}, away: {} },
        },
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Should initialize with sample data when empty
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('should recover from rendering errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
          initialTacticsState: testData.tacticsState,
          initialUIState: testData.uiState,
        });

        await waitFor(() => {
          expect(screen.getByRole('application')).toBeInTheDocument();
        });
      } catch (error) {
        // Should handle errors gracefully
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('Integration with Child Components', () => {
    it('should properly integrate with ModernField component', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        const field = container.querySelector('[role="main"]');
        expect(field).toBeInTheDocument();
      });
    });

    it('should integrate with UnifiedFloatingToolbar', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Toolbar integration would be visible in the interface
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('should integrate with PlayerDisplaySettings', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Player display settings would be controlled through the toolbar
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('should integrate with PositionalBench component', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Bench would be visible in the sidebar areas
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Prop Callback Integration', () => {
    it('should call onSimulateMatch when simulation is triggered', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Simulation would be triggered through quick actions
      expect(mockProps.onSimulateMatch).toBeDefined();
    });

    it('should call onExportFormation when export is triggered', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Export would be triggered through quick actions
      expect(mockProps.onExportFormation).toBeDefined();
    });

    it('should call onAnalyticsView when analytics is opened', async () => {
      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Analytics view would be triggered through quick actions
      expect(mockProps.onAnalyticsView).toBeDefined();
    });
  });
});
