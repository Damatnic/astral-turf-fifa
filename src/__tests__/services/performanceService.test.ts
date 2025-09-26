import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceService } from '../../services/performanceService';

// Mock Performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    observer: vi.fn(),
  },
  writable: true,
});

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

describe('PerformanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Performance Timing', () => {
    it('should measure execution time', () => {
      const mockNow = vi.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(1500);

      performanceService.startTimer('testOperation');
      const duration = performanceService.endTimer('testOperation');

      expect(duration).toBe(500);
      expect(mockNow).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple concurrent timers', () => {
      const mockNow = vi.spyOn(performance, 'now');
      mockNow
        .mockReturnValueOnce(1000) // start timer1
        .mockReturnValueOnce(1200) // start timer2
        .mockReturnValueOnce(1800) // end timer1
        .mockReturnValueOnce(2000); // end timer2

      performanceService.startTimer('operation1');
      performanceService.startTimer('operation2');
      
      const duration1 = performanceService.endTimer('operation1');
      const duration2 = performanceService.endTimer('operation2');

      expect(duration1).toBe(800);
      expect(duration2).toBe(800);
    });

    it('should return null for non-existent timer', () => {
      const duration = performanceService.endTimer('nonExistent');
      expect(duration).toBeNull();
    });

    it('should measure async operations', async () => {
      const mockNow = vi.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(1250);

      const asyncOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 250));
        return 'completed';
      };

      const result = await performanceService.measureAsync('asyncOp', asyncOperation);

      expect(result.result).toBe('completed');
      expect(result.duration).toBe(250);
    });
  });

  describe('Performance Metrics Collection', () => {
    it('should collect Core Web Vitals', () => {
      const mockEntries = [
        { name: 'first-contentful-paint', startTime: 1200 },
        { name: 'largest-contentful-paint', startTime: 2500 },
        { name: 'first-input-delay', duration: 50 },
        { name: 'cumulative-layout-shift', value: 0.1 }
      ];

      vi.spyOn(performance, 'getEntriesByType').mockReturnValue(mockEntries);

      const vitals = performanceService.getCoreWebVitals();

      expect(vitals).toEqual({
        fcp: 1200,
        lcp: 2500,
        fid: 50,
        cls: 0.1,
        ttfb: null,
        tti: null
      });
    });

    it('should collect memory usage metrics', () => {
      // Mock memory API
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 25000000,
          totalJSHeapSize: 50000000,
          jsHeapSizeLimit: 2147483648
        },
        configurable: true
      });

      const memory = performanceService.getMemoryMetrics();

      expect(memory).toEqual({
        used: 25000000,
        total: 50000000,
        limit: 2147483648,
        usagePercentage: 50
      });
    });

    it('should handle missing memory API gracefully', () => {
      // Remove memory API
      delete (performance as any).memory;

      const memory = performanceService.getMemoryMetrics();

      expect(memory).toEqual({
        used: 0,
        total: 0,
        limit: 0,
        usagePercentage: 0
      });
    });

    it('should collect network timing metrics', () => {
      const mockNavigationEntries = [{
        type: 'navigation',
        name: 'https://example.com',
        startTime: 0,
        fetchStart: 100,
        domainLookupStart: 120,
        domainLookupEnd: 140,
        connectStart: 140,
        connectEnd: 180,
        requestStart: 200,
        responseStart: 400,
        responseEnd: 500,
        domContentLoadedEventStart: 800,
        domContentLoadedEventEnd: 850,
        loadEventStart: 1000,
        loadEventEnd: 1050
      }];

      vi.spyOn(performance, 'getEntriesByType').mockReturnValue(mockNavigationEntries);

      const networkMetrics = performanceService.getNetworkMetrics();

      expect(networkMetrics).toEqual({
        dns: 20,
        tcp: 40,
        request: 200,
        response: 100,
        domContentLoaded: 50,
        pageLoad: 50,
        totalTime: 1050
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should start performance monitoring', () => {
      const observeSpy = vi.fn();
      const mockObserver = {
        observe: observeSpy,
        disconnect: vi.fn(),
        takeRecords: vi.fn()
      };

      (global.PerformanceObserver as any).mockReturnValue(mockObserver);

      performanceService.startMonitoring();

      expect(global.PerformanceObserver).toHaveBeenCalled();
      expect(observeSpy).toHaveBeenCalledWith({
        entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift']
      });
    });

    it('should stop performance monitoring', () => {
      const disconnectSpy = vi.fn();
      const mockObserver = {
        observe: vi.fn(),
        disconnect: disconnectSpy,
        takeRecords: vi.fn()
      };

      (global.PerformanceObserver as any).mockReturnValue(mockObserver);

      performanceService.startMonitoring();
      performanceService.stopMonitoring();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should collect resource loading metrics', () => {
      const mockResourceEntries = [
        {
          name: 'https://cdn.example.com/script.js',
          entryType: 'resource',
          initiatorType: 'script',
          transferSize: 50000,
          decodedBodySize: 120000,
          duration: 250,
          responseEnd: 1000
        },
        {
          name: 'https://cdn.example.com/style.css',
          entryType: 'resource',
          initiatorType: 'link',
          transferSize: 15000,
          decodedBodySize: 35000,
          duration: 180,
          responseEnd: 800
        }
      ];

      vi.spyOn(performance, 'getEntriesByType').mockReturnValue(mockResourceEntries);

      const resourceMetrics = performanceService.getResourceMetrics();

      expect(resourceMetrics).toHaveLength(2);
      expect(resourceMetrics[0]).toEqual({
        name: 'https://cdn.example.com/script.js',
        type: 'script',
        size: 50000,
        duration: 250,
        compressionRatio: 0.42
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should detect performance bottlenecks', () => {
      const metrics = {
        fcp: 3000, // Slow
        lcp: 5000, // Very slow
        fid: 200,  // Slow
        cls: 0.3,  // Poor
        ttfb: 1500, // Slow
        tti: 6000   // Very slow
      };

      const bottlenecks = performanceService.detectBottlenecks(metrics);

      expect(bottlenecks).toContain('Slow First Contentful Paint');
      expect(bottlenecks).toContain('Poor Largest Contentful Paint');
      expect(bottlenecks).toContain('High First Input Delay');
      expect(bottlenecks).toContain('Poor Cumulative Layout Shift');
    });

    it('should suggest performance optimizations', () => {
      const slowMetrics = {
        fcp: 4000,
        lcp: 6000,
        fid: 300,
        cls: 0.4,
        resourceCount: 150,
        bundleSize: 2000000
      };

      const suggestions = performanceService.getOptimizationSuggestions(slowMetrics);

      expect(suggestions).toContain('Optimize bundle size');
      expect(suggestions).toContain('Implement code splitting');
      expect(suggestions).toContain('Optimize images and assets');
      expect(suggestions).toContain('Reduce layout shifts');
    });

    it('should generate performance score', () => {
      const goodMetrics = {
        fcp: 1000,
        lcp: 1800,
        fid: 50,
        cls: 0.05,
        ttfb: 200,
        tti: 2000
      };

      const score = performanceService.calculatePerformanceScore(goodMetrics);

      expect(score).toBeGreaterThan(90);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should generate poor performance score for slow metrics', () => {
      const poorMetrics = {
        fcp: 5000,
        lcp: 8000,
        fid: 500,
        cls: 0.5,
        ttfb: 2000,
        tti: 10000
      };

      const score = performanceService.calculatePerformanceScore(poorMetrics);

      expect(score).toBeLessThan(50);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Resource Monitoring', () => {
    it('should track bundle sizes', () => {
      const bundleInfo = {
        'main.js': 500000,
        'vendor.js': 800000,
        'styles.css': 50000
      };

      performanceService.trackBundleSize(bundleInfo);
      const bundleMetrics = performanceService.getBundleMetrics();

      expect(bundleMetrics.totalSize).toBe(1350000);
      expect(bundleMetrics.largestBundle).toBe('vendor.js');
      expect(bundleMetrics.recommendations).toContain('Consider code splitting for vendor.js');
    });

    it('should monitor JavaScript execution time', () => {
      const longTaskEntries = [
        { name: 'self', duration: 120, startTime: 1000 },
        { name: 'script', duration: 80, startTime: 2000 },
        { name: 'render', duration: 150, startTime: 3000 }
      ];

      vi.spyOn(performance, 'getEntriesByType').mockReturnValue(longTaskEntries);

      const jsMetrics = performanceService.getJavaScriptMetrics();

      expect(jsMetrics.longTasks).toBe(3);
      expect(jsMetrics.totalBlockingTime).toBe(350);
      expect(jsMetrics.averageTaskDuration).toBe(116.67);
    });

    it('should track rendering performance', () => {
      const paintEntries = [
        { name: 'first-paint', startTime: 800 },
        { name: 'first-contentful-paint', startTime: 1200 }
      ];

      vi.spyOn(performance, 'getEntriesByType').mockReturnValue(paintEntries);

      const renderMetrics = performanceService.getRenderingMetrics();

      expect(renderMetrics.firstPaint).toBe(800);
      expect(renderMetrics.firstContentfulPaint).toBe(1200);
      expect(renderMetrics.renderDelay).toBe(400);
    });
  });

  describe('Performance Alerts', () => {
    it('should trigger alerts for poor performance', () => {
      const alertCallback = vi.fn();
      performanceService.setPerformanceAlerts({
        fcp: { threshold: 2000, callback: alertCallback },
        lcp: { threshold: 2500, callback: alertCallback }
      });

      // Simulate poor performance metrics
      performanceService.reportMetric('fcp', 3000);
      performanceService.reportMetric('lcp', 4000);

      expect(alertCallback).toHaveBeenCalledTimes(2);
      expect(alertCallback).toHaveBeenCalledWith('fcp', 3000, 2000);
      expect(alertCallback).toHaveBeenCalledWith('lcp', 4000, 2500);
    });

    it('should not trigger alerts for good performance', () => {
      const alertCallback = vi.fn();
      performanceService.setPerformanceAlerts({
        fcp: { threshold: 2000, callback: alertCallback },
        lcp: { threshold: 2500, callback: alertCallback }
      });

      // Simulate good performance metrics
      performanceService.reportMetric('fcp', 1200);
      performanceService.reportMetric('lcp', 1800);

      expect(alertCallback).not.toHaveBeenCalled();
    });
  });

  describe('Performance Reporting', () => {
    it('should generate comprehensive performance report', () => {
      const mockMetrics = {
        coreWebVitals: {
          fcp: 1200,
          lcp: 1800,
          fid: 50,
          cls: 0.1
        },
        memory: {
          used: 25000000,
          total: 50000000,
          usagePercentage: 50
        },
        network: {
          dns: 20,
          tcp: 40,
          request: 200,
          response: 100
        },
        resources: [
          { name: 'main.js', size: 500000, duration: 250 }
        ]
      };

      const report = performanceService.generateReport(mockMetrics);

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('metrics', mockMetrics);
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('bottlenecks');
      expect(report.score).toBeGreaterThan(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });

    it('should export performance data', () => {
      const mockData = {
        userAgent: 'Mozilla/5.0...',
        url: 'https://example.com',
        timestamp: Date.now(),
        metrics: { fcp: 1200, lcp: 1800 }
      };

      const exportedData = performanceService.exportData(mockData);

      expect(exportedData).toHaveProperty('format', 'json');
      expect(exportedData).toHaveProperty('data');
      expect(exportedData.data).toContain('Mozilla/5.0');
      expect(exportedData.data).toContain('1200');
    });
  });

  describe('Error Handling', () => {
    it('should handle Performance API not available', () => {
      // Temporarily remove Performance API
      const originalPerformance = global.performance;
      delete (global as any).performance;

      expect(() => performanceService.getCoreWebVitals()).not.toThrow();
      
      const vitals = performanceService.getCoreWebVitals();
      expect(vitals).toEqual({
        fcp: null,
        lcp: null,
        fid: null,
        cls: null,
        ttfb: null,
        tti: null
      });

      // Restore Performance API
      global.performance = originalPerformance;
    });

    it('should handle PerformanceObserver not supported', () => {
      // Temporarily remove PerformanceObserver
      const originalObserver = global.PerformanceObserver;
      delete (global as any).PerformanceObserver;

      expect(() => performanceService.startMonitoring()).not.toThrow();

      // Restore PerformanceObserver
      global.PerformanceObserver = originalObserver;
    });

    it('should handle timer cleanup on page unload', () => {
      performanceService.startTimer('operation1');
      performanceService.startTimer('operation2');

      // Simulate page unload
      performanceService.cleanup();

      // Timers should be cleared
      expect(performanceService.endTimer('operation1')).toBeNull();
      expect(performanceService.endTimer('operation2')).toBeNull();
    });
  });
});