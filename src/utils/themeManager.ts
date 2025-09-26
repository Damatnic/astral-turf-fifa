/**
 * Advanced Theme Management System for Astral Turf
 *
 * Comprehensive theming with perfect dark/light modes, custom themes,
 * accessibility features, and user preferences.
 */

export type ThemeMode = 'light' | 'dark' | 'auto' | 'high-contrast' | 'custom';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'football';

export interface ThemeColors {
  // Primary colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };

  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    overlay: string;
  };

  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
  };

  // Border colors
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
    success: string;
  };

  // Status colors
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // Interactive states
  interactive: {
    hover: string;
    active: string;
    selected: string;
    disabled: string;
  };

  // Football-specific colors
  football: {
    field: string;
    fieldLines: string;
    homeTeam: string;
    awayTeam: string;
    ball: string;
  };
}

export interface ThemeConfig {
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
  fonts: {
    sans: string[];
    mono: string[];
    display: string[];
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

export interface ThemePreferences {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  customColors?: Partial<ThemeColors>;
}

// Predefined theme configurations
const THEME_COLORS: Record<ColorScheme, Partial<ThemeColors>> = {
  blue: {
    primary: {
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
      950: '#172554',
    },
  },
  green: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
  },
  purple: {
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
    },
  },
  orange: {
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
    },
  },
  football: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    football: {
      field: '#22c55e',
      fieldLines: '#ffffff',
      homeTeam: '#3b82f6',
      awayTeam: '#ef4444',
      ball: '#ffffff',
    },
  },
};

const LIGHT_THEME_BASE: ThemeColors = {
  primary: THEME_COLORS.blue.primary!,
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    inverse: '#ffffff',
    disabled: '#94a3b8',
  },
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    focus: '#3b82f6',
    error: '#ef4444',
    success: '#22c55e',
  },
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  interactive: {
    hover: '#f1f5f9',
    active: '#e2e8f0',
    selected: '#dbeafe',
    disabled: '#f8fafc',
  },
  football: {
    field: '#22c55e',
    fieldLines: '#ffffff',
    homeTeam: '#3b82f6',
    awayTeam: '#ef4444',
    ball: '#ffffff',
  },
};

const DARK_THEME_BASE: ThemeColors = {
  primary: THEME_COLORS.blue.primary!,
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    elevated: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#e2e8f0',
    tertiary: '#cbd5e1',
    inverse: '#0f172a',
    disabled: '#64748b',
  },
  border: {
    primary: 'rgba(148, 163, 184, 0.2)',
    secondary: 'rgba(148, 163, 184, 0.3)',
    focus: '#3b82f6',
    error: '#ef4444',
    success: '#22c55e',
  },
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  interactive: {
    hover: 'rgba(148, 163, 184, 0.1)',
    active: 'rgba(148, 163, 184, 0.2)',
    selected: 'rgba(59, 130, 246, 0.2)',
    disabled: 'rgba(148, 163, 184, 0.05)',
  },
  football: {
    field: '#166534',
    fieldLines: '#ffffff',
    homeTeam: '#60a5fa',
    awayTeam: '#f87171',
    ball: '#ffffff',
  },
};

class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeConfig;
  private preferences: ThemePreferences;
  private listeners: Set<(theme: ThemeConfig) => void> = new Set();

  private constructor() {
    this.preferences = this.loadPreferences();
    this.currentTheme = this.createTheme(this.preferences);
    this.applyTheme();
    this.setupSystemListeners();
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private loadPreferences(): ThemePreferences {
    try {
      const saved = localStorage.getItem('astral-turf-theme-preferences');
      if (saved) {
        return { ...this.getDefaultPreferences(), ...JSON.parse(saved) };
      }
    } catch (_error) {
      // // console.warn('Failed to load theme preferences:', error);
    }
    return this.getDefaultPreferences();
  }

  private getDefaultPreferences(): ThemePreferences {
    return {
      mode: 'auto',
      colorScheme: 'football',
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      fontSize: 'md',
    };
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('astral-turf-theme-preferences', JSON.stringify(this.preferences));
    } catch (_error) {
      // // console.warn('Failed to save theme preferences:', error);
    }
  }

  private setupSystemListeners(): void {
    // Listen for system theme changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

      darkModeQuery.addEventListener('change', () => {
        if (this.preferences.mode === 'auto') {
          this.updateTheme();
        }
      });

      reducedMotionQuery.addEventListener('change', e => {
        this.updatePreferences({ reducedMotion: e.matches });
      });

      highContrastQuery.addEventListener('change', e => {
        this.updatePreferences({ highContrast: e.matches });
      });
    }
  }

  private createTheme(preferences: ThemePreferences): ThemeConfig {
    const isDark = this.getEffectiveMode(preferences.mode) === 'dark';
    const baseColors = isDark ? DARK_THEME_BASE : LIGHT_THEME_BASE;
    const schemeColors = THEME_COLORS[preferences.colorScheme];

    // Merge colors with custom overrides
    const colors: ThemeColors = {
      ...baseColors,
      ...schemeColors,
      ...preferences.customColors,
    };

    // Apply high contrast adjustments
    if (preferences.highContrast) {
      colors.border.primary = isDark ? '#ffffff' : '#000000';
      colors.text.primary = isDark ? '#ffffff' : '#000000';
    }

    const fontSizes = {
      sm: { base: '14px', scale: 0.875 },
      md: { base: '16px', scale: 1 },
      lg: { base: '18px', scale: 1.125 },
      xl: { base: '20px', scale: 1.25 },
    };

    const fontSize = fontSizes[preferences.fontSize];

    return {
      name: `${preferences.colorScheme}-${isDark ? 'dark' : 'light'}`,
      mode: isDark ? 'dark' : 'light',
      colors,
      fonts: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        xs: `${0.25 * fontSize.scale}rem`,
        sm: `${0.5 * fontSize.scale}rem`,
        md: `${1 * fontSize.scale}rem`,
        lg: `${1.5 * fontSize.scale}rem`,
        xl: `${2 * fontSize.scale}rem`,
      },
      shadows: {
        sm: isDark ? '0 1px 2px 0 rgba(0, 0, 0, 0.3)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: isDark
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: isDark
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: isDark
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
          : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      transitions: {
        fast: preferences.reducedMotion ? 'none' : '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        normal: preferences.reducedMotion ? 'none' : '200ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: preferences.reducedMotion ? 'none' : '300ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    };
  }

  private getEffectiveMode(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (mode === 'high-contrast') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode as 'light' | 'dark';
  }

  private applyTheme(): void {
    const root = document.documentElement;
    const theme = this.currentTheme;

    // Apply CSS custom properties
    this.applyCSSVariables(root, theme);

    // Set theme class
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${theme.mode}`);

    // Set color scheme
    root.style.colorScheme = theme.mode;

    // Apply font size
    root.style.fontSize = {
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
    }[this.preferences.fontSize];

    // Apply accessibility preferences
    if (this.preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (this.preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme.colors.background.primary);
  }

  private applyCSSVariables(root: HTMLElement, theme: ThemeConfig): void {
    const { colors, spacing, shadows, borderRadius, transitions } = theme;

    // Primary colors
    Object.entries(colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });

    // Background colors
    Object.entries(colors.background).forEach(([key, value]) => {
      root.style.setProperty(`--color-bg-${key}`, value);
    });

    // Text colors
    Object.entries(colors.text).forEach(([key, value]) => {
      root.style.setProperty(`--color-text-${key}`, value);
    });

    // Border colors
    Object.entries(colors.border).forEach(([key, value]) => {
      root.style.setProperty(`--color-border-${key}`, value);
    });

    // Status colors
    Object.entries(colors.status).forEach(([key, value]) => {
      root.style.setProperty(`--color-status-${key}`, value);
    });

    // Interactive colors
    Object.entries(colors.interactive).forEach(([key, value]) => {
      root.style.setProperty(`--color-interactive-${key}`, value);
    });

    // Football colors
    Object.entries(colors.football).forEach(([key, value]) => {
      root.style.setProperty(`--color-football-${key}`, value);
    });

    // Spacing
    Object.entries(spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Shadows
    Object.entries(shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Border radius
    Object.entries(borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    // Transitions
    Object.entries(transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, value);
    });
  }

  private updateMetaThemeColor(color: string): void {
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }

  private updateTheme(): void {
    this.currentTheme = this.createTheme(this.preferences);
    this.applyTheme();
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentTheme));
  }

  // Public API
  getTheme(): ThemeConfig {
    return this.currentTheme;
  }

  getPreferences(): ThemePreferences {
    return { ...this.preferences };
  }

  updatePreferences(updates: Partial<ThemePreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
    this.updateTheme();
  }

  setMode(mode: ThemeMode): void {
    this.updatePreferences({ mode });
  }

  setColorScheme(colorScheme: ColorScheme): void {
    this.updatePreferences({ colorScheme });
  }

  toggleMode(): void {
    const current = this.getEffectiveMode(this.preferences.mode);
    this.setMode(current === 'dark' ? 'light' : 'dark');
  }

  subscribe(listener: (theme: ThemeConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Utility methods
  isDark(): boolean {
    return this.currentTheme.mode === 'dark';
  }

  isLight(): boolean {
    return this.currentTheme.mode === 'light';
  }

  getColor(path: string): string {
    const keys = path.split('.');
    let value: unknown = this.currentTheme.colors;

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        return '';
      }
    }

    return value || '';
  }
}

export const themeManager = ThemeManager.getInstance();

// React hooks for theme management
export function useTheme() {
  const [theme, setTheme] = React.useState(themeManager.getTheme());

  React.useEffect(() => {
    return themeManager.subscribe(setTheme);
  }, []);

  return {
    theme,
    preferences: themeManager.getPreferences(),
    setMode: themeManager.setMode.bind(themeManager),
    setColorScheme: themeManager.setColorScheme.bind(themeManager),
    toggleMode: themeManager.toggleMode.bind(themeManager),
    updatePreferences: themeManager.updatePreferences.bind(themeManager),
    isDark: themeManager.isDark.bind(themeManager),
    isLight: themeManager.isLight.bind(themeManager),
    getColor: themeManager.getColor.bind(themeManager),
  };
}

export function useThemeColor(path: string): string {
  const { getColor } = useTheme();
  return getColor(path);
}
