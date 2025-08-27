/**
 * 个性化系统缓存优化
 * 实现智能缓存策略、预加载和性能优化
 */

import { createLogger } from '../logger';
import { Redis } from 'ioredis';
import LRU from 'lru-cache';

const logger = createLogger('personalization-cache');

export interface CacheConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  lru?: {
    max: number;
    ttl: number;
  };
  enableCompression: boolean;
  enablePrefetching: boolean;
  prefetchThreshold: number;
  compressionThreshold: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  hits: number;
  size: number;
  compressed: boolean;
  tags: string[];
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  compressionRatio: number;
  averageResponseTime: number;
  prefetchHits: number;
}

export interface PrefetchRule {
  pattern: string;
  dependencies: string[];
  priority: number;
  condition?: (context: any) => boolean;
}

/**
 * 多级缓存管理器
 */
export class PersonalizationCache {
  private redis?: Redis;
  private lruCache: LRU<string, CacheEntry>;
  private config: CacheConfig;
  private stats: {
    hits: number;
    misses: number;
    totalResponseTime: number;
    requestCount: number;
    prefetchHits: number;
  };
  private prefetchRules: Map<string, PrefetchRule[]> = new Map();
  private compressionCache = new Map<string, string>();
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(config: CacheConfig) {
    this.config = config;
    this.stats = {
      hits: 0,
      misses: 0,
      totalResponseTime: 0,
      requestCount: 0,
      prefetchHits: 0
    };

    // 初始化LRU缓存
    this.lruCache = new LRU({
      max: config.lru?.max || 1000,
      ttl: config.lru?.ttl || 30 * 60 * 1000, // 30分钟
      updateAgeOnGet: true,
      allowStale: false
    });

    this.setupRedis();
    this.setupPrefetchRules();
    this.startBackgroundTasks();
  }

  // 初始化Redis连接
  private async setupRedis(): Promise<void> {
    if (!this.config.redis) return;

    try {
      this.redis = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      await this.redis.connect();
      logger.info('Redis connection established for personalization cache');
    } catch (error) {
      logger.error('Failed to setup Redis cache:', error);
      this.redis = undefined;
    }
  }

  // 设置预取规则
  private setupPrefetchRules(): void {
    const rules: Array<[string, PrefetchRule[]]> = [
      // 用户推荐相关预取
      ['user_recommendations', [
        {
          pattern: 'personalization:recommendations:*',
          dependencies: ['personalization:user_profile:*'],
          priority: 10,
          condition: (context) => context.timeAvailable > 30
        }
      ]],
      
      // 训练计划相关预取
      ['training_plan', [
        {
          pattern: 'personalization:training_plan:*',
          dependencies: [
            'personalization:user_profile:*',
            'personalization:recommendations:*'
          ],
          priority: 8,
          condition: (context) => context.planDuration >= 14
        }
      ]],

      // 用户画像相关预取
      ['user_profile', [
        {
          pattern: 'personalization:user_profile:*',
          dependencies: ['game:session:*', 'assessment:results:*'],
          priority: 9
        }
      ]]
    ];

    for (const [category, ruleList] of rules) {
      this.prefetchRules.set(category, ruleList);
    }
  }

  // 启动后台任务
  private startBackgroundTasks(): void {
    // 缓存清理任务
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // 每5分钟

    // 统计重置任务
    setInterval(() => {
      this.resetStats();
    }, 60 * 60 * 1000); // 每小时

    // 预热任务
    setInterval(() => {
      this.warmupCache();
    }, 15 * 60 * 1000); // 每15分钟
  }

  /**
   * 获取缓存数据
   */
  public async get<T>(key: string, tags: string[] = []): Promise<T | null> {
    const startTime = Date.now();
    this.stats.requestCount++;

    try {
      // 1. 检查L1缓存（LRU）
      const lruEntry = this.lruCache.get(key);
      if (lruEntry) {
        lruEntry.hits++;
        this.stats.hits++;
        this.stats.totalResponseTime += Date.now() - startTime;
        
        logger.debug(`L1 cache hit: ${key}`);
        return this.deserializeData<T>(lruEntry.data, lruEntry.compressed);
      }

      // 2. 检查L2缓存（Redis）
      if (this.redis) {
        const redisData = await this.redis.get(key);
        if (redisData) {
          const entry: CacheEntry<T> = JSON.parse(redisData);
          entry.hits++;
          
          // 回填L1缓存
          this.lruCache.set(key, entry);
          
          this.stats.hits++;
          this.stats.totalResponseTime += Date.now() - startTime;
          
          logger.debug(`L2 cache hit: ${key}`);
          return this.deserializeData<T>(entry.data, entry.compressed);
        }
      }

      // 缓存未命中
      this.stats.misses++;
      this.stats.totalResponseTime += Date.now() - startTime;
      
      logger.debug(`Cache miss: ${key}`);
      
      // 触发预取
      if (this.config.enablePrefetching) {
        this.triggerPrefetch(key, tags);
      }

      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  public async set<T>(
    key: string, 
    data: T, 
    ttl: number = 1800, // 30分钟
    tags: string[] = []
  ): Promise<void> {
    try {
      const serializedData = this.serializeData(data);
      const compressed = serializedData.compressed;
      const size = this.calculateSize(serializedData.data);

      const entry: CacheEntry<T> = {
        data: serializedData.data,
        timestamp: Date.now(),
        hits: 0,
        size,
        compressed,
        tags
      };

      // 设置L1缓存
      this.lruCache.set(key, entry);

      // 设置L2缓存
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(entry));
      }

      logger.debug(`Cache set: ${key}, compressed: ${compressed}, size: ${size}`);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  /**
   * 批量获取
   */
  public async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    const redisKeys: string[] = [];
    const redisKeyMap = new Map<string, string>();

    // 先检查L1缓存
    for (const key of keys) {
      const lruEntry = this.lruCache.get(key);
      if (lruEntry) {
        lruEntry.hits++;
        this.stats.hits++;
        result.set(key, this.deserializeData<T>(lruEntry.data, lruEntry.compressed));
      } else {
        redisKeys.push(key);
        redisKeyMap.set(key, key);
      }
    }

    // 批量查询Redis
    if (redisKeys.length > 0 && this.redis) {
      try {
        const redisValues = await this.redis.mget(...redisKeys);
        
        for (let i = 0; i < redisKeys.length; i++) {
          const key = redisKeys[i];
          const value = redisValues[i];
          
          if (value) {
            const entry: CacheEntry<T> = JSON.parse(value);
            entry.hits++;
            
            // 回填L1缓存
            this.lruCache.set(key, entry);
            
            result.set(key, this.deserializeData<T>(entry.data, entry.compressed));
            this.stats.hits++;
          } else {
            this.stats.misses++;
          }
        }
      } catch (error) {
        logger.error('Batch cache get error:', error);
      }
    }

    return result;
  }

  /**
   * 批量设置
   */
  public async mset<T>(entries: Map<string, T>, ttl: number = 1800): Promise<void> {
    const pipeline = this.redis?.pipeline();
    
    for (const [key, data] of entries) {
      const serializedData = this.serializeData(data);
      const entry: CacheEntry<T> = {
        data: serializedData.data,
        timestamp: Date.now(),
        hits: 0,
        size: this.calculateSize(serializedData.data),
        compressed: serializedData.compressed,
        tags: []
      };

      // 设置L1缓存
      this.lruCache.set(key, entry);

      // 批量设置Redis
      if (pipeline) {
        pipeline.setex(key, ttl, JSON.stringify(entry));
      }
    }

    if (pipeline) {
      await pipeline.exec();
    }
  }

  /**
   * 删除缓存
   */
  public async del(key: string): Promise<void> {
    this.lruCache.delete(key);
    
    if (this.redis) {
      await this.redis.del(key);
    }
  }

  /**
   * 按标签删除缓存
   */
  public async delByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];

    // 查找L1缓存中匹配的键
    for (const [key, entry] of this.lruCache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    // 删除L1缓存
    for (const key of keysToDelete) {
      this.lruCache.delete(key);
    }

    // 删除Redis缓存（需要扫描，性能较差）
    if (this.redis && keysToDelete.length > 0) {
      await this.redis.del(...keysToDelete);
    }
  }

  /**
   * 按模式删除缓存
   */
  public async delByPattern(pattern: string): Promise<void> {
    if (this.redis) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }

    // 删除L1缓存中匹配的键
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const [key] of this.lruCache.entries()) {
      if (regex.test(key)) {
        this.lruCache.delete(key);
      }
    }
  }

  /**
   * 预取数据
   */
  public async prefetch(key: string, fetcher: () => Promise<any>, tags: string[] = []): Promise<void> {
    if (await this.get(key)) {
      return; // 已经存在，无需预取
    }

    // 避免重复请求
    if (this.pendingRequests.has(key)) {
      return;
    }

    try {
      const fetchPromise = fetcher();
      this.pendingRequests.set(key, fetchPromise);
      
      const data = await fetchPromise;
      await this.set(key, data, 1800, tags);
      
      logger.debug(`Prefetched: ${key}`);
    } catch (error) {
      logger.error(`Prefetch error for ${key}:`, error);
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * 触发智能预取
   */
  private triggerPrefetch(accessKey: string, tags: string[]): void {
    for (const [category, rules] of this.prefetchRules) {
      for (const rule of rules) {
        if (this.matchesPattern(accessKey, rule.pattern)) {
          // 检查条件
          if (rule.condition && !rule.condition({ tags })) {
            continue;
          }

          // 预取依赖项
          setTimeout(async () => {
            await this.prefetchDependencies(rule.dependencies, accessKey);
          }, 50); // 异步预取，不阻塞主请求
        }
      }
    }
  }

  /**
   * 预取依赖项
   */
  private async prefetchDependencies(dependencies: string[], sourceKey: string): Promise<void> {
    for (const dependency of dependencies) {
      const keys = await this.expandPattern(dependency, sourceKey);
      for (const key of keys) {
        if (!await this.get(key)) {
          // 这里应该调用实际的数据获取逻辑
          logger.debug(`Need to prefetch: ${key}`);
        }
      }
    }
  }

  /**
   * 扩展模式为具体键
   */
  private async expandPattern(pattern: string, sourceKey: string): Promise<string[]> {
    // 从源键中提取参数
    const params = this.extractParams(sourceKey);
    
    // 替换模式中的占位符
    let expandedPattern = pattern;
    for (const [key, value] of Object.entries(params)) {
      expandedPattern = expandedPattern.replace(`{${key}}`, value);
    }

    // 如果还有通配符，需要查询已存在的键
    if (expandedPattern.includes('*')) {
      if (this.redis) {
        return await this.redis.keys(expandedPattern);
      }
    }

    return [expandedPattern];
  }

  /**
   * 从键中提取参数
   */
  private extractParams(key: string): Record<string, string> {
    const parts = key.split(':');
    const params: Record<string, string> = {};
    
    if (parts.length >= 3) {
      params.userId = parts[parts.length - 1];
      params.category = parts[1];
    }
    
    return params;
  }

  /**
   * 检查键是否匹配模式
   */
  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  /**
   * 序列化数据
   */
  private serializeData(data: any): { data: any; compressed: boolean } {
    let serialized = JSON.stringify(data);
    let compressed = false;

    // 压缩大数据
    if (this.config.enableCompression && serialized.length > this.config.compressionThreshold) {
      try {
        // 简单压缩（实际项目中可用zlib）
        const compressedData = this.simpleCompress(serialized);
        if (compressedData.length < serialized.length * 0.8) {
          serialized = compressedData;
          compressed = true;
        }
      } catch (error) {
        logger.error('Compression error:', error);
      }
    }

    return { data: serialized, compressed };
  }

  /**
   * 反序列化数据
   */
  private deserializeData<T>(data: any, compressed: boolean): T {
    let decompressed = data;
    
    if (compressed) {
      try {
        decompressed = this.simpleDecompress(data);
      } catch (error) {
        logger.error('Decompression error:', error);
      }
    }

    return JSON.parse(decompressed);
  }

  /**
   * 简单压缩（实际项目中使用zlib或其他库）
   */
  private simpleCompress(str: string): string {
    // 这里使用简单的字符替换作为示例
    // 实际项目中应该使用真正的压缩算法
    return Buffer.from(str).toString('base64');
  }

  /**
   * 简单解压
   */
  private simpleDecompress(str: string): string {
    return Buffer.from(str, 'base64').toString();
  }

  /**
   * 计算数据大小
   */
  private calculateSize(data: any): number {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  }

  /**
   * 清理过期条目
   */
  private cleanupExpiredEntries(): void {
    // LRU缓存自动清理，这里主要清理其他资源
    this.compressionCache.clear();
    
    // 清理挂起的请求
    const now = Date.now();
    for (const [key, promise] of this.pendingRequests) {
      // 如果请求挂起超过5分钟，清理掉
      if (now - this.stats.requestCount > 5 * 60 * 1000) {
        this.pendingRequests.delete(key);
      }
    }

    logger.debug('Cache cleanup completed');
  }

  /**
   * 缓存预热
   */
  private async warmupCache(): Promise<void> {
    if (!this.config.enablePrefetching) return;

    try {
      // 预热常用数据
      const commonPatterns = [
        'personalization:user_profile:*',
        'personalization:recommendations:*'
      ];

      for (const pattern of commonPatterns) {
        if (this.redis) {
          const keys = await this.redis.keys(pattern);
          // 预热前10个最常用的键
          for (const key of keys.slice(0, 10)) {
            if (!this.lruCache.has(key)) {
              const data = await this.redis.get(key);
              if (data) {
                const entry = JSON.parse(data);
                this.lruCache.set(key, entry);
              }
            }
          }
        }
      }

      logger.debug('Cache warmup completed');
    } catch (error) {
      logger.error('Cache warmup error:', error);
    }
  }

  /**
   * 重置统计信息
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalResponseTime: 0,
      requestCount: 0,
      prefetchHits: 0
    };
  }

  /**
   * 获取缓存统计
   */
  public getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const memoryUsage = this.lruCache.size;
    
    return {
      hitRate: total > 0 ? this.stats.hits / total : 0,
      missRate: total > 0 ? this.stats.misses / total : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      memoryUsage,
      compressionRatio: 0.8, // 简化计算
      averageResponseTime: this.stats.requestCount > 0 
        ? this.stats.totalResponseTime / this.stats.requestCount 
        : 0,
      prefetchHits: this.stats.prefetchHits
    };
  }

  /**
   * 获取缓存信息
   */
  public getCacheInfo(): {
    lruSize: number;
    lruMax: number;
    redisConnected: boolean;
    pendingRequests: number;
    prefetchRules: number;
  } {
    return {
      lruSize: this.lruCache.size,
      lruMax: this.lruCache.max,
      redisConnected: !!this.redis && this.redis.status === 'ready',
      pendingRequests: this.pendingRequests.size,
      prefetchRules: Array.from(this.prefetchRules.values()).reduce((sum, rules) => sum + rules.length, 0)
    };
  }

  /**
   * 关闭缓存
   */
  public async close(): Promise<void> {
    this.lruCache.clear();
    this.compressionCache.clear();
    this.pendingRequests.clear();
    
    if (this.redis) {
      await this.redis.disconnect();
    }

    logger.info('Personalization cache closed');
  }
}

/**
 * 缓存装饰器
 */
export function Cacheable(key: string, ttl: number = 1800, tags: string[] = []) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cache: PersonalizationCache = this.cache || globalCache;
      const cacheKey = typeof key === 'function' ? key(...args) : key;
      
      // 尝试从缓存获取
      const cached = await cache.get(cacheKey, tags);
      if (cached !== null) {
        return cached;
      }
      
      // 调用原方法
      const result = await originalMethod.apply(this, args);
      
      // 设置缓存
      await cache.set(cacheKey, result, ttl, tags);
      
      return result;
    };

    return descriptor;
  };
}

// 全局缓存实例
let globalCache: PersonalizationCache;

/**
 * 创建个性化缓存实例
 */
export function createPersonalizationCache(config?: Partial<CacheConfig>): PersonalizationCache {
  const defaultConfig: CacheConfig = {
    enableCompression: true,
    enablePrefetching: true,
    prefetchThreshold: 0.7,
    compressionThreshold: 1024, // 1KB
    lru: {
      max: 1000,
      ttl: 30 * 60 * 1000
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_CACHE_DB || '3')
    }
  };

  const cache = new PersonalizationCache({ ...defaultConfig, ...config });
  
  if (!globalCache) {
    globalCache = cache;
  }
  
  return cache;
}

export default PersonalizationCache;