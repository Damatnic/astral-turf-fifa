/**
 * Image Optimization Utilities
 *
 * Provides utilities for responsive images, lazy loading, and format optimization.
 */

export interface ImageOptimizationOptions {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  quality?: number;
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536]
): string {
  return widths
    .map(width => {
      const extension = src.split('.').pop();
      const basePath = src.replace(`.${extension}`, '');
      return `${basePath}-${width}w.${extension} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute based on common breakpoints
 */
export function generateSizes(maxWidth?: number): string {
  if (maxWidth) {
    return `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`;
  }

  return [
    '(max-width: 640px) 100vw',
    '(max-width: 768px) 50vw',
    '(max-width: 1024px) 33vw',
    '25vw',
  ].join(', ');
}

/**
 * Get optimized image props
 */
export function getOptimizedImageProps(options: ImageOptimizationOptions): {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  loading: 'lazy' | 'eager';
  decoding: 'async' | 'sync';
  width?: number;
  height?: number;
} {
  const { src, alt, width, height, sizes, loading = 'lazy', priority = false } = options;

  return {
    src,
    alt,
    ...(width && { width }),
    ...(height && { height }),
    ...(sizes && { sizes }),
    loading: priority ? 'eager' : loading,
    decoding: priority ? 'sync' : 'async',
  };
}

/**
 * Check if WebP is supported
 */
export function isWebPSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  return false;
}

/**
 * Get image format based on browser support
 */
export function getOptimalImageFormat(src: string): string {
  if (typeof window === 'undefined') {
    return src;
  }

  const extension = src.split('.').pop();
  const basePath = src.replace(`.${extension}`, '');

  // Check if WebP version exists (you'll need to generate these)
  if (isWebPSupported()) {
    return `${basePath}.webp`;
  }

  return src;
}

/**
 * Lazy load image with intersection observer
 */
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  src: string,
  options?: IntersectionObserverInit
): () => void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      },
      options || { rootMargin: '50px' }
    );

    observer.observe(imgElement);

    return () => observer.disconnect();
  } else {
    // Fallback: load immediately if IntersectionObserver not supported
    imgElement.src = src;
    return () => {};
  }
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, as: 'image' = 'image'): void {
  if (typeof window === 'undefined') {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Get image dimensions without loading
 */
export async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}/${height / divisor}`;
}

/**
 * Create blur placeholder data URL
 */
export function createBlurPlaceholder(width: number = 10, height: number = 10): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }

  // Create gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/png');
}

/**
 * Image loading state hook
 */
export function useImageLoadingState(src: string) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const img = new Image();

    img.onload = () => {
      setLoading(false);
      setError(null);
    };

    img.onerror = () => {
      setLoading(false);
      setError(new Error(`Failed to load image: ${src}`));
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { loading, error };
}

/**
 * Progressive image loading component helper
 */
export function createProgressiveImage(lowResSrc: string, highResSrc: string, alt: string) {
  return {
    placeholder: lowResSrc,
    src: highResSrc,
    alt,
    style: {
      filter: 'blur(10px)',
      transition: 'filter 0.3s ease-out',
    },
    onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.filter = 'blur(0)';
    },
  };
}

// Re-export React for the hook
import React from 'react';
