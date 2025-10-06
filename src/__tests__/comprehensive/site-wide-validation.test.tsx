/**
 * ZENITH SITE-WIDE FUNCTIONALITY VALIDATION SUITE
 * Complete validation of all site features, navigation, and cross-component interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ZenithTestWrapper, ZenithTestUtils } from '../zenith-test-framework';

// Import the main App component for full site testing
import App from '../../../App';
import { AppProvider } from '../../context/AppProvider';

/**
 * SITE-WIDE NAVIGATION VALIDATION
 */
describe('Site-Wide Navigation Validation - ZENITH Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Complete Navigation Flow', () => {
    it('should navigate through all major pages without errors', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Test navigation to all major pages
      const navigationTests = [
        { link: 'tactics', expectedText: /tactics/i },
        { link: 'analytics', expectedText: /analytics/i },
        { link: 'finances', expectedText: /finances/i },
        { link: 'transfers', expectedText: /transfers/i },
        { link: 'training', expectedText: /training/i },
        { link: 'settings', expectedText: /settings/i },
      ];

      for (const { link, expectedText } of navigationTests) {
        const navLink = screen.getByRole('link', { name: new RegExp(link, 'i') });
        await user.click(navLink);

        await waitFor(() => {
          expect(screen.getByText(expectedText)).toBeInTheDocument();
        });

        // Verify page loaded properly
        expect(screen.getByRole('main')).toBeInTheDocument();
      }
    });

    it('should maintain navigation state during browser back/forward', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <AppProvider>
            <App />
          </AppProvider>
        </BrowserRouter>
      );

      // Navigate to tactics
      const tacticsLink = screen.getByRole('link', { name: /tactics/i });
      await user.click(tacticsLink);

      await waitFor(() => {
        expect(screen.getByText(/tactics/i)).toBeInTheDocument();
      });

      // Navigate to analytics
      const analyticsLink = screen.getByRole('link', { name: /analytics/i });
      await user.click(analyticsLink);

      await waitFor(() => {
        expect(screen.getByText(/analytics/i)).toBeInTheDocument();
      });

      // Test browser back button
      window.history.back();

      await waitFor(() => {
        expect(screen.getByText(/tactics/i)).toBeInTheDocument();
      });

      // Test browser forward button
      window.history.forward();

      await waitFor(() => {
        expect(screen.getByText(/analytics/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid routes gracefully', () => {
      render(
        <MemoryRouter initialEntries={['/invalid-route']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Should redirect to dashboard or show 404
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should preserve state across navigation', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/tactics']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Set up formation on tactics page
      const formationSelect = screen.getByRole('combobox', { name: /formation/i });
      await user.selectOptions(formationSelect, '4-3-3');

      // Navigate away
      const analyticsLink = screen.getByRole('link', { name: /analytics/i });
      await user.click(analyticsLink);

      // Navigate back
      const tacticsLink = screen.getByRole('link', { name: /tactics/i });
      await user.click(tacticsLink);

      // Formation should be preserved
      await waitFor(() => {
        expect(formationSelect).toHaveValue('4-3-3');
      });
    });
  });

  describe('Menu System Validation', () => {
    it('should open and close all menus correctly', async () => {
      const user = userEvent.setup();

      render(
        <ZenithTestWrapper>
          <App />
        </ZenithTestWrapper>
      );

      // Test main navigation menu
      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);

      expect(screen.getByRole('navigation')).toBeVisible();

      // Test user menu
      const userMenuButton = screen.getByRole('button', { name: /user/i });
      await user.click(userMenuButton);

      expect(screen.getByRole('menu')).toBeVisible();

      // Test closing menus with escape
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('menu')).not.toBeVisible();

      // Test closing menus by clicking outside
      await user.click(menuButton);
      await user.click(document.body);

      expect(screen.queryByRole('navigation')).not.toBeVisible();
    });

    it('should support keyboard navigation in menus', async () => {
      const user = userEvent.setup();

      render(
        <ZenithTestWrapper>
          <App />
        </ZenithTestWrapper>
      );

      // Open menu with keyboard
      const menuButton = screen.getByRole('button', { name: /menu/i });
      menuButton.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByRole('navigation')).toBeVisible();

      // Navigate through menu items
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBeVisible();

      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBeVisible();

      // Activate menu item with Enter
      await user.keyboard('{Enter}');

      // Should navigate to selected page
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});

/**
 * CROSS-COMPONENT INTERACTION VALIDATION
 */
describe('Cross-Component Interaction Validation - ZENITH Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Data Flow Between Components', () => {
    it('should synchronize data between tactics board and analytics', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/tactics']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Set up formation on tactics board
      const formationSelect = screen.getByRole('combobox', { name: /formation/i });
      await user.selectOptions(formationSelect, '4-4-2');

      // Save formation
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Navigate to analytics
      const analyticsLink = screen.getByRole('link', { name: /analytics/i });
      await user.click(analyticsLink);

      // Analytics should reflect the formation data
      await waitFor(() => {
        expect(screen.getByText(/4-4-2/i)).toBeInTheDocument();
      });
    });

    it('should update player data across all components', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/transfers']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Sign a new player
      const addPlayerButton = screen.getByRole('button', { name: /add player/i });
      await user.click(addPlayerButton);

      const playerNameInput = screen.getByRole('textbox', { name: /player name/i });
      await user.type(playerNameInput, 'New Player');

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Navigate to tactics board
      const tacticsLink = screen.getByRole('link', { name: /tactics/i });
      await user.click(tacticsLink);

      // New player should be available
      await waitFor(() => {
        expect(screen.getByText('New Player')).toBeInTheDocument();
      });

      // Navigate to analytics
      const analyticsLink = screen.getByRole('link', { name: /analytics/i });
      await user.click(analyticsLink);

      // Player should appear in analytics too
      await waitFor(() => {
        expect(screen.getByText('New Player')).toBeInTheDocument();
      });
    });

    it('should maintain real-time updates across components', async () => {
      const user = userEvent.setup();

      // Simulate multiple tabs/components
      const { rerender } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Update data in one component
      const updateButton = screen.getByRole('button', { name: /update/i });
      await user.click(updateButton);

      // Re-render as if another component is viewing the data
      rerender(
        <MemoryRouter initialEntries={['/analytics']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Data should be synchronized
      await waitFor(() => {
        expect(screen.getByText(/updated/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal and Dialog Interactions', () => {
    it('should handle overlapping modals correctly', async () => {
      const user = userEvent.setup();

      render(
        <ZenithTestWrapper>
          <App />
        </ZenithTestWrapper>
      );

      // Open first modal
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      expect(screen.getByRole('dialog')).toBeVisible();

      // Open second modal from within first modal
      const advancedButton = screen.getByRole('button', { name: /advanced/i });
      await user.click(advancedButton);

      // Should have two modals open
      const dialogs = screen.getAllByRole('dialog');
      expect(dialogs).toHaveLength(2);

      // Close modals with escape (should close top-most first)
      await user.keyboard('{Escape}');

      const remainingDialogs = screen.getAllByRole('dialog');
      expect(remainingDialogs).toHaveLength(1);

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should handle modal focus trapping correctly', async () => {
      const user = userEvent.setup();

      render(
        <ZenithTestWrapper>
          <App />
        </ZenithTestWrapper>
      );

      // Open modal
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeVisible();

      // Tab should cycle through modal elements only
      await user.tab();
      expect(document.activeElement).toBeVisible();
      expect(modal).toContainElement(document.activeElement as HTMLElement);

      // Continue tabbing
      await user.tab();
      await user.tab();

      // Should still be within modal
      expect(modal).toContainElement(document.activeElement as HTMLElement);
    });
  });
});

/**
 * FEATURE INTEGRATION VALIDATION
 */
describe('Feature Integration Validation - ZENITH Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Tactical Planning Integration', () => {
    it('should integrate formation creation with match simulation', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/tactics']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Create formation
      const formationSelect = screen.getByRole('combobox', { name: /formation/i });
      await user.selectOptions(formationSelect, '4-3-3');

      // Position players
      const players = screen.getAllByRole('button', { name: /player/i });
      const firstPlayer = players[0];

      fireEvent.mouseDown(firstPlayer);
      fireEvent.mouseMove(firstPlayer, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(firstPlayer);

      // Run simulation
      const simulateButton = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateButton);

      // Should show simulation results
      await waitFor(() => {
        expect(screen.getByText(/simulation/i)).toBeInTheDocument();
      });

      // Results should reflect formation choice
      expect(screen.getByText(/4-3-3/i)).toBeInTheDocument();
    });

    it('should integrate tactical analysis with player performance', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/tactics']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Select player
      const players = screen.getAllByRole('button', { name: /player/i });
      await user.click(players[0]);

      // View player analysis
      const analysisButton = screen.getByRole('button', { name: /analysis/i });
      await user.click(analysisButton);

      // Should show tactical role analysis
      expect(screen.getByText(/tactical role/i)).toBeInTheDocument();
      expect(screen.getByText(/performance/i)).toBeInTheDocument();

      // Navigate to detailed analytics
      const detailsButton = screen.getByRole('button', { name: /details/i });
      await user.click(detailsButton);

      // Should open analytics page with player focus
      await waitFor(() => {
        expect(screen.getByText(/analytics/i)).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Integration', () => {
    it('should integrate real-time match data with analytics dashboard', async () => {
      const user = userEvent.setup();

      // Start with live match
      render(
        <MemoryRouter initialEntries={['/tactics']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Start live match
      const liveMatchButton = screen.getByRole('button', { name: /live match/i });
      await user.click(liveMatchButton);

      // Generate match events
      const scoreButton = screen.getByRole('button', { name: /score/i });
      await user.click(scoreButton);

      // Navigate to analytics during match
      const analyticsLink = screen.getByRole('link', { name: /analytics/i });
      await user.click(analyticsLink);

      // Should show live match data
      expect(screen.getByText(/live/i)).toBeInTheDocument();
      expect(screen.getByText(/goals: 1/i)).toBeInTheDocument();

      // Data should update in real-time
      // (In real implementation, this would test WebSocket updates)
    });

    it('should integrate historical data with trend analysis', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/analytics']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Select time period
      const periodSelect = screen.getByRole('combobox', { name: /period/i });
      await user.selectOptions(periodSelect, 'season');

      // Should load historical data
      await waitFor(() => {
        expect(screen.getByText(/season data/i)).toBeInTheDocument();
      });

      // View trend analysis
      const trendButton = screen.getByRole('button', { name: /trends/i });
      await user.click(trendButton);

      // Should show performance trends
      expect(screen.getByText(/trend/i)).toBeInTheDocument();
      expect(screen.getByText(/improvement/i)).toBeInTheDocument();
    });
  });

  describe('Financial Integration', () => {
    it('should integrate transfer spending with budget management', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/transfers']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Make a transfer
      const buyPlayerButton = screen.getByRole('button', { name: /buy player/i });
      await user.click(buyPlayerButton);

      const priceInput = screen.getByRole('spinbutton', { name: /price/i });
      await user.type(priceInput, '1000000');

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Navigate to finances
      const financesLink = screen.getByRole('link', { name: /finances/i });
      await user.click(financesLink);

      // Budget should reflect the transfer
      await waitFor(() => {
        expect(screen.getByText(/spent.*1,000,000/i)).toBeInTheDocument();
      });

      // Remaining budget should be updated
      expect(screen.getByText(/remaining budget/i)).toBeInTheDocument();
    });
  });
});

/**
 * ERROR BOUNDARY AND RECOVERY VALIDATION
 */
describe('Error Boundary and Recovery Validation - ZENITH Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Component Error Recovery', () => {
    it('should handle component crashes gracefully', () => {
      const BuggyComponent = () => {
        throw new Error('Component crash');
      };

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ZenithTestWrapper>
          <BuggyComponent />
        </ZenithTestWrapper>
      );

      // Should show error boundary
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Should provide recovery options
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();

      consoleError.mockRestore();
    });

    it('should isolate errors to specific components', () => {
      const BuggyComponent = () => {
        throw new Error('Isolated error');
      };

      const GoodComponent = () => <div>Working component</div>;

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ZenithTestWrapper>
          <div>
            <GoodComponent />
            <BuggyComponent />
          </div>
        </ZenithTestWrapper>
      );

      // Good component should still work
      expect(screen.getByText('Working component')).toBeInTheDocument();

      // Error boundary should contain the error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });

  describe('Network Error Recovery', () => {
    it('should handle API failures gracefully', async () => {
      const user = userEvent.setup();

      // Mock network failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <MemoryRouter initialEntries={['/analytics']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
      });

      // Should provide retry option
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'success' }),
      });

      await user.click(retryButton);

      // Should recover and show data
      await waitFor(() => {
        expect(screen.queryByText(/error loading data/i)).not.toBeInTheDocument();
      });
    });
  });
});

/**
 * PERFORMANCE VALIDATION ACROSS SITE
 */
describe('Site-Wide Performance Validation - ZENITH Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Page Load Performance', () => {
    it('should load all pages within performance budget', async () => {
      const pages = [
        { route: '/dashboard', name: 'Dashboard' },
        { route: '/tactics', name: 'Tactics' },
        { route: '/analytics', name: 'Analytics' },
        { route: '/finances', name: 'Finances' },
        { route: '/transfers', name: 'Transfers' },
      ];

      for (const { route, name } of pages) {
        const startTime = performance.now();

        render(
          <MemoryRouter initialEntries={[route]}>
            <AppProvider>
              <App />
            </AppProvider>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });

        const loadTime = performance.now() - startTime;
        expect(loadTime).toBeLessThan(250); // 250ms budget per page

        cleanup();
      }
    });

    it('should handle concurrent user interactions efficiently', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/tactics']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Perform multiple actions simultaneously
      const startTime = performance.now();

      const actions = [
        user.selectOptions(screen.getByRole('combobox', { name: /formation/i }), '4-4-2'),
        user.click(screen.getByRole('button', { name: /save/i })),
        user.click(screen.getByRole('button', { name: /simulate/i })),
      ];

      await Promise.all(actions);

      const executionTime = performance.now() - startTime;
      expect(executionTime).toBeLessThan(1000); // 1 second for concurrent actions
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during navigation', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Navigate through multiple pages
      for (let i = 0; i < 5; i++) {
        render(
          <MemoryRouter initialEntries={['/dashboard']}>
            <AppProvider>
              <App />
            </AppProvider>
          </MemoryRouter>
        );
        cleanup();

        render(
          <MemoryRouter initialEntries={['/tactics']}>
            <AppProvider>
              <App />
            </AppProvider>
          </MemoryRouter>
        );
        cleanup();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Should not increase memory by more than 10MB
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});

/**
 * ACCESSIBILITY VALIDATION ACROSS SITE
 */
describe('Site-Wide Accessibility Validation - ZENITH Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation across all pages', async () => {
      const user = userEvent.setup();

      const pages = ['/dashboard', '/tactics', '/analytics', '/finances'];

      for (const page of pages) {
        render(
          <MemoryRouter initialEntries={[page]}>
            <AppProvider>
              <App />
            </AppProvider>
          </MemoryRouter>
        );

        // Tab through all focusable elements
        let tabCount = 0;
        const maxTabs = 20; // Reasonable limit

        while (tabCount < maxTabs) {
          await user.tab();

          const activeElement = document.activeElement;
          if (activeElement && activeElement !== document.body) {
            expect(activeElement).toBeVisible();
            expect(activeElement).toHaveAttribute('tabindex');
          }

          tabCount++;
        }

        cleanup();
      }
    });

    it('should maintain focus management across navigation', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProvider>
            <App />
          </AppProvider>
        </MemoryRouter>
      );

      // Focus on a navigation link
      const tacticsLink = screen.getByRole('link', { name: /tactics/i });
      tacticsLink.focus();

      // Navigate with Enter
      await user.keyboard('{Enter}');

      // Focus should be managed appropriately
      await waitFor(() => {
        expect(document.activeElement).toBeVisible();
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide proper ARIA labels across all components', () => {
      const pages = ['/dashboard', '/tactics', '/analytics'];

      for (const page of pages) {
        render(
          <MemoryRouter initialEntries={[page]}>
            <AppProvider>
              <App />
            </AppProvider>
          </MemoryRouter>
        );

        // Check interactive elements have proper labels
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          const hasLabel =
            button.getAttribute('aria-label') ||
            button.getAttribute('aria-labelledby') ||
            button.textContent?.trim();
          expect(hasLabel).toBeTruthy();
        });

        // Check form inputs have proper labels
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => {
          const hasLabel =
            input.getAttribute('aria-label') ||
            input.getAttribute('aria-labelledby') ||
            screen.queryByLabelText(input.getAttribute('name') || '');
          expect(hasLabel).toBeTruthy();
        });

        cleanup();
      }
    });

    it('should maintain proper heading hierarchy across all pages', () => {
      const pages = ['/dashboard', '/tactics', '/analytics'];

      for (const page of pages) {
        render(
          <MemoryRouter initialEntries={[page]}>
            <AppProvider>
              <App />
            </AppProvider>
          </MemoryRouter>
        );

        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);

        // First heading should be h1
        expect(headings[0]).toHaveAttribute('aria-level', '1');

        // Check heading levels are logical
        for (let i = 1; i < headings.length; i++) {
          const currentLevel = parseInt(headings[i].getAttribute('aria-level') || '1');
          const previousLevel = parseInt(headings[i - 1].getAttribute('aria-level') || '1');

          // Heading level should not jump more than 1
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
        }

        cleanup();
      }
    });
  });
});
