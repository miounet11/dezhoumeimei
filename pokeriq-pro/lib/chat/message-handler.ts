/**
 * Message Handler
 * Handles message processing, validation, and formatting
 */

import { ChatMessage, SessionContext } from '@/lib/types/dezhoumama';
import { createLogger } from '@/lib/logger';

const logger = createLogger('message-handler');

export interface MessageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MessageProcessingOptions {
  maxLength?: number;
  allowedSenders?: ('user' | 'character' | 'system')[];
  enableProfanityFilter?: boolean;
  enableSpamDetection?: boolean;
}

/**
 * Message Handler Class
 */
export class MessageHandler {
  private options: MessageProcessingOptions;

  constructor(options: MessageProcessingOptions = {}) {
    this.options = {
      maxLength: 2000,
      allowedSenders: ['user', 'character', 'system'],
      enableProfanityFilter: true,
      enableSpamDetection: true,
      ...options
    };
  }

  /**
   * Validate message content and structure
   */
  validateMessage(message: Partial<ChatMessage>): MessageValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check required fields
      if (!message.content || message.content.trim().length === 0) {
        errors.push('Message content is required');
      }

      if (!message.sender) {
        errors.push('Message sender is required');
      } else if (!this.options.allowedSenders?.includes(message.sender)) {
        errors.push(`Invalid sender type: ${message.sender}`);
      }

      if (!message.timestamp) {
        warnings.push('Message timestamp is missing - will use current time');
      }

      // Check content length
      if (message.content && message.content.length > this.options.maxLength!) {
        errors.push(`Message too long (${message.content.length}/${this.options.maxLength} characters)`);
      }

      // Check for profanity if enabled
      if (this.options.enableProfanityFilter && message.content) {
        const hasProfanity = this.checkProfanity(message.content);
        if (hasProfanity) {
          warnings.push('Message contains potentially inappropriate content');
        }
      }

      // Check for spam patterns if enabled
      if (this.options.enableSpamDetection && message.content) {
        const isSpam = this.checkSpam(message.content);
        if (isSpam) {
          warnings.push('Message might be spam');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      logger.error('Error validating message', { error, message });
      return {
        isValid: false,
        errors: ['Message validation failed'],
        warnings: []
      };
    }
  }

  /**
   * Sanitize message content
   */
  sanitizeMessage(content: string): string {
    try {
      // Remove HTML tags
      let sanitized = content.replace(/<[^>]*>/g, '');
      
      // Remove excessive whitespace
      sanitized = sanitized.replace(/\s+/g, ' ').trim();
      
      // Remove null bytes and other control characters
      sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
      
      // Limit length
      if (sanitized.length > this.options.maxLength!) {
        sanitized = sanitized.substring(0, this.options.maxLength!) + '...';
      }

      return sanitized;

    } catch (error) {
      logger.error('Error sanitizing message', { error, content });
      return content.substring(0, 100); // Fallback to first 100 chars
    }
  }

  /**
   * Format message for display
   */
  formatMessage(message: ChatMessage): {
    content: string;
    timestamp: string;
    sender: string;
    metadata?: any;
  } {
    try {
      return {
        content: this.formatMessageContent(message.content, message.sender),
        timestamp: this.formatTimestamp(message.timestamp),
        sender: this.formatSenderName(message.sender),
        metadata: this.formatMetadata(message.metadata)
      };

    } catch (error) {
      logger.error('Error formatting message', { error, message });
      return {
        content: message.content || '',
        timestamp: message.timestamp?.toISOString() || '',
        sender: message.sender || 'unknown'
      };
    }
  }

  /**
   * Create message object with validation
   */
  createMessage(
    content: string,
    sender: 'user' | 'character' | 'system',
    metadata?: Record<string, any>
  ): ChatMessage | null {
    try {
      // Sanitize content
      const sanitizedContent = this.sanitizeMessage(content);

      // Create message object
      const message: ChatMessage = {
        id: this.generateMessageId(sender),
        timestamp: new Date(),
        sender,
        content: sanitizedContent,
        metadata
      };

      // Validate message
      const validation = this.validateMessage(message);
      if (!validation.isValid) {
        logger.warn('Message validation failed', { errors: validation.errors, message });
        return null;
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        logger.warn('Message validation warnings', { warnings: validation.warnings });
      }

      return message;

    } catch (error) {
      logger.error('Error creating message', { error, content, sender });
      return null;
    }
  }

  /**
   * Extract message context for AI processing
   */
  extractMessageContext(
    message: ChatMessage,
    previousMessages: ChatMessage[],
    sessionContext: SessionContext
  ): {
    intent: string;
    topics: string[];
    sentiment: string;
    complexity: number;
    references: string[];
  } {
    try {
      const content = message.content.toLowerCase();

      // Determine intent
      const intent = this.determineIntent(content);

      // Extract topics
      const topics = this.extractTopics(content);

      // Analyze sentiment
      const sentiment = this.analyzeSentiment(content);

      // Calculate complexity
      const complexity = this.calculateComplexity(content);

      // Find references to previous messages
      const references = this.findReferences(message, previousMessages);

      return {
        intent,
        topics,
        sentiment,
        complexity,
        references
      };

    } catch (error) {
      logger.error('Error extracting message context', { error, message });
      return {
        intent: 'unknown',
        topics: [],
        sentiment: 'neutral',
        complexity: 0.5,
        references: []
      };
    }
  }

  /**
   * Check for profanity (simplified)
   */
  private checkProfanity(content: string): boolean {
    const profanityWords = [
      // Add basic profanity words here
      'spam', 'scam', 'fake'  // Basic examples
    ];

    const contentLower = content.toLowerCase();
    return profanityWords.some(word => contentLower.includes(word));
  }

  /**
   * Check for spam patterns
   */
  private checkSpam(content: string): boolean {
    // Check for repeated characters
    if (/(.)\1{4,}/.test(content)) return true;

    // Check for excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7) return true;

    // Check for excessive punctuation
    const punctRatio = (content.match(/[!?]{3,}/g) || []).length;
    if (punctRatio > 2) return true;

    return false;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(sender: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${sender}_${timestamp}_${random}`;
  }

  /**
   * Format message content based on sender
   */
  private formatMessageContent(content: string, sender: string): string {
    if (sender === 'system') {
      return `ℹ️ ${content}`;
    }
    return content;
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return timestamp.toLocaleDateString();
  }

  /**
   * Format sender name for display
   */
  private formatSenderName(sender: string): string {
    switch (sender) {
      case 'user': return 'You';
      case 'character': return 'AI Coach';
      case 'system': return 'System';
      default: return sender;
    }
  }

  /**
   * Format metadata for display
   */
  private formatMetadata(metadata?: Record<string, any>): any {
    if (!metadata) return undefined;

    const formatted: any = {};

    if (metadata.emotionalTone) {
      formatted.tone = metadata.emotionalTone;
    }

    if (metadata.confidence) {
      formatted.confidence = Math.round(metadata.confidence * 100);
    }

    if (metadata.processingTime) {
      formatted.responseTime = `${metadata.processingTime}ms`;
    }

    if (metadata.suggestedFollowups) {
      formatted.suggestions = metadata.suggestedFollowups;
    }

    return Object.keys(formatted).length > 0 ? formatted : undefined;
  }

  /**
   * Determine message intent
   */
  private determineIntent(content: string): string {
    if (content.includes('?') || content.startsWith('how') || content.startsWith('what') || content.startsWith('why')) {
      return 'question';
    }
    if (content.includes('hello') || content.includes('hi') || content.includes('hey')) {
      return 'greeting';
    }
    if (content.includes('analyze') || content.includes('review')) {
      return 'analysis_request';
    }
    if (content.includes('help') || content.includes('confused')) {
      return 'help_request';
    }
    if (content.includes('thanks') || content.includes('bye')) {
      return 'farewell';
    }
    return 'statement';
  }

  /**
   * Extract poker-related topics
   */
  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    const pokerTerms = [
      'preflop', 'postflop', 'flop', 'turn', 'river',
      'betting', 'raising', 'calling', 'folding',
      'position', 'ranges', 'gto', 'bluffing',
      'pot odds', 'implied odds', 'value betting',
      'tournament', 'cash game', 'heads up'
    ];

    pokerTerms.forEach(term => {
      if (content.includes(term)) {
        topics.push(term);
      }
    });

    return topics;
  }

  /**
   * Analyze message sentiment
   */
  private analyzeSentiment(content: string): string {
    const positiveWords = ['good', 'great', 'excellent', 'thanks', 'helpful', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'confused', 'difficult', 'frustrated', 'hard'];

    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate message complexity
   */
  private calculateComplexity(content: string): number {
    let complexity = 0;

    // Length factor
    complexity += Math.min(content.length / 200, 0.3);

    // Sentence structure factor
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    complexity += Math.min(sentences.length / 10, 0.3);

    // Technical terms factor
    const technicalTerms = ['gto', 'ev', 'variance', 'standard deviation', 'nash equilibrium'];
    const techCount = technicalTerms.filter(term => content.toLowerCase().includes(term)).length;
    complexity += Math.min(techCount / 3, 0.4);

    return Math.min(complexity, 1);
  }

  /**
   * Find references to previous messages
   */
  private findReferences(
    currentMessage: ChatMessage, 
    previousMessages: ChatMessage[]
  ): string[] {
    const references: string[] = [];
    const content = currentMessage.content.toLowerCase();

    // Look for referential words
    const referenceWords = ['that', 'this', 'it', 'what you said', 'your answer', 'like you mentioned'];
    
    if (referenceWords.some(word => content.includes(word))) {
      // Find the most recent relevant message
      for (let i = previousMessages.length - 1; i >= 0; i--) {
        const msg = previousMessages[i];
        if (msg.sender === 'character' && msg.id !== currentMessage.id) {
          references.push(msg.id);
          break;
        }
      }
    }

    return references;
  }
}

/**
 * Global message handler instance
 */
let globalMessageHandler: MessageHandler | null = null;

export function getMessageHandler(options?: MessageProcessingOptions): MessageHandler {
  if (!globalMessageHandler) {
    globalMessageHandler = new MessageHandler(options);
  }
  return globalMessageHandler;
}

/**
 * Utility functions
 */
export function createUserMessage(content: string, metadata?: Record<string, any>): ChatMessage | null {
  return getMessageHandler().createMessage(content, 'user', metadata);
}

export function createCharacterMessage(content: string, metadata?: Record<string, any>): ChatMessage | null {
  return getMessageHandler().createMessage(content, 'character', metadata);
}

export function createSystemMessage(content: string, metadata?: Record<string, any>): ChatMessage | null {
  return getMessageHandler().createMessage(content, 'system', metadata);
}

export default MessageHandler;