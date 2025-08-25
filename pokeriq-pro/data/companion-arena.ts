// 陪伴竞技场系统 - Companion Arena System
// 8人桌终极挑战：玩家 + 5陪伴 + 2AI = 高风险高回报

export interface CompanionArenaConfig {
  // === 竞技场规则 ===
  arenaRules: {
    minCompanionsRequired: 6; // 需要至少6个陪伴才能开启
    tableSize: 8; // 8人桌
    composition: {
      player: 1;
      companions: 5; // 玩家的陪伴
      aiOpponents: 2; // AI对手
    };
    stakes: {
      type: 'elimination' | 'chips';
      eliminationPenalty: 'lose_companion'; // 输了失去一个陪伴
      redemptionCost: number; // 赎回成本（智慧币）
      winReward: {
        bbThreshold: 1000; // 赢1000个大盲
        reward: 'S_tier_companion'; // 奖励S级陪伴
      };
    };
  };

  // === 陪伴评级系统 ===
  companionRating: {
    tiers: ['S', 'A', 'B', 'C', 'D'];
    evaluationCriteria: {
      winRate: number; // 胜率权重
      supportSkill: number; // 支援能力权重
      luckBonus: number; // 幸运加成权重
      intimacyLevel: number; // 亲密度权重
      specialAbility: number; // 特殊能力权重
    };
    ratingPeriod: 'weekly' | 'monthly';
    rewards: {
      S: { wisdomCoins: 5000, items: ['legendary_outfit'], title: '传奇陪伴' };
      A: { wisdomCoins: 2000, items: ['epic_outfit'], title: '精英陪伴' };
      B: { wisdomCoins: 1000, items: ['rare_outfit'], title: '优秀陪伴' };
      C: { wisdomCoins: 500, items: ['common_outfit'], title: '普通陪伴' };
      D: { wisdomCoins: 100, items: [], title: '需要提升' };
    };
  };
}

// S级陪伴角色（隐藏角色）
export const S_TIER_COMPANIONS = [
  {
    codeName: 'aphrodite',
    name: 'Aphrodite',
    nameLocalized: {
      zh: '阿芙罗狄蒂',
      en: 'Aphrodite'
    },
    personality: 'goddess',
    region: 'mythical',
    tier: 'S',
    backstory: {
      zh: '爱与美的女神降临人间，她的存在本身就是奇迹。在台球室中，她的每一个动作都如同艺术品。传说她能预见牌局的结果，因为命运之线在她手中。',
      en: 'Goddess of love and beauty descended to earth. Her very presence is a miracle. Every move in the pool hall is art. Legend says she can foresee game outcomes, as fate\'s threads are in her hands.'
    },
    specialAbilities: [
      {
        name: '命运预见',
        description: '有15%概率预测对手下一手',
        type: 'passive'
      },
      {
        name: '女神祝福',
        description: '关键时刻提升20%胜率',
        type: 'active',
        cooldown: '每场一次'
      },
      {
        name: '魅惑光环',
        description: 'AI对手决策失误率+10%',
        type: 'aura'
      }
    ],
    arenaBonus: {
      winRateBoost: 0.15,
      luckBoost: 0.25,
      intimidationFactor: 0.20
    },
    unlockCondition: '赢得1000BB或完成传奇成就',
    price: 'NOT_FOR_SALE' // 无法购买，只能赢取
  },
  
  {
    codeName: 'valkyrie',
    name: 'Valkyrie',
    nameLocalized: {
      zh: '瓦尔基里',
      en: 'Valkyrie'
    },
    personality: 'warrior',
    region: 'nordic',
    tier: 'S',
    backstory: {
      zh: '北欧神话中的女武神，选择英勇战士的命运。她将德州扑克视为现代战场，每一手牌都是生死决斗。失败者将被她带走，胜利者获得永恒荣耀。',
      en: 'Norse Valkyrie who chooses warriors\' fates. She sees Texas Hold\'em as modern battlefield, each hand a duel of life and death. Losers are taken, winners gain eternal glory.'
    },
    specialAbilities: [
      {
        name: '战士之魂',
        description: '危机时刻自动全下成功率+30%',
        type: 'passive'
      },
      {
        name: '英灵召唤',
        description: '可以借用已失去陪伴的能力一回合',
        type: 'active',
        cooldown: '每天一次'
      },
      {
        name: '不败意志',
        description: '即将被淘汰时有20%概率复活',
        type: 'ultimate'
      }
    ],
    arenaBonus: {
      aggressionBoost: 0.30,
      bluffSuccess: 0.25,
      survivalRate: 0.20
    },
    unlockCondition: '连续5场竞技场不败',
    price: 'NOT_FOR_SALE'
  },

  {
    codeName: 'kitsune',
    name: 'Nine-Tail Fox',
    nameLocalized: {
      zh: '九尾狐妖',
      en: 'Nine-Tail Fox'
    },
    personality: 'trickster',
    region: 'mythical_asia',
    tier: 'S',
    backstory: {
      zh: '千年九尾狐妖，精通幻术与心理操控。她能变化成任何样貌，读取对手内心的恐惧与欲望。在牌桌上，真相与幻象交织，无人能识破她的诡计。',
      en: 'Thousand-year nine-tail fox spirit, master of illusions and mind control. She can shapeshift and read opponents\' fears and desires. At the table, truth and illusion interweave.'
    },
    specialAbilities: [
      {
        name: '千面幻化',
        description: '每局可以复制一个其他陪伴的能力',
        type: 'active'
      },
      {
        name: '心灵读取',
        description: '查看一名对手的底牌（每场3次）',
        type: 'active',
        uses: 3
      },
      {
        name: '狐媚术',
        description: '让一名AI对手跟注你的下注',
        type: 'control'
      }
    ],
    arenaBonus: {
      deceptionBoost: 0.40,
      informationGathering: 0.35,
      mindGames: 0.30
    },
    unlockCondition: '收集所有其他陪伴',
    price: 'NOT_FOR_SALE'
  }
];

// 竞技场模式配置
export const ARENA_MODES = {
  // 经典淘汰赛
  classic_elimination: {
    name: '经典淘汰赛',
    description: '输掉所有筹码的陪伴将被带走',
    rules: {
      startingChips: 10000,
      blindsIncrease: 'every_10_hands',
      eliminationOrder: 'chip_out',
      companionLoss: 'lowest_rated',
      redemptionWindow: '24_hours'
    }
  },

  // 生存挑战
  survival_challenge: {
    name: '生存挑战',
    description: '坚持100手牌，每20手淘汰评分最低者',
    rules: {
      totalHands: 100,
      eliminationInterval: 20,
      evaluationCriteria: ['chip_count', 'hands_won', 'support_provided'],
      survivalReward: 'rating_boost',
      perfectReward: 'S_tier_companion'
    }
  },

  // 陪伴保卫战
  companion_defense: {
    name: '陪伴保卫战',
    description: '保护你的陪伴不被AI猎手夺走',
    rules: {
      aiHunters: 2,
      hunterAggression: 'extreme',
      targetSelection: 'highest_rated_companion',
      defenseBonus: 'companion_abilities_doubled',
      victoryCondition: 'eliminate_all_hunters'
    }
  },

  // 逆转命运
  fate_reversal: {
    name: '逆转命运',
    description: '用D级陪伴挑战全S级阵容',
    rules: {
      playerCompanions: 'D_tier_only',
      aiCompanions: 'S_tier_only',
      handicap: 'player_2x_starting_chips',
      victoryReward: 'instant_S_tier_upgrade',
      inspirationBonus: 'underdog_buff_+50%'
    }
  }
};

// 陪伴评级算法
export class CompanionRatingSystem {
  calculateRating(companion: any, performance: any): string {
    const score = 
      performance.winRate * 0.3 +
      performance.supportSkill * 0.2 +
      performance.luckBonus * 0.1 +
      performance.intimacyLevel * 0.2 +
      performance.specialAbility * 0.2;

    if (score >= 90) return 'S';
    if (score >= 75) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  }

  evaluateArenaPerformance(companion: any, arenaStats: any) {
    return {
      damageDealt: arenaStats.chipsWon,
      damageReceived: arenaStats.chipsLost,
      supportProvided: arenaStats.assistCount,
      clutchFactor: arenaStats.criticalWins,
      synergyBonus: arenaStats.comboPlays
    };
  }
}

// 陪伴协同效果
export const COMPANION_SYNERGIES = {
  // 地域组合
  asian_harmony: {
    required: ['sakura', 'vivian', 'kitsune'],
    bonus: {
      name: '东方和谐',
      effect: '所有亚洲陪伴能力+20%',
      auraEffect: '获得禅意buff，减少bad beat影响'
    }
  },

  western_party: {
    required: ['jessica', 'sophia'],
    bonus: {
      name: '西方派对',
      effect: '气氛值MAX，获得额外行动点',
      auraEffect: '派对模式：随机获得礼物'
    }
  },

  mythical_legends: {
    required: ['aphrodite', 'valkyrie', 'kitsune'],
    bonus: {
      name: '神话传说',
      effect: '解锁神话牌桌，所有能力翻倍',
      auraEffect: '凡人AI自动恐惧-30%决策力'
    }
  },

  // 性格组合
  perfect_balance: {
    required: ['sweet', 'professional', 'playful', 'mysterious', 'elegant'],
    bonus: {
      name: '完美平衡',
      effect: '根据局势自动切换最优性格',
      auraEffect: '和谐光环：团队配合度+50%'
    }
  }
};

// 赎回系统
export const REDEMPTION_SYSTEM = {
  baseCost: 1000, // 基础赎回成本
  
  calculateRedemptionCost(companion: any, timeLost: number): number {
    const rarityMultiplier = {
      'D': 1,
      'C': 2,
      'B': 3,
      'A': 5,
      'S': 10
    };
    
    const timePenalty = Math.floor(timeLost / 3600) * 100; // 每小时+100
    const baseCost = this.baseCost * (rarityMultiplier[companion.tier] || 1);
    
    return baseCost + timePenalty;
  },

  alternativeRedemption: {
    // 任务赎回
    questRedemption: {
      name: '救赎任务',
      requirement: '完成特定任务线',
      difficulty: 'varies_by_tier'
    },
    
    // 交换赎回
    tradeRedemption: {
      name: '等价交换',
      requirement: '献祭同级别其他陪伴',
      warning: '献祭的陪伴将永久失去'
    },
    
    // 竞技赎回
    arenaRedemption: {
      name: '荣耀救赎',
      requirement: '赢得下一场竞技场',
      risk: '失败将永久失去'
    }
  }
};

// 竞技场奖励池
export const ARENA_REWARDS = {
  milestone_rewards: [
    { wins: 10, reward: 'A_tier_companion_selector' },
    { wins: 25, reward: 'S_tier_companion_fragment' },
    { wins: 50, reward: 'mythical_outfit_set' },
    { wins: 100, reward: 'arena_legend_title' }
  ],
  
  weekly_leaderboard: {
    top1: { wisdomCoins: 50000, companion: 'S_tier_guaranteed' },
    top3: { wisdomCoins: 20000, companion: 'A_tier_guaranteed' },
    top10: { wisdomCoins: 10000, companion: 'B_tier_selector' },
    top100: { wisdomCoins: 5000, items: ['rare_gifts'] }
  },

  special_achievements: {
    perfect_run: {
      name: '完美竞技',
      condition: '一场不输完成10场',
      reward: 'aphrodite_unlock'
    },
    
    underdog_story: {
      name: '逆袭传奇',
      condition: '全D级阵容击败S级',
      reward: 'instant_team_upgrade'
    },
    
    collector_supreme: {
      name: '收藏大师',
      condition: '拥有所有陪伴',
      reward: 'exclusive_golden_skins'
    }
  }
};