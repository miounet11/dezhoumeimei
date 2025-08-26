/**
 * Assessment Submission API
 * Handles submission and scoring of assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getAssessmentById,
  submitUserAssessment,
  getUserAssessmentAttempts
} from '@/lib/db/queries/assessments';
import { validateCreateUserAssessmentInput } from '@/lib/validation/assessments';
import { AssessmentScoringEngine } from '@/lib/business/assessment-scoring';
import { AssessmentEngine } from '@/lib/assessment/engine';
import { createLogger } from '@/lib/logger';
import { AssessmentQuestion, AssessmentAnswer } from '@/lib/types/dezhoumama';

const logger = createLogger('assessment-submission-api');

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const assessmentId = params.id;
    const userId = session.user.id;

    // Validate request body structure
    if (!body.answers || !Array.isArray(body.answers)) {
      return NextResponse.json({
        error: 'Invalid submission format',
        details: 'Answers array is required'
      }, { status: 400 });
    }

    // Get assessment details
    const assessmentResult = await getAssessmentById(assessmentId);
    if (!assessmentResult.success || !assessmentResult.data) {
      return NextResponse.json({
        error: 'Assessment not found'
      }, { status: 404 });
    }

    const assessment = assessmentResult.data;

    // Check if assessment is active
    if (!assessment.isActive) {
      return NextResponse.json({
        error: 'Assessment is not active'
      }, { status: 403 });
    }

    // Parse questions from assessment
    const questions = JSON.parse(assessment.questions as string) as AssessmentQuestion[];

    // Check if user has exceeded max attempts (only for non-practice mode)
    if (!body.isPracticeMode) {
      const attemptsResult = await getUserAssessmentAttempts(userId, assessmentId);
      if (attemptsResult.success && attemptsResult.data) {
        const attemptCount = attemptsResult.data.length;
        if (attemptCount >= assessment.maxAttempts) {
          return NextResponse.json({
            error: `Maximum attempts exceeded (${assessment.maxAttempts})`
          }, { status: 403 });
        }
      }
    }

    // Score the assessment using the scoring engine
    const scoringResult = AssessmentScoringEngine.calculateScore(
      assessment,
      questions,
      body.answers as AssessmentAnswer[],
      body.timeTaken
    );

    // Prepare submission data
    const submissionData = {
      userId,
      assessmentId,
      score: scoringResult.totalScore,
      maxScore: scoringResult.maxScore,
      timeTaken: body.timeTaken || null,
      answers: body.answers,
      skillBreakdown: scoringResult.skillBreakdown
    };

    // Validate submission data
    const validation = validateCreateUserAssessmentInput(
      submissionData,
      assessment,
      questions
    );

    if (!validation.isValid) {
      logger.error('Assessment submission validation failed', {
        userId,
        assessmentId,
        errors: validation.errors
      });
      return NextResponse.json({
        error: 'Invalid submission data',
        details: validation.errors
      }, { status: 400 });
    }

    // Submit assessment (only if not practice mode)
    let userAssessment = null;
    if (!body.isPracticeMode) {
      const submissionResult = await submitUserAssessment(validation.data!);
      
      if (!submissionResult.success) {
        logger.error('Failed to submit assessment', {
          error: submissionResult.error,
          userId,
          assessmentId
        });
        return NextResponse.json({ 
          error: submissionResult.error 
        }, { status: 500 });
      }

      userAssessment = submissionResult.data;
    }

    // Generate adaptive feedback and recommendations
    const adaptiveFeedback = await AssessmentEngine.generateAdaptiveFeedback(
      scoringResult,
      questions,
      body.answers as AssessmentAnswer[],
      userId
    );

    // Calculate next recommended actions
    const recommendations = await AssessmentEngine.getNextRecommendations(
      userId,
      assessment,
      scoringResult
    );

    const response = {
      success: true,
      isPracticeMode: body.isPracticeMode || false,
      userAssessment: userAssessment,
      scoring: {
        totalScore: scoringResult.totalScore,
        maxScore: scoringResult.maxScore,
        percentage: scoringResult.percentage,
        passed: scoringResult.percentage >= assessment.passThreshold,
        breakdown: scoringResult.breakdown,
        bonuses: scoringResult.bonuses,
        penalties: scoringResult.penalties,
        skillBreakdown: scoringResult.skillBreakdown
      },
      feedback: {
        immediate: scoringResult.recommendations,
        adaptive: adaptiveFeedback,
        recommendations
      },
      timing: {
        timeTaken: body.timeTaken,
        timeLimit: assessment.timeLimitMinutes ? assessment.timeLimitMinutes * 60 : null,
        averageTimePerQuestion: body.timeTaken && questions.length > 0 
          ? Math.round(body.timeTaken / questions.length) 
          : null
      }
    };

    logger.info('Assessment submitted successfully', {
      userId,
      assessmentId,
      score: scoringResult.percentage,
      passed: scoringResult.percentage >= assessment.passThreshold,
      isPracticeMode: body.isPracticeMode || false,
      timeTaken: body.timeTaken
    });

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    logger.error('Unexpected error in assessment submission', { 
      error,
      userId: session?.user?.id,
      assessmentId: params.id
    });
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to process assessment submission'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const assessmentId = params.id;

    // Get user's attempts for this assessment
    const attemptsResult = await getUserAssessmentAttempts(userId, assessmentId);
    
    if (!attemptsResult.success) {
      logger.error('Failed to get user assessment attempts', {
        error: attemptsResult.error,
        userId,
        assessmentId
      });
      return NextResponse.json({ error: attemptsResult.error }, { status: 500 });
    }

    const attempts = attemptsResult.data || [];

    // Get assessment details for attempt limit check
    const assessmentResult = await getAssessmentById(assessmentId);
    if (!assessmentResult.success || !assessmentResult.data) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const assessment = assessmentResult.data;

    const response = {
      attempts: attempts.length,
      maxAttempts: assessment.maxAttempts,
      canAttempt: attempts.length < assessment.maxAttempts,
      bestScore: attempts.length > 0 
        ? Math.max(...attempts.map(a => (a.score / a.maxScore) * 100))
        : null,
      lastAttempt: attempts.length > 0 ? attempts[0] : null,
      attemptHistory: attempts.map(attempt => ({
        id: attempt.id,
        score: (attempt.score / attempt.maxScore) * 100,
        passed: (attempt.score / attempt.maxScore) * 100 >= assessment.passThreshold,
        timeTaken: attempt.timeTaken,
        completedAt: attempt.completedAt
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Unexpected error in GET assessment submission info', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}