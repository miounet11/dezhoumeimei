import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🧪 创建测试用户账号...');

  try {
    const testUsers = [
      {
        id: 'test-user-1',
        email: 'test1@gmail.com',
        password: '1234567890',
        username: 'PokerNewbie',
        name: '扑克新手',
        level: 1,
        xp: 50,
        isVip: false,
        vipExpiry: null,
        loginCount: 3,
        lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3天前
        updatedAt: new Date()
      },
      {
        id: 'test-user-2',
        email: 'test2@gmail.com',
        password: '1234567890',
        username: 'CardShark88',
        name: '扑克爱好者',
        level: 5,
        xp: 1250,
        isVip: true,
        vipExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30天后过期
        loginCount: 25,
        lastLoginAt: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15天前
        updatedAt: new Date()
      },
      {
        id: 'test-user-3',
        email: 'test3@gmail.com',
        password: '1234567890',
        username: 'BluffMaster',
        name: '诈唬大师',
        level: 8,
        xp: 3200,
        isVip: true,
        vipExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60天后过期
        loginCount: 45,
        lastLoginAt: new Date(Date.now() - 1000 * 60 * 10), // 10分钟前
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30天前
        updatedAt: new Date()
      },
      {
        id: 'test-user-4',
        email: 'test4@gmail.com',
        password: '1234567890',
        username: 'CasualPlayer',
        name: '休闲玩家',
        level: 3,
        xp: 420,
        isVip: false,
        vipExpiry: null,
        loginCount: 8,
        lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12小时前
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7天前
        updatedAt: new Date()
      },
      {
        id: 'test-user-5',
        email: 'test5@gmail.com',
        password: '1234567890',
        username: 'PokerPro2024',
        name: '专业玩家',
        level: 12,
        xp: 8500,
        isVip: true,
        vipExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90天后过期
        loginCount: 88,
        lastLoginAt: new Date(Date.now() - 1000 * 60 * 5), // 5分钟前
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60天前
        updatedAt: new Date()
      }
    ];

    // 创建测试用户
    let createdCount = 0;
    for (const userData of testUsers) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (!existingUser) {
          await prisma.user.create({ data: userData });
          console.log(`✅ 创建测试用户: ${userData.email} (${userData.username})`);
          createdCount++;
        } else {
          console.log(`⏭️  用户已存在: ${userData.email}`);
        }
      } catch (error) {
        console.error(`❌ 创建用户失败: ${userData.email}`, error);
      }
    }

    console.log(`\n🎉 测试用户创建完成！`);
    console.log(`📊 统计信息:`);
    console.log(`   - 成功创建: ${createdCount} 个用户`);
    console.log(`   - 跳过已存在: ${testUsers.length - createdCount} 个用户`);

    // 为测试用户创建一些统计数据
    console.log('\n📈 创建用户统计数据...');
    await createTestUserStats();

    // 为测试用户创建一些天梯数据
    console.log('🏆 创建用户天梯数据...');
    await createTestLadderData();

    // 为测试用户创建AI伴侣
    console.log('🤖 创建用户AI伴侣...');
    await createTestCompanions();

    // 为测试用户创建成就数据
    console.log('🏅 创建用户成就数据...');
    await createTestAchievements();

  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
    throw error;
  }
}

async function createTestUserStats() {
  const testUserStats = [
    {
      userId: 'test-user-1',
      totalHands: 150,
      totalGames: 45,
      winRate: 45.3,
      totalEarnings: 560,
      currentStreak: 2,
      bestStreak: 8,
      vpip: 22.5,
      pfr: 18.2,
      af: 2.8,
      threeBet: 12.4,
      cbet: 65.2,
      trainingHours: 15.5
    },
    {
      userId: 'test-user-2',
      totalHands: 320,
      totalGames: 88,
      winRate: 58.1,
      totalEarnings: 1480,
      currentStreak: 5,
      bestStreak: 12,
      vpip: 19.8,
      pfr: 15.6,
      af: 2.4,
      threeBet: 8.9,
      cbet: 72.3,
      trainingHours: 28.2
    },
    {
      userId: 'test-user-3',
      totalHands: 480,
      totalGames: 125,
      winRate: 64.2,
      totalEarnings: 2380,
      currentStreak: 3,
      bestStreak: 15,
      vpip: 25.4,
      pfr: 20.1,
      af: 3.2,
      threeBet: 15.8,
      cbet: 68.1,
      trainingHours: 42.5
    },
    {
      userId: 'test-user-4',
      totalHands: 95,
      totalGames: 22,
      winRate: 40.0,
      totalEarnings: -430,
      currentStreak: -2,
      bestStreak: 6,
      vpip: 28.5,
      pfr: 12.4,
      af: 1.8,
      threeBet: 6.2,
      cbet: 58.9,
      trainingHours: 8.5
    },
    {
      userId: 'test-user-5',
      totalHands: 650,
      totalGames: 185,
      winRate: 72.4,
      totalEarnings: 3560,
      currentStreak: 8,
      bestStreak: 22,
      vpip: 21.2,
      pfr: 17.8,
      af: 2.9,
      threeBet: 11.6,
      cbet: 78.4,
      trainingHours: 85.3
    }
  ];

  for (const statsData of testUserStats) {
    try {
      const existingStats = await prisma.userStats.findUnique({
        where: { userId: statsData.userId }
      });

      if (!existingStats) {
        await prisma.userStats.create({ data: statsData });
        console.log(`✅ 创建统计数据: ${statsData.userId}`);
      } else {
        console.log(`⏭️  统计数据已存在: ${statsData.userId}`);
      }
    } catch (error) {
      console.error(`❌ 创建统计数据失败: ${statsData.userId}`, error);
    }
  }
}

async function createTestLadderData() {
  const testLadderData = [
    {
      userId: 'test-user-1',
      rankPoints: 1850,
      currentRank: 'silver',
      playerType: 'TAAP',
      totalTests: 8,
      avgScore: 72.5,
      peakRank: 'gold',
      peakPoints: 2100,
      globalPercentile: 45.2,
      rankPercentile: 68.1
    },
    {
      userId: 'test-user-2',
      rankPoints: 2450,
      currentRank: 'gold',
      playerType: 'LAMS',
      totalTests: 15,
      avgScore: 78.9,
      peakRank: 'gold',
      peakPoints: 2450,
      globalPercentile: 32.1,
      rankPercentile: 72.3
    },
    {
      userId: 'test-user-3',
      rankPoints: 3650,
      currentRank: 'platinum',
      playerType: 'TAMS',
      totalTests: 22,
      avgScore: 84.2,
      peakRank: 'platinum',
      peakPoints: 3650,
      globalPercentile: 18.5,
      rankPercentile: 55.8
    },
    {
      userId: 'test-user-4',
      rankPoints: 1420,
      currentRank: 'bronze',
      playerType: 'LAPP',
      totalTests: 5,
      avgScore: 65.8,
      peakRank: 'silver',
      peakPoints: 1680,
      globalPercentile: 68.4,
      rankPercentile: 42.1
    },
    {
      userId: 'test-user-5',
      rankPoints: 4850,
      currentRank: 'diamond',
      playerType: 'TASS',
      totalTests: 35,
      avgScore: 88.6,
      peakRank: 'diamond',
      peakPoints: 4850,
      globalPercentile: 8.2,
      rankPercentile: 78.9
    }
  ];

  for (const ladderData of testLadderData) {
    try {
      const existingLadder = await prisma.ladderRank.findUnique({
        where: { userId: ladderData.userId }
      });

      if (!existingLadder) {
        await prisma.ladderRank.create({ data: ladderData });
        console.log(`✅ 创建天梯数据: ${ladderData.userId} (${ladderData.currentRank})`);
      } else {
        console.log(`⏭️  天梯数据已存在: ${ladderData.userId}`);
      }
    } catch (error) {
      console.error(`❌ 创建天梯数据失败: ${ladderData.userId}`, error);
    }
  }
}

async function createTestCompanions() {
  // 首先获取可用的伴侣类型
  const companionTypes = await prisma.aICompanion.findMany({
    take: 10 // 获取前10个伴侣
  });

  if (companionTypes.length === 0) {
    console.log('⚠️  没有找到伴侣类型，跳过创建用户伴侣');
    return;
  }

  const testCompanionData = [
    // test-user-1: 新手，1个免费伴侣
    {
      userId: 'test-user-1',
      companionId: companionTypes[0]?.id,
      relationshipLevel: 1,
      intimacyPoints: 50,
      totalInteractions: 5,
      lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 6)
    },
    // test-user-2: VIP用户，2个伴侣 
    {
      userId: 'test-user-2', 
      companionId: companionTypes[0]?.id,
      relationshipLevel: 3,
      intimacyPoints: 850,
      totalInteractions: 25,
      lastInteraction: new Date(Date.now() - 1000 * 60 * 20)
    },
    {
      userId: 'test-user-2',
      companionId: companionTypes[1]?.id,
      relationshipLevel: 2,
      intimacyPoints: 420,
      totalInteractions: 15,
      lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    // test-user-5: 专业用户，多个伴侣
    {
      userId: 'test-user-5',
      companionId: companionTypes[0]?.id,
      relationshipLevel: 8,
      intimacyPoints: 4580,
      totalInteractions: 120,
      lastInteraction: new Date(Date.now() - 1000 * 60 * 2)
    }
  ].filter(data => data.companionId); // 过滤掉没有companionId的项

  for (const companionData of testCompanionData) {
    try {
      const existing = await prisma.userCompanion.findFirst({
        where: {
          userId: companionData.userId,
          companionId: companionData.companionId
        }
      });

      if (!existing && companionData.companionId) {
        await prisma.userCompanion.create({ data: companionData });
        console.log(`✅ 创建伴侣关系: ${companionData.userId} -> ${companionData.companionId}`);
      } else {
        console.log(`⏭️  伴侣关系已存在: ${companionData.userId}`);
      }
    } catch (error) {
      console.error(`❌ 创建伴侣关系失败: ${companionData.userId}`, error);
    }
  }
}

async function createTestAchievements() {
  // 获取一些成就
  const achievements = await prisma.achievement.findMany({
    take: 15
  });

  if (achievements.length === 0) {
    console.log('⚠️  没有找到成就，跳过创建用户成就');
    return;
  }

  const testAchievementData = [
    // test-user-1: 新手成就
    {
      userId: 'test-user-1',
      achievementId: achievements[0]?.id || 'achievement-1',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      progress: 100
    },
    // test-user-2: 中级成就
    {
      userId: 'test-user-2',
      achievementId: achievements[0]?.id || 'achievement-1',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      progress: 100
    },
    {
      userId: 'test-user-2',
      achievementId: achievements[1]?.id || 'achievement-2',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      progress: 100
    },
    {
      userId: 'test-user-2',
      achievementId: achievements[2]?.id || 'achievement-3',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
      progress: 100
    },
    // test-user-3: 高级成就
    {
      userId: 'test-user-3',
      achievementId: achievements[0]?.id || 'achievement-1',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28),
      progress: 100
    },
    {
      userId: 'test-user-3',
      achievementId: achievements[1]?.id || 'achievement-2',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
      progress: 100
    },
    {
      userId: 'test-user-3',
      achievementId: achievements[2]?.id || 'achievement-3',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
      progress: 100
    },
    {
      userId: 'test-user-3',
      achievementId: achievements[3]?.id || 'achievement-4',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
      progress: 100
    },
    {
      userId: 'test-user-3',
      achievementId: achievements[4]?.id || 'achievement-5',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
      progress: 100
    },
    // test-user-4: 少量成就
    {
      userId: 'test-user-4',
      achievementId: achievements[0]?.id || 'achievement-1',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      progress: 100
    },
    // test-user-5: 大量成就
    {
      userId: 'test-user-5',
      achievementId: achievements[0]?.id || 'achievement-1',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 58),
      progress: 100
    },
    {
      userId: 'test-user-5',
      achievementId: achievements[1]?.id || 'achievement-2',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 55),
      progress: 100
    },
    {
      userId: 'test-user-5',
      achievementId: achievements[2]?.id || 'achievement-3',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50),
      progress: 100
    },
    {
      userId: 'test-user-5',
      achievementId: achievements[3]?.id || 'achievement-4',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
      progress: 100
    },
    {
      userId: 'test-user-5',
      achievementId: achievements[4]?.id || 'achievement-5',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40),
      progress: 100
    },
    {
      userId: 'test-user-5',
      achievementId: achievements[5]?.id || 'achievement-6',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
      progress: 100
    },
    {
      userId: 'test-user-5',
      achievementId: achievements[6]?.id || 'achievement-7',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
      progress: 100
    },
    {
      userId: 'test-user-5',
      achievementId: achievements[7]?.id || 'achievement-8',
      unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
      progress: 100
    }
  ];

  for (const achievementData of testAchievementData) {
    try {
      if (!achievementData.achievementId) continue;

      const existing = await prisma.userAchievement.findFirst({
        where: {
          userId: achievementData.userId,
          achievementId: achievementData.achievementId
        }
      });

      if (!existing) {
        await prisma.userAchievement.create({ data: achievementData });
        console.log(`✅ 创建成就记录: ${achievementData.userId} -> ${achievementData.achievementId}`);
      } else {
        console.log(`⏭️  成就记录已存在: ${achievementData.userId}`);
      }
    } catch (error) {
      console.error(`❌ 创建成就记录失败: ${achievementData.userId}`, error);
    }
  }
}

async function main() {
  console.log('🚀 开始创建测试用户数据...\n');

  try {
    await createTestUsers();
    console.log('\n🎉 所有测试数据创建完成！');
    console.log('💡 现在可以使用以下账号登录测试：');
    console.log('   test1@gmail.com ~ test5@gmail.com');
    console.log('   密码: 1234567890');

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