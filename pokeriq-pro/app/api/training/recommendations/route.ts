/**
 * API 路由 - 个性化训练推荐 (Legacy - 建议使用 /api/personalization/recommendations)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersonalizationEngine } from '@/lib/personalization/recommendation-engine';
import { PersonalizationQueries } from '@/lib/db/queries/personalization-queries';

export async function GET(request: NextRequest) {
  try {
    // 获取URL参数
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const timeAvailable = parseInt(searchParams.get('timeAvailable') || '30');
    const preferredDifficulty = searchParams.get('difficulty') ? parseInt(searchParams.get('difficulty')!) : undefined;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 创建推荐引擎实例
    const engine = new PersonalizationEngine();

    // 尝试从数据库获取用户画像
    console.log('Attempting to fetch user profile from database...');
    const personalizationData = await PersonalizationQueries.getCompletePersonalizationData(userId);
    
    // 使用数据库中的用户画像，如果没有则使用默认画像
    const userProfile = personalizationData.userSkillProfile || {
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
        visualLearner: personalizationData.preferences?.visualLearner || 0.4,
        practicalLearner: personalizationData.preferences?.practicalLearner || 0.6,
        theoreticalLearner: personalizationData.preferences?.theoreticalLearner || 0.3,
        socialLearner: personalizationData.preferences?.socialLearner || 0.2
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
      overallRating: personalizationData.profile?.overallRating || 1000
    };

    console.log(`Using ${personalizationData.userSkillProfile ? 'database' : 'default'} user profile`);;

    // 构造推荐上下文，使用用户偏好覆盖默认值
    const context = {
      timeAvailable: personalizationData.preferences?.timeAvailability || timeAvailable,
      preferredDifficulty: personalizationData.preferences?.preferredDifficulty || preferredDifficulty,
      focusAreas: searchParams.get('focusAreas')?.split(',') || undefined,
      excludeScenarios: searchParams.get('exclude')?.split(',') || undefined,
      learningGoals: personalizationData.preferences?.learningGoals.length ? 
        personalizationData.preferences.learningGoals : 
        (searchParams.get('goals')?.split(',') || undefined)
    };

    // 生成推荐
    const recommendations = await engine.generateRecommendations(
      userProfile,
      context,
      5
    );

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
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
        }
      }
    });

  } catch (error) {
    console.error('Training recommendations API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate training recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planDuration = 30 } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const engine = new PersonalizationEngine();
    
    // 尝试从数据库获取用户画像
    console.log('Attempting to fetch user profile from database for training plan...');
    const personalizationData = await PersonalizationQueries.getCompletePersonalizationData(userId);
    
    // 使用数据库中的用户画像，如果没有则使用默认画像
    const userProfile = personalizationData.userSkillProfile || {
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
        visualLearner: personalizationData.preferences?.visualLearner || 0.4,
        practicalLearner: personalizationData.preferences?.practicalLearner || 0.6,
        theoreticalLearner: personalizationData.preferences?.theoreticalLearner || 0.3,
        socialLearner: personalizationData.preferences?.socialLearner || 0.2
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
      overallRating: personalizationData.profile?.overallRating || 1000
    };

    const context = {
      timeAvailable: personalizationData.preferences?.timeAvailability || body.timeAvailable || 30,
      preferredDifficulty: personalizationData.preferences?.preferredDifficulty || body.preferredDifficulty,
      focusAreas: body.focusAreas,
      excludeScenarios: body.excludeScenarios,
      learningGoals: personalizationData.preferences?.learningGoals.length ? 
        personalizationData.preferences.learningGoals : 
        body.learningGoals
    };

    // 生成完整的训练计划
    const trainingPlan = await engine.generateTrainingPlan(
      userProfile,
      context,
      planDuration
    );

    return NextResponse.json({
      success: true,
      data: trainingPlan
    });

  } catch (error) {
    console.error('Training plan API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate training plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}