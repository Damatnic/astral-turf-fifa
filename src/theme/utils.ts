/**
 * Styled Component Utilities
 *
 * Reusable styled components and utility functions for common UI patterns.
 */

import React from 'react';
import { colors } from './tokens';

// ============================================================================
// BUTTON VARIANTS
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
}

export function getButtonStyles({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
}: ButtonStyleProps): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition-fast) var(--easing-default)',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
  };

  const sizes = {
    sm: {
      padding: 'var(--spacing-2) var(--spacing-3)',
      fontSize: '0.875rem',
      height: '32px',
    },
    md: {
      padding: 'var(--spacing-3) var(--spacing-4)',
      fontSize: '1rem',
      height: '40px',
    },
    lg: {
      padding: 'var(--spacing-4) var(--spacing-6)',
      fontSize: '1.125rem',
      height: '48px',
    },
  };

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: 'var(--color-brand-primary)',
      color: 'var(--color-text-inverse)',
    },
    secondary: {
      background: 'var(--color-bg-secondary)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-default)',
    },
    success: {
      background: 'var(--color-success)',
      color: 'var(--color-text-inverse)',
    },
    warning: {
      background: 'var(--color-warning)',
      color: 'var(--color-text-inverse)',
    },
    error: {
      background: 'var(--color-error)',
      color: 'var(--color-text-inverse)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-primary)',
      border: '1px solid transparent',
    },
  };

  return {
    ...base,
    ...sizes[size],
    ...variants[variant],
  };
}

// ============================================================================
// INPUT STYLES
// ============================================================================

export interface InputStyleProps {
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function getInputStyles({
  error = false,
  disabled = false,
  fullWidth = false,
}: InputStyleProps): React.CSSProperties {
  return {
    width: fullWidth ? '100%' : 'auto',
    padding: 'var(--spacing-3) var(--spacing-4)',
    fontSize: '1rem',
    lineHeight: 1.5,
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-bg-primary)',
    border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border-default)'}`,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast) var(--easing-default)',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.5 : 1,
  };
}

// ============================================================================
// CARD STYLES
// ============================================================================

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardStyleProps {
  variant?: CardVariant;
  padding?: keyof typeof import('./tokens').spacing;
  clickable?: boolean;
}

export function getCardStyles({
  variant = 'default',
  padding = 4,
  clickable = false,
}: CardStyleProps): React.CSSProperties {
  const base: React.CSSProperties = {
    backgroundColor: 'var(--color-bg-elevated)',
    borderRadius: 'var(--radius-lg)',
    padding: `var(--spacing-${padding})`,
    transition: 'all var(--transition-fast) var(--easing-default)',
    cursor: clickable ? 'pointer' : 'default',
  };

  const variants: Record<CardVariant, React.CSSProperties> = {
    default: {
      border: '1px solid var(--color-border-light)',
    },
    elevated: {
      boxShadow: 'var(--shadow-md)',
    },
    outlined: {
      border: '2px solid var(--color-border-default)',
    },
  };

  return {
    ...base,
    ...variants[variant],
  };
}

// ============================================================================
// BADGE STYLES
// ============================================================================

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeStyleProps {
  variant?: BadgeVariant;
}

export function getBadgeStyles({ variant = 'neutral' }: BadgeStyleProps): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-1) var(--spacing-2)',
    fontSize: '0.75rem',
    fontWeight: 600,
    borderRadius: 'var(--radius-full)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const variants: Record<BadgeVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: colors.primary[500],
      color: colors.white,
    },
    success: {
      backgroundColor: colors.success[500],
      color: colors.white,
    },
    warning: {
      backgroundColor: colors.warning[500],
      color: colors.white,
    },
    error: {
      backgroundColor: colors.error[500],
      color: colors.white,
    },
    neutral: {
      backgroundColor: 'var(--color-bg-secondary)',
      color: 'var(--color-text-secondary)',
    },
  };

  return {
    ...base,
    ...variants[variant],
  };
}

// ============================================================================
// TOOLTIP STYLES
// ============================================================================

export function getTooltipStyles(): React.CSSProperties {
  return {
    position: 'absolute',
    zIndex: 1070,
    padding: 'var(--spacing-2) var(--spacing-3)',
    fontSize: '0.875rem',
    color: 'var(--color-text-inverse)',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 'var(--radius-md)',
    pointerEvents: 'none',
    maxWidth: '200px',
    wordWrap: 'break-word',
  };
}

// ============================================================================
// MODAL STYLES
// ============================================================================

export function getModalBackdropStyles(): React.CSSProperties {
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--color-bg-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1040,
  };
}

export function getModalContentStyles(): React.CSSProperties {
  return {
    backgroundColor: 'var(--color-bg-elevated)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--spacing-6)',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: 'var(--shadow-2xl)',
    zIndex: 1050,
  };
}

// ============================================================================
// GRADIENT UTILITIES
// ============================================================================

export function getGradientBackground(
  startColor: string,
  endColor: string,
  angle: number = 135
): string {
  return `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
}

export const brandGradient = getGradientBackground(colors.primary[500], colors.secondary[500]);
export const successGradient = getGradientBackground(colors.success[400], colors.success[600]);
export const warningGradient = getGradientBackground(colors.warning[400], colors.warning[600]);
export const errorGradient = getGradientBackground(colors.error[400], colors.error[600]);

// ============================================================================
// GLASS MORPHISM UTILITIES
// ============================================================================

export function getGlassMorphismStyles(
  blur: number = 10,
  opacity: number = 0.1
): React.CSSProperties {
  return {
    background: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };
}

// ============================================================================
// POSITION UTILITIES
// ============================================================================

export function getPositionColor(position: string): string {
  const positionColors = colors.positions as Record<string, string>;
  return positionColors[position] || colors.neutral[500];
}

export function getMoraleColor(morale: string): string {
  const moraleColors = colors.morale as Record<string, string>;
  const key = morale.toLowerCase().replace(/\s+/g, '');
  return moraleColors[key] || colors.neutral[500];
}

export function getRoleColor(role: string): string {
  const roleColors = colors.roles as Record<string, string>;
  return roleColors[role] || colors.roles.default;
}

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

export function getResponsiveValue<T>(
  values: { xs?: T; sm?: T; md?: T; lg?: T; xl?: T; '2xl'?: T },
  defaultValue: T
): string {
  const breakpoints = {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  };

  let css = `${defaultValue}`;

  Object.entries(values).forEach(([breakpoint, value]) => {
    if (value !== undefined) {
      const bp = breakpoints[breakpoint as keyof typeof breakpoints];
      css += `; @media (min-width: ${bp}) { ${value} }`;
    }
  });

  return css;
}

// ============================================================================
// TRUNCATE TEXT UTILITIES
// ============================================================================

export function getTruncateStyles(lines: number = 1): React.CSSProperties {
  if (lines === 1) {
    return {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    };
  }

  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
}
