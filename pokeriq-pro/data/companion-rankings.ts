// 陪伴排行榜系统 - Companion Ranking System
// 多维度排行榜：数量、星级、魅力值、身价

export interface RankingSystem {
  // === 排行榜类型 ===
  rankingTypes: {
    quantity: '收藏家榜';      // 陪伴数量排行
    starPower: '星耀榜';       // 综合星级排行
    charm: '魅力榜';           // 单个陪伴魅力度排行
    value: '身价榜';           // 单个陪伴身价排行
    legend: '传奇榜';          // S级陪伴专属榜
  };

  // === 榜单更新 ===
  updateFrequency: 'realtime' | 'hourly' | 'daily';
  seasonDuration: 30; // 赛季天数
  rewards: {
    daily: boolean;
    weekly: boolean;
    seasonal: boolean;
  };
}

// 收藏家榜 - 陪伴数量排行
export interface CollectorRanking {
  userId: string;
  username: string;
  avatar: string;
  stats: {
    totalCompanions: number;        // 总陪伴数
    sRankCount: number;             // S级数量
    aRankCount: number;             // A级数量
    bRankCount: number;             // B级数量
    uniqueRegions: number;          // 拥有的地域种类
    completionRate: number;         // 收集完成度 %
    rareCompanions: string[];       // 稀有陪伴列表
  };
  badges: CollectorBadge[];
  rank: number;
  previousRank: number;
  trend: 'up' | 'down' | 'stable';
}

// 星耀榜 - 综合星级排行
export interface StarPowerRanking {
  userId: string;
  username: string;
  avatar: string;
  stats: {
    averageRating: string;          // 平均评级 (S/A/B/C/D)
    totalStarPower: number;         // 总星力值
    topCompanions: {                // 最强三个陪伴
      name: string;
      rating: string;
      level: number;
    }[];
    teamComposition: {              // 团队构成
      S: number;
      A: number;
      B: number;
      C: number;
      D: number;
    };
  };
  starPowerScore: number;           // 星力总分
  rank: number;
  title: string;                    // 称号
}

// 魅力榜 - 单个陪伴魅力度排行
export interface CharmRanking {
  companionId: string;
  companionName: string;
  companionNameLocalized: {
    zh: string;
    en: string;
  };
  customName?: string;              // S级陪伴的自定义名字
  owner: {
    userId: string;
    username: string;
    avatar: string;
  };
  stats: {
    charmLevel: number;             // 魅力等级 1-999
    relationshipLevel: number;      // 关系等级 1-100
    intimacyPoints: number;         // 亲密度总分
    outfitsUnlocked: number;        // 解锁的服装数
    giftsReceived: number;          // 收到的礼物数
    memoriesCreated: number;        // 创建的记忆数
    voicePacksOwned: number;        // 拥有的语音包数
  };
  charmScore: number;               // 魅力总分
  rank: number;
  badge: CharmBadge;
}

// 身价榜 - 单个陪伴身价排行
export interface ValueRanking {
  companionId: string;
  companionName: string;
  customName?: string;              // S级陪伴的自定义名字
  owner: {
    userId: string;
    username: string;
    avatar: string;
  };
  stats: {
    baseValue: number;              // 基础身价
    investmentValue: number;        // 投资价值（礼物、装扮等）
    arenaWinnings: number;          // 竞技场收益
    marketValue: number;            // 市场估值
    appreciationRate: number;       // 增值率 %
    rarity: string;                 // 稀有度
    tier: string;                   // 评级
  };
  totalValue: number;               // 总身价
  rank: number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
    changeAmount: number;
  };
}

// 传奇榜 - S级陪伴专属榜
export interface LegendRanking {
  companionId: string;
  originalName: string;
  customName: string;               // 玩家起的名字
  owner: {
    userId: string;
    username: string;
    avatar: string;
    vipLevel: number;
  };
  stats: {
    powerLevel: number;             // 力量等级 1-9999
    arenaVictories: number;         // 竞技场胜利次数
    companionsDefeated: number;     // 击败的陪伴数
    legendaryMoments: number;       // 传奇时刻数
    uniqueAbilities: string[];      // 独特能力列表
    evolutionStage: number;         // 进化阶段 1-5
  };
  legendScore: number;              // 传奇分数
  rank: number;
  title: string;                    // 专属称号
  story: string;                    // 传奇故事
}

// S级陪伴命名系统
export interface CompanionNamingSystem {
  rules: {
    minLength: 2;
    maxLength: 12;
    allowedCharacters: 'chinese' | 'english' | 'mixed';
    profanityFilter: boolean;
    uniqueRequired: boolean;        // 名字是否需要唯一
  };
  
  namingCost: {
    firstTime: 0;                   // 首次免费
    rename: 500;                    // 改名费用（智慧币）
    cooldown: 7;                    // 改名冷却天数
  };

  namePlate: {
    styles: NamingStyle[];          // 名牌样式
    effects: NamingEffect[];        // 特效
    fonts: string[];                // 字体选择
  };
}

// 名牌样式
export interface NamingStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
  unlockCondition: string;
  price: number;
}

// 徽章系统
export interface CollectorBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

export interface CharmBadge {
  id: string;
  name: string;
  level: number;
  title: string;
  effect: string;
}

// 排行榜奖励
export const RANKING_REWARDS = {
  // 每日奖励
  daily: {
    top1: { wisdomCoins: 1000, item: 'mystery_gift_box' },
    top3: { wisdomCoins: 500, item: 'rare_outfit_selector' },
    top10: { wisdomCoins: 200, item: 'voice_pack_trial' },
    top50: { wisdomCoins: 100 },
    top100: { wisdomCoins: 50 }
  },

  // 每周奖励
  weekly: {
    collector: {
      top1: { 
        title: '收藏皇帝',
        wisdomCoins: 5000,
        item: 'legendary_companion_fragment',
        badge: 'collector_crown'
      },
      top3: { 
        title: '收藏大师',
        wisdomCoins: 2000,
        item: 'epic_companion_selector'
      },
      top10: { 
        title: '收藏专家',
        wisdomCoins: 1000
      }
    },
    
    charm: {
      top1: {
        title: '魅力之王',
        wisdomCoins: 5000,
        item: 'exclusive_outfit_set',
        effect: 'charm_aura_30days'
      },
      top3: {
        title: '魅力大师',
        wisdomCoins: 2000,
        item: 'premium_gift_pack'
      }
    },

    value: {
      top1: {
        title: '首富',
        wisdomCoins: 10000,
        item: 'value_multiplier_card',
        effect: 'double_earnings_7days'
      },
      top3: {
        title: '富豪',
        wisdomCoins: 5000
      }
    },

    legend: {
      top1: {
        title: '传奇缔造者',
        wisdomCoins: 20000,
        item: 'mythic_evolution_stone',
        privilege: 'custom_companion_skill'
      }
    }
  },

  // 赛季奖励
  seasonal: {
    grandChampion: {
      title: '赛季总冠军',
      wisdomCoins: 100000,
      companion: 'exclusive_seasonal_S_rank',
      privilege: 'permanent_vip_status',
      trophy: 'golden_companion_statue'
    }
  }
};

// 排行榜计算公式
export class RankingCalculator {
  // 计算星力值
  calculateStarPower(companions: any[]): number {
    const tierMultipliers = {
      'S': 1000,
      'A': 500,
      'B': 200,
      'C': 50,
      'D': 10
    };
    
    return companions.reduce((total, companion) => {
      const base = tierMultipliers[companion.tier] || 10;
      const levelBonus = companion.relationshipLevel * 10;
      const intimacyBonus = Math.floor(companion.intimacyPoints / 100);
      return total + base + levelBonus + intimacyBonus;
    }, 0);
  }

  // 计算魅力值
  calculateCharmScore(companion: any): number {
    const baseCharm = companion.relationshipLevel * 100;
    const intimacyCharm = companion.intimacyPoints;
    const outfitBonus = companion.unlockedOutfits.length * 50;
    const giftBonus = companion.giftsReceived * 20;
    const memoryBonus = companion.memoriesCreated * 100;
    const voiceBonus = companion.voicePacksOwned * 200;
    
    const tierMultiplier = {
      'S': 5.0,
      'A': 3.0,
      'B': 2.0,
      'C': 1.5,
      'D': 1.0
    }[companion.tier] || 1.0;
    
    return Math.floor(
      (baseCharm + intimacyCharm + outfitBonus + giftBonus + memoryBonus + voiceBonus) 
      * tierMultiplier
    );
  }

  // 计算身价
  calculateValue(companion: any): number {
    const baseValue = companion.basePrice || 0;
    const investmentValue = companion.totalInvestment || 0;
    const arenaEarnings = companion.arenaWinnings || 0;
    
    // 稀有度加成
    const rarityMultiplier = {
      'legendary': 10.0,
      'epic': 5.0,
      'rare': 2.0,
      'common': 1.0
    }[companion.rarity] || 1.0;
    
    // 等级加成（每10级增加10%价值）
    const levelMultiplier = 1 + (companion.relationshipLevel / 10) * 0.1;
    
    // 市场波动（模拟供需）
    const marketFluctuation = 0.8 + Math.random() * 0.4; // 0.8-1.2倍
    
    return Math.floor(
      (baseValue + investmentValue + arenaEarnings) 
      * rarityMultiplier 
      * levelMultiplier 
      * marketFluctuation
    );
  }

  // 计算传奇分数
  calculateLegendScore(companion: any): number {
    if (companion.tier !== 'S') return 0;
    
    const powerBase = companion.powerLevel || 1;
    const victoryBonus = (companion.arenaVictories || 0) * 100;
    const defeatBonus = (companion.companionsDefeated || 0) * 50;
    const momentBonus = (companion.legendaryMoments || 0) * 500;
    const evolutionMultiplier = companion.evolutionStage || 1;
    
    return Math.floor(
      (powerBase + victoryBonus + defeatBonus + momentBonus) 
      * evolutionMultiplier
    );
  }
}

// 称号系统
export const RANKING_TITLES = {
  collector: [
    { min: 1, max: 1, title: '收藏皇帝', color: '#ffd700' },
    { min: 2, max: 3, title: '收藏王', color: '#c0c0c0' },
    { min: 4, max: 10, title: '收藏大师', color: '#cd7f32' },
    { min: 11, max: 50, title: '收藏专家', color: '#722ed1' },
    { min: 51, max: 100, title: '收藏达人', color: '#1890ff' },
    { min: 101, max: 500, title: '收藏爱好者', color: '#52c41a' }
  ],
  
  charm: [
    { min: 1, max: 1, title: '倾国倾城', color: '#ff1493' },
    { min: 2, max: 3, title: '魅力女王', color: '#ff69b4' },
    { min: 4, max: 10, title: '万人迷', color: '#ff86b3' },
    { min: 11, max: 50, title: '魅力达人', color: '#ffa0c2' },
    { min: 51, max: 100, title: '人气王', color: '#ffb3d1' }
  ],
  
  value: [
    { min: 1, max: 1, title: '首富', color: '#ffd700' },
    { min: 2, max: 3, title: '巨富', color: '#ffa500' },
    { min: 4, max: 10, title: '富豪', color: '#ff8c00' },
    { min: 11, max: 50, title: '富翁', color: '#ff7f50' },
    { min: 51, max: 100, title: '小康', color: '#ffa07a' }
  ],
  
  legend: [
    { min: 1, max: 1, title: '永恒传奇', color: '#ff0000', effect: 'rainbow' },
    { min: 2, max: 3, title: '不朽传奇', color: '#ff4500' },
    { min: 4, max: 10, title: '史诗传奇', color: '#ff6347' },
    { min: 11, max: 20, title: '传奇大师', color: '#ff7f50' }
  ]
};

// S级陪伴进化系统
export const S_RANK_EVOLUTION = {
  stages: [
    {
      stage: 1,
      name: '初始形态',
      requirement: 'S级陪伴解锁',
      powerRange: [1, 1999],
      abilities: 1
    },
    {
      stage: 2,
      name: '觉醒形态',
      requirement: '关系等级100 + 竞技场10胜',
      powerRange: [2000, 4999],
      abilities: 2,
      visualEffect: 'golden_aura'
    },
    {
      stage: 3,
      name: '进化形态',
      requirement: '魅力值10000 + 传奇时刻5次',
      powerRange: [5000, 7999],
      abilities: 3,
      visualEffect: 'rainbow_wings'
    },
    {
      stage: 4,
      name: '究极形态',
      requirement: '身价100万 + 击败100个陪伴',
      powerRange: [8000, 9499],
      abilities: 4,
      visualEffect: 'cosmic_crown'
    },
    {
      stage: 5,
      name: '神话形态',
      requirement: '达成所有成就 + 赛季总冠军',
      powerRange: [9500, 9999],
      abilities: 5,
      visualEffect: 'divine_transformation',
      exclusive: true
    }
  ]
};