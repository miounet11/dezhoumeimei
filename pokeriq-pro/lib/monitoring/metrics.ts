import { createLogger } from '@/lib/logger';

const logger = createLogger('metrics');

/**
 * 性能指标收集器
 */
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, any[]> = new Map();
  private timers: Map<string, number> = new Map();

  private constructor() {
    // 定期上报指标
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), 60000); // 每分钟上报
    }
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * 记录计数指标
   */
  count(name: string, value: number = 1, tags?: Record<string, string>) {
    const metric = {
      type: 'count',
      name,
      value,
      tags,
      timestamp: Date.now(),
    };

    this.addMetric(name, metric);
  }

  /**
   * 记录计量指标
   */
  gauge(name: string, value: number, tags?: Record<string, string>) {
    const metric = {
      type: 'gauge',
      name,
      value,
      tags,
      timestamp: Date.now(),
    };

    this.addMetric(name, metric);
  }

  /**
   * 记录直方图指标
   */
  histogram(name: string, value: number, tags?: Record<string, string>) {
    const metric = {
      type: 'histogram',
      name,
      value,
      tags,
      timestamp: Date.now(),
    };

    this.addMetric(name, metric);
  }

  /**
   * 开始计时
   */
  startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  /**
   * 结束计时并记录
   */
  endTimer(name: string, tags?: Record<string, string>): number | null {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn('Timer not found', { name });
      return null;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    this.histogram(name, duration, tags);
    return duration;
  }

  /**
   * 添加指标到缓冲区
   */
  private addMetric(name: string, metric: any) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // 限制缓冲区大小
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  /**
   * 上报指标
   */
  async flush() {
    if (this.metrics.size === 0) {
      return;
    }

    const metricsData = Array.from(this.metrics.entries()).map(([name, values]) => ({
      name,
      values,
    }));

    this.metrics.clear();

    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics: metricsData }),
      });
    } catch (error) {
      logger.error('Failed to send metrics', { error });
    }
  }

  /**
   * 获取当前指标快照
   */
  getSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {};

    this.metrics.forEach((values, name) => {
      if (values.length === 0) return;

      const latestValue = values[values.length - 1].value;
      const sum = values.reduce((acc, v) => acc + v.value, 0);
      const avg = sum / values.length;
      const max = Math.max(...values.map(v => v.value));
      const min = Math.min(...values.map(v => v.value));

      snapshot[name] = {
        latest: latestValue,
        count: values.length,
        sum,
        avg,
        max,
        min,
      };
    });

    return snapshot;
  }
}

// 导出单例
export const metrics = MetricsCollector.getInstance();

/**
 * 性能监控装饰器
 */
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const metricName = `${target.constructor.name}.${propertyKey}`;
    metrics.startTimer(metricName);

    try {
      const result = await originalMethod.apply(this, args);
      metrics.endTimer(metricName, { status: 'success' });
      return result;
    } catch (error) {
      metrics.endTimer(metricName, { status: 'error' });
      throw error;
    }
  };

  return descriptor;
}

/**
 * Web Vitals 收集
 */
export function collectWebVitals() {
  if (typeof window === 'undefined') return;

  // First Contentful Paint (FCP)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        metrics.histogram('web_vitals.fcp', entry.startTime);
      }
    }
  });

  observer.observe({ entryTypes: ['paint'] });

  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    metrics.histogram('web_vitals.lcp', lastEntry.startTime);
  });

  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fid = entry.processingStart - entry.startTime;
      metrics.histogram('web_vitals.fid', fid);
    }
  });

  fidObserver.observe({ entryTypes: ['first-input'] });

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
    metrics.gauge('web_vitals.cls', clsValue);
  });

  clsObserver.observe({ entryTypes: ['layout-shift'] });

  // Time to First Byte (TTFB)
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.histogram('web_vitals.ttfb', navigation.responseStart - navigation.requestStart);
    }
  });
}

/**
 * 自定义业务指标
 */
export const businessMetrics = {
  // 用户行为
  trackLogin(success: boolean, method: string) {
    metrics.count('user.login', 1, { success: String(success), method });
  },

  trackSignup(success: boolean, source: string) {
    metrics.count('user.signup', 1, { success: String(success), source });
  },

  // 游戏指标
  trackGameStart(gameType: string) {
    metrics.count('game.start', 1, { type: gameType });
  },

  trackGameEnd(gameType: string, duration: number, result: string) {
    metrics.count('game.end', 1, { type: gameType, result });
    metrics.histogram('game.duration', duration, { type: gameType });
  },

  trackHandPlayed(position: string, action: string) {
    metrics.count('hand.played', 1, { position, action });
  },

  // 训练指标
  trackTrainingSession(scenario: string, score: number) {
    metrics.count('training.session', 1, { scenario });
    metrics.histogram('training.score', score, { scenario });
  },

  // API性能
  trackApiCall(endpoint: string, method: string, status: number, duration: number) {
    metrics.count('api.call', 1, { endpoint, method, status: String(status) });
    metrics.histogram('api.duration', duration, { endpoint, method });
  },

  // 错误追踪
  trackError(type: string, severity: string) {
    metrics.count('error', 1, { type, severity });
  },

  // 缓存指标
  trackCacheHit(key: string) {
    metrics.count('cache.hit', 1, { key });
  },

  trackCacheMiss(key: string) {
    metrics.count('cache.miss', 1, { key });
  },
};