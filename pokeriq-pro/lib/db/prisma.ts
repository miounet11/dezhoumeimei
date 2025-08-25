import { PrismaClient, Prisma } from '@prisma/client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('database');

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Database Connection Pool Configuration for 100万+ Concurrent Users
 */
interface DatabasePoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  readReplicaUrls?: string[];
  writeUrl: string;
}

const getPoolConfig = (): DatabasePoolConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    maxConnections: isProduction ? 100 : 20,
    minConnections: isProduction ? 10 : 2,
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
    writeUrl: process.env.DATABASE_URL || '',
    readReplicaUrls: process.env.DATABASE_READ_REPLICAS?.split(',') || [],
  };
};

/**
 * Enhanced Prisma Client with Connection Pooling and Load Balancing
 */
const createPrismaClient = (isReplica: boolean = false, url?: string) => {
  const poolConfig = getPoolConfig();
  
  return new PrismaClient({
    // 高性能日志配置
    log: process.env.NODE_ENV === 'development' 
      ? [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'info', emit: 'event' },
          { level: 'warn', emit: 'event' }
        ]
      : [
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' }
        ],
    
    errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
    
    // 数据源配置 - 支持读写分离
    datasources: {
      db: {
        url: url || (isReplica ? poolConfig.readReplicaUrls[0] : poolConfig.writeUrl)
      }
    }
  });
};

/**
 * Database Connection Pool Manager for AI Companion System
 * 支持读写分离、连接池管理、负载均衡
 */
class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool;
  private writeClient: PrismaClient;
  private readClients: PrismaClient[] = [];
  private poolConfig: DatabasePoolConfig;
  private connectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    readConnections: 0,
    writeConnections: 0,
    totalQueries: 0,
    slowQueries: 0,
    errors: 0,
  };
  
  private currentReadIndex = 0;

  private constructor() {
    this.poolConfig = getPoolConfig();
    this.initializeConnections();
    this.setupMonitoring();
  }

  static getInstance(): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool();
    }
    return DatabaseConnectionPool.instance;
  }

  /**
   * 初始化数据库连接
   */
  private initializeConnections(): void {
    // 初始化写入客户端
    this.writeClient = createPrismaClient(false, this.poolConfig.writeUrl);
    this.connectionStats.writeConnections++;
    
    // 初始化读取客户端池
    if (this.poolConfig.readReplicaUrls.length > 0) {
      this.poolConfig.readReplicaUrls.forEach(url => {
        const readClient = createPrismaClient(true, url);
        this.readClients.push(readClient);
        this.connectionStats.readConnections++;
      });
    } else {
      // 如果没有读副本，使用写入客户端
      this.readClients.push(this.writeClient);
    }
    
    this.connectionStats.totalConnections = 
      this.connectionStats.writeConnections + this.connectionStats.readConnections;
      
    logger.info('Database connection pool initialized', {
      writeConnections: this.connectionStats.writeConnections,
      readConnections: this.connectionStats.readConnections,
      totalConnections: this.connectionStats.totalConnections,
    });
  }

  /**
   * 设置性能监控
   */
  private setupMonitoring(): void {
    // 监控写入客户端
    this.setupClientMonitoring(this.writeClient, 'write');
    
    // 监控读取客户端
    this.readClients.forEach((client, index) => {
      this.setupClientMonitoring(client, `read-${index}`);
    });
  }

  private setupClientMonitoring(client: PrismaClient, type: string): void {
    client.$on('query', (e) => {
      this.connectionStats.totalQueries++;
      
      if (e.duration > 1000) {
        this.connectionStats.slowQueries++;
        logger.warn(`Slow query detected on ${type}`, {
          duration: e.duration,
          query: e.query.substring(0, 100),
        });
      }
    });

    client.$on('error', (e) => {
      this.connectionStats.errors++;
      logger.error(`Database error on ${type}`, { error: e });
    });
  }

  /**
   * 获取写入客户端 - 用于创建、更新、删除操作
   */
  getWriteClient(): PrismaClient {
    this.connectionStats.activeConnections++;
    return this.writeClient;
  }

  /**
   * 获取读取客户端 - 用于查询操作，支持负载均衡
   */
  getReadClient(): PrismaClient {
    if (this.readClients.length === 0) {
      return this.getWriteClient();
    }

    // 轮询负载均衡
    const client = this.readClients[this.currentReadIndex];
    this.currentReadIndex = (this.currentReadIndex + 1) % this.readClients.length;
    
    this.connectionStats.activeConnections++;
    return client;
  }

  /**
   * 智能客户端选择 - 根据操作类型和负载自动选择
   */
  getOptimalClient(operationType: 'read' | 'write' | 'auto' = 'auto'): PrismaClient {
    if (operationType === 'write') {
      return this.getWriteClient();
    }
    
    if (operationType === 'read') {
      return this.getReadClient();
    }
    
    // 自动选择 - 根据当前负载
    const readLoad = this.connectionStats.readConnections > 0 
      ? this.connectionStats.activeConnections / this.connectionStats.readConnections 
      : 1;
    
    // 如果读取负载较高，使用写入客户端分担
    if (readLoad > 0.8 && this.readClients.length > 1) {
      return this.getWriteClient();
    }
    
    return this.getReadClient();
  }

  /**
   * 伴侣系统专用客户端获取
   */
  getCompanionClient(operation: 'read' | 'write'): PrismaClient {
    // 伴侣系统优化：情感状态和对话历史优先使用读客户端
    if (operation === 'read') {
      return this.getReadClient();
    }
    return this.getWriteClient();
  }

  /**
   * 批量操作客户端
   */
  getBatchClient(): PrismaClient {
    // 批量操作使用写入客户端，避免读写分离问题
    return this.getWriteClient();
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    writeHealthy: boolean;
    readHealthy: boolean;
    stats: typeof this.connectionStats;
  }> {
    let writeHealthy = false;
    let readHealthy = false;

    // 检查写入客户端
    try {
      await this.writeClient.$queryRaw`SELECT 1`;
      writeHealthy = true;
    } catch (error) {
      logger.error('Write client health check failed', { error });
    }

    // 检查读取客户端
    try {
      const readClient = this.getReadClient();
      await readClient.$queryRaw`SELECT 1`;
      readHealthy = true;
    } catch (error) {
      logger.error('Read client health check failed', { error });
    }

    const healthy = writeHealthy && (readHealthy || this.readClients.length === 0);

    return {
      healthy,
      writeHealthy,
      readHealthy,
      stats: { ...this.connectionStats },
    };
  }

  /**
   * 获取连接池统计信息
   */
  getStats() {
    return {
      ...this.connectionStats,
      poolConfig: this.poolConfig,
      readReplicaCount: this.readClients.length,
      avgQueriesPerConnection: this.connectionStats.totalQueries / this.connectionStats.totalConnections,
      errorRate: this.connectionStats.errors / Math.max(this.connectionStats.totalQueries, 1),
      slowQueryRate: this.connectionStats.slowQueries / Math.max(this.connectionStats.totalQueries, 1),
    };
  }

  /**
   * 优雅关闭所有连接
   */
  async gracefulShutdown(): Promise<void> {
    logger.info('Starting graceful database shutdown...');
    
    const shutdownPromises: Promise<void>[] = [];
    
    // 关闭写入客户端
    shutdownPromises.push(this.writeClient.$disconnect());
    
    // 关闭读取客户端
    this.readClients.forEach(client => {
      if (client !== this.writeClient) {
        shutdownPromises.push(client.$disconnect());
      }
    });

    try {
      await Promise.all(shutdownPromises);
      logger.info('Database connections closed gracefully');
    } catch (error) {
      logger.error('Error during database shutdown', { error });
    }
  }
}

// 导出单例实例
export const dbPool = DatabaseConnectionPool.getInstance();

// 向后兼容的默认客户端
export const prisma = dbPool.getOptimalClient();

// 性能监控 - 开发环境
if (process.env.NODE_ENV === 'development') {
  // 全局引用保留兼容性
  global.prisma = prisma;
}

/**
 * 数据库连接健康检查 - Enhanced Version
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const healthStatus = await dbPool.healthCheck();
    return healthStatus.healthy;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
};

/**
 * 获取数据库连接统计信息
 */
export const getDatabaseStats = () => {
  return dbPool.getStats();
};

/**
 * 优雅关闭数据库连接 - Enhanced Version
 */
export const gracefulShutdown = async (): Promise<void> => {
  logger.info('🔄 Starting graceful database shutdown...');
  await dbPool.gracefulShutdown();
  logger.info('✅ Database connections closed gracefully');
};

// 进程退出时优雅关闭
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);

/**
 * 伴侣系统专用数据库客户端工厂
 */
export const CompanionDatabaseClient = {
  /**
   * 获取读操作客户端 - 用于查询伴侣数据、对话历史、记忆等
   */
  read: () => dbPool.getCompanionClient('read'),
  
  /**
   * 获取写操作客户端 - 用于更新情感状态、记录互动等
   */
  write: () => dbPool.getCompanionClient('write'),
  
  /**
   * 获取批量操作客户端 - 用于批量导入记忆、历史数据等
   */
  batch: () => dbPool.getBatchClient(),
};

export default prisma;