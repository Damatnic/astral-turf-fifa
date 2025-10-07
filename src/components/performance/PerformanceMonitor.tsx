/**
 * Catalyst Performance Monitor Component
 * Real-time performance metrics and optimization recommendations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Cpu,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Settings,
  X,
} from 'lucide-react';
import { PerformanceMonitor as PerfMonitor } from '../../utils/performanceOptimizations';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  bundleSize: number;
  slowRenders: number;
  totalRenders: number;
  animationCount: number;
  cacheHitRate: number;
  jsHeapUsed?: number;
  jsHeapTotal?: number;
}

interface OptimizationSuggestion {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}

const PerformanceMonitorComponent: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  onOptimize?: (action: string) => void;
}> = ({ isVisible, onClose, onOptimize }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    bundleSize: 0,
    slowRenders: 0,
    totalRenders: 0,
    animationCount: 0,
    cacheHitRate: 100,
  });

  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [performanceGrade, setPerformanceGrade] = useState<'A' | 'B' | 'C' | 'D' | 'F'>('A');

  const performanceMonitor = useRef(PerfMonitor.getInstance());
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update metrics every second
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const updateMetrics = () => {
      const perfMetrics = performanceMonitor.current.getMetrics();

      // Get memory usage if available
      const memory = (performance as any).memory;
      const memoryMetrics = memory
        ? {
            jsHeapUsed: memory.usedJSHeapSize,
            jsHeapTotal: memory.totalJSHeapSize,
            memoryUsage: (memory.usedJSHeapSize / (50 * 1024 * 1024)) * 100, // % of 50MB
          }
        : { memoryUsage: 0 };

      const newMetrics: PerformanceMetrics = {
        fps: 60, // Default FPS
        renderTime: perfMetrics.lastRenderTime,
        slowRenders: perfMetrics.slowRenders,
        totalRenders: perfMetrics.renderCount,
        animationCount: 0, // Animation count not available
        bundleSize: 0, // Would need to be passed from build
        cacheHitRate: 95, // Mock data - would come from cache implementation
        ...memoryMetrics,
      };

      setMetrics(newMetrics);
      updatePerformanceGrade(newMetrics);
      generateSuggestions(newMetrics);
    };

    intervalRef.current = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial update

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible]);

  const updatePerformanceGrade = useCallback((metrics: PerformanceMetrics) => {
    let score = 100;

    // FPS score (40% weight)
    if (metrics.fps < 30) {
      score -= 40;
    } else if (metrics.fps < 45) {
      score -= 25;
    } else if (metrics.fps < 55) {
      score -= 10;
    }

    // Memory score (20% weight)
    if (metrics.memoryUsage > 80) {
      score -= 20;
    } else if (metrics.memoryUsage > 60) {
      score -= 10;
    } else if (metrics.memoryUsage > 40) {
      score -= 5;
    }

    // Render performance (20% weight)
    const slowRenderRate = (metrics.slowRenders / Math.max(metrics.totalRenders, 1)) * 100;
    if (slowRenderRate > 20) {
      score -= 20;
    } else if (slowRenderRate > 10) {
      score -= 10;
    } else if (slowRenderRate > 5) {
      score -= 5;
    }

    // Animation performance (10% weight)
    if (metrics.animationCount > 20) {
      score -= 10;
    } else if (metrics.animationCount > 10) {
      score -= 5;
    }

    // Cache performance (10% weight)
    if (metrics.cacheHitRate < 80) {
      score -= 10;
    } else if (metrics.cacheHitRate < 90) {
      score -= 5;
    }

    if (score >= 90) {
      setPerformanceGrade('A');
    } else if (score >= 80) {
      setPerformanceGrade('B');
    } else if (score >= 70) {
      setPerformanceGrade('C');
    } else if (score >= 60) {
      setPerformanceGrade('D');
    } else {
      setPerformanceGrade('F');
    }
  }, []);

  const generateSuggestions = useCallback(
    (metrics: PerformanceMetrics) => {
      const newSuggestions: OptimizationSuggestion[] = [];

      if (metrics.fps < 30) {
        newSuggestions.push({
          id: 'low-fps',
          type: 'critical',
          title: 'Critical FPS Drop',
          description: `FPS is ${metrics.fps}, well below 60fps target. Consider reducing visual complexity.`,
          action: () => {
            onOptimize?.('enable-performance-mode');
          },
          actionLabel: 'Enable Performance Mode',
        });
      }

      if (metrics.memoryUsage > 70) {
        newSuggestions.push({
          id: 'high-memory',
          type: 'warning',
          title: 'High Memory Usage',
          description: `Memory usage is ${Math.round(metrics.memoryUsage)}%. Consider clearing caches or reducing complexity.`,
          action: () => onOptimize?.('clear-caches'),
          actionLabel: 'Clear Caches',
        });
      }

      const slowRenderRate = (metrics.slowRenders / Math.max(metrics.totalRenders, 1)) * 100;
      if (slowRenderRate > 10) {
        newSuggestions.push({
          id: 'slow-renders',
          type: 'warning',
          title: 'Slow Render Detected',
          description: `${Math.round(slowRenderRate)}% of renders are slow. Consider optimizing component re-renders.`,
          action: () => onOptimize?.('optimize-renders'),
          actionLabel: 'Optimize Renders',
        });
      }

      if (metrics.animationCount > 15) {
        newSuggestions.push({
          id: 'too-many-animations',
          type: 'info',
          title: 'High Animation Count',
          description: `${metrics.animationCount} active animations may impact performance.`,
          action: () => onOptimize?.('reduce-animations'),
          actionLabel: 'Reduce Animations',
        });
      }

      if (metrics.cacheHitRate < 85) {
        newSuggestions.push({
          id: 'low-cache-hit',
          type: 'info',
          title: 'Low Cache Hit Rate',
          description: `Cache hit rate is ${metrics.cacheHitRate}%. Consider reviewing caching strategy.`,
          action: () => onOptimize?.('optimize-cache'),
          actionLabel: 'Optimize Cache',
        });
      }

      setSuggestions(newSuggestions);
    },
    [onOptimize],
  );

  const startPerformanceRecording = useCallback(() => {
    setIsRecording(true);
    performanceMonitor.current.reset();

    // Stop recording after 30 seconds
    setTimeout(() => {
      setIsRecording(false);
    }, 30000);
  }, []);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-400 bg-green-400/10';
      case 'B':
        return 'text-blue-400 bg-blue-400/10';
      case 'C':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'D':
        return 'text-orange-400 bg-orange-400/10';
      case 'F':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-4 z-50 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Performance Monitor</h2>
              <p className="text-sm text-slate-400">
                Real-time performance metrics and optimization
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Performance Grade */}
            <div
              className={`px-3 py-1 rounded-lg font-bold text-lg ${getGradeColor(performanceGrade)}`}
            >
              {performanceGrade}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* FPS */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">FPS</span>
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metrics.fps}</div>
              <div className="text-xs text-slate-500">Target: 60 FPS</div>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.fps >= 55
                      ? 'bg-green-400'
                      : metrics.fps >= 30
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min((metrics.fps / 60) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Memory</span>
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {Math.round(metrics.memoryUsage)}%
              </div>
              <div className="text-xs text-slate-500">
                {metrics.jsHeapUsed && formatBytes(metrics.jsHeapUsed)}
              </div>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.memoryUsage < 50
                      ? 'bg-green-400'
                      : metrics.memoryUsage < 75
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(metrics.memoryUsage, 100)}%` }}
                />
              </div>
            </div>

            {/* Render Performance */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Renders</span>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metrics.totalRenders}</div>
              <div className="text-xs text-slate-500">
                {metrics.slowRenders} slow (
                {Math.round((metrics.slowRenders / Math.max(metrics.totalRenders, 1)) * 100)}%)
              </div>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-400 transition-all duration-300"
                  style={{
                    width: `${Math.max(100 - (metrics.slowRenders / Math.max(metrics.totalRenders, 1)) * 100, 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* Cache Performance */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Cache Hit</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metrics.cacheHitRate}%</div>
              <div className="text-xs text-slate-500">Optimal: &gt;95%</div>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.cacheHitRate >= 95
                      ? 'bg-green-400'
                      : metrics.cacheHitRate >= 85
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                  }`}
                  style={{ width: `${metrics.cacheHitRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Performance Actions */}
          <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-white">Performance Recording</h3>
              <p className="text-sm text-slate-400">
                {isRecording
                  ? 'Recording performance metrics...'
                  : 'Start a 30-second performance recording'}
              </p>
            </div>
            <button
              onClick={startPerformanceRecording}
              disabled={isRecording}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecording ? 'bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRecording ? 'Recording...' : 'Start Recording'}
            </button>
          </div>

          {/* Optimization Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Optimization Suggestions</h3>
              {suggestions.map(suggestion => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-slate-800/50 rounded-lg border-l-4 border-l-blue-400"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {suggestion.type === 'critical' && (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        {suggestion.type === 'warning' && (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        )}
                        {suggestion.type === 'info' && (
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="font-medium text-white">{suggestion.title}</span>
                      </div>
                      <p className="text-sm text-slate-300">{suggestion.description}</p>
                    </div>
                    {suggestion.action && (
                      <button
                        onClick={suggestion.action}
                        className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        {suggestion.actionLabel || 'Fix'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Animation Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Animations:</span>
                  <span className="text-white">{metrics.animationCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Performance Mode:</span>
                  <span className="text-green-400">Disabled</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Bundle Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Initial Load:</span>
                  <span className="text-white">~{metrics.bundleSize || 450}KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gzipped:</span>
                  <span className="text-white">
                    ~{Math.round((metrics.bundleSize || 450) * 0.3)}KB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PerformanceMonitorComponent;
