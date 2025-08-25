/**
 * 扑克游戏常量定义
 */

// 花色
export const SUITS = {
  SPADES: '♠',
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
} as const;

// 牌面值
export const RANKS = {
  TWO: '2',
  THREE: '3',
  FOUR: '4',
  FIVE: '5',
  SIX: '6',
  SEVEN: '7',
  EIGHT: '8',
  NINE: '9',
  TEN: 'T',
  JACK: 'J',
  QUEEN: 'Q',
  KING: 'K',
  ACE: 'A',
} as const;

// 牌面值数值
export const RANK_VALUES: Record<string, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  'T': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};

// 位置
export const POSITIONS = {
  BTN: 'BTN',  // Button
  SB: 'SB',    // Small Blind
  BB: 'BB',    // Big Blind
  UTG: 'UTG',  // Under the Gun
  MP: 'MP',    // Middle Position
  CO: 'CO',    // Cutoff
  EP: 'EP',    // Early Position
  LP: 'LP',    // Late Position
} as const;

// 动作类型
export const ACTIONS = {
  FOLD: 'FOLD',
  CHECK: 'CHECK',
  CALL: 'CALL',
  BET: 'BET',
  RAISE: 'RAISE',
  ALL_IN: 'ALL_IN',
} as const;

// 游戏阶段
export const STREETS = {
  PREFLOP: 'PREFLOP',
  FLOP: 'FLOP',
  TURN: 'TURN',
  RIVER: 'RIVER',
  SHOWDOWN: 'SHOWDOWN',
} as const;

// 手牌排名
export const HAND_RANKINGS = {
  HIGH_CARD: 1,
  PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10,
} as const;

// 手牌排名名称
export const HAND_RANK_NAMES: Record<number, string> = {
  1: '高牌',
  2: '一对',
  3: '两对',
  4: '三条',
  5: '顺子',
  6: '同花',
  7: '葫芦',
  8: '四条',
  9: '同花顺',
  10: '皇家同花顺',
};

// 游戏类型
export const GAME_TYPES = {
  CASH: 'CASH',
  TOURNAMENT: 'TOURNAMENT',
  SIT_AND_GO: 'SIT_AND_GO',
  TRAINING: 'TRAINING',
} as const;

// 盲注级别
export const BLIND_LEVELS = [
  { sb: 0.5, bb: 1 },
  { sb: 1, bb: 2 },
  { sb: 2, bb: 5 },
  { sb: 5, bb: 10 },
  { sb: 10, bb: 20 },
  { sb: 25, bb: 50 },
  { sb: 50, bb: 100 },
  { sb: 100, bb: 200 },
];

// AI对手风格
export const AI_STYLES = {
  TIGHT_PASSIVE: {
    name: '紧弱型',
    vpip: 15,
    pfr: 8,
    aggression: 0.5,
    description: '保守谨慎，很少加注',
  },
  TIGHT_AGGRESSIVE: {
    name: '紧凶型',
    vpip: 22,
    pfr: 18,
    aggression: 3.0,
    description: 'TAG标准打法，选择性激进',
  },
  LOOSE_PASSIVE: {
    name: '松弱型',
    vpip: 35,
    pfr: 10,
    aggression: 0.8,
    description: '跟注站，经常跟注很少加注',
  },
  LOOSE_AGGRESSIVE: {
    name: '松凶型',
    vpip: 40,
    pfr: 30,
    aggression: 4.0,
    description: 'LAG激进打法，频繁施压',
  },
  MANIAC: {
    name: '疯狂型',
    vpip: 60,
    pfr: 45,
    aggression: 5.0,
    description: '极度激进，随机性强',
  },
  NIT: {
    name: '岩石型',
    vpip: 10,
    pfr: 8,
    aggression: 2.0,
    description: '极度保守，只玩优质牌',
  },
  CALLING_STATION: {
    name: '跟注站',
    vpip: 50,
    pfr: 5,
    aggression: 0.3,
    description: '被动跟注，很难诈唬',
  },
  SHARK: {
    name: '鲨鱼型',
    vpip: 25,
    pfr: 20,
    aggression: 2.5,
    description: '平衡打法，难以预测',
  },
} as const;

// 训练场景
export const TRAINING_SCENARIOS = {
  PREFLOP_RANGES: {
    name: '翻前范围',
    description: '学习不同位置的起手牌范围',
    difficulty: 'beginner',
  },
  POT_ODDS: {
    name: '底池赔率',
    description: '计算和应用底池赔率',
    difficulty: 'intermediate',
  },
  BLUFFING: {
    name: '诈唬训练',
    description: '学习何时以及如何诈唬',
    difficulty: 'advanced',
  },
  VALUE_BETTING: {
    name: '价值下注',
    description: '最大化价值提取',
    difficulty: 'intermediate',
  },
  POSITION_PLAY: {
    name: '位置游戏',
    description: '利用位置优势',
    difficulty: 'beginner',
  },
  HAND_READING: {
    name: '读牌训练',
    description: '分析对手的手牌范围',
    difficulty: 'advanced',
  },
  BANKROLL_MANAGEMENT: {
    name: '资金管理',
    description: '学习合理的资金管理',
    difficulty: 'beginner',
  },
  ICM: {
    name: 'ICM决策',
    description: '锦标赛ICM模型训练',
    difficulty: 'expert',
  },
} as const;

// 成就类别
export const ACHIEVEMENT_CATEGORIES = {
  TRAINING: '训练',
  STATISTICS: '统计',
  SPECIAL: '特殊',
  MILESTONE: '里程碑',
} as const;

// 筹码深度
export const STACK_DEPTHS = {
  SHORT: { min: 10, max: 30, name: '短筹码' },
  MEDIUM: { min: 30, max: 80, name: '中筹码' },
  DEEP: { min: 80, max: 150, name: '深筹码' },
  SUPER_DEEP: { min: 150, max: 500, name: '超深筹码' },
} as const;