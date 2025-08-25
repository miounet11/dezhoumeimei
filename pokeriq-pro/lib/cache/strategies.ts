import { cache, CACHE_KEYS, CACHE_TTL } from './redis';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cache-strategies');

/**
 * 缓存策略接口
 */
interface CacheStrategy<T> {
  key: string;
  ttl?: number;
  fetch: () => Promise<T>;
}

/**
 * 通用缓存策略：Cache-Aside (Lazy Loading)
 * 先查缓存，缓存没有则查数据库并缓存
 */
export async function cacheAside<T>(
  strategy: CacheStrategy<T>
): Promise<T | null> {
  try {
    // 1. 尝试从缓存获取
    const cached = await cache.get<T>(strategy.key);
    if (cached !== null) {
      logger.debug('Cache hit', { key: strategy.key });
      return cached;
    }

    // 2. 缓存未命中，从数据源获取
    logger.debug('Cache miss', { key: strategy.key });
    const data = await strategy.fetch();
    
    if (data !== null) {
      // 3. 写入缓存
      await cache.set(strategy.key, data, strategy.ttl);
    }
    
    return data;
  } catch (error) {
    logger.error('Cache-aside strategy error', { key: strategy.key, error });
    // 降级：直接从数据源获取
    return strategy.fetch();
  }
}

/**
 * Write-Through 策略
 * 同时更新缓存和数据库
 */
export async function writeThrough<T>(
  key: string,
  data: T,
  persist: () => Promise<void>,
  ttl?: number
): Promise<boolean> {
  try {
    // 1. 更新数据库
    await persist();
    
    // 2. 更新缓存
    await cache.set(key, data, ttl);
    
    return true;
  } catch (error) {
    logger.error('Write-through strategy error', { key, error });
    return false;
  }
}

/**
 * 缓存预热策略
 * 提前加载热点数据到缓存
 */
export async function warmupCache(
  items: Array<{ key: string; data: any; ttl?: number }>
): Promise<void> {
  try {
    logger.info('Starting cache warmup', { count: items.length });
    
    const promises = items.map(item =>
      cache.set(item.key, item.data, item.ttl)
    );
    
    await Promise.all(promises);
    
    logger.info('Cache warmup completed');
  } catch (error) {
    logger.error('Cache warmup error', { error });
  }
}

/**
 * 用户数据缓存策略
 */
export class UserCacheStrategy {
  static async getUser(userId: string, fetch: () => Promise<any>) {
    return cacheAside({
      key: `${CACHE_KEYS.USER}${userId}`,
      ttl: CACHE_TTL.LONG,
      fetch,
    });
  }

  static async invalidateUser(userId: string) {
    return cache.delete(`${CACHE_KEYS.USER}${userId}`);
  }

  static async getUserStats(userId: string, fetch: () => Promise<any>) {
    return cacheAside({
      key: `${CACHE_KEYS.STATS}${userId}`,
      ttl: CACHE_TTL.MEDIUM,
      fetch,
    });
  }

  static async invalidateUserStats(userId: string) {
    return cache.delete(`${CACHE_KEYS.STATS}${userId}`);
  }
}

/**
 * 会话缓存策略
 */
export class SessionCacheStrategy {
  static async getSession(sessionId: string, fetch: () => Promise<any>) {
    return cacheAside({
      key: `${CACHE_KEYS.SESSION}${sessionId}`,
      ttl: CACHE_TTL.DAY,
      fetch,
    });
  }

  static async setSession(sessionId: string, data: any) {
    return cache.set(
      `${CACHE_KEYS.SESSION}${sessionId}`,
      data,
      CACHE_TTL.DAY
    );
  }

  static async invalidateSession(sessionId: string) {
    return cache.delete(`${CACHE_KEYS.SESSION}${sessionId}`);
  }

  static async extendSession(sessionId: string) {
    return cache.expire(`${CACHE_KEYS.SESSION}${sessionId}`, CACHE_TTL.DAY);
  }
}

/**
 * 排行榜缓存策略
 */
export class LeaderboardCacheStrategy {
  static async getLeaderboard(
    type: string,
    category: string,
    fetch: () => Promise<any>
  ) {
    return cacheAside({
      key: `${CACHE_KEYS.LEADERBOARD}${type}:${category}`,
      ttl: CACHE_TTL.SHORT,
      fetch,
    });
  }

  static async invalidateLeaderboard(type: string, category: string) {
    return cache.delete(`${CACHE_KEYS.LEADERBOARD}${type}:${category}`);
  }

  static async invalidateAllLeaderboards() {
    return cache.deletePattern(`${CACHE_KEYS.LEADERBOARD}*`);
  }
}

/**
 * 成就缓存策略
 */
export class AchievementCacheStrategy {
  static async getUserAchievements(userId: string, fetch: () => Promise<any>) {
    return cacheAside({
      key: `${CACHE_KEYS.ACHIEVEMENT}user:${userId}`,
      ttl: CACHE_TTL.LONG,
      fetch,
    });
  }

  static async invalidateUserAchievements(userId: string) {
    return cache.delete(`${CACHE_KEYS.ACHIEVEMENT}user:${userId}`);
  }

  static async getAllAchievements(fetch: () => Promise<any>) {
    return cacheAside({
      key: `${CACHE_KEYS.ACHIEVEMENT}all`,
      ttl: CACHE_TTL.DAY,
      fetch,
    });
  }
}

/**
 * 训练数据缓存策略
 */
export class TrainingCacheStrategy {
  static async getTrainingSessions(
    userId: string,
    fetch: () => Promise<any>
  ) {
    return cacheAside({
      key: `${CACHE_KEYS.TRAINING}sessions:${userId}`,
      ttl: CACHE_TTL.MEDIUM,
      fetch,
    });
  }

  static async getTrainingScenario(
    scenarioId: string,
    fetch: () => Promise<any>
  ) {
    return cacheAside({
      key: `${CACHE_KEYS.TRAINING}scenario:${scenarioId}`,
      ttl: CACHE_TTL.DAY,
      fetch,
    });
  }

  static async invalidateUserTraining(userId: string) {
    return cache.deletePattern(`${CACHE_KEYS.TRAINING}*:${userId}`);
  }
}

/**
 * AI伴侣智能缓存策略 - Enhanced for 100万+并发用户
 * 支持多层缓存、实时状态管理和情感状态缓存
 */
export class CompanionCacheStrategy {
  // 缓存键命名空间
  private static readonly KEYS = {
    USER_COMPANIONS: 'companion:user:',
    COMPANION_DATA: 'companion:data:',
    EMOTIONAL_STATE: 'companion:emotion:',
    CONVERSATION_HISTORY: 'companion:history:',
    MEMORY_DATA: 'companion:memory:',
    ROLE_TEMPLATE: 'companion:role:',
    INTERACTION_SESSION: 'companion:session:',
    PERSONALITY_CACHE: 'companion:personality:',
    AI_RESPONSE_CACHE: 'companion:response:',
    LEARNING_PROFILE: 'companion:learning:',
  } as const;

  /**
   * 获取用户伴侣列表（带智能预加载）
   */
  static async getUserCompanions(userId: string, fetch: () => Promise<any>) {
    const result = await cacheAside({
      key: `${this.KEYS.USER_COMPANIONS}${userId}`,
      ttl: CACHE_TTL.LONG,
      fetch,
    });

    // 智能预加载：异步预加载常用伴侣数据
    if (result && Array.isArray(result)) {
      this.preloadCompanionData(result.slice(0, 3)); // 预加载前3个伴侣
    }

    return result;
  }

  /**
   * 获取伴侣基础数据（分层缓存）
   */
  static async getCompanionData(companionId: string, fetch: () => Promise<any>) {
    return cacheAside({
      key: `${this.KEYS.COMPANION_DATA}${companionId}`,
      ttl: CACHE_TTL.DAY,
      fetch,
    });
  }

  /**
   * 获取/设置情感状态（超短TTL，实时更新）
   */
  static async getEmotionalState(userCompanionId: string, fetch: () => Promise<any>) {
    return cacheAside({
      key: `${this.KEYS.EMOTIONAL_STATE}${userCompanionId}`,
      ttl: 300, // 5分钟TTL，快速更新
      fetch,
    });
  }

  static async setEmotionalState(userCompanionId: string, emotionalData: any) {
    const key = `${this.KEYS.EMOTIONAL_STATE}${userCompanionId}`;
    
    // 写入缓存并设置较短TTL
    await cache.set(key, emotionalData, 300);
    
    // 异步更新相关缓存
    this.invalidateRelatedCaches(userCompanionId);
  }

  /**
   * 对话历史缓存（按会话ID分组）
   */
  static async getConversationHistory(
    sessionId: string, 
    limit: number = 50,
    fetch: () => Promise<any>
  ) {
    return cacheAside({
      key: `${this.KEYS.CONVERSATION_HISTORY}${sessionId}:${limit}`,
      ttl: CACHE_TTL.MEDIUM,
      fetch,
    });
  }

  /**
   * 记忆数据缓存（按重要性分层）
   */
  static async getCompanionMemories(
    userCompanionId: string,
    importance: number,
    fetch: () => Promise<any>
  ) {
    const key = `${this.KEYS.MEMORY_DATA}${userCompanionId}:${importance}`;
    
    return cacheAside({
      key,
      ttl: importance >= 5 ? CACHE_TTL.DAY : CACHE_TTL.LONG, // 重要记忆缓存更久
      fetch,
    });
  }

  /**
   * 角色模板缓存
   */
  static async getRoleTemplate(roleId: string, fetch: () => Promise<any>) {
    return cacheAside({
      key: `${this.KEYS.ROLE_TEMPLATE}${roleId}`,
      ttl: CACHE_TTL.DAY,
      fetch,
    });
  }

  /**
   * 实时交互会话缓存
   */
  static async getInteractionSession(sessionId: string, fetch: () => Promise<any>) {
    return cacheAside({
      key: `${this.KEYS.INTERACTION_SESSION}${sessionId}`,
      ttl: CACHE_TTL.SHORT, // 短TTL保持实时性
      fetch,
    });
  }

  static async setInteractionSession(sessionId: string, sessionData: any) {
    return cache.set(
      `${this.KEYS.INTERACTION_SESSION}${sessionId}`,
      sessionData,
      CACHE_TTL.SHORT
    );
  }

  /**
   * 个性化配置缓存
   */
  static async getPersonalityCache(companionId: string, userId: string, fetch: () => Promise<any>) {
    return cacheAside({
      key: `${this.KEYS.PERSONALITY_CACHE}${companionId}:${userId}`,
      ttl: CACHE_TTL.LONG,
      fetch,
    });
  }

  /**
   * AI回复缓存（减少重复计算）
   */
  static async getAIResponseCache(
    prompt: string,
    companionId: string,
    contextHash: string,
    fetch: () => Promise<any>
  ) {
    // 为相似对话缓存AI回复
    const cacheKey = `${this.KEYS.AI_RESPONSE_CACHE}${companionId}:${contextHash}`;
    
    return cacheAside({
      key: cacheKey,
      ttl: CACHE_TTL.MEDIUM,
      fetch,
    });
  }

  /**
   * 学习档案缓存
   */
  static async getLearningProfile(userCompanionId: string, fetch: () => Promise<any>) {
    return cacheAside({
      key: `${this.KEYS.LEARNING_PROFILE}${userCompanionId}`,
      ttl: CACHE_TTL.LONG,
      fetch,
    });
  }

  /**
   * 批量预加载伴侣数据（性能优化）
   */
  private static async preloadCompanionData(companions: any[]) {
    try {
      const preloadPromises = companions.map(companion => {
        const key = `${this.KEYS.COMPANION_DATA}${companion.id}`;
        
        // 检查缓存是否存在，不存在则预加载
        return cache.exists(key).then(exists => {
          if (!exists && companion.id) {
            // 这里可以调用实际的数据获取函数
            logger.debug('Preloading companion data', { companionId: companion.id });
          }
        });
      });

      await Promise.all(preloadPromises);
    } catch (error) {
      logger.warn('Companion data preload failed', { error });
    }
  }

  /**
   * 智能缓存失效（基于关联性）
   */
  private static async invalidateRelatedCaches(userCompanionId: string) {
    try {
      // 异步失效相关缓存，不阻塞主流程
      setTimeout(async () => {
        await Promise.all([
          cache.deletePattern(`${this.KEYS.INTERACTION_SESSION}*${userCompanionId}*`),
          cache.deletePattern(`${this.KEYS.AI_RESPONSE_CACHE}*${userCompanionId}*`),
        ]);
      }, 0);
    } catch (error) {
      logger.warn('Related cache invalidation failed', { userCompanionId, error });
    }
  }

  /**
   * 会话上下文缓存管理
   */
  static async setSessionContext(
    sessionId: string,
    context: {
      userId: string;
      companionId: string;
      roleId?: string;
      emotionalState?: any;
      gameContext?: any;
    }
  ) {
    const key = `${this.KEYS.INTERACTION_SESSION}${sessionId}:context`;
    
    // 设置较长TTL以保持会话连续性
    return cache.set(key, context, CACHE_TTL.MEDIUM);
  }

  static async getSessionContext(sessionId: string) {
    const key = `${this.KEYS.INTERACTION_SESSION}${sessionId}:context`;
    return cache.get(key);
  }

  /**
   * 热点数据预热
   */
  static async warmupPopularCompanions(companionIds: string[]) {
    try {
      logger.info('Starting companion cache warmup', { count: companionIds.length });
      
      const warmupPromises = companionIds.map(async (companionId) => {
        const key = `${this.KEYS.COMPANION_DATA}${companionId}`;
        
        // 检查是否已缓存，避免重复加载
        const exists = await cache.exists(key);
        if (!exists) {
          // 这里应该调用实际的数据加载函数
          logger.debug('Warming up companion data', { companionId });
        }
      });

      await Promise.all(warmupPromises);
      logger.info('Companion cache warmup completed');
    } catch (error) {
      logger.error('Companion cache warmup failed', { error });
    }
  }

  /**
   * 缓存失效策略
   */
  static async invalidateUserCompanions(userId: string) {
    return cache.delete(`${this.KEYS.USER_COMPANIONS}${userId}`);
  }

  static async invalidateCompanionData(companionId: string) {
    return cache.delete(`${this.KEYS.COMPANION_DATA}${companionId}`);
  }

  static async invalidateEmotionalState(userCompanionId: string) {
    return cache.delete(`${this.KEYS.EMOTIONAL_STATE}${userCompanionId}`);
  }

  static async invalidateConversationHistory(sessionId: string) {
    return cache.deletePattern(`${this.KEYS.CONVERSATION_HISTORY}${sessionId}*`);
  }

  static async invalidateUserCompanionData(userId: string, companionId: string) {
    const patterns = [
      `${this.KEYS.USER_COMPANIONS}${userId}`,
      `${this.KEYS.EMOTIONAL_STATE}*${userId}*${companionId}*`,
      `${this.KEYS.MEMORY_DATA}*${userId}*${companionId}*`,
      `${this.KEYS.LEARNING_PROFILE}*${userId}*${companionId}*`,
      `${this.KEYS.PERSONALITY_CACHE}${companionId}:${userId}`,
    ];

    for (const pattern of patterns) {
      await cache.deletePattern(pattern);
    }

    logger.info('User companion cache invalidated', { userId, companionId });
  }

  /**
   * 缓存统计信息
   */
  static async getCacheStats() {
    try {
      const stats = {
        companionDataCached: 0,
        emotionalStatesCached: 0,
        conversationHistoriesCached: 0,
        memoriesCached: 0,
        sessionsCached: 0,
      };

      // 这里可以实现具体的统计逻辑
      // 由于Redis keys命令在生产环境性能不佳，建议使用计数器

      return stats;
    } catch (error) {
      logger.error('Failed to get cache stats', { error });
      return null;
    }
  }
}

/**
 * 速率限制策略
 */
export class RateLimitStrategy {
  static async checkRateLimit(
    identifier: string,
    limit: number,
    window: number = 60
  ): Promise<boolean> {
    const key = `${CACHE_KEYS.RATE_LIMIT}${identifier}`;
    
    try {
      const current = await cache.increment(key);
      
      if (current === 1) {
        // 第一次请求，设置过期时间
        await cache.expire(key, window);
      }
      
      if (current && current > limit) {
        logger.warn('Rate limit exceeded', { identifier, current, limit });
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Rate limit check error', { identifier, error });
      // 错误时允许通过，避免阻塞正常请求
      return true;
    }
  }

  static async getRemainingLimit(
    identifier: string,
    limit: number
  ): Promise<number> {
    const key = `${CACHE_KEYS.RATE_LIMIT}${identifier}`;
    
    try {
      const current = await cache.get<number>(key) || 0;
      return Math.max(0, limit - current);
    } catch (error) {
      logger.error('Get remaining limit error', { identifier, error });
      return limit;
    }
  }

  static async resetRateLimit(identifier: string): Promise<boolean> {
    const key = `${CACHE_KEYS.RATE_LIMIT}${identifier}`;
    return cache.delete(key);
  }
}

/**
 * 缓存失效策略管理器
 */
export class CacheInvalidationManager {
  /**
   * 用户数据更新时的缓存失效
   */
  static async onUserUpdate(userId: string) {
    await Promise.all([
      UserCacheStrategy.invalidateUser(userId),
      UserCacheStrategy.invalidateUserStats(userId),
      AchievementCacheStrategy.invalidateUserAchievements(userId),
      TrainingCacheStrategy.invalidateUserTraining(userId),
      CompanionCacheStrategy.invalidateUserCompanions(userId),
    ]);
    
    logger.info('User cache invalidated', { userId });
  }

  /**
   * 游戏结束时的缓存失效
   */
  static async onGameEnd(userId: string) {
    await Promise.all([
      UserCacheStrategy.invalidateUserStats(userId),
      LeaderboardCacheStrategy.invalidateAllLeaderboards(),
      TrainingCacheStrategy.invalidateUserTraining(userId),
    ]);
    
    logger.info('Game-related cache invalidated', { userId });
  }

  /**
   * 成就解锁时的缓存失效
   */
  static async onAchievementUnlock(userId: string) {
    await AchievementCacheStrategy.invalidateUserAchievements(userId);
    logger.info('Achievement cache invalidated', { userId });
  }

  /**
   * 伴侣互动时的缓存失效
   */
  static async onCompanionInteraction(userId: string, companionId: string, userCompanionId: string) {
    await Promise.all([
      CompanionCacheStrategy.invalidateEmotionalState(userCompanionId),
      CompanionCacheStrategy.invalidateUserCompanions(userId),
      // 不立即失效学习档案，因为需要积累数据
    ]);
    
    logger.info('Companion interaction cache invalidated', { userId, companionId });
  }

  /**
   * 伴侣升级时的缓存失效
   */
  static async onCompanionLevelUp(userId: string, companionId: string, userCompanionId: string) {
    await Promise.all([
      CompanionCacheStrategy.invalidateUserCompanionData(userId, companionId),
      CompanionCacheStrategy.invalidateEmotionalState(userCompanionId),
      UserCacheStrategy.invalidateUser(userId), // 用户数据也可能受影响
    ]);
    
    logger.info('Companion level up cache invalidated', { userId, companionId });
  }

  /**
   * 全局伴侣数据更新时的缓存失效
   */
  static async onGlobalCompanionUpdate(companionId: string) {
    await CompanionCacheStrategy.invalidateCompanionData(companionId);
    logger.info('Global companion data cache invalidated', { companionId });
  }
  
  /**
   * 清空所有用户相关缓存
   */
  static async clearUserCache(userId: string) {
    const patterns = [
      `${CACHE_KEYS.USER}${userId}*`,
      `${CACHE_KEYS.SESSION}*${userId}*`,
      `${CACHE_KEYS.STATS}${userId}*`,
      `${CACHE_KEYS.ACHIEVEMENT}*${userId}*`,
      `${CACHE_KEYS.TRAINING}*${userId}*`,
      `${CACHE_KEYS.COMPANION}*${userId}*`,
    ];
    
    for (const pattern of patterns) {
      await cache.deletePattern(pattern);
    }
    
    logger.info('All user cache cleared', { userId });
  }
}