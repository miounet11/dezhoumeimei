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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');

    // 构建查询条件
    const where: any = {
      userId: authResult.user.userId
    };

    if (type) {
      where.type = type.toUpperCase();
    }

    // 获取游戏会话
    const sessions = await prisma.gameSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        handRecords: {
          select: {
            id: true,
            result: true,
            pot: true
          }
        }
      }
    });

    // 获取总数
    const total = await prisma.gameSession.count({ where });

    // 格式化响应
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      type: session.type,
      stakes: session.stakes,
      buyIn: session.buyIn,
      cashOut: session.cashOut,
      result: session.result,
      hands: session.hands,
      duration: session.duration,
      opponents: JSON.parse(session.opponentIds || '[]'),
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      handDetails: session.handRecords
    }));

    return NextResponse.json({
      sessions: formattedSessions,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('获取游戏会话失败:', error);
    return NextResponse.json(
      { error: '获取游戏会话失败' },
      { status: 500 }
    );
  }
}

// 创建新游戏会话
export async function POST(request: NextRequest) {
  try {
    // 验证认证
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // 创建游戏会话
    const session = await prisma.gameSession.create({
      data: {
        userId: authResult.user.userId,
        type: data.type,
        stakes: data.stakes,
        buyIn: data.buyIn,
        cashOut: data.cashOut || null,
        result: data.result || 'DRAW',
        hands: data.hands || 0,
        duration: data.duration || 0,
        opponentIds: JSON.stringify(data.opponents || []),
        completedAt: data.completed ? new Date() : null
      }
    });

    // 更新用户统计
    if (data.completed) {
      await prisma.userStats.update({
        where: { userId: authResult.user.userId },
        data: {
          totalGames: { increment: 1 },
          totalHands: { increment: data.hands || 0 },
          totalEarnings: { increment: (data.cashOut || 0) - data.buyIn },
          lastActiveAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('创建游戏会话失败:', error);
    return NextResponse.json(
      { error: '创建游戏会话失败' },
      { status: 500 }
    );
  }
}

// 更新游戏会话
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

    const { sessionId, ...updates } = await request.json();

    // 验证会话所有权
    const session = await prisma.gameSession.findFirst({
      where: {
        id: sessionId,
        userId: authResult.user.userId
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: '会话不存在或无权限' },
        { status: 404 }
      );
    }

    // 更新会话
    const updatedSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        ...updates,
        opponentIds: updates.opponents ? JSON.stringify(updates.opponents) : undefined,
        completedAt: updates.completed ? new Date() : undefined
      }
    });

    return NextResponse.json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    console.error('更新游戏会话失败:', error);
    return NextResponse.json(
      { error: '更新游戏会话失败' },
      { status: 500 }
    );
  }
}