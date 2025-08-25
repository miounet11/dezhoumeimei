import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import QueryOptimizer from '@/lib/database/query-optimizer';

export interface CompanionWithRelations {
  id: string;
  codeName: string;
  name: string;
  nameLocalized: any;
  personality: string;
  backstory: any;
  region: string;
  voiceType: string;
  basePrice: number;
  rarity: string;
  tags: string[];
  userRelationships?: any[];
}

export interface UserCompanionWithDetails {
  id: string;
  userId: string;
  companionId: string;
  relationshipLevel: number;
  intimacyPoints: number;
  totalInteractions: number;
  lastInteraction: Date | null;
  currentMood: string;
  isPrimary: boolean;
  companion: CompanionWithRelations;
}

export class CompanionService {
  // 获取所有可用伴侣（优化版本）
  static async getAllCompanions(): Promise<CompanionWithRelations[]> {
    const result = await QueryOptimizer.executeWithMonitoring(
      'getAllCompanions',
      async () => {
        return await prisma.aICompanion.findMany({
          where: { isActive: true },
          select: {
            id: true,
            codeName: true,
            name: true,
            nameLocalized: true,
            personality: true,
            backstory: true,
            region: true,
            voiceType: true,
            basePrice: true,
            rarity: true,
            tags: true,
            // 不获取用户关系数据，减少查询负担
          },
          orderBy: [
            { rarity: 'desc' }, // 按稀有度排序
            { basePrice: 'asc' }
          ]
        });
      }
    );
    
    return result.data;
  }

  // 获取用户伴侣（高度优化版本）
  static async getUserCompanions(userId: string): Promise<UserCompanionWithDetails[]> {
    const result = await QueryOptimizer.getUserCompanionsOptimized(userId);
    return result.data as UserCompanionWithDetails[];
  }

  // 优化的批量伴侣数据获取
  static async getUserCompanionsBatch(userIds: string[]): Promise<Map<string, UserCompanionWithDetails[]>> {
    const result = await QueryOptimizer.executeWithMonitoring(
      'getUserCompanionsBatch',
      async () => {
        const companions = await prisma.userCompanion.findMany({
          where: {
            userId: { in: userIds },
            isActive: true
          },
          select: {
            userId: true,
            id: true,
            relationshipLevel: true,
            intimacyPoints: true,
            totalInteractions: true,
            lastInteraction: true,
            currentMood: true,
            isPrimary: true,
            companion: {
              select: {
                id: true,
                codeName: true,
                name: true,
                nameLocalized: true,
                personality: true,
                region: true,
                rarity: true,
                tags: true
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { lastInteraction: 'desc' }
          ]
        });

        // 按用户分组
        const companionsByUser = new Map<string, UserCompanionWithDetails[]>();
        companions.forEach(companion => {
          const userId = companion.userId;
          if (!companionsByUser.has(userId)) {
            companionsByUser.set(userId, []);
          }
          companionsByUser.get(userId)!.push(companion as UserCompanionWithDetails);
        });

        return companionsByUser;
      }
    );

    return result.data;
  }

  // Unlock a companion for a user
  static async unlockCompanion(userId: string, companionId: string): Promise<UserCompanionWithDetails> {
    // Check if user already has this companion
    const existing = await prisma.userCompanion.findUnique({
      where: {
        userId_companionId: {
          userId,
          companionId
        }
      }
    });

    if (existing) {
      throw new Error('Companion already unlocked');
    }

    // Check companion price and user's balance
    const companion = await prisma.aICompanion.findUnique({
      where: { id: companionId }
    });

    if (!companion) {
      throw new Error('Companion not found');
    }

    if (companion.basePrice > 0) {
      const wisdomCoin = await prisma.wisdomCoin.findUnique({
        where: { userId }
      });

      if (!wisdomCoin || wisdomCoin.balance < companion.basePrice) {
        throw new Error('Insufficient wisdom coins');
      }

      // Deduct coins
      await prisma.wisdomCoin.update({
        where: { userId },
        data: {
          balance: { decrement: companion.basePrice },
          totalSpent: { increment: companion.basePrice }
        }
      });

      // Record transaction
      await prisma.coinTransaction.create({
        data: {
          userId,
          amount: -companion.basePrice,
          transactionType: 'purchase',
          description: `Unlocked companion: ${companion.name}`,
          metadata: { companionId }
        }
      });
    }

    // Create user-companion relationship
    const userCompanion = await prisma.userCompanion.create({
      data: {
        userId,
        companionId,
        relationshipLevel: 1,
        intimacyPoints: 0,
        totalInteractions: 0,
        currentMood: 'neutral',
        isPrimary: false
      },
      include: {
        companion: true
      }
    });

    // Create initial memory
    await prisma.companionMemory.create({
      data: {
        userCompanionId: userCompanion.id,
        memoryType: 'milestone',
        title: 'First Meeting',
        description: `You met ${companion.name} for the first time`,
        importance: 5
      }
    });

    return userCompanion as UserCompanionWithDetails;
  }

  // 优化的关系更新方法（事务处理）
  static async updateRelationship(
    userCompanionId: string,
    updates: {
      intimacyGain?: number;
      moodChange?: string;
      interactionType?: string;
    }
  ): Promise<void> {
    await QueryOptimizer.executeWithMonitoring(
      'updateRelationship',
      async () => {
        return await prisma.$transaction(async (tx) => {
          // 获取当前关系状态
          const userCompanion = await tx.userCompanion.findUnique({
            where: { id: userCompanionId },
            select: {
              id: true,
              userId: true,
              intimacyPoints: true,
              relationshipLevel: true,
              currentMood: true,
              totalInteractions: true
            }
          });

          if (!userCompanion) {
            throw new Error('User companion relationship not found');
          }

          // 准备更新数据
          const updateData: any = {
            totalInteractions: { increment: 1 },
            lastInteraction: new Date()
          };

          let shouldCreateMilestone = false;
          let newLevel = userCompanion.relationshipLevel;

          if (updates.intimacyGain && updates.intimacyGain > 0) {
            updateData.intimacyPoints = { increment: updates.intimacyGain };
            
            // 计算新的关系等级
            const newIntimacy = userCompanion.intimacyPoints + updates.intimacyGain;
            newLevel = Math.floor(newIntimacy / 100) + 1;
            
            if (newLevel > userCompanion.relationshipLevel && newLevel <= 100) {
              updateData.relationshipLevel = newLevel;
              shouldCreateMilestone = true;
            }
          }

          if (updates.moodChange) {
            updateData.currentMood = updates.moodChange;
          }

          // 批量执行更新
          const operations = [
            tx.userCompanion.update({
              where: { id: userCompanionId },
              data: updateData
            })
          ];

          // 记录互动
          if (updates.interactionType) {
            operations.push(
              tx.companionInteraction.create({
                data: {
                  userCompanionId,
                  interactionType: updates.interactionType,
                  intimacyGained: updates.intimacyGain || 0,
                  moodBefore: userCompanion.currentMood,
                  moodAfter: updates.moodChange || userCompanion.currentMood
                }
              })
            );
          }

          // 创建里程碑记忆
          if (shouldCreateMilestone) {
            operations.push(
              tx.companionMemory.create({
                data: {
                  userCompanionId,
                  memoryType: 'milestone',
                  title: `Relationship Level ${newLevel}`,
                  description: `Your bond has deepened to level ${newLevel}`,
                  importance: 7
                }
              })
            );
          }

          await Promise.all(operations);
          
          return { success: true };
        });
      }
    );
  }

  // Send gift to companion
  static async sendGift(
    userId: string,
    userCompanionId: string,
    itemId: string,
    quantity: number = 1
  ): Promise<void> {
    // Check if user owns the item
    const inventory = await prisma.userInventory.findUnique({
      where: {
        userId_itemId: {
          userId,
          itemId
        }
      },
      include: {
        item: true
      }
    });

    if (!inventory || inventory.quantity < quantity) {
      throw new Error('Insufficient items in inventory');
    }

    const item = inventory.item;
    
    // Calculate effects
    let intimacyGain = 0;
    let moodChange = 'happy';
    
    if (item.effectType === 'intimacy_boost' && item.effectValue) {
      intimacyGain = item.effectValue * quantity;
    } else if (item.effectType === 'mood_boost') {
      moodChange = 'excited';
      intimacyGain = 5 * quantity;
    } else if (item.effectType === 'relationship_boost' && item.effectValue) {
      intimacyGain = item.effectValue * quantity;
      moodChange = 'loved';
    }

    // Update inventory
    if (item.isConsumable) {
      if (inventory.quantity === quantity) {
        await prisma.userInventory.delete({
          where: { id: inventory.id }
        });
      } else {
        await prisma.userInventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: quantity } }
        });
      }
    }

    // Record gift
    await prisma.giftHistory.create({
      data: {
        userId,
        userCompanionId,
        itemId,
        quantity,
        intimacyGained,
        moodChange,
        message: `Thank you for the ${item.name}!`
      }
    });

    // Update relationship
    await this.updateRelationship(userCompanionId, {
      intimacyGain,
      moodChange,
      interactionType: 'gift'
    });
  }

  // Get companion dialogues
  static async getDialogues(
    companionId: string,
    context: string,
    relationshipLevel: number
  ): Promise<any[]> {
    return await prisma.companionDialogue.findMany({
      where: {
        companionId,
        context,
        relationLevel: { lte: relationshipLevel },
        isActive: true
      },
      orderBy: { weight: 'desc' }
    });
  }

  // Check and record intimacy view
  static async viewIntimacy(
    userId: string,
    companionId: string
  ): Promise<{ allowed: boolean; data?: any; nextAvailable?: Date }> {
    // Check last view
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingView = await prisma.intimacyView.findFirst({
      where: {
        userId,
        companionId,
        viewedAt: { gte: today }
      }
    });

    if (existingView) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        allowed: false,
        nextAvailable: tomorrow
      };
    }

    // Get user companion data
    const userCompanion = await prisma.userCompanion.findFirst({
      where: {
        userId,
        companionId
      },
      include: {
        companion: true
      }
    });

    if (!userCompanion) {
      throw new Error('Companion relationship not found');
    }

    // Record view
    await prisma.intimacyView.create({
      data: {
        userId,
        companionId,
        userCompanionId: userCompanion.id,
        intimacyLevel: userCompanion.relationshipLevel,
        reaction: this.getIntimacyReaction(userCompanion.relationshipLevel)
      }
    });

    return {
      allowed: true,
      data: {
        level: userCompanion.relationshipLevel,
        points: userCompanion.intimacyPoints,
        reaction: this.getIntimacyReaction(userCompanion.relationshipLevel),
        milestone: this.getRelationshipMilestone(userCompanion.relationshipLevel)
      }
    };
  }

  // Helper: Get intimacy reaction based on level
  private static getIntimacyReaction(level: number): string {
    if (level >= 90) return '我们的羁绊已经无法用言语形容了...';
    if (level >= 75) return '能遇见你，是我这辈子最幸运的事';
    if (level >= 50) return '你真的很了解我呢，谢谢你一直陪着我';
    if (level >= 25) return '和你在一起的时光总是那么开心';
    if (level >= 10) return '很高兴认识你，希望我们能成为好朋友';
    return '你终于来看我了...';
  }

  // Helper: Get relationship milestone
  private static getRelationshipMilestone(level: number): string {
    if (level >= 100) return '灵魂伴侣';
    if (level >= 75) return '恋人';
    if (level >= 50) return '知己';
    if (level >= 25) return '朋友';
    if (level >= 10) return '初识';
    return '陌生人';
  }

  // Get companion rankings
  static async getCompanionRankings(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    rankingType: 'quantity' | 'starPower' | 'charm' | 'value' | 'legend'
  ): Promise<any> {
    const latestRanking = await prisma.companionRanking.findFirst({
      where: {
        period,
        rankingType
      },
      orderBy: { periodEnd: 'desc' }
    });

    if (!latestRanking) {
      return { rankings: [], period, type: rankingType };
    }

    return {
      rankings: latestRanking.rankings,
      period,
      type: rankingType,
      periodStart: latestRanking.periodStart,
      periodEnd: latestRanking.periodEnd
    };
  }

  // Set primary companion
  static async setPrimaryCompanion(userId: string, userCompanionId: string): Promise<void> {
    // Reset all companions to non-primary
    await prisma.userCompanion.updateMany({
      where: { userId },
      data: { isPrimary: false }
    });

    // Set new primary
    await prisma.userCompanion.update({
      where: { id: userCompanionId },
      data: { isPrimary: true }
    });
  }
}