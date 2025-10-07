/**
 * Theme Provider Component
 *
 * React context provider for theme management with automatic CSS variable application.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Theme, ThemeMode, lightTheme, darkTheme, applyThemeVariables } from './theme';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================================================
// THEME PROVIDER
// ============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'dark',
  storageKey = 'astral-turf-theme',
}) => {
  // Initialize theme from localStorage or default
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to read theme from localStorage:', error);
    }
    return defaultMode;
  });

  const theme = mode === 'light' ? lightTheme : darkTheme;

  // Apply theme CSS variables on mount and mode change
  useEffect(() => {
    applyThemeVariables(theme);
    
    // Also set data-theme attribute for CSS targeting
    document.documentElement.setAttribute('data-theme', mode);
    
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, mode);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [theme, mode, storageKey]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Set specific theme
  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  const value: ThemeContextValue = {
    theme,
    mode,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ============================================================================
// THEME HOOK
// ============================================================================

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * Hook to get current theme mode
 */
export function useThemeMode(): ThemeMode {
  const { mode } = useTheme();
  return mode;
}

/**
 * Hook to get theme toggle function
 */
export function useThemeToggle(): () => void {
  const { toggleTheme } = useTheme();
  return toggleTheme;
}
