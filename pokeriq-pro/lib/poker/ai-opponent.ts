import { POSITIONS, ACTIONS, AI_STYLES, RANK_VALUES } from './constants';
import { HandEvaluator } from './hand-evaluator';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ai-opponent');

export interface AIDecision {
  action: string;
  amount?: number;
  confidence: number;
  reasoning: string;
}

export interface GameState {
  position: string;
  holeCards: string;
  communityCards: string;
  street: string;
  potSize: number;
  stackSize: number;
  opponentStack: number;
  bettingHistory: BettingAction[];
  playerStats?: PlayerStats;
}

export interface BettingAction {
  player: string;
  action: string;
  amount?: number;
  street: string;
}

export interface PlayerStats {
  vpip: number;  // 自愿入池率
  pfr: number;   // 翻前加注率
  af: number;    // 激进度因子
  wtsd: number;  // 摊牌率
  handsPlayed: number;
}

/**
 * AI对手系统
 */
export class AIOpponent {
  private style: keyof typeof AI_STYLES;
  private stats: PlayerStats;
  private handHistory: BettingAction[] = [];
  private bluffFrequency: number;
  private adaptability: number;
  private tiltFactor: number = 0;

  constructor(style: keyof typeof AI_STYLES = 'TIGHT_AGGRESSIVE') {
    this.style = style;
    const aiStyle = AI_STYLES[style];
    
    this.stats = {
      vpip: aiStyle.vpip,
      pfr: aiStyle.pfr,
      af: aiStyle.aggression,
      wtsd: this.calculateWTSD(style),
      handsPlayed: 0,
    };

    this.bluffFrequency = this.calculateBluffFrequency(style);
    this.adaptability = this.calculateAdaptability(style);
  }

  /**
   * 做出决策
   */
  makeDecision(gameState: GameState): AIDecision {
    // 记录手牌历史
    this.stats.handsPlayed++;

    // 根据游戏阶段选择策略
    let decision: AIDecision;

    switch (gameState.street) {
      case 'PREFLOP':
        decision = this.makePreflopDecision(gameState);
        break;
      case 'FLOP':
        decision = this.makeFlopDecision(gameState);
        break;
      case 'TURN':
        decision = this.makeTurnDecision(gameState);
        break;
      case 'RIVER':
        decision = this.makeRiverDecision(gameState);
        break;
      default:
        decision = this.makeDefaultDecision(gameState);
    }

    // 应用倾斜因子
    if (this.tiltFactor > 0) {
      decision = this.applyTilt(decision, gameState);
    }

    // 记录决策
    this.handHistory.push({
      player: 'AI',
      action: decision.action,
      amount: decision.amount,
      street: gameState.street,
    });

    logger.debug('AI decision made', {
      style: this.style,
      decision,
      gameState,
    });

    return decision;
  }

  /**
   * 翻前决策
   */
  private makePreflopDecision(gameState: GameState): AIDecision {
    const handStrength = this.evaluatePreflopStrength(gameState.holeCards);
    const positionValue = this.getPositionValue(gameState.position);
    const lastAction = this.getLastOpponentAction(gameState.bettingHistory);
    
    // 计算入池概率
    const vpipThreshold = this.stats.vpip / 100;
    const pfrThreshold = this.stats.pfr / 100;
    
    // 调整基于位置的阈值
    const adjustedVpip = vpipThreshold * (1 + positionValue * 0.3);
    const adjustedPfr = pfrThreshold * (1 + positionValue * 0.4);

    // 面对加注的调整
    if (lastAction && lastAction.action === ACTIONS.RAISE) {
      const raiseMultiplier = (lastAction.amount || 3) / 3;
      const callThreshold = adjustedVpip / raiseMultiplier;
      const reraiseThreshold = adjustedPfr / (raiseMultiplier * 1.5);

      if (handStrength > reraiseThreshold) {
        const raiseSize = this.calculateRaiseSize(gameState, 3);
        return {
          action: ACTIONS.RAISE,
          amount: raiseSize,
          confidence: 0.8,
          reasoning: '强牌再加注',
        };
      } else if (handStrength > callThreshold) {
        return {
          action: ACTIONS.CALL,
          confidence: 0.6,
          reasoning: '中等牌力跟注',
        };
      } else {
        return {
          action: ACTIONS.FOLD,
          confidence: 0.9,
          reasoning: '牌力不足弃牌',
        };
      }
    }

    // 主动行动
    if (handStrength > adjustedPfr) {
      const raiseSize = this.calculateRaiseSize(gameState, 2.5);
      return {
        action: ACTIONS.RAISE,
        amount: raiseSize,
        confidence: 0.7,
        reasoning: '主动加注',
      };
    } else if (handStrength > adjustedVpip) {
      return {
        action: ACTIONS.CALL,
        confidence: 0.5,
        reasoning: '跟注入池',
      };
    } else {
      return {
        action: ACTIONS.FOLD,
        confidence: 0.8,
        reasoning: '弱牌弃牌',
      };
    }
  }

  /**
   * 翻牌圈决策
   */
  private makeFlopDecision(gameState: GameState): AIDecision {
    const handStrength = this.evaluatePostflopStrength(
      gameState.holeCards,
      gameState.communityCards
    );
    const boardTexture = this.analyzeBoardTexture(gameState.communityCards);
    const position = this.isInPosition(gameState.position, gameState.bettingHistory);
    const potOdds = this.calculatePotOdds(gameState);

    // 持续下注逻辑
    if (this.shouldContinuationBet(gameState, boardTexture, position)) {
      const betSize = this.calculateCBetSize(gameState.potSize, boardTexture);
      return {
        action: ACTIONS.BET,
        amount: betSize,
        confidence: 0.7,
        reasoning: '持续下注',
      };
    }

    // 面对下注的决策
    const lastAction = this.getLastOpponentAction(gameState.bettingHistory);
    if (lastAction && lastAction.action === ACTIONS.BET) {
      const equity = HandEvaluator.calculateEquity(
        gameState.holeCards,
        gameState.communityCards,
        1,
        1000
      );

      if (equity > potOdds + 0.1) {
        // 强牌加注
        if (equity > 0.7 && this.stats.af > 2) {
          const raiseSize = this.calculateRaiseSize(gameState, 2.5);
          return {
            action: ACTIONS.RAISE,
            amount: raiseSize,
            confidence: 0.8,
            reasoning: '价值加注',
          };
        }
        // 跟注
        return {
          action: ACTIONS.CALL,
          confidence: 0.6,
          reasoning: '赔率合适跟注',
        };
      } else if (this.shouldBluff(gameState, boardTexture)) {
        // 诈唬加注
        const raiseSize = this.calculateRaiseSize(gameState, 2.5);
        return {
          action: ACTIONS.RAISE,
          amount: raiseSize,
          confidence: 0.5,
          reasoning: '诈唬加注',
        };
      } else {
        return {
          action: ACTIONS.FOLD,
          confidence: 0.7,
          reasoning: '赔率不足弃牌',
        };
      }
    }

    // 主动行动
    if (handStrength > 0.6 || this.shouldBluff(gameState, boardTexture)) {
      const betSize = this.calculateBetSize(gameState.potSize, handStrength);
      return {
        action: ACTIONS.BET,
        amount: betSize,
        confidence: 0.6,
        reasoning: handStrength > 0.6 ? '价值下注' : '诈唬',
      };
    }

    return {
      action: ACTIONS.CHECK,
      confidence: 0.5,
      reasoning: '控制底池',
    };
  }

  /**
   * 转牌圈决策
   */
  private makeTurnDecision(gameState: GameState): AIDecision {
    const handStrength = this.evaluatePostflopStrength(
      gameState.holeCards,
      gameState.communityCards
    );
    const boardTexture = this.analyzeBoardTexture(gameState.communityCards);
    const turnCard = gameState.communityCards.slice(-2);
    const turnImproved = this.didTurnImprove(turnCard, boardTexture);

    // 评估对手范围
    const opponentRange = this.estimateOpponentRange(gameState.bettingHistory);
    const relativeStrength = this.calculateRelativeStrength(handStrength, opponentRange);

    const lastAction = this.getLastOpponentAction(gameState.bettingHistory);
    
    if (lastAction && lastAction.action === ACTIONS.BET) {
      const potOdds = this.calculatePotOdds(gameState);
      
      if (relativeStrength > 0.7) {
        // 强牌加注
        const raiseSize = this.calculateRaiseSize(gameState, 2.5);
        return {
          action: ACTIONS.RAISE,
          amount: raiseSize,
          confidence: 0.8,
          reasoning: '转牌强牌加注',
        };
      } else if (relativeStrength > potOdds) {
        return {
          action: ACTIONS.CALL,
          confidence: 0.6,
          reasoning: '转牌跟注',
        };
      } else {
        return {
          action: ACTIONS.FOLD,
          confidence: 0.7,
          reasoning: '转牌弃牌',
        };
      }
    }

    // 主动下注逻辑
    if (relativeStrength > 0.6 || (turnImproved && this.shouldBluff(gameState, boardTexture))) {
      const betSize = this.calculateBetSize(gameState.potSize, relativeStrength);
      return {
        action: ACTIONS.BET,
        amount: betSize,
        confidence: 0.6,
        reasoning: relativeStrength > 0.6 ? '转牌价值下注' : '转牌诈唬',
      };
    }

    return {
      action: ACTIONS.CHECK,
      confidence: 0.5,
      reasoning: '转牌过牌',
    };
  }

  /**
   * 河牌圈决策
   */
  private makeRiverDecision(gameState: GameState): AIDecision {
    const handStrength = this.evaluatePostflopStrength(
      gameState.holeCards,
      gameState.communityCards
    );
    const finalHand = HandEvaluator.evaluate(gameState.holeCards, gameState.communityCards);
    
    // 评估摊牌价值
    const showdownValue = this.evaluateShowdownValue(finalHand, gameState);
    const opponentRange = this.estimateOpponentRange(gameState.bettingHistory);
    const winProbability = this.calculateWinProbability(finalHand, opponentRange);

    const lastAction = this.getLastOpponentAction(gameState.bettingHistory);
    
    if (lastAction && lastAction.action === ACTIONS.BET) {
      const potOdds = this.calculatePotOdds(gameState);
      
      if (winProbability > 0.8 && this.stats.af > 2) {
        // 超强牌加注
        const raiseSize = this.calculateRaiseSize(gameState, 3);
        return {
          action: ACTIONS.RAISE,
          amount: raiseSize,
          confidence: 0.9,
          reasoning: '河牌价值加注',
        };
      } else if (winProbability > potOdds) {
        return {
          action: ACTIONS.CALL,
          confidence: 0.6,
          reasoning: '河牌抓诈',
        };
      } else {
        return {
          action: ACTIONS.FOLD,
          confidence: 0.8,
          reasoning: '河牌弃牌',
        };
      }
    }

    // 河牌主动下注
    if (showdownValue > 0.7) {
      // 价值下注
      const betSize = this.calculateRiverBetSize(gameState.potSize, showdownValue);
      return {
        action: ACTIONS.BET,
        amount: betSize,
        confidence: 0.7,
        reasoning: '河牌价值下注',
      };
    } else if (this.shouldRiverBluff(gameState, finalHand)) {
      // 河牌诈唬
      const bluffSize = this.calculateBluffSize(gameState.potSize);
      return {
        action: ACTIONS.BET,
        amount: bluffSize,
        confidence: 0.4,
        reasoning: '河牌诈唬',
      };
    }

    return {
      action: ACTIONS.CHECK,
      confidence: 0.6,
      reasoning: '河牌过牌',
    };
  }

  /**
   * 默认决策
   */
  private makeDefaultDecision(gameState: GameState): AIDecision {
    return {
      action: ACTIONS.CHECK,
      confidence: 0.5,
      reasoning: '默认过牌',
    };
  }

  // 辅助方法

  private evaluatePreflopStrength(holeCards: string): number {
    // 简化的翻前牌力评估
    const cards = holeCards.match(/.{1}/g) || [];
    if (cards.length < 2) return 0;

    const rank1 = RANK_VALUES[cards[0]];
    const rank2 = RANK_VALUES[cards[2]];
    const suited = cards[1] === cards[3];

    let strength = (rank1 + rank2) / 28; // 归一化

    // 对子加成
    if (rank1 === rank2) {
      strength *= 1.5;
    }

    // 同花加成
    if (suited) {
      strength *= 1.1;
    }

    // 连牌加成
    if (Math.abs(rank1 - rank2) === 1) {
      strength *= 1.05;
    }

    return Math.min(1, strength);
  }

  private evaluatePostflopStrength(holeCards: string, communityCards: string): number {
    if (!communityCards) return this.evaluatePreflopStrength(holeCards);
    
    const equity = HandEvaluator.calculateEquity(holeCards, communityCards, 1, 1000);
    return equity;
  }

  private getPositionValue(position: string): number {
    const positionValues: Record<string, number> = {
      [POSITIONS.BTN]: 1.0,
      [POSITIONS.CO]: 0.8,
      [POSITIONS.MP]: 0.5,
      [POSITIONS.EP]: 0.3,
      [POSITIONS.UTG]: 0.2,
      [POSITIONS.BB]: 0.4,
      [POSITIONS.SB]: 0.3,
    };
    return positionValues[position] || 0.5;
  }

  private getLastOpponentAction(history: BettingAction[]): BettingAction | null {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].player !== 'AI') {
        return history[i];
      }
    }
    return null;
  }

  private calculateRaiseSize(gameState: GameState, multiplier: number): number {
    const lastBet = this.getLastBetSize(gameState.bettingHistory);
    const minRaise = lastBet * multiplier;
    const maxRaise = Math.min(gameState.stackSize, gameState.potSize);
    
    return Math.floor(Math.min(minRaise, maxRaise));
  }

  private getLastBetSize(history: BettingAction[]): number {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].amount) {
        return history[i].amount;
      }
    }
    return 1; // 默认大盲注
  }

  private calculateBetSize(potSize: number, strength: number): number {
    // 根据牌力决定下注大小
    if (strength > 0.8) {
      return Math.floor(potSize * 0.75);
    } else if (strength > 0.6) {
      return Math.floor(potSize * 0.6);
    } else {
      return Math.floor(potSize * 0.5);
    }
  }

  private calculateCBetSize(potSize: number, boardTexture: any): number {
    // 根据牌面结构决定持续下注大小
    if (boardTexture.isWet) {
      return Math.floor(potSize * 0.75);
    } else {
      return Math.floor(potSize * 0.5);
    }
  }

  private calculateRiverBetSize(potSize: number, showdownValue: number): number {
    if (showdownValue > 0.9) {
      return Math.floor(potSize * 1.0);
    } else if (showdownValue > 0.7) {
      return Math.floor(potSize * 0.6);
    } else {
      return Math.floor(potSize * 0.4);
    }
  }

  private calculateBluffSize(potSize: number): number {
    // 诈唬下注通常是底池的60-75%
    return Math.floor(potSize * (0.6 + Math.random() * 0.15));
  }

  private calculatePotOdds(gameState: GameState): number {
    const lastAction = this.getLastOpponentAction(gameState.bettingHistory);
    if (!lastAction || !lastAction.amount) return 0;
    
    const callAmount = lastAction.amount;
    const totalPot = gameState.potSize + callAmount;
    
    return callAmount / totalPot;
  }

  private analyzeBoardTexture(communityCards: string): any {
    if (!communityCards) return { isWet: false, isDrawy: false };
    
    const cards = communityCards.match(/.{2}/g) || [];
    const ranks = cards.map(c => RANK_VALUES[c[0]]);
    const suits = cards.map(c => c[1]);
    
    // 检查是否湿润牌面
    const uniqueRanks = new Set(ranks).size;
    const uniqueSuits = new Set(suits).size;
    
    const isWet = uniqueRanks < cards.length || uniqueSuits <= 2;
    const isDrawy = this.hasDraws(ranks, suits);
    
    return { isWet, isDrawy };
  }

  private hasDraws(ranks: number[], suits: string[]): boolean {
    // 检查同花听牌
    const suitCounts: Record<string, number> = {};
    for (const suit of suits) {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
      if (suitCounts[suit] >= 3) return true;
    }
    
    // 检查顺子听牌
    const sortedRanks = [...new Set(ranks)].sort((a, b) => a - b);
    for (let i = 0; i < sortedRanks.length - 2; i++) {
      if (sortedRanks[i + 2] - sortedRanks[i] <= 4) return true;
    }
    
    return false;
  }

  private isInPosition(position: string, history: BettingAction[]): boolean {
    // 简化的位置判断
    return position === POSITIONS.BTN || position === POSITIONS.CO;
  }

  private shouldContinuationBet(gameState: GameState, boardTexture: any, inPosition: boolean): boolean {
    // 持续下注逻辑
    const wasAggressor = this.wasPreFlopAggressor(gameState.bettingHistory);
    
    if (!wasAggressor) return false;
    
    // 根据风格调整CB频率
    const cbFrequency = this.style === 'LOOSE_AGGRESSIVE' ? 0.8 :
                        this.style === 'TIGHT_AGGRESSIVE' ? 0.7 :
                        this.style === 'MANIAC' ? 0.9 : 0.5;
    
    return Math.random() < cbFrequency;
  }

  private wasPreFlopAggressor(history: BettingAction[]): boolean {
    const preflopActions = history.filter(a => a.street === 'PREFLOP' && a.player === 'AI');
    return preflopActions.some(a => a.action === ACTIONS.RAISE);
  }

  private shouldBluff(gameState: GameState, boardTexture: any): boolean {
    // 根据风格和牌面决定是否诈唬
    const bluffChance = this.bluffFrequency * (boardTexture.isWet ? 0.7 : 1.2);
    return Math.random() < bluffChance;
  }

  private shouldRiverBluff(gameState: GameState, hand: any): boolean {
    // 河牌诈唬需要更谨慎
    if (hand.rank > 2) return false; // 有摊牌价值不诈唬
    
    const bluffChance = this.bluffFrequency * 0.5;
    return Math.random() < bluffChance;
  }

  private didTurnImprove(turnCard: string, boardTexture: any): boolean {
    // 简化判断转牌是否改善牌面
    return Math.random() < 0.3;
  }

  private estimateOpponentRange(history: BettingAction[]): any {
    // 根据对手行动估计范围
    const aggressiveActions = history.filter(
      a => a.player !== 'AI' && (a.action === ACTIONS.RAISE || a.action === ACTIONS.BET)
    ).length;
    
    if (aggressiveActions >= 2) {
      return { strength: 0.8, size: 0.1 }; // 强范围，窄
    } else if (aggressiveActions === 1) {
      return { strength: 0.6, size: 0.3 }; // 中等范围
    } else {
      return { strength: 0.4, size: 0.5 }; // 弱范围，宽
    }
  }

  private calculateRelativeStrength(absoluteStrength: number, opponentRange: any): number {
    // 相对于对手范围的牌力
    return absoluteStrength / opponentRange.strength;
  }

  private evaluateShowdownValue(hand: any, gameState: GameState): number {
    // 评估摊牌价值
    const handRank = hand.rank;
    const normalizedRank = handRank / 10;
    
    // 根据底池大小调整
    const potFactor = Math.min(gameState.potSize / gameState.stackSize, 1);
    
    return normalizedRank * (1 + potFactor * 0.2);
  }

  private calculateWinProbability(hand: any, opponentRange: any): number {
    // 简化的获胜概率计算
    const handStrength = hand.rank / 10;
    return handStrength / (handStrength + opponentRange.strength);
  }

  private calculateWTSD(style: keyof typeof AI_STYLES): number {
    // 根据风格计算摊牌率
    const wtsdMap: Record<keyof typeof AI_STYLES, number> = {
      TIGHT_PASSIVE: 25,
      TIGHT_AGGRESSIVE: 28,
      LOOSE_PASSIVE: 35,
      LOOSE_AGGRESSIVE: 30,
      MANIAC: 40,
      NIT: 20,
      CALLING_STATION: 45,
      SHARK: 27,
    };
    return wtsdMap[style];
  }

  private calculateBluffFrequency(style: keyof typeof AI_STYLES): number {
    // 根据风格计算诈唬频率
    const bluffMap: Record<keyof typeof AI_STYLES, number> = {
      TIGHT_PASSIVE: 0.05,
      TIGHT_AGGRESSIVE: 0.15,
      LOOSE_PASSIVE: 0.08,
      LOOSE_AGGRESSIVE: 0.25,
      MANIAC: 0.35,
      NIT: 0.02,
      CALLING_STATION: 0.03,
      SHARK: 0.18,
    };
    return bluffMap[style];
  }

  private calculateAdaptability(style: keyof typeof AI_STYLES): number {
    // 根据风格计算适应性
    const adaptMap: Record<keyof typeof AI_STYLES, number> = {
      TIGHT_PASSIVE: 0.2,
      TIGHT_AGGRESSIVE: 0.6,
      LOOSE_PASSIVE: 0.3,
      LOOSE_AGGRESSIVE: 0.7,
      MANIAC: 0.1,
      NIT: 0.1,
      CALLING_STATION: 0.1,
      SHARK: 0.9,
    };
    return adaptMap[style];
  }

  private applyTilt(decision: AIDecision, gameState: GameState): AIDecision {
    // 应用倾斜因子（情绪化决策）
    if (this.tiltFactor > 0.5 && decision.action === ACTIONS.FOLD) {
      // 倾斜时更容易跟注
      return {
        action: ACTIONS.CALL,
        confidence: decision.confidence * 0.7,
        reasoning: decision.reasoning + '（情绪化）',
      };
    }
    
    if (this.tiltFactor > 0.7 && decision.action === ACTIONS.CALL) {
      // 严重倾斜时更激进
      return {
        action: ACTIONS.RAISE,
        amount: this.calculateRaiseSize(gameState, 3),
        confidence: decision.confidence * 0.5,
        reasoning: decision.reasoning + '（上头）',
      };
    }
    
    return decision;
  }

  /**
   * 调整AI行为
   */
  adjustBehavior(results: { won: boolean; profit: number }) {
    // 根据结果调整倾斜因子
    if (!results.won && results.profit < -20) {
      this.tiltFactor = Math.min(1, this.tiltFactor + 0.1);
    } else if (results.won && results.profit > 20) {
      this.tiltFactor = Math.max(0, this.tiltFactor - 0.1);
    }

    // 适应性调整
    if (this.adaptability > 0.5) {
      // 高适应性AI会调整打法
      if (!results.won) {
        // 输了变紧
        this.stats.vpip *= 0.95;
        this.stats.pfr *= 0.95;
      } else {
        // 赢了可以适当放松
        this.stats.vpip *= 1.02;
        this.stats.pfr *= 1.02;
      }
    }
  }

  /**
   * 重置AI状态
   */
  reset() {
    const aiStyle = AI_STYLES[this.style];
    this.stats = {
      vpip: aiStyle.vpip,
      pfr: aiStyle.pfr,
      af: aiStyle.aggression,
      wtsd: this.calculateWTSD(this.style),
      handsPlayed: 0,
    };
    this.handHistory = [];
    this.tiltFactor = 0;
  }

  /**
   * 获取AI统计信息
   */
  getStats(): PlayerStats {
    return { ...this.stats };
  }

  /**
   * 获取AI风格描述
   */
  getStyleDescription(): string {
    return AI_STYLES[this.style].description;
  }
}