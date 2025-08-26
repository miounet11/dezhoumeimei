/**
 * API 路由 - 个性化训练推荐
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersonalizationEngine } from '@/lib/personalization/recommendation-engine';

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

    // 构造用户画像（简化版，实际应从数据库获取）
    const userProfile = {
      userId,
      skillDimensions: {
        preflop: { current: 1000, confidence: 0.3 },
        postflop: { current: 950, confidence: 0.4 },
        psychology: { current: 1100, confidence: 0.6 },
        mathematics: { current: 900, confidence: 0.5 },
        bankroll: { current: 1200, confidence: 0.7 },
        tournament: { current: 800, confidence: 0.2 }
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

    // 构造推荐上下文
    const context = {
      timeAvailable,
      preferredDifficulty,
      focusAreas: searchParams.get('focusAreas')?.split(',') || undefined,
      excludeScenarios: searchParams.get('exclude')?.split(',') || undefined,
      learningGoals: searchParams.get('goals')?.split(',') || undefined
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
    
    // 简化的用户画像
    const userProfile = {
      userId,
      skillDimensions: {
        preflop: { current: 1000, confidence: 0.3 },
        postflop: { current: 950, confidence: 0.4 },
        psychology: { current: 1100, confidence: 0.6 },
        mathematics: { current: 900, confidence: 0.5 },
        bankroll: { current: 1200, confidence: 0.7 },
        tournament: { current: 800, confidence: 0.2 }
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

    const context = {
      timeAvailable: body.timeAvailable || 30,
      preferredDifficulty: body.preferredDifficulty,
      focusAreas: body.focusAreas,
      excludeScenarios: body.excludeScenarios,
      learningGoals: body.learningGoals
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