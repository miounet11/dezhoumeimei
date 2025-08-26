import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AchievementProgress {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  icon: string;
  progress: number;
  completed: boolean;
  unlockedAt?: Date;
  requirement: any;
  reward?: any;
  points?: number;
}

export interface AchievementCriteria {
  type: 'hands_played' | 'win_rate' | 'total_winnings' | 'streak' | 'training_hours' | 'course_completion' | 'assessment_score';
  value: number;
  comparison?: 'gte' | 'lte' | 'eq';
  period?: 'all_time' | 'monthly' | 'weekly' | 'daily';
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  metadata?: any;
  category: string;
  period: string;
}

export interface UserSocialStats {
  userId: string;
  achievements: AchievementProgress[];
  leaderboardPositions: LeaderboardEntry[];
  totalAchievementPoints: number;
  achievementProgress: number; // percentage of total achievements unlocked
  socialShares: number;
  peersCompared: number;
}

// Default achievements configuration
const DEFAULT_ACHIEVEMENTS = [
  {
    code: 'first_win',
    name: 'First Victory',
    description: 'Win your first game',
    category: 'MILESTONE',
    rarity: 'COMMON',
    icon: 'trophy',
    requirement: { type: 'total_wins', value: 1 },
    reward: { coins: 100, xp: 50 },
    points: 10
  },
  {
    code: 'win_streak_5',
    name: 'Hot Streak',
    description: 'Win 5 games in a row',
    category: 'STATS',
    rarity: 'RARE',
    icon: 'fire',
    requirement: { type: 'win_streak', value: 5 },
    reward: { coins: 500, xp: 200 },
    points: 50
  },
  {
    code: 'hands_master',
    name: 'Hands Master',
    description: 'Play 1,000 hands',
    category: 'TRAINING',
    rarity: 'EPIC',
    icon: 'cards',
    requirement: { type: 'hands_played', value: 1000 },
    reward: { coins: 1000, xp: 500 },
    points: 100
  },
  {
    code: 'high_roller',
    name: 'High Roller',
    description: 'Earn $10,000 in total winnings',
    category: 'STATS',
    rarity: 'LEGENDARY',
    icon: 'money',
    requirement: { type: 'total_winnings', value: 10000 },
    reward: { coins: 2000, xp: 1000 },
    points: 250
  },
  {
    code: 'gto_student',
    name: 'GTO Student',
    description: 'Complete 10 hours of GTO training',
    category: 'TRAINING',
    rarity: 'RARE',
    icon: 'brain',
    requirement: { type: 'training_hours', value: 10 },
    reward: { coins: 750, xp: 300 },
    points: 75
  },
  {
    code: 'perfect_score',
    name: 'Perfect Score',
    description: 'Score 100% on an assessment',
    category: 'SPECIAL',
    rarity: 'EPIC',
    icon: 'star',
    requirement: { type: 'assessment_score', value: 100 },
    reward: { coins: 1500, xp: 750 },
    points: 150
  },
  {
    code: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Share your progress 10 times',
    category: 'SOCIAL',
    rarity: 'COMMON',
    icon: 'share',
    requirement: { type: 'social_shares', value: 10 },
    reward: { coins: 300, xp: 150 },
    points: 25
  },
  {
    code: 'course_graduate',
    name: 'Course Graduate',
    description: 'Complete 3 full courses',
    category: 'MILESTONE',
    rarity: 'RARE',
    icon: 'graduation-cap',
    requirement: { type: 'course_completion', value: 3 },
    reward: { coins: 800, xp: 400 },
    points: 100
  }
];

export class AchievementSystem {
  
  /**
   * Initialize default achievements in the database
   */
  static async initializeAchievements() {
    try {
      for (const achievement of DEFAULT_ACHIEVEMENTS) {
        await prisma.achievement.upsert({
          where: { code: achievement.code },
          update: {
            name: achievement.name,
            description: achievement.description,
            category: achievement.category as any,
            rarity: achievement.rarity as any,
            icon: achievement.icon,
            requirement: achievement.requirement,
            reward: achievement.reward,
            isActive: true
          },
          create: {
            code: achievement.code,
            name: achievement.name,
            description: achievement.description,
            category: achievement.category as any,
            rarity: achievement.rarity as any,
            icon: achievement.icon,
            requirement: achievement.requirement,
            reward: achievement.reward,
            isActive: true
          }
        });
      }
      console.log(`Initialized ${DEFAULT_ACHIEVEMENTS.length} achievements`);
    } catch (error) {
      console.error('Error initializing achievements:', error);
      throw error;
    }
  }

  /**
   * Get user's achievement progress
   */
  static async getUserAchievements(userId: string): Promise<AchievementProgress[]> {
    try {
      const achievements = await prisma.achievement.findMany({
        where: { isActive: true },
        include: {
          users: {
            where: { userId },
            select: {
              progress: true,
              completed: true,
              unlockedAt: true
            }
          }
        },
        orderBy: [{ rarity: 'desc' }, { name: 'asc' }]
      });

      const userStats = await this.getUserStatsForAchievements(userId);

      return achievements.map(achievement => {
        const userAchievement = achievement.users[0];
        const progress = this.calculateAchievementProgress(achievement.requirement, userStats);
        
        return {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          rarity: achievement.rarity,
          icon: achievement.icon,
          progress: userAchievement?.progress || progress,
          completed: userAchievement?.completed || false,
          unlockedAt: userAchievement?.unlockedAt || undefined,
          requirement: achievement.requirement,
          reward: achievement.reward,
          points: this.getAchievementPoints(achievement.rarity)
        };
      });
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  /**
   * Check and update user achievements based on their current stats
   */
  static async checkAchievements(userId: string): Promise<AchievementProgress[]> {
    try {
      const achievements = await this.getUserAchievements(userId);
      const newlyUnlocked: AchievementProgress[] = [];

      for (const achievement of achievements) {
        if (!achievement.completed && achievement.progress >= 1.0) {
          // Unlock the achievement
          await prisma.userAchievement.upsert({
            where: {
              userId_achievementId: {
                userId,
                achievementId: achievement.id
              }
            },
            update: {
              progress: 1.0,
              completed: true,
              unlockedAt: new Date()
            },
            create: {
              userId,
              achievementId: achievement.id,
              progress: 1.0,
              completed: true,
              unlockedAt: new Date()
            }
          });

          // Award rewards
          if (achievement.reward) {
            await this.awardAchievementReward(userId, achievement);
          }

          achievement.completed = true;
          achievement.unlockedAt = new Date();
          newlyUnlocked.push(achievement);
        } else if (!achievement.completed) {
          // Update progress
          await prisma.userAchievement.upsert({
            where: {
              userId_achievementId: {
                userId,
                achievementId: achievement.id
              }
            },
            update: {
              progress: achievement.progress
            },
            create: {
              userId,
              achievementId: achievement.id,
              progress: achievement.progress
            }
          });
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard data for a specific category and period
   */
  static async getLeaderboard(
    category: string,
    period: string = 'all-time',
    limit: number = 50,
    userId?: string
  ): Promise<{ entries: LeaderboardEntry[], userRank?: number }> {
    try {
      let whereClause: any = { period, category };
      let periodStart: Date | undefined;

      // Calculate period start based on period type
      const now = new Date();
      switch (period) {
        case 'daily':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          periodStart = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          // all-time doesn't need periodStart filter
          break;
      }

      if (periodStart) {
        whereClause.periodStart = { gte: periodStart };
      }

      const entries = await prisma.leaderboardEntry.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { rank: 'asc' },
        take: limit
      });

      const leaderboardEntries: LeaderboardEntry[] = entries.map(entry => ({
        userId: entry.userId,
        username: entry.user.username || 'Anonymous',
        avatar: entry.user.avatar,
        score: entry.score,
        rank: entry.rank,
        metadata: entry.metadata,
        category: entry.category,
        period: entry.period
      }));

      let userRank: number | undefined;
      if (userId) {
        const userEntry = await prisma.leaderboardEntry.findFirst({
          where: { userId, period, category }
        });
        userRank = userEntry?.rank;
      }

      return { entries: leaderboardEntries, userRank };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Update leaderboard entry for a user
   */
  static async updateLeaderboardEntry(
    userId: string,
    category: string,
    score: number,
    period: string = 'all-time',
    metadata?: any
  ) {
    try {
      const now = new Date();
      let periodStart: Date;
      let periodEnd: Date;

      switch (period) {
        case 'daily':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          periodStart = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        default:
          periodStart = new Date('2020-01-01');
          periodEnd = new Date('2030-12-31');
          break;
      }

      await prisma.leaderboardEntry.upsert({
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
          metadata,
          rank: 0 // Will be updated by recalculateRanks
        },
        create: {
          userId,
          period,
          category,
          score,
          metadata,
          periodStart,
          periodEnd,
          rank: 0
        }
      });

      // Recalculate ranks for this category and period
      await this.recalculateRanks(category, period, periodStart);
    } catch (error) {
      console.error('Error updating leaderboard entry:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive social stats for a user
   */
  static async getUserSocialStats(userId: string): Promise<UserSocialStats> {
    try {
      const achievements = await this.getUserAchievements(userId);
      const completedAchievements = achievements.filter(a => a.completed);
      const totalPoints = completedAchievements.reduce((sum, a) => sum + (a.points || 0), 0);
      
      // Get user's leaderboard positions across different categories
      const leaderboardPositions = await prisma.leaderboardEntry.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { rank: 'asc' },
        take: 10 // Top 10 leaderboard positions
      });

      const socialShares = await this.getSocialShareCount(userId);
      const peersCompared = await this.getPeerComparisonCount(userId);

      return {
        userId,
        achievements,
        leaderboardPositions: leaderboardPositions.map(entry => ({
          userId: entry.userId,
          username: entry.user.username || 'Anonymous',
          avatar: entry.user.avatar,
          score: entry.score,
          rank: entry.rank,
          metadata: entry.metadata,
          category: entry.category,
          period: entry.period
        })),
        totalAchievementPoints: totalPoints,
        achievementProgress: achievements.length > 0 ? (completedAchievements.length / achievements.length) * 100 : 0,
        socialShares,
        peersCompared
      };
    } catch (error) {
      console.error('Error getting user social stats:', error);
      throw error;
    }
  }

  /**
   * Record a social share action
   */
  static async recordSocialShare(userId: string, type: string, content: any) {
    try {
      // Create social interaction record
      await prisma.$executeRaw`
        INSERT INTO social_interactions (user_id, interaction_type, target_type, target_id, created_at)
        VALUES (${userId}, 'share', ${type}, ${content.id || 0}, NOW())
      `;

      // Check for social sharing achievements
      await this.checkAchievements(userId);
    } catch (error) {
      console.error('Error recording social share:', error);
      throw error;
    }
  }

  // Private helper methods

  private static async getUserStatsForAchievements(userId: string) {
    const [userStats, userProgress, gameStats, socialStats] = await Promise.all([
      prisma.userStats.findUnique({ where: { userId } }),
      prisma.userProgress.findMany({ where: { userId } }),
      prisma.gameSession.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { hands: true }
      }),
      prisma.$executeRaw`
        SELECT COUNT(*) as social_shares
        FROM social_interactions 
        WHERE user_id = ${userId} AND interaction_type = 'share'
      `
    ]);

    const completedCourses = userProgress.filter(p => p.completedAt).length;
    const totalHands = gameStats._sum.hands || 0;
    const totalGames = gameStats._count?.id || 0;

    return {
      totalWins: Math.floor((userStats?.winRate || 0) * (totalGames || 0) / 100),
      winStreak: userStats?.currentStreak || 0,
      totalHands,
      totalWinnings: userStats?.totalEarnings || 0,
      trainingHours: userStats?.trainingHours || 0,
      courseCompletion: completedCourses,
      socialShares: Array.isArray(socialStats) ? socialStats[0]?.social_shares || 0 : 0,
      assessmentScores: userProgress.map(p => p.testScores).flat()
    };
  }

  private static calculateAchievementProgress(requirement: any, userStats: any): number {
    const { type, value } = requirement;
    
    const currentValue = userStats[type] || 0;
    
    if (type === 'assessment_score') {
      // For assessment scores, check if any score meets the requirement
      const scores = userStats.assessmentScores || [];
      const maxScore = Math.max(...scores, 0);
      return Math.min(maxScore / value, 1.0);
    }
    
    return Math.min(currentValue / value, 1.0);
  }

  private static async awardAchievementReward(userId: string, achievement: AchievementProgress) {
    if (!achievement.reward) return;

    // Award XP
    if (achievement.reward.xp) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: achievement.reward.xp }
        }
      });
    }

    // Award coins
    if (achievement.reward.coins) {
      await prisma.wisdomCoin.upsert({
        where: { userId },
        update: {
          balance: { increment: achievement.reward.coins },
          totalEarned: { increment: achievement.reward.coins }
        },
        create: {
          userId,
          balance: 1000 + achievement.reward.coins,
          totalEarned: 1000 + achievement.reward.coins,
          totalSpent: 0
        }
      });

      // Record transaction
      await prisma.coinTransaction.create({
        data: {
          userId,
          amount: achievement.reward.coins,
          transactionType: 'achievement',
          description: `Achievement reward: ${achievement.name}`,
          metadata: { achievementId: achievement.id }
        }
      });
    }
  }

  private static getAchievementPoints(rarity: string): number {
    const rarityPoints: { [key: string]: number } = {
      COMMON: 10,
      RARE: 50,
      EPIC: 100,
      LEGENDARY: 250,
      MYTHIC: 500
    };
    return rarityPoints[rarity] || 10;
  }

  private static async recalculateRanks(category: string, period: string, periodStart: Date) {
    try {
      const entries = await prisma.leaderboardEntry.findMany({
        where: { category, period, periodStart },
        orderBy: { score: 'desc' }
      });

      for (let i = 0; i < entries.length; i++) {
        await prisma.leaderboardEntry.update({
          where: { id: entries[i].id },
          data: { rank: i + 1 }
        });
      }
    } catch (error) {
      console.error('Error recalculating ranks:', error);
    }
  }

  private static async getSocialShareCount(userId: string): Promise<number> {
    try {
      const result = await prisma.$executeRaw`
        SELECT COUNT(*) as count
        FROM social_interactions 
        WHERE user_id = ${userId} AND interaction_type = 'share'
      `;
      return Array.isArray(result) ? Number(result[0]?.count || 0) : 0;
    } catch (error) {
      console.error('Error getting social share count:', error);
      return 0;
    }
  }

  private static async getPeerComparisonCount(userId: string): Promise<number> {
    try {
      const result = await prisma.$executeRaw`
        SELECT COUNT(*) as count
        FROM social_interactions 
        WHERE user_id = ${userId} AND interaction_type = 'compare'
      `;
      return Array.isArray(result) ? Number(result[0]?.count || 0) : 0;
    } catch (error) {
      console.error('Error getting peer comparison count:', error);
      return 0;
    }
  }
}

// Export the service functions
export const achievementService = {
  initializeAchievements: AchievementSystem.initializeAchievements,
  getUserAchievements: AchievementSystem.getUserAchievements,
  checkAchievements: AchievementSystem.checkAchievements,
  getLeaderboard: AchievementSystem.getLeaderboard,
  updateLeaderboardEntry: AchievementSystem.updateLeaderboardEntry,
  getUserSocialStats: AchievementSystem.getUserSocialStats,
  recordSocialShare: AchievementSystem.recordSocialShare,
};