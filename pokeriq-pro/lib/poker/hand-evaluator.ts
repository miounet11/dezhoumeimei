import { RANK_VALUES, HAND_RANKINGS, SUITS } from './constants';

export interface Card {
  rank: string;
  suit: string;
  value: number;
}

export interface HandRank {
  rank: number;
  name: string;
  cards: Card[];
  kickers: Card[];
  value: number;
}

/**
 * 手牌评估器
 */
export class HandEvaluator {
  /**
   * 解析牌字符串
   */
  static parseCard(cardStr: string): Card {
    const rank = cardStr[0];
    const suit = cardStr[1];
    return {
      rank,
      suit,
      value: RANK_VALUES[rank],
    };
  }

  /**
   * 解析多张牌
   */
  static parseCards(cardsStr: string): Card[] {
    const cardStrs = cardsStr.match(/.{2}/g) || [];
    return cardStrs.map(c => this.parseCard(c));
  }

  /**
   * 评估手牌强度
   */
  static evaluate(holeCards: string, communityCards: string): HandRank {
    const hole = this.parseCards(holeCards);
    const community = this.parseCards(communityCards);
    const allCards = [...hole, ...community];
    
    // 生成所有5张牌的组合
    const combinations = this.getCombinations(allCards, 5);
    
    // 评估每个组合并找出最佳手牌
    let bestHand: HandRank | null = null;
    
    for (const combo of combinations) {
      const hand = this.evaluateFiveCards(combo);
      if (!bestHand || hand.value > bestHand.value) {
        bestHand = hand;
      }
    }
    
    return bestHand!;
  }

  /**
   * 评估5张牌
   */
  private static evaluateFiveCards(cards: Card[]): HandRank {
    // 按值排序（降序）
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    
    // 检查同花
    const isFlush = this.isFlush(cards);
    
    // 检查顺子
    const straight = this.getStraight(sorted);
    
    // 计算每个rank的数量
    const rankCounts = this.getRankCounts(cards);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    
    // 皇家同花顺
    if (isFlush && straight && straight[0].value === 14) {
      return {
        rank: HAND_RANKINGS.ROYAL_FLUSH,
        name: '皇家同花顺',
        cards: straight,
        kickers: [],
        value: this.calculateHandValue(HAND_RANKINGS.ROYAL_FLUSH, straight),
      };
    }
    
    // 同花顺
    if (isFlush && straight) {
      return {
        rank: HAND_RANKINGS.STRAIGHT_FLUSH,
        name: '同花顺',
        cards: straight,
        kickers: [],
        value: this.calculateHandValue(HAND_RANKINGS.STRAIGHT_FLUSH, straight),
      };
    }
    
    // 四条
    if (counts[0] === 4) {
      const quads = this.getCardsByCount(cards, rankCounts, 4);
      const kicker = this.getCardsByCount(cards, rankCounts, 1);
      return {
        rank: HAND_RANKINGS.FOUR_OF_A_KIND,
        name: '四条',
        cards: quads,
        kickers: kicker,
        value: this.calculateHandValue(HAND_RANKINGS.FOUR_OF_A_KIND, [...quads, ...kicker]),
      };
    }
    
    // 葫芦
    if (counts[0] === 3 && counts[1] === 2) {
      const trips = this.getCardsByCount(cards, rankCounts, 3);
      const pair = this.getCardsByCount(cards, rankCounts, 2);
      return {
        rank: HAND_RANKINGS.FULL_HOUSE,
        name: '葫芦',
        cards: [...trips, ...pair],
        kickers: [],
        value: this.calculateHandValue(HAND_RANKINGS.FULL_HOUSE, [...trips, ...pair]),
      };
    }
    
    // 同花
    if (isFlush) {
      return {
        rank: HAND_RANKINGS.FLUSH,
        name: '同花',
        cards: sorted,
        kickers: [],
        value: this.calculateHandValue(HAND_RANKINGS.FLUSH, sorted),
      };
    }
    
    // 顺子
    if (straight) {
      return {
        rank: HAND_RANKINGS.STRAIGHT,
        name: '顺子',
        cards: straight,
        kickers: [],
        value: this.calculateHandValue(HAND_RANKINGS.STRAIGHT, straight),
      };
    }
    
    // 三条
    if (counts[0] === 3) {
      const trips = this.getCardsByCount(cards, rankCounts, 3);
      const kickers = sorted.filter(c => !trips.includes(c)).slice(0, 2);
      return {
        rank: HAND_RANKINGS.THREE_OF_A_KIND,
        name: '三条',
        cards: trips,
        kickers,
        value: this.calculateHandValue(HAND_RANKINGS.THREE_OF_A_KIND, [...trips, ...kickers]),
      };
    }
    
    // 两对
    if (counts[0] === 2 && counts[1] === 2) {
      const pairs = this.getPairs(cards, rankCounts);
      const kicker = sorted.filter(c => !pairs.includes(c)).slice(0, 1);
      return {
        rank: HAND_RANKINGS.TWO_PAIR,
        name: '两对',
        cards: pairs,
        kickers: kicker,
        value: this.calculateHandValue(HAND_RANKINGS.TWO_PAIR, [...pairs, ...kicker]),
      };
    }
    
    // 一对
    if (counts[0] === 2) {
      const pair = this.getCardsByCount(cards, rankCounts, 2);
      const kickers = sorted.filter(c => !pair.includes(c)).slice(0, 3);
      return {
        rank: HAND_RANKINGS.PAIR,
        name: '一对',
        cards: pair,
        kickers,
        value: this.calculateHandValue(HAND_RANKINGS.PAIR, [...pair, ...kickers]),
      };
    }
    
    // 高牌
    return {
      rank: HAND_RANKINGS.HIGH_CARD,
      name: '高牌',
      cards: [sorted[0]],
      kickers: sorted.slice(1),
      value: this.calculateHandValue(HAND_RANKINGS.HIGH_CARD, sorted),
    };
  }

  /**
   * 检查是否同花
   */
  private static isFlush(cards: Card[]): boolean {
    const suit = cards[0].suit;
    return cards.every(c => c.suit === suit);
  }

  /**
   * 获取顺子
   */
  private static getStraight(sorted: Card[]): Card[] | null {
    // 检查普通顺子
    let consecutive = 1;
    let straightCards = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].value === sorted[i - 1].value - 1) {
        consecutive++;
        straightCards.push(sorted[i]);
        if (consecutive === 5) {
          return straightCards;
        }
      } else if (sorted[i].value !== sorted[i - 1].value) {
        consecutive = 1;
        straightCards = [sorted[i]];
      }
    }
    
    // 检查A-2-3-4-5顺子
    if (sorted[0].value === 14) {
      const lowStraight = [sorted[0]];
      const values = sorted.map(c => c.value);
      
      for (const targetValue of [5, 4, 3, 2]) {
        const card = sorted.find(c => c.value === targetValue);
        if (card) {
          lowStraight.push(card);
        } else {
          return null;
        }
      }
      
      if (lowStraight.length === 5) {
        return lowStraight;
      }
    }
    
    return null;
  }

  /**
   * 统计每个rank的数量
   */
  private static getRankCounts(cards: Card[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const card of cards) {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
    }
    return counts;
  }

  /**
   * 根据数量获取牌
   */
  private static getCardsByCount(
    cards: Card[],
    rankCounts: Record<string, number>,
    count: number
  ): Card[] {
    const ranks = Object.keys(rankCounts).filter(r => rankCounts[r] === count);
    return cards
      .filter(c => ranks.includes(c.rank))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * 获取两对
   */
  private static getPairs(cards: Card[], rankCounts: Record<string, number>): Card[] {
    const pairRanks = Object.keys(rankCounts)
      .filter(r => rankCounts[r] === 2)
      .sort((a, b) => RANK_VALUES[b] - RANK_VALUES[a])
      .slice(0, 2);
    
    return cards
      .filter(c => pairRanks.includes(c.rank))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * 计算手牌数值（用于比较）
   */
  private static calculateHandValue(rank: number, cards: Card[]): number {
    let value = rank * 1000000;
    let multiplier = 10000;
    
    for (const card of cards) {
      value += card.value * multiplier;
      multiplier /= 100;
    }
    
    return value;
  }

  /**
   * 获取组合
   */
  private static getCombinations<T>(arr: T[], size: number): T[][] {
    if (size === 1) return arr.map(el => [el]);
    
    const combinations: T[][] = [];
    
    for (let i = 0; i <= arr.length - size; i++) {
      const head = arr[i];
      const tailCombinations = this.getCombinations(arr.slice(i + 1), size - 1);
      
      for (const tail of tailCombinations) {
        combinations.push([head, ...tail]);
      }
    }
    
    return combinations;
  }

  /**
   * 计算胜率（蒙特卡洛模拟）
   */
  static calculateEquity(
    holeCards: string,
    communityCards: string = '',
    opponentCount: number = 1,
    iterations: number = 10000
  ): number {
    const deck = this.createDeck();
    const usedCards = new Set([...holeCards.match(/.{2}/g) || [], ...communityCards.match(/.{2}/g) || []]);
    const availableCards = deck.filter(c => !usedCards.has(c));
    
    let wins = 0;
    let ties = 0;
    
    for (let i = 0; i < iterations; i++) {
      const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
      
      // 发公共牌
      const remainingCommunity = 5 - (communityCards.length / 2);
      const simCommunity = communityCards + shuffled.slice(0, remainingCommunity).join('');
      
      // 发对手牌
      const opponentHands: string[] = [];
      let cardIndex = remainingCommunity;
      
      for (let j = 0; j < opponentCount; j++) {
        opponentHands.push(shuffled.slice(cardIndex, cardIndex + 2).join(''));
        cardIndex += 2;
      }
      
      // 评估手牌
      const myHand = this.evaluate(holeCards, simCommunity);
      const opponentBestHand = Math.max(
        ...opponentHands.map(h => this.evaluate(h, simCommunity).value)
      );
      
      if (myHand.value > opponentBestHand) {
        wins++;
      } else if (myHand.value === opponentBestHand) {
        ties++;
      }
    }
    
    return (wins + ties / 2) / iterations;
  }

  /**
   * 创建一副牌
   */
  private static createDeck(): string[] {
    const deck: string[] = [];
    const ranks = Object.values(RANK_VALUES).map(v => Object.keys(RANK_VALUES).find(k => RANK_VALUES[k] === v)!);
    const suits = Object.values(SUITS);
    
    for (const rank of ranks) {
      for (const suit of suits) {
        deck.push(rank + suit);
      }
    }
    
    return deck;
  }
}