'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  TrendingUp,
  Target,
  BookOpen,
  Award,
  Calendar,
  Zap,
  Eye,
  Bookmark
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';

/**
 * Progress data interfaces aligned with database schema
 */
export interface PlayerProgressData {
  courseId: string;
  userId: string;
  completionRate: number;
  currentSection: number;
  studyTimeMinutes: number;
  lastAccessed: Date;
  completedAt?: Date | null;
  testScores: TestScore[];
}

export interface TestScore {
  assessmentId: string;
  score: number;
  maxScore: number;
  completedAt: Date;
  skillBreakdown?: Record<string, any>;
}

export interface ProgressAnalytics {
  totalWatchTime: number;
  avgWatchTimePerSection: number;
  interactionCount: number;
  bookmarkCount: number;
  noteCount: number;
  quizAttempts: number;
  quizSuccessRate: number;
  engagementScore: number;
  learningVelocity: number;
  consistencyScore: number;
}

export interface ProgressTrackerProps {
  progress: PlayerProgressData;
  analytics: ProgressAnalytics;
  courseTitle: string;
  totalSections: number;
  onProgressUpdate?: (data: Partial<PlayerProgressData>) => void;
  onAnalyticsUpdate?: (data: Partial<ProgressAnalytics>) => void;
  isPlaying?: boolean;
  currentPlayTime?: number;
  className?: string;
}

/**
 * Real-time Progress Tracker Component
 * Provides comprehensive progress visualization with analytics
 */
export function ProgressTracker({
  progress,
  analytics,
  courseTitle,
  totalSections,
  onProgressUpdate,
  onAnalyticsUpdate,
  isPlaying = false,
  currentPlayTime = 0,
  className = ''
}: ProgressTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentWatchTime, setCurrentWatchTime] = useState(0);
  const [sessionStartTime] = useState(Date.now());

  // Calculate real-time metrics
  const sessionTime = useMemo(() => {
    return Math.floor((Date.now() - sessionStartTime) / 60000);
  }, [sessionStartTime]);

  // Update watch time in real-time when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentWatchTime(prev => prev + 1);
        
        // Update analytics every 30 seconds
        if (currentWatchTime % 30 === 0 && onAnalyticsUpdate) {
          onAnalyticsUpdate({
            totalWatchTime: analytics.totalWatchTime + 30,
            engagementScore: calculateEngagementScore()
          });
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentWatchTime, analytics.totalWatchTime, onAnalyticsUpdate]);

  // Calculate engagement score based on various factors
  const calculateEngagementScore = useCallback(() => {
    const watchTimeWeight = 0.3;
    const interactionWeight = 0.25;
    const quizWeight = 0.25;
    const consistencyWeight = 0.2;

    const watchTimeScore = Math.min(100, (analytics.totalWatchTime / 3600) * 20);
    const interactionScore = Math.min(100, analytics.interactionCount * 2);
    const quizScore = analytics.quizSuccessRate;
    const consistencyScore = analytics.consistencyScore;

    return Math.round(
      watchTimeScore * watchTimeWeight +
      interactionScore * interactionWeight +
      quizScore * quizWeight +
      consistencyScore * consistencyWeight
    );
  }, [analytics]);

  // Format time display
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTimeSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate completion percentage
  const completionPercentage = Math.min(100, Math.max(0, progress.completionRate));
  
  // Determine completion status
  const isCompleted = progress.completedAt !== null;
  const isInProgress = completionPercentage > 0 && !isCompleted;

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Learning Progress</h3>
            <p className="text-sm text-gray-600">{courseTitle}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isPlaying && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center space-x-1 text-green-600"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">Live</span>
            </motion.div>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Progress Section */}
      <div className="space-y-4">
        {/* Overall Progress */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Completion</span>
            <span className="text-sm font-bold text-gray-900">{completionPercentage.toFixed(1)}%</span>
          </div>
          
          <ProgressBar 
            percentage={completionPercentage}
            height="h-3"
            showLabel={false}
            className="mb-2"
          />
          
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Section {progress.currentSection} of {totalSections}</span>
            {isCompleted ? (
              <Badge color="green" size="sm">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            ) : isInProgress ? (
              <Badge color="blue" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                In Progress
              </Badge>
            ) : (
              <Badge color="gray" size="sm">
                Not Started
              </Badge>
            )}
          </div>
        </div>

        {/* Real-time Session Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Session</span>
            </div>
            <p className="text-lg font-bold text-blue-900">
              {formatTimeSeconds(currentWatchTime)}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <BookOpen className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Total Study</span>
            </div>
            <p className="text-lg font-bold text-green-900">
              {formatTime(progress.studyTimeMinutes + sessionTime)}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Engagement</span>
            </div>
            <p className="text-lg font-bold text-purple-900">
              {calculateEngagementScore()}%
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">Quiz Score</span>
            </div>
            <p className="text-lg font-bold text-orange-900">
              {analytics.quizSuccessRate.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Expanded Analytics */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Detailed Analytics */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Detailed Analytics
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Interactions</span>
                      <Zap className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{analytics.interactionCount}</p>
                    <p className="text-xs text-gray-500">Total interactions</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Bookmarks</span>
                      <Bookmark className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{analytics.bookmarkCount}</p>
                    <p className="text-xs text-gray-500">Saved references</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Learning Velocity</span>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{analytics.learningVelocity.toFixed(1)}x</p>
                    <p className="text-xs text-gray-500">Progress rate</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Consistency</span>
                      <Calendar className="w-4 h-4 text-indigo-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{analytics.consistencyScore.toFixed(0)}%</p>
                    <p className="text-xs text-gray-500">Study consistency</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Quiz Attempts</span>
                      <Award className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{analytics.quizAttempts}</p>
                    <p className="text-xs text-gray-500">Total attempts</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Avg. Session</span>
                      <Clock className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatTime(analytics.avgWatchTimePerSection)}
                    </p>
                    <p className="text-xs text-gray-500">Per section</p>
                  </div>
                </div>
              </div>

              {/* Recent Test Scores */}
              {progress.testScores.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Recent Assessment Scores
                  </h4>
                  
                  <div className="space-y-2">
                    {progress.testScores.slice(-3).reverse().map((score, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Assessment #{progress.testScores.length - index}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(score.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {((score.score / score.maxScore) * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-600">
                            {score.score}/{score.maxScore} points
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ProgressTracker;