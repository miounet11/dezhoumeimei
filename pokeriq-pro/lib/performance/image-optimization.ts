/**
 * Advanced image optimization utilities for progressive loading and performance
 * Supports WebP, AVIF, responsive images, and lazy loading with intersection observer
 */

export interface ImageOptimizationConfig {
  quality?: number;
  formats?: Array<'webp' | 'avif' | 'jpeg' | 'png'>;
  placeholder?: 'blur' | 'empty' | 'data:image/svg+xml;base64,...';
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  blurDataURL?: string;
}

export interface ResponsiveImageSizes {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export class ImageOptimizer {
  private static readonly DEFAULT_SIZES: ResponsiveImageSizes = {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1920,
  };

  private static readonly SUPPORTED_FORMATS = ['webp', 'avif', 'jpeg', 'png'];
  private static readonly DEFAULT_QUALITY = 85;

  /**
   * Generate optimized image source set for responsive images
   */
  static generateSrcSet(
    basePath: string,
    sizes: ResponsiveImageSizes = this.DEFAULT_SIZES,
    format: string = 'webp'
  ): string {
    const srcSetEntries = Object.entries(sizes).map(
      ([breakpoint, width]) => `${basePath}?w=${width}&f=${format}&q=${this.DEFAULT_QUALITY} ${width}w`
    );
    
    return srcSetEntries.join(', ');
  }

  /**
   * Generate responsive sizes attribute based on breakpoints
   */
  static generateSizes(customSizes?: string): string {
    if (customSizes) return customSizes;
    
    return [
      '(max-width: 640px) 100vw',
      '(max-width: 768px) 80vw',
      '(max-width: 1024px) 60vw',
      '40vw'
    ].join(', ');
  }

  /**
   * Generate optimized image configuration for Next.js Image component
   */
  static getOptimizedConfig(config: ImageOptimizationConfig = {}) {
    return {
      quality: config.quality || this.DEFAULT_QUALITY,
      formats: config.formats || ['avif', 'webp'],
      placeholder: config.placeholder || 'blur',
      sizes: config.sizes || this.generateSizes(),
      priority: config.priority || false,
      loading: config.loading || 'lazy',
      blurDataURL: config.blurDataURL || this.generateBlurDataURL(),
    };
  }

  /**
   * Generate a placeholder blur data URL
   */
  static generateBlurDataURL(color: string = '#f0f0f0'): string {
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="${color}"/>
      </svg>
    `;
    
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Generate gradient placeholder for better loading experience
   */
  static generateGradientPlaceholder(
    fromColor: string = '#f0f0f0',
    toColor: string = '#e0e0e0'
  ): string {
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${fromColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${toColor};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill="url(#gradient)"/>
      </svg>
    `;
    
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Calculate optimal image dimensions for given constraints
   */
  static calculateOptimalSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight?: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    if (!maxHeight) {
      return {
        width: Math.min(originalWidth, maxWidth),
        height: Math.min(originalHeight, maxWidth / aspectRatio),
      };
    }

    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }

  /**
   * Preload critical images for better performance
   */
  static preloadImage(src: string, formats: string[] = ['webp', 'jpeg']): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve();
      img.onerror = reject;
      
      // Try to load the best format first
      const bestFormat = this.getBestSupportedFormat(formats);
      img.src = this.convertToFormat(src, bestFormat);
    });
  }

  /**
   * Check browser support for image formats
   */
  static getBestSupportedFormat(preferredFormats: string[]): string {
    if (typeof window === 'undefined') return 'jpeg';
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    for (const format of preferredFormats) {
      try {
        const dataURL = canvas.toDataURL(`image/${format}`);
        if (dataURL.includes(`data:image/${format}`)) {
          return format;
        }
      } catch {
        continue;
      }
    }
    
    return 'jpeg';
  }

  /**
   * Convert image URL to specific format
   */
  static convertToFormat(src: string, format: string, quality?: number): string {
    if (src.includes('?')) {
      return `${src}&f=${format}&q=${quality || this.DEFAULT_QUALITY}`;
    }
    return `${src}?f=${format}&q=${quality || this.DEFAULT_QUALITY}`;
  }

  /**
   * Create intersection observer for lazy loading
   */
  static createLazyLoadObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver | null {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return null;
    }

    const defaultOptions: IntersectionObserverInit = {
      rootMargin: '50px 0px',
      threshold: 0.1,
      ...options,
    };

    return new IntersectionObserver(callback, defaultOptions);
  }

  /**
   * Generate image performance metrics
   */
  static trackImagePerformance(
    imageSrc: string,
    startTime: number = performance.now()
  ) {
    return {
      onLoad: () => {
        const loadTime = performance.now() - startTime;
        
        // Report to analytics if available
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'image_load', {
            event_category: 'performance',
            event_label: imageSrc,
            value: Math.round(loadTime),
          });
        }
        
        console.debug(`Image loaded: ${imageSrc} in ${loadTime.toFixed(2)}ms`);
      },
      onError: (error: Event) => {
        console.error(`Image failed to load: ${imageSrc}`, error);
        
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'image_error', {
            event_category: 'performance',
            event_label: imageSrc,
          });
        }
      }
    };
  }
}

/**
 * Image loading states for UI components
 */
export enum ImageLoadingState {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

/**
 * Image optimization presets for common use cases
 */
export const ImagePresets = {
  avatar: {
    sizes: '(max-width: 768px) 64px, 96px',
    quality: 90,
    formats: ['avif', 'webp'] as const,
  },
  thumbnail: {
    sizes: '(max-width: 768px) 150px, 200px',
    quality: 85,
    formats: ['avif', 'webp'] as const,
  },
  hero: {
    sizes: '100vw',
    quality: 90,
    priority: true,
    formats: ['avif', 'webp'] as const,
  },
  gallery: {
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    quality: 85,
    formats: ['avif', 'webp'] as const,
  },
  card: {
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px',
    quality: 80,
    formats: ['avif', 'webp'] as const,
  },
} as const;

/**
 * Utility function to detect image format from URL
 */
export function getImageFormat(src: string): string {
  const extension = src.split('.').pop()?.toLowerCase() || '';
  return ImageOptimizer['SUPPORTED_FORMATS'].includes(extension) ? extension : 'jpeg';
}

/**
 * Utility function to check if image optimization is supported
 */
export function isImageOptimizationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  return !!(
    window.IntersectionObserver &&
    window.HTMLImageElement &&
    'loading' in HTMLImageElement.prototype
  );
}