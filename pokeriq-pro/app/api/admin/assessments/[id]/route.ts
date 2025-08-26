/**
 * Admin API - Single Assessment Operations
 * CRUD operations for individual assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '@/lib/admin/permissions';

const prisma = new PrismaClient();

/**
 * GET /api/admin/assessments/[id]
 * Get single assessment with detailed information
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

    const assessmentId = params.id;

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            level: true,
            isActive: true
          }
        },
        userAssessments: {
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

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Calculate detailed analytics
    const userAttempts = assessment.userAssessments;
    const uniqueUsers = new Set(userAttempts.map(ua => ua.userId));
    
    const analytics = {
      totalAttempts: userAttempts.length,
      uniqueUsers: uniqueUsers.size,
      averageScore: userAttempts.length > 0
        ? userAttempts.reduce((sum, ua) => sum + (ua.score / ua.maxScore * 100), 0) / userAttempts.length
        : 0,
      passRate: userAttempts.length > 0
        ? (userAttempts.filter(ua => (ua.score / ua.maxScore * 100) >= assessment.passThreshold).length / userAttempts.length) * 100
        : 0,
      averageTimeTaken: userAttempts.filter(ua => ua.timeTaken).length > 0
        ? userAttempts
            .filter(ua => ua.timeTaken)
            .reduce((sum, ua) => sum + ua.timeTaken!, 0) / userAttempts.filter(ua => ua.timeTaken).length
        : 0,
      questionAnalytics: calculateQuestionAnalytics(assessment.questions, userAttempts),
      scoreDistribution: calculateScoreDistribution(userAttempts, assessment.passThreshold),
      recentAttempts: userAttempts
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 10)
        .map(ua => ({
          id: ua.id,
          user: ua.user,
          score: ua.score,
          maxScore: ua.maxScore,
          percentage: (ua.score / ua.maxScore * 100),
          passed: (ua.score / ua.maxScore * 100) >= assessment.passThreshold,
          timeTaken: ua.timeTaken,
          completedAt: ua.completedAt
        }))
    };

    return NextResponse.json({
      success: true,
      data: {
        ...assessment,
        analytics
      }
    });

  } catch (error) {
    console.error('Admin assessment GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/assessments/[id]
 * Update single assessment
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

    const assessmentId = params.id;
    const body = await request.json();
    
    const {
      title,
      description,
      questions,
      scoringConfig,
      difficulty,
      passThreshold,
      timeLimitMinutes,
      maxAttempts,
      isActive
    } = body;

    // Check if assessment exists
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        userAssessments: { select: { id: true } }
      }
    });

    if (!existingAssessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // If there are existing user attempts, be cautious about question changes
    if (questions && existingAssessment.userAssessments.length > 0) {
      // You might want to create a new version instead of updating
      console.warn(`Updating assessment ${assessmentId} that has existing user attempts`);
    }

    // Validate questions if provided
    if (questions && Array.isArray(questions)) {
      for (const question of questions) {
        if (!question.type || !question.question || !question.options || !question.correctAnswer) {
          return NextResponse.json(
            { success: false, error: 'Invalid question structure' },
            { status: 400 }
          );
        }
      }
    }

    // Update assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        title,
        description,
        questions,
        scoringConfig,
        difficulty,
        passThreshold,
        timeLimitMinutes,
        maxAttempts,
        isActive,
        updatedAt: new Date()
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
      data: updatedAssessment,
      message: 'Assessment updated successfully'
    });

  } catch (error) {
    console.error('Admin assessment PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/assessments/[id]
 * Delete single assessment
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

    const assessmentId = params.id;

    // Check if assessment exists and has user attempts
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        userAssessments: { select: { id: true } }
      }
    });

    if (!existingAssessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check if assessment has user attempts
    if (existingAssessment.userAssessments.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete assessment with existing user attempts. Please deactivate instead.' 
        },
        { status: 409 }
      );
    }

    // Delete the assessment
    await prisma.assessment.delete({
      where: { id: assessmentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Assessment deleted successfully'
    });

  } catch (error) {
    console.error('Admin assessment DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to calculate question analytics
 */
function calculateQuestionAnalytics(questions: any[], userAttempts: any[]) {
  if (!Array.isArray(questions) || userAttempts.length === 0) {
    return [];
  }

  return questions.map((question, index) => {
    const questionAttempts = userAttempts.filter(ua => 
      ua.answers && ua.answers[index] !== undefined
    );
    
    const correctAttempts = questionAttempts.filter(ua => {
      const userAnswer = ua.answers[index];
      return userAnswer === question.correctAnswer;
    });

    return {
      questionIndex: index,
      question: question.question,
      type: question.type,
      totalAttempts: questionAttempts.length,
      correctAttempts: correctAttempts.length,
      successRate: questionAttempts.length > 0 
        ? (correctAttempts.length / questionAttempts.length) * 100 
        : 0,
      difficulty: getDifficultyLabel(
        questionAttempts.length > 0 
          ? (correctAttempts.length / questionAttempts.length) 
          : 0
      )
    };
  });
}

/**
 * Helper function to calculate score distribution
 */
function calculateScoreDistribution(userAttempts: any[], passThreshold: number) {
  if (userAttempts.length === 0) {
    return { ranges: [], passRate: 0 };
  }

  const ranges = [
    { min: 0, max: 30, count: 0, label: '0-30%' },
    { min: 30, max: 50, count: 0, label: '30-50%' },
    { min: 50, max: 70, count: 0, label: '50-70%' },
    { min: 70, max: 85, count: 0, label: '70-85%' },
    { min: 85, max: 100, count: 0, label: '85-100%' }
  ];

  userAttempts.forEach(ua => {
    const percentage = (ua.score / ua.maxScore) * 100;
    const range = ranges.find(r => percentage >= r.min && percentage < r.max);
    if (range) range.count++;
  });

  const passedCount = userAttempts.filter(
    ua => (ua.score / ua.maxScore * 100) >= passThreshold
  ).length;

  return {
    ranges,
    passRate: (passedCount / userAttempts.length) * 100
  };
}

/**
 * Helper function to get difficulty label based on success rate
 */
function getDifficultyLabel(successRate: number): string {
  if (successRate >= 0.8) return 'Easy';
  if (successRate >= 0.6) return 'Medium';
  if (successRate >= 0.4) return 'Hard';
  return 'Very Hard';
}