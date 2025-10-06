/**
 * Mobile Accessibility Framework
 * Comprehensive accessibility features for mobile devices and screen readers
 */

import { useCallback, useRef, useState } from 'react';
import { useMobileCapabilities } from './mobileOptimizations';

// Accessibility configuration
interface AccessibilityConfig {
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableLargeText: boolean;
  enableReducedMotion: boolean;
  enableVoiceAnnouncements: boolean;
  enableKeyboardNavigation: boolean;
  textSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrastRatio: 'normal' | 'high' | 'maximum';
  announceFormationChanges: boolean;
  announcePlayerActions: boolean;
}

// Screen reader announcement types
type AnnouncementType = 'polite' | 'assertive' | 'off';

interface Announcement {
  message: string;
  type: AnnouncementType;
  priority: 'low' | 'medium' | 'high';
  delay?: number;
}

// Touch target sizes for accessibility
export const TOUCH_TARGETS = {
  MINIMUM: 44, // WCAG minimum
  COMFORTABLE: 48, // Comfortable size
  LARGE: 56, // Large for motor impairments
  EXTRA_LARGE: 64, // Extra large for severe motor impairments
} as const;

// Color contrast ratios
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
} as const;

type WindowInstance = typeof globalThis extends { window: infer T } ? T : typeof window;

type DocumentInstance = typeof globalThis extends { document: infer T } ? T : never;

type NavigatorInstance = typeof globalThis extends { navigator: infer T } ? T : never;

const getWindow = (): WindowInstance | undefined =>
  typeof window === 'undefined' ? undefined : (window as WindowInstance);

const getDocument = (): DocumentInstance | undefined =>
  typeof document === 'undefined' ? undefined : (document as DocumentInstance);

const getNavigator = (): NavigatorInstance | undefined =>
  getWindow()?.navigator as NavigatorInstance | undefined;

const getBodyElement = (doc: DocumentInstance): HTMLElement | null =>
  doc.body ?? doc.documentElement ?? null;

/**
 * Screen Reader Announcement Manager
 */
export class ScreenReaderManager {
  private static instance: ScreenReaderManager;
  private announcer: HTMLElement | null = null;
  private politeAnnouncer: HTMLElement | null = null;
  private assertiveAnnouncer: HTMLElement | null = null;
  private announcementQueue: Announcement[] = [];
  private isProcessing: boolean = false;

  static getInstance(): ScreenReaderManager {
    if (!ScreenReaderManager.instance) {
      ScreenReaderManager.instance = new ScreenReaderManager();
    }
    return ScreenReaderManager.instance;
  }

  private constructor() {
    this.createAnnouncers();
  }

  private createAnnouncers(): void {
    const doc = getDocument();
    if (!doc) {
      return;
    }

    const root = getBodyElement(doc);
    if (!root) {
      return;
    }

    const ensureAnnouncer = (
      id: string,
      ariaLive: 'polite' | 'assertive',
      extraAttributes: Record<string, string> = {}
    ) => {
      let element = doc.getElementById(id) as HTMLElement | null;
      if (!element) {
        element = doc.createElement('div');
        element.id = id;
        element.className = 'sr-only';
        root.appendChild(element);
      } else if (!element.classList.contains('sr-only')) {
        element.classList.add('sr-only');
      }

      element.setAttribute('aria-live', ariaLive);
      element.setAttribute('aria-atomic', 'true');
      Object.entries(extraAttributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });

      return element;
    };

    this.announcer = ensureAnnouncer('tactical-board-announcer', 'polite', {
      'aria-relevant': 'all',
    });
    this.politeAnnouncer = ensureAnnouncer('tactical-board-polite-announcer', 'polite');
    this.assertiveAnnouncer = ensureAnnouncer('tactical-board-assertive-announcer', 'assertive');
  }

  /**
   * Announce a message to screen readers
   */
  announce(announcement: Announcement): void {
    if (!this.politeAnnouncer || !this.assertiveAnnouncer) {
      this.createAnnouncers();
    }

    this.announcementQueue.push(announcement);

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Quick announcement with default settings
   */
  say(
    message: string,
    type: AnnouncementType = 'polite',
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    this.announce({ message, type, priority });
  }

  /**
   * Announce tactical board actions
   */
  announceTacticalAction(action: string, details?: string): void {
    const message = details ? `${action}. ${details}` : action;
    this.announce({
      message,
      type: 'polite',
      priority: 'medium',
    });
  }

  /**
   * Announce formation changes
   */
  announceFormationChange(formationName: string, playerCount: number): void {
    const message = `Formation changed to ${formationName} with ${playerCount} players`;
    this.announce({
      message,
      type: 'polite',
      priority: 'medium',
    });
  }

  /**
   * Announce player actions
   */
  announcePlayerAction(playerName: string, action: string, position?: string): void {
    let message = `${playerName} ${action}`;
    if (position) {
      message += ` to ${position}`;
    }

    this.announce({
      message,
      type: 'polite',
      priority: 'low',
    });
  }

  /**
   * Process announcement queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.announcementQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Sort by priority
    this.announcementQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    while (this.announcementQueue.length > 0) {
      const announcement = this.announcementQueue.shift()!;
      await this.processAnnouncement(announcement);
    }

    this.isProcessing = false;
  }

  /**
   * Process a single announcement
   */
  private async processAnnouncement(announcement: Announcement): Promise<void> {
    const announcer =
      announcement.type === 'assertive' ? this.assertiveAnnouncer : this.politeAnnouncer;

    if (!announcer) {
      return;
    }

    // Clear previous content
    announcer.textContent = '';

    // Wait for screen reader to register the clear
    await new Promise(resolve => setTimeout(resolve, 100));

    // Set new content
    announcer.textContent = announcement.message;

    // Wait for announcement to be read
    const delay = announcement.delay || this.calculateReadingTime(announcement.message);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Calculate estimated reading time for announcement
   */
  private calculateReadingTime(text: string): number {
    // Average reading speed: 150-200 words per minute
    const wordsPerMinute = 175;
    const words = text.split(' ').length;
    const minutes = words / wordsPerMinute;
    const milliseconds = minutes * 60 * 1000;

    // Minimum 500ms, maximum 5000ms
    return Math.max(500, Math.min(5000, milliseconds));
  }

  /**
   * Clear all announcements
   */
  clear(): void {
    this.announcementQueue = [];
    if (this.politeAnnouncer) {
      this.politeAnnouncer.textContent = '';
    }
    if (this.assertiveAnnouncer) {
      this.assertiveAnnouncer.textContent = '';
    }
  }
}

/**
 * Mobile Accessibility Manager
 */
export class MobileAccessibilityManager {
  private static instance: MobileAccessibilityManager;
  private config: AccessibilityConfig;
  private screenReader: ScreenReaderManager;
  private focusManagementStack: HTMLElement[] = [];

  static getInstance(): MobileAccessibilityManager {
    if (!MobileAccessibilityManager.instance) {
      MobileAccessibilityManager.instance = new MobileAccessibilityManager();
    }
    return MobileAccessibilityManager.instance;
  }

  private constructor() {
    this.config = this.detectAccessibilityPreferences();
    this.screenReader = ScreenReaderManager.getInstance();
    this.setupAccessibilityStyles();
    this.setupKeyboardNavigation();
  }

  /**
   * Detect user accessibility preferences
   */
  private detectAccessibilityPreferences(): AccessibilityConfig {
    const win = getWindow();
    const prefers = (query: string): boolean => win?.matchMedia?.(query)?.matches ?? false;

    const screenReaderActive = this.isScreenReaderActive();

    return {
      enableScreenReader: screenReaderActive,
      enableHighContrast: prefers('(prefers-contrast: high)'),
      enableLargeText: prefers('(prefers-font-size: large)'),
      enableReducedMotion: prefers('(prefers-reduced-motion: reduce)'),
      enableVoiceAnnouncements: screenReaderActive,
      enableKeyboardNavigation: !this.isTouchDevice(),
      textSize: this.getPreferredTextSize(),
      contrastRatio: prefers('(prefers-contrast: high)') ? 'high' : 'normal',
      announceFormationChanges: true,
      announcePlayerActions: true,
    };
  }

  /**
   * Detect if screen reader is active
   */
  private isScreenReaderActive(): boolean {
    // Check for screen reader indicators
    const win = getWindow();
    const nav = getNavigator();

    if (!win || !nav) {
      return false;
    }

    const userAgent = nav.userAgent ?? '';
    const synthesis = win.speechSynthesis;
    const hasVoices =
      typeof synthesis?.getVoices === 'function' && synthesis.getVoices().length > 0;

    return (
      userAgent.includes('NVDA') ||
      userAgent.includes('JAWS') ||
      hasVoices ||
      'speechSynthesis' in win
    );
  }

  /**
   * Detect if device is primarily touch-based
   */
  private isTouchDevice(): boolean {
    const win = getWindow();
    const nav = getNavigator();

    return Boolean((win && 'ontouchstart' in win) || (nav && nav.maxTouchPoints > 0));
  }

  /**
   * Get preferred text size
   */
  private getPreferredTextSize(): 'small' | 'medium' | 'large' | 'extra-large' {
    const win = getWindow();
    if (win?.matchMedia?.('(prefers-font-size: large)').matches) {
      return 'large';
    }
    return 'medium';
  }

  /**
   * Setup accessibility styles
   */
  private setupAccessibilityStyles(): void {
    const doc = getDocument();
    if (!doc) {
      return;
    }

    const host = doc.head ?? doc.documentElement ?? doc.body;
    if (!host) {
      return;
    }

    let style = doc.getElementById('mobile-accessibility-styles') as HTMLElement | null;
    if (!style) {
      style = doc.createElement('style');
      style.id = 'mobile-accessibility-styles';
      host.appendChild(style);
    }

    let css = `
      /* Screen reader only content */
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      /* Skip links for keyboard navigation */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        z-index: 1000;
        border-radius: 4px;
      }
      
      .skip-link:focus {
        top: 6px;
      }
      
      /* Focus indicators */
      .focus-visible {
        outline: 3px solid #005fcc;
        outline-offset: 2px;
      }
      
      /* High contrast mode */
      .high-contrast {
        filter: contrast(150%);
      }
      
      .high-contrast .tactical-field {
        background: #000 !important;
        color: #fff !important;
      }
      
      .high-contrast .player-token {
        border: 2px solid #fff !important;
        background: #000 !important;
        color: #fff !important;
      }
    `;

    // Add text size styles
    const textSizes = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.25rem',
      'extra-large': '1.5rem',
    };

    css += `
      .text-size-${this.config.textSize} {
        font-size: ${textSizes[this.config.textSize]} !important;
      }
    `;

    // Add reduced motion styles
    if (this.config.enableReducedMotion) {
      css += `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
    }

    style.textContent = css;

    const body = doc.body ?? doc.documentElement;
    if (!body) {
      return;
    }

    body.classList.toggle('high-contrast', this.config.enableHighContrast);
    body.classList.add(`text-size-${this.config.textSize}`);
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    if (!this.config.enableKeyboardNavigation) {
      return;
    }

    const doc = getDocument();
    const body = doc?.body ?? doc?.documentElement;
    if (!doc || !body) {
      return;
    }

    // Add skip links
    const skipLink = doc.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    body.insertBefore(skipLink, body.firstChild);

    // Setup keyboard event handlers
    doc.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));

    // Setup focus management
    doc.addEventListener('focusin', this.handleFocusIn.bind(this));
    doc.addEventListener('focusout', this.handleFocusOut.bind(this));
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyboardNavigation(event: KeyboardEvent): void {
    const { key, ctrlKey, altKey } = event;

    // Escape key to close modals/menus
    if (key === 'Escape') {
      this.handleEscapeKey();
    }

    // Arrow key navigation on tactical board
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      this.handleArrowKeyNavigation(event);
    }

    // Tab navigation enhancement
    if (key === 'Tab') {
      this.handleTabNavigation(event);
    }

    // Accessibility shortcuts
    if (ctrlKey && altKey) {
      this.handleAccessibilityShortcuts(event);
    }
  }

  /**
   * Handle escape key for modal/menu closure
   */
  private handleEscapeKey(): void {
    // Close any open modals or menus
    const doc = getDocument();
    if (!doc) {
      return;
    }

    const modals = doc.querySelectorAll('[role="dialog"], [role="menu"]');
    modals.forEach(modal => {
      if (modal.hasAttribute('open') || !modal.hasAttribute('hidden')) {
        (modal as HTMLElement).click(); // Trigger close
      }
    });
  }

  /**
   * Handle arrow key navigation on tactical board
   */
  private handleArrowKeyNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    if (target.classList.contains('player-token') || target.closest('.player-token')) {
      event.preventDefault();

      const direction = event.key.replace('Arrow', '').toLowerCase();
      this.screenReader.say(`Moving ${direction}`);

      // Implement actual player movement logic here
      this.movePlayerWithKeyboard(target, direction);
    }
  }

  /**
   * Move player token with keyboard
   */
  private movePlayerWithKeyboard(element: HTMLElement, direction: string): void {
    const moveDistance = 10; // pixels
    const rect = element.getBoundingClientRect();

    let newX = rect.left;
    let newY = rect.top;

    switch (direction) {
      case 'up':
        newY -= moveDistance;
        break;
      case 'down':
        newY += moveDistance;
        break;
      case 'left':
        newX -= moveDistance;
        break;
      case 'right':
        newX += moveDistance;
        break;
    }

    // Apply new position (this would integrate with the actual movement system)
    element.style.transform = `translate(${newX}px, ${newY}px)`;

    // Announce new position
    this.screenReader.say(
      `Player moved ${direction} to position ${Math.round(newX)}, ${Math.round(newY)}`
    );
  }

  /**
   * Handle tab navigation
   */
  private handleTabNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(event.target as HTMLElement);

    if (currentIndex === -1) {
      return;
    }

    let nextIndex;
    if (event.shiftKey) {
      nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex === focusableElements.length - 1 ? 0 : currentIndex + 1;
    }

    event.preventDefault();
    focusableElements[nextIndex].focus();
  }

  /**
   * Get all focusable elements
   */
  private getFocusableElements(): HTMLElement[] {
    const selector = `
      a[href],
      button:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"]),
      [role="button"]:not([disabled])
    `;

    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Handle accessibility shortcuts
   */
  private handleAccessibilityShortcuts(event: KeyboardEvent): void {
    const { key } = event;

    switch (key) {
      case 'h': // Toggle high contrast
        this.toggleHighContrast();
        break;
      case 't': // Toggle text size
        this.cycleTextSize();
        break;
      case 's': // Toggle screen reader announcements
        this.toggleScreenReaderAnnouncements();
        break;
      case 'r': // Read current focus
        this.readCurrentFocus();
        break;
    }
  }

  /**
   * Handle focus in events
   */
  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;

    // Add focus visible class
    target.classList.add('focus-visible');

    // Announce focused element to screen reader
    if (this.config.enableVoiceAnnouncements) {
      this.announceElement(target);
    }

    // Track focus for management
    this.focusManagementStack.push(target);
  }

  /**
   * Handle focus out events
   */
  private handleFocusOut(event: FocusEvent): void {
    const target = event.target as HTMLElement;

    // Remove focus visible class
    target.classList.remove('focus-visible');
  }

  /**
   * Announce element to screen reader
   */
  private announceElement(element: HTMLElement): void {
    let announcement = '';

    // Get element type
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    const label =
      element.getAttribute('aria-label') ||
      element.getAttribute('title') ||
      element.textContent?.trim() ||
      'Unlabeled element';

    announcement = `${label}, ${role}`;

    // Add state information
    if (element.getAttribute('aria-expanded')) {
      const expanded = element.getAttribute('aria-expanded') === 'true';
      announcement += `, ${expanded ? 'expanded' : 'collapsed'}`;
    }

    if (element.getAttribute('aria-selected')) {
      const selected = element.getAttribute('aria-selected') === 'true';
      announcement += `, ${selected ? 'selected' : 'not selected'}`;
    }

    this.screenReader.say(announcement, 'polite');
  }

  /**
   * Toggle high contrast mode
   */
  private toggleHighContrast(): void {
    this.config.enableHighContrast = !this.config.enableHighContrast;
    document.body.classList.toggle('high-contrast', this.config.enableHighContrast);

    this.screenReader.say(
      `High contrast ${this.config.enableHighContrast ? 'enabled' : 'disabled'}`,
      'assertive'
    );
  }

  /**
   * Cycle through text sizes
   */
  private cycleTextSize(): void {
    const sizes: Array<AccessibilityConfig['textSize']> = [
      'small',
      'medium',
      'large',
      'extra-large',
    ];
    const currentIndex = sizes.indexOf(this.config.textSize);
    const nextIndex = (currentIndex + 1) % sizes.length;

    document.body.classList.remove(`text-size-${this.config.textSize}`);
    this.config.textSize = sizes[nextIndex];
    document.body.classList.add(`text-size-${this.config.textSize}`);

    this.screenReader.say(`Text size set to ${this.config.textSize}`, 'assertive');
  }

  /**
   * Toggle screen reader announcements
   */
  private toggleScreenReaderAnnouncements(): void {
    this.config.enableVoiceAnnouncements = !this.config.enableVoiceAnnouncements;

    this.screenReader.say(
      `Voice announcements ${this.config.enableVoiceAnnouncements ? 'enabled' : 'disabled'}`,
      'assertive'
    );
  }

  /**
   * Read current focus
   */
  private readCurrentFocus(): void {
    const focusedElement = document.activeElement as HTMLElement;
    if (focusedElement) {
      this.announceElement(focusedElement);
    } else {
      this.screenReader.say('No element is currently focused', 'polite');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    this.setupAccessibilityStyles(); // Reapply styles
  }

  /**
   * Get screen reader instance
   */
  getScreenReader(): ScreenReaderManager {
    return this.screenReader;
  }
}

/**
 * React Hooks for Mobile Accessibility
 */

/**
 * Hook for screen reader announcements
 */
export const useScreenReader = () => {
  const screenReader = useRef(ScreenReaderManager.getInstance());

  const announce = useCallback(
    (
      message: string,
      type: AnnouncementType = 'polite',
      priority: 'low' | 'medium' | 'high' = 'medium'
    ) => {
      screenReader.current.say(message, type, priority);
    },
    []
  );

  const announceTacticalAction = useCallback((action: string, details?: string) => {
    screenReader.current.announceTacticalAction(action, details);
  }, []);

  const announceFormationChange = useCallback((formationName: string, playerCount: number) => {
    screenReader.current.announceFormationChange(formationName, playerCount);
  }, []);

  const announcePlayerAction = useCallback(
    (playerName: string, action: string, position?: string) => {
      screenReader.current.announcePlayerAction(playerName, action, position);
    },
    []
  );

  return {
    announce,
    announceTacticalAction,
    announceFormationChange,
    announcePlayerAction,
  };
};

/**
 * Hook for accessibility configuration
 */
export const useAccessibilityConfig = () => {
  const accessibilityManager = useRef(MobileAccessibilityManager.getInstance());
  const [config, setConfig] = useState<AccessibilityConfig>(
    accessibilityManager.current.getConfig()
  );

  const updateConfig = useCallback((updates: Partial<AccessibilityConfig>) => {
    accessibilityManager.current.updateConfig(updates);
    setConfig(accessibilityManager.current.getConfig());
  }, []);

  return {
    config,
    updateConfig,
  };
};

/**
 * Hook for focus management
 */
export const useFocusManagement = () => {
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return { trapFocus };
};

/**
 * Hook for touch accessibility
 */
export const useTouchAccessibility = () => {
  const capabilities = useMobileCapabilities();

  const getTouchTargetProps = useCallback((size: keyof typeof TOUCH_TARGETS = 'COMFORTABLE') => {
    const targetSize = TOUCH_TARGETS[size];

    return {
      style: {
        minWidth: `${targetSize}px`,
        minHeight: `${targetSize}px`,
        touchAction: 'manipulation',
      },
      role: 'button',
      tabIndex: 0,
    };
  }, []);

  const getAccessibleLabel = useCallback(
    (element: { name?: string; position?: string; action?: string; state?: string }) => {
      let label = '';

      if (element.name) {
        label += element.name;
      }

      if (element.position) {
        label += ` (${element.position})`;
      }

      if (element.action) {
        label += ` - ${element.action}`;
      }

      if (element.state) {
        label += `, ${element.state}`;
      }

      return label;
    },
    []
  );

  return {
    getTouchTargetProps,
    getAccessibleLabel,
    isTouch: capabilities.supportsTouchEvents,
  };
};

// Global instances
export const screenReaderManager = ScreenReaderManager.getInstance();
export const accessibilityManager = MobileAccessibilityManager.getInstance();

// Utility functions
export const initializeMobileAccessibility = (): void => {
  // Initialize accessibility manager
  accessibilityManager.getConfig();

  console.log('[Accessibility] Mobile accessibility initialized');
};

/**
 * Calculate WCAG 2.1 contrast ratio between two colors
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is lighter and L2 is darker
 * @param foreground - CSS color string (hex, rgb, rgba, or named color)
 * @param background - CSS color string (hex, rgb, rgba, or named color)
 * @returns Contrast ratio (1-21)
 */
export const getContrastRatio = (foreground: string, background: string): number => {
  const getLuminance = (color: string): number => {
    // Parse color to RGB
    const rgb = parseColor(color);
    if (!rgb) {
      return 0;
    }

    // Convert RGB to relative luminance using WCAG formula
    const [r, g, b] = rgb.map(channel => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const parseColor = (color: string): [number, number, number] | null => {
    // Handle hex colors (#RGB, #RRGGBB, #RRGGBBAA)
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16),
        ];
      }
      if (hex.length === 6 || hex.length === 8) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16),
        ];
      }
    }

    // Handle rgb/rgba format
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
      return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
    }

    // Handle common named colors
    const namedColors: Record<string, [number, number, number]> = {
      white: [255, 255, 255],
      black: [0, 0, 0],
      red: [255, 0, 0],
      green: [0, 128, 0],
      blue: [0, 0, 255],
      yellow: [255, 255, 0],
      cyan: [0, 255, 255],
      magenta: [255, 0, 255],
      gray: [128, 128, 128],
      grey: [128, 128, 128],
      silver: [192, 192, 192],
      maroon: [128, 0, 0],
      olive: [128, 128, 0],
      lime: [0, 255, 0],
      aqua: [0, 255, 255],
      teal: [0, 128, 128],
      navy: [0, 0, 128],
      fuchsia: [255, 0, 255],
      purple: [128, 0, 128],
    };

    const normalized = color.toLowerCase().trim();
    if (normalized in namedColors) {
      return namedColors[normalized];
    }

    // Default to black if unable to parse
    return [0, 0, 0];
  };

  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);

  // Calculate contrast ratio (lighter / darker)
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

export const ensureContrastCompliance = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const requirement = level === 'AA' ? CONTRAST_RATIOS.AA_NORMAL : CONTRAST_RATIOS.AAA_NORMAL;

  return ratio >= requirement;
};

export default {
  ScreenReaderManager,
  MobileAccessibilityManager,
  useScreenReader,
  useAccessibilityConfig,
  useFocusManagement,
  useTouchAccessibility,
  TOUCH_TARGETS,
  CONTRAST_RATIOS,
  screenReaderManager,
  accessibilityManager,
  initializeMobileAccessibility,
  getContrastRatio,
  ensureContrastCompliance,
};
