/**
 * Character Query Functions for Dezhoumama Learning Platform
 * Comprehensive CRUD operations for learning characters and AI companions
 */

import { Prisma } from '@prisma/client';
import { prisma, dbPool } from '@/lib/db/prisma';
import { createLogger } from '@/lib/logger';
import {
  LearningCharacter,
  LearningCharacterWithRelations,
  CreateLearningCharacterInput,
  UpdateLearningCharacterInput,
  CharacterFilters,
  CharacterSortOptions,
  PaginationOptions,
  PaginatedResult,
  QueryResult,
  CharacterSkillLevel,
  CharacterStyle,
  PersonalityConfig
} from '@/lib/types/dezhoumama';

const logger = createLogger('character-queries');

/**
 * Character Query Service
 * Handles all database operations for LearningCharacter model
 */
export class CharacterQueries {
  
  // ==========================================================================
  // BASIC CRUD Operations
  // ==========================================================================

  /**
   * Create a new learning character
   */
  static async createCharacter(input: CreateLearningCharacterInput): Promise<QueryResult<LearningCharacter>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Validate personality config structure
      if (!this.validatePersonalityConfig(input.personalityConfig)) {
        return {
          success: false,
          error: 'Invalid personality configuration structure'
        };
      }

      const character = await writeClient.learningCharacter.create({
        data: {
          name: input.name,
          displayName: input.displayName,
          personalityConfig: input.personalityConfig as any,
          avatarUrl: input.avatarUrl,
          specialization: input.specialization,
          description: input.description,
          backstory: input.backstory,
          skillLevel: input.skillLevel,
          conversationStyle: input.conversationStyle,
          isActive: input.isActive ?? true
        }
      });

      const executionTime = Date.now() - startTime;
      logger.info('Learning character created successfully', {
        characterId: character.id,
        name: character.name,
        specialization: character.specialization,
        executionTime
      });

      return {
        success: true,
        data: character as LearningCharacter,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to create learning character', { error, input, executionTime });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return {
            success: false,
            error: 'Character name already exists'
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get character by ID
   */
  static async getCharacterById(
    id: string,
    includeRelations: boolean = false
  ): Promise<QueryResult<LearningCharacter | LearningCharacterWithRelations>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const character = await readClient.learningCharacter.findUnique({
        where: { id },
        include: includeRelations ? {
          chatSessions: {
            where: { isActive: true },
            select: {
              id: true,
              sessionName: true,
              startedAt: true,
              lastMessageAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true
                }
              }
            },
            orderBy: { lastMessageAt: 'desc' },
            take: 20 // Limit recent sessions
          }
        } : undefined
      });

      const executionTime = Date.now() - startTime;

      if (!character) {
        return {
          success: false,
          error: 'Character not found',
          metadata: { executionTime }
        };
      }

      return {
        success: true,
        data: character as LearningCharacter | LearningCharacterWithRelations,
        metadata: {
          executionTime,
          cacheHit: false
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get character by ID', { error, id, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get character by name
   */
  static async getCharacterByName(name: string): Promise<QueryResult<LearningCharacter | null>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const character = await readClient.learningCharacter.findFirst({
        where: {
          OR: [
            { name: { equals: name, mode: 'insensitive' } },
            { displayName: { equals: name, mode: 'insensitive' } }
          ],
          isActive: true
        }
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: character as LearningCharacter | null,
        metadata: {
          executionTime,
          cacheHit: false
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get character by name', { error, name, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get characters with filtering and pagination
   */
  static async getCharacters(
    filters: CharacterFilters = {},
    sort: CharacterSortOptions = { field: 'name', direction: 'asc' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<QueryResult<PaginatedResult<LearningCharacter>>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause
      const where: Prisma.LearningCharacterWhereInput = {
        ...(filters.specialization && { specialization: { contains: filters.specialization, mode: 'insensitive' } }),
        ...(filters.skillLevel && { skillLevel: filters.skillLevel }),
        ...(filters.conversationStyle && { conversationStyle: filters.conversationStyle }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { displayName: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { specialization: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      };

      // Build order by clause
      const orderBy: Prisma.LearningCharacterOrderByWithRelationInput = {
        [sort.field]: sort.direction
      };

      // Execute queries in parallel
      const [characters, totalCount] = await Promise.all([
        readClient.learningCharacter.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit
        }),
        readClient.learningCharacter.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          data: characters as LearningCharacter[],
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        metadata: {
          executionTime,
          cacheHit: false
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get characters', { error, filters, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get characters by specialization
   */
  static async getCharactersBySpecialization(specialization: string): Promise<QueryResult<LearningCharacter[]>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const characters = await readClient.learningCharacter.findMany({
        where: {
          specialization: { contains: specialization, mode: 'insensitive' },
          isActive: true
        },
        orderBy: [
          { skillLevel: 'desc' },
          { name: 'asc' }
        ]
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: characters as LearningCharacter[],
        metadata: {
          executionTime,
          recordsAffected: characters.length
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get characters by specialization', { 
        error, specialization, executionTime 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get characters by skill level
   */
  static async getCharactersBySkillLevel(skillLevel: CharacterSkillLevel): Promise<QueryResult<LearningCharacter[]>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const characters = await readClient.learningCharacter.findMany({
        where: {
          skillLevel,
          isActive: true
        },
        orderBy: [
          { specialization: 'asc' },
          { name: 'asc' }
        ]
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: characters as LearningCharacter[],
        metadata: {
          executionTime,
          recordsAffected: characters.length
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get characters by skill level', { 
        error, skillLevel, executionTime 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update a character
   */
  static async updateCharacter(input: UpdateLearningCharacterInput): Promise<QueryResult<LearningCharacter>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Validate personality config if provided
      if (input.personalityConfig && !this.validatePersonalityConfig(input.personalityConfig)) {
        return {
          success: false,
          error: 'Invalid personality configuration structure'
        };
      }

      const { id, ...updateData } = input;
      
      const character = await writeClient.learningCharacter.update({
        where: { id },
        data: updateData
      });

      const executionTime = Date.now() - startTime;
      logger.info('Character updated successfully', {
        characterId: character.id,
        changes: Object.keys(updateData),
        executionTime
      });

      return {
        success: true,
        data: character as LearningCharacter,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to update character', { error, input, executionTime });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            error: 'Character not found'
          };
        }
        if (error.code === 'P2002') {
          return {
            success: false,
            error: 'Character name already exists'
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Toggle character active status
   */
  static async toggleCharacterActive(characterId: string): Promise<QueryResult<LearningCharacter>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const currentCharacter = await writeClient.learningCharacter.findUnique({
        where: { id: characterId },
        select: { isActive: true }
      });

      if (!currentCharacter) {
        return {
          success: false,
          error: 'Character not found'
        };
      }

      const character = await writeClient.learningCharacter.update({
        where: { id: characterId },
        data: { isActive: !currentCharacter.isActive }
      });

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: character as LearningCharacter,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to toggle character active status', { error, characterId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Soft delete a character (set isActive to false)
   */
  static async softDeleteCharacter(characterId: string): Promise<QueryResult<LearningCharacter>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const character = await writeClient.learningCharacter.update({
        where: { id: characterId },
        data: { isActive: false }
      });

      const executionTime = Date.now() - startTime;
      logger.info('Character soft deleted', { characterId, executionTime });

      return {
        success: true,
        data: character as LearningCharacter,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to soft delete character', { error, characterId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Hard delete a character (permanent deletion)
   */
  static async hardDeleteCharacter(characterId: string): Promise<QueryResult<boolean>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Check if character has any active chat sessions
      const activeSessions = await writeClient.chatSession.count({
        where: { 
          characterId,
          isActive: true 
        }
      });

      if (activeSessions > 0) {
        return {
          success: false,
          error: 'Cannot delete character with active chat sessions. Consider soft delete instead.'
        };
      }

      await writeClient.learningCharacter.delete({
        where: { id: characterId }
      });

      const executionTime = Date.now() - startTime;
      logger.warn('Character permanently deleted', { characterId, executionTime });

      return {
        success: true,
        data: true,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to hard delete character', { error, characterId, executionTime });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            error: 'Character not found'
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // CHARACTER MATCHING and RECOMMENDATIONS
  // ==========================================================================

  /**
   * Get recommended characters for a user based on their learning progress
   */
  static async getRecommendedCharacters(
    userId: string,
    limit: number = 5
  ): Promise<QueryResult<LearningCharacter[]>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      // Get user's learning progress to understand their level and interests
      const [userProgress, userLevel] = await Promise.all([
        readClient.userProgress.findMany({
          where: { userId },
          include: {
            course: {
              select: { tags: true, level: true }
            }
          }
        }),
        readClient.user.findUnique({
          where: { id: userId },
          select: { level: true }
        })
      ]);

      if (!userLevel) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Extract user interests from course tags
      const userInterests = new Set<string>();
      let userSkillLevel: CharacterSkillLevel = 'BEGINNER';
      
      userProgress.forEach(progress => {
        progress.course.tags.forEach(tag => userInterests.add(tag));
        
        // Determine user skill level based on course levels and completion
        if (progress.course.level === 'ADVANCED' && progress.completionRate > 70) {
          userSkillLevel = 'EXPERT';
        } else if (progress.course.level === 'INTERMEDIATE' && progress.completionRate > 50) {
          userSkillLevel = 'INTERMEDIATE';
        }
      });

      // Find characters that match user's interests and skill level
      const matchingSpecializations = Array.from(userInterests);
      
      const characters = await readClient.learningCharacter.findMany({
        where: {
          isActive: true,
          OR: [
            { skillLevel: userSkillLevel },
            { 
              skillLevel: userSkillLevel === 'BEGINNER' ? 'INTERMEDIATE' : 
                         userSkillLevel === 'INTERMEDIATE' ? 'EXPERT' : 'EXPERT' 
            },
            {
              specialization: {
                in: matchingSpecializations,
                mode: 'insensitive'
              }
            }
          ]
        },
        take: limit * 2, // Get more to filter and rank
        orderBy: { createdAt: 'desc' }
      });

      // Rank characters by relevance
      const rankedCharacters = this.rankCharactersByRelevance(
        characters,
        Array.from(userInterests),
        userSkillLevel
      ).slice(0, limit);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: rankedCharacters as LearningCharacter[],
        metadata: {
          executionTime,
          recordsAffected: rankedCharacters.length
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get recommended characters', { error, userId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Find character suitable for specific learning topic
   */
  static async findCharacterForTopic(
    topic: string,
    userSkillLevel?: CharacterSkillLevel
  ): Promise<QueryResult<LearningCharacter[]>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const characters = await readClient.learningCharacter.findMany({
        where: {
          isActive: true,
          ...(userSkillLevel && { skillLevel: userSkillLevel }),
          OR: [
            { specialization: { contains: topic, mode: 'insensitive' } },
            { description: { contains: topic, mode: 'insensitive' } },
            { name: { contains: topic, mode: 'insensitive' } }
          ]
        },
        orderBy: [
          { skillLevel: 'desc' },
          { name: 'asc' }
        ],
        take: 10
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: characters as LearningCharacter[],
        metadata: {
          executionTime,
          recordsAffected: characters.length
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to find character for topic', { error, topic, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // ANALYTICS and STATISTICS
  // ==========================================================================

  /**
   * Get character usage statistics
   */
  static async getCharacterStats(characterId: string): Promise<QueryResult<{
    totalSessions: number;
    activeSessions: number;
    uniqueUsers: number;
    averageSessionDuration: number;
    totalMessages: number;
    popularityRank: number;
    userSatisfactionScore: number;
    mostCommonTopics: string[];
  }>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const [character, allSessions, allCharacters] = await Promise.all([
        readClient.learningCharacter.findUnique({
          where: { id: characterId }
        }),
        readClient.chatSession.findMany({
          where: { characterId },
          select: {
            id: true,
            userId: true,
            startedAt: true,
            endedAt: true,
            isActive: true,
            conversationHistory: true,
            contextData: true
          }
        }),
        readClient.learningCharacter.findMany({
          select: { id: true },
          where: { isActive: true }
        })
      ]);

      if (!character) {
        return {
          success: false,
          error: 'Character not found'
        };
      }

      const totalSessions = allSessions.length;
      const activeSessions = allSessions.filter(s => s.isActive).length;
      const uniqueUsers = new Set(allSessions.map(s => s.userId)).size;

      // Calculate average session duration
      const completedSessions = allSessions.filter(s => s.endedAt);
      const totalDuration = completedSessions.reduce((sum, session) => {
        const duration = new Date(session.endedAt!).getTime() - new Date(session.startedAt).getTime();
        return sum + (duration / 1000 / 60); // Convert to minutes
      }, 0);
      const averageSessionDuration = completedSessions.length > 0 
        ? totalDuration / completedSessions.length 
        : 0;

      // Count total messages
      const totalMessages = allSessions.reduce((sum, session) => {
        const history = session.conversationHistory as any[];
        return sum + (Array.isArray(history) ? history.length : 0);
      }, 0);

      // Calculate popularity rank among all characters
      const characterSessionCounts = await Promise.all(
        allCharacters.map(async (char) => ({
          id: char.id,
          sessionCount: await readClient.chatSession.count({
            where: { characterId: char.id }
          })
        }))
      );

      const sortedByPopularity = characterSessionCounts
        .sort((a, b) => b.sessionCount - a.sessionCount);
      
      const popularityRank = sortedByPopularity.findIndex(c => c.id === characterId) + 1;

      // Extract common topics from context data
      const topics = new Map<string, number>();
      allSessions.forEach(session => {
        const contextData = session.contextData as any;
        if (contextData?.currentTopic) {
          const topic = contextData.currentTopic;
          topics.set(topic, (topics.get(topic) || 0) + 1);
        }
      });

      const mostCommonTopics = Array.from(topics.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic);

      // Placeholder for user satisfaction score (would need user ratings)
      const userSatisfactionScore = 4.2; // This would come from user feedback

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          totalSessions,
          activeSessions,
          uniqueUsers,
          averageSessionDuration,
          totalMessages,
          popularityRank,
          userSatisfactionScore,
          mostCommonTopics
        },
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get character stats', { error, characterId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get overall character system statistics
   */
  static async getSystemStats(): Promise<QueryResult<{
    totalCharacters: number;
    activeCharacters: number;
    charactersBySkillLevel: Record<CharacterSkillLevel, number>;
    charactersByStyle: Record<CharacterStyle, number>;
    mostPopularSpecializations: Array<{ specialization: string; count: number }>;
    totalInteractions: number;
    averageCharactersPerUser: number;
  }>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const [allCharacters, totalSessions, uniqueUsersInSessions] = await Promise.all([
        readClient.learningCharacter.findMany({
          select: {
            skillLevel: true,
            conversationStyle: true,
            specialization: true,
            isActive: true
          }
        }),
        readClient.chatSession.count(),
        readClient.chatSession.findMany({
          select: { userId: true },
          distinct: ['userId']
        })
      ]);

      const totalCharacters = allCharacters.length;
      const activeCharacters = allCharacters.filter(c => c.isActive).length;

      // Group by skill level
      const charactersBySkillLevel = allCharacters.reduce((acc, char) => {
        acc[char.skillLevel] = (acc[char.skillLevel] || 0) + 1;
        return acc;
      }, {} as Record<CharacterSkillLevel, number>);

      // Group by conversation style
      const charactersByStyle = allCharacters.reduce((acc, char) => {
        acc[char.conversationStyle] = (acc[char.conversationStyle] || 0) + 1;
        return acc;
      }, {} as Record<CharacterStyle, number>);

      // Most popular specializations
      const specializationCounts = new Map<string, number>();
      allCharacters.forEach(char => {
        const spec = char.specialization.toLowerCase();
        specializationCounts.set(spec, (specializationCounts.get(spec) || 0) + 1);
      });

      const mostPopularSpecializations = Array.from(specializationCounts.entries())
        .map(([specialization, count]) => ({ specialization, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const averageCharactersPerUser = uniqueUsersInSessions.length > 0
        ? totalSessions / uniqueUsersInSessions.length
        : 0;

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          totalCharacters,
          activeCharacters,
          charactersBySkillLevel,
          charactersByStyle,
          mostPopularSpecializations,
          totalInteractions: totalSessions,
          averageCharactersPerUser
        },
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get system stats', { error, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // UTILITY Methods
  // ==========================================================================

  /**
   * Validate personality configuration structure
   */
  private static validatePersonalityConfig(config: PersonalityConfig): boolean {
    try {
      // Check required fields
      if (!config.traits || !config.teachingStyle || !config.expertise) {
        return false;
      }

      // Validate traits (should be numbers between 0 and 1)
      const requiredTraits = ['friendliness', 'formality', 'patience', 'enthusiasm', 'analytical', 'supportive'];
      for (const trait of requiredTraits) {
        const value = (config.traits as any)[trait];
        if (typeof value !== 'number' || value < 0 || value > 1) {
          return false;
        }
      }

      // Validate teaching style (should have boolean fields)
      const requiredTeachingFields = ['usesExamples', 'encouragesQuestions', 'providesDetails', 'usesHumor', 'givesPracticalTips'];
      for (const field of requiredTeachingFields) {
        const value = (config.teachingStyle as any)[field];
        if (typeof value !== 'boolean') {
          return false;
        }
      }

      // Validate expertise
      if (!Array.isArray(config.expertise.areas) || !config.expertise.level) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Rank characters by relevance to user interests and skill level
   */
  private static rankCharactersByRelevance(
    characters: any[],
    userInterests: string[],
    userSkillLevel: CharacterSkillLevel
  ): any[] {
    return characters
      .map(character => {
        let score = 0;

        // Score based on skill level match
        if (character.skillLevel === userSkillLevel) {
          score += 10;
        } else if (
          (userSkillLevel === 'BEGINNER' && character.skillLevel === 'INTERMEDIATE') ||
          (userSkillLevel === 'INTERMEDIATE' && character.skillLevel === 'EXPERT')
        ) {
          score += 7;
        } else {
          score += 3;
        }

        // Score based on specialization match
        const specializationLower = character.specialization.toLowerCase();
        for (const interest of userInterests) {
          if (specializationLower.includes(interest.toLowerCase())) {
            score += 5;
          }
        }

        // Prefer friendly and supportive characters for beginners
        if (userSkillLevel === 'BEGINNER' && 
            (character.conversationStyle === 'FRIENDLY' || character.conversationStyle === 'CASUAL')) {
          score += 3;
        }

        // Prefer analytical characters for advanced users
        if (userSkillLevel === 'EXPERT' && character.conversationStyle === 'ANALYTICAL') {
          score += 3;
        }

        return { ...character, relevanceScore: score };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(({ relevanceScore, ...character }) => character);
  }

  /**
   * Search characters with full-text search
   */
  static async searchCharacters(
    query: string,
    filters: Omit<CharacterFilters, 'search'> = {},
    limit: number = 20
  ): Promise<QueryResult<LearningCharacter[]>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const characters = await readClient.learningCharacter.findMany({
        where: {
          ...filters,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { specialization: { contains: query, mode: 'insensitive' } },
            { backstory: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: [
          { name: 'asc' }
        ]
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: characters as LearningCharacter[],
        metadata: {
          executionTime,
          recordsAffected: characters.length
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to search characters', { error, query, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export convenience functions
export const {
  createCharacter,
  getCharacterById,
  getCharacterByName,
  getCharacters,
  getCharactersBySpecialization,
  getCharactersBySkillLevel,
  updateCharacter,
  toggleCharacterActive,
  softDeleteCharacter,
  hardDeleteCharacter,
  getRecommendedCharacters,
  findCharacterForTopic,
  getCharacterStats,
  getSystemStats,
  searchCharacters
} = CharacterQueries;