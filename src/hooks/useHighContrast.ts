/**
 * High Contrast Mode Hook
 *
 * Provides high-contrast mode support for better accessibility
 * Complies with WCAG 2.1 Success Criterion 1.4.6 (Contrast Enhanced)
 *
 * Features:
 * - Detect system preference (prefers-contrast)
 * - Manual toggle
 * - Persistence via localStorage
 * - CSS class injection
 */

import { useState, useEffect, useCallback } from 'react';

export type ContrastMode = 'normal' | 'high' | 'auto';

interface HighContrastState {
  mode: ContrastMode;
  isHighContrast: boolean;
  systemPreference: boolean;
}

const STORAGE_KEY = 'astral-turf-contrast-mode';

/**
 * Detect system high-contrast preference
 */
function detectSystemPreference(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for prefers-contrast media query
  const prefersContrast = window.matchMedia('(prefers-contrast: more)').matches;
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

  return prefersContrast || prefersHighContrast;
}

/**
 * Get stored contrast mode preference
 */
function getStoredMode(): ContrastMode {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'normal' || stored === 'high' || stored === 'auto') {
    return stored;
  }

  return 'auto';
}

/**
 * Apply high-contrast CSS class to document
 */
function applyHighContrastClass(enabled: boolean) {
  if (typeof document === 'undefined') {
    return;
  }

  if (enabled) {
    document.documentElement.classList.add('high-contrast');
    document.documentElement.setAttribute('data-contrast', 'high');
  } else {
    document.documentElement.classList.remove('high-contrast');
    document.documentElement.setAttribute('data-contrast', 'normal');
  }
}

/**
 * useHighContrast Hook
 *
 * Manages high-contrast mode state and persistence
 *
 * @example
 * ```tsx
 * function Settings() {
 *   const { isHighContrast, mode, setMode, toggle } = useHighContrast();
 *
 *   return (
 *     <div>
 *       <p>Current mode: {mode}</p>
 *       <p>High contrast active: {isHighContrast ? 'Yes' : 'No'}</p>
 *       <button onClick={toggle}>Toggle High Contrast</button>
 *       <select value={mode} onChange={e => setMode(e.target.value)}>
 *         <option value="auto">Auto (Follow System)</option>
 *         <option value="normal">Normal</option>
 *         <option value="high">High Contrast</option>
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useHighContrast() {
  const [state, setState] = useState<HighContrastState>(() => {
    const systemPreference = detectSystemPreference();
    const mode = getStoredMode();
    const isHighContrast = mode === 'high' || (mode === 'auto' && systemPreference);

    return {
      mode,
      isHighContrast,
      systemPreference,
    };
  });

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');

    const handleChange = (e: { matches: boolean }) => {
      setState(prev => {
        const systemPreference = e.matches;
        const isHighContrast = prev.mode === 'high' || (prev.mode === 'auto' && systemPreference);

        return {
          ...prev,
          systemPreference,
          isHighContrast,
        };
      });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply CSS class when state changes
  useEffect(() => {
    applyHighContrastClass(state.isHighContrast);
  }, [state.isHighContrast]);

  // Set contrast mode
  const setMode = useCallback((newMode: ContrastMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);

    setState(prev => {
      const isHighContrast = newMode === 'high' || (newMode === 'auto' && prev.systemPreference);

      return {
        ...prev,
        mode: newMode,
        isHighContrast,
      };
    });
  }, []);

  // Toggle high contrast (cycles through modes)
  const toggle = useCallback(() => {
    setState(prev => {
      let newMode: ContrastMode;

      if (prev.mode === 'normal') {
        newMode = 'high';
      } else if (prev.mode === 'high') {
        newMode = 'auto';
      } else {
        newMode = 'normal';
      }

      localStorage.setItem(STORAGE_KEY, newMode);
      const isHighContrast = newMode === 'high' || (newMode === 'auto' && prev.systemPreference);

      return {
        ...prev,
        mode: newMode,
        isHighContrast,
      };
    });
  }, []);

  // Enable high contrast
  const enable = useCallback(() => {
    setMode('high');
  }, [setMode]);

  // Disable high contrast
  const disable = useCallback(() => {
    setMode('normal');
  }, [setMode]);

  // Reset to auto (follow system)
  const reset = useCallback(() => {
    setMode('auto');
  }, [setMode]);

  return {
    mode: state.mode,
    isHighContrast: state.isHighContrast,
    systemPreference: state.systemPreference,
    setMode,
    toggle,
    enable,
    disable,
    reset,
  };
}

/**
 * High Contrast CSS Utilities
 */
export const highContrastStyles = `
  /* High Contrast Mode Styles */
  .high-contrast {
    /* Enhanced color contrast */
    --color-text: #000000;
    --color-bg: #ffffff;
    --color-primary: #0000ff;
    --color-secondary: #800080;
    --color-success: #006400;
    --color-warning: #ff8c00;
    --color-error: #ff0000;
    --color-border: #000000;
    --color-focus: #0000ff;

    /* Stronger borders */
    --border-width: 2px;
    --border-width-focus: 3px;

    /* Enhanced focus indicators */
    --focus-ring-width: 3px;
    --focus-ring-offset: 2px;
  }

  /* Dark mode high contrast */
  .high-contrast.dark {
    --color-text: #ffffff;
    --color-bg: #000000;
    --color-primary: #00ffff;
    --color-secondary: #ff00ff;
    --color-success: #00ff00;
    --color-warning: #ffff00;
    --color-error: #ff0000;
    --color-border: #ffffff;
    --color-focus: #00ffff;
  }

  /* Text contrast */
  .high-contrast body {
    color: var(--color-text);
    background-color: var(--color-bg);
  }

  /* Links */
  .high-contrast a {
    color: var(--color-primary);
    text-decoration: underline;
    font-weight: 600;
  }

  .high-contrast a:hover {
    color: var(--color-secondary);
    text-decoration: underline;
  }

  /* Buttons */
  .high-contrast button,
  .high-contrast [role="button"] {
    border: var(--border-width) solid var(--color-border);
    font-weight: 600;
  }

  .high-contrast button:focus,
  .high-contrast [role="button"]:focus {
    outline: var(--focus-ring-width) solid var(--color-focus);
    outline-offset: var(--focus-ring-offset);
  }

  /* Form inputs */
  .high-contrast input,
  .high-contrast select,
  .high-contrast textarea {
    border: var(--border-width) solid var(--color-border);
    background-color: var(--color-bg);
    color: var(--color-text);
  }

  .high-contrast input:focus,
  .high-contrast select:focus,
  .high-contrast textarea:focus {
    outline: var(--focus-ring-width) solid var(--color-focus);
    outline-offset: var(--focus-ring-offset);
    border-color: var(--color-focus);
  }

  /* Cards and containers */
  .high-contrast .card,
  .high-contrast .container,
  .high-contrast [class*="card"],
  .high-contrast [class*="container"] {
    border: var(--border-width) solid var(--color-border);
  }

  /* Status colors */
  .high-contrast .success,
  .high-contrast [class*="success"] {
    color: var(--color-success);
    border-color: var(--color-success);
  }

  .high-contrast .warning,
  .high-contrast [class*="warning"] {
    color: var(--color-warning);
    border-color: var(--color-warning);
  }

  .high-contrast .error,
  .high-contrast [class*="error"],
  .high-contrast [class*="danger"] {
    color: var(--color-error);
    border-color: var(--color-error);
  }

  /* Focus indicators (always visible) */
  .high-contrast *:focus {
    outline: var(--focus-ring-width) solid var(--color-focus);
    outline-offset: var(--focus-ring-offset);
  }

  /* Images with borders for context */
  .high-contrast img {
    border: 1px solid var(--color-border);
  }

  /* Enhanced table borders */
  .high-contrast table,
  .high-contrast th,
  .high-contrast td {
    border: var(--border-width) solid var(--color-border);
  }

  /* Remove background images that may interfere */
  .high-contrast * {
    text-shadow: none !important;
    box-shadow: none !important;
  }
`;

export default useHighContrast;
