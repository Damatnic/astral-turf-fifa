import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Global test setup
beforeAll(() => {
  // Mock the getComputedStyle function - CRITICAL for html-to-image
  Object.defineProperty(window, 'getComputedStyle', {
    value: (element: Element, pseudoElt?: string | null) => ({
      getPropertyValue: (property: string) => {
        // Return sensible defaults for common properties
        const defaults: Record<string, string> = {
          display: 'block',
          position: 'static',
          width: '100px',
          height: '100px',
          'font-size': '16px',
          'font-family': 'Arial, sans-serif',
          color: 'rgb(0, 0, 0)',
          'background-color': 'rgba(0, 0, 0, 0)',
          margin: '0px',
          padding: '0px',
          border: '0px solid rgb(0, 0, 0)',
          opacity: '1',
          visibility: 'visible',
          overflow: 'visible',
        };
        return defaults[property] || '';
      },
      getPropertyPriority: () => '',
      getPropertyCSSValue: () => null,
      item: (index: number) => '',
      length: 0,
      parentRule: null,
      setProperty: () => {},
      removeProperty: () => '',
      cssText: '',
      // Add direct property access
      display: 'block',
      position: 'static',
      width: '100px',
      height: '100px',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: 'rgb(0, 0, 0)',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      margin: '0px',
      padding: '0px',
      border: '0px solid rgb(0, 0, 0)',
      opacity: '1',
      visibility: 'visible',
      overflow: 'visible',
    }),
    writable: true,
  });

  // Mock closest method for Element - CRITICAL for event handlers
  Object.defineProperty(Element.prototype, 'closest', {
    value: function (selector: string) {
      let el: Element | null = this;
      while (el && el.nodeType === 1) {
        try {
          if (el.matches && el.matches(selector)) {
            return el;
          }
        } catch (_e) {
          // Ignore errors in matches method
        }
        el = el.parentElement;
      }
      return null;
    },
    writable: true,
  });

  // Mock matches method for Element
  Object.defineProperty(Element.prototype, 'matches', {
    value: function (selector: string) {
      // Simple mock that handles common selectors
      if (selector.includes('button') && this.tagName === 'BUTTON') {
        return true;
      }
      if (selector.includes('input') && this.tagName === 'INPUT') {
        return true;
      }
      if (selector.includes('div') && this.tagName === 'DIV') {
        return true;
      }
      if (selector.startsWith('.') && this.className?.includes(selector.slice(1))) {
        return true;
      }
      if (selector.startsWith('#') && this.id === selector.slice(1)) {
        return true;
      }
      return false;
    },
    writable: true,
  });

  // Mock getBoundingClientRect
  Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
    value: () => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      toJSON: () => {},
    }),
    writable: true,
  });

  // Mock element dimensions
  Object.defineProperties(HTMLElement.prototype, {
    offsetWidth: { get: () => 100, configurable: true },
    offsetHeight: { get: () => 100, configurable: true },
    clientWidth: { get: () => 100, configurable: true },
    clientHeight: { get: () => 100, configurable: true },
    scrollWidth: { get: () => 100, configurable: true },
    scrollHeight: { get: () => 100, configurable: true },
    offsetTop: { get: () => 0, configurable: true },
    offsetLeft: { get: () => 0, configurable: true },
    scrollTop: { get: () => 0, set: vi.fn(), configurable: true },
    scrollLeft: { get: () => 0, set: vi.fn(), configurable: true },
  });

  // Mock requestAnimationFrame and cancelAnimationFrame
  Object.defineProperty(window, 'requestAnimationFrame', {
    value: (callback: FrameRequestCallback) => {
      return setTimeout(() => callback(Date.now()), 16);
    },
    writable: true,
  });

  Object.defineProperty(window, 'cancelAnimationFrame', {
    value: (id: number) => {
      clearTimeout(id);
    },
    writable: true,
  });

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
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
      length: 0,
      key: vi.fn(),
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
    takeRecords: () => [],
  }));

  // Mock scrollTo and scrollIntoView
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
  Object.defineProperty(Element.prototype, 'scrollIntoView', { value: vi.fn(), writable: true });

  // Mock focus and blur
  Object.defineProperty(HTMLElement.prototype, 'focus', { value: vi.fn(), writable: true });
  Object.defineProperty(HTMLElement.prototype, 'blur', { value: vi.fn(), writable: true });

  // Mock console methods for cleaner test output
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
  };

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock navigator.clipboard
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve('mock clipboard content')),
    },
    writable: true,
  });

  // Mock crypto for uuid generation
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      randomUUID: () =>
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }),
    },
    writable: true,
  });
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
