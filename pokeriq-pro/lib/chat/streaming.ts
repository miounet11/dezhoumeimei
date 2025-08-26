/**
 * Streaming Utilities for Real-time Chat
 * Server-Sent Events (SSE) implementation for real-time messaging
 */

import { ChatMessage, SessionContext } from '@/lib/types/dezhoumama';
import { createLogger } from '@/lib/logger';
import { NextRequest } from 'next/server';

const logger = createLogger('streaming');

export interface StreamEvent {
  type: 'message' | 'typing' | 'context_update' | 'error' | 'session_end';
  data: any;
  timestamp: Date;
}

export interface StreamClient {
  id: string;
  sessionId: string;
  userId: string;
  stream: ReadableStreamDefaultController;
  lastActivity: Date;
  isActive: boolean;
}

/**
 * Streaming Manager for Real-time Chat
 */
export class StreamingManager {
  private clients: Map<string, StreamClient> = new Map();
  private sessionClients: Map<string, Set<string>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up inactive clients every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveClients();
    }, 30000);
  }

  /**
   * Create SSE stream for client
   */
  createStream(
    sessionId: string,
    userId: string,
    req: NextRequest
  ): Response {
    const clientId = this.generateClientId();
    
    const stream = new ReadableStream({
      start: (controller) => {
        // Create client
        const client: StreamClient = {
          id: clientId,
          sessionId,
          userId,
          stream: controller,
          lastActivity: new Date(),
          isActive: true
        };

        // Store client
        this.clients.set(clientId, client);
        
        // Add to session tracking
        if (!this.sessionClients.has(sessionId)) {
          this.sessionClients.set(sessionId, new Set());
        }
        this.sessionClients.get(sessionId)!.add(clientId);

        logger.info('SSE stream created', { 
          clientId, 
          sessionId, 
          userId,
          totalClients: this.clients.size
        });

        // Send initial connection event
        this.sendToClient(clientId, {
          type: 'message',
          data: {
            type: 'connection',
            message: 'Connected to chat stream',
            clientId
          },
          timestamp: new Date()
        });

        // Handle client disconnect
        req.signal.addEventListener('abort', () => {
          this.removeClient(clientId);
        });
      },

      cancel: () => {
        this.removeClient(clientId);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });
  }

  /**
   * Send message to all clients in a session
   */
  broadcastToSession(sessionId: string, message: ChatMessage): void {
    const clientIds = this.sessionClients.get(sessionId);
    if (!clientIds || clientIds.size === 0) {
      logger.debug('No clients connected to session', { sessionId });
      return;
    }

    const event: StreamEvent = {
      type: 'message',
      data: {
        type: 'new_message',
        message: this.formatMessageForStream(message)
      },
      timestamp: new Date()
    };

    let successCount = 0;
    clientIds.forEach(clientId => {
      const success = this.sendToClient(clientId, event);
      if (success) successCount++;
    });

    logger.info('Message broadcast to session', { 
      sessionId, 
      totalClients: clientIds.size, 
      successCount,
      messageId: message.id
    });
  }

  /**
   * Send typing indicator to session
   */
  broadcastTypingIndicator(
    sessionId: string, 
    isTyping: boolean, 
    sender: 'user' | 'character'
  ): void {
    const clientIds = this.sessionClients.get(sessionId);
    if (!clientIds || clientIds.size === 0) return;

    const event: StreamEvent = {
      type: 'typing',
      data: {
        type: 'typing_indicator',
        isTyping,
        sender
      },
      timestamp: new Date()
    };

    clientIds.forEach(clientId => {
      this.sendToClient(clientId, event);
    });

    logger.debug('Typing indicator broadcast', { sessionId, isTyping, sender });
  }

  /**
   * Send context update to session
   */
  broadcastContextUpdate(sessionId: string, context: Partial<SessionContext>): void {
    const clientIds = this.sessionClients.get(sessionId);
    if (!clientIds || clientIds.size === 0) return;

    const event: StreamEvent = {
      type: 'context_update',
      data: {
        type: 'context_update',
        context
      },
      timestamp: new Date()
    };

    clientIds.forEach(clientId => {
      this.sendToClient(clientId, event);
    });

    logger.debug('Context update broadcast', { sessionId, context });
  }

  /**
   * Send error to session
   */
  broadcastError(sessionId: string, error: string, details?: any): void {
    const clientIds = this.sessionClients.get(sessionId);
    if (!clientIds || clientIds.size === 0) return;

    const event: StreamEvent = {
      type: 'error',
      data: {
        type: 'error',
        error,
        details,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };

    clientIds.forEach(clientId => {
      this.sendToClient(clientId, event);
    });

    logger.warn('Error broadcast to session', { sessionId, error, details });
  }

  /**
   * Notify session end
   */
  broadcastSessionEnd(sessionId: string, reason?: string): void {
    const clientIds = this.sessionClients.get(sessionId);
    if (!clientIds || clientIds.size === 0) return;

    const event: StreamEvent = {
      type: 'session_end',
      data: {
        type: 'session_end',
        reason,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };

    clientIds.forEach(clientId => {
      this.sendToClient(clientId, event);
    });

    logger.info('Session end broadcast', { sessionId, reason });

    // Clean up session clients
    setTimeout(() => {
      clientIds.forEach(clientId => this.removeClient(clientId));
      this.sessionClients.delete(sessionId);
    }, 5000); // Give clients time to receive the event
  }

  /**
   * Send event to specific client
   */
  private sendToClient(clientId: string, event: StreamEvent): boolean {
    const client = this.clients.get(clientId);
    if (!client || !client.isActive) {
      return false;
    }

    try {
      const eventData = this.formatStreamEvent(event);
      client.stream.enqueue(eventData);
      client.lastActivity = new Date();
      
      logger.debug('Event sent to client', { 
        clientId, 
        eventType: event.type,
        sessionId: client.sessionId
      });
      
      return true;

    } catch (error) {
      logger.error('Failed to send event to client', { 
        error, 
        clientId, 
        eventType: event.type 
      });
      
      // Mark client as inactive and remove it
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Format message for streaming
   */
  private formatMessageForStream(message: ChatMessage): any {
    return {
      id: message.id,
      timestamp: message.timestamp.toISOString(),
      sender: message.sender,
      content: message.content,
      metadata: message.metadata
    };
  }

  /**
   * Format stream event for SSE
   */
  private formatStreamEvent(event: StreamEvent): string {
    const eventString = JSON.stringify({
      type: event.type,
      data: event.data,
      timestamp: event.timestamp.toISOString()
    });

    // SSE format
    return `data: ${eventString}\n\n`;
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Remove client and cleanup
   */
  private removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      // Mark as inactive
      client.isActive = false;

      // Close stream
      if (client.stream) {
        client.stream.close();
      }

      // Remove from session tracking
      const sessionClients = this.sessionClients.get(client.sessionId);
      if (sessionClients) {
        sessionClients.delete(clientId);
        if (sessionClients.size === 0) {
          this.sessionClients.delete(client.sessionId);
        }
      }

      // Remove from clients map
      this.clients.delete(clientId);

      logger.info('Client removed', { 
        clientId, 
        sessionId: client.sessionId,
        remainingClients: this.clients.size
      });

    } catch (error) {
      logger.error('Error removing client', { error, clientId });
    }
  }

  /**
   * Clean up inactive clients
   */
  private cleanupInactiveClients(): void {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
    let cleanedCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      const inactiveTime = now.getTime() - client.lastActivity.getTime();
      if (inactiveTime > inactiveThreshold || !client.isActive) {
        this.removeClient(clientId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up inactive clients', { 
        cleanedCount, 
        remainingClients: this.clients.size 
      });
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalClients: number;
    totalSessions: number;
    sessionsWithClients: Array<{
      sessionId: string;
      clientCount: number;
    }>;
  } {
    const sessionsWithClients: Array<{
      sessionId: string;
      clientCount: number;
    }> = [];

    for (const [sessionId, clientIds] of this.sessionClients.entries()) {
      sessionsWithClients.push({
        sessionId,
        clientCount: clientIds.size
      });
    }

    return {
      totalClients: this.clients.size,
      totalSessions: this.sessionClients.size,
      sessionsWithClients: sessionsWithClients.sort((a, b) => b.clientCount - a.clientCount)
    };
  }

  /**
   * Send heartbeat to all clients
   */
  sendHeartbeat(): void {
    const event: StreamEvent = {
      type: 'message',
      data: {
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };

    let activeClients = 0;
    for (const [clientId] of this.clients.entries()) {
      const success = this.sendToClient(clientId, event);
      if (success) activeClients++;
    }

    logger.debug('Heartbeat sent', { 
      totalClients: this.clients.size, 
      activeClients 
    });
  }

  /**
   * Cleanup and destroy manager
   */
  destroy(): void {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all client streams
    for (const [clientId] of this.clients.entries()) {
      this.removeClient(clientId);
    }

    // Clear maps
    this.clients.clear();
    this.sessionClients.clear();

    logger.info('StreamingManager destroyed');
  }
}

/**
 * Global streaming manager instance
 */
let globalStreamingManager: StreamingManager | null = null;

export function getStreamingManager(): StreamingManager {
  if (!globalStreamingManager) {
    globalStreamingManager = new StreamingManager();
  }
  return globalStreamingManager;
}

/**
 * Utility functions for API routes
 */
export function createSSEResponse(
  sessionId: string,
  userId: string,
  req: NextRequest
): Response {
  return getStreamingManager().createStream(sessionId, userId, req);
}

export function broadcastMessage(sessionId: string, message: ChatMessage): void {
  getStreamingManager().broadcastToSession(sessionId, message);
}

export function broadcastTyping(
  sessionId: string, 
  isTyping: boolean, 
  sender: 'user' | 'character'
): void {
  getStreamingManager().broadcastTypingIndicator(sessionId, isTyping, sender);
}

export function broadcastError(sessionId: string, error: string, details?: any): void {
  getStreamingManager().broadcastError(sessionId, error, details);
}

/**
 * React hook for SSE client connection
 */
export function createSSEClient(
  sessionId: string,
  onMessage: (message: ChatMessage) => void,
  onTyping?: (isTyping: boolean, sender: string) => void,
  onError?: (error: string) => void
): {
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
} {
  let eventSource: EventSource | null = null;
  let isConnected = false;

  const connect = () => {
    if (eventSource) return;

    const url = `/api/chat/sessions/${sessionId}/stream`;
    eventSource = new EventSource(url);
    isConnected = true;

    eventSource.onopen = () => {
      logger.info('SSE connection opened', { sessionId });
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'message':
            if (data.data.type === 'new_message') {
              onMessage(data.data.message);
            }
            break;
          
          case 'typing':
            if (onTyping) {
              onTyping(data.data.isTyping, data.data.sender);
            }
            break;
          
          case 'error':
            if (onError) {
              onError(data.data.error);
            }
            break;
        }
      } catch (error) {
        logger.error('Error parsing SSE message', { error, event });
      }
    };

    eventSource.onerror = (error) => {
      logger.error('SSE connection error', { error, sessionId });
      if (onError) {
        onError('Connection error occurred');
      }
    };
  };

  const disconnect = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      isConnected = false;
      logger.info('SSE connection closed', { sessionId });
    }
  };

  return {
    connect,
    disconnect,
    isConnected
  };
}

export default StreamingManager;