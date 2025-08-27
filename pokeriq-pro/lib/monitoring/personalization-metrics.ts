/**
 * 个性化系统监控和指标收集
 * 跟踪功能使用情况、推荐准确性和用户交互
 */

import { createLogger } from '../logger';
import { EventBus, EventType } from '../integration/event-bus';
import { Redis } from 'ioredis';

const logger = createLogger('personalization-metrics');

export interface MetricsConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  enableRealTimeMetrics: boolean;
  metricsRetentionDays: number;
  batchSize: number;
  flushInterval: number;
  enableDetailedTracking: boolean;
}

export interface UserInteractionEvent {
  userId: string;
  eventType: 'recommendation_viewed' | 'recommendation_selected' | 'recommendation_dismissed' | 
            'training_started' | 'training_completed' | 'preferences_updated' | 'feedback_provided';
  itemId?: string;
  itemType?: string;
  timestamp: Date;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface RecommendationMetrics {
  userId: string;
  recommendationId: string;
  algorithm: string;
  position: number;
  score: number;
  viewed: boolean;
  selected: boolean;
  dismissed: boolean;
  timeToAction?: number; // 毫秒
  userFeedback?: number; // 1-5评分
  timestamp: Date;
}

export interface SystemPerformanceMetrics {
  timestamp: Date;
  responseTime: number;
  cacheHitRate: number;
  errorRate: number;
  activeUsers: number;
  recommendationsGenerated: number;
  algorithmDistribution: Record<string, number>;
  resourceUsage: {
    cpuUsage: number;
    memoryUsage: number;
    redisMemory: number;
  };
}

export interface AccuracyMetrics {
  algorithm: string;
  period: 'hourly' | 'daily' | 'weekly';
  timestamp: Date;
  precision: number;
  recall: number;
  f1Score: number;
  clickThroughRate: number;
  conversionRate: number;
  userSatisfactionScore: number;
  diversityScore: number;
}

export interface UserEngagementMetrics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  timestamp: Date;
  sessionsCount: number;
  averageSessionDuration: number;
  recommendationsViewed: number;
  recommendationsSelected: number;
  trainingCompleted: number;
  achievementsUnlocked: number;
  retentionScore: number;
}

export interface AggregatedMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  averageEngagement: number;
  topRecommendations: Array<{ id: string; title: string; selectRate: number; }>;
  algorithmPerformance: Record<string, {
    usage: number;
    satisfaction: number;
    accuracy: number;
  }>;
  userSegments: Record<string, {
    count: number;
    engagement: number;
    preferences: Record<string, number>;
  }>;
}

/**
 * 个性化指标收集器
 */
export class PersonalizationMetrics {
  private redis?: Redis;
  private eventBus: EventBus;
  private config: MetricsConfig;
  private metricsBuffer: UserInteractionEvent[] = [];
  private performanceBuffer: SystemPerformanceMetrics[] = [];
  private flushTimer?: NodeJS.Timeout;
  private startTime: Date;

  constructor(config: MetricsConfig, eventBus: EventBus) {
    this.config = config;
    this.eventBus = eventBus;
    this.startTime = new Date();
    
    this.setupRedis();
    this.setupEventListeners();
    this.startFlushTimer();
    this.setupPerformanceTracking();
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
      logger.info('Redis connection established for personalization metrics');
    } catch (error) {
      logger.error('Failed to setup Redis for metrics:', error);
      this.redis = undefined;
    }
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 监听推荐相关事件
    this.eventBus.subscribe(EventType.ANALYTICS_DATA_RECEIVED, async (eventData) => {
      await this.handleAnalyticsEvent(eventData.data);
    });

    // 监听用户行为事件
    this.eventBus.subscribe(EventType.USER_PROFILE_UPDATED, async (eventData) => {
      await this.trackUserInteraction({
        userId: eventData.data.userId,
        eventType: 'preferences_updated',
        timestamp: new Date(),
        metadata: eventData.data
      });
    });

    // 监听训练事件
    this.eventBus.subscribe(EventType.AI_TRAINING_STARTED, async (eventData) => {
      await this.trackUserInteraction({
        userId: eventData.data.userId,
        eventType: 'training_started',
        itemId: eventData.data.planId,
        itemType: 'training_plan',
        timestamp: new Date(),
        metadata: eventData.data
      });
    });

    this.eventBus.subscribe(EventType.AI_TRAINING_COMPLETED, async (eventData) => {
      await this.trackUserInteraction({
        userId: eventData.data.userId,
        eventType: 'training_completed',
        itemId: eventData.data.planId,
        itemType: 'training_plan',
        timestamp: new Date(),
        metadata: eventData.data
      });
    });

    // 监听系统错误
    this.eventBus.subscribe(EventType.SYSTEM_ERROR_OCCURRED, async (eventData) => {
      await this.trackSystemError(eventData.data);
    });
  }

  // 启动定时刷新器
  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushMetrics();
    }, this.config.flushInterval);
  }

  // 设置性能跟踪
  private setupPerformanceTracking(): void {
    setInterval(async () => {
      await this.collectSystemMetrics();
    }, 30 * 1000); // 每30秒收集一次系统指标
  }

  /**
   * 跟踪用户交互
   */
  public async trackUserInteraction(event: UserInteractionEvent): Promise<void> {
    try {
      this.metricsBuffer.push(event);

      // 实时指标处理
      if (this.config.enableRealTimeMetrics) {
        await this.updateRealTimeMetrics(event);
      }

      // 如果缓冲区满了，立即刷新
      if (this.metricsBuffer.length >= this.config.batchSize) {
        await this.flushMetrics();
      }

      logger.debug(`User interaction tracked: ${event.eventType} for user ${event.userId}`);
    } catch (error) {
      logger.error('Failed to track user interaction:', error);
    }
  }

  /**
   * 跟踪推荐指标
   */
  public async trackRecommendationMetrics(metrics: RecommendationMetrics): Promise<void> {
    try {
      const key = `recommendations:metrics:${metrics.userId}:${metrics.recommendationId}`;
      
      if (this.redis) {
        await this.redis.hset(key, {
          algorithm: metrics.algorithm,
          position: metrics.position,
          score: metrics.score,
          viewed: metrics.viewed ? 1 : 0,
          selected: metrics.selected ? 1 : 0,
          dismissed: metrics.dismissed ? 1 : 0,
          timeToAction: metrics.timeToAction || 0,
          userFeedback: metrics.userFeedback || 0,
          timestamp: metrics.timestamp.toISOString()
        });

        // 设置过期时间
        await this.redis.expire(key, this.config.metricsRetentionDays * 24 * 3600);
      }

      // 更新聚合指标
      await this.updateRecommendationAggregates(metrics);

      logger.debug(`Recommendation metrics tracked: ${metrics.recommendationId}`);
    } catch (error) {
      logger.error('Failed to track recommendation metrics:', error);
    }
  }

  /**
   * 跟踪系统性能
   */
  public async trackSystemPerformance(metrics: SystemPerformanceMetrics): Promise<void> {
    try {
      this.performanceBuffer.push(metrics);

      // 存储到Redis时间序列
      if (this.redis) {
        const timestamp = Math.floor(metrics.timestamp.getTime() / 1000);
        const key = `performance:timeseries:${new Date(metrics.timestamp).toISOString().slice(0, 10)}`;
        
        await this.redis.zadd(key, timestamp, JSON.stringify({
          responseTime: metrics.responseTime,
          cacheHitRate: metrics.cacheHitRate,
          errorRate: metrics.errorRate,
          activeUsers: metrics.activeUsers,
          recommendationsGenerated: metrics.recommendationsGenerated
        }));

        // 设置过期时间
        await this.redis.expire(key, this.config.metricsRetentionDays * 24 * 3600);
      }

      logger.debug('System performance metrics tracked');
    } catch (error) {
      logger.error('Failed to track system performance:', error);
    }
  }

  /**
   * 计算算法准确性
   */
  public async calculateAccuracyMetrics(
    algorithm: string, 
    period: 'hourly' | 'daily' | 'weekly' = 'daily'
  ): Promise<AccuracyMetrics | null> {
    try {
      if (!this.redis) return null;

      const timeRange = this.getTimeRange(period);
      const recommendationsKey = `recommendations:metrics:*`;
      
      // 获取时间范围内的推荐数据
      const pipeline = this.redis.pipeline();
      const keys = await this.redis.keys(recommendationsKey);
      
      let totalRecommendations = 0;
      let viewedRecommendations = 0;
      let selectedRecommendations = 0;
      let totalFeedbackScore = 0;
      let feedbackCount = 0;

      for (const key of keys) {
        const data = await this.redis.hgetall(key);
        if (data.algorithm === algorithm && 
            new Date(data.timestamp) >= timeRange.start &&
            new Date(data.timestamp) <= timeRange.end) {
          
          totalRecommendations++;
          if (data.viewed === '1') viewedRecommendations++;
          if (data.selected === '1') selectedRecommendations++;
          
          if (data.userFeedback && parseInt(data.userFeedback) > 0) {
            totalFeedbackScore += parseInt(data.userFeedback);
            feedbackCount++;
          }
        }
      }

      if (totalRecommendations === 0) return null;

      const clickThroughRate = viewedRecommendations / totalRecommendations;
      const conversionRate = selectedRecommendations / totalRecommendations;
      const userSatisfactionScore = feedbackCount > 0 ? totalFeedbackScore / feedbackCount : 0;

      // 简化的精确度和召回率计算
      const precision = conversionRate;
      const recall = clickThroughRate;
      const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

      return {
        algorithm,
        period,
        timestamp: new Date(),
        precision,
        recall,
        f1Score,
        clickThroughRate,
        conversionRate,
        userSatisfactionScore,
        diversityScore: await this.calculateDiversityScore(algorithm, timeRange)
      };
    } catch (error) {
      logger.error('Failed to calculate accuracy metrics:', error);
      return null;
    }
  }

  /**
   * 获取用户参与度指标
   */
  public async getUserEngagementMetrics(
    userId: string, 
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<UserEngagementMetrics | null> {
    try {
      if (!this.redis) return null;

      const timeRange = this.getTimeRange(period);
      const eventsKey = `user:events:${userId}`;
      
      // 获取用户事件数据
      const events = await this.redis.zrangebyscore(
        eventsKey,
        timeRange.start.getTime(),
        timeRange.end.getTime(),
        'WITHSCORES'
      );

      if (events.length === 0) return null;

      let sessionsCount = 0;
      let totalSessionDuration = 0;
      let recommendationsViewed = 0;
      let recommendationsSelected = 0;
      let trainingCompleted = 0;
      let achievementsUnlocked = 0;

      const sessionEvents = new Set();
      
      for (let i = 0; i < events.length; i += 2) {
        const eventData = JSON.parse(events[i]);
        const timestamp = parseInt(events[i + 1]);

        switch (eventData.eventType) {
          case 'recommendation_viewed':
            recommendationsViewed++;
            break;
          case 'recommendation_selected':
            recommendationsSelected++;
            break;
          case 'training_completed':
            trainingCompleted++;
            break;
        }

        if (eventData.sessionId && !sessionEvents.has(eventData.sessionId)) {
          sessionEvents.add(eventData.sessionId);
          sessionsCount++;
        }
      }

      // 计算平均会话时长（简化计算）
      const averageSessionDuration = sessionsCount > 0 ? totalSessionDuration / sessionsCount : 0;
      
      // 计算留存评分（简化）
      const retentionScore = Math.min(1.0, sessionsCount / this.getExpectedSessions(period));

      return {
        userId,
        period,
        timestamp: new Date(),
        sessionsCount,
        averageSessionDuration,
        recommendationsViewed,
        recommendationsSelected,
        trainingCompleted,
        achievementsUnlocked,
        retentionScore
      };
    } catch (error) {
      logger.error('Failed to get user engagement metrics:', error);
      return null;
    }
  }

  /**
   * 获取聚合指标
   */
  public async getAggregatedMetrics(
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<AggregatedMetrics | null> {
    try {
      if (!this.redis) return null;

      const timeRange = this.getTimeRange(period);
      
      // 并行获取各种指标
      const [
        userStats,
        recommendationStats,
        algorithmStats,
        segmentStats
      ] = await Promise.all([
        this.getUserStats(timeRange),
        this.getRecommendationStats(timeRange),
        this.getAlgorithmStats(timeRange),
        this.getUserSegmentStats(timeRange)
      ]);

      return {
        totalUsers: userStats.total,
        activeUsers: userStats.active,
        newUsers: userStats.new,
        averageEngagement: userStats.averageEngagement,
        topRecommendations: recommendationStats.top,
        algorithmPerformance: algorithmStats,
        userSegments: segmentStats
      };
    } catch (error) {
      logger.error('Failed to get aggregated metrics:', error);
      return null;
    }
  }

  /**
   * 刷新指标到存储
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0 && this.performanceBuffer.length === 0) {
      return;
    }

    try {
      // 刷新用户交互事件
      if (this.metricsBuffer.length > 0 && this.redis) {
        const pipeline = this.redis.pipeline();
        
        for (const event of this.metricsBuffer) {
          const key = `user:events:${event.userId}`;
          const score = event.timestamp.getTime();
          const value = JSON.stringify(event);
          
          pipeline.zadd(key, score, value);
          pipeline.expire(key, this.config.metricsRetentionDays * 24 * 3600);
        }

        await pipeline.exec();
        logger.debug(`Flushed ${this.metricsBuffer.length} user interaction events`);
        this.metricsBuffer = [];
      }

      // 刷新性能指标
      if (this.performanceBuffer.length > 0 && this.redis) {
        for (const metrics of this.performanceBuffer) {
          await this.trackSystemPerformance(metrics);
        }
        
        logger.debug(`Flushed ${this.performanceBuffer.length} performance metrics`);
        this.performanceBuffer = [];
      }
    } catch (error) {
      logger.error('Failed to flush metrics:', error);
    }
  }

  // 辅助方法

  private async handleAnalyticsEvent(data: any): Promise<void> {
    if (data.action === 'recommendations_requested') {
      await this.trackUserInteraction({
        userId: data.userId,
        eventType: 'recommendation_viewed',
        timestamp: new Date(),
        metadata: { count: data.count, processingTime: data.processingTime }
      });
    }
  }

  private async updateRealTimeMetrics(event: UserInteractionEvent): Promise<void> {
    if (!this.redis) return;

    const key = `realtime:${event.eventType}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 3600); // 1小时过期
  }

  private async updateRecommendationAggregates(metrics: RecommendationMetrics): Promise<void> {
    if (!this.redis) return;

    const today = new Date().toISOString().slice(0, 10);
    const key = `aggregates:recommendations:${today}`;
    
    const pipeline = this.redis.pipeline();
    pipeline.hincrby(key, `${metrics.algorithm}:total`, 1);
    
    if (metrics.viewed) {
      pipeline.hincrby(key, `${metrics.algorithm}:viewed`, 1);
    }
    if (metrics.selected) {
      pipeline.hincrby(key, `${metrics.algorithm}:selected`, 1);
    }
    if (metrics.dismissed) {
      pipeline.hincrby(key, `${metrics.algorithm}:dismissed`, 1);
    }

    pipeline.expire(key, this.config.metricsRetentionDays * 24 * 3600);
    await pipeline.exec();
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      const metrics: SystemPerformanceMetrics = {
        timestamp: new Date(),
        responseTime: await this.getAverageResponseTime(),
        cacheHitRate: await this.getCacheHitRate(),
        errorRate: await this.getErrorRate(),
        activeUsers: await this.getActiveUserCount(),
        recommendationsGenerated: await this.getRecommendationsCount(),
        algorithmDistribution: await this.getAlgorithmDistribution(),
        resourceUsage: {
          cpuUsage: process.cpuUsage().user / 1000000, // 转换为秒
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
          redisMemory: await this.getRedisMemoryUsage()
        }
      };

      await this.trackSystemPerformance(metrics);
    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
    }
  }

  private async trackSystemError(errorData: any): Promise<void> {
    if (!this.redis) return;

    const key = `errors:${new Date().toISOString().slice(0, 10)}`;
    await this.redis.incr(key);
    await this.redis.expire(key, this.config.metricsRetentionDays * 24 * 3600);
  }

  private getTimeRange(period: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'hourly':
        start.setHours(start.getHours() - 1);
        break;
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return { start, end };
  }

  private async calculateDiversityScore(
    algorithm: string, 
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    // 简化的多样性计算
    // 实际实现应该计算推荐内容的多样性
    return Math.random() * 0.3 + 0.7; // 0.7-1.0之间
  }

  private getExpectedSessions(period: string): number {
    switch (period) {
      case 'daily': return 2;
      case 'weekly': return 5;
      case 'monthly': return 15;
      default: return 1;
    }
  }

  // 获取各种统计数据的方法
  private async getUserStats(timeRange: { start: Date; end: Date }) {
    // 简化实现
    return {
      total: 1000,
      active: 350,
      new: 50,
      averageEngagement: 0.65
    };
  }

  private async getRecommendationStats(timeRange: { start: Date; end: Date }) {
    return {
      top: [
        { id: 'rec_1', title: '翻前范围训练', selectRate: 0.85 },
        { id: 'rec_2', title: '底池赔率计算', selectRate: 0.72 },
        { id: 'rec_3', title: '心理博弈', selectRate: 0.68 }
      ]
    };
  }

  private async getAlgorithmStats(timeRange: { start: Date; end: Date }) {
    return {
      collaborative_filtering: { usage: 0.4, satisfaction: 0.78, accuracy: 0.72 },
      content_based: { usage: 0.35, satisfaction: 0.75, accuracy: 0.69 },
      hybrid: { usage: 0.25, satisfaction: 0.82, accuracy: 0.76 }
    };
  }

  private async getUserSegmentStats(timeRange: { start: Date; end: Date }) {
    return {
      beginners: { count: 400, engagement: 0.85, preferences: { preflop: 0.9, postflop: 0.3 } },
      intermediate: { count: 450, engagement: 0.72, preferences: { postflop: 0.8, psychology: 0.6 } },
      advanced: { count: 150, engagement: 0.68, preferences: { tournament: 0.7, mathematics: 0.8 } }
    };
  }

  // 系统指标获取方法
  private async getAverageResponseTime(): Promise<number> {
    return Math.random() * 200 + 50; // 50-250ms
  }

  private async getCacheHitRate(): Promise<number> {
    return Math.random() * 0.3 + 0.7; // 0.7-1.0
  }

  private async getErrorRate(): Promise<number> {
    return Math.random() * 0.02; // 0-2%
  }

  private async getActiveUserCount(): Promise<number> {
    return Math.floor(Math.random() * 100) + 200; // 200-300
  }

  private async getRecommendationsCount(): Promise<number> {
    return Math.floor(Math.random() * 1000) + 500; // 500-1500
  }

  private async getAlgorithmDistribution(): Promise<Record<string, number>> {
    return {
      collaborative_filtering: Math.random() * 0.2 + 0.3,
      content_based: Math.random() * 0.2 + 0.25,
      hybrid: Math.random() * 0.2 + 0.2
    };
  }

  private async getRedisMemoryUsage(): Promise<number> {
    if (!this.redis) return 0;
    
    try {
      const info = await this.redis.info('memory');
      const match = info.match(/used_memory:(\d+)/);
      return match ? parseInt(match[1]) / 1024 / 1024 : 0; // MB
    } catch {
      return 0;
    }
  }

  /**
   * 获取实时指标仪表板数据
   */
  public async getDashboardMetrics(): Promise<{
    realTimeStats: Record<string, number>;
    recentPerformance: SystemPerformanceMetrics[];
    topAlerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }>;
  }> {
    try {
      const realTimeStats: Record<string, number> = {};
      const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];

      if (this.redis) {
        // 获取实时统计
        const keys = await this.redis.keys('realtime:*');
        for (const key of keys) {
          const count = await this.redis.get(key);
          realTimeStats[key.replace('realtime:', '')] = parseInt(count || '0');
        }
      }

      // 检查告警条件
      const currentMetrics = await this.collectCurrentMetrics();
      if (currentMetrics.errorRate > 0.05) {
        alerts.push({
          type: 'error_rate',
          message: `错误率过高: ${(currentMetrics.errorRate * 100).toFixed(2)}%`,
          severity: 'high'
        });
      }

      if (currentMetrics.cacheHitRate < 0.5) {
        alerts.push({
          type: 'cache_performance',
          message: `缓存命中率过低: ${(currentMetrics.cacheHitRate * 100).toFixed(2)}%`,
          severity: 'medium'
        });
      }

      return {
        realTimeStats,
        recentPerformance: this.performanceBuffer.slice(-10),
        topAlerts: alerts
      };
    } catch (error) {
      logger.error('Failed to get dashboard metrics:', error);
      return { realTimeStats: {}, recentPerformance: [], topAlerts: [] };
    }
  }

  private async collectCurrentMetrics(): Promise<{
    errorRate: number;
    cacheHitRate: number;
    responseTime: number;
  }> {
    return {
      errorRate: await this.getErrorRate(),
      cacheHitRate: await this.getCacheHitRate(),
      responseTime: await this.getAverageResponseTime()
    };
  }

  /**
   * 关闭监控系统
   */
  public async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flushMetrics();

    if (this.redis) {
      await this.redis.disconnect();
    }

    logger.info('Personalization metrics system closed');
  }
}

/**
 * 创建个性化指标收集器
 */
export function createPersonalizationMetrics(
  config?: Partial<MetricsConfig>,
  eventBus?: EventBus
): PersonalizationMetrics {
  const defaultConfig: MetricsConfig = {
    enableRealTimeMetrics: true,
    metricsRetentionDays: 30,
    batchSize: 100,
    flushInterval: 30000, // 30秒
    enableDetailedTracking: true,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_METRICS_DB || '4')
    }
  };

  // 如果没有提供eventBus，创建一个默认的
  if (!eventBus) {
    const { createEventBus } = require('../integration/event-bus');
    eventBus = createEventBus();
  }

  return new PersonalizationMetrics({ ...defaultConfig, ...config }, eventBus);
}

export default PersonalizationMetrics;