import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerToken } from '../../../components/tactics/PlayerToken';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  PanInfo: vi.fn(),
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
  useTransform: () => ({ get: () => 0 })
}));

// Mock PLAYER_ROLES
vi.mock('../../../constants', () => ({
  PLAYER_ROLES: [
    { id: 'striker', name: 'Striker', abbreviation: 'ST', color: '#ff4444' },
    { id: 'midfielder', name: 'Midfielder', abbreviation: 'MF', color: '#44ff44' },
    { id: 'defender', name: 'Defender', abbreviation: 'DF', color: '#4444ff' }
  ]
}));

describe('PlayerToken', () => {
  const mockPlayer = {
    id: 'player-1',
    name: 'Test Player',
    roleId: 'striker',
    rating: 85,
    number: 9,
    age: 25,
    pace: 80,
    technical: 85
  };

  const mockProps = {
    player: mockPlayer,
    position: { x: 50, y: 50 },
    isSelected: false,
    isDragging: false,
    isValid: true,
    onDragStart: vi.fn(),
    onDrag: vi.fn(),
    onDragEnd: vi.fn(),
    onSelect: vi.fn(),
    isMobile: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 56,
      height: 56,
      top: 0,
      left: 0,
      bottom: 56,
      right: 56,
      toJSON: vi.fn()
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<PlayerToken {...mockProps} />);
      expect(screen.getByTestId('player-token-player-1')).toBeInTheDocument();
    });

    it('should display player number', () => {
      render(<PlayerToken {...mockProps} />);
      expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('should display role abbreviation when no number', () => {
      const playerWithoutNumber = { ...mockPlayer, number: undefined };
      render(<PlayerToken {...mockProps} player={playerWithoutNumber} />);
      expect(screen.getByText('ST')).toBeInTheDocument();
    });

    it('should display player rating', () => {
      render(<PlayerToken {...mockProps} />);
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('should apply correct position styling', () => {
      render(<PlayerToken {...mockProps} />);
      const token = screen.getByTestId('player-token-player-1');
      expect(token).toHaveStyle({
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      });
    });
  });

  describe('Selection State', () => {
    it('should show selection styling when selected', () => {
      render(<PlayerToken {...mockProps} isSelected={true} />);
      const tokenContainer = screen.getByTestId('player-token-container');
      expect(tokenContainer).toHaveClass('border-yellow-400');
    });

    it('should show selection ring when selected', () => {
      render(<PlayerToken {...mockProps} isSelected={true} />);
      expect(screen.getByTestId('selection-ring')).toBeInTheDocument();
    });

    it('should call onSelect when clicked', async () => {
      const user = userEvent.setup();
      render(<PlayerToken {...mockProps} />);
      
      const token = screen.getByTestId('player-token-player-1');
      await user.click(token);
      
      expect(mockProps.onSelect).toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('should call onDragStart when drag begins', () => {
      render(<PlayerToken {...mockProps} />);
      
      const token = screen.getByTestId('player-token-container');
      fireEvent.dragStart(token);
      
      expect(mockProps.onDragStart).toHaveBeenCalledWith({ x: 50, y: 50 });
    });

    it('should call onDrag during drag operation', () => {
      render(<PlayerToken {...mockProps} />);
      
      const token = screen.getByTestId('player-token-container');
      fireEvent.drag(token, { clientX: 100, clientY: 150 });
      
      expect(mockProps.onDrag).toHaveBeenCalled();
    });

    it('should call onDragEnd when drag ends', () => {
      render(<PlayerToken {...mockProps} />);
      
      const token = screen.getByTestId('player-token-container');
      fireEvent.dragEnd(token);
      
      expect(mockProps.onDragEnd).toHaveBeenCalled();
    });

    it('should show drag styling when dragging', () => {
      render(<PlayerToken {...mockProps} isDragging={true} />);
      const token = screen.getByTestId('player-token-container');
      expect(token).toHaveClass('cursor-grabbing');
    });

    it('should show invalid styling when drag is invalid', () => {
      render(<PlayerToken {...mockProps} isDragging={true} isValid={false} />);
      expect(screen.getByTestId('drag-invalid-indicator')).toBeInTheDocument();
    });
  });

  describe('Player Stats Tooltip', () => {
    it('should show tooltip on hover (desktop)', async () => {
      const user = userEvent.setup();
      render(<PlayerToken {...mockProps} />);
      
      const token = screen.getByTestId('player-token-player-1');
      await user.hover(token);
      
      await waitFor(() => {
        expect(screen.getByTestId('player-stats-tooltip')).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      const user = userEvent.setup();
      render(<PlayerToken {...mockProps} />);
      
      const token = screen.getByTestId('player-token-player-1');
      await user.hover(token);
      await user.unhover(token);
      
      await waitFor(() => {
        expect(screen.queryByTestId('player-stats-tooltip')).not.toBeInTheDocument();
      });
    });

    it('should display player information in tooltip', async () => {
      const user = userEvent.setup();
      render(<PlayerToken {...mockProps} />);
      
      const token = screen.getByTestId('player-token-player-1');
      await user.hover(token);
      
      await waitFor(() => {
        expect(screen.getByText('Test Player')).toBeInTheDocument();
        expect(screen.getByText('Striker')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument(); // Rating
        expect(screen.getByText('25')).toBeInTheDocument(); // Age
        expect(screen.getByText('80')).toBeInTheDocument(); // Speed
        expect(screen.getByText('85')).toBeInTheDocument(); // Skill
      });
    });
  });

  describe('Mobile Support', () => {
    beforeEach(() => {
      // Mock touch events
      Object.defineProperty(navigator, 'vibrate', {
        value: vi.fn(),
        writable: true
      });
    });

    it('should handle long press on mobile', async () => {
      const user = userEvent.setup();
      render(<PlayerToken {...mockProps} isMobile={true} />);
      
      const token = screen.getByTestId('player-token-player-1');
      
      // Simulate touch start
      fireEvent.touchStart(token);
      
      // Wait for long press timeout
      await waitFor(() => {
        expect(screen.getByTestId('player-stats-tooltip')).toBeInTheDocument();
      }, { timeout: 600 });
    });

    it('should trigger haptic feedback on long press', async () => {
      render(<PlayerToken {...mockProps} isMobile={true} />);
      
      const token = screen.getByTestId('player-token-player-1');
      fireEvent.touchStart(token);
      
      await waitFor(() => {
        expect(navigator.vibrate).toHaveBeenCalledWith(50);
      }, { timeout: 600 });
    });

    it('should not show hover tooltip on mobile', async () => {
      const user = userEvent.setup();
      render(<PlayerToken {...mockProps} isMobile={true} />);
      
      const token = screen.getByTestId('player-token-player-1');
      await user.hover(token);
      
      // Should not show tooltip on mobile hover
      expect(screen.queryByTestId('player-stats-tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Role and Rating Display', () => {
    it('should use role color for token background', () => {
      render(<PlayerToken {...mockProps} />);
      const tokenMain = screen.getByTestId('player-token-main');
      expect(tokenMain).toHaveStyle({
        background: expect.stringContaining('#ff4444')
      });
    });

    it('should display role indicator', () => {
      render(<PlayerToken {...mockProps} />);
      expect(screen.getByTestId('role-indicator')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument(); // First letter of 'ST'
    });

    it('should use appropriate rating color', () => {
      // High rating (90+) should be green
      const highRatedPlayer = { ...mockPlayer, rating: 95 };
      render(<PlayerToken {...mockProps} player={highRatedPlayer} />);
      
      const ratingIndicator = screen.getByTestId('rating-indicator');
      expect(ratingIndicator).toHaveStyle({
        backgroundColor: '#10b981'
      });
    });

    it('should handle missing rating gracefully', () => {
      const playerWithoutRating = { ...mockPlayer, rating: undefined };
      render(<PlayerToken {...mockProps} player={playerWithoutRating} />);
      
      expect(screen.getByText('75')).toBeInTheDocument(); // Default rating
    });
  });

  describe('Animation and Motion', () => {
    it('should apply scale animation on selection', () => {
      render(<PlayerToken {...mockProps} isSelected={true} />);
      const tokenContainer = screen.getByTestId('player-token-container');
      expect(tokenContainer).toHaveAttribute('data-animate-scale', '1.1');
    });

    it('should apply rotation during drag', () => {
      render(<PlayerToken {...mockProps} isDragging={true} />);
      const tokenContainer = screen.getByTestId('player-token-container');
      expect(tokenContainer).toHaveAttribute('data-animate-rotate', '5');
    });

    it('should apply shadow animation during drag', () => {
      render(<PlayerToken {...mockProps} isDragging={true} />);
      const tokenShadow = screen.getByTestId('token-shadow');
      expect(tokenShadow).toHaveClass('scale-120', 'opacity-60');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<PlayerToken {...mockProps} />);
      const token = screen.getByTestId('player-token-player-1');
      
      expect(token).toHaveAttribute('role', 'button');
      expect(token).toHaveAttribute('aria-label', expect.stringContaining('Test Player'));
      expect(token).toHaveAttribute('tabindex', '0');
    });

    it('should support keyboard interaction', async () => {
      const user = userEvent.setup();
      render(<PlayerToken {...mockProps} />);
      
      const token = screen.getByTestId('player-token-player-1');
      
      // Tab to focus
      await user.tab();
      expect(token).toHaveFocus();
      
      // Enter to select
      await user.keyboard('{Enter}');
      expect(mockProps.onSelect).toHaveBeenCalled();
    });

    it('should announce selection state to screen readers', () => {
      render(<PlayerToken {...mockProps} isSelected={true} />);
      const token = screen.getByTestId('player-token-player-1');
      expect(token).toHaveAttribute('aria-pressed', 'true');
    });

    it('should announce drag state to screen readers', () => {
      render(<PlayerToken {...mockProps} isDragging={true} />);
      const token = screen.getByTestId('player-token-player-1');
      expect(token).toHaveAttribute('aria-grabbed', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing player data gracefully', () => {
      const invalidPlayer = { ...mockPlayer, name: '', roleId: null };
      expect(() => 
        render(<PlayerToken {...mockProps} player={invalidPlayer} />)
      ).not.toThrow();
    });

    it('should handle invalid position values', () => {
      const invalidPosition = { x: NaN, y: Infinity };
      expect(() => 
        render(<PlayerToken {...mockProps} position={invalidPosition} />)
      ).not.toThrow();
    });

    it('should handle missing role data', () => {
      const playerWithUnknownRole = { ...mockPlayer, roleId: 'unknown-role' };
      render(<PlayerToken {...mockProps} player={playerWithUnknownRole} />);
      
      // Should fallback to role ID
      expect(screen.getByText('UN')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should memoize expensive calculations', () => {
      const { rerender } = render(<PlayerToken {...mockProps} />);
      
      // Re-render with same props
      rerender(<PlayerToken {...mockProps} />);
      
      // Should not recalculate role data
      expect(screen.getByText('ST')).toBeInTheDocument();
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(Element.prototype, 'removeEventListener');
      
      const { unmount } = render(<PlayerToken {...mockProps} isMobile={true} />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function));
    });
  });
});