/**
 * PokerIQ Pro 数据同步系统
 * 跨模块数据一致性和状态同步管理
 */

import { EventBus, EventType, EventData } from './event-bus';
import { createLogger } from '@/lib/logger';
import { Redis } from 'ioredis';

const logger = createLogger('data-sync');

// 同步策略枚举
export enum SyncStrategy {
  IMMEDIATE = 'immediate',
  BATCH = 'batch',
  SCHEDULED = 'scheduled',
  EVENTUAL = 'eventual',
}

// 数据同步配置
interface SyncConfig {
  strategy: SyncStrategy;
  batchSize?: number;
  batchInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
  conflictResolution?: ConflictResolution;
}

// 冲突解决策略
export enum ConflictResolution {
  LAST_WRITE_WINS = 'last_write_wins',
  FIRST_WRITE_WINS = 'first_write_wins',
  MERGE = 'merge',
  MANUAL = 'manual',
}

// 数据源定义
export enum DataSource {
  POSTGRES_PRIMARY = 'postgres_primary',
  POSTGRES_REPLICA = 'postgres_replica',
  REDIS_CACHE = 'redis_cache',
  REDIS_SESSION = 'redis_session',
  CLICKHOUSE_ANALYTICS = 'clickhouse_analytics',
  AI_SERVICE = 'ai_service',
  WEBSOCKET_STATE = 'websocket_state',
}

// 同步实体类型
export enum EntityType {
  USER = 'user',
  GAME_SESSION = 'game_session',
  AI_MODEL = 'ai_model',
  COMPANION = 'companion',
  ACHIEVEMENT = 'achievement',
  ANALYTICS_DATA = 'analytics_data',
  SYSTEM_CONFIG = 'system_config',
}

// 同步操作类型
export enum SyncOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPSERT = 'upsert',
}

// 同步记录接口
interface SyncRecord {
  id: string;
  entityType: EntityType;
  entityId: string;
  operation: SyncOperation;
  sourceSystem: DataSource;
  targetSystems: DataSource[];
  data: any;
  timestamp: number;
  version: number;
  checksum: string;
  metadata?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'conflict';
  attempts: number;
  lastError?: string;
}

// 冲突记录接口
interface ConflictRecord {
  id: string;
  entityType: EntityType;
  entityId: string;
  conflicts: Array<{
    source: DataSource;
    data: any;
    timestamp: number;
    version: number;
  }>;
  resolutionStrategy: ConflictResolution;
  resolvedData?: any;
  resolvedAt?: number;
  resolvedBy?: string;
}

/**
 * 数据同步管理器
 */
export class DataSyncManager {
  private eventBus: EventBus;
  private redis: Redis;
  private syncConfigs: Map<EntityType, SyncConfig> = new Map();
  private pendingSyncs: Map<string, SyncRecord> = new Map();
  private conflicts: Map<string, ConflictRecord> = new Map();
  private batchQueues: Map<EntityType, SyncRecord[]> = new Map();
  private syncIntervals: Map<EntityType, NodeJS.Timeout> = new Map();

  constructor(eventBus: EventBus, redis: Redis) {
    this.eventBus = eventBus;
    this.redis = redis;
    this.setupEventListeners();
    this.startBatchProcessors();
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 监听数据变更事件
    this.eventBus.subscribe(EventType.USER_PROFILE_UPDATED, this.handleUserUpdate.bind(this));
    this.eventBus.subscribe(EventType.GAME_SESSION_STARTED, this.handleGameSessionUpdate.bind(this));
    this.eventBus.subscribe(EventType.GAME_SESSION_ENDED, this.handleGameSessionUpdate.bind(this));
    this.eventBus.subscribe(EventType.AI_MODEL_UPDATED, this.handleAIModelUpdate.bind(this));
    this.eventBus.subscribe(EventType.COMPANION_LEVEL_UP, this.handleCompanionUpdate.bind(this));
    this.eventBus.subscribe(EventType.USER_ACHIEVEMENT_UNLOCKED, this.handleAchievementUpdate.bind(this));
    this.eventBus.subscribe(EventType.ANALYTICS_DATA_RECEIVED, this.handleAnalyticsUpdate.bind(this));
  }

  /**
   * 配置实体同步策略
   */
  public configureSyncStrategy(entityType: EntityType, config: SyncConfig): void {
    this.syncConfigs.set(entityType, config);
    
    // 如果是批处理策略，初始化批处理队列
    if (config.strategy === SyncStrategy.BATCH) {
      this.batchQueues.set(entityType, []);
      this.startBatchProcessor(entityType, config);
    }

    logger.info(`Configured sync strategy for ${entityType}:`, config);
  }

  /**
   * 启动批处理器
   */
  private startBatchProcessors(): void {
    // 默认配置
    const defaultConfigs: Array<[EntityType, SyncConfig]> = [
      [EntityType.USER, {
        strategy: SyncStrategy.IMMEDIATE,
        retryAttempts: 3,
        retryDelay: 1000,
        conflictResolution: ConflictResolution.LAST_WRITE_WINS,
      }],
      [EntityType.GAME_SESSION, {
        strategy: SyncStrategy.BATCH,
        batchSize: 100,
        batchInterval: 5000, // 5秒
        retryAttempts: 3,
        conflictResolution: ConflictResolution.LAST_WRITE_WINS,
      }],
      [EntityType.AI_MODEL, {
        strategy: SyncStrategy.IMMEDIATE,
        retryAttempts: 5,
        retryDelay: 2000,
        conflictResolution: ConflictResolution.MANUAL,
      }],
      [EntityType.ANALYTICS_DATA, {
        strategy: SyncStrategy.BATCH,
        batchSize: 500,
        batchInterval: 10000, // 10秒
        retryAttempts: 2,
        conflictResolution: ConflictResolution.LAST_WRITE_WINS,
      }],
    ];

    defaultConfigs.forEach(([entityType, config]) => {
      this.configureSyncStrategy(entityType, config);
    });
  }

  // 启动单个批处理器
  private startBatchProcessor(entityType: EntityType, config: SyncConfig): void {
    const interval = setInterval(async () => {
      await this.processBatch(entityType);
    }, config.batchInterval || 5000);

    this.syncIntervals.set(entityType, interval);
  }

  /**
   * 处理数据同步请求
   */
  public async syncData(
    entityType: EntityType,
    entityId: string,
    operation: SyncOperation,
    data: any,
    sourceSystem: DataSource,
    targetSystems: DataSource[],
    metadata?: Record<string, any>
  ): Promise<string> {
    const syncRecord: SyncRecord = {
      id: this.generateSyncId(),
      entityType,
      entityId,
      operation,
      sourceSystem,
      targetSystems,
      data,
      timestamp: Date.now(),
      version: await this.getNextVersion(entityType, entityId),
      checksum: this.calculateChecksum(data),
      metadata,
      status: 'pending',
      attempts: 0,
    };

    const config = this.syncConfigs.get(entityType);
    if (!config) {
      throw new Error(`No sync configuration found for entity type: ${entityType}`);
    }

    // 根据策略处理同步
    switch (config.strategy) {
      case SyncStrategy.IMMEDIATE:
        await this.processImmediate(syncRecord, config);
        break;
      
      case SyncStrategy.BATCH:
        this.addToBatch(syncRecord);
        break;
      
      case SyncStrategy.SCHEDULED:
        this.scheduleSync(syncRecord, config);
        break;
      
      case SyncStrategy.EVENTUAL:
        this.addToEventualQueue(syncRecord);
        break;
    }

    this.pendingSyncs.set(syncRecord.id, syncRecord);
    
    // 持久化同步记录
    await this.persistSyncRecord(syncRecord);

    logger.debug(`Sync initiated for ${entityType}:${entityId}`, {
      syncId: syncRecord.id,
      strategy: config.strategy,
    });

    return syncRecord.id;
  }

  // 立即处理同步
  private async processImmediate(syncRecord: SyncRecord, config: SyncConfig): Promise<void> {
    syncRecord.status = 'processing';
    
    try {
      await this.executeSyncOperation(syncRecord);
      syncRecord.status = 'completed';
      
      // 发布同步完成事件
      await this.eventBus.publish(EventType.SYSTEM_CACHE_INVALIDATED, {
        entityType: syncRecord.entityType,
        entityId: syncRecord.entityId,
        syncId: syncRecord.id,
      });
      
    } catch (error) {
      await this.handleSyncError(syncRecord, error as Error, config);
    }
    
    await this.updateSyncRecord(syncRecord);
  }

  // 批处理同步
  private addToBatch(syncRecord: SyncRecord): void {
    const queue = this.batchQueues.get(syncRecord.entityType);
    if (queue) {
      queue.push(syncRecord);
    }
  }

  // 处理批处理
  private async processBatch(entityType: EntityType): Promise<void> {
    const queue = this.batchQueues.get(entityType);
    const config = this.syncConfigs.get(entityType);
    
    if (!queue || !config || queue.length === 0) {
      return;
    }

    const batchSize = config.batchSize || 100;
    const batch = queue.splice(0, batchSize);
    
    logger.info(`Processing batch sync for ${entityType}: ${batch.length} records`);

    const promises = batch.map(async (syncRecord) => {
      syncRecord.status = 'processing';
      
      try {
        await this.executeSyncOperation(syncRecord);
        syncRecord.status = 'completed';
      } catch (error) {
        await this.handleSyncError(syncRecord, error as Error, config);
      }
      
      await this.updateSyncRecord(syncRecord);
    });

    await Promise.allSettled(promises);
  }

  // 执行同步操作
  private async executeSyncOperation(syncRecord: SyncRecord): Promise<void> {
    const { targetSystems, operation, data, entityType, entityId } = syncRecord;

    for (const targetSystem of targetSystems) {
      await this.syncToTarget(targetSystem, operation, entityType, entityId, data);
    }
  }

  // 同步到目标系统
  private async syncToTarget(
    targetSystem: DataSource,
    operation: SyncOperation,
    entityType: EntityType,
    entityId: string,
    data: any
  ): Promise<void> {
    switch (targetSystem) {
      case DataSource.POSTGRES_PRIMARY:
        await this.syncToPostgres(operation, entityType, entityId, data);
        break;
      
      case DataSource.REDIS_CACHE:
        await this.syncToRedisCache(operation, entityType, entityId, data);
        break;
      
      case DataSource.CLICKHOUSE_ANALYTICS:
        await this.syncToClickHouse(operation, entityType, entityId, data);
        break;
      
      case DataSource.AI_SERVICE:
        await this.syncToAIService(operation, entityType, entityId, data);
        break;
      
      default:
        throw new Error(`Unsupported target system: ${targetSystem}`);
    }
  }

  // 同步到PostgreSQL
  private async syncToPostgres(
    operation: SyncOperation,
    entityType: EntityType,
    entityId: string,
    data: any
  ): Promise<void> {
    // 这里应该调用实际的数据库操作
    logger.debug(`Syncing to PostgreSQL: ${operation} ${entityType}:${entityId}`);
    
    // 模拟数据库操作
    switch (operation) {
      case SyncOperation.CREATE:
      case SyncOperation.UPSERT:
        // await prisma[entityType].upsert({ where: { id: entityId }, data });
        break;
      case SyncOperation.UPDATE:
        // await prisma[entityType].update({ where: { id: entityId }, data });
        break;
      case SyncOperation.DELETE:
        // await prisma[entityType].delete({ where: { id: entityId } });
        break;
    }
  }

  // 同步到Redis缓存
  private async syncToRedisCache(
    operation: SyncOperation,
    entityType: EntityType,
    entityId: string,
    data: any
  ): Promise<void> {
    const key = `cache:${entityType}:${entityId}`;
    
    switch (operation) {
      case SyncOperation.CREATE:
      case SyncOperation.UPDATE:
      case SyncOperation.UPSERT:
        await this.redis.setex(key, 3600, JSON.stringify(data)); // 1小时TTL
        break;
      case SyncOperation.DELETE:
        await this.redis.del(key);
        break;
    }
  }

  // 同步到ClickHouse
  private async syncToClickHouse(
    operation: SyncOperation,
    entityType: EntityType,
    entityId: string,
    data: any
  ): Promise<void> {
    // ClickHouse通常用于分析数据，主要是插入操作
    if (operation === SyncOperation.CREATE || operation === SyncOperation.UPSERT) {
      const analyticsData = this.transformToAnalyticsFormat(entityType, entityId, data);
      // 发送到ClickHouse的HTTP接口
      // await clickhouseClient.insert(analyticsData);
    }
  }

  // 同步到AI服务
  private async syncToAIService(
    operation: SyncOperation,
    entityType: EntityType,
    entityId: string,
    data: any
  ): Promise<void> {
    // 通知AI服务数据变更
    const aiData = this.transformToAIFormat(entityType, entityId, data);
    // await aiServiceClient.notify(operation, aiData);
  }

  // 处理同步错误
  private async handleSyncError(
    syncRecord: SyncRecord,
    error: Error,
    config: SyncConfig
  ): Promise<void> {
    syncRecord.attempts += 1;
    syncRecord.lastError = error.message;

    if (syncRecord.attempts < (config.retryAttempts || 3)) {
      // 重试
      syncRecord.status = 'pending';
      setTimeout(async () => {
        await this.processImmediate(syncRecord, config);
      }, (config.retryDelay || 1000) * syncRecord.attempts);
    } else {
      // 失败
      syncRecord.status = 'failed';
      
      // 发布同步失败事件
      await this.eventBus.publish(EventType.SYSTEM_ERROR_OCCURRED, {
        type: 'sync_failure',
        syncId: syncRecord.id,
        entityType: syncRecord.entityType,
        entityId: syncRecord.entityId,
        error: error.message,
      });
    }

    logger.error(`Sync error for ${syncRecord.entityType}:${syncRecord.entityId}`, {
      syncId: syncRecord.id,
      attempts: syncRecord.attempts,
      error: error.message,
    });
  }

  // 事件处理器
  private async handleUserUpdate(eventData: EventData): Promise<void> {
    await this.syncData(
      EntityType.USER,
      eventData.userId!,
      SyncOperation.UPDATE,
      eventData.data,
      DataSource.POSTGRES_PRIMARY,
      [DataSource.REDIS_CACHE, DataSource.CLICKHOUSE_ANALYTICS]
    );
  }

  private async handleGameSessionUpdate(eventData: EventData): Promise<void> {
    await this.syncData(
      EntityType.GAME_SESSION,
      eventData.data.sessionId,
      SyncOperation.UPSERT,
      eventData.data,
      DataSource.POSTGRES_PRIMARY,
      [DataSource.REDIS_CACHE, DataSource.CLICKHOUSE_ANALYTICS, DataSource.AI_SERVICE]
    );
  }

  private async handleAIModelUpdate(eventData: EventData): Promise<void> {
    await this.syncData(
      EntityType.AI_MODEL,
      eventData.data.modelId,
      SyncOperation.UPDATE,
      eventData.data,
      DataSource.AI_SERVICE,
      [DataSource.POSTGRES_PRIMARY, DataSource.REDIS_CACHE]
    );
  }

  private async handleCompanionUpdate(eventData: EventData): Promise<void> {
    await this.syncData(
      EntityType.COMPANION,
      eventData.data.companionId,
      SyncOperation.UPDATE,
      eventData.data,
      DataSource.POSTGRES_PRIMARY,
      [DataSource.REDIS_CACHE, DataSource.CLICKHOUSE_ANALYTICS]
    );
  }

  private async handleAchievementUpdate(eventData: EventData): Promise<void> {
    await this.syncData(
      EntityType.ACHIEVEMENT,
      eventData.data.achievementId,
      SyncOperation.CREATE,
      eventData.data,
      DataSource.POSTGRES_PRIMARY,
      [DataSource.REDIS_CACHE, DataSource.CLICKHOUSE_ANALYTICS]
    );
  }

  private async handleAnalyticsUpdate(eventData: EventData): Promise<void> {
    await this.syncData(
      EntityType.ANALYTICS_DATA,
      eventData.data.dataId,
      SyncOperation.CREATE,
      eventData.data,
      DataSource.CLICKHOUSE_ANALYTICS,
      []
    );
  }

  // 辅助方法
  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChecksum(data: any): string {
    // 简单的校验和计算
    const crypto = require('crypto');
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  private async getNextVersion(entityType: EntityType, entityId: string): Promise<number> {
    const key = `version:${entityType}:${entityId}`;
    return await this.redis.incr(key);
  }

  private async persistSyncRecord(syncRecord: SyncRecord): Promise<void> {
    const key = `sync_record:${syncRecord.id}`;
    await this.redis.setex(key, 86400, JSON.stringify(syncRecord)); // 24小时TTL
  }

  private async updateSyncRecord(syncRecord: SyncRecord): Promise<void> {
    this.pendingSyncs.set(syncRecord.id, syncRecord);
    await this.persistSyncRecord(syncRecord);
  }

  private transformToAnalyticsFormat(entityType: EntityType, entityId: string, data: any): any {
    return {
      entity_type: entityType,
      entity_id: entityId,
      timestamp: new Date(),
      data: JSON.stringify(data),
      created_at: new Date(),
    };
  }

  private transformToAIFormat(entityType: EntityType, entityId: string, data: any): any {
    return {
      entityType,
      entityId,
      data,
      timestamp: Date.now(),
    };
  }

  private scheduleSync(syncRecord: SyncRecord, config: SyncConfig): void {
    // 实现定时同步逻辑
    setTimeout(async () => {
      await this.processImmediate(syncRecord, config);
    }, 60000); // 1分钟后执行
  }

  private addToEventualQueue(syncRecord: SyncRecord): void {
    // 实现最终一致性队列
    // 可以使用专门的队列系统如RabbitMQ或Kafka
  }

  /**
   * 获取同步状态
   */
  public async getSyncStatus(syncId: string): Promise<SyncRecord | null> {
    const syncRecord = this.pendingSyncs.get(syncId);
    if (syncRecord) {
      return syncRecord;
    }

    // 从Redis恢复
    const key = `sync_record:${syncId}`;
    const data = await this.redis.get(key);
    if (data) {
      return JSON.parse(data);
    }

    return null;
  }

  /**
   * 获取同步统计
   */
  public getSyncStats(): any {
    const stats: Record<string, any> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      conflicts: 0,
    };

    this.pendingSyncs.forEach(record => {
      stats[record.status] = (stats[record.status] || 0) + 1;
    });

    stats.conflicts = this.conflicts.size;

    return stats;
  }

  /**
   * 清理完成的同步记录
   */
  public async cleanupCompletedSyncs(): Promise<void> {
    const toDelete: string[] = [];
    
    this.pendingSyncs.forEach((record, id) => {
      if (record.status === 'completed' && 
          Date.now() - record.timestamp > 86400000) { // 24小时
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => {
      this.pendingSyncs.delete(id);
    });

    logger.info(`Cleaned up ${toDelete.length} completed sync records`);
  }

  /**
   * 关闭同步管理器
   */
  public async shutdown(): Promise<void> {
    // 停止所有间隔定时器
    this.syncIntervals.forEach(interval => {
      clearInterval(interval);
    });

    // 处理剩余的批处理队列
    for (const entityType of this.batchQueues.keys()) {
      await this.processBatch(entityType);
    }

    logger.info('DataSyncManager shutdown completed');
  }
}

export default DataSyncManager;