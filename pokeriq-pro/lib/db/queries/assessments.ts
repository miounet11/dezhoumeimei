/**
 * Assessment Query Functions for Dezhoumama Learning Platform
 * Comprehensive CRUD operations for assessments and user assessments
 */

import { Prisma } from '@prisma/client';
import { prisma, dbPool } from '@/lib/db/prisma';
import { createLogger } from '@/lib/logger';
import {
  Assessment,
  AssessmentWithRelations,
  CreateAssessmentInput,
  UpdateAssessmentInput,
  AssessmentFilters,
  AssessmentSortOptions,
  UserAssessment,
  UserAssessmentWithRelations,
  CreateUserAssessmentInput,
  AssessmentQuestion,
  ScoringConfig,
  AssessmentAnswer,
  SkillBreakdown,
  PaginationOptions,
  PaginatedResult,
  QueryResult
} from '@/lib/types/dezhoumama';

const logger = createLogger('assessment-queries');

/**
 * Assessment Query Service
 * Handles all database operations for Assessment and UserAssessment models
 */
export class AssessmentQueries {
  
  // ==========================================================================
  // ASSESSMENT CRUD Operations
  // ==========================================================================

  /**
   * Create a new assessment
   */
  static async createAssessment(input: CreateAssessmentInput): Promise<QueryResult<Assessment>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Validate course exists
      const courseExists = await writeClient.course.findUnique({
        where: { id: input.courseId },
        select: { id: true, isActive: true }
      });

      if (!courseExists || !courseExists.isActive) {
        return {
          success: false,
          error: 'Course not found or inactive'
        };
      }

      // Validate questions structure
      if (!input.questions || input.questions.length === 0) {
        return {
          success: false,
          error: 'Assessment must have at least one question'
        };
      }

      const assessment = await writeClient.assessment.create({
        data: {
          courseId: input.courseId,
          title: input.title,
          description: input.description,
          questions: input.questions as any,
          scoringConfig: input.scoringConfig as any,
          difficulty: input.difficulty,
          passThreshold: input.passThreshold ?? 70,
          timeLimitMinutes: input.timeLimitMinutes,
          maxAttempts: input.maxAttempts ?? 3,
          isActive: input.isActive ?? true
        }
      });

      const executionTime = Date.now() - startTime;
      logger.info('Assessment created successfully', {
        assessmentId: assessment.id,
        courseId: input.courseId,
        questionCount: input.questions.length,
        executionTime
      });

      return {
        success: true,
        data: assessment as Assessment,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to create assessment', { error, input, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get assessment by ID
   */
  static async getAssessmentById(
    id: string,
    includeRelations: boolean = false
  ): Promise<QueryResult<Assessment | AssessmentWithRelations>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const assessment = await readClient.assessment.findUnique({
        where: { id },
        include: includeRelations ? {
          course: true,
          userAssessments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true
                }
              }
            },
            orderBy: { completedAt: 'desc' },
            take: 100 // Limit recent attempts
          }
        } : undefined
      });

      const executionTime = Date.now() - startTime;

      if (!assessment) {
        return {
          success: false,
          error: 'Assessment not found',
          metadata: { executionTime }
        };
      }

      return {
        success: true,
        data: assessment as Assessment | AssessmentWithRelations,
        metadata: {
          executionTime,
          cacheHit: false
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get assessment by ID', { error, id, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get assessments with filtering and pagination
   */
  static async getAssessments(
    filters: AssessmentFilters = {},
    sort: AssessmentSortOptions = { field: 'createdAt', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<QueryResult<PaginatedResult<Assessment>>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause
      const where: Prisma.AssessmentWhereInput = {
        ...(filters.courseId && { courseId: filters.courseId }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      };

      // Build order by clause
      const orderBy: Prisma.AssessmentOrderByWithRelationInput = {
        [sort.field]: sort.direction
      };

      // Execute queries in parallel
      const [assessments, totalCount] = await Promise.all([
        readClient.assessment.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            course: {
              select: {
                id: true,
                title: true,
                level: true
              }
            }
          }
        }),
        readClient.assessment.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          data: assessments as Assessment[],
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        metadata: {
          executionTime,
          cacheHit: false
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get assessments', { error, filters, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get assessments by course ID
   */
  static async getAssessmentsByCourse(courseId: string): Promise<QueryResult<Assessment[]>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const assessments = await readClient.assessment.findMany({
        where: {
          courseId,
          isActive: true
        },
        orderBy: { createdAt: 'asc' }
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: assessments as Assessment[],
        metadata: {
          executionTime,
          recordsAffected: assessments.length
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get assessments by course', { error, courseId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update an assessment
   */
  static async updateAssessment(input: UpdateAssessmentInput): Promise<QueryResult<Assessment>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const { id, ...updateData } = input;
      
      const assessment = await writeClient.assessment.update({
        where: { id },
        data: updateData
      });

      const executionTime = Date.now() - startTime;
      logger.info('Assessment updated successfully', {
        assessmentId: assessment.id,
        changes: Object.keys(updateData),
        executionTime
      });

      return {
        success: true,
        data: assessment as Assessment,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to update assessment', { error, input, executionTime });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            error: 'Assessment not found'
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Soft delete an assessment
   */
  static async softDeleteAssessment(assessmentId: string): Promise<QueryResult<Assessment>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const assessment = await writeClient.assessment.update({
        where: { id: assessmentId },
        data: { isActive: false }
      });

      const executionTime = Date.now() - startTime;
      logger.info('Assessment soft deleted', { assessmentId, executionTime });

      return {
        success: true,
        data: assessment as Assessment,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to soft delete assessment', { error, assessmentId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // USER ASSESSMENT Operations
  // ==========================================================================

  /**
   * Submit user assessment (create user assessment record)
   */
  static async submitUserAssessment(input: CreateUserAssessmentInput): Promise<QueryResult<UserAssessment>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Validate assessment exists and is active
      const assessment = await writeClient.assessment.findUnique({
        where: { id: input.assessmentId },
        select: { id: true, isActive: true, maxAttempts: true }
      });

      if (!assessment || !assessment.isActive) {
        return {
          success: false,
          error: 'Assessment not found or inactive'
        };
      }

      // Check if user has exceeded max attempts
      const attemptCount = await writeClient.userAssessment.count({
        where: {
          userId: input.userId,
          assessmentId: input.assessmentId
        }
      });

      if (attemptCount >= assessment.maxAttempts) {
        return {
          success: false,
          error: `Maximum attempts (${assessment.maxAttempts}) exceeded`
        };
      }

      const userAssessment = await writeClient.userAssessment.create({
        data: {
          userId: input.userId,
          assessmentId: input.assessmentId,
          score: input.score,
          maxScore: input.maxScore,
          timeTaken: input.timeTaken,
          answers: input.answers as any,
          skillBreakdown: input.skillBreakdown as any
        }
      });

      // Update user progress if this is a passing score
      const percentage = (input.score / input.maxScore) * 100;
      await this.updateUserProgressAfterAssessment(
        input.userId,
        input.assessmentId,
        percentage,
        writeClient
      );

      const executionTime = Date.now() - startTime;
      logger.info('User assessment submitted successfully', {
        userAssessmentId: userAssessment.id,
        userId: input.userId,
        score: percentage.toFixed(2),
        executionTime
      });

      return {
        success: true,
        data: userAssessment as UserAssessment,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to submit user assessment', { error, input, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user assessment attempts for a specific assessment
   */
  static async getUserAssessmentAttempts(
    userId: string,
    assessmentId: string
  ): Promise<QueryResult<UserAssessment[]>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const attempts = await readClient.userAssessment.findMany({
        where: {
          userId,
          assessmentId
        },
        orderBy: { completedAt: 'desc' },
        include: {
          assessment: {
            select: {
              title: true,
              maxAttempts: true,
              passThreshold: true
            }
          }
        }
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: attempts as UserAssessment[],
        metadata: {
          executionTime,
          recordsAffected: attempts.length
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get user assessment attempts', { 
        error, userId, assessmentId, executionTime 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all user assessments for a user
   */
  static async getUserAssessments(
    userId: string,
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<QueryResult<PaginatedResult<UserAssessmentWithRelations>>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      const { page = 1, limit = 50 } = pagination;
      const offset = (page - 1) * limit;

      const [userAssessments, totalCount] = await Promise.all([
        readClient.userAssessment.findMany({
          where: { userId },
          include: {
            assessment: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    level: true
                  }
                }
              }
            }
          },
          orderBy: { completedAt: 'desc' },
          skip: offset,
          take: limit
        }),
        readClient.userAssessment.count({
          where: { userId }
        })
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          data: userAssessments as UserAssessmentWithRelations[],
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
      logger.error('Failed to get user assessments', { error, userId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get best score for user on specific assessment
   */
  static async getUserBestScore(
    userId: string,
    assessmentId: string
  ): Promise<QueryResult<UserAssessment | null>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const bestAttempt = await readClient.userAssessment.findFirst({
        where: {
          userId,
          assessmentId
        },
        orderBy: { score: 'desc' },
        include: {
          assessment: {
            select: {
              title: true,
              passThreshold: true
            }
          }
        }
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: bestAttempt as UserAssessment | null,
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get user best score', { 
        error, userId, assessmentId, executionTime 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // ANALYTICS and STATISTICS
  // ==========================================================================

  /**
   * Get assessment statistics
   */
  static async getAssessmentStats(assessmentId: string): Promise<QueryResult<{
    totalAttempts: number;
    uniqueUsers: number;
    averageScore: number;
    passRate: number;
    averageTimeSpent: number;
    scoreDistribution: Array<{ range: string; count: number }>;
    skillAnalysis: Record<string, { average: number; count: number }>;
  }>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const [assessment, userAssessments] = await Promise.all([
        readClient.assessment.findUnique({
          where: { id: assessmentId },
          select: { passThreshold: true, title: true }
        }),
        readClient.userAssessment.findMany({
          where: { assessmentId },
          select: {
            score: true,
            maxScore: true,
            timeTaken: true,
            skillBreakdown: true,
            userId: true
          }
        })
      ]);

      if (!assessment) {
        return {
          success: false,
          error: 'Assessment not found'
        };
      }

      const totalAttempts = userAssessments.length;
      const uniqueUsers = new Set(userAssessments.map(ua => ua.userId)).size;
      
      // Calculate average score
      const totalScore = userAssessments.reduce((sum, ua) => 
        sum + (ua.score / ua.maxScore) * 100, 0);
      const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
      
      // Calculate pass rate
      const passedAttempts = userAssessments.filter(ua => 
        (ua.score / ua.maxScore) * 100 >= assessment.passThreshold).length;
      const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;
      
      // Calculate average time spent
      const validTimes = userAssessments
        .map(ua => ua.timeTaken)
        .filter((time): time is number => time !== null);
      const averageTimeSpent = validTimes.length > 0
        ? validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length
        : 0;

      // Score distribution
      const scoreDistribution = this.calculateScoreDistribution(userAssessments);
      
      // Skill analysis
      const skillAnalysis = this.calculateSkillAnalysis(userAssessments);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          totalAttempts,
          uniqueUsers,
          averageScore,
          passRate,
          averageTimeSpent,
          scoreDistribution,
          skillAnalysis
        },
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get assessment stats', { error, assessmentId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user assessment analytics
   */
  static async getUserAssessmentAnalytics(userId: string): Promise<QueryResult<{
    totalAssessments: number;
    completedAssessments: number;
    averageScore: number;
    totalTimeSpent: number;
    strongestSkills: string[];
    weakestSkills: string[];
    improvementTrend: number;
    recentPerformance: Array<{ date: Date; score: number; assessmentTitle: string }>;
  }>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const userAssessments = await readClient.userAssessment.findMany({
        where: { userId },
        include: {
          assessment: {
            select: { title: true }
          }
        },
        orderBy: { completedAt: 'desc' }
      });

      const totalAssessments = await readClient.assessment.count({
        where: { isActive: true }
      });

      const completedAssessments = new Set(
        userAssessments.map(ua => ua.assessmentId)
      ).size;

      // Calculate average score
      const totalScore = userAssessments.reduce((sum, ua) => 
        sum + (ua.score / ua.maxScore) * 100, 0);
      const averageScore = userAssessments.length > 0 
        ? totalScore / userAssessments.length : 0;

      // Calculate total time spent
      const totalTimeSpent = userAssessments.reduce((sum, ua) => 
        sum + (ua.timeTaken || 0), 0);

      // Skill analysis
      const skillScores = this.analyzeUserSkills(userAssessments);
      const strongestSkills = Object.entries(skillScores)
        .sort(([,a], [,b]) => b.average - a.average)
        .slice(0, 3)
        .map(([skill]) => skill);
      
      const weakestSkills = Object.entries(skillScores)
        .sort(([,a], [,b]) => a.average - b.average)
        .slice(0, 3)
        .map(([skill]) => skill);

      // Improvement trend (last 10 vs previous 10)
      const improvementTrend = this.calculateImprovementTrend(userAssessments);

      // Recent performance
      const recentPerformance = userAssessments
        .slice(0, 10)
        .map(ua => ({
          date: ua.completedAt,
          score: (ua.score / ua.maxScore) * 100,
          assessmentTitle: ua.assessment.title
        }));

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          totalAssessments,
          completedAssessments,
          averageScore,
          totalTimeSpent,
          strongestSkills,
          weakestSkills,
          improvementTrend,
          recentPerformance
        },
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get user assessment analytics', { error, userId, executionTime });
      
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
   * Update user progress after assessment completion
   */
  private static async updateUserProgressAfterAssessment(
    userId: string,
    assessmentId: string,
    percentage: number,
    client: any
  ): Promise<void> {
    try {
      // Get course ID from assessment
      const assessment = await client.assessment.findUnique({
        where: { id: assessmentId },
        select: { courseId: true, passThreshold: true }
      });

      if (!assessment) return;

      // Update user progress test scores
      const existingProgress = await client.userProgress.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: assessment.courseId
          }
        }
      });

      const testScore = {
        assessmentId,
        score: percentage,
        completedAt: new Date(),
        passed: percentage >= assessment.passThreshold
      };

      if (existingProgress) {
        const currentScores = (existingProgress.testScores as any[]) || [];
        const updatedScores = [...currentScores, testScore];

        await client.userProgress.update({
          where: {
            userId_courseId: {
              userId,
              courseId: assessment.courseId
            }
          },
          data: {
            testScores: updatedScores,
            lastAccessed: new Date()
          }
        });
      } else {
        await client.userProgress.create({
          data: {
            userId,
            courseId: assessment.courseId,
            testScores: [testScore],
            completionRate: 0,
            currentSection: 1,
            studyTimeMinutes: 0
          }
        });
      }
    } catch (error) {
      logger.error('Failed to update user progress after assessment', { 
        error, userId, assessmentId 
      });
    }
  }

  /**
   * Calculate score distribution
   */
  private static calculateScoreDistribution(userAssessments: any[]): Array<{ range: string; count: number }> {
    const ranges = [
      { range: '0-20%', min: 0, max: 20 },
      { range: '21-40%', min: 21, max: 40 },
      { range: '41-60%', min: 41, max: 60 },
      { range: '61-80%', min: 61, max: 80 },
      { range: '81-100%', min: 81, max: 100 }
    ];

    return ranges.map(({ range, min, max }) => ({
      range,
      count: userAssessments.filter(ua => {
        const percentage = (ua.score / ua.maxScore) * 100;
        return percentage >= min && percentage <= max;
      }).length
    }));
  }

  /**
   * Calculate skill analysis
   */
  private static calculateSkillAnalysis(userAssessments: any[]): Record<string, { average: number; count: number }> {
    const skillData: Record<string, number[]> = {};

    userAssessments.forEach(ua => {
      if (ua.skillBreakdown) {
        const breakdown = ua.skillBreakdown as any;
        Object.entries(breakdown).forEach(([skill, data]: [string, any]) => {
          if (data.percentage !== undefined) {
            if (!skillData[skill]) skillData[skill] = [];
            skillData[skill].push(data.percentage);
          }
        });
      }
    });

    const skillAnalysis: Record<string, { average: number; count: number }> = {};
    
    Object.entries(skillData).forEach(([skill, scores]) => {
      skillAnalysis[skill] = {
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        count: scores.length
      };
    });

    return skillAnalysis;
  }

  /**
   * Analyze user skills from assessment history
   */
  private static analyzeUserSkills(userAssessments: any[]): Record<string, { average: number; count: number }> {
    const skillData: Record<string, number[]> = {};

    userAssessments.forEach(ua => {
      if (ua.skillBreakdown) {
        const breakdown = ua.skillBreakdown as any;
        Object.entries(breakdown).forEach(([skill, data]: [string, any]) => {
          if (data.percentage !== undefined) {
            if (!skillData[skill]) skillData[skill] = [];
            skillData[skill].push(data.percentage);
          }
        });
      }
    });

    const skillAnalysis: Record<string, { average: number; count: number }> = {};
    
    Object.entries(skillData).forEach(([skill, scores]) => {
      skillAnalysis[skill] = {
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        count: scores.length
      };
    });

    return skillAnalysis;
  }

  /**
   * Calculate improvement trend
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
}

// Export convenience functions
export const {
  createAssessment,
  getAssessmentById,
  getAssessments,
  getAssessmentsByCourse,
  updateAssessment,
  softDeleteAssessment,
  submitUserAssessment,
  getUserAssessmentAttempts,
  getUserAssessments,
  getUserBestScore,
  getAssessmentStats,
  getUserAssessmentAnalytics
} = AssessmentQueries;