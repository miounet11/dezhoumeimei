/**
 * Characters API Route - Main endpoint for character operations
 * GET /api/characters - List available characters with filtering and recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { CharacterQueries } from '@/lib/db/queries/characters';
import { CharacterUtils } from '@/lib/character/character-utils';
import { createLogger } from '@/lib/logger';
import { 
  CharacterFilters, 
  CharacterSortOptions, 
  PaginationOptions, 
  CharacterSkillLevel,
  CharacterStyle 
} from '@/lib/types/dezhoumama';

const logger = createLogger('characters-api');

/**
 * GET /api/characters
 * List characters with filtering, sorting, and recommendations
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const specialization = searchParams.get('specialization') || undefined;
    const skillLevel = searchParams.get('skillLevel') as CharacterSkillLevel | undefined;
    const conversationStyle = searchParams.get('style') as CharacterStyle | undefined;
    const search = searchParams.get('search') || undefined;
    const isActive = searchParams.get('active') ? searchParams.get('active') === 'true' : undefined;
    const sortField = searchParams.get('sortBy') || 'name';
    const sortDirection = searchParams.get('sortDir') || 'asc';
    const userId = searchParams.get('userId') || undefined;
    const getRecommendations = searchParams.get('recommendations') === 'true';

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Build filters
    const filters: CharacterFilters = {
      specialization,
      skillLevel,
      conversationStyle,
      search,
      isActive: isActive ?? true // Default to active characters only
    };

    // Build sort options
    const sort: CharacterSortOptions = {
      field: sortField as any,
      direction: sortDirection as 'asc' | 'desc'
    };

    // Build pagination
    const pagination: PaginationOptions = { page, limit };

    logger.info('Fetching characters', {
      filters,
      sort,
      pagination,
      userId,
      getRecommendations
    });

    // Get characters
    const result = await CharacterQueries.getCharacters(filters, sort, pagination);
    
    if (!result.success) {
      logger.error('Failed to fetch characters', { error: result.error });
      return NextResponse.json(
        { error: result.error || 'Failed to fetch characters' },
        { status: 500 }
      );
    }

    let responseData = result.data!;

    // Add recommendations if requested and userId provided
    if (getRecommendations && userId) {
      try {
        const recommendationsResult = await CharacterQueries.getRecommendedCharacters(userId, 5);
        if (recommendationsResult.success) {
          // Add compatibility scores to main results if they overlap
          const recommendedIds = new Set(recommendationsResult.data!.map(c => c.id));
          responseData.data = responseData.data.map(character => {
            if (recommendedIds.has(character.id)) {
              const recommended = recommendationsResult.data!.find(c => c.id === character.id);
              return {
                ...character,
                isRecommended: true,
                compatibilityScore: 85 // Placeholder score
              };
            }
            return character;
          });

          // Add separate recommendations array
          (responseData as any).recommendations = recommendationsResult.data!.map(character => ({
            ...character,
            preview: CharacterUtils.generateCharacterPreview(character),
            compatibilityScore: 85 // Placeholder - would come from CharacterUtils
          }));
        }
      } catch (error) {
        logger.warn('Failed to get recommendations', { error, userId });
        // Don't fail the main request, just skip recommendations
      }
    }

    // Add character previews for better UX
    responseData.data = responseData.data.map(character => ({
      ...character,
      preview: CharacterUtils.generateCharacterPreview(character),
      summary: CharacterUtils.createCharacterSummary(character)
    }));

    const executionTime = Date.now() - startTime;
    
    logger.info('Characters fetched successfully', {
      count: responseData.data.length,
      total: responseData.total,
      page: responseData.page,
      executionTime
    });

    // Add metadata
    const response = {
      ...responseData,
      metadata: {
        executionTime,
        hasRecommendations: getRecommendations && userId,
        filters: filters,
        sort: sort
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error in characters API', { error, executionTime });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/characters
 * Create new character (admin only)
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    
    logger.info('Creating new character', { 
      name: body.name,
      specialization: body.specialization 
    });

    // Validate required fields
    const validation = CharacterUtils.validateCharacterConfig(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid character configuration',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Create character
    const result = await CharacterQueries.createCharacter(body);
    
    if (!result.success) {
      logger.error('Failed to create character', { error: result.error, body });
      return NextResponse.json(
        { error: result.error || 'Failed to create character' },
        { status: 500 }
      );
    }

    const executionTime = Date.now() - startTime;
    
    logger.info('Character created successfully', {
      characterId: result.data!.id,
      name: result.data!.name,
      executionTime
    });

    const response = {
      character: result.data,
      preview: CharacterUtils.generateCharacterPreview(result.data!),
      metadata: {
        executionTime,
        created: true
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error creating character', { error, executionTime });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}