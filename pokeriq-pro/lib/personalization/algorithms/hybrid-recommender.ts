/**
 * Hybrid Recommendation Engine
 * Combines collaborative filtering and content-based filtering
 * Provides context-aware recommendations with real-time adaptation
 */

import { CollaborativeFilteringEngine, CollaborativeFilteringRecommendation, UserRating } from './collaborative-filtering';
import { ContentBasedEngine, ContentBasedRecommendation, ItemFeatures, UserProfile, UserInteraction } from './content-based';

export interface HybridRecommendation {
  itemId: string;
  score: number;
  confidence: number;
  explanation: string;
  algorithmContributions: AlgorithmContribution[];
  contextFactors: ContextFactor[];
  diversityScore: number;
  noveltyScore: number;
}

export interface AlgorithmContribution {
  algorithm: 'collaborative' | 'content-based' | 'context' | 'popularity';
  score: number;
  weight: number;
  confidence: number;
  explanation: string;
}

export interface ContextFactor {
  factor: string;
  value: any;
  impact: number;
  description: string;
}

export interface RecommendationContext {
  userId: string;
  sessionType?: 'practice' | 'learning' | 'assessment' | 'free-play';
  timeOfDay?: string; // 'morning' | 'afternoon' | 'evening' | 'night'
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  sessionDuration?: number; // Available time in minutes
  currentSkillFocus?: string[]; // What skills user wants to work on
  currentMood?: 'motivated' | 'tired' | 'focused' | 'exploratory';
  socialContext?: 'solo' | 'group' | 'competitive';
  previousSession?: {
    performance: number;
    satisfaction: number;
    difficulty: number;
  };
  urgentGoals?: string[]; // Immediate learning objectives
  excludeCategories?: string[];
  maxDifficulty?: number;
  minDifficulty?: number;
  preferredFormats?: string[];
}

export interface HybridConfiguration {
  collaborativeWeight: number;
  contentBasedWeight: number;
  contextWeight: number;
  diversityFactor: number;
  noveltyFactor: number;
  adaptationRate: number; // How quickly to adapt weights based on feedback
  minConfidenceThreshold: number;
  maxRecommendations: number;
}

export interface FeedbackData {
  userId: string;
  itemId: string;
  interaction: UserInteraction;
  context: RecommendationContext;
  satisfactionScore?: number; // 1-5
  actualEngagement: number; // Time spent / expected time
}

/**
 * Advanced Hybrid Recommendation Engine
 */
export class HybridRecommendationEngine {
  private collaborativeEngine: CollaborativeFilteringEngine;
  private contentBasedEngine: ContentBasedEngine;
  private userConfigurations: Map<string, HybridConfiguration> = new Map();
  private contextualFactors: Map<string, number> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private adaptationHistory: Map<string, AdaptationRecord[]> = new Map();
  
  private readonly DEFAULT_CONFIG: HybridConfiguration = {
    collaborativeWeight: 0.4,
    contentBasedWeight: 0.4,
    contextWeight: 0.2,
    diversityFactor: 0.3,
    noveltyFactor: 0.2,
    adaptationRate: 0.1,
    minConfidenceThreshold: 0.3,
    maxRecommendations: 20
  };
  
  // Context impact weights for different factors
  private readonly CONTEXT_WEIGHTS = {
    sessionType: 0.3,
    timeOfDay: 0.15,
    deviceType: 0.1,
    sessionDuration: 0.25,
    currentMood: 0.2
  };

  constructor(
    collaborativeEngine?: CollaborativeFilteringEngine,
    contentBasedEngine?: ContentBasedEngine
  ) {
    this.collaborativeEngine = collaborativeEngine || new CollaborativeFilteringEngine();
    this.contentBasedEngine = contentBasedEngine || new ContentBasedEngine();
  }

  /**
   * Get hybrid recommendations for a user with context awareness
   */
  async getRecommendations(
    context: RecommendationContext,
    count: number = 10
  ): Promise<HybridRecommendation[]> {
    
    const config = this.getUserConfiguration(context.userId);
    const excludeItems = await this.getExcludedItems(context);
    
    // Get recommendations from each algorithm
    const [collaborativeRecs, contentBasedRecs] = await Promise.all([
      this.getCollaborativeRecommendations(context, excludeItems),
      this.getContentBasedRecommendations(context, excludeItems)
    ]);
    
    // Apply contextual adjustments
    const contextAdjustedRecs = await this.applyContextualAdjustments(
      collaborativeRecs,
      contentBasedRecs,
      context
    );
    
    // Combine recommendations using hybrid approach
    const hybridRecs = await this.combineRecommendations(
      contextAdjustedRecs.collaborative,
      contextAdjustedRecs.contentBased,
      context,
      config
    );
    
    // Apply diversity and novelty filters
    const diverseRecs = this.applyDiversityFilter(hybridRecs, config.diversityFactor);
    const finalRecs = this.applyNoveltyFilter(diverseRecs, context, config.noveltyFactor);
    
    // Sort and limit results
    const sortedRecs = finalRecs
      .filter(rec => rec.confidence >= config.minConfidenceThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
    
    // Update adaptation history
    await this.recordRecommendationGeneration(context, sortedRecs, config);
    
    return sortedRecs;
  }

  /**
   * Process user feedback to improve recommendations
   */
  async processFeedback(feedback: FeedbackData[]): Promise<void> {
    for (const fb of feedback) {
      // Update individual algorithm models
      await this.updateAlgorithmModels(fb);
      
      // Adapt hybrid configuration
      await this.adaptConfiguration(fb);
      
      // Update contextual factor weights
      this.updateContextualFactors(fb);
      
      // Record performance metrics
      this.updatePerformanceMetrics(fb);
    }
  }

  /**
   * Real-time adaptation of recommendation weights
   */
  async adaptRecommendations(
    userId: string,
    recentFeedback: FeedbackData[],
    context: RecommendationContext
  ): Promise<void> {
    
    const config = this.getUserConfiguration(userId);
    const adaptationRate = config.adaptationRate;
    
    // Calculate algorithm performance
    const collabPerformance = this.calculateAlgorithmPerformance(recentFeedback, 'collaborative');
    const contentPerformance = this.calculateAlgorithmPerformance(recentFeedback, 'content-based');
    const contextPerformance = this.calculateContextualPerformance(recentFeedback);
    
    // Adapt weights based on performance
    const totalPerformance = collabPerformance + contentPerformance + contextPerformance;
    
    if (totalPerformance > 0) {
      config.collaborativeWeight = config.collaborativeWeight * (1 - adaptationRate) + 
        (collabPerformance / totalPerformance) * adaptationRate;
      
      config.contentBasedWeight = config.contentBasedWeight * (1 - adaptationRate) + 
        (contentPerformance / totalPerformance) * adaptationRate;
      
      config.contextWeight = config.contextWeight * (1 - adaptationRate) + 
        (contextPerformance / totalPerformance) * adaptationRate;
      
      // Normalize weights
      this.normalizeConfiguration(config);
      this.userConfigurations.set(userId, config);
    }
    
    // Record adaptation
    this.recordAdaptation(userId, config, {
      collabPerformance,
      contentPerformance,
      contextPerformance,
      context
    });
  }

  /**
   * Get collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    context: RecommendationContext,
    excludeItems: string[]
  ): Promise<CollaborativeFilteringRecommendation[]> {
    
    try {
      return await this.collaborativeEngine.getRecommendations(
        context.userId,
        excludeItems,
        this.DEFAULT_CONFIG.maxRecommendations
      );
    } catch (error) {
      console.warn('Collaborative filtering failed:', error);
      return [];
    }
  }

  /**
   * Get content-based recommendations
   */
  private async getContentBasedRecommendations(
    context: RecommendationContext,
    excludeItems: string[]
  ): Promise<ContentBasedRecommendation[]> {
    
    try {
      return await this.contentBasedEngine.getRecommendations(
        context.userId,
        excludeItems,
        this.DEFAULT_CONFIG.maxRecommendations
      );
    } catch (error) {
      console.warn('Content-based filtering failed:', error);
      return [];
    }
  }

  /**
   * Apply contextual adjustments to recommendations
   */
  private async applyContextualAdjustments(
    collaborativeRecs: CollaborativeFilteringRecommendation[],
    contentBasedRecs: ContentBasedRecommendation[],
    context: RecommendationContext
  ): Promise<{
    collaborative: CollaborativeFilteringRecommendation[],
    contentBased: ContentBasedRecommendation[]
  }> {
    
    // Apply session type adjustments
    const sessionTypeAdjustments = this.getSessionTypeAdjustments(context.sessionType);
    
    // Apply time-of-day adjustments
    const timeAdjustments = this.getTimeOfDayAdjustments(context.timeOfDay);
    
    // Apply mood adjustments
    const moodAdjustments = this.getMoodAdjustments(context.currentMood);
    
    // Adjust collaborative recommendations
    const adjustedCollaborative = collaborativeRecs.map(rec => ({
      ...rec,
      predictedRating: rec.predictedRating * 
        (sessionTypeAdjustments[rec.itemId] || 1) *
        (timeAdjustments[rec.itemId] || 1) *
        (moodAdjustments[rec.itemId] || 1)
    }));
    
    // Adjust content-based recommendations
    const adjustedContentBased = contentBasedRecs.map(rec => ({
      ...rec,
      score: rec.score * 
        (sessionTypeAdjustments[rec.itemId] || 1) *
        (timeAdjustments[rec.itemId] || 1) *
        (moodAdjustments[rec.itemId] || 1)
    }));
    
    return {
      collaborative: adjustedCollaborative,
      contentBased: adjustedContentBased
    };
  }

  /**
   * Combine recommendations from different algorithms
   */
  private async combineRecommendations(
    collaborativeRecs: CollaborativeFilteringRecommendation[],
    contentBasedRecs: ContentBasedRecommendation[],
    context: RecommendationContext,
    config: HybridConfiguration
  ): Promise<HybridRecommendation[]> {
    
    const combinedMap = new Map<string, {
      collaborative?: CollaborativeFilteringRecommendation,
      contentBased?: ContentBasedRecommendation,
      contextFactors: ContextFactor[]
    }>();
    
    // Collect all items
    const allItemIds = new Set([
      ...collaborativeRecs.map(r => r.itemId),
      ...contentBasedRecs.map(r => r.itemId)
    ]);
    
    // Initialize combined map
    for (const itemId of allItemIds) {
      combinedMap.set(itemId, {
        contextFactors: this.calculateContextFactors(itemId, context)
      });
    }
    
    // Add collaborative recommendations
    for (const rec of collaborativeRecs) {
      const combined = combinedMap.get(rec.itemId)!;
      combined.collaborative = rec;
    }
    
    // Add content-based recommendations
    for (const rec of contentBasedRecs) {
      const combined = combinedMap.get(rec.itemId)!;
      combined.contentBased = rec;
    }
    
    // Generate hybrid recommendations
    const hybridRecs: HybridRecommendation[] = [];
    
    for (const [itemId, data] of combinedMap) {
      const hybridRec = await this.createHybridRecommendation(
        itemId,
        data,
        context,
        config
      );
      
      if (hybridRec) {
        hybridRecs.push(hybridRec);
      }
    }
    
    return hybridRecs;
  }

  /**
   * Create a hybrid recommendation from individual algorithm recommendations
   */
  private async createHybridRecommendation(
    itemId: string,
    data: {
      collaborative?: CollaborativeFilteringRecommendation,
      contentBased?: ContentBasedRecommendation,
      contextFactors: ContextFactor[]
    },
    context: RecommendationContext,
    config: HybridConfiguration
  ): Promise<HybridRecommendation | null> {
    
    const contributions: AlgorithmContribution[] = [];
    let totalScore = 0;
    let totalWeight = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    // Collaborative filtering contribution
    if (data.collaborative) {
      const collabScore = this.normalizeCollaborativeScore(data.collaborative.predictedRating);
      const weight = config.collaborativeWeight;
      
      contributions.push({
        algorithm: 'collaborative',
        score: collabScore,
        weight,
        confidence: data.collaborative.confidence,
        explanation: data.collaborative.explanation
      });
      
      totalScore += collabScore * weight;
      totalWeight += weight;
      totalConfidence += data.collaborative.confidence;
      confidenceCount++;
    }
    
    // Content-based contribution
    if (data.contentBased) {
      const contentScore = data.contentBased.score;
      const weight = config.contentBasedWeight;
      
      contributions.push({
        algorithm: 'content-based',
        score: contentScore,
        weight,
        confidence: data.contentBased.confidence,
        explanation: data.contentBased.explanation
      });
      
      totalScore += contentScore * weight;
      totalWeight += weight;
      totalConfidence += data.contentBased.confidence;
      confidenceCount++;
    }
    
    // Context contribution
    const contextScore = this.calculateContextualScore(data.contextFactors);
    if (contextScore > 0) {
      const weight = config.contextWeight;
      
      contributions.push({
        algorithm: 'context',
        score: contextScore,
        weight,
        confidence: 0.7, // Contextual confidence is generally high but not perfect
        explanation: 'Based on current context and situation'
      });
      
      totalScore += contextScore * weight;
      totalWeight += weight;
      totalConfidence += 0.7;
      confidenceCount++;
    }
    
    if (totalWeight === 0) return null;
    
    const finalScore = totalScore / totalWeight;
    const finalConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    
    // Calculate diversity and novelty scores
    const diversityScore = await this.calculateDiversityScore(itemId, context);
    const noveltyScore = await this.calculateNoveltyScore(itemId, context);
    
    // Generate explanation
    const explanation = this.generateHybridExplanation(contributions, data.contextFactors);
    
    return {
      itemId,
      score: finalScore,
      confidence: finalConfidence,
      explanation,
      algorithmContributions: contributions,
      contextFactors: data.contextFactors,
      diversityScore,
      noveltyScore
    };
  }

  /**
   * Apply diversity filter to recommendations
   */
  private applyDiversityFilter(
    recommendations: HybridRecommendation[],
    diversityFactor: number
  ): HybridRecommendation[] {
    
    if (diversityFactor <= 0) return recommendations;
    
    const selected: HybridRecommendation[] = [];
    const remaining = [...recommendations].sort((a, b) => b.score - a.score);
    
    while (remaining.length > 0 && selected.length < recommendations.length) {
      if (selected.length === 0) {
        // Always select the highest-scored item first
        selected.push(remaining.shift()!);
        continue;
      }
      
      // Find the item that maximizes score + diversity
      let bestIndex = 0;
      let bestCombinedScore = -Infinity;
      
      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const diversityBonus = candidate.diversityScore * diversityFactor;
        const combinedScore = candidate.score + diversityBonus;
        
        if (combinedScore > bestCombinedScore) {
          bestCombinedScore = combinedScore;
          bestIndex = i;
        }
      }
      
      selected.push(remaining.splice(bestIndex, 1)[0]);
    }
    
    return selected;
  }

  /**
   * Apply novelty filter to recommendations
   */
  private applyNoveltyFilter(
    recommendations: HybridRecommendation[],
    context: RecommendationContext,
    noveltyFactor: number
  ): HybridRecommendation[] {
    
    if (noveltyFactor <= 0) return recommendations;
    
    return recommendations.map(rec => ({
      ...rec,
      score: rec.score + (rec.noveltyScore * noveltyFactor)
    }));
  }

  /**
   * Calculate contextual factors for an item
   */
  private calculateContextFactors(itemId: string, context: RecommendationContext): ContextFactor[] {
    const factors: ContextFactor[] = [];
    
    // Session type factor
    if (context.sessionType) {
      const impact = this.getSessionTypeImpact(itemId, context.sessionType);
      factors.push({
        factor: 'sessionType',
        value: context.sessionType,
        impact,
        description: `${context.sessionType} session suitability`
      });
    }
    
    // Time of day factor
    if (context.timeOfDay) {
      const impact = this.getTimeOfDayImpact(itemId, context.timeOfDay);
      factors.push({
        factor: 'timeOfDay',
        value: context.timeOfDay,
        impact,
        description: `${context.timeOfDay} time suitability`
      });
    }
    
    // Device type factor
    if (context.deviceType) {
      const impact = this.getDeviceTypeImpact(itemId, context.deviceType);
      factors.push({
        factor: 'deviceType',
        value: context.deviceType,
        impact,
        description: `${context.deviceType} device optimization`
      });
    }
    
    // Session duration factor
    if (context.sessionDuration) {
      const impact = this.getSessionDurationImpact(itemId, context.sessionDuration);
      factors.push({
        factor: 'sessionDuration',
        value: context.sessionDuration,
        impact,
        description: `Time constraint compatibility`
      });
    }
    
    // Mood factor
    if (context.currentMood) {
      const impact = this.getMoodImpact(itemId, context.currentMood);
      factors.push({
        factor: 'currentMood',
        value: context.currentMood,
        impact,
        description: `${context.currentMood} mood alignment`
      });
    }
    
    return factors;
  }

  /**
   * Calculate contextual score from factors
   */
  private calculateContextualScore(factors: ContextFactor[]): number {
    if (factors.length === 0) return 0;
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const factor of factors) {
      const weight = this.CONTEXT_WEIGHTS[factor.factor as keyof typeof this.CONTEXT_WEIGHTS] || 0.1;
      weightedSum += factor.impact * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate diversity score for an item
   */
  private async calculateDiversityScore(itemId: string, context: RecommendationContext): Promise<number> {
    // This is a simplified implementation
    // In practice, you'd compare item features with recently recommended items
    
    // For now, return a random diversity score weighted by item characteristics
    const hash = this.simpleHash(itemId);
    return (hash % 100) / 100; // 0-1 diversity score
  }

  /**
   * Calculate novelty score for an item
   */
  private async calculateNoveltyScore(itemId: string, context: RecommendationContext): Promise<number> {
    // This is a simplified implementation
    // In practice, you'd check user's interaction history and item popularity
    
    // For now, return inverse popularity as novelty
    const hash = this.simpleHash(itemId + 'novelty');
    return 1 - (hash % 100) / 100; // Higher score for less popular items
  }

  /**
   * Generate explanation for hybrid recommendation
   */
  private generateHybridExplanation(
    contributions: AlgorithmContribution[],
    contextFactors: ContextFactor[]
  ): string {
    
    const sortedContributions = contributions
      .sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
      .slice(0, 2);
    
    const explanationParts: string[] = [];
    
    for (const contrib of sortedContributions) {
      if (contrib.score > 0.5) {
        explanationParts.push(contrib.explanation);
      }
    }
    
    // Add contextual explanation
    const significantFactors = contextFactors.filter(f => Math.abs(f.impact) > 0.3);
    if (significantFactors.length > 0) {
      const contextExplanation = significantFactors
        .map(f => f.description)
        .slice(0, 2)
        .join(' and ');
      explanationParts.push(`Also considering ${contextExplanation}`);
    }
    
    if (explanationParts.length === 0) {
      return 'Recommended based on your profile and preferences';
    } else if (explanationParts.length === 1) {
      return explanationParts[0];
    } else {
      return explanationParts.join('. ');
    }
  }

  /**
   * Helper methods for contextual adjustments
   */
  
  private getSessionTypeAdjustments(sessionType?: string): Record<string, number> {
    // This is a simplified implementation
    // In practice, you'd have a mapping of items to session type suitability
    return {};
  }
  
  private getTimeOfDayAdjustments(timeOfDay?: string): Record<string, number> {
    return {};
  }
  
  private getMoodAdjustments(mood?: string): Record<string, number> {
    return {};
  }
  
  private getSessionTypeImpact(itemId: string, sessionType: string): number {
    // Simplified: return random impact for demonstration
    const hash = this.simpleHash(itemId + sessionType);
    return ((hash % 200) - 100) / 100; // -1 to 1 impact
  }
  
  private getTimeOfDayImpact(itemId: string, timeOfDay: string): number {
    const hash = this.simpleHash(itemId + timeOfDay);
    return ((hash % 100)) / 100; // 0 to 1 impact
  }
  
  private getDeviceTypeImpact(itemId: string, deviceType: string): number {
    const hash = this.simpleHash(itemId + deviceType);
    return ((hash % 60) + 40) / 100; // 0.4 to 1 impact
  }
  
  private getSessionDurationImpact(itemId: string, duration: number): number {
    // Items should match available time
    const idealDuration = 30; // minutes
    const diff = Math.abs(duration - idealDuration);
    return Math.max(0, 1 - diff / 60); // Decrease impact as time difference increases
  }
  
  private getMoodImpact(itemId: string, mood: string): number {
    const hash = this.simpleHash(itemId + mood);
    return ((hash % 80) + 20) / 100; // 0.2 to 1 impact
  }

  /**
   * Utility methods
   */
  
  private getUserConfiguration(userId: string): HybridConfiguration {
    return this.userConfigurations.get(userId) || { ...this.DEFAULT_CONFIG };
  }
  
  private normalizeCollaborativeScore(rating: number): number {
    // Assuming collaborative ratings are 1-5, normalize to 0-1
    return Math.max(0, Math.min(1, (rating - 1) / 4));
  }
  
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  private normalizeConfiguration(config: HybridConfiguration): void {
    const total = config.collaborativeWeight + config.contentBasedWeight + config.contextWeight;
    if (total > 0) {
      config.collaborativeWeight /= total;
      config.contentBasedWeight /= total;
      config.contextWeight /= total;
    }
  }
  
  private async getExcludedItems(context: RecommendationContext): Promise<string[]> {
    const excluded: string[] = [];
    
    // Add items from excluded categories
    if (context.excludeCategories) {
      // In practice, you'd query items by category
      // For now, return empty array
    }
    
    return excluded;
  }

  /**
   * Performance tracking methods
   */
  
  private calculateAlgorithmPerformance(feedback: FeedbackData[], algorithm: string): number {
    const relevantFeedback = feedback.filter(fb => 
      fb.satisfactionScore !== undefined && fb.actualEngagement > 0
    );
    
    if (relevantFeedback.length === 0) return 0;
    
    const avgSatisfaction = relevantFeedback.reduce((sum, fb) => sum + (fb.satisfactionScore || 0), 0) / relevantFeedback.length;
    const avgEngagement = relevantFeedback.reduce((sum, fb) => sum + fb.actualEngagement, 0) / relevantFeedback.length;
    
    return (avgSatisfaction / 5) * 0.6 + Math.min(1, avgEngagement) * 0.4;
  }
  
  private calculateContextualPerformance(feedback: FeedbackData[]): number {
    // Simplified contextual performance calculation
    return this.calculateAlgorithmPerformance(feedback, 'context');
  }
  
  private async updateAlgorithmModels(feedback: FeedbackData): Promise<void> {
    // Convert feedback to UserRating for collaborative filtering
    if (feedback.satisfactionScore) {
      const rating: UserRating = {
        userId: feedback.userId,
        itemId: feedback.itemId,
        rating: feedback.satisfactionScore,
        timestamp: new Date(),
        implicit: false
      };
      
      await this.collaborativeEngine.addRating(rating);
    }
    
    // Update content-based model
    await this.contentBasedEngine.updateUserProfile(feedback.userId, [feedback.interaction]);
  }
  
  private async adaptConfiguration(feedback: FeedbackData): Promise<void> {
    // This would implement online learning to adapt configuration
    // For now, we just ensure the configuration exists
    if (!this.userConfigurations.has(feedback.userId)) {
      this.userConfigurations.set(feedback.userId, { ...this.DEFAULT_CONFIG });
    }
  }
  
  private updateContextualFactors(feedback: FeedbackData): void {
    // Update weights for contextual factors based on their predictive power
    const contextKey = `${feedback.context.sessionType || 'unknown'}_${feedback.context.timeOfDay || 'unknown'}`;
    
    const currentWeight = this.contextualFactors.get(contextKey) || 0.5;
    const performance = (feedback.satisfactionScore || 3) / 5;
    const newWeight = currentWeight * 0.9 + performance * 0.1;
    
    this.contextualFactors.set(contextKey, newWeight);
  }
  
  private updatePerformanceMetrics(feedback: FeedbackData): void {
    const userId = feedback.userId;
    let metrics = this.performanceMetrics.get(userId);
    
    if (!metrics) {
      metrics = {
        totalRecommendations: 0,
        acceptedRecommendations: 0,
        avgSatisfaction: 0,
        avgEngagement: 0,
        lastUpdated: new Date()
      };
    }
    
    metrics.totalRecommendations += 1;
    
    if (feedback.actualEngagement > 0.5) { // Consider engagement > 50% as acceptance
      metrics.acceptedRecommendations += 1;
    }
    
    if (feedback.satisfactionScore) {
      metrics.avgSatisfaction = (metrics.avgSatisfaction + feedback.satisfactionScore) / 2;
    }
    
    metrics.avgEngagement = (metrics.avgEngagement + feedback.actualEngagement) / 2;
    metrics.lastUpdated = new Date();
    
    this.performanceMetrics.set(userId, metrics);
  }
  
  private recordAdaptation(userId: string, config: HybridConfiguration, data: any): void {
    if (!this.adaptationHistory.has(userId)) {
      this.adaptationHistory.set(userId, []);
    }
    
    const history = this.adaptationHistory.get(userId)!;
    history.push({
      timestamp: new Date(),
      configuration: { ...config },
      performanceData: data
    });
    
    // Keep only recent adaptations
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }
  
  private async recordRecommendationGeneration(
    context: RecommendationContext,
    recommendations: HybridRecommendation[],
    config: HybridConfiguration
  ): Promise<void> {
    // In a real implementation, this would log to analytics system
    console.log(`Generated ${recommendations.length} recommendations for user ${context.userId}`);
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      totalUsers: this.userConfigurations.size,
      avgCollaborativeWeight: Array.from(this.userConfigurations.values())
        .reduce((sum, config) => sum + config.collaborativeWeight, 0) / this.userConfigurations.size || this.DEFAULT_CONFIG.collaborativeWeight,
      avgContentWeight: Array.from(this.userConfigurations.values())
        .reduce((sum, config) => sum + config.contentBasedWeight, 0) / this.userConfigurations.size || this.DEFAULT_CONFIG.contentBasedWeight,
      avgContextWeight: Array.from(this.userConfigurations.values())
        .reduce((sum, config) => sum + config.contextWeight, 0) / this.userConfigurations.size || this.DEFAULT_CONFIG.contextWeight,
      contextualFactorsCount: this.contextualFactors.size,
      performanceMetricsCount: this.performanceMetrics.size,
      collaborativeStats: this.collaborativeEngine.getModelStats(),
      contentBasedStats: this.contentBasedEngine.getStats()
    };
  }
}

// Supporting interfaces
interface PerformanceMetrics {
  totalRecommendations: number;
  acceptedRecommendations: number;
  avgSatisfaction: number;
  avgEngagement: number;
  lastUpdated: Date;
}

interface AdaptationRecord {
  timestamp: Date;
  configuration: HybridConfiguration;
  performanceData: any;
}

export default HybridRecommendationEngine;