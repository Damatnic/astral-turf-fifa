/**
 * Catalyst Runtime Performance Optimizations
 * Ultra-responsive player interactions with sub-16ms response times
 */

import { useRef, useCallback, useEffect, useMemo } from 'react';
import { useFastMemo, useThrottleCallback } from './performanceOptimizations';

// Runtime performance constants
export const RUNTIME_PERFORMANCE = {
  TARGET_RESPONSE_TIME: 16,       // 16ms for 60fps
  CRITICAL_RESPONSE_TIME: 33,     // 33ms for 30fps
  INTERACTION_TIMEOUT: 100,       // 100ms interaction timeout
  BATCH_SIZE: 50,                 // Operations per batch
  DEBOUNCE_THRESHOLD: 8,          // 120fps for ultra-responsive feel
  MAX_CONCURRENT_OPERATIONS: 10,  // Max simultaneous operations
  WORKER_TIMEOUT: 5000,           // 5s worker timeout
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
  private operationQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private performanceHistory: number[] = [];
  private workers = new Map<string, Worker>();
  
  static getInstance(): InteractionManager {
    if (!InteractionManager.instance) {
      InteractionManager.instance = new InteractionManager();
    }
    return InteractionManager.instance;
  }
  
  private constructor() {
    this.setupPerformanceMonitoring();
    this.initializeWorkers();
  }
  
  private setupPerformanceMonitoring() {
    // Monitor frame drops and input delays
    let lastFrameTime = performance.now();
    
    const checkPerformance = (currentTime: number) => {
      const frameTime = currentTime - lastFrameTime;
      
      if (frameTime > RUNTIME_PERFORMANCE.CRITICAL_RESPONSE_TIME) {
        console.warn(`🐌 Frame drop detected: ${frameTime.toFixed(2)}ms`);
      }
      
      this.performanceHistory.push(frameTime);
      if (this.performanceHistory.length > 60) {
        this.performanceHistory.shift();
      }
      
      lastFrameTime = currentTime;
      requestAnimationFrame(checkPerformance);
    };
    
    requestAnimationFrame(checkPerformance);
  }
  
  private initializeWorkers() {
    // Initialize position calculation worker
    const positionWorkerCode = `
      self.onmessage = function(e) {
        const { type, data } = e.data;
        
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
        // High-performance position calculation
        const { players, formation, constraints } = data;
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
        const { playerId, position, formation, players } = data;
        
        // Fast validation logic
        const isValid = position.x >= 0 && position.x <= 100 && 
                       position.y >= 0 && position.y <= 100;
        
        return {
          isValid,
          optimizedPosition: isValid ? position : { x: 50, y: 50 },
          conflicts: []
        };
      }
    `;
    
    const blob = new Blob([positionWorkerCode], { type: 'application/javascript' });
    const positionWorker = new Worker(URL.createObjectURL(blob));
    this.workers.set('position', positionWorker);
  }
  
  // Ultra-fast interaction tracking
  startInteraction(id: string, type: InteractionType): void {
    const startTime = performance.now();
    
    this.activeInteractions.set(id, {
      type,
      startTime,
      successful: false
    });
    
    // Set up automatic timeout
    setTimeout(() => {
      if (this.activeInteractions.has(id)) {
        this.endInteraction(id, false);
      }
    }, RUNTIME_PERFORMANCE.INTERACTION_TIMEOUT);
  }
  
  endInteraction(id: string, successful = true): void {
    const interaction = this.activeInteractions.get(id);
    if (!interaction) return;
    
    const endTime = performance.now();
    const duration = endTime - interaction.startTime;
    
    // Update interaction record
    interaction.endTime = endTime;
    interaction.duration = duration;
    interaction.successful = successful;
    
    // Performance analysis
    if (duration > RUNTIME_PERFORMANCE.TARGET_RESPONSE_TIME) {
      console.warn(
        `🐌 Slow ${interaction.type} interaction: ${duration.toFixed(2)}ms ` +
        `(target: ${RUNTIME_PERFORMANCE.TARGET_RESPONSE_TIME}ms)`
      );
    }
    
    // Clean up
    this.activeInteractions.delete(id);
    
    // Emit performance event
    window.dispatchEvent(new CustomEvent('catalyst:interaction-complete', {
      detail: { ...interaction, duration }
    }));
  }
  
  // Batched operation processing
  async queueOperation(operation: () => Promise<void>, priority = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      const wrappedOperation = async () => {
        try {
          await operation();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      // Insert based on priority
      let insertIndex = this.operationQueue.length;
      for (let i = 0; i < this.operationQueue.length; i++) {
        if (priority > 0) { // Higher priority goes first
          insertIndex = i;
          break;
        }
      }
      
      this.operationQueue.splice(insertIndex, 0, wrappedOperation);
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.processOperationQueue();
      }
    });
  }
  
  private async processOperationQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) return;
    
    this.isProcessing = true;
    const startTime = performance.now();
    
    while (this.operationQueue.length > 0) {
      const batchSize = Math.min(RUNTIME_PERFORMANCE.BATCH_SIZE, this.operationQueue.length);
      const batch = this.operationQueue.splice(0, batchSize);
      
      // Process batch in parallel
      try {
        await Promise.all(batch.map(op => op()));
      } catch (error) {
        console.error('Batch operation failed:', error);
      }
      
      // Check if we're taking too long
      const elapsed = performance.now() - startTime;
      if (elapsed > RUNTIME_PERFORMANCE.TARGET_RESPONSE_TIME) {
        // Yield to browser
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    this.isProcessing = false;
  }
  
  // Worker-based position calculation
  async calculatePositions(data: any): Promise<any> {
    const worker = this.workers.get('position');
    if (!worker) throw new Error('Position worker not available');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Position calculation timeout'));
      }, RUNTIME_PERFORMANCE.WORKER_TIMEOUT);
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'POSITIONS_CALCULATED') {
          clearTimeout(timeout);
          worker.removeEventListener('message', handleMessage);
          resolve(event.data.result);
        }
      };
      
      worker.addEventListener('message', handleMessage);
      worker.postMessage({ type: 'CALCULATE_POSITIONS', data });
    });
  }
  
  // Get performance metrics
  getPerformanceMetrics() {
    const avgFrameTime = this.performanceHistory.length > 0 
      ? this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length
      : 0;
    
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 60;
    
    return {
      averageFrameTime: avgFrameTime,
      currentFPS: Math.round(fps),
      activeInteractions: this.activeInteractions.size,
      queuedOperations: this.operationQueue.length,
      isProcessing: this.isProcessing
    };
  }
  
  cleanup() {
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
    this.activeInteractions.clear();
    this.operationQueue = [];
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
  private rafId: number | null = null;
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
    // Use passive listeners for better performance
    this.element.addEventListener('mousedown', this.handleStart, { passive: true });
    this.element.addEventListener('touchstart', this.handleStart, { passive: true });
    
    // Global move and end listeners
    document.addEventListener('mousemove', this.handleMove, { passive: true });
    document.addEventListener('mouseup', this.handleEnd, { passive: true });
    document.addEventListener('touchmove', this.handleMove, { passive: true });
    document.addEventListener('touchend', this.handleEnd, { passive: true });
  }
  
  private handleStart = (event: MouseEvent | TouchEvent) => {
    const point = 'touches' in event ? event.touches[0] : event;
    
    this.isDragging = true;
    this.startPosition = { x: point.clientX, y: point.clientY };
    this.currentPosition = { ...this.startPosition };
    
    // Start interaction tracking
    this.interactionManager.startInteraction('drag', 'drag');
    
    // Optimize for dragging
    this.element.style.pointerEvents = 'none';
    document.body.style.userSelect = 'none';
  };
  
  private handleMove = (event: MouseEvent | TouchEvent) => {
    if (!this.isDragging) return;
    
    const now = performance.now();
    
    // Throttle to 120fps for ultra-responsive feel
    if (now - this.lastMoveTime < RUNTIME_PERFORMANCE.DEBOUNCE_THRESHOLD) return;
    this.lastMoveTime = now;
    
    const point = 'touches' in event ? event.touches[0] : event;
    
    this.currentPosition = { x: point.clientX, y: point.clientY };
    
    const delta = {
      x: this.currentPosition.x - this.startPosition.x,
      y: this.currentPosition.y - this.startPosition.y
    };
    
    // Use RAF for smooth updates
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    this.rafId = requestAnimationFrame(() => {
      this.onMove(delta);
    });
  };
  
  private handleEnd = () => {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    // Clean up optimization
    this.element.style.pointerEvents = 'auto';
    document.body.style.userSelect = 'auto';
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // End interaction tracking
    this.interactionManager.endInteraction('drag', true);
    
    // Final position callback
    this.onEnd(this.currentPosition);
  };
  
  destroy() {
    // Remove all event listeners
    this.element.removeEventListener('mousedown', this.handleStart);
    this.element.removeEventListener('touchstart', this.handleStart);
    document.removeEventListener('mousemove', this.handleMove);
    document.removeEventListener('mouseup', this.handleEnd);
    document.removeEventListener('touchmove', this.handleMove);
    document.removeEventListener('touchend', this.handleEnd);
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
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
    // Single event listener for all events
    this.root.addEventListener('click', this.handleEvent, { passive: true });
    this.root.addEventListener('mousedown', this.handleEvent, { passive: true });
    this.root.addEventListener('mouseup', this.handleEvent, { passive: true });
    this.root.addEventListener('touchstart', this.handleEvent, { passive: true });
    this.root.addEventListener('touchend', this.handleEvent, { passive: true });
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
    if (element.id) return `#${element.id}`;
    if (element.dataset.selector) return `[data-selector="${element.dataset.selector}"]`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
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
    this.root.removeEventListener('click', this.handleEvent);
    this.root.removeEventListener('mousedown', this.handleEvent);
    this.root.removeEventListener('mouseup', this.handleEvent);
    this.root.removeEventListener('touchstart', this.handleEvent);
    this.root.removeEventListener('touchend', this.handleEvent);
    
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
    if (elementRef.current && !dragHandlerRef.current) {
      dragHandlerRef.current = new OptimizedDragHandler(
        elementRef.current,
        onMove,
        onEnd
      );
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
    isProcessing: false
  });
  
  useEffect(() => {
    const interactionManager = InteractionManager.getInstance();
    
    const updateMetrics = () => {
      setMetrics(interactionManager.getPerformanceMetrics());
    };
    
    const interval = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial update
    
    return () => clearInterval(interval);
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
  private timeoutId: number | null = null;
  
  constructor(
    batchSize: number,
    delay: number,
    processor: (batch: T[]) => Promise<void>
  ) {
    this.batchSize = batchSize;
    this.delay = delay;
    this.processor = processor;
  }
  
  add(item: T): void {
    this.queue.push(item);
    
    if (this.queue.length >= this.batchSize) {
      this.processBatch();
    } else if (!this.timeoutId) {
      this.timeoutId = window.setTimeout(() => {
        this.processBatch();
      }, this.delay);
    }
  }
  
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      await this.processor(batch);
    } catch (error) {
      console.error('Batch processing failed:', error);
    } finally {
      this.isProcessing = false;
      
      // Process remaining items
      if (this.queue.length > 0) {
        setTimeout(() => this.processBatch(), 0);
      }
    }
  }
  
  flush(): Promise<void> {
    return this.processBatch();
  }
  
  clear(): void {
    this.queue = [];
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
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
  RUNTIME_PERFORMANCE
};
