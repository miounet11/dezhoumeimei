/**
 * Character Personality Engine
 * Manages AI-powered character responses and personality traits
 */

import { PersonalityConfig, ChatMessage, SessionContext, CharacterStyle, CharacterSkillLevel } from '@/lib/types/dezhoumama';
import { createLogger } from '@/lib/logger';

const logger = createLogger('personality-engine');

export interface CharacterResponse {
  content: string;
  emotionalTone: string;
  confidence: number;
  suggestedFollowups?: string[];
  processingTime: number;
}

export interface ConversationContext {
  sessionHistory: ChatMessage[];
  userContext: SessionContext;
  characterPersonality: PersonalityConfig;
  characterStyle: CharacterStyle;
  characterSkill: CharacterSkillLevel;
  currentTopic?: string;
}

/**
 * Main Personality Engine Class
 * Generates contextually appropriate responses based on character personality
 */
export class PersonalityEngine {
  private characterPersonality: PersonalityConfig;
  private characterStyle: CharacterStyle;
  private characterSkill: CharacterSkillLevel;
  
  constructor(
    personality: PersonalityConfig,
    style: CharacterStyle,
    skillLevel: CharacterSkillLevel
  ) {
    this.characterPersonality = personality;
    this.characterStyle = style;
    this.characterSkill = skillLevel;
  }

  /**
   * Generate response based on user message and conversation context
   */
  async generateResponse(
    userMessage: string,
    context: ConversationContext
  ): Promise<CharacterResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Generating character response', {
        messageLength: userMessage.length,
        characterStyle: this.characterStyle,
        historyLength: context.sessionHistory.length
      });

      // Analyze user message intent
      const intent = await this.analyzeUserIntent(userMessage, context);
      
      // Determine response strategy based on personality
      const responseStrategy = this.selectResponseStrategy(intent, context);
      
      // Generate base response content
      const baseContent = await this.generateBaseResponse(userMessage, intent, responseStrategy, context);
      
      // Apply personality modifications
      const personalizedContent = this.applyPersonalityStyle(baseContent, context);
      
      // Determine emotional tone
      const emotionalTone = this.determineEmotionalTone(intent, context);
      
      // Calculate confidence based on expertise match
      const confidence = this.calculateResponseConfidence(intent, context);
      
      // Generate follow-up suggestions
      const suggestedFollowups = this.generateFollowupSuggestions(intent, context);
      
      const processingTime = Date.now() - startTime;
      
      logger.info('Character response generated successfully', {
        processingTime,
        emotionalTone,
        confidence,
        contentLength: personalizedContent.length
      });

      return {
        content: personalizedContent,
        emotionalTone,
        confidence,
        suggestedFollowups,
        processingTime
      };
      
    } catch (error) {
      logger.error('Failed to generate character response', { error, userMessage });
      
      // Fallback response
      return {
        content: this.generateFallbackResponse(),
        emotionalTone: 'neutral',
        confidence: 0.3,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze user message to determine intent
   */
  private async analyzeUserIntent(
    message: string, 
    context: ConversationContext
  ): Promise<{
    type: 'question' | 'greeting' | 'analysis_request' | 'casual' | 'help' | 'goodbye';
    topic?: string;
    complexity: 'simple' | 'moderate' | 'complex';
    emotionalState: 'neutral' | 'confused' | 'frustrated' | 'excited' | 'curious';
  }> {
    const messageLower = message.toLowerCase();
    
    // Determine intent type
    let type: 'question' | 'greeting' | 'analysis_request' | 'casual' | 'help' | 'goodbye' = 'casual';
    
    if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('hey')) {
      type = 'greeting';
    } else if (messageLower.includes('?') || messageLower.includes('how') || messageLower.includes('what') || messageLower.includes('why')) {
      type = 'question';
    } else if (messageLower.includes('analyze') || messageLower.includes('review') || messageLower.includes('hand')) {
      type = 'analysis_request';
    } else if (messageLower.includes('help') || messageLower.includes('stuck') || messageLower.includes('confused')) {
      type = 'help';
    } else if (messageLower.includes('bye') || messageLower.includes('goodbye') || messageLower.includes('thanks')) {
      type = 'goodbye';
    }

    // Extract topic
    let topic: string | undefined;
    const pokerTopics = ['preflop', 'postflop', 'flop', 'turn', 'river', 'betting', 'position', 'ranges', 'gto', 'bluff', 'value'];
    for (const pokerTopic of pokerTopics) {
      if (messageLower.includes(pokerTopic)) {
        topic = pokerTopic;
        break;
      }
    }

    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
    if (message.length < 20) {
      complexity = 'simple';
    } else if (message.length > 100 || messageLower.includes('complex') || messageLower.includes('advanced')) {
      complexity = 'complex';
    }

    // Determine emotional state
    let emotionalState: 'neutral' | 'confused' | 'frustrated' | 'excited' | 'curious' = 'neutral';
    if (messageLower.includes('confused') || messageLower.includes("don't understand")) {
      emotionalState = 'confused';
    } else if (messageLower.includes('frustrated') || messageLower.includes('difficult') || messageLower.includes('hard')) {
      emotionalState = 'frustrated';
    } else if (messageLower.includes('excited') || messageLower.includes('awesome') || messageLower.includes('great')) {
      emotionalState = 'excited';
    } else if (messageLower.includes('curious') || messageLower.includes('interested') || messageLower.includes('wonder')) {
      emotionalState = 'curious';
    }

    return { type, topic, complexity, emotionalState };
  }

  /**
   * Select response strategy based on intent and personality
   */
  private selectResponseStrategy(
    intent: any,
    context: ConversationContext
  ): {
    approach: 'direct' | 'explanatory' | 'encouraging' | 'analytical' | 'conversational';
    depth: 'brief' | 'moderate' | 'detailed';
    useExamples: boolean;
    askQuestions: boolean;
  } {
    const { traits, teachingStyle } = this.characterPersonality;
    
    let approach: 'direct' | 'explanatory' | 'encouraging' | 'analytical' | 'conversational' = 'conversational';
    
    // Select approach based on character style
    switch (this.characterStyle) {
      case 'ANALYTICAL':
        approach = 'analytical';
        break;
      case 'DIRECT':
        approach = 'direct';
        break;
      case 'FRIENDLY':
      case 'CASUAL':
        approach = 'conversational';
        break;
      case 'FORMAL':
        approach = 'explanatory';
        break;
      default:
        approach = traits.supportive > 0.7 ? 'encouraging' : 'conversational';
    }

    // Adjust for emotional state
    if (intent.emotionalState === 'frustrated' || intent.emotionalState === 'confused') {
      approach = traits.supportive > 0.6 ? 'encouraging' : 'explanatory';
    }

    // Determine depth based on complexity and user preferences
    let depth: 'brief' | 'moderate' | 'detailed' = 'moderate';
    if (intent.complexity === 'simple') {
      depth = 'brief';
    } else if (intent.complexity === 'complex' || this.characterSkill === 'EXPERT') {
      depth = 'detailed';
    }

    // Adjust depth based on context preferences
    if (context.userContext.preferences?.explanationDepth) {
      switch (context.userContext.preferences.explanationDepth) {
        case 'brief': depth = 'brief'; break;
        case 'detailed': depth = 'detailed'; break;
        case 'comprehensive': depth = 'detailed'; break;
      }
    }

    return {
      approach,
      depth,
      useExamples: teachingStyle.usesExamples && depth !== 'brief',
      askQuestions: teachingStyle.encouragesQuestions && intent.type !== 'greeting'
    };
  }

  /**
   * Generate base response content
   */
  private async generateBaseResponse(
    userMessage: string,
    intent: any,
    strategy: any,
    context: ConversationContext
  ): Promise<string> {
    const { conversationPatterns } = this.characterPersonality;
    
    switch (intent.type) {
      case 'greeting':
        return this.selectFromPatterns(conversationPatterns.greeting) + this.addPersonalizedGreeting(context);
      
      case 'question':
        return this.generateQuestionResponse(userMessage, intent, strategy, context);
      
      case 'analysis_request':
        return this.generateAnalysisResponse(userMessage, intent, strategy, context);
      
      case 'help':
        return this.generateHelpResponse(userMessage, intent, strategy, context);
      
      case 'goodbye':
        return this.selectFromPatterns(conversationPatterns.farewell) + this.addPersonalizedFarewell(context);
      
      default:
        return this.generateCasualResponse(userMessage, intent, strategy, context);
    }
  }

  /**
   * Generate question response
   */
  private generateQuestionResponse(
    userMessage: string,
    intent: any,
    strategy: any,
    context: ConversationContext
  ): string {
    const { expertise } = this.characterPersonality;
    
    // Check if question is in character's expertise area
    const isExpertiseMatch = intent.topic && expertise.areas.includes(intent.topic);
    
    let response = '';
    
    // Opening acknowledgment
    if (strategy.approach === 'encouraging') {
      response += "That's a great question! ";
    } else if (strategy.approach === 'analytical') {
      response += "Let me analyze this for you. ";
    } else if (strategy.approach === 'direct') {
      response += "Here's the answer: ";
    } else {
      response += "I'd be happy to explain that. ";
    }

    // Main explanation based on topic and expertise
    if (isExpertiseMatch) {
      response += this.generateExpertiseBasedExplanation(intent.topic!, strategy, context);
    } else {
      response += this.generateGeneralExplanation(userMessage, strategy, context);
    }

    // Add examples if strategy calls for it
    if (strategy.useExamples) {
      response += "\n\nFor example: " + this.generateRelevantExample(intent.topic, context);
    }

    // Ask follow-up questions if appropriate
    if (strategy.askQuestions) {
      response += "\n\n" + this.generateFollowupQuestion(intent.topic, context);
    }

    return response;
  }

  /**
   * Generate analysis response
   */
  private generateAnalysisResponse(
    userMessage: string,
    intent: any,
    strategy: any,
    context: ConversationContext
  ): string {
    let response = '';
    
    if (strategy.approach === 'analytical') {
      response += "Let me break this down step by step:\n\n";
    } else {
      response += "I'd be happy to help analyze this for you.\n\n";
    }

    // Add structured analysis
    response += "1. **Situation Assessment**: " + this.generateSituationAnalysis(userMessage, context) + "\n\n";
    response += "2. **Key Considerations**: " + this.generateKeyConsiderations(intent.topic, context) + "\n\n";
    response += "3. **Recommendation**: " + this.generateRecommendation(intent.topic, context);

    return response;
  }

  /**
   * Generate help response
   */
  private generateHelpResponse(
    userMessage: string,
    intent: any,
    strategy: any,
    context: ConversationContext
  ): string {
    const { traits } = this.characterPersonality;
    
    let response = '';
    
    if (traits.supportive > 0.7) {
      response += "Don't worry, I'm here to help! ";
    } else if (traits.patience > 0.8) {
      response += "Let's work through this together. ";
    } else {
      response += "I can help you with that. ";
    }

    response += "What specifically are you struggling with? I can:";
    response += "\n• Explain concepts step by step";
    response += "\n• Provide practice scenarios";
    response += "\n• Analyze your gameplay";
    response += "\n• Suggest learning resources";

    return response;
  }

  /**
   * Generate casual response
   */
  private generateCasualResponse(
    userMessage: string,
    intent: any,
    strategy: any,
    context: ConversationContext
  ): string {
    const { traits } = this.characterPersonality;
    
    if (traits.friendliness > 0.7) {
      return "I appreciate you sharing that with me! " + this.generateEngagementResponse(userMessage, context);
    } else if (traits.analytical > 0.7) {
      return "That's interesting. " + this.generateAnalyticalInsight(userMessage, context);
    } else {
      return "I see. " + this.generateNeutralResponse(userMessage, context);
    }
  }

  /**
   * Apply personality style modifications to content
   */
  private applyPersonalityStyle(content: string, context: ConversationContext): string {
    const { traits, teachingStyle } = this.characterPersonality;
    let modifiedContent = content;

    // Add humor if character uses humor
    if (teachingStyle.usesHumor && Math.random() < 0.3) {
      modifiedContent = this.addHumor(modifiedContent);
    }

    // Adjust formality level
    if (traits.formality > 0.7) {
      modifiedContent = this.increaseFormalityLevel(modifiedContent);
    } else if (traits.formality < 0.3) {
      modifiedContent = this.decreaseFormalityLevel(modifiedContent);
    }

    // Add enthusiasm markers
    if (traits.enthusiasm > 0.7) {
      modifiedContent = this.addEnthusiasm(modifiedContent);
    }

    // Add supportive language
    if (traits.supportive > 0.7) {
      modifiedContent = this.addSupportiveLanguage(modifiedContent);
    }

    return modifiedContent;
  }

  /**
   * Determine emotional tone based on context
   */
  private determineEmotionalTone(intent: any, context: ConversationContext): string {
    const { traits } = this.characterPersonality;
    
    // Base tone on intent emotional state
    switch (intent.emotionalState) {
      case 'frustrated':
        return traits.supportive > 0.6 ? 'supportive' : 'understanding';
      case 'confused':
        return traits.patience > 0.7 ? 'patient' : 'helpful';
      case 'excited':
        return traits.enthusiasm > 0.6 ? 'enthusiastic' : 'encouraging';
      case 'curious':
        return 'engaging';
      default:
        return traits.friendliness > 0.7 ? 'friendly' : 'neutral';
    }
  }

  /**
   * Calculate response confidence based on expertise match
   */
  private calculateResponseConfidence(intent: any, context: ConversationContext): number {
    const { expertise } = this.characterPersonality;
    let baseConfidence = 0.7;

    // Increase confidence if topic matches expertise
    if (intent.topic && expertise.areas.includes(intent.topic)) {
      baseConfidence += 0.2;
    }

    // Adjust based on skill level
    switch (this.characterSkill) {
      case 'EXPERT':
        baseConfidence += 0.1;
        break;
      case 'BEGINNER':
        baseConfidence -= 0.1;
        break;
    }

    // Adjust based on question complexity
    if (intent.complexity === 'complex' && this.characterSkill !== 'EXPERT') {
      baseConfidence -= 0.1;
    }

    return Math.min(Math.max(baseConfidence, 0.1), 0.95);
  }

  /**
   * Generate follow-up suggestions
   */
  private generateFollowupSuggestions(intent: any, context: ConversationContext): string[] {
    const suggestions: string[] = [];
    
    if (intent.type === 'question' && intent.topic) {
      suggestions.push(`Can you explain ${intent.topic} in more detail?`);
      suggestions.push(`What are common mistakes with ${intent.topic}?`);
      suggestions.push(`How do I practice ${intent.topic} better?`);
    } else if (intent.type === 'analysis_request') {
      suggestions.push("Can you analyze another scenario?");
      suggestions.push("What should I focus on improving?");
      suggestions.push("How do I apply this in real games?");
    } else {
      suggestions.push("What would you like to learn about next?");
      suggestions.push("Do you have any questions about poker strategy?");
      suggestions.push("Would you like me to explain any concepts?");
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Helper methods for content generation
   */
  private selectFromPatterns(patterns: string[]): string {
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  private addPersonalizedGreeting(context: ConversationContext): string {
    if (context.sessionHistory.length === 0) {
      return " Welcome! I'm excited to help you improve your poker skills.";
    } else {
      return " Good to see you again! Ready to continue learning?";
    }
  }

  private addPersonalizedFarewell(context: ConversationContext): string {
    return " Keep practicing what we discussed, and feel free to come back anytime!";
  }

  private generateExpertiseBasedExplanation(topic: string, strategy: any, context: ConversationContext): string {
    // This would contain topic-specific explanations based on poker knowledge
    const explanations: Record<string, string> = {
      'preflop': "Preflop play is crucial as it sets the foundation for the entire hand. Consider your position, stack sizes, and opponent tendencies.",
      'postflop': "Postflop decisions require analyzing the board texture, your hand strength, and opponent ranges.",
      'position': "Position is power in poker. Acting later gives you more information and better decision-making opportunities.",
      'ranges': "Hand ranges represent all possible holdings your opponent could have in a given situation.",
      'gto': "Game Theory Optimal play seeks unexploitable strategies by balancing your actions mathematically."
    };
    
    return explanations[topic] || "This is an important poker concept that requires careful study and practice.";
  }

  private generateGeneralExplanation(message: string, strategy: any, context: ConversationContext): string {
    return "Let me help you understand this concept better. It's important to approach poker learning systematically.";
  }

  private generateRelevantExample(topic: string | undefined, context: ConversationContext): string {
    if (!topic) return "Consider a typical hand situation where you need to make a strategic decision.";
    
    const examples: Record<string, string> = {
      'position': "If you're in the button position, you can play more hands profitably than from early position.",
      'ranges': "Against a tight player's 3-bet, their range might include QQ+, AK, whereas a loose player might 3-bet with much wider range.",
      'bluff': "On a board like A-K-7 rainbow, bluffing with a hand like 9-8 can be effective against opponents who fold too much."
    };
    
    return examples[topic] || "In a typical scenario, you'd want to consider all available information before making your decision.";
  }

  private generateFollowupQuestion(topic: string | undefined, context: ConversationContext): string {
    if (!topic) return "What specific aspect would you like to explore further?";
    
    return `What situations with ${topic} do you find most challenging?`;
  }

  private generateSituationAnalysis(message: string, context: ConversationContext): string {
    return "Based on what you've described, there are several factors to consider in this situation.";
  }

  private generateKeyConsiderations(topic: string | undefined, context: ConversationContext): string {
    return "The key factors include stack sizes, position, opponent tendencies, and board texture.";
  }

  private generateRecommendation(topic: string | undefined, context: ConversationContext): string {
    return "I recommend focusing on the fundamentals and practicing in similar situations.";
  }

  private generateEngagementResponse(message: string, context: ConversationContext): string {
    return "What aspects of poker are you most interested in improving?";
  }

  private generateAnalyticalInsight(message: string, context: ConversationContext): string {
    return "From an analytical perspective, this relates to several key poker concepts.";
  }

  private generateNeutralResponse(message: string, context: ConversationContext): string {
    return "How can I help you with your poker learning today?";
  }

  private addHumor(content: string): string {
    const humorAdditions = [
      " (Don't worry, even pros make mistakes!)",
      " (Poker can be tricky, but that's what makes it fun!)",
      " (Remember, even fish occasionally catch sharks!)"
    ];
    return content + humorAdditions[Math.floor(Math.random() * humorAdditions.length)];
  }

  private increaseFormalityLevel(content: string): string {
    return content
      .replace(/you're/g, 'you are')
      .replace(/can't/g, 'cannot')
      .replace(/won't/g, 'will not')
      .replace(/\bI'm\b/g, 'I am');
  }

  private decreaseFormalityLevel(content: string): string {
    return content
      .replace(/you are/g, "you're")
      .replace(/cannot/g, "can't")
      .replace(/will not/g, "won't")
      .replace(/\bI am\b/g, "I'm");
  }

  private addEnthusiasm(content: string): string {
    if (!content.endsWith('!') && Math.random() < 0.3) {
      return content.replace(/\.$/, '!');
    }
    return content;
  }

  private addSupportiveLanguage(content: string): string {
    const supportivePhrases = [
      "You're on the right track! ",
      "That's a great observation! ",
      "I believe in your ability to master this! "
    ];
    
    if (Math.random() < 0.2) {
      return supportivePhrases[Math.floor(Math.random() * supportivePhrases.length)] + content;
    }
    
    return content;
  }

  private generateFallbackResponse(): string {
    const fallbacks = [
      "I understand you're looking for help with poker strategy. Could you be more specific about what you'd like to learn?",
      "That's an interesting point. What particular aspect of poker would you like to focus on?",
      "I'm here to help with your poker learning. What questions do you have?",
      "Let's work together to improve your poker skills. What would you like to discuss?"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

/**
 * Factory function to create personality engines
 */
export function createPersonalityEngine(
  personality: PersonalityConfig,
  style: CharacterStyle,
  skillLevel: CharacterSkillLevel
): PersonalityEngine {
  return new PersonalityEngine(personality, style, skillLevel);
}

/**
 * Utility function to validate personality config
 */
export function validatePersonalityConfig(config: any): config is PersonalityConfig {
  try {
    const required = ['traits', 'teachingStyle', 'expertise', 'conversationPatterns'];
    return required.every(field => field in config) &&
           typeof config.traits === 'object' &&
           typeof config.teachingStyle === 'object' &&
           typeof config.expertise === 'object' &&
           Array.isArray(config.expertise.areas) &&
           typeof config.conversationPatterns === 'object';
  } catch {
    return false;
  }
}

/**
 * Create default personality config for new characters
 */
export function createDefaultPersonalityConfig(
  style: CharacterStyle,
  skillLevel: CharacterSkillLevel,
  specialization: string
): PersonalityConfig {
  const baseConfig: PersonalityConfig = {
    traits: {
      friendliness: 0.7,
      formality: 0.5,
      patience: 0.8,
      enthusiasm: 0.6,
      analytical: 0.6,
      supportive: 0.7
    },
    teachingStyle: {
      usesExamples: true,
      encouragesQuestions: true,
      providesDetails: true,
      usesHumor: false,
      givesPracticalTips: true
    },
    expertise: {
      areas: [specialization],
      level: skillLevel.toLowerCase() as 'beginner' | 'intermediate' | 'expert'
    },
    conversationPatterns: {
      greeting: [
        "Hello! I'm excited to help you learn poker.",
        "Hi there! Ready to improve your game?",
        "Welcome! Let's work on your poker skills together."
      ],
      encouragement: [
        "You're making great progress!",
        "That's the right way to think about it!",
        "Keep up the excellent work!"
      ],
      explanation: [
        "Let me explain this concept for you.",
        "Here's how I think about this situation:",
        "The key thing to understand is..."
      ],
      questioning: [
        "What do you think about this situation?",
        "How would you approach this hand?",
        "What factors are most important here?"
      ],
      farewell: [
        "Great session! Keep practicing!",
        "Thanks for the chat! See you next time!",
        "Good luck at the tables!"
      ]
    }
  };

  // Adjust traits based on style
  switch (style) {
    case 'FRIENDLY':
      baseConfig.traits.friendliness = 0.9;
      baseConfig.traits.formality = 0.3;
      baseConfig.teachingStyle.usesHumor = true;
      break;
    case 'ANALYTICAL':
      baseConfig.traits.analytical = 0.9;
      baseConfig.traits.formality = 0.7;
      baseConfig.teachingStyle.providesDetails = true;
      break;
    case 'DIRECT':
      baseConfig.traits.formality = 0.8;
      baseConfig.traits.patience = 0.5;
      baseConfig.teachingStyle.providesDetails = false;
      break;
    case 'CASUAL':
      baseConfig.traits.friendliness = 0.8;
      baseConfig.traits.formality = 0.2;
      baseConfig.teachingStyle.usesHumor = true;
      break;
    case 'FORMAL':
      baseConfig.traits.formality = 0.9;
      baseConfig.traits.friendliness = 0.5;
      break;
  }

  // Adjust expertise level
  switch (skillLevel) {
    case 'EXPERT':
      baseConfig.traits.analytical = 0.9;
      baseConfig.expertise.areas.push('gto', 'advanced-strategy');
      break;
    case 'BEGINNER':
      baseConfig.traits.patience = 0.9;
      baseConfig.traits.supportive = 0.9;
      baseConfig.expertise.areas = ['basics', 'fundamentals'];
      break;
  }

  return baseConfig;
}