/**
 * Catalyst Performance Monitor Dashboard
 * Real-time performance monitoring and optimization insights
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity, 
  Zap, 
  Clock, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Monitor,
  Cpu,
  HardDrive
} from 'lucide-react';
import { 
  initializeCatalystPerformance,
  PERFORMANCE_THRESHOLDS,
  CoreWebVitalsMonitor,
  AdvancedMemoryManager 
} from '../../utils/performanceOptimizations';
import { getCacheStats } from '../../utils/cachingOptimizations';

interface PerformanceMetrics {
  LCP?: number;
  FID?: number;
  CLS?: number;
  TTFB?: number;
  DOMContentLoaded?: number;
  Load?: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  saveData: boolean;
  rtt: number;
}

interface CacheStats {
  formations: any;
  players: any;
  queries: any;
}

const PerformanceMonitorDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [performanceGrade, setPerformanceGrade] = useState<'A' | 'B' | 'C' | 'D' | 'F'>('A');
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Initialize Catalyst Performance System
  useEffect(() => {
    const { webVitalsMonitor, memoryManager } = initializeCatalystPerformance();

    // Listen for performance metrics
    const handleMetric = (event: CustomEvent) => {
      const { name, value } = event.detail;
      setMetrics(prev => ({ ...prev, [name]: value }));
    };

    window.addEventListener('catalyst:metric', handleMetric as EventListener);

    // Memory monitoring
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory);
      }
    }, 1000);

    // Network monitoring
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          saveData: connection.saveData || false,
          rtt: connection.rtt || 0
        });
      };
      
      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);
    }

    // Cache stats monitoring
    const cacheInterval = setInterval(() => {
      setCacheStats(getCacheStats());
    }, 5000);

    return () => {
      window.removeEventListener('catalyst:metric', handleMetric as EventListener);
      clearInterval(memoryInterval);
      clearInterval(cacheInterval);
      webVitalsMonitor.cleanup();
      memoryManager.cleanup();
    };
  }, []);

  // Calculate performance grade
  useEffect(() => {
    const { LCP, FID, CLS } = metrics;
    let score = 100;
    const issues: string[] = [];

    if (LCP) {
      if (LCP > PERFORMANCE_THRESHOLDS.LCP_TARGET) {
        score -= 20;
        issues.push(`LCP is ${(LCP / 1000).toFixed(1)}s (target: <2.5s) - Optimize largest content element`);
      }
    }

    if (FID) {
      if (FID > PERFORMANCE_THRESHOLDS.FID_TARGET) {
        score -= 15;
        issues.push(`FID is ${FID.toFixed(1)}ms (target: <100ms) - Reduce JavaScript execution time`);
      }
    }

    if (CLS) {
      if (CLS > PERFORMANCE_THRESHOLDS.CLS_TARGET) {
        score -= 15;
        issues.push(`CLS is ${CLS.toFixed(3)} (target: <0.1) - Fix layout shifts`);
      }
    }

    if (memoryInfo && memoryInfo.usedJSHeapSize > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
      score -= 10;
      issues.push(`Memory usage is ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB (warning: >50MB)`);
    }

    if (networkInfo?.effectiveType === 'slow-2g' || networkInfo?.effectiveType === '2g') {
      issues.push('Slow network detected - Consider reducing resource sizes');
    }

    setRecommendations(issues);

    if (score >= 90) setPerformanceGrade('A');
    else if (score >= 80) setPerformanceGrade('B');
    else if (score >= 70) setPerformanceGrade('C');
    else if (score >= 60) setPerformanceGrade('D');
    else setPerformanceGrade('F');
  }, [metrics, memoryInfo, networkInfo]);

  // Performance score color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-400 bg-green-900/20';
      case 'B': return 'text-blue-400 bg-blue-900/20';
      case 'C': return 'text-yellow-400 bg-yellow-900/20';
      case 'D': return 'text-orange-400 bg-orange-900/20';
      case 'F': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  // Format metric value
  const formatMetric = (value: number, unit: string) => {
    if (unit === 'ms') {
      return value < 1000 ? `${value.toFixed(1)}ms` : `${(value / 1000).toFixed(2)}s`;
    }
    if (unit === 'MB') {
      return `${(value / 1024 / 1024).toFixed(1)}MB`;
    }
    return `${value.toFixed(3)}`;
  };

  // Metric status
  const getMetricStatus = (value: number, threshold: number, lower = true) => {
    const isGood = lower ? value <= threshold : value >= threshold;
    return isGood ? 'good' : 'warning';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 hover:bg-slate-800 transition-colors group"
        title="Open Performance Monitor"
      >
        <Activity className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 max-w-md max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Catalyst Monitor</h3>
          <div className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(performanceGrade)}`}>
            {performanceGrade}
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-white text-lg"
        >
          ×
        </button>
      </div>

      {/* Core Web Vitals */}
      <div className="space-y-3">
        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
          Core Web Vitals
        </div>
        
        {/* LCP */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">LCP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">
              {metrics.LCP ? formatMetric(metrics.LCP, 'ms') : '—'}
            </span>
            {metrics.LCP && (
              <div className={`w-2 h-2 rounded-full ${
                getMetricStatus(metrics.LCP, PERFORMANCE_THRESHOLDS.LCP_TARGET) === 'good' 
                  ? 'bg-green-400' 
                  : 'bg-orange-400'
              }`} />
            )}
          </div>
        </div>

        {/* FID */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">FID</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">
              {metrics.FID ? formatMetric(metrics.FID, 'ms') : '—'}
            </span>
            {metrics.FID && (
              <div className={`w-2 h-2 rounded-full ${
                getMetricStatus(metrics.FID, PERFORMANCE_THRESHOLDS.FID_TARGET) === 'good' 
                  ? 'bg-green-400' 
                  : 'bg-orange-400'
              }`} />
            )}
          </div>
        </div>

        {/* CLS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">CLS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">
              {metrics.CLS ? formatMetric(metrics.CLS, '') : '—'}
            </span>
            {metrics.CLS !== undefined && (
              <div className={`w-2 h-2 rounded-full ${
                getMetricStatus(metrics.CLS, PERFORMANCE_THRESHOLDS.CLS_TARGET) === 'good' 
                  ? 'bg-green-400' 
                  : 'bg-orange-400'
              }`} />
            )}
          </div>
        </div>
      </div>

      {/* Memory Usage */}
      {memoryInfo && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
            Memory Usage
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">JS Heap</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white">
                {formatMetric(memoryInfo.usedJSHeapSize, 'MB')}
              </span>
              <div className={`w-2 h-2 rounded-full ${
                memoryInfo.usedJSHeapSize > PERFORMANCE_THRESHOLDS.MEMORY_WARNING 
                  ? 'bg-orange-400' 
                  : 'bg-green-400'
              }`} />
            </div>
          </div>
        </div>
      )}

      {/* Network Info */}
      {networkInfo && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
            Network
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Connection</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white">
                {networkInfo.effectiveType.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400">
                {networkInfo.downlink}Mbps
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cache Stats */}
      {cacheStats && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
            Cache Performance
          </div>
          <div className="space-y-1">
            {Object.entries(cacheStats).map(([key, stats]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-slate-300 capitalize">{key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white">
                    {stats.hitRate ? `${(stats.hitRate * 100).toFixed(1)}%` : '—'}
                  </span>
                  <HardDrive className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">
            Optimization Tips
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          {performanceGrade === 'A' ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          )}
          <span className="text-xs text-slate-300">
            {performanceGrade === 'A' 
              ? 'Performance optimized' 
              : 'Optimization recommended'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitorDashboard;