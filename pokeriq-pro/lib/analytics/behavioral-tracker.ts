/**
 * Behavioral Analytics Tracker
 * Provides event collection and processing, pattern recognition,
 * anomaly detection, and engagement scoring
 */

export interface UserEvent {
  userId: string;
  sessionId: string;
  eventType: string;
  eventCategory: 'navigation' | 'interaction' | 'performance' | 'engagement' | 'error' | 'custom';
  timestamp: Date;
  properties: Record<string, any>;
  context: EventContext;
  value?: number;
  duration?: number; // Event duration in milliseconds
}

export interface EventContext {
  url?: string;
  referrer?: string;
  userAgent?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browserInfo?: BrowserInfo;
  screenResolution?: string;
  location?: GeoLocation;
  abTestVariants?: Record<string, string>;
}

export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
}

export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

export interface BehavioralPattern {
  patternId: string;
  userId: string;
  patternType: 'sequential' | 'frequency' | 'temporal' | 'engagement' | 'performance';
  description: string;
  confidence: number; // 0-1
  frequency: number; // How often this pattern occurs
  lastOccurrence: Date;
  firstOccurrence: Date;
  events: UserEvent[];
  metrics: PatternMetrics;
}

export interface PatternMetrics {
  avgDuration?: number;
  avgValue?: number;
  peakTimes?: string[]; // Times of day when pattern is most common
  associatedEvents?: string[]; // Events that commonly occur with this pattern
  successRate?: number; // For performance patterns
  satisfactionScore?: number; // For engagement patterns
}

export interface EngagementScore {
  userId: string;
  sessionId?: string;
  overallScore: number; // 0-100
  dimensions: EngagementDimensions;
  trends: EngagementTrends;
  calculatedAt: Date;
  period: 'session' | 'daily' | 'weekly' | 'monthly';
}

export interface EngagementDimensions {
  timeSpent: number; // 0-100
  interactionDepth: number; // 0-100
  contentConsumption: number; // 0-100
  featureAdoption: number; // 0-100
  socialEngagement: number; // 0-100
  learningProgress: number; // 0-100
}

export interface EngagementTrends {
  shortTerm: number; // -1 to 1, negative = decreasing, positive = increasing
  longTerm: number; // -1 to 1
  volatility: number; // 0-1, how much engagement varies
  consistency: number; // 0-1, how consistent engagement is over time
}

export interface Anomaly {
  anomalyId: string;
  userId: string;
  sessionId?: string;
  type: 'behavior' | 'performance' | 'engagement' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  events: UserEvent[];
  metrics: AnomalyMetrics;
  possibleCauses: string[];
  recommendations: string[];
}

export interface AnomalyMetrics {
  deviationScore: number; // How far from normal behavior
  confidence: number; // How confident we are this is an anomaly
  impactScore: number; // Potential impact on user experience
  frequency: number; // How often this type of anomaly occurs
}

export interface SessionSummary {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // milliseconds
  eventCount: number;
  pageViews: number;
  interactions: number;
  errors: number;
  engagementScore: number;
  completedActions: string[];
  mostUsedFeatures: string[];
  exitPage?: string;
  bounced: boolean;
}

/**
 * Advanced Behavioral Analytics Engine
 */
export class BehavioralTracker {
  private events: Map<string, UserEvent[]> = new Map(); // userId -> events
  private sessions: Map<string, SessionSummary> = new Map(); // sessionId -> summary
  private patterns: Map<string, BehavioralPattern[]> = new Map(); // userId -> patterns
  private anomalies: Map<string, Anomaly[]> = new Map(); // userId -> anomalies
  private engagementScores: Map<string, EngagementScore[]> = new Map(); // userId -> scores
  
  // Configuration
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly PATTERN_MIN_FREQUENCY = 3; // Minimum occurrences to be considered a pattern
  private readonly ANOMALY_THRESHOLD = 2.0; // Standard deviations from normal
  private readonly BATCH_SIZE = 100; // Events to process in each batch
  
  // Real-time processing
  private eventQueue: UserEvent[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Start real-time processing
    this.startRealTimeProcessing();
  }

  /**
   * Track a user event
   */
  async trackEvent(event: Omit<UserEvent, 'timestamp'>): Promise<void> {
    const fullEvent: UserEvent = {
      ...event,
      timestamp: new Date()
    };
    
    // Add to processing queue
    this.eventQueue.push(fullEvent);
    
    // Store event
    if (!this.events.has(event.userId)) {
      this.events.set(event.userId, []);
    }
    this.events.get(event.userId)!.push(fullEvent);
    
    // Update session
    await this.updateSession(fullEvent);
    
    // Real-time anomaly detection for critical events
    if (event.eventCategory === 'error' || event.eventCategory === 'performance') {
      await this.detectRealTimeAnomalies(fullEvent);
    }
  }

  /**
   * Track multiple events in batch
   */
  async trackEvents(events: Omit<UserEvent, 'timestamp'>[]): Promise<void> {
    const promises = events.map(event => this.trackEvent(event));
    await Promise.all(promises);
  }

  /**
   * Get engagement score for a user
   */
  async calculateEngagementScore(
    userId: string,
    period: 'session' | 'daily' | 'weekly' | 'monthly' = 'daily',
    sessionId?: string
  ): Promise<EngagementScore> {
    
    const userEvents = this.getUserEvents(userId, period, sessionId);
    
    if (userEvents.length === 0) {
      return this.getDefaultEngagementScore(userId, sessionId, period);
    }
    
    // Calculate engagement dimensions
    const dimensions = await this.calculateEngagementDimensions(userEvents, userId);
    
    // Calculate overall score (weighted average)
    const weights = {
      timeSpent: 0.20,
      interactionDepth: 0.25,
      contentConsumption: 0.20,
      featureAdoption: 0.15,
      socialEngagement: 0.10,
      learningProgress: 0.10
    };
    
    const overallScore = Object.entries(dimensions).reduce((sum, [dim, score]) => {
      const weight = weights[dim as keyof typeof weights] || 0;
      return sum + (score * weight);
    }, 0);
    
    // Calculate trends
    const trends = await this.calculateEngagementTrends(userId, period);
    
    const engagementScore: EngagementScore = {
      userId,
      sessionId,
      overallScore: Math.round(overallScore),
      dimensions,
      trends,
      calculatedAt: new Date(),
      period
    };
    
    // Store score
    if (!this.engagementScores.has(userId)) {
      this.engagementScores.set(userId, []);
    }
    this.engagementScores.get(userId)!.push(engagementScore);
    
    return engagementScore;
  }

  /**
   * Detect behavioral patterns for a user
   */
  async detectPatterns(userId: string): Promise<BehavioralPattern[]> {
    const userEvents = this.events.get(userId) || [];
    
    if (userEvents.length < 10) return []; // Need sufficient data
    
    const patterns: BehavioralPattern[] = [];
    
    // Detect sequential patterns
    patterns.push(...await this.detectSequentialPatterns(userId, userEvents));
    
    // Detect frequency patterns
    patterns.push(...await this.detectFrequencyPatterns(userId, userEvents));
    
    // Detect temporal patterns
    patterns.push(...await this.detectTemporalPatterns(userId, userEvents));
    
    // Detect engagement patterns
    patterns.push(...await this.detectEngagementPatterns(userId, userEvents));
    
    // Detect performance patterns
    patterns.push(...await this.detectPerformancePatterns(userId, userEvents));
    
    // Store patterns
    this.patterns.set(userId, patterns);
    
    return patterns;
  }

  /**
   * Detect anomalies in user behavior
   */
  async detectAnomalies(userId: string): Promise<Anomaly[]> {
    const userEvents = this.events.get(userId) || [];
    
    if (userEvents.length < 20) return []; // Need sufficient baseline data
    
    const anomalies: Anomaly[] = [];
    
    // Detect behavioral anomalies
    anomalies.push(...await this.detectBehavioralAnomalies(userId, userEvents));
    
    // Detect performance anomalies
    anomalies.push(...await this.detectPerformanceAnomalies(userId, userEvents));
    
    // Detect engagement anomalies
    anomalies.push(...await this.detectEngagementAnomalies(userId, userEvents));
    
    // Detect technical anomalies
    anomalies.push(...await this.detectTechnicalAnomalies(userId, userEvents));
    
    // Store anomalies
    if (!this.anomalies.has(userId)) {
      this.anomalies.set(userId, []);
    }
    this.anomalies.get(userId)!.push(...anomalies);
    
    return anomalies;
  }

  /**
   * Get session summary
   */
  getSessionSummary(sessionId: string): SessionSummary | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get user analytics summary
   */
  async getUserAnalytics(userId: string): Promise<{
    engagementScore: EngagementScore;
    patterns: BehavioralPattern[];
    anomalies: Anomaly[];
    sessionSummaries: SessionSummary[];
    insights: string[];
  }> {
    
    const [engagementScore, patterns, anomalies] = await Promise.all([
      this.calculateEngagementScore(userId),
      this.detectPatterns(userId),
      this.detectAnomalies(userId)
    ]);
    
    // Get recent sessions
    const userEvents = this.events.get(userId) || [];
    const sessionIds = [...new Set(userEvents.map(e => e.sessionId))];
    const sessionSummaries = sessionIds
      .map(id => this.sessions.get(id))
      .filter(Boolean) as SessionSummary[];
    
    // Generate insights
    const insights = await this.generateInsights(userId, {
      engagementScore,
      patterns,
      anomalies,
      sessionSummaries
    });
    
    return {
      engagementScore,
      patterns,
      anomalies,
      sessionSummaries,
      insights
    };
  }

  /**
   * Start real-time event processing
   */
  private startRealTimeProcessing(): void {
    this.processingInterval = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        const batch = this.eventQueue.splice(0, this.BATCH_SIZE);
        await this.processBatch(batch);
      }
    }, 1000); // Process every second
  }

  /**
   * Process a batch of events
   */
  private async processBatch(events: UserEvent[]): Promise<void> {
    for (const event of events) {
      // Update real-time metrics
      await this.updateRealTimeMetrics(event);
      
      // Check for patterns
      if (Math.random() < 0.1) { // Sample 10% for pattern detection
        await this.detectPatterns(event.userId);
      }
      
      // Check for anomalies
      if (this.shouldCheckForAnomalies(event)) {
        await this.detectRealTimeAnomalies(event);
      }
    }
  }

  /**
   * Update session information
   */
  private async updateSession(event: UserEvent): Promise<void> {
    let session = this.sessions.get(event.sessionId);
    
    if (!session) {
      session = {
        sessionId: event.sessionId,
        userId: event.userId,
        startTime: event.timestamp,
        duration: 0,
        eventCount: 0,
        pageViews: 0,
        interactions: 0,
        errors: 0,
        engagementScore: 0,
        completedActions: [],
        mostUsedFeatures: [],
        bounced: true
      };
    }
    
    // Update session metrics
    session.endTime = event.timestamp;
    session.duration = session.endTime.getTime() - session.startTime.getTime();
    session.eventCount += 1;
    session.bounced = session.eventCount <= 1;
    
    // Categorize events
    switch (event.eventCategory) {
      case 'navigation':
        session.pageViews += 1;
        break;
      case 'interaction':
        session.interactions += 1;
        break;
      case 'error':
        session.errors += 1;
        break;
    }
    
    // Track completed actions
    if (event.properties.completed) {
      session.completedActions.push(event.eventType);
    }
    
    // Update engagement score (simplified)
    session.engagementScore = this.calculateSimpleEngagementScore(session);
    
    this.sessions.set(event.sessionId, session);
  }

  /**
   * Calculate engagement dimensions
   */
  private async calculateEngagementDimensions(
    events: UserEvent[],
    userId: string
  ): Promise<EngagementDimensions> {
    
    // Time Spent Score (0-100)
    const sessionDurations = [...new Set(events.map(e => e.sessionId))]
      .map(id => this.sessions.get(id)?.duration || 0);
    const avgSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length / 1000 // Convert to seconds
      : 0;
    const timeSpent = Math.min(100, (avgSessionDuration / 3600) * 100); // Score based on hours
    
    // Interaction Depth Score
    const interactionEvents = events.filter(e => e.eventCategory === 'interaction');
    const uniqueInteractions = new Set(interactionEvents.map(e => e.eventType)).size;
    const interactionDepth = Math.min(100, (uniqueInteractions / 20) * 100); // Assume 20 max interactions
    
    // Content Consumption Score
    const contentEvents = events.filter(e => 
      e.eventType.includes('video_watched') || 
      e.eventType.includes('article_read') ||
      e.eventType.includes('lesson_completed')
    );
    const contentConsumption = Math.min(100, (contentEvents.length / 10) * 100); // 10 pieces of content = 100%
    
    // Feature Adoption Score
    const featureEvents = events.filter(e => e.properties.feature_used);
    const uniqueFeatures = new Set(featureEvents.map(e => e.properties.feature_used)).size;
    const featureAdoption = Math.min(100, (uniqueFeatures / 15) * 100); // Assume 15 main features
    
    // Social Engagement Score
    const socialEvents = events.filter(e => 
      e.eventType.includes('share') || 
      e.eventType.includes('comment') ||
      e.eventType.includes('like')
    );
    const socialEngagement = Math.min(100, (socialEvents.length / 5) * 100);
    
    // Learning Progress Score
    const learningEvents = events.filter(e => 
      e.eventType.includes('lesson_completed') ||
      e.eventType.includes('quiz_passed') ||
      e.eventType.includes('skill_improved')
    );
    const learningProgress = Math.min(100, (learningEvents.length / 10) * 100);
    
    return {
      timeSpent: Math.round(timeSpent),
      interactionDepth: Math.round(interactionDepth),
      contentConsumption: Math.round(contentConsumption),
      featureAdoption: Math.round(featureAdoption),
      socialEngagement: Math.round(socialEngagement),
      learningProgress: Math.round(learningProgress)
    };
  }

  /**
   * Calculate engagement trends
   */
  private async calculateEngagementTrends(
    userId: string,
    period: string
  ): Promise<EngagementTrends> {
    
    const userScores = this.engagementScores.get(userId) || [];
    
    if (userScores.length < 2) {
      return {
        shortTerm: 0,
        longTerm: 0,
        volatility: 0,
        consistency: 0.5
      };
    }
    
    // Sort by date
    const sortedScores = userScores.sort((a, b) => a.calculatedAt.getTime() - b.calculatedAt.getTime());
    const scores = sortedScores.map(s => s.overallScore);
    
    // Short-term trend (last 3 data points)
    const recentScores = scores.slice(-3);
    const shortTerm = recentScores.length > 1 
      ? (recentScores[recentScores.length - 1] - recentScores[0]) / 100
      : 0;
    
    // Long-term trend (all data points)
    const longTerm = scores.length > 1 
      ? (scores[scores.length - 1] - scores[0]) / 100
      : 0;
    
    // Volatility (standard deviation)
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const volatility = Math.sqrt(variance) / 100;
    
    // Consistency (inverse of coefficient of variation)
    const consistency = mean > 0 ? Math.max(0, 1 - (Math.sqrt(variance) / mean)) : 0;
    
    return {
      shortTerm: Math.max(-1, Math.min(1, shortTerm)),
      longTerm: Math.max(-1, Math.min(1, longTerm)),
      volatility: Math.max(0, Math.min(1, volatility)),
      consistency: Math.max(0, Math.min(1, consistency))
    };
  }

  /**
   * Detect sequential patterns
   */
  private async detectSequentialPatterns(userId: string, events: UserEvent[]): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];
    
    // Look for common event sequences
    const sequences = new Map<string, number>();
    
    for (let i = 0; i < events.length - 2; i++) {
      const sequence = `${events[i].eventType}->${events[i+1].eventType}->${events[i+2].eventType}`;
      sequences.set(sequence, (sequences.get(sequence) || 0) + 1);
    }
    
    for (const [sequence, count] of sequences) {
      if (count >= this.PATTERN_MIN_FREQUENCY) {
        const sequenceEvents = events.filter((_, i) => {
          if (i >= events.length - 2) return false;
          const seq = `${events[i].eventType}->${events[i+1].eventType}->${events[i+2].eventType}`;
          return seq === sequence;
        });
        
        patterns.push({
          patternId: this.generatePatternId(),
          userId,
          patternType: 'sequential',
          description: `User frequently follows the sequence: ${sequence.replace(/->/g, ' → ')}`,
          confidence: Math.min(1, count / events.length * 10),
          frequency: count,
          lastOccurrence: sequenceEvents[sequenceEvents.length - 1]?.timestamp || new Date(),
          firstOccurrence: sequenceEvents[0]?.timestamp || new Date(),
          events: sequenceEvents,
          metrics: {
            associatedEvents: sequence.split('->'),
            successRate: 1.0 // Assume successful sequences
          }
        });
      }
    }
    
    return patterns;
  }

  /**
   * Detect frequency patterns
   */
  private async detectFrequencyPatterns(userId: string, events: UserEvent[]): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];
    
    // Count event frequencies
    const eventCounts = new Map<string, number>();
    events.forEach(event => {
      eventCounts.set(event.eventType, (eventCounts.get(event.eventType) || 0) + 1);
    });
    
    // Identify high-frequency patterns
    for (const [eventType, count] of eventCounts) {
      if (count >= this.PATTERN_MIN_FREQUENCY * 2) { // Higher threshold for frequency patterns
        const eventOccurrences = events.filter(e => e.eventType === eventType);
        
        patterns.push({
          patternId: this.generatePatternId(),
          userId,
          patternType: 'frequency',
          description: `User frequently performs: ${eventType} (${count} times)`,
          confidence: Math.min(1, count / events.length),
          frequency: count,
          lastOccurrence: eventOccurrences[eventOccurrences.length - 1].timestamp,
          firstOccurrence: eventOccurrences[0].timestamp,
          events: eventOccurrences,
          metrics: {
            avgDuration: eventOccurrences.reduce((sum, e) => sum + (e.duration || 0), 0) / eventOccurrences.length
          }
        });
      }
    }
    
    return patterns;
  }

  /**
   * Detect temporal patterns
   */
  private async detectTemporalPatterns(userId: string, events: UserEvent[]): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];
    
    // Group events by hour of day
    const hourlyActivity = new Map<number, UserEvent[]>();
    events.forEach(event => {
      const hour = event.timestamp.getHours();
      if (!hourlyActivity.has(hour)) {
        hourlyActivity.set(hour, []);
      }
      hourlyActivity.get(hour)!.push(event);
    });
    
    // Find peak activity hours
    const peakHours: number[] = [];
    const avgActivityPerHour = events.length / 24;
    
    for (const [hour, hourEvents] of hourlyActivity) {
      if (hourEvents.length > avgActivityPerHour * 1.5) { // 50% above average
        peakHours.push(hour);
      }
    }
    
    if (peakHours.length > 0) {
      const peakEvents = peakHours.flatMap(hour => hourlyActivity.get(hour) || []);
      
      patterns.push({
        patternId: this.generatePatternId(),
        userId,
        patternType: 'temporal',
        description: `User is most active during: ${peakHours.map(h => `${h}:00`).join(', ')}`,
        confidence: 0.8,
        frequency: peakEvents.length,
        lastOccurrence: peakEvents[peakEvents.length - 1].timestamp,
        firstOccurrence: peakEvents[0].timestamp,
        events: peakEvents,
        metrics: {
          peakTimes: peakHours.map(h => `${h}:00`),
          avgDuration: peakEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / peakEvents.length
        }
      });
    }
    
    return patterns;
  }

  /**
   * Detect engagement patterns
   */
  private async detectEngagementPatterns(userId: string, events: UserEvent[]): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];
    
    // Look for engagement-related events
    const engagementEvents = events.filter(e => 
      e.eventCategory === 'engagement' || 
      e.eventType.includes('like') ||
      e.eventType.includes('share') ||
      e.eventType.includes('comment') ||
      e.eventType.includes('bookmark')
    );
    
    if (engagementEvents.length >= this.PATTERN_MIN_FREQUENCY) {
      patterns.push({
        patternId: this.generatePatternId(),
        userId,
        patternType: 'engagement',
        description: `User shows high engagement behavior (${engagementEvents.length} engagement actions)`,
        confidence: 0.7,
        frequency: engagementEvents.length,
        lastOccurrence: engagementEvents[engagementEvents.length - 1].timestamp,
        firstOccurrence: engagementEvents[0].timestamp,
        events: engagementEvents,
        metrics: {
          satisfactionScore: 0.8, // High engagement suggests satisfaction
          associatedEvents: [...new Set(engagementEvents.map(e => e.eventType))]
        }
      });
    }
    
    return patterns;
  }

  /**
   * Detect performance patterns
   */
  private async detectPerformancePatterns(userId: string, events: UserEvent[]): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];
    
    // Look for performance-related events
    const performanceEvents = events.filter(e => 
      e.eventCategory === 'performance' ||
      e.eventType.includes('quiz_') ||
      e.eventType.includes('test_') ||
      e.eventType.includes('exercise_')
    );
    
    if (performanceEvents.length >= this.PATTERN_MIN_FREQUENCY) {
      const successfulEvents = performanceEvents.filter(e => 
        e.properties.success === true || 
        e.properties.passed === true ||
        e.properties.completed === true
      );
      
      const successRate = successfulEvents.length / performanceEvents.length;
      
      patterns.push({
        patternId: this.generatePatternId(),
        userId,
        patternType: 'performance',
        description: `User performance pattern: ${Math.round(successRate * 100)}% success rate`,
        confidence: 0.8,
        frequency: performanceEvents.length,
        lastOccurrence: performanceEvents[performanceEvents.length - 1].timestamp,
        firstOccurrence: performanceEvents[0].timestamp,
        events: performanceEvents,
        metrics: {
          successRate,
          avgDuration: performanceEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / performanceEvents.length
        }
      });
    }
    
    return patterns;
  }

  /**
   * Detect behavioral anomalies
   */
  private async detectBehavioralAnomalies(userId: string, events: UserEvent[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Calculate baseline behavior
    const eventTypeCounts = new Map<string, number>();
    events.forEach(event => {
      eventTypeCounts.set(event.eventType, (eventTypeCounts.get(event.eventType) || 0) + 1);
    });
    
    const avgEventCount = Array.from(eventTypeCounts.values()).reduce((sum, count) => sum + count, 0) / eventTypeCounts.size;
    const stdDev = Math.sqrt(Array.from(eventTypeCounts.values()).reduce((sum, count) => sum + Math.pow(count - avgEventCount, 2), 0) / eventTypeCounts.size);
    
    // Look for unusual event frequencies
    for (const [eventType, count] of eventTypeCounts) {
      const zScore = Math.abs(count - avgEventCount) / stdDev;
      
      if (zScore > this.ANOMALY_THRESHOLD) {
        const anomalyEvents = events.filter(e => e.eventType === eventType);
        
        anomalies.push({
          anomalyId: this.generateAnomalyId(),
          userId,
          type: 'behavior',
          severity: zScore > 3 ? 'high' : 'medium',
          description: `Unusual frequency of ${eventType}: ${count} occurrences (${zScore.toFixed(2)} standard deviations from normal)`,
          detectedAt: new Date(),
          events: anomalyEvents,
          metrics: {
            deviationScore: zScore,
            confidence: Math.min(1, zScore / 3),
            impactScore: 0.5,
            frequency: count
          },
          possibleCauses: [
            'User behavior change',
            'Feature malfunction',
            'External factors'
          ],
          recommendations: [
            'Monitor user engagement',
            'Check feature functionality',
            'Consider personalized intervention'
          ]
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Detect performance anomalies
   */
  private async detectPerformanceAnomalies(userId: string, events: UserEvent[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Look for performance issues
    const performanceEvents = events.filter(e => 
      e.eventCategory === 'performance' && 
      e.duration !== undefined
    );
    
    if (performanceEvents.length > 5) {
      const durations = performanceEvents.map(e => e.duration!);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const stdDev = Math.sqrt(durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length);
      
      // Find slow performance events
      const slowEvents = performanceEvents.filter(e => {
        const zScore = (e.duration! - avgDuration) / stdDev;
        return zScore > this.ANOMALY_THRESHOLD;
      });
      
      if (slowEvents.length > 0) {
        anomalies.push({
          anomalyId: this.generateAnomalyId(),
          userId,
          type: 'performance',
          severity: 'medium',
          description: `${slowEvents.length} unusually slow performance events detected`,
          detectedAt: new Date(),
          events: slowEvents,
          metrics: {
            deviationScore: 2.5,
            confidence: 0.8,
            impactScore: 0.7,
            frequency: slowEvents.length
          },
          possibleCauses: [
            'Network issues',
            'Device performance',
            'Server problems'
          ],
          recommendations: [
            'Check network connectivity',
            'Optimize content delivery',
            'Monitor server performance'
          ]
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Detect engagement anomalies
   */
  private async detectEngagementAnomalies(userId: string, events: UserEvent[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Calculate recent engagement vs historical
    const recentEvents = events.filter(e => {
      const daysSinceEvent = (Date.now() - e.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceEvent <= 7; // Last 7 days
    });
    
    const historicalEvents = events.filter(e => {
      const daysSinceEvent = (Date.now() - e.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceEvent > 7 && daysSinceEvent <= 30; // Previous 3 weeks
    });
    
    if (historicalEvents.length > 10 && recentEvents.length > 0) {
      const recentEngagement = recentEvents.length / 7; // Events per day
      const historicalEngagement = historicalEvents.length / 23; // Events per day
      
      const changeRatio = recentEngagement / historicalEngagement;
      
      if (changeRatio < 0.5 || changeRatio > 2.0) { // 50% decrease or 100% increase
        anomalies.push({
          anomalyId: this.generateAnomalyId(),
          userId,
          type: 'engagement',
          severity: changeRatio < 0.3 ? 'high' : 'medium',
          description: `Significant engagement change: ${Math.round((changeRatio - 1) * 100)}% ${changeRatio > 1 ? 'increase' : 'decrease'}`,
          detectedAt: new Date(),
          events: recentEvents,
          metrics: {
            deviationScore: Math.abs(changeRatio - 1),
            confidence: 0.7,
            impactScore: changeRatio < 1 ? 0.8 : 0.3, // Decreases are more concerning
            frequency: recentEvents.length
          },
          possibleCauses: changeRatio < 1 ? [
            'User losing interest',
            'Technical issues',
            'Competing priorities'
          ] : [
            'New feature discovery',
            'Increased motivation',
            'External factors'
          ],
          recommendations: changeRatio < 1 ? [
            'Send re-engagement notification',
            'Offer personalized content',
            'Check for technical issues'
          ] : [
            'Capitalize on increased interest',
            'Recommend advanced features',
            'Monitor for sustainable growth'
          ]
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Detect technical anomalies
   */
  private async detectTechnicalAnomalies(userId: string, events: UserEvent[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Look for error patterns
    const errorEvents = events.filter(e => e.eventCategory === 'error');
    
    if (errorEvents.length > 3) { // More than 3 errors might indicate a problem
      const errorTypes = new Map<string, number>();
      errorEvents.forEach(event => {
        const errorType = event.properties.errorType || 'unknown';
        errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);
      });
      
      for (const [errorType, count] of errorTypes) {
        if (count > 2) { // Repeated errors
          anomalies.push({
            anomalyId: this.generateAnomalyId(),
            userId,
            type: 'technical',
            severity: count > 5 ? 'high' : 'medium',
            description: `Repeated ${errorType} errors: ${count} occurrences`,
            detectedAt: new Date(),
            events: errorEvents.filter(e => (e.properties.errorType || 'unknown') === errorType),
            metrics: {
              deviationScore: count / 2, // Normalize by expected error count
              confidence: 0.9,
              impactScore: 0.8,
              frequency: count
            },
            possibleCauses: [
              'Software bug',
              'Browser compatibility',
              'Network issues'
            ],
            recommendations: [
              'Fix underlying bug',
              'Improve error handling',
              'Provide user guidance'
            ]
          });
        }
      }
    }
    
    return anomalies;
  }

  /**
   * Utility methods
   */
  
  private getUserEvents(
    userId: string, 
    period: string, 
    sessionId?: string
  ): UserEvent[] {
    let userEvents = this.events.get(userId) || [];
    
    if (sessionId) {
      userEvents = userEvents.filter(e => e.sessionId === sessionId);
    } else {
      // Filter by time period
      const now = Date.now();
      const periodMs = this.getPeriodMs(period);
      userEvents = userEvents.filter(e => now - e.timestamp.getTime() <= periodMs);
    }
    
    return userEvents;
  }
  
  private getPeriodMs(period: string): number {
    switch (period) {
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }
  
  private getDefaultEngagementScore(
    userId: string, 
    sessionId: string | undefined, 
    period: string
  ): EngagementScore {
    return {
      userId,
      sessionId,
      overallScore: 50,
      dimensions: {
        timeSpent: 50,
        interactionDepth: 50,
        contentConsumption: 50,
        featureAdoption: 50,
        socialEngagement: 50,
        learningProgress: 50
      },
      trends: {
        shortTerm: 0,
        longTerm: 0,
        volatility: 0,
        consistency: 0.5
      },
      calculatedAt: new Date(),
      period: period as any
    };
  }
  
  private calculateSimpleEngagementScore(session: SessionSummary): number {
    let score = 0;
    
    // Duration score (up to 40 points)
    score += Math.min(40, (session.duration / 1000 / 60) * 2); // 2 points per minute, max 40
    
    // Interaction score (up to 30 points)
    score += Math.min(30, session.interactions * 3);
    
    // Page view score (up to 20 points)
    score += Math.min(20, session.pageViews * 2);
    
    // Penalty for errors (up to -10 points)
    score -= Math.min(10, session.errors * 5);
    
    // Bounce penalty
    if (session.bounced) score *= 0.5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private shouldCheckForAnomalies(event: UserEvent): boolean {
    return event.eventCategory === 'error' || 
           event.eventType.includes('performance') ||
           event.duration && event.duration > 60000; // Over 1 minute
  }
  
  private async updateRealTimeMetrics(event: UserEvent): Promise<void> {
    // This could update real-time dashboards, alerts, etc.
    // For now, we'll just log significant events
    if (event.eventCategory === 'error') {
      console.warn(`User ${event.userId} encountered error: ${event.eventType}`);
    }
  }
  
  private async detectRealTimeAnomalies(event: UserEvent): Promise<void> {
    // Simple real-time anomaly detection
    if (event.eventCategory === 'error') {
      const recentEvents = (this.events.get(event.userId) || [])
        .filter(e => Date.now() - e.timestamp.getTime() < 5 * 60 * 1000); // Last 5 minutes
      
      const recentErrors = recentEvents.filter(e => e.eventCategory === 'error');
      
      if (recentErrors.length > 3) {
        console.warn(`Real-time anomaly: User ${event.userId} has ${recentErrors.length} errors in the last 5 minutes`);
      }
    }
  }
  
  private async generateInsights(
    userId: string, 
    data: {
      engagementScore: EngagementScore,
      patterns: BehavioralPattern[],
      anomalies: Anomaly[],
      sessionSummaries: SessionSummary[]
    }
  ): Promise<string[]> {
    const insights: string[] = [];
    
    // Engagement insights
    if (data.engagementScore.overallScore > 80) {
      insights.push("User shows high engagement across all dimensions");
    } else if (data.engagementScore.overallScore < 40) {
      insights.push("User engagement is below average - consider intervention");
    }
    
    // Pattern insights
    const sequentialPatterns = data.patterns.filter(p => p.patternType === 'sequential');
    if (sequentialPatterns.length > 0) {
      insights.push(`User follows ${sequentialPatterns.length} consistent navigation patterns`);
    }
    
    // Anomaly insights
    const highSeverityAnomalies = data.anomalies.filter(a => a.severity === 'high');
    if (highSeverityAnomalies.length > 0) {
      insights.push(`${highSeverityAnomalies.length} high-severity anomalies detected - requires attention`);
    }
    
    // Session insights
    const avgSessionDuration = data.sessionSummaries.reduce((sum, s) => sum + s.duration, 0) / data.sessionSummaries.length / 1000 / 60;
    if (avgSessionDuration > 30) {
      insights.push("User demonstrates long session durations indicating high interest");
    } else if (avgSessionDuration < 5) {
      insights.push("Short session durations may indicate usability issues");
    }
    
    return insights;
  }
  
  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
  
  private generateAnomalyId(): string {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Clean up and stop processing
   */
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Get engine statistics
   */
  getStats() {
    const totalEvents = Array.from(this.events.values()).reduce((sum, events) => sum + events.length, 0);
    const totalPatterns = Array.from(this.patterns.values()).reduce((sum, patterns) => sum + patterns.length, 0);
    const totalAnomalies = Array.from(this.anomalies.values()).reduce((sum, anomalies) => sum + anomalies.length, 0);
    
    return {
      totalUsers: this.events.size,
      totalEvents,
      totalSessions: this.sessions.size,
      totalPatterns,
      totalAnomalies,
      queueSize: this.eventQueue.length,
      avgEventsPerUser: this.events.size > 0 ? totalEvents / this.events.size : 0,
      avgSessionDuration: Array.from(this.sessions.values()).reduce((sum, s) => sum + s.duration, 0) / this.sessions.size / 1000 / 60 // minutes
    };
  }
}

export default BehavioralTracker;