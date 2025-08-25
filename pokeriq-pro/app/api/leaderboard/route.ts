import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'daily';
    const category = searchParams.get('category') || 'winRate';
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Calculate period dates
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;
    
    switch (period) {
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - periodStart.getDay());
        periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'all-time':
        periodStart = new Date(2024, 0, 1); // From Jan 1, 2024
        periodEnd = new Date(2100, 0, 1); // Far future
        break;
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
    }
    
    // Get leaderboard entries
    const entries = await prisma.leaderboardEntry.findMany({
      where: {
        period,
        category,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd }
      },
      orderBy: { rank: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            level: true
          }
        }
      }
    });
    
    // Format response
    const leaderboard = entries.map(entry => ({
      rank: entry.rank,
      userId: entry.userId,
      username: entry.user.username || entry.user.name || 'Anonymous',
      avatar: entry.user.avatar,
      level: entry.user.level,
      score: entry.score,
      metadata: entry.metadata
    }));
    
    return NextResponse.json({ 
      leaderboard,
      period,
      category,
      periodStart,
      periodEnd
    });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, period, category, score, metadata } = body;
    
    if (!userId || !period || !category || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Calculate period dates
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;
    
    switch (period) {
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - periodStart.getDay());
        periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid period' },
          { status: 400 }
        );
    }
    
    // Calculate rank based on score
    const higherScores = await prisma.leaderboardEntry.count({
      where: {
        period,
        category,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
        score: { gt: score }
      }
    });
    
    const rank = higherScores + 1;
    
    // Create or update entry
    const entry = await prisma.leaderboardEntry.upsert({
      where: {
        userId_period_category_periodStart: {
          userId,
          period,
          category,
          periodStart
        }
      },
      update: {
        score,
        rank,
        metadata,
        updatedAt: new Date()
      },
      create: {
        userId,
        period,
        category,
        score,
        rank,
        periodStart,
        periodEnd,
        metadata
      }
    });
    
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Failed to update leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to update leaderboard' },
      { status: 500 }
    );
  }
}