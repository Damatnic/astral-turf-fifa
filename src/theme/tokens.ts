/**
 * Design System Tokens
 *
 * Centralized design tokens for consistent theming across the application.
 * These tokens follow atomic design principles and provide a single source of truth.
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#e0f9ff',
    100: '#b3f0ff',
    200: '#80e7ff',
    300: '#4ddeff',
    400: '#26d6ff',
    500: '#00f5ff', // Main brand color
    600: '#00d4e6',
    700: '#00b3cc',
    800: '#0092b3',
    900: '#006b80',
  },
  
  // Secondary Brand Colors (Blue)
  secondary: {
    50: '#e6f2ff',
    100: '#b3d9ff',
    200: '#80c0ff',
    300: '#4da7ff',
    400: '#2694ff',
    500: '#0080ff', // Secondary brand color
    600: '#0073e6',
    700: '#0062cc',
    800: '#0051b3',
    900: '#003a80',
  },
  
  // Neutral Colors (Grays)
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Dark Theme Backgrounds
  dark: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    tertiary: '#0f1729',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceHover: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Semantic Colors
  success: {
    50: '#d1fae5',
    100: '#a7f3d0',
    200: '#6ee7b7',
    300: '#34d399',
    400: '#10b981',
    500: '#059669',
    600: '#047857',
    700: '#065f46',
    800: '#064e3b',
    900: '#022c22',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  error: {
    50: '#fee2e2',
    100: '#fecaca',
    200: '#fca5a5',
    300: '#f87171',
    400: '#ef4444',
    500: '#dc2626',
    600: '#b91c1c',
    700: '#991b1b',
    800: '#7f1d1d',
    900: '#450a0a',
  },
  
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Position-specific Colors (Football)
  positions: {
    GK: '#f59e0b',  // Amber - Goalkeeper
    CB: '#3b82f6',  // Blue - Center Back
    LB: '#3b82f6',  // Blue - Left Back
    RB: '#3b82f6',  // Blue - Right Back
    CDM: '#8b5cf6', // Purple - Defensive Mid
    CM: '#10b981',  // Green - Center Mid
    CAM: '#ec4899', // Pink - Attacking Mid
    LM: '#10b981',  // Green - Left Mid
    RM: '#10b981',  // Green - Right Mid
    LW: '#ec4899',  // Pink - Left Wing
    RW: '#ec4899',  // Pink - Right Wing
    ST: '#ef4444',  // Red - Striker
    CF: '#f97316',  // Orange - Center Forward
  },
  
  // Morale Colors
  morale: {
    excellent: '#10b981',
    good: '#3b82f6',
    okay: '#f59e0b',
    poor: '#ef4444',
    veryPoor: '#dc2626',
    terrible: '#991b1b',
  },
  
  // User Role Colors
  roles: {
    admin: '#ff4444',
    coach: '#00f5ff',
    analyst: '#9f7aea',
    player: '#48bb78',
    default: '#a0aec0',
  },
  
  // White/Black
  white: '#ffffff',
  black: '#000000',
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", "Dank Mono", monospace',
  },
  
  // Font Sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  
  // Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Dark theme shadows (with glow)
  glow: {
    primary: '0 0 20px rgba(0, 245, 255, 0.3)',
    secondary: '0 0 20px rgba(0, 128, 255, 0.3)',
    success: '0 0 20px rgba(16, 185, 129, 0.3)',
    warning: '0 0 20px rgba(245, 158, 11, 0.3)',
    error: '0 0 20px rgba(239, 68, 68, 0.3)',
  },
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const zIndex = {
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  // Durations (in milliseconds)
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  
  // Easing Functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  
  // Prebuilt Transitions
  presets: {
    fade: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    scale: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slideUp: 'transform 250ms cubic-bezier(0, 0, 0.2, 1)',
    all: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// LAYOUT
// ============================================================================

export const layout = {
  // Container Max Widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Common Heights
  navbar: '64px',
  toolbar: '56px',
  sidebar: '100vh',
  footer: '80px',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Color = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type ZIndex = typeof zIndex;
export type Transitions = typeof transitions;
export type Breakpoints = typeof breakpoints;
export type Layout = typeof layout;
