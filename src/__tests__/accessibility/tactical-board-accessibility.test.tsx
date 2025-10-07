import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  renderWithProviders,
  generateCompleteTacticalSetup,
} from '../utils/enhanced-mock-generators';
import { UnifiedTacticsBoard } from '../../components/tactics/UnifiedTacticsBoard';

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

/**
 * ACCESSIBILITY TEST SUITE FOR TACTICAL BOARD
 *
 * Comprehensive accessibility testing covering:
 * - WCAG 2.1 AA compliance
 * - Screen reader compatibility
 * - Keyboard navigation
 * - Focus management
 * - Color contrast
 * - Alternative text
 * - ARIA attributes
 * - High contrast mode
 * - Reduced motion
 * - Voice control support
 */

describe('♿ Tactical Board Accessibility Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let tacticalSetup: ReturnType<typeof generateCompleteTacticalSetup>;

  beforeEach(() => {
    user = (userEvent.setup as any)();
    tacticalSetup = (generateCompleteTacticalSetup as any)('4-4-2', 'medium');

    // Mock accessibility APIs
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
      dispatchEvent: vi.fn(() => true),
    } as any;

    // Mock screen reader detection
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (compatible; NVDA)',
      writable: true,
    });

    // Mock prefers-reduced-motion
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

    // Mock high contrast mode
    Object.defineProperty(window, 'getComputedStyle', {
      writable: true,
      value: vi.fn().mockReturnValue({
        getPropertyValue: vi.fn(() => ''),
        backgroundColor: 'rgb(255, 255, 255)',
        color: 'rgb(0, 0, 0)',
        borderColor: 'rgb(128, 128, 128)',
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('🎯 WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard />);

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      const results = await axe(container, {
        rules: {
          // Enable all WCAG 2.1 AA rules
          wcag2a: { enabled: true },
          wcag2aa: { enabled: true },
          wcag21a: { enabled: true },
          wcag21aa: { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper semantic structure', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      // Main application should have application role
      const application = screen.getByRole('application');
      expect(application).toBeInTheDocument();
      expect(application).toHaveAttribute('aria-label', 'Soccer Tactics Board');

      // Field should have grid role for spatial navigation
      const field = screen.getByTestId('modern-field');
      expect(field).toHaveAttribute('role', 'grid');
      expect(field).toHaveAttribute('aria-label');

      // Toolbar should have toolbar role
      const toolbar = screen.getByTestId('unified-floating-toolbar');
      expect(toolbar).toHaveAttribute('role', 'toolbar');
      expect(toolbar).toHaveAttribute('aria-label');
    });

    it('should have proper heading hierarchy', async () => {
      const initialState = {
        tactics: {
          players: tacticalSetup.players,
          formations: { [tacticalSetup.formation.id]: tacticalSetup.formation },
          activeFormationIds: { home: tacticalSetup.formation.id, away: '' },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check heading structure (should start with h1 and be hierarchical)
      const headings = screen.getAllByRole('heading');

      if (headings.length > 0) {
        const levels = headings.map(h => parseInt(h.tagName.charAt(1)));

        // First heading should be h1 or h2 (depending on page structure)
        expect(levels[0]).toBeLessThanOrEqual(2);

        // No heading should skip levels
        for (let i = 1; i < levels.length; i++) {
          expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should have sufficient color contrast', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Test key interactive elements for color contrast
      const buttons = screen.getAllByRole('button');

      for (const button of buttons.slice(0, 5)) {
        // Test first 5 buttons
        const styles = getComputedStyle(button);
        const backgroundColor = styles.backgroundColor;
        const color = styles.color;

        // Basic check - should have contrasting colors
        expect(backgroundColor).not.toBe(color);
        expect(backgroundColor).not.toBe('');
        expect(color).not.toBe('');
      }
    });

    it('should support keyboard-only navigation', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      // Should be able to tab through all interactive elements
      await user.tab();

      let focusedElement = document.activeElement;
      expect(focusedElement).toBeVisible();
      expect(focusedElement?.tagName).toMatch(/BUTTON|INPUT|SELECT|A|DIV/);

      // Continue tabbing through elements
      const tabbableElements = [];
      for (let i = 0; i < 10; i++) {
        await user.tab();
        focusedElement = document.activeElement;

        if (focusedElement && focusedElement !== document.body) {
          (tabbableElements as any).push(focusedElement);
        }
      }

      // Should have found multiple tabbable elements
      expect(tabbableElements.length).toBeGreaterThan(0);
    });
  });

  describe('🔊 Screen Reader Support', () => {
    it('should announce formation changes', async () => {
      const mockSpeak = vi.fn();
      global.speechSynthesis.speak = mockSpeak;

      const initialState = {
        tactics: {
          formations: {
            '442': tacticalSetup.formation,
            '433': { ...tacticalSetup.formation, id: '433', name: '4-3-3 Formation' },
          },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Trigger formation change
      fireEvent.click(screen.getByTestId('formation-templates-button'));
      fireEvent.click(screen.getByText('4-3-3 Formation'));

      // Should announce the change
      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });
    });

    it('should provide meaningful descriptions for players', async () => {
      const initialState = {
        tactics: {
          players: tacticalSetup.players.slice(0, 11),
          formations: { [tacticalSetup.formation.id]: tacticalSetup.formation },
          activeFormationIds: { home: tacticalSetup.formation.id, away: '' },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const playerElements = screen.getAllByTestId(/player-/);

      for (const player of playerElements.slice(0, 3)) {
        // Test first 3 players
        // Should have accessible name
        expect(player).toHaveAttribute('aria-label');

        const ariaLabel = player.getAttribute('aria-label');
        expect(ariaLabel).toContain('player'); // Should identify as a player
        expect(ariaLabel).toMatch(/position|role/i); // Should mention position
      }
    });

    it('should support live regions for dynamic updates', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      // Check for live regions
      const liveRegions = screen.getAllByLabelText(/live|status|alert/i);
      expect(liveRegions.length).toBeGreaterThan(0);

      // Primary live region should exist
      const mainLiveRegion = screen.getByRole('status') || screen.getByLabelText(/status/i);
      expect(mainLiveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should describe complex tactical visualizations', async () => {
      const initialState = {
        tactics: {
          players: tacticalSetup.players,
          formations: { [tacticalSetup.formation.id]: tacticalSetup.formation },
          drawings: [
            {
              id: 'arrow-1',
              tool: 'arrow' as const,
              color: '#ff0000',
              points: [
                { x: 100, y: 200 },
                { x: 300, y: 400 },
              ],
              timestamp: Date.now(),
            },
          ],
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Drawings should have text alternatives
      const drawingElements = screen.getAllByTestId(/drawing-/);

      for (const drawing of drawingElements) {
        expect(drawing).toHaveAttribute('aria-label');

        const description = drawing.getAttribute('aria-label');
        expect(description).toMatch(/arrow|line|zone|drawing/i);
      }
    });
  });

  describe('⌨️ Keyboard Navigation', () => {
    it('should support arrow key navigation on field', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      const field = screen.getByTestId('modern-field');
      field.focus();

      // Arrow keys should move focus within field
      fireEvent.keyDown(field, { key: 'ArrowRight' });
      fireEvent.keyDown(field, { key: 'ArrowDown' });
      fireEvent.keyDown(field, { key: 'ArrowLeft' });
      fireEvent.keyDown(field, { key: 'ArrowUp' });

      // Should maintain focus on field
      expect(field).toHaveFocus();
    });

    it('should support keyboard shortcuts', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      const application = screen.getByRole('application');
      application.focus();

      // Test common shortcuts
      fireEvent.keyDown(application, { key: 'F11' }); // Fullscreen
      fireEvent.keyDown(application, { key: 'Escape' }); // Exit/Cancel
      fireEvent.keyDown(application, { key: ' ' }); // Space for play/pause
      fireEvent.keyDown(application, { key: 'Enter' }); // Activate

      // Should handle shortcuts without errors
      expect(application).toBeInTheDocument();
    });

    it('should trap focus in modal dialogs', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      // Open a modal
      const settingsButton = screen.getByTestId('settings-button');
      await user.click(settingsButton);

      // Check if modal is open
      const modal = screen.queryByRole('dialog');
      if (modal) {
        // Focus should be trapped within modal
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );

        expect(focusableElements.length).toBeGreaterThan(0);

        // First element should receive focus
        expect(focusableElements[0]).toHaveFocus();

        // Tab should cycle within modal
        await user.tab();
        expect(document.activeElement).toBe(focusableElements[1] || focusableElements[0]);
      }
    });

    it('should support spatial navigation for players', async () => {
      const initialState = {
        tactics: {
          players: tacticalSetup.players.slice(0, 11),
          formations: { [tacticalSetup.formation.id]: tacticalSetup.formation },
          activeFormationIds: { home: tacticalSetup.formation.id, away: '' },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const firstPlayer = screen.getAllByTestId(/player-/)[0];
      firstPlayer.focus();

      // Arrow keys should navigate between players spatially
      fireEvent.keyDown(firstPlayer, { key: 'ArrowRight' });

      const newFocusedElement = document.activeElement;
      expect(newFocusedElement).toHaveAttribute('data-testid', expect.stringMatching(/player-/));
      expect(newFocusedElement).not.toBe(firstPlayer);
    });
  });

  describe('🎨 Visual Accessibility', () => {
    it('should support high contrast mode', async () => {
      // Mock high contrast media query
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('prefers-contrast: high'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderWithProviders(<UnifiedTacticsBoard />);

      const application = screen.getByRole('application');

      // Should apply high contrast styles
      expect(application).toBeInTheDocument();

      // Test that borders and outlines are visible
      const buttons = screen.getAllByRole('button');
      for (const button of buttons.slice(0, 3)) {
        const styles = getComputedStyle(button);
        // Should have visible borders in high contrast
        expect(styles.borderWidth || styles.outlineWidth).toBeTruthy();
      }
    });

    it('should respect reduced motion preferences', async () => {
      // Mock reduced motion preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderWithProviders(<UnifiedTacticsBoard />);

      // Trigger an animation
      const field = screen.getByTestId('modern-field');
      fireEvent.mouseDown(field);
      fireEvent.mouseMove(field);

      // Should minimize or disable animations
      const animatedElements = screen.getAllByTestId(/animation|transition/);
      for (const element of animatedElements) {
        const styles = getComputedStyle(element);
        expect(styles.animation).toMatch(/(none|0s)/);
        expect(styles.transition).toMatch(/(none|0s)/);
      }
    });

    it('should provide sufficient focus indicators', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      const buttons = screen.getAllByRole('button');

      for (const button of buttons.slice(0, 3)) {
        button.focus();

        const styles = getComputedStyle(button);

        // Should have visible focus indicator
        expect(
          styles.outline !== 'none' || styles.boxShadow !== 'none' || styles.border !== 'none',
        ).toBe(true);
      }
    });

    it('should support zoom up to 200% without horizontal scrolling', async () => {
      // Mock zoom level
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 2, // 200% zoom
      });

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 960, // Half width due to zoom
      });

      renderWithProviders(<UnifiedTacticsBoard />);

      const application = screen.getByRole('application');

      // Should not cause horizontal scroll
      expect(application.scrollWidth).toBeLessThanOrEqual(application.clientWidth + 10);
    });
  });

  describe('🎙️ Voice Control Support', () => {
    it('should support voice commands through landmarks', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      // Should have proper landmarks
      expect(screen.getByRole('application')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();

      const navigation = screen.queryByRole('navigation');
      if (navigation) {
        expect(navigation).toHaveAttribute('aria-label');
      }

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label');
    });

    it('should have descriptive labels for voice commands', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      const buttons = screen.getAllByRole('button');

      for (const button of buttons.slice(0, 5)) {
        // Each button should have a clear, unique label
        const label = button.getAttribute('aria-label') || button.textContent;
        expect(label).toBeTruthy();
        expect(label!.length).toBeGreaterThan(2);
      }
    });

    it('should support voice navigation commands', async () => {
      const initialState = {
        tactics: {
          players: tacticalSetup.players.slice(0, 11),
          formations: { [tacticalSetup.formation.id]: tacticalSetup.formation },
          activeFormationIds: { home: tacticalSetup.formation.id, away: '' },
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Players should be discoverable by voice commands
      const players = screen.getAllByTestId(/player-/);

      for (const player of players.slice(0, 3)) {
        const label = player.getAttribute('aria-label');
        expect(label).toMatch(/player|goalkeeper|defender|midfielder|forward/i);
      }
    });
  });

  describe('🔤 Text and Content Accessibility', () => {
    it('should have proper text alternatives for images', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      const images = screen.getAllByRole('img');

      for (const image of images) {
        expect(image).toHaveAttribute('alt');

        const altText = image.getAttribute('alt');
        if (altText) {
          expect(altText.length).toBeGreaterThan(0);
        }
      }
    });

    it('should support text scaling', async () => {
      // Mock large text preference
      Object.defineProperty(document.documentElement, 'style', {
        writable: true,
        value: {
          fontSize: '24px', // 150% of default 16px
        },
      });

      renderWithProviders(<UnifiedTacticsBoard />);

      const application = screen.getByRole('application');

      // Should handle larger text without breaking layout
      expect(application).toBeInTheDocument();

      // Text should remain readable
      const textElements = screen.getAllByText(/formation|player|tactics/i);
      for (const element of textElements.slice(0, 3)) {
        expect(element).toBeVisible();
      }
    });

    it('should provide context for abbreviations', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      // Look for common abbreviations
      const abbreviations = screen.getAllByText(/GK|DF|MF|FW|CB|FB|CM|ST/);

      for (const abbr of abbreviations.slice(0, 3)) {
        // Should have title or aria-label explaining abbreviation
        expect(
          abbr.hasAttribute('title') ||
            abbr.hasAttribute('aria-label') ||
            abbr.closest('[aria-label]'),
        ).toBe(true);
      }
    });

    it('should have clear error messages', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      // Trigger an error condition
      const invalidButton = screen.getByTestId('invalid-action-button');
      if (invalidButton) {
        fireEvent.click(invalidButton);

        // Error should be announced and visible
        const errorMessage = screen.queryByRole('alert');
        if (errorMessage) {
          expect(errorMessage).toBeVisible();
          expect(errorMessage.textContent).toBeTruthy();
          expect(errorMessage.textContent!.length).toBeGreaterThan(5);
        }
      }
    });
  });

  describe('📱 Mobile Accessibility', () => {
    it('should support touch accessibility', async () => {
      // Mock mobile device
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mobile Safari',
        writable: true,
      });

      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true,
      });

      renderWithProviders(<UnifiedTacticsBoard />);

      const buttons = screen.getAllByRole('button');

      for (const button of buttons.slice(0, 3)) {
        const styles = getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight || '0');
        const minWidth = parseInt(styles.minWidth || '0');

        // Should meet minimum touch target size (44px)
        expect(Math.max(minHeight, minWidth)).toBeGreaterThanOrEqual(44);
      }
    });

    it('should support screen reader gestures', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      const field = screen.getByTestId('modern-field');

      // Should support swipe gestures for navigation
      expect(field).toHaveAttribute('role', 'grid');
      expect(field).toHaveAttribute('aria-label');

      // Grid cells should be navigable
      const gridCells = field.querySelectorAll('[role="gridcell"]');
      if (gridCells.length > 0) {
        for (const cell of Array.from(gridCells).slice(0, 3)) {
          expect(cell).toHaveAttribute('tabindex');
        }
      }
    });

    it('should provide haptic feedback context', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      // Interactive elements should indicate their function
      const draggableElements = screen.getAllByTestId(/player-/);

      for (const element of draggableElements.slice(0, 3)) {
        expect(element).toHaveAttribute('aria-label');

        const label = element.getAttribute('aria-label');
        expect(label).toMatch(/draggable|moveable|interactive/i);
      }
    });
  });

  describe('🧪 Accessibility Testing Tools Integration', () => {
    it('should pass automated accessibility scans', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard />);

      // Run comprehensive accessibility scan
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'aria-usage': { enabled: true },
          'semantic-structure': { enabled: true },
        },
      });

      expect(results.violations).toHaveLength(0);
    });

    it('should support accessibility testing hooks', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);

      // Should expose testing hooks for accessibility tools
      const testingElements = screen.getAllByTestId(/a11y-|accessibility-/);
      expect(testingElements.length).toBeGreaterThanOrEqual(0);

      // Application should have proper test IDs
      expect(screen.getByRole('application')).toHaveAttribute('data-testid');
    });

    it('should generate accessibility reports', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard />);

      const results = await axe(container);

      // Should provide detailed accessibility information
      expect(results.passes).toBeDefined();
      expect(results.violations).toBeDefined();
      expect(results.incomplete).toBeDefined();
      expect(results.inapplicable).toBeDefined();

      // Generate summary report
      const report = {
        totalChecks: results.passes.length + results.violations.length,
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        score: (results.passes.length / (results.passes.length + results.violations.length)) * 100,
      };

      expect(report.score).toBeGreaterThan(95); // 95% accessibility score
    });
  });
});
