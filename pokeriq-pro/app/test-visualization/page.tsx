'use client';

import React, { useState } from 'react';
import { PerformanceCharts } from '@/components/dashboard/PerformanceCharts';
import { LearningAnalytics } from '@/components/dashboard/LearningAnalytics';
import { ProgressMetrics } from '@/components/dashboard/ProgressMetrics';
import { useDashboardData } from '@/hooks/useDashboardData';

// Mock data for testing
const mockData = {
  assessmentScores: [
    { date: '2024-08-20', value: 70, label: '70%' },
    { date: '2024-08-21', value: 75, label: '75%' },
    { date: '2024-08-22', value: 80, label: '80%' },
    { date: '2024-08-23', value: 78, label: '78%' },
    { date: '2024-08-24', value: 82, label: '82%' },
    { date: '2024-08-25', value: 85, label: '85%' },
    { date: '2024-08-26', value: 83, label: '83%' }
  ],
  studyTimeWeekly: [
    { date: 'Aug 19', value: 3.5, label: '3.5h' },
    { date: 'Aug 26', value: 4.2, label: '4.2h' }
  ],
  completionRateMonthly: [
    { date: 'July', value: 25, label: '25%' },
    { date: 'August', value: 30, label: '30%' }
  ],
  scoreDistribution: [75, 82, 68, 90, 78, 85, 72, 88, 79, 81, 76, 83],
  courseCompletion: {
    completed: 8,
    inProgress: 3,
    notStarted: 2
  },
  skillProgression: [
    { skill: 'Preflop Strategy', current: 85, target: 90, improvement: 5 },
    { skill: 'Postflop Play', current: 72, target: 85, improvement: 13 },
    { skill: 'Bluffing', current: 68, target: 80, improvement: 12 },
    { skill: 'Bankroll Management', current: 90, target: 95, improvement: 5 },
    { skill: 'Tournament Play', current: 60, target: 75, improvement: 15 }
  ]
};

const TestVisualization = () => {
  const [selectedComponent, setSelectedComponent] = useState<'performance' | 'analytics' | 'metrics'>('performance');
  const [testUserId, setTestUserId] = useState('test-user-123');
  
  const { data, loading, error, refetch } = useDashboardData({
    userId: testUserId,
    autoRefresh: false,
    enableAdvancedMetrics: false,
    enableAggregatedData: false
  });

  const handleTestRefetch = async () => {
    await refetch();
  };

  const ComponentTabs = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
      {[
        { id: 'performance', label: 'Performance Charts' },
        { id: 'analytics', label: 'Learning Analytics' },
        { id: 'metrics', label: 'Progress Metrics' }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setSelectedComponent(tab.id as any)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedComponent === tab.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const DataStatus = () => (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Data Status</h3>
        <button
          onClick={handleTestRefetch}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="font-medium">Loading:</span>
          <span className={`ml-2 ${loading ? 'text-yellow-600' : 'text-green-600'}`}>
            {loading ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Error:</span>
          <span className={`ml-2 ${error ? 'text-red-600' : 'text-green-600'}`}>
            {error ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Learning Data:</span>
          <span className={`ml-2 ${data.learningAnalytics ? 'text-green-600' : 'text-red-600'}`}>
            {data.learningAnalytics ? 'Loaded' : 'Missing'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Performance Data:</span>
          <span className={`ml-2 ${data.performanceMetrics ? 'text-green-600' : 'text-red-600'}`}>
            {data.performanceMetrics ? 'Loaded' : 'Missing'}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Visualization Components Test
            </h1>
            <p className="text-gray-600">
              Testing dashboard visualization components with mock and real data
            </p>
          </div>

          {/* Component Selection */}
          <ComponentTabs />

          {/* Data Status */}
          <DataStatus />

          {/* Component Display */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {selectedComponent === 'performance' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Performance Charts Component</h2>
                <PerformanceCharts
                  assessmentScores={mockData.assessmentScores}
                  studyTimeWeekly={mockData.studyTimeWeekly}
                  completionRateMonthly={mockData.completionRateMonthly}
                  scoreDistribution={mockData.scoreDistribution}
                  courseCompletion={mockData.courseCompletion}
                  skillProgression={mockData.skillProgression}
                  loading={loading}
                />
              </div>
            )}

            {selectedComponent === 'analytics' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Learning Analytics Component</h2>
                {data.learningAnalytics ? (
                  <LearningAnalytics
                    learningData={data.learningAnalytics}
                    loading={loading}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        📊
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                    <p className="text-gray-600 mb-4">
                      Learning analytics data is not available yet. Click "Refresh Data" to try again.
                    </p>
                    <button
                      onClick={handleTestRefetch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedComponent === 'metrics' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Progress Metrics Component</h2>
                {data.performanceMetrics ? (
                  <ProgressMetrics
                    performanceMetrics={data.performanceMetrics}
                    skillProgression={data.learningAnalytics?.skillProgression.dimensions}
                    recentTrends={mockData.assessmentScores}
                    loading={loading}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        📈
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Metrics Data</h3>
                    <p className="text-gray-600 mb-4">
                      Performance metrics data is not available yet. Click "Refresh Data" to try again.
                    </p>
                    <button
                      onClick={handleTestRefetch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Component Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Component Information</h3>
            <div className="text-sm text-blue-800 space-y-2">
              {selectedComponent === 'performance' && (
                <div>
                  <p><strong>PerformanceCharts</strong> - Interactive visualizations for assessment scores, study time trends, and course completion data.</p>
                  <p>Features: Line charts, area charts, bar charts, pie charts with responsive design and custom tooltips.</p>
                </div>
              )}
              
              {selectedComponent === 'analytics' && (
                <div>
                  <p><strong>LearningAnalytics</strong> - Comprehensive skill progression analysis with radar charts, consistency metrics, and study patterns.</p>
                  <p>Features: Skill radar, activity patterns, consistency tracking, and personalized insights.</p>
                </div>
              )}
              
              {selectedComponent === 'metrics' && (
                <div>
                  <p><strong>ProgressMetrics</strong> - Visual progress indicators with custom circular progress rings and skill bars.</p>
                  <p>Features: Custom SVG progress rings, skill progress bars, performance cards, and velocity tracking.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestVisualization;