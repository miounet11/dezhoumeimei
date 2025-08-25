'use client';

import { useState, useEffect } from 'react';
import { Space, Avatar, Badge, Dropdown, Button, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  ShoppingOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// Client Component - 包含用户交互的部分
export default function UserHeaderActions() {
  const router = useRouter();
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

  return (
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
  );
}