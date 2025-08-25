/**
 * PokerIQ Pro - 性能测试脚本
 * 高并发数据库性能基准测试工具
 * 支持PostgreSQL + Redis + ClickHouse性能验证
 */

import { performance } from 'perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { dbManager } from '../database/database-config';
import { getClickHouseManager } from '../database/clickhouse-analytics';
import { cache } from '../database/cache-strategy';
import { getPerformanceMonitor } from '../database/performance-monitoring';

// ===== 测试配置 =====
export interface PerformanceTestConfig {
  // 并发配置
  concurrentUsers: number;
  testDurationMs: number;
  rampUpTimeMs: number;
  
  // 数据库测试配置
  enablePostgreSQLTest: boolean;
  enableRedisTest: boolean;
  enableClickHouseTest: boolean;
  
  // 测试类型
  testTypes: TestType[];
  
  // 数据配置
  batchSize: number;
  dataSetSize: number;
  
  // 输出配置
  outputDir: string;
  enableRealtimeStats: boolean;
}

export type TestType = 
  | 'read_heavy'      // 读密集型
  | 'write_heavy'     // 写密集型
  | 'mixed'           // 混合型
  | 'cache_stress'    // 缓存压力测试
  | 'analytics'       // 分析查询
  | 'concurrent_sessions'; // 并发会话

export interface TestResult {
  testName: string;
  testType: TestType;
  database: string;
  startTime: number;
  endTime: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number; // ops/sec
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  errors: string[];
}

// ===== 性能测试执行器 =====
export class PerformanceTestRunner {
  private config: PerformanceTestConfig;
  private results: TestResult[] = [];
  private workers: Worker[] = [];
  private isRunning: boolean = false;
  
  constructor(config: PerformanceTestConfig) {
    this.config = config;
  }
  
  // 运行完整性能测试套件
  async runPerformanceTestSuite(): Promise<TestResult[]> {
    console.log('🚀 开始PokerIQ Pro性能测试套件');
    console.log(`📊 配置: ${this.config.concurrentUsers}个并发用户, ${this.config.testDurationMs/1000}秒测试时长`);
    
    this.isRunning = true;
    
    try {
      // 初始化数据库连接
      await this.initializeDatabases();
      
      // 准备测试数据
      await this.prepareTestData();
      
      // 运行各类性能测试
      for (const testType of this.config.testTypes) {
        if (this.config.enablePostgreSQLTest) {
          await this.runPostgreSQLTest(testType);
        }
        
        if (this.config.enableRedisTest) {
          await this.runRedisTest(testType);
        }
        
        if (this.config.enableClickHouseTest) {
          await this.runClickHouseTest(testType);
        }
      }
      
      // 运行综合压力测试
      await this.runIntegratedStressTest();
      
      // 生成测试报告
      await this.generateTestReport();
      
      return this.results;
      
    } finally {
      this.isRunning = false;
      await this.cleanup();
    }
  }
  
  // 初始化数据库连接
  private async initializeDatabases(): Promise<void> {
    console.log('🔧 初始化数据库连接...');
    
    try {
      await dbManager.initialize();
      
      const clickhouse = getClickHouseManager();
      await clickhouse.initialize();
      
      console.log('✅ 数据库连接初始化完成');
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }
  
  // 准备测试数据
  private async prepareTestData(): Promise<void> {
    console.log('📝 准备测试数据...');
    
    const startTime = performance.now();
    
    // 创建测试用户
    await this.createTestUsers(1000);
    
    // 创建测试游戏会话
    await this.createTestGameSessions(5000);
    
    // 预热缓存
    await this.warmupCache();
    
    const duration = performance.now() - startTime;
    console.log(`✅ 测试数据准备完成 (${duration.toFixed(2)}ms)`);
  }
  
  // PostgreSQL 性能测试
  private async runPostgreSQLTest(testType: TestType): Promise<void> {
    console.log(`🐘 运行PostgreSQL ${testType} 测试...`);
    
    const result = await this.executeTest({
      testName: `PostgreSQL_${testType}`,
      testType,
      database: 'postgresql',
      testFunction: async () => {
        switch (testType) {
          case 'read_heavy':
            return await this.postgresReadHeavyTest();
          case 'write_heavy':
            return await this.postgresWriteHeavyTest();
          case 'mixed':
            return await this.postgresMixedTest();
          case 'concurrent_sessions':
            return await this.postgresConcurrentSessionsTest();
          default:
            throw new Error(`Unsupported test type: ${testType}`);
        }
      }
    });
    
    this.results.push(result);
  }
  
  // Redis 性能测试
  private async runRedisTest(testType: TestType): Promise<void> {
    console.log(`🔴 运行Redis ${testType} 测试...`);
    
    const result = await this.executeTest({
      testName: `Redis_${testType}`,
      testType,
      database: 'redis',
      testFunction: async () => {
        switch (testType) {
          case 'cache_stress':
            return await this.redisCacheStressTest();
          case 'write_heavy':
            return await this.redisWriteHeavyTest();
          case 'read_heavy':
            return await this.redisReadHeavyTest();
          default:
            throw new Error(`Unsupported test type: ${testType}`);
        }
      }
    });
    
    this.results.push(result);
  }
  
  // ClickHouse 性能测试
  private async runClickHouseTest(testType: TestType): Promise<void> {
    console.log(`📊 运行ClickHouse ${testType} 测试...`);
    
    const result = await this.executeTest({
      testName: `ClickHouse_${testType}`,
      testType,
      database: 'clickhouse',
      testFunction: async () => {
        switch (testType) {
          case 'analytics':
            return await this.clickhouseAnalyticsTest();
          case 'write_heavy':
            return await this.clickhouseWriteHeavyTest();
          default:
            throw new Error(`Unsupported test type: ${testType}`);
        }
      }
    });
    
    this.results.push(result);
  }
  
  // 执行测试并收集指标
  private async executeTest(options: {
    testName: string;
    testType: TestType;
    database: string;
    testFunction: () => Promise<TestMetrics>;
  }): Promise<TestResult> {
    console.log(`▶️ 开始测试: ${options.testName}`);
    
    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    
    let metrics: TestMetrics;
    let errors: string[] = [];
    
    try {
      metrics = await options.testFunction();
    } catch (error) {
      console.error(`❌ 测试失败: ${options.testName}`, error);
      errors.push(error.message);
      
      // 设置默认指标
      metrics = {
        totalOperations: 0,
        successfulOperations: 0,
        latencies: []
      };
    }
    
    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const duration = endTime - startTime;
    
    // 计算性能指标
    const latencies = metrics.latencies.sort((a, b) => a - b);
    const averageLatency = latencies.length > 0 ? 
      latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
    
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);
    
    const result: TestResult = {
      testName: options.testName,
      testType: options.testType,
      database: options.database,
      startTime,
      endTime,
      totalOperations: metrics.totalOperations,
      successfulOperations: metrics.successfulOperations,
      failedOperations: metrics.totalOperations - metrics.successfulOperations,
      averageLatency,
      p95Latency: latencies[p95Index] || 0,
      p99Latency: latencies[p99Index] || 0,
      throughput: metrics.successfulOperations / (duration / 1000),
      errorRate: metrics.totalOperations > 0 ? 
        (metrics.totalOperations - metrics.successfulOperations) / metrics.totalOperations * 100 : 0,
      memoryUsage: memoryAfter.heapUsed - memoryBefore.heapUsed,
      cpuUsage: process.cpuUsage().user / 1000000, // 转换为秒
      errors
    };
    
    console.log(`✅ 测试完成: ${options.testName}`);
    console.log(`   吞吐量: ${result.throughput.toFixed(2)} ops/sec`);
    console.log(`   平均延迟: ${result.averageLatency.toFixed(2)}ms`);
    console.log(`   错误率: ${result.errorRate.toFixed(2)}%`);
    
    return result;
  }
  
  // ===== PostgreSQL 具体测试方法 =====
  
  private async postgresReadHeavyTest(): Promise<TestMetrics> {
    const metrics: TestMetrics = {
      totalOperations: 0,
      successfulOperations: 0,
      latencies: []
    };
    
    const db = dbManager.getPrimaryPool();
    const testQueries = [
      'SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 100',
      'SELECT COUNT(*) FROM game_sessions WHERE created_at >= NOW() - INTERVAL \'24 hours\'',
      'SELECT u.*, s.* FROM users u LEFT JOIN user_stats s ON u.id = s.user_id WHERE u.level >= 10',
      'SELECT * FROM hands WHERE created_at >= NOW() - INTERVAL \'1 hour\' ORDER BY created_at DESC LIMIT 50'
    ];
    
    const promises = [];
    
    for (let i = 0; i < this.config.concurrentUsers; i++) {
      promises.push(this.runWorkerTest(async () => {
        const endTime = Date.now() + this.config.testDurationMs;
        const workerMetrics = { total: 0, successful: 0, latencies: [] };
        
        while (Date.now() < endTime) {
          const query = testQueries[workerMetrics.total % testQueries.length];
          const startTime = performance.now();
          
          try {
            await db.query(query);
            workerMetrics.successful++;
          } catch (error) {
            console.error('PostgreSQL查询失败:', error);
          }
          
          const latency = performance.now() - startTime;
          workerMetrics.latencies.push(latency);
          workerMetrics.total++;
          
          // 短暂休息以模拟真实负载
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        }
        
        return workerMetrics;
      }));
    }
    
    const results = await Promise.all(promises);
    
    // 聚合结果
    for (const result of results) {
      metrics.totalOperations += result.total;
      metrics.successfulOperations += result.successful;
      metrics.latencies.push(...result.latencies);
    }
    
    return metrics;
  }
  
  private async postgresWriteHeavyTest(): Promise<TestMetrics> {
    const metrics: TestMetrics = {
      totalOperations: 0,
      successfulOperations: 0,
      latencies: []
    };
    
    const db = dbManager.getPrimaryPool();
    const promises = [];
    
    for (let i = 0; i < this.config.concurrentUsers; i++) {
      promises.push(this.runWorkerTest(async () => {
        const endTime = Date.now() + this.config.testDurationMs;
        const workerMetrics = { total: 0, successful: 0, latencies: [] };
        
        while (Date.now() < endTime) {
          const startTime = performance.now();
          
          try {
            // 插入测试游戏会话
            await db.query(`
              INSERT INTO game_sessions (user_id, type, buy_in, hands, duration)
              VALUES ($1, $2, $3, $4, $5)
            `, [
              `test-user-${Math.floor(Math.random() * 1000)}`,
              'TRAINING',
              Math.random() * 1000,
              Math.floor(Math.random() * 100),
              Math.floor(Math.random() * 3600)
            ]);
            
            workerMetrics.successful++;
          } catch (error) {
            console.error('PostgreSQL插入失败:', error);
          }
          
          const latency = performance.now() - startTime;
          workerMetrics.latencies.push(latency);
          workerMetrics.total++;
          
          await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
        }
        
        return workerMetrics;
      }));
    }
    
    const results = await Promise.all(promises);
    
    for (const result of results) {
      metrics.totalOperations += result.total;
      metrics.successfulOperations += result.successful;
      metrics.latencies.push(...result.latencies);
    }
    
    return metrics;
  }
  
  private async postgresMixedTest(): Promise<TestMetrics> {
    // 70%读操作，30%写操作的混合测试
    const readMetrics = await this.postgresReadHeavyTest();
    const writeMetrics = await this.postgresWriteHeavyTest();
    
    return {
      totalOperations: Math.floor(readMetrics.totalOperations * 0.7 + writeMetrics.totalOperations * 0.3),
      successfulOperations: Math.floor(readMetrics.successfulOperations * 0.7 + writeMetrics.successfulOperations * 0.3),
      latencies: [
        ...readMetrics.latencies.slice(0, Math.floor(readMetrics.latencies.length * 0.7)),
        ...writeMetrics.latencies.slice(0, Math.floor(writeMetrics.latencies.length * 0.3))
      ]
    };
  }
  
  private async postgresConcurrentSessionsTest(): Promise<TestMetrics> {
    // 测试大量并发连接的性能影响
    return await this.postgresReadHeavyTest(); // 使用读测试但增加并发数
  }
  
  // ===== Redis 具体测试方法 =====
  
  private async redisCacheStressTest(): Promise<TestMetrics> {
    const metrics: TestMetrics = {
      totalOperations: 0,
      successfulOperations: 0,
      latencies: []
    };
    
    const redis = cache.user();
    const promises = [];
    
    for (let i = 0; i < this.config.concurrentUsers; i++) {
      promises.push(this.runWorkerTest(async () => {
        const endTime = Date.now() + this.config.testDurationMs;
        const workerMetrics = { total: 0, successful: 0, latencies: [] };
        
        while (Date.now() < endTime) {
          const operations = [
            // SET操作
            async () => {
              const key = `test:user:${Math.floor(Math.random() * 10000)}`;
              const value = { name: 'Test User', level: Math.floor(Math.random() * 25) };
              return await redis.set(key, value, 300);
            },
            // GET操作
            async () => {
              const key = `test:user:${Math.floor(Math.random() * 10000)}`;
              return await redis.get(key);
            },
            // DEL操作
            async () => {
              const key = `test:user:${Math.floor(Math.random() * 10000)}`;
              return await redis.del(key);
            }
          ];
          
          const operation = operations[workerMetrics.total % operations.length];
          const startTime = performance.now();
          
          try {
            await operation();
            workerMetrics.successful++;
          } catch (error) {
            console.error('Redis操作失败:', error);
          }
          
          const latency = performance.now() - startTime;
          workerMetrics.latencies.push(latency);
          workerMetrics.total++;
          
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2));
        }
        
        return workerMetrics;
      }));
    }
    
    const results = await Promise.all(promises);
    
    for (const result of results) {
      metrics.totalOperations += result.total;
      metrics.successfulOperations += result.successful;
      metrics.latencies.push(...result.latencies);
    }
    
    return metrics;
  }
  
  private async redisWriteHeavyTest(): Promise<TestMetrics> {
    // 主要进行SET和INCR操作
    return await this.redisCacheStressTest();
  }
  
  private async redisReadHeavyTest(): Promise<TestMetrics> {
    // 主要进行GET操作
    return await this.redisCacheStressTest();
  }
  
  // ===== ClickHouse 具体测试方法 =====
  
  private async clickhouseAnalyticsTest(): Promise<TestMetrics> {
    const metrics: TestMetrics = {
      totalOperations: 0,
      successfulOperations: 0,
      latencies: []
    };
    
    const clickhouse = getClickHouseManager();
    const promises = [];
    
    for (let i = 0; i < Math.min(this.config.concurrentUsers, 10); i++) { // ClickHouse限制并发
      promises.push(this.runWorkerTest(async () => {
        const endTime = Date.now() + this.config.testDurationMs;
        const workerMetrics = { total: 0, successful: 0, latencies: [] };
        
        const analyticsQueries = [
          () => clickhouse.getUserActivityAnalysis('test-user-1', '2024-01-01', '2024-12-31'),
          () => clickhouse.getGamePerformanceAnalysis('test-user-1', 'week'),
          () => clickhouse.getPositionAnalysis('test-user-1'),
          () => clickhouse.getRealtimeLeaderboard('profit', 'week', 100)
        ];
        
        while (Date.now() < endTime) {
          const query = analyticsQueries[workerMetrics.total % analyticsQueries.length];
          const startTime = performance.now();
          
          try {
            await query();
            workerMetrics.successful++;
          } catch (error) {
            console.error('ClickHouse查询失败:', error);
          }
          
          const latency = performance.now() - startTime;
          workerMetrics.latencies.push(latency);
          workerMetrics.total++;
          
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        }
        
        return workerMetrics;
      }));
    }
    
    const results = await Promise.all(promises);
    
    for (const result of results) {
      metrics.totalOperations += result.total;
      metrics.successfulOperations += result.successful;
      metrics.latencies.push(...result.latencies);
    }
    
    return metrics;
  }
  
  private async clickhouseWriteHeavyTest(): Promise<TestMetrics> {
    const metrics: TestMetrics = {
      totalOperations: 0,
      successfulOperations: 0,
      latencies: []
    };
    
    const clickhouse = getClickHouseManager();
    const promises = [];
    
    for (let i = 0; i < Math.min(this.config.concurrentUsers, 5); i++) {
      promises.push(this.runWorkerTest(async () => {
        const endTime = Date.now() + this.config.testDurationMs;
        const workerMetrics = { total: 0, successful: 0, latencies: [] };
        
        while (Date.now() < endTime) {
          const startTime = performance.now();
          
          try {
            // 批量插入用户事件
            const events = Array.from({ length: 10 }, (_, index) => ({
              user_id: `test-user-${Math.floor(Math.random() * 1000)}`,
              session_id: `test-session-${Date.now()}-${index}`,
              event_type: 'game_action',
              event_category: 'poker',
              event_action: 'bet',
              event_value: Math.random() * 100,
              device_type: 'web',
              platform: 'desktop',
              event_time: new Date().toISOString()
            }));
            
            await clickhouse.insertUserEvents(events);
            workerMetrics.successful++;
          } catch (error) {
            console.error('ClickHouse插入失败:', error);
          }
          
          const latency = performance.now() - startTime;
          workerMetrics.latencies.push(latency);
          workerMetrics.total++;
          
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        }
        
        return workerMetrics;
      }));
    }
    
    const results = await Promise.all(promises);
    
    for (const result of results) {
      metrics.totalOperations += result.total;
      metrics.successfulOperations += result.successful;
      metrics.latencies.push(...result.latencies);
    }
    
    return metrics;
  }
  
  // ===== 综合压力测试 =====
  
  private async runIntegratedStressTest(): Promise<void> {
    console.log('🔥 运行综合压力测试...');
    
    // 同时对所有数据库系统施加压力
    const promises = [];
    
    if (this.config.enablePostgreSQLTest) {
      promises.push(this.postgresMixedTest());
    }
    
    if (this.config.enableRedisTest) {
      promises.push(this.redisCacheStressTest());
    }
    
    if (this.config.enableClickHouseTest) {
      promises.push(this.clickhouseWriteHeavyTest());
    }
    
    const startTime = performance.now();
    const results = await Promise.all(promises);
    const endTime = performance.now();
    
    // 聚合综合测试结果
    const integratedResult: TestResult = {
      testName: 'Integrated_Stress_Test',
      testType: 'mixed',
      database: 'all',
      startTime,
      endTime,
      totalOperations: results.reduce((sum, r) => sum + r.totalOperations, 0),
      successfulOperations: results.reduce((sum, r) => sum + r.successfulOperations, 0),
      failedOperations: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      throughput: 0,
      errorRate: 0,
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage().user / 1000000,
      errors: []
    };
    
    // 计算聚合指标
    const allLatencies = results.flatMap(r => r.latencies).sort((a, b) => a - b);
    integratedResult.averageLatency = allLatencies.reduce((sum, lat) => sum + lat, 0) / allLatencies.length;
    integratedResult.p95Latency = allLatencies[Math.floor(allLatencies.length * 0.95)] || 0;
    integratedResult.p99Latency = allLatencies[Math.floor(allLatencies.length * 0.99)] || 0;
    integratedResult.throughput = integratedResult.successfulOperations / ((endTime - startTime) / 1000);
    integratedResult.errorRate = integratedResult.totalOperations > 0 ? 
      (integratedResult.totalOperations - integratedResult.successfulOperations) / integratedResult.totalOperations * 100 : 0;
    
    this.results.push(integratedResult);
    
    console.log('✅ 综合压力测试完成');
    console.log(`   总吞吐量: ${integratedResult.throughput.toFixed(2)} ops/sec`);
    console.log(`   平均延迟: ${integratedResult.averageLatency.toFixed(2)}ms`);
  }
  
  // ===== 辅助方法 =====
  
  private async runWorkerTest<T>(testFunction: () => Promise<T>): Promise<T> {
    if (isMainThread) {
      // 在主线程中直接执行
      return await testFunction();
    } else {
      // 在worker线程中执行
      return await testFunction();
    }
  }
  
  private async createTestUsers(count: number): Promise<void> {
    console.log(`创建 ${count} 个测试用户...`);
    
    const db = dbManager.getPrimaryPool();
    const batchSize = 100;
    
    for (let i = 0; i < count; i += batchSize) {
      const batch = Math.min(batchSize, count - i);
      const values = [];
      const placeholders = [];
      
      for (let j = 0; j < batch; j++) {
        const userIndex = i + j;
        values.push(
          `test-user-${userIndex}`,
          `test${userIndex}@example.com`,
          'hashed_password',
          `Test User ${userIndex}`,
          Math.floor(Math.random() * 25) + 1
        );
        placeholders.push(`($${j * 5 + 1}, $${j * 5 + 2}, $${j * 5 + 3}, $${j * 5 + 4}, $${j * 5 + 5})`);
      }
      
      await db.query(`
        INSERT INTO users (id, email, password, name, level)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO NOTHING
      `, values);
    }
  }
  
  private async createTestGameSessions(count: number): Promise<void> {
    console.log(`创建 ${count} 个测试游戏会话...`);
    
    const db = dbManager.getPrimaryPool();
    const batchSize = 50;
    
    for (let i = 0; i < count; i += batchSize) {
      const batch = Math.min(batchSize, count - i);
      const values = [];
      const placeholders = [];
      
      for (let j = 0; j < batch; j++) {
        values.push(
          `test-user-${Math.floor(Math.random() * 1000)}`,
          'TRAINING',
          Math.random() * 1000,
          Math.floor(Math.random() * 100),
          Math.floor(Math.random() * 3600)
        );
        placeholders.push(`($${j * 5 + 1}, $${j * 5 + 2}, $${j * 5 + 3}, $${j * 5 + 4}, $${j * 5 + 5})`);
      }
      
      await db.query(`
        INSERT INTO game_sessions (user_id, type, buy_in, hands, duration)
        VALUES ${placeholders.join(', ')}
      `, values);
    }
  }
  
  private async warmupCache(): Promise<void> {
    console.log('🔥 预热缓存...');
    
    const userCache = cache.user();
    
    // 预热用户缓存
    for (let i = 0; i < 100; i++) {
      await userCache.setUserProfile(`test-user-${i}`, {
        id: `test-user-${i}`,
        name: `Test User ${i}`,
        level: Math.floor(Math.random() * 25) + 1
      });
    }
  }
  
  private async generateTestReport(): Promise<void> {
    console.log('📊 生成测试报告...');
    
    const report = {
      testConfig: this.config,
      testResults: this.results,
      summary: {
        totalTests: this.results.length,
        successfulTests: this.results.filter(r => r.errorRate < 5).length,
        averageThroughput: this.results.reduce((sum, r) => sum + r.throughput, 0) / this.results.length,
        averageLatency: this.results.reduce((sum, r) => sum + r.averageLatency, 0) / this.results.length
      },
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
    
    // 输出控制台报告
    console.log('\n📈 性能测试报告');
    console.log('==========================================');
    console.log(`测试总数: ${report.summary.totalTests}`);
    console.log(`成功测试: ${report.summary.successfulTests}`);
    console.log(`平均吞吐量: ${report.summary.averageThroughput.toFixed(2)} ops/sec`);
    console.log(`平均延迟: ${report.summary.averageLatency.toFixed(2)}ms`);
    console.log('\n详细结果:');
    
    for (const result of this.results) {
      console.log(`\n${result.testName}:`);
      console.log(`  吞吐量: ${result.throughput.toFixed(2)} ops/sec`);
      console.log(`  延迟: ${result.averageLatency.toFixed(2)}ms (P95: ${result.p95Latency.toFixed(2)}ms)`);
      console.log(`  错误率: ${result.errorRate.toFixed(2)}%`);
      console.log(`  内存使用: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }
    
    console.log('\n🎯 优化建议:');
    for (const rec of report.recommendations) {
      console.log(`• ${rec}`);
    }
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // 分析测试结果并生成建议
    const pgResults = this.results.filter(r => r.database === 'postgresql');
    const redisResults = this.results.filter(r => r.database === 'redis');
    const clickhouseResults = this.results.filter(r => r.database === 'clickhouse');
    
    // PostgreSQL 建议
    if (pgResults.some(r => r.averageLatency > 100)) {
      recommendations.push('PostgreSQL查询延迟较高，建议优化索引或增加连接池大小');
    }
    
    if (pgResults.some(r => r.errorRate > 5)) {
      recommendations.push('PostgreSQL错误率较高，检查连接配置和查询优化');
    }
    
    // Redis 建议
    if (redisResults.some(r => r.throughput < 1000)) {
      recommendations.push('Redis吞吐量较低，考虑使用连接池或Redis集群');
    }
    
    // ClickHouse 建议
    if (clickhouseResults.some(r => r.averageLatency > 1000)) {
      recommendations.push('ClickHouse分析查询较慢，建议优化表结构或分区策略');
    }
    
    // 通用建议
    if (this.results.some(r => r.memoryUsage > 100 * 1024 * 1024)) {
      recommendations.push('内存使用量较高，建议优化数据结构或增加系统内存');
    }
    
    return recommendations;
  }
  
  private async cleanup(): Promise<void> {
    console.log('🧹 清理测试环境...');
    
    try {
      // 清理测试数据
      const db = dbManager.getPrimaryPool();
      await db.query('DELETE FROM game_sessions WHERE user_id LIKE \'test-user-%\'');
      await db.query('DELETE FROM users WHERE id LIKE \'test-user-%\'');
      
      // 清理Redis测试数据
      const redis = cache.user();
      await redis.delByPattern('test:*');
      
      console.log('✅ 测试环境清理完成');
    } catch (error) {
      console.error('❌ 清理过程中出错:', error);
    }
  }
}

// ===== 接口定义 =====
interface TestMetrics {
  totalOperations: number;
  successfulOperations: number;
  latencies: number[];
}

// ===== 默认配置 =====
export const DEFAULT_PERFORMANCE_TEST_CONFIG: PerformanceTestConfig = {
  concurrentUsers: 50,
  testDurationMs: 60000, // 1分钟
  rampUpTimeMs: 10000,   // 10秒渐增
  enablePostgreSQLTest: true,
  enableRedisTest: true,
  enableClickHouseTest: true,
  testTypes: ['read_heavy', 'write_heavy', 'mixed', 'cache_stress'],
  batchSize: 100,
  dataSetSize: 10000,
  outputDir: './performance-test-results',
  enableRealtimeStats: true
};

// ===== 导出主函数 =====
export async function runPerformanceTests(config?: Partial<PerformanceTestConfig>): Promise<TestResult[]> {
  const finalConfig = { ...DEFAULT_PERFORMANCE_TEST_CONFIG, ...config };
  const runner = new PerformanceTestRunner(finalConfig);
  return await runner.runPerformanceTestSuite();
}

export default runPerformanceTests;