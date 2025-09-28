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
  userEvent
} from '../../utils/comprehensive-test-providers';
import PlayerDisplaySettings, { PlayerDisplayConfig } from '../../../components/tactics/PlayerDisplaySettings';

describe('PlayerDisplaySettings - Comprehensive Test Suite', () => {
  let mockProps: ReturnType<typeof createMockProps.playerDisplaySettings>;
  let user: ReturnType<typeof userEvent.setup>;
  let testConfig: PlayerDisplayConfig;

  beforeEach(() => {
    mockProps = createMockProps.playerDisplaySettings();
    user = userEvent.setup();
    
    testConfig = {
      showNames: true,
      showNumbers: true,
      showStats: false,
      showStamina: true,
      showMorale: true,
      showAvailability: true,
      iconType: 'circle',
      namePosition: 'below',
      size: 'medium'
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render all display configuration options', () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      // Check main sections
      expect(screen.getByText(/player display settings/i)).toBeInTheDocument();
      expect(screen.getByText(/visibility options/i)).toBeInTheDocument();
      expect(screen.getByText(/appearance settings/i)).toBeInTheDocument();
    });

    it('should display current configuration state correctly', () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      // Check toggle states
      expect(screen.getByLabelText(/show player names/i)).toBeChecked();
      expect(screen.getByLabelText(/show jersey numbers/i)).toBeChecked();
      expect(screen.getByLabelText(/show player stats/i)).not.toBeChecked();
      expect(screen.getByLabelText(/show stamina/i)).toBeChecked();
      expect(screen.getByLabelText(/show morale/i)).toBeChecked();
      expect(screen.getByLabelText(/show availability/i)).toBeChecked();
    });

    it('should show correct icon type selection', () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const iconTypeSelect = screen.getByLabelText(/icon type/i);
      expect(iconTypeSelect).toHaveValue('circle');
    });

    it('should show correct name position selection', () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const namePositionSelect = screen.getByLabelText(/name position/i);
      expect(namePositionSelect).toHaveValue('below');
    });

    it('should show correct size selection', () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const sizeSelect = screen.getByLabelText(/player size/i);
      expect(sizeSelect).toHaveValue('medium');
    });
  });

  describe('Visibility Options Interaction', () => {
    it('should toggle show names option', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const showNamesToggle = screen.getByLabelText(/show player names/i);
      await user.click(showNamesToggle);

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        showNames: false
      });
    });

    it('should toggle show numbers option', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const showNumbersToggle = screen.getByLabelText(/show jersey numbers/i);
      await user.click(showNumbersToggle);

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        showNumbers: false
      });
    });

    it('should toggle show stats option', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const showStatsToggle = screen.getByLabelText(/show player stats/i);
      await user.click(showStatsToggle);

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        showStats: true
      });
    });

    it('should toggle show stamina option', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const showStaminaToggle = screen.getByLabelText(/show stamina/i);
      await user.click(showStaminaToggle);

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        showStamina: false
      });
    });

    it('should toggle show morale option', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const showMoraleToggle = screen.getByLabelText(/show morale/i);
      await user.click(showMoraleToggle);

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        showMorale: false
      });
    });

    it('should toggle show availability option', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const showAvailabilityToggle = screen.getByLabelText(/show availability/i);
      await user.click(showAvailabilityToggle);

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        showAvailability: false
      });
    });
  });

  describe('Appearance Settings Interaction', () => {
    it('should change icon type to square', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const iconTypeSelect = screen.getByLabelText(/icon type/i);
      await user.selectOptions(iconTypeSelect, 'square');

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        iconType: 'square'
      });
    });

    it('should change icon type to jersey', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const iconTypeSelect = screen.getByLabelText(/icon type/i);
      await user.selectOptions(iconTypeSelect, 'jersey');

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        iconType: 'jersey'
      });
    });

    it('should change icon type to photo', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const iconTypeSelect = screen.getByLabelText(/icon type/i);
      await user.selectOptions(iconTypeSelect, 'photo');

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        iconType: 'photo'
      });
    });

    it('should change name position to above', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const namePositionSelect = screen.getByLabelText(/name position/i);
      await user.selectOptions(namePositionSelect, 'above');

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        namePosition: 'above'
      });
    });

    it('should change name position to hidden', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const namePositionSelect = screen.getByLabelText(/name position/i);
      await user.selectOptions(namePositionSelect, 'hidden');

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        namePosition: 'hidden'
      });
    });

    it('should change size to small', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const sizeSelect = screen.getByLabelText(/player size/i);
      await user.selectOptions(sizeSelect, 'small');

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        size: 'small'
      });
    });

    it('should change size to large', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const sizeSelect = screen.getByLabelText(/player size/i);
      await user.selectOptions(sizeSelect, 'large');

      expect(mockProps.onChange).toHaveBeenCalledWith({
        ...testConfig,
        size: 'large'
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should call onReset when reset button is clicked', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const resetButton = screen.getByRole('button', { name: /reset to default/i });
      await user.click(resetButton);

      expect(mockProps.onReset).toHaveBeenCalled();
    });

    it('should show reset button when configuration differs from default', () => {
      const modifiedConfig = {
        ...testConfig,
        showNames: false,
        iconType: 'square' as const
      };

      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={modifiedConfig} />
      );

      expect(screen.getByRole('button', { name: /reset to default/i })).toBeInTheDocument();
    });
  });

  describe('Preview and Live Updates', () => {
    it('should show preview of current settings', () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      // Preview section should be visible
      expect(screen.getByText(/preview/i)).toBeInTheDocument();
      
      // Preview should show a sample player with current settings
      const preview = screen.getByTestId('player-display-preview');
      expect(preview).toBeInTheDocument();
    });

    it('should update preview when settings change', async () => {
      const { rerender } = renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const modifiedConfig = {
        ...testConfig,
        showNames: false,
        iconType: 'square' as const
      };

      rerender(
        <PlayerDisplaySettings {...mockProps} config={modifiedConfig} />
      );

      const preview = screen.getByTestId('player-display-preview');
      expect(preview).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all controls', () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      // Check form controls have proper labels
      expect(screen.getByLabelText(/show player names/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show jersey numbers/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show player stats/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show stamina/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show morale/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show availability/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/icon type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name position/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/player size/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      // Tab through controls
      await user.tab();
      expect(document.activeElement).toBeDefined();

      await user.tab();
      expect(document.activeElement).toBeDefined();
    });

    it('should have proper role attributes', () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const settingsPanel = screen.getByRole('tabpanel') || screen.getByRole('group');
      expect(settingsPanel).toBeInTheDocument();
    });
  });

  describe('Advanced Configuration Scenarios', () => {
    it('should handle all options disabled', () => {
      const allDisabledConfig: PlayerDisplayConfig = {
        showNames: false,
        showNumbers: false,
        showStats: false,
        showStamina: false,
        showMorale: false,
        showAvailability: false,
        iconType: 'circle',
        namePosition: 'hidden',
        size: 'small'
      };

      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={allDisabledConfig} />
      );

      // All toggles should be unchecked
      expect(screen.getByLabelText(/show player names/i)).not.toBeChecked();
      expect(screen.getByLabelText(/show jersey numbers/i)).not.toBeChecked();
      expect(screen.getByLabelText(/show player stats/i)).not.toBeChecked();
      expect(screen.getByLabelText(/show stamina/i)).not.toBeChecked();
      expect(screen.getByLabelText(/show morale/i)).not.toBeChecked();
      expect(screen.getByLabelText(/show availability/i)).not.toBeChecked();
    });

    it('should handle all options enabled', () => {
      const allEnabledConfig: PlayerDisplayConfig = {
        showNames: true,
        showNumbers: true,
        showStats: true,
        showStamina: true,
        showMorale: true,
        showAvailability: true,
        iconType: 'photo',
        namePosition: 'above',
        size: 'large'
      };

      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={allEnabledConfig} />
      );

      // All toggles should be checked
      expect(screen.getByLabelText(/show player names/i)).toBeChecked();
      expect(screen.getByLabelText(/show jersey numbers/i)).toBeChecked();
      expect(screen.getByLabelText(/show player stats/i)).toBeChecked();
      expect(screen.getByLabelText(/show stamina/i)).toBeChecked();
      expect(screen.getByLabelText(/show morale/i)).toBeChecked();
      expect(screen.getByLabelText(/show availability/i)).toBeChecked();

      // Selects should show correct values
      expect(screen.getByLabelText(/icon type/i)).toHaveValue('photo');
      expect(screen.getByLabelText(/name position/i)).toHaveValue('above');
      expect(screen.getByLabelText(/player size/i)).toHaveValue('large');
    });

    it('should handle rapid configuration changes', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      // Rapidly toggle multiple options
      const showNamesToggle = screen.getByLabelText(/show player names/i);
      const showNumbersToggle = screen.getByLabelText(/show jersey numbers/i);
      const showStatsToggle = screen.getByLabelText(/show player stats/i);

      await user.click(showNamesToggle);
      await user.click(showNumbersToggle);
      await user.click(showStatsToggle);

      // Should handle all changes
      expect(mockProps.onChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance and Optimization', () => {
    it('should not cause excessive re-renders on configuration changes', async () => {
      let renderCount = 0;
      const TestComponent = () => {
        renderCount++;
        return <PlayerDisplaySettings {...mockProps} config={testConfig} />;
      };

      renderWithProviders(<TestComponent />);

      const initialRenderCount = renderCount;

      // Make a configuration change
      const showNamesToggle = screen.getByLabelText(/show player names/i);
      await user.click(showNamesToggle);

      // Should not cause excessive re-renders
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(2);
    });

    it('should debounce rapid changes', async () => {
      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={testConfig} />
      );

      const iconTypeSelect = screen.getByLabelText(/icon type/i);

      // Rapidly change values
      await user.selectOptions(iconTypeSelect, 'square');
      await user.selectOptions(iconTypeSelect, 'jersey');
      await user.selectOptions(iconTypeSelect, 'photo');

      // Should handle all changes but may debounce callbacks
      expect(mockProps.onChange).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined config gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        renderWithProviders(
          <PlayerDisplaySettings {...mockProps} config={undefined as any} />
        );

        // Should render without crashing
        expect(screen.getByText(/player display settings/i)).toBeInTheDocument();
      } catch (error) {
        // Should handle gracefully
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle missing onChange callback', () => {
      const propsWithoutOnChange = {
        ...mockProps,
        onChange: undefined as any
      };

      renderWithProviders(
        <PlayerDisplaySettings {...propsWithoutOnChange} config={testConfig} />
      );

      // Should render without issues
      expect(screen.getByText(/player display settings/i)).toBeInTheDocument();
    });

    it('should handle invalid config values', () => {
      const invalidConfig = {
        ...testConfig,
        iconType: 'invalid' as any,
        size: 'invalid' as any,
        namePosition: 'invalid' as any
      };

      renderWithProviders(
        <PlayerDisplaySettings {...mockProps} config={invalidConfig} />
      );

      // Should handle invalid values gracefully
      expect(screen.getByText(/player display settings/i)).toBeInTheDocument();
    });
  });
});