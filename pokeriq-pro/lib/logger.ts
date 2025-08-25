import pino from 'pino';

// 判断环境
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

// 日志级别配置
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// 创建logger实例
const logger = pino({
  level: logLevel,
  // 开发环境使用pretty打印
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  // 生产环境使用JSON格式
  ...(isProduction && {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
  // 测试环境静默
  ...(isTest && {
    level: 'silent',
  }),
  // 基础配置
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.VERCEL_GIT_COMMIT_SHA,
  },
  // 序列化配置
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        ...req.headers,
        // 隐藏敏感信息
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
        cookie: req.headers.cookie ? '[REDACTED]' : undefined,
      },
      remoteAddress: req.connection?.remoteAddress,
      remotePort: req.connection?.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders?.(),
    }),
    err: pino.stdSerializers.err,
  },
});

// 创建子logger
export const createLogger = (name: string) => {
  return logger.child({ module: name });
};

// 特定模块的logger
export const authLogger = createLogger('auth');
export const apiLogger = createLogger('api');
export const dbLogger = createLogger('database');
export const wsLogger = createLogger('websocket');
export const paymentLogger = createLogger('payment');
export const gameLogger = createLogger('game');
export const aiLogger = createLogger('ai');

// 性能监控
export const perfLogger = createLogger('performance');

// 安全日志
export const securityLogger = createLogger('security');

// 错误追踪
export const errorLogger = createLogger('error');

// 辅助函数
export const logRequest = (req: any, res: any, responseTime: number) => {
  const level = res.statusCode >= 500 ? 'error' : 
                res.statusCode >= 400 ? 'warn' : 'info';
  
  apiLogger[level]({
    req,
    res,
    responseTime,
    msg: `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`,
  });
};

// 错误日志记录
export const logError = (error: Error, context?: any) => {
  errorLogger.error({
    err: error,
    context,
    msg: error.message,
  });
};

// 安全事件记录
export const logSecurityEvent = (event: string, details?: any) => {
  securityLogger.warn({
    event,
    details,
    timestamp: new Date().toISOString(),
  });
};

// 性能指标记录
export const logPerformance = (metric: string, value: number, unit = 'ms') => {
  perfLogger.info({
    metric,
    value,
    unit,
    timestamp: new Date().toISOString(),
  });
};

// 游戏事件记录
export const logGameEvent = (event: string, gameId: string, playerId: string, data?: any) => {
  gameLogger.info({
    event,
    gameId,
    playerId,
    data,
    timestamp: new Date().toISOString(),
  });
};

// AI决策记录
export const logAIDecision = (gameId: string, action: string, reasoning?: any) => {
  aiLogger.debug({
    gameId,
    action,
    reasoning,
    timestamp: new Date().toISOString(),
  });
};

export default logger;