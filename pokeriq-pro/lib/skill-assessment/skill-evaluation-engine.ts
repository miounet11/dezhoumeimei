/**
 * 六维技能评估引擎 - 构建科学的用户技能画像和评估系统
 * 
 * 核心目标: 构建六维技能评估体系，实现精准的用户技能分析和个性化学习路径
 * 
 * 六维技能体系:
 * 1. 翻前决策 (Preflop) - 0-2000分
 * 2. 翻后游戏 (Postflop) - 0-2000分  
 * 3. 心理博弈 (Psychology) - 0-2000分
 * 4. 数学计算 (Mathematics) - 0-2000分
 * 5. 资金管理 (Bankroll) - 0-2000分
 * 6. 锦标赛技巧 (Tournament) - 0-2000分
 */

import { PrismaClient } from '@prisma/client';
import { GTOEngine } from '../poker/gto-engine';
import { createLogger } from '../logger';
import { HandEvaluator } from '../poker/hand-evaluator';

const logger = createLogger('skill-evaluation-engine');
const prisma = new PrismaClient();

// 六维技能定义
export interface SkillDimensions {
  preflop: number;      // 翻前决策 (0-2000)
  postflop: number;     // 翻后游戏 (0-2000) 
  psychology: number;   // 心理博弈 (0-2000)
  mathematics: number;  // 数学计算 (0-2000)
  bankroll: number;     // 资金管理 (0-2000)
  tournament: number;   // 锦标赛技巧 (0-2000)
}

// 用户行为特征
export interface BehaviorProfile {
  aggressionIndex: number;      // 激进指数 (0-100)
  tightnessIndex: number;       // 紧松指数 (0-100)  
  adaptabilityIndex: number;    // 适应性指数 (0-100)
  consistencyIndex: number;     // 一致性指数 (0-100)
  riskToleranceIndex: number;   // 风险容忍度 (0-100)
  learningSpeedIndex: number;   // 学习速度指数 (0-100)
}

// 弱点识别结果
export interface WeaknessAnalysis {
  primaryWeaknesses: Array<{
    dimension: keyof SkillDimensions;
    score: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    improvementPotential: number;
  }>;
  behavioralPatterns: Array<{
    pattern: string;
    frequency: number;
    impact: number;
    recommendation: string;
  }>;
  skillGaps: Array<{
    skill: string;
    currentLevel: number;
    targetLevel: number;
    priority: number;
  }>;
}

// 学习风格识别
export interface LearningStyle {
  primaryStyle: 'visual' | 'auditory' | 'kinesthetic' | 'analytical';
  preferredDifficulty: 'gradual' | 'challenging' | 'adaptive';
  learningPace: 'slow' | 'medium' | 'fast';
  feedbackPreference: 'immediate' | 'summary' | 'detailed';
  motivationFactors: string[];
}

// 个人化建议
export interface PersonalizedRecommendations {
  immediate: Array<{
    action: string;
    priority: number;
    expectedImprovement: number;
    timeframe: string;
  }>;
  shortTerm: Array<{
    goal: string;
    steps: string[];
    measurableOutcome: string;
    duration: string;
  }>;
  longTerm: Array<{
    objective: string;
    milestones: string[];
    requiredSkills: string[];
    timeline: string;
  }>;
}

// 技能进展追踪
export interface SkillProgress {
  userId: string;
  currentSkills: SkillDimensions;
  previousSkills: SkillDimensions;
  trend: 'improving' | 'declining' | 'stable';
  progressRate: number;  // 进步速度
  projectedSkills: SkillDimensions;  // 预测技能水平
  timeToTarget: { [K in keyof SkillDimensions]: number }; // 达到目标的时间(天)
}

// 评估配置
export interface EvaluationConfig {
  minDataPoints: number;        // 最小数据点要求
  accuracyThreshold: number;    // 准确率阈值
  confidenceLevel: number;      // 置信水平
  adaptiveWeights: boolean;     // 是否使用自适应权重
  machineLearningEnabled: boolean; // 是否启用机器学习
}

export class SkillEvaluationEngine {
  private gtoEngine: GTOEngine;
  private config: EvaluationConfig;
  
  // 机器学习模型权重 (简化的线性模型)
  private modelWeights = {
    preflop: {
      vpip: 0.3,
      pfr: 0.25, 
      threeBet: 0.2,
      position: 0.15,
      handSelection: 0.1
    },
    postflop: {
      cbet: 0.25,
      foldToCbet: 0.2,
      aggression: 0.2,
      potControl: 0.15,
      bluffCatching: 0.2
    },
    psychology: {
      readingTells: 0.3,
      deception: 0.25,
      tiltControl: 0.2,
      exploiting: 0.15,
      tableImage: 0.1
    },
    mathematics: {
      potOdds: 0.3,
      equity: 0.25,
      ev: 0.2,
      combinatorics: 0.15,
      gameTheory: 0.1
    },
    bankroll: {
      riskManagement: 0.35,
      stakeSelection: 0.25,
      variance: 0.2,
      discipline: 0.2
    },
    tournament: {
      icm: 0.3,
      bubble: 0.25,
      stackManagement: 0.2,
      final: 0.15,
      timing: 0.1
    }
  };

  constructor(config: Partial<EvaluationConfig> = {}) {
    this.gtoEngine = new GTOEngine();
    this.config = {
      minDataPoints: 50,
      accuracyThreshold: 0.85,
      confidenceLevel: 0.95,
      adaptiveWeights: true,
      machineLearningEnabled: true,
      ...config
    };

    logger.info('SkillEvaluationEngine initialized', { config: this.config });
  }

  /**
   * 核心功能: 实时技能评估和更新
   * 准确率要求: >85%
   */
  async evaluateUserSkills(userId: string): Promise<{
    skills: SkillDimensions;
    confidence: number;
    accuracy: number;
    lastUpdated: Date;
  }> {
    logger.info(`Starting skill evaluation for user ${userId}`);
    
    try {
      // 获取用户游戏数据
      const gameData = await this.getUserGameData(userId);
      
      if (gameData.totalHands < this.config.minDataPoints) {
        logger.warn(`Insufficient data for user ${userId}: ${gameData.totalHands} hands`);
        return this.getDefaultSkillProfile(userId);
      }

      // 计算六维技能分数
      const skills = await this.calculateSkillDimensions(gameData);
      
      // 计算评估准确率和置信度
      const { accuracy, confidence } = this.calculateEvaluationMetrics(gameData, skills);
      
      if (accuracy < this.config.accuracyThreshold) {
        logger.warn(`Low accuracy for user ${userId}: ${accuracy}`);
      }

      // 保存评估结果
      await this.saveSkillEvaluation(userId, skills, accuracy, confidence);
      
      logger.info(`Skill evaluation completed for user ${userId}`, {
        accuracy,
        confidence,
        totalSkillPoints: Object.values(skills).reduce((a, b) => a + b, 0)
      });

      return {
        skills,
        confidence,
        accuracy,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error(`Error evaluating skills for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 用户行为特征提取系统
   */
  async extractBehaviorProfile(userId: string): Promise<BehaviorProfile> {
    const gameData = await this.getUserGameData(userId);
    
    return {
      aggressionIndex: this.calculateAggressionIndex(gameData),
      tightnessIndex: this.calculateTightnessIndex(gameData),
      adaptabilityIndex: this.calculateAdaptabilityIndex(gameData),
      consistencyIndex: this.calculateConsistencyIndex(gameData),
      riskToleranceIndex: this.calculateRiskToleranceIndex(gameData),
      learningSpeedIndex: this.calculateLearningSpeedIndex(gameData)
    };
  }

  /**
   * 弱点识别和分析引擎
   * 精准度要求: >80%
   */
  async identifyWeaknesses(userId: string): Promise<WeaknessAnalysis> {
    const skills = await this.evaluateUserSkills(userId);
    const behaviorProfile = await this.extractBehaviorProfile(userId);
    const gameData = await this.getUserGameData(userId);
    
    // 识别主要弱点
    const primaryWeaknesses = this.identifyPrimaryWeaknesses(skills.skills);
    
    // 分析行为模式
    const behavioralPatterns = this.analyzeBehavioralPatterns(gameData, behaviorProfile);
    
    // 识别技能差距
    const skillGaps = this.identifySkillGaps(skills.skills, gameData);
    
    logger.info(`Weakness analysis completed for user ${userId}`, {
      weaknessCount: primaryWeaknesses.length,
      patternCount: behavioralPatterns.length
    });

    return {
      primaryWeaknesses,
      behavioralPatterns,
      skillGaps
    };
  }

  /**
   * 学习风格识别算法
   */
  async identifyLearningStyle(userId: string): Promise<LearningStyle> {
    const gameData = await this.getUserGameData(userId);
    const testResults = await this.getUserTestResults(userId);
    
    // 分析学习偏好
    const primaryStyle = this.determinePrimaryLearningStyle(testResults);
    const preferredDifficulty = this.analyzePreferredDifficulty(testResults);
    const learningPace = this.calculateLearningPace(gameData, testResults);
    const feedbackPreference = this.analyzeFeedbackPreference(testResults);
    const motivationFactors = this.identifyMotivationFactors(gameData, testResults);
    
    return {
      primaryStyle,
      preferredDifficulty,
      learningPace,
      feedbackPreference,
      motivationFactors
    };
  }

  /**
   * 技能进展追踪系统
   */
  async trackSkillProgress(userId: string): Promise<SkillProgress> {
    const currentSkills = await this.evaluateUserSkills(userId);
    const previousSkills = await this.getPreviousSkillEvaluation(userId);
    
    if (!previousSkills) {
      // 首次评估，无法计算趋势
      return {
        userId,
        currentSkills: currentSkills.skills,
        previousSkills: currentSkills.skills,
        trend: 'stable',
        progressRate: 0,
        projectedSkills: currentSkills.skills,
        timeToTarget: this.calculateInitialTimeToTarget(currentSkills.skills)
      };
    }
    
    // 计算进步趋势
    const trend = this.calculateProgressTrend(currentSkills.skills, previousSkills);
    const progressRate = this.calculateProgressRate(currentSkills.skills, previousSkills);
    
    // 预测未来技能水平
    const projectedSkills = this.predictFutureSkills(currentSkills.skills, progressRate);
    
    // 计算达到目标的时间
    const timeToTarget = this.calculateTimeToTarget(currentSkills.skills, progressRate);
    
    return {
      userId,
      currentSkills: currentSkills.skills,
      previousSkills,
      trend,
      progressRate,
      projectedSkills,
      timeToTarget
    };
  }

  /**
   * 个性化建议生成
   */
  async generateRecommendations(userId: string): Promise<PersonalizedRecommendations> {
    const weaknesses = await this.identifyWeaknesses(userId);
    const learningStyle = await this.identifyLearningStyle(userId);
    const progress = await this.trackSkillProgress(userId);
    
    // 生成即时建议
    const immediate = this.generateImmediateRecommendations(weaknesses, learningStyle);
    
    // 生成短期目标
    const shortTerm = this.generateShortTermGoals(weaknesses, progress);
    
    // 生成长期规划
    const longTerm = this.generateLongTermObjectives(progress, learningStyle);
    
    return {
      immediate,
      shortTerm,
      longTerm
    };
  }

  // ============ 私有方法实现 ============

  /**
   * 获取用户游戏数据
   */
  private async getUserGameData(userId: string) {
    const [userStats, sessions, hands] = await Promise.all([
      prisma.userStats.findUnique({
        where: { userId },
        include: { user: true }
      }),
      prisma.gameSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.hand.findMany({
        where: { 
          session: { userId }
        },
        orderBy: { createdAt: 'desc' },
        take: 1000
      })
    ]);

    return {
      userStats,
      sessions,
      hands,
      totalHands: userStats?.totalHands || 0,
      totalGames: userStats?.totalGames || 0,
      winRate: userStats?.winRate || 0,
      vpip: userStats?.vpip || 0,
      pfr: userStats?.pfr || 0,
      af: userStats?.af || 0,
      threeBet: userStats?.threeBet || 0,
      cbet: userStats?.cbet || 0
    };
  }

  /**
   * 计算六维技能分数
   */
  private async calculateSkillDimensions(gameData: any): Promise<SkillDimensions> {
    const preflop = await this.calculatePreflopSkill(gameData);
    const postflop = await this.calculatePostflopSkill(gameData);
    const psychology = await this.calculatePsychologySkill(gameData);
    const mathematics = await this.calculateMathematicsSkill(gameData);
    const bankroll = await this.calculateBankrollSkill(gameData);
    const tournament = await this.calculateTournamentSkill(gameData);
    
    return {
      preflop: Math.max(0, Math.min(2000, preflop)),
      postflop: Math.max(0, Math.min(2000, postflop)),
      psychology: Math.max(0, Math.min(2000, psychology)),
      mathematics: Math.max(0, Math.min(2000, mathematics)),
      bankroll: Math.max(0, Math.min(2000, bankroll)),
      tournament: Math.max(0, Math.min(2000, tournament))
    };
  }

  /**
   * 计算翻前决策技能 (0-2000分)
   */
  private async calculatePreflopSkill(gameData: any): Promise<number> {
    const weights = this.modelWeights.preflop;
    let score = 1000; // 基础分数
    
    // VPIP 分析 (Voluntarily Put money In Pot)
    const vpipScore = this.evaluateVPIPOptimality(gameData.vpip);
    score += (vpipScore - 50) * weights.vpip * 20;
    
    // PFR 分析 (Pre-Flop Raise)
    const pfrScore = this.evaluatePFROptimality(gameData.pfr, gameData.vpip);
    score += (pfrScore - 50) * weights.pfr * 20;
    
    // 3-Bet 频率分析
    const threeBetScore = this.evaluateThreeBetOptimality(gameData.threeBet);
    score += (threeBetScore - 50) * weights.threeBet * 20;
    
    // 位置意识评估
    const positionScore = await this.evaluatePositionAwareness(gameData.hands);
    score += (positionScore - 50) * weights.position * 20;
    
    // 手牌选择评估
    const handSelectionScore = await this.evaluateHandSelection(gameData.hands);
    score += (handSelectionScore - 50) * weights.handSelection * 20;
    
    return Math.round(score);
  }

  /**
   * 计算翻后游戏技能 (0-2000分)
   */
  private async calculatePostflopSkill(gameData: any): Promise<number> {
    const weights = this.modelWeights.postflop;
    let score = 1000;
    
    // C-bet 分析
    const cbetScore = this.evaluateCBetOptimality(gameData.cbet);
    score += (cbetScore - 50) * weights.cbet * 20;
    
    // 对 C-bet 的反应
    const foldToCbetScore = await this.evaluateFoldToCBet(gameData.hands);
    score += (foldToCbetScore - 50) * weights.foldToCbet * 20;
    
    // 激进度控制
    const aggressionScore = this.evaluatePostflopAggression(gameData.af);
    score += (aggressionScore - 50) * weights.aggression * 20;
    
    // 底池控制
    const potControlScore = await this.evaluatePotControl(gameData.hands);
    score += (potControlScore - 50) * weights.potControl * 20;
    
    // 抓诈唬能力
    const bluffCatchingScore = await this.evaluateBluffCatching(gameData.hands);
    score += (bluffCatchingScore - 50) * weights.bluffCatching * 20;
    
    return Math.round(score);
  }

  /**
   * 计算心理博弈技能 (0-2000分)
   */
  private async calculatePsychologySkill(gameData: any): Promise<number> {
    const weights = this.modelWeights.psychology;
    let score = 1000;
    
    // 读牌能力
    const readingScore = await this.evaluateReadingAbility(gameData.hands);
    score += (readingScore - 50) * weights.readingTells * 20;
    
    // 欺骗技巧
    const deceptionScore = await this.evaluateDeceptionSkills(gameData.hands);
    score += (deceptionScore - 50) * weights.deception * 20;
    
    // 情绪控制
    const tiltControlScore = await this.evaluateTiltControl(gameData.sessions);
    score += (tiltControlScore - 50) * weights.tiltControl * 20;
    
    // 剥削能力
    const exploitingScore = await this.evaluateExploitingAbility(gameData.hands);
    score += (exploitingScore - 50) * weights.exploiting * 20;
    
    // 桌面形象管理
    const tableImageScore = await this.evaluateTableImageManagement(gameData.hands);
    score += (tableImageScore - 50) * weights.tableImage * 20;
    
    return Math.round(score);
  }

  /**
   * 计算数学计算技能 (0-2000分)
   */
  private async calculateMathematicsSkill(gameData: any): Promise<number> {
    const weights = this.modelWeights.mathematics;
    let score = 1000;
    
    // 底池赔率计算
    const potOddsScore = await this.evaluatePotOddsCalculation(gameData.hands);
    score += (potOddsScore - 50) * weights.potOdds * 20;
    
    // 胜率计算
    const equityScore = await this.evaluateEquityCalculation(gameData.hands);
    score += (equityScore - 50) * weights.equity * 20;
    
    // 期望值计算
    const evScore = await this.evaluateEVCalculation(gameData.hands);
    score += (evScore - 50) * weights.ev * 20;
    
    // 组合学应用
    const combinatoricsScore = await this.evaluateCombinatorics(gameData.hands);
    score += (combinatoricsScore - 50) * weights.combinatorics * 20;
    
    // 博弈论理解
    const gameTheoryScore = await this.evaluateGameTheoryUnderstanding(gameData.hands);
    score += (gameTheoryScore - 50) * weights.gameTheory * 20;
    
    return Math.round(score);
  }

  /**
   * 计算资金管理技能 (0-2000分)
   */
  private async calculateBankrollSkill(gameData: any): Promise<number> {
    const weights = this.modelWeights.bankroll;
    let score = 1000;
    
    // 风险管理
    const riskManagementScore = this.evaluateRiskManagement(gameData.sessions);
    score += (riskManagementScore - 50) * weights.riskManagement * 20;
    
    // 级别选择
    const stakeSelectionScore = this.evaluateStakeSelection(gameData.sessions);
    score += (stakeSelectionScore - 50) * weights.stakeSelection * 20;
    
    // 方差处理
    const varianceScore = this.evaluateVarianceHandling(gameData.sessions);
    score += (varianceScore - 50) * weights.variance * 20;
    
    // 纪律性
    const disciplineScore = this.evaluateDiscipline(gameData.sessions);
    score += (disciplineScore - 50) * weights.discipline * 20;
    
    return Math.round(score);
  }

  /**
   * 计算锦标赛技巧 (0-2000分)
   */
  private async calculateTournamentSkill(gameData: any): Promise<number> {
    const tournamentSessions = gameData.sessions.filter((s: any) => s.type === 'TOURNAMENT');
    
    if (tournamentSessions.length < 10) {
      return 1000; // 数据不足，返回平均分
    }
    
    const weights = this.modelWeights.tournament;
    let score = 1000;
    
    // ICM 理解
    const icmScore = await this.evaluateICMUnderstanding(tournamentSessions);
    score += (icmScore - 50) * weights.icm * 20;
    
    // 泡沫期表现
    const bubbleScore = await this.evaluateBubblePlay(tournamentSessions);
    score += (bubbleScore - 50) * weights.bubble * 20;
    
    // 筹码管理
    const stackManagementScore = await this.evaluateStackManagement(tournamentSessions);
    score += (stackManagementScore - 50) * weights.stackManagement * 20;
    
    // 终桌技巧
    const finalTableScore = await this.evaluateFinalTableSkill(tournamentSessions);
    score += (finalTableScore - 50) * weights.final * 20;
    
    // 时机把握
    const timingScore = await this.evaluateTiming(tournamentSessions);
    score += (timingScore - 50) * weights.timing * 20;
    
    return Math.round(score);
  }

  /**
   * 计算评估准确率和置信度
   */
  private calculateEvaluationMetrics(gameData: any, skills: SkillDimensions): {
    accuracy: number;
    confidence: number;
  } {
    // 基于数据量计算置信度
    const dataPoints = gameData.totalHands;
    const confidence = Math.min(0.95, 0.5 + (dataPoints / 1000) * 0.4);
    
    // 基于一致性计算准确率
    const consistency = this.calculateConsistencyScore(gameData);
    const accuracy = Math.min(0.95, 0.7 + consistency * 0.25);
    
    return { accuracy, confidence };
  }

  /**
   * 保存技能评估结果
   */
  private async saveSkillEvaluation(
    userId: string, 
    skills: SkillDimensions, 
    accuracy: number, 
    confidence: number
  ) {
    // 这里应该保存到数据库或缓存中
    logger.debug(`Saving skill evaluation for user ${userId}`, {
      skills,
      accuracy,
      confidence
    });
  }

  /**
   * 获取默认技能档案
   */
  private getDefaultSkillProfile(userId: string) {
    return {
      skills: {
        preflop: 1000,
        postflop: 1000,
        psychology: 1000,
        mathematics: 1000,
        bankroll: 1000,
        tournament: 1000
      },
      confidence: 0.5,
      accuracy: 0.7,
      lastUpdated: new Date()
    };
  }

  // ============ 辅助评估方法 ============

  /**
   * 评估 VPIP 最优性
   */
  private evaluateVPIPOptimality(vpip: number): number {
    const optimal = 22; // 理想的VPIP值
    const deviation = Math.abs(vpip - optimal);
    return Math.max(0, 100 - deviation * 2);
  }

  /**
   * 评估 PFR 最优性
   */
  private evaluatePFROptimality(pfr: number, vpip: number): number {
    const idealRatio = 0.75; // PFR/VPIP的理想比例
    const actualRatio = vpip > 0 ? pfr / vpip : 0;
    const deviation = Math.abs(actualRatio - idealRatio);
    return Math.max(0, 100 - deviation * 100);
  }

  /**
   * 评估 3-Bet 最优性
   */
  private evaluateThreeBetOptimality(threeBet: number): number {
    const optimal = 7; // 理想的3-bet频率
    const deviation = Math.abs(threeBet - optimal);
    return Math.max(0, 100 - deviation * 5);
  }

  /**
   * 评估位置意识
   */
  private async evaluatePositionAwareness(hands: any[]): Promise<number> {
    if (hands.length === 0) return 50;
    
    // 分析不同位置的游戏风格差异
    const positionStats = this.calculatePositionStats(hands);
    const awareness = this.measurePositionalAdjustments(positionStats);
    
    return Math.max(0, Math.min(100, awareness));
  }

  /**
   * 评估手牌选择
   */
  private async evaluateHandSelection(hands: any[]): Promise<number> {
    if (hands.length === 0) return 50;
    
    let goodSelections = 0;
    let totalHands = 0;
    
    for (const hand of hands.slice(0, 200)) {
      if (hand.preflopActions) {
        const isGoodSelection = await this.isGoodHandSelection(hand);
        if (isGoodSelection !== null) {
          if (isGoodSelection) goodSelections++;
          totalHands++;
        }
      }
    }
    
    return totalHands > 0 ? (goodSelections / totalHands) * 100 : 50;
  }

  /**
   * 计算一致性分数
   */
  private calculateConsistencyScore(gameData: any): number {
    // 基于多个指标计算一致性
    const sessions = gameData.sessions.slice(0, 20);
    if (sessions.length < 5) return 0.5;
    
    // 计算胜率的标准差
    const winRates = sessions.map((s: any) => s.result === 'WIN' ? 1 : 0);
    const avgWinRate = winRates.reduce((a: number, b: number) => a + b, 0) / winRates.length;
    const variance = winRates.reduce((sum: number, wr: number) => sum + Math.pow(wr - avgWinRate, 2), 0) / winRates.length;
    const consistency = 1 - Math.min(1, variance * 4);
    
    return consistency;
  }

  // ============ 更多辅助方法 ============

  private calculateAggressionIndex(gameData: any): number {
    return Math.min(100, Math.max(0, gameData.af * 20));
  }

  private calculateTightnessIndex(gameData: any): number {
    return Math.min(100, Math.max(0, (30 - gameData.vpip) * 3));
  }

  private calculateAdaptabilityIndex(gameData: any): number {
    // 基于不同对手类型的调整程度
    return 70; // 占位值，需要实际实现
  }

  private calculateConsistencyIndex(gameData: any): number {
    return Math.round(this.calculateConsistencyScore(gameData) * 100);
  }

  private calculateRiskToleranceIndex(gameData: any): number {
    // 基于下注尺寸和风险偏好分析
    return 60; // 占位值
  }

  private calculateLearningSpeedIndex(gameData: any): number {
    // 基于技能进步速度分析
    return 55; // 占位值
  }

  private identifyPrimaryWeaknesses(skills: SkillDimensions) {
    const weaknesses = [];
    const avgScore = Object.values(skills).reduce((a, b) => a + b, 0) / 6;
    
    for (const [dimension, score] of Object.entries(skills)) {
      const gap = avgScore - score;
      if (gap > 100) {
        let severity: 'critical' | 'high' | 'medium' | 'low';
        if (gap > 400) severity = 'critical';
        else if (gap > 250) severity = 'high';
        else if (gap > 150) severity = 'medium';
        else severity = 'low';
        
        weaknesses.push({
          dimension: dimension as keyof SkillDimensions,
          score,
          severity,
          description: this.getWeaknessDescription(dimension, score),
          improvementPotential: Math.min(500, gap * 1.5)
        });
      }
    }
    
    return weaknesses.sort((a, b) => b.improvementPotential - a.improvementPotential);
  }

  private getWeaknessDescription(dimension: string, score: number): string {
    const descriptions: Record<string, string> = {
      preflop: '翻前决策需要改进，注意手牌选择和位置意识',
      postflop: '翻后游戏有待加强，特别是下注尺寸和时机选择',
      psychology: '心理博弈技巧不足，需要提高读牌和欺骗能力',
      mathematics: '数学计算能力有限，建议加强底池赔率和胜率计算',
      bankroll: '资金管理需要改善，注意风险控制和级别选择',
      tournament: '锦标赛技巧有待提高，特别是ICM和筹码管理'
    };
    
    return descriptions[dimension] || '该技能维度需要改进';
  }

  private analyzeBehavioralPatterns(gameData: any, behaviorProfile: BehaviorProfile) {
    return []; // 占位实现
  }

  private identifySkillGaps(skills: SkillDimensions, gameData: any) {
    return []; // 占位实现
  }

  // ============ 其他必需的占位方法 ============

  private async getUserTestResults(userId: string) {
    return await prisma.testResult.findMany({
      where: { session: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  private determinePrimaryLearningStyle(testResults: any[]): LearningStyle['primaryStyle'] {
    return 'analytical'; // 占位实现
  }

  private analyzePreferredDifficulty(testResults: any[]): LearningStyle['preferredDifficulty'] {
    return 'adaptive'; // 占位实现
  }

  private calculateLearningPace(gameData: any, testResults: any[]): LearningStyle['learningPace'] {
    return 'medium'; // 占位实现
  }

  private analyzeFeedbackPreference(testResults: any[]): LearningStyle['feedbackPreference'] {
    return 'detailed'; // 占位实现
  }

  private identifyMotivationFactors(gameData: any, testResults: any[]): string[] {
    return ['improvement', 'competition', 'achievement']; // 占位实现
  }

  private async getPreviousSkillEvaluation(userId: string): Promise<SkillDimensions | null> {
    // 从数据库获取上次评估结果
    return null; // 占位实现
  }

  private calculateProgressTrend(current: SkillDimensions, previous: SkillDimensions): 'improving' | 'declining' | 'stable' {
    const currentTotal = Object.values(current).reduce((a, b) => a + b, 0);
    const previousTotal = Object.values(previous).reduce((a, b) => a + b, 0);
    const diff = currentTotal - previousTotal;
    
    if (diff > 100) return 'improving';
    if (diff < -100) return 'declining';
    return 'stable';
  }

  private calculateProgressRate(current: SkillDimensions, previous: SkillDimensions): number {
    const currentTotal = Object.values(current).reduce((a, b) => a + b, 0);
    const previousTotal = Object.values(previous).reduce((a, b) => a + b, 0);
    return currentTotal - previousTotal;
  }

  private predictFutureSkills(current: SkillDimensions, progressRate: number): SkillDimensions {
    const factor = progressRate / 1000; // 归一化
    return {
      preflop: Math.min(2000, current.preflop + progressRate * 0.1),
      postflop: Math.min(2000, current.postflop + progressRate * 0.1),
      psychology: Math.min(2000, current.psychology + progressRate * 0.1),
      mathematics: Math.min(2000, current.mathematics + progressRate * 0.1),
      bankroll: Math.min(2000, current.bankroll + progressRate * 0.1),
      tournament: Math.min(2000, current.tournament + progressRate * 0.1)
    };
  }

  private calculateTimeToTarget(skills: SkillDimensions, progressRate: number): { [K in keyof SkillDimensions]: number } {
    const target = 1600; // 目标分数
    const dailyProgress = Math.max(1, progressRate / 30); // 假设每月评估一次
    
    return {
      preflop: Math.max(0, Math.ceil((target - skills.preflop) / dailyProgress)),
      postflop: Math.max(0, Math.ceil((target - skills.postflop) / dailyProgress)),
      psychology: Math.max(0, Math.ceil((target - skills.psychology) / dailyProgress)),
      mathematics: Math.max(0, Math.ceil((target - skills.mathematics) / dailyProgress)),
      bankroll: Math.max(0, Math.ceil((target - skills.bankroll) / dailyProgress)),
      tournament: Math.max(0, Math.ceil((target - skills.tournament) / dailyProgress))
    };
  }

  private calculateInitialTimeToTarget(skills: SkillDimensions): { [K in keyof SkillDimensions]: number } {
    const target = 1600;
    const avgProgress = 5; // 假设每天5分的进步
    
    return {
      preflop: Math.max(0, Math.ceil((target - skills.preflop) / avgProgress)),
      postflop: Math.max(0, Math.ceil((target - skills.postflop) / avgProgress)),
      psychology: Math.max(0, Math.ceil((target - skills.psychology) / avgProgress)),
      mathematics: Math.max(0, Math.ceil((target - skills.mathematics) / avgProgress)),
      bankroll: Math.max(0, Math.ceil((target - skills.bankroll) / avgProgress)),
      tournament: Math.max(0, Math.ceil((target - skills.tournament) / avgProgress))
    };
  }

  private generateImmediateRecommendations(weaknesses: WeaknessAnalysis, learningStyle: LearningStyle) {
    return []; // 占位实现
  }

  private generateShortTermGoals(weaknesses: WeaknessAnalysis, progress: SkillProgress) {
    return []; // 占位实现
  }

  private generateLongTermObjectives(progress: SkillProgress, learningStyle: LearningStyle) {
    return []; // 占位实现
  }

  // ============ 更多占位方法 ============

  private async evaluateCBetOptimality(cbet: number): Promise<number> {
    return 70; // 占位实现
  }

  private async evaluateFoldToCBet(hands: any[]): Promise<number> {
    return 65; // 占位实现
  }

  private evaluatePostflopAggression(af: number): number {
    return Math.min(100, af * 25);
  }

  private async evaluatePotControl(hands: any[]): Promise<number> {
    return 60; // 占位实现
  }

  private async evaluateBluffCatching(hands: any[]): Promise<number> {
    return 55; // 占位实现
  }

  private async evaluateReadingAbility(hands: any[]): Promise<number> {
    return 50; // 占位实现
  }

  private async evaluateDeceptionSkills(hands: any[]): Promise<number> {
    return 52; // 占位实现
  }

  private async evaluateTiltControl(sessions: any[]): Promise<number> {
    return 75; // 占位实现
  }

  private async evaluateExploitingAbility(hands: any[]): Promise<number> {
    return 58; // 占位实现
  }

  private async evaluateTableImageManagement(hands: any[]): Promise<number> {
    return 62; // 占位实现
  }

  private async evaluatePotOddsCalculation(hands: any[]): Promise<number> {
    return 68; // 占位实现
  }

  private async evaluateEquityCalculation(hands: any[]): Promise<number> {
    return 72; // 占位实现
  }

  private async evaluateEVCalculation(hands: any[]): Promise<number> {
    return 65; // 占位实现
  }

  private async evaluateCombinatorics(hands: any[]): Promise<number> {
    return 45; // 占位实现
  }

  private async evaluateGameTheoryUnderstanding(hands: any[]): Promise<number> {
    return 55; // 占位实现
  }

  private evaluateRiskManagement(sessions: any[]): number {
    return 70; // 占位实现
  }

  private evaluateStakeSelection(sessions: any[]): number {
    return 75; // 占位实现
  }

  private evaluateVarianceHandling(sessions: any[]): number {
    return 65; // 占位实现
  }

  private evaluateDiscipline(sessions: any[]): number {
    return 80; // 占位实现
  }

  private async evaluateICMUnderstanding(sessions: any[]): Promise<number> {
    return 50; // 占位实现
  }

  private async evaluateBubblePlay(sessions: any[]): Promise<number> {
    return 55; // 占位实现
  }

  private async evaluateStackManagement(sessions: any[]): Promise<number> {
    return 60; // 占位实现
  }

  private async evaluateFinalTableSkill(sessions: any[]): Promise<number> {
    return 45; // 占位实现
  }

  private async evaluateTiming(sessions: any[]): Promise<number> {
    return 52; // 占位实现
  }

  private calculatePositionStats(hands: any[]) {
    return {}; // 占位实现
  }

  private measurePositionalAdjustments(positionStats: any): number {
    return 65; // 占位实现
  }

  private async isGoodHandSelection(hand: any): Promise<boolean | null> {
    return true; // 占位实现
  }

  /**
   * 获取引擎统计信息
   */
  getEngineStats() {
    return {
      config: this.config,
      modelWeights: this.modelWeights,
      evaluationCount: 0 // 可以添加计数器
    };
  }
}

// 导出单例
export const skillEvaluationEngine = new SkillEvaluationEngine();