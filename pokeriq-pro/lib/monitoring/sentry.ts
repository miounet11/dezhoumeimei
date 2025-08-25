/**
 * Sentry错误追踪和性能监控系统
 * 为PokerIQ Pro提供全面的错误收集、性能监控和用户体验追踪
 * 支持100万+并发用户的错误监控
 */

import * as Sentry from '@sentry/nextjs';
import { BrowserTracing } from '@sentry/tracing';
import { createLogger } from '@/lib/logger';

const logger = createLogger('sentry');

// Sentry配置选项
const SENTRY_CONFIG = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  debug: process.env.NODE_ENV === 'development',
  
  // 性能监控配置
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 生产环境10%采样
  
  // 会话重放配置
  replaysSessionSampleRate: 0.01, // 1%的会话录制
  replaysOnErrorSampleRate: 1.0,  // 100%的错误会话录制
  
  // 发布版本
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // 服务器名称
  serverName: process.env.SENTRY_SERVER_NAME || 'pokeriq-prod',
  
  // 最大面包屑数量
  maxBreadcrumbs: 100,
  
  // 附加数据发送前处理
  beforeSend: (event, hint) => {
    // 过滤敏感信息
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    
    // 过滤特定错误
    if (event.exception) {
      const firstException = event.exception.values?.[0];
      if (firstException?.value?.includes('Network Error') ||
          firstException?.value?.includes('ChunkLoadError')) {
        return null; // 不发送网络错误
      }
    }
    
    return event;
  },
  
  // 性能追踪数据过滤
  beforeSendTransaction: (event) => {
    // 过滤不重要的事务
    if (event.transaction?.includes('/_next/static/')) {
      return null;
    }
    
    return event;
  },
  
  // 集成配置
  integrations: [
    new BrowserTracing({
      // 自动追踪路由变化
      routingInstrumentation: Sentry.nextRouterInstrumentation,
      
      // 追踪长任务
      enableLongTask: true,
      
      // 追踪交互
      enableInteractionTracing: true,
      
      // 自定义追踪传播目标
      tracePropagationTargets: [
        /^\/api\//,
        /^https:\/\/api\.pokeriq\.pro/,
        /^https:\/\/ai-service\.pokeriq\.pro/,
      ],
      
      // 自动捕获Web Vitals
      enableWebVitals: true,
    }),
    
    // 会话重放
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
      beforeAddRecordingEvent: (event) => {
        // 过滤敏感数据
        if (event.data?.tag === 'input') {
          event.data.attributes = { type: 'text' };
        }
        return event;
      },
    }),
  ],
  
  // 初始范围配置
  initialScope: {
    tags: {
      component: 'pokeriq-frontend',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    },
    level: 'info',
  },
};

/**
 * 初始化Sentry
 */
export function initSentry() {
  if (!SENTRY_CONFIG.dsn) {
    logger.warn('Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init(SENTRY_CONFIG);
  
  // 设置用户上下文
  Sentry.configureScope((scope) => {
    scope.setTag('platform', 'web');
    scope.setContext('app', {
      name: 'PokerIQ Pro',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      build: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
    });
  });

  logger.info('Sentry initialized successfully');
}

/**
 * 错误监控类
 */
export class ErrorMonitor {
  private static instance: ErrorMonitor;
  
  private constructor() {
    this.setupGlobalErrorHandlers();
  }
  
  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }
  
  /**
   * 设置全局错误处理
   */
  private setupGlobalErrorHandlers() {
    // 捕获未处理的Promise拒绝
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.captureException(event.reason, {
          level: 'error',
          tags: { type: 'unhandled_promise_rejection' },
          extra: { promise: event.promise },
        });
      });
      
      // 捕获全局错误
      window.addEventListener('error', (event) => {
        this.captureException(event.error, {
          level: 'error',
          tags: { type: 'global_error' },
          extra: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });
    }
  }
  
  /**
   * 捕获异常
   */
  captureException(error: Error | any, options?: {
    level?: Sentry.SeverityLevel;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: Sentry.User;
    fingerprint?: string[];
  }) {
    Sentry.withScope((scope) => {
      if (options?.level) scope.setLevel(options.level);
      if (options?.tags) {
        Object.entries(options.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (options?.extra) scope.setExtras(options.extra);
      if (options?.user) scope.setUser(options.user);
      if (options?.fingerprint) scope.setFingerprint(options.fingerprint);
      
      Sentry.captureException(error);
    });
  }
  
  /**
   * 捕获消息
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', extra?: Record<string, any>) {
    Sentry.withScope((scope) => {
      scope.setLevel(level);
      if (extra) scope.setExtras(extra);
      Sentry.captureMessage(message);
    });
  }
  
  /**
   * 设置用户上下文
   */
  setUser(user: {
    id?: string;
    username?: string;
    subscription?: string;
    skillLevel?: string;
  }) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      subscription: user.subscription,
      skill_level: user.skillLevel,
    });
  }
  
  /**
   * 清除用户上下文
   */
  clearUser() {
    Sentry.configureScope((scope) => scope.clear());
  }
  
  /**
   * 添加面包屑
   */
  addBreadcrumb(message: string, category: string, level: Sentry.SeverityLevel = 'info', data?: any) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  }
  
  /**
   * 设置上下文
   */
  setContext(key: string, context: Record<string, any>) {
    Sentry.setContext(key, context);
  }
  
  /**
   * 设置标签
   */
  setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }
  
  /**
   * 开始性能事务
   */
  startTransaction(name: string, op: string): Sentry.Transaction {
    return Sentry.startTransaction({ name, op });
  }
  
  /**
   * 测量异步函数性能
   */
  async measureAsync<T>(
    name: string,
    operation: string,
    asyncFn: () => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(name, operation);
    
    try {
      const result = await asyncFn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      this.captureException(error, {
        tags: { transaction: name, operation },
      });
      throw error;
    } finally {
      transaction.finish();
    }
  }
  
  /**
   * 游戏相关错误追踪
   */
  captureGameError(error: Error, gameContext: {
    gameType?: string;
    gameId?: string;
    handId?: string;
    position?: string;
    action?: string;
    stack?: number;
  }) {
    this.captureException(error, {
      level: 'error',
      tags: {
        type: 'game_error',
        game_type: gameContext.gameType || 'unknown',
      },
      extra: gameContext,
      fingerprint: ['game-error', gameContext.gameType || 'unknown'],
    });
  }
  
  /**
   * AI服务错误追踪
   */
  captureAIError(error: Error, aiContext: {
    modelType?: string;
    requestType?: string;
    inputSize?: number;
    processingTime?: number;
  }) {
    this.captureException(error, {
      level: 'error',
      tags: {
        type: 'ai_error',
        model_type: aiContext.modelType || 'unknown',
        request_type: aiContext.requestType || 'unknown',
      },
      extra: aiContext,
      fingerprint: ['ai-error', aiContext.modelType || 'unknown'],
    });
  }
  
  /**
   * 支付错误追踪
   */
  capturePaymentError(error: Error, paymentContext: {
    paymentMethod?: string;
    amount?: number;
    currency?: string;
    planType?: string;
    userId?: string;
  }) {
    this.captureException(error, {
      level: 'error',
      tags: {
        type: 'payment_error',
        payment_method: paymentContext.paymentMethod || 'unknown',
        plan_type: paymentContext.planType || 'unknown',
      },
      extra: {
        ...paymentContext,
        // 移除敏感信息
        userId: paymentContext.userId ? '***' : undefined,
      },
      fingerprint: ['payment-error', paymentContext.paymentMethod || 'unknown'],
    });
  }
  
  /**
   * 性能问题追踪
   */
  capturePerformanceIssue(issue: {
    type: 'slow_api' | 'slow_db' | 'slow_cache' | 'high_memory' | 'high_cpu';
    metric: string;
    value: number;
    threshold: number;
    endpoint?: string;
    query?: string;
  }) {
    this.captureMessage(`Performance issue: ${issue.type}`, 'warning', {
      metric: issue.metric,
      value: issue.value,
      threshold: issue.threshold,
      endpoint: issue.endpoint,
      query: issue.query,
    });
    
    this.setTag('performance_issue', issue.type);
  }
}

/**
 * 性能监控装饰器
 */
export function withSentryPerformance(name: string, op: string = 'function') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const transaction = Sentry.startTransaction({
        name: `${name}.${propertyKey}`,
        op,
      });
      
      try {
        const result = await originalMethod.apply(this, args);
        transaction.setStatus('ok');
        return result;
      } catch (error) {
        transaction.setStatus('internal_error');
        ErrorMonitor.getInstance().captureException(error, {
          tags: { component: name, method: propertyKey },
        });
        throw error;
      } finally {
        transaction.finish();
      }
    };
    
    return descriptor;
  };
}

/**
 * 错误边界组件
 */
export class SentryErrorBoundary extends Sentry.ErrorBoundary {
  constructor(props: any) {
    super({
      ...props,
      beforeCapture: (scope, error, info) => {
        scope.setTag('error_boundary', 'react');
        scope.setContext('react_error_info', info);
        if (props.beforeCapture) {
          props.beforeCapture(scope, error, info);
        }
      },
      fallback: ({ error, resetError, eventId }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              应用程序发生错误
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              很抱歉，应用程序遇到了意外错误。我们已经记录了这个问题，并将尽快修复。
            </p>
            {eventId && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                错误ID: {eventId}
              </p>
            )}
            <button
              onClick={resetError}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              重新加载页面
            </button>
          </div>
        </div>
      ),
    });
  }
}

// 导出单例
export const errorMonitor = ErrorMonitor.getInstance();

// 业务错误类型定义
export const ErrorTypes = {
  GAME_ERROR: 'game_error',
  AI_ERROR: 'ai_error',
  PAYMENT_ERROR: 'payment_error',
  AUTH_ERROR: 'auth_error',
  NETWORK_ERROR: 'network_error',
  VALIDATION_ERROR: 'validation_error',
  PERFORMANCE_ERROR: 'performance_error',
} as const;

// 错误严重级别
export const ErrorSeverity = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

export default errorMonitor;