import { PrismaClient } from '@prisma/client';
import { GTOEngine } from '../poker/gto-engine';

const prisma = new PrismaClient();
const gtoEngine = new GTOEngine();

export interface TestAnswer {
  scenarioId: string;
  action: 'fold' | 'check' | 'call' | 'raise';
  amount?: number;
  timeSpent: number;
}

export interface DimensionScores {
  aggression: number;
  tightness: number;
  position: number;
  handReading: number;
  mathematical: number;
  psychological: number;
}

export class SkillTestService {
  // 创建新的测试会话
  async createSession(userId: string, testType: 'quick' | 'standard' | 'deep') {
    try {
      // 获取用户当前的天梯排名
      const userRank = await prisma.ladderRank.findUnique({
        where: { userId }
      });

      const rankPoints = userRank?.rankPoints || 1000;

      // 创建测试会话
      const session = await prisma.testSession.create({
        data: {
          userId,
          testType,
          status: 'in_progress',
          rankPointsBefore: rankPoints,
          dimensionScores: {},
          detailedResults: [],
          bestDecisions: [],
          worstDecisions: []
        }
      });

      // 获取测试场景
      const questionCount = testType === 'quick' ? 20 : testType === 'standard' ? 50 : 100;
      const scenarios = await this.getTestScenarios(questionCount, rankPoints);

      return {
        sessionId: session.id,
        testType,
        scenarios,
        questionCount
      };
    } catch (error) {
      console.error('Error creating test session:', error);
      throw error;
    }
  }

  // 获取测试场景（基于用户水平动态调整难度）
  async getTestScenarios(count: number, userRankPoints: number) {
    try {
      // 根据用户积分确定难度范围
      let minDifficulty = 1;
      let maxDifficulty = 3;

      if (userRankPoints > 3000) {
        minDifficulty = 2;
        maxDifficulty = 4;
      }
      if (userRankPoints > 5000) {
        minDifficulty = 3;
        maxDifficulty = 5;
      }

      // 获取场景
      const scenarios = await prisma.testScenario.findMany({
        where: {
          difficulty: {
            gte: minDifficulty,
            lte: maxDifficulty
          },
          isActive: true
        },
        take: count,
        orderBy: {
          createdAt: 'asc'
        }
      });

      // 如果数据库场景不足，返回部分场景
      return scenarios;
    } catch (error) {
      console.error('Error getting test scenarios:', error);
      return [];
    }
  }

  // 提交单个答案
  async submitAnswer(sessionId: string, answer: TestAnswer) {
    try {
      const scenario = await prisma.testScenario.findUnique({
        where: { id: answer.scenarioId }
      });

      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // 计算得分
      const evaluation = await gtoEngine.evaluateDecision(
        scenario.situation as any,
        scenario.gtoSolution as any,
        answer.action,
        answer.amount
      );

      // 确定测试的技能维度
      const dimension = this.categorizeDimension(scenario.category, answer.action);

      // 创建测试结果记录
      const result = await prisma.testResult.create({
        data: {
          sessionId,
          scenarioId: answer.scenarioId,
          questionNumber: 0, // 这里应该追踪实际的题目编号
          userAction: answer.action,
          userAmount: answer.amount || 0,
          timeSpent: answer.timeSpent,
          gtoAction: evaluation.gtoAction,
          gtoAmount: evaluation.gtoAmount || 0,
          evLoss: evaluation.evLoss,
          score: evaluation.score,
          dimension,
          feedback: evaluation.feedback
        }
      });

      return {
        score: evaluation.score,
        feedback: evaluation.feedback,
        gtoAction: evaluation.gtoAction,
        evLoss: evaluation.evLoss
      };
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }

  // 完成测试并计算最终结果
  async completeTest(sessionId: string) {
    try {
      const session = await prisma.testSession.findUnique({
        where: { id: sessionId },
        include: { testResults: true }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // 计算六维得分
      const dimensionScores = this.calculateDimensionScores(session.testResults);

      // 计算总分
      const totalScore = Object.values(dimensionScores).reduce((a, b) => a + b, 0) / 6;

      // 生成玩家类型
      const playerType = this.generatePlayerType(dimensionScores);

      // 找出最佳和最差决策
      const sortedResults = [...session.testResults].sort((a, b) => b.score - a.score);
      const bestDecisions = sortedResults.slice(0, 3).map(r => ({
        scenarioId: r.scenarioId,
        score: r.score,
        evGain: -r.evLoss
      }));
      const worstDecisions = sortedResults.slice(-3).map(r => ({
        scenarioId: r.scenarioId,
        score: r.score,
        evLoss: r.evLoss
      }));

      // 更新天梯排名
      const rankUpdate = await this.updateLadderRank(session.userId, totalScore, playerType);

      // 更新会话
      const updatedSession = await prisma.testSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          totalScore,
          dimensionScores,
          playerType: playerType.code,
          playerTypeDesc: playerType.description,
          rankPointsAfter: rankUpdate.newPoints,
          rankChange: rankUpdate.change,
          completedAt: new Date(),
          bestDecisions,
          worstDecisions,
          avgDecisionTime: session.testResults.reduce((sum, r) => sum + r.timeSpent, 0) / session.testResults.length
        }
      });

      return {
        totalScore,
        dimensionScores,
        playerType,
        rankUpdate,
        bestDecisions,
        worstDecisions
      };
    } catch (error) {
      console.error('Error completing test:', error);
      throw error;
    }
  }

  // 计算六维得分
  private calculateDimensionScores(results: any[]): DimensionScores {
    const dimensions: DimensionScores = {
      aggression: 0,
      tightness: 0,
      position: 0,
      handReading: 0,
      mathematical: 0,
      psychological: 0
    };

    const counts: Record<string, number> = {
      aggression: 0,
      tightness: 0,
      position: 0,
      handReading: 0,
      mathematical: 0,
      psychological: 0
    };

    // 累加各维度得分
    results.forEach(result => {
      if (dimensions.hasOwnProperty(result.dimension)) {
        dimensions[result.dimension as keyof DimensionScores] += result.score;
        counts[result.dimension]++;
      }
    });

    // 计算平均分
    Object.keys(dimensions).forEach(key => {
      const dim = key as keyof DimensionScores;
      if (counts[key] > 0) {
        dimensions[dim] = Math.round(dimensions[dim] / counts[key]);
      } else {
        dimensions[dim] = 50; // 默认分数
      }
    });

    return dimensions;
  }

  // 生成玩家类型代码（类似MBTI）
  private generatePlayerType(scores: DimensionScores) {
    let code = '';
    let traits = [];

    // 第一位：紧凶度 T(Tight) / L(Loose)
    if (scores.tightness > 60) {
      code += 'T';
      traits.push('紧');
    } else {
      code += 'L';
      traits.push('松');
    }

    // 第二位：激进度 A(Aggressive) / P(Passive)
    if (scores.aggression > 60) {
      code += 'A';
      traits.push('凶');
    } else {
      code += 'P';
      traits.push('弱');
    }

    // 第三位：思维方式 M(Mathematical) / I(Intuitive)
    if (scores.mathematical > scores.psychological) {
      code += 'M';
      traits.push('数学');
    } else {
      code += 'I';
      traits.push('直觉');
    }

    // 第四位：风格 S(Stable) / V(Variable)
    const variance = Math.abs(scores.aggression - 50) + Math.abs(scores.tightness - 50);
    if (variance < 40) {
      code += 'S';
      traits.push('稳定');
    } else {
      code += 'V';
      traits.push('多变');
    }

    return {
      code,
      description: `${traits.join('-')}型玩家`,
      traits
    };
  }

  // 更新天梯排名
  private async updateLadderRank(userId: string, score: number, playerType: any) {
    try {
      const existingRank = await prisma.ladderRank.findUnique({
        where: { userId }
      });

      // ELO评分算法
      const K = 32; // K因子
      const expectedScore = 0.5; // 预期得分
      const actualScore = score / 100; // 实际得分（归一化）
      const pointChange = Math.round(K * (actualScore - expectedScore));

      const newPoints = (existingRank?.rankPoints || 1000) + pointChange;

      // 确定段位
      const newRank = this.getRankTier(newPoints);

      // 更新或创建排名记录
      const rankData = {
        rankPoints: newPoints,
        currentRank: newRank,
        lastTestAt: new Date(),
        totalTests: (existingRank?.totalTests || 0) + 1,
        bestScore: Math.max(score, existingRank?.bestScore || 0),
        avgScore: existingRank 
          ? (existingRank.avgScore * existingRank.totalTests + score) / (existingRank.totalTests + 1)
          : score,
        playerType: playerType.code,
        season: 1 // 当前赛季
      };

      const updatedRank = existingRank
        ? await prisma.ladderRank.update({
            where: { userId },
            data: rankData
          })
        : await prisma.ladderRank.create({
            data: { ...rankData, userId }
          });

      return {
        oldPoints: existingRank?.rankPoints || 1000,
        newPoints,
        change: pointChange,
        newRank,
        globalRank: await this.getGlobalRank(userId)
      };
    } catch (error) {
      console.error('Error updating ladder rank:', error);
      throw error;
    }
  }

  // 获取段位
  private getRankTier(points: number): string {
    if (points < 1000) return 'bronze';
    if (points < 2000) return 'silver';
    if (points < 3000) return 'gold';
    if (points < 4000) return 'platinum';
    if (points < 5000) return 'diamond';
    if (points < 6000) return 'master';
    if (points < 7000) return 'grandmaster';
    return 'legend';
  }

  // 获取全球排名
  private async getGlobalRank(userId: string) {
    const rank = await prisma.ladderRank.count({
      where: {
        rankPoints: {
          gt: (await prisma.ladderRank.findUnique({ where: { userId } }))?.rankPoints || 0
        }
      }
    });
    return rank + 1;
  }

  // 分类技能维度
  private categorizeDimension(category: string, action: string): string {
    // 根据场景类别和动作判断测试的技能维度
    if (category === 'preflop') {
      if (action === 'raise') return 'aggression';
      if (action === 'fold') return 'tightness';
      return 'position';
    }
    
    if (category === 'flop' || category === 'turn') {
      if (action === 'raise') return 'aggression';
      if (action === 'check' || action === 'call') return 'handReading';
      return 'mathematical';
    }
    
    if (category === 'river') {
      if (action === 'raise') return 'psychological';
      return 'mathematical';
    }
    
    return 'mathematical'; // 默认
  }

  // 获取用户测试历史
  async getUserHistory(userId: string) {
    try {
      const sessions = await prisma.testSession.findMany({
        where: { 
          userId,
          status: 'completed'
        },
        orderBy: { completedAt: 'desc' },
        take: 10
      });

      const ladderRank = await prisma.ladderRank.findUnique({
        where: { userId }
      });

      return {
        sessions,
        ladderRank,
        totalTests: sessions.length,
        averageScore: sessions.reduce((sum, s) => sum + s.totalScore, 0) / sessions.length || 0
      };
    } catch (error) {
      console.error('Error getting user history:', error);
      throw error;
    }
  }

  // 获取天梯排名列表
  async getLadderRankings(limit = 100) {
    try {
      const rankings = await prisma.ladderRank.findMany({
        orderBy: { rankPoints: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      });

      return rankings.map((rank, index) => ({
        rank: index + 1,
        userId: rank.userId,
        username: rank.user.username || 'Anonymous',
        avatar: rank.user.avatar,
        rankPoints: rank.rankPoints,
        currentRank: rank.currentRank,
        playerType: rank.playerType,
        totalTests: rank.totalTests,
        avgScore: rank.avgScore
      }));
    } catch (error) {
      console.error('Error getting ladder rankings:', error);
      throw error;
    }
  }
}

export const skillTestService = new SkillTestService();