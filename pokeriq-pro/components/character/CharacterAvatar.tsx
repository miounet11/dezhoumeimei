'use client';

/**
 * Character Avatar Component
 * Displays character avatar with different sizes and states
 */

import React from 'react';
import Image from 'next/image';
import { LearningCharacter } from '@/lib/types/dezhoumama';

interface CharacterAvatarProps {
  character: LearningCharacter;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'typing' | 'away';
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function CharacterAvatar({
  character,
  size = 'md',
  status = 'online',
  showStatus = false,
  className = '',
  onClick
}: CharacterAvatarProps) {
  
  const getSizeClasses = () => {
    switch (size) {
      case 'xs': return 'w-6 h-6 text-xs';
      case 'sm': return 'w-8 h-8 text-sm';
      case 'md': return 'w-10 h-10 text-base';
      case 'lg': return 'w-12 h-12 text-lg';
      case 'xl': return 'w-16 h-16 text-xl';
      default: return 'w-10 h-10 text-base';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'typing': return 'bg-blue-500 animate-pulse';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getGradientColors = () => {
    // Generate consistent gradient colors based on character name
    const charCode = character.name.charCodeAt(0);
    const gradients = [
      'from-blue-400 to-purple-500',
      'from-green-400 to-blue-500',
      'from-purple-400 to-pink-500',
      'from-yellow-400 to-red-500',
      'from-pink-400 to-purple-500',
      'from-indigo-400 to-blue-500',
      'from-teal-400 to-green-500',
      'from-orange-400 to-red-500'
    ];
    return gradients[charCode % gradients.length];
  };

  const getStatusIndicatorSize = () => {
    switch (size) {
      case 'xs': return 'w-2 h-2';
      case 'sm': return 'w-2.5 h-2.5';
      case 'md': return 'w-3 h-3';
      case 'lg': return 'w-3.5 h-3.5';
      case 'xl': return 'w-4 h-4';
      default: return 'w-3 h-3';
    }
  };

  const avatarContent = () => {
    if (character.avatarUrl) {
      return (
        <Image
          src={character.avatarUrl}
          alt={character.displayName}
          fill
          className="object-cover"
          sizes={`${getSizeClasses().split(' ')[0].substring(2)}px`}
        />
      );
    } else {
      // Generate initials as fallback
      const initials = character.displayName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();

      return (
        <div className={`
          w-full h-full bg-gradient-to-br ${getGradientColors()} 
          flex items-center justify-center text-white font-bold
        `}>
          {initials}
        </div>
      );
    }
  };

  return (
    <div 
      className={`
        relative ${getSizeClasses()} flex-shrink-0 
        ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50' : ''}
        ${className}
      `}
      onClick={onClick}
      title={character.displayName}
    >
      {/* Main Avatar */}
      <div className={`
        relative ${getSizeClasses()} rounded-full overflow-hidden
        ring-2 ring-white shadow-sm
        ${status === 'typing' ? 'animate-pulse' : ''}
      `}>
        {avatarContent()}
      </div>

      {/* Status Indicator */}
      {showStatus && (
        <div 
          className={`
            absolute -bottom-0.5 -right-0.5 ${getStatusIndicatorSize()} 
            ${getStatusColor()} rounded-full ring-2 ring-white
          `}
          title={`Status: ${status}`}
        />
      )}

      {/* Typing Animation Ring */}
      {status === 'typing' && (
        <div className={`
          absolute inset-0 ${getSizeClasses()} rounded-full 
          border-2 border-blue-400 animate-ping
        `} />
      )}

      {/* Hover Effects */}
      {onClick && (
        <div className={`
          absolute inset-0 ${getSizeClasses()} rounded-full 
          bg-black bg-opacity-0 hover:bg-opacity-10 
          transition-all duration-200
        `} />
      )}
    </div>
  );
}