/**
 * Performance Optimization Configuration for PokerIQ Pro AI Training
 * 针对AI训练页面的性能优化配置
 */

// 组件懒加载配置
export const LazyLoadingConfig = {
  // 延迟加载非关键组件
  deferredComponents: [
    'PersonalizedRecommendations', // 个性化推荐可以延迟加载
    'OnboardingTutorial',          // 引导教程按需加载
    'GTOFeedbackPanel'             // GTO反馈面板在需要时加载
  ],
  
  // 预加载关键组件
  preloadComponents: [
    'WelcomeInterface',            // 欢迎界面优先加载
    'QuickTrainingInterface',      // 快速训练界面优先加载
    'TrainingProgressPanel'        // 进展面板优先显示
  ]
};

// 图片优化配置
export const ImageOptimizationConfig = {
  // 使用WebP格式的图片
  formats: ['webp', 'jpg', 'png'],
  
  // 响应式图片尺寸
  sizes: {
    mobile: '(max-width: 768px) 100vw',
    tablet: '(max-width: 1024px) 50vw', 
    desktop: '25vw'
  },
  
  // 图片质量设置
  quality: {
    high: 85,
    medium: 70,
    low: 50
  }
};

// 缓存策略配置
export const CacheConfig = {
  // 静态资源缓存（1小时）
  staticAssets: {
    maxAge: 3600,
    staleWhileRevalidate: 86400
  },
  
  // API数据缓存（5分钟）
  apiData: {
    maxAge: 300,
    staleWhileRevalidate: 600
  },
  
  // 用户技能数据缓存（10分钟）
  skillData: {
    maxAge: 600,
    staleWhileRevalidate: 1200
  }
};

// 代码分割配置
export const CodeSplittingConfig = {
  // 路由级别的代码分割
  routes: [
    '/ai-training',
    '/gto-training', 
    '/skill-test',
    '/analytics'
  ],
  
  // 组件级别的代码分割
  components: {
    // 训练相关组件
    training: [
      'QuickTrainingInterface',
      'TrainingProgressPanel',
      'GTOFeedbackPanel'
    ],
    
    // 分析相关组件
    analytics: [
      'PersonalizedRecommendations',
      'SkillAnalysisChart',
      'PerformanceMetrics'
    ],
    
    // 引导相关组件
    onboarding: [
      'OnboardingTutorial',
      'TaskGuide',
      'FeatureTour'
    ]
  }
};

// 预加载策略
export const PreloadingConfig = {
  // 关键资源预加载
  critical: [
    '/api/user/skills',      // 技能数据
    '/api/training/session', // 训练会话
    '/fonts/inter.woff2'     // 关键字体
  ],
  
  // 预期用户行为预加载
  predictive: [
    '/api/gto/analysis',     // 用户可能需要的GTO分析
    '/api/recommendations',  // 个性化推荐
    '/images/poker-cards'    // 扑克牌图片
  ]
};

// 性能监控配置
export const PerformanceMonitoring = {
  // Core Web Vitals目标
  targets: {
    LCP: 2.5,    // Largest Contentful Paint < 2.5s
    FID: 100,    // First Input Delay < 100ms
    CLS: 0.1,    // Cumulative Layout Shift < 0.1
    TTFB: 800    // Time to First Byte < 800ms
  },
  
  // 关键用户指标
  userMetrics: {
    timeToInteractive: 3000,      // 页面可交互时间 < 3s
    trainingSes1ionStart: 2000,   // 训练开始时间 < 2s  
    gtoFeedbackDisplay: 500,      // GTO反馈显示时间 < 500ms
    skillProgressUpdate: 200      // 技能进展更新 < 200ms
  }
};

// 资源优化配置
export const ResourceOptimization = {
  // CSS优化
  css: {
    minify: true,
    purge: true,
    critical: [
      'layout.css',
      'typography.css',
      'components.css'
    ]
  },
  
  // JavaScript优化
  javascript: {
    minify: true,
    treeshaking: true,
    compression: 'gzip',
    splitChunks: {
      vendor: true,
      commons: true,
      async: true
    }
  },
  
  // 字体优化
  fonts: {
    preload: ['Inter-Regular.woff2', 'Inter-Bold.woff2'],
    display: 'swap',
    subset: 'latin'
  }
};

// 移动端优化配置
export const MobileOptimization = {
  // 触摸优化
  touch: {
    minTouchTargetSize: 44,  // 最小触摸目标尺寸44px
    gestureSupport: true,    // 支持手势操作
    fastClick: true         // 快速点击响应
  },
  
  // 视口优化
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true
  },
  
  // 网络优化
  network: {
    serviceWorker: true,     // 启用Service Worker
    offlineSupport: false,   // 暂不支持离线（训练需要实时数据）
    dataCompression: true    // 数据压缩
  }
};

// 实时性能优化
export const RealTimeOptimization = {
  // WebSocket连接优化
  websocket: {
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000
  },
  
  // 状态更新优化
  stateUpdates: {
    debounceMs: 300,         // 防抖延迟300ms
    batchUpdates: true,      // 批量更新状态
    shouldComponentUpdate: true // 智能组件更新
  },
  
  // 动画优化
  animations: {
    useGPU: true,            // 使用GPU加速
    reducedMotion: true,     // 支持减少动画偏好
    fps: 60                  // 目标帧率60fps
  }
};