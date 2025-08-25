import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // 从cookie或header获取token
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('accessToken')?.value;
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    // For development/demo purposes, provide mock user data if no authentication
    if (!token) {
      console.log('No authentication token found, providing mock user data for development');
      
      // Return mock user profile for development
      return NextResponse.json({
        success: true,
        data: {
          id: 'demo-user-id',
          username: 'DemoUser',
          name: '演示用户',
          email: 'demo@pokeriq.pro',
          avatar: null,
          level: 1,
          xp: 150,
          isVip: false,
          vipExpiry: null,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          loginCount: 1,
          stats: {
            totalHands: 45,
            totalGames: 12,
            winRate: 65.5,
            totalEarnings: 2450,
            currentStreak: 3,
            bestStreak: 7,
            vpip: 23.5,
            pfr: 18.2,
            af: 2.1,
            threeBet: 8.3,
            cbet: 75.5,
            trainingHours: 12.5
          },
          ladderRank: {
            currentRank: 'bronze',
            rankPoints: 1200,
            totalTests: 3,
            avgScore: 72.3,
            peakRank: 'silver',
            peakPoints: 1450,
            globalPercentile: 65,
            rankPercentile: 25
          },
          companions: [],
          recentAchievements: [],
          recentGames: []
        }
      });
    }

    // 验证token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'token无效' },
        { status: 401 }
      );
    }

    // 获取完整的用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        stats: true,
        ladderRank: true,
        companions: {
          include: {
            companion: true
          }
        },
        achievements: {
          include: {
            achievement: true
          },
          orderBy: {
            unlockedAt: 'desc'
          },
          take: 5 // 最近的5个成就
        },
        sessions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // 最近的10场游戏
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 格式化返回数据
    const profileData = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      level: user.level,
      xp: user.xp,
      isVip: user.isVip,
      vipExpiry: user.vipExpiry,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      loginCount: user.loginCount,
      stats: user.stats ? {
        totalHands: user.stats.totalHands,
        totalGames: user.stats.totalGames,
        winRate: user.stats.winRate,
        totalEarnings: user.stats.totalEarnings,
        currentStreak: user.stats.currentStreak,
        bestStreak: user.stats.bestStreak,
        vpip: user.stats.vpip,
        pfr: user.stats.pfr,
        af: user.stats.af,
        threeBet: user.stats.threeBet,
        cbet: user.stats.cbet,
        trainingHours: user.stats.trainingHours
      } : null,
      ladderRank: user.ladderRank ? {
        currentRank: user.ladderRank.currentRank,
        rankPoints: user.ladderRank.rankPoints,
        totalTests: user.ladderRank.totalTests,
        avgScore: user.ladderRank.avgScore,
        peakRank: user.ladderRank.peakRank,
        peakPoints: user.ladderRank.peakPoints,
        globalPercentile: user.ladderRank.globalPercentile,
        rankPercentile: user.ladderRank.rankPercentile
      } : null,
      companions: user.companions.map(uc => ({
        name: uc.companion.name,
        avatar: uc.companion.avatar,
        relationshipLevel: uc.relationshipLevel,
        intimacyPoints: uc.intimacyPoints,
        totalInteractions: uc.totalInteractions
      })),
      recentAchievements: user.achievements.map(ua => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        rarity: ua.achievement.rarity,
        unlockedAt: ua.unlockedAt,
        progress: ua.progress
      })),
      recentGames: user.sessions.map(session => ({
        id: session.id,
        gameType: session.type,
        buyIn: session.buyIn,
        finalStack: session.cashOut,
        handsPlayed: session.hands,
        result: session.result,
        createdAt: session.createdAt,
        endedAt: session.completedAt
      }))
    };

    return NextResponse.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}