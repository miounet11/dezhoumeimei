/**
 * Chat Session Query Functions for Dezhoumama Learning Platform
 * Comprehensive CRUD operations for chat sessions and conversation management
 */

import { Prisma } from '@prisma/client';
import { prisma, dbPool } from '@/lib/db/prisma';
import { createLogger } from '@/lib/logger';
import {
  ChatSession,
  ChatSessionWithRelations,
  CreateChatSessionInput,
  UpdateChatSessionInput,
  ChatSessionFilters,
  ChatSessionSortOptions,
  PaginationOptions,
  PaginatedResult,
  QueryResult,
  ChatMessage,
  SessionContext
} from '@/lib/types/dezhoumama';

const logger = createLogger('chat-queries');

/**
 * Chat Session Query Service
 * Handles all database operations for ChatSession model
 */
export class ChatQueries {
  
  // ==========================================================================
  // BASIC CRUD Operations
  // ==========================================================================

  /**
   * Create a new chat session
   */
  static async createChatSession(input: CreateChatSessionInput): Promise<QueryResult<ChatSession>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Validate user and character exist
      const [user, character] = await Promise.all([
        writeClient.user.findUnique({
          where: { id: input.userId },
          select: { id: true }
        }),
        writeClient.learningCharacter.findUnique({
          where: { id: input.characterId },
          select: { id: true, isActive: true }
        })
      ]);

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (!character || !character.isActive) {
        return {
          success: false,
          error: 'Character not found or inactive'
        };
      }

      const chatSession = await writeClient.chatSession.create({
        data: {
          userId: input.userId,
          characterId: input.characterId,
          sessionName: input.sessionName,
          conversationHistory: input.conversationHistory ? (input.conversationHistory as any) : [],
          contextData: input.contextData ? (input.contextData as any) : {},
          isActive: true,
          startedAt: new Date(),
          lastMessageAt: new Date()
        }
      });

      const executionTime = Date.now() - startTime;
      logger.info('Chat session created successfully', {
        sessionId: chatSession.id,
        userId: input.userId,
        characterId: input.characterId,
        executionTime
      });

      return {
        success: true,
        data: chatSession as ChatSession,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to create chat session', { error, input, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get chat session by ID
   */
  static async getChatSessionById(
    id: string,
    includeRelations: boolean = false
  ): Promise<QueryResult<ChatSession | ChatSessionWithRelations>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const chatSession = await readClient.chatSession.findUnique({
        where: { id },
        include: includeRelations ? {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              level: true
            }
          },
          character: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
              specialization: true,
              skillLevel: true,
              conversationStyle: true
            }
          }
        } : undefined
      });

      const executionTime = Date.now() - startTime;

      if (!chatSession) {
        return {
          success: false,
          error: 'Chat session not found',
          metadata: { executionTime }
        };
      }

      return {
        success: true,
        data: chatSession as ChatSession | ChatSessionWithRelations,
        metadata: {
          executionTime,
          cacheHit: false
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get chat session by ID', { error, id, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get chat sessions with filtering and pagination
   */
  static async getChatSessions(
    filters: ChatSessionFilters = {},
    sort: ChatSessionSortOptions = { field: 'lastMessageAt', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<QueryResult<PaginatedResult<ChatSessionWithRelations>>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ChatSessionWhereInput = {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.characterId && { characterId: filters.characterId }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters.startedAfter && { startedAt: { gte: filters.startedAfter } }),
        ...(filters.startedBefore && { startedAt: { lte: filters.startedBefore } }),
        ...(filters.lastMessageAfter && { lastMessageAt: { gte: filters.lastMessageAfter } })
      };

      // Build order by clause
      const orderBy: Prisma.ChatSessionOrderByWithRelationInput = {
        [sort.field]: sort.direction
      };

      // Execute queries in parallel
      const [chatSessions, totalCount] = await Promise.all([
        readClient.chatSession.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true
              }
            },
            character: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                specialization: true
              }
            }
          },
          orderBy,
          skip: offset,
          take: limit
        }),
        readClient.chatSession.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          data: chatSessions as ChatSessionWithRelations[],
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
      logger.error('Failed to get chat sessions', { error, filters, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user's chat sessions
   */
  static async getUserChatSessions(
    userId: string,
    pagination: PaginationOptions = { page: 1, limit: 20 },
    activeOnly: boolean = false
  ): Promise<QueryResult<PaginatedResult<ChatSessionWithRelations>>> {
    const filters: ChatSessionFilters = {
      userId,
      ...(activeOnly && { isActive: true })
    };

    return this.getChatSessions(
      filters,
      { field: 'lastMessageAt', direction: 'desc' },
      pagination
    );
  }

  /**
   * Get character's chat sessions
   */
  static async getCharacterChatSessions(
    characterId: string,
    pagination: PaginationOptions = { page: 1, limit: 20 },
    activeOnly: boolean = false
  ): Promise<QueryResult<PaginatedResult<ChatSessionWithRelations>>> {
    const filters: ChatSessionFilters = {
      characterId,
      ...(activeOnly && { isActive: true })
    };

    return this.getChatSessions(
      filters,
      { field: 'lastMessageAt', direction: 'desc' },
      pagination
    );
  }

  /**
   * Get active chat session between user and character
   */
  static async getActiveUserCharacterSession(
    userId: string,
    characterId: string
  ): Promise<QueryResult<ChatSession | null>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const chatSession = await readClient.chatSession.findFirst({
        where: {
          userId,
          characterId,
          isActive: true
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: chatSession as ChatSession | null,
        metadata: {
          executionTime,
          cacheHit: false
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get active user character session', { 
        error, userId, characterId, executionTime 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update chat session
   */
  static async updateChatSession(input: UpdateChatSessionInput): Promise<QueryResult<ChatSession>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const { id, ...updateData } = input;
      
      const chatSession = await writeClient.chatSession.update({
        where: { id },
        data: {
          ...updateData,
          lastMessageAt: new Date() // Always update last message time
        }
      });

      const executionTime = Date.now() - startTime;
      logger.info('Chat session updated successfully', {
        sessionId: chatSession.id,
        changes: Object.keys(updateData),
        executionTime
      });

      return {
        success: true,
        data: chatSession as ChatSession,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to update chat session', { error, input, executionTime });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            error: 'Chat session not found'
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
   * End chat session
   */
  static async endChatSession(sessionId: string): Promise<QueryResult<ChatSession>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const chatSession = await writeClient.chatSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          endedAt: new Date()
        }
      });

      const executionTime = Date.now() - startTime;
      logger.info('Chat session ended', { sessionId, executionTime });

      return {
        success: true,
        data: chatSession as ChatSession,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to end chat session', { error, sessionId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // CONVERSATION Management
  // ==========================================================================

  /**
   * Add message to chat session
   */
  static async addMessage(
    sessionId: string,
    message: ChatMessage
  ): Promise<QueryResult<ChatSession>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Get current conversation history
      const currentSession = await writeClient.chatSession.findUnique({
        where: { id: sessionId },
        select: { conversationHistory: true }
      });

      if (!currentSession) {
        return {
          success: false,
          error: 'Chat session not found'
        };
      }

      const currentHistory = (currentSession.conversationHistory as ChatMessage[]) || [];
      const updatedHistory = [...currentHistory, message];

      const chatSession = await writeClient.chatSession.update({
        where: { id: sessionId },
        data: {
          conversationHistory: updatedHistory,
          lastMessageAt: new Date()
        }
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: chatSession as ChatSession,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to add message to chat session', { 
        error, sessionId, message, executionTime 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update session context
   */
  static async updateSessionContext(
    sessionId: string,
    contextData: SessionContext
  ): Promise<QueryResult<ChatSession>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Get current context and merge with new data
      const currentSession = await writeClient.chatSession.findUnique({
        where: { id: sessionId },
        select: { contextData: true }
      });

      if (!currentSession) {
        return {
          success: false,
          error: 'Chat session not found'
        };
      }

      const currentContext = (currentSession.contextData as SessionContext) || {};
      const mergedContext = { ...currentContext, ...contextData };

      const chatSession = await writeClient.chatSession.update({
        where: { id: sessionId },
        data: {
          contextData: mergedContext,
          lastMessageAt: new Date()
        }
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: chatSession as ChatSession,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to update session context', { 
        error, sessionId, contextData, executionTime 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get conversation history
   */
  static async getConversationHistory(
    sessionId: string,
    limit?: number,
    offset?: number
  ): Promise<QueryResult<{
    messages: ChatMessage[];
    total: number;
    sessionInfo: {
      id: string;
      sessionName: string | null;
      startedAt: Date;
      isActive: boolean;
    };
  }>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const chatSession = await readClient.chatSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          sessionName: true,
          startedAt: true,
          isActive: true,
          conversationHistory: true
        }
      });

      if (!chatSession) {
        return {
          success: false,
          error: 'Chat session not found'
        };
      }

      const allMessages = (chatSession.conversationHistory as ChatMessage[]) || [];
      const total = allMessages.length;

      // Apply pagination if specified
      let messages = allMessages;
      if (offset !== undefined || limit !== undefined) {
        const start = offset || 0;
        const end = limit ? start + limit : undefined;
        messages = allMessages.slice(start, end);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          messages,
          total,
          sessionInfo: {
            id: chatSession.id,
            sessionName: chatSession.sessionName,
            startedAt: chatSession.startedAt,
            isActive: chatSession.isActive
          }
        },
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get conversation history', { error, sessionId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Clear conversation history (keep session but remove messages)
   */
  static async clearConversationHistory(sessionId: string): Promise<QueryResult<ChatSession>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const chatSession = await writeClient.chatSession.update({
        where: { id: sessionId },
        data: {
          conversationHistory: [],
          lastMessageAt: new Date()
        }
      });

      const executionTime = Date.now() - startTime;
      logger.info('Conversation history cleared', { sessionId, executionTime });

      return {
        success: true,
        data: chatSession as ChatSession,
        metadata: {
          executionTime,
          recordsAffected: 1
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to clear conversation history', { error, sessionId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // ANALYTICS and INSIGHTS
  // ==========================================================================

  /**
   * Get chat session analytics
   */
  static async getChatSessionAnalytics(sessionId: string): Promise<QueryResult<{
    messageCount: number;
    sessionDuration: number; // minutes
    averageResponseTime: number; // seconds
    userMessageCount: number;
    characterMessageCount: number;
    mostDiscussedTopics: string[];
    conversationFlow: Array<{ timestamp: Date; sender: string; messageLength: number }>;
  }>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const chatSession = await readClient.chatSession.findUnique({
        where: { id: sessionId },
        select: {
          startedAt: true,
          endedAt: true,
          conversationHistory: true,
          contextData: true
        }
      });

      if (!chatSession) {
        return {
          success: false,
          error: 'Chat session not found'
        };
      }

      const messages = (chatSession.conversationHistory as ChatMessage[]) || [];
      const messageCount = messages.length;

      // Calculate session duration
      const endTime = chatSession.endedAt || new Date();
      const sessionDuration = (endTime.getTime() - chatSession.startedAt.getTime()) / (1000 * 60);

      // Count messages by sender
      const userMessageCount = messages.filter(m => m.sender === 'user').length;
      const characterMessageCount = messages.filter(m => m.sender === 'character').length;

      // Calculate average response time (simplified)
      let totalResponseTime = 0;
      let responseCount = 0;
      for (let i = 1; i < messages.length; i++) {
        const prev = messages[i - 1];
        const curr = messages[i];
        if (prev.sender === 'user' && curr.sender === 'character') {
          const responseTime = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
      const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

      // Extract topics from context data
      const contextData = chatSession.contextData as any;
      const mostDiscussedTopics = [];
      if (contextData?.learningGoals) {
        mostDiscussedTopics.push(...contextData.learningGoals);
      }
      if (contextData?.currentTopic) {
        mostDiscussedTopics.push(contextData.currentTopic);
      }

      // Create conversation flow
      const conversationFlow = messages.map(m => ({
        timestamp: m.timestamp,
        sender: m.sender,
        messageLength: m.content.length
      }));

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          messageCount,
          sessionDuration,
          averageResponseTime,
          userMessageCount,
          characterMessageCount,
          mostDiscussedTopics,
          conversationFlow
        },
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get chat session analytics', { error, sessionId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user chat statistics
   */
  static async getUserChatStats(userId: string): Promise<QueryResult<{
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    totalChatTime: number; // minutes
    favoriteCharacters: Array<{ characterId: string; characterName: string; sessionCount: number }>;
    chatFrequency: Array<{ date: string; sessionCount: number }>;
    averageSessionDuration: number;
    mostActiveTimeOfDay: string;
  }>> {
    const startTime = Date.now();
    
    try {
      const readClient = dbPool.getReadClient();
      
      const chatSessions = await readClient.chatSession.findMany({
        where: { userId },
        include: {
          character: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        }
      });

      const totalSessions = chatSessions.length;
      const activeSessions = chatSessions.filter(s => s.isActive).length;

      // Calculate total messages
      const totalMessages = chatSessions.reduce((sum, session) => {
        const messages = session.conversationHistory as ChatMessage[] || [];
        return sum + messages.length;
      }, 0);

      // Calculate total chat time
      const totalChatTime = chatSessions.reduce((sum, session) => {
        const endTime = session.endedAt || new Date();
        const duration = (endTime.getTime() - session.startedAt.getTime()) / (1000 * 60);
        return sum + duration;
      }, 0);

      // Find favorite characters
      const characterCounts = new Map<string, { name: string; count: number }>();
      chatSessions.forEach(session => {
        const charId = session.characterId;
        const charName = session.character.displayName || session.character.name;
        const current = characterCounts.get(charId) || { name: charName, count: 0 };
        characterCounts.set(charId, { name: charName, count: current.count + 1 });
      });

      const favoriteCharacters = Array.from(characterCounts.entries())
        .map(([characterId, { name, count }]) => ({
          characterId,
          characterName: name,
          sessionCount: count
        }))
        .sort((a, b) => b.sessionCount - a.sessionCount)
        .slice(0, 5);

      // Calculate chat frequency (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentSessions = chatSessions.filter(s => s.startedAt >= thirtyDaysAgo);
      
      const frequencyMap = new Map<string, number>();
      recentSessions.forEach(session => {
        const dateKey = session.startedAt.toISOString().split('T')[0];
        frequencyMap.set(dateKey, (frequencyMap.get(dateKey) || 0) + 1);
      });

      const chatFrequency = Array.from(frequencyMap.entries())
        .map(([date, sessionCount]) => ({ date, sessionCount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate average session duration
      const completedSessions = chatSessions.filter(s => s.endedAt);
      const averageSessionDuration = completedSessions.length > 0
        ? totalChatTime / completedSessions.length
        : 0;

      // Find most active time of day
      const hourCounts = new Map<number, number>();
      chatSessions.forEach(session => {
        const hour = session.startedAt.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });

      const mostActiveHour = Array.from(hourCounts.entries())
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 9;

      const mostActiveTimeOfDay = 
        mostActiveHour >= 6 && mostActiveHour < 12 ? 'morning' :
        mostActiveHour >= 12 && mostActiveHour < 18 ? 'afternoon' :
        mostActiveHour >= 18 && mostActiveHour < 22 ? 'evening' : 'night';

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          totalSessions,
          activeSessions,
          totalMessages,
          totalChatTime,
          favoriteCharacters,
          chatFrequency,
          averageSessionDuration,
          mostActiveTimeOfDay
        },
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to get user chat stats', { error, userId, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ==========================================================================
  // CLEANUP and MAINTENANCE
  // ==========================================================================

  /**
   * Delete old inactive sessions
   */
  static async cleanupOldSessions(
    olderThanDays: number = 90
  ): Promise<QueryResult<{ deletedCount: number }>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      const deleteResult = await writeClient.chatSession.deleteMany({
        where: {
          isActive: false,
          endedAt: {
            lte: cutoffDate
          }
        }
      });

      const executionTime = Date.now() - startTime;
      logger.info('Old chat sessions cleaned up', {
        deletedCount: deleteResult.count,
        cutoffDate,
        executionTime
      });

      return {
        success: true,
        data: { deletedCount: deleteResult.count },
        metadata: {
          executionTime,
          recordsAffected: deleteResult.count
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to cleanup old sessions', { error, olderThanDays, executionTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Archive large conversation histories
   */
  static async archiveLargeConversations(
    messageThreshold: number = 1000
  ): Promise<QueryResult<{ archivedCount: number }>> {
    const startTime = Date.now();
    
    try {
      const writeClient = dbPool.getWriteClient();
      
      // Find sessions with large conversation histories
      const largeSessions = await writeClient.chatSession.findMany({
        where: {
          isActive: false
        },
        select: {
          id: true,
          conversationHistory: true
        }
      });

      let archivedCount = 0;
      
      for (const session of largeSessions) {
        const messages = session.conversationHistory as ChatMessage[] || [];
        
        if (messages.length > messageThreshold) {
          // Keep only the last 100 messages and first 50 messages
          const preservedMessages = [
            ...messages.slice(0, 50),
            { 
              id: 'archived-placeholder',
              timestamp: new Date(),
              sender: 'system' as const,
              content: `[${messages.length - 150} messages archived]`,
              metadata: { archived: true }
            },
            ...messages.slice(-100)
          ];

          await writeClient.chatSession.update({
            where: { id: session.id },
            data: {
              conversationHistory: preservedMessages
            }
          });

          archivedCount++;
        }
      }

      const executionTime = Date.now() - startTime;
      logger.info('Large conversations archived', {
        archivedCount,
        messageThreshold,
        executionTime
      });

      return {
        success: true,
        data: { archivedCount },
        metadata: {
          executionTime,
          recordsAffected: archivedCount
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to archive large conversations', { 
        error, messageThreshold, executionTime 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export convenience functions
export const {
  createChatSession,
  getChatSessionById,
  getChatSessions,
  getUserChatSessions,
  getCharacterChatSessions,
  getActiveUserCharacterSession,
  updateChatSession,
  endChatSession,
  addMessage,
  updateSessionContext,
  getConversationHistory,
  clearConversationHistory,
  getChatSessionAnalytics,
  getUserChatStats,
  cleanupOldSessions,
  archiveLargeConversations
} = ChatQueries;