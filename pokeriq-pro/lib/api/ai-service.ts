import { AIOpponent, GameSession, TrainingSession } from '@/types';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

export interface GameState {
  position: string;
  cards: string[];
  communityCards: string[];
  pot: number;
  currentBet: number;
  stack: number;
  opponents: number;
  stage: 'preflop' | 'flop' | 'turn' | 'river';
}

export interface AIDecision {
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  amount?: number;
  confidence: number;
  reasoning: string;
  ev: number;
  alternatives: Array<{
    action: string;
    reason: string;
    risk: string;
    amount?: number;
  }>;
}

export interface HandAnalysis {
  handStrength: number;
  winProbability: number;
  potOdds: number;
  recommendedAction: string;
  explanation: string;
}

class AIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = AI_SERVICE_URL;
  }

  /**
   * 获取AI决策
   */
  async getDecision(gameState: GameState): Promise<AIDecision> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameState),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get AI decision:', error);
      // 返回默认决策
      return {
        action: 'check',
        confidence: 0.5,
        reasoning: '无法连接到AI服务，使用默认策略',
        ev: 0,
        alternatives: [],
      };
    }
  }

  /**
   * 分析手牌
   */
  async analyzeHand(gameState: Partial<GameState>): Promise<HandAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameState),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to analyze hand:', error);
      return {
        handStrength: 0.5,
        winProbability: 0.5,
        potOdds: 0,
        recommendedAction: 'check',
        explanation: '无法连接到AI服务',
      };
    }
  }

  /**
   * 获取所有AI对手
   */
  async getOpponents(): Promise<AIOpponent[]> {
    try {
      // 添加超时控制 - 2秒
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${this.baseUrl}/api/ai/opponents`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // 静默处理错误并返回默认对手
      return this.getDefaultOpponents();
    }
  }

  /**
   * 获取特定AI对手
   */
  async getOpponent(opponentId: string): Promise<AIOpponent | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/opponents/${opponentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`AI service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get opponent:', error);
      return null;
    }
  }

  /**
   * 开始训练会话
   */
  async startTrainingSession(
    mode: 'gto' | 'exploitative' | 'mixed',
    scenario: string,
    difficulty: string,
    opponentStyle: string
  ): Promise<{ sessionId: string; config: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/training/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          scenario,
          difficulty,
          opponent_style: opponentStyle,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        sessionId: data.session_id,
        config: data.config,
      };
    } catch (error) {
      console.error('Failed to start training session:', error);
      throw error;
    }
  }

  /**
   * 提交训练动作
   */
  async submitTrainingAction(sessionId: string, action: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/training/${sessionId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to submit training action:', error);
      throw error;
    }
  }

  /**
   * 获取训练统计
   */
  async getTrainingStats(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/training/${sessionId}/stats`);
      
      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get training stats:', error);
      throw error;
    }
  }

  /**
   * 获取默认AI对手列表（备用）
   */
  private getDefaultOpponents(): AIOpponent[] {
    return [
      {
        id: 'tag_01',
        name: 'TAG专家',
        style: 'tight-aggressive',
        difficulty: 'hard',
        avatar: '🎯',
        description: '紧凶型打法，只玩优质起手牌',
        stats: {
          vpip: 18,
          pfr: 15,
          af: 3.5,
          '3bet': 8,
        },
      },
      {
        id: 'lag_01',
        name: 'LAG疯子',
        style: 'loose-aggressive',
        difficulty: 'expert',
        avatar: '🔥',
        description: '松凶型打法，极具侵略性',
        stats: {
          vpip: 35,
          pfr: 28,
          af: 4.5,
          '3bet': 12,
        },
      },
      {
        id: 'fish_01',
        name: '鱼',
        style: 'loose-passive',
        difficulty: 'easy',
        avatar: '🐟',
        description: '松弱型打法，容易被剥削',
        stats: {
          vpip: 45,
          pfr: 8,
          af: 0.8,
          '3bet': 2,
        },
      },
    ];
  }
}

// 导出单例
export const aiService = new AIService();