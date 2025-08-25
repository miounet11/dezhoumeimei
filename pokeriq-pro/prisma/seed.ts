import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 创建测试用户
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User',
      username: 'demo_player',
      level: 5,
      xp: 2500,
      stats: {
        create: {
          totalHands: 5000,
          totalGames: 100,
          winRate: 52.5,
          totalEarnings: 25000,
          currentStreak: 5,
          bestStreak: 12,
          vpip: 24.5,
          pfr: 18.2,
          af: 2.8,
          threeBet: 7.5,
          cbet: 65.3,
          trainingHours: 120,
        }
      }
    }
  });

  // 创建AI对手数据
  const opponents = [
    {
      name: 'Rookie Bot',
      style: 'loose-passive',
      difficulty: 'easy',
      winRate: 35,
      description: '适合初学者，决策相对简单',
      avatar: '🤖',
      vpip: 45,
      pfr: 8,
      af: 0.8,
      threeBet: 2,
      bluffFrequency: 5,
      tiltTendency: 20,
      adaptability: 10,
    },
    {
      name: 'TAG Master',
      style: 'tight-aggressive',
      difficulty: 'medium',
      winRate: 52,
      description: '标准TAG打法，稳健而有攻击性',
      avatar: '🎯',
      vpip: 24,
      pfr: 19,
      af: 3.2,
      threeBet: 8,
      bluffFrequency: 15,
      tiltTendency: 5,
      adaptability: 40,
      requiredLevel: 5,
    },
    {
      name: 'LAG Shark',
      style: 'loose-aggressive',
      difficulty: 'hard',
      winRate: 58,
      description: '激进的LAG风格，频繁施压',
      avatar: '🦈',
      vpip: 32,
      pfr: 26,
      af: 4.5,
      threeBet: 12,
      bluffFrequency: 25,
      tiltTendency: 10,
      adaptability: 60,
      requiredLevel: 10,
    },
    {
      name: 'GTO Solver',
      style: 'balanced',
      difficulty: 'expert',
      winRate: 65,
      description: '接近GTO的打法，极难对抗',
      avatar: '🧠',
      vpip: 26,
      pfr: 21,
      af: 3.0,
      threeBet: 9,
      bluffFrequency: 18,
      tiltTendency: 0,
      adaptability: 90,
      requiredLevel: 20,
      unlockPrice: 1000,
    },
    {
      name: 'Maniac',
      style: 'maniac',
      difficulty: 'medium',
      winRate: 48,
      description: '极度激进，高频诈唬',
      avatar: '🔥',
      vpip: 65,
      pfr: 45,
      af: 6.0,
      threeBet: 18,
      bluffFrequency: 40,
      tiltTendency: 30,
      adaptability: 20,
      requiredLevel: 8,
    },
    {
      name: 'Rock',
      style: 'tight-passive',
      difficulty: 'easy',
      winRate: 42,
      description: '极度保守，只玩强牌',
      avatar: '🗿',
      vpip: 12,
      pfr: 8,
      af: 1.2,
      threeBet: 3,
      bluffFrequency: 2,
      tiltTendency: 5,
      adaptability: 15,
    },
  ];

  for (const opponent of opponents) {
    await prisma.opponent.create({
      data: opponent
    });
  }

  // 创建成就数据
  const achievements = [
    {
      code: 'first_win',
      name: '首次胜利',
      description: '赢得第一场比赛',
      category: 'MILESTONE' as const,
      rarity: 'COMMON' as const,
      icon: '🏆',
      requirement: { type: 'win', count: 1 },
      reward: { xp: 100 }
    },
    {
      code: 'hand_master',
      name: '手牌大师',
      description: '完成1000手牌',
      category: 'STATS' as const,
      rarity: 'RARE' as const,
      icon: '🎯',
      requirement: { type: 'hands', count: 1000 },
      reward: { xp: 500 }
    },
    {
      code: 'winning_streak',
      name: '连胜之王',
      description: '连续赢得10场比赛',
      category: 'SPECIAL' as const,
      rarity: 'EPIC' as const,
      icon: '🔥',
      requirement: { type: 'streak', count: 10 },
      reward: { xp: 1000 }
    },
    {
      code: 'gto_master',
      name: 'GTO大师',
      description: '在GTO训练中达到90%正确率',
      category: 'TRAINING' as const,
      rarity: 'LEGENDARY' as const,
      icon: '🧮',
      requirement: { type: 'gto_accuracy', percent: 90 },
      reward: { xp: 2000, title: 'GTO Master' }
    },
    {
      code: 'profit_machine',
      name: '盈利机器',
      description: '累计盈利达到100,000',
      category: 'STATS' as const,
      rarity: 'EPIC' as const,
      icon: '💰',
      requirement: { type: 'profit', amount: 100000 },
      reward: { xp: 1500 }
    },
    {
      code: 'night_owl',
      name: '夜猫子',
      description: '深夜训练超过50小时',
      category: 'SPECIAL' as const,
      rarity: 'RARE' as const,
      icon: '🦉',
      requirement: { type: 'night_training', hours: 50 },
      reward: { xp: 300 }
    },
    {
      code: 'bluff_expert',
      name: '诈唬专家',
      description: '成功诈唬100次',
      category: 'STATS' as const,
      rarity: 'RARE' as const,
      icon: '🃏',
      requirement: { type: 'bluff', count: 100 },
      reward: { xp: 600 }
    },
    {
      code: 'comeback_king',
      name: '逆转之王',
      description: '从落后50%筹码逆转获胜',
      category: 'SPECIAL' as const,
      rarity: 'LEGENDARY' as const,
      icon: '👑',
      requirement: { type: 'comeback', deficit: 50 },
      reward: { xp: 2500, title: 'Comeback King' }
    }
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {},
      create: achievement
    });
  }

  // 为测试用户添加一些成就
  const userAchievements = await prisma.achievement.findMany({
    where: {
      code: {
        in: ['first_win', 'hand_master', 'winning_streak']
      }
    }
  });

  for (const achievement of userAchievements) {
    await prisma.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId: demoUser.id,
          achievementId: achievement.id
        }
      },
      update: {},
      create: {
        userId: demoUser.id,
        achievementId: achievement.id,
        progress: 100,
        completed: true,
        unlockedAt: new Date()
      }
    });
  }

  // 创建一些游戏会话记录
  const sessions = [
    {
      userId: demoUser.id,
      type: 'CASH' as const,
      stakes: '1/2',
      buyIn: 200,
      cashOut: 350,
      result: 'WIN' as const,
      hands: 45,
      duration: 120,
      opponentIds: JSON.stringify(['ai_tag_1', 'ai_lag_1', 'ai_rock_1']),
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 昨天
    },
    {
      userId: demoUser.id,
      type: 'TOURNAMENT' as const,
      stakes: 'MTT',
      buyIn: 100,
      cashOut: 500,
      result: 'WIN' as const,
      hands: 150,
      duration: 180,
      opponentIds: JSON.stringify(['ai_tag_2', 'ai_maniac_1', 'ai_fish_1']),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 前天
    },
    {
      userId: demoUser.id,
      type: 'TRAINING' as const,
      stakes: '2/5',
      buyIn: 500,
      cashOut: 450,
      result: 'LOSS' as const,
      hands: 80,
      duration: 60,
      opponentIds: JSON.stringify(['ai_gto_1', 'ai_balanced_1']),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3天前
    }
  ];

  for (const session of sessions) {
    await prisma.gameSession.create({
      data: session
    });
  }

  // 创建训练会话记录
  const trainingSession = await prisma.trainingSession.create({
    data: {
      userId: demoUser.id,
      mode: 'GTO',
      scenario: 'Button vs BB 3-bet pot',
      difficulty: 'INTERMEDIATE',
      opponentStyle: 'tight-aggressive',
      handsPlayed: 25,
      correctDecisions: 20,
      score: 80,
      totalProfit: 150,
      completedAt: new Date()
    }
  });

  // 创建初始排行榜数据
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const leaderboardEntries = [
    {
      userId: demoUser.id,
      period: 'daily',
      category: 'winRate',
      score: 65.5,
      rank: 1,
      periodStart: todayStart,
      periodEnd: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
      metadata: { hands: 150, wins: 98 },
    },
    {
      userId: demoUser.id,
      period: 'weekly',
      category: 'profit',
      score: 5280,
      rank: 3,
      periodStart: weekStart,
      periodEnd: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      metadata: { sessions: 42, bestWin: 1250 },
    },
    {
      userId: demoUser.id,
      period: 'monthly',
      category: 'hands',
      score: 3250,
      rank: 12,
      periodStart: monthStart,
      periodEnd: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0),
      metadata: { avgPot: 125, vpip: 28.5 },
    },
  ];

  for (const entry of leaderboardEntries) {
    await prisma.leaderboardEntry.create({
      data: entry
    });
  }

  // 创建对话模板
  const dialogueTemplates = [
    {
      context: 'greeting',
      mood: 'happy',
      template: '欢迎回来！今天想要挑战什么难度呢？',
      weight: 100,
    },
    {
      context: 'win',
      mood: 'excited',
      template: '太棒了！这一手打得真漂亮！',
      weight: 90,
    },
    {
      context: 'loss',
      mood: 'sad',
      template: '别灰心，下次一定会更好的...',
      weight: 85,
    },
    {
      context: 'advice',
      template: '这里可以考虑check-raise，给对手施加压力',
      weight: 95,
    },
    {
      context: 'flirt',
      mood: 'happy',
      template: '和你一起练习真的很开心呢~',
      weight: 80,
      requiredLevel: 25,
    },
  ];

  for (const template of dialogueTemplates) {
    await prisma.dialogueTemplate.create({
      data: template
    });
  }

  console.log('数据库种子数据创建成功！');
  console.log('测试账号: demo@example.com / demo123');
  console.log('AI对手数量:', opponents.length);
  console.log('成就数量:', achievements.length);
  console.log('排行榜数据已初始化');
}

main()
  .catch((e) => {
    console.error('种子数据创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });