import prisma from '@/lib/db/prisma';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  score: number;
  metadata?: any;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';
export type LeaderboardCategory = 'winRate' | 'profit' | 'hands' | 'achievements';

export class LeaderboardService {
  // Get period date range
  private static getPeriodDates(period: LeaderboardPeriod): {
    start: Date;
    end: Date;
  } {
    const now = new Date();
    let start: Date;
    let end: Date;
    
    switch (period) {
      case 'daily':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        break;
      
      case 'weekly':
        start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      
      case 'all-time':
        start = new Date(2024, 0, 1);
        end = new Date(2100, 0, 1);
        break;
    }
    
    return { start, end };
  }
  
  // Get leaderboard
  static async getLeaderboard(
    period: LeaderboardPeriod,
    category: LeaderboardCategory,
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const { start, end } = this.getPeriodDates(period);
    
    const entries = await prisma.leaderboardEntry.findMany({
      where: {
        period,
        category,
        periodStart: { gte: start },
        periodEnd: { lte: end }
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
    
    return entries.map(entry => ({
      rank: entry.rank,
      userId: entry.userId,
      username: entry.user.username || entry.user.name || 'Anonymous',
      avatar: entry.user.avatar,
      level: entry.user.level,
      score: entry.score,
      metadata: entry.metadata
    }));
  }
  
  // Update user's leaderboard position
  static async updateUserScore(
    userId: string,
    period: LeaderboardPeriod,
    category: LeaderboardCategory,
    score: number,
    metadata?: any
  ): Promise<number> {
    const { start, end } = this.getPeriodDates(period);
    
    // Calculate rank
    const higherScores = await prisma.leaderboardEntry.count({
      where: {
        period,
        category,
        periodStart: { gte: start },
        periodEnd: { lte: end },
        score: { gt: score },
        userId: { not: userId } // Exclude self
      }
    });
    
    const rank = higherScores + 1;
    
    // Update or create entry
    await prisma.leaderboardEntry.upsert({
      where: {
        userId_period_category_periodStart: {
          userId,
          period,
          category,
          periodStart: start
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
        periodStart: start,
        periodEnd: end,
        metadata
      }
    });
    
    // Update ranks for other users if needed
    await this.recalculateRanks(period, category);
    
    return rank;
  }
  
  // Recalculate all ranks for a period/category
  private static async recalculateRanks(
    period: LeaderboardPeriod,
    category: LeaderboardCategory
  ): Promise<void> {
    const { start, end } = this.getPeriodDates(period);
    
    const entries = await prisma.leaderboardEntry.findMany({
      where: {
        period,
        category,
        periodStart: { gte: start },
        periodEnd: { lte: end }
      },
      orderBy: { score: 'desc' }
    });
    
    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].rank !== i + 1) {
        await prisma.leaderboardEntry.update({
          where: { id: entries[i].id },
          data: { rank: i + 1 }
        });
      }
    }
  }
  
  // Get user's rank across all categories
  static async getUserRanks(
    userId: string,
    period: LeaderboardPeriod
  ): Promise<Record<LeaderboardCategory, number | null>> {
    const { start, end } = this.getPeriodDates(period);
    
    const categories: LeaderboardCategory[] = ['winRate', 'profit', 'hands', 'achievements'];
    const ranks: Record<LeaderboardCategory, number | null> = {
      winRate: null,
      profit: null,
      hands: null,
      achievements: null
    };
    
    for (const category of categories) {
      const entry = await prisma.leaderboardEntry.findFirst({
        where: {
          userId,
          period,
          category,
          periodStart: { gte: start },
          periodEnd: { lte: end }
        }
      });
      
      if (entry) {
        ranks[category] = entry.rank;
      }
    }
    
    return ranks;
  }
  
  // Get top performers across all periods
  static async getTopPerformers(
    category: LeaderboardCategory,
    limit: number = 10
  ): Promise<{
    daily: LeaderboardEntry[];
    weekly: LeaderboardEntry[];
    monthly: LeaderboardEntry[];
  }> {
    const [daily, weekly, monthly] = await Promise.all([
      this.getLeaderboard('daily', category, limit),
      this.getLeaderboard('weekly', category, limit),
      this.getLeaderboard('monthly', category, limit)
    ]);
    
    return { daily, weekly, monthly };
  }
  
  // Update user stats and leaderboards after game
  static async updateAfterGame(
    userId: string,
    gameResult: {
      won: boolean;
      profit: number;
      hands: number;
    }
  ): Promise<void> {
    // Update user stats
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    });
    
    if (!userStats) return;
    
    const newTotalGames = userStats.totalGames + 1;
    const newWins = userStats.winRate * userStats.totalGames / 100 + (gameResult.won ? 1 : 0);
    const newWinRate = (newWins / newTotalGames) * 100;
    const newTotalHands = userStats.totalHands + gameResult.hands;
    const newTotalEarnings = userStats.totalEarnings + gameResult.profit;
    
    await prisma.userStats.update({
      where: { userId },
      data: {
        totalGames: newTotalGames,
        totalHands: newTotalHands,
        winRate: newWinRate,
        totalEarnings: newTotalEarnings,
        currentStreak: gameResult.won
          ? userStats.currentStreak + 1
          : 0,
        bestStreak: gameResult.won && userStats.currentStreak + 1 > userStats.bestStreak
          ? userStats.currentStreak + 1
          : userStats.bestStreak
      }
    });
    
    // Update leaderboards
    const periods: LeaderboardPeriod[] = ['daily', 'weekly', 'monthly'];
    
    for (const period of periods) {
      await Promise.all([
        this.updateUserScore(userId, period, 'winRate', newWinRate, {
          games: newTotalGames,
          wins: Math.round(newWins)
        }),
        this.updateUserScore(userId, period, 'profit', newTotalEarnings, {
          sessions: newTotalGames,
          avgProfit: newTotalEarnings / newTotalGames
        }),
        this.updateUserScore(userId, period, 'hands', newTotalHands, {
          avgPerGame: newTotalHands / newTotalGames
        })
      ]);
    }
  }
}