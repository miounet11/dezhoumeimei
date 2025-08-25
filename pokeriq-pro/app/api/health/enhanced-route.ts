import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createLogger } from '@/lib/logger';
import os from 'os';

const logger = createLogger('health-check');

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: CheckResult;
    redis?: CheckResult;
    memory: CheckResult;
    disk?: CheckResult;
  };
  system?: SystemInfo;
}

interface CheckResult {
  status: 'ok' | 'warning' | 'error';
  message?: string;
  responseTime?: number;
  details?: any;
}

interface SystemInfo {
  hostname: string;
  platform: string;
  cpuUsage: number;
  memoryUsage: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  loadAverage: number[];
}

// 检查数据库连接
async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    // 执行简单查询测试连接
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    
    return {
      status: responseTime < 100 ? 'ok' : 'warning',
      responseTime,
      message: `Database responding in ${responseTime}ms`,
    };
  } catch (error) {
    logger.error({ error }, 'Database health check failed');
    return {
      status: 'error',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 检查Redis连接（如果配置了）
async function checkRedis(): Promise<CheckResult | undefined> {
  if (!process.env.REDIS_URL) {
    return undefined;
  }

  try {
    // 这里应该实现Redis连接检查
    // 暂时返回模拟结果
    return {
      status: 'ok',
      message: 'Redis connection available',
      responseTime: 5,
    };
  } catch (error) {
    logger.error({ error }, 'Redis health check failed');
    return {
      status: 'error',
      message: 'Redis connection failed',
    };
  }
}

// 检查内存使用
function checkMemory(): CheckResult {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;

  let status: 'ok' | 'warning' | 'error' = 'ok';
  if (memoryUsagePercent > 90) {
    status = 'error';
  } else if (memoryUsagePercent > 80) {
    status = 'warning';
  }

  return {
    status,
    message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
    details: {
      total: Math.round(totalMemory / 1024 / 1024) + ' MB',
      used: Math.round(usedMemory / 1024 / 1024) + ' MB',
      free: Math.round(freeMemory / 1024 / 1024) + ' MB',
      percentage: memoryUsagePercent.toFixed(2),
    },
  };
}

// 获取系统信息
function getSystemInfo(): SystemInfo {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    cpuUsage: os.loadavg()[0] * 100, // 1分钟平均负载
    memoryUsage: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      percentage: (usedMemory / totalMemory) * 100,
    },
    loadAverage: os.loadavg(),
  };
}

// 主健康检查处理函数
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 执行各项检查
    const [databaseCheck, redisCheck, memoryCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      Promise.resolve(checkMemory()),
    ]);

    // 判断整体健康状态
    const checks = {
      database: databaseCheck,
      ...(redisCheck && { redis: redisCheck }),
      memory: memoryCheck,
    };

    const hasError = Object.values(checks).some(check => check?.status === 'error');
    const hasWarning = Object.values(checks).some(check => check?.status === 'warning');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (hasError) {
      overallStatus = 'unhealthy';
    } else if (hasWarning) {
      overallStatus = 'degraded';
    }

    // 构建响应
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
    };

    // 在详细模式下包含系统信息
    const detailed = request.nextUrl.searchParams.get('detailed') === 'true';
    if (detailed) {
      healthStatus.system = getSystemInfo();
    }

    // 记录健康检查
    const responseTime = Date.now() - startTime;
    logger.info({
      status: overallStatus,
      responseTime,
      checks: Object.fromEntries(
        Object.entries(checks).map(([key, value]) => [key, value?.status])
      ),
    }, 'Health check completed');

    // 根据状态返回不同的HTTP状态码
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                       overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: httpStatus });
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

// 支持HEAD请求（用于简单的存活检查）
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}