import { api } from './client';
import { ApiResponse, User } from '@/types';

// 认证相关API接口
export const authAPI = {
  // 登录
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    // 在实际项目中，这里会调用真实的API
    // 现在返回模拟数据用于开发
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email === 'demo@example.com' && password === 'demo123') {
          resolve({
            success: true,
            data: {
              user: {
                id: '1',
                username: 'PokerPro123',
                email: 'demo@example.com',
                level: 15,
                experience: 7850,
                totalGamesPlayed: 156,
                winRate: 68.2,
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-07T00:00:00.000Z'
              },
              token: 'mock_jwt_token_123456789'
            },
            message: '登录成功'
          });
        } else {
          resolve({
            success: false,
            data: null,
            error: '邮箱或密码错误'
          });
        }
      }, 1000);
    });

    // 真实API调用（注释掉的代码）
    // return api.post<{ user: User; token: string }>('/auth/login', {
    //   email,
    //   password
    // });
  },

  // 注册
  async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    // 模拟注册
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            user: {
              id: '2',
              username: userData.username,
              email: userData.email,
              level: 1,
              experience: 0,
              totalGamesPlayed: 0,
              winRate: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            token: 'mock_jwt_token_new_user'
          },
          message: '注册成功'
        });
      }, 1500);
    });

    // return api.post<{ user: User; token: string }>('/auth/register', userData);
  },

  // 登出
  async logout(): Promise<ApiResponse<null>> {
    // 模拟登出
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: null,
          message: '登出成功'
        });
      }, 500);
    });

    // return api.post<null>('/auth/logout');
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<ApiResponse<User>> {
    // 模拟获取用户信息
    return new Promise((resolve) => {
      const token = localStorage.getItem('token');
      if (!token) {
        resolve({
          success: false,
          data: null,
          error: '未找到认证token'
        });
        return;
      }

      setTimeout(() => {
        resolve({
          success: true,
          data: {
            id: '1',
            username: 'PokerPro123',
            email: 'demo@example.com',
            level: 15,
            experience: 7850,
            totalGamesPlayed: 156,
            winRate: 68.2,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-07T00:00:00.000Z'
          },
          message: '获取用户信息成功'
        });
      }, 800);
    });

    // return api.get<User>('/auth/me');
  },

  // 刷新token
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return api.post<{ token: string }>('/auth/refresh');
  },

  // 忘记密码
  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/forgot-password', { email });
  },

  // 重置密码
  async resetPassword(token: string, password: string): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/reset-password', { token, password });
  },

  // 更改密码
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/change-password', {
      currentPassword,
      newPassword
    });
  },

  // 更新用户资料
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    // 模拟更新资料
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            id: '1',
            username: userData.username || 'PokerPro123',
            email: userData.email || 'demo@example.com',
            level: 15,
            experience: 7850,
            totalGamesPlayed: 156,
            winRate: 68.2,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: new Date().toISOString()
          },
          message: '资料更新成功'
        });
      }, 1000);
    });

    // return api.put<User>('/auth/profile', userData);
  },

  // 验证邮箱
  async verifyEmail(token: string): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/verify-email', { token });
  },

  // 重发验证邮件
  async resendVerificationEmail(): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/resend-verification');
  },

  // 检查用户名是否可用
  async checkUsernameAvailability(username: string): Promise<ApiResponse<{ available: boolean }>> {
    return api.get<{ available: boolean }>(`/auth/check-username?username=${username}`);
  },

  // 检查邮箱是否可用
  async checkEmailAvailability(email: string): Promise<ApiResponse<{ available: boolean }>> {
    return api.get<{ available: boolean }>(`/auth/check-email?email=${email}`);
  },

  // 启用两步验证
  async enableTwoFactorAuth(): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
    return api.post<{ qrCode: string; secret: string }>('/auth/2fa/enable');
  },

  // 确认两步验证
  async confirmTwoFactorAuth(token: string): Promise<ApiResponse<{ backupCodes: string[] }>> {
    return api.post<{ backupCodes: string[] }>('/auth/2fa/confirm', { token });
  },

  // 禁用两步验证
  async disableTwoFactorAuth(token: string): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/2fa/disable', { token });
  },

  // 删除账户
  async deleteAccount(password: string): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/delete-account', { password });
  }
};