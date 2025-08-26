/**
 * Player Integration Service
 * Connects the video player system with existing Course and UserProgress models
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  ContentBlock, 
  ProgressData, 
  InteractionEvent, 
  Bookmark, 
  StudentNote, 
  AssessmentResult 
} from './content-types';
import { 
  Course, 
  UserProgress, 
  CreateUserProgressInput,
  UpdateUserProgressInput,
  TestScore
} from '../types/dezhoumama';
import { 
  updateCompletionRate, 
  addStudyTime, 
  updateCurrentSection,
  addTestScore,
  getUserProgress,
  upsertUserProgress
} from '../db/queries/progress';
import { getCourseById } from '../db/queries/courses';
import { createLogger } from '../logger';

const logger = createLogger('player-integration');

/**
 * Player Progress Integration Service
 * Handles synchronization between player progress and database
 */
export class PlayerProgressService {
  private userId: string;
  private courseId: string;
  private contentBlockId: string;
  private progressUpdateInterval: NodeJS.Timeout | null = null;
  private pendingUpdates: Partial<ProgressData> = {};

  constructor(userId: string, courseId: string, contentBlockId: string) {
    this.userId = userId;
    this.courseId = courseId;
    this.contentBlockId = contentBlockId;
    
    this.startProgressSync();
  }

  /**
   * Start automatic progress synchronization
   */
  private startProgressSync(): void {
    // Sync progress every 30 seconds
    this.progressUpdateInterval = setInterval(() => {
      this.syncProgress();
    }, 30000);
  }

  /**
   * Stop automatic progress synchronization
   */
  stopProgressSync(): void {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
      this.progressUpdateInterval = null;
    }
    
    // Final sync
    this.syncProgress();
  }

  /**
   * Update progress data
   */
  updateProgress(progressData: Partial<ProgressData>): void {
    this.pendingUpdates = {
      ...this.pendingUpdates,
      ...progressData,
      lastUpdated: new Date()
    };
  }

  /**
   * Sync pending progress updates to database
   */
  private async syncProgress(): Promise<void> {
    if (Object.keys(this.pendingUpdates).length === 0) return;

    try {
      const updates = { ...this.pendingUpdates };
      this.pendingUpdates = {}; // Clear pending updates

      // Update completion rate if provided
      if (updates.completionRate !== undefined) {
        await updateCompletionRate(this.userId, this.courseId, updates.completionRate);
      }

      // Add study time if watchTime is provided
      if (updates.watchTime !== undefined) {
        const studyMinutes = Math.floor(updates.watchTime / 60);
        if (studyMinutes > 0) {
          await addStudyTime(this.userId, this.courseId, studyMinutes);
        }
      }

      // Update current section if currentTime indicates section progress
      if (updates.currentTime !== undefined && updates.totalTime !== undefined) {
        // Calculate section based on time progress
        const progressPercentage = (updates.currentTime / updates.totalTime) * 100;
        const estimatedSection = Math.floor(progressPercentage / 10) + 1; // Assume 10 sections per course
        await updateCurrentSection(this.userId, this.courseId, estimatedSection);
      }

      // Add assessment results as test scores
      if (updates.assessmentScores && updates.assessmentScores.length > 0) {
        for (const assessmentResult of updates.assessmentScores) {
          const testScore: TestScore = {
            assessmentId: assessmentResult.assessmentId,
            score: assessmentResult.score,
            maxScore: assessmentResult.maxScore,
            percentage: assessmentResult.percentage,
            completedAt: assessmentResult.completedAt,
            timeTaken: assessmentResult.timeTaken,
            skillBreakdown: assessmentResult.answers ? {
              // Process answers into skill breakdown
              overall: {
                score: assessmentResult.score,
                maxScore: assessmentResult.maxScore,
                percentage: assessmentResult.percentage
              }
            } : undefined
          };

          await addTestScore(this.userId, this.courseId, testScore);
        }
      }

      logger.info('Progress synced successfully', {
        userId: this.userId,
        courseId: this.courseId,
        updates: Object.keys(updates)
      });
    } catch (error) {
      logger.error('Failed to sync progress', {
        error,
        userId: this.userId,
        courseId: this.courseId,
        updates: this.pendingUpdates
      });
    }
  }

  /**
   * Get current user progress from database
   */
  async getCurrentProgress(): Promise<UserProgress | null> {
    try {
      const result = await getUserProgress(this.userId, this.courseId);
      return result.success ? result.data as UserProgress : null;
    } catch (error) {
      logger.error('Failed to get current progress', { error, userId: this.userId, courseId: this.courseId });
      return null;
    }
  }

  /**
   * Mark content as completed
   */
  async markCompleted(): Promise<void> {
    try {
      await updateCompletionRate(this.userId, this.courseId, 100);
      logger.info('Content marked as completed', {
        userId: this.userId,
        courseId: this.courseId,
        contentBlockId: this.contentBlockId
      });
    } catch (error) {
      logger.error('Failed to mark content as completed', { error, userId: this.userId, courseId: this.courseId });
    }
  }
}

/**
 * Course Content Integration Service
 * Handles content structure and metadata for courses
 */
export class CourseContentService {
  /**
   * Get course with content structure
   */
  static async getCourseWithContent(courseId: string): Promise<{
    course: Course | null;
    contentBlocks: ContentBlock[];
  }> {
    try {
      const result = await getCourseById(courseId, true);
      
      if (!result.success || !result.data) {
        return {
          course: null,
          contentBlocks: []
        };
      }

      const course = result.data as Course;
      
      // Generate content blocks from course data
      const contentBlocks = await this.generateContentBlocks(course);

      return {
        course,
        contentBlocks
      };
    } catch (error) {
      logger.error('Failed to get course with content', { error, courseId });
      return {
        course: null,
        contentBlocks: []
      };
    }
  }

  /**
   * Generate content blocks from course data
   */
  private static async generateContentBlocks(course: Course): Promise<ContentBlock[]> {
    const contentBlocks: ContentBlock[] = [];

    // If course has video content
    if (course.videoUrl) {
      contentBlocks.push({
        id: `video_${course.id}`,
        type: 'video',
        order: 1,
        data: {
          content: {
            id: course.id,
            title: course.title,
            description: course.description || '',
            duration: (course.durationMinutes || 0) * 60, // Convert to seconds
            poster: course.thumbnailUrl || undefined,
            tracks: [
              {
                src: course.videoUrl,
                type: this.detectVideoType(course.videoUrl),
                quality: 'auto',
                label: 'Default'
              }
            ],
            metadata: {
              codec: 'h264',
              format: this.getVideoFormat(course.videoUrl),
              resolution: { width: 1920, height: 1080 },
              frameRate: 30,
              bitrate: 2000,
              size: 0,
              uploadedAt: course.createdAt,
              transcoded: true,
              qualities: [
                { label: 'Auto', height: 0, width: 0, bitrate: 0 },
                { label: '1080p', height: 1080, width: 1920, bitrate: 5000 },
                { label: '720p', height: 720, width: 1280, bitrate: 2500 },
                { label: '480p', height: 480, width: 854, bitrate: 1200 }
              ]
            }
          },
          metadata: {
            id: course.id,
            title: course.title,
            description: course.description || undefined,
            duration: (course.durationMinutes || 0) * 60,
            difficulty: this.mapCourseLevel(course.level),
            tags: course.tags,
            prerequisites: course.prerequisites,
            learningObjectives: [
              `Complete ${course.title}`,
              'Understand the key concepts',
              'Apply learned knowledge'
            ],
            lastUpdated: course.updatedAt,
            version: '1.0.0',
            author: 'PokerIQ Pro'
          },
          interactions: {
            enabled: true,
            allowNotes: true,
            allowBookmarks: true,
            allowDiscussion: true,
            trackProgress: true,
            requireCompletion: true,
            minimumWatchTime: 80 // 80% minimum watch time
          }
        }
      });
    }

    // If course has text content
    if (course.contentPath) {
      contentBlocks.push({
        id: `text_${course.id}`,
        type: 'text',
        order: course.videoUrl ? 2 : 1,
        data: {
          content: {
            format: 'markdown',
            content: await this.loadTextContent(course.contentPath),
            estimatedReadingTime: Math.max(5, Math.floor((course.durationMinutes || 20) / 2)),
            wordCount: 1000, // Estimated
            language: 'zh'
          },
          metadata: {
            id: `${course.id}_text`,
            title: `${course.title} - 文档内容`,
            description: course.description || undefined,
            difficulty: this.mapCourseLevel(course.level),
            tags: course.tags,
            lastUpdated: course.updatedAt,
            version: '1.0.0'
          },
          interactions: {
            enabled: true,
            allowNotes: true,
            allowBookmarks: true,
            trackProgress: true,
            requireCompletion: false,
            minimumWatchTime: 60
          }
        }
      });
    }

    // Add assessment content blocks if course has assessments
    // This would be populated from course.assessments if available
    
    return contentBlocks;
  }

  /**
   * Detect video type from URL
   */
  private static detectVideoType(url: string): string {
    if (url.includes('.m3u8')) return 'application/x-mpegURL';
    if (url.includes('.mpd')) return 'application/dash+xml';
    if (url.includes('.mp4')) return 'video/mp4';
    if (url.includes('.webm')) return 'video/webm';
    return 'video/mp4'; // default
  }

  /**
   * Get video format from URL
   */
  private static getVideoFormat(url: string): string {
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mpd')) return 'dash';
    if (url.includes('.mp4')) return 'mp4';
    if (url.includes('.webm')) return 'webm';
    return 'mp4';
  }

  /**
   * Map course level to content difficulty
   */
  private static mapCourseLevel(level: string): 'beginner' | 'intermediate' | 'advanced' {
    switch (level) {
      case 'BEGINNER': return 'beginner';
      case 'INTERMEDIATE': return 'intermediate';
      case 'ADVANCED': return 'advanced';
      default: return 'beginner';
    }
  }

  /**
   * Load text content from path
   */
  private static async loadTextContent(contentPath: string): Promise<string> {
    try {
      // In a real implementation, this would load from file system or API
      // For now, return placeholder content
      return `# Course Content\n\nThis is the course content loaded from: ${contentPath}\n\nContent will be loaded dynamically based on the course structure and requirements.`;
    } catch (error) {
      logger.error('Failed to load text content', { error, contentPath });
      return '# Content Not Available\n\nContent could not be loaded at this time.';
    }
  }
}

/**
 * Player Analytics Service
 * Tracks detailed player interactions and learning analytics
 */
export class PlayerAnalyticsService {
  private userId: string;
  private courseId: string;
  private sessionId: string;
  private interactions: InteractionEvent[] = [];

  constructor(userId: string, courseId: string, sessionId?: string) {
    this.userId = userId;
    this.courseId = courseId;
    this.sessionId = sessionId || this.generateSessionId();
  }

  /**
   * Track interaction event
   */
  trackInteraction(event: Omit<InteractionEvent, 'id' | 'metadata'>): void {
    const interaction: InteractionEvent = {
      ...event,
      id: this.generateInteractionId(),
      metadata: {
        sessionId: this.sessionId,
        deviceType: this.getDeviceType(),
        browserInfo: this.getBrowserInfo()
      }
    };

    this.interactions.push(interaction);

    // Send to analytics service (could be implemented later)
    this.sendToAnalytics(interaction);
  }

  /**
   * Get session interactions
   */
  getSessionInteractions(): InteractionEvent[] {
    return [...this.interactions];
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate interaction ID
   */
  private generateInteractionId(): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device type
   */
  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'server';
    
    const userAgent = window.navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  /**
   * Get browser info
   */
  private getBrowserInfo(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = window.navigator.userAgent;
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    return 'Unknown';
  }

  /**
   * Send interaction to analytics service
   */
  private sendToAnalytics(interaction: InteractionEvent): void {
    // This could send data to an analytics service
    // For now, just log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Player interaction tracked', {
        userId: this.userId,
        courseId: this.courseId,
        interaction: {
          type: interaction.type,
          timestamp: interaction.timestamp,
          data: interaction.data
        }
      });
    }
  }
}

/**
 * Player Hooks for React Components
 * Provides easy integration with React components
 */
export function usePlayerIntegration(userId: string, courseId: string, contentBlockId: string) {
  const [progressService] = useState(() => 
    new PlayerProgressService(userId, courseId, contentBlockId)
  );
  
  const [analyticsService] = useState(() => 
    new PlayerAnalyticsService(userId, courseId)
  );

  const [currentProgress, setCurrentProgress] = useState<UserProgress | null>(null);

  // Load initial progress
  useEffect(() => {
    progressService.getCurrentProgress().then(progress => {
      setCurrentProgress(progress);
    });

    return () => {
      progressService.stopProgressSync();
    };
  }, [progressService]);

  const updateProgress = useCallback((progressData: Partial<ProgressData>) => {
    progressService.updateProgress(progressData);
    
    // Track progress update
    analyticsService.trackInteraction({
      type: 'progress-update',
      timestamp: new Date(),
      data: {
        completionRate: progressData.completionRate,
        time: progressData.currentTime
      }
    });
  }, [progressService, analyticsService]);

  const trackInteraction = useCallback((type: string, data: any) => {
    analyticsService.trackInteraction({
      type,
      timestamp: new Date(),
      data
    });
  }, [analyticsService]);

  const markCompleted = useCallback(() => {
    progressService.markCompleted();
    setCurrentProgress(prev => prev ? { ...prev, completionRate: 100, completedAt: new Date() } : null);
    
    analyticsService.trackInteraction({
      type: 'content-completed',
      timestamp: new Date(),
      data: { contentBlockId }
    });
  }, [progressService, analyticsService, contentBlockId]);

  return {
    currentProgress,
    updateProgress,
    trackInteraction,
    markCompleted,
    sessionInteractions: analyticsService.getSessionInteractions()
  };
}

// Export services
export {
  PlayerProgressService,
  CourseContentService,
  PlayerAnalyticsService
};