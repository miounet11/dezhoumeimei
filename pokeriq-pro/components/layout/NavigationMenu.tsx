'use client';

import { Menu } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  TrophyOutlined,
  LineChartOutlined,
  SettingOutlined,
  UserOutlined,
  HeartOutlined,
  BookOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  FireOutlined,
  StarOutlined,
  CrownOutlined,
} from '@ant-design/icons';

// Client Component - 导航菜单需要交互功能
export default function NavigationMenu() {
  const router = useRouter();
  const pathname = usePathname();

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
    if (pathname.includes('/ai-training') || pathname.includes('/gto') || pathname.includes('/study') || pathname.includes('/skill-test')) return ['training-section'];
    if (pathname.includes('/companion')) return ['companion-section'];
    if (pathname.includes('/analytics') || pathname.includes('/achievements') || pathname.includes('/journey') || pathname.includes('/advanced-analytics')) return ['stats-section'];
    if (pathname.includes('/profile') || pathname.includes('/settings') || pathname.includes('/subscription')) return ['user-section'];
    if (pathname.includes('/social') || pathname.includes('/events')) return ['social-section'];
    return [];
  };

  return (
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
  );
}