'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
  Star,
  Zap,
  AlertTriangle,
  RefreshCw,
  Plus,
  Settings,
  Play,
  Pause,
  Edit3
} from 'lucide-react';
import Link from 'next/link';
import { createLogger } from '@/lib/logger';

const logger = createLogger('goal-tracker');

interface LearningGoal {
  id: string;
  title: string;
  description: string;
  category: 'skill' | 'achievement' | 'habit' | 'performance';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  skillFocus?: string[];
  milestones?: GoalMilestone[];
  status: 'active' | 'completed' | 'paused' | 'failed' | 'overdue';
  createdAt: string;
  completedAt?: string;
  lastUpdated?: string;
}

interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  completed: boolean;
  completedAt?: string;
}

interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overallProgress: number;
  streakDays: number;
  thisWeekProgress: number;
}

interface GoalTrackerProps {
  userId: string;
  compact?: boolean;
  className?: string;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  userId,
  compact = false,
  className = ''
}) => {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('active');
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal | null>(null);

  useEffect(() => {
    loadGoalData();
  }, [userId]);

  const loadGoalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [goalsRes, statsRes] = await Promise.all([
        fetch(`/api/personalization/goals?userId=${userId}`),
        fetch(`/api/personalization/goals/stats?userId=${userId}`)
      ]);

      if (goalsRes.ok && statsRes.ok) {
        const [goalsData, statsData] = await Promise.all([
          goalsRes.json(),
          statsRes.json()
        ]);

        if (goalsData.success) setGoals(goalsData.data);
        if (statsData.success) setStats(statsData.data);
      }

      // Mock data for development
      const mockGoals: LearningGoal[] = [
        {
          id: 'goal_1',
          title: '提升整体技能评分',
          description: '在30天内将技能评分提升100分',
          category: 'performance',
          targetValue: 100,
          currentValue: 65,
          unit: '评分点',
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          skillFocus: ['overall'],
          status: 'active',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          milestones: [
            { id: 'm1', title: '前25分', targetValue: 25, completed: true, completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'm2', title: '前50分', targetValue: 50, completed: true, completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'm3', title: '前75分', targetValue: 75, completed: false },
            { id: 'm4', title: '目标达成', targetValue: 100, completed: false }
          ]
        },
        {
          id: 'goal_2',
          title: '每日训练习惯',
          description: '连续21天每日进行至少15分钟训练',
          category: 'habit',
          targetValue: 21,
          currentValue: 14,
          unit: '天',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          status: 'active',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'goal_3',
          title: '完成GTO基础课程',
          description: '学完5门GTO相关课程',
          category: 'achievement',
          targetValue: 5,
          currentValue: 5,
          unit: '门课程',
          deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          status: 'completed',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'goal_4',
          title: '锦标赛技能提升',
          description: '锦标赛技能评分提升50分',
          category: 'skill',
          targetValue: 50,
          currentValue: 15,
          unit: '评分点',
          deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'low',
          status: 'overdue',
          createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setGoals(mockGoals);
      setStats({
        totalGoals: 4,
        activeGoals: 2,
        completedGoals: 1,
        overallProgress: 68,
        streakDays: 14,
        thisWeekProgress: 25
      });

      logger.info('Goal data loaded successfully', { userId, goalCount: mockGoals.length });
    } catch (error) {
      logger.error('Error loading goal data:', error);
      setError('加载目标数据失败');
    } finally {
      setLoading(false);
    }
  };

  const updateGoalProgress = async (goalId: string, newValue: number) => {
    try {
      const response = await fetch(`/api/personalization/goals/${goalId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentValue: newValue })
      });

      if (response.ok) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId 
            ? { 
                ...goal, 
                currentValue: newValue,
                lastUpdated: new Date().toISOString(),
                status: newValue >= goal.targetValue ? 'completed' : goal.status
              }
            : goal
        ));
        logger.info('Goal progress updated', { goalId, newValue });
      }
    } catch (error) {
      logger.error('Error updating goal progress:', error);
    }
  };

  const toggleGoalStatus = async (goalId: string, newStatus: LearningGoal['status']) => {
    try {
      const response = await fetch(`/api/personalization/goals/${goalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus })
      });

      if (response.ok) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId 
            ? { 
                ...goal, 
                status: newStatus,
                lastUpdated: new Date().toISOString(),
                completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
              }
            : goal
        ));
        logger.info('Goal status updated', { goalId, newStatus });
      }
    } catch (error) {
      logger.error('Error updating goal status:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      skill: Star,
      achievement: Award,
      habit: Calendar,
      performance: TrendingUp
    };
    return icons[category as keyof typeof icons] || Target;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      skill: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
      achievement: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
      habit: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
      performance: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[category as keyof typeof colors] || colors.skill;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
      completed: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
      paused: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400',
      failed: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
      overdue: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: '进行中',
      completed: '已完成',
      paused: '已暂停',
      failed: '已失败',
      overdue: '已逾期'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getDaysUntilDeadline = (deadline: string) => {
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getFilteredGoals = () => {
    if (activeFilter === 'all') return goals;
    if (activeFilter === 'overdue') return goals.filter(g => g.status === 'overdue');
    return goals.filter(g => g.status === activeFilter);
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          {!compact && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {[...Array(compact ? 2 : 3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredGoals = getFilteredGoals();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-bold text-gray-900 dark:text-white flex items-center ${compact ? 'text-lg' : 'text-xl'}`}>
            <Target className={`mr-2 text-green-600 ${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
            目标跟踪
          </h2>
          {!compact && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              跟踪学习目标进度，保持学习动力
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadGoalData}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            title="刷新数据"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {!compact && (
            <Link
              href="/personalization/goals"
              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>新目标</span>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {!compact && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">总目标</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalGoals}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">进行中</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeGoals}</p>
              </div>
              <Play className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">已完成</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedGoals}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">连续天数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.streakDays}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Goal Filters */}
      {!compact && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {[
            { key: 'active', label: '进行中', count: goals.filter(g => g.status === 'active').length },
            { key: 'all', label: '全部', count: goals.length },
            { key: 'completed', label: '已完成', count: goals.filter(g => g.status === 'completed').length },
            { key: 'overdue', label: '已逾期', count: goals.filter(g => g.status === 'overdue').length }
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
      )}

      {/* Goals List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredGoals.slice(0, compact ? 3 : undefined).map((goal, index) => {
            const CategoryIcon = getCategoryIcon(goal.category);
            const progressPercentage = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
            const daysLeft = getDaysUntilDeadline(goal.deadline);
            const isOverdue = daysLeft < 0;
            const isUrgent = daysLeft <= 3 && daysLeft >= 0;

            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`bg-white dark:bg-gray-900 rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-md ${
                  goal.status === 'completed' 
                    ? 'border-green-200 bg-green-50/50 dark:border-green-700 dark:bg-green-900/10'
                    : isOverdue
                    ? 'border-red-200 bg-red-50/50 dark:border-red-700 dark:bg-red-900/10'
                    : isUrgent
                    ? 'border-orange-200 bg-orange-50/50 dark:border-orange-700 dark:bg-orange-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                } ${compact ? 'p-3' : 'p-4'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(goal.category)}`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <h4 className={`font-semibold text-gray-900 dark:text-white ${compact ? 'text-sm' : 'text-base'}`}>
                        {goal.title}
                      </h4>
                      {!compact && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                      {getStatusLabel(goal.status)}
                    </span>
                    
                    {(isOverdue || isUrgent) && (
                      <AlertTriangle className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-orange-500'}`} />
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium text-gray-700 dark:text-gray-300 ${compact ? 'text-xs' : 'text-sm'}`}>
                      进度
                    </span>
                    <span className={`font-medium text-gray-900 dark:text-white ${compact ? 'text-xs' : 'text-sm'}`}>
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </span>
                  </div>
                  
                  <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${compact ? 'h-2' : 'h-3'}`}>
                    <motion.div
                      className={`rounded-full transition-all duration-300 ${compact ? 'h-2' : 'h-3'} ${
                        goal.status === 'completed' 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : isOverdue
                          ? 'bg-gradient-to-r from-red-500 to-pink-500'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  
                  <div className={`flex items-center justify-between mt-1 ${compact ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>
                    <span>{Math.round(progressPercentage)}% 完成</span>
                    <span className={getPriorityColor(goal.priority)}>
                      {goal.priority === 'high' ? '高' : goal.priority === 'medium' ? '中' : '低'}优先级
                    </span>
                  </div>
                </div>

                {/* Milestones */}
                {!compact && goal.milestones && goal.milestones.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center space-x-3">
                      {goal.milestones.map(milestone => (
                        <div key={milestone.id} className="flex items-center space-x-1">
                          <div className={`w-3 h-3 rounded-full ${
                            milestone.completed 
                              ? 'bg-green-500' 
                              : goal.currentValue >= milestone.targetValue 
                              ? 'bg-blue-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {milestone.targetValue}{goal.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center space-x-4 ${compact ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {isOverdue 
                          ? `逾期 ${Math.abs(daysLeft)} 天`
                          : daysLeft === 0 
                          ? '今天到期'
                          : `剩余 ${daysLeft} 天`
                        }
                      </span>
                    </div>
                    
                    {goal.lastUpdated && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          更新于 {new Date(goal.lastUpdated).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    )}
                  </div>

                  {!compact && goal.status === 'active' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleGoalStatus(goal.id, 'paused')}
                        className="p-1 text-gray-400 hover:text-yellow-600 transition-colors duration-200"
                        title="暂停目标"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setSelectedGoal(goal)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        title="编辑目标"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      {progressPercentage < 100 && (
                        <button
                          onClick={() => toggleGoalStatus(goal.id, 'completed')}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors duration-200"
                          title="标记完成"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {!compact && goal.status === 'paused' && (
                    <button
                      onClick={() => toggleGoalStatus(goal.id, 'active')}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors duration-200"
                    >
                      <Play className="w-4 h-4" />
                      <span>继续</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {compact && filteredGoals.length > 3 && (
        <div className="text-center">
          <Link
            href="/personalization/goals"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            查看全部 {filteredGoals.length} 个目标 →
          </Link>
        </div>
      )}

      {/* Empty State */}
      {filteredGoals.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {activeFilter === 'all' ? '暂无目标' : `暂无${activeFilter === 'active' ? '进行中的' : activeFilter === 'completed' ? '已完成的' : '已逾期的'}目标`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            设定目标能帮助您更好地跟踪学习进度
          </p>
          {!compact && (
            <Link
              href="/personalization/goals"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>创建目标</span>
            </Link>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalTracker;