'use client';

/**
 * Message Input Component
 * Input interface for sending messages in chat
 */

import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string, metadata?: any) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 2000,
  className = ''
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isComposing) return;

    // Send message with metadata
    onSendMessage(trimmedMessage, {
      timestamp: new Date(),
      length: trimmedMessage.length,
      wordCount: trimmedMessage.split(/\s+/).length
    });

    // Clear input
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (but not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      sendMessage();
    }

    // ESC to clear
    if (e.key === 'Escape') {
      setMessage('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const newText = message + pastedText;
    
    if (newText.length > maxLength) {
      e.preventDefault();
      const remainingSpace = maxLength - message.length;
      const truncatedText = pastedText.substring(0, remainingSpace);
      setMessage(prev => prev + truncatedText);
    }
  };

  const insertQuickResponse = (text: string) => {
    if (disabled) return;
    setMessage(prev => {
      const newMessage = prev ? `${prev} ${text}` : text;
      return newMessage.length > maxLength ? prev : newMessage;
    });
    textareaRef.current?.focus();
  };

  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Quick Response Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          "Thanks for the explanation!",
          "Can you give me an example?",
          "What should I do in this situation?",
          "I don't understand, can you clarify?"
        ].map((quickResponse, index) => (
          <button
            key={index}
            onClick={() => insertQuickResponse(quickResponse)}
            disabled={disabled}
            className="px-3 py-1 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {quickResponse}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.substring(0, maxLength))}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full px-4 py-3 pr-20 border border-gray-300 rounded-xl resize-none
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${isOverLimit ? 'border-red-500 focus:ring-red-500' : ''}
            `}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />

          {/* Send Button */}
          <div className="absolute right-2 bottom-2 flex items-center space-x-2">
            {/* Character Count */}
            {isNearLimit && (
              <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-orange-500'}`}>
                {characterCount}/{maxLength}
              </span>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={disabled || !message.trim() || isOverLimit || isComposing}
              className={`
                p-2 rounded-lg transition-colors
                ${message.trim() && !disabled && !isOverLimit && !isComposing
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              title="Send message (Enter)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Input Tips */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <div className="flex items-center space-x-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {message.trim() && (
              <span>
                {message.trim().split(/\s+/).length} words
              </span>
            )}
          </div>
          
          {disabled && (
            <div className="flex items-center text-orange-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Connection required
            </div>
          )}
        </div>

        {/* Character Limit Warning */}
        {isOverLimit && (
          <div className="text-sm text-red-500 mt-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Message is too long. Please shorten it by {characterCount - maxLength} characters.
          </div>
        )}
      </form>
    </div>
  );
}