'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
  Play,
  CheckCircle,
  X,
  RefreshCw,
  Brain,
  Trophy,
  Zap,
  Users,
  Calendar,
  Filter,
  ThumbsUp,
  ThumbsDown,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { createLogger } from '@/lib/logger';

const logger = createLogger('recommendation-panel');

interface Recommendation {
  id: string;
  type: 'course' | 'skill' | 'practice' | 'review' | 'social';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relevanceScore: number; // 0-100
  actionUrl?: string;
  thumbnail?: string;
  tags: string[];
  dueDate?: string;
  completedBy?: number; // percentage of users who completed this
  rating?: number; // 0-5 stars
  prerequisites?: string[];
  outcomes: string[];
  dismissed?: boolean;
}

interface RecommendationData {
  personalizedRecommendations: Recommendation[];
  trendingRecommendations: Recommendation[];
  urgentRecommendations: Recommendation[];
  weeklyGoals: WeeklyGoal[];
  insights: {
    learningPattern: string;
    preferredDifficulty: string;
    strongAreas: string[];
    improvementAreas: string[];
    recommendationScore: number;
  };
}

interface WeeklyGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  deadline: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

interface RecommendationPanelProps {
  userId: string;
  data?: RecommendationData;
  loading?: boolean;
  compact?: boolean;
  className?: string;
  onRecommendationClick?: (recommendation: Recommendation) => void;
  onRecommendationDismiss?: (recommendationId: string) => void;
  onRecommendationFeedback?: (recommendationId: string, feedback: 'like' | 'dislike') => void;
}

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const colors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[difficulty as keyof typeof colors]}`}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
};

const PriorityIndicator: React.FC<{ priority: string }> = ({ priority }) => {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };

  return <div className={`w-3 h-3 rounded-full ${colors[priority as keyof typeof colors]}`} />;
};

const RecommendationCard: React.FC<{
  recommendation: Recommendation;
  compact?: boolean;
  onAction?: (recommendation: Recommendation) => void;
  onDismiss?: (id: string) => void;
  onFeedback?: (id: string, feedback: 'like' | 'dislike') => void;
}> = ({ recommendation, compact = false, onAction, onDismiss, onFeedback }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  
  const typeIcons = {
    course: BookOpen,
    skill: Target,
    practice: Play,
    review: RefreshCw,
    social: Users
  };
  
  const typeColors = {
    course: 'from-blue-500 to-cyan-500',
    skill: 'from-green-500 to-emerald-500',
    practice: 'from-purple-500 to-pink-500',
    review: 'from-orange-500 to-yellow-500',
    social: 'from-red-500 to-pink-500'
  };

  const Icon = typeIcons[recommendation.type];
  const gradientColor = typeColors[recommendation.type];

  const handleFeedback = (feedbackType: 'like' | 'dislike') => {
    setFeedback(feedbackType);
    onFeedback?.(recommendation.id, feedbackType);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        relative group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 
        hover:shadow-lg transition-all duration-300 overflow-hidden
        ${compact ? 'p-4' : 'p-6'}
        ${recommendation.priority === 'high' ? 'ring-2 ring-red-500 ring-opacity-20' : ''}
      `}
    >
      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={() => onDismiss(recommendation.id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}

      <div className="flex items-start space-x-4">
        {/* Icon and Priority */}
        <div className="flex-shrink-0">
          <div className={`
            p-3 rounded-xl bg-gradient-to-r ${gradientColor} text-white relative
            ${compact ? 'p-2' : 'p-3'}
          `}>
            <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <div className="absolute -top-1 -right-1">
              <PriorityIndicator priority={recommendation.priority} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className={`font-semibold text-gray-900 dark:text-white ${compact ? 'text-sm' : 'text-base'}`}>
                {recommendation.title}
              </h4>
              <p className={`text-gray-600 dark:text-gray-400 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                {recommendation.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <DifficultyBadge difficulty={recommendation.difficulty} />
              {recommendation.rating && (
                <div className="flex items-center text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs ml-1">{recommendation.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{recommendation.estimatedTime} min</span>
            </div>
            
            {recommendation.completedBy && (
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{recommendation.completedBy}% completed</span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>{recommendation.relevanceScore}% match</span>
            </div>
          </div>

          {/* Reason */}
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Why this?</strong> {recommendation.reason}
              </p>
            </div>
          </div>

          {/* Tags */}
          {recommendation.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {recommendation.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs"
                >
                  {tag}
                </span>
              ))}
              {recommendation.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md text-xs">
                  +{recommendation.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Expandable Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                {/* Prerequisites */}
                {recommendation.prerequisites && recommendation.prerequisites.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prerequisites:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {recommendation.prerequisites.map((prereq, index) => (
                        <li key={index}>{prereq}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expected Outcomes */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">What you'll learn:</h5>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {recommendation.outcomes.slice(0, 3).map((outcome, index) => (
                      <li key={index}>{outcome}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showDetails ? 'Show Less' : 'Learn More'}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {/* Feedback */}
              {onFeedback && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleFeedback('like')}
                    className={`p-1 rounded-full transition-colors ${
                      feedback === 'like'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                        : 'text-gray-400 hover:text-green-600'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleFeedback('dislike')}
                    className={`p-1 rounded-full transition-colors ${
                      feedback === 'dislike'
                        ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                        : 'text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => onAction?.(recommendation)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <span className="text-sm font-medium">Start</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const WeeklyGoalCard: React.FC<{
  goal: WeeklyGoal;
  compact?: boolean;
}> = ({ goal, compact = false }) => {
  const progressPercentage = (goal.progress / goal.target) * 100;
  const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  
  return (
    <div className={`
      bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 
      ${compact ? 'p-4' : 'p-6'}
    `}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-semibold text-gray-900 dark:text-white ${compact ? 'text-sm' : 'text-base'}`}>
          {goal.title}
        </h4>
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="w-3 h-3" />
          <span>{daysLeft}d left</span>
        </div>
      </div>
      
      <p className={`text-gray-600 dark:text-gray-400 mb-4 ${compact ? 'text-xs' : 'text-sm'}`}>
        {goal.description}
      </p>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {goal.progress} / {goal.target}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(progressPercentage)}% complete
          </span>
          <PriorityIndicator priority={goal.priority} />
        </div>
      </div>
    </div>
  );
};

export default function RecommendationPanel({
  userId,
  data,
  loading = false,
  compact = false,
  className = '',
  onRecommendationClick,
  onRecommendationDismiss,
  onRecommendationFeedback
}: RecommendationPanelProps) {
  const [localData, setLocalData] = useState<RecommendationData | null>(data || null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'course' | 'skill' | 'practice'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Mock data for development
  const defaultData: RecommendationData = {
    personalizedRecommendations: [
      {
        id: '1',
        type: 'course',
        title: 'Advanced Position Play',
        description: 'Master the art of positional advantage in different game scenarios',
        reason: 'Your recent hand histories show room for improvement in late position play',
        priority: 'high',
        estimatedTime: 45,
        difficulty: 'intermediate',
        relevanceScore: 92,
        actionUrl: '/courses/advanced-position-play',
        tags: ['Position', 'Strategy', 'Cash Games'],
        completedBy: 78,
        rating: 4.7,
        outcomes: [
          'Understand positional advantages in different scenarios',
          'Learn optimal betting sizes by position',
          'Master late position stealing techniques'
        ]
      },
      {
        id: '2',
        type: 'skill',
        title: 'Bluff Detection Training',
        description: 'Improve your ability to spot opponent bluffs through tells and betting patterns',
        reason: 'Your fold equity in bluff-catching situations is below optimal',
        priority: 'medium',
        estimatedTime: 30,
        difficulty: 'advanced',
        relevanceScore: 85,
        tags: ['Psychology', 'Tells', 'Defense'],
        completedBy: 45,
        rating: 4.9,
        outcomes: [
          'Identify common bluffing patterns',
          'Read physical and betting tells',
          'Calculate optimal bluff-catching frequency'
        ]
      },
      {
        id: '3',
        type: 'practice',
        title: 'Range vs Range Analysis',
        description: 'Practice analyzing hand ranges in complex multi-way pots',
        reason: 'Your range analysis skills need refinement for tournament play',
        priority: 'high',
        estimatedTime: 60,
        difficulty: 'advanced',
        relevanceScore: 88,
        tags: ['Ranges', 'Analysis', 'Tournaments'],
        completedBy: 34,
        rating: 4.8,
        dueDate: '2024-09-15',
        outcomes: [
          'Analyze opponent ranges in multi-way pots',
          'Adjust your range based on opponent actions',
          'Calculate equity distributions accurately'
        ]
      }
    ],
    trendingRecommendations: [
      {
        id: '4',
        type: 'course',
        title: 'GTO Solver Fundamentals',
        description: 'Learn to use GTO solvers effectively for hand analysis',
        reason: 'Trending among players at your skill level this week',
        priority: 'medium',
        estimatedTime: 75,
        difficulty: 'intermediate',
        relevanceScore: 75,
        tags: ['GTO', 'Solvers', 'Analysis'],
        completedBy: 89,
        rating: 4.6,
        outcomes: [
          'Set up and use popular GTO solvers',
          'Interpret solver outputs correctly',
          'Apply GTO concepts to real play'
        ]
      }
    ],
    urgentRecommendations: [
      {
        id: '5',
        type: 'review',
        title: 'Tournament Final Table Review',
        description: 'Review your recent tournament final table performance',
        reason: 'You have unreviewed final table hands from last week',
        priority: 'high',
        estimatedTime: 20,
        difficulty: 'intermediate',
        relevanceScore: 95,
        tags: ['Review', 'Tournaments', 'Final Table'],
        dueDate: '2024-08-28',
        outcomes: [
          'Identify final table strategy mistakes',
          'Learn optimal ICM decisions',
          'Improve heads-up play'
        ]
      }
    ],
    weeklyGoals: [
      {
        id: 'g1',
        title: 'Complete 3 Strategy Courses',
        description: 'Finish at least 3 poker strategy courses this week',
        progress: 2,
        target: 3,
        deadline: '2024-08-30',
        category: 'Learning',
        priority: 'medium'
      },
      {
        id: 'g2',
        title: 'Practice Hand Reading Daily',
        description: 'Spend 15 minutes daily on hand reading exercises',
        progress: 5,
        target: 7,
        deadline: '2024-08-30',
        category: 'Skills',
        priority: 'high'
      }
    ],
    insights: {
      learningPattern: 'Visual learner with preference for interactive content',
      preferredDifficulty: 'intermediate',
      strongAreas: ['Position Play', 'Bet Sizing'],
      improvementAreas: ['Bluff Detection', 'Tournament Play'],
      recommendationScore: 87
    }
  };

  useEffect(() => {
    if (!data && !loading) {
      setLocalData(defaultData);
    } else if (data) {
      setLocalData(data);
    }
  }, [data, loading]);

  useEffect(() => {
    if (!data && userId) {
      fetchRecommendationData();
    }
  }, [userId]);

  const fetchRecommendationData = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/dashboard/recommendations/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendation data');
      }
      
      const recommendationData = await response.json();
      setLocalData(recommendationData);
      
      logger.info('Recommendation data fetched successfully', { userId });
    } catch (error) {
      logger.error('Error fetching recommendation data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch recommendation data');
      setLocalData(defaultData);
    }
  };

  const handleRecommendationAction = (recommendation: Recommendation) => {
    if (recommendation.actionUrl) {
      window.open(recommendation.actionUrl, '_blank');
    }
    onRecommendationClick?.(recommendation);
    logger.info('Recommendation clicked', { recommendationId: recommendation.id, type: recommendation.type });
  };

  const handleDismiss = (recommendationId: string) => {
    setDismissedIds(prev => new Set([...prev, recommendationId]));
    onRecommendationDismiss?.(recommendationId);
    logger.info('Recommendation dismissed', { recommendationId });
  };

  const handleFeedback = (recommendationId: string, feedback: 'like' | 'dislike') => {
    onRecommendationFeedback?.(recommendationId, feedback);
    logger.info('Recommendation feedback', { recommendationId, feedback });
  };

  const getFilteredRecommendations = () => {
    if (!localData) return [];
    
    const allRecommendations = [
      ...localData.personalizedRecommendations,
      ...localData.trendingRecommendations,
      ...localData.urgentRecommendations
    ].filter(rec => !dismissedIds.has(rec.id));

    if (activeFilter === 'all') return allRecommendations;
    if (activeFilter === 'high') return allRecommendations.filter(rec => rec.priority === 'high');
    return allRecommendations.filter(rec => rec.type === activeFilter);
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-8 w-1/3"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-48"></div>
        ))}
      </div>
    );
  }

  if (error || !localData) {
    return (
      <div className={`text-center p-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
        <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {error ? 'Failed to Load Recommendations' : 'No Recommendations'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error || 'Complete some activities to get personalized recommendations!'}
        </p>
        {error && (
          <button
            onClick={fetchRecommendationData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  const filteredRecommendations = getFilteredRecommendations();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Lightbulb className="w-6 h-6 mr-2 text-yellow-500" />
            Personalized Recommendations
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            AI-powered suggestions based on your learning progress
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Match Score: {localData.insights.recommendationScore}%
          </span>
          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
              style={{ width: `${localData.insights.recommendationScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All', count: filteredRecommendations.length },
          { key: 'high', label: 'High Priority', count: filteredRecommendations.filter(r => r.priority === 'high').length },
          { key: 'course', label: 'Courses', count: filteredRecommendations.filter(r => r.type === 'course').length },
          { key: 'skill', label: 'Skills', count: filteredRecommendations.filter(r => r.type === 'skill').length },
          { key: 'practice', label: 'Practice', count: filteredRecommendations.filter(r => r.type === 'practice').length }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key as any)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap
              ${activeFilter === filter.key
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }
            `}
          >
            <span>{filter.label}</span>
            <span className="px-1.5 py-0.5 bg-white dark:bg-gray-900 rounded-full text-xs">
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Weekly Goals */}
      {!compact && localData.weeklyGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">This Week's Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localData.weeklyGoals.map(goal => (
              <WeeklyGoalCard key={goal.id} goal={goal} compact={compact} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recommendations ({filteredRecommendations.length})
          </h3>
          
          <button
            onClick={fetchRecommendationData}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredRecommendations.map(recommendation => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                compact={compact}
                onAction={handleRecommendationAction}
                onDismiss={handleDismiss}
                onFeedback={handleFeedback}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Recommendations</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeFilter === 'all' 
                ? 'All recommendations have been completed or dismissed!' 
                : `No ${activeFilter} recommendations available right now.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Insights Panel */}
      {!compact && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            Learning Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Strong Areas</h4>
              <div className="flex flex-wrap gap-2">
                {localData.insights.strongAreas.map(area => (
                  <span key={area} className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-md text-xs">
                    {area}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Areas to Improve</h4>
              <div className="flex flex-wrap gap-2">
                {localData.insights.improvementAreas.map(area => (
                  <span key={area} className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-md text-xs">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <strong>Learning Pattern:</strong> {localData.insights.learningPattern}
          </div>
        </div>
      )}
    </div>
  );
}