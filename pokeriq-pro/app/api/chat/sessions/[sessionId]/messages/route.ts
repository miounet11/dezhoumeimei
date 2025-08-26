/**
 * Chat Messages API Route
 * GET /api/chat/sessions/[sessionId]/messages - Get conversation history
 * POST /api/chat/sessions/[sessionId]/messages - Send new message
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConversationManager, getConversationManager } from '@/lib/chat/conversation-manager';
import { ChatQueries } from '@/lib/db/queries/chat';
import { getMessageHandler } from '@/lib/chat/message-handler';
import { broadcastMessage, broadcastTyping } from '@/lib/chat/streaming';
import { createLogger } from '@/lib/logger';

const logger = createLogger('chat-messages-api');

interface RouteParams {
  params: {
    sessionId: string;
  };
}

/**
 * GET /api/chat/sessions/[sessionId]/messages
 * Get conversation history with pagination
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  const { sessionId } = params;
  
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const format = searchParams.get('format') || 'raw'; // 'raw' | 'formatted'

    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 200' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be non-negative' },
        { status: 400 }
      );
    }

    logger.info('Fetching conversation messages', {
      sessionId,
      limit,
      offset,
      format
    });

    // Get conversation history
    const result = await ChatQueries.getConversationHistory(sessionId, limit, offset);
    
    if (!result.success) {
      if (result.error === 'Chat session not found') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      
      logger.error('Failed to fetch messages', { error: result.error, sessionId });
      return NextResponse.json(
        { error: result.error || 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    const data = result.data!;
    let messages = data.messages;

    // Format messages if requested
    if (format === 'formatted') {
      const messageHandler = getMessageHandler();
      messages = messages.map(message => ({
        ...message,
        formatted: messageHandler.formatMessage(message)
      }));
    }

    // Add pagination info
    const hasMore = offset + limit < data.total;
    const hasPrevious = offset > 0;

    const executionTime = Date.now() - startTime;
    
    logger.info('Messages fetched successfully', {
      sessionId,
      messageCount: messages.length,
      total: data.total,
      offset,
      limit,
      executionTime
    });

    const response = {
      messages,
      sessionInfo: data.sessionInfo,
      pagination: {
        total: data.total,
        offset,
        limit,
        count: messages.length,
        hasMore,
        hasPrevious
      },
      metadata: {
        executionTime,
        format
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error fetching messages', { 
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
 * POST /api/chat/sessions/[sessionId]/messages
 * Send new message and get AI response
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  const { sessionId } = params;
  
  try {
    const body = await req.json();
    const { content, metadata } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    logger.info('Processing new message', {
      sessionId,
      contentLength: content.length,
      hasMetadata: !!metadata
    });

    // Validate and sanitize message
    const messageHandler = getMessageHandler();
    const userMessage = messageHandler.createMessage(content, 'user', metadata);
    
    if (!userMessage) {
      return NextResponse.json(
        { error: 'Invalid message content' },
        { status: 400 }
      );
    }

    // Show typing indicator for AI
    broadcastTyping(sessionId, true, 'character');

    try {
      // Process message using conversation manager
      const conversationManager = getConversationManager();
      const result = await conversationManager.processMessage(
        sessionId,
        content,
        metadata
      );

      // Hide typing indicator
      broadcastTyping(sessionId, false, 'character');

      if (!result.success) {
        logger.error('Failed to process message', { 
          error: result.error, 
          sessionId,
          contentLength: content.length
        });
        
        return NextResponse.json(
          { error: result.error || 'Failed to process message' },
          { status: 500 }
        );
      }

      const { userMessage: processedUserMessage, characterResponse } = result;

      // Broadcast messages to connected clients
      if (processedUserMessage) {
        broadcastMessage(sessionId, processedUserMessage);
      }
      
      if (characterResponse) {
        broadcastMessage(sessionId, characterResponse);
      }

      const executionTime = Date.now() - startTime;
      
      logger.info('Message processed successfully', {
        sessionId,
        hasCharacterResponse: !!characterResponse,
        characterResponseLength: characterResponse?.content?.length || 0,
        executionTime
      });

      // Format response
      const response: any = {
        userMessage: processedUserMessage,
        characterResponse,
        metadata: {
          executionTime,
          processingTime: characterResponse?.metadata?.processingTime,
          broadcastSent: true
        }
      };

      // Add formatted versions if helpful
      if (processedUserMessage) {
        response.userMessage.formatted = messageHandler.formatMessage(processedUserMessage);
      }
      
      if (characterResponse) {
        response.characterResponse.formatted = messageHandler.formatMessage(characterResponse);
      }

      return NextResponse.json(response, { status: 201 });

    } catch (processingError) {
      // Make sure to hide typing indicator even on error
      broadcastTyping(sessionId, false, 'character');
      throw processingError;
    }

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error processing message', { 
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
 * DELETE /api/chat/sessions/[sessionId]/messages
 * Clear conversation history
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  const { sessionId } = params;
  
  try {
    logger.info('Clearing conversation history', { sessionId });

    const result = await ChatQueries.clearConversationHistory(sessionId);
    
    if (!result.success) {
      logger.error('Failed to clear messages', { error: result.error, sessionId });
      return NextResponse.json(
        { error: result.error || 'Failed to clear messages' },
        { status: 500 }
      );
    }

    const executionTime = Date.now() - startTime;
    
    logger.info('Conversation history cleared successfully', {
      sessionId,
      executionTime
    });

    return NextResponse.json({
      success: true,
      sessionId,
      clearedAt: new Date().toISOString(),
      metadata: {
        executionTime
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Unexpected error clearing messages', { 
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