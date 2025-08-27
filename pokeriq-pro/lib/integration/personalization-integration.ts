/**
 * 个性化系统集成层
 * 连接前端组件与后端API，处理数据流和状态管理
 */

import { EventBus, EventType, EventPublisher } from './event-bus';
import { PersonalizationEngine, TrainingRecommendation, PersonalizedTrainingPlan } from '../personalization/recommendation-engine';
import { UserProfiler, UserSkillProfile } from '../personalization/user-profiler';
import { createEventBus } from './event-bus';
import { createLogger } from '../logger';
import { Redis } from 'ioredis';

const logger = createLogger('personalization-integration');

export interface PersonalizationConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  enableCaching: boolean;
  enableRealTimeUpdates: boolean;
  apiTimeout: number;
  retryAttempts: number;
}

export interface UserSession {
  userId: string;
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  preferences?: Record<string, any>;
}

export interface RecommendationRequest {
  userId: string;
  timeAvailable?: number;
  preferredDifficulty?: number;
  focusAreas?: string[];
  excludeScenarios?: string[];
  learningGoals?: string[];
  count?: number;
}

export interface PersonalizationResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
  processingTime: number;
}

/**
 * 个性化系统集成管理器
 */
export class PersonalizationIntegration {
  private eventBus: EventBus;
  private eventPublisher: EventPublisher;
  private recommendationEngine: PersonalizationEngine;
  private userProfiler: UserProfiler;
  private redis?: Redis;
  private config: PersonalizationConfig;
  private activeSessions: Map<string, UserSession> = new Map();
  private requestCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  constructor(config: PersonalizationConfig) {
    this.config = config;
    this.eventBus = createEventBus();
    this.eventPublisher = new EventPublisher(this.eventBus);
    this.recommendationEngine = new PersonalizationEngine();
    this.userProfiler = new UserProfiler();
    
    this.setupRedis();
    this.setupEventHandlers();
    this.setupSessionManagement();
  }

  // 初始化Redis连接
  private async setupRedis(): Promise<void> {
    if (!this.config.enableCaching || !this.config.redis) {
      return;
    }

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
      logger.info('Redis connection established for personalization caching');
    } catch (error) {
      logger.error('Failed to setup Redis:', error);
      this.redis = undefined;
    }
  }

  // 设置事件处理器
  private setupEventHandlers(): void {
    // 用户登录时初始化会话
    this.eventBus.subscribe(EventType.USER_LOGIN, async (eventData) => {
      const { userId, sessionId } = eventData.data;
      await this.initializeUserSession(userId, sessionId);
    });

    // 用户登出时清理会话
    this.eventBus.subscribe(EventType.USER_LOGOUT, async (eventData) => {
      const { userId } = eventData.data;
      await this.cleanupUserSession(userId);
    });

    // 游戏数据更新时刷新用户画像
    this.eventBus.subscribe(EventType.GAME_SESSION_ENDED, async (eventData) => {
      const { userId, sessionData } = eventData.data;
      await this.updateUserProfile(userId, sessionData);
    });

    // 训练完成时更新推荐
    this.eventBus.subscribe(EventType.AI_TRAINING_COMPLETED, async (eventData) => {
      const { userId, trainingResults } = eventData.data;
      await this.refreshRecommendations(userId, trainingResults);
    });

    // 系统错误处理
    this.eventBus.subscribe(EventType.SYSTEM_ERROR_OCCURRED, async (eventData) => {
      logger.error('System error in personalization:', eventData.data.error);
      await this.handleSystemError(eventData.data);
    });
  }

  // 设置会话管理
  private setupSessionManagement(): void {
    // 定期清理过期会话
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // 每5分钟清理一次

    // 定期清理缓存
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 10 * 60 * 1000); // 每10分钟清理一次
  }

  /**
   * 获取用户推荐
   */
  public async getUserRecommendations(
    request: RecommendationRequest
  ): Promise<PersonalizationResult> {
    const startTime = Date.now();
    
    try {
      // 验证用户会话
      const session = this.activeSessions.get(request.userId);
      if (!session) {
        throw new Error('User session not found');
      }

      // 检查缓存
      const cacheKey = this.generateCacheKey('recommendations', request);
      const cachedResult = await this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug(`Cache hit for recommendations: ${request.userId}`);
        return {
          success: true,
          data: cachedResult,
          timestamp: new Date(),
          processingTime: Date.now() - startTime
        };
      }

      // 获取用户画像
      const userProfile = await this.getUserProfile(request.userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // 生成推荐
      const recommendations = await this.recommendationEngine.generateRecommendations(
        userProfile,
        {
          timeAvailable: request.timeAvailable || 30,
          preferredDifficulty: request.preferredDifficulty,
          focusAreas: request.focusAreas,
          excludeScenarios: request.excludeScenarios,
          learningGoals: request.learningGoals
        },
        request.count || 5
      );

      // 更新用户活动时间
      this.updateSessionActivity(request.userId);

      // 缓存结果
      await this.setCache(cacheKey, recommendations, 30 * 60); // 缓存30分钟

      // 发布事件
      await this.eventPublisher.publish(
        EventType.ANALYTICS_DATA_RECEIVED,
        {
          userId: request.userId,
          action: 'recommendations_requested',
          count: recommendations.length,
          processingTime: Date.now() - startTime
        }
      );

      return {
        success: true,
        data: recommendations,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      logger.error('Failed to get user recommendations:', error);
      
      await this.eventPublisher.systemError(
        error as Error,
        { userId: request.userId, request }
      );

      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 生成个性化训练计划
   */
  public async generateTrainingPlan(
    userId: string,
    planDuration: number = 30
  ): Promise<PersonalizationResult> {
    const startTime = Date.now();

    try {
      // 验证用户会话
      const session = this.activeSessions.get(userId);
      if (!session) {
        throw new Error('User session not found');
      }

      // 检查缓存
      const cacheKey = this.generateCacheKey('training_plan', { userId, planDuration });
      const cachedResult = await this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug(`Cache hit for training plan: ${userId}`);
        return {
          success: true,
          data: cachedResult,
          timestamp: new Date(),
          processingTime: Date.now() - startTime
        };
      }

      // 获取用户画像
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // 生成训练计划
      const trainingPlan = await this.recommendationEngine.generateTrainingPlan(
        userProfile,
        {
          timeAvailable: session.preferences?.defaultSessionTime || 60,
          preferredDifficulty: session.preferences?.preferredDifficulty,
          focusAreas: session.preferences?.focusAreas,
          learningGoals: session.preferences?.learningGoals
        },
        planDuration
      );

      // 更新用户活动时间
      this.updateSessionActivity(userId);

      // 缓存结果
      await this.setCache(cacheKey, trainingPlan, 2 * 60 * 60); // 缓存2小时

      // 发布事件
      await this.eventPublisher.publish(
        EventType.AI_TRAINING_STARTED,
        {
          userId,
          planId: trainingPlan.planId,
          duration: planDuration,
          recommendationCount: trainingPlan.recommendations.length
        }
      );

      return {
        success: true,
        data: trainingPlan,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      logger.error('Failed to generate training plan:', error);
      
      await this.eventPublisher.systemError(
        error as Error,
        { userId, planDuration }
      );

      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 更新用户画像
   */
  public async updateUserProfile(
    userId: string,
    gameData: any
  ): Promise<PersonalizationResult> {
    const startTime = Date.now();

    try {
      // 分析游戏数据并更新画像
      const updatedProfile = await this.userProfiler.analyzeGameSession(userId, gameData);
      
      // 清除相关缓存
      await this.invalidateUserCache(userId);

      // 发布事件
      await this.eventPublisher.publish(
        EventType.USER_PROFILE_UPDATED,
        {
          userId,
          profileChanges: updatedProfile,
          gameSessionId: gameData.sessionId
        }
      );

      return {
        success: true,
        data: updatedProfile,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      logger.error('Failed to update user profile:', error);
      
      await this.eventPublisher.systemError(
        error as Error,
        { userId, gameData }
      );

      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 获取用户画像
   */
  public async getUserProfile(userId: string): Promise<UserSkillProfile | null> {
    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey('user_profile', { userId });
      const cachedProfile = await this.getFromCache(cacheKey);
      if (cachedProfile) {
        return cachedProfile;
      }

      // 从数据库获取
      const profile = await this.userProfiler.getUserProfile(userId);
      
      // 缓存结果
      if (profile) {
        await this.setCache(cacheKey, profile, 60 * 60); // 缓存1小时
      }

      return profile;
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * 刷新用户推荐
   */
  public async refreshRecommendations(
    userId: string,
    trainingResults?: any
  ): Promise<void> {
    try {
      // 清除推荐相关缓存
      await this.invalidateUserCache(userId);

      // 如果有训练结果，更新用户画像
      if (trainingResults) {
        await this.updateUserProfile(userId, trainingResults);
      }

      // 发布刷新事件
      await this.eventPublisher.publish(
        EventType.ANALYTICS_REPORT_GENERATED,
        {
          userId,
          reportType: 'recommendations_refresh',
          timestamp: new Date()
        }
      );

      logger.info(`Recommendations refreshed for user: ${userId}`);
    } catch (error) {
      logger.error('Failed to refresh recommendations:', error);
    }
  }

  // 会话管理方法

  private async initializeUserSession(userId: string, sessionId: string): Promise<void> {
    const session: UserSession = {
      userId,
      sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      preferences: await this.getUserPreferences(userId)
    };

    this.activeSessions.set(userId, session);
    logger.info(`User session initialized: ${userId}`);
  }

  private async cleanupUserSession(userId: string): Promise<void> {
    this.activeSessions.delete(userId);
    // 可选择性地清理相关缓存
    logger.info(`User session cleaned up: ${userId}`);
  }

  private updateSessionActivity(userId: string): void {
    const session = this.activeSessions.get(userId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expireTime = 30 * 60 * 1000; // 30分钟过期

    for (const [userId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity.getTime() > expireTime) {
        this.activeSessions.delete(userId);
        logger.debug(`Expired session cleaned up: ${userId}`);
      }
    }
  }

  // 缓存管理方法

  private generateCacheKey(type: string, params: any): string {
    const paramString = JSON.stringify(params);
    const hash = this.simpleHash(paramString);
    return `personalization:${type}:${hash}`;
  }

  private async getFromCache(key: string): Promise<any> {
    if (!this.config.enableCaching) return null;

    try {
      // 检查本地缓存
      if (this.requestCache.has(key)) {
        const expiry = this.cacheExpiry.get(key);
        if (expiry && Date.now() < expiry) {
          return this.requestCache.get(key);
        } else {
          this.requestCache.delete(key);
          this.cacheExpiry.delete(key);
        }
      }

      // 检查Redis缓存
      if (this.redis) {
        const cached = await this.redis.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          // 同步到本地缓存
          this.requestCache.set(key, data);
          this.cacheExpiry.set(key, Date.now() + 5 * 60 * 1000); // 本地缓存5分钟
          return data;
        }
      }

      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  private async setCache(key: string, data: any, ttlSeconds: number): Promise<void> {
    if (!this.config.enableCaching) return;

    try {
      // 设置本地缓存
      this.requestCache.set(key, data);
      this.cacheExpiry.set(key, Date.now() + Math.min(ttlSeconds, 5 * 60) * 1000);

      // 设置Redis缓存
      if (this.redis) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      const patterns = [
        `personalization:recommendations:*${userId}*`,
        `personalization:training_plan:*${userId}*`,
        `personalization:user_profile:*${userId}*`
      ];

      for (const pattern of patterns) {
        // 清理本地缓存
        for (const [key] of this.requestCache.entries()) {
          if (this.matchPattern(key, pattern)) {
            this.requestCache.delete(key);
            this.cacheExpiry.delete(key);
          }
        }

        // 清理Redis缓存
        if (this.redis) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        }
      }

      logger.debug(`Cache invalidated for user: ${userId}`);
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now >= expiry) {
        this.requestCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  // 工具方法

  private async getUserPreferences(userId: string): Promise<Record<string, any>> {
    try {
      // 从数据库或API获取用户偏好设置
      // 这里返回默认值，实际实现需要连接数据库
      return {
        defaultSessionTime: 60,
        preferredDifficulty: 3,
        focusAreas: ['postflop', 'psychology'],
        learningGoals: ['improve_winrate', 'reduce_variance']
      };
    } catch (error) {
      logger.error('Failed to get user preferences:', error);
      return {};
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  private matchPattern(str: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(str);
  }

  private async handleSystemError(errorData: any): Promise<void> {
    // 系统错误处理逻辑
    logger.error('Handling system error in personalization:', errorData);
    
    // 可以实现错误恢复、降级服务等逻辑
    if (errorData.context?.userId) {
      await this.invalidateUserCache(errorData.context.userId);
    }
  }

  /**
   * 获取集成状态
   */
  public getIntegrationStatus(): Record<string, any> {
    return {
      activeSessions: this.activeSessions.size,
      cacheSize: this.requestCache.size,
      redisConnected: !!this.redis?.status === 'ready',
      eventBusStats: this.eventBus.getEventStats(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * 关闭集成服务
   */
  public async shutdown(): Promise<void> {
    try {
      // 关闭Redis连接
      if (this.redis) {
        await this.redis.disconnect();
      }

      // 关闭事件总线
      await this.eventBus.close();

      // 清理内存
      this.activeSessions.clear();
      this.requestCache.clear();
      this.cacheExpiry.clear();

      logger.info('Personalization integration shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

/**
 * 创建个性化集成实例
 */
export function createPersonalizationIntegration(
  config?: Partial<PersonalizationConfig>
): PersonalizationIntegration {
  const defaultConfig: PersonalizationConfig = {
    enableCaching: true,
    enableRealTimeUpdates: true,
    apiTimeout: 30000,
    retryAttempts: 3,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_PERSONALIZATION_DB || '2'),
    },
  };

  return new PersonalizationIntegration({ ...defaultConfig, ...config });
}

export default PersonalizationIntegration;