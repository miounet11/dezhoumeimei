/**
 * Data Aggregations Service for Dashboard
 * Handles data aggregation, caching strategies, and optimized queries
 */

import { createLogger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/cache/redis';
import { type User, type Course, type UserProgress, type UserAssessment } from '@prisma/client';

const logger = createLogger('aggregations-service');

// Cache keys
const CACHE_KEYS = {
  USER_ANALYTICS: (userId: string) => `analytics:user:${userId}`,
  COURSE_STATS: (courseId: string) => `analytics:course:${courseId}`,
  GLOBAL_STATS: () => `analytics:global`,
  SKILL_PROGRESSION: (userId: string) => `progression:user:${userId}`,
  LEADERBOARD: (type: string) => `leaderboard:${type}`,
} as const;

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  USER_ANALYTICS: 300, // 5 minutes
  COURSE_STATS: 600, // 10 minutes  
  GLOBAL_STATS: 900, // 15 minutes
  SKILL_PROGRESSION: 300, // 5 minutes
  LEADERBOARD: 180, // 3 minutes
} as const;

export interface AggregatedUserData {
  userId: string;
  overallStats: {
    totalCourses: number;
    completedCourses: number;
    totalStudyTime: number;
    averageScore: number;
    currentStreak: number;
    lastActiveDate: Date;
  };
  skillBreakdown: Record<string, {
    progress: number;
    assessmentCount: number;
    averageScore: number;
    timeSpent: number;
  }>;
  recentActivity: Array<{
    type: 'course_completed' | 'assessment_passed' | 'milestone_reached';
    date: Date;
    details: Record<string, any>;
  }>;
  performanceTrends: {
    weekly: Array<{ week: string; score: number; studyTime: number }>;
    monthly: Array<{ month: string; completionRate: number; avgScore: number }>;
  };
}

export interface CourseAggregates {
  courseId: string;
  stats: {
    totalEnrollments: number;
    completionRate: number;
    averageScore: number;
    averageTimeToComplete: number;
    dropoffPoints: Array<{ section: number; dropoffRate: number }>;
  };
  demographics: {
    levelDistribution: Record<string, number>;
    completionByLevel: Record<string, number>;
  };
  feedback: {
    difficulty: number; // 1-5 scale
    engagement: number; // 1-5 scale
    satisfaction: number; // 1-5 scale
  };
}

export interface GlobalAggregates {
  userMetrics: {
    totalUsers: number;
    activeUsers24h: number;
    activeUsers7d: number;
    activeUsers30d: number;
    newUsers7d: number;
    retentionRate: number;
  };
  learningMetrics: {
    totalCourses: number;
    totalAssessments: number;
    totalStudyHours: number;
    averageCompletionRate: number;
    mostPopularCourses: Array<{
      id: string;
      title: string;
      enrollments: number;
      completionRate: number;
    }>;
  };
  performanceMetrics: {
    averageAssessmentScore: number;
    skillDistribution: Record<string, {
      userCount: number;
      averageLevel: number;
      progressRate: number;
    }>;
  };
}

export class AggregationsService {
  /**
   * Get cached or compute aggregated user data
   */
  static async getUserAggregates(userId: string, forceRefresh = false): Promise<AggregatedUserData> {
    const cacheKey = CACHE_KEYS.USER_ANALYTICS(userId);

    try {
      // Try to get from cache first
      if (!forceRefresh) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Returning cached user aggregates', { userId });
          return JSON.parse(cached);
        }
      }

      logger.info('Computing user aggregates', { userId });
      const aggregates = await this.computeUserAggregates(userId);

      // Cache the result
      await redis.setex(cacheKey, CACHE_TTL.USER_ANALYTICS, JSON.stringify(aggregates));

      return aggregates;

    } catch (error) {
      logger.error('Failed to get user aggregates', { error, userId });
      throw new Error(`Failed to get user aggregates: ${error}`);
    }
  }

  /**
   * Get cached or compute course aggregates
   */
  static async getCourseAggregates(courseId: string, forceRefresh = false): Promise<CourseAggregates> {
    const cacheKey = CACHE_KEYS.COURSE_STATS(courseId);

    try {
      // Try to get from cache first
      if (!forceRefresh) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Returning cached course aggregates', { courseId });
          return JSON.parse(cached);
        }
      }

      logger.info('Computing course aggregates', { courseId });
      const aggregates = await this.computeCourseAggregates(courseId);

      // Cache the result
      await redis.setex(cacheKey, CACHE_TTL.COURSE_STATS, JSON.stringify(aggregates));

      return aggregates;

    } catch (error) {
      logger.error('Failed to get course aggregates', { error, courseId });
      throw new Error(`Failed to get course aggregates: ${error}`);
    }
  }

  /**
   * Get cached or compute global aggregates
   */
  static async getGlobalAggregates(forceRefresh = false): Promise<GlobalAggregates> {
    const cacheKey = CACHE_KEYS.GLOBAL_STATS();

    try {
      // Try to get from cache first
      if (!forceRefresh) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Returning cached global aggregates');
          return JSON.parse(cached);
        }
      }

      logger.info('Computing global aggregates');
      const aggregates = await this.computeGlobalAggregates();

      // Cache the result
      await redis.setex(cacheKey, CACHE_TTL.GLOBAL_STATS, JSON.stringify(aggregates));

      return aggregates;

    } catch (error) {
      logger.error('Failed to get global aggregates', { error });
      throw new Error(`Failed to get global aggregates: ${error}`);
    }
  }

  /**
   * Invalidate cache for specific user
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    try {
      const keys = [
        CACHE_KEYS.USER_ANALYTICS(userId),
        CACHE_KEYS.SKILL_PROGRESSION(userId)
      ];

      await Promise.all(keys.map(key => redis.del(key)));
      logger.info('User cache invalidated', { userId, keys: keys.length });

    } catch (error) {
      logger.error('Failed to invalidate user cache', { error, userId });
    }
  }

  /**
   * Invalidate cache for specific course
   */
  static async invalidateCourseCache(courseId: string): Promise<void> {
    try {
      const keys = [CACHE_KEYS.COURSE_STATS(courseId)];
      await Promise.all(keys.map(key => redis.del(key)));
      logger.info('Course cache invalidated', { courseId });

    } catch (error) {
      logger.error('Failed to invalidate course cache', { error, courseId });
    }
  }

  /**
   * Invalidate global cache
   */
  static async invalidateGlobalCache(): Promise<void> {
    try {
      const keys = [
        CACHE_KEYS.GLOBAL_STATS(),
        CACHE_KEYS.LEADERBOARD('overall'),
        CACHE_KEYS.LEADERBOARD('weekly'),
        CACHE_KEYS.LEADERBOARD('monthly')
      ];

      await Promise.all(keys.map(key => redis.del(key)));
      logger.info('Global cache invalidated', { keys: keys.length });

    } catch (error) {
      logger.error('Failed to invalidate global cache', { error });
    }
  }

  /**
   * Get leaderboard data with caching
   */
  static async getLeaderboard(
    type: 'overall' | 'weekly' | 'monthly',
    limit = 50
  ): Promise<Array<{
    userId: string;
    username: string;
    score: number;
    rank: number;
    avatar?: string;
    level: number;
  }>> {
    const cacheKey = CACHE_KEYS.LEADERBOARD(type);

    try {
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Returning cached leaderboard', { type });
        return JSON.parse(cached);
      }

      logger.info('Computing leaderboard', { type, limit });
      const leaderboard = await this.computeLeaderboard(type, limit);

      // Cache the result
      await redis.setex(cacheKey, CACHE_TTL.LEADERBOARD, JSON.stringify(leaderboard));

      return leaderboard;

    } catch (error) {
      logger.error('Failed to get leaderboard', { error, type });
      throw new Error(`Failed to get leaderboard: ${error}`);
    }
  }

  /**
   * Bulk update cache for multiple users (for efficiency)
   */
  static async bulkUpdateUserCache(userIds: string[]): Promise<void> {
    try {
      logger.info('Starting bulk cache update', { userCount: userIds.length });

      // Process in batches to avoid overwhelming the system
      const BATCH_SIZE = 10;
      const batches = [];
      
      for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
        batches.push(userIds.slice(i, i + BATCH_SIZE));
      }

      for (const batch of batches) {
        await Promise.all(
          batch.map(async userId => {
            try {
              await this.getUserAggregates(userId, true); // Force refresh
            } catch (error) {
              logger.warn('Failed to update cache for user', { userId, error });
            }
          })
        );
      }

      logger.info('Bulk cache update completed', { userCount: userIds.length });

    } catch (error) {
      logger.error('Failed bulk cache update', { error, userCount: userIds.length });
    }
  }

  // Private computation methods

  /**
   * Compute user aggregates from database
   */
  private static async computeUserAggregates(userId: string): Promise<AggregatedUserData> {
    const [userProgress, userAssessments, user] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              tags: true,
              level: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }),
      prisma.userAssessment.findMany({
        where: { userId },
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
        },
        orderBy: {
          completedAt: 'desc'
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          lastLoginAt: true,
          level: true,
          xp: true
        }
      })
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate overall stats
    const totalCourses = userProgress.length;
    const completedCourses = userProgress.filter(p => p.completionRate >= 100).length;
    const totalStudyTime = userProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0);
    
    const averageScore = userAssessments.length > 0 
      ? userAssessments.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / userAssessments.length
      : 0;

    // Calculate current streak (simplified)
    let currentStreak = 0;
    const sortedProgress = userProgress.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const progress of sortedProgress) {
      const progressDate = new Date(progress.lastAccessed);
      progressDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - progressDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }

    const overallStats = {
      totalCourses,
      completedCourses,
      totalStudyTime,
      averageScore,
      currentStreak,
      lastActiveDate: user.lastLoginAt || new Date()
    };

    // Calculate skill breakdown
    const skillMap = new Map<string, {
      progress: number[];
      assessmentScores: number[];
      timeSpent: number;
    }>();

    userProgress.forEach(p => {
      p.course.tags.forEach(tag => {
        if (!skillMap.has(tag)) {
          skillMap.set(tag, { progress: [], assessmentScores: [], timeSpent: 0 });
        }
        const skill = skillMap.get(tag)!;
        skill.progress.push(p.completionRate);
        skill.timeSpent += p.studyTimeMinutes;
      });
    });

    userAssessments.forEach(a => {
      a.assessment.course.tags.forEach(tag => {
        if (skillMap.has(tag)) {
          const skill = skillMap.get(tag)!;
          skill.assessmentScores.push((a.score / a.maxScore) * 100);
        }
      });
    });

    const skillBreakdown: Record<string, {
      progress: number;
      assessmentCount: number;
      averageScore: number;
      timeSpent: number;
    }> = {};

    for (const [skill, data] of skillMap.entries()) {
      skillBreakdown[skill] = {
        progress: data.progress.length > 0 
          ? data.progress.reduce((sum, p) => sum + p, 0) / data.progress.length
          : 0,
        assessmentCount: data.assessmentScores.length,
        averageScore: data.assessmentScores.length > 0
          ? data.assessmentScores.reduce((sum, s) => sum + s, 0) / data.assessmentScores.length
          : 0,
        timeSpent: data.timeSpent
      };
    }

    // Generate recent activity
    const recentActivity = [];

    // Add recent course completions
    const recentCompletions = userProgress
      .filter(p => p.completedAt && p.completedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .slice(0, 5);

    recentCompletions.forEach(p => {
      recentActivity.push({
        type: 'course_completed' as const,
        date: p.completedAt!,
        details: {
          courseTitle: p.course.title,
          courseId: p.course.id
        }
      });
    });

    // Add recent assessment passes (score >= 70%)
    const recentPasses = userAssessments
      .filter(a => (a.score / a.maxScore * 100) >= 70)
      .slice(0, 5);

    recentPasses.forEach(a => {
      recentActivity.push({
        type: 'assessment_passed' as const,
        date: a.completedAt,
        details: {
          score: Math.round((a.score / a.maxScore) * 100),
          assessmentId: a.assessmentId
        }
      });
    });

    // Sort by date
    recentActivity.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Generate performance trends
    const weeklyTrends = this.generateWeeklyTrends(userProgress, userAssessments);
    const monthlyTrends = this.generateMonthlyTrends(userProgress, userAssessments);

    const performanceTrends = {
      weekly: weeklyTrends,
      monthly: monthlyTrends
    };

    return {
      userId,
      overallStats,
      skillBreakdown,
      recentActivity: recentActivity.slice(0, 10),
      performanceTrends
    };
  }

  /**
   * Compute course aggregates from database
   */
  private static async computeCourseAggregates(courseId: string): Promise<CourseAggregates> {
    const [courseProgress, courseAssessments, course] = await Promise.all([
      prisma.userProgress.findMany({
        where: { courseId },
        include: {
          user: {
            select: {
              level: true
            }
          }
        }
      }),
      prisma.userAssessment.findMany({
        where: {
          assessment: {
            courseId: courseId
          }
        }
      }),
      prisma.course.findUnique({
        where: { id: courseId },
        select: {
          title: true,
          level: true
        }
      })
    ]);

    if (!course) {
      throw new Error('Course not found');
    }

    const totalEnrollments = courseProgress.length;
    const completedCount = courseProgress.filter(p => p.completionRate >= 100).length;
    const completionRate = totalEnrollments > 0 ? (completedCount / totalEnrollments) * 100 : 0;

    const averageScore = courseAssessments.length > 0
      ? courseAssessments.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / courseAssessments.length
      : 0;

    // Calculate average time to complete
    const completedCourses = courseProgress.filter(p => p.completedAt);
    const averageTimeToComplete = completedCourses.length > 0
      ? completedCourses.reduce((sum, p) => {
          const timeDiff = p.completedAt!.getTime() - p.createdAt.getTime();
          return sum + (timeDiff / (1000 * 60 * 60 * 24)); // days
        }, 0) / completedCourses.length
      : 0;

    // Calculate dropoff points
    const sectionCounts = new Map<number, number>();
    const sectionDropoffs = new Map<number, number>();

    courseProgress.forEach(p => {
      for (let section = 1; section <= p.currentSection; section++) {
        sectionCounts.set(section, (sectionCounts.get(section) || 0) + 1);
      }
      if (p.completionRate < 100) {
        sectionDropoffs.set(p.currentSection, (sectionDropoffs.get(p.currentSection) || 0) + 1);
      }
    });

    const dropoffPoints = Array.from(sectionCounts.entries()).map(([section, count]) => ({
      section,
      dropoffRate: count > 0 ? ((sectionDropoffs.get(section) || 0) / count) * 100 : 0
    }));

    // Demographics
    const levelDistribution: Record<string, number> = {};
    const completionByLevel: Record<string, number> = {};

    courseProgress.forEach(p => {
      const level = `Level ${p.user.level}`;
      levelDistribution[level] = (levelDistribution[level] || 0) + 1;
      if (p.completionRate >= 100) {
        completionByLevel[level] = (completionByLevel[level] || 0) + 1;
      }
    });

    return {
      courseId,
      stats: {
        totalEnrollments,
        completionRate,
        averageScore,
        averageTimeToComplete,
        dropoffPoints
      },
      demographics: {
        levelDistribution,
        completionByLevel
      },
      feedback: {
        difficulty: 3.5, // This would come from user ratings in a real system
        engagement: 4.0,
        satisfaction: 3.8
      }
    };
  }

  /**
   * Compute global aggregates from database
   */
  private static async computeGlobalAggregates(): Promise<GlobalAggregates> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers24h,
      activeUsers7d,
      activeUsers30d,
      newUsers7d,
      totalCourses,
      totalAssessments,
      allUserProgress,
      allAssessments,
      popularCourses
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: oneDayAgo
          }
        }
      }),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: sevenDaysAgo
          }
        }
      }),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.assessment.count({ where: { isActive: true } }),
      prisma.userProgress.findMany({
        select: {
          completionRate: true,
          studyTimeMinutes: true,
          course: {
            select: {
              tags: true
            }
          }
        }
      }),
      prisma.userAssessment.findMany({
        select: {
          score: true,
          maxScore: true
        }
      }),
      prisma.userProgress.groupBy({
        by: ['courseId'],
        _count: {
          userId: true
        },
        _avg: {
          completionRate: true
        },
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: 10
      })
    ]);

    // Calculate retention rate (simplified)
    const retentionRate = totalUsers > 0 ? (activeUsers30d / totalUsers) * 100 : 0;

    // Calculate total study hours
    const totalStudyHours = allUserProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0) / 60;

    // Calculate average completion rate
    const averageCompletionRate = allUserProgress.length > 0
      ? allUserProgress.reduce((sum, p) => sum + p.completionRate, 0) / allUserProgress.length
      : 0;

    // Get course details for popular courses
    const courseIds = popularCourses.map(c => c.courseId);
    const courseDetails = await prisma.course.findMany({
      where: {
        id: {
          in: courseIds
        }
      },
      select: {
        id: true,
        title: true
      }
    });

    const mostPopularCourses = popularCourses.map(pc => {
      const course = courseDetails.find(c => c.id === pc.courseId);
      return {
        id: pc.courseId,
        title: course?.title || 'Unknown Course',
        enrollments: pc._count.userId,
        completionRate: pc._avg.completionRate || 0
      };
    });

    // Calculate average assessment score
    const averageAssessmentScore = allAssessments.length > 0
      ? allAssessments.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / allAssessments.length
      : 0;

    // Calculate skill distribution
    const skillCounts = new Map<string, number[]>();
    allUserProgress.forEach(p => {
      p.course.tags.forEach(tag => {
        if (!skillCounts.has(tag)) {
          skillCounts.set(tag, []);
        }
        skillCounts.get(tag)!.push(p.completionRate);
      });
    });

    const skillDistribution: Record<string, {
      userCount: number;
      averageLevel: number;
      progressRate: number;
    }> = {};

    for (const [skill, completionRates] of skillCounts.entries()) {
      skillDistribution[skill] = {
        userCount: completionRates.length,
        averageLevel: completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length,
        progressRate: completionRates.filter(rate => rate > 0).length / completionRates.length * 100
      };
    }

    return {
      userMetrics: {
        totalUsers,
        activeUsers24h,
        activeUsers7d,
        activeUsers30d,
        newUsers7d,
        retentionRate
      },
      learningMetrics: {
        totalCourses,
        totalAssessments,
        totalStudyHours,
        averageCompletionRate,
        mostPopularCourses
      },
      performanceMetrics: {
        averageAssessmentScore,
        skillDistribution
      }
    };
  }

  /**
   * Compute leaderboard from database
   */
  private static async computeLeaderboard(
    type: 'overall' | 'weekly' | 'monthly',
    limit: number
  ): Promise<Array<{
    userId: string;
    username: string;
    score: number;
    rank: number;
    avatar?: string;
    level: number;
  }>> {
    let dateFilter: Date;
    
    switch (type) {
      case 'weekly':
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(0); // All time
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        xp: true,
        userAssessments: type === 'overall' ? {
          select: {
            score: true,
            maxScore: true
          }
        } : {
          where: {
            completedAt: {
              gte: dateFilter
            }
          },
          select: {
            score: true,
            maxScore: true
          }
        }
      },
      take: limit * 2 // Get more to handle filtering
    });

    const leaderboard = users
      .map(user => {
        const totalScore = user.userAssessments.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0);
        const assessmentCount = user.userAssessments.length;
        const averageScore = assessmentCount > 0 ? totalScore / assessmentCount : 0;
        
        // Combine XP and assessment performance for overall score
        const score = type === 'overall' 
          ? user.xp + (averageScore * 10) // Weight assessment performance
          : averageScore;

        return {
          userId: user.id,
          username: user.username || 'Anonymous',
          score: Math.round(score),
          rank: 0, // Will be set after sorting
          avatar: user.avatar || undefined,
          level: user.level
        };
      })
      .filter(user => user.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Set ranks
    leaderboard.forEach((user, index) => {
      user.rank = index + 1;
    });

    return leaderboard;
  }

  // Helper methods for trend generation

  private static generateWeeklyTrends(
    userProgress: any[],
    userAssessments: any[]
  ): Array<{ week: string; score: number; studyTime: number }> {
    const weekMap = new Map<string, { scores: number[]; studyTime: number }>();

    // Process assessments
    userAssessments.forEach(a => {
      const week = this.getWeekKey(a.completedAt);
      if (!weekMap.has(week)) {
        weekMap.set(week, { scores: [], studyTime: 0 });
      }
      weekMap.get(week)!.scores.push((a.score / a.maxScore) * 100);
    });

    // Process study time
    userProgress.forEach(p => {
      const week = this.getWeekKey(p.lastAccessed);
      if (!weekMap.has(week)) {
        weekMap.set(week, { scores: [], studyTime: 0 });
      }
      weekMap.get(week)!.studyTime += p.studyTimeMinutes;
    });

    return Array.from(weekMap.entries()).map(([week, data]) => ({
      week,
      score: data.scores.length > 0 
        ? data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length
        : 0,
      studyTime: Math.round(data.studyTime / 60 * 10) / 10 // Hours with 1 decimal
    }));
  }

  private static generateMonthlyTrends(
    userProgress: any[],
    userAssessments: any[]
  ): Array<{ month: string; completionRate: number; avgScore: number }> {
    const monthMap = new Map<string, { completionRates: number[]; scores: number[] }>();

    // Process progress
    userProgress.forEach(p => {
      const month = p.lastAccessed.toISOString().substring(0, 7); // YYYY-MM
      if (!monthMap.has(month)) {
        monthMap.set(month, { completionRates: [], scores: [] });
      }
      monthMap.get(month)!.completionRates.push(p.completionRate);
    });

    // Process assessments
    userAssessments.forEach(a => {
      const month = a.completedAt.toISOString().substring(0, 7);
      if (!monthMap.has(month)) {
        monthMap.set(month, { completionRates: [], scores: [] });
      }
      monthMap.get(month)!.scores.push((a.score / a.maxScore) * 100);
    });

    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      completionRate: data.completionRates.length > 0
        ? data.completionRates.reduce((sum, r) => sum + r, 0) / data.completionRates.length
        : 0,
      avgScore: data.scores.length > 0
        ? data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length
        : 0
    }));
  }

  private static getWeekKey(date: Date): string {
    const week = new Date(date);
    week.setDate(week.getDate() - week.getDay()); // Start of week
    return week.toISOString().split('T')[0];
  }
}