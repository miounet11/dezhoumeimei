'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/src/components/layout/AppLayout';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { LearningAnalytics } from '@/components/dashboard/LearningAnalytics';
import { PerformanceCharts } from '@/components/dashboard/PerformanceCharts';
import { ProgressMetrics } from '@/components/dashboard/ProgressMetrics';
import { 
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Share2,
  RefreshCw,
  Settings,
  Eye,
  Target,
  Clock,
  Award,
  Users,
  BookOpen,
  Zap
} from 'lucide-react';
import { useUserData } from '@/lib/hooks/useUserData';
import { createLogger } from '@/lib/logger';

const logger = createLogger('analytics-page');

interface AnalyticsFilters {
  timeRange: '7d' | '30d' | '90d' | '1y' | 'all';
  category: 'all' | 'courses' | 'assessments' | 'skills' | 'engagement';
  view: 'overview' | 'detailed' | 'comparison';
  exportFormat: 'pdf' | 'csv' | 'json';
}

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="flex justify-between items-center">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="flex space-x-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        ))}
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-24"></div>
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-80"></div>
      ))}
    </div>
  </div>
);

const FilterPanel = ({ 
  filters, 
  onFiltersChange 
}: { 
  filters: AnalyticsFilters; 
  onFiltersChange: (filters: AnalyticsFilters) => void;
}) => {
  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
    { value: 'all', label: 'All time' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'courses', label: 'Courses' },
    { value: 'assessments', label: 'Assessments' },
    { value: 'skills', label: 'Skills' },
    { value: 'engagement', label: 'Engagement' }
  ];

  const viewOptions = [
    { value: 'overview', label: 'Overview' },
    { value: 'detailed', label: 'Detailed' },
    { value: 'comparison', label: 'Comparison' }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Analytics Filters
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onFiltersChange({ 
              timeRange: '30d', 
              category: 'all', 
              view: 'overview', 
              exportFormat: 'pdf' 
            })}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Time Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Range
          </label>
          <select
            value={filters.timeRange}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              timeRange: e.target.value as AnalyticsFilters['timeRange'] 
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              category: e.target.value as AnalyticsFilters['category'] 
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            View Type
          </label>
          <select
            value={filters.view}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              view: e.target.value as AnalyticsFilters['view'] 
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {viewOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export
          </label>
          <div className="flex space-x-2">
            <select
              value={filters.exportFormat}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                exportFormat: e.target.value as AnalyticsFilters['exportFormat'] 
              })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <button
              onClick={() => {
                logger.info('Exporting analytics', { format: filters.exportFormat, filters });
                // Implement export functionality
                alert(`Exporting analytics as ${filters.exportFormat.toUpperCase()}...`);
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-yellow-500 to-orange-500',
    red: 'from-red-500 to-pink-500'
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="text-right">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white`}>
            <Icon className="w-6 h-6" />
          </div>
          
          {trend && (
            <div className={`flex items-center justify-end mt-2 text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 
              trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'
            }`}>
              <span className="mr-1">
                {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
              </span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function AnalyticsPageContent() {
  const { userData, loading, error } = useUserData();
  const searchParams = useSearchParams();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: '30d',
    category: 'all',
    view: 'overview',
    exportFormat: 'pdf'
  });

  useEffect(() => {
    // Initialize filters from URL parameters
    const timeRange = searchParams.get('timeRange') as AnalyticsFilters['timeRange'] || '30d';
    const category = searchParams.get('category') as AnalyticsFilters['category'] || 'all';
    const view = searchParams.get('view') as AnalyticsFilters['view'] || 'overview';
    
    setFilters(prev => ({ ...prev, timeRange, category, view }));
  }, [searchParams]);

  useEffect(() => {
    if (userData) {
      fetchAnalyticsData();
    }
  }, [userData, filters]);

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      
      // Mock analytics data for development
      const mockData = {
        learningData: {
          skillProgression: {
            dimensions: [
              { name: 'Position Play', currentLevel: 78, maxLevel: 100, confidence: 0.85, trend: 'up' as const },
              { name: 'Bluff Detection', currentLevel: 65, maxLevel: 100, confidence: 0.72, trend: 'stable' as const },
              { name: 'Bet Sizing', currentLevel: 88, maxLevel: 100, confidence: 0.91, trend: 'up' as const },
              { name: 'Tournament Play', currentLevel: 52, maxLevel: 100, confidence: 0.64, trend: 'down' as const },
              { name: 'Cash Game Strategy', currentLevel: 75, maxLevel: 100, confidence: 0.80, trend: 'up' as const },
              { name: 'Bankroll Management', currentLevel: 92, maxLevel: 100, confidence: 0.95, trend: 'stable' as const }
            ],
            overallProgress: 75,
            strongestSkills: ['Bankroll Management', 'Bet Sizing', 'Position Play'],
            weakestSkills: ['Tournament Play', 'Bluff Detection']
          },
          courseCompletion: {
            completionRate: 68,
            completedCourses: 17,
            totalCourses: 25,
            totalStudyTime: 2450, // in minutes
            averageScore: 84
          },
          studyPatterns: {
            preferredStudyTimes: Array.from({length: 24}, (_, i) => ({
              hour: i,
              count: Math.floor(Math.random() * 15) + (i >= 18 && i <= 22 ? 10 : 2), // Peak evening hours
              avgDuration: Math.floor(Math.random() * 45) + 15
            })),
            consistency: {
              streakDays: 12,
              studyDaysPerWeek: 5.8,
              avgSessionsPerDay: 2.3,
              regularityScore: 82
            }
          }
        },
        performanceData: {
          assessmentScores: Array.from({length: 60}, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 30) + 65 + (i < 10 ? 5 : 0) // Recent improvement trend
          })).reverse(),
          studyTimeWeekly: Array.from({length: 12}, (_, i) => ({
            date: `Week ${i + 1}`,
            value: Math.floor(Math.random() * 8) + 12 + (i > 6 ? 3 : 0) // Increasing trend
          })),
          completionRateMonthly: Array.from({length: 6}, (_, i) => ({
            date: `Month ${i + 1}`,
            value: Math.floor(Math.random() * 25) + 55 + (i > 2 ? 10 : 0) // Recent improvement
          })),
          scoreDistribution: [62, 68, 74, 78, 82, 87, 92, 95],
          courseCompletion: {
            completed: 17,
            inProgress: 4,
            notStarted: 4
          },
          skillProgression: [
            { skill: 'Position Play', current: 78, target: 90, improvement: 12 },
            { skill: 'Bluff Detection', current: 65, target: 85, improvement: 20 },
            { skill: 'Bet Sizing', current: 88, target: 95, improvement: 7 },
            { skill: 'Tournament Play', current: 52, target: 75, improvement: 23 },
            { skill: 'Cash Game Strategy', current: 75, target: 90, improvement: 15 }
          ]
        },
        progressMetrics: {
          assessmentPerformance: {
            totalAssessments: 43,
            averageScore: 84,
            highestScore: 96,
            recentTrend: 'improving' as const
          },
          learningVelocity: {
            coursesPerWeek: 2.3,
            topicsPerWeek: 12.7,
            timeToCompletion: 4.2,
            efficiencyScore: 87
          },
          engagement: {
            dailyActiveTime: 52, // minutes
            weeklyActiveTime: 364, // minutes
            monthlyActiveTime: 1458, // minutes
            sessionCount: 28
          }
        },
        insights: {
          keyFindings: [
            'Performance shows consistent upward trend in last 30 days',
            'Evening study sessions (6-10 PM) show highest retention rates',
            'Tournament play remains primary area for improvement',
            'Bankroll management mastery achieved - consider advanced topics'
          ],
          recommendations: [
            'Focus on tournament-specific strategies',
            'Increase bluff detection practice sessions',
            'Consider live play integration for position practice'
          ]
        }
      };
      
      setAnalyticsData(mockData);
      logger.info('Analytics data fetched', { filters, dataPoints: mockData.performanceData.assessmentScores.length });
    } catch (error) {
      logger.error('Error fetching analytics data:', error);
      setAnalyticsError(error instanceof Error ? error.message : 'Failed to fetch analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
    
    // Update URL parameters
    const url = new URL(window.location.href);
    url.searchParams.set('timeRange', newFilters.timeRange);
    url.searchParams.set('category', newFilters.category);
    url.searchParams.set('view', newFilters.view);
    window.history.replaceState({}, '', url.toString());
  };

  const getKeyMetrics = () => {
    if (!analyticsData) return [];
    
    return [
      {
        title: 'Total Study Time',
        value: `${Math.round((analyticsData as any).learningData.courseCompletion.totalStudyTime / 60)}h`,
        subtitle: `${filters.timeRange.replace('d', ' days').replace('y', ' year')}`,
        icon: Clock,
        trend: { value: 15, direction: 'up' as const },
        color: 'blue' as const
      },
      {
        title: 'Average Score',
        value: `${(analyticsData as any).progressMetrics.assessmentPerformance.averageScore}%`,
        subtitle: `${(analyticsData as any).progressMetrics.assessmentPerformance.totalAssessments} assessments`,
        icon: Target,
        trend: { value: 8, direction: 'up' as const },
        color: 'green' as const
      },
      {
        title: 'Courses Completed',
        value: (analyticsData as any).learningData.courseCompletion.completedCourses,
        subtitle: `${Math.round((analyticsData as any).learningData.courseCompletion.completionRate)}% completion rate`,
        icon: BookOpen,
        trend: { value: 12, direction: 'up' as const },
        color: 'purple' as const
      },
      {
        title: 'Learning Efficiency',
        value: `${(analyticsData as any).progressMetrics.learningVelocity.efficiencyScore}%`,
        subtitle: 'Performance index',
        icon: Zap,
        trend: { value: 5, direction: 'up' as const },
        color: 'orange' as const
      }
    ];
  };

  if (loading || analyticsLoading) {
    return <LoadingSkeleton />;
  }

  if (error || analyticsError) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to Load Analytics
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error || analyticsError}
        </p>
        <button
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  const keyMetrics = getKeyMetrics();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-7 h-7 mr-3 text-blue-600" />
            Learning Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights into your learning progress and performance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAnalyticsData}
            disabled={analyticsLoading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <RefreshCw className={`w-5 h-5 ${analyticsLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2">
            <Share2 className="w-4 h-4" />
            <span>Share Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            trend={metric.trend}
            color={metric.color}
          />
        ))}
      </div>

      {/* Learning Analytics */}
      {analyticsData && (
        <LearningAnalytics 
          learningData={(analyticsData as any).learningData}
          className="w-full"
        />
      )}

      {/* Performance Charts */}
      {analyticsData && (
        <PerformanceCharts 
          assessmentScores={(analyticsData as any).performanceData.assessmentScores}
          studyTimeWeekly={(analyticsData as any).performanceData.studyTimeWeekly}
          completionRateMonthly={(analyticsData as any).performanceData.completionRateMonthly}
          scoreDistribution={(analyticsData as any).performanceData.scoreDistribution}
          courseCompletion={(analyticsData as any).performanceData.courseCompletion}
          skillProgression={(analyticsData as any).performanceData.skillProgression}
          className="w-full"
        />
      )}

      {/* Progress Metrics */}
      {analyticsData && (
        <ProgressMetrics 
          performanceMetrics={(analyticsData as any).progressMetrics}
          skillProgression={(analyticsData as any).learningData.skillProgression.dimensions}
          recentTrends={(analyticsData as any).performanceData.assessmentScores}
          className="w-full"
        />
      )}

      {/* Insights Panel */}
      {analyticsData && (analyticsData as any).insights && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-blue-600" />
            Key Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Key Findings</h4>
              <ul className="space-y-2">
                {((analyticsData as any).insights.keyFindings as string[]).map((finding, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {((analyticsData as any).insights.recommendations as string[]).map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { userData } = useUserData();

  return (
    <AppLayout>
      <DashboardLayout 
        userId={userData?.id || 'current-user'}
        className="min-h-screen"
      >
        <Suspense fallback={<LoadingSkeleton />}>
          <AnalyticsPageContent />
        </Suspense>
      </DashboardLayout>
    </AppLayout>
  );
}