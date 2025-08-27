'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Target,
  Brain,
  TrendingUp,
  Settings,
  BookOpen,
  Zap,
  Clock,
  Award,
  Calendar,
  Activity,
  BarChart3,
  Route,
  Star,
  Lightbulb,
  Filter,
  RefreshCw
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

// Import sub-components
import { PreferencesPanel } from './PreferencesPanel';
import { RecommendationsWidget } from './RecommendationsWidget';
import { LearningPathViewer } from './LearningPathViewer';
import { GoalTracker } from './GoalTracker';
import { ProgressCharts } from './ProgressCharts';
import { SkillRadar } from './SkillRadar';

const logger = createLogger('personalization-dashboard');

interface UserProfile {
  userId: string;
  overallRating: number;
  strongestSkill: string;
  weakestSkill: string;
  primaryLearningStyle: string;
  mainWeakness: string;
}

interface PersonalizationStats {
  totalRecommendations: number;
  acceptanceRate: number;
  averageRating: number;
  streakDays: number;
  completedGoals: number;
  activeGoals: number;
}

interface PersonalizationDashboardProps {
  userId: string;
  className?: string;
}

export const PersonalizationDashboard: React.FC<PersonalizationDashboardProps> = ({
  userId,
  className = ''
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PersonalizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'path' | 'preferences'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [profileRes, statsRes] = await Promise.all([
        fetch(`/api/personalization/profile?userId=${userId}`),
        fetch(`/api/personalization/stats?userId=${userId}`)
      ]);

      if (!profileRes.ok || !statsRes.ok) {
        throw new Error('Failed to load personalization data');
      }

      const [profileData, statsData] = await Promise.all([
        profileRes.json(),
        statsRes.json()
      ]);

      setUserProfile(profileData.data?.userProfile || null);
      setStats(statsData.data?.stats || null);

      logger.info('Dashboard data loaded successfully', { userId });
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      
      // Set mock data for development
      setUserProfile({
        userId,
        overallRating: 1250,
        strongestSkill: 'preflop',
        weakestSkill: 'tournament',
        primaryLearningStyle: 'practical',
        mainWeakness: '过度保守'
      });
      
      setStats({
        totalRecommendations: 47,
        acceptanceRate: 78,
        averageRating: 4.2,
        streakDays: 7,
        completedGoals: 12,
        activeGoals: 3
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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

  const getLearningStyleName = (style: string) => {
    const styleNames: Record<string, string> = {
      visual: '视觉学习者',
      practical: '实践学习者',
      theoretical: '理论学习者',
      social: '社交学习者'
    };
    return styleNames[style] || style;
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
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
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <User className="w-6 h-6 mr-3 text-blue-600" />
              个性化学习中心
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              基于AI驱动的个性化扑克学习系统
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded-lg bg-white/50 backdrop-blur-sm border border-white/30 text-blue-600 hover:bg-white/70 transition-colors duration-200 ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {userProfile && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">技能评分</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{userProfile.overallRating}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">连续学习</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.streakDays}天</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">推荐采纳率</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.acceptanceRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">活跃目标</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeGoals}</p>
                </div>
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'overview', label: '概览', icon: BarChart3 },
            { key: 'goals', label: '目标管理', icon: Target },
            { key: 'path', label: '学习路径', icon: Route },
            { key: 'preferences', label: '偏好设置', icon: Settings }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Profile Overview */}
                  {userProfile && (
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Brain className="w-5 h-5 mr-2 text-purple-600" />
                        学习画像
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">优势技能</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {getSkillDisplayName(userProfile.strongestSkill)}
                          </p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">待改进技能</p>
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            {getSkillDisplayName(userProfile.weakestSkill)}
                          </p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">学习风格</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            {getLearningStyleName(userProfile.primaryLearningStyle)}
                          </p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">主要弱点</p>
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            {userProfile.mainWeakness}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Widgets */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <RecommendationsWidget userId={userId} compact />
                      <SkillRadar userId={userId} />
                    </div>
                    
                    <div className="space-y-6">
                      <GoalTracker userId={userId} compact />
                      <ProgressCharts userId={userId} compact />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'goals' && (
                <GoalTracker userId={userId} />
              )}

              {activeTab === 'path' && (
                <LearningPathViewer userId={userId} />
              )}

              {activeTab === 'preferences' && (
                <PreferencesPanel userId={userId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 text-red-600 dark:text-red-400">⚠</div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizationDashboard;