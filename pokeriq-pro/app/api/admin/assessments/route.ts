/**
 * Admin API - Assessment Management
 * CRUD operations for assessments in the content management system
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '@/lib/admin/permissions';

const prisma = new PrismaClient();

/**
 * GET /api/admin/assessments
 * List all assessments with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
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
    const courseId = searchParams.get('courseId');
    const difficulty = searchParams.get('difficulty');
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
    
    if (courseId) {
      where.courseId = courseId;
    }
    
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Get assessments with related data
    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              level: true
            }
          },
          userAssessments: {
            select: {
              id: true,
              score: true,
              maxScore: true,
              userId: true,
              completedAt: true
            }
          }
        }
      }),
      prisma.assessment.count({ where })
    ]);

    // Calculate additional metrics
    const assessmentsWithMetrics = assessments.map(assessment => {
      const attempts = assessment.userAssessments.length;
      const passed = assessment.userAssessments.filter(
        ua => (ua.score / ua.maxScore * 100) >= assessment.passThreshold
      ).length;
      const averageScore = attempts > 0
        ? assessment.userAssessments.reduce((sum, ua) => sum + (ua.score / ua.maxScore * 100), 0) / attempts
        : 0;

      return {
        ...assessment,
        questionCount: Array.isArray(assessment.questions) ? assessment.questions.length : 0,
        attemptCount: attempts,
        passRate: attempts > 0 ? (passed / attempts) * 100 : 0,
        averageScore,
        uniqueUsers: new Set(assessment.userAssessments.map(ua => ua.userId)).size
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        assessments: assessmentsWithMetrics,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });

  } catch (error) {
    console.error('Admin assessments GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/assessments
 * Create a new assessment
 */
export async function POST(request: NextRequest) {
  try {
    const userRole = 'SUPER_ADMIN';
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      courseId,
      title,
      description,
      questions,
      scoringConfig,
      difficulty,
      passThreshold = 70,
      timeLimitMinutes,
      maxAttempts = 3,
      isActive = true
    } = body;

    // Validate required fields
    if (!courseId || !title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: 'Course ID, title, and questions are required' },
        { status: 400 }
      );
    }

    // Validate questions structure
    for (const question of questions) {
      if (!question.type || !question.question || !question.options || !question.correctAnswer) {
        return NextResponse.json(
          { success: false, error: 'Invalid question structure' },
          { status: 400 }
        );
      }
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        courseId,
        title,
        description,
        questions,
        scoringConfig: scoringConfig || {
          pointsPerQuestion: 1,
          timeBonus: false,
          negativeScoring: false
        },
        difficulty,
        passThreshold,
        timeLimitMinutes,
        maxAttempts,
        isActive
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            level: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: assessment,
      message: 'Assessment created successfully'
    });

  } catch (error) {
    console.error('Admin assessments POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/assessments
 * Bulk update assessments
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
    const { action, assessmentIds } = body;

    if (!action || !assessmentIds || !Array.isArray(assessmentIds)) {
      return NextResponse.json(
        { success: false, error: 'Action and assessment IDs are required' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        message = 'Assessments activated';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        message = 'Assessments deactivated';
        break;
      case 'reset_attempts':
        // This would require a more complex operation to reset user attempts
        return NextResponse.json(
          { success: false, error: 'Reset attempts not implemented in bulk operation' },
          { status: 400 }
        );
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const result = await prisma.assessment.updateMany({
      where: { id: { in: assessmentIds } },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: { updatedCount: result.count },
      message
    });

  } catch (error) {
    console.error('Admin assessments PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update assessments' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/assessments
 * Delete multiple assessments
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
    const { assessmentIds } = body;

    if (!assessmentIds || !Array.isArray(assessmentIds)) {
      return NextResponse.json(
        { success: false, error: 'Assessment IDs are required' },
        { status: 400 }
      );
    }

    // Check for existing user attempts
    const userAssessments = await prisma.userAssessment.findMany({
      where: { assessmentId: { in: assessmentIds } },
      select: { assessmentId: true }
    });

    if (userAssessments.length > 0) {
      const assessmentsWithAttempts = new Set(userAssessments.map(ua => ua.assessmentId));
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete assessments with existing user attempts. Please deactivate instead.',
          data: { assessmentsWithAttempts: Array.from(assessmentsWithAttempts) }
        },
        { status: 409 }
      );
    }

    // Delete assessments
    const result = await prisma.assessment.deleteMany({
      where: { id: { in: assessmentIds } }
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.count },
      message: 'Assessments deleted successfully'
    });

  } catch (error) {
    console.error('Admin assessments DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete assessments' },
      { status: 500 }
    );
  }
}