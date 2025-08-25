'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Switch, Select, Button, Radio, Slider, Typography, Divider, Space, Alert, Avatar, Upload, message } from 'antd';
import {
  UserOutlined,
  BellOutlined,
  LockOutlined,
  PlayCircleOutlined,
  DollarOutlined,
  SettingOutlined,
  CameraOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { Settings, Globe } from 'lucide-react';
import AppLayout from '@/src/components/layout/AppLayout';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
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

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      localStorage.setItem('userSettings', JSON.stringify(values));
      message.success('设置已保存');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          个人资料
        </span>
      ),
      children: (
        <Card>
          <Form
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              username: user?.username || '',
              email: user?.email || '',
              bio: '热爱德州扑克的玩家',
              location: '中国',
              language: 'zh-CN'
            }}
          >
            <div className="flex items-center mb-6">
              <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#722ed1' }} />
              <Upload showUploadList={false}>
                <Button icon={<CameraOutlined />} className="ml-4">
                  更换头像
                </Button>
              </Upload>
            </div>

            <Form.Item label="用户名" name="username">
              <Input placeholder="输入用户名" />
            </Form.Item>

            <Form.Item label="邮箱" name="email">
              <Input type="email" placeholder="输入邮箱" disabled />
            </Form.Item>

            <Form.Item label="个人简介" name="bio">
              <Input.TextArea rows={3} placeholder="介绍一下自己" />
            </Form.Item>

            <Form.Item label="所在地" name="location">
              <Select>
                <Option value="中国">中国</Option>
                <Option value="美国">美国</Option>
                <Option value="日本">日本</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>

            <Form.Item label="语言" name="language">
              <Select>
                <Option value="zh-CN">简体中文</Option>
                <Option value="zh-TW">繁体中文</Option>
                <Option value="en">English</Option>
                <Option value="ja">日本語</Option>
              </Select>
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存更改
            </Button>
          </Form>
        </Card>
      )
    },
    {
      key: 'game',
      label: (
        <span>
          <PlayCircleOutlined />
          游戏设置
        </span>
      ),
      children: (
        <Card>
          <Form layout="vertical" onFinish={handleSave}>
            <Title level={5}>显示设置</Title>
            
            <Form.Item label="牌面样式" name="cardStyle">
              <Radio.Group defaultValue="classic">
                <Radio value="classic">经典</Radio>
                <Radio value="modern">现代</Radio>
                <Radio value="minimal">极简</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="牌桌主题" name="tableTheme">
              <Select defaultValue="green">
                <Option value="green">经典绿</Option>
                <Option value="blue">深海蓝</Option>
                <Option value="red">热情红</Option>
                <Option value="purple">高贵紫</Option>
              </Select>
            </Form.Item>

            <Divider />
            <Title level={5}>游戏选项</Title>

            <Form.Item name="autoMuck" valuePropName="checked">
              <Space>
                <Switch defaultChecked />
                <Text>自动弃牌（输牌时）</Text>
              </Space>
            </Form.Item>

            <Form.Item name="fourColorDeck" valuePropName="checked">
              <Space>
                <Switch />
                <Text>四色牌面</Text>
              </Space>
            </Form.Item>

            <Form.Item name="showFoldPercentage" valuePropName="checked">
              <Space>
                <Switch defaultChecked />
                <Text>显示弃牌率</Text>
              </Space>
            </Form.Item>

            <Form.Item label="动画速度" name="animationSpeed">
              <Slider
                marks={{
                  0: '慢',
                  50: '正常',
                  100: '快'
                }}
                defaultValue={50}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存设置
            </Button>
          </Form>
        </Card>
      )
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined />
          通知设置
        </span>
      ),
      children: (
        <Card>
          <Form layout="vertical" onFinish={handleSave}>
            <Title level={5}>游戏通知</Title>
            
            <Form.Item name="gameStartNotification" valuePropName="checked">
              <Space>
                <Switch defaultChecked />
                <Text>游戏开始提醒</Text>
              </Space>
            </Form.Item>

            <Form.Item name="turnNotification" valuePropName="checked">
              <Space>
                <Switch defaultChecked />
                <Text>轮到你时提醒</Text>
              </Space>
            </Form.Item>

            <Form.Item name="achievementNotification" valuePropName="checked">
              <Space>
                <Switch defaultChecked />
                <Text>成就解锁通知</Text>
              </Space>
            </Form.Item>

            <Divider />
            <Title level={5}>社交通知</Title>

            <Form.Item name="friendRequestNotification" valuePropName="checked">
              <Space>
                <Switch defaultChecked />
                <Text>好友请求</Text>
              </Space>
            </Form.Item>

            <Form.Item name="messageNotification" valuePropName="checked">
              <Space>
                <Switch />
                <Text>私信消息</Text>
              </Space>
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存设置
            </Button>
          </Form>
        </Card>
      )
    },
    {
      key: 'privacy',
      label: (
        <span>
          <LockOutlined />
          隐私与安全
        </span>
      ),
      children: (
        <Card>
          <Form layout="vertical" onFinish={handleSave}>
            <Title level={5}>账户安全</Title>
            
            <Form.Item label="当前密码" name="currentPassword">
              <Input.Password placeholder="输入当前密码" />
            </Form.Item>

            <Form.Item label="新密码" name="newPassword">
              <Input.Password placeholder="输入新密码" />
            </Form.Item>

            <Form.Item label="确认新密码" name="confirmPassword">
              <Input.Password placeholder="再次输入新密码" />
            </Form.Item>

            <Divider />
            <Title level={5}>隐私设置</Title>

            <Form.Item name="profileVisibility">
              <Radio.Group defaultValue="public">
                <Space direction="vertical">
                  <Radio value="public">公开资料（所有人可见）</Radio>
                  <Radio value="friends">仅好友可见</Radio>
                  <Radio value="private">完全私密</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item name="showOnlineStatus" valuePropName="checked">
              <Space>
                <Switch defaultChecked />
                <Text>显示在线状态</Text>
              </Space>
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存设置
            </Button>
          </Form>
        </Card>
      )
    },
    {
      key: 'billing',
      label: (
        <span>
          <DollarOutlined />
          账单与订阅
        </span>
      ),
      children: (
        <Card>
          <Title level={5}>当前订阅</Title>
          
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-lg text-white mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold mb-2">免费版</h3>
                <p>基础功能，适合新手玩家</p>
              </div>
              <Button type="primary" ghost>
                升级到专业版
              </Button>
            </div>
          </div>

          <Title level={5}>订阅选项</Title>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="text-center">
              <h4 className="text-lg font-bold mb-2">免费版</h4>
              <div className="text-2xl font-bold mb-4">¥0/月</div>
              <ul className="text-left text-sm space-y-2">
                <li>✓ 基础AI训练</li>
                <li>✓ 数据分析</li>
                <li>✓ 成就系统</li>
              </ul>
            </Card>
            
            <Card className="text-center border-2 border-purple-500">
              <h4 className="text-lg font-bold mb-2">专业版</h4>
              <div className="text-2xl font-bold mb-4 text-purple-600">¥99/月</div>
              <ul className="text-left text-sm space-y-2">
                <li>✓ 高级AI对手</li>
                <li>✓ GTO策略分析</li>
                <li>✓ 无限训练</li>
                <li>✓ 专属陪伴</li>
              </ul>
              <Button type="primary" className="mt-4" block>
                选择此方案
              </Button>
            </Card>
            
            <Card className="text-center">
              <h4 className="text-lg font-bold mb-2">大师版</h4>
              <div className="text-2xl font-bold mb-4">¥299/月</div>
              <ul className="text-left text-sm space-y-2">
                <li>✓ 所有专业版功能</li>
                <li>✓ 1对1指导</li>
                <li>✓ 定制训练计划</li>
                <li>✓ API访问</li>
              </ul>
            </Card>
          </div>
        </Card>
      )
    }
  ];

  return (
    <AppLayout>
      <div className="min-h-screen max-w-full">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                系统设置
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                管理您的账户和偏好设置
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Globe className="w-5 h-5" />
                <span className="font-medium">中文</span>
              </button>
              
              <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </div>
    </AppLayout>
  );
}