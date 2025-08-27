/**
 * Personalization System Seed Data
 * 
 * 为个性化系统创建示例数据，包括用户偏好、个性化档案、推荐历史等
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPersonalizationData() {
  console.log('🌱 Seeding personalization data...');

  try {
    // 创建示例用户（如果不存在）
    const demoUserId = 'demo-user-id';
    
    // 确保demo用户存在
    const demoUser = await prisma.user.upsert({
      where: { id: demoUserId },
      update: {},
      create: {
        id: demoUserId,
        email: 'demo@pokeriq.pro',
        password: 'demo_password_hash',
        name: '演示用户',
        username: 'DemoUser',
        role: 'USER',
        level: 5,
        xp: 4500,
        isVip: false,
        loginCount: 1,
        lastLoginAt: new Date()
      }
    });

    console.log(`✅ Demo user created/updated: ${demoUser.email}`);

    // 1. 创建用户偏好设置
    const userPreferences = await prisma.userPreferences.upsert({
      where: { userId: demoUserId },
      update: {},
      create: {
        userId: demoUserId,
        visualLearner: 0.3,
        practicalLearner: 0.4,
        theoreticalLearner: 0.2,
        socialLearner: 0.1,
        learningGoals: ['improve_preflop', 'bankroll_management', 'tournament_play'],
        preferredDifficulty: 3,
        timeAvailability: 45, // 45分钟每日可用时间
        sessionLength: 25,    // 25分钟单次训练
        preferredGameTypes: ['cash', 'tournament'],
        stakesPreference: {
          cash: { min: 1, max: 5, preferred: 2 },
          tournament: { min: 10, max: 100, preferred: 25 }
        },
        positionPreference: {
          favorites: ['BTN', 'CO', 'MP'],
          avoided: ['UTG', 'SB']
        },
        feedbackStyle: 'detailed',
        encouragementLevel: 0.8,
        challengeLevel: 0.6,
        trainingReminders: true,
        weeklyReports: true,
        achievementNotifs: true
      }
    });

    console.log('✅ User preferences created');

    // 2. 创建个性化档案
    const personalizationProfile = await prisma.personalizationProfile.upsert({
      where: { userId: demoUserId },
      update: {},
      create: {
        userId: demoUserId,
        
        // 技能评分 (ELO系统)
        preflopSkill: 1150,
        postflopSkill: 1050,
        psychologySkill: 1200,
        mathematicsSkill: 950,
        bankrollSkill: 1300,
        tournamentSkill: 900,

        // 置信度
        preflopConfidence: 0.7,
        postflopConfidence: 0.6,
        psychologyConfidence: 0.8,
        mathematicsConfidence: 0.5,
        bankrollConfidence: 0.9,
        tournamentConfidence: 0.4,

        // 技能趋势 (正向为提升)
        preflopTrend: 5.2,
        postflopTrend: -2.1,
        psychologyTrend: 8.5,
        mathematicsTrend: 3.3,
        bankrollTrend: 1.8,
        tournamentTrend: 12.4,

        // 综合数据
        overallRating: 1110,
        totalSampleSize: 450,
        dataQuality: 0.75,

        // 弱点模式
        weaknessPatterns: [
          {
            pattern: '过度保守',
            frequency: 0.35,
            severity: 0.6,
            street: 'flop',
            improvementSuggestion: '在翻牌圈需要更加积极，不要过度弃牌优质手牌'
          },
          {
            pattern: '错失价值',
            frequency: 0.28,
            severity: 0.5,
            street: 'river',
            improvementSuggestion: '在河牌阶段要充分提取价值，不要害怕下注强牌'
          },
          {
            pattern: '下注尺度错误',
            frequency: 0.22,
            severity: 0.4,
            street: 'turn',
            improvementSuggestion: '在转牌阶段控制下注尺度，避免吓跑对手'
          }
        ],

        // 强项领域
        strengthAreas: ['position_play', 'bankroll_management', 'opponent_reading'],

        // 学习特性
        learningVelocity: 18.5,
        consistencyScore: 0.72,
        adaptabilityScore: 0.68,
        retentionRate: 0.81,

        // 游戏风格
        playStyle: 'tight-aggressive',
        riskTolerance: 0.6,
        bluffingTendency: 0.25,
        valueExtraction: 0.75
      }
    });

    console.log('✅ Personalization profile created');

    // 3. 创建推荐历史记录
    const recommendationHistoryData = [
      {
        recommendationId: 'rec_001_preflop_ranges',
        title: '翻前开牌范围训练',
        description: '学习不同位置的标准开牌范围，重点改进您的过度保守问题',
        scenario: 'PREFLOP_RANGES',
        difficulty: 2,
        estimatedTime: 30,
        expectedImprovement: 25,
        recommendationReason: '您在翻前阶段经常出现过度保守，建议针对性训练',
        skillFocus: ['preflop', 'psychology'],
        wasAccepted: true,
        userRating: 4,
        completionTime: 28,
        actualImprovement: 22,
        effectiveness: 0.85,
        accuracyScore: 0.78,
        satisfactionScore: 0.82,
        status: 'COMPLETED'
      },
      {
        recommendationId: 'rec_002_value_betting',
        title: '价值下注训练',
        description: '学会识别价值下注机会，选择合适的下注尺度',
        scenario: 'VALUE_BETTING',
        difficulty: 4,
        estimatedTime: 35,
        expectedImprovement: 30,
        recommendationReason: '您经常错失价值，需要提升价值提取能力',
        skillFocus: ['postflop', 'mathematics'],
        wasAccepted: true,
        userRating: 5,
        completionTime: 40,
        actualImprovement: 35,
        effectiveness: 0.92,
        accuracyScore: 0.88,
        satisfactionScore: 0.95,
        status: 'COMPLETED'
      },
      {
        recommendationId: 'rec_003_bankroll_mgmt',
        title: '资金管理训练',
        description: '掌握风险控制和资金分配策略',
        scenario: 'BANKROLL_MANAGEMENT',
        difficulty: 3,
        estimatedTime: 25,
        expectedImprovement: 15,
        recommendationReason: '根据您的强项，进一步巩固资金管理技能',
        skillFocus: ['bankroll', 'mathematics'],
        wasAccepted: true,
        userRating: 3,
        completionTime: 22,
        actualImprovement: 18,
        effectiveness: 0.75,
        accuracyScore: 0.72,
        satisfactionScore: 0.68,
        status: 'COMPLETED'
      },
      {
        recommendationId: 'rec_004_tournament_play',
        title: '锦标赛策略',
        description: '学习锦标赛特有策略，包括ICM和泡沫期游戏',
        scenario: 'TOURNAMENT_PLAY',
        difficulty: 5,
        estimatedTime: 50,
        expectedImprovement: 40,
        recommendationReason: '您的锦标赛技能还有很大提升空间',
        skillFocus: ['tournament', 'mathematics'],
        wasAccepted: false,
        userRating: null,
        status: 'DECLINED'
      },
      {
        recommendationId: 'rec_005_pot_odds',
        title: '底池赔率计算',
        description: '掌握底池赔率和隐含赔率的计算与应用',
        scenario: 'POT_ODDS',
        difficulty: 3,
        estimatedTime: 30,
        expectedImprovement: 20,
        recommendationReason: '提升数学计算能力，改善决策准确性',
        skillFocus: ['mathematics', 'postflop'],
        wasAccepted: true,
        status: 'ACCEPTED'
      }
    ];

    for (const recData of recommendationHistoryData) {
      await prisma.recommendationHistory.create({
        data: {
          userId: demoUserId,
          ...recData,
          userContext: {
            userRating: 1110,
            sessionTime: '2024-01-20T10:00:00Z',
            difficulty: recData.difficulty
          },
          algorithmVersion: '1.0',
          presentedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 过去30天内随机时间
          ...(recData.wasAccepted !== null && { respondedAt: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000) }),
          ...(recData.status === 'COMPLETED' && { completedAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000) })
        }
      });
    }

    console.log('✅ Recommendation history created (5 records)');

    // 4. 创建学习路径
    const learningPath = await prisma.learningPath.create({
      data: {
        userId: demoUserId,
        planId: 'plan_intermediate_improvement_001',
        title: '中级德州扑克技能提升计划',
        description: '针对您当前1110分的水平，重点改善翻前保守和价值提取问题的个性化训练计划',
        targetRating: 1300,
        estimatedDuration: 4, // 4小时总时长
        difficulty: 3,
        
        recommendations: [
          {
            id: 'rec_plan_001',
            title: '翻前范围优化',
            description: '学习标准翻前开牌范围，改善过度保守问题',
            scenario: 'PREFLOP_RANGES',
            difficulty: 2,
            estimatedTime: 25,
            expectedImprovement: 30,
            priority: 0.9,
            reasoning: '您的主要弱点是翻前过度保守',
            skillFocus: ['preflop'],
            learningStyle: ['practical', 'visual']
          },
          {
            id: 'rec_plan_002',
            title: '价值下注精进',
            description: '提升价值提取能力，减少错失价值的情况',
            scenario: 'VALUE_BETTING',
            difficulty: 4,
            estimatedTime: 35,
            expectedImprovement: 35,
            priority: 0.8,
            reasoning: '您经常错失价值，需要专门训练',
            skillFocus: ['postflop', 'mathematics'],
            learningStyle: ['practical', 'theoretical']
          },
          {
            id: 'rec_plan_003',
            title: '位置优势运用',
            description: '深入理解位置价值，最大化位置优势',
            scenario: 'POSITION_PLAY',
            difficulty: 3,
            estimatedTime: 30,
            expectedImprovement: 25,
            priority: 0.7,
            reasoning: '巩固您的强项，进一步提升',
            skillFocus: ['preflop', 'psychology'],
            learningStyle: ['visual', 'practical']
          }
        ],

        milestones: [
          {
            id: 'milestone_001',
            title: '阶段 1: 翻前技能提升',
            description: '完成翻前相关训练，重点提升翻前技能',
            targetSkill: 'preflop',
            targetImprovement: 30,
            estimatedTimeToComplete: 55,
            prerequisites: []
          },
          {
            id: 'milestone_002',
            title: '阶段 2: 翻后价值提取',
            description: '完成价值下注训练，提升翻后技能',
            targetSkill: 'postflop',
            targetImprovement: 60,
            estimatedTimeToComplete: 90,
            prerequisites: ['milestone_001']
          },
          {
            id: 'milestone_003',
            title: '阶段 3: 综合技能整合',
            description: '完成位置游戏训练，整合所有技能',
            targetSkill: 'psychology',
            targetImprovement: 85,
            estimatedTimeToComplete: 120,
            prerequisites: ['milestone_002']
          }
        ],

        totalRecommendations: 3,
        expectedImprovement: 90,
        currentPosition: 1,
        completedRecommendations: 1,
        completionRate: 0.33,
        timeSpent: 28,
        initialRating: 1110,
        currentRating: 1135,
        actualImprovement: 25,
        status: 'ACTIVE',
        priority: 8,
        startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10天前开始
      }
    });

    console.log('✅ Learning path created');

    // 5. 创建AB测试参与记录
    const abTestParticipation = await prisma.aBTestParticipation.create({
      data: {
        userId: demoUserId,
        experimentId: 'rec_algorithm_v2_test',
        experimentName: '推荐算法V2测试',
        variantId: 'B',
        variantName: '增强个性化版本',
        experimentConfig: {
          personalizedWeights: true,
          weaknessBoost: 1.2,
          learningStyleMatching: true,
          adaptiveDifficulty: true
        },
        userSegment: 'intermediate_players',
        allocationMethod: 'skill_based',
        status: 'ACTIVE',
        primaryMetric: {
          acceptanceRate: 0.85,
          completionRate: 0.78,
          satisfactionScore: 4.2
        },
        secondaryMetrics: {
          engagementTime: 127,
          retentionRate: 0.82,
          skillImprovement: 28.5
        },
        conversionEvents: 12,
        engagementScore: 0.79,
        sampleSize: 45,
        dataQuality: 0.92,
        enrolledAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15天前参加
      }
    });

    console.log('✅ AB test participation created');

    // 6. 创建用户统计数据（如果不存在）
    await prisma.userStats.upsert({
      where: { userId: demoUserId },
      update: {},
      create: {
        userId: demoUserId,
        totalHands: 1250,
        totalGames: 89,
        winRate: 68.5,
        totalEarnings: 3240,
        currentStreak: 12,
        bestStreak: 18,
        vpip: 22.4,
        pfr: 18.2,
        af: 2.1,
        threeBet: 8.3,
        cbet: 75.5,
        wtsd: 28.6,
        w_wsf: 45.3,
        redlineEv: 125.6,
        bluelineEv: 89.4,
        allinEv: 67.8,
        trainingHours: 28.5
      }
    });

    console.log('✅ User stats created/updated');

    console.log('🎉 Personalization seed data completed successfully!');
    console.log(`
📊 Created personalization data for demo user:
- User Preferences: Learning style, goals, time availability
- Personalization Profile: Skill ratings, weaknesses, learning velocity  
- Recommendation History: 5 recommendations with different statuses
- Learning Path: Active 3-stage improvement plan
- AB Test: Participating in algorithm enhancement test
- User Stats: Comprehensive poker statistics
    `);

  } catch (error) {
    console.error('❌ Error seeding personalization data:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedPersonalizationData();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  main();
}

export { seedPersonalizationData };