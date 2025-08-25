import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/cache/redis';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cache-health');

export async function GET(request: NextRequest) {
  try {
    const redis = getRedisClient();
    
    // 检查Redis连接
    const startTime = Date.now();
    await redis.ping();
    const responseTime = Date.now() - startTime;
    
    // 获取Redis信息
    const info = await redis.info('server');
    const memoryInfo = await redis.info('memory');
    
    // 解析版本信息
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    
    // 解析内存使用情况
    const usedMemoryMatch = memoryInfo.match(/used_memory_human:([^\r\n]+)/);
    const usedMemory = usedMemoryMatch ? usedMemoryMatch[1] : 'unknown';
    
    const maxMemoryMatch = memoryInfo.match(/maxmemory_human:([^\r\n]+)/);
    const maxMemory = maxMemoryMatch ? maxMemoryMatch[1] : 'unlimited';
    
    // 获取键数量
    const dbSize = await redis.dbsize();
    
    logger.info('Cache health check successful', {
      responseTime,
      version,
      dbSize,
    });
    
    return NextResponse.json({
      status: 'healthy',
      redis: {
        connected: true,
        version,
        responseTime: `${responseTime}ms`,
        dbSize,
        memory: {
          used: usedMemory,
          max: maxMemory,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache health check failed', { error });
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        redis: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// 清空缓存（仅在开发环境）
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Cache flush only allowed in development' },
      { status: 403 }
    );
  }
  
  try {
    const redis = getRedisClient();
    await redis.flushdb();
    
    logger.warn('Cache flushed (development mode)');
    
    return NextResponse.json({
      success: true,
      message: 'Cache flushed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache flush failed', { error });
    
    return NextResponse.json(
      {
        error: 'Failed to flush cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}