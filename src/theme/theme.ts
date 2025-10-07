/**
 * Theme Configuration
 *
 * Provides light and dark theme configurations using design tokens.
 * Supports runtime theme switching and CSS variable generation.
 */

import { colors, typography, spacing, borderRadius, shadows, transitions } from './tokens';

// ============================================================================
// THEME TYPES
// ============================================================================

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    // Text Colors
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      disabled: string;
      inverse: string;
    };
    
    // Background Colors
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      elevated: string;
      overlay: string;
    };
    
    // Border Colors
    border: {
      default: string;
      light: string;
      medium: string;
      heavy: string;
      focus: string;
    };
    
    // Brand Colors
    brand: {
      primary: string;
      primaryHover: string;
      secondary: string;
      secondaryHover: string;
      gradient: string;
    };
    
    // Semantic Colors
    semantic: {
      success: string;
      successLight: string;
      warning: string;
      warningLight: string;
      error: string;
      errorLight: string;
      info: string;
      infoLight: string;
    };
    
    // Interactive States
    interactive: {
      hover: string;
      active: string;
      disabled: string;
      focus: string;
    };
  };
  
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  transitions: typeof transitions;
}

// ============================================================================
// LIGHT THEME
// ============================================================================

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[700],
      tertiary: colors.neutral[500],
      disabled: colors.neutral[400],
      inverse: colors.white,
    },
    
    background: {
      primary: colors.white,
      secondary: colors.neutral[50],
      tertiary: colors.neutral[100],
      elevated: colors.white,
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    border: {
      default: colors.neutral[200],
      light: colors.neutral[100],
      medium: colors.neutral[300],
      heavy: colors.neutral[400],
      focus: colors.primary[500],
    },
    
    brand: {
      primary: colors.info[500],
      primaryHover: colors.info[600],
      secondary: colors.primary[500],
      secondaryHover: colors.primary[600],
      gradient: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.secondary[500]} 100%)`,
    },
    
    semantic: {
      success: colors.success[500],
      successLight: colors.success[50],
      warning: colors.warning[500],
      warningLight: colors.warning[50],
      error: colors.error[400],
      errorLight: colors.error[50],
      info: colors.info[500],
      infoLight: colors.info[50],
    },
    
    interactive: {
      hover: colors.neutral[100],
      active: colors.neutral[200],
      disabled: colors.neutral[100],
      focus: colors.info[100],
    },
  },
  
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
};

// ============================================================================
// DARK THEME
// ============================================================================

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    text: {
      primary: colors.white,
      secondary: 'rgba(255, 255, 255, 0.8)',
      tertiary: 'rgba(255, 255, 255, 0.6)',
      disabled: 'rgba(255, 255, 255, 0.4)',
      inverse: colors.neutral[900],
    },
    
    background: {
      primary: colors.dark.primary,
      secondary: colors.dark.secondary,
      tertiary: colors.dark.tertiary,
      elevated: colors.dark.secondary,
      overlay: 'rgba(0, 0, 0, 0.8)',
    },
    
    border: {
      default: 'rgba(255, 255, 255, 0.1)',
      light: 'rgba(255, 255, 255, 0.05)',
      medium: 'rgba(255, 255, 255, 0.2)',
      heavy: 'rgba(255, 255, 255, 0.3)',
      focus: colors.primary[500],
    },
    
    brand: {
      primary: colors.primary[500],
      primaryHover: colors.primary[400],
      secondary: colors.secondary[500],
      secondaryHover: colors.secondary[400],
      gradient: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.secondary[500]} 100%)`,
    },
    
    semantic: {
      success: colors.success[400],
      successLight: 'rgba(16, 185, 129, 0.1)',
      warning: colors.warning[400],
      warningLight: 'rgba(245, 158, 11, 0.1)',
      error: colors.error[400],
      errorLight: 'rgba(239, 68, 68, 0.1)',
      info: colors.info[400],
      infoLight: 'rgba(59, 130, 246, 0.1)',
    },
    
    interactive: {
      hover: 'rgba(255, 255, 255, 0.1)',
      active: 'rgba(255, 255, 255, 0.15)',
      disabled: 'rgba(255, 255, 255, 0.05)',
      focus: 'rgba(0, 245, 255, 0.2)',
    },
  },
  
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
};

// ============================================================================
// THEME UTILITIES
// ============================================================================

/**
 * Get theme by mode
 */
export function getTheme(mode: ThemeMode): Theme {
  return mode === 'light' ? lightTheme : darkTheme;
}

/**
 * Generate CSS variables from theme
 */
export function generateCSSVariables(theme: Theme): Record<string, string> {
  return {
    // Text Colors
    '--color-text-primary': theme.colors.text.primary,
    '--color-text-secondary': theme.colors.text.secondary,
    '--color-text-tertiary': theme.colors.text.tertiary,
    '--color-text-disabled': theme.colors.text.disabled,
    '--color-text-inverse': theme.colors.text.inverse,
    
    // Background Colors
    '--color-bg-primary': theme.colors.background.primary,
    '--color-bg-secondary': theme.colors.background.secondary,
    '--color-bg-tertiary': theme.colors.background.tertiary,
    '--color-bg-elevated': theme.colors.background.elevated,
    '--color-bg-overlay': theme.colors.background.overlay,
    
    // Border Colors
    '--color-border-default': theme.colors.border.default,
    '--color-border-light': theme.colors.border.light,
    '--color-border-medium': theme.colors.border.medium,
    '--color-border-heavy': theme.colors.border.heavy,
    '--color-border-focus': theme.colors.border.focus,
    
    // Brand Colors
    '--color-brand-primary': theme.colors.brand.primary,
    '--color-brand-primary-hover': theme.colors.brand.primaryHover,
    '--color-brand-secondary': theme.colors.brand.secondary,
    '--color-brand-secondary-hover': theme.colors.brand.secondaryHover,
    '--color-brand-gradient': theme.colors.brand.gradient,
    
    // Semantic Colors
    '--color-success': theme.colors.semantic.success,
    '--color-success-light': theme.colors.semantic.successLight,
    '--color-warning': theme.colors.semantic.warning,
    '--color-warning-light': theme.colors.semantic.warningLight,
    '--color-error': theme.colors.semantic.error,
    '--color-error-light': theme.colors.semantic.errorLight,
    '--color-info': theme.colors.semantic.info,
    '--color-info-light': theme.colors.semantic.infoLight,
    
    // Interactive States
    '--color-interactive-hover': theme.colors.interactive.hover,
    '--color-interactive-active': theme.colors.interactive.active,
    '--color-interactive-disabled': theme.colors.interactive.disabled,
    '--color-interactive-focus': theme.colors.interactive.focus,
    
    // Spacing
    '--spacing-1': theme.spacing[1],
    '--spacing-2': theme.spacing[2],
    '--spacing-3': theme.spacing[3],
    '--spacing-4': theme.spacing[4],
    '--spacing-5': theme.spacing[5],
    '--spacing-6': theme.spacing[6],
    '--spacing-8': theme.spacing[8],
    '--spacing-10': theme.spacing[10],
    '--spacing-12': theme.spacing[12],
    '--spacing-16': theme.spacing[16],
    
    // Border Radius
    '--radius-sm': theme.borderRadius.sm,
    '--radius-md': theme.borderRadius.md,
    '--radius-lg': theme.borderRadius.lg,
    '--radius-xl': theme.borderRadius.xl,
    '--radius-full': theme.borderRadius.full,
    
    // Transitions
    '--transition-fast': `${theme.transitions.duration.fast}ms`,
    '--transition-normal': `${theme.transitions.duration.normal}ms`,
    '--transition-slow': `${theme.transitions.duration.slow}ms`,
    '--easing-default': theme.transitions.easing.easeInOut,
  };
}

/**
 * Apply theme CSS variables to document root
 */
export function applyThemeVariables(theme: Theme): void {
  const variables = generateCSSVariables(theme);
  const root = document.documentElement;
  
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

/**
 * Get CSS variable value
 */
export function getCSSVariable(name: string): string {
  return window.getComputedStyle(document.documentElement).getPropertyValue(name);
}

/**
 * Set CSS variable value
 */
export function setCSSVariable(name: string, value: string): void {
  document.documentElement.style.setProperty(name, value);
}
