/**
 * Assessment Analytics API
 * Provides analytics and insights for assessments and user performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getAssessmentStats,
  getUserAssessmentAnalytics
} from '@/lib/db/queries/assessments';
import { createLogger } from '@/lib/logger';

const logger = createLogger('assessment-analytics-api');

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const assessmentId = searchParams.get('assessmentId');
    const userId = searchParams.get('userId') || session.user.id;

    // Only admins can view other users' analytics
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    switch (type) {
      case 'assessment': {
        if (!assessmentId) {
          return NextResponse.json({
            error: 'Assessment ID is required for assessment analytics'
          }, { status: 400 });
        }

        // Only admins can view assessment-wide statistics
        if (session.user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const result = await getAssessmentStats(assessmentId);
        
        if (!result.success) {
          if (result.error === 'Assessment not found') {
            return NextResponse.json({ error: result.error }, { status: 404 });
          }
          logger.error('Failed to get assessment stats', {
            error: result.error,
            assessmentId
          });
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        logger.info('Assessment statistics retrieved', {
          assessmentId,
          requestedBy: session.user.id
        });

        return NextResponse.json(result.data);
      }

      case 'user': {
        const result = await getUserAssessmentAnalytics(userId);
        
        if (!result.success) {
          logger.error('Failed to get user assessment analytics', {
            error: result.error,
            userId
          });
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        logger.info('User assessment analytics retrieved', {
          userId,
          requestedBy: session.user.id
        });

        return NextResponse.json(result.data);
      }

      default: {
        return NextResponse.json({
          error: 'Invalid analytics type. Use "assessment" or "user"'
        }, { status: 400 });
      }
    }

  } catch (error) {
    logger.error('Unexpected error in assessment analytics API', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}