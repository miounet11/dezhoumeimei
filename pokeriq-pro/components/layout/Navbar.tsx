'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Switch, Typography, Space } from 'antd';
import { 
  UserOutlined, 
  BellOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';

const { Header } = Layout;
const { Text } = Typography;

interface NavbarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Navbar({ collapsed, onToggle }: NavbarProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const router = useRouter();

  useEffect(() => {
    // 检查系统主题偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    // 应用主题
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link href="/settings">个人资料</Link>
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link href="/settings">设置</Link>
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  const notificationMenuItems: MenuProps['items'] = [
    {
      key: 'notification1',
      label: (
        <div className="py-2">
          <div className="font-medium">训练提醒</div>
          <div className="text-sm text-gray-500">您有一个新的训练场景可以体验</div>
          <div className="text-xs text-gray-400">2分钟前</div>
        </div>
      )
    },
    {
      key: 'notification2',
      label: (
        <div className="py-2">
          <div className="font-medium">成就解锁</div>
          <div className="text-sm text-gray-500">恭喜您解锁了"连胜达人"成就</div>
          <div className="text-xs text-gray-400">1小时前</div>
        </div>
      )
    },
    {
      key: 'notification3',
      label: (
        <div className="py-2">
          <div className="font-medium">周报生成</div>
          <div className="text-sm text-gray-500">您的本周训练报告已生成</div>
          <div className="text-xs text-gray-400">3小时前</div>
        </div>
      )
    },
    {
      type: 'divider'
    },
    {
      key: 'viewAll',
      label: (
        <div className="text-center text-blue-600">
          查看全部通知
        </div>
      )
    }
  ];

  return (
    <Header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between h-16">
      {/* 左侧：Logo和折叠按钮 */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {collapsed ? (
            <MenuUnfoldOutlined className="text-gray-600 dark:text-gray-300" />
          ) : (
            <MenuFoldOutlined className="text-gray-600 dark:text-gray-300" />
          )}
        </button>

        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🃏</span>
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-lg text-gray-800 dark:text-white">
                PokerIQ Pro
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* 右侧：主题切换、通知、用户菜单 */}
      <div className="flex items-center space-x-4">
        {/* 主题切换 */}
        <div className="flex items-center space-x-2">
          <SunOutlined className="text-yellow-500" />
          <Switch
            size="small"
            checked={darkMode}
            onChange={setDarkMode}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
          />
          <MoonOutlined className="text-blue-500" />
        </div>

        {/* 通知 */}
        <Dropdown
          menu={{ items: notificationMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Badge count={notifications} size="small">
              <BellOutlined className="text-lg text-gray-600 dark:text-gray-300" />
            </Badge>
          </button>
        </Dropdown>

        {/* 用户菜单 */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Avatar
              size="small"
              icon={<UserOutlined />}
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            />
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-800 dark:text-white">
                PokerPro123
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                等级 15
              </div>
            </div>
          </button>
        </Dropdown>
      </div>
    </Header>
  );
}