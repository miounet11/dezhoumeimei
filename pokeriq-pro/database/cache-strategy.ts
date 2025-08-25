/**
 * PokerIQ Pro - Redis 缓存策略实现
 * 高性能分层缓存架构
 * 支持热点数据缓存、会话管理、实时状态等
 */

import Redis from 'ioredis';
import { getDB } from './database-config';

// ===== 缓存配置常量 =====
export const CACHE_CONFIG = {
  // 缓存键前缀
  PREFIXES: {
    USER: 'user:',
    SESSION: 'session:',
    GAME: 'game:',
    STATS: 'stats:',
    LEADERBOARD: 'leaderboard:',
    GTO: 'gto:',
    TRAINING: 'training:',
    ACHIEVEMENT: 'achievement:',
    COMPANION: 'companion:',
    RATE_LIMIT: 'rate_limit:',
    LOCK: 'lock:',
    QUEUE: 'queue:',
    ANALYTICS: 'analytics:'
  },
  
  // 缓存TTL（秒）
  TTL: {
    USER_PROFILE: 3600 * 24,      // 24小时
    USER_STATS: 3600 * 2,         // 2小时
    USER_SESSION: 3600 * 12,      // 12小时
    GAME_STATE: 300,              // 5分钟
    LEADERBOARD: 600,             // 10分钟
    GTO_SOLUTION: 3600 * 24 * 7,  // 7天
    TRAINING_CONFIG: 3600,        // 1小时
    ACHIEVEMENT_PROGRESS: 1800,   // 30分钟
    COMPANION_STATUS: 900,        // 15分钟
    RATE_LIMIT: 3600,             // 1小时
    ANALYTICS: 3600 * 6,          // 6小时
    SHORT: 300,                   // 5分钟（通用短期）
    MEDIUM: 1800,                 // 30分钟（通用中期）
    LONG: 3600 * 24               // 24小时（通用长期）
  },
  
  // 缓存策略
  STRATEGIES: {
    WRITE_THROUGH: 'write_through',
    WRITE_BEHIND: 'write_behind',
    WRITE_AROUND: 'write_around',
    READ_THROUGH: 'read_through',
    CACHE_ASIDE: 'cache_aside'
  }
};

// ===== 基础缓存管理器 =====
export class CacheManager {
  private redis: Redis;
  private fallbackRedis?: Redis;
  
  constructor(redisInstance: Redis, fallbackInstance?: Redis) {
    this.redis = redisInstance;
    this.fallbackRedis = fallbackInstance;
  }
  
  // 生成缓存键
  private generateKey(prefix: string, identifier: string, ...suffixes: string[]): string {
    const parts = [prefix, identifier, ...suffixes].filter(Boolean);
    return parts.join(':');
  }
  
  // 基础get操作
  async get<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) return defaultValue || null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      
      // 尝试fallback Redis
      if (this.fallbackRedis) {
        try {
          const value = await this.fallbackRedis.get(key);
          if (value !== null) {
            return JSON.parse(value) as T;
          }
        } catch (fallbackError) {
          console.error(`Fallback cache get error for key ${key}:`, fallbackError);
        }
      }
      
      return defaultValue || null;
    }
  }
  
  // 基础set操作
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttl && ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }
  
  // 批量获取
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];
      
      const values = await this.redis.mget(...keys);
      return values.map(value => {
        if (value === null) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error(`Cache mget error for keys ${keys}:`, error);
      return new Array(keys.length).fill(null);
    }
  }
  
  // 批量设置
  async mset(keyValues: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const [key, value] of Object.entries(keyValues)) {
        const serialized = JSON.stringify(value);
        if (ttl && ttl > 0) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error(`Cache mset error:`, error);
      return false;
    }
  }
  
  // 删除
  async del(key: string | string[]): Promise<number> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      return await this.redis.del(...keys);
    } catch (error) {
      console.error(`Cache del error:`, error);
      return 0;
    }
  }
  
  // 检查键是否存在
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }
  
  // 设置过期时间
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }
  
  // 原子性递增
  async incr(key: string, amount: number = 1): Promise<number> {
    try {
      if (amount === 1) {
        return await this.redis.incr(key);
      } else {
        return await this.redis.incrby(key, amount);
      }
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }
  
  // 模式匹配删除
  async delByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.redis.del(...keys);
    } catch (error) {
      console.error(`Cache delByPattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }
  
  // 获取键的TTL
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error(`Cache ttl error for key ${key}:`, error);
      return -1;
    }
  }
}

// ===== 用户缓存管理器 =====
export class UserCacheManager extends CacheManager {
  constructor() {
    super(getDB.redis.primary(), getDB.redis.cache());
  }
  
  // 用户基本信息缓存
  async getUserProfile(userId: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.USER, userId, 'profile');
    return await this.get(key);
  }
  
  async setUserProfile(userId: string, profile: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.USER, userId, 'profile');
    return await this.set(key, profile, CACHE_CONFIG.TTL.USER_PROFILE);
  }
  
  // 用户统计缓存
  async getUserStats(userId: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.USER, userId, 'stats');
    return await this.get(key);
  }
  
  async setUserStats(userId: string, stats: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.USER, userId, 'stats');
    return await this.set(key, stats, CACHE_CONFIG.TTL.USER_STATS);
  }
  
  // 批量获取用户基本信息
  async getMultipleUserProfiles(userIds: string[]): Promise<any[]> {
    const keys = userIds.map(userId => 
      this.generateKey(CACHE_CONFIG.PREFIXES.USER, userId, 'profile')
    );
    return await this.mget(keys);
  }
  
  // 用户在线状态
  async getUserOnlineStatus(userId: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.USER, userId, 'online');
    return await this.get(key);
  }
  
  async setUserOnlineStatus(userId: string, status: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.USER, userId, 'online');
    return await this.set(key, status, 300); // 5分钟TTL
  }
  
  // 用户权限缓存
  async getUserPermissions(userId: string): Promise<string[]> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.USER, userId, 'permissions');
    const permissions = await this.get<string[]>(key);
    return permissions || [];
  }
  
  async setUserPermissions(userId: string, permissions: string[]): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.USER, userId, 'permissions');
    return await this.set(key, permissions, CACHE_CONFIG.TTL.USER_SESSION);
  }
  
  // 清除用户相关缓存
  async clearUserCache(userId: string): Promise<void> {
    const pattern = this.generateKey(CACHE_CONFIG.PREFIXES.USER, userId, '*');
    await this.delByPattern(pattern);
  }
  
  private generateKey(prefix: string, userId: string, suffix: string): string {
    return `${prefix}${userId}:${suffix}`;
  }
}

// ===== 游戏缓存管理器 =====
export class GameCacheManager extends CacheManager {
  constructor() {
    super(getDB.redis.primary());
  }
  
  // 游戏状态缓存
  async getGameState(sessionId: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GAME, sessionId, 'state');
    return await this.get(key);
  }
  
  async setGameState(sessionId: string, gameState: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GAME, sessionId, 'state');
    return await this.set(key, gameState, CACHE_CONFIG.TTL.GAME_STATE);
  }
  
  // 游戏配置缓存
  async getGameConfig(configId: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GAME, configId, 'config');
    return await this.get(key);
  }
  
  async setGameConfig(configId: string, config: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GAME, configId, 'config');
    return await this.set(key, config, CACHE_CONFIG.TTL.TRAINING_CONFIG);
  }
  
  // 房间用户列表
  async getRoomUsers(roomId: string): Promise<string[]> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GAME, roomId, 'users');
    const users = await this.get<string[]>(key);
    return users || [];
  }
  
  async addUserToRoom(roomId: string, userId: string): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GAME, roomId, 'users');
    const users = await this.getRoomUsers(roomId);
    
    if (!users.includes(userId)) {
      users.push(userId);
      return await this.set(key, users, CACHE_CONFIG.TTL.GAME_STATE);
    }
    
    return true;
  }
  
  async removeUserFromRoom(roomId: string, userId: string): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GAME, roomId, 'users');
    const users = await this.getRoomUsers(roomId);
    
    const index = users.indexOf(userId);
    if (index > -1) {
      users.splice(index, 1);
      return await this.set(key, users, CACHE_CONFIG.TTL.GAME_STATE);
    }
    
    return true;
  }
  
  // 清除游戏相关缓存
  async clearGameCache(sessionId: string): Promise<void> {
    const pattern = this.generateKey(CACHE_CONFIG.PREFIXES.GAME, sessionId, '*');
    await this.delByPattern(pattern);
  }
  
  private generateKey(prefix: string, identifier: string, suffix: string): string {
    return `${prefix}${identifier}:${suffix}`;
  }
}

// ===== GTO缓存管理器 =====
export class GTOCacheManager extends CacheManager {
  constructor() {
    super(getDB.redis.cache());
  }
  
  // GTO解决方案缓存
  async getGTOSolution(solutionHash: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GTO, solutionHash);
    return await this.get(key);
  }
  
  async setGTOSolution(solutionHash: string, solution: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GTO, solutionHash);
    return await this.set(key, solution, CACHE_CONFIG.TTL.GTO_SOLUTION);
  }
  
  // 手牌范围缓存
  async getHandRange(rangeHash: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GTO, 'range', rangeHash);
    return await this.get(key);
  }
  
  async setHandRange(rangeHash: string, range: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GTO, 'range', rangeHash);
    return await this.set(key, range, CACHE_CONFIG.TTL.GTO_SOLUTION);
  }
  
  // 策略缓存
  async getStrategy(contextHash: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GTO, 'strategy', contextHash);
    return await this.get(key);
  }
  
  async setStrategy(contextHash: string, strategy: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.GTO, 'strategy', contextHash);
    return await this.set(key, strategy, CACHE_CONFIG.TTL.GTO_SOLUTION);
  }
  
  private generateKey(prefix: string, ...parts: string[]): string {
    return [prefix, ...parts].join(':');
  }
}

// ===== 排行榜缓存管理器 =====
export class LeaderboardCacheManager extends CacheManager {
  constructor() {
    super(getDB.redis.primary());
  }
  
  // 排行榜数据缓存
  async getLeaderboard(type: string, period: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.LEADERBOARD, type, period);
    return await this.get(key);
  }
  
  async setLeaderboard(type: string, period: string, data: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.LEADERBOARD, type, period);
    return await this.set(key, data, CACHE_CONFIG.TTL.LEADERBOARD);
  }
  
  // 用户排名缓存
  async getUserRank(userId: string, type: string, period: string): Promise<number | null> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.LEADERBOARD, 'user', userId, type, period);
    return await this.get<number>(key);
  }
  
  async setUserRank(userId: string, type: string, period: string, rank: number): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.LEADERBOARD, 'user', userId, type, period);
    return await this.set(key, rank, CACHE_CONFIG.TTL.LEADERBOARD);
  }
  
  // 刷新所有排行榜缓存
  async refreshAllLeaderboards(): Promise<void> {
    const pattern = `${CACHE_CONFIG.PREFIXES.LEADERBOARD}*`;
    await this.delByPattern(pattern);
  }
  
  private generateKey(prefix: string, ...parts: string[]): string {
    return [prefix, ...parts].join(':');
  }
}

// ===== 限流缓存管理器 =====
export class RateLimitCacheManager extends CacheManager {
  constructor() {
    super(getDB.redis.primary());
  }
  
  // 检查限流
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    key?: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const rateLimitKey = key || this.generateKey(CACHE_CONFIG.PREFIXES.RATE_LIMIT, identifier);
    
    try {
      // 使用滑动窗口限流算法
      const now = Date.now();
      const pipeline = this.redis.pipeline();
      
      // 清除过期的记录
      pipeline.zremrangebyscore(rateLimitKey, 0, now - windowMs);
      
      // 获取当前窗口内的请求数
      pipeline.zcard(rateLimitKey);
      
      // 添加当前请求
      pipeline.zadd(rateLimitKey, now, `${now}-${Math.random()}`);
      
      // 设置键的过期时间
      pipeline.expire(rateLimitKey, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      
      if (!results) {
        return { allowed: false, remaining: 0, resetTime: new Date(now + windowMs) };
      }
      
      const currentCount = (results[1][1] as number) || 0;
      const allowed = currentCount < limit;
      const remaining = Math.max(0, limit - currentCount - 1);
      const resetTime = new Date(now + windowMs);
      
      if (!allowed) {
        // 如果超出限制，移除刚才添加的请求记录
        await this.redis.zrem(rateLimitKey, `${now}-${Math.random()}`);
      }
      
      return { allowed, remaining, resetTime };
    } catch (error) {
      console.error(`Rate limit check error for ${identifier}:`, error);
      // 出错时默认允许请求
      return { allowed: true, remaining: limit - 1, resetTime: new Date() };
    }
  }
  
  // 重置限流计数
  async resetRateLimit(identifier: string, key?: string): Promise<boolean> {
    const rateLimitKey = key || this.generateKey(CACHE_CONFIG.PREFIXES.RATE_LIMIT, identifier);
    const result = await this.del(rateLimitKey);
    return result > 0;
  }
  
  private generateKey(prefix: string, identifier: string): string {
    return `${prefix}${identifier}`;
  }
}

// ===== 分布式锁管理器 =====
export class LockManager extends CacheManager {
  constructor() {
    super(getDB.redis.primary());
  }
  
  // 获取分布式锁
  async acquireLock(
    lockKey: string,
    ttlMs: number = 10000,
    identifier?: string
  ): Promise<string | null> {
    const lockId = identifier || `${Date.now()}-${Math.random()}`;
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.LOCK, lockKey);
    
    try {
      const result = await this.redis.set(key, lockId, 'PX', ttlMs, 'NX');
      return result === 'OK' ? lockId : null;
    } catch (error) {
      console.error(`Acquire lock error for ${lockKey}:`, error);
      return null;
    }
  }
  
  // 释放分布式锁
  async releaseLock(lockKey: string, lockId: string): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.LOCK, lockKey);
    
    // 使用 Lua 脚本确保原子性
    const luaScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    
    try {
      const result = await this.redis.eval(luaScript, 1, key, lockId);
      return result === 1;
    } catch (error) {
      console.error(`Release lock error for ${lockKey}:`, error);
      return false;
    }
  }
  
  // 扩展锁的生存时间
  async extendLock(lockKey: string, lockId: string, ttlMs: number): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.LOCK, lockKey);
    
    // 使用 Lua 脚本确保原子性
    const luaScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("PEXPIRE", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    
    try {
      const result = await this.redis.eval(luaScript, 1, key, lockId, ttlMs);
      return result === 1;
    } catch (error) {
      console.error(`Extend lock error for ${lockKey}:`, error);
      return false;
    }
  }
  
  // 尝试获取锁并执行操作
  async withLock<T>(
    lockKey: string,
    operation: () => Promise<T>,
    ttlMs: number = 10000
  ): Promise<T | null> {
    const lockId = await this.acquireLock(lockKey, ttlMs);
    
    if (!lockId) {
      console.warn(`Failed to acquire lock: ${lockKey}`);
      return null;
    }
    
    try {
      return await operation();
    } finally {
      await this.releaseLock(lockKey, lockId);
    }
  }
  
  private generateKey(prefix: string, lockKey: string): string {
    return `${prefix}${lockKey}`;
  }
}

// ===== 缓存管理器工厂 =====
export class CacheManagerFactory {
  private static userCacheManager: UserCacheManager;
  private static gameCacheManager: GameCacheManager;
  private static gtoCacheManager: GTOCacheManager;
  private static leaderboardCacheManager: LeaderboardCacheManager;
  private static rateLimitCacheManager: RateLimitCacheManager;
  private static lockManager: LockManager;
  
  static getUserCache(): UserCacheManager {
    if (!this.userCacheManager) {
      this.userCacheManager = new UserCacheManager();
    }
    return this.userCacheManager;
  }
  
  static getGameCache(): GameCacheManager {
    if (!this.gameCacheManager) {
      this.gameCacheManager = new GameCacheManager();
    }
    return this.gameCacheManager;
  }
  
  static getGTOCache(): GTOCacheManager {
    if (!this.gtoCacheManager) {
      this.gtoCacheManager = new GTOCacheManager();
    }
    return this.gtoCacheManager;
  }
  
  static getLeaderboardCache(): LeaderboardCacheManager {
    if (!this.leaderboardCacheManager) {
      this.leaderboardCacheManager = new LeaderboardCacheManager();
    }
    return this.leaderboardCacheManager;
  }
  
  static getRateLimitCache(): RateLimitCacheManager {
    if (!this.rateLimitCacheManager) {
      this.rateLimitCacheManager = new RateLimitCacheManager();
    }
    return this.rateLimitCacheManager;
  }
  
  static getLockManager(): LockManager {
    if (!this.lockManager) {
      this.lockManager = new LockManager();
    }
    return this.lockManager;
  }
}

// ===== 缓存预热策略 =====
export class CacheWarmupService {
  // 预热用户缓存
  static async warmupUserCache(userIds: string[]): Promise<void> {
    console.log(`Warming up cache for ${userIds.length} users`);
    
    const userCache = CacheManagerFactory.getUserCache();
    const batchSize = 50;
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (userId) => {
        try {
          // 预加载用户基本信息和统计
          const [profile, stats] = await Promise.all([
            this.loadUserProfileFromDB(userId),
            this.loadUserStatsFromDB(userId)
          ]);
          
          if (profile) {
            await userCache.setUserProfile(userId, profile);
          }
          
          if (stats) {
            await userCache.setUserStats(userId, stats);
          }
        } catch (error) {
          console.error(`Failed to warmup cache for user ${userId}:`, error);
        }
      }));
    }
    
    console.log('User cache warmup completed');
  }
  
  // 预热排行榜缓存
  static async warmupLeaderboardCache(): Promise<void> {
    console.log('Warming up leaderboard cache');
    
    const leaderboardCache = CacheManagerFactory.getLeaderboardCache();
    
    const leaderboardTypes = ['winRate', 'profit', 'hands', 'achievements'];
    const periods = ['daily', 'weekly', 'monthly', 'all_time'];
    
    await Promise.all(
      leaderboardTypes.flatMap(type =>
        periods.map(async (period) => {
          try {
            const data = await this.loadLeaderboardFromDB(type, period);
            if (data) {
              await leaderboardCache.setLeaderboard(type, period, data);
            }
          } catch (error) {
            console.error(`Failed to warmup leaderboard ${type}/${period}:`, error);
          }
        })
      )
    );
    
    console.log('Leaderboard cache warmup completed');
  }
  
  // 数据库加载函数（需要根据实际情况实现）
  private static async loadUserProfileFromDB(userId: string): Promise<any> {
    // 实现从数据库加载用户信息的逻辑
    return null;
  }
  
  private static async loadUserStatsFromDB(userId: string): Promise<any> {
    // 实现从数据库加载用户统计的逻辑
    return null;
  }
  
  private static async loadLeaderboardFromDB(type: string, period: string): Promise<any> {
    // 实现从数据库加载排行榜的逻辑
    return null;
  }
}

// ===== 导出便捷访问方法 =====
export const cache = {
  user: () => CacheManagerFactory.getUserCache(),
  game: () => CacheManagerFactory.getGameCache(),
  gto: () => CacheManagerFactory.getGTOCache(),
  leaderboard: () => CacheManagerFactory.getLeaderboardCache(),
  rateLimit: () => CacheManagerFactory.getRateLimitCache(),
  lock: () => CacheManagerFactory.getLockManager()
};

export default cache;