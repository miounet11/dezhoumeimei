'use client';

import React, { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Cell,
  ComposedChart
} from 'recharts';
import { 
  CHART_COLORS, 
  getSkillRadarConfig, 
  getSkillComparisonConfig,
  getStudyPatternHeatmapConfig,
  getResponsiveConfig,
  processChartData,
  TOOLTIP_CONFIG,
  LEGEND_CONFIG,
  GRID_CONFIG
} from '@/lib/dashboard/chart-configs';
import { 
  LearningAnalytics as LearningAnalyticsData,
  SkillDimension, 
  HourlyActivity,
  ConsistencyMetrics,
  TrendData
} from '@/lib/dashboard/analytics-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('learning-analytics');

export interface LearningAnalyticsProps {
  learningData: LearningAnalyticsData;
  className?: string;
  loading?: boolean;
}

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  trend?: { direction: 'up' | 'down' | 'stable'; value: number };
  children?: React.ReactNode;
  height?: number;
  loading?: boolean;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ 
  title, 
  subtitle, 
  value, 
  trend, 
  children, 
  height = 300, 
  loading = false 
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${
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
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      {value && (
        <div className="text-2xl font-bold text-gray-900 mt-2">
          {value}
        </div>
      )}
    </div>
    
    {children && (
      <div style={{ height }} className="w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          children
        )}
      </div>
    )}
  </div>
);

const CustomTooltip: React.FC<any> = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-3"
        style={TOOLTIP_CONFIG}
      >
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatter ? formatter(entry.value, entry.name) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SkillProgressBadge: React.FC<{ 
  skill: SkillDimension; 
  isStrong?: boolean; 
  isWeak?: boolean; 
}> = ({ skill, isStrong, isWeak }) => {
  const getBadgeColor = () => {
    if (isStrong) return 'bg-green-100 text-green-800 border-green-200';
    if (isWeak) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getTrendIcon = () => {
    switch (skill.trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getBadgeColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{skill.name}</h4>
        <span className="text-xs">{getTrendIcon()}</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Current Level</span>
          <span className="font-medium">{skill.currentLevel}%</span>
        </div>
        <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
          <div 
            className="h-2 bg-current rounded-full transition-all duration-300"
            style={{ width: `${(skill.currentLevel / skill.maxLevel) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs">
          <span>Confidence</span>
          <span className="font-medium">{Math.round(skill.confidence * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export const LearningAnalytics: React.FC<LearningAnalyticsProps> = ({
  learningData,
  className = '',
  loading = false
}) => {
  const [windowWidth, setWindowWidth] = useState(1200);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const responsiveConfig = getResponsiveConfig(windowWidth);

  // Process data for charts
  const skillRadarConfig = getSkillRadarConfig(learningData.skillProgression.dimensions);
  const skillComparisonConfig = getSkillComparisonConfig(learningData.skillProgression.dimensions);
  const studyPatternConfig = getStudyPatternHeatmapConfig(learningData.studyPatterns.preferredStudyTimes);

  // Calculate key metrics
  const courseCompletionRate = learningData.courseCompletion.completionRate;
  const totalStudyHours = Math.round(learningData.courseCompletion.totalStudyTime / 60 * 10) / 10;
  const averageScore = learningData.courseCompletion.averageScore;
  const overallProgress = learningData.skillProgression.overallProgress;

  // Prepare radar chart data
  const radarData = learningData.skillProgression.dimensions.map(skill => ({
    skill: skill.name,
    current: skill.currentLevel,
    target: skill.maxLevel,
    confidence: skill.confidence * 100
  }));

  // Prepare study pattern data for visualization
  const studyHoursData = learningData.studyPatterns.preferredStudyTimes.map(hour => ({
    hour: hour.hour,
    activity: hour.count,
    avgDuration: Math.round(hour.avgDuration),
    timeLabel: `${hour.hour}:00`
  }));

  // Prepare consistency data
  const consistencyData = [
    { metric: 'Daily Streak', value: learningData.studyPatterns.consistency.streakDays, max: 30 },
    { metric: 'Weekly Study Days', value: learningData.studyPatterns.consistency.studyDaysPerWeek, max: 7 },
    { metric: 'Sessions/Day', value: learningData.studyPatterns.consistency.avgSessionsPerDay, max: 5 },
    { metric: 'Regularity Score', value: learningData.studyPatterns.consistency.regularityScore, max: 100 }
  ];

  logger.info('Rendering learning analytics', {
    skillDimensions: learningData.skillProgression.dimensions.length,
    studyPatternHours: learningData.studyPatterns.preferredStudyTimes.length,
    windowWidth,
    loading
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard 
          title="Course Completion" 
          value={`${Math.round(courseCompletionRate)}%`}
          subtitle={`${learningData.courseCompletion.completedCourses}/${learningData.courseCompletion.totalCourses} courses`}
          loading={loading}
        />
        
        <AnalyticsCard 
          title="Total Study Time" 
          value={`${totalStudyHours}h`}
          subtitle="This month"
          loading={loading}
        />
        
        <AnalyticsCard 
          title="Average Score" 
          value={`${Math.round(averageScore)}%`}
          subtitle="Assessment performance"
          loading={loading}
        />
        
        <AnalyticsCard 
          title="Overall Progress" 
          value={`${Math.round(overallProgress)}%`}
          subtitle="Skill development"
          loading={loading}
        />
      </div>

      {/* Skill Progression Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard 
          title="Skill Radar Analysis" 
          subtitle="Current skill levels across all categories"
          loading={loading}
          height={400}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
              <PolarGrid stroke={GRID_CONFIG.stroke} />
              <PolarAngleAxis 
                dataKey="skill" 
                tick={{ fontSize: responsiveConfig.fontSize }}
              />
              <PolarRadiusAxis 
                domain={[0, 100]} 
                angle={90} 
                tick={{ fontSize: responsiveConfig.fontSize - 2 }}
                tickCount={6}
              />
              <Radar
                name="Current Level"
                dataKey="current"
                stroke={CHART_COLORS.primary}
                fill={CHART_COLORS.primary}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="Target Level"
                dataKey="target"
                stroke={CHART_COLORS.secondary}
                fill="transparent"
                strokeWidth={1}
                strokeDasharray="5 5"
              />
              {responsiveConfig.showLegend && <Legend {...LEGEND_CONFIG} />}
              <Tooltip content={<CustomTooltip formatter={(value: number) => `${value}%`} />} />
            </RadarChart>
          </ResponsiveContainer>
        </AnalyticsCard>

        <AnalyticsCard 
          title="Skill Comparison" 
          subtitle="Detailed breakdown of each skill area"
          loading={loading}
          height={400}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={skillComparisonConfig.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray={GRID_CONFIG.strokeDasharray} stroke={GRID_CONFIG.stroke} />
              <XAxis 
                dataKey={skillComparisonConfig.xKey}
                tick={{ fontSize: responsiveConfig.fontSize }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: responsiveConfig.fontSize }}
                domain={[0, 100]}
              />
              <Tooltip 
                content={<CustomTooltip formatter={(value: number) => [`${value}%`, 'Level']} />}
              />
              <Bar 
                dataKey={skillComparisonConfig.yKey} 
                fill={CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
                name="Current Level"
              >
                {skillComparisonConfig.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </AnalyticsCard>
      </div>

      {/* Study Patterns and Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard 
          title="Study Pattern Analysis" 
          subtitle="Preferred study hours and activity levels"
          loading={loading}
          height={350}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={studyHoursData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray={GRID_CONFIG.strokeDasharray} stroke={GRID_CONFIG.stroke} />
              <XAxis 
                dataKey="timeLabel"
                tick={{ fontSize: responsiveConfig.fontSize }}
                interval={windowWidth > 768 ? 1 : 3}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: responsiveConfig.fontSize }}
                orientation="left"
              />
              <YAxis 
                yAxisId="right"
                tick={{ fontSize: responsiveConfig.fontSize }}
                orientation="right"
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'activity') return [`${value} sessions`, 'Activity'];
                      if (name === 'avgDuration') return [`${value} minutes`, 'Avg Duration'];
                      return [value, name];
                    }}
                  />
                }
              />
              {responsiveConfig.showLegend && <Legend {...LEGEND_CONFIG} />}
              <Bar 
                yAxisId="left"
                dataKey="activity" 
                fill={CHART_COLORS.primary} 
                fillOpacity={0.6}
                name="Activity Count"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgDuration" 
                stroke={CHART_COLORS.secondary}
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Avg Duration"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </AnalyticsCard>

        <AnalyticsCard 
          title="Learning Consistency" 
          subtitle="Study habits and regularity metrics"
          loading={loading}
          height={350}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={consistencyData}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray={GRID_CONFIG.strokeDasharray} stroke={GRID_CONFIG.stroke} />
              <XAxis 
                type="number" 
                tick={{ fontSize: responsiveConfig.fontSize }}
              />
              <YAxis 
                type="category" 
                dataKey="metric"
                tick={{ fontSize: responsiveConfig.fontSize }}
                width={100}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={(value: number, name: string, props: any) => {
                      const max = props.payload?.max || 100;
                      const percentage = Math.round((value / max) * 100);
                      return [`${value} (${percentage}% of max)`, 'Value'];
                    }}
                  />
                }
              />
              <Bar 
                dataKey="value" 
                fill={CHART_COLORS.success}
                radius={[0, 4, 4, 0]}
                name="Current Value"
              />
            </BarChart>
          </ResponsiveContainer>
        </AnalyticsCard>
      </div>

      {/* Skill Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnalyticsCard 
          title="Strongest Skills" 
          subtitle="Areas where you excel"
          loading={loading}
        >
          <div className="space-y-3">
            {learningData.skillProgression.strongestSkills.slice(0, 3).map((skillName, index) => {
              const skill = learningData.skillProgression.dimensions.find(d => d.name === skillName);
              return skill ? (
                <SkillProgressBadge key={skillName} skill={skill} isStrong={true} />
              ) : null;
            })}
            {learningData.skillProgression.strongestSkills.length === 0 && (
              <p className="text-gray-500 text-sm italic">
                Complete more assessments to identify your strongest skills
              </p>
            )}
          </div>
        </AnalyticsCard>

        <AnalyticsCard 
          title="Areas for Improvement" 
          subtitle="Skills that need more focus"
          loading={loading}
        >
          <div className="space-y-3">
            {learningData.skillProgression.weakestSkills.slice(0, 3).map((skillName, index) => {
              const skill = learningData.skillProgression.dimensions.find(d => d.name === skillName);
              return skill ? (
                <SkillProgressBadge key={skillName} skill={skill} isWeak={true} />
              ) : null;
            })}
            {learningData.skillProgression.weakestSkills.length === 0 && (
              <p className="text-gray-500 text-sm italic">
                Your skills are well-balanced across all areas
              </p>
            )}
          </div>
        </AnalyticsCard>

        <AnalyticsCard 
          title="Study Habits Summary" 
          subtitle="Key insights about your learning patterns"
          loading={loading}
        >
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-3">
              <h4 className="font-medium text-sm text-gray-900">Current Streak</h4>
              <p className="text-2xl font-bold text-blue-600">
                {learningData.studyPatterns.consistency.streakDays} days
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-3">
              <h4 className="font-medium text-sm text-gray-900">Weekly Activity</h4>
              <p className="text-lg text-gray-700">
                {Math.round(learningData.studyPatterns.consistency.studyDaysPerWeek)} days/week
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-3">
              <h4 className="font-medium text-sm text-gray-900">Regularity Score</h4>
              <p className="text-lg text-gray-700">
                {Math.round(learningData.studyPatterns.consistency.regularityScore)}%
              </p>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">
                <strong>Tip:</strong> {
                  learningData.studyPatterns.consistency.regularityScore > 80 
                    ? "Excellent consistency! Keep up the regular study schedule."
                    : learningData.studyPatterns.consistency.regularityScore > 60
                    ? "Good progress! Try to maintain more regular study sessions."
                    : "Consider establishing a more consistent daily study routine."
                }
              </p>
            </div>
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
};