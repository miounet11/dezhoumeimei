/**
 * PokerIQ Pro - 性能监控和指标收集系统
 * 实时监控数据库性能、应用性能、用户体验指标
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import { getDB } from './database-config';
import { getClickHouseManager } from './clickhouse-analytics';

// ===== 性能指标收集器 =====
export class PerformanceMetricsCollector {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private timers: Map<string, number> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  
  // 开始计时
  startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }
  
  // 结束计时并记录指标
  endTimer(label: string, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer ${label} not found`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    this.recordMetric(label, duration, 'duration', metadata);
    return duration;
  }
  
  // 记录指标
  recordMetric(
    name: string,
    value: number,
    type: MetricType = 'gauge',
    metadata?: Record<string, any>
  ): void {
    const timestamp = Date.now();
    const metric: PerformanceMetric = {
      name,
      value,
      type,
      timestamp,
      metadata: metadata || {}
    };
    
    this.metrics.set(`${name}_${timestamp}`, metric);
    this.eventEmitter.emit('metric', metric);
    
    // 清理旧指标（保留最近1小时）
    this.cleanupOldMetrics();
  }
  
  // 增量指标
  incrementCounter(name: string, value: number = 1, metadata?: Record<string, any>): void {
    this.recordMetric(name, value, 'counter', metadata);
  }
  
  // 设置仪表盘指标
  setGauge(name: string, value: number, metadata?: Record<string, any>): void {
    this.recordMetric(name, value, 'gauge', metadata);
  }
  
  // 记录直方图
  recordHistogram(name: string, value: number, metadata?: Record<string, any>): void {
    this.recordMetric(name, value, 'histogram', metadata);
  }
  
  // 获取指标
  getMetrics(nameFilter?: string): PerformanceMetric[] {
    const allMetrics = Array.from(this.metrics.values());
    
    if (nameFilter) {
      return allMetrics.filter(metric => metric.name.includes(nameFilter));
    }
    
    return allMetrics;
  }
  
  // 获取聚合指标
  getAggregatedMetrics(name: string, timeRangeMs: number = 300000): AggregatedMetric {
    const now = Date.now();
    const filteredMetrics = this.getMetrics(name).filter(
      metric => now - metric.timestamp <= timeRangeMs
    );
    
    if (filteredMetrics.length === 0) {
      return {
        name,
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        sum: 0,
        p50: 0,
        p95: 0,
        p99: 0
      };
    }
    
    const values = filteredMetrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return {
      name,
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length,
      sum,
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99)
    };
  }
  
  // 清理旧指标
  private cleanupOldMetrics(): void {
    const oneHourAgo = Date.now() - 3600000; // 1小时
    
    for (const [key, metric] of this.metrics.entries()) {
      if (metric.timestamp < oneHourAgo) {
        this.metrics.delete(key);
      }
    }
  }
  
  // 计算百分位数
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    
    const index = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, Math.min(index, values.length - 1))];
  }
  
  // 监听指标事件
  onMetric(callback: (metric: PerformanceMetric) => void): void {
    this.eventEmitter.on('metric', callback);
  }
}

// ===== 数据库性能监控器 =====
export class DatabasePerformanceMonitor {
  private metricsCollector: PerformanceMetricsCollector;
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  
  constructor(metricsCollector: PerformanceMetricsCollector) {
    this.metricsCollector = metricsCollector;
  }
  
  // 开始监控
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔄 开始数据库性能监控...');
    
    // 立即执行一次
    this.collectDatabaseMetrics();
    
    // 定期收集指标
    this.monitoringInterval = setInterval(() => {
      this.collectDatabaseMetrics();
    }, intervalMs);
  }
  
  // 停止监控
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    console.log('⏹️ 数据库性能监控已停止');
  }
  
  // 收集数据库指标
  private async collectDatabaseMetrics(): Promise<void> {
    try {
      await Promise.all([
        this.collectPostgreSQLMetrics(),
        this.collectRedisMetrics(),
        this.collectClickHouseMetrics()
      ]);
    } catch (error) {
      console.error('数据库指标收集失败:', error);
    }
  }
  
  // 收集 PostgreSQL 指标
  private async collectPostgreSQLMetrics(): Promise<void> {
    try {
      const primaryDB = getDB.primary();
      
      // 连接池指标
      this.metricsCollector.setGauge(
        'postgresql.connections.total',
        primaryDB.totalCount
      );
      this.metricsCollector.setGauge(
        'postgresql.connections.idle',
        primaryDB.idleCount
      );
      this.metricsCollector.setGauge(
        'postgresql.connections.waiting',
        primaryDB.waitingCount
      );
      
      // 执行数据库查询获取更多指标
      const startTime = performance.now();
      
      const result = await primaryDB.query(`
        SELECT 
          -- 连接统计
          (SELECT count(*) FROM pg_stat_activity) as total_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
          
          -- 数据库大小
          (SELECT pg_database_size(current_database())) as database_size,
          
          -- 缓存命中率
          (SELECT 
            round(100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2) 
            FROM pg_stat_database 
            WHERE datname = current_database()
          ) as cache_hit_ratio,
          
          -- 事务统计
          (SELECT xact_commit FROM pg_stat_database WHERE datname = current_database()) as transactions_committed,
          (SELECT xact_rollback FROM pg_stat_database WHERE datname = current_database()) as transactions_rollback,
          
          -- 锁等待
          (SELECT count(*) FROM pg_locks WHERE NOT granted) as locks_waiting
      `);
      
      const queryTime = performance.now() - startTime;
      this.metricsCollector.recordMetric('postgresql.query.health_check', queryTime, 'duration');
      
      const stats = result.rows[0];
      
      // 记录收集到的指标
      this.metricsCollector.setGauge('postgresql.connections.active', parseInt(stats.active_connections));
      this.metricsCollector.setGauge('postgresql.connections.idle_in_transaction', parseInt(stats.idle_connections));
      this.metricsCollector.setGauge('postgresql.database.size_bytes', parseInt(stats.database_size));
      this.metricsCollector.setGauge('postgresql.cache.hit_ratio', parseFloat(stats.cache_hit_ratio));
      this.metricsCollector.setGauge('postgresql.transactions.committed', parseInt(stats.transactions_committed));
      this.metricsCollector.setGauge('postgresql.transactions.rollback', parseInt(stats.transactions_rollback));
      this.metricsCollector.setGauge('postgresql.locks.waiting', parseInt(stats.locks_waiting));
      
    } catch (error) {
      console.error('PostgreSQL 指标收集失败:', error);
      this.metricsCollector.incrementCounter('postgresql.errors', 1);
    }
  }
  
  // 收集 Redis 指标
  private async collectRedisMetrics(): Promise<void> {
    try {
      const redis = getDB.redis.primary();
      
      const startTime = performance.now();
      const info = await redis.info();
      const pingTime = performance.now() - startTime;
      
      this.metricsCollector.recordMetric('redis.ping', pingTime, 'duration');
      
      // 解析 Redis INFO 输出
      const lines = info.split('\r\n');
      const stats: Record<string, string> = {};
      
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':', 2);
          stats[key] = value;
        }
      }
      
      // 内存指标
      if (stats.used_memory) {
        this.metricsCollector.setGauge('redis.memory.used_bytes', parseInt(stats.used_memory));
      }
      if (stats.used_memory_peak) {
        this.metricsCollector.setGauge('redis.memory.peak_bytes', parseInt(stats.used_memory_peak));
      }
      if (stats.used_memory_rss) {
        this.metricsCollector.setGauge('redis.memory.rss_bytes', parseInt(stats.used_memory_rss));
      }
      
      // 连接指标
      if (stats.connected_clients) {
        this.metricsCollector.setGauge('redis.connections.clients', parseInt(stats.connected_clients));
      }
      if (stats.blocked_clients) {
        this.metricsCollector.setGauge('redis.connections.blocked', parseInt(stats.blocked_clients));
      }
      
      // 命令统计
      if (stats.total_commands_processed) {
        this.metricsCollector.setGauge('redis.commands.total', parseInt(stats.total_commands_processed));
      }
      if (stats.instantaneous_ops_per_sec) {
        this.metricsCollector.setGauge('redis.commands.per_second', parseInt(stats.instantaneous_ops_per_sec));
      }
      
      // 键空间统计
      if (stats.db0) {
        const dbStats = stats.db0.match(/keys=(\d+),expires=(\d+)/);
        if (dbStats) {
          this.metricsCollector.setGauge('redis.keys.total', parseInt(dbStats[1]));
          this.metricsCollector.setGauge('redis.keys.expires', parseInt(dbStats[2]));
        }
      }
      
      // 缓存命中率（需要额外计算）
      const keyspaceHits = parseInt(stats.keyspace_hits || '0');
      const keyspaceMisses = parseInt(stats.keyspace_misses || '0');
      const totalRequests = keyspaceHits + keyspaceMisses;
      
      if (totalRequests > 0) {
        const hitRatio = (keyspaceHits / totalRequests) * 100;
        this.metricsCollector.setGauge('redis.cache.hit_ratio', hitRatio);
      }
      
    } catch (error) {
      console.error('Redis 指标收集失败:', error);
      this.metricsCollector.incrementCounter('redis.errors', 1);
    }
  }
  
  // 收集 ClickHouse 指标
  private async collectClickHouseMetrics(): Promise<void> {
    try {
      const clickhouse = getClickHouseManager();
      
      const startTime = performance.now();
      const isHealthy = await clickhouse.healthCheck();
      const healthCheckTime = performance.now() - startTime;
      
      this.metricsCollector.recordMetric('clickhouse.health_check', healthCheckTime, 'duration');
      this.metricsCollector.setGauge('clickhouse.healthy', isHealthy ? 1 : 0);
      
      if (isHealthy) {
        // 获取系统指标
        const systemMetrics = await clickhouse.getSystemMetrics();
        
        this.metricsCollector.setGauge('clickhouse.users.daily_active', systemMetrics.daily_active_users);
        this.metricsCollector.setGauge('clickhouse.users.new_today', systemMetrics.new_users_today);
        this.metricsCollector.setGauge('clickhouse.sessions.game_today', systemMetrics.game_sessions_today);
        this.metricsCollector.setGauge('clickhouse.sessions.training_today', systemMetrics.training_sessions_today);
        this.metricsCollector.setGauge('clickhouse.sessions.avg_duration', systemMetrics.avg_session_duration);
      }
      
    } catch (error) {
      console.error('ClickHouse 指标收集失败:', error);
      this.metricsCollector.incrementCounter('clickhouse.errors', 1);
    }
  }
}

// ===== 应用性能监控器 =====
export class ApplicationPerformanceMonitor {
  private metricsCollector: PerformanceMetricsCollector;
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  
  constructor(metricsCollector: PerformanceMetricsCollector) {
    this.metricsCollector = metricsCollector;
  }
  
  // 开始监控
  startMonitoring(intervalMs: number = 10000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔄 开始应用性能监控...');
    
    // 立即执行一次
    this.collectApplicationMetrics();
    
    // 定期收集指标
    this.monitoringInterval = setInterval(() => {
      this.collectApplicationMetrics();
    }, intervalMs);
  }
  
  // 停止监控
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    console.log('⏹️ 应用性能监控已停止');
  }
  
  // 收集应用指标
  private collectApplicationMetrics(): void {
    try {
      // Node.js 进程指标
      const memUsage = process.memoryUsage();
      this.metricsCollector.setGauge('nodejs.memory.rss', memUsage.rss);
      this.metricsCollector.setGauge('nodejs.memory.heap_used', memUsage.heapUsed);
      this.metricsCollector.setGauge('nodejs.memory.heap_total', memUsage.heapTotal);
      this.metricsCollector.setGauge('nodejs.memory.external', memUsage.external);
      
      // CPU 使用率
      const cpuUsage = process.cpuUsage();
      this.metricsCollector.setGauge('nodejs.cpu.user', cpuUsage.user);
      this.metricsCollector.setGauge('nodejs.cpu.system', cpuUsage.system);
      
      // 运行时间
      this.metricsCollector.setGauge('nodejs.uptime', process.uptime());
      
      // 事件循环延迟
      const start = performance.now();
      setImmediate(() => {
        const lag = performance.now() - start;
        this.metricsCollector.recordMetric('nodejs.event_loop.lag', lag, 'gauge');
      });
      
      // 垃圾回收指标（如果可用）
      if (global.gc) {
        const gcBefore = process.memoryUsage();
        global.gc();
        const gcAfter = process.memoryUsage();
        const freedMemory = gcBefore.heapUsed - gcAfter.heapUsed;
        this.metricsCollector.recordMetric('nodejs.gc.freed_memory', freedMemory, 'gauge');
      }
      
    } catch (error) {
      console.error('应用指标收集失败:', error);
      this.metricsCollector.incrementCounter('application.errors', 1);
    }
  }
}

// ===== HTTP 请求监控中间件 =====
export class HTTPMetricsMiddleware {
  private metricsCollector: PerformanceMetricsCollector;
  
  constructor(metricsCollector: PerformanceMetricsCollector) {
    this.metricsCollector = metricsCollector;
  }
  
  // Express 中间件
  middleware() {
    return (req: any, res: any, next: any) => {
      const startTime = performance.now();
      const startTimestamp = Date.now();
      
      // 监听响应完成事件
      res.on('finish', () => {
        const duration = performance.now() - startTime;
        const route = req.route?.path || req.path || 'unknown';
        const method = req.method;
        const statusCode = res.statusCode;
        
        // 记录请求指标
        this.metricsCollector.recordMetric(
          'http.request.duration',
          duration,
          'histogram',
          {
            method,
            route,
            status_code: statusCode.toString(),
            status_class: `${Math.floor(statusCode / 100)}xx`
          }
        );
        
        // 记录请求计数
        this.metricsCollector.incrementCounter(
          'http.requests.total',
          1,
          {
            method,
            route,
            status_code: statusCode.toString()
          }
        );
        
        // 记录响应大小（如果可用）
        const responseSize = res.get('content-length');
        if (responseSize) {
          this.metricsCollector.recordMetric(
            'http.response.size',
            parseInt(responseSize),
            'histogram',
            { method, route }
          );
        }
        
        // 记录错误率
        if (statusCode >= 400) {
          this.metricsCollector.incrementCounter(
            'http.requests.errors',
            1,
            {
              method,
              route,
              status_code: statusCode.toString()
            }
          );
        }
      });
      
      next();
    };
  }
}

// ===== 性能指标导出器 =====
export class MetricsExporter {
  private metricsCollector: PerformanceMetricsCollector;
  private exportInterval?: NodeJS.Timeout;
  
  constructor(metricsCollector: PerformanceMetricsCollector) {
    this.metricsCollector = metricsCollector;
  }
  
  // 开始导出指标到 ClickHouse
  startExporting(intervalMs: number = 60000): void {
    console.log('🔄 开始导出性能指标到 ClickHouse...');
    
    this.exportInterval = setInterval(async () => {
      await this.exportMetrics();
    }, intervalMs);
  }
  
  // 停止导出
  stopExporting(): void {
    if (this.exportInterval) {
      clearInterval(this.exportInterval);
      this.exportInterval = undefined;
    }
    
    console.log('⏹️ 性能指标导出已停止');
  }
  
  // 导出指标
  private async exportMetrics(): Promise<void> {
    try {
      const metrics = this.metricsCollector.getMetrics();
      
      if (metrics.length === 0) return;
      
      const clickhouse = getClickHouseManager();
      
      // 转换指标格式并批量插入
      const events = metrics.map(metric => ({
        user_id: 'system',
        session_id: 'monitoring',
        event_type: 'performance_metric',
        event_category: metric.type,
        event_action: metric.name,
        event_label: JSON.stringify(metric.metadata),
        event_value: metric.value,
        device_type: 'server',
        platform: 'nodejs',
        event_time: new Date(metric.timestamp).toISOString(),
        properties: {
          metric_type: metric.type,
          ...metric.metadata
        }
      }));
      
      await clickhouse.insertUserEvents(events);
      
      console.log(`✅ 导出了 ${events.length} 个性能指标到 ClickHouse`);
      
    } catch (error) {
      console.error('指标导出失败:', error);
    }
  }
  
  // 生成 Prometheus 格式指标
  generatePrometheusMetrics(): string {
    const metrics = this.metricsCollector.getMetrics();
    const output: string[] = [];
    
    // 按指标名称分组
    const groupedMetrics = new Map<string, PerformanceMetric[]>();
    
    for (const metric of metrics) {
      const existing = groupedMetrics.get(metric.name) || [];
      existing.push(metric);
      groupedMetrics.set(metric.name, existing);
    }
    
    // 生成 Prometheus 格式
    for (const [name, metricGroup] of groupedMetrics) {
      const latest = metricGroup[metricGroup.length - 1];
      const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_');
      
      // 添加帮助信息
      output.push(`# HELP ${sanitizedName} ${latest.type} metric`);
      output.push(`# TYPE ${sanitizedName} ${this.getPrometheusType(latest.type)}`);
      
      // 添加标签
      const labels = this.formatLabels(latest.metadata);
      output.push(`${sanitizedName}${labels} ${latest.value} ${latest.timestamp}`);
    }
    
    return output.join('\n');
  }
  
  private getPrometheusType(type: MetricType): string {
    switch (type) {
      case 'counter': return 'counter';
      case 'gauge': return 'gauge';
      case 'histogram': return 'histogram';
      case 'duration': return 'histogram';
      default: return 'gauge';
    }
  }
  
  private formatLabels(metadata: Record<string, any>): string {
    const labelPairs = Object.entries(metadata)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    
    return labelPairs ? `{${labelPairs}}` : '';
  }
}

// ===== 性能监控管理器 =====
export class PerformanceMonitoringManager {
  private metricsCollector: PerformanceMetricsCollector;
  private dbMonitor: DatabasePerformanceMonitor;
  private appMonitor: ApplicationPerformanceMonitor;
  private httpMiddleware: HTTPMetricsMiddleware;
  private metricsExporter: MetricsExporter;
  
  constructor() {
    this.metricsCollector = new PerformanceMetricsCollector();
    this.dbMonitor = new DatabasePerformanceMonitor(this.metricsCollector);
    this.appMonitor = new ApplicationPerformanceMonitor(this.metricsCollector);
    this.httpMiddleware = new HTTPMetricsMiddleware(this.metricsCollector);
    this.metricsExporter = new MetricsExporter(this.metricsCollector);
  }
  
  // 启动所有监控
  startMonitoring(): void {
    console.log('🚀 启动性能监控系统...');
    
    this.dbMonitor.startMonitoring(30000);    // 每30秒收集数据库指标
    this.appMonitor.startMonitoring(10000);   // 每10秒收集应用指标
    this.metricsExporter.startExporting(60000); // 每60秒导出指标
    
    console.log('✅ 性能监控系统启动完成');
  }
  
  // 停止所有监控
  stopMonitoring(): void {
    console.log('⏹️ 停止性能监控系统...');
    
    this.dbMonitor.stopMonitoring();
    this.appMonitor.stopMonitoring();
    this.metricsExporter.stopExporting();
    
    console.log('✅ 性能监控系统已停止');
  }
  
  // 获取 HTTP 中间件
  getHTTPMiddleware() {
    return this.httpMiddleware.middleware();
  }
  
  // 获取指标收集器
  getMetricsCollector(): PerformanceMetricsCollector {
    return this.metricsCollector;
  }
  
  // 获取指标摘要
  getMetricsSummary(): Record<string, AggregatedMetric> {
    const summary: Record<string, AggregatedMetric> = {};
    
    const metricNames = [
      'postgresql.query.health_check',
      'redis.ping',
      'clickhouse.health_check',
      'http.request.duration',
      'nodejs.memory.heap_used',
      'nodejs.event_loop.lag'
    ];
    
    for (const name of metricNames) {
      summary[name] = this.metricsCollector.getAggregatedMetrics(name);
    }
    
    return summary;
  }
  
  // 生成性能报告
  generatePerformanceReport(): PerformanceReport {
    const summary = this.getMetricsSummary();
    const timestamp = new Date();
    
    return {
      timestamp,
      database: {
        postgresql: {
          avgQueryTime: summary['postgresql.query.health_check']?.avg || 0,
          p95QueryTime: summary['postgresql.query.health_check']?.p95 || 0
        },
        redis: {
          avgPingTime: summary['redis.ping']?.avg || 0,
          p95PingTime: summary['redis.ping']?.p95 || 0
        },
        clickhouse: {
          avgHealthCheckTime: summary['clickhouse.health_check']?.avg || 0,
          p95HealthCheckTime: summary['clickhouse.health_check']?.p95 || 0
        }
      },
      application: {
        avgResponseTime: summary['http.request.duration']?.avg || 0,
        p95ResponseTime: summary['http.request.duration']?.p95 || 0,
        memoryUsage: summary['nodejs.memory.heap_used']?.avg || 0,
        eventLoopLag: summary['nodejs.event_loop.lag']?.avg || 0
      },
      health: this.calculateHealthScore(summary)
    };
  }
  
  // 计算健康评分
  private calculateHealthScore(summary: Record<string, AggregatedMetric>): number {
    let score = 100;
    
    // 数据库响应时间评分
    const dbQueryTime = summary['postgresql.query.health_check']?.avg || 0;
    if (dbQueryTime > 100) score -= 20;
    else if (dbQueryTime > 50) score -= 10;
    
    // Redis 响应时间评分
    const redisTime = summary['redis.ping']?.avg || 0;
    if (redisTime > 10) score -= 15;
    else if (redisTime > 5) score -= 5;
    
    // HTTP 响应时间评分
    const httpTime = summary['http.request.duration']?.avg || 0;
    if (httpTime > 500) score -= 25;
    else if (httpTime > 200) score -= 10;
    
    // 事件循环延迟评分
    const eventLoopLag = summary['nodejs.event_loop.lag']?.avg || 0;
    if (eventLoopLag > 100) score -= 20;
    else if (eventLoopLag > 50) score -= 10;
    
    return Math.max(0, score);
  }
}

// ===== 类型定义 =====
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'duration';

export interface PerformanceMetric {
  name: string;
  value: number;
  type: MetricType;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface AggregatedMetric {
  name: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  sum: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface PerformanceReport {
  timestamp: Date;
  database: {
    postgresql: {
      avgQueryTime: number;
      p95QueryTime: number;
    };
    redis: {
      avgPingTime: number;
      p95PingTime: number;
    };
    clickhouse: {
      avgHealthCheckTime: number;
      p95HealthCheckTime: number;
    };
  };
  application: {
    avgResponseTime: number;
    p95ResponseTime: number;
    memoryUsage: number;
    eventLoopLag: number;
  };
  health: number;
}

// ===== 单例导出 =====
let performanceMonitor: PerformanceMonitoringManager;

export const getPerformanceMonitor = (): PerformanceMonitoringManager => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitoringManager();
  }
  return performanceMonitor;
};

export default getPerformanceMonitor;