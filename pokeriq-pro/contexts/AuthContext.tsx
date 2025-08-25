'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar: string;
  bio: string;
  level: number;
  experience: number;
  isVip: boolean;
  vipExpiry?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  joinDate: string;
  lastLogin: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  phone?: string;
  password: string;
  captcha: string;
  agreeMarketing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 首先检查本地存储
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (storedUser && token) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // 验证token是否有效
        try {
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Token invalid');
          }
          
          const result = await response.json();
          if (result.user) {
            setUser(result.user);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Token无效，清除本地数据
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    // 清除记住的邮箱
    localStorage.removeItem('rememberedEmail');
  };

  const login = async (email: string, password: string, rememberMe = false): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = data.user;
        const token = data.token;
        
        setUser(userData);
        
        // 根据"记住我"选择存储位置
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(userData));
        storage.setItem('token', token);
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        }
        
        return { success: true };
      } else {
        return { success: false, error: data.error || '登录失败' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '网络错误，请稍后重试' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const userData = result.user;
        const token = result.token;
        
        setUser(userData);
        
        // 注册后默认使用sessionStorage
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('token', token);
        
        return { success: true };
      } else {
        return { success: false, error: result.error || '注册失败' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: '网络错误，请稍后重试' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // 调用服务器端登出API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
    } catch (error) {
      console.error('Logout API error:', error);
      // 即使API调用失败，也要清除本地数据
    } finally {
      clearAuthData();
      setLoading(false);
      router.push('/auth/login');
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const updatedUser = { ...user, ...result.user };
        setUser(updatedUser as User);
        
        // 更新本地存储
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(updatedUser));
        
        return { success: true };
      } else {
        return { success: false, error: result.error || '更新失败' };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: '网络错误，请稍后重试' };
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.user) {
          setUser(result.user);
          
          // 更新本地存储
          const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
          storage.setItem('user', JSON.stringify(result.user));
        }
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};