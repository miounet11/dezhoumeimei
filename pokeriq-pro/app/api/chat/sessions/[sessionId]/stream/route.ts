/**
 * Chat Streaming API Route
 * GET /api/chat/sessions/[sessionId]/stream - Server-Sent Events for real-time chat
 */

import { NextRequest } from 'next/server';
import { createSSEResponse } from '@/lib/chat/streaming';
import { createLogger } from '@/lib/logger';
import { ChatQueries } from '@/lib/db/queries/chat';

const logger = createLogger('chat-stream-api');

interface RouteParams {
  params: {
    sessionId: string;
  };
}

/**
 * GET /api/chat/sessions/[sessionId]/stream
 * Create Server-Sent Events stream for real-time chat updates
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  const { sessionId } = params;
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId parameter is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    logger.info('Creating SSE stream for chat session', {
      sessionId,
      userId
    });

    // Verify session exists and user has access
    const sessionResult = await ChatQueries.getChatSessionById(sessionId, false);
    
    if (!sessionResult.success || !sessionResult.data) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const session = sessionResult.data;
    
    // Verify user owns this session or is authorized to access it
    if (session.userId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to session' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if session is still active
    if (!session.isActive) {
      return new Response(
        JSON.stringify({ error: 'Session is not active' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    logger.info('Session verified, creating SSE stream', {
      sessionId,
      userId,
      sessionActive: session.isActive
    });

    // Create and return SSE stream
    const response = createSSEResponse(sessionId, userId, req);
    
    logger.info('SSE stream created successfully', {
      sessionId,
      userId
    });

    return response;

  } catch (error) {
    logger.error('Unexpected error creating SSE stream', { 
      error, 
      sessionId,
      userId: req.nextUrl.searchParams.get('userId')
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * OPTIONS method for CORS support
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
      'Access-Control-Max-Age': '86400'
    }
  });
}