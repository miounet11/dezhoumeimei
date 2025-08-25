import { Card, Position } from '@/types';

// Hand ranking constants
export const HAND_RANKINGS = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9
} as const;

// All possible starting hands in Texas Hold'em
export const ALL_STARTING_HANDS = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o',
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
  'QJo', 'QTo', 'Q9o', 'Q8o', 'Q7o', 'Q6o', 'Q5o', 'Q4o', 'Q3o', 'Q2o',
  'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
  'JTo', 'J9o', 'J8o', 'J7o', 'J6o', 'J5o', 'J4o', 'J3o', 'J2o',
  'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
  'T9o', 'T8o', 'T7o', 'T6o', 'T5o', 'T4o', 'T3o', 'T2o',
  '98s', '97s', '96s', '95s', '94s', '93s', '92s',
  '98o', '97o', '96o', '95o', '94o', '93o', '92o',
  '87s', '86s', '85s', '84s', '83s', '82s',
  '87o', '86o', '85o', '84o', '83o', '82o',
  '76s', '75s', '74s', '73s', '72s',
  '76o', '75o', '74o', '73o', '72o',
  '65s', '64s', '63s', '62s',
  '65o', '64o', '63o', '62o',
  '54s', '53s', '52s',
  '54o', '53o', '52o',
  '43s', '42s',
  '43o', '42o',
  '32s',
  '32o'
];

/**
 * 完整的手牌评估函数
 */
export function evaluateHand(cards: Card[]): { rank: number; value: number; description: string } {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error('Hand must contain 5-7 cards');
  }

  const sortedCards = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
  
  // Check for each hand type from highest to lowest
  const royalFlush = checkRoyalFlush(sortedCards);
  if (royalFlush.isValid) return { rank: HAND_RANKINGS.ROYAL_FLUSH, value: royalFlush.value, description: 'Royal Flush' };
  
  const straightFlush = checkStraightFlush(sortedCards);
  if (straightFlush.isValid) return { rank: HAND_RANKINGS.STRAIGHT_FLUSH, value: straightFlush.value, description: 'Straight Flush' };
  
  const fourOfAKind = checkFourOfAKind(sortedCards);
  if (fourOfAKind.isValid) return { rank: HAND_RANKINGS.FOUR_OF_A_KIND, value: fourOfAKind.value, description: 'Four of a Kind' };
  
  const fullHouse = checkFullHouse(sortedCards);
  if (fullHouse.isValid) return { rank: HAND_RANKINGS.FULL_HOUSE, value: fullHouse.value, description: 'Full House' };
  
  const flush = checkFlush(sortedCards);
  if (flush.isValid) return { rank: HAND_RANKINGS.FLUSH, value: flush.value, description: 'Flush' };
  
  const straight = checkStraight(sortedCards);
  if (straight.isValid) return { rank: HAND_RANKINGS.STRAIGHT, value: straight.value, description: 'Straight' };
  
  const threeOfAKind = checkThreeOfAKind(sortedCards);
  if (threeOfAKind.isValid) return { rank: HAND_RANKINGS.THREE_OF_A_KIND, value: threeOfAKind.value, description: 'Three of a Kind' };
  
  const twoPair = checkTwoPair(sortedCards);
  if (twoPair.isValid) return { rank: HAND_RANKINGS.TWO_PAIR, value: twoPair.value, description: 'Two Pair' };
  
  const pair = checkPair(sortedCards);
  if (pair.isValid) return { rank: HAND_RANKINGS.PAIR, value: pair.value, description: 'Pair' };
  
  const highCard = checkHighCard(sortedCards);
  return { rank: HAND_RANKINGS.HIGH_CARD, value: highCard.value, description: 'High Card' };
}

/**
 * 计算手牌强度（0-1000分制）
 */
export function calculateHandStrength(cards: Card[], communityCards: Card[] = []): number {
  if (cards.length === 2 && communityCards.length === 0) {
    // 起手牌强度
    return calculateStartingHandStrength(cards);
  }
  
  const allCards = [...cards, ...communityCards];
  if (allCards.length < 5) {
    // 不足5张牌，使用简化计算
    return calculateStartingHandStrength(cards) * (1 + communityCards.length * 0.1);
  }
  
  const handEval = evaluateHand(allCards);
  return handEval.rank * 1000 + handEval.value;
}

/**
 * 计算起手牌强度
 */
export function calculateStartingHandStrength(cards: Card[]): number {
  const [card1, card2] = cards;
  const rank1 = getRankValue(card1.rank);
  const rank2 = getRankValue(card2.rank);
  const suited = card1.suit === card2.suit;
  
  // 基础分数
  let strength = 0;
  
  // 对子
  if (rank1 === rank2) {
    strength = 600 + rank1 * 20;
  } else {
    // 非对子
    const highRank = Math.max(rank1, rank2);
    const lowRank = Math.min(rank1, rank2);
    const gap = highRank - lowRank;
    
    strength = highRank * 15 + lowRank * 5;
    
    // 同花加分
    if (suited) {
      strength += 30;
    }
    
    // 连牌加分
    if (gap <= 4) {
      strength += (5 - gap) * 10;
    }
    
    // A-x 特殊处理
    if (highRank === 14) {
      strength += 20;
    }
  }
  
  return Math.min(strength, 1000);
}

/**
 * 获取牌面值
 */
export function getRankValue(rank: Card['rank']): number {
  const values: Record<Card['rank'], number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return values[rank];
}

/**
 * 获取牌面符号（中文）
 */
export function getRankName(rank: Card['rank']): string {
  const names: Record<Card['rank'], string> = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
    '8': '8', '9': '9', 'T': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A'
  };
  return names[rank];
}

/**
 * 获取花色名称（中文）
 */
export function getSuitName(suit: Card['suit']): string {
  const names: Record<Card['suit'], string> = {
    hearts: '红桃',
    diamonds: '方块',
    clubs: '梅花',
    spades: '黑桃'
  };
  return names[suit];
}

/**
 * 获取位置优势
 */
export function getPositionAdvantage(position: Position): number {
  const advantages: Record<Position, number> = {
    'UTG': 0.5,
    'UTG+1': 0.6,
    'MP': 0.7,
    'MP+1': 0.8,
    'CO': 0.9,
    'BTN': 1.0,
    'SB': 0.4,
    'BB': 0.3
  };
  return advantages[position];
}

/**
 * 获取位置名称（中文）
 */
export function getPositionName(position: Position): string {
  const names: Record<Position, string> = {
    'UTG': '枪口位',
    'UTG+1': '枪口位+1',
    'MP': '中间位',
    'MP+1': '中间位+1',
    'CO': '关煞位',
    'BTN': '按钮位',
    'SB': '小盲',
    'BB': '大盲'
  };
  return names[position];
}

/**
 * 根据玩家数量获取位置列表
 */
export function getPositionsForPlayerCount(players: number): Position[] {
  const allPositions: Position[] = ['UTG', 'UTG+1', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB'];
  
  if (players === 2) return ['BTN', 'BB'];
  if (players === 3) return ['BTN', 'SB', 'BB'];
  if (players === 4) return ['CO', 'BTN', 'SB', 'BB'];
  if (players === 5) return ['MP', 'CO', 'BTN', 'SB', 'BB'];
  if (players === 6) return ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  if (players === 7) return ['UTG', 'UTG+1', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  if (players === 8) return ['UTG', 'UTG+1', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB'];
  if (players === 9) return allPositions;
  
  return allPositions.slice(-players); // Default fallback
}

/**
 * 计算底池赔率
 */
export function calculatePotOdds(potSize: number, callAmount: number): number {
  return callAmount / (potSize + callAmount) * 100;
}

/**
 * 计算隐含赔率
 */
export function calculateImpliedOdds(
  potSize: number,
  callAmount: number,
  estimatedFutureWinnings: number
): number {
  const totalPotentialWinnings = potSize + estimatedFutureWinnings;
  return callAmount / (totalPotentialWinnings + callAmount) * 100;
}

/**
 * 分析翻牌面结构
 */
export function analyzeFlopTexture(communityCards: Card[]): {
  texture: 'dry' | 'wet' | 'neutral';
  connectedness: number;
  suitedness: number;
  highCards: number;
  pairs: number;
  straightDraws: number;
  flushDraws: number;
} {
  if (communityCards.length < 3) {
    return {
      texture: 'neutral',
      connectedness: 0,
      suitedness: 0,
      highCards: 0,
      pairs: 0,
      straightDraws: 0,
      flushDraws: 0
    };
  }
  
  const ranks = communityCards.map(c => getRankValue(c.rank)).sort((a, b) => b - a);
  const suits = communityCards.map(c => c.suit);
  
  // 计算各种特征
  const suitCounts = new Map<string, number>();
  suits.forEach(suit => {
    suitCounts.set(suit, (suitCounts.get(suit) || 0) + 1);
  });
  
  const maxSuitCount = Math.max(...Array.from(suitCounts.values()));
  const suitedness = maxSuitCount >= 2 ? maxSuitCount : 0;
  
  const rankCounts = new Map<number, number>();
  ranks.forEach(rank => {
    rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
  });
  
  const pairs = Array.from(rankCounts.values()).filter(count => count >= 2).length;
  
  // 连接性分析
  const gaps = [];
  for (let i = 0; i < ranks.length - 1; i++) {
    gaps.push(ranks[i] - ranks[i + 1]);
  }
  const connectedness = gaps.filter(gap => gap <= 4).length;
  
  // 高牌计算
  const highCards = ranks.filter(rank => rank >= 11).length; // J, Q, K, A
  
  // 顺子听牌
  const straightDraws = calculateStraightDraws(ranks);
  
  // 同花听牌
  const flushDraws = suitedness >= 2 ? 1 : 0;
  
  // 综合评估翻牌面湿度
  let wetness = 0;
  wetness += connectedness * 2;
  wetness += suitedness;
  wetness += straightDraws;
  wetness += flushDraws * 2;
  wetness -= highCards; // 高牌让翻牌面更干
  
  let texture: 'dry' | 'wet' | 'neutral';
  if (wetness <= 2) texture = 'dry';
  else if (wetness >= 6) texture = 'wet';
  else texture = 'neutral';
  
  return {
    texture,
    connectedness,
    suitedness,
    highCards,
    pairs,
    straightDraws,
    flushDraws
  };
}

function calculateStraightDraws(ranks: number[]): number {
  // 简化的顺子听牌计算
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
  let draws = 0;
  
  // 检查各种顺子可能性
  for (let i = 0; i <= uniqueRanks.length - 2; i++) {
    const gap = uniqueRanks[i] - uniqueRanks[i + 1];
    if (gap <= 4) draws++;
  }
  
  return Math.min(draws, 2); // 最多2个顺子听牌
}

/**
 * 计算期望值
 */
export function calculateEV(
  winProbability: number,
  winAmount: number,
  loseProbability: number,
  loseAmount: number
): number {
  return (winProbability * winAmount) - (loseProbability * loseAmount);
}

/**
 * 计算行动期望值
 */
export function calculateActionEV(
  equity: number,
  potSize: number,
  betAmount: number,
  callAmount: number = 0
): { fold: number; call: number; raise: number } {
  const foldEV = 0; // 弃牌EV始终为0
  
  const callEV = (equity / 100) * (potSize + callAmount) - callAmount;
  
  // 简化的加注EV计算
  const foldEquity = 0.3; // 假设对手30%的时候会弃牌
  const raiseEV = foldEquity * potSize + (1 - foldEquity) * ((equity / 100) * (potSize + betAmount) - betAmount);
  
  return {
    fold: foldEV,
    call: callEV,
    raise: raiseEV
  };
}

/**
 * 计算最佳下注尺寸
 */
export function calculateOptimalBetSize(
  equity: number,
  potSize: number,
  position: Position,
  street: 'preflop' | 'flop' | 'turn' | 'river'
): { size: number; percentage: number } {
  let baseSize = 0.5; // 50% pot as base
  
  // 根据胜率调整
  if (equity > 70) baseSize = 0.75;
  else if (equity > 85) baseSize = 1.0;
  else if (equity < 40) baseSize = 0.33;
  
  // 根据位置调整
  const positionMultiplier = getPositionAdvantage(position);
  baseSize *= positionMultiplier;
  
  // 根据街道调整
  const streetMultipliers = {
    preflop: 3.0, // Preflop bets are in BB
    flop: 0.75,
    turn: 0.8,
    river: 1.0
  };
  
  if (street === 'preflop') {
    const betSize = baseSize * streetMultipliers[street];
    return { size: betSize, percentage: baseSize };
  }
  
  const betSize = potSize * baseSize * streetMultipliers[street];
  return { size: betSize, percentage: baseSize * streetMultipliers[street] };
}

/**
 * 获取GTO起手牌范围
 */
export function getGTOStartingHandRange(position: Position, action: 'raise' | 'call' | 'fold', players: number = 6): string[] {
  const ranges = getGTOPositionRanges(players);
  return ranges[position]?.[action] || [];
}

/**
 * 获取不同位置的GTO范围
 */
export function getGTOPositionRanges(players: number) {
  // 简化的6人桌GTO范围
  const sixMaxRanges = {
    'UTG': {
      raise: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'KQs'],
      call: ['77', '66', 'ATs', 'A9s', 'KJs', 'KJo', 'QJs'],
      fold: [] // All others
    },
    'UTG+1': {
      raise: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'KQs', 'KJs'],
      call: ['66', '55', 'A9s', 'A8s', 'KJo', 'QJs', 'QJo', 'JTs'],
      fold: []
    },
    'MP': {
      raise: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'KQs', 'KJs', 'KJo', 'QJs'],
      call: ['55', '44', 'A8s', 'A7s', 'KTs', 'QJo', 'QTs', 'JTs', 'JTo', 'T9s'],
      fold: []
    },
    'MP+1': {
      raise: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'A8s', 'KQs', 'KJs', 'KJo', 'KTs', 'QJs', 'QJo', 'JTs'],
      call: ['44', '33', 'A7s', 'A6s', 'A5s', 'KTo', 'QTs', 'JTo', 'T9s', 'T8s', '98s'],
      fold: []
    },
    'CO': {
      raise: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'KQs', 'KJs', 'KJo', 'KTs', 'KTo', 'QJs', 'QJo', 'QTs', 'JTs', 'JTo', 'T9s', '98s'],
      call: ['33', '22', 'A4s', 'A3s', 'A2s', 'K9s', 'Q9s', 'QTo', 'J9s', 'T8s', '97s', '87s', '76s'],
      fold: []
    },
    'BTN': {
      raise: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A9o', 'A8s', 'A8o', 'A7s', 'A7o', 'A6s', 'A6o', 'A5s', 'A5o', 'A4s', 'A3s', 'A2s', 'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'KTo', 'K9s', 'K9o', 'K8s', 'K7s', 'K6s', 'K5s', 'QJs', 'QJo', 'QTs', 'QTo', 'Q9s', 'Q8s', 'JTs', 'JTo', 'J9s', 'J8s', 'T9s', 'T9o', 'T8s', '98s', '97s', '87s', '86s', '76s', '65s'],
      call: ['A4o', 'A3o', 'A2o', 'K8o', 'K7o', 'K6o', 'K5o', 'K4s', 'K3s', 'K2s', 'Q9o', 'Q7s', 'Q6s', 'J9o', 'J7s', 'J6s', 'T8o', 'T7s', '98o', '96s', '85s', '75s', '64s', '54s'],
      fold: []
    },
    'SB': {
      raise: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'KTo', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s', 'QJs', 'QJo', 'QTs', 'QTo', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s', 'JTs', 'JTo', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s', 'T9s', 'T9o', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s', '98s', '97s', '96s', '95s', '94s', '93s', '92s', '87s', '86s', '85s', '84s', '83s', '82s', '76s', '75s', '74s', '73s', '72s', '65s', '64s', '63s', '62s', '54s', '53s', '52s', '43s', '42s', '32s'],
      call: ['A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o', 'K9o', 'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o'],
      fold: []
    },
    'BB': {
      raise: [], // BB typically calls or checks
      call: ALL_STARTING_HANDS, // BB can defend with wide range depending on pot odds
      fold: []
    }
  };
  
  return sixMaxRanges;
}

/**
 * 获取起手牌范围（简化版本，保持向后兼容）
 */
export function getStartingHandRange(position: Position, style: 'tight' | 'loose' | 'standard'): string[] {
  const tightRange = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'];
  const standardRange = [...tightRange, 'TT', '99', 'AQs', 'AQo', 'AJs', 'KQs'];
  const looseRange = [...standardRange, '88', '77', 'AJo', 'ATs', 'ATo', 'KQo', 'KJs', 'QJs'];
  
  switch (style) {
    case 'tight':
      return tightRange;
    case 'loose':
      return looseRange;
    default:
      return standardRange;
  }
}

/**
 * 判断是否应该继续（简化版本）
 */
export function shouldContinue(
  handStrength: number,
  potOdds: number,
  position: Position
): boolean {
  const positionAdvantage = getPositionAdvantage(position);
  const adjustedStrength = handStrength * positionAdvantage;
  
  return adjustedStrength > 10 && potOdds < 30;
}

/**
 * Monte Carlo 模拟计算胜率
 */
export function calculateEquity(
  holeCards: Card[],
  communityCards: Card[] = [],
  opponents: number = 1,
  iterations: number = 1000
): { equity: number; wins: number; ties: number; total: number } {
  let wins = 0;
  let ties = 0;
  
  for (let i = 0; i < iterations; i++) {
    const result = simulateHand(holeCards, communityCards, opponents);
    if (result === 'win') wins++;
    else if (result === 'tie') ties++;
  }
  
  const equity = (wins + ties / 2) / iterations;
  
  return {
    equity: equity * 100,
    wins,
    ties,
    total: iterations
  };
}

/**
 * 模拟单手牌
 */
function simulateHand(holeCards: Card[], communityCards: Card[], opponents: number): 'win' | 'lose' | 'tie' {
  // 创建剩余牌组
  const usedCards = new Set([...holeCards, ...communityCards].map(c => `${c.rank}${c.suit}`));
  const remainingDeck = createDeck().filter(c => !usedCards.has(`${c.rank}${c.suit}`));
  
  // 随机发放剩余公共牌
  const neededCommunityCards = 5 - communityCards.length;
  const simulatedCommunityCards = [...communityCards];
  
  for (let i = 0; i < neededCommunityCards; i++) {
    const randomIndex = Math.floor(Math.random() * (remainingDeck.length - i));
    simulatedCommunityCards.push(remainingDeck.splice(randomIndex, 1)[0]);
  }
  
  // 评估我们的手牌
  const ourHand = evaluateHand([...holeCards, ...simulatedCommunityCards]);
  
  // 模拟对手手牌
  const opponentResults = [];
  for (let i = 0; i < opponents; i++) {
    const opponentCards = [];
    for (let j = 0; j < 2; j++) {
      const randomIndex = Math.floor(Math.random() * remainingDeck.length);
      opponentCards.push(remainingDeck.splice(randomIndex, 1)[0]);
    }
    
    const opponentHand = evaluateHand([...opponentCards, ...simulatedCommunityCards]);
    opponentResults.push(opponentHand);
  }
  
  // 比较结果
  let betterHands = 0;
  let equalHands = 0;
  
  for (const opponentHand of opponentResults) {
    if (opponentHand.rank > ourHand.rank || 
        (opponentHand.rank === ourHand.rank && opponentHand.value > ourHand.value)) {
      betterHands++;
    } else if (opponentHand.rank === ourHand.rank && opponentHand.value === ourHand.value) {
      equalHands++;
    }
  }
  
  if (betterHands === 0 && equalHands === 0) return 'win';
  if (betterHands === 0) return 'tie';
  return 'lose';
}

/**
 * 创建完整牌组
 */
function createDeck(): Card[] {
  const ranks: Card['rank'][] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  
  return deck;
}

/**
 * 格式化手牌
 */
export function formatHand(cards: Card[]): string {
  return cards.map(c => `${c.rank}${getSuitSymbol(c.suit)}`).join(' ');
}

/**
 * 将两张牌转换为标准手牌表示法（如AKs, AKo）
 */
export function cardsToHandString(cards: Card[]): string {
  if (cards.length !== 2) return '';
  
  const [card1, card2] = cards;
  const rank1 = card1.rank;
  const rank2 = card2.rank;
  const suited = card1.suit === card2.suit;
  
  // 确保高牌在前
  const highRank = getRankValue(rank1) >= getRankValue(rank2) ? rank1 : rank2;
  const lowRank = getRankValue(rank1) >= getRankValue(rank2) ? rank2 : rank1;
  
  if (highRank === lowRank) {
    // 对子
    return `${highRank}${lowRank}`;
  } else {
    // 非对子
    return `${highRank}${lowRank}${suited ? 's' : 'o'}`;
  }
}

/**
 * 手牌字符串转换为牌组（用于测试和模拟）
 */
export function handStringToCards(handString: string): Card[] {
  if (handString.length < 2) return [];
  
  const rank1 = handString[0] as Card['rank'];
  const rank2 = handString[1] as Card['rank'];
  const suited = handString.includes('s');
  
  const suit1: Card['suit'] = 'spades';
  const suit2: Card['suit'] = suited ? 'spades' : 'hearts';
  
  return [
    { rank: rank1, suit: suit1 },
    { rank: rank2, suit: suit2 }
  ];
}

/**
 * 获取花色符号
 */
export function getSuitSymbol(suit: Card['suit']): string {
  const symbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return symbols[suit];
}

/**
 * 获取花色颜色
 */
export function getSuitColor(suit: Card['suit']): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

/**
 * 计算VPIP
 */
export function calculateVPIP(handsPlayed: number, totalHands: number): number {
  return (handsPlayed / totalHands) * 100;
}

/**
 * 计算PFR
 */
export function calculatePFR(handsRaised: number, totalHands: number): number {
  return (handsRaised / totalHands) * 100;
}

/**
 * 计算AF
 */
export function calculateAF(betsRaises: number, calls: number): number {
  return calls === 0 ? betsRaises : betsRaises / calls;
}

// Helper functions for hand evaluation
function checkRoyalFlush(cards: Card[]): { isValid: boolean; value: number } {
  const flush = checkFlush(cards);
  if (!flush.isValid) return { isValid: false, value: 0 };
  
  const ranks = cards.map(c => getRankValue(c.rank)).sort((a, b) => b - a);
  const isRoyal = ranks.slice(0, 5).join('') === '1413121110';
  
  return { isValid: isRoyal, value: flush.value };
}

function checkStraightFlush(cards: Card[]): { isValid: boolean; value: number } {
  const flush = checkFlush(cards);
  const straight = checkStraight(cards);
  
  return {
    isValid: flush.isValid && straight.isValid,
    value: straight.value
  };
}

function checkFourOfAKind(cards: Card[]): { isValid: boolean; value: number } {
  const ranks = cards.map(c => getRankValue(c.rank));
  const counts = new Map<number, number>();
  
  ranks.forEach(rank => {
    counts.set(rank, (counts.get(rank) || 0) + 1);
  });
  
  const fourOfAKind = Array.from(counts.entries()).find(([_, count]) => count === 4);
  if (!fourOfAKind) return { isValid: false, value: 0 };
  
  const kicker = Math.max(...Array.from(counts.entries())
    .filter(([rank, count]) => count !== 4)
    .map(([rank, _]) => rank));
  
  return {
    isValid: true,
    value: fourOfAKind[0] * 1000 + kicker
  };
}

function checkFullHouse(cards: Card[]): { isValid: boolean; value: number } {
  const ranks = cards.map(c => getRankValue(c.rank));
  const counts = new Map<number, number>();
  
  ranks.forEach(rank => {
    counts.set(rank, (counts.get(rank) || 0) + 1);
  });
  
  const threeOfAKind = Array.from(counts.entries()).find(([_, count]) => count === 3);
  const pair = Array.from(counts.entries()).find(([rank, count]) => count === 2 && rank !== threeOfAKind?.[0]);
  
  if (!threeOfAKind || !pair) return { isValid: false, value: 0 };
  
  return {
    isValid: true,
    value: threeOfAKind[0] * 1000 + pair[0]
  };
}

function checkFlush(cards: Card[]): { isValid: boolean; value: number } {
  const suits = new Map<string, Card[]>();
  
  cards.forEach(card => {
    if (!suits.has(card.suit)) suits.set(card.suit, []);
    suits.get(card.suit)!.push(card);
  });
  
  const flushSuit = Array.from(suits.entries()).find(([_, cards]) => cards.length >= 5);
  if (!flushSuit) return { isValid: false, value: 0 };
  
  const flushCards = flushSuit[1]
    .map(c => getRankValue(c.rank))
    .sort((a, b) => b - a)
    .slice(0, 5);
  
  return {
    isValid: true,
    value: flushCards.reduce((acc, rank, i) => acc + rank * Math.pow(100, 4 - i), 0)
  };
}

function checkStraight(cards: Card[]): { isValid: boolean; value: number } {
  const ranks = [...new Set(cards.map(c => getRankValue(c.rank)))].sort((a, b) => b - a);
  
  // Check for regular straight
  for (let i = 0; i <= ranks.length - 5; i++) {
    if (ranks[i] - ranks[i + 4] === 4) {
      return { isValid: true, value: ranks[i] };
    }
  }
  
  // Check for A-2-3-4-5 straight (wheel)
  if (ranks.includes(14) && ranks.includes(5) && ranks.includes(4) && ranks.includes(3) && ranks.includes(2)) {
    return { isValid: true, value: 5 };
  }
  
  return { isValid: false, value: 0 };
}

function checkThreeOfAKind(cards: Card[]): { isValid: boolean; value: number } {
  const ranks = cards.map(c => getRankValue(c.rank));
  const counts = new Map<number, number>();
  
  ranks.forEach(rank => {
    counts.set(rank, (counts.get(rank) || 0) + 1);
  });
  
  const threeOfAKind = Array.from(counts.entries()).find(([_, count]) => count === 3);
  if (!threeOfAKind) return { isValid: false, value: 0 };
  
  const kickers = Array.from(counts.entries())
    .filter(([rank, count]) => count !== 3)
    .map(([rank, _]) => rank)
    .sort((a, b) => b - a)
    .slice(0, 2);
  
  return {
    isValid: true,
    value: threeOfAKind[0] * 10000 + (kickers[0] || 0) * 100 + (kickers[1] || 0)
  };
}

function checkTwoPair(cards: Card[]): { isValid: boolean; value: number } {
  const ranks = cards.map(c => getRankValue(c.rank));
  const counts = new Map<number, number>();
  
  ranks.forEach(rank => {
    counts.set(rank, (counts.get(rank) || 0) + 1);
  });
  
  const pairs = Array.from(counts.entries())
    .filter(([_, count]) => count === 2)
    .map(([rank, _]) => rank)
    .sort((a, b) => b - a);
  
  if (pairs.length < 2) return { isValid: false, value: 0 };
  
  const kicker = Array.from(counts.entries())
    .filter(([rank, count]) => count === 1)
    .map(([rank, _]) => rank)
    .sort((a, b) => b - a)[0] || 0;
  
  return {
    isValid: true,
    value: pairs[0] * 10000 + pairs[1] * 100 + kicker
  };
}

function checkPair(cards: Card[]): { isValid: boolean; value: number } {
  const ranks = cards.map(c => getRankValue(c.rank));
  const counts = new Map<number, number>();
  
  ranks.forEach(rank => {
    counts.set(rank, (counts.get(rank) || 0) + 1);
  });
  
  const pair = Array.from(counts.entries()).find(([_, count]) => count === 2);
  if (!pair) return { isValid: false, value: 0 };
  
  const kickers = Array.from(counts.entries())
    .filter(([rank, count]) => count === 1)
    .map(([rank, _]) => rank)
    .sort((a, b) => b - a)
    .slice(0, 3);
  
  return {
    isValid: true,
    value: pair[0] * 1000000 + (kickers[0] || 0) * 10000 + (kickers[1] || 0) * 100 + (kickers[2] || 0)
  };
}

function checkHighCard(cards: Card[]): { isValid: boolean; value: number } {
  const ranks = cards.map(c => getRankValue(c.rank))
    .sort((a, b) => b - a)
    .slice(0, 5);
  
  return {
    isValid: true,
    value: ranks.reduce((acc, rank, i) => acc + rank * Math.pow(100, 4 - i), 0)
  };
}