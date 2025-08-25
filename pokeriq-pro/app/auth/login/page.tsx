'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Checkbox, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, EyeTwoTone, EyeInvisibleOutlined, Settings, Globe } from '@ant-design/icons';
import { Eye, EyeOff } from 'lucide-react';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError('');

    try {
      // 调用登录API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // 保存登录信息
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // 记住我
        if (values.remember) {
          localStorage.setItem('rememberedEmail', values.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // 跳转到仪表板
        router.push('/dashboard');
      } else {
        setError(data.error || '邮箱或密码错误');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-full">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="w-full max-w-md px-4">
          {/* 页面头部 */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🃏</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">PokerIQ Pro</h1>
            <p className="text-gray-600 dark:text-gray-400">AI德州扑克训练平台</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-0 p-8">

          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              closable 
              onClose={() => setError('')}
              className="mb-4"
            />
          )}

          <Form
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            layout="vertical"
            size="large"
            initialValues={{ 
              remember: true,
              email: 'test1@gmail.com',
              password: '1234567890'
            }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400" />} 
                placeholder="邮箱地址"
                autoComplete="email"
                className="h-12 border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="密码"
                iconRender={(visible) => (visible ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />)}
                autoComplete="current-password"
                className="h-12 border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </Form.Item>

            <Form.Item>
              <div className="flex justify-between items-center">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                <Link href="/settings" className="text-blue-600 hover:text-blue-800">
                  忘记密码？
                </Link>
              </div>
            </Form.Item>

            <Form.Item>
              <button
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </Form.Item>

            <div className="text-center">
              <span className="text-gray-600 dark:text-gray-400">还没有账号？</span>{' '}
              <Link href="/auth/register" className="text-purple-600 hover:text-purple-800 font-medium">
                立即注册
              </Link>
            </div>
          </Form>

          {/* 测试账号提示 */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">测试账号</div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <div>test1@gmail.com - test5@gmail.com</div>
                <div>密码: 1234567890</div>
                <div className="text-xs mt-1">包含不同等级和AI伴侣数据</div>
              </div>
            </div>
          </div>

          {/* 快速登录选项 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">或使用以下方式登录</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <button className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors opacity-50 cursor-not-allowed">
                <span className="text-xl">📱</span>
              </button>
              <button className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors opacity-50 cursor-not-allowed">
                <span className="text-xl">🔑</span>
              </button>
              <button className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors opacity-50 cursor-not-allowed">
                <span className="text-xl">👤</span>
              </button>
            </div>
          </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="text-center mt-6">
          <span className="text-gray-600 dark:text-gray-400">© 2024 PokerIQ Pro. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}