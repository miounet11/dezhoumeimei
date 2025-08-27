/**
 * 学习路径数据库查询 - Learning Path Database Queries
 * 
 * 提供个性化学习路径、进度追踪等相关的数据库操作
 */

import { PrismaClient, LearningPathStatus } from '@prisma/client';
import { PersonalizedTrainingPlan, TrainingRecommendation, PlanMilestone } from '@/lib/personalization/recommendation-engine';

const prisma = new PrismaClient();

// 学习路径数据接口
export interface LearningPathData {
  id: string;
  planId: string;
  title: string;
  description: string;
  targetRating: number;
  estimatedDuration: number;
  difficulty: number;
  recommendations: TrainingRecommendation[];
  milestones: PlanMilestone[];
  currentPosition: number;
  completedRecommendations: number;
  totalRecommendations: number;
  completionRate: number;
  timeSpent: number;
  initialRating?: number;
  currentRating?: number;
  actualImprovement?: number;
  expectedImprovement: number;
  adaptationCount: number;
  lastAdaptation?: Date;
  adaptationReason?: string;
  status: LearningPathStatus;
  priority: number;
  isCustom: boolean;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

// 学习路径进度接口
export interface LearningPathProgress {
  pathId: string;
  completionRate: number;
  currentMilestone: PlanMilestone | null;
  nextMilestone: PlanMilestone | null;
  completedMilestones: number;
  totalMilestones: number;
  estimatedTimeRemaining: number;
  skillImprovement: Record<string, number>;
  recentActivity: Array<{
    date: Date;
    activity: string;
    progress: number;
  }>;
}

/**
 * 学习路径查询类
 */
export class LearningPathQueries {

  /**
   * 创建学习路径
   */
  static async createLearningPath(
    userId: string,
    trainingPlan: PersonalizedTrainingPlan
  ): Promise<string | null> {
    try {
      const learningPath = await prisma.learningPath.create({
        data: {
          userId,
          planId: trainingPlan.planId,
          title: trainingPlan.title,
          description: trainingPlan.description,
          targetRating: 0, // Will be calculated based on expected improvement
          estimatedDuration: Math.round(trainingPlan.estimatedDuration),
          difficulty: trainingPlan.difficulty,
          recommendations: trainingPlan.recommendations,
          milestones: trainingPlan.milestones,
          totalRecommendations: trainingPlan.recommendations.length,
          expectedImprovement: Math.round(trainingPlan.expectedOverallImprovement),
          status: 'ACTIVE'
        }
      });

      return learningPath.id;
    } catch (error) {
      console.error('Error creating learning path:', error);
      return null;
    }
  }

  /**
   * 获取用户的活跃学习路径
   */
  static async getActiveLearningPaths(userId: string): Promise<LearningPathData[]> {
    return this.getLearningPathsByStatus(userId, 'ACTIVE');
  }

  /**
   * 按状态获取学习路径
   */
  static async getLearningPathsByStatus(
    userId: string, 
    status: LearningPathStatus
  ): Promise<LearningPathData[]> {
    try {
      const paths = await prisma.learningPath.findMany({
        where: {
          userId,
          status
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return paths.map(path => ({
        id: path.id,
        planId: path.planId,
        title: path.title,
        description: path.description,
        targetRating: path.targetRating,
        estimatedDuration: path.estimatedDuration,
        difficulty: path.difficulty,
        recommendations: path.recommendations as TrainingRecommendation[],
        milestones: path.milestones as PlanMilestone[],
        currentPosition: path.currentPosition,
        completedRecommendations: path.completedRecommendations,
        totalRecommendations: path.totalRecommendations,
        completionRate: path.completionRate,
        timeSpent: path.timeSpent,
        initialRating: path.initialRating || undefined,
        currentRating: path.currentRating || undefined,
        actualImprovement: path.actualImprovement || undefined,
        expectedImprovement: path.expectedImprovement,
        adaptationCount: path.adaptationCount,
        lastAdaptation: path.lastAdaptation || undefined,
        adaptationReason: path.adaptationReason || undefined,
        status: path.status,
        priority: path.priority,
        isCustom: path.isCustom,
        createdAt: path.createdAt,
        startedAt: path.startedAt || undefined,
        completedAt: path.completedAt || undefined,
        updatedAt: path.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      return [];
    }
  }

  /**
   * 获取特定学习路径
   */
  static async getLearningPathById(pathId: string): Promise<LearningPathData | null> {
    try {
      const path = await prisma.learningPath.findUnique({
        where: { id: pathId }
      });

      if (!path) return null;

      return {
        id: path.id,
        planId: path.planId,
        title: path.title,
        description: path.description,
        targetRating: path.targetRating,
        estimatedDuration: path.estimatedDuration,
        difficulty: path.difficulty,
        recommendations: path.recommendations as TrainingRecommendation[],
        milestones: path.milestones as PlanMilestone[],
        currentPosition: path.currentPosition,
        completedRecommendations: path.completedRecommendations,
        totalRecommendations: path.totalRecommendations,
        completionRate: path.completionRate,
        timeSpent: path.timeSpent,
        initialRating: path.initialRating || undefined,
        currentRating: path.currentRating || undefined,
        actualImprovement: path.actualImprovement || undefined,
        expectedImprovement: path.expectedImprovement,
        adaptationCount: path.adaptationCount,
        lastAdaptation: path.lastAdaptation || undefined,
        adaptationReason: path.adaptationReason || undefined,
        status: path.status,
        priority: path.priority,
        isCustom: path.isCustom,
        createdAt: path.createdAt,
        startedAt: path.startedAt || undefined,
        completedAt: path.completedAt || undefined,
        updatedAt: path.updatedAt
      };
    } catch (error) {
      console.error('Error fetching learning path:', error);
      return null;
    }
  }

  /**
   * 开始学习路径
   */
  static async startLearningPath(
    pathId: string,
    initialRating: number
  ): Promise<boolean> {
    try {
      await prisma.learningPath.update({
        where: { id: pathId },
        data: {
          startedAt: new Date(),
          initialRating,
          currentRating: initialRating,
          status: 'ACTIVE'
        }
      });

      return true;
    } catch (error) {
      console.error('Error starting learning path:', error);
      return false;
    }
  }

  /**
   * 更新学习路径进度
   */
  static async updateLearningPathProgress(
    pathId: string,
    progressData: {
      currentPosition?: number;
      completedRecommendations?: number;
      timeSpent?: number;
      currentRating?: number;
    }
  ): Promise<boolean> {
    try {
      const path = await this.getLearningPathById(pathId);
      if (!path) return false;

      const newCompletedRecommendations = progressData.completedRecommendations ?? path.completedRecommendations;
      const completionRate = newCompletedRecommendations / path.totalRecommendations;
      const newTimeSpent = progressData.timeSpent ?? path.timeSpent;
      
      // 计算实际提升
      let actualImprovement: number | undefined = undefined;
      if (progressData.currentRating && path.initialRating) {
        actualImprovement = progressData.currentRating - path.initialRating;
      }

      const updateData: any = {
        ...progressData,
        completionRate,
        ...(actualImprovement !== undefined && { actualImprovement })
      };

      // 如果完成度达到100%，标记为完成
      if (completionRate >= 1.0) {
        updateData.status = 'COMPLETED';
        updateData.completedAt = new Date();
      }

      await prisma.learningPath.update({
        where: { id: pathId },
        data: updateData
      });

      return true;
    } catch (error) {
      console.error('Error updating learning path progress:', error);
      return false;
    }
  }

  /**
   * 暂停学习路径
   */
  static async pauseLearningPath(pathId: string, reason?: string): Promise<boolean> {
    try {
      await prisma.learningPath.update({
        where: { id: pathId },
        data: {
          status: 'PAUSED',
          adaptationReason: reason,
          lastAdaptation: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error pausing learning path:', error);
      return false;
    }
  }

  /**
   * 恢复学习路径
   */
  static async resumeLearningPath(pathId: string): Promise<boolean> {
    try {
      await prisma.learningPath.update({
        where: { id: pathId },
        data: {
          status: 'ACTIVE'
        }
      });

      return true;
    } catch (error) {
      console.error('Error resuming learning path:', error);
      return false;
    }
  }

  /**
   * 适应性调整学习路径
   */
  static async adaptLearningPath(
    pathId: string,
    newRecommendations: TrainingRecommendation[],
    newMilestones: PlanMilestone[],
    reason: string
  ): Promise<boolean> {
    try {
      const path = await this.getLearningPathById(pathId);
      if (!path) return false;

      await prisma.learningPath.update({
        where: { id: pathId },
        data: {
          recommendations: newRecommendations,
          milestones: newMilestones,
          totalRecommendations: newRecommendations.length,
          adaptationCount: path.adaptationCount + 1,
          lastAdaptation: new Date(),
          adaptationReason: reason,
          // 重新计算完成率
          completionRate: path.completedRecommendations / newRecommendations.length
        }
      });

      return true;
    } catch (error) {
      console.error('Error adapting learning path:', error);
      return false;
    }
  }

  /**
   * 获取学习路径详细进度
   */
  static async getLearningPathProgress(pathId: string): Promise<LearningPathProgress | null> {
    try {
      const path = await this.getLearningPathById(pathId);
      if (!path) return null;

      // 找到当前里程碑
      let currentMilestone: PlanMilestone | null = null;
      let nextMilestone: PlanMilestone | null = null;
      let completedMilestones = 0;

      for (let i = 0; i < path.milestones.length; i++) {
        const milestone = path.milestones[i];
        const milestoneCompleted = path.currentPosition >= milestone.estimatedTimeToComplete;
        
        if (milestoneCompleted) {
          completedMilestones++;
        } else if (!currentMilestone) {
          currentMilestone = milestone;
          nextMilestone = path.milestones[i + 1] || null;
          break;
        }
      }

      // 估算剩余时间
      const totalEstimatedTime = path.estimatedDuration * 60; // 转换为分钟
      const estimatedTimeRemaining = Math.max(0, totalEstimatedTime - path.timeSpent);

      // 计算技能提升 (简化版)
      const skillImprovement: Record<string, number> = {};
      if (path.currentRating && path.initialRating) {
        const totalImprovement = path.currentRating - path.initialRating;
        // 平均分配到不同技能 (实际应该根据推荐内容计算)
        const skillCount = 6; // preflop, postflop, psychology, mathematics, bankroll, tournament
        const avgImprovement = totalImprovement / skillCount;
        
        skillImprovement.preflop = avgImprovement;
        skillImprovement.postflop = avgImprovement;
        skillImprovement.psychology = avgImprovement;
        skillImprovement.mathematics = avgImprovement;
        skillImprovement.bankroll = avgImprovement;
        skillImprovement.tournament = avgImprovement;
      }

      // 简化的近期活动记录
      const recentActivity = [
        {
          date: path.updatedAt,
          activity: `完成了 ${path.completedRecommendations} / ${path.totalRecommendations} 个训练推荐`,
          progress: path.completionRate * 100
        }
      ];

      return {
        pathId: path.id,
        completionRate: path.completionRate,
        currentMilestone,
        nextMilestone,
        completedMilestones,
        totalMilestones: path.milestones.length,
        estimatedTimeRemaining,
        skillImprovement,
        recentActivity
      };
    } catch (error) {
      console.error('Error fetching learning path progress:', error);
      return null;
    }
  }

  /**
   * 获取用户学习路径统计
   */
  static async getUserLearningPathStats(userId: string): Promise<{
    totalPaths: number;
    activePaths: number;
    completedPaths: number;
    pausedPaths: number;
    averageCompletionRate: number;
    totalTimeSpent: number;
    totalSkillImprovement: number;
  }> {
    try {
      const allPaths = await prisma.learningPath.findMany({
        where: { userId }
      });

      const totalPaths = allPaths.length;
      const activePaths = allPaths.filter(p => p.status === 'ACTIVE').length;
      const completedPaths = allPaths.filter(p => p.status === 'COMPLETED').length;
      const pausedPaths = allPaths.filter(p => p.status === 'PAUSED').length;

      const totalCompletionRate = allPaths.reduce((sum, p) => sum + p.completionRate, 0);
      const averageCompletionRate = totalPaths > 0 ? totalCompletionRate / totalPaths : 0;

      const totalTimeSpent = allPaths.reduce((sum, p) => sum + p.timeSpent, 0);
      
      const totalSkillImprovement = allPaths
        .filter(p => p.actualImprovement !== null)
        .reduce((sum, p) => sum + (p.actualImprovement || 0), 0);

      return {
        totalPaths,
        activePaths,
        completedPaths,
        pausedPaths,
        averageCompletionRate,
        totalTimeSpent,
        totalSkillImprovement
      };
    } catch (error) {
      console.error('Error fetching user learning path stats:', error);
      return {
        totalPaths: 0,
        activePaths: 0,
        completedPaths: 0,
        pausedPaths: 0,
        averageCompletionRate: 0,
        totalTimeSpent: 0,
        totalSkillImprovement: 0
      };
    }
  }

  /**
   * 删除学习路径
   */
  static async deleteLearningPath(pathId: string): Promise<boolean> {
    try {
      await prisma.learningPath.delete({
        where: { id: pathId }
      });

      return true;
    } catch (error) {
      console.error('Error deleting learning path:', error);
      return false;
    }
  }

  /**
   * 归档已完成的学习路径
   */
  static async archiveCompletedPaths(userId: string, daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.learningPath.updateMany({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { lt: cutoffDate }
        },
        data: {
          status: 'ARCHIVED'
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error archiving completed paths:', error);
      return 0;
    }
  }

  /**
   * 获取推荐成功率最高的路径模板
   */
  static async getTopPerformingPathTemplates(limit: number = 5): Promise<Array<{
    title: string;
    avgCompletionRate: number;
    avgSkillImprovement: number;
    usageCount: number;
  }>> {
    try {
      const paths = await prisma.learningPath.findMany({
        where: {
          status: 'COMPLETED',
          isCustom: false
        }
      });

      const templateStats = new Map<string, {
        completionRates: number[];
        improvements: number[];
        count: number;
      }>();

      paths.forEach(path => {
        const title = path.title;
        if (!templateStats.has(title)) {
          templateStats.set(title, {
            completionRates: [],
            improvements: [],
            count: 0
          });
        }

        const stats = templateStats.get(title)!;
        stats.completionRates.push(path.completionRate);
        if (path.actualImprovement !== null) {
          stats.improvements.push(path.actualImprovement);
        }
        stats.count++;
      });

      const results = Array.from(templateStats.entries())
        .map(([title, stats]) => ({
          title,
          avgCompletionRate: stats.completionRates.reduce((sum, rate) => sum + rate, 0) / stats.completionRates.length,
          avgSkillImprovement: stats.improvements.length > 0 
            ? stats.improvements.reduce((sum, imp) => sum + imp, 0) / stats.improvements.length 
            : 0,
          usageCount: stats.count
        }))
        .filter(result => result.usageCount >= 3) // 至少被使用3次
        .sort((a, b) => b.avgCompletionRate - a.avgCompletionRate)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Error fetching top performing path templates:', error);
      return [];
    }
  }

  /**
   * 清理方法 - 关闭数据库连接
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export default LearningPathQueries;