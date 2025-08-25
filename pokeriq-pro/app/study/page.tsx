'use client';

import React, { useState, useRef } from 'react';
import AppLayout from '@/src/components/layout/AppLayout';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  ChevronRight,
  Lock,
  Star,
  Clock,
  Award,
  Target,
  Zap,
  Brain,
  TrendingUp,
  Users,
  BookOpen,
  MessageCircle,
  Heart,
  Share2,
  ThumbsUp,
  Eye,
  CheckCircle,
  Circle,
  PlayCircle,
  BarChart3,
  Layers,
  Shield,
  Swords,
  Flag
} from 'lucide-react';

type LessonCategory = 'basics' | 'exploitation' | 'bluffing' | 'squeeze' | 'advanced' | 'mindset';
type Language = 'zh' | 'en';

interface Lesson {
  id: string;
  title: string;
  titleEn: string;
  instructor: string;
  duration: string;
  thumbnail: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  views: string;
  likes: string;
  category: LessonCategory;
  description: string;
  descriptionEn: string;
  scenarios?: Scenario[];
  isPremium?: boolean;
  isNew?: boolean;
  progress?: number;
}

interface Scenario {
  id: string;
  title: string;
  titleEn: string;
  board: string;
  position: string;
  action: string;
  potSize: number;
  stackSize: number;
  explanation: string;
  explanationEn: string;
}

export default function StudyPage() {
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory>('basics');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [language, setLanguage] = useState<Language>('zh');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showScenario, setShowScenario] = useState(false);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 课程分类
  const categories = [
    { 
      id: 'basics', 
      label: '基础概念', 
      labelEn: 'Basics',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'from-blue-500 to-indigo-600'
    },
    { 
      id: 'exploitation', 
      label: '剥削策略', 
      labelEn: 'Exploitation',
      icon: <Target className="w-5 h-5" />,
      color: 'from-orange-500 to-red-600'
    },
    { 
      id: 'bluffing', 
      label: '诈唬技巧', 
      labelEn: 'Bluffing',
      icon: <Shield className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-600'
    },
    { 
      id: 'squeeze', 
      label: '挤压打法', 
      labelEn: 'Squeeze Play',
      icon: <Swords className="w-5 h-5" />,
      color: 'from-green-500 to-emerald-600'
    },
    { 
      id: 'advanced', 
      label: '高级策略', 
      labelEn: 'Advanced',
      icon: <Brain className="w-5 h-5" />,
      color: 'from-indigo-500 to-purple-600'
    },
    { 
      id: 'mindset', 
      label: '心理博弈', 
      labelEn: 'Mindset',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-yellow-500 to-orange-600'
    }
  ];

  // 模拟课程数据 - 基于YouTube扑克教育内容
  const lessons: Lesson[] = [
    // 基础概念
    {
      id: 'basics-1',
      title: 'AK在不同翻牌面的打法',
      titleEn: 'Playing AK on Different Flops',
      instructor: 'Travis教练',
      duration: '15:42',
      thumbnail: '🎯',
      level: 'beginner',
      views: '12.3K',
      likes: '892',
      category: 'basics',
      description: '深入解析AK在A高牌、K高牌、低牌面的不同策略',
      descriptionEn: 'Deep analysis of AK strategy on A-high, K-high, and low boards',
      scenarios: [
        {
          id: 's1',
          title: 'A-2-7彩虹面',
          titleEn: 'A-2-7 Rainbow',
          board: 'A♠ 2♦ 7♣',
          position: 'BTN vs BB',
          action: 'C-bet 33% pot',
          potSize: 100,
          stackSize: 1000,
          explanation: '在这个干燥的A高牌面，我们拿到顶对顶踢脚。GTO策略建议使用33%底池的小尺度下注。这个尺度让我们可以用更宽的范围进行持续下注，包括诈唬牌。对手用中对或更差的牌跟注会很困难。记住：在干燥牌面，小尺度下注就能达到目的。',
          explanationEn: 'On this dry A-high board with TPTK, GTO suggests a 33% pot c-bet. This sizing allows us to bet a wider range including bluffs. Opponent will have difficulty calling with middle pair or worse. Remember: on dry boards, small sizing accomplishes our goals.'
        },
        {
          id: 's2',
          title: 'Q-J-T两色面',
          titleEn: 'Q-J-T Two-tone',
          board: 'Q♥ J♥ T♣',
          position: 'CO vs BTN',
          action: 'Check',
          potSize: 150,
          stackSize: 900,
          explanation: '这是一个极其湿润的牌面，有很多顺子和同花听牌。我们的AK只有A高和卡顺听牌。GTO建议这里高频check，因为按钮位的范围在这个牌面上有优势。如果对手下注，我们可以用卡顺听牌跟注一条街，但要准备在没有改进时放弃。',
          explanationEn: 'This extremely wet board favors BTN range. Our AK has only ace-high and gutshot. GTO suggests high frequency checking. If opponent bets, we can call one street with our gutshot but should be ready to fold unimproved.'
        },
        {
          id: 's3',
          title: 'K-7-3彩虹面',
          titleEn: 'K-7-3 Rainbow',
          board: 'K♣ 7♦ 3♠',
          position: 'UTG vs BB',
          action: 'C-bet 50% pot',
          potSize: 80,
          stackSize: 950,
          explanation: '我们在K高干燥牌面拿到顶对顶踢脚。从UTG开池对抗大盲，GTO建议使用50%底池的中等尺度。这个尺度能很好地平衡价值和保护。大盲会用很多Kx跟注，我们要准备打三条街价值。',
          explanationEn: 'TPTK on dry K-high board from UTG vs BB. GTO suggests 50% pot sizing for good balance between value and protection. BB will call with many Kx hands, so we should be ready to barrel for value.'
        }
      ],
      progress: 75
    },
    {
      id: 'basics-2',
      title: '位置的重要性：BTN vs Blinds',
      titleEn: 'Position Matters: BTN vs Blinds',
      instructor: 'Ronnie大师',
      duration: '22:15',
      thumbnail: '📍',
      level: 'beginner',
      views: '8.7K',
      likes: '654',
      category: 'basics',
      description: '理解按钮位置对抗盲注的巨大优势',
      descriptionEn: 'Understanding the huge advantage of button position vs blinds',
      isNew: true,
      progress: 30
    },

    // 剥削策略
    {
      id: 'exploit-1',
      title: '识别和剥削松凶玩家',
      titleEn: 'Exploiting LAG Players',
      instructor: 'Travis教练',
      duration: '28:33',
      thumbnail: '🎪',
      level: 'intermediate',
      views: '15.2K',
      likes: '1.2K',
      category: 'exploitation',
      description: '如何调整策略来剥削过度激进的对手',
      descriptionEn: 'How to adjust strategy to exploit overly aggressive opponents',
      scenarios: [
        {
          id: 's1',
          title: '对抗3-bet过多的对手',
          titleEn: 'Against Over-3betting Opponent',
          board: '',
          position: 'MP vs BTN',
          action: '4-bet to 2.5x with A5s',
          potSize: 35,
          stackSize: 1000,
          explanation: '对手3-bet频率达到18%（GTO约8-10%）。我们用A5s进行轻4-bet到2.5倍他的3-bet。A5s是完美的4-bet诈唬牌：有阻断牌效应（阻断AA/AK），有可玩性。当他5-bet全下时我们可以轻松弃牌，当他跟注时我们有位置优势。记住：剥削的核心是识别并攻击对手的失衡。',
          explanationEn: 'Opponent 3-bets 18% (GTO ~8-10%). We light 4-bet to 2.5x with A5s. Perfect 4-bet bluff: blockers to AA/AK, playability. Can easily fold to 5-bet jam, have position if called. Remember: exploitation is about identifying and attacking imbalances.'
        },
        {
          id: 's2',
          title: '面对c-bet过多的玩家',
          titleEn: 'Against Over C-betting',
          board: '9♣ 6♦ 2♠',
          position: 'BB vs BTN',
          action: 'Check-raise to 3x',
          potSize: 100,
          stackSize: 900,
          explanation: '对手在按钮位c-bet频率85%（GTO约65%）。在这个干燥牌面，我们可以用很宽的范围check-raise。使用3倍他下注的尺度，包括一些后门听牌如J♣T♣。对手无法防守足够多的牌来对抗我们的激进。这就是剥削的力量。',
          explanationEn: 'Opponent c-bets 85% from BTN (GTO ~65%). On this dry board, we check-raise wide range to 3x. Include backdoor draws like JcTc. Opponent cannot defend enough to combat our aggression. This is the power of exploitation.'
        }
      ]
    },
    {
      id: 'exploit-2',
      title: '剥削紧弱玩家的技巧',
      titleEn: 'Exploiting Tight-Passive Players',
      instructor: 'Ronnie大师',
      duration: '19:45',
      thumbnail: '🐢',
      level: 'intermediate',
      views: '9.8K',
      likes: '743',
      category: 'exploitation',
      description: '通过激进的偷盲和诈唬来剥削被动型玩家',
      descriptionEn: 'Exploit passive players through aggressive stealing and bluffing',
      isPremium: true
    },

    // 诈唬技巧
    {
      id: 'bluff-1',
      title: '河牌超池诈唬的艺术',
      titleEn: 'The Art of River Overbetting',
      instructor: 'Travis教练',
      duration: '35:20',
      thumbnail: '💣',
      level: 'advanced',
      views: '22.1K',
      likes: '2.3K',
      category: 'bluffing',
      description: '何时以及如何执行河牌超池诈唬',
      descriptionEn: 'When and how to execute river overbet bluffs',
      scenarios: [
        {
          id: 's1',
          title: '四张同花面的超池诈唬',
          titleEn: 'Overbet Bluff on 4-flush Board',
          board: 'K♥ 7♥ 2♣ 5♥ Q♥',
          position: 'BTN vs BB',
          action: 'Overbet 2x pot',
          potSize: 200,
          stackSize: 800,
          explanation: '河牌Q♥完成同花。我们用A♣J♣这样没有红心的牌进行2倍底池超池诈唬。GTO分析：我们代表A♥X♥或K♥X♥的坚果同花。对手需要用33%的范围防守，但他的非同花牌很难跟注。关键点：1)我们的故事连贯（翻前3-bet，翻牌c-bet，转牌二次开火）2)阻断牌很重要（A阻断A♥）3)对手的Kx很难跟注这个尺度。',
          explanationEn: 'River Qh completes flush. We overbet 2x pot with AcJc (no hearts). GTO analysis: We rep nut flushes AhXh/KhXh. Opponent needs to defend 33% but non-flushes struggle to call. Key points: 1) Story is coherent 2) Blockers matter (A blocks Ah) 3) Opponent Kx has tough time calling this sizing.'
        },
        {
          id: 's2',
          title: '顺子完成面的诈唬',
          titleEn: 'Bluffing Completed Straights',
          board: 'J♠ T♦ 3♣ 9♠ 8♥',
          position: 'CO vs BTN',
          action: 'Overbet 1.5x pot',
          potSize: 180,
          stackSize: 820,
          explanation: '河牌8♥完成多个顺子。我们用A♠K♠进行1.5倍底池超池。虽然我们有A高，但这里当作纯诈唬。GTO逻辑：我们代表Q7/76的坚果顺子。我们的范围在CO有很多Qx。对手的JT/J9很难跟注因为有更好的顺子。转牌我们下注后，河牌的超池故事很可信。',
          explanationEn: 'River 8h completes multiple straights. We overbet 1.5x with AsKs as pure bluff. GTO logic: We rep nuts Q7/76. Our CO range has many Qx. Opponent JT/J9 struggles vs better straights. After turn barrel, river overbet tells credible story.'
        }
      ],
      isPremium: true
    },
    {
      id: 'bluff-2',
      title: '三连注诈唬线路构建',
      titleEn: 'Triple Barrel Bluffing Lines',
      instructor: 'Ronnie大师',
      duration: '31:10',
      thumbnail: '🔥',
      level: 'advanced',
      views: '18.5K',
      likes: '1.8K',
      category: 'bluffing',
      description: '构建有说服力的三条街诈唬故事',
      descriptionEn: 'Building convincing triple barrel bluffing stories',
      isNew: true,
      isPremium: true
    },

    // 挤压打法
    {
      id: 'squeeze-1',
      title: '小盲位挤压打法精讲',
      titleEn: 'SB Squeeze Play Mastery',
      instructor: 'Travis教练',
      duration: '24:18',
      thumbnail: '✊',
      level: 'intermediate',
      views: '11.3K',
      likes: '956',
      category: 'squeeze',
      description: '从小盲位执行挤压打法的时机和尺度',
      descriptionEn: 'Timing and sizing for squeeze plays from the small blind',
      scenarios: [
        {
          id: 's1',
          title: 'MP开池，BTN跟注',
          titleEn: 'MP Opens, BTN Calls',
          board: '',
          position: 'SB',
          action: '3-bet to 13BB',
          potSize: 7.5,
          stackSize: 100,
          explanation: 'MP开池2.5BB，BTN跟注。我们在SB用A♦T♦挤压到13BB。GTO分析：1)尺度公式=3x开池+1x每个跟注者+1x位置劣势=13BB。2)A♦T♦在挤压范围的底部但可玩性好。3)MP范围被夹在中间，很难继续。4)BTN的跟注范围是capped的（好牌会3-bet）。5)如果只有一人跟注，我们在有利可图的偷池情况。成功率只需要58%就能盈利。',
          explanationEn: 'MP opens 2.5BB, BTN calls. We squeeze to 13BB with AdTd from SB. GTO analysis: 1) Sizing = 3x open + 1x per caller + 1x OOP = 13BB. 2) AdTd bottom of squeeze range but playable. 3) MP squeezed in middle. 4) BTN range is capped. 5) If one calls, we are in profitable steal spot. Only need 58% success rate.'
        },
        {
          id: 's2',
          title: '多人底池挤压',
          titleEn: 'Multiway Squeeze',
          board: '',
          position: 'BB',
          action: '3-bet to 16BB',
          potSize: 9.5,
          stackSize: 100,
          explanation: 'CO开池2.5BB，BTN和SB都跟注。我们在BB用K♠Q♠挤压到16BB。GTO考虑：1)三个对手=更大的死钱。2)尺度16BB让跟注变得昂贵。3)K♠Q♠有很好的阻断牌（阻断KK/QQ/AK/AQ）。4)即使被跟注，我们有一手可以在很多翻牌面继续的牌。5)挤压成功率需求约62%，但死钱让这个打法有利可图。',
          explanationEn: 'CO opens 2.5BB, BTN and SB call. We squeeze to 16BB with KsQs from BB. GTO: 1) 3 opponents = more dead money. 2) 16BB makes calling expensive. 3) KsQs has great blockers. 4) Even if called, playable hand. 5) Need ~62% success but dead money makes it profitable.'
        }
      ]
    },
    {
      id: 'squeeze-2',
      title: '多人底池的挤压策略',
      titleEn: 'Multiway Squeeze Strategy',
      instructor: 'Ronnie大师',
      duration: '26:45',
      thumbnail: '👥',
      level: 'intermediate',
      views: '8.9K',
      likes: '721',
      category: 'squeeze',
      description: '面对多个跟注者时的挤压调整',
      descriptionEn: 'Adjusting squeeze plays against multiple callers'
    },

    // 高级策略
    {
      id: 'advanced-1',
      title: 'GTO vs 剥削：平衡的艺术',
      titleEn: 'GTO vs Exploitation: The Balance',
      instructor: 'Travis教练',
      duration: '42:30',
      thumbnail: '⚖️',
      level: 'advanced',
      views: '25.6K',
      likes: '3.1K',
      category: 'advanced',
      description: '理解何时使用GTO策略，何时偏离进行剥削',
      descriptionEn: 'Understanding when to use GTO and when to deviate for exploitation',
      isPremium: true
    },
    {
      id: 'advanced-2',
      title: '深筹码的复杂决策树',
      titleEn: 'Deep Stack Decision Trees',
      instructor: 'Ronnie大师',
      duration: '38:22',
      thumbnail: '🌳',
      level: 'advanced',
      views: '19.8K',
      likes: '2.4K',
      category: 'advanced',
      description: '200BB+深筹码的高级打法',
      descriptionEn: 'Advanced play with 200BB+ deep stacks',
      isPremium: true,
      isNew: true
    },

    // 心理博弈
    {
      id: 'mindset-1',
      title: '倾斜控制与情绪管理',
      titleEn: 'Tilt Control & Emotional Management',
      instructor: 'Travis教练',
      duration: '20:15',
      thumbnail: '🧘',
      level: 'beginner',
      views: '14.2K',
      likes: '1.5K',
      category: 'mindset',
      description: '保持最佳心理状态的技巧',
      descriptionEn: 'Techniques for maintaining optimal mental state'
    },
    {
      id: 'mindset-2',
      title: '读牌与反读牌的心理战',
      titleEn: 'Hand Reading Psychology',
      instructor: 'Ronnie大师',
      duration: '29:40',
      thumbnail: '🎭',
      level: 'intermediate',
      views: '16.7K',
      likes: '1.9K',
      category: 'mindset',
      description: '通过行为模式和时间告诉读取对手',
      descriptionEn: 'Reading opponents through patterns and timing tells'
    }
  ];

  // 获取当前分类的课程
  const filteredLessons = lessons.filter(lesson => lesson.category === selectedCategory);
  
  // 获取当前场景
  const currentScenario = selectedLesson?.scenarios?.[currentScenarioIndex];

  // TTS语音朗读 - 增强版本
  const handleTTS = (text: string, isAutoPlay: boolean = false) => {
    if ('speechSynthesis' in window) {
      // 停止之前的朗读
      window.speechSynthesis.cancel();
      
      if (!isMuted) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'zh' ? 'zh-CN' : 'en-US';
        utterance.rate = language === 'zh' ? 1.0 : 0.95; // 中文稍快
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // 添加语音情感和停顿
        const processedText = text
          .replace(/GTO/g, 'G T O') // 拼读缩写
          .replace(/([。！？])/g, '$1,,,') // 在句号后添加停顿
          .replace(/(\d+)BB/g, '$1 大盲注') // 转换术语
          .replace(/(\d+)%/g, '$1 个百分点'); // 转换百分比
        
        utterance.text = processedText;
        
        utterance.onstart = () => {
          console.log('开始语音播放');
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
          // 如果是自动播放模式，播放下一个场景
          if (isAutoPlay && currentScenarioIndex < (selectedLesson?.scenarios?.length || 0) - 1) {
            setTimeout(() => {
              setCurrentScenarioIndex(prev => prev + 1);
            }, 1500);
          }
        };
        
        utterance.onerror = (event) => {
          console.error('TTS错误:', event);
          setIsPlaying(false);
        };
        
        ttsRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    } else {
      console.warn('您的浏览器不支持语音合成功能');
    }
  };

  // 停止TTS
  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // 切换播放状态
  const togglePlay = () => {
    if (isPlaying) {
      stopTTS();
    } else if (currentScenario) {
      // 构建完整的教学文本
      const introText = language === 'zh' 
        ? `现在让我们学习${currentScenario.title}。位置是${currentScenario.position}，底池${currentScenario.potSize}个大盲注。`
        : `Let's learn about ${currentScenario.titleEn}. Position is ${currentScenario.position}, pot size ${currentScenario.potSize} big blinds.`;
      
      const fullText = `${introText} ${language === 'zh' ? currentScenario.explanation : currentScenario.explanationEn}`;
      handleTTS(fullText);
    }
  };

  // 自动播放所有场景
  const playAllScenarios = () => {
    if (selectedLesson?.scenarios && selectedLesson.scenarios.length > 0) {
      setCurrentScenarioIndex(0);
      setShowScenario(true);
      setTimeout(() => {
        const scenario = selectedLesson.scenarios![0];
        const text = language === 'zh' ? scenario.explanation : scenario.explanationEn;
        handleTTS(text, true);
      }, 500);
    }
  };

  // 渲染扑克牌
  const renderCard = (card: string) => {
    const isRed = card.includes('♥') || card.includes('♦');
    return (
      <span className={`inline-block px-2 py-1 mx-0.5 rounded ${
        isRed ? 'bg-red-100 text-red-600' : 'bg-gray-800 text-white'
      } font-bold text-lg`}>
        {card}
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen max-w-full">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {language === 'zh' ? '扑克学院' : 'Poker Academy'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' 
                  ? '向顶级教练学习专业策略，掌握各种场景打法' 
                  : 'Learn professional strategies from top coaches'}
              </p>
            </div>
            
            {/* 语言切换 */}
            <button
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {language === 'zh' ? 'EN' : '中文'}
            </button>
          </div>

          {/* 学习进度统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <PlayCircle className="w-8 h-8" />
                <span className="text-2xl font-bold">24</span>
              </div>
              <p className="text-sm opacity-90">{language === 'zh' ? '已学习课程' : 'Lessons Completed'}</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8" />
                <span className="text-2xl font-bold">18.5h</span>
              </div>
              <p className="text-sm opacity-90">{language === 'zh' ? '学习时长' : 'Study Time'}</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8" />
                <span className="text-2xl font-bold">89%</span>
              </div>
              <p className="text-sm opacity-90">{language === 'zh' ? '平均得分' : 'Average Score'}</p>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8" />
                <span className="text-2xl font-bold">7</span>
              </div>
              <p className="text-sm opacity-90">{language === 'zh' ? '连续学习天数' : 'Study Streak'}</p>
            </div>
          </div>

          {/* 分类选择 */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as LessonCategory)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all
                  ${selectedCategory === cat.id 
                    ? 'bg-gradient-to-r ' + cat.color + ' text-white shadow-lg transform scale-105' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                {cat.icon}
                <span className="font-medium">{language === 'zh' ? cat.label : cat.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 课程列表 */}
        {!selectedLesson ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedLesson(lesson)}
              >
                {/* 缩略图 */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <span className="text-6xl">{lesson.thumbnail}</span>
                  
                  {/* 标签 */}
                  <div className="absolute top-3 left-3 flex space-x-2">
                    {lesson.isNew && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                        NEW
                      </span>
                    )}
                    {lesson.isPremium && (
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
                        PRO
                      </span>
                    )}
                  </div>
                  
                  {/* 时长 */}
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                    {lesson.duration}
                  </div>
                  
                  {/* 进度条 */}
                  {lesson.progress && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-600">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${lesson.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {language === 'zh' ? lesson.title : lesson.titleEn}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {language === 'zh' ? lesson.description : lesson.descriptionEn}
                  </p>
                  
                  {/* 讲师信息 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{lesson.instructor}</span>
                    </div>
                    <span className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${lesson.level === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        lesson.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}
                    `}>
                      {lesson.level === 'beginner' ? (language === 'zh' ? '初级' : 'Beginner') :
                       lesson.level === 'intermediate' ? (language === 'zh' ? '中级' : 'Intermediate') :
                       language === 'zh' ? '高级' : 'Advanced'}
                    </span>
                  </div>
                  
                  {/* 统计信息 */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{lesson.views}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{lesson.likes}</span>
                      </span>
                    </div>
                    {lesson.isPremium ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 课程详情页 */
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            {/* 返回按钮 */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setSelectedLesson(null);
                  setShowScenario(false);
                  setCurrentScenarioIndex(0);
                  stopTTS();
                }}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
                <span>{language === 'zh' ? '返回课程列表' : 'Back to Lessons'}</span>
              </button>
            </div>

            {/* 课程标题 */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {language === 'zh' ? selectedLesson.title : selectedLesson.titleEn}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {language === 'zh' ? selectedLesson.description : selectedLesson.descriptionEn}
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedLesson.instructor}</p>
                        <p className="text-sm text-gray-500">{language === 'zh' ? '专业教练' : 'Pro Coach'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{selectedLesson.duration}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{selectedLesson.views}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{selectedLesson.likes}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex items-center space-x-2">
                  <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 场景训练 */}
            {selectedLesson.scenarios && selectedLesson.scenarios.length > 0 && (
              <div className="p-6">
                {!showScenario ? (
                  /* 场景列表 */
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {language === 'zh' ? '场景训练' : 'Scenario Training'}
                    </h3>
                    <div className="space-y-3">
                      {selectedLesson.scenarios.map((scenario, index) => (
                        <button
                          key={scenario.id}
                          onClick={() => {
                            setCurrentScenarioIndex(index);
                            setShowScenario(true);
                          }}
                          className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {language === 'zh' ? scenario.title : scenario.titleEn}
                                </p>
                                <p className="text-sm text-gray-500">{scenario.position}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* 场景详情 */
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {language === 'zh' ? currentScenario?.title : currentScenario?.titleEn}
                      </h3>
                      <button
                        onClick={() => setShowScenario(false)}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        {language === 'zh' ? '返回场景列表' : 'Back to Scenarios'}
                      </button>
                    </div>

                    {/* 牌面展示 */}
                    {currentScenario?.board && (
                      <div className="mb-6 p-6 bg-gradient-to-br from-green-800 to-green-900 rounded-xl">
                        <p className="text-white text-sm mb-2">{language === 'zh' ? '公共牌' : 'Board'}</p>
                        <div className="flex items-center space-x-1">
                          {currentScenario.board.split(' ').map((card, i) => (
                            <div key={i} className="bg-white rounded px-3 py-2 font-bold text-lg">
                              {renderCard(card)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 场景信息 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">{language === 'zh' ? '位置' : 'Position'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{currentScenario?.position}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">{language === 'zh' ? '底池' : 'Pot'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{currentScenario?.potSize} BB</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">{language === 'zh' ? '筹码' : 'Stack'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{currentScenario?.stackSize} BB</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">{language === 'zh' ? '行动' : 'Action'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{currentScenario?.action}</p>
                      </div>
                    </div>

                    {/* 解释说明 */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {language === 'zh' ? '策略解析' : 'Strategy Explanation'}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={togglePlay}
                            className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {language === 'zh' ? currentScenario?.explanation : currentScenario?.explanationEn}
                      </p>
                    </div>

                    {/* 场景导航 */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentScenarioIndex(Math.max(0, currentScenarioIndex - 1))}
                        disabled={currentScenarioIndex === 0}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {language === 'zh' ? '上一个' : 'Previous'}
                      </button>
                      
                      <div className="flex space-x-2">
                        {selectedLesson.scenarios.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentScenarioIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentScenarioIndex 
                                ? 'w-8 bg-blue-500' 
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentScenarioIndex(Math.min(selectedLesson.scenarios.length - 1, currentScenarioIndex + 1))}
                        disabled={currentScenarioIndex === selectedLesson.scenarios.length - 1}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {language === 'zh' ? '下一个' : 'Next'}
                      </button>
                    </div>

                    {/* 练习按钮和自动播放 */}
                    <div className="mt-6 flex flex-col items-center space-y-3">
                      <button 
                        onClick={playAllScenarios}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors"
                      >
                        {language === 'zh' ? '🔊 自动播放所有场景' : '🔊 Auto-play All Scenarios'}
                      </button>
                      <button 
                        onClick={() => window.location.href = '/ai-training'}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors"
                      >
                        {language === 'zh' ? '开始实战练习' : 'Start Practice'} →
                      </button>
                      <p className="text-sm text-gray-500">
                        {language === 'zh' 
                          ? 'GTO分析提示：记住这些关键概念，在实战中应用'
                          : 'GTO Tip: Remember these key concepts and apply in practice'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 推荐课程 */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'zh' ? '推荐课程' : 'Recommended Lessons'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lessons.slice(0, 3).map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setShowScenario(false);
                      setCurrentScenarioIndex(0);
                    }}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{lesson.thumbnail}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {language === 'zh' ? lesson.title : lesson.titleEn}
                        </p>
                        <p className="text-xs text-gray-500">{lesson.instructor}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{lesson.duration}</span>
                      <span>{lesson.views} views</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}