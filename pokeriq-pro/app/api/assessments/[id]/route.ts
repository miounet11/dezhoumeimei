/**
 * Individual Assessment API Routes
 * Handles operations for specific assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getAssessmentById,
  updateAssessment,
  softDeleteAssessment 
} from '@/lib/db/queries/assessments';
import { createLogger } from '@/lib/logger';

const logger = createLogger('assessment-api');

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeRelations = searchParams.get('include') === 'relations';

    const result = await getAssessmentById(params.id, includeRelations);
    
    if (!result.success) {
      if (result.error === 'Assessment not found') {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      logger.error('Failed to get assessment', { 
        error: result.error, 
        assessmentId: params.id 
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Check if assessment is active (non-admins can only see active assessments)
    if (!result.data?.isActive && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    logger.info('Assessment retrieved successfully', {
      assessmentId: params.id,
      userId: session.user.id,
      includeRelations
    });

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error('Unexpected error in GET /api/assessments/[id]', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    // Add the ID to the update data
    const updateData = {
      ...body,
      id: params.id
    };

    const result = await updateAssessment(updateData);
    
    if (!result.success) {
      if (result.error === 'Assessment not found') {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      logger.error('Failed to update assessment', { 
        error: result.error,
        assessmentId: params.id,
        updateData
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    logger.info('Assessment updated successfully', {
      assessmentId: params.id,
      updatedBy: session.user.id,
      changes: Object.keys(body)
    });

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error('Unexpected error in PUT /api/assessments/[id]', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await softDeleteAssessment(params.id);
    
    if (!result.success) {
      if (result.error === 'Assessment not found') {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      logger.error('Failed to delete assessment', { 
        error: result.error,
        assessmentId: params.id
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    logger.info('Assessment soft deleted successfully', {
      assessmentId: params.id,
      deletedBy: session.user.id
    });

    return NextResponse.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    logger.error('Unexpected error in DELETE /api/assessments/[id]', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}