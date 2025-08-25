'use client';

import React, { useState } from 'react';
import { Layout, Typography } from 'antd';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import NavigationMenu from './NavigationMenu';
import UserHeaderActions from './UserHeaderActions';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

interface OptimizedMainLayoutProps {
  children: React.ReactNode;
}

export default function OptimizedMainLayout({ children }: OptimizedMainLayoutProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // 页面标题映射 - 可以是服务端组件
  const getPageTitle = () => {
    const titleMap: Record<string, string> = {
      '/dashboard': '控制台',
      '/game': '开始游戏',
      '/battle': '对战大厅',
      '/ai-training': 'AI对手训练',
      '/gto-training': 'GTO策略训练',
      '/study': '学习中心',
      '/companion-center': '陪伴中心',
      '/companions': '陪伴列表',
      '/analytics': '数据分析',
      '/advanced-analytics': '高级分析',
      '/achievements': '成就系统',
      '/journey': '成长之旅',
      '/profile': '个人资料',
      '/settings': '系统设置',
      '/skill-test': '技能测试',
      '/social': '好友系统',
      '/events': '活动中心',
      '/subscription': '订阅管理',
    };
    
    return titleMap[pathname] || '控制台';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Logo区域 - Server Component */}
        <Logo collapsed={collapsed} />

        {/* 导航菜单 - Client Component */}
        <NavigationMenu />
      </Sider>

      <Layout>
        {/* 顶部导航栏 */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* 左侧标题 - 可以是Server Component */}
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 16 }}>
              {getPageTitle()}
            </Text>
          </div>

          {/* 右侧用户操作 - Client Component */}
          <UserHeaderActions />
        </Header>

        {/* 主内容区域 */}
        <Content
          style={{
            margin: 24,
            minHeight: 280,
            background: '#f0f2f5',
            borderRadius: 8,
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}