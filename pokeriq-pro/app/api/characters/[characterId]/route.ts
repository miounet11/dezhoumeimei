/**
 * Character Details API Route
 * GET /api/characters/[characterId] - Get character details
 * PUT /api/characters/[characterId] - Update character (admin only)
 * DELETE /api/characters/[characterId] - Delete character (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { CharacterQueries } from '@/lib/db/queries/characters';
import { CharacterUtils } from '@/lib/character/character-utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('character-details-api');

interface RouteParams {
  params: {
    characterId: string;
  };
}

/**
 * GET /api/characters/[characterId]
 * Get character details with optional relations
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  const { characterId } = params;
  
  try {
    const { searchParams } = new URL(req.url);
    const includeRelations = searchParams.get('include') === 'relations';
    const includeStats = searchParams.get('stats') === 'true';
    const userId = searchParams.get('userId') || undefined;

    logger.info('Fetching character details', {
      characterId,
      includeRelations,
      includeStats,
      userId
    });

    // Get character
    const result = await CharacterQueries.getCharacterById(characterId, includeRelations);
    
    if (!result.success) {
      logger.error('Failed to fetch character', { error: result.error, characterId });
      return NextResponse.json(
        { error: result.error || 'Character not found' },
        { status: result.error === 'Character not found' ? 404 : 500 }
      );
    }

    const character = result.data!;
    let responseData: any = {
      character,
      preview: CharacterUtils.generateCharacterPreview(character),
      summary: CharacterUtils.createCharacterSummary(character)
    };

    // Add compatibility score if userId provided
    if (userId) {
      try {
        // Mock user context - in real implementation, fetch from user service
        const userContext = {
          level: 15,
          learningStyle: 'analytical' as const,
          currentSkillAreas: ['preflop', 'position']
        };
        
        const compatibilityScore = CharacterUtils.calculateCompatibilityScore(
          userContext,
          character
        );
        
        responseData.compatibilityScore = compatibilityScore;
        responseData.isRecommended = compatibilityScore > 70;
      } catch (error) {
        logger.warn('Failed to calculate compatibility score', { error, userId, characterId });
      }
    }

    // Add character stats if requested
    if (includeStats) {
      try {
        const statsResult = await CharacterQueries.getCharacterStats(characterId);
        if (statsResult.success) {
          responseData.stats = statsResult.data;
        }
      } catch (error) {
        logger.warn('Failed to fetch character stats', { error, characterId });
        // Don't fail the request, just skip stats
      }
    }

    const executionTime = Date.now() - startTime;
    
    logger.info('Character details fetched successfully', {
      characterId,
      executionTime
    });

    responseData.metadata = {
      executionTime,
      includeRelations,
      includeStats
    };

    return NextResponse.json(responseData);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error fetching character details', { 
      error, characterId, executionTime 
    });
    
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
 * PUT /api/characters/[characterId]
 * Update character details (admin only)
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  const { characterId } = params;
  
  try {
    const body = await req.json();
    
    logger.info('Updating character', { characterId, updates: Object.keys(body) });

    // Add character ID to update data
    const updateData = { ...body, id: characterId };

    // Validate update data if personality config is being updated
    if (body.personalityConfig) {
      const validation = CharacterUtils.validateCharacterConfig(updateData);
      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: 'Invalid character configuration',
            details: validation.errors
          },
          { status: 400 }
        );
      }
    }

    // Update character
    const result = await CharacterQueries.updateCharacter(updateData);
    
    if (!result.success) {
      logger.error('Failed to update character', { error: result.error, characterId });
      return NextResponse.json(
        { error: result.error || 'Failed to update character' },
        { status: result.error === 'Character not found' ? 404 : 500 }
      );
    }

    const executionTime = Date.now() - startTime;
    
    logger.info('Character updated successfully', {
      characterId,
      executionTime
    });

    const response = {
      character: result.data,
      preview: CharacterUtils.generateCharacterPreview(result.data!),
      metadata: {
        executionTime,
        updated: true
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error updating character', { 
      error, characterId, executionTime 
    });
    
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
 * DELETE /api/characters/[characterId]
 * Delete character (admin only) - soft delete by default
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  const { characterId } = params;
  
  try {
    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get('hard') === 'true';

    logger.info('Deleting character', { characterId, hardDelete });

    let result;
    if (hardDelete) {
      result = await CharacterQueries.hardDeleteCharacter(characterId);
    } else {
      result = await CharacterQueries.softDeleteCharacter(characterId);
    }
    
    if (!result.success) {
      logger.error('Failed to delete character', { error: result.error, characterId });
      return NextResponse.json(
        { error: result.error || 'Failed to delete character' },
        { status: result.error === 'Character not found' ? 404 : 500 }
      );
    }

    const executionTime = Date.now() - startTime;
    
    logger.info('Character deleted successfully', {
      characterId,
      hardDelete,
      executionTime
    });

    return NextResponse.json({
      success: true,
      deleted: hardDelete ? 'permanently' : 'soft',
      metadata: {
        executionTime
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error deleting character', { 
      error, characterId, executionTime 
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}