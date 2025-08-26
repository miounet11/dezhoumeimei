/**
 * Performance Monitoring Dashboard
 * 
 * Comprehensive real-time performance monitoring including:
 * - Core Web Vitals tracking
 * - Resource loading metrics
 * - User interaction performance
 * - Network condition monitoring
 * - Mobile-specific performance metrics
 * - Real-time alerting system
 */

import { useState, useEffect } from 'react';
import { mobileOptimizer, PerformanceMetrics } from '../mobile/performance-optimizer';

// Performance thresholds based on Core Web Vitals
export const PERFORMANCE_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },      // First Contentful Paint
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint
  FID: { good: 100, poor: 300 },        // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
  TTFB: { good: 600, poor: 1500 },      // Time to First Byte
  INP: { good: 200, poor: 500 }         // Interaction to Next Paint
} as const;

// Performance metric types
export interface CoreWebVitals {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  inp?: number;
  timestamp: number;
}

export interface ResourceMetrics {
  loadTime: number;
  size: number;
  type: string;
  url: string;
  cached: boolean;
  timestamp: number;
}

export interface UserInteractionMetrics {
  type: string;
  duration: number;
  timestamp: number;
  target: string;
}

export interface NetworkMetrics {
  type: string;
  downlink?: number;
  rtt?: number;
  effectiveType?: string;
  timestamp: number;
}

export interface PerformanceDashboardData {
  coreWebVitals: CoreWebVitals[];
  resources: ResourceMetrics[];
  interactions: UserInteractionMetrics[];
  network: NetworkMetrics[];
  mobile: PerformanceMetrics[];
  alerts: PerformanceAlert[];
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  resolved: boolean;
}

class PerformanceDashboard {
  private data: PerformanceDashboardData;
  private observers: Map<string, PerformanceObserver> = new Map();
  private listeners = new Set<(data: PerformanceDashboardData) => void>();
  private isMonitoring = false;
  private alertIdCounter = 0;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.data = {
      coreWebVitals: [],
      resources: [],
      interactions: [],
      network: [],
      mobile: [],
      alerts: []
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;

    console.log('[Performance Dashboard] Starting monitoring...');

    try {
      this.setupCoreWebVitalsMonitoring();
      this.setupResourceMonitoring();
      this.setupInteractionMonitoring();
      this.setupNetworkMonitoring();
      this.setupMobileMonitoring();
      this.setupPeriodicCollection();

      this.isMonitoring = true;
      this.notifyListeners();
      
      console.log('[Performance Dashboard] Monitoring started successfully');
    } catch (error) {
      console.error('[Performance Dashboard] Failed to start monitoring:', error);
    }
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  private setupCoreWebVitalsMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    // FCP & LCP Observer
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const vitals: Partial<CoreWebVitals> = { timestamp: Date.now() };

        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            vitals.fcp = entry.startTime;
            this.checkThreshold('FCP', entry.startTime);
          } else if (entry.entryType === 'largest-contentful-paint') {
            vitals.lcp = entry.startTime;
            this.checkThreshold('LCP', entry.startTime);
          }
        });

        if (Object.keys(vitals).length > 1) {
          this.addCoreWebVital(vitals as CoreWebVitals);
        }
      });

      paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      this.observers.set('paint', paintObserver);
    } catch (error) {
      console.warn('[Performance Dashboard] Paint observer setup failed:', error);
    }

    // CLS Observer
    try {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let clsValue = 0;

        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        if (clsValue > 0) {
          this.addCoreWebVital({
            cls: clsValue,
            timestamp: Date.now()
          });
          this.checkThreshold('CLS', clsValue);
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    } catch (error) {
      console.warn('[Performance Dashboard] CLS observer setup failed:', error);
    }

    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry: any) => {
          this.addCoreWebVital({
            fid: entry.processingStart - entry.startTime,
            timestamp: Date.now()
          });
          this.checkThreshold('FID', entry.processingStart - entry.startTime);
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    } catch (error) {
      console.warn('[Performance Dashboard] FID observer setup failed:', error);
    }

    // Navigation timing for TTFB
    this.collectNavigationTiming();
  }

  /**
   * Collect navigation timing metrics
   */
  private collectNavigationTiming(): void {
    if (!('performance' in window) || !performance.getEntriesByType) return;

    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      const ttfb = nav.responseStart - nav.requestStart;

      this.addCoreWebVital({
        ttfb,
        timestamp: Date.now()
      });
      this.checkThreshold('TTFB', ttfb);
    }
  }

  /**
   * Setup resource monitoring
   */
  private setupResourceMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry) => {
          const resource: ResourceMetrics = {
            loadTime: entry.duration,
            size: (entry as any).transferSize || 0,
            type: this.getResourceType(entry.name),
            url: entry.name,
            cached: (entry as any).transferSize === 0,
            timestamp: Date.now()
          };

          this.data.resources.push(resource);

          // Check for slow resources
          if (resource.loadTime > 3000) {
            this.addAlert('warning', 'Resource Load Time', resource.loadTime, 3000,
              `Slow resource loading detected: ${resource.url}`);
          }
        });

        this.notifyListeners();
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (error) {
      console.warn('[Performance Dashboard] Resource observer setup failed:', error);
    }
  }

  /**
   * Setup user interaction monitoring
   */
  private setupInteractionMonitoring(): void {
    const interactionEvents = ['click', 'keydown', 'touchstart'];

    interactionEvents.forEach((eventType) => {
      document.addEventListener(eventType, (event) => {
        const startTime = performance.now();
        
        // Use requestAnimationFrame to measure interaction duration
        requestAnimationFrame(() => {
          const duration = performance.now() - startTime;
          
          const interaction: UserInteractionMetrics = {
            type: eventType,
            duration,
            timestamp: Date.now(),
            target: this.getElementSelector(event.target as Element)
          };

          this.data.interactions.push(interaction);

          // Check for slow interactions
          if (duration > PERFORMANCE_THRESHOLDS.INP.good) {
            this.addAlert('warning', 'Interaction Performance', duration, 
              PERFORMANCE_THRESHOLDS.INP.good, 
              `Slow ${eventType} interaction detected`);
          }

          this.notifyListeners();
        });
      }, { passive: true, capture: true });
    });
  }

  /**
   * Setup network condition monitoring
   */
  private setupNetworkMonitoring(): void {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      const updateNetworkMetrics = () => {
        const network: NetworkMetrics = {
          type: connection.type || 'unknown',
          downlink: connection.downlink,
          rtt: connection.rtt,
          effectiveType: connection.effectiveType,
          timestamp: Date.now()
        };

        this.data.network.push(network);

        // Check for poor network conditions
        if (connection.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) {
          this.addAlert('warning', 'Network Performance', 0, 0,
            `Poor network conditions detected: ${connection.effectiveType}`);
        }

        this.notifyListeners();
      };

      // Initial reading
      updateNetworkMetrics();

      // Listen for network changes
      connection.addEventListener('change', updateNetworkMetrics);
    }
  }

  /**
   * Setup mobile-specific monitoring
   */
  private setupMobileMonitoring(): void {
    if (typeof window === 'undefined') return;

    const collectMobileMetrics = () => {
      const metrics = mobileOptimizer.getMetrics();
      if (metrics) {
        this.data.mobile.push(metrics);

        // Check mobile-specific alerts
        if (metrics.isLowEndDevice && metrics.memoryUsage > 50 * 1024 * 1024) {
          this.addAlert('warning', 'Memory Usage', metrics.memoryUsage, 50 * 1024 * 1024,
            'High memory usage on low-end device');
        }

        this.notifyListeners();
      }
    };

    // Collect metrics every 30 seconds
    setInterval(collectMobileMetrics, 30000);
    
    // Initial collection
    collectMobileMetrics();
  }

  /**
   * Setup periodic data collection
   */
  private setupPeriodicCollection(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectPerformanceMetrics();
      this.cleanupOldData();
    }, 10000); // Every 10 seconds
  }

  /**
   * Collect additional performance metrics
   */
  private collectPerformanceMetrics(): void {
    if (!('performance' in window)) return;

    // Collect memory information
    const memory = (performance as any).memory;
    if (memory) {
      const memoryUsage = memory.usedJSHeapSize;
      const memoryLimit = memory.jsHeapSizeLimit;
      
      if (memoryUsage / memoryLimit > 0.8) {
        this.addAlert('warning', 'Memory Usage', memoryUsage, memoryLimit * 0.8,
          'High memory usage detected');
      }
    }

    // Collect frame rate information if available
    if ('requestAnimationFrame' in window) {
      this.measureFrameRate();
    }
  }

  /**
   * Measure frame rate
   */
  private measureFrameRate(): void {
    let frames = 0;
    const startTime = performance.now();

    const countFrames = () => {
      frames++;
      const elapsed = performance.now() - startTime;
      
      if (elapsed >= 1000) {
        const fps = Math.round((frames * 1000) / elapsed);
        
        if (fps < 30) {
          this.addAlert('warning', 'Frame Rate', fps, 30,
            `Low frame rate detected: ${fps} FPS`);
        }
        
        return;
      }
      
      requestAnimationFrame(countFrames);
    };

    requestAnimationFrame(countFrames);
  }

  /**
   * Add Core Web Vital measurement
   */
  private addCoreWebVital(vital: CoreWebVitals): void {
    this.data.coreWebVitals.push(vital);
    this.notifyListeners();
  }

  /**
   * Check if metric exceeds threshold
   */
  private checkThreshold(metric: keyof typeof PERFORMANCE_THRESHOLDS, value: number): void {
    const threshold = PERFORMANCE_THRESHOLDS[metric];
    
    if (value > threshold.poor) {
      this.addAlert('critical', metric, value, threshold.poor,
        `${metric} is critically slow: ${Math.round(value)}ms`);
    } else if (value > threshold.good) {
      this.addAlert('warning', metric, value, threshold.good,
        `${metric} is slower than recommended: ${Math.round(value)}ms`);
    }
  }

  /**
   * Add performance alert
   */
  private addAlert(
    type: 'warning' | 'critical',
    metric: string,
    value: number,
    threshold: number,
    message: string
  ): void {
    const alert: PerformanceAlert = {
      id: `alert-${++this.alertIdCounter}`,
      type,
      metric,
      value,
      threshold,
      message,
      timestamp: Date.now(),
      resolved: false
    };

    this.data.alerts.push(alert);
    
    // Auto-resolve duplicate alerts
    this.deduplicateAlerts();
    
    console.warn(`[Performance Alert] ${type.toUpperCase()}: ${message}`, { value, threshold });
    this.notifyListeners();
  }

  /**
   * Remove duplicate alerts
   */
  private deduplicateAlerts(): void {
    const seen = new Set<string>();
    
    this.data.alerts = this.data.alerts.filter((alert) => {
      const key = `${alert.metric}-${alert.type}`;
      
      if (seen.has(key) && !alert.resolved) {
        return false;
      }
      
      seen.add(key);
      return true;
    });
  }

  /**
   * Clean up old data to prevent memory leaks
   */
  private cleanupOldData(): void {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    // Clean old Core Web Vitals
    this.data.coreWebVitals = this.data.coreWebVitals.filter(
      (vital) => now - vital.timestamp < maxAge
    );

    // Clean old resources
    this.data.resources = this.data.resources.filter(
      (resource) => now - resource.timestamp < maxAge
    );

    // Clean old interactions
    this.data.interactions = this.data.interactions.filter(
      (interaction) => now - interaction.timestamp < maxAge
    );

    // Clean old network metrics
    this.data.network = this.data.network.filter(
      (network) => now - network.timestamp < maxAge
    );

    // Clean old mobile metrics
    this.data.mobile = this.data.mobile.filter(
      (mobile) => now - mobile.loadTime < maxAge
    );

    // Clean resolved alerts older than 1 hour
    const alertMaxAge = 60 * 60 * 1000;
    this.data.alerts = this.data.alerts.filter(
      (alert) => !alert.resolved || now - alert.timestamp < alertMaxAge
    );
  }

  /**
   * Get element selector for target identification
   */
  private getElementSelector(element: Element): string {
    if (!element) return 'unknown';
    
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font';
    if (url.includes('api/')) return 'api';
    return 'other';
  }

  /**
   * Subscribe to dashboard updates
   */
  subscribe(listener: (data: PerformanceDashboardData) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current data
    listener(this.data);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.data);
      } catch (error) {
        console.error('[Performance Dashboard] Listener error:', error);
      }
    });
  }

  /**
   * Get current dashboard data
   */
  getData(): PerformanceDashboardData {
    return { ...this.data };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const now = Date.now();
    const recentTimeframe = 60 * 1000; // Last minute
    
    // Recent Core Web Vitals
    const recentVitals = this.data.coreWebVitals.filter(
      (vital) => now - vital.timestamp < recentTimeframe
    );
    
    // Average metrics
    const avgFCP = this.calculateAverage(recentVitals, 'fcp');
    const avgLCP = this.calculateAverage(recentVitals, 'lcp');
    const avgFID = this.calculateAverage(recentVitals, 'fid');
    const avgCLS = this.calculateAverage(recentVitals, 'cls');
    
    // Active alerts
    const activeAlerts = this.data.alerts.filter((alert) => !alert.resolved);
    
    // Performance score (0-100)
    const score = this.calculatePerformanceScore({
      fcp: avgFCP,
      lcp: avgLCP,
      fid: avgFID,
      cls: avgCLS
    });

    return {
      score,
      coreWebVitals: {
        fcp: avgFCP,
        lcp: avgLCP,
        fid: avgFID,
        cls: avgCLS
      },
      alerts: {
        total: activeAlerts.length,
        critical: activeAlerts.filter((a) => a.type === 'critical').length,
        warnings: activeAlerts.filter((a) => a.type === 'warning').length
      },
      resources: {
        total: this.data.resources.length,
        avgLoadTime: this.calculateAverage(this.data.resources, 'loadTime'),
        cached: this.data.resources.filter((r) => r.cached).length
      }
    };
  }

  /**
   * Calculate average value for a metric
   */
  private calculateAverage(items: any[], key: string): number {
    const validItems = items.filter((item) => typeof item[key] === 'number');
    if (validItems.length === 0) return 0;
    
    const sum = validItems.reduce((acc, item) => acc + item[key], 0);
    return Math.round(sum / validItems.length);
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(vitals: Partial<CoreWebVitals>): number {
    const scores: number[] = [];
    
    if (vitals.fcp !== undefined) {
      scores.push(this.getMetricScore('FCP', vitals.fcp));
    }
    
    if (vitals.lcp !== undefined) {
      scores.push(this.getMetricScore('LCP', vitals.lcp));
    }
    
    if (vitals.fid !== undefined) {
      scores.push(this.getMetricScore('FID', vitals.fid));
    }
    
    if (vitals.cls !== undefined) {
      scores.push(this.getMetricScore('CLS', vitals.cls));
    }
    
    if (scores.length === 0) return 0;
    
    return Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length);
  }

  /**
   * Get score for individual metric
   */
  private getMetricScore(metric: keyof typeof PERFORMANCE_THRESHOLDS, value: number): number {
    const threshold = PERFORMANCE_THRESHOLDS[metric];
    
    if (value <= threshold.good) return 100;
    if (value >= threshold.poor) return 0;
    
    // Linear interpolation between good and poor
    const range = threshold.poor - threshold.good;
    const position = value - threshold.good;
    return Math.round(100 - (position / range) * 100);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.data.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.notifyListeners();
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    // Disconnect all observers
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
    
    // Clear interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.isMonitoring = false;
    console.log('[Performance Dashboard] Monitoring stopped');
  }

  /**
   * Export data for analysis
   */
  exportData(): string {
    return JSON.stringify({
      ...this.data,
      exportTimestamp: Date.now(),
      summary: this.getPerformanceSummary()
    }, null, 2);
  }
}

// Export singleton instance
export const performanceDashboard = new PerformanceDashboard();

// React hook for using performance dashboard
export function usePerformanceDashboard() {
  const [data, setData] = useState<PerformanceDashboardData | null>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    // Start monitoring
    performanceDashboard.startMonitoring();
    
    // Subscribe to updates
    const unsubscribe = performanceDashboard.subscribe((dashboardData) => {
      setData(dashboardData);
      setSummary(performanceDashboard.getPerformanceSummary());
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    data,
    summary,
    resolveAlert: (alertId: string) => performanceDashboard.resolveAlert(alertId),
    exportData: () => performanceDashboard.exportData()
  };
}

// Auto-start monitoring when loaded
if (typeof window !== 'undefined') {
  // Wait for the page to be fully loaded
  if (document.readyState === 'complete') {
    performanceDashboard.startMonitoring();
  } else {
    window.addEventListener('load', () => {
      performanceDashboard.startMonitoring();
    });
  }
}