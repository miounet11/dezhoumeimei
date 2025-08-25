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

    // 获取所有成就和用户进度
    const achievements = await prisma.achievement.findMany({
      include: {
        users: {
          where: {
            userId: authResult.user.userId
          }
        }
      }
    });

    // 格式化响应
    const formattedAchievements = achievements.map(achievement => ({
      id: achievement.id,
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      rarity: achievement.rarity,
      icon: achievement.icon,
      requirement: achievement.requirement,
      reward: achievement.reward,
      userProgress: achievement.users[0] ? {
        progress: achievement.users[0].progress,
        completed: achievement.users[0].completed,
        unlockedAt: achievement.users[0].unlockedAt
      } : {
        progress: 0,
        completed: false,
        unlockedAt: null
      }
    }));

    return NextResponse.json(formattedAchievements);
  } catch (error) {
    console.error('获取成就失败:', error);
    return NextResponse.json(
      { error: '获取成就数据失败' },
      { status: 500 }
    );
  }
}

// 更新成就进度
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

    const { achievementId, progress } = await request.json();

    // 验证成就是否存在
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId }
    });

    if (!achievement) {
      return NextResponse.json(
        { error: '成就不存在' },
        { status: 404 }
      );
    }

    // 更新或创建用户成就进度
    const userAchievement = await prisma.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId: authResult.user.userId,
          achievementId
        }
      },
      update: {
        progress,
        completed: progress >= 100,
        unlockedAt: progress >= 100 ? new Date() : undefined
      },
      create: {
        userId: authResult.user.userId,
        achievementId,
        progress,
        completed: progress >= 100,
        unlockedAt: progress >= 100 ? new Date() : null
      }
    });

    // 如果成就完成，更新用户XP
    if (userAchievement.completed && achievement.reward) {
      const reward = achievement.reward as any;
      if (reward.xp) {
        await prisma.user.update({
          where: { id: authResult.user.userId },
          data: {
            xp: { increment: reward.xp }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      achievement: userAchievement
    });
  } catch (error) {
    console.error('更新成就失败:', error);
    return NextResponse.json(
      { error: '更新成就进度失败' },
      { status: 500 }
    );
  }
}