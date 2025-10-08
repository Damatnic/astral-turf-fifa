import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../../utils/test-helpers';
import PlayerDisplaySettings, {
  PlayerDisplayConfig,
} from '../../../components/tactics/PlayerDisplaySettings';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('PlayerDisplaySettings Component', () => {
  let mockConfig: PlayerDisplayConfig;
  let mockOnConfigChange: ReturnType<typeof vi.fn>;
  let user: ReturnType<typeof userEvent.setup>;

  const defaultConfig: PlayerDisplayConfig = {
    showNames: true,
    showNumbers: true,
    showStats: false,
    showStamina: true,
    showMorale: true,
    showAvailability: true,
    iconType: 'circle',
    namePosition: 'below',
    size: 'medium',
  };

  beforeEach(() => {
    mockConfig = { ...defaultConfig };
    mockOnConfigChange = vi.fn();
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the settings toggle button', () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      expect(screen.getByRole('button', { name: /display/i })).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('initially shows closed settings panel', () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      renderWithProviders(
        <PlayerDisplaySettings
          config={mockConfig}
          onConfigChange={mockOnConfigChange}
          className="custom-class"
        />,
      );

      const container = screen.getByTestId('player-display-settings');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Settings Panel Interaction', () => {
    it('opens settings panel when toggle button is clicked', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });
    });

    it('closes settings panel when toggle button is clicked again', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });

      // Open panel
      await user.click(toggleButton);
      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      // Close panel
      await user.click(toggleButton);
      await waitFor(() => {
        expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
      });
    });

    it('closes panel when backdrop is clicked', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      const backdrop = screen.getByTestId('settings-backdrop');
      await user.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
      });
    });

    it('closes panel when close button is clicked', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /×/ });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
      });
    });

    it('prevents event propagation when clicking inside panel', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      const panel = screen.getByTestId('settings-panel');
      await user.click(panel);

      // Panel should remain open
      expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
    });
  });

  describe('Toggle Options', () => {
    beforeEach(async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });
    });

    it('displays all visibility toggle options', () => {
      expect(screen.getByText('Player Names')).toBeInTheDocument();
      expect(screen.getByText('Jersey Numbers')).toBeInTheDocument();
      expect(screen.getByText('Player Stats')).toBeInTheDocument();
      expect(screen.getByText('Stamina Bar')).toBeInTheDocument();
      expect(screen.getByText('Morale Indicator')).toBeInTheDocument();
      expect(screen.getByText('Availability Status')).toBeInTheDocument();
    });

    it('shows correct initial toggle states', () => {
      // Names should be enabled
      const namesToggle = screen.getByTestId('toggle-showNames');
      expect(namesToggle).toHaveClass('bg-blue-600');

      // Stats should be disabled
      const statsToggle = screen.getByTestId('toggle-showStats');
      expect(statsToggle).toHaveClass('bg-slate-600');
    });

    it('calls onConfigChange when name visibility is toggled', async () => {
      const namesToggle = screen.getByTestId('toggle-showNames');
      await user.click(namesToggle);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        showNames: false,
      });
    });

    it('calls onConfigChange when stats visibility is toggled', async () => {
      const statsToggle = screen.getByTestId('toggle-showStats');
      await user.click(statsToggle);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        showStats: true,
      });
    });

    it('calls onConfigChange when stamina visibility is toggled', async () => {
      const staminaToggle = screen.getByTestId('toggle-showStamina');
      await user.click(staminaToggle);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        showStamina: false,
      });
    });

    it('calls onConfigChange when morale visibility is toggled', async () => {
      const moraleToggle = screen.getByTestId('toggle-showMorale');
      await user.click(moraleToggle);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        showMorale: false,
      });
    });

    it('calls onConfigChange when availability visibility is toggled', async () => {
      const availabilityToggle = screen.getByTestId('toggle-showAvailability');
      await user.click(availabilityToggle);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        showAvailability: false,
      });
    });

    it('shows descriptions for toggle options', () => {
      expect(screen.getByText('Show player names on tokens')).toBeInTheDocument();
      expect(screen.getByText('Show jersey numbers')).toBeInTheDocument();
      expect(screen.getByText('Show overall rating')).toBeInTheDocument();
      expect(screen.getByText('Show stamina indicators')).toBeInTheDocument();
      expect(screen.getByText('Show player morale status')).toBeInTheDocument();
      expect(screen.getByText('Show injury/suspension status')).toBeInTheDocument();
    });
  });

  describe('Select Options', () => {
    beforeEach(async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });
    });

    it('displays icon type selection options', () => {
      expect(screen.getByText('Icon Type')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Circle' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Jersey' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Photo' })).toBeInTheDocument();
    });

    it('displays name position selection options', () => {
      expect(screen.getByText('Name Position')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Above' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Below' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Inside' })).toBeInTheDocument();
    });

    it('displays token size selection options', () => {
      expect(screen.getByText('Token Size')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument();
    });

    it('shows active state for current icon type', () => {
      const circleButton = screen.getByRole('button', { name: 'Circle' });
      expect(circleButton).toHaveClass('bg-blue-600');

      const jerseyButton = screen.getByRole('button', { name: 'Jersey' });
      expect(jerseyButton).toHaveClass('bg-slate-700');
    });

    it('shows active state for current name position', () => {
      const belowButton = screen.getByRole('button', { name: 'Below' });
      expect(belowButton).toHaveClass('bg-blue-600');

      const aboveButton = screen.getByRole('button', { name: 'Above' });
      expect(aboveButton).toHaveClass('bg-slate-700');
    });

    it('shows active state for current size', () => {
      const mediumButton = screen.getByRole('button', { name: 'Medium' });
      expect(mediumButton).toHaveClass('bg-blue-600');

      const smallButton = screen.getByRole('button', { name: 'Small' });
      expect(smallButton).toHaveClass('bg-slate-700');
    });

    it('calls onConfigChange when icon type is changed', async () => {
      const jerseyButton = screen.getByRole('button', { name: 'Jersey' });
      await user.click(jerseyButton);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        iconType: 'jersey',
      });
    });

    it('calls onConfigChange when name position is changed', async () => {
      const aboveButton = screen.getByRole('button', { name: 'Above' });
      await user.click(aboveButton);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        namePosition: 'above',
      });
    });

    it('calls onConfigChange when size is changed', async () => {
      const largeButton = screen.getByRole('button', { name: 'Large' });
      await user.click(largeButton);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        size: 'large',
      });
    });
  });

  describe('Reset Functionality', () => {
    beforeEach(async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });
    });

    it('displays reset to defaults button', () => {
      expect(screen.getByRole('button', { name: 'Reset to Defaults' })).toBeInTheDocument();
    });

    it('resets to default configuration when reset button is clicked', async () => {
      const resetButton = screen.getByRole('button', { name: 'Reset to Defaults' });
      await user.click(resetButton);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        showNames: true,
        showNumbers: true,
        showStats: false,
        showStamina: true,
        showMorale: true,
        showAvailability: true,
        iconType: 'circle',
        namePosition: 'below',
        size: 'medium',
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports tab navigation through settings', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });

      // Tab to toggle button
      await user.tab();
      expect(toggleButton).toHaveFocus();

      // Open panel with Enter
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      // Tab to first toggle
      await user.tab();
      expect(screen.getByTestId('toggle-showNames')).toHaveFocus();

      // Tab to next toggle
      await user.tab();
      expect(screen.getByTestId('toggle-showNumbers')).toHaveFocus();
    });

    it('closes panel with Escape key', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
      });
    });

    it('activates toggles with Space key', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      const namesToggle = screen.getByTestId('toggle-showNames');
      namesToggle.focus();

      await user.keyboard(' ');

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        showNames: false,
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for toggle button', () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      expect(toggleButton).toHaveAttribute(
        'aria-label',
        expect.stringContaining('display settings'),
      );
    });

    it('provides proper ARIA labels for toggles', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      const namesToggle = screen.getByTestId('toggle-showNames');
      expect(namesToggle).toHaveAttribute('aria-label', expect.stringContaining('Player Names'));
      expect(namesToggle).toHaveAttribute('role', 'switch');
      expect(namesToggle).toHaveAttribute('aria-checked', 'true');
    });

    it('provides proper ARIA labels for select options', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      const circleButton = screen.getByRole('button', { name: 'Circle' });
      expect(circleButton).toHaveAttribute('aria-pressed', 'true');

      const jerseyButton = screen.getByRole('button', { name: 'Jersey' });
      expect(jerseyButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('announces changes to screen readers', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      const namesToggle = screen.getByTestId('toggle-showNames');
      await user.click(namesToggle);

      // Should announce the change
      expect(screen.getByTestId('sr-announcer')).toHaveTextContent(/player names.*disabled/i);
    });
  });

  describe('Animation and Visual Feedback', () => {
    it('shows hover effects on toggle button', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });

      await user.hover(toggleButton);
      expect(toggleButton).toHaveClass('hover:bg-slate-700');
    });

    it('shows panel animation when opening', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        const panel = screen.getByTestId('settings-panel');
        expect(panel).toHaveClass('animate-in');
      });
    });

    it('shows toggle switch animations', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      const namesToggle = screen.getByTestId('toggle-showNames');
      const toggleSlider = within(namesToggle).getByTestId('toggle-slider');

      expect(toggleSlider).toHaveStyle({ transform: 'translateX(22px)' }); // Enabled position
    });
  });

  describe('Configuration Persistence', () => {
    it('reflects configuration changes in UI immediately', async () => {
      const { rerender } = renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      // Update config externally
      const updatedConfig = { ...mockConfig, showNames: false };
      rerender(
        <PlayerDisplaySettings config={updatedConfig} onConfigChange={mockOnConfigChange} />,
      );

      const namesToggle = screen.getByTestId('toggle-showNames');
      expect(namesToggle).toHaveClass('bg-slate-600'); // Should show disabled state
    });

    it('handles rapid configuration changes gracefully', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={mockOnConfigChange} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      // Rapidly click multiple toggles
      const toggles = ['showNames', 'showNumbers', 'showStats', 'showStamina'];
      for (const toggleKey of toggles) {
        const toggle = screen.getByTestId(`toggle-${toggleKey}`);
        await user.click(toggle);
      }

      expect(mockOnConfigChange).toHaveBeenCalledTimes(4);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing config gracefully', () => {
      expect(() => {
        renderWithProviders(
          <PlayerDisplaySettings config={null as any} onConfigChange={mockOnConfigChange} />,
        );
      }).not.toThrow();
    });

    it('handles missing onConfigChange callback', async () => {
      renderWithProviders(
        <PlayerDisplaySettings config={mockConfig} onConfigChange={undefined as any} />,
      );

      const toggleButton = screen.getByRole('button', { name: /display/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      });

      const namesToggle = screen.getByTestId('toggle-showNames');

      expect(() => user.click(namesToggle)).not.toThrow();
    });

    it('handles invalid config values', () => {
      const invalidConfig = {
        ...mockConfig,
        iconType: 'invalid' as any,
        namePosition: 'invalid' as any,
        size: 'invalid' as any,
      };

      expect(() => {
        renderWithProviders(
          <PlayerDisplaySettings config={invalidConfig} onConfigChange={mockOnConfigChange} />,
        );
      }).not.toThrow();
    });
  });
});
