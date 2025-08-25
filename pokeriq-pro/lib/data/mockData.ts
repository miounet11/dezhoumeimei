import { User, Achievement, TrainingScenario, GameStats } from '@/types';

// 集中管理所有Mock数据
export const mockData = {
  users: {
    demo: {
      id: '1',
      username: 'PokerPro123',
      email: 'demo@example.com',
      level: 15,
      experience: 7850,
      totalGamesPlayed: 156,
      winRate: 68.2,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-07T00:00:00.000Z'
    } as User,
  },

  achievements: [
    {
      id: '1',
      name: '连胜大师',
      description: '连续获胜10局',
      category: 'stats',
      icon: '🔥',
      rarity: 'rare',
      requirements: [
        {
          type: 'consecutive_wins',
          value: 10,
          description: '连续获胜10局'
        }
      ],
      reward: {
        experience: 500,
        badges: ['streak_master']
      }
    },
    {
      id: '2',
      name: 'GTO学者',
      description: '完成100个GTO训练场景',
      category: 'training',
      icon: '🎓',
      rarity: 'epic',
      requirements: [
        {
          type: 'gto_scenarios_completed',
          value: 100,
          description: '完成100个GTO训练场景'
        }
      ],
      reward: {
        experience: 1000,
        badges: ['gto_scholar']
      }
    }
  ] as Achievement[],

  trainingScenarios: [
    {
      id: '1',
      name: 'Pre-flop决策',
      description: '在不同位置学习正确的Pre-flop游戏',
      difficulty: 'beginner',
      category: 'pre_flop',
      gameState: {
        id: 'scenario-1',
        phase: 'pre_flop',
        players: [],
        communityCards: [],
        pot: 150,
        currentBet: 50,
        activePlayerIndex: 0,
        dealerIndex: 2,
        smallBlind: 25,
        bigBlind: 50
      },
      correctAction: 'raise',
      explanation: '在这个位置持有强牌时，加注是最优选择'
    }
  ] as TrainingScenario[],

  gameStats: {
    totalHands: 1234,
    handsWon: 845,
    winRate: 68.5,
    vpip: 24.5,
    pfr: 18.2,
    af: 2.8,
    wtsd: 28.5,
    w$sd: 64.2,
    totalProfit: 45280,
    bigBlindsWon: 12.8
  } as GameStats,

  recentGames: [
    { id: 1, type: 'NL Hold\'em', result: '胜利', earnings: 280, date: '2024-01-07' },
    { id: 2, type: 'Tournament', result: '第3名', earnings: 1500, date: '2024-01-06' },
    { id: 3, type: 'Cash Game', result: '胜利', earnings: 450, date: '2024-01-06' },
    { id: 4, type: 'Sit & Go', result: '第2名', earnings: 200, date: '2024-01-05' },
  ],

  // 图表数据
  chartData: {
    winRate: [
      { date: '2024-01-01', winRate: 62.5 },
      { date: '2024-01-02', winRate: 65.2 },
      { date: '2024-01-03', winRate: 63.8 },
      { date: '2024-01-04', winRate: 68.1 },
      { date: '2024-01-05', winRate: 66.9 },
      { date: '2024-01-06', winRate: 69.3 },
      { date: '2024-01-07', winRate: 68.5 },
    ],
    profit: [
      { date: '2024-01-01', profit: 42430 },
      { date: '2024-01-02', profit: 43120 },
      { date: '2024-01-03', profit: 42890 },
      { date: '2024-01-04', profit: 44250 },
      { date: '2024-01-05', profit: 44680 },
      { date: '2024-01-06', profit: 45130 },
      { date: '2024-01-07', profit: 45280 },
    ],
    handsPlayed: [
      { date: '2024-01-01', handsPlayed: 25 },
      { date: '2024-01-02', handsPlayed: 32 },
      { date: '2024-01-03', handsPlayed: 18 },
      { date: '2024-01-04', handsPlayed: 41 },
      { date: '2024-01-05', handsPlayed: 28 },
      { date: '2024-01-06', handsPlayed: 35 },
      { date: '2024-01-07', handsPlayed: 22 },
    ]
  }
};

// 获取Mock数据的辅助函数
export const getMockData = {
  user: (email: string) => {
    if (email === 'demo@example.com') {
      return mockData.users.demo;
    }
    return null;
  },
  
  userStats: () => mockData.gameStats,
  
  achievements: () => mockData.achievements,
  
  trainingScenarios: (difficulty?: string) => {
    if (difficulty) {
      return mockData.trainingScenarios.filter(s => s.difficulty === difficulty);
    }
    return mockData.trainingScenarios;
  },
  
  recentGames: () => mockData.recentGames,
  
  chartData: (type: keyof typeof mockData.chartData) => mockData.chartData[type]
};