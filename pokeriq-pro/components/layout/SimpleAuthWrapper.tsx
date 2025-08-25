'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// 不需要登录的页面
const publicPages = ['/auth/login', '/auth/register', '/'];

export default function SimpleAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 检查是否需要验证
    const isPublicPage = publicPages.includes(pathname);
    
    if (!isPublicPage) {
      // 检查登录状态
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      
      if (!token || !user) {
        // 未登录，重定向到登录页
        router.push('/auth/login');
      } else {
        setIsChecking(false);
      }
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  // 加载中显示
  if (isChecking && !publicPages.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">验证中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}