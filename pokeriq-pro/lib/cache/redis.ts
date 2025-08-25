import Redis from 'ioredis';
import { createLogger } from '@/lib/logger';

const logger = createLogger('redis');

// Redis 高性能连接配置 - 支持100万+并发用户
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  
  // 连接池配置
  family: 4, // IPv4
  connectTimeout: 60000,
  commandTimeout: 5000,
  lazyConnect: true,
  keepAlive: 30000,
  
  // 高并发优化配置
  maxRetriesPerRequest: 5,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  enableOfflineQueue: false,
  
  // 重试策略优化
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  
  // 连接池大小优化
  maxRedirections: 6,
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  },
  
  // 性能优化选项
  dropBufferSupport: false,
  enableAutoPipelining: true,
  maxPipelineLength: 50,
  
  // 集群配置支持
  ...(process.env.REDIS_CLUSTER === 'true' && {
    enableReadyCheck: false,
    enableOfflineQueue: false,
    redisOptions: {
      password: process.env.REDIS_PASSWORD,
    },
  }),
};

// 创建Redis客户端实例
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error', { error: error.message });
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  return redisClient;
}

// 缓存键前缀
export const CACHE_KEYS = {
  USER: 'user:',
  SESSION: 'session:',
  STATS: 'stats:',
  LEADERBOARD: 'leaderboard:',
  ACHIEVEMENT: 'achievement:',
  TRAINING: 'training:',
  COMPANION: 'companion:',
  RATE_LIMIT: 'rate_limit:',
} as const;

// 缓存TTL配置（秒）
export const CACHE_TTL = {
  SHORT: 60,           // 1分钟
  MEDIUM: 300,         // 5分钟
  LONG: 3600,          // 1小时
  DAY: 86400,          // 1天
  WEEK: 604800,        // 1周
} as const;

// 缓存操作包装类
export class CacheManager {
  private redis: Redis;

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * 获取缓存值
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * 设置缓存值
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error', { key, error });
      return false;
    }
  }

  /**
   * 批量删除缓存（通过模式匹配）
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        const result = await this.redis.del(...keys);
        return result;
      }
      return 0;
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error });
      return 0;
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result > 0;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      return false;
    }
  }

  /**
   * 设置缓存过期时间
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error', { key, ttl, error });
      return false;
    }
  }

  /**
   * 自增计数器
   */
  async increment(key: string, by: number = 1): Promise<number | null> {
    try {
      const result = await this.redis.incrby(key, by);
      return result;
    } catch (error) {
      logger.error('Cache increment error', { key, by, error });
      return null;
    }
  }

  /**
   * 自减计数器
   */
  async decrement(key: string, by: number = 1): Promise<number | null> {
    try {
      const result = await this.redis.decrby(key, by);
      return result;
    } catch (error) {
      logger.error('Cache decrement error', { key, by, error });
      return null;
    }
  }

  /**
   * 获取TTL
   */
  async ttl(key: string): Promise<number> {
    try {
      const result = await this.redis.ttl(key);
      return result;
    } catch (error) {
      logger.error('Cache ttl error', { key, error });
      return -1;
    }
  }

  /**
   * 批量获取
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => {
        if (value) {
          try {
            return JSON.parse(value) as T;
          } catch {
            return null;
          }
        }
        return null;
      });
    } catch (error) {
      logger.error('Cache mget error', { keys, error });
      return keys.map(() => null);
    }
  }

  /**
   * 批量设置
   */
  async mset(items: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const [key, value] of Object.entries(items)) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error', { error });
      return false;
    }
  }

  /**
   * 清空所有缓存（慎用）
   */
  async flushAll(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      logger.warn('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error', { error });
      return false;
    }
  }

  /**
   * 关闭连接
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Redis disconnect error', { error });
    }
  }
}

// 导出单例
export const cache = new CacheManager();