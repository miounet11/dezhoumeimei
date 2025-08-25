/**
 * 推荐系统核心引擎
 * 高精度个性化训练推荐引擎
 */

import { 
  UserSkillProfile, 
  UserBehaviorData, 
  TrainingContent,
  RecommendationRequest,
  RecommendationResponse,
  RecommendationResult,
  RecommendationMetrics,
  RealTimeConfig
} from './types';
import { CollaborativeFilteringEngine } from './algorithms/collaborative-filtering';
import { ContentFilteringEngine } from './algorithms/content-filtering';
import { DeepLearningEngine } from './algorithms/deep-learning';
import { LearningPathOptimizer } from './algorithms/learning-path';
import { RecommendationCache } from './cache/recommendation-cache';
import { MetricsCollector } from './evaluation/metrics-collector';
import { ABTestManager } from './ab-testing/ab-test-manager';
import { logger } from '@/lib/logger';

export class PersonalizedRecommendationEngine {
  private collaborativeEngine: CollaborativeFilteringEngine;
  private contentEngine: ContentFilteringEngine;
  private deepLearningEngine: DeepLearningEngine;
  private learningPathOptimizer: LearningPathOptimizer;
  private cache: RecommendationCache;
  private metricsCollector: MetricsCollector;
  private abTestManager: ABTestManager;
  private config: RealTimeConfig;

  constructor(config: RealTimeConfig) {
    this.config = config;
    this.collaborativeEngine = new CollaborativeFilteringEngine();
    this.contentEngine = new ContentFilteringEngine();
    this.deepLearningEngine = new DeepLearningEngine();
    this.learningPathOptimizer = new LearningPathOptimizer();
    this.cache = new RecommendationCache(config.cacheConfig);
    this.metricsCollector = new MetricsCollector();
    this.abTestManager = new ABTestManager();
  }

  /**
   * 获取个性化推荐
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const startTime = Date.now();
    const requestId = `rec_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.info(`开始推荐请求: ${requestId}`, { userId: request.userId, algorithm: request.algorithm });

      // 检查缓存
      if (this.config.cacheConfig.enabled) {
        const cached = await this.cache.get(request.userId, request.algorithm);
        if (cached && this.isCacheValid(cached, request)) {
          logger.info(`缓存命中: ${requestId}`);
          return {
            ...cached,
            metadata: {
              ...cached.metadata,
              cacheHit: true,
              processingTime: Date.now() - startTime
            }
          };
        }
      }

      // A/B测试分组
      const abTestGroup = await this.abTestManager.assignUserToExperiment(request.userId);

      // 获取用户数据
      const [userProfile, behaviorData, availableContent] = await Promise.all([
        this.getUserProfile(request.userId),
        this.getUserBehaviorData(request.userId),
        this.getAvailableContent(request.context)
      ]);

      // 根据算法类型和A/B测试组获取推荐
      let recommendations: RecommendationResult[];

      switch (request.algorithm) {
        case 'COLLABORATIVE':
          recommendations = await this.collaborativeEngine.recommend(
            userProfile, behaviorData, availableContent, request
          );
          break;
        case 'CONTENT':
          recommendations = await this.contentEngine.recommend(
            userProfile, behaviorData, availableContent, request
          );
          break;
        case 'DEEP_LEARNING':
          recommendations = await this.deepLearningEngine.recommend(
            userProfile, behaviorData, availableContent, request
          );
          break;
        case 'LEARNING_PATH':
          recommendations = await this.learningPathOptimizer.recommend(
            userProfile, behaviorData, availableContent, request
          );
          break;
        case 'HYBRID':
        default:
          recommendations = await this.hybridRecommend(
            userProfile, behaviorData, availableContent, request, abTestGroup
          );
          break;
      }

      // 后处理：多样性优化、去重、排序
      recommendations = await this.postProcessRecommendations(
        recommendations, userProfile, request
      );

      // 构造响应
      const response: RecommendationResponse = {
        userId: request.userId,
        recommendations: recommendations.slice(0, request.limit || 10),
        metadata: {
          algorithm: request.algorithm,
          totalCandidates: availableContent.length,
          processingTime: Date.now() - startTime,
          cacheHit: false,
          abTestGroup
        },
        timestamp: new Date()
      };

      // 获取学习路径信息
      if (request.algorithm === 'LEARNING_PATH' || request.algorithm === 'HYBRID') {
        response.learningPath = await this.learningPathOptimizer.getUserPathProgress(request.userId);
      }

      // 缓存结果
      if (this.config.cacheConfig.enabled) {
        await this.cache.set(request.userId, request.algorithm, response);
      }

      // 记录指标
      await this.metricsCollector.recordRecommendation(response, request);

      logger.info(`推荐完成: ${requestId}`, {
        userId: request.userId,
        recommendationCount: response.recommendations.length,
        processingTime: response.metadata.processingTime
      });

      return response;

    } catch (error) {
      logger.error(`推荐失败: ${requestId}`, {
        userId: request.userId,
        error: error.message,
        stack: error.stack
      });

      // 返回降级推荐
      return this.getFallbackRecommendations(request, startTime);
    }
  }

  /**
   * 混合推荐算法
   */
  private async hybridRecommend(
    userProfile: UserSkillProfile,
    behaviorData: UserBehaviorData,
    availableContent: TrainingContent[],
    request: RecommendationRequest,
    abTestGroup?: string
  ): Promise<RecommendationResult[]> {
    
    // 根据A/B测试组调整权重
    const weights = this.getHybridWeights(userProfile, abTestGroup);

    // 并行执行多个推荐算法
    const [
      collaborativeResults,
      contentResults,
      deepLearningResults,
      learningPathResults
    ] = await Promise.all([
      this.collaborativeEngine.recommend(userProfile, behaviorData, availableContent, request),
      this.contentEngine.recommend(userProfile, behaviorData, availableContent, request),
      this.deepLearningEngine.recommend(userProfile, behaviorData, availableContent, request),
      this.learningPathOptimizer.recommend(userProfile, behaviorData, availableContent, request)
    ]);

    // 融合推荐结果
    const fusedResults = this.fuseRecommendations([
      { results: collaborativeResults, weight: weights.collaborative },
      { results: contentResults, weight: weights.content },
      { results: deepLearningResults, weight: weights.deepLearning },
      { results: learningPathResults, weight: weights.learningPath }
    ]);

    return fusedResults;
  }

  /**
   * 融合多个推荐算法的结果
   */
  private fuseRecommendations(
    algorithmResults: Array<{ results: RecommendationResult[], weight: number }>
  ): RecommendationResult[] {
    const contentScores = new Map<string, {
      totalScore: number,
      totalWeight: number,
      results: RecommendationResult[]
    }>();

    // 聚合各算法的推荐分数
    algorithmResults.forEach(({ results, weight }) => {
      results.forEach(result => {
        const existing = contentScores.get(result.contentId) || {
          totalScore: 0,
          totalWeight: 0,
          results: []
        };

        existing.totalScore += result.score * weight;
        existing.totalWeight += weight;
        existing.results.push(result);

        contentScores.set(result.contentId, existing);
      });
    });

    // 计算最终推荐分数
    const fusedResults: RecommendationResult[] = [];
    contentScores.forEach((data, contentId) => {
      const avgScore = data.totalScore / data.totalWeight;
      const bestResult = data.results.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      fusedResults.push({
        ...bestResult,
        score: avgScore,
        reasoning: [
          `融合了${data.results.length}个算法的推荐`,
          ...bestResult.reasoning.slice(0, 2) // 保留最佳结果的部分理由
        ],
        metadata: {
          ...bestResult.metadata,
          algorithm: 'HYBRID',
          factors: {
            ...bestResult.metadata.factors,
            fusionWeight: data.totalWeight
          }
        }
      });
    });

    // 按分数排序
    return fusedResults.sort((a, b) => b.score - a.score);
  }

  /**
   * 获取混合算法权重
   */
  private getHybridWeights(userProfile: UserSkillProfile, abTestGroup?: string): {
    collaborative: number,
    content: number,
    deepLearning: number,
    learningPath: number
  } {
    // 默认权重
    let weights = {
      collaborative: 0.25,
      content: 0.30,
      deepLearning: 0.35,
      learningPath: 0.10
    };

    // 根据用户特征调整权重
    if (userProfile.level < 20) {
      // 新手用户更依赖内容推荐和学习路径
      weights = {
        collaborative: 0.15,
        content: 0.35,
        deepLearning: 0.25,
        learningPath: 0.25
      };
    } else if (userProfile.level > 80) {
      // 高级用户更依赖协同过滤和深度学习
      weights = {
        collaborative: 0.35,
        content: 0.20,
        deepLearning: 0.40,
        learningPath: 0.05
      };
    }

    // A/B测试权重调整
    if (abTestGroup) {
      weights = this.abTestManager.adjustWeights(weights, abTestGroup);
    }

    return weights;
  }

  /**
   * 后处理推荐结果
   */
  private async postProcessRecommendations(
    recommendations: RecommendationResult[],
    userProfile: UserSkillProfile,
    request: RecommendationRequest
  ): Promise<RecommendationResult[]> {
    
    // 1. 去重（基于contentId）
    const uniqueRecommendations = this.deduplicateRecommendations(recommendations);

    // 2. 多样性优化
    const diversifiedRecommendations = this.diversifyRecommendations(
      uniqueRecommendations, userProfile
    );

    // 3. 难度平衡
    const balancedRecommendations = this.balanceDifficulty(
      diversifiedRecommendations, userProfile
    );

    // 4. 新颖性增强
    const novelRecommendations = await this.enhanceNovelty(
      balancedRecommendations, request.userId
    );

    // 5. 最终排序
    return this.finalRanking(novelRecommendations, userProfile);
  }

  /**
   * 去重推荐结果
   */
  private deduplicateRecommendations(recommendations: RecommendationResult[]): RecommendationResult[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.contentId)) {
        return false;
      }
      seen.add(rec.contentId);
      return true;
    });
  }

  /**
   * 多样性优化
   */
  private diversifyRecommendations(
    recommendations: RecommendationResult[],
    userProfile: UserSkillProfile
  ): RecommendationResult[] {
    const diversified: RecommendationResult[] = [];
    const usedCategories = new Set<string>();
    const maxPerCategory = Math.ceil(recommendations.length / 4); // 最多4个类别

    // 按类别分组
    const categorized = new Map<string, RecommendationResult[]>();
    recommendations.forEach(rec => {
      // 假设从metadata中获取类别信息
      const category = this.getContentCategory(rec.contentId);
      if (!categorized.has(category)) {
        categorized.set(category, []);
      }
      categorized.get(category)!.push(rec);
    });

    // 轮流从每个类别选择
    let round = 0;
    while (diversified.length < recommendations.length && round < maxPerCategory) {
      categorized.forEach((recs, category) => {
        if (round < recs.length && diversified.length < recommendations.length) {
          const rec = recs[round];
          rec.metadata.factors.diversity = this.calculateDiversityScore(rec, diversified);
          diversified.push(rec);
        }
      });
      round++;
    }

    return diversified;
  }

  /**
   * 难度平衡
   */
  private balanceDifficulty(
    recommendations: RecommendationResult[],
    userProfile: UserSkillProfile
  ): RecommendationResult[] {
    const userLevel = userProfile.level;
    const targetDifficulty = Math.floor(userLevel / 10) + 1; // 1-10难度级别

    // 调整推荐分数基于难度匹配度
    return recommendations.map(rec => {
      const contentDifficulty = this.getContentDifficulty(rec.contentId);
      const difficultyGap = Math.abs(contentDifficulty - targetDifficulty);
      
      // 难度过高或过低都会降低分数
      const difficultyPenalty = Math.min(0.3, difficultyGap * 0.05);
      const adjustedScore = rec.score * (1 - difficultyPenalty);

      return {
        ...rec,
        score: adjustedScore,
        metadata: {
          ...rec.metadata,
          factors: {
            ...rec.metadata.factors,
            difficultyFit: 1 - difficultyPenalty
          }
        }
      };
    });
  }

  /**
   * 新颖性增强
   */
  private async enhanceNovelty(
    recommendations: RecommendationResult[],
    userId: string
  ): Promise<RecommendationResult[]> {
    // 获取用户历史交互内容
    const userHistory = await this.getUserInteractionHistory(userId);
    const interactedContent = new Set(userHistory.map(h => h.contentId));

    return recommendations.map(rec => {
      const isNovel = !interactedContent.has(rec.contentId);
      const noveltyBoost = isNovel ? 0.1 : -0.05; // 新内容加分，旧内容减分

      return {
        ...rec,
        score: Math.max(0, rec.score + noveltyBoost),
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
   * 最终排序
   */
  private finalRanking(
    recommendations: RecommendationResult[],
    userProfile: UserSkillProfile
  ): RecommendationResult[] {
    return recommendations
      .sort((a, b) => {
        // 主要按分数排序
        const scoreDiff = b.score - a.score;
        if (Math.abs(scoreDiff) > 0.05) {
          return scoreDiff;
        }

        // 分数接近时，考虑置信度
        const confidenceDiff = b.confidence - a.confidence;
        if (Math.abs(confidenceDiff) > 0.1) {
          return confidenceDiff;
        }

        // 最后考虑多样性
        return (b.metadata.factors.diversity || 0) - (a.metadata.factors.diversity || 0);
      })
      .map((rec, index) => ({
        ...rec,
        metadata: {
          ...rec.metadata,
          finalRank: index + 1
        }
      }));
  }

  /**
   * 获取降级推荐
   */
  private async getFallbackRecommendations(
    request: RecommendationRequest,
    startTime: number
  ): Promise<RecommendationResponse> {
    logger.warn(`使用降级推荐`, { userId: request.userId });

    // 简单的基于用户等级的推荐
    const userProfile = await this.getUserProfile(request.userId);
    const fallbackContent = await this.getFallbackContent(userProfile.level);

    const recommendations: RecommendationResult[] = fallbackContent.map((content, index) => ({
      contentId: content.id,
      score: 0.5 - (index * 0.05), // 递减分数
      confidence: 0.3,
      reasoning: ['降级推荐', '基于用户等级'],
      metadata: {
        algorithm: 'FALLBACK',
        factors: {
          difficultyFit: 0.5
        },
        expectedImprovement: 0.1,
        adaptiveLevel: 1
      }
    }));

    return {
      userId: request.userId,
      recommendations: recommendations.slice(0, request.limit || 5),
      metadata: {
        algorithm: 'FALLBACK',
        totalCandidates: fallbackContent.length,
        processingTime: Date.now() - startTime,
        cacheHit: false
      },
      timestamp: new Date()
    };
  }

  /**
   * 批量更新用户模型
   */
  async batchUpdateUserModels(userIds: string[]): Promise<void> {
    logger.info(`开始批量更新用户模型`, { count: userIds.length });

    const batchSize = this.config.batchSize || 100;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      await Promise.all(batch.map(userId => this.updateUserModel(userId)));
      
      // 避免过载
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info(`批量更新完成`, { processedUsers: userIds.length });
  }

  /**
   * 更新单个用户模型
   */
  private async updateUserModel(userId: string): Promise<void> {
    try {
      // 获取最新用户数据
      const [profile, behaviorData] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserBehaviorData(userId)
      ]);

      // 更新深度学习模型的用户嵌入
      await this.deepLearningEngine.updateUserEmbedding(userId, profile, behaviorData);

      // 更新学习路径
      await this.learningPathOptimizer.updateUserPath(userId, profile, behaviorData);

      // 清除相关缓存
      await this.cache.invalidateUser(userId);

    } catch (error) {
      logger.error(`更新用户模型失败`, { userId, error: error.message });
    }
  }

  /**
   * 获取推荐效果指标
   */
  async getRecommendationMetrics(
    userId?: string,
    timeRange?: { start: Date, end: Date }
  ): Promise<RecommendationMetrics> {
    return this.metricsCollector.getMetrics(userId, timeRange);
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy',
    components: Record<string, any>,
    timestamp: Date
  }> {
    const components: Record<string, any> = {};

    try {
      // 检查各个组件
      components.collaborative = await this.collaborativeEngine.healthCheck();
      components.content = await this.contentEngine.healthCheck();
      components.deepLearning = await this.deepLearningEngine.healthCheck();
      components.learningPath = await this.learningPathOptimizer.healthCheck();
      components.cache = await this.cache.healthCheck();
      components.metrics = await this.metricsCollector.healthCheck();

      // 判断整体状态
      const unhealthyComponents = Object.values(components).filter(c => c.status === 'unhealthy').length;
      const degradedComponents = Object.values(components).filter(c => c.status === 'degraded').length;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (unhealthyComponents > 0) {
        status = 'unhealthy';
      } else if (degradedComponents > 1) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      return {
        status,
        components,
        timestamp: new Date()
      };

    } catch (error) {
      logger.error(`健康检查失败`, { error: error.message });
      return {
        status: 'unhealthy',
        components: { error: error.message },
        timestamp: new Date()
      };
    }
  }

  // 辅助方法
  private isCacheValid(cached: RecommendationResponse, request: RecommendationRequest): boolean {
    const cacheAge = Date.now() - cached.timestamp.getTime();
    return cacheAge < this.config.cacheConfig.ttl * 1000;
  }

  private async getUserProfile(userId: string): Promise<UserSkillProfile> {
    // 实现用户画像获取逻辑
    // 这里应该从数据库或缓存中获取用户技能画像
    throw new Error('getUserProfile not implemented');
  }

  private async getUserBehaviorData(userId: string): Promise<UserBehaviorData> {
    // 实现用户行为数据获取逻辑
    throw new Error('getUserBehaviorData not implemented');
  }

  private async getAvailableContent(context: any): Promise<TrainingContent[]> {
    // 实现可用内容获取逻辑
    throw new Error('getAvailableContent not implemented');
  }

  private getContentCategory(contentId: string): string {
    // 实现内容分类获取逻辑
    return 'default';
  }

  private getContentDifficulty(contentId: string): number {
    // 实现内容难度获取逻辑
    return 5;
  }

  private calculateDiversityScore(rec: RecommendationResult, existing: RecommendationResult[]): number {
    // 实现多样性分数计算逻辑
    return 0.5;
  }

  private async getUserInteractionHistory(userId: string): Promise<Array<{ contentId: string, timestamp: Date }>> {
    // 实现用户交互历史获取逻辑
    return [];
  }

  private async getFallbackContent(userLevel: number): Promise<TrainingContent[]> {
    // 实现降级内容获取逻辑
    return [];
  }
}