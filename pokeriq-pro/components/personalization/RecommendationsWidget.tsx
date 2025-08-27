'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  BookOpen,
  Target,
  Clock,
  Star,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  X,
  RefreshCw,
  Brain,
  TrendingUp,
  Zap,
  Award,
  Filter,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { createLogger } from '@/lib/logger';

const logger = createLogger('recommendations-widget');

interface TrainingRecommendation {
  id: string;
  historyId?: string;
  title: string;
  description: string;
  scenario: string;
  difficulty: number;
  estimatedTime: number;
  expectedImprovement: number;
  priority: number;
  reasoning: string;
  skillFocus: string[];
  learningStyle: string[];
}

interface RecommendationStats {
  totalRecommendations: number;
  acceptanceRate: number;
  averageRating: number;
}

interface RecommendationsData {
  recommendations: TrainingRecommendation[];
  stats: RecommendationStats;
}

interface RecommendationsWidgetProps {
  userId: string;
  compact?: boolean;
  maxRecommendations?: number;
  className?: string;
  onRecommendationClick?: (recommendation: TrainingRecommendation) => void;
}

export const RecommendationsWidget: React.FC<RecommendationsWidgetProps> = ({
  userId,
  compact = false,
  maxRecommendations = 3,
  className = '',
  onRecommendationClick
}) => {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'like' | 'dislike'>>({});

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/personalization/recommendations?userId=${userId}&count=${maxRecommendations}&timeAvailable=30`);
      
      if (!response.ok) {
        throw new Error('Failed to load recommendations');
      }

      const result = await response.json();
      
      if (result.success) {
        setData({
          recommendations: result.data.recommendations,
          stats: result.data.stats
        });
      } else {
        throw new Error(result.error || 'Failed to load recommendations');
      }

      logger.info('Recommendations loaded successfully', { userId, count: result.data.recommendations.length });
    } catch (error) {
      logger.error('Error loading recommendations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load recommendations');
      
      // Set mock data for development
      setData({
        recommendations: [
          {
            id: 'rec_1',
            historyId: 'hist_1',
            title: '针对过度保守: 价值下注训练',
            description: '学会识别价值下注机会，选择合适的下注尺度，专门改进您的过度保守问题',
            scenario: 'VALUE_BETTING',
            difficulty: 3,
            estimatedTime: 35,
            expectedImprovement: 45,
            priority: 0.8,
            reasoning: '您在flop阶段经常出现过度保守，建议针对性训练',
            skillFocus: ['postflop', 'mathematics'],
            learningStyle: ['practical', 'visual']
          },
          {
            id: 'rec_2',
            historyId: 'hist_2',
            title: '翻前开牌范围训练',
            description: '学习不同位置的标准开牌范围，提升您的preflop技能',
            scenario: 'PREFLOP_RANGES',
            difficulty: 2,
            estimatedTime: 20,
            expectedImprovement: 30,
            priority: 0.7,
            reasoning: '您的preflop技能还有提升空间，当前评分950',
            skillFocus: ['preflop'],
            learningStyle: ['visual', 'theoretical']
          },
          {
            id: 'rec_3',
            historyId: 'hist_3',
            title: '底池赔率计算',
            description: '掌握底池赔率和隐含赔率的计算与应用，提升您的mathematics技能',
            scenario: 'POT_ODDS',
            difficulty: 3,
            estimatedTime: 30,
            expectedImprovement: 35,
            priority: 0.6,
            reasoning: '您的mathematics技能还有提升空间，当前评分900',
            skillFocus: ['mathematics', 'postflop'],
            learningStyle: ['theoretical', 'practical']
          }
        ],
        stats: {
          totalRecommendations: 47,
          acceptanceRate: 78,
          averageRating: 4.2
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationFeedback = async (recommendationId: string, historyId: string, action: 'accept' | 'decline', rating?: number) => {
    try {
      const response = await fetch('/api/personalization/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          historyId,
          action,
          rating
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      if (action === 'accept') {
        setFeedbackGiven(prev => ({ ...prev, [recommendationId]: 'like' }));
      } else {
        setDismissedIds(prev => new Set([...prev, recommendationId]));
        setFeedbackGiven(prev => ({ ...prev, [recommendationId]: 'dislike' }));
      }

      logger.info('Recommendation feedback submitted', { recommendationId, action });
    } catch (error) {
      logger.error('Error submitting feedback:', error);
    }
  };

  const handleDismiss = (recommendation: TrainingRecommendation) => {
    if (recommendation.historyId) {
      handleRecommendationFeedback(recommendation.id, recommendation.historyId, 'decline');
    }
  };

  const handleAccept = (recommendation: TrainingRecommendation) => {
    if (recommendation.historyId) {
      handleRecommendationFeedback(recommendation.id, recommendation.historyId, 'accept', 5);
    }
    onRecommendationClick?.(recommendation);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
    if (difficulty <= 3) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return '简单';
    if (difficulty <= 3) return '中等';
    return '困难';
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 0.7) return 'bg-red-500';
    if (priority >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSkillFocusDisplay = (skills: string[]) => {
    const skillNames: Record<string, string> = {
      preflop: '翻前',
      postflop: '翻后',
      psychology: '心理',
      mathematics: '数学',
      bankroll: '资金',
      tournament: '锦标赛'
    };
    
    return skills.map(skill => skillNames[skill] || skill).join(', ');
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            {[...Array(compact ? 2 : 3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="text-center py-8">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {error ? '加载失败' : '暂无推荐'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || '完成一些活动后获取个性化推荐！'}
          </p>
          {error && (
            <button
              onClick={loadRecommendations}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              重新加载
            </button>
          )}
        </div>
      </div>
    );
  }

  const visibleRecommendations = data.recommendations.filter(rec => !dismissedIds.has(rec.id));

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              AI 推荐
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              基于您的学习进度智能推荐
            </p>
          </div>
          
          {!compact && data.stats && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                匹配度: {data.stats.acceptanceRate}%
              </span>
              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  style={{ width: `${data.stats.acceptanceRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="px-6 pb-6 space-y-4">
        <AnimatePresence>
          {visibleRecommendations.slice(0, maxRecommendations).map((rec, index) => (
            <motion.div
              key={rec.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative group bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
            >
              {/* Priority Indicator */}
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(rec.priority)}`} />
                <button
                  onClick={() => handleDismiss(rec)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="pr-8">
                <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
                  {rec.title}
                </h4>
                
                <p className={`text-gray-600 dark:text-gray-400 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {rec.description}
                </p>

                {/* Meta Information */}
                <div className="flex items-center space-x-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{rec.estimatedTime}分钟</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(rec.difficulty)}`}>
                      {getDifficultyLabel(rec.difficulty)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{rec.expectedImprovement}分</span>
                  </div>
                </div>

                {/* Skills Focus */}
                {!compact && (
                  <div className="mb-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      重点技能: {getSkillFocusDisplay(rec.skillFocus)}
                    </span>
                  </div>
                )}

                {/* Reasoning */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <Brain className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <span className="font-medium">推荐理由:</span> {rec.reasoning}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {feedbackGiven[rec.id] ? (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <span>已反馈</span>
                        {feedbackGiven[rec.id] === 'like' ? (
                          <ThumbsUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <ThumbsDown className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRecommendationFeedback(rec.id, rec.historyId || '', 'accept', 5)}
                          className="p-1 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors duration-200"
                          title="接受推荐"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRecommendationFeedback(rec.id, rec.historyId || '', 'decline')}
                          className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors duration-200"
                          title="拒绝推荐"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleAccept(rec)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                  >
                    <span>开始训练</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {!compact && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {data.stats && (
                <>
                  总推荐: {data.stats.totalRecommendations} | 
                  平均评分: {data.stats.averageRating.toFixed(1)} ⭐
                </>
              )}
            </div>
            
            <Link
              href="/personalization"
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              <span>查看更多</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Empty State */}
      {visibleRecommendations.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">暂无推荐</h3>
          <p className="text-gray-600 dark:text-gray-400">
            所有推荐都已完成或被忽略！
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsWidget;