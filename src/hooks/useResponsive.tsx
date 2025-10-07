import { useState, useEffect, useMemo } from 'react';

/**
 * Mobile-First Responsive Breakpoints
 */
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  xl: 1440,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isXL: boolean;
  currentBreakpoint: BreakpointKey;
  isTouchDevice: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  devicePixelRatio: number;
  // Enhanced mobile capabilities
  orientation: 'portrait' | 'landscape';
  aspectRatio: number;
  isHighDPI: boolean;
  hasHover: boolean;
  prefersReducedMotion: boolean;
  colorScheme: 'light' | 'dark';
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Hook for mobile-first responsive design detection
 * Provides real-time breakpoint and device information
 */
export const useResponsive = (): ResponsiveState => {
  const [responsiveState, setResponsiveState] = useState<ResponsiveState>(() => {
    // Default to mobile-first SSR-friendly state
    if (typeof window === 'undefined') {
      return {
        width: 375, // iPhone default
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isXL: false,
        currentBreakpoint: 'mobile' as BreakpointKey,
        isTouchDevice: true,
        isLandscape: false,
        isPortrait: true,
        devicePixelRatio: 2,
        orientation: 'portrait',
        aspectRatio: 375 / 667,
        isHighDPI: true,
        hasHover: false,
        prefersReducedMotion: false,
        colorScheme: 'light',
        safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Get safe area insets
    const computedStyle = getComputedStyle(document.documentElement);
    const safeAreaTop = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0',
      10,
    );
    const safeAreaBottom = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0',
      10,
    );
    const safeAreaLeft = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0',
      10,
    );
    const safeAreaRight = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0',
      10,
    );

    return {
      width,
      height,
      isMobile: width < BREAKPOINTS.tablet,
      isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
      isDesktop: width >= BREAKPOINTS.desktop && width < BREAKPOINTS.xl,
      isXL: width >= BREAKPOINTS.xl,
      currentBreakpoint: getCurrentBreakpoint(width),
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isLandscape: width > height,
      isPortrait: height >= width,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: width > height ? 'landscape' : 'portrait',
      aspectRatio: width / height,
      isHighDPI: (window.devicePixelRatio || 1) > 1.5,
      hasHover: window.matchMedia('(hover: hover)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      safeArea: {
        top: safeAreaTop,
        bottom: safeAreaBottom,
        left: safeAreaLeft,
        right: safeAreaRight,
      },
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Get safe area insets
      const computedStyle = getComputedStyle(document.documentElement);
      const safeAreaTop = parseInt(
        computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0',
        10,
      );
      const safeAreaBottom = parseInt(
        computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0',
        10,
      );
      const safeAreaLeft = parseInt(
        computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0',
        10,
      );
      const safeAreaRight = parseInt(
        computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0',
        10,
      );

      setResponsiveState({
        width,
        height,
        isMobile: width < BREAKPOINTS.tablet,
        isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
        isDesktop: width >= BREAKPOINTS.desktop && width < BREAKPOINTS.xl,
        isXL: width >= BREAKPOINTS.xl,
        currentBreakpoint: getCurrentBreakpoint(width),
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isLandscape: width > height,
        isPortrait: height >= width,
        devicePixelRatio: window.devicePixelRatio || 1,
        orientation: width > height ? 'landscape' : 'portrait',
        aspectRatio: width / height,
        isHighDPI: (window.devicePixelRatio || 1) > 1.5,
        hasHover: window.matchMedia('(hover: hover)').matches,
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        safeArea: {
          top: safeAreaTop,
          bottom: safeAreaBottom,
          left: safeAreaLeft,
          right: safeAreaRight,
        },
      });
    };

    // Throttle resize events for better performance
    let timeoutId: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    // Initial setup
    handleResize();

    // Add event listeners
    window.addEventListener('resize', throttledResize);
    window.addEventListener('orientationchange', handleResize);

    // Media query listeners for preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colorQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const hoverQuery = window.matchMedia('(hover: hover)');

    const handleMediaChange = () => handleResize();

    motionQuery.addEventListener('change', handleMediaChange);
    colorQuery.addEventListener('change', handleMediaChange);
    hoverQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('resize', throttledResize);
      window.removeEventListener('orientationchange', handleResize);
      motionQuery.removeEventListener('change', handleMediaChange);
      colorQuery.removeEventListener('change', handleMediaChange);
      hoverQuery.removeEventListener('change', handleMediaChange);
      clearTimeout(timeoutId);
    };
  }, []);

  return responsiveState;
};

/**
 * Get current breakpoint based on width
 */
function getCurrentBreakpoint(width: number): BreakpointKey {
  if (width >= BREAKPOINTS.xl) {
    return 'xl';
  }
  if (width >= BREAKPOINTS.desktop) {
    return 'desktop';
  }
  if (width >= BREAKPOINTS.tablet) {
    return 'tablet';
  }
  return 'mobile';
}

/**
 * Hook for mobile-specific behavior
 */
export const useMobileDetection = () => {
  const { isMobile, isTablet, isTouchDevice } = useResponsive();

  return {
    isMobile,
    isTabletOrMobile: isMobile || isTablet,
    isTouchDevice,
    shouldUseMobileUI: isMobile || (isTablet && isTouchDevice),
  };
};

/**
 * Hook for responsive modal behavior
 */
export const useResponsiveModal = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    shouldUseFullScreenModal: isMobile,
    shouldUseBottomSheet: isMobile,
    modalSize: isMobile ? 'full' : isTablet ? 'large' : 'medium',
  };
};

/**
 * Hook for responsive navigation behavior
 */
export const useResponsiveNavigation = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    shouldUseDrawer: isMobile || isTablet,
    shouldCollapse: isMobile,
    navigationStyle: isMobile ? 'drawer' : isTablet ? 'sidebar' : 'horizontal',
  };
};

// Note: useResponsiveValue temporarily commented out due to TSX generic parsing issues
// Will be re-implemented later

/**
 * Hook for mobile-specific optimizations
 */
export const useMobileOptimizations = () => {
  const { isMobile, isTablet, isTouchDevice, prefersReducedMotion, isHighDPI } = useResponsive();

  return useMemo(
    () => ({
      // Touch target optimization
      minTouchTarget: isMobile ? '44px' : '32px',

      // Animation preferences
      shouldReduceAnimations: prefersReducedMotion || (isMobile && !isTablet),
      animationDuration: prefersReducedMotion ? 0 : isMobile ? 200 : 300,

      // Layout optimizations
      compactLayout: isMobile,
      showTooltips: !isTouchDevice,
      enableHover: !isTouchDevice,

      // Performance optimizations
      enableLazyLoading: isMobile,
      useLowQualityImages: isMobile && !isHighDPI,
      reducedEffects: isMobile || prefersReducedMotion,
      enableVirtualization: isMobile,

      // Spacing adjustments
      spacing: {
        xs: isMobile ? '0.25rem' : '0.5rem',
        sm: isMobile ? '0.5rem' : '0.75rem',
        md: isMobile ? '0.75rem' : '1rem',
        lg: isMobile ? '1rem' : '1.5rem',
        xl: isMobile ? '1.5rem' : '2rem',
      },
    }),
    [isMobile, isTablet, isTouchDevice, prefersReducedMotion, isHighDPI],
  );
};
