/**
 * Admin Assessments Management Page
 * List, filter, and manage all assessments in the system
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminPage } from '@/components/admin/AdminLayout';

interface Assessment {
  id: string;
  title: string;
  description?: string;
  difficulty: string;
  passThreshold: number;
  timeLimitMinutes?: number;
  maxAttempts: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course: {
    id: string;
    title: string;
    level: string;
  };
  questionCount: number;
  attemptCount: number;
  passRate: number;
  averageScore: number;
  uniqueUsers: number;
}

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    courseId: '',
    difficulty: '',
    active: ''
  });
  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(new Set());

  // Mock data for development
  const mockAssessments: Assessment[] = [
    {
      id: '1',
      title: 'Poker Basics Quiz',
      description: 'Test your understanding of basic poker concepts',
      difficulty: 'BEGINNER',
      passThreshold: 70,
      timeLimitMinutes: 15,
      maxAttempts: 3,
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
      course: {
        id: '1',
        title: 'Poker Fundamentals',
        level: 'BEGINNER'
      },
      questionCount: 10,
      attemptCount: 127,
      passRate: 84.2,
      averageScore: 78.5,
      uniqueUsers: 98
    },
    {
      id: '2',
      title: 'GTO Strategy Assessment',
      description: 'Advanced questions on Game Theory Optimal play',
      difficulty: 'INTERMEDIATE',
      passThreshold: 75,
      timeLimitMinutes: 30,
      maxAttempts: 2,
      isActive: true,
      createdAt: '2024-01-10T14:00:00Z',
      updatedAt: '2024-01-18T09:15:00Z',
      course: {
        id: '2',
        title: 'GTO Strategy Basics',
        level: 'INTERMEDIATE'
      },
      questionCount: 15,
      attemptCount: 89,
      passRate: 67.4,
      averageScore: 72.1,
      uniqueUsers: 64
    },
    {
      id: '3',
      title: 'Psychology Final Exam',
      description: 'Comprehensive test on poker psychology concepts',
      difficulty: 'ADVANCED',
      passThreshold: 80,
      timeLimitMinutes: 45,
      maxAttempts: 1,
      isActive: false,
      createdAt: '2024-01-05T16:30:00Z',
      updatedAt: '2024-01-12T11:45:00Z',
      course: {
        id: '3',
        title: 'Tournament Psychology',
        level: 'ADVANCED'
      },
      questionCount: 20,
      attemptCount: 34,
      passRate: 52.9,
      averageScore: 68.7,
      uniqueUsers: 28
    }
  ];

  useEffect(() => {
    fetchAssessments();
  }, [filters]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      
      // For development, use mock data
      // In production, fetch from API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock data
      let filteredAssessments = mockAssessments;
      
      if (filters.search) {
        filteredAssessments = filteredAssessments.filter(assessment =>
          assessment.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          assessment.description?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      if (filters.difficulty) {
        filteredAssessments = filteredAssessments.filter(assessment => 
          assessment.difficulty === filters.difficulty
        );
      }
      
      if (filters.active) {
        filteredAssessments = filteredAssessments.filter(assessment => 
          assessment.isActive === (filters.active === 'true')
        );
      }
      
      setAssessments(filteredAssessments);
      setError(null);
    } catch (err) {
      setError('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 80) return 'text-green-600';
    if (passRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <AdminPage>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assessment Management</h1>
            <p className="text-gray-600">Create and manage quizzes and assessments</p>
          </div>
          <Link
            href="/admin/assessments/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>📝</span>
            <span>Create Assessment</span>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search assessments..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Difficulties</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
            
            <select
              value={filters.active}
              onChange={(e) => setFilters(prev => ({ ...prev, active: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <button
              onClick={fetchAssessments}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{assessments.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Assessments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessments.filter(a => a.isActive).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessments.reduce((sum, a) => sum + a.attemptCount, 0)}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessments.length > 0 
                    ? (assessments.reduce((sum, a) => sum + a.passRate, 0) / assessments.length).toFixed(1)
                    : 0
                  }%
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assessments Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading assessments...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={fetchAssessments}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assessment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{assessment.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {assessment.description}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">
                              {assessment.questionCount} questions
                            </span>
                            <span className="text-xs text-gray-500">
                              {assessment.timeLimitMinutes ? `${assessment.timeLimitMinutes}min limit` : 'No time limit'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {assessment.passThreshold}% pass threshold
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{assessment.course.title}</div>
                        <div className="text-sm text-gray-500">{assessment.course.level}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(assessment.difficulty)}`}>
                          {assessment.difficulty.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900">{assessment.attemptCount} attempts</span>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-900">{assessment.uniqueUsers} users</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`font-medium ${getPassRateColor(assessment.passRate)}`}>
                              {assessment.passRate.toFixed(1)}% pass rate
                            </span>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-600">
                              {assessment.averageScore.toFixed(1)}% avg score
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          assessment.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {assessment.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/assessments/${assessment.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </Link>
                          <span>|</span>
                          <Link
                            href={`/admin/assessments/${assessment.id}/edit`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                          <span>|</span>
                          <button className="text-green-600 hover:text-green-800">
                            Duplicate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {assessments.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No assessments found matching your filters.</p>
                  <Link
                    href="/admin/assessments/create"
                    className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                  >
                    Create your first assessment
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}