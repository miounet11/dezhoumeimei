import prisma from '@/lib/db/prisma';

export interface OpponentWithStats {
  id: string;
  name: string;
  style: string;
  difficulty: string;
  winRate: number;
  description: string;
  avatar: string;
  vpip: number;
  pfr: number;
  af: number;
  threeBet: number;
  bluffFrequency: number;
  tiltTendency: number;
  adaptability: number;
  requiredLevel: number;
  unlockPrice: number;
  isActive: boolean;
}

export class OpponentService {
  // Get all active opponents
  static async getAllOpponents(): Promise<OpponentWithStats[]> {
    return await prisma.opponent.findMany({
      where: { isActive: true },
      orderBy: { difficulty: 'asc' }
    });
  }

  // Get opponents available for user's level
  static async getAvailableOpponents(userLevel: number): Promise<OpponentWithStats[]> {
    return await prisma.opponent.findMany({
      where: {
        isActive: true,
        requiredLevel: { lte: userLevel }
      },
      orderBy: { difficulty: 'asc' }
    });
  }

  // Get personalized opponent recommendations
  static async getRecommendedOpponents(userId: string): Promise<OpponentWithStats[]> {
    // Get user's game history
    const recentGames = await prisma.gameSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { opponent: true }
    });

    // Analyze user's performance
    const winRate = recentGames.filter(g => g.result === 'WIN').length / recentGames.length;
    
    // Recommend based on skill level
    let difficultyFilter: string[];
    if (winRate > 0.7) {
      difficultyFilter = ['hard', 'expert'];
    } else if (winRate > 0.5) {
      difficultyFilter = ['medium', 'hard'];
    } else {
      difficultyFilter = ['easy', 'medium'];
    }

    return await prisma.opponent.findMany({
      where: {
        isActive: true,
        difficulty: { in: difficultyFilter }
      },
      orderBy: { winRate: 'asc' },
      take: 6
    });
  }

  // Get opponent by ID
  static async getOpponentById(id: string): Promise<OpponentWithStats | null> {
    return await prisma.opponent.findUnique({
      where: { id }
    });
  }

  // Record game result against opponent
  static async recordGameResult(
    userId: string,
    opponentId: string,
    result: 'WIN' | 'LOSS' | 'DRAW',
    stats: {
      hands: number;
      duration: number;
      profit: number;
    }
  ): Promise<void> {
    await prisma.gameSession.create({
      data: {
        userId,
        opponentId,
        type: 'TRAINING',
        stakes: '1/2',
        buyIn: 100,
        cashOut: 100 + stats.profit,
        result,
        hands: stats.hands,
        duration: stats.duration,
        opponentIds: JSON.stringify([opponentId]),
        completedAt: new Date()
      }
    });

    // Update user stats
    await prisma.userStats.update({
      where: { userId },
      data: {
        totalHands: { increment: stats.hands },
        totalGames: { increment: 1 },
        totalEarnings: { increment: stats.profit },
        lastActiveAt: new Date()
      }
    });
  }

  // Get head-to-head stats
  static async getHeadToHeadStats(userId: string, opponentId: string): Promise<{
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    totalProfit: number;
    avgProfit: number;
    winRate: number;
  }> {
    const games = await prisma.gameSession.findMany({
      where: {
        userId,
        opponentId
      }
    });

    const wins = games.filter(g => g.result === 'WIN').length;
    const losses = games.filter(g => g.result === 'LOSS').length;
    const draws = games.filter(g => g.result === 'DRAW').length;
    const totalProfit = games.reduce((sum, g) => {
      const profit = (g.cashOut || 0) - g.buyIn;
      return sum + profit;
    }, 0);

    return {
      totalGames: games.length,
      wins,
      losses,
      draws,
      totalProfit,
      avgProfit: games.length > 0 ? totalProfit / games.length : 0,
      winRate: games.length > 0 ? (wins / games.length) * 100 : 0
    };
  }

  // Unlock premium opponent
  static async unlockOpponent(userId: string, opponentId: string): Promise<boolean> {
    const opponent = await prisma.opponent.findUnique({
      where: { id: opponentId }
    });

    if (!opponent || opponent.unlockPrice === 0) {
      return false;
    }

    const wisdomCoin = await prisma.wisdomCoin.findUnique({
      where: { userId }
    });

    if (!wisdomCoin || wisdomCoin.balance < opponent.unlockPrice) {
      throw new Error('Insufficient wisdom coins');
    }

    // Deduct coins
    await prisma.wisdomCoin.update({
      where: { userId },
      data: {
        balance: { decrement: opponent.unlockPrice },
        totalSpent: { increment: opponent.unlockPrice }
      }
    });

    // Record transaction
    await prisma.coinTransaction.create({
      data: {
        userId,
        amount: -opponent.unlockPrice,
        transactionType: 'unlock',
        description: `Unlocked opponent: ${opponent.name}`,
        metadata: { opponentId }
      }
    });

    return true;
  }
}