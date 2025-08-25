import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // 性能监控采样率
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // 环境配置
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    
    // 调试模式
    debug: process.env.NODE_ENV === 'development',
    
    // 服务器端集成
    integrations: [
      // 数据库查询追踪
      new Sentry.Integrations.Prisma({ client: true }),
    ],
    
    // 错误过滤
    beforeSend(event, hint) {
      // 过滤健康检查错误
      if (event.request?.url?.includes('/api/health')) {
        return null;
      }
      
      // 添加额外上下文
      event.extra = {
        ...event.extra,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      };
      
      return event;
    },
  });
}