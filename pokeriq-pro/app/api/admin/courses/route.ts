/**
 * Admin API - Course Management
 * CRUD operations for courses in the content management system
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '@/lib/admin/permissions';

const prisma = new PrismaClient();

/**
 * GET /api/admin/courses
 * List all courses with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // In production, check authentication and admin permissions
    // For development, using demo admin user
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level');
    const isActive = searchParams.get('active');

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (level) {
      where.level = level;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Get courses with related data
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          assessments: {
            select: {
              id: true,
              title: true,
              isActive: true
            }
          },
          userProgress: {
            select: {
              id: true,
              completionRate: true,
              userId: true
            }
          }
        }
      }),
      prisma.course.count({ where })
    ]);

    // Calculate additional metrics
    const coursesWithMetrics = courses.map(course => ({
      ...course,
      assessmentCount: course.assessments.length,
      activeAssessments: course.assessments.filter(a => a.isActive).length,
      enrollmentCount: course.userProgress.length,
      averageProgress: course.userProgress.length > 0
        ? course.userProgress.reduce((sum, p) => sum + p.completionRate, 0) / course.userProgress.length
        : 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        courses: coursesWithMetrics,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });

  } catch (error) {
    console.error('Admin courses GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/courses
 * Create a new course
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

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
      isActive = true
    } = body;

    // Validate required fields
    if (!title || !level) {
      return NextResponse.json(
        { success: false, error: 'Title and level are required' },
        { status: 400 }
      );
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        title,
        description,
        level,
        contentPath,
        videoUrl,
        thumbnailUrl,
        durationMinutes,
        prerequisites: prerequisites || [],
        tags: tags || [],
        isActive
      },
      include: {
        assessments: true,
        userProgress: true
      }
    });

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });

  } catch (error) {
    console.error('Admin courses POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/courses
 * Bulk update courses
 */
export async function PUT(request: NextRequest) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, courseIds } = body;

    if (!action || !courseIds || !Array.isArray(courseIds)) {
      return NextResponse.json(
        { success: false, error: 'Action and course IDs are required' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        message = 'Courses activated';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        message = 'Courses deactivated';
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const result = await prisma.course.updateMany({
      where: { id: { in: courseIds } },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: { updatedCount: result.count },
      message
    });

  } catch (error) {
    console.error('Admin courses PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update courses' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/courses
 * Delete multiple courses
 */
export async function DELETE(request: NextRequest) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { courseIds } = body;

    if (!courseIds || !Array.isArray(courseIds)) {
      return NextResponse.json(
        { success: false, error: 'Course IDs are required' },
        { status: 400 }
      );
    }

    // Delete courses and cascade to related records
    const result = await prisma.course.deleteMany({
      where: { id: { in: courseIds } }
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.count },
      message: 'Courses deleted successfully'
    });

  } catch (error) {
    console.error('Admin courses DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete courses' },
      { status: 500 }
    );
  }
}