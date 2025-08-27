/**
 * API 路由 - 个性化推荐系统
 * 
 * 提供基于数据库的个性化训练推荐功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersonalizationEngine, RecommendationContext } from '@/lib/personalization/recommendation-engine';
import { PersonalizationQueries } from '@/lib/db/queries/personalization-queries';
import { RecommendationQueries } from '@/lib/db/queries/recommendation-queries';

/**
 * 获取个性化推荐
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const timeAvailable = parseInt(searchParams.get('timeAvailable') || '30');
    const preferredDifficulty = searchParams.get('difficulty') ? parseInt(searchParams.get('difficulty')!) : undefined;
    const count = parseInt(searchParams.get('count') || '5');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Generating recommendations for user: ${userId}`);

    // 获取用户完整个性化数据
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
      timeAvailable,
      preferredDifficulty,
      focusAreas: searchParams.get('focusAreas')?.split(',') || undefined,
      excludeScenarios: searchParams.get('exclude')?.split(',') || undefined,
      learningGoals: searchParams.get('goals')?.split(',') || undefined
    };

    // 使用偏好设置覆盖上下文
    if (personalizationData.preferences) {
      context.timeAvailable = personalizationData.preferences.timeAvailability;
      if (personalizationData.preferences.preferredDifficulty) {
        context.preferredDifficulty = personalizationData.preferences.preferredDifficulty;
      }
      if (personalizationData.preferences.learningGoals.length > 0) {
        context.learningGoals = personalizationData.preferences.learningGoals;
      }
    }

    // 生成推荐
    const engine = new PersonalizationEngine();
    const recommendations = await engine.generateRecommendations(
      userProfile,
      context,
      count
    );

    // 保存推荐到数据库
    const savedIds = await RecommendationQueries.saveRecommendations(
      userId,
      recommendations,
      { context, userProfile: { overallRating: userProfile.overallRating } },
      '1.0'
    );

    console.log(`Generated ${recommendations.length} recommendations, saved ${savedIds.length} to database`);

    // 获取推荐历史统计
    const recommendationStats = await RecommendationQueries.getRecommendationEffectivenessStats(userId);

    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendations.map((rec, index) => ({
          ...rec,
          historyId: savedIds[index] || null // 数据库中的历史记录ID
        })),
        userProfile: {
          userId: userProfile.userId,
          overallRating: userProfile.overallRating,
          strongestSkill: Object.entries(userProfile.skillDimensions)
            .reduce((a, b) => a[1].current > b[1].current ? a : b)[0],
          weakestSkill: Object.entries(userProfile.skillDimensions)
            .reduce((a, b) => a[1].current < b[1].current ? a : b)[0],
          primaryLearningStyle: Object.entries(userProfile.learningStyle)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0].replace('Learner', ''),
          mainWeakness: userProfile.weaknessPatterns[0]?.pattern || '无特定弱点'
        },
        context,
        stats: {
          totalRecommendations: recommendationStats.totalRecommendations,
          acceptanceRate: Math.round(recommendationStats.acceptanceRate * 100),
          averageRating: Math.round(recommendationStats.averageRating * 10) / 10
        }
      }
    });

  } catch (error) {
    console.error('Personalization recommendations API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate personalized recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 用户对推荐的反馈 (接受/拒绝)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, historyId, action, rating } = body;

    if (!userId || !historyId || !action) {
      return NextResponse.json(
        { success: false, error: 'userId, historyId and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be either "accept" or "decline"' },
        { status: 400 }
      );
    }

    console.log(`User ${userId} ${action}ed recommendation ${historyId}`);

    const wasAccepted = action === 'accept';
    const success = await RecommendationQueries.updateRecommendationResponse(
      historyId,
      wasAccepted,
      rating
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update recommendation response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Recommendation ${action}ed successfully`,
        historyId,
        wasAccepted,
        rating: rating || null
      }
    });

  } catch (error) {
    console.error('Error updating recommendation response:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update recommendation response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 标记推荐为已完成，提供效果反馈
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      historyId, 
      completionTime, 
      actualImprovement,
      userRating,
      effectiveness,
      accuracyScore,
      satisfactionScore 
    } = body;

    if (!userId || !historyId || completionTime === undefined || actualImprovement === undefined) {
      return NextResponse.json(
        { success: false, error: 'userId, historyId, completionTime and actualImprovement are required' },
        { status: 400 }
      );
    }

    console.log(`User ${userId} completed recommendation ${historyId}`);

    const success = await RecommendationQueries.completeRecommendation(historyId, {
      completionTime,
      actualImprovement,
      userRating,
      effectiveness,
      accuracyScore,
      satisfactionScore
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to complete recommendation' },
        { status: 500 }
      );
    }

    // 获取更新后的统计数据
    const stats = await RecommendationQueries.getRecommendationEffectivenessStats(userId);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Recommendation completed successfully',
        historyId,
        completionData: {
          completionTime,
          actualImprovement,
          userRating,
          effectiveness,
          accuracyScore,
          satisfactionScore
        },
        updatedStats: {
          totalRecommendations: stats.totalRecommendations,
          averageRating: Math.round(stats.averageRating * 10) / 10,
          averageEffectiveness: Math.round(stats.averageEffectiveness * 100)
        }
      }
    });

  } catch (error) {
    console.error('Error completing recommendation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete recommendation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取推荐历史和统计
 */
export async function GET_HISTORY(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as any;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 获取推荐历史
    const history = await RecommendationQueries.getUserRecommendationHistory(userId, limit, status);
    
    // 获取统计数据
    const stats = await RecommendationQueries.getRecommendationEffectivenessStats(userId);
    
    // 获取场景成功率
    const scenarioSuccessRates = await RecommendationQueries.getScenarioSuccessRates(userId);

    return NextResponse.json({
      success: true,
      data: {
        history,
        stats: {
          ...stats,
          acceptanceRate: Math.round(stats.acceptanceRate * 100),
          completionRate: Math.round(stats.completionRate * 100),
          averageRating: Math.round(stats.averageRating * 10) / 10,
          averageEffectiveness: Math.round(stats.averageEffectiveness * 100)
        },
        scenarioSuccessRates: Object.entries(scenarioSuccessRates).map(([scenario, data]) => ({
          scenario,
          ...data,
          acceptanceRate: Math.round(data.acceptanceRate * 100),
          completionRate: Math.round(data.completionRate * 100),
          avgEffectiveness: Math.round(data.avgEffectiveness * 100)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching recommendation history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recommendation history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}