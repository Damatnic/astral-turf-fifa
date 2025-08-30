import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TacticsBoardPage from '../../pages/TacticsBoardPage';
import { renderWithProviders, createMockDragEvent, createMockTouchEvent } from '../utils/test-utils';
import { createMockTacticsState, createMockUIState, createMockPlayer, createMockFormation } from '../factories';
import '../mocks/modules';

// Mock all the child components
vi.mock('../../components/sidebar/LeftSidebar', () => ({
  LeftSidebar: () => <div data-testid="left-sidebar">Left Sidebar</div>,
}));

vi.mock('../../components/sidebar/RightSidebar', () => ({
  RightSidebar: () => <div data-testid="right-sidebar">Right Sidebar</div>,
}));

vi.mock('../../components/field/SoccerField', () => ({
  default: () => <div data-testid="soccer-field">Soccer Field</div>,
}));

vi.mock('../../components/field/Dugout', () => ({
  default: () => <div data-testid="dugout">Dugout</div>,
}));

vi.mock('../../components/field/TacticalToolbar', () => ({
  default: () => <div data-testid="tactical-toolbar">Tactical Toolbar</div>,
}));

vi.mock('../../components/field/PresentationControls', () => ({
  default: () => <div data-testid="presentation-controls">Presentation Controls</div>,
}));

vi.mock('../../components/ui/ChatButton', () => ({
  default: () => <div data-testid="chat-button">Chat Button</div>,
}));

// Mock hooks with different states for testing
const mockTacticsContext = {
  tacticsState: createMockTacticsState(),
  dispatch: vi.fn(),
};

const mockUIContext = {
  uiState: createMockUIState(),
  dispatch: vi.fn(),
};

const mockResponsive = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  currentBreakpoint: 'desktop' as const,
  screenSize: { width: 1920, height: 1080 },
};

const mockResponsiveNavigation = {
  shouldUseDrawer: false,
  isDrawerOpen: false,
  toggleDrawer: vi.fn(),
};

vi.mock('../../hooks', () => ({
  useTacticsContext: () => mockTacticsContext,
  useUIContext: () => mockUIContext,
  useResponsive: () => mockResponsive,
  useResponsiveNavigation: () => mockResponsiveNavigation,
}));

describe('Tactics Board Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock states
    mockTacticsContext.tacticsState = createMockTacticsState();
    mockUIContext.uiState = createMockUIState();
    Object.assign(mockResponsive, {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      currentBreakpoint: 'desktop',
    });
    mockResponsiveNavigation.shouldUseDrawer = false;
  });

  describe('Desktop Layout', () => {
    it('should render full desktop layout with all components', () => {
      render(<TacticsBoardPage />);

      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('soccer-field')).toBeInTheDocument();
      expect(screen.getByTestId('dugout')).toBeInTheDocument();
      expect(screen.getByTestId('tactical-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button')).toBeInTheDocument();
    });

    it('should apply correct CSS classes for desktop layout', () => {
      const { container } = render(<TacticsBoardPage />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('flex-row', 'h-screen');
      expect(mainContainer).not.toHaveClass('flex-col', 'mobile-full-height');
    });

    it('should show both sidebars in desktop mode', () => {
      mockResponsive.isMobile = false;
      mockResponsiveNavigation.shouldUseDrawer = false;

      render(<TacticsBoardPage />);

      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      Object.assign(mockResponsive, {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        currentBreakpoint: 'mobile',
      });
      mockResponsiveNavigation.shouldUseDrawer = true;
    });

    it('should render mobile layout with collapsed sidebars', () => {
      render(<TacticsBoardPage />);

      // Sidebars should not be visible in mobile layout when using drawer
      expect(screen.queryByTestId('left-sidebar')).not.toBeInTheDocument();
      
      // Main components should still be present
      expect(screen.getByTestId('soccer-field')).toBeInTheDocument();
      expect(screen.getByTestId('dugout')).toBeInTheDocument();
      expect(screen.getByTestId('tactical-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button')).toBeInTheDocument();
    });

    it('should apply mobile-specific CSS classes', () => {
      const { container } = render(<TacticsBoardPage />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('flex-col', 'mobile-full-height');
      expect(mainContainer).not.toHaveClass('flex-row', 'h-screen');
    });

    it('should apply mobile padding to field container', () => {
      const { container } = render(<TacticsBoardPage />);
      
      // Look for mobile padding classes
      const fieldContainer = container.querySelector('.mobile-p-2');
      expect(fieldContainer).toBeInTheDocument();
    });
  });

  describe('Tablet Layout', () => {
    beforeEach(() => {
      Object.assign(mockResponsive, {
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        currentBreakpoint: 'tablet',
      });
    });

    it('should render tablet layout appropriately', () => {
      render(<TacticsBoardPage />);

      expect(screen.getByTestId('soccer-field')).toBeInTheDocument();
      expect(screen.getByTestId('tactical-toolbar')).toBeInTheDocument();
      
      // Tablet might show some sidebars depending on shouldUseDrawer
      if (!mockResponsiveNavigation.shouldUseDrawer) {
        expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
      }
    });
  });

  describe('Presentation Mode', () => {
    beforeEach(() => {
      mockUIContext.uiState = createMockUIState({ isPresentationMode: true });
    });

    it('should hide sidebars in presentation mode', () => {
      render(<TacticsBoardPage />);

      expect(screen.queryByTestId('left-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-sidebar')).not.toBeInTheDocument();
    });

    it('should show presentation controls in presentation mode', () => {
      render(<TacticsBoardPage />);

      expect(screen.getByTestId('presentation-controls')).toBeInTheDocument();
    });

    it('should apply presentation mode styling', () => {
      const { container } = render(<TacticsBoardPage />);
      
      // Should have no padding in presentation mode
      const fieldContainer = container.querySelector('[class*="p-0"]');
      expect(fieldContainer).toBeInTheDocument();
    });

    it('should still show essential field components', () => {
      render(<TacticsBoardPage />);

      expect(screen.getByTestId('soccer-field')).toBeInTheDocument();
      expect(screen.getByTestId('dugout')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should pass tactics state to field components', () => {
      const mockPlayersState = createMockTacticsState({
        players: [
          createMockPlayer({ id: 'player1', name: 'Test Player 1' }),
          createMockPlayer({ id: 'player2', name: 'Test Player 2' }),
        ],
      });

      mockTacticsContext.tacticsState = mockPlayersState;

      render(<TacticsBoardPage />);

      // Components should be rendered (they would receive the state as props)
      expect(screen.getByTestId('soccer-field')).toBeInTheDocument();
      expect(screen.getByTestId('dugout')).toBeInTheDocument();
    });

    it('should handle UI state changes', () => {
      const mockUIStateWithModal = createMockUIState({
        activeModal: 'editPlayer',
        theme: 'light',
      });

      mockUIContext.uiState = mockUIStateWithModal;

      render(<TacticsBoardPage />);

      // Page should still render correctly with different UI states
      expect(screen.getByTestId('soccer-field')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to screen size changes', () => {
      const { rerender } = render(<TacticsBoardPage />);

      // Start with desktop
      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();

      // Switch to mobile
      Object.assign(mockResponsive, {
        isMobile: true,
        currentBreakpoint: 'mobile',
      });
      mockResponsiveNavigation.shouldUseDrawer = true;

      rerender(<TacticsBoardPage />);

      // Sidebar should be hidden in mobile with drawer
      expect(screen.queryByTestId('left-sidebar')).not.toBeInTheDocument();
    });

    it('should handle drawer navigation states', () => {
      mockResponsiveNavigation.shouldUseDrawer = true;
      mockResponsiveNavigation.isDrawerOpen = false;

      render(<TacticsBoardPage />);

      expect(screen.queryByTestId('left-sidebar')).not.toBeInTheDocument();
    });

    it('should maintain field functionality across breakpoints', () => {
      // Test desktop
      render(<TacticsBoardPage />);
      expect(screen.getByTestId('soccer-field')).toBeInTheDocument();
      expect(screen.getByTestId('tactical-toolbar')).toBeInTheDocument();

      // Test mobile
      Object.assign(mockResponsive, {
        isMobile: true,
        currentBreakpoint: 'mobile',
      });

      const { rerender } = render(<TacticsBoardPage />);
      rerender(<TacticsBoardPage />);

      expect(screen.getByTestId('soccer-field')).toBeInTheDocument();
      expect(screen.getByTestId('tactical-toolbar')).toBeInTheDocument();
    });
  });

  describe('Background and Styling', () => {
    it('should apply gradient backgrounds', () => {
      const { container } = render(<TacticsBoardPage />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('bg-gradient-to-br');
      
      const fieldArea = container.querySelector('.bg-gradient-to-b');
      expect(fieldArea).toBeInTheDocument();
    });

    it('should apply backdrop blur effects', () => {
      const { container } = render(<TacticsBoardPage />);
      
      const backdropElement = container.querySelector('.backdrop-blur-sm');
      expect(backdropElement).toBeInTheDocument();
    });

    it('should use appropriate border styling', () => {
      const { container } = render(<TacticsBoardPage />);
      
      const borderedElement = container.querySelector('.border-slate-700\\/50');
      expect(borderedElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<TacticsBoardPage />);

      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('should maintain focus management across layout changes', () => {
      const { rerender } = render(<TacticsBoardPage />);

      // Switch to presentation mode
      mockUIContext.uiState = createMockUIState({ isPresentationMode: true });
      rerender(<TacticsBoardPage />);

      // Essential elements should still be accessible
      expect(screen.getByTestId('soccer-field')).toBeInTheDocument();
      expect(screen.getByTestId('presentation-controls')).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      render(<TacticsBoardPage />);

      // Tab navigation should work through components
      await user.tab();
      
      // At least one focusable element should be available
      const focusedElement = document.activeElement;
      expect(focusedElement).not.toBe(document.body);
    });
  });

  describe('Performance', () => {
    it('should use React.memo for optimization', () => {
      // The component is wrapped with React.memo
      expect(TacticsBoardPage.displayName).toBe('TacticsBoardPage');
    });

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<TacticsBoardPage />);
      
      // Mock context values should not change
      const initialRenderCount = mockTacticsContext.dispatch.mock.calls.length;
      
      // Rerender with same props
      rerender(<TacticsBoardPage />);
      
      // No additional dispatches should have been made
      expect(mockTacticsContext.dispatch.mock.calls.length).toBe(initialRenderCount);
    });
  });

  describe('Error Boundaries', () => {
    it('should handle component errors gracefully', () => {
      // Mock a component that throws an error
      vi.mocked(screen.getByTestId).mockImplementation(() => {
        throw new Error('Component error');
      });

      expect(() => {
        render(<TacticsBoardPage />);
      }).not.toThrow();
    });
  });
});