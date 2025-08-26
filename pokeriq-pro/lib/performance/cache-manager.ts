import { LRUCache } from 'lru-cache';
import { cache as redisCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cache-manager');

interface CacheConfig {
  l1MaxSize: number;
  l1TTL: number;
  l2TTL: number;
  enableL1: boolean;
  enableL2: boolean;
  enableCompression: boolean;
}

interface CacheStats {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  dbHits: number;
  totalRequests: number;
  hitRate: number;
  averageResponseTime: number;
}

interface CacheLayer {
  name: string;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getStats(): any;
}

/**
 * L1 Cache - In-Memory LRU Cache
 * Fast access, limited capacity, process-local
 */
class L1Cache implements CacheLayer {
  name = 'L1-Memory';
  private cache: LRUCache<string, any>;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0
  };

  constructor(config: { maxSize: number; ttl: number }) {
    this.cache = new LRUCache({
      max: config.maxSize,
      ttl: config.ttl * 1000, // Convert to milliseconds
      updateAgeOnGet: true,
      updateAgeOnHas: true,
      allowStale: false,
      dispose: (value, key, reason) => {
        if (reason === 'evict') {
          this.stats.evictions++;
        }
      }
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get(key);
      if (value !== undefined) {
        this.stats.hits++;
        return value as T;
      }
      this.stats.misses++;
      return null;
    } catch (error) {
      logger.error('L1 cache get error', { key, error });
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const options = ttl ? { ttl: ttl * 1000 } : undefined;
      this.cache.set(key, value, options);
      this.stats.sets++;
      return true;
    } catch (error) {
      logger.error('L1 cache set error', { key, error });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.stats.deletes++;
      }
      return deleted;
    } catch (error) {
      logger.error('L1 cache delete error', { key, error });
      return false;
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.cache.max,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
}

/**
 * L2 Cache - Redis Distributed Cache
 * Shared across instances, persistent, higher capacity
 */
class L2Cache implements CacheLayer {
  name = 'L2-Redis';
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisCache.get<T>(key);
      if (value !== null) {
        this.stats.hits++;
        return value;
      }
      this.stats.misses++;
      return null;
    } catch (error) {
      logger.error('L2 cache get error', { key, error });
      this.stats.errors++;
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const success = await redisCache.set(key, value, ttl);
      if (success) {
        this.stats.sets++;
      } else {
        this.stats.errors++;
      }
      return success;
    } catch (error) {
      logger.error('L2 cache set error', { key, error });
      this.stats.errors++;
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const success = await redisCache.delete(key);
      if (success) {
        this.stats.deletes++;
      }
      return success;
    } catch (error) {
      logger.error('L2 cache delete error', { key, error });
      this.stats.errors++;
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await redisCache.flushAll();
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0
      };
    } catch (error) {
      logger.error('L2 cache clear error', { error });
      this.stats.errors++;
    }
  }

  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
}

/**
 * Multi-Layer Cache Manager
 * Implements intelligent caching strategy with fallback layers
 */
export class MultiLayerCacheManager {
  private l1Cache: L1Cache;
  private l2Cache: L2Cache;
  private config: CacheConfig;
  private globalStats: CacheStats;
  private responseTimeTracker: number[] = [];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      l1MaxSize: config.l1MaxSize || 10000,
      l1TTL: config.l1TTL || CACHE_TTL.MEDIUM,
      l2TTL: config.l2TTL || CACHE_TTL.LONG,
      enableL1: config.enableL1 ?? true,
      enableL2: config.enableL2 ?? true,
      enableCompression: config.enableCompression ?? false
    };

    this.l1Cache = new L1Cache({
      maxSize: this.config.l1MaxSize,
      ttl: this.config.l1TTL
    });

    this.l2Cache = new L2Cache();

    this.globalStats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      dbHits: 0,
      totalRequests: 0,
      hitRate: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Get value with multi-layer strategy
   * 1. Try L1 cache (memory) - fastest
   * 2. Try L2 cache (Redis) - slower but shared
   * 3. Return null if not found in any cache layer
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    this.globalStats.totalRequests++;

    try {
      // Try L1 cache first (fastest)
      if (this.config.enableL1) {
        const l1Result = await this.l1Cache.get<T>(key);
        if (l1Result !== null) {
          this.globalStats.l1Hits++;
          this.updateResponseTime(performance.now() - startTime);
          return l1Result;
        }
        this.globalStats.l1Misses++;
      }

      // Try L2 cache (Redis)
      if (this.config.enableL2) {
        const l2Result = await this.l2Cache.get<T>(key);
        if (l2Result !== null) {
          this.globalStats.l2Hits++;
          
          // Backfill L1 cache
          if (this.config.enableL1) {
            await this.l1Cache.set(key, l2Result, this.config.l1TTL);
          }
          
          this.updateResponseTime(performance.now() - startTime);
          return l2Result;
        }
        this.globalStats.l2Misses++;
      }

      // Not found in any cache layer
      this.updateResponseTime(performance.now() - startTime);
      return null;
    } catch (error) {
      logger.error('Multi-layer cache get error', { key, error });
      this.updateResponseTime(performance.now() - startTime);
      return null;
    }
  }

  /**
   * Set value in both cache layers
   * Optimizes for read performance by storing in both L1 and L2
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const promises: Promise<boolean>[] = [];

    // Set in L1 cache
    if (this.config.enableL1) {
      promises.push(
        this.l1Cache.set(key, value, Math.min(ttl || this.config.l1TTL, this.config.l1TTL))
      );
    }

    // Set in L2 cache
    if (this.config.enableL2) {
      promises.push(
        this.l2Cache.set(key, value, ttl || this.config.l2TTL)
      );
    }

    try {
      const results = await Promise.all(promises);
      return results.some(result => result); // Return true if at least one cache layer succeeded
    } catch (error) {
      logger.error('Multi-layer cache set error', { key, error });
      return false;
    }
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string): Promise<boolean> {
    const promises: Promise<boolean>[] = [];

    if (this.config.enableL1) {
      promises.push(this.l1Cache.delete(key));
    }

    if (this.config.enableL2) {
      promises.push(this.l2Cache.delete(key));
    }

    try {
      const results = await Promise.all(promises);
      return results.some(result => result);
    } catch (error) {
      logger.error('Multi-layer cache delete error', { key, error });
      return false;
    }
  }

  /**
   * Batch operations for better performance
   */
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    const l2Keys: string[] = [];

    // First pass: check L1 cache
    if (this.config.enableL1) {
      for (const key of keys) {
        const value = await this.l1Cache.get<T>(key);
        if (value !== null) {
          results.set(key, value);
          this.globalStats.l1Hits++;
        } else {
          l2Keys.push(key);
          this.globalStats.l1Misses++;
        }
      }
    } else {
      l2Keys.push(...keys);
    }

    // Second pass: check L2 cache for remaining keys
    if (this.config.enableL2 && l2Keys.length > 0) {
      try {
        const l2Values = await redisCache.mget<T>(l2Keys);
        for (let i = 0; i < l2Keys.length; i++) {
          const key = l2Keys[i];
          const value = l2Values[i];
          
          if (value !== null) {
            results.set(key, value);
            this.globalStats.l2Hits++;
            
            // Backfill L1
            if (this.config.enableL1) {
              await this.l1Cache.set(key, value, this.config.l1TTL);
            }
          } else {
            results.set(key, null);
            this.globalStats.l2Misses++;
          }
        }
      } catch (error) {
        logger.error('Multi-layer cache mget L2 error', { l2Keys, error });
        // Set remaining keys as null
        for (const key of l2Keys) {
          if (!results.has(key)) {
            results.set(key, null);
          }
        }
      }
    }

    this.globalStats.totalRequests += keys.length;
    return results;
  }

  /**
   * Cache-aside pattern with automatic population
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T | null> {
    const cachedValue = await this.get<T>(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }

    try {
      const freshValue = await factory();
      if (freshValue !== null && freshValue !== undefined) {
        await this.set(key, freshValue, ttl);
        this.globalStats.dbHits++;
        return freshValue;
      }
      return null;
    } catch (error) {
      logger.error('Cache factory error', { key, error });
      return null;
    }
  }

  /**
   * Invalidate cache patterns
   * Useful for invalidating related cache entries
   */
  async invalidatePattern(pattern: string): Promise<number> {
    let totalInvalidated = 0;

    try {
      // L2 cache pattern invalidation (Redis supports pattern matching)
      if (this.config.enableL2) {
        totalInvalidated += await redisCache.deletePattern(pattern);
      }

      // L1 cache doesn't support pattern matching efficiently,
      // so we clear it entirely when patterns are used
      if (this.config.enableL1) {
        await this.l1Cache.clear();
        logger.info('L1 cache cleared due to pattern invalidation', { pattern });
      }

      return totalInvalidated;
    } catch (error) {
      logger.error('Cache pattern invalidation error', { pattern, error });
      return 0;
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats & { layers: any[] } {
    this.updateGlobalHitRate();
    
    return {
      ...this.globalStats,
      layers: [
        {
          name: this.l1Cache.name,
          enabled: this.config.enableL1,
          ...this.l1Cache.getStats()
        },
        {
          name: this.l2Cache.name,
          enabled: this.config.enableL2,
          ...this.l2Cache.getStats()
        }
      ]
    };
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(warmupData: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    logger.info('Starting cache warmup', { itemCount: warmupData.length });
    
    const promises = warmupData.map(({ key, value, ttl }) => 
      this.set(key, value, ttl)
    );
    
    try {
      await Promise.all(promises);
      logger.info('Cache warmup completed successfully');
    } catch (error) {
      logger.error('Cache warmup error', { error });
    }
  }

  /**
   * Health check for cache layers
   */
  async healthCheck(): Promise<{ l1: boolean; l2: boolean; overall: boolean }> {
    const testKey = `health_check_${Date.now()}`;
    const testValue = { timestamp: Date.now() };
    
    let l1Healthy = true;
    let l2Healthy = true;

    try {
      // Test L1
      if (this.config.enableL1) {
        await this.l1Cache.set(testKey, testValue, 10);
        const l1Result = await this.l1Cache.get(testKey);
        l1Healthy = l1Result !== null;
        await this.l1Cache.delete(testKey);
      }

      // Test L2
      if (this.config.enableL2) {
        await this.l2Cache.set(testKey, testValue, 10);
        const l2Result = await this.l2Cache.get(testKey);
        l2Healthy = l2Result !== null;
        await this.l2Cache.delete(testKey);
      }
    } catch (error) {
      logger.error('Cache health check error', { error });
      l1Healthy = false;
      l2Healthy = false;
    }

    const overall = l1Healthy || l2Healthy; // At least one layer should be healthy
    
    return { l1: l1Healthy, l2: l2Healthy, overall };
  }

  private updateResponseTime(time: number): void {
    this.responseTimeTracker.push(time);
    
    // Keep only last 1000 measurements for rolling average
    if (this.responseTimeTracker.length > 1000) {
      this.responseTimeTracker = this.responseTimeTracker.slice(-1000);
    }
    
    this.globalStats.averageResponseTime = 
      this.responseTimeTracker.reduce((a, b) => a + b, 0) / this.responseTimeTracker.length;
  }

  private updateGlobalHitRate(): void {
    const totalCacheRequests = this.globalStats.l1Hits + this.globalStats.l1Misses + 
                               this.globalStats.l2Hits + this.globalStats.l2Misses;
    const totalHits = this.globalStats.l1Hits + this.globalStats.l2Hits;
    
    this.globalStats.hitRate = totalCacheRequests > 0 ? totalHits / totalCacheRequests : 0;
  }
}

// Predefined cache configurations for different use cases
export const CacheConfigurations = {
  // High-traffic API endpoints
  HighTraffic: {
    l1MaxSize: 50000,
    l1TTL: CACHE_TTL.SHORT,
    l2TTL: CACHE_TTL.MEDIUM,
    enableL1: true,
    enableL2: true,
    enableCompression: false
  },
  
  // User session data
  UserSession: {
    l1MaxSize: 10000,
    l1TTL: CACHE_TTL.MEDIUM,
    l2TTL: CACHE_TTL.LONG,
    enableL1: true,
    enableL2: true,
    enableCompression: false
  },
  
  // Analytics and reporting data
  Analytics: {
    l1MaxSize: 5000,
    l1TTL: CACHE_TTL.LONG,
    l2TTL: CACHE_TTL.DAY,
    enableL1: true,
    enableL2: true,
    enableCompression: true
  },
  
  // Static content and metadata
  StaticContent: {
    l1MaxSize: 20000,
    l1TTL: CACHE_TTL.LONG,
    l2TTL: CACHE_TTL.WEEK,
    enableL1: true,
    enableL2: true,
    enableCompression: true
  }
} as const;

// Export singleton instances for different use cases
export const apiCache = new MultiLayerCacheManager(CacheConfigurations.HighTraffic);
export const userCache = new MultiLayerCacheManager(CacheConfigurations.UserSession);
export const analyticsCache = new MultiLayerCacheManager(CacheConfigurations.Analytics);
export const staticCache = new MultiLayerCacheManager(CacheConfigurations.StaticContent);

// Export cache key builders
export const CacheKeys = {
  user: (userId: string) => `${CACHE_KEYS.USER}${userId}`,
  userStats: (userId: string) => `${CACHE_KEYS.STATS}${userId}`,
  userProgress: (userId: string, courseId?: string) => 
    courseId ? `progress:${userId}:${courseId}` : `progress:${userId}`,
  courseContent: (courseId: string) => `course:content:${courseId}`,
  assessment: (assessmentId: string) => `assessment:${assessmentId}`,
  leaderboard: (type: string, period: string) => `${CACHE_KEYS.LEADERBOARD}${type}:${period}`,
  companionState: (userCompanionId: string) => `${CACHE_KEYS.COMPANION}state:${userCompanionId}`,
  apiResponse: (endpoint: string, params?: string) => 
    `api:${endpoint}${params ? `:${params}` : ''}`,
  gtoSolution: (scenario: string) => `gto:solution:${scenario}`,
  training: (sessionId: string) => `${CACHE_KEYS.TRAINING}${sessionId}`
};