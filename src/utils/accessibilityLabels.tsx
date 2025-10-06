/**
 * Accessibility Labels and Descriptions
 *
 * Comprehensive accessibility support for the Astral Turf application
 * including ARIA labels, screen reader descriptions, and keyboard navigation.
 */

import React from 'react';

// Accessibility Label Types
export interface AccessibilityLabels {
  // General UI
  button: (action: string, context?: string) => string;
  link: (destination: string, newTab?: boolean) => string;
  input: (fieldName: string, required?: boolean, format?: string) => string;
  select: (fieldName: string, currentValue?: string) => string;
  modal: (title: string, purpose?: string) => string;
  tooltip: (element: string, description: string) => string;

  // Navigation
  navigation: {
    main: string;
    breadcrumb: (currentPage: string, path: string[]) => string;
    pagination: (currentPage: number, totalPages: number) => string;
    skip: string;
    back: string;
    forward: string;
  };

  // Tactical Board
  tacticalBoard: {
    field: string;
    player: (name: string, position: string, team: string) => string;
    position: (x: number, y: number, position: string) => string;
    formation: (name: string, style: string) => string;
    dragInstruction: string;
    dropZone: (position: string) => string;
    chemistry: (player1: string, player2: string, rating: number) => string;
  };

  // Player Management
  player: {
    card: (name: string, position: string, overall: number) => string;
    attribute: (attributeName: string, value: number, maxValue: number) => string;
    status: (name: string, status: string) => string;
    action: (action: string, playerName: string) => string;
  };

  // AI Analysis
  ai: {
    insight: (type: string, confidence: number) => string;
    recommendation: (description: string, impact: string) => string;
    analysis: (formationName: string, rating: number) => string;
    loading: string;
    error: (error: string) => string;
  };

  // Forms and Controls
  form: {
    required: string;
    optional: string;
    error: (fieldName: string, error: string) => string;
    success: (message: string) => string;
    validation: (fieldName: string, rules: string[]) => string;
  };

  // Data Visualization
  chart: {
    bar: (title: string, value: number, category: string) => string;
    line: (title: string, trend: string) => string;
    pie: (title: string, percentage: number, total: number) => string;
    radar: (title: string, dimensions: string[]) => string;
  };
}

/**
 * Main accessibility labels implementation
 */
export const accessibilityLabels: AccessibilityLabels = {
  // General UI Labels
  button: (action: string, context?: string) => {
    const baseLabel = `${action} button`;
    return context ? `${baseLabel}. ${context}` : baseLabel;
  },

  link: (destination: string, newTab = false) => {
    const baseLabel = `Link to ${destination}`;
    return newTab ? `${baseLabel}. Opens in new tab` : baseLabel;
  },

  input: (fieldName: string, required = false, format?: string) => {
    let label = `${fieldName} input field`;
    if (required) {
      label += '. Required';
    }
    if (format) {
      label += `. Expected format: ${format}`;
    }
    return label;
  },

  select: (fieldName: string, currentValue?: string) => {
    let label = `${fieldName} dropdown`;
    if (currentValue) {
      label += `. Currently selected: ${currentValue}`;
    }
    return label;
  },

  modal: (title: string, purpose?: string) => {
    let label = `${title} dialog`;
    if (purpose) {
      label += `. ${purpose}`;
    }
    return label;
  },

  tooltip: (element: string, description: string) => {
    return `Additional information for ${element}: ${description}`;
  },

  // Navigation Labels
  navigation: {
    main: 'Main navigation menu',

    breadcrumb: (currentPage: string, path: string[]) => {
      const pathString = path.join(' > ');
      return `Breadcrumb navigation. Current location: ${currentPage}. Full path: ${pathString}`;
    },

    pagination: (currentPage: number, totalPages: number) => {
      return `Pagination navigation. Page ${currentPage} of ${totalPages}`;
    },

    skip: 'Skip to main content',
    back: 'Go back to previous page',
    forward: 'Go forward to next page',
  },

  // Tactical Board Labels
  tacticalBoard: {
    field:
      'Interactive soccer field for tactical planning. Use arrow keys to navigate, space to select, and enter to activate elements.',

    player: (name: string, position: string, team: string) => {
      return `Player token for ${name}, ${position} position, ${team} team. Draggable element. Use arrow keys to move, space to select.`;
    },

    position: (x: number, y: number, position: string) => {
      return `Field position at coordinates ${x}, ${y} for ${position} role`;
    },

    formation: (name: string, style: string) => {
      return `Formation: ${name}, tactical style: ${style}. Contains player positions and tactical instructions.`;
    },

    dragInstruction:
      'To move this player: use arrow keys for fine positioning, or drag with mouse to new location',

    dropZone: (position: string) => {
      return `Drop zone for ${position} position. Release player here to assign to this role.`;
    },

    chemistry: (player1: string, player2: string, rating: number) => {
      const quality = rating >= 80 ? 'excellent' : rating >= 60 ? 'good' : 'poor';
      return `Chemistry connection between ${player1} and ${player2}: ${rating} out of 100, ${quality} compatibility`;
    },
  },

  // Player Management Labels
  player: {
    card: (name: string, position: string, overall: number) => {
      return `Player card for ${name}, ${position}, overall rating ${overall} out of 99`;
    },

    attribute: (attributeName: string, value: number, maxValue: number) => {
      const percentage = Math.round((value / maxValue) * 100);
      return `${attributeName}: ${value} out of ${maxValue}, ${percentage} percent`;
    },

    status: (name: string, status: string) => {
      return `${name} status: ${status}`;
    },

    action: (action: string, playerName: string) => {
      return `${action} ${playerName}`;
    },
  },

  // AI Analysis Labels
  ai: {
    insight: (type: string, confidence: number) => {
      const confidenceLevel = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
      return `AI ${type} insight with ${confidenceLevel} confidence level of ${Math.round(confidence * 100)} percent`;
    },

    recommendation: (description: string, impact: string) => {
      return `AI recommendation: ${description}. Expected impact: ${impact}`;
    },

    analysis: (formationName: string, rating: number) => {
      return `AI analysis for ${formationName} formation. Overall tactical rating: ${rating} out of 100`;
    },

    loading: 'AI analysis in progress. Please wait while we evaluate your formation.',

    error: (error: string) => {
      return `AI analysis error: ${error}. Please try again or contact support.`;
    },
  },

  // Form and Control Labels
  form: {
    required: 'This field is required',
    optional: 'This field is optional',

    error: (fieldName: string, error: string) => {
      return `Error in ${fieldName}: ${error}`;
    },

    success: (message: string) => {
      return `Success: ${message}`;
    },

    validation: (fieldName: string, rules: string[]) => {
      return `${fieldName} validation rules: ${rules.join(', ')}`;
    },
  },

  // Data Visualization Labels
  chart: {
    bar: (title: string, value: number, category: string) => {
      return `Bar chart: ${title}. ${category} value is ${value}`;
    },

    line: (title: string, trend: string) => {
      return `Line chart: ${title}. Trend is ${trend}`;
    },

    pie: (title: string, percentage: number, total: number) => {
      return `Pie chart segment: ${title}. ${percentage} percent of ${total}`;
    },

    radar: (title: string, dimensions: string[]) => {
      return `Radar chart: ${title}. Dimensions: ${dimensions.join(', ')}`;
    },
  },
};

/**
 * Keyboard Navigation Instructions
 */
export const keyboardInstructions = {
  general: {
    navigation: 'Use Tab to navigate between elements, Enter to activate, Escape to close',
    selection: 'Use arrow keys to navigate lists, Space to select items',
    forms: 'Use Tab to move between fields, Enter to submit forms',
  },

  tacticalBoard: {
    playerMovement:
      'Arrow keys: Move player in small increments. Shift + Arrow: Move in larger steps',
    selection:
      'Tab: Cycle through players. Space: Select/deselect player. Enter: Open player details',
    formations: 'F: Cycle formation templates. Ctrl+S: Save formation. Ctrl+Z: Undo last action',
  },

  modals: {
    navigation: 'Tab: Navigate within modal. Escape: Close modal. Enter: Confirm action',
    focus: 'Focus automatically moves to modal when opened, returns to trigger when closed',
  },
};

/**
 * Screen Reader Announcements
 */
export const screenReaderAnnouncements = {
  navigation: {
    pageChange: (page: string) => `Navigated to ${page} page`,
    modalOpen: (title: string) => `${title} dialog opened`,
    modalClose: (title: string) => `${title} dialog closed`,
  },

  actions: {
    playerMoved: (player: string, position: string) => `${player} moved to ${position}`,
    formationChanged: (formation: string) => `Formation changed to ${formation}`,
    analysisComplete: (rating: number) =>
      `AI analysis complete. Formation rating: ${rating} out of 100`,
  },

  states: {
    loading: (context: string) => `Loading ${context}`,
    error: (error: string) => `Error: ${error}`,
    success: (message: string) => `Success: ${message}`,
  },
};

/**
 * ARIA Live Region Types
 */
export const liveRegionTypes = {
  polite: 'polite', // Announced when user is idle
  assertive: 'assertive', // Announced immediately
  off: 'off', // Not announced
} as const;

/**
 * Accessibility Helper Functions
 */
export const accessibilityHelpers = {
  /**
   * Generate comprehensive ARIA label for complex elements
   */
  generateAriaLabel: (
    elementType: string,
    primaryInfo: string,
    secondaryInfo?: string,
    interactionHint?: string
  ): string => {
    let label = `${elementType}: ${primaryInfo}`;
    if (secondaryInfo) {
      label += `. ${secondaryInfo}`;
    }
    if (interactionHint) {
      label += `. ${interactionHint}`;
    }
    return label;
  },

  /**
   * Create role description for custom elements
   */
  roleDescription: (customRole: string, standardRole?: string): string => {
    return standardRole ? `${customRole} ${standardRole}` : customRole;
  },

  /**
   * Generate progress announcement
   */
  progressAnnouncement: (current: number, total: number, context: string): string => {
    const percentage = Math.round((current / total) * 100);
    return `${context} progress: ${current} of ${total}, ${percentage} percent complete`;
  },

  /**
   * Format error messages for screen readers
   */
  formatError: (fieldName: string, errorType: string, details?: string): string => {
    let message = `Error in ${fieldName}: ${errorType}`;
    if (details) {
      message += `. ${details}`;
    }
    return message;
  },

  /**
   * Create landmark descriptions
   */
  landmarkDescription: (landmarkType: string, purpose: string): string => {
    return `${landmarkType} landmark: ${purpose}`;
  },

  /**
   * Generate table headers and captions
   */
  tableAccessibility: (
    caption: string,
    headers: string[],
    rowCount: number
  ): {
    caption: string;
    summary: string;
  } => ({
    caption,
    summary: `Table with ${headers.length} columns and ${rowCount} rows. Column headers: ${headers.join(', ')}`,
  }),

  /**
   * Format numerical data for screen readers
   */
  formatNumber: (value: number, context: string, unit?: string): string => {
    const unitText = unit ? ` ${unit}` : '';
    return `${context}: ${value}${unitText}`;
  },
};

/**
 * Accessibility Settings
 */
export const accessibilitySettings = {
  focusIndicator: {
    width: '2px',
    style: 'solid',
    color: '#2563eb',
    offset: '2px',
  },

  minimumTouchTarget: {
    width: '44px',
    height: '44px',
  },

  colorContrast: {
    normal: '4.5:1',
    large: '3:1',
    nonText: '3:1',
  },

  animation: {
    reducedMotion: 'prefers-reduced-motion: reduce',
    maxDuration: '0.2s',
  },
};

/**
 * Hook for managing accessibility announcements
 */
export const useAccessibilityAnnouncement = () => {
  const [announcement, setAnnouncement] = React.useState('');
  const [liveRegionType, setLiveRegionType] = React.useState<'polite' | 'assertive'>('polite');

  const announce = React.useCallback((message: string, urgent = false) => {
    setLiveRegionType(urgent ? 'assertive' : 'polite');
    setAnnouncement(message);

    // Clear announcement after a delay to allow for repeat announcements
    setTimeout(() => setAnnouncement(''), 100);
  }, []);

  return {
    announcement,
    liveRegionType,
    announce,
  };
};

/**
 * Component for accessibility announcements
 */
export const AccessibilityAnnouncer: React.FC<{
  announcement: string;
  liveRegionType: 'polite' | 'assertive';
}> = ({ announcement, liveRegionType }) => (
  <div role="status" aria-live={liveRegionType} aria-atomic="true" className="sr-only">
    {announcement}
  </div>
);

/**
 * Generate skip links for better navigation
 */
export const generateSkipLinks = () => [
  { href: '#main-content', text: 'Skip to main content' },
  { href: '#navigation', text: 'Skip to navigation' },
  { href: '#search', text: 'Skip to search' },
  { href: '#footer', text: 'Skip to footer' },
];

/**
 * Comprehensive accessibility validation
 */
export const validateAccessibility = (
  element: HTMLElement
): {
  passed: boolean;
  issues: string[];
  suggestions: string[];
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for ARIA labels
  if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
    if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
      issues.push('Interactive element missing accessible name');
      suggestions.push('Add aria-label or aria-labelledby attribute');
    }
  }

  // Check for keyboard accessibility
  if (element.tabIndex < 0 && (element.tagName === 'BUTTON' || element.tagName === 'A')) {
    issues.push('Interactive element not keyboard accessible');
    suggestions.push('Ensure tabIndex is 0 or greater for keyboard navigation');
  }

  // Check for sufficient color contrast (simplified check)
  const computedStyle = window.getComputedStyle(element);
  const color = computedStyle.color;
  const backgroundColor = computedStyle.backgroundColor;

  if (color === backgroundColor) {
    issues.push('Insufficient color contrast detected');
    suggestions.push('Ensure text has sufficient contrast against background');
  }

  // Check for proper heading hierarchy
  if (element.tagName.match(/^H[1-6]$/)) {
    const level = parseInt(element.tagName.charAt(1));
    const prevHeading = element.previousElementSibling?.tagName.match(/^H[1-6]$/);

    if (prevHeading) {
      const prevLevel = parseInt(prevHeading[0].charAt(1));
      if (level > prevLevel + 1) {
        issues.push('Improper heading hierarchy');
        suggestions.push('Avoid skipping heading levels');
      }
    }
  }

  return {
    passed: issues.length === 0,
    issues,
    suggestions,
  };
};

export default {
  accessibilityLabels,
  keyboardInstructions,
  screenReaderAnnouncements,
  liveRegionTypes,
  accessibilityHelpers,
  accessibilitySettings,
  useAccessibilityAnnouncement,
  AccessibilityAnnouncer,
  generateSkipLinks,
  validateAccessibility,
};
