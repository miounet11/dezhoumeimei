import prisma from '@/lib/db/prisma';

export interface AchievementWithProgress {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  icon: string;
  requirement: any;
  reward: any;
  userProgress?: {
    progress: number;
    completed: boolean;
    unlockedAt: Date | null;
  };
}

export class AchievementService {
  // Get all achievements with user progress
  static async getAchievementsWithProgress(userId: string): Promise<AchievementWithProgress[]> {
    const achievements = await prisma.achievement.findMany({
      orderBy: [
        { category: 'asc' },
        { rarity: 'asc' },
        { name: 'asc' }
      ]
    });
    
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: {
        achievementId: true,
        progress: true,
        completed: true,
        unlockedAt: true
      }
    });
    
    const userProgressMap = new Map(
      userAchievements.map(ua => [
        ua.achievementId,
        {
          progress: ua.progress,
          completed: ua.completed,
          unlockedAt: ua.unlockedAt
        }
      ])
    );
    
    return achievements.map(achievement => ({
      ...achievement,
      userProgress: userProgressMap.get(achievement.id) || {
        progress: 0,
        completed: false,
        unlockedAt: null
      }
    }));
  }
  
  // Check and update achievement progress
  static async checkAchievementProgress(
    userId: string,
    achievementCode: string,
    currentValue: number
  ): Promise<{
    updated: boolean;
    completed: boolean;
    reward?: any;
  }> {
    const achievement = await prisma.achievement.findUnique({
      where: { code: achievementCode }
    });
    
    if (!achievement) {
      return { updated: false, completed: false };
    }
    
    const requirement = achievement.requirement as any;
    let targetValue = 0;
    let progress = 0;
    
    // Calculate progress based on requirement type
    switch (requirement.type) {
      case 'win':
      case 'hands':
      case 'streak':
      case 'count':
      case 'companion':
      case 'gift':
      case 'bluff':
        targetValue = requirement.count;
        progress = Math.min((currentValue / targetValue) * 100, 100);
        break;
      
      case 'percent':
      case 'gto_accuracy':
      case 'accuracy':
        targetValue = requirement.percent;
        progress = Math.min((currentValue / targetValue) * 100, 100);
        break;
      
      case 'amount':
      case 'profit':
      case 'coins':
      case 'single_win':
        targetValue = requirement.amount;
        progress = Math.min((currentValue / targetValue) * 100, 100);
        break;
      
      case 'level':
      case 'intimacy':
        targetValue = requirement.level;
        progress = Math.min((currentValue / targetValue) * 100, 100);
        break;
      
      case 'hours':
      case 'night_training':
        targetValue = requirement.hours;
        progress = Math.min((currentValue / targetValue) * 100, 100);
        break;
      
      case 'companion_count':
        targetValue = requirement.count;
        progress = Math.min((currentValue / targetValue) * 100, 100);
        break;
      
      case 'perfect':
      case 'comeback':
        // Binary achievements
        progress = currentValue >= 1 ? 100 : 0;
        break;
      
      default:
        return { updated: false, completed: false };
    }
    
    const isCompleted = progress >= 100;
    
    // Update or create user achievement
    const userAchievement = await prisma.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id
        }
      },
      update: {
        progress,
        completed: isCompleted,
        unlockedAt: isCompleted ? new Date() : null
      },
      create: {
        userId,
        achievementId: achievement.id,
        progress,
        completed: isCompleted,
        unlockedAt: isCompleted ? new Date() : null
      }
    });
    
    // Grant rewards if newly completed
    if (isCompleted && achievement.reward) {
      await this.grantReward(userId, achievement.reward);
    }
    
    return {
      updated: true,
      completed: isCompleted,
      reward: isCompleted ? achievement.reward : undefined
    };
  }
  
  // Grant achievement rewards
  private static async grantReward(userId: string, reward: any): Promise<void> {
    if (reward.xp) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: reward.xp },
          level: { increment: Math.floor(reward.xp / 1000) } // Level up every 1000 XP
        }
      });
    }
    
    if (reward.coins) {
      await prisma.wisdomCoin.upsert({
        where: { userId },
        update: {
          balance: { increment: reward.coins },
          totalEarned: { increment: reward.coins }
        },
        create: {
          userId,
          balance: reward.coins,
          totalEarned: reward.coins,
          totalSpent: 0
        }
      });
      
      await prisma.coinTransaction.create({
        data: {
          userId,
          amount: reward.coins,
          transactionType: 'reward',
          description: `Achievement reward: ${reward.title || 'Achievement completed'}`,
          metadata: { type: 'achievement', reward }
        }
      });
    }
    
    if (reward.diamonds) {
      // Handle diamond rewards (premium currency)
      // This would integrate with your payment/premium system
    }
    
    if (reward.item) {
      // Grant virtual items
      const item = await prisma.virtualItem.findFirst({
        where: { name: reward.item }
      });
      
      if (item) {
        await prisma.userInventory.upsert({
          where: {
            userId_itemId: {
              userId,
              itemId: item.id
            }
          },
          update: {
            quantity: { increment: 1 }
          },
          create: {
            userId,
            itemId: item.id,
            quantity: 1
          }
        });
      }
    }
  }
  
  // Batch check multiple achievements
  static async batchCheckAchievements(
    userId: string,
    checks: Array<{ code: string; value: number }>
  ): Promise<Array<{ code: string; completed: boolean }>> {
    const results = [];
    
    for (const check of checks) {
      const result = await this.checkAchievementProgress(
        userId,
        check.code,
        check.value
      );
      
      results.push({
        code: check.code,
        completed: result.completed
      });
    }
    
    return results;
  }
  
  // Get achievement statistics
  static async getAchievementStats(userId: string): Promise<{
    totalAchievements: number;
    completedAchievements: number;
    completionRate: number;
    totalXPEarned: number;
    totalCoinsEarned: number;
    rarityBreakdown: Record<string, { total: number; completed: number }>;
  }> {
    const achievements = await prisma.achievement.findMany();
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId, completed: true },
      include: { achievement: true }
    });
    
    const totalAchievements = achievements.length;
    const completedAchievements = userAchievements.length;
    const completionRate = totalAchievements > 0
      ? (completedAchievements / totalAchievements) * 100
      : 0;
    
    // Calculate total rewards earned
    let totalXPEarned = 0;
    let totalCoinsEarned = 0;
    
    for (const ua of userAchievements) {
      const reward = ua.achievement.reward as any;
      if (reward) {
        if (reward.xp) totalXPEarned += reward.xp;
        if (reward.coins) totalCoinsEarned += reward.coins;
      }
    }
    
    // Calculate rarity breakdown
    const rarityBreakdown: Record<string, { total: number; completed: number }> = {};
    
    for (const achievement of achievements) {
      if (!rarityBreakdown[achievement.rarity]) {
        rarityBreakdown[achievement.rarity] = { total: 0, completed: 0 };
      }
      rarityBreakdown[achievement.rarity].total++;
      
      if (userAchievements.some(ua => ua.achievementId === achievement.id)) {
        rarityBreakdown[achievement.rarity].completed++;
      }
    }
    
    return {
      totalAchievements,
      completedAchievements,
      completionRate,
      totalXPEarned,
      totalCoinsEarned,
      rarityBreakdown
    };
  }
}