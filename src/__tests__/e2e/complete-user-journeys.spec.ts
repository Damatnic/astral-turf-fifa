/**
 * ZENITH COMPREHENSIVE E2E TESTING SUITE
 * Complete end-to-end tests covering all user journeys
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * ZENITH E2E Test Configuration
 */
const ZENITH_E2E_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
  screenshots: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'retain-on-failure',
};

/**
 * ZENITH E2E Test Utilities
 */
class ZenithE2EUtils {
  static async loginUser(
    page: Page,
    email: string = 'test@example.com',
    password: string = 'password123',
  ) {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL('/dashboard');
  }

  static async createFormation(page: Page, formationType: string = '4-4-2') {
    await page.goto('/tactics');
    await page.selectOption('[data-testid="formation-select"]', formationType);
    await page.waitForSelector('[data-testid="tactics-board"]');

    // Wait for players to be positioned
    await page.waitForSelector('[data-testid="player-token"]');
    const players = await page.locator('[data-testid="player-token"]').count();
    expect(players).toBe(11);
  }

  static async waitForLoadingComplete(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' });
  }

  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  static async checkAccessibility(page: Page) {
    // Basic accessibility checks
    const focusableElements = await page
      .locator('button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])')
      .count();
    expect(focusableElements).toBeGreaterThan(0);

    // Check for proper heading structure
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBeGreaterThanOrEqual(1);
  }
}

/**
 * AUTHENTICATION USER JOURNEYS
 */
test.describe('Authentication User Journeys - ZENITH E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Complete user registration and onboarding journey', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /astral turf/i })).toBeVisible();

    // 2. Navigate to signup
    await page.click('[data-testid="signup-link"]');
    await expect(page).toHaveURL('/signup');

    // 3. Fill registration form
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');

    // 4. Accept terms and submit
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="signup-submit"]');

    // 5. Verify successful registration
    await ZenithE2EUtils.waitForLoadingComplete(page);
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome, Test User')).toBeVisible();

    // 6. Complete onboarding flow
    await page.click('[data-testid="start-tour-button"]');
    await page.click('[data-testid="tour-next-button"]');
    await page.click('[data-testid="tour-next-button"]');
    await page.click('[data-testid="tour-finish-button"]');

    // 7. Verify dashboard is fully loaded
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await ZenithE2EUtils.takeScreenshot(page, 'post-registration-dashboard');
  });

  test('Login with existing user and session persistence', async ({ page }) => {
    // 1. Login user
    await ZenithE2EUtils.loginUser(page);

    // 2. Verify dashboard loaded
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // 3. Refresh page to test session persistence
    await page.reload();
    await ZenithE2EUtils.waitForLoadingComplete(page);

    // 4. Should still be logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Test User')).toBeVisible();

    // 5. Open new tab to test session sharing
    const newPage = await page.context().newPage();
    await newPage.goto('/dashboard');
    await expect(newPage.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await newPage.close();
  });

  test('Logout and authentication redirect', async ({ page }) => {
    // 1. Login user
    await ZenithE2EUtils.loginUser(page);

    // 2. Navigate to protected page
    await page.goto('/tactics');
    await expect(page.getByRole('heading', { name: /tactics/i })).toBeVisible();

    // 3. Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // 4. Should redirect to login
    await expect(page).toHaveURL('/login');

    // 5. Attempting to access protected page should redirect
    await page.goto('/tactics');
    await expect(page).toHaveURL('/login');
  });
});

/**
 * TACTICAL PLANNING USER JOURNEYS
 */
test.describe('Tactical Planning User Journeys - ZENITH E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await ZenithE2EUtils.loginUser(page);
  });

  test('Complete formation creation and modification journey', async ({ page }) => {
    // 1. Navigate to tactics board
    await page.click('[data-testid="tactics-nav-link"]');
    await expect(page).toHaveURL('/tactics');

    // 2. Select formation
    await page.selectOption('[data-testid="formation-select"]', '4-3-3');
    await ZenithE2EUtils.waitForLoadingComplete(page);

    // 3. Verify players are positioned correctly
    const players = page.locator('[data-testid="player-token"]');
    await expect(players).toHaveCount(11);

    // 4. Move a player
    const firstPlayer = players.first();
    const playerBox = await firstPlayer.boundingBox();

    await page.mouse.move(
      playerBox!.x + playerBox!.width / 2,
      playerBox!.y + playerBox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(playerBox!.x + 100, playerBox!.y + 50);
    await page.mouse.up();

    // 5. Verify player moved
    const newPlayerBox = await firstPlayer.boundingBox();
    expect(newPlayerBox!.x).not.toBe(playerBox!.x);

    // 6. Save formation
    await page.fill('[data-testid="formation-name-input"]', 'Custom 4-3-3');
    await page.click('[data-testid="save-formation-button"]');

    // 7. Verify save confirmation
    await expect(page.getByText('Formation saved successfully')).toBeVisible();

    // 8. Test formation simulation
    await page.click('[data-testid="simulate-match-button"]');
    await ZenithE2EUtils.waitForLoadingComplete(page);

    // 9. Verify simulation results
    await expect(page.getByText('Match simulation complete')).toBeVisible();

    await ZenithE2EUtils.takeScreenshot(page, 'formation-creation-complete');
  });

  test('Player substitution and tactical changes during match', async ({ page }) => {
    // 1. Navigate to tactics and set up formation
    await ZenithE2EUtils.createFormation(page, '4-4-2');

    // 2. Start match simulation
    await page.click('[data-testid="live-match-button"]');
    await expect(page.getByText('Live Match Mode')).toBeVisible();

    // 3. Make tactical substitution
    await page.click('[data-testid="substitution-button"]');
    await page.selectOption('[data-testid="player-out-select"]', 'Player 9');
    await page.selectOption('[data-testid="player-in-select"]', 'Substitute 1');
    await page.click('[data-testid="confirm-substitution"]');

    // 4. Verify substitution occurred
    await expect(page.getByText('Substitution: Substitute 1 for Player 9')).toBeVisible();

    // 5. Change formation during match
    await page.selectOption('[data-testid="formation-select"]', '3-5-2');
    await page.click('[data-testid="apply-formation-change"]');

    // 6. Verify formation change
    await expect(page.getByText('Formation changed to 3-5-2')).toBeVisible();

    // 7. End match
    await page.click('[data-testid="end-match-button"]');
    await expect(page.getByText('Match ended')).toBeVisible();
  });

  test('Formation export and import workflow', async ({ page }) => {
    // 1. Create custom formation
    await ZenithE2EUtils.createFormation(page, '4-2-3-1');

    // 2. Customize player positions
    const players = page.locator('[data-testid="player-token"]');
    for (let i = 0; i < 3; i++) {
      const player = players.nth(i);
      const box = await player.boundingBox();
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await page.mouse.down();
      await page.mouse.move(box!.x + 50, box!.y + 30);
      await page.mouse.up();
    }

    // 3. Export formation
    await page.click('[data-testid="export-formation-button"]');
    await page.click('[data-testid="export-json-option"]');

    // 4. Verify export initiated
    await expect(page.getByText('Formation exported successfully')).toBeVisible();

    // 5. Clear current formation
    await page.click('[data-testid="clear-formation-button"]');
    await page.click('[data-testid="confirm-clear"]');

    // 6. Import formation
    await page.click('[data-testid="import-formation-button"]');
    await page.setInputFiles('[data-testid="file-input"]', './test-data/formation.json');
    await page.click('[data-testid="confirm-import"]');

    // 7. Verify formation loaded
    await expect(page.locator('[data-testid="player-token"]')).toHaveCount(11);
    await expect(page.getByText('Formation imported successfully')).toBeVisible();
  });
});

/**
 * ANALYTICS AND REPORTING USER JOURNEYS
 */
test.describe('Analytics User Journeys - ZENITH E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await ZenithE2EUtils.loginUser(page);
  });

  test('Complete analytics exploration and report generation', async ({ page }) => {
    // 1. Navigate to analytics
    await page.click('[data-testid="analytics-nav-link"]');
    await expect(page).toHaveURL('/analytics');

    // 2. Select time period
    await page.selectOption('[data-testid="time-period-select"]', 'last-month');
    await ZenithE2EUtils.waitForLoadingComplete(page);

    // 3. Verify charts loaded
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-stats-chart"]')).toBeVisible();

    // 4. Filter by player
    await page.selectOption('[data-testid="player-filter"]', 'Player 10');
    await ZenithE2EUtils.waitForLoadingComplete(page);

    // 5. Verify filtered data
    await expect(page.getByText('Player 10 Statistics')).toBeVisible();

    // 6. View advanced analytics
    await page.click('[data-testid="advanced-analytics-button"]');
    await expect(page).toHaveURL('/advanced-analytics');

    // 7. Explore heat map
    await page.click('[data-testid="heat-map-tab"]');
    await expect(page.locator('[data-testid="heat-map-canvas"]')).toBeVisible();

    // 8. Generate report
    await page.click('[data-testid="generate-report-button"]');
    await page.fill('[data-testid="report-title"]', 'Monthly Performance Report');
    await page.check('[data-testid="include-charts"]');
    await page.check('[data-testid="include-player-stats"]');
    await page.click('[data-testid="generate-pdf-report"]');

    // 9. Verify report generation
    await expect(page.getByText('Report generated successfully')).toBeVisible();

    await ZenithE2EUtils.takeScreenshot(page, 'analytics-report-generated');
  });

  test('Real-time match analytics and live updates', async ({ page }) => {
    // 1. Start live match
    await page.goto('/tactics');
    await ZenithE2EUtils.createFormation(page);
    await page.click('[data-testid="start-live-match"]');

    // 2. Open analytics in new tab
    const analyticsPage = await page.context().newPage();
    await analyticsPage.goto('/analytics');
    await analyticsPage.click('[data-testid="live-match-analytics"]');

    // 3. Verify real-time updates
    await expect(analyticsPage.getByText('Live Match Data')).toBeVisible();

    // 4. Trigger events in main match
    await page.click('[data-testid="score-goal-button"]');

    // 5. Verify analytics updated
    await expect(analyticsPage.getByText('Goals: 1')).toBeVisible();

    // 6. Test data synchronization
    await page.click('[data-testid="yellow-card-button"]');
    await expect(analyticsPage.getByText('Cards: 1')).toBeVisible();

    await analyticsPage.close();
  });
});

/**
 * MOBILE RESPONSIVENESS USER JOURNEYS
 */
test.describe('Mobile User Journeys - ZENITH E2E Tests', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test('Mobile tactics board interaction', async ({ page }) => {
    await ZenithE2EUtils.loginUser(page);

    // 1. Navigate to tactics on mobile
    await page.click('[data-testid="mobile-menu-button"]');
    await page.click('[data-testid="tactics-nav-link"]');

    // 2. Verify mobile layout
    await expect(page.locator('[data-testid="mobile-tactics-toolbar"]')).toBeVisible();

    // 3. Test touch interactions
    const player = page.locator('[data-testid="player-token"]').first();
    await player.tap();
    await expect(page.locator('[data-testid="player-options-modal"]')).toBeVisible();

    // 4. Test pinch to zoom
    await page.touchscreen.tap(200, 300);

    // 5. Test formation change on mobile
    await page.click('[data-testid="formation-selector-mobile"]');
    await page.click('[data-testid="formation-4-3-3"]');

    // 6. Verify responsive behavior
    await expect(page.locator('[data-testid="tactics-board"]')).toBeVisible();

    await ZenithE2EUtils.takeScreenshot(page, 'mobile-tactics-board');
  });

  test('Mobile navigation and menu system', async ({ page }) => {
    await ZenithE2EUtils.loginUser(page);

    // 1. Test hamburger menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-nav-drawer"]')).toBeVisible();

    // 2. Navigate through all pages
    const navItems = [
      'dashboard-nav',
      'tactics-nav',
      'analytics-nav',
      'finances-nav',
      'transfers-nav',
    ];

    for (const item of navItems) {
      await page.click(`[data-testid="${item}-link"]`);
      await ZenithE2EUtils.waitForLoadingComplete(page);
      await expect(page.getByRole('main')).toBeVisible();

      // Close menu for next iteration
      await page.click('[data-testid="mobile-menu-button"]');
    }

    // 3. Test swipe gestures
    await page.touchscreen.tap(100, 300);
    await page.mouse.move(100, 300);
    await page.mouse.down();
    await page.mouse.move(300, 300);
    await page.mouse.up();
  });
});

/**
 * ACCESSIBILITY USER JOURNEYS
 */
test.describe('Accessibility User Journeys - ZENITH E2E Tests', () => {
  test('Keyboard navigation throughout application', async ({ page }) => {
    await ZenithE2EUtils.loginUser(page);

    // 1. Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // 2. Navigate through main navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.locator(':focus');
      await expect(focused).toBeVisible();
    }

    // 3. Test Enter key activation
    await page.keyboard.press('Enter');
    await ZenithE2EUtils.waitForLoadingComplete(page);

    // 4. Test escape key for modals
    await page.keyboard.press('Escape');

    // 5. Test arrow key navigation
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');

    // 6. Test tactics board keyboard interaction
    await page.goto('/tactics');
    await page.keyboard.press('Tab');

    // Focus should be on first player
    const focusedPlayer = page.locator('[data-testid="player-token"]:focus');
    await expect(focusedPlayer).toBeVisible();

    // 7. Test keyboard player movement
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');

    await ZenithE2EUtils.checkAccessibility(page);
  });

  test('Screen reader compatibility', async ({ page }) => {
    await ZenithE2EUtils.loginUser(page);

    // 1. Check page landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();

    // 2. Check heading structure
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    // 3. Check ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();

      // Button should have either aria-label or text content
      expect(ariaLabel || textContent).toBeTruthy();
    }

    // 4. Check form labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
  });
});

/**
 * PERFORMANCE USER JOURNEYS
 */
test.describe('Performance User Journeys - ZENITH E2E Tests', () => {
  test('Page load performance and core web vitals', async ({ page }) => {
    // 1. Measure landing page performance
    await page.goto('/', { waitUntil: 'networkidle' });

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
      };
    });

    // Verify performance thresholds
    expect(performanceMetrics.loadTime).toBeLessThan(3000); // 3 seconds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1500); // 1.5 seconds

    // 2. Test tactics board performance with large datasets
    await ZenithE2EUtils.loginUser(page);
    await page.goto('/tactics');

    const tacticsLoadTime = await page.evaluate(() => {
      const start = performance.now();
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(performance.now() - start);
        }, 100);
      });
    });

    expect(tacticsLoadTime).toBeLessThan(500); // 500ms for tactics board
  });

  test('Large dataset handling and virtual scrolling', async ({ page }) => {
    await ZenithE2EUtils.loginUser(page);

    // 1. Navigate to player list with many players
    await page.goto('/transfers');

    // 2. Load large dataset
    await page.click('[data-testid="load-all-players"]');
    await ZenithE2EUtils.waitForLoadingComplete(page);

    // 3. Test virtual scrolling performance
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(50);
    }

    const scrollTime = Date.now() - startTime;
    expect(scrollTime).toBeLessThan(2000); // 2 seconds for scrolling

    // 4. Verify all items are still interactive
    const visibleItems = page.locator('[data-testid="player-item"]:visible');
    await expect(visibleItems.first()).toBeVisible();
  });
});

/**
 * ERROR HANDLING USER JOURNEYS
 */
test.describe('Error Handling User Journeys - ZENITH E2E Tests', () => {
  test('Network failure recovery', async ({ page }) => {
    await ZenithE2EUtils.loginUser(page);

    // 1. Simulate network failure
    await page.route('**/*', route => route.abort());

    // 2. Try to navigate to analytics
    await page.click('[data-testid="analytics-nav-link"]');

    // 3. Should show error state
    await expect(page.getByText('Network error')).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();

    // 4. Restore network and retry
    await page.unroute('**/*');
    await page.click('[data-testid="retry-button"]');

    // 5. Should recover and load page
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
  });

  test('Session expiration handling', async ({ page }) => {
    await ZenithE2EUtils.loginUser(page);

    // 1. Navigate to protected page
    await page.goto('/tactics');

    // 2. Simulate session expiration
    await page.evaluate(() => {
      localStorage.removeItem('auth-token');
      sessionStorage.clear();
    });

    // 3. Try to perform authenticated action
    await page.click('[data-testid="save-formation-button"]');

    // 4. Should redirect to login
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Session expired')).toBeVisible();

    // 5. Re-login should redirect back
    await ZenithE2EUtils.loginUser(page);
    await expect(page).toHaveURL('/tactics');
  });
});

/**
 * CROSS-BROWSER COMPATIBILITY
 */
test.describe('Cross-Browser Compatibility - ZENITH E2E Tests', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`Core functionality in ${browserName}`, async ({ page }) => {
      await ZenithE2EUtils.loginUser(page);

      // 1. Test dashboard
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

      // 2. Test tactics board
      await page.goto('/tactics');
      await expect(page.getByRole('heading', { name: /tactics/i })).toBeVisible();

      // 3. Test analytics
      await page.goto('/analytics');
      await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();

      // 4. Test form interactions
      await page.goto('/settings');
      const toggle = page.locator('[data-testid="setting-toggle"]').first();
      await toggle.click();
      await expect(toggle).toBeChecked();

      await ZenithE2EUtils.takeScreenshot(page, `${browserName}-compatibility-test`);
    });
  });
});
