/**
 * 推荐系统类型定义
 * 高精度个性化训练推荐引擎
 */

// 用户技能画像
export interface UserSkillProfile {
  userId: string;
  skillMetrics: {
    aggression: number;          // 激进度 0-100
    tightness: number;           // 紧密度 0-100
    position: number;            // 位置意识 0-100
    handReading: number;         // 读牌能力 0-100
    mathematical: number;        // 数学能力 0-100
    psychological: number;       // 心理博弈 0-100
  };
  playerType: string;           // TAMS, LAPP等类型
  level: number;               // 技能等级 1-100
  preferences: {
    trainingMode: 'GTO' | 'EXPLOITATIVE' | 'MIXED';
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    sessionDuration: number;   // 偏好的训练时长
    focusAreas: string[];      // 重点关注领域
  };
  weaknesses: string[];        // 技能弱项
  strengths: string[];         // 技能强项
  updatedAt: Date;
}

// 用户行为数据
export interface UserBehaviorData {
  userId: string;
  interactions: {
    sessionId: string;
    scenarioType: string;
    duration: number;
    performance: number;        // 表现评分 0-100
    completion: number;         // 完成度 0-100
    timestamp: Date;
    userActions: ActionData[];
  }[];
  patterns: {
    activeHours: number[];      // 活跃时段
    preferredDifficulty: string;
    sessionFrequency: number;   // 训练频率
    averagePerformance: number;
    improvementRate: number;
  };
}

// 动作数据
export interface ActionData {
  scenarioId: string;
  action: string;
  isCorrect: boolean;
  responseTime: number;
  confidence: number;
}

// 训练内容
export interface TrainingContent {
  id: string;
  type: 'SCENARIO' | 'LESSON' | 'CHALLENGE' | 'REVIEW';
  category: string;            // preflop, flop, turn, river
  difficulty: number;          // 1-10
  tags: string[];
  metadata: {
    skillAreas: string[];      // 涉及的技能领域
    prerequisites: string[];    // 前置条件
    estimatedTime: number;     // 预计时长
    complexity: number;        // 复杂度
  };
  gtoSolution: any;           // GTO解决方案
  learningObjectives: string[];
  adaptiveParameters: {
    difficultyScaling: number;
    hintLevel: number;
    timeConstraint: number;
  };
}

// 推荐请求
export interface RecommendationRequest {
  userId: string;
  context: {
    currentSession?: string;
    recentPerformance?: number[];
    availableTime?: number;     // 可用时间(分钟)
    targetSkills?: string[];    // 目标技能
    excludeContent?: string[];  // 排除内容
  };
  algorithm: 'COLLABORATIVE' | 'CONTENT' | 'DEEP_LEARNING' | 'HYBRID' | 'LEARNING_PATH';
  limit?: number;             // 返回推荐数量
}

// 推荐结果
export interface RecommendationResult {
  contentId: string;
  score: number;              // 推荐分数 0-1
  confidence: number;         // 置信度 0-1
  reasoning: string[];        // 推荐理由
  metadata: {
    algorithm: string;
    factors: {
      similarity?: number;    // 相似度分数
      contentMatch?: number;  // 内容匹配度
      difficultyFit?: number; // 难度匹配度
      novelty?: number;       // 新颖性
      diversity?: number;     // 多样性
    };
    expectedImprovement: number; // 预期提升
    adaptiveLevel: number;       // 自适应等级
  };
}

// 推荐响应
export interface RecommendationResponse {
  userId: string;
  recommendations: RecommendationResult[];
  metadata: {
    algorithm: string;
    totalCandidates: number;
    processingTime: number;   // 处理时间ms
    cacheHit: boolean;
    abTestGroup?: string;
  };
  learningPath?: {
    currentStep: number;
    totalSteps: number;
    progressPercentage: number;
    nextMilestone: string;
  };
  timestamp: Date;
}

// 相似用户
export interface SimilarUser {
  userId: string;
  similarity: number;         // 相似度分数 0-1
  sharedTraits: string[];     // 共同特征
  skillProfile: UserSkillProfile;
}

// 协同过滤参数
export interface CollaborativeFilteringParams {
  method: 'USER_BASED' | 'ITEM_BASED' | 'MATRIX_FACTORIZATION';
  minSimilarity: number;      // 最小相似度阈值
  neighborhoodSize: number;   // 邻域大小
  regularization?: number;    // 正则化参数
}

// 内容推荐参数
export interface ContentFilteringParams {
  weightProfile: {
    skillMatch: number;       // 技能匹配权重
    difficultyFit: number;    // 难度适应权重
    preferences: number;      // 偏好权重
    performance: number;      // 历史表现权重
  };
  adaptiveScaling: boolean;   // 自适应缩放
  diversityBoost: number;     // 多样性增强
}

// 深度学习模型参数
export interface DeepLearningParams {
  modelType: 'TRANSFORMER' | 'LSTM' | 'HYBRID';
  embeddingDim: number;       // 嵌入维度
  sequenceLength: number;     // 序列长度
  attentionHeads?: number;    // 注意力头数
  hiddenSize: number;         // 隐藏层大小
  dropout: number;            // Dropout率
}

// 学习路径节点
export interface LearningPathNode {
  contentId: string;
  position: number;           // 在路径中的位置
  dependencies: string[];     // 依赖的前置内容
  estimatedDuration: number;  // 预计完成时间
  masteryThreshold: number;   // 掌握阈值
  adaptiveParams: {
    minAttempts: number;      // 最少尝试次数
    maxAttempts: number;      // 最多尝试次数
    difficultyAdjustment: number;
  };
}

// 学习路径
export interface LearningPath {
  id: string;
  userId: string;
  name: string;
  description: string;
  targetSkills: string[];
  currentNode: number;
  nodes: LearningPathNode[];
  progress: {
    completedNodes: number;
    totalNodes: number;
    currentMastery: number;   // 当前掌握程度
    estimatedCompletion: Date; // 预计完成时间
  };
  adaptiveHistory: {
    adjustments: Array<{
      nodeId: string;
      adjustment: string;     // difficulty_up, hint_added, etc.
      timestamp: Date;
      reason: string;
    }>;
  };
}

// A/B测试配置
export interface ABTestConfig {
  experimentId: string;
  name: string;
  description: string;
  isActive: boolean;
  trafficAllocation: number;  // 流量分配比例 0-1
  variants: {
    id: string;
    name: string;
    algorithm: string;
    parameters: any;
    trafficPercentage: number;
  }[];
  metrics: string[];          // 评估指标
  startDate: Date;
  endDate?: Date;
}

// 推荐效果评估指标
export interface RecommendationMetrics {
  userId?: string;            // 用户级别指标
  timeRange: {
    start: Date;
    end: Date;
  };
  accuracy: number;           // 准确率
  precision: number;          // 精确率
  recall: number;             // 召回率
  f1Score: number;            // F1分数
  diversity: number;          // 多样性指标
  novelty: number;            // 新颖性指标
  coverage: number;           // 覆盖率
  clickThroughRate: number;   // 点击率
  engagementRate: number;     // 参与率
  completionRate: number;     // 完成率
  averageRating: number;      // 平均评分
  userSatisfaction: number;   // 用户满意度
  responseTime: number;       // 平均响应时间
}

// 实时推荐配置
export interface RealTimeConfig {
  enableRealTime: boolean;
  updateInterval: number;     // 更新间隔(ms)
  batchSize: number;         // 批处理大小
  cacheConfig: {
    enabled: boolean;
    ttl: number;             // 缓存时间(秒)
    maxSize: number;         // 最大缓存条目
    strategy: 'LRU' | 'LFU' | 'TTL';
  };
  performanceThresholds: {
    maxResponseTime: number;  // 最大响应时间(ms)
    maxCpuUsage: number;     // 最大CPU使用率
    maxMemoryUsage: number;  // 最大内存使用率
  };
}

// 模型训练配置
export interface ModelTrainingConfig {
  dataSource: {
    userBehavior: string;     // 用户行为数据源
    contentMetadata: string;  // 内容元数据源
    interactions: string;     // 交互数据源
  };
  featureEngineering: {
    userFeatures: string[];   // 用户特征
    itemFeatures: string[];   // 物品特征
    contextFeatures: string[]; // 上下文特征
    sequenceFeatures: string[]; // 序列特征
  };
  modelParams: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    validationSplit: number;
    earlyStoppingPatience: number;
  };
  optimization: {
    optimizer: 'ADAM' | 'SGD' | 'ADAMW';
    lossFunction: string;
    metrics: string[];
    regularization: {
      l1: number;
      l2: number;
      dropout: number;
    };
  };
}

// 错误类型
export interface RecommendationError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  requestId?: string;
}