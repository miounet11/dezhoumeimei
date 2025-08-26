import { PrismaClient } from '@prisma/client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('db-connection-pool');

interface ConnectionPoolConfig {
  // Basic pool settings
  minConnections: number;
  maxConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  
  // Advanced settings
  maxLifetimeMs: number;
  connectionValidationInterval: number;
  enableQueryLogging: boolean;
  enableSlowQueryLogging: boolean;
  slowQueryThresholdMs: number;
  
  // Read replica settings
  enableReadReplicas: boolean;
  readReplicaUrls: string[];
  readReplicaWeight: number; // 0-1, percentage of reads to route to replicas
  
  // Connection retry settings
  maxRetries: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
  
  // Health check settings
  enableHealthCheck: boolean;
  healthCheckIntervalMs: number;
  healthCheckTimeoutMs: number;
}

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalQueriesExecuted: number;
  averageQueryTime: number;
  slowQueries: number;
  connectionErrors: number;
  healthChecksPassed: number;
  healthChecksFailed: number;
  lastHealthCheck: Date | null;
  uptime: number;
}

interface PooledConnection {
  client: PrismaClient;
  id: string;
  createdAt: Date;
  lastUsedAt: Date;
  isActive: boolean;
  queryCount: number;
  totalQueryTime: number;
  isHealthy: boolean;
}

/**
 * Advanced Database Connection Pool Manager
 * Manages multiple Prisma clients with intelligent load balancing,
 * health monitoring, and performance optimization
 */
export class DatabaseConnectionPool {
  private config: ConnectionPoolConfig;
  private masterPool: PooledConnection[] = [];
  private readReplicaPools: PooledConnection[][] = [];
  private waitingQueue: Array<{
    resolve: (client: PrismaClient) => void;
    reject: (error: Error) => void;
    timestamp: Date;
    isReadOnly: boolean;
  }> = [];
  
  private metrics: ConnectionMetrics;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private startTime: Date = new Date();

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      minConnections: config.minConnections || 5,
      maxConnections: config.maxConnections || 100,
      acquireTimeoutMs: config.acquireTimeoutMs || 10000,
      idleTimeoutMs: config.idleTimeoutMs || 300000, // 5 minutes
      maxLifetimeMs: config.maxLifetimeMs || 3600000, // 1 hour
      connectionValidationInterval: config.connectionValidationInterval || 60000,
      enableQueryLogging: config.enableQueryLogging ?? false,
      enableSlowQueryLogging: config.enableSlowQueryLogging ?? true,
      slowQueryThresholdMs: config.slowQueryThresholdMs || 1000,
      enableReadReplicas: config.enableReadReplicas ?? false,
      readReplicaUrls: config.readReplicaUrls || [],
      readReplicaWeight: config.readReplicaWeight || 0.7,
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 1000,
      exponentialBackoff: config.exponentialBackoff ?? true,
      enableHealthCheck: config.enableHealthCheck ?? true,
      healthCheckIntervalMs: config.healthCheckIntervalMs || 30000,
      healthCheckTimeoutMs: config.healthCheckTimeoutMs || 5000
    };

    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      totalQueriesExecuted: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      connectionErrors: 0,
      healthChecksPassed: 0,
      healthChecksFailed: 0,
      lastHealthCheck: null,
      uptime: 0
    };

    this.initialize();
  }

  /**
   * Initialize the connection pool
   */
  private async initialize(): Promise<void> {
    try {
      logger.info('Initializing database connection pool', {
        minConnections: this.config.minConnections,
        maxConnections: this.config.maxConnections,
        enableReadReplicas: this.config.enableReadReplicas
      });

      // Create initial master connections
      await this.createInitialConnections();

      // Initialize read replica pools if enabled
      if (this.config.enableReadReplicas && this.config.readReplicaUrls.length > 0) {
        await this.initializeReadReplicas();
      }

      // Start health check and cleanup intervals
      this.startPeriodicTasks();

      logger.info('Database connection pool initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize connection pool', { error });
      throw error;
    }
  }

  /**
   * Acquire a database connection from the pool
   */
  async acquire(options: { 
    readonly?: boolean; 
    timeout?: number; 
    priority?: 'high' | 'normal' | 'low' 
  } = {}): Promise<PrismaClient> {
    const { readonly = false, timeout = this.config.acquireTimeoutMs, priority = 'normal' } = options;
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Try to get connection immediately
      const connection = this.getAvailableConnection(readonly);
      if (connection) {
        this.markConnectionAsActive(connection);
        resolve(connection.client);
        return;
      }

      // No available connection, add to queue
      this.metrics.waitingRequests++;
      
      const queueItem = {
        resolve: (client: PrismaClient) => {
          this.metrics.waitingRequests--;
          resolve(client);
        },
        reject: (error: Error) => {
          this.metrics.waitingRequests--;
          reject(error);
        },
        timestamp: new Date(),
        isReadOnly: readonly
      };

      // Add to queue based on priority
      if (priority === 'high') {
        this.waitingQueue.unshift(queueItem);
      } else {
        this.waitingQueue.push(queueItem);
      }

      // Set timeout
      setTimeout(() => {
        const index = this.waitingQueue.indexOf(queueItem);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
          this.metrics.waitingRequests--;
          reject(new Error(`Connection acquisition timeout after ${timeout}ms`));
        }
      }, timeout);

      // Try to create new connection if under limit
      if (this.canCreateNewConnection()) {
        this.createConnection()
          .then(() => this.processWaitingQueue())
          .catch(error => {
            logger.error('Failed to create new connection', { error });
          });
      }
    });
  }

  /**
   * Release a connection back to the pool
   */
  async release(client: PrismaClient): Promise<void> {
    const connection = this.findConnectionByClient(client);
    if (!connection) {
      logger.warn('Attempted to release unknown connection');
      return;
    }

    connection.isActive = false;
    connection.lastUsedAt = new Date();
    
    this.updateMetrics();
    this.processWaitingQueue();
  }

  /**
   * Execute a query with automatic connection management
   */
  async executeQuery<T>(
    queryFn: (client: PrismaClient) => Promise<T>,
    options: {
      readonly?: boolean;
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<T> {
    const { readonly = false, timeout, retries = this.config.maxRetries } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      let client: PrismaClient | null = null;
      const startTime = performance.now();

      try {
        client = await this.acquire({ readonly, timeout });
        
        const result = await queryFn(client);
        const queryTime = performance.now() - startTime;
        
        // Update connection metrics
        const connection = this.findConnectionByClient(client);
        if (connection) {
          connection.queryCount++;
          connection.totalQueryTime += queryTime;
        }
        
        // Update global metrics
        this.metrics.totalQueriesExecuted++;
        this.updateAverageQueryTime(queryTime);
        
        // Log slow queries
        if (queryTime > this.config.slowQueryThresholdMs) {
          this.metrics.slowQueries++;
          if (this.config.enableSlowQueryLogging) {
            logger.warn('Slow query detected', {
              queryTime: Math.round(queryTime),
              threshold: this.config.slowQueryThresholdMs,
              attempt,
              readonly
            });
          }
        }
        
        return result;
      } catch (error) {
        const queryTime = performance.now() - startTime;
        this.metrics.connectionErrors++;
        
        logger.error('Query execution failed', {
          attempt,
          maxRetries: retries,
          queryTime: Math.round(queryTime),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry with optional exponential backoff
        const delay = this.config.exponentialBackoff
          ? this.config.retryDelayMs * Math.pow(2, attempt - 1)
          : this.config.retryDelayMs;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } finally {
        if (client) {
          await this.release(client);
        }
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Get comprehensive pool statistics
   */
  getMetrics(): ConnectionMetrics & {
    pools: {
      master: {
        total: number;
        active: number;
        idle: number;
        connections: Array<{
          id: string;
          createdAt: Date;
          lastUsedAt: Date;
          queryCount: number;
          averageQueryTime: number;
          isHealthy: boolean;
        }>;
      };
      replicas: Array<{
        total: number;
        active: number;
        idle: number;
        url: string;
      }>;
    };
    queue: {
      waiting: number;
      oldestWait: number | null;
    };
  } {
    this.updateMetrics();
    
    const oldestWait = this.waitingQueue.length > 0
      ? Date.now() - this.waitingQueue[0].timestamp.getTime()
      : null;

    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime.getTime(),
      pools: {
        master: {
          total: this.masterPool.length,
          active: this.masterPool.filter(c => c.isActive).length,
          idle: this.masterPool.filter(c => !c.isActive).length,
          connections: this.masterPool.map(c => ({
            id: c.id,
            createdAt: c.createdAt,
            lastUsedAt: c.lastUsedAt,
            queryCount: c.queryCount,
            averageQueryTime: c.queryCount > 0 ? c.totalQueryTime / c.queryCount : 0,
            isHealthy: c.isHealthy
          }))
        },
        replicas: this.readReplicaPools.map((pool, index) => ({
          total: pool.length,
          active: pool.filter(c => c.isActive).length,
          idle: pool.filter(c => !c.isActive).length,
          url: this.config.readReplicaUrls[index] || 'unknown'
        }))
      },
      queue: {
        waiting: this.waitingQueue.length,
        oldestWait
      }
    };
  }

  /**
   * Perform health check on all connections
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    details: {
      master: { healthy: number; unhealthy: number };
      replicas: Array<{ healthy: number; unhealthy: number }>;
    };
  }> {
    try {
      // Health check master pool
      const masterResults = await Promise.allSettled(
        this.masterPool.map(connection => this.checkConnectionHealth(connection))
      );
      
      const masterHealthy = masterResults.filter(r => r.status === 'fulfilled').length;
      const masterUnhealthy = masterResults.length - masterHealthy;

      // Health check replica pools
      const replicaResults = await Promise.all(
        this.readReplicaPools.map(async (pool) => {
          const results = await Promise.allSettled(
            pool.map(connection => this.checkConnectionHealth(connection))
          );
          return {
            healthy: results.filter(r => r.status === 'fulfilled').length,
            unhealthy: results.length - results.filter(r => r.status === 'fulfilled').length
          };
        })
      );

      const isHealthy = masterHealthy > 0 && (masterUnhealthy / this.masterPool.length) < 0.5;
      
      this.metrics.lastHealthCheck = new Date();
      if (isHealthy) {
        this.metrics.healthChecksPassed++;
      } else {
        this.metrics.healthChecksFailed++;
      }

      return {
        healthy: isHealthy,
        details: {
          master: { healthy: masterHealthy, unhealthy: masterUnhealthy },
          replicas: replicaResults
        }
      };
    } catch (error) {
      logger.error('Health check failed', { error });
      this.metrics.healthChecksFailed++;
      return {
        healthy: false,
        details: {
          master: { healthy: 0, unhealthy: this.masterPool.length },
          replicas: []
        }
      };
    }
  }

  /**
   * Gracefully shutdown the connection pool
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down database connection pool');

    // Stop periodic tasks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Reject all waiting requests
    this.waitingQueue.forEach(item => {
      item.reject(new Error('Connection pool is shutting down'));
    });
    this.waitingQueue = [];

    // Close all connections
    const allConnections = [
      ...this.masterPool,
      ...this.readReplicaPools.flat()
    ];

    await Promise.all(
      allConnections.map(async (connection) => {
        try {
          await connection.client.$disconnect();
        } catch (error) {
          logger.error('Error disconnecting client', { 
            connectionId: connection.id, 
            error 
          });
        }
      })
    );

    this.masterPool = [];
    this.readReplicaPools = [];

    logger.info('Database connection pool shutdown complete');
  }

  private async createInitialConnections(): Promise<void> {
    const promises = Array(this.config.minConnections)
      .fill(null)
      .map(() => this.createConnection());
    
    await Promise.all(promises);
  }

  private async createConnection(replicaIndex?: number): Promise<PooledConnection> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const databaseUrl = replicaIndex !== undefined 
        ? this.config.readReplicaUrls[replicaIndex]
        : process.env.DATABASE_URL;

      const client = new PrismaClient({
        datasources: {
          db: { url: databaseUrl }
        },
        log: this.config.enableQueryLogging 
          ? ['query', 'info', 'warn', 'error']
          : ['error']
      });

      await client.$connect();

      const connection: PooledConnection = {
        client,
        id: connectionId,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isActive: false,
        queryCount: 0,
        totalQueryTime: 0,
        isHealthy: true
      };

      if (replicaIndex !== undefined) {
        if (!this.readReplicaPools[replicaIndex]) {
          this.readReplicaPools[replicaIndex] = [];
        }
        this.readReplicaPools[replicaIndex].push(connection);
      } else {
        this.masterPool.push(connection);
      }

      this.metrics.totalConnections++;
      
      logger.debug('Database connection created', { 
        connectionId, 
        isReplica: replicaIndex !== undefined,
        replicaIndex 
      });

      return connection;
    } catch (error) {
      logger.error('Failed to create database connection', { 
        connectionId, 
        error,
        isReplica: replicaIndex !== undefined
      });
      throw error;
    }
  }

  private async initializeReadReplicas(): Promise<void> {
    const promises = this.config.readReplicaUrls.map(async (url, index) => {
      const replicaPromises = Array(Math.ceil(this.config.minConnections / 2))
        .fill(null)
        .map(() => this.createConnection(index));
      
      return Promise.all(replicaPromises);
    });

    await Promise.all(promises);
  }

  private getAvailableConnection(readonly: boolean): PooledConnection | null {
    // For read-only queries, prefer read replicas if available and healthy
    if (readonly && this.config.enableReadReplicas && Math.random() < this.config.readReplicaWeight) {
      for (const pool of this.readReplicaPools) {
        const connection = pool.find(c => !c.isActive && c.isHealthy);
        if (connection) return connection;
      }
    }

    // Fall back to master pool
    return this.masterPool.find(c => !c.isActive && c.isHealthy) || null;
  }

  private markConnectionAsActive(connection: PooledConnection): void {
    connection.isActive = true;
    connection.lastUsedAt = new Date();
  }

  private canCreateNewConnection(): boolean {
    const totalConnections = this.masterPool.length + 
                            this.readReplicaPools.reduce((sum, pool) => sum + pool.length, 0);
    return totalConnections < this.config.maxConnections;
  }

  private findConnectionByClient(client: PrismaClient): PooledConnection | null {
    return [...this.masterPool, ...this.readReplicaPools.flat()]
      .find(c => c.client === client) || null;
  }

  private processWaitingQueue(): void {
    while (this.waitingQueue.length > 0) {
      const connection = this.getAvailableConnection(this.waitingQueue[0].isReadOnly);
      if (!connection) break;

      const queueItem = this.waitingQueue.shift()!;
      this.markConnectionAsActive(connection);
      queueItem.resolve(connection.client);
    }
  }

  private updateMetrics(): void {
    this.metrics.activeConnections = this.masterPool.filter(c => c.isActive).length +
                                   this.readReplicaPools.reduce((sum, pool) => 
                                     sum + pool.filter(c => c.isActive).length, 0);
    
    this.metrics.idleConnections = this.metrics.totalConnections - this.metrics.activeConnections;
    this.metrics.waitingRequests = this.waitingQueue.length;
  }

  private updateAverageQueryTime(queryTime: number): void {
    const totalTime = this.metrics.averageQueryTime * (this.metrics.totalQueriesExecuted - 1);
    this.metrics.averageQueryTime = (totalTime + queryTime) / this.metrics.totalQueriesExecuted;
  }

  private async checkConnectionHealth(connection: PooledConnection): Promise<boolean> {
    try {
      await Promise.race([
        connection.client.$queryRaw`SELECT 1`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.config.healthCheckTimeoutMs)
        )
      ]);
      
      connection.isHealthy = true;
      return true;
    } catch (error) {
      connection.isHealthy = false;
      logger.warn('Connection health check failed', { 
        connectionId: connection.id, 
        error 
      });
      return false;
    }
  }

  private startPeriodicTasks(): void {
    if (this.config.enableHealthCheck) {
      this.healthCheckInterval = setInterval(
        () => this.healthCheck(),
        this.config.healthCheckIntervalMs
      );
    }

    // Cleanup old/stale connections
    this.cleanupInterval = setInterval(
      () => this.cleanupConnections(),
      this.config.connectionValidationInterval
    );
  }

  private async cleanupConnections(): Promise<void> {
    const now = Date.now();
    const maxLifetime = this.config.maxLifetimeMs;
    const idleTimeout = this.config.idleTimeoutMs;

    const allPools = [this.masterPool, ...this.readReplicaPools];
    
    for (const pool of allPools) {
      const connectionsToRemove: PooledConnection[] = [];
      
      for (const connection of pool) {
        if (connection.isActive) continue;
        
        const age = now - connection.createdAt.getTime();
        const idleTime = now - connection.lastUsedAt.getTime();
        
        if (age > maxLifetime || idleTime > idleTimeout || !connection.isHealthy) {
          connectionsToRemove.push(connection);
        }
      }
      
      // Remove and disconnect old connections
      for (const connection of connectionsToRemove) {
        const index = pool.indexOf(connection);
        if (index > -1) {
          pool.splice(index, 1);
          this.metrics.totalConnections--;
          
          try {
            await connection.client.$disconnect();
          } catch (error) {
            logger.error('Error disconnecting old connection', { 
              connectionId: connection.id, 
              error 
            });
          }
        }
      }
    }

    // Ensure minimum connections are maintained
    const masterDeficit = this.config.minConnections - this.masterPool.length;
    if (masterDeficit > 0) {
      const promises = Array(masterDeficit).fill(null).map(() => this.createConnection());
      await Promise.all(promises);
    }
  }
}

// Export singleton pool instance with production configuration
export const dbPool = new DatabaseConnectionPool({
  minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '100'),
  acquireTimeoutMs: parseInt(process.env.DB_ACQUIRE_TIMEOUT_MS || '10000'),
  idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '300000'),
  enableReadReplicas: process.env.DB_ENABLE_READ_REPLICAS === 'true',
  readReplicaUrls: process.env.DB_READ_REPLICA_URLS?.split(',') || [],
  readReplicaWeight: parseFloat(process.env.DB_READ_REPLICA_WEIGHT || '0.7'),
  enableHealthCheck: process.env.DB_ENABLE_HEALTH_CHECK !== 'false',
  enableSlowQueryLogging: process.env.DB_ENABLE_SLOW_QUERY_LOGGING !== 'false',
  slowQueryThresholdMs: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD_MS || '1000')
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await dbPool.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await dbPool.shutdown();
  process.exit(0);
});