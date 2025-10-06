/**
 * Catalyst Runtime Performance Optimizations
 * Ultra-responsive player interactions with sub-16ms response times
 */

import { useRef, useCallback, useEffect, useState } from 'react';

type WindowInstance = typeof window;
type DocumentInstance = typeof document;

const getWindow = (): WindowInstance | undefined =>
  typeof window === 'undefined' ? undefined : window;

const getDocument = (): DocumentInstance | undefined =>
  typeof document === 'undefined' ? undefined : document;

type PerformanceLike = {
  now?: () => number;
  mark?: (name: string) => void;
  measure?: (name: string, startMark?: string, endMark?: string) => void;
};

const getPerformance = (): PerformanceLike | undefined =>
  getWindow()?.performance as PerformanceLike | undefined;

const performanceNow = (): number => {
  const perf = getPerformance();
  if (perf && typeof perf.now === 'function') {
    try {
      return perf.now();
    } catch {
      // Ignore failures and fall back
    }
  }
  return Date.now();
};

type TimeoutHandle = ReturnType<typeof setTimeout>;
type IntervalHandle = ReturnType<typeof setInterval>;
type RAFHandle = number | TimeoutHandle;

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

const scheduleInterval = (callback: () => void, intervalMs: number): IntervalHandle => {
  const win = getWindow();
  if (win?.setInterval) {
    return win.setInterval(callback, intervalMs) as unknown as IntervalHandle;
  }
  return setInterval(callback, intervalMs);
};

const clearScheduledInterval = (handle: IntervalHandle | null | undefined) => {
  if (!handle) {
    return;
  }

  const win = getWindow();
  if (win?.clearInterval) {
    win.clearInterval(handle as unknown as number);
    return;
  }

  clearInterval(handle);
};

const scheduleAnimationFrame = (callback: (timestamp: number) => void): RAFHandle | null => {
  const win = getWindow();
  if (win?.requestAnimationFrame) {
    return win.requestAnimationFrame(callback);
  }

  return scheduleTimeout(() => callback(performanceNow()), 16);
};

const cancelScheduledAnimationFrame = (handle: RAFHandle | null | undefined) => {
  if (handle === null || handle === undefined) {
    return;
  }

  const win = getWindow();
  if (typeof handle === 'number' && win?.cancelAnimationFrame) {
    win.cancelAnimationFrame(handle);
    return;
  }

  clearScheduledTimeout(handle as TimeoutHandle);
};

type RuntimeEventSeverity = 'info' | 'warning' | 'error';

type RuntimeEventDetail = {
  message: string;
  severity: RuntimeEventSeverity;
  timestamp: number;
} & Record<string, unknown>;

const dispatchRuntimeEvent = (type: string, detail: RuntimeEventDetail) => {
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

const emitRuntimeEvent = (
  severity: RuntimeEventSeverity,
  message: string,
  context: Record<string, unknown> = {}
) => {
  dispatchRuntimeEvent(`catalyst:runtime-${severity}`, {
    message,
    severity,
    timestamp: Date.now(),
    ...context,
  });
};

const emitRuntimeInfo = (message: string, context: Record<string, unknown> = {}) =>
  emitRuntimeEvent('info', message, context);

const emitRuntimeWarning = (message: string, context: Record<string, unknown> = {}) =>
  emitRuntimeEvent('warning', message, context);

const emitRuntimeError = (message: string, context: Record<string, unknown> = {}) =>
  emitRuntimeEvent('error', message, context);

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

type WorkerMessageEvent = {
  data?: Record<string, unknown>;
};

type WorkerLike = {
  postMessage: (message: unknown) => void;
  terminate?: () => void;
  addEventListener?: (type: string, listener: (event: WorkerMessageEvent) => void) => void;
  removeEventListener?: (type: string, listener: (event: WorkerMessageEvent) => void) => void;
};

type WorkerConstructorLike = new (url: string, options?: unknown) => WorkerLike;

type BlobConstructorLike = new (parts?: unknown[], options?: Record<string, unknown>) => unknown;

type URLLike = {
  createObjectURL?: (obj: unknown) => string;
  revokeObjectURL?: (url: string) => void;
};

type GlobalRuntimeLike = typeof globalThis & {
  Worker?: WorkerConstructorLike;
  Blob?: BlobConstructorLike;
  URL?: URLLike;
};

// Runtime performance constants
export const RUNTIME_PERFORMANCE = {
  TARGET_RESPONSE_TIME: 16, // 16ms for 60fps
  CRITICAL_RESPONSE_TIME: 33, // 33ms for 30fps
  INTERACTION_TIMEOUT: 100, // 100ms interaction timeout
  BATCH_SIZE: 50, // Operations per batch
  DEBOUNCE_THRESHOLD: 8, // 120fps for ultra-responsive feel
  MAX_CONCURRENT_OPERATIONS: 10, // Max simultaneous operations
  WORKER_TIMEOUT: 5000, // 5s worker timeout
} as const;

// Interaction types for optimization
type InteractionType = 'drag' | 'click' | 'hover' | 'scroll' | 'resize' | 'key';

interface InteractionMetrics {
  type: InteractionType;
  startTime: number;
  endTime?: number;
  duration?: number;
  successful: boolean;
}

// High-performance interaction manager
export class InteractionManager {
  private static instance: InteractionManager;
  private activeInteractions = new Map<string, InteractionMetrics>();
  private interactionTimeouts = new Map<string, TimeoutHandle>();
  private operationQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private performanceHistory: number[] = [];
  private workers = new Map<string, WorkerLike>();
  private environmentReady = false;
  private frameMonitorHandle: RAFHandle | null = null;

  static getInstance(): InteractionManager {
    if (!InteractionManager.instance) {
      InteractionManager.instance = new InteractionManager();
    }
    InteractionManager.instance.ensureEnvironment();
    return InteractionManager.instance;
  }

  private constructor() {
    this.ensureEnvironment();
  }

  private ensureEnvironment() {
    if (this.environmentReady) {
      return;
    }

    if (!getWindow()) {
      return;
    }

    this.setupPerformanceMonitoring();
    this.initializeWorkers();
    this.environmentReady = true;
  }

  private setupPerformanceMonitoring() {
    if (this.frameMonitorHandle !== null) {
      return;
    }

    let lastFrameTime = performanceNow();

    const checkPerformance = (currentTime: number) => {
      const frameTime = currentTime - lastFrameTime;

      if (frameTime > RUNTIME_PERFORMANCE.CRITICAL_RESPONSE_TIME) {
        emitRuntimeWarning('Frame drop detected', {
          frameTime,
          threshold: RUNTIME_PERFORMANCE.CRITICAL_RESPONSE_TIME,
        });
      }

      this.performanceHistory.push(frameTime);
      if (this.performanceHistory.length > 120) {
        this.performanceHistory.shift();
      }

      lastFrameTime = currentTime;
      this.frameMonitorHandle = scheduleAnimationFrame(checkPerformance);
    };

    this.frameMonitorHandle = scheduleAnimationFrame(checkPerformance);
  }

  private initializeWorkers() {
    if (this.workers.has('position')) {
      return;
    }

    const win = getWindow() as
      | (WindowInstance & {
          Worker?: WorkerConstructorLike;
          Blob?: BlobConstructorLike;
          URL?: URLLike;
        })
      | undefined;

    const globalScope = globalThis as GlobalRuntimeLike;

    const WorkerCtor = win?.Worker ?? globalScope.Worker;
    const BlobCtor = win?.Blob ?? globalScope.Blob;
    const urlTools = win?.URL ?? globalScope.URL;

    const createObjectURL = urlTools?.createObjectURL;
    const revokeObjectURL = urlTools?.revokeObjectURL;

    if (!WorkerCtor || !BlobCtor || !createObjectURL) {
      return;
    }

    const positionWorkerCode = `
      self.onmessage = function(e) {
        const { type, data } = e.data || {};

        switch(type) {
          case 'CALCULATE_POSITIONS':
            const result = calculateOptimalPositions(data);
            self.postMessage({ type: 'POSITIONS_CALCULATED', result });
            break;
          case 'VALIDATE_MOVE':
            const validation = validatePlayerMove(data);
            self.postMessage({ type: 'MOVE_VALIDATED', result: validation });
            break;
        }
      };

      function calculateOptimalPositions(data) {
        if (!data) return [];
        const { players = [] } = data;
        const positions = [];

        for (let i = 0; i < players.length; i++) {
          const player = players[i];
          const position = {
            x: Math.max(0, Math.min(100, player.targetX)),
            y: Math.max(0, Math.min(100, player.targetY)),
            playerId: player.id
          };
          positions.push(position);
        }

        return positions;
      }

      function validatePlayerMove(data) {
        if (!data) {
          return {
            isValid: false,
            optimizedPosition: { x: 50, y: 50 },
            conflicts: []
          };
        }

        const { position } = data;

        if (!position) {
          return {
            isValid: false,
            optimizedPosition: { x: 50, y: 50 },
            conflicts: []
          };
        }

        const isValid = position.x >= 0 && position.x <= 100 &&
                       position.y >= 0 && position.y <= 100;

        return {
          isValid,
          optimizedPosition: isValid ? position : { x: 50, y: 50 },
          conflicts: []
        };
      }
    `;

    try {
      const blob = new BlobCtor([positionWorkerCode], { type: 'application/javascript' });
      const objectUrl = createObjectURL(blob);
      if (!objectUrl) {
        return;
      }

      const worker = new WorkerCtor(objectUrl);
      this.workers.set('position', worker);
      revokeObjectURL?.(objectUrl);
    } catch (error) {
      emitRuntimeWarning('Failed to initialize position worker', serializeError(error));
    }
  }

  startInteraction(id: string, type: InteractionType): void {
    this.ensureEnvironment();

    const startTime = performanceNow();

    this.activeInteractions.set(id, {
      type,
      startTime,
      successful: false,
    });

    const timeoutHandle = scheduleTimeout(() => {
      if (this.activeInteractions.has(id)) {
        this.endInteraction(id, false);
      }
    }, RUNTIME_PERFORMANCE.INTERACTION_TIMEOUT);

    this.interactionTimeouts.set(id, timeoutHandle);
  }

  endInteraction(id: string, successful = true): void {
    const interaction = this.activeInteractions.get(id);
    if (!interaction) {
      return;
    }

    const endTime = performanceNow();
    const duration = endTime - interaction.startTime;

    interaction.endTime = endTime;
    interaction.duration = duration;
    interaction.successful = successful;

    if (duration > RUNTIME_PERFORMANCE.TARGET_RESPONSE_TIME) {
      emitRuntimeWarning('Slow interaction detected', {
        interactionType: interaction.type,
        duration,
        target: RUNTIME_PERFORMANCE.TARGET_RESPONSE_TIME,
      });
    }

    this.activeInteractions.delete(id);
    const timeoutHandle = this.interactionTimeouts.get(id);
    clearScheduledTimeout(timeoutHandle);
    this.interactionTimeouts.delete(id);

    dispatchRuntimeEvent('catalyst:interaction-complete', {
      message: 'Interaction complete',
      severity: 'info',
      timestamp: Date.now(),
      ...interaction,
      duration,
    });

    emitRuntimeInfo('Interaction completed', {
      interactionType: interaction.type,
      duration,
    });
  }

  async queueOperation(operation: () => Promise<void>, priority = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      const wrappedOperation = async () => {
        try {
          await operation();
          resolve();
        } catch (error) {
          emitRuntimeError('Queued operation failed', {
            error: serializeError(error),
          });
          reject(error);
        }
      };

      let insertIndex = this.operationQueue.length;
      if (priority > 0) {
        insertIndex = 0;
      }

      this.operationQueue.splice(insertIndex, 0, wrappedOperation);

      if (!this.isProcessing) {
        void this.processOperationQueue();
      }
    });
  }

  private async processOperationQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batchStart = performanceNow();

    while (this.operationQueue.length > 0) {
      const batchSize = Math.min(RUNTIME_PERFORMANCE.BATCH_SIZE, this.operationQueue.length);
      const batch = this.operationQueue.splice(0, batchSize);

      try {
        await Promise.all(batch.map(op => op()));
      } catch (error) {
        emitRuntimeError('Batch operation failed', {
          error: serializeError(error),
        });
      }

      const elapsed = performanceNow() - batchStart;
      if (elapsed > RUNTIME_PERFORMANCE.TARGET_RESPONSE_TIME) {
        await new Promise<void>(resolve => {
          scheduleTimeout(resolve, 0);
        });
      }
    }

    this.isProcessing = false;
  }

  async calculatePositions(data: unknown): Promise<unknown> {
    const worker = this.workers.get('position');
    if (!worker) {
      throw new Error('Position worker not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = scheduleTimeout(() => {
        worker.removeEventListener?.('message', handleMessage);
        reject(new Error('Position calculation timeout'));
      }, RUNTIME_PERFORMANCE.WORKER_TIMEOUT);

      const handleMessage = (event: WorkerMessageEvent) => {
        const payload = event.data;
        if (payload && payload.type === 'POSITIONS_CALCULATED') {
          clearScheduledTimeout(timeout);
          worker.removeEventListener?.('message', handleMessage);
          resolve(payload.result);
        }
      };

      worker.addEventListener?.('message', handleMessage);

      try {
        worker.postMessage({ type: 'CALCULATE_POSITIONS', data });
      } catch (error) {
        clearScheduledTimeout(timeout);
        worker.removeEventListener?.('message', handleMessage);
        reject(error);
      }
    });
  }

  getPerformanceMetrics() {
    const sampleCount = this.performanceHistory.length;
    const avgFrameTime =
      sampleCount > 0
        ? this.performanceHistory.reduce((total, value) => total + value, 0) / sampleCount
        : 0;

    const fps = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 60;

    return {
      averageFrameTime: avgFrameTime,
      currentFPS: fps,
      activeInteractions: this.activeInteractions.size,
      queuedOperations: this.operationQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  cleanup() {
    this.workers.forEach(worker => worker.terminate?.());
    this.workers.clear();
    this.activeInteractions.clear();
    this.operationQueue = [];
    this.interactionTimeouts.forEach(handle => clearScheduledTimeout(handle));
    this.interactionTimeouts.clear();
    cancelScheduledAnimationFrame(this.frameMonitorHandle);
    this.frameMonitorHandle = null;
    this.environmentReady = false;
  }
}

// Optimized drag handler
export class OptimizedDragHandler {
  private element: HTMLElement;
  private isDragging = false;
  private startPosition = { x: 0, y: 0 };
  private currentPosition = { x: 0, y: 0 };
  private onMove: (delta: { x: number; y: number }) => void;
  private onEnd: (position: { x: number; y: number }) => void;
  private interactionManager = InteractionManager.getInstance();
  private rafHandle: RAFHandle | null = null;
  private lastMoveTime = 0;

  constructor(
    element: HTMLElement,
    onMove: (delta: { x: number; y: number }) => void,
    onEnd: (position: { x: number; y: number }) => void
  ) {
    this.element = element;
    this.onMove = onMove;
    this.onEnd = onEnd;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    const doc = getDocument();
    if (!doc) {
      return;
    }

    this.element.addEventListener?.('mousedown', this.handleStart, { passive: true });
    this.element.addEventListener?.('touchstart', this.handleStart, { passive: true });

    doc.addEventListener?.('mousemove', this.handleMove, { passive: true });
    doc.addEventListener?.('mouseup', this.handleEnd, { passive: true });
    doc.addEventListener?.('touchmove', this.handleMove, { passive: true });
    doc.addEventListener?.('touchend', this.handleEnd, { passive: true });
  }

  private handleStart = (event: globalThis.MouseEvent | globalThis.TouchEvent) => {
    const point = 'touches' in event ? event.touches[0] : event;
    if (!point) {
      return;
    }

    this.isDragging = true;
    this.startPosition = { x: point.clientX, y: point.clientY };
    this.currentPosition = { ...this.startPosition };

    // Start interaction tracking
    this.interactionManager.startInteraction('drag', 'drag');

    // Optimize for dragging
    this.element.style.pointerEvents = 'none';
    const doc = getDocument();
    if (doc?.body) {
      doc.body.style.userSelect = 'none';
    }
  };

  private handleMove = (event: globalThis.MouseEvent | globalThis.TouchEvent) => {
    if (!this.isDragging) {
      return;
    }

    const now = performanceNow();
    if (now - this.lastMoveTime < RUNTIME_PERFORMANCE.DEBOUNCE_THRESHOLD) {
      return;
    }

    this.lastMoveTime = now;

    const point = 'touches' in event ? event.touches[0] : event;
    if (!point) {
      return;
    }

    this.currentPosition = { x: point.clientX, y: point.clientY };

    const delta = {
      x: this.currentPosition.x - this.startPosition.x,
      y: this.currentPosition.y - this.startPosition.y,
    };

    if (this.rafHandle) {
      cancelScheduledAnimationFrame(this.rafHandle);
    }

    this.rafHandle = scheduleAnimationFrame(() => {
      this.onMove(delta);
    });
  };

  private handleEnd = () => {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;

    // Clean up optimization
    this.element.style.pointerEvents = 'auto';
    const doc = getDocument();
    if (doc?.body) {
      doc.body.style.userSelect = 'auto';
    }

    if (this.rafHandle) {
      cancelScheduledAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }

    // End interaction tracking
    this.interactionManager.endInteraction('drag', true);

    // Final position callback
    this.onEnd(this.currentPosition);
  };

  destroy() {
    this.element.removeEventListener?.('mousedown', this.handleStart);
    this.element.removeEventListener?.('touchstart', this.handleStart);

    const doc = getDocument();
    doc?.removeEventListener?.('mousemove', this.handleMove);
    doc?.removeEventListener?.('mouseup', this.handleEnd);
    doc?.removeEventListener?.('touchmove', this.handleMove);
    doc?.removeEventListener?.('touchend', this.handleEnd);

    if (this.rafHandle) {
      cancelScheduledAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }
}

// Optimized event delegation
export class EventDelegator {
  private root: HTMLElement;
  private handlers = new Map<string, Map<string, (event: Event) => void>>();

  constructor(root: HTMLElement) {
    this.root = root;
    this.setupDelegation();
  }

  private setupDelegation() {
    const doc = getDocument();
    if (!doc) {
      return;
    }

    this.root.addEventListener?.('click', this.handleEvent, { passive: true });
    this.root.addEventListener?.('mousedown', this.handleEvent, { passive: true });
    this.root.addEventListener?.('mouseup', this.handleEvent, { passive: true });
    this.root.addEventListener?.('touchstart', this.handleEvent, { passive: true });
    this.root.addEventListener?.('touchend', this.handleEvent, { passive: true });
  }

  private handleEvent = (event: Event) => {
    const target = event.target as HTMLElement;
    const eventType = event.type;

    // Walk up the DOM tree to find handlers
    let currentElement: HTMLElement | null = target;

    while (currentElement && currentElement !== this.root) {
      const selector = this.getElementSelector(currentElement);
      const eventHandlers = this.handlers.get(selector);

      if (eventHandlers?.has(eventType)) {
        const handler = eventHandlers.get(eventType)!;
        handler(event);

        // Stop propagation if handler exists
        if (event.cancelable) {
          event.stopPropagation();
        }
        break;
      }

      currentElement = currentElement.parentElement;
    }
  };

  private getElementSelector(element: HTMLElement): string {
    // Create a unique selector for the element
    if (element.id) {
      return `#${element.id}`;
    }
    if (element.dataset.selector) {
      return `[data-selector="${element.dataset.selector}"]`;
    }
    if (element.className) {
      return `.${element.className.split(' ')[0]}`;
    }
    return element.tagName.toLowerCase();
  }

  on(selector: string, eventType: string, handler: (event: Event) => void) {
    if (!this.handlers.has(selector)) {
      this.handlers.set(selector, new Map());
    }

    this.handlers.get(selector)!.set(eventType, handler);
  }

  off(selector: string, eventType?: string) {
    if (eventType) {
      this.handlers.get(selector)?.delete(eventType);
    } else {
      this.handlers.delete(selector);
    }
  }

  destroy() {
    const doc = getDocument();
    this.root.removeEventListener?.('click', this.handleEvent);
    this.root.removeEventListener?.('mousedown', this.handleEvent);
    this.root.removeEventListener?.('mouseup', this.handleEvent);
    this.root.removeEventListener?.('touchstart', this.handleEvent);
    this.root.removeEventListener?.('touchend', this.handleEvent);
    doc?.removeEventListener?.('click', this.handleEvent);

    this.handlers.clear();
  }
}

// React hooks for runtime optimizations
export function useOptimizedInteraction() {
  const interactionManager = useRef(InteractionManager.getInstance());

  const startInteraction = useCallback((id: string, type: InteractionType) => {
    interactionManager.current.startInteraction(id, type);
  }, []);

  const endInteraction = useCallback((id: string, successful = true) => {
    interactionManager.current.endInteraction(id, successful);
  }, []);

  const queueOperation = useCallback((operation: () => Promise<void>, priority = 0) => {
    return interactionManager.current.queueOperation(operation, priority);
  }, []);

  return { startInteraction, endInteraction, queueOperation };
}

export function useOptimizedDrag(
  onMove: (delta: { x: number; y: number }) => void,
  onEnd: (position: { x: number; y: number }) => void
) {
  const elementRef = useRef<HTMLElement>(null);
  const dragHandlerRef = useRef<OptimizedDragHandler | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (elementRef.current && !dragHandlerRef.current) {
      dragHandlerRef.current = new OptimizedDragHandler(elementRef.current, onMove, onEnd);
    }

    return () => {
      if (dragHandlerRef.current) {
        dragHandlerRef.current.destroy();
        dragHandlerRef.current = null;
      }
    };
  }, [onMove, onEnd]);

  return elementRef;
}

export function useRuntimePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    averageFrameTime: 0,
    currentFPS: 60,
    activeInteractions: 0,
    queuedOperations: 0,
    isProcessing: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const interactionManager = InteractionManager.getInstance();

    const updateMetrics = () => {
      setMetrics(interactionManager.getPerformanceMetrics());
    };

    const interval = scheduleInterval(updateMetrics, 1000);
    updateMetrics();

    return () => {
      clearScheduledInterval(interval);
    };
  }, []);

  return metrics;
}

// Optimized batch processor for large operations
export class BatchProcessor<T> {
  private batchSize: number;
  private delay: number;
  private processor: (batch: T[]) => Promise<void>;
  private queue: T[] = [];
  private isProcessing = false;
  private timeoutHandle: TimeoutHandle | null = null;

  constructor(batchSize: number, delay: number, processor: (batch: T[]) => Promise<void>) {
    this.batchSize = batchSize;
    this.delay = delay;
    this.processor = processor;
  }

  add(item: T): void {
    this.queue.push(item);

    if (this.queue.length >= this.batchSize) {
      this.processBatch();
    } else if (!this.timeoutHandle) {
      this.timeoutHandle = scheduleTimeout(() => {
        this.processBatch();
      }, this.delay);
    }
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    if (this.timeoutHandle) {
      clearScheduledTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }

    const batch = this.queue.splice(0, this.batchSize);

    try {
      await this.processor(batch);
    } catch (error) {
      emitRuntimeError('Batch processing failed', {
        error: serializeError(error),
      });
    } finally {
      this.isProcessing = false;

      // Process remaining items
      if (this.queue.length > 0) {
        scheduleTimeout(() => this.processBatch(), 0);
      }
    }
  }

  flush(): Promise<void> {
    return this.processBatch();
  }

  clear(): void {
    this.queue = [];
    if (this.timeoutHandle) {
      clearScheduledTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

export default {
  InteractionManager,
  OptimizedDragHandler,
  EventDelegator,
  BatchProcessor,
  useOptimizedInteraction,
  useOptimizedDrag,
  useRuntimePerformanceMonitor,
  RUNTIME_PERFORMANCE,
};
