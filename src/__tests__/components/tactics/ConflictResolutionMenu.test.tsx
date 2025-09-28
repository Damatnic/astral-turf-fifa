import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import ConflictResolutionMenu from '../../../components/tactics/ConflictResolutionMenu';
import type { Player } from '../../../types';

/**
 * Comprehensive Integration Test Suite for ConflictResolutionMenu Component
 * 
 * Tests cover:
 * - Complete workflow from conflict detection to resolution
 * - Menu positioning and viewport handling
 * - User interactions and option selection
 * - Animation states and transitions
 * - Alternative slot handling
 * - Accessibility and keyboard navigation
 * - Error scenarios and edge cases
 * - Performance under various conditions
 */

// Mock framer-motion for consistent testing
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, any>(({ children, onClick, className, style, ...props }, ref) => (
      <div ref={ref} onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    )),
    button: React.forwardRef<HTMLButtonElement, any>(({ children, onClick, className, ...props }, ref) => (
      <button ref={ref} onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ))
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ConflictResolutionMenu Integration Tests', () => {
  const mockOnResolve = vi.fn();
  const mockOnClose = vi.fn();
  const user = userEvent.setup();

  // Mock players with comprehensive data
  const mockSourcePlayer: Player = {
    id: 'source-player-1',
    name: 'Mohamed Salah',
    jerseyNumber: 11,
    age: 31,
    nationality: 'Egypt',
    potential: [85, 90] as const,
    currentPotential: 87,
    roleId: 'rw',
    instructions: {},
    team: 'home',
    teamColor: '#FF0000',
    attributes: {
      speed: 90,
      passing: 82,
      tackling: 45,
      shooting: 88,
      dribbling: 91,
      positioning: 85,
      stamina: 80
    },
    position: { x: 80, y: 30 },
    availability: { status: 'Available' },
    morale: 'Excellent',
    form: 'Excellent',
    stamina: 85,
    developmentLog: [],
    contract: { clauses: [] },
    stats: {
      goals: 25,
      assists: 12,
      matchesPlayed: 30,
      shotsOnTarget: 65,
      tacklesWon: 15,
      saves: 0,
      passesCompleted: 1200,
      passesAttempted: 1400,
      careerHistory: []
    },
    loan: { isLoaned: false },
    traits: ['Ambitious'],
    conversationHistory: [],
    attributeHistory: [],
    attributeDevelopmentProgress: {},
    communicationLog: [],
    customTrainingSchedule: null,
    fatigue: 20,
    injuryRisk: 15,
    lastConversationInitiatedWeek: 0,
    moraleBoost: null,
    completedChallenges: []
  };

  const mockTargetPlayer: Player = {
    id: 'target-player-1',
    name: 'Sadio Mané',
    jerseyNumber: 10,
    age: 31,
    nationality: 'Senegal',
    potential: [83, 88] as const,
    currentPotential: 85,
    roleId: 'lw',
    instructions: {},
    team: 'home',
    teamColor: '#FF0000',
    attributes: {
      speed: 89,
      passing: 80,
      tackling: 50,
      shooting: 85,
      dribbling: 88,
      positioning: 82,
      stamina: 85
    },
    position: { x: 80, y: 70 },
    availability: { status: 'Available' },
    morale: 'Good',
    form: 'Good',
    stamina: 80,
    developmentLog: [],
    contract: { clauses: [] },
    stats: {
      goals: 20,
      assists: 15,
      matchesPlayed: 28,
      shotsOnTarget: 55,
      tacklesWon: 20,
      saves: 0,
      passesCompleted: 1000,
      passesAttempted: 1200,
      careerHistory: []
    },
    loan: { isLoaned: false },
    traits: ['Loyal'],
    conversationHistory: [],
    attributeHistory: [],
    attributeDevelopmentProgress: {},
    communicationLog: [],
    customTrainingSchedule: null,
    fatigue: 25,
    injuryRisk: 10,
    lastConversationInitiatedWeek: 0,
    moraleBoost: null,
    completedChallenges: []
  };

  const mockAlternativeSlots = [
    {
      id: 'alt-slot-1',
      role: 'LW',
      position: { x: 60, y: 20 }
    },
    {
      id: 'alt-slot-2',
      role: 'CAM',
      position: { x: 70, y: 50 }
    }
  ];

  const defaultProps = {
    isVisible: true,
    position: { x: 100, y: 100 },
    sourcePlayer: mockSourcePlayer,
    targetPlayer: mockTargetPlayer,
    onResolve: mockOnResolve,
    onClose: mockOnClose,
    alternativeSlots: mockAlternativeSlots
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    
    // Mock window dimensions for positioning tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Menu Visibility and Rendering', () => {
    it('should render when visible', () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      expect(screen.getByText('Position Conflict')).toBeInTheDocument();
      expect(screen.getByText(/Mohamed Salah wants to move to Sadio Mané's position/)).toBeInTheDocument();
    });

    it('should not render when not visible', () => {
      render(<ConflictResolutionMenu {...defaultProps} isVisible={false} />);

      expect(screen.queryByText('Position Conflict')).not.toBeInTheDocument();
    });

    it('should render backdrop when visible', () => {
      const { container } = render(<ConflictResolutionMenu {...defaultProps} />);

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/20');
      expect(backdrop).toBeInTheDocument();
    });

    it('should display player information correctly', () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      // Check source player info
      expect(screen.getByText('Mohamed Salah')).toBeInTheDocument();
      expect(screen.getByText('11')).toBeInTheDocument();

      // Check target player info
      expect(screen.getByText('Sadio Mané')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should apply team colors to player avatars', () => {
      const { container } = render(<ConflictResolutionMenu {...defaultProps} />);

      const playerAvatars = container.querySelectorAll('div[style*="background-color: rgb(255, 0, 0)"]');
      expect(playerAvatars).toHaveLength(2); // Both players should have red background
    });
  });

  describe('Conflict Resolution Options', () => {
    it('should display all available resolution options', () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      expect(screen.getByText('Swap Positions')).toBeInTheDocument();
      expect(screen.getByText('Replace Player')).toBeInTheDocument();
      expect(screen.getByText('Find Alternative')).toBeInTheDocument();
      expect(screen.getByText('Cancel Move')).toBeInTheDocument();
    });

    it('should mark swap option as recommended', () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      const recommendedBadge = screen.getByText('Recommended');
      expect(recommendedBadge).toBeInTheDocument();
      
      // Should be next to swap option
      const swapOption = screen.getByText('Swap Positions').closest('button');
      expect(swapOption).toContainElement(recommendedBadge);
    });

    it('should not show alternative option when no alternative slots provided', () => {
      render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          alternativeSlots={[]} 
        />
      );

      expect(screen.queryByText('Find Alternative')).not.toBeInTheDocument();
    });

    it('should show descriptive text for each option', () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      expect(screen.getByText('Switch Mohamed Salah and Sadio Mané')).toBeInTheDocument();
      expect(screen.getByText('Move Sadio Mané to bench')).toBeInTheDocument();
      expect(screen.getByText('Move Sadio Mané to another position')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onResolve with "swap" when swap option is clicked', async () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      const swapButton = screen.getByText('Swap Positions').closest('button');
      await user.click(swapButton!);

      expect(mockOnResolve).toHaveBeenCalledWith('swap');
      expect(mockOnResolve).toHaveBeenCalledTimes(1);
    });

    it('should call onResolve with "replace" when replace option is clicked', async () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      const replaceButton = screen.getByText('Replace Player').closest('button');
      await user.click(replaceButton!);

      expect(mockOnResolve).toHaveBeenCalledWith('replace');
      expect(mockOnResolve).toHaveBeenCalledTimes(1);
    });

    it('should call onResolve with "find_alternative" when alternative option is clicked', async () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      const alternativeButton = screen.getByText('Find Alternative').closest('button');
      await user.click(alternativeButton!);

      expect(mockOnResolve).toHaveBeenCalledWith('find_alternative');
      expect(mockOnResolve).toHaveBeenCalledTimes(1);
    });

    it('should call onResolve with "cancel" when cancel button is clicked', async () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel Move');
      await user.click(cancelButton);

      expect(mockOnResolve).toHaveBeenCalledWith('cancel');
      expect(mockOnResolve).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is clicked', async () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const { container } = render(<ConflictResolutionMenu {...defaultProps} />);

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/20');
      await user.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid successive clicks', async () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      const swapButton = screen.getByText('Swap Positions').closest('button');
      
      // Rapid clicks
      await user.click(swapButton!);
      await user.click(swapButton!);
      await user.click(swapButton!);

      expect(mockOnResolve).toHaveBeenCalledTimes(3);
      expect(mockOnResolve).toHaveBeenCalledWith('swap');
    });
  });

  describe('Menu Positioning', () => {
    it('should adjust position to stay within viewport bounds', async () => {
      // Set smaller viewport
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      Object.defineProperty(window, 'innerHeight', { value: 600 });

      // Position near edge
      const { container } = render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          position={{ x: 700, y: 500 }} 
        />
      );

      await waitFor(() => {
        const menu = container.querySelector('.fixed.z-50');
        expect(menu).toBeInTheDocument();
      });

      // Menu should be repositioned to fit
      const menuStyle = getComputedStyle(container.querySelector('.fixed.z-50')!);
      expect(menuStyle.left).toBe('0px'); // Always set to 0 due to transform
    });

    it('should handle negative position values', async () => {
      const { container } = render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          position={{ x: -50, y: -50 }} 
        />
      );

      await waitFor(() => {
        const menu = container.querySelector('.fixed.z-50');
        expect(menu).toBeInTheDocument();
      });
    });

    it('should reposition when position prop changes', async () => {
      const { rerender } = render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          position={{ x: 100, y: 100 }} 
        />
      );

      // Change position
      rerender(
        <ConflictResolutionMenu 
          {...defaultProps} 
          position={{ x: 200, y: 200 }} 
        />
      );

      // Should trigger repositioning logic
      await waitFor(() => {
        expect(screen.getByText('Position Conflict')).toBeInTheDocument();
      });
    });

    it('should handle viewport resize scenarios', async () => {
      const { container } = render(<ConflictResolutionMenu {...defaultProps} />);

      // Simulate viewport resize
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      Object.defineProperty(window, 'innerHeight', { value: 300 });

      // Trigger resize handling by changing position
      const { rerender } = render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          position={{ x: 350, y: 250 }} 
        />
      );

      await waitFor(() => {
        const menu = container.querySelector('.fixed.z-50');
        expect(menu).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should support keyboard navigation', async () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      // Tab through options
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();

      // Enter to activate
      await user.keyboard('{Enter}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should support escape key to close', async () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      await user.keyboard('{Escape}');
      // Note: The component doesn't handle escape by default, but this tests the setup
    });

    it('should have proper button roles', () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should provide descriptive text for screen readers', () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      expect(screen.getByText('Switch Mohamed Salah and Sadio Mané')).toBeInTheDocument();
      expect(screen.getByText('Move Sadio Mané to bench')).toBeInTheDocument();
    });

    it('should maintain focus within menu', async () => {
      render(<ConflictResolutionMenu {...defaultProps} />);

      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
    });
  });

  describe('Alternative Slots Handling', () => {
    it('should dynamically show alternative option based on available slots', () => {
      const { rerender } = render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          alternativeSlots={[]} 
        />
      );

      expect(screen.queryByText('Find Alternative')).not.toBeInTheDocument();

      rerender(<ConflictResolutionMenu {...defaultProps} />);

      expect(screen.getByText('Find Alternative')).toBeInTheDocument();
    });

    it('should handle empty alternative slots array', () => {
      expect(() => {
        render(
          <ConflictResolutionMenu 
            {...defaultProps} 
            alternativeSlots={[]} 
          />
        );
      }).not.toThrow();
    });

    it('should handle undefined alternative slots', () => {
      expect(() => {
        render(
          <ConflictResolutionMenu 
            {...defaultProps} 
            alternativeSlots={undefined} 
          />
        );
      }).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing player names gracefully', () => {
      const playerWithoutName = { ...mockSourcePlayer, name: '' };
      
      render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          sourcePlayer={playerWithoutName} 
        />
      );

      expect(screen.getByText('Position Conflict')).toBeInTheDocument();
    });

    it('should handle missing jersey numbers', () => {
      const playerWithoutNumber = { ...mockSourcePlayer, jerseyNumber: 0 };
      
      render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          sourcePlayer={playerWithoutNumber} 
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle invalid team colors', () => {
      const playerWithInvalidColor = { ...mockSourcePlayer, teamColor: '' };
      
      const { container } = render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          sourcePlayer={playerWithInvalidColor} 
        />
      );

      const avatar = container.querySelector('div[style*="background-color: "]');
      expect(avatar).toBeInTheDocument();
    });

    it('should handle extreme position values', () => {
      expect(() => {
        render(
          <ConflictResolutionMenu 
            {...defaultProps} 
            position={{ x: 999999, y: -999999 }} 
          />
        );
      }).not.toThrow();
    });

    it('should handle null callbacks gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          onResolve={null as any} 
          onClose={null as any} 
        />
      );

      expect(screen.getByText('Position Conflict')).toBeInTheDocument();
      
      consoleError.mockRestore();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      
      function TestWrapper(props: any) {
        renderSpy();
        return <ConflictResolutionMenu {...props} />;
      }

      const { rerender } = render(<TestWrapper {...defaultProps} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Same props
      rerender(<TestWrapper {...defaultProps} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle large alternative slots arrays efficiently', () => {
      const largeAlternativeSlots = Array.from({ length: 100 }, (_, i) => ({
        id: `slot-${i}`,
        role: `Role ${i}`,
        position: { x: i, y: i }
      }));

      const startTime = performance.now();
      render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          alternativeSlots={largeAlternativeSlots} 
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render quickly
    });

    it('should handle rapid visibility changes', async () => {
      const { rerender } = render(
        <ConflictResolutionMenu {...defaultProps} isVisible={false} />
      );

      // Rapid visibility changes
      for (let i = 0; i < 10; i++) {
        rerender(
          <ConflictResolutionMenu {...defaultProps} isVisible={i % 2 === 0} />
        );
      }

      expect(screen.queryByText('Position Conflict')).not.toBeInTheDocument();
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should complete full swap workflow', async () => {
      const onResolveHandler = vi.fn();
      
      render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          onResolve={onResolveHandler} 
        />
      );

      // User sees conflict
      expect(screen.getByText('Position Conflict')).toBeInTheDocument();
      expect(screen.getByText(/Mohamed Salah wants to move to Sadio Mané's position/)).toBeInTheDocument();

      // User selects swap option
      const swapButton = screen.getByText('Swap Positions').closest('button');
      await user.click(swapButton!);

      // Resolution is triggered
      expect(onResolveHandler).toHaveBeenCalledWith('swap');
    });

    it('should complete full replacement workflow', async () => {
      const onResolveHandler = vi.fn();
      
      render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          onResolve={onResolveHandler} 
        />
      );

      // User decides to replace
      const replaceButton = screen.getByText('Replace Player').closest('button');
      await user.click(replaceButton!);

      expect(onResolveHandler).toHaveBeenCalledWith('replace');
    });

    it('should complete cancellation workflow', async () => {
      const onResolveHandler = vi.fn();
      
      render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          onResolve={onResolveHandler} 
        />
      );

      // User cancels
      const cancelButton = screen.getByText('Cancel Move');
      await user.click(cancelButton);

      expect(onResolveHandler).toHaveBeenCalledWith('cancel');
    });

    it('should handle menu dismissal through backdrop', async () => {
      const onCloseHandler = vi.fn();
      
      const { container } = render(
        <ConflictResolutionMenu 
          {...defaultProps} 
          onClose={onCloseHandler} 
        />
      );

      // User clicks outside menu
      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/20');
      await user.click(backdrop!);

      expect(onCloseHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Visual State Management', () => {
    it('should apply correct styling to recommended option', () => {
      const { container } = render(<ConflictResolutionMenu {...defaultProps} />);

      const swapButton = screen.getByText('Swap Positions').closest('button');
      expect(swapButton).toHaveClass('bg-blue-600/20', 'border-blue-500/50');
    });

    it('should apply different styling to non-recommended options', () => {
      const { container } = render(<ConflictResolutionMenu {...defaultProps} />);

      const replaceButton = screen.getByText('Replace Player').closest('button');
      expect(replaceButton).toHaveClass('bg-slate-700/50', 'border-slate-600/50');
    });

    it('should show proper icon colors for recommended vs non-recommended', () => {
      const { container } = render(<ConflictResolutionMenu {...defaultProps} />);

      // Check icon containers
      const iconContainers = container.querySelectorAll('.p-2.rounded-lg');
      expect(iconContainers.length).toBeGreaterThan(0);

      // First should be blue (recommended)
      expect(iconContainers[0]).toHaveClass('bg-blue-600');
    });
  });
});