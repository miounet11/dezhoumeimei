'use client';

import { useEffect, useState } from 'react';
import { 
  Trophy,
  TrendingUp,
  DollarSign,
  Flame,
  Clock,
  BarChart3,
  Zap,
  PlayCircle,
  Settings,
  Globe,
  Target,
  Brain,
  Sparkles,
  BookOpen,
  Users,
  Star,
  ChevronRight,
  Award
} from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/src/components/layout/AppLayout';
import { useUserData } from '@/lib/hooks/useUserData';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

// Number counter animation hook
function useCounterAnimation(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (end === 0) return;
    
    const start = 0;
    const increment = end / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [end, duration]);
  
  return count;
}

export default function DashboardPage() {
  const { userData, loading, error, recentGames, recentAchievements, ladderRank } = useUserData();
  const [dashboardData, setDashboardData] = useState(null);

  const stats = {
    totalGames: userData?.stats?.totalGames || 0,
    winRate: userData?.stats?.winRate || 0,
    totalEarnings: userData?.stats?.totalEarnings || 0,
    currentStreak: userData?.stats?.currentStreak || 0,
    level: userData?.level || 0,
    rank: ladderRank?.currentRank || '未知',
    trainingHours: userData?.stats?.trainingHours || 0,
    achievements: recentAchievements?.length || 0
  };

  const animatedTotalGames = useCounterAnimation(stats.totalGames, 2000);
  const animatedEarnings = useCounterAnimation(stats.totalEarnings, 2500);
  const animatedStreak = useCounterAnimation(stats.currentStreak, 1500);
  const animatedAchievements = useCounterAnimation(stats.achievements, 1800);

  // Prepare dashboard data
  useEffect(() => {
    if (userData && recentGames && recentAchievements) {
      setDashboardData({
        progressData: {
          overallProgress: stats.winRate,
          coursesCompleted: recentAchievements?.length || 0,
          totalCourses: 20,
          currentStreak: stats.currentStreak,
          studyTimeToday: 45,
          studyTimeWeek: 280,
          weeklyGoal: 300,
          level: stats.level,
          experiencePoints: userData.experience || 7850,
          nextLevelXP: 10000
        },
        learningData: {
          skillProgression: {
            dimensions: [
              { name: 'Position Play', currentLevel: 75, maxLevel: 100, confidence: 0.85, trend: 'up' as const },
              { name: 'Bluff Detection', currentLevel: 60, maxLevel: 100, confidence: 0.70, trend: 'stable' as const },
              { name: 'Bet Sizing', currentLevel: 85, maxLevel: 100, confidence: 0.90, trend: 'up' as const },
              { name: 'Tournament Play', currentLevel: 45, maxLevel: 100, confidence: 0.60, trend: 'down' as const }
            ],
            overallProgress: stats.winRate,
            strongestSkills: ['Position Play', 'Bet Sizing'],
            weakestSkills: ['Tournament Play', 'Bluff Detection']
          },
          courseCompletion: {
            completionRate: 60,
            completedCourses: 12,
            totalCourses: 20,
            totalStudyTime: 1680, // in minutes
            averageScore: 82
          },
          studyPatterns: {
            preferredStudyTimes: Array.from({length: 24}, (_, i) => ({
              hour: i,
              count: Math.floor(Math.random() * 10) + 1,
              avgDuration: Math.floor(Math.random() * 60) + 15
            })),
            consistency: {
              streakDays: stats.currentStreak,
              studyDaysPerWeek: 5.2,
              avgSessionsPerDay: 2.1,
              regularityScore: 78
            }
          }
        },
        performanceData: {
          assessmentScores: Array.from({length: 30}, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 40) + 60
          })),
          studyTimeWeekly: Array.from({length: 12}, (_, i) => ({
            date: `Week ${i + 1}`,
            value: Math.floor(Math.random() * 10) + 15
          })),
          completionRateMonthly: Array.from({length: 6}, (_, i) => ({
            date: `Month ${i + 1}`,
            value: Math.floor(Math.random() * 30) + 50
          })),
          scoreDistribution: [65, 70, 75, 80, 85, 90, 95],
          courseCompletion: {
            completed: 12,
            inProgress: 3,
            notStarted: 5
          },
          skillProgression: [
            { skill: 'Position Play', current: 75, target: 90, improvement: 15 },
            { skill: 'Bluff Detection', current: 60, target: 80, improvement: 20 },
            { skill: 'Bet Sizing', current: 85, target: 95, improvement: 10 }
          ]
        },
        recommendationData: null // Will be loaded by the component
      });
    }
  }, [userData, recentGames, recentAchievements]);

  const displayRecentGames = recentGames?.slice(0, 5) || [
    { id: 1, type: '现金桌', result: '胜利', earnings: 320, date: '今天 14:30', status: 'win' as const },
    { id: 2, type: 'AI训练', result: '胜利', earnings: 150, date: '今天 12:15', status: 'win' as const },
    { id: 3, type: '锦标赛', result: '失败', earnings: -100, date: '昨天 21:00', status: 'loss' as const },
    { id: 4, type: 'GTO训练', result: '胜利', earnings: 200, date: '昨天 18:30', status: 'win' as const },
    { id: 5, type: '现金桌', result: '胜利', earnings: 450, date: '昨天 15:00', status: 'win' as const }
  ];

  const achievements = [
    { id: 1, name: '连胜大师', icon: '🔥', progress: 80, total: 100, color: 'from-red-500 to-orange-500' },
    { id: 2, name: 'GTO专家', icon: '🎯', progress: 65, total: 100, color: 'from-blue-500 to-cyan-500' },
    { id: 3, name: '心理大师', icon: '🧠', progress: 90, total: 100, color: 'from-purple-500 to-pink-500' },
    { id: 4, name: '数据分析师', icon: '📊', progress: 45, total: 100, color: 'from-green-500 to-emerald-500' }
  ];

  if (loading) {
    return (
      <AppLayout>
        <DashboardLayout 
          userId={userData?.id || 'current-user'} 
          loading={true}
        />
      </AppLayout>
    );
  }

  if (error || !userData) {
    return (
      <AppLayout>
        <DashboardLayout 
          userId="current-user" 
          initialData={dashboardData}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <DashboardLayout 
        userId={userData?.id || 'current-user'} 
        initialData={dashboardData}
        loading={loading}
      >

        {/* Legacy stats display for fallback */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>Dashboard loading with enhanced layout...</p>
          </div>
        </div>

        {/* Legacy quick actions for backwards compatibility */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced 快速开始 with micro-interactions */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
              🚀 <span className="ml-2">快速开始</span>
            </h3>
            <div className="space-y-3">
              <Link href="/game" className="block">
                <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] group/btn relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-center space-x-3 relative z-10">
                    <PlayCircle className="w-6 h-6 group-hover/btn:animate-pulse" />
                    <span className="font-semibold text-lg">开始游戏</span>
                  </div>
                  <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </button>
              </Link>
              
              <Link href="/ai-training" className="block">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] group/btn">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover/btn:animate-bounce" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 group-hover/btn:text-purple-700 dark:group-hover/btn:text-purple-300 transition-colors duration-300">AI训练</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover/btn:text-purple-600 group-hover/btn:translate-x-1 transition-all duration-300" />
                </button>
              </Link>
              
              <Link href="/gto-training" className="block">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] group/btn">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover/btn:animate-pulse" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 group-hover/btn:text-blue-700 dark:group-hover/btn:text-blue-300 transition-colors duration-300">GTO策略学习</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover/btn:text-blue-600 group-hover/btn:translate-x-1 transition-all duration-300" />
                </button>
              </Link>
              
              <Link href="/companion-center" className="block">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100 dark:hover:from-pink-900/20 dark:hover:to-pink-800/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] group/btn relative overflow-hidden">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400 group-hover/btn:animate-spin" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 group-hover/btn:text-pink-700 dark:group-hover/btn:text-pink-300 transition-colors duration-300">AI陪伴中心</span>
                  </div>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full shadow-lg relative overflow-hidden">
                    <span className="relative z-10">HOT</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 animate-pulse opacity-75"></div>
                  </span>
                </button>
              </Link>
              
              <Link href="/personalization" className="block">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-100 dark:hover:from-blue-900/20 dark:hover:to-purple-800/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-purple-600 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] group/btn">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover/btn:animate-pulse" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 group-hover/btn:text-blue-700 dark:group-hover/btn:text-purple-300 transition-colors duration-300">个性化中心</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover/btn:text-blue-600 group-hover/btn:translate-x-1 transition-all duration-300" />
                </button>
              </Link>
            </div>
          </div>

          {/* Enhanced 最近游戏 with micro-interactions */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
              🎮 <span className="ml-2">最近游戏</span>
            </h3>
            <div className="space-y-3">
              {displayRecentGames.map((game, index) => (
                <div key={game.id} 
                     className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group/game"
                     style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white group-hover/game:text-blue-700 dark:group-hover/game:text-blue-300 transition-colors duration-300">
                        {game.type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 group-hover/game:scale-110 ${
                        game.status === 'win' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 group-hover/game:bg-green-200 dark:group-hover/game:bg-green-800/50' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 group-hover/game:bg-red-200 dark:group-hover/game:bg-red-800/50'
                      }`}>
                        {game.result}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 group-hover/game:text-gray-600 dark:group-hover/game:text-gray-300 transition-colors duration-300">
                        {game.date}
                      </span>
                      <span className={`font-medium transition-all duration-300 group-hover/game:scale-110 ${
                        game.earnings > 0 
                          ? 'text-green-600 dark:text-green-400 group-hover/game:text-green-700 dark:group-hover/game:text-green-300' 
                          : 'text-red-600 dark:text-red-400 group-hover/game:text-red-700 dark:group-hover/game:text-red-300'
                      }`}>
                        {game.earnings > 0 ? '+' : ''}${Math.abs(game.earnings)}
                      </span>
                    </div>
                  </div>
                  {/* Subtle hover indicator */}
                  <ChevronRight className="w-4 h-4 text-transparent group-hover/game:text-blue-400 group-hover/game:translate-x-1 transition-all duration-300 ml-2" />
                </div>
              ))}
            </div>
            
            {/* View all games button */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/analytics" className="block">
                <button className="w-full p-3 text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg group/view">
                  <span className="flex items-center justify-center space-x-2">
                    <span>查看全部游戏记录</span>
                    <ChevronRight className="w-4 h-4 group-hover/view:translate-x-1 transition-transform duration-300" />
                  </span>
                </button>
              </Link>
            </div>
          </div>

          {/* Enhanced 成就进度 with animated progress bars */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">
              🏆 <span className="ml-2">成就进度</span>
            </h3>
            <div className="space-y-5">
              {achievements.map((achievement, index) => (
                <div key={achievement.id} 
                     className="group/achievement cursor-pointer"
                     style={{ animationDelay: `${index * 150}ms` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl transition-transform duration-300 group-hover/achievement:scale-125 group-hover/achievement:rotate-12">
                        {achievement.icon}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white group-hover/achievement:text-yellow-600 dark:group-hover/achievement:text-yellow-400 transition-colors duration-300">
                        {achievement.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg group-hover/achievement:bg-yellow-100 dark:group-hover/achievement:bg-yellow-900/30 group-hover/achievement:text-yellow-700 dark:group-hover/achievement:text-yellow-300 transition-all duration-300">
                      {achievement.progress}/{achievement.total}
                    </span>
                  </div>
                  
                  {/* Enhanced progress bar with shimmer effect */}
                  <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner group-hover/achievement:shadow-lg transition-shadow duration-300">
                    <div 
                      className={`h-full bg-gradient-to-r ${achievement.color} transition-all duration-1000 shadow-sm relative overflow-hidden`}
                      style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
                      
                      {/* Progress pulse effect */}
                      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white/40 to-transparent animate-pulse"></div>
                    </div>
                    
                    {/* Progress percentage text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-sm">
                        {Math.round((achievement.progress / achievement.total) * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress completion indicator */}
                  {achievement.progress >= achievement.total && (
                    <div className="mt-2 flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <span className="text-sm font-medium">🎉 已完成！</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* View all achievements button */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/achievements" className="block">
                <button className="w-full p-3 text-center text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium transition-all duration-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg group/view">
                  <span className="flex items-center justify-center space-x-2">
                    <span>查看全部成就</span>
                    <ChevronRight className="w-4 h-4 group-hover/view:translate-x-1 transition-transform duration-300" />
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AppLayout>
  );

  // Legacy content (will be shown as fallback)
  const legacyContent = (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🏆 控制台
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              欢迎回来，今天是提升牌技的好日子
            </p>
          </div>
          
          {/* 控制按钮 */}
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 shadow-sm hover:shadow-md">
              <Globe className="w-5 h-5" />
              <span className="font-medium">中文</span>
            </button>
            
            <button className="p-2.5 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 shadow-sm hover:shadow-md">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced 玩家等级信息 with glass morphism and advanced animations */}
        <div className="mt-8 relative group">
          {/* Glass morphism background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50"></div>
          
          {/* Gradient border on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
          
          <div className="relative z-10 p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative group/avatar">
                  {/* Animated ring effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-600 to-purple-700 rounded-full animate-spin-slow opacity-75 group-hover/avatar:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-1 bg-gradient-to-br from-purple-400 via-pink-500 to-purple-600 rounded-full animate-pulse"></div>
                  
                  <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-600 to-purple-700 rounded-full flex items-center justify-center shadow-xl ring-4 ring-purple-100 dark:ring-purple-900/50 group-hover/avatar:scale-110 transition-transform duration-500">
                    <span className="text-3xl font-bold text-white drop-shadow-lg">{stats.level}</span>
                  </div>
                  
                  {/* Crown with pulse animation */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <span className="text-sm animate-pulse">👑</span>
                  </div>
                </div>
                
                <div className="group-hover:translate-x-2 transition-transform duration-500">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 bg-clip-text text-transparent animate-gradient">
                    {stats.rank}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg mt-1">
                    等级 <span className="font-semibold text-purple-600 dark:text-purple-400">{stats.level}</span> • 
                    训练时长 <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.trainingHours}</span> 小时
                  </p>
                </div>
              </div>
              
              <div className="text-right group-hover:-translate-x-2 transition-transform duration-500">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">已获得成就</p>
                <div className="flex items-center justify-end space-x-3">
                  <span className="text-3xl animate-bounce">🏆</span>
                  <div className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 bg-clip-text text-transparent animate-gradient">
                    {animatedAchievements}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-gray-600 dark:text-gray-300 font-medium">等级进度</span>
                <span className="text-gray-900 dark:text-white font-bold bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-1.5 rounded-full border border-purple-200 dark:border-purple-700 animate-pulse">
                  75%
                </span>
              </div>
              
              {/* Enhanced progress bar with multiple effects */}
              <div className="relative h-5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 transition-all duration-2000 shadow-lg relative overflow-hidden"
                  style={{ width: '75%' }}
                >
                  {/* Multiple shimmer effects */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-300/30 to-transparent -skew-x-12 animate-shimmer-slow"></div>
                  
                  {/* Pulse effect at the end */}
                  <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white/50 to-transparent animate-pulse"></div>
                </div>
                
                {/* Progress glow effect */}
                <div className="absolute inset-0 rounded-full shadow-inner border border-purple-300/20 dark:border-purple-600/20"></div>
              </div>
              
              {/* Enhanced info box */}
              <div className="mt-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl blur-sm"></div>
                <div className="relative bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center space-x-2">
                    <span className="animate-pulse">✨</span>
                    <span>距离下一等级还需</span>
                    <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                      250 经验值
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
  
  // This should not be reached with new layout
  return legacyContent;
}
