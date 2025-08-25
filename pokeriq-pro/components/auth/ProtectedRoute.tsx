'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        // 保存当前路径，登录后可以重定向回来
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
        router.push(redirectUrl);
      } else if (!requireAuth && isAuthenticated) {
        // 如果已登录但访问不需要认证的页面（如登录页），重定向到首页
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, router, pathname, redirectTo]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-xl mb-4">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">PokerIQ Pro</h2>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  // 认证检查
  if (requireAuth && !isAuthenticated) {
    return null; // 重定向正在进行，不显示内容
  }

  if (!requireAuth && isAuthenticated) {
    return null; // 重定向正在进行，不显示内容
  }

  return <>{children}</>;
}