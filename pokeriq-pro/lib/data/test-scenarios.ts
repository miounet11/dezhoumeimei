export const testScenarios = [
  // ===== 翻前场景 =====
  {
    id: 'preflop-1',
    category: 'preflop',
    difficulty: 2,
    position: 'UTG',
    stackSize: 100,
    situation: {
      holeCards: ['Ah', 'Kd'],
      communityCards: [],
      potSize: 1.5,
      currentBet: 0,
      stackSize: 100,
      position: 'UTG',
      actionHistory: []
    },
    gtoSolution: {
      actions: [
        { action: 'raise', frequency: 0.85, size: 3 },
        { action: 'fold', frequency: 0.15 }
      ],
      ev: { raise: 2.5, fold: 0 },
      reasoning: 'AKo在UTG位置是标准的开局牌，应该加注到3BB'
    },
    tags: ['opening-range', 'utg', 'premium-hand']
  },
  {
    id: 'preflop-2',
    category: 'preflop',
    difficulty: 3,
    position: 'BTN',
    stackSize: 100,
    situation: {
      holeCards: ['7h', '6h'],
      communityCards: [],
      potSize: 7.5,
      currentBet: 3,
      stackSize: 100,
      position: 'BTN',
      actionHistory: [
        { player: 'UTG', action: 'raise', amount: 3 }
      ]
    },
    gtoSolution: {
      actions: [
        { action: 'fold', frequency: 0.7 },
        { action: 'call', frequency: 0.25 },
        { action: 'raise', frequency: 0.05, size: 9 }
      ],
      ev: { fold: 0, call: -0.5, raise: -1.2 },
      reasoning: '面对UTG的加注，76s在按钮位置主要应该弃牌，偶尔可以跟注'
    },
    tags: ['3bet-decision', 'button', 'suited-connector']
  },
  {
    id: 'preflop-3',
    category: 'preflop',
    difficulty: 1,
    position: 'BB',
    stackSize: 100,
    situation: {
      holeCards: ['2c', '7d'],
      communityCards: [],
      potSize: 10.5,
      currentBet: 9,
      stackSize: 100,
      position: 'BB',
      actionHistory: [
        { player: 'BTN', action: 'raise', amount: 3 },
        { player: 'SB', action: 'raise', amount: 9 }
      ]
    },
    gtoSolution: {
      actions: [
        { action: 'fold', frequency: 1.0 }
      ],
      ev: { fold: 0, call: -8, raise: -15 },
      reasoning: '72o是最差的起手牌，面对3bet应该100%弃牌'
    },
    tags: ['trash-hand', 'facing-3bet', 'easy-fold']
  },

  // ===== 翻牌圈场景 =====
  {
    id: 'flop-1',
    category: 'flop',
    difficulty: 2,
    position: 'BTN',
    stackSize: 97,
    situation: {
      holeCards: ['As', 'Ks'],
      communityCards: ['Ah', '7d', '2c'],
      potSize: 7.5,
      currentBet: 0,
      stackSize: 97,
      position: 'BTN',
      actionHistory: [
        { player: 'BTN', action: 'raise', amount: 3 },
        { player: 'BB', action: 'call', amount: 3 },
        { player: 'BB', action: 'check' }
      ]
    },
    gtoSolution: {
      actions: [
        { action: 'raise', frequency: 0.75, size: 5 },
        { action: 'check', frequency: 0.25 }
      ],
      ev: { raise: 8, check: 6 },
      reasoning: '在A72彩虹面，顶对顶踢脚应该高频率持续下注'
    },
    tags: ['c-bet', 'top-pair', 'dry-board']
  },
  {
    id: 'flop-2',
    category: 'flop',
    difficulty: 3,
    position: 'BB',
    stackSize: 94,
    situation: {
      holeCards: ['9s', '8s'],
      communityCards: ['7s', '6h', '5c'],
      potSize: 12,
      currentBet: 6,
      stackSize: 94,
      position: 'BB',
      actionHistory: [
        { player: 'BTN', action: 'raise', amount: 3 },
        { player: 'BB', action: 'call', amount: 3 },
        { player: 'BTN', action: 'raise', amount: 6 }
      ]
    },
    gtoSolution: {
      actions: [
        { action: 'raise', frequency: 0.60, size: 18 },
        { action: 'call', frequency: 0.35 },
        { action: 'fold', frequency: 0.05 }
      ],
      ev: { raise: 15, call: 12, fold: 0 },
      reasoning: '坚果顺子在湿润面应该经常check-raise获取价值'
    },
    tags: ['straight', 'check-raise', 'wet-board']
  },
  {
    id: 'flop-3',
    category: 'flop',
    difficulty: 4,
    position: 'CO',
    stackSize: 100,
    situation: {
      holeCards: ['Qd', 'Jd'],
      communityCards: ['Td', '9d', '3h'],
      potSize: 15,
      currentBet: 0,
      stackSize: 100,
      position: 'CO',
      actionHistory: [
        { player: 'CO', action: 'raise', amount: 3 },
        { player: 'BTN', action: 'call', amount: 3 },
        { player: 'BB', action: 'call', amount: 3 }
      ]
    },
    gtoSolution: {
      actions: [
        { action: 'raise', frequency: 0.45, size: 10 },
        { action: 'check', frequency: 0.55 }
      ],
      ev: { raise: 12, check: 11 },
      reasoning: '同花听牌+卡顺听牌在多人底池应该混合打法'
    },
    tags: ['flush-draw', 'straight-draw', 'multiway']
  },

  // ===== 转牌圈场景 =====
  {
    id: 'turn-1',
    category: 'turn',
    difficulty: 3,
    position: 'BTN',
    stackSize: 88,
    situation: {
      holeCards: ['Kh', 'Kc'],
      communityCards: ['Kd', '7s', '2h', 'Ad'],
      potSize: 22,
      currentBet: 0,
      stackSize: 88,
      position: 'BTN',
      actionHistory: [
        { player: 'BTN', action: 'raise', amount: 3 },
        { player: 'BB', action: 'call', amount: 3 },
        { player: 'BB', action: 'check' },
        { player: 'BTN', action: 'raise', amount: 6 },
        { player: 'BB', action: 'call', amount: 6 },
        { player: 'BB', action: 'check' }
      ]
    },
    gtoSolution: {
      actions: [
        { action: 'raise', frequency: 0.35, size: 15 },
        { action: 'check', frequency: 0.65 }
      ],
      ev: { raise: 20, check: 22 },
      reasoning: '三条K在A转牌应该经常过牌，诱导对手诈唬或用Ax价值下注'
    },
    tags: ['set', 'scary-turn', 'pot-control']
  },
  {
    id: 'turn-2',
    category: 'turn',
    difficulty: 4,
    position: 'BB',
    stackSize: 75,
    situation: {
      holeCards: ['Js', 'Ts'],
      communityCards: ['9s', '8h', '7c', '2s'],
      potSize: 35,
      currentBet: 20,
      stackSize: 75,
      position: 'BB',
      actionHistory: [
        { player: 'BTN', action: 'raise', amount: 3 },
        { player: 'BB', action: 'call', amount: 3 },
        { player: 'BB', action: 'check' },
        { player: 'BTN', action: 'raise', amount: 8 },
        { player: 'BB', action: 'call', amount: 8 },
        { player: 'BB', action: 'check' },
        { player: 'BTN', action: 'raise', amount: 20 }
      ]
    },
    gtoSolution: {
      actions: [
        { action: 'raise', frequency: 0.80, size: 75 },
        { action: 'call', frequency: 0.20 }
      ],
      ev: { raise: 45, call: 25 },
      reasoning: '坚果顺子+同花听牌应该经常全下半诈唬'
    },
    tags: ['straight', 'flush-draw', 'semi-bluff']
  },

  // ===== 河牌圈场景 =====
  {
    id: 'river-1',
    category: 'river',
    difficulty: 3,
    position: 'BTN',
    stackSize: 60,
    situation: {
      holeCards: ['Ac', 'Qc'],
      communityCards: ['Ad', 'Kh', '7s', '3d', '2c'],
      potSize: 50,
      currentBet: 0,
      stackSize: 60,
      position: 'BTN',
      actionHistory: [
        // 完整的行动历史
      ]
    },
    gtoSolution: {
      actions: [
        { action: 'raise', frequency: 0.25, size: 25 },
        { action: 'check', frequency: 0.75 }
      ],
      ev: { raise: 35, check: 30 },
      reasoning: '顶对在干燥河牌可以薄价值下注，但频率不高'
    },
    tags: ['thin-value', 'river-decision', 'top-pair']
  },
  {
    id: 'river-2',
    category: 'river',
    difficulty: 5,
    position: 'BB',
    stackSize: 40,
    situation: {
      holeCards: ['8h', '7h'],
      communityCards: ['Jh', 'Th', '9c', 'Qd', 'Ks'],
      potSize: 80,
      currentBet: 40,
      stackSize: 40,
      position: 'BB',
      actionHistory: [
        // 行动历史
      ]
    },
    gtoSolution: {
      actions: [
        { action: 'fold', frequency: 0.90 },
        { action: 'call', frequency: 0.10 }
      ],
      ev: { fold: 0, call: -35 },
      reasoning: '面对河牌大注，只有9的顺子很难是好牌'
    },
    tags: ['hero-call', 'river-decision', 'tough-spot']
  },
  {
    id: 'river-3',
    category: 'river',
    difficulty: 4,
    position: 'CO',
    stackSize: 120,
    situation: {
      holeCards: ['6d', '5d'],
      communityCards: ['4d', '3d', '2h', 'Kc', 'As'],
      potSize: 60,
      currentBet: 0,
      stackSize: 120,
      position: 'CO',
      actionHistory: []
    },
    gtoSolution: {
      actions: [
        { action: 'raise', frequency: 0.95, size: 50 },
        { action: 'check', frequency: 0.05 }
      ],
      ev: { raise: 65, check: 30 },
      reasoning: '坚果顺子应该几乎总是下注获取价值'
    },
    tags: ['nuts', 'value-bet', 'river']
  },

  // ===== 更多高级场景 =====
  {
    id: 'advanced-1',
    category: 'river',
    difficulty: 5,
    position: 'BTN',
    stackSize: 150,
    situation: {
      holeCards: ['Tc', '9c'],
      communityCards: ['8c', '7c', '6h', '2d', 'Ac'],
      potSize: 100,
      currentBet: 0,
      stackSize: 150,
      position: 'BTN',
      actionHistory: []
    },
    gtoSolution: {
      actions: [
        { action: 'raise', frequency: 0.33, size: 100 },
        { action: 'check', frequency: 0.67 }
      ],
      ev: { raise: 50, check: 40 },
      reasoning: '同花顺子可以偶尔超池诈唬，利用A完成的同花听牌'
    },
    tags: ['overbet-bluff', 'polarized', 'advanced']
  },
  {
    id: 'advanced-2',
    category: 'turn',
    difficulty: 5,
    position: 'BB',
    stackSize: 200,
    situation: {
      holeCards: ['Ah', 'Ad'],
      communityCards: ['9h', '8h', '7s', '6h'],
      potSize: 80,
      currentBet: 60,
      stackSize: 200,
      position: 'BB',
      actionHistory: []
    },
    gtoSolution: {
      actions: [
        { action: 'call', frequency: 0.55 },
        { action: 'fold', frequency: 0.30 },
        { action: 'raise', frequency: 0.15, size: 180 }
      ],
      ev: { call: 20, fold: 0, raise: -10 },
      reasoning: 'AA在极湿润的转牌面对大注应该混合策略'
    },
    tags: ['overpair', 'wet-board', 'difficult-decision']
  },

  // 继续添加更多场景...
  // 总共需要至少100个场景来覆盖各种情况
];

// 生成更多场景的辅助函数
export function generateAdditionalScenarios() {
  const scenarios = [];
  const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  const categories = ['preflop', 'flop', 'turn', 'river'];
  
  // 这里可以程序化生成更多场景
  // 或从外部数据源导入
  
  return scenarios;
}

export default testScenarios;