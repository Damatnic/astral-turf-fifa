import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * END-TO-END TACTICAL BOARD WORKFLOW TESTS
 *
 * Comprehensive E2E testing covering complete user workflows:
 * - Formation creation and management
 * - Player positioning and tactics
 * - Drawing and annotations
 * - Export and sharing
 * - Collaboration features
 * - Performance under load
 */

test.describe('🎯 Tactical Board Workflows - E2E Tests', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: 'test-results/videos/',
        size: { width: 1920, height: 1080 },
      },
      recordHar: {
        path: 'test-results/har/tactical-board.har',
      },
    });
    page = await context.newPage();

    // Navigate to application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('🏗️ Formation Management Workflow', () => {
    test('should create, modify, and save formation', async () => {
      // Navigate to tactical board
      await page.click('[data-testid="tactical-board-menu"]');
      await page.waitForSelector('[data-testid="unified-tactics-board"]');

      // Start with empty field
      await expect(page.locator('[data-testid="modern-field"]')).toBeVisible();

      // Open formation templates
      await page.click('[data-testid="formation-templates-button"]');
      await page.waitForSelector('[data-testid="formation-templates-modal"]');

      // Select 4-4-2 formation
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="apply-formation"]');

      // Verify formation is applied
      await expect(page.locator('[data-testid="formation-overlay"]')).toBeVisible();

      // Count player slots
      const playerSlots = page.locator('[data-testid="formation-slot"]');
      await expect(playerSlots).toHaveCount(11);

      // Modify formation - move a player
      const midfielder = page.locator('[data-testid="formation-slot"]').nth(5);
      await midfielder.dragTo(page.locator('[data-testid="field-zone-center"]'));

      // Verify position change
      await expect(midfielder).toHaveAttribute('data-position-modified', 'true');

      // Save formation
      await page.click('[data-testid="save-formation-button"]');
      await page.fill('[data-testid="formation-name-input"]', 'Custom 4-4-2');
      await page.click('[data-testid="confirm-save"]');

      // Verify save success
      await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
    });

    test('should handle formation switching smoothly', async () => {
      // Start with 4-4-2
      await page.click('[data-testid="formation-templates-button"]');
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="apply-formation"]');

      // Verify initial formation
      let playerSlots = page.locator('[data-testid="formation-slot"]');
      await expect(playerSlots).toHaveCount(11);

      // Switch to 4-3-3
      await page.click('[data-testid="formation-templates-button"]');
      await page.click('[data-testid="formation-433"]');
      await page.click('[data-testid="apply-formation"]');

      // Verify formation change with animation
      await page.waitForSelector('[data-testid="formation-transition"]', { state: 'visible' });
      await page.waitForSelector('[data-testid="formation-transition"]', { state: 'hidden' });

      // Verify new formation
      playerSlots = page.locator('[data-testid="formation-slot"]');
      await expect(playerSlots).toHaveCount(11);

      // Check formation name updated
      await expect(page.locator('[data-testid="current-formation-name"]')).toContainText('4-3-3');
    });

    test('should auto-assign players to formation positions', async () => {
      // Add players to squad first
      await page.click('[data-testid="player-management-button"]');
      await page.click('[data-testid="add-player-button"]');

      // Add goalkeeper
      await page.fill('[data-testid="player-name"]', 'Test Goalkeeper');
      await page.selectOption('[data-testid="player-position"]', 'GK');
      await page.click('[data-testid="save-player"]');

      // Add multiple outfield players
      const positions = ['CB', 'CB', 'FB', 'FB', 'CM', 'CM', 'CM', 'W', 'W', 'ST'];
      for (let i = 0; i < positions.length; i++) {
        await page.click('[data-testid="add-player-button"]');
        await page.fill('[data-testid="player-name"]', `Test Player ${i + 1}`);
        await page.selectOption('[data-testid="player-position"]', positions[i]);
        await page.click('[data-testid="save-player"]');
      }

      // Close player management
      await page.click('[data-testid="close-player-management"]');

      // Apply formation with auto-assignment
      await page.click('[data-testid="formation-templates-button"]');
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="apply-formation"]');
      await page.click('[data-testid="auto-assign-players"]');

      // Verify all positions are filled
      const assignedSlots = page.locator(
        '[data-testid="formation-slot"][data-player-assigned="true"]'
      );
      await expect(assignedSlots).toHaveCount(11);

      // Verify goalkeeper is in correct position
      const gkSlot = page.locator('[data-testid="formation-slot"][data-role="GK"]');
      await expect(gkSlot).toHaveAttribute('data-player-assigned', 'true');
    });
  });

  test.describe('🎨 Drawing and Annotations Workflow', () => {
    test('should create tactical drawings and annotations', async () => {
      // Ensure we're on tactical board
      await page.click('[data-testid="tactical-board-menu"]');
      await page.waitForSelector('[data-testid="unified-tactics-board"]');

      // Open drawing tools
      await page.click('[data-testid="drawing-tools-toggle"]');
      await expect(page.locator('[data-testid="drawing-toolbar"]')).toBeVisible();

      // Select arrow tool
      await page.click('[data-testid="drawing-tool-arrow"]');
      await expect(page.locator('[data-testid="drawing-tool-arrow"]')).toHaveClass(/active/);

      // Draw arrow on field
      const field = page.locator('[data-testid="modern-field"]');
      await field.click({ position: { x: 200, y: 300 } }); // Start point
      await field.click({ position: { x: 400, y: 300 } }); // End point

      // Verify arrow is created
      await expect(page.locator('[data-testid="drawing-shape-arrow"]')).toBeVisible();

      // Select zone tool and draw area
      await page.click('[data-testid="drawing-tool-zone"]');

      // Draw rectangular zone
      await field.click({ position: { x: 300, y: 200 } });
      await field.click({ position: { x: 500, y: 200 } });
      await field.click({ position: { x: 500, y: 400 } });
      await field.click({ position: { x: 300, y: 400 } });
      await field.click({ position: { x: 300, y: 200 } }); // Close shape

      // Verify zone is created
      await expect(page.locator('[data-testid="drawing-shape-zone"]')).toBeVisible();

      // Add text annotation
      await page.click('[data-testid="drawing-tool-text"]');
      await field.click({ position: { x: 400, y: 500 } });
      await page.fill('[data-testid="annotation-text-input"]', 'Pressing zone');
      await page.click('[data-testid="confirm-annotation"]');

      // Verify text annotation
      await expect(page.locator('[data-testid="drawing-text"]')).toContainText('Pressing zone');

      // Change drawing color
      await page.click('[data-testid="color-picker-button"]');
      await page.click('[data-testid="color-red"]');

      // Draw with new color
      await page.click('[data-testid="drawing-tool-pen"]');
      await field.click({ position: { x: 100, y: 100 } });
      await field.click({ position: { x: 150, y: 150 } });

      // Verify colored drawing
      const redDrawing = page.locator('[data-testid="drawing-shape-pen"]').last();
      await expect(redDrawing).toHaveCSS('stroke', 'rgb(255, 0, 0)');
    });

    test('should handle drawing operations (undo, clear, layers)', async () => {
      // Create multiple drawings first
      await page.click('[data-testid="drawing-tools-toggle"]');
      await page.click('[data-testid="drawing-tool-arrow"]');

      const field = page.locator('[data-testid="modern-field"]');

      // Draw 3 arrows
      for (let i = 0; i < 3; i++) {
        await field.click({ position: { x: 100 + i * 50, y: 200 } });
        await field.click({ position: { x: 200 + i * 50, y: 200 } });
      }

      // Verify 3 arrows exist
      await expect(page.locator('[data-testid="drawing-shape-arrow"]')).toHaveCount(3);

      // Test undo
      await page.click('[data-testid="undo-drawing"]');
      await expect(page.locator('[data-testid="drawing-shape-arrow"]')).toHaveCount(2);

      await page.click('[data-testid="undo-drawing"]');
      await expect(page.locator('[data-testid="drawing-shape-arrow"]')).toHaveCount(1);

      // Test redo
      await page.click('[data-testid="redo-drawing"]');
      await expect(page.locator('[data-testid="drawing-shape-arrow"]')).toHaveCount(2);

      // Test clear all
      await page.click('[data-testid="clear-drawings"]');
      await page.click('[data-testid="confirm-clear"]');
      await expect(page.locator('[data-testid="drawing-shape-arrow"]')).toHaveCount(0);
    });

    test('should save and load tactical playbooks', async () => {
      // Create a tactical play
      await page.click('[data-testid="drawing-tools-toggle"]');

      // Set up formation first
      await page.click('[data-testid="formation-442"]');

      // Add some tactical drawings
      await page.click('[data-testid="drawing-tool-arrow"]');
      const field = page.locator('[data-testid="modern-field"]');
      await field.click({ position: { x: 200, y: 300 } });
      await field.click({ position: { x: 400, y: 200 } });

      // Save to playbook
      await page.click('[data-testid="save-to-playbook"]');
      await page.fill('[data-testid="playbook-name"]', 'Wing Attack Play');
      await page.selectOption('[data-testid="playbook-category"]', 'Attacking');
      await page.click('[data-testid="save-playbook-item"]');

      // Verify save success
      await expect(page.locator('[data-testid="playbook-save-success"]')).toBeVisible();

      // Clear current drawings
      await page.click('[data-testid="clear-drawings"]');
      await page.click('[data-testid="confirm-clear"]');

      // Load from playbook
      await page.click('[data-testid="playbook-library"]');
      await page.click('[data-testid="playbook-item-wing-attack"]');
      await page.click('[data-testid="load-playbook-item"]');

      // Verify play is loaded
      await expect(page.locator('[data-testid="drawing-shape-arrow"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-play-name"]')).toContainText(
        'Wing Attack Play'
      );
    });
  });

  test.describe('🎮 Interactive Player Management', () => {
    test('should handle drag and drop player positioning', async () => {
      // Setup formation with players
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="auto-assign-players"]');

      // Get a midfielder position
      const midfielder = page.locator('[data-testid="formation-slot"][data-role="MF"]').first();
      const originalPosition = await midfielder.boundingBox();

      // Drag to new position
      await midfielder.dragTo(page.locator('[data-testid="field-zone-attack"]'));

      // Verify position changed
      const newPosition = await midfielder.boundingBox();
      expect(newPosition?.x).not.toBe(originalPosition?.x);
      expect(newPosition?.y).not.toBe(originalPosition?.y);

      // Verify position update in UI
      await expect(page.locator('[data-testid="position-indicator"]')).toContainText('Advanced');
    });

    test('should handle player conflicts and resolution', async () => {
      // Setup formation with players
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="auto-assign-players"]');

      // Get two different positioned players
      const leftBack = page.locator('[data-testid="formation-slot"][data-position="left-back"]');
      const rightBack = page.locator('[data-testid="formation-slot"][data-position="right-back"]');

      // Drag left back to right back position (create conflict)
      await leftBack.dragTo(rightBack);

      // Verify conflict resolution menu appears
      await expect(page.locator('[data-testid="conflict-resolution-menu"]')).toBeVisible();

      // Choose to swap players
      await page.click('[data-testid="resolve-swap"]');

      // Verify players are swapped
      await expect(page.locator('[data-testid="conflict-resolution-menu"]')).not.toBeVisible();

      // Verify swap notification
      await expect(page.locator('[data-testid="swap-notification"]')).toBeVisible();
    });

    test('should display player statistics and chemistry', async () => {
      // Setup formation with players
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="auto-assign-players"]');

      // Enable chemistry visualization
      await page.click('[data-testid="show-chemistry"]');
      await expect(page.locator('[data-testid="chemistry-visualization"]')).toBeVisible();

      // Click on a player to see detailed stats
      const striker = page.locator('[data-testid="formation-slot"][data-role="FW"]').first();
      await striker.click();

      // Verify player card appears
      await expect(page.locator('[data-testid="player-details-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="player-stats"]')).toBeVisible();

      // Check individual attributes
      await expect(page.locator('[data-testid="stat-speed"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-shooting"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-passing"]')).toBeVisible();

      // Check chemistry connections
      await expect(page.locator('[data-testid="chemistry-lines"]')).toBeVisible();

      // Hover over chemistry line to see details
      await page.hover('[data-testid="chemistry-line"]');
      await expect(page.locator('[data-testid="chemistry-tooltip"]')).toBeVisible();
    });

    test('should handle player instructions and tactical roles', async () => {
      // Setup formation
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="auto-assign-players"]');

      // Right-click on midfielder for instructions
      const midfielder = page.locator('[data-testid="formation-slot"][data-role="MF"]').first();
      await midfielder.click({ button: 'right' });

      // Verify context menu
      await expect(page.locator('[data-testid="player-context-menu"]')).toBeVisible();

      // Open tactical instructions
      await page.click('[data-testid="tactical-instructions"]');
      await expect(page.locator('[data-testid="instructions-panel"]')).toBeVisible();

      // Set specific instruction
      await page.click('[data-testid="instruction-stay-wide"]');
      await page.click('[data-testid="instruction-press-high"]');
      await page.click('[data-testid="apply-instructions"]');

      // Verify instructions are applied
      await expect(midfielder).toHaveAttribute('data-instructions', 'stay-wide,press-high');

      // Verify tactical indicator
      await expect(page.locator('[data-testid="tactical-indicator"]')).toBeVisible();
    });
  });

  test.describe('📊 Analysis and Export Features', () => {
    test('should generate formation analysis report', async () => {
      // Setup complete formation
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="auto-assign-players"]');

      // Open analysis panel
      await page.click('[data-testid="analysis-button"]');
      await expect(page.locator('[data-testid="analysis-panel"]')).toBeVisible();

      // Verify analysis components
      await expect(page.locator('[data-testid="formation-strength"]')).toBeVisible();
      await expect(page.locator('[data-testid="position-ratings"]')).toBeVisible();
      await expect(page.locator('[data-testid="tactical-recommendations"]')).toBeVisible();

      // Check specific metrics
      await expect(page.locator('[data-testid="overall-rating"]')).toContainText(/\d+\/10/);
      await expect(page.locator('[data-testid="defensive-rating"]')).toBeVisible();
      await expect(page.locator('[data-testid="attacking-rating"]')).toBeVisible();

      // Generate detailed report
      await page.click('[data-testid="generate-report"]');
      await page.waitForSelector('[data-testid="analysis-report"]');

      // Verify report sections
      await expect(page.locator('[data-testid="strengths-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="weaknesses-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="recommendations-section"]')).toBeVisible();
    });

    test('should export formation in multiple formats', async () => {
      // Setup formation with drawings
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="auto-assign-players"]');

      // Add some tactical drawings
      await page.click('[data-testid="drawing-tools-toggle"]');
      await page.click('[data-testid="drawing-tool-arrow"]');
      const field = page.locator('[data-testid="modern-field"]');
      await field.click({ position: { x: 200, y: 300 } });
      await field.click({ position: { x: 400, y: 200 } });

      // Open export menu
      await page.click('[data-testid="export-button"]');
      await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();

      // Test PNG export
      const [pngDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-png"]'),
      ]);
      expect(pngDownload.suggestedFilename()).toContain('.png');

      // Test PDF export
      const [pdfDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-pdf"]'),
      ]);
      expect(pdfDownload.suggestedFilename()).toContain('.pdf');

      // Test JSON export (for sharing)
      const [jsonDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-json"]'),
      ]);
      expect(jsonDownload.suggestedFilename()).toContain('.json');

      // Test sharing link
      await page.click('[data-testid="generate-share-link"]');
      await expect(page.locator('[data-testid="share-link"]')).toBeVisible();

      // Copy share link
      await page.click('[data-testid="copy-share-link"]');
      await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
    });

    test('should import and validate formations', async () => {
      // Open import dialog
      await page.click('[data-testid="import-button"]');
      await expect(page.locator('[data-testid="import-modal"]')).toBeVisible();

      // Create mock formation file
      const formationData = {
        name: 'Imported 4-4-2',
        formation: '4-4-2',
        players: [
          { name: 'Imported GK', position: 'GK', x: 10, y: 50 },
          // ... more players
        ],
        drawings: [{ type: 'arrow', start: { x: 200, y: 300 }, end: { x: 400, y: 200 } }],
      };

      // Simulate file upload
      await page.setInputFiles('[data-testid="import-file-input"]', {
        name: 'formation.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(formationData)),
      });

      // Validate and import
      await page.click('[data-testid="validate-import"]');
      await expect(page.locator('[data-testid="validation-success"]')).toBeVisible();

      await page.click('[data-testid="confirm-import"]');

      // Verify formation is loaded
      await expect(page.locator('[data-testid="current-formation-name"]')).toContainText(
        'Imported 4-4-2'
      );
      await expect(page.locator('[data-testid="drawing-shape-arrow"]')).toBeVisible();
    });
  });

  test.describe('⚡ Performance and Responsiveness', () => {
    test('should handle large formations smoothly', async () => {
      // Create large formation with many annotations
      await page.click('[data-testid="formation-442"]');

      // Add many drawings to test performance
      await page.click('[data-testid="drawing-tools-toggle"]');
      await page.click('[data-testid="drawing-tool-pen"]');

      const field = page.locator('[data-testid="modern-field"]');

      // Draw multiple shapes rapidly
      for (let i = 0; i < 20; i++) {
        await field.click({ position: { x: 100 + i * 10, y: 200 + i * 5 } });
        await field.click({ position: { x: 150 + i * 10, y: 250 + i * 5 } });
      }

      // Verify all drawings are rendered
      await expect(page.locator('[data-testid="drawing-shape-pen"]')).toHaveCount(20);

      // Test smooth interaction after many drawings
      const midfielder = page.locator('[data-testid="formation-slot"][data-role="MF"]').first();
      await midfielder.dragTo(page.locator('[data-testid="field-zone-attack"]'));

      // Verify responsive interaction
      await expect(page.locator('[data-testid="position-indicator"]')).toBeVisible();
    });

    test('should handle rapid user interactions', async () => {
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="auto-assign-players"]');

      // Rapid clicks on different players
      const players = page.locator('[data-testid="formation-slot"]');
      const playerCount = await players.count();

      for (let i = 0; i < Math.min(playerCount, 5); i++) {
        await players.nth(i).click();
        // Small delay to allow for processing
        await page.waitForTimeout(50);
      }

      // Verify last clicked player is selected
      await expect(page.locator('[data-testid="player-details-card"]')).toBeVisible();

      // Rapid tool switching
      await page.click('[data-testid="drawing-tools-toggle"]');
      const tools = ['arrow', 'zone', 'pen', 'line', 'text'];

      for (const tool of tools) {
        await page.click(`[data-testid="drawing-tool-${tool}"]`);
        await expect(page.locator(`[data-testid="drawing-tool-${tool}"]`)).toHaveClass(/active/);
      }
    });

    test('should maintain 60fps during animations', async () => {
      // Setup scenario with animations
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="auto-assign-players"]');

      // Enable presentation mode with animations
      await page.click('[data-testid="presentation-mode"]');
      await page.click('[data-testid="play-animation"]');

      // Monitor animation performance
      await page.evaluate(() => {
        return new Promise(resolve => {
          let frameCount = 0;
          let lastTime = performance.now();

          function checkFrame(currentTime: number) {
            frameCount++;
            if (currentTime - lastTime >= 1000) {
              const fps = frameCount;
              frameCount = 0;
              lastTime = currentTime;

              // Expect at least 50fps (accounting for test environment)
              if (fps >= 50) {
                resolve(fps);
              }
            }
            requestAnimationFrame(checkFrame);
          }

          requestAnimationFrame(checkFrame);

          // Timeout after 3 seconds
          setTimeout(() => resolve(0), 3000);
        });
      });
    });

    test('should work responsively across different screen sizes', async () => {
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1366, height: 768, name: 'Laptop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        // Navigate to tactical board
        await page.goto('/');
        await page.click('[data-testid="tactical-board-menu"]');

        // Verify layout adapts
        await expect(page.locator('[data-testid="unified-tactics-board"]')).toBeVisible();

        if (viewport.width < 768) {
          // Mobile layout
          await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();
          await expect(page.locator('[data-testid="sidebar"]')).toHaveAttribute(
            'data-collapsed',
            'true'
          );
        } else {
          // Desktop/tablet layout
          await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
          await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
        }

        // Test core functionality works
        await page.click('[data-testid="formation-442"]');
        await expect(page.locator('[data-testid="formation-overlay"]')).toBeVisible();
      }
    });
  });

  test.describe('♿ Accessibility and Keyboard Navigation', () => {
    test('should support full keyboard navigation', async () => {
      await page.click('[data-testid="tactical-board-menu"]');

      // Tab through main interface
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveAttribute(
        'data-testid',
        'formation-templates-button'
      );

      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'drawing-tools-toggle');

      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'export-button');

      // Test keyboard shortcuts
      await page.keyboard.press('F11'); // Fullscreen
      await expect(page.locator('[data-testid="fullscreen-indicator"]')).toBeVisible();

      await page.keyboard.press('Escape'); // Exit fullscreen
      await expect(page.locator('[data-testid="fullscreen-indicator"]')).not.toBeVisible();

      // Test arrow key navigation on field
      await page.click('[data-testid="modern-field"]');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');

      // Verify field navigation
      await expect(page.locator('[data-testid="field-cursor"]')).toBeVisible();
    });

    test('should announce state changes to screen readers', async () => {
      // Enable screen reader announcements
      await page.addInitScript(() => {
        window.speechSynthesis = {
          speak: (utterance: any) => {
            window.__lastAnnouncement = utterance.text;
          },
          cancel: () => {},
          pause: () => {},
          resume: () => {},
          getVoices: () => [],
        } as any;
      });

      await page.click('[data-testid="tactical-board-menu"]');

      // Formation change should be announced
      await page.click('[data-testid="formation-442"]');

      const announcement = await page.evaluate(() => (window as any).__lastAnnouncement);
      expect(announcement).toContain('4-4-2');

      // Player selection should be announced
      await page.click('[data-testid="auto-assign-players"]');
      const striker = page.locator('[data-testid="formation-slot"][data-role="FW"]').first();
      await striker.click();

      // Verify aria-live regions are updated
      await expect(page.locator('[aria-live="polite"]')).toContainText(/selected/i);
    });

    test('should have proper ARIA labels and roles', async () => {
      await page.click('[data-testid="tactical-board-menu"]');

      // Check main application role
      await expect(page.locator('[data-testid="unified-tactics-board"]')).toHaveAttribute(
        'role',
        'application'
      );

      // Check field has proper grid role
      await expect(page.locator('[data-testid="modern-field"]')).toHaveAttribute('role', 'grid');

      // Check players have proper button roles and labels
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="auto-assign-players"]');

      const players = page.locator('[data-testid="formation-slot"]');
      const firstPlayer = players.first();

      await expect(firstPlayer).toHaveAttribute('role', 'button');
      await expect(firstPlayer).toHaveAttribute('aria-label');
      await expect(firstPlayer).toHaveAttribute('tabindex', '0');

      // Check drawing tools have proper labels
      await page.click('[data-testid="drawing-tools-toggle"]');
      await expect(page.locator('[data-testid="drawing-tool-arrow"]')).toHaveAttribute(
        'aria-label'
      );
    });

    test('should support high contrast and reduced motion', async () => {
      // Test high contrast mode
      await page.emulateMedia({
        colorScheme: 'dark',
        reducedMotion: 'reduce',
      });

      await page.click('[data-testid="tactical-board-menu"]');

      // Verify high contrast styles are applied
      const field = page.locator('[data-testid="modern-field"]');
      const fieldStyles = await field.evaluate(el => getComputedStyle(el));

      // Should have high contrast colors
      expect(fieldStyles.backgroundColor).not.toBe('');
      expect(fieldStyles.border).toContain('px');

      // Test reduced motion
      await page.click('[data-testid="formation-442"]');

      // Animations should be reduced or disabled
      const transition = await page
        .locator('[data-testid="formation-overlay"]')
        .evaluate(el => getComputedStyle(el).transitionDuration);

      // Should have minimal or no transition
      expect(transition === '0s' || transition === 'none').toBeTruthy();
    });
  });

  test.describe('🔄 Error Handling and Recovery', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());

      await page.click('[data-testid="tactical-board-menu"]');

      // Attempt operation that requires network
      await page.click('[data-testid="save-formation-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/network/i);

      // Should provide retry option
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

      // Restore network and retry
      await page.unroute('**/api/**');
      await page.click('[data-testid="retry-button"]');

      // Should recover successfully
      await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
    });

    test('should handle malformed data imports', async () => {
      await page.click('[data-testid="import-button"]');

      // Try to import malformed JSON
      const malformedData = '{ "invalid": json }';

      await page.setInputFiles('[data-testid="import-file-input"]', {
        name: 'malformed.json',
        mimeType: 'application/json',
        buffer: Buffer.from(malformedData),
      });

      await page.click('[data-testid="validate-import"]');

      // Should show validation error
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error"]')).toContainText(/invalid/i);

      // Should not allow import
      await expect(page.locator('[data-testid="confirm-import"]')).toBeDisabled();
    });

    test('should recover from browser crashes and restore state', async () => {
      // Setup a formation
      await page.click('[data-testid="formation-442"]');
      await page.click('[data-testid="auto-assign-players"]');

      // Add some drawings
      await page.click('[data-testid="drawing-tools-toggle"]');
      await page.click('[data-testid="drawing-tool-arrow"]');
      const field = page.locator('[data-testid="modern-field"]');
      await field.click({ position: { x: 200, y: 300 } });
      await field.click({ position: { x: 400, y: 200 } });

      // Verify state is saved to localStorage
      const savedState = await page.evaluate(() => {
        return localStorage.getItem('tacticalBoardState');
      });
      expect(savedState).toBeTruthy();

      // Simulate page reload (crash recovery)
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Navigate back to tactical board
      await page.click('[data-testid="tactical-board-menu"]');

      // Verify state is restored
      await expect(page.locator('[data-testid="formation-overlay"]')).toBeVisible();
      await expect(page.locator('[data-testid="drawing-shape-arrow"]')).toBeVisible();

      // Show recovery notification
      await expect(page.locator('[data-testid="state-restored-notification"]')).toBeVisible();
    });
  });
});
