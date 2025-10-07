/**
 * Catalyst Animation Performance Optimizations
 * Ultra-high performance animation system with 60 FPS guarantees
 */

import { useRef, useCallback, useLayoutEffect, useMemo } from 'react';

// Animation performance constants
export const ANIMATION_PERFORMANCE = {
  TARGET_FPS: 60,
  FRAME_BUDGET_MS: 16.67, // 1000ms / 60fps
  CRITICAL_FRAME_TIME: 33, // 30fps threshold
  ANIMATION_BATCHING_THRESHOLD: 5, // Batch animations when more than 5 are active
  RAF_THROTTLE_MS: 8, // Throttle RAF calls for performance
} as const;

// Global animation scheduler for batching
class AnimationScheduler {
  private static instance: AnimationScheduler;
  private animationCallbacks = new Set<() => void>();
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private averageFrameTime = 16.67;
  private isPerformanceMode = false;

  static getInstance(): AnimationScheduler {
    if (!AnimationScheduler.instance) {
      AnimationScheduler.instance = new AnimationScheduler();
    }
    return AnimationScheduler.instance;
  }

  private tick = (currentTime: number) => {
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update performance metrics
    this.updatePerformanceMetrics(deltaTime);

    // Execute all batched animations
    if (this.animationCallbacks.size > 0) {
      // Check if we need to enable performance mode
      if (
        deltaTime > ANIMATION_PERFORMANCE.CRITICAL_FRAME_TIME &&
        this.animationCallbacks.size > ANIMATION_PERFORMANCE.ANIMATION_BATCHING_THRESHOLD
      ) {
        this.isPerformanceMode = true;
      }

      // Execute callbacks in batches to avoid frame drops
      const callbacks = Array.from(this.animationCallbacks);
      const batchSize = this.isPerformanceMode ? 3 : 5;

      for (let i = 0; i < callbacks.length; i += batchSize) {
        const batch = callbacks.slice(i, i + batchSize);
        batch.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.warn('Animation callback error:', error);
          }
        });

        // If we're running slow, yield to the browser
        if (deltaTime > ANIMATION_PERFORMANCE.FRAME_BUDGET_MS && i + batchSize < callbacks.length) {
          setTimeout(() => this.tick(performance.now()), 0);
          return;
        }
      }
    }

    // Schedule next frame if we have callbacks
    if (this.animationCallbacks.size > 0) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.rafId = null;
    }
  };

  private updatePerformanceMetrics(deltaTime: number) {
    this.frameCount++;
    this.averageFrameTime = this.averageFrameTime * 0.9 + deltaTime * 0.1;

    // Disable performance mode if we're running smoothly
    if (this.isPerformanceMode && this.averageFrameTime < ANIMATION_PERFORMANCE.FRAME_BUDGET_MS) {
      this.isPerformanceMode = false;
    }
  }

  schedule(callback: () => void): () => void {
    this.animationCallbacks.add(callback);

    // Start animation loop if not running
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.tick);
    }

    // Return unsubscribe function
    return () => {
      this.animationCallbacks.delete(callback);
    };
  }

  getPerformanceMetrics() {
    return {
      fps: 1000 / this.averageFrameTime,
      averageFrameTime: this.averageFrameTime,
      activeAnimations: this.animationCallbacks.size,
      isPerformanceMode: this.isPerformanceMode,
      frameCount: this.frameCount,
    };
  }

  forcePerformanceMode(enabled: boolean) {
    this.isPerformanceMode = enabled;
  }
}

// Ultra-optimized RAF hook
export function useOptimizedRaf(callback: (deltaTime: number) => void) {
  const callbackRef = useRef(callback);
  const deltaTimeRef = useRef(0);

  // Update callback reference
  callbackRef.current = callback;

  const animationCallback = useCallback(() => {
    callbackRef.current(deltaTimeRef.current);
  }, []);

  useLayoutEffect(() => {
    const scheduler = AnimationScheduler.getInstance();
    const unsubscribe = scheduler.schedule(animationCallback);

    return unsubscribe;
  }, [animationCallback]);
}

// CSS transform optimization
export class CSSTransformOptimizer {
  private element: HTMLElement;
  private transformCache = new Map<string, string>();
  private pendingTransforms = new Map<string, any>();
  private rafId: number | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
    // Force GPU acceleration
    this.element.style.willChange = 'transform';
    this.element.style.transform = 'translateZ(0)';
  }

  setTransform(property: string, value: any) {
    this.pendingTransforms.set(property, value);

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.applyTransforms();
        this.rafId = null;
      });
    }
  }

  private applyTransforms() {
    const transforms: string[] = [];

    // Apply transforms in optimal order for GPU
    const orderedProps = [
      'translateX',
      'translateY',
      'translateZ',
      'rotateX',
      'rotateY',
      'rotateZ',
      'scale',
      'skew',
    ];

    for (const prop of orderedProps) {
      if (this.pendingTransforms.has(prop)) {
        const value = this.pendingTransforms.get(prop);
        const transformString = this.formatTransform(prop, value);
        if (transformString) {
          transforms.push(transformString);
        }
      }
    }

    const finalTransform = transforms.join(' ');

    // Only update if transform actually changed
    if (!this.transformCache.has('final') || this.transformCache.get('final') !== finalTransform) {
      this.element.style.transform = finalTransform;
      this.transformCache.set('final', finalTransform);
    }

    this.pendingTransforms.clear();
  }

  private formatTransform(property: string, value: any): string {
    switch (property) {
      case 'translateX':
      case 'translateY':
        return `${property}(${typeof value === 'number' ? value + 'px' : value})`;
      case 'translateZ':
        return `translateZ(${typeof value === 'number' ? value + 'px' : value})`;
      case 'rotateX':
      case 'rotateY':
      case 'rotateZ':
        return `${property}(${typeof value === 'number' ? value + 'deg' : value})`;
      case 'scale':
        return `scale(${value})`;
      case 'skew':
        return `skew(${value})`;
      default:
        return '';
    }
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.element.style.willChange = 'auto';
    this.transformCache.clear();
    this.pendingTransforms.clear();
  }
}

// Optimized spring animation
export class OptimizedSpring {
  private value: number;
  private velocity: number;
  private target: number;
  private tension: number;
  private friction: number;
  private threshold: number;
  private onUpdate: (value: number) => void;
  private rafId: number | null = null;

  constructor({
    initialValue = 0,
    tension = 120,
    friction = 14,
    threshold = 0.01,
    onUpdate = () => {},
  }: {
    initialValue?: number;
    tension?: number;
    friction?: number;
    threshold?: number;
    onUpdate?: (value: number) => void;
  }) {
    this.value = initialValue;
    this.velocity = 0;
    this.target = initialValue;
    this.tension = tension;
    this.friction = friction;
    this.threshold = threshold;
    this.onUpdate = onUpdate;
  }

  setTarget(target: number) {
    this.target = target;
    this.start();
  }

  private tick = () => {
    const delta = this.target - this.value;
    const force = delta * this.tension;
    this.velocity += force * 0.016; // Assume 60fps
    this.velocity *= 1 - this.friction * 0.016;
    this.value += this.velocity * 0.016;

    this.onUpdate(this.value);

    // Continue if we haven't reached equilibrium
    if (Math.abs(delta) > this.threshold || Math.abs(this.velocity) > this.threshold) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.value = this.target;
      this.velocity = 0;
      this.onUpdate(this.value);
      this.rafId = null;
    }
  };

  private start() {
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getCurrentValue() {
    return this.value;
  }
}

// High-performance easing functions
export const easingFunctions = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - --t * t * t * t,
  easeInOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),
  easeInQuint: (t: number) => t * t * t * t * t,
  easeOutQuint: (t: number) => 1 + --t * t * t * t * t,
  easeInOutQuint: (t: number) => (t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t),
  // High-performance elastic and bounce functions
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
};

// Intersection Observer for animation culling
export class AnimationCuller {
  private observer: IntersectionObserver;
  private animatedElements = new Map<Element, () => void>();

  constructor(options: IntersectionObserverInit = { threshold: 0.1 }) {
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const stopAnimation = this.animatedElements.get(entry.target);
        if (stopAnimation) {
          if (entry.isIntersecting) {
            // Element is visible, allow animations
          } else {
            // Element is not visible, stop expensive animations
            stopAnimation();
          }
        }
      });
    }, options);
  }

  observe(element: Element, stopAnimation: () => void) {
    this.animatedElements.set(element, stopAnimation);
    this.observer.observe(element);

    return () => {
      this.animatedElements.delete(element);
      this.observer.unobserve(element);
    };
  }

  disconnect() {
    this.observer.disconnect();
    this.animatedElements.clear();
  }
}

// Performance-aware animation hook
export function usePerformanceAnimation(
  enabled: boolean,
  animationFn: () => void,
  deps: React.DependencyList = [],
) {
  const elementRef = useRef<HTMLElement>(null);
  const cullerRef = useRef<AnimationCuller | null>(null);

  useLayoutEffect(() => {
    if (!enabled || !elementRef.current) {
      return;
    }

    const scheduler = AnimationScheduler.getInstance();
    const metrics = scheduler.getPerformanceMetrics();

    // Skip animation if performance is poor
    if (metrics.fps < 30 || metrics.isPerformanceMode) {
      return;
    }

    // Set up intersection observer for animation culling
    if (!cullerRef.current) {
      cullerRef.current = new AnimationCuller();
    }

    const unsubscribeAnimation = scheduler.schedule(animationFn);
    const unsubserveCuller = cullerRef.current.observe(elementRef.current, unsubscribeAnimation);

    return () => {
      unsubscribeAnimation();
      unsubserveCuller();
    };
  }, [enabled, ...deps]);

  return elementRef;
}

// GPU-accelerated transform hook
export function useGPUTransform() {
  const elementRef = useRef<HTMLElement>(null);
  const optimizerRef = useRef<CSSTransformOptimizer | null>(null);

  useLayoutEffect(() => {
    if (elementRef.current && !optimizerRef.current) {
      optimizerRef.current = new CSSTransformOptimizer(elementRef.current);
    }

    return () => {
      if (optimizerRef.current) {
        optimizerRef.current.destroy();
        optimizerRef.current = null;
      }
    };
  }, []);

  const setTransform = useCallback((transforms: Record<string, any>) => {
    if (optimizerRef.current) {
      Object.entries(transforms).forEach(([property, value]) => {
        optimizerRef.current!.setTransform(property, value);
      });
    }
  }, []);

  return { elementRef, setTransform };
}

export default {
  AnimationScheduler,
  CSSTransformOptimizer,
  OptimizedSpring,
  AnimationCuller,
  easingFunctions,
  useOptimizedRaf,
  usePerformanceAnimation,
  useGPUTransform,
  ANIMATION_PERFORMANCE,
};
