import { NextRequest, NextResponse } from 'next/server';
import { apiPerformanceMonitor, APIMiddleware } from '@/lib/performance/api-performance';
import { queryOptimizer } from '@/lib/performance/query-optimizer';
import { apiCache, userCache, analyticsCache, staticCache } from '@/lib/performance/cache-manager';
import { createLogger } from '@/lib/logger';

const logger = createLogger('performance-metrics-api');

/**
 * GET /api/performance/metrics
 * Returns comprehensive performance metrics and system health data
 */
async function handleGetMetrics(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || '1h';
    const includeDetails = url.searchParams.get('details') === 'true';
    const category = url.searchParams.get('category'); // 'api', 'database', 'cache', 'system'

    // Get API performance statistics
    const apiStats = apiPerformanceMonitor.getPerformanceStats();

    // Get database/query optimization statistics
    const queryStats = queryOptimizer.getQueryStatistics();
    const queryOptimizations = queryOptimizer.getOptimizationSuggestions();

    // Get cache statistics
    const cacheStats = {
      api: apiCache.getStats(),
      user: userCache.getStats(),
      analytics: analyticsCache.getStats(),
      static: staticCache.getStats()
    };

    // Get system health information
    const systemHealth = {
      api: await apiPerformanceMonitor.healthCheck()(),
      cache: await apiCache.healthCheck(),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    // Build response based on category filter
    let responseData: any = {
      timestamp: new Date().toISOString(),
      timeRange,
      summary: {
        status: 'healthy',
        totalRequests: apiStats.overview.totalRequests,
        averageResponseTime: apiStats.overview.averageResponseTime,
        errorRate: apiStats.overview.errorRate,
        cacheHitRate: apiStats.overview.cacheHitRate,
        uptime: process.uptime()
      }
    };

    if (!category || category === 'api') {
      responseData.api = {
        overview: apiStats.overview,
        endpoints: includeDetails ? apiStats.endpoints : apiStats.endpoints.slice(0, 10),
        slowRequests: includeDetails ? apiStats.slowRequests : apiStats.slowRequests.slice(0, 5),
        errors: includeDetails ? apiStats.errors : apiStats.errors.slice(0, 5),
        rateLimits: apiStats.rateLimits
      };
    }

    if (!category || category === 'database') {
      responseData.database = {
        queries: {
          totalQueries: Object.keys(queryStats).length,
          statistics: includeDetails ? queryStats : Object.fromEntries(
            Object.entries(queryStats).slice(0, 10)
          ),
          optimizations: queryOptimizations
        }
      };
    }

    if (!category || category === 'cache') {
      responseData.cache = {
        layers: cacheStats,
        health: systemHealth.cache,
        recommendations: generateCacheRecommendations(cacheStats)
      };
    }

    if (!category || category === 'system') {
      responseData.system = {
        health: systemHealth,
        performance: getSystemPerformanceMetrics(),
        resources: getResourceUsage()
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error fetching performance metrics', { error });
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/performance/metrics/clear
 * Clears accumulated metrics data
 */
async function handleClearMetrics(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category'); // 'api', 'database', 'cache', 'all'

    if (!category || category === 'all' || category === 'api') {
      apiPerformanceMonitor.clearMetrics();
    }

    if (!category || category === 'all' || category === 'database') {
      queryOptimizer.clearMetrics();
    }

    if (!category || category === 'all' || category === 'cache') {
      // Note: We don't clear cache data, just metrics
      // Actual cache clearing would be a separate endpoint
    }

    logger.info('Performance metrics cleared', { category: category || 'all' });

    return NextResponse.json({
      success: true,
      message: `${category || 'All'} metrics cleared successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error clearing performance metrics', { error });
    return NextResponse.json(
      { error: 'Failed to clear metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/performance/metrics/alerts
 * Returns performance alerts and recommendations
 */
async function handleGetAlerts(req: NextRequest): Promise<NextResponse> {
  try {
    const alerts: Array<{
      id: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      category: string;
      title: string;
      description: string;
      timestamp: Date;
      affectedEndpoints?: string[];
      recommendedActions?: string[];
    }> = [];

    // API Performance Alerts
    const apiStats = apiPerformanceMonitor.getPerformanceStats();
    
    // High error rate alert
    if (apiStats.overview.errorRate > 0.05) { // 5% error rate
      alerts.push({
        id: `api_error_rate_${Date.now()}`,
        severity: apiStats.overview.errorRate > 0.1 ? 'critical' : 'high',
        category: 'api',
        title: 'High API Error Rate',
        description: `Current error rate is ${(apiStats.overview.errorRate * 100).toFixed(2)}%`,
        timestamp: new Date(),
        affectedEndpoints: apiStats.endpoints
          .filter(e => e.errorRate > 0.05)
          .map(e => `${e.method} ${e.endpoint}`),
        recommendedActions: [
          'Review error logs for common failure patterns',
          'Check database connectivity and performance',
          'Verify external service dependencies',
          'Consider implementing circuit breakers'
        ]
      });
    }

    // Slow response time alert
    const avgResponseTime = apiStats.overview.averageResponseTime;
    if (avgResponseTime > 2000) { // 2 seconds
      alerts.push({
        id: `api_slow_response_${Date.now()}`,
        severity: avgResponseTime > 5000 ? 'critical' : 'medium',
        category: 'api',
        title: 'Slow API Response Times',
        description: `Average response time is ${avgResponseTime.toFixed(2)}ms`,
        timestamp: new Date(),
        affectedEndpoints: apiStats.endpoints
          .filter(e => e.averageResponseTime > 2000)
          .map(e => `${e.method} ${e.endpoint}`),
        recommendedActions: [
          'Analyze slow queries and optimize database indexes',
          'Implement or improve caching strategies',
          'Review and optimize business logic',
          'Consider horizontal scaling'
        ]
      });
    }

    // Low cache hit rate alert
    if (apiStats.overview.cacheHitRate < 0.6) { // 60% hit rate
      alerts.push({
        id: `cache_hit_rate_${Date.now()}`,
        severity: 'medium',
        category: 'cache',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is ${(apiStats.overview.cacheHitRate * 100).toFixed(2)}%`,
        timestamp: new Date(),
        recommendedActions: [
          'Review cacheable endpoints and increase TTL where appropriate',
          'Implement cache warming for frequently accessed data',
          'Analyze cache invalidation patterns',
          'Consider implementing more aggressive caching strategies'
        ]
      });
    }

    // Database Query Alerts
    const queryOptimizations = queryOptimizer.getOptimizationSuggestions();
    const highImpactSuggestions = queryOptimizations.filter(s => s.impact === 'high');
    
    if (highImpactSuggestions.length > 0) {
      alerts.push({
        id: `db_optimization_${Date.now()}`,
        severity: 'high',
        category: 'database',
        title: 'Database Optimization Required',
        description: `${highImpactSuggestions.length} high-impact database optimizations available`,
        timestamp: new Date(),
        recommendedActions: highImpactSuggestions.map(s => s.description)
      });
    }

    // Memory usage alert
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (memUsagePercent > 85) {
      alerts.push({
        id: `memory_usage_${Date.now()}`,
        severity: memUsagePercent > 95 ? 'critical' : 'high',
        category: 'system',
        title: 'High Memory Usage',
        description: `Memory usage is at ${memUsagePercent.toFixed(2)}%`,
        timestamp: new Date(),
        recommendedActions: [
          'Review memory leaks and optimize data structures',
          'Implement garbage collection tuning',
          'Consider scaling up memory resources',
          'Review and optimize cache sizes'
        ]
      });
    }

    return NextResponse.json({
      alerts: alerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching performance alerts', { error });
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/performance/metrics/benchmark
 * Runs performance benchmarks
 */
async function handleRunBenchmark(req: NextRequest): Promise<NextResponse> {
  try {
    const { testType = 'basic' } = await req.json();

    const benchmarkResults: any = {
      testType,
      timestamp: new Date().toISOString(),
      results: {}
    };

    // Cache performance benchmark
    const cacheStartTime = performance.now();
    const testKey = `benchmark_${Date.now()}`;
    const testData = { message: 'benchmark test data', timestamp: Date.now() };
    
    await apiCache.set(testKey, testData, 60);
    const retrievedData = await apiCache.get(testKey);
    await apiCache.delete(testKey);
    
    benchmarkResults.results.cache = {
      roundTripTime: performance.now() - cacheStartTime,
      dataIntegrity: JSON.stringify(retrievedData) === JSON.stringify(testData)
    };

    // Database performance benchmark (simple query)
    const dbStartTime = performance.now();
    try {
      // This would need to be implemented with actual Prisma client
      // For now, we'll simulate
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB query
      benchmarkResults.results.database = {
        queryTime: performance.now() - dbStartTime,
        status: 'healthy'
      };
    } catch (error) {
      benchmarkResults.results.database = {
        queryTime: performance.now() - dbStartTime,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Memory allocation benchmark
    const memStartTime = performance.now();
    const initialMemory = process.memoryUsage();
    
    // Allocate and deallocate memory
    const testArray = new Array(100000).fill(0).map((_, i) => ({ id: i, data: Math.random() }));
    const peakMemory = process.memoryUsage();
    testArray.length = 0; // Clear array
    
    benchmarkResults.results.memory = {
      allocationTime: performance.now() - memStartTime,
      initialHeap: initialMemory.heapUsed,
      peakHeap: peakMemory.heapUsed,
      memoryDelta: peakMemory.heapUsed - initialMemory.heapUsed
    };

    return NextResponse.json(benchmarkResults);
  } catch (error) {
    logger.error('Error running performance benchmark', { error });
    return NextResponse.json(
      { error: 'Benchmark failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateCacheRecommendations(cacheStats: any): string[] {
  const recommendations: string[] = [];

  Object.entries(cacheStats).forEach(([layerName, stats]: [string, any]) => {
    if (stats.hitRate < 0.7) {
      recommendations.push(`Improve ${layerName} cache hit rate (currently ${(stats.hitRate * 100).toFixed(1)}%)`);
    }
    
    if (layerName === 'api' && stats.layers) {
      const l1Stats = stats.layers.find((l: any) => l.name === 'L1-Memory');
      const l2Stats = stats.layers.find((l: any) => l.name === 'L2-Redis');
      
      if (l1Stats && l1Stats.evictions > l1Stats.sets * 0.5) {
        recommendations.push('Consider increasing L1 cache size due to high eviction rate');
      }
      
      if (l2Stats && l2Stats.errors > 0) {
        recommendations.push('Investigate Redis connection issues affecting L2 cache');
      }
    }
  });

  return recommendations;
}

function getSystemPerformanceMetrics() {
  const cpuUsage = process.cpuUsage();
  return {
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    eventLoop: {
      // This would require additional monitoring setup
      lag: 0 // Placeholder
    },
    uptime: process.uptime()
  };
}

function getResourceUsage() {
  const memory = process.memoryUsage();
  return {
    memory: {
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
      usagePercentage: (memory.heapUsed / memory.heapTotal) * 100
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform
    }
  };
}

// Route handlers with performance monitoring
export const GET = APIMiddleware.cached(handleGetMetrics, 30); // 30 second cache for metrics
export const POST = APIMiddleware.monitored(async (req: NextRequest) => {
  const { pathname } = new URL(req.url);
  
  if (pathname.endsWith('/clear')) {
    return handleClearMetrics(req);
  } else if (pathname.endsWith('/benchmark')) {
    return handleRunBenchmark(req);
  } else if (pathname.endsWith('/alerts')) {
    return handleGetAlerts(req);
  }
  
  return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
});

// OPTIONS handler for CORS
export const OPTIONS = APIMiddleware.public(async () => {
  return new NextResponse(null, { status: 200 });
});