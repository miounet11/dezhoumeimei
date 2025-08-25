/**
 * 协同过滤推荐算法引擎
 * 基于用户相似性和物品相似性的推荐算法
 */

import { 
  UserSkillProfile, 
  UserBehaviorData, 
  TrainingContent,
  RecommendationRequest,
  RecommendationResult,
  SimilarUser,
  CollaborativeFilteringParams
} from '../types';
import { logger } from '@/lib/logger';
import * as math from 'mathjs';

export class CollaborativeFilteringEngine {
  private userSimilarityCache: Map<string, Map<string, number>>;
  private itemSimilarityCache: Map<string, Map<string, number>>;
  private userItemMatrix: Map<string, Map<string, number>>;
  private lastCacheUpdate: Date;

  constructor() {
    this.userSimilarityCache = new Map();
    this.itemSimilarityCache = new Map();
    this.userItemMatrix = new Map();
    this.lastCacheUpdate = new Date(0);
  }

  /**
   * 协同过滤推荐
   */
  async recommend(
    userProfile: UserSkillProfile,
    behaviorData: UserBehaviorData,
    availableContent: TrainingContent[],
    request: RecommendationRequest
  ): Promise<RecommendationResult[]> {
    logger.info('开始协同过滤推荐', { userId: userProfile.userId });

    try {
      // 更新用户-物品矩阵
      await this.updateUserItemMatrix(userProfile.userId, behaviorData);

      // 获取推荐参数
      const params = this.getCollaborativeParams(request);

      let recommendations: RecommendationResult[];

      switch (params.method) {
        case 'USER_BASED':
          recommendations = await this.userBasedRecommendation(
            userProfile, behaviorData, availableContent, params
          );
          break;
        case 'ITEM_BASED':
          recommendations = await this.itemBasedRecommendation(
            userProfile, behaviorData, availableContent, params
          );
          break;
        case 'MATRIX_FACTORIZATION':
          recommendations = await this.matrixFactorizationRecommendation(
            userProfile, behaviorData, availableContent, params
          );
          break;
        default:
          // 混合方法
          recommendations = await this.hybridCollaborativeRecommendation(
            userProfile, behaviorData, availableContent, params
          );
      }

      logger.info('协同过滤推荐完成', {
        userId: userProfile.userId,
        method: params.method,
        recommendationCount: recommendations.length
      });

      return recommendations;

    } catch (error) {
      logger.error('协同过滤推荐失败', {
        userId: userProfile.userId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * 基于用户的协同过滤
   */
  private async userBasedRecommendation(
    userProfile: UserSkillProfile,
    behaviorData: UserBehaviorData,
    availableContent: TrainingContent[],
    params: CollaborativeFilteringParams
  ): Promise<RecommendationResult[]> {
    
    // 1. 找到相似用户
    const similarUsers = await this.findSimilarUsers(
      userProfile.userId, 
      params.neighborhoodSize,
      params.minSimilarity
    );

    if (similarUsers.length === 0) {
      logger.warn('未找到相似用户', { userId: userProfile.userId });
      return [];
    }

    // 2. 获取相似用户的偏好内容
    const candidateItems = new Map<string, {
      score: number,
      supportingUsers: string[],
      reasons: string[]
    }>();

    for (const similarUser of similarUsers) {
      const userPreferences = await this.getUserPreferences(similarUser.userId);
      
      for (const [contentId, rating] of userPreferences) {
        // 跳过目标用户已经交互过的内容
        if (this.hasUserInteractedWith(userProfile.userId, contentId)) {
          continue;
        }

        // 确保内容在可用列表中
        if (!availableContent.find(c => c.id === contentId)) {
          continue;
        }

        const existing = candidateItems.get(contentId) || {
          score: 0,
          supportingUsers: [],
          reasons: []
        };

        // 加权评分：相似度 × 用户评分
        const weightedScore = similarUser.similarity * rating;
        existing.score += weightedScore;
        existing.supportingUsers.push(similarUser.userId);
        existing.reasons.push(`相似用户(相似度:${(similarUser.similarity * 100).toFixed(1)}%)喜欢此内容`);

        candidateItems.set(contentId, existing);
      }
    }

    // 3. 生成推荐结果
    const recommendations: RecommendationResult[] = [];
    
    for (const [contentId, data] of candidateItems) {
      const content = availableContent.find(c => c.id === contentId);
      if (!content) continue;

      // 归一化分数
      const normalizedScore = Math.min(1, data.score / similarUsers.length);
      
      // 计算置信度（基于支持用户数量）
      const confidence = Math.min(1, data.supportingUsers.length / params.neighborhoodSize);

      // 计算内容匹配度
      const contentMatch = this.calculateContentMatch(content, userProfile);

      recommendations.push({
        contentId,
        score: normalizedScore * 0.7 + contentMatch * 0.3, // 70%协同过滤 + 30%内容匹配
        confidence,
        reasoning: [
          `${data.supportingUsers.length}个相似用户推荐`,
          `平均相似度: ${(similarUsers.slice(0, 3).reduce((sum, u) => sum + u.similarity, 0) / Math.min(3, similarUsers.length) * 100).toFixed(1)}%`,
          ...data.reasons.slice(0, 2)
        ],
        metadata: {
          algorithm: 'USER_BASED_CF',
          factors: {
            similarity: normalizedScore,
            contentMatch,
            supportCount: data.supportingUsers.length
          },
          expectedImprovement: this.estimateImprovement(content, userProfile),
          adaptiveLevel: this.calculateAdaptiveLevel(content, userProfile)
        }
      });
    }

    // 按分数排序
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * 基于物品的协同过滤
   */
  private async itemBasedRecommendation(
    userProfile: UserSkillProfile,
    behaviorData: UserBehaviorData,
    availableContent: TrainingContent[],
    params: CollaborativeFilteringParams
  ): Promise<RecommendationResult[]> {
    
    // 1. 获取用户历史偏好内容
    const userHistory = behaviorData.interactions.map(interaction => ({
      contentId: interaction.scenarioType, // 假设scenarioType对应contentId
      rating: this.calculateImplicitRating(interaction)
    })).filter(item => item.rating > 0.5); // 只考虑正向反馈

    if (userHistory.length === 0) {
      logger.warn('用户无历史交互记录', { userId: userProfile.userId });
      return [];
    }

    // 2. 对每个历史内容，找相似内容
    const candidateItems = new Map<string, {
      score: number,
      similarToItems: string[],
      reasons: string[]
    }>();

    for (const historyItem of userHistory) {
      const similarItems = await this.findSimilarItems(
        historyItem.contentId,
        availableContent,
        params.neighborhoodSize
      );

      for (const [similarItemId, similarity] of similarItems) {
        // 跳过用户已经交互过的内容
        if (this.hasUserInteractedWith(userProfile.userId, similarItemId)) {
          continue;
        }

        const existing = candidateItems.get(similarItemId) || {
          score: 0,
          similarToItems: [],
          reasons: []
        };

        // 加权评分：物品相似度 × 用户对原物品的评分
        const weightedScore = similarity * historyItem.rating;
        existing.score += weightedScore;
        existing.similarToItems.push(historyItem.contentId);
        existing.reasons.push(`与您之前学习的内容相似(相似度:${(similarity * 100).toFixed(1)}%)`);

        candidateItems.set(similarItemId, existing);
      }
    }

    // 3. 生成推荐结果
    const recommendations: RecommendationResult[] = [];
    
    for (const [contentId, data] of candidateItems) {
      const content = availableContent.find(c => c.id === contentId);
      if (!content) continue;

      // 归一化分数
      const normalizedScore = Math.min(1, data.score / userHistory.length);
      
      // 计算置信度
      const confidence = Math.min(1, data.similarToItems.length / Math.min(5, userHistory.length));

      recommendations.push({
        contentId,
        score: normalizedScore,
        confidence,
        reasoning: [
          `与您之前的${data.similarToItems.length}个学习内容相似`,
          ...data.reasons.slice(0, 2)
        ],
        metadata: {
          algorithm: 'ITEM_BASED_CF',
          factors: {
            similarity: normalizedScore,
            itemCount: data.similarToItems.length
          },
          expectedImprovement: this.estimateImprovement(content, userProfile),
          adaptiveLevel: this.calculateAdaptiveLevel(content, userProfile)
        }
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * 矩阵分解推荐
   */
  private async matrixFactorizationRecommendation(
    userProfile: UserSkillProfile,
    behaviorData: UserBehaviorData,
    availableContent: TrainingContent[],
    params: CollaborativeFilteringParams
  ): Promise<RecommendationResult[]> {
    
    try {
      // 构建用户-物品评分矩阵
      const matrix = await this.buildRatingMatrix();
      
      // 执行矩阵分解 (简化的SVD实现)
      const { userFactors, itemFactors } = await this.performMatrixFactorization(matrix, params);
      
      // 获取用户因子向量
      const userVector = userFactors.get(userProfile.userId);
      if (!userVector) {
        logger.warn('用户因子向量不存在', { userId: userProfile.userId });
        return [];
      }

      // 预测评分
      const predictions: RecommendationResult[] = [];
      
      for (const content of availableContent) {
        // 跳过已交互内容
        if (this.hasUserInteractedWith(userProfile.userId, content.id)) {
          continue;
        }

        const itemVector = itemFactors.get(content.id);
        if (!itemVector) continue;

        // 计算预测评分（用户向量 × 物品向量）
        const predictedRating = this.dotProduct(userVector, itemVector);
        
        if (predictedRating > 0.3) { // 只推荐预测评分较高的内容
          predictions.push({
            contentId: content.id,
            score: Math.min(1, predictedRating),
            confidence: 0.8, // 矩阵分解通常有较高置信度
            reasoning: [
              '基于用户潜在偏好向量预测',
              '通过分析所有用户的行为模式得出'
            ],
            metadata: {
              algorithm: 'MATRIX_FACTORIZATION',
              factors: {
                predictedRating,
                userFactorNorm: this.vectorNorm(userVector),
                itemFactorNorm: this.vectorNorm(itemVector)
              },
              expectedImprovement: this.estimateImprovement(content, userProfile),
              adaptiveLevel: this.calculateAdaptiveLevel(content, userProfile)
            }
          });
        }
      }

      return predictions.sort((a, b) => b.score - a.score);

    } catch (error) {
      logger.error('矩阵分解推荐失败', { error: error.message });
      return [];
    }
  }

  /**
   * 混合协同过滤推荐
   */
  private async hybridCollaborativeRecommendation(
    userProfile: UserSkillProfile,
    behaviorData: UserBehaviorData,
    availableContent: TrainingContent[],
    params: CollaborativeFilteringParams
  ): Promise<RecommendationResult[]> {
    
    // 并行执行多种协同过滤方法
    const [userBasedResults, itemBasedResults, matrixResults] = await Promise.all([
      this.userBasedRecommendation(userProfile, behaviorData, availableContent, params),
      this.itemBasedRecommendation(userProfile, behaviorData, availableContent, params),
      this.matrixFactorizationRecommendation(userProfile, behaviorData, availableContent, params)
    ]);

    // 融合结果
    const fusedResults = this.fuseCollaborativeResults([
      { results: userBasedResults, weight: 0.4 },
      { results: itemBasedResults, weight: 0.35 },
      { results: matrixResults, weight: 0.25 }
    ]);

    return fusedResults;
  }

  /**
   * 融合协同过滤结果
   */
  private fuseCollaborativeResults(
    algorithmResults: Array<{ results: RecommendationResult[], weight: number }>
  ): RecommendationResult[] {
    const contentScores = new Map<string, {
      totalScore: number,
      totalWeight: number,
      results: RecommendationResult[]
    }>();

    // 聚合分数
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

    // 生成融合结果
    const fusedResults: RecommendationResult[] = [];
    contentScores.forEach((data, contentId) => {
      const avgScore = data.totalScore / data.totalWeight;
      const avgConfidence = data.results.reduce((sum, r) => sum + r.confidence, 0) / data.results.length;
      
      const allReasons = data.results.flatMap(r => r.reasoning);
      const uniqueReasons = [...new Set(allReasons)];

      fusedResults.push({
        contentId,
        score: avgScore,
        confidence: avgConfidence,
        reasoning: [
          `融合了${data.results.length}种协同过滤方法`,
          ...uniqueReasons.slice(0, 2)
        ],
        metadata: {
          algorithm: 'HYBRID_COLLABORATIVE',
          factors: {
            similarity: avgScore,
            fusionWeight: data.totalWeight,
            methodCount: data.results.length
          },
          expectedImprovement: data.results[0].metadata.expectedImprovement,
          adaptiveLevel: data.results[0].metadata.adaptiveLevel
        }
      });
    });

    return fusedResults.sort((a, b) => b.score - a.score);
  }

  /**
   * 寻找相似用户
   */
  private async findSimilarUsers(
    targetUserId: string, 
    neighborhoodSize: number,
    minSimilarity: number
  ): Promise<SimilarUser[]> {
    
    // 检查缓存
    const cached = this.userSimilarityCache.get(targetUserId);
    if (cached && this.isCacheValid()) {
      const similarUsers: SimilarUser[] = [];
      for (const [userId, similarity] of cached) {
        if (similarity >= minSimilarity) {
          const profile = await this.getUserSkillProfile(userId);
          similarUsers.push({
            userId,
            similarity,
            sharedTraits: this.calculateSharedTraits(targetUserId, userId),
            skillProfile: profile
          });
        }
      }
      return similarUsers.slice(0, neighborhoodSize);
    }

    // 获取所有用户的技能画像
    const allUsers = await this.getAllUserProfiles();
    const targetProfile = allUsers.find(u => u.userId === targetUserId);
    
    if (!targetProfile) {
      logger.warn('目标用户画像不存在', { targetUserId });
      return [];
    }

    // 计算相似度
    const similarities: Array<{ userId: string, similarity: number }> = [];
    
    for (const otherUser of allUsers) {
      if (otherUser.userId === targetUserId) continue;
      
      const similarity = this.calculateUserSimilarity(targetProfile, otherUser);
      if (similarity >= minSimilarity) {
        similarities.push({ userId: otherUser.userId, similarity });
      }
    }

    // 排序并取前N个
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSimilarities = similarities.slice(0, neighborhoodSize);

    // 缓存结果
    const cacheMap = new Map<string, number>();
    topSimilarities.forEach(item => cacheMap.set(item.userId, item.similarity));
    this.userSimilarityCache.set(targetUserId, cacheMap);

    // 转换为SimilarUser对象
    const similarUsers: SimilarUser[] = [];
    for (const item of topSimilarities) {
      const profile = allUsers.find(u => u.userId === item.userId)!;
      similarUsers.push({
        userId: item.userId,
        similarity: item.similarity,
        sharedTraits: this.calculateSharedTraits(targetUserId, item.userId),
        skillProfile: profile
      });
    }

    return similarUsers;
  }

  /**
   * 计算用户相似度
   */
  private calculateUserSimilarity(user1: UserSkillProfile, user2: UserSkillProfile): number {
    // 1. 技能指标相似度（余弦相似度）
    const skillVector1 = [
      user1.skillMetrics.aggression,
      user1.skillMetrics.tightness,
      user1.skillMetrics.position,
      user1.skillMetrics.handReading,
      user1.skillMetrics.mathematical,
      user1.skillMetrics.psychological
    ];

    const skillVector2 = [
      user2.skillMetrics.aggression,
      user2.skillMetrics.tightness,
      user2.skillMetrics.position,
      user2.skillMetrics.handReading,
      user2.skillMetrics.mathematical,
      user2.skillMetrics.psychological
    ];

    const skillSimilarity = this.cosineSimilarity(skillVector1, skillVector2);

    // 2. 偏好相似度
    const preferenceSimilarity = this.calculatePreferenceSimilarity(user1, user2);

    // 3. 等级相似度（使用高斯核函数）
    const levelDiff = Math.abs(user1.level - user2.level);
    const levelSimilarity = Math.exp(-(levelDiff * levelDiff) / (2 * 15 * 15)); // σ=15

    // 4. 玩家类型相似度
    const typeSimilarity = user1.playerType === user2.playerType ? 1.0 : 0.5;

    // 加权融合
    return (
      skillSimilarity * 0.4 +
      preferenceSimilarity * 0.25 +
      levelSimilarity * 0.2 +
      typeSimilarity * 0.15
    );
  }

  /**
   * 计算偏好相似度
   */
  private calculatePreferenceSimilarity(user1: UserSkillProfile, user2: UserSkillProfile): number {
    let similarity = 0;
    let count = 0;

    // 训练模式偏好
    if (user1.preferences.trainingMode === user2.preferences.trainingMode) {
      similarity += 1;
    }
    count++;

    // 难度偏好
    const difficultyMap = { 'BEGINNER': 1, 'INTERMEDIATE': 2, 'ADVANCED': 3, 'EXPERT': 4 };
    const diff1 = difficultyMap[user1.preferences.difficulty];
    const diff2 = difficultyMap[user2.preferences.difficulty];
    const difficultyDiff = Math.abs(diff1 - diff2);
    similarity += Math.max(0, 1 - difficultyDiff / 3);
    count++;

    // 时长偏好相似度
    const durationDiff = Math.abs(user1.preferences.sessionDuration - user2.preferences.sessionDuration);
    const maxDuration = Math.max(user1.preferences.sessionDuration, user2.preferences.sessionDuration);
    const durationSimilarity = maxDuration > 0 ? 1 - (durationDiff / maxDuration) : 1;
    similarity += durationSimilarity;
    count++;

    // 关注领域相似度（Jaccard相似度）
    const focusSet1 = new Set(user1.preferences.focusAreas);
    const focusSet2 = new Set(user2.preferences.focusAreas);
    const intersection = new Set([...focusSet1].filter(x => focusSet2.has(x)));
    const union = new Set([...focusSet1, ...focusSet2]);
    const focusSimilarity = union.size > 0 ? intersection.size / union.size : 0;
    similarity += focusSimilarity;
    count++;

    return count > 0 ? similarity / count : 0;
  }

  /**
   * 余弦相似度计算
   */
  private cosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      return 0;
    }

    const dotProduct = this.dotProduct(vector1, vector2);
    const norm1 = this.vectorNorm(vector1);
    const norm2 = this.vectorNorm(vector2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * 向量点积
   */
  private dotProduct(vector1: number[], vector2: number[]): number {
    return vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  }

  /**
   * 向量范数
   */
  private vectorNorm(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  /**
   * 寻找相似物品
   */
  private async findSimilarItems(
    targetItemId: string,
    availableContent: TrainingContent[],
    neighborhoodSize: number
  ): Promise<Map<string, number>> {
    
    // 检查缓存
    const cached = this.itemSimilarityCache.get(targetItemId);
    if (cached && this.isCacheValid()) {
      return cached;
    }

    const similarities = new Map<string, number>();
    const targetItem = availableContent.find(c => c.id === targetItemId);
    
    if (!targetItem) {
      return similarities;
    }

    // 计算与其他物品的相似度
    for (const otherItem of availableContent) {
      if (otherItem.id === targetItemId) continue;
      
      const similarity = this.calculateItemSimilarity(targetItem, otherItem);
      if (similarity > 0.3) { // 相似度阈值
        similarities.set(otherItem.id, similarity);
      }
    }

    // 排序并取前N个
    const sortedSimilarities = new Map([...similarities.entries()].sort((a, b) => b[1] - a[1]).slice(0, neighborhoodSize));
    
    // 缓存结果
    this.itemSimilarityCache.set(targetItemId, sortedSimilarities);
    
    return sortedSimilarities;
  }

  /**
   * 计算物品相似度
   */
  private calculateItemSimilarity(item1: TrainingContent, item2: TrainingContent): number {
    let similarity = 0;
    let count = 0;

    // 类型相似度
    if (item1.type === item2.type) {
      similarity += 1;
    }
    count++;

    // 类别相似度
    if (item1.category === item2.category) {
      similarity += 1;
    }
    count++;

    // 难度相似度
    const difficultyDiff = Math.abs(item1.difficulty - item2.difficulty);
    similarity += Math.max(0, 1 - difficultyDiff / 10);
    count++;

    // 标签相似度（Jaccard相似度）
    const tagSet1 = new Set(item1.tags);
    const tagSet2 = new Set(item2.tags);
    const intersection = new Set([...tagSet1].filter(x => tagSet2.has(x)));
    const union = new Set([...tagSet1, ...tagSet2]);
    const tagSimilarity = union.size > 0 ? intersection.size / union.size : 0;
    similarity += tagSimilarity;
    count++;

    // 技能领域相似度
    const skillSet1 = new Set(item1.metadata.skillAreas);
    const skillSet2 = new Set(item2.metadata.skillAreas);
    const skillIntersection = new Set([...skillSet1].filter(x => skillSet2.has(x)));
    const skillUnion = new Set([...skillSet1, ...skillSet2]);
    const skillSimilarity = skillUnion.size > 0 ? skillIntersection.size / skillUnion.size : 0;
    similarity += skillSimilarity;
    count++;

    // 时长相似度
    const timeDiff = Math.abs(item1.metadata.estimatedTime - item2.metadata.estimatedTime);
    const maxTime = Math.max(item1.metadata.estimatedTime, item2.metadata.estimatedTime);
    const timeSimilarity = maxTime > 0 ? 1 - (timeDiff / maxTime) : 1;
    similarity += timeSimilarity;
    count++;

    return count > 0 ? similarity / count : 0;
  }

  /**
   * 矩阵分解（简化SVD实现）
   */
  private async performMatrixFactorization(
    matrix: Map<string, Map<string, number>>,
    params: CollaborativeFilteringParams
  ): Promise<{
    userFactors: Map<string, number[]>,
    itemFactors: Map<string, number[]>
  }> {
    // 这里应该实现真正的矩阵分解算法（如SVD、NMF等）
    // 为了简化，这里返回随机因子向量
    const userFactors = new Map<string, number[]>();
    const itemFactors = new Map<string, number[]>();
    
    const factors = 50; // 因子数量
    
    // 初始化用户因子向量
    for (const userId of matrix.keys()) {
      const vector = Array(factors).fill(0).map(() => Math.random() * 0.1);
      userFactors.set(userId, vector);
    }
    
    // 初始化物品因子向量
    const allItems = new Set<string>();
    for (const userItems of matrix.values()) {
      for (const itemId of userItems.keys()) {
        allItems.add(itemId);
      }
    }
    
    for (const itemId of allItems) {
      const vector = Array(factors).fill(0).map(() => Math.random() * 0.1);
      itemFactors.set(itemId, vector);
    }
    
    // 这里应该实现梯度下降优化
    // 简化版本直接返回初始化的向量
    
    return { userFactors, itemFactors };
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy',
    details: any
  }> {
    try {
      const cacheSize = this.userSimilarityCache.size + this.itemSimilarityCache.size;
      const matrixSize = this.userItemMatrix.size;
      
      return {
        status: 'healthy',
        details: {
          cacheSize,
          matrixSize,
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
  private getCollaborativeParams(request: RecommendationRequest): CollaborativeFilteringParams {
    return {
      method: 'USER_BASED', // 默认基于用户
      minSimilarity: 0.3,
      neighborhoodSize: 20,
      regularization: 0.01
    };
  }

  private calculateImplicitRating(interaction: any): number {
    // 基于用户交互计算隐式评分
    const performance = interaction.performance / 100;
    const completion = interaction.completion / 100;
    const duration = Math.min(1, interaction.duration / 3600); // 最多1小时权重
    
    return performance * 0.5 + completion * 0.3 + duration * 0.2;
  }

  private calculateContentMatch(content: TrainingContent, userProfile: UserSkillProfile): number {
    // 计算内容与用户技能画像的匹配度
    const difficultyMatch = 1 - Math.abs(content.difficulty - userProfile.level / 10) / 10;
    const skillMatch = content.metadata.skillAreas.length > 0 ? 
      content.metadata.skillAreas.filter(skill => 
        userProfile.preferences.focusAreas.includes(skill)
      ).length / content.metadata.skillAreas.length : 0.5;
    
    return difficultyMatch * 0.6 + skillMatch * 0.4;
  }

  private estimateImprovement(content: TrainingContent, userProfile: UserSkillProfile): number {
    // 估计内容对用户技能提升的影响
    const difficultyFactor = Math.max(0, Math.min(1, (content.difficulty - userProfile.level / 10) / 5));
    const skillFactor = content.metadata.skillAreas.filter(skill => 
      userProfile.weaknesses.includes(skill)
    ).length / Math.max(1, content.metadata.skillAreas.length);
    
    return difficultyFactor * 0.6 + skillFactor * 0.4;
  }

  private calculateAdaptiveLevel(content: TrainingContent, userProfile: UserSkillProfile): number {
    // 计算自适应等级
    const levelGap = Math.abs(content.difficulty - userProfile.level / 10);
    return Math.max(1, Math.min(5, 3 - levelGap));
  }

  private hasUserInteractedWith(userId: string, contentId: string): boolean {
    const userMatrix = this.userItemMatrix.get(userId);
    return userMatrix ? userMatrix.has(contentId) : false;
  }

  private async getUserPreferences(userId: string): Promise<Map<string, number>> {
    // 从用户-物品矩阵中获取用户偏好
    return this.userItemMatrix.get(userId) || new Map();
  }

  private async updateUserItemMatrix(userId: string, behaviorData: UserBehaviorData): Promise<void> {
    const userMatrix = new Map<string, number>();
    
    behaviorData.interactions.forEach(interaction => {
      const rating = this.calculateImplicitRating(interaction);
      userMatrix.set(interaction.scenarioType, rating);
    });
    
    this.userItemMatrix.set(userId, userMatrix);
    this.lastCacheUpdate = new Date();
  }

  private async buildRatingMatrix(): Promise<Map<string, Map<string, number>>> {
    return this.userItemMatrix;
  }

  private calculateSharedTraits(userId1: string, userId2: string): string[] {
    // 计算共同特征
    return ['相似技能水平', '相同训练偏好']; // 简化实现
  }

  private isCacheValid(): boolean {
    const cacheAge = Date.now() - this.lastCacheUpdate.getTime();
    return cacheAge < 60 * 60 * 1000; // 1小时缓存有效期
  }

  private async getAllUserProfiles(): Promise<UserSkillProfile[]> {
    // 实现获取所有用户画像的逻辑
    throw new Error('getAllUserProfiles not implemented');
  }

  private async getUserSkillProfile(userId: string): Promise<UserSkillProfile> {
    // 实现获取用户技能画像的逻辑
    throw new Error('getUserSkillProfile not implemented');
  }
}