'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Badge, Dropdown, Button, Space, Typography } from 'antd';
import {
  HomeOutlined,
  DashboardOutlined,
  TrophyOutlined,
  LineChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  HeartOutlined,
  BookOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  FireOutlined,
  StarOutlined,
  CrownOutlined,
  ShoppingOutlined,
  BellOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 从localStorage获取用户信息
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      }
    }
  }, []);

  // 主导航菜单项
  const mainMenuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '控制台',
      onClick: () => router.push('/dashboard'),
    },
    {
      key: 'game-section',
      icon: <PlayCircleOutlined />,
      label: '游戏中心',
      children: [
        {
          key: '/game',
          icon: <FireOutlined />,
          label: '开始游戏',
          onClick: () => router.push('/game'),
        },
        {
          key: '/battle',
          icon: <RocketOutlined />,
          label: '对战大厅',
          onClick: () => router.push('/battle'),
        },
      ],
    },
    {
      key: 'training-section',
      icon: <BookOutlined />,
      label: 'AI训练',
      children: [
        {
          key: '/skill-test',
          icon: <RocketOutlined />,
          label: '技能测试',
          onClick: () => router.push('/skill-test'),
        },
        {
          key: '/ai-training',
          icon: <TeamOutlined />,
          label: 'AI对手训练',
          onClick: () => router.push('/ai-training'),
        },
        {
          key: '/gto-training',
          icon: <TrophyOutlined />,
          label: 'GTO策略',
          onClick: () => router.push('/gto-training'),
        },
        {
          key: '/study',
          icon: <BookOutlined />,
          label: '学习中心',
          onClick: () => router.push('/study'),
        },
      ],
    },
    {
      key: 'companion-section',
      icon: <HeartOutlined />,
      label: '陪伴系统',
      children: [
        {
          key: '/companion-center',
          icon: <CrownOutlined />,
          label: '陪伴中心',
          onClick: () => router.push('/companion-center'),
        },
      ],
    },
    {
      key: 'stats-section',
      icon: <LineChartOutlined />,
      label: '数据分析',
      children: [
        {
          key: '/analytics',
          icon: <LineChartOutlined />,
          label: '数据概览',
          onClick: () => router.push('/analytics'),
        },
        {
          key: '/advanced-analytics',
          icon: <FireOutlined />,
          label: '高级分析',
          onClick: () => router.push('/advanced-analytics'),
        },
        {
          key: '/achievements',
          icon: <TrophyOutlined />,
          label: '成就系统',
          onClick: () => router.push('/achievements'),
        },
        {
          key: '/journey',
          icon: <StarOutlined />,
          label: '成长之旅',
          onClick: () => router.push('/journey'),
        },
      ],
    },
    {
      key: 'social-section',
      icon: <TeamOutlined />,
      label: '社交中心',
      children: [
        {
          key: '/social',
          icon: <TeamOutlined />,
          label: '好友系统',
          onClick: () => router.push('/social'),
        },
        {
          key: '/events',
          icon: <TrophyOutlined />,
          label: '活动中心',
          onClick: () => router.push('/events'),
        },
      ],
    },
    {
      key: 'user-section',
      icon: <UserOutlined />,
      label: '个人中心',
      children: [
        {
          key: '/profile',
          icon: <UserOutlined />,
          label: '个人资料',
          onClick: () => router.push('/profile'),
        },
        {
          key: '/settings',
          icon: <SettingOutlined />,
          label: '系统设置',
          onClick: () => router.push('/settings'),
        },
        {
          key: '/subscription',
          icon: <CrownOutlined />,
          label: '订阅管理',
          onClick: () => router.push('/subscription'),
        },
      ],
    },
  ];

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => router.push('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => router.push('/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
      },
    },
  ];

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    // 精确匹配
    if (pathname === '/dashboard') return ['/dashboard'];
    if (pathname === '/game') return ['/game'];
    if (pathname === '/battle') return ['/battle'];
    if (pathname === '/ai-training') return ['/ai-training'];
    if (pathname === '/gto-training') return ['/gto-training'];
    if (pathname === '/study') return ['/study'];
    if (pathname === '/companion-center') return ['/companion-center'];
    if (pathname === '/companions') return ['/companions'];
    if (pathname === '/analytics') return ['/analytics'];
    if (pathname === '/achievements') return ['/achievements'];
    if (pathname === '/journey') return ['/journey'];
    if (pathname === '/profile') return ['/profile'];
    if (pathname === '/settings') return ['/settings'];
    
    // 默认选中控制台
    return ['/dashboard'];
  };

  // 获取展开的菜单组
  const getOpenKeys = () => {
    if (pathname.includes('/game') || pathname.includes('/battle')) return ['game-section'];
    if (pathname.includes('/ai-training') || pathname.includes('/gto') || pathname.includes('/study')) return ['training-section'];
    if (pathname.includes('/companion')) return ['companion-section'];
    if (pathname.includes('/analytics') || pathname.includes('/achievements') || pathname.includes('/journey')) return ['stats-section'];
    if (pathname.includes('/profile') || pathname.includes('/settings')) return ['user-section'];
    return [];
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
        {/* Logo区域 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {!collapsed ? (
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>🃏</span>
              <Text strong style={{ color: '#fff', fontSize: 18 }}>
                PokerIQ Pro
              </Text>
            </Link>
          ) : (
            <Link href="/dashboard">
              <span style={{ fontSize: 24 }}>🃏</span>
            </Link>
          )}
        </div>

        {/* 导航菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={mainMenuItems}
          style={{
            background: 'transparent',
            borderRight: 0,
          }}
        />
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
          {/* 左侧面包屑或标题 */}
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 16 }}>
              {pathname === '/dashboard' && '控制台'}
              {pathname === '/game' && '开始游戏'}
              {pathname === '/battle' && '对战大厅'}
              {pathname === '/ai-training' && 'AI对手训练'}
              {pathname === '/gto-training' && 'GTO策略训练'}
              {pathname === '/study' && '学习中心'}
              {pathname === '/companion-center' && '陪伴中心'}
              {pathname === '/companions' && '陪伴列表'}
              {pathname === '/analytics' && '数据分析'}
              {pathname === '/achievements' && '成就系统'}
              {pathname === '/journey' && '成长之旅'}
              {pathname === '/profile' && '个人资料'}
              {pathname === '/settings' && '系统设置'}
            </Text>
          </div>

          {/* 右侧用户信息 */}
          <Space size="large">
            {/* 智慧币显示 */}
            <Space>
              <span>💎</span>
              <Text strong>2,580</Text>
            </Space>

            {/* 通知图标 */}
            <Badge count={3} size="small">
              <Button type="text" icon={<BellOutlined />} />
            </Badge>

            {/* 商城入口 */}
            <Button type="primary" icon={<ShoppingOutlined />}>
              商城
            </Button>

            {/* 用户头像下拉 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="default"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#722ed1' }}
                >
                  {user?.avatar}
                </Avatar>
                <Text>{user?.name || user?.username || 'Loading...'}</Text>
              </Space>
            </Dropdown>
          </Space>
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