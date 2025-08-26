'use client';

/**
 * Characters Page - Main Character Selection Interface
 * Displays available AI characters for conversation
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CharacterGallery from '@/components/character/CharacterGallery';
import { LearningCharacter } from '@/lib/types/dezhoumama';

export default function CharactersPage() {
  const router = useRouter();
  const [selectedCharacter, setSelectedCharacter] = useState<LearningCharacter | null>(null);
  
  // Mock user ID - in real app this would come from auth context
  const userId = 'user-123';

  const handleCharacterSelect = async (character: LearningCharacter) => {
    setSelectedCharacter(character);
    
    try {
      // Start a new chat session with the selected character
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start chat session');
      }

      const data = await response.json();
      const sessionId = data.session.id;

      // Navigate to the chat interface
      router.push(`/characters/${character.id}?session=${sessionId}`);
      
    } catch (error) {
      console.error('Error starting chat session:', error);
      // Handle error - show toast or error message
      alert(error instanceof Error ? error.message : 'Failed to start chat');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Poker Coaches</h1>
              <p className="mt-1 text-gray-600">
                Choose an AI character to help improve your poker skills through personalized conversations
              </p>
            </div>
            
            {/* Navigation Breadcrumb */}
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <a href="/dashboard" className="hover:text-gray-700">Dashboard</a>
                </li>
                <li>
                  <svg className="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li className="text-gray-900 font-medium">Characters</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CharacterGallery
          userId={userId}
          onCharacterSelect={handleCharacterSelect}
          showRecommendations={true}
          maxCharacters={20}
        />
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need Help Choosing a Character?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Each AI character has unique teaching styles and specializations. Look for the "Recommended" 
              badges to find characters that match your skill level and learning preferences.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">For Beginners</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Look for characters with "Patient" and "Supportive" traits who specialize in fundamentals and basics.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">For Analysis</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Choose characters with "Analytical" style who can provide detailed hand analysis and strategic insights.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">For Advanced</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Expert-level characters can discuss advanced concepts like GTO strategy and complex game theory.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              {selectedCharacter ? (
                <span>Starting conversation with {selectedCharacter.displayName}...</span>
              ) : (
                <span>Select a character to start learning</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <a href="/help" className="hover:text-gray-700">Help</a>
              <a href="/feedback" className="hover:text-gray-700">Feedback</a>
              <a href="/settings" className="hover:text-gray-700">Settings</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}