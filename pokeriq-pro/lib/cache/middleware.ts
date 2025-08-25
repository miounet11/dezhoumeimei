import { NextRequest, NextResponse } from 'next/server';
import { RateLimitStrategy } from './strategies';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cache-middleware');

/**
 * API速率限制中间件配置
 */
export const RATE_LIMIT_CONFIG = {
  // 全局限制
  global: {
    limit: 100,
    window: 60, // 1分钟
  },
  // API特定限制
  api: {
    '/api/auth/login': { limit: 5, window: 300 }, // 5次/5分钟
    '/api/auth/register': { limit: 3, window: 3600 }, // 3次/小时
    '/api/training': { limit: 30, window: 60 }, // 30次/分钟
    '/api/analytics': { limit: 20, window: 60 }, // 20次/分钟
    '/api/achievements': { limit: 50, window: 60 }, // 50次/分钟
  },
  // 用户级别限制
  user: {
    default: { limit: 60, window: 60 }, // 普通用户
    vip: { limit: 120, window: 60 }, // VIP用户
    admin: { limit: 1000, window: 60 }, // 管理员
  },
};

/**
 * 获取客户端标识符
 */
function getClientIdentifier(request: NextRequest): string {
  // 优先使用用户ID（如果已认证）
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }

  // 使用IP地址
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
    request.headers.get('x-real-ip') || 
    'unknown';
  
  return `ip:${ip}`;
}

/**
 * 速率限制中间件
 */
export async function rateLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  
  // 跳过健康检查和静态资源
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/api/health'
  ) {
    return null;
  }

  const identifier = getClientIdentifier(request);
  
  try {
    // 检查API特定限制
    const apiConfig = RATE_LIMIT_CONFIG.api[pathname as keyof typeof RATE_LIMIT_CONFIG.api];
    if (apiConfig) {
      const allowed = await RateLimitStrategy.checkRateLimit(
        `${identifier}:${pathname}`,
        apiConfig.limit,
        apiConfig.window
      );
      
      if (!allowed) {
        logger.warn('API rate limit exceeded', { identifier, pathname });
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many requests. Please try again later.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(apiConfig.window),
              'X-RateLimit-Limit': String(apiConfig.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Date.now() + apiConfig.window * 1000),
            },
          }
        );
      }
    }

    // 检查全局限制
    const globalAllowed = await RateLimitStrategy.checkRateLimit(
      `${identifier}:global`,
      RATE_LIMIT_CONFIG.global.limit,
      RATE_LIMIT_CONFIG.global.window
    );
    
    if (!globalAllowed) {
      logger.warn('Global rate limit exceeded', { identifier });
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please slow down.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(RATE_LIMIT_CONFIG.global.window),
          },
        }
      );
    }

    return null; // 允许请求继续
  } catch (error) {
    logger.error('Rate limit check error', { identifier, pathname, error });
    // 错误时允许请求继续，避免阻塞
    return null;
  }
}

/**
 * 缓存响应中间件
 * 用于缓存GET请求的响应
 */
export function createCacheMiddleware(
  options: {
    ttl?: number;
    varyBy?: string[];
    excludePaths?: string[];
  } = {}
) {
  return async function cacheMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    // 只缓存GET请求
    if (request.method !== 'GET') {
      return handler();
    }

    const pathname = request.nextUrl.pathname;
    
    // 检查是否在排除列表中
    if (options.excludePaths?.some(path => pathname.startsWith(path))) {
      return handler();
    }

    // 构建缓存键
    const varyBy = options.varyBy || [];
    const cacheKeyParts = [
      'response',
      pathname,
      ...varyBy.map(header => request.headers.get(header) || ''),
    ];
    const cacheKey = cacheKeyParts.join(':');

    try {
      // 尝试从缓存获取
      const { cache } = await import('./redis');
      const cached = await cache.get<{
        body: any;
        headers: Record<string, string>;
        status: number;
      }>(cacheKey);

      if (cached) {
        logger.debug('Cache hit for response', { pathname });
        return NextResponse.json(cached.body, {
          status: cached.status,
          headers: {
            ...cached.headers,
            'X-Cache': 'HIT',
          },
        });
      }

      // 执行处理器
      const response = await handler();
      
      // 只缓存成功响应
      if (response.status === 200) {
        const body = await response.json();
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });

        await cache.set(
          cacheKey,
          {
            body,
            headers,
            status: response.status,
          },
          options.ttl || 60
        );

        // 返回新响应，添加缓存标记
        return NextResponse.json(body, {
          status: response.status,
          headers: {
            ...headers,
            'X-Cache': 'MISS',
          },
        });
      }

      return response;
    } catch (error) {
      logger.error('Cache middleware error', { pathname, error });
      // 错误时返回原始响应
      return handler();
    }
  };
}

/**
 * 缓存失效中间件
 * 用于在数据变更时自动失效相关缓存
 */
export function createInvalidationMiddleware(
  patterns: Record<string, string[]>
) {
  return async function invalidationMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const response = await handler();
    
    // 只在成功的变更操作后失效缓存
    if (
      response.status >= 200 && 
      response.status < 300 &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
    ) {
      const pathname = request.nextUrl.pathname;
      const invalidationPatterns = patterns[pathname];
      
      if (invalidationPatterns) {
        try {
          const { cache } = await import('./redis');
          
          for (const pattern of invalidationPatterns) {
            await cache.deletePattern(pattern);
            logger.debug('Cache invalidated', { pathname, pattern });
          }
        } catch (error) {
          logger.error('Cache invalidation error', { pathname, error });
        }
      }
    }

    return response;
  };
}