'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Row, Col, Avatar, Tag, Progress, Input, Slider, Badge, Tooltip, Empty } from 'antd';
import {
  AudioOutlined,
  HeartOutlined,
  GiftOutlined,
  EnvironmentOutlined,
  CoffeeOutlined,
  MoonOutlined,
  FireOutlined,
  ThunderboltOutlined,
  StarOutlined,
  CrownOutlined,
  MessageOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  HomeOutlined,
  ShopOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';

interface TavernScene {
  id: string;
  name: string;
  nameLocalized: { zh: string; en: string };
  description: string;
  mood: 'warm' | 'cool' | 'romantic' | 'mysterious' | 'energetic';
  unlocked: boolean;
  price: number;
  maxCompanions: number;
  atmosphere: {
    lighting: string;
    music: string;
    decoration: string;
  };
  specialInteractions: string[];
}

interface InteractionOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  cost: number;
  cooldown: number;
  intimacyRequired: number;
  effects: {
    intimacy: number;
    mood: number;
    energy: number;
  };
  category: 'social' | 'romantic' | 'gaming' | 'special';
}

interface TavernInteractionSystemProps {
  companion: {
    id: string;
    name: string;
    nameLocalized: { zh: string };
    personality: string;
    level: number;
    intimacy: number;
    currentMood: string;
    energy: number;
  };
  userWisdomCoins: number;
  onInteractionComplete: (interaction: any) => void;
}

export const TavernInteractionSystem: React.FC<TavernInteractionSystemProps> = ({
  companion,
  userWisdomCoins,
  onInteractionComplete
}) => {
  const [currentScene, setCurrentScene] = useState<string>('classic_lounge');
  const [activeInteraction, setActiveInteraction] = useState<string | null>(null);
  const [dialogueHistory, setDialogueHistory] = useState<Array<{
    speaker: 'user' | 'companion';
    message: string;
    timestamp: Date;
    emotion?: string;
  }>>([]);
  const [currentDialogue, setCurrentDialogue] = useState<string>('');
  const [voiceMode, setVoiceMode] = useState<boolean>(false);
  const [ambientVolume, setAmbientVolume] = useState<number>(30);
  const [companionState, setCompanionState] = useState({
    position: { x: 50, y: 50 },
    animation: 'idle',
    facing: 'forward'
  });

  const chatInputRef = useRef<any>(null);

  // 酒馆场景配置
  const tavernScenes: TavernScene[] = [
    {
      id: 'classic_lounge',
      name: 'Classic Lounge',
      nameLocalized: { zh: '经典会所', en: 'Classic Lounge' },
      description: '温馨的英式酒吧，壁炉燃烧着，台球桌在一旁静候',
      mood: 'warm',
      unlocked: true,
      price: 0,
      maxCompanions: 2,
      atmosphere: {
        lighting: '温暖的黄色灯光',
        music: '轻柔的爵士乐',
        decoration: '木质装潢，古典风格'
      },
      specialInteractions: ['billiard_game', 'fireplace_chat', 'wine_tasting']
    },
    {
      id: 'neon_bar',
      name: 'Neon Bar',
      nameLocalized: { zh: '霓虹酒吧', en: 'Neon Bar' },
      description: '充满活力的现代酒吧，霓虹灯闪烁，音乐动感',
      mood: 'energetic',
      unlocked: true,
      price: 100,
      maxCompanions: 3,
      atmosphere: {
        lighting: '彩色霓虹灯',
        music: '电子舞曲',
        decoration: '现代科技风格'
      },
      specialInteractions: ['dance_floor', 'cocktail_mixing', 'karaoke']
    },
    {
      id: 'rooftop_garden',
      name: 'Rooftop Garden',
      nameLocalized: { zh: '天台花园', en: 'Rooftop Garden' },
      description: '城市天台的私密花园，星空下的浪漫空间',
      mood: 'romantic',
      unlocked: companion.intimacy >= 50,
      price: 300,
      maxCompanions: 1,
      atmosphere: {
        lighting: '月光和星光',
        music: '轻柔的钢琴曲',
        decoration: '花朵和藤蔓装饰'
      },
      specialInteractions: ['stargazing', 'flower_picking', 'moonlight_dance']
    },
    {
      id: 'mystic_chamber',
      name: 'Mystic Chamber',
      nameLocalized: { zh: '神秘密室', en: 'Mystic Chamber' },
      description: '神秘的魔法密室，蜡烛摇曳，充满魔法气息',
      mood: 'mysterious',
      unlocked: companion.intimacy >= 75,
      price: 500,
      maxCompanions: 1,
      atmosphere: {
        lighting: '蜡烛和魔法灯光',
        music: '神秘的咒语声',
        decoration: '魔法符文和水晶'
      },
      specialInteractions: ['fortune_telling', 'spell_casting', 'ancient_ritual']
    }
  ];

  // 交互选项配置
  const interactionOptions: InteractionOption[] = [
    {
      id: 'casual_chat',
      name: '随意聊天',
      icon: <MessageOutlined />,
      description: '轻松愉快的日常对话',
      cost: 0,
      cooldown: 0,
      intimacyRequired: 0,
      effects: { intimacy: 2, mood: 5, energy: -5 },
      category: 'social'
    },
    {
      id: 'deep_conversation',
      name: '深度交流',
      icon: <HeartOutlined />,
      description: '分享内心想法的深入对话',
      cost: 10,
      cooldown: 300, // 5分钟冷却
      intimacyRequired: 25,
      effects: { intimacy: 8, mood: 10, energy: -10 },
      category: 'romantic'
    },
    {
      id: 'gift_giving',
      name: '赠送礼物',
      icon: <GiftOutlined />,
      description: '为陪伴送上贴心的礼物',
      cost: 50,
      cooldown: 3600, // 1小时冷却
      intimacyRequired: 10,
      effects: { intimacy: 15, mood: 20, energy: 5 },
      category: 'romantic'
    },
    {
      id: 'billiard_game',
      name: '台球对战',
      icon: <PlayCircleOutlined />,
      description: '来一局台球比赛',
      cost: 20,
      cooldown: 600, // 10分钟冷却
      intimacyRequired: 15,
      effects: { intimacy: 5, mood: 15, energy: -20 },
      category: 'gaming'
    },
    {
      id: 'voice_chat',
      name: '语音通话',
      icon: <PhoneOutlined />,
      description: '听到陪伴温柔的声音',
      cost: 30,
      cooldown: 1800, // 30分钟冷却
      intimacyRequired: 35,
      effects: { intimacy: 12, mood: 25, energy: 0 },
      category: 'romantic'
    },
    {
      id: 'video_call',
      name: '视频通话',
      icon: <VideoCameraOutlined />,
      description: '面对面的亲密时光',
      cost: 100,
      cooldown: 7200, // 2小时冷却
      intimacyRequired: 60,
      effects: { intimacy: 25, mood: 30, energy: 10 },
      category: 'special'
    }
  ];

  const currentSceneData = tavernScenes.find(scene => scene.id === currentScene);

  // 对话系统
  const startInteraction = async (interactionId: string) => {
    const interaction = interactionOptions.find(opt => opt.id === interactionId);
    if (!interaction) return;

    if (interaction.cost > userWisdomCoins) {
      Modal.warning({
        title: '智慧币不足',
        content: `需要 ${interaction.cost} 💎，当前只有 ${userWisdomCoins} 💎`
      });
      return;
    }

    if (companion.intimacy < interaction.intimacyRequired) {
      Modal.warning({
        title: '亲密度不够',
        content: `需要亲密度 ${interaction.intimacyRequired}，当前只有 ${companion.intimacy}`
      });
      return;
    }

    setActiveInteraction(interactionId);
    
    // 添加系统消息
    const systemMessage = {
      speaker: 'companion' as const,
      message: getInteractionStartMessage(interactionId),
      timestamp: new Date(),
      emotion: 'happy'
    };
    setDialogueHistory(prev => [...prev, systemMessage]);

    // 模拟陪伴响应
    setTimeout(() => {
      const companionResponse = {
        speaker: 'companion' as const,
        message: getPersonalizedResponse(interactionId, companion.personality),
        timestamp: new Date(),
        emotion: getEmotionByInteraction(interactionId)
      };
      setDialogueHistory(prev => [...prev, companionResponse]);
    }, 1000);

    onInteractionComplete({
      type: interactionId,
      cost: interaction.cost,
      effects: interaction.effects
    });
  };

  const getInteractionStartMessage = (interactionId: string): string => {
    const messages: Record<string, string> = {
      casual_chat: `欢迎来到${currentSceneData?.nameLocalized.zh}！今天想聊什么呢？`,
      deep_conversation: '我很想更深入地了解你的想法...',
      gift_giving: '哇，你为我准备了什么惊喜吗？',
      billiard_game: '台球桌已经准备好了，来一局怎么样？',
      voice_chat: '听到你的声音真好...',
      video_call: '能看到你真是太好了！'
    };
    return messages[interactionId] || '让我们开始互动吧！';
  };

  const getPersonalizedResponse = (interactionId: string, personality: string): string => {
    const responses: Record<string, Record<string, string>> = {
      casual_chat: {
        sweet: '今天的天气真不错呢~ 你过得怎么样？',
        professional: '这里的环境很适合放松，我们可以谈谈你的训练计划。',
        playful: '哈哈，今天感觉特别有活力！有什么有趣的事情吗？',
        mysterious: '这个地方...有种特殊的氛围，你不觉得吗？',
        elegant: '在这样优雅的环境中，我们可以好好交流一下。'
      },
      deep_conversation: {
        sweet: '我一直想知道，什么时候你最快乐呢？',
        professional: '成功对每个人来说都有不同的定义，你的是什么？',
        playful: '告诉我一个只有你知道的小秘密吧~',
        mysterious: '有些时候，我觉得你的眼中有很多故事...',
        elegant: '真正的交流需要心与心的碰撞，不是吗？'
      }
    };
    return responses[interactionId]?.[personality] || '让我们继续聊下去吧！';
  };

  const getEmotionByInteraction = (interactionId: string): string => {
    const emotions: Record<string, string> = {
      casual_chat: 'happy',
      deep_conversation: 'thoughtful',
      gift_giving: 'excited',
      billiard_game: 'competitive',
      voice_chat: 'intimate',
      video_call: 'loving'
    };
    return emotions[interactionId] || 'neutral';
  };

  const sendMessage = () => {
    if (!currentDialogue.trim()) return;

    const userMessage = {
      speaker: 'user' as const,
      message: currentDialogue,
      timestamp: new Date()
    };
    setDialogueHistory(prev => [...prev, userMessage]);
    
    // 立即清空输入框以提供更好的用户体验
    const messageToProcess = currentDialogue;
    setCurrentDialogue('');

    // 添加"正在输入"指示器
    const typingIndicator = {
      speaker: 'companion' as const,
      message: '正在输入...',
      timestamp: new Date(),
      isTyping: true
    };
    setDialogueHistory(prev => [...prev, typingIndicator]);

    // 模拟更真实的陪伴回复延迟
    const replyDelay = Math.random() * 1000 + 1500; // 1.5-2.5秒随机延迟
    
    setTimeout(() => {
      // 移除"正在输入"指示器
      setDialogueHistory(prev => prev.filter(msg => !msg.isTyping));
      
      const companionReply = {
        speaker: 'companion' as const,
        message: generateEnhancedCompanionReply(messageToProcess),
        timestamp: new Date(),
        emotion: analyzeUserMessageEmotion(messageToProcess)
      };
      setDialogueHistory(prev => [...prev, companionReply]);
    }, replyDelay);
  };

  const generateEnhancedCompanionReply = (userMessage: string): string => {
    const keywords = userMessage.toLowerCase();
    const companion = selectedCompanion || { personality: 'professional' };
    const intimacyLevel = companion.intimacy || 50;
    
    // 基于关键词的智能回复系统
    if (keywords.includes('喜欢') || keywords.includes('爱')) {
      return intimacyLevel >= 70 
        ? '我也很喜欢和你在一起的时光，每一刻都让我感到幸福 💕' 
        : '真的吗？我也很喜欢这种感觉呢~ ❤️';
    } 
    
    if (keywords.includes('台球') || keywords.includes('扑克') || keywords.includes('游戏')) {
      return intimacyLevel >= 60 
        ? '想和你一起打牌是我最开心的事，要不要我教你一些我的独门技巧？🎯' 
        : '看来你很热爱这些游戏，要不要我教你一些高级技巧？';
    }
    
    if (keywords.includes('美') || keywords.includes('漂亮') || keywords.includes('可爱')) {
      return intimacyLevel >= 50 
        ? '谢谢你的夸奖～能让你开心是我最大的满足，你也很有魅力呢 😊✨' 
        : '谢谢你的夸奖，能让你开心我就很满足了~';
    }
    
    if (keywords.includes('累') || keywords.includes('疲倦') || keywords.includes('辛苦')) {
      return intimacyLevel >= 60 
        ? '看起来你很累呢，来我这里休息一下吧，我来陪陪你～☕' 
        : '辛苦了，要不要喝杯茶放松一下？';
    }
    
    if (keywords.includes('心情') || keywords.includes('感觉')) {
      if (keywords.includes('不好') || keywords.includes('难过') || keywords.includes('沮丧')) {
        return intimacyLevel >= 70 
          ? '我能感受到你的心情...让我陪在你身边，一切都会好起来的 💗' 
          : '心情不好吗？和我聊聊，也许会好一些~';
      } else {
        return '心情好的时候，连空气都显得格外清新呢！';
      }
    }
    
    // 基于性格的默认回复
    const personalityReplies = {
      professional: [
        '这是一个很有意思的话题，让我们深入讨论一下。',
        '你的观点很独特，我完全理解你的想法。',
        '从专业的角度来看，这确实值得我们仔细考虑。',
        '你总是能给我带来新的启发，继续说下去吧。'
      ],
      sweet: [
        '听你说话总是让我很开心呢～',
        '你真的很善解人意，我很感动。',
        '和你聊天的每一刻都很珍贵～',
        '你的话语像阳光一样温暖我的心。'
      ],
      playful: [
        '哈哈，你真的很有趣！还有什么好玩的事情吗？',
        '这样的对话让我感到很兴奋！',
        '你总能让气氛变得轻松愉快～',
        '我们真是越来越有默契了呢！'
      ],
      mysterious: [
        '有些事情...只有特别的人才能理解呢...',
        '你的眼中有我想了解的故事。',
        '这种感觉很特别，不是吗？',
        '在这个安静的空间里，我们可以分享更多秘密。'
      ]
    };
    
    const personality = companion.personality || 'professional';
    const replies = personalityReplies[personality] || personalityReplies.professional;
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    
    // 根据亲密度添加前缀
    if (intimacyLevel >= 80) {
      return `亲爱的，${randomReply}`;
    } else if (intimacyLevel >= 60) {
      return `${randomReply} 😊`;
    } else if (intimacyLevel >= 40) {
      return `${randomReply}`;
    } else {
      return randomReply;
    }
  };

  const analyzeUserMessageEmotion = (message: string): string => {
    const keywords = message.toLowerCase();
    
    if (keywords.includes('开心') || keywords.includes('高兴') || keywords.includes('快乐')) {
      return 'happy';
    }
    if (keywords.includes('难过') || keywords.includes('伤心') || keywords.includes('沮丧')) {
      return 'sad';
    }
    if (keywords.includes('生气') || keywords.includes('愤怒') || keywords.includes('气愤')) {
      return 'angry';
    }
    if (keywords.includes('惊讶') || keywords.includes('震惊') || keywords.includes('意外')) {
      return 'surprised';
    }
    if (keywords.includes('爱') || keywords.includes('喜欢') || keywords.includes('想念')) {
      return 'loving';
    }
    if (keywords.includes('紧张') || keywords.includes('担心') || keywords.includes('害怕')) {
      return 'nervous';
    }
    
    return 'engaged';
  };

  const generateCompanionReply = (userMessage: string): string => {
    // 简单的回复逻辑
    const keywords = userMessage.toLowerCase();
    if (keywords.includes('喜欢') || keywords.includes('爱')) {
      return '真的吗？我也很喜欢这种感觉呢~ ❤️';
    } else if (keywords.includes('台球') || keywords.includes('扑克')) {
      return '看来你很热爱这些游戏，要不要我教你一些高级技巧？';
    } else if (keywords.includes('美') || keywords.includes('漂亮')) {
      return '谢谢你的夸奖，能让你开心我就很满足了~';
    } else {
      const replies = [
        '听起来很有趣呢！',
        '我完全理解你的想法。',
        '这让我想起了一些往事...',
        '你总是能给我带来新的思考。',
        '继续说下去吧，我在认真听着。'
      ];
      return replies[Math.floor(Math.random() * replies.length)];
    }
  };

  // 场景氛围效果
  const getSceneStyle = (mood: string) => {
    const styles: Record<string, any> = {
      warm: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        filter: 'sepia(20%) saturate(120%)'
      },
      energetic: {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        filter: 'contrast(110%) brightness(110%)'
      },
      romantic: {
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        filter: 'sepia(10%) saturate(130%)'
      },
      mysterious: {
        background: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
        filter: 'contrast(130%) hue-rotate(240deg)'
      },
      cool: {
        background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
        filter: 'hue-rotate(180deg) saturate(120%)'
      }
    };
    return styles[mood] || styles.warm;
  };

  return (
    <div className="tavern-interaction-system">
      {/* 场景选择面板 */}
      <Card className="mb-6" title="酒馆环境">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {tavernScenes.map(scene => (
            <div
              key={scene.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                currentScene === scene.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : scene.unlocked 
                    ? 'border-gray-200 hover:border-blue-300' 
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => scene.unlocked && setCurrentScene(scene.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{scene.nameLocalized.zh}</h4>
                {!scene.unlocked && <Badge count="🔒" size="small" />}
                {scene.price > 0 && <Tag>💎{scene.price}</Tag>}
              </div>
              <p className="text-sm text-gray-600 mb-2">{scene.description}</p>
              <div className="flex items-center space-x-2 text-xs">
                <Tag size="small">{scene.atmosphere.lighting}</Tag>
                <Tag size="small">{scene.atmosphere.music}</Tag>
              </div>
            </div>
          ))}
        </div>
        
        {/* 环境音量控制 */}
        <div className="flex items-center space-x-4">
          <span className="text-sm">环境音量:</span>
          <Slider
            value={ambientVolume}
            onChange={setAmbientVolume}
            style={{ width: 200 }}
            tooltip={{ formatter: (value) => `${value}%` }}
          />
          <Button
            type={voiceMode ? 'primary' : 'default'}
            icon={<AudioOutlined />}
            onClick={() => setVoiceMode(!voiceMode)}
          >
            {voiceMode ? '关闭语音' : '开启语音'}
          </Button>
        </div>
      </Card>

      {/* 主要交互区域 */}
      <Row gutter={24}>
        {/* 左侧：场景展示 */}
        <Col span={12}>
          <Card className="scene-display-card" bodyStyle={{ padding: 0 }}>
            <div 
              className="relative w-full h-96 rounded-t-lg overflow-hidden"
              style={getSceneStyle(currentSceneData?.mood || 'warm')}
            >
              {/* 场景背景 */}
              <div className="absolute inset-0">
                <div className="w-full h-full flex items-center justify-center">
                  {/* 陪伴角色显示 */}
                  <div 
                    className="relative transition-all duration-500"
                    style={{
                      left: `${companionState.position.x - 50}%`,
                      top: `${companionState.position.y - 50}%`
                    }}
                  >
                    <Avatar 
                      size={120}
                      style={{ 
                        backgroundColor: '#722ed1',
                        boxShadow: '0 0 30px rgba(114, 46, 209, 0.5)'
                      }}
                    >
                      <span className="text-4xl">
                        {companion.nameLocalized.zh[0]}
                      </span>
                    </Avatar>
                    
                    {/* 情绪指示器 */}
                    <div className="absolute -top-2 -right-2">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm animate-pulse">
                        {companion.currentMood === 'happy' && '😊'}
                        {companion.currentMood === 'excited' && '😍'}
                        {companion.currentMood === 'thoughtful' && '🤔'}
                        {companion.currentMood === 'playful' && '😏'}
                      </div>
                    </div>

                    {/* 状态显示 */}
                    {activeInteraction && (
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                        <Tag color="purple" className="animate-bounce">
                          {interactionOptions.find(opt => opt.id === activeInteraction)?.name}
                        </Tag>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 场景信息覆层 */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{currentSceneData?.nameLocalized.zh}</h3>
                    <p className="text-sm opacity-75">{currentSceneData?.atmosphere.music}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">当前心情</div>
                    <Progress
                      percent={75}
                      strokeColor="#ff4d4f"
                      size="small"
                      showInfo={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 右侧：交互控制 */}
        <Col span={12}>
          {/* 交互选项 */}
          <Card title="互动选项" className="mb-4">
            <div className="grid grid-cols-2 gap-3">
              {interactionOptions
                .filter(opt => companion.intimacy >= opt.intimacyRequired)
                .map(option => (
                <Tooltip key={option.id} title={option.description}>
                  <Button
                    type={activeInteraction === option.id ? 'primary' : 'default'}
                    icon={option.icon}
                    disabled={option.cost > userWisdomCoins}
                    onClick={() => startInteraction(option.id)}
                    className="h-auto p-3 text-left"
                  >
                    <div>
                      <div className="font-semibold">{option.name}</div>
                      <div className="text-xs opacity-75">
                        {option.cost > 0 ? `💎${option.cost}` : '免费'}
                      </div>
                    </div>
                  </Button>
                </Tooltip>
              ))}
            </div>
            
            {/* 解锁提示 */}
            {interactionOptions.some(opt => companion.intimacy < opt.intimacyRequired) && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">🔒 更多互动待解锁:</div>
                <div className="space-x-2">
                  {interactionOptions
                    .filter(opt => companion.intimacy < opt.intimacyRequired)
                    .map(option => (
                    <Tag key={option.id} color="default">
                      {option.name} (需要亲密度 {option.intimacyRequired})
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* 对话区域 */}
          <Card title="对话交流" className="h-64">
            <div className="flex flex-col h-full">
              {/* 对话历史 */}
              <div className="flex-1 overflow-y-auto mb-3 space-y-2 max-h-32">
                {dialogueHistory.length > 0 ? dialogueHistory.slice(-6).map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs p-3 rounded-lg relative ${
                      msg.speaker === 'user' 
                        ? 'bg-blue-500 text-white rounded-br-sm' 
                        : msg.isTyping 
                          ? 'bg-gray-300 text-gray-700 animate-pulse'
                          : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                    } ${msg.isTyping ? 'animate-pulse' : ''}`}>
                      <div className="text-sm">{msg.message}</div>
                      {msg.emotion && !msg.isTyping && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-xs">
                              {msg.emotion === 'happy' && '😊'}
                              {msg.emotion === 'excited' && '😍'}
                              {msg.emotion === 'thoughtful' && '🤔'}
                              {msg.emotion === 'playful' && '😏'}
                              {msg.emotion === 'loving' && '💕'}
                              {msg.emotion === 'sad' && '😢'}
                              {msg.emotion === 'surprised' && '😲'}
                              {msg.emotion === 'engaged' && '👂'}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="text-xs opacity-75 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div className="text-center">
                        <div className="text-gray-500 mb-2">开始一段对话吧！</div>
                        <div className="text-xs text-gray-400">
                          💡 试试说："你好"、"今天心情怎样"、"教我打牌"等
                        </div>
                      </div>
                    }
                    className="my-4"
                  />
                )}
              </div>

              {/* 输入区域 */}
              <div className="flex space-x-2">
                <Input
                  ref={chatInputRef}
                  value={currentDialogue}
                  onChange={(e) => setCurrentDialogue(e.target.value)}
                  placeholder={`与${companion.nameLocalized?.zh}对话...`}
                  onPressEnter={sendMessage}
                  disabled={dialogueHistory.some(msg => msg.isTyping)}
                  className="flex-1"
                />
                <Button 
                  type="primary" 
                  onClick={sendMessage}
                  disabled={!currentDialogue.trim() || dialogueHistory.some(msg => msg.isTyping)}
                  loading={dialogueHistory.some(msg => msg.isTyping)}
                  icon={dialogueHistory.some(msg => msg.isTyping) ? null : <MessageOutlined />}
                >
                  {dialogueHistory.some(msg => msg.isTyping) ? '回复中' : '发送'}
                </Button>
              </div>
              
              {/* 快捷回复建议 */}
              {dialogueHistory.length === 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {['你好！', '今天过得怎么样？', '教我打牌技巧', '聊聊你的爱好'].map((suggestion, idx) => (
                    <Button
                      key={idx}
                      size="small"
                      type="ghost"
                      onClick={() => {
                        setCurrentDialogue(suggestion);
                        setTimeout(sendMessage, 100);
                      }}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TavernInteractionSystem;