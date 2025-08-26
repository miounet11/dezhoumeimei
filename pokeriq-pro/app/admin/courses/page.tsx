/**
 * Admin Courses Management Page
 * List, filter, and manage all courses in the system
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminPage } from '@/components/admin/AdminLayout';

interface Course {
  id: string;
  title: string;
  description?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  thumbnailUrl?: string;
  durationMinutes?: number;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assessmentCount: number;
  activeAssessments: number;
  enrollmentCount: number;
  averageProgress: number;
}

interface CoursesResponse {
  success: boolean;
  data: {
    courses: Course[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  };
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    level: '',
    active: ''
  });
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');

  // Mock data for development
  const mockCourses: Course[] = [
    {
      id: '1',
      title: 'Poker Fundamentals',
      description: 'Learn the basics of poker strategy and hand selection',
      level: 'BEGINNER',
      thumbnailUrl: '/images/course-thumbnails/poker-fundamentals.jpg',
      durationMinutes: 120,
      tags: ['basics', 'strategy', 'beginner'],
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
      assessmentCount: 3,
      activeAssessments: 3,
      enrollmentCount: 245,
      averageProgress: 78.5
    },
    {
      id: '2',
      title: 'GTO Strategy Basics',
      description: 'Introduction to Game Theory Optimal poker strategy',
      level: 'INTERMEDIATE',
      thumbnailUrl: '/images/course-thumbnails/gto-basics.jpg',
      durationMinutes: 180,
      tags: ['gto', 'strategy', 'intermediate'],
      isActive: true,
      createdAt: '2024-01-10T14:00:00Z',
      updatedAt: '2024-01-18T09:15:00Z',
      assessmentCount: 5,
      activeAssessments: 4,
      enrollmentCount: 156,
      averageProgress: 65.2
    },
    {
      id: '3',
      title: 'Tournament Psychology',
      description: 'Mental game and psychological aspects of tournament play',
      level: 'ADVANCED',
      thumbnailUrl: '/images/course-thumbnails/tournament-psychology.jpg',
      durationMinutes: 90,
      tags: ['psychology', 'tournament', 'advanced'],
      isActive: false,
      createdAt: '2024-01-05T16:30:00Z',
      updatedAt: '2024-01-12T11:45:00Z',
      assessmentCount: 2,
      activeAssessments: 1,
      enrollmentCount: 89,
      averageProgress: 42.8
    }
  ];

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // For development, use mock data
      // In production, fetch from API:
      // const response = await fetch('/api/admin/courses?' + new URLSearchParams(filters));
      // const data: CoursesResponse = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock data based on filters
      let filteredCourses = mockCourses;
      
      if (filters.search) {
        filteredCourses = filteredCourses.filter(course =>
          course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          course.description?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      if (filters.level) {
        filteredCourses = filteredCourses.filter(course => course.level === filters.level);
      }
      
      if (filters.active) {
        filteredCourses = filteredCourses.filter(course => 
          course.isActive === (filters.active === 'true')
        );
      }
      
      setCourses(filteredCourses);
      setError(null);
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectCourse = (courseId: string, selected: boolean) => {
    const newSelected = new Set(selectedCourses);
    if (selected) {
      newSelected.add(courseId);
    } else {
      newSelected.delete(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedCourses(new Set(courses.map(c => c.id)));
    } else {
      setSelectedCourses(new Set());
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedCourses.size === 0) return;

    try {
      // In production, call API:
      // await fetch('/api/admin/courses', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     action: bulkAction,
      //     courseIds: Array.from(selectedCourses)
      //   })
      // });

      console.log(`Bulk action ${bulkAction} on courses:`, Array.from(selectedCourses));
      
      // Simulate update
      setCourses(prev => prev.map(course => {
        if (selectedCourses.has(course.id)) {
          switch (bulkAction) {
            case 'activate':
              return { ...course, isActive: true };
            case 'deactivate':
              return { ...course, isActive: false };
            default:
              return course;
          }
        }
        return course;
      }));

      setSelectedCourses(new Set());
      setBulkAction('');
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminPage>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600">Manage all courses in the learning platform</p>
          </div>
          <Link
            href="/admin/courses/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Create Course</span>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search courses..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
            
            <select
              value={filters.active}
              onChange={(e) => handleFilterChange('active', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <button
              onClick={fetchCourses}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCourses.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedCourses.size} course(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="border border-blue-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">Select Action</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading courses...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={fetchCourses}
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
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={courses.length > 0 && selectedCourses.size === courses.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
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
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCourses.has(course.id)}
                          onChange={(e) => handleSelectCourse(course.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-lg">📚</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{course.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {course.description}
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              {course.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(course.level)}`}>
                          {course.level.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium">{course.enrollmentCount}</span>
                          <span className="text-xs text-gray-500">
                            {course.assessmentCount} assessments
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${course.averageProgress}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="ml-2 text-xs text-gray-600">
                            {course.averageProgress.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {course.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </Link>
                          <span>|</span>
                          <Link
                            href={`/admin/courses/${course.id}/edit`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {courses.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No courses found matching your filters.</p>
                  <Link
                    href="/admin/courses/create"
                    className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                  >
                    Create your first course
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