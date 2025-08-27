/**
 * 推荐系统数据库查询 - Recommendation Database Queries
 * 
 * 提供推荐历史、推荐效果追踪等相关的数据库操作
 */

import { PrismaClient, RecommendationStatus } from '@prisma/client';
import { TrainingRecommendation } from '@/lib/personalization/recommendation-engine';

const prisma = new PrismaClient();

// 推荐历史接口
export interface RecommendationHistoryData {
  id: string;
  recommendationId: string;
  title: string;
  description: string;
  scenario: string;
  difficulty: number;
  estimatedTime: number;
  expectedImprovement: number;
  recommendationReason: string;
  skillFocus: string[];
  userContext: Record<string, any>;
  algorithmVersion: string;
  status: RecommendationStatus;
  wasAccepted?: boolean;
  userRating?: number;
  completionTime?: number;
  actualImprovement?: number;
  effectiveness?: number;
  accuracyScore?: number;
  satisfactionScore?: number;
  presentedAt: Date;
  respondedAt?: Date;
  completedAt?: Date;
}

// 推荐效果统计接口
export interface RecommendationEffectivenessStats {
  totalRecommendations: number;
  acceptanceRate: number;
  completionRate: number;
  averageRating: number;
  averageEffectiveness: number;
  averageAccuracy: number;
  averageSatisfaction: number;
  topPerformingScenarios: Array<{
    scenario: string;
    count: number;
    avgEffectiveness: number;
  }>;
  improvementBySkill: Record<string, {
    totalImprovement: number;
    avgImprovement: number;
    count: number;
  }>;
}

/**
 * 推荐查询类
 */
export class RecommendationQueries {

  /**
   * 保存推荐到历史记录
   */
  static async saveRecommendation(
    userId: string,
    recommendation: TrainingRecommendation,
    userContext: Record<string, any> = {},
    algorithmVersion: string = '1.0'
  ): Promise<string | null> {
    try {
      const saved = await prisma.recommendationHistory.create({
        data: {
          userId,
          recommendationId: recommendation.id,
          title: recommendation.title,
          description: recommendation.description,
          scenario: recommendation.scenario,
          difficulty: recommendation.difficulty,
          estimatedTime: recommendation.estimatedTime,
          expectedImprovement: recommendation.expectedImprovement,
          recommendationReason: recommendation.reasoning,
          skillFocus: recommendation.skillFocus,
          userContext,
          algorithmVersion,
          status: 'PENDING'
        }
      });

      return saved.id;
    } catch (error) {
      console.error('Error saving recommendation:', error);
      return null;
    }
  }

  /**
   * 批量保存推荐
   */
  static async saveRecommendations(
    userId: string,
    recommendations: TrainingRecommendation[],
    userContext: Record<string, any> = {},
    algorithmVersion: string = '1.0'
  ): Promise<string[]> {
    try {
      const savedIds: string[] = [];
      
      for (const recommendation of recommendations) {
        const id = await this.saveRecommendation(userId, recommendation, userContext, algorithmVersion);
        if (id) savedIds.push(id);
      }

      return savedIds;
    } catch (error) {
      console.error('Error saving recommendations batch:', error);
      return [];
    }
  }

  /**
   * 更新推荐状态 - 用户接受/拒绝推荐
   */
  static async updateRecommendationResponse(
    recommendationHistoryId: string,
    wasAccepted: boolean,
    userRating?: number
  ): Promise<boolean> {
    try {
      await prisma.recommendationHistory.update({
        where: { id: recommendationHistoryId },
        data: {
          wasAccepted,
          userRating,
          status: wasAccepted ? 'ACCEPTED' : 'DECLINED',
          respondedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating recommendation response:', error);
      return false;
    }
  }

  /**
   * 标记推荐为已完成，记录实际效果
   */
  static async completeRecommendation(
    recommendationHistoryId: string,
    completionData: {
      completionTime: number;
      actualImprovement: number;
      userRating?: number;
      effectiveness?: number;
      accuracyScore?: number;
      satisfactionScore?: number;
    }
  ): Promise<boolean> {
    try {
      await prisma.recommendationHistory.update({
        where: { id: recommendationHistoryId },
        data: {
          ...completionData,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error completing recommendation:', error);
      return false;
    }
  }

  /**
   * 获取用户的推荐历史
   */
  static async getUserRecommendationHistory(
    userId: string,
    limit: number = 20,
    status?: RecommendationStatus
  ): Promise<RecommendationHistoryData[]> {
    try {
      const recommendations = await prisma.recommendationHistory.findMany({
        where: {
          userId,
          ...(status && { status })
        },
        orderBy: { presentedAt: 'desc' },
        take: limit
      });

      return recommendations.map(rec => ({
        id: rec.id,
        recommendationId: rec.recommendationId,
        title: rec.title,
        description: rec.description,
        scenario: rec.scenario,
        difficulty: rec.difficulty,
        estimatedTime: rec.estimatedTime,
        expectedImprovement: rec.expectedImprovement,
        recommendationReason: rec.recommendationReason,
        skillFocus: rec.skillFocus as string[],
        userContext: rec.userContext as Record<string, any>,
        algorithmVersion: rec.algorithmVersion,
        status: rec.status,
        wasAccepted: rec.wasAccepted || undefined,
        userRating: rec.userRating || undefined,
        completionTime: rec.completionTime || undefined,
        actualImprovement: rec.actualImprovement || undefined,
        effectiveness: rec.effectiveness || undefined,
        accuracyScore: rec.accuracyScore || undefined,
        satisfactionScore: rec.satisfactionScore || undefined,
        presentedAt: rec.presentedAt,
        respondedAt: rec.respondedAt || undefined,
        completedAt: rec.completedAt || undefined
      }));
    } catch (error) {
      console.error('Error fetching user recommendation history:', error);
      return [];
    }
  }

  /**
   * 获取待响应的推荐
   */
  static async getPendingRecommendations(userId: string): Promise<RecommendationHistoryData[]> {
    return this.getUserRecommendationHistory(userId, 10, 'PENDING');
  }

  /**
   * 获取推荐效果统计
   */
  static async getRecommendationEffectivenessStats(
    userId: string,
    daysBack: number = 30
  ): Promise<RecommendationEffectivenessStats> {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - daysBack);

      const recommendations = await prisma.recommendationHistory.findMany({
        where: {
          userId,
          presentedAt: { gte: dateFrom }
        }
      });

      if (recommendations.length === 0) {
        return {
          totalRecommendations: 0,
          acceptanceRate: 0,
          completionRate: 0,
          averageRating: 0,
          averageEffectiveness: 0,
          averageAccuracy: 0,
          averageSatisfaction: 0,
          topPerformingScenarios: [],
          improvementBySkill: {}
        };
      }

      const totalRecommendations = recommendations.length;
      const acceptedCount = recommendations.filter(r => r.wasAccepted === true).length;
      const completedCount = recommendations.filter(r => r.status === 'COMPLETED').length;
      
      const ratingsWithValues = recommendations.filter(r => r.userRating !== null);
      const effectivenessWithValues = recommendations.filter(r => r.effectiveness !== null);
      const accuracyWithValues = recommendations.filter(r => r.accuracyScore !== null);
      const satisfactionWithValues = recommendations.filter(r => r.satisfactionScore !== null);

      const acceptanceRate = totalRecommendations > 0 ? acceptedCount / totalRecommendations : 0;
      const completionRate = acceptedCount > 0 ? completedCount / acceptedCount : 0;
      
      const averageRating = ratingsWithValues.length > 0 
        ? ratingsWithValues.reduce((sum, r) => sum + (r.userRating || 0), 0) / ratingsWithValues.length 
        : 0;
      
      const averageEffectiveness = effectivenessWithValues.length > 0
        ? effectivenessWithValues.reduce((sum, r) => sum + (r.effectiveness || 0), 0) / effectivenessWithValues.length
        : 0;

      const averageAccuracy = accuracyWithValues.length > 0
        ? accuracyWithValues.reduce((sum, r) => sum + (r.accuracyScore || 0), 0) / accuracyWithValues.length
        : 0;

      const averageSatisfaction = satisfactionWithValues.length > 0
        ? satisfactionWithValues.reduce((sum, r) => sum + (r.satisfactionScore || 0), 0) / satisfactionWithValues.length
        : 0;

      // 按场景统计效果
      const scenarioStats = new Map<string, { count: number; totalEffectiveness: number }>();
      recommendations.forEach(r => {
        if (r.effectiveness !== null) {
          const existing = scenarioStats.get(r.scenario) || { count: 0, totalEffectiveness: 0 };
          scenarioStats.set(r.scenario, {
            count: existing.count + 1,
            totalEffectiveness: existing.totalEffectiveness + (r.effectiveness || 0)
          });
        }
      });

      const topPerformingScenarios = Array.from(scenarioStats.entries())
        .map(([scenario, stats]) => ({
          scenario,
          count: stats.count,
          avgEffectiveness: stats.totalEffectiveness / stats.count
        }))
        .sort((a, b) => b.avgEffectiveness - a.avgEffectiveness)
        .slice(0, 5);

      // 按技能统计提升
      const improvementBySkill: Record<string, { totalImprovement: number; avgImprovement: number; count: number }> = {};
      recommendations.forEach(r => {
        if (r.actualImprovement !== null && r.skillFocus) {
          const skillFocus = r.skillFocus as string[];
          skillFocus.forEach(skill => {
            if (!improvementBySkill[skill]) {
              improvementBySkill[skill] = { totalImprovement: 0, avgImprovement: 0, count: 0 };
            }
            improvementBySkill[skill].totalImprovement += r.actualImprovement || 0;
            improvementBySkill[skill].count++;
            improvementBySkill[skill].avgImprovement = improvementBySkill[skill].totalImprovement / improvementBySkill[skill].count;
          });
        }
      });

      return {
        totalRecommendations,
        acceptanceRate,
        completionRate,
        averageRating,
        averageEffectiveness,
        averageAccuracy,
        averageSatisfaction,
        topPerformingScenarios,
        improvementBySkill
      };
    } catch (error) {
      console.error('Error calculating recommendation effectiveness stats:', error);
      return {
        totalRecommendations: 0,
        acceptanceRate: 0,
        completionRate: 0,
        averageRating: 0,
        averageEffectiveness: 0,
        averageAccuracy: 0,
        averageSatisfaction: 0,
        topPerformingScenarios: [],
        improvementBySkill: {}
      };
    }
  }

  /**
   * 获取推荐算法效果对比
   */
  static async getAlgorithmPerformanceComparison(
    userId: string,
    daysBack: number = 30
  ): Promise<Record<string, {
    totalRecommendations: number;
    acceptanceRate: number;
    averageEffectiveness: number;
    averageRating: number;
  }>> {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - daysBack);

      const recommendations = await prisma.recommendationHistory.findMany({
        where: {
          userId,
          presentedAt: { gte: dateFrom }
        }
      });

      const algorithmStats: Record<string, any> = {};

      recommendations.forEach(r => {
        const version = r.algorithmVersion;
        if (!algorithmStats[version]) {
          algorithmStats[version] = {
            total: 0,
            accepted: 0,
            totalEffectiveness: 0,
            effectivenessCount: 0,
            totalRating: 0,
            ratingCount: 0
          };
        }

        const stats = algorithmStats[version];
        stats.total++;
        
        if (r.wasAccepted === true) stats.accepted++;
        if (r.effectiveness !== null) {
          stats.totalEffectiveness += r.effectiveness;
          stats.effectivenessCount++;
        }
        if (r.userRating !== null) {
          stats.totalRating += r.userRating;
          stats.ratingCount++;
        }
      });

      const result: Record<string, any> = {};
      Object.entries(algorithmStats).forEach(([version, stats]: [string, any]) => {
        result[version] = {
          totalRecommendations: stats.total,
          acceptanceRate: stats.total > 0 ? stats.accepted / stats.total : 0,
          averageEffectiveness: stats.effectivenessCount > 0 ? stats.totalEffectiveness / stats.effectivenessCount : 0,
          averageRating: stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0
        };
      });

      return result;
    } catch (error) {
      console.error('Error calculating algorithm performance comparison:', error);
      return {};
    }
  }

  /**
   * 标记过期的推荐
   */
  static async markExpiredRecommendations(hoursToExpiry: number = 72): Promise<number> {
    try {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() - hoursToExpiry);

      const result = await prisma.recommendationHistory.updateMany({
        where: {
          status: 'PENDING',
          presentedAt: { lt: expiryDate }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error marking expired recommendations:', error);
      return 0;
    }
  }

  /**
   * 获取场景推荐成功率
   */
  static async getScenarioSuccessRates(
    userId?: string,
    daysBack: number = 30
  ): Promise<Record<string, {
    totalCount: number;
    acceptanceRate: number;
    completionRate: number;
    avgEffectiveness: number;
  }>> {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - daysBack);

      const whereClause: any = { presentedAt: { gte: dateFrom } };
      if (userId) whereClause.userId = userId;

      const recommendations = await prisma.recommendationHistory.findMany({
        where: whereClause
      });

      const scenarioStats: Record<string, any> = {};

      recommendations.forEach(r => {
        const scenario = r.scenario;
        if (!scenarioStats[scenario]) {
          scenarioStats[scenario] = {
            total: 0,
            accepted: 0,
            completed: 0,
            totalEffectiveness: 0,
            effectivenessCount: 0
          };
        }

        const stats = scenarioStats[scenario];
        stats.total++;
        
        if (r.wasAccepted === true) {
          stats.accepted++;
          if (r.status === 'COMPLETED') stats.completed++;
        }
        
        if (r.effectiveness !== null) {
          stats.totalEffectiveness += r.effectiveness;
          stats.effectivenessCount++;
        }
      });

      const result: Record<string, any> = {};
      Object.entries(scenarioStats).forEach(([scenario, stats]: [string, any]) => {
        result[scenario] = {
          totalCount: stats.total,
          acceptanceRate: stats.total > 0 ? stats.accepted / stats.total : 0,
          completionRate: stats.accepted > 0 ? stats.completed / stats.accepted : 0,
          avgEffectiveness: stats.effectivenessCount > 0 ? stats.totalEffectiveness / stats.effectivenessCount : 0
        };
      });

      return result;
    } catch (error) {
      console.error('Error calculating scenario success rates:', error);
      return {};
    }
  }

  /**
   * 清理方法 - 关闭数据库连接
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export default RecommendationQueries;