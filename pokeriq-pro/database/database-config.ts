/**
 * PokerIQ Pro - Multi-Database Architecture Configuration
 * PostgreSQL + Redis + ClickHouse 高性能数据架构
 */

import { Pool, PoolConfig } from 'pg';
import Redis from 'ioredis';
import { createClient } from '@clickhouse/client';

// ===== PostgreSQL Configuration =====
export interface PostgreSQLConfig {
  primary: PoolConfig;
  replica?: PoolConfig;
  analytics?: PoolConfig;
}

export const pgConfig: PostgreSQLConfig = {
  // 主数据库 - 处理事务性数据
  primary: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'pokeriq_pro',
    user: process.env.POSTGRES_USER || 'pokeriq_user',
    password: process.env.POSTGRES_PASSWORD || 'secure_password',
    
    // 连接池配置
    min: 10,  // 最小连接数
    max: 100, // 最大连接数
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    
    // 性能优化配置
    statement_timeout: '30s',
    query_timeout: 30000,
    
    // SSL配置（生产环境）
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    
    // 应用名称标识
    application_name: 'pokeriq-pro-primary'
  },
  
  // 只读副本 - 处理查询密集操作
  replica: {
    host: process.env.POSTGRES_REPLICA_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_REPLICA_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'pokeriq_pro',
    user: process.env.POSTGRES_REPLICA_USER || 'pokeriq_readonly',
    password: process.env.POSTGRES_REPLICA_PASSWORD || 'readonly_password',
    
    min: 5,
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    
    application_name: 'pokeriq-pro-replica'
  }
};

// ===== Redis Configuration =====
export interface RedisConfig {
  primary: Redis.RedisOptions;
  cache: Redis.RedisOptions;
  session: Redis.RedisOptions;
  queue: Redis.RedisOptions;
}

export const redisConfig: RedisConfig = {
  // 主Redis实例 - 缓存热点数据
  primary: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: parseInt(process.env.REDIS_DB || '0'),
    password: process.env.REDIS_PASSWORD || undefined,
    
    // 连接配置
    connectTimeout: 2000,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
    
    // 重试配置
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    
    // 性能配置
    commandTimeout: 5000,
    
    // 键命名空间
    keyPrefix: 'pokeriq:',
    
    // 集群配置
    enableOfflineQueue: false
  },
  
  // 缓存专用Redis实例
  cache: {
    host: process.env.REDIS_CACHE_HOST || 'localhost',
    port: parseInt(process.env.REDIS_CACHE_PORT || '6380'),
    db: 1,
    password: process.env.REDIS_CACHE_PASSWORD || undefined,
    
    connectTimeout: 2000,
    lazyConnect: true,
    keyPrefix: 'cache:',
    
    // 缓存专用配置
    commandTimeout: 3000,
    maxRetriesPerRequest: 2
  },
  
  // 会话存储Redis实例
  session: {
    host: process.env.REDIS_SESSION_HOST || 'localhost',
    port: parseInt(process.env.REDIS_SESSION_PORT || '6381'),
    db: 2,
    password: process.env.REDIS_SESSION_PASSWORD || undefined,
    
    connectTimeout: 2000,
    lazyConnect: true,
    keyPrefix: 'session:',
    
    // 会话专用配置
    commandTimeout: 5000,
    maxRetriesPerRequest: 1
  },
  
  // 消息队列Redis实例
  queue: {
    host: process.env.REDIS_QUEUE_HOST || 'localhost',
    port: parseInt(process.env.REDIS_QUEUE_PORT || '6382'),
    db: 3,
    password: process.env.REDIS_QUEUE_PASSWORD || undefined,
    
    connectTimeout: 2000,
    lazyConnect: true,
    keyPrefix: 'queue:',
    
    // 队列专用配置
    commandTimeout: 10000,
    maxRetriesPerRequest: 5
  }
};

// ===== ClickHouse Configuration =====
export interface ClickHouseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  clickhouse_settings?: Record<string, any>;
  compression?: {
    request: boolean;
    response: boolean;
  };
}

export const clickhouseConfig: ClickHouseConfig = {
  host: process.env.CLICKHOUSE_HOST || 'localhost',
  port: parseInt(process.env.CLICKHOUSE_PORT || '8123'),
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DB || 'pokeriq_analytics',
  
  // ClickHouse性能配置
  clickhouse_settings: {
    // 查询性能优化
    max_threads: 4,
    max_memory_usage: '4000000000', // 4GB
    
    // 插入性能优化
    async_insert: 1,
    wait_for_async_insert: 0,
    async_insert_max_data_size: '10000000', // 10MB
    async_insert_busy_timeout_ms: 200,
    
    // 网络优化
    http_receive_timeout: 30,
    http_send_timeout: 30,
    
    // 数据压缩
    network_compression_method: 'lz4',
    
    // 分布式查询优化
    distributed_product_mode: 'global',
    prefer_localhost_replica: 1
  },
  
  // 启用压缩
  compression: {
    request: true,
    response: true
  }
};

// ===== Database Connection Managers =====

class DatabaseManager {
  private static instance: DatabaseManager;
  
  // PostgreSQL连接池
  private primaryPool?: Pool;
  private replicaPool?: Pool;
  
  // Redis连接
  private redisConnections: Map<string, Redis> = new Map();
  
  // ClickHouse客户端
  private clickhouseClient?: any;
  
  private constructor() {}
  
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }
  
  // 初始化所有数据库连接
  async initialize(): Promise<void> {
    try {
      // 初始化PostgreSQL连接池
      await this.initializePostgreSQL();
      
      // 初始化Redis连接
      await this.initializeRedis();
      
      // 初始化ClickHouse连接
      await this.initializeClickHouse();
      
      console.log('✅ 所有数据库连接初始化成功');
    } catch (error) {
      console.error('❌ 数据库连接初始化失败:', error);
      throw error;
    }
  }
  
  private async initializePostgreSQL(): Promise<void> {
    // 主数据库连接池
    this.primaryPool = new Pool(pgConfig.primary);
    
    // 测试主数据库连接
    await this.primaryPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL主数据库连接成功');
    
    // 副本数据库连接池（如果配置了的话）
    if (pgConfig.replica) {
      this.replicaPool = new Pool(pgConfig.replica);
      await this.replicaPool.query('SELECT NOW()');
      console.log('✅ PostgreSQL副本数据库连接成功');
    }
    
    // 监听连接池事件
    this.primaryPool.on('error', (err) => {
      console.error('PostgreSQL主数据库连接池错误:', err);
    });
    
    if (this.replicaPool) {
      this.replicaPool.on('error', (err) => {
        console.error('PostgreSQL副本数据库连接池错误:', err);
      });
    }
  }
  
  private async initializeRedis(): Promise<void> {
    const redisInstances = [
      { name: 'primary', config: redisConfig.primary },
      { name: 'cache', config: redisConfig.cache },
      { name: 'session', config: redisConfig.session },
      { name: 'queue', config: redisConfig.queue }
    ];
    
    for (const { name, config } of redisInstances) {
      const redis = new Redis(config);
      
      // 测试连接
      await redis.ping();
      
      // 监听连接事件
      redis.on('connect', () => {
        console.log(`✅ Redis ${name} 连接成功`);
      });
      
      redis.on('error', (err) => {
        console.error(`❌ Redis ${name} 连接错误:`, err);
      });
      
      redis.on('reconnecting', () => {
        console.log(`🔄 Redis ${name} 重新连接中...`);
      });
      
      this.redisConnections.set(name, redis);
    }
  }
  
  private async initializeClickHouse(): Promise<void> {
    this.clickhouseClient = createClient(clickhouseConfig);
    
    // 测试连接
    const result = await this.clickhouseClient.query({
      query: 'SELECT version()',
      format: 'JSONEachRow'
    });
    
    console.log('✅ ClickHouse连接成功');
  }
  
  // 获取PostgreSQL连接
  getPrimaryPool(): Pool {
    if (!this.primaryPool) {
      throw new Error('PostgreSQL主数据库连接池未初始化');
    }
    return this.primaryPool;
  }
  
  getReplicaPool(): Pool {
    if (!this.replicaPool) {
      // 如果没有副本，返回主数据库连接池
      return this.getPrimaryPool();
    }
    return this.replicaPool;
  }
  
  // 获取Redis连接
  getRedis(instance: 'primary' | 'cache' | 'session' | 'queue'): Redis {
    const redis = this.redisConnections.get(instance);
    if (!redis) {
      throw new Error(`Redis ${instance} 连接未初始化`);
    }
    return redis;
  }
  
  // 获取ClickHouse客户端
  getClickHouse(): any {
    if (!this.clickhouseClient) {
      throw new Error('ClickHouse客户端未初始化');
    }
    return this.clickhouseClient;
  }
  
  // 健康检查
  async healthCheck(): Promise<{
    postgresql: { primary: boolean; replica: boolean };
    redis: { primary: boolean; cache: boolean; session: boolean; queue: boolean };
    clickhouse: boolean;
  }> {
    const health = {
      postgresql: { primary: false, replica: false },
      redis: { primary: false, cache: false, session: false, queue: false },
      clickhouse: false
    };
    
    // 检查PostgreSQL
    try {
      await this.primaryPool?.query('SELECT 1');
      health.postgresql.primary = true;
    } catch (error) {
      console.error('PostgreSQL主数据库健康检查失败:', error);
    }
    
    try {
      await this.replicaPool?.query('SELECT 1');
      health.postgresql.replica = true;
    } catch (error) {
      console.error('PostgreSQL副本数据库健康检查失败:', error);
    }
    
    // 检查Redis
    for (const [name, redis] of this.redisConnections) {
      try {
        await redis.ping();
        (health.redis as any)[name] = true;
      } catch (error) {
        console.error(`Redis ${name} 健康检查失败:`, error);
      }
    }
    
    // 检查ClickHouse
    try {
      await this.clickhouseClient?.query({
        query: 'SELECT 1',
        format: 'JSONEachRow'
      });
      health.clickhouse = true;
    } catch (error) {
      console.error('ClickHouse健康检查失败:', error);
    }
    
    return health;
  }
  
  // 优雅关闭所有连接
  async close(): Promise<void> {
    console.log('🔄 正在关闭所有数据库连接...');
    
    // 关闭PostgreSQL连接池
    await this.primaryPool?.end();
    await this.replicaPool?.end();
    
    // 关闭Redis连接
    for (const [name, redis] of this.redisConnections) {
      redis.disconnect();
    }
    
    // 关闭ClickHouse连接
    await this.clickhouseClient?.close();
    
    console.log('✅ 所有数据库连接已关闭');
  }
}

// 导出数据库管理器实例
export const dbManager = DatabaseManager.getInstance();

// 导出便捷访问方法
export const getDB = {
  primary: () => dbManager.getPrimaryPool(),
  replica: () => dbManager.getReplicaPool(),
  redis: {
    primary: () => dbManager.getRedis('primary'),
    cache: () => dbManager.getRedis('cache'),
    session: () => dbManager.getRedis('session'),
    queue: () => dbManager.getRedis('queue')
  },
  clickhouse: () => dbManager.getClickHouse()
};

// 数据库连接状态类型
export type DatabaseHealth = Awaited<ReturnType<typeof dbManager.healthCheck>>;