import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { AI_COMPANIONS, S_TIER_COMPANIONS } from '@/data/companions';

// GET: 获取所有可用的AI陪伴
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // 获取所有基础陪伴
    const allCompanions = [...AI_COMPANIONS];
    
    // 检查用户是否解锁了S级陪伴
    if (userId) {
      try {
        const userCompanions = await prisma.userCompanion.findMany({
          where: { userId },
          include: {
            companion: true
          }
        });
        
        // 检查是否满足S级解锁条件
        const hasWon1000BB = false; // 需要从游戏统计中获取
        const hasAllCompanions = userCompanions.length >= AI_COMPANIONS.length;
        
        if (hasWon1000BB || hasAllCompanions) {
          allCompanions.push(...S_TIER_COMPANIONS);
        }
        
        // 标记已拥有的陪伴
        const companionsWithOwnership = allCompanions.map(companion => ({
          ...companion,
          owned: userCompanions.some(uc => uc.companion.codeName === companion.codeName),
          relationship: userCompanions.find(uc => uc.companion.codeName === companion.codeName)
        }));
        
        return NextResponse.json({
          success: true,
          companions: companionsWithOwnership,
          userStats: {
            totalOwned: userCompanions.length,
            canAccessArena: userCompanions.length >= 6
          }
        });
      } catch (dbError) {
        // 如果数据库出错，返回基础数据
        console.error('Database error:', dbError);
        return NextResponse.json({
          success: true,
          companions: allCompanions,
          userStats: {
            totalOwned: 0,
            canAccessArena: false
          }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      companions: allCompanions
    });
    
  } catch (error) {
    console.error('Get companions error:', error);
    return NextResponse.json(
      { error: '获取陪伴列表失败' },
      { status: 500 }
    );
  }
}

// POST: 解锁新的AI陪伴
export async function POST(request: NextRequest) {
  try {
    const { userId, companionCodeName } = await request.json();
    
    if (!userId || !companionCodeName) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 查找陪伴配置
    const companionData = [...AI_COMPANIONS, ...S_TIER_COMPANIONS]
      .find(c => c.codeName === companionCodeName);
    
    if (!companionData) {
      return NextResponse.json(
        { error: '陪伴不存在' },
        { status: 404 }
      );
    }
    
    // 检查用户智慧币余额
    try {
      const wisdomCoin = await prisma.wisdomCoin.findUnique({
        where: { userId }
      });
      
      if (!wisdomCoin || wisdomCoin.balance < companionData.basePrice) {
        return NextResponse.json(
          { error: '智慧币不足' },
          { status: 400 }
        );
      }
      
      // 创建或获取AI陪伴记录
      let aiCompanion = await prisma.aICompanion.findUnique({
        where: { codeName: companionCodeName }
      });
      
      if (!aiCompanion) {
        aiCompanion = await prisma.aICompanion.create({
          data: {
            codeName: companionData.codeName,
            name: companionData.name,
            nameLocalized: companionData.nameLocalized,
            personality: companionData.personality,
            backstory: companionData.backstory,
            region: companionData.region,
            voiceType: companionData.voiceType,
            basePrice: companionData.basePrice,
            rarity: companionData.rarity,
            tags: companionData.tags
          }
        });
      }
      
      // 创建用户与陪伴的关系
      const userCompanion = await prisma.userCompanion.create({
        data: {
          userId,
          companionId: aiCompanion.id,
          relationshipLevel: 1,
          intimacyPoints: 0,
          currentMood: 'happy',
          isActive: true,
          isPrimary: false
        }
      });
      
      // 扣除智慧币
      if (companionData.basePrice > 0) {
        await prisma.wisdomCoin.update({
          where: { userId },
          data: {
            balance: { decrement: companionData.basePrice },
            totalSpent: { increment: companionData.basePrice }
          }
        });
        
        // 记录交易
        await prisma.coinTransaction.create({
          data: {
            userId,
            amount: -companionData.basePrice,
            transactionType: 'purchase',
            description: `解锁陪伴：${companionData.nameLocalized.zh}`,
            metadata: {
              companionId: aiCompanion.id,
              companionName: companionData.name
            }
          }
        });
      }
      
      return NextResponse.json({
        success: true,
        companion: userCompanion,
        message: `成功解锁${companionData.nameLocalized.zh}！`
      });
      
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      
      // 返回模拟成功响应（用于演示）
      return NextResponse.json({
        success: true,
        companion: {
          id: `demo-${companionCodeName}`,
          companionId: companionCodeName,
          relationshipLevel: 1,
          intimacyPoints: 0,
          currentMood: 'happy'
        },
        message: `成功解锁${companionData.nameLocalized.zh}！（演示模式）`
      });
    }
    
  } catch (error) {
    console.error('Unlock companion error:', error);
    return NextResponse.json(
      { error: '解锁陪伴失败' },
      { status: 500 }
    );
  }
}