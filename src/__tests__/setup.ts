import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

type ClipboardLike = {
  writeText: (text: string) => Promise<void>;
  readText?: () => Promise<string>;
  [key: string]: unknown;
};

let clipboardStore: ClipboardLike | undefined;

declare global {
  interface Window {
    __setClipboardMock?: (mock?: ClipboardLike) => void;
    __getClipboardMock?: () => ClipboardLike | undefined;
  }
}

// Mock Chart.js before any imports
vi.mock('chart.js', () => {
  const mockChart = {
    register: vi.fn(),
    Chart: vi.fn().mockImplementation(() => ({
      render: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      reset: vi.fn(),
      stop: vi.fn(),
      resize: vi.fn(),
      clear: vi.fn(),
      toBase64Image: vi.fn(),
      generateLegend: vi.fn(),
      getElementAtEvent: vi.fn(),
      getElementsAtEvent: vi.fn(),
      getElementsAtXAxis: vi.fn(),
      getElementsAtEventForMode: vi.fn(),
      getDatasetAtEvent: vi.fn(),
    })),
    defaults: {
      global: {
        responsive: true,
        maintainAspectRatio: false,
      },
    },
  };

  // Mock all Chart.js components - need to match the import names
  const chartWithRegister = Object.assign(mockChart.Chart, {
    register: mockChart.register,
  });

  return {
    Chart: chartWithRegister,
    CategoryScale: vi.fn(),
    LinearScale: vi.fn(),
    PointElement: vi.fn(),
    LineElement: vi.fn(),
    BarElement: vi.fn(),
    ArcElement: vi.fn(),
    RadialLinearScale: vi.fn(),
    Title: vi.fn(),
    Tooltip: vi.fn(),
    Legend: vi.fn(),
    Filler: vi.fn(),
    default: chartWithRegister,
  };
});

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => {
  const MockChart = React.forwardRef<any, any>((props, ref) => {
    return React.createElement('div', {
      'data-testid': `mock-chart-${props.type || 'generic'}`,
      ref,
      style: props.style || {},
      className: props.className || '',
    });
  });

  MockChart.displayName = 'MockChart';

  const Line = React.forwardRef<any, any>((props, ref) =>
    React.createElement(MockChart, { ...props, type: 'line', ref }),
  );
  Line.displayName = 'Line';

  const Bar = React.forwardRef<any, any>((props, ref) =>
    React.createElement(MockChart, { ...props, type: 'bar', ref }),
  );
  Bar.displayName = 'Bar';

  const Doughnut = React.forwardRef<any, any>((props, ref) =>
    React.createElement(MockChart, { ...props, type: 'doughnut', ref }),
  );
  Doughnut.displayName = 'Doughnut';

  const Radar = React.forwardRef<any, any>((props, ref) =>
    React.createElement(MockChart, { ...props, type: 'radar', ref }),
  );
  Radar.displayName = 'Radar';

  return {
    Line,
    Bar,
    Doughnut,
    Radar,
    Pie: Bar,
    PolarArea: Bar,
    Scatter: Line,
    Bubble: Line,
  };
});

// Global test setup
beforeAll(() => {
  // Mock the getComputedStyle function - CRITICAL for html-to-image
  Object.defineProperty(window, 'getComputedStyle', {
    value: (element: globalThis.Element, pseudoElt?: string | null) => ({
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
  Object.defineProperty(globalThis.Element.prototype, 'closest', {
    value: function (selector: string) {
      let el: globalThis.Element | null = this as unknown as globalThis.Element;
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
  Object.defineProperty(globalThis.Element.prototype, 'matches', {
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
  Object.defineProperty(globalThis.Element.prototype, 'getBoundingClientRect', {
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
    value: (callback: globalThis.FrameRequestCallback) => {
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

  const clipboardTarget: Record<string, unknown> & ClipboardLike = (window.navigator.clipboard as unknown as ClipboardLike) ?? {
    writeText: async () => {},
    readText: async () => '',
  };

  const defaultClipboardImplementation: Required<ClipboardLike> = {
    writeText: async () => {},
    readText: async () => '',
  };

  if (!window.navigator.clipboard) {
    try {
      Object.defineProperty(window.navigator, 'clipboard', {
        configurable: true,
        enumerable: true,
        value: clipboardTarget,
        writable: true,
      });
    } catch {
      (window.navigator as unknown as Record<string, unknown>).clipboard = clipboardTarget;
    }
  }

  const originalWriteText = typeof clipboardTarget.writeText === 'function' ? clipboardTarget.writeText.bind(clipboardTarget) : undefined;
  const originalReadText = typeof clipboardTarget.readText === 'function' ? clipboardTarget.readText.bind(clipboardTarget) : undefined;

  const applyClipboardMethod = (
    method: 'writeText' | 'readText',
    implementation: ClipboardLike[typeof method] | undefined,
  ) => {
  const fallback = method === 'writeText' ? originalWriteText : originalReadText;
  const defaultImpl = defaultClipboardImplementation[method];
  const value = (implementation ?? fallback ?? defaultImpl) as ClipboardLike[typeof method];
    try {
      Object.defineProperty(clipboardTarget, method, {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
      });
    } catch {
      (clipboardTarget as Record<string, unknown>)[method] = value;
    }
  };

  window.__setClipboardMock = (mock?: ClipboardLike) => {
    clipboardStore = mock;
    if (mock) {
      applyClipboardMethod('writeText', mock.writeText);
      applyClipboardMethod('readText', mock.readText);
    } else {
      if (originalWriteText) {
        applyClipboardMethod('writeText', originalWriteText);
      }
      if (originalReadText) {
        applyClipboardMethod('readText', originalReadText);
      }
    }
  };

  window.__getClipboardMock = () => clipboardStore ?? (window.navigator.clipboard as unknown as ClipboardLike | undefined);

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
  Object.defineProperty(globalThis.Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    writable: true,
  });

  // Mock blur (retain native focus behavior)
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

  if (typeof global.File === 'undefined') {
    const BlobCtor: any = typeof globalThis.Blob !== 'undefined'
      ? globalThis.Blob
      : class {
          size = 0;
          type = '';
          constructor() {}
        };

    class MockFile extends BlobCtor {
      lastModified: number;
      name: string;
      webkitRelativePath = '';

      constructor(fileBits: unknown[] = [], fileName = '', options: Record<string, unknown> = {}) {
        super(fileBits as unknown[], options as unknown);
        this.name = fileName;
        this.lastModified = (options.lastModified as number | undefined) ?? Date.now();
        if (typeof options.type === 'string') {
          Object.defineProperty(this, 'type', {
            configurable: true,
            enumerable: true,
            value: options.type,
            writable: true,
          });
        }
      }
    }

    Object.defineProperty(global, 'File', {
      configurable: true,
      writable: true,
      value: MockFile,
    });
  }
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

  clipboardStore = undefined;
  window.__setClipboardMock?.(undefined);

  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 1024,
  });
  window.dispatchEvent(new Event('resize'));
});

afterAll(() => {
  vi.resetAllMocks();
});
