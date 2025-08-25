/**
 * Prometheus监控系统 - 为PokerIQ Pro提供全面的指标收集和监控
 * 支持100万+并发用户的高性能监控
 */

import { createLogger } from '@/lib/logger';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

const logger = createLogger('prometheus');

// 启用默认系统指标收集
collectDefaultMetrics({
  prefix: 'pokeriq_',
  timeout: 5000,
  register,
});

/**
 * 业务指标定义
 */
// HTTP请求指标
export const httpRequestsTotal = new Counter({
  name: 'pokeriq_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'user_agent'],
});

export const httpRequestDuration = new Histogram({
  name: 'pokeriq_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

// 数据库指标
export const dbConnectionsActive = new Gauge({
  name: 'pokeriq_db_connections_active',
  help: 'Number of active database connections',
});

export const dbQueryDuration = new Histogram({
  name: 'pokeriq_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const dbQueryTotal = new Counter({
  name: 'pokeriq_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
});

// Redis缓存指标
export const cacheHitsTotal = new Counter({
  name: 'pokeriq_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type', 'key_pattern'],
});

export const cacheMissesTotal = new Counter({
  name: 'pokeriq_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type', 'key_pattern'],
});

export const cacheOperationDuration = new Histogram({
  name: 'pokeriq_cache_operation_duration_seconds',
  help: 'Duration of cache operations in seconds',
  labelNames: ['operation', 'cache_type'],
  buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

// 游戏业务指标
export const activeUsersGauge = new Gauge({
  name: 'pokeriq_active_users',
  help: 'Number of currently active users',
  labelNames: ['user_type'],
});

export const gameSessionsTotal = new Counter({
  name: 'pokeriq_game_sessions_total',
  help: 'Total number of game sessions',
  labelNames: ['game_type', 'difficulty'],
});

export const gameSessionDuration = new Histogram({
  name: 'pokeriq_game_session_duration_seconds',
  help: 'Duration of game sessions in seconds',
  labelNames: ['game_type', 'completion_status'],
  buckets: [30, 60, 120, 300, 600, 1200, 1800, 3600],
});

export const handsPlayedTotal = new Counter({
  name: 'pokeriq_hands_played_total',
  help: 'Total number of poker hands played',
  labelNames: ['position', 'action', 'game_type'],
});

export const trainingSessionsTotal = new Counter({
  name: 'pokeriq_training_sessions_total',
  help: 'Total number of training sessions',
  labelNames: ['scenario_type', 'difficulty_level'],
});

export const skillScoreGauge = new Gauge({
  name: 'pokeriq_user_skill_score',
  help: 'Current user skill scores',
  labelNames: ['user_id', 'skill_type'],
});

// AI引擎指标
export const aiDecisionDuration = new Histogram({
  name: 'pokeriq_ai_decision_duration_seconds',
  help: 'Duration of AI decision making in seconds',
  labelNames: ['model_type', 'complexity'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const aiRequestsTotal = new Counter({
  name: 'pokeriq_ai_requests_total',
  help: 'Total number of AI service requests',
  labelNames: ['service_type', 'status'],
});

// WebSocket连接指标
export const websocketConnectionsActive = new Gauge({
  name: 'pokeriq_websocket_connections_active',
  help: 'Number of active WebSocket connections',
});

export const websocketMessagesTotal = new Counter({
  name: 'pokeriq_websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['direction', 'message_type'],
});

// 错误指标
export const errorsTotal = new Counter({
  name: 'pokeriq_errors_total',
  help: 'Total number of errors',
  labelNames: ['error_type', 'severity', 'component'],
});

// 支付系统指标
export const paymentRequestsTotal = new Counter({
  name: 'pokeriq_payment_requests_total',
  help: 'Total number of payment requests',
  labelNames: ['payment_method', 'status', 'plan_type'],
});

export const paymentAmountTotal = new Counter({
  name: 'pokeriq_payment_amount_total',
  help: 'Total payment amount processed',
  labelNames: ['currency', 'plan_type'],
});

/**
 * 指标收集器类
 */
export class PrometheusCollector {
  private static instance: PrometheusCollector;

  private constructor() {
    logger.info('Prometheus metrics collector initialized');
  }

  static getInstance(): PrometheusCollector {
    if (!PrometheusCollector.instance) {
      PrometheusCollector.instance = new PrometheusCollector();
    }
    return PrometheusCollector.instance;
  }

  /**
   * 记录HTTP请求指标
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    userAgent?: string
  ) {
    httpRequestsTotal.labels(method, route, statusCode.toString(), userAgent || 'unknown').inc();
    httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration / 1000);
  }

  /**
   * 记录数据库查询指标
   */
  recordDbQuery(operation: string, table: string, duration: number, success: boolean) {
    dbQueryTotal.labels(operation, table, success ? 'success' : 'error').inc();
    dbQueryDuration.labels(operation, table).observe(duration / 1000);
  }

  /**
   * 更新数据库连接数
   */
  updateDbConnections(count: number) {
    dbConnectionsActive.set(count);
  }

  /**
   * 记录缓存命中/未命中
   */
  recordCacheHit(cacheType: string, keyPattern: string) {
    cacheHitsTotal.labels(cacheType, keyPattern).inc();
  }

  recordCacheMiss(cacheType: string, keyPattern: string) {
    cacheMissesTotal.labels(cacheType, keyPattern).inc();
  }

  recordCacheOperation(operation: string, cacheType: string, duration: number) {
    cacheOperationDuration.labels(operation, cacheType).observe(duration / 1000);
  }

  /**
   * 更新活跃用户数
   */
  updateActiveUsers(count: number, userType: string = 'total') {
    activeUsersGauge.labels(userType).set(count);
  }

  /**
   * 记录游戏会话
   */
  recordGameSession(gameType: string, difficulty: string, duration: number, completed: boolean) {
    gameSessionsTotal.labels(gameType, difficulty).inc();
    gameSessionDuration
      .labels(gameType, completed ? 'completed' : 'abandoned')
      .observe(duration / 1000);
  }

  /**
   * 记录扑克手牌
   */
  recordHandPlayed(position: string, action: string, gameType: string) {
    handsPlayedTotal.labels(position, action, gameType).inc();
  }

  /**
   * 记录训练会话
   */
  recordTrainingSession(scenarioType: string, difficultyLevel: string) {
    trainingSessionsTotal.labels(scenarioType, difficultyLevel).inc();
  }

  /**
   * 更新用户技能分数
   */
  updateSkillScore(userId: string, skillType: string, score: number) {
    skillScoreGauge.labels(userId, skillType).set(score);
  }

  /**
   * 记录AI决策时间
   */
  recordAiDecision(modelType: string, complexity: string, duration: number) {
    aiDecisionDuration.labels(modelType, complexity).observe(duration / 1000);
  }

  /**
   * 记录AI请求
   */
  recordAiRequest(serviceType: string, success: boolean) {
    aiRequestsTotal.labels(serviceType, success ? 'success' : 'error').inc();
  }

  /**
   * 更新WebSocket连接数
   */
  updateWebSocketConnections(count: number) {
    websocketConnectionsActive.set(count);
  }

  /**
   * 记录WebSocket消息
   */
  recordWebSocketMessage(direction: 'in' | 'out', messageType: string) {
    websocketMessagesTotal.labels(direction, messageType).inc();
  }

  /**
   * 记录错误
   */
  recordError(errorType: string, severity: string, component: string) {
    errorsTotal.labels(errorType, severity, component).inc();
  }

  /**
   * 记录支付请求
   */
  recordPayment(paymentMethod: string, status: string, planType: string, amount?: number, currency?: string) {
    paymentRequestsTotal.labels(paymentMethod, status, planType).inc();
    
    if (amount && currency) {
      paymentAmountTotal.labels(currency, planType).inc(amount);
    }
  }

  /**
   * 获取所有指标
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * 清除所有指标
   */
  clearMetrics() {
    register.clear();
    logger.warn('All Prometheus metrics cleared');
  }
}

// 导出单例
export const prometheusCollector = PrometheusCollector.getInstance();

/**
 * 中间件装饰器 - 自动收集HTTP请求指标
 */
export function withPrometheusMetrics(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - startTime;
      
      // 这里可以根据具体的请求对象提取信息
      // prometheusCollector.recordHttpRequest(method, route, 200, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // prometheusCollector.recordHttpRequest(method, route, 500, duration);
      prometheusCollector.recordError('api_error', 'high', target.constructor.name);
      
      throw error;
    }
  };

  return descriptor;
}

/**
 * 性能基准指标
 */
export const PERFORMANCE_TARGETS = {
  // API响应时间目标
  API_RESPONSE_TIME: {
    P50: 50,   // 50ms
    P95: 100,  // 100ms
    P99: 200,  // 200ms
  },
  
  // 数据库查询时间目标
  DB_QUERY_TIME: {
    P50: 10,   // 10ms
    P95: 50,   // 50ms
    P99: 100,  // 100ms
  },
  
  // 缓存操作时间目标
  CACHE_OPERATION_TIME: {
    P50: 1,    // 1ms
    P95: 5,    // 5ms
    P99: 10,   // 10ms
  },
  
  // AI决策时间目标
  AI_DECISION_TIME: {
    P50: 100,  // 100ms
    P95: 500,  // 500ms
    P99: 1000, // 1s
  },
  
  // 并发用户目标
  CONCURRENT_USERS: {
    TARGET: 1000000,     // 100万用户
    WARNING: 800000,     // 80万用户告警
    CRITICAL: 950000,    // 95万用户严重告警
  },
  
  // 系统可用性目标
  AVAILABILITY: {
    TARGET: 99.9,        // 99.9%
    WARNING: 99.5,       // 99.5%告警
    CRITICAL: 99.0,      // 99.0%严重告警
  },
} as const;

export default prometheusCollector;