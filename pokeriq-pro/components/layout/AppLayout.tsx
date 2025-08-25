'use client';

import { useState, useEffect } from 'react';
import { Layout } from 'antd';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 检查屏幕尺寸，自动折叠侧边栏
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  if (!mounted) {
    return null; // 避免服务端渲染和客户端渲染不匹配
  }

  return (
    <Layout className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar collapsed={collapsed} />
      
      <Layout style={{ marginLeft: collapsed ? 80 : 280, transition: 'margin-left 0.2s' }}>
        <Navbar collapsed={collapsed} onToggle={toggleCollapsed} />
        
        <Content className="bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
          <div className="h-full">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}