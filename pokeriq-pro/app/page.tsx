'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 检查用户是否已登录
    const token = localStorage.getItem('token');
    
    if (token) {
      // 如果已登录，重定向到仪表板
      router.push('/dashboard');
    } else {
      // 如果未登录，重定向到登录页面
      router.push('/auth/login');
    }
  }, [router]);

  // 显示加载状态
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mx-auto flex items-center justify-center mb-4">
          <span className="text-2xl text-white">🃏</span>
        </div>
        <div className="text-xl font-medium text-gray-800 dark:text-white mb-2">
          PokerIQ Pro
        </div>
        <div className="text-gray-600 dark:text-gray-300 mb-4">
          正在加载...
        </div>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
