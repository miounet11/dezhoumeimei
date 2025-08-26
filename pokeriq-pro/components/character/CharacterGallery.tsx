'use client';

/**
 * Character Gallery Component
 * Main character selection interface with filtering and recommendations
 */

import React, { useState, useEffect } from 'react';
import CharacterCard from './CharacterCard';
import { 
  LearningCharacter, 
  CharacterSkillLevel, 
  CharacterStyle,
  CharacterFilters 
} from '@/lib/types/dezhoumama';

interface CharacterPreview {
  name: string;
  displayName: string;
  description: string;
  specialization: string;
  skillLevel: string;
  style: string;
  personality: {
    primaryTraits: string[];
    teachingApproach: string;
    bestFor: string[];
  };
}

interface CharacterWithPreview extends LearningCharacter {
  preview: CharacterPreview;
  compatibilityScore?: number;
  isRecommended?: boolean;
}

interface CharacterGalleryProps {
  userId?: string;
  onCharacterSelect: (character: LearningCharacter) => void;
  showRecommendations?: boolean;
  maxCharacters?: number;
  className?: string;
}

export default function CharacterGallery({
  userId,
  onCharacterSelect,
  showRecommendations = true,
  maxCharacters = 20,
  className = ''
}: CharacterGalleryProps) {
  const [characters, setCharacters] = useState<CharacterWithPreview[]>([]);
  const [recommendations, setRecommendations] = useState<CharacterWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<LearningCharacter | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<CharacterFilters>({
    isActive: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'specialization' | 'compatibility'>('name');

  // Load characters on mount
  useEffect(() => {
    loadCharacters();
  }, [userId, filters]);

  const loadCharacters = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        limit: maxCharacters.toString(),
        active: 'true',
        ...(userId && { userId }),
        ...(showRecommendations && { recommendations: 'true' }),
        ...(filters.specialization && { specialization: filters.specialization }),
        ...(filters.skillLevel && { skillLevel: filters.skillLevel }),
        ...(filters.conversationStyle && { style: filters.conversationStyle }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/characters?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load characters');
      }

      const data = await response.json();
      setCharacters(data.data || []);
      setRecommendations(data.recommendations || []);
      
    } catch (err) {
      console.error('Error loading characters:', err);
      setError(err instanceof Error ? err.message : 'Failed to load characters');
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSelect = (character: LearningCharacter) => {
    setSelectedCharacter(character);
    onCharacterSelect(character);
  };

  const handleFilterChange = (newFilters: Partial<CharacterFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const sortCharacters = (chars: CharacterWithPreview[]) => {
    return [...chars].sort((a, b) => {
      switch (sortBy) {
        case 'compatibility':
          return (b.compatibilityScore || 0) - (a.compatibilityScore || 0);
        case 'specialization':
          return a.specialization.localeCompare(b.specialization);
        case 'name':
        default:
          return a.displayName.localeCompare(b.displayName);
      }
    });
  };

  const filteredCharacters = sortCharacters(characters);
  const sortedRecommendations = sortCharacters(recommendations);

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadCharacters}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header and Filters */}
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Poker Coach
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select an AI character to help you improve your poker skills through personalized conversations and coaching
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Characters
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name, specialization..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Skill Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Level
              </label>
              <select
                value={filters.skillLevel || ''}
                onChange={(e) => handleFilterChange({ 
                  skillLevel: e.target.value as CharacterSkillLevel || undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>

            {/* Style Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teaching Style
              </label>
              <select
                value={filters.conversationStyle || ''}
                onChange={(e) => handleFilterChange({ 
                  conversationStyle: e.target.value as CharacterStyle || undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Styles</option>
                <option value="FRIENDLY">Friendly</option>
                <option value="ANALYTICAL">Analytical</option>
                <option value="CASUAL">Casual</option>
                <option value="FORMAL">Formal</option>
                <option value="DIRECT">Direct</option>
                <option value="HUMOROUS">Humorous</option>
                <option value="COMPETITIVE">Competitive</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="specialization">Specialization</option>
                {userId && <option value="compatibility">Compatibility</option>}
              </select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange({ specialization: 'tournament' })}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filters.specialization === 'tournament'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              Tournament
            </button>
            <button
              onClick={() => handleFilterChange({ specialization: 'cash game' })}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filters.specialization === 'cash game'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              Cash Games
            </button>
            <button
              onClick={() => handleFilterChange({ skillLevel: 'BEGINNER' as CharacterSkillLevel })}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filters.skillLevel === 'BEGINNER'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
              }`}
            >
              Beginner Friendly
            </button>
            <button
              onClick={() => setFilters({ isActive: true })}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      {showRecommendations && sortedRecommendations.length > 0 && (
        <div>
          <div className="flex items-center mb-6">
            <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">
              Recommended for You
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {sortedRecommendations.slice(0, 3).map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                preview={character.preview}
                compatibilityScore={character.compatibilityScore}
                isRecommended={true}
                isSelected={selectedCharacter?.id === character.id}
                onClick={handleCharacterSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Characters Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            All Characters ({filteredCharacters.length})
          </h2>
          
          {filteredCharacters.length > 0 && (
            <div className="text-sm text-gray-500">
              {filteredCharacters.filter(c => c.isRecommended).length > 0 && 
                `${filteredCharacters.filter(c => c.isRecommended).length} recommended • `}
              Showing {filteredCharacters.length} characters
            </div>
          )}
        </div>

        {filteredCharacters.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">No characters found matching your filters</p>
            <button 
              onClick={() => setFilters({ isActive: true })}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters to see all characters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                preview={character.preview}
                compatibilityScore={character.compatibilityScore}
                isRecommended={character.isRecommended}
                isSelected={selectedCharacter?.id === character.id}
                onClick={handleCharacterSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}