import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Edge Runtime的基础配置
    tracesSampleRate: 0.1,
    
    // 环境配置
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    
    // 调试模式
    debug: false,
  });
}