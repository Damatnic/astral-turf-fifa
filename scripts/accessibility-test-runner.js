#!/usr/bin/env node

/**
 * Comprehensive Accessibility Test Runner
 * Advanced accessibility testing with multiple tools and standards
 */

import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Accessibility test configuration
const A11Y_CONFIG = {
  baseUrl: 'http://localhost:3000',
  outputDir: path.resolve(__dirname, '../accessibility-reports'),
  
  // WCAG compliance levels
  standards: {
    wcag20: ['wcag2a', 'wcag2aa'],
    wcag21: ['wcag21a', 'wcag21aa'],
    wcag22: ['wcag22a', 'wcag22aa'],
    bestPractices: ['best-practice']
  },
  
  // Test scenarios
  scenarios: [
    {
      name: 'Tactical Board - Default View',
      path: '/',
      interactions: [],
      priority: 'critical'
    },
    {
      name: 'Tactical Board - Formation Selection',
      path: '/',
      interactions: [
        { action: 'click', selector: '[data-testid="formation-selector"]' },
        { action: 'wait', duration: 1000 }
      ],
      priority: 'high'
    },
    {
      name: 'Tactical Board - Drawing Mode',
      path: '/',
      interactions: [
        { action: 'click', selector: '[data-testid="drawing-tools-toggle"]' },
        { action: 'wait', duration: 500 }
      ],
      priority: 'high'
    },
    {
      name: 'Tactical Board - Player Selection',
      path: '/',
      interactions: [
        { action: 'click', selector: '[data-testid="player-token"]:first-child' },
        { action: 'wait', duration: 500 }
      ],
      priority: 'medium'
    }
  ],
  
  // Violation severity thresholds
  thresholds: {
    critical: 0,    // No critical violations allowed
    serious: 2,     // Max 2 serious violations
    moderate: 5,    // Max 5 moderate violations
    minor: 10       // Max 10 minor violations
  }
};

class AccessibilityTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.summary = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      violations: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      }
    };
  }

  async initialize() {
    console.log('🚀 Initializing accessibility test runner...\n');
    
    // Ensure output directory exists
    await fs.mkdir(A11Y_CONFIG.outputDir, { recursive: true });
    
    // Launch browser
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-networking',
        '--disable-sync',
        '--metrics-recording-only',
        '--disable-default-apps',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-timer-throttling',
        '--force-prefers-reduced-motion'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Inject axe-core
    await this.page.addInitScript(`
      // Inject axe-core
      const axeScript = document.createElement('script');
      axeScript.src = 'https://unpkg.com/axe-core@4.8.2/axe.min.js';
      document.head.appendChild(axeScript);
    `);
  }

  async runAllTests() {
    console.log('♿ Starting comprehensive accessibility testing...\n');
    
    for (const scenario of A11Y_CONFIG.scenarios) {
      await this.runScenarioTest(scenario);
    }
    
    await this.generateReports();
    this.outputSummary();
    
    return this.summary.failed === 0;
  }

  async runScenarioTest(scenario) {
    console.log(`🧪 Testing: ${scenario.name}`);
    
    try {
      // Navigate to the page
      await this.page.goto(`${A11Y_CONFIG.baseUrl}${scenario.path}`, {
        waitUntil: 'networkidle'
      });
      
      // Wait for the page to be fully loaded
      await this.page.waitForTimeout(2000);
      
      // Perform interactions
      for (const interaction of scenario.interactions) {
        await this.performInteraction(interaction);
      }
      
      // Wait for axe-core to be available
      await this.page.waitForFunction(() => typeof window.axe !== 'undefined', {
        timeout: 10000
      });
      
      // Configure axe for this test
      await this.page.evaluate(() => {
        window.axe.configure({
          rules: {
            // Enable all rules
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'focus-management': { enabled: true },
            'aria-attributes': { enabled: true },
            'landmarks': { enabled: true }
          }
        });
      });
      
      // Run accessibility tests for each standard
      const scenarioResults = {
        scenario: scenario.name,
        priority: scenario.priority,
        tests: [],
        violations: [],
        passed: false
      };
      
      for (const [standardName, tags] of Object.entries(A11Y_CONFIG.standards)) {
        const testResult = await this.runAxeTest(standardName, tags);
        scenarioResults.tests.push(testResult);
        scenarioResults.violations.push(...testResult.violations);
      }
      
      // Additional custom tests
      await this.runKeyboardNavigationTest(scenarioResults);
      await this.runScreenReaderTest(scenarioResults);
      await this.runColorContrastTest(scenarioResults);
      
      // Determine if scenario passed
      scenarioResults.passed = this.evaluateScenarioResults(scenarioResults);
      
      this.results.push(scenarioResults);
      this.updateSummary(scenarioResults);
      
      console.log(`  ${scenarioResults.passed ? '✅' : '❌'} ${scenario.name}`);
      
    } catch (error) {
      console.error(`  ❌ Error testing ${scenario.name}:`, error.message);
      this.summary.failed++;
    }
  }

  async performInteraction(interaction) {
    switch (interaction.action) {
      case 'click':
        await this.page.click(interaction.selector);
        break;
      case 'type':
        await this.page.type(interaction.selector, interaction.text);
        break;
      case 'keydown':
        await this.page.keyboard.down(interaction.key);
        break;
      case 'keyup':
        await this.page.keyboard.up(interaction.key);
        break;
      case 'wait':
        await this.page.waitForTimeout(interaction.duration);
        break;
      case 'waitForSelector':
        await this.page.waitForSelector(interaction.selector);
        break;
    }
  }

  async runAxeTest(standardName, tags) {
    const result = await this.page.evaluate(async (testTags) => {
      try {
        const results = await window.axe.run({
          tags: testTags,
          resultTypes: ['violations', 'incomplete', 'passes']
        });
        return results;
      } catch (error) {
        return { error: error.message };
      }
    }, tags);
    
    if (result.error) {
      throw new Error(`Axe test failed: ${result.error}`);
    }
    
    return {
      standard: standardName,
      tags,
      violations: result.violations || [],
      incomplete: result.incomplete || [],
      passes: result.passes || []
    };
  }

  async runKeyboardNavigationTest(scenarioResults) {
    console.log('    🎹 Testing keyboard navigation...');
    
    try {
      // Reset focus
      await this.page.evaluate(() => {
        document.body.focus();
      });
      
      // Test Tab navigation
      const focusableElements = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ));
        return elements.length;
      });
      
      let tabIndex = 0;
      const maxTabs = Math.min(focusableElements, 20); // Limit to prevent infinite loops
      
      while (tabIndex < maxTabs) {
        await this.page.keyboard.press('Tab');
        tabIndex++;
        
        // Check if focus is visible
        const focusVisible = await this.page.evaluate(() => {
          const activeElement = document.activeElement;
          if (!activeElement || activeElement === document.body) return false;
          
          const styles = window.getComputedStyle(activeElement);
          return styles.outline !== 'none' || 
                 styles.border !== 'none' || 
                 activeElement.hasAttribute('data-focus-visible');
        });
        
        if (!focusVisible && tabIndex > 1) {
          scenarioResults.violations.push({
            id: 'keyboard-focus-visible',
            impact: 'serious',
            description: 'Focused element does not have visible focus indicator',
            help: 'All interactive elements must have visible focus indicators',
            nodes: [{ target: ['document'] }]
          });
        }
      }
      
      // Test Escape key handling
      await this.page.keyboard.press('Escape');
      
      // Test Arrow key navigation for custom components
      const tacticalBoard = await this.page.$('[data-testid="tactical-board"]');
      if (tacticalBoard) {
        await tacticalBoard.focus();
        await this.page.keyboard.press('ArrowUp');
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('ArrowLeft');
        await this.page.keyboard.press('ArrowRight');
      }
      
    } catch (error) {
      console.warn('    ⚠️ Keyboard navigation test failed:', error.message);
    }
  }

  async runScreenReaderTest(scenarioResults) {
    console.log('    🔊 Testing screen reader compatibility...');
    
    try {
      // Check for proper heading structure
      const headings = await this.page.evaluate(() => {
        const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return headingElements.map(h => ({
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent?.trim(),
          hasContent: !!h.textContent?.trim()
        }));
      });
      
      // Validate heading hierarchy
      for (let i = 1; i < headings.length; i++) {
        const current = headings[i];
        const previous = headings[i - 1];
        
        if (current.level > previous.level + 1) {
          scenarioResults.violations.push({
            id: 'heading-hierarchy',
            impact: 'moderate',
            description: 'Heading levels should not skip levels',
            help: 'Ensure proper heading hierarchy for screen readers'
          });
        }
        
        if (!current.hasContent) {
          scenarioResults.violations.push({
            id: 'empty-heading',
            impact: 'serious',
            description: 'Heading element is empty',
            help: 'All heading elements must contain descriptive text'
          });
        }
      }
      
      // Check for alt text on images
      const imagesWithoutAlt = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.filter(img => !img.alt && !img.hasAttribute('aria-label')).length;
      });
      
      if (imagesWithoutAlt > 0) {
        scenarioResults.violations.push({
          id: 'missing-alt-text',
          impact: 'serious',
          description: `${imagesWithoutAlt} images missing alt text`,
          help: 'All informative images must have alternative text'
        });
      }
      
      // Check for proper landmarks
      const landmarks = await this.page.evaluate(() => {
        return {
          main: document.querySelectorAll('main, [role="main"]').length,
          navigation: document.querySelectorAll('nav, [role="navigation"]').length,
          banner: document.querySelectorAll('header, [role="banner"]').length,
          contentinfo: document.querySelectorAll('footer, [role="contentinfo"]').length
        };
      });
      
      if (landmarks.main === 0) {
        scenarioResults.violations.push({
          id: 'missing-main-landmark',
          impact: 'moderate',
          description: 'Page is missing main landmark',
          help: 'Every page should have exactly one main landmark'
        });
      }
      
    } catch (error) {
      console.warn('    ⚠️ Screen reader test failed:', error.message);
    }
  }

  async runColorContrastTest(scenarioResults) {
    console.log('    🎨 Testing color contrast...');
    
    try {
      // This would ideally use a color contrast library
      // For now, we'll do basic checks
      const contrastIssues = await this.page.evaluate(() => {
        const textElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.trim();
          return text && text.length > 0 && 
                 window.getComputedStyle(el).display !== 'none';
        });
        
        const issues = [];
        
        textElements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          // Basic check for transparent or very light backgrounds
          if (backgroundColor === 'rgba(0, 0, 0, 0)' || 
              backgroundColor === 'transparent' ||
              backgroundColor === 'white' || 
              backgroundColor === '#ffffff') {
            
            if (color === 'white' || color === '#ffffff' || 
                color.includes('rgba(255, 255, 255')) {
              issues.push({
                element: el.tagName.toLowerCase(),
                issue: 'Potential low contrast: white text on white/transparent background'
              });
            }
          }
        });
        
        return issues;
      });
      
      contrastIssues.forEach(issue => {
        scenarioResults.violations.push({
          id: 'color-contrast-low',
          impact: 'serious',
          description: issue.issue,
          help: 'Ensure sufficient color contrast between text and background'
        });
      });
      
    } catch (error) {
      console.warn('    ⚠️ Color contrast test failed:', error.message);
    }
  }

  evaluateScenarioResults(scenarioResults) {
    const violationCounts = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    };
    
    scenarioResults.violations.forEach(violation => {
      const impact = violation.impact || 'minor';
      violationCounts[impact]++;
    });
    
    // Check against thresholds
    return violationCounts.critical <= A11Y_CONFIG.thresholds.critical &&
           violationCounts.serious <= A11Y_CONFIG.thresholds.serious &&
           violationCounts.moderate <= A11Y_CONFIG.thresholds.moderate &&
           violationCounts.minor <= A11Y_CONFIG.thresholds.minor;
  }

  updateSummary(scenarioResults) {
    this.summary.totalTests++;
    
    if (scenarioResults.passed) {
      this.summary.passed++;
    } else {
      this.summary.failed++;
    }
    
    scenarioResults.violations.forEach(violation => {
      const impact = violation.impact || 'minor';
      this.summary.violations[impact]++;
    });
  }

  async generateReports() {
    console.log('\n📊 Generating accessibility reports...');
    
    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary: this.summary,
      config: A11Y_CONFIG,
      results: this.results
    };
    
    await fs.writeFile(
      path.join(A11Y_CONFIG.outputDir, 'accessibility-report.json'),
      JSON.stringify(jsonReport, null, 2)
    );
    
    // Generate HTML report
    await this.generateHtmlReport(jsonReport);
    
    // Generate markdown summary
    await this.generateMarkdownSummary(jsonReport);
    
    console.log(`📁 Reports generated in: ${A11Y_CONFIG.outputDir}`);
  }

  async generateHtmlReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .passed { border-left: 4px solid #4CAF50; }
        .failed { border-left: 4px solid #f44336; }
        .violation { margin: 10px 0; padding: 10px; border-left: 3px solid #ff9800; background: #fff3e0; }
        .critical { border-left-color: #d32f2f; background: #ffebee; }
        .serious { border-left-color: #f57c00; background: #fff3e0; }
        .moderate { border-left-color: #fbc02d; background: #fffde7; }
        .minor { border-left-color: #689f38; background: #f1f8e9; }
    </style>
</head>
<body>
    <div class="header">
        <h1>♿ Accessibility Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Overall Status: ${report.summary.failed === 0 ? '✅ PASSED' : '❌ FAILED'}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.summary.totalTests}</div>
        </div>
        <div class="metric passed">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #4CAF50;">${report.summary.passed}</div>
        </div>
        <div class="metric failed">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #f44336;">${report.summary.failed}</div>
        </div>
    </div>
    
    <h2>Violation Summary</h2>
    <div class="summary">
        <div class="metric critical">
            <h3>Critical</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.summary.violations.critical}</div>
        </div>
        <div class="metric serious">
            <h3>Serious</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.summary.violations.serious}</div>
        </div>
        <div class="metric moderate">
            <h3>Moderate</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.summary.violations.moderate}</div>
        </div>
        <div class="metric minor">
            <h3>Minor</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.summary.violations.minor}</div>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${report.results.map(result => `
        <div class="scenario ${result.passed ? 'passed' : 'failed'}">
            <h3>${result.scenario} ${result.passed ? '✅' : '❌'}</h3>
            <p>Priority: ${result.priority}</p>
            
            ${result.violations.length > 0 ? `
                <h4>Violations (${result.violations.length})</h4>
                ${result.violations.map(v => `
                    <div class="violation ${v.impact}">
                        <strong>${v.id}</strong> (${v.impact})<br>
                        ${v.description}<br>
                        <em>${v.help}</em>
                    </div>
                `).join('')}
            ` : '<p>✅ No violations found</p>'}
        </div>
    `).join('')}
</body>
</html>`;
    
    await fs.writeFile(
      path.join(A11Y_CONFIG.outputDir, 'accessibility-report.html'),
      html
    );
  }

  async generateMarkdownSummary(report) {
    const markdown = `
# ♿ Accessibility Test Summary

**Generated:** ${report.timestamp}
**Overall Status:** ${report.summary.failed === 0 ? '✅ PASSED' : '❌ FAILED'}

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | ${report.summary.totalTests} |
| Passed | ${report.summary.passed} |
| Failed | ${report.summary.failed} |

## Violations by Severity

| Severity | Count | Threshold | Status |
|----------|-------|-----------|---------|
| Critical | ${report.summary.violations.critical} | ${A11Y_CONFIG.thresholds.critical} | ${report.summary.violations.critical <= A11Y_CONFIG.thresholds.critical ? '✅' : '❌'} |
| Serious | ${report.summary.violations.serious} | ${A11Y_CONFIG.thresholds.serious} | ${report.summary.violations.serious <= A11Y_CONFIG.thresholds.serious ? '✅' : '❌'} |
| Moderate | ${report.summary.violations.moderate} | ${A11Y_CONFIG.thresholds.moderate} | ${report.summary.violations.moderate <= A11Y_CONFIG.thresholds.moderate ? '✅' : '❌'} |
| Minor | ${report.summary.violations.minor} | ${A11Y_CONFIG.thresholds.minor} | ${report.summary.violations.minor <= A11Y_CONFIG.thresholds.minor ? '✅' : '❌'} |

## Test Results

${report.results.map(result => `
### ${result.scenario} ${result.passed ? '✅' : '❌'}
- **Priority:** ${result.priority}
- **Violations:** ${result.violations.length}

${result.violations.length > 0 ? result.violations.map(v => 
  `- **${v.id}** (${v.impact}): ${v.description}`
).join('\n') : '*No violations found*'}
`).join('\n')}

---
*Generated by Zenith Accessibility Test Runner*
`;
    
    await fs.writeFile(
      path.join(A11Y_CONFIG.outputDir, 'accessibility-summary.md'),
      markdown
    );
  }

  outputSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('♿ ACCESSIBILITY TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.summary.totalTests}`);
    console.log(`Passed: ${this.summary.passed}`);
    console.log(`Failed: ${this.summary.failed}`);
    console.log('');
    console.log('Violations by Severity:');
    console.log(`  Critical: ${this.summary.violations.critical} (threshold: ${A11Y_CONFIG.thresholds.critical})`);
    console.log(`  Serious:  ${this.summary.violations.serious} (threshold: ${A11Y_CONFIG.thresholds.serious})`);
    console.log(`  Moderate: ${this.summary.violations.moderate} (threshold: ${A11Y_CONFIG.thresholds.moderate})`);
    console.log(`  Minor:    ${this.summary.violations.minor} (threshold: ${A11Y_CONFIG.thresholds.minor})`);
    console.log('');
    console.log(`Overall Status: ${this.summary.failed === 0 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('='.repeat(60));
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Execute if run directly
if (process.argv[1] === __filename) {
  const runner = new AccessibilityTestRunner();
  
  runner.initialize()
    .then(() => runner.runAllTests())
    .then((passed) => {
      return runner.cleanup().then(() => {
        process.exit(passed ? 0 : 1);
      });
    })
    .catch((error) => {
      console.error('💥 Accessibility testing failed:', error);
      return runner.cleanup().then(() => {
        process.exit(1);
      });
    });
}

export default AccessibilityTestRunner;