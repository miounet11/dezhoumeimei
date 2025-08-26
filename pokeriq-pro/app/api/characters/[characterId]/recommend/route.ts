/**
 * Character Recommendations API Route
 * GET /api/characters/[characterId]/recommend - Get characters similar to this one
 */

import { NextRequest, NextResponse } from 'next/server';
import { CharacterQueries } from '@/lib/db/queries/characters';
import { CharacterUtils } from '@/lib/character/character-utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('character-recommend-api');

interface RouteParams {
  params: {
    characterId: string;
  };
}

/**
 * GET /api/characters/[characterId]/recommend
 * Get characters similar to the specified character
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  const { characterId } = params;
  
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const userId = searchParams.get('userId') || undefined;
    
    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 20' },
        { status: 400 }
      );
    }

    logger.info('Getting character recommendations', {
      characterId,
      limit,
      userId
    });

    // First, get the target character
    const characterResult = await CharacterQueries.getCharacterById(characterId, false);
    
    if (!characterResult.success || !characterResult.data) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    const targetCharacter = characterResult.data;

    // Get similar characters based on specialization and skill level
    const filters = {
      specialization: targetCharacter.specialization,
      skillLevel: targetCharacter.skillLevel,
      isActive: true
    };

    const allCharactersResult = await CharacterQueries.getCharacters(
      filters,
      { field: 'name', direction: 'asc' },
      { page: 1, limit: 50 } // Get more to filter out the target character
    );

    if (!allCharactersResult.success) {
      logger.error('Failed to fetch similar characters', { 
        error: allCharactersResult.error, 
        characterId 
      });
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      );
    }

    // Filter out the target character itself
    let similarCharacters = allCharactersResult.data!.data.filter(
      char => char.id !== characterId
    );

    // If we don't have enough similar characters, expand the search
    if (similarCharacters.length < limit) {
      const expandedFilters = {
        conversationStyle: targetCharacter.conversationStyle,
        isActive: true
      };

      const expandedResult = await CharacterQueries.getCharacters(
        expandedFilters,
        { field: 'name', direction: 'asc' },
        { page: 1, limit: 30 }
      );

      if (expandedResult.success) {
        const additionalChars = expandedResult.data!.data.filter(
          char => char.id !== characterId && 
                 !similarCharacters.some(sc => sc.id === char.id)
        );
        similarCharacters = [...similarCharacters, ...additionalChars];
      }
    }

    // Calculate similarity scores and rank characters
    const characterWithScores = similarCharacters.map(character => {
      const similarityScore = calculateSimilarityScore(targetCharacter, character);
      return {
        ...character,
        similarityScore,
        preview: CharacterUtils.generateCharacterPreview(character),
        summary: CharacterUtils.createCharacterSummary(character)
      };
    });

    // Sort by similarity score and take top results
    const recommendations = characterWithScores
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    // Add compatibility scores if userId provided
    if (userId) {
      try {
        // Mock user context - in real implementation, fetch from user service
        const userContext = {
          level: 15,
          learningStyle: 'analytical' as const,
          currentSkillAreas: [targetCharacter.specialization.toLowerCase()]
        };

        recommendations.forEach(char => {
          const compatibilityScore = CharacterUtils.calculateCompatibilityScore(
            userContext,
            char
          );
          (char as any).compatibilityScore = compatibilityScore;
        });
      } catch (error) {
        logger.warn('Failed to calculate compatibility scores', { error, userId });
      }
    }

    const executionTime = Date.now() - startTime;
    
    logger.info('Character recommendations generated', {
      characterId,
      recommendationCount: recommendations.length,
      executionTime
    });

    const response = {
      targetCharacter: {
        id: targetCharacter.id,
        name: targetCharacter.name,
        displayName: targetCharacter.displayName,
        specialization: targetCharacter.specialization,
        preview: CharacterUtils.generateCharacterPreview(targetCharacter)
      },
      recommendations,
      criteria: {
        primaryMatch: 'specialization',
        secondaryMatch: 'skillLevel',
        fallbackMatch: 'conversationStyle'
      },
      metadata: {
        executionTime,
        totalSimilarFound: characterWithScores.length,
        userId: userId ? 'provided' : 'not_provided'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error generating recommendations', { 
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
 * Calculate similarity score between two characters
 */
function calculateSimilarityScore(
  targetCharacter: any,
  compareCharacter: any
): number {
  let score = 0;
  
  // Exact specialization match (40 points)
  if (targetCharacter.specialization === compareCharacter.specialization) {
    score += 40;
  } else if (
    targetCharacter.specialization.toLowerCase().includes(compareCharacter.specialization.toLowerCase()) ||
    compareCharacter.specialization.toLowerCase().includes(targetCharacter.specialization.toLowerCase())
  ) {
    score += 20; // Partial match
  }

  // Skill level match (30 points)
  if (targetCharacter.skillLevel === compareCharacter.skillLevel) {
    score += 30;
  } else {
    // Adjacent skill levels get partial points
    const levels = ['BEGINNER', 'INTERMEDIATE', 'EXPERT'];
    const targetIndex = levels.indexOf(targetCharacter.skillLevel);
    const compareIndex = levels.indexOf(compareCharacter.skillLevel);
    const levelDiff = Math.abs(targetIndex - compareIndex);
    
    if (levelDiff === 1) {
      score += 15; // Adjacent level
    } else if (levelDiff === 2) {
      score += 5; // Two levels apart
    }
  }

  // Conversation style match (20 points)
  if (targetCharacter.conversationStyle === compareCharacter.conversationStyle) {
    score += 20;
  } else {
    // Some styles are more compatible than others
    const styleCompatibility: Record<string, string[]> = {
      'FRIENDLY': ['CASUAL', 'HUMOROUS'],
      'CASUAL': ['FRIENDLY', 'HUMOROUS'],
      'ANALYTICAL': ['FORMAL', 'DIRECT'],
      'FORMAL': ['ANALYTICAL', 'DIRECT'],
      'DIRECT': ['ANALYTICAL', 'FORMAL'],
      'HUMOROUS': ['FRIENDLY', 'CASUAL'],
      'COMPETITIVE': ['DIRECT', 'ANALYTICAL']
    };
    
    const compatibleStyles = styleCompatibility[targetCharacter.conversationStyle] || [];
    if (compatibleStyles.includes(compareCharacter.conversationStyle)) {
      score += 10; // Compatible style
    }
  }

  // Personality traits similarity (10 points)
  try {
    const targetPersonality = targetCharacter.personalityConfig;
    const comparePersonality = compareCharacter.personalityConfig;
    
    if (targetPersonality?.traits && comparePersonality?.traits) {
      const traitKeys = ['friendliness', 'formality', 'patience', 'enthusiasm', 'analytical', 'supportive'];
      let traitSimilarity = 0;
      
      traitKeys.forEach(trait => {
        const diff = Math.abs(targetPersonality.traits[trait] - comparePersonality.traits[trait]);
        traitSimilarity += (1 - diff); // Higher similarity for smaller differences
      });
      
      score += (traitSimilarity / traitKeys.length) * 10;
    }
  } catch (error) {
    // Skip personality comparison if data is malformed
  }

  return Math.min(Math.round(score), 100);
}