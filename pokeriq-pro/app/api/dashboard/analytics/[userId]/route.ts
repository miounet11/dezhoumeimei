/**
 * Dashboard Analytics API Endpoint
 * Provides comprehensive learning analytics data for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnalyticsService } from '@/lib/dashboard/analytics-service';
import { AggregationsService } from '@/lib/dashboard/aggregations';
import { MetricsCalculator } from '@/lib/dashboard/metrics-calculator';
import { createLogger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const logger = createLogger('dashboard-analytics-api');

// Request validation schema
const QuerySchema = z.object({
  type: z.enum(['overview', 'detailed', 'trends', 'skills', 'performance', 'engagement'])
    .optional()
    .default('overview'),
  timeRange: z.enum(['7d', '30d', '90d', 'all'])
    .optional()
    .default('30d'),
  refresh: z.enum(['true', 'false'])
    .optional()
    .default('false')
    .transform(val => val === 'true')
});

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = params;
    
    // Authentication check
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check - users can only access their own data unless admin
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Forbidden - You can only access your own analytics' 
      }, { status: 403 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = QuerySchema.safeParse({
      type: searchParams.get('type'),
      timeRange: searchParams.get('timeRange'),
      refresh: searchParams.get('refresh')
    });

    if (!queryResult.success) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: queryResult.error.issues
      }, { status: 400 });
    }

    const { type, timeRange, refresh } = queryResult.data;

    logger.info('Analytics request received', {
      userId,
      type,
      timeRange,
      refresh,
      requestedBy: session.user.id
    });

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        lastLoginAt: true,
        level: true,
        xp: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Calculate time range filter
    const timeRangeMap = {
      '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      'all': new Date(0)
    };
    const timeFilter = timeRangeMap[timeRange];

    // Handle different analytics types
    switch (type) {
      case 'overview':
        return await handleOverviewAnalytics(userId, timeFilter, refresh);
      
      case 'detailed':
        return await handleDetailedAnalytics(userId, timeFilter, refresh);
      
      case 'trends':
        return await handleTrendsAnalytics(userId, timeFilter, refresh);
      
      case 'skills':
        return await handleSkillsAnalytics(userId, timeFilter, refresh);
      
      case 'performance':
        return await handlePerformanceAnalytics(userId, timeFilter, refresh);
      
      case 'engagement':
        return await handleEngagementAnalytics(userId, timeFilter, refresh);
      
      default:
        return NextResponse.json({
          error: 'Invalid analytics type'
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Unexpected error in analytics API', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: params?.userId
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle overview analytics - quick summary of key metrics
 */
async function handleOverviewAnalytics(
  userId: string, 
  timeFilter: Date, 
  refresh: boolean
) {
  try {
    // Get aggregated user data with caching
    const aggregatedData = await AggregationsService.getUserAggregates(userId, refresh);
    
    // Get basic learning analytics
    const learningAnalytics = await AnalyticsService.getLearningAnalytics(userId);
    
    const overview = {
      summary: {
        totalCourses: aggregatedData.overallStats.totalCourses,
        completedCourses: aggregatedData.overallStats.completedCourses,
        completionRate: aggregatedData.overallStats.completedCourses > 0 
          ? (aggregatedData.overallStats.completedCourses / aggregatedData.overallStats.totalCourses) * 100
          : 0,
        averageScore: aggregatedData.overallStats.averageScore,
        totalStudyTime: aggregatedData.overallStats.totalStudyTime,
        currentStreak: aggregatedData.overallStats.currentStreak
      },
      topSkills: Object.entries(aggregatedData.skillBreakdown)
        .sort(([,a], [,b]) => b.averageScore - a.averageScore)
        .slice(0, 3)
        .map(([skill, data]) => ({
          skill,
          score: data.averageScore,
          progress: data.progress
        })),
      recentActivity: aggregatedData.recentActivity.slice(0, 5),
      weeklyTrend: learningAnalytics.performanceTrends.studyTimeWeekly.slice(-7),
      nextGoals: generateNextGoals(aggregatedData)
    };

    logger.info('Overview analytics generated', {
      userId,
      coursesCompleted: overview.summary.completedCourses,
      avgScore: overview.summary.averageScore
    });

    return NextResponse.json({
      success: true,
      data: overview,
      metadata: {
        type: 'overview',
        generatedAt: new Date().toISOString(),
        timeRange: timeFilter.toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to generate overview analytics', { error, userId });
    throw error;
  }
}

/**
 * Handle detailed analytics - comprehensive analysis
 */
async function handleDetailedAnalytics(
  userId: string,
  timeFilter: Date,
  refresh: boolean
) {
  try {
    // Get user progress and assessments with filtering
    const [userProgress, userAssessments, user] = await Promise.all([
      prisma.userProgress.findMany({
        where: {
          userId,
          updatedAt: {
            gte: timeFilter
          }
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              tags: true,
              level: true
            }
          }
        }
      }),
      prisma.userAssessment.findMany({
        where: {
          userId,
          completedAt: {
            gte: timeFilter
          }
        },
        include: {
          assessment: {
            include: {
              course: {
                select: {
                  tags: true
                }
              }
            }
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          createdAt: true,
          lastLoginAt: true,
          level: true,
          xp: true
        }
      })
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate comprehensive analytics
    const [
      learningAnalytics,
      performanceMetrics,
      aggregatedData
    ] = await Promise.all([
      AnalyticsService.getLearningAnalytics(userId),
      AnalyticsService.getUserPerformanceMetrics(userId),
      AggregationsService.getUserAggregates(userId, refresh)
    ]);

    // Calculate advanced metrics
    const advancedMetrics = MetricsCalculator.calculatePerformanceMetrics(
      userProgress,
      userAssessments,
      user
    );

    const detailedAnalytics = {
      learningAnalytics,
      performanceMetrics,
      advancedMetrics,
      aggregatedData,
      insights: generateInsights(learningAnalytics, performanceMetrics, advancedMetrics),
      recommendations: generateRecommendations(advancedMetrics)
    };

    logger.info('Detailed analytics generated', {
      userId,
      metricsCount: Object.keys(advancedMetrics).length,
      insightsCount: detailedAnalytics.insights.length
    });

    return NextResponse.json({
      success: true,
      data: detailedAnalytics,
      metadata: {
        type: 'detailed',
        generatedAt: new Date().toISOString(),
        timeRange: timeFilter.toISOString(),
        dataPoints: {
          progress: userProgress.length,
          assessments: userAssessments.length
        }
      }
    });

  } catch (error) {
    logger.error('Failed to generate detailed analytics', { error, userId });
    throw error;
  }
}

/**
 * Handle trends analytics - focus on temporal patterns
 */
async function handleTrendsAnalytics(
  userId: string,
  timeFilter: Date,
  refresh: boolean
) {
  try {
    const learningAnalytics = await AnalyticsService.getLearningAnalytics(userId);
    
    // Get historical data for trend analysis
    const historicalData = await prisma.userProgress.findMany({
      where: {
        userId,
        updatedAt: {
          gte: timeFilter
        }
      },
      select: {
        completionRate: true,
        studyTimeMinutes: true,
        lastAccessed: true,
        updatedAt: true,
        course: {
          select: {
            tags: true
          }
        }
      },
      orderBy: {
        updatedAt: 'asc'
      }
    });

    // Analyze trends
    const studyTimeData = historicalData.map(p => ({
      date: p.lastAccessed,
      value: p.studyTimeMinutes
    }));

    const progressData = historicalData.map(p => ({
      date: p.updatedAt,
      value: p.completionRate
    }));

    const studyTimeTrend = MetricsCalculator.analyzeTrend(studyTimeData);
    const progressTrend = MetricsCalculator.analyzeTrend(progressData);

    const trendsAnalytics = {
      performanceTrends: learningAnalytics.performanceTrends,
      studyPatterns: learningAnalytics.studyPatterns,
      trendAnalysis: {
        studyTime: studyTimeTrend,
        progress: progressTrend
      },
      movingAverages: {
        studyTime: MetricsCalculator.calculateMovingAverage(studyTimeData, 7),
        progress: MetricsCalculator.calculateMovingAverage(progressData, 7)
      },
      predictions: generateTrendPredictions(studyTimeTrend, progressTrend)
    };

    logger.info('Trends analytics generated', {
      userId,
      dataPoints: historicalData.length,
      trendDirection: progressTrend.direction
    });

    return NextResponse.json({
      success: true,
      data: trendsAnalytics,
      metadata: {
        type: 'trends',
        generatedAt: new Date().toISOString(),
        timeRange: timeFilter.toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to generate trends analytics', { error, userId });
    throw error;
  }
}

/**
 * Handle skills analytics - focus on skill development
 */
async function handleSkillsAnalytics(
  userId: string,
  timeFilter: Date,
  refresh: boolean
) {
  try {
    // Get detailed progress and assessment data
    const [userProgress, userAssessments] = await Promise.all([
      prisma.userProgress.findMany({
        where: {
          userId,
          updatedAt: {
            gte: timeFilter
          }
        },
        include: {
          course: {
            select: {
              tags: true,
              level: true,
              title: true
            }
          }
        }
      }),
      prisma.userAssessment.findMany({
        where: {
          userId,
          completedAt: {
            gte: timeFilter
          }
        },
        include: {
          assessment: {
            include: {
              course: {
                select: {
                  tags: true
                }
              }
            }
          }
        }
      })
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, lastLoginAt: true, level: true, xp: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate skill-specific metrics
    const performanceMetrics = MetricsCalculator.calculatePerformanceMetrics(
      userProgress,
      userAssessments,
      user
    );

    const skillsAnalytics = {
      skillMastery: performanceMetrics.skillMastery,
      competencyGaps: performanceMetrics.competencyGaps,
      skillProgression: await AnalyticsService.getLearningAnalytics(userId)
        .then(analytics => analytics.skillProgression),
      recommendedFocus: generateSkillRecommendations(performanceMetrics.skillMastery),
      masteryRoadmap: generateMasteryRoadmap(performanceMetrics.competencyGaps)
    };

    logger.info('Skills analytics generated', {
      userId,
      skillsAnalyzed: skillsAnalytics.skillMastery.length,
      gapsIdentified: skillsAnalytics.competencyGaps.length
    });

    return NextResponse.json({
      success: true,
      data: skillsAnalytics,
      metadata: {
        type: 'skills',
        generatedAt: new Date().toISOString(),
        timeRange: timeFilter.toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to generate skills analytics', { error, userId });
    throw error;
  }
}

/**
 * Handle performance analytics - focus on performance metrics
 */
async function handlePerformanceAnalytics(
  userId: string,
  timeFilter: Date,
  refresh: boolean
) {
  try {
    const performanceMetrics = await AnalyticsService.getUserPerformanceMetrics(userId);
    
    const performanceAnalytics = {
      assessmentPerformance: performanceMetrics.assessmentPerformance,
      learningVelocity: performanceMetrics.learningVelocity,
      efficiency: await calculateEfficiencyMetrics(userId, timeFilter),
      benchmarking: await calculateBenchmarkComparison(userId),
      performanceGoals: generatePerformanceGoals(performanceMetrics)
    };

    logger.info('Performance analytics generated', {
      userId,
      avgScore: performanceMetrics.assessmentPerformance.averageScore,
      trend: performanceMetrics.assessmentPerformance.recentTrend
    });

    return NextResponse.json({
      success: true,
      data: performanceAnalytics,
      metadata: {
        type: 'performance',
        generatedAt: new Date().toISOString(),
        timeRange: timeFilter.toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to generate performance analytics', { error, userId });
    throw error;
  }
}

/**
 * Handle engagement analytics - focus on engagement patterns
 */
async function handleEngagementAnalytics(
  userId: string,
  timeFilter: Date,
  refresh: boolean
) {
  try {
    // Get engagement-related data
    const [userProgress, userAssessments] = await Promise.all([
      prisma.userProgress.findMany({
        where: {
          userId,
          lastAccessed: {
            gte: timeFilter
          }
        },
        include: {
          course: {
            select: {
              tags: true,
              level: true
            }
          }
        }
      }),
      prisma.userAssessment.findMany({
        where: {
          userId,
          completedAt: {
            gte: timeFilter
          }
        },
        include: {
          assessment: {
            include: {
              course: {
                select: {
                  tags: true
                }
              }
            }
          }
        }
      })
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, lastLoginAt: true, level: true, xp: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const performanceMetrics = MetricsCalculator.calculatePerformanceMetrics(
      userProgress,
      userAssessments,
      user
    );

    const engagementAnalytics = {
      engagementScore: performanceMetrics.engagementScore,
      retentionPrediction: performanceMetrics.retentionPrediction,
      studyPatterns: await AnalyticsService.getLearningAnalytics(userId)
        .then(analytics => analytics.studyPatterns),
      engagementTrends: generateEngagementTrends(userProgress),
      motivationFactors: identifyMotivationFactors(userProgress, userAssessments)
    };

    logger.info('Engagement analytics generated', {
      userId,
      engagementScore: engagementAnalytics.engagementScore.overallScore,
      retentionRisk: engagementAnalytics.retentionPrediction.riskLevel
    });

    return NextResponse.json({
      success: true,
      data: engagementAnalytics,
      metadata: {
        type: 'engagement',
        generatedAt: new Date().toISOString(),
        timeRange: timeFilter.toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to generate engagement analytics', { error, userId });
    throw error;
  }
}

// Utility functions

function generateNextGoals(aggregatedData: any) {
  const goals = [];
  
  if (aggregatedData.overallStats.completedCourses < 5) {
    goals.push({
      type: 'completion',
      target: 'Complete 5 courses',
      progress: (aggregatedData.overallStats.completedCourses / 5) * 100,
      priority: 'high'
    });
  }
  
  if (aggregatedData.overallStats.averageScore < 80) {
    goals.push({
      type: 'performance',
      target: 'Achieve 80% average score',
      progress: (aggregatedData.overallStats.averageScore / 80) * 100,
      priority: 'medium'
    });
  }
  
  if (aggregatedData.overallStats.currentStreak < 7) {
    goals.push({
      type: 'consistency',
      target: 'Maintain 7-day study streak',
      progress: (aggregatedData.overallStats.currentStreak / 7) * 100,
      priority: 'high'
    });
  }
  
  return goals.slice(0, 3);
}

function generateInsights(learningAnalytics: any, performanceMetrics: any, advancedMetrics: any) {
  const insights = [];
  
  // Performance insights
  if (performanceMetrics.assessmentPerformance.recentTrend === 'improving') {
    insights.push({
      type: 'positive',
      category: 'performance',
      message: 'Your assessment scores are showing consistent improvement',
      impact: 'high'
    });
  }
  
  // Learning efficiency insights
  if (advancedMetrics.learningEfficiency.overallEfficiency > 80) {
    insights.push({
      type: 'positive',
      category: 'efficiency',
      message: 'You have excellent learning efficiency',
      impact: 'medium'
    });
  }
  
  // Engagement insights
  if (advancedMetrics.engagementScore.overallScore < 50) {
    insights.push({
      type: 'warning',
      category: 'engagement',
      message: 'Your engagement levels could be improved with more consistent study sessions',
      impact: 'high'
    });
  }
  
  return insights;
}

function generateRecommendations(advancedMetrics: any) {
  const recommendations = [];
  
  // Add recommendations based on metrics
  advancedMetrics.skillMastery.forEach((skill: any) => {
    if (skill.masteryPercentage < 70 && skill.weakAreas.length > 0) {
      recommendations.push({
        type: 'skill_improvement',
        skill: skill.skillName,
        action: `Focus on improving ${skill.weakAreas.join(', ')}`,
        priority: skill.masteryPercentage < 50 ? 'high' : 'medium'
      });
    }
  });
  
  if (advancedMetrics.learningEfficiency.timeEfficiency < 50) {
    recommendations.push({
      type: 'efficiency',
      action: 'Consider shorter, more focused study sessions',
      priority: 'medium'
    });
  }
  
  return recommendations.slice(0, 5);
}

function generateTrendPredictions(studyTimeTrend: any, progressTrend: any) {
  return {
    studyTime: {
      direction: studyTimeTrend.direction,
      confidence: studyTimeTrend.confidence,
      prediction: `Study time is ${studyTimeTrend.direction.replace('_', ' ')}`
    },
    progress: {
      direction: progressTrend.direction,
      confidence: progressTrend.confidence,
      prediction: `Learning progress is ${progressTrend.direction.replace('_', ' ')}`
    }
  };
}

function generateSkillRecommendations(skillMastery: any[]) {
  return skillMastery
    .filter(skill => skill.masteryPercentage < 80)
    .sort((a, b) => a.masteryPercentage - b.masteryPercentage)
    .slice(0, 3)
    .map(skill => ({
      skill: skill.skillName,
      currentLevel: skill.masteryPercentage,
      recommendedActions: skill.recommendedActions.slice(0, 2),
      timeToImprove: skill.timeToMastery
    }));
}

function generateMasteryRoadmap(competencyGaps: any[]) {
  return competencyGaps
    .sort((a, b) => b.impactOnOverallProgress - a.impactOnOverallProgress)
    .slice(0, 5)
    .map((gap, index) => ({
      step: index + 1,
      competency: gap.competencyArea,
      currentLevel: gap.currentLevel,
      targetLevel: gap.targetLevel,
      estimatedTime: gap.timeToClose,
      difficulty: gap.difficultyLevel,
      resources: gap.recommendedResources.slice(0, 2)
    }));
}

async function calculateEfficiencyMetrics(userId: string, timeFilter: Date) {
  // This would be implemented with more complex efficiency calculations
  // For now, return a placeholder
  return {
    timeToCompletion: 0,
    studyEfficiency: 0,
    retentionRate: 0
  };
}

async function calculateBenchmarkComparison(userId: string) {
  // This would compare user performance to peer averages
  // For now, return a placeholder
  return {
    percentile: 0,
    comparison: 'above_average' as const
  };
}

function generatePerformanceGoals(performanceMetrics: any) {
  return [
    {
      metric: 'Assessment Score',
      current: performanceMetrics.assessmentPerformance.averageScore,
      target: Math.min(100, performanceMetrics.assessmentPerformance.averageScore + 10),
      timeframe: '30 days'
    }
  ];
}

function generateEngagementTrends(userProgress: any[]) {
  // Generate engagement trend data
  const dailyActivity = new Map<string, number>();
  
  userProgress.forEach(p => {
    const day = p.lastAccessed.toDateString();
    dailyActivity.set(day, (dailyActivity.get(day) || 0) + 1);
  });
  
  return Array.from(dailyActivity.entries()).map(([date, activity]) => ({
    date: new Date(date),
    activity
  }));
}

function identifyMotivationFactors(userProgress: any[], userAssessments: any[]) {
  return {
    positiveFactors: ['Regular progress', 'Improving scores'],
    negativeFactors: ['Inconsistent study times'],
    recommendations: ['Set daily study reminders', 'Track weekly progress']
  };
}