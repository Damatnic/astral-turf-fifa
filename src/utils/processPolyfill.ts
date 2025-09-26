/**
 * Process polyfill for browser environment
 * Provides a minimal process object with EventEmitter-like interface
 */

class ProcessPolyfill {
  public env: Record<string, string | undefined>;
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.env = {
      NODE_ENV: import.meta.env.MODE || 'production',
      API_KEY: import.meta.env.VITE_GEMINI_API_KEY || 'your-gemini-api-key-here',
      GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || 'your-gemini-api-key-here',
      APP_VERSION: '8.0.0',
    };
  }

  on(event: string, listener: (...args: unknown[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    return this;
  }

  off(event: string, listener?: (...args: unknown[]) => void): this {
    if (!listener) {
      this.listeners.delete(event);
    } else {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }
    }
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(...args);
        } catch {
          // // // // console.warn('Error in process event listener:', error);
        }
      });
      return true;
    }
    return false;
  }

  exit(_code?: number): never {
    // // // // console.warn(`process.exit(${code}) called in browser - ignoring`);
    return undefined as never;
  }

  memoryUsage(): { heapUsed: number; heapTotal: number; external: number; rss: number } {
    return { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 };
  }
}

// Only create polyfill in browser environment
export const processPolyfill = typeof window !== 'undefined' ? new ProcessPolyfill() : undefined;

// Make it available globally if needed
if (typeof window !== 'undefined' && !(window as unknown as Record<string, unknown>).process) {
  (window as unknown as Record<string, unknown>).process = processPolyfill;
}
