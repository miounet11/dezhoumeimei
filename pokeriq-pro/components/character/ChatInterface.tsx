'use client';

/**
 * Chat Interface Component
 * Real-time chat interface for character conversations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import CharacterAvatar from './CharacterAvatar';
import { ChatMessage, LearningCharacter, ChatSession } from '@/lib/types/dezhoumama';
import { createSSEClient } from '@/lib/chat/streaming';
import { createLogger } from '@/lib/logger';

const logger = createLogger('chat-interface');

interface ChatInterfaceProps {
  session: ChatSession;
  character: LearningCharacter;
  userId: string;
  onSessionEnd?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function ChatInterface({
  session,
  character,
  userId,
  onSessionEnd,
  onError,
  className = ''
}: ChatInterfaceProps) {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isCharacterTyping, setIsCharacterTyping] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseClientRef = useRef<any>(null);

  // Load initial conversation history
  useEffect(() => {
    loadConversationHistory();
  }, [session.id]);

  // Setup SSE connection
  useEffect(() => {
    if (!session.id || !userId) return;

    const sseClient = createSSEClient(
      session.id,
      handleNewMessage,
      handleTypingChange,
      handleConnectionError
    );

    sseClientRef.current = sseClient;
    sseClient.connect();
    setIsConnected(true);

    return () => {
      if (sseClient) {
        sseClient.disconnect();
        setIsConnected(false);
      }
    };
  }, [session.id, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversationHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat/sessions/${session.id}/messages?limit=50`);
      if (!response.ok) {
        throw new Error('Failed to load conversation history');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      logger.error('Failed to load conversation history', { error, sessionId: session.id });
      handleError('Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => {
      // Avoid duplicate messages
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const handleTypingChange = useCallback((isTyping: boolean, sender: string) => {
    if (sender === 'character') {
      setIsCharacterTyping(isTyping);
    }
  }, []);

  const handleConnectionError = useCallback((error: string) => {
    setConnectionError(error);
    setIsConnected(false);
    if (onError) {
      onError(error);
    }
  }, [onError]);

  const handleSendMessage = async (content: string, metadata?: any) => {
    if (!content.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/chat/sessions/${session.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          metadata
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Message will be added via SSE stream, so we don't need to add it here
    } catch (error) {
      logger.error('Failed to send message', { error, sessionId: session.id });
      handleError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEndSession = async () => {
    try {
      const response = await fetch(`/api/chat/sessions/${session.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to end session');
      }

      if (onSessionEnd) {
        onSessionEnd();
      }
    } catch (error) {
      logger.error('Failed to end session', { error, sessionId: session.id });
      handleError('Failed to end session');
    }
  };

  const handleError = (error: string) => {
    setConnectionError(error);
    if (onError) {
      onError(error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const retryConnection = () => {
    setConnectionError(null);
    if (sseClientRef.current) {
      sseClientRef.current.connect();
      setIsConnected(true);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <CharacterAvatar character={character} size="md" />
          <div>
            <h3 className="font-semibold text-gray-900">{character.displayName}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{character.specialization}</span>
              <span>•</span>
              <div className={`flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Session Actions */}
          <button
            onClick={handleEndSession}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="End conversation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{connectionError}</p>
            </div>
            <button
              onClick={retryConnection}
              className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageList 
          messages={messages}
          character={character}
          userId={userId}
        />
        
        {/* Typing Indicator */}
        {isCharacterTyping && (
          <TypingIndicator character={character} />
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sendingMessage || !isConnected}
          placeholder={
            !isConnected 
              ? "Reconnecting..." 
              : sendingMessage 
                ? "Sending..." 
                : `Message ${character.displayName}...`
          }
        />
        
        {/* Status */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>{messages.length} messages</span>
            <span>Session: {session.sessionName || 'Unnamed'}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {sendingMessage && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-gray-600 mr-2"></div>
                Sending...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}