'use client';

import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { theme } from '@/lib/theme/theme';
import MainLayout from '@/components/layout/MainLayout';
import { usePathname } from 'next/navigation';
import SimpleAuthWrapper from '@/components/layout/SimpleAuthWrapper';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import '@/lib/utils/suppress-warnings';

// 不需要主布局的页面
const authPages = ['/auth/login', '/auth/register', '/', '/home'];
const standalonePages = ['/simple', '/test', '/debug', '/test-opponents'];

// 使用AppLayout的页面 - 这些页面不需要MainLayout
const appLayoutPages = [
  '/ai-training',
  '/gto-training', 
  '/journey',
  '/study',
  '/skill-test',
  '/companion-center',
  '/analytics',
  '/achievements',
  '/settings',
  '/profile',
  '/game'
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // 判断是否需要主布局
  const isAppLayoutPage = appLayoutPages.some(page => pathname.startsWith(page));
  const needsMainLayout = !authPages.includes(pathname) && 
                          !standalonePages.includes(pathname) && 
                          !isAppLayoutPage;

  return (
    <ErrorBoundary>
      <ConfigProvider 
        theme={theme} 
        locale={zhCN}
        warning={{ 
          strict: false,
        }}
        component={{
          message: {
            maxCount: 1,
          },
        }}
      >
        <AntApp>
          <SimpleAuthWrapper>
            {needsMainLayout ? (
              <MainLayout>{children}</MainLayout>
            ) : (
              children
            )}
          </SimpleAuthWrapper>
        </AntApp>
      </ConfigProvider>
    </ErrorBoundary>
  );
}