import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Always return demo data for development - no authentication required
    console.log('Returning demo user data for development');
    
    return NextResponse.json({
      success: true,
      data: {
        id: 'demo-user-id',
        username: 'DemoUser',
        name: '演示用户',
        email: 'demo@pokeriq.pro',
        avatar: null,
        level: 5,
        xp: 4500,
        isVip: false,
        vipExpiry: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
        stats: {
          totalHands: 1250,
          totalGames: 89,
          winRate: 68.5,
          totalEarnings: 3240,
          currentStreak: 12,
          bestStreak: 18,
          vpip: 22.4,
          pfr: 18.2,
          af: 2.1,
          threeBet: 8.3,
          cbet: 75.5,
          trainingHours: 24.0
        },
        ladderRank: {
          currentRank: 'silver',
          rankPoints: 1450,
          totalTests: 8,
          avgScore: 78.5,
          peakRank: 'gold',
          peakPoints: 2100,
          globalPercentile: 75,
          rankPercentile: 35
        },
        companions: [],
        recentAchievements: [
          {
            id: 'ach_1',
            name: '连胜大师',
            description: '连续获胜15场',
            icon: '🔥',
            rarity: 'rare',
            unlockedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            progress: 100
          }
        ],
        recentGames: [
          {
            id: 1,
            gameType: '现金桌',
            buyIn: 200,
            finalStack: 350,
            handsPlayed: 45,
            result: 'win',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            endedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
          }
        ]
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}