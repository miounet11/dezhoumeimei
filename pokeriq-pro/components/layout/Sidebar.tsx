'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Progress, Typography, Badge } from 'antd';
import { 
  DashboardOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  TrophyOutlined,
  SettingOutlined,
  UserOutlined,
  BookOutlined,
  FireOutlined,
  StarOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MenuProps } from 'antd';

const { Sider } = Layout;
const { Text } = Typography;

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [selectedKey, setSelectedKey] = useState('dashboard');

  // 模拟用户数据
  const userStats = {
    level: 15,
    experience: 7850,
    nextLevelExp: 10000,
    todayStreak: 5,
    newAchievements: 2
  };

  useEffect(() => {
    // 根据当前路径设置选中的菜单项
    const pathKey = pathname.split('/')[1] || 'dashboard';
    setSelectedKey(pathKey);
  }, [pathname]);

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">仪表板</Link>
    },
    {
      key: 'training',
      icon: <PlayCircleOutlined />,
      label: <Link href="/ai-training">AI训练</Link>,
      children: [
        {
          key: 'training-scenarios',
          label: <Link href="/ai-training">训练场景</Link>
        },
        {
          key: 'training-history',
          label: <Link href="/ai-training/history">训练历史</Link>
        },
        {
          key: 'training-custom',
          label: <Link href="/ai-training/custom">自定义训练</Link>
        }
      ]
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: <Link href="/analytics">数据分析</Link>,
      children: [
        {
          key: 'analytics-overview',
          label: <Link href="/analytics">总览</Link>
        },
        {
          key: 'analytics-sessions',
          label: <Link href="/analytics/sessions">会话分析</Link>
        },
        {
          key: 'analytics-hands',
          label: <Link href="/analytics/hands">手牌分析</Link>
        }
      ]
    },
    {
      key: 'achievements',
      icon: (
        <Badge count={userStats.newAchievements} size="small">
          <TrophyOutlined />
        </Badge>
      ),
      label: <Link href="/achievements">成就系统</Link>
    },
    {
      type: 'divider'
    },
    {
      key: 'learn',
      icon: <BookOutlined />,
      label: '学习中心',
      children: [
        {
          key: 'learn-basics',
          label: <Link href="/study">基础知识</Link>
        },
        {
          key: 'learn-strategies',
          label: <Link href="/gto-training">高级策略</Link>
        },
        {
          key: 'learn-psychology',
          label: <Link href="/study">心理学</Link>
        }
      ]
    },
    {
      key: 'community',
      icon: <UserOutlined />,
      label: '社区',
      children: [
        {
          key: 'community-leaderboard',
          label: <Link href="/analytics">排行榜</Link>
        },
        {
          key: 'community-forums',
          label: <Link href="/social">论坛</Link>
        },
        {
          key: 'community-friends',
          label: <Link href="/social">好友</Link>
        }
      ]
    },
    {
      type: 'divider'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link href="/settings">设置</Link>
    }
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={280}
      collapsedWidth={80}
      className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100
      }}
    >
      <div className="h-full flex flex-col">
        {/* 顶部间距 */}
        <div className="h-16" />

        {/* 用户信息卡片 */}
        {!collapsed && (
          <div className="mx-4 mb-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-xl">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Text className="text-white font-bold text-lg">
                  {userStats.level}
                </Text>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  等级 {userStats.level}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  德州扑克高手
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                <span>经验值</span>
                <span>{userStats.experience}/{userStats.nextLevelExp}</span>
              </div>
              <Progress
                percent={(userStats.experience / userStats.nextLevelExp) * 100}
                size="small"
                strokeColor={{ from: '#108ee9', to: '#87d068' }}
                showInfo={false}
              />
            </div>

            {userStats.todayStreak > 0 && (
              <div className="flex items-center justify-center mt-3 p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <FireOutlined className="text-orange-500 mr-1" />
                <Text className="text-xs text-orange-700 dark:text-orange-300">
                  今日连胜 {userStats.todayStreak} 场
                </Text>
              </div>
            )}
          </div>
        )}

        {/* 主菜单 */}
        <div className="flex-1 overflow-y-auto">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={['training', 'analytics', 'learn', 'community']}
            items={menuItems}
            className="border-none bg-transparent"
            style={{
              fontSize: '14px'
            }}
          />
        </div>

        {/* 底部快捷信息 */}
        {!collapsed && (
          <div className="mx-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-xs text-gray-600 dark:text-gray-300">
                今日训练目标
              </Text>
              <Text className="text-xs text-green-600 dark:text-green-400">
                已完成 3/5
              </Text>
            </div>
            <Progress
              percent={60}
              size="small"
              strokeColor="#52c41a"
              showInfo={false}
            />
            
            <div className="mt-3 flex justify-between items-center">
              <div className="flex items-center space-x-1">
                <StarOutlined className="text-yellow-500 text-xs" />
                <Text className="text-xs text-gray-600 dark:text-gray-300">
                  今日得分
                </Text>
              </div>
              <Text className="text-xs font-medium text-gray-800 dark:text-white">
                1,250
              </Text>
            </div>
          </div>
        )}

        {/* 折叠状态下的用户信息 */}
        {collapsed && (
          <div className="mx-2 mb-4 flex flex-col items-center space-y-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Text className="text-white font-bold text-sm">
                {userStats.level}
              </Text>
            </div>
            
            {userStats.todayStreak > 0 && (
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <FireOutlined className="text-orange-500 text-xs" />
              </div>
            )}
            
            {userStats.newAchievements > 0 && (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {userStats.newAchievements}
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
    </Sider>
  );
}