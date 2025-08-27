/**
 * Feature Engineering Utilities
 * Provides data transformation, feature extraction, and engineering capabilities
 * for ML pipelines in the poker training system
 */

export interface FeatureVector {
  features: Record<string, number>;
  metadata: FeatureMetadata;
}

export interface FeatureMetadata {
  featureNames: string[];
  scalingInfo?: ScalingInfo;
  encodingInfo?: EncodingInfo;
  transformationHistory: string[];
  createdAt: Date;
}

export interface ScalingInfo {
  method: 'standard' | 'minmax' | 'robust' | 'quantile';
  parameters: Record<string, any>;
}

export interface EncodingInfo {
  categoricalFeatures: Record<string, string[]>; // feature -> possible values
  encodingMethods: Record<string, 'onehot' | 'label' | 'target' | 'binary'>;
}

export interface TimeSeriesFeatures {
  trend: number;
  seasonality: number;
  volatility: number;
  autocorrelation: number;
  recentAverage: number;
  movingAverage: number;
  exponentialSmoothing: number;
  changePoint: boolean;
  momentum: number;
}

export interface PokerFeatures {
  // Hand strength features
  handStrength: number;
  handRank: number;
  suitedness: number;
  connectedness: number;
  
  // Position features
  positionType: string;
  positionStrength: number;
  playersToAct: number;
  
  // Betting features
  potOdds: number;
  impliedOdds: number;
  expectedValue: number;
  betSizing: number;
  
  // Opponent features
  opponentAggression: number;
  opponentTightness: number;
  opponentSkill: number;
  opponentTendencies: Record<string, number>;
  
  // Game state features
  street: string;
  potSize: number;
  effectiveStackSize: number;
  numberOfPlayers: number;
}

/**
 * Advanced Feature Engineering Engine
 */
export class FeatureEngineer {
  private scalingParameters: Map<string, any> = new Map();
  private encodingMappings: Map<string, Map<string, number>> = new Map();
  private featureImportances: Map<string, number> = new Map();
  private transformationCache: Map<string, any> = new Map();
  
  constructor() {}

  /**
   * Extract comprehensive features from user interaction data
   */
  extractUserFeatures(
    userInteractions: any[],
    userProfile: any,
    sessionData: any[]
  ): FeatureVector {
    
    const features: Record<string, number> = {};
    
    // Basic user features
    Object.assign(features, this.extractBasicUserFeatures(userProfile));
    
    // Behavioral features
    Object.assign(features, this.extractBehavioralFeatures(userInteractions));
    
    // Session features
    Object.assign(features, this.extractSessionFeatures(sessionData));
    
    // Skill-based features
    Object.assign(features, this.extractSkillFeatures(userProfile.skillLevels || {}));
    
    // Engagement features
    Object.assign(features, this.extractEngagementFeatures(userInteractions));
    
    // Temporal features
    Object.assign(features, this.extractTemporalFeatures(userInteractions));
    
    const metadata: FeatureMetadata = {
      featureNames: Object.keys(features),
      transformationHistory: ['user_feature_extraction'],
      createdAt: new Date()
    };
    
    return { features, metadata };
  }

  /**
   * Extract poker-specific features from game data
   */
  extractPokerFeatures(
    gameState: any,
    playerActions: any[],
    handHistory: any[]
  ): PokerFeatures {
    
    return {
      // Hand strength
      handStrength: this.calculateHandStrength(gameState.playerHand, gameState.communityCards),
      handRank: this.getHandRank(gameState.playerHand),
      suitedness: this.calculateSuitedness(gameState.playerHand),
      connectedness: this.calculateConnectedness(gameState.playerHand),
      
      // Position
      positionType: this.getPositionType(gameState.position, gameState.tableSize),
      positionStrength: this.calculatePositionStrength(gameState.position, gameState.tableSize),
      playersToAct: gameState.playersToAct || 0,
      
      // Betting
      potOdds: this.calculatePotOdds(gameState.potSize, gameState.betToCall),
      impliedOdds: this.calculateImpliedOdds(gameState),
      expectedValue: this.calculateExpectedValue(gameState),
      betSizing: this.normalizeBetSize(gameState.betSize, gameState.potSize),
      
      // Opponents
      opponentAggression: this.calculateOpponentAggression(playerActions),
      opponentTightness: this.calculateOpponentTightness(playerActions),
      opponentSkill: this.estimateOpponentSkill(handHistory),
      opponentTendencies: this.extractOpponentTendencies(handHistory),
      
      // Game state
      street: gameState.street,
      potSize: gameState.potSize,
      effectiveStackSize: gameState.effectiveStackSize,
      numberOfPlayers: gameState.activePlayers
    };
  }

  /**
   * Extract time series features from sequential data
   */
  extractTimeSeriesFeatures(
    timeSeries: number[],
    window: number = 10
  ): TimeSeriesFeatures {
    
    if (timeSeries.length < 3) {
      // Return default features for insufficient data
      return {
        trend: 0,
        seasonality: 0,
        volatility: 0,
        autocorrelation: 0,
        recentAverage: timeSeries[timeSeries.length - 1] || 0,
        movingAverage: 0,
        exponentialSmoothing: 0,
        changePoint: false,
        momentum: 0
      };
    }
    
    return {
      trend: this.calculateTrend(timeSeries),
      seasonality: this.calculateSeasonality(timeSeries),
      volatility: this.calculateVolatility(timeSeries),
      autocorrelation: this.calculateAutocorrelation(timeSeries),
      recentAverage: this.calculateRecentAverage(timeSeries, Math.min(window, timeSeries.length)),
      movingAverage: this.calculateMovingAverage(timeSeries, window),
      exponentialSmoothing: this.calculateExponentialSmoothing(timeSeries),
      changePoint: this.detectChangePoint(timeSeries),
      momentum: this.calculateMomentum(timeSeries)
    };
  }

  /**
   * Create interaction features between different feature groups
   */
  createInteractionFeatures(features: Record<string, number>): Record<string, number> {
    const interactions: Record<string, number> = {};
    
    // Polynomial features (degree 2)
    const featureKeys = Object.keys(features);
    for (let i = 0; i < featureKeys.length; i++) {
      const key1 = featureKeys[i];
      const value1 = features[key1];
      
      // Quadratic features
      interactions[`${key1}_squared`] = value1 * value1;
      
      // Interaction with other features
      for (let j = i + 1; j < featureKeys.length; j++) {
        const key2 = featureKeys[j];
        const value2 = features[key2];
        interactions[`${key1}_x_${key2}`] = value1 * value2;
      }
    }
    
    // Ratio features for meaningful pairs
    this.createRatioFeatures(features, interactions);
    
    return interactions;
  }

  /**
   * Encode categorical features
   */
  encodeCategoricalFeatures(
    data: Record<string, any>[],
    categoricalFeatures: string[],
    method: 'onehot' | 'label' | 'target' = 'onehot'
  ): { encodedData: Record<string, number>[], encodingInfo: EncodingInfo } {
    
    const encodedData: Record<string, number>[] = [];
    const encodingInfo: EncodingInfo = {
      categoricalFeatures: {},
      encodingMethods: {}
    };
    
    // First pass: collect unique values for each categorical feature
    const uniqueValues: Record<string, Set<string>> = {};
    
    for (const feature of categoricalFeatures) {
      uniqueValues[feature] = new Set();
      for (const row of data) {
        if (row[feature] !== undefined && row[feature] !== null) {
          uniqueValues[feature].add(String(row[feature]));
        }
      }
      encodingInfo.categoricalFeatures[feature] = Array.from(uniqueValues[feature]);
      encodingInfo.encodingMethods[feature] = method;
    }
    
    // Second pass: encode the data
    for (const row of data) {
      const encodedRow: Record<string, number> = {};
      
      // Copy non-categorical features
      for (const [key, value] of Object.entries(row)) {
        if (!categoricalFeatures.includes(key)) {
          encodedRow[key] = typeof value === 'number' ? value : 0;
        }
      }
      
      // Encode categorical features
      for (const feature of categoricalFeatures) {
        const value = String(row[feature] || '');
        
        switch (method) {
          case 'onehot':
            for (const uniqueValue of uniqueValues[feature]) {
              encodedRow[`${feature}_${uniqueValue}`] = value === uniqueValue ? 1 : 0;
            }
            break;
            
          case 'label':
            const labelIndex = Array.from(uniqueValues[feature]).indexOf(value);
            encodedRow[feature] = labelIndex >= 0 ? labelIndex : 0;
            break;
            
          case 'target':
            // This would require target values - simplified implementation
            encodedRow[feature] = this.hashString(value) % 1000 / 1000;
            break;
        }
      }
      
      encodedData.push(encodedRow);
    }
    
    return { encodedData, encodingInfo };
  }

  /**
   * Scale features using various methods
   */
  scaleFeatures(
    data: Record<string, number>[],
    method: 'standard' | 'minmax' | 'robust' | 'quantile' = 'standard',
    fitData?: Record<string, number>[]
  ): { scaledData: Record<string, number>[], scalingInfo: ScalingInfo } {
    
    const dataToFit = fitData || data;
    const featureNames = Object.keys(dataToFit[0] || {});
    const scalingParams: Record<string, any> = {};
    
    // Calculate scaling parameters
    for (const feature of featureNames) {
      const values = dataToFit.map(row => row[feature]).filter(v => !isNaN(v));
      
      if (values.length === 0) continue;
      
      switch (method) {
        case 'standard':
          const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
          const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
          const std = Math.sqrt(variance);
          scalingParams[feature] = { mean, std };
          break;
          
        case 'minmax':
          const min = Math.min(...values);
          const max = Math.max(...values);
          scalingParams[feature] = { min, max };
          break;
          
        case 'robust':
          const sorted = values.slice().sort((a, b) => a - b);
          const q25 = sorted[Math.floor(sorted.length * 0.25)];
          const q75 = sorted[Math.floor(sorted.length * 0.75)];
          const median = sorted[Math.floor(sorted.length * 0.5)];
          scalingParams[feature] = { median, q25, q75 };
          break;
          
        case 'quantile':
          // Simplified quantile transformation
          const sortedValues = values.slice().sort((a, b) => a - b);
          scalingParams[feature] = { sortedValues };
          break;
      }
    }
    
    // Apply scaling
    const scaledData = data.map(row => {
      const scaledRow: Record<string, number> = {};
      
      for (const [feature, value] of Object.entries(row)) {
        if (!scalingParams[feature]) {
          scaledRow[feature] = value;
          continue;
        }
        
        const params = scalingParams[feature];
        
        switch (method) {
          case 'standard':
            scaledRow[feature] = params.std > 0 ? (value - params.mean) / params.std : 0;
            break;
            
          case 'minmax':
            const range = params.max - params.min;
            scaledRow[feature] = range > 0 ? (value - params.min) / range : 0;
            break;
            
          case 'robust':
            const iqr = params.q75 - params.q25;
            scaledRow[feature] = iqr > 0 ? (value - params.median) / iqr : 0;
            break;
            
          case 'quantile':
            const rank = params.sortedValues.findIndex((v: number) => v >= value);
            scaledRow[feature] = rank >= 0 ? rank / params.sortedValues.length : 1;
            break;
            
          default:
            scaledRow[feature] = value;
        }
      }
      
      return scaledRow;
    });
    
    const scalingInfo: ScalingInfo = {
      method,
      parameters: scalingParams
    };
    
    return { scaledData, scalingInfo };
  }

  /**
   * Handle missing values
   */
  handleMissingValues(
    data: Record<string, number>[],
    strategy: 'mean' | 'median' | 'mode' | 'forward_fill' | 'backward_fill' | 'interpolate' = 'mean'
  ): Record<string, number>[] {
    
    if (data.length === 0) return data;
    
    const featureNames = Object.keys(data[0]);
    const imputationValues: Record<string, number> = {};
    
    // Calculate imputation values
    for (const feature of featureNames) {
      const values = data.map(row => row[feature]).filter(v => !isNaN(v) && v !== null && v !== undefined);
      
      if (values.length === 0) {
        imputationValues[feature] = 0;
        continue;
      }
      
      switch (strategy) {
        case 'mean':
          imputationValues[feature] = values.reduce((sum, v) => sum + v, 0) / values.length;
          break;
          
        case 'median':
          const sorted = values.slice().sort((a, b) => a - b);
          imputationValues[feature] = sorted[Math.floor(sorted.length / 2)];
          break;
          
        case 'mode':
          const counts = new Map<number, number>();
          values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
          let maxCount = 0;
          let mode = values[0];
          for (const [value, count] of counts) {
            if (count > maxCount) {
              maxCount = count;
              mode = value;
            }
          }
          imputationValues[feature] = mode;
          break;
          
        default:
          imputationValues[feature] = values[0];
      }
    }
    
    // Apply imputation
    return data.map(row => {
      const imputedRow: Record<string, number> = {};
      
      for (const feature of featureNames) {
        const value = row[feature];
        
        if (isNaN(value) || value === null || value === undefined) {
          imputedRow[feature] = imputationValues[feature];
        } else {
          imputedRow[feature] = value;
        }
      }
      
      return imputedRow;
    });
  }

  /**
   * Select features based on importance or correlation
   */
  selectFeatures(
    data: Record<string, number>[],
    targetColumn: string,
    method: 'correlation' | 'variance' | 'mutual_info' = 'correlation',
    topK: number = 10
  ): { selectedFeatures: string[], scores: Record<string, number> } {
    
    const scores: Record<string, number> = {};
    const featureNames = Object.keys(data[0] || {}).filter(name => name !== targetColumn);
    
    switch (method) {
      case 'correlation':
        for (const feature of featureNames) {
          scores[feature] = Math.abs(this.calculateCorrelation(
            data.map(row => row[feature]),
            data.map(row => row[targetColumn])
          ));
        }
        break;
        
      case 'variance':
        for (const feature of featureNames) {
          const values = data.map(row => row[feature]);
          scores[feature] = this.calculateVariance(values);
        }
        break;
        
      case 'mutual_info':
        // Simplified mutual information
        for (const feature of featureNames) {
          scores[feature] = this.calculateMutualInformation(
            data.map(row => row[feature]),
            data.map(row => row[targetColumn])
          );
        }
        break;
    }
    
    // Sort features by score
    const sortedFeatures = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([feature]) => feature);
    
    const selectedFeatures = sortedFeatures.slice(0, topK);
    
    return { selectedFeatures, scores };
  }

  /**
   * Private helper methods
   */
  
  private extractBasicUserFeatures(profile: any): Record<string, number> {
    return {
      user_age: profile.age || 0,
      account_age_days: profile.accountCreatedAt 
        ? (Date.now() - new Date(profile.accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 0,
      total_sessions: profile.totalSessions || 0,
      total_hours_played: profile.totalHours || 0,
      skill_level: profile.overallRating || 1000,
      is_premium: profile.isPremium ? 1 : 0
    };
  }
  
  private extractBehavioralFeatures(interactions: any[]): Record<string, number> {
    if (interactions.length === 0) return {};
    
    const recentInteractions = interactions.slice(-50); // Last 50 interactions
    
    return {
      avg_session_length: recentInteractions.reduce((sum, i) => sum + (i.duration || 0), 0) / recentInteractions.length,
      interaction_frequency: recentInteractions.length / Math.max(1, 
        (Date.now() - new Date(recentInteractions[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)
      ),
      bounce_rate: recentInteractions.filter(i => i.bounced).length / recentInteractions.length,
      error_rate: recentInteractions.filter(i => i.hadError).length / recentInteractions.length,
      completion_rate: recentInteractions.filter(i => i.completed).length / recentInteractions.length
    };
  }
  
  private extractSessionFeatures(sessions: any[]): Record<string, number> {
    if (sessions.length === 0) return {};
    
    const recentSessions = sessions.slice(-10);
    
    return {
      sessions_last_week: sessions.filter(s => 
        Date.now() - new Date(s.startTime).getTime() < 7 * 24 * 60 * 60 * 1000
      ).length,
      avg_pages_per_session: recentSessions.reduce((sum, s) => sum + (s.pageViews || 0), 0) / recentSessions.length,
      avg_actions_per_session: recentSessions.reduce((sum, s) => sum + (s.actions || 0), 0) / recentSessions.length,
      sessions_with_errors: recentSessions.filter(s => s.errorCount > 0).length,
      peak_activity_hour: this.findPeakActivityHour(sessions)
    };
  }
  
  private extractSkillFeatures(skillLevels: Record<string, number>): Record<string, number> {
    const features: Record<string, number> = {};
    
    for (const [skill, level] of Object.entries(skillLevels)) {
      features[`skill_${skill}`] = level;
    }
    
    // Aggregate skill features
    const skills = Object.values(skillLevels);
    if (skills.length > 0) {
      features.skill_average = skills.reduce((sum, skill) => sum + skill, 0) / skills.length;
      features.skill_variance = this.calculateVariance(skills);
      features.skill_max = Math.max(...skills);
      features.skill_min = Math.min(...skills);
    }
    
    return features;
  }
  
  private extractEngagementFeatures(interactions: any[]): Record<string, number> {
    const engagementEvents = interactions.filter(i => 
      i.eventType === 'like' || i.eventType === 'share' || i.eventType === 'comment'
    );
    
    return {
      engagement_events: engagementEvents.length,
      engagement_rate: interactions.length > 0 ? engagementEvents.length / interactions.length : 0,
      days_since_last_engagement: engagementEvents.length > 0 
        ? (Date.now() - new Date(engagementEvents[engagementEvents.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24)
        : 999,
      unique_engagement_types: new Set(engagementEvents.map(e => e.eventType)).size
    };
  }
  
  private extractTemporalFeatures(interactions: any[]): Record<string, number> {
    if (interactions.length < 2) return {};
    
    const timestamps = interactions.map(i => new Date(i.timestamp).getTime());
    const intervals = [];
    
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }
    
    return {
      avg_time_between_interactions: intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length / 1000,
      interaction_consistency: 1 / (1 + this.calculateVariance(intervals)),
      days_since_first_interaction: (Date.now() - timestamps[0]) / (1000 * 60 * 60 * 24),
      days_since_last_interaction: (Date.now() - timestamps[timestamps.length - 1]) / (1000 * 60 * 60 * 24)
    };
  }

  // Poker-specific helper methods
  
  private calculateHandStrength(playerHand: any[], communityCards: any[]): number {
    // Simplified hand strength calculation
    // In a real implementation, this would use a proper poker hand evaluator
    const allCards = [...playerHand, ...communityCards];
    
    // Basic strength based on high card
    let strength = 0;
    for (const card of playerHand) {
      strength += this.getCardValue(card.rank) / 14; // Normalize by Ace value
    }
    
    return strength / playerHand.length;
  }
  
  private getHandRank(playerHand: any[]): number {
    // Simplified hand ranking (0-168 for all possible starting hands in Hold'em)
    if (playerHand.length !== 2) return 0;
    
    const card1 = playerHand[0];
    const card2 = playerHand[1];
    const val1 = this.getCardValue(card1.rank);
    const val2 = this.getCardValue(card2.rank);
    
    const isPair = val1 === val2;
    const isSuited = card1.suit === card2.suit;
    const gap = Math.abs(val1 - val2);
    
    let rank = Math.max(val1, val2) * 13 + Math.min(val1, val2);
    
    if (isPair) rank += 100;
    if (isSuited) rank += 50;
    if (gap <= 1 && !isPair) rank += 25; // Connected
    
    return rank;
  }
  
  private calculateSuitedness(playerHand: any[]): number {
    if (playerHand.length !== 2) return 0;
    return playerHand[0].suit === playerHand[1].suit ? 1 : 0;
  }
  
  private calculateConnectedness(playerHand: any[]): number {
    if (playerHand.length !== 2) return 0;
    
    const val1 = this.getCardValue(playerHand[0].rank);
    const val2 = this.getCardValue(playerHand[1].rank);
    const gap = Math.abs(val1 - val2);
    
    if (gap === 1) return 1; // Connected
    if (gap === 2) return 0.5; // 1-gap
    if (gap === 3) return 0.25; // 2-gap
    return 0;
  }
  
  private getPositionType(position: number, tableSize: number): string {
    const positionsFromButton = (tableSize - position) % tableSize;
    
    if (positionsFromButton === 0) return 'button';
    if (positionsFromButton === 1) return 'cutoff';
    if (positionsFromButton === 2) return 'hijack';
    if (positionsFromButton <= 3) return 'middle';
    return 'early';
  }
  
  private calculatePositionStrength(position: number, tableSize: number): number {
    const positionsFromButton = (tableSize - position) % tableSize;
    return (tableSize - positionsFromButton) / tableSize;
  }
  
  private calculatePotOdds(potSize: number, betToCall: number): number {
    if (betToCall === 0) return Infinity;
    return potSize / betToCall;
  }
  
  private calculateImpliedOdds(gameState: any): number {
    // Simplified implied odds calculation
    const effectiveStack = gameState.effectiveStackSize || 0;
    const betToCall = gameState.betToCall || 0;
    
    if (betToCall === 0) return Infinity;
    return effectiveStack / betToCall;
  }
  
  private calculateExpectedValue(gameState: any): number {
    // Simplified EV calculation
    // This would normally require extensive poker logic
    return 0; // Placeholder
  }
  
  private normalizeBetSize(betSize: number, potSize: number): number {
    if (potSize === 0) return 0;
    return betSize / potSize;
  }
  
  private calculateOpponentAggression(actions: any[]): number {
    const aggressiveActions = actions.filter(a => a.type === 'bet' || a.type === 'raise');
    return actions.length > 0 ? aggressiveActions.length / actions.length : 0;
  }
  
  private calculateOpponentTightness(actions: any[]): number {
    const foldActions = actions.filter(a => a.type === 'fold');
    return actions.length > 0 ? foldActions.length / actions.length : 0;
  }
  
  private estimateOpponentSkill(handHistory: any[]): number {
    // Simplified skill estimation based on decision quality
    return 0.5; // Placeholder
  }
  
  private extractOpponentTendencies(handHistory: any[]): Record<string, number> {
    return {
      vpip: 0.25, // Placeholder values
      pfr: 0.18,
      aggression: 2.5,
      fold_to_3bet: 0.65
    };
  }
  
  private getCardValue(rank: string): number {
    const values: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return values[rank] || 0;
  }

  // Time series helper methods
  
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }
  
  private calculateSeasonality(values: number[]): number {
    // Simplified seasonality detection
    if (values.length < 4) return 0;
    
    const period = 7; // Weekly seasonality
    if (values.length < period * 2) return 0;
    
    let autocorr = 0;
    for (let i = period; i < values.length; i++) {
      autocorr += values[i] * values[i - period];
    }
    
    return autocorr / (values.length - period);
  }
  
  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  private calculateAutocorrelation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 1; i < values.length; i++) {
      numerator += (values[i] - mean) * (values[i-1] - mean);
    }
    
    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }
  
  private calculateRecentAverage(values: number[], window: number): number {
    const recentValues = values.slice(-window);
    return recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
  }
  
  private calculateMovingAverage(values: number[], window: number): number {
    if (values.length < window) return this.calculateRecentAverage(values, values.length);
    
    const windowValues = values.slice(-window);
    return windowValues.reduce((sum, val) => sum + val, 0) / window;
  }
  
  private calculateExponentialSmoothing(values: number[], alpha: number = 0.3): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];
    
    let smoothed = values[0];
    for (let i = 1; i < values.length; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
    }
    
    return smoothed;
  }
  
  private detectChangePoint(values: number[]): boolean {
    if (values.length < 10) return false;
    
    const midPoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);
    
    const firstMean = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const totalMean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const totalStd = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - totalMean, 2), 0) / values.length);
    
    const changeMagnitude = Math.abs(secondMean - firstMean);
    return changeMagnitude > 2 * totalStd; // 2 standard deviations
  }
  
  private calculateMomentum(values: number[]): number {
    if (values.length < 3) return 0;
    
    const recent = values.slice(-3);
    const older = values.slice(-6, -3);
    
    if (older.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    return recentAvg - olderAvg;
  }

  // Statistical helper methods
  
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator > 0 ? numerator / denominator : 0;
  }
  
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
  
  private calculateMutualInformation(x: number[], y: number[]): number {
    // Simplified mutual information using binning
    if (x.length !== y.length || x.length === 0) return 0;
    
    // This is a very simplified implementation
    // Real mutual information calculation would require proper probability estimation
    return Math.abs(this.calculateCorrelation(x, y)) * 0.5;
  }
  
  private createRatioFeatures(features: Record<string, number>, interactions: Record<string, number>): void {
    // Create meaningful ratio features
    const meaningfulPairs = [
      ['engagement_events', 'total_sessions'],
      ['skill_average', 'account_age_days'],
      ['avg_session_length', 'interaction_frequency'],
      ['completion_rate', 'error_rate']
    ];
    
    for (const [numerator, denominator] of meaningfulPairs) {
      if (features[numerator] !== undefined && features[denominator] !== undefined) {
        const denominatorVal = features[denominator];
        if (denominatorVal !== 0) {
          interactions[`${numerator}_per_${denominator}`] = features[numerator] / denominatorVal;
        }
      }
    }
  }
  
  private findPeakActivityHour(sessions: any[]): number {
    const hourCounts = new Array(24).fill(0);
    
    for (const session of sessions) {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour]++;
    }
    
    let maxCount = 0;
    let peakHour = 12; // Default to noon
    
    for (let hour = 0; hour < 24; hour++) {
      if (hourCounts[hour] > maxCount) {
        maxCount = hourCounts[hour];
        peakHour = hour;
      }
    }
    
    return peakHour;
  }
  
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get feature engineering statistics
   */
  getStats() {
    return {
      scalingParametersCount: this.scalingParameters.size,
      encodingMappingsCount: this.encodingMappings.size,
      featureImportancesCount: this.featureImportances.size,
      cacheSize: this.transformationCache.size
    };
  }
}

export default FeatureEngineer;