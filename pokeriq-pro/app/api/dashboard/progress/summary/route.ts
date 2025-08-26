/**
 * Dashboard Progress Summary API Endpoint
 * Provides consolidated progress data for dashboard overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnalyticsService } from '@/lib/dashboard/analytics-service';
import { AggregationsService } from '@/lib/dashboard/aggregations';
import { createLogger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const logger = createLogger('dashboard-progress-summary-api');

// Request validation schema
const QuerySchema = z.object({
  userId: z.string().uuid().optional(),
  includeGlobal: z.enum(['true', 'false']).optional().default('false').transform(val => val === 'true'),
  refresh: z.enum(['true', 'false']).optional().default('false').transform(val => val === 'true')
});

export interface ProgressSummary {
  user: {
    id: string;
    username: string;
    level: number;
    xp: number;
    overview: {
      completedCourses: number;
      totalCourses: number;
      completionPercentage: number;
      averageScore: number;
      totalStudyTime: number;
      currentStreak: number;
      rank: number | null;
    };
    recentActivity: Array<{
      type: 'course_completed' | 'assessment_passed' | 'milestone_reached';
      title: string;
      date: string;
      score?: number;
    }>;
    skillHighlights: Array<{
      skill: string;
      level: number;
      progress: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    upcomingGoals: Array<{
      type: 'course' | 'skill' | 'assessment';
      target: string;
      progress: number;
      dueDate?: string;
    }>;
  };
  global?: {
    leaderboard: Array<{
      rank: number;
      username: string;
      score: number;
      level: number;
    }>;
    systemStats: {
      totalUsers: number;
      activeUsers: number;
      avgCompletionRate: number;
      popularCourses: Array<{
        title: string;
        enrollments: number;
        completionRate: number;
      }>;
    };
  };
  recommendations: Array<{
    type: 'course' | 'skill' | 'study_pattern';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime?: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Authentication check
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = QuerySchema.safeParse({
      userId: searchParams.get('userId'),
      includeGlobal: searchParams.get('includeGlobal'),
      refresh: searchParams.get('refresh')
    });

    if (!queryResult.success) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: queryResult.error.issues
      }, { status: 400 });
    }

    const { userId, includeGlobal, refresh } = queryResult.data;
    
    // Determine target user
    const targetUserId = userId || session.user.id;
    
    // Authorization check - users can only access their own data unless admin
    if (targetUserId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Forbidden - You can only access your own progress' 
      }, { status: 403 });
    }

    logger.info('Progress summary request received', {
      targetUserId,
      includeGlobal,
      refresh,
      requestedBy: session.user.id
    });

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        level: true,
        xp: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Generate progress summary
    const progressSummary = await generateProgressSummary(
      user, 
      includeGlobal, 
      refresh
    );

    logger.info('Progress summary generated successfully', {
      targetUserId,
      completedCourses: progressSummary.user.overview.completedCourses,
      averageScore: progressSummary.user.overview.averageScore
    });

    return NextResponse.json({
      success: true,
      data: progressSummary,
      metadata: {
        generatedAt: new Date().toISOString(),
        includeGlobal,
        version: '1.0'
      }
    });

  } catch (error) {
    logger.error('Unexpected error in progress summary API', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate comprehensive progress summary
 */
async function generateProgressSummary(
  user: {
    id: string;
    username: string | null;
    level: number;
    xp: number;
    createdAt: Date;
    lastLoginAt: Date | null;
  },
  includeGlobal: boolean,
  refresh: boolean
): Promise<ProgressSummary> {
  
  // Get aggregated user data
  const [aggregatedData, learningAnalytics] = await Promise.all([
    AggregationsService.getUserAggregates(user.id, refresh),
    AnalyticsService.getLearningAnalytics(user.id)
  ]);

  // Generate user summary
  const userSummary = await generateUserSummary(user, aggregatedData, learningAnalytics);
  
  // Generate global data if requested
  const globalData = includeGlobal 
    ? await generateGlobalSummary(refresh)
    : undefined;

  // Generate personalized recommendations
  const recommendations = await generateRecommendations(user.id, aggregatedData, learningAnalytics);

  return {
    user: userSummary,
    global: globalData,
    recommendations
  };
}

/**
 * Generate user-specific summary data
 */
async function generateUserSummary(
  user: {
    id: string;
    username: string | null;
    level: number;
    xp: number;
  },
  aggregatedData: any,
  learningAnalytics: any
) {
  // Calculate user rank (simplified - in production this would be more sophisticated)
  const userRank = await calculateUserRank(user.id, user.xp);

  // Format recent activity
  const recentActivity = aggregatedData.recentActivity
    .slice(0, 5)
    .map((activity: any) => ({
      type: activity.type,
      title: activity.type === 'course_completed' 
        ? `Completed: ${activity.details.courseTitle}`
        : activity.type === 'assessment_passed'
        ? `Assessment passed with ${activity.details.score}%`
        : 'Milestone reached',
      date: activity.date.toISOString(),
      score: activity.details.score
    }));

  // Extract skill highlights
  const skillHighlights = learningAnalytics.skillProgression.dimensions
    .slice(0, 4)
    .map((skill: any) => ({
      skill: skill.name,
      level: skill.currentLevel,
      progress: skill.progress,
      trend: skill.trend
    }));

  // Generate upcoming goals
  const upcomingGoals = await generateUpcomingGoals(user.id, aggregatedData);

  return {
    id: user.id,
    username: user.username || 'Anonymous User',
    level: user.level,
    xp: user.xp,
    overview: {
      completedCourses: aggregatedData.overallStats.completedCourses,
      totalCourses: aggregatedData.overallStats.totalCourses,
      completionPercentage: aggregatedData.overallStats.totalCourses > 0 
        ? Math.round((aggregatedData.overallStats.completedCourses / aggregatedData.overallStats.totalCourses) * 100)
        : 0,
      averageScore: Math.round(aggregatedData.overallStats.averageScore),
      totalStudyTime: aggregatedData.overallStats.totalStudyTime,
      currentStreak: aggregatedData.overallStats.currentStreak,
      rank: userRank
    },
    recentActivity,
    skillHighlights,
    upcomingGoals
  };
}

/**
 * Generate global summary data
 */
async function generateGlobalSummary(refresh: boolean) {
  const [leaderboard, globalAggregates] = await Promise.all([
    AggregationsService.getLeaderboard('overall', 10),
    AggregationsService.getGlobalAggregates(refresh)
  ]);

  return {
    leaderboard: leaderboard.map(entry => ({
      rank: entry.rank,
      username: entry.username,
      score: entry.score,
      level: entry.level
    })),
    systemStats: {
      totalUsers: globalAggregates.userMetrics.totalUsers,
      activeUsers: globalAggregates.userMetrics.activeUsers30d,
      avgCompletionRate: Math.round(globalAggregates.learningMetrics.averageCompletionRate),
      popularCourses: globalAggregates.learningMetrics.mostPopularCourses
        .slice(0, 5)
        .map(course => ({
          title: course.title,
          enrollments: course.enrollments,
          completionRate: Math.round(course.completionRate)
        }))
    }
  };
}

/**
 * Generate personalized recommendations
 */
async function generateRecommendations(
  userId: string,
  aggregatedData: any,
  learningAnalytics: any
): Promise<Array<{
  type: 'course' | 'skill' | 'study_pattern';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: string;
}>> {
  const recommendations = [];

  // Course recommendations
  if (aggregatedData.overallStats.completedCourses < 3) {
    recommendations.push({
      type: 'course' as const,
      title: 'Continue Your Learning Journey',
      description: 'Complete more courses to build a solid foundation in poker fundamentals',
      priority: 'high' as const,
      estimatedTime: '2-3 hours per course'
    });
  }

  // Skill-based recommendations
  const weakestSkill = learningAnalytics.skillProgression.weakestSkills[0];
  if (weakestSkill) {
    recommendations.push({
      type: 'skill' as const,
      title: `Strengthen Your ${weakestSkill} Skills`,
      description: `Focus on improving your ${weakestSkill.toLowerCase()} to become a more well-rounded player`,
      priority: 'medium' as const,
      estimatedTime: '1-2 weeks of focused practice'
    });
  }

  // Study pattern recommendations
  const consistency = learningAnalytics.studyPatterns.consistency;
  if (consistency.regularityScore < 70) {
    recommendations.push({
      type: 'study_pattern' as const,
      title: 'Improve Study Consistency',
      description: 'Try to study at regular intervals to improve retention and progress',
      priority: 'medium' as const,
      estimatedTime: '15-30 minutes daily'
    });
  }

  // Performance-based recommendations
  if (aggregatedData.overallStats.averageScore < 75) {
    recommendations.push({
      type: 'skill' as const,
      title: 'Review and Reinforce',
      description: 'Spend time reviewing concepts from completed assessments to improve scores',
      priority: 'high' as const,
      estimatedTime: '30 minutes per review session'
    });
  }

  // Advanced recommendations for experienced users
  if (aggregatedData.overallStats.completedCourses >= 5 && aggregatedData.overallStats.averageScore >= 80) {
    recommendations.push({
      type: 'course' as const,
      title: 'Explore Advanced Topics',
      description: 'You\'re ready for advanced poker concepts and specialized strategies',
      priority: 'medium' as const,
      estimatedTime: '3-4 hours per advanced course'
    });
  }

  return recommendations.slice(0, 4); // Limit to top 4 recommendations
}

/**
 * Calculate user's rank among all users
 */
async function calculateUserRank(userId: string, userXp: number): Promise<number | null> {
  try {
    const usersAbove = await prisma.user.count({
      where: {
        xp: {
          gt: userXp
        }
      }
    });

    return usersAbove + 1; // Rank is 1-indexed
  } catch (error) {
    logger.error('Failed to calculate user rank', { error, userId });
    return null;
  }
}

/**
 * Generate upcoming goals for the user
 */
async function generateUpcomingGoals(userId: string, aggregatedData: any) {
  const goals = [];

  // Course completion goals
  const incompleteCourses = await prisma.userProgress.findMany({
    where: {
      userId,
      completionRate: {
        lt: 100
      }
    },
    include: {
      course: {
        select: {
          title: true
        }
      }
    },
    orderBy: {
      completionRate: 'desc'
    },
    take: 3
  });

  incompleteCourses.forEach(progress => {
    goals.push({
      type: 'course' as const,
      target: progress.course.title,
      progress: progress.completionRate,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
    });
  });

  // Skill improvement goals
  if (aggregatedData.overallStats.averageScore < 80) {
    goals.push({
      type: 'skill' as const,
      target: 'Achieve 80% average score',
      progress: (aggregatedData.overallStats.averageScore / 80) * 100
    });
  }

  // Study streak goals
  if (aggregatedData.overallStats.currentStreak < 7) {
    goals.push({
      type: 'assessment' as const,
      target: 'Maintain 7-day study streak',
      progress: (aggregatedData.overallStats.currentStreak / 7) * 100,
      dueDate: new Date(Date.now() + (7 - aggregatedData.overallStats.currentStreak) * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return goals.slice(0, 4);
}

/**
 * POST endpoint for updating progress milestones
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { milestone, completed } = body;

    if (!milestone || typeof completed !== 'boolean') {
      return NextResponse.json({
        error: 'Invalid request body. Requires milestone and completed fields'
      }, { status: 400 });
    }

    // Log milestone achievement
    logger.info('Milestone update received', {
      userId: session.user.id,
      milestone,
      completed
    });

    // Invalidate user cache to reflect changes
    await AggregationsService.invalidateUserCache(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Milestone updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update milestone', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}