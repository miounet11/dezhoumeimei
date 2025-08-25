'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Progress } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EyeTwoTone, EyeInvisibleOutlined } from '@ant-design/icons';
import { Eye, EyeOff } from 'lucide-react';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 12.5;
    if (/[!@#$%^&*]/.test(password)) strength += 12.5;
    return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const strength = calculatePasswordStrength(e.target.value);
    setPasswordStrength(strength);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError('');

    try {
      // 模拟注册
      // 保存用户信息
      localStorage.setItem('token', 'new-user-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify({
        email: values.email,
        username: values.username,
        name: values.username,
        id: Date.now().toString()
      }));

      // 跳转到仪表板
      router.push('/dashboard');
    } catch (err) {
      setError('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return '#ff4d4f';
    if (passwordStrength < 50) return '#faad14';
    if (passwordStrength < 75) return '#52c41a';
    return '#52c41a';
  };

  return (
    <div className="min-h-screen max-w-full">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="w-full max-w-md px-4">
          {/* 页面头部 */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🃏</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">创建账号</h1>
            <p className="text-gray-600 dark:text-gray-400">加入PokerIQ Pro，开启专业训练之旅</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-0 p-8">

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
            </div>
          )}

          <Form
            name="register"
            onFinish={handleSubmit}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { max: 20, message: '用户名最多20个字符' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
              ]}
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400" />} 
                placeholder="用户名"
                autoComplete="username"
                className="h-12 border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<MailOutlined className="text-gray-400" />} 
                placeholder="邮箱地址"
                autoComplete="email"
                className="h-12 border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码至少8个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="密码"
                iconRender={(visible) => (visible ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />)}
                autoComplete="new-password"
                onChange={handlePasswordChange}
                className="h-12 border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </Form.Item>

            {passwordStrength > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">密码强度</div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${passwordStrength}%`,
                      backgroundColor: getPasswordStrengthColor()
                    }}
                  />
                </div>
              </div>
            )}

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="确认密码"
                iconRender={(visible) => (visible ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />)}
                autoComplete="new-password"
                className="h-12 border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('请阅读并同意服务条款')),
                },
              ]}
            >
              <Checkbox>
                我已阅读并同意 
                <Link href="/settings" className="text-purple-600 hover:text-purple-800"> 服务条款</Link> 和 
                <Link href="/settings" className="text-purple-600 hover:text-purple-800"> 隐私政策</Link>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <button
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </Form.Item>

            <div className="text-center">
              <span className="text-gray-600 dark:text-gray-400">已有账号？</span>{' '}
              <Link href="/auth/login" className="text-purple-600 hover:text-purple-800 font-medium">
                立即登录
              </Link>
            </div>
          </Form>

          {/* 快速注册选项 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">或使用以下方式注册</span>
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