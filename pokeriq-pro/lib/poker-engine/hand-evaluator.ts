import { Card } from './card';

export enum HandRank {
  HIGH_CARD = 0,
  PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9
}

export interface HandEvaluation {
  rank: HandRank;
  rankName: string;
  value: number;
  cards: Card[];
  kickers: Card[];
}

export class HandEvaluator {
  private static readonly HAND_NAMES: Record<HandRank, string> = {
    [HandRank.HIGH_CARD]: 'High Card',
    [HandRank.PAIR]: 'Pair',
    [HandRank.TWO_PAIR]: 'Two Pair',
    [HandRank.THREE_OF_A_KIND]: 'Three of a Kind',
    [HandRank.STRAIGHT]: 'Straight',
    [HandRank.FLUSH]: 'Flush',
    [HandRank.FULL_HOUSE]: 'Full House',
    [HandRank.FOUR_OF_A_KIND]: 'Four of a Kind',
    [HandRank.STRAIGHT_FLUSH]: 'Straight Flush',
    [HandRank.ROYAL_FLUSH]: 'Royal Flush'
  };

  static evaluate(cards: Card[]): HandEvaluation {
    if (cards.length < 5) {
      throw new Error('Need at least 5 cards to evaluate');
    }

    const allCombinations = this.getCombinations(cards, 5);
    let bestHand: HandEvaluation | null = null;

    for (const combination of allCombinations) {
      const evaluation = this.evaluateFiveCards(combination);
      if (!bestHand || this.compareHands(evaluation, bestHand) > 0) {
        bestHand = evaluation;
      }
    }

    return bestHand!;
  }

  private static evaluateFiveCards(cards: Card[]): HandEvaluation {
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    
    const isFlush = this.isFlush(sorted);
    const isStraight = this.isStraight(sorted);
    
    if (isFlush && isStraight) {
      if (sorted[0].value === 14 && sorted[4].value === 10) {
        return this.createHandEvaluation(HandRank.ROYAL_FLUSH, sorted, sorted);
      }
      return this.createHandEvaluation(HandRank.STRAIGHT_FLUSH, sorted, sorted);
    }

    const groups = this.groupByRank(sorted);
    const groupSizes = Object.values(groups).map(g => g.length).sort((a, b) => b - a);

    if (groupSizes[0] === 4) {
      return this.createHandEvaluation(HandRank.FOUR_OF_A_KIND, sorted, this.getCardsForRank(sorted, groups, 4));
    }

    if (groupSizes[0] === 3 && groupSizes[1] === 2) {
      return this.createHandEvaluation(HandRank.FULL_HOUSE, sorted, sorted);
    }

    if (isFlush) {
      return this.createHandEvaluation(HandRank.FLUSH, sorted, sorted);
    }

    if (isStraight) {
      return this.createHandEvaluation(HandRank.STRAIGHT, sorted, sorted);
    }

    if (groupSizes[0] === 3) {
      return this.createHandEvaluation(HandRank.THREE_OF_A_KIND, sorted, this.getCardsForRank(sorted, groups, 3));
    }

    if (groupSizes[0] === 2 && groupSizes[1] === 2) {
      return this.createHandEvaluation(HandRank.TWO_PAIR, sorted, this.getTwoPairCards(sorted, groups));
    }

    if (groupSizes[0] === 2) {
      return this.createHandEvaluation(HandRank.PAIR, sorted, this.getCardsForRank(sorted, groups, 2));
    }

    return this.createHandEvaluation(HandRank.HIGH_CARD, sorted, sorted);
  }

  private static createHandEvaluation(rank: HandRank, cards: Card[], mainCards: Card[]): HandEvaluation {
    const kickers = cards.filter(card => !mainCards.includes(card));
    
    let value = rank * 1000000;
    for (let i = 0; i < mainCards.length; i++) {
      value += mainCards[i].value * Math.pow(15, 4 - i);
    }
    for (let i = 0; i < kickers.length; i++) {
      value += kickers[i].value * Math.pow(15, 4 - mainCards.length - i);
    }

    return {
      rank,
      rankName: this.HAND_NAMES[rank],
      value,
      cards: mainCards,
      kickers
    };
  }

  private static isFlush(cards: Card[]): boolean {
    const suit = cards[0].suit;
    return cards.every(card => card.suit === suit);
  }

  private static isStraight(cards: Card[]): boolean {
    const values = cards.map(c => c.value);
    
    // Check regular straight
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i] - values[i + 1] !== 1) {
        // Check for Ace-low straight (A-2-3-4-5)
        if (i === 0 && values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
          return true;
        }
        return false;
      }
    }
    return true;
  }

  private static groupByRank(cards: Card[]): Record<string, Card[]> {
    const groups: Record<string, Card[]> = {};
    for (const card of cards) {
      if (!groups[card.rank]) {
        groups[card.rank] = [];
      }
      groups[card.rank].push(card);
    }
    return groups;
  }

  private static getCardsForRank(cards: Card[], groups: Record<string, Card[]>, count: number): Card[] {
    for (const rank in groups) {
      if (groups[rank].length === count) {
        return groups[rank];
      }
    }
    return [];
  }

  private static getTwoPairCards(cards: Card[], groups: Record<string, Card[]>): Card[] {
    const pairs: Card[] = [];
    const sortedGroups = Object.entries(groups)
      .filter(([_, cards]) => cards.length === 2)
      .sort((a, b) => b[1][0].value - a[1][0].value);
    
    for (const [_, pairCards] of sortedGroups.slice(0, 2)) {
      pairs.push(...pairCards);
    }
    return pairs;
  }

  private static getCombinations(cards: Card[], size: number): Card[][] {
    if (size > cards.length) return [];
    if (size === cards.length) return [cards];
    if (size === 0) return [[]];

    const combinations: Card[][] = [];
    
    for (let i = 0; i <= cards.length - size; i++) {
      const head = cards.slice(i, i + 1);
      const tailCombinations = this.getCombinations(cards.slice(i + 1), size - 1);
      for (const tail of tailCombinations) {
        combinations.push([...head, ...tail]);
      }
    }
    
    return combinations;
  }

  static compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number {
    return hand1.value - hand2.value;
  }

  static getWinner(evaluations: HandEvaluation[]): number[] {
    const maxValue = Math.max(...evaluations.map(e => e.value));
    return evaluations
      .map((e, i) => e.value === maxValue ? i : -1)
      .filter(i => i !== -1);
  }
}