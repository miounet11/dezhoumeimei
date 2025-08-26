/**
 * Admin Layout Component
 * Main layout for all admin pages with navigation and access control
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminUser, hasPermission } from '@/lib/admin/permissions';

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: AdminUser;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: '📊',
    permission: 'VIEW_DASHBOARD' as const
  },
  {
    name: 'Courses',
    href: '/admin/courses',
    icon: '📚',
    permission: 'MANAGE_COURSES' as const
  },
  {
    name: 'Assessments',
    href: '/admin/assessments',
    icon: '📝',
    permission: 'MANAGE_ASSESSMENTS' as const
  },
  {
    name: 'Media Library',
    href: '/admin/media',
    icon: '🎵',
    permission: 'MANAGE_MEDIA' as const
  },
  {
    name: 'Characters',
    href: '/admin/characters',
    icon: '🎭',
    permission: 'MANAGE_CHARACTERS' as const
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: '👥',
    permission: 'MANAGE_USERS' as const
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: '📈',
    permission: 'VIEW_ANALYTICS' as const
  }
];

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const pathname = usePathname();

  // Filter navigation items based on user permissions
  const filteredNavigation = user 
    ? navigation.filter(item => hasPermission(user, item.permission))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  P
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-gray-900">PokerIQ Pro</span>
                  <span className="text-xs text-gray-500">Admin Panel</span>
                </div>
              </Link>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{user?.role || 'ADMIN'}</p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Admin Page Wrapper - includes authentication check
 */
interface AdminPageProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function AdminPage({ children, requiredPermission }: AdminPageProps) {
  // For development, use demo admin user
  const user = {
    id: 'demo-admin-id',
    email: 'admin@pokeriq.pro',
    name: 'Admin User',
    role: 'SUPER_ADMIN' as const
  };

  // In production, this would check actual authentication
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need admin permissions to access this page.</p>
          <Link
            href="/auth/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout user={user}>
      {children}
    </AdminLayout>
  );
}