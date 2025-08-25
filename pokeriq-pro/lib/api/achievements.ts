import { api } from './client';
import { ApiResponse, Achievement, UserAchievement } from '@/types';

// 成就相关API接口
export const achievementsAPI = {
  // 获取所有成就
  async getAllAchievements(): Promise<ApiResponse<Achievement[]>> {
    // 模拟数据
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        name: '初出茅庐',
        description: '完成第一次AI训练',
        category: 'training',
        icon: '🎯',
        rarity: 'common',
        requirements: [
          { type: 'training_sessions', value: 1, description: '完成1次训练' }
        ],
        reward: { experience: 100 }
      },
      {
        id: '2',
        name: '连胜达人',
        description: '连续获胜10场训练',
        category: 'training',
        icon: '🔥',
        rarity: 'rare',
        requirements: [
          { type: 'win_streak', value: 10, description: '连续获胜10场' }
        ],
        reward: { experience: 500, badges: ['streak_master'] }
      },
      {
        id: '3',
        name: '完美主义者',
        description: '获得10次满分评价',
        category: 'stats',
        icon: '⭐',
        rarity: 'epic',
        requirements: [
          { type: 'perfect_scores', value: 10, description: '获得10次满分' }
        ],
        reward: { experience: 1000, badges: ['perfectionist'] }
      },
      {
        id: '4',
        name: '数据专家',
        description: '查看统计数据超过50次',
        category: 'stats',
        icon: '📊',
        rarity: 'common',
        requirements: [
          { type: 'analytics_views', value: 50, description: '查看统计50次' }
        ],
        reward: { experience: 200 }
      },
      {
        id: '5',
        name: '传奇大师',
        description: '达到专家级别并保持30天',
        category: 'milestone',
        icon: '👑',
        rarity: 'legendary',
        requirements: [
          { type: 'expert_level_days', value: 30, description: '专家级别保持30天' }
        ],
        reward: { experience: 5000, badges: ['legend', 'master'] }
      }
    ];

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: mockAchievements,
          message: '获取成就列表成功'
        });
      }, 600);
    });

    // return api.get<Achievement[]>('/achievements');
  },

  // 获取用户成就进度
  async getUserAchievements(userId: string): Promise<ApiResponse<UserAchievement[]>> {
    // 模拟数据
    const mockUserAchievements: UserAchievement[] = [
      {
        achievementId: '1',
        userId: userId,
        progress: 1,
        maxProgress: 1,
        isCompleted: true,
        completedAt: '2024-01-01T10:00:00.000Z'
      },
      {
        achievementId: '2',
        userId: userId,
        progress: 7,
        maxProgress: 10,
        isCompleted: false
      },
      {
        achievementId: '3',
        userId: userId,
        progress: 3,
        maxProgress: 10,
        isCompleted: false
      },
      {
        achievementId: '4',
        userId: userId,
        progress: 50,
        maxProgress: 50,
        isCompleted: true,
        completedAt: '2024-01-05T15:30:00.000Z'
      },
      {
        achievementId: '5',
        userId: userId,
        progress: 5,
        maxProgress: 30,
        isCompleted: false
      }
    ];

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: mockUserAchievements,
          message: '获取用户成就成功'
        });
      }, 500);
    });

    // return api.get<UserAchievement[]>(`/achievements/user/${userId}`);
  },

  // 解锁成就
  async unlockAchievement(userId: string, achievementId: string): Promise<ApiResponse<UserAchievement>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            achievementId,
            userId,
            progress: 1,
            maxProgress: 1,
            isCompleted: true,
            completedAt: new Date().toISOString()
          },
          message: '成就解锁成功'
        });
      }, 800);
    });

    // return api.post<UserAchievement>(`/achievements/unlock`, {
    //   userId,
    //   achievementId
    // });
  },

  // 更新成就进度
  async updateProgress(
    userId: string,
    achievementId: string,
    progress: number
  ): Promise<ApiResponse<UserAchievement>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            achievementId,
            userId,
            progress,
            maxProgress: 10, // 模拟数据
            isCompleted: progress >= 10,
            completedAt: progress >= 10 ? new Date().toISOString() : undefined
          },
          message: '成就进度更新成功'
        });
      }, 400);
    });

    // return api.put<UserAchievement>(`/achievements/progress`, {
    //   userId,
    //   achievementId,
    //   progress
    // });
  },

  // 检查成就（基于用户行为自动触发）
  async checkAchievements(
    userId: string,
    actionType: string,
    actionData: any
  ): Promise<ApiResponse<{
    unlockedAchievements?: UserAchievement[];
    updatedProgress?: UserAchievement[];
  }>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟根据用户行为检查成就
        const unlockedAchievements: UserAchievement[] = [];
        const updatedProgress: UserAchievement[] = [];

        // 根据不同的行为类型处理成就
        if (actionType === 'training_completed') {
          updatedProgress.push({
            achievementId: '2',
            userId,
            progress: 8,
            maxProgress: 10,
            isCompleted: false
          });
        }

        if (actionType === 'perfect_score') {
          updatedProgress.push({
            achievementId: '3',
            userId,
            progress: 4,
            maxProgress: 10,
            isCompleted: false
          });
        }

        resolve({
          success: true,
          data: {
            unlockedAchievements,
            updatedProgress
          },
          message: '成就检查完成'
        });
      }, 600);
    });

    // return api.post<{
    //   unlockedAchievements?: UserAchievement[];
    //   updatedProgress?: UserAchievement[];
    // }>('/achievements/check', {
    //   userId,
    //   actionType,
    //   actionData
    // });
  },

  // 获取成就统计
  async getAchievementStats(userId: string): Promise<ApiResponse<{
    totalAchievements: number;
    unlockedAchievements: number;
    totalExperience: number;
    rarityBreakdown: Record<string, number>;
    recentUnlocks: Array<{ achievementId: string; unlockedAt: string }>;
  }>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            totalAchievements: 25,
            unlockedAchievements: 8,
            totalExperience: 2350,
            rarityBreakdown: {
              common: 12,
              rare: 8,
              epic: 4,
              legendary: 1
            },
            recentUnlocks: [
              { achievementId: '4', unlockedAt: '2024-01-05T15:30:00.000Z' },
              { achievementId: '1', unlockedAt: '2024-01-01T10:00:00.000Z' }
            ]
          },
          message: '获取成就统计成功'
        });
      }, 700);
    });

    // return api.get<{
    //   totalAchievements: number;
    //   unlockedAchievements: number;
    //   totalExperience: number;
    //   rarityBreakdown: Record<string, number>;
    //   recentUnlocks: Array<{ achievementId: string; unlockedAt: string }>;
    // }>(`/achievements/stats/${userId}`);
  },

  // 获取成就排行榜
  async getLeaderboard(limit = 10): Promise<ApiResponse<Array<{
    userId: string;
    username: string;
    totalAchievements: number;
    totalExperience: number;
    level: number;
  }>>> {
    return new Promise((resolve) => {
      const mockLeaderboard = [
        {
          userId: '1',
          username: 'PokerMaster',
          totalAchievements: 23,
          totalExperience: 12500,
          level: 25
        },
        {
          userId: '2',
          username: 'CardShark',
          totalAchievements: 21,
          totalExperience: 11200,
          level: 22
        },
        {
          userId: '3',
          username: 'BluffKing',
          totalAchievements: 19,
          totalExperience: 9800,
          level: 20
        }
      ];

      setTimeout(() => {
        resolve({
          success: true,
          data: mockLeaderboard,
          message: '获取排行榜成功'
        });
      }, 800);
    });

    // return api.get<Array<{
    //   userId: string;
    //   username: string;
    //   totalAchievements: number;
    //   totalExperience: number;
    //   level: number;
    // }>>(`/achievements/leaderboard?limit=${limit}`);
  },

  // 获取每日挑战
  async getDailyChallenges(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description: string;
    requirement: { type: string; value: number; description: string };
    reward: { experience: number; badges?: string[] };
    progress: number;
    maxProgress: number;
    isCompleted: boolean;
    expiresAt: string;
  }>>> {
    return new Promise((resolve) => {
      const mockChallenges = [
        {
          id: 'daily_1',
          name: '今日训练',
          description: '完成3次训练会话',
          requirement: { type: 'training_sessions', value: 3, description: '完成3次训练' },
          reward: { experience: 200 },
          progress: 1,
          maxProgress: 3,
          isCompleted: false,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'daily_2',
          name: '精准决策',
          description: '达到80%以上准确率',
          requirement: { type: 'accuracy', value: 80, description: '达到80%准确率' },
          reward: { experience: 300, badges: ['precise'] },
          progress: 75,
          maxProgress: 80,
          isCompleted: false,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setTimeout(() => {
        resolve({
          success: true,
          data: mockChallenges,
          message: '获取每日挑战成功'
        });
      }, 500);
    });

    // return api.get('/achievements/daily-challenges');
  },

  // 领取成就奖励
  async claimReward(userId: string, achievementId: string): Promise<ApiResponse<{
    experience: number;
    badges?: string[];
  }>> {
    return api.post<{
      experience: number;
      badges?: string[];
    }>('/achievements/claim-reward', {
      userId,
      achievementId
    });
  }
};