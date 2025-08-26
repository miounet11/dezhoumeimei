/**
 * Admin Dashboard Main Page
 * Overview and analytics for the content management system
 */

'use client';

import React from 'react';
import { AdminPage } from '@/components/admin/AdminLayout';

// Mock data - in production this would come from API
const dashboardData = {
  stats: {
    totalCourses: 24,
    publishedCourses: 18,
    totalAssessments: 56,
    totalUsers: 1247,
    activeUsers: 892,
    totalSessions: 3456
  },
  recentActivity: [
    {
      id: 1,
      type: 'course_created',
      description: 'New course "Advanced Tournament Strategy" created',
      user: 'Admin User',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      type: 'assessment_updated',
      description: 'Assessment "Basic Preflop Quiz" updated',
      user: 'Content Admin',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      type: 'user_enrolled',
      description: '5 new users enrolled in courses today',
      user: 'System',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ],
  popularCourses: [
    { id: 1, title: 'Poker Fundamentals', enrollments: 234, rating: 4.8 },
    { id: 2, title: 'GTO Basics', enrollments: 189, rating: 4.9 },
    { id: 3, title: 'Tournament Strategy', enrollments: 156, rating: 4.7 },
    { id: 4, title: 'Cash Game Mastery', enrollments: 143, rating: 4.6 },
    { id: 5, title: 'Psychology of Poker', enrollments: 98, rating: 4.8 }
  ]
};

export default function AdminDashboard() {
  return (
    <AdminPage>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Content management system overview and analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard 
            title="Total Courses" 
            value={dashboardData.stats.totalCourses}
            subtitle={`${dashboardData.stats.publishedCourses} published`}
            icon="📚"
            color="blue"
          />
          <StatsCard 
            title="Assessments" 
            value={dashboardData.stats.totalAssessments}
            subtitle="Active quiz questions"
            icon="📝"
            color="green"
          />
          <StatsCard 
            title="Total Users" 
            value={dashboardData.stats.totalUsers}
            subtitle={`${dashboardData.stats.activeUsers} active`}
            icon="👥"
            color="purple"
          />
          <StatsCard 
            title="Learning Sessions" 
            value={dashboardData.stats.totalSessions}
            subtitle="This month"
            icon="🎯"
            color="orange"
          />
          <StatsCard 
            title="Completion Rate" 
            value="78%"
            subtitle="Average course completion"
            icon="✅"
            color="teal"
          />
          <StatsCard 
            title="Satisfaction" 
            value="4.7★"
            subtitle="Average course rating"
            icon="⭐"
            color="yellow"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-sm">
                          {activity.type === 'course_created' && '📚'}
                          {activity.type === 'assessment_updated' && '📝'}
                          {activity.type === 'user_enrolled' && '👤'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          by {activity.user} • {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Popular Courses */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Popular Courses</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.popularCourses.map((course, index) => (
                    <div key={course.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {course.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {course.enrollments} enrollments • {course.rating}★
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickActionButton 
                href="/admin/courses/create"
                icon="➕"
                title="Create Course"
                description="Add new learning content"
              />
              <QuickActionButton 
                href="/admin/assessments/create"
                icon="📝"
                title="Create Quiz"
                description="Build new assessment"
              />
              <QuickActionButton 
                href="/admin/media"
                icon="📁"
                title="Manage Media"
                description="Upload and organize files"
              />
              <QuickActionButton 
                href="/admin/analytics"
                icon="📊"
                title="View Analytics"
                description="Detailed reports"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'yellow';
}

function StatsCard({ title, value, subtitle, icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
    teal: 'bg-teal-50 text-teal-700',
    yellow: 'bg-yellow-50 text-yellow-700'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

function QuickActionButton({ href, icon, title, description }: QuickActionButtonProps) {
  return (
    <a
      href={href}
      className="block p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </a>
  );
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}