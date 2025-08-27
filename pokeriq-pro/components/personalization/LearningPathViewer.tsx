'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Route,
  Target,
  CheckCircle,
  Circle,
  Clock,
  Star,
  TrendingUp,
  BookOpen,
  Play,
  Zap,
  Award,
  ArrowRight,
  Calendar,
  Brain,
  BarChart3,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('learning-path-viewer');

interface PlanMilestone {
  id: string;
  title: string;
  description: string;
  targetSkill: string;
  targetImprovement: number;
  estimatedTimeToComplete: number;
  prerequisites: string[];
  completed?: boolean;
  progress?: number;
}

interface TrainingRecommendation {
  id: string;
  title: string;
  description: string;
  scenario: string;
  difficulty: number;
  estimatedTime: number;
  expectedImprovement: number;
  skillFocus: string[];
  completed?: boolean;
  progress?: number;
}

interface PersonalizedTrainingPlan {
  userId: string;
  planId: string;
  title: string;
  description: string;
  estimatedDuration: number;
  expectedOverallImprovement: number;
  recommendations: TrainingRecommendation[];
  milestones: PlanMilestone[];
  createdAt: string;
  difficulty: number;
  completedRecommendations?: number;
  totalProgress?: number;
}

interface LearningPathViewerProps {
  userId: string;
  compact?: boolean;
  className?: string;
}

export const LearningPathViewer: React.FC<LearningPathViewerProps> = ({
  userId,
  compact = false,
  className = ''
}) => {
  const [trainingPlan, setTrainingPlan] = useState<PersonalizedTrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'recommendations' | 'milestones'>('overview');
  const [selectedRecommendation, setSelectedRecommendation] = useState<TrainingRecommendation | null>(null);

  useEffect(() => {
    loadLearningPath();
  }, [userId]);

  const loadLearningPath = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/personalization/learning-path?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load learning path');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setTrainingPlan(result.data);
      } else {
        throw new Error(result.error || 'No learning path available');
      }

      logger.info('Learning path loaded successfully', { userId });
    } catch (error) {
      logger.error('Error loading learning path:', error);
      setError(error instanceof Error ? error.message : 'Failed to load learning path');
      
      // Set mock data for development
      setTrainingPlan({
        userId,
        planId: 'plan_demo',
        title: '中级德州扑克技能提升计划',
        description: '针对您当前1250分的水平，重点改善tournament技能和过度保守问题的个性化训练计划。',
        estimatedDuration: 15, // hours
        expectedOverallImprovement: 150,
        difficulty: 3,
        createdAt: new Date().toISOString(),
        completedRecommendations: 4,
        totalProgress: 35,
        recommendations: [
          {
            id: 'rec_1',
            title: '翻前开牌范围训练',
            description: '学习不同位置的标准开牌范围',
            scenario: 'PREFLOP_RANGES',
            difficulty: 2,
            estimatedTime: 20,
            expectedImprovement: 30,
            skillFocus: ['preflop'],
            completed: true,
            progress: 100
          },
          {
            id: 'rec_2',
            title: '底池赔率计算',
            description: '掌握底池赔率和隐含赔率的计算与应用',
            scenario: 'POT_ODDS',
            difficulty: 3,
            estimatedTime: 30,
            expectedImprovement: 35,
            skillFocus: ['mathematics', 'postflop'],
            completed: true,
            progress: 100
          },
          {
            id: 'rec_3',
            title: '价值下注训练',
            description: '学会识别价值下注机会，选择合适的下注尺度',
            scenario: 'VALUE_BETTING',
            difficulty: 4,
            estimatedTime: 35,
            expectedImprovement: 45,
            skillFocus: ['postflop', 'mathematics'],
            completed: false,
            progress: 60
          },
          {
            id: 'rec_4',
            title: '锦标赛策略',
            description: '学习锦标赛特有策略，包括ICM和泡沫期游戏',
            scenario: 'TOURNAMENT_PLAY',
            difficulty: 5,
            estimatedTime: 50,
            expectedImprovement: 60,
            skillFocus: ['tournament', 'mathematics'],
            completed: false,
            progress: 0
          },
          {
            id: 'rec_5',
            title: '诈唬技巧训练',
            description: '掌握诈唬时机，学会平衡价值下注与诈唬',
            scenario: 'BLUFFING',
            difficulty: 4,
            estimatedTime: 40,
            expectedImprovement: 50,
            skillFocus: ['psychology', 'postflop'],
            completed: false,
            progress: 0
          }
        ],
        milestones: [
          {
            id: 'milestone_1',
            title: '阶段 1: preflop技能提升',
            description: '完成3个相关训练，重点提升preflop技能',
            targetSkill: 'preflop',
            targetImprovement: 65,
            estimatedTimeToComplete: 50,
            prerequisites: [],
            completed: true,
            progress: 100
          },
          {
            id: 'milestone_2',
            title: '阶段 2: postflop技能提升',
            description: '完成3个相关训练，重点提升postflop技能',
            targetSkill: 'postflop',
            targetImprovement: 80,
            estimatedTimeToComplete: 105,
            prerequisites: ['milestone_1'],
            completed: false,
            progress: 65
          },
          {
            id: 'milestone_3',
            title: '阶段 3: tournament技能提升',
            description: '完成2个相关训练，重点提升tournament技能',
            targetSkill: 'tournament',
            targetImprovement: 60,
            estimatedTimeToComplete: 155,
            prerequisites: ['milestone_2'],
            completed: false,
            progress: 0
          }
        ]
      });
    } finally {
      setLoading(false);
    }
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

  const getSkillDisplayName = (skill: string) => {
    const skillNames: Record<string, string> = {
      preflop: '翻前策略',
      postflop: '翻后游戏',
      psychology: '心理博弈',
      mathematics: '数学计算',
      bankroll: '资金管理',
      tournament: '锦标赛'
    };
    return skillNames[skill] || skill;
  };

  const handleStartRecommendation = (recommendation: TrainingRecommendation) => {
    // Navigate to training session or open training modal
    logger.info('Starting recommendation', { recommendationId: recommendation.id });
    // TODO: Implement navigation logic
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !trainingPlan) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {error ? '加载失败' : '暂无学习路径'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error || '请先完成一些基础评估来生成个性化学习路径'}
        </p>
        {error && (
          <button
            onClick={loadLearningPath}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            重新加载
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Route className="w-6 h-6 mr-2 text-purple-600" />
              {trainingPlan.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {trainingPlan.description}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">总进度</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {trainingPlan.totalProgress}%
              </p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-purple-600 dark:text-purple-400"
                  strokeDasharray={`${(trainingPlan.totalProgress || 0) * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Plan Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">预计时长</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {trainingPlan.estimatedDuration}小时
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">预期提升</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  +{trainingPlan.expectedOverallImprovement}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">已完成</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {trainingPlan.completedRecommendations}/{trainingPlan.recommendations.length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">难度级别</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {getDifficultyLabel(trainingPlan.difficulty)}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      {!compact && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { key: 'overview', label: '概览', icon: BarChart3 },
              { key: 'recommendations', label: '训练项目', icon: BookOpen },
              { key: 'milestones', label: '里程碑', icon: Award }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                  activeView === tab.key
                    ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-400'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeView === 'overview' && (
                  <div className="space-y-6">
                    {/* Progress Timeline */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">学习进度时间线</h3>
                      <div className="space-y-4">
                        {trainingPlan.milestones.map((milestone, index) => (
                          <div key={milestone.id} className="flex items-start space-x-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                milestone.completed 
                                  ? 'bg-green-500 text-white' 
                                  : milestone.progress && milestone.progress > 0
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {milestone.completed ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : milestone.progress && milestone.progress > 0 ? (
                                  <Play className="w-4 h-4" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </div>
                              {index < trainingPlan.milestones.length - 1 && (
                                <div className={`w-0.5 h-16 ${
                                  milestone.completed ? 'bg-green-300' : 'bg-gray-200 dark:bg-gray-700'
                                }`} />
                              )}
                            </div>
                            
                            <div className="flex-1 pb-8">
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                  {milestone.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {milestone.description}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>目标提升: +{milestone.targetImprovement}分</span>
                                    <span>预计时间: {milestone.estimatedTimeToComplete}分钟</span>
                                  </div>
                                  
                                  {milestone.progress !== undefined && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {milestone.progress}%
                                      </span>
                                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div 
                                          className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                                          style={{ width: `${milestone.progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeView === 'recommendations' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">训练项目 ({trainingPlan.recommendations.length})</h3>
                    
                    <div className="space-y-4">
                      {trainingPlan.recommendations.map((rec, index) => (
                        <motion.div
                          key={rec.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                            rec.completed 
                              ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                              : rec.progress && rec.progress > 0
                              ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              rec.completed 
                                ? 'bg-green-500 text-white' 
                                : rec.progress && rec.progress > 0
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {rec.completed ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : rec.progress && rec.progress > 0 ? (
                                <Play className="w-5 h-5" />
                              ) : (
                                <span className="text-sm font-bold">{index + 1}</span>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {rec.title}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(rec.difficulty)}`}>
                                  {getDifficultyLabel(rec.difficulty)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {rec.description}
                              </p>

                              <div className="flex items-center space-x-4 mb-3 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{rec.estimatedTime}分钟</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <TrendingUp className="w-4 h-4" />
                                  <span>+{rec.expectedImprovement}分</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Target className="w-4 h-4" />
                                  <span>{rec.skillFocus.map(skill => getSkillDisplayName(skill)).join(', ')}</span>
                                </div>
                              </div>

                              {rec.progress !== undefined && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">进度</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {rec.progress}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-300 ${
                                        rec.completed ? 'bg-green-500' : 'bg-blue-600'
                                      }`}
                                      style={{ width: `${rec.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {rec.completed ? '✅ 已完成' : rec.progress && rec.progress > 0 ? '🔄 进行中' : '⏳ 待开始'}
                                </div>
                                
                                {!rec.completed && (
                                  <button
                                    onClick={() => handleStartRecommendation(rec)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                                  >
                                    <span>{rec.progress && rec.progress > 0 ? '继续' : '开始'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeView === 'milestones' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">学习里程碑</h3>
                    
                    <div className="grid gap-6">
                      {trainingPlan.milestones.map((milestone, index) => (
                        <motion.div
                          key={milestone.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-6 transition-all duration-200 ${
                            milestone.completed 
                              ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-700 dark:from-green-900/20 dark:to-emerald-900/20'
                              : milestone.progress && milestone.progress > 0
                              ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:border-blue-700 dark:from-blue-900/20 dark:to-cyan-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              milestone.completed 
                                ? 'bg-green-500 text-white' 
                                : milestone.progress && milestone.progress > 0
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {milestone.completed ? (
                                <CheckCircle className="w-6 h-6" />
                              ) : milestone.progress && milestone.progress > 0 ? (
                                <Play className="w-6 h-6" />
                              ) : (
                                <Award className="w-6 h-6" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {milestone.title}
                                  </h4>
                                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {milestone.description}
                                  </p>
                                </div>
                                
                                {milestone.progress !== undefined && (
                                  <div className="text-right">
                                    <div className={`text-2xl font-bold ${
                                      milestone.completed ? 'text-green-600' : 'text-blue-600'
                                    }`}>
                                      {milestone.progress}%
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">完成度</div>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-3">
                                  <div className="flex items-center space-x-2">
                                    <Target className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      目标技能
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {getSkillDisplayName(milestone.targetSkill)}
                                  </p>
                                </div>

                                <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-3">
                                  <div className="flex items-center space-x-2">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      预期提升
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    +{milestone.targetImprovement} 评分点
                                  </p>
                                </div>

                                <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-3">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      预计时间
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {Math.floor(milestone.estimatedTimeToComplete / 60)}小时{milestone.estimatedTimeToComplete % 60}分钟
                                  </p>
                                </div>
                              </div>

                              {milestone.progress !== undefined && (
                                <div className="mb-4">
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                    <div 
                                      className={`h-3 rounded-full transition-all duration-300 ${
                                        milestone.completed 
                                          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                          : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                      }`}
                                      style={{ width: `${milestone.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {milestone.completed ? (
                                    <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                      <CheckCircle className="w-4 h-4" />
                                      <span>已完成</span>
                                    </span>
                                  ) : milestone.progress && milestone.progress > 0 ? (
                                    <span className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                                      <Play className="w-4 h-4" />
                                      <span>进行中</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center space-x-1">
                                      <Circle className="w-4 h-4" />
                                      <span>待开始</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Compact View */}
      {compact && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Route className="w-5 h-5 mr-2 text-purple-600" />
            当前学习路径
          </h3>
          
          <div className="space-y-3">
            {trainingPlan.recommendations.slice(0, 3).map((rec, index) => (
              <div key={rec.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  rec.completed 
                    ? 'bg-green-500 text-white' 
                    : rec.progress && rec.progress > 0
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {rec.completed ? '✓' : index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {rec.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {rec.estimatedTime}分钟 • +{rec.expectedImprovement}分
                  </p>
                </div>

                {rec.progress !== undefined && (
                  <div className="w-12 text-xs text-gray-500 dark:text-gray-400 text-right">
                    {rec.progress}%
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/personalization/path"
              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              查看完整路径 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathViewer;