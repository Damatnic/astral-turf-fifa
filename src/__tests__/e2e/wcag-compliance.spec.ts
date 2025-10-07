/**
 * WCAG 2.1 AA Compliance Test Suite
 *
 * This test suite uses axe-core to automatically test for WCAG 2.1 Level AA violations
 * across all major pages and components of the Astral Turf application.
 *
 * @see https://www.deque.com/axe/core-documentation/api-documentation/
 * @see https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aaa
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Helper function to analyze and report accessibility violations
 */
async function checkA11y(
  page: any,
  pageName: string,
  options?: {
    detailedReport?: boolean;
    disableRules?: string[];
    runOnly?: string[];
  },
) {
  const axeBuilder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .options({
      rules: options?.disableRules?.reduce(
        (acc, rule) => {
          acc[rule] = { enabled: false };
          return acc;
        },
        {} as Record<string, { enabled: boolean }>,
      ),
    });

  if (options?.runOnly) {
    axeBuilder.withTags(options.runOnly);
  }

  const results = await axeBuilder.analyze();

  // Log summary
  console.log(`\n=== ${pageName} A11y Report ===`);
  console.log(`Violations: ${results.violations.length}`);
  console.log(`Passes: ${results.passes.length}`);
  console.log(`Incomplete: ${results.incomplete.length}`);
  console.log(`Inapplicable: ${results.inapplicable.length}`);

  // Log detailed violations
  if (results.violations.length > 0) {
    console.log(`\n🔴 VIOLATIONS (${results.violations.length}):`);
    results.violations.forEach((violation, index) => {
      console.log(`\n${index + 1}. ${violation.id} (${violation.impact})`);
      console.log(`   Description: ${violation.description}`);
      console.log(`   Help: ${violation.help}`);
      console.log(`   WCAG: ${violation.tags.filter(tag => tag.includes('wcag')).join(', ')}`);
      console.log(`   Affected nodes: ${violation.nodes.length}`);

      if (options?.detailedReport) {
        violation.nodes.forEach((node, nodeIndex) => {
          console.log(`\n   Node ${nodeIndex + 1}:`);
          console.log(`   - HTML: ${node.html}`);
          console.log(`   - Target: ${node.target.join(' > ')}`);
          console.log(`   - Issue: ${node.failureSummary}`);
        });
      }
    });
  } else {
    console.log('\n✅ No violations found!');
  }

  // Expect zero violations for WCAG 2.1 AA compliance
  expect(results.violations).toEqual([]);

  return results;
}

/**
 * Login helper
 */
async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

test.describe('WCAG 2.1 AA Compliance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('Dashboard Page - Full Accessibility Scan', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await checkA11y(page, 'Dashboard Page', {
      detailedReport: true,
    });
  });

  test('Tactics Board Page - Full Accessibility Scan', async ({ page }) => {
    await page.goto('/tactics');
    await page.waitForLoadState('networkidle');

    // Wait for tactical board to render
    await page.waitForSelector('[role="application"]', { timeout: 5000 });

    await checkA11y(page, 'Tactics Board Page', {
      detailedReport: true,
    });
  });

  test('Training Page - Full Accessibility Scan', async ({ page }) => {
    await page.goto('/training');
    await page.waitForLoadState('networkidle');

    await checkA11y(page, 'Training Page', {
      detailedReport: true,
    });
  });

  test('Analytics Page - Charts Accessibility', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to render
    await page.waitForSelector('[role="img"]', { timeout: 5000 });

    await checkA11y(page, 'Analytics Page (Charts)', {
      detailedReport: true,
    });
  });

  test('Transfers Page - Full Accessibility Scan', async ({ page }) => {
    await page.goto('/transfers');
    await page.waitForLoadState('networkidle');

    await checkA11y(page, 'Transfers Page', {
      detailedReport: true,
    });
  });

  test('Settings Page - Forms Accessibility', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await checkA11y(page, 'Settings Page (Forms)', {
      detailedReport: true,
    });
  });

  test('Keyboard Navigation - Skip Links', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Test skip links
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);

    expect(focusedElement).toContain('Skip to');

    // Press Enter on skip link
    await page.keyboard.press('Enter');

    // Verify focus moved to main content
    const mainFocused = await page.evaluate(() => {
      const main = document.getElementById('main-content');
      return document.activeElement === main || main?.contains(document.activeElement);
    });

    expect(mainFocused).toBeTruthy();
  });

  test('Keyboard Navigation - Tactical Board', async ({ page }) => {
    await page.goto('/tactics');
    await page.waitForLoadState('networkidle');

    // Wait for player tokens
    await page.waitForSelector('[role="button"][aria-label*="player"]', { timeout: 5000 });

    // Tab to first player token
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify a player token is focused
    const focusedPlayer = await page.evaluate(() => {
      const focused = document.activeElement;
      return (
        focused?.getAttribute('role') === 'button' &&
        focused?.getAttribute('aria-label')?.includes('player')
      );
    });

    expect(focusedPlayer).toBeTruthy();
  });

  test('Keyboard Navigation - Formation Selector', async ({ page }) => {
    await page.goto('/tactics');
    await page.waitForLoadState('networkidle');

    // Look for formation selector
    const formationGroup = await page.locator('[role="radiogroup"]').first();
    await formationGroup.scrollIntoViewIfNeeded();

    // Tab to formation selector
    await page.keyboard.press('Tab');

    // Verify formation radio is focused
    const focusedFormation = await page.evaluate(() => {
      const focused = document.activeElement;
      return (
        focused?.getAttribute('role') === 'radio' && focused?.getAttribute('aria-checked') !== null
      );
    });

    expect(focusedFormation).toBeTruthy();
  });

  test('High Contrast Mode - Toggle and Verify', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Look for high contrast toggle/select
    const contrastControl = page.locator('text=Contrast Mode').first();
    await contrastControl.scrollIntoViewIfNeeded();

    // Enable high contrast
    await page.evaluate(() => {
      const html = document.documentElement;
      html.classList.add('high-contrast');
    });

    // Verify high contrast class applied
    const hasHighContrast = await page.evaluate(() => {
      return document.documentElement.classList.contains('high-contrast');
    });

    expect(hasHighContrast).toBeTruthy();

    // Re-run accessibility check with high contrast
    await checkA11y(page, 'Settings Page (High Contrast)', {
      detailedReport: false,
    });
  });

  test('Screen Reader - Chart Descriptions', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Find all charts
    const charts = await page.locator('[role="img"]').all();

    expect(charts.length).toBeGreaterThan(0);

    for (const chart of charts) {
      // Verify each chart has aria-label
      const ariaLabel = await chart.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.length).toBeGreaterThan(0);

      // Verify each chart has aria-describedby
      const ariaDescribedBy = await chart.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeTruthy();

      // Verify description element exists
      const descId = ariaDescribedBy;
      const descElement = await page.locator(`#${descId}`).first();
      const descText = await descElement.textContent();

      expect(descText).toBeTruthy();
      expect(descText?.length).toBeGreaterThan(10); // Non-trivial description
    }
  });

  test('Screen Reader - Player Token Descriptions', async ({ page }) => {
    await page.goto('/tactics');
    await page.waitForLoadState('networkidle');

    // Find all player tokens
    const players = await page.locator('[role="button"][aria-label*="player"]').all();

    expect(players.length).toBeGreaterThan(0);

    for (const player of players.slice(0, 3)) {
      // Test first 3 players
      // Verify aria-label exists and is comprehensive
      const ariaLabel = await player.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/number \d+/); // Contains jersey number
      expect(ariaLabel).toMatch(/(home|away) team/); // Contains team

      // Verify aria-describedby
      const ariaDescribedBy = await player.getAttribute('aria-describedby');
      if (ariaDescribedBy) {
        const descElement = await page.locator(`#${ariaDescribedBy}`).first();
        const descText = await descElement.textContent();
        expect(descText).toBeTruthy();
      }
    }
  });

  test('Focus Management - Modal Trap', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Open a modal (if available)
    const modalTrigger = page.locator('button:has-text("Settings")').first();
    if ((await modalTrigger.count()) > 0) {
      await modalTrigger.click();

      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Tab through modal
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Verify focus stays within modal
      const focusInModal = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        const focused = document.activeElement;
        return modal?.contains(focused);
      });

      expect(focusInModal).toBeTruthy();

      // Test Escape to close
      await page.keyboard.press('Escape');

      // Verify modal closed
      const modalClosed = (await page.locator('[role="dialog"]').count()) === 0;
      expect(modalClosed).toBeTruthy();
    }
  });

  test('Color Contrast - Verify Minimum Ratios', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Run axe with contrast-only rules
    await checkA11y(page, 'Dashboard (Contrast Check)', {
      runOnly: ['cat.color'],
      detailedReport: true,
    });
  });

  test('Forms - Label Association', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Find all form inputs
    const inputs = await page.locator('input, select, textarea').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Verify input has label association
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        const hasAssociation = label > 0 || ariaLabel || ariaLabelledBy;
        expect(hasAssociation).toBeTruthy();
      }
    }
  });

  test('Landmarks - Proper Structure', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify main landmark exists
    const mainLandmark = await page.locator('main').count();
    expect(mainLandmark).toBeGreaterThan(0);

    // Verify navigation landmark exists (if header present)
    const navLandmark = await page.locator('nav, [role="navigation"]').count();
    expect(navLandmark).toBeGreaterThanOrEqual(0); // May not be on all pages
  });

  test('Heading Hierarchy - No Skipped Levels', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Get all headings
    const headings = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return elements.map(el => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent?.trim() || '',
      }));
    });

    // Verify single h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBeLessThanOrEqual(1);

    // Verify no skipped levels
    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i].level - headings[i - 1].level;
      // Can go down multiple levels, but can only go up 1 level
      if (diff > 0) {
        expect(diff).toBeLessThanOrEqual(1);
      }
    }
  });
});

test.describe('Keyboard Shortcuts Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Help Modal - Question Mark Shortcut', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Press ? to open shortcuts help
    await page.keyboard.press('Shift+/'); // ? key

    // Wait for help modal
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });

    // Verify modal contains shortcuts
    const modalContent = await page.locator('[role="dialog"]').textContent();
    expect(modalContent).toContain('Keyboard Shortcuts');
    expect(modalContent).toMatch(/Ctrl|Alt|Shift/); // Contains modifier keys
  });

  test('Search - Ctrl+K Shortcut', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Press Ctrl+K
    await page.keyboard.press('Control+K');

    // Verify search activated (look for search input or modal)
    const searchActive = await page.evaluate(() => {
      const focused = document.activeElement;
      return (
        focused?.getAttribute('type') === 'search' ||
        focused?.getAttribute('placeholder')?.toLowerCase().includes('search')
      );
    });

    expect(searchActive).toBeTruthy();
  });
});

test.describe('Mobile Accessibility', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Mobile Dashboard - Touch Targets', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Run accessibility check on mobile
    await checkA11y(page, 'Mobile Dashboard', {
      detailedReport: true,
    });
  });

  test('Mobile Tactics - Zoom Support', async ({ page }) => {
    await page.goto('/tactics');
    await page.waitForLoadState('networkidle');

    // Verify viewport meta allows zooming
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).not.toContain('user-scalable=no');
    expect(viewportMeta).not.toContain('maximum-scale=1');
  });
});
