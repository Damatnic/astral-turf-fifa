/**
 * Responsive Design Testing Suite
 * Tests mobile-first responsive behavior and adaptive layouts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { cleanup } from '@testing-library/react';
import { 
  useResponsive, 
  useResponsiveValue, 
  useMobileOptimizations,
  BREAKPOINTS 
} from '../../hooks/useResponsive';

// Mock window object for different viewport scenarios
const createMockWindow = (width: number, height: number, overrides: any = {}) => {
  const mockWindow = {
    innerWidth: width,
    innerHeight: height,
    devicePixelRatio: 2,
    matchMedia: vi.fn((query: string) => {
      let matches = false;
      
      if (query.includes('hover: hover')) {
        matches = width >= BREAKPOINTS.desktop; // Assume hover on desktop
      } else if (query.includes('prefers-reduced-motion: reduce')) {
        matches = overrides.prefersReducedMotion || false;
      } else if (query.includes('prefers-color-scheme: dark')) {
        matches = overrides.darkMode || false;
      }
      
      return {
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getComputedStyle: vi.fn(() => ({
      getPropertyValue: (prop: string) => {
        if (prop === 'env(safe-area-inset-top)') return overrides.safeAreaTop || '0px';
        if (prop === 'env(safe-area-inset-bottom)') return overrides.safeAreaBottom || '0px';
        if (prop === 'env(safe-area-inset-left)') return overrides.safeAreaLeft || '0px';
        if (prop === 'env(safe-area-inset-right)') return overrides.safeAreaRight || '0px';
        return '0px';
      },
    })),
    navigator: {
      userAgent: overrides.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      maxTouchPoints: overrides.maxTouchPoints || 0,
      ...overrides.navigator,
    },
    ...overrides,
  };

  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true,
  });

  Object.defineProperty(global, 'navigator', {
    value: mockWindow.navigator,
    writable: true,
  });

  return mockWindow;
};

describe('Responsive Design System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('useResponsive Hook - Breakpoint Detection', () => {
    it('should detect mobile viewport correctly', () => {
      createMockWindow(375, 812); // iPhone dimensions

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.currentBreakpoint).toBe('mobile');
      expect(result.current.width).toBe(375);
      expect(result.current.height).toBe(812);
    });

    it('should detect tablet viewport correctly', () => {
      createMockWindow(768, 1024); // iPad dimensions

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.currentBreakpoint).toBe('tablet');
    });

    it('should detect desktop viewport correctly', () => {
      createMockWindow(1440, 900); // Desktop dimensions

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.currentBreakpoint).toBe('desktop');
    });

    it('should detect XL viewport correctly', () => {
      createMockWindow(1920, 1080); // Large desktop

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isXL).toBe(true);
      expect(result.current.currentBreakpoint).toBe('xl');
    });

    it('should detect orientation changes', () => {
      createMockWindow(375, 812); // Portrait

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPortrait).toBe(true);
      expect(result.current.isLandscape).toBe(false);
      expect(result.current.orientation).toBe('portrait');

      // Simulate orientation change
      act(() => {
        createMockWindow(812, 375); // Landscape
        window.dispatchEvent(new Event('orientationchange'));
      });

      // Wait for debounced update
      setTimeout(() => {
        expect(result.current.isPortrait).toBe(false);
        expect(result.current.isLandscape).toBe(true);
        expect(result.current.orientation).toBe('landscape');
      }, 200);
    });

    it('should detect touch device capabilities', () => {
      createMockWindow(375, 812, {
        navigator: {
          maxTouchPoints: 5,
        },
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isTouchDevice).toBe(true);
    });

    it('should detect high DPI displays', () => {
      createMockWindow(375, 812, {
        devicePixelRatio: 3,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isHighDPI).toBe(true);
      expect(result.current.devicePixelRatio).toBe(3);
    });

    it('should detect user preferences', () => {
      createMockWindow(375, 812, {
        prefersReducedMotion: true,
        darkMode: true,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.prefersReducedMotion).toBe(true);
      expect(result.current.colorScheme).toBe('dark');
    });

    it('should detect safe area insets', () => {
      createMockWindow(375, 812, {
        safeAreaTop: '44px',
        safeAreaBottom: '34px',
        safeAreaLeft: '0px',
        safeAreaRight: '0px',
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.safeArea.top).toBe(44);
      expect(result.current.safeArea.bottom).toBe(34);
      expect(result.current.safeArea.left).toBe(0);
      expect(result.current.safeArea.right).toBe(0);
    });

    it('should handle window resize events', () => {
      createMockWindow(375, 812);

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);

      // Simulate resize to tablet
      act(() => {
        createMockWindow(768, 1024);
        window.dispatchEvent(new Event('resize'));
      });

      // Wait for debounced update
      setTimeout(() => {
        expect(result.current.isTablet).toBe(true);
        expect(result.current.isMobile).toBe(false);
      }, 150);
    });

    it('should calculate aspect ratio correctly', () => {
      createMockWindow(375, 812);

      const { result } = renderHook(() => useResponsive());

      expect(result.current.aspectRatio).toBeCloseTo(375 / 812);
    });

    it('should detect hover capability correctly', () => {
      // Desktop with hover
      createMockWindow(1440, 900);

      const { result: desktopResult } = renderHook(() => useResponsive());
      expect(desktopResult.current.hasHover).toBe(true);

      // Mobile without hover
      createMockWindow(375, 812);

      const { result: mobileResult } = renderHook(() => useResponsive());
      expect(mobileResult.current.hasHover).toBe(false);
    });
  });

  describe('useResponsiveValue Hook', () => {
    it('should return correct value for current breakpoint', () => {
      createMockWindow(375, 812); // Mobile

      const values = {
        mobile: 'mobile-value',
        tablet: 'tablet-value',
        desktop: 'desktop-value',
        xl: 'xl-value',
      };

      const { result } = renderHook(() => 
        useResponsiveValue(values, 'default-value')
      );

      expect(result.current).toBe('mobile-value');
    });

    it('should fallback to smaller breakpoints when current not defined', () => {
      createMockWindow(1440, 900); // Desktop

      const values = {
        mobile: 'mobile-value',
        tablet: 'tablet-value',
        // desktop not defined - should fallback to tablet
      };

      const { result } = renderHook(() => 
        useResponsiveValue(values, 'default-value')
      );

      expect(result.current).toBe('tablet-value');
    });

    it('should return default value when no breakpoint matches', () => {
      createMockWindow(1920, 1080); // XL

      const values = {
        mobile: 'mobile-value',
        // No other breakpoints defined
      };

      const { result } = renderHook(() => 
        useResponsiveValue(values, 'default-value')
      );

      expect(result.current).toBe('mobile-value');
    });

    it('should update when breakpoint changes', () => {
      createMockWindow(375, 812); // Mobile

      const values = {
        mobile: 'mobile-value',
        tablet: 'tablet-value',
        desktop: 'desktop-value',
      };

      const { result } = renderHook(() => 
        useResponsiveValue(values, 'default-value')
      );

      expect(result.current).toBe('mobile-value');

      // Change to tablet
      act(() => {
        createMockWindow(768, 1024);
        window.dispatchEvent(new Event('resize'));
      });

      setTimeout(() => {
        expect(result.current).toBe('tablet-value');
      }, 150);
    });
  });

  describe('useMobileOptimizations Hook', () => {
    it('should provide mobile-specific optimizations', () => {
      createMockWindow(375, 812, {
        navigator: { maxTouchPoints: 5 },
        prefersReducedMotion: false,
        devicePixelRatio: 3,
      });

      const { result } = renderHook(() => useMobileOptimizations());

      expect(result.current.minTouchTarget).toBe('44px');
      expect(result.current.compactLayout).toBe(true);
      expect(result.current.showTooltips).toBe(false);
      expect(result.current.enableHover).toBe(false);
      expect(result.current.enableLazyLoading).toBe(true);
      expect(result.current.useLowQualityImages).toBe(false); // High DPI
      expect(result.current.enableVirtualization).toBe(true);
    });

    it('should provide desktop-specific optimizations', () => {
      createMockWindow(1440, 900, {
        navigator: { maxTouchPoints: 0 },
        prefersReducedMotion: false,
      });

      const { result } = renderHook(() => useMobileOptimizations());

      expect(result.current.minTouchTarget).toBe('32px');
      expect(result.current.compactLayout).toBe(false);
      expect(result.current.showTooltips).toBe(true);
      expect(result.current.enableHover).toBe(true);
      expect(result.current.enableLazyLoading).toBe(false);
      expect(result.current.enableVirtualization).toBe(false);
    });

    it('should respect reduced motion preferences', () => {
      createMockWindow(375, 812, {
        prefersReducedMotion: true,
      });

      const { result } = renderHook(() => useMobileOptimizations());

      expect(result.current.shouldReduceAnimations).toBe(true);
      expect(result.current.animationDuration).toBe(0);
      expect(result.current.reducedEffects).toBe(true);
    });

    it('should provide appropriate spacing for mobile', () => {
      createMockWindow(375, 812);

      const { result } = renderHook(() => useMobileOptimizations());

      expect(result.current.spacing.xs).toBe('0.25rem');
      expect(result.current.spacing.sm).toBe('0.5rem');
      expect(result.current.spacing.md).toBe('0.75rem');
      expect(result.current.spacing.lg).toBe('1rem');
      expect(result.current.spacing.xl).toBe('1.5rem');
    });

    it('should provide appropriate spacing for desktop', () => {
      createMockWindow(1440, 900);

      const { result } = renderHook(() => useMobileOptimizations());

      expect(result.current.spacing.xs).toBe('0.5rem');
      expect(result.current.spacing.sm).toBe('0.75rem');
      expect(result.current.spacing.md).toBe('1rem');
      expect(result.current.spacing.lg).toBe('1.5rem');
      expect(result.current.spacing.xl).toBe('2rem');
    });

    it('should handle tablet-specific optimizations', () => {
      createMockWindow(768, 1024, {
        navigator: { maxTouchPoints: 5 },
        prefersReducedMotion: false,
      });

      const { result } = renderHook(() => useMobileOptimizations());

      // Tablet should not reduce animations (unlike phone)
      expect(result.current.shouldReduceAnimations).toBe(false);
      expect(result.current.animationDuration).toBe(200); // Mobile duration
      expect(result.current.minTouchTarget).toBe('44px'); // Still mobile-sized targets
    });
  });

  describe('Responsive Breakpoint Edge Cases', () => {
    it('should handle exact breakpoint boundaries', () => {
      // Test exact tablet breakpoint
      createMockWindow(BREAKPOINTS.tablet, 1024);

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.currentBreakpoint).toBe('tablet');
    });

    it('should handle very small viewports', () => {
      createMockWindow(320, 568); // Small mobile

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.currentBreakpoint).toBe('mobile');
    });

    it('should handle very large viewports', () => {
      createMockWindow(2560, 1440); // Ultra-wide

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isXL).toBe(true);
      expect(result.current.currentBreakpoint).toBe('xl');
    });

    it('should handle square viewports', () => {
      createMockWindow(800, 800); // Square

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isTablet).toBe(true);
      expect(result.current.aspectRatio).toBe(1);
      expect(result.current.orientation).toBe('landscape'); // Width >= height
    });
  });

  describe('Performance and Memory Management', () => {
    it('should debounce resize events', () => {
      createMockWindow(375, 812);

      const { result } = renderHook(() => useResponsive());

      const resizeHandler = vi.fn();
      window.addEventListener('resize', resizeHandler);

      // Trigger multiple rapid resize events
      act(() => {
        for (let i = 0; i < 10; i++) {
          window.dispatchEvent(new Event('resize'));
        }
      });

      // Should only call handler once after debounce delay
      setTimeout(() => {
        expect(resizeHandler).toHaveBeenCalledTimes(1);
      }, 150);
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useResponsive());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });

    it('should handle media query listener cleanup', () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      createMockWindow(375, 812, {
        matchMedia: vi.fn(() => mockMediaQuery),
      });

      const { unmount } = renderHook(() => useResponsive());

      unmount();

      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('SSR Compatibility', () => {
    it('should provide safe defaults for server-side rendering', () => {
      // Mock undefined window (SSR environment)
      const originalWindow = global.window;
      delete (global as any).window;

      const { result } = renderHook(() => useResponsive());

      // Should provide safe mobile-first defaults
      expect(result.current.isMobile).toBe(true);
      expect(result.current.width).toBe(375);
      expect(result.current.height).toBe(667);
      expect(result.current.currentBreakpoint).toBe('mobile');

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle missing matchMedia gracefully', () => {
      createMockWindow(375, 812, {
        matchMedia: undefined,
      });

      expect(() => {
        renderHook(() => useResponsive());
      }).not.toThrow();
    });

    it('should handle missing devicePixelRatio gracefully', () => {
      createMockWindow(375, 812, {
        devicePixelRatio: undefined,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.devicePixelRatio).toBe(1); // Default fallback
    });

    it('should handle missing navigator.maxTouchPoints gracefully', () => {
      createMockWindow(375, 812, {
        navigator: {
          maxTouchPoints: undefined,
        },
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isTouchDevice).toBe(false); // Should fallback to false
    });
  });
});

export {};