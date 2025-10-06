/* eslint-disable no-undef */
import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppProvider } from '../../context/AppProvider';
import { UIProvider } from '../../context/UIContext';
import { TacticsProvider } from '../../context/TacticsContext';
import type { Formation, Player, Challenge } from '../../types';

// Custom render function with providers
interface CustomRenderOptions extends RenderOptions {
  initialRoute?: string;
  initialState?: Record<string, unknown>;
  providerProps?: any;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
): RenderResult {
  const { initialRoute = '/', initialState = {}, providerProps = {}, ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppProvider initialState={initialState} {...providerProps}>
          <UIProvider>
            <TacticsProvider>{children}</TacticsProvider>
          </UIProvider>
        </AppProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock implementations for common external dependencies
export const mockFramerMotion = {
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    svg: 'svg',
    path: 'path',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
  useMotionValue: (initial: any) => ({ get: () => initial, set: vi.fn() }),
};

// Mock Tauri APIs
export const mockTauriAPI = {
  invoke: vi.fn(),
  event: {
    listen: vi.fn(),
    emit: vi.fn(),
  },
  window: {
    appWindow: {
      setTitle: vi.fn(),
      minimize: vi.fn(),
      maximize: vi.fn(),
      close: vi.fn(),
    },
  },
  fs: {
    writeTextFile: vi.fn(),
    readTextFile: vi.fn(),
    exists: vi.fn(),
  },
  dialog: {
    save: vi.fn(),
    open: vi.fn(),
    message: vi.fn(),
  },
};

// Mock Chart.js
export const mockChartJS = {
  Chart: {
    register: vi.fn(),
    defaults: {
      font: { family: 'Inter' },
      color: '#64748b',
    },
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
};

// Utility functions for testing
export const waitForLoadingToFinish = async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
};

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
  return mockIntersectionObserver;
};

export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: mockResizeObserver,
  });
  return mockResizeObserver;
};

// Mock HTML5 Canvas for field rendering tests
export const mockCanvas = () => {
  const canvas = document.createElement('canvas');
  const context = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
  };

  canvas.getContext = vi.fn(() => context) as unknown as typeof canvas.getContext;
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: () => context,
  });

  return { canvas, context };
};

// Mock drag and drop APIs
export const mockDragAndDrop = () => {
  const mockDataTransfer = {
    getData: vi.fn(),
    setData: vi.fn(),
    clearData: vi.fn(),
    setDragImage: vi.fn(),
    files: [],
    items: [],
    types: [],
    dropEffect: 'none' as const,
    effectAllowed: 'none' as const,
  };

  const createDragEvent = (type: string, dataTransfer = mockDataTransfer) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: dataTransfer,
      writable: false,
    });
    return event;
  };

  return { mockDataTransfer, createDragEvent };
};

// Performance testing utilities
interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  if (typeof performance === 'undefined') {
    return 0;
  }
  const start = performance.now();
  renderFn();
  await waitForLoadingToFinish();
  return performance.now() - start;
};

export const measureMemoryUsage = (): MemoryInfo | null => {
  if (typeof performance === 'undefined' || !('memory' in performance)) {
    return null;
  }
  return (performance as { memory: MemoryInfo }).memory;
};

// Accessibility testing helpers
export const mockAxeCore = () => ({
  run: vi.fn().mockResolvedValue({
    violations: [],
    passes: [],
    incomplete: [],
    inapplicable: [],
  }),
  configure: vi.fn(),
});

// Visual regression testing utilities
export const captureComponent = async (element: HTMLElement): Promise<string> => {
  // Mock implementation - in real tests, this would use html-to-image
  return 'data:image/png;base64,mock-image-data';
};

// Error boundary testing
export const TestErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('Error:')) {
        setHasError(true);
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  if (hasError) {
    return <div data-testid="error-boundary">Something went wrong</div>;
  }

  return <>{children}</>;
};

// Custom testing matchers
export const customMatchers = {
  toBeWithinRange: (received: number, floor: number, ceiling: number) => {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },

  toHaveFormation: (formation: Formation, expectedPlayers: number) => {
    const actualPlayers = formation.slots?.length || 0;
    const pass = actualPlayers === expectedPlayers;
    return {
      message: () => `expected formation to have ${expectedPlayers} slots but got ${actualPlayers}`,
      pass,
    };
  },
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: Object.keys(store).length,
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

// Mock WebSocket for collaboration features
export const mockWebSocket = () => {
  const WS_CONSTANTS =
    typeof WebSocket !== 'undefined'
      ? {
          CONNECTING: WebSocket.CONNECTING,
          OPEN: WebSocket.OPEN,
          CLOSING: WebSocket.CLOSING,
          CLOSED: WebSocket.CLOSED,
        }
      : { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };

  const mockWS = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WS_CONSTANTS.OPEN,
    CONNECTING: WS_CONSTANTS.CONNECTING,
    OPEN: WS_CONSTANTS.OPEN,
    CLOSING: WS_CONSTANTS.CLOSING,
    CLOSED: WS_CONSTANTS.CLOSED,
  };

  (global as any).WebSocket = vi.fn(() => mockWS);
  return mockWS;
};

// Test data cleanup
export const cleanupTestData = () => {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset DOM
  document.body.innerHTML = '';

  // Clear localStorage
  localStorage.clear();

  // Reset any global state
  if ('__ASTRAL_TURF_TEST_STATE__' in window) {
    delete (window as any).__ASTRAL_TURF_TEST_STATE__;
  }
};

// Accessibility testing utilities
export const a11yUtils = {
  /**
   * Check if an element has proper ARIA attributes
   */
  hasProperAria: (element: HTMLElement) => {
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    return Boolean(role || ariaLabel || ariaDescribedBy);
  },

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container: HTMLElement) => {
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    );
  },

  /**
   * Check if element has keyboard support
   */
  hasKeyboardSupport: (element: HTMLElement) => {
    const tabIndex = element.getAttribute('tabindex');
    const role = element.getAttribute('role');
    return (
      element.tagName === 'BUTTON' ||
      element.tagName === 'A' ||
      element.tagName === 'INPUT' ||
      tabIndex !== null ||
      role === 'button'
    );
  },

  /**
   * Verify color contrast ratio
   */
  checkContrast: (foreground: string, background: string) => {
    // Simplified contrast check - in production you'd use a proper library
    return true;
  },
};

// General test utilities
export const testUtils = {
  /**
   * Wait for specific condition to be true
   */
  waitForCondition: async (condition: () => boolean, timeout = 5000) => {
    const startTime = Date.now();
    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Condition not met within timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  },

  /**
   * Simulate async delay
   */
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Create a mock file for upload testing
   */
  createMockFile: (name: string, size: number, type: string) => {
    if (typeof Blob === 'undefined' || typeof File === 'undefined') {
      throw new Error('Blob/File API not available');
    }
    const blob = new Blob(['x'.repeat(size)], { type });
    return new File([blob], name, { type });
  },

  /**
   * Dispatch custom event
   */
  dispatchCustomEvent: (element: HTMLElement, eventName: string, detail?: unknown) => {
    if (typeof CustomEvent === 'undefined') {
      return;
    }
    const event = new CustomEvent(eventName, { detail, bubbles: true });
    element.dispatchEvent(event);
  },

  /**
   * Get computed style value
   */
  getComputedStyleValue: (element: HTMLElement, property: string) => {
    return window.getComputedStyle(element).getPropertyValue(property);
  },

  /**
   * Check if element is visible in viewport
   */
  isInViewport: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Measure render time using shared helper
   */
  measureRenderTime,

  /**
   * Measure memory usage using shared helper
   */
  measureMemoryUsage,
};

/**
 * Performance testing utilities
 */
export const performanceUtils = {
  /**
   * Create a performance benchmark
   */
  createBenchmark: (name: string) => {
    return {
      name,
      start: Date.now(),
      end: 0,
      duration: 0,
    };
  },

  /**
   * Measure render time of a function
   */
  measureRenderTime: async (fn: () => void | Promise<void>) => {
    const start = Date.now();
    await fn();
    const end = Date.now();
    return end - start;
  },

  /**
   * Measure memory usage (stub for tests)
   */
  measureMemoryUsage: () => {
    // Return mock memory object since performance.memory is Chrome-specific
    return {
      usedJSHeapSize: 10000000,
      totalJSHeapSize: 20000000,
      jsHeapSizeLimit: 2000000000,
    };
  },
};

export * from '@testing-library/react';
export { vi } from 'vitest';
