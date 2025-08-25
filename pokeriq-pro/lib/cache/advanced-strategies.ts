/**
 * 高性能Redis缓存策略管理器
 * 专为PokerIQ Pro设计，支持100万+并发用户的缓存优化
 */

import Redis from 'ioredis';
import { createLogger } from '@/lib/logger';
import { getRedisClient } from './redis';

const logger = createLogger('redis-advanced');

// 缓存策略配置
export const CACHE_STRATEGIES = {
  // AI伴侣数据缓存 - 高频访问
  COMPANION_DATA: {
    ttl: 3600, // 1小时
    namespace: 'companion:data:',
    maxMemory: '2gb',
    evictionPolicy: 'allkeys-lru',
    compressionEnabled: true,
    priorityLevel: 'high',
  },
  
  // 伴侣情感状态缓存 - 实时性要求
  COMPANION_EMOTION: {
    ttl: 300, // 5分钟
    namespace: 'companion:emotion:',
    maxMemory: '500mb',
    evictionPolicy: 'volatile-ttl',
    compressionEnabled: false,
    priorityLevel: 'critical',
  },
  
  // 对话历史缓存 - 会话相关
  CONVERSATION_HISTORY: {
    ttl: 1800, // 30分钟
    namespace: 'companion:history:',
    maxMemory: '1gb',
    evictionPolicy: 'volatile-lru',
    compressionEnabled: true,
    priorityLevel: 'medium',
  },
  
  // 伴侣记忆缓存 - 长期存储
  COMPANION_MEMORY: {
    ttl: 7200, // 2小时
    namespace: 'companion:memory:',
    maxMemory: '1.5gb',
    evictionPolicy: 'allkeys-lfu',
    compressionEnabled: true,
    priorityLevel: 'high',
  },
  
  // 用户会话缓存 - 最高优先级
  USER_SESSION: {
    ttl: 1800, // 30分钟
    namespace: 'session:',
    maxMemory: '2gb',
    evictionPolicy: 'allkeys-lru',
    compressionEnabled: true,
    priorityLevel: 'critical',
  },
  
  // 游戏状态缓存 - 实时性要求高
  GAME_STATE: {
    ttl: 300, // 5分钟
    namespace: 'game:',
    maxMemory: '1gb',
    evictionPolicy: 'volatile-ttl',
    compressionEnabled: false,
    priorityLevel: 'critical',
  },
  
  // AI模型结果缓存 - 计算密集型
  AI_RESULTS: {
    ttl: 3600, // 1小时
    namespace: 'ai:',
    maxMemory: '4gb',
    evictionPolicy: 'allkeys-lfu', // 最少使用频率
    compressionEnabled: true,
    priorityLevel: 'high',
  },
  
  // 用户统计缓存 - 长期缓存
  USER_STATS: {
    ttl: 7200, // 2小时
    namespace: 'stats:',
    maxMemory: '500mb',
    evictionPolicy: 'volatile-lru',
    compressionEnabled: true,
    priorityLevel: 'medium',
  },
  
  // 排行榜缓存 - 频繁读取
  LEADERBOARD: {
    ttl: 900, // 15分钟
    namespace: 'leaderboard:',
    maxMemory: '200mb',
    evictionPolicy: 'volatile-ttl',
    compressionEnabled: false,
    priorityLevel: 'medium',
  },
  
  // API响应缓存 - 减少数据库负载
  API_CACHE: {
    ttl: 600, // 10分钟
    namespace: 'api:',
    maxMemory: '1gb',
    evictionPolicy: 'allkeys-lru',
    compressionEnabled: true,
    priorityLevel: 'medium',
  },
} as const;

/**
 * Redis连接池管理器 - Enhanced for AI Companion System
 */
export class RedisConnectionPool {
  private static instance: RedisConnectionPool;
  private pools: Map<string, Redis[]> = new Map();
  private poolConfig = {
    minConnections: 10, // 增加最小连接数以支持高并发
    maxConnections: 200, // 增加最大连接数
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  };

  private constructor() {}

  static getInstance(): RedisConnectionPool {
    if (!RedisConnectionPool.instance) {
      RedisConnectionPool.instance = new RedisConnectionPool();
    }
    return RedisConnectionPool.instance;
  }

  /**
   * 获取连接池
   */
  getPool(poolName: string = 'default'): Redis[] {
    if (!this.pools.has(poolName)) {
      this.createPool(poolName);
    }
    return this.pools.get(poolName)!;
  }

  /**
   * 创建连接池 - 伴侣系统特化
   */
  private createPool(poolName: string) {
    const connections: Redis[] = [];
    
    // 根据池类型调整连接数
    const connectionCount = this.getConnectionCountForPool(poolName);
    
    for (let i = 0; i < connectionCount; i++) {
      const connection = this.createConnection(poolName);
      connections.push(connection);
    }
    
    this.pools.set(poolName, connections);
    logger.info(`Redis connection pool '${poolName}' created with ${connections.length} connections`);
  }

  /**
   * 根据池类型确定连接数
   */
  private getConnectionCountForPool(poolName: string): number {
    const poolSizes = {
      'companion': 50, // 伴侣数据池 - 高并发
      'emotion': 30,   // 情感状态池 - 实时更新
      'conversation': 40, // 对话历史池 - 频繁读写
      'memory': 25,    // 记忆数据池 - 中等频率
      'session': 60,   // 会话池 - 最高并发
      'default': 20,   // 默认池
    };
    
    return poolSizes[poolName as keyof typeof poolSizes] || poolSizes.default;
  }

  /**
   * 创建单个连接
   */
  private createConnection(poolName: string): Redis {
    // 使用现有的Redis配置
    const redis = getRedisClient();

    // 设置连接特定配置
    redis.on('connect', () => {
      logger.info(`Redis connection established: ${poolName}`);
    });

    redis.on('error', (error) => {
      logger.error(`Redis connection error: ${poolName}`, { error: error.message });
    });

    redis.on('close', () => {
      logger.warn(`Redis connection closed: ${poolName}`);
    });

    return redis;
  }

  /**
   * 获取可用连接 - 智能路由
   */
  async acquireConnection(poolName: string = 'default', operation?: string): Promise<Redis> {
    const pool = this.getPool(poolName);
    
    // 负载均衡策略 - 根据操作类型选择不同的连接
    let connection: Redis;
    
    if (operation === 'read') {
      // 读操作使用轮询
      const index = Math.floor(Date.now() / 1000) % pool.length;
      connection = pool[index];
    } else if (operation === 'write') {
      // 写操作使用较少使用的连接
      connection = this.getLeastUsedConnection(pool);
    } else {
      // 默认随机选择
      connection = pool[Math.floor(Math.random() * pool.length)];
    }
    
    // 检查连接状态
    if (connection.status !== 'ready') {
      try {
        await connection.connect();
      } catch (error) {
        logger.error(`Failed to reconnect Redis in pool ${poolName}`, { error });
        // 返回池中的其他连接
        return pool[0];
      }
    }
    
    return connection;
  }

  /**
   * 获取使用最少的连接
   */
  private getLeastUsedConnection(pool: Redis[]): Redis {
    // 简化实现 - 实际应用中可以跟踪连接使用统计
    return pool[0];
  }

  /**
   * 动态扩展连接池
   */
  async expandPool(poolName: string, count: number = 5) {
    const pool = this.getPool(poolName);
    
    if (pool.length >= this.poolConfig.maxConnections) {
      logger.warn(`Pool ${poolName} already at max capacity`);
      return;
    }
    
    const newConnections = Math.min(count, this.poolConfig.maxConnections - pool.length);
    
    for (let i = 0; i < newConnections; i++) {
      const connection = this.createConnection(poolName);
      pool.push(connection);
    }
    
    logger.info(`Expanded pool ${poolName} by ${newConnections} connections`);
  }

  /**
   * 监控连接池健康状态
   */
  async getPoolHealthStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    
    for (const [poolName, connections] of this.pools) {
      const readyConnections = connections.filter(conn => conn.status === 'ready').length;
      const totalConnections = connections.length;
      
      stats[poolName] = {
        ready: readyConnections,
        total: totalConnections,
        health: readyConnections / totalConnections,
        utilization: totalConnections / this.poolConfig.maxConnections,
      };
    }
    
    return stats;
  }
}

/**
 * 高性能缓存管理器 - Enhanced for AI Companion System
 */
export class AdvancedCacheManager {
  private connectionPool: RedisConnectionPool;
  private compressionEnabled: boolean = true;
  private performanceMetrics = {
    hits: 0,
    misses: 0,
    operations: 0,
    totalDuration: 0,
  };

  constructor() {
    this.connectionPool = RedisConnectionPool.getInstance();
  }

  /**
   * AI伴侣专用缓存方法
   */
  
  /**
   * 缓存伴侣数据 - 高优先级
   */
  async setCompanionData(companionId: string, data: any, ttl?: number): Promise<boolean> {
    return this.smartSet(`companion:${companionId}`, data, {
      strategy: 'COMPANION_DATA',
      ttl,
    });
  }

  async getCompanionData<T>(companionId: string): Promise<T | null> {
    return this.smartGet<T>(`companion:${companionId}`, {
      strategy: 'COMPANION_DATA',
    });
  }

  /**
   * 缓存情感状态 - 实时更新
   */
  async setEmotionalState(userCompanionId: string, emotionalState: any): Promise<boolean> {
    return this.smartSet(`emotion:${userCompanionId}`, emotionalState, {
      strategy: 'COMPANION_EMOTION',
    });
  }

  async getEmotionalState<T>(userCompanionId: string): Promise<T | null> {
    return this.smartGet<T>(`emotion:${userCompanionId}`, {
      strategy: 'COMPANION_EMOTION',
    });
  }

  /**
   * 缓存对话历史 - 会话相关
   */
  async setConversationHistory(sessionId: string, history: any[], ttl?: number): Promise<boolean> {
    return this.smartSet(`conversation:${sessionId}`, history, {
      strategy: 'CONVERSATION_HISTORY',
      ttl,
    });
  }

  async getConversationHistory<T>(sessionId: string): Promise<T | null> {
    return this.smartGet<T>(`conversation:${sessionId}`, {
      strategy: 'CONVERSATION_HISTORY',
    });
  }

  /**
   * 缓存伴侣记忆 - 按重要性分级
   */
  async setCompanionMemory(userCompanionId: string, memories: any[], importance: number): Promise<boolean> {
    const key = `memory:${userCompanionId}:importance:${importance}`;
    return this.smartSet(key, memories, {
      strategy: 'COMPANION_MEMORY',
    });
  }

  async getCompanionMemory<T>(userCompanionId: string, importance?: number): Promise<T | null> {
    const key = importance 
      ? `memory:${userCompanionId}:importance:${importance}`
      : `memory:${userCompanionId}`;
    
    return this.smartGet<T>(key, {
      strategy: 'COMPANION_MEMORY',
    });
  }

  /**
   * 批量缓存伴侣数据
   */
  async batchSetCompanionData(companions: Array<{ id: string; data: any }>): Promise<boolean> {
    const items = companions.map(comp => ({
      key: `companion:${comp.id}`,
      value: comp.data,
    }));

    return this.batchSet(items, 'COMPANION_DATA');
  }

  /**
   * 智能缓存设置 - 根据数据类型自动选择策略
   */
  async smartSet<T>(
    key: string,
    value: T,
    options: {
      strategy?: keyof typeof CACHE_STRATEGIES;
      ttl?: number;
      compress?: boolean;
      namespace?: string;
    } = {}
  ): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const strategy = CACHE_STRATEGIES[options.strategy || 'API_CACHE'];
      const finalKey = `${options.namespace || strategy.namespace}${key}`;
      const ttl = options.ttl || strategy.ttl;
      
      let serializedValue = JSON.stringify(value);
      
      // 压缩大型数据
      if ((options.compress ?? strategy.compressionEnabled) && serializedValue.length > 1024) {
        serializedValue = await this.compressData(serializedValue);
      }
      
      // 根据策略选择合适的连接池
      const poolName = this.getPoolNameForStrategy(options.strategy);
      const connection = await this.connectionPool.acquireConnection(poolName, 'write');
      
      if (ttl > 0) {
        await connection.setex(finalKey, ttl, serializedValue);
      } else {
        await connection.set(finalKey, serializedValue);
      }
      
      const duration = Date.now() - startTime;
      this.recordMetrics('set', duration, true);
      
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.recordMetrics('set', duration, false);
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  /**
   * 智能缓存获取
   */
  async smartGet<T>(
    key: string,
    options: {
      strategy?: keyof typeof CACHE_STRATEGIES;
      namespace?: string;
      decompress?: boolean;
    } = {}
  ): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const strategy = CACHE_STRATEGIES[options.strategy || 'API_CACHE'];
      const finalKey = `${options.namespace || strategy.namespace}${key}`;
      
      // 根据策略选择合适的连接池
      const poolName = this.getPoolNameForStrategy(options.strategy);
      const connection = await this.connectionPool.acquireConnection(poolName, 'read');
      const value = await connection.get(finalKey);
      
      if (!value) {
        this.recordMetrics('get', Date.now() - startTime, false);
        return null;
      }
      
      // 解压缩数据
      let decompressedValue = value;
      if (options.decompress ?? strategy.compressionEnabled) {
        decompressedValue = await this.decompressData(value);
      }
      
      const duration = Date.now() - startTime;
      this.recordMetrics('get', duration, true);
      
      return JSON.parse(decompressedValue) as T;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.recordMetrics('get', duration, false);
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * 根据缓存策略选择连接池
   */
  private getPoolNameForStrategy(strategy?: keyof typeof CACHE_STRATEGIES): string {
    if (!strategy) return 'default';
    
    const poolMapping = {
      'COMPANION_DATA': 'companion',
      'COMPANION_EMOTION': 'emotion',
      'CONVERSATION_HISTORY': 'conversation',
      'COMPANION_MEMORY': 'memory',
      'USER_SESSION': 'session',
      'GAME_STATE': 'default',
      'AI_RESULTS': 'default',
      'USER_STATS': 'default',
      'LEADERBOARD': 'default',
      'API_CACHE': 'default',
    };
    
    return poolMapping[strategy] || 'default';
  }

  /**
   * 记录性能指标
   */
  private recordMetrics(operation: string, duration: number, success: boolean): void {
    this.performanceMetrics.operations++;
    this.performanceMetrics.totalDuration += duration;
    
    if (success) {
      this.performanceMetrics.hits++;
    } else {
      this.performanceMetrics.misses++;
    }
  }

  /**
   * 批量缓存操作
   */
  async batchSet<T>(
    items: Array<{ key: string; value: T; ttl?: number }>,
    strategy: keyof typeof CACHE_STRATEGIES = 'API_CACHE'
  ): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const connection = await this.connectionPool.acquireConnection();
      const pipeline = connection.pipeline();
      const strategyConfig = CACHE_STRATEGIES[strategy];
      
      for (const item of items) {
        const finalKey = `${strategyConfig.namespace}${item.key}`;
        const serializedValue = JSON.stringify(item.value);
        const ttl = item.ttl || strategyConfig.ttl;
        
        if (ttl > 0) {
          pipeline.setex(finalKey, ttl, serializedValue);
        } else {
          pipeline.set(finalKey, serializedValue);
        }
      }
      
      await pipeline.exec();
      
      const duration = Date.now() - startTime;
      prometheusCollector.recordCacheOperation('batch_set', 'redis', duration);
      
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      prometheusCollector.recordCacheOperation('batch_set', 'redis', duration);
      errorMonitor.captureException(error, {
        tags: { type: 'cache_batch_set_error' },
        extra: { itemCount: items.length, strategy },
      });
      return false;
    }
  }

  /**
   * 批量获取
   */
  async batchGet<T>(
    keys: string[],
    strategy: keyof typeof CACHE_STRATEGIES = 'API_CACHE'
  ): Promise<(T | null)[]> {
    const startTime = Date.now();
    
    try {
      const connection = await this.connectionPool.acquireConnection();
      const strategyConfig = CACHE_STRATEGIES[strategy];
      const finalKeys = keys.map(key => `${strategyConfig.namespace}${key}`);
      
      const values = await connection.mget(...finalKeys);
      const results: (T | null)[] = [];
      
      for (let i = 0; i < values.length; i++) {
        if (values[i]) {
          prometheusCollector.recordCacheHit('redis', strategy);
          results.push(JSON.parse(values[i]!) as T);
        } else {
          prometheusCollector.recordCacheMiss('redis', strategy);
          results.push(null);
        }
      }
      
      const duration = Date.now() - startTime;
      prometheusCollector.recordCacheOperation('batch_get', 'redis', duration);
      
      return results;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      prometheusCollector.recordCacheOperation('batch_get', 'redis', duration);
      errorMonitor.captureException(error, {
        tags: { type: 'cache_batch_get_error' },
        extra: { keyCount: keys.length, strategy },
      });
      return keys.map(() => null);
    }
  }

  /**
   * 缓存预热
   */
  async warmupCache(
    dataLoader: () => Promise<Array<{ key: string; value: any }>>,
    strategy: keyof typeof CACHE_STRATEGIES = 'API_CACHE'
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting cache warmup...');
      const data = await dataLoader();
      
      await this.batchSet(data, strategy);
      
      const duration = Date.now() - startTime;
      logger.info(`Cache warmup completed: ${data.length} items in ${duration}ms`);
    } catch (error: any) {
      errorMonitor.captureException(error, {
        tags: { type: 'cache_warmup_error' },
        extra: { strategy },
      });
      logger.error('Cache warmup failed', { error: error.message });
    }
  }

  /**
   * 缓存统计信息
   */
  async getCacheStats(): Promise<{
    memory: { used: string; peak: string; percentage: number };
    connections: { connected: number; total: number };
    keyspace: { total: number; expires: number };
    performance: { hits: number; misses: number; hitRate: number };
  }> {
    try {
      const connection = await this.connectionPool.acquireConnection();
      const info = await connection.info();
      
      // 解析Redis INFO命令输出
      const lines = info.split('\r\n');
      const stats: any = {};
      
      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });
      
      return {
        memory: {
          used: stats.used_memory_human || '0B',
          peak: stats.used_memory_peak_human || '0B',
          percentage: parseFloat(stats.used_memory_percentage || '0'),
        },
        connections: {
          connected: parseInt(stats.connected_clients || '0'),
          total: parseInt(stats.total_connections_received || '0'),
        },
        keyspace: {
          total: parseInt(stats.db0?.split(',')[0]?.split('=')[1] || '0'),
          expires: parseInt(stats.db0?.split(',')[1]?.split('=')[1] || '0'),
        },
        performance: {
          hits: parseInt(stats.keyspace_hits || '0'),
          misses: parseInt(stats.keyspace_misses || '0'),
          hitRate: parseFloat(stats.keyspace_hits || '0') / 
                  (parseFloat(stats.keyspace_hits || '0') + parseFloat(stats.keyspace_misses || '0')) * 100,
        },
      };
    } catch (error: any) {
      errorMonitor.captureException(error, {
        tags: { type: 'cache_stats_error' },
      });
      throw error;
    }
  }

  /**
   * 数据压缩
   */
  private async compressData(data: string): Promise<string> {
    // 这里可以实现实际的压缩算法，如gzip或lz4
    // 简化版本，实际应用中应使用专业压缩库
    return data;
  }

  /**
   * 数据解压缩
   */
  private async decompressData(data: string): Promise<string> {
    // 对应的解压缩逻辑
    return data;
  }
}

// 导出高性能缓存管理器实例
export const advancedCache = new AdvancedCacheManager();