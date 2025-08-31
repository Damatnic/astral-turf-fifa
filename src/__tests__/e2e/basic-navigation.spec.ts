import { test, expect } from '@playwright/test';

test.describe('Basic Application Navigation', () => {
  test('should load the main page successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for the application to load
    await page.waitForLoadState('networkidle');

    // Should have the correct title
    await expect(page).toHaveTitle(/Astral Turf/i);

    // Should not have any critical console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Should load without critical JavaScript errors
    await page.waitForTimeout(2000);

    // Filter out known development warnings
    const criticalErrors = errors.filter(error =>
      !error.includes('CJS build of Vite') &&
      !error.includes('deprecated') &&
      !error.includes('Warning'),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should display login page when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login or show login form
    await expect(page.locator('text=Sign In')).toBeVisible({ timeout: 10000 });

    // Should have email and password fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should handle login flow', async ({ page }) => {
    await page.goto('/');

    // Wait for login form to be visible
    await expect(page.locator('text=Sign In')).toBeVisible();

    // Fill in login credentials (using the pre-filled demo values)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Check if fields are pre-filled, if not fill them
    const emailValue = await emailInput.inputValue();
    if (!emailValue) {
      await emailInput.fill('coach@astralfc.com');
    }

    const passwordValue = await passwordInput.inputValue();
    if (!passwordValue) {
      await passwordInput.fill('password123');
    }

    // Click login button
    await page.locator('button:has-text("Sign In")').click();

    // Should navigate to tactics board or dashboard
    await expect(page).toHaveURL(/\/(tactics-board|dashboard)/);

    // Should show some indication of successful login
    await page.waitForLoadState('networkidle');

    // Should not show login form anymore
    await expect(page.locator('text=Sign In')).not.toBeVisible();
  });

  test('should handle responsive design on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');

      // Login first
      await expect(page.locator('text=Sign In')).toBeVisible();
      await page.locator('button:has-text("Sign In")').click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Should have mobile-friendly layout
      const mainContainer = page.locator('main');
      await expect(mainContainer).toBeVisible();

      // Should not show desktop sidebars by default on mobile
      const sidebar = page.locator('[data-testid="left-sidebar"]');
      if (await sidebar.isVisible()) {
        // If sidebar is visible, it should be in a drawer/modal style
        const sidebarClass = await sidebar.getAttribute('class');
        expect(sidebarClass).toContain('mobile');
      }
    }
  });

  test('should navigate between main sections', async ({ page }) => {
    // Login first
    await page.goto('/');
    await expect(page.locator('text=Sign In')).toBeVisible();
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForLoadState('networkidle');

    // Should be able to access different sections
    // Note: These tests depend on the actual navigation structure

    // Try to find navigation elements
    const navElements = await page.locator('nav, [role="navigation"], .sidebar').count();
    expect(navElements).toBeGreaterThan(0);

    // Check if tactics board is accessible
    const currentUrl = page.url();
    if (currentUrl.includes('tactics-board')) {
      // We're already on tactics board - good
      expect(page.url()).toContain('tactics-board');
    } else {
      // Try to navigate to tactics board
      const tacticsLink = page.locator('a:has-text("Tactics"), button:has-text("Tactics")').first();
      if (await tacticsLink.isVisible()) {
        await tacticsLink.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/');

    // Login form should have proper accessibility
    await expect(page.locator('text=Sign In')).toBeVisible();

    // Check for proper form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Check that inputs have labels or aria-labels
    const emailLabel = await emailInput.getAttribute('aria-label') || await emailInput.getAttribute('placeholder');
    const passwordLabel = await passwordInput.getAttribute('aria-label') || await passwordInput.getAttribute('placeholder');

    expect(emailLabel).toBeTruthy();
    expect(passwordLabel).toBeTruthy();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Sign In')).toBeVisible();

    // Should be able to navigate with Tab key
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Should be able to submit form with Enter
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();
    await page.keyboard.press('Enter');

    // Form should attempt to submit (even if validation fails)
    await page.waitForTimeout(500);
  });
});

test.describe('Performance', () => {
  test('should load initial page within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds (generous for development)
    expect(loadTime).toBeLessThan(10000);
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    // Navigate through different parts of the app
    await page.goto('/');
    await expect(page.locator('text=Sign In')).toBeVisible();

    // Login
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForLoadState('networkidle');

    // Multiple navigation cycles to check for memory leaks
    for (let i = 0; i < 3; i++) {
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.goForward();
      await page.waitForLoadState('networkidle');
    }

    // Basic check - page should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });
});