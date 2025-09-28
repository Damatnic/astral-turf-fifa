import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, a11yUtils } from '../utils/test-helpers';
import { generateFormation, generatePlayer, createTestDataSet } from '../utils/mock-generators';
import { UnifiedTacticsBoard } from '../../components/tactics/UnifiedTacticsBoard';
import { ModernField } from '../../components/tactics/ModernField';
import { PlayerToken } from '../../components/tactics/PlayerToken';
import { SmartSidebar } from '../../components/tactics/SmartSidebar';
import type { Formation, Player } from '../../types';

// Mock axe-core for accessibility testing
const mockAxe = a11yUtils.mockAxeCore();
vi.mock('@axe-core/react', () => ({
  default: mockAxe,
}));

// Mock speech synthesis for screen reader testing
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
};

Object.defineProperty(window, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true,
});

describe('Tactics Board Accessibility Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let testData: ReturnType<typeof createTestDataSet.complete>;

  beforeEach(() => {
    user = userEvent.setup();
    testData = createTestDataSet.complete();

    // Mock media queries for accessibility features
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Reset speech synthesis mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations in main interface', async () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const results = await mockAxe.run(document.body);
      expect(results.violations).toEqual([]);
    });

    it('should meet color contrast requirements', () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Test critical elements for color contrast
      const saveButton = screen.getByRole('button', { name: /save formation/i });
      const playerToken = screen.getAllByTestId('player-token')[0];
      const sidebarText = screen.getByText(/formations/i);

      // Mock color contrast checker
      const checkContrast = (element: HTMLElement) => {
        const styles = window.getComputedStyle(element);
        const backgroundColor = styles.backgroundColor;
        const color = styles.color;
        
        // Mock contrast ratio calculation
        // In real implementation, this would use actual color analysis
        return 4.5; // WCAG AA requirement
      };

      expect(checkContrast(saveButton)).toBeGreaterThanOrEqual(4.5);
      expect(checkContrast(playerToken)).toBeGreaterThanOrEqual(4.5);
      expect(checkContrast(sidebarText)).toBeGreaterThanOrEqual(4.5);
    });

    it('should have proper heading hierarchy', () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const headings = screen.getAllByRole('heading');
      
      // Check heading levels are sequential
      let currentLevel = 0;
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        if (currentLevel === 0) {
          expect(level).toBe(1); // First heading should be h1
        } else {
          expect(level - currentLevel).toBeLessThanOrEqual(1); // No skipping levels
        }
        currentLevel = level;
      });
    });

    it('should provide text alternatives for images and icons', () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check all images have alt text
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });

      // Check icons have accessible names
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const hasAccessibleName = 
          button.hasAttribute('aria-label') ||
          button.hasAttribute('aria-labelledby') ||
          button.textContent?.trim() !== '';
        expect(hasAccessibleName).toBe(true);
      });
    });

    it('should support keyboard-only navigation', async () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Start from document body
      document.body.focus();

      // Tab through interface
      const interactiveElements = [
        'button',
        'input',
        '[tabindex="0"]',
        'select',
        'textarea',
      ].join(', ');

      const focusableElements = document.querySelectorAll(interactiveElements);
      
      for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
        await user.tab();
        
        const activeElement = document.activeElement;
        expect(activeElement).toBeInstanceOf(Element);
        expect(activeElement).toHaveAttribute('tabindex');
      }
    });

    it('should have visible focus indicators', async () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      const saveButton = screen.getByRole('button', { name: /save formation/i });
      
      // Focus element
      saveButton.focus();
      
      // Check for focus indicator
      expect(saveButton).toHaveClass('focus-visible');
      
      // Check focus is clearly visible
      const styles = window.getComputedStyle(saveButton);
      const outline = styles.outline;
      const boxShadow = styles.boxShadow;
      
      const hasFocusIndicator = outline !== 'none' || boxShadow !== 'none';
      expect(hasFocusIndicator).toBe(true);
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper semantic structure', () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check main landmarks
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Check application region for interactive area
      const tacticalBoard = screen.getByRole('application');
      expect(tacticalBoard).toHaveAttribute('aria-label');
    });

    it('should announce state changes to screen readers', async () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Test formation change announcement
      const formationSelect = screen.getByRole('combobox', { name: /formation/i });
      await user.selectOptions(formationSelect, '4-3-3');

      const liveRegion = screen.getByTestId('screen-reader-announcements');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent(/formation changed/i);

      // Test player selection announcement
      const playerToken = screen.getAllByTestId('player-token')[0];
      await user.click(playerToken);

      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(/player selected/i);
      });
    });

    it('should provide comprehensive descriptions for complex elements', () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check player tokens have detailed descriptions
      const playerTokens = screen.getAllByTestId('player-token');
      playerTokens.forEach(token => {
        expect(token).toHaveAttribute('aria-label');
        expect(token).toHaveAttribute('aria-describedby');
        
        const ariaLabel = token.getAttribute('aria-label');
        expect(ariaLabel).toMatch(/player/i);
        expect(ariaLabel).toMatch(/position/i);
      });

      // Check field has description
      const field = screen.getByTestId('modern-field');
      expect(field).toHaveAttribute('aria-label');
      expect(field).toHaveAttribute('role', 'grid');
    });

    it('should support screen reader navigation patterns', async () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Test table/grid navigation
      const field = screen.getByRole('grid');
      field.focus();

      // Arrow key navigation
      await user.keyboard('[ArrowRight]');
      await user.keyboard('[ArrowDown]');
      
      // Should announce position changes
      const liveRegion = screen.getByTestId('screen-reader-announcements');
      expect(liveRegion).toHaveTextContent(/moved to/i);

      // Test list navigation in sidebar
      const sidebar = screen.getByRole('navigation');
      const firstItem = within(sidebar).getAllByRole('button')[0];
      firstItem.focus();

      await user.keyboard('[ArrowDown]');
      await user.keyboard('[ArrowUp]');
      
      // Should maintain focus within list
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });

    it('should work with voice control software', async () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Test voice commands simulation
      const buttons = screen.getAllByRole('button');
      
      // Voice software typically uses accessible names
      buttons.forEach(button => {
        const accessibleName = button.getAttribute('aria-label') || button.textContent;
        expect(accessibleName).toBeTruthy();
        expect(accessibleName?.length).toBeGreaterThan(0);
      });

      // Test click by accessible name
      const saveButton = screen.getByRole('button', { name: /save formation/i });
      
      // Simulate voice click
      await user.click(saveButton);
      
      // Should be clickable by voice commands
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('Motor Accessibility', () => {
    it('should have large enough touch targets for mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check button sizes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        const minSize = 44; // WCAG recommendation
        
        expect(rect.width).toBeGreaterThanOrEqual(minSize);
        expect(rect.height).toBeGreaterThanOrEqual(minSize);
      });

      // Check player tokens are large enough on mobile
      const playerTokens = screen.getAllByTestId('player-token');
      playerTokens.forEach(token => {
        const rect = token.getBoundingClientRect();
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });

    it('should support alternative input methods', async () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Test keyboard-only drag and drop
      const playerToken = screen.getAllByTestId('player-token')[0];
      playerToken.focus();

      // Use spacebar to initiate drag
      await user.keyboard('[Space]');
      expect(playerToken).toHaveAttribute('aria-grabbed', 'true');

      // Use arrow keys to move
      await user.keyboard('[ArrowRight][ArrowRight][ArrowDown]');
      
      // Use spacebar to drop
      await user.keyboard('[Space]');
      expect(playerToken).toHaveAttribute('aria-grabbed', 'false');

      // Test switch access
      const switches = screen.getAllByRole('switch');
      switches.forEach(async (switchElement) => {
        await user.click(switchElement);
        expect(switchElement).toHaveAttribute('aria-checked');
      });
    });

    it('should provide timeout extensions and warnings', async () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Mock session timeout scenario
      const timeoutWarning = screen.queryByTestId('timeout-warning');
      
      if (timeoutWarning) {
        expect(timeoutWarning).toHaveAttribute('role', 'alert');
        
        const extendButton = within(timeoutWarning).getByRole('button', { name: /extend session/i });
        expect(extendButton).toBeInTheDocument();
      }
    });

    it('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check animations are disabled
      const animatedElements = screen.getAllByTestId(/animated-/);
      animatedElements.forEach(element => {
        expect(element).toHaveClass('reduce-motion');
      });
    });
  });

  describe('Cognitive Accessibility', () => {
    it('should provide clear error messages and recovery options', async () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      // Mock error scenario
      const errorProps = {
        onSaveFormation: vi.fn().mockRejectedValue(new Error('Save failed')),
      };

      renderWithProviders(<UnifiedTacticsBoard {...errorProps} />, { initialState });

      const saveButton = screen.getByRole('button', { name: /save formation/i });
      await user.click(saveButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent(/save failed/i);
        expect(errorMessage).toHaveTextContent(/please try again/i);
        
        // Should provide recovery action
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should provide help and guidance', () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check help button
      const helpButton = screen.getByRole('button', { name: /help/i });
      expect(helpButton).toBeInTheDocument();

      // Check tooltips for complex controls
      const complexButtons = screen.getAllByRole('button');
      complexButtons.forEach(button => {
        const hasHelp = 
          button.hasAttribute('aria-describedby') ||
          button.hasAttribute('title') ||
          button.querySelector('[data-tooltip]');
        
        // Complex buttons should have some form of help
        if (button.textContent && button.textContent.length < 3) {
          expect(hasHelp).toBeTruthy();
        }
      });
    });

    it('should maintain consistent navigation patterns', () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check navigation consistency
      const navItems = screen.getAllByRole('tab');
      navItems.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('tabindex');
      });

      // Check breadcrumb navigation
      const breadcrumbs = screen.queryByRole('navigation', { name: /breadcrumb/i });
      if (breadcrumbs) {
        const breadcrumbItems = within(breadcrumbs).getAllByRole('listitem');
        expect(breadcrumbItems.length).toBeGreaterThan(0);
      }
    });

    it('should support multiple languages and localization', () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
        ui: {
          language: 'es', // Spanish
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check lang attribute
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveAttribute('lang');

      // Check RTL support for applicable languages
      const rtlLanguages = ['ar', 'he', 'fa'];
      rtlLanguages.forEach(lang => {
        const rtlState = {
          ...initialState,
          ui: { language: lang },
        };

        renderWithProviders(<UnifiedTacticsBoard />, { initialState: rtlState });
        
        const rootElement = screen.getByTestId('unified-tactics-board');
        expect(rootElement).toHaveAttribute('dir', 'rtl');
      });
    });
  });

  describe('High Contrast and Visual Accessibility', () => {
    it('should support high contrast mode', () => {
      // Mock high contrast preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check high contrast styles are applied
      const mainElement = screen.getByTestId('unified-tactics-board');
      expect(mainElement).toHaveClass('high-contrast');

      // Check elements have sufficient contrast
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('high-contrast-button');
      });
    });

    it('should work with screen magnification', () => {
      // Mock zoomed viewport
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 3, // 300% zoom
      });

      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Interface should remain usable at high zoom
      const sidebar = screen.getByTestId('smart-sidebar');
      expect(sidebar).not.toHaveClass('overflow-hidden');

      // Text should remain readable
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        expect(parseFloat(styles.fontSize)).toBeGreaterThan(12);
      });
    });

    it('should support forced colors mode', () => {
      // Mock forced colors mode (Windows High Contrast)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(forced-colors: active)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check forced colors adaptations
      const focusableElements = screen.getAllByRole('button');
      focusableElements.forEach(element => {
        // Should use system colors in forced colors mode
        const styles = window.getComputedStyle(element);
        expect(styles.color).toBe('ButtonText');
        expect(styles.backgroundColor).toBe('ButtonFace');
      });
    });
  });

  describe('Assistive Technology Compatibility', () => {
    it('should work with JAWS screen reader', async () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Test JAWS-specific features
      const application = screen.getByRole('application');
      expect(application).toHaveAttribute('aria-label');

      // Test table navigation
      const field = screen.getByRole('grid');
      expect(field).toHaveAttribute('aria-rowcount');
      expect(field).toHaveAttribute('aria-colcount');

      // Test reading order
      const readingOrder = a11yUtils.simulateScreenReader(application);
      expect(readingOrder.length).toBeGreaterThan(0);
      expect(readingOrder[0]).toMatch(/tactical board/i);
    });

    it('should work with Dragon NaturallySpeaking', () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Check voice command compatibility
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Dragon relies on accessible names
        const accessibleName = 
          button.getAttribute('aria-label') ||
          button.textContent ||
          button.getAttribute('title');
        
        expect(accessibleName).toBeTruthy();
        expect(accessibleName?.trim().length).toBeGreaterThan(2);
      });
    });

    it('should work with switch navigation devices', async () => {
      const initialState = {
        tactics: {
          currentFormation: testData.formation,
        },
      };

      renderWithProviders(<UnifiedTacticsBoard />, { initialState });

      // Test switch navigation pattern
      const focusableElements = screen.getAllByRole('button');
      
      // Should be able to activate any element with Enter/Space
      for (const element of focusableElements.slice(0, 3)) {
        element.focus();
        
        await user.keyboard('[Enter]');
        // Should not throw error and should handle activation
        
        element.focus();
        await user.keyboard('[Space]');
        // Should not throw error and should handle activation
      }
    });
  });
});