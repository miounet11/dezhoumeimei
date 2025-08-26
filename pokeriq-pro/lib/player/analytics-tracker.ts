/**
 * Analytics Tracker - Granular Progress Analytics Collection
 * Collects detailed learning analytics with real-time processing and insights
 */

import { createLogger } from '@/lib/logger';
import { EventEmitter } from 'events';

const logger = createLogger('analytics-tracker');

/**
 * Analytics Event Types
 */
export type AnalyticsEventType =
  | 'video_play'
  | 'video_pause'
  | 'video_seek'
  | 'video_speed_change'
  | 'video_complete'
  | 'interaction_click'
  | 'bookmark_add'
  | 'bookmark_remove'
  | 'note_create'
  | 'note_edit'
  | 'note_delete'
  | 'quiz_start'
  | 'quiz_answer'
  | 'quiz_complete'
  | 'assessment_start'
  | 'assessment_complete'
  | 'section_enter'
  | 'section_complete'
  | 'course_complete'
  | 'idle_start'
  | 'idle_end'
  | 'focus_lost'
  | 'focus_gained';

/**
 * Base Analytics Event Structure
 */
export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: Date;
  userId: string;
  courseId: string;
  sessionId: string;
  sectionId?: string;
  data: Record<string, any>;
  metadata: {
    userAgent: string;
    platform: string;
    screenResolution: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    connectionType?: string;
  };
}

/**
 * Video Analytics Data
 */
export interface VideoAnalytics {
  videoId: string;
  totalDuration: number;
  watchedSeconds: number;
  watchedPercentage: number;
  playbackEvents: PlaybackEvent[];
  seekEvents: SeekEvent[];
  qualityChanges: QualityEvent[];
  averageEngagement: number;
  dropoffPoints: DropoffPoint[];
  replaySegments: ReplaySegment[];
}

export interface PlaybackEvent {
  type: 'play' | 'pause' | 'ended';
  timestamp: Date;
  position: number;
  playbackRate: number;
}

export interface SeekEvent {
  timestamp: Date;
  fromPosition: number;
  toPosition: number;
  seekDirection: 'forward' | 'backward';
  seekDistance: number;
}

export interface QualityEvent {
  timestamp: Date;
  fromQuality: string;
  toQuality: string;
  reason: 'auto' | 'manual';
}

export interface DropoffPoint {
  position: number;
  count: number;
  percentage: number;
}

export interface ReplaySegment {
  startPosition: number;
  endPosition: number;
  replayCount: number;
}

/**
 * Interaction Analytics Data
 */
export interface InteractionAnalytics {
  totalClicks: number;
  clickHeatmap: ClickPoint[];
  mostInteractedElements: ElementInteraction[];
  scrollBehavior: ScrollEvent[];
  timeOnSection: number;
  engagementScore: number;
  attentionSpan: number;
  idleTime: number;
}

export interface ClickPoint {
  x: number;
  y: number;
  element: string;
  timestamp: Date;
  count: number;
}

export interface ElementInteraction {
  element: string;
  type: string;
  count: number;
  averageTimeSpent: number;
}

export interface ScrollEvent {
  timestamp: Date;
  scrollTop: number;
  scrollHeight: number;
  direction: 'up' | 'down';
  velocity: number;
}

/**
 * Assessment Analytics Data
 */
export interface AssessmentAnalytics {
  assessmentId: string;
  startTime: Date;
  endTime: Date;
  totalTimeSpent: number;
  questionAnalytics: QuestionAnalytics[];
  overallScore: number;
  skillBreakdown: SkillScore[];
  difficultyProgression: DifficultyPoint[];
  attemptPattern: AttemptPattern;
}

export interface QuestionAnalytics {
  questionId: string;
  timeSpent: number;
  attempts: number;
  correct: boolean;
  confidenceLevel?: number;
  hesitationTime: number;
  changedAnswer: boolean;
}

export interface SkillScore {
  skill: string;
  score: number;
  questionsCount: number;
  confidenceLevel: number;
}

export interface DifficultyPoint {
  difficulty: number;
  accuracy: number;
  timeSpent: number;
}

export interface AttemptPattern {
  rushingTendency: number; // 0-1 scale
  overthinkingTendency: number; // 0-1 scale
  consistencyScore: number; // 0-1 scale
  improvementRate: number;
}

/**
 * Learning Pattern Analytics
 */
export interface LearningPatterns {
  studyTimeDistribution: TimeDistribution[];
  preferredStudyTimes: StudyTimePreference[];
  sessionLengthPreference: number;
  breakPatterns: BreakPattern[];
  contentConsumptionStyle: ConsumptionStyle;
  retentionRate: RetentionMetric[];
  masteryProgression: MasteryPoint[];
}

export interface TimeDistribution {
  hour: number;
  minutes: number;
  engagementLevel: number;
}

export interface StudyTimePreference {
  timeSlot: string;
  frequency: number;
  averageEngagement: number;
}

export interface BreakPattern {
  averageBreakLength: number;
  breakFrequency: number;
  breakTriggers: string[];
}

export interface ConsumptionStyle {
  videoPreference: number; // 0-1 scale
  textPreference: number;
  interactivePreference: number;
  averagePlaybackSpeed: number;
  skipTendency: number;
  repeatTendency: number;
}

export interface RetentionMetric {
  timeInterval: string; // '1day', '3days', '1week', etc.
  retentionScore: number;
  contentType: string;
}

export interface MasteryPoint {
  skill: string;
  timestamp: Date;
  masteryLevel: number; // 0-1 scale
  confidenceLevel: number;
}

/**
 * Analytics Tracker Class
 */
export class AnalyticsTracker extends EventEmitter {
  private userId: string;
  private courseId: string;
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private currentSection?: string;
  private sessionStartTime: Date;
  private lastActivityTime: Date;
  private isIdle = false;
  private idleTimer: NodeJS.Timeout | null = null;
  private idleThreshold = 30000; // 30 seconds
  private batchSize = 50;
  private flushInterval = 60000; // 1 minute
  private flushTimer: NodeJS.Timeout | null = null;

  // Analytics aggregators
  private videoAnalytics = new Map<string, VideoAnalytics>();
  private interactionAnalytics = new Map<string, InteractionAnalytics>();
  private assessmentAnalytics = new Map<string, AssessmentAnalytics>();

  constructor(userId: string, courseId: string, sessionId?: string) {
    super();
    this.userId = userId;
    this.courseId = courseId;
    this.sessionId = sessionId || this.generateSessionId();
    this.sessionStartTime = new Date();
    this.lastActivityTime = new Date();

    this.initializeTracking();
    this.startFlushTimer();
  }

  /**
   * Initialize tracking systems
   */
  private initializeTracking(): void {
    // Track page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.trackEvent('focus_lost', {});
        } else {
          this.trackEvent('focus_gained', {});
        }
      });

      // Track user interactions
      this.setupInteractionTracking();
    }

    logger.info('Analytics tracking initialized', {
      userId: this.userId,
      courseId: this.courseId,
      sessionId: this.sessionId
    });
  }

  /**
   * Track a generic analytics event
   */
  trackEvent(type: AnalyticsEventType, data: Record<string, any>): void {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type,
      timestamp: new Date(),
      userId: this.userId,
      courseId: this.courseId,
      sessionId: this.sessionId,
      sectionId: this.currentSection,
      data,
      metadata: this.getDeviceMetadata()
    };

    this.events.push(event);
    this.updateLastActivity();
    this.processEvent(event);

    // Emit event for real-time listeners
    this.emit('analytics_event', event);

    // Auto-flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Track video-specific events
   */
  trackVideoEvent(
    videoId: string,
    eventType: 'play' | 'pause' | 'seek' | 'speed_change' | 'quality_change' | 'ended',
    data: Record<string, any>
  ): void {
    const analytics = this.getOrCreateVideoAnalytics(videoId, data.duration || 0);

    switch (eventType) {
      case 'play':
      case 'pause':
      case 'ended':
        analytics.playbackEvents.push({
          type: eventType,
          timestamp: new Date(),
          position: data.position || 0,
          playbackRate: data.playbackRate || 1
        });
        break;

      case 'seek':
        analytics.seekEvents.push({
          timestamp: new Date(),
          fromPosition: data.fromPosition || 0,
          toPosition: data.toPosition || 0,
          seekDirection: data.toPosition > data.fromPosition ? 'forward' : 'backward',
          seekDistance: Math.abs((data.toPosition || 0) - (data.fromPosition || 0))
        });
        break;

      case 'quality_change':
        analytics.qualityChanges.push({
          timestamp: new Date(),
          fromQuality: data.fromQuality || 'auto',
          toQuality: data.toQuality || 'auto',
          reason: data.reason || 'auto'
        });
        break;
    }

    // Update watched time and percentage
    if (eventType === 'ended' || data.watchedTime) {
      analytics.watchedSeconds = data.watchedTime || analytics.watchedSeconds;
      analytics.watchedPercentage = (analytics.watchedSeconds / analytics.totalDuration) * 100;
    }

    this.trackEvent(`video_${eventType}` as AnalyticsEventType, {
      videoId,
      ...data
    });
  }

  /**
   * Track interaction events with detailed analytics
   */
  trackInteraction(
    element: string,
    interactionType: string,
    data: Record<string, any> = {}
  ): void {
    const sectionKey = this.currentSection || 'unknown';
    const analytics = this.getOrCreateInteractionAnalytics(sectionKey);

    analytics.totalClicks++;

    // Track click position if available
    if (data.x && data.y) {
      analytics.clickHeatmap.push({
        x: data.x,
        y: data.y,
        element,
        timestamp: new Date(),
        count: 1
      });
    }

    // Update element interaction stats
    const elementInteraction = analytics.mostInteractedElements.find(e => e.element === element);
    if (elementInteraction) {
      elementInteraction.count++;
      elementInteraction.averageTimeSpent = (
        (elementInteraction.averageTimeSpent * (elementInteraction.count - 1) + 
         (data.timeSpent || 0)) / elementInteraction.count
      );
    } else {
      analytics.mostInteractedElements.push({
        element,
        type: interactionType,
        count: 1,
        averageTimeSpent: data.timeSpent || 0
      });
    }

    this.trackEvent('interaction_click', {
      element,
      interactionType,
      ...data
    });
  }

  /**
   * Track assessment progress and performance
   */
  trackAssessment(
    assessmentId: string,
    eventType: 'start' | 'question_answer' | 'complete',
    data: Record<string, any>
  ): void {
    const analytics = this.getOrCreateAssessmentAnalytics(assessmentId);

    switch (eventType) {
      case 'start':
        analytics.startTime = new Date();
        break;

      case 'question_answer':
        if (data.questionId) {
          const questionAnalytics: QuestionAnalytics = {
            questionId: data.questionId,
            timeSpent: data.timeSpent || 0,
            attempts: data.attempts || 1,
            correct: data.correct || false,
            confidenceLevel: data.confidenceLevel,
            hesitationTime: data.hesitationTime || 0,
            changedAnswer: data.changedAnswer || false
          };

          const existingIndex = analytics.questionAnalytics.findIndex(
            q => q.questionId === data.questionId
          );

          if (existingIndex >= 0) {
            analytics.questionAnalytics[existingIndex] = questionAnalytics;
          } else {
            analytics.questionAnalytics.push(questionAnalytics);
          }
        }
        break;

      case 'complete':
        analytics.endTime = new Date();
        analytics.totalTimeSpent = analytics.endTime.getTime() - analytics.startTime.getTime();
        analytics.overallScore = data.score || 0;
        analytics.skillBreakdown = data.skillBreakdown || [];
        analytics.attemptPattern = this.calculateAttemptPattern(analytics);
        break;
    }

    this.trackEvent(`assessment_${eventType}` as AnalyticsEventType, {
      assessmentId,
      ...data
    });
  }

  /**
   * Track section navigation
   */
  trackSectionChange(newSectionId: string, oldSectionId?: string): void {
    if (oldSectionId) {
      this.trackEvent('section_complete', {
        sectionId: oldSectionId,
        timeSpent: this.getSectionTimeSpent(oldSectionId)
      });
    }

    this.currentSection = newSectionId;
    this.trackEvent('section_enter', {
      sectionId: newSectionId,
      fromSection: oldSectionId
    });
  }

  /**
   * Get comprehensive learning analytics
   */
  getLearningAnalytics(): LearningPatterns {
    return this.calculateLearningPatterns();
  }

  /**
   * Get video analytics for specific video
   */
  getVideoAnalytics(videoId: string): VideoAnalytics | null {
    return this.videoAnalytics.get(videoId) || null;
  }

  /**
   * Get interaction analytics for section
   */
  getInteractionAnalytics(sectionId: string): InteractionAnalytics | null {
    return this.interactionAnalytics.get(sectionId) || null;
  }

  /**
   * Get assessment analytics
   */
  getAssessmentAnalytics(assessmentId: string): AssessmentAnalytics | null {
    return this.assessmentAnalytics.get(assessmentId) || null;
  }

  /**
   * Force flush all pending events
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      await this.sendAnalyticsData(eventsToFlush);
      
      logger.info('Analytics data flushed', {
        eventCount: eventsToFlush.length,
        sessionId: this.sessionId
      });

      this.emit('analytics_flushed', {
        eventCount: eventsToFlush.length,
        timestamp: new Date()
      });

    } catch (error) {
      // Re-add events back to queue on failure
      this.events.unshift(...eventsToFlush);
      
      logger.error('Failed to flush analytics data', { error });
      
      this.emit('analytics_flush_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventCount: eventsToFlush.length
      });
    }
  }

  /**
   * Cleanup and destroy tracker
   */
  destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    // Final flush
    this.flush();

    this.removeAllListeners();
    
    logger.info('Analytics tracker destroyed', {
      sessionId: this.sessionId,
      eventsTracked: this.events.length
    });
  }

  // ===== PRIVATE METHODS =====

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceMetadata() {
    if (typeof window === 'undefined') {
      return {
        userAgent: 'server',
        platform: 'server',
        screenResolution: '0x0',
        deviceType: 'desktop' as const
      };
    }

    const { screen, navigator } = window;
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      deviceType: this.detectDeviceType(),
      connectionType: this.getConnectionType()
    };
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getConnectionType(): string {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      return (navigator as any).connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private setupInteractionTracking(): void {
    if (typeof document === 'undefined') return;

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackInteraction(
        target.tagName.toLowerCase(),
        'click',
        {
          x: event.clientX,
          y: event.clientY,
          targetId: target.id,
          targetClass: target.className
        }
      );
    });

    // Track scroll behavior
    let lastScrollTop = 0;
    let scrollTimeout: NodeJS.Timeout;

    document.addEventListener('scroll', (event) => {
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const direction = scrollTop > lastScrollTop ? 'down' : 'up';
        const velocity = Math.abs(scrollTop - lastScrollTop);

        if (this.currentSection) {
          const analytics = this.getOrCreateInteractionAnalytics(this.currentSection);
          analytics.scrollBehavior.push({
            timestamp: new Date(),
            scrollTop,
            scrollHeight,
            direction,
            velocity
          });
        }

        lastScrollTop = scrollTop;
      }, 100);
    });
  }

  private updateLastActivity(): void {
    this.lastActivityTime = new Date();
    
    if (this.isIdle) {
      this.isIdle = false;
      this.trackEvent('idle_end', {
        idleDuration: Date.now() - this.lastActivityTime.getTime()
      });
    }

    // Reset idle timer
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      if (!this.isIdle) {
        this.isIdle = true;
        this.trackEvent('idle_start', {});
      }
    }, this.idleThreshold);
  }

  private processEvent(event: AnalyticsEvent): void {
    // Update relevant analytics based on event type
    switch (event.type) {
      case 'video_play':
      case 'video_pause':
      case 'video_seek':
        this.updateVideoEngagement(event);
        break;
        
      case 'interaction_click':
        this.updateInteractionMetrics(event);
        break;
        
      case 'section_enter':
        this.startSectionTracking(event.data.sectionId);
        break;
    }
  }

  private updateVideoEngagement(event: AnalyticsEvent): void {
    const videoId = event.data.videoId;
    if (!videoId) return;

    const analytics = this.videoAnalytics.get(videoId);
    if (!analytics) return;

    // Calculate engagement based on play/pause patterns
    const playEvents = analytics.playbackEvents.filter(e => e.type === 'play');
    const pauseEvents = analytics.playbackEvents.filter(e => e.type === 'pause');
    
    if (playEvents.length > 0) {
      const totalPlayTime = playEvents.reduce((sum, event) => {
        const nextPause = pauseEvents.find(p => p.timestamp > event.timestamp);
        const duration = nextPause 
          ? nextPause.timestamp.getTime() - event.timestamp.getTime()
          : 30000; // Default 30 seconds if no pause found
        
        return sum + Math.min(duration, 300000); // Cap at 5 minutes
      }, 0);

      analytics.averageEngagement = Math.min(100, (totalPlayTime / 1000) / (analytics.totalDuration / 100));
    }
  }

  private updateInteractionMetrics(event: AnalyticsEvent): void {
    const sectionId = event.sectionId || 'unknown';
    const analytics = this.getOrCreateInteractionAnalytics(sectionId);
    
    // Update engagement score based on interaction frequency
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();
    const interactionsPerMinute = (analytics.totalClicks / (sessionDuration / 60000)) || 0;
    
    analytics.engagementScore = Math.min(100, interactionsPerMinute * 10);
  }

  private startSectionTracking(sectionId: string): void {
    // Initialize section-specific tracking
    this.getOrCreateInteractionAnalytics(sectionId);
  }

  private getSectionTimeSpent(sectionId: string): number {
    // Calculate time spent in section based on events
    const sectionEvents = this.events.filter(e => e.sectionId === sectionId);
    if (sectionEvents.length < 2) return 0;

    const firstEvent = sectionEvents[0];
    const lastEvent = sectionEvents[sectionEvents.length - 1];
    
    return lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
  }

  private getOrCreateVideoAnalytics(videoId: string, duration: number): VideoAnalytics {
    if (!this.videoAnalytics.has(videoId)) {
      this.videoAnalytics.set(videoId, {
        videoId,
        totalDuration: duration,
        watchedSeconds: 0,
        watchedPercentage: 0,
        playbackEvents: [],
        seekEvents: [],
        qualityChanges: [],
        averageEngagement: 0,
        dropoffPoints: [],
        replaySegments: []
      });
    }
    return this.videoAnalytics.get(videoId)!;
  }

  private getOrCreateInteractionAnalytics(sectionId: string): InteractionAnalytics {
    if (!this.interactionAnalytics.has(sectionId)) {
      this.interactionAnalytics.set(sectionId, {
        totalClicks: 0,
        clickHeatmap: [],
        mostInteractedElements: [],
        scrollBehavior: [],
        timeOnSection: 0,
        engagementScore: 0,
        attentionSpan: 0,
        idleTime: 0
      });
    }
    return this.interactionAnalytics.get(sectionId)!;
  }

  private getOrCreateAssessmentAnalytics(assessmentId: string): AssessmentAnalytics {
    if (!this.assessmentAnalytics.has(assessmentId)) {
      this.assessmentAnalytics.set(assessmentId, {
        assessmentId,
        startTime: new Date(),
        endTime: new Date(),
        totalTimeSpent: 0,
        questionAnalytics: [],
        overallScore: 0,
        skillBreakdown: [],
        difficultyProgression: [],
        attemptPattern: {
          rushingTendency: 0,
          overthinkingTendency: 0,
          consistencyScore: 0,
          improvementRate: 0
        }
      });
    }
    return this.assessmentAnalytics.get(assessmentId)!;
  }

  private calculateAttemptPattern(analytics: AssessmentAnalytics): AttemptPattern {
    const questions = analytics.questionAnalytics;
    if (questions.length === 0) {
      return {
        rushingTendency: 0,
        overthinkingTendency: 0,
        consistencyScore: 0,
        improvementRate: 0
      };
    }

    // Calculate rushing tendency (too fast answers)
    const avgTimeSpent = questions.reduce((sum, q) => sum + q.timeSpent, 0) / questions.length;
    const rushingQuestions = questions.filter(q => q.timeSpent < avgTimeSpent * 0.5).length;
    const rushingTendency = rushingQuestions / questions.length;

    // Calculate overthinking tendency (too slow answers)
    const overthinkingQuestions = questions.filter(q => q.timeSpent > avgTimeSpent * 2).length;
    const overthinkingTendency = overthinkingQuestions / questions.length;

    // Calculate consistency (similar performance across questions)
    const correctAnswers = questions.filter(q => q.correct).length;
    const consistencyScore = 1 - (Math.abs(correctAnswers - (questions.length * 0.7)) / questions.length);

    // Calculate improvement rate (performance gets better over time)
    const firstHalf = questions.slice(0, Math.floor(questions.length / 2));
    const secondHalf = questions.slice(Math.floor(questions.length / 2));
    
    const firstHalfAccuracy = firstHalf.filter(q => q.correct).length / firstHalf.length;
    const secondHalfAccuracy = secondHalf.filter(q => q.correct).length / secondHalf.length;
    const improvementRate = Math.max(0, secondHalfAccuracy - firstHalfAccuracy);

    return {
      rushingTendency,
      overthinkingTendency,
      consistencyScore: Math.max(0, consistencyScore),
      improvementRate
    };
  }

  private calculateLearningPatterns(): LearningPatterns {
    // Analyze all collected data to extract learning patterns
    const hourDistribution = new Map<number, { minutes: number; engagement: number }>();
    
    // Process events to build patterns
    this.events.forEach(event => {
      const hour = event.timestamp.getHours();
      const current = hourDistribution.get(hour) || { minutes: 0, engagement: 0 };
      
      hourDistribution.set(hour, {
        minutes: current.minutes + 1,
        engagement: current.engagement + (event.type.includes('interaction') ? 1 : 0.5)
      });
    });

    const studyTimeDistribution = Array.from(hourDistribution.entries()).map(([hour, data]) => ({
      hour,
      minutes: data.minutes,
      engagementLevel: Math.min(100, data.engagement * 10)
    }));

    // Calculate other patterns...
    return {
      studyTimeDistribution,
      preferredStudyTimes: this.calculatePreferredStudyTimes(studyTimeDistribution),
      sessionLengthPreference: this.calculateSessionLengthPreference(),
      breakPatterns: [],
      contentConsumptionStyle: this.calculateConsumptionStyle(),
      retentionRate: [],
      masteryProgression: []
    };
  }

  private calculatePreferredStudyTimes(distribution: TimeDistribution[]): StudyTimePreference[] {
    return distribution
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3)
      .map(d => ({
        timeSlot: `${d.hour}:00-${d.hour + 1}:00`,
        frequency: d.minutes,
        averageEngagement: d.engagementLevel
      }));
  }

  private calculateSessionLengthPreference(): number {
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();
    return Math.round(sessionDuration / 60000); // Convert to minutes
  }

  private calculateConsumptionStyle(): ConsumptionStyle {
    const videoEvents = this.events.filter(e => e.type.startsWith('video_'));
    const interactionEvents = this.events.filter(e => e.type === 'interaction_click');
    
    const totalEvents = this.events.length;
    const videoPreference = totalEvents > 0 ? videoEvents.length / totalEvents : 0;
    const interactivePreference = totalEvents > 0 ? interactionEvents.length / totalEvents : 0;
    
    // Calculate average playback speed from video events
    const speedChangeEvents = videoEvents.filter(e => e.type === 'video_speed_change');
    const averagePlaybackSpeed = speedChangeEvents.length > 0
      ? speedChangeEvents.reduce((sum, e) => sum + (e.data.playbackRate || 1), 0) / speedChangeEvents.length
      : 1;

    return {
      videoPreference,
      textPreference: Math.max(0, 1 - videoPreference - interactivePreference),
      interactivePreference,
      averagePlaybackSpeed,
      skipTendency: 0, // Would need seek analysis
      repeatTendency: 0 // Would need replay analysis
    };
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async sendAnalyticsData(events: AnalyticsEvent[]): Promise<void> {
    // In a real implementation, this would send data to analytics service
    // For now, we'll just log it
    logger.info('Sending analytics data', {
      eventCount: events.length,
      sessionId: this.sessionId,
      userId: this.userId,
      courseId: this.courseId
    });

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }
}

/**
 * Factory function to create AnalyticsTracker instance
 */
export function createAnalyticsTracker(
  userId: string,
  courseId: string,
  sessionId?: string
): AnalyticsTracker {
  return new AnalyticsTracker(userId, courseId, sessionId);
}

export default AnalyticsTracker;