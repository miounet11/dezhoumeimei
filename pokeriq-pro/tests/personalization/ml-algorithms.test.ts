/**
 * 机器学习算法测试
 * 测试个性化推荐算法的准确性和性能
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock算法实现（实际情况下会从相应文件导入）
class CollaborativeFiltering {
  private userItemMatrix: Map<string, Map<string, number>> = new Map();
  private similarities: Map<string, Map<string, number>> = new Map();

  addUserRating(userId: string, itemId: string, rating: number): void {
    if (!this.userItemMatrix.has(userId)) {
      this.userItemMatrix.set(userId, new Map());
    }
    this.userItemMatrix.get(userId)!.set(itemId, rating);
  }

  calculateUserSimilarity(user1: string, user2: string): number {
    const user1Ratings = this.userItemMatrix.get(user1);
    const user2Ratings = this.userItemMatrix.get(user2);
    
    if (!user1Ratings || !user2Ratings) return 0;

    const commonItems = [];
    for (const item of user1Ratings.keys()) {
      if (user2Ratings.has(item)) {
        commonItems.push(item);
      }
    }

    if (commonItems.length === 0) return 0;

    // 计算余弦相似度
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const item of commonItems) {
      const rating1 = user1Ratings.get(item)!;
      const rating2 = user2Ratings.get(item)!;
      
      dotProduct += rating1 * rating2;
      norm1 += rating1 * rating1;
      norm2 += rating2 * rating2;
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return similarity;
  }

  predict(userId: string, itemId: string, k: number = 5): number {
    const userRatings = this.userItemMatrix.get(userId);
    if (!userRatings) return 0;

    // 找到相似用户
    const similarities: Array<[string, number]> = [];
    
    for (const [otherUserId] of this.userItemMatrix) {
      if (otherUserId === userId) continue;
      
      const otherUserRatings = this.userItemMatrix.get(otherUserId);
      if (otherUserRatings?.has(itemId)) {
        const similarity = this.calculateUserSimilarity(userId, otherUserId);
        similarities.push([otherUserId, similarity]);
      }
    }

    // 按相似度排序并取前k个
    similarities.sort((a, b) => b[1] - a[1]);
    const topK = similarities.slice(0, k);

    if (topK.length === 0) return 0;

    // 加权平均预测
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [similarUserId, similarity] of topK) {
      const rating = this.userItemMatrix.get(similarUserId)!.get(itemId)!;
      weightedSum += similarity * rating;
      totalWeight += Math.abs(similarity);
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  getRecommendations(userId: string, numRecommendations: number = 10): Array<[string, number]> {
    const userRatings = this.userItemMatrix.get(userId);
    if (!userRatings) return [];

    const allItems = new Set<string>();
    for (const ratings of this.userItemMatrix.values()) {
      for (const item of ratings.keys()) {
        allItems.add(item);
      }
    }

    const unratedItems = Array.from(allItems).filter(item => !userRatings.has(item));
    
    const predictions: Array<[string, number]> = [];
    for (const item of unratedItems) {
      const prediction = this.predict(userId, item);
      if (prediction > 0) {
        predictions.push([item, prediction]);
      }
    }

    predictions.sort((a, b) => b[1] - a[1]);
    return predictions.slice(0, numRecommendations);
  }
}

class ContentBasedFiltering {
  private itemFeatures: Map<string, number[]> = new Map();
  private userProfiles: Map<string, number[]> = new Map();

  addItem(itemId: string, features: number[]): void {
    this.itemFeatures.set(itemId, [...features]);
  }

  updateUserProfile(userId: string, itemId: string, rating: number): void {
    const itemFeatures = this.itemFeatures.get(itemId);
    if (!itemFeatures) return;

    let userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      userProfile = new Array(itemFeatures.length).fill(0);
      this.userProfiles.set(userId, userProfile);
    }

    // 更新用户画像（简化版本）
    for (let i = 0; i < itemFeatures.length; i++) {
      userProfile[i] += rating * itemFeatures[i];
    }
  }

  calculateItemRelevance(userId: string, itemId: string): number {
    const userProfile = this.userProfiles.get(userId);
    const itemFeatures = this.itemFeatures.get(itemId);
    
    if (!userProfile || !itemFeatures) return 0;

    // 计算余弦相似度
    let dotProduct = 0;
    let userNorm = 0;
    let itemNorm = 0;

    for (let i = 0; i < userProfile.length; i++) {
      dotProduct += userProfile[i] * itemFeatures[i];
      userNorm += userProfile[i] * userProfile[i];
      itemNorm += itemFeatures[i] * itemFeatures[i];
    }

    if (userNorm === 0 || itemNorm === 0) return 0;
    
    return dotProduct / (Math.sqrt(userNorm) * Math.sqrt(itemNorm));
  }

  getRecommendations(userId: string, numRecommendations: number = 10): Array<[string, number]> {
    const recommendations: Array<[string, number]> = [];
    
    for (const [itemId] of this.itemFeatures) {
      const relevance = this.calculateItemRelevance(userId, itemId);
      recommendations.push([itemId, relevance]);
    }

    recommendations.sort((a, b) => b[1] - a[1]);
    return recommendations.slice(0, numRecommendations);
  }
}

class HybridRecommender {
  private collaborativeFilter: CollaborativeFiltering;
  private contentBasedFilter: ContentBasedFiltering;
  private cfWeight: number = 0.6;
  private cbWeight: number = 0.4;

  constructor(cfWeight: number = 0.6) {
    this.collaborativeFilter = new CollaborativeFiltering();
    this.contentBasedFilter = new ContentBasedFiltering();
    this.cfWeight = cfWeight;
    this.cbWeight = 1 - cfWeight;
  }

  trainModel(
    userRatings: Array<{ userId: string; itemId: string; rating: number }>,
    itemFeatures: Array<{ itemId: string; features: number[] }>
  ): void {
    // 训练协同过滤
    for (const { userId, itemId, rating } of userRatings) {
      this.collaborativeFilter.addUserRating(userId, itemId, rating);
    }

    // 训练基于内容的过滤
    for (const { itemId, features } of itemFeatures) {
      this.contentBasedFilter.addItem(itemId, features);
    }

    for (const { userId, itemId, rating } of userRatings) {
      this.contentBasedFilter.updateUserProfile(userId, itemId, rating);
    }
  }

  getRecommendations(userId: string, numRecommendations: number = 10): Array<[string, number]> {
    const cfRecommendations = this.collaborativeFilter.getRecommendations(userId, 20);
    const cbRecommendations = this.contentBasedFilter.getRecommendations(userId, 20);

    // 合并推荐结果
    const combinedScores = new Map<string, number>();

    for (const [itemId, score] of cfRecommendations) {
      combinedScores.set(itemId, (combinedScores.get(itemId) || 0) + this.cfWeight * score);
    }

    for (const [itemId, score] of cbRecommendations) {
      combinedScores.set(itemId, (combinedScores.get(itemId) || 0) + this.cbWeight * score);
    }

    const finalRecommendations = Array.from(combinedScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, numRecommendations);

    return finalRecommendations;
  }

  evaluateModel(testData: Array<{ userId: string; itemId: string; actualRating: number }>): {
    mae: number;
    rmse: number;
    precision: number;
    recall: number;
  } {
    let totalError = 0;
    let totalSquaredError = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (const { userId, itemId, actualRating } of testData) {
      const predictedRating = this.collaborativeFilter.predict(userId, itemId);
      
      const error = Math.abs(predictedRating - actualRating);
      totalError += error;
      totalSquaredError += error * error;

      // 计算精度和召回率（假设评分>=4为正例）
      const actualPositive = actualRating >= 4;
      const predictedPositive = predictedRating >= 4;

      if (actualPositive && predictedPositive) truePositives++;
      if (!actualPositive && predictedPositive) falsePositives++;
      if (actualPositive && !predictedPositive) falseNegatives++;
    }

    const mae = totalError / testData.length;
    const rmse = Math.sqrt(totalSquaredError / testData.length);
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;

    return { mae, rmse, precision, recall };
  }
}

describe('ML算法测试', () => {
  describe('协同过滤算法', () => {
    let cf: CollaborativeFiltering;

    beforeEach(() => {
      cf = new CollaborativeFiltering();
    });

    test('应该正确计算用户相似度', () => {
      cf.addUserRating('user1', 'item1', 5);
      cf.addUserRating('user1', 'item2', 3);
      cf.addUserRating('user1', 'item3', 4);

      cf.addUserRating('user2', 'item1', 4);
      cf.addUserRating('user2', 'item2', 3);
      cf.addUserRating('user2', 'item3', 5);

      const similarity = cf.calculateUserSimilarity('user1', 'user2');
      
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    test('应该处理没有共同项目的用户', () => {
      cf.addUserRating('user1', 'item1', 5);
      cf.addUserRating('user2', 'item2', 4);

      const similarity = cf.calculateUserSimilarity('user1', 'user2');
      
      expect(similarity).toBe(0);
    });

    test('应该生成合理的评分预测', () => {
      // 添加训练数据
      cf.addUserRating('user1', 'item1', 5);
      cf.addUserRating('user1', 'item2', 3);
      cf.addUserRating('user1', 'item3', 4);

      cf.addUserRating('user2', 'item1', 4);
      cf.addUserRating('user2', 'item2', 3);
      cf.addUserRating('user2', 'item4', 5);

      cf.addUserRating('user3', 'item1', 5);
      cf.addUserRating('user3', 'item3', 4);
      cf.addUserRating('user3', 'item4', 4);

      // 预测user1对item4的评分
      const prediction = cf.predict('user1', 'item4', 2);
      
      expect(prediction).toBeGreaterThan(0);
      expect(prediction).toBeLessThanOrEqual(5);
    });

    test('应该生成推荐列表', () => {
      // 添加用户评分数据
      cf.addUserRating('user1', 'item1', 5);
      cf.addUserRating('user1', 'item2', 3);

      cf.addUserRating('user2', 'item1', 4);
      cf.addUserRating('user2', 'item3', 5);
      cf.addUserRating('user2', 'item4', 4);

      cf.addUserRating('user3', 'item2', 2);
      cf.addUserRating('user3', 'item3', 5);
      cf.addUserRating('user3', 'item4', 4);

      const recommendations = cf.getRecommendations('user1', 5);
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      
      // 验证推荐格式
      for (const [itemId, score] of recommendations) {
        expect(typeof itemId).toBe('string');
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThan(0);
      }

      // 验证按分数降序排列
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i][1]).toBeLessThanOrEqual(recommendations[i-1][1]);
      }
    });
  });

  describe('基于内容的过滤算法', () => {
    let cbf: ContentBasedFiltering;

    beforeEach(() => {
      cbf = new ContentBasedFiltering();
    });

    test('应该正确添加项目特征', () => {
      cbf.addItem('item1', [1, 0, 1, 0]);
      cbf.addItem('item2', [0, 1, 0, 1]);

      expect(cbf['itemFeatures'].has('item1')).toBe(true);
      expect(cbf['itemFeatures'].has('item2')).toBe(true);
      expect(cbf['itemFeatures'].get('item1')).toEqual([1, 0, 1, 0]);
    });

    test('应该更新用户画像', () => {
      cbf.addItem('item1', [1, 0, 1, 0]);
      cbf.updateUserProfile('user1', 'item1', 5);

      const userProfile = cbf['userProfiles'].get('user1');
      expect(userProfile).toBeDefined();
      expect(userProfile).toEqual([5, 0, 5, 0]);
    });

    test('应该计算项目相关度', () => {
      cbf.addItem('item1', [1, 0, 1, 0]);
      cbf.addItem('item2', [0, 1, 0, 1]);
      cbf.addItem('item3', [1, 1, 1, 0]);

      cbf.updateUserProfile('user1', 'item1', 5);

      const relevance1 = cbf.calculateItemRelevance('user1', 'item1');
      const relevance2 = cbf.calculateItemRelevance('user1', 'item2');
      const relevance3 = cbf.calculateItemRelevance('user1', 'item3');

      expect(relevance1).toBeGreaterThan(relevance2);
      expect(relevance3).toBeGreaterThan(relevance2);
    });

    test('应该生成基于内容的推荐', () => {
      cbf.addItem('item1', [1, 0, 1, 0]);
      cbf.addItem('item2', [0, 1, 0, 1]);
      cbf.addItem('item3', [1, 1, 1, 0]);
      cbf.addItem('item4', [0, 0, 1, 1]);

      cbf.updateUserProfile('user1', 'item1', 5);
      cbf.updateUserProfile('user1', 'item3', 4);

      const recommendations = cbf.getRecommendations('user1', 3);

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeLessThanOrEqual(3);
      
      // 验证按相关度降序排列
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i][1]).toBeLessThanOrEqual(recommendations[i-1][1]);
      }
    });
  });

  describe('混合推荐算法', () => {
    let hybrid: HybridRecommender;

    beforeEach(() => {
      hybrid = new HybridRecommender(0.6);
    });

    test('应该训练混合模型', () => {
      const userRatings = [
        { userId: 'user1', itemId: 'item1', rating: 5 },
        { userId: 'user1', itemId: 'item2', rating: 3 },
        { userId: 'user2', itemId: 'item1', rating: 4 },
        { userId: 'user2', itemId: 'item3', rating: 5 }
      ];

      const itemFeatures = [
        { itemId: 'item1', features: [1, 0, 1, 0] },
        { itemId: 'item2', features: [0, 1, 0, 1] },
        { itemId: 'item3', features: [1, 1, 1, 0] }
      ];

      expect(() => {
        hybrid.trainModel(userRatings, itemFeatures);
      }).not.toThrow();
    });

    test('应该生成混合推荐', () => {
      const userRatings = [
        { userId: 'user1', itemId: 'item1', rating: 5 },
        { userId: 'user1', itemId: 'item2', rating: 3 },
        { userId: 'user2', itemId: 'item1', rating: 4 },
        { userId: 'user2', itemId: 'item3', rating: 5 },
        { userId: 'user3', itemId: 'item2', rating: 2 },
        { userId: 'user3', itemId: 'item3', rating: 4 }
      ];

      const itemFeatures = [
        { itemId: 'item1', features: [1, 0, 1, 0] },
        { itemId: 'item2', features: [0, 1, 0, 1] },
        { itemId: 'item3', features: [1, 1, 1, 0] },
        { itemId: 'item4', features: [0, 0, 1, 1] }
      ];

      hybrid.trainModel(userRatings, itemFeatures);
      const recommendations = hybrid.getRecommendations('user1', 3);

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    test('应该评估模型性能', () => {
      const userRatings = [
        { userId: 'user1', itemId: 'item1', rating: 5 },
        { userId: 'user1', itemId: 'item2', rating: 3 },
        { userId: 'user2', itemId: 'item1', rating: 4 },
        { userId: 'user2', itemId: 'item3', rating: 5 },
        { userId: 'user3', itemId: 'item2', rating: 2 },
        { userId: 'user3', itemId: 'item3', rating: 4 }
      ];

      const itemFeatures = [
        { itemId: 'item1', features: [1, 0, 1, 0] },
        { itemId: 'item2', features: [0, 1, 0, 1] },
        { itemId: 'item3', features: [1, 1, 1, 0] }
      ];

      const testData = [
        { userId: 'user1', itemId: 'item3', actualRating: 4 },
        { userId: 'user2', itemId: 'item2', actualRating: 3 },
        { userId: 'user3', itemId: 'item1', actualRating: 5 }
      ];

      hybrid.trainModel(userRatings, itemFeatures);
      const metrics = hybrid.evaluateModel(testData);

      expect(metrics).toHaveProperty('mae');
      expect(metrics).toHaveProperty('rmse');
      expect(metrics).toHaveProperty('precision');
      expect(metrics).toHaveProperty('recall');

      expect(metrics.mae).toBeGreaterThanOrEqual(0);
      expect(metrics.rmse).toBeGreaterThanOrEqual(0);
      expect(metrics.precision).toBeGreaterThanOrEqual(0);
      expect(metrics.precision).toBeLessThanOrEqual(1);
      expect(metrics.recall).toBeGreaterThanOrEqual(0);
      expect(metrics.recall).toBeLessThanOrEqual(1);
    });
  });

  describe('算法性能测试', () => {
    test('协同过滤算法应该处理大量数据', () => {
      const cf = new CollaborativeFiltering();
      const startTime = Date.now();

      // 生成测试数据
      for (let i = 1; i <= 100; i++) {
        for (let j = 1; j <= 50; j++) {
          if (Math.random() > 0.7) { // 稀疏矩阵
            cf.addUserRating(`user${i}`, `item${j}`, Math.floor(Math.random() * 5) + 1);
          }
        }
      }

      const recommendations = cf.getRecommendations('user1', 10);
      const endTime = Date.now();

      expect(recommendations.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(5000); // 应该在5秒内完成
    });

    test('基于内容的过滤应该处理高维特征', () => {
      const cbf = new ContentBasedFiltering();
      const featureDim = 100;

      // 添加高维特征项目
      for (let i = 1; i <= 50; i++) {
        const features = Array.from({ length: featureDim }, () => Math.random());
        cbf.addItem(`item${i}`, features);
      }

      // 更新用户画像
      for (let i = 1; i <= 10; i++) {
        cbf.updateUserProfile('user1', `item${i}`, Math.floor(Math.random() * 5) + 1);
      }

      const startTime = Date.now();
      const recommendations = cbf.getRecommendations('user1', 10);
      const endTime = Date.now();

      expect(recommendations.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    test('混合算法应该平衡准确性和多样性', () => {
      const hybrid = new HybridRecommender(0.5);

      // 生成均衡的测试数据
      const userRatings = [];
      const itemFeatures = [];

      for (let i = 1; i <= 20; i++) {
        itemFeatures.push({
          itemId: `item${i}`,
          features: Array.from({ length: 10 }, () => Math.random())
        });
      }

      for (let u = 1; u <= 10; u++) {
        for (let i = 1; i <= 20; i++) {
          if (Math.random() > 0.6) {
            userRatings.push({
              userId: `user${u}`,
              itemId: `item${i}`,
              rating: Math.floor(Math.random() * 5) + 1
            });
          }
        }
      }

      hybrid.trainModel(userRatings, itemFeatures);
      const recommendations = hybrid.getRecommendations('user1', 10);

      // 检查多样性（简单检查：不应该全是相同分数）
      const scores = recommendations.map(r => r[1]);
      const uniqueScores = new Set(scores);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(uniqueScores.size).toBeGreaterThan(1); // 应该有多样性
    });
  });

  describe('边界情况测试', () => {
    test('应该处理空数据集', () => {
      const cf = new CollaborativeFiltering();
      const recommendations = cf.getRecommendations('user1', 10);
      
      expect(recommendations).toEqual([]);
    });

    test('应该处理单个用户', () => {
      const cf = new CollaborativeFiltering();
      cf.addUserRating('user1', 'item1', 5);
      
      const recommendations = cf.getRecommendations('user1', 10);
      
      expect(recommendations).toEqual([]);
    });

    test('应该处理极稀疏数据', () => {
      const cf = new CollaborativeFiltering();
      
      cf.addUserRating('user1', 'item1', 5);
      cf.addUserRating('user2', 'item2', 4);
      cf.addUserRating('user3', 'item3', 3);
      
      const recommendations = cf.getRecommendations('user1', 10);
      
      expect(recommendations).toEqual([]);
    });

    test('应该处理零向量特征', () => {
      const cbf = new ContentBasedFiltering();
      
      cbf.addItem('item1', [0, 0, 0, 0]);
      cbf.updateUserProfile('user1', 'item1', 5);
      
      const relevance = cbf.calculateItemRelevance('user1', 'item1');
      expect(relevance).toBe(0);
    });
  });

  describe('算法公平性测试', () => {
    test('协同过滤不应该过度偏向热门项目', () => {
      const cf = new CollaborativeFiltering();
      
      // 创建一个热门项目和一个冷门项目
      const popularItem = 'item_popular';
      const nicheLitem = 'item_niche';
      
      // 大部分用户喜欢热门项目
      for (let i = 1; i <= 50; i++) {
        cf.addUserRating(`user${i}`, popularItem, 5);
      }
      
      // 少数用户喜欢冷门项目，但评分更高
      for (let i = 1; i <= 3; i++) {
        cf.addUserRating(`user${i}`, nicheLitem, 5);
        cf.addUserRating(`user${i}`, 'item_other', 2); // 降低热门项目的相对评分
      }
      
      const recommendations = cf.getRecommendations('user1', 10);
      
      // 冷门项目应该也能被推荐
      const nicheRecommended = recommendations.some(r => r[0] === nicheLitem);
      expect(nicheRecommended).toBe(true);
    });

    test('基于内容的过滤应该避免过滤泡沫', () => {
      const cbf = new ContentBasedFiltering();
      
      // 添加不同类型的项目
      cbf.addItem('item1', [1, 0, 0]); // 类型A
      cbf.addItem('item2', [1, 0, 0]); // 类型A
      cbf.addItem('item3', [0, 1, 0]); // 类型B
      cbf.addItem('item4', [0, 0, 1]); // 类型C
      
      // 用户主要喜欢类型A
      cbf.updateUserProfile('user1', 'item1', 5);
      cbf.updateUserProfile('user1', 'item2', 4);
      
      const recommendations = cbf.getRecommendations('user1', 4);
      
      // 应该推荐不同类型的项目，而不仅仅是类型A
      const recommendedTypes = new Set();
      for (const [itemId] of recommendations) {
        const features = cbf['itemFeatures'].get(itemId);
        if (features) {
          const type = features.findIndex(f => f > 0);
          recommendedTypes.add(type);
        }
      }
      
      expect(recommendedTypes.size).toBeGreaterThan(1);
    });
  });
});