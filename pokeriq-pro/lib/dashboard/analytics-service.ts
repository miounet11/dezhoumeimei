/**
 * Analytics Service for Dashboard
 * Handles learning analytics calculations, performance metrics, and trend analysis
 */

import { createLogger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';
import { type Course, type UserProgress, type UserAssessment, type User, type UserStats } from '@prisma/client';

const logger = createLogger('analytics-service');

export interface LearningAnalytics {
  courseCompletion: {
    totalCourses: number;
    completedCourses: number;
    completionRate: number;
    averageScore: number;
    totalStudyTime: number;
  };
  skillProgression: {
    dimensions: SkillDimension[];
    overallProgress: number;
    strongestSkills: string[];
    weakestSkills: string[];
  };
  performanceTrends: {
    assessmentScores: TrendData[];
    studyTimeWeekly: TrendData[];
    completionRateMonthly: TrendData[];
  };
  studyPatterns: {
    preferredStudyTimes: HourlyActivity[];
    sessionLengths: number[];
    consistency: ConsistencyMetrics;
  };
}

export interface SkillDimension {
  name: string;
  category: string;
  currentLevel: number;
  maxLevel: number;
  progress: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface HourlyActivity {
  hour: number;
  count: number;
  avgDuration: number;
}

export interface ConsistencyMetrics {
  streakDays: number;
  studyDaysPerWeek: number;
  avgSessionsPerDay: number;
  regularityScore: number;
}

export interface UserPerformanceMetrics {
  assessmentPerformance: {
    totalAssessments: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    recentTrend: 'improving' | 'declining' | 'stable';
    categoryBreakdown: CategoryPerformance[];
  };
  learningVelocity: {
    coursesPerWeek: number;
    topicsPerWeek: number;
    timeToCompletion: number;
    efficiencyScore: number;
  };
  engagement: {
    dailyActiveTime: number;
    weeklyActiveTime: number;
    monthlyActiveTime: number;
    sessionCount: number;
    lastActiveDate: Date;
  };
}

export interface CategoryPerformance {
  category: string;
  averageScore: number;
  assessmentCount: number;
  trend: 'up' | 'down' | 'stable';
}

export class AnalyticsService {
  /**
   * Get comprehensive learning analytics for a user
   */
  static async getLearningAnalytics(userId: string): Promise<LearningAnalytics> {
    try {
      logger.info('Generating learning analytics', { userId });

      const [
        courseCompletion,
        skillProgression,
        performanceTrends,
        studyPatterns
      ] = await Promise.all([
        this.getCourseCompletionAnalytics(userId),
        this.getSkillProgressionAnalytics(userId),
        this.getPerformanceTrends(userId),
        this.getStudyPatterns(userId)
      ]);

      const analytics: LearningAnalytics = {
        courseCompletion,
        skillProgression,
        performanceTrends,
        studyPatterns
      };

      logger.info('Learning analytics generated', { userId, metricsCount: 4 });
      return analytics;

    } catch (error) {
      logger.error('Failed to generate learning analytics', { error, userId });
      throw new Error(`Failed to generate learning analytics: ${error}`);
    }
  }

  /**
   * Get user performance metrics
   */
  static async getUserPerformanceMetrics(userId: string): Promise<UserPerformanceMetrics> {
    try {
      logger.info('Generating performance metrics', { userId });

      const [assessmentPerformance, learningVelocity, engagement] = await Promise.all([
        this.getAssessmentPerformance(userId),
        this.getLearningVelocity(userId),
        this.getEngagementMetrics(userId)
      ]);

      return {
        assessmentPerformance,
        learningVelocity,
        engagement
      };

    } catch (error) {
      logger.error('Failed to generate performance metrics', { error, userId });
      throw new Error(`Failed to generate performance metrics: ${error}`);
    }
  }

  /**
   * Get course completion analytics
   */
  private static async getCourseCompletionAnalytics(userId: string) {
    const [userProgress, totalCourses] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              level: true,
              durationMinutes: true
            }
          }
        }
      }),
      prisma.course.count({
        where: { isActive: true }
      })
    ]);

    const completedCourses = userProgress.filter(p => p.completionRate >= 100).length;
    const totalStudyTime = userProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0);
    
    // Calculate average score from test results
    const assessments = await prisma.userAssessment.findMany({
      where: {
        userId,
        assessment: {
          course: {
            id: {
              in: userProgress.map(p => p.courseId)
            }
          }
        }
      }
    });

    const averageScore = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / assessments.length
      : 0;

    return {
      totalCourses,
      completedCourses,
      completionRate: totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0,
      averageScore,
      totalStudyTime
    };
  }

  /**
   * Get skill progression analytics
   */
  private static async getSkillProgressionAnalytics(userId: string) {
    // Get user's progress across different skill areas
    const userProgress = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            tags: true,
            level: true
          }
        }
      }
    });

    const assessments = await prisma.userAssessment.findMany({
      where: { userId },
      include: {
        assessment: {
          include: {
            course: {
              select: {
                tags: true,
                level: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    // Define skill categories based on poker knowledge areas
    const skillCategories = {
      'preflop': ['preflop', 'starting-hands', 'position'],
      'postflop': ['postflop', 'betting', 'pot-odds'],
      'psychology': ['psychology', 'bluffing', 'reading'],
      'mathematics': ['math', 'probability', 'ev'],
      'bankroll': ['bankroll', 'money-management'],
      'tournament': ['tournament', 'mtt', 'sng']
    };

    const dimensions: SkillDimension[] = [];

    for (const [category, tags] of Object.entries(skillCategories)) {
      const categoryProgress = userProgress.filter(p => 
        p.course.tags.some(tag => tags.includes(tag.toLowerCase()))
      );

      const categoryAssessments = assessments.filter(a =>
        a.assessment.course.tags.some(tag => tags.includes(tag.toLowerCase()))
      );

      if (categoryProgress.length === 0) {
        dimensions.push({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          category: 'Poker Skills',
          currentLevel: 0,
          maxLevel: 100,
          progress: 0,
          trend: 'stable',
          confidence: 0
        });
        continue;
      }

      const avgProgress = categoryProgress.reduce((sum, p) => sum + p.completionRate, 0) / categoryProgress.length;
      const avgScore = categoryAssessments.length > 0 
        ? categoryAssessments.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / categoryAssessments.length
        : 0;

      // Calculate trend based on recent assessments
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (categoryAssessments.length >= 2) {
        const recent = categoryAssessments.slice(0, 3);
        const older = categoryAssessments.slice(-3);
        const recentAvg = recent.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / recent.length;
        const olderAvg = older.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / older.length;
        
        if (recentAvg > olderAvg + 5) trend = 'up';
        else if (recentAvg < olderAvg - 5) trend = 'down';
      }

      dimensions.push({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        category: 'Poker Skills',
        currentLevel: Math.round(avgScore),
        maxLevel: 100,
        progress: avgProgress,
        trend,
        confidence: Math.min(categoryAssessments.length / 5, 1) // Confidence based on assessment count
      });
    }

    const overallProgress = dimensions.reduce((sum, d) => sum + d.progress, 0) / dimensions.length;
    const strongestSkills = dimensions
      .filter(d => d.currentLevel > overallProgress)
      .sort((a, b) => b.currentLevel - a.currentLevel)
      .slice(0, 3)
      .map(d => d.name);
    
    const weakestSkills = dimensions
      .filter(d => d.currentLevel < overallProgress)
      .sort((a, b) => a.currentLevel - b.currentLevel)
      .slice(0, 3)
      .map(d => d.name);

    return {
      dimensions,
      overallProgress,
      strongestSkills,
      weakestSkills
    };
  }

  /**
   * Get performance trends
   */
  private static async getPerformanceTrends(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Assessment scores over time
    const assessments = await prisma.userAssessment.findMany({
      where: {
        userId,
        completedAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        completedAt: 'asc'
      }
    });

    const assessmentScores: TrendData[] = assessments.map(a => ({
      date: a.completedAt.toISOString().split('T')[0],
      value: (a.score / a.maxScore) * 100,
      label: `${a.score}/${a.maxScore}`
    }));

    // Study time by week
    const progressUpdates = await prisma.userProgress.findMany({
      where: {
        userId,
        updatedAt: {
          gte: ninetyDaysAgo
        }
      },
      orderBy: {
        updatedAt: 'asc'
      }
    });

    // Group by week
    const weeklyStudyTime = new Map<string, number>();
    progressUpdates.forEach(p => {
      const weekStart = new Date(p.updatedAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyStudyTime.set(weekKey, (weeklyStudyTime.get(weekKey) || 0) + p.studyTimeMinutes);
    });

    const studyTimeWeekly: TrendData[] = Array.from(weeklyStudyTime.entries()).map(([date, minutes]) => ({
      date,
      value: Math.round(minutes / 60 * 10) / 10, // Convert to hours with 1 decimal
      label: `${Math.round(minutes / 60 * 10) / 10}h`
    }));

    // Monthly completion rates
    const monthlyCompletion = new Map<string, { completed: number; total: number }>();
    progressUpdates.forEach(p => {
      const monthKey = p.updatedAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyCompletion.has(monthKey)) {
        monthlyCompletion.set(monthKey, { completed: 0, total: 0 });
      }
      const data = monthlyCompletion.get(monthKey)!;
      data.total++;
      if (p.completionRate >= 100) data.completed++;
    });

    const completionRateMonthly: TrendData[] = Array.from(monthlyCompletion.entries()).map(([date, data]) => ({
      date: date + '-01',
      value: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      label: `${data.completed}/${data.total}`
    }));

    return {
      assessmentScores,
      studyTimeWeekly,
      completionRateMonthly
    };
  }

  /**
   * Get study patterns
   */
  private static async getStudyPatterns(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const progressUpdates = await prisma.userProgress.findMany({
      where: {
        userId,
        updatedAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        updatedAt: 'asc'
      }
    });

    // Preferred study times (by hour)
    const hourlyActivity = new Array(24).fill(0).map((_, hour) => ({
      hour,
      count: 0,
      avgDuration: 0,
      totalDuration: 0
    }));

    const dailyActivity = new Map<string, number>();
    const sessionLengths: number[] = [];

    progressUpdates.forEach(p => {
      const hour = p.updatedAt.getHours();
      const dayKey = p.updatedAt.toISOString().split('T')[0];
      
      hourlyActivity[hour].count++;
      hourlyActivity[hour].totalDuration += p.studyTimeMinutes;
      
      dailyActivity.set(dayKey, (dailyActivity.get(dayKey) || 0) + p.studyTimeMinutes);
      sessionLengths.push(p.studyTimeMinutes);
    });

    // Calculate average durations
    const preferredStudyTimes: HourlyActivity[] = hourlyActivity.map(h => ({
      hour: h.hour,
      count: h.count,
      avgDuration: h.count > 0 ? h.totalDuration / h.count : 0
    }));

    // Consistency metrics
    const studyDays = Array.from(dailyActivity.keys()).length;
    const totalDays = Math.min(30, Math.ceil((Date.now() - thirtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000)));
    const studyDaysPerWeek = (studyDays / totalDays) * 7;
    
    // Calculate streak
    const sortedDays = Array.from(dailyActivity.keys()).sort();
    let streakDays = 0;
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - (sortedDays.length - 1 - i));
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (sortedDays[i] === expectedDateStr) {
        currentStreak++;
      } else {
        break;
      }
    }
    streakDays = currentStreak;

    const avgSessionsPerDay = progressUpdates.length / Math.max(studyDays, 1);
    const regularityScore = Math.min((studyDaysPerWeek / 7) * 100, 100);

    const consistency: ConsistencyMetrics = {
      streakDays,
      studyDaysPerWeek,
      avgSessionsPerDay,
      regularityScore
    };

    return {
      preferredStudyTimes,
      sessionLengths,
      consistency
    };
  }

  /**
   * Get assessment performance metrics
   */
  private static async getAssessmentPerformance(userId: string) {
    const assessments = await prisma.userAssessment.findMany({
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
    });

    if (assessments.length === 0) {
      return {
        totalAssessments: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        recentTrend: 'stable' as const,
        categoryBreakdown: []
      };
    }

    const scores = assessments.map(a => (a.score / a.maxScore) * 100);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Calculate trend from recent vs older assessments
    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (assessments.length >= 4) {
      const recent = scores.slice(0, Math.floor(assessments.length / 2));
      const older = scores.slice(Math.floor(assessments.length / 2));
      const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
      const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
      
      if (recentAvg > olderAvg + 5) recentTrend = 'improving';
      else if (recentAvg < olderAvg - 5) recentTrend = 'declining';
    }

    // Category breakdown
    const categoryMap = new Map<string, { scores: number[], count: number }>();
    assessments.forEach(a => {
      a.assessment.course.tags.forEach(tag => {
        if (!categoryMap.has(tag)) {
          categoryMap.set(tag, { scores: [], count: 0 });
        }
        const category = categoryMap.get(tag)!;
        category.scores.push((a.score / a.maxScore) * 100);
        category.count++;
      });
    });

    const categoryBreakdown: CategoryPerformance[] = Array.from(categoryMap.entries()).map(([category, data]) => {
      const avgScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
      const recentScores = data.scores.slice(0, Math.ceil(data.scores.length / 2));
      const olderScores = data.scores.slice(Math.ceil(data.scores.length / 2));
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentScores.length > 0 && olderScores.length > 0) {
        const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length;
        if (recentAvg > olderAvg + 3) trend = 'up';
        else if (recentAvg < olderAvg - 3) trend = 'down';
      }

      return {
        category,
        averageScore: avgScore,
        assessmentCount: data.count,
        trend
      };
    });

    return {
      totalAssessments: assessments.length,
      averageScore,
      highestScore,
      lowestScore,
      recentTrend,
      categoryBreakdown
    };
  }

  /**
   * Get learning velocity metrics
   */
  private static async getLearningVelocity(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentProgress, weeklyProgress] = await Promise.all([
      prisma.userProgress.findMany({
        where: {
          userId,
          updatedAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.userProgress.findMany({
        where: {
          userId,
          updatedAt: {
            gte: sevenDaysAgo
          }
        }
      })
    ]);

    const completedCourses = recentProgress.filter(p => p.completionRate >= 100).length;
    const coursesPerWeek = (completedCourses / 30) * 7;

    // Estimate topics based on course sections
    const topicsCompleted = recentProgress.reduce((sum, p) => sum + p.currentSection, 0);
    const topicsPerWeek = (topicsCompleted / 30) * 7;

    // Calculate average time to completion
    const completionTimes = recentProgress
      .filter(p => p.completedAt)
      .map(p => {
        const timeDiff = p.completedAt!.getTime() - p.createdAt.getTime();
        return timeDiff / (24 * 60 * 60 * 1000); // days
      });

    const timeToCompletion = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    // Efficiency score based on study time vs completion
    const totalStudyTime = recentProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0);
    const totalCompletion = recentProgress.reduce((sum, p) => sum + p.completionRate, 0) / recentProgress.length;
    const efficiencyScore = totalStudyTime > 0 ? (totalCompletion / totalStudyTime) * 100 : 0;

    return {
      coursesPerWeek,
      topicsPerWeek,
      timeToCompletion,
      efficiencyScore: Math.min(efficiencyScore, 100)
    };
  }

  /**
   * Get engagement metrics
   */
  private static async getEngagementMetrics(userId: string) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dailyProgress, weeklyProgress, monthlyProgress, user] = await Promise.all([
      prisma.userProgress.findMany({
        where: {
          userId,
          lastAccessed: {
            gte: oneDayAgo
          }
        }
      }),
      prisma.userProgress.findMany({
        where: {
          userId,
          lastAccessed: {
            gte: sevenDaysAgo
          }
        }
      }),
      prisma.userProgress.findMany({
        where: {
          userId,
          lastAccessed: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          lastLoginAt: true
        }
      })
    ]);

    const dailyActiveTime = dailyProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0);
    const weeklyActiveTime = weeklyProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0);
    const monthlyActiveTime = monthlyProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0);
    const sessionCount = monthlyProgress.length;

    return {
      dailyActiveTime,
      weeklyActiveTime,
      monthlyActiveTime,
      sessionCount,
      lastActiveDate: user?.lastLoginAt || new Date()
    };
  }

  /**
   * Get aggregated dashboard data for multiple users (admin function)
   */
  static async getAggregatedAnalytics(limit: number = 100): Promise<{
    totalUsers: number;
    activeUsers: number;
    averageCompletionRate: number;
    popularCourses: Array<{
      courseId: string;
      title: string;
      enrollmentCount: number;
      averageScore: number;
    }>;
    skillDistribution: Record<string, number>;
  }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [totalUsers, activeUsers, userProgress, popularCourses] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            lastLoginAt: {
              gte: thirtyDaysAgo
            }
          }
        }),
        prisma.userProgress.findMany({
          include: {
            course: {
              select: {
                tags: true
              }
            }
          },
          take: limit * 10 // Get more data for better analysis
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

      const averageCompletionRate = userProgress.length > 0
        ? userProgress.reduce((sum, p) => sum + p.completionRate, 0) / userProgress.length
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

      const popularCoursesWithDetails = popularCourses.map(pc => {
        const course = courseDetails.find(c => c.id === pc.courseId);
        return {
          courseId: pc.courseId,
          title: course?.title || 'Unknown Course',
          enrollmentCount: pc._count.userId,
          averageScore: pc._avg.completionRate || 0
        };
      });

      // Calculate skill distribution
      const skillDistribution: Record<string, number> = {};
      userProgress.forEach(p => {
        p.course.tags.forEach(tag => {
          skillDistribution[tag] = (skillDistribution[tag] || 0) + 1;
        });
      });

      return {
        totalUsers,
        activeUsers,
        averageCompletionRate,
        popularCourses: popularCoursesWithDetails,
        skillDistribution
      };

    } catch (error) {
      logger.error('Failed to get aggregated analytics', { error });
      throw new Error(`Failed to get aggregated analytics: ${error}`);
    }
  }
}