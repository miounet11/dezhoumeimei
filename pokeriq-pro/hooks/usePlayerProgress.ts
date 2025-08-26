'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createLogger } from '@/lib/logger';
import { ProgressManager, createProgressManager } from '@/lib/player/progress-manager';
import { AnalyticsTracker, createAnalyticsTracker } from '@/lib/player/analytics-tracker';
import { OfflineSyncManager, createOfflineSyncManager } from '@/lib/player/offline-sync';
import { PlayerProgressData, ProgressAnalytics } from '@/components/player/ProgressTracker';

const logger = createLogger('usePlayerProgress');

/**
 * Player Progress Hook Configuration
 */
export interface PlayerProgressConfig {
  userId: string;
  courseId: string;
  enableAnalytics?: boolean;
  enableOfflineSync?: boolean;
  syncInterval?: number;
  trackingEnabled?: boolean;
  autoSave?: boolean;
  debug?: boolean;
}

/**
 * Hook State Interface
 */
export interface PlayerProgressState {
  progress: PlayerProgressData | null;
  analytics: ProgressAnalytics | null;
  isLoading: boolean;
  isOffline: boolean;
  syncStatus: 'idle' | 'syncing' | 'offline' | 'conflict' | 'error';
  error: string | null;
  initialized: boolean;
}

/**
 * Hook Actions Interface
 */
export interface PlayerProgressActions {
  // Progress updates
  updateCompletionRate: (rate: number) => Promise<void>;
  updateCurrentSection: (section: number) => Promise<void>;
  addStudyTime: (minutes: number) => Promise<void>;
  addTestScore: (score: any) => Promise<void>;
  
  // Watch tracking
  startWatchSession: () => void;
  stopWatchSession: () => void;
  trackWatchTime: (seconds: number) => void;
  
  // Interaction tracking
  trackInteraction: (type: string, data?: any) => void;
  trackBookmark: (data: any) => void;
  trackNote: (data: any) => void;
  
  // Assessment tracking
  startAssessment: (assessmentId: string) => void;
  completeAssessment: (assessmentId: string, results: any) => void;
  answerQuestion: (questionId: string, data: any) => void;
  
  // Section navigation
  enterSection: (sectionId: string) => void;
  completeSection: (sectionId: string) => void;
  
  // Sync operations
  forcSync: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merge') => Promise<void>;
  
  // Utility
  reset: () => void;
  destroy: () => void;
}

/**
 * Main Player Progress Hook
 */
export function usePlayerProgress(config: PlayerProgressConfig): PlayerProgressState & PlayerProgressActions {
  // State
  const [state, setState] = useState<PlayerProgressState>({
    progress: null,
    analytics: null,
    isLoading: true,
    isOffline: false,
    syncStatus: 'idle',
    error: null,
    initialized: false
  });

  // Managers
  const progressManagerRef = useRef<ProgressManager | null>(null);
  const analyticsTrackerRef = useRef<AnalyticsTracker | null>(null);
  const offlineSyncManagerRef = useRef<OfflineSyncManager | null>(null);

  // Session tracking
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const sessionStartTime = useRef<Date>(new Date());

  /**
   * Initialize all managers
   */
  const initializeManagers = useCallback(async () => {
    try {
      logger.info('Initializing player progress managers', {
        userId: config.userId,
        courseId: config.courseId
      });

      // Create Progress Manager
      progressManagerRef.current = createProgressManager(config.userId, config.courseId);
      await progressManagerRef.current.initialize();

      // Create Analytics Tracker (if enabled)
      if (config.enableAnalytics !== false) {
        analyticsTrackerRef.current = createAnalyticsTracker(
          config.userId,
          config.courseId
        );
      }

      // Create Offline Sync Manager (if enabled)
      if (config.enableOfflineSync !== false) {
        offlineSyncManagerRef.current = createOfflineSyncManager(
          config.userId,
          config.courseId,
          {
            syncInterval: config.syncInterval || 30000
          }
        );
      }

      // Setup event listeners
      setupEventListeners();

      // Load initial data
      await loadInitialData();

      setState(prev => ({
        ...prev,
        initialized: true,
        isLoading: false
      }));

      logger.info('Player progress managers initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize player progress managers', { error });
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Initialization failed',
        isLoading: false
      }));
    }
  }, [config]);

  /**
   * Setup event listeners for all managers
   */
  const setupEventListeners = useCallback(() => {
    const progressManager = progressManagerRef.current;
    const analyticsTracker = analyticsTrackerRef.current;
    const offlineSyncManager = offlineSyncManagerRef.current;

    if (progressManager) {
      // Progress events
      progressManager.on('progress_updated', (event) => {
        setState(prev => ({
          ...prev,
          progress: progressManager.getProgress()
        }));

        if (config.debug) {
          logger.debug('Progress updated', event);
        }
      });

      progressManager.on('analytics_updated', (event) => {
        setState(prev => ({
          ...prev,
          analytics: progressManager.getAnalytics()
        }));

        if (config.debug) {
          logger.debug('Analytics updated', event);
        }
      });

      progressManager.on('course_completed', (event) => {
        logger.info('Course completed', event);
        // Could trigger celebrations, certificates, etc.
      });

      // Sync events
      progressManager.on('sync_started', () => {
        setState(prev => ({ ...prev, syncStatus: 'syncing' }));
      });

      progressManager.on('sync_completed', () => {
        setState(prev => ({ ...prev, syncStatus: 'idle' }));
      });

      progressManager.on('sync_failed', (event) => {
        setState(prev => ({ 
          ...prev, 
          syncStatus: 'error',
          error: event.data.error 
        }));
      });
    }

    if (offlineSyncManager) {
      offlineSyncManager.on('online', () => {
        setState(prev => ({ ...prev, isOffline: false, syncStatus: 'idle' }));
      });

      offlineSyncManager.on('offline', () => {
        setState(prev => ({ ...prev, isOffline: true, syncStatus: 'offline' }));
      });

      offlineSyncManager.on('sync_conflicts', (event) => {
        setState(prev => ({ ...prev, syncStatus: 'conflict' }));
        logger.warn('Sync conflicts detected', event);
      });
    }

    if (analyticsTracker) {
      analyticsTracker.on('analytics_event', (event) => {
        if (config.debug) {
          logger.debug('Analytics event tracked', event);
        }
      });

      analyticsTracker.on('analytics_flushed', (event) => {
        if (config.debug) {
          logger.debug('Analytics data flushed', event);
        }
      });
    }
  }, [config.debug]);

  /**
   * Load initial progress and analytics data
   */
  const loadInitialData = useCallback(async () => {
    try {
      const progressManager = progressManagerRef.current;
      const offlineSyncManager = offlineSyncManagerRef.current;

      if (progressManager) {
        // Load from offline storage first if available
        if (offlineSyncManager) {
          const offlineData = await offlineSyncManager.loadProgressOffline();
          if (offlineData) {
            setState(prev => ({
              ...prev,
              progress: offlineData.progress,
              analytics: offlineData.analytics
            }));
          }
        }

        // Get current data from progress manager
        const progress = progressManager.getProgress();
        const analytics = progressManager.getAnalytics();

        setState(prev => ({
          ...prev,
          progress,
          analytics
        }));
      }

    } catch (error) {
      logger.error('Failed to load initial data', { error });
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }));
    }
  }, []);

  /**
   * Save current state to offline storage
   */
  const saveToOfflineStorage = useCallback(async () => {
    const offlineSyncManager = offlineSyncManagerRef.current;
    const progressManager = progressManagerRef.current;

    if (offlineSyncManager && progressManager && state.progress && state.analytics) {
      try {
        await offlineSyncManager.saveProgressOffline(
          state.progress,
          state.analytics,
          [] // Events would be passed here
        );
      } catch (error) {
        logger.error('Failed to save to offline storage', { error });
      }
    }
  }, [state.progress, state.analytics]);

  // Auto-save to offline storage when data changes
  useEffect(() => {
    if (config.autoSave !== false && state.initialized) {
      saveToOfflineStorage();
    }
  }, [state.progress, state.analytics, config.autoSave, state.initialized, saveToOfflineStorage]);

  // Initialize managers on mount
  useEffect(() => {
    initializeManagers();

    return () => {
      // Cleanup on unmount
      progressManagerRef.current?.destroy();
      analyticsTrackerRef.current?.destroy();
      offlineSyncManagerRef.current?.destroy();
    };
  }, [initializeManagers]);

  // ===== PROGRESS ACTIONS =====

  const updateCompletionRate = useCallback(async (rate: number) => {
    try {
      await progressManagerRef.current?.updateCompletionRate(rate);
      analyticsTrackerRef.current?.trackEvent('progress_update', { 
        completionRate: rate,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to update completion rate', { error });
      throw error;
    }
  }, []);

  const updateCurrentSection = useCallback(async (section: number) => {
    try {
      await progressManagerRef.current?.updateCurrentSection(section);
      analyticsTrackerRef.current?.trackSectionChange(
        section.toString(),
        currentSection || undefined
      );
      setCurrentSection(section.toString());
    } catch (error) {
      logger.error('Failed to update current section', { error });
      throw error;
    }
  }, [currentSection]);

  const addStudyTime = useCallback(async (minutes: number) => {
    try {
      // This would be called by the progress manager automatically
      // when tracking watch time, but can be used manually too
      analyticsTrackerRef.current?.trackEvent('study_time_added', { 
        minutes,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to add study time', { error });
      throw error;
    }
  }, []);

  const addTestScore = useCallback(async (score: any) => {
    try {
      await progressManagerRef.current?.addTestScore(score);
      analyticsTrackerRef.current?.trackEvent('test_score_added', {
        score: score.score,
        maxScore: score.maxScore,
        percentage: (score.score / score.maxScore) * 100,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to add test score', { error });
      throw error;
    }
  }, []);

  // ===== WATCH TRACKING ACTIONS =====

  const startWatchSession = useCallback(() => {
    if (!isWatching) {
      setIsWatching(true);
      sessionStartTime.current = new Date();
      progressManagerRef.current?.startWatchSession();
      analyticsTrackerRef.current?.trackEvent('watch_session_start', {
        timestamp: new Date()
      });
    }
  }, [isWatching]);

  const stopWatchSession = useCallback(() => {
    if (isWatching) {
      setIsWatching(false);
      progressManagerRef.current?.stopWatchSession();
      
      const sessionDuration = Date.now() - sessionStartTime.current.getTime();
      analyticsTrackerRef.current?.trackEvent('watch_session_end', {
        duration: sessionDuration,
        timestamp: new Date()
      });
    }
  }, [isWatching]);

  const trackWatchTime = useCallback((seconds: number) => {
    if (currentSection) {
      progressManagerRef.current?.trackWatchTime({
        sectionId: currentSection,
        watchedSeconds: seconds,
        totalSeconds: seconds,
        timestamp: new Date()
      });
    }
  }, [currentSection]);

  // ===== INTERACTION TRACKING ACTIONS =====

  const trackInteraction = useCallback((type: string, data: any = {}) => {
    progressManagerRef.current?.trackInteraction({
      type: type as any,
      timestamp: new Date(),
      data,
      sectionId: currentSection || undefined
    });

    analyticsTrackerRef.current?.trackInteraction(
      data.element || type,
      type,
      data
    );
  }, [currentSection]);

  const trackBookmark = useCallback((data: any) => {
    trackInteraction('bookmark', data);
  }, [trackInteraction]);

  const trackNote = useCallback((data: any) => {
    trackInteraction('note', data);
  }, [trackInteraction]);

  // ===== ASSESSMENT TRACKING ACTIONS =====

  const startAssessment = useCallback((assessmentId: string) => {
    analyticsTrackerRef.current?.trackAssessment(assessmentId, 'start', {
      timestamp: new Date()
    });
  }, []);

  const completeAssessment = useCallback((assessmentId: string, results: any) => {
    analyticsTrackerRef.current?.trackAssessment(assessmentId, 'complete', {
      ...results,
      timestamp: new Date()
    });
  }, []);

  const answerQuestion = useCallback((questionId: string, data: any) => {
    analyticsTrackerRef.current?.trackAssessment(
      data.assessmentId,
      'question_answer',
      {
        questionId,
        ...data,
        timestamp: new Date()
      }
    );
  }, []);

  // ===== SECTION NAVIGATION ACTIONS =====

  const enterSection = useCallback((sectionId: string) => {
    analyticsTrackerRef.current?.trackSectionChange(sectionId, currentSection || undefined);
    setCurrentSection(sectionId);
    
    analyticsTrackerRef.current?.trackEvent('section_enter', {
      sectionId,
      timestamp: new Date()
    });
  }, [currentSection]);

  const completeSection = useCallback((sectionId: string) => {
    analyticsTrackerRef.current?.trackEvent('section_complete', {
      sectionId,
      timestamp: new Date()
    });
  }, []);

  // ===== SYNC ACTIONS =====

  const forceSync = useCallback(async () => {
    try {
      await progressManagerRef.current?.forceSync();
      await offlineSyncManagerRef.current?.syncWithServer();
    } catch (error) {
      logger.error('Failed to force sync', { error });
      throw error;
    }
  }, []);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge'
  ) => {
    try {
      await offlineSyncManagerRef.current?.resolveConflict(conflictId, resolution);
    } catch (error) {
      logger.error('Failed to resolve conflict', { error });
      throw error;
    }
  }, []);

  // ===== UTILITY ACTIONS =====

  const reset = useCallback(() => {
    setState({
      progress: null,
      analytics: null,
      isLoading: true,
      isOffline: false,
      syncStatus: 'idle',
      error: null,
      initialized: false
    });
    
    setCurrentSection(null);
    setIsWatching(false);
    
    // Reinitialize
    initializeManagers();
  }, [initializeManagers]);

  const destroy = useCallback(() => {
    progressManagerRef.current?.destroy();
    analyticsTrackerRef.current?.destroy();
    offlineSyncManagerRef.current?.destroy();
    
    progressManagerRef.current = null;
    analyticsTrackerRef.current = null;
    offlineSyncManagerRef.current = null;
  }, []);

  // ===== COMPUTED VALUES =====

  const memoizedActions = useMemo(() => ({
    updateCompletionRate,
    updateCurrentSection,
    addStudyTime,
    addTestScore,
    startWatchSession,
    stopWatchSession,
    trackWatchTime,
    trackInteraction,
    trackBookmark,
    trackNote,
    startAssessment,
    completeAssessment,
    answerQuestion,
    enterSection,
    completeSection,
    forcSync: forceSync,
    resolveConflict,
    reset,
    destroy
  }), [
    updateCompletionRate,
    updateCurrentSection,
    addStudyTime,
    addTestScore,
    startWatchSession,
    stopWatchSession,
    trackWatchTime,
    trackInteraction,
    trackBookmark,
    trackNote,
    startAssessment,
    completeAssessment,
    answerQuestion,
    enterSection,
    completeSection,
    forceSync,
    resolveConflict,
    reset,
    destroy
  ]);

  return {
    ...state,
    ...memoizedActions
  };
}

export default usePlayerProgress;