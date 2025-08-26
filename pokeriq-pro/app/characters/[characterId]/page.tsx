'use client';

/**
 * Character Chat Page - Individual character conversation interface
 * Handles real-time chat with selected AI character
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/character/ChatInterface';
import CharacterAvatar from '@/components/character/CharacterAvatar';
import { LearningCharacter, ChatSession } from '@/lib/types/dezhoumama';

interface CharacterChatPageProps {
  params: {
    characterId: string;
  };
}

export default function CharacterChatPage({ params }: CharacterChatPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { characterId } = params;
  const sessionId = searchParams?.get('session');

  // State management
  const [character, setCharacter] = useState<LearningCharacter | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mock user ID - in real app this would come from auth context
  const userId = 'user-123';

  // Load character and session data
  useEffect(() => {
    if (characterId) {
      loadCharacterData();
    }
  }, [characterId]);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  const loadCharacterData = async () => {
    try {
      const response = await fetch(`/api/characters/${characterId}?userId=${userId}&stats=true`);
      if (!response.ok) {
        throw new Error('Character not found');
      }
      
      const data = await response.json();
      setCharacter(data.character);
    } catch (err) {
      console.error('Error loading character:', err);
      setError(err instanceof Error ? err.message : 'Failed to load character');
    }
  };

  const loadSessionData = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}?history=true`);
      if (!response.ok) {
        throw new Error('Session not found');
      }
      
      const data = await response.json();
      setSession(data.session);
    } catch (err) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat session');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionEnd = () => {
    // Navigate back to character selection
    router.push('/characters');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleCreateNewSession = async () => {
    if (!character) return;

    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          characterId: character.id,
          sessionName: `Chat with ${character.displayName}`,
          initialContext: {
            userLevel: 'intermediate',
            learningGoals: ['preflop', 'position'],
            preferences: {
              explanationDepth: 'detailed',
              exampleFrequency: 'moderate',
              interactionStyle: 'mixed'
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      setSession(data.session);
      
      // Update URL with new session ID
      router.replace(`/characters/${characterId}?session=${data.session.id}`);
      
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create chat session');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push('/characters')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Characters
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Character not found
  if (!character) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Character not found</h2>
          <p className="text-gray-600 mb-4">The character you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/characters')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Characters
          </button>
        </div>
      </div>
    );
  }

  // No session state
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/characters')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <CharacterAvatar character={character} size="md" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{character.displayName}</h1>
                <p className="text-gray-600">{character.specialization}</p>
              </div>
            </div>
          </div>
        </div>

        {/* No Session Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <CharacterAvatar character={character} size="xl" className="mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to start learning with {character.displayName}?
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {character.description || `Start a conversation with ${character.displayName} to improve your poker skills.`}
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleCreateNewSession}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Start New Conversation
              </button>
              
              <div className="text-sm text-gray-500">
                <p>Specializes in: <span className="font-medium">{character.specialization}</span></p>
                <p>Teaching style: <span className="font-medium">{character.conversationStyle.toLowerCase()}</span></p>
                <p>Skill level: <span className="font-medium">{character.skillLevel.toLowerCase()}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/characters')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to character selection"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-3">
                <CharacterAvatar character={character} size="md" showStatus status="online" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{character.displayName}</h1>
                  <p className="text-sm text-gray-600">{character.specialization}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreateNewSession}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Start new conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-120px)]">
        <ChatInterface
          session={session}
          character={character}
          userId={userId}
          onSessionEnd={handleSessionEnd}
          onError={handleError}
          className="h-full"
        />
      </div>
    </div>
  );
}