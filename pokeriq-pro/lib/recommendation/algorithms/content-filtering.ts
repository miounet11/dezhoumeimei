/**
 * 内容推荐引擎
 * 基于技能匹配和内容特征的推荐算法
 */

import {
  UserSkillProfile,
  UserBehaviorData,
  TrainingContent,
  RecommendationRequest,
  RecommendationResult,
  ContentFilteringParams
} from '../types';
import { logger } from '@/lib/logger';

export class ContentFilteringEngine {
  private contentVectorCache: Map<string, number[]>;
  private userVectorCache: Map<string, number[]>;
  private skillWeights: Map<string, number>;
  private lastCacheUpdate: Date;

  constructor() {
    this.contentVectorCache = new Map();
    this.userVectorCache = new Map();
    this.skillWeights = new Map();
    this.lastCacheUpdate = new Date(0);
    this.initializeSkillWeights();
  }

  /**
   * 内容推荐
   */
  async recommend(
    userProfile: UserSkillProfile,
    behaviorData: UserBehaviorData,
    availableContent: TrainingContent[],
    request: RecommendationRequest
  ): Promise<RecommendationResult[]> {
    logger.info('开始内容推荐', { userId: userProfile.userId });

    try {
      // 获取推荐参数
      const params = this.getContentFilteringParams(request);

      // 构建用户特征向量
      const userVector = await this.buildUserVector(userProfile, behaviorData);

      // 为每个可用内容计算推荐分数
      const recommendations: RecommendationResult[] = [];

      for (const content of availableContent) {
        // 跳过用户已交互的内容（除非在复习模式下）
        if (this.hasUserInteractedWith(userProfile.userId, content.id, behaviorData) && 
            !this.isReviewMode(request)) {
          continue;
        }

        // 构建内容特征向量
        const contentVector = await this.buildContentVector(content);

        // 计算匹配分数
        const matchScore = this.calculateContentMatch(
          userVector, contentVector, userProfile, content, params
        );

        if (matchScore > 0.3) { // 最低匹配阈值
          const recommendation = await this.buildRecommendationResult(
            content, userProfile, behaviorData, matchScore, params
          );
          recommendations.push(recommendation);
        }
      }

      // 应用多样性和自适应调整
      const adjustedRecommendations = await this.applyContentOptimizations(
        recommendations, userProfile, behaviorData, params
      );

      logger.info('内容推荐完成', {
        userId: userProfile.userId,
        recommendationCount: adjustedRecommendations.length
      });

      return adjustedRecommendations.sort((a, b) => b.score - a.score);

    } catch (error) {
      logger.error('内容推荐失败', {
        userId: userProfile.userId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * 构建用户特征向量
   */
  private async buildUserVector(
    userProfile: UserSkillProfile,
    behaviorData: UserBehaviorData
  ): Promise<number[]> {
    
    // 检查缓存
    const cached = this.userVectorCache.get(userProfile.userId);
    if (cached && this.isCacheValid()) {
      return cached;
    }

    const vector: number[] = [];

    // 1. 技能指标 (6维)
    vector.push(
      userProfile.skillMetrics.aggression / 100,
      userProfile.skillMetrics.tightness / 100,
      userProfile.skillMetrics.position / 100,
      userProfile.skillMetrics.handReading / 100,
      userProfile.skillMetrics.mathematical / 100,
      userProfile.skillMetrics.psychological / 100
    );

    // 2. 用户等级 (1维)
    vector.push(userProfile.level / 100);

    // 3. 偏好特征 (4维)
    const trainingModeMap = { 'GTO': 1, 'EXPLOITATIVE': 2, 'MIXED': 3 };
    const difficultyMap = { 'BEGINNER': 1, 'INTERMEDIATE': 2, 'ADVANCED': 3, 'EXPERT': 4 };
    
    vector.push(
      trainingModeMap[userProfile.preferences.trainingMode] / 3,
      difficultyMap[userProfile.preferences.difficulty] / 4,
      Math.min(1, userProfile.preferences.sessionDuration / 120), // 标准化到2小时
      userProfile.preferences.focusAreas.length / 10 // 假设最多10个关注领域
    );

    // 4. 行为特征 (5维)
    const avgPerformance = behaviorData.patterns.averagePerformance / 100;
    const improvementRate = Math.min(1, Math.max(-1, behaviorData.patterns.improvementRate));
    const sessionFrequency = Math.min(1, behaviorData.patterns.sessionFrequency / 7); // 标准化到每周7次
    const avgSessionDuration = behaviorData.interactions.length > 0 ? 
      behaviorData.interactions.reduce((sum, i) => sum + i.duration, 0) / behaviorData.interactions.length / 3600 : 0.5; // 标准化到小时
    const recentActivity = this.calculateRecentActivityScore(behaviorData);

    vector.push(
      avgPerformance,
      (improvementRate + 1) / 2, // 转换到0-1范围
      sessionFrequency,
      Math.min(1, avgSessionDuration),
      recentActivity
    );

    // 5. 技能弱项和强项 (动态维度)
    const allSkills = ['aggression', 'tightness', 'position', 'handReading', 'mathematical', 'psychological'];
    for (const skill of allSkills) {
      const isWeakness = userProfile.weaknesses.includes(skill) ? 1 : 0;
      const isStrength = userProfile.strengths.includes(skill) ? 1 : 0;
      vector.push(isWeakness, isStrength);
    }

    // 6. 最近表现趋势 (3维)
    const recentPerformance = this.calculateRecentPerformanceTrend(behaviorData);
    vector.push(...recentPerformance);

    // 7. 时段偏好 (24维，每小时一维)
    const hourlyPreference = new Array(24).fill(0);
    behaviorData.patterns.activeHours.forEach(hour => {
      if (hour >= 0 && hour < 24) {
        hourlyPreference[hour] = 1;
      }
    });
    vector.push(...hourlyPreference.map(h => h));

    // 缓存结果
    this.userVectorCache.set(userProfile.userId, vector);
    
    return vector;
  }

  /**
   * 构建内容特征向量
   */
  private async buildContentVector(content: TrainingContent): Promise<number[]> {
    // 检查缓存
    const cached = this.contentVectorCache.get(content.id);
    if (cached && this.isCacheValid()) {
      return cached;
    }

    const vector: number[] = [];

    // 1. 基础属性 (3维)
    const typeMap = { 'SCENARIO': 1, 'LESSON': 2, 'CHALLENGE': 3, 'REVIEW': 4 };
    vector.push(
      typeMap[content.type] / 4,
      content.difficulty / 10,
      Math.min(1, content.metadata.estimatedTime / 120) // 标准化到2小时
    );

    // 2. 分类特征 (4维)
    const categoryMap = { 'preflop': 1, 'flop': 2, 'turn': 3, 'river': 4 };
    const categoryScore = categoryMap[content.category] || 2.5;
    vector.push(categoryScore / 4);

    // 复杂度
    vector.push(content.metadata.complexity / 10);

    // 前置条件数量
    vector.push(Math.min(1, content.metadata.prerequisites.length / 5));

    // 学习目标数量
    vector.push(Math.min(1, content.learningObjectives.length / 10));

    // 3. 技能领域覆盖 (12维，每个技能2维：是否涉及+权重)
    const allSkills = ['aggression', 'tightness', 'position', 'handReading', 'mathematical', 'psychological'];
    for (const skill of allSkills) {
      const isInvolved = content.metadata.skillAreas.includes(skill) ? 1 : 0;
      const weight = this.skillWeights.get(skill) || 0.5;
      vector.push(isInvolved, weight);
    }

    // 4. 标签特征 (使用TF-IDF风格的编码)
    const tagVector = this.encodeTagsVector(content.tags);
    vector.push(...tagVector);

    // 5. 自适应参数 (3维)
    vector.push(
      content.adaptiveParameters.difficultyScaling / 5, // 假设最大为5
      content.adaptiveParameters.hintLevel / 10, // 假设最大为10
      Math.min(1, content.adaptiveParameters.timeConstraint / 3600) // 标准化到1小时
    );

    // 6. GTO解决方案复杂度 (1维)
    const gtoComplexity = this.calculateGTOComplexity(content.gtoSolution);
    vector.push(gtoComplexity);

    // 缓存结果
    this.contentVectorCache.set(content.id, vector);
    
    return vector;
  }

  /**
   * 计算内容匹配分数
   */
  private calculateContentMatch(
    userVector: number[],
    contentVector: number[],
    userProfile: UserSkillProfile,
    content: TrainingContent,
    params: ContentFilteringParams
  ): number {
    
    // 1. 基础向量相似度（余弦相似度）
    const vectorSimilarity = this.cosineSimilarity(userVector, contentVector);

    // 2. 技能匹配度
    const skillMatch = this.calculateSkillMatch(userProfile, content);

    // 3. 难度匹配度
    const difficultyFit = this.calculateDifficultyFit(userProfile, content);

    // 4. 偏好匹配度
    const preferenceMatch = this.calculatePreferenceMatch(userProfile, content);

    // 5. 学习目标匹配度
    const objectiveMatch = this.calculateObjectiveMatch(userProfile, content);

    // 根据权重融合各项分数
    const weightedScore = (
      vectorSimilarity * params.weightProfile.skillMatch +
      skillMatch * params.weightProfile.skillMatch +
      difficultyFit * params.weightProfile.difficultyFit +
      preferenceMatch * params.weightProfile.preferences +
      objectiveMatch * 0.1 // 固定较低权重
    ) / (params.weightProfile.skillMatch * 2 + 
         params.weightProfile.difficultyFit + 
         params.weightProfile.preferences + 0.1);

    // 自适应缩放
    if (params.adaptiveScaling) {
      const adaptiveBoost = this.calculateAdaptiveBoost(userProfile, content);
      return Math.min(1, weightedScore + adaptiveBoost);
    }

    return Math.min(1, weightedScore);
  }

  /**
   * 计算技能匹配度
   */
  private calculateSkillMatch(userProfile: UserSkillProfile, content: TrainingContent): number {
    if (content.metadata.skillAreas.length === 0) return 0.5;

    let totalMatch = 0;
    let totalWeight = 0;

    for (const skillArea of content.metadata.skillAreas) {
      let skillScore = 0;
      
      // 检查是否是用户弱项（需要提升的技能）
      if (userProfile.weaknesses.includes(skillArea)) {
        skillScore += 0.8; // 高权重，因为用户需要这个技能
      }
      
      // 检查是否在用户关注领域
      if (userProfile.preferences.focusAreas.includes(skillArea)) {
        skillScore += 0.6;
      }
      
      // 根据用户当前技能水平调整
      const currentSkillLevel = this.getUserSkillLevel(userProfile, skillArea);
      const contentDifficulty = content.difficulty / 10;
      
      // 最优匹配是略高于当前水平
      const optimalGap = 0.1; // 10%提升
      const actualGap = Math.abs(contentDifficulty - currentSkillLevel);
      const gapScore = Math.max(0, 1 - actualGap / 0.3); // 30%差距内都有效
      
      skillScore = Math.max(skillScore, gapScore);
      
      totalMatch += skillScore;
      totalWeight += 1;
    }

    return totalWeight > 0 ? totalMatch / totalWeight : 0;
  }

  /**
   * 计算难度匹配度
   */
  private calculateDifficultyFit(userProfile: UserSkillProfile, content: TrainingContent): number {
    const userLevel = userProfile.level / 100; // 标准化到0-1
    const contentDifficulty = content.difficulty / 10; // 标准化到0-1

    // 最优难度应该比用户当前水平稍高一点（Zone of Proximal Development）
    const optimalDifficulty = userLevel + 0.1; // 提高10%
    const difficultyGap = Math.abs(contentDifficulty - optimalDifficulty);

    // 使用高斯函数计算匹配度
    const sigma = 0.15; // 标准差，控制难度容忍度
    const difficultyFit = Math.exp(-(difficultyGap * difficultyGap) / (2 * sigma * sigma));

    return difficultyFit;
  }

  /**
   * 计算偏好匹配度
   */
  private calculatePreferenceMatch(userProfile: UserSkillProfile, content: TrainingContent): number {
    let preferenceScore = 0;
    let totalFactors = 0;

    // 训练模式匹配
    const trainingModeMatch = this.getTrainingModeMatch(
      userProfile.preferences.trainingMode, content
    );
    preferenceScore += trainingModeMatch;
    totalFactors += 1;

    // 时长偏好匹配
    const durationMatch = this.getDurationMatch(
      userProfile.preferences.sessionDuration, content.metadata.estimatedTime
    );
    preferenceScore += durationMatch;
    totalFactors += 1;

    // 内容类型偏好（基于历史行为）
    const typePreference = this.getContentTypePreference(userProfile, content.type);
    preferenceScore += typePreference;
    totalFactors += 1;

    return totalFactors > 0 ? preferenceScore / totalFactors : 0.5;
  }

  /**
   * 计算学习目标匹配度
   */
  private calculateObjectiveMatch(userProfile: UserSkillProfile, content: TrainingContent): number {
    if (content.learningObjectives.length === 0) return 0.5;

    const userGoals = [
      ...userProfile.weaknesses.map(w => `improve_${w}`),
      ...userProfile.preferences.focusAreas.map(f => `focus_${f}`)
    ];

    if (userGoals.length === 0) return 0.5;

    // 计算学习目标与用户目标的重叠度
    let matchCount = 0;
    for (const objective of content.learningObjectives) {
      const objectiveLower = objective.toLowerCase();
      for (const goal of userGoals) {
        if (objectiveLower.includes(goal.toLowerCase().replace('_', ' ')) ||
            goal.toLowerCase().includes(objectiveLower)) {
          matchCount++;
          break;
        }
      }
    }

    return matchCount / content.learningObjectives.length;
  }

  /**
   * 计算自适应提升分数
   */
  private calculateAdaptiveBoost(userProfile: UserSkillProfile, content: TrainingContent): number {
    let boost = 0;

    // 基于改进率的提升
    if (userProfile.level < 30) { // 新手用户
      if (content.type === 'LESSON' || content.difficulty <= 3) {
        boost += 0.1;
      }
    } else if (userProfile.level > 80) { // 高级用户
      if (content.type === 'CHALLENGE' && content.difficulty >= 7) {
        boost += 0.1;
      }
    }

    // 基于最近表现的提升
    // 这里需要从behaviorData中获取最近表现，简化实现
    
    // 基于技能不平衡的提升
    const skillImbalance = this.calculateSkillImbalance(userProfile);
    if (skillImbalance > 0.3 && content.metadata.skillAreas.some(skill => 
        userProfile.weaknesses.includes(skill))) {
      boost += 0.15;
    }

    return Math.min(0.3, boost); // 最大提升30%
  }

  /**
   * 应用内容优化
   */
  private async applyContentOptimizations(
    recommendations: RecommendationResult[],
    userProfile: UserSkillProfile,
    behaviorData: UserBehaviorData,
    params: ContentFilteringParams
  ): Promise<RecommendationResult[]> {
    
    let optimized = [...recommendations];

    // 1. 多样性增强
    if (params.diversityBoost > 0) {
      optimized = this.enhanceDiversity(optimized, params.diversityBoost);
    }

    // 2. 新颖性调整
    optimized = await this.adjustForNovelty(optimized, userProfile.userId, behaviorData);

    // 3. 学习序列优化
    optimized = this.optimizeLearningSequence(optimized, userProfile);

    // 4. 时间约束适配
    optimized = this.adaptToTimeConstraints(optimized, userProfile);

    // 5. 性能反馈调整
    optimized = this.adjustBasedOnPerformance(optimized, behaviorData);

    return optimized;
  }

  /**
   * 增强多样性
   */
  private enhanceDiversity(
    recommendations: RecommendationResult[],
    diversityBoost: number
  ): RecommendationResult[] {
    
    // 按类别分组
    const categoryGroups = new Map<string, RecommendationResult[]>();
    recommendations.forEach(rec => {
      const category = this.getContentCategory(rec.contentId);
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(rec);
    });

    // 从每个类别中选择，实现多样性
    const diversified: RecommendationResult[] = [];
    const maxPerCategory = Math.ceil(recommendations.length / categoryGroups.size);
    
    let round = 0;
    while (diversified.length < recommendations.length && round < maxPerCategory) {
      for (const [category, recs] of categoryGroups) {
        if (round < recs.length && diversified.length < recommendations.length) {
          const rec = { ...recs[round] };
          // 应用多样性加成
          rec.score = Math.min(1, rec.score + diversityBoost * 0.1);
          rec.metadata.factors = {
            ...rec.metadata.factors,
            diversity: diversityBoost
          };
          diversified.push(rec);
        }
      }
      round++;
    }

    return diversified;
  }

  /**
   * 新颖性调整
   */
  private async adjustForNovelty(
    recommendations: RecommendationResult[],
    userId: string,
    behaviorData: UserBehaviorData
  ): Promise<RecommendationResult[]> {
    
    const interactedContent = new Set(
      behaviorData.interactions.map(i => i.scenarioType)
    );

    return recommendations.map(rec => {
      const isNovel = !interactedContent.has(rec.contentId);
      const noveltyBoost = isNovel ? 0.05 : -0.02;
      
      return {
        ...rec,
        score: Math.max(0, Math.min(1, rec.score + noveltyBoost)),
        metadata: {
          ...rec.metadata,
          factors: {
            ...rec.metadata.factors,
            novelty: isNovel ? 1 : 0
          }
        }
      };
    });
  }

  /**
   * 优化学习序列
   */
  private optimizeLearningSequence(
    recommendations: RecommendationResult[],
    userProfile: UserSkillProfile
  ): RecommendationResult[] {
    
    // 根据前置条件和难度梯度调整推荐顺序
    return recommendations.map((rec, index) => {
      // 获取内容的前置条件满足情况
      const prerequisitesMet = this.checkPrerequisites(rec.contentId, userProfile);
      
      if (!prerequisitesMet) {
        // 前置条件未满足，降低推荐分数
        rec.score *= 0.7;
        rec.reasoning.push('部分前置条件未满足');
      }

      // 序列位置加成（靠前的推荐稍微加分）
      const positionBoost = Math.max(0, (10 - index) / 100);
      rec.score = Math.min(1, rec.score + positionBoost);

      return rec;
    });
  }

  /**
   * 适配时间约束
   */
  private adaptToTimeConstraints(
    recommendations: RecommendationResult[],
    userProfile: UserSkillProfile
  ): RecommendationResult[] {
    
    const preferredDuration = userProfile.preferences.sessionDuration;
    
    return recommendations.map(rec => {
      const contentDuration = this.getContentDuration(rec.contentId);
      const durationMatch = this.getDurationMatch(preferredDuration, contentDuration);
      
      // 根据时间匹配度调整分数
      const timeBoost = (durationMatch - 0.5) * 0.1; // -0.05 to +0.05
      rec.score = Math.max(0, Math.min(1, rec.score + timeBoost));
      
      rec.metadata.factors = {
        ...rec.metadata.factors,
        timeMatch: durationMatch
      };
      
      return rec;
    });
  }

  /**
   * 基于性能反馈调整
   */
  private adjustBasedOnPerformance(
    recommendations: RecommendationResult[],
    behaviorData: UserBehaviorData
  ): RecommendationResult[] {
    
    const avgPerformance = behaviorData.patterns.averagePerformance;
    const improvementRate = behaviorData.patterns.improvementRate;
    
    return recommendations.map(rec => {
      let performanceBoost = 0;
      
      // 如果用户最近表现不好，推荐更容易的内容
      if (avgPerformance < 60) {
        const contentDifficulty = this.getContentDifficulty(rec.contentId);
        if (contentDifficulty < 5) {
          performanceBoost += 0.1;
        }
      }
      
      // 如果用户在快速进步，可以推荐更有挑战性的内容
      if (improvementRate > 0.1) {
        const contentDifficulty = this.getContentDifficulty(rec.contentId);
        if (contentDifficulty >= 6) {
          performanceBoost += 0.05;
        }
      }
      
      rec.score = Math.max(0, Math.min(1, rec.score + performanceBoost));
      rec.metadata.factors = {
        ...rec.metadata.factors,
        performanceAdjustment: performanceBoost
      };
      
      return rec;
    });
  }

  /**
   * 构建推荐结果
   */
  private async buildRecommendationResult(
    content: TrainingContent,
    userProfile: UserSkillProfile,
    behaviorData: UserBehaviorData,
    matchScore: number,
    params: ContentFilteringParams
  ): Promise<RecommendationResult> {
    
    // 计算置信度
    const confidence = this.calculateConfidence(content, userProfile, matchScore);
    
    // 生成推荐理由
    const reasoning = this.generateReasoning(content, userProfile, matchScore);
    
    // 计算预期改进
    const expectedImprovement = this.calculateExpectedImprovement(content, userProfile);
    
    // 计算自适应等级
    const adaptiveLevel = this.calculateContentAdaptiveLevel(content, userProfile);
    
    return {
      contentId: content.id,
      score: matchScore,
      confidence,
      reasoning,
      metadata: {
        algorithm: 'CONTENT_BASED',
        factors: {
          contentMatch: matchScore,
          difficultyFit: this.calculateDifficultyFit(userProfile, content),
          skillMatch: this.calculateSkillMatch(userProfile, content)
        },
        expectedImprovement,
        adaptiveLevel
      }
    };
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy',
    details: any
  }> {
    try {
      const cacheSize = this.contentVectorCache.size + this.userVectorCache.size;
      const skillWeightsCount = this.skillWeights.size;
      
      return {
        status: 'healthy',
        details: {
          cacheSize,
          skillWeightsCount,
          lastUpdate: this.lastCacheUpdate
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }

  // 辅助方法
  private initializeSkillWeights(): void {
    // 初始化技能权重
    const skills = ['aggression', 'tightness', 'position', 'handReading', 'mathematical', 'psychological'];
    skills.forEach(skill => {
      this.skillWeights.set(skill, 0.5); // 默认权重
    });
  }

  private getContentFilteringParams(request: RecommendationRequest): ContentFilteringParams {
    return {
      weightProfile: {
        skillMatch: 0.35,
        difficultyFit: 0.25,
        preferences: 0.25,
        performance: 0.15
      },
      adaptiveScaling: true,
      diversityBoost: 0.1
    };
  }

  private cosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      return 0;
    }

    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const norm1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const norm2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  private calculateRecentActivityScore(behaviorData: UserBehaviorData): number {
    if (behaviorData.interactions.length === 0) return 0;

    const now = new Date();
    const recent = behaviorData.interactions.filter(interaction => {
      const daysDiff = (now.getTime() - interaction.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7; // 最近7天
    });

    return recent.length / behaviorData.interactions.length;
  }

  private calculateRecentPerformanceTrend(behaviorData: UserBehaviorData): number[] {
    // 计算最近的表现趋势：[短期趋势, 中期趋势, 长期趋势]
    const interactions = behaviorData.interactions.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    const shortTerm = interactions.slice(0, 5); // 最近5次
    const midTerm = interactions.slice(0, 15);  // 最近15次
    const longTerm = interactions.slice(0, 50); // 最近50次

    const calcTrend = (sessions: any[]) => {
      if (sessions.length === 0) return 0.5;
      return sessions.reduce((sum, s) => sum + s.performance, 0) / (sessions.length * 100);
    };

    return [
      calcTrend(shortTerm),
      calcTrend(midTerm),
      calcTrend(longTerm)
    ];
  }

  private encodeTagsVector(tags: string[]): number[] {
    // 简化的标签编码，实际应该使用更复杂的TF-IDF或Word2Vec
    const commonTags = [
      'preflop', 'postflop', 'bluff', 'value-bet', 'draw', 'position',
      'tournament', 'cash-game', 'heads-up', 'multiway', 'short-stack', 'deep-stack'
    ];

    return commonTags.map(tag => tags.includes(tag) ? 1 : 0);
  }

  private calculateGTOComplexity(gtoSolution: any): number {
    // 简化的GTO复杂度计算
    if (!gtoSolution) return 0.5;
    
    // 可以基于解决方案的动作数量、决策树深度等计算
    return 0.5; // 占位实现
  }

  private getUserSkillLevel(userProfile: UserSkillProfile, skill: string): number {
    const skillMap: Record<string, keyof typeof userProfile.skillMetrics> = {
      aggression: 'aggression',
      tightness: 'tightness',
      position: 'position',
      handReading: 'handReading',
      mathematical: 'mathematical',
      psychological: 'psychological'
    };
    
    const skillKey = skillMap[skill];
    return skillKey ? userProfile.skillMetrics[skillKey] / 100 : 0.5;
  }

  private getTrainingModeMatch(userMode: string, content: TrainingContent): number {
    // 根据内容类型和用户偏好计算匹配度
    if (userMode === 'GTO' && content.gtoSolution) return 1;
    if (userMode === 'EXPLOITATIVE' && content.type === 'CHALLENGE') return 0.8;
    if (userMode === 'MIXED') return 0.7;
    return 0.5;
  }

  private getDurationMatch(preferredDuration: number, contentDuration: number): number {
    const ratio = Math.min(preferredDuration, contentDuration) / Math.max(preferredDuration, contentDuration);
    return ratio;
  }

  private getContentTypePreference(userProfile: UserSkillProfile, contentType: string): number {
    // 基于用户等级和历史偏好计算内容类型偏好
    if (userProfile.level < 30) {
      return contentType === 'LESSON' ? 0.8 : 0.5;
    } else if (userProfile.level > 70) {
      return contentType === 'CHALLENGE' ? 0.8 : 0.6;
    }
    return 0.6;
  }

  private calculateSkillImbalance(userProfile: UserSkillProfile): number {
    const skills = Object.values(userProfile.skillMetrics);
    const avg = skills.reduce((sum, val) => sum + val, 0) / skills.length;
    const variance = skills.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / skills.length;
    return Math.sqrt(variance) / 100; // 标准化
  }

  private getContentCategory(contentId: string): string {
    // 实现内容分类获取逻辑
    return 'default';
  }

  private checkPrerequisites(contentId: string, userProfile: UserSkillProfile): boolean {
    // 检查前置条件是否满足
    return true; // 简化实现
  }

  private getContentDuration(contentId: string): number {
    // 获取内容时长
    return 60; // 默认60分钟
  }

  private getContentDifficulty(contentId: string): number {
    // 获取内容难度
    return 5; // 默认中等难度
  }

  private calculateConfidence(content: TrainingContent, userProfile: UserSkillProfile, matchScore: number): number {
    // 基于匹配分数和其他因素计算置信度
    let confidence = matchScore;
    
    // 基于用户历史数据调整置信度
    if (userProfile.level > 50) {
      confidence = Math.min(1, confidence + 0.1);
    }
    
    return confidence;
  }

  private generateReasoning(content: TrainingContent, userProfile: UserSkillProfile, matchScore: number): string[] {
    const reasons: string[] = [];
    
    // 基于技能匹配生成理由
    const skillMatch = this.calculateSkillMatch(userProfile, content);
    if (skillMatch > 0.7) {
      reasons.push('高度匹配您的技能需求');
    }
    
    // 基于难度匹配生成理由
    const difficultyFit = this.calculateDifficultyFit(userProfile, content);
    if (difficultyFit > 0.7) {
      reasons.push('难度适中，有助于技能提升');
    }
    
    // 基于弱项改进生成理由
    const relevantWeaknesses = content.metadata.skillAreas.filter(skill => 
      userProfile.weaknesses.includes(skill)
    );
    if (relevantWeaknesses.length > 0) {
      reasons.push(`针对您的弱项：${relevantWeaknesses.join(', ')}`);
    }
    
    return reasons.slice(0, 3); // 最多3个理由
  }

  private calculateExpectedImprovement(content: TrainingContent, userProfile: UserSkillProfile): number {
    // 计算预期改进幅度
    const skillMatch = this.calculateSkillMatch(userProfile, content);
    const difficultyFit = this.calculateDifficultyFit(userProfile, content);
    
    return (skillMatch + difficultyFit) / 2;
  }

  private calculateContentAdaptiveLevel(content: TrainingContent, userProfile: UserSkillProfile): number {
    // 计算内容自适应等级
    const levelGap = Math.abs(content.difficulty - userProfile.level / 10);
    return Math.max(1, Math.min(5, 3 - levelGap));
  }

  private hasUserInteractedWith(userId: string, contentId: string, behaviorData: UserBehaviorData): boolean {
    return behaviorData.interactions.some(interaction => 
      interaction.scenarioType === contentId
    );
  }

  private isReviewMode(request: RecommendationRequest): boolean {
    return request.context?.targetSkills?.includes('review') || false;
  }

  private isCacheValid(): boolean {
    const cacheAge = Date.now() - this.lastCacheUpdate.getTime();
    return cacheAge < 30 * 60 * 1000; // 30分钟缓存有效期
  }
}