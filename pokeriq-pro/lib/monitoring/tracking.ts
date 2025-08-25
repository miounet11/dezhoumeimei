import { businessMetrics } from './metrics';

/**
 * 用户行为追踪
 */
export class UserTracker {
  /**
   * 追踪页面浏览
   */
  static pageView(path: string, referrer?: string) {
    if (typeof window === 'undefined') return;

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: path,
      });
    }

    // Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track('Page View', {
        path,
        referrer,
        timestamp: new Date().toISOString(),
      });
    }

    // 自定义指标
    businessMetrics.trackApiCall(path, 'GET', 200, 0);
  }

  /**
   * 追踪用户事件
   */
  static event(name: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined') return;

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', name, properties);
    }

    // Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track(name, {
        ...properties,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 设置用户属性
   */
  static identify(userId: string, traits?: Record<string, any>) {
    if (typeof window === 'undefined') return;

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        user_id: userId,
      });
    }

    // Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.identify(userId);
      if (traits) {
        (window as any).mixpanel.people.set(traits);
      }
    }
  }

  /**
   * 追踪购买事件
   */
  static purchase(
    transactionId: string,
    amount: number,
    currency: string,
    items: Array<{ id: string; name: string; price: number; quantity: number }>
  ) {
    if (typeof window === 'undefined') return;

    // Google Analytics电商事件
    if ((window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: amount,
        currency,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
    }

    // Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track('Purchase', {
        transaction_id: transactionId,
        amount,
        currency,
        items,
        timestamp: new Date().toISOString(),
      });
      
      // 追踪收入
      (window as any).mixpanel.people.track_charge(amount);
    }
  }
}

/**
 * 错误追踪
 */
export class ErrorTracker {
  /**
   * 追踪JavaScript错误
   */
  static trackError(error: Error, context?: Record<string, any>) {
    // Sentry自动处理
    if ((window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: context,
      });
    }

    // 自定义指标
    businessMetrics.trackError(error.name, 'error');
  }

  /**
   * 追踪API错误
   */
  static trackApiError(
    endpoint: string,
    method: string,
    status: number,
    error: any
  ) {
    // Sentry
    if ((window as any).Sentry) {
      (window as any).Sentry.captureMessage(`API Error: ${method} ${endpoint}`, {
        level: 'error',
        extra: {
          endpoint,
          method,
          status,
          error,
        },
      });
    }

    // 自定义指标
    businessMetrics.trackApiCall(endpoint, method, status, 0);
    businessMetrics.trackError('api_error', status >= 500 ? 'critical' : 'warning');
  }
}

/**
 * 性能追踪
 */
export class PerformanceTracker {
  private static marks: Map<string, number> = new Map();

  /**
   * 开始性能标记
   */
  static mark(name: string) {
    if (typeof window === 'undefined') return;
    
    this.marks.set(name, performance.now());
    performance.mark(name);
  }

  /**
   * 测量性能
   */
  static measure(name: string, startMark: string, endMark?: string) {
    if (typeof window === 'undefined') return null;

    const startTime = this.marks.get(startMark);
    if (!startTime) return null;

    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    if (!endTime) return null;

    const duration = endTime - startTime;
    
    performance.measure(name, startMark, endMark);
    
    // 发送到监控
    businessMetrics.trackApiCall(name, 'MEASURE', 200, duration);
    
    return duration;
  }

  /**
   * 追踪资源加载
   */
  static trackResourceTiming() {
    if (typeof window === 'undefined') return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach(resource => {
      const duration = resource.responseEnd - resource.startTime;
      const size = resource.transferSize || 0;
      
      // 按资源类型分类
      let resourceType = 'other';
      if (resource.name.includes('.js')) resourceType = 'script';
      else if (resource.name.includes('.css')) resourceType = 'style';
      else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)/)) resourceType = 'image';
      else if (resource.name.includes('/api/')) resourceType = 'api';
      
      businessMetrics.trackApiCall(
        resourceType,
        'RESOURCE',
        200,
        duration
      );
    });
  }
}

/**
 * 游戏追踪
 */
export class GameTracker {
  /**
   * 追踪游戏开始
   */
  static startGame(gameType: string, stakes: string) {
    UserTracker.event('Game Started', {
      game_type: gameType,
      stakes,
    });
    
    businessMetrics.trackGameStart(gameType);
  }

  /**
   * 追踪游戏结束
   */
  static endGame(
    gameType: string,
    duration: number,
    result: 'win' | 'lose' | 'draw',
    profit: number
  ) {
    UserTracker.event('Game Ended', {
      game_type: gameType,
      duration,
      result,
      profit,
    });
    
    businessMetrics.trackGameEnd(gameType, duration, result);
  }

  /**
   * 追踪手牌
   */
  static playHand(
    position: string,
    action: string,
    potSize: number,
    betSize: number
  ) {
    UserTracker.event('Hand Played', {
      position,
      action,
      pot_size: potSize,
      bet_size: betSize,
    });
    
    businessMetrics.trackHandPlayed(position, action);
  }

  /**
   * 追踪训练
   */
  static completeTraining(
    scenario: string,
    score: number,
    duration: number,
    mistakes: number
  ) {
    UserTracker.event('Training Completed', {
      scenario,
      score,
      duration,
      mistakes,
    });
    
    businessMetrics.trackTrainingSession(scenario, score);
  }
}

/**
 * 初始化追踪
 */
export function initializeTracking() {
  if (typeof window === 'undefined') return;

  // 追踪页面性能
  window.addEventListener('load', () => {
    PerformanceTracker.trackResourceTiming();
  });

  // 追踪未捕获的错误
  window.addEventListener('error', (event) => {
    ErrorTracker.trackError(new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // 追踪Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    ErrorTracker.trackError(new Error(event.reason), {
      type: 'unhandledrejection',
    });
  });

  // 追踪页面可见性变化
  document.addEventListener('visibilitychange', () => {
    UserTracker.event('Visibility Changed', {
      visible: !document.hidden,
    });
  });

  // 追踪页面卸载
  window.addEventListener('beforeunload', () => {
    UserTracker.event('Page Unload', {
      duration: performance.now(),
    });
  });
}