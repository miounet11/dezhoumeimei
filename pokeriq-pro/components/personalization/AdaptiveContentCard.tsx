'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Play,
  Target,
  Star,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Settings,
  ArrowRight
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('adaptive-content-card');

interface ContentAdaptation {
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'practical' | 'theoretical' | 'social';
  contentLength: 'short' | 'medium' | 'long';
  interactivityLevel: 'low' | 'medium' | 'high';
  pacing: 'slow' | 'medium' | 'fast';
}

interface AdaptiveContent {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'interactive' | 'quiz' | 'simulation';
  adaptations: {
    [key: string]: {
      title: string;
      description: string;
      content: string;
      estimatedTime: number;
      complexity: number;
      features: string[];
    };
  };
  metadata: {
    baseTime: number;
    skillFocus: string[];
    prerequisites: string[];
    outcomes: string[];
  };
  userProgress?: {
    started: boolean;
    completed: boolean;
    progress: number;
    timeSpent: number;
    lastAccessed?: string;
    adaptationUsed?: string;
  };
}

interface AdaptiveContentCardProps {
  content: AdaptiveContent;
  userPreferences: ContentAdaptation;
  onContentStart?: (contentId: string, adaptation: string) => void;
  onAdaptationChange?: (contentId: string, newAdaptation: string) => void;
  onFeedback?: (contentId: string, rating: number, feedback: string) => void;
  showCustomization?: boolean;
  className?: string;
}

export const AdaptiveContentCard: React.FC<AdaptiveContentCardProps> = ({
  content,
  userPreferences,
  onContentStart,
  onAdaptationChange,
  onFeedback,
  showCustomization = false,
  className = ''
}) => {
  const [selectedAdaptation, setSelectedAdaptation] = useState<string>('');
  const [showAdaptations, setShowAdaptations] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    // Auto-select best adaptation based on user preferences
    const bestAdaptation = selectBestAdaptation();
    setSelectedAdaptation(bestAdaptation);
  }, [userPreferences, content]);

  const selectBestAdaptation = (): string => {
    const adaptationKeys = Object.keys(content.adaptations);
    
    // Scoring system for different adaptations
    let bestScore = -1;
    let bestAdaptation = adaptationKeys[0];

    adaptationKeys.forEach(key => {
      const adaptation = content.adaptations[key];
      let score = 0;

      // Difficulty matching
      if (key.includes(userPreferences.difficultyLevel)) score += 3;
      
      // Learning style matching
      if (key.includes(userPreferences.learningStyle)) score += 3;
      
      // Content length matching
      if (key.includes(userPreferences.contentLength)) score += 2;
      
      // Interactivity matching
      if (key.includes(userPreferences.interactivityLevel)) score += 2;
      
      // Complexity scoring
      const complexityMatch = Math.abs(adaptation.complexity - getDifficultyScore(userPreferences.difficultyLevel));
      score += Math.max(0, 3 - complexityMatch);

      if (score > bestScore) {
        bestScore = score;
        bestAdaptation = key;
      }
    });

    return bestAdaptation;
  };

  const getDifficultyScore = (difficulty: string): number => {
    const scores = { beginner: 1, intermediate: 2, advanced: 3 };
    return scores[difficulty as keyof typeof scores] || 2;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      video: <Play className="w-5 h-5" />,
      article: <BookOpen className="w-5 h-5" />,
      interactive: <Zap className="w-5 h-5" />,
      quiz: <Target className="w-5 h-5" />,
      simulation: <Settings className="w-5 h-5" />
    };
    return icons[type as keyof typeof icons] || <BookOpen className="w-5 h-5" />;
  };

  const getTypeColor = (type: string): string => {
    const colors = {
      video: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
      article: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
      interactive: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
      quiz: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
      simulation: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return colors[type as keyof typeof colors] || colors.article;
  };

  const getAdaptationLabel = (adaptationKey: string): string => {
    const labels: Record<string, string> = {
      'beginner_visual_short': '入门·可视化·简短版',
      'beginner_practical_medium': '入门·实践式·标准版',
      'intermediate_visual_medium': '进阶·可视化·标准版',
      'intermediate_practical_long': '进阶·实践式·详细版',
      'advanced_theoretical_long': '高级·理论式·深入版',
      'advanced_practical_medium': '高级·实践式·标准版'
    };
    return labels[adaptationKey] || adaptationKey;
  };

  const currentAdaptation = content.adaptations[selectedAdaptation];
  const progress = content.userProgress;

  const handleStart = () => {
    onContentStart?.(content.id, selectedAdaptation);
    logger.info('Content started', { contentId: content.id, adaptation: selectedAdaptation });
  };

  const handleAdaptationChange = (newAdaptation: string) => {
    setSelectedAdaptation(newAdaptation);
    onAdaptationChange?.(content.id, newAdaptation);
    setShowAdaptations(false);
    logger.info('Adaptation changed', { contentId: content.id, newAdaptation });
  };

  const handleFeedbackSubmit = () => {
    if (feedbackRating !== null) {
      onFeedback?.(content.id, feedbackRating, feedbackText);
      setShowFeedback(false);
      setFeedbackRating(null);
      setFeedbackText('');
      logger.info('Feedback submitted', { contentId: content.id, rating: feedbackRating });
    }
  };

  if (!currentAdaptation) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          内容适配中...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${getTypeColor(content.type)}`}>
              {getTypeIcon(content.type)}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {currentAdaptation.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {currentAdaptation.description}
              </p>
            </div>
          </div>

          {showCustomization && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAdaptations(!showAdaptations)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                title="自定义适配"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowFeedback(true)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                title="提供反馈"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Adaptation Label */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-medium">
            {getAdaptationLabel(selectedAdaptation)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            已为您智能适配
          </span>
        </div>

        {/* Progress Indicator */}
        {progress && (progress.started || progress.completed) && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                {progress.completed ? '已完成' : '进行中'}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {progress.progress}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${
                  progress.completed 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        )}

        {/* Content Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {currentAdaptation.features.map(feature => (
            <span
              key={feature}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{currentAdaptation.estimatedTime} 分钟</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4" />
            <span>难度 {currentAdaptation.complexity}/5</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>{content.metadata.skillFocus.join(', ')}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>{content.metadata.outcomes.length} 个学习目标</span>
          </div>
        </div>

        {/* Prerequisites */}
        {content.metadata.prerequisites.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
              建议先学习
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
              {content.metadata.prerequisites.map(prereq => (
                <li key={prereq} className="flex items-center space-x-1">
                  <span className="w-1 h-1 bg-yellow-600 rounded-full" />
                  <span>{prereq}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Learning Outcomes */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            学习后您将能够
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            {content.metadata.outcomes.map(outcome => (
              <li key={outcome} className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <motion.button
          onClick={handleStart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2
            ${progress?.completed
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : progress?.started
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            }
          `}
        >
          <span>
            {progress?.completed ? '重新学习' : progress?.started ? '继续学习' : '开始学习'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Adaptation Options Modal */}
      <AnimatePresence>
        {showAdaptations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  选择适合的版本
                </h4>
                <button
                  onClick={() => setShowAdaptations(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {Object.entries(content.adaptations).map(([key, adaptation]) => (
                  <button
                    key={key}
                    onClick={() => handleAdaptationChange(key)}
                    className={`
                      w-full text-left p-3 rounded-lg border transition-all duration-200
                      ${selectedAdaptation === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                          {adaptation.title}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {adaptation.description}
                        </p>
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {adaptation.estimatedTime}min
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                        {getAdaptationLabel(key)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full"
            >
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                内容反馈
              </h4>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  这个内容适配度如何？
                </p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFeedbackRating(rating)}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        feedbackRating && feedbackRating >= rating
                          ? 'text-yellow-500'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  其他建议（可选）
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="告诉我们如何改进..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  取消
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={feedbackRating === null}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  提交反馈
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdaptiveContentCard;