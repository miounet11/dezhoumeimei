// 陪伴自定义装扮系统 - Companion Customization System
// 服装配饰系统 + 头像权限 + 专属皮肤

export interface CustomizationSystem {
  // === 排行榜奖励权限 ===
  rankingRewards: {
    weekly: {
      rank1: 'avatar_customization';    // 第一名：自定义头像权限
      uses: 1;                          // 只能使用一次
      duration: 'permanent';            // 永久保存
    };
    yearly: {
      rank1: 'exclusive_skin_set';     // 年度第一：专属定制皮肤套装
      includes: ['outfit', 'accessories', 'effects', 'voice'];
      customizable: true;              // 可以自定义设计
      exclusive: true;                  // 独一无二
    };
  };

  // === 魅力评分系统 ===
  charmScoring: {
    baseScore: 60;                     // 基础分60分
    maxScore: 100;                     // 满分100分
    tiers: {
      D: [60, 69];
      C: [70, 79];
      B: [80, 89];
      A: [90, 99];
      S: [100, 100];
      SS: [101, 150];                  // 超越满分
      SSS: [151, 200];
      SSSR: [201, 250];
      KING: [251, Infinity];           // 顶级
    };
  };
}

// 服装系统（12套）
export const COMPANION_OUTFITS = [
  {
    id: 'pool_hall_uniform',
    name: '台球厅制服',
    nameEn: 'Pool Hall Uniform',
    category: 'professional',
    description: '经典的黑白台球厅制服，专业而优雅',
    charmBonus: 15,
    attributes: {
      elegance: 10,
      professionalism: 15,
      sexiness: 5,
      cuteness: 5
    },
    price: 500,
    obtainMethod: ['shop', 'achievement'],
    rarity: 'common',
    imageUrl: '/outfits/pool_uniform.jpg',
    effects: {
      poolHallBonus: 1.2,              // 台球厅场景加成
      trainingFocus: 1.1               // 训练专注度提升
    }
  },
  
  {
    id: 'evening_gown',
    name: '晚礼服',
    nameEn: 'Evening Gown',
    category: 'formal',
    description: '华丽的黑色晚礼服，镶嵌着闪亮的钻石',
    charmBonus: 25,
    attributes: {
      elegance: 25,
      professionalism: 10,
      sexiness: 15,
      cuteness: 0
    },
    price: 2000,
    obtainMethod: ['shop'],
    rarity: 'rare',
    imageUrl: '/outfits/evening_gown.jpg',
    effects: {
      vipBonus: 1.5,                   // VIP场景加成
      intimacyGain: 1.3                // 亲密度获取加成
    }
  },

  {
    id: 'bikini_set',
    name: '比基尼套装',
    nameEn: 'Bikini Set',
    category: 'beach',
    description: '性感的比基尼，展现完美身材',
    charmBonus: 20,
    attributes: {
      elegance: 5,
      professionalism: 0,
      sexiness: 30,
      cuteness: 10
    },
    price: 1500,
    obtainMethod: ['shop', 'summer_event'],
    rarity: 'rare',
    imageUrl: '/outfits/bikini.jpg',
    effects: {
      summerBonus: 2.0,                // 夏日活动加成
      moodBoost: 1.5                   // 心情提升
    },
    seasonLimited: true
  },

  {
    id: 'bunny_costume',
    name: '兔女郎装',
    nameEn: 'Bunny Costume',
    category: 'costume',
    description: '经典的兔女郎装扮，可爱又性感',
    charmBonus: 30,
    attributes: {
      elegance: 10,
      professionalism: 0,
      sexiness: 25,
      cuteness: 20
    },
    price: 3000,
    obtainMethod: ['shop', 'special_achievement'],
    rarity: 'epic',
    imageUrl: '/outfits/bunny.jpg',
    effects: {
      casinoBonus: 1.8,                // 赌场场景加成
      luckBoost: 1.2                   // 幸运值提升
    }
  },

  {
    id: 'school_uniform',
    name: 'JK制服',
    nameEn: 'School Uniform',
    category: 'cute',
    description: '日系JK制服，青春活力',
    charmBonus: 18,
    attributes: {
      elegance: 5,
      professionalism: 5,
      sexiness: 10,
      cuteness: 25
    },
    price: 1000,
    obtainMethod: ['shop', 'daily_training'],
    rarity: 'common',
    imageUrl: '/outfits/jk.jpg',
    effects: {
      youthBonus: 1.3,                 // 青春活力加成
      learningSpeed: 1.2               // 学习速度提升
    }
  },

  {
    id: 'qipao',
    name: '旗袍',
    nameEn: 'Qipao',
    category: 'traditional',
    description: '传统中式旗袍，东方韵味',
    charmBonus: 22,
    attributes: {
      elegance: 30,
      professionalism: 15,
      sexiness: 15,
      cuteness: 5
    },
    price: 1800,
    obtainMethod: ['shop', 'chinese_new_year'],
    rarity: 'rare',
    imageUrl: '/outfits/qipao.jpg',
    effects: {
      easternCharm: 1.5,               // 东方魅力加成
      culturalBonus: 1.3               // 文化活动加成
    }
  },

  {
    id: 'maid_outfit',
    name: '女仆装',
    nameEn: 'Maid Outfit',
    category: 'costume',
    description: '经典女仆装，贴心服务',
    charmBonus: 20,
    attributes: {
      elegance: 5,
      professionalism: 10,
      sexiness: 15,
      cuteness: 30
    },
    price: 1200,
    obtainMethod: ['shop', 'service_achievement'],
    rarity: 'common',
    imageUrl: '/outfits/maid.jpg',
    effects: {
      serviceBonus: 1.4,               // 服务态度加成
      caregiving: 1.3                  // 照顾能力提升
    }
  },

  {
    id: 'leather_suit',
    name: '皮衣套装',
    nameEn: 'Leather Suit',
    category: 'cool',
    description: '黑色皮衣，酷炫神秘',
    charmBonus: 28,
    attributes: {
      elegance: 15,
      professionalism: 10,
      sexiness: 20,
      cuteness: 0
    },
    price: 2500,
    obtainMethod: ['shop', 'arena_victory'],
    rarity: 'epic',
    imageUrl: '/outfits/leather.jpg',
    effects: {
      intimidation: 1.5,               // 威慑力加成
      arenaBonus: 1.4                  // 竞技场加成
    }
  },

  {
    id: 'wedding_dress',
    name: '婚纱',
    nameEn: 'Wedding Dress',
    category: 'special',
    description: '纯白婚纱，梦幻唯美',
    charmBonus: 35,
    attributes: {
      elegance: 35,
      professionalism: 5,
      sexiness: 10,
      cuteness: 15
    },
    price: 5000,
    obtainMethod: ['shop', 'relationship_100'],
    rarity: 'legendary',
    imageUrl: '/outfits/wedding.jpg',
    effects: {
      commitmentBonus: 2.0,            // 承诺加成
      eternityBoost: 1.8               // 永恒之爱
    },
    unlockCondition: 'relationship_level_100'
  },

  {
    id: 'kimono',
    name: '和服',
    nameEn: 'Kimono',
    category: 'traditional',
    description: '精致和服，日式优雅',
    charmBonus: 24,
    attributes: {
      elegance: 28,
      professionalism: 12,
      sexiness: 12,
      cuteness: 8
    },
    price: 2200,
    obtainMethod: ['shop', 'sakura_festival'],
    rarity: 'rare',
    imageUrl: '/outfits/kimono.jpg',
    effects: {
      japaneseCharm: 1.5,              // 日式魅力
      ceremonyBonus: 1.4               // 仪式感加成
    }
  },

  {
    id: 'sports_wear',
    name: '运动装',
    nameEn: 'Sports Wear',
    category: 'casual',
    description: '活力运动装，健康阳光',
    charmBonus: 16,
    attributes: {
      elegance: 5,
      professionalism: 5,
      sexiness: 15,
      cuteness: 15
    },
    price: 800,
    obtainMethod: ['shop', 'daily_exercise'],
    rarity: 'common',
    imageUrl: '/outfits/sports.jpg',
    effects: {
      energyBoost: 1.3,                // 活力提升
      healthBonus: 1.2                 // 健康加成
    }
  },

  {
    id: 'goddess_robe',
    name: '女神长袍',
    nameEn: 'Goddess Robe',
    category: 'mythical',
    description: '神话中的女神装束，超凡脱俗',
    charmBonus: 40,
    attributes: {
      elegance: 40,
      professionalism: 20,
      sexiness: 25,
      cuteness: 5
    },
    price: 10000,
    obtainMethod: ['s_rank_evolution'],
    rarity: 'mythical',
    imageUrl: '/outfits/goddess.jpg',
    effects: {
      divineAura: 2.0,                 // 神圣光环
      mythicalPower: 1.8,              // 神话之力
      allAttributesBoost: 1.5          // 全属性提升
    },
    unlockCondition: 's_rank_stage_5'
  }
];

// 配饰系统（12个）
export const COMPANION_ACCESSORIES = [
  {
    id: 'cat_ears',
    name: '猫耳',
    nameEn: 'Cat Ears',
    type: 'headwear',
    description: '可爱的猫耳发饰',
    charmBonus: 8,
    attributes: {
      cuteness: 15,
      playfulness: 10
    },
    price: 300,
    obtainMethod: ['shop', 'daily_login'],
    rarity: 'common',
    effects: {
      cuteAppeal: 1.2
    }
  },

  {
    id: 'diamond_necklace',
    name: '钻石项链',
    nameEn: 'Diamond Necklace',
    type: 'necklace',
    description: '闪耀的钻石项链',
    charmBonus: 15,
    attributes: {
      elegance: 20,
      luxury: 15
    },
    price: 3000,
    obtainMethod: ['shop', 'vip_gift'],
    rarity: 'epic',
    effects: {
      wealthDisplay: 1.5
    }
  },

  {
    id: 'angel_wings',
    name: '天使之翼',
    nameEn: 'Angel Wings',
    type: 'back',
    description: '洁白的天使翅膀',
    charmBonus: 20,
    attributes: {
      elegance: 15,
      holiness: 20
    },
    price: 5000,
    obtainMethod: ['achievement_1000_wins'],
    rarity: 'legendary',
    effects: {
      flyingAbility: true,
      divineProtection: 1.3
    }
  },

  {
    id: 'devil_horns',
    name: '恶魔之角',
    nameEn: 'Devil Horns',
    type: 'headwear',
    description: '性感的小恶魔角',
    charmBonus: 12,
    attributes: {
      sexiness: 18,
      mischief: 15
    },
    price: 1000,
    obtainMethod: ['shop', 'halloween_event'],
    rarity: 'rare',
    effects: {
      temptation: 1.4
    }
  },

  {
    id: 'glasses',
    name: '眼镜',
    nameEn: 'Glasses',
    type: 'eyewear',
    description: '知性眼镜',
    charmBonus: 10,
    attributes: {
      intelligence: 15,
      professionalism: 10
    },
    price: 500,
    obtainMethod: ['shop', 'study_achievement'],
    rarity: 'common',
    effects: {
      analysisBoost: 1.2
    }
  },

  {
    id: 'fox_tail',
    name: '狐狸尾巴',
    nameEn: 'Fox Tail',
    type: 'tail',
    description: '毛茸茸的狐狸尾巴',
    charmBonus: 14,
    attributes: {
      sexiness: 12,
      mystique: 18
    },
    price: 1500,
    obtainMethod: ['shop', 'kitsune_event'],
    rarity: 'rare',
    effects: {
      cunningBonus: 1.3,
      charmSpell: 1.2
    }
  },

  {
    id: 'crown',
    name: '皇冠',
    nameEn: 'Crown',
    type: 'headwear',
    description: '金色皇冠，尊贵象征',
    charmBonus: 25,
    attributes: {
      elegance: 25,
      authority: 20
    },
    price: 8000,
    obtainMethod: ['ranking_champion'],
    rarity: 'legendary',
    effects: {
      royalPresence: 1.8,
      commandRespect: 1.5
    }
  },

  {
    id: 'butterfly_wings',
    name: '蝴蝶翅膀',
    nameEn: 'Butterfly Wings',
    type: 'back',
    description: '梦幻蝴蝶翅膀',
    charmBonus: 16,
    attributes: {
      beauty: 18,
      fantasy: 15
    },
    price: 2000,
    obtainMethod: ['shop', 'spring_festival'],
    rarity: 'rare',
    effects: {
      metamorphosis: 1.3,
      springBlessing: 1.2
    }
  },

  {
    id: 'choker',
    name: '颈环',
    nameEn: 'Choker',
    type: 'necklace',
    description: '黑色蕾丝颈环',
    charmBonus: 10,
    attributes: {
      sexiness: 15,
      submission: 10
    },
    price: 600,
    obtainMethod: ['shop'],
    rarity: 'common',
    effects: {
      intimacyBoost: 1.2
    }
  },

  {
    id: 'halo',
    name: '光环',
    nameEn: 'Halo',
    type: 'headwear',
    description: '神圣光环',
    charmBonus: 18,
    attributes: {
      holiness: 20,
      purity: 15
    },
    price: 4000,
    obtainMethod: ['angel_achievement'],
    rarity: 'epic',
    effects: {
      holyLight: 1.5,
      purification: 1.3
    }
  },

  {
    id: 'garter',
    name: '吊袜带',
    nameEn: 'Garter',
    type: 'legwear',
    description: '性感吊袜带',
    charmBonus: 12,
    attributes: {
      sexiness: 20,
      allure: 15
    },
    price: 800,
    obtainMethod: ['shop', 'intimacy_achievement'],
    rarity: 'rare',
    effects: {
      seductionPower: 1.4
    }
  },

  {
    id: 'star_hairpin',
    name: '星星发夹',
    nameEn: 'Star Hairpin',
    type: 'hairwear',
    description: '闪亮的星星发夹',
    charmBonus: 8,
    attributes: {
      cuteness: 12,
      sparkle: 10
    },
    price: 400,
    obtainMethod: ['shop', 'daily_task'],
    rarity: 'common',
    effects: {
      starPower: 1.1,
      nightBonus: 1.2
    }
  }
];

// 魅力值计算系统
export class CharmCalculator {
  // 计算总魅力值
  calculateTotalCharm(companion: any, outfit: any, accessories: any[]): number {
    // 基础魅力（60分起步）
    let baseCharm = 60;
    
    // 关系等级加成（最多20分）
    const relationshipBonus = Math.min(20, companion.relationshipLevel / 5);
    
    // 服装加成
    const outfitBonus = outfit?.charmBonus || 0;
    
    // 配饰加成（最多3个配饰）
    const accessoryBonus = accessories
      .slice(0, 3)
      .reduce((sum, acc) => sum + (acc?.charmBonus || 0), 0);
    
    // 稀有度加成
    const rarityMultiplier = {
      'common': 1.0,
      'rare': 1.1,
      'epic': 1.2,
      'legendary': 1.3,
      'mythical': 1.5
    };
    
    const outfitMultiplier = rarityMultiplier[outfit?.rarity] || 1.0;
    
    // 套装加成（如果服装和配饰匹配）
    const setBonus = this.checkSetBonus(outfit, accessories) ? 10 : 0;
    
    // 计算总分
    const totalCharm = 
      (baseCharm + relationshipBonus + outfitBonus + accessoryBonus + setBonus) 
      * outfitMultiplier;
    
    return Math.round(totalCharm);
  }
  
  // 检查套装加成
  checkSetBonus(outfit: any, accessories: any[]): boolean {
    const setBonuses = {
      'bunny_costume': ['bunny_ears', 'bunny_tail'],
      'maid_outfit': ['cat_ears', 'choker'],
      'goddess_robe': ['halo', 'angel_wings'],
      'leather_suit': ['devil_horns', 'choker']
    };
    
    const requiredAccessories = setBonuses[outfit?.id];
    if (!requiredAccessories) return false;
    
    const accessoryIds = accessories.map(a => a.id);
    return requiredAccessories.every(id => accessoryIds.includes(id));
  }
  
  // 获取魅力等级
  getCharmTier(score: number): string {
    if (score >= 251) return 'KING';
    if (score >= 201) return 'SSSR';
    if (score >= 151) return 'SSS';
    if (score >= 101) return 'SS';
    if (score >= 100) return 'S';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
  }
  
  // 获取等级颜色
  getTierColor(tier: string): string {
    const colors = {
      'KING': 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
      'SSSR': '#ff0000',
      'SSS': '#ff4500',
      'SS': '#ff6347',
      'S': '#ff4d4f',
      'A': '#fa8c16',
      'B': '#fadb14',
      'C': '#52c41a',
      'D': '#8c8c8c'
    };
    return colors[tier] || '#8c8c8c';
  }
}

// 头像自定义系统
export interface AvatarCustomization {
  companionId: string;
  customAvatarUrl: string;
  uploadedBy: string;
  uploadDate: Date;
  approved: boolean;                   // 需要审核
  moderationStatus: 'pending' | 'approved' | 'rejected';
  weeklyRankingWeek: number;          // 获得权限的周数
  usageCount: number;                 // 使用次数（限1次）
}

// 年度专属皮肤系统
export interface ExclusiveSkinSet {
  id: string;
  name: string;
  owner: string;
  year: number;
  components: {
    outfit: {
      design: string;                 // 自定义设计描述
      modelUrl: string;               // 3D模型
      textureUrl: string;             // 贴图
    };
    accessories: string[];            // 配套配饰
    effects: {
      particleEffect: string;         // 粒子特效
      auraEffect: string;            // 光环特效
      soundEffect: string;           // 音效
    };
    voicePack: {
      lines: string[];               // 专属语音台词
      voiceActorId: string;          // 配音演员
    };
  };
  exclusiveAbility: {
    name: string;
    description: string;
    effect: string;
  };
  displayPriority: 999;              // 最高显示优先级
  tradeable: false;                  // 不可交易
  destroyable: false;                // 不可销毁
}

// 装扮获取方式
export const OBTAIN_METHODS = {
  shop: {
    name: '商城购买',
    description: '使用智慧币在商城购买'
  },
  achievement: {
    name: '成就解锁',
    description: '完成特定成就后解锁'
  },
  daily_training: {
    name: '每日训练',
    description: '完成每日训练任务随机获得'
  },
  event: {
    name: '活动奖励',
    description: '参与限时活动获得'
  },
  ranking: {
    name: '排行榜奖励',
    description: '排行榜周冠军/年度冠军专属'
  },
  relationship: {
    name: '关系解锁',
    description: '陪伴关系达到指定等级'
  },
  arena: {
    name: '竞技场奖励',
    description: '竞技场胜利奖励'
  },
  gacha: {
    name: '扭蛋机',
    description: '使用扭蛋券随机获得'
  }
};

// 练习获取配置
export const PRACTICE_REWARDS = {
  daily: {
    hands_50: { reward: 'random_common_accessory', chance: 0.1 },
    hands_100: { reward: 'random_rare_accessory', chance: 0.05 },
    hands_200: { reward: 'accessory_selector', chance: 0.02 }
  },
  
  weekly: {
    wins_50: { reward: 'outfit_discount_50', guaranteed: true },
    wins_100: { reward: 'rare_outfit_selector', guaranteed: true },
    perfect_games_10: { reward: 'epic_accessory', guaranteed: true }
  },
  
  milestones: {
    total_hands_1000: { reward: 'special_outfit', guaranteed: true },
    total_hands_5000: { reward: 'legendary_accessory', guaranteed: true },
    total_hands_10000: { reward: 'mythical_outfit_fragment', guaranteed: true }
  }
};