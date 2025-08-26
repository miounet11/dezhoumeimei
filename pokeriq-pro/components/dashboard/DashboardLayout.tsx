'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard,
  TrendingUp,
  Trophy,
  BarChart3,
  Users,
  Star,
  Settings,
  ChevronRight,
  RefreshCw,
  Bell,
  Filter,
  Download,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

// Import existing dashboard components
import { LearningAnalytics } from './LearningAnalytics';
import { PerformanceCharts } from './PerformanceCharts';
import SocialFeatures from './SocialFeatures';
import { ProgressMetrics } from './ProgressMetrics';
import ProgressTracker from './ProgressTracker';
import RecommendationPanel from './RecommendationPanel';

// Import UI components
import { createLogger } from '@/lib/logger';

const logger = createLogger('dashboard-layout');

interface DashboardLayoutProps {
  userId: string;
  initialData?: any;
  children?: React.ReactNode;
  className?: string;
}

interface DashboardSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
  description?: string;
}

interface DashboardSettings {
  compactMode: boolean;
  showNotifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  visibleSections: string[];
  theme: 'light' | 'dark' | 'auto';
}

const LoadingCard: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div 
    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
    style={{ height }}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
    </div>
    <div className="mt-6 h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

const ErrorBoundary: React.FC<{ 
  fallback: React.ReactNode; 
  children: React.ReactNode;
}> = ({ fallback, children }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    logger.error('Dashboard component error:', error);
    return <>{fallback}</>;
  }
};

export default function DashboardLayout({
  userId,
  initialData,
  children,
  className = ''
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(initialData || null);
  const [settings, setSettings] = useState<DashboardSettings>({
    compactMode: false,
    showNotifications: true,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    visibleSections: ['overview', 'analytics', 'progress', 'recommendations', 'social'],
    theme: 'auto'
  });
  const [activeSection, setActiveSection] = useState('overview');

  const sections: DashboardSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: LayoutDashboard,
      path: '/dashboard',
      description: 'General dashboard overview'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: BarChart3,
      path: '/dashboard/analytics',
      description: 'Detailed performance analytics'
    },
    {
      id: 'achievements',
      title: 'Achievements',
      icon: Trophy,
      path: '/dashboard/achievements',
      badge: 3,
      description: 'Achievements and social features'
    },
    {
      id: 'progress',
      title: 'Progress',
      icon: TrendingUp,
      path: '/dashboard/progress',
      description: 'Learning progress tracking'
    }
  ];

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('dashboard-settings');
    if (savedSettings) {
      try {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      } catch (error) {
        logger.warn('Failed to parse saved settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('dashboard-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    // Auto-refresh functionality
    if (!settings.autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, settings.refreshInterval);

    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval]);

  useEffect(() => {
    // Determine active section based on current path
    const currentSection = sections.find(section => section.path === pathname);
    if (currentSection) {
      setActiveSection(currentSection.id);
    }
  }, [pathname]);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data
      const response = await fetch(`/api/dashboard/data/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const newData = await response.json();
      setData(newData);
      
      logger.info('Dashboard data refreshed successfully');
    } catch (error) {
      logger.error('Error refreshing dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      refreshData();
    } else {
      setData(initialData);
      setLoading(false);
    }
  }, [userId]);

  const toggleSectionVisibility = (sectionId: string) => {
    setSettings(prev => ({
      ...prev,
      visibleSections: prev.visibleSections.includes(sectionId)
        ? prev.visibleSections.filter(id => id !== sectionId)
        : [...prev.visibleSections, sectionId]
    }));
  };

  const handleSectionChange = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      router.push(section.path);
    }
  };

  const renderNavigationTabs = () => (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <nav className="flex space-x-8 px-6">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;
          
          return (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{section.title}</span>
              {section.badge && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  {section.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {sections.find(s => s.id === activeSection)?.description || 'Comprehensive learning analytics'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setSettings(prev => ({ ...prev, compactMode: !prev.compactMode }))}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            title={settings.compactMode ? 'Exit compact mode' : 'Enter compact mode'}
          >
            {settings.compactMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          {settings.showNotifications && (
            <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
          )}

          {/* Settings */}
          <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderOverviewSection = () => (
    <div className={`space-y-6 ${settings.compactMode ? 'space-y-4' : 'space-y-6'}`}>
      {/* Quick Stats */}
      {settings.visibleSections.includes('overview') && (
        <ErrorBoundary fallback={<LoadingCard height={200} />}>
          <Suspense fallback={<LoadingCard height={200} />}>
            <ProgressTracker 
              userId={userId} 
              data={data?.progressData} 
              loading={loading}
              compact={settings.compactMode}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      <div className={`grid ${settings.compactMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
        {/* Learning Analytics */}
        {settings.visibleSections.includes('analytics') && (
          <ErrorBoundary fallback={<LoadingCard />}>
            <Suspense fallback={<LoadingCard />}>
              <LearningAnalytics 
                learningData={data?.learningData || {
                  skillProgression: { dimensions: [], overallProgress: 0, strongestSkills: [], weakestSkills: [] },
                  courseCompletion: { completionRate: 0, completedCourses: 0, totalCourses: 0, totalStudyTime: 0, averageScore: 0 },
                  studyPatterns: { preferredStudyTimes: [], consistency: { streakDays: 0, studyDaysPerWeek: 0, avgSessionsPerDay: 0, regularityScore: 0 } }
                }}
                loading={loading}
                className="h-full"
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Recommendations */}
        {settings.visibleSections.includes('recommendations') && (
          <ErrorBoundary fallback={<LoadingCard />}>
            <Suspense fallback={<LoadingCard />}>
              <RecommendationPanel 
                userId={userId}
                data={data?.recommendationData}
                loading={loading}
                compact={settings.compactMode}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>

      {/* Performance Charts */}
      {settings.visibleSections.includes('progress') && (
        <ErrorBoundary fallback={<LoadingCard height={400} />}>
          <Suspense fallback={<LoadingCard height={400} />}>
            <PerformanceCharts 
              assessmentScores={data?.performanceData?.assessmentScores || []}
              studyTimeWeekly={data?.performanceData?.studyTimeWeekly || []}
              completionRateMonthly={data?.performanceData?.completionRateMonthly || []}
              scoreDistribution={data?.performanceData?.scoreDistribution}
              courseCompletion={data?.performanceData?.courseCompletion}
              skillProgression={data?.performanceData?.skillProgression}
              loading={loading}
              className="w-full"
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Social Features */}
      {settings.visibleSections.includes('social') && (
        <ErrorBoundary fallback={<LoadingCard height={500} />}>
          <Suspense fallback={<LoadingCard height={500} />}>
            <SocialFeatures 
              userId={userId}
              className="w-full"
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );

  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Trophy className="w-16 h-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {renderHeader()}
      {renderNavigationTabs()}
      
      <main className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children || renderOverviewSection()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Settings Panel - Hidden for now */}
      <div className="hidden">
        <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard Settings</h3>
          
          {/* Visibility Controls */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Visible Sections</h4>
            <div className="space-y-2">
              {['overview', 'analytics', 'progress', 'recommendations', 'social'].map(sectionId => (
                <label key={sectionId} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.visibleSections.includes(sectionId)}
                    onChange={() => toggleSectionVisibility(sectionId)}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm capitalize">{sectionId}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}