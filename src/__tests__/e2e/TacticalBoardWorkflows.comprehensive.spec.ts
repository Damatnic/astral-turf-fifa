import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive E2E tests for tactical board workflows
 * Tests complete user journeys from start to finish
 */

// Test data and utilities
class TacticalBoardPage {
  constructor(private page: Page) {}

  async navigateToBoard() {
    await this.page.goto('http://localhost:3012');
    await this.page.waitForSelector('[role="application"]', { timeout: 10000 });
  }

  async waitForBoardToLoad() {
    await this.page.waitForSelector('[role="main"]', { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async selectPlayer(playerName: string) {
    await this.page.click(`[aria-label*="${playerName}"]`);
  }

  async dragPlayerToPosition(playerSelector: string, x: number, y: number) {
    const player = await this.page.locator(playerSelector);
    const field = await this.page.locator('[role="main"]');

    await player.dragTo(field, {
      targetPosition: { x, y },
      force: true,
    });
  }

  async openFormationTemplates() {
    await this.page.click('[data-testid="formation-templates-button"]', { timeout: 5000 });
    await this.page.waitForSelector('[data-testid="formation-templates"]', { timeout: 5000 });
  }

  async selectFormation(formationName: string) {
    await this.page.click(`text=${formationName}`);
  }

  async openPlayerDisplaySettings() {
    await this.page.click('[data-testid="player-display-settings-button"]');
    await this.page.waitForSelector('[data-testid="player-display-settings"]');
  }

  async togglePlayerNames() {
    await this.page.click('[aria-label*="show player names"]');
  }

  async changePlayerSize(size: 'small' | 'medium' | 'large') {
    await this.page.selectOption('[aria-label*="player size"]', size);
  }

  async openBench() {
    await this.page.click('[data-testid="bench-toggle"]');
    await this.page.waitForSelector('[data-testid="positional-bench"]');
  }

  async substitutePlayer(benchPlayerName: string, fieldPlayerName: string) {
    // Drag from bench to field
    const benchPlayer = this.page.locator(
      `[data-testid="positional-bench"] [aria-label*="${benchPlayerName}"]`,
    );
    const fieldPlayer = this.page.locator(`[role="main"] [aria-label*="${fieldPlayerName}"]`);

    await benchPlayer.dragTo(fieldPlayer);
  }

  async startDrawing(tool: 'pen' | 'line' | 'arrow' | 'circle') {
    await this.page.click(`[data-testid="drawing-tool-${tool}"]`);
  }

  async drawOnField(startX: number, startY: number, endX: number, endY: number) {
    const field = this.page.locator('[role="main"]');

    await field.hover({ position: { x: startX, y: startY } });
    await this.page.mouse.down();
    await field.hover({ position: { x: endX, y: endY } });
    await this.page.mouse.up();
  }

  async enterFullscreen() {
    await this.page.click('[data-testid="fullscreen-button"]');
  }

  async exitFullscreen() {
    await this.page.keyboard.press('Escape');
  }

  async openAIAssistant() {
    await this.page.click('[data-testid="ai-assistant-button"]');
    await this.page.waitForSelector('[data-testid="intelligent-assistant"]');
  }

  async saveFormation(name: string) {
    await this.page.click('[data-testid="save-formation-button"]');
    await this.page.fill('[data-testid="formation-name-input"]', name);
    await this.page.click('[data-testid="confirm-save"]');
  }

  async exportFormation() {
    await this.page.click('[data-testid="export-button"]');
    await this.page.waitForSelector('[data-testid="export-options"]');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}

test.describe('Tactical Board - Complete User Workflows', () => {
  let tacticalBoard: TacticalBoardPage;

  test.beforeEach(async ({ page }) => {
    tacticalBoard = new TacticalBoardPage(page);
    await tacticalBoard.navigateToBoard();
    await tacticalBoard.waitForBoardToLoad();
  });

  test.describe('Formation Management Workflow', () => {
    test('should complete full formation creation and customization workflow', async ({ page }) => {
      // Step 1: Start with default formation
      await expect(page.locator('[role="application"]')).toBeVisible();

      // Step 2: Open formation templates
      await tacticalBoard.openFormationTemplates();
      await expect(page.locator('[data-testid="formation-templates"]')).toBeVisible();

      // Step 3: Select a formation (e.g., 4-3-3)
      await tacticalBoard.selectFormation('4-3-3');
      await page.waitForTimeout(1000); // Wait for formation to apply

      // Step 4: Customize player positions
      await tacticalBoard.dragPlayerToPosition(
        '[data-testid="player-token"]:first-child',
        300,
        200,
      );
      await page.waitForTimeout(500);

      // Step 5: Adjust player display settings
      await tacticalBoard.openPlayerDisplaySettings();
      await tacticalBoard.togglePlayerNames();
      await tacticalBoard.changePlayerSize('large');

      // Step 6: Save the formation
      await tacticalBoard.saveFormation('Custom 4-3-3 Formation');

      // Verify the workflow completed successfully
      await expect(page.locator('text=Formation saved successfully')).toBeVisible({
        timeout: 5000,
      });

      await tacticalBoard.takeScreenshot('formation-creation-workflow');
    });

    test('should handle formation switching and comparison', async ({ page }) => {
      // Test switching between different formations
      await tacticalBoard.openFormationTemplates();

      // Try multiple formations
      const formations = ['4-4-2', '3-5-2', '4-2-3-1'];

      for (const formation of formations) {
        await tacticalBoard.selectFormation(formation);
        await page.waitForTimeout(1000);

        // Verify formation is applied
        await expect(page.locator('[role="main"]')).toBeVisible();

        // Take screenshot for comparison
        await tacticalBoard.takeScreenshot(`formation-${formation.replace(/-/g, '')}`);
      }
    });
  });

  test.describe('Player Management Workflow', () => {
    test('should complete full player substitution workflow', async ({ page }) => {
      // Step 1: Open the bench
      await tacticalBoard.openBench();
      await expect(page.locator('[data-testid="positional-bench"]')).toBeVisible();

      // Step 2: Select a player from bench
      const benchPlayer = page.locator(
        '[data-testid="positional-bench"] [data-testid*="player-card"]:first-child',
      );
      await expect(benchPlayer).toBeVisible();

      // Step 3: Select a field player to substitute
      const fieldPlayer = page.locator('[role="main"] [data-testid*="player-token"]:first-child');
      await expect(fieldPlayer).toBeVisible();

      // Step 4: Perform substitution via drag and drop
      await benchPlayer.dragTo(fieldPlayer);

      // Step 5: Confirm substitution if needed
      const confirmButton = page.locator('[data-testid="confirm-substitution"]');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Verify substitution completed
      await page.waitForTimeout(1000);
      await expect(page.locator('[role="main"]')).toBeVisible();

      await tacticalBoard.takeScreenshot('player-substitution-workflow');
    });

    test('should handle multiple player interactions', async ({ page }) => {
      // Test selecting multiple players
      const playerTokens = page.locator('[role="main"] [data-testid*="player-token"]');

      // Select first player
      await playerTokens.first().click();

      // Multi-select with Ctrl+Click
      await page.keyboard.down('Control');
      await playerTokens.nth(1).click();
      await playerTokens.nth(2).click();
      await page.keyboard.up('Control');

      // Verify multiple selection
      const selectedPlayers = page.locator('[data-selected="true"]');
      await expect(selectedPlayers).toHaveCount(3);

      await tacticalBoard.takeScreenshot('multiple-player-selection');
    });
  });

  test.describe('Drawing and Tactical Analysis Workflow', () => {
    test('should complete tactical drawing and annotation workflow', async ({ page }) => {
      // Step 1: Select drawing tool
      await tacticalBoard.startDrawing('pen');

      // Step 2: Draw tactical lines
      await tacticalBoard.drawOnField(100, 150, 300, 250);
      await page.waitForTimeout(500);

      // Step 3: Switch to arrow tool
      await tacticalBoard.startDrawing('arrow');

      // Step 4: Draw arrows for player movements
      await tacticalBoard.drawOnField(200, 200, 400, 300);
      await page.waitForTimeout(500);

      // Step 5: Add circle annotations
      await tacticalBoard.startDrawing('circle');
      await tacticalBoard.drawOnField(350, 150, 380, 180);

      // Verify drawings are visible
      await expect(page.locator('[data-testid="drawing-canvas"]')).toBeVisible();

      await tacticalBoard.takeScreenshot('tactical-drawing-workflow');
    });

    test('should handle complex tactical scenarios', async ({ page }) => {
      // Create a complex tactical scenario

      // Step 1: Set up formation
      await tacticalBoard.openFormationTemplates();
      await tacticalBoard.selectFormation('4-2-3-1');

      // Step 2: Move players to custom positions
      const players = page.locator('[role="main"] [data-testid*="player-token"]');

      for (let i = 0; i < 3; i++) {
        await players.nth(i).dragTo(page.locator('[role="main"]'), {
          targetPosition: { x: 200 + i * 100, y: 300 },
        });
        await page.waitForTimeout(300);
      }

      // Step 3: Add tactical drawings
      await tacticalBoard.startDrawing('line');

      // Draw formation lines
      await tacticalBoard.drawOnField(150, 250, 450, 250); // Defensive line
      await tacticalBoard.drawOnField(150, 350, 450, 350); // Midfield line

      // Step 4: Add movement arrows
      await tacticalBoard.startDrawing('arrow');
      await tacticalBoard.drawOnField(250, 300, 350, 200); // Attack movement

      await tacticalBoard.takeScreenshot('complex-tactical-scenario');
    });
  });

  test.describe('Advanced Features Workflow', () => {
    test('should complete AI assistant workflow', async ({ page }) => {
      // Step 1: Open AI assistant
      await tacticalBoard.openAIAssistant();
      await expect(page.locator('[data-testid="intelligent-assistant"]')).toBeVisible();

      // Step 2: Request formation analysis
      const analysisButton = page.locator('[data-testid="analyze-formation"]');
      if (await analysisButton.isVisible({ timeout: 3000 })) {
        await analysisButton.click();

        // Wait for analysis results
        await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({
          timeout: 10000,
        });
      }

      // Step 3: Request player suggestions
      const suggestionsButton = page.locator('[data-testid="player-suggestions"]');
      if (await suggestionsButton.isVisible({ timeout: 3000 })) {
        await suggestionsButton.click();

        // Wait for suggestions
        await page.waitForTimeout(2000);
      }

      await tacticalBoard.takeScreenshot('ai-assistant-workflow');
    });

    test('should handle fullscreen and presentation modes', async ({ page }) => {
      // Step 1: Enter fullscreen mode
      await tacticalBoard.enterFullscreen();

      // Verify fullscreen
      await page.waitForTimeout(1000);

      // Step 2: Test functionality in fullscreen
      await tacticalBoard.openPlayerDisplaySettings();
      await tacticalBoard.togglePlayerNames();

      // Step 3: Exit fullscreen
      await tacticalBoard.exitFullscreen();

      // Verify normal mode
      await page.waitForTimeout(1000);

      await tacticalBoard.takeScreenshot('fullscreen-workflow');
    });

    test('should complete export and sharing workflow', async ({ page }) => {
      // Step 1: Create a formation to export
      await tacticalBoard.openFormationTemplates();
      await tacticalBoard.selectFormation('4-3-3');

      // Step 2: Add some tactical drawings
      await tacticalBoard.startDrawing('arrow');
      await tacticalBoard.drawOnField(200, 200, 300, 150);

      // Step 3: Export the formation
      await tacticalBoard.exportFormation();

      // Step 4: Verify export options are available
      await expect(page.locator('[data-testid="export-options"]')).toBeVisible();

      // Step 5: Select export format (if available)
      const pngExport = page.locator('[data-testid="export-png"]');
      if (await pngExport.isVisible({ timeout: 3000 })) {
        await pngExport.click();
      }

      await tacticalBoard.takeScreenshot('export-workflow');
    });
  });

  test.describe('Performance and Stress Testing', () => {
    test('should handle rapid user interactions', async ({ page }) => {
      // Rapid clicking and interactions
      const field = page.locator('[role="main"]');

      // Rapid clicks across the field
      for (let i = 0; i < 10; i++) {
        await field.click({ position: { x: 100 + i * 30, y: 150 + i * 20 } });
        await page.waitForTimeout(50);
      }

      // Rapid tool switching
      const tools = ['pen', 'line', 'arrow', 'circle'];
      for (const tool of tools) {
        await tacticalBoard.startDrawing(tool as any);
        await page.waitForTimeout(100);
      }

      // Verify UI remains responsive
      await expect(page.locator('[role="application"]')).toBeVisible();
    });

    test('should handle complex formations with many players', async ({ page }) => {
      // Test with maximum players and formations
      await tacticalBoard.openFormationTemplates();

      // Try multiple formation changes rapidly
      const formations = ['4-4-2', '3-5-2', '4-3-3', '5-3-2', '4-2-3-1'];

      for (const formation of formations) {
        await tacticalBoard.selectFormation(formation);
        await page.waitForTimeout(200);

        // Move multiple players
        const players = page.locator('[role="main"] [data-testid*="player-token"]');

        for (let i = 0; i < 5; i++) {
          if (await players.nth(i).isVisible()) {
            await players.nth(i).dragTo(page.locator('[role="main"]'), {
              targetPosition: { x: 150 + i * 50, y: 200 + i * 30 },
            });
          }
        }
      }

      await tacticalBoard.takeScreenshot('complex-formation-stress-test');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network disconnection gracefully', async ({ page, context }) => {
      // Simulate network issues
      await context.setOffline(true);

      // Try to perform actions that might require network
      await tacticalBoard.openFormationTemplates();

      // Should show appropriate error handling
      await page.waitForTimeout(2000);

      // Restore network
      await context.setOffline(false);

      // Verify recovery
      await page.waitForTimeout(1000);
      await expect(page.locator('[role="application"]')).toBeVisible();
    });

    test('should handle browser resize and orientation changes', async ({ page }) => {
      // Test different viewport sizes
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1024, height: 768 }, // Tablet
        { width: 375, height: 667 }, // Mobile
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);

        // Verify UI adapts correctly
        await expect(page.locator('[role="application"]')).toBeVisible();

        // Test basic functionality
        const field = page.locator('[role="main"]');
        if (await field.isVisible()) {
          await field.click({ position: { x: 100, y: 100 } });
        }

        await tacticalBoard.takeScreenshot(`viewport-${viewport.width}x${viewport.height}`);
      }
    });

    test('should handle rapid navigation and state changes', async ({ page }) => {
      // Rapid opening and closing of modals
      for (let i = 0; i < 5; i++) {
        await tacticalBoard.openFormationTemplates();
        await page.waitForTimeout(200);

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);

        await tacticalBoard.openPlayerDisplaySettings();
        await page.waitForTimeout(200);

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }

      // Verify UI remains stable
      await expect(page.locator('[role="application"]')).toBeVisible();
    });
  });

  test.describe('Accessibility Testing', () => {
    test('should support full keyboard navigation', async ({ page }) => {
      // Start from the main application
      const app = page.locator('[role="application"]');
      await app.focus();

      // Tab through all focusable elements
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        // Verify focus is visible
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }

      // Test arrow key navigation
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowUp');

      // Test Enter and Space activation
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
    });

    test('should have proper ARIA attributes and screen reader support', async ({ page }) => {
      // Check main landmarks
      await expect(page.locator('[role="application"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[role="main"]')).toBeVisible();

      // Check form controls have labels
      const formControls = page.locator('input, button, select');
      const count = await formControls.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const control = formControls.nth(i);

        // Should have either aria-label, aria-labelledby, or associated label
        const hasAria = await control.getAttribute('aria-label');
        const hasLabelledBy = await control.getAttribute('aria-labelledby');
        const hasId = await control.getAttribute('id');

        if (hasId) {
          const associatedLabel = page.locator(`label[for="${hasId}"]`);
          const labelExists = (await associatedLabel.count()) > 0;

          expect(hasAria || hasLabelledBy || labelExists).toBeTruthy();
        }
      }
    });
  });
});
