/**
 * QUANTUM'S VALIDATION UTILITIES
 * Comprehensive testing and validation for UI/UX perfection
 * Ensures WCAG 2.1 AAA compliance and perfect Lighthouse scores
 */

import { PerformanceMonitor, type PerformanceMetrics } from './performance';

// ===================================================================
// LIGHTHOUSE VALIDATION
// ===================================================================

export interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa?: number;
}

export interface LighthouseThresholds {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa?: number;
}

export class LighthouseValidator {
  private static readonly PERFECT_THRESHOLDS: LighthouseThresholds = {
    performance: 100,
    accessibility: 100,
    bestPractices: 100,
    seo: 100,
    pwa: 100,
  };

  static async validatePerformance(): Promise<{
    passed: boolean;
    metrics: Partial<LighthouseMetrics>;
    issues: string[];
  }> {
    const issues: string[] = [];
    const metrics: Partial<LighthouseMetrics> = {};

    // Core Web Vitals validation
    const perfMetrics = PerformanceMonitor.getMetrics();

    // Largest Contentful Paint (should be < 2.5s)
    if (perfMetrics.largestContentfulPaint && perfMetrics.largestContentfulPaint > 2500) {
      issues.push(`LCP too slow: ${perfMetrics.largestContentfulPaint}ms (target: <2500ms)`);
    }

    // First Input Delay (should be < 100ms)
    if (perfMetrics.firstInputDelay && perfMetrics.firstInputDelay > 100) {
      issues.push(`FID too slow: ${perfMetrics.firstInputDelay}ms (target: <100ms)`);
    }

    // Cumulative Layout Shift (should be < 0.1)
    if (perfMetrics.cumulativeLayoutShift && perfMetrics.cumulativeLayoutShift > 0.1) {
      issues.push(`CLS too high: ${perfMetrics.cumulativeLayoutShift} (target: <0.1)`);
    }

    // Frame rate validation (should be 60fps)
    const avgFrameDuration = perfMetrics.frameDuration?.reduce((a, b) => a + b, 0) / (perfMetrics.frameDuration?.length || 1);
    if (avgFrameDuration && avgFrameDuration > 16.67) { // 60fps = 16.67ms per frame
      issues.push(`Frame rate below 60fps: ${(1000 / avgFrameDuration).toFixed(1)}fps`);
    }

    // Estimate performance score based on metrics
    let performanceScore = 100;
    if (perfMetrics.largestContentfulPaint) {
      performanceScore -= Math.max(0, (perfMetrics.largestContentfulPaint - 1200) / 30);
    }
    if (perfMetrics.firstInputDelay) {
      performanceScore -= Math.max(0, (perfMetrics.firstInputDelay - 100) / 5);
    }

    metrics.performance = Math.max(0, Math.round(performanceScore));

    return {
      passed: issues.length === 0 && metrics.performance >= this.PERFECT_THRESHOLDS.performance,
      metrics,
      issues,
    };
  }

  static async validateResourceOptimization(): Promise<{
    passed: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for unused CSS
    const stylesheets = Array.from(document.styleSheets);
    let unusedRules = 0;

    try {
      for (const sheet of stylesheets) {
        if (sheet.cssRules) {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule instanceof CSSStyleRule) {
              try {
                if (!document.querySelector(rule.selectorText)) {
                  unusedRules++;
                }
              } catch {
                // Ignore invalid selectors
              }
            }
          }
        }
      }
    } catch {
      // Cross-origin stylesheets
    }

    if (unusedRules > 50) {
      issues.push(`Too many unused CSS rules: ${unusedRules}`);
      suggestions.push('Consider purging unused CSS');
    }

    // Check for unoptimized images
    const images = Array.from(document.images);
    const unoptimizedImages = images.filter(img => {
      const { naturalWidth, naturalHeight, width, height } = img;
      return naturalWidth > width * 2 || naturalHeight > height * 2;
    });

    if (unoptimizedImages.length > 0) {
      issues.push(`${unoptimizedImages.length} images are not optimally sized`);
      suggestions.push('Serve images at appropriate sizes');
    }

    // Check for missing alt attributes
    const imagesWithoutAlt = images.filter(img => !img.alt && !img.getAttribute('aria-label'));
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images missing alt text`);
    }

    return {
      passed: issues.length === 0,
      issues,
      suggestions,
    };
  }
}

// ===================================================================
// ACCESSIBILITY VALIDATION (WCAG 2.1 AAA)
// ===================================================================

export interface AccessibilityIssue {
  element: Element;
  type: 'error' | 'warning';
  rule: string;
  description: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
}

export class AccessibilityValidator {
  private static readonly WCAG_RULES = {
    // Level A
    'alt-text': { level: 'A', impact: 'critical' },
    'color-contrast': { level: 'AA', impact: 'serious' },
    'color-contrast-enhanced': { level: 'AAA', impact: 'moderate' },
    'focus-visible': { level: 'AA', impact: 'serious' },
    'keyboard-navigation': { level: 'A', impact: 'critical' },
    'aria-labels': { level: 'A', impact: 'serious' },
    'heading-hierarchy': { level: 'A', impact: 'moderate' },
    'landmark-roles': { level: 'A', impact: 'moderate' },
    'form-labels': { level: 'A', impact: 'critical' },
    'skip-links': { level: 'A', impact: 'moderate' },
  };

  static async validateAccessibility(): Promise<{
    passed: boolean;
    issues: AccessibilityIssue[];
    score: number;
  }> {
    const issues: AccessibilityIssue[] = [];

    // Check alt text for images
    issues.push(...this.checkAltText());

    // Check color contrast (AAA level)
    issues.push(...await this.checkColorContrast());

    // Check focus indicators
    issues.push(...this.checkFocusIndicators());

    // Check keyboard navigation
    issues.push(...this.checkKeyboardNavigation());

    // Check ARIA usage
    issues.push(...this.checkAriaUsage());

    // Check heading hierarchy
    issues.push(...this.checkHeadingHierarchy());

    // Check form labels
    issues.push(...this.checkFormLabels());

    // Check landmark roles
    issues.push(...this.checkLandmarkRoles());

    // Calculate score based on issues
    const totalElements = document.querySelectorAll('*').length;
    const criticalIssues = issues.filter(i => i.impact === 'critical').length;
    const seriousIssues = issues.filter(i => i.impact === 'serious').length;
    const moderateIssues = issues.filter(i => i.impact === 'moderate').length;

    const score = Math.max(0, 100 - (criticalIssues * 10) - (seriousIssues * 5) - (moderateIssues * 2));

    return {
      passed: issues.filter(i => i.type === 'error').length === 0,
      issues,
      score: Math.round(score),
    };
  }

  private static checkAltText(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const images = Array.from(document.images);

    images.forEach(img => {
      if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-labelledby')) {
        // Check if image is decorative
        const isDecorative = img.getAttribute('role') === 'presentation' ||
                           img.getAttribute('aria-hidden') === 'true';

        if (!isDecorative) {
          issues.push({
            element: img,
            type: 'error',
            rule: 'alt-text',
            description: 'Image missing alternative text',
            wcagLevel: 'A',
            impact: 'critical',
          });
        }
      }
    });

    return issues;
  }

  private static async checkColorContrast(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];

    // Get all text elements
    const textElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = getComputedStyle(el);
      return style.fontSize && el.textContent?.trim();
    });

    for (const element of textElements.slice(0, 100)) { // Limit for performance
      try {
        const style = getComputedStyle(element);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = style.fontWeight;

        const textColor = this.parseColor(style.color);
        const bgColor = this.getBackgroundColor(element);

        if (textColor && bgColor) {
          const contrast = this.calculateContrast(textColor, bgColor);
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));

          // WCAG AAA requirements
          const requiredContrast = isLargeText ? 4.5 : 7;

          if (contrast < requiredContrast) {
            issues.push({
              element,
              type: 'error',
              rule: 'color-contrast-enhanced',
              description: `Insufficient color contrast: ${contrast.toFixed(2)} (required: ${requiredContrast})`,
              wcagLevel: 'AAA',
              impact: 'serious',
            });
          }
        }
      } catch {
        // Skip elements with calculation errors
      }
    }

    return issues;
  }

  private static checkFocusIndicators(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const focusableElements = Array.from(document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    ));

    focusableElements.forEach(element => {
      const style = getComputedStyle(element, ':focus');
      const outlineStyle = style.outline;
      const outlineWidth = style.outlineWidth;
      const boxShadow = style.boxShadow;

      // Check if there's a visible focus indicator
      const hasFocusIndicator = outlineStyle !== 'none' && outlineWidth !== '0px' ||
                               boxShadow !== 'none';

      if (!hasFocusIndicator) {
        issues.push({
          element,
          type: 'error',
          rule: 'focus-visible',
          description: 'Focusable element lacks visible focus indicator',
          wcagLevel: 'AA',
          impact: 'serious',
        });
      }
    });

    return issues;
  }

  private static checkKeyboardNavigation(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const interactiveElements = Array.from(document.querySelectorAll(
      'div[onclick], div[role="button"], span[onclick]',
    ));

    interactiveElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      const role = element.getAttribute('role');

      if (!tabIndex && !['button', 'link', 'menuitem'].includes(role || '')) {
        issues.push({
          element,
          type: 'error',
          rule: 'keyboard-navigation',
          description: 'Interactive element not keyboard accessible',
          wcagLevel: 'A',
          impact: 'critical',
        });
      }
    });

    return issues;
  }

  private static checkAriaUsage(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const elementsWithAria = Array.from(document.querySelectorAll('[aria-labelledby], [aria-describedby]'));

    elementsWithAria.forEach(element => {
      const labelledBy = element.getAttribute('aria-labelledby');
      const describedBy = element.getAttribute('aria-describedby');

      if (labelledBy && !document.getElementById(labelledBy)) {
        issues.push({
          element,
          type: 'error',
          rule: 'aria-labels',
          description: `aria-labelledby references non-existent element: ${labelledBy}`,
          wcagLevel: 'A',
          impact: 'serious',
        });
      }

      if (describedBy && !document.getElementById(describedBy)) {
        issues.push({
          element,
          type: 'error',
          rule: 'aria-labels',
          description: `aria-describedby references non-existent element: ${describedBy}`,
          wcagLevel: 'A',
          impact: 'serious',
        });
      }
    });

    return issues;
  }

  private static checkHeadingHierarchy(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName[1]);

      if (previousLevel === 0 && level !== 1) {
        issues.push({
          element: heading,
          type: 'warning',
          rule: 'heading-hierarchy',
          description: 'Page should start with h1',
          wcagLevel: 'A',
          impact: 'moderate',
        });
      } else if (level > previousLevel + 1) {
        issues.push({
          element: heading,
          type: 'warning',
          rule: 'heading-hierarchy',
          description: `Heading level skipped from h${previousLevel} to h${level}`,
          wcagLevel: 'A',
          impact: 'moderate',
        });
      }

      previousLevel = level;
    });

    return issues;
  }

  private static checkFormLabels(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const formControls = Array.from(document.querySelectorAll(
      'input:not([type="hidden"]), textarea, select',
    ));

    formControls.forEach(control => {
      const id = control.id;
      const ariaLabel = control.getAttribute('aria-label');
      const ariaLabelledBy = control.getAttribute('aria-labelledby');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      const parentLabel = control.closest('label');

      if (!label && !parentLabel && !ariaLabel && !ariaLabelledBy) {
        issues.push({
          element: control,
          type: 'error',
          rule: 'form-labels',
          description: 'Form control missing accessible label',
          wcagLevel: 'A',
          impact: 'critical',
        });
      }
    });

    return issues;
  }

  private static checkLandmarkRoles(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for main landmark
    const mainLandmarks = document.querySelectorAll('main, [role="main"]');
    if (mainLandmarks.length === 0) {
      issues.push({
        element: document.body,
        type: 'warning',
        rule: 'landmark-roles',
        description: 'Page missing main landmark',
        wcagLevel: 'A',
        impact: 'moderate',
      });
    } else if (mainLandmarks.length > 1) {
      issues.push({
        element: document.body,
        type: 'warning',
        rule: 'landmark-roles',
        description: 'Page has multiple main landmarks',
        wcagLevel: 'A',
        impact: 'moderate',
      });
    }

    return issues;
  }

  // Helper methods for color contrast calculation
  private static parseColor(color: string): [number, number, number] | null {
    const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgb) {
      return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
    }
    return null;
  }

  private static getBackgroundColor(element: Element): [number, number, number] | null {
    let currentElement = element as Element | null;

    while (currentElement && currentElement !== document.body) {
      const style = getComputedStyle(currentElement);
      const bgColor = this.parseColor(style.backgroundColor);

      if (bgColor && !(bgColor[0] === 0 && bgColor[1] === 0 && bgColor[2] === 0)) {
        return bgColor;
      }

      currentElement = currentElement.parentElement;
    }

    return [255, 255, 255]; // Default to white
  }

  private static calculateContrast([r1, g1, b1]: [number, number, number], [r2, g2, b2]: [number, number, number]): number {
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(r1, g1, b1);
    const l2 = getLuminance(r2, g2, b2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }
}

// ===================================================================
// SEO VALIDATION
// ===================================================================

export class SEOValidator {
  static validateSEO(): {
    passed: boolean;
    issues: string[];
    score: number;
  } {
    const issues: string[] = [];
    let score = 100;

    // Check meta description
    const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDescription || !metaDescription.content) {
      issues.push('Missing meta description');
      score -= 15;
    } else if (metaDescription.content.length < 120 || metaDescription.content.length > 160) {
      issues.push('Meta description should be 120-160 characters');
      score -= 5;
    }

    // Check title tag
    const title = document.title;
    if (!title) {
      issues.push('Missing title tag');
      score -= 15;
    } else if (title.length < 30 || title.length > 60) {
      issues.push('Title should be 30-60 characters');
      score -= 5;
    }

    // Check heading structure
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 0) {
      issues.push('Missing H1 tag');
      score -= 10;
    } else if (h1s.length > 1) {
      issues.push('Multiple H1 tags found');
      score -= 5;
    }

    // Check canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      issues.push('Missing canonical URL');
      score -= 5;
    }

    // Check viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      issues.push('Missing viewport meta tag');
      score -= 10;
    }

    // Check for semantic HTML
    const semanticElements = document.querySelectorAll('main, nav, header, footer, article, section, aside');
    if (semanticElements.length < 3) {
      issues.push('Limited use of semantic HTML elements');
      score -= 5;
    }

    return {
      passed: issues.length === 0,
      issues,
      score: Math.max(0, score),
    };
  }
}

// ===================================================================
// COMPREHENSIVE VALIDATION SUITE
// ===================================================================

export interface ValidationReport {
  lighthouse: {
    passed: boolean;
    metrics: Partial<LighthouseMetrics>;
    issues: string[];
  };
  accessibility: {
    passed: boolean;
    issues: AccessibilityIssue[];
    score: number;
  };
  seo: {
    passed: boolean;
    issues: string[];
    score: number;
  };
  resources: {
    passed: boolean;
    issues: string[];
    suggestions: string[];
  };
  overallScore: number;
  perfectScore: boolean;
}

export class UIUXValidator {
  static async runCompleteValidation(): Promise<ValidationReport> {
    // // console.log('🔍 Running comprehensive UI/UX validation...');

    // Run all validations in parallel
    const [lighthouse, accessibility, seo, resources] = await Promise.all([
      LighthouseValidator.validatePerformance(),
      AccessibilityValidator.validateAccessibility(),
      Promise.resolve(SEOValidator.validateSEO()),
      LighthouseValidator.validateResourceOptimization(),
    ]);

    // Calculate overall score
    const scores = [
      lighthouse.metrics.performance || 0,
      accessibility.score,
      seo.score,
      resources.passed ? 100 : 85,
    ];

    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const perfectScore = overallScore === 100 && lighthouse.passed && accessibility.passed && seo.passed && resources.passed;

    const report: ValidationReport = {
      lighthouse,
      accessibility,
      seo,
      resources,
      overallScore,
      perfectScore,
    };

    // Log results
    // // console.log('📊 Validation Results:');
    // // console.log(`Overall Score: ${overallScore}/100 ${perfectScore ? '🎉' : ''}`);
    // // console.log(`Performance: ${lighthouse.metrics.performance || 0}/100`);
    // // console.log(`Accessibility: ${accessibility.score}/100`);
    // // console.log(`SEO: ${seo.score}/100`);
    // // console.log(`Resources: ${resources.passed ? '✅' : '❌'}`);

    if (!perfectScore) {
      // // console.log('\n🔧 Issues to address:');
      [...lighthouse.issues, ...accessibility.issues.map(i => i.description), ...seo.issues, ...resources.issues]
        .forEach(issue => {
          // // // console.log(`  • ${issue}`);
        });
    }

    return report;
  }

  static generateValidationReport(report: ValidationReport): string {
    const sections = [
      '# UI/UX Validation Report',
      `Generated: ${new Date().toISOString()}`,
      `Overall Score: **${report.overallScore}/100** ${report.perfectScore ? '🎉 PERFECT!' : ''}`,
      '',
      '## Performance Metrics',
      `Score: ${report.lighthouse.metrics.performance || 0}/100`,
      report.lighthouse.issues.length > 0 ? '### Issues:' : '✅ No issues found',
      ...report.lighthouse.issues.map(issue => `- ${issue}`),
      '',
      '## Accessibility (WCAG 2.1 AAA)',
      `Score: ${report.accessibility.score}/100`,
      report.accessibility.issues.length > 0 ? '### Issues:' : '✅ No issues found',
      ...report.accessibility.issues.map(issue => `- ${issue.description} (${issue.wcagLevel})`),
      '',
      '## SEO',
      `Score: ${report.seo.score}/100`,
      report.seo.issues.length > 0 ? '### Issues:' : '✅ No issues found',
      ...report.seo.issues.map(issue => `- ${issue}`),
      '',
      '## Resource Optimization',
      report.resources.passed ? '✅ All optimizations passed' : '❌ Issues found',
      ...report.resources.issues.map(issue => `- ${issue}`),
      report.resources.suggestions.length > 0 ? '### Suggestions:' : '',
      ...report.resources.suggestions.map(suggestion => `- ${suggestion}`),
    ];

    return sections.filter(Boolean).join('\n');
  }
}

export default UIUXValidator;