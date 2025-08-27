/**
 * Collaborative Filtering Algorithm
 * Provides user-user and item-item similarity matching with matrix factorization
 * for sparse data and cold start handling
 */

export interface UserRating {
  userId: string;
  itemId: string;
  rating: number;
  timestamp: Date;
  implicit?: boolean; // Whether rating is implicit (e.g., time spent) or explicit
}

export interface UserSimilarity {
  userId1: string;
  userId2: string;
  similarity: number;
  confidence: number;
}

export interface ItemSimilarity {
  itemId1: string;
  itemId2: string;
  similarity: number;
  confidence: number;
}

export interface CollaborativeFilteringRecommendation {
  itemId: string;
  predictedRating: number;
  confidence: number;
  explanation: string;
  algorithmUsed: 'user-based' | 'item-based' | 'matrix-factorization' | 'hybrid';
}

export interface MatrixFactorizationParams {
  factors: number; // Number of latent factors
  learningRate: number;
  regularization: number;
  iterations: number;
  minImprovement: number;
}

export interface ColdStartStrategy {
  strategy: 'popularity' | 'demographic' | 'content-similarity' | 'interview';
  fallbackItems: string[];
  confidence: number;
}

/**
 * Advanced Collaborative Filtering Engine
 */
export class CollaborativeFilteringEngine {
  private userItemMatrix: Map<string, Map<string, number>> = new Map();
  private itemUserMatrix: Map<string, Map<string, number>> = new Map();
  private userSimilarities: Map<string, UserSimilarity[]> = new Map();
  private itemSimilarities: Map<string, ItemSimilarity[]> = new Map();
  
  // Matrix factorization components
  private userFeatures: Map<string, number[]> = new Map();
  private itemFeatures: Map<string, number[]> = new Map();
  private globalMean = 0;
  private userBias: Map<string, number> = new Map();
  private itemBias: Map<string, number> = new Map();
  
  // Cold start data
  private popularItems: string[] = [];
  private demographicProfiles: Map<string, any> = new Map();
  
  private readonly defaultParams: MatrixFactorizationParams = {
    factors: 50,
    learningRate: 0.01,
    regularization: 0.1,
    iterations: 100,
    minImprovement: 0.001
  };

  constructor() {}

  /**
   * Train the collaborative filtering model with user ratings
   */
  async trainModel(ratings: UserRating[], params?: Partial<MatrixFactorizationParams>): Promise<void> {
    const finalParams = { ...this.defaultParams, ...params };
    
    console.log('Training collaborative filtering model...');
    
    // Build user-item and item-user matrices
    await this.buildRatingMatrices(ratings);
    
    // Calculate global statistics
    this.calculateGlobalStatistics(ratings);
    
    // Compute user-user similarities
    await this.computeUserSimilarities();
    
    // Compute item-item similarities
    await this.computeItemSimilarities();
    
    // Train matrix factorization
    await this.trainMatrixFactorization(ratings, finalParams);
    
    // Update popular items for cold start
    this.updatePopularItems(ratings);
    
    console.log('Collaborative filtering training complete');
  }

  /**
   * Get recommendations for a user using collaborative filtering
   */
  async getRecommendations(
    userId: string, 
    excludeItems: string[] = [], 
    count: number = 10
  ): Promise<CollaborativeFilteringRecommendation[]> {
    
    const recommendations: CollaborativeFilteringRecommendation[] = [];
    const candidateItems = this.getCandidateItems(userId, excludeItems);
    
    // Handle cold start users
    if (!this.userItemMatrix.has(userId) || this.userItemMatrix.get(userId)!.size < 3) {
      return this.handleColdStartUser(userId, candidateItems, count);
    }
    
    // Generate recommendations using multiple algorithms
    const userBasedRecs = await this.getUserBasedRecommendations(userId, candidateItems);
    const itemBasedRecs = await this.getItemBasedRecommendations(userId, candidateItems);
    const mfRecs = await this.getMatrixFactorizationRecommendations(userId, candidateItems);
    
    // Combine and rank recommendations
    const combinedRecs = this.combineRecommendations([userBasedRecs, itemBasedRecs, mfRecs]);
    
    return combinedRecs
      .sort((a, b) => b.predictedRating - a.predictedRating)
      .slice(0, count);
  }

  /**
   * Get similar users for a given user
   */
  getSimilarUsers(userId: string, count: number = 10): UserSimilarity[] {
    return this.userSimilarities.get(userId)?.slice(0, count) || [];
  }

  /**
   * Get similar items for a given item
   */
  getSimilarItems(itemId: string, count: number = 10): ItemSimilarity[] {
    return this.itemSimilarities.get(itemId)?.slice(0, count) || [];
  }

  /**
   * Predict rating for a specific user-item pair
   */
  async predictRating(userId: string, itemId: string): Promise<number> {
    // Use matrix factorization if available
    if (this.userFeatures.has(userId) && this.itemFeatures.has(itemId)) {
      return this.predictWithMatrixFactorization(userId, itemId);
    }
    
    // Fallback to user-based or item-based
    const userBasedPrediction = await this.predictUserBased(userId, itemId);
    const itemBasedPrediction = await this.predictItemBased(userId, itemId);
    
    if (userBasedPrediction !== null && itemBasedPrediction !== null) {
      return (userBasedPrediction + itemBasedPrediction) / 2;
    }
    
    return userBasedPrediction ?? itemBasedPrediction ?? this.globalMean;
  }

  /**
   * Add new rating and update model incrementally
   */
  async addRating(rating: UserRating): Promise<void> {
    // Update matrices
    if (!this.userItemMatrix.has(rating.userId)) {
      this.userItemMatrix.set(rating.userId, new Map());
    }
    if (!this.itemUserMatrix.has(rating.itemId)) {
      this.itemUserMatrix.set(rating.itemId, new Map());
    }
    
    this.userItemMatrix.get(rating.userId)!.set(rating.itemId, rating.rating);
    this.itemUserMatrix.get(rating.itemId)!.set(rating.userId, rating.rating);
    
    // Update similarities incrementally (simplified approach)
    await this.updateUserSimilarity(rating.userId);
    await this.updateItemSimilarity(rating.itemId);
  }

  /**
   * Build user-item and item-user rating matrices
   */
  private async buildRatingMatrices(ratings: UserRating[]): Promise<void> {
    this.userItemMatrix.clear();
    this.itemUserMatrix.clear();
    
    for (const rating of ratings) {
      if (!this.userItemMatrix.has(rating.userId)) {
        this.userItemMatrix.set(rating.userId, new Map());
      }
      if (!this.itemUserMatrix.has(rating.itemId)) {
        this.itemUserMatrix.set(rating.itemId, new Map());
      }
      
      this.userItemMatrix.get(rating.userId)!.set(rating.itemId, rating.rating);
      this.itemUserMatrix.get(rating.itemId)!.set(rating.userId, rating.rating);
    }
  }

  /**
   * Calculate global statistics from ratings
   */
  private calculateGlobalStatistics(ratings: UserRating[]): void {
    if (ratings.length === 0) return;
    
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    this.globalMean = sum / ratings.length;
    
    // Calculate user and item biases
    this.userBias.clear();
    this.itemBias.clear();
    
    const userRatingCounts = new Map<string, { sum: number; count: number }>();
    const itemRatingCounts = new Map<string, { sum: number; count: number }>();
    
    for (const rating of ratings) {
      // User bias calculation
      if (!userRatingCounts.has(rating.userId)) {
        userRatingCounts.set(rating.userId, { sum: 0, count: 0 });
      }
      const userStats = userRatingCounts.get(rating.userId)!;
      userStats.sum += rating.rating;
      userStats.count += 1;
      
      // Item bias calculation
      if (!itemRatingCounts.has(rating.itemId)) {
        itemRatingCounts.set(rating.itemId, { sum: 0, count: 0 });
      }
      const itemStats = itemRatingCounts.get(rating.itemId)!;
      itemStats.sum += rating.rating;
      itemStats.count += 1;
    }
    
    // Calculate biases
    for (const [userId, stats] of userRatingCounts) {
      this.userBias.set(userId, (stats.sum / stats.count) - this.globalMean);
    }
    
    for (const [itemId, stats] of itemRatingCounts) {
      this.itemBias.set(itemId, (stats.sum / stats.count) - this.globalMean);
    }
  }

  /**
   * Compute user-user similarities using cosine similarity
   */
  private async computeUserSimilarities(): Promise<void> {
    console.log('Computing user-user similarities...');
    
    this.userSimilarities.clear();
    const users = Array.from(this.userItemMatrix.keys());
    
    for (let i = 0; i < users.length; i++) {
      const userId1 = users[i];
      const similarities: UserSimilarity[] = [];
      
      for (let j = i + 1; j < users.length; j++) {
        const userId2 = users[j];
        const similarity = this.calculateUserSimilarity(userId1, userId2);
        
        if (similarity.similarity > 0.1) { // Only store meaningful similarities
          similarities.push(similarity);
        }
      }
      
      // Sort by similarity descending
      similarities.sort((a, b) => b.similarity - a.similarity);
      this.userSimilarities.set(userId1, similarities.slice(0, 50)); // Keep top 50
    }
  }

  /**
   * Calculate similarity between two users using adjusted cosine similarity
   */
  private calculateUserSimilarity(userId1: string, userId2: string): UserSimilarity {
    const user1Ratings = this.userItemMatrix.get(userId1)!;
    const user2Ratings = this.userItemMatrix.get(userId2)!;
    
    // Find common items
    const commonItems: string[] = [];
    for (const itemId of user1Ratings.keys()) {
      if (user2Ratings.has(itemId)) {
        commonItems.push(itemId);
      }
    }
    
    if (commonItems.length < 2) {
      return { userId1, userId2, similarity: 0, confidence: 0 };
    }
    
    // Calculate user means
    const user1Mean = Array.from(user1Ratings.values()).reduce((a, b) => a + b, 0) / user1Ratings.size;
    const user2Mean = Array.from(user2Ratings.values()).reduce((a, b) => a + b, 0) / user2Ratings.size;
    
    // Calculate adjusted cosine similarity
    let numerator = 0;
    let user1SquareSum = 0;
    let user2SquareSum = 0;
    
    for (const itemId of commonItems) {
      const user1Rating = user1Ratings.get(itemId)! - user1Mean;
      const user2Rating = user2Ratings.get(itemId)! - user2Mean;
      
      numerator += user1Rating * user2Rating;
      user1SquareSum += user1Rating * user1Rating;
      user2SquareSum += user2Rating * user2Rating;
    }
    
    const denominator = Math.sqrt(user1SquareSum) * Math.sqrt(user2SquareSum);
    const similarity = denominator > 0 ? numerator / denominator : 0;
    
    // Confidence based on number of common items
    const confidence = Math.min(1, commonItems.length / 10);
    
    return { userId1, userId2, similarity, confidence };
  }

  /**
   * Compute item-item similarities
   */
  private async computeItemSimilarities(): Promise<void> {
    console.log('Computing item-item similarities...');
    
    this.itemSimilarities.clear();
    const items = Array.from(this.itemUserMatrix.keys());
    
    for (let i = 0; i < items.length; i++) {
      const itemId1 = items[i];
      const similarities: ItemSimilarity[] = [];
      
      for (let j = i + 1; j < items.length; j++) {
        const itemId2 = items[j];
        const similarity = this.calculateItemSimilarity(itemId1, itemId2);
        
        if (similarity.similarity > 0.1) {
          similarities.push(similarity);
        }
      }
      
      similarities.sort((a, b) => b.similarity - a.similarity);
      this.itemSimilarities.set(itemId1, similarities.slice(0, 50));
    }
  }

  /**
   * Calculate similarity between two items using adjusted cosine similarity
   */
  private calculateItemSimilarity(itemId1: string, itemId2: string): ItemSimilarity {
    const item1Ratings = this.itemUserMatrix.get(itemId1)!;
    const item2Ratings = this.itemUserMatrix.get(itemId2)!;
    
    // Find common users
    const commonUsers: string[] = [];
    for (const userId of item1Ratings.keys()) {
      if (item2Ratings.has(userId)) {
        commonUsers.push(userId);
      }
    }
    
    if (commonUsers.length < 2) {
      return { itemId1, itemId2, similarity: 0, confidence: 0 };
    }
    
    // Calculate adjusted cosine similarity
    let numerator = 0;
    let item1SquareSum = 0;
    let item2SquareSum = 0;
    
    for (const userId of commonUsers) {
      const userMean = this.userBias.get(userId) || 0;
      const item1Rating = item1Ratings.get(userId)! - userMean;
      const item2Rating = item2Ratings.get(userId)! - userMean;
      
      numerator += item1Rating * item2Rating;
      item1SquareSum += item1Rating * item1Rating;
      item2SquareSum += item2Rating * item2Rating;
    }
    
    const denominator = Math.sqrt(item1SquareSum) * Math.sqrt(item2SquareSum);
    const similarity = denominator > 0 ? numerator / denominator : 0;
    
    const confidence = Math.min(1, commonUsers.length / 10);
    
    return { itemId1, itemId2, similarity, confidence };
  }

  /**
   * Train matrix factorization model using SGD
   */
  private async trainMatrixFactorization(
    ratings: UserRating[], 
    params: MatrixFactorizationParams
  ): Promise<void> {
    console.log('Training matrix factorization...');
    
    // Initialize feature matrices
    this.initializeFeatures(params.factors);
    
    let prevRmse = Infinity;
    
    for (let iter = 0; iter < params.iterations; iter++) {
      // Shuffle ratings for SGD
      const shuffledRatings = [...ratings].sort(() => Math.random() - 0.5);
      
      for (const rating of shuffledRatings) {
        this.sgdUpdate(rating, params);
      }
      
      // Calculate RMSE every 10 iterations
      if (iter % 10 === 0) {
        const rmse = this.calculateRMSE(ratings);
        
        if (prevRmse - rmse < params.minImprovement) {
          console.log(`Converged at iteration ${iter}, RMSE: ${rmse.toFixed(4)}`);
          break;
        }
        
        prevRmse = rmse;
      }
    }
  }

  /**
   * Initialize user and item feature matrices randomly
   */
  private initializeFeatures(factors: number): void {
    this.userFeatures.clear();
    this.itemFeatures.clear();
    
    for (const userId of this.userItemMatrix.keys()) {
      const features = Array.from({ length: factors }, () => Math.random() * 0.1);
      this.userFeatures.set(userId, features);
    }
    
    for (const itemId of this.itemUserMatrix.keys()) {
      const features = Array.from({ length: factors }, () => Math.random() * 0.1);
      this.itemFeatures.set(itemId, features);
    }
  }

  /**
   * Perform single SGD update
   */
  private sgdUpdate(rating: UserRating, params: MatrixFactorizationParams): void {
    const userFeatures = this.userFeatures.get(rating.userId);
    const itemFeatures = this.itemFeatures.get(rating.itemId);
    
    if (!userFeatures || !itemFeatures) return;
    
    const predicted = this.predictWithFeatures(userFeatures, itemFeatures, rating.userId, rating.itemId);
    const error = rating.rating - predicted;
    
    // Update biases
    const userBias = this.userBias.get(rating.userId) || 0;
    const itemBias = this.itemBias.get(rating.itemId) || 0;
    
    this.userBias.set(rating.userId, userBias + params.learningRate * (error - params.regularization * userBias));
    this.itemBias.set(rating.itemId, itemBias + params.learningRate * (error - params.regularization * itemBias));
    
    // Update feature vectors
    for (let f = 0; f < userFeatures.length; f++) {
      const userFeat = userFeatures[f];
      const itemFeat = itemFeatures[f];
      
      userFeatures[f] += params.learningRate * (error * itemFeat - params.regularization * userFeat);
      itemFeatures[f] += params.learningRate * (error * userFeat - params.regularization * itemFeat);
    }
  }

  /**
   * Calculate RMSE for validation
   */
  private calculateRMSE(ratings: UserRating[]): number {
    let squaredErrors = 0;
    let count = 0;
    
    for (const rating of ratings) {
      const predicted = this.predictWithMatrixFactorization(rating.userId, rating.itemId);
      const error = rating.rating - predicted;
      squaredErrors += error * error;
      count++;
    }
    
    return Math.sqrt(squaredErrors / count);
  }

  /**
   * Predict rating using matrix factorization
   */
  private predictWithMatrixFactorization(userId: string, itemId: string): number {
    const userFeatures = this.userFeatures.get(userId);
    const itemFeatures = this.itemFeatures.get(itemId);
    
    if (!userFeatures || !itemFeatures) {
      return this.globalMean;
    }
    
    return this.predictWithFeatures(userFeatures, itemFeatures, userId, itemId);
  }

  /**
   * Predict rating with given feature vectors
   */
  private predictWithFeatures(
    userFeatures: number[], 
    itemFeatures: number[], 
    userId: string, 
    itemId: string
  ): number {
    let prediction = this.globalMean;
    prediction += this.userBias.get(userId) || 0;
    prediction += this.itemBias.get(itemId) || 0;
    
    for (let f = 0; f < userFeatures.length; f++) {
      prediction += userFeatures[f] * itemFeatures[f];
    }
    
    return Math.max(1, Math.min(5, prediction)); // Clamp to rating range
  }

  /**
   * Get candidate items for recommendation (items not rated by user)
   */
  private getCandidateItems(userId: string, excludeItems: string[]): string[] {
    const userRatings = this.userItemMatrix.get(userId);
    const ratedItems = new Set(userRatings?.keys() || []);
    const excludeSet = new Set(excludeItems);
    
    const candidates: string[] = [];
    for (const itemId of this.itemUserMatrix.keys()) {
      if (!ratedItems.has(itemId) && !excludeSet.has(itemId)) {
        candidates.push(itemId);
      }
    }
    
    return candidates;
  }

  /**
   * Handle cold start users with no or few ratings
   */
  private async handleColdStartUser(
    userId: string, 
    candidateItems: string[], 
    count: number
  ): Promise<CollaborativeFilteringRecommendation[]> {
    
    const recommendations: CollaborativeFilteringRecommendation[] = [];
    
    // Use popular items as fallback
    const popularCandidates = candidateItems.filter(item => this.popularItems.includes(item));
    
    for (let i = 0; i < Math.min(count, popularCandidates.length); i++) {
      const itemId = popularCandidates[i];
      recommendations.push({
        itemId,
        predictedRating: this.globalMean,
        confidence: 0.3,
        explanation: 'Popular item recommendation for new user',
        algorithmUsed: 'user-based' // fallback
      });
    }
    
    return recommendations;
  }

  /**
   * Get user-based recommendations
   */
  private async getUserBasedRecommendations(
    userId: string, 
    candidateItems: string[]
  ): Promise<CollaborativeFilteringRecommendation[]> {
    
    const recommendations: CollaborativeFilteringRecommendation[] = [];
    const similarUsers = this.userSimilarities.get(userId) || [];
    
    for (const itemId of candidateItems) {
      const prediction = await this.predictUserBased(userId, itemId);
      
      if (prediction !== null) {
        recommendations.push({
          itemId,
          predictedRating: prediction,
          confidence: similarUsers.length > 0 ? similarUsers[0].confidence : 0.1,
          explanation: `Based on users with similar preferences`,
          algorithmUsed: 'user-based'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Predict rating using user-based collaborative filtering
   */
  private async predictUserBased(userId: string, itemId: string): Promise<number | null> {
    const similarUsers = this.userSimilarities.get(userId) || [];
    
    let numerator = 0;
    let denominator = 0;
    
    for (const simUser of similarUsers.slice(0, 10)) { // Use top 10 similar users
      const otherUserId = simUser.userId1 === userId ? simUser.userId2 : simUser.userId1;
      const otherUserRatings = this.userItemMatrix.get(otherUserId);
      
      if (otherUserRatings?.has(itemId)) {
        const rating = otherUserRatings.get(itemId)!;
        const similarity = simUser.similarity;
        
        numerator += similarity * rating;
        denominator += Math.abs(similarity);
      }
    }
    
    if (denominator === 0) return null;
    
    return numerator / denominator;
  }

  /**
   * Get item-based recommendations
   */
  private async getItemBasedRecommendations(
    userId: string, 
    candidateItems: string[]
  ): Promise<CollaborativeFilteringRecommendation[]> {
    
    const recommendations: CollaborativeFilteringRecommendation[] = [];
    
    for (const itemId of candidateItems) {
      const prediction = await this.predictItemBased(userId, itemId);
      
      if (prediction !== null) {
        const similarItems = this.itemSimilarities.get(itemId) || [];
        
        recommendations.push({
          itemId,
          predictedRating: prediction,
          confidence: similarItems.length > 0 ? similarItems[0].confidence : 0.1,
          explanation: `Based on similar items you've interacted with`,
          algorithmUsed: 'item-based'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Predict rating using item-based collaborative filtering
   */
  private async predictItemBased(userId: string, itemId: string): Promise<number | null> {
    const userRatings = this.userItemMatrix.get(userId);
    if (!userRatings) return null;
    
    const similarItems = this.itemSimilarities.get(itemId) || [];
    
    let numerator = 0;
    let denominator = 0;
    
    for (const simItem of similarItems.slice(0, 10)) { // Use top 10 similar items
      const otherItemId = simItem.itemId1 === itemId ? simItem.itemId2 : simItem.itemId1;
      
      if (userRatings.has(otherItemId)) {
        const rating = userRatings.get(otherItemId)!;
        const similarity = simItem.similarity;
        
        numerator += similarity * rating;
        denominator += Math.abs(similarity);
      }
    }
    
    if (denominator === 0) return null;
    
    return numerator / denominator;
  }

  /**
   * Get matrix factorization recommendations
   */
  private async getMatrixFactorizationRecommendations(
    userId: string, 
    candidateItems: string[]
  ): Promise<CollaborativeFilteringRecommendation[]> {
    
    const recommendations: CollaborativeFilteringRecommendation[] = [];
    
    if (!this.userFeatures.has(userId)) return recommendations;
    
    for (const itemId of candidateItems) {
      if (this.itemFeatures.has(itemId)) {
        const prediction = this.predictWithMatrixFactorization(userId, itemId);
        
        recommendations.push({
          itemId,
          predictedRating: prediction,
          confidence: 0.8, // Matrix factorization typically has high confidence
          explanation: `Based on latent factor analysis of your preferences`,
          algorithmUsed: 'matrix-factorization'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Combine recommendations from multiple algorithms
   */
  private combineRecommendations(
    recommendationSets: CollaborativeFilteringRecommendation[][]
  ): CollaborativeFilteringRecommendation[] {
    
    const combinedMap = new Map<string, CollaborativeFilteringRecommendation[]>();
    
    // Group recommendations by item
    for (const recSet of recommendationSets) {
      for (const rec of recSet) {
        if (!combinedMap.has(rec.itemId)) {
          combinedMap.set(rec.itemId, []);
        }
        combinedMap.get(rec.itemId)!.push(rec);
      }
    }
    
    // Combine scores for each item
    const finalRecommendations: CollaborativeFilteringRecommendation[] = [];
    
    for (const [itemId, recs] of combinedMap) {
      if (recs.length === 0) continue;
      
      // Weighted average of predictions
      let weightedScore = 0;
      let totalWeight = 0;
      let maxConfidence = 0;
      let bestExplanation = '';
      let algorithmUsed: CollaborativeFilteringRecommendation['algorithmUsed'] = 'hybrid';
      
      const weights = {
        'user-based': 0.3,
        'item-based': 0.3,
        'matrix-factorization': 0.4,
        'hybrid': 1.0
      };
      
      for (const rec of recs) {
        const weight = weights[rec.algorithmUsed] * rec.confidence;
        weightedScore += rec.predictedRating * weight;
        totalWeight += weight;
        
        if (rec.confidence > maxConfidence) {
          maxConfidence = rec.confidence;
          bestExplanation = rec.explanation;
          algorithmUsed = rec.algorithmUsed;
        }
      }
      
      if (totalWeight > 0) {
        finalRecommendations.push({
          itemId,
          predictedRating: weightedScore / totalWeight,
          confidence: maxConfidence,
          explanation: recs.length > 1 ? `Combined prediction from ${recs.length} algorithms` : bestExplanation,
          algorithmUsed: recs.length > 1 ? 'hybrid' : algorithmUsed
        });
      }
    }
    
    return finalRecommendations;
  }

  /**
   * Update popular items based on rating frequency and recency
   */
  private updatePopularItems(ratings: UserRating[]): void {
    const itemScores = new Map<string, { count: number; avgRating: number; recency: number }>();
    
    // Calculate item popularity scores
    for (const rating of ratings) {
      if (!itemScores.has(rating.itemId)) {
        itemScores.set(rating.itemId, { count: 0, avgRating: 0, recency: 0 });
      }
      
      const scores = itemScores.get(rating.itemId)!;
      scores.count += 1;
      scores.avgRating += rating.rating;
      
      // Recency score (more recent = higher score)
      const daysSinceRating = (Date.now() - rating.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      scores.recency += Math.exp(-daysSinceRating / 30); // Decay over 30 days
    }
    
    // Calculate final popularity scores
    const popularityScores = new Map<string, number>();
    
    for (const [itemId, scores] of itemScores) {
      const avgRating = scores.avgRating / scores.count;
      const popularity = scores.count * 0.4 + avgRating * 0.3 + scores.recency * 0.3;
      popularityScores.set(itemId, popularity);
    }
    
    // Sort by popularity
    this.popularItems = Array.from(popularityScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100) // Keep top 100
      .map(([itemId, _]) => itemId);
  }

  /**
   * Update user similarity incrementally
   */
  private async updateUserSimilarity(userId: string): Promise<void> {
    // Simplified incremental update - recalculate similarities for this user
    const similarities: UserSimilarity[] = [];
    
    for (const otherUserId of this.userItemMatrix.keys()) {
      if (otherUserId !== userId) {
        const similarity = this.calculateUserSimilarity(userId, otherUserId);
        if (similarity.similarity > 0.1) {
          similarities.push(similarity);
        }
      }
    }
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    this.userSimilarities.set(userId, similarities.slice(0, 50));
  }

  /**
   * Update item similarity incrementally
   */
  private async updateItemSimilarity(itemId: string): Promise<void> {
    // Simplified incremental update - recalculate similarities for this item
    const similarities: ItemSimilarity[] = [];
    
    for (const otherItemId of this.itemUserMatrix.keys()) {
      if (otherItemId !== itemId) {
        const similarity = this.calculateItemSimilarity(itemId, otherItemId);
        if (similarity.similarity > 0.1) {
          similarities.push(similarity);
        }
      }
    }
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    this.itemSimilarities.set(itemId, similarities.slice(0, 50));
  }

  /**
   * Get model statistics for monitoring
   */
  getModelStats() {
    return {
      totalUsers: this.userItemMatrix.size,
      totalItems: this.itemUserMatrix.size,
      totalSimilarities: Array.from(this.userSimilarities.values()).reduce((sum, sims) => sum + sims.length, 0),
      globalMean: this.globalMean,
      matrixFactorizationTrained: this.userFeatures.size > 0,
      popularItemsCount: this.popularItems.length
    };
  }
}

export default CollaborativeFilteringEngine;