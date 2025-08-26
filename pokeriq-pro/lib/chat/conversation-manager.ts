/**
 * Conversation Management System
 * Manages chat sessions, message processing, and conversation flow
 */

import { 
  ChatSession,
  ChatMessage,
  SessionContext,
  LearningCharacter,
  CreateChatSessionInput,
  UpdateChatSessionInput
} from '@/lib/types/dezhoumama';
import { createLogger } from '@/lib/logger';
import { ChatQueries } from '@/lib/db/queries/chat';
import { CharacterQueries } from '@/lib/db/queries/characters';
import { PersonalityEngine, createPersonalityEngine, ConversationContext } from '@/lib/character/personality-engine';
import { CharacterUtils } from '@/lib/character/character-utils';

const logger = createLogger('conversation-manager');

export interface ConversationManagerOptions {
  maxHistoryLength?: number;
  enableAutoSummary?: boolean;
  contextRetentionDays?: number;
  responseTimeoutMs?: number;
}

/**
 * Conversation Manager Class
 * Orchestrates all conversation-related operations
 */
export class ConversationManager {
  private personalityEngines: Map<string, PersonalityEngine> = new Map();
  private options: ConversationManagerOptions;

  constructor(options: ConversationManagerOptions = {}) {
    this.options = {
      maxHistoryLength: 1000,
      enableAutoSummary: true,
      contextRetentionDays: 30,
      responseTimeoutMs: 5000,
      ...options
    };
  }

  /**
   * Start a new conversation session
   */
  async startConversation(input: {
    userId: string;
    characterId: string;
    sessionName?: string;
    initialContext?: Partial<SessionContext>;
  }): Promise<{
    success: boolean;
    session?: ChatSession;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      logger.info('Starting new conversation', {
        userId: input.userId,
        characterId: input.characterId,
        sessionName: input.sessionName
      });

      // Get character information
      const characterResult = await CharacterQueries.getCharacterById(input.characterId, false);
      if (!characterResult.success || !characterResult.data) {
        return { 
          success: false, 
          error: characterResult.error || 'Character not found' 
        };
      }

      const character = characterResult.data as LearningCharacter;

      // Create initial session context
      const sessionContext: SessionContext = {
        currentTopic: undefined,
        learningGoals: [],
        userLevel: 'intermediate',
        previousSessions: 0,
        ...input.initialContext,
        preferences: {
          explanationDepth: 'detailed',
          exampleFrequency: 'moderate',
          interactionStyle: 'mixed',
          ...input.initialContext?.preferences
        }
      };

      // Create chat session
      const sessionInput: CreateChatSessionInput = {
        userId: input.userId,
        characterId: input.characterId,
        sessionName: input.sessionName || `Chat with ${character.displayName}`,
        conversationHistory: [],
        contextData: sessionContext
      };

      const sessionResult = await ChatQueries.createChatSession(sessionInput);
      if (!sessionResult.success) {
        return {
          success: false,
          error: sessionResult.error
        };
      }

      const session = sessionResult.data!;

      // Initialize personality engine for this character
      await this.initializePersonalityEngine(character);

      // Generate welcome message
      const welcomeMessage = await this.generateWelcomeMessage(character, sessionContext);
      if (welcomeMessage) {
        await this.addMessage(session.id, welcomeMessage);
      }

      const executionTime = Date.now() - startTime;
      logger.info('Conversation started successfully', {
        sessionId: session.id,
        executionTime
      });

      return {
        success: true,
        session
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to start conversation', { error, input, executionTime });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Process user message and generate character response
   */
  async processMessage(
    sessionId: string,
    userMessage: string,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    userMessage?: ChatMessage;
    characterResponse?: ChatMessage;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      logger.info('Processing user message', {
        sessionId,
        messageLength: userMessage.length
      });

      // Get session with character information
      const sessionResult = await ChatQueries.getChatSessionById(sessionId, true);
      if (!sessionResult.success || !sessionResult.data) {
        return {
          success: false,
          error: sessionResult.error || 'Session not found'
        };
      }

      const session = sessionResult.data as any; // ChatSessionWithRelations

      // Create user message
      const userMsgId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userChatMessage: ChatMessage = {
        id: userMsgId,
        timestamp: new Date(),
        sender: 'user',
        content: userMessage,
        metadata
      };

      // Add user message to session
      await this.addMessage(sessionId, userChatMessage);

      // Generate character response
      const characterResponse = await this.generateCharacterResponse(
        session,
        userChatMessage
      );

      if (characterResponse) {
        await this.addMessage(sessionId, characterResponse);
      }

      const executionTime = Date.now() - startTime;
      logger.info('Message processed successfully', {
        sessionId,
        executionTime,
        hasCharacterResponse: !!characterResponse
      });

      return {
        success: true,
        userMessage: userChatMessage,
        characterResponse
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Failed to process message', { 
        error, sessionId, messageLength: userMessage.length, executionTime 
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Add message to conversation history
   */
  private async addMessage(
    sessionId: string, 
    message: ChatMessage
  ): Promise<void> {
    const result = await ChatQueries.addMessage(sessionId, message);
    if (!result.success) {
      throw new Error(result.error || 'Failed to add message');
    }

    // Update session timestamp
    await ChatQueries.updateChatSession({
      id: sessionId,
      lastMessageAt: message.timestamp
    });
  }

  /**
   * Generate character response using personality engine
   */
  private async generateCharacterResponse(
    session: any, // ChatSessionWithRelations
    userMessage: ChatMessage
  ): Promise<ChatMessage | null> {
    try {
      const character = session.character as LearningCharacter;
      const conversationHistory = (session.conversationHistory as ChatMessage[]) || [];
      const sessionContext = (session.contextData as SessionContext) || {};

      // Get or create personality engine
      const personalityEngine = await this.getPersonalityEngine(character);
      if (!personalityEngine) {
        logger.warn('No personality engine available for character', { 
          characterId: character.id 
        });
        return null;
      }

      // Build conversation context
      const context: ConversationContext = {
        sessionHistory: conversationHistory,
        userContext: sessionContext,
        characterPersonality: character.personalityConfig as any,
        characterStyle: character.conversationStyle,
        characterSkill: character.skillLevel,
        currentTopic: sessionContext.currentTopic
      };

      // Generate response
      const response = await personalityEngine.generateResponse(
        userMessage.content, 
        context
      );

      // Create character message
      const characterMsgId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const characterMessage: ChatMessage = {
        id: characterMsgId,
        timestamp: new Date(),
        sender: 'character',
        content: response.content,
        metadata: {
          emotionalTone: response.emotionalTone,
          confidence: response.confidence,
          processingTime: response.processingTime,
          suggestedFollowups: response.suggestedFollowups
        }
      };

      return characterMessage;

    } catch (error) {
      logger.error('Failed to generate character response', { error, sessionId: session.id });
      return this.createFallbackMessage();
    }
  }

  /**
   * Generate welcome message for new sessions
   */
  private async generateWelcomeMessage(
    character: LearningCharacter,
    context: SessionContext
  ): Promise<ChatMessage | null> {
    try {
      const personalityEngine = await this.getPersonalityEngine(character);
      if (!personalityEngine) return null;

      const welcomeContext: ConversationContext = {
        sessionHistory: [],
        userContext: context,
        characterPersonality: character.personalityConfig as any,
        characterStyle: character.conversationStyle,
        characterSkill: character.skillLevel
      };

      const response = await personalityEngine.generateResponse(
        'Hello!', // Trigger greeting response
        welcomeContext
      );

      const welcomeMsgId = `welcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: welcomeMsgId,
        timestamp: new Date(),
        sender: 'character',
        content: response.content,
        metadata: {
          emotionalTone: response.emotionalTone,
          confidence: response.confidence,
          processingTime: response.processingTime,
          isWelcomeMessage: true
        }
      };

    } catch (error) {
      logger.error('Failed to generate welcome message', { error, characterId: character.id });
      return null;
    }
  }

  /**
   * Initialize personality engine for character
   */
  private async initializePersonalityEngine(character: LearningCharacter): Promise<void> {
    if (this.personalityEngines.has(character.id)) {
      return; // Already initialized
    }

    try {
      const personalityConfig = character.personalityConfig as any;
      const engine = createPersonalityEngine(
        personalityConfig,
        character.conversationStyle,
        character.skillLevel
      );

      this.personalityEngines.set(character.id, engine);
      logger.info('Personality engine initialized', { characterId: character.id });

    } catch (error) {
      logger.error('Failed to initialize personality engine', { 
        error, characterId: character.id 
      });
    }
  }

  /**
   * Get personality engine for character
   */
  private async getPersonalityEngine(character: LearningCharacter): Promise<PersonalityEngine | null> {
    if (!this.personalityEngines.has(character.id)) {
      await this.initializePersonalityEngine(character);
    }
    return this.personalityEngines.get(character.id) || null;
  }

  /**
   * Create fallback message when AI fails
   */
  private createFallbackMessage(): ChatMessage {
    const fallbackMessages = [
      "I'm having trouble processing that right now. Could you rephrase your question?",
      "Sorry, I need a moment to think about that. What specific aspect would you like to discuss?",
      "I want to make sure I give you the best answer. Could you be more specific about what you'd like to learn?",
      "Let me make sure I understand correctly. What poker concept would you like help with?"
    ];

    const fallbackMsgId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: fallbackMsgId,
      timestamp: new Date(),
      sender: 'character',
      content: fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)],
      metadata: {
        emotionalTone: 'apologetic',
        confidence: 0.5,
        isFallback: true
      }
    };
  }

  /**
   * End conversation session
   */
  async endConversation(
    sessionId: string,
    reason?: 'user_ended' | 'timeout' | 'error'
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      logger.info('Ending conversation', { sessionId, reason });

      const result = await ChatQueries.endChatSession(sessionId);
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }

      // Generate session summary if enabled
      if (this.options.enableAutoSummary) {
        await this.generateSessionSummary(sessionId);
      }

      logger.info('Conversation ended successfully', { sessionId });
      return { success: true };

    } catch (error) {
      logger.error('Failed to end conversation', { error, sessionId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate session summary for analytics
   */
  private async generateSessionSummary(sessionId: string): Promise<void> {
    try {
      const historyResult = await ChatQueries.getConversationHistory(sessionId);
      if (!historyResult.success || !historyResult.data) return;

      const messages = historyResult.data.messages;
      const analysis = CharacterUtils.analyzeConversationHistory(messages);

      // Update session context with summary
      await ChatQueries.updateSessionContext(sessionId, {
        sessionSummary: {
          totalMessages: analysis.totalMessages,
          topicsDiscussed: analysis.topicsDiscussed,
          engagementLevel: analysis.engagementLevel,
          generatedAt: new Date()
        }
      });

      logger.info('Session summary generated', { sessionId, analysis });

    } catch (error) {
      logger.error('Failed to generate session summary', { error, sessionId });
    }
  }

  /**
   * Update session context
   */
  async updateContext(
    sessionId: string,
    contextUpdates: Partial<SessionContext>
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await ChatQueries.updateSessionContext(sessionId, contextUpdates);
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }

      return { success: true };

    } catch (error) {
      logger.error('Failed to update session context', { error, sessionId, contextUpdates });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get conversation history with pagination
   */
  async getConversationHistory(
    sessionId: string,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    messages?: ChatMessage[];
    total?: number;
    error?: string;
  }> {
    try {
      const result = await ChatQueries.getConversationHistory(sessionId, limit, offset);
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }

      return {
        success: true,
        messages: result.data?.messages || [],
        total: result.data?.total || 0
      };

    } catch (error) {
      logger.error('Failed to get conversation history', { error, sessionId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Clear personality engine cache (for memory management)
   */
  clearCache(): void {
    this.personalityEngines.clear();
    logger.info('Personality engine cache cleared');
  }

  /**
   * Get active sessions count
   */
  getActiveSessions(): number {
    return this.personalityEngines.size;
  }
}

/**
 * Singleton instance for global use
 */
let globalConversationManager: ConversationManager | null = null;

export function getConversationManager(options?: ConversationManagerOptions): ConversationManager {
  if (!globalConversationManager) {
    globalConversationManager = new ConversationManager(options);
  }
  return globalConversationManager;
}

/**
 * Export conversation manager
 */
export default ConversationManager;