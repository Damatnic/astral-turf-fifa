import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../../utils/test-helpers';
import {
  generateTacticalFormation,
  generatePlayerForConflict,
  generateDrawingShape,
} from '../../utils/enhanced-mock-generators';
import UnifiedFloatingToolbar from '../../../components/tactics/UnifiedFloatingToolbar';
import type { Formation, Player, DrawingShape, DrawingTool } from '../../../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock FormationAutoSave component
vi.mock('../../../components/tactics/FormationAutoSave', () => ({
  FormationAutoSave: ({ onNotification }: { onNotification: Function }) => (
    <button
      data-testid="formation-auto-save"
      onClick={() => onNotification('Formation saved', 'success')}
    >
      Auto Save
    </button>
  ),
}));

// Mock PlayerDisplaySettings component
vi.mock('../../../components/tactics/PlayerDisplaySettings', () => ({
  __esModule: true,
  default: ({ config, onConfigChange }: any) => (
    <div data-testid="player-display-settings">
      <button
        onClick={() => onConfigChange({ ...config, showNames: !config.showNames })}
        data-testid="toggle-display"
      >
        Toggle Display
      </button>
    </div>
  ),
}));

describe('UnifiedFloatingToolbar Component', () => {
  let mockFormation: Formation;
  let mockPlayers: Player[];
  let mockDrawings: DrawingShape[];
  let mockProps: any;
  let user: ReturnType<typeof userEvent.setup>;

  const playerDisplayConfig = {
    showNames: true,
    showNumbers: true,
    showStats: false,
    showStamina: true,
    showMorale: true,
    showAvailability: true,
    iconType: 'circle' as const,
    namePosition: 'below' as const,
    size: 'medium' as const,
  };

  beforeEach(() => {
    mockFormation = generateTacticalFormation('4-4-2');
    mockPlayers = Array.from({ length: 11 }, () => generatePlayerForConflict('MF'));
    mockDrawings = Array.from({ length: 3 }, () => generateDrawingShape());

    mockProps = {
      selectedPlayer: null,
      currentFormation: mockFormation,
      currentPlayers: mockPlayers,
      onFormationChange: vi.fn(),
      onNotification: vi.fn(),
      showLeftSidebar: true,
      showRightSidebar: true,
      onToggleLeftSidebar: vi.fn(),
      onToggleRightSidebar: vi.fn(),
      drawingTool: 'select' as DrawingTool,
      drawingColor: '#ffffff',
      drawings: mockDrawings,
      onToolChange: vi.fn(),
      onColorChange: vi.fn(),
      onUndoDrawing: vi.fn(),
      onClearDrawings: vi.fn(),
      positioningMode: 'snap' as const,
      isGridVisible: false,
      isFormationStrengthVisible: false,
      onPositioningModeToggle: vi.fn(),
      onGridToggle: vi.fn(),
      onFormationStrengthToggle: vi.fn(),
      isAnimating: false,
      canPlayAnimation: true,
      onPlayAnimation: vi.fn(),
      onResetAnimation: vi.fn(),
      viewMode: 'standard' as const,
      onToggleFullscreen: vi.fn(),
      playerDisplayConfig,
      onPlayerDisplayConfigChange: vi.fn(),
      className: '',
    };

    user = userEvent.setup();

    // Mock keyboard event handling
    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the floating toolbar container', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByTestId('unified-floating-toolbar')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} className="custom-toolbar" />);

      const toolbar = screen.getByTestId('unified-floating-toolbar');
      expect(toolbar).toHaveClass('custom-toolbar');
    });

    it('renders with proper positioning and backdrop styling', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const toolbar = screen.getByTestId('unified-floating-toolbar');
      expect(toolbar).toHaveClass(
        'fixed',
        'top-20',
        'left-1/2',
        'transform',
        '-translate-x-1/2',
        'z-50',
      );
      expect(toolbar).toHaveClass('bg-slate-800/95', 'backdrop-blur-md');
    });
  });

  describe('Sidebar Toggle Section', () => {
    it('renders sidebar toggle buttons', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByRole('button', { name: /toggle left sidebar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /toggle right sidebar/i })).toBeInTheDocument();
    });

    it('shows active state for visible sidebars', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const leftToggle = screen.getByRole('button', { name: /toggle left sidebar/i });
      const rightToggle = screen.getByRole('button', { name: /toggle right sidebar/i });

      expect(leftToggle).toHaveClass('bg-blue-500');
      expect(rightToggle).toHaveClass('bg-blue-500');
    });

    it('shows inactive state for hidden sidebars', () => {
      renderWithProviders(
        <UnifiedFloatingToolbar {...mockProps} showLeftSidebar={false} showRightSidebar={false} />,
      );

      const leftToggle = screen.getByRole('button', { name: /toggle left sidebar/i });
      const rightToggle = screen.getByRole('button', { name: /toggle right sidebar/i });

      expect(leftToggle).not.toHaveClass('bg-blue-500');
      expect(rightToggle).not.toHaveClass('bg-blue-500');
    });

    it('calls toggle callbacks when sidebar buttons are clicked', async () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const leftToggle = screen.getByRole('button', { name: /toggle left sidebar/i });
      const rightToggle = screen.getByRole('button', { name: /toggle right sidebar/i });

      await user.click(leftToggle);
      expect(mockProps.onToggleLeftSidebar).toHaveBeenCalled();

      await user.click(rightToggle);
      expect(mockProps.onToggleRightSidebar).toHaveBeenCalled();
    });

    it('displays formation information', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByText(mockFormation.name)).toBeInTheDocument();
      expect(screen.getByText(/\d+\/\d+/)).toBeInTheDocument(); // Player count
    });

    it('shows correct player count in formation info', () => {
      const assignedSlots = mockFormation.slots.filter(slot => slot.playerId).length;
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(
        screen.getByText(`${assignedSlots}/${mockFormation.slots.length}`),
      ).toBeInTheDocument();
    });
  });

  describe('Drawing Tools Section', () => {
    it('renders all drawing tool buttons', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /arrow/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /line/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zone/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pen/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument();
    });

    it('shows active state for currently selected tool', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} drawingTool="arrow" />);

      const arrowButton = screen.getByRole('button', { name: /arrow/i });
      expect(arrowButton).toHaveClass('bg-blue-500');
    });

    it('calls onToolChange when drawing tools are clicked', async () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const arrowButton = screen.getByRole('button', { name: /arrow/i });
      await user.click(arrowButton);

      expect(mockProps.onToolChange).toHaveBeenCalledWith('arrow');
    });

    it('displays keyboard shortcuts on tool buttons', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByText('V')).toBeInTheDocument(); // Select shortcut
      expect(screen.getByText('A')).toBeInTheDocument(); // Arrow shortcut
      expect(screen.getByText('L')).toBeInTheDocument(); // Line shortcut
    });

    it('renders color picker with current color', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const colorPicker = screen.getByTestId('color-picker');
      expect(colorPicker).toBeInTheDocument();
      expect(colorPicker).toHaveStyle({ backgroundColor: mockProps.drawingColor });
    });

    it('calls onColorChange when color is selected', async () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const colorInput = screen.getByLabelText(/select drawing color/i);
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });

      expect(mockProps.onColorChange).toHaveBeenCalledWith('#ff0000');
    });

    it('shows predefined color options on hover', async () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const colorPicker = screen.getByTestId('color-picker');
      await user.hover(colorPicker);

      const predefinedColors = screen.getAllByLabelText(/select color/i);
      expect(predefinedColors.length).toBeGreaterThan(1);
    });
  });

  describe('View Controls Section', () => {
    it('renders view control buttons', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByRole('button', { name: /toggle grid/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /formation strength/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /positioning mode/i })).toBeInTheDocument();
    });

    it('shows active states for enabled view options', () => {
      renderWithProviders(
        <UnifiedFloatingToolbar
          {...mockProps}
          isGridVisible={true}
          isFormationStrengthVisible={true}
        />,
      );

      const gridButton = screen.getByRole('button', { name: /toggle grid/i });
      const strengthButton = screen.getByRole('button', { name: /formation strength/i });

      expect(gridButton).toHaveClass('bg-blue-500');
      expect(strengthButton).toHaveClass('bg-blue-500');
    });

    it('calls view control callbacks when buttons are clicked', async () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const gridButton = screen.getByRole('button', { name: /toggle grid/i });
      await user.click(gridButton);
      expect(mockProps.onGridToggle).toHaveBeenCalled();

      const strengthButton = screen.getByRole('button', { name: /formation strength/i });
      await user.click(strengthButton);
      expect(mockProps.onFormationStrengthToggle).toHaveBeenCalled();

      const positioningButton = screen.getByRole('button', { name: /positioning mode/i });
      await user.click(positioningButton);
      expect(mockProps.onPositioningModeToggle).toHaveBeenCalled();
    });

    it('shows correct positioning mode label', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} positioningMode="free" />);

      const positioningButton = screen.getByRole('button', { name: /free movement/i });
      expect(positioningButton).toBeInTheDocument();
    });
  });

  describe('Animation Controls Section', () => {
    it('shows play button when not animating', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByRole('button', { name: /play animation/i })).toBeInTheDocument();
    });

    it('shows reset button when animating', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} isAnimating={true} />);

      expect(screen.getByRole('button', { name: /reset animation/i })).toBeInTheDocument();
    });

    it('disables play button when animation cannot be played', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} canPlayAnimation={false} />);

      const playButton = screen.getByRole('button', { name: /play animation/i });
      expect(playButton).toBeDisabled();
    });

    it('calls animation callbacks when buttons are clicked', async () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const playButton = screen.getByRole('button', { name: /play animation/i });
      await user.click(playButton);
      expect(mockProps.onPlayAnimation).toHaveBeenCalled();
    });
  });

  describe('Drawing Actions Section', () => {
    it('renders undo and clear drawing buttons', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByRole('button', { name: /undo last drawing/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear all drawings/i })).toBeInTheDocument();
    });

    it('disables drawing action buttons when no drawings exist', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} drawings={[]} />);

      const undoButton = screen.getByRole('button', { name: /undo last drawing/i });
      const clearButton = screen.getByRole('button', { name: /clear all drawings/i });

      expect(undoButton).toBeDisabled();
      expect(clearButton).toBeDisabled();
    });

    it('enables drawing action buttons when drawings exist', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const undoButton = screen.getByRole('button', { name: /undo last drawing/i });
      const clearButton = screen.getByRole('button', { name: /clear all drawings/i });

      expect(undoButton).not.toBeDisabled();
      expect(clearButton).not.toBeDisabled();
    });

    it('calls drawing action callbacks when buttons are clicked', async () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const undoButton = screen.getByRole('button', { name: /undo last drawing/i });
      await user.click(undoButton);
      expect(mockProps.onUndoDrawing).toHaveBeenCalled();

      const clearButton = screen.getByRole('button', { name: /clear all drawings/i });
      await user.click(clearButton);
      expect(mockProps.onClearDrawings).toHaveBeenCalled();
    });
  });

  describe('Quick Actions Section', () => {
    it('renders fullscreen toggle when callback is provided', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByRole('button', { name: /enter fullscreen/i })).toBeInTheDocument();
    });

    it('shows correct fullscreen button text based on view mode', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} viewMode="fullscreen" />);

      expect(screen.getByRole('button', { name: /exit fullscreen/i })).toBeInTheDocument();
    });

    it('renders formation auto-save component', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByTestId('formation-auto-save')).toBeInTheDocument();
    });

    it('renders share button', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });

    it('renders player display settings when props are provided', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByTestId('player-display-settings')).toBeInTheDocument();
    });

    it('hides player display settings when props are not provided', () => {
      renderWithProviders(
        <UnifiedFloatingToolbar
          {...mockProps}
          playerDisplayConfig={undefined}
          onPlayerDisplayConfigChange={undefined}
        />,
      );

      expect(screen.queryByTestId('player-display-settings')).not.toBeInTheDocument();
    });
  });

  describe('Selected Player Info Section', () => {
    it('shows selected player information when player is selected', () => {
      const selectedPlayer = mockPlayers[0];
      renderWithProviders(
        <UnifiedFloatingToolbar {...mockProps} selectedPlayer={selectedPlayer} />,
      );

      expect(screen.getByText(selectedPlayer.name)).toBeInTheDocument();
      expect(screen.getByTestId('selected-player-icon')).toBeInTheDocument();
    });

    it('hides selected player section when no player is selected', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.queryByTestId('selected-player-info')).not.toBeInTheDocument();
    });

    it('displays formatted role information for selected player', () => {
      const selectedPlayer = { ...mockPlayers[0], roleId: 'centre-midfielder' };
      renderWithProviders(
        <UnifiedFloatingToolbar {...mockProps} selectedPlayer={selectedPlayer} />,
      );

      expect(screen.getByText('CENTRE MIDFIELDER')).toBeInTheDocument();
    });
  });

  describe('Drawing Stats Indicator', () => {
    it('shows drawing count when drawings exist', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(screen.getByText(`${mockDrawings.length} shapes`)).toBeInTheDocument();
    });

    it('shows singular form for single drawing', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} drawings={[mockDrawings[0]]} />);

      expect(screen.getByText('1 shape')).toBeInTheDocument();
    });

    it('hides drawing stats when no drawings exist', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} drawings={[]} />);

      expect(screen.queryByText(/shape/)).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('sets up keyboard event listeners on mount', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('handles tool selection shortcuts', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const keyHandler = (document.addEventListener as any).mock.calls[0][1];

      // Test select tool shortcut
      keyHandler({ key: 'v', target: document.body });
      expect(mockProps.onToolChange).toHaveBeenCalledWith('select');

      // Test arrow tool shortcut
      keyHandler({ key: 'a', target: document.body });
      expect(mockProps.onToolChange).toHaveBeenCalledWith('arrow');
    });

    it('handles view control shortcuts', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const keyHandler = (document.addEventListener as any).mock.calls[0][1];

      // Test grid toggle shortcut
      keyHandler({ key: 'g', target: document.body });
      expect(mockProps.onGridToggle).toHaveBeenCalled();
    });

    it('handles undo shortcut with Ctrl+Z', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const keyHandler = (document.addEventListener as any).mock.calls[0][1];

      keyHandler({
        key: 'z',
        ctrlKey: true,
        target: document.body,
        preventDefault: vi.fn(),
      });
      expect(mockProps.onUndoDrawing).toHaveBeenCalled();
    });

    it('ignores shortcuts when typing in inputs', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const keyHandler = (document.addEventListener as any).mock.calls[0][1];
      const inputElement = document.createElement('input');

      keyHandler({ key: 'v', target: inputElement });
      expect(mockProps.onToolChange).not.toHaveBeenCalled();
    });

    it('handles escape key to select tool', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const keyHandler = (document.addEventListener as any).mock.calls[0][1];

      keyHandler({ key: 'Escape', target: document.body });
      expect(mockProps.onToolChange).toHaveBeenCalledWith('select');
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      unmount();

      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Integration with Child Components', () => {
    it('handles formation auto-save notifications', async () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const autoSaveButton = screen.getByTestId('formation-auto-save');
      await user.click(autoSaveButton);

      expect(mockProps.onNotification).toHaveBeenCalledWith('Formation saved', 'success');
    });

    it('handles player display config changes', async () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const toggleDisplayButton = screen.getByTestId('toggle-display');
      await user.click(toggleDisplayButton);

      expect(mockProps.onPlayerDisplayConfigChange).toHaveBeenCalledWith({
        ...playerDisplayConfig,
        showNames: false,
      });
    });

    it('passes correct props to child components', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      // FormationAutoSave should receive formation and players
      const autoSave = screen.getByTestId('formation-auto-save');
      expect(autoSave).toBeInTheDocument();

      // PlayerDisplaySettings should receive config
      const displaySettings = screen.getByTestId('player-display-settings');
      expect(displaySettings).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for tool buttons', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const selectButton = screen.getByRole('button', { name: /select.*v/i });
      expect(selectButton).toHaveAttribute('aria-label', expect.stringContaining('Select'));
      expect(selectButton).toHaveAttribute('title', expect.stringContaining('V'));
    });

    it('supports keyboard navigation through toolbar sections', async () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      // Tab through toolbar buttons
      await user.tab();
      expect(screen.getByRole('button', { name: /toggle left sidebar/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /toggle right sidebar/i })).toHaveFocus();
    });

    it('announces tool changes to screen readers', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} drawingTool="arrow" />);

      expect(screen.getByTestId('sr-announcer')).toHaveTextContent(/arrow tool selected/i);
    });

    it('provides focus management for disabled buttons', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} drawings={[]} />);

      const undoButton = screen.getByRole('button', { name: /undo last drawing/i });
      expect(undoButton).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Performance Optimizations', () => {
    it('memoizes expensive calculations', () => {
      const { rerender } = renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      // Re-render with same props
      rerender(<UnifiedFloatingToolbar {...mockProps} />);

      // Should not recalculate formation info
      expect(screen.getByText(mockFormation.name)).toBeInTheDocument();
    });

    it('throttles keyboard event handlers', () => {
      renderWithProviders(<UnifiedFloatingToolbar {...mockProps} />);

      const keyHandler = (document.addEventListener as any).mock.calls[0][1];

      // Rapid keystrokes should be throttled
      for (let i = 0; i < 10; i++) {
        keyHandler({ key: 'v', target: document.body });
      }

      // Should only register limited calls due to throttling
      expect(mockProps.onToolChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('handles missing formation gracefully', () => {
      expect(() => {
        renderWithProviders(<UnifiedFloatingToolbar {...mockProps} currentFormation={undefined} />);
      }).not.toThrow();

      expect(screen.getByTestId('unified-floating-toolbar')).toBeInTheDocument();
    });

    it('handles missing callback functions gracefully', async () => {
      renderWithProviders(
        <UnifiedFloatingToolbar
          {...mockProps}
          onToolChange={undefined as any}
          onGridToggle={undefined as any}
        />,
      );

      const selectButton = screen.getByRole('button', { name: /select/i });

      expect(() => user.click(selectButton)).not.toThrow();
    });

    it('handles malformed drawing data', () => {
      const malformedDrawings = [
        { ...mockDrawings[0], points: null },
        { ...mockDrawings[1], tool: undefined },
      ] as any;

      expect(() => {
        renderWithProviders(<UnifiedFloatingToolbar {...mockProps} drawings={malformedDrawings} />);
      }).not.toThrow();
    });
  });
});
