import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');

  // Create all AI companions with full data
  const companions = [
    // 免费角色
    {
      codeName: 'sakura',
      name: 'Sakura',
      nameLocalized: { zh: '樱花', en: 'Sakura', ja: 'さくら' },
      personality: 'sweet',
      backstory: {
        zh: '来自日本东京的温柔女孩，曾经是台球俱乐部的经理。她喜欢在安静的午后练习台球，享受球杆与球碰撞的清脆声音。',
        en: 'A gentle girl from Tokyo, Japan, formerly a billiard club manager.'
      },
      region: 'asia',
      voiceType: 'soft_japanese',
      basePrice: 0,
      rarity: 'common',
      tags: JSON.stringify(['cute', 'gentle', 'supportive', 'billiard_expert']),
    },
    {
      codeName: 'vivian',
      name: 'Vivian',
      nameLocalized: { zh: '薇薇安', en: 'Vivian' },
      personality: 'professional',
      backstory: {
        zh: '出生于上海的职业台球选手，曾获得全国女子九球锦标赛冠军。现在经营着一家高端台球俱乐部。',
        en: 'A professional pool player from Shanghai, former national women\'s 9-ball champion.'
      },
      region: 'asia',
      voiceType: 'confident_mandarin',
      basePrice: 0,
      rarity: 'rare',
      tags: JSON.stringify(['professional', 'elegant', 'champion', 'strategic']),
    },
    {
      codeName: 'jessica',
      name: 'Jessica',
      nameLocalized: { zh: '杰西卡', en: 'Jessica' },
      personality: 'playful',
      backstory: {
        zh: '来自洛杉矶的阳光女孩，大学时是校园台球社的明星。喜欢穿着休闲的牛仔短裤和露脐装在台球室里展现活力。',
        en: 'A sunny girl from Los Angeles, star of the college pool club.'
      },
      region: 'western',
      voiceType: 'cheerful_american',
      basePrice: 0,
      rarity: 'common',
      tags: JSON.stringify(['energetic', 'fun', 'social', 'casual']),
    },
    // 付费角色
    {
      codeName: 'sophia',
      name: 'Sophia',
      nameLocalized: { zh: '索菲亚', en: 'Sophia' },
      personality: 'elegant',
      backstory: {
        zh: '巴黎高级台球会所的首席顾问，精通古典台球艺术。总是穿着黑色晚礼服，戴着珍珠项链。',
        en: 'Chief consultant at a Parisian luxury billiard club, master of classical pool arts.'
      },
      region: 'western',
      voiceType: 'sophisticated_french',
      basePrice: 588,
      rarity: 'epic',
      tags: JSON.stringify(['luxury', 'sophisticated', 'artistic', 'refined']),
    },
    {
      codeName: 'luna',
      name: 'Luna',
      nameLocalized: { zh: '露娜', en: 'Luna' },
      personality: 'mysterious',
      backstory: {
        zh: '来自里约热内卢的神秘舞者，夜晚在高档台球俱乐部表演桑巴舞。她的台球技巧如同她的舞姿一样迷人。',
        en: 'Mysterious dancer from Rio de Janeiro, performs samba at upscale billiard clubs.'
      },
      region: 'latin',
      voiceType: 'sultry_portuguese',
      basePrice: 888,
      rarity: 'legendary',
      tags: JSON.stringify(['mysterious', 'intuitive', 'dancer', 'exotic']),
    },
    {
      codeName: 'natasha',
      name: 'Natasha',
      nameLocalized: { zh: '娜塔莎', en: 'Natasha' },
      personality: 'mysterious',
      backstory: {
        zh: '前俄罗斯国家台球队成员，现在是地下台球赌场的传奇人物。她总是穿着黑色皮衣，带着一丝危险的魅力。',
        en: 'Former Russian national pool team member, now a legend in underground pool gambling.'
      },
      region: 'slavic',
      voiceType: 'intense_russian',
      basePrice: 1288,
      rarity: 'legendary',
      tags: JSON.stringify(['dangerous', 'strategic', 'elite', 'psychological']),
    },
    // 隐藏角色
    {
      codeName: 'yuki',
      name: 'Yuki',
      nameLocalized: { zh: '雪', en: 'Yuki', ja: 'ゆき' },
      personality: 'sweet',
      backstory: {
        zh: '神秘的雪国公主，只在冬天出现。传说她的陪伴能带来好运。',
        en: 'Mysterious snow princess who only appears in winter. Legend says her companionship brings good luck.'
      },
      region: 'asia',
      voiceType: 'ethereal_japanese',
      basePrice: 2888,
      rarity: 'legendary',
      tags: JSON.stringify(['limited', 'mystical', 'lucky', 'seasonal']),
    },
    {
      codeName: 'aria',
      name: 'Aria',
      nameLocalized: { zh: '艾莉亚', en: 'Aria' },
      personality: 'energetic',
      backstory: {
        zh: '来自米兰的时尚设计师，将台球视为一种艺术表达。她的每一杆都像是在画布上作画。',
        en: 'Fashion designer from Milan who sees pool as artistic expression.'
      },
      region: 'western',
      voiceType: 'melodic_italian',
      basePrice: 688,
      rarity: 'epic',
      tags: JSON.stringify(['fashionable', 'artistic', 'creative', 'stylish']),
    },
  ];

  for (const companion of companions) {
    const created = await prisma.aICompanion.upsert({
      where: { codeName: companion.codeName },
      update: companion,
      create: companion
    });
    console.log(`Upserted companion: ${created.name}`);
  }

  // Create comprehensive dialogue templates for each companion
  const companionDialogues = [
    // Sakura dialogues
    { companionId: 'sakura', context: 'greeting', mood: 'happy', template: '欢迎回来！今天也要一起加油哦~', weight: 100 },
    { companionId: 'sakura', context: 'greeting', mood: 'neutral', template: '你来了，准备好今天的训练了吗？', weight: 80 },
    { companionId: 'sakura', context: 'win', mood: 'excited', template: '太棒了！我就知道你可以的！', weight: 100 },
    { companionId: 'sakura', context: 'loss', mood: 'sad', template: '没关系的，下次一定会更好...', weight: 90 },
    { companionId: 'sakura', context: 'advice', template: '这里可以试试更保守的打法呢', weight: 85 },
    { companionId: 'sakura', context: 'flirt', mood: 'happy', template: '和你在一起的时光总是过得很快呢...', weight: 70 },
    
    // Vivian dialogues  
    { companionId: 'vivian', context: 'greeting', mood: 'neutral', template: '准备好接受专业指导了吗？', weight: 100 },
    { companionId: 'vivian', context: 'win', mood: 'happy', template: '完美的执行，这就是冠军水准', weight: 95 },
    { companionId: 'vivian', context: 'loss', mood: 'neutral', template: '失败是成功之母，分析错误继续前进', weight: 85 },
    { companionId: 'vivian', context: 'advice', template: '从概率角度，这里应该fold', weight: 100 },
    
    // Jessica dialogues
    { companionId: 'jessica', context: 'greeting', mood: 'excited', template: 'Hey! Ready for some fun? Let\'s go!', weight: 100 },
    { companionId: 'jessica', context: 'win', mood: 'excited', template: 'Woohoo! That was awesome!', weight: 100 },
    { companionId: 'jessica', context: 'loss', mood: 'happy', template: 'No worries! Next one is ours!', weight: 90 },
    { companionId: 'jessica', context: 'flirt', mood: 'playful', template: 'You\'re pretty good at this... and cute too!', weight: 75 },
  ];

  // Get companion IDs first
  const companionMap = new Map();
  for (const companion of companions) {
    const found = await prisma.aICompanion.findFirst({
      where: { codeName: companion.codeName }
    });
    if (found) {
      companionMap.set(companion.codeName, found.id);
    }
  }

  // Create dialogues with actual companion IDs
  for (const dialogue of companionDialogues) {
    const companionId = companionMap.get(dialogue.companionId);
    if (companionId) {
      await prisma.dialogueTemplate.create({
        data: {
          ...dialogue,
          companionId
        }
      });
    }
  }

  // Create all virtual items
  const virtualItems = [
    // Gifts
    { itemType: 'gift', name: 'Rose', nameLocalized: { zh: '玫瑰花', en: 'Rose' }, description: { zh: '表达爱意', en: 'Express affection' }, category: 'flower', price: 10, effectType: 'mood_boost', effectValue: 5, isConsumable: true, rarity: 'common' },
    { itemType: 'gift', name: 'Champagne', nameLocalized: { zh: '香槟', en: 'Champagne' }, description: { zh: '庆祝时刻', en: 'Celebrate moments' }, category: 'drink', price: 50, effectType: 'intimacy_boost', effectValue: 10, isConsumable: true, rarity: 'rare' },
    { itemType: 'gift', name: 'Diamond Ring', nameLocalized: { zh: '钻戒', en: 'Diamond Ring' }, description: { zh: '永恒承诺', en: 'Eternal promise' }, category: 'jewelry', price: 999, effectType: 'relationship_boost', effectValue: 100, isConsumable: false, rarity: 'legendary' },
    { itemType: 'gift', name: 'Teddy Bear', nameLocalized: { zh: '泰迪熊', en: 'Teddy Bear' }, description: { zh: '温暖陪伴', en: 'Warm companion' }, category: 'toy', price: 30, effectType: 'mood_boost', effectValue: 8, isConsumable: false, rarity: 'common' },
    { itemType: 'gift', name: 'Perfume', nameLocalized: { zh: '香水', en: 'Perfume' }, description: { zh: '迷人香气', en: 'Enchanting fragrance' }, category: 'cosmetic', price: 88, effectType: 'charm_boost', effectValue: 15, isConsumable: true, rarity: 'rare' },
    
    // Decorations
    { itemType: 'decoration', name: 'Neon Lights', nameLocalized: { zh: '霓虹灯', en: 'Neon Lights' }, description: { zh: '炫酷装饰', en: 'Cool decoration' }, category: 'room', price: 200, effectType: 'atmosphere', effectValue: 20, isConsumable: false, rarity: 'rare' },
    { itemType: 'decoration', name: 'Crystal Chandelier', nameLocalized: { zh: '水晶吊灯', en: 'Crystal Chandelier' }, description: { zh: '奢华照明', en: 'Luxury lighting' }, category: 'room', price: 500, effectType: 'luxury', effectValue: 50, isConsumable: false, rarity: 'epic' },
    
    // Accessories
    { itemType: 'accessory', name: 'Lucky Charm', nameLocalized: { zh: '幸运符', en: 'Lucky Charm' }, description: { zh: '提升运气', en: 'Boost luck' }, category: 'charm', price: 100, effectType: 'luck_boost', effectValue: 10, isConsumable: false, rarity: 'rare' },
    { itemType: 'accessory', name: 'Golden Cue', nameLocalized: { zh: '金球杆', en: 'Golden Cue' }, description: { zh: '专业装备', en: 'Professional gear' }, category: 'equipment', price: 888, effectType: 'skill_boost', effectValue: 25, isConsumable: false, rarity: 'legendary' },
  ];

  // Skip if items already exist
  const existingItems = await prisma.virtualItem.count();
  if (existingItems === 0) {
    await prisma.virtualItem.createMany({
      data: virtualItems,
      skipDuplicates: true
    });
  }

  // Create pool hall scenes
  const scenes = [
    {
      name: 'Classic Lounge',
      nameLocalized: { zh: '经典会所', en: 'Classic Lounge' },
      description: { zh: '复古英式台球会所', en: 'Vintage British pool club' },
      backgroundUrl: '/backgrounds/classic-lounge.jpg',
      lightingMood: 'warm',
      maxCompanions: 2,
      unlockLevel: 1,
      price: 0,
    },
    {
      name: 'Neon Bar',
      nameLocalized: { zh: '霓虹酒吧', en: 'Neon Bar' },
      description: { zh: '现代台球酒吧', en: 'Modern pool bar' },
      backgroundUrl: '/backgrounds/neon-bar.jpg',
      lightingMood: 'cool',
      maxCompanions: 3,
      unlockLevel: 10,
      price: 500,
    },
    {
      name: 'Luxury Suite',
      nameLocalized: { zh: '奢华套房', en: 'Luxury Suite' },
      description: { zh: '顶层私人套房', en: 'Penthouse suite' },
      backgroundUrl: '/backgrounds/luxury-suite.jpg',
      lightingMood: 'romantic',
      maxCompanions: 4,
      unlockLevel: 30,
      price: 2000,
    },
    {
      name: 'Underground Den',
      nameLocalized: { zh: '地下赌场', en: 'Underground Den' },
      description: { zh: '神秘地下俱乐部', en: 'Mysterious underground club' },
      backgroundUrl: '/backgrounds/underground-den.jpg',
      lightingMood: 'dark',
      maxCompanions: 5,
      unlockLevel: 50,
      price: 5000,
    },
  ];

  // Skip if scenes already exist
  const existingScenes = await prisma.poolHallScene.count();
  if (existingScenes === 0) {
    await prisma.poolHallScene.createMany({
      data: scenes,
      skipDuplicates: true
    });
  }

  // Create comprehensive achievements
  const achievements = [
    // Beginner achievements
    { code: 'first_win', name: 'First Victory', description: 'Win your first game', category: 'MILESTONE', rarity: 'COMMON', icon: '🏆', requirement: { type: 'win', count: 1 }, reward: { xp: 100, coins: 50 } },
    { code: 'first_companion', name: 'First Companion', description: 'Unlock your first companion', category: 'SPECIAL', rarity: 'COMMON', icon: '💝', requirement: { type: 'companion', count: 1 }, reward: { xp: 150, coins: 100 } },
    { code: 'first_gift', name: 'Gift Giver', description: 'Send your first gift', category: 'SPECIAL', rarity: 'COMMON', icon: '🎁', requirement: { type: 'gift', count: 1 }, reward: { xp: 50 } },
    
    // Progress achievements
    { code: 'hand_100', name: 'Century', description: 'Play 100 hands', category: 'STATS', rarity: 'COMMON', icon: '💯', requirement: { type: 'hands', count: 100 }, reward: { xp: 200 } },
    { code: 'hand_1000', name: 'Grinder', description: 'Play 1000 hands', category: 'STATS', rarity: 'RARE', icon: '🎯', requirement: { type: 'hands', count: 1000 }, reward: { xp: 500, coins: 200 } },
    { code: 'hand_10000', name: 'Veteran', description: 'Play 10000 hands', category: 'STATS', rarity: 'EPIC', icon: '⭐', requirement: { type: 'hands', count: 10000 }, reward: { xp: 2000, coins: 1000 } },
    
    // Skill achievements
    { code: 'streak_5', name: 'Hot Streak', description: 'Win 5 games in a row', category: 'SPECIAL', rarity: 'RARE', icon: '🔥', requirement: { type: 'streak', count: 5 }, reward: { xp: 300 } },
    { code: 'streak_10', name: 'Unstoppable', description: 'Win 10 games in a row', category: 'SPECIAL', rarity: 'EPIC', icon: '💥', requirement: { type: 'streak', count: 10 }, reward: { xp: 800, coins: 500 } },
    { code: 'perfect_game', name: 'Perfection', description: 'Win without losing a single hand', category: 'SPECIAL', rarity: 'LEGENDARY', icon: '✨', requirement: { type: 'perfect', count: 1 }, reward: { xp: 1500, diamonds: 10 } },
    
    // Companion achievements
    { code: 'intimacy_50', name: 'Close Bond', description: 'Reach 50 intimacy with any companion', category: 'MILESTONE', rarity: 'RARE', icon: '💕', requirement: { type: 'intimacy', level: 50 }, reward: { xp: 500, item: 'rose_bouquet' } },
    { code: 'intimacy_100', name: 'Soulmate', description: 'Reach 100 intimacy with any companion', category: 'MILESTONE', rarity: 'LEGENDARY', icon: '💖', requirement: { type: 'intimacy', level: 100 }, reward: { xp: 2000, diamonds: 50 } },
    { code: 'companion_collector', name: 'Collector', description: 'Unlock 5 different companions', category: 'MILESTONE', rarity: 'EPIC', icon: '🏆', requirement: { type: 'companion_count', count: 5 }, reward: { xp: 1000, coins: 1000 } },
    
    // Economic achievements
    { code: 'rich_1k', name: 'Wealthy', description: 'Accumulate 1000 coins', category: 'STATS', rarity: 'COMMON', icon: '💰', requirement: { type: 'coins', amount: 1000 }, reward: { xp: 200 } },
    { code: 'rich_10k', name: 'Millionaire', description: 'Accumulate 10000 coins', category: 'STATS', rarity: 'RARE', icon: '💎', requirement: { type: 'coins', amount: 10000 }, reward: { xp: 1000 } },
    { code: 'big_win', name: 'Big Winner', description: 'Win 1000 coins in a single game', category: 'SPECIAL', rarity: 'EPIC', icon: '🎰', requirement: { type: 'single_win', amount: 1000 }, reward: { xp: 800 } },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: achievement,
      create: achievement
    });
  }

  console.log('✅ Production database seeded successfully!');
  console.log(`📊 Created:
    - ${companions.length} AI Companions
    - ${companionDialogues.length} Dialogue Templates  
    - ${virtualItems.length} Virtual Items
    - ${scenes.length} Pool Hall Scenes
    - ${achievements.length} Achievements
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });