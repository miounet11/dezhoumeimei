'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Clock,
  Award,
  Zap,
  Activity,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('progress-charts');

interface SkillProgress {
  skill: string;
  current: number;
  previous: number;
  trend: number;
  sessions: number;
}

interface DailyProgress {
  date: string;
  skillGain: number;
  sessionsCompleted: number;
  timeSpent: number; // minutes
  accuracy: number; // percentage
}

interface ProgressStats {
  totalSkillGain: number;
  totalSessions: number;
  totalTimeSpent: number;
  averageAccuracy: number;
  weeklyGrowth: number;
  bestStreak: number;
  currentStreak: number;
}

interface ProgressChartsProps {
  userId: string;
  compact?: boolean;
  timeframe?: 'week' | 'month' | '3month';
  className?: string;
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({
  userId,
  compact = false,
  timeframe = 'month',
  className = ''
}) => {
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedChart, setSelectedChart] = useState<'skills' | 'daily' | 'trends'>('skills');

  useEffect(() => {
    loadProgressData();
  }, [userId, selectedTimeframe]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/personalization/progress?userId=${userId}&timeframe=${selectedTimeframe}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSkillProgress(result.data.skillProgress);
          setDailyProgress(result.data.dailyProgress);
          setStats(result.data.stats);
        }
      }

      // Mock data for development
      const mockSkillProgress: SkillProgress[] = [
        { skill: 'preflop', current: 1180, previous: 1120, trend: 5.4, sessions: 15 },
        { skill: 'postflop', current: 1050, previous: 980, trend: 7.1, sessions: 22 },
        { skill: 'psychology', current: 1280, previous: 1200, trend: 6.7, sessions: 12 },
        { skill: 'mathematics', current: 950, previous: 920, trend: 3.3, sessions: 18 },
        { skill: 'bankroll', current: 1350, previous: 1300, trend: 3.8, sessions: 8 },
        { skill: 'tournament', current: 880, previous: 850, trend: 3.5, sessions: 10 }
      ];

      const mockDailyProgress: DailyProgress[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        
        return {
          date: date.toISOString().split('T')[0],
          skillGain: Math.random() * 15 + 2,
          sessionsCompleted: Math.floor(Math.random() * 4) + 1,
          timeSpent: Math.random() * 60 + 15,
          accuracy: Math.random() * 20 + 75
        };
      });

      setSkillProgress(mockSkillProgress);
      setDailyProgress(mockDailyProgress);
      setStats({
        totalSkillGain: 180,
        totalSessions: 85,
        totalTimeSpent: 1520,
        averageAccuracy: 82.5,
        weeklyGrowth: 12.3,
        bestStreak: 14,
        currentStreak: 7
      });

      logger.info('Progress data loaded successfully', { userId });
    } catch (error) {
      logger.error('Error loading progress data:', error);
      setError('加载进度数据失败');
    } finally {
      setLoading(false);
    }
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

  const getSkillColor = (skill: string) => {
    const colors: Record<string, string> = {
      preflop: 'bg-blue-500',
      postflop: 'bg-green-500',
      psychology: 'bg-purple-500',
      mathematics: 'bg-red-500',
      bankroll: 'bg-yellow-500',
      tournament: 'bg-pink-500'
    };
    return colors[skill] || 'bg-gray-500';
  };

  const maxSkillValue = useMemo(() => {
    return Math.max(...skillProgress.map(s => s.current), 1500);
  }, [skillProgress]);

  const chartData = useMemo(() => {
    if (selectedChart === 'daily') {
      return dailyProgress.slice(-14); // Last 14 days
    }
    return dailyProgress.slice(-7); // Last 7 days for trends
  }, [dailyProgress, selectedChart]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-bold text-gray-900 dark:text-white flex items-center ${compact ? 'text-lg' : 'text-xl'}`}>
                <BarChart3 className={`mr-2 text-blue-600 ${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
                学习进度分析
              </h3>
              {!compact && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  跟踪技能提升和学习趋势
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadProgressData}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                title="刷新数据"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          {!compact && (
            <div className="flex items-center space-x-1 mt-4">
              {[
                { key: 'skills', label: '技能对比', icon: Target },
                { key: 'daily', label: '每日进度', icon: Calendar },
                { key: 'trends', label: '趋势分析', icon: TrendingUp }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedChart(tab.key as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    selectedChart === tab.key
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="px-6 pb-6">
          {selectedChart === 'skills' || compact ? (
            /* Skills Progress Chart */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  技能评分对比
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  相比上期变化
                </div>
              </div>

              <div className="space-y-3">
                {skillProgress.map(skill => (
                  <motion.div
                    key={skill.skill}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center space-x-4"
                  >
                    <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getSkillDisplayName(skill.skill)}
                    </div>

                    <div className="flex-1 relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {skill.current} 分
                        </span>
                        <span className={`text-xs flex items-center space-x-1 ${
                          skill.trend > 0 ? 'text-green-600' : skill.trend < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {skill.trend > 0 ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : skill.trend < 0 ? (
                            <ArrowDown className="w-3 h-3" />
                          ) : null}
                          <span>{Math.abs(skill.trend)}%</span>
                        </span>
                      </div>

                      <div className="relative">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <motion.div
                            className={`h-3 rounded-full ${getSkillColor(skill.skill)}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(skill.current / maxSkillValue) * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                          />
                        </div>

                        {/* Previous value indicator */}
                        <div
                          className="absolute top-0 w-0.5 h-3 bg-gray-400 dark:bg-gray-500"
                          style={{ left: `${(skill.previous / maxSkillValue) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                      {skill.sessions} 次
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : selectedChart === 'daily' ? (
            /* Daily Progress Chart */
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                每日学习进度
              </h4>

              <div className="relative">
                {/* Chart Area */}
                <div className="flex items-end space-x-2 h-48 overflow-x-auto pb-4">
                  {chartData.map((day, index) => (
                    <motion.div
                      key={day.date}
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.skillGain / 20) * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="flex-shrink-0 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg min-w-[20px] relative group"
                      style={{ minHeight: '4px' }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        <div>{new Date(day.date).toLocaleDateString('zh-CN')}</div>
                        <div>技能提升: +{day.skillGain.toFixed(1)}</div>
                        <div>学习时长: {Math.round(day.timeSpent)}分钟</div>
                        <div>准确率: {day.accuracy.toFixed(1)}%</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* X-axis labels */}
                <div className="flex space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  {chartData.map((day, index) => (
                    <div key={day.date} className="flex-shrink-0 min-w-[20px] text-center">
                      {index % 3 === 0 ? new Date(day.date).getDate() : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Trends Analysis */
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                学习趋势分析
              </h4>

              {/* Trend Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300">技能增长率</p>
                      <p className="text-xl font-bold text-green-800 dark:text-green-200">
                        +{stats?.weeklyGrowth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">平均准确率</p>
                      <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                        {stats?.averageAccuracy.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-700 dark:text-purple-300">当前连击</p>
                      <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                        {stats?.currentStreak} 天
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Trends */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                  本周学习分析
                </h5>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">总学习时长</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.floor((stats?.totalTimeSpent || 0) / 60)}小时{(stats?.totalTimeSpent || 0) % 60}分钟
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">完成训练</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {stats?.totalSessions} 次
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">技能总提升</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      +{stats?.totalSkillGain} 分
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">最佳连击</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {stats?.bestStreak} 天
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timeframe Selector */}
        {!compact && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                时间范围
              </div>
              <div className="flex items-center space-x-1">
                {[
                  { key: 'week', label: '7天' },
                  { key: 'month', label: '30天' },
                  { key: '3month', label: '90天' }
                ].map(period => (
                  <button
                    key={period.key}
                    onClick={() => setSelectedTimeframe(period.key as any)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      selectedTimeframe === period.key
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-red-600 dark:text-red-400 mr-3">⚠</div>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressCharts;