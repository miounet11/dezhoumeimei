'use client';

/**
 * Message List Component
 * Displays conversation messages with proper formatting
 */

import React from 'react';
import CharacterAvatar from './CharacterAvatar';
import { ChatMessage, LearningCharacter } from '@/lib/types/dezhoumama';

interface MessageListProps {
  messages: ChatMessage[];
  character: LearningCharacter;
  userId: string;
  className?: string;
}

interface MessageItemProps {
  message: ChatMessage;
  character: LearningCharacter;
  isUser: boolean;
  showAvatar: boolean;
}

function MessageItem({ message, character, isUser, showAvatar }: MessageItemProps) {
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diff = now.getTime() - messageTime.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return messageTime.toLocaleDateString();
  };

  const getEmotionalToneColor = (tone?: string) => {
    switch (tone) {
      case 'enthusiastic': return 'text-yellow-600';
      case 'supportive': return 'text-green-600';
      case 'patient': return 'text-blue-600';
      case 'encouraging': return 'text-purple-600';
      case 'analytical': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-blue-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const renderSuggestions = (suggestions?: string[]) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        <div className="text-xs font-medium text-gray-600 mb-2">Suggested follow-ups:</div>
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="block w-full text-left p-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => {
                // This would trigger sending the suggested message
                console.log('Suggested message clicked:', suggestion);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar */}
        {showAvatar && !isUser && (
          <div className="flex-shrink-0 mb-1">
            <CharacterAvatar character={character} size="sm" />
          </div>
        )}
        
        {isUser && showAvatar && (
          <div className="flex-shrink-0 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div
            className={`
              px-4 py-2 rounded-2xl max-w-full break-words
              ${isUser 
                ? 'bg-blue-600 text-white rounded-br-md' 
                : 'bg-gray-100 text-gray-900 rounded-bl-md'
              }
            `}
          >
            <div className="whitespace-pre-wrap">{message.content}</div>
            
            {/* Character Message Metadata */}
            {!isUser && message.metadata && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                <div className="flex items-center space-x-3">
                  {message.metadata.emotionalTone && (
                    <span className={`font-medium ${getEmotionalToneColor(message.metadata.emotionalTone)}`}>
                      Tone: {message.metadata.emotionalTone}
                    </span>
                  )}
                  
                  {message.metadata.confidence && (
                    <span className={`font-medium ${getConfidenceColor(message.metadata.confidence)}`}>
                      Confidence: {Math.round(message.metadata.confidence * 100)}%
                    </span>
                  )}
                  
                  {message.metadata.processingTime && (
                    <span>
                      Response: {message.metadata.processingTime}ms
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Timestamp and Status */}
          <div className={`mt-1 text-xs text-gray-500 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTimestamp(message.timestamp)}
            
            {message.metadata?.isFallback && (
              <span className="ml-2 text-orange-500 font-medium">
                (Fallback response)
              </span>
            )}
            
            {message.metadata?.isWelcomeMessage && (
              <span className="ml-2 text-green-500 font-medium">
                (Welcome message)
              </span>
            )}
          </div>

          {/* Follow-up Suggestions */}
          {!isUser && message.metadata?.suggestedFollowups && (
            <div className="mt-2 w-full">
              {renderSuggestions(message.metadata.suggestedFollowups)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessageList({ 
  messages, 
  character, 
  userId, 
  className = '' 
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <CharacterAvatar character={character} size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Start your conversation with {character.displayName}
        </h3>
        <p className="text-gray-600 mb-4">
          Ask me anything about poker strategy, hand analysis, or general gameplay tips!
        </p>
        
        {/* Conversation Starters */}
        <div className="space-y-2 max-w-md mx-auto">
          <div className="text-sm font-medium text-gray-700 mb-3">Try asking:</div>
          <div className="space-y-2">
            {[
              "What should I focus on as a beginner?",
              "Can you analyze a poker hand for me?",
              "How do I improve my preflop play?",
              "What are the most common mistakes to avoid?"
            ].map((starter, index) => (
              <button
                key={index}
                className="w-full p-2 text-sm text-left text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => {
                  // This would trigger sending the starter message
                  console.log('Conversation starter clicked:', starter);
                }}
              >
                "{starter}"
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {messages.map((message, index) => {
        const isUser = message.sender === 'user';
        const prevMessage = messages[index - 1];
        const showAvatar = !prevMessage || prevMessage.sender !== message.sender;

        return (
          <MessageItem
            key={message.id}
            message={message}
            character={character}
            isUser={isUser}
            showAvatar={showAvatar}
          />
        );
      })}
    </div>
  );
}