import { NextRequest, NextResponse } from 'next/server';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyPassword
} from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: '请提供邮箱和密码' },
        { status: 400 }
      );
    }
    
    // 演示账号处理
    if (email === 'demo@example.com' && password === 'demo123') {
      // 直接使用演示数据
      const demoUser = {
        id: 'demo-user-id',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'USER',
        avatar: '🎮',
        level: 15,
        xp: 3420,
        stats: {
          totalHands: 1234,
          winRate: 68.5,
          totalEarnings: 45280
        }
      };
      
      // 生成JWT tokens
      const accessToken = generateAccessToken({
        userId: demoUser.id,
        email: demoUser.email,
        role: demoUser.role.toLowerCase()
      });
      
      const refreshToken = generateRefreshToken(demoUser.id);
      
      // 设置cookies
      const response = NextResponse.json({
        success: true,
        user: {
          id: demoUser.id,
          username: demoUser.name,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role.toLowerCase(),
          avatar: demoUser.avatar,
          level: demoUser.level,
          xp: demoUser.xp,
          rank: '中尉',
          stats: demoUser.stats
        },
        token: accessToken,
        message: '登录成功'
      });
      
      // 设置HttpOnly cookies
      response.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7天
        path: '/'
      });
      
      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30天
        path: '/'
      });
      
      return response;
    }
    
    // 数据库用户验证（保留原有逻辑）
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          stats: true
        }
      });
    } catch (error) {
      console.error('Database query failed:', error);
      // 如果数据库连接失败，也返回错误
      return NextResponse.json(
        { error: '系统暂时不可用，请稍后重试' },
        { status: 500 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      );
    }
    
    // 验证密码 - 支持测试账号的明文密码
    let isValidPassword = false;
    
    // 首先尝试明文密码比较（用于测试账号）
    if (user.password === password) {
      isValidPassword = true;
    } else {
      // 然后尝试bcrypt验证（用于生产账号）
      try {
        isValidPassword = await verifyPassword(password, user.password);
      } catch (error) {
        console.error('Password verification error:', error);
        isValidPassword = false;
      }
    }
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }
    
    // 生成JWT tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.toLowerCase()
    });
    
    const refreshToken = generateRefreshToken(user.id);
    
    // 更新最后活动时间
    if (user.stats) {
      await prisma.userStats.update({
        where: { userId: user.id },
        data: { lastActiveAt: new Date() }
      });
    }
    
    // 设置cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.name || user.email.split('@')[0],
        email: user.email,
        name: user.name || '未命名用户',
        role: user.role.toLowerCase(),
        avatar: user.avatar || '🎮',
        level: user.level,
        xp: user.xp,
        rank: '新手',
        stats: user.stats ? {
          totalHands: user.stats.totalHands,
          winRate: user.stats.winRate,
          totalEarnings: user.stats.totalEarnings
        } : null
      },
      // 同时返回token给前端使用
      token: accessToken,
      message: '登录成功'
    });
    
    // 设置HttpOnly cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7天
      path: '/'
    });
    
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30天
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}