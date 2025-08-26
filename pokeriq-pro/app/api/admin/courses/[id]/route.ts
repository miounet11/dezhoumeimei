/**
 * Admin API - Single Course Operations
 * CRUD operations for individual courses
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '@/lib/admin/permissions';

const prisma = new PrismaClient();

/**
 * GET /api/admin/courses/[id]
 * Get single course with detailed information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const courseId = params.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        assessments: {
          include: {
            userAssessments: {
              select: {
                score: true,
                maxScore: true,
                timeTaken: true,
                userId: true
              }
            }
          }
        },
        userProgress: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Calculate detailed analytics
    const analytics = {
      totalEnrollments: course.userProgress.length,
      activeEnrollments: course.userProgress.filter(p => !p.completedAt).length,
      completedEnrollments: course.userProgress.filter(p => p.completedAt).length,
      averageProgress: course.userProgress.length > 0
        ? course.userProgress.reduce((sum, p) => sum + p.completionRate, 0) / course.userProgress.length
        : 0,
      averageStudyTime: course.userProgress.length > 0
        ? course.userProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0) / course.userProgress.length
        : 0,
      assessmentStats: course.assessments.map(assessment => ({
        id: assessment.id,
        title: assessment.title,
        attempts: assessment.userAssessments.length,
        averageScore: assessment.userAssessments.length > 0
          ? assessment.userAssessments.reduce((sum, ua) => sum + (ua.score / ua.maxScore * 100), 0) / assessment.userAssessments.length
          : 0,
        passRate: assessment.userAssessments.length > 0
          ? (assessment.userAssessments.filter(ua => (ua.score / ua.maxScore * 100) >= assessment.passThreshold).length / assessment.userAssessments.length) * 100
          : 0
      }))
    };

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        analytics
      }
    });

  } catch (error) {
    console.error('Admin course GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/courses/[id]
 * Update single course
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const courseId = params.id;
    const body = await request.json();
    
    const {
      title,
      description,
      level,
      contentPath,
      videoUrl,
      thumbnailUrl,
      durationMinutes,
      prerequisites,
      tags,
      isActive
    } = body;

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        level,
        contentPath,
        videoUrl,
        thumbnailUrl,
        durationMinutes,
        prerequisites,
        tags,
        isActive,
        updatedAt: new Date()
      },
      include: {
        assessments: true,
        userProgress: {
          select: {
            id: true,
            completionRate: true,
            userId: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully'
    });

  } catch (error) {
    console.error('Admin course PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/courses/[id]
 * Delete single course
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const courseId = params.id;

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        userProgress: { select: { id: true } },
        assessments: { select: { id: true } }
      }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course has active enrollments
    if (existingCourse.userProgress.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete course with active enrollments. Please deactivate instead.' 
        },
        { status: 409 }
      );
    }

    // Delete the course (cascading will handle related records)
    await prisma.course.delete({
      where: { id: courseId }
    });

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Admin course DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/courses/[id]
 * Perform specific actions on a course
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const courseId = params.id;
    const body = await request.json();
    const { action } = body;

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'publish':
        updateData = { isActive: true };
        message = 'Course published successfully';
        break;
      
      case 'unpublish':
        updateData = { isActive: false };
        message = 'Course unpublished successfully';
        break;
      
      case 'duplicate':
        const duplicatedCourse = await prisma.course.create({
          data: {
            title: `${course.title} (Copy)`,
            description: course.description,
            level: course.level,
            contentPath: course.contentPath,
            videoUrl: course.videoUrl,
            thumbnailUrl: course.thumbnailUrl,
            durationMinutes: course.durationMinutes,
            prerequisites: course.prerequisites,
            tags: course.tags,
            isActive: false // New course starts as draft
          }
        });
        
        return NextResponse.json({
          success: true,
          data: duplicatedCourse,
          message: 'Course duplicated successfully'
        });
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (Object.keys(updateData).length > 0) {
      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: updateData
      });

      return NextResponse.json({
        success: true,
        data: updatedCourse,
        message
      });
    }

  } catch (error) {
    console.error('Admin course PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}