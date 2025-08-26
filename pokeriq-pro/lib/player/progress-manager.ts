/**
 * Progress Manager - Real-time Progress Tracking & Database Sync
 * Handles all progress-related operations with real-time updates and cross-device sync
 */

import { createLogger } from '@/lib/logger';
import { ProgressQueries } from '@/lib/db/queries/progress';
import { PlayerProgressData, ProgressAnalytics, TestScore } from '@/components/player/ProgressTracker';
import { EventEmitter } from 'events';

const logger = createLogger('progress-manager');

/**
 * Progress Event Types for real-time updates
 */
export type ProgressEventType = 
  | 'progress_updated'
  | 'section_completed'
  | 'course_completed'
  | 'analytics_updated'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed';

export interface ProgressEvent {
  type: ProgressEventType;
  data: any;
  timestamp: Date;
  userId: string;
  courseId?: string;
}

export interface ProgressUpdateOptions {
  syncToDatabase?: boolean;
  throttleMs?: number;
  skipAnalytics?: boolean;
  metadata?: Record<string, any>;
}

export interface WatchTimeData {
  sectionId: string;
  watchedSeconds: number;
  totalSeconds: number;
  timestamp: Date;
  playbackRate?: number;
  interactions?: Array<{
    type: 'pause' | 'seek' | 'speed_change' | 'interaction';
    timestamp: number;
    data?: any;
  }>;
}

export interface InteractionData {
  type: 'click' | 'bookmark' | 'note' | 'quiz_attempt' | 'quiz_complete' | 'seek';
  timestamp: Date;
  data: any;
  sectionId?: string;
  position?: number; // video position in seconds
}

/**
 * Progress Manager Class
 * Manages real-time progress tracking with database synchronization
 */
export class ProgressManager extends EventEmitter {
  private userId: string;
  private courseId: string;
  private currentProgress: PlayerProgressData;
  private currentAnalytics: ProgressAnalytics;
  private syncQueue: Array<() => Promise<void>> = [];
  private isSyncing = false;
  private lastSyncTime = 0;
  private updateThrottle = 5000; // 5 seconds default throttle
  private watchTimeBuffer: WatchTimeData[] = [];
  private interactionBuffer: InteractionData[] = [];
  private activeWatchTimer: NodeJS.Timeout | null = null;

  constructor(userId: string, courseId: string) {
    super();
    this.userId = userId;
    this.courseId = courseId;
    
    // Initialize with default values
    this.currentProgress = {
      courseId,
      userId,
      completionRate: 0,
      currentSection: 1,
      studyTimeMinutes: 0,
      lastAccessed: new Date(),
      testScores: []
    };

    this.currentAnalytics = {
      totalWatchTime: 0,
      avgWatchTimePerSection: 0,
      interactionCount: 0,
      bookmarkCount: 0,
      noteCount: 0,
      quizAttempts: 0,
      quizSuccessRate: 0,
      engagementScore: 0,
      learningVelocity: 1.0,
      consistencyScore: 0
    };
  }

  /**
   * Initialize progress manager with existing data
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing progress manager', {
        userId: this.userId,
        courseId: this.courseId
      });

      // Load existing progress from database
      const progressResult = await ProgressQueries.getUserProgress(
        this.userId,
        this.courseId,
        true
      );

      if (progressResult.success && progressResult.data) {
        this.currentProgress = {
          ...progressResult.data,
          lastAccessed: new Date(progressResult.data.lastAccessed),
          completedAt: progressResult.data.completedAt 
            ? new Date(progressResult.data.completedAt) 
            : null
        };
      }

      // Load analytics (this would come from a separate analytics store/cache)
      await this.loadAnalytics();

      // Start background sync process
      this.startBackgroundSync();

      logger.info('Progress manager initialized successfully', {
        userId: this.userId,
        courseId: this.courseId,
        completionRate: this.currentProgress.completionRate
      });

    } catch (error) {
      logger.error('Failed to initialize progress manager', {
        error,
        userId: this.userId,
        courseId: this.courseId
      });
      throw error;
    }
  }

  /**
   * Get current progress data
   */
  getProgress(): PlayerProgressData {
    return { ...this.currentProgress };
  }

  /**
   * Get current analytics data
   */
  getAnalytics(): ProgressAnalytics {
    return { ...this.currentAnalytics };
  }

  /**
   * Update completion rate with real-time sync
   */
  async updateCompletionRate(
    completionRate: number,
    options: ProgressUpdateOptions = {}
  ): Promise<void> {
    const previousRate = this.currentProgress.completionRate;
    this.currentProgress.completionRate = Math.max(0, Math.min(100, completionRate));
    this.currentProgress.lastAccessed = new Date();

    // Check for section or course completion
    if (completionRate >= 100 && previousRate < 100) {
      this.currentProgress.completedAt = new Date();
      this.emit('course_completed', {
        type: 'course_completed',
        data: { ...this.currentProgress },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });
    }

    // Update analytics
    if (!options.skipAnalytics) {
      this.updateEngagementScore();
    }

    // Queue database sync
    if (options.syncToDatabase !== false) {
      this.queueSync(() => this.syncProgressToDatabase());
    }

    this.emit('progress_updated', {
      type: 'progress_updated',
      data: { completionRate, previousRate },
      timestamp: new Date(),
      userId: this.userId,
      courseId: this.courseId
    });
  }

  /**
   * Update current section
   */
  async updateCurrentSection(
    section: number,
    options: ProgressUpdateOptions = {}
  ): Promise<void> {
    const previousSection = this.currentProgress.currentSection;
    this.currentProgress.currentSection = section;
    this.currentProgress.lastAccessed = new Date();

    // Check for section completion
    if (section > previousSection) {
      this.emit('section_completed', {
        type: 'section_completed',
        data: { section: previousSection, newSection: section },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });
    }

    // Queue database sync
    if (options.syncToDatabase !== false) {
      this.queueSync(() => this.syncProgressToDatabase());
    }

    this.emit('progress_updated', {
      type: 'progress_updated',
      data: { section, previousSection },
      timestamp: new Date(),
      userId: this.userId,
      courseId: this.courseId
    });
  }

  /**
   * Track video watch time with real-time updates
   */
  trackWatchTime(watchData: WatchTimeData): void {
    this.watchTimeBuffer.push(watchData);
    
    // Update study time
    const additionalMinutes = Math.floor(watchData.watchedSeconds / 60);
    this.currentProgress.studyTimeMinutes += additionalMinutes;
    this.currentProgress.lastAccessed = new Date();

    // Update analytics
    this.currentAnalytics.totalWatchTime += watchData.watchedSeconds;
    this.updateLearningVelocity();
    this.updateEngagementScore();

    // Process buffer if it gets too large
    if (this.watchTimeBuffer.length >= 10) {
      this.processWatchTimeBuffer();
    }

    this.emit('analytics_updated', {
      type: 'analytics_updated',
      data: { watchTime: watchData.watchedSeconds },
      timestamp: new Date(),
      userId: this.userId,
      courseId: this.courseId
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(interaction: InteractionData): void {
    this.interactionBuffer.push(interaction);
    
    // Update analytics based on interaction type
    this.currentAnalytics.interactionCount++;
    
    switch (interaction.type) {
      case 'bookmark':
        this.currentAnalytics.bookmarkCount++;
        break;
      case 'note':
        this.currentAnalytics.noteCount++;
        break;
      case 'quiz_attempt':
        this.currentAnalytics.quizAttempts++;
        break;
      case 'quiz_complete':
        this.updateQuizSuccessRate(interaction.data);
        break;
    }

    this.updateEngagementScore();
    this.currentProgress.lastAccessed = new Date();

    // Process buffer if it gets too large
    if (this.interactionBuffer.length >= 20) {
      this.processInteractionBuffer();
    }

    this.emit('analytics_updated', {
      type: 'analytics_updated',
      data: { interaction },
      timestamp: new Date(),
      userId: this.userId,
      courseId: this.courseId
    });
  }

  /**
   * Add test score with real-time analytics update
   */
  async addTestScore(testScore: TestScore, options: ProgressUpdateOptions = {}): Promise<void> {
    this.currentProgress.testScores.push(testScore);
    this.currentProgress.lastAccessed = new Date();

    // Update quiz success rate
    this.updateQuizSuccessRate({
      score: testScore.score,
      maxScore: testScore.maxScore,
      passed: (testScore.score / testScore.maxScore) >= 0.7 // 70% pass threshold
    });

    // Queue database sync
    if (options.syncToDatabase !== false) {
      this.queueSync(() => this.syncTestScore(testScore));
    }

    this.emit('analytics_updated', {
      type: 'analytics_updated',
      data: { testScore },
      timestamp: new Date(),
      userId: this.userId,
      courseId: this.courseId
    });
  }

  /**
   * Start active watch session tracking
   */
  startWatchSession(): void {
    if (this.activeWatchTimer) {
      clearInterval(this.activeWatchTimer);
    }

    this.activeWatchTimer = setInterval(() => {
      // Track 1 second of watch time
      this.trackWatchTime({
        sectionId: this.currentProgress.currentSection.toString(),
        watchedSeconds: 1,
        totalSeconds: 1,
        timestamp: new Date()
      });
    }, 1000);
  }

  /**
   * Stop active watch session tracking
   */
  stopWatchSession(): void {
    if (this.activeWatchTimer) {
      clearInterval(this.activeWatchTimer);
      this.activeWatchTimer = null;
    }

    // Process any remaining buffered data
    this.processWatchTimeBuffer();
    this.processInteractionBuffer();
  }

  /**
   * Force sync all pending changes to database
   */
  async forceSync(): Promise<void> {
    this.processWatchTimeBuffer();
    this.processInteractionBuffer();
    await this.processSyncQueue();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopWatchSession();
    this.removeAllListeners();
    this.syncQueue = [];
  }

  // ===== PRIVATE METHODS =====

  /**
   * Load analytics data from cache/database
   */
  private async loadAnalytics(): Promise<void> {
    try {
      // In a real implementation, this would load from analytics storage
      // For now, we calculate basic analytics from progress data
      
      const totalSections = this.currentProgress.currentSection;
      const totalStudyTime = this.currentProgress.studyTimeMinutes * 60; // convert to seconds
      
      this.currentAnalytics = {
        ...this.currentAnalytics,
        totalWatchTime: totalStudyTime,
        avgWatchTimePerSection: totalSections > 0 ? totalStudyTime / totalSections : 0,
        quizAttempts: this.currentProgress.testScores.length,
        quizSuccessRate: this.calculateQuizSuccessRate()
      };

    } catch (error) {
      logger.error('Failed to load analytics', { error });
    }
  }

  /**
   * Calculate quiz success rate from test scores
   */
  private calculateQuizSuccessRate(): number {
    if (this.currentProgress.testScores.length === 0) return 0;
    
    const passedTests = this.currentProgress.testScores.filter(
      score => (score.score / score.maxScore) >= 0.7
    ).length;
    
    return (passedTests / this.currentProgress.testScores.length) * 100;
  }

  /**
   * Update learning velocity based on progress rate
   */
  private updateLearningVelocity(): void {
    const expectedProgressRate = 1.0; // baseline
    const actualProgressRate = this.currentProgress.completionRate / 100;
    const timeSpentHours = this.currentAnalytics.totalWatchTime / 3600;
    
    if (timeSpentHours > 0) {
      this.currentAnalytics.learningVelocity = actualProgressRate / (timeSpentHours / 10);
    }
  }

  /**
   * Update engagement score based on multiple factors
   */
  private updateEngagementScore(): void {
    const watchTimeScore = Math.min(100, (this.currentAnalytics.totalWatchTime / 3600) * 20);
    const interactionScore = Math.min(100, this.currentAnalytics.interactionCount * 2);
    const quizScore = this.currentAnalytics.quizSuccessRate;
    
    this.currentAnalytics.engagementScore = Math.round(
      (watchTimeScore * 0.3) + (interactionScore * 0.4) + (quizScore * 0.3)
    );
  }

  /**
   * Update quiz success rate from new quiz data
   */
  private updateQuizSuccessRate(quizData: any): void {
    this.currentAnalytics.quizAttempts++;
    
    if (quizData.passed) {
      const currentPassed = (this.currentAnalytics.quizSuccessRate / 100) * (this.currentAnalytics.quizAttempts - 1);
      this.currentAnalytics.quizSuccessRate = ((currentPassed + 1) / this.currentAnalytics.quizAttempts) * 100;
    } else {
      const currentPassed = (this.currentAnalytics.quizSuccessRate / 100) * (this.currentAnalytics.quizAttempts - 1);
      this.currentAnalytics.quizSuccessRate = (currentPassed / this.currentAnalytics.quizAttempts) * 100;
    }
  }

  /**
   * Process watch time buffer and update study time
   */
  private processWatchTimeBuffer(): void {
    if (this.watchTimeBuffer.length === 0) return;

    const totalSeconds = this.watchTimeBuffer.reduce((sum, item) => sum + item.watchedSeconds, 0);
    const additionalMinutes = Math.floor(totalSeconds / 60);

    if (additionalMinutes > 0) {
      this.queueSync(() => ProgressQueries.addStudyTime(
        this.userId,
        this.courseId,
        additionalMinutes
      ));
    }

    this.watchTimeBuffer = [];
  }

  /**
   * Process interaction buffer
   */
  private processInteractionBuffer(): void {
    if (this.interactionBuffer.length === 0) return;

    // In a real implementation, this would send interaction data to analytics service
    logger.info('Processing interactions', {
      count: this.interactionBuffer.length,
      userId: this.userId,
      courseId: this.courseId
    });

    this.interactionBuffer = [];
  }

  /**
   * Queue sync operation with throttling
   */
  private queueSync(syncOperation: () => Promise<void>): void {
    this.syncQueue.push(syncOperation);

    // Throttle sync operations
    if (Date.now() - this.lastSyncTime < this.updateThrottle) {
      return;
    }

    this.processSyncQueue();
  }

  /**
   * Process all queued sync operations
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.lastSyncTime = Date.now();

    this.emit('sync_started', {
      type: 'sync_started',
      data: { queueSize: this.syncQueue.length },
      timestamp: new Date(),
      userId: this.userId,
      courseId: this.courseId
    });

    try {
      const operations = [...this.syncQueue];
      this.syncQueue = [];

      await Promise.all(operations.map(op => op()));

      this.emit('sync_completed', {
        type: 'sync_completed',
        data: { operationsProcessed: operations.length },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });

    } catch (error) {
      logger.error('Sync failed', { error });
      
      this.emit('sync_failed', {
        type: 'sync_failed',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
        userId: this.userId,
        courseId: this.courseId
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync current progress to database
   */
  private async syncProgressToDatabase(): Promise<void> {
    try {
      await ProgressQueries.updateCompletionRate(
        this.userId,
        this.courseId,
        this.currentProgress.completionRate
      );

      await ProgressQueries.updateCurrentSection(
        this.userId,
        this.courseId,
        this.currentProgress.currentSection
      );

    } catch (error) {
      logger.error('Failed to sync progress to database', { error });
      throw error;
    }
  }

  /**
   * Sync test score to database
   */
  private async syncTestScore(testScore: TestScore): Promise<void> {
    try {
      await ProgressQueries.addTestScore(this.userId, this.courseId, testScore);
    } catch (error) {
      logger.error('Failed to sync test score to database', { error });
      throw error;
    }
  }

  /**
   * Start background sync process
   */
  private startBackgroundSync(): void {
    // Process sync queue every 10 seconds
    setInterval(() => {
      if (this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 10000);

    // Process buffers every 30 seconds
    setInterval(() => {
      this.processWatchTimeBuffer();
      this.processInteractionBuffer();
    }, 30000);
  }
}

/**
 * Factory function to create ProgressManager instance
 */
export function createProgressManager(userId: string, courseId: string): ProgressManager {
  return new ProgressManager(userId, courseId);
}

export default ProgressManager;