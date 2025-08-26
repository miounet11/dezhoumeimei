import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '../../../../lib/auth/jwt';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const progressUpdateSchema = z.object({
  courseId: z.string().uuid(),
  chapterId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  currentTime: z.number().min(0),
  duration: z.number().min(0),
  completionRate: z.number().min(0).max(100),
  watchedSegments: z.array(z.object({
    start: z.number(),
    end: z.number()
  })).optional(),
  metadata: z.record(z.any()).optional()
});

const progressQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  includeDetails: z.boolean().optional()
});

// POST - Update progress
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = progressUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.format(),
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const {
      courseId,
      chapterId,
      userId,
      currentTime,
      duration,
      completionRate,
      watchedSegments,
      metadata
    } = validationResult.data;

    // Verify user owns this progress or is admin
    if (authResult.user.id !== userId && authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Verify course exists and user has access
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, isActive: true }
    });

    if (!course || !course.isActive) {
      return NextResponse.json(
        { error: 'Course not found or not active', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Calculate study time increment (based on time since last update)
    const lastProgress = await prisma.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      select: { lastAccessed: true, studyTimeMinutes: true }
    });

    const now = new Date();
    let studyTimeIncrement = 0;
    
    if (lastProgress?.lastAccessed) {
      const timeDiff = now.getTime() - lastProgress.lastAccessed.getTime();
      const minutesDiff = Math.min(timeDiff / 60000, 5); // Cap at 5 minutes per update
      studyTimeIncrement = minutesDiff;
    }

    // Prepare progress data
    const progressData = {
      completionRate: Math.min(completionRate, 100),
      currentSection: chapterId ? 
        await getChapterOrderNumber(courseId, chapterId) : 
        (lastProgress?.currentSection || 1),
      studyTimeMinutes: Math.floor((lastProgress?.studyTimeMinutes || 0) + studyTimeIncrement),
      lastAccessed: now,
      completedAt: completionRate >= 100 ? now : null
    };

    // Update or create user progress
    const updatedProgress = await prisma.userProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      update: progressData,
      create: {
        userId,
        courseId,
        ...progressData,
        studyTimeMinutes: Math.floor(studyTimeIncrement)
      },
      include: {
        course: {
          select: {
            title: true,
            durationMinutes: true
          }
        }
      }
    });

    // Store detailed progress tracking if provided
    if (chapterId && (watchedSegments || metadata || currentTime > 0)) {
      await updateDetailedProgress({
        userId,
        courseId,
        chapterId,
        currentTime,
        duration,
        watchedSegments,
        metadata
      });
    }

    // Update user statistics
    await updateUserLearningStats(userId, completionRate >= 100);

    // Trigger achievement checks
    if (completionRate >= 100) {
      // Background job to check for course completion achievements
      checkCourseAchievements(userId, courseId).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      progress: {
        courseId,
        chapterId,
        completionRate: updatedProgress.completionRate,
        currentSection: updatedProgress.currentSection,
        studyTimeMinutes: updatedProgress.studyTimeMinutes,
        lastAccessed: updatedProgress.lastAccessed,
        completedAt: updatedProgress.completedAt,
        course: updatedProgress.course
      },
      message: completionRate >= 100 ? 'Course completed!' : 'Progress updated'
    });

  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Retrieve progress
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      courseId: searchParams.get('courseId') || undefined,
      chapterId: searchParams.get('chapterId') || undefined,
      userId: searchParams.get('userId') || authResult.user.id,
      includeDetails: searchParams.get('includeDetails') === 'true'
    };

    // Validate query parameters
    const validationResult = progressQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: validationResult.error.format(),
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const { courseId, chapterId, userId, includeDetails } = validationResult.data;

    // Verify user access
    if (authResult.user.id !== userId && authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    if (courseId) {
      // Get specific course progress
      const progress = await prisma.userProgress.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        include: {
          course: {
            select: {
              title: true,
              durationMinutes: true,
              level: true
            }
          }
        }
      });

      if (!progress) {
        return NextResponse.json(
          { error: 'Progress not found', code: 'PROGRESS_NOT_FOUND' },
          { status: 404 }
        );
      }

      let detailedProgress = null;
      if (includeDetails && chapterId) {
        detailedProgress = await getDetailedProgress(userId, courseId, chapterId);
      }

      return NextResponse.json({
        success: true,
        progress: {
          ...progress,
          detailedProgress
        }
      });

    } else {
      // Get all user progress
      const allProgress = await prisma.userProgress.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              title: true,
              durationMinutes: true,
              level: true,
              thumbnailUrl: true
            }
          }
        },
        orderBy: {
          lastAccessed: 'desc'
        }
      });

      // Calculate summary statistics
      const stats = {
        totalCourses: allProgress.length,
        completedCourses: allProgress.filter(p => p.completedAt).length,
        totalStudyTime: allProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0),
        averageCompletion: allProgress.length > 0 ? 
          allProgress.reduce((sum, p) => sum + p.completionRate, 0) / allProgress.length : 0
      };

      return NextResponse.json({
        success: true,
        progress: allProgress,
        stats
      });
    }

  } catch (error) {
    console.error('Error retrieving progress:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper Functions

async function getChapterOrderNumber(courseId: string, chapterId: string): Promise<number> {
  try {
    // This would depend on how chapters are structured
    // For now, return 1 as a placeholder
    return 1;
  } catch (error) {
    console.error('Error getting chapter order:', error);
    return 1;
  }
}

async function updateDetailedProgress({
  userId,
  courseId,
  chapterId,
  currentTime,
  duration,
  watchedSegments,
  metadata
}: {
  userId: string;
  courseId: string;
  chapterId: string;
  currentTime: number;
  duration: number;
  watchedSegments?: Array<{start: number; end: number}>;
  metadata?: Record<string, any>;
}) {
  try {
    // Store detailed progress in a separate table or JSON field
    // This is a simplified implementation
    const detailKey = `${courseId}_${chapterId}`;
    
    await prisma.userProgress.update({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      data: {
        testScores: {
          // Update the JSON field with detailed progress
          ...(await prisma.userProgress.findUnique({
            where: {
              userId_courseId: { userId, courseId }
            },
            select: { testScores: true }
          }))?.testScores as any || {},
          [detailKey]: {
            currentTime,
            duration,
            watchedSegments: watchedSegments || [],
            metadata: metadata || {},
            updatedAt: new Date().toISOString()
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating detailed progress:', error);
  }
}

async function getDetailedProgress(userId: string, courseId: string, chapterId: string) {
  try {
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      select: { testScores: true }
    });

    const detailKey = `${courseId}_${chapterId}`;
    return (progress?.testScores as any)?.[detailKey] || null;
  } catch (error) {
    console.error('Error getting detailed progress:', error);
    return null;
  }
}

async function updateUserLearningStats(userId: string, completedCourse: boolean) {
  try {
    if (completedCourse) {
      // Update user stats with course completion
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: {
            increment: 100 // Award XP for course completion
          }
        }
      });
    }
  } catch (error) {
    console.error('Error updating user learning stats:', error);
  }
}

async function checkCourseAchievements(userId: string, courseId: string) {
  try {
    // Check for course completion achievements
    const completedCourses = await prisma.userProgress.count({
      where: {
        userId,
        completedAt: { not: null }
      }
    });

    // Check for milestone achievements (1, 5, 10, 25, 50 courses)
    const milestones = [1, 5, 10, 25, 50, 100];
    for (const milestone of milestones) {
      if (completedCourses === milestone) {
        // Create achievement if it exists
        const achievement = await prisma.achievement.findFirst({
          where: {
            code: `COURSES_COMPLETED_${milestone}`,
            isActive: true
          }
        });

        if (achievement) {
          await prisma.userAchievement.upsert({
            where: {
              userId_achievementId: {
                userId,
                achievementId: achievement.id
              }
            },
            update: {
              completed: true,
              unlockedAt: new Date()
            },
            create: {
              userId,
              achievementId: achievement.id,
              progress: 100,
              completed: true,
              unlockedAt: new Date()
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking course achievements:', error);
  }
}