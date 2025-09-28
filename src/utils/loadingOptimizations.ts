/**
 * Catalyst Loading Performance Optimizations
 * Sub-second loading with intelligent resource prioritization
 */

import { useEffect, useState, useCallback, useRef } from 'react';

// Loading performance targets
export const LOADING_TARGETS = {
  FIRST_PAINT: 800,           // < 0.8s
  FIRST_CONTENTFUL_PAINT: 1200, // < 1.2s
  TIME_TO_INTERACTIVE: 2000,  // < 2s
  LARGEST_CONTENTFUL_PAINT: 2500, // < 2.5s
  CRITICAL_RESOURCE_TIMEOUT: 3000, // 3s
  PRELOAD_TIMEOUT: 5000,      // 5s
  MAX_CONCURRENT_REQUESTS: 6, // HTTP/1.1 limit
} as const;

// Resource priority levels
type ResourcePriority = 'critical' | 'high' | 'medium' | 'low' | 'prefetch';

interface ResourceConfig {
  url: string;
  priority: ResourcePriority;
  type: 'script' | 'style' | 'font' | 'image' | 'fetch';
  timeout?: number;
  retryCount?: number;
  preload?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

// Intelligent resource loader with prioritization
export class ResourceLoader {
  private static instance: ResourceLoader;
  private loadingQueue: ResourceConfig[] = [];
  private loadedResources = new Set<string>();
  private failedResources = new Set<string>();
  private activeRequests = new Map<string, Promise<void>>();
  private maxConcurrentRequests = LOADING_TARGETS.MAX_CONCURRENT_REQUESTS;
  private currentRequests = 0;
  
  static getInstance(): ResourceLoader {
    if (!ResourceLoader.instance) {
      ResourceLoader.instance = new ResourceLoader();
    }
    return ResourceLoader.instance;
  }
  
  private constructor() {
    this.setupNetworkOptimization();
  }
  
  private setupNetworkOptimization() {
    // Detect connection type and adjust concurrency
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConcurrency = () => {
        switch (connection.effectiveType) {
          case 'slow-2g':
          case '2g':
            this.maxConcurrentRequests = 2;
            break;
          case '3g':
            this.maxConcurrentRequests = 4;
            break;
          case '4g':
          default:
            this.maxConcurrentRequests = 6;
            break;
        }
      };
      
      updateConcurrency();
      connection.addEventListener('change', updateConcurrency);
    }
  }
  
  async load(config: ResourceConfig): Promise<void> {
    if (this.loadedResources.has(config.url)) {
      return Promise.resolve();
    }
    
    if (this.activeRequests.has(config.url)) {
      return this.activeRequests.get(config.url)!;
    }
    
    // Add to queue with priority sorting
    this.addToQueue(config);
    
    // Process queue
    return this.processQueue();
  }
  
  private addToQueue(config: ResourceConfig) {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, prefetch: 4 };
    
    // Insert in priority order
    let insertIndex = this.loadingQueue.length;
    for (let i = 0; i < this.loadingQueue.length; i++) {
      if (priorityOrder[config.priority] < priorityOrder[this.loadingQueue[i].priority]) {
        insertIndex = i;
        break;
      }
    }
    
    this.loadingQueue.splice(insertIndex, 0, config);
  }
  
  private async processQueue(): Promise<void> {
    while (this.loadingQueue.length > 0 && this.currentRequests < this.maxConcurrentRequests) {
      const config = this.loadingQueue.shift()!;
      
      if (this.loadedResources.has(config.url) || this.activeRequests.has(config.url)) {
        continue;
      }
      
      const loadPromise = this.loadResource(config);
      this.activeRequests.set(config.url, loadPromise);
      this.currentRequests++;
      
      loadPromise.finally(() => {
        this.activeRequests.delete(config.url);
        this.currentRequests--;
        
        // Continue processing queue
        setTimeout(() => this.processQueue(), 0);
      });
    }
  }
  
  private async loadResource(config: ResourceConfig): Promise<void> {
    const startTime = performance.now();
    performance.mark(`resource-load-start-${config.url}`);
    
    try {
      await this.createResourcePromise(config);
      
      this.loadedResources.add(config.url);
      
      const loadTime = performance.now() - startTime;
      performance.mark(`resource-load-end-${config.url}`);
      performance.measure(
        `resource-load-${config.type}-${config.priority}`,
        `resource-load-start-${config.url}`,
        `resource-load-end-${config.url}`
      );
      
      if (loadTime > (config.timeout || LOADING_TARGETS.CRITICAL_RESOURCE_TIMEOUT)) {
        console.warn(
          `🐌 Slow resource load: ${config.url} took ${loadTime.toFixed(2)}ms ` +
          `(priority: ${config.priority}, type: ${config.type})`
        );
      }
      
    } catch (error) {
      this.failedResources.add(config.url);
      
      // Retry logic
      if ((config.retryCount || 0) > 0) {
        console.warn(`Retrying resource load: ${config.url}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        
        return this.loadResource({
          ...config,
          retryCount: (config.retryCount || 0) - 1
        });
      }
      
      throw error;
    }
  }
  
  private createResourcePromise(config: ResourceConfig): Promise<void> {
    const timeout = config.timeout || LOADING_TARGETS.CRITICAL_RESOURCE_TIMEOUT;
    
    const loadPromise = (() => {
      switch (config.type) {
        case 'script':
          return this.loadScript(config.url, config.crossOrigin);
        case 'style':
          return this.loadStylesheet(config.url);
        case 'font':
          return this.loadFont(config.url);
        case 'image':
          return this.loadImage(config.url, config.crossOrigin);
        case 'fetch':
          return this.loadFetch(config.url, config.crossOrigin);
        default:
          return Promise.reject(new Error(`Unknown resource type: ${config.type}`));
      }
    })();
    
    // Add timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Resource load timeout: ${config.url}`)), timeout);
    });
    
    return Promise.race([loadPromise, timeoutPromise]);
  }
  
  private loadScript(url: string, crossOrigin?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      if (crossOrigin) script.crossOrigin = crossOrigin;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Script load failed: ${url}`));
      
      document.head.appendChild(script);
    });
  }
  
  private loadStylesheet(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Stylesheet load failed: ${url}`));
      
      document.head.appendChild(link);
    });
  }
  
  private loadFont(url: string): Promise<void> {
    if ('FontFace' in window) {
      const fontName = url.split('/').pop()?.split('.')[0] || 'unknown';
      const font = new FontFace(fontName, `url(${url})`);
      
      return font.load().then(() => {
        document.fonts.add(font);
      });
    } else {
      // Fallback to link preload
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        link.href = url;
        
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Font load failed: ${url}`));
        
        document.head.appendChild(link);
      });
    }
  }
  
  private loadImage(url: string, crossOrigin?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (crossOrigin) img.crossOrigin = crossOrigin;
      
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Image load failed: ${url}`));
      
      img.src = url;
    });
  }
  
  private loadFetch(url: string, crossOrigin?: string): Promise<void> {
    const options: RequestInit = {};
    if (crossOrigin) {
      options.mode = crossOrigin === 'anonymous' ? 'cors' : 'same-origin';
    }
    
    return fetch(url, options).then(response => {
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }
    });
  }
  
  preload(configs: ResourceConfig[]): Promise<void[]> {
    const preloadPromises = configs.map(config => {
      // Mark as preload to differentiate from critical loads
      return this.load({ ...config, priority: 'prefetch' }).catch(() => {
        // Ignore preload failures
      });
    });
    
    return Promise.all(preloadPromises);
  }
  
  isLoaded(url: string): boolean {
    return this.loadedResources.has(url);
  }
  
  hasFailed(url: string): boolean {
    return this.failedResources.has(url);
  }
  
  getStats() {
    return {
      loaded: this.loadedResources.size,
      failed: this.failedResources.size,
      queued: this.loadingQueue.length,
      active: this.activeRequests.size,
      maxConcurrent: this.maxConcurrentRequests
    };
  }
}

// Critical resource preloader
export class CriticalResourcePreloader {
  private static instance: CriticalResourcePreloader;
  private loader: ResourceLoader;
  
  static getInstance(): CriticalResourcePreloader {
    if (!CriticalResourcePreloader.instance) {
      CriticalResourcePreloader.instance = new CriticalResourcePreloader();
    }
    return CriticalResourcePreloader.instance;
  }
  
  private constructor() {
    this.loader = ResourceLoader.getInstance();
  }
  
  // Preload critical path resources
  async preloadCriticalPath(): Promise<void> {
    const criticalResources: ResourceConfig[] = [
      // Critical CSS
      {
        url: '/assets/css/critical.css',
        type: 'style',
        priority: 'critical',
        timeout: 1000
      },
      
      // Essential fonts
      {
        url: '/assets/fonts/inter-var.woff2',
        type: 'font',
        priority: 'critical',
        crossOrigin: 'anonymous'
      },
      
      // Critical JavaScript chunks
      {
        url: '/assets/js/runtime.js',
        type: 'script',
        priority: 'critical',
        timeout: 1500
      },
      {
        url: '/assets/js/vendor.js',
        type: 'script',
        priority: 'high',
        timeout: 2000
      }
    ];
    
    const startTime = performance.now();
    performance.mark('critical-path-start');
    
    try {
      await Promise.all(criticalResources.map(config => this.loader.load(config)));
      
      const loadTime = performance.now() - startTime;
      performance.mark('critical-path-end');
      performance.measure('critical-path-load', 'critical-path-start', 'critical-path-end');
      
      console.log(`⚡ Critical path loaded in ${loadTime.toFixed(2)}ms`);
      
      // Emit event for app initialization
      window.dispatchEvent(new CustomEvent('catalyst:critical-path-ready'));
      
    } catch (error) {
      console.error('🚨 Critical path loading failed:', error);
      throw error;
    }
  }
  
  // Preload route-specific resources
  async preloadRoute(routePath: string): Promise<void> {
    const routeResources = this.getRouteResources(routePath);
    await Promise.all(routeResources.map(config => this.loader.load(config)));
  }
  
  private getRouteResources(routePath: string): ResourceConfig[] {
    // Route-specific resource mapping
    const routeMap: Record<string, ResourceConfig[]> = {
      '/tactics': [
        {
          url: '/assets/js/tactics.chunk.js',
          type: 'script',
          priority: 'high'
        },
        {
          url: '/assets/css/tactics.css',
          type: 'style',
          priority: 'high'
        }
      ],
      '/analytics': [
        {
          url: '/assets/js/analytics.chunk.js',
          type: 'script',
          priority: 'medium'
        },
        {
          url: '/assets/js/charts.chunk.js',
          type: 'script',
          priority: 'medium'
        }
      ]
    };
    
    return routeMap[routePath] || [];
  }
}

// Progressive loading hook
export function useProgressiveLoading() {
  const [loadingState, setLoadingState] = useState({
    critical: false,
    essential: false,
    complete: false
  });
  
  const [loadingProgress, setLoadingProgress] = useState(0);
  const loader = useRef(ResourceLoader.getInstance());
  const preloader = useRef(CriticalResourcePreloader.getInstance());
  
  useEffect(() => {
    let mounted = true;
    
    const loadResources = async () => {
      try {
        // Step 1: Critical path
        performance.mark('app-loading-start');
        await preloader.current.preloadCriticalPath();
        
        if (mounted) {
          setLoadingState(prev => ({ ...prev, critical: true }));
          setLoadingProgress(40);
        }
        
        // Step 2: Essential resources
        const essentialResources: ResourceConfig[] = [
          {
            url: '/assets/js/ui-components.chunk.js',
            type: 'script',
            priority: 'high'
          },
          {
            url: '/assets/css/components.css',
            type: 'style',
            priority: 'high'
          }
        ];
        
        await Promise.all(essentialResources.map(config => loader.current.load(config)));
        
        if (mounted) {
          setLoadingState(prev => ({ ...prev, essential: true }));
          setLoadingProgress(70);
        }
        
        // Step 3: Non-critical resources
        const nonCriticalResources: ResourceConfig[] = [
          {
            url: '/assets/js/features.chunk.js',
            type: 'script',
            priority: 'low'
          },
          {
            url: '/assets/js/utils.chunk.js',
            type: 'script',
            priority: 'low'
          }
        ];
        
        await Promise.all(nonCriticalResources.map(config => loader.current.load(config)));
        
        if (mounted) {
          setLoadingState(prev => ({ ...prev, complete: true }));
          setLoadingProgress(100);
          
          performance.mark('app-loading-end');
          performance.measure('app-loading-total', 'app-loading-start', 'app-loading-end');
        }
        
      } catch (error) {
        console.error('Progressive loading failed:', error);
      }
    };
    
    loadResources();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  return { loadingState, loadingProgress };
}

// Loading performance monitor
export class LoadingPerformanceMonitor {
  private static instance: LoadingPerformanceMonitor;
  private observer: PerformanceObserver | null = null;
  private metrics = new Map<string, number>();
  
  static getInstance(): LoadingPerformanceMonitor {
    if (!LoadingPerformanceMonitor.instance) {
      LoadingPerformanceMonitor.instance = new LoadingPerformanceMonitor();
    }
    return LoadingPerformanceMonitor.instance;
  }
  
  private constructor() {
    this.setupObserver();
  }
  
  private setupObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.duration || entry.startTime);
          
          // Check against targets
          this.checkTargets(entry);
        }
      });
      
      try {
        this.observer.observe({
          entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'measure']
        });
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
      }
    }
  }
  
  private recordMetric(name: string, value: number) {
    this.metrics.set(name, value);
    
    // Emit metric event
    window.dispatchEvent(new CustomEvent('catalyst:loading-metric', {
      detail: { name, value, timestamp: Date.now() }
    }));
  }
  
  private checkTargets(entry: PerformanceEntry) {
    if (entry.name === 'first-paint' && entry.startTime > LOADING_TARGETS.FIRST_PAINT) {
      console.warn(
        `🐌 First Paint exceeded target: ${entry.startTime.toFixed(2)}ms > ${LOADING_TARGETS.FIRST_PAINT}ms`
      );
    }
    
    if (entry.name === 'first-contentful-paint' && entry.startTime > LOADING_TARGETS.FIRST_CONTENTFUL_PAINT) {
      console.warn(
        `🐌 First Contentful Paint exceeded target: ${entry.startTime.toFixed(2)}ms > ${LOADING_TARGETS.FIRST_CONTENTFUL_PAINT}ms`
      );
    }
    
    if (entry.entryType === 'largest-contentful-paint' && entry.startTime > LOADING_TARGETS.LARGEST_CONTENTFUL_PAINT) {
      console.warn(
        `🐌 Largest Contentful Paint exceeded target: ${entry.startTime.toFixed(2)}ms > ${LOADING_TARGETS.LARGEST_CONTENTFUL_PAINT}ms`
      );
    }
  }
  
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
  
  getLoadingReport() {
    const metrics = this.getMetrics();
    
    return {
      firstPaint: metrics['first-paint'] || 0,
      firstContentfulPaint: metrics['first-contentful-paint'] || 0,
      largestContentfulPaint: metrics['largest-contentful-paint'] || 0,
      timeToInteractive: metrics['time-to-interactive'] || 0,
      criticalPathTime: metrics['critical-path-load'] || 0,
      totalLoadTime: metrics['app-loading-total'] || 0,
      targetsMetric: {
        firstPaintTarget: metrics['first-paint'] <= LOADING_TARGETS.FIRST_PAINT,
        fcpTarget: metrics['first-contentful-paint'] <= LOADING_TARGETS.FIRST_CONTENTFUL_PAINT,
        lcpTarget: metrics['largest-contentful-paint'] <= LOADING_TARGETS.LARGEST_CONTENTFUL_PAINT,
        ttiTarget: metrics['time-to-interactive'] <= LOADING_TARGETS.TIME_TO_INTERACTIVE
      }
    };
  }
  
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.metrics.clear();
  }
}

// Service Worker integration for caching
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  
  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }
  
  async register(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('⚙️ Service Worker registered successfully');
        
        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker update found');
        });
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
  
  async precacheResources(urls: string[]): Promise<void> {
    if (this.registration && this.registration.active) {
      // Send precache message to service worker
      this.registration.active.postMessage({
        type: 'PRECACHE_RESOURCES',
        urls
      });
    }
  }
}

export default {
  ResourceLoader,
  CriticalResourcePreloader,
  LoadingPerformanceMonitor,
  ServiceWorkerManager,
  useProgressiveLoading,
  LOADING_TARGETS
};
