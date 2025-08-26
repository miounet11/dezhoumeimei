/**
 * Chat Sessions API Route
 * GET /api/chat/sessions - List user's chat sessions
 * POST /api/chat/sessions - Start new chat session
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConversationManager, getConversationManager } from '@/lib/chat/conversation-manager';
import { ChatQueries } from '@/lib/db/queries/chat';
import { CharacterUtils } from '@/lib/character/character-utils';
import { createLogger } from '@/lib/logger';
import { PaginationOptions } from '@/lib/types/dezhoumama';

const logger = createLogger('chat-sessions-api');

/**
 * GET /api/chat/sessions
 * List user's chat sessions with pagination and filtering
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const userId = searchParams.get('userId');
    const characterId = searchParams.get('characterId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const activeOnly = searchParams.get('active') === 'true';
    const includeHistory = searchParams.get('history') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const pagination: PaginationOptions = { page, limit };

    logger.info('Fetching chat sessions', {
      userId,
      characterId,
      pagination,
      activeOnly,
      includeHistory
    });

    let result;
    if (characterId) {
      // Get sessions for specific character
      result = await ChatQueries.getCharacterChatSessions(characterId, pagination, activeOnly);
    } else {
      // Get all user sessions
      result = await ChatQueries.getUserChatSessions(userId, pagination, activeOnly);
    }
    
    if (!result.success) {
      logger.error('Failed to fetch chat sessions', { error: result.error, userId });
      return NextResponse.json(
        { error: result.error || 'Failed to fetch chat sessions' },
        { status: 500 }
      );
    }

    const sessions = result.data!;

    // Enhance sessions with additional data
    const enhancedSessions = await Promise.all(
      sessions.data.map(async (session: any) => {
        const enhanced: any = {
          ...session,
          messageCount: Array.isArray(session.conversationHistory) 
            ? session.conversationHistory.length 
            : 0,
          lastMessage: Array.isArray(session.conversationHistory) && session.conversationHistory.length > 0
            ? session.conversationHistory[session.conversationHistory.length - 1]
            : null,
          duration: session.endedAt 
            ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
            : new Date().getTime() - new Date(session.startedAt).getTime()
        };

        // Add character preview if character data is available
        if (session.character) {
          enhanced.character.preview = CharacterUtils.generateCharacterPreview(session.character);
        }

        // Include full conversation history if requested
        if (includeHistory && session.conversationHistory) {
          enhanced.fullHistory = session.conversationHistory;
        } else {
          // Remove full history to reduce response size
          delete enhanced.conversationHistory;
        }

        return enhanced;
      })
    );

    // Calculate summary statistics
    const activeSessions = enhancedSessions.filter(s => s.isActive).length;
    const totalMessages = enhancedSessions.reduce((sum, s) => sum + s.messageCount, 0);
    const averageSessionDuration = enhancedSessions.length > 0
      ? enhancedSessions.reduce((sum, s) => sum + s.duration, 0) / enhancedSessions.length
      : 0;

    const executionTime = Date.now() - startTime;
    
    logger.info('Chat sessions fetched successfully', {
      userId,
      sessionCount: enhancedSessions.length,
      activeSessions,
      executionTime
    });

    const response = {
      ...sessions,
      data: enhancedSessions,
      summary: {
        activeSessions,
        totalMessages,
        averageSessionDuration: Math.round(averageSessionDuration / (1000 * 60)), // Convert to minutes
      },
      metadata: {
        executionTime,
        includeHistory,
        activeOnly,
        characterId
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error fetching chat sessions', { error, executionTime });
    
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
 * POST /api/chat/sessions
 * Start a new chat session
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { userId, characterId, sessionName, initialContext } = body;

    // Validate required fields
    if (!userId || !characterId) {
      return NextResponse.json(
        { error: 'userId and characterId are required' },
        { status: 400 }
      );
    }

    logger.info('Starting new chat session', {
      userId,
      characterId,
      sessionName
    });

    // Check if user already has an active session with this character
    const existingSessionResult = await ChatQueries.getActiveUserCharacterSession(userId, characterId);
    
    if (existingSessionResult.success && existingSessionResult.data) {
      logger.info('User already has active session with character', {
        userId,
        characterId,
        existingSessionId: existingSessionResult.data.id
      });

      // Return existing session instead of creating new one
      const existingSession = existingSessionResult.data;
      
      return NextResponse.json({
        session: {
          ...existingSession,
          messageCount: Array.isArray(existingSession.conversationHistory) 
            ? existingSession.conversationHistory.length 
            : 0,
          isExisting: true
        },
        metadata: {
          executionTime: Date.now() - startTime,
          action: 'resumed_existing'
        }
      });
    }

    // Create user context for personalization
    const userContext = initialContext || CharacterUtils.createSessionContext({
      level: 15, // Default level - would normally come from user profile
      skillAreas: ['preflop', 'position'], // Default interests
      preferences: {
        explanationDepth: 'detailed',
        exampleFrequency: 'moderate',
        interactionStyle: 'mixed'
      }
    });

    // Start new conversation using ConversationManager
    const conversationManager = getConversationManager();
    const result = await conversationManager.startConversation({
      userId,
      characterId,
      sessionName,
      initialContext: userContext
    });

    if (!result.success) {
      logger.error('Failed to start conversation', { 
        error: result.error, 
        userId, 
        characterId 
      });
      return NextResponse.json(
        { error: result.error || 'Failed to start chat session' },
        { status: 500 }
      );
    }

    const session = result.session!;
    
    // Get the latest conversation history with welcome message
    const historyResult = await ChatQueries.getConversationHistory(session.id);
    const messages = historyResult.success ? historyResult.data?.messages || [] : [];

    const executionTime = Date.now() - startTime;
    
    logger.info('Chat session started successfully', {
      sessionId: session.id,
      userId,
      characterId,
      messageCount: messages.length,
      executionTime
    });

    const response = {
      session: {
        ...session,
        messageCount: messages.length,
        recentMessages: messages.slice(-5), // Include last 5 messages
        isNew: true
      },
      metadata: {
        executionTime,
        action: 'created_new',
        welcomeMessageIncluded: messages.length > 0
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error starting chat session', { error, executionTime });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}