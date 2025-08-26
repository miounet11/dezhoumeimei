import { Configuration } from 'webpack';
import path from 'path';

/**
 * Bundle optimization configuration for advanced webpack setup
 * Includes smart code splitting, bundle analysis, and performance optimization
 */
export interface BundleOptimizerConfig {
  enableAnalyzer?: boolean;
  enablePrefetch?: boolean;
  chunkSizeThreshold?: number;
  maxChunks?: number;
  cacheGroups?: Record<string, any>;
}

export class BundleOptimizer {
  private config: BundleOptimizerConfig;

  constructor(config: BundleOptimizerConfig = {}) {
    this.config = {
      enableAnalyzer: process.env.ANALYZE === 'true',
      enablePrefetch: true,
      chunkSizeThreshold: 244000, // 244KB default threshold
      maxChunks: 20,
      ...config
    };
  }

  /**
   * Generate optimized webpack configuration for production builds
   */
  getWebpackOptimization(config: Configuration, { dev, isServer }: { dev: boolean; isServer: boolean }) {
    if (dev || isServer) return config;

    // Advanced chunk splitting configuration
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          // Framework chunks (React, Next.js core)
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          
          // UI Library chunks
          antd: {
            name: 'antd',
            test: /[\\/]node_modules[\\/]antd[\\/]/,
            chunks: 'all',
            priority: 30,
            enforce: true,
          },
          
          // Icon libraries
          icons: {
            name: 'icons',
            test: /[\\/]node_modules[\\/](lucide-react|@heroicons|react-icons)[\\/]/,
            chunks: 'all',
            priority: 25,
            enforce: true,
          },
          
          // Animation libraries
          animations: {
            name: 'animations',
            test: /[\\/]node_modules[\\/](framer-motion|lottie-react|@lottiefiles)[\\/]/,
            chunks: 'all',
            priority: 25,
            enforce: true,
          },
          
          // Chart libraries
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](recharts|chart\.js|d3|victory)[\\/]/,
            chunks: 'all',
            priority: 25,
            enforce: true,
          },
          
          // Socket and real-time libraries
          realtime: {
            name: 'realtime',
            test: /[\\/]node_modules[\\/](socket\.io-client|ws|@pusher)[\\/]/,
            chunks: 'all',
            priority: 25,
            enforce: true,
          },
          
          // Utility libraries
          utilities: {
            name: 'utilities',
            test: /[\\/]node_modules[\\/](lodash|ramda|date-fns|moment|dayjs)[\\/]/,
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          
          // Form and validation libraries
          forms: {
            name: 'forms',
            test: /[\\/]node_modules[\\/](react-hook-form|formik|yup|joi|zod)[\\/]/,
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          
          // State management
          state: {
            name: 'state',
            test: /[\\/]node_modules[\\/](@reduxjs\/toolkit|redux|zustand|jotai|recoil)[\\/]/,
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          
          // Common vendor chunks
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 10,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          
          // Application common chunks
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
      
      // Module and chunk ID optimization for better caching
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
      
      // Enable minimization
      minimize: true,
      
      // Optimize runtime chunk
      runtimeChunk: {
        name: 'runtime',
      },
      
      // Remove empty chunks
      removeEmptyChunks: true,
      
      // Merge duplicate chunks
      mergeDuplicateChunks: true,
      
      // Flag dependent chunks
      flagIncludedChunks: true,
      
      // Optimize side effects
      sideEffects: false,
    };

    // Add bundle analyzer if enabled
    if (this.config.enableAnalyzer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins = config.plugins || [];
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-analysis.html',
          generateStatsFile: true,
          statsFilename: 'bundle-stats.json',
        })
      );
    }

    return config;
  }

  /**
   * Get performance-optimized resolve configuration
   */
  getResolveOptimization() {
    return {
      alias: {
        '@': path.resolve(process.cwd()),
        '~': path.resolve(process.cwd()),
        // Optimize common library imports
        'react': path.resolve('./node_modules/react'),
        'react-dom': path.resolve('./node_modules/react-dom'),
      },
      extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
      // Reduce resolve attempts
      symlinks: false,
      // Optimize module resolution
      modules: [
        path.resolve('./node_modules'),
        'node_modules'
      ],
      // Cache resolve results
      cache: true,
    };
  }

  /**
   * Generate prefetch/preload hints for critical resources
   */
  generateResourceHints() {
    const hints = [];
    
    if (this.config.enablePrefetch) {
      hints.push(
        // Prefetch critical chunks
        { rel: 'prefetch', href: '/_next/static/chunks/framework.js' },
        { rel: 'prefetch', href: '/_next/static/chunks/main.js' },
        { rel: 'prefetch', href: '/_next/static/chunks/vendor.js' },
        
        // Preload critical fonts
        { rel: 'preload', href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
        
        // DNS prefetch for external resources
        { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: '//cdn.jsdelivr.net' },
      );
    }
    
    return hints;
  }

  /**
   * Generate bundle performance metrics
   */
  async generateBundleReport() {
    try {
      const fs = require('fs').promises;
      const bundleStatsPath = path.join(process.cwd(), 'bundle-stats.json');
      
      if (await fs.access(bundleStatsPath).then(() => true).catch(() => false)) {
        const stats = JSON.parse(await fs.readFile(bundleStatsPath, 'utf-8'));
        
        const report = {
          totalSize: this.calculateTotalSize(stats),
          chunkCount: stats.chunks?.length || 0,
          assetCount: stats.assets?.length || 0,
          largestChunks: this.getLargestChunks(stats),
          duplicatedModules: this.findDuplicatedModules(stats),
          recommendations: this.generateRecommendations(stats),
          timestamp: new Date().toISOString(),
        };
        
        await fs.writeFile(
          path.join(process.cwd(), 'bundle-performance-report.json'),
          JSON.stringify(report, null, 2)
        );
        
        return report;
      }
    } catch (error) {
      console.warn('Could not generate bundle report:', error);
      return null;
    }
  }

  private calculateTotalSize(stats: any): number {
    return stats.assets?.reduce((total: number, asset: any) => total + (asset.size || 0), 0) || 0;
  }

  private getLargestChunks(stats: any) {
    return stats.chunks
      ?.sort((a: any, b: any) => (b.size || 0) - (a.size || 0))
      .slice(0, 10)
      .map((chunk: any) => ({
        name: chunk.names?.[0] || chunk.id,
        size: chunk.size,
        modules: chunk.modules?.length || 0,
      })) || [];
  }

  private findDuplicatedModules(stats: any) {
    const moduleMap = new Map();
    
    stats.modules?.forEach((module: any) => {
      const name = module.name || module.identifier;
      if (moduleMap.has(name)) {
        moduleMap.set(name, moduleMap.get(name) + 1);
      } else {
        moduleMap.set(name, 1);
      }
    });
    
    return Array.from(moduleMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([name, count]) => ({ name, count }));
  }

  private generateRecommendations(stats: any) {
    const recommendations = [];
    const totalSize = this.calculateTotalSize(stats);
    
    if (totalSize > this.config.chunkSizeThreshold! * 3) {
      recommendations.push('Consider implementing more aggressive code splitting');
    }
    
    if (stats.chunks?.length > this.config.maxChunks!) {
      recommendations.push('Too many chunks - consider consolidating smaller chunks');
    }
    
    const duplicated = this.findDuplicatedModules(stats);
    if (duplicated.length > 0) {
      recommendations.push(`Found ${duplicated.length} duplicated modules - optimize imports`);
    }
    
    return recommendations;
  }
}

/**
 * Default bundle optimizer instance
 */
export const bundleOptimizer = new BundleOptimizer();

/**
 * Helper function to apply bundle optimization to Next.js config
 */
export function withBundleOptimization(nextConfig: any) {
  return {
    ...nextConfig,
    webpack: (config: Configuration, context: { dev: boolean; isServer: boolean }) => {
      // Apply existing webpack config if present
      if (nextConfig.webpack) {
        config = nextConfig.webpack(config, context);
      }
      
      // Apply bundle optimization
      config = bundleOptimizer.getWebpackOptimization(config, context);
      
      // Apply resolve optimization
      config.resolve = {
        ...config.resolve,
        ...bundleOptimizer.getResolveOptimization(),
      };
      
      return config;
    },
  };
}

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  /**
   * Track bundle loading performance
   */
  trackBundleLoad: (chunkName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const start = performance.now();
      return () => {
        const end = performance.now();
        const duration = end - start;
        
        // Report to analytics
        if ('gtag' in window) {
          (window as any).gtag('event', 'bundle_load', {
            event_category: 'performance',
            event_label: chunkName,
            value: Math.round(duration),
          });
        }
        
        console.info(`Bundle ${chunkName} loaded in ${duration.toFixed(2)}ms`);
      };
    }
    return () => {};
  },
  
  /**
   * Monitor Core Web Vitals
   */
  initCoreWebVitals: () => {
    if (typeof window !== 'undefined') {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.info('LCP:', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay
      new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0];
        console.info('FID:', firstInput.processingStart - firstInput.startTime);
      }).observe({ entryTypes: ['first-input'] });
      
      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        console.info('CLS:', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    }
  },
};