/**
 * GTO引擎 - 集成CFR算法和策略缓存的高级决策引擎
 * 提供实时GTO策略建议和训练场景生成
 */

import { CFRSolver, CFRResult, TrainingProgress } from './cfr-solver';
import { GameTree, GameState, GameNode, Action, PlayerState } from './game-tree';
import { StrategyCache } from './strategy-cache';
import { HandEvaluator } from './hand-evaluator';
import { POSITIONS, ACTIONS, STREETS, AI_STYLES } from './constants';
import { createLogger } from '@/lib/logger';

const logger = createLogger('gto-engine');

export interface GTODecision {
  action: string;
  amount?: number;
  probability: number;
  alternatives: Array<{
    action: string;
    amount?: number;
    probability: number;
    ev?: number;
  }>;
  reasoning: string;
  exploitability: number;
  confidence: number;
}

export interface GTOAnalysis {
  decision: GTODecision;
  handStrength: number;
  position: string;
  potOdds: number;
  impliedOdds: number;
  equity: number;
  expectedValue: number;
  riskAssessment: {
    variance: number;
    drawouts: number;
    bluffCatchers: string[];
  };
}

export interface TrainingScenario {
  id: string;
  type: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  gameState: GameState;
  correctStrategy: Map<string, number>;
  explanation: string;
  commonMistakes: string[];
  learningObjectives: string[];
}

export interface EngineConfig {
  cfrIterations: number;
  cacheSize: number;
  precomputeCommon: boolean;
  accuracyThreshold: number;
  maxResponseTime: number;
  enableDetailedAnalysis: boolean;
}

// Legacy interfaces for backward compatibility
export interface Scenario {
  holeCards: string[];
  communityCards: string[];
  potSize: number;
  currentBet: number;
  stackSize: number;
  position: string;
  actionHistory: any[];
}

export interface GTOSolution {
  actions: Array<{
    action: string;
    frequency: number;
    size?: number;
  }>;
  ev: Record<string, number>;
  reasoning?: string;
}

export interface EvaluationResult {
  score: number;
  evLoss: number;
  gtoAction: string;
  gtoAmount?: number;
  feedback: any;
}

export class GTOEngine {
  private solver: CFRSolver | null = null;
  private cache: StrategyCache;
  private config: EngineConfig;
  private isTraining: boolean = false;
  private trainingProgress: TrainingProgress | null = null;

  // 预定义的GTO范围 (保持向后兼容)
  private readonly gtoRanges = {
    // 翻前开局范围
    UTG_OPEN: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AQs', 'AJs', 'AKo', 'AQo'],
    MP_OPEN: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'AKo', 'AQo', 'AJo'],
    CO_OPEN: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'QJs', 'JTs', 'AKo', 'AQo', 'AJo', 'KQo'],
    BTN_OPEN: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'KQs', 'KJs', 'KTs', 'K9s', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s', '76s', 'AKo', 'AQo', 'AJo', 'ATo', 'KQo', 'KJo', 'QJo'],
    
    // 3-bet范围
    BTN_3BET_VS_UTG: ['AA', 'KK', 'QQ', 'AKs', 'AKo'],
    BTN_3BET_VS_MP: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQs', 'AKo'],
    BTN_3BET_VS_CO: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AJs', 'KQs', 'AKo', 'AQo'],
    
    // 防守范围
    BB_DEFEND_VS_BTN: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s', 'QJs', 'QTs', 'Q9s', 'Q8s', 'JTs', 'J9s', 'T9s', 'T8s', '98s', '87s', '76s', '65s', '54s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo']
  };

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = {
      cfrIterations: 10000,
      cacheSize: 50000,
      accuracyThreshold: 0.001,
      maxResponseTime: 100,
      enableDetailedAnalysis: true,
      precomputeCommon: true,
      ...config
    };

    this.cache = new StrategyCache({
      maxSize: this.config.cacheSize,
      autoPrecompute: this.config.precomputeCommon
    });

    logger.info('GTO Engine initialized', { config: this.config });
  }

  /**
   * 初始化引擎
   */
  async initialize(): Promise<void> {
    logger.info('Initializing GTO Engine...');

    // 加载缓存
    await this.cache.loadFromDisk();

    // 预计算常见场景
    if (this.config.precomputeCommon) {
      await this.cache.precomputeCommonScenarios();
    }

    logger.info('GTO Engine initialization complete');
  }

  /**
   * 获取GTO决策建议
   */
  async getDecision(gameState: GameState): Promise<GTOAnalysis> {
    const startTime = Date.now();
    
    try {
      const infoSet = this.generateInfoSet(gameState);
      
      // 首先尝试从缓存获取策略
      let strategy = await this.cache.getStrategy(infoSet);
      
      if (!strategy) {
        // 缓存未命中，实时计算
        strategy = await this.computeStrategy(gameState);
        
        if (strategy) {
          await this.cache.setStrategy(infoSet, strategy, {
            exploitability: 0.001, // 占位值
            iterations: this.config.cfrIterations
          });
        }
      }

      if (!strategy || strategy.size === 0) {
        // 如果仍然无法获取策略，返回基础决策
        return this.getBasicDecision(gameState);
      }

      // 构建详细分析
      const analysis = await this.buildAnalysis(gameState, strategy);
      
      const elapsed = Date.now() - startTime;
      logger.debug(`Decision computed in ${elapsed}ms`);
      
      return analysis;
    } catch (error) {
      logger.error('Error computing GTO decision:', error);
      return this.getBasicDecision(gameState);
    }
  }

  /**
   * 生成训练场景
   */
  async generateTrainingScenario(type: string, difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'): Promise<TrainingScenario> {
    const gameState = this.createScenarioState(type, difficulty);
    const strategy = await this.computeStrategy(gameState);
    
    const scenario: TrainingScenario = {
      id: this.generateScenarioId(),
      type,
      difficulty,
      gameState,
      correctStrategy: strategy || new Map(),
      explanation: this.generateExplanation(gameState, strategy),
      commonMistakes: this.getCommonMistakes(type, difficulty),
      learningObjectives: this.getLearningObjectives(type, difficulty)
    };

    return scenario;
  }

  /**
   * 批量生成训练场景
   */
  async generateTrainingBatch(count: number, types: string[], difficulties: string[]): Promise<TrainingScenario[]> {
    const scenarios: TrainingScenario[] = [];
    
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const difficulty = difficulties[i % difficulties.length] as any;
      
      try {
        const scenario = await this.generateTrainingScenario(type, difficulty);
        scenarios.push(scenario);
      } catch (error) {
        logger.warn(`Failed to generate scenario ${i + 1}:`, error);
      }
    }

    logger.info(`Generated ${scenarios.length}/${count} training scenarios`);
    return scenarios;
  }

  /**
   * 开始CFR训练
   */
  async startTraining(gameState: GameState, iterations: number): Promise<void> {
    if (this.isTraining) {
      throw new Error('Training already in progress');
    }

    this.isTraining = true;
    logger.info(`Starting CFR training with ${iterations} iterations`);

    try {
      const gameTree = new GameTree(gameState);
      this.solver = new CFRSolver(gameTree);

      const result = await this.solver.solve(iterations, (progress) => {
        this.trainingProgress = progress;
        logger.debug(`Training progress: ${progress.iteration}/${iterations}, exploitability: ${progress.exploitability.toFixed(6)}`);
      });

      logger.info(`Training completed. Final exploitability: ${result.exploitability.toFixed(6)}`);

      // 将训练结果保存到缓存
      await this.saveTrainingResult(result, gameState);

    } finally {
      this.isTraining = false;
      this.trainingProgress = null;
    }
  }

  /**
   * 获取训练进度
   */
  getTrainingProgress(): TrainingProgress | null {
    return this.trainingProgress;
  }

  /**
   * 评估用户决策 (向后兼容方法)
   */
  async evaluateDecision(
    scenario: Scenario,
    gtoSolution: GTOSolution,
    userAction: string,
    userAmount?: number
  ): Promise<EvaluationResult> {
    // 找出GTO推荐的主要动作
    const gtoAction = this.getMainGTOAction(gtoSolution);
    
    // 计算EV损失
    const userEV = this.calculateActionEV(scenario, userAction, userAmount);
    const gtoEV = gtoSolution.ev[gtoAction.action] || 0;
    const evLoss = Math.max(0, gtoEV - userEV);
    
    // 计算得分（0-100）
    let score = this.calculateScore(userAction, gtoAction.action, evLoss, scenario);
    
    // 生成反馈
    const feedback = this.generateFeedback(score, userAction, gtoAction.action, evLoss);
    
    return {
      score,
      evLoss,
      gtoAction: gtoAction.action,
      gtoAmount: gtoAction.size,
      feedback
    };
  }

  /**
   * 评估用户决策 (新版本使用GameState)
   */
  async evaluateDecisionNew(gameState: GameState, userAction: Action): Promise<{
    isOptimal: boolean;
    evLoss: number;
    optimalAction: string;
    explanation: string;
    ranking: number; // 1-100
  }> {
    const strategy = await this.cache.getStrategy(this.generateInfoSet(gameState));
    
    if (!strategy) {
      return {
        isOptimal: false,
        evLoss: 0,
        optimalAction: ACTIONS.FOLD,
        explanation: '无法评估此决策',
        ranking: 50
      };
    }

    const userActionKey = this.actionToString(userAction);
    const userProb = strategy.get(userActionKey) || 0;
    
    // 找到最优动作
    let bestAction = '';
    let bestProb = 0;
    
    for (const [action, prob] of strategy) {
      if (prob > bestProb) {
        bestAction = action;
        bestProb = prob;
      }
    }

    const evLoss = (bestProb - userProb) * gameState.pot;
    const isOptimal = Math.abs(userProb - bestProb) < 0.05; // 5%容错
    const ranking = Math.round(Math.max(0, Math.min(100, userProb / bestProb * 100)));

    return {
      isOptimal,
      evLoss,
      optimalAction: bestAction,
      explanation: this.generateEvaluationExplanation(userAction, bestAction, evLoss),
      ranking
    };
  }

  /**
   * 计算策略
   */
  private async computeStrategy(gameState: GameState): Promise<Map<string, number> | null> {
    try {
      const gameTree = new GameTree(gameState);
      const solver = new CFRSolver(gameTree);
      
      // 使用较少的迭代次数进行快速计算
      const quickIterations = Math.min(1000, this.config.cfrIterations);
      const result = await solver.solve(quickIterations);
      
      const currentNode = gameTree.getRoot();
      const infoSet = this.generateInfoSet(gameState);
      
      return result.strategy.get(infoSet) || null;
    } catch (error) {
      logger.error('Error computing strategy:', error);
      return null;
    }
  }

  /**
   * 构建详细分析
   */
  private async buildAnalysis(gameState: GameState, strategy: Map<string, number>): Promise<GTOAnalysis> {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    // 找到最优决策
    let bestAction = '';
    let bestProb = 0;
    const alternatives: Array<{ action: string; amount?: number; probability: number; ev?: number }> = [];

    for (const [actionStr, prob] of strategy) {
      const action = this.parseActionString(actionStr);
      
      alternatives.push({
        action: action.type,
        amount: action.amount,
        probability: prob,
        ev: 0 // 占位值
      });

      if (prob > bestProb) {
        bestAction = actionStr;
        bestProb = prob;
      }
    }

    // 排序替代方案
    alternatives.sort((a, b) => b.probability - a.probability);

    const optimalAction = this.parseActionString(bestAction);
    
    const decision: GTODecision = {
      action: optimalAction.type,
      amount: optimalAction.amount,
      probability: bestProb,
      alternatives,
      reasoning: this.generateReasoning(gameState, optimalAction),
      exploitability: 0.001, // 占位值
      confidence: this.calculateConfidence(bestProb, alternatives)
    };

    // 计算各项指标
    const handStrength = this.calculateHandStrength(currentPlayer.holeCards, gameState.communityCards);
    const potOdds = this.calculatePotOdds(gameState);
    const equity = this.calculateEquity(currentPlayer.holeCards, gameState.communityCards);

    return {
      decision,
      handStrength,
      position: currentPlayer.position,
      potOdds,
      impliedOdds: potOdds * 1.2, // 简化计算
      equity,
      expectedValue: 0, // 占位值
      riskAssessment: {
        variance: 0.5,
        drawouts: 0,
        bluffCatchers: []
      }
    };
  }

  /**
   * 获取基础决策（后备方案）
   */
  private getBasicDecision(gameState: GameState): GTOAnalysis {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const handStrength = this.calculateHandStrength(currentPlayer.holeCards, gameState.communityCards);
    
    let action = ACTIONS.FOLD;
    let amount: number | undefined = undefined;
    
    if (handStrength > 0.7) {
      action = ACTIONS.BET;
      amount = Math.floor(gameState.pot * 0.75);
    } else if (handStrength > 0.4) {
      action = ACTIONS.CALL;
    }

    const decision: GTODecision = {
      action,
      amount,
      probability: 1.0,
      alternatives: [],
      reasoning: '基于手牌强度的基础决策',
      exploitability: 0.1,
      confidence: 0.5
    };

    return {
      decision,
      handStrength,
      position: currentPlayer.position,
      potOdds: this.calculatePotOdds(gameState),
      impliedOdds: 0,
      equity: this.calculateEquity(currentPlayer.holeCards, gameState.communityCards),
      expectedValue: 0,
      riskAssessment: {
        variance: 1.0,
        drawouts: 0,
        bluffCatchers: []
      }
    };
  }

  // 下面是向后兼容的旧方法实现

  /**
   * 获取GTO主要推荐动作
   */
  private getMainGTOAction(gtoSolution: GTOSolution) {
    // 找出频率最高的动作
    return gtoSolution.actions.reduce((prev, current) => 
      current.frequency > prev.frequency ? current : prev
    );
  }

  /**
   * 计算动作的EV
   */
  private calculateActionEV(scenario: Scenario, action: string, amount?: number): number {
    const { potSize, currentBet, stackSize } = scenario;
    
    // 简化的EV计算
    switch (action) {
      case 'fold':
        return 0; // 弃牌EV为0
        
      case 'check':
        // Check的EV取决于后续行动，这里简化处理
        return potSize * 0.3; // 假设30%的胜率
        
      case 'call':
        // Call的EV = 胜率 * (pot + call) - call金额
        const callAmount = currentBet;
        const winRate = this.estimateWinRate(scenario);
        return winRate * (potSize + callAmount) - callAmount;
        
      case 'raise':
        // Raise的EV更复杂，需要考虑对手弃牌率和跟注范围
        const raiseAmount = amount || currentBet * 3;
        const foldEquity = this.estimateFoldEquity(scenario, raiseAmount);
        const callWinRate = this.estimateWinRate(scenario) * 0.8; // 对手跟注时我们的胜率会降低
        
        return foldEquity * potSize + 
               (1 - foldEquity) * (callWinRate * (potSize + raiseAmount * 2) - raiseAmount);
        
      default:
        return 0;
    }
  }

  /**
   * 估算胜率
   */
  private estimateWinRate(scenario: Scenario): number {
    const { holeCards, communityCards } = scenario;
    
    // 简化的胜率估算
    // 实际应该使用蒙特卡洛模拟或查表
    const cardStrength = this.evaluateHandStrength(holeCards, communityCards);
    
    // 根据牌力返回估算胜率
    if (cardStrength >= 8) return 0.9;  // 坚果牌
    if (cardStrength >= 6) return 0.7;  // 强牌
    if (cardStrength >= 4) return 0.5;  // 中等牌力
    if (cardStrength >= 2) return 0.3;  // 弱牌
    return 0.1; // 垃圾牌
  }

  /**
   * 估算弃牌率
   */
  private estimateFoldEquity(scenario: Scenario, raiseAmount: number): number {
    const { potSize, stackSize } = scenario;
    
    // 下注大小相对于底池的比例
    const betSizeRatio = raiseAmount / potSize;
    
    // 简化的弃牌率计算
    if (betSizeRatio >= 1.5) return 0.7;  // 超池下注
    if (betSizeRatio >= 1.0) return 0.6;  // 池底下注
    if (betSizeRatio >= 0.75) return 0.5; // 3/4池
    if (betSizeRatio >= 0.5) return 0.4;  // 半池
    if (betSizeRatio >= 0.33) return 0.3; // 1/3池
    return 0.2; // 小注
  }

  /**
   * 评估手牌强度（1-10）
   */
  private evaluateHandStrength(holeCards: string[], communityCards: string[]): number {
    // 简化的牌力评估
    const cards = [...holeCards, ...communityCards];
    
    // 检查是否有对子、两对、三条等
    // 这里使用简化逻辑，实际应该用完整的手牌评估器
    
    // 口袋对
    if (holeCards[0][0] === holeCards[1][0]) {
      if (['A', 'K', 'Q'].includes(holeCards[0][0])) return 7;
      if (['J', 'T', '9'].includes(holeCards[0][0])) return 5;
      return 3;
    }
    
    // 高张
    if (holeCards.some(c => ['A', 'K'].includes(c[0]))) {
      if (holeCards.every(c => ['A', 'K', 'Q'].includes(c[0]))) return 6;
      return 4;
    }
    
    // 同花
    if (holeCards[0][1] === holeCards[1][1]) {
      return 3;
    }
    
    // 连张
    const ranks = '23456789TJQKA';
    const r1 = ranks.indexOf(holeCards[0][0]);
    const r2 = ranks.indexOf(holeCards[1][0]);
    if (Math.abs(r1 - r2) === 1) return 2;
    
    return 1;
  }

  /**
   * 计算得分
   */
  private calculateScore(
    userAction: string, 
    gtoAction: string, 
    evLoss: number,
    scenario: Scenario
  ): number {
    let score = 100;
    
    // 动作匹配度
    if (userAction === gtoAction) {
      // 完全匹配GTO动作
      score = 100;
    } else {
      // 动作不匹配，根据EV损失扣分
      score = Math.max(0, 100 - evLoss * 10);
      
      // 特殊情况调整
      if (userAction === 'fold' && gtoAction === 'call') {
        // 过度保守
        score = Math.min(score, 60);
      } else if (userAction === 'raise' && gtoAction === 'fold') {
        // 过度激进在错误时机
        score = Math.min(score, 40);
      }
    }
    
    return Math.round(score);
  }

  /**
   * 生成反馈
   */
  private generateFeedback(score: number, userAction: string, gtoAction: string, evLoss: number) {
    let level = 'mistake';
    let message = '';
    let explanation = '';
    
    if (score >= 90) {
      level = 'perfect';
      message = '完美决策！';
      explanation = '你的选择完全符合GTO策略。';
    } else if (score >= 70) {
      level = 'good';
      message = '良好决策';
      explanation = `虽然不是最优选择，但EV损失较小（-${evLoss.toFixed(2)}BB）。`;
    } else if (score >= 50) {
      level = 'ok';
      message = '可以接受';
      explanation = `建议选择${this.translateAction(gtoAction)}会更好，EV损失${evLoss.toFixed(2)}BB。`;
    } else {
      level = 'mistake';
      message = '重大失误';
      explanation = `正确选择应该是${this.translateAction(gtoAction)}，你损失了${evLoss.toFixed(2)}BB的期望值。`;
    }
    
    return {
      level,
      message,
      explanation,
      score,
      evLoss,
      suggestedAction: gtoAction
    };
  }

  /**
   * 翻译动作
   */
  private translateAction(action: string): string {
    const translations: Record<string, string> = {
      'fold': '弃牌',
      'check': '过牌',
      'call': '跟注',
      'raise': '加注'
    };
    return translations[action] || action;
  }

  /**
   * 检查手牌是否在特定范围内
   */
  public isHandInRange(hand: string[], range: string[]): boolean {
    const handStr = this.normalizeHand(hand);
    return range.some(r => this.matchesRange(handStr, r));
  }

  /**
   * 标准化手牌表示
   */
  private normalizeHand(hand: string[]): string {
    const ranks = 'AKQJT98765432';
    const r1 = hand[0][0];
    const r2 = hand[1][0];
    const s1 = hand[0][1];
    const s2 = hand[1][1];
    
    // 按牌力排序
    if (ranks.indexOf(r1) > ranks.indexOf(r2)) {
      return r2 + r1 + (s1 === s2 ? 's' : 'o');
    }
    return r1 + r2 + (s1 === s2 ? 's' : 'o');
  }

  /**
   * 匹配范围表示
   */
  private matchesRange(hand: string, range: string): boolean {
    // 处理对子 (如 AA, KK)
    if (range.length === 2 && range[0] === range[1]) {
      return hand[0] === range[0] && hand[1] === range[1];
    }
    
    // 处理同花/非同花 (如 AKs, AKo)
    if (range.endsWith('s') || range.endsWith('o')) {
      return hand === range;
    }
    
    // 处理不分花色 (如 AK)
    return hand.startsWith(range);
  }

  /**
   * 获取位置的开局范围
   */
  public getOpeningRange(position: string): string[] {
    const rangeMap: Record<string, string[]> = {
      'UTG': this.gtoRanges.UTG_OPEN,
      'MP': this.gtoRanges.MP_OPEN,
      'CO': this.gtoRanges.CO_OPEN,
      'BTN': this.gtoRanges.BTN_OPEN,
      'SB': this.gtoRanges.BTN_OPEN, // SB使用BTN范围
      'BB': [] // BB通常不主动开局
    };
    return rangeMap[position] || [];
  }

  // 新增的私有方法

  /**
   * 生成信息集
   */
  private generateInfoSet(gameState: GameState): string {
    const player = gameState.players[gameState.currentPlayer];
    return [
      gameState.street,
      player.holeCards,
      gameState.communityCards,
      player.position,
      gameState.pot.toString(),
      this.getActionHistory(gameState.history)
    ].join('|');
  }

  /**
   * 获取动作历史摘要
   */
  private getActionHistory(history: Action[]): string {
    return history.slice(-5).map(a => `${a.type}:${a.amount || 0}`).join(',');
  }

  /**
   * 创建场景状态
   */
  private createScenarioState(type: string, difficulty: string): GameState {
    // 根据类型和难度创建不同的游戏状态
    const players: PlayerState[] = [
      {
        id: 0,
        position: POSITIONS.BTN,
        stack: 100,
        holeCards: this.generateHoleCards(type),
        invested: 3,
        folded: false,
        allIn: false
      },
      {
        id: 1,
        position: POSITIONS.BB,
        stack: 98,
        holeCards: 'XX', // 隐藏对手牌
        invested: 1,
        folded: false,
        allIn: false
      }
    ];

    return {
      id: this.generateStateId(),
      street: this.getScenarioStreet(type),
      pot: 4,
      communityCards: this.generateCommunityCards(type),
      players,
      currentPlayer: 0,
      history: [
        { type: ACTIONS.RAISE, amount: 3, player: 0 },
        { type: ACTIONS.CALL, amount: 2, player: 1 }
      ],
      isTerminal: false
    };
  }

  /**
   * 生成特定类型的底牌
   */
  private generateHoleCards(type: string): string {
    switch (type) {
      case 'premium_pairs':
        const pairs = ['AA', 'KK', 'QQ', 'JJ'];
        return pairs[Math.floor(Math.random() * pairs.length)];
      
      case 'suited_connectors':
        const connectors = ['JTs', 'T9s', '98s', '87s', '76s'];
        return connectors[Math.floor(Math.random() * connectors.length)];
      
      case 'bluffing_hands':
        const bluffs = ['A5s', 'A4s', 'K5s', 'Q6s', 'J8s'];
        return bluffs[Math.floor(Math.random() * bluffs.length)];
      
      default:
        return 'AsKh'; // 默认AK
    }
  }

  /**
   * 生成公共牌
   */
  private generateCommunityCards(type: string): string {
    switch (type) {
      case 'dry_board':
        return 'Ah7c2d';
      case 'wet_board':
        return 'Ts9h8c';
      case 'paired_board':
        return 'QsQh5d';
      default:
        return 'Kh9d4c';
    }
  }

  /**
   * 获取场景街道
   */
  private getScenarioStreet(type: string): string {
    if (type.includes('preflop')) return STREETS.PREFLOP;
    if (type.includes('river')) return STREETS.RIVER;
    return STREETS.FLOP;
  }

  /**
   * 计算手牌强度
   */
  private calculateHandStrength(holeCards: string, communityCards: string): number {
    if (!communityCards) {
      // 翻前手牌强度评估
      return this.evaluatePreflopStrength(holeCards);
    }

    try {
      const handRank = HandEvaluator.evaluate(holeCards, communityCards);
      return handRank.rank / 10; // 归一化到0-1
    } catch {
      return 0.5; // 默认中等强度
    }
  }

  /**
   * 评估翻前手牌强度
   */
  private evaluatePreflopStrength(holeCards: string): number {
    const premiumHands = ['AA', 'KK', 'QQ', 'AKs', 'AKo'];
    const strongHands = ['JJ', 'TT', 'AQs', 'AQo', 'AJs', 'KQs'];
    const playableHands = ['99', '88', '77', 'AJo', 'ATs', 'KJs', 'QJs'];

    if (premiumHands.includes(holeCards)) return 0.9;
    if (strongHands.includes(holeCards)) return 0.7;
    if (playableHands.includes(holeCards)) return 0.5;
    
    return 0.3;
  }

  /**
   * 计算底池赔率
   */
  private calculatePotOdds(gameState: GameState): number {
    const callAmount = this.getCallAmount(gameState);
    return callAmount / (gameState.pot + callAmount);
  }

  /**
   * 计算胜率
   */
  private calculateEquity(holeCards: string, communityCards: string): number {
    try {
      return HandEvaluator.calculateEquity(holeCards, communityCards, 1, 1000);
    } catch {
      return 0.5; // 默认50%胜率
    }
  }

  /**
   * 获取跟注金额
   */
  private getCallAmount(gameState: GameState): number {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const maxInvested = Math.max(...gameState.players.map(p => p.invested));
    return Math.max(0, maxInvested - currentPlayer.invested);
  }

  /**
   * 动作转字符串
   */
  private actionToString(action: Action): string {
    return action.amount ? `${action.type}:${action.amount}` : action.type;
  }

  /**
   * 解析动作字符串
   */
  private parseActionString(actionStr: string): Action {
    const [type, amountStr] = actionStr.split(':');
    return {
      type,
      amount: amountStr ? parseInt(amountStr) : undefined,
      player: 0
    };
  }

  /**
   * 生成推理说明
   */
  private generateReasoning(gameState: GameState, action: Action): string {
    const player = gameState.players[gameState.currentPlayer];
    const handStrength = this.calculateHandStrength(player.holeCards, gameState.communityCards);
    
    if (action.type === ACTIONS.BET || action.type === ACTIONS.RAISE) {
      if (handStrength > 0.7) {
        return '强牌价值下注，最大化价值提取';
      } else {
        return '半诈唬下注，建立底池并施压对手';
      }
    } else if (action.type === ACTIONS.CALL) {
      return '基于底池赔率和胜率的跟注';
    } else if (action.type === ACTIONS.FOLD) {
      return '手牌强度不足，弃牌减损';
    }
    
    return '过牌控制底池';
  }

  /**
   * 计算决策信心度
   */
  private calculateConfidence(bestProb: number, alternatives: any[]): number {
    if (alternatives.length < 2) return 1.0;
    
    const secondBest = alternatives[1]?.probability || 0;
    const gap = bestProb - secondBest;
    
    return Math.min(1.0, gap * 2 + 0.5);
  }

  /**
   * 生成解释
   */
  private generateExplanation(gameState: GameState, strategy: Map<string, number> | null): string {
    if (!strategy) return '无法生成策略解释';
    
    const actions = Array.from(strategy.entries()).sort((a, b) => b[1] - a[1]);
    const topAction = actions[0];
    
    return `在此情况下，最优策略是${topAction[0]}（概率${(topAction[1] * 100).toFixed(1)}%）`;
  }

  /**
   * 获取常见错误
   */
  private getCommonMistakes(type: string, difficulty: string): string[] {
    const mistakes = [
      '下注尺寸不当',
      '忽略位置因素',
      '过度激进',
      '过度保守',
      '未考虑对手范围'
    ];
    
    return mistakes.slice(0, Math.max(2, Math.floor(Math.random() * 4)));
  }

  /**
   * 获取学习目标
   */
  private getLearningObjectives(type: string, difficulty: string): string[] {
    return [
      '理解GTO策略原理',
      '掌握平衡下注尺寸',
      '学会范围分析',
      '提高决策准确率'
    ];
  }

  /**
   * 生成评估解释
   */
  private generateEvaluationExplanation(userAction: Action, optimalAction: string, evLoss: number): string {
    if (evLoss < 0.1) {
      return '决策接近最优，表现优秀';
    } else if (evLoss < 0.5) {
      return `决策略有偏差，最优选择是${optimalAction}`;
    } else {
      return `决策存在较大偏差，建议选择${optimalAction}`;
    }
  }

  /**
   * 保存训练结果
   */
  private async saveTrainingResult(result: CFRResult, gameState: GameState): Promise<void> {
    for (const [infoSet, strategy] of result.strategy) {
      await this.cache.setStrategy(infoSet, strategy, {
        exploitability: result.exploitability,
        iterations: result.iterations
      });
    }
  }

  /**
   * 生成场景ID
   */
  private generateScenarioId(): string {
    return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成状态ID
   */
  private generateStateId(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取引擎统计信息
   */
  getStats() {
    return {
      cache: this.cache.getStats(),
      isTraining: this.isTraining,
      config: this.config
    };
  }

  /**
   * 关闭引擎
   */
  async shutdown(): Promise<void> {
    if (this.cache) {
      await this.cache.saveToDisk();
    }
    logger.info('GTO Engine shutdown complete');
  }
}

export const gtoEngine = new GTOEngine();