/**
 * API监控中间件
 * 集成Prometheus和Sentry监控，提供全面的API性能和错误追踪
 */

import { NextRequest, NextResponse } from 'next/server';
import { prometheusCollector } from '@/lib/monitoring/prometheus';
import { errorMonitor } from '@/lib/monitoring/sentry';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-monitoring');

interface RequestMetrics {
  startTime: number;
  method: string;
  url: string;
  userAgent?: string;
  userId?: string;
  ip?: string;
}

/**
 * API监控中间件
 */
export function apiMonitoringMiddleware(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    const metrics: RequestMetrics = {
      startTime: Date.now(),
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent') || undefined,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    };

    // 设置请求上下文
    errorMonitor.setContext('request', {
      method: metrics.method,
      url: metrics.url,
      userAgent: metrics.userAgent,
      timestamp: new Date().toISOString(),
    });

    // 添加面包屑
    errorMonitor.addBreadcrumb(
      `API Request: ${metrics.method} ${metrics.url}`,
      'http',
      'info',
      { method: metrics.method, url: metrics.url }
    );

    let response: NextResponse;
    let statusCode = 200;
    let error: Error | null = null;

    try {
      // 执行API处理函数
      response = await handler(req, context);
      statusCode = response.status;

      // 检查响应状态
      if (statusCode >= 400) {
        error = new Error(`HTTP ${statusCode} Error`);
      }

    } catch (catchedError: any) {
      error = catchedError;
      statusCode = 500;

      // 捕获API错误
      errorMonitor.captureException(error, {
        level: 'error',
        tags: {
          type: 'api_error',
          method: metrics.method,
          endpoint: getEndpointName(metrics.url),
        },
        extra: {
          url: metrics.url,
          method: metrics.method,
          userAgent: metrics.userAgent,
          ip: metrics.ip,
        },
        fingerprint: ['api-error', metrics.method, getEndpointName(metrics.url)],
      });

      // 创建错误响应
      response = NextResponse.json(
        {
          error: 'Internal Server Error',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    } finally {
      // 计算请求处理时间
      const duration = Date.now() - metrics.startTime;
      const endpoint = getEndpointName(metrics.url);

      // 记录Prometheus指标
      prometheusCollector.recordHttpRequest(
        metrics.method,
        endpoint,
        statusCode,
        duration,
        metrics.userAgent
      );

      // 记录性能问题
      if (duration > 5000) { // 超过5秒
        errorMonitor.capturePerformanceIssue({
          type: 'slow_api',
          metric: 'response_time',
          value: duration,
          threshold: 5000,
          endpoint,
        });
      }

      // 记录访问日志
      logger.info('API Request', {
        method: metrics.method,
        url: metrics.url,
        statusCode,
        duration,
        userAgent: metrics.userAgent,
        ip: metrics.ip,
        error: error?.message,
      });

      // 添加响应头
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Request-ID', generateRequestId());
    }

    return response;
  };
}

/**
 * 从URL提取端点名称
 */
function getEndpointName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // 移除查询参数并标准化路径
    return pathname
      .replace(/\/api/, '') // 移除/api前缀
      .replace(/\/\d+/g, '/:id') // 将数字ID替换为:id
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // 将UUID替换为:uuid
      .replace(/\/$/, '') || '/'; // 移除末尾斜杠
  } catch {
    return 'unknown';
  }
}

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * 数据库监控装饰器
 */
export function withDatabaseMonitoring(operation: string, table: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // 记录成功的数据库操作
        prometheusCollector.recordDbQuery(operation, table, duration, true);

        // 检查慢查询
        if (duration > 1000) { // 超过1秒
          errorMonitor.capturePerformanceIssue({
            type: 'slow_db',
            metric: 'query_time',
            value: duration,
            threshold: 1000,
            query: `${operation} on ${table}`,
          });
        }

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        // 记录失败的数据库操作
        prometheusCollector.recordDbQuery(operation, table, duration, false);

        // 捕获数据库错误
        errorMonitor.captureException(error, {
          level: 'error',
          tags: {
            type: 'database_error',
            operation,
            table,
          },
          extra: {
            operation,
            table,
            duration,
            args: args.length > 0 ? 'provided' : 'none',
          },
          fingerprint: ['database-error', operation, table],
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Redis监控装饰器
 */
export function withRedisMonitoring(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // 记录Redis操作
        prometheusCollector.recordCacheOperation(operation, 'redis', duration);

        // 根据操作类型记录命中/未命中
        if (operation === 'get' && result !== null) {
          prometheusCollector.recordCacheHit('redis', 'general');
        } else if (operation === 'get' && result === null) {
          prometheusCollector.recordCacheMiss('redis', 'general');
        }

        // 检查慢操作
        if (duration > 100) { // 超过100毫秒
          errorMonitor.capturePerformanceIssue({
            type: 'slow_cache',
            metric: 'operation_time',
            value: duration,
            threshold: 100,
            endpoint: operation,
          });
        }

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        // 捕获Redis错误
        errorMonitor.captureException(error, {
          level: 'error',
          tags: {
            type: 'cache_error',
            operation,
          },
          extra: {
            operation,
            duration,
            args: args.length > 0 ? 'provided' : 'none',
          },
          fingerprint: ['cache-error', operation],
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 健康检查监控
 */
export class HealthCheckMonitor {
  private static instance: HealthCheckMonitor;
  private checks: Map<string, HealthCheck> = new Map();

  private constructor() {}

  static getInstance(): HealthCheckMonitor {
    if (!HealthCheckMonitor.instance) {
      HealthCheckMonitor.instance = new HealthCheckMonitor();
    }
    return HealthCheckMonitor.instance;
  }

  /**
   * 注册健康检查
   */
  registerCheck(name: string, check: HealthCheck) {
    this.checks.set(name, check);
  }

  /**
   * 执行所有健康检查
   */
  async runAllChecks(): Promise<HealthCheckResult> {
    const results: Record<string, any> = {};
    let overallStatus = 'healthy';

    for (const [name, check] of this.checks) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          check.execute(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), check.timeout || 5000)
          )
        ]);
        const duration = Date.now() - startTime;

        results[name] = {
          status: 'healthy',
          duration,
          result,
          timestamp: new Date().toISOString(),
        };

        // 记录健康检查指标
        prometheusCollector.recordHttpRequest('GET', `/health/${name}`, 200, duration);

      } catch (error: any) {
        const duration = Date.now() - startTime;
        overallStatus = 'unhealthy';

        results[name] = {
          status: 'unhealthy',
          duration,
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        // 记录健康检查失败
        prometheusCollector.recordHttpRequest('GET', `/health/${name}`, 500, duration);
        
        errorMonitor.captureException(error, {
          level: 'warning',
          tags: { type: 'health_check_failure', check: name },
          extra: { checkName: name, duration },
        });
      }
    }

    return {
      status: overallStatus as 'healthy' | 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: results,
    };
  }
}

interface HealthCheck {
  execute: () => Promise<any>;
  timeout?: number;
}

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: Record<string, any>;
}

// 导出监控实例
export const healthCheckMonitor = HealthCheckMonitor.getInstance();

/**
 * 注册默认健康检查
 */
export function registerDefaultHealthChecks() {
  // 数据库连接检查
  healthCheckMonitor.registerCheck('database', {
    execute: async () => {
      // 这里应该实现实际的数据库连接检查
      return { connected: true };
    },
    timeout: 3000,
  });

  // Redis连接检查
  healthCheckMonitor.registerCheck('redis', {
    execute: async () => {
      // 这里应该实现实际的Redis连接检查
      return { connected: true };
    },
    timeout: 2000,
  });

  // AI服务检查
  healthCheckMonitor.registerCheck('ai-service', {
    execute: async () => {
      // 这里应该实现实际的AI服务检查
      return { available: true };
    },
    timeout: 5000,
  });
}

export default apiMonitoringMiddleware;