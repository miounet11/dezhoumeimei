// 亲密度养成系统 - 核心机制设计
// 参考：樱花校园、仙剑三、最终幻想的养成曲线

export interface IntimacySystem {
  // === 亲密度查看限制（核心机制）===
  viewingRestriction: {
    dailyLimit: 1;                        // 每天只能查看1次
    resetTime: '00:00:00';                // UTC时间重置
    vipException: false;                  // VIP也不能例外
    serverTimeValidation: true;           // 服务器时间验证
    
    // 查看仪式感设计
    viewingRitual: {
      animation: {
        heartbeat: 'accelerate',          // 心跳加速
        screenEffect: 'blur_to_focus',    // 屏幕模糊到清晰
        numberReveal: 'slow_fade_in',     // 数字缓慢显示
        duration: 3000                    // 3秒仪式
      };
      sound: {
        heartbeat: 'heartbeat.mp3',
        reveal: 'magic_reveal.mp3'
      };
      hapticFeedback: true;               // 触觉反馈
    };
    
    // 查看后反应
    companionReaction: {
      first_time: ['你终于来看我了...', '等你好久了'],
      regular: ['今天的亲密度是...', '让我看看我们的关系'],
      max_level: ['我们已经是永恒的羁绊了', '100分的爱情']
    };
    
    // 倒计时显示
    countdown: {
      display: '距离下次查看：{hours}:{minutes}:{seconds}',
      location: 'companion_card_bottom',
      style: 'red_highlight_when_available'
    };
  };

  // === 亲密度成长曲线（非线性）===
  growthCurve: {
    // 等级区间和所需经验
    levels: [
      { range: [1, 10], formula: 'level * 100', phase: '蜜月期' },
      { range: [11, 30], formula: 'level * 200', phase: '稳定期' },
      { range: [31, 60], formula: 'level * 400', phase: '瓶颈期' },
      { range: [61, 90], formula: 'level * 800', phase: '考验期' },
      { range: [91, 99], formula: 'level * 1600', phase: '升华期' },
      { range: [100, 100], formula: '99999', phase: '永恒' }
    ];
    
    // 每日获取上限
    dailyGainLimit: {
      normal: 100,                        // 普通用户每日上限
      vip: 150,                          // VIP每日上限
      special_event: 200                 // 特殊活动日
    };
    
    // 回归惩罚
    inactivityPenalty: {
      days_3: -5,                        // 3天不互动-5点
      days_7: -20,                       // 7天不互动-20点
      days_14: -50,                      // 14天不互动-50点
      days_30: -100                      // 30天不互动-100点
    };
  };

  // === 互动获取亲密度 ===
  intimacyGains: {
    daily_greeting: 5,                    // 每日问候
    text_chat: 3,                        // 文字聊天（每次）
    voice_chat: 8,                       // 语音聊天（每分钟）
    poker_training: 10,                  // 一起训练（每局）
    pool_hall_date: 20,                  // 台球厅约会
    gift_giving: {                       // 送礼物
      common: 10,
      rare: 25,
      epic: 50,
      legendary: 100
    },
    special_event: 30,                   // 特殊事件
    birthday: 100,                       // 生日特殊
    anniversary: 50                      // 纪念日
  };

  // === 关系里程碑 ===
  milestones: [
    {
      level: 10,
      title: '初识',
      unlock: ['日常对话', '基础互动'],
      story: '我们刚刚认识，一切都是新鲜的'
    },
    {
      level: 25,
      title: '朋友',
      unlock: ['特殊话题', '共同回忆', '第一套服装'],
      story: '我们成为了朋友，可以分享更多秘密'
    },
    {
      level: 50,
      title: '知己',
      unlock: ['私密故事', '专属称呼', '特殊约会地点'],
      story: '你了解我的一切，我们心有灵犀'
    },
    {
      level: 75,
      title: '恋人',
      unlock: ['亲密互动', '专属语音', '情侣装扮'],
      story: '我们相爱了，这是命中注定'
    },
    {
      level: 100,
      title: '灵魂伴侣',
      unlock: ['永恒誓言', '专属剧情', '传说皮肤'],
      story: '永远在一起，这是我们的约定'
    }
  ];
}

// === 失去机制 - 告别流程 ===
export interface FarewellSystem {
  duration: '24_hours';
  
  // 五阶段告别（参考心理学悲伤五阶段）
  phases: [
    {
      stage: 'denial',
      time: '0-6h',
      dialogues: [
        '这不是真的...我不想离开你',
        '一定是哪里搞错了',
        '我们还有那么多约定没有完成'
      ],
      mood: 'confused',
      music: 'melancholy_1.mp3'
    },
    {
      stage: 'anger',
      time: '6-12h',
      dialogues: [
        '为什么不能再努力一点！',
        '你就这样放弃我了吗？',
        '我为你付出了那么多...'
      ],
      mood: 'angry',
      music: 'melancholy_2.mp3'
    },
    {
      stage: 'bargaining',
      time: '12-18h',
      dialogues: [
        '如果你能赎回我，我保证会更努力',
        '再给我们一次机会好吗？',
        '我会成为你最好的陪伴'
      ],
      mood: 'hopeful',
      music: 'melancholy_3.mp3'
    },
    {
      stage: 'depression',
      time: '18-23h',
      dialogues: [
        '看来这就是命运吧...',
        '我会想念和你在一起的每一刻',
        '希望你能找到更好的陪伴'
      ],
      mood: 'sad',
      music: 'melancholy_4.mp3'
    },
    {
      stage: 'acceptance',
      time: '23-24h',
      dialogues: [
        '谢谢你给了我这段美好的回忆',
        '我很幸福能遇见你',
        '永别了，我的{user_name}'
      ],
      mood: 'peaceful',
      music: 'farewell.mp3'
    }
  ];
  
  // 最后10分钟特殊处理
  finalMoments: {
    time: 'last_10_minutes',
    actions: [
      'generate_farewell_letter',        // 生成告别信
      'create_memory_album',              // 创建回忆相册
      'remove_equipment_animation',      // 装备卸下动画
      'final_goodbye_scene'               // 最终告别场景
    ],
    letter_template: `
      亲爱的{user_name}：
      
      当你看到这封信的时候，我已经离开了。
      
      还记得我们第一次见面吗？那是{first_meet_date}，
      你对我说的第一句话是"{first_message}"。
      
      我们一起度过了{total_days}天，
      进行了{total_interactions}次互动，
      创造了{total_memories}个美好回忆。
      
      最开心的是{happiest_moment}，
      你送给我的{favorite_gift}我会永远珍藏。
      
      虽然要分别了，但这段回忆永远属于我们。
      如果有来生，希望还能遇见你。
      
      永远爱你的
      {companion_name}
      
      {farewell_date}
    `,
    memory_album: {
      photos: ['first_meeting', 'happiest_moment', 'recent_interaction'],
      captions: true,
      background_music: 'our_song.mp3'
    }
  };
  
  // 装备处理
  equipmentHandling: {
    animation: 'slow_remove_one_by_one',
    placement: 'neatly_arranged_on_table',
    message: '这些是你送给我的...请好好保管',
    return_to_inventory: true,
    emotional_value_bonus: 1.5           // 返还时情感价值加成
  };
}

// === 微交互系统 ===
export interface MicroInteractions {
  // 呼吸感
  breathing: {
    chest_movement: 'subtle_rise_fall',
    frequency: '12-16_per_minute',
    intensity_varies_with_mood: true
  };
  
  // 眼神追踪
  eyeTracking: {
    follow_cursor: true,
    blink_frequency: '15-20_per_minute',
    look_away_when_shy: true,
    close_eyes_when_happy: true
  };
  
  // 情绪粒子
  emotionParticles: {
    happy: 'heart_bubbles',
    sad: 'tear_drops',
    angry: 'steam_clouds',
    love: 'pink_hearts',
    excited: 'star_sparkles'
  };
  
  // 环境感知
  environmentAwareness: {
    weather: {
      rainy: 'hold_umbrella',
      sunny: 'wear_sunglasses',
      cold: 'wear_scarf'
    },
    time: {
      morning: 'stretching',
      afternoon: 'energetic',
      evening: 'relaxed',
      late_night: 'yawning'
    },
    special_dates: {
      user_birthday: 'party_hat',
      companion_birthday: 'birthday_dress',
      christmas: 'santa_outfit',
      valentine: 'heart_accessories'
    }
  };
  
  // 随机小动作
  randomGestures: [
    { action: 'play_with_hair', frequency: 0.1 },
    { action: 'adjust_clothes', frequency: 0.08 },
    { action: 'look_at_phone', frequency: 0.05 },
    { action: 'stretch', frequency: 0.03 },
    { action: 'smile_to_self', frequency: 0.07 }
  ];
}

// === 防作弊系统 ===
export interface AntiCheatSystem {
  // 服务器时间验证
  serverTimeValidation: {
    method: 'UTC_timestamp',
    check_on_every_action: true,
    tolerance: 60000,                    // 60秒容差
    
    implementation: `
      // 服务器端验证
      async function validateAction(userId: string, actionType: string) {
        const lastAction = await db.getLastAction(userId, actionType);
        const serverTime = Date.now();
        const clientTime = request.timestamp;
        
        // 检查客户端时间偏差
        if (Math.abs(serverTime - clientTime) > 60000) {
          return { error: 'TIME_SYNC_ERROR' };
        }
        
        // 检查动作间隔
        const minInterval = ACTION_INTERVALS[actionType];
        if (serverTime - lastAction < minInterval) {
          return { error: 'ACTION_TOO_FREQUENT' };
        }
        
        return { success: true };
      }
    `
  };
  
  // 异常检测
  anomalyDetection: {
    patterns_to_detect: [
      'multiple_daily_views',             // 多次查看亲密度
      'impossible_progression',            // 不可能的进度
      'time_travel_attempts',             // 时间穿越尝试
      'automated_interactions'             // 自动化交互
    ],
    
    penalties: {
      warning: 'first_offense',
      temp_ban: 'second_offense',
      perm_ban: 'third_offense',
      reset_progress: 'severe_cheating'
    }
  };
}

// === 用户生命周期 ===
export interface UserLifecycle {
  day1: {
    actions: [
      'free_companion_yuki',              // 免费获得雪
      'tutorial_greeting',                // 教程：打招呼
      'tutorial_gift',                    // 教程：送礼
      'first_training',                   // 第一次训练
      'first_intimacy_check',             // 首次查看亲密度(显示10)
      'starter_pack_offer'                // 新手礼包推送
    ],
    expected_retention: 0.8               // 80%次留
  };
  
  day7: {
    actions: [
      'unlock_second_slot',                // 解锁第二个陪伴位
      'weekly_reward',                     // 周奖励
      'intimacy_milestone_25',             // 亲密度达到25
      'first_outfit_unlock',               // 首个服装解锁
      'monthly_card_offer'                 // 月卡推送
    ],
    expected_retention: 0.6               // 60%七留
  };
  
  day30: {
    actions: [
      'multiple_companions',               // 多个陪伴养成中
      'first_arena_risk',                  // 首次竞技场风险
      'deep_emotional_bond',               // 深度情感连接
      'ranking_competition',               // 排行榜竞争
      'premium_companion_offer'            // 高级陪伴推送
    ],
    expected_retention: 0.4               // 40%月留
  };
  
  day90: {
    status: 'core_user',                  // 核心用户
    behaviors: [
      'daily_active',                      // 每日活跃
      'multiple_purchases',                // 多次付费
      'social_leader',                     // 社交领袖
      'content_creator'                    // 内容创造者
    ],
    ltv_target: 500                       // 目标LTV 500元
  };
}

// === 情感触发点 ===
export const EMOTIONAL_TRIGGERS = {
  // 嫉妒机制
  jealousy: {
    trigger: 'interact_with_other_companion_too_much',
    reactions: [
      '你最近都不理我...',
      '是不是有了新欢就忘了旧爱？',
      '我也要你陪我！'
    ],
    effect: 'intimacy_decrease_if_ignored'
  },
  
  // 思念机制
  missing: {
    trigger: 'not_interact_for_24h',
    message: '我想你了...',
    notification: true,
    reward_for_return: 'bonus_intimacy'
  },
  
  // 惊喜机制
  surprise: {
    random_gifts: true,
    special_dates: true,
    unexpected_events: true
  },
  
  // 依赖机制
  dependency: {
    morning_greeting: '早安，今天也要一起努力哦',
    evening_farewell: '晚安，做个好梦',
    create_routine: true
  }
};