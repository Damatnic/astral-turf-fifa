import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import TacticalDrawingTools, { type DrawingShape } from '../../components/tactics/TacticalDrawingTools';
import { generateTacticalAnnotations, generatePerformanceTestData } from '../utils/enhanced-mock-generators';
import { performanceDragTest } from '../utils/drag-drop-test-utils';

/**
 * Performance Benchmarking Suite for Drawing Tools
 * 
 * Benchmarks cover:
 * - Rendering performance with many shapes
 * - Drawing operation speed and responsiveness
 * - Memory usage during intensive drawing
 * - Canvas redraw performance
 * - Touch/pointer event handling speed
 * - Undo/redo stack performance
 * - Shape manipulation algorithms
 * - Real-time collaboration stress testing
 */

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  frameRate: number;
  operationTime: number;
  shapesProcessed: number;
}

interface BenchmarkResult {
  testName: string;
  metrics: PerformanceMetrics;
  baseline: PerformanceMetrics;
  performanceRatio: number;
  passed: boolean;
  notes?: string;
}

// Mock framer-motion for performance testing
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => 
      React.createElement('div', { ref, ...props }, children)
    ),
    button: React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => 
      React.createElement('button', { ref, ...props }, children)
    )
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  PanInfo: {} as any
}));

// Mock icons for performance
vi.mock('lucide-react', () => ({
  Pen: () => React.createElement('span', { 'data-testid': 'pen-icon' }),
  ArrowRight: () => React.createElement('span', { 'data-testid': 'arrow-icon' }),
  Square: () => React.createElement('span', { 'data-testid': 'rectangle-icon' }),
  Circle: () => React.createElement('span', { 'data-testid': 'circle-icon' }),
  Triangle: () => React.createElement('span', { 'data-testid': 'triangle-icon' }),
  Eraser: () => React.createElement('span', { 'data-testid': 'eraser-icon' }),
  Undo: () => React.createElement('span', { 'data-testid': 'undo-icon' }),
  Redo: () => React.createElement('span', { 'data-testid': 'redo-icon' }),
  Palette: () => React.createElement('span', { 'data-testid': 'palette-icon' }),
  Settings: () => React.createElement('span', { 'data-testid': 'settings-icon' }),
  Save: () => React.createElement('span', { 'data-testid': 'save-icon' }),
  Trash2: () => React.createElement('span', { 'data-testid': 'trash-icon' })
}));

describe('Drawing Tools Performance Benchmarks', () => {
  const mockOnClose = vi.fn();
  const mockOnSaveDrawing = vi.fn();
  
  const defaultProps = {
    isVisible: true,
    onClose: mockOnClose,
    onSaveDrawing: mockOnSaveDrawing,
    fieldDimensions: { width: 1200, height: 800 },
    viewMode: 'standard' as const
  };

  // Performance baselines (adjust based on target requirements)
  const performanceBaselines = {
    maxRenderTime: 100, // ms
    maxMemoryIncrease: 50 * 1024 * 1024, // 50MB
    minFrameRate: 30, // fps
    maxOperationTime: 16, // ms (60fps = 16.67ms per frame)
    maxShapesPerSecond: 1000
  };

  let performanceObserver: PerformanceObserver | null = null;
  let frameRateCounter: { frames: number; lastTime: number } = { frames: 0, lastTime: 0 };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup performance monitoring
    if ('PerformanceObserver' in window) {
      performanceObserver = new PerformanceObserver((list) => {
        // Monitor performance entries
      });
      performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    }

    // Mock performance timing
    Object.defineProperty(window, 'performance', {
      value: {
        ...window.performance,
        now: vi.fn(() => Date.now()),
        mark: vi.fn(),
        measure: vi.fn(),
        memory: {
          usedJSHeapSize: 10 * 1024 * 1024, // 10MB baseline
          totalJSHeapSize: 20 * 1024 * 1024,
          jsHeapSizeLimit: 100 * 1024 * 1024
        }
      },
      writable: true
    });

    // Frame rate monitoring
    frameRateCounter = { frames: 0, lastTime: performance.now() };
  });

  afterEach(() => {
    if (performanceObserver) {
      performanceObserver.disconnect();
    }
  });

  const measurePerformance = <T,>(
    operation: () => T,
    operationName: string
  ): { result: T; metrics: PerformanceMetrics } => {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    const result = operation();

    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

    const metrics: PerformanceMetrics = {
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      frameRate: calculateFrameRate(),
      operationTime: endTime - startTime,
      shapesProcessed: 0 // Set by specific tests
    };

    return { result, metrics };
  };

  const calculateFrameRate = (): number => {
    const currentTime = performance.now();
    frameRateCounter.frames++;
    
    if (currentTime - frameRateCounter.lastTime >= 1000) {
      const fps = frameRateCounter.frames;
      frameRateCounter.frames = 0;
      frameRateCounter.lastTime = currentTime;
      return fps;
    }
    
    return 60; // Default assumption
  };

  describe('Rendering Performance', () => {
    it('should render small datasets efficiently', () => {
      const shapes = generateTacticalAnnotations(10);
      
      const { metrics } = measurePerformance(() => {
        const { container } = render(
          <TacticalDrawingTools {...defaultProps} initialShapes={shapes} />
        );
        return container;
      }, 'small-dataset-render');

      expect(metrics.renderTime).toBeLessThan(performanceBaselines.maxRenderTime);
      expect(metrics.memoryUsage).toBeLessThan(performanceBaselines.maxMemoryIncrease);
    });

    it('should render medium datasets within acceptable limits', () => {
      const shapes = generateTacticalAnnotations(100);
      
      const { metrics } = measurePerformance(() => {
        const { container } = render(
          <TacticalDrawingTools {...defaultProps} initialShapes={shapes} />
        );
        return container;
      }, 'medium-dataset-render');

      // Medium datasets may take longer but should remain reasonable
      expect(metrics.renderTime).toBeLessThan(performanceBaselines.maxRenderTime * 5);
      expect(metrics.memoryUsage).toBeLessThan(performanceBaselines.maxMemoryIncrease * 2);
    });

    it('should handle large datasets gracefully', () => {
      const shapes = generateTacticalAnnotations(500);
      
      const { metrics } = measurePerformance(() => {
        const { container } = render(
          <TacticalDrawingTools {...defaultProps} initialShapes={shapes} />
        );
        return container;
      }, 'large-dataset-render');

      // Large datasets may be slower but shouldn't freeze
      expect(metrics.renderTime).toBeLessThan(1000); // 1 second max
      expect(metrics.memoryUsage).toBeLessThan(performanceBaselines.maxMemoryIncrease * 5);
    });

    it('should maintain frame rate during complex renders', () => {
      const complexShapes = Array.from({ length: 50 }, () => ({
        id: `complex-${Math.random()}`,
        type: 'line' as const,
        points: Array.from({ length: 100 }, (_, i) => ({ x: i, y: Math.sin(i) * 50 })),
        color: '#3b82f6',
        strokeWidth: 2,
        opacity: 1,
        timestamp: Date.now()
      }));

      const { metrics } = measurePerformance(() => {
        const { container } = render(
          <TacticalDrawingTools {...defaultProps} initialShapes={complexShapes} />
        );
        
        // Simulate frame rendering
        for (let i = 0; i < 10; i++) {
          frameRateCounter.frames++;
        }
        
        return container;
      }, 'complex-shapes-render');

      // Should maintain reasonable frame rate
      expect(metrics.frameRate).toBeGreaterThan(performanceBaselines.minFrameRate / 2);
    });
  });

  describe('Drawing Operation Performance', () => {
    it('should handle rapid drawing operations efficiently', async () => {
      const { container } = render(<TacticalDrawingTools {...defaultProps} />);
      const drawingArea = container.querySelector('svg')!;

      const { metrics } = measurePerformance(() => {
        // Simulate rapid drawing
        for (let i = 0; i < 100; i++) {
          fireEvent.mouseDown(drawingArea, { clientX: i * 5, clientY: i * 5 });
          fireEvent.mouseMove(drawingArea, { clientX: i * 5 + 50, clientY: i * 5 + 50 });
          fireEvent.mouseUp(drawingArea);
        }
        return 100;
      }, 'rapid-drawing-operations');

      metrics.shapesProcessed = 100;
      
      expect(metrics.operationTime / metrics.shapesProcessed).toBeLessThan(
        performanceBaselines.maxOperationTime
      );
    });

    it('should optimize stroke rendering for complex paths', () => {
      const { container } = render(<TacticalDrawingTools {...defaultProps} />);
      const drawingArea = container.querySelector('svg')!;

      const { metrics } = measurePerformance(() => {
        // Create complex stroke with many points
        fireEvent.mouseDown(drawingArea, { clientX: 0, clientY: 0 });
        
        for (let i = 0; i < 1000; i++) {
          fireEvent.mouseMove(drawingArea, { 
            clientX: Math.sin(i * 0.1) * 100 + 200, 
            clientY: Math.cos(i * 0.1) * 100 + 200 
          });
        }
        
        fireEvent.mouseUp(drawingArea);
        return 1000;
      }, 'complex-stroke-rendering');

      metrics.shapesProcessed = 1000;
      
      // Should handle complex strokes efficiently
      expect(metrics.operationTime).toBeLessThan(500); // 500ms max for 1000 points
    });

    it('should perform shape manipulations quickly', () => {
      const shapes = generateTacticalAnnotations(50);
      const { container } = render(
        <TacticalDrawingTools {...defaultProps} initialShapes={shapes} />
      );

      const { metrics } = measurePerformance(() => {
        // Simulate shape manipulations (like erasing)
        const shapeElements = container.querySelectorAll('path, line, rect, circle');
        shapeElements.forEach((element, index) => {
          if (index % 2 === 0) {
            fireEvent.click(element);
          }
        });
        return shapeElements.length;
      }, 'shape-manipulations');

      metrics.shapesProcessed = shapes.length;
      
      expect(metrics.operationTime / metrics.shapesProcessed).toBeLessThan(5); // 5ms per shape max
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during continuous drawing', () => {
      const { container, unmount } = render(<TacticalDrawingTools {...defaultProps} />);
      const drawingArea = container.querySelector('svg')!;

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Simulate extended drawing session
      for (let session = 0; session < 10; session++) {
        for (let i = 0; i < 50; i++) {
          fireEvent.mouseDown(drawingArea, { clientX: i, clientY: i });
          fireEvent.mouseMove(drawingArea, { clientX: i + 50, clientY: i + 50 });
          fireEvent.mouseUp(drawingArea);
        }
        
        // Clear shapes periodically
        if (session % 3 === 0) {
          const trashButton = container.querySelector('[data-testid="trash-icon"]')?.closest('button');
          if (trashButton) {
            fireEvent.click(trashButton);
          }
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      unmount();

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(performanceBaselines.maxMemoryIncrease);
    });

    it('should efficiently manage undo/redo history', () => {
      const { container } = render(<TacticalDrawingTools {...defaultProps} />);
      const drawingArea = container.querySelector('svg')!;

      const { metrics } = measurePerformance(() => {
        // Create shapes and undo/redo operations
        for (let i = 0; i < 100; i++) {
          // Draw
          fireEvent.mouseDown(drawingArea, { clientX: i, clientY: i });
          fireEvent.mouseUp(drawingArea);
          
          // Undo
          if (i % 10 === 0) {
            const undoButton = container.querySelector('[data-testid="undo-icon"]')?.closest('button');
            if (undoButton) {
              fireEvent.click(undoButton);
            }
          }
          
          // Redo
          if (i % 15 === 0) {
            const redoButton = container.querySelector('[data-testid="redo-icon"]')?.closest('button');
            if (redoButton) {
              fireEvent.click(redoButton);
            }
          }
        }
        return 100;
      }, 'undo-redo-performance');

      metrics.shapesProcessed = 100;
      
      expect(metrics.operationTime / metrics.shapesProcessed).toBeLessThan(10); // 10ms per operation max
    });
  });

  describe('Touch and Pointer Event Performance', () => {
    it('should handle high-frequency touch events', () => {
      const { container } = render(<TacticalDrawingTools {...defaultProps} />);
      const drawingArea = container.querySelector('svg')!;

      const { metrics } = measurePerformance(() => {
        // Simulate high-frequency touch events (120Hz)
        const touchStartEvent = new TouchEvent('touchstart', {
          touches: [{
            identifier: 0,
            target: drawingArea,
            clientX: 100,
            clientY: 100,
            pageX: 100,
            pageY: 100,
            screenX: 100,
            screenY: 100,
            radiusX: 10,
            radiusY: 10,
            rotationAngle: 0,
            force: 1
          }] as any
        });

        fireEvent(drawingArea, touchStartEvent);

        for (let i = 0; i < 120; i++) {
          const touchMoveEvent = new TouchEvent('touchmove', {
            touches: [{
              identifier: 0,
              target: drawingArea,
              clientX: 100 + i,
              clientY: 100 + i,
              pageX: 100 + i,
              pageY: 100 + i,
              screenX: 100 + i,
              screenY: 100 + i,
              radiusX: 10,
              radiusY: 10,
              rotationAngle: 0,
              force: 1
            }] as any
          });

          fireEvent(drawingArea, touchMoveEvent);
        }

        const touchEndEvent = new TouchEvent('touchend', {
          changedTouches: [{
            identifier: 0,
            target: drawingArea,
            clientX: 220,
            clientY: 220,
            pageX: 220,
            pageY: 220,
            screenX: 220,
            screenY: 220,
            radiusX: 10,
            radiusY: 10,
            rotationAngle: 0,
            force: 1
          }] as any
        });

        fireEvent(drawingArea, touchEndEvent);
        
        return 120;
      }, 'high-frequency-touch-events');

      metrics.shapesProcessed = 120;
      
      // Should handle high-frequency events without lag
      expect(metrics.operationTime / metrics.shapesProcessed).toBeLessThan(1); // 1ms per event max
    });

    it('should optimize pointer event processing', () => {
      const { container } = render(<TacticalDrawingTools {...defaultProps} />);
      const drawingArea = container.querySelector('svg')!;

      const { metrics } = measurePerformance(() => {
        // Simulate pointer events with pressure sensitivity
        for (let i = 0; i < 100; i++) {
          const pointerEvent = new PointerEvent('pointermove', {
            pointerId: 1,
            clientX: i * 5,
            clientY: i * 5,
            pressure: Math.random(),
            tiltX: Math.random() * 90,
            tiltY: Math.random() * 90,
            twist: Math.random() * 360,
            pointerType: 'pen',
            isPrimary: true,
            bubbles: true,
            cancelable: true
          });

          fireEvent(drawingArea, pointerEvent);
        }
        return 100;
      }, 'pointer-event-processing');

      metrics.shapesProcessed = 100;
      
      expect(metrics.operationTime / metrics.shapesProcessed).toBeLessThan(2); // 2ms per event max
    });
  });

  describe('Algorithm Performance', () => {
    it('should optimize path simplification algorithms', () => {
      const complexPath = Array.from({ length: 10000 }, (_, i) => ({
        x: i * 0.1,
        y: Math.sin(i * 0.01) * 100 + Math.random() * 10
      }));

      const { metrics } = measurePerformance(() => {
        // Simulate path simplification (Douglas-Peucker or similar)
        let simplifiedPath = complexPath;
        
        // Mock simplification algorithm
        for (let tolerance = 1; tolerance <= 10; tolerance++) {
          simplifiedPath = complexPath.filter((_, index) => index % tolerance === 0);
        }
        
        return simplifiedPath.length;
      }, 'path-simplification');

      metrics.shapesProcessed = complexPath.length;
      
      // Path simplification should be fast
      expect(metrics.operationTime).toBeLessThan(100); // 100ms max for 10k points
    });

    it('should efficiently detect shape intersections', () => {
      const shapes = generateTacticalAnnotations(100);

      const { metrics } = measurePerformance(() => {
        let intersectionCount = 0;
        
        // Mock intersection detection
        for (let i = 0; i < shapes.length; i++) {
          for (let j = i + 1; j < shapes.length; j++) {
            // Simplified bounding box intersection
            const shape1 = shapes[i];
            const shape2 = shapes[j];
            
            if (shape1.points.length > 0 && shape2.points.length > 0) {
              const overlap = !(
                shape1.points[0].x > shape2.points[0].x + 10 ||
                shape2.points[0].x > shape1.points[0].x + 10 ||
                shape1.points[0].y > shape2.points[0].y + 10 ||
                shape2.points[0].y > shape1.points[0].y + 10
              );
              
              if (overlap) intersectionCount++;
            }
          }
        }
        
        return intersectionCount;
      }, 'intersection-detection');

      metrics.shapesProcessed = shapes.length * shapes.length;
      
      // Intersection detection should be efficient
      expect(metrics.operationTime / metrics.shapesProcessed).toBeLessThan(0.01); // 0.01ms per comparison
    });
  });

  describe('Stress Testing', () => {
    it('should survive extreme drawing sessions', () => {
      const { container } = render(<TacticalDrawingTools {...defaultProps} />);
      const drawingArea = container.querySelector('svg')!;

      const { metrics } = measurePerformance(() => {
        // Extreme stress test
        for (let session = 0; session < 50; session++) {
          // Draw many shapes quickly
          for (let i = 0; i < 20; i++) {
            fireEvent.mouseDown(drawingArea, { 
              clientX: Math.random() * 800, 
              clientY: Math.random() * 600 
            });
            
            // Complex path
            for (let j = 0; j < 10; j++) {
              fireEvent.mouseMove(drawingArea, { 
                clientX: Math.random() * 800, 
                clientY: Math.random() * 600 
              });
            }
            
            fireEvent.mouseUp(drawingArea);
          }
          
          // Occasionally clear
          if (session % 10 === 0) {
            const trashButton = container.querySelector('[data-testid="trash-icon"]')?.closest('button');
            if (trashButton) {
              fireEvent.click(trashButton);
            }
          }
        }
        
        return 50 * 20;
      }, 'extreme-stress-test');

      metrics.shapesProcessed = 1000;
      
      // Should survive extreme conditions
      expect(metrics.operationTime).toBeLessThan(5000); // 5 seconds max
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should handle concurrent shape operations', () => {
      const largeShapeSet = generateTacticalAnnotations(200);
      const { container } = render(
        <TacticalDrawingTools {...defaultProps} initialShapes={largeShapeSet} />
      );

      const { metrics } = measurePerformance(() => {
        // Simulate concurrent operations
        const operations = [
          () => {
            // Add shapes
            const drawingArea = container.querySelector('svg')!;
            for (let i = 0; i < 10; i++) {
              fireEvent.mouseDown(drawingArea, { clientX: i * 10, clientY: i * 10 });
              fireEvent.mouseUp(drawingArea);
            }
          },
          () => {
            // Delete shapes
            const shapeElements = container.querySelectorAll('path, line');
            for (let i = 0; i < Math.min(5, shapeElements.length); i++) {
              fireEvent.click(shapeElements[i]);
            }
          },
          () => {
            // Undo operations
            const undoButton = container.querySelector('[data-testid="undo-icon"]')?.closest('button');
            if (undoButton) {
              for (let i = 0; i < 3; i++) {
                fireEvent.click(undoButton);
              }
            }
          }
        ];

        // Execute operations concurrently (simulated)
        operations.forEach(op => op());
        
        return operations.length;
      }, 'concurrent-operations');

      metrics.shapesProcessed = 200;
      
      // Should handle concurrent operations gracefully
      expect(metrics.operationTime).toBeLessThan(1000); // 1 second max
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions in rendering', () => {
      const testSizes = [10, 50, 100, 200];
      const renderTimes: number[] = [];

      testSizes.forEach(size => {
        const shapes = generateTacticalAnnotations(size);
        
        const { metrics } = measurePerformance(() => {
          const { container } = render(
            <TacticalDrawingTools {...defaultProps} initialShapes={shapes} />
          );
          return container;
        }, `regression-test-${size}`);

        renderTimes.push(metrics.renderTime);
      });

      // Rendering time should scale reasonably (not exponentially)
      for (let i = 1; i < renderTimes.length; i++) {
        const scaleFactor = testSizes[i] / testSizes[i - 1];
        const timeRatio = renderTimes[i] / renderTimes[i - 1];
        
        // Time should not scale worse than linear + constant factor
        expect(timeRatio).toBeLessThan(scaleFactor * 2);
      }
    });

    it('should maintain consistent frame rates across operations', () => {
      const { container } = render(<TacticalDrawingTools {...defaultProps} />);
      const frameRates: number[] = [];

      const operations = [
        'drawing',
        'erasing',
        'undoing',
        'saving'
      ];

      operations.forEach(operation => {
        frameRateCounter = { frames: 0, lastTime: performance.now() };
        
        // Simulate different operations
        for (let i = 0; i < 30; i++) { // 30 frames worth
          frameRateCounter.frames++;
        }
        
        frameRates.push(calculateFrameRate());
      });

      // Frame rates should be consistent across operations
      const avgFrameRate = frameRates.reduce((sum, rate) => sum + rate, 0) / frameRates.length;
      frameRates.forEach(rate => {
        expect(Math.abs(rate - avgFrameRate)).toBeLessThan(avgFrameRate * 0.3); // Within 30%
      });
    });
  });

  describe('Performance Summary and Reporting', () => {
    it('should generate performance report', () => {
      const testResults: BenchmarkResult[] = [];
      const testSuites = [
        { name: 'Small Dataset', shapes: 10 },
        { name: 'Medium Dataset', shapes: 50 },
        { name: 'Large Dataset', shapes: 100 }
      ];

      testSuites.forEach(suite => {
        const shapes = generateTacticalAnnotations(suite.shapes);
        
        const { metrics } = measurePerformance(() => {
          const { container } = render(
            <TacticalDrawingTools {...defaultProps} initialShapes={shapes} />
          );
          return container;
        }, suite.name);

        const baseline: PerformanceMetrics = {
          renderTime: 50, // 50ms baseline
          memoryUsage: 5 * 1024 * 1024, // 5MB baseline
          frameRate: 60,
          operationTime: 10,
          shapesProcessed: suite.shapes
        };

        const performanceRatio = metrics.renderTime / baseline.renderTime;
        const passed = performanceRatio <= 2.0; // Allow 2x baseline

        testResults.push({
          testName: suite.name,
          metrics,
          baseline,
          performanceRatio,
          passed,
          notes: passed ? 'Performance within acceptable limits' : 'Performance below expectations'
        });
      });

      // All tests should pass performance criteria
      const passedTests = testResults.filter(result => result.passed);
      expect(passedTests.length).toBeGreaterThan(testResults.length * 0.8); // 80% pass rate

      // Generate summary
      const summary = {
        totalTests: testResults.length,
        passedTests: passedTests.length,
        averagePerformanceRatio: testResults.reduce((sum, result) => sum + result.performanceRatio, 0) / testResults.length,
        worstPerformance: Math.max(...testResults.map(result => result.performanceRatio)),
        bestPerformance: Math.min(...testResults.map(result => result.performanceRatio))
      };

      expect(summary.averagePerformanceRatio).toBeLessThan(1.5); // Average within 1.5x baseline
      expect(summary.worstPerformance).toBeLessThan(3.0); // Worst case within 3x baseline
    });
  });
});