/**
 * 统一认证系统
 * 使用 NextAuth 作为唯一的认证方案
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth');

// 扩展 NextAuth 的类型定义
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      username?: string;
      level: number;
      xp: number;
      role: string;
      avatar?: string;
      isVip: boolean;
      vipExpiry?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    username?: string;
    level: number;
    xp: number;
    role: string;
    avatar?: string;
    isVip: boolean;
    vipExpiry?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name?: string;
    username?: string;
    level: number;
    xp: number;
    role: string;
    avatar?: string;
    isVip: boolean;
    vipExpiry?: string;
  }
}

// 验证JWT密钥
const jwtSecret = process.env.NEXTAUTH_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('NEXTAUTH_SECRET must be defined and at least 32 characters long');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            logger.warn('Login attempt with missing credentials');
            throw new Error('Invalid credentials');
          }

          // 查找用户
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              stats: true,
              wisdomCoin: true
            }
          });

          if (!user || !user.password) {
            logger.warn({ email: credentials.email }, 'User not found');
            throw new Error('User not found');
          }

          // 验证密码
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            logger.warn({ userId: user.id }, 'Invalid password attempt');
            throw new Error('Invalid password');
          }

          // 更新最后登录时间
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              lastLoginAt: new Date(),
              loginCount: { increment: 1 }
            }
          });

          logger.info({ userId: user.id }, 'User logged in successfully');

          // 返回用户信息
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            level: user.level,
            xp: user.xp,
            role: user.role,
            avatar: user.avatar,
            isVip: user.isVip,
            vipExpiry: user.vipExpiry?.toISOString()
          };
        } catch (error) {
          logger.error({ error }, 'Authorization error');
          return null;
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.username = token.username;
        session.user.level = token.level;
        session.user.xp = token.xp;
        session.user.role = token.role;
        session.user.avatar = token.avatar;
        session.user.isVip = token.isVip;
        session.user.vipExpiry = token.vipExpiry;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      // 初次登录时，将用户信息存入token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.username = user.username;
        token.level = user.level;
        token.xp = user.xp;
        token.role = user.role;
        token.avatar = user.avatar;
        token.isVip = user.isVip;
        token.vipExpiry = user.vipExpiry;
      }

      // 处理session更新
      if (trigger === 'update' && session) {
        // 更新token中的用户信息
        return { ...token, ...session.user };
      }

      return token;
    },
    async signIn({ user, account, profile }) {
      // 可以在这里添加额外的登录验证逻辑
      // 例如：检查用户是否被封禁
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id }
        });

        if (dbUser?.isBanned) {
          logger.warn({ userId: user.id }, 'Banned user attempted to login');
          return false;
        }

        return true;
      } catch (error) {
        logger.error({ error }, 'Sign in callback error');
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // 安全的重定向处理
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
    updateAge: 24 * 60 * 60, // 24小时
  },
  jwt: {
    secret: jwtSecret,
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/auth/welcome'
  },
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      logger.info({ 
        userId: user?.id, 
        isNewUser 
      }, 'User sign in event');
    },
    async signOut({ session, token }) {
      logger.info({ 
        userId: token?.sub 
      }, 'User sign out event');
    },
    async createUser({ user }) {
      logger.info({ 
        userId: user.id 
      }, 'New user created');
    },
    async updateUser({ user }) {
      logger.info({ 
        userId: user.id 
      }, 'User updated');
    },
    async session({ session, token }) {
      // 可以在这里记录session访问
    }
  }
};

// 辅助函数：检查用户权限
export async function checkUserPermission(
  userId: string, 
  permission: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return false;

    // 这里可以实现更复杂的权限逻辑
    // 例如基于角色的权限系统
    if (user.role === 'ADMIN') return true;
    
    // 检查特定权限
    // ... 权限检查逻辑

    return false;
  } catch (error) {
    logger.error({ error, userId, permission }, 'Permission check error');
    return false;
  }
}

// 辅助函数：获取当前用户
export async function getCurrentUser(sessionToken?: string) {
  try {
    if (!sessionToken) return null;
    
    // 从session获取用户信息
    // 这里需要根据NextAuth的实现来处理
    
    return null;
  } catch (error) {
    logger.error({ error }, 'Get current user error');
    return null;
  }
}