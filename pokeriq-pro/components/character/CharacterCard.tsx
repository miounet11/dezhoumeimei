'use client';

/**
 * Character Card Component
 * Displays individual character information in selection interface
 */

import React from 'react';
import Image from 'next/image';
import { LearningCharacter, CharacterSkillLevel, CharacterStyle } from '@/lib/types/dezhoumama';

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

interface CharacterCardProps {
  character: LearningCharacter;
  preview: CharacterPreview;
  compatibilityScore?: number;
  isRecommended?: boolean;
  isSelected?: boolean;
  onClick?: (character: LearningCharacter) => void;
  className?: string;
}

export default function CharacterCard({
  character,
  preview,
  compatibilityScore,
  isRecommended = false,
  isSelected = false,
  onClick,
  className = ''
}: CharacterCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(character);
    }
  };

  const getSkillLevelColor = (skillLevel: string) => {
    switch (skillLevel) {
      case 'BEGINNER': return 'text-green-600 bg-green-50';
      case 'INTERMEDIATE': return 'text-blue-600 bg-blue-50';
      case 'EXPERT': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'FRIENDLY': return 'text-pink-600 bg-pink-50';
      case 'ANALYTICAL': return 'text-indigo-600 bg-indigo-50';
      case 'CASUAL': return 'text-teal-600 bg-teal-50';
      case 'FORMAL': return 'text-slate-600 bg-slate-50';
      case 'DIRECT': return 'text-red-600 bg-red-50';
      case 'HUMOROUS': return 'text-orange-600 bg-orange-50';
      case 'COMPETITIVE': return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCompatibilityColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div 
      className={`
        relative bg-white rounded-xl shadow-sm border border-gray-200 
        hover:shadow-lg hover:border-blue-300 transition-all duration-200 
        cursor-pointer group
        ${isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : ''}
        ${isRecommended ? 'ring-2 ring-green-200 border-green-300' : ''}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Recommendation Badge */}
      {isRecommended && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm">
            Recommended
          </div>
        </div>
      )}

      {/* Compatibility Score */}
      {compatibilityScore && (
        <div className="absolute top-3 right-3 z-10">
          <div className={`text-sm font-semibold ${getCompatibilityColor(compatibilityScore)}`}>
            {compatibilityScore}%
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Character Avatar and Basic Info */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
              {character.displayName.charAt(0)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {character.displayName}
            </h3>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {preview.description}
            </p>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(character.skillLevel)}`}>
                {character.skillLevel.toLowerCase()}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStyleColor(character.conversationStyle)}`}>
                {character.conversationStyle.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Specialization */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-1">Specialization</div>
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            {character.specialization}
          </div>
        </div>

        {/* Personality Traits */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Key Traits</div>
          <div className="flex flex-wrap gap-1">
            {preview.personality.primaryTraits.map((trait, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Teaching Approach */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-1">Teaching Style</div>
          <div className="text-sm text-gray-600">
            {preview.personality.teachingApproach}
          </div>
        </div>

        {/* Best For */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Best For</div>
          <div className="space-y-1">
            {preview.personality.bestFor.map((item, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-100">
          <button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
            onClick={handleClick}
          >
            Start Chat
          </button>
          <button 
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              // Handle preview or more info
            }}
          >
            Preview
          </button>
        </div>

        {/* Hover Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none" />
      </div>
    </div>
  );
}