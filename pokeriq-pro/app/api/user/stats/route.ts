import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 获取用户统计
    const stats = await prisma.userStats.findUnique({
      where: { userId: authResult.user.userId }
    });

    if (!stats) {
      return NextResponse.json({
        totalHands: 0,
        totalGames: 0,
        winRate: 0,
        totalEarnings: 0,
        currentStreak: 0,
        bestStreak: 0,
        vpip: 0,
        pfr: 0,
        af: 0,
        threeBet: 0,
        cbet: 0,
        trainingHours: 0
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('获取用户统计失败:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 验证认证
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const updates = await request.json();

    // 更新或创建统计
    const stats = await prisma.userStats.upsert({
      where: { userId: authResult.user.userId },
      update: {
        ...updates,
        lastActiveAt: new Date()
      },
      create: {
        userId: authResult.user.userId,
        ...updates
      }
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('更新用户统计失败:', error);
    return NextResponse.json(
      { error: '更新统计数据失败' },
      { status: 500 }
    );
  }
}