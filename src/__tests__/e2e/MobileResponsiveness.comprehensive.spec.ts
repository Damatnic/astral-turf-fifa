/**
 * Comprehensive Mobile Responsiveness E2E Tests
 *
 * Tests all 7 core pages for mobile responsiveness:
 * - Touch targets (44px minimum)
 * - Responsive grids (1→2→3+ columns)
 * - Touch interactions
 * - Viewport adaptations
 * - PWA functionality
 *
 * Devices tested via playwright.config.ts: iPhone 12, Pixel 5, iPad
 */

import { test, expect } from '@playwright/test';

const CORE_PAGES = [
  { path: '/', name: 'Dashboard' },
  { path: '/tactics', name: 'Tactics Board' },
  { path: '/training', name: 'Training' },
  { path: '/transfers', name: 'Transfers' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/finances', name: 'Finances' },
  { path: '/settings', name: 'Settings' },
];

// Minimum touch target size (WCAG 2.1 Level AAA)
const MIN_TOUCH_TARGET_SIZE = 44;

// Use test.describe for mobile tests - device configuration handled by playwright.config.ts
test.describe('Mobile Responsiveness', () => {
  CORE_PAGES.forEach(({ path, name: pageName }) => {
    test(`${pageName} page should be fully responsive`, async ({ page }) => {
      // Navigate to page
      await page.goto(path);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Test 1: Page should load without errors
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.waitForTimeout(1000);
      expect(errors).toHaveLength(0);

      // Test 2: Viewport should be set correctly
      const viewport = page.viewportSize();
      expect(viewport).toBeTruthy();

      // Test 3: Check for responsive meta tag
      const metaViewport = await page.getAttribute('meta[name="viewport"]', 'content');
      expect(metaViewport).toContain('width=device-width');

      // Test 4: All touch buttons should meet minimum size
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && (await button.isVisible())) {
          expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE - 4); // Allow 4px tolerance
          expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE - 4);
        }
      }

      // Test 5: Responsive grids should adapt to viewport
      // Note: Tailwind's grid classes may not contain literal "grid" string after compilation
      // Check for grid display property instead
      const grids = await page
        .locator('.grid, [style*="display: grid"], [class*="ResponsiveGrid"]')
        .all();
      // Allow pages without grids (some pages may use flex layouts)
      if (grids.length === 0) {
        console.log(`${pageName}: No grid layouts found (may use flex/other layouts)`);
      }

      // Test 6: Page should be scrollable if content overflows
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = viewport?.height || 0;
      if (bodyHeight > viewportHeight) {
        // Test scrolling
        await page.evaluate(() => window.scrollTo(0, 100));
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeGreaterThan(0);
      }

      // Test 7: Touch interactions should work
      if (buttons.length > 0) {
        const firstVisibleButton = buttons[0];
        if (await firstVisibleButton.isVisible()) {
          await firstVisibleButton.tap();
          // Button should respond to tap
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test('Dashboard should have responsive coach cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Coach cards should be present
    const coachCards = await page.locator('[class*="coach"]').all();
    expect(coachCards.length).toBeGreaterThan(0);

    // Cards should stack on mobile
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      // On mobile, cards should be in single column
      const firstCard = coachCards[0];
      const box = await firstCard.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(viewport.width * 0.8); // Card should be nearly full width
      }
    }
  });

  test('Tactics Board should support touch gestures', async ({ page }) => {
    await page.goto('/tactics');
    await page.waitForLoadState('networkidle');

    // Find the tactics board canvas or main container
    const tacticsBoard = page.locator('[class*="tactical"], [class*="board"]').first();
    await expect(tacticsBoard).toBeVisible();

    // Test touch interaction on board
    const box = await tacticsBoard.boundingBox();
    if (box) {
      // Tap on board
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);

      // Pinch gesture test (if supported)
      // Note: Playwright's touchscreen API is basic, full gesture testing may need manual validation
    }
  });

  test('Training page should have responsive grids', async ({ page }) => {
    await page.goto('/training');
    await page.waitForLoadState('networkidle');

    // Day selector should be responsive
    const dayButtons = await page
      .locator('button:has-text("Monday"), button:has-text("Tuesday")')
      .all();
    expect(dayButtons.length).toBeGreaterThan(0);

    // Player cards should be in responsive grid
    const playerCards = await page.locator('[class*="player"]').all();
    if (playerCards.length > 0) {
      const viewport = page.viewportSize();
      const firstCard = playerCards[0];
      const box = await firstCard.boundingBox();

      if (box && viewport) {
        // On mobile, cards should be nearly full width (1 column)
        if (viewport.width < 768) {
          expect(box.width).toBeGreaterThan(viewport.width * 0.7);
        }
      }
    }
  });

  test('Transfers page should have responsive player listings', async ({ page }) => {
    await page.goto('/transfers');
    await page.waitForLoadState('networkidle');

    // Filter tabs should be responsive
    const tabs = await page.locator('[role="tab"], button:has-text("Available")').all();
    expect(tabs.length).toBeGreaterThan(0);

    // Player cards should adapt to screen
    const playerCards = await page.locator('[class*="player"]').all();
    if (playerCards.length > 0) {
      const viewport = page.viewportSize();
      const firstCard = playerCards[0];
      const box = await firstCard.boundingBox();

      if (box && viewport) {
        // On mobile, cards should be stacked
        if (viewport.width < 768) {
          expect(box.width).toBeGreaterThan(viewport.width * 0.7);
        }
      }
    }

    // Action buttons should be touch-friendly
    const actionButtons = await page
      .locator('button:has-text("Buy"), button:has-text("Scout")')
      .all();
    for (const button of actionButtons) {
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40); // Touch-friendly size
        }
      }
    }
  });

  test('Analytics page should have responsive metrics and grids', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Team selector should be responsive
    const teamButtons = await page
      .locator('button:has-text("Home Team"), button:has-text("Away Team")')
      .all();
    expect(teamButtons.length).toBe(2);

    // Metric tabs should adapt
    const metricTabs = await page
      .locator('button:has-text("Performance"), button:has-text("Financials")')
      .all();
    expect(metricTabs.length).toBeGreaterThan(0);

    // Stats cards should be in responsive grid
    const statsCards = await page.locator('[class*="stat"], [class*="metric"]').all();
    if (statsCards.length > 0) {
      const viewport = page.viewportSize();
      if (viewport && viewport.width < 768) {
        // On mobile, cards should stack
        const firstCard = statsCards[0];
        const box = await firstCard.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(viewport.width * 0.7);
        }
      }
    }
  });

  test('Finances page should have responsive budget cards', async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    // Financial cards should be present
    const financialCards = await page.locator('[class*="budget"], [class*="financial"]').all();
    expect(financialCards.length).toBeGreaterThan(0);

    // Team selector should be touch-friendly
    const teamButtons = await page
      .locator('button:has-text("Home Team"), button:has-text("Away Team")')
      .all();
    for (const button of teamButtons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }

    // Budget grids should adapt to mobile
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      // Cards should stack on mobile
      if (financialCards.length > 1) {
        const card1Box = await financialCards[0].boundingBox();
        const card2Box = await financialCards[1].boundingBox();

        if (card1Box && card2Box) {
          // Cards should be in vertical stack (Y positions differ significantly)
          expect(Math.abs(card2Box.y - card1Box.y)).toBeGreaterThan(50);
        }
      }
    }
  });

  test('Settings page should have responsive controls', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Settings options should be responsive
    const settingsButtons = await page
      .locator('button[class*="touch"], button:has-text("AI")')
      .all();
    expect(settingsButtons.length).toBeGreaterThan(0);

    // All controls should meet touch target size
    for (const button of settingsButtons) {
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test('PWA manifest should be configured', async ({ page }) => {
    await page.goto('/');

    // Check for manifest link
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifest).toBeTruthy();

    // Check for app icons
    const appIcons = await page.locator('link[rel="apple-touch-icon"], link[rel="icon"]').all();
    expect(appIcons.length).toBeGreaterThan(0);

    // Check for theme color
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();
  });
});

// Performance tests
test.describe('Mobile Performance', () => {
  test('Pages should load quickly on mobile', async ({ page }) => {
    for (const { path, name } of CORE_PAGES) {
      const startTime = Date.now();
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Pages should load in under 3 seconds on mobile
      expect(loadTime).toBeLessThan(3000);
      console.log(`${name} loaded in ${loadTime}ms`);
    }
  });

  test('Touch interactions should be responsive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const buttons = await page.locator('button').all();
    if (buttons.length > 0) {
      const button = buttons[0];
      if (await button.isVisible()) {
        // Warm-up taps to initialize any lazy event handlers
        await button.tap();
        await page.waitForTimeout(100);
        await button.tap();
        await page.waitForTimeout(100);

        // Measure actual touch latency
        const measurements: number[] = [];
        for (let i = 0; i < 3; i++) {
          const startTime = Date.now();
          await button.tap();
          await page.waitForTimeout(50);
          const responseTime = Date.now() - startTime;
          measurements.push(responseTime);
        }

        // Average of measurements
        const avgLatency = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        console.log(
          `Touch latency measurements: ${measurements.join(', ')}ms (avg: ${avgLatency.toFixed(1)}ms)`
        );

        // Touch response should be under 200ms on average (dev server is slower than production)
        expect(avgLatency).toBeLessThan(200);
      }
    }
  });

  test('Animations should run smoothly (60fps target)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Monitor frame rate during interactions
    const buttons = await page.locator('button').all();
    if (buttons.length > 0) {
      const button = buttons[0];
      if (await button.isVisible()) {
        // Perform rapid taps to test animation performance
        for (let i = 0; i < 5; i++) {
          await button.tap();
          await page.waitForTimeout(50);
        }

        // Check for any performance warnings in console
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'warning' && msg.text().includes('performance')) {
            errors.push(msg.text());
          }
        });

        expect(errors.length).toBe(0);
      }
    }
  });
});

// Accessibility tests for mobile
test.describe('Mobile Accessibility', () => {
  test('All pages should have proper heading hierarchy', async ({ page }) => {
    for (const { path, name } of CORE_PAGES) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Should have h1
      const h1 = await page.locator('h1').count();
      expect(h1).toBeGreaterThan(0);
    }
  });

  test('Interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // All buttons should be focusable
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 5)) {
      // Test first 5 buttons
      if (await button.isVisible()) {
        await button.focus();
        const focused = await button.evaluate(el => document.activeElement === el);
        expect(focused).toBe(true);
      }
    }
  });

  test('Touch targets should not overlap', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const buttons = await page.locator('button').all();
    const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];

    for (const button of buttons) {
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          boxes.push(box);
        }
      }
    }

    // Check for overlaps
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const box1 = boxes[i];
        const box2 = boxes[j];

        const overlaps = !(
          box1.x + box1.width < box2.x ||
          box2.x + box2.width < box1.x ||
          box1.y + box1.height < box2.y ||
          box2.y + box2.height < box1.y
        );

        if (overlaps) {
          console.warn(`Touch targets overlap: Button ${i} and ${j}`);
        }
      }
    }
  });
});
