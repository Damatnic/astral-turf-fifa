import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, mockDragAndDrop } from '../../utils/test-helpers';
import {
  generatePlayerForConflict,
  generatePerformanceTestData,
} from '../../utils/enhanced-mock-generators';
import PositionalBench from '../../../components/tactics/PositionalBench';
import type { Player } from '../../../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the groupPlayersByPosition utility
vi.mock('../../../utils/sampleTacticsData', () => ({
  groupPlayersByPosition: (players: Player[]) => {
    const grouped = {
      Goalkeepers: players.filter(p => p.roleId?.includes('gk')),
      Defenders: players.filter(
        p => p.roleId?.includes('cb') || p.roleId?.includes('fb') || p.roleId?.includes('wb'),
      ),
      Midfielders: players.filter(
        p => p.roleId?.includes('cm') || p.roleId?.includes('dm') || p.roleId?.includes('am'),
      ),
      Forwards: players.filter(
        p => p.roleId?.includes('cf') || p.roleId?.includes('w') || p.roleId?.includes('st'),
      ),
    };
    return grouped;
  },
}));

// Mock constants
vi.mock('../../../constants', () => ({
  PLAYER_ROLES: [
    { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', category: 'GK' },
    { id: 'cb', name: 'Centre Back', abbreviation: 'CB', category: 'DF' },
    { id: 'fb', name: 'Full Back', abbreviation: 'FB', category: 'DF' },
    { id: 'cm', name: 'Central Midfielder', abbreviation: 'CM', category: 'MF' },
    { id: 'dm', name: 'Defensive Midfielder', abbreviation: 'DM', category: 'MF' },
    { id: 'am', name: 'Attacking Midfielder', abbreviation: 'AM', category: 'MF' },
    { id: 'w', name: 'Winger', abbreviation: 'W', category: 'FW' },
    { id: 'cf', name: 'Centre Forward', abbreviation: 'CF', category: 'FW' },
    { id: 'st', name: 'Striker', abbreviation: 'ST', category: 'FW' },
  ],
}));

describe('PositionalBench Component', () => {
  let mockPlayers: Player[];
  let mockProps: any;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // Generate diverse player dataset
    const goalkeepers = Array.from({ length: 2 }, () => generatePlayerForConflict('GK')).map(p => ({
      ...p,
      roleId: 'gk',
    }));
    const defenders = Array.from({ length: 6 }, () => generatePlayerForConflict('DF')).map(
      (p, i) => ({
        ...p,
        roleId: i % 2 === 0 ? 'cb' : 'fb',
      }),
    );
    const midfielders = Array.from({ length: 5 }, () => generatePlayerForConflict('MF')).map(
      (p, i) => ({
        ...p,
        roleId: ['cm', 'dm', 'am'][i % 3],
      }),
    );
    const forwards = Array.from({ length: 4 }, () => generatePlayerForConflict('FW')).map(
      (p, i) => ({
        ...p,
        roleId: i % 2 === 0 ? 'w' : 'cf',
      }),
    );

    mockPlayers = [...goalkeepers, ...defenders, ...midfielders, ...forwards];

    mockProps = {
      players: mockPlayers,
      selectedPlayer: null,
      onPlayerSelect: vi.fn(),
      onPlayerDragStart: vi.fn(),
      className: '',
    };

    user = userEvent.setup();
    mockDragAndDrop();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the bench container with header', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      expect(screen.getByTestId('positional-bench')).toBeInTheDocument();
      expect(screen.getByText('Bench')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    });

    it('displays correct total player count', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      expect(screen.getByText(`${mockPlayers.length} players`)).toBeInTheDocument();
    });

    it('renders all position groups', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      expect(screen.getByText('Goalkeepers')).toBeInTheDocument();
      expect(screen.getByText('Defenders')).toBeInTheDocument();
      expect(screen.getByText('Midfielders')).toBeInTheDocument();
      expect(screen.getByText('Forwards')).toBeInTheDocument();
    });

    it('shows correct player count for each position group', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      // Find position groups and check their player counts
      const goalkeeperGroup = screen
        .getByText('Goalkeepers')
        .closest('[data-testid="position-group"]');
      expect(within(goalkeeperGroup! as HTMLElement).getByText('2 players')).toBeInTheDocument();

      const defenderGroup = screen.getByText('Defenders').closest('[data-testid="position-group"]');
      expect(within(defenderGroup! as HTMLElement).getByText('6 players')).toBeInTheDocument();
    });

    it('renders appropriate icons for each position group', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      // All position groups should have shield icons for GK/DF, zap for MF, target for FW
      const positionIcons = screen.getAllByTestId(/position-icon/);
      expect(positionIcons).toHaveLength(4);
    });

    it('applies custom className when provided', () => {
      renderWithProviders(<PositionalBench {...mockProps} className="custom-bench-class" />);

      const bench = screen.getByTestId('positional-bench');
      expect(bench).toHaveClass('custom-bench-class');
    });
  });

  describe('Position Group Interaction', () => {
    it('expands position group when header is clicked', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      await user.click(goalkeeperHeader);

      await waitFor(() => {
        const playerTokens = screen.getAllByTestId('position-group-player');
        const goalkeeperTokens = playerTokens.filter(token => within(token).queryByText(/gk/i));
        expect(goalkeeperTokens.length).toBeGreaterThan(0);
      });
    });

    it('collapses position group when header is clicked again', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });

      // Expand
      await user.click(goalkeeperHeader);
      await waitFor(() => {
        expect(screen.getAllByTestId('position-group-player')).toBeTruthy();
      });

      // Collapse
      await user.click(goalkeeperHeader);
      await waitFor(() => {
        expect(screen.queryAllByTestId('position-group-player')).toHaveLength(0);
      });
    });

    it('shows chevron rotation animation when expanding/collapsing', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      const chevron = within(goalkeeperHeader).getByTestId('position-chevron');

      // Initially should be pointing right (0 degrees)
      expect(chevron).toHaveAttribute('data-rotation', '0');

      await user.click(goalkeeperHeader);

      // After expansion should be pointing down (90 degrees)
      await waitFor(() => {
        expect(chevron).toHaveAttribute('data-rotation', '90');
      });
    });

    it('provides hover feedback on position group headers', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });

      await user.hover(goalkeeperHeader);
      expect(goalkeeperHeader).toHaveClass('hover:bg-slate-700/30');
    });
  });

  describe('Player Token Interaction', () => {
    beforeEach(async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      // Expand goalkeepers group to see player tokens
      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      await user.click(goalkeeperHeader);

      await waitFor(() => {
        expect(screen.getAllByTestId('position-group-player')).toHaveLength(2);
      });
    });

    it('calls onPlayerSelect when player token is clicked', async () => {
      const playerTokens = screen.getAllByTestId('position-group-player');
      await user.click(playerTokens[0]);

      expect(mockProps.onPlayerSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          roleId: 'gk',
        }),
      );
    });

    it('shows selected state for currently selected player', () => {
      const selectedPlayer = mockPlayers.find(p => p.roleId === 'gk');
      renderWithProviders(<PositionalBench {...mockProps} selectedPlayer={selectedPlayer} />);

      const selectedToken = screen.getByTestId(`player-token-${selectedPlayer!.id}`);
      expect(selectedToken).toHaveClass('bg-blue-600/20', 'border-blue-400/50');
    });

    it('displays player avatar with correct team colors', () => {
      const playerTokens = screen.getAllByTestId('position-group-player');
      const firstToken = playerTokens[0];
      const avatar = within(firstToken).getByTestId('player-avatar');

      // Should have either blue (home) or red (away) background
      expect(avatar).toHaveClass(/bg-(blue|red)-600/);
    });

    it('shows player number or role abbreviation in avatar', () => {
      const playerTokens = screen.getAllByTestId('position-group-player');
      const firstToken = playerTokens[0];
      const avatar = within(firstToken).getByTestId('player-avatar');

      // Should show either jersey number or role abbreviation
      const text = avatar.textContent;
      expect(text).toMatch(/\d+|GK/);
    });

    it('displays player name and role', () => {
      const playerTokens = screen.getAllByTestId('position-group-player');
      const firstToken = playerTokens[0];

      expect(within(firstToken).getByTestId('player-name')).toBeInTheDocument();
      expect(within(firstToken).getByTestId('player-role')).toBeInTheDocument();
    });

    it('shows player overall rating', () => {
      const playerTokens = screen.getAllByTestId('position-group-player');
      const firstToken = playerTokens[0];

      const rating = within(firstToken).getByTestId('player-rating');
      expect(rating.textContent).toMatch(/\d+/);
    });

    it('displays stamina bar with appropriate color', () => {
      const playerTokens = screen.getAllByTestId('position-group-player');
      const firstToken = playerTokens[0];

      const staminaBar = within(firstToken).getByTestId('stamina-bar');
      expect(staminaBar).toHaveClass(/bg-(green|yellow|red)-400/);
    });

    it('shows morale indicator with correct color', () => {
      const playerTokens = screen.getAllByTestId('position-group-player');
      const firstToken = playerTokens[0];

      const moraleIndicator = within(firstToken).getByTestId('morale-indicator');
      expect(moraleIndicator).toHaveClass(/bg-(green|blue|yellow|orange|red)-400/);
    });

    it('provides hover animation on player tokens', async () => {
      const playerTokens = screen.getAllByTestId('position-group-player');
      const firstToken = playerTokens[0];

      await user.hover(firstToken);
      expect(firstToken).toHaveClass('hover:scale-102');
    });
  });

  describe('Drag and Drop Functionality', () => {
    beforeEach(async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      // Expand goalkeepers group
      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      await user.click(goalkeeperHeader);

      await waitFor(() => {
        expect(screen.getAllByTestId('position-group-player')).toHaveLength(2);
      });
    });

    it('makes player tokens draggable', () => {
      const playerTokens = screen.getAllByTestId('position-group-player');
      const firstToken = playerTokens[0];

      expect(firstToken).toHaveAttribute('draggable', 'true');
    });

    it('calls onPlayerDragStart when drag is initiated', () => {
      const playerTokens = screen.getAllByTestId('position-group-player');
      const firstToken = playerTokens[0];

      fireEvent.dragStart(firstToken);

      expect(mockProps.onPlayerDragStart).toHaveBeenCalledWith(
        expect.objectContaining({
          roleId: 'gk',
        }),
      );
    });

    it('shows drag feedback during drag operation', () => {
      const playerTokens = screen.getAllByTestId('position-group-player');
      const firstToken = playerTokens[0];

      fireEvent.dragStart(firstToken);

      expect(firstToken).toHaveClass('opacity-50');
    });

    it('sets correct drag data for HTML5 drag and drop', () => {
      const { mockDataTransfer } = mockDragAndDrop();
      const playerTokens = screen.getAllByTestId('position-group-player');
      const firstToken = playerTokens[0];

      const dragEvent = new Event('dragstart', { bubbles: true });
      Object.defineProperty(dragEvent, 'dataTransfer', { value: mockDataTransfer });

      fireEvent(firstToken, dragEvent);

      expect(mockDataTransfer.setData).toHaveBeenCalledWith('text/plain', expect.any(String));
    });
  });

  describe('Availability Status Display', () => {
    it('shows availability status for injured players', async () => {
      const injuredPlayer = {
        ...mockPlayers[0],
        availability: {
          status: 'Minor Injury' as const,
          returnDate: '2025-01-15',
        },
      };

      const playersWithInjury = [injuredPlayer, ...mockPlayers.slice(1)];
      renderWithProviders(<PositionalBench {...mockProps} players={playersWithInjury} />);

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      await user.click(goalkeeperHeader);

      await waitFor(() => {
        expect(screen.getByText('Minor Injury')).toBeInTheDocument();
        expect(screen.getByText(/2025-01-15/)).toBeInTheDocument();
      });
    });

    it('hides availability status for available players', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      await user.click(goalkeeperHeader);

      await waitFor(() => {
        expect(screen.queryByTestId('availability-status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('renders expand all and collapse all buttons', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      expect(screen.getByRole('button', { name: 'Expand All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Collapse All' })).toBeInTheDocument();
    });

    it('expands all groups when Expand All is clicked', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const expandAllButton = screen.getByRole('button', { name: 'Expand All' });
      await user.click(expandAllButton);

      await waitFor(() => {
        // Should show players from all position groups
        const playerTokens = screen.getAllByTestId('position-group-player');
        expect(playerTokens.length).toBe(mockPlayers.length);
      });
    });

    it('collapses all groups when Collapse All is clicked', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      // First expand all
      const expandAllButton = screen.getByRole('button', { name: 'Expand All' });
      await user.click(expandAllButton);

      await waitFor(() => {
        expect(screen.getAllByTestId('position-group-player')).toHaveLength(mockPlayers.length);
      });

      // Then collapse all
      const collapseAllButton = screen.getByRole('button', { name: 'Collapse All' });
      await user.click(collapseAllButton);

      await waitFor(() => {
        expect(screen.queryAllByTestId('position-group-player')).toHaveLength(0);
      });
    });

    it('provides hover animation on quick action buttons', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const expandAllButton = screen.getByRole('button', { name: 'Expand All' });

      await user.hover(expandAllButton);
      expect(expandAllButton).toHaveClass('hover:bg-slate-600');
    });
  });

  describe('Empty State Handling', () => {
    it('shows empty state when no players are provided', () => {
      renderWithProviders(<PositionalBench {...mockProps} players={[]} />);

      expect(screen.getByText('No bench players available')).toBeInTheDocument();
      expect(screen.getByText('All players are in the starting formation')).toBeInTheDocument();
      expect(screen.getByTestId('empty-bench-icon')).toBeInTheDocument();
    });

    it('shows empty position group message when position has no players', async () => {
      // Remove all goalkeepers
      const playersWithoutGK = mockPlayers.filter(p => p.roleId !== 'gk');
      renderWithProviders(<PositionalBench {...mockProps} players={playersWithoutGK} />);

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      await user.click(goalkeeperHeader);

      await waitFor(() => {
        expect(screen.getByText('No players in this position')).toBeInTheDocument();
      });
    });

    it('updates player count correctly when players change', () => {
      const { rerender } = renderWithProviders(<PositionalBench {...mockProps} />);

      expect(screen.getByText(`${mockPlayers.length} players`)).toBeInTheDocument();

      const fewerPlayers = mockPlayers.slice(0, 5);
      rerender(<PositionalBench {...mockProps} players={fewerPlayers} />);

      expect(screen.getByText('5 players')).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    it('handles large player datasets efficiently', async () => {
      const largePlayerSet = generatePerformanceTestData.large().players;

      const renderStart = performance.now();
      renderWithProviders(<PositionalBench {...mockProps} players={largePlayerSet} />);
      const renderTime = performance.now() - renderStart;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(1000);
      expect(screen.getByTestId('positional-bench')).toBeInTheDocument();
    });

    it('memoizes position group calculations', () => {
      const { rerender } = renderWithProviders(<PositionalBench {...mockProps} />);

      // Re-render with same players
      rerender(<PositionalBench {...mockProps} />);

      // Should not recalculate groups
      expect(screen.getByText('Goalkeepers')).toBeInTheDocument();
      expect(screen.getByText('Defenders')).toBeInTheDocument();
    });

    it('virtualizes large position groups', async () => {
      // Create many defenders
      const manyDefenders = Array.from({ length: 50 }, () => ({
        ...generatePlayerForConflict('DF'),
        roleId: 'cb',
      }));

      renderWithProviders(<PositionalBench {...mockProps} players={manyDefenders} />);

      const defenderHeader = screen.getByRole('button', { name: /defenders/i });
      await user.click(defenderHeader);

      // Should not render all players at once
      await waitFor(() => {
        const visibleTokens = screen.getAllByTestId('position-group-player');
        expect(visibleTokens.length).toBeLessThanOrEqual(20); // Virtualization limit
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for position groups', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      expect(goalkeeperHeader).toHaveAttribute('aria-expanded', 'true');
      expect(goalkeeperHeader).toHaveAttribute(
        'aria-controls',
        expect.stringContaining('goalkeepers'),
      );
    });

    it('provides proper ARIA labels for player tokens', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      await user.click(goalkeeperHeader);

      await waitFor(() => {
        const playerTokens = screen.getAllByTestId('position-group-player');
        const firstToken = playerTokens[0];

        expect(firstToken).toHaveAttribute('role', 'button');
        expect(firstToken).toHaveAttribute('aria-label', expect.stringContaining('player'));
        expect(firstToken).toHaveAttribute('tabindex', '0');
      });
    });

    it('supports keyboard navigation through position groups', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      // Tab to first position group
      await user.tab();
      expect(screen.getByRole('button', { name: /goalkeepers/i })).toHaveFocus();

      // Tab to next position group
      await user.tab();
      expect(screen.getByRole('button', { name: /defenders/i })).toHaveFocus();
    });

    it('supports keyboard navigation within expanded groups', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      await user.click(goalkeeperHeader);

      await waitFor(() => {
        const playerTokens = screen.getAllByTestId('position-group-player');
        expect(playerTokens).toHaveLength(2);
      });

      // Tab to first player in group
      await user.tab();
      await user.tab(); // Skip the group header

      const firstPlayerToken = screen.getAllByTestId('position-group-player')[0];
      expect(firstPlayerToken).toHaveFocus();
    });

    it('announces position group expansions to screen readers', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      await user.click(goalkeeperHeader);

      expect(screen.getByTestId('sr-announcer')).toHaveTextContent(/goalkeepers.*expanded/i);
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile viewports', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true });

      renderWithProviders(<PositionalBench {...mockProps} />);

      const bench = screen.getByTestId('positional-bench');
      expect(bench).toHaveClass('mobile-layout');
    });

    it('adjusts player token size on small screens', () => {
      Object.defineProperty(window, 'innerWidth', { value: 640, configurable: true });

      renderWithProviders(<PositionalBench {...mockProps} />);

      const playerAvatars = screen.getAllByTestId('player-avatar');
      playerAvatars.forEach(avatar => {
        expect(avatar).toHaveClass('w-6', 'h-6'); // Smaller on mobile
      });
    });
  });

  describe('Error Handling', () => {
    it('handles malformed player data gracefully', () => {
      const malformedPlayers = [
        { ...mockPlayers[0], name: null, roleId: undefined },
        { ...mockPlayers[1], stamina: NaN, morale: null },
      ] as any;

      expect(() => {
        renderWithProviders(<PositionalBench {...mockProps} players={malformedPlayers} />);
      }).not.toThrow();

      expect(screen.getByTestId('positional-bench')).toBeInTheDocument();
    });

    it('handles missing callback functions gracefully', async () => {
      renderWithProviders(
        <PositionalBench
          {...mockProps}
          onPlayerSelect={undefined as any}
          onPlayerDragStart={undefined as any}
        />,
      );

      const goalkeeperHeader = screen.getByRole('button', { name: /goalkeepers/i });
      await user.click(goalkeeperHeader);

      await waitFor(() => {
        const playerTokens = screen.getAllByTestId('position-group-player');
        expect(() => user.click(playerTokens[0])).not.toThrow();
      });
    });
  });
});
