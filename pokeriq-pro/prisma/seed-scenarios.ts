import { PrismaClient } from '@prisma/client';
import { testScenarios } from '../lib/data/test-scenarios';

const prisma = new PrismaClient();

async function seedTestScenarios() {
  console.log('🌱 开始种子化测试场景数据...');

  try {
    // 清除现有数据
    console.log('📝 清除现有测试场景数据...');
    await prisma.testScenario.deleteMany();

    // 插入测试场景
    console.log('📝 插入测试场景数据...');
    let insertedCount = 0;

    for (const scenario of testScenarios) {
      try {
        await prisma.testScenario.create({
          data: {
            id: scenario.id,
            category: scenario.category,
            difficulty: scenario.difficulty,
            position: scenario.position || 'UTG',
            stackSize: scenario.stackSize || 100,
            situation: scenario.situation as any,
            gtoSolution: scenario.gtoSolution as any,
            tags: JSON.stringify(scenario.tags || [])
          }
        });
        insertedCount++;
        console.log(`✅ 已插入场景: ${scenario.id} (${scenario.category})`);
      } catch (error) {
        console.error(`❌ 插入场景失败: ${scenario.id}`, error);
      }
    }

    console.log(`\n🎉 测试场景种子化完成！`);
    console.log(`📊 统计信息:`);
    console.log(`   - 成功插入: ${insertedCount} 个场景`);
    console.log(`   - 失败: ${testScenarios.length - insertedCount} 个场景`);

    // 验证数据
    const totalScenarios = await prisma.testScenario.count();
    const scenariosByCategory = await prisma.testScenario.groupBy({
      by: ['category'],
      _count: true
    });

    console.log(`\n📈 数据验证:`);
    console.log(`   - 数据库中总场景数: ${totalScenarios}`);
    console.log(`   - 各类别场景分布:`);
    scenariosByCategory.forEach(({ category, _count }) => {
      console.log(`     ${category}: ${_count} 个`);
    });

  } catch (error) {
    console.error('❌ 种子化过程中发生错误:', error);
    throw error;
  }
}

async function createDemoUsers() {
  console.log('👥 创建演示用户数据...');

  try {
    // 创建演示用户（如果不存在）
    const demoUsers = [
      {
        id: 'demo-user-id',
        email: 'demo@pokeriq.com',
        password: 'demo123', // 临时密码
        username: 'DemoPlayer',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'user-2',
        email: 'pokerpro@pokeriq.com',
        password: 'demo123',
        username: 'PokerPro2024',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'user-3',
        email: 'gtomaster@pokeriq.com',
        password: 'demo123',
        username: 'GTOMaster',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const userData of demoUsers) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { id: userData.id }
        });

        if (!existingUser) {
          await prisma.user.create({ data: userData });
          console.log(`✅ 创建用户: ${userData.username}`);
        } else {
          console.log(`⏭️  用户已存在: ${userData.username}`);
        }
      } catch (error) {
        console.error(`❌ 创建用户失败: ${userData.username}`, error);
      }
    }

  } catch (error) {
    console.error('❌ 创建演示用户失败:', error);
    throw error;
  }
}

async function createDemoLadderData() {
  console.log('🏆 创建天梯演示数据...');

  try {
    // 清除现有天梯数据
    await prisma.ladderRank.deleteMany();

    // 创建天梯数据
    const ladderData = [
      {
        userId: 'demo-user-id',
        rankPoints: 2850,
        currentRank: 'gold',
        playerType: 'TAMS',
        totalTests: 12,
        avgScore: 78.5,
        peakRank: 'platinum',
        peakPoints: 3200,
        globalPercentile: 25.5,
        rankPercentile: 65.2
      },
      {
        userId: 'user-2',
        rankPoints: 4200,
        currentRank: 'diamond',
        playerType: 'LAPP',
        totalTests: 28,
        avgScore: 85.2,
        peakRank: 'diamond',
        peakPoints: 4200,
        globalPercentile: 8.5,
        rankPercentile: 72.1
      },
      {
        userId: 'user-3',
        rankPoints: 5850,
        currentRank: 'master',
        playerType: 'TAMS',
        totalTests: 45,
        avgScore: 92.1,
        peakRank: 'grandmaster',
        peakPoints: 6200,
        globalPercentile: 1.2,
        rankPercentile: 88.5
      }
    ];

    for (const data of ladderData) {
      await prisma.ladderRank.create({ data });
      console.log(`✅ 创建天梯记录: ${data.userId} (${data.currentRank})`);
    }

  } catch (error) {
    console.error('❌ 创建天梯数据失败:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 开始数据库种子化...\n');

  try {
    await createDemoUsers();
    console.log('');
    
    await seedTestScenarios();
    console.log('');
    
    await createDemoLadderData();
    console.log('');

    console.log('🎉 所有种子化任务完成！');
    console.log('💡 现在可以启动应用测试技能测试功能了');

  } catch (error) {
    console.error('💥 种子化过程失败:', error);
    process.exit(1);
  }
}

// 运行种子化
main()
  .catch((error) => {
    console.error('💥 种子化脚本异常退出:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });