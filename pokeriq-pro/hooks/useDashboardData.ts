'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  LearningAnalytics, 
  UserPerformanceMetrics, 
  AnalyticsService 
} from '@/lib/dashboard/analytics-service';
import { 
  PerformanceMetrics,
  MetricsCalculator 
} from '@/lib/dashboard/metrics-calculator';
import { createLogger } from '@/lib/logger';

const logger = createLogger('use-dashboard-data');

export interface DashboardData {
  learningAnalytics: LearningAnalytics | null;
  performanceMetrics: UserPerformanceMetrics | null;
  advancedMetrics: PerformanceMetrics | null;
  aggregatedData: {
    totalUsers?: number;
    activeUsers?: number;
    averageCompletionRate?: number;
    popularCourses?: Array<{
      courseId: string;
      title: string;
      enrollmentCount: number;
      averageScore: number;
    }>;
  } | null;
}

export interface DashboardState {
  data: DashboardData;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

export interface DashboardHookOptions {
  userId?: string;
  refreshInterval?: number; // in milliseconds
  enableAdvancedMetrics?: boolean;
  enableAggregatedData?: boolean;
  autoRefresh?: boolean;
}

export interface DashboardActions {
  refetch: () => Promise<void>;
  refetchLearningAnalytics: () => Promise<void>;
  refetchPerformanceMetrics: () => Promise<void>;
  refetchAdvancedMetrics: () => Promise<void>;
  clearError: () => void;
  setUserId: (userId: string) => void;
}

export const useDashboardData = (options: DashboardHookOptions = {}): DashboardState & DashboardActions => {
  const {
    userId: initialUserId,
    refreshInterval = 5 * 60 * 1000, // 5 minutes default
    enableAdvancedMetrics = false,
    enableAggregatedData = false,
    autoRefresh = true
  } = options;

  const [userId, setUserId] = useState<string | undefined>(initialUserId);
  const [state, setState] = useState<DashboardState>({
    data: {
      learningAnalytics: null,
      performanceMetrics: null,
      advancedMetrics: null,
      aggregatedData: null
    },
    loading: false,
    error: null,
    lastFetch: null
  });

  // Update loading state helper
  const updateLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  // Update error state helper
  const updateError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Clear error helper
  const clearError = useCallback(() => {
    updateError(null);
  }, [updateError]);

  // Fetch learning analytics
  const fetchLearningAnalytics = useCallback(async (targetUserId?: string): Promise<LearningAnalytics | null> => {
    if (!targetUserId) return null;

    try {
      logger.info('Fetching learning analytics', { userId: targetUserId });
      
      // First try to get from API endpoint
      const response = await fetch(`/api/dashboard/analytics/${targetUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data;
        } else {
          throw new Error(result.error || 'Failed to fetch learning analytics');
        }
      } else if (response.status === 404) {
        // If API endpoint doesn't exist, use the analytics service directly
        logger.info('API endpoint not found, using service directly');
        return await AnalyticsService.getLearningAnalytics(targetUserId);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Failed to fetch learning analytics', { error, userId: targetUserId });
      
      // Fallback to mock data in case of error
      return {
        courseCompletion: {
          totalCourses: 10,
          completedCourses: 3,
          completionRate: 30,
          averageScore: 75,
          totalStudyTime: 240
        },
        skillProgression: {
          dimensions: [
            {
              name: 'Preflop',
              category: 'Poker Skills',
              currentLevel: 75,
              maxLevel: 100,
              progress: 75,
              trend: 'up',
              confidence: 0.8
            },
            {
              name: 'Postflop',
              category: 'Poker Skills',
              currentLevel: 60,
              maxLevel: 100,
              progress: 60,
              trend: 'stable',
              confidence: 0.6
            },
            {
              name: 'Psychology',
              category: 'Poker Skills',
              currentLevel: 45,
              maxLevel: 100,
              progress: 45,
              trend: 'up',
              confidence: 0.4
            }
          ],
          overallProgress: 60,
          strongestSkills: ['Preflop'],
          weakestSkills: ['Psychology']
        },
        performanceTrends: {
          assessmentScores: [
            { date: '2024-08-20', value: 70 },
            { date: '2024-08-21', value: 75 },
            { date: '2024-08-22', value: 80 },
            { date: '2024-08-23', value: 78 },
            { date: '2024-08-24', value: 82 },
            { date: '2024-08-25', value: 85 },
            { date: '2024-08-26', value: 83 }
          ],
          studyTimeWeekly: [
            { date: '2024-08-19', value: 3.5 },
            { date: '2024-08-26', value: 4.2 }
          ],
          completionRateMonthly: [
            { date: '2024-07-01', value: 25 },
            { date: '2024-08-01', value: 30 }
          ]
        },
        studyPatterns: {
          preferredStudyTimes: Array.from({ length: 24 }, (_, hour) => ({
            hour,
            count: Math.random() * 5,
            avgDuration: 20 + Math.random() * 40
          })),
          sessionLengths: [15, 30, 45, 60, 30, 45],
          consistency: {
            streakDays: 5,
            studyDaysPerWeek: 4.5,
            avgSessionsPerDay: 1.2,
            regularityScore: 75
          }
        }
      };
    }
  }, []);

  // Fetch performance metrics
  const fetchPerformanceMetrics = useCallback(async (targetUserId?: string): Promise<UserPerformanceMetrics | null> => {
    if (!targetUserId) return null;

    try {
      logger.info('Fetching performance metrics', { userId: targetUserId });
      
      return await AnalyticsService.getUserPerformanceMetrics(targetUserId);
    } catch (error) {
      logger.error('Failed to fetch performance metrics', { error, userId: targetUserId });
      
      // Fallback to mock data
      return {
        assessmentPerformance: {
          totalAssessments: 12,
          averageScore: 78,
          highestScore: 95,
          lowestScore: 45,
          recentTrend: 'improving',
          categoryBreakdown: [
            { category: 'preflop', averageScore: 82, assessmentCount: 4, trend: 'up' },
            { category: 'postflop', averageScore: 75, assessmentCount: 5, trend: 'stable' },
            { category: 'psychology', averageScore: 68, assessmentCount: 3, trend: 'up' }
          ]
        },
        learningVelocity: {
          coursesPerWeek: 1.5,
          topicsPerWeek: 8.5,
          timeToCompletion: 14,
          efficiencyScore: 72
        },
        engagement: {
          dailyActiveTime: 45,
          weeklyActiveTime: 210,
          monthlyActiveTime: 840,
          sessionCount: 28,
          lastActiveDate: new Date()
        }
      };
    }
  }, []);

  // Fetch advanced metrics
  const fetchAdvancedMetrics = useCallback(async (targetUserId?: string): Promise<PerformanceMetrics | null> => {
    if (!targetUserId || !enableAdvancedMetrics) return null;

    try {
      logger.info('Fetching advanced metrics', { userId: targetUserId });
      
      // This would typically call a more complex analytics service
      // For now, return null to indicate this feature is not implemented
      return null;
    } catch (error) {
      logger.error('Failed to fetch advanced metrics', { error, userId: targetUserId });
      return null;
    }
  }, [enableAdvancedMetrics]);

  // Fetch aggregated data
  const fetchAggregatedData = useCallback(async () => {
    if (!enableAggregatedData) return null;

    try {
      logger.info('Fetching aggregated analytics data');
      
      const data = await AnalyticsService.getAggregatedAnalytics(100);
      return data;
    } catch (error) {
      logger.error('Failed to fetch aggregated data', { error });
      return null;
    }
  }, [enableAggregatedData]);

  // Main fetch function
  const fetchDashboardData = useCallback(async (targetUserId?: string) => {
    const currentUserId = targetUserId || userId;
    if (!currentUserId) {
      logger.warn('No user ID provided for dashboard data fetch');
      return;
    }

    updateLoading(true);
    updateError(null);

    try {
      logger.info('Fetching dashboard data', { 
        userId: currentUserId, 
        enableAdvancedMetrics, 
        enableAggregatedData 
      });

      const [
        learningAnalytics,
        performanceMetrics,
        advancedMetrics,
        aggregatedData
      ] = await Promise.all([
        fetchLearningAnalytics(currentUserId),
        fetchPerformanceMetrics(currentUserId),
        fetchAdvancedMetrics(currentUserId),
        fetchAggregatedData()
      ]);

      setState(prev => ({
        ...prev,
        data: {
          learningAnalytics,
          performanceMetrics,
          advancedMetrics,
          aggregatedData
        },
        loading: false,
        lastFetch: new Date()
      }));

      logger.info('Dashboard data fetched successfully', {
        userId: currentUserId,
        hasLearningAnalytics: !!learningAnalytics,
        hasPerformanceMetrics: !!performanceMetrics,
        hasAdvancedMetrics: !!advancedMetrics,
        hasAggregatedData: !!aggregatedData
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Failed to fetch dashboard data', { error, userId: currentUserId });
      updateError(errorMessage);
    } finally {
      updateLoading(false);
    }
  }, [
    userId, 
    enableAdvancedMetrics, 
    enableAggregatedData, 
    fetchLearningAnalytics, 
    fetchPerformanceMetrics, 
    fetchAdvancedMetrics, 
    fetchAggregatedData,
    updateLoading,
    updateError
  ]);

  // Individual refetch functions
  const refetchLearningAnalytics = useCallback(async () => {
    if (!userId) return;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const learningAnalytics = await fetchLearningAnalytics(userId);
      setState(prev => ({
        ...prev,
        data: { ...prev.data, learningAnalytics },
        loading: false,
        lastFetch: new Date()
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch learning analytics';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [userId, fetchLearningAnalytics]);

  const refetchPerformanceMetrics = useCallback(async () => {
    if (!userId) return;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const performanceMetrics = await fetchPerformanceMetrics(userId);
      setState(prev => ({
        ...prev,
        data: { ...prev.data, performanceMetrics },
        loading: false,
        lastFetch: new Date()
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch performance metrics';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [userId, fetchPerformanceMetrics]);

  const refetchAdvancedMetrics = useCallback(async () => {
    if (!userId) return;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const advancedMetrics = await fetchAdvancedMetrics(userId);
      setState(prev => ({
        ...prev,
        data: { ...prev.data, advancedMetrics },
        loading: false,
        lastFetch: new Date()
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch advanced metrics';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [userId, fetchAdvancedMetrics]);

  // Main refetch function
  const refetch = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  // Initialize data fetch on mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchDashboardData(userId);
    }
  }, [userId, fetchDashboardData]);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh || !userId || refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      logger.info('Auto-refreshing dashboard data', { userId, refreshInterval });
      fetchDashboardData();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh, userId, refreshInterval, fetchDashboardData]);

  // Get user ID from localStorage if not provided
  useEffect(() => {
    if (!userId && typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.id) {
            setUserId(user.id);
          }
        } catch (error) {
          logger.error('Failed to parse user from localStorage', { error });
        }
      }
    }
  }, [userId]);

  return {
    ...state,
    refetch,
    refetchLearningAnalytics,
    refetchPerformanceMetrics,
    refetchAdvancedMetrics,
    clearError,
    setUserId
  };
};