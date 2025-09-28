/**
 * Mobile Capabilities Testing Suite
 * Tests mobile device detection, touch interactions, and responsive behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useMobileCapabilities, useTouchGestures, useMobileViewport } from '../../utils/mobileOptimizations';
import { renderHook, act } from '@testing-library/react';

// Mock window object for different mobile scenarios
const createMockWindow = (overrides: Partial<Window> = {}) => {
  const mockWindow = {
    innerWidth: 375,
    innerHeight: 812,
    devicePixelRatio: 3,
    navigator: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      maxTouchPoints: 5,
      vibrate: vi.fn(),
    },
    matchMedia: vi.fn((query: string) => ({
      matches: query.includes('hover: hover') ? false : true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
    ...overrides,
  };
  
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true,
  });
  
  return mockWindow;
};

describe('Mobile Capabilities Detection', () => {
  beforeEach(() => {
    // Reset to mobile device defaults
    createMockWindow();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('useMobileCapabilities Hook', () => {
    it('should detect iPhone correctly', () => {
      createMockWindow({
        navigator: {
          ...window.navigator,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        },
      });

      const { result } = renderHook(() => useMobileCapabilities());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isIOS).toBe(true);
      expect(result.current.isAndroid).toBe(false);
      expect(result.current.supportsTouchEvents).toBe(true);
    });

    it('should detect Android correctly', () => {
      createMockWindow({
        navigator: {
          ...window.navigator,
          userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
        },
      });

      const { result } = renderHook(() => useMobileCapabilities());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isIOS).toBe(false);
      expect(result.current.isAndroid).toBe(true);
    });

    it('should detect tablet correctly', () => {
      createMockWindow({
        innerWidth: 768,
        innerHeight: 1024,
        navigator: {
          ...window.navigator,
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
        },
      });

      const { result } = renderHook(() => useMobileCapabilities());

      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMobile).toBe(true);
    });

    it('should detect device orientation changes', () => {
      const { result } = renderHook(() => useMobileCapabilities());

      expect(result.current.orientation).toBe('portrait');

      act(() => {
        createMockWindow({
          innerWidth: 812,
          innerHeight: 375,
        });
        fireEvent(window, new Event('orientationchange'));
      });

      // Wait for the orientation change to be processed
      setTimeout(() => {
        expect(result.current.orientation).toBe('landscape');
      }, 150);
    });

    it('should detect network connection type', () => {
      createMockWindow({
        navigator: {
          ...window.navigator,
          connection: {
            effectiveType: '3g',
          },
        },
      });

      const { result } = renderHook(() => useMobileCapabilities());

      expect(result.current.connectionType).toBe('slow');
    });

    it('should detect high DPI displays', () => {
      createMockWindow({
        devicePixelRatio: 3,
      });

      const { result } = renderHook(() => useMobileCapabilities());

      expect(result.current.devicePixelRatio).toBe(3);
    });

    it('should detect haptic feedback capability', () => {
      const mockVibrate = vi.fn();
      createMockWindow({
        navigator: {
          ...window.navigator,
          vibrate: mockVibrate,
        },
      });

      const { result } = renderHook(() => useMobileCapabilities());

      expect(result.current.hasHapticFeedback).toBe(true);
    });
  });

  describe('useMobileViewport Hook', () => {
    it('should return correct viewport dimensions', () => {
      createMockWindow({
        innerWidth: 414,
        innerHeight: 896,
      });

      const { result } = renderHook(() => useMobileViewport());

      expect(result.current.width).toBe(414);
      expect(result.current.height).toBe(896);
    });

    it('should detect safe area insets', () => {
      // Mock CSS env() function
      const mockComputedStyle = {
        getPropertyValue: (prop: string) => {
          if (prop === 'env(safe-area-inset-top)') return '44px';
          if (prop === 'env(safe-area-inset-bottom)') return '34px';
          return '0px';
        },
      };

      vi.spyOn(window, 'getComputedStyle').mockReturnValue(mockComputedStyle as any);

      const { result } = renderHook(() => useMobileViewport());

      expect(result.current.safeAreaTop).toBe(44);
      expect(result.current.safeAreaBottom).toBe(34);
    });

    it('should update on window resize', () => {
      const { result } = renderHook(() => useMobileViewport());

      act(() => {
        createMockWindow({
          innerWidth: 768,
          innerHeight: 1024,
        });
        fireEvent(window, new Event('resize'));
      });

      // Wait for debounced update
      setTimeout(() => {
        expect(result.current.width).toBe(768);
        expect(result.current.height).toBe(1024);
      }, 150);
    });
  });
});

describe('Touch Gesture Recognition', () => {
  let mockElement: HTMLElement;
  let touchCallbacks: any;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    
    touchCallbacks = {
      onTap: vi.fn(),
      onLongPress: vi.fn(),
      onSwipe: vi.fn(),
      onPinch: vi.fn(),
      onDrag: vi.fn(),
    };
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
    cleanup();
  });

  const createTouchEvent = (type: string, touches: any[], changedTouches?: any[]) => {
    const event = new TouchEvent(type, {
      touches,
      changedTouches: changedTouches || touches,
      bubbles: true,
    });
    return event;
  };

  const createTouch = (x: number, y: number, identifier = 0) => ({
    identifier,
    clientX: x,
    clientY: y,
    target: mockElement,
  });

  it('should detect tap gestures', () => {
    const TestComponent = () => {
      const elementRef = { current: mockElement };
      useTouchGestures(elementRef, touchCallbacks);
      return <div />;
    };

    render(<TestComponent />);

    const touch = createTouch(100, 100);
    
    // Touch start
    fireEvent(mockElement, createTouchEvent('touchstart', [touch]));
    
    // Touch end (quick tap)
    setTimeout(() => {
      fireEvent(mockElement, createTouchEvent('touchend', [], [touch]));
      expect(touchCallbacks.onTap).toHaveBeenCalledWith(
        expect.any(TouchEvent),
        { x: 100, y: 100 }
      );
    }, 100);
  });

  it('should detect long press gestures', (done) => {
    const TestComponent = () => {
      const elementRef = { current: mockElement };
      useTouchGestures(elementRef, touchCallbacks);
      return <div />;
    };

    render(<TestComponent />);

    const touch = createTouch(100, 100);
    
    // Touch start
    fireEvent(mockElement, createTouchEvent('touchstart', [touch]));
    
    // Wait for long press timeout
    setTimeout(() => {
      expect(touchCallbacks.onLongPress).toHaveBeenCalledWith(
        expect.any(TouchEvent),
        { x: 100, y: 100 }
      );
      done();
    }, 600);
  });

  it('should detect swipe gestures', () => {
    const TestComponent = () => {
      const elementRef = { current: mockElement };
      useTouchGestures(elementRef, touchCallbacks);
      return <div />;
    };

    render(<TestComponent />);

    const startTouch = createTouch(100, 100);
    const endTouch = createTouch(200, 100); // Swipe right
    
    // Touch start
    fireEvent(mockElement, createTouchEvent('touchstart', [startTouch]));
    
    // Touch move
    fireEvent(mockElement, createTouchEvent('touchmove', [endTouch]));
    
    // Touch end (quick swipe)
    setTimeout(() => {
      fireEvent(mockElement, createTouchEvent('touchend', [], [endTouch]));
      expect(touchCallbacks.onSwipe).toHaveBeenCalledWith(
        expect.any(TouchEvent),
        'right',
        expect.any(Number)
      );
    }, 100);
  });

  it('should detect pinch gestures', () => {
    const TestComponent = () => {
      const elementRef = { current: mockElement };
      useTouchGestures(elementRef, touchCallbacks);
      return <div />;
    };

    render(<TestComponent />);

    const touch1 = createTouch(100, 100, 0);
    const touch2 = createTouch(200, 100, 1);
    const touch1Moved = createTouch(80, 100, 0);
    const touch2Moved = createTouch(220, 100, 1);
    
    // Two finger touch start
    fireEvent(mockElement, createTouchEvent('touchstart', [touch1, touch2]));
    
    // Pinch gesture (fingers moving apart)
    fireEvent(mockElement, createTouchEvent('touchmove', [touch1Moved, touch2Moved]));
    
    expect(touchCallbacks.onPinch).toHaveBeenCalledWith(
      expect.any(TouchEvent),
      expect.any(Number) // Scale factor
    );
  });

  it('should detect drag gestures', () => {
    const TestComponent = () => {
      const elementRef = { current: mockElement };
      useTouchGestures(elementRef, touchCallbacks);
      return <div />;
    };

    render(<TestComponent />);

    const startTouch = createTouch(100, 100);
    const dragTouch = createTouch(110, 105);
    
    // Touch start
    fireEvent(mockElement, createTouchEvent('touchstart', [startTouch]));
    
    // Small drag movement
    fireEvent(mockElement, createTouchEvent('touchmove', [dragTouch]));
    
    expect(touchCallbacks.onDrag).toHaveBeenCalledWith(
      expect.any(TouchEvent),
      { x: 10, y: 5 }
    );
  });
});

describe('Mobile Performance Metrics', () => {
  it('should track frame rate', () => {
    const { result } = renderHook(() => {
      const { useMobilePerformanceMonitor } = require('../../utils/mobileOptimizations');
      return useMobilePerformanceMonitor();
    });

    expect(result.current.metrics.frameRate).toBeGreaterThan(0);
  });

  it('should track memory usage', () => {
    // Mock performance.memory
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      },
      writable: false,
    });

    const { result } = renderHook(() => {
      const { useMobilePerformanceMonitor } = require('../../utils/mobileOptimizations');
      return useMobilePerformanceMonitor();
    });

    expect(result.current.metrics.memoryUsage).toBeGreaterThan(0);
  });

  it('should track interaction latency', () => {
    const { result } = renderHook(() => {
      const { useMobilePerformanceMonitor } = require('../../utils/mobileOptimizations');
      return useMobilePerformanceMonitor();
    });

    act(() => {
      result.current.markInteractionStart('tap');
    });

    setTimeout(() => {
      act(() => {
        result.current.markInteractionEnd('tap');
      });
      
      expect(result.current.metrics.interactionLatency).toBeGreaterThan(0);
    }, 50);
  });
});

describe('Mobile Error Handling', () => {
  it('should provide mobile-friendly error messages', () => {
    const { result } = renderHook(() => {
      const { useMobileErrorHandling } = require('../../utils/mobileOptimizations');
      return useMobileErrorHandling();
    });

    const longError = new Error('This is a very long error message that should be truncated for mobile devices to provide better user experience');
    const shortMessage = result.current.showMobileError(longError, 'test');

    expect(shortMessage.length).toBeLessThanOrEqual(100);
    expect(shortMessage).toContain('...');
  });

  it('should trigger haptic feedback on errors', () => {
    const mockVibrate = vi.fn();
    createMockWindow({
      navigator: {
        ...window.navigator,
        vibrate: mockVibrate,
      },
    });

    const { result } = renderHook(() => {
      const { useMobileErrorHandling } = require('../../utils/mobileOptimizations');
      return useMobileErrorHandling();
    });

    result.current.showMobileError(new Error('Test error'), 'test');

    expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
  });
});

describe('Mobile Loading Strategies', () => {
  it('should adapt loading strategy based on connection', () => {
    createMockWindow({
      navigator: {
        ...window.navigator,
        connection: {
          effectiveType: '2g',
        },
      },
    });

    const { result } = renderHook(() => {
      const { useMobileLoadingStrategy } = require('../../utils/mobileOptimizations');
      return useMobileLoadingStrategy();
    });

    expect(result.current.enableSkeleton).toBe(true);
    expect(result.current.compressionLevel).toBe('high');
    expect(result.current.maxConcurrentRequests).toBe(2);
  });

  it('should optimize for fast connections', () => {
    createMockWindow({
      navigator: {
        ...window.navigator,
        connection: {
          effectiveType: '4g',
        },
      },
    });

    const { result } = renderHook(() => {
      const { useMobileLoadingStrategy } = require('../../utils/mobileOptimizations');
      return useMobileLoadingStrategy();
    });

    expect(result.current.useOptimisticUpdates).toBe(true);
    expect(result.current.preloadCriticalResources).toBe(true);
    expect(result.current.maxConcurrentRequests).toBe(6);
  });
});

describe('Scroll Optimization', () => {
  it('should enable momentum scrolling on iOS', () => {
    const mockElement = document.createElement('div');
    const elementRef = { current: mockElement };

    const TestComponent = () => {
      const { useMobileScrollOptimization } = require('../../utils/mobileOptimizations');
      useMobileScrollOptimization(elementRef);
      return <div />;
    };

    render(<TestComponent />);

    expect(mockElement.style.webkitOverflowScrolling).toBe('touch');
    expect(mockElement.style.overscrollBehavior).toBe('contain');
  });

  it('should prevent scroll chaining', () => {
    const mockElement = document.createElement('div');
    const elementRef = { current: mockElement };
    const mockPreventDefault = vi.fn();

    const TestComponent = () => {
      const { useMobileScrollOptimization } = require('../../utils/mobileOptimizations');
      useMobileScrollOptimization(elementRef);
      return <div />;
    };

    render(<TestComponent />);

    // Simulate scroll chaining scenario
    const touchEvent = createTouchEvent('touchmove', [createTouch(100, 100)]);
    touchEvent.preventDefault = mockPreventDefault;

    Object.defineProperty(mockElement, 'scrollTop', { value: 0 });
    Object.defineProperty(touchEvent.touches[0], 'pageY', { value: 150 });

    fireEvent(mockElement, touchEvent);

    // Should prevent default to stop scroll chaining
    expect(mockPreventDefault).toHaveBeenCalled();
  });
});

export {};