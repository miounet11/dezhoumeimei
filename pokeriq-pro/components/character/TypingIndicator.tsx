'use client';

/**
 * Typing Indicator Component
 * Shows when the AI character is typing a response
 */

import React from 'react';
import CharacterAvatar from './CharacterAvatar';
import { LearningCharacter } from '@/lib/types/dezhoumama';

interface TypingIndicatorProps {
  character: LearningCharacter;
  className?: string;
}

export default function TypingIndicator({ 
  character, 
  className = '' 
}: TypingIndicatorProps) {
  return (
    <div className={`flex items-end space-x-2 mb-4 ${className}`}>
      {/* Character Avatar */}
      <div className="flex-shrink-0 mb-1">
        <CharacterAvatar character={character} size="sm" />
      </div>

      {/* Typing Bubble */}
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[200px]">
        <div className="flex items-center space-x-1">
          {/* Animated Dots */}
          <div className="flex space-x-1">
            <div 
              className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
            />
            <div 
              className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: '160ms', animationDuration: '1.4s' }}
            />
            <div 
              className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: '320ms', animationDuration: '1.4s' }}
            />
          </div>

          {/* Character is typing text */}
          <div className="text-xs text-gray-500 ml-2 animate-pulse">
            {character.displayName} is typing...
          </div>
        </div>

        {/* Subtle breathing animation for the bubble */}
        <style jsx>{`
          @keyframes subtle-pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
          
          .typing-bubble {
            animation: subtle-pulse 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
}