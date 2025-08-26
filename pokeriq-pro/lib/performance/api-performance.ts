import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { apiCache, CacheKeys } from './cache-manager';
import { queryOptimizer } from './query-optimizer';

const logger = createLogger('api-performance');

interface APIMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  responseSize: number;
  userAgent?: string;
  userId?: string;
  ip?: string;
  timestamp: Date;
  errorMessage?: string;
  cacheHit?: boolean;
  queryCount?: number;
}

interface PerformanceConfig {
  enableMetrics: boolean;
  enableCaching: boolean;
  enableRateLimiting: boolean;
  slowRequestThreshold: number;
  cacheDefaultTTL: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  enableCompression: boolean;
  enableCORS: boolean;
  corsOrigins: string[];
}

interface RateLimitInfo {
  requests: number;
  windowStart: number;
  blocked: boolean;
}

/**
 * Advanced API Performance Monitor
 * Provides comprehensive monitoring, caching, and optimization for API endpoints
 */
export class APIPerformanceMonitor {
  private metrics: APIMetrics[] = [];
  private config: PerformanceConfig;
  private rateLimitMap: Map<string, RateLimitInfo> = new Map();
  private endpointStats: Map<string, {
    totalRequests: number;
    totalResponseTime: number;
    errorCount: number;
    cacheHitCount: number;
  }> = new Map();

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableMetrics: config.enableMetrics ?? true,
      enableCaching: config.enableCaching ?? true,
      enableRateLimiting: config.enableRateLimiting ?? true,
      slowRequestThreshold: config.slowRequestThreshold ?? 1000,
      cacheDefaultTTL: config.cacheDefaultTTL ?? 300,
      rateLimitWindow: config.rateLimitWindow ?? 60000, // 1 minute
      rateLimitMax: config.rateLimitMax ?? 100,
      enableCompression: config.enableCompression ?? true,
      enableCORS: config.enableCORS ?? true,
      corsOrigins: config.corsOrigins ?? ['*']
    };

    // Clean up old rate limit entries periodically
    setInterval(() => this.cleanupRateLimit(), 60000);
  }

  /**
   * Middleware wrapper for Next.js API routes
   * Provides automatic performance monitoring, caching, and rate limiting
   */
  withPerformanceMonitoring<T = any>(
    handler: (req: NextRequest) => Promise<NextResponse<T>>,
    options: {
      cacheable?: boolean;
      cacheTTL?: number;
      cacheKeyBuilder?: (req: NextRequest) => string;
      rateLimit?: { max: number; window: number };
      skipRateLimit?: (req: NextRequest) => boolean;
      enableMetrics?: boolean;
    } = {}
  ) {
    return async (req: NextRequest): Promise<NextResponse<T>> => {
      const startTime = performance.now();
      const endpoint = this.getEndpointPath(req);
      const clientIP = this.getClientIP(req);
      const userId = this.getUserId(req);

      try {
        // Rate limiting check
        if (this.config.enableRateLimiting && 
            !(options.skipRateLimit && options.skipRateLimit(req))) {
          const rateLimit = options.rateLimit || {
            max: this.config.rateLimitMax,
            window: this.config.rateLimitWindow
          };
          
          const rateLimitKey = `${clientIP}:${endpoint}`;
          const rateLimitResult = this.checkRateLimit(rateLimitKey, rateLimit);
          
          if (rateLimitResult.blocked) {
            const response = NextResponse.json(
              { error: 'Rate limit exceeded', retryAfter: rateLimit.window / 1000 },
              { status: 429 }
            );
            response.headers.set('X-RateLimit-Limit', rateLimit.max.toString());
            response.headers.set('X-RateLimit-Remaining', '0');
            response.headers.set('X-RateLimit-Reset', 
              Math.ceil((rateLimitResult.windowStart + rateLimit.window) / 1000).toString());
            
            this.recordMetrics({
              endpoint,
              method: req.method,
              statusCode: 429,
              responseTime: performance.now() - startTime,
              responseSize: 0,
              ip: clientIP,
              userId,
              timestamp: new Date(),
              errorMessage: 'Rate limit exceeded'
            });
            
            return response;
          }
        }

        // Check cache if enabled
        if (this.config.enableCaching && options.cacheable && req.method === 'GET') {
          const cacheKey = options.cacheKeyBuilder 
            ? options.cacheKeyBuilder(req)
            : this.generateCacheKey(req);
          
          const cachedResponse = await apiCache.get<any>(cacheKey);
          if (cachedResponse) {
            const response = NextResponse.json(cachedResponse);
            response.headers.set('X-Cache', 'HIT');
            response.headers.set('X-Cache-Key', cacheKey);
            
            this.recordMetrics({
              endpoint,
              method: req.method,
              statusCode: 200,
              responseTime: performance.now() - startTime,
              responseSize: JSON.stringify(cachedResponse).length,
              ip: clientIP,
              userId,
              timestamp: new Date(),
              cacheHit: true
            });
            
            return response;
          }
        }

        // Execute the actual handler
        const response = await handler(req);
        const responseTime = performance.now() - startTime;
        const responseSize = this.getResponseSize(response);

        // Cache successful GET responses if enabled
        if (this.config.enableCaching && 
            options.cacheable && 
            req.method === 'GET' && 
            response.status === 200) {
          const cacheKey = options.cacheKeyBuilder 
            ? options.cacheKeyBuilder(req)
            : this.generateCacheKey(req);
          
          const responseData = await response.clone().json();
          const ttl = options.cacheTTL || this.config.cacheDefaultTTL;
          await apiCache.set(cacheKey, responseData, ttl);
          
          response.headers.set('X-Cache', 'MISS');
          response.headers.set('X-Cache-TTL', ttl.toString());
        }

        // Add performance headers
        response.headers.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);
        response.headers.set('X-Powered-By', 'PokerIQ Pro API');
        
        // Add CORS headers if enabled
        if (this.config.enableCORS) {
          this.addCORSHeaders(response, req);
        }

        // Record metrics
        this.recordMetrics({
          endpoint,
          method: req.method,
          statusCode: response.status,
          responseTime,
          responseSize,
          ip: clientIP,
          userId,
          timestamp: new Date(),
          cacheHit: false
        });

        return response;

      } catch (error) {
        const responseTime = performance.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        logger.error('API handler error', {
          endpoint,
          method: req.method,
          error: errorMessage,
          responseTime,
          userId,
          ip: clientIP
        });

        this.recordMetrics({
          endpoint,
          method: req.method,
          statusCode: 500,
          responseTime,
          responseSize: 0,
          ip: clientIP,
          userId,
          timestamp: new Date(),
          errorMessage
        });

        const errorResponse = NextResponse.json(
          { 
            error: process.env.NODE_ENV === 'production' 
              ? 'Internal server error' 
              : errorMessage,
            requestId: this.generateRequestId()
          },
          { status: 500 }
        );

        errorResponse.headers.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);
        return errorResponse;
      }
    };
  }

  /**
   * Health check middleware for monitoring system health
   */
  healthCheck() {
    return async (): Promise<NextResponse> => {
      const startTime = performance.now();
      
      try {
        // Check cache health
        const cacheHealth = await apiCache.healthCheck();
        
        // Check database health (via query optimizer)
        const queryStats = queryOptimizer.getQueryStatistics();
        
        // Get system metrics
        const systemHealth = this.getSystemHealth();
        
        const responseTime = performance.now() - startTime;
        
        const healthData = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          responseTime: `${responseTime.toFixed(2)}ms`,
          cache: cacheHealth,
          database: {
            totalQueries: Object.keys(queryStats).length,
            averageQueryTime: this.calculateAverageQueryTime(queryStats)
          },
          api: systemHealth,
          version: process.env.npm_package_version || '1.0.0'
        };

        return NextResponse.json(healthData);
      } catch (error) {
        const responseTime = performance.now() - startTime;
        logger.error('Health check failed', { error });
        
        return NextResponse.json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          responseTime: `${responseTime.toFixed(2)}ms`,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 503 });
      }
    };
  }

  /**
   * Get comprehensive API performance statistics
   */
  getPerformanceStats(): {
    overview: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      cacheHitRate: number;
      requestsPerMinute: number;
    };
    endpoints: Array<{
      endpoint: string;
      method: string;
      requests: number;
      averageResponseTime: number;
      errorRate: number;
      cacheHitRate: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
    }>;
    slowRequests: APIMetrics[];
    errors: APIMetrics[];
    rateLimits: Array<{
      key: string;
      requests: number;
      blocked: boolean;
    }>;
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
    
    // Overview statistics
    const totalRequests = recentMetrics.length;
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    
    // Group by endpoint
    const endpointGroups = new Map<string, APIMetrics[]>();
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      endpointGroups.get(key)!.push(metric);
    });

    // Calculate endpoint statistics
    const endpoints = Array.from(endpointGroups.entries()).map(([key, metrics]) => {
      const [method, endpoint] = key.split(' ', 2);
      const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
      const errors = metrics.filter(m => m.statusCode >= 400).length;
      const cacheHits = metrics.filter(m => m.cacheHit).length;
      
      return {
        endpoint,
        method,
        requests: metrics.length,
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        errorRate: errors / metrics.length,
        cacheHitRate: cacheHits / metrics.length,
        p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
        p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0
      };
    });

    return {
      overview: {
        totalRequests,
        averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
        errorRate: totalRequests > 0 ? errorCount / totalRequests : 0,
        cacheHitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
        requestsPerMinute: totalRequests / 60 // Last hour average
      },
      endpoints: endpoints.sort((a, b) => b.requests - a.requests),
      slowRequests: recentMetrics
        .filter(m => m.responseTime > this.config.slowRequestThreshold)
        .sort((a, b) => b.responseTime - a.responseTime)
        .slice(0, 10),
      errors: recentMetrics
        .filter(m => m.statusCode >= 400)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10),
      rateLimits: Array.from(this.rateLimitMap.entries()).map(([key, info]) => ({
        key,
        requests: info.requests,
        blocked: info.blocked
      }))
    };
  }

  /**
   * Clear accumulated metrics and reset counters
   */
  clearMetrics(): void {
    this.metrics = [];
    this.endpointStats.clear();
    this.rateLimitMap.clear();
    logger.info('API performance metrics cleared');
  }

  private checkRateLimit(key: string, limit: { max: number; window: number }): RateLimitInfo {
    const now = Date.now();
    let rateLimitInfo = this.rateLimitMap.get(key);
    
    if (!rateLimitInfo || now - rateLimitInfo.windowStart > limit.window) {
      // New window or expired window
      rateLimitInfo = {
        requests: 1,
        windowStart: now,
        blocked: false
      };
    } else {
      // Within current window
      rateLimitInfo.requests++;
    }
    
    rateLimitInfo.blocked = rateLimitInfo.requests > limit.max;
    this.rateLimitMap.set(key, rateLimitInfo);
    
    return rateLimitInfo;
  }

  private cleanupRateLimit(): void {
    const now = Date.now();
    const maxAge = Math.max(this.config.rateLimitWindow * 2, 300000); // At least 5 minutes
    
    for (const [key, info] of this.rateLimitMap.entries()) {
      if (now - info.windowStart > maxAge) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  private recordMetrics(metrics: APIMetrics): void {
    if (!this.config.enableMetrics) return;
    
    this.metrics.push(metrics);
    
    // Keep only recent metrics (last 24 hours)
    const dayAgo = Date.now() - 86400000;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > dayAgo);
    
    // Update endpoint stats
    const endpointKey = `${metrics.method} ${metrics.endpoint}`;
    let stats = this.endpointStats.get(endpointKey);
    if (!stats) {
      stats = {
        totalRequests: 0,
        totalResponseTime: 0,
        errorCount: 0,
        cacheHitCount: 0
      };
    }
    
    stats.totalRequests++;
    stats.totalResponseTime += metrics.responseTime;
    if (metrics.statusCode >= 400) stats.errorCount++;
    if (metrics.cacheHit) stats.cacheHitCount++;
    
    this.endpointStats.set(endpointKey, stats);
    
    // Log slow requests
    if (metrics.responseTime > this.config.slowRequestThreshold) {
      logger.warn('Slow API request detected', {
        endpoint: metrics.endpoint,
        method: metrics.method,
        responseTime: metrics.responseTime,
        userId: metrics.userId
      });
    }
  }

  private generateCacheKey(req: NextRequest): string {
    const url = new URL(req.url);
    const params = Array.from(url.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    
    return CacheKeys.apiResponse(url.pathname, params || undefined);
  }

  private getEndpointPath(req: NextRequest): string {
    const url = new URL(req.url);
    return url.pathname.replace(/^\/api/, '') || '/';
  }

  private getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           req.headers.get('x-real-ip') ||
           req.ip ||
           'unknown';
  }

  private getUserId(req: NextRequest): string | undefined {
    // Extract user ID from JWT token or session
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        // This would decode JWT token in real implementation
        // For now, return undefined
        return undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private getResponseSize(response: NextResponse): number {
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
    // Estimate size if not available
    return 0;
  }

  private addCORSHeaders(response: NextResponse, req: NextRequest): void {
    const origin = req.headers.get('origin');
    const allowedOrigins = this.config.corsOrigins;
    
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSystemHealth() {
    const stats = this.endpointStats;
    const totalEndpoints = stats.size;
    const healthyEndpoints = Array.from(stats.values()).filter(s => {
      const errorRate = s.errorCount / s.totalRequests;
      return errorRate < 0.05; // Less than 5% error rate
    }).length;
    
    return {
      totalEndpoints,
      healthyEndpoints,
      healthPercentage: totalEndpoints > 0 ? (healthyEndpoints / totalEndpoints) * 100 : 100
    };
  }

  private calculateAverageQueryTime(queryStats: Record<string, any>): number {
    const times = Object.values(queryStats).map((stat: any) => stat.averageExecutionTime);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
}

// Export singleton with default configuration
export const apiPerformanceMonitor = new APIPerformanceMonitor({
  enableMetrics: true,
  enableCaching: true,
  enableRateLimiting: true,
  slowRequestThreshold: 1000,
  cacheDefaultTTL: 300,
  rateLimitWindow: 60000,
  rateLimitMax: 100
});

// Convenient decorators for common API patterns
export const APIMiddleware = {
  /**
   * Cached GET endpoint with default settings
   */
  cached: (handler: (req: NextRequest) => Promise<NextResponse>, ttl = 300) =>
    apiPerformanceMonitor.withPerformanceMonitoring(handler, {
      cacheable: true,
      cacheTTL: ttl,
      enableMetrics: true
    }),

  /**
   * Rate-limited endpoint with custom limits
   */
  rateLimited: (
    handler: (req: NextRequest) => Promise<NextResponse>,
    options: { max: number; window: number }
  ) =>
    apiPerformanceMonitor.withPerformanceMonitoring(handler, {
      rateLimit: options,
      enableMetrics: true
    }),

  /**
   * Standard endpoint with monitoring
   */
  monitored: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    apiPerformanceMonitor.withPerformanceMonitoring(handler, {
      enableMetrics: true
    }),

  /**
   * Public endpoint with CORS and caching
   */
  public: (handler: (req: NextRequest) => Promise<NextResponse>, ttl = 300) =>
    apiPerformanceMonitor.withPerformanceMonitoring(handler, {
      cacheable: true,
      cacheTTL: ttl,
      enableMetrics: true,
      skipRateLimit: () => false // Apply rate limiting
    }),

  /**
   * Health check endpoint
   */
  health: apiPerformanceMonitor.healthCheck()
};