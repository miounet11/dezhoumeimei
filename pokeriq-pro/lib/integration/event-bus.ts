/**
 * PokerIQ Pro 事件总线系统
 * 跨模块通信和数据流管理
 * 支持异步事件、数据同步、状态管理
 */

import EventEmitter from 'events';
import { createLogger } from '@/lib/logger';
import { Redis } from 'ioredis';

const logger = createLogger('event-bus');

// 事件类型定义
export enum EventType {
  // 用户相关事件
  USER_REGISTERED = 'user:registered',
  USER_LOGIN = 'user:login',
  USER_LOGOUT = 'user:logout',
  USER_PROFILE_UPDATED = 'user:profile:updated',
  USER_ACHIEVEMENT_UNLOCKED = 'user:achievement:unlocked',
  
  // 游戏相关事件
  GAME_SESSION_STARTED = 'game:session:started',
  GAME_SESSION_ENDED = 'game:session:ended',
  GAME_ACTION_PERFORMED = 'game:action:performed',
  GAME_HAND_COMPLETED = 'game:hand:completed',
  GAME_TOURNAMENT_JOINED = 'game:tournament:joined',
  
  // AI/GTO相关事件
  AI_TRAINING_STARTED = 'ai:training:started',
  AI_TRAINING_COMPLETED = 'ai:training:completed',
  AI_STRATEGY_COMPUTED = 'ai:strategy:computed',
  AI_MODEL_UPDATED = 'ai:model:updated',
  GTO_ANALYSIS_REQUESTED = 'gto:analysis:requested',
  GTO_ANALYSIS_COMPLETED = 'gto:analysis:completed',
  
  // 陪伴系统事件
  COMPANION_ACQUIRED = 'companion:acquired',
  COMPANION_LEVEL_UP = 'companion:level_up',
  COMPANION_INTERACTION = 'companion:interaction',
  COMPANION_INTIMACY_CHANGED = 'companion:intimacy:changed',
  
  // 数据分析事件
  ANALYTICS_DATA_RECEIVED = 'analytics:data:received',
  ANALYTICS_REPORT_GENERATED = 'analytics:report:generated',
  PERFORMANCE_METRIC_UPDATED = 'performance:metric:updated',
  
  // 系统事件
  SYSTEM_HEALTH_CHECK = 'system:health:check',
  SYSTEM_CACHE_INVALIDATED = 'system:cache:invalidated',
  SYSTEM_ERROR_OCCURRED = 'system:error:occurred',
  SYSTEM_BACKUP_COMPLETED = 'system:backup:completed',
  
  // 支付相关事件
  PAYMENT_INITIATED = 'payment:initiated',
  PAYMENT_COMPLETED = 'payment:completed',
  PAYMENT_FAILED = 'payment:failed',
  SUBSCRIPTION_ACTIVATED = 'subscription:activated',
  SUBSCRIPTION_EXPIRED = 'subscription:expired',
}

// 事件数据接口
export interface EventData {
  eventId: string;
  timestamp: number;
  source: string;
  userId?: string;
  sessionId?: string;
  data: any;
  metadata?: Record<string, any>;
}

// 事件处理器接口
export interface EventHandler {
  (eventData: EventData): Promise<void> | void;
}

// 事件过滤器接口
export interface EventFilter {
  (eventData: EventData): boolean;
}

// 事件总线配置
interface EventBusConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  enablePersistence: boolean;
  enableDistribution: boolean;
  maxRetries: number;
  retryDelay: number;
}

/**
 * 核心事件总线类
 */
export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private redis?: Redis;
  private config: EventBusConfig;
  private handlers: Map<EventType, Set<EventHandler>> = new Map();
  private filters: Map<EventType, Set<EventFilter>> = new Map();
  private eventHistory: EventData[] = [];
  private maxHistorySize = 1000;

  constructor(config: EventBusConfig) {
    super();
    this.config = config;
    this.setupRedis();
    this.setupErrorHandling();
  }

  // 单例模式
  public static getInstance(config?: EventBusConfig): EventBus {
    if (!EventBus.instance) {
      if (!config) {
        throw new Error('EventBus config required for first initialization');
      }
      EventBus.instance = new EventBus(config);
    }
    return EventBus.instance;
  }

  // 设置Redis连接
  private async setupRedis(): Promise<void> {
    if (!this.config.enableDistribution || !this.config.redis) {
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
      
      // 订阅分布式事件
      this.redis.subscribe('pokeriq:events');
      this.redis.on('message', this.handleDistributedEvent.bind(this));
      
      logger.info('Redis connection established for distributed events');
    } catch (error) {
      logger.error('Failed to setup Redis for event distribution:', error);
      this.redis = undefined;
    }
  }

  // 设置错误处理
  private setupErrorHandling(): void {
    this.on('error', (error) => {
      logger.error('EventBus error:', error);
    });

    // 处理未捕获的事件错误
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in EventBus:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection in EventBus:', reason);
    });
  }

  // 处理分布式事件
  private async handleDistributedEvent(channel: string, message: string): Promise<void> {
    try {
      const eventData: EventData = JSON.parse(message);
      await this.processEvent(eventData, false); // 不再次分发
    } catch (error) {
      logger.error('Failed to handle distributed event:', error);
    }
  }

  /**
   * 发布事件
   */
  public async publish(
    eventType: EventType,
    data: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    const eventData: EventData = {
      eventId: this.generateEventId(),
      timestamp: Date.now(),
      source: process.env.SERVICE_NAME || 'unknown',
      data,
      metadata,
    };

    // 添加到历史记录
    this.addToHistory(eventData);

    // 处理事件
    await this.processEvent(eventData, true);

    logger.debug(`Event published: ${eventType}`, {
      eventId: eventData.eventId,
      source: eventData.source,
    });
  }

  // 处理事件
  private async processEvent(eventData: EventData, distribute: boolean = true): Promise<void> {
    const eventType = this.getEventTypeFromData(eventData);
    
    if (!eventType) {
      logger.warn('Unknown event type received');
      return;
    }

    // 应用过滤器
    if (!this.applyFilters(eventType, eventData)) {
      return;
    }

    // 本地处理
    await this.handleLocalEvent(eventType, eventData);

    // 分布式处理
    if (distribute && this.config.enableDistribution && this.redis) {
      await this.distributeEvent(eventData);
    }

    // 持久化
    if (this.config.enablePersistence) {
      await this.persistEvent(eventType, eventData);
    }
  }

  // 本地事件处理
  private async handleLocalEvent(eventType: EventType, eventData: EventData): Promise<void> {
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(eventData);
      } catch (error) {
        logger.error(`Handler error for event ${eventType}:`, error);
        // 发布错误事件
        this.emit('handler-error', { eventType, eventData, error });
      }
    });

    await Promise.allSettled(promises);
  }

  // 分发事件到其他实例
  private async distributeEvent(eventData: EventData): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.publish('pokeriq:events', JSON.stringify(eventData));
    } catch (error) {
      logger.error('Failed to distribute event:', error);
    }
  }

  // 持久化事件
  private async persistEvent(eventType: EventType, eventData: EventData): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `events:${eventType}:${new Date().toISOString().split('T')[0]}`;
      await this.redis.lpush(key, JSON.stringify(eventData));
      await this.redis.expire(key, 86400 * 7); // 保存7天
    } catch (error) {
      logger.error('Failed to persist event:', error);
    }
  }

  /**
   * 订阅事件
   */
  public subscribe(eventType: EventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    logger.debug(`Handler subscribed to event: ${eventType}`);
  }

  /**
   * 取消订阅事件
   */
  public unsubscribe(eventType: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * 添加事件过滤器
   */
  public addFilter(eventType: EventType, filter: EventFilter): void {
    if (!this.filters.has(eventType)) {
      this.filters.set(eventType, new Set());
    }
    this.filters.get(eventType)!.add(filter);
  }

  /**
   * 移除事件过滤器
   */
  public removeFilter(eventType: EventType, filter: EventFilter): void {
    const filters = this.filters.get(eventType);
    if (filters) {
      filters.delete(filter);
      if (filters.size === 0) {
        this.filters.delete(eventType);
      }
    }
  }

  // 应用过滤器
  private applyFilters(eventType: EventType, eventData: EventData): boolean {
    const filters = this.filters.get(eventType);
    if (!filters || filters.size === 0) {
      return true;
    }

    return Array.from(filters).every(filter => {
      try {
        return filter(eventData);
      } catch (error) {
        logger.error('Filter error:', error);
        return true; // 出错时允许通过
      }
    });
  }

  /**
   * 获取事件历史
   */
  public getEventHistory(eventType?: EventType, limit?: number): EventData[] {
    let history = this.eventHistory;
    
    if (eventType) {
      history = history.filter(event => 
        this.getEventTypeFromData(event) === eventType
      );
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return [...history];
  }

  /**
   * 清理事件历史
   */
  public clearEventHistory(): void {
    this.eventHistory = [];
  }

  /**
   * 获取事件统计
   */
  public getEventStats(): Record<string, any> {
    const stats: Record<string, number> = {};
    
    this.eventHistory.forEach(event => {
      const eventType = this.getEventTypeFromData(event);
      if (eventType) {
        stats[eventType] = (stats[eventType] || 0) + 1;
      }
    });

    return {
      totalEvents: this.eventHistory.length,
      eventsByType: stats,
      subscribedEvents: Array.from(this.handlers.keys()),
      activeHandlers: this.getTotalHandlerCount(),
    };
  }

  // 辅助方法
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEventTypeFromData(eventData: EventData): EventType | undefined {
    // 从事件数据或元数据中提取事件类型
    return eventData.metadata?.eventType;
  }

  private addToHistory(eventData: EventData): void {
    this.eventHistory.push(eventData);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  private getTotalHandlerCount(): number {
    return Array.from(this.handlers.values())
      .reduce((total, handlerSet) => total + handlerSet.size, 0);
  }

  /**
   * 关闭事件总线
   */
  public async close(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
    this.removeAllListeners();
    this.handlers.clear();
    this.filters.clear();
    this.eventHistory = [];
  }
}

/**
 * 事件总线装饰器
 */
export function EventListener(eventType: EventType) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const eventBus = EventBus.getInstance();
      eventBus.subscribe(eventType, async (eventData: EventData) => {
        await originalMethod.call(this, eventData, ...args);
      });
    };

    return descriptor;
  };
}

/**
 * 常用事件发布器
 */
export class EventPublisher {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  // 用户事件
  async userRegistered(userId: string, userData: any): Promise<void> {
    await this.eventBus.publish(EventType.USER_REGISTERED, {
      userId,
      ...userData,
    });
  }

  async userLoggedIn(userId: string, sessionData: any): Promise<void> {
    await this.eventBus.publish(EventType.USER_LOGIN, {
      userId,
      ...sessionData,
    });
  }

  // 游戏事件
  async gameSessionStarted(sessionId: string, gameData: any): Promise<void> {
    await this.eventBus.publish(EventType.GAME_SESSION_STARTED, {
      sessionId,
      ...gameData,
    });
  }

  async gameActionPerformed(sessionId: string, action: any): Promise<void> {
    await this.eventBus.publish(EventType.GAME_ACTION_PERFORMED, {
      sessionId,
      action,
    });
  }

  // AI事件
  async gtoAnalysisRequested(requestId: string, analysisParams: any): Promise<void> {
    await this.eventBus.publish(EventType.GTO_ANALYSIS_REQUESTED, {
      requestId,
      ...analysisParams,
    });
  }

  async gtoAnalysisCompleted(requestId: string, results: any): Promise<void> {
    await this.eventBus.publish(EventType.GTO_ANALYSIS_COMPLETED, {
      requestId,
      results,
    });
  }

  // 系统事件
  async systemError(error: Error, context: any): Promise<void> {
    await this.eventBus.publish(EventType.SYSTEM_ERROR_OCCURRED, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
    });
  }
}

// 导出默认配置的事件总线实例
export const createEventBus = (config?: Partial<EventBusConfig>): EventBus => {
  const defaultConfig: EventBusConfig = {
    enablePersistence: true,
    enableDistribution: true,
    maxRetries: 3,
    retryDelay: 1000,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_EVENTS_DB || '1'),
    },
  };

  return EventBus.getInstance({ ...defaultConfig, ...config });
};

export default EventBus;