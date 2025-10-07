/**
 * Theme System - Central Export
 *
 * Export all theme-related modules for easy importing.
 */

// Design Tokens
export {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  transitions,
  breakpoints,
  layout,
} from './tokens';

export type {
  Color,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ZIndex,
  Transitions,
  Breakpoints,
  Layout,
} from './tokens';

// Theme Configuration
export {
  lightTheme,
  darkTheme,
  getTheme,
  generateCSSVariables,
  applyThemeVariables,
  getCSSVariable,
  setCSSVariable,
} from './theme';

export type { ThemeMode, Theme } from './theme';

// Theme Provider & Hooks
export { ThemeProvider, useTheme, useThemeMode, useThemeToggle } from './ThemeProvider';

// Global Styles (import in main file)
import './global.css';
