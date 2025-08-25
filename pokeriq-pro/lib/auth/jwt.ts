import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'development-secret-key-please-change-in-production-minimum-32-chars';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

// 运行时验证函数
function validateJWTSecret() {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be defined and at least 32 characters long');
  }
}

// Token类型定义
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// 生成访问令牌
export function generateAccessToken(payload: TokenPayload): string {
  validateJWTSecret();
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'pokeriq-pro',
    audience: 'pokeriq-pro-users'
  });
}

// 生成刷新令牌
export function generateRefreshToken(userId: string): string {
  validateJWTSecret();
  return jwt.sign(
    { userId, type: 'refresh' }, 
    JWT_SECRET, 
    { 
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'pokeriq-pro'
    }
  );
}

// 验证令牌
export function verifyToken(token: string): TokenPayload | null {
  try {
    validateJWTSecret();
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'pokeriq-pro',
      audience: 'pokeriq-pro-users'
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// 密码哈希 - 使用更强的加密轮数
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}

// 密码验证
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 设置认证Cookie
export async function setAuthCookies(tokens: AuthTokens) {
  const cookieStore = await cookies();
  
  // 设置HttpOnly cookie存储refresh token（更安全）
  cookieStore.set('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30天
    path: '/'
  });
  
  // 设置access token（可以存储在内存中或sessionStorage）
  cookieStore.set('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7天
    path: '/'
  });
}

// 清除认证Cookie
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

// 从Cookie获取当前用户
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  if (!accessToken) {
    return null;
  }
  
  return verifyToken(accessToken);
}

// 刷新访问令牌
export async function refreshAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
    
    // 这里应该从数据库获取用户信息
    // 暂时使用模拟数据
    const userPayload: TokenPayload = {
      userId: decoded.userId,
      email: 'demo@example.com',
      role: 'user'
    };
    
    const newAccessToken = generateAccessToken(userPayload);
    
    // 更新access token cookie
    cookieStore.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });
    
    return newAccessToken;
  } catch (error) {
    console.error('Refresh token failed:', error);
    return null;
  }
}