/**
 * Chat Session Management API Route
 * GET /api/chat/sessions/[sessionId] - Get session details
 * PUT /api/chat/sessions/[sessionId] - Update session
 * DELETE /api/chat/sessions/[sessionId] - End session
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConversationManager, getConversationManager } from '@/lib/chat/conversation-manager';
import { ChatQueries } from '@/lib/db/queries/chat';
import { createLogger } from '@/lib/logger';

const logger = createLogger('chat-session-api');

interface RouteParams {
  params: {
    sessionId: string;
  };
}

/**
 * GET /api/chat/sessions/[sessionId]
 * Get session details with conversation history
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  const { sessionId } = params;
  
  try {
    const { searchParams } = new URL(req.url);
    const includeHistory = searchParams.get('history') !== 'false'; // Default to true
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    logger.info('Fetching session details', {
      sessionId,
      includeHistory,
      limit,
      offset
    });

    // Get session details with relations
    const sessionResult = await ChatQueries.getChatSessionById(sessionId, true);
    
    if (!sessionResult.success || !sessionResult.data) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = sessionResult.data as any; // ChatSessionWithRelations
    let responseData: any = {
      session: {
        id: session.id,
        userId: session.userId,
        characterId: session.characterId,
        sessionName: session.sessionName,
        isActive: session.isActive,
        startedAt: session.startedAt,
        lastMessageAt: session.lastMessageAt,
        endedAt: session.endedAt,
        contextData: session.contextData,
        user: session.user,
        character: session.character
      }
    };

    // Include conversation history if requested
    if (includeHistory) {
      const historyResult = await ChatQueries.getConversationHistory(sessionId, limit, offset);
      
      if (historyResult.success && historyResult.data) {
        responseData.conversation = {
          messages: historyResult.data.messages,
          total: historyResult.data.total,
          sessionInfo: historyResult.data.sessionInfo
        };

        // Add pagination info if limit was specified
        if (limit) {
          const currentOffset = offset || 0;
          responseData.conversation.pagination = {
            offset: currentOffset,
            limit,
            hasMore: currentOffset + limit < historyResult.data.total
          };
        }
      }
    }

    // Add session statistics
    try {
      const analyticsResult = await ChatQueries.getChatSessionAnalytics(sessionId);
      if (analyticsResult.success) {
        responseData.analytics = analyticsResult.data;
      }
    } catch (error) {
      logger.warn('Failed to get session analytics', { error, sessionId });
      // Don't fail the request, just skip analytics
    }

    // Calculate additional metadata
    const messageCount = Array.isArray(session.conversationHistory) 
      ? session.conversationHistory.length 
      : 0;
    
    const duration = session.endedAt 
      ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
      : new Date().getTime() - new Date(session.startedAt).getTime();

    responseData.metadata = {
      messageCount,
      duration: Math.round(duration / (1000 * 60)), // Duration in minutes
      executionTime: Date.now() - startTime,
      includeHistory,
      hasAnalytics: !!responseData.analytics
    };

    const executionTime = Date.now() - startTime;
    
    logger.info('Session details fetched successfully', {
      sessionId,
      messageCount,
      includeHistory,
      executionTime
    });

    return NextResponse.json(responseData);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error fetching session details', { 
      error, sessionId, executionTime 
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
 * PUT /api/chat/sessions/[sessionId]
 * Update session (context, name, etc.)
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  const { sessionId } = params;
  
  try {
    const body = await req.json();
    const { sessionName, contextData, isActive } = body;

    logger.info('Updating session', { 
      sessionId, 
      hasSessionName: !!sessionName,
      hasContextData: !!contextData,
      isActive 
    });

    // Prepare update data
    const updateData: any = { id: sessionId };
    if (sessionName !== undefined) updateData.sessionName = sessionName;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update session
    const result = await ChatQueries.updateChatSession(updateData);
    
    if (!result.success) {
      logger.error('Failed to update session', { error: result.error, sessionId });
      return NextResponse.json(
        { error: result.error || 'Failed to update session' },
        { status: result.error === 'Chat session not found' ? 404 : 500 }
      );
    }

    // Update context data separately if provided
    if (contextData) {
      const conversationManager = getConversationManager();
      const contextResult = await conversationManager.updateContext(sessionId, contextData);
      
      if (!contextResult.success) {
        logger.warn('Failed to update session context', { 
          error: contextResult.error, 
          sessionId 
        });
      }
    }

    const executionTime = Date.now() - startTime;
    
    logger.info('Session updated successfully', {
      sessionId,
      executionTime
    });

    const response = {
      session: result.data,
      updated: {
        sessionName: sessionName !== undefined,
        contextData: !!contextData,
        isActive: isActive !== undefined
      },
      metadata: {
        executionTime
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error updating session', { 
      error, sessionId, executionTime 
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
 * DELETE /api/chat/sessions/[sessionId]
 * End/delete session
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  const { sessionId } = params;
  
  try {
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get('reason') || 'user_ended';

    logger.info('Ending session', { sessionId, reason });

    // Use conversation manager to properly end the session
    const conversationManager = getConversationManager();
    const result = await conversationManager.endConversation(
      sessionId,
      reason as 'user_ended' | 'timeout' | 'error'
    );

    if (!result.success) {
      logger.error('Failed to end session', { error: result.error, sessionId });
      return NextResponse.json(
        { error: result.error || 'Failed to end session' },
        { status: 500 }
      );
    }

    const executionTime = Date.now() - startTime;
    
    logger.info('Session ended successfully', {
      sessionId,
      reason,
      executionTime
    });

    return NextResponse.json({
      success: true,
      sessionId,
      reason,
      endedAt: new Date().toISOString(),
      metadata: {
        executionTime
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error ending session', { 
      error, sessionId, executionTime 
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