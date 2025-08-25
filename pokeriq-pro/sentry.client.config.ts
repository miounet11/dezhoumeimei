import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // 性能监控采样率
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // 会话重放采样率
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // 环境配置
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    
    // 调试模式
    debug: process.env.NODE_ENV === 'development',
    
    // 集成配置
    integrations: [
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
      new Sentry.BrowserTracing({
        // 路由追踪
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
    ],
    
    // 错误过滤
    beforeSend(event, hint) {
      // 过滤特定错误
      if (event.exception) {
        const error = hint.originalException;
        
        // 忽略用户取消的请求
        if (error?.name === 'AbortError') {
          return null;
        }
        
        // 忽略网络错误（可能是用户网络问题）
        if (error?.message?.includes('NetworkError')) {
          return null;
        }
        
        // 忽略扩展插件引起的错误
        if (event.exception.values?.[0]?.stacktrace?.frames?.some(
          frame => frame.filename?.includes('extension://')
        )) {
          return null;
        }
      }
      
      // 添加用户上下文
      if (typeof window !== 'undefined') {
        const user = localStorage.getItem('user');
        if (user) {
          try {
            const userData = JSON.parse(user);
            event.user = {
              id: userData.id,
              email: userData.email,
              username: userData.username,
            };
          } catch {}
        }
      }
      
      return event;
    },
    
    // 面包屑配置
    beforeBreadcrumb(breadcrumb) {
      // 过滤敏感信息
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      
      // 隐藏密码字段
      if (breadcrumb.data?.password) {
        breadcrumb.data.password = '[REDACTED]';
      }
      
      return breadcrumb;
    },
  });
}