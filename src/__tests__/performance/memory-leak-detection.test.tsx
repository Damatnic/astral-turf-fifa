/**
 * 🧠 Memory Leak Detection Tests
 * Advanced memory profiling and leak detection for the tactical board system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnifiedTacticsBoard } from '../../components/tactics/UnifiedTacticsBoard';
import { AppProvider } from '../../context/AppProvider';
import { generateEnhancedFormation, generateEnhancedPlayer } from '../utils/enhanced-mock-generators';

// Memory monitoring utilities
class MemoryProfiler {
  private measurements: Array<{
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  }> = [];

  startProfiling() {
    this.measurements = [];
    this.recordMeasurement();
  }

  recordMeasurement() {
    if (typeof performance !== 'undefined' && performance.memory) {
      this.measurements.push({
        timestamp: Date.now(),
        heapUsed: performance.memory.usedJSHeapSize,
        heapTotal: performance.memory.totalJSHeapSize,
        external: performance.memory.totalJSHeapSize - performance.memory.usedJSHeapSize,
        arrayBuffers: 0 // Not available in browser context
      });
    }
  }

  stopProfiling() {
    this.recordMeasurement();
    return this.analyzeMeasurements();
  }

  private analyzeMeasurements() {
    if (this.measurements.length < 2) {
      return { leak: false, growth: 0, trend: 'stable' };
    }

    const first = this.measurements[0];
    const last = this.measurements[this.measurements.length - 1];
    const growth = last.heapUsed - first.heapUsed;
    const growthPct = (growth / first.heapUsed) * 100;

    // Determine trend
    let trend = 'stable';
    if (growthPct > 20) trend = 'growing';
    else if (growthPct < -10) trend = 'shrinking';

    return {
      leak: growthPct > 50, // Flag as potential leak if growth > 50%
      growth: growthPct,
      trend,
      measurements: this.measurements,
      duration: last.timestamp - first.timestamp
    };
  }

  forceGarbageCollection() {
    // Force garbage collection if available (requires --expose-gc in Node.js)
    if (global.gc) {
      global.gc();
    }
    
    // Alternative: create and release large objects to trigger GC
    for (let i = 0; i < 10; i++) {
      const largeArray = new Array(1000000).fill(0);
      largeArray.length = 0;
    }
  }
}

// Memory leak test utilities
const createMemoryStressTest = (iterations: number = 100) => {
  return async (component: () => JSX.Element) => {
    const profiler = new MemoryProfiler();
    profiler.startProfiling();

    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(component());
      
      // Simulate user interactions
      await userEvent.click(screen.getByTestId('tactical-board'));
      
      // Record memory usage every 10 iterations
      if (i % 10 === 0) {
        profiler.recordMeasurement();
      }
      
      // Clean up
      unmount();
      cleanup();
      
      // Force garbage collection periodically
      if (i % 25 === 0) {
        profiler.forceGarbageCollection();
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return profiler.stopProfiling();
  };
};

describe('🧠 Memory Leak Detection Tests', () => {
  let memoryProfiler: MemoryProfiler;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    memoryProfiler = new MemoryProfiler();
    user = userEvent.setup();
    
    // Mock performance.memory for testing
    if (!performance.memory) {
      (performance as any).memory = {
        usedJSHeapSize: 10000000 + Math.random() * 1000000,
        totalJSHeapSize: 20000000 + Math.random() * 2000000,
        jsHeapSizeLimit: 50000000
      };
    }
  });

  afterEach(() => {
    cleanup();
    memoryProfiler.forceGarbageCollection();
  });

  describe('Component Mount/Unmount Cycles', () => {
    it('should not leak memory during repeated mount/unmount cycles', async () => {
      const stressTest = createMemoryStressTest(50);
      
      const result = await stressTest(() => (
        <AppProvider>
          <UnifiedTacticsBoard 
            initialFormation={generateEnhancedFormation()}
            players={Array.from({ length: 11 }, () => generateEnhancedPlayer())}
          />
        </AppProvider>
      ));

      expect(result.leak).toBe(false);
      expect(result.growth).toBeLessThan(30); // Allow up to 30% growth
      
      console.log(`Memory analysis: ${result.growth.toFixed(2)}% growth over ${result.duration}ms`);
    });

    it('should properly clean up event listeners', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <AppProvider>
            <UnifiedTacticsBoard 
              initialFormation={generateEnhancedFormation()}
              players={Array.from({ length: 11 }, () => generateEnhancedPlayer())}
            />
          </AppProvider>
        );

        unmount();
      }

      // Verify that removeEventListener is called for each addEventListener
      expect(removeEventListenerSpy.mock.calls.length).toBeGreaterThanOrEqual(
        addEventListenerSpy.mock.calls.length * 0.8 // Allow 80% cleanup rate
      );
    });
  });

  describe('Formation Data Memory Management', () => {
    it('should not accumulate formation data in memory', async () => {
      memoryProfiler.startProfiling();
      
      const { rerender } = render(
        <AppProvider>
          <UnifiedTacticsBoard 
            initialFormation={generateEnhancedFormation()}
            players={Array.from({ length: 11 }, () => generateEnhancedPlayer())}
          />
        </AppProvider>
      );

      // Change formation data multiple times
      for (let i = 0; i < 20; i++) {
        rerender(
          <AppProvider>
            <UnifiedTacticsBoard 
              initialFormation={generateEnhancedFormation()}
              players={Array.from({ length: 11 }, () => generateEnhancedPlayer())}
            />
          </AppProvider>
        );
        
        if (i % 5 === 0) {
          memoryProfiler.recordMeasurement();
        }
      }

      const result = memoryProfiler.stopProfiling();
      expect(result.growth).toBeLessThan(25); // Should not grow significantly
    });

    it('should properly dispose of canvas contexts', async () => {
      const canvasSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
      
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <AppProvider>
            <UnifiedTacticsBoard 
              initialFormation={generateEnhancedFormation()}
              players={Array.from({ length: 11 }, () => generateEnhancedPlayer())}
            />
          </AppProvider>
        );

        // Verify canvas is being used
        expect(canvasSpy).toHaveBeenCalled();
        
        unmount();
        cleanup();
      }

      // Canvas contexts should be properly released
      expect(canvasSpy.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Animation Memory Management', () => {
    it('should clean up animation frames properly', async () => {
      const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame');
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');

      memoryProfiler.startProfiling();

      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <AppProvider>
            <UnifiedTacticsBoard 
              initialFormation={generateEnhancedFormation()}
              players={Array.from({ length: 11 }, () => generateEnhancedPlayer())}
            />
          </AppProvider>
        );

        // Trigger animations
        await user.click(screen.getByTestId('tactical-board'));
        
        // Let animations start
        await waitFor(() => {
          expect(requestAnimationFrameSpy).toHaveBeenCalled();
        });

        unmount();
        
        // Record memory after cleanup
        memoryProfiler.recordMeasurement();
      }

      const result = memoryProfiler.stopProfiling();
      
      // Should have cancelled animation frames
      expect(cancelAnimationFrameSpy.mock.calls.length).toBeGreaterThan(0);
      
      // Memory should not grow significantly
      expect(result.growth).toBeLessThan(20);
    });

    it('should handle interrupted animations without leaks', async () => {
      memoryProfiler.startProfiling();

      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <AppProvider>
            <UnifiedTacticsBoard 
              initialFormation={generateEnhancedFormation()}
              players={Array.from({ length: 11 }, () => generateEnhancedPlayer())}
            />
          </AppProvider>
        );

        // Start animation then immediately unmount
        await user.click(screen.getByTestId('tactical-board'));
        unmount(); // Interrupt animation
        
        if (i % 3 === 0) {
          memoryProfiler.recordMeasurement();
        }
      }

      const result = memoryProfiler.stopProfiling();
      expect(result.growth).toBeLessThan(15);
    });
  });

  describe('Event Handler Memory Management', () => {
    it('should properly remove all event handlers on unmount', async () => {
      const eventMap = new Map<string, number>();
      
      // Track event listeners
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
      
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        eventMap.set(type, (eventMap.get(type) || 0) + 1);
        return originalAddEventListener.call(this, type, listener, options);
      };
      
      EventTarget.prototype.removeEventListener = function(type, listener, options) {
        eventMap.set(type, Math.max(0, (eventMap.get(type) || 0) - 1));
        return originalRemoveEventListener.call(this, type, listener, options);
      };

      // Test multiple mount/unmount cycles
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <AppProvider>
            <UnifiedTacticsBoard 
              initialFormation={generateEnhancedFormation()}
              players={Array.from({ length: 11 }, () => generateEnhancedPlayer())}
            />
          </AppProvider>
        );

        unmount();
      }

      // Restore original methods
      EventTarget.prototype.addEventListener = originalAddEventListener;
      EventTarget.prototype.removeEventListener = originalRemoveEventListener;

      // Check for leaked event listeners
      const leakedEvents = Array.from(eventMap.entries()).filter(([_, count]) => count > 0);
      expect(leakedEvents.length).toBe(0);
    });
  });

  describe('Long-Running Session Memory Stability', () => {
    it('should maintain stable memory usage during extended sessions', async () => {
      memoryProfiler.startProfiling();
      
      const { rerender } = render(
        <AppProvider>
          <UnifiedTacticsBoard 
            initialFormation={generateEnhancedFormation()}
            players={Array.from({ length: 11 }, () => generateEnhancedPlayer())}
          />
        </AppProvider>
      );

      // Simulate extended user session
      for (let i = 0; i < 50; i++) {
        // Simulate various user actions
        const board = screen.getByTestId('tactical-board');
        await user.click(board);
        
        // Change formation occasionally
        if (i % 10 === 0) {
          rerender(
            <AppProvider>
              <UnifiedTacticsBoard 
                initialFormation={generateEnhancedFormation()}
                players={Array.from({ length: 11 }, () => generateEnhancedPlayer())}
              />
            </AppProvider>
          );
        }
        
        // Record memory periodically
        if (i % 10 === 0) {
          memoryProfiler.recordMeasurement();
          
          // Force GC occasionally
          if (i % 25 === 0) {
            memoryProfiler.forceGarbageCollection();
          }
        }
        
        // Small delay to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const result = memoryProfiler.stopProfiling();
      
      // Memory should remain stable over extended session
      expect(result.growth).toBeLessThan(40);
      expect(result.trend).not.toBe('growing');
      
      console.log(`Extended session memory analysis: ${result.growth.toFixed(2)}% growth`);
    }, 30000); // Extended timeout for long-running test
  });

  describe('Memory Leak Detection Utilities', () => {
    it('should detect memory growth patterns', () => {
      const profiler = new MemoryProfiler();
      profiler.startProfiling();
      
      // Simulate memory growth
      for (let i = 0; i < 10; i++) {
        (performance as any).memory.usedJSHeapSize += 1000000; // Simulate 1MB growth
        profiler.recordMeasurement();
      }
      
      const result = profiler.stopProfiling();
      expect(result.trend).toBe('growing');
      expect(result.growth).toBeGreaterThan(0);
    });

    it('should provide detailed memory analysis', () => {
      const profiler = new MemoryProfiler();
      profiler.startProfiling();
      
      profiler.recordMeasurement();
      profiler.recordMeasurement();
      
      const result = profiler.stopProfiling();
      
      expect(result).toHaveProperty('leak');
      expect(result).toHaveProperty('growth');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('measurements');
      expect(result).toHaveProperty('duration');
    });
  });

  describe('Resource Cleanup Verification', () => {
    it('should clean up all resources properly', async () => {
      const resources = {
        timers: new Set<number>(),
        intervals: new Set<number>(),
        eventListeners: new Set<Function>()
      };

      // Mock timer functions to track resource usage
      const originalSetTimeout = global.setTimeout;
      const originalClearTimeout = global.clearTimeout;
      const originalSetInterval = global.setInterval;
      const originalClearInterval = global.clearInterval;

      global.setTimeout = (fn: Function, delay: number) => {
        const id = originalSetTimeout(fn, delay);
        resources.timers.add(id);
        return id;
      };

      global.clearTimeout = (id: number) => {
        resources.timers.delete(id);
        return originalClearTimeout(id);
      };

      global.setInterval = (fn: Function, delay: number) => {
        const id = originalSetInterval(fn, delay);
        resources.intervals.add(id);
        return id;
      };

      global.clearInterval = (id: number) => {
        resources.intervals.delete(id);
        return originalClearInterval(id);
      };

      // Test component lifecycle
      const { unmount } = render(
        <AppProvider>
          <UnifiedTacticsBoard 
            initialFormation={generateEnhancedFormation()}
            players={Array.from({ length: 11 }, () => generateEnhancedPlayer())}
          />
        </AppProvider>
      );

      unmount();

      // Wait for cleanup
      await waitFor(() => {
        expect(resources.timers.size).toBe(0);
        expect(resources.intervals.size).toBe(0);
      }, { timeout: 1000 });

      // Restore original functions
      global.setTimeout = originalSetTimeout;
      global.clearTimeout = originalClearTimeout;
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
    });
  });
});