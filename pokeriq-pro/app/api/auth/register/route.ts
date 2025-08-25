import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, name } = body;

    // Validate input
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with related data
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        name: name || username,
        level: 1,
        xp: 0,
        role: 'USER',
        stats: {
          create: {
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
            trainingHours: 0,
          }
        },
        wisdomCoin: {
          create: {
            balance: 1000, // Starting bonus
            totalEarned: 1000,
            totalSpent: 0,
          }
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        level: true,
        xp: true,
        role: true,
      }
    });

    // Create welcome achievement
    const welcomeAchievement = await prisma.achievement.findFirst({
      where: { code: 'welcome_bonus' }
    });

    if (welcomeAchievement) {
      await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: welcomeAchievement.id,
          progress: 100,
          completed: true,
          unlockedAt: new Date()
        }
      });
    }

    // Give free starter companion
    const starterCompanion = await prisma.aICompanion.findFirst({
      where: { 
        basePrice: 0,
        rarity: 'common'
      }
    });

    if (starterCompanion) {
      await prisma.userCompanion.create({
        data: {
          userId: user.id,
          companionId: starterCompanion.id,
          relationshipLevel: 1,
          intimacyPoints: 0,
          totalInteractions: 0,
          currentMood: 'neutral',
          isPrimary: true
        }
      });

      // Create initial memory
      await prisma.companionMemory.create({
        data: {
          userCompanionId: user.id,
          memoryType: 'milestone',
          title: 'Welcome Gift',
          description: `${starterCompanion.name} joined you as your first companion`,
          importance: 5
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        level: user.level,
        xp: user.xp,
        role: user.role,
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}