'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { 
  CHART_COLORS, 
  processChartData,
  getResponsiveConfig,
  TOOLTIP_CONFIG 
} from '@/lib/dashboard/chart-configs';
import { 
  UserPerformanceMetrics,
  SkillDimension,
  TrendData
} from '@/lib/dashboard/analytics-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('progress-metrics');

export interface ProgressMetricsProps {
  performanceMetrics: UserPerformanceMetrics;
  skillProgression?: SkillDimension[];
  recentTrends?: TrendData[];
  className?: string;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { direction: 'up' | 'down' | 'stable'; value: number };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  children?: React.ReactNode;
  loading?: boolean;
}

interface ProgressRingProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showPercentage?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  color = 'blue', 
  children, 
  loading = false 
}) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    red: 'border-red-200 bg-red-50',
    purple: 'border-purple-200 bg-purple-50'
  };

  const textColorClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    yellow: 'text-yellow-900',
    red: 'text-red-900',
    purple: 'text-purple-900'
  };

  return (
    <div className={`rounded-lg border-2 ${colorClasses[color]} p-4 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon && <div className={textColorClasses[color]}>{icon}</div>}
          <h3 className={`text-sm font-medium ${textColorClasses[color]}`}>{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium ${
            trend.direction === 'up' ? 'text-green-600' : 
            trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            <span className="mr-1">
              {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
            </span>
            {trend.value.toFixed(1)}%
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-16">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className={`text-2xl font-bold ${textColorClasses[color]} mb-1`}>
            {value}
          </div>
          {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
          {children && <div className="mt-3">{children}</div>}
        </>
      )}
    </div>
  );
};

const ProgressRing: React.FC<ProgressRingProps> = ({ 
  value, 
  maxValue = 100, 
  size = 80, 
  strokeWidth = 8, 
  color = CHART_COLORS.primary,
  label,
  showPercentage = true 
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center text-center">
        {showPercentage && (
          <div className="text-lg font-bold text-gray-900">
            {Math.round(percentage)}%
          </div>
        )}
        {!showPercentage && (
          <div className="text-sm font-medium text-gray-700">
            {value}/{maxValue}
          </div>
        )}
        {label && (
          <div className="absolute bottom-1 text-xs text-gray-500">
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

const SkillProgressBar: React.FC<{
  skill: SkillDimension;
  showDetails?: boolean;
}> = ({ skill, showDetails = false }) => {
  const progressPercentage = (skill.currentLevel / skill.maxLevel) * 100;
  const confidencePercentage = skill.confidence * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{skill.name}</span>
        <span className="text-sm text-gray-500">{skill.currentLevel}/{skill.maxLevel}</span>
      </div>
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              skill.trend === 'up' ? 'bg-green-500' : 
              skill.trend === 'down' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Confidence indicator */}
        <div 
          className="absolute top-0 h-3 bg-white bg-opacity-40 rounded-full"
          style={{ 
            width: `${confidencePercentage}%`,
            maxWidth: `${progressPercentage}%`
          }}
        ></div>
      </div>

      {showDetails && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>Confidence: {Math.round(confidencePercentage)}%</span>
          <span className={`${
            skill.trend === 'up' ? 'text-green-600' : 
            skill.trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            Trend: {skill.trend === 'up' ? '↗' : skill.trend === 'down' ? '↘' : '→'}
          </span>
        </div>
      )}
    </div>
  );
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-3"
        style={TOOLTIP_CONFIG}
      >
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ProgressMetrics: React.FC<ProgressMetricsProps> = ({
  performanceMetrics,
  skillProgression = [],
  recentTrends = [],
  className = '',
  loading = false
}) => {
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const responsiveConfig = getResponsiveConfig(windowWidth);

  // Process metrics
  const assessmentStats = performanceMetrics.assessmentPerformance;
  const learningVelocity = performanceMetrics.learningVelocity;
  const engagement = performanceMetrics.engagement;

  // Calculate trends
  const scoreTrend = processChartData.calculateTrend(recentTrends);

  // Prepare velocity data for mini chart
  const velocityData = [
    { name: 'Courses/Week', value: learningVelocity.coursesPerWeek, max: 5 },
    { name: 'Topics/Week', value: learningVelocity.topicsPerWeek, max: 20 },
    { name: 'Efficiency', value: learningVelocity.efficiencyScore, max: 100 },
  ];

  // Engagement breakdown for pie chart
  const engagementData = [
    { name: 'Daily', value: engagement.dailyActiveTime, color: CHART_COLORS.primary },
    { name: 'Weekly', value: engagement.weeklyActiveTime - engagement.dailyActiveTime, color: CHART_COLORS.secondary },
    { name: 'Monthly', value: engagement.monthlyActiveTime - engagement.weeklyActiveTime, color: CHART_COLORS.info }
  ];

  logger.info('Rendering progress metrics', {
    totalAssessments: assessmentStats.totalAssessments,
    averageScore: assessmentStats.averageScore,
    skillProgressionCount: skillProgression.length,
    loading
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Average Score"
          value={`${Math.round(assessmentStats.averageScore)}%`}
          subtitle={`${assessmentStats.totalAssessments} assessments`}
          trend={{
            direction: assessmentStats.recentTrend === 'improving' ? 'up' : 
                      assessmentStats.recentTrend === 'declining' ? 'down' : 'stable',
            value: scoreTrend.strength
          }}
          color="blue"
          icon={<div className="w-4 h-4">📊</div>}
          loading={loading}
        />

        <MetricCard
          title="Learning Velocity"
          value={`${learningVelocity.coursesPerWeek.toFixed(1)}`}
          subtitle="courses per week"
          color="green"
          icon={<div className="w-4 h-4">🚀</div>}
          loading={loading}
        >
          <div className="mt-2">
            <ProgressRing 
              value={learningVelocity.efficiencyScore} 
              size={60} 
              strokeWidth={6}
              color={CHART_COLORS.success}
              label="Efficiency"
            />
          </div>
        </MetricCard>

        <MetricCard
          title="Study Time"
          value={`${Math.round(engagement.weeklyActiveTime / 60)}h`}
          subtitle="this week"
          color="purple"
          icon={<div className="w-4 h-4">⏱️</div>}
          loading={loading}
        >
          <div className="mt-2 text-xs text-gray-600">
            <div>Daily: {Math.round(engagement.dailyActiveTime)} min</div>
            <div>Sessions: {engagement.sessionCount}</div>
          </div>
        </MetricCard>

        <MetricCard
          title="Completion Rate"
          value={`${Math.round((learningVelocity.coursesPerWeek / 2) * 100)}%`}
          subtitle="weekly target progress"
          color="yellow"
          icon={<div className="w-4 h-4">🎯</div>}
          loading={loading}
        >
          <div className="mt-2">
            <ProgressRing 
              value={learningVelocity.coursesPerWeek} 
              maxValue={2}
              size={60} 
              strokeWidth={6}
              color={CHART_COLORS.warning}
              showPercentage={false}
              label="Weekly Goal"
            />
          </div>
        </MetricCard>
      </div>

      {/* Detailed Progress Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Progression Bars */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Skill Progression</h3>
            <p className="text-sm text-gray-600">Current levels across all skill categories</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {skillProgression.slice(0, 6).map(skill => (
                <SkillProgressBar 
                  key={skill.name} 
                  skill={skill} 
                  showDetails={windowWidth > 768}
                />
              ))}
              
              {skillProgression.length === 0 && (
                <p className="text-gray-500 text-sm italic text-center py-8">
                  Complete assessments to track your skill progression
                </p>
              )}
            </div>
          )}
        </div>

        {/* Learning Analytics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Learning Analytics</h3>
            <p className="text-sm text-gray-600">Velocity and engagement metrics</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Velocity Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Weekly Velocity</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={velocityData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Engagement Distribution */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Time Distribution</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <Pie
                      data={engagementData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Best Performance</h4>
            <span className="text-lg">🏆</span>
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {Math.round(assessmentStats.highestScore)}%
              </div>
              <p className="text-xs text-gray-500">Highest assessment score</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Time to Completion</h4>
            <span className="text-lg">⏰</span>
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {Math.round(learningVelocity.timeToCompletion)}
              </div>
              <p className="text-xs text-gray-500">days average completion</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Consistency</h4>
            <span className="text-lg">📈</span>
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {Math.round(engagement.sessionCount / 4)}
              </div>
              <p className="text-xs text-gray-500">sessions per week</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};