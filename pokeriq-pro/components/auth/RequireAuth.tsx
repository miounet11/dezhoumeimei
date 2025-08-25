'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
      }
    };

    // 立即检查
    checkAuth();

    // 监听storage变化
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [router]);

  return <>{children}</>;
}