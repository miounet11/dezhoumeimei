import { Card } from './card';
import { HandEvaluator } from './hand-evaluator';

export type AIStyle = 'TAG' | 'LAG' | 'ROCK' | 'MANIAC' | 'FISH';
export type PokerAction = 'fold' | 'check' | 'call' | 'raise' | 'allin';

interface GameContext {
  holeCards: Card[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  playerStack: number;
  opponentStack: number;
  street: 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER';
  position: 'IP' | 'OOP'; // In Position / Out of Position
  history: PokerAction[];
}

export class AIStrategy {
  private style: AIStyle;
  private aggressionFactor: number;
  private bluffFrequency: number;
  private tightness: number;

  constructor(style: AIStyle = 'TAG') {
    this.style = style;
    this.setStyleParameters(style);
  }

  private setStyleParameters(style: AIStyle) {
    switch (style) {
      case 'TAG': // Tight Aggressive - 紧凶型
        this.tightness = 0.75;
        this.aggressionFactor = 0.7;
        this.bluffFrequency = 0.15;
        break;
      case 'LAG': // Loose Aggressive - 松凶型
        this.tightness = 0.4;
        this.aggressionFactor = 0.8;
        this.bluffFrequency = 0.25;
        break;
      case 'ROCK': // Super Tight - 超紧型
        this.tightness = 0.9;
        this.aggressionFactor = 0.3;
        this.bluffFrequency = 0.05;
        break;
      case 'MANIAC': // Super Aggressive - 疯狂型
        this.tightness = 0.2;
        this.aggressionFactor = 0.95;
        this.bluffFrequency = 0.35;
        break;
      case 'FISH': // Passive Calling Station - 鱼
        this.tightness = 0.3;
        this.aggressionFactor = 0.2;
        this.bluffFrequency = 0.1;
        break;
    }
  }

  getAction(context: GameContext): { action: PokerAction; amount?: number } {
    const handStrength = this.evaluateHandStrength(context);
    const potOdds = this.calculatePotOdds(context);
    const shouldBluff = Math.random() < this.bluffFrequency;

    // 翻前策略
    if (context.street === 'PREFLOP') {
      return this.getPreflopAction(context, handStrength);
    }

    // 翻后策略
    return this.getPostflopAction(context, handStrength, potOdds, shouldBluff);
  }

  private getPreflopAction(context: GameContext, handStrength: number): { action: PokerAction; amount?: number } {
    const { currentBet, playerStack, pot } = context;
    
    // 根据手牌强度和风格决定动作
    if (handStrength < 0.3 - (1 - this.tightness) * 0.2) {
      return { action: 'fold' };
    }

    if (currentBet === 0) {
      // 没有下注时
      if (handStrength > 0.6 || Math.random() < this.aggressionFactor) {
        const raiseAmount = Math.floor(pot * 2.5 + Math.random() * pot);
        return { action: 'raise', amount: Math.min(raiseAmount, playerStack) };
      }
      return { action: 'check' };
    }

    // 面对下注
    if (handStrength > 0.7) {
      // 强牌再加注
      const raiseAmount = Math.floor(currentBet * 2.5 + Math.random() * currentBet);
      return { action: 'raise', amount: Math.min(raiseAmount, playerStack) };
    } else if (handStrength > 0.4 || this.style === 'FISH') {
      // 中等牌力跟注
      return { action: 'call' };
    }

    return { action: 'fold' };
  }

  private getPostflopAction(
    context: GameContext,
    handStrength: number,
    potOdds: number,
    shouldBluff: boolean
  ): { action: PokerAction; amount?: number } {
    const { currentBet, playerStack, pot } = context;

    // 非常强的牌
    if (handStrength > 0.85) {
      if (currentBet === 0) {
        // 慢打或价值下注
        if (Math.random() < 0.3) {
          return { action: 'check' };
        }
        const betAmount = Math.floor(pot * 0.6 + Math.random() * pot * 0.4);
        return { action: 'raise', amount: Math.min(betAmount, playerStack) };
      }
      // 面对下注时加注
      const raiseAmount = Math.floor(currentBet * 2 + Math.random() * currentBet);
      return { action: 'raise', amount: Math.min(raiseAmount, playerStack) };
    }

    // 中等牌力
    if (handStrength > 0.5) {
      if (currentBet === 0) {
        if (Math.random() < this.aggressionFactor) {
          const betAmount = Math.floor(pot * 0.5);
          return { action: 'raise', amount: Math.min(betAmount, playerStack) };
        }
        return { action: 'check' };
      }
      // 根据底池赔率决定
      if (potOdds > handStrength) {
        return { action: 'call' };
      }
      return { action: 'fold' };
    }

    // 弱牌
    if (currentBet === 0) {
      // 诈唬机会
      if (shouldBluff && Math.random() < this.aggressionFactor) {
        const bluffAmount = Math.floor(pot * 0.6);
        return { action: 'raise', amount: Math.min(bluffAmount, playerStack) };
      }
      return { action: 'check' };
    }

    // 面对下注通常弃牌
    if (this.style === 'FISH' && Math.random() < 0.3) {
      return { action: 'call' }; // 鱼会更多跟注
    }
    
    return { action: 'fold' };
  }

  private evaluateHandStrength(context: GameContext): number {
    const { holeCards, communityCards } = context;
    
    // 翻前手牌强度评估
    if (communityCards.length === 0) {
      return this.evaluatePreflopStrength(holeCards);
    }

    // 翻后使用手牌评估器
    const allCards = [...holeCards, ...communityCards];
    const evaluation = HandEvaluator.evaluate(allCards);
    
    // 将手牌等级转换为0-1的强度值
    const rankStrength = evaluation.rank / 9; // 9是最高等级(皇家同花顺)
    const kickerBonus = evaluation.kickers.length > 0 ? 
      evaluation.kickers[0].value / 140 : 0; // 14是A的值，乘以10作为缩放
    
    return Math.min(rankStrength + kickerBonus * 0.1, 1);
  }

  private evaluatePreflopStrength(holeCards: Card[]): number {
    const [card1, card2] = holeCards;
    let strength = 0;

    // 对子
    if (card1.rank === card2.rank) {
      strength = 0.5 + (card1.value / 14) * 0.3;
      if (card1.value >= 10) strength += 0.2; // 高对子加分
    }
    // 同花
    else if (card1.suit === card2.suit) {
      strength = 0.3 + Math.max(card1.value, card2.value) / 14 * 0.2;
      // 同花连牌
      if (Math.abs(card1.value - card2.value) === 1) {
        strength += 0.1;
      }
    }
    // 连牌
    else if (Math.abs(card1.value - card2.value) <= 2) {
      strength = 0.25 + Math.max(card1.value, card2.value) / 14 * 0.15;
    }
    // 高牌
    else {
      strength = Math.max(card1.value, card2.value) / 14 * 0.3;
      if (card1.value >= 12 || card2.value >= 12) {
        strength += 0.1; // A或K加分
      }
    }

    return Math.min(strength, 1);
  }

  private calculatePotOdds(context: GameContext): number {
    const { pot, currentBet } = context;
    if (currentBet === 0) return 0;
    return currentBet / (pot + currentBet);
  }

  getStyleDescription(): string {
    const descriptions = {
      TAG: '紧凶型 - 选择性强，但一旦进入底池就会积极下注',
      LAG: '松凶型 - 玩很多手牌，并且激进地下注和加注',
      ROCK: '岩石型 - 只玩最强的起手牌，很少诈唬',
      MANIAC: '疯狂型 - 极度激进，频繁加注和诈唬',
      FISH: '鱼 - 被动玩家，经常跟注但很少加注'
    };
    return descriptions[this.style];
  }
}