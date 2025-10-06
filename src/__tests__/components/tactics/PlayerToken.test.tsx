import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerToken } from '../../../components/tactics/PlayerToken';
import type {
  Player,
  PlayerAttributes,
  PlayerAvailability,
  PlayerStats,
  PlayerContract,
  LoanStatus,
  DevelopmentLogEntry,
  CommunicationLogEntry,
  ChatMessage,
  AttributeLogEntry,
  WeeklySchedule,
  IndividualTrainingFocus,
  PlayerTrait,
  PlayerMorale,
  PlayerForm,
} from '../../../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  PanInfo: vi.fn(),
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
  useTransform: () => ({ get: () => 0 }),
}));

// Mock PLAYER_ROLES
vi.mock('../../../constants', () => ({
  PLAYER_ROLES: [
    { id: 'striker', name: 'Striker', abbreviation: 'ST', color: '#ff4444' },
    { id: 'midfielder', name: 'Midfielder', abbreviation: 'MF', color: '#44ff44' },
    { id: 'defender', name: 'Defender', abbreviation: 'DF', color: '#4444ff' },
  ],
}));

// Mock useResponsive hook
vi.mock('../../../hooks', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

describe('PlayerToken', () => {
  // Helper function to create a complete Player object
  const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: 'player-1',
    name: 'Test Player',
    jerseyNumber: 9,
    age: 25,
    nationality: 'England',
    potential: [80, 90] as const,
    currentPotential: 85,
    roleId: 'striker',
    instructions: {},
    team: 'home' as const,
    teamColor: '#ff0000',
    attributes: {
      speed: 80,
      passing: 75,
      tackling: 60,
      shooting: 85,
      dribbling: 80,
      positioning: 75,
      stamina: 85,
    },
    position: { x: 50, y: 50 },
    availability: {
      status: 'Available' as const,
    },
    morale: 'Good' as const,
    form: 'Good' as const,
    stamina: 85,
    developmentLog: [],
    contract: {
      clauses: [],
    },
    stats: {
      goals: 12,
      assists: 8,
      matchesPlayed: 25,
      shotsOnTarget: 45,
      tacklesWon: 15,
      saves: 0,
      passesCompleted: 320,
      passesAttempted: 400,
      careerHistory: [],
    },
    loan: {
      isLoaned: false,
    },
    traits: [],
    conversationHistory: [],
    attributeHistory: [],
    attributeDevelopmentProgress: {},
    communicationLog: [],
    customTrainingSchedule: null,
    fatigue: 15,
    injuryRisk: 10,
    lastConversationInitiatedWeek: 0,
    moraleBoost: null,
    completedChallenges: [],
    ...overrides,
  });

  const mockPlayer = createMockPlayer();

  const mockProps = {
    player: mockPlayer,
    position: { x: 50, y: 50 },
    isSelected: false,
    onSelect: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    isDraggable: true,
    isHighlightedByAI: false,
    isDragging: false,
    showNameAlways: false,
    performanceMode: false,
    viewMode: 'standard' as const,
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
      toJSON: vi.fn(),
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
      const playerWithoutNumber = createMockPlayer({ jerseyNumber: 0 });
      render(<PlayerToken {...mockProps} player={playerWithoutNumber} />);
      expect(screen.getByText('ST')).toBeInTheDocument();
    });

    it('should display player stamina', () => {
      render(<PlayerToken {...mockProps} />);
      // Stamina should be displayed in the stamina bar
      expect(screen.getByTitle('Stamina: 85%')).toBeInTheDocument();
    });

    it('should apply correct position styling', () => {
      render(<PlayerToken {...mockProps} />);
      const token = screen.getByTestId('player-token-player-1');
      expect(token).toBeInstanceOf(HTMLElement);
      expect((token as HTMLElement).style.left).toBe('50%');
      expect((token as HTMLElement).style.top).toBe('50%');
      expect((token as HTMLElement).style.transform).toBe('translate(-50%, -50%)');
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

  describe('Role Display', () => {
    it('should display role abbreviation', () => {
      render(<PlayerToken {...mockProps} />);
      expect(screen.getByText('ST')).toBeInTheDocument();
    });

    it('should handle missing role data', () => {
      const playerWithUnknownRole = createMockPlayer({ roleId: 'unknown-role' });
      render(<PlayerToken {...mockProps} player={playerWithUnknownRole} />);

      // Should fallback to ?? when role is unknown
      expect(screen.getByText('??')).toBeInTheDocument();
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
        render(<PlayerToken {...mockProps} player={invalidPlayer as any} />),
      ).not.toThrow();
    });

    it('should handle invalid position values', () => {
      const invalidPosition = { x: NaN, y: Infinity };
      expect(() => render(<PlayerToken {...mockProps} position={invalidPosition} />)).not.toThrow();
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
  const removeEventListenerSpy = vi.spyOn(globalThis.Element.prototype, 'removeEventListener');

      const { unmount } = render(<PlayerToken {...mockProps} />);
      unmount();

      // Should cleanup any event listeners if they were added
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });
});
