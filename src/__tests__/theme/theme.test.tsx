/**
 * Unit Tests for Theme System
 *
 * Tests theme tokens, utilities, and providers
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  transitions,
  breakpoints,
  lightTheme,
  darkTheme,
  getTheme,
  ThemeProvider,
  useTheme,
  useThemeMode,
  useThemeToggle,
} from '../../theme';

// ============================================================================
// TOKEN TESTS
// ============================================================================

describe('Design Tokens', () => {
  describe('colors', () => {
    it('should export primary color palette', () => {
      expect(colors.primary).toBeDefined();
      expect(colors.primary[500]).toBe('#00f5ff');
      expect(Object.keys(colors.primary)).toHaveLength(10);
    });

    it('should export secondary color palette', () => {
      expect(colors.secondary).toBeDefined();
      expect(colors.secondary[500]).toBe('#0080ff');
      expect(Object.keys(colors.secondary)).toHaveLength(10);
    });

    it('should export semantic color palettes', () => {
      expect(colors.success).toBeDefined();
      expect(colors.warning).toBeDefined();
      expect(colors.error).toBeDefined();
      expect(colors.info).toBeDefined();
    });

    it('should export football-specific colors', () => {
      expect(colors.positions).toBeDefined();
      expect(colors.positions.ST).toBe('#ef4444'); // Red for striker
      expect(colors.morale).toBeDefined();
      expect(colors.morale.excellent).toBe('#10b981');
    });
  });

  describe('typography', () => {
    it('should export font families', () => {
      expect(typography.fontFamily.sans).toBeDefined();
      expect(typography.fontFamily.mono).toBeDefined();
    });

    it('should export font sizes', () => {
      expect(typography.fontSize.xs).toBe('0.75rem');
      expect(typography.fontSize.base).toBe('1rem');
      expect(typography.fontSize['5xl']).toBe('3rem');
    });

    it('should export font weights', () => {
      expect(typography.fontWeight.light).toBe(300);
      expect(typography.fontWeight.normal).toBe(400);
      expect(typography.fontWeight.bold).toBe(700);
    });
  });

  describe('spacing', () => {
    it('should export spacing scale', () => {
      expect(spacing[0]).toBe('0');
      expect(spacing[4]).toBe('1rem');
      expect(spacing[8]).toBe('2rem');
    });

    it('should have correct number of spacing units', () => {
      expect(Object.keys(spacing)).toHaveLength(13); // 0-32
    });
  });

  describe('shadows', () => {
    it('should export standard shadows', () => {
      expect(shadows.sm).toBeDefined();
      expect(shadows.md).toBeDefined();
      expect(shadows.lg).toBeDefined();
    });

    it('should export glow effects', () => {
      expect(shadows.glow.primary).toBeDefined();
      expect(shadows.glow.success).toBeDefined();
    });
  });

  describe('transitions', () => {
    it('should export duration presets', () => {
      expect(transitions.duration.instant).toBe('0ms');
      expect(transitions.duration.fast).toBe('150ms');
      expect(transitions.duration.normal).toBe('250ms');
    });

    it('should export easing functions', () => {
      expect(transitions.easing.linear).toBeDefined();
      expect(transitions.easing.easeIn).toBeDefined();
      expect(transitions.easing.spring).toBeDefined();
    });
  });
});

// ============================================================================
// THEME TESTS
// ============================================================================

describe('Theme Configurations', () => {
  describe('lightTheme', () => {
    it('should have correct mode', () => {
      expect(lightTheme.mode).toBe('light');
    });

    it('should have text colors', () => {
      expect(lightTheme.colors.text.primary).toBeDefined();
      expect(lightTheme.colors.text.secondary).toBeDefined();
    });

    it('should have background colors', () => {
      expect(lightTheme.colors.background.primary).toBeDefined();
      expect(lightTheme.colors.background.secondary).toBeDefined();
    });
  });

  describe('darkTheme', () => {
    it('should have correct mode', () => {
      expect(darkTheme.mode).toBe('dark');
    });

    it('should have dark background', () => {
      expect(darkTheme.colors.background.primary).toBe('#1a1a2e');
    });

    it('should have cyan brand color', () => {
      expect(darkTheme.colors.brand.primary).toBe('#00f5ff');
    });
  });

  describe('getTheme', () => {
    it('should return light theme for light mode', () => {
      const theme = getTheme('light');
      expect(theme.mode).toBe('light');
    });

    it('should return dark theme for dark mode', () => {
      const theme = getTheme('dark');
      expect(theme.mode).toBe('dark');
    });
  });
});

// ============================================================================
// THEME PROVIDER TESTS
// ============================================================================

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset document theme attribute
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useTheme hook', () => {
    it('should provide theme context', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBeDefined();
      expect(result.current.mode).toBeDefined();
      expect(result.current.toggleTheme).toBeDefined();
      expect(result.current.setTheme).toBeDefined();
    });

    it('should default to dark mode', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.mode).toBe('dark');
    });

    it('should use custom default mode', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider defaultMode="light">{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.mode).toBe('light');
    });
  });

  describe('useThemeMode hook', () => {
    it('should return current mode', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useThemeMode(), { wrapper });

      expect(result.current).toBe('dark');
    });
  });

  describe('useThemeToggle hook', () => {
    it('should toggle theme mode', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(
        () => ({
          mode: useThemeMode(),
          toggle: useThemeToggle(),
        }),
        { wrapper },
      );

      expect(result.current.mode).toBe('dark');

      act(() => {
        result.current.toggle();
      });

      expect(result.current.mode).toBe('light');

      act(() => {
        result.current.toggle();
      });

      expect(result.current.mode).toBe('dark');
    });
  });

  describe('localStorage persistence', () => {
    it('should save theme preference to localStorage', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider storageKey="test-theme">{children}</ThemeProvider>
      );

      const { result } = renderHook(
        () => ({
          mode: useThemeMode(),
          toggle: useThemeToggle(),
        }),
        { wrapper },
      );

      act(() => {
        result.current.toggle();
      });

      const stored = localStorage.getItem('test-theme');
      expect(stored).toBe('light');
    });

    it('should restore theme from localStorage', () => {
      localStorage.setItem('test-theme', 'light');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider storageKey="test-theme">{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useThemeMode(), { wrapper });

      expect(result.current).toBe('light');
    });
  });

  describe('data-theme attribute', () => {
    it('should set data-theme attribute on document', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      renderHook(() => useTheme(), { wrapper });

      const dataTheme = document.documentElement.getAttribute('data-theme');
      expect(dataTheme).toBe('dark');
    });

    it('should update data-theme on mode change', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(
        () => ({
          mode: useThemeMode(),
          toggle: useThemeToggle(),
        }),
        { wrapper },
      );

      act(() => {
        result.current.toggle();
      });

      const dataTheme = document.documentElement.getAttribute('data-theme');
      expect(dataTheme).toBe('light');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Theme Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should work with complete theme switching workflow', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider storageKey="integration-test">{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    // Initial state
    expect(result.current.mode).toBe('dark');
    expect(result.current.theme.colors.background.primary).toBe('#1a1a2e');

    // Toggle to light
    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.mode).toBe('light');
    expect(result.current.theme.colors.background.primary).toBe('#ffffff');
    expect(localStorage.getItem('integration-test')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Toggle back to dark
    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.mode).toBe('dark');
    expect(result.current.theme.colors.background.primary).toBe('#1a1a2e');
    expect(localStorage.getItem('integration-test')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should allow direct theme setting', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.mode).toBe('light');

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.mode).toBe('dark');
  });
});
