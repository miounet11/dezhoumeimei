import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestGameSessions() {
  console.log('🎮 创建测试游戏记录...');

  try {
    // 为test-user-1创建游戏记录
    const testSessions = [
      {
        userId: 'test-user-1',
        type: 'CASH',
        stakes: 'NL50',
        buyIn: 50,
        cashOut: 85,
        result: 'WIN',
        hands: 120,
        duration: 45,
        opponentIds: JSON.stringify(['ai-1', 'ai-2']),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 1) // 1小时前
      },
      {
        userId: 'test-user-1',
        type: 'TOURNAMENT',
        stakes: '$5 Buy-in',
        buyIn: 5,
        cashOut: 15,
        result: 'WIN',
        hands: 85,
        duration: 75,
        opponentIds: JSON.stringify(['ai-3', 'ai-4', 'ai-5']),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1天前
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 23) // 23小时前
      },
      {
        userId: 'test-user-1',
        type: 'CASH',
        stakes: '6-Max',
        buyIn: 20,
        cashOut: 12,
        result: 'LOSS',
        hands: 45,
        duration: 30,
        opponentIds: JSON.stringify(['ai-6', 'ai-7']),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2天前
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1800000) // 2天前+30分钟
      }
    ];

    // 为test-user-2创建游戏记录
    const testUser2Sessions = [
      {
        userId: 'test-user-2',
        type: 'CASH',
        stakes: 'NL100',
        buyIn: 100,
        cashOut: 180,
        result: 'WIN',
        hands: 200,
        duration: 90,
        opponentIds: JSON.stringify(['ai-1', 'ai-3', 'ai-5']),
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
        completedAt: new Date(Date.now() - 1000 * 60 * 5) // 5分钟前
      },
      {
        userId: 'test-user-2',
        type: 'TOURNAMENT',
        stakes: '$25 Buy-in',
        buyIn: 25,
        cashOut: 75,
        result: 'WIN',
        hands: 150,
        duration: 120,
        opponentIds: JSON.stringify(['ai-2', 'ai-4', 'ai-6', 'ai-7']),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6小时前
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4小时前
      }
    ];

    const allSessions = [...testSessions, ...testUser2Sessions];

    let createdCount = 0;
    for (const sessionData of allSessions) {
      try {
        const existingSession = await prisma.gameSession.findFirst({
          where: {
            userId: sessionData.userId,
            createdAt: sessionData.createdAt
          }
        });

        if (!existingSession) {
          await prisma.gameSession.create({ data: sessionData });
          console.log(`✅ 创建游戏记录: ${sessionData.userId} - ${sessionData.type}`);
          createdCount++;
        } else {
          console.log(`⏭️  游戏记录已存在: ${sessionData.userId} - ${sessionData.type}`);
        }
      } catch (error) {
        console.error(`❌ 创建游戏记录失败: ${sessionData.userId}`, error);
      }
    }

    console.log(`\n🎉 游戏记录创建完成！`);
    console.log(`📊 统计信息:`);
    console.log(`   - 成功创建: ${createdCount} 条记录`);
    console.log(`   - 跳过已存在: ${allSessions.length - createdCount} 条记录`);

  } catch (error) {
    console.error('❌ 创建游戏记录失败:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 开始创建测试游戏数据...\n');

  try {
    await createTestGameSessions();
    console.log('\n🎉 所有测试游戏数据创建完成！');
    console.log('💡 现在profile页面应该会显示真实的游戏历史了');

  } catch (error) {
    console.error('💥 测试数据创建失败:', error);
    process.exit(1);
  }
}

// 运行创建脚本
main()
  .catch((error) => {
    console.error('💥 脚本异常退出:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });