/**
 * Responsive Design Utilities
 * 
 * Comprehensive responsive design utilities including:
 * - Breakpoint management
 * - Device detection
 * - Viewport utilities
 * - Dynamic styling
 * - Media query hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Standard breakpoint definitions
export const BREAKPOINTS = {
  xs: 320,   // Extra small devices (phones, 320px and up)
  sm: 576,   // Small devices (landscape phones, 576px and up)
  md: 768,   // Medium devices (tablets, 768px and up)
  lg: 992,   // Large devices (desktops, 992px and up)
  xl: 1200,  // Extra large devices (large desktops, 1200px and up)
  xxl: 1400  // Extra extra large devices (larger desktops, 1400px and up)
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
export type BreakpointValue = typeof BREAKPOINTS[BreakpointKey];

// Device type detection
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type OrientationType = 'portrait' | 'landscape';

// Viewport information
export interface ViewportInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: OrientationType;
  breakpoint: BreakpointKey;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  pixelRatio: number;
}

// Responsive configuration
export interface ResponsiveConfig {
  [key: string]: any;
  xs?: any;
  sm?: any;
  md?: any;
  lg?: any;
  xl?: any;
  xxl?: any;
}

class ResponsiveManager {
  private listeners = new Set<(viewport: ViewportInfo) => void>();
  private currentViewport: ViewportInfo | null = null;
  private mediaQueries: Map<string, MediaQueryList> = new Map();
  private isInitialized = false;

  /**
   * Initialize responsive manager
   */
  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.currentViewport = this.calculateViewportInfo();
    this.setupMediaQueryListeners();
    this.setupResizeListener();
    this.isInitialized = true;

    console.log('[Responsive Manager] Initialized', this.currentViewport);
  }

  /**
   * Calculate current viewport information
   */
  private calculateViewportInfo(): ViewportInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Determine device type
    const deviceType = this.getDeviceType(width);
    
    // Determine orientation
    const orientation: OrientationType = width > height ? 'landscape' : 'portrait';
    
    // Determine breakpoint
    const breakpoint = this.getCurrentBreakpoint(width);
    
    // Touch capability
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      width,
      height,
      deviceType,
      orientation,
      breakpoint,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isTouch,
      pixelRatio
    };
  }

  /**
   * Determine device type based on width
   */
  private getDeviceType(width: number): DeviceType {
    if (width < BREAKPOINTS.md) return 'mobile';
    if (width < BREAKPOINTS.xl) return 'tablet';
    return 'desktop';
  }

  /**
   * Get current breakpoint based on width
   */
  private getCurrentBreakpoint(width: number): BreakpointKey {
    if (width >= BREAKPOINTS.xxl) return 'xxl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }

  /**
   * Setup media query listeners for breakpoints
   */
  private setupMediaQueryListeners(): void {
    Object.entries(BREAKPOINTS).forEach(([key, value]) => {
      const mediaQuery = window.matchMedia(`(min-width: ${value}px)`);
      this.mediaQueries.set(key, mediaQuery);
      
      const handleChange = () => {
        this.updateViewport();
      };
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // Legacy browsers
        mediaQuery.addListener(handleChange);
      }
    });
  }

  /**
   * Setup window resize listener
   */
  private setupResizeListener(): void {
    let resizeTimer: NodeJS.Timeout;
    
    const handleResize = () => {
      // Debounce resize events
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.updateViewport();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      // iOS orientation change fix
      setTimeout(() => this.updateViewport(), 100);
    });
  }

  /**
   * Update viewport information and notify listeners
   */
  private updateViewport(): void {
    const newViewport = this.calculateViewportInfo();
    const hasChanged = !this.currentViewport || 
      this.currentViewport.width !== newViewport.width ||
      this.currentViewport.height !== newViewport.height ||
      this.currentViewport.breakpoint !== newViewport.breakpoint;

    if (hasChanged) {
      this.currentViewport = newViewport;
      this.notifyListeners();
    }
  }

  /**
   * Notify all listeners of viewport changes
   */
  private notifyListeners(): void {
    if (!this.currentViewport) return;
    
    this.listeners.forEach(listener => {
      try {
        listener(this.currentViewport!);
      } catch (error) {
        console.error('[Responsive Manager] Listener error:', error);
      }
    });
  }

  /**
   * Subscribe to viewport changes
   */
  subscribe(listener: (viewport: ViewportInfo) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current viewport if available
    if (this.currentViewport) {
      listener(this.currentViewport);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current viewport information
   */
  getViewport(): ViewportInfo | null {
    return this.currentViewport;
  }

  /**
   * Check if current viewport matches breakpoint
   */
  matches(breakpoint: BreakpointKey): boolean {
    if (!this.currentViewport) return false;
    
    const currentBreakpointValue = BREAKPOINTS[this.currentViewport.breakpoint];
    const targetBreakpointValue = BREAKPOINTS[breakpoint];
    
    return currentBreakpointValue >= targetBreakpointValue;
  }

  /**
   * Check if viewport is between breakpoints
   */
  between(min: BreakpointKey, max: BreakpointKey): boolean {
    if (!this.currentViewport) return false;
    
    const currentValue = BREAKPOINTS[this.currentViewport.breakpoint];
    const minValue = BREAKPOINTS[min];
    const maxValue = BREAKPOINTS[max];
    
    return currentValue >= minValue && currentValue < maxValue;
  }
}

// Export singleton instance
export const responsiveManager = new ResponsiveManager();

// Hook for using responsive features in React components
export function useResponsive() {
  const [viewport, setViewport] = useState<ViewportInfo | null>(() => 
    responsiveManager.getViewport()
  );

  useEffect(() => {
    // Initialize manager if not already done
    responsiveManager.initialize();
    
    // Subscribe to changes
    const unsubscribe = responsiveManager.subscribe(setViewport);
    
    return unsubscribe;
  }, []);

  const matches = useCallback((breakpoint: BreakpointKey) => {
    return responsiveManager.matches(breakpoint);
  }, [viewport]);

  const between = useCallback((min: BreakpointKey, max: BreakpointKey) => {
    return responsiveManager.between(min, max);
  }, [viewport]);

  return useMemo(() => ({
    viewport,
    matches,
    between,
    isMobile: viewport?.isMobile ?? false,
    isTablet: viewport?.isTablet ?? false,
    isDesktop: viewport?.isDesktop ?? false,
    isTouch: viewport?.isTouch ?? false,
    breakpoint: viewport?.breakpoint ?? 'xs',
    orientation: viewport?.orientation ?? 'portrait'
  }), [viewport, matches, between]);
}

// Hook for responsive values
export function useResponsiveValue<T>(config: ResponsiveConfig & { default?: T }): T {
  const { breakpoint } = useResponsive();
  
  return useMemo(() => {
    // Check breakpoints in descending order
    const breakpoints: BreakpointKey[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentBreakpointIndex = breakpoints.indexOf(breakpoint);
    
    // Find the most appropriate value
    for (let i = currentBreakpointIndex; i < breakpoints.length; i++) {
      const bp = breakpoints[i];
      if (config[bp] !== undefined) {
        return config[bp];
      }
    }
    
    return config.default;
  }, [config, breakpoint]);
}

// Hook for media queries
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    // Set initial value
    setMatches(mediaQuery.matches);
    
    // Add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

// Utility functions
export const ResponsiveUtils = {
  /**
   * Convert responsive config to CSS classes
   */
  getResponsiveClasses(config: ResponsiveConfig, prefix: string = ''): string {
    const classes: string[] = [];
    
    Object.entries(config).forEach(([breakpoint, value]) => {
      if (BREAKPOINTS.hasOwnProperty(breakpoint)) {
        const className = prefix ? `${prefix}-${breakpoint}-${value}` : `${breakpoint}-${value}`;
        classes.push(className);
      }
    });
    
    return classes.join(' ');
  },

  /**
   * Generate media query string
   */
  getMediaQuery(breakpoint: BreakpointKey, direction: 'up' | 'down' = 'up'): string {
    const value = BREAKPOINTS[breakpoint];
    
    if (direction === 'up') {
      return `(min-width: ${value}px)`;
    } else {
      return `(max-width: ${value - 1}px)`;
    }
  },

  /**
   * Generate media query for range
   */
  getMediaQueryBetween(min: BreakpointKey, max: BreakpointKey): string {
    const minValue = BREAKPOINTS[min];
    const maxValue = BREAKPOINTS[max];
    
    return `(min-width: ${minValue}px) and (max-width: ${maxValue - 1}px)`;
  },

  /**
   * Check if device is mobile based on user agent
   */
  isMobileUserAgent(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Get device orientation
   */
  getOrientation(): OrientationType {
    if (typeof window === 'undefined') return 'portrait';
    
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  },

  /**
   * Check if device supports hover
   */
  supportsHover(): boolean {
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia('(hover: hover)').matches;
  },

  /**
   * Get safe area insets (for notch devices)
   */
  getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
    if (typeof window === 'undefined' || !CSS.supports('top: env(safe-area-inset-top)')) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const style = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
    };
  },

  /**
   * Apply safe area CSS variables
   */
  applySafeAreaVariables(): void {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    // Set safe area inset variables
    root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
    root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
    root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
    root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
  }
};

// CSS-in-JS helper for responsive styles
export function createResponsiveStyles(config: ResponsiveConfig): { [key: string]: any } {
  const styles: { [key: string]: any } = {};
  
  Object.entries(config).forEach(([breakpoint, value]) => {
    if (breakpoint === 'default') {
      Object.assign(styles, value);
    } else if (BREAKPOINTS.hasOwnProperty(breakpoint)) {
      const mediaQuery = ResponsiveUtils.getMediaQuery(breakpoint as BreakpointKey);
      styles[`@media ${mediaQuery}`] = value;
    }
  });
  
  return styles;
}

// Tailwind CSS responsive classes helper
export function getResponsiveTailwindClasses(config: ResponsiveConfig, property: string): string {
  const classes: string[] = [];
  
  // Add default class if present
  if (config.default !== undefined) {
    classes.push(`${property}-${config.default}`);
  }
  
  // Add responsive classes
  Object.entries(config).forEach(([breakpoint, value]) => {
    if (breakpoint !== 'default' && BREAKPOINTS.hasOwnProperty(breakpoint) && value !== undefined) {
      classes.push(`${breakpoint}:${property}-${value}`);
    }
  });
  
  return classes.join(' ');
}

// Auto-initialize on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      responsiveManager.initialize();
      ResponsiveUtils.applySafeAreaVariables();
    });
  } else {
    responsiveManager.initialize();
    ResponsiveUtils.applySafeAreaVariables();
  }
}