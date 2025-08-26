import { PrismaClient } from '@prisma/client';
import { createLogger } from '@/lib/logger';
import { apiCache, CacheKeys } from './cache-manager';

const logger = createLogger('query-optimizer');

interface QueryMetrics {
  queryId: string;
  query: string;
  executionTime: number;
  rowsReturned: number;
  cacheHit: boolean;
  timestamp: Date;
}

interface QueryOptimizationConfig {
  enableQueryCaching: boolean;
  enableQueryMetrics: boolean;
  slowQueryThreshold: number; // milliseconds
  cacheableQueryTypes: string[];
  defaultCacheTTL: number;
  maxResultSetSize: number;
}

/**
 * Advanced Query Optimizer for Prisma ORM
 * Provides intelligent caching, performance monitoring, and query optimization
 */
export class QueryOptimizer {
  private metrics: QueryMetrics[] = [];
  private config: QueryOptimizationConfig;
  private queryPatterns: Map<string, number> = new Map();

  constructor(config: Partial<QueryOptimizationConfig> = {}) {
    this.config = {
      enableQueryCaching: config.enableQueryCaching ?? true,
      enableQueryMetrics: config.enableQueryMetrics ?? true,
      slowQueryThreshold: config.slowQueryThreshold ?? 1000,
      cacheableQueryTypes: config.cacheableQueryTypes ?? [
        'findMany', 'findUnique', 'findFirst', 'count', 'aggregate'
      ],
      defaultCacheTTL: config.defaultCacheTTL ?? 300, // 5 minutes
      maxResultSetSize: config.maxResultSetSize ?? 10000
    };
  }

  /**
   * Optimized Prisma query wrapper with caching and metrics
   */
  async executeQuery<T>(
    queryId: string,
    queryFn: () => Promise<T>,
    options: {
      cacheable?: boolean;
      cacheTTL?: number;
      skipCache?: boolean;
      useReadReplica?: boolean;
    } = {}
  ): Promise<T> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(queryId);
    
    // Check cache first if enabled
    if (this.config.enableQueryCaching && options.cacheable !== false && !options.skipCache) {
      const cachedResult = await apiCache.get<T>(cacheKey);
      if (cachedResult !== null) {
        this.recordMetrics({
          queryId,
          query: queryId,
          executionTime: performance.now() - startTime,
          rowsReturned: Array.isArray(cachedResult) ? cachedResult.length : 1,
          cacheHit: true,
          timestamp: new Date()
        });
        return cachedResult;
      }
    }

    try {
      // Execute the actual query
      const result = await queryFn();
      const executionTime = performance.now() - startTime;
      const rowCount = Array.isArray(result) ? result.length : 1;

      // Cache the result if conditions are met
      if (this.shouldCacheResult(result, executionTime, options)) {
        const ttl = options.cacheTTL || this.config.defaultCacheTTL;
        await apiCache.set(cacheKey, result, ttl);
      }

      // Record metrics
      this.recordMetrics({
        queryId,
        query: queryId,
        executionTime,
        rowsReturned: rowCount,
        cacheHit: false,
        timestamp: new Date()
      });

      // Track query patterns
      this.trackQueryPattern(queryId);

      // Log slow queries
      if (executionTime > this.config.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          queryId,
          executionTime,
          rowCount,
          threshold: this.config.slowQueryThreshold
        });
      }

      return result;
    } catch (error) {
      logger.error('Query execution failed', { queryId, error });
      throw error;
    }
  }

  /**
   * Batch query optimization
   * Executes multiple queries in parallel with intelligent batching
   */
  async executeBatch<T>(
    queries: Array<{
      id: string;
      fn: () => Promise<T>;
      options?: { cacheable?: boolean; cacheTTL?: number };
    }>
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const uncachedQueries: typeof queries = [];

    // First pass: check cache for all queries
    if (this.config.enableQueryCaching) {
      const cacheKeys = queries.map(q => this.generateCacheKey(q.id));
      const cachedResults = await apiCache.mget<T>(cacheKeys);

      queries.forEach((query, index) => {
        const cached = cachedResults.get(cacheKeys[index]);
        if (cached !== null) {
          results.set(query.id, cached);
        } else {
          uncachedQueries.push(query);
        }
      });
    } else {
      uncachedQueries.push(...queries);
    }

    // Second pass: execute uncached queries in parallel
    if (uncachedQueries.length > 0) {
      const promises = uncachedQueries.map(async (query) => {
        const result = await this.executeQuery(query.id, query.fn, {
          ...query.options,
          skipCache: true // We already checked cache above
        });
        return { id: query.id, result };
      });

      const queryResults = await Promise.all(promises);
      queryResults.forEach(({ id, result }) => {
        results.set(id, result);
      });
    }

    return results;
  }

  /**
   * Optimized pagination with cursor-based approach
   */
  async paginateQuery<T>(
    baseQuery: any,
    options: {
      cursor?: any;
      take?: number;
      orderBy?: any;
      cacheKey?: string;
    } = {}
  ): Promise<{ data: T[]; nextCursor?: any; hasMore: boolean }> {
    const take = options.take || 20;
    const queryId = options.cacheKey || `paginated_query_${Date.now()}`;

    // Fetch one extra item to determine if there are more results
    const queryWithExtra = {
      ...baseQuery,
      take: take + 1,
      ...(options.cursor && { cursor: options.cursor, skip: 1 }),
      ...(options.orderBy && { orderBy: options.orderBy })
    };

    const result = await this.executeQuery(
      queryId,
      () => queryWithExtra,
      { cacheable: true, cacheTTL: 60 } // Short cache for pagination
    );

    const hasMore = result.length > take;
    const data = hasMore ? result.slice(0, take) : result;
    const nextCursor = hasMore ? data[data.length - 1] : undefined;

    return { data, nextCursor, hasMore };
  }

  /**
   * Query optimization suggestions based on collected metrics
   */
  getOptimizationSuggestions(): Array<{
    type: 'index' | 'query' | 'cache' | 'pagination';
    description: string;
    queryId?: string;
    impact: 'high' | 'medium' | 'low';
  }> {
    const suggestions: ReturnType<typeof this.getOptimizationSuggestions> = [];
    
    // Analyze slow queries
    const slowQueries = this.metrics
      .filter(m => m.executionTime > this.config.slowQueryThreshold)
      .reduce((acc, metric) => {
        acc.set(metric.queryId, (acc.get(metric.queryId) || 0) + 1);
        return acc;
      }, new Map<string, number>());

    slowQueries.forEach((count, queryId) => {
      if (count > 5) { // Frequently slow queries
        suggestions.push({
          type: 'index',
          description: `Consider adding database indexes for frequently slow query: ${queryId}`,
          queryId,
          impact: 'high'
        });
      }
    });

    // Analyze cache miss rates
    const queryStats = this.getQueryStatistics();
    Object.entries(queryStats).forEach(([queryId, stats]) => {
      if (stats.totalExecutions > 10 && stats.cacheHitRate < 0.5) {
        suggestions.push({
          type: 'cache',
          description: `Low cache hit rate (${(stats.cacheHitRate * 100).toFixed(1)}%) for ${queryId}`,
          queryId,
          impact: 'medium'
        });
      }
    });

    // Analyze large result sets
    const largeResultSets = this.metrics
      .filter(m => m.rowsReturned > 1000)
      .map(m => m.queryId);

    [...new Set(largeResultSets)].forEach(queryId => {
      suggestions.push({
        type: 'pagination',
        description: `Consider implementing pagination for large result set query: ${queryId}`,
        queryId,
        impact: 'medium'
      });
    });

    return suggestions;
  }

  /**
   * Get comprehensive query statistics
   */
  getQueryStatistics(): Record<string, {
    totalExecutions: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    averageRowsReturned: number;
    slowExecutions: number;
  }> {
    const stats: Record<string, any> = {};

    this.metrics.forEach(metric => {
      if (!stats[metric.queryId]) {
        stats[metric.queryId] = {
          totalExecutions: 0,
          totalExecutionTime: 0,
          cacheHits: 0,
          totalRows: 0,
          slowExecutions: 0
        };
      }

      const stat = stats[metric.queryId];
      stat.totalExecutions++;
      stat.totalExecutionTime += metric.executionTime;
      stat.totalRows += metric.rowsReturned;
      
      if (metric.cacheHit) {
        stat.cacheHits++;
      }
      
      if (metric.executionTime > this.config.slowQueryThreshold) {
        stat.slowExecutions++;
      }
    });

    // Calculate derived metrics
    Object.keys(stats).forEach(queryId => {
      const stat = stats[queryId];
      stat.averageExecutionTime = stat.totalExecutionTime / stat.totalExecutions;
      stat.cacheHitRate = stat.cacheHits / stat.totalExecutions;
      stat.averageRowsReturned = stat.totalRows / stat.totalExecutions;
    });

    return stats;
  }

  /**
   * Clear query metrics and reset counters
   */
  clearMetrics(): void {
    this.metrics = [];
    this.queryPatterns.clear();
    logger.info('Query metrics cleared');
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): {
    metrics: QueryMetrics[];
    statistics: ReturnType<typeof this.getQueryStatistics>;
    suggestions: ReturnType<typeof this.getOptimizationSuggestions>;
    config: QueryOptimizationConfig;
  } {
    return {
      metrics: [...this.metrics],
      statistics: this.getQueryStatistics(),
      suggestions: this.getOptimizationSuggestions(),
      config: { ...this.config }
    };
  }

  private generateCacheKey(queryId: string): string {
    return CacheKeys.apiResponse('query', queryId);
  }

  private shouldCacheResult<T>(
    result: T,
    executionTime: number,
    options: { cacheable?: boolean }
  ): boolean {
    if (options.cacheable === false) return false;
    if (!this.config.enableQueryCaching) return false;
    
    const resultSize = Array.isArray(result) ? result.length : 1;
    if (resultSize > this.config.maxResultSetSize) return false;
    
    // Cache if query took longer than threshold (expensive queries benefit most from caching)
    return executionTime > 100 || resultSize < 1000;
  }

  private recordMetrics(metrics: QueryMetrics): void {
    if (!this.config.enableQueryMetrics) return;
    
    this.metrics.push(metrics);
    
    // Keep only recent metrics (sliding window)
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  private trackQueryPattern(queryId: string): void {
    const count = this.queryPatterns.get(queryId) || 0;
    this.queryPatterns.set(queryId, count + 1);
  }
}

/**
 * Pre-built optimized query functions for common operations
 */
export class OptimizedQueries {
  private optimizer: QueryOptimizer;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient, optimizer?: QueryOptimizer) {
    this.prisma = prisma;
    this.optimizer = optimizer || new QueryOptimizer();
  }

  /**
   * Optimized user lookup with related data
   */
  async getUserWithStats(userId: string, includeStats = true) {
    return this.optimizer.executeQuery(
      `user_with_stats_${userId}`,
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            stats: includeStats,
            wisdomCoin: true,
            ladderRank: true
          }
        });
        return user;
      },
      { cacheable: true, cacheTTL: 300 }
    );
  }

  /**
   * Optimized course progress lookup
   */
  async getUserProgress(userId: string, courseId?: string) {
    const queryId = courseId 
      ? `user_progress_${userId}_${courseId}`
      : `user_progress_${userId}`;

    return this.optimizer.executeQuery(
      queryId,
      async () => {
        if (courseId) {
          return this.prisma.userProgress.findUnique({
            where: {
              userId_courseId: { userId, courseId }
            },
            include: {
              course: {
                select: { title: true, level: true, thumbnailUrl: true }
              }
            }
          });
        } else {
          return this.prisma.userProgress.findMany({
            where: { userId },
            include: {
              course: {
                select: { id: true, title: true, level: true, thumbnailUrl: true }
              }
            },
            orderBy: { lastAccessed: 'desc' }
          });
        }
      },
      { cacheable: true, cacheTTL: 180 }
    );
  }

  /**
   * Optimized leaderboard queries with pagination
   */
  async getLeaderboard(
    category: string,
    period: string,
    options: { take?: number; cursor?: string } = {}
  ) {
    const queryId = `leaderboard_${category}_${period}`;
    
    return this.optimizer.paginateQuery(
      this.prisma.leaderboardEntry.findMany({
        where: { category, period },
        include: {
          user: {
            select: { id: true, username: true, name: true, avatar: true, level: true }
          }
        },
        orderBy: { rank: 'asc' }
      }),
      { ...options, cacheKey: queryId }
    );
  }

  /**
   * Optimized course content with assessments
   */
  async getCourseWithContent(courseId: string) {
    return this.optimizer.executeQuery(
      `course_content_${courseId}`,
      async () => {
        return this.prisma.course.findUnique({
          where: { id: courseId, isActive: true },
          include: {
            assessments: {
              where: { isActive: true },
              select: {
                id: true,
                title: true,
                difficulty: true,
                passThreshold: true,
                maxAttempts: true
              }
            }
          }
        });
      },
      { cacheable: true, cacheTTL: 1800 } // 30 minutes for course content
    );
  }

  /**
   * Optimized batch user lookup
   */
  async getUsersBatch(userIds: string[]) {
    const queries = userIds.map(userId => ({
      id: `user_${userId}`,
      fn: () => this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          level: true,
          isVip: true,
          stats: {
            select: {
              totalHands: true,
              winRate: true,
              totalEarnings: true
            }
          }
        }
      }),
      options: { cacheable: true, cacheTTL: 600 }
    }));

    return this.optimizer.executeBatch(queries);
  }

  /**
   * Optimized AI companion queries
   */
  async getUserCompanions(userId: string, includeState = false) {
    return this.optimizer.executeQuery(
      `user_companions_${userId}`,
      async () => {
        return this.prisma.userCompanion.findMany({
          where: { userId, isActive: true },
          include: {
            companion: {
              select: {
                id: true,
                name: true,
                personality: true,
                rarity: true,
                avatarUrl: true
              }
            },
            ...(includeState && {
              conversations: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  createdAt: true,
                  messageType: true,
                  content: true
                }
              }
            })
          },
          orderBy: { lastInteraction: 'desc' }
        });
      },
      { cacheable: true, cacheTTL: 240 }
    );
  }
}

// Export singleton optimizer with default configuration
export const queryOptimizer = new QueryOptimizer({
  enableQueryCaching: true,
  enableQueryMetrics: true,
  slowQueryThreshold: 1000,
  defaultCacheTTL: 300,
  maxResultSetSize: 10000
});

// Common query optimization patterns
export const QueryPatterns = {
  /**
   * Generates optimized where clause for text search
   */
  textSearch: (searchTerm: string, fields: string[]) => ({
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const
      }
    }))
  }),

  /**
   * Generates optimized pagination parameters
   */
  pagination: (page: number, limit: number) => ({
    skip: (page - 1) * limit,
    take: limit
  }),

  /**
   * Generates optimized date range filter
   */
  dateRange: (field: string, start: Date, end: Date) => ({
    [field]: {
      gte: start,
      lte: end
    }
  }),

  /**
   * Generates optimized select for minimal data transfer
   */
  minimalUserSelect: {
    id: true,
    username: true,
    name: true,
    avatar: true,
    level: true
  },

  /**
   * Generates optimized include for user stats
   */
  userStatsInclude: {
    stats: {
      select: {
        totalHands: true,
        winRate: true,
        totalEarnings: true,
        vpip: true,
        pfr: true
      }
    }
  }
};