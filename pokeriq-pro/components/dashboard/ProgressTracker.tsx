'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award, 
  BookOpen, 
  Zap,
  CheckCircle,
  Circle,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Flame,
  Star,
  Trophy
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('progress-tracker');

interface ProgressData {
  overallProgress: number;
  coursesCompleted: number;
  totalCourses: number;
  currentStreak: number;
  studyTimeToday: number;
  studyTimeWeek: number;
  weeklyGoal: number;
  level: number;
  experiencePoints: number;
  nextLevelXP: number;
  milestones: Milestone[];
  recentActivities: Activity[];
  weeklyStats: WeeklyStats;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  reward?: {
    type: 'xp' | 'badge' | 'unlock';
    value: number | string;
  };
  deadline?: string;
  category: 'course' | 'skill' | 'time' | 'social';
}

interface Activity {
  id: string;
  type: 'course_completed' | 'assessment_passed' | 'streak_milestone' | 'skill_improved';
  title: string;
  description: string;
  timestamp: string;
  xpGained?: number;
  icon?: string;
}

interface WeeklyStats {
  studyDays: number;
  totalStudyTime: number;
  coursesCompleted: number;
  assessmentsPassed: number;
  averageScore: number;
}

interface ProgressTrackerProps {
  userId: string;
  data?: ProgressData;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

const ProgressRing: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
}> = ({
  progress,
  size = 80,
  strokeWidth = 8,
  color = '#3B82F6',
  backgroundColor = '#E5E7EB',
  label,
  showPercentage = true,
  animated = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? strokeDashoffset : 0}
          initial={animated ? { strokeDashoffset: circumference } : {}}
          animate={animated ? { strokeDashoffset } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {showPercentage && (
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {Math.round(progress)}%
          </div>
        )}
        {label && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

const MilestoneCard: React.FC<{
  milestone: Milestone;
  compact?: boolean;
}> = ({ milestone, compact = false }) => {
  const progressPercentage = (milestone.progress / milestone.maxProgress) * 100;
  
  const categoryIcons = {
    course: BookOpen,
    skill: Target,
    time: Clock,
    social: Award
  };
  
  const categoryColors = {
    course: 'from-blue-500 to-cyan-500',
    skill: 'from-green-500 to-emerald-500',
    time: 'from-purple-500 to-pink-500',
    social: 'from-yellow-500 to-orange-500'
  };
  
  const Icon = categoryIcons[milestone.category];
  const gradientColor = categoryColors[milestone.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4
        ${milestone.completed ? 'ring-2 ring-green-500 ring-opacity-50' : ''}
        hover:shadow-lg transition-all duration-300
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      {milestone.completed && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
      )}
      
      <div className="flex items-start space-x-3">
        <div className={`
          p-2 rounded-lg bg-gradient-to-r ${gradientColor} text-white flex-shrink-0
          ${compact ? 'p-1.5' : 'p-2'}
        `}>
          <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-gray-900 dark:text-white ${compact ? 'text-sm' : 'text-base'}`}>
            {milestone.title}
          </h4>
          <p className={`text-gray-600 dark:text-gray-400 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
            {milestone.description}
          </p>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {milestone.progress} / {milestone.maxProgress}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full bg-gradient-to-r ${gradientColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
          
          {milestone.reward && !milestone.completed && (
            <div className={`mt-2 text-xs text-gray-500 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
              Reward: {milestone.reward.type === 'xp' && `+${milestone.reward.value} XP`}
              {milestone.reward.type === 'badge' && `${milestone.reward.value} badge`}
              {milestone.reward.type === 'unlock' && `Unlock ${milestone.reward.value}`}
            </div>
          )}
          
          {milestone.deadline && !milestone.completed && (
            <div className="mt-1 flex items-center text-xs text-orange-600 dark:text-orange-400">
              <Calendar className="w-3 h-3 mr-1" />
              Due: {new Date(milestone.deadline).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ActivityFeed: React.FC<{
  activities: Activity[];
  compact?: boolean;
}> = ({ activities, compact = false }) => (
  <div className="space-y-3">
    {activities.slice(0, compact ? 3 : 5).map((activity, index) => (
      <motion.div
        key={activity.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white 
          flex items-center justify-center text-sm font-bold
          ${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'}
        `}>
          {activity.icon || '🎯'}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-gray-900 dark:text-white ${compact ? 'text-sm' : 'text-base'}`}>
            {activity.title}
          </p>
          <p className={`text-gray-600 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            {activity.description}
          </p>
        </div>
        
        <div className="flex-shrink-0 text-right">
          {activity.xpGained && (
            <div className="text-xs font-medium text-green-600 dark:text-green-400">
              +{activity.xpGained} XP
            </div>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(activity.timestamp).toLocaleDateString()}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  compact?: boolean;
}> = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', compact = false }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-yellow-500 to-orange-500',
    red: 'from-red-500 to-pink-500'
  };

  const TrendIcon = trend?.direction === 'up' ? ArrowUp : 
                   trend?.direction === 'down' ? ArrowDown : Minus;

  return (
    <div className={`
      relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
      hover:shadow-lg transition-all duration-300
      ${compact ? 'p-4' : 'p-6'}
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-gray-600 dark:text-gray-400 font-medium ${compact ? 'text-sm' : 'text-base'}`}>
            {title}
          </p>
          <p className={`font-bold text-gray-900 dark:text-white ${compact ? 'text-xl' : 'text-2xl'} mt-1`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="text-right">
          <div className={`
            p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white
            ${compact ? 'p-2' : 'p-3'}
          `}>
            <Icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
          </div>
          
          {trend && (
            <div className={`
              flex items-center justify-end mt-2 text-sm font-medium
              ${trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 
                trend.direction === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}
            `}>
              <TrendIcon className="w-3 h-3 mr-1" />
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ProgressTracker({
  userId,
  data,
  loading = false,
  compact = false,
  className = ''
}: ProgressTrackerProps) {
  const [localData, setLocalData] = useState<ProgressData | null>(data || null);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const defaultData: ProgressData = {
    overallProgress: 68,
    coursesCompleted: 12,
    totalCourses: 18,
    currentStreak: 8,
    studyTimeToday: 45,
    studyTimeWeek: 280,
    weeklyGoal: 300,
    level: 15,
    experiencePoints: 7850,
    nextLevelXP: 10000,
    weeklyStats: {
      studyDays: 6,
      totalStudyTime: 280,
      coursesCompleted: 3,
      assessmentsPassed: 8,
      averageScore: 87
    },
    milestones: [
      {
        id: '1',
        title: 'Course Master',
        description: 'Complete 15 poker strategy courses',
        progress: 12,
        maxProgress: 15,
        completed: false,
        category: 'course',
        reward: { type: 'badge', value: 'Course Master' }
      },
      {
        id: '2',
        title: 'Consistent Learner',
        description: 'Study for 7 consecutive days',
        progress: 6,
        maxProgress: 7,
        completed: false,
        category: 'time',
        reward: { type: 'xp', value: 500 }
      },
      {
        id: '3',
        title: 'GTO Expert',
        description: 'Master all GTO concepts',
        progress: 8,
        maxProgress: 10,
        completed: false,
        category: 'skill',
        deadline: '2024-09-30'
      }
    ],
    recentActivities: [
      {
        id: '1',
        type: 'course_completed',
        title: 'Completed "Advanced Bluffing"',
        description: 'Scored 92% on the final assessment',
        timestamp: new Date().toISOString(),
        xpGained: 150,
        icon: '🎯'
      },
      {
        id: '2',
        type: 'streak_milestone',
        title: '7-Day Study Streak!',
        description: 'Maintained consistent daily study',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        xpGained: 100,
        icon: '🔥'
      },
      {
        id: '3',
        type: 'skill_improved',
        title: 'Position Play Improved',
        description: 'Advanced from Beginner to Intermediate',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        xpGained: 75,
        icon: '📈'
      }
    ]
  };

  useEffect(() => {
    if (!data && !loading) {
      // Use mock data in development
      setLocalData(defaultData);
    } else if (data) {
      setLocalData(data);
    }
  }, [data, loading]);

  useEffect(() => {
    if (!data && userId) {
      fetchProgressData();
    }
  }, [userId]);

  const fetchProgressData = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/dashboard/progress/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }
      
      const progressData = await response.json();
      setLocalData(progressData);
      
      logger.info('Progress data fetched successfully', { userId });
    } catch (error) {
      logger.error('Error fetching progress data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch progress data');
      // Fallback to mock data
      setLocalData(defaultData);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-24"></div>
          ))}
        </div>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64"></div>
      </div>
    );
  }

  if (!localData) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Progress Data</h3>
        <p className="text-gray-600 dark:text-gray-400">Start learning to track your progress!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className={`grid ${compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        <StatCard
          title="Overall Progress"
          value={`${localData.overallProgress}%`}
          subtitle={`${localData.coursesCompleted}/${localData.totalCourses} courses`}
          icon={TrendingUp}
          trend={{ value: 12, direction: 'up' }}
          color="blue"
          compact={compact}
        />
        
        <StatCard
          title="Current Streak"
          value={`${localData.currentStreak} days`}
          subtitle="Keep it up!"
          icon={Flame}
          trend={{ value: 8, direction: 'up' }}
          color="orange"
          compact={compact}
        />
        
        <StatCard
          title="Study Time Today"
          value={`${localData.studyTimeToday} min`}
          subtitle={`${localData.studyTimeWeek}/${localData.weeklyGoal} min this week`}
          icon={Clock}
          trend={{ value: 15, direction: 'up' }}
          color="purple"
          compact={compact}
        />
        
        <StatCard
          title="Level Progress"
          value={`Level ${localData.level}`}
          subtitle={`${localData.experiencePoints}/${localData.nextLevelXP} XP`}
          icon={Star}
          trend={{ value: 5, direction: 'up' }}
          color="green"
          compact={compact}
        />
      </div>

      {/* Progress Visualization */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'} gap-6`}>
        {/* Level Progress */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Level Progress</h3>
          <div className="flex items-center justify-center">
            <ProgressRing
              progress={(localData.experiencePoints / localData.nextLevelXP) * 100}
              size={120}
              strokeWidth={10}
              color="#8B5CF6"
              label="XP Progress"
            />
          </div>
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              Level {localData.level}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {localData.nextLevelXP - localData.experiencePoints} XP to next level
            </div>
          </div>
        </div>

        {/* Weekly Goal Progress */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Study Goal</h3>
          <div className="flex items-center justify-center">
            <ProgressRing
              progress={(localData.studyTimeWeek / localData.weeklyGoal) * 100}
              size={120}
              strokeWidth={10}
              color="#10B981"
              label="Time Goal"
            />
          </div>
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.round((localData.studyTimeWeek / localData.weeklyGoal) * 100)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {localData.weeklyGoal - localData.studyTimeWeek} minutes remaining
            </div>
          </div>
        </div>

        {/* Course Completion */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Progress</h3>
          <div className="flex items-center justify-center">
            <ProgressRing
              progress={(localData.coursesCompleted / localData.totalCourses) * 100}
              size={120}
              strokeWidth={10}
              color="#F59E0B"
              label="Courses"
              showPercentage={false}
            />
          </div>
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {localData.coursesCompleted}/{localData.totalCourses}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              courses completed
            </div>
          </div>
        </div>
      </div>

      {/* Milestones and Activities */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
        {/* Active Milestones */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Milestones</h3>
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            {localData.milestones.slice(0, compact ? 2 : 3).map(milestone => (
              <MilestoneCard 
                key={milestone.id} 
                milestone={milestone} 
                compact={compact}
              />
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <ActivityFeed 
            activities={localData.recentActivities} 
            compact={compact}
          />
        </div>
      </div>
    </div>
  );
}