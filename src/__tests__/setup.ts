import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Global test setup
beforeAll(() => {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock console methods for cleaner test output
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
  };

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
  global.URL.revokeObjectURL = vi.fn();
});

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // Clear localStorage mock
  (window.localStorage.getItem as any).mockClear();
  (window.localStorage.setItem as any).mockClear();
  (window.localStorage.removeItem as any).mockClear();
  (window.localStorage.clear as any).mockClear();
});

afterAll(() => {
  vi.resetAllMocks();
});