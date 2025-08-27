/**
 * 个性化系统配置管理
 * 环境特定设置、功能标志和A/B测试配置
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize: number;
  connectionTimeout: number;
  queryTimeout: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  cluster?: boolean;
  nodes?: Array<{ host: string; port: number }>;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
}

export interface CacheConfig {
  enableL1Cache: boolean;
  enableL2Cache: boolean;
  l1MaxSize: number;
  l1TTL: number;
  l2TTL: number;
  compressionEnabled: boolean;
  compressionThreshold: number;
  prefetchEnabled: boolean;
  prefetchThreshold: number;
}

export interface AlgorithmConfig {
  collaborative: {
    enabled: boolean;
    weight: number;
    minRatings: number;
    neighborhoodSize: number;
    similarityThreshold: number;
  };
  contentBased: {
    enabled: boolean;
    weight: number;
    featureDimensions: number;
    decayFactor: number;
    updateFrequency: number;
  };
  hybrid: {
    enabled: boolean;
    cfWeight: number;
    cbWeight: number;
    switchingThreshold: number;
    adaptiveWeighting: boolean;
  };
  deepLearning: {
    enabled: boolean;
    modelPath: string;
    batchSize: number;
    embeddingDim: number;
    hiddenLayers: number[];
    learningRate: number;
    epochs: number;
  };
}

export interface RecommendationConfig {
  maxRecommendations: number;
  minScore: number;
  diversityWeight: number;
  noveltyWeight: number;
  popularityWeight: number;
  timeDecayFactor: number;
  contextualFactors: string[];
  fallbackStrategy: 'popular' | 'random' | 'collaborative';
}

export interface UserProfilingConfig {
  updateFrequency: 'realtime' | 'hourly' | 'daily';
  coldStartThreshold: number;
  profileExpiry: number;
  weightedScoring: boolean;
  skillDimensions: Array<{
    name: string;
    weight: number;
    decayRate: number;
  }>;
  learningStyleFactors: Array<{
    name: string;
    weight: number;
    indicators: string[];
  }>;
}

export interface MetricsConfig {
  enabledMetrics: string[];
  retentionPeriod: number;
  aggregationIntervals: number[];
  realTimeEnabled: boolean;
  batchSize: number;
  flushInterval: number;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    cacheHitRate: number;
    userEngagement: number;
  };
}

export interface FeatureFlags {
  // 核心功能开关
  personalizedRecommendations: boolean;
  adaptiveDifficulty: boolean;
  learningPathOptimization: boolean;
  realTimeUpdates: boolean;
  
  // 实验性功能
  deepLearningRecommendations: boolean;
  crossDomainPersonalization: boolean;
  multiModalRecommendations: boolean;
  socialRecommendations: boolean;
  
  // A/B测试功能
  newAlgorithmTest: boolean;
  enhancedUITest: boolean;
  gamificationTest: boolean;
  
  // 性能优化
  aggressiveCaching: boolean;
  predictivePrefetching: boolean;
  bundleOptimization: boolean;
  
  // 监控和调试
  detailedLogging: boolean;
  performanceTracking: boolean;
  userBehaviorAnalytics: boolean;
}

export interface ABTestConfig {
  experiments: Record<string, {
    enabled: boolean;
    trafficAllocation: number;
    variants: Record<string, {
      weight: number;
      config: any;
    }>;
    targetAudience?: {
      userSegments?: string[];
      geolocation?: string[];
      deviceTypes?: string[];
    };
    duration: {
      start: string;
      end: string;
    };
    successMetrics: string[];
  }>;
}

export interface SecurityConfig {
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
    skipSuccessfulRequests: boolean;
  };
  dataPrivacy: {
    anonymizeUserData: boolean;
    dataRetentionDays: number;
    allowDataExport: boolean;
    requireConsent: boolean;
  };
  accessControl: {
    requireAuthentication: boolean;
    allowedRoles: string[];
    resourcePermissions: Record<string, string[]>;
  };
}

export interface PersonalizationConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  
  // 数据库配置
  database: DatabaseConfig;
  redis: RedisConfig;
  
  // 缓存配置
  cache: CacheConfig;
  
  // 算法配置
  algorithms: AlgorithmConfig;
  
  // 推荐配置
  recommendations: RecommendationConfig;
  
  // 用户画像配置
  userProfiling: UserProfilingConfig;
  
  // 监控配置
  metrics: MetricsConfig;
  
  // 功能标志
  features: FeatureFlags;
  
  // A/B测试配置
  abTests: ABTestConfig;
  
  // 安全配置
  security: SecurityConfig;
  
  // 性能配置
  performance: {
    apiTimeout: number;
    retryAttempts: number;
    concurrentRequests: number;
    memoryLimit: number;
    cpuThreshold: number;
  };
  
  // 日志配置
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableFile: boolean;
    enableRemote: boolean;
    format: 'json' | 'text';
    maxFileSize: string;
    maxFiles: number;
  };
}

/**
 * 默认配置
 */
const defaultConfig: PersonalizationConfig = {
  environment: 'development',
  version: '1.0.0',
  
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'pokeriq_personalization',
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    ssl: process.env.NODE_ENV === 'production',
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
    connectionTimeout: 30000,
    queryTimeout: 60000
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_PERSONALIZATION_DB || '0'),
    cluster: process.env.REDIS_CLUSTER === 'true',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  },
  
  cache: {
    enableL1Cache: true,
    enableL2Cache: true,
    l1MaxSize: 1000,
    l1TTL: 300000, // 5分钟
    l2TTL: 1800, // 30分钟
    compressionEnabled: true,
    compressionThreshold: 1024, // 1KB
    prefetchEnabled: true,
    prefetchThreshold: 0.7
  },
  
  algorithms: {
    collaborative: {
      enabled: true,
      weight: 0.4,
      minRatings: 5,
      neighborhoodSize: 50,
      similarityThreshold: 0.1
    },
    contentBased: {
      enabled: true,
      weight: 0.35,
      featureDimensions: 100,
      decayFactor: 0.95,
      updateFrequency: 24 // 小时
    },
    hybrid: {
      enabled: true,
      cfWeight: 0.6,
      cbWeight: 0.4,
      switchingThreshold: 10,
      adaptiveWeighting: true
    },
    deepLearning: {
      enabled: false,
      modelPath: '/models/personalization',
      batchSize: 128,
      embeddingDim: 64,
      hiddenLayers: [256, 128, 64],
      learningRate: 0.001,
      epochs: 100
    }
  },
  
  recommendations: {
    maxRecommendations: 20,
    minScore: 0.1,
    diversityWeight: 0.3,
    noveltyWeight: 0.2,
    popularityWeight: 0.1,
    timeDecayFactor: 0.9,
    contextualFactors: ['time_of_day', 'session_length', 'skill_level'],
    fallbackStrategy: 'popular'
  },
  
  userProfiling: {
    updateFrequency: 'realtime',
    coldStartThreshold: 3,
    profileExpiry: 90 * 24 * 3600, // 90天
    weightedScoring: true,
    skillDimensions: [
      { name: 'preflop', weight: 1.0, decayRate: 0.95 },
      { name: 'postflop', weight: 1.2, decayRate: 0.92 },
      { name: 'psychology', weight: 0.8, decayRate: 0.90 },
      { name: 'mathematics', weight: 1.0, decayRate: 0.98 },
      { name: 'bankroll', weight: 0.6, decayRate: 0.99 }
    ],
    learningStyleFactors: [
      {
        name: 'visual',
        weight: 1.0,
        indicators: ['image_interactions', 'chart_views', 'video_engagement']
      },
      {
        name: 'practical',
        weight: 1.1,
        indicators: ['hands_played', 'training_completions', 'interactive_exercises']
      },
      {
        name: 'theoretical',
        weight: 0.9,
        indicators: ['article_reads', 'concept_reviews', 'theory_assessments']
      }
    ]
  },
  
  metrics: {
    enabledMetrics: [
      'user_interactions',
      'recommendation_accuracy',
      'system_performance',
      'user_engagement',
      'algorithm_performance'
    ],
    retentionPeriod: 90, // 天
    aggregationIntervals: [3600, 86400, 604800], // 1小时，1天，1周
    realTimeEnabled: true,
    batchSize: 100,
    flushInterval: 30000, // 30秒
    alertThresholds: {
      errorRate: 0.05,
      responseTime: 2000, // 毫秒
      cacheHitRate: 0.5,
      userEngagement: 0.3
    }
  },
  
  features: {
    // 核心功能
    personalizedRecommendations: true,
    adaptiveDifficulty: true,
    learningPathOptimization: true,
    realTimeUpdates: true,
    
    // 实验性功能
    deepLearningRecommendations: false,
    crossDomainPersonalization: false,
    multiModalRecommendations: false,
    socialRecommendations: false,
    
    // A/B测试功能
    newAlgorithmTest: false,
    enhancedUITest: false,
    gamificationTest: false,
    
    // 性能优化
    aggressiveCaching: process.env.NODE_ENV === 'production',
    predictivePrefetching: true,
    bundleOptimization: process.env.NODE_ENV === 'production',
    
    // 监控和调试
    detailedLogging: process.env.NODE_ENV !== 'production',
    performanceTracking: true,
    userBehaviorAnalytics: true
  },
  
  abTests: {
    experiments: {
      'recommendation-algorithm-v2': {
        enabled: false,
        trafficAllocation: 0.1,
        variants: {
          control: { weight: 0.5, config: { algorithm: 'hybrid' } },
          treatment: { weight: 0.5, config: { algorithm: 'deep_learning' } }
        },
        duration: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-02-01T00:00:00Z'
        },
        successMetrics: ['click_through_rate', 'user_satisfaction', 'engagement_time']
      },
      'ui-enhancement': {
        enabled: false,
        trafficAllocation: 0.2,
        variants: {
          current: { weight: 0.5, config: { ui_version: 'v1' } },
          enhanced: { weight: 0.5, config: { ui_version: 'v2' } }
        },
        targetAudience: {
          userSegments: ['intermediate', 'advanced'],
          deviceTypes: ['desktop', 'tablet']
        },
        duration: {
          start: '2024-01-15T00:00:00Z',
          end: '2024-02-15T00:00:00Z'
        },
        successMetrics: ['conversion_rate', 'user_retention', 'feature_adoption']
      }
    }
  },
  
  security: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 100,
      burstLimit: 200,
      skipSuccessfulRequests: false
    },
    dataPrivacy: {
      anonymizeUserData: process.env.NODE_ENV === 'production',
      dataRetentionDays: 365,
      allowDataExport: true,
      requireConsent: true
    },
    accessControl: {
      requireAuthentication: true,
      allowedRoles: ['user', 'premium', 'admin'],
      resourcePermissions: {
        'recommendations': ['user', 'premium', 'admin'],
        'advanced_analytics': ['premium', 'admin'],
        'admin_controls': ['admin']
      }
    }
  },
  
  performance: {
    apiTimeout: 30000, // 30秒
    retryAttempts: 3,
    concurrentRequests: 100,
    memoryLimit: 512, // MB
    cpuThreshold: 80 // 百分比
  },
  
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production',
    enableRemote: process.env.NODE_ENV === 'production',
    format: 'json',
    maxFileSize: '10MB',
    maxFiles: 5
  }
};

/**
 * 环境特定配置
 */
const environmentConfigs: Record<string, Partial<PersonalizationConfig>> = {
  development: {
    features: {
      ...defaultConfig.features,
      detailedLogging: true,
      performanceTracking: false,
      aggressiveCaching: false
    },
    metrics: {
      ...defaultConfig.metrics,
      realTimeEnabled: false,
      batchSize: 10
    },
    logging: {
      ...defaultConfig.logging,
      level: 'debug',
      enableFile: false,
      enableRemote: false
    }
  },
  
  staging: {
    features: {
      ...defaultConfig.features,
      deepLearningRecommendations: true,
      newAlgorithmTest: true,
      enhancedUITest: true
    },
    abTests: {
      experiments: {
        'recommendation-algorithm-v2': {
          enabled: true,
          trafficAllocation: 0.3,
          variants: {
            control: { weight: 0.5, config: { algorithm: 'hybrid' } },
            treatment: { weight: 0.5, config: { algorithm: 'deep_learning' } }
          },
          duration: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-03-01T00:00:00Z'
          },
          successMetrics: ['click_through_rate', 'user_satisfaction']
        }
      }
    },
    logging: {
      ...defaultConfig.logging,
      level: 'info',
      enableRemote: true
    }
  },
  
  production: {
    cache: {
      ...defaultConfig.cache,
      l1MaxSize: 5000,
      l1TTL: 600000, // 10分钟
      l2TTL: 3600 // 1小时
    },
    performance: {
      ...defaultConfig.performance,
      concurrentRequests: 500,
      memoryLimit: 1024
    },
    features: {
      ...defaultConfig.features,
      detailedLogging: false,
      aggressiveCaching: true,
      bundleOptimization: true
    },
    security: {
      ...defaultConfig.security,
      dataPrivacy: {
        ...defaultConfig.security.dataPrivacy,
        anonymizeUserData: true
      }
    },
    logging: {
      ...defaultConfig.logging,
      level: 'warn',
      enableConsole: false,
      enableFile: true,
      enableRemote: true
    }
  }
};

/**
 * 配置管理类
 */
export class PersonalizationConfigManager {
  private config: PersonalizationConfig;
  private watchers: Array<(config: PersonalizationConfig) => void> = [];

  constructor(environment?: string) {
    const env = environment || process.env.NODE_ENV || 'development';
    this.config = this.buildConfig(env);
  }

  /**
   * 构建最终配置
   */
  private buildConfig(environment: string): PersonalizationConfig {
    const envConfig = environmentConfigs[environment] || {};
    return this.deepMerge(defaultConfig, envConfig) as PersonalizationConfig;
  }

  /**
   * 深度合并配置对象
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * 获取完整配置
   */
  public getConfig(): PersonalizationConfig {
    return { ...this.config };
  }

  /**
   * 获取特定配置项
   */
  public get<T extends keyof PersonalizationConfig>(key: T): PersonalizationConfig[T] {
    return this.config[key];
  }

  /**
   * 获取嵌套配置项
   */
  public getNested<T>(path: string): T | undefined {
    return path.split('.').reduce((obj: any, key) => obj?.[key], this.config) as T;
  }

  /**
   * 检查功能标志
   */
  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature];
  }

  /**
   * 获取A/B测试配置
   */
  public getExperiment(experimentName: string): ABTestConfig['experiments'][string] | undefined {
    return this.config.abTests.experiments[experimentName];
  }

  /**
   * 检查A/B测试是否启用
   */
  public isExperimentEnabled(experimentName: string): boolean {
    const experiment = this.getExperiment(experimentName);
    return experiment?.enabled || false;
  }

  /**
   * 获取A/B测试变体
   */
  public getExperimentVariant(experimentName: string, userId: string): string | null {
    const experiment = this.getExperiment(experimentName);
    if (!experiment || !experiment.enabled) {
      return null;
    }

    // 简单的哈希分配逻辑
    const hash = this.hashUserId(userId);
    const threshold = experiment.trafficAllocation;
    
    if (hash > threshold) {
      return null; // 用户不在实验中
    }

    // 在实验中，分配变体
    const variants = Object.entries(experiment.variants);
    const totalWeight = variants.reduce((sum, [_, variant]) => sum + variant.weight, 0);
    
    let cumulativeWeight = 0;
    const variantThreshold = hash / threshold; // 重新映射到0-1范围
    
    for (const [variantName, variant] of variants) {
      cumulativeWeight += variant.weight / totalWeight;
      if (variantThreshold <= cumulativeWeight) {
        return variantName;
      }
    }

    return variants[0][0]; // 默认返回第一个变体
  }

  /**
   * 简单的用户ID哈希函数
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash) / 2147483647; // 归一化到0-1
  }

  /**
   * 动态更新配置
   */
  public updateConfig(updates: Partial<PersonalizationConfig>): void {
    this.config = this.deepMerge(this.config, updates);
    this.notifyWatchers();
  }

  /**
   * 更新功能标志
   */
  public updateFeatureFlag(feature: keyof FeatureFlags, enabled: boolean): void {
    this.config.features[feature] = enabled;
    this.notifyWatchers();
  }

  /**
   * 注册配置变化监听器
   */
  public watch(callback: (config: PersonalizationConfig) => void): () => void {
    this.watchers.push(callback);
    
    // 返回取消监听的函数
    return () => {
      const index = this.watchers.indexOf(callback);
      if (index > -1) {
        this.watchers.splice(index, 1);
      }
    };
  }

  /**
   * 通知配置变化
   */
  private notifyWatchers(): void {
    for (const watcher of this.watchers) {
      try {
        watcher(this.getConfig());
      } catch (error) {
        console.error('Config watcher error:', error);
      }
    }
  }

  /**
   * 验证配置
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证数据库配置
    if (!this.config.database.host) {
      errors.push('Database host is required');
    }
    if (!this.config.database.username) {
      errors.push('Database username is required');
    }

    // 验证Redis配置
    if (!this.config.redis.host) {
      errors.push('Redis host is required');
    }

    // 验证算法权重
    const totalWeight = this.config.algorithms.collaborative.weight + 
                       this.config.algorithms.contentBased.weight;
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push('Algorithm weights should sum to 1.0');
    }

    // 验证A/B测试配置
    for (const [expName, experiment] of Object.entries(this.config.abTests.experiments)) {
      const totalVariantWeight = Object.values(experiment.variants)
        .reduce((sum, variant) => sum + variant.weight, 0);
      if (Math.abs(totalVariantWeight - 1.0) > 0.01) {
        errors.push(`Experiment ${expName} variant weights should sum to 1.0`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 导出配置为JSON
   */
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 从JSON导入配置
   */
  public importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = importedConfig;
      this.notifyWatchers();
    } catch (error) {
      throw new Error('Invalid config JSON format');
    }
  }
}

// 全局配置管理器实例
let globalConfigManager: PersonalizationConfigManager;

/**
 * 获取全局配置管理器
 */
export function getPersonalizationConfig(environment?: string): PersonalizationConfigManager {
  if (!globalConfigManager) {
    globalConfigManager = new PersonalizationConfigManager(environment);
  }
  return globalConfigManager;
}

/**
 * 创建新的配置管理器实例
 */
export function createPersonalizationConfig(environment?: string): PersonalizationConfigManager {
  return new PersonalizationConfigManager(environment);
}

// 导出默认配置和类型
export { defaultConfig };
export default PersonalizationConfigManager;