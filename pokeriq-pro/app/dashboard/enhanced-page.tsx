'use client';

import React, { useState } from 'react';
import { 
  Play, 
  TrendingUp, 
  Award, 
  Target, 
  Zap, 
  Brain,
  Star,
  ChevronRight,
  Settings,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

// Import our enhanced components
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { OptimizedCard, ResponsiveGrid, OptimizedSection, StatItem } from '@/components/layout/OptimizedLayouts';
import { 
  AnimatedProgressRing, 
  FloatingActionButton, 
  Confetti, 
  TypingAnimation,
  MagneticButton 
} from '@/components/ui/MicroInteractions';
import { useApp } from '@/lib/context/OptimizedAppContext';

// Enhanced Dashboard with all UX improvements
export default function EnhancedDashboardPage() {
  const { state, startTrainingWorkflow, addNotification } = useApp();
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);

  // Mock data - replace with real data
  const stats = {
    gamesPlayed: 1247,
    winRate: 68.5,
    totalEarnings: 12450,
    currentStreak: 8,
    level: 15,
    experience: 7850,
    nextLevelExp: 10000,
  };

  const recentAchievements = [
    { id: 1, name: '连胜高手', progress: 80, icon: '🔥', color: 'red' },
    { id: 2, name: 'GTO专家', progress: 65, icon: '🎯', color: 'blue' },
    { id: 3, name: '心理大师', progress: 90, icon: '🧠', color: 'purple' },
    { id: 4, name: '数据分析师', progress: 45, icon: '📊', color: 'green' },
  ];

  const quickActions = [
    {
      id: 'training',
      title: '开始训练',
      description: '智能AI训练系统',
      icon: Brain,
      color: 'purple',
      onClick: () => {
        setSelectedQuickAction('training');
        startTrainingWorkflow();
        setShowConfetti(true);
      }
    },
    {
      id: 'tournament',
      title: '锦标赛',
      description: '参加实时锦标赛',
      icon: Award,
      color: 'yellow',
      onClick: () => setSelectedQuickAction('tournament')
    },
    {
      id: 'analysis',
      title: '分析中心',
      description: '查看详细统计',
      icon: TrendingUp,
      color: 'green',
      onClick: () => setSelectedQuickAction('analysis')
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Confetti Effect */}
      <Confetti 
        active={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header with Enhanced Welcome */}
        <OptimizedSection
          title="🏆 控制台"
          subtitle={
            <TypingAnimation 
              text="欢迎回来，今天是提升牌技的好日子！"
              speed={50}
              className="text-lg"
            />
          }
          action={
            <div className="flex items-center space-x-3">
              <EnhancedButton
                variant="secondary"
                size="sm"
                leftIcon={<Settings className="w-4 h-4" />}
                hapticFeedback
              >
                设置
              </EnhancedButton>
            </div>
          }
        />

        {/* Enhanced Statistics Grid */}
        <OptimizedSection title="📊 数据概览" spacing="normal">
          <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 4 }} gap={6}>
            <StatItem
              icon={<Play className="w-7 h-7" />}
              label="总游戏数"
              value={stats.gamesPlayed.toLocaleString()}
              trend={{ value: 12, isPositive: true, label: '较上周' }}
              color="purple"
            />
            
            <StatItem
              icon={<TrendingUp className="w-7 h-7" />}
              label="胜率"
              value={`${stats.winRate}%`}
              trend={{ value: 3.2, isPositive: true, label: '较上周' }}
              color="green"
            />
            
            <StatItem
              icon={<Award className="w-7 h-7" />}
              label="总盈利"
              value={`$${stats.totalEarnings.toLocaleString()}`}
              trend={{ value: 8.5, isPositive: true, label: '本月' }}
              color="orange"
            />
            
            <StatItem
              icon={<Zap className="w-7 h-7" />}
              label="连胜纪录"
              value={`${stats.currentStreak} 场`}
              trend={{ value: 5, isPositive: true, label: '历史最高' }}
              color="red"
            />
          </ResponsiveGrid>
        </OptimizedSection>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <OptimizedSection title="🚀 快速开始" spacing="tight">
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <MagneticButton
                      className={`
                        w-full p-4 rounded-xl transition-all duration-300 text-left
                        ${selectedQuickAction === action.id 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-xl' 
                          : 'bg-white dark:bg-gray-800 hover:shadow-lg border border-gray-200 dark:border-gray-700'
                        }
                      `}
                      onClick={action.onClick}
                      strength={0.2}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`
                            p-2 rounded-lg 
                            ${selectedQuickAction === action.id 
                              ? 'bg-white/20' 
                              : 'bg-gray-100 dark:bg-gray-700'
                            }
                          `}>
                            <action.icon className={`
                              w-5 h-5 
                              ${selectedQuickAction === action.id 
                                ? 'text-white' 
                                : 'text-gray-600 dark:text-gray-400'
                              }
                            `} />
                          </div>
                          <div>
                            <h3 className={`
                              font-semibold 
                              ${selectedQuickAction === action.id 
                                ? 'text-white' 
                                : 'text-gray-900 dark:text-white'
                              }
                            `}>
                              {action.title}
                            </h3>
                            <p className={`
                              text-sm 
                              ${selectedQuickAction === action.id 
                                ? 'text-white/80' 
                                : 'text-gray-500 dark:text-gray-400'
                              }
                            `}>
                              {action.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`
                          w-5 h-5 transition-transform duration-200
                          ${selectedQuickAction === action.id 
                            ? 'text-white translate-x-1' 
                            : 'text-gray-400'
                          }
                        `} />
                      </div>
                    </MagneticButton>
                  </motion.div>
                ))}
              </div>
            </OptimizedSection>
          </div>

          {/* Progress and Achievements */}
          <div className="lg:col-span-2 space-y-8">
            {/* Level Progress */}
            <OptimizedCard
              title="等级进度"
              subtitle="距离下一等级还需 2,150 经验值"
              variant="gradient"
              size="md"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span>等级 {stats.level}</span>
                    <span>等级 {stats.level + 1}</span>
                  </div>
                  
                  <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.experience / stats.nextLevelExp) * 100}%` }}
                      transition={{ duration: 2, delay: 0.5 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </motion.div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>{stats.experience.toLocaleString()} XP</span>
                    <span>{stats.nextLevelExp.toLocaleString()} XP</span>
                  </div>
                </div>
                
                <AnimatedProgressRing
                  progress={(stats.experience / stats.nextLevelExp) * 100}
                  size={80}
                  strokeWidth={6}
                  color="#8b5cf6"
                  showPercentage={false}
                >
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.level}
                    </div>
                    <div className="text-xs text-gray-500">等级</div>
                  </div>
                </AnimatedProgressRing>
              </div>
            </OptimizedCard>

            {/* Achievements Grid */}
            <OptimizedSection title="🏆 成就进度" spacing="tight">
              <ResponsiveGrid cols={{ xs: 1, sm: 2 }} gap={4}>
                {recentAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <OptimizedCard
                      variant="glass"
                      size="sm"
                      clickable
                      className="group hover:scale-105 transition-transform duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl group-hover:animate-bounce">
                            {achievement.icon}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {achievement.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-500">
                          {achievement.progress}%
                        </span>
                      </div>
                      
                      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${
                            achievement.color === 'red' ? 'from-red-500 to-pink-500' :
                            achievement.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                            achievement.color === 'purple' ? 'from-purple-500 to-pink-500' :
                            'from-green-500 to-emerald-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${achievement.progress}%` }}
                          transition={{ duration: 1.5, delay: index * 0.2 }}
                        />
                      </div>
                    </OptimizedCard>
                  </motion.div>
                ))}
              </ResponsiveGrid>
            </OptimizedSection>
          </div>
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton
          onClick={() => {
            addNotification({
              type: 'info',
              title: '快速训练',
              message: '开始15分钟快速训练？',
              read: false,
            });
          }}
          icon={<Play className="w-6 h-6" />}
          label="快速训练"
          pulse
        />
      </div>
    </div>
  );
}