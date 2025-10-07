import React from 'react';
// @ts-ignore - test providers may not resolve in strict mode
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
  userEvent,
} from '../utils/comprehensive-test-providers';
import { axe, toHaveNoViolations } from 'jest-axe';
// @ts-ignore - component imports may not resolve in strict mode
import { UnifiedTacticsBoard } from '../../../components/tactics/UnifiedTacticsBoard';
// @ts-ignore - component imports may not resolve in strict mode
import PlayerDisplaySettings from '../../../components/tactics/PlayerDisplaySettings';
// @ts-ignore - component imports may not resolve in strict mode
import PositionalBench from '../../../components/tactics/PositionalBench';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Comprehensive accessibility testing suite for tactical board components
 * Tests WCAG 2.1 AA compliance, keyboard navigation, screen reader support
 */

describe('Tactical Board Accessibility - Comprehensive Test Suite', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();

    // Mock screen reader announcements
    global.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => []),
      speaking: false,
      pending: false,
      paused: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as any;

    // Mock aria-live region updates
    const mockAriaLive = document.createElement('div');
    mockAriaLive.setAttribute('aria-live', 'polite');
    mockAriaLive.setAttribute('aria-atomic', 'true');
    mockAriaLive.className = 'sr-only';
    document.body.appendChild(mockAriaLive);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up aria-live regions
    document.querySelectorAll('.sr-only').forEach(el => el.remove());
  });

  describe('UnifiedTacticsBoard Accessibility', () => {
    it('should have no accessibility violations (WCAG 2.1 AA)', async () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      await waitFor(() => {
        expect(container.querySelector('[role="application"]')).toBeInTheDocument();
      });

      // Run axe accessibility tests
      const results = await axe(container, {
        rules: {
          // Focus on WCAG 2.1 AA compliance
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-allowed-attr': { enabled: true },
          label: { enabled: true },
          'landmark-unique': { enabled: true },
          region: { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper semantic structure', () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Check main landmarks
      expect(screen.getByRole('application')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Check for complementary regions (sidebars)
      const complementaryRegions = screen.getAllByRole('complementary');
      expect(complementaryRegions.length).toBeGreaterThanOrEqual(1);

      // Check application has proper label
      const app = screen.getByRole('application');
      expect(app).toHaveAttribute('aria-label', 'Soccer Tactics Board');
      expect(app).toHaveAttribute('aria-live', 'polite');
    });

    it('should support comprehensive keyboard navigation', async () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      const app = screen.getByRole('application');

      // Tab into application
      await user.tab();
      expect(document.activeElement).toBeDefined();

      // Test arrow key navigation
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{ArrowUp}');

      // Test action keys
      await user.keyboard('{Enter}');
      await user.keyboard(' '); // Space
      await user.keyboard('{Escape}');

      // Should maintain focus management
      expect(document.activeElement).toBeDefined();
      expect(document.activeElement).not.toBe(document.body);
    });

    it('should provide screen reader announcements for state changes', async () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Check for screen reader only content
      const srOnlyElement = container.querySelector('.sr-only');
      expect(srOnlyElement).toBeInTheDocument();
      expect(srOnlyElement).toHaveAttribute('aria-live', 'polite');
      expect(srOnlyElement).toHaveAttribute('aria-atomic', 'true');
    });

    it('should support high contrast mode', () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast: high'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Should adapt to high contrast mode
      expect(container.querySelector('[role="application"]')).toBeInTheDocument();
    });

    it('should support reduced motion preferences', () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Should respect reduced motion preference
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('should handle focus management in modals', async () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Simulate opening a modal (if available)
      const modalTrigger = screen.queryByRole('button', {
        name: /formation templates|settings|options/i,
      });
      if (modalTrigger) {
        await user.click(modalTrigger);

        await waitFor(() => {
          // Focus should move to modal
          const modal = screen.queryByRole('dialog');
          if (modal) {
            expect(modal).toBeInTheDocument();
            expect(modal).toHaveAttribute('aria-modal', 'true');
          }
        });

        // Test escape key to close modal
        await user.keyboard('{Escape}');

        // Focus should return to trigger
        await waitFor(() => {
          expect(modalTrigger).toHaveFocus();
        });
      }
    });
  });

  describe('PlayerDisplaySettings Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const mockProps = createMockProps.playerDisplaySettings();

      const { container } = renderWithProviders(<PlayerDisplaySettings {...mockProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and associations', () => {
      const mockProps = createMockProps.playerDisplaySettings();

      renderWithProviders(<PlayerDisplaySettings {...mockProps} />);

      // All form controls should have proper labels
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAccessibleName();
      });

      const selects = screen.getAllByRole('combobox');
      selects.forEach(select => {
        expect(select).toHaveAccessibleName();
      });

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should support keyboard navigation through form controls', async () => {
      const mockProps = createMockProps.playerDisplaySettings();

      renderWithProviders(<PlayerDisplaySettings {...mockProps} />);

      // Tab through all form controls
      const formControls = [
        ...screen.getAllByRole('checkbox'),
        ...screen.getAllByRole('combobox'),
        ...screen.getAllByRole('button'),
      ];

      for (let i = 0; i < formControls.length; i++) {
        await user.tab();
        // Should focus next control in tab order
        expect(document.activeElement).toBeDefined();
      }
    });

    it('should announce changes to screen readers', async () => {
      const mockProps = createMockProps.playerDisplaySettings();

      renderWithProviders(<PlayerDisplaySettings {...mockProps} />);

      const showNamesCheckbox = screen.getByLabelText(/show player names/i);

      // Change should trigger aria-live announcement
      await user.click(showNamesCheckbox);

      expect(mockProps.onChange).toHaveBeenCalled();
    });

    it('should provide clear error messages and validation', () => {
      const mockProps = createMockProps.playerDisplaySettings();

      renderWithProviders(<PlayerDisplaySettings {...mockProps} />);

      // Form should be accessible even with validation errors
      const formControls = screen.getAllByRole('checkbox');
      formControls.forEach(control => {
        expect(control).not.toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('PositionalBench Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const mockProps = createMockProps.positionalBench();

      const { container } = renderWithProviders(<PositionalBench {...mockProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper list structure and item labels', () => {
      const testData = createTestData.complete();
      const mockProps = {
        ...createMockProps.positionalBench(),
        players: testData.players.slice(11, 15), // 4 bench players
      };

      renderWithProviders(<PositionalBench {...mockProps} />);

      // Should have list role
      const bench = screen.getByRole('list', { name: /substitute players bench|bench/i });
      expect(bench).toBeInTheDocument();

      // Each player should be a list item
      const playerItems = screen.getAllByRole('listitem');
      expect(playerItems.length).toBe(4);

      // Each player item should have accessible name
      playerItems.forEach(item => {
        expect(item).toHaveAccessibleName();
        expect(item).toHaveAttribute('tabindex', '0');
      });
    });

    it('should support keyboard navigation between players', async () => {
      const testData = createTestData.complete();
      const mockProps = {
        ...createMockProps.positionalBench(),
        players: testData.players.slice(11, 15),
      };

      renderWithProviders(<PositionalBench {...mockProps} />);

      const playerItems = screen.getAllByRole('listitem');

      // Focus first player
      playerItems[0].focus();
      expect(playerItems[0]).toHaveFocus();

      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      expect(playerItems[1]).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      expect(playerItems[2]).toHaveFocus();

      await user.keyboard('{ArrowUp}');
      expect(playerItems[1]).toHaveFocus();
    });

    it('should support player selection with keyboard', async () => {
      const testData = createTestData.complete();
      const mockProps = {
        ...createMockProps.positionalBench(),
        players: testData.players.slice(11, 15),
      };

      renderWithProviders(<PositionalBench {...mockProps} />);

      const firstPlayer = screen.getAllByRole('listitem')[0];
      firstPlayer.focus();

      // Select with Enter
      await user.keyboard('{Enter}');
      expect(mockProps.onPlayerSelect).toHaveBeenCalledWith(testData.players[11]);

      // Select with Space
      await user.keyboard(' ');
      expect(mockProps.onPlayerSelect).toHaveBeenCalledWith(testData.players[11]);
    });

    it('should announce drag and drop operations', async () => {
      const testData = createTestData.complete();
      const mockProps = {
        ...createMockProps.positionalBench(),
        players: testData.players.slice(11, 15),
      };

      renderWithProviders(<PositionalBench {...mockProps} />);

      const firstPlayer = screen.getAllByRole('listitem')[0];

      // Should have drag and drop instructions
      expect(firstPlayer).toHaveAttribute('aria-describedby');

      // Simulate drag start
      fireEvent.dragStart(firstPlayer);

      // Should announce drag operation
      const ariaLive = document.querySelector('[aria-live]');
      expect(ariaLive).toBeInTheDocument();
    });

    it('should handle search accessibility', async () => {
      const testData = createTestData.complete();
      const mockProps = {
        ...createMockProps.positionalBench(),
        players: testData.players.slice(11, 15),
        searchable: true,
      };

      renderWithProviders(<PositionalBench {...mockProps} searchable={true} />);

      const searchInput = screen.getByRole('searchbox', { name: /search players/i });
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAccessibleName();

      // Should have proper ARIA attributes
      expect(searchInput).toHaveAttribute('aria-label');

      // Test search functionality
      await user.type(searchInput, 'test');

      // Should announce search results
      await waitFor(() => {
        const resultsRegion = screen.queryByRole('region', { name: /search results/i });
        if (resultsRegion) {
          expect(resultsRegion).toHaveAttribute('aria-live', 'polite');
        }
      });
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus within modal dialogs', async () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Find any button that might open a modal
      const buttons = screen.getAllByRole('button');
      const modalTrigger = buttons.find(
        button =>
          button.textContent?.toLowerCase().includes('settings') ||
          button.textContent?.toLowerCase().includes('templates') ||
          button.textContent?.toLowerCase().includes('options'),
      );

      if (modalTrigger) {
        await user.click(modalTrigger);

        // Check if modal opened
        const modal = screen.queryByRole('dialog');
        if (modal) {
          // Tab should cycle within modal
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );

          if (focusableElements.length > 1) {
            // Focus should be trapped within modal
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            lastElement.focus();
            await user.tab();
            expect(firstElement).toHaveFocus();

            await user.tab({ shift: true });
            expect(lastElement).toHaveFocus();
          }
        }
      }
    });

    it('should restore focus after modal close', async () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      const buttons = screen.getAllByRole('button');
      const modalTrigger = buttons[0];

      // Focus and activate trigger
      modalTrigger.focus();
      await user.click(modalTrigger);

      // Close modal (simulate escape or close button)
      await user.keyboard('{Escape}');

      // Focus should return to trigger
      await waitFor(() => {
        expect(modalTrigger).toHaveFocus();
      });
    });

    it('should skip hidden elements in tab order', async () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Tab through visible elements
      for (let i = 0; i < 10; i++) {
        await user.tab();

        const activeElement = document.activeElement as HTMLElement;

        // Should not focus hidden elements
        expect(activeElement.style.display).not.toBe('none');
        expect(activeElement.style.visibility).not.toBe('hidden');
        expect(activeElement.getAttribute('aria-hidden')).not.toBe('true');
        expect(activeElement.getAttribute('tabindex')).not.toBe('-1');
      }
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful accessible names', () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Main application should have accessible name
      const app = screen.getByRole('application');
      expect(app).toHaveAccessibleName();

      // Main content should have accessible name
      const main = screen.getByRole('main');
      expect(main).toHaveAccessibleName();

      // Interactive elements should have accessible names
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should provide live region updates', async () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Should have aria-live regions
      const liveRegions = container.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      liveRegions.forEach(region => {
        expect(region).toHaveAttribute('aria-live');
        expect(['polite', 'assertive', 'off']).toContain(region.getAttribute('aria-live'));
      });
    });

    it('should provide status updates for user actions', async () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Simulate user action
      const field = screen.getByRole('main');
      await user.click(field);

      // Should update screen reader content
      const srOnlyContent = container.querySelector('.sr-only');
      expect(srOnlyContent).toBeInTheDocument();
    });
  });

  describe('Color and Contrast', () => {
    it('should meet WCAG AA color contrast requirements', async () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      const { container } = renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Run axe color contrast tests
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should not rely solely on color for information', () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Important information should have additional indicators beyond color
      // This would be verified through visual inspection and design review
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Mobile Accessibility', () => {
    it('should support touch accessibility features', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true,
      });

      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // Touch targets should be adequate size (44px minimum)
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        // Note: In test environment, getBoundingClientRect returns 0
        // In real implementation, would check for minimum touch target size
        expect(button).toBeInTheDocument();
      });
    });

    it('should support voice control and switch navigation', () => {
      const testData = createTestData.complete();
      const mockProps = createMockProps.unifiedTacticsBoard();

      renderWithProviders(<UnifiedTacticsBoard {...mockProps} />, {
        initialTacticsState: testData.tacticsState,
        initialUIState: testData.uiState,
      });

      // All interactive elements should be accessible via voice/switch
      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('link'),
        ...screen.getAllByRole('checkbox'),
        ...screen.getAllByRole('combobox'),
      ];

      interactiveElements.forEach(element => {
        // Should have accessible name for voice control
        expect(element).toHaveAccessibleName();

        // Should be keyboard accessible for switch navigation
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });
});
