import { POSITIONS, ACTIONS, STREETS, AI_STYLES, TRAINING_SCENARIOS } from './constants';
import { HandEvaluator } from './hand-evaluator';
import { createLogger } from '@/lib/logger';
import { GTOEngine, GTOAnalysis, TrainingScenario } from './gto-engine';
import { CFRSolver } from './cfr-solver';
import { GameTree, GameState, PlayerState, Action } from './game-tree';
import { StrategyCache } from './strategy-cache';

const logger = createLogger('training-engine');

// 保持向后兼容的接口
export interface TrainingSession {
  id: string;
  userId: string;
  scenario: string;
  difficulty: string;
  startTime: Date;
  endTime?: Date;
  hands: TrainingHand[];
  score: number;
  feedback: string[];
  mistakes: Mistake[];
  gtoAnalysis?: GTOAnalysis[]; // 新增GTO分析结果
}

export interface TrainingHand {
  handNumber: number;
  position: string;
  holeCards: string;
  communityCards: string;
  street: string;
  potSize: number;
  stackSize: number;
  opponents: Opponent[];
  correctAction: Action;
  userAction?: Action;
  isCorrect?: boolean;
  explanation: string;
  gtoAnalysis?: GTOAnalysis; // 新增GTO分析
}

export interface Opponent {
  position: string;
  stackSize: number;
  style: string;
  lastAction?: Action;
  range?: string[];
}

export interface Action {
  type: string;
  amount?: number;
  player?: number;
}

export interface Mistake {
  handNumber: number;
  street: string;
  userAction: Action;
  correctAction: Action;
  explanation: string;
  evLoss: number;
  gtoRecommendation?: string; // 新增GTO建议
}

/**
 * 增强版训练引擎 - 集成GTO算法和CFR求解器
 */
export class TrainingEngine {
  private session: TrainingSession | null = null;
  private currentHand: TrainingHand | null = null;
  private gtoEngine: GTOEngine;
  private strategyCache: StrategyCache;

  constructor() {
    this.gtoEngine = new GTOEngine({
      cfrIterations: 5000, // 训练模式使用较少迭代以保证响应速度
      cacheSize: 10000,
      precomputeCommon: true,
      enableDetailedAnalysis: true
    });
    
    this.strategyCache = new StrategyCache({
      maxSize: 10000,
      autoPrecompute: true
    });

    logger.info('Enhanced Training Engine initialized with GTO support');
  }

  /**
   * 初始化训练引擎
   */
  async initialize(): Promise<void> {
    await this.gtoEngine.initialize();
    logger.info('Training Engine initialization complete');
  }

  /**
   * 开始训练会话
   */
  startSession(
    userId: string,
    scenario: keyof typeof TRAINING_SCENARIOS,
    difficulty: string = 'intermediate'
  ): TrainingSession {
    this.session = {
      id: this.generateSessionId(),
      userId,
      scenario,
      difficulty,
      startTime: new Date(),
      hands: [],
      score: 100, // 满分100
      feedback: [],
      mistakes: [],
      gtoAnalysis: [],
    };

    logger.info('Training session started', {
      sessionId: this.session.id,
      scenario,
      difficulty,
    });

    return this.session;
  }

  /**
   * 生成训练手牌 (增强版) - 集成个性化推荐
   */
  async generateTrainingHand(): Promise<TrainingHand> {
    if (!this.session) {
      throw new Error('No active session');
    }

    const handNumber = this.session.hands.length + 1;

    try {
      // 获取用户画像进行个性化调整
      const userProfile = await this.getUserProfile(this.session.userId);
      
      // 使用GTO引擎生成训练场景，考虑个性化因素
      const trainingScenario = await this.gtoEngine.generatePersonalizedScenario(
        this.session.scenario, 
        this.session.difficulty as any,
        userProfile
      );

      // 转换为TrainingHand格式
      const hand = this.convertScenarioToHand(trainingScenario, handNumber);
      
      // 根据用户学习风格调整手牌参数
      this.adjustHandForLearningStyle(hand, userProfile.learningStyle);
      
      this.currentHand = hand;
      this.session.hands.push(hand);

      return hand;
    } catch (error) {
      logger.warn('Failed to generate GTO-based training hand, falling back to legacy method:', error);
      return this.generateLegacyTrainingHand();
    }
  }

  /**
   * 获取用户画像
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      // 获取用户最近的训练记录
      const recentSessions = await this.getRecentTrainingSessions(userId, 20);
      
      // 使用用户画像分析器
      const { UserProfiler } = await import('@/lib/personalization/user-profiler');
      const profiler = new UserProfiler();
      
      return await profiler.analyzeUserProfile(userId, recentSessions);
    } catch (error) {
      logger.warn('Failed to get user profile, using default:', error);
      return this.getDefaultUserProfile(userId);
    }
  }

  /**
   * 获取最近训练会话 - 模拟实现
   */
  private async getRecentTrainingSessions(userId: string, count: number): Promise<any[]> {
    // 这里应该从数据库获取，现在返回模拟数据
    return [];
  }

  /**
   * 获取默认用户画像
   */
  private getDefaultUserProfile(userId: string): any {
    return {
      userId,
      skillDimensions: {
        preflop: { current: 1000, confidence: 0.3 },
        postflop: { current: 1000, confidence: 0.3 },
        psychology: { current: 1000, confidence: 0.3 },
        mathematics: { current: 1000, confidence: 0.3 },
        bankroll: { current: 1000, confidence: 0.3 },
        tournament: { current: 1000, confidence: 0.3 }
      },
      learningStyle: {
        visualLearner: 0.25,
        practicalLearner: 0.25,
        theoreticalLearner: 0.25,
        socialLearner: 0.25
      },
      weaknessPatterns: [],
      overallRating: 1000
    };
  }

  /**
   * 根据学习风格调整手牌
   */
  private adjustHandForLearningStyle(hand: TrainingHand, learningStyle: any): void {
    // 视觉学习者 - 提供更详细的牌面描述
    if (learningStyle.visualLearner > 0.6) {
      hand.explanation += ' [可视化提示: 观察牌面纹理和对手行为模式]';
    }

    // 实践学习者 - 强调实际应用
    if (learningStyle.practicalLearner > 0.6) {
      hand.explanation += ' [实践要点: 在实战中如何应用这个概念]';
    }

    // 理论学习者 - 添加数学分析
    if (learningStyle.theoreticalLearner > 0.6) {
      const equity = this.calculateSimpleEquity(hand.holeCards, hand.communityCards);
      hand.explanation += ` [理论分析: 手牌胜率约${(equity * 100).toFixed(1)}%]`;
    }

    // 社交学习者 - 强调对手心理
    if (learningStyle.socialLearner > 0.6) {
      hand.explanation += ' [心理博弈: 考虑对手的思维过程和可能反应]';
    }
  }

  /**
   * 计算简单胜率
   */
  private calculateSimpleEquity(holeCards: string, communityCards: string): number {
    // 简化实现 - 基于手牌强度估算
    const holeStrength = this.evaluateHoleCards(holeCards);
    const communityBonus = communityCards.length * 0.1;
    return Math.min(0.9, holeStrength + communityBonus);
  }

  /**
   * 评估起手牌强度
   */
  private evaluateHoleCards(holeCards: string): number {
    if (!holeCards || holeCards.length < 2) return 0.2;
    
    // 提取牌面信息 (简化)
    const ranks = holeCards.match(/[AKQJT23456789]/g) || [];
    const suits = holeCards.match(/[♠♥♦♣]/g) || [];
    
    if (ranks.length < 2) return 0.2;
    
    const rankValues = ranks.map(r => {
      const map: Record<string, number> = {
        'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
        '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
      };
      return map[r] || 2;
    });

    // 对子检测
    if (rankValues[0] === rankValues[1]) {
      if (rankValues[0] >= 10) return 0.85; // 高对
      if (rankValues[0] >= 7) return 0.65;  // 中对
      return 0.45; // 小对
    }

    // 同花检测
    const suited = suits.length >= 2 && suits[0] === suits[1];
    const gap = Math.abs(rankValues[0] - rankValues[1]);
    
    // 高牌力量
    const maxRank = Math.max(...rankValues);
    const minRank = Math.min(...rankValues);
    
    let strength = (maxRank + minRank) / 28; // 基础强度
    
    if (suited) strength += 0.1; // 同花加成
    if (gap <= 4 && minRank >= 5) strength += 0.05; // 顺子潜力
    if (maxRank === 14) strength += 0.1; // A牌加成
    
    return Math.min(0.8, Math.max(0.1, strength));
  }

  /**
   * 生成批量训练场景
   */
  async generateTrainingBatch(count: number): Promise<TrainingHand[]> {
    if (!this.session) {
      throw new Error('No active session');
    }

    const scenarios = await this.gtoEngine.generateTrainingBatch(
      count,
      [this.session.scenario],
      [this.session.difficulty]
    );

    return scenarios.map((scenario, index) => 
      this.convertScenarioToHand(scenario, this.session!.hands.length + index + 1)
    );
  }

  /**
   * 处理用户动作 (增强版)
   */
  async processUserAction(action: Action): Promise<{
    isCorrect: boolean;
    feedback: string;
    evLoss?: number;
    gtoAnalysis?: GTOAnalysis;
  }> {
    if (!this.currentHand || !this.session) {
      throw new Error('No active hand');
    }

    this.currentHand.userAction = action;

    try {
      // 构造游戏状态进行GTO分析
      const gameState = this.constructGameState(this.currentHand, action);
      const gtoAnalysis = await this.gtoEngine.getDecision(gameState);
      
      // 评估用户决策
      const evaluation = await this.gtoEngine.evaluateDecisionNew(gameState, action);
      
      this.currentHand.isCorrect = evaluation.isOptimal;
      this.currentHand.gtoAnalysis = gtoAnalysis;

      let feedback = '';
      const evLoss = evaluation.evLoss;

      if (evaluation.isOptimal) {
        feedback = `优秀！${gtoAnalysis.decision.reasoning}`;
        this.session.feedback.push(`第${this.currentHand.handNumber}手：GTO决策 (排名${evaluation.ranking})`);
      } else {
        feedback = `${evaluation.explanation}。正确选择：${evaluation.optimalAction}。EV损失：${evLoss.toFixed(2)}BB`;

        const mistake: Mistake = {
          handNumber: this.currentHand.handNumber,
          street: this.currentHand.street,
          userAction: action,
          correctAction: { type: evaluation.optimalAction },
          explanation: evaluation.explanation,
          evLoss,
          gtoRecommendation: gtoAnalysis.decision.reasoning
        };

        this.session.mistakes.push(mistake);
        this.session.score = Math.max(0, this.session.score - Math.floor(evLoss * 2));
      }

      // 保存GTO分析结果
      this.session.gtoAnalysis?.push(gtoAnalysis);

      return { 
        isCorrect: evaluation.isOptimal, 
        feedback, 
        evLoss, 
        gtoAnalysis 
      };
    } catch (error) {
      logger.warn('Failed to get GTO analysis, falling back to legacy evaluation:', error);
      return this.processLegacyUserAction(action);
    }
  }

  /**
   * 结束训练会话 (增强版)
   */
  async endSession(): Promise<TrainingSession> {
    if (!this.session) {
      throw new Error('No active session');
    }

    this.session.endTime = new Date();

    // 生成增强反馈
    const totalHands = this.session.hands.length;
    const correctHands = this.session.hands.filter(h => h.isCorrect).length;
    const accuracy = (correctHands / totalHands) * 100;

    this.session.feedback.push(`训练完成！共${totalHands}手牌，正确率${accuracy.toFixed(1)}%`);

    if (this.session.mistakes.length > 0) {
      const totalEVLoss = this.session.mistakes.reduce((sum, m) => sum + m.evLoss, 0);
      this.session.feedback.push(`总EV损失：${totalEVLoss.toFixed(2)}BB`);

      // 分析错误模式
      const errorPatterns = this.analyzeErrorPatterns(this.session.mistakes);
      this.session.feedback.push(`主要改进方向：${errorPatterns.join('、')}`);
    }

    // 生成GTO学习建议
    if (this.session.gtoAnalysis && this.session.gtoAnalysis.length > 0) {
      const gtoInsights = this.generateGTOInsights(this.session.gtoAnalysis);
      this.session.feedback.push(...gtoInsights);
    }

    logger.info('Enhanced training session ended', {
      sessionId: this.session.id,
      score: this.session.score,
      accuracy,
      gtoAnalysisCount: this.session.gtoAnalysis?.length || 0
    });

    const completedSession = { ...this.session };
    this.session = null;
    this.currentHand = null;

    return completedSession;
  }

  /**
   * 获取GTO训练建议
   */
  async getGTORecommendation(gameState: GameState): Promise<GTOAnalysis> {
    return this.gtoEngine.getDecision(gameState);
  }

  /**
   * 获取引擎统计信息
   */
  getStats() {
    return {
      engine: this.gtoEngine.getStats(),
      cache: this.strategyCache.getStats(),
      currentSession: this.session ? {
        id: this.session.id,
        scenario: this.session.scenario,
        handsPlayed: this.session.hands.length,
        score: this.session.score
      } : null
    };
  }

  /**
   * 关闭训练引擎
   */
  async shutdown(): Promise<void> {
    await this.gtoEngine.shutdown();
    logger.info('Training Engine shutdown complete');
  }

  // 私有辅助方法

  /**
   * 将TrainingScenario转换为TrainingHand
   */
  private convertScenarioToHand(scenario: TrainingScenario, handNumber: number): TrainingHand {
    const gameState = scenario.gameState;
    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    // 根据策略确定正确动作
    const correctAction = this.getCorrectActionFromStrategy(scenario.correctStrategy);

    return {
      handNumber,
      position: currentPlayer.position,
      holeCards: currentPlayer.holeCards,
      communityCards: gameState.communityCards,
      street: gameState.street,
      potSize: gameState.pot,
      stackSize: currentPlayer.stack,
      opponents: this.convertPlayersToOpponents(gameState.players.filter(p => p.id !== gameState.currentPlayer)),
      correctAction,
      explanation: scenario.explanation
    };
  }

  /**
   * 从策略Map中获取最优动作
   */
  private getCorrectActionFromStrategy(strategy: Map<string, number>): Action {
    let bestAction = '';
    let bestProb = 0;

    for (const [action, prob] of strategy) {
      if (prob > bestProb) {
        bestAction = action;
        bestProb = prob;
      }
    }

    // 解析动作字符串
    const [type, amountStr] = bestAction.split(':');
    return {
      type,
      amount: amountStr ? parseInt(amountStr) : undefined
    };
  }

  /**
   * 将PlayerState转换为Opponent
   */
  private convertPlayersToOpponents(players: PlayerState[]): Opponent[] {
    return players.map(player => ({
      position: player.position,
      stackSize: player.stack,
      style: this.inferPlayerStyle(player),
      range: player.range ? Array.from(player.range.combos) : undefined
    }));
  }

  /**
   * 推断玩家风格
   */
  private inferPlayerStyle(player: PlayerState): string {
    // 简化实现 - 实际中可以基于历史数据分析
    const styles = Object.keys(AI_STYLES);
    return styles[Math.floor(Math.random() * styles.length)];
  }

  /**
   * 构造游戏状态用于GTO分析
   */
  private constructGameState(hand: TrainingHand, userAction: Action): GameState {
    const players: PlayerState[] = [
      {
        id: 0,
        position: hand.position,
        stack: hand.stackSize,
        holeCards: hand.holeCards,
        invested: hand.potSize / 2, // 简化估算
        folded: false,
        allIn: false
      },
      ...hand.opponents.map((opp, index) => ({
        id: index + 1,
        position: opp.position,
        stack: opp.stackSize,
        holeCards: 'XX', // 隐藏对手牌
        invested: hand.potSize / (hand.opponents.length + 1), // 简化估算
        folded: false,
        allIn: false
      }))
    ];

    return {
      id: this.generateGameStateId(),
      street: hand.street,
      pot: hand.potSize,
      communityCards: hand.communityCards,
      players,
      currentPlayer: 0,
      history: [userAction],
      isTerminal: false
    };
  }

  /**
   * 分析错误模式
   */
  private analyzeErrorPatterns(mistakes: Mistake[]): string[] {
    const patterns = new Map<string, number>();

    for (const mistake of mistakes) {
      // 分析错误类型
      const errorType = this.classifyError(mistake);
      patterns.set(errorType, (patterns.get(errorType) || 0) + 1);
    }

    // 返回最常见的错误类型
    return Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([pattern]) => pattern);
  }

  /**
   * 分类错误类型
   */
  private classifyError(mistake: Mistake): string {
    const userType = mistake.userAction.type;
    const correctType = mistake.correctAction.type;

    if (userType === ACTIONS.FOLD && correctType !== ACTIONS.FOLD) {
      return '过度保守';
    } else if (userType === ACTIONS.RAISE && correctType === ACTIONS.FOLD) {
      return '过度激进';
    } else if (userType === ACTIONS.CALL && correctType === ACTIONS.RAISE) {
      return '错失价值';
    } else if (userType === ACTIONS.RAISE && correctType === ACTIONS.CALL) {
      return '下注过大';
    } else if (mistake.evLoss > 1.0) {
      return '重大决策失误';
    }

    return '时机把握';
  }

  /**
   * 生成GTO学习见解
   */
  private generateGTOInsights(analyses: GTOAnalysis[]): string[] {
    const insights: string[] = [];

    // 分析平均手牌强度
    const avgHandStrength = analyses.reduce((sum, a) => sum + a.handStrength, 0) / analyses.length;
    if (avgHandStrength > 0.7) {
      insights.push('GTO建议：你在强牌时的决策基本正确，继续保持');
    } else if (avgHandStrength < 0.3) {
      insights.push('GTO建议：注意弱牌时的防守策略，避免过度跟注');
    }

    // 分析位置游戏
    const positionAnalysis = this.analyzePositionPlay(analyses);
    if (positionAnalysis) {
      insights.push(`位置建议：${positionAnalysis}`);
    }

    // 分析决策信心度
    const avgConfidence = analyses.reduce((sum, a) => sum + a.decision.confidence, 0) / analyses.length;
    if (avgConfidence < 0.6) {
      insights.push('GTO建议：遇到复杂局面时，更多考虑对手范围和底池赔率');
    }

    return insights.slice(0, 3); // 限制为3条建议
  }

  /**
   * 分析位置游戏
   */
  private analyzePositionPlay(analyses: GTOAnalysis[]): string | null {
    const positionStats = new Map<string, { count: number; avgEquity: number }>();

    for (const analysis of analyses) {
      const pos = analysis.position;
      if (!positionStats.has(pos)) {
        positionStats.set(pos, { count: 0, avgEquity: 0 });
      }
      const stats = positionStats.get(pos)!;
      stats.count++;
      stats.avgEquity += analysis.equity;
    }

    // 计算平均胜率
    for (const [pos, stats] of positionStats) {
      stats.avgEquity /= stats.count;
    }

    // 找出表现最差的位置
    let worstPosition = '';
    let worstEquity = 1.0;

    for (const [pos, stats] of positionStats) {
      if (stats.avgEquity < worstEquity && stats.count >= 2) {
        worstEquity = stats.avgEquity;
        worstPosition = pos;
      }
    }

    if (worstPosition && worstEquity < 0.4) {
      return `在${worstPosition}位置需要更加谨慎，当前平均胜率较低`;
    }

    return null;
  }

  // 向后兼容的旧方法

  /**
   * 生成传统训练手牌 (后备方案)
   */
  private generateLegacyTrainingHand(): TrainingHand {
    if (!this.session) {
      throw new Error('No active session');
    }

    const handNumber = this.session.hands.length + 1;
    const scenario = TRAINING_SCENARIOS[this.session.scenario as keyof typeof TRAINING_SCENARIOS];

    // 根据场景生成手牌
    let hand: TrainingHand;

    switch (this.session.scenario) {
      case 'PREFLOP_RANGES':
        hand = this.generatePreflopRangeHand();
        break;
      case 'POT_ODDS':
        hand = this.generatePotOddsHand();
        break;
      case 'BLUFFING':
        hand = this.generateBluffingHand();
        break;
      case 'VALUE_BETTING':
        hand = this.generateValueBettingHand();
        break;
      case 'POSITION_PLAY':
        hand = this.generatePositionPlayHand();
        break;
      case 'HAND_READING':
        hand = this.generateHandReadingHand();
        break;
      default:
        hand = this.generateGenericHand();
    }

    hand.handNumber = handNumber;
    this.currentHand = hand;
    this.session.hands.push(hand);

    return hand;
  }

  /**
   * 处理传统用户动作 (后备方案)
   */
  private processLegacyUserAction(action: Action): {
    isCorrect: boolean;
    feedback: string;
    evLoss?: number;
  } {
    if (!this.currentHand || !this.session) {
      throw new Error('No active hand');
    }

    this.currentHand.userAction = action;
    const isCorrect = this.compareActions(action, this.currentHand.correctAction);
    this.currentHand.isCorrect = isCorrect;

    let feedback = '';
    let evLoss = 0;

    if (isCorrect) {
      feedback = '正确！' + this.currentHand.explanation;
      this.session.feedback.push(`第${this.currentHand.handNumber}手：完美决策`);
    } else {
      evLoss = this.calculateEVLoss(action, this.currentHand.correctAction, this.currentHand.potSize);
      feedback = `错误。${this.currentHand.explanation} EV损失：${evLoss.toFixed(2)}BB`;

      const mistake: Mistake = {
        handNumber: this.currentHand.handNumber,
        street: this.currentHand.street,
        userAction: action,
        correctAction: this.currentHand.correctAction,
        explanation: this.currentHand.explanation,
        evLoss,
      };

      this.session.mistakes.push(mistake);
      this.session.score = Math.max(0, this.session.score - Math.floor(evLoss * 2));
    }

    return { isCorrect, feedback, evLoss };
  }

  // 原有的辅助方法保持不变

  private generateSessionId(): string {
    return `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateGameStateId(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRandomHoleCards(): string {
    const deck = this.createDeck();
    const shuffled = deck.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2).join('');
  }

  private generateStrongHand(): string {
    const strongHands = ['AA', 'KK', 'QQ', 'AKs', 'JJ', 'AQs', 'TT', 'AKo'];
    return strongHands[Math.floor(Math.random() * strongHands.length)];
  }

  private generateMediumHand(): string {
    const mediumHands = ['99', '88', 'AJo', 'KQo', 'ATs', 'KJs', '77', 'QJs'];
    return mediumHands[Math.floor(Math.random() * mediumHands.length)];
  }

  private generateDrawingHand(): string {
    const drawingHands = ['JTs', 'T9s', '98s', '87s', '76s', 'A5s', 'A4s'];
    return drawingHands[Math.floor(Math.random() * drawingHands.length)];
  }

  private generateCommunityCards(count: number): string {
    const deck = this.createDeck();
    const shuffled = deck.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).join('');
  }

  private generateOpponents(count: number): Opponent[] {
    const opponents: Opponent[] = [];
    const styles = Object.keys(AI_STYLES);
    const positions = [POSITIONS.SB, POSITIONS.BB, POSITIONS.UTG, POSITIONS.MP, POSITIONS.CO];

    for (let i = 0; i < count && i < positions.length; i++) {
      opponents.push({
        position: positions[i],
        stackSize: Math.floor(Math.random() * 100) + 50,
        style: styles[Math.floor(Math.random() * styles.length)],
      });
    }

    return opponents;
  }

  private compareActions(action1: Action, action2: Action): boolean {
    if (action1.type !== action2.type) return false;
    if (action1.amount && action2.amount) {
      // 允许10%的误差
      return Math.abs(action1.amount - action2.amount) / action2.amount < 0.1;
    }
    return true;
  }

  private calculateEVLoss(userAction: Action, correctAction: Action, potSize: number): number {
    // 简化的EV损失计算
    if (userAction.type === ACTIONS.FOLD && correctAction.type !== ACTIONS.FOLD) {
      return potSize * 0.3; // 弃牌损失期望值
    } else if (userAction.type !== ACTIONS.FOLD && correctAction.type === ACTIONS.FOLD) {
      return (userAction.amount || 0); // 不该跟注的损失
    } else if (userAction.amount && correctAction.amount) {
      return Math.abs(userAction.amount - correctAction.amount) * 0.5;
    }
    return 0;
  }

  private createDeck(): string[] {
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const suits = ['♠', '♥', '♦', '♣'];
    const deck: string[] = [];
    
    for (const rank of ranks) {
      for (const suit of suits) {
        deck.push(rank + suit);
      }
    }
    
    return deck;
  }

  // 原有的生成方法 (简化版)

  private generatePreflopRangeHand(): TrainingHand {
    const positions = Object.keys(POSITIONS);
    const position = positions[Math.floor(Math.random() * positions.length)];
    const holeCards = this.generateRandomHoleCards();
    const stackSize = 100;

    const correctAction = this.calculatePreflopAction(position, holeCards, stackSize);

    return {
      handNumber: 0,
      position,
      holeCards,
      communityCards: '',
      street: STREETS.PREFLOP,
      potSize: 1.5,
      stackSize,
      opponents: this.generateOpponents(5),
      correctAction,
      explanation: this.getPreflopExplanation(position, holeCards, correctAction),
    };
  }

  private generatePotOddsHand(): TrainingHand {
    const holeCards = this.generateRandomHoleCards();
    const communityCards = this.generateCommunityCards(4);
    const potSize = Math.floor(Math.random() * 50) + 10;
    const betSize = Math.floor(potSize * (Math.random() * 0.5 + 0.3));

    const equity = HandEvaluator.calculateEquity(holeCards, communityCards, 1, 1000);
    const potOdds = betSize / (potSize + betSize);
    const correctAction = equity > potOdds
      ? { type: ACTIONS.CALL }
      : { type: ACTIONS.FOLD };

    return {
      handNumber: 0,
      position: POSITIONS.BTN,
      holeCards,
      communityCards,
      street: STREETS.TURN,
      potSize,
      stackSize: 100,
      opponents: [
        {
          position: POSITIONS.CO,
          stackSize: 100,
          style: 'TAG',
          lastAction: { type: ACTIONS.BET, amount: betSize },
        },
      ],
      correctAction,
      explanation: `底池${potSize}，对手下注${betSize}。你的胜率约${(equity * 100).toFixed(1)}%，需要${(potOdds * 100).toFixed(1)}%的胜率才能跟注。${correctAction.type === ACTIONS.CALL ? '跟注有利可图' : '弃牌是正确选择'}。`,
    };
  }

  private generateBluffingHand(): TrainingHand {
    const holeCards = this.generateDrawingHand();
    const communityCards = 'AKQJTh'; // 危险牌面
    const potSize = Math.floor(Math.random() * 30) + 20;

    const correctAction = {
      type: ACTIONS.BET,
      amount: Math.floor(potSize * 0.75),
    };

    return {
      handNumber: 0,
      position: POSITIONS.BTN,
      holeCards,
      communityCards,
      street: STREETS.RIVER,
      potSize,
      stackSize: 100,
      opponents: [
        {
          position: POSITIONS.BB,
          stackSize: 100,
          style: 'TIGHT_PASSIVE',
          lastAction: { type: ACTIONS.CHECK },
        },
      ],
      correctAction,
      explanation: '对手显示弱势，公共牌面有利于诈唬，位置优势允许施压。',
    };
  }

  private generateValueBettingHand(): TrainingHand {
    const holeCards = this.generateStrongHand();
    const communityCards = this.generateCommunityCards(5);
    const potSize = Math.floor(Math.random() * 40) + 15;

    const handStrength = HandEvaluator.evaluate(holeCards, communityCards);
    const betSize = this.calculateValueBetSize(handStrength.rank, potSize);

    return {
      handNumber: 0,
      position: POSITIONS.CO,
      holeCards,
      communityCards,
      street: STREETS.RIVER,
      potSize,
      stackSize: 100,
      opponents: [
        {
          position: POSITIONS.BTN,
          stackSize: 100,
          style: 'CALLING_STATION',
          lastAction: { type: ACTIONS.CHECK },
        },
      ],
      correctAction: {
        type: ACTIONS.BET,
        amount: betSize,
      },
      explanation: `你有${handStrength.name}，对手是跟注站，应该下注${betSize}BB提取价值。`,
    };
  }

  private generatePositionPlayHand(): TrainingHand {
    const inPosition = Math.random() > 0.5;
    const position = inPosition ? POSITIONS.BTN : POSITIONS.BB;
    const holeCards = this.generateMediumHand();
    const communityCards = this.generateCommunityCards(3);
    const potSize = 8;

    const correctAction = inPosition
      ? { type: ACTIONS.BET, amount: 6 }
      : { type: ACTIONS.CHECK };

    return {
      handNumber: 0,
      position,
      holeCards,
      communityCards,
      street: STREETS.FLOP,
      potSize,
      stackSize: 100,
      opponents: [
        {
          position: inPosition ? POSITIONS.BB : POSITIONS.BTN,
          stackSize: 100,
          style: 'TIGHT_AGGRESSIVE',
          lastAction: { type: ACTIONS.CHECK },
        },
      ],
      correctAction,
      explanation: inPosition
        ? '有位置优势，应该持续下注施压'
        : '没有位置，应该过牌控制底池',
    };
  }

  private generateHandReadingHand(): TrainingHand {
    const holeCards = this.generateRandomHoleCards();
    const communityCards = this.generateCommunityCards(5);
    const potSize = 30;

    // 简化的读牌场景
    const correctAction = { type: ACTIONS.CALL };

    return {
      handNumber: 0,
      position: POSITIONS.BTN,
      holeCards,
      communityCards,
      street: STREETS.RIVER,
      potSize,
      stackSize: 100,
      opponents: [
        {
          position: POSITIONS.CO,
          stackSize: 100,
          style: 'UNKNOWN',
          lastAction: { type: ACTIONS.BET, amount: 15 },
        },
      ],
      correctAction,
      explanation: '基于对手的行动线，这里跟注是合理选择。',
    };
  }

  private generateGenericHand(): TrainingHand {
    return {
      handNumber: 0,
      position: POSITIONS.BTN,
      holeCards: this.generateRandomHoleCards(),
      communityCards: this.generateCommunityCards(3),
      street: STREETS.FLOP,
      potSize: 10,
      stackSize: 100,
      opponents: this.generateOpponents(2),
      correctAction: { type: ACTIONS.CHECK },
      explanation: '标准训练场景',
    };
  }

  private calculatePreflopAction(position: string, holeCards: string, stackSize: number): Action {
    const isPremium = ['AA', 'KK', 'QQ', 'AK'].some(h => holeCards.includes(h));
    const isPlayable = ['JJ', 'TT', '99', 'AQ', 'AJ'].some(h => holeCards.includes(h));

    if (isPremium) {
      return { type: ACTIONS.RAISE, amount: 3 };
    } else if (isPlayable && position !== POSITIONS.UTG) {
      return { type: ACTIONS.RAISE, amount: 2.5 };
    } else if (position === POSITIONS.BTN || position === POSITIONS.SB) {
      return { type: ACTIONS.RAISE, amount: 2.5 };
    } else {
      return { type: ACTIONS.FOLD };
    }
  }

  private getPreflopExplanation(position: string, holeCards: string, action: Action): string {
    const positionName = position === POSITIONS.UTG ? '枪口位' :
                        position === POSITIONS.MP ? '中位' :
                        position === POSITIONS.CO ? 'CO位' :
                        position === POSITIONS.BTN ? '按钮位' :
                        position === POSITIONS.SB ? '小盲位' : '大盲位';

    if (action.type === ACTIONS.RAISE) {
      return `在${positionName}拿到${holeCards}，应该加注到${action.amount}BB。`;
    } else {
      return `在${positionName}拿到${holeCards}，应该弃牌。`;
    }
  }

  private calculateValueBetSize(handRank: number, potSize: number): number {
    if (handRank >= 7) return Math.floor(potSize * 1.0);
    if (handRank >= 5) return Math.floor(potSize * 0.75);
    if (handRank >= 3) return Math.floor(potSize * 0.6);
    return Math.floor(potSize * 0.5);
  }
}
}