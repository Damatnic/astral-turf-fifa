import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnifiedTacticsBoard } from '../../../components/tactics/UnifiedTacticsBoard';
import { TacticsProvider } from '../../../contexts/TacticsContext';
import { UIProvider } from '../../../contexts/UIContext';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children,
  PanInfo: vi.fn(),
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
  useTransform: () => ({ get: () => 0 })
}));

// Mock hooks
vi.mock('../../../hooks', () => ({
  useTacticsContext: () => ({
    tacticsState: {
      formations: {
        'home-formation': {
          id: 'home-formation',
          name: '4-3-3',
          slots: [
            { id: 'gk', position: { x: 50, y: 90 }, roleId: 'goalkeeper', playerId: null },
            { id: 'cb1', position: { x: 40, y: 75 }, roleId: 'center-back', playerId: 'player-1' },
            { id: 'cb2', position: { x: 60, y: 75 }, roleId: 'center-back', playerId: 'player-2' }
          ],
          players: [
            { id: 'player-1', name: 'John Doe', roleId: 'center-back', rating: 85 },
            { id: 'player-2', name: 'Jane Smith', roleId: 'center-back', rating: 82 }
          ]
        }
      },
      activeFormationIds: { home: 'home-formation' },
      players: [
        { id: 'player-1', name: 'John Doe', roleId: 'center-back', rating: 85, number: 4 },
        { id: 'player-2', name: 'Jane Smith', roleId: 'center-back', rating: 82, number: 5 },
        { id: 'player-3', name: 'Bob Wilson', roleId: 'goalkeeper', rating: 88, number: 1 }
      ]
    },
    dispatch: vi.fn()
  }),
  useUIContext: () => ({
    uiState: {
      selectedPlayerId: null,
      isPresentationMode: false,
      drawingTool: 'select'
    }
  }),
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    currentBreakpoint: 'lg'
  })
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

describe('UnifiedTacticsBoard', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <TacticsProvider>
        <UIProvider>
          {component}
        </UIProvider>
      </TacticsProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
    });

    it('should render the field component', () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      expect(screen.getByTestId('modern-field')).toBeInTheDocument();
    });

    it('should render quick actions panel', () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      expect(screen.getByTestId('quick-actions-panel')).toBeInTheDocument();
    });

    it('should render contextual toolbar', () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      expect(screen.getByTestId('contextual-toolbar')).toBeInTheDocument();
    });
  });

  describe('Panel State Management', () => {
    it('should toggle left panel state correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const leftPanelToggle = screen.getByTestId('toggle-left-panel');
      
      // Initially should be in peek mode for desktop
      expect(screen.getByTestId('left-panel')).toHaveClass('w-16');
      
      // Click to expand
      await user.click(leftPanelToggle);
      await waitFor(() => {
        expect(screen.getByTestId('left-panel')).toHaveClass('w-80');
      });
      
      // Click to collapse
      await user.click(leftPanelToggle);
      await waitFor(() => {
        expect(screen.queryByTestId('left-panel')).not.toBeInTheDocument();
      });
    });

    it('should toggle right panel state correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const rightPanelToggle = screen.getByTestId('toggle-right-panel');
      
      // Click to expand
      await user.click(rightPanelToggle);
      await waitFor(() => {
        expect(screen.getByTestId('right-panel')).toHaveClass('w-80');
      });
    });

    it('should collapse panels on mobile', () => {
      // Mock mobile viewport
      vi.mocked(useResponsive).mockReturnValue({
        isMobile: true,
        isTablet: false,
        currentBreakpoint: 'sm'
      });

      renderWithProviders(<UnifiedTacticsBoard />);
      
      // Panels should be collapsed on mobile
      expect(screen.queryByTestId('left-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
    });
  });

  describe('Player Interaction', () => {
    it('should handle player selection', async () => {
      const user = userEvent.setup();
      const mockDispatch = vi.fn();
      
      vi.mocked(useTacticsContext).mockReturnValue({
        tacticsState: expect.any(Object),
        dispatch: mockDispatch
      });

      renderWithProviders(<UnifiedTacticsBoard />);
      
      const playerToken = screen.getByTestId('player-token-player-1');
      await user.click(playerToken);
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SELECT_PLAYER',
        payload: { playerId: 'player-1' }
      });
    });

    it('should handle player movement', async () => {
      const mockDispatch = vi.fn();
      
      vi.mocked(useTacticsContext).mockReturnValue({
        tacticsState: expect.any(Object),
        dispatch: mockDispatch
      });

      renderWithProviders(<UnifiedTacticsBoard />);
      
      const field = screen.getByTestId('modern-field');
      
      // Simulate field click to move player
      fireEvent.click(field, { clientX: 400, clientY: 300 });
      
      // Should dispatch player move action if a player is selected
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'UPDATE_PLAYER_POSITION',
          payload: expect.objectContaining({
            position: expect.objectContaining({
              x: expect.any(Number),
              y: expect.any(Number)
            })
          })
        });
      });
    });
  });

  describe('Formation Management', () => {
    it('should open formation templates modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const formationButton = screen.getByTestId('quick-action-formations');
      await user.click(formationButton);
      
      expect(screen.getByTestId('formation-templates-modal')).toBeInTheDocument();
    });

    it('should handle formation changes', async () => {
      const mockDispatch = vi.fn();
      
      vi.mocked(useTacticsContext).mockReturnValue({
        tacticsState: expect.any(Object),
        dispatch: mockDispatch
      });

      renderWithProviders(<UnifiedTacticsBoard />);
      
      // Simulate formation change
      const newFormation = {
        id: '4-4-2',
        name: '4-4-2',
        slots: []
      };
      
      // This would typically be triggered from the formation templates modal
      const formationChangeEvent = new CustomEvent('formationChange', {
        detail: newFormation
      });
      
      fireEvent(document, formationChangeEvent);
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'UPDATE_FORMATION',
          payload: newFormation
        });
      });
    });
  });

  describe('AI Assistant Integration', () => {
    it('should open AI assistant modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const aiButton = screen.getByTestId('quick-action-ai-assistant');
      await user.click(aiButton);
      
      expect(screen.getByTestId('intelligent-assistant-modal')).toBeInTheDocument();
    });

    it('should display AI suggestions', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const aiButton = screen.getByTestId('quick-action-ai-assistant');
      await userEvent.click(aiButton);
      
      // Wait for AI analysis to complete
      await waitFor(() => {
        expect(screen.getByText(/formation rating/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      expect(screen.getByText(/strengths/i)).toBeInTheDocument();
      expect(screen.getByText(/areas for improvement/i)).toBeInTheDocument();
    });
  });

  describe('View Mode Management', () => {
    it('should toggle fullscreen mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const fullscreenButton = screen.getByTestId('quick-action-fullscreen');
      await user.click(fullscreenButton);
      
      expect(screen.getByTestId('unified-tactics-board')).toHaveClass('fixed inset-0 z-50');
    });

    it('should exit fullscreen mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const fullscreenButton = screen.getByTestId('quick-action-fullscreen');
      
      // Enter fullscreen
      await user.click(fullscreenButton);
      
      // Exit fullscreen
      await user.click(fullscreenButton);
      
      expect(screen.getByTestId('unified-tactics-board')).not.toHaveClass('fixed inset-0 z-50');
    });
  });

  describe('Drag and Drop', () => {
    it('should show drag indicator during player drag', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const playerToken = screen.getByTestId('player-token-player-1');
      
      // Start drag
      fireEvent.mouseDown(playerToken);
      fireEvent.dragStart(playerToken);
      
      expect(screen.getByTestId('drag-indicator')).toBeInTheDocument();
      
      // End drag
      fireEvent.dragEnd(playerToken);
      fireEvent.mouseUp(playerToken);
      
      await waitFor(() => {
        expect(screen.queryByTestId('drag-indicator')).not.toBeInTheDocument();
      });
    });

    it('should validate drop positions', () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const field = screen.getByTestId('modern-field');
      const playerToken = screen.getByTestId('player-token-player-1');
      
      // Start drag
      fireEvent.dragStart(playerToken);
      
      // Drag to invalid position (outside field bounds)
      fireEvent.dragOver(field, { clientX: -10, clientY: -10 });
      
      expect(screen.getByTestId('drag-indicator')).toHaveClass('border-red-400');
      
      // Drag to valid position
      fireEvent.dragOver(field, { clientX: 400, clientY: 300 });
      
      expect(screen.getByTestId('drag-indicator')).toHaveClass('border-green-400');
    });
  });

  describe('Performance Optimization', () => {
    it('should use requestAnimationFrame for player movement', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(0);
        return 0;
      });
      
      const mockDispatch = vi.fn();
      vi.mocked(useTacticsContext).mockReturnValue({
        tacticsState: expect.any(Object),
        dispatch: mockDispatch
      });

      renderWithProviders(<UnifiedTacticsBoard />);
      
      const field = screen.getByTestId('modern-field');
      fireEvent.click(field, { clientX: 400, clientY: 300 });
      
      expect(rafSpy).toHaveBeenCalled();
      rafSpy.mockRestore();
    });

    it('should cleanup animation frames on unmount', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      
      const { unmount } = renderWithProviders(<UnifiedTacticsBoard />);
      unmount();
      
      expect(cancelSpy).toHaveBeenCalled();
      cancelSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UnifiedTacticsBoard />);
      
      // Tab to first focusable element
      await user.tab();
      
      // Should focus on first quick action button
      expect(screen.getByTestId('quick-action-formations')).toHaveFocus();
      
      // Tab to next element
      await user.tab();
      expect(screen.getByTestId('quick-action-ai-assistant')).toHaveFocus();
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      
      expect(screen.getByLabelText(/toggle left panel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/toggle right panel/i)).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should announce drag state to screen readers', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const playerToken = screen.getByTestId('player-token-player-1');
      fireEvent.dragStart(playerToken);
      
      expect(screen.getByText(/dragging john doe/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing formation gracefully', () => {
      vi.mocked(useTacticsContext).mockReturnValue({
        tacticsState: {
          formations: {},
          activeFormationIds: { home: 'non-existent' },
          players: []
        },
        dispatch: vi.fn()
      });

      renderWithProviders(<UnifiedTacticsBoard />);
      
      expect(screen.getByText(/no formation selected/i)).toBeInTheDocument();
    });

    it('should handle invalid player data', () => {
      vi.mocked(useTacticsContext).mockReturnValue({
        tacticsState: {
          formations: {},
          activeFormationIds: {},
          players: [{ id: null, name: '', roleId: null }] // Invalid player data
        },
        dispatch: vi.fn()
      });

      expect(() => renderWithProviders(<UnifiedTacticsBoard />)).not.toThrow();
    });
  });
});