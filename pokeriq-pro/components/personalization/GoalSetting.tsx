'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  Calendar,
  TrendingUp,
  Clock,
  Star,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Award,
  Zap,
  BookOpen
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('goal-setting');

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
  status: 'active' | 'completed' | 'paused' | 'failed';
  createdAt: string;
  completedAt?: string;
}

interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  completed: boolean;
  completedAt?: string;
}

interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: LearningGoal['category'];
  defaultTargetValue: number;
  unit: string;
  defaultDuration: number; // days
  skillFocus: string[];
  icon: React.ReactNode;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface GoalSettingProps {
  userId: string;
  onGoalCreated?: (goal: LearningGoal) => void;
  className?: string;
}

export const GoalSetting: React.FC<GoalSettingProps> = ({
  userId,
  onGoalCreated,
  className = ''
}) => {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [customGoal, setCustomGoal] = useState<Partial<LearningGoal>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goalTemplates: GoalTemplate[] = [
    {
      id: 'rating_improvement',
      title: '技能评分提升',
      description: '在指定时间内提升整体技能评分',
      category: 'performance',
      defaultTargetValue: 100,
      unit: '评分点',
      defaultDuration: 30,
      skillFocus: ['overall'],
      icon: <TrendingUp className="w-5 h-5" />,
      difficulty: 'beginner'
    },
    {
      id: 'daily_practice',
      title: '每日训练习惯',
      description: '建立每日训练的学习习惯',
      category: 'habit',
      defaultTargetValue: 21,
      unit: '天',
      defaultDuration: 21,
      skillFocus: ['consistency'],
      icon: <Calendar className="w-5 h-5" />,
      difficulty: 'beginner'
    },
    {
      id: 'skill_mastery',
      title: '专项技能精通',
      description: '深入掌握特定扑克技能',
      category: 'skill',
      defaultTargetValue: 1400,
      unit: '评分点',
      defaultDuration: 60,
      skillFocus: ['preflop', 'postflop', 'psychology'],
      icon: <Star className="w-5 h-5" />,
      difficulty: 'intermediate'
    },
    {
      id: 'course_completion',
      title: '课程学习目标',
      description: '完成指定数量的学习课程',
      category: 'achievement',
      defaultTargetValue: 5,
      unit: '门课程',
      defaultDuration: 30,
      skillFocus: ['knowledge'],
      icon: <BookOpen className="w-5 h-5" />,
      difficulty: 'beginner'
    },
    {
      id: 'tournament_performance',
      title: '锦标赛表现目标',
      description: '提升锦标赛相关技能和表现',
      category: 'performance',
      defaultTargetValue: 200,
      unit: '评分点',
      defaultDuration: 45,
      skillFocus: ['tournament'],
      icon: <Award className="w-5 h-5" />,
      difficulty: 'advanced'
    },
    {
      id: 'speed_improvement',
      title: '决策速度提升',
      description: '提高游戏中的决策速度和准确性',
      category: 'skill',
      defaultTargetValue: 30,
      unit: '秒减少',
      defaultDuration: 21,
      skillFocus: ['speed', 'accuracy'],
      icon: <Zap className="w-5 h-5" />,
      difficulty: 'intermediate'
    }
  ];

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      const response = await fetch(`/api/personalization/goals?userId=${userId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setGoals(result.data);
        }
      }

      // Mock data for development
      setGoals([
        {
          id: 'goal_1',
          title: '提升整体技能评分',
          description: '在30天内将技能评分提升100分',
          category: 'performance',
          targetValue: 100,
          currentValue: 35,
          unit: '评分点',
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          skillFocus: ['overall'],
          status: 'active',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          milestones: [
            { id: 'm1', title: '前25分', targetValue: 25, completed: true, completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'm2', title: '前50分', targetValue: 50, completed: false },
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
          currentValue: 7,
          unit: '天',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          status: 'active',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

      logger.info('Goals loaded successfully', { userId, count: goals.length });
    } catch (error) {
      logger.error('Error loading goals:', error);
      setError('加载目标失败');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: Partial<LearningGoal>) => {
    try {
      setSaving(true);
      setError(null);

      const newGoal: LearningGoal = {
        id: `goal_${Date.now()}`,
        title: goalData.title!,
        description: goalData.description!,
        category: goalData.category!,
        targetValue: goalData.targetValue!,
        currentValue: 0,
        unit: goalData.unit!,
        deadline: goalData.deadline!,
        priority: goalData.priority || 'medium',
        skillFocus: goalData.skillFocus || [],
        status: 'active',
        createdAt: new Date().toISOString(),
        milestones: generateMilestones(goalData.targetValue!)
      };

      // TODO: Replace with actual API call
      const response = await fetch('/api/personalization/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, goal: newGoal })
      });

      setGoals(prev => [...prev, newGoal]);
      onGoalCreated?.(newGoal);
      setShowCreateForm(false);
      setSelectedTemplate(null);
      setCustomGoal({});

      logger.info('Goal created successfully', { goalId: newGoal.id });
    } catch (error) {
      logger.error('Error creating goal:', error);
      setError('创建目标失败');
    } finally {
      setSaving(false);
    }
  };

  const generateMilestones = (targetValue: number): GoalMilestone[] => {
    const milestones: GoalMilestone[] = [];
    const stepSize = Math.ceil(targetValue / 4);
    
    for (let i = 1; i <= 4; i++) {
      const value = Math.min(stepSize * i, targetValue);
      milestones.push({
        id: `m${i}`,
        title: i === 4 ? '目标达成' : `阶段 ${i}`,
        targetValue: value,
        completed: false
      });
    }
    
    return milestones;
  };

  const handleTemplateSelect = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setCustomGoal({
      title: template.title,
      description: template.description,
      category: template.category,
      targetValue: template.defaultTargetValue,
      unit: template.unit,
      deadline: new Date(Date.now() + template.defaultDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      skillFocus: template.skillFocus
    });
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

  const getCategoryLabel = (category: string) => {
    const labels = {
      skill: '技能目标',
      achievement: '成就目标',
      habit: '习惯目标',
      performance: '表现目标'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
      medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
      low: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
      intermediate: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
      advanced: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[difficulty as keyof typeof colors] || colors.beginner;
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-600" />
            学习目标设定
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            设定明确的学习目标，跟踪进度并保持动力
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>创建目标</span>
        </button>
      </div>

      {/* Current Goals */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          当前目标 ({goals.filter(g => g.status === 'active').length})
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.filter(g => g.status === 'active').map(goal => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {goal.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {goal.description}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                    {getCategoryLabel(goal.category)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                    {goal.priority === 'high' ? '高' : goal.priority === 'medium' ? '中' : '低'}优先级
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">进度</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {goal.currentValue} / {goal.targetValue} {goal.unit}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <motion.div
                    className="h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round((goal.currentValue / goal.targetValue) * 100)}% 完成
                </div>
              </div>

              {/* Milestones */}
              {goal.milestones && goal.milestones.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">里程碑</h5>
                  <div className="space-y-2">
                    {goal.milestones.map(milestone => (
                      <div key={milestone.id} className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          milestone.completed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          {milestone.completed && <CheckCircle className="w-3 h-3" />}
                        </div>
                        <span className={`text-sm ${
                          milestone.completed 
                            ? 'text-green-600 dark:text-green-400 line-through' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {milestone.title} ({milestone.targetValue} {goal.unit})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deadline */}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>截止: {new Date(goal.deadline).toLocaleDateString('zh-CN')}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    剩余 {Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} 天
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Goal Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateForm(false);
              setSelectedTemplate(null);
              setCustomGoal({});
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedTemplate ? '自定义目标' : '选择目标模板'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setSelectedTemplate(null);
                      setCustomGoal({});
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!selectedTemplate ? (
                  /* Template Selection */
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      选择一个目标模板开始，或创建自定义目标
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {goalTemplates.map(template => (
                        <motion.button
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTemplateSelect(template)}
                          className="text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                              {template.icon}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                {template.title}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {template.description}
                              </p>
                              
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                                  {getCategoryLabel(template.category)}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                                  {template.difficulty === 'beginner' ? '入门' : 
                                   template.difficulty === 'intermediate' ? '中级' : '高级'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    <button
                      onClick={() => setSelectedTemplate({} as GoalTemplate)}
                      className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      <Plus className="w-5 h-5 mx-auto mb-2" />
                      创建自定义目标
                    </button>
                  </div>
                ) : (
                  /* Goal Creation Form */
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    createGoal(customGoal);
                  }}>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            目标标题 *
                          </label>
                          <input
                            type="text"
                            required
                            value={customGoal.title || ''}
                            onChange={(e) => setCustomGoal(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="输入目标标题"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            目标类别 *
                          </label>
                          <select
                            required
                            value={customGoal.category || ''}
                            onChange={(e) => setCustomGoal(prev => ({ ...prev, category: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">选择类别</option>
                            <option value="skill">技能目标</option>
                            <option value="achievement">成就目标</option>
                            <option value="habit">习惯目标</option>
                            <option value="performance">表现目标</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          目标描述
                        </label>
                        <textarea
                          value={customGoal.description || ''}
                          onChange={(e) => setCustomGoal(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          placeholder="详细描述您的学习目标"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            目标数值 *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={customGoal.targetValue || ''}
                            onChange={(e) => setCustomGoal(prev => ({ ...prev, targetValue: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            单位 *
                          </label>
                          <input
                            type="text"
                            required
                            value={customGoal.unit || ''}
                            onChange={(e) => setCustomGoal(prev => ({ ...prev, unit: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="评分点"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            优先级
                          </label>
                          <select
                            value={customGoal.priority || 'medium'}
                            onChange={(e) => setCustomGoal(prev => ({ ...prev, priority: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="low">低优先级</option>
                            <option value="medium">中优先级</option>
                            <option value="high">高优先级</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          截止日期 *
                        </label>
                        <input
                          type="date"
                          required
                          value={customGoal.deadline || ''}
                          onChange={(e) => setCustomGoal(prev => ({ ...prev, deadline: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setSelectedTemplate(null);
                            setCustomGoal({});
                          }}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          <Save className="w-4 h-4" />
                          <span>{saving ? '创建中...' : '创建目标'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {goals.filter(g => g.status === 'active').length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            暂无活跃目标
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            设定您的第一个学习目标，开始系统化的扑克技能提升之旅
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>创建目标</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalSetting;