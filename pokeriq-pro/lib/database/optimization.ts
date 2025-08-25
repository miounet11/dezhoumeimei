/**
 * 数据库性能优化配置
 * 为PokerIQ Pro设计的高性能数据库优化方案
 * 支持100万+并发用户的数据库访问
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '@/lib/logger';
import { prometheusCollector } from '@/lib/monitoring/prometheus';
import { errorMonitor } from '@/lib/monitoring/sentry';

const logger = createLogger('database-optimization');

// 数据库连接池配置
const DATABASE_CONFIG = {
  // 连接池设置
  connectionLimit: 100,
  minConnections: 10,
  maxConnections: 100,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 600000,
  
  // 查询优化
  queryTimeout: 30000,
  connectionTimeout: 10000,
  
  // SSL配置
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    ca: process.env.DATABASE_CA_CERT,
    cert: process.env.DATABASE_CLIENT_CERT,
    key: process.env.DATABASE_CLIENT_KEY,
  } : undefined,
  
  // 性能优化参数
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  errorFormat: 'pretty',
  
  // 事务设置
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: 'ReadCommitted' as const,
  },
};

/**
 * 优化的Prisma客户端
 */
export class OptimizedPrismaClient extends PrismaClient {
  private static instance: OptimizedPrismaClient;
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readReplicas: PrismaClient[] = [];
  private writeClient: PrismaClient;

  constructor() {
    super({
      ...DATABASE_CONFIG,
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    this.writeClient = this;
    this.setupMiddleware();
    this.setupReadReplicas();
  }

  static getInstance(): OptimizedPrismaClient {
    if (!OptimizedPrismaClient.instance) {
      OptimizedPrismaClient.instance = new OptimizedPrismaClient();
    }
    return OptimizedPrismaClient.instance;
  }

  /**
   * 设置中间件
   */
  private setupMiddleware() {
    // 查询性能监控中间件
    this.$use(async (params, next) => {
      const startTime = Date.now();
      const { model, action } = params;

      try {
        const result = await next(params);
        const duration = Date.now() - startTime;

        // 记录查询指标
        prometheusCollector.recordDbQuery(action, model || 'unknown', duration, true);

        // 慢查询告警
        if (duration > 1000) {
          errorMonitor.capturePerformanceIssue({
            type: 'slow_db',
            metric: 'query_time',
            value: duration,
            threshold: 1000,
            query: `${action} on ${model}`,
          });

          logger.warn('Slow query detected', {
            model,
            action,
            duration,
            args: JSON.stringify(params.args),
          });
        }

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        prometheusCollector.recordDbQuery(action, model || 'unknown', duration, false);

        errorMonitor.captureException(error, {
          tags: { type: 'database_error', model, action },
          extra: { duration, args: params.args },
        });

        throw error;
      }
    });

    // 查询缓存中间件
    this.$use(async (params, next) => {
      const { model, action, args } = params;

      // 只缓存读操作
      if (!['findFirst', 'findUnique', 'findMany', 'count', 'aggregate'].includes(action)) {
        return next(params);
      }

      const cacheKey = this.generateCacheKey(model, action, args);
      const cached = this.queryCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        prometheusCollector.recordCacheHit('query_cache', 'database');
        return cached.data;
      }

      const result = await next(params);

      // 缓存结果
      const ttl = this.getCacheTTL(model, action);
      if (ttl > 0) {
        this.queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl,
        });
      }

      prometheusCollector.recordCacheMiss('query_cache', 'database');
      return result;
    });
  }

  /**
   * 设置读副本
   */
  private setupReadReplicas() {
    const readReplicaUrls = [
      process.env.DATABASE_READ_REPLICA_1_URL,
      process.env.DATABASE_READ_REPLICA_2_URL,
      process.env.DATABASE_READ_REPLICA_3_URL,
    ].filter(Boolean);

    this.readReplicas = readReplicaUrls.map(url => 
      new PrismaClient({
        ...DATABASE_CONFIG,
        datasources: { db: { url } },
      })
    );

    logger.info(`Initialized ${this.readReplicas.length} read replicas`);
  }

  /**
   * 智能路由：读写分离
   */
  private getClient(operation: 'read' | 'write'): PrismaClient {
    if (operation === 'write' || this.readReplicas.length === 0) {
      return this.writeClient;
    }

    // 负载均衡选择读副本
    const replicaIndex = Math.floor(Math.random() * this.readReplicas.length);
    return this.readReplicas[replicaIndex];
  }

  /**
   * 优化的查询方法
   */
  async optimizedFindMany<T>(
    model: string,
    params: any,
    options: {
      useCache?: boolean;
      useReadReplica?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<T[]> {
    const {
      useCache = true,
      useReadReplica = true,
      batchSize = 1000,
    } = options;

    const client = useReadReplica ? this.getClient('read') : this.writeClient;

    // 分页查询大量数据
    if (params.take && params.take > batchSize) {
      const results: T[] = [];
      const totalPages = Math.ceil(params.take / batchSize);

      for (let page = 0; page < totalPages; page++) {
        const batchParams = {
          ...params,
          take: Math.min(batchSize, params.take - page * batchSize),
          skip: (params.skip || 0) + page * batchSize,
        };

        const batchResults = await (client as any)[model].findMany(batchParams);
        results.push(...batchResults);
      }

      return results;
    }

    return (client as any)[model].findMany(params);
  }

  /**
   * 批量操作优化
   */
  async optimizedBatchOperation<T>(
    operations: Array<() => Promise<T>>,
    options: {
      batchSize?: number;
      concurrent?: boolean;
    } = {}
  ): Promise<T[]> {
    const { batchSize = 50, concurrent = true } = options;
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);

      if (concurrent) {
        const batchResults = await Promise.all(batch.map(op => op()));
        results.push(...batchResults);
      } else {
        for (const operation of batch) {
          const result = await operation();
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * 事务优化
   */
  async optimizedTransaction<T>(
    operations: (tx: PrismaClient) => Promise<T>,
    options: {
      timeout?: number;
      maxRetries?: number;
    } = {}
  ): Promise<T> {
    const { timeout = 10000, maxRetries = 3 } = options;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await this.$transaction(operations, {
          timeout,
          maxWait: 5000,
          isolationLevel: 'ReadCommitted',
        });
      } catch (error: any) {
        attempt++;
        
        if (attempt >= maxRetries) {
          throw error;
        }

        // 指数退避
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));

        logger.warn(`Transaction retry ${attempt}/${maxRetries}`, {
          error: error.message,
          delay,
        });
      }
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(model?: string, action?: string, args?: any): string {
    const key = `${model}:${action}:${JSON.stringify(args)}`;
    return Buffer.from(key).toString('base64');
  }

  /**
   * 获取缓存TTL
   */
  private getCacheTTL(model?: string, action?: string): number {
    // 根据模型和操作类型设置不同的TTL
    if (!model) return 0;

    switch (model.toLowerCase()) {
      case 'user':
        return action === 'findUnique' ? 300000 : 60000; // 5分钟 vs 1分钟
      case 'userstats':
        return 300000; // 5分钟
      case 'gamesession':
        return 60000; // 1分钟
      case 'hand':
        return 1800000; // 30分钟（历史数据）
      case 'achievement':
        return 3600000; // 1小时（相对静态）
      case 'opponent':
        return 3600000; // 1小时
      case 'testscenario':
        return 3600000; // 1小时
      default:
        return 60000; // 默认1分钟
    }
  }

  /**
   * 清理查询缓存
   */
  clearQueryCache(pattern?: string) {
    if (pattern) {
      for (const [key] of this.queryCache) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.queryCache.size,
      hitRate: prometheusCollector.getSnapshot()['cache.hit'] || 0,
      missRate: prometheusCollector.getSnapshot()['cache.miss'] || 0,
    };
  }
}

/**
 * 数据库索引优化建议
 */
export const INDEX_OPTIMIZATIONS = {
  // 用户相关索引
  user_performance_indexes: [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email_active ON "User"(email) WHERE "isBanned" = false;',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_username_active ON "User"(username) WHERE "isBanned" = false;',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_last_login ON "User"("lastLoginAt") WHERE "lastLoginAt" IS NOT NULL;',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_level_xp ON "User"(level, xp);',
  ],

  // 游戏会话索引
  game_session_indexes: [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_user_created ON "GameSession"("userId", "createdAt");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_type_created ON "GameSession"(type, "createdAt");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_result_created ON "GameSession"(result, "createdAt");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_active ON "GameSession"("userId") WHERE "completedAt" IS NULL;',
  ],

  // 手牌记录索引
  hand_indexes: [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hand_session_number ON "Hand"("sessionId", "handNumber");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hand_position_result ON "Hand"(position, result);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hand_created_session ON "Hand"("createdAt", "sessionId");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hand_pot_size ON "Hand"(pot) WHERE pot > 0;',
  ],

  // 用户统计索引
  stats_indexes: [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_winrate ON "UserStats"("winRate") WHERE "totalGames" > 100;',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_games ON "UserStats"("totalGames");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_last_active ON "UserStats"("lastActiveAt");',
  ],

  // 排行榜索引
  leaderboard_indexes: [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_period_category_rank ON "LeaderboardEntry"(period, category, rank);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_user_period ON "LeaderboardEntry"("userId", period);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_updated ON "LeaderboardEntry"("updatedAt");',
  ],

  // 技能测试索引
  skill_test_indexes: [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_scenario_category_difficulty ON "TestScenario"(category, difficulty);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_session_user_status ON "TestSession"("userId", status);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_result_session_question ON "TestResult"("sessionId", "questionNumber");',
  ],

  // 伴侣系统索引
  companion_indexes: [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_companion_user_active ON "UserCompanion"("userId") WHERE "isActive" = true;',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companion_interaction_user_created ON "CompanionInteraction"("userCompanionId", "createdAt");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gift_history_user_created ON "GiftHistory"("userCompanionId", "createdAt");',
  ],
};

/**
 * 数据库维护脚本
 */
export const MAINTENANCE_QUERIES = {
  // 清理过期数据
  cleanup_expired_data: [
    // 清理6个月前的游戏会话
    'DELETE FROM "GameSession" WHERE "createdAt" < NOW() - INTERVAL \'6 months\' AND "completedAt" IS NOT NULL;',
    
    // 清理1年前的手牌记录
    'DELETE FROM "Hand" WHERE "createdAt" < NOW() - INTERVAL \'1 year\';',
    
    // 清理过期的缓存数据
    'DELETE FROM "LeaderboardEntry" WHERE "periodEnd" < NOW() - INTERVAL \'30 days\';',
  ],

  // 统计信息更新
  update_statistics: [
    'ANALYZE "User";',
    'ANALYZE "GameSession";',
    'ANALYZE "Hand";',
    'ANALYZE "UserStats";',
    'ANALYZE "TestSession";',
  ],

  // 重建索引
  reindex_tables: [
    'REINDEX INDEX CONCURRENTLY idx_user_email_active;',
    'REINDEX INDEX CONCURRENTLY idx_game_session_user_created;',
    'REINDEX INDEX CONCURRENTLY idx_hand_session_number;',
  ],
};

// 导出优化的Prisma客户端实例
export const optimizedPrisma = OptimizedPrismaClient.getInstance();

export default optimizedPrisma;