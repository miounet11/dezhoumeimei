import { api } from './client';
import { ApiResponse, TrainingSession, TrainingScenario, AIRecommendation, PaginatedResponse } from '@/types';

// 训练相关API接口
export const trainingAPI = {
  // 获取训练场景列表
  async getScenarios(filters?: {
    difficulty?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<TrainingScenario[]>> {
    // 模拟数据
    const mockScenarios: TrainingScenario[] = [
      {
        id: '1',
        name: 'Pre-flop决策基础',
        description: '学习不同位置的起手牌选择和加注策略',
        difficulty: 'beginner',
        category: 'pre_flop',
        gameState: {} as any, // 简化处理
        correctAction: 'call',
        explanation: '在这个位置，跟注是最优选择'
      },
      {
        id: '2',
        name: 'Flop后续决策',
        description: '分析公共牌面，做出正确的下注决策',
        difficulty: 'intermediate',
        category: 'post_flop',
        gameState: {} as any,
        correctAction: 'raise',
        explanation: '牌面有利，应该主动下注'
      },
      {
        id: '3',
        name: '底池赔率计算',
        description: '掌握底池赔率和成牌概率的计算方法',
        difficulty: 'advanced',
        category: 'pot_odds',
        gameState: {} as any,
        correctAction: 'call',
        explanation: '底池赔率支持跟注决策'
      },
      {
        id: '4',
        name: '虚张声势识别',
        description: '学会识别对手的虚张声势并做出反制',
        difficulty: 'expert',
        category: 'bluffing',
        gameState: {} as any,
        correctAction: 'call',
        explanation: '对手行为模式显示虚张声势可能性较高'
      }
    ];

    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredScenarios = mockScenarios;
        
        if (filters?.difficulty && filters.difficulty !== 'all') {
          filteredScenarios = filteredScenarios.filter(s => s.difficulty === filters.difficulty);
        }
        
        if (filters?.category && filters.category !== 'all') {
          filteredScenarios = filteredScenarios.filter(s => s.category === filters.category);
        }
        
        resolve({
          success: true,
          data: filteredScenarios,
          message: '获取训练场景成功'
        });
      }, 800);
    });

    // const queryParams = api.buildQueryParams(filters || {});
    // return api.get<TrainingScenario[]>(`/training/scenarios?${queryParams}`);
  },

  // 获取单个训练场景
  async getScenario(scenarioId: string): Promise<ApiResponse<TrainingScenario>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            id: scenarioId,
            name: 'Pre-flop决策基础',
            description: '学习不同位置的起手牌选择和加注策略',
            difficulty: 'beginner',
            category: 'pre_flop',
            gameState: {} as any,
            correctAction: 'call',
            explanation: '在这个位置，跟注是最优选择'
          },
          message: '获取场景详情成功'
        });
      }, 500);
    });

    // return api.get<TrainingScenario>(`/training/scenarios/${scenarioId}`);
  },

  // 开始训练会话
  async startSession(scenarioId: string, difficulty: string): Promise<ApiResponse<TrainingSession>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            id: `session_${Date.now()}`,
            userId: '1',
            scenario: '场景训练',
            difficulty: difficulty as any,
            startTime: new Date().toISOString(),
            handsPlayed: 0,
            correctDecisions: 0,
            totalDecisions: 0,
            score: 0,
            improvements: []
          },
          message: '训练会话开始'
        });
      }, 1000);
    });

    // return api.post<TrainingSession>('/training/sessions', {
    //   scenarioId,
    //   difficulty
    // });
  },

  // 结束训练会话
  async endSession(sessionId: string): Promise<ApiResponse<TrainingSession>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            id: sessionId,
            userId: '1',
            scenario: '场景训练',
            difficulty: 'intermediate',
            startTime: '2024-01-07T10:00:00.000Z',
            endTime: new Date().toISOString(),
            handsPlayed: 15,
            correctDecisions: 12,
            totalDecisions: 15,
            score: 80,
            improvements: ['提高位置意识', '改善下注尺度']
          },
          message: '训练会话结束'
        });
      }, 800);
    });

    // return api.put<TrainingSession>(`/training/sessions/${sessionId}/end`);
  },

  // 提交决策
  async submitDecision(
    sessionId: string,
    scenarioId: string,
    decision: string,
    timeSpent: number
  ): Promise<ApiResponse<{ isCorrect: boolean; feedback: string; score: number }>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isCorrect = Math.random() > 0.3; // 70%正确率模拟
        resolve({
          success: true,
          data: {
            isCorrect,
            feedback: isCorrect ? '决策正确！' : '需要改进，建议考虑位置因素',
            score: Math.floor(Math.random() * 100) + 1
          },
          message: '决策提交成功'
        });
      }, 600);
    });

    // return api.post<{ isCorrect: boolean; feedback: string; score: number }>(
    //   `/training/sessions/${sessionId}/decisions`,
    //   {
    //     scenarioId,
    //     decision,
    //     timeSpent
    //   }
    // );
  },

  // 获取AI建议
  async getAIRecommendation(scenarioId: string): Promise<ApiResponse<AIRecommendation>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            action: 'call',
            confidence: 0.85,
            reasoning: '基于当前牌面和位置分析，跟注是最优策略。考虑到底池赔率和对手的行动模式。',
            alternativeActions: [
              {
                action: 'fold',
                confidence: 0.1,
                reasoning: '过于保守，会错失有利机会'
              },
              {
                action: 'raise',
                confidence: 0.05,
                reasoning: '过于激进，风险收益比不佳'
              }
            ]
          },
          message: 'AI建议获取成功'
        });
      }, 1200);
    });

    // return api.get<AIRecommendation>(`/training/scenarios/${scenarioId}/ai-recommendation`);
  },

  // 获取训练历史
  async getTrainingHistory(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<TrainingSession>>> {
    return new Promise((resolve) => {
      const mockSessions: TrainingSession[] = [
        {
          id: '1',
          userId: '1',
          scenario: 'Pre-flop决策训练',
          difficulty: 'intermediate',
          startTime: '2024-01-07T09:00:00.000Z',
          endTime: '2024-01-07T09:25:00.000Z',
          handsPlayed: 20,
          correctDecisions: 16,
          totalDecisions: 20,
          score: 80,
          improvements: ['提高位置意识']
        },
        {
          id: '2',
          userId: '1',
          scenario: '底池赔率计算',
          difficulty: 'advanced',
          startTime: '2024-01-06T14:30:00.000Z',
          endTime: '2024-01-06T15:10:00.000Z',
          handsPlayed: 15,
          correctDecisions: 14,
          totalDecisions: 15,
          score: 93,
          improvements: ['计算速度提升']
        }
      ];

      setTimeout(() => {
        resolve({
          success: true,
          data: {
            data: mockSessions,
            total: mockSessions.length,
            page,
            limit,
            totalPages: Math.ceil(mockSessions.length / limit)
          },
          message: '获取训练历史成功'
        });
      }, 600);
    });

    // return api.get<PaginatedResponse<TrainingSession>>(
    //   `/training/sessions?page=${page}&limit=${limit}`
    // );
  },

  // 获取训练统计
  async getTrainingStats(userId?: string): Promise<ApiResponse<{
    totalSessions: number;
    totalHands: number;
    averageScore: number;
    accuracyTrend: Array<{ date: string; accuracy: number }>;
  }>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            totalSessions: 156,
            totalHands: 2340,
            averageScore: 78.5,
            accuracyTrend: [
              { date: '2024-01-01', accuracy: 65 },
              { date: '2024-01-02', accuracy: 72 },
              { date: '2024-01-03', accuracy: 68 },
              { date: '2024-01-04', accuracy: 76 },
              { date: '2024-01-05', accuracy: 82 },
              { date: '2024-01-06', accuracy: 88 },
              { date: '2024-01-07', accuracy: 92 }
            ]
          },
          message: '获取训练统计成功'
        });
      }, 800);
    });

    // const queryParams = userId ? `?userId=${userId}` : '';
    // return api.get(`/training/stats${queryParams}`);
  },

  // 创建自定义场景
  async createCustomScenario(scenario: Partial<TrainingScenario>): Promise<ApiResponse<TrainingScenario>> {
    return api.post<TrainingScenario>('/training/scenarios/custom', scenario);
  },

  // 更新自定义场景
  async updateCustomScenario(scenarioId: string, scenario: Partial<TrainingScenario>): Promise<ApiResponse<TrainingScenario>> {
    return api.put<TrainingScenario>(`/training/scenarios/custom/${scenarioId}`, scenario);
  },

  // 删除自定义场景
  async deleteCustomScenario(scenarioId: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/training/scenarios/custom/${scenarioId}`);
  },

  // 收藏场景
  async favoriteScenario(scenarioId: string): Promise<ApiResponse<null>> {
    return api.post<null>(`/training/scenarios/${scenarioId}/favorite`);
  },

  // 取消收藏场景
  async unfavoriteScenario(scenarioId: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/training/scenarios/${scenarioId}/favorite`);
  },

  // 获取收藏的场景
  async getFavoriteScenarios(): Promise<ApiResponse<TrainingScenario[]>> {
    return api.get<TrainingScenario[]>('/training/scenarios/favorites');
  },

  // 举报场景
  async reportScenario(scenarioId: string, reason: string): Promise<ApiResponse<null>> {
    return api.post<null>(`/training/scenarios/${scenarioId}/report`, { reason });
  }
};