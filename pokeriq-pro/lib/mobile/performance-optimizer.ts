/**
 * Mobile Performance Optimizer
 * 
 * Comprehensive mobile performance optimization utilities including:
 * - Resource monitoring and management
 * - Lazy loading strategies
 * - Memory optimization
 * - Network-aware loading
 * - Battery and CPU optimization
 */

// Performance metrics tracking
export interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  batteryLevel?: number;
  networkType: string;
  devicePixelRatio: number;
  screenSize: { width: number; height: number };
  isLowEndDevice: boolean;
}

// Resource optimization configuration
export interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableImageCompression: boolean;
  enableCaching: boolean;
  maxConcurrentRequests: number;
  prefetchResources: string[];
  criticalResources: string[];
}

class MobilePerformanceOptimizer {
  private metrics: PerformanceMetrics | null = null;
  private config: OptimizationConfig;
  private resourceCache = new Map<string, any>();
  private lazyLoadObserver: IntersectionObserver | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private isInitialized = false;

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = {
      enableLazyLoading: true,
      enableImageCompression: true,
      enableCaching: true,
      maxConcurrentRequests: 3,
      prefetchResources: [],
      criticalResources: [],
      ...config
    };
  }

  /**
   * Initialize performance optimizer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Collect device metrics
      this.metrics = await this.collectDeviceMetrics();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Initialize lazy loading
      if (this.config.enableLazyLoading) {
        this.initializeLazyLoading();
      }
      
      // Setup resource prefetching
      this.setupResourcePrefetching();
      
      // Apply device-specific optimizations
      this.applyDeviceOptimizations();
      
      this.isInitialized = true;
      
      console.log('[Mobile Optimizer] Initialized successfully', this.metrics);
    } catch (error) {
      console.error('[Mobile Optimizer] Initialization failed:', error);
    }
  }

  /**
   * Collect comprehensive device metrics
   */
  private async collectDeviceMetrics(): Promise<PerformanceMetrics> {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    // Memory information
    const memory = (performance as any).memory || {};
    
    // Battery API (if available)
    let batteryLevel;
    try {
      const battery = await (navigator as any).getBattery?.();
      batteryLevel = battery?.level * 100;
    } catch {
      batteryLevel = undefined;
    }
    
    // Determine if low-end device
    const isLowEndDevice = this.isLowEndDevice(memory, connection);
    
    return {
      loadTime: performance.now(),
      memoryUsage: memory.usedJSHeapSize || 0,
      batteryLevel,
      networkType: connection?.effectiveType || 'unknown',
      devicePixelRatio: window.devicePixelRatio || 1,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      isLowEndDevice
    };
  }

  /**
   * Determine if device is low-end based on capabilities
   */
  private isLowEndDevice(memory: any, connection: any): boolean {
    const lowMemoryThreshold = 1024 * 1024 * 1024; // 1GB
    const slowNetworkTypes = ['slow-2g', '2g'];
    
    return (
      memory.jsHeapSizeLimit && memory.jsHeapSizeLimit < lowMemoryThreshold ||
      navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2 ||
      connection && slowNetworkTypes.includes(connection.effectiveType) ||
      window.devicePixelRatio < 1.5
    );
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          // Log performance entries for debugging
          if (entry.entryType === 'navigation') {
            console.log('[Performance] Navigation timing:', entry);
          } else if (entry.entryType === 'paint') {
            console.log('[Performance] Paint timing:', entry.name, entry.startTime);
          } else if (entry.entryType === 'largest-contentful-paint') {
            console.log('[Performance] LCP:', entry.startTime);
          }
        });
      });
      
      // Observe different performance entry types
      this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    } catch (error) {
      console.error('[Mobile Optimizer] Performance observer setup failed:', error);
    }
  }

  /**
   * Initialize lazy loading with intersection observer
   */
  private initializeLazyLoading(): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.loadAllResourcesImmediately();
      return;
    }

    const options = {
      root: null,
      rootMargin: this.metrics?.isLowEndDevice ? '50px' : '200px',
      threshold: 0.1
    };

    this.lazyLoadObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadResource(entry.target as HTMLElement);
          this.lazyLoadObserver?.unobserve(entry.target);
        }
      });
    }, options);
  }

  /**
   * Load resource for lazy loaded element
   */
  private loadResource(element: HTMLElement): void {
    const dataSrc = element.getAttribute('data-src');
    const dataSrcSet = element.getAttribute('data-srcset');
    
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      
      if (dataSrcSet) {
        img.srcset = dataSrcSet;
      }
      if (dataSrc) {
        img.src = dataSrc;
      }
      
      // Apply image optimization
      if (this.config.enableImageCompression && this.metrics?.isLowEndDevice) {
        this.optimizeImage(img);
      }
    } else if (element.tagName === 'SOURCE') {
      const source = element as HTMLSourceElement;
      if (dataSrcSet) {
        source.srcset = dataSrcSet;
      }
    }
    
    element.classList.add('loaded');
  }

  /**
   * Optimize images for mobile devices
   */
  private optimizeImage(img: HTMLImageElement): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    img.onload = () => {
      const { width, height } = img;
      const maxWidth = this.metrics?.screenSize.width || 375;
      const maxHeight = this.metrics?.screenSize.height || 812;
      
      // Calculate optimal dimensions
      let newWidth = width;
      let newHeight = height;
      
      if (width > maxWidth) {
        newWidth = maxWidth;
        newHeight = (height * maxWidth) / width;
      }
      
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = (newWidth * maxHeight) / newHeight;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw optimized image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert back to image with compression
      canvas.toBlob((blob) => {
        if (blob) {
          img.src = URL.createObjectURL(blob);
        }
      }, 'image/jpeg', 0.8);
    };
  }

  /**
   * Setup resource prefetching based on network conditions
   */
  private setupResourcePrefetching(): void {
    if (!this.config.prefetchResources.length) return;
    
    const networkType = this.metrics?.networkType;
    const isSlowNetwork = ['slow-2g', '2g', '3g'].includes(networkType || '');
    
    if (isSlowNetwork && this.metrics?.isLowEndDevice) {
      // Skip prefetching on slow networks and low-end devices
      console.log('[Mobile Optimizer] Skipping prefetch due to network/device constraints');
      return;
    }
    
    // Prefetch critical resources
    this.config.prefetchResources.forEach((url) => {
      this.prefetchResource(url);
    });
  }

  /**
   * Prefetch a resource
   */
  private prefetchResource(url: string): void {
    if (this.resourceCache.has(url)) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
    
    this.resourceCache.set(url, { prefetched: true, timestamp: Date.now() });
  }

  /**
   * Apply device-specific optimizations
   */
  private applyDeviceOptimizations(): void {
    if (!this.metrics) return;
    
    const { isLowEndDevice, networkType } = this.metrics;
    
    // Reduce animation and transitions on low-end devices
    if (isLowEndDevice) {
      this.applyLowEndOptimizations();
    }
    
    // Apply network-specific optimizations
    if (['slow-2g', '2g'].includes(networkType)) {
      this.applySlowNetworkOptimizations();
    }
    
    // Memory management
    this.setupMemoryManagement();
  }

  /**
   * Apply optimizations for low-end devices
   */
  private applyLowEndOptimizations(): void {
    // Reduce animations
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01s !important;
        animation-delay: -0.01s !important;
        transition-duration: 0.01s !important;
        transition-delay: 0.01s !important;
      }
    `;
    document.head.appendChild(style);
    
    // Reduce image quality
    document.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('data-optimized')) {
        this.optimizeImage(img);
        img.setAttribute('data-optimized', 'true');
      }
    });
  }

  /**
   * Apply optimizations for slow networks
   */
  private applySlowNetworkOptimizations(): void {
    // Disable non-critical prefetching
    this.config.prefetchResources = this.config.criticalResources;
    
    // Reduce concurrent requests
    this.config.maxConcurrentRequests = Math.min(this.config.maxConcurrentRequests, 2);
    
    console.log('[Mobile Optimizer] Applied slow network optimizations');
  }

  /**
   * Setup memory management
   */
  private setupMemoryManagement(): void {
    // Clean up resource cache periodically
    setInterval(() => {
      this.cleanupResourceCache();
    }, 60000); // Every minute
    
    // Monitor memory usage
    if ((performance as any).memory) {
      setInterval(() => {
        this.monitorMemoryUsage();
      }, 30000); // Every 30 seconds
    }
  }

  /**
   * Clean up resource cache
   */
  private cleanupResourceCache(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    for (const [url, resource] of this.resourceCache.entries()) {
      if (now - resource.timestamp > maxAge) {
        this.resourceCache.delete(url);
      }
    }
  }

  /**
   * Monitor memory usage and take action if needed
   */
  private monitorMemoryUsage(): void {
    const memory = (performance as any).memory;
    if (!memory) return;
    
    const memoryUsageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    
    if (memoryUsageRatio > 0.8) {
      console.warn('[Mobile Optimizer] High memory usage detected:', memoryUsageRatio);
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Clean up caches
      this.cleanupResourceCache();
    }
  }

  /**
   * Fallback for browsers without IntersectionObserver
   */
  private loadAllResourcesImmediately(): void {
    document.querySelectorAll('[data-src]').forEach((element) => {
      this.loadResource(element as HTMLElement);
    });
  }

  /**
   * Register element for lazy loading
   */
  observeElement(element: HTMLElement): void {
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.observe(element);
    } else {
      // Fallback: load immediately
      this.loadResource(element);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  /**
   * Update optimization configuration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup and dispose of resources
   */
  dispose(): void {
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.disconnect();
      this.lazyLoadObserver = null;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    this.resourceCache.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const mobileOptimizer = new MobilePerformanceOptimizer();

// Export utilities for manual optimization
export const MobileOptimizationUtils = {
  /**
   * Check if device is mobile
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Check if device supports touch
   */
  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  /**
   * Get network information
   */
  getNetworkInfo(): any {
    return (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  },

  /**
   * Detect low-end device
   */
  isLowEndDevice(): boolean {
    const memory = (performance as any).memory;
    const connection = MobileOptimizationUtils.getNetworkInfo();
    
    return (
      navigator.hardwareConcurrency <= 2 ||
      (memory && memory.jsHeapSizeLimit < 1024 * 1024 * 1024) ||
      (connection && ['slow-2g', '2g'].includes(connection.effectiveType))
    );
  },

  /**
   * Optimize image loading
   */
  optimizeImageLoad(img: HTMLImageElement, options?: { quality?: number; maxWidth?: number }): void {
    const { quality = 0.8, maxWidth = 800 } = options || {};
    
    if (!img.complete) {
      img.onload = () => MobileOptimizationUtils.compressImage(img, quality, maxWidth);
    } else {
      MobileOptimizationUtils.compressImage(img, quality, maxWidth);
    }
  },

  /**
   * Compress image
   */
  compressImage(img: HTMLImageElement, quality: number, maxWidth: number): void {
    if (img.naturalWidth <= maxWidth) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const ratio = Math.min(maxWidth / img.naturalWidth, maxWidth / img.naturalHeight);
    canvas.width = img.naturalWidth * ratio;
    canvas.height = img.naturalHeight * ratio;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        img.src = URL.createObjectURL(blob);
      }
    }, 'image/jpeg', quality);
  }
};

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mobileOptimizer.initialize();
    });
  } else {
    mobileOptimizer.initialize();
  }
}