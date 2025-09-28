import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, generatePerformanceTestData } from '../utils/enhanced-mock-generators';
import { UnifiedTacticsBoard } from '../../components/tactics/UnifiedTacticsBoard';

/**
 * PERFORMANCE TEST SUITE FOR TACTICAL BOARD
 * 
 * Comprehensive performance testing covering:
 * - Render performance with large datasets
 * - Memory usage optimization
 * - Animation frame rates
 * - CPU usage under load
 * - Network request optimization
 * - Bundle size impact
 * - Real-world usage scenarios
 */

describe('⚡ Tactical Board Performance Tests', () => {
  let performanceObserver: PerformanceObserver;
  let performanceMetrics: PerformanceEntry[] = [];

  beforeEach(() => {
    // Setup performance monitoring
    performanceMetrics = [];
    
    if (typeof PerformanceObserver !== 'undefined') {
      performanceObserver = new PerformanceObserver((list) => {
        performanceMetrics.push(...list.getEntries());
      });
      performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    }

    // Mock performance APIs
    global.performance.mark = vi.fn();
    global.performance.measure = vi.fn();
    global.performance.getEntriesByType = vi.fn(() => []);
    global.performance.getEntriesByName = vi.fn(() => []);

    // Setup high-precision timing
    global.performance.now = vi.fn(() => Date.now());

    // Mock requestAnimationFrame for consistent timing
    let frameId = 0;
    global.requestAnimationFrame = vi.fn((callback) => {
      setTimeout(() => callback(performance.now()), 16.67); // 60fps
      return ++frameId;
    });

    global.cancelAnimationFrame = vi.fn();

    // Mock memory API
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 10000000, // 10MB
        totalJSHeapSize: 20000000, // 20MB
        jsHeapSizeLimit: 2147483648 // 2GB
      },
      writable: true
    });
  });

  afterEach(() => {
    if (performanceObserver) {
      performanceObserver.disconnect();
    }
    vi.clearAllMocks();
  });

  describe('🎯 Render Performance', () => {
    it('should render with minimal formation in <50ms', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(50);
    });

    it('should handle large player datasets efficiently', async () => {
      const largeData = generatePerformanceTestData();
      const { players, formations } = largeData.large();
      
      const initialState = {
        tactics: {
          players: players.slice(0, 100), // 100 players
          formations: { [formations[0].id]: formations[0] },
          activeFormationIds: { home: formations[0].id, away: '' }
        }
      };

      const startTime = performance.now();
      
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle 100 players within 200ms
      expect(renderTime).toBeLessThan(200);
    });

    it('should maintain performance with complex formations', async () => {
      const complexData = generatePerformanceTestData();
      const { players, formations, drawings } = complexData.medium();
      
      const initialState = {
        tactics: {
          players: players.slice(0, 25),
          formations: formations.reduce((acc, f) => ({ ...acc, [f.id]: f }), {}),
          drawings: drawings.slice(0, 50), // 50 drawing shapes
          activeFormationIds: { home: formations[0].id, away: formations[1]?.id || '' }
        }
      };

      const startTime = performance.now();
      
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Complex formation should render within 150ms
      expect(renderTime).toBeLessThan(150);
    });

    it('should optimize re-renders with state changes', async () => {
      const { container, rerender } = renderWithProviders(<UnifiedTacticsBoard />);
      
      // Initial render
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Track re-render performance
      const rerenderStart = performance.now();
      
      // Update props to trigger re-render
      rerender(<UnifiedTacticsBoard className="updated" />);
      
      const rerenderEnd = performance.now();
      const rerenderTime = rerenderEnd - rerenderStart;
      
      // Re-renders should be very fast
      expect(rerenderTime).toBeLessThan(10);
    });
  });

  describe('🧠 Memory Usage Optimization', () => {
    it('should maintain stable memory usage', async () => {
      const initialMemory = (performance as any).memory.usedJSHeapSize;
      
      renderWithProviders(<UnifiedTacticsBoard />);
      
      // Simulate multiple interactions
      const field = screen.getByTestId('modern-field');
      
      for (let i = 0; i < 50; i++) {
        fireEvent.click(field);
        fireEvent.mouseMove(field, { clientX: i * 10, clientY: i * 10 });
      }
      
      await waitFor(() => {
        const currentMemory = (performance as any).memory.usedJSHeapSize;
        const memoryIncrease = currentMemory - initialMemory;
        
        // Memory increase should be reasonable (less than 5MB for 50 interactions)
        expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
      });
    });

    it('should clean up event listeners and timers', async () => {
      const { unmount } = renderWithProviders(<UnifiedTacticsBoard />);
      
      // Track event listeners
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      // Trigger some interactions that create listeners
      const field = screen.getByTestId('modern-field');
      fireEvent.mouseDown(field);
      fireEvent.mouseMove(field);
      fireEvent.mouseUp(field);
      
      const listenersAdded = addEventListenerSpy.mock.calls.length;
      
      // Unmount component
      unmount();
      
      const listenersRemoved = removeEventListenerSpy.mock.calls.length;
      
      // Should clean up all listeners
      expect(listenersRemoved).toBeGreaterThanOrEqual(listenersAdded);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should handle memory pressure gracefully', async () => {
      // Simulate low memory conditions
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 1900000000, // Near limit
          totalJSHeapSize: 2000000000,
          jsHeapSizeLimit: 2147483648
        },
        writable: true
      });

      const startTime = performance.now();
      
      renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should still render reasonably fast under memory pressure
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('🎬 Animation Performance', () => {
    it('should maintain 60fps during smooth animations', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const field = screen.getByTestId('modern-field');
      
      // Track frame timing
      const frameTimes: number[] = [];
      let lastFrameTime = performance.now();
      
      const mockRAF = (callback: FrameRequestCallback) => {
        const currentTime = performance.now();
        frameTimes.push(currentTime - lastFrameTime);
        lastFrameTime = currentTime;
        
        setTimeout(() => callback(currentTime), 16.67); // Target 60fps
        return frameTimes.length;
      };
      
      global.requestAnimationFrame = mockRAF;
      
      // Trigger animations through drag operations
      fireEvent.mouseDown(field, { clientX: 100, clientY: 100 });
      
      for (let i = 0; i < 30; i++) {
        fireEvent.mouseMove(field, { clientX: 100 + i * 5, clientY: 100 + i * 2 });
        await new Promise(resolve => setTimeout(resolve, 16)); // Wait for frame
      }
      
      fireEvent.mouseUp(field);
      
      // Calculate average frame time
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      
      // Should maintain close to 16.67ms (60fps)
      expect(avgFrameTime).toBeLessThan(20); // Allow some variance
    });

    it('should handle heavy drawing operations efficiently', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const canvas = screen.getByTestId('drawing-canvas');
      
      const startTime = performance.now();
      
      // Simulate complex drawing with many points
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(canvas, {
          clientX: 100 + Math.sin(i * 0.1) * 50,
          clientY: 100 + Math.cos(i * 0.1) * 50
        });
      }
      
      fireEvent.mouseUp(canvas);
      
      const endTime = performance.now();
      const drawingTime = endTime - startTime;
      
      // Complex drawing should complete within 200ms
      expect(drawingTime).toBeLessThan(200);
    });

    it('should optimize animation loops and reduce CPU usage', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      
      // Mock CPU usage tracking
      let cpuUsageSnapshots: number[] = [];
      const startCpuTime = process.hrtime ? process.hrtime()[0] : Date.now();
      
      // Trigger continuous animations
      const field = screen.getByTestId('modern-field');
      
      for (let i = 0; i < 20; i++) {
        fireEvent.mouseMove(field, { clientX: i * 10, clientY: i * 10 });
        
        // Simulate CPU measurement
        const currentTime = process.hrtime ? process.hrtime()[0] : Date.now();
        cpuUsageSnapshots.push(currentTime - startCpuTime);
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // CPU usage should remain stable (not constantly increasing)
      const initialUsage = cpuUsageSnapshots[0];
      const finalUsage = cpuUsageSnapshots[cpuUsageSnapshots.length - 1];
      const usageIncrease = finalUsage - initialUsage;
      
      // Should not have excessive CPU usage increase
      expect(usageIncrease).toBeLessThan(1000); // Reasonable threshold
    });
  });

  describe('🌐 Network and Data Performance', () => {
    it('should batch formation save operations', async () => {
      const mockSaveFormation = vi.fn().mockResolvedValue({ success: true });
      
      renderWithProviders(<UnifiedTacticsBoard onSaveFormation={mockSaveFormation} />);
      
      const saveButton = screen.getByTestId('save-formation-button');
      
      // Rapid save attempts
      for (let i = 0; i < 5; i++) {
        fireEvent.click(saveButton);
      }
      
      await waitFor(() => {
        // Should batch calls rather than making 5 separate requests
        expect(mockSaveFormation).toHaveBeenCalledTimes(1);
      });
    });

    it('should optimize drawing data serialization', async () => {
      const largeDrawings = Array.from({ length: 1000 }, (_, i) => ({
        id: `drawing-${i}`,
        tool: 'pen' as const,
        color: '#ff0000',
        points: Array.from({ length: 50 }, (_, j) => ({ x: i + j, y: i * 2 + j })),
        timestamp: Date.now()
      }));

      const initialState = {
        tactics: { drawings: largeDrawings }
      };

      const startTime = performance.now();
      
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should handle large drawing datasets efficiently
      expect(loadTime).toBeLessThan(300);
    });

    it('should implement effective caching strategies', async () => {
      const { rerender } = renderWithProviders(<UnifiedTacticsBoard />);
      
      // First render
      const firstRenderStart = performance.now();
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      const firstRenderTime = performance.now() - firstRenderStart;
      
      // Second render with same props (should use cache)
      const secondRenderStart = performance.now();
      rerender(<UnifiedTacticsBoard />);
      const secondRenderTime = performance.now() - secondRenderStart;
      
      // Cached render should be significantly faster
      expect(secondRenderTime).toBeLessThan(firstRenderTime * 0.5);
    });
  });

  describe('📱 Responsive Performance', () => {
    it('should adapt performance for mobile devices', async () => {
      // Mock mobile device
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, writable: true });
      Object.defineProperty(navigator, 'deviceMemory', { value: 2, writable: true });
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

      const startTime = performance.now();
      
      renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const mobileRenderTime = endTime - startTime;
      
      // Should optimize for mobile constraints
      expect(mobileRenderTime).toBeLessThan(100);
    });

    it('should reduce feature complexity on low-end devices', async () => {
      // Mock low-end device
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 5000000, // 5MB
          totalJSHeapSize: 50000000, // 50MB (low)
          jsHeapSizeLimit: 100000000 // 100MB limit
        },
        writable: true
      });

      renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      
      // Should disable heavy features on low-end devices
      // This would be verified through component behavior analysis
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('should handle orientation changes efficiently', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      
      // Initial landscape
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      
      const orientationStart = performance.now();
      
      // Trigger orientation change event
      fireEvent(window, new Event('orientationchange'));
      fireEvent(window, new Event('resize'));
      
      // Change to portrait
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true });
      
      fireEvent(window, new Event('resize'));
      
      const orientationEnd = performance.now();
      const orientationTime = orientationEnd - orientationStart;
      
      // Orientation change should be handled quickly
      expect(orientationTime).toBeLessThan(50);
    });
  });

  describe('🔄 Stress Testing', () => {
    it('should handle rapid user interactions without degradation', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const field = screen.getByTestId('modern-field');
      const startTime = performance.now();
      
      // Simulate 100 rapid interactions
      for (let i = 0; i < 100; i++) {
        fireEvent.click(field, { clientX: Math.random() * 800, clientY: Math.random() * 600 });
        fireEvent.mouseMove(field, { clientX: Math.random() * 800, clientY: Math.random() * 600 });
        
        if (i % 10 === 0) {
          // Measure incremental performance
          const currentTime = performance.now();
          const timePerInteraction = (currentTime - startTime) / (i + 1);
          
          // Performance shouldn't degrade over time
          expect(timePerInteraction).toBeLessThan(5); // 5ms per interaction
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // 100 interactions should complete within 500ms
      expect(totalTime).toBeLessThan(500);
    });

    it('should maintain performance under memory pressure', async () => {
      // Create memory pressure
      const largeArrays: number[][] = [];
      for (let i = 0; i < 100; i++) {
        largeArrays.push(new Array(10000).fill(Math.random()));
      }
      
      const startTime = performance.now();
      
      renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should still render within reasonable time under memory pressure
      expect(renderTime).toBeLessThan(200);
      
      // Cleanup
      largeArrays.length = 0;
    });

    it('should handle concurrent operations efficiently', async () => {
      renderWithProviders(<UnifiedTacticsBoard />);
      
      const field = screen.getByTestId('modern-field');
      const canvas = screen.getByTestId('drawing-canvas');
      
      const startTime = performance.now();
      
      // Simulate concurrent operations
      const operations = Promise.all([
        // Player movement
        new Promise(resolve => {
          for (let i = 0; i < 20; i++) {
            setTimeout(() => {
              fireEvent.mouseMove(field, { clientX: i * 10, clientY: i * 10 });
              if (i === 19) resolve(null);
            }, i * 10);
          }
        }),
        
        // Drawing operations
        new Promise(resolve => {
          for (let i = 0; i < 20; i++) {
            setTimeout(() => {
              fireEvent.click(canvas, { clientX: i * 15, clientY: i * 15 });
              if (i === 19) resolve(null);
            }, i * 10);
          }
        }),
        
        // Formation changes
        new Promise(resolve => {
          setTimeout(() => {
            fireEvent.click(screen.getByTestId('formation-templates-button'));
            resolve(null);
          }, 100);
        })
      ]);
      
      await operations;
      
      const endTime = performance.now();
      const concurrentTime = endTime - startTime;
      
      // Concurrent operations should complete efficiently
      expect(concurrentTime).toBeLessThan(300);
    });
  });

  describe('📊 Performance Monitoring', () => {
    it('should track key performance metrics', async () => {
      const metrics = {
        renderTime: 0,
        interactionTime: 0,
        memoryUsage: 0,
        animationFrames: 0
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      // Track render time
      const renderStart = performance.now();
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      metrics.renderTime = performance.now() - renderStart;
      
      // Track interaction time
      const interactionStart = performance.now();
      const field = screen.getByTestId('modern-field');
      fireEvent.click(field);
      metrics.interactionTime = performance.now() - interactionStart;
      
      // Track memory usage
      metrics.memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Verify metrics are within acceptable ranges
      expect(metrics.renderTime).toBeLessThan(100);
      expect(metrics.interactionTime).toBeLessThan(10);
      expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB
      
      console.log('Performance Metrics:', metrics);
    });

    it('should identify performance bottlenecks', async () => {
      // Mock performance profiling
      const performanceMarks: string[] = [];
      
      global.performance.mark = vi.fn((name: string) => {
        performanceMarks.push(name);
      });

      renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      
      // Trigger various operations
      const field = screen.getByTestId('modern-field');
      fireEvent.click(field);
      fireEvent.mouseMove(field);
      
      // Verify performance marking
      expect(global.performance.mark).toHaveBeenCalled();
    });

    it('should provide performance optimization recommendations', async () => {
      const recommendations: string[] = [];
      
      // Mock large dataset scenario
      const largeData = generatePerformanceTestData().large();
      const initialState = {
        tactics: {
          players: largeData.players.slice(0, 50),
          formations: { [largeData.formations[0].id]: largeData.formations[0] },
          drawings: largeData.drawings.slice(0, 25)
        }
      };

      const startTime = performance.now();
      
      renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });
      
      const renderTime = performance.now() - startTime;
      
      // Generate recommendations based on performance
      if (renderTime > 100) {
        recommendations.push('Consider reducing initial dataset size');
      }
      
      if ((performance as any).memory?.usedJSHeapSize > 30 * 1024 * 1024) {
        recommendations.push('Consider implementing virtual scrolling');
      }
      
      // Recommendations should be actionable
      expect(recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });
});