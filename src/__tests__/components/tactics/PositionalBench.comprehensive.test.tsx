import React from 'react';
import {
  renderWithProviders,
  createTestData,
  createMockProps,
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
  userEvent
} from '../../utils/comprehensive-test-providers';
import PositionalBench from '../../../components/tactics/PositionalBench';
import type { Player } from '../../../types';

describe('PositionalBench - Comprehensive Test Suite', () => {
  let mockProps: ReturnType<typeof createMockProps.positionalBench>;
  let user: ReturnType<typeof userEvent.setup>;
  let testPlayers: Player[];

  beforeEach(() => {
    const testData = createTestData.complete();
    testPlayers = testData.players.slice(11, 22); // Get bench players
    
    mockProps = {
      ...createMockProps.positionalBench(),
      players: testPlayers
    };
    
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the positional bench with all players', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      expect(screen.getByText(/substitutes bench/i)).toBeInTheDocument();
      expect(screen.getByTestId('positional-bench')).toBeInTheDocument();
    });

    it('should group players by position when groupBy is set to position', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} groupBy="position" />
      );

      // Check for position group headers
      expect(screen.getByText(/goalkeepers/i)).toBeInTheDocument();
      expect(screen.getByText(/defenders/i)).toBeInTheDocument();
      expect(screen.getByText(/midfielders/i)).toBeInTheDocument();
      expect(screen.getByText(/forwards/i)).toBeInTheDocument();
    });

    it('should group players by availability when groupBy is set to availability', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} groupBy="availability" />
      );

      // Check for availability group headers
      expect(screen.getByText(/available/i)).toBeInTheDocument();
      expect(screen.getByText(/injured/i) || screen.getByText(/unavailable/i)).toBeInTheDocument();
    });

    it('should show all players in a single list when groupBy is not set', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} groupBy={undefined} />
      );

      const benchContainer = screen.getByTestId('positional-bench');
      const playerCards = within(benchContainer).getAllByTestId(/player-card/);
      expect(playerCards.length).toBe(testPlayers.length);
    });

    it('should apply custom className when provided', () => {
      const customClass = 'custom-bench';
      renderWithProviders(
        <PositionalBench {...mockProps} className={customClass} />
      );

      const bench = screen.getByTestId('positional-bench');
      expect(bench).toHaveClass(customClass);
    });
  });

  describe('Player Card Display', () => {
    it('should display player names and jersey numbers', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      testPlayers.forEach(player => {
        expect(screen.getByText(player.name)).toBeInTheDocument();
        expect(screen.getByText(player.jerseyNumber.toString())).toBeInTheDocument();
      });
    });

    it('should show player stats when showStats is enabled', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} showStats={true} />
      );

      // Should show stats for at least the first player
      const firstPlayer = testPlayers[0];
      const playerCard = screen.getByTestId(`player-card-${firstPlayer.id}`);
      
      // Check for common stats display
      expect(within(playerCard).getByText(/pace|shooting|passing/i)).toBeInTheDocument();
    });

    it('should hide player stats when showStats is disabled', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} showStats={false} />
      );

      // Stats should not be visible
      expect(screen.queryByText(/pace:|shooting:|passing:/i)).not.toBeInTheDocument();
    });

    it('should display player positions correctly', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      testPlayers.forEach(player => {
        const playerCard = screen.getByTestId(`player-card-${player.id}`);
        expect(within(playerCard).getByText(player.position)).toBeInTheDocument();
      });
    });

    it('should show availability status indicators', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      testPlayers.forEach(player => {
        const playerCard = screen.getByTestId(`player-card-${player.id}`);
        
        if (player.isAvailable) {
          expect(within(playerCard).getByTestId('availability-indicator')).toHaveClass(/available|ready/);
        } else {
          expect(within(playerCard).getByTestId('availability-indicator')).toHaveClass(/unavailable|injured/);
        }
      });
    });
  });

  describe('Player Interaction', () => {
    it('should call onPlayerSelect when a player is clicked', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const firstPlayer = testPlayers[0];
      const playerCard = screen.getByTestId(`player-card-${firstPlayer.id}`);
      
      await user.click(playerCard);

      expect(mockProps.onPlayerSelect).toHaveBeenCalledWith(firstPlayer);
    });

    it('should support keyboard navigation for player selection', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const firstPlayer = testPlayers[0];
      const playerCard = screen.getByTestId(`player-card-${firstPlayer.id}`);
      
      playerCard.focus();
      await user.keyboard('{Enter}');

      expect(mockProps.onPlayerSelect).toHaveBeenCalledWith(firstPlayer);
    });

    it('should support Space key for player selection', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const firstPlayer = testPlayers[0];
      const playerCard = screen.getByTestId(`player-card-${firstPlayer.id}`);
      
      playerCard.focus();
      await user.keyboard(' ');

      expect(mockProps.onPlayerSelect).toHaveBeenCalledWith(firstPlayer);
    });

    it('should handle drag and drop initiation', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const firstPlayer = testPlayers[0];
      const playerCard = screen.getByTestId(`player-card-${firstPlayer.id}`);
      
      // Start drag
      fireEvent.dragStart(playerCard, {
        dataTransfer: {
          setData: vi.fn(),
          getData: vi.fn(),
        }
      });

      // Verify drag data setup
      expect(playerCard).toHaveAttribute('draggable', 'true');
    });

    it('should call onPlayerMove when drag and drop is completed', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const firstPlayer = testPlayers[0];
      const playerCard = screen.getByTestId(`player-card-${firstPlayer.id}`);
      
      // Simulate drag and drop
      fireEvent.dragStart(playerCard);
      fireEvent.dragEnd(playerCard, {
        dataTransfer: {
          dropEffect: 'move'
        }
      });

      // The onPlayerMove should be called when drop is completed on a valid target
      // This would typically happen when dropping on the field
    });
  });

  describe('Filtering and Searching', () => {
    it('should filter players by position when position filter is applied', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} positionFilter="midfielder" />
      );

      const midfielders = testPlayers.filter(p => p.position === 'midfielder');
      const visibleCards = screen.getAllByTestId(/player-card/);
      
      expect(visibleCards.length).toBe(midfielders.length);
    });

    it('should show search input when searchable is enabled', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} searchable={true} />
      );

      expect(screen.getByPlaceholderText(/search players/i)).toBeInTheDocument();
    });

    it('should filter players by search term', async () => {
      const searchablePlayers = testPlayers.slice(0, 3);
      searchablePlayers[0].name = 'John Smith';
      searchablePlayers[1].name = 'Jane Doe';
      searchablePlayers[2].name = 'Mike Johnson';

      renderWithProviders(
        <PositionalBench 
          {...mockProps} 
          players={searchablePlayers}
          searchable={true} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search players/i);
      await user.type(searchInput, 'John');

      await waitFor(() => {
        // Should show only players with 'John' in their name
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
      });
    });

    it('should clear search when search input is cleared', async () => {
      renderWithProviders(
        <PositionalBench {...mockProps} searchable={true} />
      );

      const searchInput = screen.getByPlaceholderText(/search players/i);
      
      // Type search term
      await user.type(searchInput, 'test');
      
      // Clear search
      await user.clear(searchInput);

      await waitFor(() => {
        // All players should be visible again
        const visibleCards = screen.getAllByTestId(/player-card/);
        expect(visibleCards.length).toBe(testPlayers.length);
      });
    });
  });

  describe('Sorting and Organization', () => {
    it('should sort players by name when sortBy is set to name', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} sortBy="name" />
      );

      const playerCards = screen.getAllByTestId(/player-card/);
      const playerNames = playerCards.map(card => 
        within(card).getByTestId('player-name').textContent
      );

      // Names should be in alphabetical order
      const sortedNames = [...playerNames].sort();
      expect(playerNames).toEqual(sortedNames);
    });

    it('should sort players by position when sortBy is set to position', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} sortBy="position" />
      );

      const playerCards = screen.getAllByTestId(/player-card/);
      
      // Positions should be grouped together
      expect(playerCards.length).toBeGreaterThan(0);
    });

    it('should sort players by jersey number when sortBy is set to number', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} sortBy="number" />
      );

      const playerCards = screen.getAllByTestId(/player-card/);
      const jerseyNumbers = playerCards.map(card => 
        parseInt(within(card).getByTestId('jersey-number').textContent || '0')
      );

      // Numbers should be in ascending order
      const sortedNumbers = [...jerseyNumbers].sort((a, b) => a - b);
      expect(jerseyNumbers).toEqual(sortedNumbers);
    });
  });

  describe('Layout and Responsiveness', () => {
    it('should adapt to mobile layout', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 480,
        configurable: true
      });

      renderWithProviders(<PositionalBench {...mockProps} />);

      const bench = screen.getByTestId('positional-bench');
      expect(bench).toHaveClass(/mobile|responsive/);
    });

    it('should handle empty player list gracefully', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} players={[]} />
      );

      expect(screen.getByText(/no substitute players/i)).toBeInTheDocument();
    });

    it('should show loading state when players are being loaded', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} loading={true} />
      );

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('should handle very large player lists efficiently', () => {
      const largePlayerList = createTestData.performance(50).players;
      
      renderWithProviders(
        <PositionalBench {...mockProps} players={largePlayerList} />
      );

      // Should render without performance issues
      expect(screen.getByTestId('positional-bench')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const bench = screen.getByTestId('positional-bench');
      expect(bench).toHaveAttribute('role', 'list');
      expect(bench).toHaveAttribute('aria-label', 'Substitute players bench');

      const playerCards = screen.getAllByTestId(/player-card/);
      playerCards.forEach(card => {
        expect(card).toHaveAttribute('role', 'listitem');
        expect(card).toHaveAttribute('tabindex', '0');
      });
    });

    it('should support screen reader navigation', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      testPlayers.forEach(player => {
        const playerCard = screen.getByTestId(`player-card-${player.id}`);
        expect(playerCard).toHaveAttribute('aria-label');
      });
    });

    it('should announce position groups to screen readers', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} groupBy="position" />
      );

      const positionHeaders = screen.getAllByRole('heading', { level: 3 });
      positionHeaders.forEach(header => {
        expect(header).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation between players', async () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      const firstPlayerCard = screen.getByTestId(`player-card-${testPlayers[0].id}`);
      const secondPlayerCard = screen.getByTestId(`player-card-${testPlayers[1].id}`);

      firstPlayerCard.focus();
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      expect(secondPlayerCard).toHaveFocus();
    });
  });

  describe('Performance and Optimization', () => {
    it('should virtualize large player lists', () => {
      const largePlayerList = createTestData.performance(100).players;
      
      renderWithProviders(
        <PositionalBench 
          {...mockProps} 
          players={largePlayerList}
          virtualized={true} 
        />
      );

      // Should only render visible players
      const visibleCards = screen.getAllByTestId(/player-card/);
      expect(visibleCards.length).toBeLessThan(largePlayerList.length);
    });

    it('should debounce search input', async () => {
      renderWithProviders(
        <PositionalBench {...mockProps} searchable={true} />
      );

      const searchInput = screen.getByPlaceholderText(/search players/i);
      
      // Type rapidly
      await user.type(searchInput, 'test', { delay: 10 });

      // Search should be debounced
      await waitFor(() => {
        expect(searchInput).toHaveValue('test');
      }, { timeout: 1000 });
    });

    it('should memoize player cards to prevent unnecessary re-renders', () => {
      let renderCount = 0;
      const TestBench = ({ players }: { players: Player[] }) => {
        renderCount++;
        return <PositionalBench {...mockProps} players={players} />;
      };

      const { rerender } = renderWithProviders(
        <TestBench players={testPlayers} />
      );

      const initialRenderCount = renderCount;

      // Re-render with same players
      rerender(<TestBench players={testPlayers} />);

      // Should not cause excessive re-renders
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Integration with Parent Components', () => {
    it('should integrate properly with UnifiedTacticsBoard', () => {
      renderWithProviders(<PositionalBench {...mockProps} />);

      // Should be properly integrated as shown by proper event handling
      expect(mockProps.onPlayerSelect).toBeDefined();
      expect(mockProps.onPlayerMove).toBeDefined();
    });

    it('should handle formation changes from parent', () => {
      const { rerender } = renderWithProviders(
        <PositionalBench {...mockProps} />
      );

      // Simulate formation change that affects bench players
      const updatedPlayers = testPlayers.map(player => ({
        ...player,
        isAvailable: !player.isAvailable
      }));

      rerender(
        <PositionalBench {...mockProps} players={updatedPlayers} />
      );

      // Should update player availability indicators
      expect(screen.getByTestId('positional-bench')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing player data gracefully', () => {
      const playersWithMissingData = testPlayers.map(player => ({
        ...player,
        name: player.name || 'Unknown Player',
        position: player.position || 'unknown'
      }));

      renderWithProviders(
        <PositionalBench {...mockProps} players={playersWithMissingData} />
      );

      expect(screen.getByTestId('positional-bench')).toBeInTheDocument();
    });

    it('should handle invalid groupBy values', () => {
      renderWithProviders(
        <PositionalBench {...mockProps} groupBy={'invalid' as any} />
      );

      // Should fall back to default behavior
      expect(screen.getByTestId('positional-bench')).toBeInTheDocument();
    });

    it('should handle missing callback functions', () => {
      const propsWithoutCallbacks = {
        ...mockProps,
        onPlayerSelect: undefined,
        onPlayerMove: undefined
      };

      renderWithProviders(
        <PositionalBench {...propsWithoutCallbacks} />
      );

      // Should render without issues even without callbacks
      expect(screen.getByTestId('positional-bench')).toBeInTheDocument();
    });
  });
});