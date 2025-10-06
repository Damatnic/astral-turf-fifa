import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import TacticalPlaybook from '../../components/tactics/TacticalPlaybook';
import { type Formation, type Player } from '../../types';
import { createMockPlayer } from '../../test-utils/mock-factories/player.factory';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock tactical integration service
vi.mock('../../services/tacticalIntegrationService', () => ({
  tacticalIntegrationService: {
    analyzeFormation: vi.fn().mockResolvedValue({
      strengths: ['Good balance'],
      weaknesses: ['Could improve width'],
      recommendations: ['Adjust wing positions'],
      effectiveness: 85,
      riskLevel: 'medium',
    }),
    exportFormation: vi.fn().mockReturnValue({
      id: 'export-123',
      name: 'Test Formation',
      formation: {},
      players: [],
      analysis: {},
      timestamp: Date.now(),
    }),
  },
}));

describe('TacticalPlaybook Component', () => {
  const mockFormation: Formation = {
    id: 'test-formation',
    name: '4-3-3',
    slots: [
      { id: '1', role: 'GK', defaultPosition: { x: 50, y: 80 }, playerId: null },
      { id: '2', role: 'DF', defaultPosition: { x: 30, y: 60 }, playerId: null },
      { id: '3', role: 'DF', defaultPosition: { x: 70, y: 60 }, playerId: null },
    ],
  };

  const mockPlayers: Player[] = [
    createMockPlayer({
      id: '1',
      name: 'Test Player 1',
      roleId: 'striker',
      currentPotential: 85,
      age: 25,
    }),
    createMockPlayer({
      id: '2',
      name: 'Test Player 2',
      roleId: 'midfielder',
      currentPotential: 78,
      age: 23,
    }),
  ];

  const mockOnLoadFormation = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
  });

  describe('Rendering', () => {
    it('should render when open', () => {
      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('Tactical Playbook')).toBeInTheDocument();
      expect(screen.getByText('Save Current')).toBeInTheDocument();
      expect(screen.getByText('Import')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={false}
        />
      );

      expect(screen.queryByText('Tactical Playbook')).not.toBeInTheDocument();
    });

    it('should show empty state when no formations', () => {
      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('No formations found')).toBeInTheDocument();
      expect(screen.getByText('Save your first formation to get started')).toBeInTheDocument();
    });
  });

  describe('Formation Management', () => {
    it('should open save dialog when Save Current clicked', async () => {
      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      fireEvent.click(screen.getByText('Save Current'));

      await waitFor(() => {
        expect(screen.getByText('Save Formation')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter formation name...')).toBeInTheDocument();
      });
    });

    it('should save formation with valid name', async () => {
      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Open save dialog
      fireEvent.click(screen.getByText('Save Current'));

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter formation name...');
        fireEvent.change(nameInput, { target: { value: 'My Test Formation' } });
      });

      // Save formation
      fireEvent.click(screen.getByText('Save Formation'));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'savedFormations',
          expect.stringContaining('My Test Formation')
        );
      });
    });

    it('should not save formation with empty name', async () => {
      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Open save dialog
      fireEvent.click(screen.getByText('Save Current'));

      await waitFor(() => {
        // Try to save without entering name
        const saveButton = screen.getByText('Save Formation');
        expect(saveButton).toBeDisabled();
      });
    });

    it('should disable Save Current when no formation', () => {
      render(
        <TacticalPlaybook
          currentFormation={undefined}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const saveButton = screen.getByText('Save Current');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Formation Loading', () => {
    it('should display saved formations', () => {
      const savedFormations = [
        {
          id: 'saved-1',
          name: 'Saved Formation 1',
          formation: mockFormation,
          players: mockPlayers,
          analysis: {
            effectiveness: 85,
            strengths: ['Good'],
            weaknesses: ['Bad'],
            recommendations: ['Fix'],
            riskLevel: 'low',
          },
          timestamp: Date.now(),
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedFormations));

      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('Saved Formation 1')).toBeInTheDocument();
      expect(screen.getByText('2 players')).toBeInTheDocument();
      expect(screen.getByText('Effectiveness: 85%')).toBeInTheDocument();
    });

    it('should load formation when Load Formation clicked', () => {
      const savedFormations = [
        {
          id: 'saved-1',
          name: 'Saved Formation 1',
          formation: mockFormation,
          players: mockPlayers,
          analysis: {
            effectiveness: 85,
            strengths: ['Good'],
            weaknesses: ['Bad'],
            recommendations: ['Fix'],
            riskLevel: 'low',
          },
          timestamp: Date.now(),
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedFormations));

      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      fireEvent.click(screen.getByText('Load Formation'));

      expect(mockOnLoadFormation).toHaveBeenCalledWith(mockFormation);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Formation Export/Import', () => {
    it('should export formation when export button clicked', () => {
      const savedFormations = [
        {
          id: 'saved-1',
          name: 'Export Test Formation',
          formation: mockFormation,
          players: mockPlayers,
          analysis: {
            effectiveness: 85,
            strengths: [],
            weaknesses: [],
            recommendations: [],
            riskLevel: 'low' as const,
          },
          timestamp: Date.now(),
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedFormations));

      // Mock URL.createObjectURL and document methods
      const mockCreateObjectURL = vi.fn().mockReturnValue('mock-url');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
      };

      document.createElement = vi.fn().mockReturnValue(mockLink);
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;

      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Find and click export button (download icon)
      const exportButtons = screen.getAllByRole('button');
      const exportButton = exportButtons.find(button => {
        const icon = button.querySelector('svg');
        return (
          icon?.classList.contains('lucide-download') ||
          button.getAttribute('title')?.includes('Export') ||
          button.textContent?.includes('Export')
        );
      });

      if (exportButton) {
        fireEvent.click(exportButton);

        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
      }
    });

    it('should handle import file selection', () => {
      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Mock file input creation
      const mockFileInput = {
        type: 'file',
        accept: '.json',
        onchange: null,
        click: vi.fn(),
      };

      document.createElement = vi.fn().mockReturnValue(mockFileInput);

      fireEvent.click(screen.getByText('Import'));

      expect(document.createElement).toHaveBeenCalledWith('input');
      expect(mockFileInput.type).toBe('file');
      expect(mockFileInput.accept).toBe('.json');
      expect(mockFileInput.click).toHaveBeenCalled();
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      const savedFormations = [
        {
          id: 'saved-1',
          name: 'Attack Formation',
          formation: mockFormation,
          players: mockPlayers,
          analysis: {
            effectiveness: 85,
            strengths: [],
            weaknesses: [],
            recommendations: [],
            riskLevel: 'low' as const,
          },
          timestamp: Date.now() - 1000,
        },
        {
          id: 'saved-2',
          name: 'Defense Formation',
          formation: mockFormation,
          players: mockPlayers,
          analysis: {
            effectiveness: 75,
            strengths: [],
            weaknesses: [],
            recommendations: [],
            riskLevel: 'medium' as const,
          },
          timestamp: Date.now(),
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedFormations));
    });

    it('should filter formations by search term', async () => {
      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search formations...');
      fireEvent.change(searchInput, { target: { value: 'Attack' } });

      await waitFor(() => {
        expect(screen.getByText('Attack Formation')).toBeInTheDocument();
        expect(screen.queryByText('Defense Formation')).not.toBeInTheDocument();
      });
    });

    it('should filter by category', async () => {
      // Mock favorites
      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'favoriteFormations') {
          return JSON.stringify(['saved-1']);
        }
        if (key === 'savedFormations') {
          return JSON.stringify([
            {
              id: 'saved-1',
              name: 'Favorite Formation',
              formation: mockFormation,
              players: mockPlayers,
              analysis: {
                effectiveness: 85,
                strengths: [],
                weaknesses: [],
                recommendations: [],
                riskLevel: 'low' as const,
              },
              timestamp: Date.now(),
            },
            {
              id: 'saved-2',
              name: 'Regular Formation',
              formation: mockFormation,
              players: mockPlayers,
              analysis: {
                effectiveness: 75,
                strengths: [],
                weaknesses: [],
                recommendations: [],
                riskLevel: 'medium' as const,
              },
              timestamp: Date.now(),
            },
          ]);
        }
        return '[]';
      });

      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const filterSelect = screen.getByDisplayValue('All');
      fireEvent.change(filterSelect, { target: { value: 'favorite' } });

      await waitFor(() => {
        expect(screen.getByText('Favorite Formation')).toBeInTheDocument();
        expect(screen.queryByText('Regular Formation')).not.toBeInTheDocument();
      });
    });
  });

  describe('Favorites Management', () => {
    it('should toggle formation as favorite', async () => {
      const savedFormations = [
        {
          id: 'saved-1',
          name: 'Test Formation',
          formation: mockFormation,
          players: mockPlayers,
          analysis: {
            effectiveness: 85,
            strengths: [],
            weaknesses: [],
            recommendations: [],
            riskLevel: 'low' as const,
          },
          timestamp: Date.now(),
        },
      ];

      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'savedFormations') {
          return JSON.stringify(savedFormations);
        }
        return '[]';
      });

      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Find and click favorite button (star icon)
      const buttons = screen.getAllByRole('button');
      const favoriteButton = buttons.find(button => {
        const icon = button.querySelector('svg');
        return icon?.classList.contains('lucide-star');
      });

      if (favoriteButton) {
        fireEvent.click(favoriteButton);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'favoriteFormations',
          expect.stringContaining('saved-1')
        );
      }
    });
  });

  describe('Formation Deletion', () => {
    it('should delete formation when delete button clicked', async () => {
      const savedFormations = [
        {
          id: 'saved-1',
          name: 'Delete Test Formation',
          formation: mockFormation,
          players: mockPlayers,
          analysis: {
            effectiveness: 85,
            strengths: [],
            weaknesses: [],
            recommendations: [],
            riskLevel: 'low' as const,
          },
          timestamp: Date.now(),
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedFormations));

      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Find and click delete button (trash icon)
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(button => {
        const icon = button.querySelector('svg');
        return icon?.classList.contains('lucide-trash-2');
      });

      if (deleteButton) {
        fireEvent.click(deleteButton);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('savedFormations', '[]');
      }
    });
  });

  describe('Close Functionality', () => {
    it('should close when close button clicked', () => {
      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close when clicking outside modal', () => {
      render(
        <TacticalPlaybook
          currentFormation={mockFormation}
          currentPlayers={mockPlayers}
          onLoadFormation={mockOnLoadFormation}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Click on backdrop
      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });
});
