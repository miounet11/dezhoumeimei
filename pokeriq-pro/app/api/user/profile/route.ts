import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { PersonalizationQueries } from '@/lib/db/queries/personalization-queries';
import { LearningPathQueries } from '@/lib/db/queries/learning-path-queries';
import { RecommendationQueries } from '@/lib/db/queries/recommendation-queries';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get userId from query parameters for development
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'demo-user-id';
    
    console.log(`Fetching profile data for user: ${userId}`);

    // Try to get personalization data from database
    let personalizationData = null;
    let learningPathData = null;
    let recommendationStats = null;

    try {
      // Get personalization data
      const personalization = await PersonalizationQueries.getCompletePersonalizationData(userId);
      
      // Get learning path stats
      const pathStats = await LearningPathQueries.getUserLearningPathStats(userId);
      
      // Get recommendation effectiveness stats
      const recStats = await RecommendationQueries.getRecommendationEffectivenessStats(userId);
      
      if (personalization.profile || personalization.preferences) {
        personalizationData = {
          profile: personalization.profile,
          preferences: personalization.preferences,
          userSkillProfile: personalization.userSkillProfile
        };
      }
      
      if (pathStats.totalPaths > 0) {
        learningPathData = pathStats;
      }
      
      if (recStats.totalRecommendations > 0) {
        recommendationStats = recStats;
      }
    } catch (dbError) {
      console.warn('Could not fetch personalization data from database:', dbError);
      // Continue with demo data
    }
    
    // Base demo user data
    const baseUserData = {
      id: userId,
      username: userId === 'demo-user-id' ? 'DemoUser' : `User_${userId.slice(-6)}`,
      name: '演示用户',
      email: `${userId}@pokeriq.pro`,
      avatar: null,
      level: 5,
      xp: 4500,
      isVip: false,
      vipExpiry: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      loginCount: 1,
      stats: {
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
        trainingHours: 24.0
      },
      ladderRank: {
        currentRank: 'silver',
        rankPoints: 1450,
        totalTests: 8,
        avgScore: 78.5,
        peakRank: 'gold',
        peakPoints: 2100,
        globalPercentile: 75,
        rankPercentile: 35
      },
      companions: [],
      recentAchievements: [
        {
          id: 'ach_1',
          name: '连胜大师',
          description: '连续获胜15场',
          icon: '🔥',
          rarity: 'rare',
          unlockedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          progress: 100
        }
      ],
      recentGames: [
        {
          id: 1,
          gameType: '现金桌',
          buyIn: 200,
          finalStack: 350,
          handsPlayed: 45,
          result: 'win',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          endedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        }
      ]
    };

    // Enhanced response with personalization data
    const responseData = {
      ...baseUserData,
      // Add personalization data if available
      ...(personalizationData && {
        personalization: {
          skillProfile: personalizationData.userSkillProfile ? {
            overallRating: personalizationData.userSkillProfile.overallRating,
            skillDimensions: {
              preflop: personalizationData.userSkillProfile.skillDimensions.preflop.current,
              postflop: personalizationData.userSkillProfile.skillDimensions.postflop.current,
              psychology: personalizationData.userSkillProfile.skillDimensions.psychology.current,
              mathematics: personalizationData.userSkillProfile.skillDimensions.mathematics.current,
              bankroll: personalizationData.userSkillProfile.skillDimensions.bankroll.current,
              tournament: personalizationData.userSkillProfile.skillDimensions.tournament.current
            },
            learningStyle: personalizationData.userSkillProfile.learningStyle,
            weaknessPatterns: personalizationData.userSkillProfile.weaknessPatterns.slice(0, 3), // Top 3 weaknesses
            learningVelocity: personalizationData.userSkillProfile.learningVelocity,
            lastUpdated: personalizationData.userSkillProfile.lastUpdated
          } : null,
          preferences: personalizationData.preferences ? {
            learningStyle: {
              visual: personalizationData.preferences.visualLearner,
              practical: personalizationData.preferences.practicalLearner,
              theoretical: personalizationData.preferences.theoreticalLearner,
              social: personalizationData.preferences.socialLearner
            },
            timeAvailability: personalizationData.preferences.timeAvailability,
            sessionLength: personalizationData.preferences.sessionLength,
            preferredDifficulty: personalizationData.preferences.preferredDifficulty,
            learningGoals: personalizationData.preferences.learningGoals,
            feedbackStyle: personalizationData.preferences.feedbackStyle
          } : null
        }
      }),
      // Add learning path data if available
      ...(learningPathData && {
        learningPaths: {
          stats: learningPathData,
          hasActivePaths: learningPathData.activePaths > 0
        }
      }),
      // Add recommendation stats if available
      ...(recommendationStats && {
        recommendations: {
          stats: {
            totalRecommendations: recommendationStats.totalRecommendations,
            acceptanceRate: Math.round(recommendationStats.acceptanceRate * 100),
            averageRating: Math.round(recommendationStats.averageRating * 10) / 10,
            averageEffectiveness: Math.round(recommendationStats.averageEffectiveness * 100)
          },
          topScenarios: recommendationStats.topPerformingScenarios.slice(0, 3)
        }
      })
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}