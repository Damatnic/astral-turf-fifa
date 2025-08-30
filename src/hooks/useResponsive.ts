import { useState, useEffect } from 'react';

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
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
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
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

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

    return () => {
      window.removeEventListener('resize', throttledResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return responsiveState;
};

/**
 * Get current breakpoint based on width
 */
function getCurrentBreakpoint(width: number): BreakpointKey {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
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