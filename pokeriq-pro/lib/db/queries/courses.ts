/**
 * Course Query Functions for Dezhoumama Learning Platform
 * Comprehensive CRUD operations with optimized performance
 */

import { Prisma } from '@prisma/client';
import { prisma, dbPool } from '@/lib/db/prisma';
import { createLogger } from '@/lib/logger';
import {
  Course,
  CourseWithRelations,
  CreateCourseInput,
  UpdateCourseInput,
  CourseFilters,
  CourseSortOptions,
  PaginationOptions,
  PaginatedResult,
  QueryResult,
  CourseLevel
} from '@/lib/types/dezhoumama';

const logger = createLogger('course-queries');

/**
 * Course Query Service
 * Handles all database operations for Course model
 */
export class CourseQueries {
  
  // ==========================================================================
  // CREATE Operations
  // ==========================================================================

  /**
   * Create a new course
   */
  static async createCourse(input: CreateCourseInput): Promise<QueryResult<Course>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Validate prerequisites exist
      if (input.prerequisites && input.prerequisites.length > 0) {
        const existingCourses = await writeClient.course.findMany({
          where: {
            id: { in: input.prerequisites },
            isActive: true
          },
          select: { id: true }
        });
        
        if (existingCourses.length !== input.prerequisites.length) {
          const missingCourses = input.prerequisites.filter(
            prereq => !existingCourses.some(course => course.id === prereq)
          );
          
          return {
            success: false,
            error: `Prerequisites not found: ${missingCourses.join(', ')}`
          };
        }
      }

      const course = await writeClient.course.create({
        data: {
          title: input.title,
          description: input.description,
          level: input.level,
          contentPath: input.contentPath,
          videoUrl: input.videoUrl,
          thumbnailUrl: input.thumbnailUrl,
          durationMinutes: input.durationMinutes,
          prerequisites: input.prerequisites || [],
          tags: input.tags || [],
          isActive: input.isActive ?? true
        }
      });

      const executionTime = Date.now() - startTime;
      logger.info('Course created successfully', {
        courseId: course.id,
        title: course.title,
        executionTime
      });

      return {
        success: true,
        data: course as Course,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to create course', { error, input, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Bulk create courses
   */
  static async createCoursesBatch(inputs: CreateCourseInput[]): Promise<QueryResult<Course[]>> {
    const startTime = Date.now();
    
    try {
      const batchClient = dbPool.getBatchClient();
      
      const courses = await batchClient.$transaction(
        inputs.map(input => 
          batchClient.course.create({
            data: {
              title: input.title,
              description: input.description,
              level: input.level,
              contentPath: input.contentPath,
              videoUrl: input.videoUrl,
              thumbnailUrl: input.thumbnailUrl,
              durationMinutes: input.durationMinutes,
              prerequisites: input.prerequisites || [],
              tags: input.tags || [],
              isActive: input.isActive ?? true
            }
          })
        )
      );

      const executionTime = Date.now() - startTime;
      logger.info('Courses created in batch', {
        count: courses.length,
        executionTime
      });

      return {
        success: true,
        data: courses as Course[],
        metadata: {
          executionTime,
          recordsAffected: courses.length
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to create courses batch', { error, count: inputs.length, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // READ Operations
  // ==========================================================================

  /**
   * Get course by ID
   */
  static async getCourseById(
    id: string,
    includeRelations: boolean = false
  ): Promise<QueryResult<Course | CourseWithRelations>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const course = await readClient.course.findUnique({
        where: { id },
        include: includeRelations ? {
          assessments: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
          },
          userProgress: {
            orderBy: { lastAccessed: 'desc' },
            take: 50 // Limit to recent progress entries
          }
        } : undefined
      });

      const executionTime = Date.now() - startTime;

      if (!course) {
        return {
          success: false,
          error: 'Course not found',
          metadata: { executionTime }
        };
      }

      return {
        success: true,
        data: course as Course | CourseWithRelations,
        metadata: {
          executionTime,
          cacheHit: false // Could implement Redis cache here
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get course by ID', { error, id, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get courses with filtering, sorting, and pagination
   */
  static async getCourses(
    filters: CourseFilters = {},
    sort: CourseSortOptions = { field: 'createdAt', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<QueryResult<PaginatedResult<Course>>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause
      const where: Prisma.CourseWhereInput = {
        ...(filters.level && { level: filters.level }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters.tags && filters.tags.length > 0 && {
          tags: { hasSome: filters.tags }
        }),
        ...(filters.hasPrerequisites !== undefined && {
          prerequisites: filters.hasPrerequisites 
            ? { not: { isEmpty: true } }
            : { isEmpty: true }
        }),
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { tags: { hasSome: [filters.search] } }
          ]
        })
      };

      // Build order by clause
      const orderBy: Prisma.CourseOrderByWithRelationInput = {
        [sort.field]: sort.direction
      };

      // Execute queries in parallel
      const [courses, totalCount] = await Promise.all([
        readClient.course.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit
        }),
        readClient.course.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const executionTime = Date.now() - startTime;

      logger.info('Courses retrieved successfully', {
        count: courses.length,
        totalCount,
        filters,
        executionTime
      });

      return {
        success: true,
        data: {
          data: courses as Course[],
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
      logger.error('Failed to get courses', { error, filters, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get courses by level with optimized query
   */
  static async getCoursesByLevel(level: CourseLevel): Promise<QueryResult<Course[]>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const courses = await readClient.course.findMany({
        where: {
          level,
          isActive: true
        },
        orderBy: [
          { createdAt: 'asc' }
        ]
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: courses as Course[],
        metadata: {
          executionTime,
          recordsAffected: courses.length
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get courses by level', { error, level, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get prerequisite chain for a course
   */
  static async getPrerequisiteChain(courseId: string): Promise<QueryResult<Course[]>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const course = await readClient.course.findUnique({
        where: { id: courseId },
        select: { prerequisites: true }
      });

      if (!course) {
        return {
          success: false,
          error: 'Course not found'
        };
      }

      if (!course.prerequisites || course.prerequisites.length === 0) {
        return {
          success: true,
          data: [],
          metadata: {
            executionTime: Date.now() - startTime
          }
        };
      }

      // Recursively get all prerequisites
      const prerequisiteCourses = await this.getCoursesRecursively(
        course.prerequisites as string[],
        readClient
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: prerequisiteCourses,
        metadata: {
          executionTime,
          recordsAffected: prerequisiteCourses.length
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get prerequisite chain', { error, courseId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // UPDATE Operations
  // ==========================================================================

  /**
   * Update a course
   */
  static async updateCourse(input: UpdateCourseInput): Promise<QueryResult<Course>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Validate prerequisites if provided
      if (input.prerequisites && input.prerequisites.length > 0) {
        const existingCourses = await writeClient.course.findMany({
          where: {
            id: { in: input.prerequisites },
            isActive: true
          },
          select: { id: true }
        });
        
        if (existingCourses.length !== input.prerequisites.length) {
          return {
            success: false,
            error: 'One or more prerequisites not found'
          };
        }
      }

      const { id, ...updateData } = input;
      
      const course = await writeClient.course.update({
        where: { id },
        data: updateData
      });

      const executionTime = Date.now() - startTime;
      logger.info('Course updated successfully', {
        courseId: course.id,
        changes: Object.keys(updateData),
        executionTime
      });

      return {
        success: true,
        data: course as Course,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to update course', { error, input, executionTime });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            error: 'Course not found'
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
   * Toggle course active status
   */
  static async toggleCourseActive(courseId: string): Promise<QueryResult<Course>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const currentCourse = await writeClient.course.findUnique({
        where: { id: courseId },
        select: { isActive: true }
      });

      if (!currentCourse) {
        return {
          success: false,
          error: 'Course not found'
        };
      }

      const course = await writeClient.course.update({
        where: { id: courseId },
        data: { isActive: !currentCourse.isActive }
      });

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: course as Course,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to toggle course active status', { error, courseId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // DELETE Operations
  // ==========================================================================

  /**
   * Soft delete a course (set isActive to false)
   */
  static async softDeleteCourse(courseId: string): Promise<QueryResult<Course>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const course = await writeClient.course.update({
        where: { id: courseId },
        data: { isActive: false }
      });

      const executionTime = Date.now() - startTime;
      logger.info('Course soft deleted', { courseId, executionTime });

      return {
        success: true,
        data: course as Course,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to soft delete course', { error, courseId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Hard delete a course (permanent deletion)
   * Note: This will cascade delete related assessments and user progress
   */
  static async hardDeleteCourse(courseId: string): Promise<QueryResult<boolean>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Check if course has any user progress
      const progressCount = await writeClient.userProgress.count({
        where: { courseId }
      });

      if (progressCount > 0) {
        return {
          success: false,
          error: 'Cannot delete course with existing user progress. Consider soft delete instead.'
        };
      }

      await writeClient.course.delete({
        where: { id: courseId }
      });

      const executionTime = Date.now() - startTime;
      logger.warn('Course permanently deleted', { courseId, executionTime });

      return {
        success: true,
        data: true,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to hard delete course', { error, courseId, executionTime });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            error: 'Course not found'
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
  // UTILITY Methods
  // ==========================================================================

  /**
   * Recursively get courses and their prerequisites
   */
  private static async getCoursesRecursively(
    courseIds: string[],
    client: any,
    visited: Set<string> = new Set()
  ): Promise<Course[]> {
    const newCourseIds = courseIds.filter(id => !visited.has(id));
    
    if (newCourseIds.length === 0) {
      return [];
    }

    // Mark as visited to prevent cycles
    newCourseIds.forEach(id => visited.add(id));

    const courses = await client.course.findMany({
      where: {
        id: { in: newCourseIds },
        isActive: true
      }
    });

    // Get prerequisites for these courses
    const allPrerequisites = courses
      .flatMap((course: any) => course.prerequisites as string[])
      .filter(Boolean);

    if (allPrerequisites.length > 0) {
      const prerequisiteCourses = await this.getCoursesRecursively(
        allPrerequisites,
        client,
        visited
      );
      return [...prerequisiteCourses, ...courses];
    }

    return courses;
  }

  /**
   * Get course statistics
   */
  static async getCourseStats(): Promise<QueryResult<{
    totalCourses: number;
    activeCourses: number;
    coursesByLevel: Record<CourseLevel, number>;
    averageDuration: number;
    mostPopularTags: Array<{ tag: string; count: number }>;
  }>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const [
        totalCourses,
        activeCourses,
        allCourses
      ] = await Promise.all([
        readClient.course.count(),
        readClient.course.count({ where: { isActive: true } }),
        readClient.course.findMany({
          select: {
            level: true,
            durationMinutes: true,
            tags: true
          }
        })
      ]);

      // Calculate stats
      const coursesByLevel = allCourses.reduce((acc, course) => {
        acc[course.level] = (acc[course.level] || 0) + 1;
        return acc;
      }, {} as Record<CourseLevel, number>);

      const validDurations = allCourses
        .map(c => c.durationMinutes)
        .filter((duration): duration is number => duration !== null);
      
      const averageDuration = validDurations.length > 0
        ? validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length
        : 0;

      // Calculate most popular tags
      const tagCounts = new Map<string, number>();
      allCourses.forEach(course => {
        course.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      const mostPopularTags = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          totalCourses,
          activeCourses,
          coursesByLevel,
          averageDuration,
          mostPopularTags
        },
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get course stats', { error, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Search courses with full-text search
   */
  static async searchCourses(
    query: string,
    filters: Omit<CourseFilters, 'search'> = {},
    limit: number = 20
  ): Promise<QueryResult<Course[]>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const courses = await readClient.course.findMany({
        where: {
          ...filters,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } }
          ]
        },
        take: limit,
        orderBy: [
          // Prioritize exact title matches
          { title: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: courses as Course[],
        metadata: {
          executionTime,
          recordsAffected: courses.length
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to search courses', { error, query, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export convenience functions
export const {
  createCourse,
  createCoursesBatch,
  getCourseById,
  getCourses,
  getCoursesByLevel,
  getPrerequisiteChain,
  updateCourse,
  toggleCourseActive,
  softDeleteCourse,
  hardDeleteCourse,
  getCourseStats,
  searchCourses
} = CourseQueries;