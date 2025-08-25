/**
 * PokerIQ Pro - Redis 高性能缓存策略
 * 针对实时游戏数据和用户状态优化
 */

import { Redis } from 'ioredis';
import { dbManager } from '@/database/database-config';

export interface CacheConfig {
  ttl: number; // 生存时间（秒）
  namespace: string;
  compress?: boolean;
  version?: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

/**
 * Redis 缓存管理器
 * 支持多级缓存、自动失效、压缩存储
 */
export class RedisCacheManager {
  private redis: Redis;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };

  constructor(redisInstance: 'primary' | 'cache' = 'cache') {
    this.redis = dbManager.getRedis(redisInstance);
  }

  /**
   * 获取缓存数据
   */
  async get<T>(key: string, config?: Partial<CacheConfig>): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, config?.namespace);
      const data = await this.redis.get(fullKey);
      
      if (data === null) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      
      // 解压缩和反序列化
      return config?.compress 
        ? JSON.parse(this.decompress(data))
        : JSON.parse(data);
    } catch (error) {
      this.metrics.errors++;
      console.error('Redis cache get error:', error);
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T>(
    key: string, 
    value: T, 
    config: CacheConfig
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, config.namespace);
      let data = JSON.stringify(value);
      
      // 压缩大数据
      if (config.compress && data.length > 1024) {
        data = this.compress(data);
      }

      const result = await this.redis.setex(fullKey, config.ttl, data);
      this.metrics.sets++;
      
      return result === 'OK';
    } catch (error) {
      this.metrics.errors++;
      console.error('Redis cache set error:', error);
      return false;
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string, namespace?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const result = await this.redis.del(fullKey);
      this.metrics.deletes++;
      
      return result > 0;
    } catch (error) {
      this.metrics.errors++;
      console.error('Redis cache delete error:', error);
      return false;
    }
  }

  /**
   * 批量删除（模式匹配）
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await this.redis.del(...keys);
      this.metrics.deletes += result;
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      console.error('Redis cache pattern delete error:', error);
      return 0;
    }
  }

  /**
   * 获取或设置缓存（缓存未命中时自动获取并缓存）
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const cached = await this.get<T>(key, config);
    
    if (cached !== null) {
      return cached;
    }

    // 防止缓存雪崩 - 使用分布式锁
    const lockKey = `lock:${this.buildKey(key, config.namespace)}`;
    const lockTtl = 30; // 锁定30秒
    
    const acquired = await this.redis.set(lockKey, '1', 'EX', lockTtl, 'NX');
    
    if (acquired === 'OK') {
      try {
        const data = await fetcher();
        await this.set(key, data, config);
        await this.redis.del(lockKey);
        return data;
      } catch (error) {
        await this.redis.del(lockKey);
        throw error;
      }
    } else {
      // 等待其他进程完成数据获取
      await this.sleep(100);
      const retryResult = await this.get<T>(key, config);
      return retryResult || await fetcher();
    }
  }

  /**
   * 哈希缓存操作
   */
  async hget<T>(hashKey: string, field: string, namespace?: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(hashKey, namespace);
      const data = await this.redis.hget(fullKey, field);
      
      if (data === null) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      return JSON.parse(data);
    } catch (error) {
      this.metrics.errors++;
      console.error('Redis hash get error:', error);
      return null;
    }
  }

  async hset<T>(
    hashKey: string, 
    field: string, 
    value: T, 
    config: CacheConfig
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(hashKey, config.namespace);
      const data = JSON.stringify(value);
      
      await this.redis.hset(fullKey, field, data);
      await this.redis.expire(fullKey, config.ttl);
      
      this.metrics.sets++;
      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error('Redis hash set error:', error);
      return false;
    }
  }

  /**
   * 列表缓存操作
   */
  async lpush<T>(listKey: string, value: T, maxLength?: number, namespace?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(listKey, namespace);
      const data = JSON.stringify(value);
      
      const length = await this.redis.lpush(fullKey, data);
      
      // 限制列表长度
      if (maxLength && length > maxLength) {
        await this.redis.ltrim(fullKey, 0, maxLength - 1);
      }
      
      return length;
    } catch (error) {
      this.metrics.errors++;
      console.error('Redis list push error:', error);
      return 0;
    }
  }

  async lrange<T>(listKey: string, start: number, stop: number, namespace?: string): Promise<T[]> {
    try {
      const fullKey = this.buildKey(listKey, namespace);
      const data = await this.redis.lrange(fullKey, start, stop);
      
      return data.map(item => JSON.parse(item));
    } catch (error) {
      this.metrics.errors++;
      console.error('Redis list range error:', error);
      return [];
    }
  }

  /**
   * 有序集合操作（排行榜）
   */
  async zadd(key: string, score: number, member: string, namespace?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, namespace);
      return await this.redis.zadd(fullKey, score, member);
    } catch (error) {
      this.metrics.errors++;
      console.error('Redis zadd error:', error);
      return 0;
    }
  }

  async zrevrange(
    key: string, 
    start: number, 
    stop: number, 
    withScores: boolean = false,
    namespace?: string
  ): Promise<string[]> {
    try {
      const fullKey = this.buildKey(key, namespace);
      
      if (withScores) {
        return await this.redis.zrevrange(fullKey, start, stop, 'WITHSCORES');
      } else {
        return await this.redis.zrevrange(fullKey, start, stop);
      }
    } catch (error) {
      this.metrics.errors++;
      console.error('Redis zrevrange error:', error);
      return [];
    }
  }

  /**
   * 原子操作 - 增量
   */
  async incr(key: string, by: number = 1, namespace?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, namespace);
      return by === 1 
        ? await this.redis.incr(fullKey)
        : await this.redis.incrby(fullKey, by);
    } catch (error) {
      this.metrics.errors++;
      console.error('Redis incr error:', error);
      return 0;
    }
  }

  /**
   * 获取缓存指标
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * 重置指标
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  /**
   * 计算缓存命中率
   */
  getHitRate(): number {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? this.metrics.hits / total : 0;
  }

  /**
   * 构建完整的键名
   */
  private buildKey(key: string, namespace?: string): string {
    const ns = namespace || 'pokeriq';
    return `${ns}:${key}`;
  }

  /**
   * 简单的压缩算法（实际应用中应使用更好的算法）
   */
  private compress(data: string): string {
    // 这里应该实现真正的压缩算法
    return Buffer.from(data).toString('base64');
  }

  private decompress(data: string): string {
    return Buffer.from(data, 'base64').toString('utf-8');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 扑克游戏专用缓存配置
 */
export const CacheConfigs = {
  // 用户伴侣数据 - 缓存5分钟
  USER_COMPANIONS: {
    ttl: 300,
    namespace: 'companions',
    compress: true
  },

  // 游戏状态 - 缓存30秒
  GAME_STATE: {
    ttl: 30,
    namespace: 'game',
    compress: false
  },

  // 排行榜 - 缓存10分钟
  LEADERBOARD: {
    ttl: 600,
    namespace: 'leaderboard',
    compress: true
  },

  // 用户统计 - 缓存2分钟
  USER_STATS: {
    ttl: 120,
    namespace: 'stats',
    compress: true
  },

  // 训练场景 - 缓存1小时
  TRAINING_SCENARIOS: {
    ttl: 3600,
    namespace: 'training',
    compress: true
  },

  // AI 对手配置 - 缓存30分钟
  AI_OPPONENTS: {
    ttl: 1800,
    namespace: 'opponents',
    compress: true
  },

  // 实时聊天 - 缓存5分钟
  CHAT_MESSAGES: {
    ttl: 300,
    namespace: 'chat',
    compress: false
  }
} as const;

// 导出单例实例
export const cacheManager = new RedisCacheManager('cache');
export default cacheManager;