'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Fire,
  Calendar,
  Target,
  Trophy,
  Star,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  Circle
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('streak-tracker');

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  streakHistory: StreakDay[];
  achievements: StreakAchievement[];
  nextMilestone: {
    target: number;
    reward: string;
    daysLeft: number;
  };
}

interface StreakDay {
  date: string;
  hasActivity: boolean;
  activityType: 'training' | 'study' | 'practice' | 'assessment';
  duration: number; // minutes
  skillPoints: number;
}

interface StreakAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  requirement: number;
  isUnlocked: boolean;
}

interface StreakTrackerProps {
  userId: string;
  compact?: boolean;
  showHistory?: boolean;
  className?: string;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  userId,
  compact = false,
  showHistory = true,
  className = ''
}) => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<StreakDay | null>(null);

  useEffect(() => {
    loadStreakData();
  }, [userId]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/personalization/streak?userId=${userId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStreakData(result.data);
        }
      }

      // Mock data for development
      const today = new Date();
      const mockHistory: StreakDay[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (29 - i));
        
        const hasActivity = Math.random() > 0.3; // 70% chance of activity
        
        return {
          date: date.toISOString().split('T')[0],
          hasActivity,
          activityType: hasActivity 
            ? (['training', 'study', 'practice', 'assessment'] as const)[Math.floor(Math.random() * 4)]
            : 'training',
          duration: hasActivity ? Math.floor(Math.random() * 60) + 15 : 0,
          skillPoints: hasActivity ? Math.floor(Math.random() * 20) + 5 : 0
        };
      });

      const mockAchievements: StreakAchievement[] = [
        {
          id: 'streak_3',
          title: '坚持不懈',
          description: '连续学习3天',
          icon: '🔥',
          requirement: 3,
          isUnlocked: true,
          unlockedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'streak_7',
          title: '一周战士',
          description: '连续学习7天',
          icon: '⚡',
          requirement: 7,
          isUnlocked: true,
          unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'streak_14',
          title: '双周大师',
          description: '连续学习14天',
          icon: '🏆',
          requirement: 14,
          isUnlocked: false
        },
        {
          id: 'streak_30',
          title: '月度传奇',
          description: '连续学习30天',
          icon: '👑',
          requirement: 30,
          isUnlocked: false
        }
      ];

      const currentStreak = 12; // Mock current streak
      
      setStreakData({
        currentStreak,
        bestStreak: 18,
        totalDays: 85,
        streakHistory: mockHistory,
        achievements: mockAchievements,
        nextMilestone: {
          target: 14,
          reward: '双周大师徽章',
          daysLeft: 2
        }
      });

      logger.info('Streak data loaded successfully', { userId });
    } catch (error) {
      logger.error('Error loading streak data:', error);
      setError('加载连击数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'from-purple-500 to-pink-500';
    if (streak >= 14) return 'from-orange-500 to-red-500';
    if (streak >= 7) return 'from-yellow-500 to-orange-500';
    if (streak >= 3) return 'from-green-500 to-blue-500';
    return 'from-gray-400 to-gray-500';
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 30) return '👑';
    if (streak >= 14) return '🏆';
    if (streak >= 7) return '⚡';
    if (streak >= 3) return '🔥';
    return '⭐';
  };

  const getActivityTypeColor = (type: string) => {
    const colors = {
      training: 'bg-blue-500',
      study: 'bg-green-500',
      practice: 'bg-purple-500',
      assessment: 'bg-red-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getActivityTypeLabel = (type: string) => {
    const labels = {
      training: '训练',
      study: '学习',
      practice: '练习',
      assessment: '测评'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(21)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!streakData) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center ${className}`}>
        <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          无法加载连击数据
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {error || '请稍后重试'}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className={compact ? 'p-4' : 'p-6'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-bold text-gray-900 dark:text-white flex items-center ${compact ? 'text-lg' : 'text-xl'}`}>
              <Zap className={`mr-2 text-yellow-500 ${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
              学习连击
            </h3>
            {!compact && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                保持每日学习，建立良好的学习习惯
              </p>
            )}
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">当前连击</div>
            <div className={`text-2xl font-bold bg-gradient-to-r ${getStreakColor(streakData.currentStreak)} bg-clip-text text-transparent`}>
              {streakData.currentStreak}
            </div>
          </div>
        </div>

        {/* Current Streak Display */}
        <div className="relative mb-6">
          <div className={`bg-gradient-to-r ${getStreakColor(streakData.currentStreak)} rounded-xl p-4 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">
                  {getStreakIcon(streakData.currentStreak)}
                </div>
                <div>
                  <h4 className="text-lg font-bold">
                    {streakData.currentStreak} 天连击！
                  </h4>
                  <p className="text-sm opacity-90">
                    继续保持，向 {streakData.nextMilestone.target} 天目标冲刺
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm opacity-75">最佳记录</div>
                <div className="text-xl font-bold">{streakData.bestStreak} 天</div>
              </div>
            </div>

            {/* Progress to next milestone */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>距离 {streakData.nextMilestone.reward}</span>
                <span>{streakData.nextMilestone.daysLeft} 天</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <motion.div
                  className="h-2 bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${((streakData.nextMilestone.target - streakData.nextMilestone.daysLeft) / streakData.nextMilestone.target) * 100}%` 
                  }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-4 mb-6`}>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">学习总天数</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                  {streakData.totalDays}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">解锁成就</p>
                <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                  {streakData.achievements.filter(a => a.isUnlocked).length}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          {!compact && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">完成率</p>
                  <p className="text-xl font-bold text-green-800 dark:text-green-200">
                    {Math.round((streakData.streakHistory.filter(d => d.hasActivity).length / streakData.streakHistory.length) * 100)}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </div>
          )}
        </div>

        {/* Calendar View */}
        {showHistory && !compact && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              最近30天学习记录
            </h4>
            
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {streakData.streakHistory.slice(-21).map((day, index) => {
                const date = new Date(day.date);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <motion.button
                    key={day.date}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelectedDay(day)}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200 relative
                      ${day.hasActivity 
                        ? `${getActivityTypeColor(day.activityType)} text-white hover:scale-110`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                      ${isToday ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
                    `}
                  >
                    {date.getDate()}
                    
                    {day.hasActivity && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-2 h-2 bg-white rounded-full border border-current"></div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>训练</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>学习</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>练习</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>测评</span>
              </div>
            </div>
          </div>
        )}

        {/* Achievements */}
        {!compact && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              连击成就
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {streakData.achievements.map(achievement => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    p-3 rounded-lg border text-center transition-all duration-200
                    ${achievement.isUnlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                    }
                  `}
                >
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <h5 className={`font-medium text-sm ${
                    achievement.isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {achievement.title}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {achievement.requirement}天连击
                  </p>
                  
                  {achievement.isUnlocked ? (
                    <div className="flex items-center justify-center mt-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center mt-2">
                      <Circle className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Day Details Modal */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {new Date(selectedDay.date).toLocaleDateString('zh-CN')}
                </h4>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>

              {selectedDay.hasActivity ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded ${getActivityTypeColor(selectedDay.activityType)}`}></div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getActivityTypeLabel(selectedDay.activityType)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">学习时长</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {selectedDay.duration} 分钟
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">技能点数</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        +{selectedDay.skillPoints}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Circle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">这天没有学习活动</p>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Compact Footer */}
        {compact && (
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              继续保持，距离下一个成就还有 <span className="font-medium">{streakData.nextMilestone.daysLeft}</span> 天
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-5 h-5 text-red-600 dark:text-red-400 mr-3">⚠</div>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakTracker;