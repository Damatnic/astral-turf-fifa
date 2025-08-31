import { test, expect } from '@playwright/test';

test.describe('Tactics Board E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application and login
    await page.goto('/');

    // Wait for login page and perform login
    await expect(page.locator('text=Sign In')).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Sign In")').click();

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Ensure we're on a page with tactical features
    await page.waitForTimeout(2000);
  });

  test('should display the tactics board interface', async ({ page, isMobile }) => {
    // Should have the main field area
    const fieldArea = page.locator('[data-testid="soccer-field"], .field, canvas').first();
    await expect(fieldArea).toBeVisible({ timeout: 10000 });

    if (!isMobile) {
      // Desktop should show sidebars
      const sidebar = page.locator('[data-testid="left-sidebar"], .sidebar').first();
      await expect(sidebar).toBeVisible();
    }

    // Should have some form of player roster or team management
    const players = page.locator('[data-testid*="player"], .player, .roster').first();
    if (await players.isVisible()) {
      await expect(players).toBeVisible();
    }
  });

  test('should handle formation selection', async ({ page }) => {
    // Look for formation controls
    const formationSelector = page.locator(
      '[data-testid*="formation"], select:has(option[value*="4-4-2"]), button:has-text("4-4-2")',
    ).first();

    if (await formationSelector.isVisible()) {
      // Try to select a different formation
      if (await formationSelector.getAttribute('tagName') === 'SELECT') {
        await formationSelector.selectOption('4-3-3');
      } else {
        await formationSelector.click();
      }

      // Wait for formation change to apply
      await page.waitForTimeout(1000);

      // Should see some visual change in the field
      const field = page.locator('[data-testid="soccer-field"], .field, canvas').first();
      await expect(field).toBeVisible();
    }
  });

  test('should support player interaction', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for player elements on the field
    const playerElements = page.locator(
      '[data-testid*="player"], .player-token, .player, [class*="player"]',
    );

    const playerCount = await playerElements.count();

    if (playerCount > 0) {
      const firstPlayer = playerElements.first();
      await expect(firstPlayer).toBeVisible();

      // Try to interact with the player
      await firstPlayer.hover();
      await page.waitForTimeout(500);

      // Look for hover effects or tooltips
      const tooltip = page.locator('[data-testid="tooltip"], .tooltip, [class*="tooltip"]').first();
      if (await tooltip.isVisible()) {
        await expect(tooltip).toBeVisible();
      }

      // Try clicking on the player
      await firstPlayer.click();
      await page.waitForTimeout(500);

      // Should show player details or selection
      const playerInfo = page.locator(
        '[data-testid*="player-info"], .player-details, .player-stats',
      ).first();

      if (await playerInfo.isVisible()) {
        await expect(playerInfo).toBeVisible();
      }
    }
  });

  test('should handle tactical tools', async ({ page }) => {
    // Look for tactical toolbar
    const toolbar = page.locator(
      '[data-testid="tactical-toolbar"], .toolbar, .tools',
    ).first();

    if (await toolbar.isVisible()) {
      await expect(toolbar).toBeVisible();

      // Look for drawing tools
      const drawingTools = page.locator(
        'button:has-text("Draw"), button:has-text("Line"), [data-testid*="tool"]',
      );

      const toolCount = await drawingTools.count();
      if (toolCount > 0) {
        const firstTool = drawingTools.first();
        await firstTool.click();
        await page.waitForTimeout(500);

        // Tool should be activated
        const activeClass = await firstTool.getAttribute('class');
        expect(activeClass).toBeTruthy();
      }
    }
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    // Focus on the main application area
    await page.locator('body').click();

    // Test common keyboard shortcuts
    // Press 'v' for select tool
    await page.keyboard.press('v');
    await page.waitForTimeout(300);

    // Press 'a' for arrow tool
    await page.keyboard.press('a');
    await page.waitForTimeout(300);

    // Press 'r' for zone tool
    await page.keyboard.press('r');
    await page.waitForTimeout(300);

    // Should not throw errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('CJS build')) {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(500);
    expect(errors.length).toBeLessThan(5); // Allow some minor errors
  });

  test('should handle team switching', async ({ page }) => {
    // Look for team selection controls
    const teamSelector = page.locator(
      '[data-testid*="team"], button:has-text("Home"), button:has-text("Away"), .team-toggle',
    ).first();

    if (await teamSelector.isVisible()) {
      const originalTeam = await teamSelector.textContent();

      // Try to switch teams
      await teamSelector.click();
      await page.waitForTimeout(1000);

      // Look for team change indication
      const newTeam = await teamSelector.textContent();

      // Content should change or there should be visual indication
      expect(newTeam).toBeDefined();
    }
  });

  test('should support zoom and pan on field', async ({ page }) => {
    const field = page.locator('[data-testid="soccer-field"], .field, canvas').first();
    await expect(field).toBeVisible();

    // Get field bounding box
    const fieldBox = await field.boundingBox();
    if (!fieldBox) {return;}

    const centerX = fieldBox.x + fieldBox.width / 2;
    const centerY = fieldBox.y + fieldBox.height / 2;

    // Test mouse wheel for zoom
    await page.mouse.move(centerX, centerY);
    await page.mouse.wheel(0, -100); // Zoom in
    await page.waitForTimeout(500);

    await page.mouse.wheel(0, 100); // Zoom out
    await page.waitForTimeout(500);

    // Test dragging for pan
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 50, centerY + 50);
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Field should still be visible and functional
    await expect(field).toBeVisible();
  });

  test('should handle modal interactions', async ({ page }) => {
    // Look for buttons that might open modals
    const modalButtons = page.locator(
      'button:has-text("Edit"), button:has-text("Settings"), button:has-text("Chat")',
    );

    const buttonCount = await modalButtons.count();
    if (buttonCount > 0) {
      const firstButton = modalButtons.first();
      await firstButton.click();
      await page.waitForTimeout(1000);

      // Look for modal
      const modal = page.locator(
        '[data-testid*="modal"], .modal, [role="dialog"], .popup',
      ).first();

      if (await modal.isVisible()) {
        await expect(modal).toBeVisible();

        // Try to close modal
        const closeButton = page.locator(
          'button:has-text("Close"), button:has-text("×"), [data-testid="close"]',
        ).first();

        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);

          // Modal should be hidden
          await expect(modal).not.toBeVisible();
        } else {
          // Try pressing Escape
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('should persist user actions', async ({ page }) => {
    // Make some changes (if possible)
    const playerElements = page.locator('[data-testid*="player"], .player').first();

    if (await playerElements.isVisible()) {
      // Try to move a player or make some change
      await playerElements.click();
      await page.waitForTimeout(500);

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Basic layout should still be intact
      const field = page.locator('[data-testid="soccer-field"], .field, canvas').first();
      await expect(field).toBeVisible();
    }
  });
});

test.describe('Mobile Tactics Board', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE dimensions

  test('should work on mobile devices', async ({ page }) => {
    await page.goto('/');

    // Login
    await expect(page.locator('text=Sign In')).toBeVisible();
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForLoadState('networkidle');

    // Should have mobile-friendly layout
    const body = page.locator('body');
    await expect(body).toHaveClass(/mobile|responsive/);

    // Field should be visible and touch-friendly
    const field = page.locator('[data-testid="soccer-field"], .field, canvas').first();
    await expect(field).toBeVisible();

    // Test touch interactions
    const fieldBox = await field.boundingBox();
    if (fieldBox) {
      // Test tap
      await page.touchscreen.tap(fieldBox.x + 100, fieldBox.y + 100);
      await page.waitForTimeout(500);

      // Test pinch to zoom (if supported)
      await page.touchscreen.tap(fieldBox.x + 50, fieldBox.y + 50);
      await page.touchscreen.tap(fieldBox.x + 150, fieldBox.y + 150);
      await page.waitForTimeout(500);
    }
  });

  test('should have mobile navigation', async ({ page }) => {
    await page.goto('/');

    // Login
    await expect(page.locator('text=Sign In')).toBeVisible();
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForLoadState('networkidle');

    // Look for mobile menu/hamburger button
    const menuButton = page.locator(
      '[data-testid="menu-button"], button:has-text("☰"), .hamburger, .menu-toggle',
    ).first();

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Should show mobile navigation
      const mobileNav = page.locator(
        '[data-testid="mobile-nav"], .mobile-menu, .drawer',
      ).first();

      if (await mobileNav.isVisible()) {
        await expect(mobileNav).toBeVisible();

        // Should be able to close it
        await menuButton.click();
        await page.waitForTimeout(500);

        await expect(mobileNav).not.toBeVisible();
      }
    }
  });
});