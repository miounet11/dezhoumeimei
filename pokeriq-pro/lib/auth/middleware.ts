import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResult {
  authenticated: boolean;
  user?: AuthUser;
  error?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // 从cookie获取access token
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return {
        authenticated: false,
        error: '未提供认证令牌'
      };
    }

    // 验证JWT token
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
    ) as any;

    // 检查token是否过期
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return {
        authenticated: false,
        error: '认证令牌已过期'
      };
    }

    // 返回认证成功结果
    return {
      authenticated: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    };
  } catch (error) {
    console.error('认证验证失败:', error);
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : '认证验证失败'
    };
  }
}

// 辅助函数：从请求头获取Bearer token
export function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// 辅助函数：验证API密钥
export async function verifyApiKey(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return false;
  }
  
  // 这里可以添加API密钥验证逻辑
  // 比如从数据库查询或验证固定的密钥
  return apiKey === process.env.API_KEY;
}