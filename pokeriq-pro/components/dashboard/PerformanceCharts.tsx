'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  CHART_COLORS, 
  getPerformanceTrendConfig, 
  getScoreDistributionConfig,
  getCourseCompletionConfig,
  getResponsiveConfig,
  processChartData,
  TOOLTIP_CONFIG,
  LEGEND_CONFIG,
  GRID_CONFIG
} from '@/lib/dashboard/chart-configs';
import { TrendData } from '@/lib/dashboard/analytics-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('performance-charts');

export interface PerformanceChartsProps {
  assessmentScores: TrendData[];
  studyTimeWeekly: TrendData[];
  completionRateMonthly: TrendData[];
  scoreDistribution?: number[];
  courseCompletion?: {
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  skillProgression?: Array<{
    skill: string;
    current: number;
    target: number;
    improvement: number;
  }>;
  className?: string;
  loading?: boolean;
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
  loading?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  subtitle, 
  children, 
  height = 300, 
  loading = false 
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
    <div style={{ height }} className="w-full">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        children
      )}
    </div>
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

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  assessmentScores = [],
  studyTimeWeekly = [],
  completionRateMonthly = [],
  scoreDistribution = [],
  courseCompletion = { completed: 0, inProgress: 0, notStarted: 0 },
  skillProgression = [],
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

  // Process chart data
  const assessmentTrendConfig = getPerformanceTrendConfig(assessmentScores, 'scores');
  const studyTimeTrendConfig = getPerformanceTrendConfig(studyTimeWeekly, 'time');
  const completionTrendConfig = getPerformanceTrendConfig(completionRateMonthly, 'completion');
  const scoreHistogramConfig = getScoreDistributionConfig(scoreDistribution);
  const completionPieConfig = getCourseCompletionConfig(courseCompletion);

  // Calculate trend indicators
  const assessmentTrend = processChartData.calculateTrend(assessmentScores);
  const studyTimeTrend = processChartData.calculateTrend(studyTimeWeekly);
  const completionTrend = processChartData.calculateTrend(completionRateMonthly);

  const renderTrendIndicator = (trend: { direction: 'up' | 'down' | 'stable'; strength: number }) => {
    const icons = {
      up: '↗',
      down: '↘',
      stable: '→'
    };
    const colors = {
      up: 'text-green-600',
      down: 'text-red-600',
      stable: 'text-gray-600'
    };

    return (
      <span className={`text-sm font-medium ${colors[trend.direction]}`}>
        {icons[trend.direction]} {trend.strength.toFixed(1)}%
      </span>
    );
  };

  logger.info('Rendering performance charts', {
    assessmentScores: assessmentScores.length,
    studyTimeWeekly: studyTimeWeekly.length,
    completionRateMonthly: completionRateMonthly.length,
    windowWidth,
    loading
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Assessment Performance Trend" 
          subtitle={`${renderTrendIndicator(assessmentTrend)} over the last 30 days`}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={assessmentTrendConfig.data}>
              <CartesianGrid strokeDasharray={GRID_CONFIG.strokeDasharray} stroke={GRID_CONFIG.stroke} />
              <XAxis 
                dataKey={assessmentTrendConfig.xKey}
                tick={{ fontSize: responsiveConfig.fontSize }}
                hide={!responsiveConfig.showAxisLabels}
              />
              <YAxis 
                tick={{ fontSize: responsiveConfig.fontSize }}
                hide={!responsiveConfig.showAxisLabels}
                domain={[0, 100]}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={(value: number) => [`${Math.round(value)}%`, 'Score']}
                  />
                }
              />
              {responsiveConfig.showLegend && <Legend {...LEGEND_CONFIG} />}
              <Line
                type="monotone"
                dataKey={assessmentTrendConfig.yKey}
                stroke={assessmentTrendConfig.color}
                strokeWidth={responsiveConfig.strokeWidth}
                dot={{ fill: assessmentTrendConfig.color, r: 4 }}
                activeDot={{ r: 6 }}
                name="Assessment Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          title="Study Time Trend" 
          subtitle={`${renderTrendIndicator(studyTimeTrend)} weekly study hours`}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={studyTimeTrendConfig.data}>
              <CartesianGrid strokeDasharray={GRID_CONFIG.strokeDasharray} stroke={GRID_CONFIG.stroke} />
              <XAxis 
                dataKey={studyTimeTrendConfig.xKey}
                tick={{ fontSize: responsiveConfig.fontSize }}
                hide={!responsiveConfig.showAxisLabels}
              />
              <YAxis 
                tick={{ fontSize: responsiveConfig.fontSize }}
                hide={!responsiveConfig.showAxisLabels}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={(value: number) => [`${value.toFixed(1)} hours`, 'Study Time']}
                  />
                }
              />
              {responsiveConfig.showLegend && <Legend {...LEGEND_CONFIG} />}
              <Area
                type="monotone"
                dataKey={studyTimeTrendConfig.yKey}
                stroke={studyTimeTrendConfig.color}
                fill={`${studyTimeTrendConfig.color}20`}
                strokeWidth={responsiveConfig.strokeWidth}
                name="Study Hours"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detailed Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard 
          title="Completion Rate Trend" 
          subtitle={`${renderTrendIndicator(completionTrend)} monthly completion rate`}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={completionTrendConfig.data}>
              <CartesianGrid strokeDasharray={GRID_CONFIG.strokeDasharray} stroke={GRID_CONFIG.stroke} />
              <XAxis 
                dataKey={completionTrendConfig.xKey}
                tick={{ fontSize: responsiveConfig.fontSize }}
                hide={!responsiveConfig.showAxisLabels}
              />
              <YAxis 
                tick={{ fontSize: responsiveConfig.fontSize }}
                hide={!responsiveConfig.showAxisLabels}
                domain={[0, 100]}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={(value: number) => [`${Math.round(value)}%`, 'Completion']}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey={completionTrendConfig.yKey}
                stroke={completionTrendConfig.color}
                strokeWidth={responsiveConfig.strokeWidth}
                dot={{ fill: completionTrendConfig.color, r: 3 }}
                name="Completion Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          title="Score Distribution" 
          subtitle="Assessment score ranges"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreHistogramConfig.data}>
              <CartesianGrid strokeDasharray={GRID_CONFIG.strokeDasharray} stroke={GRID_CONFIG.stroke} />
              <XAxis 
                dataKey={scoreHistogramConfig.xKey}
                tick={{ fontSize: responsiveConfig.fontSize }}
                hide={!responsiveConfig.showAxisLabels}
              />
              <YAxis 
                tick={{ fontSize: responsiveConfig.fontSize }}
                hide={!responsiveConfig.showAxisLabels}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={(value: number, name: string) => [
                      `${value} assessments (${scoreHistogramConfig.data.find(d => d.count === value)?.percentage || 0}%)`, 
                      'Count'
                    ]}
                  />
                }
              />
              <Bar 
                dataKey={scoreHistogramConfig.yKey} 
                fill={scoreHistogramConfig.color}
                radius={[4, 4, 0, 0]}
                name="Assessments"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          title="Course Progress" 
          subtitle="Overall course completion status"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={completionPieConfig.data}
                cx={completionPieConfig.cx}
                cy={completionPieConfig.cy}
                innerRadius={responsiveConfig.showLegend ? 40 : 50}
                outerRadius={responsiveConfig.showLegend ? 80 : 90}
                paddingAngle={2}
                dataKey="value"
                label={responsiveConfig.showLegend ? undefined : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {completionPieConfig.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {responsiveConfig.showLegend && (
                <Tooltip 
                  content={
                    <CustomTooltip 
                      formatter={(value: number) => [`${value} courses`, 'Count']}
                    />
                  }
                />
              )}
              {responsiveConfig.showLegend && <Legend {...LEGEND_CONFIG} />}
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Skill Progression Chart */}
      {skillProgression.length > 0 && (
        <ChartCard 
          title="Skill Progression Analysis" 
          subtitle="Current performance vs target across different skill areas"
          height={400}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={skillProgression}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray={GRID_CONFIG.strokeDasharray} stroke={GRID_CONFIG.stroke} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: responsiveConfig.fontSize }} />
              <YAxis 
                type="category" 
                dataKey="skill" 
                tick={{ fontSize: responsiveConfig.fontSize }}
                width={80}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={(value: number, name: string) => {
                      const formatMap: Record<string, string> = {
                        current: 'Current Level',
                        target: 'Target Level',
                        improvement: 'Improvement Needed'
                      };
                      return [`${value}%`, formatMap[name] || name];
                    }}
                  />
                }
              />
              {responsiveConfig.showLegend && <Legend {...LEGEND_CONFIG} />}
              <Bar dataKey="current" fill={CHART_COLORS.primary} name="Current Level" />
              <Bar dataKey="target" fill={CHART_COLORS.secondary} name="Target Level" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};