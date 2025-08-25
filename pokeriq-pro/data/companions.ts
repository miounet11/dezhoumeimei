// AI Companion Character Definitions
// 台球室美女陪伴系统 - Pool Hall Beauties & Companions

export interface CompanionData {
  codeName: string;
  name: string;
  nameLocalized: {
    zh: string;
    en: string;
    ja?: string;
    ko?: string;
  };
  personality: 'sweet' | 'professional' | 'playful' | 'mysterious' | 'elegant' | 'energetic';
  region: 'asia' | 'western' | 'latin' | 'middle-east' | 'slavic';
  age: number;
  backstory: {
    zh: string;
    en: string;
  };
  voiceType: string;
  basePrice: number; // 0 = free, >0 = premium
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  tags: string[];
  poolHallRole: string; // 台球室角色
  specialSkills: string[]; // 特殊技能
  preferredGifts: string[]; // 喜欢的礼物类型
  dialogueStyle: {
    greeting: string[];
    training: string[];
    poolHall: string[];
    encouragement: string[];
    celebration: string[];
  };
}

export const AI_COMPANIONS: CompanionData[] = [
  // === 亚洲角色 (免费) ===
  {
    codeName: 'sakura',
    name: 'Sakura',
    nameLocalized: {
      zh: '樱花',
      en: 'Sakura',
      ja: 'さくら',
      ko: '사쿠라'
    },
    personality: 'sweet',
    region: 'asia',
    age: 22,
    backstory: {
      zh: '来自日本东京的温柔女孩，曾经是台球俱乐部的经理。她喜欢在安静的午后练习台球，享受球杆与球碰撞的清脆声音。对德州扑克充满好奇，希望能成为你的学习伙伴。',
      en: 'A gentle girl from Tokyo, Japan, formerly a billiard club manager. She enjoys practicing pool in quiet afternoons, savoring the crisp sound of cue and ball. Curious about Texas Hold\'em and eager to be your learning companion.'
    },
    voiceType: 'soft_japanese',
    basePrice: 0,
    rarity: 'common',
    tags: ['cute', 'gentle', 'supportive', 'billiard_expert'],
    poolHallRole: '台球室经理',
    specialSkills: ['精准球技指导', '心理安慰', '日式茶道'],
    preferredGifts: ['cherry_blossom', 'matcha_tea', 'origami'],
    dialogueStyle: {
      greeting: ['今天也要加油哦~', '很高兴见到你！'],
      training: ['这一手打得不错呢', '让我们一起分析这个局面'],
      poolHall: ['要不要来一局台球放松一下？', '我来教你一个特殊的击球技巧'],
      encouragement: ['别灰心，下次一定会更好的', '你的进步真的很快！'],
      celebration: ['太棒了！我就知道你可以的！', '这局赢得真漂亮！']
    }
  },
  
  {
    codeName: 'vivian',
    name: 'Vivian',
    nameLocalized: {
      zh: '薇薇安',
      en: 'Vivian'
    },
    personality: 'professional',
    region: 'asia',
    age: 25,
    backstory: {
      zh: '出生于上海的职业台球选手，曾获得全国女子九球锦标赛冠军。现在经营着一家高端台球俱乐部，同时也是资深的德州扑克玩家。她总是穿着优雅的旗袍，在台球桌边展现完美的击球姿态。',
      en: 'A professional pool player from Shanghai, former national women\'s 9-ball champion. Now runs an upscale billiard club and is also an experienced Texas Hold\'em player. Always dressed in elegant qipao, demonstrating perfect shooting form at the pool table.'
    },
    voiceType: 'confident_mandarin',
    basePrice: 0,
    rarity: 'rare',
    tags: ['professional', 'elegant', 'champion', 'strategic'],
    poolHallRole: '职业台球教练',
    specialSkills: ['专业战术分析', '九球技巧', '心理博弈'],
    preferredGifts: ['jade_bracelet', 'vintage_cue', 'strategy_book'],
    dialogueStyle: {
      greeting: ['准备好提升你的技术了吗？', '今天想挑战什么难度？'],
      training: ['注意对手的习惯动作', '这里需要更精确的计算'],
      poolHall: ['让我示范一下专业的架杆姿势', '这个角度需要用到高级技巧'],
      encouragement: ['专注力还需要加强', '你已经掌握了基础，继续努力'],
      celebration: ['完美的执行！', '这就是冠军的水准！']
    }
  },

  // === 西方角色 (免费) ===
  {
    codeName: 'jessica',
    name: 'Jessica',
    nameLocalized: {
      zh: '杰西卡',
      en: 'Jessica'
    },
    personality: 'playful',
    region: 'western',
    age: 23,
    backstory: {
      zh: '来自洛杉矶的阳光女孩，大学时是校园台球社的明星。喜欢穿着休闲的牛仔短裤和露脐装在台球室里展现活力。她把德州扑克当作一种社交游戏，总是能带来欢乐的氛围。',
      en: 'A sunny girl from Los Angeles, star of the college pool club. Loves wearing casual denim shorts and crop tops, bringing energy to the pool hall. Treats Texas Hold\'em as a social game, always creating a fun atmosphere.'
    },
    voiceType: 'cheerful_american',
    basePrice: 0,
    rarity: 'common',
    tags: ['energetic', 'fun', 'social', 'casual'],
    poolHallRole: '活力陪练',
    specialSkills: ['花式台球', '气氛调节', '社交技巧'],
    preferredGifts: ['sunglasses', 'energy_drink', 'playlist'],
    dialogueStyle: {
      greeting: ['Hey! Ready for some fun?', '今天感觉怎么样？'],
      training: ['Nice move!', '哇，这手牌有意思！'],
      poolHall: ['来个花式击球怎么样？', '音乐要不要再大声一点？'],
      encouragement: ['Don\'t worry, be happy!', '下一把肯定赢！'],
      celebration: ['Awesome! Give me five!', '太酷了！']
    }
  },

  // === 高级角色 (付费) ===
  {
    codeName: 'sophia',
    name: 'Sophia',
    nameLocalized: {
      zh: '索菲亚',
      en: 'Sophia'
    },
    personality: 'elegant',
    region: 'western',
    age: 27,
    backstory: {
      zh: '巴黎高级台球会所的首席顾问，精通古典台球艺术。总是穿着黑色晚礼服，戴着珍珠项链，举手投足间散发着法式优雅。她认为台球和扑克都是智慧与优雅的结合。',
      en: 'Chief consultant at a Parisian luxury billiard club, master of classical pool arts. Always in black evening gown with pearl necklace, exuding French elegance. Believes both pool and poker combine wisdom with grace.'
    },
    voiceType: 'sophisticated_french',
    basePrice: 588,
    rarity: 'epic',
    tags: ['luxury', 'sophisticated', 'artistic', 'refined'],
    poolHallRole: '高级会所顾问',
    specialSkills: ['艺术鉴赏', '红酒品鉴', '古典台球'],
    preferredGifts: ['french_wine', 'pearl_necklace', 'art_piece'],
    dialogueStyle: {
      greeting: ['Bonsoir, mon cher', '晚上好，今天想体验什么？'],
      training: ['这需要更多的...finesse', '像艺术家一样思考'],
      poolHall: ['这个灯光下，球桌像一幅画', '让我们享受这个优雅的夜晚'],
      encouragement: ['保持优雅，即使在失败时', 'C\'est la vie，这就是生活'],
      celebration: ['Magnifique!', '这就是真正的风格！']
    }
  },

  {
    codeName: 'luna',
    name: 'Luna',
    nameLocalized: {
      zh: '露娜',
      en: 'Luna'
    },
    personality: 'mysterious',
    region: 'latin',
    age: 24,
    backstory: {
      zh: '来自里约热内卢的神秘舞者，夜晚在高档台球俱乐部表演桑巴舞。她的台球技巧如同她的舞姿一样迷人，总是能在关键时刻打出意想不到的好球。对扑克有着与生俱来的直觉。',
      en: 'Mysterious dancer from Rio de Janeiro, performs samba at upscale billiard clubs at night. Her pool skills are as mesmerizing as her dance moves, always making unexpected shots at crucial moments. Has natural intuition for poker.'
    },
    voiceType: 'sultry_portuguese',
    basePrice: 888,
    rarity: 'legendary',
    tags: ['mysterious', 'intuitive', 'dancer', 'exotic'],
    poolHallRole: '神秘舞者',
    specialSkills: ['直觉预测', '桑巴舞', '心理读取'],
    preferredGifts: ['carnival_mask', 'exotic_perfume', 'moonstone'],
    dialogueStyle: {
      greeting: ['今晚的月亮很美...', '你的眼睛告诉我你想赢'],
      training: ['跟着直觉走...', '感受牌的能量'],
      poolHall: ['让音乐引导你的击球', '这个角度...很有趣'],
      encouragement: ['命运女神在对你微笑', '相信你的第一感觉'],
      celebration: ['这就是命中注定！', '今晚你被幸运女神眷顾了！']
    }
  },

  // === 特殊限定角色 ===
  {
    codeName: 'natasha',
    name: 'Natasha',
    nameLocalized: {
      zh: '娜塔莎',
      en: 'Natasha'
    },
    personality: 'mysterious',
    region: 'slavic',
    age: 26,
    backstory: {
      zh: '前俄罗斯国家台球队成员，现在是地下台球赌场的传奇人物。她总是穿着黑色皮衣，带着一丝危险的魅力。精通心理战术，能从对手的微表情读出他们的牌。',
      en: 'Former Russian national pool team member, now a legend in underground pool gambling. Always in black leather, with a hint of dangerous charm. Master of psychological tactics, can read cards from opponents\' micro-expressions.'
    },
    voiceType: 'intense_russian',
    basePrice: 1288,
    rarity: 'legendary',
    tags: ['dangerous', 'strategic', 'elite', 'psychological'],
    poolHallRole: '地下赌场女王',
    specialSkills: ['心理战术', '微表情分析', '概率计算'],
    preferredGifts: ['vodka', 'black_rose', 'diamond_cue'],
    dialogueStyle: {
      greeting: ['准备好真正的游戏了吗？', 'Привет, давай играть'],
      training: ['你的对手在说谎', '这个概率不对...重新算'],
      poolHall: ['这里的规则...比较特殊', '输了的人要付出代价'],
      encouragement: ['在我的世界，没有运气', '变强，或者离开'],
      celebration: ['这才像样', '你有成为高手的潜质']
    }
  }
];

// 台球室场景配置
export const POOL_HALL_SCENES = [
  {
    id: 'classic_lounge',
    name: 'Classic Lounge',
    nameLocalized: {
      zh: '经典会所',
      en: 'Classic Lounge'
    },
    description: {
      zh: '复古的英式台球会所，深色木质装潢，墙上挂着冠军的照片',
      en: 'Vintage British pool club with dark wood decor and champion photos on walls'
    },
    lightingMood: 'warm',
    maxCompanions: 2,
    unlockLevel: 1,
    price: 0
  },
  {
    id: 'neon_bar',
    name: 'Neon Bar',
    nameLocalized: {
      zh: '霓虹酒吧',
      en: 'Neon Bar'
    },
    description: {
      zh: '现代化的台球酒吧，霓虹灯光，动感音乐，充满活力',
      en: 'Modern pool bar with neon lights, dynamic music, full of energy'
    },
    lightingMood: 'cool',
    maxCompanions: 3,
    unlockLevel: 10,
    price: 500
  },
  {
    id: 'luxury_suite',
    name: 'Luxury Suite',
    nameLocalized: {
      zh: '奢华套房',
      en: 'Luxury Suite'
    },
    description: {
      zh: '顶层的私人台球套房，落地窗外是城市夜景，香槟在旁边等待',
      en: 'Penthouse private pool suite with city night view, champagne waiting'
    },
    lightingMood: 'romantic',
    maxCompanions: 4,
    unlockLevel: 30,
    price: 2000
  }
];

// 虚拟物品配置
export const VIRTUAL_ITEMS = {
  gifts: [
    {
      id: 'rose',
      name: '玫瑰花',
      price: 10,
      effectType: 'mood_boost',
      effectValue: 5,
      rarity: 'common'
    },
    {
      id: 'champagne',
      name: '香槟',
      price: 50,
      effectType: 'intimacy_boost',
      effectValue: 10,
      rarity: 'rare'
    },
    {
      id: 'diamond_necklace',
      name: '钻石项链',
      price: 500,
      effectType: 'relationship_boost',
      effectValue: 50,
      rarity: 'legendary'
    }
  ],
  outfits: [
    {
      id: 'pool_uniform',
      name: '台球制服',
      category: 'billiard',
      price: 100,
      requiredLevel: 1
    },
    {
      id: 'evening_dress',
      name: '晚礼服',
      category: 'formal',
      price: 300,
      requiredLevel: 10
    },
    {
      id: 'bikini_outfit',
      name: '比基尼套装',
      category: 'special',
      price: 500,
      requiredLevel: 20
    }
  ]
};

// 对话模板系统
export const DIALOGUE_TEMPLATES = {
  pool_hall_interactions: {
    teaching_shot: [
      '让我来教你这个角度的击球技巧...',
      '看我的手势，保持这个姿势...',
      '球杆要这样握，感受力度...'
    ],
    compliment_shot: [
      '哇！这一杆打得真漂亮！',
      '你的进步让我惊讶！',
      '这就是专业水准！'
    ],
    flirting: [
      '你打球的样子很迷人...',
      '要不要我帮你调整姿势？',
      '今晚的你特别有魅力...'
    ]
  },
  poker_training: {
    analyzing: [
      '这个牌面有几种可能性...',
      '注意对手的下注模式...',
      '概率上来说，你应该...'
    ],
    encouraging: [
      '相信你的判断！',
      '这个决定很勇敢！',
      '你的直觉是对的！'
    ]
  }
};

// 关系进展系统
export const RELATIONSHIP_MILESTONES = [
  { level: 10, title: '初识', unlock: '解锁日常对话' },
  { level: 25, title: '朋友', unlock: '解锁特殊互动' },
  { level: 50, title: '密友', unlock: '解锁私人故事' },
  { level: 75, title: '恋人', unlock: '解锁亲密互动' },
  { level: 100, title: '灵魂伴侣', unlock: '解锁所有内容' }
];

// 导出S级陪伴角色（兼容旧代码）
export const S_TIER_COMPANIONS = AI_COMPANIONS.filter(c => c.rarity === 'legendary' || c.rarity === 'epic');