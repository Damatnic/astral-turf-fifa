import React from 'react';
/**
 * Accessibility Utilities for Astral Turf
 *
 * Comprehensive accessibility helpers for WCAG 2.1 AAA compliance
 */

// ARIA Live Region Manager
class LiveRegionManager {
  private static instance: LiveRegionManager;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  static getInstance(): LiveRegionManager {
    if (!LiveRegionManager.instance) {
      LiveRegionManager.instance = new LiveRegionManager();
    }
    return LiveRegionManager.instance;
  }

  private createLiveRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.id = `live-region-${politeness}`;
    document.body.appendChild(region);
    return region;
  }

  private getPoliteRegion(): HTMLElement {
    if (!this.politeRegion) {
      this.politeRegion = this.createLiveRegion('polite');
    }
    return this.politeRegion;
  }

  private getAssertiveRegion(): HTMLElement {
    if (!this.assertiveRegion) {
      this.assertiveRegion = this.createLiveRegion('assertive');
    }
    return this.assertiveRegion;
  }

  announcePolitely(message: string): void {
    const region = this.getPoliteRegion();
    region.textContent = message;
    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      region.textContent = '';
    }, 1000);
  }

  announceUrgently(message: string): void {
    const region = this.getAssertiveRegion();
    region.textContent = message;
    setTimeout(() => {
      region.textContent = '';
    }, 1000);
  }
}

export const liveRegionManager = LiveRegionManager.getInstance();

// Focus Management
export class FocusManager {
  private static focusStack: HTMLElement[] = [];

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  static pushFocus(element: HTMLElement): void {
    const currentFocus = document.activeElement as any;
    if (currentFocus) {
      this.focusStack.push(currentFocus);
    }
    element.focus();
  }

  static popFocus(): void {
    const previousFocus = this.focusStack.pop();
    if (previousFocus) {
      previousFocus.focus();
    }
  }

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      'summary',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)) as any[];
  }

  static setFocusVisible(element: HTMLElement): void {
    element.classList.add('focus-visible');
    element.setAttribute('data-focus-visible-added', '');
  }

  static removeFocusVisible(element: HTMLElement): void {
    element.classList.remove('focus-visible');
    element.removeAttribute('data-focus-visible-added');
  }
}

// Keyboard Navigation Helper
export class KeyboardNavigation {
  static handleMenuNavigation(event: KeyboardEvent, items: HTMLElement[]): void {
    const currentIndex = items.indexOf(event.target as any);
    let targetIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        targetIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        targetIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        targetIndex = items.length - 1;
        break;
      case 'Escape':
        event.preventDefault();
        (event.target as any).blur();
        return;
    }

    items[targetIndex]?.focus();
  }

  static handleGridNavigation(event: KeyboardEvent, items: HTMLElement[], columns: number): void {
    const currentIndex = items.indexOf(event.target as any);
    let targetIndex = currentIndex;
    const rows = Math.ceil(items.length / columns);

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        targetIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        targetIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'ArrowDown':
        event.preventDefault();
        targetIndex = (currentIndex + columns) % items.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        targetIndex = currentIndex - columns;
        if (targetIndex < 0) {
          targetIndex = items.length + targetIndex;
        }
        break;
      case 'Home':
        event.preventDefault();
        targetIndex = Math.floor(currentIndex / columns) * columns;
        break;
      case 'End':
        event.preventDefault();
        const currentRow = Math.floor(currentIndex / columns);
        targetIndex = Math.min((currentRow + 1) * columns - 1, items.length - 1);
        break;
    }

    items[targetIndex]?.focus();
  }
}

// Color Contrast Utilities
export class ColorContrast {
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) {
      return 0;
    }

    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  static meetsWCAG(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }

  static meetsWCAGLarge(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 3 : ratio >= 4.5;
  }
}

// Screen Reader Utilities
export class ScreenReader {
  static hide(element: HTMLElement): void {
    element.setAttribute('aria-hidden', 'true');
  }

  static show(element: HTMLElement): void {
    element.removeAttribute('aria-hidden');
  }

  static setLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  static setDescription(element: HTMLElement, description: string): void {
    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;

    // Create description element if it doesn't exist
    let descElement = document.getElementById(descId);
    if (!descElement) {
      descElement = document.createElement('div');
      descElement.id = descId;
      descElement.className = 'sr-only';
      descElement.textContent = description;
      document.body.appendChild(descElement);
    }

    element.setAttribute('aria-describedby', descId);
  }

  static setRole(element: HTMLElement, role: string): void {
    element.setAttribute('role', role);
  }

  static setExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  static setPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', pressed.toString());
  }

  static setChecked(element: HTMLElement, checked: boolean | 'mixed'): void {
    element.setAttribute('aria-checked', checked.toString());
  }

  static setDisabled(element: HTMLElement, disabled: boolean): void {
    if (disabled) {
      element.setAttribute('aria-disabled', 'true');
      element.setAttribute('tabindex', '-1');
    } else {
      element.removeAttribute('aria-disabled');
      element.removeAttribute('tabindex');
    }
  }
}

// Accessibility Testing Utilities
export class AccessibilityTester {
  static async runBasicTests(
    container: HTMLElement = document.body
  ): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];

    // Check for images without alt text
    const images = container.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.getAttribute('alt') && !img.getAttribute('aria-label')) {
        issues.push({
          type: 'missing-alt',
          element: img,
          message: 'Image missing alt text',
          severity: 'error',
          wcagCriterion: '1.1.1',
        });
      }
    });

    // Check for buttons without accessible names
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const hasText = button.textContent?.trim();
      const hasAriaLabel = button.getAttribute('aria-label');
      const hasAriaLabelledBy = button.getAttribute('aria-labelledby');

      if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
        issues.push({
          type: 'missing-button-name',
          element: button,
          message: 'Button missing accessible name',
          severity: 'error',
          wcagCriterion: '4.1.2',
        });
      }
    });

    // Check for form inputs without labels
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      const hasLabel = container.querySelector(`label[for="${input.id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && input.id) {
        issues.push({
          type: 'missing-form-label',
          element: input as HTMLElement,
          message: 'Form control missing label',
          severity: 'error',
          wcagCriterion: '1.3.1',
        });
      }
    });

    // Check heading hierarchy
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;

    headings.forEach(heading => {
      const currentLevel = parseInt(heading.tagName.charAt(1));

      if (previousLevel > 0 && currentLevel > previousLevel + 1) {
        issues.push({
          type: 'heading-skip',
          element: heading as HTMLElement,
          message: `Heading level skipped from h${previousLevel} to h${currentLevel}`,
          severity: 'warning',
          wcagCriterion: '1.3.1',
        });
      }

      previousLevel = currentLevel;
    });

    return issues;
  }

  static checkColorContrast(container: HTMLElement = document.body): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const elements = container.querySelectorAll('*');

    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      // Simple check - would need more sophisticated color parsing in production
      if (
        color &&
        backgroundColor &&
        color !== 'rgba(0, 0, 0, 0)' &&
        backgroundColor !== 'rgba(0, 0, 0, 0)'
      ) {
        // This is a simplified check - would need proper color conversion
        const textContent = element.textContent?.trim();
        if (textContent && textContent.length > 0) {
          // Add contrast checking logic here
          // For now, just flag for manual review
          issues.push({
            type: 'contrast-check',
            element: element as any,
            message: 'Check color contrast manually',
            severity: 'info',
            wcagCriterion: '1.4.3',
          });
        }
      }
    });

    return issues;
  }
}

// Types
export interface AccessibilityIssue {
  type: string;
  element: HTMLElement;
  message: string;
  severity: 'error' | 'warning' | 'info';
  wcagCriterion: string;
}

// React Hooks for Accessibility
export function useAnnouncement() {
  return {
    announcePolitely: (message: string) => liveRegionManager.announcePolitely(message),
    announceUrgently: (message: string) => liveRegionManager.announceUrgently(message),
  };
}

export function useFocusTrap(active: boolean) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (active && ref.current) {
      const cleanup = FocusManager.trapFocus(ref.current);
      return cleanup;
    }
    return undefined;
  }, [active]);

  return ref;
}

export function useKeyboardNavigation(type: 'menu' | 'grid', options?: { columns?: number }) {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      const container = event.currentTarget as any;
      const items = FocusManager.getFocusableElements(container);

      if (type === 'menu') {
        KeyboardNavigation.handleMenuNavigation(event.nativeEvent, items);
      } else if (type === 'grid' && options?.columns) {
        KeyboardNavigation.handleGridNavigation(event.nativeEvent, items, options.columns);
      }
    },
    [type, options?.columns]
  );

  return { onKeyDown: handleKeyDown };
}

// High-level accessibility utilities
export const a11y = {
  announce: liveRegionManager,
  focus: FocusManager,
  keyboard: KeyboardNavigation,
  contrast: ColorContrast,
  screenReader: ScreenReader,
  test: AccessibilityTester,
};

class AccessibilityManagerImpl {
  private static complianceLevel: 'A' | 'AA' | 'AAA' = 'AA';
  private static autoFocusEnabled = false;
  private static keyboardHandler: ((event: KeyboardEvent) => void) | null = null;

  static setComplianceLevel(level: 'A' | 'AA' | 'AAA'): void {
    this.complianceLevel = level;
  }

  static getComplianceLevel(): 'A' | 'AA' | 'AAA' {
    return this.complianceLevel;
  }

  static enableAutoFocus(): void {
    if (typeof document === 'undefined' || this.autoFocusEnabled) {
      return;
    }

    document.body?.setAttribute('data-a11y-auto-focus', 'true');
    this.autoFocusEnabled = true;
  }

  static setupGlobalKeyboardNavigation(): void {
    if (typeof document === 'undefined') {
      return;
    }

    if (this.keyboardHandler) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const activeElement = document.activeElement as any | null;
        if (activeElement) {
          FocusManager.setFocusVisible(activeElement);
        }
      }

      if (event.key === 'Escape') {
        const activeElement = document.activeElement as any | null;
        if (activeElement && activeElement.closest('[data-focus-trap]')) {
          FocusManager.popFocus();
        }
      }
    };

    document.addEventListener('keydown', handler);
    this.keyboardHandler = handler;
  }
}

export const AccessibilityManager = AccessibilityManagerImpl;
