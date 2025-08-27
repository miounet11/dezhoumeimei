/**
 * Content-Based Filtering Algorithm
 * Provides recommendations based on item features and user preferences
 * Includes feature extraction, skill-based matching, and learning style alignment
 */

export interface ItemFeatures {
  itemId: string;
  category: string;
  difficulty: number; // 1-5
  skillRequirements: Record<string, number>; // skill -> importance (0-1)
  learningStyles: Record<string, number>; // style -> suitability (0-1)
  tags: string[];
  concepts: string[];
  prerequisites: string[];
  estimatedTime: number; // minutes
  interactionType: 'video' | 'practice' | 'quiz' | 'simulation' | 'reading';
  vectorRepresentation?: number[]; // High-dimensional feature vector
}

export interface UserProfile {
  userId: string;
  skillLevels: Record<string, number>; // skill -> level (0-2000)
  learningPreferences: Record<string, number>; // style -> preference (0-1)
  topicInterests: Record<string, number>; // topic -> interest (0-1)
  difficultyPreference: number; // 1-5
  timePreference: number; // preferred session length in minutes
  completedItems: string[];
  interactionHistory: UserInteraction[];
  preferredFormats: Record<string, number>; // format -> preference (0-1)
}

export interface UserInteraction {
  itemId: string;
  interactionType: 'view' | 'complete' | 'like' | 'dislike' | 'bookmark' | 'skip';
  rating?: number; // 1-5
  timeSpent: number; // minutes
  timestamp: Date;
  completion: number; // 0-1
}

export interface ContentBasedRecommendation {
  itemId: string;
  score: number;
  confidence: number;
  explanation: string;
  matchReasons: MatchReason[];
  featureSimilarity: number;
}

export interface MatchReason {
  type: 'skill' | 'style' | 'difficulty' | 'topic' | 'format' | 'time';
  factor: string;
  score: number;
  weight: number;
  description: string;
}

export interface FeatureExtractionResult {
  features: Record<string, number>;
  confidence: number;
  extractedConcepts: string[];
}

/**
 * Advanced Content-Based Filtering Engine
 */
export class ContentBasedEngine {
  private itemFeatures: Map<string, ItemFeatures> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private conceptEmbeddings: Map<string, number[]> = new Map();
  private skillTaxonomy: Map<string, string[]> = new Map(); // skill -> related skills
  
  // Feature weights for different matching components
  private readonly FEATURE_WEIGHTS = {
    skill: 0.35,
    learningStyle: 0.20,
    difficulty: 0.15,
    topic: 0.15,
    format: 0.10,
    time: 0.05
  };
  
  // Poker-specific skill taxonomy
  private readonly POKER_SKILLS = {
    'preflop': ['position', 'ranges', 'raising', 'calling'],
    'postflop': ['betting', 'bluffing', 'value', 'pot-odds'],
    'psychology': ['tells', 'opponent-reading', 'emotional-control'],
    'mathematics': ['probability', 'equity', 'expected-value', 'variance'],
    'bankroll': ['risk-management', 'variance-control', 'game-selection'],
    'tournament': ['ICM', 'bubble-play', 'final-table']
  };

  constructor() {
    this.initializeSkillTaxonomy();
  }

  /**
   * Add item features to the system
   */
  addItemFeatures(features: ItemFeatures[]): void {
    for (const feature of features) {
      this.itemFeatures.set(feature.itemId, feature);
      
      // Extract and store vector representation if not provided
      if (!feature.vectorRepresentation) {
        feature.vectorRepresentation = this.generateItemVector(feature);
      }
    }
  }

  /**
   * Update or create user profile based on interactions
   */
  async updateUserProfile(userId: string, interactions: UserInteraction[]): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId) || this.createDefaultUserProfile(userId);
    
    // Update interaction history
    profile.interactionHistory.push(...interactions);
    
    // Extract user preferences from interactions
    await this.extractUserPreferences(profile, interactions);
    
    // Update skill levels based on performance
    this.updateSkillLevels(profile, interactions);
    
    // Update learning style preferences
    this.updateLearningPreferences(profile, interactions);
    
    // Update topic interests
    this.updateTopicInterests(profile, interactions);
    
    // Update format preferences
    this.updateFormatPreferences(profile, interactions);
    
    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Get content-based recommendations for a user
   */
  async getRecommendations(
    userId: string,
    excludeItems: string[] = [],
    count: number = 10
  ): Promise<ContentBasedRecommendation[]> {
    
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error(`User profile not found: ${userId}`);
    }
    
    const recommendations: ContentBasedRecommendation[] = [];
    const excludeSet = new Set([...excludeItems, ...profile.completedItems]);
    
    // Calculate similarity scores for all items
    for (const [itemId, itemFeatures] of this.itemFeatures) {
      if (excludeSet.has(itemId)) continue;
      
      const recommendation = await this.calculateItemScore(profile, itemFeatures);
      if (recommendation.score > 0.3) { // Only include meaningful matches
        recommendations.push(recommendation);
      }
    }
    
    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  /**
   * Calculate similarity between user profile and item features
   */
  private async calculateItemScore(
    profile: UserProfile,
    item: ItemFeatures
  ): Promise<ContentBasedRecommendation> {
    
    const matchReasons: MatchReason[] = [];
    let totalScore = 0;
    
    // 1. Skill-based matching
    const skillMatch = this.calculateSkillMatch(profile, item);
    matchReasons.push(...skillMatch.reasons);
    totalScore += skillMatch.score * this.FEATURE_WEIGHTS.skill;
    
    // 2. Learning style alignment
    const styleMatch = this.calculateLearningStyleMatch(profile, item);
    matchReasons.push(...styleMatch.reasons);
    totalScore += styleMatch.score * this.FEATURE_WEIGHTS.learningStyle;
    
    // 3. Difficulty matching
    const difficultyMatch = this.calculateDifficultyMatch(profile, item);
    matchReasons.push(difficultyMatch.reason);
    totalScore += difficultyMatch.score * this.FEATURE_WEIGHTS.difficulty;
    
    // 4. Topic interest matching
    const topicMatch = this.calculateTopicMatch(profile, item);
    matchReasons.push(...topicMatch.reasons);
    totalScore += topicMatch.score * this.FEATURE_WEIGHTS.topic;
    
    // 5. Format preference matching
    const formatMatch = this.calculateFormatMatch(profile, item);
    matchReasons.push(formatMatch.reason);
    totalScore += formatMatch.score * this.FEATURE_WEIGHTS.format;
    
    // 6. Time preference matching
    const timeMatch = this.calculateTimeMatch(profile, item);
    matchReasons.push(timeMatch.reason);
    totalScore += timeMatch.score * this.FEATURE_WEIGHTS.time;
    
    // Calculate feature similarity using vector representation
    const featureSimilarity = this.calculateFeatureSimilarity(profile, item);
    
    // Calculate confidence based on profile completeness
    const confidence = this.calculateConfidence(profile, matchReasons);
    
    // Generate explanation
    const explanation = this.generateExplanation(matchReasons, totalScore);
    
    return {
      itemId: item.itemId,
      score: totalScore,
      confidence,
      explanation,
      matchReasons,
      featureSimilarity
    };
  }

  /**
   * Calculate skill-based matching between user and item
   */
  private calculateSkillMatch(
    profile: UserProfile,
    item: ItemFeatures
  ): { score: number; reasons: MatchReason[] } {
    
    const reasons: MatchReason[] = [];
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [skill, importance] of Object.entries(item.skillRequirements)) {
      const userLevel = profile.skillLevels[skill] || 0;
      const normalizedUserLevel = userLevel / 2000; // Normalize to 0-1
      const targetLevel = item.difficulty / 5; // Item difficulty as skill requirement
      
      // Calculate skill readiness score
      let skillScore = 0;
      if (normalizedUserLevel >= targetLevel * 0.8) {
        // User is ready for this skill level
        skillScore = 0.9;
      } else if (normalizedUserLevel >= targetLevel * 0.6) {
        // User is somewhat ready
        skillScore = 0.7;
      } else if (normalizedUserLevel >= targetLevel * 0.4) {
        // Challenging but manageable
        skillScore = 0.5;
      } else {
        // Too challenging
        skillScore = 0.2;
      }
      
      // Apply importance weighting
      const weightedScore = skillScore * importance;
      totalScore += weightedScore;
      totalWeight += importance;
      
      reasons.push({
        type: 'skill',
        factor: skill,
        score: skillScore,
        weight: importance,
        description: `Your ${skill} level (${Math.round(userLevel)}) ${this.getSkillReadinessDescription(skillScore)}`
      });
    }
    
    const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0.5;
    
    return { score: averageScore, reasons };
  }

  /**
   * Calculate learning style alignment
   */
  private calculateLearningStyleMatch(
    profile: UserProfile,
    item: ItemFeatures
  ): { score: number; reasons: MatchReason[] } {
    
    const reasons: MatchReason[] = [];
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [style, suitability] of Object.entries(item.learningStyles)) {
      const userPreference = profile.learningPreferences[style] || 0.25;
      
      // Calculate style match score
      const styleScore = userPreference * suitability;
      totalScore += styleScore * suitability;
      totalWeight += suitability;
      
      reasons.push({
        type: 'style',
        factor: style,
        score: styleScore,
        weight: suitability,
        description: `Matches your ${style} learning preference (${Math.round(userPreference * 100)}%)`
      });
    }
    
    const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0.5;
    
    return { score: averageScore, reasons };
  }

  /**
   * Calculate difficulty matching
   */
  private calculateDifficultyMatch(
    profile: UserProfile,
    item: ItemFeatures
  ): { score: number; reason: MatchReason } {
    
    const userPreferred = profile.difficultyPreference;
    const itemDifficulty = item.difficulty;
    
    // Calculate difficulty match (prefer items close to user preference)
    const difficultyDiff = Math.abs(userPreferred - itemDifficulty);
    const maxDiff = 4; // Maximum difference on 1-5 scale
    const difficultyScore = Math.max(0, 1 - (difficultyDiff / maxDiff));
    
    let description = '';
    if (difficultyDiff <= 0.5) {
      description = 'Perfect difficulty match for your level';
    } else if (difficultyDiff <= 1) {
      description = 'Good difficulty match for your preferences';
    } else if (difficultyDiff <= 1.5) {
      description = 'Slightly different from your preferred difficulty';
    } else {
      description = 'Different difficulty level than preferred';
    }
    
    return {
      score: difficultyScore,
      reason: {
        type: 'difficulty',
        factor: 'difficulty_match',
        score: difficultyScore,
        weight: 1.0,
        description
      }
    };
  }

  /**
   * Calculate topic interest matching
   */
  private calculateTopicMatch(
    profile: UserProfile,
    item: ItemFeatures
  ): { score: number; reasons: MatchReason[] } {
    
    const reasons: MatchReason[] = [];
    let totalScore = 0;
    let matchCount = 0;
    
    // Check category interest
    const categoryInterest = profile.topicInterests[item.category] || 0.1;
    totalScore += categoryInterest;
    matchCount++;
    
    reasons.push({
      type: 'topic',
      factor: item.category,
      score: categoryInterest,
      weight: 1.0,
      description: `${Math.round(categoryInterest * 100)}% interest in ${item.category}`
    });
    
    // Check tag interests
    for (const tag of item.tags) {
      const tagInterest = profile.topicInterests[tag] || 0.1;
      totalScore += tagInterest * 0.5; // Tags have less weight
      matchCount += 0.5;
      
      if (tagInterest > 0.3) {
        reasons.push({
          type: 'topic',
          factor: tag,
          score: tagInterest,
          weight: 0.5,
          description: `${Math.round(tagInterest * 100)}% interest in ${tag}`
        });
      }
    }
    
    // Check concept interests
    for (const concept of item.concepts) {
      const conceptInterest = profile.topicInterests[concept] || 0.1;
      totalScore += conceptInterest * 0.3; // Concepts have even less weight
      matchCount += 0.3;
    }
    
    const averageScore = matchCount > 0 ? totalScore / matchCount : 0.1;
    
    return { score: averageScore, reasons };
  }

  /**
   * Calculate format preference matching
   */
  private calculateFormatMatch(
    profile: UserProfile,
    item: ItemFeatures
  ): { score: number; reason: MatchReason } {
    
    const formatPreference = profile.preferredFormats[item.interactionType] || 0.5;
    
    let description = '';
    if (formatPreference > 0.7) {
      description = `You prefer ${item.interactionType} format`;
    } else if (formatPreference > 0.5) {
      description = `Good match for ${item.interactionType} format`;
    } else if (formatPreference > 0.3) {
      description = `Moderate fit for ${item.interactionType} format`;
    } else {
      description = `${item.interactionType} format not your preference`;
    }
    
    return {
      score: formatPreference,
      reason: {
        type: 'format',
        factor: item.interactionType,
        score: formatPreference,
        weight: 1.0,
        description
      }
    };
  }

  /**
   * Calculate time preference matching
   */
  private calculateTimeMatch(
    profile: UserProfile,
    item: ItemFeatures
  ): { score: number; reason: MatchReason } {
    
    const userPreferred = profile.timePreference;
    const itemTime = item.estimatedTime;
    
    // Calculate time match (prefer items close to user's preferred session length)
    const timeDiff = Math.abs(userPreferred - itemTime);
    const maxDiff = Math.max(userPreferred, 60); // Use user preference or 60 min as max
    const timeScore = Math.max(0, 1 - (timeDiff / maxDiff));
    
    let description = '';
    if (timeDiff <= 5) {
      description = 'Perfect time match for your sessions';
    } else if (timeDiff <= 15) {
      description = 'Good time fit for your schedule';
    } else if (timeDiff <= 30) {
      description = 'Reasonable time commitment';
    } else {
      description = itemTime > userPreferred ? 'Longer than your typical session' : 'Shorter than your typical session';
    }
    
    return {
      score: timeScore,
      reason: {
        type: 'time',
        factor: 'time_match',
        score: timeScore,
        weight: 1.0,
        description
      }
    };
  }

  /**
   * Calculate feature similarity using vector representations
   */
  private calculateFeatureSimilarity(profile: UserProfile, item: ItemFeatures): number {
    // Create user vector from profile
    const userVector = this.generateUserVector(profile);
    const itemVector = item.vectorRepresentation || this.generateItemVector(item);
    
    // Calculate cosine similarity
    return this.cosineSimilarity(userVector, itemVector);
  }

  /**
   * Generate vector representation for an item
   */
  private generateItemVector(item: ItemFeatures): number[] {
    const vector: number[] = [];
    
    // Difficulty (normalized)
    vector.push(item.difficulty / 5);
    
    // Estimated time (normalized to 0-2 hours)
    vector.push(Math.min(1, item.estimatedTime / 120));
    
    // Skill requirements (fixed-size vector)
    const skillNames = Object.keys(this.POKER_SKILLS);
    for (const skill of skillNames) {
      vector.push(item.skillRequirements[skill] || 0);
    }
    
    // Learning styles (fixed-size vector)
    const styles = ['visual', 'practical', 'theoretical', 'social'];
    for (const style of styles) {
      vector.push(item.learningStyles[style] || 0);
    }
    
    // Category one-hot encoding (simplified)
    const categories = ['preflop', 'postflop', 'psychology', 'mathematics', 'bankroll', 'tournament'];
    for (const cat of categories) {
      vector.push(item.category === cat ? 1 : 0);
    }
    
    // Interaction type one-hot encoding
    const types = ['video', 'practice', 'quiz', 'simulation', 'reading'];
    for (const type of types) {
      vector.push(item.interactionType === type ? 1 : 0);
    }
    
    return vector;
  }

  /**
   * Generate vector representation for a user profile
   */
  private generateUserVector(profile: UserProfile): number[] {
    const vector: number[] = [];
    
    // Average difficulty preference (normalized)
    vector.push(profile.difficultyPreference / 5);
    
    // Time preference (normalized to 0-2 hours)
    vector.push(Math.min(1, profile.timePreference / 120));
    
    // Skill levels (normalized)
    const skillNames = Object.keys(this.POKER_SKILLS);
    for (const skill of skillNames) {
      const level = profile.skillLevels[skill] || 0;
      vector.push(level / 2000);
    }
    
    // Learning style preferences
    const styles = ['visual', 'practical', 'theoretical', 'social'];
    for (const style of styles) {
      vector.push(profile.learningPreferences[style] || 0.25);
    }
    
    // Topic interests (averaged by category)
    const categories = ['preflop', 'postflop', 'psychology', 'mathematics', 'bankroll', 'tournament'];
    for (const cat of categories) {
      vector.push(profile.topicInterests[cat] || 0.1);
    }
    
    // Format preferences
    const types = ['video', 'practice', 'quiz', 'simulation', 'reading'];
    for (const type of types) {
      vector.push(profile.preferredFormats[type] || 0.5);
    }
    
    return vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  /**
   * Calculate confidence based on profile completeness and match quality
   */
  private calculateConfidence(profile: UserProfile, matchReasons: MatchReason[]): number {
    // Base confidence on interaction history
    const interactionCount = profile.interactionHistory.length;
    const interactionConfidence = Math.min(1, interactionCount / 20);
    
    // Confidence based on skill data completeness
    const skillCount = Object.keys(profile.skillLevels).length;
    const skillConfidence = Math.min(1, skillCount / 6);
    
    // Confidence based on match reason quality
    const avgMatchScore = matchReasons.reduce((sum, r) => sum + r.score, 0) / matchReasons.length;
    const matchConfidence = avgMatchScore;
    
    // Combined confidence
    return (interactionConfidence * 0.4 + skillConfidence * 0.3 + matchConfidence * 0.3);
  }

  /**
   * Generate human-readable explanation for recommendation
   */
  private generateExplanation(matchReasons: MatchReason[], score: number): string {
    const topReasons = matchReasons
      .filter(r => r.score > 0.5)
      .sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
      .slice(0, 3);
    
    if (topReasons.length === 0) {
      return 'Recommended based on your general preferences';
    }
    
    const reasonTexts = topReasons.map(r => r.description);
    
    if (reasonTexts.length === 1) {
      return reasonTexts[0];
    } else if (reasonTexts.length === 2) {
      return `${reasonTexts[0]} and ${reasonTexts[1]}`;
    } else {
      return `${reasonTexts.slice(0, -1).join(', ')}, and ${reasonTexts[reasonTexts.length - 1]}`;
    }
  }

  /**
   * Extract user preferences from interaction history
   */
  private async extractUserPreferences(profile: UserProfile, newInteractions: UserInteraction[]): Promise<void> {
    for (const interaction of newInteractions) {
      const item = this.itemFeatures.get(interaction.itemId);
      if (!item) continue;
      
      // Update preferences based on positive interactions
      const preferenceWeight = this.calculateInteractionWeight(interaction);
      
      if (preferenceWeight > 0) {
        // Update topic interests
        profile.topicInterests[item.category] = (profile.topicInterests[item.category] || 0.1) + preferenceWeight * 0.1;
        
        for (const tag of item.tags) {
          profile.topicInterests[tag] = (profile.topicInterests[tag] || 0.1) + preferenceWeight * 0.05;
        }
        
        // Update difficulty preference (moving average)
        const currentPref = profile.difficultyPreference;
        profile.difficultyPreference = currentPref * 0.9 + item.difficulty * 0.1 * preferenceWeight;
        
        // Update time preference
        const currentTimePref = profile.timePreference;
        profile.timePreference = currentTimePref * 0.9 + item.estimatedTime * 0.1 * preferenceWeight;
      }
    }
    
    // Normalize topic interests to prevent unbounded growth
    this.normalizeTopicInterests(profile);
  }

  /**
   * Update skill levels based on performance data
   */
  private updateSkillLevels(profile: UserProfile, interactions: UserInteraction[]): void {
    for (const interaction of interactions) {
      const item = this.itemFeatures.get(interaction.itemId);
      if (!item || interaction.interactionType !== 'complete') continue;
      
      // Calculate skill gain based on completion and performance
      const baseGain = this.calculateSkillGain(interaction, item);
      
      for (const [skill, importance] of Object.entries(item.skillRequirements)) {
        const skillGain = baseGain * importance;
        profile.skillLevels[skill] = (profile.skillLevels[skill] || 0) + skillGain;
      }
    }
  }

  /**
   * Update learning style preferences based on interaction patterns
   */
  private updateLearningPreferences(profile: UserProfile, interactions: UserInteraction[]): void {
    const stylePerformance = new Map<string, { total: number; count: number }>();
    
    for (const interaction of interactions) {
      const item = this.itemFeatures.get(interaction.itemId);
      if (!item) continue;
      
      const performance = this.calculateInteractionPerformance(interaction);
      
      for (const [style, suitability] of Object.entries(item.learningStyles)) {
        if (!stylePerformance.has(style)) {
          stylePerformance.set(style, { total: 0, count: 0 });
        }
        
        const stats = stylePerformance.get(style)!;
        stats.total += performance * suitability;
        stats.count += suitability;
      }
    }
    
    // Update preferences based on performance
    for (const [style, stats] of stylePerformance) {
      if (stats.count > 0) {
        const avgPerformance = stats.total / stats.count;
        const currentPref = profile.learningPreferences[style] || 0.25;
        profile.learningPreferences[style] = currentPref * 0.8 + avgPerformance * 0.2;
      }
    }
    
    // Normalize preferences
    this.normalizeLearningPreferences(profile);
  }

  /**
   * Update topic interests based on interaction patterns
   */
  private updateTopicInterests(profile: UserProfile, interactions: UserInteraction[]): void {
    for (const interaction of interactions) {
      const item = this.itemFeatures.get(interaction.itemId);
      if (!item) continue;
      
      const interestWeight = this.calculateInteractionWeight(interaction);
      
      // Update category interest
      profile.topicInterests[item.category] = (profile.topicInterests[item.category] || 0.1) + interestWeight * 0.05;
      
      // Update tag interests
      for (const tag of item.tags) {
        profile.topicInterests[tag] = (profile.topicInterests[tag] || 0.1) + interestWeight * 0.02;
      }
    }
    
    this.normalizeTopicInterests(profile);
  }

  /**
   * Update format preferences based on usage patterns
   */
  private updateFormatPreferences(profile: UserProfile, interactions: UserInteraction[]): void {
    const formatPerformance = new Map<string, { total: number; count: number }>();
    
    for (const interaction of interactions) {
      const item = this.itemFeatures.get(interaction.itemId);
      if (!item) continue;
      
      const performance = this.calculateInteractionPerformance(interaction);
      
      if (!formatPerformance.has(item.interactionType)) {
        formatPerformance.set(item.interactionType, { total: 0, count: 0 });
      }
      
      const stats = formatPerformance.get(item.interactionType)!;
      stats.total += performance;
      stats.count += 1;
    }
    
    // Update preferences
    for (const [format, stats] of formatPerformance) {
      if (stats.count > 0) {
        const avgPerformance = stats.total / stats.count;
        const currentPref = profile.preferredFormats[format] || 0.5;
        profile.preferredFormats[format] = currentPref * 0.8 + avgPerformance * 0.2;
      }
    }
  }

  /**
   * Helper methods
   */

  private initializeSkillTaxonomy(): void {
    for (const [mainSkill, subSkills] of Object.entries(this.POKER_SKILLS)) {
      this.skillTaxonomy.set(mainSkill, subSkills);
    }
  }

  private createDefaultUserProfile(userId: string): UserProfile {
    return {
      userId,
      skillLevels: {},
      learningPreferences: {
        visual: 0.25,
        practical: 0.25,
        theoretical: 0.25,
        social: 0.25
      },
      topicInterests: {},
      difficultyPreference: 3,
      timePreference: 30,
      completedItems: [],
      interactionHistory: [],
      preferredFormats: {
        video: 0.5,
        practice: 0.5,
        quiz: 0.5,
        simulation: 0.5,
        reading: 0.5
      }
    };
  }

  private calculateInteractionWeight(interaction: UserInteraction): number {
    let weight = 0;
    
    switch (interaction.interactionType) {
      case 'complete':
        weight = interaction.completion * (interaction.rating || 3) / 5;
        break;
      case 'like':
        weight = 0.8;
        break;
      case 'bookmark':
        weight = 0.7;
        break;
      case 'view':
        weight = Math.min(0.5, interaction.timeSpent / 10); // Up to 0.5 for 10+ minutes
        break;
      case 'dislike':
        weight = -0.5;
        break;
      case 'skip':
        weight = -0.3;
        break;
    }
    
    return weight;
  }

  private calculateSkillGain(interaction: UserInteraction, item: ItemFeatures): number {
    const baseGain = 10; // Base points per completion
    const difficultyMultiplier = item.difficulty / 3; // Higher difficulty = more gain
    const completionMultiplier = interaction.completion;
    const performanceMultiplier = (interaction.rating || 3) / 3;
    
    return baseGain * difficultyMultiplier * completionMultiplier * performanceMultiplier;
  }

  private calculateInteractionPerformance(interaction: UserInteraction): number {
    switch (interaction.interactionType) {
      case 'complete':
        return interaction.completion * ((interaction.rating || 3) / 5);
      case 'like':
        return 0.8;
      case 'bookmark':
        return 0.7;
      case 'view':
        return Math.min(0.6, interaction.timeSpent / 20);
      case 'dislike':
        return 0.1;
      case 'skip':
        return 0.2;
      default:
        return 0.5;
    }
  }

  private getSkillReadinessDescription(score: number): string {
    if (score >= 0.8) return 'is well-suited for this content';
    if (score >= 0.6) return 'is ready for this challenge';
    if (score >= 0.4) return 'makes this appropriately challenging';
    return 'suggests this may be quite challenging';
  }

  private normalizeTopicInterests(profile: UserProfile): void {
    const interests = Object.values(profile.topicInterests);
    const maxInterest = Math.max(...interests);
    
    if (maxInterest > 1) {
      for (const topic in profile.topicInterests) {
        profile.topicInterests[topic] /= maxInterest;
      }
    }
  }

  private normalizeLearningPreferences(profile: UserProfile): void {
    const total = Object.values(profile.learningPreferences).reduce((sum, val) => sum + val, 0);
    
    if (total > 0) {
      for (const style in profile.learningPreferences) {
        profile.learningPreferences[style] /= total;
      }
    }
  }

  /**
   * Get feature extraction results for an item
   */
  extractFeatures(content: any): FeatureExtractionResult {
    // This is a simplified feature extraction
    // In a real implementation, this would use NLP to extract features from content
    
    const features: Record<string, number> = {};
    const extractedConcepts: string[] = [];
    
    // Extract basic features from content structure
    if (content.title) {
      // Analyze title for keywords
      for (const [skill, subSkills] of Object.entries(this.POKER_SKILLS)) {
        if (content.title.toLowerCase().includes(skill)) {
          features[skill] = 1.0;
          extractedConcepts.push(skill);
        }
        
        for (const subSkill of subSkills) {
          if (content.title.toLowerCase().includes(subSkill)) {
            features[subSkill] = 0.8;
            extractedConcepts.push(subSkill);
          }
        }
      }
    }
    
    // Calculate confidence based on how many features were extracted
    const confidence = Math.min(1, extractedConcepts.length / 3);
    
    return {
      features,
      confidence,
      extractedConcepts
    };
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      totalItems: this.itemFeatures.size,
      totalUsers: this.userProfiles.size,
      averageInteractionsPerUser: Array.from(this.userProfiles.values())
        .reduce((sum, profile) => sum + profile.interactionHistory.length, 0) / this.userProfiles.size,
      skillTaxonomySize: this.skillTaxonomy.size
    };
  }
}

export default ContentBasedEngine;