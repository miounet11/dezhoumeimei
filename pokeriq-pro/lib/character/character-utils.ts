/**
 * Character Utility Functions
 * Helper functions for character management and interactions
 */

import { 
  LearningCharacter, 
  PersonalityConfig, 
  CharacterStyle, 
  CharacterSkillLevel,
  SessionContext,
  ChatMessage
} from '@/lib/types/dezhoumama';
import { createLogger } from '@/lib/logger';

const logger = createLogger('character-utils');

/**
 * Character matching and recommendation utilities
 */
export class CharacterUtils {
  
  /**
   * Calculate compatibility score between user and character
   */
  static calculateCompatibilityScore(
    userContext: {
      level: number;
      learningStyle?: 'visual' | 'analytical' | 'practical';
      preferredPace?: 'slow' | 'moderate' | 'fast';
      currentSkillAreas?: string[];
    },
    character: LearningCharacter
  ): number {
    let score = 0;
    const personality = character.personalityConfig as PersonalityConfig;
    
    // Skill level matching (30% of score)
    const userSkillLevel = CharacterUtils.mapUserLevelToSkill(userContext.level);
    if (userSkillLevel === character.skillLevel) {
      score += 30;
    } else if (CharacterUtils.isAdjacentSkillLevel(userSkillLevel, character.skillLevel)) {
      score += 20;
    } else {
      score += 5;
    }

    // Learning style compatibility (25% of score)
    if (userContext.learningStyle) {
      score += CharacterUtils.calculateLearningStyleMatch(
        userContext.learningStyle, 
        personality, 
        character.conversationStyle
      );
    } else {
      score += 15; // Default moderate compatibility
    }

    // Specialization alignment (25% of score)
    if (userContext.currentSkillAreas) {
      score += CharacterUtils.calculateSpecializationMatch(
        userContext.currentSkillAreas,
        personality.expertise.areas,
        character.specialization
      );
    } else {
      score += 15; // Default moderate compatibility
    }

    // Personality compatibility (20% of score)
    score += CharacterUtils.calculatePersonalityMatch(personality, character.conversationStyle);

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Get recommended characters for user
   */
  static rankCharactersByCompatibility(
    characters: LearningCharacter[],
    userContext: any
  ): Array<LearningCharacter & { compatibilityScore: number }> {
    return characters
      .map(character => ({
        ...character,
        compatibilityScore: CharacterUtils.calculateCompatibilityScore(userContext, character)
      }))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  /**
   * Map user level to character skill level
   */
  private static mapUserLevelToSkill(userLevel: number): CharacterSkillLevel {
    if (userLevel < 10) return CharacterSkillLevel.BEGINNER;
    if (userLevel < 30) return CharacterSkillLevel.INTERMEDIATE;
    return CharacterSkillLevel.EXPERT;
  }

  /**
   * Check if skill levels are adjacent
   */
  private static isAdjacentSkillLevel(
    userSkill: CharacterSkillLevel, 
    characterSkill: CharacterSkillLevel
  ): boolean {
    const levels = [CharacterSkillLevel.BEGINNER, CharacterSkillLevel.INTERMEDIATE, CharacterSkillLevel.EXPERT];
    const userIndex = levels.indexOf(userSkill);
    const characterIndex = levels.indexOf(characterSkill);
    return Math.abs(userIndex - characterIndex) === 1;
  }

  /**
   * Calculate learning style compatibility
   */
  private static calculateLearningStyleMatch(
    userStyle: 'visual' | 'analytical' | 'practical',
    personality: PersonalityConfig,
    conversationStyle: CharacterStyle
  ): number {
    let score = 0;

    switch (userStyle) {
      case 'analytical':
        if (conversationStyle === CharacterStyle.ANALYTICAL) score += 25;
        else if (personality.traits.analytical > 0.7) score += 20;
        else score += 10;
        break;
      
      case 'visual':
        if (personality.teachingStyle.usesExamples) score += 20;
        if (conversationStyle === CharacterStyle.FRIENDLY || conversationStyle === CharacterStyle.CASUAL) score += 15;
        else score += 10;
        break;
      
      case 'practical':
        if (personality.teachingStyle.givesPracticalTips) score += 25;
        if (conversationStyle === CharacterStyle.DIRECT) score += 20;
        else score += 15;
        break;
    }

    return score;
  }

  /**
   * Calculate specialization match
   */
  private static calculateSpecializationMatch(
    userSkillAreas: string[],
    characterExpertise: string[],
    characterSpecialization: string
  ): number {
    let score = 0;
    const maxPossible = 25;

    // Check direct expertise matches
    const expertiseMatches = userSkillAreas.filter(area => 
      characterExpertise.some(expertise => 
        expertise.toLowerCase().includes(area.toLowerCase()) ||
        area.toLowerCase().includes(expertise.toLowerCase())
      )
    ).length;

    // Check specialization match
    const specializationMatches = userSkillAreas.filter(area => 
      characterSpecialization.toLowerCase().includes(area.toLowerCase()) ||
      area.toLowerCase().includes(characterSpecialization.toLowerCase())
    ).length;

    // Calculate proportional score
    const totalMatches = expertiseMatches + specializationMatches;
    const maxMatches = Math.max(userSkillAreas.length, characterExpertise.length + 1);
    score = (totalMatches / maxMatches) * maxPossible;

    return Math.round(score);
  }

  /**
   * Calculate personality compatibility
   */
  private static calculatePersonalityMatch(
    personality: PersonalityConfig,
    conversationStyle: CharacterStyle
  ): number {
    let score = 10; // Base score

    // Reward balanced personalities
    const traits = personality.traits;
    const traitBalance = 1 - Math.abs(0.5 - (
      traits.friendliness + traits.patience + traits.supportive
    ) / 3);
    score += traitBalance * 10;

    return Math.round(score);
  }

  /**
   * Generate character preview for selection interface
   */
  static generateCharacterPreview(character: LearningCharacter): {
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
  } {
    const personality = character.personalityConfig as PersonalityConfig;
    
    // Extract primary personality traits
    const primaryTraits: string[] = [];
    if (personality.traits.friendliness > 0.7) primaryTraits.push('Friendly');
    if (personality.traits.analytical > 0.7) primaryTraits.push('Analytical');
    if (personality.traits.supportive > 0.7) primaryTraits.push('Supportive');
    if (personality.traits.patience > 0.8) primaryTraits.push('Patient');
    if (personality.traits.enthusiasm > 0.7) primaryTraits.push('Enthusiastic');
    
    // Determine teaching approach
    let teachingApproach = 'Balanced';
    if (personality.teachingStyle.providesDetails && personality.traits.analytical > 0.7) {
      teachingApproach = 'Detailed & Analytical';
    } else if (personality.teachingStyle.usesExamples && personality.traits.friendliness > 0.7) {
      teachingApproach = 'Example-driven & Supportive';
    } else if (personality.traits.formality > 0.7) {
      teachingApproach = 'Structured & Formal';
    } else if (character.conversationStyle === CharacterStyle.CASUAL) {
      teachingApproach = 'Casual & Relaxed';
    }

    // Determine what character is best for
    const bestFor: string[] = [];
    if (character.skillLevel === CharacterSkillLevel.BEGINNER) {
      bestFor.push('New players');
      bestFor.push('Learning basics');
    }
    if (personality.traits.supportive > 0.7) {
      bestFor.push('Building confidence');
    }
    if (personality.traits.analytical > 0.7) {
      bestFor.push('Strategy analysis');
    }
    if (personality.expertise.areas.length > 3) {
      bestFor.push('Comprehensive learning');
    }
    if (personality.teachingStyle.givesPracticalTips) {
      bestFor.push('Practical improvement');
    }

    return {
      name: character.name,
      displayName: character.displayName,
      description: character.description || 'A skilled poker instructor ready to help you improve.',
      specialization: character.specialization,
      skillLevel: character.skillLevel,
      style: character.conversationStyle,
      personality: {
        primaryTraits: primaryTraits.slice(0, 3),
        teachingApproach,
        bestFor: bestFor.slice(0, 3)
      }
    };
  }

  /**
   * Create session context from user data
   */
  static createSessionContext(userData: {
    level: number;
    recentCourses?: string[];
    skillAreas?: string[];
    preferences?: any;
    recentPerformance?: any;
  }): SessionContext {
    return {
      userLevel: CharacterUtils.mapUserLevelToSkill(userData.level).toLowerCase(),
      learningGoals: userData.skillAreas || [],
      gameContext: {
        focusAreas: userData.skillAreas || [],
        recentPerformance: userData.recentPerformance
      },
      preferences: {
        explanationDepth: userData.preferences?.explanationDepth || 'detailed',
        exampleFrequency: userData.preferences?.exampleFrequency || 'moderate',
        interactionStyle: userData.preferences?.interactionStyle || 'mixed'
      }
    };
  }

  /**
   * Extract conversation insights for analytics
   */
  static analyzeConversationHistory(messages: ChatMessage[]): {
    totalMessages: number;
    userMessages: number;
    characterMessages: number;
    averageMessageLength: number;
    topicsDiscussed: string[];
    sentimentTrend: string[];
    engagementLevel: 'low' | 'medium' | 'high';
  } {
    const userMessages = messages.filter(m => m.sender === 'user');
    const characterMessages = messages.filter(m => m.sender === 'character');
    
    // Calculate average message length
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const averageMessageLength = messages.length > 0 ? totalLength / messages.length : 0;

    // Extract topics (simplified keyword extraction)
    const topicsDiscussed = CharacterUtils.extractTopicsFromMessages(messages);

    // Analyze sentiment trend (simplified)
    const sentimentTrend = CharacterUtils.analyzeSentimentTrend(messages);

    // Determine engagement level
    let engagementLevel: 'low' | 'medium' | 'high' = 'medium';
    const messagesPerMinute = messages.length / Math.max(1, CharacterUtils.calculateSessionDuration(messages));
    if (messagesPerMinute > 0.5) engagementLevel = 'high';
    else if (messagesPerMinute < 0.2) engagementLevel = 'low';

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      characterMessages: characterMessages.length,
      averageMessageLength: Math.round(averageMessageLength),
      topicsDiscussed,
      sentimentTrend,
      engagementLevel
    };
  }

  /**
   * Extract topics from message content
   */
  private static extractTopicsFromMessages(messages: ChatMessage[]): string[] {
    const pokerKeywords = [
      'preflop', 'postflop', 'flop', 'turn', 'river',
      'betting', 'raising', 'calling', 'folding',
      'position', 'ranges', 'gto', 'bluffing',
      'value betting', 'pot odds', 'implied odds',
      'tournament', 'cash game', 'strategy'
    ];

    const topicCounts = new Map<string, number>();
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      pokerKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1);
        }
      });
    });

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * Analyze sentiment trend in conversation
   */
  private static analyzeSentimentTrend(messages: ChatMessage[]): string[] {
    const sentiments: string[] = [];
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      if (content.includes('confused') || content.includes('difficult') || content.includes('hard')) {
        sentiments.push('negative');
      } else if (content.includes('great') || content.includes('thanks') || content.includes('helpful')) {
        sentiments.push('positive');
      } else {
        sentiments.push('neutral');
      }
    });

    return sentiments;
  }

  /**
   * Calculate session duration in minutes
   */
  private static calculateSessionDuration(messages: ChatMessage[]): number {
    if (messages.length < 2) return 1;
    
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    
    const durationMs = lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
    return Math.max(1, durationMs / (1000 * 60)); // Convert to minutes, minimum 1 minute
  }

  /**
   * Validate character configuration
   */
  static validateCharacterConfig(character: Partial<LearningCharacter>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!character.name || character.name.trim().length === 0) {
      errors.push('Character name is required');
    }

    if (!character.displayName || character.displayName.trim().length === 0) {
      errors.push('Character display name is required');
    }

    if (!character.specialization || character.specialization.trim().length === 0) {
      errors.push('Character specialization is required');
    }

    if (!character.skillLevel) {
      errors.push('Character skill level is required');
    }

    if (!character.conversationStyle) {
      errors.push('Character conversation style is required');
    }

    if (character.personalityConfig) {
      try {
        const personality = character.personalityConfig as PersonalityConfig;
        if (!personality.traits || !personality.teachingStyle || !personality.expertise) {
          errors.push('Invalid personality configuration structure');
        }
      } catch {
        errors.push('Personality configuration must be valid JSON');
      }
    } else {
      errors.push('Personality configuration is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create character summary for display
   */
  static createCharacterSummary(character: LearningCharacter): {
    basicInfo: {
      name: string;
      specialization: string;
      skillLevel: string;
      style: string;
    };
    capabilities: string[];
    personalityHighlights: string[];
    recommendedFor: string[];
  } {
    const personality = character.personalityConfig as PersonalityConfig;
    const preview = CharacterUtils.generateCharacterPreview(character);

    const capabilities: string[] = [];
    if (personality.teachingStyle.usesExamples) capabilities.push('Uses practical examples');
    if (personality.teachingStyle.providesDetails) capabilities.push('Provides detailed explanations');
    if (personality.teachingStyle.givesPracticalTips) capabilities.push('Gives actionable tips');
    if (personality.teachingStyle.encouragesQuestions) capabilities.push('Encourages questions');

    const personalityHighlights = preview.personality.primaryTraits;

    const recommendedFor = preview.personality.bestFor;

    return {
      basicInfo: {
        name: character.displayName,
        specialization: character.specialization,
        skillLevel: character.skillLevel,
        style: character.conversationStyle
      },
      capabilities,
      personalityHighlights,
      recommendedFor
    };
  }
}

/**
 * Character state management utilities
 */
export class CharacterStateManager {
  
  /**
   * Track character interaction metrics
   */
  static trackInteraction(
    characterId: string,
    interactionType: 'message_sent' | 'session_started' | 'session_ended',
    metadata?: Record<string, any>
  ): void {
    logger.info('Character interaction tracked', {
      characterId,
      interactionType,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Update character performance metrics
   */
  static updatePerformanceMetrics(
    characterId: string,
    metrics: {
      responseTime?: number;
      userSatisfaction?: number;
      sessionDuration?: number;
      messagesExchanged?: number;
    }
  ): void {
    logger.info('Character performance metrics updated', {
      characterId,
      metrics,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Export utility functions
 */
export {
  CharacterUtils as default,
  CharacterStateManager
};