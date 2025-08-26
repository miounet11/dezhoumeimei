/**
 * Assessment API Routes
 * Handles CRUD operations for assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getAssessments, 
  createAssessment,
  getAssessmentsByCourse
} from '@/lib/db/queries/assessments';
import { 
  validateCreateAssessmentInput,
  validateAssessmentFilters 
} from '@/lib/validation/assessments';
import { createLogger } from '@/lib/logger';
import { AssessmentFilters, AssessmentSortOptions, PaginationOptions } from '@/lib/types/dezhoumama';

const logger = createLogger('assessments-api');

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: AssessmentFilters = {
      courseId: searchParams.get('courseId') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
    };

    // Parse sorting
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const sort: AssessmentSortOptions = {
      field: sortField as any,
      direction: sortDirection as 'asc' | 'desc'
    };

    // Parse pagination
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const pagination: PaginationOptions = { page, limit };

    // Validate filters
    const filterValidation = validateAssessmentFilters(filters);
    if (!filterValidation.isValid) {
      return NextResponse.json({
        error: 'Invalid filters',
        details: filterValidation.errors
      }, { status: 400 });
    }

    // Special case: get assessments by course
    if (filters.courseId && !filters.search && !filters.difficulty) {
      const result = await getAssessmentsByCourse(filters.courseId);
      
      if (!result.success) {
        logger.error('Failed to get assessments by course', { 
          error: result.error, 
          courseId: filters.courseId 
        });
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        assessments: result.data,
        total: result.data?.length || 0
      });
    }

    // Get assessments with filtering and pagination
    const result = await getAssessments(filterValidation.data, sort, pagination);
    
    if (!result.success) {
      logger.error('Failed to get assessments', { error: result.error });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    logger.info('Assessments retrieved successfully', {
      userId: session.user.id,
      filters,
      count: result.data?.data.length
    });

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error('Unexpected error in GET /api/assessments', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateCreateAssessmentInput(body);
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Invalid input data',
        details: validation.errors
      }, { status: 400 });
    }

    // Create assessment
    const result = await createAssessment(validation.data!);
    
    if (!result.success) {
      logger.error('Failed to create assessment', { 
        error: result.error,
        input: validation.data
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    logger.info('Assessment created successfully', {
      assessmentId: result.data?.id,
      createdBy: session.user.id,
      title: validation.data?.title
    });

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    logger.error('Unexpected error in POST /api/assessments', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}