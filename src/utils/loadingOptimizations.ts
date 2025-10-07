/**
 * Catalyst Loading Performance Optimizations
 * Sub-second loading with intelligent resource prioritization
 */

import { useEffect, useState, useRef } from 'react';

// Loading performance targets
export const LOADING_TARGETS = {
  FIRST_PAINT: 800, // < 0.8s
  FIRST_CONTENTFUL_PAINT: 1200, // < 1.2s
  TIME_TO_INTERACTIVE: 2000, // < 2s
  LARGEST_CONTENTFUL_PAINT: 2500, // < 2.5s
  CRITICAL_RESOURCE_TIMEOUT: 3000, // 3s
  PRELOAD_TIMEOUT: 5000, // 5s
  MAX_CONCURRENT_REQUESTS: 6, // HTTP/1.1 limit
} as const;

type WindowInstance = typeof globalThis extends { window: infer T } ? T : typeof window;
type DocumentInstance = typeof globalThis extends { document: infer T } ? T : never;
type NavigatorInstance = typeof globalThis extends { navigator: infer T } ? T : never;
type PerformanceInstance = typeof globalThis extends { performance: infer T } ? T : undefined;

const getWindow = (): WindowInstance | undefined =>
  typeof window === 'undefined' ? undefined : (window as WindowInstance);

const getDocument = (): DocumentInstance | undefined =>
  typeof document === 'undefined' ? undefined : (document as DocumentInstance);

const getNavigator = (): NavigatorInstance | undefined =>
  getWindow()?.navigator as NavigatorInstance | undefined;

const getPerformance = (): PerformanceInstance | undefined =>
  getWindow()?.performance as PerformanceInstance | undefined;

type NetworkInformationLike = {
  effectiveType?: string;
  addEventListener?: (type: string, listener: (...args: unknown[]) => void) => void;
};

const getNetworkInformation = (): NetworkInformationLike | undefined => {
  const navigatorInstance = getNavigator() as { connection?: NetworkInformationLike } | undefined;
  return navigatorInstance?.connection;
};

type FontFaceConstructorLike = new (
  family: string,
  source: string
) => { load: () => Promise<unknown> };

type DocumentWithFonts = DocumentInstance & { fonts?: { add?: (font: unknown) => void } };

type ImageConstructorLike = new () => {
  onload: (() => void) | null;
  onerror: ((error?: unknown) => void) | null;
  crossOrigin?: string;
  src: string;
};

type FetchFunction = (
  input: string,
  init?: Record<string, unknown>
) => Promise<{ ok: boolean; status: number; statusText: string }>;

type PerformanceEntryLike = {
  name: string;
  startTime: number;
  duration?: number;
  entryType?: string;
};

type PerformanceObserverEntryListLike = {
  getEntries: () => PerformanceEntryLike[];
};

type PerformanceObserverLike = {
  observe: (options: { entryTypes: string[] }) => void;
  disconnect: () => void;
};

type PerformanceObserverConstructorLike = new (
  callback: (list: PerformanceObserverEntryListLike) => void
) => PerformanceObserverLike;

type ServiceWorkerRegistrationLike = {
  scope?: string;
  active?: { postMessage?: (message: unknown) => void } | null;
  addEventListener?: (type: string, listener: (...args: unknown[]) => void) => void;
};

type ServiceWorkerContainerLike = {
  register?: (
    scriptURL: string,
    options?: Record<string, unknown>
  ) => Promise<ServiceWorkerRegistrationLike>;
};

type LoadingEventDetail = Record<string, unknown> & { timestamp: number; message?: string };

type LoadingEventSeverity = 'info' | 'warning' | 'error';

const dispatchLoadingEvent = (type: string, detail: LoadingEventDetail) => {
  const win = getWindow();
  if (!win) {
    return;
  }

  try {
    if (typeof win.CustomEvent === 'function') {
      win.dispatchEvent(new win.CustomEvent(type, { detail }));
      return;
    }

    const doc = getDocument();
    if (doc?.createEvent) {
      const event = doc.createEvent('CustomEvent');
      event.initCustomEvent(type, false, false, detail);
      win.dispatchEvent(event);
      return;
    }

    win.dispatchEvent(new Event(type));
  } catch {
    // Ignore environments that block custom events
  }
};

const emitLoadingInfo = (message: string, context: Record<string, unknown> = {}) => {
  dispatchLoadingEvent('catalyst:loading-info', {
    severity: 'info' as LoadingEventSeverity,
    message,
    timestamp: Date.now(),
    ...context,
  });
};

const emitLoadingWarning = (message: string, context: Record<string, unknown> = {}) => {
  dispatchLoadingEvent('catalyst:loading-warning', {
    severity: 'warning' as LoadingEventSeverity,
    message,
    timestamp: Date.now(),
    ...context,
  });
};

const emitLoadingError = (message: string, context: Record<string, unknown> = {}) => {
  dispatchLoadingEvent('catalyst:loading-error', {
    severity: 'error' as LoadingEventSeverity,
    message,
    timestamp: Date.now(),
    ...context,
  });
};

const serializeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error) {
    return { ...(error as Record<string, unknown>) };
  }

  return { message: String(error) };
};

type DeferredPromise = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
};

type TimeoutHandle = ReturnType<typeof setTimeout>;

const scheduleTimeout = (callback: () => void, delayMs: number): TimeoutHandle => {
  const win = getWindow();
  if (win?.setTimeout) {
    return win.setTimeout(callback, delayMs) as unknown as TimeoutHandle;
  }
  return setTimeout(callback, delayMs);
};

const clearScheduledTimeout = (handle: TimeoutHandle | null | undefined) => {
  if (!handle) {
    return;
  }
  const win = getWindow();
  if (win?.clearTimeout) {
    win.clearTimeout(handle as unknown as number);
    return;
  }
  clearTimeout(handle);
};

const delay = (ms: number) =>
  new Promise<void>(resolve => {
    scheduleTimeout(resolve, ms);
  });

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
type ResourceLoaderStats = {
  loaded: number;
  failed: number;
  queued: number;
  active: number;
  maxConcurrent: number;
};

type ResourceLoaderSubscriber = (stats: ResourceLoaderStats) => void;

export class ResourceLoader {
  private static instance: ResourceLoader;
  private loadingQueue: ResourceConfig[] = [];
  private loadedResources = new Set<string>();
  private failedResources = new Set<string>();
  private activeRequests = new Map<string, Promise<void>>();
  private maxConcurrentRequests: number = LOADING_TARGETS.MAX_CONCURRENT_REQUESTS;
  private currentRequests = 0;
  private pendingPromises = new Map<string, DeferredPromise>();
  private statsSubscribers = new Set<ResourceLoaderSubscriber>();
  private lastNotifiedStats: ResourceLoaderStats | null = null;

  static getInstance(): ResourceLoader {
    if (!ResourceLoader.instance) {
      ResourceLoader.instance = new ResourceLoader();
    }
    return ResourceLoader.instance;
  }

  private constructor() {
    this.setupNetworkOptimization();
    this.notifyStats();
  }

  onStats(listener: ResourceLoaderSubscriber): () => void {
    this.statsSubscribers.add(listener);
    try {
      listener(this.getStats());
    } catch (error) {
      emitLoadingError('Resource loader subscriber failed during registration', {
        error: serializeError(error),
      });
    }

    return () => {
      this.statsSubscribers.delete(listener);
    };
  }

  async flush(): Promise<void> {
    const pending = new Set<Promise<void>>();
    this.activeRequests.forEach(promise => pending.add(promise));
    this.pendingPromises.forEach(({ promise }) => pending.add(promise));

    if (pending.size === 0) {
      return;
    }

    await Promise.allSettled(Array.from(pending));
  }

  clearQueue(predicate?: (config: ResourceConfig) => boolean) {
    if (!predicate) {
      this.loadingQueue = [];
    } else {
      this.loadingQueue = this.loadingQueue.filter(config => !predicate(config));
    }
    this.notifyStats();
  }

  private notifyStats() {
    const stats = this.getStats();

    if (
      this.lastNotifiedStats &&
      this.lastNotifiedStats.loaded === stats.loaded &&
      this.lastNotifiedStats.failed === stats.failed &&
      this.lastNotifiedStats.queued === stats.queued &&
      this.lastNotifiedStats.active === stats.active &&
      this.lastNotifiedStats.maxConcurrent === stats.maxConcurrent
    ) {
      return;
    }

    this.lastNotifiedStats = { ...stats };

    dispatchLoadingEvent('catalyst:resource-loader-stats', {
      ...stats,
      timestamp: Date.now(),
    });

    this.statsSubscribers.forEach(listener => {
      try {
        listener(stats);
      } catch (error) {
        emitLoadingError('Resource loader subscriber failed', {
          error: serializeError(error),
        });
      }
    });
  }

  private createDeferredPromise(url: string): DeferredPromise {
    let resolve!: () => void;
    let reject!: (error: unknown) => void;

    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const deferred: DeferredPromise = {
      promise,
      resolve,
      reject,
    };

    this.pendingPromises.set(url, deferred);
    return deferred;
  }

  private resolveDeferred(url: string) {
    const deferred = this.pendingPromises.get(url);
    if (deferred) {
      deferred.resolve();
      this.pendingPromises.delete(url);
    }
  }

  private rejectDeferred(url: string, error: unknown) {
    const deferred = this.pendingPromises.get(url);
    if (deferred) {
      deferred.reject(error);
      this.pendingPromises.delete(url);
    }
  }

  private setupNetworkOptimization() {
    const connection = getNetworkInformation();
    if (!connection) {
      return;
    }

    const updateConcurrency = () => {
      const effectiveType = connection.effectiveType ?? '4g';
      let concurrency: number = LOADING_TARGETS.MAX_CONCURRENT_REQUESTS;

      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          concurrency = 1;
          break;
        case '3g':
          concurrency = 2;
          break;
        default:
          concurrency = LOADING_TARGETS.MAX_CONCURRENT_REQUESTS;
          break;
      }

      const previous = this.maxConcurrentRequests;
      this.maxConcurrentRequests = Math.max(1, concurrency);

      if (this.maxConcurrentRequests !== previous) {
        emitLoadingInfo('Resource loader concurrency adjusted', {
          effectiveType,
          previous,
          next: this.maxConcurrentRequests,
        });
        this.notifyStats();
      }
    };

    updateConcurrency();
    connection.addEventListener?.('change', updateConcurrency);
  }

  async load(config: ResourceConfig): Promise<void> {
    if (this.loadedResources.has(config.url)) {
      return Promise.resolve();
    }

    const activePromise = this.activeRequests.get(config.url);
    if (activePromise) {
      return activePromise;
    }

    const pending = this.pendingPromises.get(config.url) ?? this.createDeferredPromise(config.url);

    // Add to queue with priority sorting
    this.addToQueue(config);

    // Process queue
    this.processQueue();

    return pending.promise;
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
    this.notifyStats();
  }

  private async processQueue(): Promise<void> {
    while (this.loadingQueue.length > 0 && this.currentRequests < this.maxConcurrentRequests) {
      const config = this.loadingQueue.shift()!;

      if (this.loadedResources.has(config.url) || this.activeRequests.has(config.url)) {
        continue;
      }

      const deferred =
        this.pendingPromises.get(config.url) ?? this.createDeferredPromise(config.url);
      const resourcePromise = this.loadResource(config);
      this.activeRequests.set(config.url, deferred.promise);
      this.currentRequests++;

      resourcePromise
        .then(() => {
          this.resolveDeferred(config.url);
        })
        .catch(error => {
          this.rejectDeferred(config.url, error);
        })
        .finally(() => {
          this.activeRequests.delete(config.url);
          this.currentRequests--;
          this.notifyStats();
          scheduleTimeout(() => this.processQueue(), 0);
        });
    }
  }

  private async loadResource(config: ResourceConfig): Promise<void> {
    const performanceApi = getPerformance();
    const startTime = typeof performanceApi?.now === 'function' ? performanceApi.now() : Date.now();
    if (typeof performanceApi?.mark === 'function') {
      performanceApi.mark(`resource-load-start-${config.url}`);
    }

    try {
      await this.createResourcePromise(config);

      this.loadedResources.add(config.url);
      this.failedResources.delete(config.url);

      const endTime = typeof performanceApi?.now === 'function' ? performanceApi.now() : Date.now();
      const loadTime = endTime - startTime;
      if (typeof performanceApi?.mark === 'function') {
        performanceApi.mark(`resource-load-end-${config.url}`);
      }
      if (typeof performanceApi?.measure === 'function') {
        try {
          performanceApi.measure(
            `resource-load-${config.type}-${config.priority}`,
            `resource-load-start-${config.url}`,
            `resource-load-end-${config.url}`,
          );
        } catch {
          // Ignore measure failures when marks are missing
        }
      }

      if (loadTime > (config.timeout || LOADING_TARGETS.CRITICAL_RESOURCE_TIMEOUT)) {
        emitLoadingWarning('Slow resource load detected', {
          url: config.url,
          loadTime,
          priority: config.priority,
          resourceType: config.type,
        });
      }

      emitLoadingInfo('Resource loaded successfully', {
        url: config.url,
        loadTime,
        priority: config.priority,
        resourceType: config.type,
      });
    } catch (error) {
      this.failedResources.add(config.url);

      // Retry logic
      if ((config.retryCount || 0) > 0) {
        emitLoadingWarning('Retrying resource load', {
          url: config.url,
          remainingRetries: (config.retryCount || 0) - 1,
        });
        await delay(1000);

        return this.loadResource({
          ...config,
          retryCount: (config.retryCount || 0) - 1,
        });
      }

      emitLoadingError('Resource load failed', {
        url: config.url,
        resourceType: config.type,
        priority: config.priority,
        error: serializeError(error),
      });

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

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeoutError = new Error(`Resource load timeout: ${config.url}`);
      const timeoutHandle = scheduleTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        reject(timeoutError);
      }, timeout);

      const finalize = (callback: () => void) => {
        if (!settled) {
          settled = true;
          clearScheduledTimeout(timeoutHandle);
          callback();
        }
      };

      loadPromise
        .then(() => {
          finalize(resolve);
        })
        .catch(error => {
          finalize(() => reject(error));
        });
    });
  }

  private loadScript(url: string, crossOrigin?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = getDocument();
      if (!doc) {
        emitLoadingWarning('Script load skipped - document unavailable', { url });
        resolve();
        return;
      }

      const script = doc.createElement('script');
      script.src = url;
      script.async = true;
      if (crossOrigin) {
        script.crossOrigin = crossOrigin;
      }

      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Script load failed: ${url}`));

      const target = doc.head ?? doc.body ?? doc.documentElement;
      if (!target) {
        emitLoadingWarning('Script load skipped - no mount target', { url });
        resolve();
        return;
      }
      target.appendChild(script);
    });
  }

  private loadStylesheet(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = getDocument();
      if (!doc) {
        emitLoadingWarning('Stylesheet load skipped - document unavailable', { url });
        resolve();
        return;
      }

      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Stylesheet load failed: ${url}`));

      const target = doc.head ?? doc.body ?? doc.documentElement;
      if (!target) {
        emitLoadingWarning('Stylesheet load skipped - no mount target', { url });
        resolve();
        return;
      }
      target.appendChild(link);
    });
  }

  private loadFont(url: string): Promise<void> {
    const win = getWindow();
    const doc = getDocument() as DocumentWithFonts | undefined;
    const FontFaceCtor = (win as { FontFace?: FontFaceConstructorLike } | undefined)?.FontFace;

    if (FontFaceCtor && doc?.fonts?.add) {
      const fontName = url.split('/').pop()?.split('.')[0] || 'unknown';
      const font = new FontFaceCtor(fontName, `url(${url})`);

      return font.load().then(() => {
        doc.fonts?.add?.(font);
        emitLoadingInfo('Font loaded via FontFace', { url, fontName });
      });
    }

    // Fallback to link preload
    return new Promise((resolve, reject) => {
      const fallbackDoc = getDocument();
      if (!fallbackDoc) {
        emitLoadingWarning('Font preload skipped - document unavailable', { url });
        resolve();
        return;
      }

      const link = fallbackDoc.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = url;

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Font load failed: ${url}`));

      const target = fallbackDoc.head ?? fallbackDoc.body ?? fallbackDoc.documentElement;
      if (!target) {
        emitLoadingWarning('Font preload skipped - no mount target', { url });
        resolve();
        return;
      }
      target.appendChild(link);
    });
  }

  private loadImage(url: string, crossOrigin?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const win = getWindow();
      const ImageCtor = (win as { Image?: ImageConstructorLike } | undefined)?.Image;
      if (!ImageCtor) {
        emitLoadingWarning('Image load skipped - Image constructor unavailable', { url });
        resolve();
        return;
      }

      const img = new ImageCtor();
      if (crossOrigin) {
        img.crossOrigin = crossOrigin;
      }

      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Image load failed: ${url}`));

      img.src = url;
    });
  }

  private loadFetch(url: string, crossOrigin?: string): Promise<void> {
    const win = getWindow();
    const fetchFn =
      (win?.fetch as FetchFunction | undefined) ??
      (typeof fetch === 'function' ? (fetch as unknown as FetchFunction) : undefined);
    if (!fetchFn) {
      emitLoadingWarning('Fetch skipped - fetch implementation unavailable', { url });
      return Promise.resolve();
    }

    const options: Record<string, unknown> = {};
    if (crossOrigin) {
      options.mode = crossOrigin === 'anonymous' ? 'cors' : 'same-origin';
    }

    return fetchFn(url, options).then(response => {
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

  getStats(): ResourceLoaderStats {
    return {
      loaded: this.loadedResources.size,
      failed: this.failedResources.size,
      queued: this.loadingQueue.length,
      active: this.activeRequests.size,
      maxConcurrent: this.maxConcurrentRequests,
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
        timeout: 1000,
      },

      // Essential fonts
      {
        url: '/assets/fonts/inter-var.woff2',
        type: 'font',
        priority: 'critical',
        crossOrigin: 'anonymous',
      },

      // Critical JavaScript chunks
      {
        url: '/assets/js/runtime.js',
        type: 'script',
        priority: 'critical',
        timeout: 1500,
      },
      {
        url: '/assets/js/vendor.js',
        type: 'script',
        priority: 'high',
        timeout: 2000,
      },
    ];

    const performanceApi = getPerformance();
    const startTime = typeof performanceApi?.now === 'function' ? performanceApi.now() : Date.now();
    if (typeof performanceApi?.mark === 'function') {
      performanceApi.mark('critical-path-start');
    }

    try {
      await Promise.all(criticalResources.map(config => this.loader.load(config)));

      const endTime = typeof performanceApi?.now === 'function' ? performanceApi.now() : Date.now();
      const loadTime = endTime - startTime;
      if (typeof performanceApi?.mark === 'function') {
        performanceApi.mark('critical-path-end');
      }
      if (typeof performanceApi?.measure === 'function') {
        try {
          performanceApi.measure('critical-path-load', 'critical-path-start', 'critical-path-end');
        } catch {
          // Ignore measure failures
        }
      }

      emitLoadingInfo('Critical path loaded', {
        loadTime,
      });

      dispatchLoadingEvent('catalyst:critical-path-ready', {
        message: 'Critical path ready',
        loadTime,
        timestamp: Date.now(),
      });
    } catch (error) {
      emitLoadingError('Critical path loading failed', {
        error: error instanceof Error ? error.message : String(error),
      });
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
          priority: 'high',
        },
        {
          url: '/assets/css/tactics.css',
          type: 'style',
          priority: 'high',
        },
      ],
      '/analytics': [
        {
          url: '/assets/js/analytics.chunk.js',
          type: 'script',
          priority: 'medium',
        },
        {
          url: '/assets/js/charts.chunk.js',
          type: 'script',
          priority: 'medium',
        },
      ],
    };

    return routeMap[routePath] || [];
  }
}

// Progressive loading hook
export function useProgressiveLoading() {
  const [loadingState, setLoadingState] = useState({
    critical: false,
    essential: false,
    complete: false,
  });

  const [loadingProgress, setLoadingProgress] = useState(0);
  const loader = useRef(ResourceLoader.getInstance());
  const preloader = useRef(CriticalResourcePreloader.getInstance());

  useEffect(() => {
    let mounted = true;

    const loadResources = async () => {
      const performanceApi = getPerformance();
      try {
        // Step 1: Critical path
        if (typeof performanceApi?.mark === 'function') {
          performanceApi.mark('app-loading-start');
        }
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
            priority: 'high',
          },
          {
            url: '/assets/css/components.css',
            type: 'style',
            priority: 'high',
          },
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
            priority: 'low',
          },
          {
            url: '/assets/js/utils.chunk.js',
            type: 'script',
            priority: 'low',
          },
        ];

        await Promise.all(nonCriticalResources.map(config => loader.current.load(config)));

        if (mounted) {
          setLoadingState(prev => ({ ...prev, complete: true }));
          setLoadingProgress(100);

          if (typeof performanceApi?.mark === 'function') {
            performanceApi.mark('app-loading-end');
          }
          if (typeof performanceApi?.measure === 'function') {
            try {
              performanceApi.measure('app-loading-total', 'app-loading-start', 'app-loading-end');
            } catch {
              // Ignore measure failures
            }
          }
          emitLoadingInfo('Progressive loading complete', {
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        emitLoadingError('Progressive loading failed', {
          error: error instanceof Error ? error.message : String(error),
        });
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
type LoadingMetricUpdate = {
  name: string;
  value: number;
  timestamp: number;
};

type LoadingTargetBreach = {
  metric: string;
  value: number;
  target: number;
};

export class LoadingPerformanceMonitor {
  private static instance: LoadingPerformanceMonitor;
  private observer: PerformanceObserverLike | null = null;
  private metrics = new Map<string, number>();
  private metricSubscribers = new Set<(update: LoadingMetricUpdate) => void>();

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
    const win = getWindow();
    const PerformanceObserverCtor = (
      win as { PerformanceObserver?: PerformanceObserverConstructorLike } | undefined
    )?.PerformanceObserver;
    if (!PerformanceObserverCtor) {
      return;
    }

    this.observer = new PerformanceObserverCtor(list => {
      for (const entry of list.getEntries()) {
        this.recordMetric(entry.name, entry.duration ?? entry.startTime);

        // Check against targets
        this.checkTargets(entry);
      }
    });

    try {
      this.observer.observe({
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'measure'],
      });
    } catch (error) {
      emitLoadingWarning('Performance observer setup failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private recordMetric(name: string, value: number) {
    this.metrics.set(name, value);

    // Emit metric event
    const update: LoadingMetricUpdate = {
      name,
      value,
      timestamp: Date.now(),
    };

    dispatchLoadingEvent('catalyst:loading-metric', update);
    this.notifyMetric(update);
  }

  private checkTargets(entry: PerformanceEntryLike) {
    if (entry.name === 'first-paint' && entry.startTime > LOADING_TARGETS.FIRST_PAINT) {
      emitLoadingWarning('First Paint exceeded target', {
        value: entry.startTime,
        target: LOADING_TARGETS.FIRST_PAINT,
      });
    }

    if (
      entry.name === 'first-contentful-paint' &&
      entry.startTime > LOADING_TARGETS.FIRST_CONTENTFUL_PAINT
    ) {
      emitLoadingWarning('First Contentful Paint exceeded target', {
        value: entry.startTime,
        target: LOADING_TARGETS.FIRST_CONTENTFUL_PAINT,
      });
    }

    if (
      entry.entryType === 'largest-contentful-paint' &&
      entry.startTime > LOADING_TARGETS.LARGEST_CONTENTFUL_PAINT
    ) {
      emitLoadingWarning('Largest Contentful Paint exceeded target', {
        value: entry.startTime,
        target: LOADING_TARGETS.LARGEST_CONTENTFUL_PAINT,
      });
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  subscribe(listener: (update: LoadingMetricUpdate) => void): () => void {
    this.metricSubscribers.add(listener);
    return () => {
      this.metricSubscribers.delete(listener);
    };
  }

  private notifyMetric(update: LoadingMetricUpdate) {
    this.metricSubscribers.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        emitLoadingError('Loading metric subscriber failed', {
          error: serializeError(error),
        });
      }
    });
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
        ttiTarget: metrics['time-to-interactive'] <= LOADING_TARGETS.TIME_TO_INTERACTIVE,
      },
    };
  }

  getTargetBreaches(): LoadingTargetBreach[] {
    const metrics = this.getMetrics();
    const breaches: LoadingTargetBreach[] = [];

    const check = (metric: string, target: number) => {
      const value = metrics[metric];
      if (typeof value === 'number' && value > target) {
        breaches.push({ metric, value, target });
      }
    };

    check('first-paint', LOADING_TARGETS.FIRST_PAINT);
    check('first-contentful-paint', LOADING_TARGETS.FIRST_CONTENTFUL_PAINT);
    check('largest-contentful-paint', LOADING_TARGETS.LARGEST_CONTENTFUL_PAINT);
    check('time-to-interactive', LOADING_TARGETS.TIME_TO_INTERACTIVE);

    return breaches;
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.metrics.clear();
    this.metricSubscribers.clear();
  }
}

type LoadingReport = ReturnType<LoadingPerformanceMonitor['getLoadingReport']>;
type LoadingBreaches = ReturnType<LoadingPerformanceMonitor['getTargetBreaches']>;

export function useLoadingDiagnostics() {
  const loaderInstance = ResourceLoader.getInstance();
  const monitorInstance = LoadingPerformanceMonitor.getInstance();
  const loaderRef = useRef(loaderInstance);
  const monitorRef = useRef(monitorInstance);
  const [stats, setStats] = useState<ResourceLoaderStats>(loaderInstance.getStats());
  const [report, setReport] = useState<LoadingReport>(monitorInstance.getLoadingReport());
  const [breaches, setBreaches] = useState<LoadingBreaches>(monitorInstance.getTargetBreaches());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const unsubscribeStats = loaderRef.current.onStats((next: ResourceLoaderStats) => {
      setStats(next);
    });

    const handleMetricUpdate = () => {
      const monitor = monitorRef.current;
      setReport(monitor.getLoadingReport());
      setBreaches(monitor.getTargetBreaches());
    };

    const unsubscribeMetrics = monitorRef.current.subscribe(() => {
      handleMetricUpdate();
    });

    handleMetricUpdate();

    return () => {
      unsubscribeStats();
      unsubscribeMetrics();
    };
  }, []);

  return { stats, report, breaches };
}

// Service Worker integration for caching
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistrationLike | null = null;

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async register(): Promise<void> {
    const navigatorInstance = getNavigator() as
      | (NavigatorInstance & { serviceWorker?: ServiceWorkerContainerLike })
      | undefined;
    const serviceWorker = navigatorInstance?.serviceWorker;
    const registerFn = serviceWorker?.register;
    if (!registerFn) {
      return;
    }

    try {
      this.registration = await registerFn('/sw.js', {
        scope: '/',
      });

      emitLoadingInfo('Service Worker registered', {
        scope: this.registration?.scope ?? '/',
      });

      this.registration?.addEventListener?.('updatefound', () => {
        emitLoadingInfo('Service Worker update found', {
          timestamp: Date.now(),
        });
      });
    } catch (error) {
      emitLoadingError('Service Worker registration failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async precacheResources(urls: string[]): Promise<void> {
    const postMessage = this.registration?.active?.postMessage;
    if (typeof postMessage === 'function') {
      postMessage({
        type: 'PRECACHE_RESOURCES',
        urls,
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
  useLoadingDiagnostics,
  LOADING_TARGETS,
};
