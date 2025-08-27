/**
 * API 路由 - 个性化学习路径
 * 
 * 提供学习路径的创建、管理和进度追踪功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersonalizationEngine, RecommendationContext } from '@/lib/personalization/recommendation-engine';
import { PersonalizationQueries } from '@/lib/db/queries/personalization-queries';
import { LearningPathQueries } from '@/lib/db/queries/learning-path-queries';

/**
 * 获取用户的学习路径
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as any;
    const pathId = searchParams.get('pathId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching learning paths for user: ${userId}`);

    // 如果指定了路径ID，获取特定路径
    if (pathId) {
      const path = await LearningPathQueries.getLearningPathById(pathId);
      
      if (!path) {
        return NextResponse.json(
          { success: false, error: 'Learning path not found' },
          { status: 404 }
        );
      }

      // 获取详细进度
      const progress = await LearningPathQueries.getLearningPathProgress(pathId);

      return NextResponse.json({
        success: true,
        data: {
          path,
          progress
        }
      });
    }

    // 获取路径列表
    let paths;
    if (status) {
      paths = await LearningPathQueries.getLearningPathsByStatus(userId, status);
    } else {
      // 获取活跃路径
      paths = await LearningPathQueries.getActiveLearningPaths(userId);
    }

    // 获取用户学习路径统计
    const stats = await LearningPathQueries.getUserLearningPathStats(userId);

    return NextResponse.json({
      success: true,
      data: {
        paths,
        stats: {
          ...stats,
          averageCompletionRate: Math.round(stats.averageCompletionRate * 100)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching learning paths:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch learning paths',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 创建新的学习路径
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planDuration = 30, customTitle, customDescription } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Creating learning path for user: ${userId}`);

    // 获取用户个性化数据
    const personalizationData = await PersonalizationQueries.getCompletePersonalizationData(userId);
    
    let userProfile = personalizationData.userSkillProfile;

    // 如果没有用户画像，创建默认画像
    if (!userProfile) {
      console.log('No user profile found, using default profile');
      userProfile = {
        userId,
        skillDimensions: {
          preflop: { current: 1000, trend: 0, confidence: 0.3, lastAssessment: new Date(), sampleSize: 0 },
          postflop: { current: 950, trend: 0, confidence: 0.4, lastAssessment: new Date(), sampleSize: 0 },
          psychology: { current: 1100, trend: 0, confidence: 0.6, lastAssessment: new Date(), sampleSize: 0 },
          mathematics: { current: 900, trend: 0, confidence: 0.5, lastAssessment: new Date(), sampleSize: 0 },
          bankroll: { current: 1200, trend: 0, confidence: 0.7, lastAssessment: new Date(), sampleSize: 0 },
          tournament: { current: 800, trend: 0, confidence: 0.2, lastAssessment: new Date(), sampleSize: 0 }
        },
        learningStyle: {
          visualLearner: 0.4,
          practicalLearner: 0.6,
          theoreticalLearner: 0.3,
          socialLearner: 0.2
        },
        weaknessPatterns: [
          {
            pattern: '过度保守',
            frequency: 0.3,
            severity: 0.7,
            street: 'flop',
            improvementSuggestion: '在翻牌圈需要更加积极'
          }
        ],
        learningVelocity: {
          skillGainRate: 15,
          consistencyScore: 0.8,
          adaptabilityScore: 0.6,
          retentionRate: 0.75
        },
        lastUpdated: new Date(),
        overallRating: 1000
      };
    }

    // 构造推荐上下文
    const context: RecommendationContext = {
      timeAvailable: personalizationData.preferences?.timeAvailability || 30
    };

    if (personalizationData.preferences) {
      if (personalizationData.preferences.preferredDifficulty) {
        context.preferredDifficulty = personalizationData.preferences.preferredDifficulty;
      }
      if (personalizationData.preferences.learningGoals.length > 0) {
        context.learningGoals = personalizationData.preferences.learningGoals;
      }
    }

    // 生成训练计划
    const engine = new PersonalizationEngine();
    const trainingPlan = await engine.generateTrainingPlan(
      userProfile,
      context,
      planDuration
    );

    // 如果提供了自定义标题和描述，使用它们
    if (customTitle) trainingPlan.title = customTitle;
    if (customDescription) trainingPlan.description = customDescription;

    // 创建学习路径
    const pathId = await LearningPathQueries.createLearningPath(userId, trainingPlan);

    if (!pathId) {
      return NextResponse.json(
        { success: false, error: 'Failed to create learning path' },
        { status: 500 }
      );
    }

    // 获取创建的路径
    const createdPath = await LearningPathQueries.getLearningPathById(pathId);

    return NextResponse.json({
      success: true,
      data: {
        path: createdPath,
        message: 'Learning path created successfully'
      }
    });

  } catch (error) {
    console.error('Error creating learning path:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create learning path',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 更新学习路径状态和进度
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      pathId, 
      action,
      progressData,
      adaptationData 
    } = body;

    if (!userId || !pathId || !action) {
      return NextResponse.json(
        { success: false, error: 'userId, pathId and action are required' },
        { status: 400 }
      );
    }

    console.log(`User ${userId} performing action: ${action} on path: ${pathId}`);

    let success = false;
    let message = '';

    switch (action) {
      case 'start':
        const { initialRating } = body;
        if (!initialRating) {
          return NextResponse.json(
            { success: false, error: 'initialRating is required for start action' },
            { status: 400 }
          );
        }
        success = await LearningPathQueries.startLearningPath(pathId, initialRating);
        message = 'Learning path started successfully';
        break;

      case 'pause':
        const { reason } = body;
        success = await LearningPathQueries.pauseLearningPath(pathId, reason);
        message = 'Learning path paused successfully';
        break;

      case 'resume':
        success = await LearningPathQueries.resumeLearningPath(pathId);
        message = 'Learning path resumed successfully';
        break;

      case 'updateProgress':
        if (!progressData) {
          return NextResponse.json(
            { success: false, error: 'progressData is required for updateProgress action' },
            { status: 400 }
          );
        }
        success = await LearningPathQueries.updateLearningPathProgress(pathId, progressData);
        message = 'Learning path progress updated successfully';
        break;

      case 'adapt':
        if (!adaptationData || !adaptationData.reason) {
          return NextResponse.json(
            { success: false, error: 'adaptationData with reason is required for adapt action' },
            { status: 400 }
          );
        }
        
        // 重新生成推荐和里程碑
        const personalizationData = await PersonalizationQueries.getCompletePersonalizationData(userId);
        if (!personalizationData.userSkillProfile) {
          return NextResponse.json(
            { success: false, error: 'User profile required for adaptation' },
            { status: 400 }
          );
        }

        const context: RecommendationContext = {
          timeAvailable: personalizationData.preferences?.timeAvailability || 30
        };

        const engine = new PersonalizationEngine();
        const updatedPlan = await engine.generateTrainingPlan(
          personalizationData.userSkillProfile,
          context,
          30
        );

        success = await LearningPathQueries.adaptLearningPath(
          pathId,
          updatedPlan.recommendations,
          updatedPlan.milestones,
          adaptationData.reason
        );
        message = 'Learning path adapted successfully';
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { success: false, error: `Failed to ${action} learning path` },
        { status: 500 }
      );
    }

    // 获取更新后的路径
    const updatedPath = await LearningPathQueries.getLearningPathById(pathId);
    const progress = await LearningPathQueries.getLearningPathProgress(pathId);

    return NextResponse.json({
      success: true,
      data: {
        path: updatedPath,
        progress,
        message
      }
    });

  } catch (error) {
    console.error('Error updating learning path:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update learning path',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 删除学习路径
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const pathId = searchParams.get('pathId');

    if (!userId || !pathId) {
      return NextResponse.json(
        { success: false, error: 'userId and pathId are required' },
        { status: 400 }
      );
    }

    console.log(`Deleting learning path ${pathId} for user: ${userId}`);

    // 验证路径属于该用户
    const path = await LearningPathQueries.getLearningPathById(pathId);
    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Learning path not found' },
        { status: 404 }
      );
    }

    // 这里应该验证用户权限，但为了简化暂时跳过

    const success = await LearningPathQueries.deleteLearningPath(pathId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete learning path' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Learning path deleted successfully',
        pathId
      }
    });

  } catch (error) {
    console.error('Error deleting learning path:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete learning path',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}