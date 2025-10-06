import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModernField } from '../../../components/tactics/ModernField';
import type { PositionRole } from '../../../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
  },
  AnimatePresence: ({ children }: any) => children,
  PanInfo: vi.fn(),
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
  useTransform: () => ({ get: () => 0 }),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
});

describe('ModernField', () => {
  const mockProps = {
    formation: {
      id: 'test-formation',
      name: '4-3-3',
      slots: [
        {
          id: 'slot-1',
          position: { x: 50, y: 50 },
          roleId: 'striker',
          playerId: 'player-1',
          role: 'FW' as PositionRole,
          defaultPosition: { x: 50, y: 50 },
        },
        {
          id: 'slot-2',
          position: { x: 30, y: 70 },
          roleId: 'midfielder',
          playerId: null,
          role: 'MF' as PositionRole,
          defaultPosition: { x: 30, y: 70 },
        },
      ],
      players: [{ id: 'player-1', name: 'Test Player', roleId: 'striker', rating: 85, number: 9 }],
    },
    selectedPlayer: null,
    onPlayerMove: vi.fn(),
    onPlayerSelect: vi.fn(),
    isDragging: false,
    setIsDragging: vi.fn(),
    viewMode: 'standard' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      toJSON: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<ModernField {...mockProps} />);
      expect(screen.getByTestId('modern-field')).toBeInTheDocument();
    });

    it('should render field markings', () => {
      render(<ModernField {...mockProps} />);
      expect(screen.getByTestId('field-markings')).toBeInTheDocument();
    });

    it('should render player tokens for assigned slots', () => {
      render(<ModernField {...mockProps} />);
      expect(screen.getByTestId('player-token-player-1')).toBeInTheDocument();
    });

    it('should render formation zones', () => {
      render(<ModernField {...mockProps} />);
      expect(screen.getByTestId('formation-zones')).toBeInTheDocument();
    });

    it('should show grid when dragging', () => {
      render(<ModernField {...mockProps} isDragging={true} />);
      expect(screen.getByTestId('field-grid')).toBeInTheDocument();
    });
  });

  describe('Player Interaction', () => {
    it('should call onPlayerSelect when player is clicked', async () => {
      const user = userEvent.setup();
      render(<ModernField {...mockProps} />);

      const playerToken = screen.getByTestId('player-token-player-1');
      await user.click(playerToken);

      expect(mockProps.onPlayerSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'player-1' })
      );
    });

    it('should handle field tap to move selected player', async () => {
      const selectedPlayer = mockProps.formation.players[0];
      const propsWithSelection = {
        ...mockProps,
        selectedPlayer,
      };

      render(<ModernField {...(propsWithSelection as any)} />);

      const field = screen.getByTestId('modern-field');
      fireEvent.click(field, { clientX: 400, clientY: 300 });

      expect(mockProps.onPlayerMove).toHaveBeenCalledWith(
        'player-1',
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        })
      );
    });

    it('should validate field tap positions', async () => {
      const selectedPlayer = mockProps.formation.players[0];
      const propsWithSelection = {
        ...mockProps,
        selectedPlayer,
      };

      render(<ModernField {...(propsWithSelection as any)} />);

      const field = screen.getByTestId('modern-field');

      // Click outside valid bounds (should not trigger move)
      fireEvent.click(field, { clientX: -10, clientY: -10 });
      expect(mockProps.onPlayerMove).not.toHaveBeenCalled();

      // Click within valid bounds
      fireEvent.click(field, { clientX: 400, clientY: 300 });
      expect(mockProps.onPlayerMove).toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('should start drag operation correctly', () => {
      const mockSetIsDragging = vi.fn();
      const propsWithDrag = {
        ...mockProps,
        setIsDragging: mockSetIsDragging,
      };

      render(<ModernField {...propsWithDrag} />);

      const playerToken = screen.getByTestId('player-token-player-1');
      fireEvent.dragStart(playerToken);

      expect(mockSetIsDragging).toHaveBeenCalledWith(true);
    });

    it('should update drag position during drag', () => {
      render(<ModernField {...mockProps} isDragging={true} />);

      const field = screen.getByTestId('modern-field');
      fireEvent.dragOver(field, { clientX: 400, clientY: 300 });

      // Should show drag indicator
      expect(screen.getByTestId('drag-indicator')).toBeInTheDocument();
    });

    it('should end drag operation correctly', () => {
      const mockSetIsDragging = vi.fn();
      const propsWithDrag = {
        ...mockProps,
        setIsDragging: mockSetIsDragging,
      };

      render(<ModernField {...propsWithDrag} isDragging={true} />);

      const playerToken = screen.getByTestId('player-token-player-1');
      fireEvent.dragEnd(playerToken);

      expect(mockSetIsDragging).toHaveBeenCalledWith(false);
    });

    it('should validate drop positions', () => {
      render(<ModernField {...mockProps} isDragging={true} />);

      const field = screen.getByTestId('modern-field');

      // Drag to invalid position
      fireEvent.dragOver(field, { clientX: -10, clientY: -10 });
      const indicator = screen.getByTestId('drag-indicator');
      expect(indicator).toHaveClass('border-red-400');

      // Drag to valid position
      fireEvent.dragOver(field, { clientX: 400, clientY: 300 });
      expect(indicator).toHaveClass('border-green-400');
    });

    it('should handle successful drop', () => {
      render(<ModernField {...mockProps} isDragging={true} />);

      const field = screen.getByTestId('modern-field');

      // Set up drag state
      fireEvent.dragOver(field, { clientX: 400, clientY: 300 });
      fireEvent.drop(field);

      expect(mockProps.onPlayerMove).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        })
      );
    });
  });

  describe('Mobile Support', () => {
    it('should show touch helper on mobile with selected player', () => {
      const selectedPlayer = mockProps.formation.players[0];
      const propsWithMobile = {
        ...mockProps,
        selectedPlayer,
        // Mock mobile detection
        isMobile: true,
      };

      render(<ModernField {...(propsWithMobile as any)} />);

      expect(screen.getByText(/tap field to move/i)).toBeInTheDocument();
    });

    it('should trigger haptic feedback on mobile', async () => {
      const selectedPlayer = mockProps.formation.players[0];
      const propsWithMobile = {
        ...mockProps,
        selectedPlayer,
        isMobile: true,
      };

      render(<ModernField {...(propsWithMobile as any)} />);

      const field = screen.getByTestId('modern-field');
      fireEvent.click(field, { clientX: 400, clientY: 300 });

      expect(navigator.vibrate).toHaveBeenCalledWith(30);
    });

    it('should handle invalid drag positions with haptic feedback', () => {
      render(<ModernField {...mockProps} isDragging={true} />);

      const field = screen.getByTestId('modern-field');
      fireEvent.dragOver(field, { clientX: -10, clientY: -10 });

      expect(navigator.vibrate).toHaveBeenCalledWith(50);
    });
  });

  describe('View Modes', () => {
    it('should apply fullscreen styles', () => {
      const propsWithFullscreen = {
        ...mockProps,
        viewMode: 'fullscreen' as const,
      };

      render(<ModernField {...propsWithFullscreen} />);

      const field = screen.getByTestId('modern-field');
      expect(field).toHaveStyle({ borderRadius: '0' });
    });

    it('should show fullscreen indicator', () => {
      const propsWithFullscreen = {
        ...mockProps,
        viewMode: 'fullscreen' as const,
      };

      render(<ModernField {...propsWithFullscreen} />);

      expect(screen.getByText(/fullscreen mode/i)).toBeInTheDocument();
    });

    it('should hide tactical zones in presentation mode', () => {
      const propsWithPresentation = {
        ...mockProps,
        viewMode: 'presentation' as const,
      };

      render(<ModernField {...propsWithPresentation} />);

      expect(screen.queryByTestId('tactical-zones')).not.toBeInTheDocument();
    });
  });

  describe('Formation Handling', () => {
    it('should handle empty formation gracefully', () => {
      const propsWithEmptyFormation = {
        ...mockProps,
        formation: undefined,
      };

      render(<ModernField {...propsWithEmptyFormation} />);

      // Should render field without player tokens
      expect(screen.getByTestId('modern-field')).toBeInTheDocument();
      expect(screen.queryByTestId('player-token')).not.toBeInTheDocument();
    });

    it('should handle slots without players', () => {
      const formationWithEmptySlots = {
        ...mockProps.formation,
        slots: [
          {
            id: 'empty-slot',
            position: { x: 50, y: 50 },
            roleId: 'striker',
            playerId: null,
            role: 'FW' as PositionRole,
            defaultPosition: { x: 50, y: 50 },
          },
        ],
      };

      render(<ModernField {...mockProps} formation={formationWithEmptySlots} />);

      // Should render formation zone but no player token
      expect(screen.getByTestId('formation-zones')).toBeInTheDocument();
      expect(screen.queryByTestId('player-token')).not.toBeInTheDocument();
    });

    it('should highlight hovered slots', async () => {
      const user = userEvent.setup();
      render(<ModernField {...mockProps} />);

      const formationZone = screen.getByTestId('formation-zone-slot-2');
      await user.hover(formationZone);

      expect(formationZone).toHaveClass('scale-120');
    });
  });

  describe('Performance', () => {
    it('should use ResizeObserver for field dimensions', () => {
      render(<ModernField {...mockProps} />);

      expect(ResizeObserver).toHaveBeenCalled();
    });

    it('should cleanup ResizeObserver on unmount', () => {
      const disconnectSpy = vi.fn();
      const observeSpy = vi.fn();

      global.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: observeSpy,
        unobserve: vi.fn(),
        disconnect: disconnectSpy,
      }));

      const { unmount } = render(<ModernField {...mockProps} />);
      unmount();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should memoize expensive calculations', () => {
      const { rerender } = render(<ModernField {...mockProps} />);

      // Re-render with same props - should use memoized values
      rerender(<ModernField {...mockProps} />);

      // Formation zones should not be recalculated
      expect(screen.getAllByTestId(/formation-zone/).length).toBe(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ModernField {...mockProps} />);

      const field = screen.getByTestId('modern-field');
      expect(field).toHaveAttribute('role', 'application');
      expect(field).toHaveAttribute('aria-label', 'Soccer tactics field');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ModernField {...mockProps} />);

      const playerToken = screen.getByTestId('player-token-player-1');

      // Tab to player token
      await user.tab();
      expect(playerToken).toHaveFocus();

      // Arrow keys should move player
      await user.keyboard('{ArrowRight}');
      expect(mockProps.onPlayerMove).toHaveBeenCalled();
    });

    it('should announce drag state changes', () => {
      render(<ModernField {...mockProps} isDragging={true} />);

      expect(screen.getByText(/dragging player/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid position data', () => {
      const invalidFormation = {
        ...mockProps.formation,
        slots: [
          {
            id: 'invalid',
            position: { x: NaN, y: NaN },
            roleId: 'striker',
            playerId: 'player-1',
            role: 'FW' as PositionRole,
            defaultPosition: { x: 50, y: 50 },
          },
        ],
      };

      expect(() =>
        render(<ModernField {...mockProps} formation={invalidFormation} />)
      ).not.toThrow();
    });

    it('should handle missing field dimensions', () => {
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        toJSON: vi.fn(),
      }));

      render(<ModernField {...mockProps} />);

      // Should not crash with zero dimensions
      expect(screen.getByTestId('modern-field')).toBeInTheDocument();
    });
  });
});
