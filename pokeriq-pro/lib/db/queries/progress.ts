/**
 * Progress Query Functions for Dezhoumama Learning Platform
 * Comprehensive user progress tracking and analytics
 */

import { Prisma } from '@prisma/client';
import { prisma, dbPool } from '@/lib/db/prisma';
import { createLogger } from '@/lib/logger';
import {
  UserProgress,
  UserProgressWithRelations,
  CreateUserProgressInput,
  UpdateUserProgressInput,
  ProgressFilters,
  ProgressSortOptions,
  PaginationOptions,
  PaginatedResult,
  QueryResult,
  TestScore,
  LearningAnalytics,
  CourseLevel
} from '@/lib/types/dezhoumama';

const logger = createLogger('progress-queries');

/**
 * Progress Query Service
 * Handles all database operations for UserProgress tracking
 */
export class ProgressQueries {
  
  // ==========================================================================
  // BASIC CRUD Operations
  // ==========================================================================

  /**
   * Create or update user progress for a course
   */
  static async upsertUserProgress(input: CreateUserProgressInput): Promise<QueryResult<UserProgress>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Validate course exists and is active
      const course = await writeClient.course.findUnique({
        where: { id: input.courseId },
        select: { id: true, isActive: true, title: true }
      });

      if (!course || !course.isActive) {
        return {
          success: false,
          error: 'Course not found or inactive'
        };
      }

      const userProgress = await writeClient.userProgress.upsert({
        where: {
          userId_courseId: {
            userId: input.userId,
            courseId: input.courseId
          }
        },
        update: {
          completionRate: input.completionRate ?? undefined,
          currentSection: input.currentSection ?? undefined,
          testScores: input.testScores ? (input.testScores as any) : undefined,
          studyTimeMinutes: input.studyTimeMinutes ?? undefined,
          lastAccessed: new Date()
        },
        create: {
          userId: input.userId,
          courseId: input.courseId,
          completionRate: input.completionRate ?? 0,
          currentSection: input.currentSection ?? 1,
          testScores: input.testScores ? (input.testScores as any) : [],
          studyTimeMinutes: input.studyTimeMinutes ?? 0,
          lastAccessed: new Date()
        }
      });

      // Check if course is completed (100% completion rate)
      const shouldMarkCompleted = userProgress.completionRate >= 100 && !userProgress.completedAt;
      
      if (shouldMarkCompleted) {
        await writeClient.userProgress.update({
          where: { id: userProgress.id },
          data: { completedAt: new Date() }
        });
        userProgress.completedAt = new Date();
      }

      const executionTime = Date.now() - startTime;
      logger.info('User progress upserted successfully', {
        progressId: userProgress.id,
        userId: input.userId,
        courseId: input.courseId,
        completionRate: userProgress.completionRate,
        executionTime
      });

      return {
        success: true,
        data: userProgress as UserProgress,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to upsert user progress', { error, input, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user progress by user ID and course ID
   */
  static async getUserProgress(
    userId: string,
    courseId: string,
    includeRelations: boolean = false
  ): Promise<QueryResult<UserProgress | UserProgressWithRelations | null>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const userProgress = await readClient.userProgress.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        include: includeRelations ? {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              level: true,
              xp: true
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              level: true,
              durationMinutes: true,
              prerequisites: true
            }
          }
        } : undefined
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: userProgress as UserProgress | UserProgressWithRelations | null,
        metadata: {
          executionTime,
          cacheHit: false
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get user progress', { error, userId, courseId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all user progress for a specific user
   */
  static async getUserProgressList(
    userId: string,
    filters: Omit<ProgressFilters, 'userId'> = {},
    sort: ProgressSortOptions = { field: 'lastAccessed', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<QueryResult<PaginatedResult<UserProgressWithRelations>>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      const { page = 1, limit = 50 } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause
      const where: Prisma.UserProgressWhereInput = {
        userId,
        ...(filters.courseId && { courseId: filters.courseId }),
        ...(filters.completionRate && {
          completionRate: {
            ...(filters.completionRate.min !== undefined && { gte: filters.completionRate.min }),
            ...(filters.completionRate.max !== undefined && { lte: filters.completionRate.max })
          }
        }),
        ...(filters.lastAccessedAfter && { lastAccessed: { gte: filters.lastAccessedAfter } }),
        ...(filters.lastAccessedBefore && { lastAccessed: { lte: filters.lastAccessedBefore } }),
        ...(filters.completed !== undefined && {
          completedAt: filters.completed ? { not: null } : null
        })
      };

      // Build order by clause
      const orderBy: Prisma.UserProgressOrderByWithRelationInput = {
        [sort.field]: sort.direction
      };

      // Execute queries in parallel
      const [progressList, totalCount] = await Promise.all([
        readClient.userProgress.findMany({
          where,
          include: {
            course: {
              select: {
                id: true,
                title: true,
                level: true,
                durationMinutes: true,
                thumbnailUrl: true,
                tags: true
              }
            }
          },
          orderBy,
          skip: offset,
          take: limit
        }),
        readClient.userProgress.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          data: progressList as UserProgressWithRelations[],
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get user progress list', { error, userId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update user progress
   */
  static async updateUserProgress(input: UpdateUserProgressInput): Promise<QueryResult<UserProgress>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const { id, ...updateData } = input;
      
      // Set lastAccessed to current time
      const dataToUpdate = {
        ...updateData,
        lastAccessed: new Date()
      };

      const userProgress = await writeClient.userProgress.update({
        where: { id },
        data: dataToUpdate
      });

      // Check if course should be marked as completed
      if (userProgress.completionRate >= 100 && !userProgress.completedAt) {
        await writeClient.userProgress.update({
          where: { id },
          data: { completedAt: new Date() }
        });
        userProgress.completedAt = new Date();
      }

      const executionTime = Date.now() - startTime;
      logger.info('User progress updated successfully', {
        progressId: userProgress.id,
        changes: Object.keys(updateData),
        completionRate: userProgress.completionRate,
        executionTime
      });

      return {
        success: true,
        data: userProgress as UserProgress,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to update user progress', { error, input, executionTime });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            error: 'User progress not found'
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // PROGRESS TRACKING Methods
  // ==========================================================================

  /**
   * Add study time to user progress
   */
  static async addStudyTime(
    userId: string,
    courseId: string,
    minutesToAdd: number
  ): Promise<QueryResult<UserProgress>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const userProgress = await writeClient.userProgress.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        update: {
          studyTimeMinutes: { increment: minutesToAdd },
          lastAccessed: new Date()
        },
        create: {
          userId,
          courseId,
          completionRate: 0,
          currentSection: 1,
          studyTimeMinutes: minutesToAdd,
          testScores: []
        }
      });

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: userProgress as UserProgress,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to add study time', { error, userId, courseId, minutesToAdd, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update completion rate for a course
   */
  static async updateCompletionRate(
    userId: string,
    courseId: string,
    completionRate: number
  ): Promise<QueryResult<UserProgress>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Ensure completion rate is between 0 and 100
      const validCompletionRate = Math.max(0, Math.min(100, completionRate));
      
      const userProgress = await writeClient.userProgress.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        update: {
          completionRate: validCompletionRate,
          lastAccessed: new Date(),
          ...(validCompletionRate >= 100 && { completedAt: new Date() })
        },
        create: {
          userId,
          courseId,
          completionRate: validCompletionRate,
          currentSection: 1,
          studyTimeMinutes: 0,
          testScores: [],
          ...(validCompletionRate >= 100 && { completedAt: new Date() })
        }
      });

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: userProgress as UserProgress,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to update completion rate', { 
        error, userId, courseId, completionRate, executionTime 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update current section
   */
  static async updateCurrentSection(
    userId: string,
    courseId: string,
    section: number
  ): Promise<QueryResult<UserProgress>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const userProgress = await writeClient.userProgress.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        update: {
          currentSection: section,
          lastAccessed: new Date()
        },
        create: {
          userId,
          courseId,
          completionRate: 0,
          currentSection: section,
          studyTimeMinutes: 0,
          testScores: []
        }
      });

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: userProgress as UserProgress,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to update current section', { 
        error, userId, courseId, section, executionTime 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Add test score to user progress
   */
  static async addTestScore(
    userId: string,
    courseId: string,
    testScore: TestScore
  ): Promise<QueryResult<UserProgress>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Get current progress
      const currentProgress = await writeClient.userProgress.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      });

      const currentScores = currentProgress?.testScores as TestScore[] || [];
      const updatedScores = [...currentScores, testScore];

      const userProgress = await writeClient.userProgress.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        update: {
          testScores: updatedScores,
          lastAccessed: new Date()
        },
        create: {
          userId,
          courseId,
          completionRate: 0,
          currentSection: 1,
          studyTimeMinutes: 0,
          testScores: [testScore]
        }
      });

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: userProgress as UserProgress,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to add test score', { 
        error, userId, courseId, testScore, executionTime 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // ANALYTICS and INSIGHTS
  // ==========================================================================

  /**
   * Get comprehensive learning analytics for a user
   */
  static async getUserLearningAnalytics(userId: string): Promise<QueryResult<LearningAnalytics>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      // Get all user progress with course information
      const [userProgressList, userAssessments, totalCourses] = await Promise.all([
        readClient.userProgress.findMany({
          where: { userId },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                level: true,
                tags: true
              }
            }
          }
        }),
        readClient.userAssessment.findMany({
          where: { userId },
          include: {
            assessment: {
              select: {
                passThreshold: true
              }
            }
          },
          orderBy: { completedAt: 'desc' }
        }),
        readClient.course.count({ where: { isActive: true } })
      ]);

      // Course progress analytics
      const completedCourses = userProgressList.filter(up => up.completedAt !== null).length;
      const inProgressCourses = userProgressList.filter(
        up => up.completionRate > 0 && up.completedAt === null
      ).length;
      const totalCompletionRate = userProgressList.length > 0
        ? userProgressList.reduce((sum, up) => sum + up.completionRate, 0) / userProgressList.length
        : 0;

      const courseProgress = {
        totalCourses,
        completedCourses,
        inProgressCourses,
        averageCompletionRate: totalCompletionRate
      };

      // Assessment performance analytics
      const totalAssessments = userAssessments.length;
      const totalScore = userAssessments.reduce((sum, ua) => 
        sum + (ua.score / ua.maxScore) * 100, 0);
      const averageScore = totalAssessments > 0 ? totalScore / totalAssessments : 0;
      
      const passedAssessments = userAssessments.filter(ua => 
        (ua.score / ua.maxScore) * 100 >= ua.assessment.passThreshold).length;
      const passRate = totalAssessments > 0 ? (passedAssessments / totalAssessments) * 100 : 0;
      
      // Calculate improvement trend
      const improvementTrend = this.calculateImprovementTrend(userAssessments);

      const assessmentPerformance = {
        totalAssessments,
        averageScore,
        passRate,
        improvementTrend
      };

      // Study patterns analytics
      const totalStudyTime = userProgressList.reduce((sum, up) => sum + up.studyTimeMinutes, 0);
      const studySessions = userProgressList.filter(up => up.studyTimeMinutes > 0).length;
      const averageSessionDuration = studySessions > 0 ? totalStudyTime / studySessions : 0;
      
      // Calculate most active time based on lastAccessed timestamps
      const mostActiveTimeOfDay = this.calculateMostActiveTime(userProgressList);
      
      // Calculate consistency score based on regular access patterns
      const consistencyScore = this.calculateConsistencyScore(userProgressList);

      const studyPatterns = {
        totalStudyTime,
        averageSessionDuration,
        mostActiveTimeOfDay,
        consistencyScore
      };

      // Skill development analytics
      const skillAnalysis = this.analyzeUserSkills(userProgressList, userAssessments);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          courseProgress,
          assessmentPerformance,
          studyPatterns,
          skillDevelopment: skillAnalysis
        },
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get user learning analytics', { error, userId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get progress statistics for a specific course
   */
  static async getCourseProgressStats(courseId: string): Promise<QueryResult<{
    totalEnrolled: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    averageCompletionRate: number;
    averageStudyTime: number;
    completionRate: number;
    dropoffPoints: Array<{ section: number; count: number }>;
  }>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const progressList = await readClient.userProgress.findMany({
        where: { courseId }
      });

      const totalEnrolled = progressList.length;
      const completed = progressList.filter(p => p.completedAt !== null).length;
      const inProgress = progressList.filter(
        p => p.completionRate > 0 && p.completedAt === null
      ).length;
      const notStarted = totalEnrolled - inProgress - completed;

      const averageCompletionRate = totalEnrolled > 0
        ? progressList.reduce((sum, p) => sum + p.completionRate, 0) / totalEnrolled
        : 0;

      const averageStudyTime = totalEnrolled > 0
        ? progressList.reduce((sum, p) => sum + p.studyTimeMinutes, 0) / totalEnrolled
        : 0;

      const completionRate = totalEnrolled > 0 ? (completed / totalEnrolled) * 100 : 0;

      // Calculate drop-off points by analyzing current sections
      const sectionCounts = new Map<number, number>();
      progressList
        .filter(p => p.completedAt === null && p.completionRate < 100)
        .forEach(p => {
          const count = sectionCounts.get(p.currentSection) || 0;
          sectionCounts.set(p.currentSection, count + 1);
        });

      const dropoffPoints = Array.from(sectionCounts.entries())
        .map(([section, count]) => ({ section, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          totalEnrolled,
          completed,
          inProgress,
          notStarted,
          averageCompletionRate,
          averageStudyTime,
          completionRate,
          dropoffPoints
        },
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get course progress stats', { error, courseId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user learning streak
   */
  static async getUserLearningStreak(userId: string): Promise<QueryResult<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date | null;
    streakActive: boolean;
  }>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      // Get user progress ordered by last accessed date
      const progressList = await readClient.userProgress.findMany({
        where: { userId },
        select: {
          lastAccessed: true,
          studyTimeMinutes: true
        },
        orderBy: { lastAccessed: 'desc' }
      });

      if (progressList.length === 0) {
        return {
          success: true,
          data: {
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
            streakActive: false
          }
        };
      }

      const streakData = this.calculateLearningStreak(progressList);
      
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: streakData,
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get user learning streak', { error, userId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // UTILITY Methods
  // ==========================================================================

  /**
   * Calculate improvement trend from assessment history
   */
  private static calculateImprovementTrend(userAssessments: any[]): number {
    if (userAssessments.length < 4) return 0;

    const recent = userAssessments.slice(0, Math.floor(userAssessments.length / 2));
    const older = userAssessments.slice(Math.floor(userAssessments.length / 2));

    const recentAvg = recent.reduce((sum, ua) => 
      sum + (ua.score / ua.maxScore) * 100, 0) / recent.length;
    
    const olderAvg = older.reduce((sum, ua) => 
      sum + (ua.score / ua.maxScore) * 100, 0) / older.length;

    return recentAvg - olderAvg;
  }

  /**
   * Calculate most active time of day
   */
  private static calculateMostActiveTime(progressList: any[]): string {
    const hourCounts = new Map<number, number>();
    
    progressList.forEach(progress => {
      const hour = new Date(progress.lastAccessed).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const mostActiveHour = Array.from(hourCounts.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 9;

    if (mostActiveHour >= 6 && mostActiveHour < 12) return 'morning';
    if (mostActiveHour >= 12 && mostActiveHour < 18) return 'afternoon';
    if (mostActiveHour >= 18 && mostActiveHour < 22) return 'evening';
    return 'night';
  }

  /**
   * Calculate consistency score based on access patterns
   */
  private static calculateConsistencyScore(progressList: any[]): number {
    if (progressList.length < 7) return 0;

    const accessDates = progressList
      .map(p => new Date(p.lastAccessed).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index);

    const uniqueDays = accessDates.length;
    const totalDays = Math.min(30, progressList.length); // Consider last 30 days max
    
    return Math.min(100, (uniqueDays / totalDays) * 100);
  }

  /**
   * Analyze user skills from progress and assessment data
   */
  private static analyzeUserSkills(progressList: any[], userAssessments: any[]): {
    strongestAreas: string[];
    weakestAreas: string[];
    improvementAreas: string[];
    masteredSkills: string[];
  } {
    // Extract skill data from course tags and assessment breakdowns
    const skillScores = new Map<string, number[]>();
    
    // From course progress (tags represent skill areas)
    progressList.forEach(progress => {
      if (progress.course?.tags) {
        progress.course.tags.forEach((tag: string) => {
          const score = progress.completionRate;
          if (!skillScores.has(tag)) skillScores.set(tag, []);
          skillScores.get(tag)!.push(score);
        });
      }
    });

    // From assessment skill breakdowns
    userAssessments.forEach(ua => {
      if (ua.skillBreakdown) {
        Object.entries(ua.skillBreakdown as any).forEach(([skill, data]: [string, any]) => {
          if (data.percentage !== undefined) {
            if (!skillScores.has(skill)) skillScores.set(skill, []);
            skillScores.get(skill)!.push(data.percentage);
          }
        });
      }
    });

    // Calculate averages and categorize skills
    const skillAverages = new Map<string, number>();
    skillScores.forEach((scores, skill) => {
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      skillAverages.set(skill, average);
    });

    const sortedSkills = Array.from(skillAverages.entries())
      .sort(([,a], [,b]) => b - a);

    const strongestAreas = sortedSkills.slice(0, 3).map(([skill]) => skill);
    const weakestAreas = sortedSkills.slice(-3).map(([skill]) => skill).reverse();
    
    // Improvement areas: skills with significant room for growth
    const improvementAreas = sortedSkills
      .filter(([, average]) => average >= 30 && average < 70)
      .slice(0, 3)
      .map(([skill]) => skill);
    
    // Mastered skills: consistently high performance (>= 85%)
    const masteredSkills = sortedSkills
      .filter(([, average]) => average >= 85)
      .map(([skill]) => skill);

    return {
      strongestAreas,
      weakestAreas,
      improvementAreas,
      masteredSkills
    };
  }

  /**
   * Calculate learning streak from progress data
   */
  private static calculateLearningStreak(progressList: any[]): {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date | null;
    streakActive: boolean;
  } {
    if (progressList.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        streakActive: false
      };
    }

    const lastActiveDate = new Date(progressList[0].lastAccessed);
    const today = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Check if streak is still active (last activity within 48 hours)
    const streakActive = (today.getTime() - lastActiveDate.getTime()) <= (2 * oneDayMs);

    // Get unique study dates
    const studyDates = progressList
      .filter(p => p.studyTimeMinutes > 0)
      .map(p => new Date(p.lastAccessed).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort()
      .reverse();

    if (studyDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate,
        streakActive: false
      };
    }

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < studyDates.length - 1; i++) {
      const currentDate = new Date(studyDates[i]);
      const nextDate = new Date(studyDates[i + 1]);
      const dayDiff = (currentDate.getTime() - nextDate.getTime()) / oneDayMs;

      if (dayDiff <= 1.5) { // Allow some flexibility for timezone differences
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        if (i === 0) currentStreak = tempStreak;
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    if (currentStreak === 0) currentStreak = tempStreak;

    return {
      currentStreak: streakActive ? currentStreak : 0,
      longestStreak,
      lastActiveDate,
      streakActive
    };
  }
}

// Export convenience functions
export const {
  upsertUserProgress,
  getUserProgress,
  getUserProgressList,
  updateUserProgress,
  addStudyTime,
  updateCompletionRate,
  updateCurrentSection,
  addTestScore,
  getUserLearningAnalytics,
  getCourseProgressStats,
  getUserLearningStreak
} = ProgressQueries;