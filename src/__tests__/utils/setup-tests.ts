import '@testing-library/jest-dom';
import { beforeAll, afterAll, beforeEach, afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '../mocks/server';
import {
  mockFramerMotion,
  mockTauriAPI,
  mockChartJS,
  mockIntersectionObserver,
  mockResizeObserver,
  mockCanvas,
  mockWebSocket,
  mockLocalStorage,
  customMatchers,
  cleanupTestData,
} from './test-helpers';

/**
 * Global test setup for Astral Turf
 * Configures mocks, polyfills, and test environment
 */

// Extend expect with custom matchers
expect.extend(customMatchers);

// Mock external dependencies globally
vi.mock('framer-motion', () => mockFramerMotion);
vi.mock('@tauri-apps/api', () => mockTauriAPI);
vi.mock('chart.js', () => mockChartJS);

// Setup MSW server for API mocking
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  // Reset MSW handlers
  server.resetHandlers();
  
  // Setup DOM mocks
  setupDOMMocks();
  
  // Setup browser APIs
  setupBrowserAPIs();
  
  // Setup performance monitoring
  setupPerformanceMonitoring();
  
  // Reset all mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup React Testing Library
  cleanup();
  
  // Cleanup test data
  cleanupTestData();
  
  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

/**
 * Setup DOM-related mocks
 */
function setupDOMMocks() {
  // Mock IntersectionObserver
  mockIntersectionObserver();
  
  // Mock ResizeObserver
  mockResizeObserver();
  
  // Mock Canvas API
  mockCanvas();
  
  // Mock getBoundingClientRect
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 1000,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 1000,
    x: 0,
    y: 0,
    toJSON: vi.fn(),
  }));
  
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
  
  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((cb) => {
    setTimeout(cb, 16);
    return 1;
  });
  
  global.cancelAnimationFrame = vi.fn();
  
  // Mock getComputedStyle
  Object.defineProperty(window, 'getComputedStyle', {
    value: vi.fn(() => ({
      getPropertyValue: vi.fn(() => ''),
      width: '1000px',
      height: '600px',
    })),
  });
  
  // Mock CSS custom properties
  Object.defineProperty(document.documentElement.style, 'setProperty', {
    value: vi.fn(),
  });
  
  // Mock focus/blur events
  Object.defineProperty(HTMLElement.prototype, 'focus', {
    value: vi.fn(),
  });
  
  Object.defineProperty(HTMLElement.prototype, 'blur', {
    value: vi.fn(),
  });
}

/**
 * Setup browser API mocks
 */
function setupBrowserAPIs() {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage(),
  });
  
  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: mockLocalStorage(),
  });
  
  // Mock WebSocket
  mockWebSocket();
  
  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
  
  // Mock Blob
  global.Blob = vi.fn((content, options) => ({
    size: content?.join('').length || 0,
    type: options?.type || '',
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    text: vi.fn().mockResolvedValue(content?.join('') || ''),
    stream: vi.fn(),
    slice: vi.fn(),
  })) as any;
  
  // Mock File
  global.File = vi.fn((bits, name, options) => ({
    ...new global.Blob(bits, options),
    name,
    lastModified: Date.now(),
  })) as any;
  
  // Mock FileReader
  global.FileReader = vi.fn(() => ({
    readAsText: vi.fn(function(this: any) {
      setTimeout(() => {
        this.onload?.({ target: { result: 'mock file content' } });
      }, 0);
    }),
    readAsDataURL: vi.fn(function(this: any) {
      setTimeout(() => {
        this.onload?.({ target: { result: 'data:text/plain;base64,bW9ja0ZpbGU=' } });
      }, 0);
    }),
    result: null,
    error: null,
    onload: null,
    onerror: null,
    abort: vi.fn(),
  })) as any;
  
  // Mock navigator APIs
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn().mockResolvedValue([]),
    },
    writable: true,
  });
  
  Object.defineProperty(navigator, 'share', {
    value: vi.fn().mockResolvedValue(undefined),
    writable: true,
  });
  
  // Mock geolocation
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 51.505,
            longitude: -0.09,
            accuracy: 10,
          },
        });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
    writable: true,
  });
  
  // Mock media queries
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Setup performance monitoring for tests
 */
function setupPerformanceMonitoring() {
  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      measure: vi.fn(),
      mark: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      },
    },
    writable: true,
  });
  
  // Track console errors during tests
  const originalError = console.error;
  console.error = (...args) => {
    // Filter out expected React warnings
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning:') ||
       message.includes('React does not recognize') ||
       message.includes('validateDOMNesting'))
    ) {
      return;
    }
    
    // Log actual errors
    originalError(...args);
    
    // Fail test on unexpected errors
    if (message && message.includes && message.includes('Error:')) {
      throw new Error(`Unexpected console.error: ${message}`);
    }
  };
  
  // Track console warnings
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      !message.includes('Warning:') &&
      !message.includes('deprecated')
    ) {
      originalWarn(...args);
    }
  };
}

/**
 * Test environment utilities
 */
export const testUtils = {
  // Simulate user interactions
  simulateKeyPress: (element: Element, key: string, options: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key, ...options });
    element.dispatchEvent(event);
  },
  
  simulateMouseEvent: (element: Element, type: string, options: MouseEventInit = {}) => {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      ...options,
    });
    element.dispatchEvent(event);
  },
  
  // Wait for async operations
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  waitForAnimation: () => new Promise(resolve => setTimeout(resolve, 100)),
  
  // Mock timers
  mockTimers: () => {
    vi.useFakeTimers();
    return {
      advance: (ms: number) => vi.advanceTimersByTime(ms),
      restore: () => vi.useRealTimers(),
    };
  },
  
  // Network simulation
  simulateNetworkDelay: (ms: number = 100) => 
    new Promise(resolve => setTimeout(resolve, ms)),
  
  simulateNetworkError: () => 
    Promise.reject(new Error('Network error')),
  
  // Memory leak detection
  detectMemoryLeaks: () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize;
    return {
      check: () => {
        const currentMemory = (performance as any).memory?.usedJSHeapSize;
        const leak = currentMemory - initialMemory;
        if (leak > 1000000) { // 1MB threshold
          console.warn(`Potential memory leak detected: ${leak} bytes`);
        }
        return leak;
      },
    };
  },
};

// Global test configuration
export const testConfig = {
  // Default timeouts
  timeouts: {
    default: 5000,
    integration: 10000,
    e2e: 30000,
  },
  
  // Performance thresholds
  performance: {
    renderTime: 100, // ms
    memoryUsage: 50 * 1024 * 1024, // 50MB
    bundleSize: 2 * 1024 * 1024, // 2MB
  },
  
  // Accessibility settings
  accessibility: {
    level: 'AA',
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  },
  
  // Visual regression settings
  visual: {
    threshold: 0.01, // 1% difference threshold
    updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
  },

  // Advanced testing features
  features: {
    mutationTesting: process.env.MUTATION_TESTING === 'true',
    performanceProfiling: process.env.PERFORMANCE_PROFILING === 'true',
    coverageReporting: process.env.COVERAGE_REPORTING !== 'false',
    parallelExecution: process.env.PARALLEL_TESTS !== 'false',
  },
};

// Export for use in tests
export { testUtils, testConfig };

// Declare global test types
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeWithinRange(floor: number, ceiling: number): T;
      toHaveFormation(expectedPlayers: number): T;
    }
  }
}