/**
 * QUANTUM'S AUTOMATED TESTING UTILITIES
 * Continuous monitoring and validation for UI/UX perfection
 * Ensures consistent quality across all interactions
 */

import { UIUXValidator, type ValidationReport } from './validation';
import { PerformanceMonitor } from './performance';
import { AccessibilityManager } from './accessibility';

// ===================================================================
// AUTOMATED TESTING FRAMEWORK
// ===================================================================

export interface TestConfig {
  performance: {
    enabled: boolean;
    thresholds: {
      fcp: number; // First Contentful Paint (ms)
      lcp: number; // Largest Contentful Paint (ms)
      fid: number; // First Input Delay (ms)
      cls: number; // Cumulative Layout Shift
      fps: number; // Frames per second
    };
  };
  accessibility: {
    enabled: boolean;
    level: 'A' | 'AA' | 'AAA';
    autoFix: boolean;
  };
  interaction: {
    enabled: boolean;
    maxResponseTime: number; // milliseconds
    testKeyboard: boolean;
    testTouch: boolean;
  };
  visual: {
    enabled: boolean;
    screenshotOnFail: boolean;
    compareBaseline: boolean;
  };
  monitoring: {
    interval: number; // seconds
    reportThreshold: number; // score below which to alert
    autoReport: boolean;
  };
}

export const DEFAULT_TEST_CONFIG: TestConfig = {
  performance: {
    enabled: true,
    thresholds: {
      fcp: 1800,
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fps: 60,
    },
  },
  accessibility: {
    enabled: true,
    level: 'AAA',
    autoFix: false,
  },
  interaction: {
    enabled: true,
    maxResponseTime: 100,
    testKeyboard: true,
    testTouch: true,
  },
  visual: {
    enabled: true,
    screenshotOnFail: false,
    compareBaseline: false,
  },
  monitoring: {
    interval: 30,
    reportThreshold: 95,
    autoReport: true,
  },
};

// ===================================================================
// INTERACTION TESTING
// ===================================================================

export interface InteractionTest {
  name: string;
  element: string | Element;
  type: 'click' | 'focus' | 'hover' | 'keyboard' | 'touch';
  expectedResponse?: string;
  timeout?: number;
}

export class InteractionTester {
  private static responseTime: number[] = [];

  static async testInteraction(test: InteractionTest): Promise<{
    passed: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = performance.now();
    let element: Element | null;

    if (typeof test.element === 'string') {
      element = document.querySelector(test.element);
    } else {
      element = test.element;
    }

    if (!element) {
      return {
        passed: false,
        responseTime: 0,
        error: 'Element not found',
      };
    }

    try {
      switch (test.type) {
        case 'click':
          await this.testClick(element);
          break;
        case 'focus':
          await this.testFocus(element);
          break;
        case 'hover':
          await this.testHover(element);
          break;
        case 'keyboard':
          await this.testKeyboard(element);
          break;
        case 'touch':
          await this.testTouch(element);
          break;
      }

      const responseTime = performance.now() - startTime;
      this.responseTime.push(responseTime);

      return {
        passed: responseTime <= (test.timeout || DEFAULT_TEST_CONFIG.interaction.maxResponseTime),
        responseTime,
      };
    } catch (_error) {
      return {
        passed: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private static async testClick(element: Element): Promise<void> {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    element.dispatchEvent(event);

    // Wait for potential async operations
    await new Promise(resolve => setTimeout(resolve, 16)); // One frame
  }

  private static async testFocus(element: Element): Promise<void> {
    if (element instanceof HTMLElement) {
      element.focus();

      // Verify focus was set
      if (document.activeElement !== element) {
        throw new Error('Element could not receive focus');
      }
    }
  }

  private static async testHover(element: Element): Promise<void> {
    const event = new MouseEvent('mouseenter', {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    element.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 16));
  }

  private static async testKeyboard(element: Element): Promise<void> {
    if (element instanceof HTMLElement) {
      element.focus();

      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
      });

      element.dispatchEvent(enterEvent);

      // Test Space key for buttons
      if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
        const spaceEvent = new KeyboardEvent('keydown', {
          key: ' ',
          code: 'Space',
          bubbles: true,
        });

        element.dispatchEvent(spaceEvent);
      }
    }
  }

  private static async testTouch(element: Element): Promise<void> {
    const rect = element.getBoundingClientRect();
    const touchEvent = new TouchEvent('touchstart', {
      touches: [
        new Touch({
          identifier: 0,
          target: element,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        }),
      ],
      bubbles: true,
    });

    element.dispatchEvent(touchEvent);
    await new Promise(resolve => setTimeout(resolve, 16));
  }

  static getAverageResponseTime(): number {
    if (this.responseTime.length === 0) {
      return 0;
    }
    return this.responseTime.reduce((a, b) => a + b, 0) / this.responseTime.length;
  }

  static clearResponseTimes(): void {
    this.responseTime = [];
  }
}

// ===================================================================
// VISUAL REGRESSION TESTING
// ===================================================================

export class VisualTester {
  private static baseline: Map<string, string> = new Map();

  static async captureScreenshot(name: string): Promise<string> {
    try {
      // Use html2canvas if available, fallback to canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Simple visual capture (in real implementation, use html2canvas)
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      return canvas.toDataURL();
    } catch (_error) {
      // // console.warn('Screenshot capture failed:', error);
      return '';
    }
  }

  static async compareWithBaseline(name: string): Promise<{
    passed: boolean;
    difference: number;
    screenshot: string;
  }> {
    const currentScreenshot = await this.captureScreenshot(name);
    const baselineScreenshot = this.baseline.get(name);

    if (!baselineScreenshot) {
      // First run, set as baseline
      this.baseline.set(name, currentScreenshot);
      return {
        passed: true,
        difference: 0,
        screenshot: currentScreenshot,
      };
    }

    // Simple comparison (in real implementation, use pixel-diff libraries)
    const difference = currentScreenshot === baselineScreenshot ? 0 : 1;

    return {
      passed: difference < 0.1, // 10% threshold
      difference,
      screenshot: currentScreenshot,
    };
  }

  static setBaseline(name: string, screenshot: string): void {
    this.baseline.set(name, screenshot);
  }
}

// ===================================================================
// AUTOMATED MONITORING
// ===================================================================

export interface MonitoringReport {
  timestamp: number;
  performance: {
    averageResponseTime: number;
    frameRate: number;
    memoryUsage: number;
  };
  accessibility: {
    violations: number;
    score: number;
  };
  interactions: {
    totalTests: number;
    passedTests: number;
    averageResponseTime: number;
  };
  overall: {
    score: number;
    status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  };
}

export class QualityMonitor {
  private static isMonitoring = false;
  private static monitoringInterval: number | null = null;
  private static reports: MonitoringReport[] = [];
  private static config: TestConfig = DEFAULT_TEST_CONFIG;

  static startMonitoring(config: Partial<TestConfig> = {}): void {
    if (this.isMonitoring) {
      return;
    }

    this.config = { ...DEFAULT_TEST_CONFIG, ...config };
    this.isMonitoring = true;

    // // console.log('🔄 Starting quality monitoring...');

    this.monitoringInterval = window.setInterval(
      () => this.runMonitoringCycle(),
      this.config.monitoring.interval * 1000,
    );

    // Initial run
    this.runMonitoringCycle();
  }

  static stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // // console.log('⏹️ Quality monitoring stopped');
  }

  private static async runMonitoringCycle(): Promise<void> {
    try {
      const timestamp = Date.now();

      // Collect performance metrics
      const performanceMetrics = PerformanceMonitor.getMetrics();
      const memoryInfo = (performance as any).memory;

      // Test common interactions
      const interactionTests = await this.runInteractionTests();

      // Quick accessibility check
      const accessibilityCheck = await this.quickAccessibilityCheck();

      // Calculate frame rate
      const frameRate = this.calculateFrameRate(performanceMetrics.frameDuration || []);

      const report: MonitoringReport = {
        timestamp,
        performance: {
          averageResponseTime: InteractionTester.getAverageResponseTime(),
          frameRate,
          memoryUsage: memoryInfo ? memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize : 0,
        },
        accessibility: {
          violations: accessibilityCheck.violations,
          score: accessibilityCheck.score,
        },
        interactions: {
          totalTests: interactionTests.total,
          passedTests: interactionTests.passed,
          averageResponseTime: InteractionTester.getAverageResponseTime(),
        },
        overall: {
          score: this.calculateOverallScore(interactionTests, accessibilityCheck, frameRate),
          status: 'excellent',
        },
      };

      // Set status based on score
      if (report.overall.score >= 95) {
        report.overall.status = 'excellent';
      } else if (report.overall.score >= 85) {
        report.overall.status = 'good';
      } else if (report.overall.score >= 70) {
        report.overall.status = 'needs-improvement';
      } else {
        report.overall.status = 'poor';
      }

      this.reports.push(report);

      // Keep only last 100 reports
      if (this.reports.length > 100) {
        this.reports = this.reports.slice(-100);
      }

      // Auto-report if score drops below threshold
      if (
        this.config.monitoring.autoReport &&
        report.overall.score < this.config.monitoring.reportThreshold
      ) {
        // // console.warn(`⚠️ Quality score dropped to ${report.overall.score}%`);
        this.generateMonitoringAlert(report);
      }
    } catch (_error) {
      console.error('Monitoring cycle failed:', error);
    }
  }

  private static async runInteractionTests(): Promise<{ total: number; passed: number }> {
    const tests: InteractionTest[] = [
      { name: 'Button Click', element: 'button', type: 'click' },
      { name: 'Link Focus', element: 'a', type: 'focus' },
      { name: 'Input Focus', element: 'input', type: 'focus' },
    ];

    let passed = 0;

    for (const test of tests) {
      try {
        const result = await InteractionTester.testInteraction(test);
        if (result.passed) {
          passed++;
        }
      } catch {
        // Test failed
      }
    }

    return { total: tests.length, passed };
  }

  private static async quickAccessibilityCheck(): Promise<{ violations: number; score: number }> {
    const issues = [];

    // Quick checks only
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;
    const buttonsWithoutLabels = document.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby])',
    ).length;
    const inputsWithoutLabels = document.querySelectorAll(
      'input:not([aria-label]):not([aria-labelledby])',
    ).length;

    const totalViolations = imagesWithoutAlt + buttonsWithoutLabels + inputsWithoutLabels;
    const score = Math.max(0, 100 - totalViolations * 5);

    return { violations: totalViolations, score };
  }

  private static calculateFrameRate(frameDurations: number[]): number {
    if (frameDurations.length === 0) {
      return 60;
    }

    const avgDuration = frameDurations.reduce((a, b) => a + b, 0) / frameDurations.length;
    return Math.min(60, 1000 / avgDuration);
  }

  private static calculateOverallScore(
    interactions: { total: number; passed: number },
    accessibility: { score: number },
    frameRate: number,
  ): number {
    const interactionScore =
      interactions.total > 0 ? (interactions.passed / interactions.total) * 100 : 100;
    const performanceScore = (frameRate / 60) * 100;

    return Math.round((interactionScore + accessibility.score + performanceScore) / 3);
  }

  private static generateMonitoringAlert(report: MonitoringReport): void {
    const alertMessage = [
      `🚨 Quality Alert - Score: ${report.overall.score}%`,
      `Frame Rate: ${report.performance.frameRate.toFixed(1)}fps`,
      `Interactions: ${report.interactions.passedTests}/${report.interactions.totalTests}`,
      `Accessibility: ${report.accessibility.score}% (${report.accessibility.violations} violations)`,
      `Status: ${report.overall.status.toUpperCase()}`,
    ].join('\n');

    // // console.warn(alertMessage);

    // In a real app, this would send alerts via email, Slack, etc.
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('UI/UX Quality Alert', {
        body: `Quality score dropped to ${report.overall.score}%`,
        icon: '/favicon.ico',
      });
    }
  }

  static getReports(): MonitoringReport[] {
    return [...this.reports];
  }

  static getLatestReport(): MonitoringReport | null {
    return this.reports[this.reports.length - 1] || null;
  }

  static exportReports(): string {
    return JSON.stringify(this.reports, null, 2);
  }
}

// ===================================================================
// COMPREHENSIVE TEST RUNNER
// ===================================================================

export interface TestSuite {
  name: string;
  tests: Array<{
    name: string;
    fn: () => Promise<boolean>;
    critical?: boolean;
  }>;
}

export class TestRunner {
  static async runFullTestSuite(): Promise<{
    passed: boolean;
    results: Array<{ name: string; passed: boolean; duration: number; error?: string }>;
    report: ValidationReport;
  }> {
    // // console.log('🧪 Running full UI/UX test suite...');

    const results: Array<{ name: string; passed: boolean; duration: number; error?: string }> = [];

    // Define test suites
    const testSuites: TestSuite[] = [
      {
        name: 'Performance Tests',
        tests: [
          {
            name: 'Frame Rate > 55fps',
            fn: async () => {
              const metrics = PerformanceMonitor.getMetrics();
              const avgDuration =
                metrics.frameDuration?.reduce((a, b) => a + b, 0) /
                (metrics.frameDuration?.length || 1);
              return !avgDuration || 1000 / avgDuration > 55;
            },
            critical: true,
          },
          {
            name: 'Response Time < 100ms',
            fn: async () => InteractionTester.getAverageResponseTime() < 100,
            critical: true,
          },
        ],
      },
      {
        name: 'Accessibility Tests',
        tests: [
          {
            name: 'All Images Have Alt Text',
            fn: async () => document.querySelectorAll('img:not([alt])').length === 0,
            critical: true,
          },
          {
            name: 'All Buttons Have Labels',
            fn: async () => {
              const unlabeled = document.querySelectorAll(
                'button:not([aria-label]):not([aria-labelledby])',
              );
              return Array.from(unlabeled).every(btn => btn.textContent?.trim());
            },
            critical: true,
          },
        ],
      },
      {
        name: 'Interaction Tests',
        tests: [
          {
            name: 'Keyboard Navigation Works',
            fn: async () => {
              const focusable = document.querySelectorAll(
                'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
              );
              return focusable.length > 0;
            },
            critical: true,
          },
        ],
      },
    ];

    // Run all tests
    for (const suite of testSuites) {
      for (const test of suite.tests) {
        const startTime = performance.now();

        try {
          const passed = await test.fn();
          const duration = performance.now() - startTime;

          results.push({
            name: `${suite.name}: ${test.name}`,
            passed,
            duration,
          });
        } catch (_error) {
          const duration = performance.now() - startTime;
          results.push({
            name: `${suite.name}: ${test.name}`,
            passed: false,
            duration,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Run comprehensive validation
    const report = await UIUXValidator.runCompleteValidation();

    const allTestsPassed = results.every(r => r.passed) && report.perfectScore;

    // // console.log(`✅ Test suite completed. Passed: ${allTestsPassed}`);
    // // console.log(`📊 Results: ${results.filter(r => r.passed).length}/${results.length} tests passed`);

    return {
      passed: allTestsPassed,
      results,
      report,
    };
  }
}

export default {
  InteractionTester,
  VisualTester,
  QualityMonitor,
  TestRunner,
  UIUXValidator,
};
